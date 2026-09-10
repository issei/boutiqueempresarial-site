// Trava a home anterior no papel de backup — docs/specs/pages/home-diagnostico.md §D2.
// As três suítes por glob (seo/aeo/a11y) isentam página `noindex`, então nada mais cobra
// que ela CONTINUE `noindex`. Sem este arquivo, "consertar o SEO do legado" é uma edição
// de uma linha que ninguém reprova — e aí duas páginas disputam a mesma identidade.
import { test, expect } from '@playwright/test';

const URL = '/index-legado.html';

test.describe('index-legado', () => {
  test('responde 200 e continua fora da indexação', async ({ page }) => {
    const res = await page.goto(URL);
    expect(res?.status(), 'legado inacessível — ele existe para comparação').toBe(200);

    const robots = await page.evaluate(
      () => document.querySelector('meta[name="robots"]')?.content ?? '',
    );
    expect(robots, 'legado sem noindex').toContain('noindex');
  });

  test('não disputa identidade com a home nova', async ({ page }) => {
    await page.goto(URL);

    // As quatro remoções do §D2. Cada uma existe por um motivo diferente:
    // canonical e og:url disputam `/`; o companion .md descreve outra página; os @id
    // do JSON-LD colidem com os da home; e a tool WebMCP serviria conteúdo alheio.
    const conflitos = await page.evaluate(() => ({
      canonical: !!document.querySelector('link[rel="canonical"]'),
      markdown: !!document.querySelector('link[rel="alternate"][type="text/markdown"]'),
      jsonld: !!document.querySelector('script[type="application/ld+json"]'),
    }));

    expect(conflitos, 'legado declarando identidade que pertence à home').toEqual({
      canonical: false,
      markdown: false,
      jsonld: false,
    });

    expect(await page.content(), 'legado ainda registra tools WebMCP').not.toContain('modelContext');
  });

  test('não é alcançável a partir da home', async ({ page }) => {
    // O legado é acessível por URL direta e invisível para o crawl. Se algum link
    // aparecer, ele entra no smoketest e no sitemap — e deixa de ser backup.
    await page.goto('/');
    const links = await page.locator('a[href*="index-legado"]').count();
    expect(links, 'a home passou a linkar o legado').toBe(0);
  });
});
