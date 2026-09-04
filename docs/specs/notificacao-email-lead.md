# SDD — Notificação por E-mail de Novo Lead

*   **Status**: **Implementada** (Etapas 1–6) — pendente Etapa 7, o deploy, que é ação manual no editor do Apps Script
*   **Arquivo afetado**: `apps_script_atualizado.gs` (único)
*   **Arquivos NÃO afetados**: `src/formulario.html`, `src/obrigada.html`, cabeçalho da planilha `Respostas`, testes Playwright
*   **Depende de**: [`docs/specs/pages/formulario.md`](pages/formulario.md) — contrato de dados do lead
*   **Legenda de origem das afirmações**:
    *   `[F]` **Fato observado** no código atual
    *   `[R]` **Requisito derivado** do objetivo desta mudança
    *   `[D]` **Decisão arquitetural proposta** (implementável como está)
    *   `[X]` **Decisão fechada** — resolvida em §0, implementável sem consulta

---

## 0. Decisões fechadas

Todas as decisões de arquitetura desta spec estão resolvidas. A implementação pode começar pela Etapa 1 de §17.

| # | Questão | Decisão | Onde | Alternativa descartada |
| :-- | :--- | :--- | :--- | :--- |
| DEC1 | Serviço de envio | **`MailApp.sendEmail`** | §13 | `GmailApp` — escopo OAuth amplo demais para o requisito |
| DEC2 | Formato do corpo | **Texto puro** | §9.3 | HTML — exigiria escaping próprio de todo campo livre |
| DEC3 | `replyTo` com o e-mail do lead | **Não implementar agora** | §9.3 | Entrada não confiável; endereço malformado derruba o envio. Reavaliar depois de validado o formato do e-mail |
| DEC4 | Destinatários | **Script Properties `LEAD_NOTIFY_TO`**, lidas a cada execução | §10.1 | Constante no arquivo — exigiria republicar o Web App para trocar destinatário |
| DEC5 | Posição da chamada | **Após `saveToSheet()`**, dentro do lock, imediatamente antes do `return` | §7 | Depois de `lock.releaseLock()` — diff maior, ganho de throughput irrelevante no volume atual |
| DEC6 | Propagação de erro | **`try/catch` próprio; exceção logada e descartada** | RF8, §7 | Deixar propagar — transformaria lead salvo em `result:'error'` |
| DEC7 | Idempotência | **Alternativa B — guarda em `CacheService`, chave `notify_<event_id>`, TTL 6 h, gravada antes do envio** | §11.2 | A (sem guarda) — reenvio manual geraria 2 avisos. C (Properties/varredura) — cresce sem limite ou acopla à planilha |
| DEC8 | Faturamento no assunto | **Manter** — `Novo lead — {nome} ({faturamento})` | §9.3 | Assunto genérico. Recipientes são caixas corporativas da própria empresa (§12) e o assunto é o que permite priorizar sem abrir o e-mail. Reverter é uma linha |
| DEC9 | Checagem de `getRemainingDailyQuota()` | **Não implementar** | §13 | RF8 já captura o estouro e o registra em *Execuções*. Adicionar só se a conta for `@gmail.com` **e** o volume se aproximar do teto |

`[F]` **Confirmado**: a conta proprietária do script é **Google Workspace** — teto de 1.500 destinatários/dia (§13). Nenhum ponto em aberto; DEC9 (não checar quota) fica confirmada por folga ampla.

---

## 1. Contexto e estado atual

### 1.1 Fluxo hoje

`[F]` `src/formulario.html:1017` envia um `fetch` POST para o Web App do Apps Script:

```js
fetch(G_URL, { method: "POST", mode: "no-cors",
               headers: { "Content-Type": "text/plain;charset=UTF-8" },
               body: JSON.stringify(payload), keepalive: true })
  .then(done).catch(fail);
```

`[F]` `doPost(e)` em `apps_script_atualizado.gs:56` executa, nesta ordem:

1.  `LockService.getScriptLock().tryLock(10000)` — se falhar, retorna `{result:'error', error:'Server Busy'}` **sem gravar nada**.
2.  `JSON.parse(e.postData.contents)`.
3.  Se houver consentimento, `sendToMetaCAPI(data)` dentro de `try/catch` próprio — falha vira string de status, nunca aborta o fluxo.
4.  `saveToSheet(data, capiStatus)` — `appendRow` de 31 colunas na aba devolvida por `ensureSheet()`.
5.  `return jsonOut({ result: 'success', event_id: data.event_id || '' })`.
6.  `catch (ex)` genérico → `{result:'error', error: ex.toString()}`; `finally` → `lock.releaseLock()`.

### 1.2 Fatos relevantes para esta mudança

