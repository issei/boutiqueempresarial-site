# Boutique Empresarial — Site

Site estático simples para a Boutique Empresarial.

## Descrição

Este repositório contém o site público da Boutique Empresarial (páginas estáticas gerenciadas com Vite). O projeto é leve, orientado a conteúdo estático (`src/` + `public/`) e utiliza Vite como bundler/dev server.

## Tecnologias

- Node.js (recomendado v20 conforme CI)
- Vite
- Tailwind CSS

(O projeto declara dependências de desenvolvimento: `vite`, `tailwindcss`, `@tailwindcss/vite`, `glob`.)

## Pré-requisitos

- Node.js (recomendo usar a mesma versão que o workflow: v20)
- npm (ou yarn/pnpm — instruções abaixo usam npm)

## Instalação

1. Instale as dependências:

```bash
npm install
```

2. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Por padrão o Vite serve em http://localhost:5173 — abra esse endereço no navegador.

## Scripts úteis (definidos em `package.json`)

- `npm run dev` — inicia o servidor de desenvolvimento (Vite)
- `npm run build` — gera os arquivos de produção (build)
- `npm run preview` — faz preview do build localmente
- `npm run start` — alias para `npm run dev`
- `npm run gate` — **o quality gate**: `vite build` + Playwright (smoke, SEO, AEO, a11y). Fail-closed, para no primeiro erro. Único comando que a CI e o desenvolvedor rodam para dizer "está verde".
- `npm run test` / `npm run test:smoke` — Playwright direto (suíte completa / só smoke)

## Fluxo DevOps

Arquitetura: MPA estático → **AWS S3** (origin) → **CloudFront** (edge) → **Route 53** (`boutiqueempresarial.com.br`). GitOps: a fonte da verdade é o Git, nenhuma alteração manual no console. Detalhes em [`docs/specs/ARCHITECTURE.md`](docs/specs/ARCHITECTURE.md) e [`docs/specs/CICD_OIDC.md`](docs/specs/CICD_OIDC.md).

### Branches de trabalho (`.github/workflows/playwright.yml`)

Todo push em branch que **não** é `main` roda `npm run gate` (build + Playwright). É o portão antes do PR.

### Deploy em `main` (`.github/workflows/deploy.yml`)

Push/merge em `main` dispara o deploy automático:

1. **Job `test`** — `npm install`, instala browsers Playwright, `npm run gate`. Se vermelho, o deploy não roda (o report vai como artifact).
2. **Job `deploy`** (`needs: test`, environment `production`):
   1. `npm run build` → `dist/` (o `vite.config.js` usa `outDir: '../dist'`, então `dist/` cai na raiz do repo).
   2. Autentica na AWS via **OIDC** (`aws-actions/configure-aws-credentials`) — sem chave de acesso de longa duração, a role é assumida por token JWT.
   3. `aws s3 sync dist/ s3://<bucket> --delete` — o S3 vira espelho exato do build.
   4. Corrige o `Content-Type` dos companions Markdown e `llms.txt` para `text/markdown; charset=utf-8` (senão o answer engine baixa em vez de ler — `HARNESS_AEO.md` §B4).
   5. `aws cloudfront create-invalidation --paths "/*"` — cache limpo, mudança visível na hora.

### Secrets do repositório (Settings → Secrets and variables → Actions)

| Secret | Descrição |
| :-- | :-- |
| `AWS_ROLE_ARN` | ARN da role IAM com trust policy para este repo |
| `AWS_REGION` | região do S3/CloudFront (ex.: `us-east-1`) |
| `S3_BUCKET_NAME` | bucket S3 de origem |
| `CLOUDFRONT_DISTRIBUTION_ID` | distribuição CloudFront a invalidar |

Regra: toda mudança de infra atualiza `CICD_OIDC.md` **antes** e vira script executável — nunca clique no console.

## Estrutura do projeto

