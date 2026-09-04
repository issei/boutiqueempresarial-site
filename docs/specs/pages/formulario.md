# SDD — Formulário de Aplicação (Sessão Estratégica de Análise Operacional)

*   **Status**: Aprovado para implementação
*   **Arquivos afetados**: `src/formulario.html`, `src/obrigada.html`, `apps_script_atualizado.gs`
*   **Fonte da verdade do conteúdo**: PDF `Aplicação - Boutique Empresarial` (Google Forms, 5 páginas)
*   **Substitui**: formulário legado de 7 perguntas (Nome, WhatsApp, E-mail, Faturamento, Time, Operação, Investimento)

---

## 1. Objetivo

Substituir as perguntas do funil de captação por 12 campos de qualificação, **preservando integralmente**:

1.  O rastreamento de origem (UTMs, `fbclid`, `event_id`, `fbc`, `fbp`, `ip_address`, `user_agent`).
2.  A identidade visual ("Silêncio e Elegância" — `docs/specs/STYLE_GUIDE.md`) e as classes CSS existentes.
3.  O envio server-side para a Meta Conversions API (CAPI) com hash SHA-256 de e-mail e telefone.
4.  O contrato de transporte `fetch` POST + `text/plain` (requisição simples, sem preflight CORS).

## 2. Metacognição — auditoria do código atual

Antes de escrever qualquer linha, o fluxo legado foi auditado. Os defeitos abaixo **quebram silenciosamente o rastreamento** e por isso entram no escopo desta mudança: sem corrigi-los, os novos campos seriam gravados, mas a atribuição de mídia paga continuaria inválida.

| # | Defeito encontrado | Evidência | Impacto | Decisão |
| :-- | :--- | :--- | :--- | :--- |
| D1 | `event_id` nunca é gerado | `document.getElementById("eid").value = eid` — `eid` resolve para o **próprio elemento** (named access do `window`), gravando `"[object HTMLInputElement]"` | Deduplicação Pixel↔CAPI **totalmente quebrada**: todo lead conta 2x no Gerenciador de Anúncios, inflando CPL e corrompendo o aprendizado do algoritmo | **Corrigir**: gerar UUID v4 (`crypto.randomUUID()` com fallback) |
| D2 | `fbc`, `fbp`, `ip_address`, `page_url` nunca são capturados | O Apps Script lê `data.fbc` / `data.fbp` / `data.ip_address` / `data.page_url`, mas o front-end nunca os envia | Event Match Quality (EMQ) baixo; Meta não consegue casar o lead com o clique no anúncio | **Corrigir**: ler cookies `_fbc`/`_fbp`, sintetizar `fbc` a partir de `fbclid`, obter IP público best-effort |
| D3 | `lgpd_consent` é hardcoded como `"on"` | `d.lgpd_consent = "on"` no `sub()` | Registro de consentimento **falso** — inútil como prova documental (LGPD Art. 8º, §1º) | **Corrigir**: checkbox obrigatório real; grava `Sim`/`Não` conforme a ação do titular |
| D4 | Pixel dispara `Lead` sem `eventID` | `fbq('track','Lead')` em `src/obrigada.html` | Mesmo com D1 corrigido, a deduplicação não ocorreria: o Pixel precisa do mesmo `event_id` do CAPI | **Corrigir**: `obrigada.html` lê o `event_id` do `localStorage` e passa `{eventID}` |
| D5 | Índices de etapa hardcoded | `2 === i`, `6 === c`, `(c+1)/7*100` | Com 11 etapas o formulário travaria na etapa 7 e a barra de progresso estouraria 100% | **Corrigir**: derivar tudo de `steps.length`; validação declarativa por etapa |
| D6 | Cabeçalho da planilha só é criado em aba nova | `if (!sheet) { ... appendRow(header) }` | Ao publicar o novo script sobre a aba `Respostas` existente, as linhas novas entrariam **desalinhadas** sob os cabeçalhos antigos | **Corrigir**: `ensureSheet()` detecta cabeçalho divergente e arquiva a aba antiga antes de criar a nova |
| D7 | `ACCESS_TOKEN` literal no código | `ACCESS_TOKEN: '...'` no `.gs` | Token CAPI é credencial de longa duração; versionado em Git vira vazamento permanente | **Corrigir**: `PropertiesService.getScriptProperties()`; o arquivo versionado não contém segredo |
| D8 | `mode: "no-cors"` mascara erros do servidor | Resposta opaca → `.then()` executa mesmo em HTTP 500 | Falha do backend é reportada ao usuário como sucesso | **Aceito com mitigação**: garante entrega fire-and-forget mesmo com CORS hostil; adicionado `keepalive: true` para o POST sobreviver à navegação. Trocar para `mode: 'cors'` exigiria validar CORS do redirect `googleusercontent.com` — risco maior que o benefício |
| D9 | UTMs perdidas em navegação multi-página | Parâmetros lidos só da URL corrente | Lead que passa por `/index.html` antes do formulário perde a origem | **Corrigir**: persistir *first-touch* em `sessionStorage`, com a URL atual tendo precedência |
| D10 | LDU (`dataProcessingOptions ['LDU']`) ativo para 100% do tráfego | `fbq('dataProcessingOptions', ['LDU'], 1, 1000)` | LDU é mecanismo **CCPA/Califórnia**; ligado globalmente ele restringe o uso dos dados sem ganho de conformidade LGPD | **Fora de escopo** — não alterado. Registrado aqui como decisão de negócio pendente |

