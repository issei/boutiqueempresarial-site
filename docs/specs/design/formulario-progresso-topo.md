# Formulário — ajustes de posicionamento a partir do canvas do Claude Design

## Status
Parcialmente implementado em `src/formulario.html` (2026-09-17). Ver §3 para
o que ficou de fora e por quê.

## Correção de referência
A primeira versão desta spec citava `ui_kits/site/FormScreen.jsx` como
protótipo de origem. Está errado: esse arquivo é uma referência mais antiga
e simplificada (6 perguntas, sem e-mail nem consentimento, barra percentual
em vez de etapas nomeadas). A tela que a autora estava de fato vendo — e que
bate exatamente com o screenshot anotado — é
`templates/conversational-form/ConversationalForm.dc.html`, lida diretamente
do projeto Claude Design (`fbafa129-4487-4384-aedb-d8c296af2418`) via
`DesignSync(get_file)`. Todo o restante desta spec usa esse arquivo como
fonte.

## 1. Objetivo
No canvas (`ConversationalForm.dc.html`), a tela do formulário ficou mais
limpa do que a produção. A autora revisou o protótipo, circulou dois
elementos redundantes e pediu a remoção deles também em
`src/formulario.html`:

1. **Faixa de progresso do topo** — etapas nomeadas (`Contexto · Contato ·
   Empresa · Envio`, introduzidas na Fase 5, `docs/specs/pages/aplicacao-conversacional.md`
   §4) + contador `n/8`. Some da página inteira, em toda etapa — não só
   visualmente, o `role="progressbar"` e os elementos `#stages`/`#count`
   saem do DOM.
2. **Banner "Aplicação rápida (2 minutos). Vagas limitadas (3 por semana)"**
   — passa a aparecer **só na primeira etapa** (a etapa de abertura, antes do
   nome). A partir da segunda etapa em diante, o formulário já está em
   andamento e o aviso deixa de fazer sentido ali; ele volta a some ao
   avançar e não retorna ao voltar, exceto se o usuário voltar até a etapa 1.

O indicador de progresso que sobra é só os `.dots` (pontinhos por etapa,
já existentes desde a Fase 4) — nenhum indicador novo foi criado para
substituir a faixa removida.

## Restrições vindas do código
- `docs/specs/pages/aplicacao-conversacional.md` §4/§5.1 documentava a faixa
  nomeada como parte aceita da Fase 5 (critério de aceite implícito). Esta
  spec substitui aquele trecho — ver atualização no próprio arquivo.
- Nenhum teste de `e2e/form-aplicacao.spec.js` ou `tests/a11y.spec.js`
  dependia de `#pb`, `#stages`, `#count`, `.cf-prog` ou `.cf-stage`
  (confirmado por busca antes da remoção) — a remoção não quebra o gate.
- Diferente do precedente da Fase 5 (que manteve `.bar`/`.step` sem uso no
  CSS por decisão explícita de rollback), aqui a feature inteira foi pedida
  para sair — as regras CSS de `.cf-prog`/`.cf-stages`/`.cf-stage` e a custom
  property `--stage-idle` foram apagadas junto com o markup, não deixadas
  como código morto.

## 2. Acordeão do bloco "O que analisamos"

No canvas, o parágrafo "O que eu analiso na sua sessão" é um `<summary>`
recolhível (marcador `+`/`–`) que abre uma grade com os 3 eixos — na
produção esse bloco aparecia sempre expandido como `<ul>`. Convertido para
`<details>`/`<summary>` nativo em `src/formulario.html` (sem JS: rung 4 da
lista de preguiça — o navegador já resolve teclado, foco e
`aria-expanded`/estado para disclosure nativo). Copy dos 3 itens **mantida
idêntica** à de produção — o canvas usa uma redação um pouco diferente
("Dependência de aprovação" minúsculo, texto reescrito), mas trocar copy sem
passada da autora não é decisão de posicionamento, e o contrato de
`aplicacao-conversacional.md` §2.3 já trata copy como decisão dela.