| # | Fato observado | Evidência | Consequência para o desenho |
| :-- | :--- | :--- | :--- |
| F1 | O padrão "efeito colateral externo isolado por `try/catch`" já existe | bloco CAPI em `doPost` | A notificação deve **copiar esse mesmo padrão**, não inventar outro |
| F2 | O cliente usa `mode: "no-cors"` | `formulario.html:1019` | A resposta é **opaca**: o navegador nunca lê `result`, `error` nem `event_id`. O contrato HTTP é consumido apenas por diagnóstico manual (`doGet`) |
| F3 | Não existe retry automático em lugar nenhum | `.then(done).catch(fail)`; `fail()` apenas reabilita o botão | Reprocessamento só ocorre por **ação humana** (reenvio manual após falha de rede) |
| F4 | `EVENT_ID` é gerado **uma vez por carregamento de página** | `formulario.html:704` | Reenvio manual sem recarregar → mesmo `event_id`; recarregar a página → `event_id` novo |
| F5 | Já hoje um reenvio manual grava **duas linhas** na planilha com o mesmo `event_id` | ausência de checagem em `saveToSheet` | A duplicidade de linhas é comportamento **pré-existente e fora de escopo**; a de e-mail é o que esta spec trata |
| F6 | `HEADERS` é o cabeçalho canônico e `ensureSheet()` **arquiva a aba por renomeação** quando o cabeçalho diverge | `apps_script_atualizado.gs:104-130` | Acrescentar uma coluna ("Status E-mail") **renomearia a aba de produção** e criaria uma nova, quebrando fórmulas, filtros e integrações apontadas para `Respostas` |
| F7 | Credenciais vivem em `PropertiesService.getScriptProperties()` | `sendToMetaCAPI`, linhas 180-183 | O destinatário do aviso deve seguir o mesmo mecanismo |
| F8 | `sanitizeInput()` prefixa `'` em valores iniciados por `= + - @` e serializa arrays com `"; "` | `apps_script_atualizado.gs:262-275` | É um artefato **específico do Sheets**. O corpo do e-mail **não deve** reutilizar essa saída, sob pena de exibir `'=Nome` |
| F9 | `setupCredentials()` e `testEnsureSheet()` são o padrão de setup/diagnóstico manual | seção final do `.gs` | A função de teste da notificação deve seguir esse padrão |
| F10 | O `.gs` não é coberto por nenhum teste automatizado do repositório | `npm test` roda apenas Playwright sobre `src/*.html` | A verificação desta mudança é manual, via editor do Apps Script |

---

## 2. Problema

`[F]` Um lead qualificado hoje só se torna visível quando alguém abre a planilha `Respostas`. Não há sinal ativo (push) de chegada.

`[R]` O tempo de resposta a uma aplicação de sessão estratégica é o fator que mais influencia a taxa de agendamento; depender de consulta manual da planilha introduz latência não controlada e risco de lead esquecido.

---

## 3. Objetivo da mudança

`[R]` Emitir uma notificação por e-mail, com os principais dados do lead, **após** a gravação bem-sucedida na planilha — sem alterar em nada o comportamento atual de gravação, de CAPI, de concorrência ou de retorno HTTP.

---

## 4. Escopo / fora do escopo

### 4.1 Escopo

*   `[R]` Nova função de notificação em `apps_script_atualizado.gs`.
*   `[R]` Uma única chamada nova dentro de `doPost`, após `saveToSheet`.
*   `[R]` Configuração de destinatário(s) via Script Properties.
*   `[R]` Função de diagnóstico manual, no padrão de F9.
*   `[R]` Nova entrada de setup documentada no cabeçalho do arquivo.

### 4.2 Fora do escopo

*   `[R]` Qualquer alteração em `src/formulario.html` ou `src/obrigada.html`.
*   `[R]` Alteração de `HEADERS` / esquema da planilha (ver F6).
*   `[R]` Alteração do payload enviado pelo cliente.
*   `[R]` Alteração do fluxo CAPI.
*   `[R]` Deduplicação das **linhas** da planilha (F5) — comportamento pré-existente.
*   `[R]` Notificação por outros canais (WhatsApp, Slack, webhook).
*   `[R]` E-mail de confirmação **para o lead**. Esta spec cobre apenas o aviso **interno**.
*   `[R]` Digest/resumo agendado por *time-driven trigger*.

---

## 5. Requisitos funcionais

