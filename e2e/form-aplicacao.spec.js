import { test, expect } from '@playwright/test';

// O formulário tem 8 etapas; o orçamento padrão de 30s é apertado em CI.
test.setTimeout(90000);

// Bloqueia recursos de terceiros: o teste valida o payload, não a rede externa.
test.beforeEach(async ({ page }) => {
  // Isolamento padrão (docs/specs/adr-e2e-nao-enviar-formulario-para-producao.md):
  // nenhum teste deste arquivo alcança o Apps Script nem a API do CRM de verdade.
  // Rota registrada depois tem prioridade, então os testes que inspecionam o
  // payload mantêm a própria rota.
  await page.route('**/script.google.com/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"result":"success"}' }));
  await page.route('**/api.boutiqueempresarial.com.br/**', r => r.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
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

  // 0 posição — primeira etapa, obrigatória, avança sozinha
  // (docs/specs/design/formulario-dois-caminhos.md, critérios 1 e 2).
  await expect(next).toBeHidden();
  await expect(page.locator('#q-posicao')).toHaveText('Qual é a sua posição na empresa?');
  await page.locator('input[name=posicao][value="Sou dono ou sócio"]').check({ force: true });
  await expect(page.locator('#q-maior_problema_gestao')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('.step.a .transicao')).toHaveText('Agora me conta um pouco sobre a sua empresa.');

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
  await expect(page.locator('#an-nome_completo')).toBeVisible();
  await expect(page.locator('#an-nome_completo .cf-an-kicker')).toHaveText('O que eu vou analisar no seu caso');
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
  await expect(page.locator('#an-tamanho_equipe')).toBeVisible();
  await expect(page.locator('#an-tamanho_equipe .cf-an-kicker')).toHaveText('Como isso muda a análise');
  await page.locator('input[name=tamanho_equipe][value="5 a 15 colaboradores"]').check({ force: true });
  await expect(page.locator('#q-faturamento_mensal')).toBeVisible({ timeout: 2000 });

  // 7 faturamento — bloco de análise vem do tamanho do time; envio após esta etapa.
  await expect(page.locator('#an-faturamento_mensal')).toBeVisible();
  await expect(page.locator('#an-faturamento_mensal .cf-an-kicker')).toHaveText('A prioridade no seu tamanho de operação');
  await page.locator('input[name=faturamento_mensal][value="R$ 100 mil a R$ 300 mil/mês"]').check({ force: true });

  // Envio: consentimento é agora implícito (rodapé). Nenhuma step adicional.
  await expect(next).toHaveText('Enviar aplicação');
  await next.click();

  await page.waitForURL(/obrigada\.html/, { timeout: 8000 });

  // Dois POSTs: a pré-captura do contato e a aplicação completa.
  expect(posts.length).toBe(2);

  const parcial = JSON.parse(posts[0]);
  expect(parcial.parcial).toBe(true);
  expect(parcial.posicao).toBe('Sou dono ou sócio'); // G1: a pré-captura leva a posição
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

  // Critério 2: payload de hoje + posicao, sem nenhuma chave do gerente.
  expect(d.posicao).toBe('Sou dono ou sócio');
  for (const k of ['vinculo', 'pessoas_lideradas', 'maior_desafio_gerente', 'maior_desafio_gerente_outro', 'objetivo_12m', 'objetivo_12m_outro']) {
    expect(d[k], k).toBeUndefined();
  }

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
    caminho: 'empresario',
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

  // Cartão de agendamento (docs/specs/design/obrigada-agendamento.md): a API do CRM
  // responde 503 pela rota padrão do beforeEach, então volta à obrigada de sempre (sem cartão).
  await expect(page.locator('#nota-legado')).toBeVisible();
  await expect(page.locator('#agendamento')).toBeHidden();
});

