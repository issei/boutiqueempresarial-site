# Meta-prompt — Página `agendar` (fatia F6 da Spec 017 do CRM)

> Como usar: sessão **nova** do Claude Code na raiz deste repositório, depois que o CRM congelar o OpenAPI (fim da F2). Modelo recomendado: **Sonnet**. Se a sessão encher (~60% de contexto), encerre com o relatório de estado da §6 e retome numa sessão nova (`/clear`) colando esse relatório. O andamento geral fica em `boutiqueempresarial-crm/docs/governance/progresso-017.md` (linha F6).

```text
Implemente a página `agendar` descrita em `docs/specs/pages/agendar.md`, de forma autônoma, com o melhor resultado e o mínimo de tokens.

## 1. Fontes (leia só o necessário)
1. `docs/specs/pages/agendar.md` inteiro (é a spec desta tarefa).
2. `AGENTS.md` (índice) e, só nas seções citadas pela spec: `docs/specs/HARNESS_AEO.md` §B1, §B5, §B6; `docs/specs/SEO_ANALYTICS.md` §3; `docs/specs/STYLE_GUIDE.md`.
3. Um exemplo de página noindex existente para copiar o `<head>` (consentimento, Pixel, gtag): `src/obrigada.html`, só as primeiras ~120 linhas.
4. O contrato: `boutiqueempresarial-crm/docs/openapi/agendamento.json`. Se você não tiver acesso ao repositório do CRM, peça ao humano o arquivo (ou os exemplos de resposta) antes de escrever fixtures; não invente formato.
Não leia: `node_modules/`, `dist/`, `apm_modules/`, `playwright-report/`, `test-results/`, `.repowise/`, `.codegraph/`, `design-system/_ds_bundle.js`, lockfiles. Ignore `docs/specs/agendamento-diagnostico.md` (superada).

## 2. Preparação
- Branch `feat/agendar` a partir de `main`. Há alterações antigas no working tree que não são suas: nunca `git add -A`; adicione só os caminhos da allowlist (§12 da spec).
- Crie `tests/fixtures/agendar/` com as respostas copiadas dos exemplos do OpenAPI e `VERSION` com o `info.version` dele.

## 3. Implementação
- `src/agendar.html` (MPA estático, estrutura e tokens de `src/style.css`), `src/js/agendar.js` (um módulo, sem framework, sem dependência npm nova).
- Ordem do `<head>` da spec §4: script inline que captura e remove o token **antes** do consentimento, Pixel e gtag.
- Estados, mensagens e erros exatamente como §6; nada de `window.confirm`; botão Confirmar nunca desabilitado sem explicação.
- Base da API numa única constante.
- Atualize `docs/specs/ARCHITECTURE.md` (tabela de páginas) e `src/privacidade.html` (uso do e-mail e do Google Agenda) conforme §9.

## 4. Testes e economia de tokens
- Escreva os testes dos critérios da §11 primeiro (`tests/agendar.spec.js`, `e2e/agendar.spec.js`), com respostas simuladas via `page.route` a partir das fixtures; bloqueie Pixel e GTM como em `e2e/form-aplicacao.spec.js`.
- Durante a iteração, rode só os arquivos novos e um único projeto do Playwright (`npx playwright test tests/agendar.spec.js e2e/agendar.spec.js --project=chromium` | tail -40). `npm run gate` completo roda uma vez no fim (e de novo só após corrigir).
- Mesmo erro 3 vezes: pare, registre a hipótese e siga ou encerre com relatório.
- Grep antes de Read; não releia arquivo editado; respostas curtas, exceto critérios de aceite e segurança.
- Nenhuma chamada real à API do CRM, a Pixel ou GA4 nos testes.

## 5. Proibições
- Não alterar `apps_script_atualizado.gs`, `src/formulario.html`, `src/obrigada.html`, `infra/`; não adicionar dependência; não mexer em infraestrutura AWS nem na CloudFront.
- Copy: vocabulário do `HARNESS_AEO.md` §B6; os textos da spec são proposta, marque no relatório que precisam de revisão da autora.
- `git push`/PR só com pedido explícito do humano nesta sessão.

## 6. Fechamento
`npm run gate` verde; diff dentro da allowlist; commits pequenos com as linhas de atribuição da sessão; relatório em até 15 linhas (critérios cobertos com nomes dos testes, gate, pendências: copy, contato alternativo, CSP da CloudFront, teste do fragmento `#t=` em clientes de e-mail).

## 7. Quando parar
- Sem o OpenAPI do CRM (ou com formato diferente da spec): pare e peça.
- Canal de contato alternativo indefinido: use o e-mail de contato da `privacidade.html` e registre como pendência; não invente telefone.
- Qualquer mudança que exija sair da allowlist.
```
