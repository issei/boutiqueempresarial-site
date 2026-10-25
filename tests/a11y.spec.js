// Contrato WCAG 2.1 AA — HARNESS_AEO.md §B5.
// Itera por glob sobre src/*.html: página nova entra sozinha, sem lista manual.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { globSync } from 'glob';
import path from 'node:path';

const pages = globSync('src/*.html').map((f) => {
  const slug = path.parse(f).name;
  return { slug, url: slug === 'index' ? '/' : `/${slug}.html` };
});

for (const { slug, url } of pages) {
  test.describe(slug, () => {
    test('zero violações axe serious/critical', async ({ page }) => {
      await page.goto(url);
      const { violations } = await new AxeBuilder({ page })
        // Exceção registrada: `.ig-type-sample--ios` é um *espécime* do âmbar da
        // marca (#EAA034) na página interna de identidade visual — ele existe para
        // mostrar a cor, não para ser lido como UI. Recolorir falsificaria o guia.
        .exclude('.ig-type-sample--ios')
        .analyze();
      const graves = violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      // Compara a lista compacta, não o objeto do axe: a mensagem da asserção é
      // o que o gate-runner repassa, e um dump de 58 linhas não é diagnóstico.
      const resumo = graves.map((v) => `${v.id} (${v.nodes.length}×)`).join(', ');
      expect(resumo, `${slug}: violações graves`).toBe('');
    });

    test('exatamente um <h1>', async ({ page }) => {
      await page.goto(url);
      expect(await page.locator('h1').count(), `${slug}: contagem de <h1>`).toBe(1);
    });

    test('landmark <main> presente', async ({ page }) => {
      await page.goto(url);
      expect(await page.locator('main').count(), `${slug}: sem <main>`).toBeGreaterThan(0);
    });

    test('sem scroll horizontal em 375px', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(url);
      const excedente = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(excedente, `${slug}: transborda ${excedente}px em 375`).toBeLessThanOrEqual(1);
    });
  });
}

// Formulário com dois caminhos (docs/specs/design/formulario-dois-caminhos.md, critério 9): as
// opções longas do gerente (até 72 caracteres) cabem em 360 px sem rolagem horizontal e nenhuma
// etapa dos dois caminhos tem violação axe serious/critical. O glob acima só vê a 1ª etapa.
const RESPOSTAS = {
  maior_problema_gestao: 'Falta de padrão nas entregas e retrabalho',
  nome_completo: 'Maria Silva',
  whatsapp: '11987654321',
  email: 'maria@exemplo.com.br',
  modelo_negocio: 'Agência / Assessoria',
  tamanho_equipe: '5 a 15 colaboradores',
  faturamento_mensal: 'Até R$ 30 mil/mês',
  vinculo: 'CLT',
  pessoas_lideradas: '6 a 10',
  maior_desafio_gerente: 'Sou cobrado pelo resultado, mas não consigo mostrar o que o time entrega', // a mais longa (72)
  objetivo_12m: 'Ser reconhecido pelo resultado do time',
};
const CAMINHOS = [
  ['empresário', 'Sou dono ou sócio', 8],
  ['gerente', 'Lidero um time na empresa (gerente, coordenador, supervisor)', 8],
];

for (const [nome, posicao, total] of CAMINHOS) {
  test(`formulario (${nome}): 360px sem rolagem horizontal e axe sem serious/critical em cada etapa`, async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('be_consent', JSON.stringify({ v: 1, ts: '2026-01-01T00:00:00.000Z', cat: { analytics: true, marketing: true } }));
    });
    await page.route('**/script.google.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"result":"success"}' }));
    await page.route('**/api.ipify.org/**', (r) => r.abort());
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/formulario.html');

    const vistas = [];
    for (let i = 0; i < total; i++) {
      const id = await page.locator('.step.a').getAttribute('data-id');
      vistas.push(id);

      const excedente = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(excedente, `${nome}/${id}: transborda ${excedente}px em 360`).toBeLessThanOrEqual(1);
      const direita = await page.evaluate(() =>
        Math.max(0, ...Array.from(document.querySelectorAll('.step.a .cf-opt')).map((o) => o.getBoundingClientRect().right)));
      expect(direita, `${nome}/${id}: opção passa da largura da tela`).toBeLessThanOrEqual(360);

      const { violations } = await new AxeBuilder({ page }).analyze();
      const graves = violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      expect(graves.map((v) => `${v.id} (${v.nodes.length}×)`).join(', '), `${nome}/${id}: violações graves`).toBe('');

      if (i === total - 1) break; // a última etapa envia; o teste para antes
      const resposta = id === 'posicao' ? posicao : RESPOSTAS[id];
      const radio = page.locator(`.step.a input[type=radio][value="${resposta}"]`);
      if (await radio.count()) {
        await radio.check({ force: true }); // avança sozinha (380 ms)
      } else {
        await page.locator(`.step.a input[name=${id}]`).fill(resposta);
        await page.locator('#next').click();
      }
      await expect(page.locator('.step.a')).not.toHaveAttribute('data-id', id);
    }
    expect(vistas).toEqual(nome === 'gerente'
      ? ['posicao', 'nome_completo', 'email', 'whatsapp', 'vinculo', 'pessoas_lideradas', 'maior_desafio_gerente', 'objetivo_12m']
      : ['posicao', 'maior_problema_gestao', 'nome_completo', 'whatsapp', 'email', 'modelo_negocio', 'tamanho_equipe', 'faturamento_mensal']);
  });
}
