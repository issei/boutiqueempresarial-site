# Plano de execução — Fase 5 (formulário conversacional)

**Status:** Executado (PR #20 e #21). A spec que ele implementa, `pages/aplicacao-conversacional.md`, está marcada como Implementada.

**Implementa:** `docs/specs/pages/aplicacao-conversacional.md`
**Contrato de dados:** `docs/specs/pages/formulario.md` §3 (inalterado nesta fase)
**Pipeline:** `docs/specs/PLANO_MULTIAGENTE.md` — mesmas regras de protocolo (§6), mesma matriz de modelos (§2), mesmo árbitro (`npm run gate`)
**Branch sugerido:** `spec/formulario-fase5`

---

## 0. Antes de começar — sanidade do stack

O manifesto de orquestração proposto para esta fase acrescenta `GitHub Spec Kit`, `CodeGraph`, `AST Metrics MCP`, `ai-memory`, `ARGUS MCP`, `SafeWeave` e `Superpowers` ao que já existe (`rtk`, `caveman`, `ponytail`). A regra §9.5 do `PLANO_MULTIAGENTE.md` se aplica a todos eles sem alteração:

> **São otimização, não requisito.** O gate, os testes e os subagentes precisam funcionar com zero dos sete instalados.

Isso não é cautela retórica — é o resultado já medido com o `rtk`, que **não tem caminho de instalação viável em sessão cloud** (403 no asset de release, 404 no `install.sh`, nome colidido no crates.io). Assumir uma ferramenta nova sem medir repete esse erro sete vezes.

**Etapa 0.1 — medir, em uma sessão, antes de escrever código.** Para cada item: instala? alcança o registry do VM? o MCP faz handshake? Resultado em tabela, com o mesmo formato da §9.1. Itens que não passarem entram na coluna "❌ não viaja" e **saem do SOP desta fase** — não viram pendência aberta.

**Etapa 0.2 — decidir o que fica.** Julgamento antecipado, a confirmar pela medição:

| Ferramenta | Valor nesta fase | Recomendação |
| :-- | :--- | :--- |
| `ponytail` | alto — a fase toca 2 arquivos grandes existentes; diff mínimo é o que separa um PR revisável de um ilegível | **manter**, com a regra também no texto dos prompts (fallback da §9.5) |
| `rtk` + `gate-runner` | alto — o log do Playwright é o maior bloco de contexto do ciclo | **manter local**; no cloud, `gate-runner` sozinho |
| `ai-memory` | médio — as decisões desta fase já vivem no spec, que é versionado. Memória externa que duplica spec versionado viola a §6.4 ("contrato no spec, não no prompt") | **usar só para estado de execução** (fase em curso, bloqueio), nunca para decisão de contrato |
| `AST Metrics` | baixo — `formulario.html` é uma página com script inline; complexidade ciclomática não é o risco dominante aqui. O risco é regressão de rastreamento, e disso o gate cuida | **dispensável** nesta fase |
| `CodeGraph` | baixo — 7 páginas estáticas, grafo de dependências trivial | **dispensável** nesta fase |
| `ARGUS` / `SafeWeave` | médio-alto **em um ponto só**: a fase mexe em campo de dado pessoal e em `localStorage`. Vale um scan dirigido, não um `--full` no repo inteiro | **rodar uma vez**, na Etapa 6 |
| `Spec Kit` | a avaliar — o repositório já tem convenção de spec própria, madura e cobrada por gate. Adotar `specify` reestrutura `docs/specs/` inteiro | **fora desta fase.** Se for adotar, é migração própria, não carona numa mudança de formulário |

> A ordem de retorno da §5 continua valendo: cortar contexto que entra > cortar output que sai > baixar tier de modelo > baixar effort. Adicionar sete ferramentas mexe sobretudo no quarto item; o primeiro já está capturado pelo `gate-runner`.

---

## 1. Etapas

Cada etapa deixa o formulário **funcional e deployável**. Nenhuma depende de etapa futura para não quebrar.

### Etapa 1 — Higiene e tokens
**Arquivos:** `src/formulario.html`, `src/style.css`
**Executor:** `head-fixer` · Haiku · effort baixo
**Depende de:** nada

Verificar e remover `maximum-scale=1.0, user-scalable=no` se ainda presente (D11). Declarar no `:root` as custom properties da §5.2 do spec que ainda não existirem — em especial `#886829` (dourado de texto) e `#EFEDE8` (hairline interna).

**Pronto quando:** o gate segue verde e o `<head>` não restringe zoom.

---

### Etapa 2 — Progresso em etapas nomeadas
**Arquivos:** `src/formulario.html`
**Executor:** `head-fixer` · Haiku
**Depende de:** 1

Substituir `.bar`/`.step` percentual por `.cf-prog` com Contexto · Contato · Empresa · Envio + contador `n/8`. `aria-valuenow` derivado de `steps.length` — a regra de D5 continua valendo. `.bar` e `.step` **permanecem no CSS**, sem uso.

**Pronto quando:** atravessar as 8 etapas marca a etapa nomeada correta e o contador chega a `8/8`.

---

### Etapa 3 — Bloco de opções e avanço automático
**Arquivos:** `src/formulario.html`
**Executor:** sessão principal · Sonnet
**Depende de:** 1

Bloco único com hairline interna (última linha sem), inversão na seleção, numerador, escalonamento de 55 ms. Remover o botão "Continuar" das 4 etapas de radio; avanço de 380 ms cancelado por erro e suspenso quando "Outro" está selecionado. Atalhos 1–4 e `Enter`.

Não é trabalho de Haiku: mexe na máquina de navegação que carrega a correção de D5, e o modo de falha (avançar com etapa inválida) é silencioso.

**Pronto quando:** critérios 11 e 12 do spec passam manualmente em desktop **e** em mobile real.

---

### Etapa 4 — Copy do diagnóstico
**Arquivos:** `src/js/form-copy.js` (novo)
**Executor:** `copy-writer` · Sonnet
**Depende de:** nada (trilha paralela — pode ir junto com 2 e 3)

Um módulo de dados, sem lógica de UI:

*   `ANALISE` — 4 blocos, chaveados por `maior_problema_gestao`, `modelo_negocio`, `tamanho_equipe`, `faturamento_mensal`; cada entrada com `kicker`, `axis`, `text`.
*   `FECHAMENTO` — 20 entradas chaveadas por `eixo_segmento`.
*   `TIME_COM` / `FAT_DE` — as formas que encaixam depois de "com" e de "faturamento de".
*   `preencher(tpl, vars)` — replace literal dos três tokens.

Restrições no prompt: `STYLE_GUIDE.md`, vocabulário controlado, e a regra de que **o texto é o mesmo** em qualquer lugar que apareça (mesma disciplina da §B6 do `HARNESS_AEO.md`).

**Pronto quando:** as 17 respostas produzem bloco íntegro e as 20 combinações produzem frase gramatical, sem token cru e sem preposição duplicada. **A autora revisa antes do merge** (§2.3 do spec).

---

### Etapa 5 — Montagem: blocos em tela e fechamento no obrigado
**Arquivos:** `src/formulario.html`, `src/obrigada.html`
**Executor:** sessão principal · Sonnet
**Depende de:** 3 e 4

Renderizar o bloco de análise nas etapas 2, 6, 7 e 8 a partir da resposta anterior. Gravar `be_perfil` no `localStorage` no submit, ao lado do `event_id` que já é gravado. `obrigada.html` lê, monta espelho + fechamento, e cai no agradecimento genérico se a chave faltar — **sem nunca** deixar de disparar o Pixel.

**Pronto quando:** critérios 13 a 17 passam, incluindo o caminho de `localStorage` vazio.

---

### Etapa 6 — Verificação
**Arquivos:** `e2e/form-aplicacao.spec.js`, `tests/a11y.spec.js`
**Executor:** `test-author` · Sonnet → `gate-runner` · Haiku
**Depende de:** 5

Estender o E2E existente (não criar suíte paralela — ele já cobre os critérios 1–9 e o payload):

*   ordem das 8 etapas, com `email` e `consentimento`;
*   ausência de botão em etapa de radio + avanço automático;
*   "Outro" suspendendo o avanço e bloqueando vazio;
*   bloco de análise coerente e atualizado ao voltar e trocar;
*   **4 combinações** de eixo × segmento no `obrigada.html`, obrigatoriamente incluindo `segmento_outro` e a faixa "Acima de R$ 300 mil/mês", asseverando que **nenhum `[` sobra** no texto;
*   nome em minúsculas → capitalizado nas três ocorrências;
*   `localStorage` vazio → genérico + Pixel;
*   a11y (axe-core) em etapa de radio, etapa de texto e `obrigada.html`.

Scan de segurança dirigido nos dois pontos que a fase realmente move — campo de dado pessoal e `localStorage` — em vez de `--full` no repositório. Se o `ARGUS` não passar a Etapa 0.1, o substituto é revisão manual dessas duas superfícies, não pendência aberta.

**Pronto quando:** `npm run gate` verde e `gate-runner` devolve `{ status: "green" }`.

---

### Etapa 7 — Documentação e merge
**Arquivos:** `docs/specs/pages/formulario.md`, `docs/specs/pages/aplicacao-conversacional.md`
**Executor:** sessão principal · Opus
**Depende de:** 6

Atualizar `formulario.md` para apontar a Fase 5 como vigente no frontend (o contrato de dados dele não muda). Mudar o Status do spec desta fase para "Implementado". Registrar D11 como resolvido.

Frontend e docs no **mesmo PR** — mesma regra das Fases 3 e 4. Apps Script **fora** do PR: nada nele mudou, e por isso `ensureSheet()` não arquiva a aba.

---

## 2. Grafo de dependências

```
0 sanidade do stack
└── 1 higiene + tokens
    ├── 2 progresso ──────────┐
    ├── 3 opções + avanço ────┼── 5 montagem ── 6 verificação ── 7 docs/merge
    └── (4 copy) ─────────────┘
```

A Etapa 4 não depende de nenhuma anterior: é copy, roda em paralelo desde o início, e é a que tem maior latência humana (revisão da autora). **Começar por ela** em vez de deixar para o fim é a única decisão de sequenciamento que muda o prazo real.

## 3. Distribuição de modelos

| Etapa | Executor | Modelo | Por quê |
| :-- | :--- | :--- | :--- |
| 0 | sessão principal | Opus | decidir o stack é arbitragem, e ela contamina todas as outras |
| 1, 2 | `head-fixer` | Haiku · effort baixo | delta explícito, verificável pelo gate |
| 3, 5 | sessão principal | Sonnet | mexe na máquina de navegação; falha silenciosa |
| 4 | `copy-writer` | Sonnet | voz de marca — Haiku erra tom, Opus não se paga em texto que a autora revisa |
| 6 | `test-author` → `gate-runner` | Sonnet → Haiku | escrever asserção é julgamento; rodar e filtrar não é |
| 7 | sessão principal | Opus | conciliação entre três specs |

**Escalada (§6 do `PLANO_MULTIAGENTE.md`):** agente barato que falha **duas vezes na mesma asserção** para e devolve o estado. Não tenta a terceira.

**Sem subagente para etapa de um arquivo** (§6.5): as Etapas 1 e 2 tocam só `src/formulario.html` e, se a sessão principal já o tem em contexto, editar direto é mais barato que despachar.

## 4. O que faria esta fase sair mais caro que uma sessão única

Registrado porque é o modo de falha real de pipeline multi-agente neste repositório:

1. **Fan-out sem paralelismo real.** A fase toca 2 arquivos, não 7 páginas. O ganho do fan-out das Fases 1 e 3 **não existe aqui** — despachar 7 subagentes sobre 2 arquivos só multiplica partida a frio.
2. **Adotar Spec Kit de carona.** Reestruturar `docs/specs/` no meio de uma mudança de formulário mistura duas migrações e torna o diff irrevisável.
3. **Copy no fim.** A revisão da autora é o item de maior latência; deixá-la para depois da Etapa 5 bloqueia um merge que já estaria pronto.
4. **`security_scan --full` por hábito.** Scan do repositório inteiro para uma mudança em dois arquivos é contexto que entra sem responder pergunta nenhuma — o oposto do item 1 da ordem de retorno.

## 5. Referências

*   `docs/specs/pages/aplicacao-conversacional.md` — o contrato que este plano implementa
*   `docs/specs/PLANO_MULTIAGENTE.md` — subagentes, matriz de modelos, protocolo e §9.5
*   `docs/specs/pages/formulario.md` · `docs/specs/formulario-fase4-ajustes.md` — estado vigente
*   `docs/specs/TESTING_GUIDE.md` — regras de ouro do E2E
