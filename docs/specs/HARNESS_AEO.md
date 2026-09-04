# SDD — Harness Agêntico e Contrato AEO/SEO

**Status:** Implementado na branch `spec/harness-aeo` — fases 0 a 5 concluídas, gate verde (276 testes)
**Branch de origem:** `spec/harness-aeo`
**Escopo:** repositório inteiro (`src/`, `public/`, `docs/specs/`, `tests/`, `.github/`)

---

## 1. Contexto e Motivação

Auditoria comparativa contra `mauricio-site` (site MPA irmão, mesma stack: Vite 6 +
Tailwind v4 + JS vanilla) expôs uma diferença de natureza, não de tamanho:

| Dimensão | mauricio-site | boutiqueempresarial-site (hoje) |
| :-- | :-- | :-- |
| Diretiva do agente | `AGENTS.md` na raiz | ausente — instruções dispersas em "Nota para a IA" dentro dos specs |
| Quality gate | `npm run gate` fail-closed (build + Playwright + axe + orçamento) | `npx playwright test` na CI, sem axe, sem gate único |
| AEO | gerado de fonte única, testado, em 36 páginas | JSON-LD manuscrito, apenas em `index.html` |
| a11y | contrato WCAG 2.1 AA cobrado por axe | não especificado nem verificado |

Os specs deste repositório já existem e funcionam (`identidade-visual.md` produziu página
e teste). **O que falta não é documentação — é execução verificada.** Um princípio escrito
que nenhum teste cobra é uma sugestão; este spec transforma os princípios em gate.

### Defeitos concretos identificados na auditoria

1. `public/llms.txt` aponta para `privacidade.hmtl` e `termos.hmtl` (extensão trocada) —
   dois links quebrados no arquivo cuja única função é ser lido por IA.
2. `og:image` declara 300×300 (`boutiqueempresarial.png`), violando o próprio
   `SEO_ANALYTICS.md` (§4 exige 1200×630). Renderiza como thumbnail no LinkedIn/WhatsApp.
3. O `FAQPage` do JSON-LD da home não tem contraparte visível na página — o dado existe
   para a máquina e não para o humano.
4. Zero `twitter:*` nas 7 páginas.
5. Structured data ausente em `formulario.html`, `privacidade.html`, `termos.html`, `404.html`.

---

## 2. Objetivo

Ao final da implementação:

- Um agente que abre o repositório sabe, em um arquivo, o que ler antes de tocar em código.
- Nenhuma página nova entra em `main` sem `<head>`, JSON-LD, a11y e teste conformes.
- A conformidade é **verificada por comando**, não por revisão humana: `npm run gate`.

**Não-objetivo:** replicar a infraestrutura agêntica de `mauricio-site` por completo.
Ver §7 — 7 páginas monolíngues não sustentam o custo de um gerador, de um manifesto
multi-harness ou de um pipeline de i18n.

---

## 3. Parte A — Harness (infra agêntica)

### A1. `AGENTS.md` na raiz — diretiva primária

Arquivo único na raiz, lido pelo agente antes de qualquer tarefa. É índice, não cópia:
aponta para os specs existentes e nunca duplica o conteúdo deles.

Seções obrigatórias:

| Seção | Conteúdo |
| :-- | :-- |
| Filosofia | MPA estático, HTML-first, zero-runtime CSS, "Silêncio e Elegância" |
| Leitura obrigatória | tabela `docs/specs/*` → quando cada spec se aplica |
| Workflows críticos | nova página · alteração de copy · alteração de infra AWS |
| Guardrails de design | paleta e tipografia do `STYLE_GUIDE.md`; desvio exige ADR registrado |
| Regra de ouro | spec antes do código; se o requisito mudar, o spec muda primeiro |
| Comando de verificação | `npm run gate` antes de qualquer push para `main` |
| Mapa de diretórios | tabela path → propósito |

> **Restrição:** `AGENTS.md` não pode exceder ~200 linhas. Acima disso ele deixa de ser
> lido e vira decoração. Conteúdo longo pertence a `docs/specs/`.

### A2. Quality gate único e fail-closed

Script `scripts/quality-gate.mjs`, exposto como `npm run gate`, executando em sequência e
**parando no primeiro erro**:

1. `vite build` — o build de produção precisa passar.
2. `playwright test` — suíte inteira (smoke + comportamento + SEO + AEO + a11y).
3. Relatório final: verde ou vermelho, sem estado intermediário.