| ID | Requisito | Origem |
| :-- | :--- | :--- |
| RF1 | `doPost` continua recebendo o POST atual sem alteração de contrato de entrada | `[R]` |
| RF2 | `saveToSheet` continua sendo chamada exatamente como hoje, com os mesmos argumentos e na mesma posição relativa ao CAPI | `[R]` |
| RF3 | A notificação é disparada **somente após** `saveToSheet` retornar sem exceção | `[R]` |
| RF4 | O envio usa recurso nativo do Apps Script (`MailApp` ou `GmailApp`) — sem dependência externa, sem `UrlFetchApp` para terceiros | `[R]` |
| RF5 | O(s) destinatário(s) são lidos de Script Properties, aceitando lista separada por vírgula | `[R]` |
| RF6 | Se a propriedade de destinatário estiver ausente ou vazia, a notificação é **silenciosamente pulada** — não é erro | `[D]` |
| RF7 | O e-mail contém: data/hora, `event_id`, nome, e-mail, WhatsApp, Instagram/site, modelo de negócio (+ "outro"), tamanho da equipe, faturamento, autonomia operacional (+ "outro"), maior problema de gestão (+ "outro"), prioridade, informações adicionais, consentimento, `utm_source`/`utm_medium`/`utm_campaign`, `page_url` e status CAPI | `[D]` |
| RF8 | Qualquer exceção do envio é capturada, registrada em `console.error` e **descartada**; o retorno permanece `{result:'success', ...}` | `[R]` |
| RF9 | O retorno HTTP (`jsonOut`, `result`, `event_id`) permanece idêntico ao atual em todos os caminhos | `[R]` |
| RF10 | O tratamento de `Server Busy` (lock não obtido) permanece: sem gravação **e** sem notificação | `[R]` |
| RF11 | Reprocessamento do mesmo `event_id` dentro de 6 h não gera segundo e-mail (DEC7) — ver §11 | `[R]` / `[X]` |

---

## 6. Requisitos não funcionais

| ID | Requisito | Nota |
| :-- | :--- | :--- |
| RNF1 | Mudança mínima: um único arquivo, nenhuma abstração nova além da função de notificação e seus helpers diretos | `[R]` |
| RNF2 | Baixo acoplamento: `saveToSheet` e `sendToMetaCAPI` não são modificadas | `[R]` |
| RNF3 | A latência adicionada ao `doPost` deve ser da ordem de centenas de ms; o `LOCK_TIMEOUT_MS` de 10 s não deve ser pressionado | `[D]` |
| RNF4 | Nenhum segredo (`META_ACCESS_TOKEN`, `META_PIXEL_ID`, `META_TEST_CODE`) pode aparecer no corpo, assunto ou log do e-mail | `[R]` |
| RNF5 | Legibilidade em cliente móvel — o aviso é lido no celular, não no desktop | `[D]` |
| RNF6 | O arquivo versionado continua sem segredos: apenas nomes de propriedades | `[F]` / `[R]` |

---

## 7. Fluxo da solução

```
POST /exec (text/plain, JSON)
        │
        ▼
  tryLock(10s) ──falha──► jsonOut{result:'error', error:'Server Busy'}   [inalterado]
        │ ok
        ▼
  JSON.parse(e.postData.contents)                                        [inalterado]
        │
        ▼
  consentimento? ──sim──► try { sendToMetaCAPI } catch → capiStatus      [inalterado]
        │
        ▼
  saveToSheet(data, capiStatus)                                          [inalterado]
        │
        ▼
  try { notifyNewLead(data, capiStatus) }                                [NOVO]
    catch (e) { console.error('Erro notificação', e) }   ← nunca propaga
        │
        ▼
  jsonOut{result:'success', event_id}                                    [inalterado]
        │
   finally: lock.releaseLock()                                           [inalterado]
```

`[X]` **DEC5 — a chamada fica dentro do bloco protegido pelo lock**, imediatamente após `saveToSheet()` e antes do `return`.

*   *Prós*: ordenação garantida (nunca notifica um lead não gravado); diff mínimo; espelha exatamente a posição do bloco CAPI.
*   *Contra (teto conhecido)*: mantém o script lock durante o envio do e-mail, reduzindo o throughput de POSTs concorrentes. `MailApp.sendEmail` custa tipicamente menos de 1 s contra um `LOCK_TIMEOUT_MS` de 10 s, e o volume do formulário é baixo — a folga é ampla.
*   *Caminho de upgrade*: se o volume crescer a ponto de aparecerem respostas `Server Busy`, mover a chamada para depois de `lock.releaseLock()` (exige capturar o retorno de `jsonOut` em variável antes do `return`).

---

## 8. Arquitetura / componentes envolvidos

