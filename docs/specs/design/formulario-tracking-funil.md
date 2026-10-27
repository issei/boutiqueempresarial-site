# Rastreamento do funil do formulário (GA4 + Meta Pixel) e LDU no CAPI

**Status**: Implementada ([PR #25](https://github.com/issei/boutiqueempresarial-site/pull/25)) — o passo 2 de §5 (Apps Script) está feito; os passos 1 e 3 (GA4 e Meta) seguem manuais e não verificáveis pelo repositório

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

## Emenda — dois caminhos (`formulario-dois-caminhos.md`)

*   **`path`** (`empresario` | `gerente`) vai em **todos** os eventos `form_*`, a partir do momento em que a posição é escolhida. O `form_step_view` de `init` (etapa da posição) não tem `path`; o `form_answer` da própria posição já tem. O Pixel (`FormStart`, `ContactCaptured`, `Lead`) não muda.
*   **`step_name`** continua sendo o `name` do primeiro campo da etapa. A lista ganha `posicao` (1ª etapa) e, no gerente, `vinculo`, `pessoas_lideradas`, `maior_desafio_gerente` e `objetivo_12m`.
*   **Mudança de significado de `step_index`**: passa a ser o índice na **sequência ativa** (começa em 0), e a posição é sempre 0. Empresário e gerente têm ordens diferentes, então o mesmo índice não é a mesma etapa nos dois caminhos; para comparar etapas use `step_name`. Séries anteriores à emenda não têm a etapa da posição: o índice antigo 0 (`maior_problema_gestao`) é o 1 do empresário agora.
*   Nenhum evento leva contato nem o texto livre dos campos "Outro".
*   **Passo manual (GA4)**: assim como as dimensões de §5, `path` precisa ser registrada como dimensão personalizada de escopo Evento para aparecer em relatórios e Explorações; a Exploração de funil fica uma por caminho, com as etapas na ordem de cada sequência.
*   CAPI: `custom_data.lead_caminho` (D6); ver `pages/formulario.md` §3.1.

Cobertura: `e2e/form-aplicacao.spec.js` (sequência de eventos do empresário e "critério 7" do gerente).

## Critérios de pronto

1. `e2e/form-aplicacao.spec.js`: sequência de eventos do fluxo (sem rede), ausência de PII, `FormStart`/
   `ContactCaptured` na fila do `fbq`, `generate_lead` com o `event_id` em `obrigada.html`.
2. `Lead` continua deduplicado (D1/D4 de `pages/formulario.md`).
3. `npm run gate` verde.

## 5. Passos manuais (fora do código)

1. **GA4** (Administrador → Exibição de dados → Definições personalizadas), antes de o tráfego chegar — dados
   coletados antes do cadastro não ganham a dimensão depois:
   - **dimensões** personalizadas, escopo Evento: `step_name`, `step_index`, `answer`, `direction`;
   - **métrica** personalizada, escopo Evento, unidade milissegundos: `duration_ms` (é número, não dimensão);
   - marcar `generate_lead` como *key event*;
   - desligar "Interações com formulário" na Medição aprimorada (ou ignorá-la);
   - retenção de dados de eventos em 14 meses (o padrão de 2 limita as Explorações);
   - filtro de tráfego interno, para os testes da equipe não poluírem o funil;
   - **Exploração de funil**: etapas `form_step_view` com `step_name` = cada etapa, na ordem, terminando em
     `generate_lead`, com funil fechado.
2. **Apps Script** (feito — publicado, confirmado em 2026-09-20): publicar **nova versão da implantação existente** (nunca uma implantação nova — a URL `/exec` está
   fixa em `formulario.html`). Conferir no Events Manager → *Testar eventos* que o `Lead` do servidor chega
   com o LDU e continua deduplicado com o do navegador.
3. **Meta**: validar `FormStart` e `ContactCaptured` no Pixel Helper / Testar eventos; criar os públicos.

## Fora do escopo

Pré-captura do lead no backend (aba `Parciais`, sem CAPI, consentimento), `cta_click` na home, cliques em
Política de Privacidade e no `<details>` da etapa 0, `pagehide`/abandono (lê-se no funil pela última
`form_step_view`).
