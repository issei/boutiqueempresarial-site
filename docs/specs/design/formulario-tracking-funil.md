# Rastreamento do funil do formulário (GA4 + Meta Pixel) e LDU no CAPI

**Status**: Implementada (PR #25) — o passo 2 de §5 (Apps Script) está feito; os passos 1 e 3 (GA4 e Meta) seguem manuais e não verificáveis pelo repositório

## Objetivo

Medir em qual etapa as pessoas travam no formulário e conseguir públicos de remarketing, sem PII e sem
JS novo além de um helper `track()` (~5 linhas) em `src/formulario.html`.

## Princípio

Instrumentar **pontos de transição**, não cliques no DOM. Mouse, toque, atalhos 1–4, auto-avanço de 380 ms,
Enter e "Próximo" convergem para `ui()`, `nav()` e o listener `change`.

## Catálogo

Nome da etapa (`step_name`) = `name` do primeiro campo da etapa (`maior_problema_gestao`, `nome_completo`,
`whatsapp`, `email`, `modelo_negocio`, `tamanho_equipe`, `faturamento_mensal`). Sem tabela de índices.

| Evento GA4 | Onde dispara | Parâmetros |
| :-- | :-- | :-- |
| `form_step_view` | `ui()` — cada etapa exibida | `step_index`, `step_name`, `direction` (`init`/`forward`/`back`) |
| `form_answer` | `change` de radio na etapa atual | `step_name`, `answer` (valor do radio) |
| `form_step_complete` | `nav(1)` após validar | `step_index`, `step_name`, `duration_ms` |
| `form_back` | `nav(-1)` | `step_index`, `step_name` |
| `form_validation_error` | `showError()` | `step_name` |
| `form_begin` | 1ª `form_step_complete` | — |
| `form_contact_captured` | 1ª vez que nome + WhatsApp + e-mail validam (`contactOk()`) | — |
| `form_submit_attempt` / `form_submit_error` | `submit()` / `fail()` | — |
| `generate_lead` | `obrigada.html` (após `gtag('config')`) | `event_id` |

| Evento Meta (`trackCustom`) | Mesmo disparo de | Uso |
| :-- | :-- | :-- |
| `FormStart` | `form_begin` | público de quem começou |
| `ContactCaptured` | `form_contact_captured` | remarketing "deu contato e não concluiu" |
| `Lead` (já existia) | `obrigada.html`, com `eventID` | otimização; deduplica com o CAPI — **inalterado** |

O Meta recebe só o que vira público; o detalhe do funil fica no GA4.

## Restrições

- **Sem PII**: nunca nome, e-mail, WhatsApp nem o texto livre de "Outro". `answer` vem só de radios (conjuntos
  fechados). Coberto por teste.
- `form_start`/`form_submit` são nomes da Medição aprimorada do GA4 ("Interações com formulário"); por isso o
  catálogo usa `form_step_*`/`form_begin`.
- `gtag`/`fbq` bloqueados (adblock) não afetam o fluxo: cada chamada está em `try/catch`.
- Pixel e GA4 subcontam com bloqueadores; a contagem independente virá da pré-captura server-side (ainda não
  implementada).

## LDU no CAPI (D10)

O Pixel já roda com `fbq('dataProcessingOptions', ['LDU'], 1, 1000)` em todas as páginas. O evento `Lead` do CAPI
(`apps_script_atualizado.gs`, `sendToMetaCAPI`) passa a levar `data_processing_options: ['LDU']`,
`data_processing_options_country: 1`, `data_processing_options_state: 1000`, para os dois canais tratarem o mesmo
evento igual. **Não** reabre a decisão de negócio sobre LDU forçado a todos os visitantes (1, 1000 vs. 0, 0).

## Critérios de pronto

1. `e2e/form-aplicacao.spec.js`: sequência de eventos do fluxo (sem rede), ausência de PII, `FormStart`/
   `ContactCaptured` na fila do `fbq`, `generate_lead` com o `event_id` em `obrigada.html`.
2. `Lead` continua deduplicado (D1/D4 de `pages/formulario.md`).
3. `npm run gate` verde.

## 5. Passos manuais (fora do código)

1. **GA4**: cadastrar dimensões personalizadas de evento (`step_name`, `step_index`, `answer`, `direction`,
   `duration_ms`); marcar `generate_lead` como *key event*; desligar "Interações com formulário" na Medição
   aprimorada (ou ignorá-la); montar a **Exploração de funil** com `form_step_view` → `generate_lead`.
2. **Apps Script** (feito — publicado, confirmado em 2026-09-20): publicar **nova versão da implantação existente** (nunca uma implantação nova — a URL `/exec` está
   fixa em `formulario.html`). Conferir no Events Manager → *Testar eventos* que o `Lead` do servidor chega
   com o LDU e continua deduplicado com o do navegador.
3. **Meta**: validar `FormStart` e `ContactCaptured` no Pixel Helper / Testar eventos; criar os públicos.

## Fora do escopo

Pré-captura do lead no backend (aba `Parciais`, sem CAPI, consentimento), `cta_click` na home, cliques em
Política de Privacidade e no `<details>` da etapa 0, `pagehide`/abandono (lê-se no funil pela última
`form_step_view`).
