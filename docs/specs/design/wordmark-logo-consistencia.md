# Wordmark — consistência logo vs. texto

## Status
Aberta — spec escrita antes do handoff pro Claude Design, ainda não implementada lá.

## Objetivo
`components/site/Wordmark.jsx` (projeto Claude Design `Boutique Empresarial
Design System`, id `fbafa129-4487-4384-aedb-d8c296af2418`) renderiza por
padrão o texto "Boutique Empresarial." (`asImage=false`). O código real em
[`src/formulario.html:666`](../../../src/formulario.html) usa a imagem do
logo: `<img src="/boutiquelogo.webp" alt="Boutique Empresarial" width="200"
height="200">`.

O componente já suporta os dois modos (`asImage` é uma prop existente) — o
problema é que a tela do formulário no Design foi montada sem passar essa
prop, então caiu no fallback de texto. Ajustar o default/uso para bater com a
produção.

## Restrições vindas do código
- Fonte da verdade é sempre `src/*.html` — o design system existe pra
  refletir o código, não o contrário (ver `design-system/readme.md` §Known
  gaps, que já registra um caso parecido de token divergente).
- Verificar todas as telas que usam `Wordmark` no projeto de Design
  (`ui_kits/site/FormScreen.jsx`, `HomeScreen.jsx`, `ProgramScreen.jsx`), não
  só o formulário — cada uma deve bater com a página `.html` correspondente
  (`src/formulario.html`, `src/index.html`, `src/index-legado.html`).
- Não é só o logo: pedir uma varredura geral de divergências design vs. código
  no mesmo passo, já que essa foi encontrada por inspeção manual, não por
  processo sistemático.

## Critérios de pronto
- [ ] `Wordmark` usado com `asImage` (ou equivalente) em toda tela onde a
      página `.html` real usa a imagem do logo.
- [ ] Lista de qualquer outra divergência encontrada na varredura, com
      decisão registrada para cada uma (corrigir no Design ou abrir spec
      própria se a divergência for intencional).
- [ ] Handoff de volta pro Code não é necessário neste caso — é ajuste só do
      lado do Design system remoto, sem código de produção envolvido.

## Referência
- Achado durante sessão de `/design-sync` em 2026-09-17, conversa sobre
  `formulario.html` vs. projeto Claude Design.
