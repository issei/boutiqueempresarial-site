// Cartão "Próximo passo" da obrigada.html: troca o event_id do lead pelo link pessoal
// de agendamento e já monta o seletor de horários no cartão (js/agendador.js, o mesmo de
// /agendar), sem botão intermediário. docs/specs/design/obrigada-agendamento.md.
// A conversão (Pixel Lead, GA4 generate_lead) não passa por aqui: se a API cair, o
// lead vê a obrigada de sempre. O toggle do CRM comanda a jornada: agendamento desligado
// (409 agendamento_desligado), ou qualquer falha, = obrigada antiga, sem cartão (docs/specs/
// design/obrigada-agendamento.md §4). A frase "enviamos por e-mail" só vem com envio_email.
// O token só existe em memória (passado ao agendador); nunca em console, dataLayer, storage
// ou URL desta página. A troca é idempotente no CRM, então recarregar a página repete a chamada.

const API_BASE = 'https://api.boutiqueempresarial.com.br/public/agendamento';
const TOKEN_RE = /^[A-Za-z0-9_.-]{20,200}$/; // mesmo formato de agendar.js (opaco)
const EID_RE = /^[A-Za-z0-9_-]{1,100}$/;
const TENTATIVAS = 6;
const ESPERA_MS = 2000;
const TIMEOUT_MS = 10000;

const secao = document.getElementById('agendamento');
const eid = window.leadEid; // definido pelo script inline do Pixel, que roda antes do módulo

const $ = (id) => document.getElementById(id);

// O módulo do seletor só baixa quando há token: quem cai na obrigada de sempre não paga por ele.
const mostrarPronto = async (token, envioEmail) => {
  const { iniciarAgendador } = await import('./agendador.js');
  secao.querySelector('[data-estado="preparando"]').hidden = true;
  $('agendador').hidden = false;
  $('ag-email').hidden = !envioEmail;
  $('nota-email').hidden = !envioEmail;
  $('nota-cartao').hidden = false;
  iniciarAgendador({ alvo: $('agendador'), token, embutido: true });
};

// Obrigada de sempre: sem cartão e com a nota antiga.
const mostrarLegado = () => {
  secao.hidden = true;
  $('nota-cartao').hidden = true;
  $('nota-legado').hidden = false;
};

// Perfil indefinido (Spec 023 do CRM): sem seletor, a equipe analisa e entra em contato.
const mostrarAnalise = (envioEmail) => {
  secao.hidden = true;
  $('nota-cartao').hidden = true;
  $('nota-legado').hidden = true;
  $('nota-analise-email').hidden = !envioEmail;
  $('nota-analise').hidden = false;
};

// → { token, envioEmail } | { emAnalise, envioEmail } | { repetir: true } | {} (qualquer outra coisa: obrigada antiga)
const trocar = async () => {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(`${API_BASE}/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify({ event_id: eid }),
      signal: ctl.signal,
    });
    if (r.status === 202) return { repetir: true };
    if (r.status !== 200) return {};
    const { token, em_analise: emAnalise, envio_email: envioEmail } = await r.json();
    if (TOKEN_RE.test(token)) return { token, envioEmail: envioEmail === true };
    return emAnalise === true ? { emAnalise: true, envioEmail: envioEmail === true } : {};
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
};

const iniciar = async () => {
  secao.hidden = false;
  $('nota-legado').hidden = true;
  for (let i = 0; i < TENTATIVAS; i++) {
    const { token, envioEmail, emAnalise, repetir } = await trocar();
    if (emAnalise) return mostrarAnalise(envioEmail);
    if (token) {
      try { return await mostrarPronto(token, envioEmail); } catch { break; } // módulo não carregou: obrigada de sempre
    }
    if (!repetir) break;
    await new Promise((ok) => setTimeout(ok, ESPERA_MS));
  }
  mostrarLegado();
};

// Sem eid (acesso direto, crawl, valor estranho na URL): sem cartão e sem requisição.
if (secao && typeof eid === 'string' && EID_RE.test(eid)) iniciar();