### Premissas assumidas

*   O `event_id` é gerado no **cliente** e é a única fonte de deduplicação — o mesmo valor vai para a planilha, para o CAPI e para o Pixel `Lead` da página de obrigado.
*   O IP do cliente é inalcançável pelo Apps Script (`UrlFetchApp` é server-to-server). A captação depende de um endpoint público de eco de IP, tratado como **best-effort**: falha ou lentidão **nunca** bloqueia o envio do lead.
*   A aba `Respostas` já contém dados do formulário antigo; a migração preserva o histórico via renomeação, não via exclusão.

## 3. Contrato de dados (JSON `snake_case`)

### 3.1 Respostas do formulário

| # | Pergunta | Chave JSON | Tipo | Obrig. | Controle |
| :-- | :--- | :--- | :--- | :--: | :--- |
| 1 | Nome Completo | `nome_completo` | string | ✅ | `input[type=text]` |
| 2 | E-mail | `email` | string | ✅ | `input[type=email]` |
| 3 | Whatsapp com DDD | `whatsapp` | string | ✅ | `input[type=tel]` (máscara) |
| 4 | Instagram e/ou site da empresa | `instagram_site` | string | ➖ | `input[type=text]` |
| 5 | Modelo de negócio | `modelo_negocio` | string | ✅ | `radio` + "Outro" |
| 5b | ↳ especificação de "Outro" | `modelo_negocio_outro` | string | ➖ | `input[type=text]` condicional |
| 6 | Pessoas que trabalham com você | `tamanho_equipe` | string | ✅ | `radio` |
| 7 | Faturamento médio mensal | `faturamento_mensal` | string | ✅ | `radio` |
| 8 | Como a empresa funciona sem você | `autonomia_operacional` | string | ✅ | `radio` + "Outro" |
| 8b | ↳ especificação de "Outro" | `autonomia_operacional_outro` | string | ➖ | `input[type=text]` condicional |
| 9 | Maior problema da gestão (até 2) | `maior_problema_gestao` | **array<string>** | ✅ | `checkbox`, `min 1 / max 2` |
| 9b | ↳ especificação de "Outro" | `maior_problema_gestao_outro` | string | ➖ | `input[type=text]` condicional |
| 10 | Prioridade para resolver | `prioridade_resolucao` | string | ✅ | `radio` |
| 11 | Informações sobre a equipe | `informacoes_adicionais` | string | ➖ | `textarea` |
| 12 | Termo de Consentimento | `consentimento` | boolean | ✅ | `checkbox` único |

