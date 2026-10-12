# ADR — `/formulario` passa a ser indexável

**Data:** 2026-10-12 · **Status:** implementada (pendente de deploy)

## Decisão
`src/formulario.html` deixa de ser `noindex, follow` e passa a `index, follow, max-image-preview:large, max-snippet:-1`.
Decisão de negócio do responsável pelo site; `HARNESS_AEO.md` §6.1 registrava o `noindex` como estado herdado.

## Contrato que passa a valer (cobrado por `tests/seo|aeo|a11y.spec.js`, que leem o `meta robots`)
- canonical `https://boutiqueempresarial.com.br/formulario` (sem `.html`; o CloudFront roteia `/formulario`);
- OG + Twitter com a imagem 1200×630 de sempre; título "Aplicação ao Diagnóstico Gratuito | Boutique Empresarial";
- JSON-LD `@graph`: `Organization`, `ProfessionalService`, `WebSite` (idênticos à home), `WebPage`+`ContactPage`
 , `BreadcrumbList` (Início → Aplicação) e `FAQPage`;
- bloco visível `AEO-BODY` (título "Perguntas e Respostas" em `.aeo-tldr` + FAQ em `<details>`; sem parágrafo "Em síntese" nem `speakable`, por decisão de design) **abaixo** do formulário, estilos `.aeo-*` de `src/style.css`.
  Texto do JSON-LD e do HTML gerados da mesma fonte; o fluxo do formulário não muda;
- entra no `sitemap.xml` sozinho (o `vite.config.js` lê o `meta robots`).

## Divergências / adiado
- Sem companion `.md` (página de conversão; o teste só exige o da home).
- Não rodei `/design-sync`: não há componente novo, só bloco textual com classes existentes.
- Revisar o conteúdo do FAQ com a Talita antes do deploy.