test('funil: eventos GA4/Meta por etapa, sem dado pessoal', async ({ page }) => {
  await page.goto('/formulario.html');
  const next = page.locator('#next');
  const ga = () => page.evaluate(() =>
    (window.dataLayer || []).map(a => Array.from(a)).filter(a => a[0] === 'event').map(a => [a[1], a[2]]));

  await page.locator('input[name=posicao][value="Sou dono ou sócio"]').check({ force: true });
  await expect(page.locator('#q-maior_problema_gestao')).toBeVisible({ timeout: 2000 });
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
    'form_answer', 'form_step_complete', 'form_step_view',
    'form_validation_error',
    'form_step_complete', 'form_step_view',
    'form_step_complete', 'form_step_view',
    'form_step_complete', 'form_contact_captured', 'form_step_view',
    'form_back', 'form_step_view',
  ]);
  // Antes da posição não há caminho; depois, todo form_* leva path (critério 7).
  expect(events[0][1]).toEqual({ step_index: 0, step_name: 'posicao', direction: 'init' });
  expect(events[1][1]).toEqual({ step_name: 'posicao', answer: 'Sou dono ou sócio', path: 'empresario' });
  expect(events[5][1]).toEqual({ step_name: 'maior_problema_gestao', answer: 'Falta de padrão nas entregas e retrabalho', path: 'empresario' });
  expect(events[8][1]).toEqual({ step_name: 'nome_completo', path: 'empresario' });
  expect(events.at(-1)[1]).toMatchObject({ step_index: 4, step_name: 'email', direction: 'back', path: 'empresario' });
  for (const [nome, params] of events.slice(1)) expect(params.path, nome).toBe('empresario');

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
  await page.locator('input[name=posicao][value="Sou dono ou sócio"]').check({ force: true });
  await expect(page.locator('#q-maior_problema_gestao')).toBeVisible({ timeout: 2000 });
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
  expect(parcial.posicao).toBe('Sou dono ou sócio');
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

// ---------------------------------------------------------------------------
// Dois caminhos (docs/specs/design/formulario-dois-caminhos.md, critérios 1 a 10)
// ---------------------------------------------------------------------------

const EMPRESARIO = 'Sou dono ou sócio';
const GERENTE = 'Lidero um time na empresa (gerente, coordenador, supervisor)';
const escolher = (page, name, value) => page.locator(`input[name=${name}][value="${value}"]`).check({ force: true });

// Captura os POSTs ao Apps Script e responde sucesso.
async function capturarPosts(page) {
  const posts = [];
  await page.route('**/script.google.com/**', route => {
    posts.push(JSON.parse(route.request().postData()));
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"result":"success"}' });
  });
  return posts;
}

// Contato do gerente: nome → e-mail → WhatsApp (D4).
async function contatoDoGerente(page) {
  const next = page.locator('#next');
  await expect(page.locator('#q-nome_completo')).toBeVisible({ timeout: 2000 });
  await page.fill('#nome_completo', 'Gil Gerente');
  await next.click();
  await expect(page.locator('#q-email')).toBeVisible();
  await page.fill('#email', 'gil@exemplo.com');
  await next.click();
  await expect(page.locator('#q-whatsapp')).toBeVisible();
  await page.fill('#whatsapp', '11988887777');
  await next.click();
}

test('critério 1: sem resposta na posição o formulário não avança', async ({ page }) => {
  await page.goto('/formulario.html');
  await expect(page.locator('#q-posicao')).toBeVisible();
  await expect(page.locator('#next')).toBeHidden();
  await page.evaluate(() => window.nav(1));
  await expect(page.locator('#err-posicao')).toBeVisible();
  await expect(page.locator('#q-posicao')).toBeVisible();
  await expect(page.locator('.step.a')).toHaveCount(1);
});

