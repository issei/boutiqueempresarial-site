// Contrato da página /agendar — docs/specs/pages/agendar.md §11 (critérios 2, 3, 5, 8 na
// parte de carregamento, 12 a 15 e 17). O fluxo de usuário está em e2e/agendar.spec.js.
// A API do CRM é sempre simulada (page.route) a partir de tests/fixtures/agendar/.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { existsSync, readFileSync } from 'node:fs';
import {
  SLOTS, RESERVA, SEM_HORARIO, VERSAO, TOKEN, URL_AGENDAR, API,
  bloquearTerceiros, simularApi, ok, erro,
} from './fixtures/agendar/mock.js';

const PAGINA = '/agendar.html';

test.beforeEach(async ({ page }) => {
  await bloquearTerceiros(page);
});

const violacoesGraves = async (page) => {
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations
    .filter((v) => ['serious', 'critical'].includes(v.impact))
    .map((v) => `${v.id} (${v.nodes.length}×)`)
    .join(', ');
};

test.describe('agendar: head e indexação', () => {
  test('noindex, sem canonical, OG, Twitter nem JSON-LD; referrer desligado', async ({ page }) => {
    await simularApi(page, { slots: ok(SLOTS.semAgendamento) });
    await page.goto(URL_AGENDAR);
    const meta = (sel, at = 'content') => page.evaluate(([s, a]) => document.querySelector(s)?.getAttribute(a) ?? null, [sel, at]);
    expect(await meta('meta[name="robots"]')).toContain('noindex');
    expect(await meta('meta[name="referrer"]')).toBe('no-referrer');
    expect(await meta('link[rel="canonical"]', 'href')).toBeNull();
    expect(await meta('meta[property="og:title"]')).toBeNull();
    expect(await page.locator('script[type="application/ld+json"]').count()).toBe(0);
    expect(await page.title()).toBe('Agendar Diagnóstico Gratuito | Boutique Empresarial');
  });

  test('a rota não aparece no sitemap gerado', async () => {
    const arquivo = new URL('../dist/sitemap.xml', import.meta.url);
    test.skip(!existsSync(arquivo), 'sem dist/: o gate roda o build antes dos testes');
    expect(readFileSync(arquivo, 'utf8')).not.toContain('/agendar');
  });

  test('o script que captura o token vem antes do consentimento, do Pixel e do gtag', async ({ page }) => {
    const html = (await (await page.request.get(PAGINA)).body()).toString('utf8');
    const captura = html.indexOf('be_agendar_t');
    const consent = html.indexOf('be_consent');
    const pixel = html.indexOf('fbevents.js');
    const gtag = html.indexOf('googletagmanager.com/gtag/js');
    expect(captura, 'captura do token ausente').toBeGreaterThan(-1);
    expect(captura, 'captura depois do consentimento').toBeLessThan(consent);
    expect(consent).toBeLessThan(pixel);
    expect(pixel).toBeLessThan(gtag);
  });
});

