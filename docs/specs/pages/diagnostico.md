# Página — `diagnostico.html` (LP do Diagnóstico Gratuito → checkout Hotmart)

**Status:** Implementada (branch `feat/pagina-diagnostico`), aguardando o link do checkout Hotmart
**Data:** 2026-10-17

## 1. Informações básicas

| Campo | Valor |
| :-- | :-- |
| Arquivo | `src/diagnostico.html` |
| URL | `boutiqueempresarial.com.br/diagnostico` |
| Title | `Diagnóstico Gratuito \| Boutique Empresarial` |
| Description | trecho literal do subtítulo do hero (≤ 160 caracteres) |

## 2. Copy

**Literal.** O texto visível é o fornecido pelo responsável do produto em 2026-10-17, palavra por
palavra — nenhuma palavra acrescentada, removida ou trocada. Os rótulos de CTA são
`Solicitar Diagnóstico Gratuito`. Exceções, todas fora do corpo de copy: wordmark, rodapé
padrão do site (copyright, assinatura e links legais), skip link e `alt` do retrato.

Ordem das seções: hero (H1 + subtítulo + CTA) → o que eu analiso (3 falhas + fecho) → quem
conduz (seção invertida com retrato) → para quem é (3 itens) → como funciona a seleção
(3 vagas, 3 passos, CTA).

## 3. Layout

Mesma linguagem da home (`home-diagnostico.md` §6), com acabamento de laudo: hero em 12
colunas com filete ouro, as três falhas como linhas numeradas (I–III) em duas colunas
(título | texto) separadas por filete, fecho em destaque, seção invertida com retrato, perfil
em três colunas com filete ouro no topo, seleção em fundo branco com o numeral "3" decorativo
(`aria-hidden`) e passos horizontais no desktop. CTA fixa no mobile, como na home.
Paleta e tipografia sem desvio do `STYLE_GUIDE.md`.

## 4. CTA → checkout Hotmart

- Os três CTAs (hero, seleção, barra fixa mobile) têm `data-checkout="<posição>"`.
- O link do checkout fica numa constante (`CHECKOUT`) no script da página. **Enquanto vazia**,
  o `href` estático (`/formulario.html`) vale — a página funciona sem JS e antes do link existir.
- No `DOMContentLoaded` (depois de `js/attribution.js`, que é módulo e roda antes), cada CTA
  recebe a query de rastreio:

| Parâmetro | Origem |
| :-- | :-- |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid` | URL atual → `BE_ATTR.last` (último toque, `design/atribuicao-utm.md`) |
| `src` | posição do CTA (`hero`, `selecao`, `fixa`) — relatório de origem da Hotmart |
| `sck` | `utm_source\|utm_medium\|utm_campaign\|utm_content\|utm_term` — chave de rastreio da Hotmart |

Parâmetro vazio não é enviado. Nenhum evento novo de Pixel/GA4 (fora de escopo).

## 5. Contrato (`HARNESS_AEO.md`)

- **Indexável:** sim. Head conforme §B1.
- **JSON-LD:** nós persistentes + `WebPage`, `Service`, `Person`, `BreadcrumbList`. Descrições
  com o texto literal da página.
- **Bloco AEO:** **não** — mesma exceção do `formulario`. O bloco exige texto que não está na
  copy, e a copy é literal (§2). Sem `FAQPage`.
- **Companion Markdown:** `public/diagnostico.md`, com o texto literal; rota em `MARKDOWN_MAP`.
- **Consentimento/rastreamento:** bloco inline de consentimento, `cookie-consent.js`,
  `attribution.js`, Pixel e GA4 idênticos aos da home.

## 6. Critérios de pronto

`tests/diagnostico.spec.js`:
1. Três CTAs com o rótulo literal e `data-checkout`.
2. Sem link configurado, o CTA aponta para `/formulario.html` com UTMs da URL, `src` e `sck`.
3. Sem UTM na URL, as UTMs vêm do cookie `be_attr` (último toque).

`npm run gate` verde.