test('critérios 3 e 6: caminho do gerente, ordem da Talita, 8 etapas e payload', async ({ page }) => {
  const posts = await capturarPosts(page);
  await page.goto(URL);
  const next = page.locator('#next');
  await expect(page.locator('#dots .dot')).toHaveCount(8);

  await escolher(page, 'posicao', GERENTE);
  await expect(page.locator('.step.a .transicao')).toHaveText('Agora me conta um pouco sobre o time que você lidera.');
  await expect(page.locator('#dots .dot')).toHaveCount(8);
  await contatoDoGerente(page);

  // A pré-captura sai quando nome + e-mail + WhatsApp validam, uma vez só, com a posição.
  await expect(page.locator('#q-vinculo')).toBeVisible();
  await expect.poll(() => posts.length).toBe(1);
  expect(posts[0].parcial).toBe(true);
  expect(posts[0].posicao).toBe(GERENTE);
  expect(posts[0].vinculo).toBeUndefined();

  await escolher(page, 'vinculo', 'CLT');
  await expect(page.locator('#q-pessoas_lideradas')).toBeVisible({ timeout: 2000 });
  await escolher(page, 'pessoas_lideradas', '6 a 10');
  await expect(page.locator('#q-maior_desafio_gerente')).toBeVisible({ timeout: 2000 });
  await escolher(page, 'maior_desafio_gerente', 'Outro');
  await expect(page.locator('#maior_desafio_gerente_outro')).toBeVisible();
  await expect(page.locator('#maior_desafio_gerente_outro')).toBeFocused();
  await next.click();
  await expect(page.locator('#err-maior_desafio_gerente')).toBeVisible();
  await page.fill('#maior_desafio_gerente_outro', 'Cobrança entre áreas');
  await next.click();
  await expect(page.locator('#q-objetivo_12m')).toBeVisible();
  await escolher(page, 'objetivo_12m', 'Crescer de cargo');
  await expect(next).toHaveText('Enviar aplicação');
  await next.click();
  await page.waitForURL(/obrigada\.html/, { timeout: 8000 });

  expect(posts.length).toBe(2); // só a pré-captura e o envio final
  const d = posts[1];
  expect(d.parcial).toBeUndefined();
  expect(d.event_id).toBe(posts[0].event_id);
  expect(d).toMatchObject({
    posicao: GERENTE, vinculo: 'CLT', pessoas_lideradas: '6 a 10',
    maior_desafio_gerente: 'Outro', maior_desafio_gerente_outro: 'Cobrança entre áreas',
    objetivo_12m: 'Crescer de cargo',
    nome_completo: 'Gil Gerente', email: 'gil@exemplo.com', whatsapp: '(11) 98888-7777', consentimento: true,
  });
  // Critério 3: sem modelo, tamanho, faturamento e maior problema (vazios, para o backend alinhar colunas).
  for (const k of ['modelo_negocio', 'tamanho_equipe', 'faturamento_mensal', 'maior_problema_gestao']) expect(d[k], k).toBe('');
  // Critério 4: "Outro" não marcado em objetivo_12m → a chave nem vai.
  expect(d.objetivo_12m_outro).toBeUndefined();
});

test('critério 4: "Outro" do gerente só vai no payload com "Outro" marcado', async ({ page }) => {
  const posts = await capturarPosts(page);
  await page.goto(URL);
  await escolher(page, 'posicao', GERENTE);
  await contatoDoGerente(page);
  await escolher(page, 'vinculo', 'PJ');
  await expect(page.locator('#q-pessoas_lideradas')).toBeVisible({ timeout: 2000 });
  await escolher(page, 'pessoas_lideradas', 'Mais de 20');
  await expect(page.locator('#q-maior_desafio_gerente')).toBeVisible({ timeout: 2000 });

  // Marca "Outro", digita, escolhe outra opção: o campo some e o texto não vai.
  await escolher(page, 'maior_desafio_gerente', 'Outro');
  await page.fill('#maior_desafio_gerente_outro', 'texto que será descartado');
  await escolher(page, 'maior_desafio_gerente', 'Preciso cobrar pendências uma por uma');
  await expect(page.locator('#q-objetivo_12m')).toBeVisible({ timeout: 2000 });
  await escolher(page, 'objetivo_12m', 'Outro');
  await expect(page.locator('#objetivo_12m_outro')).toBeVisible();
  await page.fill('#objetivo_12m_outro', 'Abrir o meu negócio');
  await page.locator('#next').click();
  await page.waitForURL(/obrigada\.html/, { timeout: 8000 });

  const d = posts.at(-1);
  expect(d.maior_desafio_gerente).toBe('Preciso cobrar pendências uma por uma');
  expect(d.maior_desafio_gerente_outro).toBeUndefined();
  expect(d.objetivo_12m).toBe('Outro');
  expect(d.objetivo_12m_outro).toBe('Abrir o meu negócio');
  expect(JSON.stringify(d)).not.toContain('descartado');
});