Scripts em `package.json`:

```json
"gate": "node scripts/quality-gate.mjs",
"test": "playwright test"
```

**Regra:** o gate é o único comando que a CI e o desenvolvedor executam. Se uma verificação
não está no gate, ela não existe.

### A3. Suítes que o gate passa a cobrar

| Arquivo | Cobre | Falha quando |
| :-- | :-- | :-- |
| `tests/seo.spec.js` | contrato do `<head>` (§B1) em toda página de `src/*.html` | falta canonical, `<title>` fora de 10–60 chars, description fora de 50–160, OG incompleto, GA4 ausente |
| `tests/aeo.spec.js` | JSON-LD (§B2) e bloco visível (§B3) | JSON-LD não parseável, tipo obrigatório ausente, pergunta do `FAQPage` sem contraparte visível no DOM |
| `tests/a11y.spec.js` | WCAG 2.1 AA via `@axe-core/playwright` (§B5) | qualquer violação `serious` ou `critical` |

As três suítes iteram sobre `src/*.html` por glob — **nenhuma lista manual de páginas**.
Página nova entra no teste automaticamente; é assim que o gate impede regressão por omissão.

Nova dependência (única): `@axe-core/playwright`.

### A4. CI executa o gate

`.github/workflows/playwright.yml` passa a rodar `npm run gate` no lugar de
`npx playwright test`. `deploy.yml` só executa com o gate verde.

### A5. Adotado depois (com gatilho explícito)

| Primitivo | Adotar quando |
| :-- | :-- |
| Skill `new-page` (`.claude/skills/`) | a terceira página nova for criada à mão repetindo o mesmo ritual |
| Gerador de `<head>`/AEO (tipo `build-aeo.mjs`) | o site passar de ~15 páginas |
| `apm.yml` (contexto multi-harness) | um segundo harness (Copilot/Cursor) entrar no fluxo de fato |
| Subagente de revisão de tom | o copy passar a ser escrito por mais de uma pessoa |
| Pipeline i18n / gêmeo `/en/` | existir decisão de negócio para conteúdo em inglês |

Registrar o gatilho é o que impede tanto o over-engineering hoje quanto o esquecimento amanhã.

---

## 4. Parte B — Contrato AEO/SEO

**Decisão de arquitetura:** com 7 páginas, o `<head>` continua **escrito à mão** — o que muda
é que passa a ser **cobrado por teste**. Um gerador custa mais do que economiza nesta escala;
o gatilho de reavaliação está em §A5.

### B0. Correções imediatas (pré-requisito, sem código novo)

- [x] `public/llms.txt`: `privacidade.hmtl` → `privacidade.html`; `termos.hmtl` → `termos.html`.
- [x] Gerar `public/og-image.jpg` 1200×630 conforme `ASSETS_GUIDE.md`; apontar `og:image` para
      ele em todas as páginas indexáveis, com `og:image:width`/`height` corretos.
- [x] Adicionar `twitter:card=summary_large_image`, `twitter:title`, `twitter:description` e
      `twitter:image` às páginas indexáveis.

### B1. Contrato do `<head>` — obrigatório em toda página de `src/*.html`

| Campo | Regra | Verificado por |
| :-- | :-- | :-- |
| `<title>` | 10–60 caracteres, sufixo `\| Boutique Empresarial` | `tests/seo.spec.js` |
| `meta description` | 50–160 caracteres, com a palavra-chave da página | `tests/seo.spec.js` |
| `link canonical` | URL absoluta, sem `.html`, sem barra final (exceto a raiz) | `tests/seo.spec.js` |
| `meta robots` | `index, follow, max-image-preview:large, max-snippet:-1` — ou `noindex` deliberado. **Hoje só `index` é indexável** — `privacidade` e `termos` também estão `noindex`, decisão anterior a este spec que a implementação preservou (ver §7) | `tests/seo.spec.js` |
| OG | `og:type`, `og:site_name`, `og:locale=pt_BR`, `og:title`, `og:description`, `og:url`, `og:image` (1200×630) | `tests/seo.spec.js` |
| Twitter | `twitter:card=summary_large_image` + title/description/image | `tests/seo.spec.js` |
| GA4 | `G-8HNXV7KTY9` imediatamente após `<head>` | `tests/seo.spec.js` |
| `<html lang>` | `pt-br` | `tests/a11y.spec.js` (axe) |

