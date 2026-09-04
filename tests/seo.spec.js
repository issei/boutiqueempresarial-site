// Contrato do <head> — HARNESS_AEO.md §B1.
// Itera por glob sobre src/*.html: página nova entra sozinha, sem lista manual.
// Páginas noindex são isentas de canonical, OG e Twitter — a isenção sai do
// próprio `meta robots` da página, nunca de uma lista codificada aqui.
import { test, expect } from '@playwright/test';
import { globSync } from 'glob';
import path from 'node:path';

const SITE = 'https://boutiqueempresarial.com.br';

const pages = globSync('src/*.html').map((f) => {
  const slug = path.parse(f).name;
  return { slug, url: slug === 'index' ? '/' : `/${slug}.html` };
});

// Devolve null quando a tag não existe, em vez de esperar 30s pelo elemento:
// "campo ausente" é o resultado mais comum aqui e precisa falhar rápido e legível.
const attr = async (page, selector, name = 'content') =>
  page.evaluate(
    ([sel, at]) => document.querySelector(sel)?.getAttribute(at) ?? null,
    [selector, name],
  );

for (const { slug, url } of pages) {
  test.describe(slug, () => {
    test('title entre 10 e 60 caracteres, com o sufixo da marca', async ({ page }) => {
      await page.goto(url);
      const title = await page.title();
      expect(title.length, `${slug}: title com ${title.length} chars — "${title}"`).toBeGreaterThanOrEqual(10);
      expect(title.length, `${slug}: title com ${title.length} chars — "${title}"`).toBeLessThanOrEqual(60);
      expect(title, `${slug}: title sem o sufixo da marca`).toContain('Boutique Empresarial');
    });

    test('description entre 50 e 160 caracteres', async ({ page }) => {
      await page.goto(url);
      const desc = await attr(page, 'meta[name="description"]');
      expect(desc, `${slug}: sem meta description`).toBeTruthy();
      expect(desc.length, `${slug}: description com ${desc?.length} chars`).toBeGreaterThanOrEqual(50);
      expect(desc.length, `${slug}: description com ${desc?.length} chars`).toBeLessThanOrEqual(160);
    });

    test('GA4 presente com o ID do SEO_ANALYTICS.md', async ({ page }) => {
      await page.goto(url);
      const scripts = await page.locator('script[src*="googletagmanager"]').count();
      expect(scripts, `${slug}: script do GA4 ausente`).toBeGreaterThan(0);
      expect(await page.content(), `${slug}: ID do GA4 divergente`).toContain('G-8HNXV7KTY9');
    });

    test('lang do documento é pt-BR', async ({ page }) => {
      await page.goto(url);
      const lang = (await attr(page, 'html', 'lang'))?.toLowerCase();
      expect(lang, `${slug}: <html lang> é "${lang}"`).toBe('pt-br');
    });

    test('canonical, OG e Twitter conforme a indexabilidade', async ({ page }) => {
      await page.goto(url);
      const robots = (await attr(page, 'meta[name="robots"]')) ?? '';
      const indexavel = !robots.includes('noindex');

      if (!indexavel) {
        // Página noindex: isenta. Nada a cobrar além de não se declarar canônica.
        return;
      }

      const canonical = await attr(page, 'link[rel="canonical"]', 'href');
      expect(canonical, `${slug}: canonical ausente`).toBeTruthy();
      expect(canonical, `${slug}: canonical não é absoluta`).toContain(SITE);
      expect(canonical, `${slug}: canonical com .html`).not.toContain('.html');

      expect(robots, `${slug}: robots sem max-image-preview`).toContain('max-image-preview:large');
      expect(robots, `${slug}: robots sem max-snippet`).toContain('max-snippet:-1');

      for (const prop of ['og:type', 'og:site_name', 'og:locale', 'og:title', 'og:description', 'og:url', 'og:image']) {
        expect(await attr(page, `meta[property="${prop}"]`), `${slug}: ${prop} ausente`).toBeTruthy();
      }
      expect(await attr(page, 'meta[property="og:image:width"]'), `${slug}: og:image não é 1200 de largura`).toBe('1200');
      expect(await attr(page, 'meta[property="og:image:height"]'), `${slug}: og:image não é 630 de altura`).toBe('630');

      expect(await attr(page, 'meta[name="twitter:card"]'), `${slug}: twitter:card`).toBe('summary_large_image');
      for (const name of ['twitter:title', 'twitter:description', 'twitter:image']) {
        expect(await attr(page, `meta[name="${name}"]`), `${slug}: ${name} ausente`).toBeTruthy();
      }
    });
  });
}
