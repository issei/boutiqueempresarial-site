// Cartão de agendamento da obrigada.html — docs/specs/design/obrigada-agendamento.md §6.
// A API do CRM é simulada (nenhuma chamada real; ver ADR e2e-nao-enviar-formulario-para-producao).
import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { API, ok, erro, bloquearTerceiros, simularApi } from './fixtures/agendar/mock.js';

const LINK = JSON.parse(fs.readFileSync(new URL('./fixtures/agendar/link.json', import.meta.url), 'utf8'));
const TOKEN = LINK.pronto.token;
const URL_OBRIGADA = '/obrigada.html?eid=evento-de-teste';

test.beforeEach(async ({ page }) => {
  await bloquearTerceiros(page);
  await page.route('**/script.google.com/**', (r) => r.fulfill({ status: 200, body: '{"result":"success"}' }));
});

const cartao = (page) => page.locator('#agendamento');
const botao = (page) => page.getByRole('link', { name: 'Escolher horário' });
const fallback = (page) => page.locator('[data-estado="fallback"]');

// Avança o relógio simulado até a chamada `n` à API ter saído (a espera entre tentativas é de 2 s).
async function ate(page, chamadas, n) {
  for (let i = chamadas.length; i < n; i++) {
    await expect.poll(() => chamadas.length).toBeGreaterThan(i);
    await page.clock.runFor(2000);
  }
  await expect.poll(() => chamadas.length).toBeGreaterThanOrEqual(n);
}

test('pronto: o botão leva ao /agendar com o token no fragmento', async ({ page }) => {
  const chamadas = await simularApi(page, { link: ok(LINK.pronto) });
  await page.goto(URL_OBRIGADA);

  await expect(botao(page)).toBeVisible();
  await expect(botao(page)).toHaveAttribute('href', `/agendar.html#t=${TOKEN}`);
  await expect(page.getByRole('heading', { level: 2 })).toHaveText('Escolha o dia e o horário do seu Diagnóstico Gratuito');
  await expect(fallback(page)).toBeHidden();
  await expect(page.locator('#ag-corpo')).toHaveAttribute('aria-busy', 'false');

  expect(chamadas).toHaveLength(1);
  expect(chamadas[0].rota).toBe('link');
  expect(chamadas[0].corpo).toEqual({ event_id: 'evento-de-teste' });
  expect(chamadas[0].headers['content-type']).toContain('application/json');
});

test('o botão abre a página agendar, que reconhece o token e remove o fragmento', async ({ page }) => {
  await simularApi(page, {
    link: ok(LINK.pronto),
    slots: ok({ primeiro_nome: 'Maria', duracao_min: 45, fuso: 'America/Sao_Paulo', dias: [], agendamento_atual: null }),
  });
  await page.goto(URL_OBRIGADA);
  await botao(page).click();
  await page.waitForURL(/agendar\.html/);
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('be_agendar_t'))).toBe(TOKEN);
  expect(page.url()).not.toContain(TOKEN);
});

test('202 repete a chamada e chega a pronto', async ({ page }) => {
  await page.clock.install();
  const chamadas = await simularApi(page, { link: (_c, n) => (n < 3 ? ok(LINK.repetir, 202) : ok(LINK.pronto)) });
  await page.goto(URL_OBRIGADA);

  await expect(page.locator('[data-estado="preparando"]')).toBeVisible();
  await ate(page, chamadas, 3);
  await expect(botao(page)).toHaveAttribute('href', `/agendar.html#t=${TOKEN}`);
  expect(chamadas).toHaveLength(3);
});

test('202 até esgotar as 6 tentativas cai no fallback', async ({ page }) => {
  await page.clock.install();
  const chamadas = await simularApi(page, { link: ok(LINK.repetir, 202) });
  await page.goto(URL_OBRIGADA);

  await ate(page, chamadas, 6);
  await expect(fallback(page)).toBeVisible();
  await expect(botao(page)).toBeHidden();
  expect(chamadas).toHaveLength(6);
});

