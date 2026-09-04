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
