// Cartão "Próximo passo" da obrigada.html: troca o event_id do lead pelo link
// pessoal de agendamento. docs/specs/design/obrigada-agendamento.md.
// A conversão (Pixel Lead, GA4 generate_lead) não passa por aqui: se a API cair,
// o lead só vê o aviso de que o link foi por e-mail.
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

const mostrar = (estado, token) => {
  secao.querySelectorAll('[data-estado]').forEach((el) => { el.hidden = el.dataset.estado !== estado; });
  if (token) document.getElementById('ag-link').href = `/agendar.html#t=${token}`;
  document.getElementById('ag-corpo').setAttribute('aria-busy', 'false');
};

// → { token } | { repetir: true } | {} (qualquer outra coisa: cai no Fallback)
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
    const { token } = await r.json();
    return TOKEN_RE.test(token) ? { token } : {};
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
};

const iniciar = async () => {
  secao.hidden = false;
  for (let i = 0; i < TENTATIVAS; i++) {
    const { token, repetir } = await trocar();
    if (token) return mostrar('pronto', token);
    if (!repetir) break;
    await new Promise((ok) => setTimeout(ok, ESPERA_MS));
  }
  mostrar('fallback');
};

// Sem eid (acesso direto, crawl, valor estranho na URL): sem cartão e sem requisição.
if (secao && typeof eid === 'string' && EID_RE.test(eid)) iniciar();
