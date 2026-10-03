// Cartão "Próximo passo" da obrigada.html: troca o event_id do lead pelo link
// pessoal de agendamento. docs/specs/design/obrigada-agendamento.md.
// A conversão (Pixel Lead, GA4 generate_lead) não passa por aqui: se a API cair, o
// lead vê a obrigada de sempre. O toggle do CRM comanda a jornada: agendamento desligado
// (409 agendamento_desligado), ou qualquer falha, = obrigada antiga, sem cartão (docs/specs/
// design/obrigada-agendamento.md §4). A frase "enviamos por e-mail" só vem com envio_email.
// O token só existe no href do botão; nunca em console, dataLayer, storage ou URL desta
// página. A troca é idempotente no CRM, então recarregar a página repete a chamada.

const API_BASE = 'https://api.boutiqueempresarial.com.br/public/agendamento';
const TOKEN_RE = /^[A-Za-z0-9_.-]{20,200}$/; // mesmo formato de agendar.js (opaco)
const EID_RE = /^[A-Za-z0-9_-]{1,100}$/;
const TENTATIVAS = 6;
const ESPERA_MS = 2000;
const TIMEOUT_MS = 10000;

const secao = document.getElementById('agendamento');
const eid = window.leadEid; // definido pelo script inline do Pixel, que roda antes do módulo

const $ = (id) => document.getElementById(id);

const mostrarPronto = (token, envioEmail) => {
  secao.querySelectorAll('[data-estado]').forEach((el) => { el.hidden = el.dataset.estado !== 'pronto'; });
  $('ag-link').href = `/agendar.html#t=${token}`;
  $('ag-email').hidden = !envioEmail;
  $('nota-email').hidden = !envioEmail;
  $('nota-cartao').hidden = false;
  $('ag-corpo').setAttribute('aria-busy', 'false');
};

// Obrigada de sempre: sem cartão e com a nota antiga.
const mostrarLegado = () => {
  secao.hidden = true;
  $('nota-cartao').hidden = true;
  $('nota-legado').hidden = false;
};

// → { token, envioEmail } | { repetir: true } | {} (qualquer outra coisa: obrigada antiga)
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
    const { token, envio_email: envioEmail } = await r.json();
    return TOKEN_RE.test(token) ? { token, envioEmail: envioEmail === true } : {};
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
    const { token, envioEmail, repetir } = await trocar();
    if (token) return mostrarPronto(token, envioEmail);
    if (!repetir) break;
    await new Promise((ok) => setTimeout(ok, ESPERA_MS));
  }
  mostrarLegado();
};

// Sem eid (acesso direto, crawl, valor estranho na URL): sem cartão e sem requisição.
if (secao && typeof eid === 'string' && EID_RE.test(eid)) iniciar();
