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
| **rtk** ([Rust Token Killer](https://github.com/rtk-ai/rtk)) | comprime a saída de comando de shell antes de ela virar contexto — só a falha do teste, só o essencial do diff. `rtk init -g` instala um hook que reescreve os comandos Bash de forma transparente; `rtk gain` mostra o que foi economizado | no harness local, sempre ligado; ganho concentrado em `gate-runner` e nas leituras de git. **Não assumido no cloud** — ver §9.5 |
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
desnecessário.

**Playwright é coberto:** `rtk playwright` está entre os filtros nativos ("Playwright E2E tests
with compact output"), assim como `npm`, `npx` e `vitest`. Detalhe de implementação da Fase 0:
o hook do rtk reescreve o comando de **topo** que o agente executa, e o gate roda o Playwright
de dentro do `quality-gate.mjs` — para o filtro alcançar a saída real, o `quality-gate.mjs`
deve invocar `rtk playwright test`, não `playwright test`. Medir com `rtk gain` antes e depois:
se a economia no gate ficar perto de zero, é este aninhamento, não o filtro.

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
- [ ] `.claude/settings.json` **commitado** (§9) — sem ele nada do acima existe no cloud
- [ ] `scripts/bootstrap.sh` + hook `SessionStart` (§9)
- [ ] `rtk` disponível no shell que o harness usa + hook instalado (`rtk init -g`) — local
- [ ] baseline de custo: `caveman learn --json` **antes** da Fase 1, para que o ganho
      seja medido e não afirmado — **só local**: sem caveman no VM, não há medição no cloud (§9.5)

---

## 8. Riscos e pendências

| Item | Situação |
| :-- | :-- |
| **`rtk`** | **resolvido.** [rtk-ai/rtk](https://github.com/rtk-ai/rtk) v0.47.0 em `D:\tools\rtk-x86_64-pc-windows-msvc`, adicionado ao PATH do usuário; hook global instalado (`rtk init -g` → `rtk hook claude` em `~/.claude/settings.json`, `~/.claude/RTK.md`). Verificado com `rtk git status` e `rtk gain` |
| **`caveman`** | **resolvido.** `@caveman-ai/cli@1.3.1` + `caveman setup --install` (6 binários em `~/.caveman/bin`, checksum conferido, `ready: true`); handshake MCP testado. O erro anterior era o binário inexistente. Baseline inicial: Cave Score 75, sink `dumbzone` 413/512 turnos acima de 50% da janela |
| **`apm` CLI** | não instalado nesta máquina; `apm.yml` do repositório irmão também não tem `apm.lock.yaml`. O manifesto é válido como documentação de contrato desde já, mas `apm install` ainda não foi exercido |
| **Multi-agente pode custar mais** | se as regras do §6 não forem seguidas. O baseline da Fase 0 existe para detectar isso na primeira medição, não na décima |
| **Ambiente cloud** | **verificado:** rtk não instala no VM (403 em asset de release). caveman alcança o npm, mas o `setup --install` não foi exercido. `ponytail` continua sem resposta até a Fase 0 criar `.claude/settings.json`. O pipeline roda sem os três, mais caro em token — ver §9.5 |
| **Duas cópias do setup script** | o diálogo do ambiente não lê o repositório; `docs/specs/cloud-setup.sh` é a cópia canônica e o diálogo recebe uma cópia colada. Divergem se alguém editar só um lado |
| **Escala do repositório** | 7 páginas. O pipeline se paga no fan-out das fases 1 e 3; abaixo de ~5 páginas, sessão única é mais barata. Se o site encolher, este plano deixa de valer |

---

## 9. Portabilidade — o mesmo plano no ambiente cloud

### 9.1 O problema

Tudo que foi instalado para viabilizar este plano é **local a uma máquina**: binários em
caminhos Windows, plugins em escopo de usuário, MCP declarado em `~/.claude.json`. Uma sessão
cloud clona o repositório num VM **Ubuntu 24.04 x86_64** limpo e não recebe nada disso —
configuração de usuário fica na máquina do usuário, e `/plugin` sequer existe lá.

O critério é simples: **se não está no repositório, não existe no cloud.**

| Item | Onde vive hoje | Chega no cloud? |
| :-- | :-- | :-- |
| specs (`docs/specs/`), `apm.yml` | repositório | ✅ |
| `.claude/agents/*.md` | repositório (Fase 0) | ✅ subagentes do repo são carregados automaticamente |
| `.claude/settings.json` (hooks, permissions, plugins) | **não existe ainda** | ✅ se commitado |
| `.mcp.json` (MCP de projeto) | **não existe ainda** | ✅ se commitado — mas o servidor precisa existir no VM |
| plugin `ponytail` | `~/.claude`, escopo user | ❌ user-level não viaja; declarar em `.claude/settings.json` |
| binários `caveman` | `~/.caveman/bin`, win32/amd64 | ❌ arquitetura errada e caminho local |
| `rtk` + hook | `D:\tools\...`, hook em `~/.claude/settings.json` | ❌ caminho Windows, `.exe`, hook user-level |
| `apm install` | CLI não instalado em lugar nenhum | ❌ |

### 9.2 O que o VM já traz

> **Verificado** em sessão cloud contra a branch `spec/harness-aeo`. O que segue é medido, não
> presumido.

Node 20/21/22 (22 no PATH, em `/opt/node22` — medido: **v22.22.2**, npm **10.9.7**),
npm/pnpm/yarn, `gh` autenticado por proxy, git, jq, ripgrep, Docker, Postgres e Redis, e
`cargo`. Rede em nível **Trusted**: registries de pacote e GitHub, nada além disso.
`npm ci` resolve o `package-lock.json` deste projeto limpo (150 pacotes).

**Os navegadores do Playwright já vêm no VM** — corrige a suposição original desta seção. Estão
em `/opt/pw-browsers` (`chromium-1194`, `headless_shell-1194`, `ffmpeg-1011`), com
`PLAYWRIGHT_BROWSERS_PATH` apontado para lá.

**Mas há um descasamento de versão que o bootstrap precisa tratar:** os builds pré-instalados são
da linha **1.56**, e o `package.json` pede `@playwright/test ^1.58.2`. Depois do `npm ci`, o
1.58 procura um build de browser que não está no diretório. Como
`PLAYWRIGHT_BROWSERS_PATH` já aponta para `/opt/pw-browsers`, um `npx playwright install chromium`
grava o build correto **ao lado** do que já existe e resolve — sem `--with-deps`, porque as libs
de sistema já estão instaladas e o hook não roda como root. Se a CDN do Playwright não estiver
no allowlist Trusted, esse passo falha: é o item que a próxima sessão cloud precisa medir.

### 9.3 As três camadas, e o que vai em cada uma

| Camada | Onde se configura | Roda | Use para |
| :-- | :-- | :-- | :-- |
| **Setup script** | diálogo do ambiente em claude.ai — **fora do repositório** | como root, antes do Claude Code, só quando não há cache | toolchain que não vem pré-instalado |
| **Hook `SessionStart`** | `.claude/settings.json` **no repositório** | toda sessão, local e cloud | setup de projeto: `npm ci`, browsers do Playwright |
| **`.claude/settings.json`** | repositório | sempre | permissions, hooks, `enabledPlugins`, `extraKnownMarketplaces` |

Regra prática: setup de **máquina** vai no setup script; setup de **projeto** vai no hook, porque
o hook também roda no seu laptop e evita que os dois ambientes divirjam.

O setup script não é versionável pelo diálogo — por isso a cópia canônica fica em
`docs/specs/cloud-setup.sh` no repositório, e o diálogo recebe uma cópia colada. Duas cópias é
ruim, uma cópia perdida é pior.

### 9.4 Mudanças concretas no projeto

1. **`.claude/settings.json`** (commitado):
   - `permissions.allow` para `npm run gate`, `npx playwright test`, `npx vite build`, `node scripts/`
   - hook `SessionStart` → `bash "$CLAUDE_PROJECT_DIR"/scripts/bootstrap.sh`
   - `enabledPlugins: { "ponytail@ponytail": true }` + `extraKnownMarketplaces` com a origem
2. **`scripts/bootstrap.sh`** — idempotente e `exit 0` sempre: `npm ci` quando faltar
   `node_modules`, e `npx playwright install chromium` (sem `--with-deps`, ver §9.2) para
   cobrir o descasamento de versão com os builds pré-instalados do VM.
3. **`scripts/quality-gate.mjs`** — usa `rtk playwright test` **se `rtk` estiver no PATH**, e
   `playwright test` caso contrário. Resolve o aninhamento do §5 e a portabilidade de uma vez.
4. **`.claude/agents/*.md`** — nenhum caminho absoluto, nenhum `.exe`, nenhum comando de
   PowerShell. Os cinco agentes já são portáveis por desenho; a regra fica escrita.
5. **`AGENTS.md`** — seção curta dizendo onde o projeto roda e que o gate é o mesmo nos dois.
6. **`docs/specs/cloud-setup.sh`** — instala rtk e caveman no VM, com `|| true` em cada linha
   (§9.5 explica por que pode falhar), para colar no diálogo do ambiente.
7. **Branch pushada** — a sessão cloud clona do GitHub no branch atual, não do checkout local.

### 9.5 Degradação graciosa (a regra que sustenta tudo)

**rtk, caveman e ponytail são otimização, não requisito.** O gate, os testes e os cinco agentes
precisam funcionar com zero dos três instalados. Um `quality-gate.mjs` que chame `rtk` sem
verificar quebra toda sessão cloud — e a economia de token não vale um ambiente que não roda.

Isso não é zelo teórico. **Medido em sessão cloud**, não deduzido:

| Caminho de instalação do rtk | Resultado |
| :-- | :-- |
| `api.github.com/repos/rtk-ai/rtk/releases/latest` | **HTTP 403** — assets de release só alcançam repositórios anexados à sessão |
| `install.sh` via raw.githubusercontent | **HTTP 404** |
| `brew` | não existe no VM |
| `cargo install rtk` | `cargo` existe, mas o nome em crates.io é o *Rust Type Kit* — outro projeto (a colisão que o próprio `RTK.md` avisa). Só forks de terceiros publicam o Rust Token Killer lá |

**Conclusão fechada: o rtk não tem caminho de instalação viável numa sessão cloud hospedada pela
Anthropic.** Não é hipótese a testar; é resultado. A compressão de saída de comando é um ganho
**local**, e a sessão cloud roda o pipeline sem ela — mais cara em token, que é exatamente o
trade-off que a degradação graciosa existe para permitir.

**caveman é o caso melhor do que esta seção supunha:** `@caveman-ai/cli@1.3.1` está acessível no
registry npm dentro do VM — mesma versão da máquina local. O risco remanescente é só o
`caveman setup --install`, que baixa binários Go de fora do npm e não foi exercido (instalaria
arquivos). É a única das três com chance real, e merece um teste dedicado.

**ponytail continua em aberto, por ausência de arquivo e não por falha de mecanismo:** a sessão
cloud reportou zero plugins carregados, o que era o esperado — `extraKnownMarketplaces` nunca foi
exercido porque `.claude/settings.json` não existe em branch nenhuma. A pergunta só fica
respondível depois da Fase 0. Até lá vale o fallback: os prompts dos agentes de escrita carregam
a regra de diff mínimo **no texto**, não só na skill.

### 9.6 O que muda no pipeline

Nada estrutural. Subagentes do repositório funcionam igual, o fan-out das fases 1 e 3 também, e
o VM não tem cobrança de compute separada — o custo continua sendo token e limite de uso. Duas
diferenças que valem registrar:

- O `gate-runner` fica **mais** valioso no cloud: sem rtk, o log bruto do Playwright é o maior
  bloco de contexto do ciclo, e ele é a única coisa entre esse log e a sessão principal.
- Sem `caveman`, não há medição no cloud. O baseline e a comparação continuam sendo trabalho
  local — o que é aceitável, porque medir é atividade de ajuste, não de produção.

---

## 10. Referências

- `docs/specs/HARNESS_AEO.md` — o contrato que este pipeline implementa
- `apm.yml` — declaração de plugins, MCP e scripts
- `docs/specs/TESTING_GUIDE.md` — regras de ouro de teste E2E
- `docs/specs/STYLE_GUIDE.md` — voz e paleta que o `copy-writer` obedece
- Claude Code: [cloud environments](https://code.claude.com/docs/en/cloud-environments) e [settings](https://code.claude.com/docs/en/settings-reference) — base do §9
- Preços e IDs de modelo: Anthropic API (cache de 2026-06-24) — reconferir antes de usar os
  números para decisão financeira
