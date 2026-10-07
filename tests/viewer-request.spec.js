import fs from 'node:fs';
import { test, expect } from '@playwright/test';

// CloudFront Function de viewer-request (infra/cloudfront-functions/viewer-request.js),
// executada em Node: o runtime cloudfront-js-2.0 não usa módulos, então o handler
// é extraído do texto do arquivo. Sem navegador.
const src = fs.readFileSync(new URL('../infra/cloudfront-functions/viewer-request.js', import.meta.url), 'utf8');
const handler = new Function(`${src}; return handler;`)();

const rota = (uri, accept = 'text/html') =>
  handler({ request: { uri, headers: { accept: { value: accept } }, querystring: { utm_source: { value: 'meta' } } } });

test('barra final não quebra a página (antes: /formulario/.html → 403)', () => {
  expect(rota('/formulario/').uri).toBe('/formulario.html');
  expect(rota('/obrigada/').uri).toBe('/obrigada.html');
  expect(rota('/formulario/').querystring).toEqual({ utm_source: { value: 'meta' } });
});

test('rotas existentes continuam iguais', () => {
  expect(rota('/').uri).toBe('/index.html');
  expect(rota('/formulario').uri).toBe('/formulario.html');
  expect(rota('/formulario.html').uri).toBe('/formulario.html');
  expect(rota('/js/attribution.js').uri).toBe('/js/attribution.js');
  expect(rota('/', 'text/markdown').uri).toBe('/index.md');
  expect(rota('/llms/', 'text/markdown').uri).toBe('/llms.txt');
});