test('critério 5: trocar a posição limpa o outro caminho; contador e barra seguem o caminho ativo', async ({ page }) => {
  const posts = await capturarPosts(page);
  await page.goto(URL);

  // Começa como empresário e responde o desafio com "Outro" e texto.
  await escolher(page, 'posicao', EMPRESARIO);
  await expect(page.locator('#q-maior_problema_gestao')).toBeVisible({ timeout: 2000 });
  await escolher(page, 'maior_problema_gestao', 'Outro');
  await page.fill('#maior_problema_gestao_outro', 'resposta do empresário');
  await page.locator('#next').click();
  await expect(page.locator('#q-nome_completo')).toBeVisible();
  await expect(page.locator('#dots .dot.act')).toHaveCount(1);

  // Volta à posição (duas vezes) e troca para gerente.
  await page.locator('#prev').click();
  await page.locator('#prev').click();
  await expect(page.locator('#q-posicao')).toBeVisible();
  await escolher(page, 'posicao', GERENTE);
  await expect(page.locator('#q-nome_completo')).toBeVisible({ timeout: 2000 });

  // As respostas do empresário foram apagadas e a barra tem o total do gerente (8) na etapa 2.
  await expect(page.locator('input[name=maior_problema_gestao]:checked')).toHaveCount(0);
  await expect(page.locator('#maior_problema_gestao_outro')).toHaveValue('');
  await expect(page.locator('#dots .dot')).toHaveCount(8);
  expect(await page.locator('#dots .dot').evaluateAll(d => d.findIndex(x => x.classList.contains('act')))).toBe(1);

  await contatoDoGerente(page);
  await escolher(page, 'vinculo', 'CLT');
  await expect(page.locator('#q-pessoas_lideradas')).toBeVisible({ timeout: 2000 });
  await escolher(page, 'pessoas_lideradas', '3 a 5');
  await expect(page.locator('#q-maior_desafio_gerente')).toBeVisible({ timeout: 2000 });
  await escolher(page, 'maior_desafio_gerente', 'O time me procura para quase tudo');
  await expect(page.locator('#q-objetivo_12m')).toBeVisible({ timeout: 2000 });
  await escolher(page, 'objetivo_12m', 'Liderar com menos desgaste');
  await page.locator('#next').click();
  await page.waitForURL(/obrigada\.html/, { timeout: 8000 });

  const d = posts.at(-1);
  expect(d.posicao).toBe(GERENTE);
  expect(d.maior_problema_gestao).toBe(''); // nada do empresário sobrou
  expect(JSON.stringify(d)).not.toContain('resposta do empresário');

  // Caminho inverso: gerente que vira empresário perde as respostas do gerente.
  await page.goto(URL);
  await escolher(page, 'posicao', GERENTE);
  await contatoDoGerente(page);
  await escolher(page, 'vinculo', 'PJ');
  await expect(page.locator('#q-pessoas_lideradas')).toBeVisible({ timeout: 2000 });
  for (let i = 0; i < 5; i++) await page.locator('#prev').click();
  await escolher(page, 'posicao', EMPRESARIO);
  await expect(page.locator('#q-maior_problema_gestao')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('input[name=vinculo]:checked')).toHaveCount(0);
  await expect(page.locator('#dots .dot')).toHaveCount(8);
});