## 3. Bug de fonte: `<legend>` e `.intro-title` caindo no default de corpo

A autora comparou de novo produção vs. canvas e apontou que "Para começar,
qual é o maior desafio..." aparecia em sans-serif bold na produção contra
serif no canvas — não era posicionamento, era fonte. Causa raiz confirmada
via `getComputedStyle` no build:

- `body` calcula `Inter, sans-serif` em produção (de `src/style.css`, **e
  está correto** — `STYLE_GUIDE.md` §Tipografia: "Serif para títulos, Sans-
  Serif para corpo"). O `body{font-family:'Playfair Display',serif}` do
  `<style>` inline de `formulario.html` nunca vence essa cascata.
- `style.css` também tem `h1,h2,h3,h4{font-family:var(--font-playfair)}`
  global — por isso `h2` (usado nas etapas de texto) já saía correto.
- `<legend>` (heading das etapas de múltipla escolha) e `.intro-title` não
  são `h1-h4`, então não pegavam essa regra e caíam no default de corpo
  (Inter) — a mesma pergunta mudava de fonte dependendo do tipo de etapa.

Corrigido: `font-family: 'Playfair Display', serif` explícito em `legend`,
`.intro-title` e (defensivamente, já que dependia implicitamente da mesma
cascata frágil entre stylesheets) `h2`, em `src/formulario.html`.
Verificado com `getComputedStyle` antes/depois do fix e screenshot.

## 4. Fora desta rodada — decisão pendente da autora

Comparando o resto do canvas com a produção, três diferenças a mais
apareceram. Nenhuma foi implementada:

| Item | Canvas | Produção | Por que ficou de fora |
| :-- | :--- | :--- | :--- |
| Cabeçalho | wordmark pequena, alinhada à esquerda | logo 68px centralizada (`.l-img` já é 68px, não os 200px do atributo HTML) | Já bate na prática — não há o que ajustar |
| H1 de abertura | frase curta em serifada grande, separada de um parágrafo de apoio | um único título + lead, sem headline grande | O texto do canvas é **copy diferente**, não só estilo maior — adotar exigiria reescrever a frase, que é decisão da autora, não de posicionamento |
| Rodapé | Voltar + nota na mesma linha do botão primário, com borda superior | `.btns` (Voltar/Próximo) separado do bloco de nota+dots, sem borda | Mudança estrutural maior por ganho cosmético baixo — risco desproporcional pro valor |
| Nº de perguntas | 6 (sem e-mail, sem consentimento) | 8 | **Não deve mudar.** `aplicacao-conversacional.md` §2 (P1/P2) já rejeitou exatamente essa divergência: e-mail é chave de EMQ do CAPI, consentimento é exigência de LGPD |

## Critérios de pronto
- [x] `.cf-prog` (stages nomeadas + contador) não existe mais no DOM em
      nenhuma etapa.
- [x] `<p class="prg-txt">` (banner "Aplicação rápida...") só é visível
      (`hidden` removido) quando `current === 0`; some em qualquer outra
      etapa e volta a aparecer se o usuário voltar até a etapa 1.
- [x] `.dots` continua funcionando como indicador de progresso residual.
- [x] "O que analisamos na sua sessão" é `<details>` recolhível, fechado por
      padrão, copy inalterada.
- [x] `legend`/`.intro-title`/`h2` calculam `'Playfair Display', serif`
      (`getComputedStyle`), consistente entre os dois tipos de etapa.
- [ ] `npm run gate` verde.
- [ ] Autora decide se algum item da tabela do §4 entra em rodada futura.

## Referência
- Screenshot anotado da autora sobre `ConversationalForm.dc.html` no Claude
  Design, sessão de 2026-09-17.
- `docs/specs/pages/aplicacao-conversacional.md` §2 (P1/P2), §4/§5.1 —
  trechos que esta spec referencia ou substitui.