| Componente | Papel | Alteração |
| :--- | :--- | :--- |
| `src/formulario.html` | Produtor do payload | **Nenhuma** |
| `doPost` | Orquestrador | +1 bloco `try/catch` de 3 linhas |
| `sendToMetaCAPI` | Efeito externo (Meta) | **Nenhuma** |
| `saveToSheet` / `ensureSheet` / `HEADERS` | Persistência | **Nenhuma** |
| `sanitizeInput` / `asText` / `onlyDigits` | Utilitários do Sheets | **Nenhuma** (ver F8 — não reutilizar no e-mail) |
| `notifyNewLead(data, capiStatus)` | **NOVO** — lê config, monta e envia o aviso | Nova função |
| `buildLeadEmail(data, capiStatus)` | **NOVO (opcional)** — monta assunto + corpo, sem efeito colateral | `[D]` separar torna a montagem verificável no editor sem consumir quota |
| `PropertiesService` | Configuração | +1 ou 2 propriedades |
| `MailApp` / `GmailApp` | Transporte | Novo serviço → **novo escopo OAuth** (ver §10.3) |
| `CacheService` | Guarda de idempotência | Condicional à decisão de §11 |

---

## 9. Contrato dos dados utilizados pelo e-mail

`[D]` A notificação lê **os mesmos campos que a planilha já grava** — nenhum campo novo é solicitado ao cliente, nenhum campo é inventado.

### 9.1 Campos incluídos

| Rótulo no e-mail | Chave do payload | Tipo | Tratamento |
| :--- | :--- | :--- | :--- |
| Recebido em | *(gerado no servidor)* | Date | `Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm')` |
| ID do evento | `event_id` | string | valor cru |
| Nome | `nome_completo` | string | valor cru, `trim` |
| E-mail | `email` | string | valor cru, `trim` |
| WhatsApp | `whatsapp` | string | valor cru (`asText`/`onlyDigits` são artefatos do Sheets — F8) |
| Instagram/site | `instagram_site` | string | omitir a linha se vazio |
| Modelo de negócio | `modelo_negocio` + `modelo_negocio_outro` | string | concatenar com `" — "` quando houver "outro" |
| Tamanho da equipe | `tamanho_equipe` | string | — |
| Faturamento mensal | `faturamento_mensal` | string | — |
| Autonomia operacional | `autonomia_operacional` + `autonomia_operacional_outro` | string | idem modelo de negócio |
| Maior problema | `maior_problema_gestao` + `maior_problema_gestao_outro` | **array&lt;string&gt;** | juntar com `"; "` — as próprias opções contêm vírgulas (`formulario.md` §3.1) |
| Prioridade | `prioridade_resolucao` | string | — |
| Informações adicionais | `informacoes_adicionais` | string | omitir a linha se vazio |
| Consentimento | `consentimento` | boolean \| string | `(=== true \|\| === 'Sim') ? 'Sim' : 'Não'` — **mesma regra** já usada em `saveToSheet` |
| Origem | `utm_source` / `utm_medium` / `utm_campaign` | string | uma linha só; `"—"` quando os três estiverem vazios |
| Página | `page_url` | string | valor cru |
| Status CAPI | *argumento* `capiStatus` | string | valor cru |

### 9.2 Campos deliberadamente excluídos

`[D]` `ip_address`, `user_agent`, `fbc`, `fbp`, `fbclid`, `gclid`, `utm_content`, `utm_term`, `referrer`, `submitted_at`.

**Motivo**: são dados de rastreamento sem valor para quem vai ligar para o lead (RNF5) e, no caso de IP/UA/`fbc`/`fbp`, dados pessoais cuja replicação para caixas de e-mail amplia a superfície de exposição sem necessidade (§12). Permanecem integralmente na planilha.

### 9.3 Formato do corpo

`[X]` **DEC2 — texto puro.** Assinatura: `MailApp.sendEmail(to, subject, body)`, três argumentos posicionais, **sem** objeto de opções.

Sem escaping, sem risco de o conteúdo de um campo livre (`informacoes_adicionais`) quebrar o layout ou injetar markup, legível em qualquer cliente e com o menor diff possível (RNF1). O custo aceito é não haver `mailto:` / `tel:` clicáveis — o operador copia e cola. Migrar para `htmlBody` depois exige, obrigatoriamente, uma função de escape aplicada a **todos** os campos vindos do lead.

`[X]` **DEC8 — assunto**: `Novo lead — {nome_completo} ({faturamento_mensal})`, com `LEAD_NOTIFY_SUBJECT_PREFIX` na frente quando a propriedade existir.

O faturamento no assunto é o que permite priorizar sem abrir o e-mail. Os destinatários são caixas corporativas controladas pela própria empresa (§12) e o dado já circula na planilha. Se a exposição em notificação de tela bloqueada incomodar, a variante conservadora `Nova aplicação recebida — {primeiro nome}` é uma alteração de uma linha.

`[X]` **DEC3 — sem `replyTo` nesta versão.** O e-mail do lead está no corpo. `replyTo` é entrada não confiável: um endereço malformado faz `MailApp` lançar exceção e, embora RF8 capture, o aviso se perde. Se for adotado depois, é obrigatório validar com regex simples e **omitir** o campo quando não casar — nunca repassar o valor cru.

