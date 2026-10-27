// Cartão de agendamento da obrigada.html — docs/specs/design/obrigada-agendamento.md §6.
// O seletor de horários já aparece no cartão (sem botão intermediário).
// O toggle do CRM comanda a jornada: desligado (ou qualquer falha) = obrigada de sempre.
// A API do CRM é simulada (nenhuma chamada real; ver ADR e2e-nao-enviar-formulario-para-producao).
import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { API, SLOTS, RESERVA, ok, erro, bloquearTerceiros, simularApi } from './fixtures/agendar/mock.js';

const LINK = JSON.parse(fs.readFileSync(new URL('./fixtures/agendar/link.json', import.meta.url), 'utf8'));
const TOKEN = LINK.pronto.token;
const URL_OBRIGADA = '/obrigada.html?eid=evento-de-teste';

test.beforeEach(async ({ page }) => {
  await bloquearTerceiros(page);
  await page.route('**/script.google.com/**', (r) => r.fulfill({ status: 200, body: '{"result":"success"}' }));
});

const cartao = (page) => page.locator('#agendamento');
const TITULO = 'Escolha o melhor horário para o seu Diagnóstico Operacional';
const dia = (page) => page.getByRole('radio', { name: '06/10, terça-feira' });
const seletor = (page) => page.locator('#agendador');
const titulo = (page) => page.locator('[data-ag-titulo]');
const pronta = (extra = {}) => ({ link: ok(LINK.pronto), slots: ok(SLOTS.semAgendamento), ...extra });
// Obrigada de sempre (sem cartão): agendamento desligado no CRM, ou qualquer falha da troca.
const legado = (page) => page.locator('#nota-legado');
// Perfil indefinido (Spec 023 do CRM): sem seletor; a equipe analisa e entra em contato.
const analise = (page) => page.locator('#nota-analise');

// Avança o relógio simulado até a chamada `n` à API ter saído (a espera entre tentativas é de 2 s).
async function ate(page, chamadas, n) {
  for (let i = chamadas.length; i < n; i++) {
    await expect.poll(() => chamadas.length).toBeGreaterThan(i);
    await page.clock.runFor(2000);
  }
  await expect.poll(() => chamadas.length).toBeGreaterThanOrEqual(n);
}

test('pronto: os dias e horários aparecem direto, sem botão intermediário', async ({ page }) => {
  const chamadas = await simularApi(page, pronta());
  await page.goto(URL_OBRIGADA);

  await expect(dia(page)).toBeVisible();
  await expect(titulo(page)).toHaveText(TITULO);
  await expect(page.getByRole('link', { name: 'Escolher horário' })).toHaveCount(0);
  await expect(legado(page)).toBeHidden();
  await expect(page.locator('#ag-email')).toBeVisible(); // envio_email: true
  await expect(page.locator('#nota-email')).toBeVisible();
  await expect(seletor(page)).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByRole('button', { name: 'Confirmar horário' })).toBeDisabled();

  expect(chamadas.map((c) => c.rota)).toEqual(['link', 'slots']);
  expect(chamadas[0].corpo).toEqual({ event_id: 'evento-de-teste' });
  expect(chamadas[0].headers['content-type']).toContain('application/json');
  expect(chamadas[1].corpo).toEqual({ token: TOKEN });
});

test('pronto com o envio de e-mail desligado: não diz que enviou e-mail', async ({ page }) => {
  await simularApi(page, pronta({ link: ok(LINK.prontoSemEmail) }));
  await page.goto(URL_OBRIGADA);

  await expect(dia(page)).toBeVisible();
  await expect(page.locator('#ag-email')).toBeHidden();
  await expect(page.locator('#nota-email')).toBeHidden();
  await expect(legado(page)).toBeHidden();
});