test('critério 7: eventos GA4 do gerente levam path e nenhum dado pessoal nem texto livre', async ({ page }) => {
  await page.goto('/formulario.html');
  const ga = () => page.evaluate(() =>
    (window.dataLayer || []).map(a => Array.from(a)).filter(a => a[0] === 'event').map(a => [a[1], a[2]]));
  await escolher(page, 'posicao', GERENTE);
  await contatoDoGerente(page);
  await escolher(page, 'vinculo', 'CLT');
  await expect(page.locator('#q-pessoas_lideradas')).toBeVisible({ timeout: 2000 });
  await escolher(page, 'pessoas_lideradas', '11 a 20');
  await expect(page.locator('#q-maior_desafio_gerente')).toBeVisible({ timeout: 2000 });
  await escolher(page, 'maior_desafio_gerente', 'Outro');
  await page.fill('#maior_desafio_gerente_outro', 'segredo do gerente');
  await page.locator('#next').click();
  await expect(page.locator('#q-objetivo_12m')).toBeVisible();

  const events = (await ga()).filter(e => e[0].startsWith('form_'));
  expect(events.length).toBeGreaterThan(10);
  for (const [nome, params] of events.slice(1)) expect(params.path, nome).toBe('gerente');
  expect(events.find(e => e[0] === 'form_contact_captured')[1]).toEqual({ path: 'gerente' });
  const flat = JSON.stringify(events);
  for (const pii of ['Gil', 'gil@', '98888', 'segredo do gerente']) expect(flat).not.toContain(pii);
  const meta = await page.evaluate(() => (window.fbq.queue || []).map(a => Array.from(a)).filter(a => a[0] === 'trackCustom').map(a => a[1]));
  expect(meta).toEqual(['FormStart', 'ContactCaptured']); // Pixel inalterado
});

test('critério 10: topo, texto acima do botão e rodapé com o texto literal da spec', async ({ page }) => {
  await page.goto('/formulario.html');
  // textContent: o CSS põe o eyebrow em caixa alta, e o texto literal da spec é o do HTML.
  const t = async (sel) => ((await page.locator(sel).first().textContent()) ?? '').replace(/\s+/g, ' ').trim();
  expect(await t('.intro-eyebrow')).toBe('Para empresários e líderes com equipe a partir de 3 pessoas');
  expect(await t('.intro-headline')).toBe('Quantas vezes o seu time te procurou hoje?');
  expect(await t('.intro-subtitle')).toBe('E quantas dessas vezes precisavam mesmo de você? Em um diagnóstico de 45 minutos, eu te mostro por que o time depende tanto de você e o que mudar primeiro na forma de conduzir a equipe.');
  expect(await t('.intro-cred')).toBe('Talita Issei · 15 anos em multinacionais como KPMG, Itaú, Vivo e Accenture');
  expect(await t('.intro-details summary')).toBe('O que olhamos juntos');
  const itens = (await page.locator('.intro-details li').allTextContents()).map(x => x.replace(/\s+/g, ' ').trim());
  expect(itens).toEqual([
    'Como você acompanha o time: onde estão as pendências, as prioridades e os responsáveis',
    'Como as decisões chegam até você: quais precisam mesmo da sua autorização',
    'O que já custou caro: erros e retrabalhos recentes, com exemplos da sua realidade',
  ]);
  expect(await t('#prg-txt')).toBe('Leva cerca de 2 minutos. Depois do envio, eu mesma entro em contato. Deixe um número com WhatsApp.');
  const rodape = ((await page.locator('form > .leg:not(#l-msg)').textContent()) ?? '').replace(/\s+/g, ' ');
  expect(rodape).toContain('Esta é uma aplicação e não garante o agendamento. Ao responder, você autoriza o uso dos seus dados apenas para avaliação desta aplicação, conforme a nossa Política de Privacidade.');
  // Sem caixa de consentimento (D3) e o bloco do topo só na etapa de posição.
  await expect(page.locator('input[type=checkbox]')).toHaveCount(0);
  await escolher(page, 'posicao', EMPRESARIO);
  await expect(page.locator('#q-maior_problema_gestao')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('.intro')).toBeHidden();
});