Páginas `noindex` são isentas de canonical, OG e Twitter — a suíte lê `meta robots` e ajusta as
asserções, nunca mantém uma lista de exceções codificada.

### B2. JSON-LD — um `@graph` por página

Nós persistentes (idênticos em toda página indexável, com `@id` estável para deduplicação):

- `Organization` — `@id: .../#organization`
- `ProfessionalService` — `@id: .../#service`, `parentOrganization` → `#organization`
- `WebSite` — `@id: .../#website` **(ausente hoje; adicionar)**

Nós por página:

| Tipo de página | Tipos obrigatórios |
| :-- | :-- |
| Home (`index`) | `WebPage` + `FAQPage` + `SpeakableSpecification` |
| Conversão (`formulario`) | `WebPage` + `ContactPage` |
| Legal (`privacidade`, `termos`) | `WebPage` |
| Todas exceto a home | `BreadcrumbList` (Início → página atual) |

Regras:

- Toda URL em `@id`/`url` é absoluta e sem `.html`.
- `dateModified` em ISO 8601 com timezone (`-03:00`), atualizado a cada alteração de conteúdo.
- **Nenhuma afirmação no JSON-LD sem contraparte visível na página** (§B3). Structured data que
  descreve conteúdo inexistente viola diretriz do Google e é risco de penalização.

### B3. Bloco AEO visível — "Em síntese" + FAQ

Toda página indexável recebe, imediatamente antes do `<footer>`, um bloco delimitado:

```html
<!-- AEO-BODY:START -->
<section class="aeo" aria-label="Resumo e perguntas frequentes">
  <div class="aeo-tldr"> … 3–5 frases respondendo a pergunta central da página … </div>
  <div class="aeo-faq">
    <details><summary>Pergunta</summary><p>Resposta</p></details>
  </div>
</section>
<!-- AEO-BODY:END -->
```

- O texto do bloco é **a mesma resposta** que está no `FAQPage` do JSON-LD — literalmente, não
  parafraseada. `tests/aeo.spec.js` compara os dois.
- `.aeo-tldr` é o alvo do `SpeakableSpecification`.
- Visual conforme `STYLE_GUIDE.md`: Playfair nos títulos, Inter no corpo, respiro `py-24`, ouro
  sutil (`#C5A059`) apenas em detalhe de linha. O bloco não pode parecer apêndice técnico — é
  conteúdo editorial.
- `<details>` nativo, sem JS. O conteúdo permanece legível com JavaScript desativado.

### B4. Camada para máquinas

| Artefato | Regra |
| :-- | :-- |
| `public/llms.txt` | índice curado do site; todo link precisa resolver 200 (já coberto pelo crawl de `tests/smoketest.spec.js`) |
| `public/<slug>.md` | companion Markdown de cada página indexável: título, resumo, FAQ, CTA. Fonte de citação para answer engines |
| `<link rel="alternate" type="text/markdown">` | em cada página, apontando para seu companion |
| `Content-Type` no S3 | `.md` servido como `text/markdown`; ajustar em `deploy.yml` conforme `CICD_OIDC.md` |
| `public/robots.txt` | permanece permissivo; sem bloqueio a crawlers de IA — a citação é o objetivo |

### B5. Acessibilidade como parte do contrato AEO

Não é seção separada: o que um leitor de tela não alcança, um answer engine também não estrutura.

| Item | Regra |
| :-- | :-- |
| Estrutura | skip link como primeiro elemento focável → `<main id="conteudo">`; exatamente um `<h1>`; hierarquia de headings sem saltos |
| Contraste | ≥ 4.5:1 em texto (atenção ao `#C5A059` sobre `#f5f2eb` — validar antes de usar em texto) |
| Foco | `:focus-visible` sempre visível, nunca removido |
| Alvos de toque | ≥ 24×24 px |
| Zoom | 200% sem perda de conteúdo; sem scroll horizontal em 375 px |
| Gate | zero violações `serious`/`critical` no axe, na página inteira |

### B6. Vocabulário controlado (anti-drift)

Grafias fixas, cobradas na revisão de copy e em `tests/seo.spec.js` quando aparecerem em
`<title>`/`description`:

**Boutique Empresarial · Silêncio Operacional · Arquitetura de Negócios · Diagnóstico de
Estabilidade · Arquitetura Operacional · Ritmo de Execução**