*Layout do corpo* (`[D]`): uma linha `Rótulo: valor` por campo, na ordem de §9.1, com uma linha em branco separando os blocos *contato* → *qualificação* → *origem/diagnóstico*. Linhas de campos opcionais vazios são omitidas (T7).

---

## 10. Configuração necessária

### 10.1 Script Properties

*Editor do Apps Script > Configurações do projeto > Propriedades do script*

| Propriedade | Obrigatória | Formato | Comportamento se ausente |
| :--- | :--- | :--- | :--- |
| `LEAD_NOTIFY_TO` | para ativar | e-mails separados por vírgula, ex.: `a@x.com, b@x.com` | Notificação desativada silenciosamente (RF6) |
| `LEAD_NOTIFY_SUBJECT_PREFIX` | não | string, ex.: `[Boutique]` | Assunto sem prefixo |

`[D]` `LEAD_NOTIFY_TO` é lido **a cada execução** (não cacheado em constante de módulo), para que trocar o destinatário não exija republicar o Web App. É isso que satisfaz o requisito de configurar destinatários sem tocar na lógica principal.

`[D]` A lista é normalizada com `split(',')` → `trim` → descarte de vazios → `join(',')`; `MailApp` aceita a string com vírgulas diretamente.

### 10.2 Documentação no arquivo

`[R]` O bloco `SETUP OBRIGATÓRIO` no topo de `apps_script_atualizado.gs` ganha a seção de notificação, e `setupCredentials()` ganha a chave `LEAD_NOTIFY_TO: ''`. **Sem valores reais no arquivo versionado** (RNF6).

### 10.3 Reautorização e redeploy — atenção operacional

`[F]` A URL do Web App está **hardcoded** em `src/formulario.html:670`.

`[R]` Usar `MailApp` / `GmailApp` introduz um escopo OAuth novo. Consequências:

1.  O proprietário do script precisa **reautorizar** o projeto — rodar a função de diagnóstico uma vez no editor dispara o consentimento.
2.  O deploy precisa de **nova versão**, publicada em *Gerenciar implantações → editar a implantação existente → Nova versão*. **Nunca** criar uma implantação nova: isso gera outra URL `/exec` e o formulário em produção continuaria apontando para a versão antiga.
3.  Validar após o deploy que `GET /exec` responde `{"result":"ok","service":"boutique-leads",...}`.

---

## 11. Idempotência e duplicidade

### 11.1 Vetores reais de duplicidade

| Vetor | Existe hoje? | `event_id` repetido? |
| :--- | :--- | :--- |
| Duplo clique no botão | Não — guarda `sending` (`formulario.html:983`) | — |
| Reenvio manual após `fail()` (erro de rede) | `[F]` Sim | **Sim** (F4 — a página não recarregou) |
| Recarregar a página e reenviar | `[F]` Sim | Não — novo UUID; são dois leads distintos do ponto de vista do sistema |
| Retry automático do cliente | `[F]` Não existe | — |
| Retry do Apps Script sobre `doPost` | `[F]` Não há mecanismo | — |

`[F]` Portanto o único caminho de reprocessamento com `event_id` idêntico é o reenvio manual — que **já hoje** duplica a linha na planilha (F5).

### 11.2 Decisão

`[X]` **DEC7 — Alternativa B: guarda em `CacheService.getScriptCache()`.**

| Alt. | Descrição | Veredito |
| :-- | :--- | :--- |
| A | Sem guarda: notifica sempre que `saveToSheet` tiver sucesso | **Descartada** — o reenvio manual (§11.1) é um caminho real, e dois avisos do mesmo lead levam a equipe a ligar duas vezes |
| **B** | Chave `notify_<event_id>`; se já existir, pula o envio e loga; senão grava com TTL de 6 h (21600 s) e envia | **Adotada** — ~4 linhas, `CacheService` é nativo, cobre a janela realista (o reenvio ocorre em segundos ou minutos) e roda **dentro do lock**, logo sem corrida |
| C | Guarda em `PropertiesService`, ou varredura das últimas N linhas da planilha atrás do `event_id` | **Descartada** — Properties cresce indefinidamente e exige rotina de limpeza; a varredura adiciona leitura a cada POST e acopla a notificação ao esquema da planilha |

**Regras de implementação da guarda:**

