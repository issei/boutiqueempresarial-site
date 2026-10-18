# ADR — botão laranja queimado em todo o site

**Data:** 2026-10-18 · **Status:** proposta
**Fonte:** "Ajustes da landing page do diagnóstico" (Talita, 2026-10-18), seção "Cor do botão".

## Contexto
O botão primário era preto (`--accent-color: #1C1C1C`), a mesma cor do texto, e não se destacava.
A Talita sugeriu `#C8552B` com texto branco. Esse tom dá cerca de 4,4:1 com branco, abaixo do
AA (4,5:1) que o gate de a11y cobra para texto normal.

## Decisão
- `--accent-color` passa a `#B84A22` (mesmo tom, mais escuro): cerca de 5,2:1 com texto branco.
- Vale para o site todo (decisão do Issei, 2026-10-18): home, formulário e as páginas do diagnóstico.
- O laranja aparece **só em botões**. Destaques em texto continuam `--gold-text`.
- Botão do diagnóstico: 60 px de altura, cantos de 6 px, sombra suave, seta no fim do rótulo.

## Consequências
- `STYLE_GUIDE.md` e `src/style.css` mudam junto.
- Teste de 2 semanas depois de publicar: taxa InitiateCheckout ÷ PageView, laranja × preto
  (sem infraestrutura de A/B no site estático; comparação antes/depois, pelo Pixel).