const FALHAS = [
  ['404', erro('nao_encontrado')],
  ['410', erro('link_expirado')],
  ['409 lead_nao_agendavel', erro('lead_nao_agendavel')],
  ['429', erro('muitas_tentativas')],
  ['503', erro('indisponivel')],
  ['500', erro('erro_interno')],
  ['resposta 200 sem token', ok({})],
  ['token fora do formato', ok({ token: 'curto' })],
  ['falha de rede', 'abortar'],
];
for (const [nome, resposta] of FALHAS) {
  test(`fallback sem botão e sem repetir: ${nome}`, async ({ page }) => {
    const chamadas = await simularApi(page, { link: resposta });
    await page.goto(URL_OBRIGADA);

    await expect(fallback(page)).toBeVisible();
    await expect(fallback(page)).toContainText('O link foi enviado ao seu e-mail');
    await expect(botao(page)).toBeHidden();
    expect(chamadas).toHaveLength(1);
  });
}

test('timeout de 10 s sem resposta cai no fallback', async ({ page }) => {
  await page.clock.install();
  const chamadas = await simularApi(page, { link: () => new Promise(() => {}) });
  await page.goto(URL_OBRIGADA);

  await expect.poll(() => chamadas.length).toBe(1);
  await page.clock.runFor(10000);
  await expect(fallback(page)).toBeVisible();
});

for (const [nome, url] of [['sem eid', '/obrigada.html'], ['eid malformado', '/obrigada.html?eid=%3Cscript%3E']]) {
  test(`${nome}: nenhum cartão e nenhuma requisição à API`, async ({ page }) => {
    const chamadas = await simularApi(page, { link: ok(LINK.pronto) });
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(cartao(page)).toBeHidden();
    expect(chamadas).toHaveLength(0);
  });
}

test('o token não vaza para URL, storage, dataLayer nem terceiros; a conversão independe da API', async ({ page }) => {
  const terceiros = [];
  page.on('request', (r) => { if (!r.url().startsWith(API)) terceiros.push(`${r.url()} ${r.postData() ?? ''}`); });
  await simularApi(page, { link: erro('indisponivel') }); // API fora do ar: o Lead ainda dispara
  await page.goto(URL_OBRIGADA);
  await expect(fallback(page)).toBeVisible();
  const dataLayer = await page.evaluate(() => JSON.stringify(window.dataLayer));
  expect(dataLayer).toContain('generate_lead');

  const { page: pronta } = { page: await page.context().newPage() };
  await bloquearTerceiros(pronta);
  const outros = [];
  pronta.on('request', (r) => { if (!r.url().startsWith(API)) outros.push(`${r.url()} ${r.postData() ?? ''}`); });
  await simularApi(pronta, { link: ok(LINK.pronto) });
  await pronta.goto(URL_OBRIGADA);
  await expect(botao(pronta)).toBeVisible();

  const estado = await pronta.evaluate(() => JSON.stringify({
    url: location.href, ls: { ...localStorage }, ss: { ...sessionStorage }, dl: window.dataLayer,
  }));
  expect(estado).not.toContain(TOKEN);
  expect([...terceiros, ...outros].filter((x) => x.includes(TOKEN))).toEqual([]);
});

test('copy do cartão sem termos proibidos (HARNESS_AEO §B6)', async ({ page }) => {
  await simularApi(page, { link: ok(LINK.pronto) });
  await page.goto(URL_OBRIGADA);
  await expect(botao(page)).toBeVisible();
  const texto = await page.locator('main').innerText();
  expect(texto).not.toMatch(/revolucion|disruptiv|game-changer|solução completa|última geração|garante|elimina|assegura|Diagnóstico de Estabilidade|48h/i);
  expect(texto).toContain('Diagnóstico Gratuito');
});

// Serious/critical do axe e rolagem horizontal, em cada estado do cartão.
const ESTADOS = {
  preparando: () => ({ link: () => new Promise(() => {}) }),
  pronto: () => ({ link: ok(LINK.pronto) }),
  fallback: () => ({ link: erro('indisponivel') }),
};
const ESPERA = { preparando: '[data-estado="preparando"]', pronto: '[data-estado="pronto"]', fallback: '[data-estado="fallback"]' };

for (const [estado, respostas] of Object.entries(ESTADOS)) {
  test(`acessibilidade e 375px: ${estado}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await simularApi(page, respostas());
    await page.goto(URL_OBRIGADA);
    await expect(page.locator(ESPERA[estado])).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).analyze();
    const graves = violations.filter((v) => ['serious', 'critical'].includes(v.impact));
    expect(graves, JSON.stringify(graves.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))).toEqual([]);

    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(sobra).toBeLessThanOrEqual(0);
  });
}
