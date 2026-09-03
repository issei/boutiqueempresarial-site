# SDD — Plano de Desenvolvimento Multi-Agente (modelos econômicos)

**Status:** Proposta (aguardando implementação)
**Branch de origem:** `spec/harness-aeo`
**Implementa:** `docs/specs/HARNESS_AEO.md` (Parte A — Harness)
**Configuração:** `apm.yml` na raiz

---

## 1. Princípio

> **Modelo caro decide. Modelo barato executa. O gate arbitra.**

O trabalho deste repositório é majoritariamente mecânico e verificável: injetar meta tags,
replicar um padrão de `<head>`, gerar um companion Markdown, rodar um comando e reportar
o que falhou. Nada disso precisa do modelo mais capaz — precisa de um contrato claro e de
um verificador determinístico do outro lado.

O que **não** é mecânico: decidir o contrato, resolver conflito entre specs, e julgar copy
de marca. Isso fica com o modelo caro, e é a menor parte do volume.

Três consequências de projeto:

1. **O gate é o árbitro, não o modelo.** Com `npm run gate` fail-closed, um agente barato
   errando é barato de detectar. Sem gate, economizar modelo é transferir o custo para a
   revisão humana — que é a mais cara de todas.
2. **Subagente estreito, contrato explícito.** Um agente que recebe "conforme esta página ao
   §B1" acerta em Haiku. Um agente que recebe "melhore o SEO do site" não acerta em modelo
   nenhum.
3. **Contexto é o custo dominante, não o modelo.** Trocar Opus por Haiku corta 5× o preço por
   token; devolver diff em vez de arquivo inteiro corta 20× o número de tokens. As duas
   alavancas se multiplicam — e a segunda vale mais.

---

## 2. Matriz de modelos

Preços da API Anthropic por milhão de tokens (referência de dimensionamento):

| Modelo | ID | Entrada | Saída | Papel neste repositório |
| :-- | :-- | --: | --: | :-- |
| Opus 5 | `claude-opus-5` | $5,00 | $25,00 | sessão principal: spec, arquitetura, arbitragem de conflito |
| Sonnet 5 | `claude-sonnet-5` | $2,00 | $10,00 | implementação com julgamento: testes, JSON-LD, copy de marca |
| Haiku 4.5 | `claude-haiku-4-5` | $1,00 | $5,00 | trabalho mecânico e verificável: auditar, aplicar, rodar |

> **Sobre assinatura:** em plano Max/Pro o custo marginal por token é zero — os valores acima
> são o **equivalente em API** do que o fluxo consome, útil para dimensionar e comparar
> desenhos, não uma fatura. O ganho real na assinatura é limite de uso e latência, não dinheiro.

**Onde o tier é declarado:** no frontmatter do subagente (`.claude/agents/<nome>.md`, campo
`model:` com os aliases `haiku` / `sonnet` / `opus`) — é o campo que o Claude Code lê de fato.
O `apm.yml` distribui esses arquivos; ele não define modelo. Um lugar só, verificável.

**Effort:** subagentes de tarefa mecânica rodam em effort baixo. Effort alto em tarefa
mecânica é a forma mais silenciosa de desperdício — o modelo pensa sobre uma decisão que o
contrato já tomou.

---

## 3. Os cinco subagentes

Cada um tem uma responsabilidade, um formato de saída e o menor conjunto de ferramentas que
a cumpre. Ferramenta a mais é turno a mais.

### 3.1 `page-auditor` — Haiku · leitura

| | |
| :-- | :-- |
| **Tools** | `Read`, `Grep`, `Glob` |
| **Entrada** | um caminho `src/<pagina>.html` |
| **Saída** | JSON: `{ page, head_deltas[], jsonld_deltas[], a11y_risks[] }` |
| **Contrato** | compara a página contra `HARNESS_AEO.md` §B1/§B2 e devolve **só a diferença** |

Não edita. Não explica. Não devolve o HTML lido. Roda **uma instância por página**, todas em
paralelo — 7 leituras pequenas custam menos que uma leitura do repositório inteiro, e nenhuma
delas enche o contexto da sessão principal.

### 3.2 `head-fixer` — Haiku · escrita mecânica

| | |
| :-- | :-- |
| **Tools** | `Read`, `Edit` |
| **Entrada** | o JSON de deltas de uma página |
| **Saída** | as edições aplicadas + lista de uma linha por edição |
| **Skill** | `ponytail` (obrigatória) |

Aplica o delta, nada além do delta. Proibido reformatar, reordenar ou "melhorar de passagem" —
é o que transforma uma correção de 3 linhas em um diff de 300 que alguém tem que revisar.

### 3.3 `test-author` — Sonnet · escrita com julgamento

| | |
| :-- | :-- |
| **Tools** | `Read`, `Write`, `Edit`, `Glob`, `Bash` |
| **Entrada** | `HARNESS_AEO.md` §A3 + `TESTING_GUIDE.md` |
| **Saída** | `tests/seo.spec.js`, `tests/aeo.spec.js`, `tests/a11y.spec.js` |
| **Skill** | `ponytail` |