test.describe('agendar: o token não vaza', () => {
  test('hash limpo, token na sessionStorage e em nenhuma requisição a terceiros', async ({ page }) => {
    const pedidos = [];
    const consoles = [];
    page.on('request', (r) => pedidos.push({ url: r.url(), corpo: r.postData() ?? '', headers: JSON.stringify(r.headers()) }));
    page.on('console', (m) => consoles.push(m.text()));
    await simularApi(page, { slots: ok(SLOTS.semAgendamento) });

    await page.goto(URL_AGENDAR);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Escolha o melhor horário/);

    expect(await page.evaluate(() => location.hash)).toBe('');
    expect(await page.evaluate(() => location.href)).not.toContain(TOKEN);
    expect(await page.evaluate(() => sessionStorage.getItem('be_agendar_t'))).toBe(TOKEN);
    expect(await page.evaluate(() => JSON.stringify(window.dataLayer))).not.toContain(TOKEN);
    expect(await page.content()).not.toContain(TOKEN);
    expect(consoles.join('\n')).not.toContain(TOKEN);

    for (const p of pedidos) {
      const daApi = p.url.startsWith(API);
      expect(p.url, `token na URL de ${p.url}`).not.toContain(TOKEN);
      expect(p.headers, `token em cabeçalho de ${p.url}`).not.toContain(TOKEN);
      if (!daApi) expect(p.corpo, `token no corpo de ${p.url}`).not.toContain(TOKEN);
    }
    const slots = pedidos.filter((p) => p.url === `${API}/slots`);
    expect(slots).toHaveLength(1);
    expect(JSON.parse(slots[0].corpo)).toEqual({ token: TOKEN });
  });

  test('token fora do formato é descartado e o link é inválido', async ({ page }) => {
    const chamadas = await simularApi(page, {});
    await page.goto('/agendar.html#t=curto');
    await expect(page.getByText('Este link não é válido.')).toBeVisible();
    expect(await page.evaluate(() => location.hash)).toBe('');
    expect(await page.evaluate(() => sessionStorage.getItem('be_agendar_t'))).toBeNull();
    expect(chamadas).toHaveLength(0);
  });

  test('recarregar na mesma aba mantém o fluxo; aba nova sem o link é inválida', async ({ page, context }) => {
    const chamadas = await simularApi(page, { slots: ok(SLOTS.semAgendamento) });
    await page.goto(URL_AGENDAR);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Escolha o melhor horário/);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Escolha o melhor horário/);
    expect(chamadas.map((c) => c.corpo.token)).toEqual([TOKEN, TOKEN]);

    const outra = await context.newPage();
    const chamadasOutra = await simularApi(outra, { slots: ok(SLOTS.semAgendamento) });
    await outra.goto(PAGINA);
    await expect(outra.getByText('Este link não é válido.')).toBeVisible();
    expect(chamadasOutra).toHaveLength(0);
  });
});

test.describe('agendar: erros ao carregar os horários (§6.6)', () => {
  const casos = [
    ['404 link inexistente', () => erro('nao_encontrado'), 'Este link não é válido.', 'contato'],
    ['410 expirado ou revogado', () => erro('link_expirado'), 'Este link expirou. Fale com a gente e enviamos um novo.', 'contato'],
    ['409 lead_nao_agendavel', () => erro('lead_nao_agendavel'), 'Nossa equipe já está em contato com você. Se precisar mudar algo, fale com a gente.', 'contato'],
    ['422 corpo inválido', () => erro('corpo_invalido'), 'Este link não é válido.', 'contato'],
    ['503 indisponível', () => erro('indisponivel'), 'Não conseguimos carregar os horários agora. Tente de novo em alguns minutos.', 'retry'],
    ['500 erro interno', () => erro('erro_interno'), 'Não conseguimos carregar os horários agora. Tente de novo em alguns minutos.', 'retry'],
    ['rede fora do ar', () => 'abortar', 'Não conseguimos carregar os horários agora. Tente de novo em alguns minutos.', 'retry'],
    ['dias vazio', () => ok(SLOTS.derivadas.semHorarios), 'No momento não há horários disponíveis. Fale com a gente e encontramos um horário.', 'contato'],
  ];

  for (const [nome, resposta, mensagem, acao] of casos) {
    test(nome, async ({ page }) => {
      await simularApi(page, { slots: resposta });
      await page.goto(URL_AGENDAR);
      await expect(page.locator('#erro-msg')).toHaveText(mensagem);
      await expect(page.locator('#erro-contato')).toBeVisible({ visible: acao === 'contato' });
      await expect(page.locator('#erro-contato')).toHaveAttribute('href', /^mailto:talita@boutiqueempresarial\.com\.br$/);
      await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible({ visible: acao === 'retry' });
      // Nenhum horário de resposta anterior sobrevive ao erro.
      await expect(page.locator('#est-escolha')).toBeHidden();
    });
  }

  test('"Tentar novamente" refaz a consulta e mostra os horários', async ({ page }) => {
    await simularApi(page, { slots: (_, n) => (n === 1 ? erro('indisponivel') : ok(SLOTS.semAgendamento)) });
    await page.goto(URL_AGENDAR);
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Escolha o melhor horário/);
  });

  test('com a API fora do ar a página falha de forma legível', async ({ page }) => {
    await page.route(`${API}/**`, (r) => r.abort('failed'));
    await page.goto(URL_AGENDAR);
    await expect(page.locator('#erro-msg')).toContainText('Não conseguimos carregar os horários agora');
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  });
});