1.  `[X]` A chave é gravada **antes** do envio. Uma falha do `MailApp` não é reprocessada em duplicidade — coerente com RF8, que já trata o aviso perdido como aceitável. O inverso (gravar depois) trocaria "aviso perdido" por "aviso duplicado" a cada erro transitório.
2.  `[X]` `event_id` ausente ou vazio no payload **desliga** a guarda — envia sempre. Falta de chave nunca pode virar motivo para não notificar.
3.  `[X]` `event_id` é a **única** chave de idempotência. Não derivar chave de e-mail ou telefone: o mesmo lead pode legitimamente reaplicar.
4.  `[X]` **Teto conhecido e aceito**: `CacheService` é volátil e a evicção não é garantida — a proteção é *best-effort*, não absoluta, e os e-mails deixam de ser 1:1 com as linhas da planilha. Um aviso duplicado após evicção é um incômodo, não um defeito de dados. Garantia absoluta exigiria a alternativa C, cujo custo de manutenção não se justifica no volume atual.
5.  `[D]` O TTL vive em `CONFIG.NOTIFY_CACHE_TTL_S = 21600` (6 h — o máximo do serviço), junto das demais constantes.

---

## 12. Segurança e privacidade

*   `[R]` **Nenhum segredo no e-mail** (RNF4). O corpo é montado a partir de `data.*` e de `capiStatus`. `[F]` `capiStatus` já é uma string curta (`'enviado (200)'`, `'erro HTTP 400'`); o corpo da resposta da Meta vai para `console.error`, não para o retorno de `sendToMetaCAPI` — verificado nas linhas 250-256.
*   `[R]` **Nenhum log de payload completo.** O `console.error` da captura de RF8 registra apenas a exceção e, no máximo, o `event_id` — nunca o objeto `data`.
*   `[D]` Rastreadores (`ip_address`, `user_agent`, `fbc`, `fbp`) ficam fora do e-mail (§9.2): reduzir a difusão de dados pessoais para caixas postais é minimização de dados (LGPD Art. 6º, III).
*   `[D]` Destinatários vêm de Script Properties, nunca do payload — o cliente não pode induzir envio para terceiros.
*   `[D]` `LEAD_NOTIFY_TO` deve conter apenas caixas corporativas controladas pela Boutique.
*   `[X]` DEC8: o assunto carrega nome + faixa de faturamento. Aceito porque os destinatários são caixas corporativas da própria empresa e o ganho de triagem é direto; a variante conservadora está descrita em §9.3.
*   `[X]` DEC3: sem `replyTo`, o payload do lead não alimenta nenhum cabeçalho da mensagem — apenas o corpo. Reduz a superfície de manipulação do envelope por entrada não confiável.
*   `[F]` O consentimento (`consentimento`) é registrado e vai no corpo — o operador precisa saber se pode contatar o titular.

---

## 13. Quotas e limitações do Apps Script

| Limite | Valor | Impacto |
| :--- | :--- | :--- |
| E-mails/dia — conta `@gmail.com` | 100 destinatários/dia | Com 2 destinatários por lead, teto de ~50 leads/dia |
| E-mails/dia — Google Workspace | 1.500 destinatários/dia | Sem risco prático |
| Destinatários por mensagem | 50 | `LEAD_NOTIFY_TO` deve ficar bem abaixo disso |
| Tempo de execução do `doPost` | 6 min | Sem risco — o envio é sub-segundo |
| `LOCK_TIMEOUT_MS` do script | `[F]` 10.000 ms | O envio ocorre dentro do lock (§7); POSTs concorrentes esperam um pouco mais |
| `CacheService` | TTL máx. 6 h; valores até 100 KB; **evicção não garantida** | Por isso a guarda de §11 é *best-effort* |

`[F]` **A conta proprietária é Google Workspace** — teto de 1.500 destinatários/dia. Com 1 a 2 destinatários por lead, o volume do formulário fica ordens de grandeza abaixo do limite: quota **não** é risco operacional aqui.

`[X]` **DEC1 — `MailApp`, não `GmailApp`.**

| | `MailApp.sendEmail` | `GmailApp.sendEmail` |
| :--- | :--- | :--- |
| Escopo OAuth | `script.send_mail` — estreito | acesso amplo ao Gmail |
| Cópia em "Enviados" | Não | Sim |
| Remetente | Conta proprietária do script | Conta proprietária do script, com possibilidade de alias |
| Veredito | **Adotado** — menor privilégio, e o requisito não pede mais que isso | Descartado: histórico em "Enviados" e alias não são requisitos |

`[X]` **DEC9 — sem checagem de `getRemainingDailyQuota()`.** `MailApp.sendEmail` lança exceção quando a quota diária acaba; RF8 captura, o lead continua salvo e o erro aparece em *Execuções* do Apps Script. Uma checagem preventiva custaria mais uma chamada de serviço por POST para antecipar um evento que o log já registra. **Adicionar quando** a conta for `@gmail.com` **e** o volume diário se aproximar do teto de 100 destinatários.

---

## 14. Critérios de aceite

