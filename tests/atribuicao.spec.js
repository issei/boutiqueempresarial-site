import { test, expect } from '@playwright/test';

// Atribuição first/last touch em cookie first-party — docs/specs/design/atribuicao-utm.md.
// Lê o payload da pré-captura (enviada quando o contato fica válido): mesmo collect() do envio final.

test.setTimeout(60000);

let posts;

test.beforeEach(async ({ context }) => {
  posts = [];
  // Nenhum teste alcança o Apps Script nem a API do CRM de verdade
  // (docs/specs/adr-e2e-nao-enviar-formulario-para-producao.md).
  await context.route('**/script.google.com/**', r => {
    posts.push(JSON.parse(r.request().postData()));
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"result":"success"}' });
  });
  await context.route('**/api.boutiqueempresarial.com.br/**', r => r.fulfill({ status: 503, body: '{}' }));
  await context.route('**/api.ipify.org/**', r => r.abort());
  await context.route('**://fonts.googleapis.com/**', r => r.abort());
  await context.route('**://fonts.gstatic.com/**', r => r.abort());
  await context.route('**://connect.facebook.net/**', r => r.abort());
  await context.route('**://www.googletagmanager.com/**', r => r.abort());
  // Sem o banner de cookies cobrindo os botões (o banner tem suíte própria).
  await context.addInitScript(() => {
    localStorage.setItem('be_consent', JSON.stringify({
      v: 1, ts: '2026-01-01T00:00:00.000Z', cat: { analytics: true, marketing: true },
    }));
  });
});

async function fillContact(page) {
  await page.locator('input[name=maior_problema_gestao]').first().check({ force: true });
  await expect(page.locator('#q-nome_completo')).toBeVisible({ timeout: 2000 });
  await page.fill('#nome_completo', 'maria silva');
  await page.locator('#next').click();
  await page.fill('#whatsapp', '11987654321');
  await page.locator('#next').click();
  await page.fill('#email', 'maria@exemplo.com');
  await page.locator('#next').click();
  await expect.poll(() => posts.length).toBeGreaterThan(0);
  return posts[0];
}

test('anúncio na home: UTMs chegam ao formulário pelo CTA', async ({ page }) => {
  await page.goto('/?utm_source=meta&utm_medium=paid_social&utm_campaign=c1&utm_content=a');
  await page.locator('.hero-cta a').click();
  await page.waitForURL(/\/formulario/);
  expect(new URL(page.url()).search).toBe('');

  const d = await fillContact(page);
  expect(d.utm_source).toBe('meta');
  expect(d.utm_campaign).toBe('c1');
  expect(d.utm_content).toBe('a');
  expect(d.first_utm_content).toBe('a');
  expect(d.landing_page).toBe('/');
  expect(d.first_touch_at).toBe(d.last_touch_at);
  expect(Date.parse(d.last_touch_at)).not.toBeNaN();
});

test('volta em outra aba, sem UTM: a atribuição sobrevive à sessão', async ({ context, page }) => {
  await page.goto('/?utm_source=meta&utm_campaign=c1&utm_content=a');
  await page.close();

  const outra = await context.newPage(); // sessionStorage novo: só o cookie carrega a origem
  await outra.goto('/formulario.html');
  const d = await fillContact(outra);
  expect(d.utm_content).toBe('a');
  expect(d.utm_campaign).toBe('c1');
});

test('segundo anúncio vira último toque; o primeiro é preservado', async ({ page }) => {
  await page.goto('/?utm_source=meta&utm_campaign=c1&utm_content=a');
  await page.goto('/?utm_source=meta&utm_campaign=c1&utm_content=b');
  await page.goto('/'); // visita direta não apaga nada
  await page.goto('/formulario.html');

  const d = await fillContact(page);
  expect(d.utm_content).toBe('b');
  expect(d.first_utm_content).toBe('a');
  expect(d.first_utm_campaign).toBe('c1');
});

test('visita sem UTM não cria cookie; cookie corrompido não quebra a página', async ({ context, page }) => {
  const erros = [];
  page.on('pageerror', e => erros.push(e.message));

  await page.goto('/');
  expect((await context.cookies()).find(c => c.name === 'be_attr')).toBeUndefined();

  await context.addCookies([{ name: 'be_attr', value: '%7Bquebrado', url: page.url() }]);
  await page.goto('/formulario.html?utm_source=x');
  expect(await page.evaluate(() => window.BE_ATTR.last.utm_source)).toBe('x');
  expect(erros).toEqual([]);
});
