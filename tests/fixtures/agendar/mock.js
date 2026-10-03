// Apoio dos testes da página agendar: respostas simuladas da API do CRM a partir
// das fixtures (copiadas dos exemplos do OpenAPI, ver VERSION). Nenhuma chamada real.
import fs from 'node:fs';

const ler = (nome) => JSON.parse(fs.readFileSync(new URL(nome, import.meta.url), 'utf8'));

export const SLOTS = ler('slots.json');
export const RESERVA = ler('reserva.json');
export const SEM_HORARIO = ler('sem-horario.json');
export const LINK = ler('link.json');
export const ERROS = ler('erros.json');
export const VERSAO = fs.readFileSync(new URL('VERSION', import.meta.url), 'utf8').trim();

export const TOKEN = '0b6f6f1e-2f0a-4a51-9c19-3d2b1f4a7c10.dGVzdGUtbWFj';
export const URL_AGENDAR = `/agendar.html#t=${TOKEN}`;
export const API = 'https://api.boutiqueempresarial.com.br/public/agendamento';
export const STATUS_ERRO = {
  nao_encontrado: 404, link_expirado: 410, lead_nao_agendavel: 409, fora_do_prazo: 409,
  horario_indisponivel: 409, conflito: 409, agendamento_desligado: 409, muitas_tentativas: 429, indisponivel: 503,
  corpo_invalido: 422, idempotency_key_ausente: 422, erro_interno: 500,
};

export const ok = (body, status = 200) => ({ status, body });
export const erro = (code) => ({ status: STATUS_ERRO[code], body: ERROS[code] });

// Terceiros abortados e consentimento já gravado (sem banner), como em
// e2e/form-aplicacao.spec.js.
export async function bloquearTerceiros(page) {
  await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
  await page.route('**://connect.facebook.net/**', (r) => r.abort());
  await page.route('**://www.googletagmanager.com/**', (r) => r.abort());
  await page.addInitScript(() => {
    if (!localStorage.getItem('be_consent')) {
      localStorage.setItem('be_consent', JSON.stringify({
        v: 1, ts: '2026-01-01T00:00:00.000Z', cat: { analytics: true, marketing: true },
      }));
    }
  });
}

/**
 * Simula as rotas da API pública. `respostas[rota]` é uma resposta `{status, body}` ou uma função
 * `(chamada, n) => resposta | 'abortar' (pode devolver Promise)` (n = nº da chamada àquela rota, de 1).
 * Devolve `chamadas`: cada requisição com rota, corpo, cabeçalhos e Idempotency-Key.
 */
export async function simularApi(page, respostas) {
  const chamadas = [];
  const contagem = {};
  const cors = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
  };
  await page.route(`${API}/**`, async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const rota = new URL(req.url()).pathname.split('/').pop();
    contagem[rota] = (contagem[rota] ?? 0) + 1;
    const chamada = {
      rota, url: req.url(), headers: req.headers(), postData: req.postData(),
      corpo: JSON.parse(req.postData() || '{}'), chave: req.headers()['idempotency-key'],
    };
    chamadas.push(chamada);
    const def = respostas[rota];
    const r = typeof def === 'function' ? await def(chamada, contagem[rota]) : def;
    if (r === 'abortar') return route.abort('failed');
    if (!r) return route.fulfill({ status: 500, headers: cors, contentType: 'application/json', body: '{}' });
    return route.fulfill({ status: r.status, headers: cors, contentType: 'application/json', body: JSON.stringify(r.body) });
  });
  return chamadas;
}