test.describe('agendar: acessibilidade em todos os estados', () => {
  test('carregando', async ({ page }) => {
    let liberar;
    const pendente = new Promise((r) => { liberar = r; });
    await simularApi(page, { slots: () => pendente });
    await page.goto(URL_AGENDAR);
    await expect(page.locator('#est-carregando')).toBeVisible();
    await expect(page.locator('#conteudo')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('.ag-opcao')).toHaveCount(0); // nenhum horário antes da resposta
    expect(await violacoesGraves(page), 'axe em carregando').toBe('');
    liberar(ok(SLOTS.semAgendamento));
    await expect(page.locator('#conteudo')).toHaveAttribute('aria-busy', 'false');
  });

  test('escolha, com dia e horário marcados', async ({ page }) => {
    await simularApi(page, { slots: ok(SLOTS.semAgendamento) });
    await page.goto(URL_AGENDAR);
    await page.getByRole('radio', { name: '06/10, terça-feira' }).check();
    await page.getByRole('radio', { name: '10:00' }).check();
    expect(await violacoesGraves(page), 'axe em escolha').toBe('');
  });

  for (const [nome, resposta] of [['com e-mail enviado', SEM_HORARIO.comEmail], ['sem e-mail', SEM_HORARIO.semEmail]]) {
    test(`sem horário ${nome}`, async ({ page }) => {
      await simularApi(page, { slots: ok(SLOTS.semAgendamento), 'sem-horario': ok(resposta) });
      await page.goto(URL_AGENDAR);
      await page.getByRole('button', { name: 'Nenhum horário funciona para mim' }).click();
      await expect(page.locator('#est-sem-horario')).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
      await expect(page.locator('#anuncio')).toHaveText('Combinado, vamos encontrar outro horário');
      expect(await violacoesGraves(page), 'axe em sem horário').toBe('');
    });
  }

  test('confirmado, com e sem link do Meet, e sem poder alterar', async ({ page }) => {
    for (const resposta of [SLOTS.comAgendamento, SLOTS.derivadas.naoPodeAlterar]) {
      await page.unrouteAll();
      await simularApi(page, { slots: ok(resposta) });
      await page.goto(URL_AGENDAR);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Diagnóstico agendado');
      expect(await violacoesGraves(page), 'axe em confirmado').toBe('');
    }
  });

  test('cancelamento inline aberto', async ({ page }) => {
    await simularApi(page, { slots: ok(SLOTS.comAgendamento) });
    await page.goto(URL_AGENDAR);
    await page.getByRole('button', { name: 'Cancelar agendamento' }).click();
    await expect(page.getByText('Cancelar este horário?')).toBeVisible();
    expect(await violacoesGraves(page), 'axe em cancelar').toBe('');
  });

  for (const code of ['nao_encontrado', 'link_expirado', 'lead_nao_agendavel', 'indisponivel']) {
    test(`erro ${code}`, async ({ page }) => {
      await simularApi(page, { slots: erro(code) });
      await page.goto(URL_AGENDAR);
      await expect(page.locator('#est-erro')).toBeVisible();
      expect(await violacoesGraves(page), `axe em ${code}`).toBe('');
    });
  }

  test('sem horários', async ({ page }) => {
    await simularApi(page, { slots: ok(SLOTS.derivadas.semHorarios) });
    await page.goto(URL_AGENDAR);
    await expect(page.locator('#est-erro')).toBeVisible();
    expect(await violacoesGraves(page), 'axe sem horários').toBe('');
  });

  test('link inválido (aba sem o hash)', async ({ page }) => {
    await page.goto(PAGINA);
    await expect(page.getByText('Este link não é válido.')).toBeVisible();
    expect(await violacoesGraves(page), 'axe em link inválido').toBe('');
  });

  test('cada troca de estado leva o foco ao título e o anuncia', async ({ page }) => {
    await simularApi(page, { slots: ok(SLOTS.semAgendamento) });
    await page.goto(URL_AGENDAR);
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeFocused();
    await expect(page.locator('#anuncio')).toHaveText(await h1.innerText());
  });

  test('o teclado alcança todos os controles', async ({ page }) => {
    await simularApi(page, { slots: ok(SLOTS.derivadas.doisDias) });
    await page.goto(URL_AGENDAR);
    await expect(page.locator('#est-escolha')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await page.keyboard.press('Tab'); // título tem foco programático: o próximo Tab vai ao 1º focável
    const alvo = async () => page.evaluate(() => document.activeElement?.id || document.activeElement?.name || document.activeElement?.tagName);
    // dia (radio) → seta escolhe outro → Tab vai ao horário; Confirmar está desabilitado (sem horário), então o próximo foco é "Nenhum horário…"
    expect(await alvo()).toBe('dia');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: '07/10, quarta-feira' })).toBeChecked();
    await page.keyboard.press('Tab');
    expect(await alvo()).toBe('horario');
    await page.keyboard.press('Tab');
    expect(await alvo()).toBe('sem-horario');
  });
});

