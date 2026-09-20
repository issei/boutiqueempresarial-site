# Formulário — Fase 4: reordenação de perguntas + hero visual

**Status**: Implementada (PR #19). O contrato de dados resultante está em `pages/formulario.md` §3.

> Especificação de mudanças a partir dos comentários de revisão de 2026-09-16 no doc
> "COPY FORMULÁRIO" (Google Docs) e de pedido de ajuste visual da autora. Continuação da
> Fase 3 (PR #17/#18 — apresentação na etapa 0 e blocos C/D da copy).

## Decisões confirmadas

- **E-mail**: mantém, na posição atual (depois do WhatsApp).
- **Escala 0–10** (`dependencia_operacional`): remove — pergunta, coluna da planilha,
  linha do e-mail de notificação e push do Meta CAPI (`lead_dependencia`).
- **Nome completo**: só muda o texto na tela (pergunta, placeholder, mensagem de erro)
  para pedir só o primeiro nome. Campo/variável continua `nome_completo`, autocomplete e
  regra de validação (`≥ 3 caracteres`) não mudam.
- **"Maior desafio com a equipe"** (`maior_problema_gestao`, 3 opções, sem "Outro"):
  remove essa versão. Nasce uma nova pergunta — "Qual é o maior desafio da sua operação
  hoje?" — na **1ª posição**, opções reescritas + opção **"Outro"** (campo de texto
  extra, padrão de `modelo_negocio_outro`). Reaproveita o nome do campo
  `maior_problema_gestao` para não mexer no cabeçalho existente da coluna
  "Maior Desafio (Equipe)".
- **Visual da 1ª etapa (hero sutil)**: logo menor e reposicionado, espaçamentos
  comprimidos, leve destaque visual no bloco de intro — tudo para caber na primeira
  dobra da tela.
- O comentário "retirar" do doc era uma anotação da autora sobre a organização do
  próprio documento (onde inserir a pergunta de nome), não sobre o formulário — sem
  ação de código.

## Nova ordem de etapas

| # | Pergunta | Campo | Tipo | Obs. |
|---|---|---|---|---|
| 1 | Qual é o maior desafio da sua operação hoje? | `maior_problema_gestao` (+ `maior_problema_gestao_outro`) | radio (4 opções) | **novo texto/posição**, com "Outro" |
| 2 | Para começar, qual o seu nome? | `nome_completo` | text | só texto de tela muda |
| 3 | Qual o seu WhatsApp com DDD? | `whatsapp` | tel | sem mudança |
| 4 | E-mail corporativo | `email` | email | sem mudança |
| 5 | Qual é o modelo de negócio da sua empresa? | `modelo_negocio` (+ outro) | radio | sem mudança |
| 6 | Quantidade de pessoas no time | `tamanho_equipe` | radio | sem mudança |
| 7 | Faturamento médio mensal | `faturamento_mensal` | radio | sem mudança |
| 8 | Termo de Consentimento | `consentimento` | checkbox | sem mudança (decisão Fase 3 mantida) |

Removida: "Em uma escala de 0 a 10..." (`dependencia_operacional`).

## Mudanças por arquivo

### 1. `src/formulario.html`

**Estrutura/conteúdo**
- Reordenar os blocos `.step` na ordem acima (navegação e barra de progresso são
  derivadas de `steps.length`/DOM — só a ordem dos blocos importa).
- Novo step 0: fieldset "Qual é o maior desafio da sua operação hoje?", 4 radios
  `name="maior_problema_gestao"`:
  - "Equipe dependente / preciso aprovar quase tudo"
  - "Falta de padrão nas entregas e retrabalho"
  - "Informações perdidas e excesso de mensagens no WhatsApp"
  - "Outro" com `data-other="maior_problema_gestao_outro"` +
    `<input class="oth h" name="maior_problema_gestao_outro" placeholder="Qual?">`
    (clonar o padrão de `modelo_negocio_outro`, linhas 586-589).
- Step "nome" (linhas 545-548): `<h2>` → "Para começar, qual o seu nome?"; placeholder
  → "Digite seu primeiro nome..."; erro (linha 848) → "Informe seu nome.".
- Remover o step da escala 0–10 inteiro (linhas 626-645).
- Remover o step antigo de "maior desafio com a equipe" (linhas 647-662) — substituído
  pelo novo step 0.
- Atualizar `aria-valuenow` inicial da barra (linha 528): `11` → `13` (1 de 8 etapas).
- Renumerar os comentários `<!-- N — ... -->` de cada step.

**Visual — hero sutil da 1ª etapa (só CSS/marcação, sem nova dependência)**
- Logo (linhas 99-111): reduzir `.l-img` de 200px para ~64-72px; `.l-w` de
  `margin-bottom: 2rem` para ~`0.75rem`.
- Barra de progresso (linhas 113-120): `.p-c margin-bottom` de `2rem` para ~`1–1.25rem`.
- Bloco de intro (linhas 315-354): `.intro margin-bottom` de `2rem` para ~`1–1.25rem`;
  `.intro ul gap` de `.65rem` para `.4rem`.
- Destaque visual do `.intro-title`: acento leve (traço/borda à esquerda ou fundo
  levemente diferente de `--bg-color`) para reforçar a leitura de "seção" sem aumentar
  altura.
- `h2` (linhas 150-155): `margin-bottom` de `1.5rem` para ~`1rem`.
- Breakpoint `@media(max-height:600px)` (linhas 498-503): reforçar aqui — logo ainda
  menor e bullets do `.intro ul` ocultos/recolhidos nessa condição.
- Escopo: afeta só a etapa 0 (intro fica só na 1ª pergunta, como já é hoje) — demais
  etapas não mudam.

### 2. `apps_script_atualizado.gs`
- `HEADERS` (linhas 52-63): remover `'Dependência Operacional (0-10)'`; adicionar
  `'Maior Desafio (Outro)'` logo após `'Maior Desafio (Equipe)'`.
- `saveToSheet()`: remover `sanitizeInput(data.dependencia_operacional)` (linha 173);
  adicionar `sanitizeInput(data.maior_problema_gestao_outro)` após
  `data.maior_problema_gestao` (linha 175).
- `buildLeadEmail()`: remover a linha "Dependência da operação (0-10)" (linha 269);
  trocar "Maior desafio" (linha 270) para
  `withOther(data.maior_problema_gestao, data.maior_problema_gestao_outro)`, igual ao
  modelo de negócio.
- Push Meta CAPI (linhas 356-358): remover `lead_dependencia: data.dependencia_operacional || ''`.
- Payload de teste (linhas 446-458): remover `dependencia_operacional`; atualizar
  `maior_problema_gestao` para uma das novas opções; adicionar
  `maior_problema_gestao_outro: ''`.
- **Deploy:** mudança no `HEADERS` faz o `ensureSheet()` arquivar a aba atual e criar
  uma nova — combinar deploy do Apps Script com o merge do frontend.

### 3. `docs/specs/pages/formulario.md`
- Atualizar a tabela de campos (linhas 47-57): nova ordem (8 linhas), remover
  `dependencia_operacional`, atualizar `nome_completo` e `maior_problema_gestao`
  (+ `_outro`).
- Atualizar a sequência de navegação (linha 95).
- Atualizar a tabela de validação (linhas 102-107): remover `dependencia_operacional`.
- Atualizar a nota da linha 61 e o checklist (linhas 148-149) para refletir 7 perguntas
  + consentimento e a nova posição/conteúdo do "maior desafio".

### 4. `e2e/form-aplicacao.spec.js`
- Ajustar a ordem dos passos preenchidos no teste; remover a interação com a escala
  0–10.
- Cobrir a nova 1ª pergunta, incluindo o caminho "Outro" com o campo de texto
  obrigatório.

**Why:** a copy do Google Docs é a fonte de conteúdo, mas a autora tem palavra final
sobre o que entra; o visual busca reduzir o scroll antes da 1ª pergunta e melhorar
engajamento.
**How to apply:** as mudanças de frontend, Apps Script e docs/specs devem ir no mesmo
PR/deploy (mesma regra da Fase 3 — `HEADERS` e `ensureSheet()` exigem sincronia entre
planilha e Web App).
