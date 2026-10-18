# ADR — três cores suaves nos grupos da página de venda do diagnóstico

**Data:** 2026-10-17 · **Status:** proposta (PR #46)

## Contexto
O briefing v2 da página de venda (`docs/specs/pages/diagnostico.md`) pede, no bloco 6, três cartões
"cada um com uma cor suave diferente (verde, amarelo, azul)", repetidas no mockup do resultado
(bloco 7). O `STYLE_GUIDE.md` não tem verde, amarelo nem azul.

## Decisão
Três tons de fundo, **só** em `src/diagnostico.html`, como custom properties locais:

| Token | Hex | Uso |
| :-- | :-- | :-- |
| `--grupo-verde` | `#e4ece1` | "Já pode sair da sua mão" |
| `--grupo-amarelo` | `#f4ead0` | "Ainda não dá para soltar" |
| `--grupo-azul` | `#e1e9f1` | "É só seu" |

São fundos claros, de baixa saturação; o texto sobre eles continua `--text-primary` (contraste
acima de 12:1). Não entram em `src/style.css` nem no design system: não são tokens do site.

## Consequências
- O botão continua sendo o único elemento em `--accent-color`, como o briefing pede.
- Se as cores dos grupos passarem a aparecer fora desta página (resultado, PDF, e-mail), promover
  os três tokens para `src/style.css` e para o `STYLE_GUIDE.md`.
