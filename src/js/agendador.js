/**
 * Seletor de horário do Diagnóstico Operacional — docs/specs/pages/agendar.md.
 * Compartilhado por /agendar (página inteira) e pela obrigada (embutido no cartão).
 * Apresentação e transporte: nenhuma regra de disponibilidade mora aqui.
 * O token do link só sai daqui no corpo JSON das chamadas à API; nunca em URL,
 * cabeçalho, console nem atributo do DOM.
 */
import marcacao from '../partials/agendador.html?raw';

const API_BASE = 'https://api.boutiqueempresarial.com.br/public/agendamento';
const TIMEOUT_MS = 10000;
const TOKEN_KEY = 'be_agendar_t';
const TOKEN_RE = /^[A-Za-z0-9_.-]{20,200}$/;
const FUSO_ROTULO = 'horário de Brasília';

const $ = (id) => document.getElementById(id);

// ── Mensagens (proposta de copy, a revisar pela autora) ────────────────────
const TEXTO = {
  linkInvalido: 'Este link não é válido.',
  expirado: 'Este link expirou. Fale com a gente e enviamos um novo.',
  naoAgendavel: 'Nossa equipe já está em contato com você. Se precisar mudar algo, fale com a gente.',
  foraDoPrazo: 'Faltando pouco para a conversa, alterações são feitas com a nossa equipe.',
  semHorarios: 'No momento não há horários disponíveis. Fale com a gente e encontramos um horário.',
  indisponivelHorario: 'Esse horário acabou de ser reservado. Escolha outro.',
  invalido: 'Não foi possível confirmar. Escolha o horário de novo.',
  muitas: 'Muitas tentativas. Aguarde um instante e tente de novo.',
  fora: 'Não conseguimos carregar os horários agora. Tente de novo em alguns minutos.',
  conflito: 'Outra operação está em andamento. Tente de novo em instantes.',
  cancelado: 'Agendamento cancelado. Se quiser, escolha outro horário.',
  escolhaVazia: 'Escolha um dia e um horário',
  semHorarioTitulo: 'Combinado, vamos encontrar outro horário',
  semHorarioBotao: 'Nenhum horário funciona para mim',
  // Com e-mail enviado (email_enviado = true) e sem ele (envio desligado ou falha do SES):
  // a página só promete o e-mail quando o CRM diz que ele saiu.
  semHorarioEmail: 'Enviamos para o seu e-mail um link para você agendar mais tarde, quando abrirem novos horários.',
  semHorarioContatoComEmail: 'A Talita também vai entrar em contato com você para combinar um horário que caiba na sua agenda.',
  semHorarioContatoSemEmail: 'A Talita vai entrar em contato com você para combinar um horário que caiba na sua agenda.',
};

// Erros terminais: mensagem + ação (contato alternativo ou nova tentativa).
const ERRO_TERMINAL = {
  link_invalido: { msg: TEXTO.linkInvalido, contato: true },
  expirado: { msg: TEXTO.expirado, contato: true },
  nao_agendavel: { msg: TEXTO.naoAgendavel, contato: true },
  fora_do_prazo: { msg: TEXTO.foraDoPrazo, contato: true },
  sem_horarios: { msg: TEXTO.semHorarios, contato: true },
  conflito: { msg: TEXTO.conflito, retry: true },
  muitas: { msg: TEXTO.muitas, retry: true },
  fora: { msg: TEXTO.fora, retry: true },
};

// ── Estado ─────────────────────────────────────────────────────────────────
const estado = {
  dados: null, // última resposta de slots
  atual: null, // agendamento confirmado {inicio, fim, meet_url, pode_alterar}
  modo: 'reservar', // 'reservar' | 'remarcar'
  dia: null,
  hora: null,
  ocupado: false,
};
let tentativa = null; // {sig, chave}: Idempotency-Key da ação em curso
let repetir = null; // função do botão "Tentar novamente"
// Contexto da montagem (iniciarAgendador): onde o markup mora, o token em memória e
// se o seletor está embutido na obrigada (sem roubar o foco antes de o visitante agir).
let host = null;
let tokenDado = null;
let semFoco = false;

// ── Token ──────────────────────────────────────────────────────────────────
function lerToken() {
  if (tokenDado) return TOKEN_RE.test(tokenDado) ? tokenDado : null; // embutido: só em memória
  let t = null;
  try { t = sessionStorage.getItem(TOKEN_KEY); } catch (e) { /* bloqueada */ }
  if (!t) t = window.__be_agendar_t || null;
  return t && TOKEN_RE.test(t) ? t : null;
}

