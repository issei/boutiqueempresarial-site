# ADR — Testes E2E do formulário não podem enviar leads para produção

**Status**: Aceita em 2026-09-30. **Implementada em 2026-10-02** (rotas padrão no `beforeEach`, regra 7 no `TESTING_GUIDE.md`; a rota padrão também cobre `api.boutiqueempresarial.com.br`, pela chamada da `obrigada.html` à API de agendamento). O critério 3 (oráculo no CRM) e as Pendências abaixo seguem em aberto.
**Escopo**: `e2e/form-aplicacao.spec.js` (e a regra para qualquer spec novo que preencha o formulário).
**Relacionados**: `TESTING_GUIDE.md` (gate), `pages/formulario.md`, `design/formulario-envio-parcial.md`, `notificacao-email-lead.md`; no repositório do CRM, Spec 006 (rota `POST /integrations/site/leads`).

## Contexto

O formulário (`src/formulario.html`) envia por `fetch` para o Web App do Apps Script (`G_URL`, `script.google.com`), que repassa o envio ao CRM em `https://api.boutiqueempresarial.com.br/integrations/site/leads` (`apps_script_atualizado.gs`, `CRM_URL`). Ao passar da etapa de e-mail o formulário dispara sozinho a **pré-captura** (`sendPartial()`, `payload.parcial = true`), sem ação do visitante.

O teste `funil: eventos GA4/Meta por etapa, sem dado pessoal` (`e2e/form-aplicacao.spec.js`, ~l.163) preenche nome, WhatsApp e e-mail e avança além do e-mail. Diferente dos outros testes do arquivo que fazem o mesmo (`fluxo completo…`, `abandono após o e-mail…`), **ele não intercepta `**/script.google.com/**`**. O `beforeEach` do arquivo só aborta fontes e analytics (Google Fonts, Facebook, GTM) — não o destino do envio. Resultado: a pré-captura chega de verdade à produção.

### Evidência (banco de produção do CRM, 2026-09-30)

- Leads `Maria Silva` / `maria@exemplo.com` / `+5511987654321`, criados em rajadas a cada execução do gate: 10 até 11:17 UTC (ids 159–166, 169, 170) e mais 4 depois (ids 171–174, 11:47–12:00 UTC).
- Todos com o perfil exato desse teste: `cadastro_completo=false` (pré-captura), origem `Orgânico`, sem UTM (o teste abre `/formulario.html` sem parâmetros), `maior_desafio` = "Falta de padrão nas entregas e retrabalho", `event_id_origem` novo (UUID) a cada envio — logo a idempotência por `event_id` do CRM não deduplica.
- Multiplicador: o gate roda em **3 navegadores** (Chromium, Firefox, WebKit) e, na CI, com **2 retries**; toda execução local ou push em branch (`playwright.yml`) repete o envio.
- O mesmo envio pode ter gravado linhas na planilha do Apps Script (verificar; ver "Pendências").

## Decisão

Teste E2E **nunca** alcança `script.google.com` (nem, por extensão, `api.boutiqueempresarial.com.br`) de verdade. O isolamento passa a ser **o padrão do arquivo**, não uma lembrança de cada teste.

1. Em `e2e/form-aplicacao.spec.js`, o `beforeEach` registra uma rota padrão para `**/script.google.com/**` que responde `200` com `{"result":"success"}`. Vale para todo teste do arquivo, presente e futuro.
2. Os testes que precisam **inspecionar** o payload (`fluxo completo…`, `abandono após o e-mail…`) mantêm a rota própria — em Playwright a rota registrada depois tem prioridade sobre a padrão, então o comportamento deles não muda.
3. O padrão já existe no repositório e deve ser copiado: `tests/formulario-webmcp.spec.js` (l.17) intercepta `https://script.google.com/**` no seu setup.
4. Regra para specs novos, a ser acrescentada ao `TESTING_GUIDE.md` §"Regras de Ouro": *todo spec que preencha o formulário até além do e-mail deve rodar com o destino do envio interceptado; envio real para produção é proibido, mesmo em "teste de fumaça"*.

### Alternativas descartadas

- **Domínio de e-mail reservado (`@exemplo.invalid`) sem interceptar**: continuaria gravando lixo no CRM, só mais fácil de achar.
- **Bloquear no CRM/Apps Script os e-mails de teste**: regra de domínio no lugar errado (Spec 006 é do CRM) e esconde o defeito em vez de removê-lo.
- **Ambiente de staging na nuvem**: proibido pelo projeto (sem staging AWS); e um mock local é mais barato e mais determinístico.

## Critérios de aceite (todos reprováveis)

1. `grep -n "script.google.com" e2e/form-aplicacao.spec.js` mostra a rota padrão dentro do `beforeEach`.
2. Removendo, só para verificação, as rotas próprias de `fluxo completo…` e `abandono após o e-mail…`, o gate continua sem enviar nada a produção (a padrão as cobre).
3. **Oráculo de fim a fim**: contar no CRM os leads com `email = 'maria@exemplo.com'` (ou `nome = 'Maria Silva'`), rodar `npm run gate` completo (3 navegadores) e contar de novo — a contagem **não muda**. Consulta somente leitura:
   `SELECT count(*) FROM leads WHERE email ILIKE 'maria@exemplo.com'`.
4. O gate segue verde e nenhum outro assert dos testes do formulário foi alterado.

## Pendências fora deste ADR (não são código do site)

- **CRM (produção)**: ids 159–166, 169 e 170 já foram removidos em 2026-09-30, junto com suas linhas de `historico_etapas` (exceção pontual e autorizada ao append-only, só para lixo de teste). **Ids 171–174 ainda existem** e devem ser removidos depois que a correção estiver no ar, para não recriar lixo no meio.
- **Planilha do Apps Script**: conferir e remover as linhas `Maria Silva` / `maria@exemplo.com` geradas por esse teste.
- **Notificação por e-mail / CAPI**: o backend não os dispara em `parcial`, então não há efeito externo esperado; confirmar na caixa de notificação.