- `src/` — páginas `.html` do site (cada rota é um arquivo físico) e CSS
- `public/` — assets servidos na raiz (favicon, manifest, sitemap, 404, `robots.txt`, `llms.txt`)
- `docs/specs/` — os contratos (arquitetura, style guide, harness/AEO, CI/CD, testes)
- `tests/`, `e2e/` — suítes Playwright
- `scripts/` — `quality-gate.mjs`, bootstrap, geração de OG
- `.claude/agents/` — os cinco subagentes do pipeline
- `.github/workflows/` — `deploy.yml` (deploy AWS em `main`), `playwright.yml` (gate nas demais branches)
- `apm.yml` — manifesto do harness agêntico
- `AGENTS.md` — índice de leitura obrigatória para o agente
- `package.json` — scripts e dependências
- `dist/` — gerado pelo build, nunca editar

## Metodologia de Desenvolvimento (SDD & VibeCoding)

Este projeto adota uma abordagem moderna de desenvolvimento de software que combina rigor na especificação com agilidade na implementação.

### 1. SDD (Specification Driven Development)

**"A documentação é a fonte da verdade."**

Antes de escrever qualquer linha de código, definimos o "o quê" e o "como" nas especificações.

*   **Processo**:
    1.  Toda nova feature ou página começa com a criação/atualização de um arquivo em `docs/specs/`.
    2.  Use o template `docs/specs/PAGE_SPEC_TEMPLATE.md` para novas páginas.
    3.  Valide a arquitetura em `docs/specs/ARCHITECTURE.md` e o estilo em `docs/specs/STYLE_GUIDE.md`.
    4.  Somente após a aprovação da *spec*, o código é implementado.

*   **Benefícios**: Clareza, redução de retrabalho e alinhamento entre produto e engenharia.

### 2. VibeCoding

**"Codifique na velocidade do pensamento."**

Após a definição clara via SDD, utilizamos ferramentas de IA e automação para implementar a solução de forma rápida e fluida.

*   **Filosofia**:
    *   Foco no fluxo (*flow*) e na experiência do usuário final.
    *   Iterações rápidas com feedback visual imediato.
    *   O código é "gerado" e "refinado", não apenas "escrito".
    *   A IA atua como par programador, seguindo estritamente as *specs* definidas no passo anterior.

### 3. Desenvolvimento agêntico

O repositório é *agent-driven*: um agente (Claude Code) implementa contra contratos versionados e um verificador determinístico do outro lado. Orientações práticas:

*   **Leia antes de tocar em código.** [`AGENTS.md`](AGENTS.md) na raiz é o índice — diz qual spec de `docs/specs/` ler para cada tipo de mudança. Se `AGENTS.md` contradiz um spec, o spec vence.
*   **Contrato sempre em primeiro lugar:** [`docs/specs/HARNESS_AEO.md`](docs/specs/HARNESS_AEO.md) é o contrato de `<head>`, JSON-LD, bloco AEO, acessibilidade e gate — leitura obrigatória em toda tarefa.
*   **Princípio do pipeline:** *modelo caro decide, modelo barato executa, o gate arbitra*. Detalhe e matriz de modelos em [`docs/specs/PLANO_MULTIAGENTE.md`](docs/specs/PLANO_MULTIAGENTE.md).
*   **Subagentes estreitos** vivem em `.claude/agents/` para trabalho recorrente que não cabe no contexto da sessão principal:
    | Agente | Função |
    | :-- | :-- |
    | `page-auditor` | audita uma página contra o contrato, devolve só os deltas (read-only) |
    | `head-fixer` | aplica numa página os deltas de head/JSON-LD apontados pelo auditor |
    | `copy-writer` | escreve o bloco AEO visível + companion Markdown, na voz da marca |
    | `test-author` | escreve as suítes Playwright que cobram o contrato |
    | `gate-runner` | roda `npm run gate` e devolve só as asserções que falharam |
*   **`npm run gate` verde é a definição de pronto.** Nenhum agente (ou humano) declara sucesso sem ele. Se uma verificação não está no gate, ela não existe.
*   **Diff mínimo.** O plugin `ponytail` é obrigatório em subagente de implementação — diff menor é menos token de saída e menos revisão depois.

### 4. Harness

O harness é o contexto que o agente recebe, declarado em [`apm.yml`](apm.yml) na raiz (manifesto APM — *Agent Package Manager*). `apm install` resolve a árvore e faz deploy dos primitivos em formato nativo; `apm.lock.yaml` fixa commit + hash para contexto byte a byte idêntico entre máquinas.