Proibido em copy público: "revolucionário", "disruptivo", "game-changer", "solução completa",
"de última geração", e qualquer verbo que prometa resultado ("garante", "elimina", "assegura").
Contradiz a filosofia "autoridade sem gritar" do `STYLE_GUIDE.md`.

---

## 5. Critérios de Aceite

A implementação está completa quando **todos** os itens abaixo são verdadeiros:

- [x] `AGENTS.md` existe na raiz, com ≤ 200 linhas, e referencia todos os specs de `docs/specs/`.
- [x] `npm run gate` existe, roda build + Playwright e falha no primeiro erro.
- [x] `tests/seo.spec.js`, `tests/aeo.spec.js` e `tests/a11y.spec.js` existem e iteram por glob.
- [x] `npm run gate` retorna verde no estado atual do repositório (com §B0 aplicado).
- [x] A CI (`playwright.yml`) executa `npm run gate`.
- [x] Zero violações axe `serious`/`critical` em todas as páginas.
- [x] Todas as páginas indexáveis têm `<head>` conforme §B1 e JSON-LD conforme §B2.
- [x] Todas as perguntas do `FAQPage` têm contraparte visível idêntica no DOM.
- [x] `public/llms.txt` sem links quebrados; companions `.md` existem e são referenciados.
- [x] `SEO_ANALYTICS.md` e `TESTING_GUIDE.md` atualizados para apontar para este contrato —
      spec não pode contradizer spec.

---

## 6. Plano de Implementação

Cada fase é um PR independente e mantém o repositório verde.

| Fase | Entrega | Custo |
| :-- | :-- | :-- |
| **1. Correções** | §B0 — llms.txt, og:image 1200×630, twitter cards | baixo, sem código novo |
| **2. Gate** | `scripts/quality-gate.mjs`, `@axe-core/playwright`, `tests/a11y.spec.js`, CI apontada para o gate | baixo |
| **3. Diretiva** | `AGENTS.md` na raiz | baixo |
| **4. Contrato SEO** | `tests/seo.spec.js` + `<head>` de todas as páginas conformado até passar | médio |
| **5. AEO** | `WebSite`/`WebPage`/`BreadcrumbList` no JSON-LD, bloco `AEO-BODY` visível, `tests/aeo.spec.js` | médio |
| **6. Camada máquina** | companions `.md`, `rel=alternate`, Content-Type no deploy | médio |

**A ordem é vinculante:** a fase 2 entrega o mecanismo que cobra as fases 4–6. Inverter a ordem
produz conformidade que apodrece na primeira página nova.

---

## 6.1 Decisão registrada durante a implementação

**`privacidade` e `termos` continuam `noindex`.** O §B2 previa nó `WebPage` para elas, mas as
duas já estavam marcadas `noindex, follow` antes deste spec. Mudar a indexação de uma página é
decisão de negócio, não correção mecânica — a implementação preservou o estado atual e as tratou
como isentas. **Se a intenção era que fossem indexáveis** (páginas legais linkadas no rodapé
costumam ser), é uma linha de `meta robots` em cada uma e o restante do contrato passa a valer
automaticamente, porque a suíte lê a indexabilidade da própria página.

---

## 7. Fora de Escopo

| Item | Motivo |
| :-- | :-- |
| `apm.yml` / manifesto multi-harness | um único harness em uso; ver gatilho em §A5 |
| Gerador de `<head>` a partir de fonte única | 7 páginas não amortizam o custo; ver gatilho em §A5 |
| Gêmeo `/en/` e pipeline i18n | não há decisão de negócio para conteúdo em inglês |
| CodeGraph | o repositório é HTML-first e o CodeGraph não indexa HTML |
| Orçamento de peso por página (KB) | adicionar quando houver página com JS próprio relevante |

---

## 8. Referências

- `docs/specs/ARCHITECTURE.md` — stack, build e deploy
- `docs/specs/SEO_ANALYTICS.md` — IDs de rastreamento (fonte da verdade do GA4)
- `docs/specs/STYLE_GUIDE.md` — paleta, tipografia, componentes
- `docs/specs/TESTING_GUIDE.md` — regras de ouro de teste E2E
- `docs/specs/ASSETS_GUIDE.md` — dimensões e formatos de imagem
- `docs/specs/CICD_OIDC.md` — pipeline de deploy e permissões AWS
- WCAG 2.1 AA — https://www.w3.org/WAI/WCAG21/quickref/
- Google Structured Data Guidelines — https://developers.google.com/search/docs/appearance/structured-data/sd-policies