Escreve as suítes **uma vez**, iterando por glob sobre `src/*.html`. É trabalho de julgamento
(o que asseverar, como falhar de forma legível), por isso Sonnet; mas é trabalho de uma vez só,
por isso não justifica Opus.

### 3.4 `copy-writer` — Sonnet · voz de marca

| | |
| :-- | :-- |
| **Tools** | `Read`, `Write`, `Edit` |
| **Entrada** | a página + `STYLE_GUIDE.md` + vocabulário controlado (`HARNESS_AEO.md` §B6) |
| **Saída** | bloco `AEO-BODY` (TLDR + FAQ) e o companion `public/<slug>.md` |
| **Skill** | `ponytail` |

Único agente que produz texto voltado ao cliente. Restrições que carrega no prompt: grafias
fixas, verbos proibidos, e a regra de que a resposta do FAQ visível e a do JSON-LD são **o
mesmo texto**, não paráfrases. Haiku erra tom de marca; Opus escreve bem e cobra 2,5× o Sonnet
para um texto que o humano vai revisar de qualquer jeito.

### 3.5 `gate-runner` — Haiku · execução

| | |
| :-- | :-- |
| **Tools** | `Bash` |
| **Entrada** | nenhuma |
| **Saída** | `{ status: "green" \| "red", failures: [{ spec, assertion, file }] }` |
| **Contrato** | roda `npm run gate` e devolve **apenas as asserções que falharam** |

O log inteiro do Playwright é dezenas de milhares de tokens de ruído. Este agente existe para
que esse log morra dentro dele e só o essencial atravesse para a sessão principal. É o item de
maior retorno da lista inteira.

---

## 4. Pipeline por fase

As fases são as de `HARNESS_AEO.md` §6. Quem executa cada uma:

| Fase | Trabalho | Executor | Modelo |
| :-- | :-- | :-- | :-- |
| **0. Bootstrap** | criar os 5 agentes, o `quality-gate.mjs`, o `AGENTS.md` | sessão principal | Opus |
| **1. Correções (§B0)** | llms.txt, og:image, twitter cards | `head-fixer` ×7 em paralelo | Haiku |
| **2. Gate (§A2–A4)** | suítes de teste + CI | `test-author`, depois `gate-runner` | Sonnet → Haiku |
| **3. Contrato SEO (§B1)** | auditar → aplicar → verificar | `page-auditor` ×7 → `head-fixer` ×7 → `gate-runner` | Haiku |
| **4. AEO (§B2–B3)** | JSON-LD + bloco visível | `page-auditor` → `copy-writer` → `gate-runner` | Haiku → Sonnet → Haiku |
| **5. Camada máquina (§B4)** | companions `.md`, `rel=alternate` | `copy-writer` + `head-fixer` | Sonnet + Haiku |
| **Escalada** | gate vermelho 2× na mesma asserção, ou conflito entre specs | sessão principal | Opus |

**Regra de escalada — e ela é o que impede o plano de sair mais caro:** um agente barato que
falha duas vezes na mesma coisa não tenta uma terceira. Ele para e devolve o estado. Três
tentativas de Haiku somam mais tokens que uma de Opus, e ainda gastam o tempo do humano.

Fases 1 e 3 são fan-out: uma instância por página, em paralelo. Fases 2, 4 e 5 são sequenciais
porque a saída de uma alimenta a próxima.

---

## 5. Skills como alavanca de custo

