import { test, expect } from '@playwright/test';

// O formulário tem 8 etapas; o orçamento padrão de 30s é apertado em CI.
test.setTimeout(90000);

// Bloqueia recursos de terceiros: o teste valida o payload, não a rede externa.
test.beforeEach(async ({ page }) => {
  await page.route('**://fonts.googleapis.com/**', r => r.abort());
  await page.route('**://fonts.gstatic.com/**', r => r.abort());
  await page.route('**://connect.facebook.net/**', r => r.abort());
  await page.route('**://www.googletagmanager.com/**', r => r.abort());
  // Visitante que já decidiu sobre cookies: sem o banner, que é fixo no canto
  // inferior e cobriria os botões do formulário. O banner tem suíte própria.
  await page.addInitScript(() => {
    localStorage.setItem('be_consent', JSON.stringify({
      v: 1, ts: '2026-01-01T00:00:00.000Z', cat: { analytics: true, marketing: true },
    }));
  });
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

  // Dois POSTs: a pré-captura do contato e a aplicação completa.
  expect(posts.length).toBe(2);

  const parcial = JSON.parse(posts[0]);
  expect(parcial.parcial).toBe(true);
  expect(parcial.nome_completo).toBe('maria silva souza');
  expect(parcial.email).toBe('Maria@Exemplo.COM');
  expect(parcial.whatsapp).toBe('(11) 98765-4321');
  expect(parcial.event_id).toBeTruthy();
  // O desafio já foi respondido quando o contato fica válido; o resto, não.
  expect(parcial.maior_problema_gestao).toBe('Outro');
  expect(parcial.modelo_negocio).toBeUndefined();
  expect(parcial.faturamento_mensal).toBeUndefined();

  const d = JSON.parse(posts[1]);
  // A flag só existe no parcial: é ela que faz o backend pular CAPI e e-mail.
  expect(d.parcial).toBeUndefined();
  expect(d.event_id).toBe(parcial.event_id);

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

test('funil: eventos GA4/Meta por etapa, sem dado pessoal', async ({ page }) => {
  await page.goto('/formulario.html');
  const next = page.locator('#next');
  const ga = () => page.evaluate(() =>
    (window.dataLayer || []).map(a => Array.from(a)).filter(a => a[0] === 'event').map(a => [a[1], a[2]]));

  await page.locator('input[name=maior_problema_gestao][value="Falta de padrão nas entregas e retrabalho"]').check({ force: true });
  await expect(page.locator('#q-nome_completo')).toBeVisible({ timeout: 2000 });
  await next.click(); // vazio -> erro de validação
  await page.fill('#nome_completo', 'Maria Silva');
  await next.click();
  await page.fill('#whatsapp', '11987654321');
  await next.click();
  await page.fill('#email', 'maria@exemplo.com');
  await next.click();
  await page.locator('#prev').click();

  const events = await ga();
  expect(events.map(e => e[0])).toEqual([
    'form_step_view',
    'form_answer', 'form_step_complete', 'form_begin', 'form_step_view',
    'form_validation_error',
    'form_step_complete', 'form_step_view',
    'form_step_complete', 'form_step_view',
    'form_step_complete', 'form_contact_captured', 'form_step_view',
    'form_back', 'form_step_view',
  ]);
  expect(events[0][1]).toEqual({ step_index: 0, step_name: 'maior_problema_gestao', direction: 'init' });
  expect(events[1][1]).toEqual({ step_name: 'maior_problema_gestao', answer: 'Falta de padrão nas entregas e retrabalho' });
  expect(events[5][1]).toEqual({ step_name: 'nome_completo' });
  expect(events.at(-1)[1]).toMatchObject({ step_index: 3, step_name: 'email', direction: 'back' });

  // Só valores de conjuntos fechados: nada do que foi digitado vaza para os parâmetros.
  const flat = JSON.stringify(events);
  for (const pii of ['Maria', 'maria@', '98765']) expect(flat).not.toContain(pii);

  // Meta: só os eventos que viram público (o Lead fica em obrigada.html).
  const meta = await page.evaluate(() => (window.fbq.queue || []).map(a => Array.from(a)).filter(a => a[0] === 'trackCustom').map(a => a[1]));
  expect(meta).toEqual(['FormStart', 'ContactCaptured']);
});

test('abandono após o e-mail deixa só a pré-captura', async ({ page }) => {
  const posts = [];
  await page.route('**/script.google.com/**', route => {
    posts.push(route.request().postData());
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"result":"success"}' });
  });

  await page.goto('/formulario.html');
  const next = page.locator('#next');
  await page.locator('input[name=maior_problema_gestao][value="Falta de padrão nas entregas e retrabalho"]').check({ force: true });
  await expect(page.locator('#q-nome_completo')).toBeVisible({ timeout: 2000 });
  await page.fill('#nome_completo', 'João Abandono');
  await next.click();
  await page.fill('#whatsapp', '11912345678');
  await next.click();
  await page.fill('#email', 'joao@exemplo.com');
  await next.click();

  // Chegou na pergunta de modelo de negócio e parou por aqui.
  await expect(page.locator('#q-modelo_negocio')).toBeVisible();
  await expect.poll(() => posts.length).toBe(1);
  const parcial = JSON.parse(posts[0]);
  expect(parcial.parcial).toBe(true);
  expect(parcial.email).toBe('joao@exemplo.com');

  // Voltar e avançar de novo não pode gerar uma segunda pré-captura.
  await page.locator('#prev').click();
  await next.click();
  await expect(page.locator('#q-modelo_negocio')).toBeVisible();
  expect(posts.length).toBe(1);
});

test('obrigada.html envia generate_lead ao GA4 com o event_id', async ({ page }) => {
  await page.goto('/obrigada.html?eid=test-event-id');
  const ev = await page.evaluate(() =>
    (window.dataLayer || []).map(a => Array.from(a)).filter(a => a[0] === 'event' && a[1] === 'generate_lead'));
  expect(ev).toEqual([['event', 'generate_lead', { event_id: 'test-event-id' }]]);
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
