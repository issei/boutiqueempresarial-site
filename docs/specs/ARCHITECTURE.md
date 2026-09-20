# Arquitetura do Sistema - Boutique Empresarial

Este documento descreve o fluxo de dados, a infraestrutura e o processo de build do site estático da Boutique Empresarial. Nossa arquitetura é focada em **performance (Load Time < 1s)**, **simplicidade** e **segurança**.

## Visão Geral

O projeto é um **Multi-Page Application (MPA)** estático construído com **Vite**. Não utilizamos frameworks SPA complexos (React/Vue/Angular) para evitar overhead de JavaScript no cliente. O foco é entregar HTML + CSS puro com o mínimo de JS possível.

O produto é um funil único: **home (Diagnóstico Gratuito) → formulário de aplicação → confirmação**.

### Fluxo de Dados (The Vibe Flow)

1.  **Code (Git Push)**: O desenvolvedor envia código para um branch no GitHub. Branch que não é `main` roda só o gate (`playwright.yml`); `main` roda o gate e depois o deploy (`deploy.yml`).
2.  **CI/CD (GitHub Actions)**:
    *   Roda `npm run gate` (build + Playwright). Vermelho, o deploy não acontece.
    *   Autentica na AWS via **OIDC** (sem chaves de acesso de longa duração).
    *   Gera os arquivos otimizados na pasta `dist/`.
3.  **Origin (AWS S3)**: O conteúdo de `dist/` é sincronizado com um bucket S3 privado.
4.  **Edge (AWS CloudFront)**: O CDN distribui o conteúdo globalmente, servindo cache e garantindo HTTPS. Duas **CloudFront Functions** rodam na borda (ver abaixo).
5.  **DNS (Amazon Route 53)**: Resolve `boutiqueempresarial.com.br` para a distribuição do CloudFront. Zona com DNSSEC e o registro DNS-AID (`docs/AGENT_READINESS.md`).

### Fluxo do lead (o único "backend")

O site não tem servidor. O formulário faz `fetch` POST (`text/plain`, sem preflight CORS) para um **Google Apps Script** publicado como Web App — `apps_script_atualizado.gs`, colado à mão no editor do Apps Script (deploy manual, não passa pelo GitHub Actions).

```
formulario.html ──POST──► Apps Script (doPost)
                            ├─ parcial: true → aba "Parciais" (pré-captura do contato)
                            └─ envio final  → Meta CAPI → aba "Respostas" → e-mail de aviso
obrigada.html   ──────────► Pixel `Lead` + GA4 `generate_lead` (mesmo event_id do CAPI)
```

Contratos: `docs/specs/pages/formulario.md` (dados), `docs/specs/notificacao-email-lead.md` (e-mail), `docs/specs/design/formulario-envio-parcial.md` (pré-captura), `docs/specs/design/formulario-tracking-funil.md` (eventos GA4/Meta).

---

## Estrutura do Código

```
/
├── .github/workflows/     # deploy.yml (main) · playwright.yml (demais branches)
├── .claude/               # agentes do pipeline, settings do projeto
├── design-system/         # design system do Claude Design (readme, styles.css, templates/) — não é código de produção
├── docs/                  # AGENT_READINESS.md + specs/ (os contratos)
├── e2e/                   # Playwright — fluxos de usuário (formulário, cookies)
├── infra/cloudfront-functions/  # viewer-request.js · viewer-response.js
├── public/                # servido na raiz: favicons, og-image, robots.txt, llms*.txt, index.md, auth.md, .well-known/
├── scripts/               # quality-gate.mjs, bootstrap.sh, gen-og.mjs, setup-agent-discovery-aws.sh
├── src/                   # código-fonte (root do Vite)
│   ├── *.html             # uma rota por arquivo — ver "Páginas" abaixo
│   ├── style.css          # tokens (:root) + Tailwind v4 (@theme) + fontes auto-hospedadas
│   ├── identidade-visual.css  # CSS do guia interno
│   ├── assets/fonts/      # Inter e Playfair Display (woff2, subset latin)
│   └── js/                # cookie-consent.js · form-copy.js
├── tests/                 # Playwright — contratos (SEO, AEO, a11y, agent-readiness, smoke, páginas)
├── apps_script_atualizado.gs   # backend do formulário (Google Apps Script)
├── apm.yml                # manifesto do harness agêntico
├── vite.config.js         # build e plugins
└── dist/                  # (Gerado) artifact final de deploy — nunca editar
```

### Páginas (`src/*.html`)