> **`email` e `whatsapp` são chaves congeladas.** São as entradas de `sendToMetaCAPI()` (`em` / `ph`). Renomeá-las quebra o casamento de conversões — qualquer mudança futura nessas duas chaves exige atualização simultânea do `.gs`.

> **`maior_problema_gestao` trafega como array.** Na planilha é serializado como string separada por `"; "` (e não `", "`, porque as próprias opções contêm vírgulas).

### 3.2 Rastreamento (preservado + ampliado)

| Chave | Origem | Uso |
| :--- | :--- | :--- |
| `event_id` | UUID v4 gerado no cliente | Deduplicação Pixel ↔ CAPI |
| `page_url` | `location.href` | `event_source_url` |
| `referrer` | `document.referrer` | Diagnóstico de origem |
| `user_agent` | `navigator.userAgent` | `user_data.client_user_agent` |
| `ip_address` | endpoint público (best-effort) | `user_data.client_ip_address` |
| `fbc` | cookie `_fbc` ou sintetizado de `fbclid` | `user_data.fbc` |
| `fbp` | cookie `_fbp` | `user_data.fbp` |
| `fbclid` | query string | Auditoria / fallback de `fbc` |
| `gclid` | query string | Atribuição Google Ads |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` | query string + `sessionStorage` (first-touch) | Atribuição de mídia |
| `submitted_at` | ISO 8601 do cliente | Conferência de fuso |

## 4. Frontend — `src/formulario.html`

### 4.1 Classes CSS preservadas (nenhuma renomeada, nenhuma removida)

`.c` `.l-w` `.l-img` `.p-c` `.bar` `.step` `.step.a` `.rg` `.rl` `.btns` `.btn` `.b-bk` `.err` `.i-err` `.shake` `.prg-inf` `.prg-txt` `.dots` `.dot` `.dot.act` `.leg` `.h` — mais `h2` e a regra `input:not([type=radio]):not([type=checkbox])`.

**Blocos novos reaproveitam as classes utilitárias existentes:**

*   Checkbox usa `.rg` / `.rl` (mesma estrutura dos radios). Diferença visual mínima: `border-radius: 4px` em vez de `50%` (`.rl input[type=checkbox]`), respeitando a convenção de que quadrado = múltipla escolha.
*   O input condicional de "Outro" usa `.oth` — apenas posicionamento (recuo e margem); a aparência vem da regra global de `input`.
*   `textarea` herda literalmente a mesma declaração visual do `input` (borda inferior, fundo transparente, `font-size: 16px`).
*   `.hint` reutiliza `--text-secondary`, substituindo o `style` inline do formulário legado.

### 4.2 Fluxo de 11 etapas

`nome_completo` → `email` → `whatsapp` → `instagram_site` → `modelo_negocio` → `tamanho_equipe` → `faturamento_mensal` → `autonomia_operacional` → `maior_problema_gestao` → `prioridade_resolucao` → `informacoes_adicionais + consentimento`

Consentimento fica **na última etapa, adjacente ao botão de envio** — a LGPD exige que a manifestação seja inequívoca e contextual ao ato de envio.

### 4.3 Regras de validação

| Etapa | Regra |
| :--- | :--- |
| `nome_completo` | ≥ 3 caracteres |
| `email` | regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` — **obrigatório** (era condicional no legado; o CAPI depende dele) |
| `whatsapp` | 10 ou 11 dígitos após remover a máscara |
| `instagram_site` | livre (opcional) |
| radios | exatamente 1 selecionado; se `Outro`, texto ≥ 2 caracteres |
| `maior_problema_gestao` | 1 ≤ selecionados ≤ 2 (3ª marcação é bloqueada e o contador dispara `.shake`) |
| `informacoes_adicionais` | livre (opcional) |
| `consentimento` | marcado |