test('escolher e confirmar reserva sem sair da obrigada; o foco só se move depois do gesto', async ({ page }) => {
  const chamadas = await simularApi(page, pronta({ reservar: ok(RESERVA.reservar.comMeet, 201) }));
  await page.goto(URL_OBRIGADA);

  await expect(dia(page)).toBeVisible();
  await expect(titulo(page)).not.toBeFocused(); // carregar não é gesto do visitante
  await dia(page).check();
  await page.getByRole('radio', { name: '10:00' }).check();
  await page.getByRole('button', { name: 'Confirmar horário' }).click();

  await expect(page.locator('#conf-texto')).toContainText('Diagnóstico agendado para');
  await expect(titulo(page)).toHaveText('Diagnóstico agendado');
  await expect(titulo(page)).toBeFocused();
  expect(new URL(page.url()).pathname).toBe('/obrigada.html');
  expect(chamadas.find((c) => c.rota === 'reservar').corpo).toEqual({ token: TOKEN, inicio: '2026-10-06T10:00:00-03:00' });
});

test('sem horários na agenda: o erro aparece no cartão, com o contato alternativo', async ({ page }) => {
  await simularApi(page, pronta({ slots: ok({ ...SLOTS.semAgendamento, dias: [] }) }));
  await page.goto(URL_OBRIGADA);

  await expect(page.locator('#erro-msg')).toContainText('No momento não há horários disponíveis');
  await expect(page.getByRole('link', { name: 'Falar com a gente' })).toBeVisible();
  await expect(legado(page)).toBeHidden();
});

test('em análise: sem seletor, com a nota de análise e a confirmação por e-mail', async ({ page }) => {
  const chamadas = await simularApi(page, { link: ok(LINK.emAnalise) });
  await page.goto(URL_OBRIGADA);

  await expect(analise(page)).toBeVisible();
  await expect(analise(page)).toContainText('Vamos analisar a sua aplicação');
  await expect(analise(page)).toContainText('Diagnóstico Operacional');
  await expect(page.locator('#nota-analise-email')).toBeVisible();
  await expect(analise(page)).toContainText('Enviamos a confirmação do cadastro');
  await expect(cartao(page)).toBeHidden();
  await expect(seletor(page)).toBeHidden();
  await expect(legado(page)).toBeHidden();
  await expect(page.locator('#nota-cartao')).toBeHidden();
  expect(chamadas.map((c) => c.rota)).toEqual(['link']); // nenhum slots: não há token
});

test('em análise com o envio de e-mail desligado: não promete e-mail', async ({ page }) => {
  await simularApi(page, { link: ok(LINK.emAnaliseSemEmail) });
  await page.goto(URL_OBRIGADA);

  await expect(analise(page)).toBeVisible();
  await expect(page.locator('#nota-analise-email')).toBeHidden();
  expect(await analise(page).innerText()).not.toMatch(/e-mail/i); // innerText ignora o trecho oculto
});

test('202 repete a chamada e chega a pronto', async ({ page }) => {
  await page.clock.install();
  const chamadas = await simularApi(page, pronta({ link: (_c, n) => (n < 3 ? ok(LINK.repetir, 202) : ok(LINK.pronto)) }));
  await page.goto(URL_OBRIGADA);

  await expect(page.locator('[data-estado="preparando"]')).toBeVisible();
  await ate(page, chamadas, 3);
  await expect(dia(page)).toBeVisible();
  expect(chamadas.filter((c) => c.rota === 'link')).toHaveLength(3);
});

test('202 até esgotar as 6 tentativas volta à obrigada de sempre', async ({ page }) => {
  await page.clock.install();
  const chamadas = await simularApi(page, { link: ok(LINK.repetir, 202) });
  await page.goto(URL_OBRIGADA);

  await ate(page, chamadas, 6);
  await expect(legado(page)).toBeVisible();
  await expect(seletor(page)).toBeHidden();
  expect(chamadas).toHaveLength(6);
});

