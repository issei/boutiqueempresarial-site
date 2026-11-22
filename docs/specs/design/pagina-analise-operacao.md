# Página de entrada da Análise de Operação e Equipe (`/analise`)

**Status:** Draft para aprovação do Issei (2026-11-22)
**Substitui:** a troca da home pedida em 20/11. A home volta ao que está em produção, e a página nova vira uma segunda entrada, para um público separado.
**Texto e visual:** `home-analise-operacao.md` (metaprompt da Talita de 20/11, com o e-mail decidido em 21/11). Nada do texto muda aqui.
**CRM:** Spec 032 (`specs/032-pagina-de-entrada-analise.md` no repositório do CRM). É ela que define como os dois formulários entram no mesmo CRM.

## 1. As duas entradas

| | Home `/` | Página nova `/analise` |
|---|---|---|
| Arquivo | `src/index.html` (igual à `main`) | `src/analise.html` (a página feita na branch `feat/home-analise-operacao`) |
| Público | o de hoje | o tráfego que o Issei direcionar (anúncio, bio) |
| Formulário | `formulario.html` (dois caminhos, pré-captura) | embutido em `#aplicar`, 6 campos, envio único |
| Payload | o de hoje (sem `formulario`) | o de hoje + `formulario: "analise"` |
| Depois do envio | `obrigada.html` com o seletor de horários | `obrigada.html` com a nota "em análise" (vem do CRM, Spec 032 D2) |
| Indexação | indexável, com bloco AEO | **`noindex`** (proposta, §2 D2) |

## 2. Decisões (propostas)

- **D1. URL `/analise`.** O CloudFront já serve `/analise` e `/analise/` como `/analise.html` (`infra/cloudfront-functions/viewer-request.js`, passo 2), sem mudar a função. Outro nome é só trocar o arquivo.
- **D2. `noindex`.** A página é para um público direcionado. Indexada, ela disputaria a busca com a home, com outro nome de produto. Com `noindex`, o `vite.config.js` a tira do sitemap sozinho, e as suítes de SEO e AEO a isentam de canonical, OG e JSON-LD (as regras delas já fazem isso). O OG/Twitter fica mesmo assim, para o link ficar bonito quando compartilhado.
- **D3. Sem companion `.md` nem tool WebMCP próprios.** Com `noindex` não há para quem servir. Isso evita mexer no `MARKDOWN_MAP` da função do CloudFront, o que exigiria deploy de infraestrutura.
- **D4. A obrigada é a mesma.** O CRM decide pela rota `link` (`em_analise: true`). O site não calcula nada. A nota "em análise" de hoje fala em "Diagnóstico Operacional": a página nova grava `be_perfil = {formulario: "analise"}`, e a obrigada troca só o nome do produto na nota para "Análise de Operação e Equipe".

## 3. Tarefas no site

1. **Home volta à `main`:** `git checkout origin/main -- src/index.html public/index.md public/llms.txt public/llms-full.txt tests/home.spec.js tests/atribuicao.spec.js`. `HARNESS_AEO.md` §B6 mantém o termo novo (ele passa a existir no site).
2. **`src/analise.html`:** a página da branch atual, com estas diferenças em relação à versão feita como home:
   - `<meta name="robots" content="noindex, follow">`; sem `canonical`; `og:url` = `https://boutiqueempresarial.com.br/analise`.
   - Sem JSON-LD e sem `<link rel="alternate" type="text/markdown">` (D2, D3). O bloco de FAQ visível fica.
   - Sem o script WebMCP (D3).
   - Payload com `formulario: "analise"`; eventos GA4 com `form: "analise"` no lugar de `"home"`.
   - Logo do topo leva a `/`, que é a home.
3. **`obrigada.html`:** a troca do nome na nota "em análise" (D4), coberta por teste.
4. **`public/llms.txt` e `llms-full.txt`:** uma linha em "Estrutura do Site" para `/analise` ("noindex; página de entrada da Análise de Operação e Equipe, com formulário próprio"), como já é feito para o `formulario.html`.
5. **`apps_script_atualizado.gs`:** a coluna "Formulário" no fim de `HEADERS`, `saveToSheet` gravando `data.formulario`, a linha no aviso por e-mail e `custom_data.lead_formulario` no CAPI (Spec 032 §9). Quem republica o Web App é o Issei.
6. **Testes:**
   - `tests/analise.spec.js`: os testes que hoje estão em `tests/home.spec.js` da branch, apontando para `/analise`. Eles cobrem o texto, os 8 sinais, os CTAs para `#aplicar`, os erros nos campos, o payload com `formulario: "analise"` e as UTMs, o envio interceptado (ADR e2e) e os 390 px.
   - `tests/atribuicao.spec.js`: o da `main`, mais um caso "anúncio em `/analise`: UTMs chegam ao formulário embutido".
   - `tests/obrigada.spec.js`: a nota em análise com "Análise de Operação e Equipe" quando `be_perfil.formulario = "analise"`, e o texto de hoje no caso contrário.
   - `tests/home.spec.js`: o da `main`, sem mudança. É a prova de que a home não mudou.
   - As suítes por glob (`seo`, `aeo`, `a11y`, `smoketest`) pegam a página nova sozinhas.

## 4. Critérios de aceite (reprováveis)

1. `git diff origin/main -- src/index.html public/index.md tests/home.spec.js` vazio.
2. `/analise` responde 200 no build, com `noindex`, e fica fora do `sitemap.xml`.
3. Nenhum link da home aponta para `/analise`, e nenhum link de `/analise` aponta para `formulario.html`.
4. O payload de `/analise` tem `formulario: "analise"` e os 6 campos. O do `formulario.html` não tem `formulario`.
5. Todos os critérios da seção 7 do metaprompt valem para `/analise`.
6. `npm run gate` verde.

## 5. Ordem de deploy

O CRM (Spec 032) primeiro, depois o Apps Script, depois o site. Se o site for antes, o lead da `/analise` entra no CRM, mas com o agendamento automático, o que contradiz a página.

## Allowlist de implementação

- Paths: `src/index.html` (só a restauração), `src/analise.html`, `src/obrigada.html`, `public/index.md`, `public/llms.txt`, `public/llms-full.txt`, `apps_script_atualizado.gs`, `tests/home.spec.js`, `tests/analise.spec.js`, `tests/atribuicao.spec.js`, `tests/obrigada.spec.js`, `docs/specs/`
- Efeitos proibidos: push, PR e deploy sem decisão do Issei; publicar o Web App do Apps Script; envio real de formulário em teste.