| Arquivo | Rota | Indexável | Papel |
| :-- | :-- | :-: | :-- |
| `index.html` | `/` | ✅ | Home — LP do Diagnóstico Gratuito |
| `formulario.html` | `/formulario` | ❌ | Formulário de 7 etapas, conversacional |
| `obrigada.html` | `/obrigada` | ❌ | Confirmação e disparo do `Lead` |
| `privacidade.html`, `termos.html` | `/privacidade`, `/termos` | ❌ | Páginas legais |
| `index-legado.html` | `/index-legado` | ❌ | Home anterior, mantida como backup |
| `identidade-visual.html` | `/identidade-visual` | ❌ | Guia interno dos cards do Instagram, não linkado |
| `404.html` | — | — | Erro |

A indexabilidade vem do `meta robots` de cada página — é a única fonte (ver "Processo de Build").

## Stack Tecnológico

| Componente | Tecnologia | Função |
| :--- | :--- | :--- |
| **Build Tool** | **Vite 6** | Empacotamento e dev server (`localhost:5173`). |
| **Estilização** | **Tailwind CSS v4** | Utility-first CSS gerado no build (`@tailwindcss/vite`). |
| **Testes** | **Playwright + axe-core** | Gate: Chromium, Firefox e WebKit. `docs/specs/TESTING_GUIDE.md`. |
| **Infra** | **AWS S3 + CloudFront** | Hospedagem estática. Funções de borda em `infra/`. |
| **Deploy** | **GitHub Actions** | Automação via OIDC. |
| **DNS** | **Route 53** | Domínio, DNSSEC, DNS-AID. |
| **Lead** | **Google Apps Script** | Planilha, e-mail de aviso e Meta Conversions API. |
| **Medição** | **GA4 + Meta Pixel** | Só depois do consentimento (Consent Mode v2). |

## Decisões de Arquitetura

1.  **Zero-Runtime CSS**: Utilizamos Tailwind v4 para gerar CSS estático no build. Não há processamento de estilos no navegador do cliente.
2.  **HTML First**: Cada rota é um arquivo HTML físico. Isso garante SEO perfeito e carregamento instantâneo, sem necessidade de hidratação de componentes JS. O JS existente é vanilla, em dois módulos (`src/js/`) e no script inline do formulário.
3.  **GitOps**: Nenhuma alteração manual é feita na infraestrutura de produção. A "Fonte da Verdade" é sempre o repositório Git. **Exceções conhecidas**: o Apps Script (colado no editor) e anexar a CloudFront Function `BoutiqueViewerResponse` à distribuição — ambos manuais, documentados em `notificacao-email-lead.md` e `AGENT_READINESS.md`.
4.  **Imagem Otimizada**: Imagens devem estar em formatos modernos (WebP/AVIF) e localizadas em `public/` ou importadas via Vite para otimização.
5.  **Consentimento antes do rastreamento**: o padrão *negado* é um bloco inline no `<head>` de cada página, antes do Pixel e do `gtag.js`; o módulo `cookie-consent.js` só cuida da interface. Nada de tag de medição sem passar por aí (`docs/specs/design/cookie-consent.md`).
6.  **Camada agêntica**: o site é lido por agentes (`.well-known/`, `llms*.txt`, companion `.md`, WebMCP) sem ser um endpoint. O que existe e o que **não** existe está em `docs/AGENT_READINESS.md`.
7.  Sempre que for criar uma nova funcionalidade, leia primeiro a pasta docs/specs/. Se a alteração envolver UI, siga estritamente o STYLE_GUIDE.md. Se envolver deploy, valide contra o CICD_OIDC.md

## Processo de Build (Vite)

O `vite.config.js` está configurado para:
*   Root do projeto em `src/` e `publicDir` em `../public`.
*   Output em `../dist` (ou seja, `dist/` na raiz do repo), com `emptyOutDir`.
*   Resolução automática de todos os arquivos `.html` em `src/` como pontos de entrada (`globSync('src/*.html')`) — página nova entra sem registrar em lista.
*   Plugin `@tailwindcss/vite` para processamento de estilos.
*   Plugin `vite-plugin-sitemap` para o `sitemap.xml`, com duas regras: `exclude` é calculado lendo o `meta robots` de cada `src/*.html` (página `noindex` não entra no sitemap), e `generateRobotsTxt: false` — com o default o plugin sobrescreve `public/robots.txt` no `dist` (ver `docs/AGENT_READINESS.md` §2).

## Funções de borda (CloudFront)

Uma função por evento — o CloudFront não aceita mais que isso. Código em `infra/cloudfront-functions/`; publicação por `scripts/setup-agent-discovery-aws.sh`.

| Evento | Arquivo | Faz |
| :-- | :-- | :-- |
| `viewer-request` | `viewer-request.js` | `Accept: text/markdown` → companion `.md`; roteia `/` → `/index.html`, `/formulario` → `/formulario.html` |
| `viewer-response` | `viewer-response.js` | Injeta o header `Link` (RFC 8288) e `Vary: Accept` |

Ao criar um companion `.md` novo em `public/`, acrescente a rota em `MARKDOWN_MAP` (`viewer-request.js`).
