# Página — `diagnostico-gerente.html` (página de venda do diagnóstico, versão do gerente)

**Status:** Implementada (branch `feat/pagina-diagnostico-gerente`), com marcadores — não vai ao ar
antes das pendências do §7
**Revisão:** layout e copy revisados em 2026-10-18 conforme [`design/diagnostico-ajustes-lp.md`](../design/diagnostico-ajustes-lp.md); a tabela do §3 abaixo é do layout anterior onde diferir dele.
**Data:** 2026-10-18
**Fonte:** "Briefing da landing page para o desenvolvedor v2" (Talita, 2026-10-17), seção "Página do
gerente (só público quente)".

## 1. Informações básicas

| Campo | Valor |
| :-- | :-- |
| Arquivo | `src/diagnostico-gerente.html` |
| URL | `boutiqueempresarial.com.br/diagnostico-gerente` |
| Title | `O que parar de aprovar no seu time \| Boutique Empresarial` (57 caracteres; limite 60) |
| Description | o H1, literal |
| Divulgação | link próprio nos stories, na lista e no WhatsApp; **nunca** em anúncio frio |
| Entrada no site | FAQ da página do dono ("Eu sou gerente, não dono. Serve para mim?") |

## 2. Copy

Mesmo produto, layout e regras da [`diagnostico.md`](diagnostico.md). A página é uma cópia de
`src/diagnostico.html` em que só mudam os blocos que o briefing lista, com o texto **literal**:
1 (rótulo, H1, subtítulo), 2 (cena; o celular estilizado passa a 8:00), 3, 4 (dois trechos), 5,
5b (falas de gerentes), 6 (terceiro cartão), 7 (quarto item), 9, 10 (linha do desconto), 11 (saem
"Eu sou gerente" e "Meu sócio pode participar?", entram "Preciso envolver o meu chefe?" e "A empresa
pode pagar?"), 12 e 13. Os demais blocos (8, preço, garantia, rodapé) ficam iguais aos do dono.

Ajustes fora do texto do briefing, para a página não contradizer a si mesma:

- **5b:** "Ditas por donos de empresa como você." seria falso aqui e o briefing não traz substituta:
  vira o marcador `[CONFIRMAR: linha de abertura das frases de gerentes]`.
- **Mockup do bloco 7:** o rótulo do terceiro grupo acompanha o cartão ("É a sua função de gerente").

Marcadores mantidos: `[X]` (parcelas, vagas), `[número de suporte]`, `[CONFIRMAR: se você emite nota
fiscal para empresa.]`.

## 3. Layout

Igual ao §3 da `diagnostico.md` — mesmo `<style>`, mesmos blocos, mesma barra fixa.

## 4. CTA → checkout e rastreamento

Igual ao §4 da `diagnostico.md`: sete botões (`topo`, `para-quem`, `recebe`, `caminhos`, `oferta`,
`ps`, `fixa`), constante `CHECKOUT` própria (vazia → `#oferta`), UTMs/`fbclid`/`gclid`, `src` e
`sck`. Único desvio: o `ViewContent` sai com `content_name: 'Diagnóstico (gerente)'`, para separar
as duas páginas no Pixel. O `src` é igual nas duas; quem distingue a página na Hotmart são as UTMs
do link divulgado (ex.: `utm_source=instagram&utm_medium=stories`).

## 5. Contrato (`HARNESS_AEO.md`)

- **Indexável:** **não** — `noindex, follow`. A página é só para público quente; na busca, ela
  disputaria a mesma intenção com `/diagnostico` e entregaria a oferta do gerente a público frio.
  `follow` porque os links (legais) não têm por que ser ignorados.
- **Sem** canonical, companion Markdown, `MARKDOWN_MAP` e JSON-LD (os `@id` colidiriam com os da
  página do dono). Fora do `sitemap.xml` pelo próprio `meta robots` (`vite.config.js`).
- **Com** OG e Twitter (`og:url` próprio): o link circula no WhatsApp e nos stories, e a prévia
  precisa aparecer.
- **Bloco AEO:** não — página noindex, isenta (§B2).

## 6. Critérios de pronto

`tests/diagnostico-gerente.spec.js`:
1. `noindex, follow`, sem canonical, companion nem JSON-LD; `og:url` da própria página.
2. Copy do gerente nos blocos trocados (rótulo, H1, desconto, FAQ com as duas perguntas novas e sem
   as duas retiradas).
3. Sete botões com rótulo e microtexto literais; nenhum link além dos botões e de privacidade/termos.
4. Sem `CHECKOUT`, `#oferta`; com `CHECKOUT` injetado, UTMs, `src` e `sck`; visita direta só `src`.
5. Pixel: `PageView`, `ViewContent` (`Diagnóstico (gerente)`), `InitiateCheckout` no clique.
6. Barra fixa escondida no topo e visível depois dele (375 px).
7. O FAQ da página do dono aponta para esta página.

`npm run gate` verde.

## 7. Pendências antes de ir ao ar

As do §7 da `diagnostico.md` (checkout, parcelas, vagas, suporte, assets, CAPI) e mais:
falas de outros gerentes do público quente no 5b (hoje são de um gerente só) e permissão para
usá-las · linha de abertura do 5b · resposta de "A empresa pode pagar?" (nota fiscal para empresa).

Fora da página (briefing): no questionário, para gerentes, trocar as perguntas de caixa e sócio por
pressão de meta e relação com o chefe; no resultado e na sessão, o próximo passo é a mentoria.
