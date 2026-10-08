// Fluxo de usuário da página /agendar — docs/specs/pages/agendar.md §11 (critérios 4, 6 a 11 e 16)
// e docs/specs/design/agendar-sem-horario.md (botão desabilitado, "Nenhum horário funciona para mim").
// Toda a API do CRM é simulada com as fixtures de tests/fixtures/agendar/; Pixel e GTM abortados.
import { test, expect } from '@playwright/test';
import {
  SLOTS, RESERVA, SEM_HORARIO, TOKEN, URL_AGENDAR, API,
  bloquearTerceiros, simularApi, ok, erro,
} from '../tests/fixtures/agendar/mock.js';

test.beforeEach(async ({ page }) => {
  await bloquearTerceiros(page);
  // window.confirm nunca é usado: qualquer diálogo nativo reprova o teste.
  page.on('dialog', (d) => { throw new Error(`diálogo nativo inesperado: ${d.message()}`); });
});

// A reserva devolve o horário pedido (a fixture do OpenAPI traz outra data de exemplo).
const reservaDe = (base) => (c) => ok({ ...base, inicio: c.corpo.inicio, fim: new Date(Date.parse(c.corpo.inicio) + 3600e3).toISOString() }, 201);

const h1 = (page) => page.getByRole('heading', { level: 1 });
const confirmar = (page) => page.getByRole('button', { name: /^Confirma/ });

async function escolher(page, dia, hora) {
  await page.getByRole('radio', { name: dia }).check();
  await page.getByRole('radio', { name: hora }).check();
}

test.describe('fluxo feliz', () => {
  // O horário é de Brasília mesmo com o aparelho em Tóquio (UTC+9).
  test.use({ timezoneId: 'Asia/Tokyo' });

  test('carrega, escolhe, confirma e mostra data por extenso no fuso de Brasília', async ({ page }) => {
    const chamadas = await simularApi(page, { slots: ok(SLOTS.semAgendamento), reservar: reservaDe(RESERVA.reservar.comMeet) });
    await page.goto(URL_AGENDAR);

    await expect(h1(page)).toHaveText('Escolha o melhor horário para o seu Diagnóstico Operacional');
    await expect(page.locator('#subtitulo')).toContainText('Ana, a conversa dura 60 minutos e acontece por Google Meet');
    await expect(page.getByRole('radio', { name: '09:00' })).toHaveCount(0); // só depois de escolher o dia

    await escolher(page, '06/10, terça-feira', '10:00');
    await confirmar(page).click();

    await expect(h1(page)).toHaveText('Diagnóstico agendado');
    await expect(page.locator('#conf-texto')).toHaveText('Diagnóstico agendado para 06/10, terça-feira, às 10h (horário de Brasília)');
    const meet = page.getByRole('link', { name: 'Abrir o Google Meet' });
    await expect(meet).toHaveAttribute('href', 'https://meet.google.com/abc-defg-hij');
    await expect(meet).toHaveAttribute('rel', /noopener/);
    await expect(page.getByRole('button', { name: 'Remarcar' })).toBeVisible();

    const reserva = chamadas.find((c) => c.rota === 'reservar');
    expect(reserva.corpo).toEqual({ token: TOKEN, inicio: '2026-10-06T10:00:00-03:00' });
    expect(reserva.chave).toMatch(/^[0-9a-f-]{36}$/);
    expect(reserva.headers['content-type']).toContain('application/json');
  });

  test('convite do Meet ainda pendente: mostra o aviso em vez do botão', async ({ page }) => {
    await simularApi(page, { slots: ok(SLOTS.semAgendamento), reservar: ok(RESERVA.reservar.convitePendente, 201) });
    await page.goto(URL_AGENDAR);
    await escolher(page, '06/10, terça-feira', '11:00');
    await confirmar(page).click();
    await expect(page.getByText('O convite do Google Agenda chega ao seu e-mail com o link do Meet.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abrir o Google Meet' })).toBeHidden();
  });
});