*   **Alvo único:** `target: [claude]`. Um segundo harness só entra com o gatilho de `HARNESS_AEO.md` §A5.
*   **Otimizações, não requisitos** — o repositório funciona com zero dos três:
    *   `ponytail` (plugin) — disciplina de escopo, força a solução mais simples que funciona.
    *   `rtk` (Rust Token Killer) — comprime a saída de comandos de shell antes de virar contexto. O `quality-gate.mjs` detecta e usa se presente.
    *   `caveman` (MCP) — mede para onde o contexto vai (`npm run cost:report`).
*   **MCP servers do fluxo:** `context7` (docs versionadas de Vite/Tailwind/Playwright), `codegraph` (grafo de símbolos — primeira ferramenta antes de grep onde existe `.codegraph/`), `playwright-mcp`, `filesystem` (escopo fechado em `src/ public/ docs/`).
*   **Onde roda:** o mesmo gate roda no laptop e no VM cloud do Claude Code. Por isso: nada de caminho absoluto, `.exe` ou comando PowerShell em script/hook/agente. A sessão cloud clona do GitHub no branch atual — **faça push antes** ou ela não vê seu trabalho.
*   **`apm run <script>`:** `start`, `gate`, `test`, `preflight` (= gate antes de push pra `main`), `cost:report`, `cost:gain`.


## Testes e Qualidade (QA)

A garantia de qualidade é fundamental para evitar regressões em um ambiente de deploy contínuo. Utilizamos **Playwright** para testes automatizados.

### 1. Tipos de Testes

*   **Smoke Tests (Testes de Fumaça)**:
    *   Verificam se as páginas principais carregam corretamente (Status 200).
    *   Validam se não há links quebrados (404) internos ou assets ausentes.
    *   Garantem que o site está "de pé" após um deploy.
    *   Arquivo: `tests/smoketest.spec.js`

*   **Testes E2E (Ponta a Ponta)**:
    *   Simulam a navegação do usuário real.
    *   Validam fluxos críticos, como funcionamento de menus, formulários e renderização de componentes chave.
    *   Arquivo: `tests/home.spec.js`

### 2. Executando os Testes

Para rodar os testes localmente:

1.  **Smoke Test**: Executa a validação rápida de links e assets.
    ```bash
    npm run test:smoke
    ```

2.  **Todos os Testes (Playwright)**: Executa a suíte completa (E2E + Smoke).
    ```bash
    npx playwright test
    ```

3.  **Relatório Visual**:
    ```bash
    npx playwright show-report
    ```

> **Nota**: O projeto atualmente foca em testes E2E/Smoke devido à natureza estática do site. Testes unitários (Vitest/Jest) podem ser adicionados futuramente caso haja introdução de lógica complexa em JavaScript.


## Como contribuir

1. Se o requisito mudou, atualize o spec em `docs/specs/` **antes** do código (página nova começa por `docs/specs/PAGE_SPEC_TEMPLATE.md`).
2. Crie uma branch: `git checkout -b feat/minha-mudanca`
3. Faça commits atômicos e descritivos
4. `npm run gate` verde antes de abrir o PR (o mesmo gate roda na CI da branch)
5. Abra um Pull Request direcionado à `main`

O deploy automático ocorre ao merge/push na branch `main` — só depois do job `test` (gate) passar.

## Licença e Direitos Autorais

Copyright (c) 2024-2026 Boutique Empresarial. **Todos os direitos reservados**.

Este repositório é público estritamente para fins de **consulta*.
É **estritamente proibido**, sem o consentimento prévio e por escrito:
- Copiar, replicar ou distribuir o código ou seus componentes;
- Criar trabalhos derivados utilizando recursos corporativos, designs ou a arquitetura deste projeto;
- Fazer uso comercial ou não comercial do código-fonte e suas estruturas.

Para mais detalhes, consulte o arquivo [LICENSE](./LICENSE).

## Notas adicionais

- O projeto está marcado com `"license": "UNLICENSED"` e `"private": true` no `package.json` para refletir sua natureza proprietária.
- Se você alterar a estrutura de saída do build (`outDir`), atualize também o workflow de deploy para apontar para a pasta correta.

## Contato

Para dúvidas sobre o deploy ou configuração AWS, consulte o responsável pela infraestrutura ou deixe uma issue no repositório.

---

Para o fluxo detalhado, os contratos valem sobre este README: comece por [`AGENTS.md`](AGENTS.md).
