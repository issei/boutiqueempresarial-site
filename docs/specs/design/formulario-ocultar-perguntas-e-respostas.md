# Remover a seção “Perguntas e Respostas” do formulário

## Objetivo

Manter a página de aplicação focada no preenchimento do formulário, sem exibir a seção
“Perguntas e Respostas”.

## Escopo e restrições

- Página: `src/formulario.html`.
- Remover toda a seção AEO visível, incluindo título e perguntas.
- Remover também o `FAQPage` do JSON-LD da página, para não declarar perguntas que não
  aparecem nela.
- Preservar o restante do formulário, o fluxo de conversão e os demais nós JSON-LD.
- Registrar no contrato AEO que a página de conversão não exibe esse bloco.

## Critérios de aceite

- A página não contém nem exibe `.aeo`, `Perguntas e Respostas` ou `<details>` da seção.
- O JSON-LD do formulário não declara `FAQPage`.
- A suíte AEO cobra explicitamente essa exceção; os demais contratos AEO permanecem ativos.
- O gate conclui sem falhas.

## Status

Implementado.