| Skill | O que faz pelo custo | Onde entra |
| :-- | :-- | :-- |
| **ponytail** | força o menor diff que funciona. Menos token de saída (o caro: $5–25/MTok), menos superfície de revisão, menos código para o gate cobrir depois | obrigatória em `head-fixer`, `test-author`, `copy-writer` |
| **ponytail-review** | passada de revisão que só caça over-engineering | antes do PR de cada fase, em Sonnet |
| **rtk** ([Rust Token Killer](https://github.com/rtk-ai/rtk)) | comprime a saída de comando de shell antes de ela virar contexto — só a falha do teste, só o essencial do diff. `rtk init -g` instala um hook que reescreve os comandos Bash de forma transparente; `rtk gain` mostra o que foi economizado | no harness, sempre ligado; ganho concentrado em `gate-runner` e nas leituras de git |
| **caveman** | mede. `caveman learn --json` ranqueia onde o token realmente foi; `cavemem` tira do prompt o que se repete toda sessão | fora do ciclo de código, ao fim de cada fase |

**As três atacam pontos diferentes do mesmo ciclo, e por isso somam:**

- **rtk** corta o que *entra* (saída de comando), automaticamente e sem prompt.
- **ponytail** corta o que *sai* (diff produzido), que é o token caro.
- **caveman** *mede* o resultado das duas, para que "ficou mais barato" seja número e não impressão.

Medir sem dieta produz relatório; dieta sem medir produz palpite. O `apm.yml` declara
`cost:report` (caveman, o ciclo inteiro) e `cost:gain` (rtk, só o que ele comprimiu) para que a
medição seja um comando, não um ritual.

**rtk e `gate-runner` não são redundantes, são camadas:** rtk comprime o log do Playwright
sintaticamente (descarta ruído); o `gate-runner` o converte semanticamente em uma decisão
(`green` / lista de asserções). Com rtk ligado o `gate-runner` fica mais barato — não
desnecessário. Verificar na Fase 0 se os filtros do rtk cobrem Playwright; a documentação cita
Jest, pytest, cargo e Go test nominalmente.

**Ordem de aplicação, do maior retorno para o menor:**

1. Cortar contexto que entra (agente devolve delta, não arquivo; gate-runner filtra o log).
2. Cortar output que sai (ponytail).
3. Baixar o tier do modelo por tarefa (a matriz §2).
4. Baixar o effort em tarefa mecânica.

Fazer 3 antes de 1 e 2 é o erro clássico: troca-se o modelo, o desperdício de contexto
permanece, e a qualidade cai sem que a conta melhore de forma proporcional.

---

## 6. Protocolo entre agentes (as regras que produzem a economia)

Sem estas regras, um pipeline multi-agente custa **mais** que uma sessão única, porque cada
subagente recomeça frio e re-lê o que a sessão principal já tinha lido.

1. **Devolva delta, nunca conteúdo.** Nenhum subagente retorna arquivo lido, log completo ou
   HTML. Retorna o que mudou ou o que está errado, em JSON.
2. **Uma página por instância.** O fan-out existe para que nenhum contexto individual cresça.
   Um agente que audita as 7 páginas perde a vantagem inteira.
3. **O gate é o único critério de sucesso.** Nenhum agente declara "pronto" — declara "gate
   verde" ou devolve as falhas.
4. **Contrato no spec, não no prompt.** O prompt do subagente aponta para a seção de
   `HARNESS_AEO.md`; não a transcreve. Spec que vive em dois lugares diverge no primeiro mês.
5. **Sem subagente para tarefa de um arquivo.** Spawn tem custo fixo de partida a frio. Editar
   um arquivo conhecido é mais barato direto na sessão principal do que despachar.

---

## 7. Fase 0 — o que precisa existir antes

Ordem obrigatória, porque o pipeline sem o gate é um pipeline sem árbitro:

- [ ] `scripts/quality-gate.mjs` + script `gate` no `package.json`
- [ ] `@axe-core/playwright` instalado
- [ ] `.claude/agents/{page-auditor,head-fixer,copy-writer,test-author,gate-runner}.md`
      com `model:` no frontmatter
- [ ] `AGENTS.md` na raiz (`HARNESS_AEO.md` §A1)
- [ ] `rtk` disponível no shell que o harness usa + hook instalado (`rtk init -g`)
- [ ] baseline de custo: `caveman learn --json` **antes** da Fase 1, para que o ganho
      seja medido e não afirmado

---

## 8. Riscos e pendências

| Item | Situação |
| :-- | :-- |
| **`rtk`** | identificado: [rtk-ai/rtk](https://github.com/rtk-ai/rtk), declarado em `apm.yml`. **Não está no PATH desta máquina Windows** (nem em `~/.rtk`, `~/.cargo/bin` ou no PATH do PowerShell), e o hook `rtk init -g` não aparece em `~/.claude/settings.json`. A instalação documentada é Homebrew ou `install.sh` (macOS/Linux) — confirmar em que ambiente ele roda aqui antes da Fase 0 |
| **Cobertura do rtk** | os filtros citados nominalmente são Jest, pytest, cargo test e Go test. Se Playwright não estiver entre os 100+ comandos suportados, o ganho na Fase 2+ vem do `gate-runner`, não do rtk. Medir com `rtk gain`, não presumir |
| **`apm` CLI** | não instalado nesta máquina; `apm.yml` do repositório irmão também não tem `apm.lock.yaml`. O manifesto é válido como documentação de contrato desde já, mas `apm install` ainda não foi exercido |
| **MCP `caveman`** | o servidor está configurado em `~/.claude.json` e falhou ao conectar na sessão em que este spec foi escrito. Verificar antes de depender dele na Fase 0 |
| **Multi-agente pode custar mais** | se as regras do §6 não forem seguidas. O baseline da Fase 0 existe para detectar isso na primeira medição, não na décima |
| **Escala do repositório** | 7 páginas. O pipeline se paga no fan-out das fases 1 e 3; abaixo de ~5 páginas, sessão única é mais barata. Se o site encolher, este plano deixa de valer |

---

## 9. Referências

- `docs/specs/HARNESS_AEO.md` — o contrato que este pipeline implementa
- `apm.yml` — declaração de plugins, MCP e scripts
- `docs/specs/TESTING_GUIDE.md` — regras de ouro de teste E2E
- `docs/specs/STYLE_GUIDE.md` — voz e paleta que o `copy-writer` obedece
- Preços e IDs de modelo: Anthropic API (cache de 2026-06-24) — reconferir antes de usar os
  números para decisão financeira
