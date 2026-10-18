# Página — `diagnostico.html` (página de venda do diagnóstico, R$ 197 → checkout)

**Status:** Implementada (branch `feat/pagina-diagnostico`, PR #46), com marcadores — não vai ao ar
antes das pendências do §7
**Revisão:** layout e copy revisados em 2026-10-18 conforme [`design/diagnostico-ajustes-lp.md`](../design/diagnostico-ajustes-lp.md); a tabela do §3 abaixo é do layout anterior onde diferir dele.
**Data:** 2026-10-17
**Fonte:** "Briefing da landing page para o desenvolvedor v2" (Talita, 2026-10-17) — versão do
**dono**. A página do gerente é outra página: [`diagnostico-gerente.md`](diagnostico-gerente.md).

## 1. Informações básicas

| Campo | Valor |
| :-- | :-- |
| Arquivo | `src/diagnostico.html` |
| URL | `boutiqueempresarial.com.br/diagnostico` |
| Title | `Descubra o que parar de aprovar \| Boutique Empresarial` |
| Description | o título da página (H1), literal |

## 2. Copy

**Literal**, bloco a bloco do briefing (1 a 13). Nenhuma palavra acrescentada, removida ou trocada.
Rótulo de todos os botões: `Quero descobrir o que parar de aprovar`; microtexto embaixo de cada um:
`R$ 197 · resultado completo em até 2 dias úteis · garantia de 7 dias`.

Títulos de seção vêm dos nomes de bloco do briefing quando funcionam como título para o leitor
("Isto é para você se", "Por que você não consegue soltar", "Você já desconfiava", "Frases que eu
ouço nos meus diagnósticos", "O que você recebe", "Dois caminhos", "Perguntas frequentes", "Não é
para você se", "PS"). "A cena" e "A oferta" são `<h2>` só para leitor de tela (`.vh`); "O que o
diagnóstico separa" é rótulo pequeno acima da frase-base; em "Quem criou" o título é a frase em
negrito do bloco. Os marcos da linha do tempo (`20 min`, `na hora`, `até 2 dias úteis`) vêm da
instrução de layout do bloco 7.

Fora do corpo de copy: skip link, `alt` das fotos, rodapé (copyright, CNPJ, links legais), selo
"Garantia de 7 dias", rótulos `Pix`/`Cartão`, mockup do resultado (`Exemplo`, rótulos dos grupos).

Marcadores mantidos como no briefing: `[X]` (parcelas, vagas), `[número de suporte]`.
O `[link para a página do gerente]` virou o link para `/diagnostico-gerente.html`, com a URL como texto.

## 3. Layout

Mobile primeiro (375 px), corpo ≥ 18 px, botão de largura total e ≥ 56 px no celular. Sem menu,
sem logo-link, sem links de saída: só o checkout, o link da página do gerente no FAQ e, no rodapé,
privacidade e termos.

| Bloco | Tratamento |
| :-- | :-- |
| 1 Topo | retrato redondo pequeno + rótulo; H1 com "parar de aprovar" e "sem perder o controle" em `--gold-text`; subtítulo, botão e microtexto na primeira tela de 375×667 |
| 2 Cena | celular estilizado em CSS (6:00, "14 mensagens", "Pode aprovar?", "Só para confirmar..."), `aria-hidden`; destaque em Playfair |
| 3 | lista com check, um item por linha; botão logo depois |
| 4 | citação grande centralizada; caixa em fundo levemente diferente com retrato pequeno; última frase é o destaque |
| 5 | as tentativas viram lista com "x" (frases literais, uma por item); última frase é o destaque |
| 5b | balões sem nome nem foto; carrossel com scroll-snap no celular, grade no desktop |
| 6 | três cartões (verde, amarelo, azul suaves — `adr-diagnostico-cores-grupos.md`) com mão, cadeado e estrela |
| 7 | mockup do resultado (`Exemplo`, barra "para onde vai o seu dia", três grupos) — logo após o título no celular, coluna fixa à direita no desktop; selo "incluído" nos 30 minutos; linha do tempo de 3 passos (vertical no celular, horizontal no desktop) |
| 8 | foto grande antes do texto no celular; "conferir o que o time entrega" em citação |
| 9 | caminho 1 em cinza apagado, caminho 2 em branco com filete ouro e o botão |
| 10 | caixa única com borda: lista, preço grande, parcelamento menor, botão com selo circular ao lado, Pix/Cartão, garantia |
| 11 | acordeão `<details>` |
| 12 | lista curta com "x", discreta |
| 13 | bilhete com assinatura (marcador em Playfair itálico) e o último botão; depois só o rodapé |

Barra fixa no celular: aparece quando o topo sai da tela (`IntersectionObserver`).
Botão é o único elemento em `--accent-color`.

## 4. CTA → checkout e rastreamento

- Sete botões com `data-checkout`: `topo`, `para-quem`, `recebe`, `caminhos`, `oferta`, `ps`, `fixa`.
- O link do checkout fica na constante `CHECKOUT` do script da página. **Enquanto vazia**, todo
  botão leva a `#oferta` e nenhum parâmetro é anexado.
- Com o link preenchido, no `DOMContentLoaded` cada botão recebe:

| Parâmetro | Origem |
| :-- | :-- |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid` | URL atual → `BE_ATTR.last` (último toque, `design/atribuicao-utm.md`) |
| `src` | posição do botão — relatório de origem da Hotmart |
| `sck` | `utm_source\|utm_medium\|utm_campaign\|utm_content\|utm_term` — chave de rastreio da Hotmart |

- Pixel: `PageView` e `ViewContent` (valor 197 BRL) no carregamento, `InitiateCheckout` no clique
  de qualquer botão. `Purchase` é disparado pela plataforma de checkout.
- **Fora do site:** API de Conversões (CAPI) — configurar na integração Meta da Hotmart; o site é
  estático e não tem servidor para isso.

## 5. Contrato (`HARNESS_AEO.md`)

- **Indexável:** sim. Head conforme §B1.
- **JSON-LD:** nós persistentes + `WebPage`, `Service` (oferta R$ 197), `Person`, `BreadcrumbList`.
- **Bloco AEO:** **não** — mesma exceção do `formulario` (§B3). O FAQ do briefing é visível, mas
  sem `FAQPage`: duas respostas ainda têm marcador.
- **Companion Markdown:** `public/diagnostico.md`, com o texto literal; rota em `MARKDOWN_MAP`.

## 6. Critérios de pronto

`tests/diagnostico.spec.js`:
1. Sete botões com o rótulo literal, na ordem do §4, e o microtexto embaixo de cada um.
2. Nenhum link além dos botões, da página do gerente e de privacidade/termos.
3. Sem `CHECKOUT`, os botões apontam para `#oferta`, sem rastreio.
4. Com `CHECKOUT` (injetado no teste): UTMs da URL, `src` e `sck`; fallback para o cookie `be_attr`;
   visita direta só com `src`.
5. Pixel: `PageView`, `ViewContent`, `InitiateCheckout` no clique.
6. Barra fixa escondida no topo e visível depois dele (375 px).

`npm run gate` verde.

## 7. Pendências antes de ir ao ar (do briefing)

Link do checkout (Hotmart, Pix e cartão) · número de parcelas e de vagas · número de WhatsApp de
suporte · permissão das clientes para as frases do bloco 5b ·
fotos definitivas, mockup do resultado, tela de WhatsApp, ícones e selo do designer · assinatura
manuscrita · CAPI e `Purchase` funcionando · compra de teste de ponta a ponta · republicar a
CloudFront Function.