const FALHAS = [
  ['409 agendamento_desligado (toggle do CRM)', erro('agendamento_desligado')],
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
  test(`obrigada de sempre, sem cartão e sem repetir: ${nome}`, async ({ page }) => {
    const chamadas = await simularApi(page, { link: resposta });
    await page.goto(URL_OBRIGADA);

    await expect(legado(page)).toBeVisible();
    await expect(legado(page)).toContainText('Retornaremos em até 48h úteis');
    await expect(cartao(page)).toBeHidden();
    await expect(page.locator('#nota-cartao')).toBeHidden();
    await expect(seletor(page)).toBeHidden();
    expect(chamadas).toHaveLength(1);
  });
}

test('timeout de 10 s sem resposta volta à obrigada de sempre', async ({ page }) => {
  await page.clock.install();
  const chamadas = await simularApi(page, { link: () => new Promise(() => {}) });
  await page.goto(URL_OBRIGADA);

  await expect.poll(() => chamadas.length).toBe(1);
  await page.clock.runFor(10000);
  await expect(legado(page)).toBeVisible();
});

for (const [nome, url] of [['sem eid', '/obrigada.html'], ['eid malformado', '/obrigada.html?eid=%3Cscript%3E']]) {
  test(`${nome}: nenhum cartão e nenhuma requisição à API`, async ({ page }) => {
    const chamadas = await simularApi(page, pronta());
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(cartao(page)).toBeHidden();
    await expect(legado(page)).toBeVisible();
    expect(chamadas).toHaveLength(0);
  });
}

test('o token não vaza para URL, storage, dataLayer nem terceiros; a conversão independe da API', async ({ page }) => {
  const terceiros = [];
  page.on('request', (r) => { if (!r.url().startsWith(API)) terceiros.push(`${r.url()} ${r.postData() ?? ''}`); });
  await simularApi(page, { link: erro('indisponivel') }); // API fora do ar: o Lead ainda dispara
  await page.goto(URL_OBRIGADA);
  await expect(legado(page)).toBeVisible();
  const dataLayer = await page.evaluate(() => JSON.stringify(window.dataLayer));
  expect(dataLayer).toContain('generate_lead');

  const aberta = await page.context().newPage();
  await bloquearTerceiros(aberta);
  const outros = [];
  aberta.on('request', (r) => { if (!r.url().startsWith(API)) outros.push(`${r.url()} ${r.postData() ?? ''}`); });
  await simularApi(aberta, pronta({ reservar: ok(RESERVA.reservar.comMeet, 201) }));
  await aberta.goto(URL_OBRIGADA);
  await expect(dia(aberta)).toBeVisible();
  await dia(aberta).check(); // reservar também não deixa o token em lugar nenhum
  await aberta.getByRole('radio', { name: '10:00' }).check();
  await aberta.getByRole('button', { name: 'Confirmar horário' }).click();
  await expect(aberta.locator('#conf-texto')).toBeVisible();

  const estado = await aberta.evaluate(() => JSON.stringify({
    url: location.href, ls: { ...localStorage }, ss: { ...sessionStorage }, dl: window.dataLayer,
  }));
  expect(estado).not.toContain(TOKEN);
  expect([...terceiros, ...outros].filter((x) => x.includes(TOKEN))).toEqual([]);
});

test('copy do cartão sem termos proibidos (HARNESS_AEO §B6)', async ({ page }) => {
  await simularApi(page, pronta());
  await page.goto(URL_OBRIGADA);
  await expect(dia(page)).toBeVisible();
  const texto = await page.locator('main').innerText();
  expect(texto).not.toMatch(/revolucion|disruptiv|game-changer|solução completa|última geração|garante|elimina|assegura|Diagnóstico de Estabilidade|48h/i);
  expect(texto).toContain('Diagnóstico Operacional');
});

