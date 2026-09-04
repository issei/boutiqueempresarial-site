// Gera public/og-image.jpg 1200×630 — HARNESS_AEO.md §B0, ASSETS_GUIDE.md.
// Usa o Playwright que já é dependência do projeto: nada de lib de imagem nova
// para um asset que muda uma vez por rebranding.
//   node scripts/gen-og.mjs
import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/og-image.jpg');

// Paleta e tipografia do STYLE_GUIDE.md — "Silêncio e Elegância".
const html = `<!doctype html><html lang="pt-br"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400&family=Playfair+Display:wght@400&display=swap" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #f5f2eb; color: #1f1f1f;
         font-family: Inter, sans-serif; display: flex; flex-direction: column;
         justify-content: center; padding: 0 110px; }
  .eyebrow { font-size: 15px; font-weight: 400; letter-spacing: .32em;
             text-transform: uppercase; color: #555; margin-bottom: 42px; }
  h1 { font-family: 'Playfair Display', serif; font-weight: 400; font-size: 82px;
       line-height: 1.08; letter-spacing: -.02em; }
  .rule { width: 64px; height: 1px; background: #C5A059; margin: 40px 0 36px; }
  p { font-size: 25px; font-weight: 300; line-height: 1.5; color: #555; max-width: 830px; }
</style></head><body>
  <div class="eyebrow">Boutique Empresarial</div>
  <h1>Negócios estáveis não<br>nascem do caos.</h1>
  <div class="rule"></div>
  <p>Arquitetura de Negócios para operações que funcionam sem depender do dono.</p>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.screenshot({ path: out, type: 'jpeg', quality: 92 });
await browser.close();
console.log(`og-image gerada: ${out}`);