// ── Datas: sempre no fuso devolvido pela API, não no do aparelho ───────────
const fmt = (fuso, opts) => new Intl.DateTimeFormat('pt-BR', { timeZone: fuso, ...opts });

function diaExtenso(iso, fuso) { // 06/10, terça-feira
  const p = Object.fromEntries(
    fmt(fuso, { weekday: 'long', day: '2-digit', month: '2-digit' })
      .formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  );
  return `${p.day}/${p.month}, ${p.weekday}`;
}

function horaCurta(iso, fuso) { // 14h ou 14h30
  const p = Object.fromEntries(
    fmt(fuso, { hour: 'numeric', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  );
  const h = Number(p.hour); // Firefox devolve "09" com hourCycle h23
  return p.minute === '00' ? `${h}h` : `${h}h${p.minute}`;
}

function horaRelogio(iso, fuso) { // 09:00
  return fmt(fuso, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
}

const quando = (iso, fuso) => `${diaExtenso(iso, fuso)}, às ${horaCurta(iso, fuso)} (${FUSO_ROTULO})`;

// ── Rede ───────────────────────────────────────────────────────────────────
async function chamar(rota, corpo, chave) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (chave) headers['Idempotency-Key'] = chave;
    const r = await fetch(`${API_BASE}/${rota}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(corpo),
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: ctl.signal,
    });
    let data = null;
    try { data = await r.json(); } catch (e) { /* corpo vazio ou inválido */ }
    return { status: r.status, data };
  } catch (e) {
    return { status: 0, data: null }; // rede fora do ar ou tempo esgotado
  } finally {
    clearTimeout(timer);
  }
}

// Traduz a resposta de erro do CRM ({error:{code}}) em uma chave de ERRO_TERMINAL.
function classificar({ status, data }) {
  const code = data?.error?.code;
  if (status === 404 || code === 'nao_encontrado') return 'link_invalido';
  if (status === 410 || code === 'link_expirado') return 'expirado';
  if (code === 'lead_nao_agendavel') return 'nao_agendavel';
  if (code === 'fora_do_prazo') return 'fora_do_prazo';
  if (code === 'conflito') return 'conflito';
  if (status === 429 || code === 'muitas_tentativas') return 'muitas';
  return 'fora'; // 503, 500, timeout, rede, resposta inesperada
}

// ── Telas ──────────────────────────────────────────────────────────────────
const TELAS = ['carregando', 'escolha', 'confirmado', 'sem-horario', 'erro'];

function mostrar(tela, titulo) {
  for (const t of TELAS) $(`est-${t}`).hidden = t !== tela;
  host.setAttribute('aria-busy', String(tela === 'carregando'));
  const h = document.querySelector('[data-ag-titulo]');
  const anuncio = document.querySelector('[data-ag-anuncio]');
  h.textContent = titulo;
  anuncio.textContent = '';
  requestAnimationFrame(() => { anuncio.textContent = titulo; });
  if (!semFoco) h.focus({ preventScroll: false });
}

function mostrarErro(chave, retry) {
  const e = ERRO_TERMINAL[chave];
  repetir = retry || null;
  $('erro-msg').textContent = e.msg;
  $('erro-contato').hidden = !e.contato;
  $('erro-retry').hidden = !(e.retry && retry);
  mostrar('erro', 'Não foi possível continuar');
}

function texto(id, valor) { $(id).textContent = valor; }

function opcao(nome, valor, rotulo, marcado, aoMarcar) {
  const label = document.createElement('label');
  label.className = 'ag-opcao';
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = nome;
  input.value = valor;
  input.checked = marcado;
  input.addEventListener('change', () => aoMarcar(valor));
  const span = document.createElement('span');
  span.textContent = rotulo;
  label.append(input, span);
  return label;
}

/** Confirmar só vale com dia e horário; "Nenhum horário funciona" só aparece enquanto não vale. */
function sincronizarBotoes() {
  const completo = Boolean(estado.dia && estado.hora);
  const confirmar = $('confirmar');
  confirmar.disabled = !completo;
  confirmar.setAttribute('aria-disabled', String(!completo || estado.ocupado));
  $('sem-horario').hidden = completo || estado.modo === 'remarcar';
}

function desenharHorarios() {
  const dia = estado.dados.dias.find((d) => d.data === estado.dia);
  $('bloco-horarios').hidden = !dia;
  const host = $('horarios');
  host.replaceChildren();
  if (!dia) return;
  const { fuso } = estado.dados;
  for (const iso of dia.horarios) {
    host.append(opcao('horario', iso, horaRelogio(iso, fuso), iso === estado.hora, (v) => {
      estado.hora = v;
      texto('apoio', '');
      sincronizarBotoes();
    }));
  }
}

function desenharEscolha({ aviso = '', alerta = '' } = {}) {
  const { dados } = estado;
  const remarcando = estado.modo === 'remarcar';
  // Mantém o dia escolhido se ele ainda existe na resposta atual.
  if (!dados.dias.some((d) => d.data === estado.dia)) { estado.dia = null; estado.hora = null; }
  if (estado.dia && !dados.dias.find((d) => d.data === estado.dia).horarios.includes(estado.hora)) estado.hora = null;

  $('aviso').hidden = !aviso;
  texto('aviso', aviso);
  $('alerta').hidden = !alerta;
  texto('alerta', alerta);
  $('atual').hidden = !remarcando;
  if (remarcando) texto('atual', `Horário atual: ${quando(estado.atual.inicio, dados.fuso)}.`);
  $('manter').hidden = !remarcando;
  $('confirmar').textContent = remarcando ? 'Confirmar novo horário' : 'Confirmar horário';
  texto('subtitulo',
    `${dados.primeiro_nome}, a conversa dura ${dados.duracao_min} minutos e acontece por Google Meet. O convite chega ao seu e-mail.`);
  texto('apoio', '');

  const host = $('dias');
  host.replaceChildren();
  for (const d of dados.dias) {
    host.append(opcao('dia', d.data, diaExtenso(d.horarios[0], dados.fuso), d.data === estado.dia, (v) => {
      estado.dia = v;
      estado.hora = null;
      texto('apoio', '');
      desenharHorarios();
      sincronizarBotoes();
    }));
  }
  desenharHorarios();
  sincronizarBotoes();
  mostrar('escolha', remarcando ? 'Escolha o novo horário' : 'Escolha o melhor horário para o seu Diagnóstico Operacional');
}

function meetSeguro(url) {
  try { return new URL(url).protocol === 'https:' ? url : null; } catch (e) { return null; }
}

function desenharSemHorario(emailEnviado) {
  $('sh-email').hidden = !emailEnviado;
  texto('sh-email', emailEnviado ? TEXTO.semHorarioEmail : '');
  texto('sh-contato', emailEnviado ? TEXTO.semHorarioContatoComEmail : TEXTO.semHorarioContatoSemEmail);
  mostrar('sem-horario', TEXTO.semHorarioTitulo);
}

function desenharConfirmado() {
  const { atual } = estado;
  const fuso = estado.dados?.fuso || 'America/Sao_Paulo';
  texto('conf-texto', `Diagnóstico agendado para ${quando(atual.inicio, fuso)}`);
  const meet = atual.meet_url && meetSeguro(atual.meet_url);
  $('conf-meet').hidden = !meet;
  if (meet) $('conf-meet').href = meet;
  $('conf-meet-bloco').hidden = !meet;
  $('conf-sem-meet').hidden = !!meet;
  $('conf-acoes').hidden = !atual.pode_alterar;
  $('conf-contato').hidden = !!atual.pode_alterar;
  $('cancelar-conf').hidden = true;
  mostrar('confirmado', 'Diagnóstico agendado');
}

// ── Fluxos ─────────────────────────────────────────────────────────────────
function slotsValido(d) {
  return d && typeof d.primeiro_nome === 'string' && Number.isInteger(d.duracao_min)
    && typeof d.fuso === 'string' && Array.isArray(d.dias)
    && d.dias.every((x) => x && Array.isArray(x.horarios) && x.horarios.length > 0);
}

/** Busca slots e decide a tela. `remarcar`: quem tem agendamento quer trocar o horário. */
async function carregar({ remarcar = false, aviso = '', alerta = '' } = {}) {
  mostrar('carregando', 'Carregando os horários');
  const token = lerToken();
  if (!token) return mostrarErro('link_invalido');

  const res = await chamar('slots', { token });
  if (res.status === 422) return mostrarErro('link_invalido');
  if (res.status !== 200 || !slotsValido(res.data)) {
    return mostrarErro(res.status === 200 ? 'fora' : classificar(res), () => carregar({ remarcar, aviso, alerta }));
  }
  estado.dados = res.data;
  estado.atual = res.data.agendamento_atual;

  if (estado.atual && !(remarcar && estado.atual.pode_alterar)) return desenharConfirmado();
  if (res.data.dias.length === 0) return mostrarErro('sem_horarios');
  estado.modo = estado.atual ? 'remarcar' : 'reservar';
  desenharEscolha({ aviso, alerta });
}

function botaoOcupado(btn, ocupado, textoOcupado, textoNormal) {
  estado.ocupado = ocupado;
  btn.textContent = ocupado ? textoOcupado : textoNormal;
  // Confirmar também depende da seleção (disabled); os demais só do envio em curso.
  if (btn.id === 'confirmar') sincronizarBotoes();
  else btn.setAttribute('aria-disabled', String(ocupado));
}

/** Reservar, remarcar ou cancelar. A mesma ação repetida reaproveita a Idempotency-Key. */
async function executar(acao, inicio) {
  const token = lerToken();
  if (!token) return mostrarErro('link_invalido');
  const sig = `${acao}|${inicio || ''}`;
  if (tentativa?.sig !== sig) tentativa = { sig, chave: crypto.randomUUID() };
  const corpo = inicio ? { token, inicio } : { token };

  const res = await chamar(acao, corpo, tentativa.chave);
  const sucesso = res.status === 200 || res.status === 201;
  // Resposta definitiva do CRM (exceto 429): a próxima tentativa é uma ação nova.
  if (sucesso || (res.status > 0 && res.status < 500 && res.status !== 429)) tentativa = null;

  if (sucesso) {
    if (acao === 'sem-horario') return desenharSemHorario(res.data?.email_enviado === true);
    if (acao === 'cancelar') {
      estado.dia = null; estado.hora = null;
      return carregar({ aviso: TEXTO.cancelado });
    }
    estado.atual = { ...res.data, pode_alterar: true };
    return desenharConfirmado();
  }

  if (acao === 'sem-horario') return mostrarErro(classificar(res), () => executar('sem-horario'));

  const code = res.data?.error?.code;
  if (code === 'horario_indisponivel') {
    return carregar({ remarcar: estado.modo === 'remarcar', alerta: TEXTO.indisponivelHorario });
  }
  if (res.status === 422) {
    return carregar({ remarcar: estado.modo === 'remarcar', alerta: TEXTO.invalido });
  }
  return mostrarErro(classificar(res), () => executar(acao, inicio));
}

async function confirmar() {
  if (estado.ocupado) return;
  if (!estado.hora) { texto('apoio', TEXTO.escolhaVazia); return; }
  const btn = $('confirmar');
  const normal = btn.textContent;
  botaoOcupado(btn, true, 'Confirmando...', normal);
  try {
    await executar(estado.modo === 'remarcar' ? 'remarcar' : 'reservar', estado.hora);
  } finally {
    botaoOcupado(btn, false, '', normal);
  }
}

async function semHorario() {
  if (estado.ocupado) return;
  const btn = $('sem-horario');
  botaoOcupado(btn, true, 'Enviando...', TEXTO.semHorarioBotao);
  try {
    await executar('sem-horario');
  } finally {
    botaoOcupado(btn, false, '', TEXTO.semHorarioBotao);
  }
}

async function cancelar() {
  if (estado.ocupado) return;
  const btn = $('cancelar-sim');
  botaoOcupado(btn, true, 'Cancelando...', 'Sim, cancelar');
  try {
    await executar('cancelar');
  } finally {
    botaoOcupado(btn, false, '', 'Sim, cancelar');
  }
}

/**
 * Monta o seletor em `alvo` e carrega os horários. A página precisa ter um
 * [data-ag-titulo] (foco e título de cada estado) e um [data-ag-anuncio] (região aria-live).
 * `token`: link pessoal já em mãos (obrigada); sem ele, vem do fragmento capturado no <head>
 * de agendar.html. `embutido`: o foco só se move depois do primeiro gesto do visitante.
 */
export function iniciarAgendador({ alvo, token = null, embutido = false }) {
  host = alvo;
  tokenDado = token;
  semFoco = embutido;
  host.innerHTML = marcacao;
  if (embutido) {
    const agiu = () => { semFoco = false; };
    host.addEventListener('click', agiu, { once: true, capture: true });
    host.addEventListener('change', agiu, { once: true, capture: true });
  }
  $('confirmar').addEventListener('click', confirmar);
  $('sem-horario').addEventListener('click', semHorario);
  $('sem-horario-voltar').addEventListener('click', () => {
    estado.dia = null;
    estado.hora = null;
    carregar();
  });
  $('manter').addEventListener('click', desenharConfirmado);
  $('remarcar').addEventListener('click', () => carregar({ remarcar: true }));
  $('cancelar').addEventListener('click', () => {
    $('cancelar-conf').hidden = false;
    $('cancelar-pergunta').focus();
  });
  $('cancelar-nao').addEventListener('click', () => {
    $('cancelar-conf').hidden = true;
    $('cancelar').focus();
  });
  $('cancelar-sim').addEventListener('click', cancelar);
  $('erro-retry').addEventListener('click', () => repetir?.());
  carregar();
}

