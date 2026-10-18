# Design — ajustes da LP do diagnóstico pago (`/diagnostico` e `/diagnostico-gerente`)

**Status:** implementada na branch `feat/diagnostico-ajustes-lp` (PR a abrir)
**Data:** 2026-10-18
**Fonte:** "Ajustes da landing page do diagnóstico" (Talita, 2026-10-18)

## Objetivo
Tirar o cansaço de leitura (blocos só de texto), dar força ao botão e tirar da página o que impede
a venda. Cada bloco passa a ter um elemento visual e frases curtas.

## Decisões do Issei (2026-10-18)
- Checkout, parcelas e vagas ainda não existem: as frases com `[X]` saem; `CHECKOUT` fica vazio.
- Frases de clientes autorizadas: três por página (sem o segmento do cliente, ainda não informado).
- Vale para as duas páginas. O gerente mantém a copy própria; o visual é o mesmo.
- Botão laranja no site todo: `adr-botao-laranja.md` (`#B84A22`, não `#C8552B`, por contraste AA).

## Restrições vindas do código
Mesmos 7 `data-checkout` e rastreio de `pages/diagnostico.md` §4. Sem JS novo além da barra fixa.
Tokens de `src/style.css`; cores dos grupos de `adr-diagnostico-cores-grupos.md`.

## Critérios de pronto
1. Botão: laranja, 60 px, cantos de 6 px, sombra suave, seta. Barra fixa só com o botão
   "Quero descobrir · R$ 197", até 64 px, escondida no topo e enquanto outro botão ou `#oferta`
   estão na tela.
2. Topo com a linha de confiança e o retrato. Cena com a tela de WhatsApp antes do texto.
3. "Você se reconhece?" é checklist de tocar. Armadilha com ciclo de 4 passos, "paga duas vezes" em
   duas colunas e cartão Itaú × empresa. "Você já tentou de tudo" com 6 itens (dono).
4. Frases em 3 cartões empilhados, sem carrossel. "Três partes" funde "O que você recebe", com
   micro exemplos e mockup preenchido. "Como funciona" com 4 passos.
5. Dois caminhos: o 2 escuro, maior, com o botão. Oferta: "R$ 197" uma vez, selo e logos Pix/cartão.
6. `npm run gate` verde; `tests/diagnostico*.spec.js` cobrem barra, checklist e ausência de `[X]`.

## Divergências e pontos para a Talita
- Gerente: a copy nova do doc é do dono. No gerente, ficam a copy atual e o visual novo. Títulos
  dos blocos 5 e 6 e o fechamento do bloco 5 seguem os do dono; lista "já tentou" em forma nominal
  a partir da copy atual; as mensagens do WhatsApp repetem as do dono com 8h; o caminho 2 não tem a
  frase do "6h"; exemplos do bloco 7 só existem para o dono.
- Bloco 7: o grupo "Ainda não dá para soltar" não tem micro exemplo no doc, então não tem exemplo.
- Pix e cartão: os "logos" são marcas simples em SVG; trocar pelos oficiais quando existirem.
- Teste A/B laranja × preto: sem infraestrutura; comparar InitiateCheckout ÷ PageView 2 semanas
  depois de publicar.
