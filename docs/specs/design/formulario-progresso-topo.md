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
apareceram. Duas foram decididas nesta mesma sessão (ver §5); as demais
seguem em aberto:

| Item | Canvas | Produção | Situação |
| :-- | :--- | :--- | :--- |
| Cabeçalho | wordmark pequena, alinhada à esquerda | logo 68px centralizada | **Decidido — ver §5.1.** A autora comparou de novo e pediu a wordmark; a avaliação anterior ("já bate na prática") foi revista |
| H1 de abertura | frase curta em serifada grande, separada de um parágrafo de apoio | um único título + lead, sem headline grande | **Decidido — ver §5.2.** Resolvido sem trocar copy: a autora quer mais destaque hierárquico, não um texto novo |
| Rodapé | Voltar + nota na mesma linha do botão primário, com borda superior | `.btns` (Voltar/Próximo) separado do bloco de nota+dots, sem borda | Ainda em aberto — mudança estrutural maior por ganho cosmético baixo — risco desproporcional pro valor |
| Nº de perguntas | 6 (sem e-mail, sem consentimento) | 8 | **Não deve mudar.** `aplicacao-conversacional.md` §2 (P1/P2) já rejeitou exatamente essa divergência: e-mail é chave de EMQ do CAPI, consentimento é exigência de LGPD |

## 5. Resolvido nesta sessão (2026-09-17, segunda rodada)

### 5.1 Cabeçalho: logo → wordmark textual

`.l-w > img.l-img` (68px, `/boutiquelogo.webp`) trocado por texto, reaproveitando
o padrão já em produção em `src/index.html` (`.logo`): Playfair 600,
`clamp(1.05rem,4vw,1.35rem)`, `letter-spacing:.03em`, ponto final em
`var(--gold-subtle)`. Nova classe `.wordmark` em `src/formulario.html` —
`.logo` de `index.html` não foi reaproveitada diretamente porque lá é um
`<a>` de navegação (com `text-decoration`/`color` de link) e aqui é rótulo
estático, mas os valores tipográficos são idênticos de propósito.

### 5.2 H1 de abertura: eyebrow + headline, copy inalterada

O ganho de "destaque" do canvas não é sobre o texto (que segue vedado pela
mesma razão do §4) — é hierarquia: no canvas o rótulo de categoria
("Sessão Estratégica de Diagnóstico BE") fica pequeno e o título é grande;
em produção os dois papéis estavam invertidos, porque `.intro-title`
acumulava a fonte do heading (1.25rem) *e* o `border-left` dourado — a
mesma decoração de `.cf-an` (bloco de análise/devolutiva), o que fazia o
texto de abertura da sessão 1 parecer um bloco de devolutiva, não um
título.

Sem reescrever nenhuma frase, as duas classes trocaram de papel:

* `.intro-title` → **`.intro-eyebrow`**: `text-transform:uppercase`,
  `.72rem`/`letter-spacing:.2em`, `var(--text-secondary)`, Inter — mesmo
  texto ("Sessão Estratégica de Diagnóstico BE"), agora rótulo de categoria
  e não título.
* `.hint.intro-lead` → **`.intro-headline`**: Playfair 400,
  `clamp(1.9rem,3.8vw,2.9rem)`/`line-height:1.12`/`letter-spacing:-.025em`
  — mesmo texto ("Uma reunião individual de 45 minutos..."), agora o
  headline real da tela 1.
* `border-left` dourado **removido** da abertura — fica exclusivo de
  `.cf-an` (devolutiva), para as duas coisas pararem de se parecer.

Nenhuma chave nova de copy, nenhum arquivo de dados tocado — só CSS/markup
de `src/formulario.html`.

### 5.3 Correção: headline carregando o parágrafo inteiro

Renderizando o protótipo de verdade no navegador (não só lendo o `.dc.html`)
ficou visível que ele tem **três** níveis de texto — eyebrow, headline curto
(2 linhas) e um parágrafo `.intro-subtitle` em Inter, separado — e o §5.2
implementou só dois, empurrando a frase inteira para dentro do headline.
Resultado: 6-7 linhas em escala de título, dominando a tela de um jeito que
o protótipo não tem.

Corrigido **sem inventar copy**: a mesma frase foi dividida no ponto de
quebra natural (`.`), a primeira parte virou o headline e a segunda uma
nova classe `.intro-subtitle` (Inter, `clamp(1rem,1.3vw,1.125rem)`,
`line-height:1.7`, `var(--text-secondary)`, `max-width:58ch`) — mesmo
tratamento do subtítulo do protótipo. Nenhuma palavra nova; só
redistribuição.

### 5.4 Medida: 680px → 760px

`.c` (container que envolve as 8 etapas) estava em `680px`, mais estreito
que os `760px` que o próprio `ConversationalForm.dc.html` usa
(`max-width:760px` no `<div data-enter>`). Na versão desktop o texto ficava
apertado — mudança de um valor só, afeta as 8 etapas por igualdade (todas
compartilham `.c`).

### 5.5 Respiro vertical no desktop

`.c{padding:2rem 1.5rem}` era o mesmo em qualquer largura — no desktop o
cartão ficava com a mesma folga "mobile-first" flutuando num viewport bem
maior, sem a área ao redor comunicar intenção. Adicionado
`@media(min-width:900px){.c{padding:4rem 2rem}}`: mais respiro vertical
acima/abaixo do conteúdo, sem alargar a medida de leitura (760px continua
o teto). Mobile/tablet inalterados.

### Critérios de pronto (§5)
- [x] `.l-img`/`boutiquelogo.webp` não aparecem mais em `src/formulario.html`.
- [x] `.intro-eyebrow` e `.intro-headline` calculam as fontes acima
      (`getComputedStyle`), sem `border-left`.
- [x] Copy da tela 1 idêntica à anterior, char a char.
- [ ] `npm run gate` verde.

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
