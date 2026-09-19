// Consentimento de cookies — docs/specs/design/cookie-consent.md
// O que importa aqui é o estado do Consent Mode, não o visual: uma página que
// mostra o banner e mesmo assim concede analytics é o defeito que cria risco.
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**://connect.facebook.net/**', r => r.abort());
  await page.route('**://www.googletagmanager.com/**', r => r.abort());
  await page.route('**://fonts.googleapis.com/**', r => r.abort());
  await page.route('**://fonts.gstatic.com/**', r => r.abort());
});

// Consent Mode se resolve por "o último valor vence": lê o dataLayer na ordem.
const consentState = (page) =>
  page.evaluate(() => {
    const state = {};
    for (const a of window.dataLayer || []) {
      const [tipo, acao, params] = Array.from(a);
      if (tipo === 'consent' && (acao === 'default' || acao === 'update')) Object.assign(state, params);
    }
    return state;
  });

const banner = (page) => page.locator('#cc-banner');

test('sem escolha: banner visível e tudo negado por padrão', async ({ page }) => {
  await page.goto('/');
  await expect(banner(page)).toBeVisible();

  const state = await consentState(page);
  expect(state.analytics_storage).toBe('denied');
  expect(state.ad_storage).toBe('denied');
  expect(state.ad_user_data).toBe('denied');
  expect(state.ad_personalization).toBe('denied');
  // Funcionalidade e segurança nunca foram opcionais.
  expect(state.security_storage).toBe('granted');
});

test('o padrão negado é declarado antes do gtag.js', async ({ page }) => {
  const body = await (await page.request.get('/')).body();
  const html = body.toString('utf8');
  expect(html.indexOf('"consent", "default"')).toBeGreaterThan(-1);
  expect(html.indexOf('"consent", "default"')).toBeLessThan(html.indexOf('googletagmanager.com/gtag/js'));
  // O Pixel precisa saber do consentimento antes de init/track.
  expect(html.indexOf("fbq('consent'")).toBeLessThan(html.indexOf("fbq('init'"));
});

test('aceitar concede tudo e o banner some', async ({ page }) => {
  await page.goto('/');
  await banner(page).getByRole('button', { name: 'Aceitar' }).click();
  await expect(banner(page)).toHaveCount(0);

  const state = await consentState(page);
  expect(state.analytics_storage).toBe('granted');
  expect(state.ad_storage).toBe('granted');

  const salvo = JSON.parse(await page.evaluate(() => localStorage.getItem('be_consent')));
  expect(salvo.cat).toEqual({ analytics: true, marketing: true });
});

test('recusar mantém tudo negado e persiste a escolha', async ({ page }) => {
  await page.goto('/');
  await banner(page).getByRole('button', { name: 'Recusar' }).click();
  await expect(banner(page)).toHaveCount(0);

  expect(await consentState(page)).toMatchObject({ analytics_storage: 'denied', ad_storage: 'denied' });

  // Recarregar não pode voltar a perguntar nem "esquecer" a recusa.
  await page.reload();
  await expect(banner(page)).toHaveCount(0);
  expect(await consentState(page)).toMatchObject({ analytics_storage: 'denied', ad_storage: 'denied' });
});

test('preferências permitem aceitar só análise', async ({ page }) => {
  await page.goto('/');
  await banner(page).getByRole('button', { name: 'Preferências' }).click();

  const dlg = page.locator('dialog.cc-dlg');
  await expect(dlg).toBeVisible();
  await dlg.locator('#cc-ana').check();
  await dlg.getByRole('button', { name: 'Salvar' }).click();

  const state = await consentState(page);
  expect(state.analytics_storage).toBe('granted');
  expect(state.ad_storage).toBe('denied');
});

test('quem já decidiu não vê o banner e tem o consentimento aplicado antes do Pixel', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('be_consent', JSON.stringify({
      v: 1, ts: '2026-01-01T00:00:00.000Z', cat: { analytics: true, marketing: false },
    }));
  });
  await page.goto('/');
  await expect(banner(page)).toHaveCount(0);

  const state = await consentState(page);
  expect(state.analytics_storage).toBe('granted');
  expect(state.ad_storage).toBe('denied');
});

test('o rodapé reabre as preferências', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('be_consent', JSON.stringify({
      v: 1, ts: '2026-01-01T00:00:00.000Z', cat: { analytics: false, marketing: false },
    }));
  });
  await page.goto('/');
  await page.locator('#cc-reopen').click();
  await expect(page.locator('dialog.cc-dlg')).toBeVisible();
});

test('formulario.html reabre as preferências pelo texto legal', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('be_consent', JSON.stringify({
      v: 1, ts: '2026-01-01T00:00:00.000Z', cat: { analytics: false, marketing: false },
    }));
  });
  await page.goto('/formulario.html');
  await page.locator('.leg .cc-reopen').click();
  await expect(page.locator('dialog.cc-dlg')).toBeVisible();
});

test('o rodapé do formulário condiciona o consentimento a responder, não a enviar', async ({ page }) => {
  await page.goto('/formulario.html');
  const leg = page.locator('.leg').last();
  await expect(leg).toContainText('Ao responder, você concorda');
  await expect(leg).not.toContainText('Ao enviar');
});