### 4.4 Acessibilidade

`fieldset`/`legend` para radios e checkboxes, `aria-live="polite"` nas mensagens de erro, `aria-invalid` nos campos reprovados, `role="progressbar"` com `aria-valuenow` na barra. `maximum-scale=1.0, user-scalable=no` — presente no legado — é **removido**: impede zoom e reprova WCAG 1.4.4; o `font-size: 16px` dos inputs já evita o auto-zoom do iOS.

## 5. Backend — `apps_script_atualizado.gs`

### 5.1 Colunas da planilha (ordem canônica)

```
Data | Event ID | Nome Completo | E-mail | WhatsApp | Instagram/Site |
Modelo de Negócio | Modelo (Outro) | Tamanho da Equipe | Faturamento Mensal |
Autonomia Operacional | Autonomia (Outro) | Maior Problema (Gestão) | Problema (Outro) |
Prioridade | Informações Adicionais | Consentimento |
utm_source | utm_medium | utm_campaign | utm_content | utm_term |
FBCLID | GCLID | FBC | FBP | Página | Referrer | IP | User Agent | Status CAPI
```

### 5.2 Comportamento

*   `doPost` mantém `LockService` (10 s) — serializa gravações concorrentes.
*   `ensureSheet()` compara o cabeçalho existente com o canônico; divergindo, renomeia a aba para `Respostas_legado_<timestamp>` e cria a nova. **Nenhum dado é apagado.**
*   `sanitizeInput()` neutraliza injeção de fórmula (`=`, `+`, `-`, `@`, TAB, CR) e serializa arrays com `"; "`.
*   O WhatsApp é gravado como texto (prefixo `'`) para o Sheets não descartar o zero inicial — aplicado **uma única vez** (o legado corria o risco de prefixar duas vezes).
*   `sendToMetaCAPI()` é **reativado** (estava comentado no código base), dentro de `try/catch`: falha do CAPI nunca derruba a gravação do lead. O resultado vai para a coluna `Status CAPI`.
*   O CAPI **só dispara com `consentimento === true`** — sem base legal, sem envio a terceiro.
*   `user_data` enriquecido para elevar o EMQ: `em`, `ph`, `fn`, `ln`, `country` (`br`), `external_id` (hash do `event_id`), `client_ip_address`, `client_user_agent`, `fbc`, `fbp`.
*   `ACCESS_TOKEN` e `PIXEL_ID` vêm de Script Properties; `setupCredentials()` documenta a configuração inicial.
*   Versão da Graph API isolada em `CONFIG.API_VERSION` (v19.0 → **v21.0**).

## 6. Fora de escopo

*   Migração das linhas históricas da aba `Respostas` para o novo esquema (preservadas por renomeação).
*   Reavaliação do LDU global (D10).
*   Troca do transporte `no-cors` por `cors` com leitura de resposta (D8).

## 7. Critérios de aceite

1.  `npm run build` conclui sem erro e `formulario.html` entra no bundle.
2.  As 12 perguntas do PDF aparecem com texto **literal**, incluindo as opções "Outro".
3.  `maior_problema_gestao` impede a 3ª seleção e exige ao menos 1.
4.  Envio bloqueado sem consentimento.
5.  `event_id` no `payload` é um UUID válido — não `"[object HTMLInputElement]"`.
6.  `fbc`, `fbp`, `ip_address`, `page_url`, UTMs e `gclid` presentes no payload.
7.  `obrigada.html` dispara `fbq('track','Lead', {}, {eventID})` com o mesmo `event_id`.
8.  Nenhuma classe CSS do layout original foi removida ou renomeada.
9.  Nenhum segredo literal em `apps_script_atualizado.gs`.