| ID | Critério |
| :-- | :--- |
| CA1 | Com `LEAD_NOTIFY_TO` configurada, um POST válido grava **uma** linha em `Respostas` **e** entrega um e-mail aos destinatários |
| CA2 | A linha gravada é idêntica, coluna a coluna, à que o código atual gravaria para o mesmo payload |
| CA3 | O JSON de resposta é `{"result":"success","event_id":"<uuid>"}` — idêntico ao atual |
| CA4 | Com `LEAD_NOTIFY_TO` ausente ou vazia, o fluxo é indistinguível do atual: linha gravada, `result:'success'`, **nenhum** e-mail, **nenhum** erro nas Execuções |
| CA5 | Com `LEAD_NOTIFY_TO` inválida (endereço malformado), a linha é gravada, o retorno é `success` e o erro aparece apenas em `console.error` |
| CA6 | O e-mail contém todos os campos de §9.1 e **nenhum** de §9.2 |
| CA7 | Nenhuma string de `META_ACCESS_TOKEN`, `META_PIXEL_ID` ou `META_TEST_CODE` aparece no assunto, corpo ou logs |
| CA8 | `HEADERS` inalterado; a aba `Respostas` **não** é renomeada nem recriada após o deploy (ver F6) |
| CA9 | `git diff` toca **somente** `apps_script_atualizado.gs` e a documentação |
| CA10 | Dois POSTs com o mesmo `event_id` em menos de 6 h → duas linhas (comportamento pré-existente, F5) e **um** e-mail (DEC7) |
| CA13 | Um POST sem `event_id` (ou com `event_id` vazio) é notificado normalmente — a guarda de §11 não pode bloquear o aviso por falta de chave |
| CA14 | O e-mail é texto puro, sem `htmlBody`, e a mensagem **não** define `replyTo` (DEC2, DEC3) |
| CA11 | `npm test` e `npm run gate` continuam verdes — nenhuma suíte toca o `.gs` (F10); o critério é "não regrediu" |
| CA12 | A falha no CAPI (`capiStatus` começando com `erro`) não impede a notificação, e o status aparece no corpo do e-mail |

---

## 15. Casos de teste

`[D]` Executados manualmente no editor do Apps Script, no padrão de F9. Os payloads de T1–T12 podem ser fixtures de um `testNotifyNewLead()` que chama `doPost({ postData: { contents: JSON.stringify(fixture) } })`.

| ID | Cenário | Entrada | Resultado esperado |
| :-- | :--- | :--- | :--- |
| T1 | Caminho feliz | Payload completo, `consentimento: true`, `LEAD_NOTIFY_TO` com 1 endereço | 1 linha + 1 e-mail + `result:'success'` |
| T2 | Sem destinatário configurado | Igual a T1, `LEAD_NOTIFY_TO` vazia | 1 linha, 0 e-mail, `result:'success'`, sem erro logado |
| T3 | Múltiplos destinatários | `LEAD_NOTIFY_TO = "a@x.com, b@x.com"` | Ambos recebem; a vírgula com espaço é tolerada |
| T4 | Falha no envio | `LEAD_NOTIFY_TO = "nao-e-um-email"` | 1 linha, `result:'success'`, `console.error` presente |
| T5 | Sem consentimento | `consentimento: false` | 1 linha com `Não`, CAPI não chamado, e-mail **enviado** exibindo "Consentimento: Não" |
| T6 | CAPI falhou | Token inválido nas Properties | 1 linha com `Status CAPI` de erro; e-mail enviado exibindo esse mesmo status (CA12) |
| T7 | Campos opcionais vazios | Sem `instagram_site` e sem `informacoes_adicionais` | E-mail sem essas linhas, sem `undefined` / `null` no corpo |
| T8 | Múltiplos problemas de gestão | `maior_problema_gestao` com 2 itens | Corpo mostra os dois separados por `"; "` |
| T9 | Campo com caractere de fórmula | `nome_completo: "=Fulano"` | Planilha grava `'=Fulano` (inalterado); e-mail exibe `=Fulano` **sem** o apóstrofo (F8) |
| T10 | Reenvio com mesmo `event_id` | Dois POSTs idênticos, com menos de 6 h de intervalo | 2 linhas e **1** e-mail; o segundo POST registra em log que pulou a notificação (DEC7) |
| T10b | Payload sem `event_id` | `event_id` ausente | 1 linha e 1 e-mail — guarda desligada, não bloqueia (CA13) |
| T11 | Lock indisponível | Simular `tryLock` falhando | `{result:'error', error:'Server Busy'}`, 0 linha, 0 e-mail (RF10) |
| T12 | JSON malformado | `contents: "{"` | `{result:'error', ...}`, 0 linha, 0 e-mail |
| T13 | Regressão ponta a ponta | Submeter o formulário real em produção após o deploy | Linha na planilha, e-mail recebido e redirecionamento para `obrigada.html?eid=...` funcionando |

