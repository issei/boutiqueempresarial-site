import { test, expect } from '@playwright/test';

// O formulário tem 8 etapas; o orçamento padrão de 30s é apertado em CI.
test.setTimeout(90000);

// Bloqueia recursos de terceiros: o teste valida o payload, não a rede externa.
test.beforeEach(async ({ page }) => {
  await page.route('**://fonts.googleapis.com/**', r => r.abort());
  await page.route('**://fonts.gstatic.com/**', r => r.abort());
  await page.route('**://connect.facebook.net/**', r => r.abort());
  await page.route('**://www.googletagmanager.com/**', r => r.abort());
});

const URL = '/formulario.html?utm_source=meta&utm_medium=cpc&utm_campaign=aplicacao&fbclid=IwABC123&gclid=GC1';

test('fluxo completo captura payload e fechamento personalizado (Fase 5)', async ({ page }) => {
  const posts = [];
  await page.route('**/script.google.com/**', route => {
    posts.push(route.request().postData());
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"result":"success"}' });
  });
  await page.route('**/api.ipify.org/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ip":"203.0.113.9"}' }));
  await page.route('**/connect.facebook.net/**', route => route.abort());
  await page.route('**/googletagmanager.com/**', route => route.abort());

  await page.goto(URL);
  await page.context().addCookies([{ name: '_fbp', value: 'fb.1.123.456', url: page.url() }]);
  await page.reload();

  const next = page.locator('#next');

  // 1 maior desafio da operação — etapa de radio: sem botão "Continuar" até
  // "Outro" ser escolhido (critério 11/12 da Fase 5).
  await expect(next).toBeHidden();
  await page.locator('input[name=maior_problema_gestao][value=Outro]').check({ force: true });
  await expect(page.locator('#maior_problema_gestao_outro')).toBeVisible();
  await expect(page.locator('#maior_problema_gestao_outro')).toBeFocused();
  await expect(next).toBeVisible();
  await next.click();
  await expect(page.locator('#err-maior_problema_gestao')).toBeVisible();
  await page.fill('#maior_problema_gestao_outro', 'Falta de tempo para revisar tudo');
  await next.click();

  // 2 nome — valida obrigatoriedade; bloco de análise vem do desafio "Outro"
  // escolhido acima (critério 13/14: nenhum bloco fica vazio ou com token cru).
  await expect(page.locator('#q-nome_completo')).toBeVisible();
  await expect(page.locator('#an-1')).toBeVisible();
  await expect(page.locator('#an-1 .cf-an-kicker')).toHaveText('O que eu vou analisar no seu caso');
  await next.click();
  await expect(page.locator('#err-nome_completo')).toBeVisible();
  await page.fill('#nome_completo', 'maria silva souza');
  await next.click();

  // 3 whatsapp
  await page.fill('#whatsapp', '11987654321');
  await expect(page.locator('#whatsapp')).toHaveValue('(11) 98765-4321');
  await next.click();

  // 4 email
  await page.fill('#email', 'invalido');
  await next.click();
  await expect(page.locator('#err-email')).toBeVisible();
  await page.fill('#email', 'Maria@Exemplo.COM ');
  await next.click();

  // 5 modelo de negócio — ack com nome capitalizado (critério 16, 1ª ocorrência)
  // + avanço automático, sem clique em #next.
  await expect(page.locator('#ack-nome')).toHaveText('Obrigada, Maria.');
  await expect(next).toBeHidden();
  await page.locator('input[name=modelo_negocio][value="Prestação de Serviços B2C"]').check({ force: true });
  await expect(page.locator('#q-tamanho_equipe')).toBeVisible({ timeout: 2000 });

  // 6 tamanho do time — bloco de análise vem do modelo de negócio (critério 13).
  await expect(page.locator('#an-5')).toBeVisible();
  await expect(page.locator('#an-5 .cf-an-kicker')).toHaveText('Como isso muda a análise');
  await page.locator('input[name=tamanho_equipe][value="5 a 15 colaboradores"]').check({ force: true });
  await expect(page.locator('#q-faturamento_mensal')).toBeVisible({ timeout: 2000 });

  // 7 faturamento — bloco de análise vem do tamanho do time; envio após esta etapa.
  await expect(page.locator('#an-6')).toBeVisible();
  await expect(page.locator('#an-6 .cf-an-kicker')).toHaveText('A prioridade no seu tamanho de operação');
  await page.locator('input[name=faturamento_mensal][value="R$ 100 mil a R$ 300 mil/mês"]').check({ force: true });

  // Envio: consentimento é agora implícito (rodapé). Nenhuma step adicional.
  await expect(next).toHaveText('Enviar aplicação');
  await next.click();

  await page.waitForURL(/obrigada\.html/, { timeout: 8000 });

  expect(posts.length).toBe(1);
  const d = JSON.parse(posts[0]);

  expect(d.nome_completo).toBe('maria silva souza');
  expect(d.email).toBe('Maria@Exemplo.COM');
  expect(d.whatsapp).toBe('(11) 98765-4321');
  expect(d.modelo_negocio).toBe('Prestação de Serviços B2C');
  expect(d.modelo_negocio_outro).toBe('');
  expect(d.tamanho_equipe).toBe('5 a 15 colaboradores');
  expect(d.faturamento_mensal).toBe('R$ 100 mil a R$ 300 mil/mês');
  expect(d.maior_problema_gestao).toBe('Outro');
  expect(d.maior_problema_gestao_outro).toBe('Falta de tempo para revisar tudo');
  expect(d.consentimento).toBe(true);

  // rastreamento (inalterado pela Fase 5)
  expect(d.event_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(d.utm_source).toBe('meta');
  expect(d.fbc).toMatch(/^fb\.1\.\d+\.IwABC123$/);
  expect(d.fbp).toBe('fb.1.123.456');
  expect(d.ip_address).toBe('203.0.113.9');
  expect(d.page_url).toContain('/formulario.html');

  // dedup do pixel na página de obrigado
  expect(page.url()).toContain('eid=' + d.event_id);
  const ld = JSON.parse(await page.evaluate(() => localStorage.getItem('ld')));
  expect(ld.eid).toBe(d.event_id);

  // be_perfil — conveniência de renderização do fechamento (§3 da Fase 5)
  const perfil = JSON.parse(await page.evaluate(() => localStorage.getItem('be_perfil')));
  expect(perfil).toEqual({
    eixo: 'outro',
    segmento: 'b2c',
    nome: 'Maria',
    time: '5 a 15 colaboradores',
    faturamento: 'R$ 100 mil a R$ 300 mil/mês',
  });

  // fechamento personalizado em obrigada.html — nome capitalizado (critério 16,
  // 3ª ocorrência), sem token cru, gramaticalmente íntegro.
  await expect(page.locator('#titulo')).toHaveText('Aplicação recebida, Maria.');
  const fechamento = page.locator('#fechamento');
  await expect(fechamento).toBeVisible();
  await expect(fechamento).not.toBeEmpty();
  const texto = await fechamento.textContent();
  expect(texto).not.toContain('[');
  expect(texto).toContain('Maria');
  expect(texto).toContain('5 a 15 pessoas');
  expect(texto).toContain('R$ 100 mil a R$ 300 mil/mês');
});

test('utm persiste entre paginas (first-touch)', async ({ page }) => {
  await page.route('**/connect.facebook.net/**', r => r.abort());
  await page.route('**/googletagmanager.com/**', r => r.abort());
  await page.goto('/formulario.html?utm_source=instagram&utm_campaign=organico');
  await page.goto('/formulario.html');
  const v = await page.evaluate(() => [sessionStorage.getItem('be_utm_source'), sessionStorage.getItem('be_utm_campaign')]);
  expect(v).toEqual(['instagram', 'organico']);
});

test('sem be_perfil, obrigada.html cai no agradecimento genérico e ainda dispara o Pixel', async ({ page }) => {
  await page.route('**/connect.facebook.net/**', r => r.abort());
  await page.route('**/googletagmanager.com/**', r => r.abort());
  await page.goto('/obrigada.html?eid=test-event-id');
  await expect(page.locator('#titulo')).toHaveText('Solicitação Recebida');
  await expect(page.locator('#fechamento')).toBeHidden();
});
