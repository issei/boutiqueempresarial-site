// Contrato AEO — HARNESS_AEO.md §B2 (JSON-LD) e §B3 (bloco visível).
// A regra que dá nome ao arquivo: nenhuma afirmação no JSON-LD sem contraparte
// visível na página. Structured data que descreve conteúdo inexistente viola
// diretriz do Google — e é o defeito que esta suíte existe para impedir.
import { test, expect } from '@playwright/test';
import { globSync } from 'glob';
import path from 'node:path';

const pages = globSync('src/*.html').map((f) => {
  const slug = path.parse(f).name;
  return { slug, url: slug === 'index' ? '/' : `/${slug}.html` };
});

const normalizar = (s) => s.replace(/\s+/g, ' ').trim();

const lerGrafo = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('script[type="application/ld+json"]');
    return el ? el.textContent : null;
  });

const indexavel = (page) =>
  page.evaluate(
    () => !(document.querySelector('meta[name="robots"]')?.content ?? '').includes('noindex'),
  );

for (const { slug, url } of pages) {
  test.describe(slug, () => {
    test('JSON-LD parseável com os tipos obrigatórios', async ({ page }) => {
      await page.goto(url);
      if (!(await indexavel(page))) return; // noindex é isenta (§B2)

      const bruto = await lerGrafo(page);
      expect(bruto, `${slug}: sem bloco JSON-LD`).toBeTruthy();

      let grafo;
      expect(() => {
        grafo = JSON.parse(bruto);
      }, `${slug}: JSON-LD não parseia`).not.toThrow();

      const tipos = (grafo['@graph'] ?? [grafo]).map((n) => n['@type']).flat();
      for (const t of ['Organization', 'WebSite', 'WebPage']) {
        expect(tipos, `${slug}: nó ${t} ausente no @graph`).toContain(t);
      }

      // URLs absolutas e sem .html — o canonical do site não usa extensão.
      for (const no of grafo['@graph'] ?? []) {
        for (const campo of ['@id', 'url']) {
          if (typeof no[campo] === 'string') {
            expect(no[campo], `${slug}: ${no['@type']}.${campo} não é absoluta`).toContain('https://');
            expect(no[campo], `${slug}: ${no['@type']}.${campo} com .html`).not.toContain('.html');
          }
        }
      }
    });

    test('toda pergunta do FAQPage tem contraparte visível idêntica', async ({ page }) => {
      await page.goto(url);
      if (!(await indexavel(page))) return;

      const bruto = await lerGrafo(page);
      const grafo = JSON.parse(bruto);
      const faq = (grafo['@graph'] ?? []).find((n) => n['@type'] === 'FAQPage');
      if (!faq) return; // FAQPage é obrigatório só na home (§B2); ausente, nada a comparar

      // textContent, não innerText: um <details> fechado não renderiza a resposta,
      // mas ela está no DOM — que é exatamente o que o crawler lê.
      const textoVisivel = normalizar(
        await page.locator('.aeo-faq').evaluate((el) => el.textContent),
      );

      for (const q of faq.mainEntity) {
        expect(textoVisivel, `${slug}: pergunta sem contraparte visível — "${q.name}"`).toContain(
          normalizar(q.name),
        );
        expect(
          textoVisivel,
          `${slug}: resposta divergente do JSON-LD em "${q.name}"`,
        ).toContain(normalizar(q.acceptedAnswer.text));
      }
    });

    test('bloco AEO visível, delimitado e sem depender de JavaScript', async ({ page }) => {
      await page.goto(url);
      if (!(await indexavel(page))) return;

      const html = await page.content();
      expect(html, `${slug}: marcador AEO-BODY:START ausente`).toContain('<!-- AEO-BODY:START -->');
      expect(html, `${slug}: marcador AEO-BODY:END ausente`).toContain('<!-- AEO-BODY:END -->');

      await expect(page.locator('.aeo-tldr'), `${slug}: .aeo-tldr não visível`).toBeVisible();
      expect(
        await page.locator('.aeo-faq details').count(),
        `${slug}: FAQ sem <details>`,
      ).toBeGreaterThan(0);

      // O alvo do SpeakableSpecification precisa existir de fato.
      const grafo = JSON.parse(await lerGrafo(page));
      const webpage = (grafo['@graph'] ?? []).find((n) => n['@type'] === 'WebPage');
      for (const sel of webpage?.speakable?.cssSelector ?? []) {
        expect(await page.locator(sel).count(), `${slug}: speakable aponta para ${sel}, que não existe`).toBeGreaterThan(0);
      }
    });
  });
}

// Camada para máquinas — HARNESS_AEO.md §B4.
// Fora do laço por página: são artefatos do site, não de uma página.
test.describe('camada para máquinas', () => {
  test('todo link de llms.txt resolve 200', async ({ request }) => {
    const res = await request.get('/llms.txt');
    expect(res.status(), 'llms.txt não encontrado').toBe(200);

    const urls = [...(await res.text()).matchAll(/\((https?:\/\/[^)]+)\)/g)].map((m) => m[1]);
    expect(urls.length, 'llms.txt sem links').toBeGreaterThan(0);

    const quebrados = [];
    for (const url of urls) {
      // O arquivo aponta para produção; em teste vale o caminho equivalente local.
      const caminho = new URL(url).pathname;
      const r = await request.get(caminho);
      if (r.status() >= 400) quebrados.push(`${caminho} → ${r.status()}`);
    }
    expect(quebrados.join(', '), 'links quebrados em llms.txt').toBe('');
  });

  test('companion Markdown existe e está declarado na página', async ({ page, request }) => {
    await page.goto('/');
    const href = await page.evaluate(
      () => document.querySelector('link[rel="alternate"][type="text/markdown"]')?.href ?? null,
    );
    expect(href, 'home sem <link rel=alternate type=text/markdown>').toBeTruthy();

    const res = await request.get(new URL(href).pathname);
    expect(res.status(), `companion ${href} não encontrado`).toBe(200);
  });
});