// Serious/critical do axe e rolagem horizontal, em cada estado do cartão.
const ESTADOS = {
  preparando: () => ({ link: () => new Promise(() => {}) }),
  pronto: () => pronta(),
  prontoSemEmail: () => pronta({ link: ok(LINK.prontoSemEmail) }),
  semHorarios: () => pronta({ slots: ok({ ...SLOTS.semAgendamento, dias: [] }) }),
  emAnalise: () => ({ link: ok(LINK.emAnalise) }),
  legado: () => ({ link: erro('agendamento_desligado') }),
};
const ESPERA = {
  preparando: '[data-estado="preparando"]', pronto: '#agendador .ag-opcao', prontoSemEmail: '#agendador .ag-opcao',
  semHorarios: '#erro-msg', emAnalise: '#nota-analise', legado: '#nota-legado',
};

for (const [estado, respostas] of Object.entries(ESTADOS)) {
  test(`acessibilidade e 375px: ${estado}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await simularApi(page, respostas());
    await page.goto(URL_OBRIGADA);
    await expect(page.locator(ESPERA[estado]).first()).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).analyze();
    const graves = violations.filter((v) => ['serious', 'critical'].includes(v.impact));
    expect(graves, JSON.stringify(graves.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))).toEqual([]);

    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(sobra).toBeLessThanOrEqual(0);
  });
}

// Um Lead do Pixel por envio (docs/specs/design/atribuicao-utm.md): reabrir a obrigada
// ou visitá-la sem eid não pode contar outro Lead na Meta.
const leads = (page) => page.evaluate(() =>
  (window.fbq.queue || []).map((a) => Array.from(a)).filter((a) => a[0] === 'track' && a[1] === 'Lead'));

test('Pixel: um Lead por eid, nenhum sem eid', async ({ page }) => {
  await simularApi(page, { link: erro('indisponivel') });

  await page.goto(URL_OBRIGADA);
  expect(await leads(page)).toEqual([['track', 'Lead', {}, { eventID: 'evento-de-teste' }]]);

  await page.reload();
  expect(await leads(page)).toEqual([]);

  await page.evaluate(() => localStorage.removeItem('ld'));
  await page.goto('/obrigada.html');
  expect(await leads(page)).toEqual([]);
});

// ---------------------------------------------------------------------------
// Fechamento do gerente (publicado em 27/10) — docs/specs/design/formulario-dois-caminhos.md
// be_perfil é a conveniência de renderização que o formulário grava; aqui é gravado direto.
// ---------------------------------------------------------------------------

async function comPerfil(page, perfil) {
  await page.addInitScript((p) => localStorage.setItem('be_perfil', JSON.stringify(p)), perfil);
  await page.goto('/obrigada.html'); // sem eid: sem cartão, só o fechamento
}
const gerente = (extra) => ({ caminho: 'gerente', nome: 'Gil', pessoas: '3 a 5', desafio: 'Outro', objetivo: 'Outro', ...extra });

// Vários comPerfil na mesma página: o init script registrado por último roda por último e vence.

test('gerente: um fechamento por maior desafio, com o time e o nome preenchidos', async ({ page }) => {
  const esperado = {
    'O time me procura para quase tudo': 'Gil, liderar um time de 3 a 5 pessoas que te procura para quase tudo deixa o seu próprio trabalho para o fim do dia. Na sessão vamos definir o que o time pode decidir sem você.',
    'Preciso cobrar pendências uma por uma': 'Gil, com um time de 3 a 5 pessoas, cobrar pendência por pendência ocupa o dia inteiro. Na sessão vamos montar uma rotina para você acompanhar as entregas sem perguntar uma por uma.',
    'Tenho dificuldade de cobrar e dar retorno sem desgastar a relação': 'Gil, com um time de 3 a 5 pessoas, cobrar e dar retorno sem uma rotina vira conversa difícil. Na sessão vamos combinar quando e como o retorno acontece.',
    'Sou cobrado pelo resultado, mas não consigo mostrar o que o time entrega': 'Gil, você responde pelo resultado de um time de 3 a 5 pessoas, mas o que o time entrega não aparece. Na sessão vamos organizar o registro das entregas para o resultado ficar visível.',
    Outro: 'Gil, liderar um time de 3 a 5 pessoas traz questões bem específicas. Na sessão vamos olhar como você conduz o time hoje e por onde começar a mudar.',
  };
  for (const [desafio, texto] of Object.entries(esperado)) {
    await comPerfil(page, gerente({ desafio }));
    await expect(page.locator('#titulo'), desafio).toHaveText('Aplicação recebida, Gil.');
    await expect(page.locator('#fechamento'), desafio).toHaveText(texto);
    expect(await page.locator('#fechamento').textContent()).not.toMatch(/[\[\]]/);
  }
});

test('gerente: [Pessoas] muda com pessoas lideradas', async ({ page }) => {
  for (const [pessoas, forma] of [['3 a 5', 'um time de 3 a 5 pessoas'], ['6 a 10', 'um time de 6 a 10 pessoas'], ['11 a 20', 'um time de 11 a 20 pessoas'], ['Mais de 20', 'um time de mais de 20 pessoas']]) {
    await comPerfil(page, gerente({ pessoas, desafio: 'O time me procura para quase tudo' }));
    await expect(page.locator('#fechamento'), pessoas).toContainText(`liderar ${forma} que te procura`);
  }
});

test('gerente: frase final por objetivo em 12 meses ("Outro" fica sem frase)', async ({ page }) => {
  const frases = {
    'Ser reconhecido pelo resultado do time': 'E vamos ver como o resultado do seu time aparece para quem avalia o seu trabalho.',
    'Crescer de cargo': 'E vamos ver como essa mudança prepara você para o próximo cargo.',
    'Ter tempo para o trabalho que só eu faço': 'E vamos ver quanto tempo isso devolve para o trabalho que só você faz.',
    'Liderar com menos desgaste': 'E vamos ver como fazer isso com menos desgaste para você e para o time.',
    Outro: '',
  };
  const base = 'Gil, liderar um time de 3 a 5 pessoas traz questões bem específicas. Na sessão vamos olhar como você conduz o time hoje e por onde começar a mudar.';
  for (const [objetivo, frase] of Object.entries(frases)) {
    await comPerfil(page, gerente({ objetivo }));
    await expect(page.locator('#fechamento'), objetivo).toHaveText(frase ? `${base} ${frase}` : base);
  }
});

test('gerente: sem nome a frase abre sem vocativo e o título fica sem nome', async ({ page }) => {
  await comPerfil(page, gerente({ nome: '', desafio: 'O time me procura para quase tudo' }));
  await expect(page.locator('#titulo')).toHaveText('Aplicação recebida.');
  const texto = await page.locator('#fechamento').textContent();
  expect(texto.startsWith('Liderar um time de 3 a 5 pessoas')).toBe(true);
});

test('gerente: perfil incompleto ou corrompido cai no agradecimento genérico', async ({ page }) => {
  for (const perfil of [gerente({ pessoas: 'inventado' }), gerente({ desafio: 'inventado' }), { caminho: 'gerente' }]) {
    await comPerfil(page, perfil);
    await expect(page.locator('#titulo')).toHaveText('Solicitação Recebida');
    await expect(page.locator('#fechamento')).toBeHidden();
  }
});

test('empresário: o fechamento de sempre continua, com as faixas novas de equipe', async ({ page }) => {
  for (const [time, forma] of [['Menos de 3 colaboradores', 'um time de menos de 3 pessoas'], ['3 a 4 colaboradores', 'um time de 3 a 4 pessoas']]) {
    await comPerfil(page, { caminho: 'empresario', eixo: 'dependencia', segmento: 'agencia', nome: 'Eva', time, faturamento: 'Até R$ 30 mil/mês' });
    await expect(page.locator('#fechamento'), time).toHaveText(`Eva, tocar uma agência com ${forma} e faturamento de até R$ 30 mil/mês aprovando cada entrega final limita a capacidade da empresa. Na sessão vamos alinhar onde e como passar autonomia para o time.`);
  }
});
