// @ts-check
import { test, expect } from '@playwright/test';

// WebMCP ainda não existe em nenhum browser do Playwright: injeta-se um duplo
// antes do load (mesma técnica de agent-readiness.spec.js). As tools preenchem e
// avançam, mas nunca enviam — o clique final é do visitante. O POST é interceptado
// (fulfill) para o teste nunca gravar lead de verdade no Apps Script.

const TEXTO = { nome_completo: 'Maria Silva', whatsapp: '11987654321', email: 'maria@exemplo.com.br' };

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
  await expect(call(page, 'answer_field', { campo: 'maior_problema_gestao', valor: 'Outro' })).rejects.toThrow(/outro/);
});

test('percorre as 7 etapas e para na última, sem enviar', async ({ page }) => {
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