test('critério 2: faixas novas de tamanho_equipe (D1)', async ({ page }) => {
  await page.goto('/formulario.html');
  const valores = await page.locator('input[name=tamanho_equipe]').evaluateAll(l => l.map(i => i.value));
  expect(valores).toEqual(['Menos de 3 colaboradores', '3 a 4 colaboradores', '5 a 15 colaboradores', 'Mais de 15 colaboradores']);
});

// ---------------------------------------------------------------------------
// Devolutivas e fechamento do gerente (publicado em 27/10)
// ---------------------------------------------------------------------------

test('devolutivas do gerente aparecem na etapa seguinte à pergunta que as alimenta', async ({ page }) => {
  await page.goto('/formulario.html');
  await escolher(page, 'posicao', GERENTE);
  await contatoDoGerente(page);

  await escolher(page, 'vinculo', 'CLT');
  await expect(page.locator('#q-pessoas_lideradas')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('#an-pessoas_lideradas .cf-an-kicker')).toHaveText('Como isso muda a análise');
  await expect(page.locator('#an-pessoas_lideradas .cf-an-axis')).toHaveText('O que está no seu alcance');
  await expect(page.locator('#an-pessoas_lideradas .cf-an-text')).toHaveText('Como CLT, você tem limites de decisão definidos pela empresa. Eu olho o que você já pode mudar na condução do time sem pedir autorização a ninguém.');

  await escolher(page, 'pessoas_lideradas', '11 a 20');
  await expect(page.locator('#q-maior_desafio_gerente')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('#an-maior_desafio_gerente .cf-an-kicker')).toHaveText('A prioridade no tamanho do seu time');
  await expect(page.locator('#an-maior_desafio_gerente .cf-an-axis')).toHaveText('Quem decide o quê');

  await escolher(page, 'maior_desafio_gerente', 'Preciso cobrar pendências uma por uma');
  await expect(page.locator('#q-objetivo_12m')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('#an-objetivo_12m .cf-an-kicker')).toHaveText('O que eu vou analisar no seu caso');
  await expect(page.locator('#an-objetivo_12m .cf-an-axis')).toHaveText('Acompanhamento das entregas');
  await expect(page.locator('#an-objetivo_12m .cf-an-text')).toHaveText('Na sua sessão eu olho onde ficam as pendências, as prioridades e os responsáveis, para você saber o status sem precisar perguntar.');

  // Voltar e trocar a resposta troca o bloco.
  await page.locator('#prev').click();
  await escolher(page, 'maior_desafio_gerente', 'Outro');
  await page.fill('#maior_desafio_gerente_outro', 'qualquer coisa');
  await page.locator('#next').click();
  await expect(page.locator('#an-objetivo_12m .cf-an-axis')).toHaveText('Os pontos que travam o time');
});

test('toda opção que alimenta uma devolutiva tem texto (nenhum bloco vazio)', async ({ page }) => {
  await page.goto('/formulario.html');
  const faltam = await page.evaluate(() => {
    const out = [];
    for (const campo of ['maior_problema_gestao', 'modelo_negocio', 'tamanho_equipe', 'vinculo', 'pessoas_lideradas', 'maior_desafio_gerente']) {
      const grupo = FormCopy.ANALISE[campo];
      for (const r of document.querySelectorAll('input[name=' + campo + ']')) {
        const e = grupo && grupo.by[r.value];
        if (!e || !e.axis || !e.text || /\[|\]/.test(e.text)) out.push(campo + ': ' + r.value);
      }
    }
    return out;
  });
  expect(faltam).toEqual([]);
});

