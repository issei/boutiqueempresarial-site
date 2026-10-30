# ADR — paleta v4: laranja além do botão, fundo escuro e faixa bege

**Data:** 2026-10-30 · **Status:** proposta · **Revisa:** [`adr-botao-laranja.md`](adr-botao-laranja.md)
**Fonte:** mockup do Issei para a home e o formulário (copy v4). Fonte tipográfica inalterada.

## Contexto
O ADR do botão laranja restringia o laranja a botões. O mockup v4 usa o laranja também em palavras em itálico dos títulos, eyebrows e numerais, sobre um fundo escuro e uma faixa bege.

## Decisão
| Token | Valor | Uso |
|---|---|---|
| `--bg-color` | `#f6f2e9` | creme, fundo geral |
| `--sand` | `#ebe2d1` | faixa bege das seções alternadas |
| `--ink` | `#131210` | fundo escuro (topo, hero, "O ponto cego", "Por que agora", rodapé) |
| `--card` / `--card-2` | `#ffffff` / `#fbf8f3` | cartões |
| `--accent-color` | `#c14f1b` | botões, barra de progresso, palavra em itálico de títulos grandes, faixa laranja |
| `--accent-text` | `#a8420f` | laranja para texto pequeno sobre claro (eyebrows, numerais): `#c14f1b` dá 4,27:1 sobre o creme e 3,7:1 sobre o bege, abaixo de 4,5:1 |
| `--accent-light` | `#e8743b` | laranja sobre fundo escuro (eyebrows, números das opções): 6,2:1 sobre `#131210` |

- Botão: texto branco sobre `#c14f1b` dá 4,8:1.
- `--text-primary` (`#1f1f1f`), `--text-secondary` e `--gold-*` ficam como estão.
- O hover do botão escurece o fundo, não o torna transparente.

## Consequências
- `STYLE_GUIDE.md` e `src/style.css` mudam junto.
- O creme e o laranja passam a valer para todo o site (as outras páginas usam os mesmos tokens).
- Se um par reprovar no gate de contraste, escurece-se o tom e anota-se aqui.