test.describe('agendar: layout', () => {
  test('sem scroll horizontal em 375px nos estados de escolha, confirmado e erro', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const respostas = [SLOTS.semAgendamento, SLOTS.comAgendamento, erro('indisponivel')];
    for (const r of respostas) {
      await page.unrouteAll();
      await simularApi(page, { slots: r.body ? r : ok(r) });
      await page.goto(URL_AGENDAR);
      await expect(page.locator('h1')).toBeFocused();
      const excedente = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(excedente).toBeLessThanOrEqual(1);
    }
  });

  test('zoom de 200% (viewport de 320px) não perde conteúdo nem gera scroll horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await simularApi(page, { slots: ok(SLOTS.semAgendamento) });
    await page.goto(URL_AGENDAR);
    await page.getByRole('radio', { name: '06/10, terça-feira' }).check();
    await expect(page.getByRole('button', { name: 'Confirmar horário' })).toBeVisible();
    const excedente = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(excedente).toBeLessThanOrEqual(1);
  });

  test('alvos de toque com pelo menos 44px', async ({ page }) => {
    await simularApi(page, { slots: ok(SLOTS.semAgendamento) });
    await page.goto(URL_AGENDAR);
    await page.getByRole('radio', { name: '06/10, terça-feira' }).check();
    for (const alvo of await page.locator('.ag-opcao span, #confirmar, #sem-horario').all()) {
      expect((await alvo.boundingBox()).height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('agendar: copy e fixtures', () => {
  test('copy sem os termos proibidos do §B6 e com o vocabulário controlado', () => {
    const fonte = ['../src/agendar.html', '../src/js/agendar.js']
      .map((f) => readFileSync(new URL(f, import.meta.url), 'utf8')).join('\n');
    expect(fonte).not.toMatch(/revolucion|disruptiv|game-changer|solu[çc][ãa]o completa|de [úu]ltima gera[çc][ãa]o|\bgarante|\belimina|\bassegura/i);
    expect(fonte).not.toContain('Diagnóstico de Estabilidade');
    expect(fonte).toContain('Diagnóstico Gratuito');
    expect(fonte, 'a duração vem da API, nunca fixa').not.toMatch(/45 minutos/);
    expect(fonte, 'sem diálogo nativo').not.toMatch(/[ .](confirm|alert|prompt)[(]/);
  });

  test('fixtures vêm do OpenAPI e a versão está registrada', () => {
    expect(VERSAO).toMatch(/^\d+\.\d+\.\d+$/);
    expect(SLOTS.semAgendamento.fuso).toBe('America/Sao_Paulo');
    expect(RESERVA.reservar.comMeet.meet_url).toMatch(/^https:\/\/meet\.google\.com\//);
  });
});