test('empresário: "Menos de 3" e "3 a 4 colaboradores" têm devolutiva própria', async ({ page }) => {
  await page.goto('/formulario.html');
  await escolher(page, 'posicao', EMPRESARIO);
  await expect(page.locator('#q-maior_problema_gestao')).toBeVisible({ timeout: 2000 });
  await escolher(page, 'maior_problema_gestao', 'Falta de padrão nas entregas e retrabalho');
  await page.fill('#nome_completo', 'Eva Empresária');
  await page.locator('#next').click();
  await page.fill('#whatsapp', '11987654321');
  await page.locator('#next').click();
  await page.fill('#email', 'eva@exemplo.com');
  await page.locator('#next').click();
  await escolher(page, 'modelo_negocio', 'Agência / Assessoria');
  await expect(page.locator('#q-tamanho_equipe')).toBeVisible({ timeout: 2000 });

  await escolher(page, 'tamanho_equipe', 'Menos de 3 colaboradores');
  await expect(page.locator('#q-faturamento_mensal')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('#an-faturamento_mensal .cf-an-axis')).toHaveText('Estrutura antes do time crescer');
  await expect(page.locator('#an-faturamento_mensal .cf-an-text')).toHaveText('Com menos de 3 pessoas, o risco é você virar o gargalo de um negócio que ainda vai crescer. Eu olho o que precisa estar descrito antes das próximas contratações.');

  await page.locator('#prev').click();
  await escolher(page, 'tamanho_equipe', '3 a 4 colaboradores');
  await expect(page.locator('#q-faturamento_mensal')).toBeVisible({ timeout: 2000 });
  await expect(page.locator('#an-faturamento_mensal .cf-an-axis')).toHaveText('A saída do combinado verbal');
  await expect(page.locator('#an-faturamento_mensal .cf-an-text')).toHaveText('Com 3 ou 4 pessoas quase tudo funciona por combinado verbal. Eu olho quais rotinas já precisam existir por escrito para o time não parar quando você não responde.');
});

test('critério 11: obrigada do gerente com fechamento acima da nota "em análise", sem seletor', async ({ page }) => {
  await capturarPosts(page);
  // O CRM devolve em_analise para todo gerente (D7); a rota padrão do beforeEach devolveria 503.
  await page.route('**/api.boutiqueempresarial.com.br/**', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ em_analise: true, envio_email: true }),
  }));
  await page.goto(URL);
  await escolher(page, 'posicao', GERENTE);
  await contatoDoGerente(page);
  await escolher(page, 'vinculo', 'PJ');
  await expect(page.locator('#q-pessoas_lideradas')).toBeVisible({ timeout: 2000 });
  await escolher(page, 'pessoas_lideradas', '6 a 10');
  await expect(page.locator('#q-maior_desafio_gerente')).toBeVisible({ timeout: 2000 });
  await escolher(page, 'maior_desafio_gerente', 'O time me procura para quase tudo');
  await expect(page.locator('#q-objetivo_12m')).toBeVisible({ timeout: 2000 });
  await escolher(page, 'objetivo_12m', 'Liderar com menos desgaste');
  await page.locator('#next').click();
  await page.waitForURL(/obrigada\.html/, { timeout: 8000 });

  // be_perfil: o caminho e o que o fechamento usa; nada de contato nem texto livre.
  const perfil = JSON.parse(await page.evaluate(() => localStorage.getItem('be_perfil')));
  expect(perfil).toEqual({
    caminho: 'gerente', nome: 'Gil', pessoas: '6 a 10',
    desafio: 'O time me procura para quase tudo', objetivo: 'Liderar com menos desgaste',
  });

  await expect(page.locator('#titulo')).toHaveText('Aplicação recebida, Gil.');
  await expect(page.locator('#fechamento')).toHaveText(
    'Gil, liderar um time de 6 a 10 pessoas que te procura para quase tudo deixa o seu próprio trabalho para o fim do dia. Na sessão vamos definir o que o time pode decidir sem você. E vamos ver como fazer isso com menos desgaste para você e para o time.');
  await expect(page.locator('#nota-analise')).toBeVisible();
  await expect(page.locator('#agendamento')).toBeHidden(); // sem seletor de datas
  const antes = await page.evaluate(() => !!(document.getElementById('fechamento').compareDocumentPosition(document.getElementById('nota-analise')) & Node.DOCUMENT_POSITION_FOLLOWING));
  expect(antes, 'o fechamento precisa vir acima da nota em análise').toBe(true);
});