test.describe('agendamento existente', () => {
  test('abre em Confirmado com Remarcar e Cancelar', async ({ page }) => {
    await simularApi(page, { slots: ok(SLOTS.comAgendamento) });
    await page.goto(URL_AGENDAR);
    await expect(h1(page)).toHaveText('Diagnóstico agendado');
    await expect(page.locator('#conf-texto')).toHaveText('Diagnóstico agendado para 08/10, quinta-feira, às 10h (horário de Brasília)');
    await expect(page.getByRole('button', { name: 'Remarcar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancelar agendamento' })).toBeVisible();
  });

  test('pode_alterar = false: sem Remarcar nem Cancelar, com o contato alternativo', async ({ page }) => {
    await simularApi(page, { slots: ok(SLOTS.derivadas.naoPodeAlterar) });
    await page.goto(URL_AGENDAR);
    await expect(h1(page)).toHaveText('Diagnóstico agendado');
    await expect(page.getByRole('button', { name: 'Remarcar' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Cancelar agendamento' })).toBeHidden();
    await expect(page.locator('#conf-contato a')).toHaveAttribute('href', 'mailto:talita@boutiqueempresarial.com.br');
    await expect(page.getByText('O convite do Google Agenda chega ao seu e-mail com o link do Meet.')).toBeVisible();
  });

  test('remarcar: mostra o horário atual, confirma o novo e volta a Confirmado', async ({ page }) => {
    const chamadas = await simularApi(page, { slots: ok(SLOTS.comAgendamento), remarcar: ok(RESERVA.remarcar) });
    await page.goto(URL_AGENDAR);
    await page.getByRole('button', { name: 'Remarcar' }).click();

    await expect(h1(page)).toHaveText('Escolha o novo horário');
    await expect(page.locator('#atual')).toHaveText('Horário atual: 08/10, quinta-feira, às 10h (horário de Brasília).');
    await escolher(page, '09/10, sexta-feira', '09:00');
    await confirmar(page).click();

    await expect(page.locator('#conf-texto')).toHaveText('Diagnóstico agendado para 09/10, sexta-feira, às 9h (horário de Brasília)');
    const remarcar = chamadas.find((c) => c.rota === 'remarcar');
    expect(remarcar.corpo).toEqual({ token: TOKEN, inicio: '2026-10-09T09:00:00-03:00' });
    expect(remarcar.chave).toBeTruthy();
  });

  test('remarcar: "Manter o horário atual" volta sem chamar a API de remarcação', async ({ page }) => {
    const chamadas = await simularApi(page, { slots: ok(SLOTS.comAgendamento) });
    await page.goto(URL_AGENDAR);
    await page.getByRole('button', { name: 'Remarcar' }).click();
    await page.getByRole('button', { name: 'Manter o horário atual' }).click();
    await expect(h1(page)).toHaveText('Diagnóstico agendado');
    expect(chamadas.some((c) => c.rota === 'remarcar')).toBe(false);
  });

  test('cancelar: confirmação inline, sem window.confirm; depois volta à escolha', async ({ page }) => {
    const chamadas = await simularApi(page, {
      slots: (_, n) => ok(n === 1 ? SLOTS.comAgendamento : SLOTS.semAgendamento),
      cancelar: ok(RESERVA.cancelar),
    });
    await page.goto(URL_AGENDAR);
    await page.getByRole('button', { name: 'Cancelar agendamento' }).click();
    await expect(page.getByText('Cancelar este horário?')).toBeVisible();

    // "Manter" desfaz sem chamar a API.
    await page.getByRole('button', { name: 'Manter', exact: true }).click();
    await expect(page.getByText('Cancelar este horário?')).toBeHidden();
    expect(chamadas.some((c) => c.rota === 'cancelar')).toBe(false);

    await page.getByRole('button', { name: 'Cancelar agendamento' }).click();
    await page.getByRole('button', { name: 'Sim, cancelar' }).click();
    await expect(page.locator('#aviso')).toHaveText('Agendamento cancelado. Se quiser, escolha outro horário.');
    await expect(h1(page)).toHaveText('Escolha o melhor horário para o seu Diagnóstico Operacional');
    const cancelar = chamadas.find((c) => c.rota === 'cancelar');
    expect(cancelar.corpo).toEqual({ token: TOKEN });
    expect(cancelar.chave).toBeTruthy();
  });
});

test.describe('erros ao reservar, remarcar e cancelar (§6.6)', () => {
  const reservarComErro = async (page, resposta) => {
    const chamadas = await simularApi(page, { slots: ok(SLOTS.semAgendamento), reservar: resposta });
    await page.goto(URL_AGENDAR);
    await escolher(page, '06/10, terça-feira', '10:00');
    await confirmar(page).click();
    return chamadas;
  };

  test('409 horario_indisponivel: mensagem, horários recarregados e dia mantido', async ({ page }) => {
    const restantes = { ...SLOTS.semAgendamento, dias: [{ data: '2026-10-06', horarios: ['2026-10-06T09:00:00-03:00', '2026-10-06T11:00:00-03:00'] }] };
    const chamadas = await simularApi(page, {
      slots: (_, n) => ok(n === 1 ? SLOTS.semAgendamento : restantes),
      reservar: erro('horario_indisponivel'),
    });
    await page.goto(URL_AGENDAR);
    await escolher(page, '06/10, terça-feira', '10:00');
    await confirmar(page).click();

    await expect(page.locator('#alerta')).toHaveText('Esse horário acabou de ser reservado. Escolha outro.');
    expect(chamadas.filter((c) => c.rota === 'slots')).toHaveLength(2);
    await expect(page.getByRole('radio', { name: '06/10, terça-feira' })).toBeChecked();
    await expect(page.getByRole('radio', { name: '10:00' })).toHaveCount(0);
    await expect(page.getByRole('radio', { name: '11:00' })).toBeVisible();
  });

  test('422: volta à escolha com a mensagem', async ({ page }) => {
    await reservarComErro(page, erro('corpo_invalido'));
    await expect(page.locator('#alerta')).toHaveText('Não foi possível confirmar. Escolha o horário de novo.');
    await expect(page.getByRole('radio', { name: '09:00' })).toBeVisible();
  });

  test('429: pede para aguardar e oferece nova tentativa', async ({ page }) => {
    await reservarComErro(page, erro('muitas_tentativas'));
    await expect(page.locator('#erro-msg')).toHaveText('Muitas tentativas. Aguarde um instante e tente de novo.');
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
  });

  test('503: mensagem de indisponibilidade e nova tentativa', async ({ page }) => {
    await reservarComErro(page, erro('indisponivel'));
    await expect(page.locator('#erro-msg')).toHaveText('Não conseguimos carregar os horários agora. Tente de novo em alguns minutos.');
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
  });

  test('409 conflito: pede para tentar de novo em instantes', async ({ page }) => {
    await reservarComErro(page, erro('conflito'));
    await expect(page.locator('#erro-msg')).toHaveText('Outra operação está em andamento. Tente de novo em instantes.');
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
  });

  test('409 lead_nao_agendavel ao reservar: contato alternativo', async ({ page }) => {
    await reservarComErro(page, erro('lead_nao_agendavel'));
    await expect(page.locator('#erro-msg')).toHaveText('Nossa equipe já está em contato com você. Se precisar mudar algo, fale com a gente.');
    await expect(page.getByRole('link', { name: 'Falar com a gente' })).toBeVisible();
  });

  test('410 link expirado ao reservar: contato alternativo', async ({ page }) => {
    await reservarComErro(page, erro('link_expirado'));
    await expect(page.locator('#erro-msg')).toHaveText('Este link expirou. Fale com a gente e enviamos um novo.');
  });

  test('409 fora_do_prazo ao remarcar: contato alternativo', async ({ page }) => {
    await simularApi(page, { slots: ok(SLOTS.comAgendamento), remarcar: erro('fora_do_prazo') });
    await page.goto(URL_AGENDAR);
    await page.getByRole('button', { name: 'Remarcar' }).click();
    await escolher(page, '09/10, sexta-feira', '09:00');
    await confirmar(page).click();
    await expect(page.locator('#erro-msg')).toHaveText('Faltando pouco para a conversa, alterações são feitas com a nossa equipe.');
    await expect(page.getByRole('link', { name: 'Falar com a gente' })).toBeVisible();
  });

  test('409 fora_do_prazo ao cancelar: contato alternativo', async ({ page }) => {
    await simularApi(page, { slots: ok(SLOTS.comAgendamento), cancelar: erro('fora_do_prazo') });
    await page.goto(URL_AGENDAR);
    await page.getByRole('button', { name: 'Cancelar agendamento' }).click();
    await page.getByRole('button', { name: 'Sim, cancelar' }).click();
    await expect(page.locator('#erro-msg')).toHaveText('Faltando pouco para a conversa, alterações são feitas com a nossa equipe.');
  });
});

test.describe('Idempotency-Key e clique duplo', () => {
  test('repetir a mesma ação após falha de rede reaproveita a chave', async ({ page }) => {
    const chamadas = await simularApi(page, {
      slots: ok(SLOTS.semAgendamento),
      reservar: (_, n) => (n === 1 ? 'abortar' : ok(RESERVA.reservar.comMeet, 201)),
    });
    await page.goto(URL_AGENDAR);
    await escolher(page, '06/10, terça-feira', '10:00');
    await confirmar(page).click();
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(h1(page)).toHaveText('Diagnóstico agendado');

    const chaves = chamadas.filter((c) => c.rota === 'reservar').map((c) => c.chave);
    expect(chaves).toHaveLength(2);
    expect(chaves[0]).toBe(chaves[1]);
  });

  test('outro horário, ou nova tentativa depois de resposta definitiva, gera chave nova', async ({ page }) => {
    const chamadas = await simularApi(page, {
      slots: ok(SLOTS.semAgendamento),
      reservar: (_, n) => (n === 1 ? erro('horario_indisponivel') : ok(RESERVA.reservar.comMeet, 201)),
    });
    await page.goto(URL_AGENDAR);
    await escolher(page, '06/10, terça-feira', '10:00');
    await confirmar(page).click();
    await expect(page.locator('#alerta')).toBeVisible();
    await page.getByRole('radio', { name: '11:00' }).check();
    await confirmar(page).click();
    await expect(h1(page)).toHaveText('Diagnóstico agendado');

    const reservas = chamadas.filter((c) => c.rota === 'reservar');
    expect(reservas[1].corpo.inicio).toBe('2026-10-06T11:00:00-03:00');
    expect(reservas[1].chave).not.toBe(reservas[0].chave);
  });
});

test.describe('botão Confirmar', () => {
  test('fica desabilitado até haver dia e horário e volta a desabilitar ao trocar de dia', async ({ page }) => {
    const chamadas = await simularApi(page, { slots: ok(SLOTS.derivadas.doisDias) });
    await page.goto(URL_AGENDAR);
    const botao = confirmar(page);

    await expect(botao).toBeDisabled();
    await expect(botao).toHaveAttribute('aria-disabled', 'true');
    await expect(botao).toHaveCSS('cursor', 'not-allowed');
    await expect(botao).toHaveCSS('opacity', '0.45');

    await page.getByRole('radio', { name: '06/10, terça-feira' }).check(); // só o dia
    await expect(botao).toBeDisabled();

    await page.getByRole('radio', { name: '10:00' }).check();
    await expect(botao).toBeEnabled();
    await expect(botao).toHaveAttribute('aria-disabled', 'false');
    await expect(botao).toHaveCSS('opacity', '1');

    await page.getByRole('radio', { name: '07/10, quarta-feira' }).check(); // trocar o dia zera a hora
    await expect(botao).toBeDisabled();
    expect(chamadas.some((c) => c.rota === 'reservar')).toBe(false);
  });

  test('clique duplo envia uma só requisição e o botão explica que está confirmando', async ({ page }) => {
    let liberar;
    const pendente = new Promise((r) => { liberar = r; });
    const chamadas = await simularApi(page, { slots: ok(SLOTS.semAgendamento), reservar: () => pendente });
    await page.goto(URL_AGENDAR);
    await escolher(page, '06/10, terça-feira', '10:00');

    const botao = confirmar(page);
    await botao.dblclick();
    await expect(botao).toHaveText('Confirmando...');
    await expect(botao).toHaveAttribute('aria-disabled', 'true');
    await expect(botao).not.toHaveAttribute('disabled', /.*/); // só aria-disabled: o foco não se perde durante o envio
    liberar(ok(RESERVA.reservar.comMeet, 201));
    await expect(h1(page)).toHaveText('Diagnóstico agendado');
    expect(chamadas.filter((c) => c.rota === 'reservar')).toHaveLength(1);
  });
});

test('o token só aparece no corpo JSON das 4 rotas, nunca em URL, cabeçalho ou console', async ({ page }) => {
  const pedidos = [];
  const consoles = [];
  page.on('request', (r) => pedidos.push({ url: r.url(), corpo: r.postData() ?? '', headers: JSON.stringify(r.headers()) }));
  page.on('console', (m) => consoles.push(m.text()));
  await simularApi(page, {
    slots: (_, n) => ok([SLOTS.semAgendamento, SLOTS.comAgendamento, SLOTS.semAgendamento][Math.min(n, 3) - 1]),
    reservar: ok(RESERVA.reservar.comMeet, 201),
    remarcar: ok(RESERVA.remarcar),
    cancelar: ok(RESERVA.cancelar),
  });
  await page.goto(URL_AGENDAR);
  await escolher(page, '06/10, terça-feira', '10:00');
  await confirmar(page).click();
  await expect(h1(page)).toHaveText('Diagnóstico agendado');
  await page.getByRole('button', { name: 'Remarcar' }).click();
  await escolher(page, '09/10, sexta-feira', '09:00');
  await confirmar(page).click();
  await expect(page.locator('#conf-texto')).toContainText('09/10, sexta-feira');
  await page.getByRole('button', { name: 'Cancelar agendamento' }).click();
  await page.getByRole('button', { name: 'Sim, cancelar' }).click();
  await expect(page.locator('#aviso')).toBeVisible();

  const daApi = pedidos.filter((p) => p.url.startsWith(API));
  expect([...new Set(daApi.map((p) => p.url.slice(API.length)))].sort()).toEqual(['/cancelar', '/remarcar', '/reservar', '/slots']);
  for (const p of daApi) expect(JSON.parse(p.corpo).token, p.url).toBe(TOKEN);
  for (const p of pedidos) {
    expect(p.url).not.toContain(TOKEN);
    expect(p.headers).not.toContain(TOKEN);
    if (!p.url.startsWith(API)) expect(p.corpo).not.toContain(TOKEN);
  }
  expect(consoles.join('\n')).not.toContain(TOKEN);
});

const semHorario = (page) => page.getByRole('button', { name: 'Nenhum horário funciona para mim' });

test.describe('Nenhum horário funciona para mim', () => {
  test('visível sem seleção completa e oculto com dia e horário', async ({ page }) => {
    await simularApi(page, { slots: ok(SLOTS.derivadas.doisDias) });
    await page.goto(URL_AGENDAR);

    await expect(semHorario(page)).toBeVisible();
    await expect(semHorario(page)).toBeEnabled();
    await page.getByRole('radio', { name: '06/10, terça-feira' }).check();
    await expect(semHorario(page)).toBeVisible();
    await page.getByRole('radio', { name: '10:00' }).check();
    await expect(semHorario(page)).toBeHidden();
    await page.getByRole('radio', { name: '07/10, quarta-feira' }).check();
    await expect(semHorario(page)).toBeVisible();
  });

  test('com e-mail enviado: estado novo, foco no título e copy do e-mail', async ({ page }) => {
    const chamadas = await simularApi(page, { slots: ok(SLOTS.semAgendamento), 'sem-horario': ok(SEM_HORARIO.comEmail) });
    await page.goto(URL_AGENDAR);
    await semHorario(page).click();

    await expect(h1(page)).toHaveText('Combinado, vamos encontrar outro horário');
    await expect(h1(page)).toBeFocused();
    await expect(page.locator('#anuncio')).toHaveText('Combinado, vamos encontrar outro horário');
    await expect(page.locator('#sh-email')).toBeVisible();
    await expect(page.locator('#sh-email')).toContainText('Enviamos para o seu e-mail um link para você agendar mais tarde');
    await expect(page.locator('#sh-contato')).toHaveText('A Talita também vai entrar em contato com você para combinar um horário que caiba na sua agenda.');

    const chamada = chamadas.find((c) => c.rota === 'sem-horario');
    expect(chamada.corpo).toEqual({ token: TOKEN });
    expect(chamada.chave).toBeTruthy();
  });

  test('sem e-mail (envio desligado ou falha): não promete e-mail', async ({ page }) => {
    await simularApi(page, { slots: ok(SLOTS.semAgendamento), 'sem-horario': ok(SEM_HORARIO.semEmail) });
    await page.goto(URL_AGENDAR);
    await semHorario(page).click();

    await expect(h1(page)).toHaveText('Combinado, vamos encontrar outro horário');
    await expect(page.locator('#sh-email')).toBeHidden();
    await expect(page.locator('#sh-contato')).toHaveText('A Talita vai entrar em contato com você para combinar um horário que caiba na sua agenda.');
    await expect(page.locator('#est-sem-horario')).not.toContainText('e-mail');
  });

  test('Ver os horários de novo volta à escolha com dia e horário zerados', async ({ page }) => {
    const chamadas = await simularApi(page, { slots: ok(SLOTS.semAgendamento), 'sem-horario': ok(SEM_HORARIO.comEmail) });
    await page.goto(URL_AGENDAR);
    await page.getByRole('radio', { name: '06/10, terça-feira' }).check();
    await semHorario(page).click();
    await page.getByRole('button', { name: 'Ver os horários de novo' }).click();

    await expect(h1(page)).toHaveText('Escolha o melhor horário para o seu Diagnóstico Operacional');
    await expect(page.getByRole('radio', { name: '06/10, terça-feira' })).not.toBeChecked();
    await expect(confirmar(page)).toBeDisabled();
    await expect(semHorario(page)).toBeVisible();
    expect(chamadas.filter((c) => c.rota === 'slots')).toHaveLength(2);
  });

  test('erro do CRM mostra a mensagem e repete com a mesma Idempotency-Key', async ({ page }) => {
    const chamadas = await simularApi(page, {
      slots: ok(SLOTS.semAgendamento),
      'sem-horario': (_c, n) => (n === 1 ? erro('indisponivel') : ok(SEM_HORARIO.comEmail)),
    });
    await page.goto(URL_AGENDAR);
    await semHorario(page).click();
    await expect(page.locator('#est-erro')).toBeVisible();
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(h1(page)).toHaveText('Combinado, vamos encontrar outro horário');

    const envios = chamadas.filter((c) => c.rota === 'sem-horario');
    expect(envios).toHaveLength(2);
    expect(envios[0].chave).toBe(envios[1].chave);
  });

  test('clique duplo envia uma só requisição', async ({ page }) => {
    let liberar;
    const pendente = new Promise((r) => { liberar = r; });
    const chamadas = await simularApi(page, { slots: ok(SLOTS.semAgendamento), 'sem-horario': () => pendente });
    await page.goto(URL_AGENDAR);
    await semHorario(page).dblclick();
    await expect(page.locator('#sem-horario')).toHaveText('Enviando...');
    await expect(page.locator('#sem-horario')).toHaveAttribute('aria-disabled', 'true');
    liberar(ok(SEM_HORARIO.comEmail));
    await expect(h1(page)).toHaveText('Combinado, vamos encontrar outro horário');
    expect(chamadas.filter((c) => c.rota === 'sem-horario')).toHaveLength(1);
  });

  test('no modo remarcar o botão não aparece', async ({ page }) => {
    await simularApi(page, { slots: ok(SLOTS.comAgendamento) });
    await page.goto(URL_AGENDAR);
    await page.getByRole('button', { name: 'Remarcar' }).click();
    await expect(page.locator('#est-escolha')).toBeVisible();
    await expect(semHorario(page)).toBeHidden();
  });
});
