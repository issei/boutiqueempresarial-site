# E2E Testing Specification - Playwright

## Objetivo
Garantir que cada alteração no código não quebre a experiência do usuário nem o SEO.

## O gate

`npm run gate` (`scripts/quality-gate.mjs`) é o único comando de "está verde": `vite build` e depois `playwright test`, **fail-closed** — para no primeiro erro. É o que a CI roda (`playwright.yml` nas branches, `deploy.yml` em `main`). Se uma verificação não está no gate, ela não existe.

O Playwright sobe o próprio dev server (`npm run dev`, porta 5173, reaproveita um já aberto fora da CI) e roda em **Chromium, Firefox e WebKit** desktop, com `reducedMotion: 'reduce'` — sem isso o axe mede elementos no meio de um fade e acusa contraste que o estado final não tem. Na CI: 2 retries e 1 worker.

`testMatch` é `e2e/**/*.spec.js` + `tests/**/*.spec.js`; `.claude/**` é ignorado (um git worktree ali dentro carrega um segundo `@playwright/test` e aborta a suíte).

## Onde fica cada teste

| Pasta | O que é |
| :-- | :-- |
| `tests/` | **Contratos**: o que o repositório promete de toda página ou de uma página específica |
| `e2e/` | **Fluxos de usuário**: o que a pessoa faz (preencher o formulário, decidir o consentimento) |

### Contratos por glob — sem lista manual de páginas

Iteram sobre `src/*.html`; página nova entra sozinha, e o teste lê o `meta robots` da própria página para saber o que cobrar (página `noindex` é isenta de canonical/OG/Twitter).

| Arquivo | Cobra |
| :-- | :-- |
| `tests/seo.spec.js` | `<head>` — `HARNESS_AEO.md` §B1 |
| `tests/aeo.spec.js` | JSON-LD e bloco AEO visível — §B2/§B3 |
| `tests/a11y.spec.js` | axe, zero violações `serious`/`critical` — §B5 |
| `tests/smoketest.spec.js` | crawl dos links internos e assets: nada 404 |

### Contratos de página ou de camada

| Arquivo | Cobra |
| :-- | :-- |
| `tests/home.spec.js` | CTAs da home apontam para o mesmo formulário |
| `tests/home-legado.spec.js` | `index-legado` responde 200 e continua `noindex` |
| `tests/identidade-visual.spec.js` | guia interno: `noindex, nofollow`, não linkado da home |
| `tests/agent-readiness.spec.js` | manifestos `.well-known`, `llms*.txt`, `robots.txt`, `dist` — `docs/AGENT_READINESS.md` |
| `tests/formulario-webmcp.spec.js` | tools WebMCP do formulário preenchem e nunca enviam |

### Fluxos (`e2e/`)

| Arquivo | Cobra |
| :-- | :-- |
| `e2e/form-aplicacao.spec.js` | o formulário de 7 etapas: payload, eventos do funil, pré-captura, `generate_lead`, first-touch de UTM, fechamento personalizado |
| `e2e/cookie-consent.spec.js` | padrão negado, banner, preferências, Consent Mode |

**Nenhum teste depende de rede externa para passar.** O que o site chamaria fora — Apps Script (`script.google.com`), eco de IP (`api.ipify.org`), Pixel, `gtag.js` e Google Fonts — é interceptado com `page.route` nos testes que exercitam essas chamadas (`e2e/*`, `tests/formulario-webmcp.spec.js`); o crawl do smoke só segue a mesma origem. Nas suítes por glob as tags de terceiros podem carregar quando há rede, mas nenhuma asserção depende delas. Ao escrever teste novo, intercepte o terceiro em vez de deixá-lo passar: um teste que fica vermelho por causa de terceiro não diz nada sobre o site.

## Regras de Ouro
1. **Critical Path**: Toda página nova tem teste de carregamento (Status 200) — o smoke por glob cobre isso, mas página com comportamento próprio ganha `tests/<nome>.spec.js`.
2. **SEO Check**: `<title>`, `<meta description>`, canonical, OG — já cobrados por `seo.spec.js`; não duplicar por página.
3. **Responsividade**: o gate só roda projetos desktop (os mobile estão comentados em `playwright.config.js`). Comportamento que depende de viewport — a barra fixa de CTA da home, o formulário — precisa de `page.setViewportSize` no próprio teste (como em `home.spec.js`, "a barra de CTA fixa é só do mobile").
4. **No Broken Links**: `smoketest.spec.js` faz o crawl; todo link citado em manifesto agêntico é cobrado por `agent-readiness.spec.js`.
5. **Afirme o texto que liga as coisas.** Um teste que só confere "existe um botão" deixa passar o botão apontando para a página errada (`home.spec.js` afirma o rótulo do CTA por isso).
6. **Teste o `dist`, não só o dev server**, quando o defeito só existe no build — foi assim que o `robots.txt` sobrescrito pelo plugin de sitemap passou despercebido.

## Comandos

```bash
npm run gate            # o veredito: build + suíte completa
npm run test            # Playwright direto (suíte completa)
npm run test:smoke      # só o crawl
npx playwright test tests/seo.spec.js --project=chromium   # um arquivo, um browser
npx playwright show-report                                 # relatório HTML
```

## Comando de Vibe Coding
"Agente, analise a nova página `servicos.html` e gere um arquivo de teste em `tests/servicos.spec.js` seguindo o padrão definido em `docs/specs/TESTING_GUIDE.md`."
