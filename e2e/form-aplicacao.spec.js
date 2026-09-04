import { test, expect } from '@playwright/test';

// O formulário tem 11 etapas; o orçamento padrão de 30s é apertado em CI.
test.setTimeout(90000);

// Bloqueia recursos de terceiros: o teste valida o payload, não a rede externa.
test.beforeEach(async ({ page }) => {
  await page.route('**://fonts.googleapis.com/**', r => r.abort());
  await page.route('**://fonts.gstatic.com/**', r => r.abort());
  await page.route('**://connect.facebook.net/**', r => r.abort());
  await page.route('**://www.googletagmanager.com/**', r => r.abort());
});

const URL = '/formulario.html?utm_source=meta&utm_medium=cpc&utm_campaign=aplicacao&fbclid=IwABC123&gclid=GC1';

test('fluxo completo captura payload correto', async ({ page }) => {
  const posts = [];
  await page.route('**/script.google.com/**', route => {
    posts.push(route.request().postData());
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"result":"success"}' });
  });
  await page.route('**/api.ipify.org/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ip":"203.0.113.9"}' }));
  await page.route('**/connect.facebook.net/**', route => route.abort());
  await page.route('**/googletagmanager.com/**', route => route.abort());

  await page.goto(URL);
  await page.addInitScript(() => {});
  // cookie _fbp
  await page.context().addCookies([{ name: '_fbp', value: 'fb.1.123.456', url: page.url() }]);
  await page.reload();

  const next = page.locator('#next');

  // 1 nome — valida obrigatoriedade
  await next.click();
  await expect(page.locator('#err-nome_completo')).toBeVisible();
  await page.fill('#nome_completo', 'Maria Silva Souza');
  await next.click();

  // 2 email
  await page.fill('#email', 'invalido');
  await next.click();
  await expect(page.locator('#err-email')).toBeVisible();
  await page.fill('#email', 'Maria@Exemplo.COM ');
  await next.click();

  // 3 whatsapp
  await page.fill('#whatsapp', '11987654321');
  await expect(page.locator('#whatsapp')).toHaveValue('(11) 98765-4321');
  await next.click();

  // 4 instagram (opcional — segue vazio)
  await next.click();

  // 5 modelo de negocio -> Outro
  await page.locator('input[name=modelo_negocio][value=Outro]').check();
  await expect(page.locator('#modelo_negocio_outro')).toBeVisible();
  await next.click();
  await expect(page.locator('#err-modelo_negocio')).toBeVisible();
  await page.fill('#modelo_negocio_outro', 'Franquia');
  await next.click();

  // 6 equipe
  await page.locator('input[name=tamanho_equipe][value="9 a 20 pessoas"]').check();
  await next.click();

  // 7 faturamento
  await page.locator('input[name=faturamento_mensal][value="R$ 150 mil a R$ 300 mil"]').check();
  await next.click();

  // 8 autonomia
  await page.locator('input[name=autonomia_operacional]').nth(1).check();
  await next.click();

  // 9 problemas — limite de 2
  const boxes = page.locator('input[name=maior_problema_gestao]');
  await next.click();
  await expect(page.locator('#err-maior_problema_gestao')).toBeVisible();
  await boxes.nth(0).check();
  await boxes.nth(2).check();
  await expect(page.locator('#cnt-problema')).toHaveText('2 de 2 selecionadas');
  await expect(boxes.nth(1)).toBeDisabled();
  await next.click();

  // 10 prioridade
  await page.locator('input[name=prioridade_resolucao]').first().check();
  await next.click();

  // 11 consentimento obrigatorio
  await expect(next).toHaveText('Enviar aplicação');
  await page.fill('#informacoes_adicionais', 'Equipe recem contratada.');
  await next.click();
  await expect(page.locator('#err-consentimento')).toBeVisible();
  await page.locator('#consentimento').check();
  await next.click();

  await page.waitForURL(/obrigada\.html/, { timeout: 8000 });

  expect(posts.length).toBe(1);
  const d = JSON.parse(posts[0]);
  console.log(JSON.stringify(d, null, 2));

  expect(d.nome_completo).toBe('Maria Silva Souza');
  expect(d.email).toBe('Maria@Exemplo.COM');
  expect(d.whatsapp).toBe('(11) 98765-4321');
  expect(d.instagram_site).toBe('');
  expect(d.modelo_negocio).toBe('Outro');
  expect(d.modelo_negocio_outro).toBe('Franquia');
  expect(d.tamanho_equipe).toBe('9 a 20 pessoas');
  expect(d.faturamento_mensal).toBe('R$ 150 mil a R$ 300 mil');
  expect(Array.isArray(d.maior_problema_gestao)).toBe(true);
  expect(d.maior_problema_gestao.length).toBe(2);
  expect(d.prioridade_resolucao).toContain('30 dias');
  expect(d.informacoes_adicionais).toBe('Equipe recem contratada.');
  expect(d.consentimento).toBe(true);

  // rastreamento
  expect(d.event_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(d.utm_source).toBe('meta');
  expect(d.utm_medium).toBe('cpc');
  expect(d.utm_campaign).toBe('aplicacao');
  expect(d.fbclid).toBe('IwABC123');
  expect(d.gclid).toBe('GC1');
  expect(d.fbc).toMatch(/^fb\.1\.\d+\.IwABC123$/);
  expect(d.fbp).toBe('fb.1.123.456');
  expect(d.ip_address).toBe('203.0.113.9');
  expect(d.user_agent).toBeTruthy();
  expect(d.page_url).toContain('/formulario.html');

  // dedup do pixel na pagina de obrigado
  expect(page.url()).toContain('eid=' + d.event_id);
  const ld = JSON.parse(await page.evaluate(() => localStorage.getItem('ld')));
  expect(ld.eid).toBe(d.event_id);
  expect(ld.ph).toBe('11987654321');
});

test('utm persiste entre paginas (first-touch)', async ({ page }) => {
  await page.route('**/connect.facebook.net/**', r => r.abort());
  await page.route('**/googletagmanager.com/**', r => r.abort());
  await page.goto('/formulario.html?utm_source=instagram&utm_campaign=organico');
  await page.goto('/formulario.html');
  const v = await page.evaluate(() => [sessionStorage.getItem('be_utm_source'), sessionStorage.getItem('be_utm_campaign')]);
  expect(v).toEqual(['instagram', 'organico']);
});
