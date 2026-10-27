// @ts-check
import { test, expect } from '@playwright/test';

// WebMCP ainda não existe em nenhum browser do Playwright: injeta-se um duplo
// antes do load (mesma técnica de agent-readiness.spec.js). As tools preenchem e
// avançam, mas nunca enviam — o clique final é do visitante. O POST é interceptado
// (fulfill) para o teste nunca gravar lead de verdade no Apps Script.

const TEXTO = { nome_completo: 'Maria Silva', whatsapp: '11987654321', email: 'maria@exemplo.com.br' };
const EMPRESARIO = 'Sou dono ou sócio';
const GERENTE = 'Lidero um time na empresa (gerente, coordenador, supervisor)';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__tools = [];
    document.modelContext = { registerTool: (t) => window.__tools.push(t) };
  });
  // Nunca fala com o Apps Script de verdade; guarda o que seria enviado.
  await page.route('https://script.google.com/**', (route) => route.fulfill({ status: 200, body: '' }));
  await page.goto('/formulario.html');
});

const call = (page, nome, args = {}) =>
  page.evaluate(([n, a]) => window.__tools.find((t) => t.name === n).execute(a), [nome, args]);

test('registra get_form_state, answer_field e next_step', async ({ page }) => {
  const nomes = await page.evaluate(() => window.__tools.map((t) => t.name));
  expect(nomes).toEqual(['get_form_state', 'answer_field', 'next_step']);
});

test('rejeita valor fora das opções e campo de outra etapa', async ({ page }) => {
  const st = await call(page, 'get_form_state');
  expect(st.etapa_atual).toBe(1);
  const campo = st.campos[0];
  await expect(call(page, 'answer_field', { campo: campo.name, valor: 'qualquer coisa' })).rejects.toThrow(/fora das opções/);
  await expect(call(page, 'answer_field', { campo: 'email', valor: 'a@b.co' })).rejects.toThrow(/fora da etapa atual/);
  await expect(call(page, 'next_step')).rejects.toThrow(/Selecione uma opção/);
});

test('"Outro" exige o texto livre', async ({ page }) => {
  // A 1ª etapa é a posição; o desafio do empresário vem depois dela.
  await call(page, 'answer_field', { campo: 'posicao', valor: EMPRESARIO });
  await expect(call(page, 'answer_field', { campo: 'maior_problema_gestao', valor: 'Outro' })).rejects.toThrow(/outro/);
});

test('percorre as 8 etapas do empresário e para na última, sem enviar', async ({ page }) => {
  const enviados = [];
  page.on('request', (r) => { if (r.url().includes('script.google.com')) enviados.push(JSON.parse(r.postData() || '{}')); });

  let st = await call(page, 'get_form_state');
  for (let i = 0; i < st.total_etapas; i++) {
    expect(st.etapa_atual).toBe(i + 1);
    for (const c of st.campos) {
      st = await call(page, 'answer_field', { campo: c.name, valor: c.tipo === 'radio' ? c.opcoes[0] : TEXTO[c.name] });
    }
    // etapas de escolha avançam sozinhas; as demais precisam de next_step
    if (i < st.total_etapas - 1 && st.etapa_atual === i + 1) st = await call(page, 'next_step');
  }

  expect(st.etapa_atual).toBe(st.total_etapas);
  const fim = await call(page, 'next_step');
  expect(fim.aguardando, 'última etapa deve esperar o clique humano').toBeTruthy();

  await page.waitForTimeout(600);
  expect(page.url(), 'tool navegou para a confirmação').not.toContain('obrigada.html');
  // A única coisa que pode ter ido ao backend é a pré-captura do contato (parcial).
  expect(enviados.filter((p) => !p.parcial), 'tool enviou o formulário final').toEqual([]);
});

// Critério 8 (docs/specs/design/formulario-dois-caminhos.md): get_form_state, answer_field e
// next_step só enxergam as etapas do caminho ativo.
test('critério 8: no empresário, campos do gerente estão fora do alcance das tools', async ({ page }) => {
  let st = await call(page, 'get_form_state');
  expect(st.campos.map((c) => c.name)).toEqual(['posicao']);
  expect(st.campos[0].opcoes).toEqual([EMPRESARIO, GERENTE]);
  st = await call(page, 'answer_field', { campo: 'posicao', valor: EMPRESARIO });
  expect(st.etapa_atual).toBe(2);
  expect(st.total_etapas).toBe(8);
  expect(st.campos.map((c) => c.name)).toEqual(['maior_problema_gestao']);
  for (const campo of ['vinculo', 'pessoas_lideradas', 'maior_desafio_gerente', 'objetivo_12m']) {
    await expect(call(page, 'answer_field', { campo, valor: 'CLT' })).rejects.toThrow(/fora da etapa atual/);
  }
});

test('critério 8: no gerente, as tools percorrem só as etapas dele, na ordem da Talita', async ({ page }) => {
  let st = await call(page, 'get_form_state');
  st = await call(page, 'answer_field', { campo: 'posicao', valor: GERENTE });
  expect(st.total_etapas).toBe(8);

  const vistos = [];
  for (let i = 1; i < st.total_etapas; i++) {
    expect(st.etapa_atual).toBe(i + 1);
    vistos.push(st.campos.map((c) => c.name));
    // Campos do empresário não existem para o agente neste caminho.
    await expect(call(page, 'answer_field', { campo: 'modelo_negocio', valor: 'Outro', outro: 'xx' })).rejects.toThrow(/fora da etapa atual/);
    await expect(call(page, 'answer_field', { campo: 'maior_problema_gestao', valor: 'Outro', outro: 'xx' })).rejects.toThrow(/fora da etapa atual/);
    for (const c of st.campos) {
      st = await call(page, 'answer_field', { campo: c.name, valor: c.tipo === 'radio' ? c.opcoes[0] : TEXTO[c.name] });
    }
    // etapas de escolha avançam sozinhas; as de texto precisam de next_step
    if (i < st.total_etapas - 1 && st.etapa_atual === i + 1) st = await call(page, 'next_step');
  }
  expect(vistos).toEqual([
    ['nome_completo'], ['email'], ['whatsapp'], ['vinculo'], ['pessoas_lideradas'], ['maior_desafio_gerente'], ['objetivo_12m'],
  ]);
  expect(st.etapa_atual).toBe(st.total_etapas);
  const fim = await call(page, 'next_step');
  expect(fim.aguardando, 'última etapa deve esperar o clique humano').toBeTruthy();
});