---

## 16. Impacto sobre o código existente

| Arquivo / símbolo | Impacto |
| :--- | :--- |
| `src/formulario.html` | **Zero** |
| `src/obrigada.html` | **Zero** |
| `doPost` | +1 bloco `try/catch` de 3 linhas, entre `saveToSheet` e o `return` |
| `saveToSheet`, `ensureSheet`, `HEADERS`, `sendToMetaCAPI`, `sanitizeInput`, `asText`, `onlyDigits`, `hashSHA256`, `jsonOut`, `doGet` | **Zero** |
| `CONFIG` | +1 chave `NOTIFY_CACHE_TTL_S: 21600` (DEC7). Nenhum valor existente muda |
| `setupCredentials()` | +1 chave `LEAD_NOTIFY_TO: ''` |
| Cabeçalho do arquivo (comentário `SETUP OBRIGATÓRIO`) | +seção de notificação |
| Planilha `Respostas` | **Zero** — nenhuma coluna nova (F6) |
| Escopos OAuth / deploy | **Impacto real**: nova autorização + nova versão da implantação existente (§10.3) |
| Testes Playwright (`tests/`, `e2e/`) | **Zero** — não cobrem o `.gs` (F10) |

---

## 17. Plano de implementação em etapas

**Estado**: Etapas 0–6 concluídas em `apps_script_atualizado.gs`. Etapas 7 e 8 pendentes.

Funções entregues: `notifyNewLead()`, `buildLeadEmail()`, `plainText()`, `optionalLine()`, `withOther()`, `leadFixture()`, `testBuildLeadEmail()`, `testNotifyNewLead()`.

`[D]` **Desvio consciente de §16**: a regra de consentimento (`=== true || === 'Sim'`) ficou **repetida** em `buildLeadEmail`, em vez de extraída para um helper compartilhado com `saveToSheet`. Unificar exigiria editar o caminho de gravação, que RF2 e CA2 se comprometeram a não tocar. A duplicação está sinalizada por comentário no código. Se um dia `saveToSheet` for alterada por outro motivo, extrair as duas ocorrências é a hora certa.

### Etapa 0 — Decisões

**Concluída.** Todas as decisões estão fechadas em §0 (DEC1–DEC9). Resta apenas confirmar o tipo da conta proprietária (§13), o que não bloqueia nenhuma etapa.

### Etapa 1 — Configuração

Criar `LEAD_NOTIFY_TO` (e, se decidido, `LEAD_NOTIFY_SUBJECT_PREFIX`) nas Script Properties. Atualizar o comentário de setup e `setupCredentials()`.

### Etapa 2 — Montagem do e-mail (sem efeito colateral)

Implementar `buildLeadEmail(data, capiStatus) → { subject, body }` conforme §9. Verificar com uma função de diagnóstico que apenas faz `console.log` do resultado — **não consome quota**. Cobre T7, T8, T9.

### Etapa 3 — Envio

Implementar `notifyNewLead(data, capiStatus)`: lê `LEAD_NOTIFY_TO` → sai cedo se vazia (RF6) → monta via Etapa 2 → `MailApp.sendEmail(to, subject, body)` (DEC1, DEC2, DEC3). Sem `try/catch` interno além do que RF8 exige em `doPost`. Cobre T1–T4, CA14.

### Etapa 4 — Ligação ao fluxo

Inserir em `doPost`, entre `saveToSheet` e o `return`:

```js
try { notifyNewLead(data, capiStatus); }
catch (mailError) { console.error('Erro notificação', mailError); }
```

Esta é a **única** mudança no caminho crítico. Cobre CA3, CA4, CA12, T5, T6, T11, T12.

### Etapa 5 — Idempotência

Aplicar a guarda `CacheService` de §11.2 (DEC7) dentro de `notifyNewLead`, no início: `event_id` vazio → segue direto; chave presente → loga e retorna; senão grava a chave com `CONFIG.NOTIFY_CACHE_TTL_S` e prossegue. Cobre T10, T10b, CA10, CA13.

### Etapa 6 — Diagnóstico manual

Adicionar `testNotifyNewLead()` no bloco de setup/diagnóstico (F9), com um payload fixture completo, para reautorizar o escopo e validar o formato sem tocar em produção.

### Etapa 7 — Deploy

Rodar `testNotifyNewLead()` no editor para disparar o consentimento do novo escopo → *Gerenciar implantações → editar a existente → Nova versão* (§10.3) → validar `GET /exec` → executar T13 com um lead de teste real → conferir CA8 (a aba `Respostas` não foi renomeada).

### Etapa 8 — Documentação

Atualizar `docs/specs/pages/formulario.md` §5.2 mencionando o novo passo do backend e marcar esta spec como *Aprovada / Implementada*.
