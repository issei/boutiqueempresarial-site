# Boutique Empresarial — diretiva do agente

Este arquivo é o índice, não o manual. Ele diz **o que ler antes de tocar em código**; o
conteúdo mora em `docs/specs/`. Se algo aqui contradiz um spec, o spec vence.

---

## Filosofia

MPA estático: Vite 6, Tailwind v4, HTML/CSS, o mínimo de JavaScript possível. Cada rota é um
arquivo `.html` físico em `src/`. Zero runtime CSS, zero hidratação, carregamento < 1s.

A identidade é **"Silêncio e Elegância"**: autoridade sem gritar. Vale para o design e para o
texto.

---

## Leitura obrigatória

| Spec | Leia quando |
| :-- | :-- |
| [`HARNESS_AEO.md`](docs/specs/HARNESS_AEO.md) | **sempre** — é o contrato de head, JSON-LD, bloco AEO, a11y e gate |
| [`AGENT_READINESS.md`](docs/AGENT_READINESS.md) | camada agêntica: `.well-known/`, `llms*.txt`, WebMCP, header `Link`, DNS-AID |
| [`STYLE_GUIDE.md`](docs/specs/STYLE_GUIDE.md) | qualquer alteração visual |
| [`TESTING_GUIDE.md`](docs/specs/TESTING_GUIDE.md) | ao escrever ou alterar teste |
| [`ARCHITECTURE.md`](docs/specs/ARCHITECTURE.md) | build, deploy, estrutura |
| [`SEO_ANALYTICS.md`](docs/specs/SEO_ANALYTICS.md) | IDs de rastreamento (fonte da verdade do GA4) |
| [`ASSETS_GUIDE.md`](docs/specs/ASSETS_GUIDE.md) | imagem, vídeo, peso de arquivo |
| [`CICD_OIDC.md`](docs/specs/CICD_OIDC.md) | pipeline AWS e permissões |
| [`PLANO_MULTIAGENTE.md`](docs/specs/PLANO_MULTIAGENTE.md) | ao delegar trabalho a subagentes |
| `docs/specs/pages/<página>.md` | ao mexer numa página — a spec dela (home, formulário, guia de identidade) |
| `docs/specs/design/<feature>.md` | ao mexer numa feature de UI: cookies, tracking do funil, pré-captura do formulário |
| [`notificacao-email-lead.md`](docs/specs/notificacao-email-lead.md) | ao mexer no `apps_script_atualizado.gs` (backend do formulário) |
| [`CLAUDE.md`](CLAUDE.md) | ciclo Claude Design ↔ Code e o que `design-system/` é (e não é) |

---

## Regra de ouro

**Spec antes do código.** Se o requisito mudou, o spec muda primeiro — depois o código.
Página nova começa por `docs/specs/PAGE_SPEC_TEMPLATE.md`.

---

## Verificação

```bash
npm run gate
```

Build + Playwright (smoke, SEO, AEO, a11y). **Fail-closed**: para no primeiro erro. Nada vai
para `main` com o gate vermelho — `main` dispara deploy automático na AWS.

Se uma verificação não está no gate, ela não existe.

---

## Workflows críticos

### Página nova
1. Spec em `docs/specs/pages/` a partir do template.
2. `src/<nome>.html` — o Vite descobre sozinho.
3. `<head>` conforme `HARNESS_AEO.md` §B1; JSON-LD conforme §B2; bloco AEO conforme §B3.
4. Replicar o bloco inline de consentimento (antes do Pixel e do `gtag.js`) e o módulo `js/cookie-consent.js` — `SEO_ANALYTICS.md` §3.
5. Teste em `tests/<nome>.spec.js`.
6. `npm run gate` verde.

### Alteração de copy público
Vocabulário controlado e verbos proibidos: `HARNESS_AEO.md` §B6. Se a página tem bloco AEO,
a resposta visível e a do JSON-LD são **o mesmo texto** — mudar uma sem a outra reprova no gate.

### Infraestrutura AWS
Atualize `CICD_OIDC.md` antes. Toda mudança de infra vira script executável, nunca clique no
console.

---

## Guardrails de design

Paleta e tipografia do `STYLE_GUIDE.md` — fundo `#f5f2eb`, texto `#1f1f1f`, ouro `#C5A059` só
em detalhe, Playfair Display nos títulos, Inter no corpo. **Desvio exige ADR registrado em
`docs/specs/`**, não uma decisão de meio de tarefa.

Acessibilidade não é opcional: WCAG 2.1 AA, zero violações `serious`/`critical` no axe. O que
um leitor de tela não alcança, um answer engine também não estrutura.

---

## Onde este projeto roda

O mesmo gate roda no laptop e no ambiente cloud do Claude Code. Para isso valer:

- **Nada de caminho absoluto, `.exe` ou comando de PowerShell** em script, hook ou agente.
- `rtk`, `caveman` e o plugin `ponytail` são **otimização, não requisito** — o repositório
  precisa funcionar com zero dos três. O que foi medido no VM cloud está em
  [`PLANO_MULTIAGENTE.md`](docs/specs/PLANO_MULTIAGENTE.md) §9.5.
- A sessão cloud clona do GitHub no branch atual: **push antes**, ou ela não vê seu trabalho.

---

## Mapa de diretórios

| Path | Conteúdo |
| :-- | :-- |
| `src/` | páginas `.html` (8), `style.css`, `assets/fonts/`, `js/` (`cookie-consent.js`, `form-copy.js`) |
| `public/` | assets servidos na raiz, `llms*.txt`, `robots.txt`, `index.md`, `auth.md` |
| `public/.well-known/` | manifestos para agentes — ver `docs/AGENT_READINESS.md` |
| `docs/specs/` | os contratos; `pages/` e `design/` guardam as specs por página e por feature |
| `tests/` | Playwright — contratos (SEO, AEO, a11y, agent-readiness, smoke, páginas) |
| `e2e/` | Playwright — fluxos de usuário (formulário, cookies) |
| `scripts/` | gate, bootstrap, geração de OG, setup de descoberta agêntica na AWS |
| `infra/cloudfront-functions/` | as duas CloudFront Functions (Markdown e header `Link`) |
| `apps_script_atualizado.gs` | backend do formulário — Google Apps Script, publicado à mão |
| `design-system/` | export do Claude Design (readme, `styles.css`, templates) — referência, não produção |
| `.claude/agents/` | os cinco subagentes do pipeline |
| `dist/` | gerado — nunca editar |

---

> Em dúvida sobre como algo é feito aqui, procure um caso igual em `src/*.html` antes de
> inventar um jeito novo. Consistência vale mais que originalidade nesta estrutura.
