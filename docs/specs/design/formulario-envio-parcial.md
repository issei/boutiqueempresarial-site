# Pré-captura do contato no formulário (envio parcial)

**Status**: Implementada (PR #27); Apps Script publicado (confirmado em 2026-09-20)

## Problema

O lead só chegava ao backend no último passo. Quem respondia nome, WhatsApp e e-mail e desistia nas três
perguntas de qualificação (modelo de negócio, tamanho da equipe, faturamento) desaparecia — mesmo tendo
deixado o contato.

## Solução

Assim que os três campos de contato ficam válidos, o formulário dispara **um** POST extra com
`parcial: true`. O backend grava numa aba separada e sai antes do CAPI e do e-mail.

### Front — `src/formulario.html`

- O `fetch` que já existia saiu de `submit()` para `post(payload)`. `submit()` só mudou a chamada.
- `sendPartial()` chama `collect()`, marca `parcial: true` e posta. **Fire-and-forget**: sem `sending`,
  sem botão, sem `alert`. Uma falha aqui não pode atrapalhar quem ainda está preenchendo — o envio final
  é o que conta.
- Gatilho: o mesmo ponto de `form_contact_captured` em `nav()` — a primeira vez que `contactOk()` passa.
  A condição é "os três válidos", não um índice de etapa, seguindo o padrão do arquivo de derivar tudo de
  `steps.length`.
- Dispara **uma vez por carregamento** (flag `captured`). Voltar e avançar de novo não reenvia.

### Backend — `apps_script_atualizado.gs`

- `doPost` sai cedo: `if (data.parcial === true) return savePartialLead(data);`
- `ensureSheet(name, headers)` ganhou parâmetros com default para os valores atuais. Chamadores antigos
  seguem idênticos, e a aba `Respostas` **não** é tocada (nenhuma coluna nova — o arquivamento por
  renomeação de `ensureSheet` continua valendo só para divergência real de cabeçalho).
- `savePartialLead()` grava em `Parciais` só o que existe nesse momento: data, `event_id`, nome, e-mail,
  WhatsApp, maior desafio (+ outro), UTMs, página e referrer.
- O caminho completo passou a gravar `done_<event_id>` no cache após `saveToSheet`.

### Guardas (todas por `event_id`, todas best-effort)

| Chave | Impede |
| :-- | :-- |
| `done_<id>` | pré-captura atrasada gravar alguém que já aplicou (rede lenta, cold start) |
| `partial_<id>` | pré-captura repetida da mesma sessão |

`CacheService` evicta sem garantia, então a proteção é *best-effort* — o mesmo teto já aceito em
`notifyNewLead`. Sem `event_id` as duas ficam desligadas: falta de chave não pode custar o lead.

## Decisões

**`Respostas` continua só com aplicação completa.** Parciais vão para outra aba, não para a mesma com uma
coluna de status: `ensureSheet` arquivaria a aba de produção por renomeação ao ver cabeçalho divergente,
quebrando fórmulas, filtros e integrações apontadas para `Respostas`.

**A pré-captura não chama o CAPI.** Um `Lead` server-side antes da qualificação muda o significado do
evento e passa a otimizar a campanha para "deu o contato" em vez de "aplicou". O Pixel
`ContactCaptured` (`trackCustom`) já cobre o público de remarketing, sem contaminar a conversão.

**A pré-captura não dispara e-mail.** Avisar a equipe sobre quem ainda está preenchendo é ruído. A guarda
`notify_<event_id>` de `notifyNewLead` segue intacta e o e-mail do lead completo continua saindo.

**Consentimento: o payload parcial vai com `consentimento: true`,** porque o rodapé passou de
"Ao **enviar**, você concorda" para "Ao **responder**, você concorda" e esse texto está visível em todas
as etapas, fora dos steps. Quem respondeu já consentiu. Atualiza
[`formulario-fase5-rodape-consentimento.md`](formulario-fase5-rodape-consentimento.md).

**Linha parcial não é apagada quando o lead completa.** `Parciais` pode conter quem depois aplicou;
reconciliar por `event_id` (ou e-mail/telefone, se a pessoa recarregou a página e gerou outro `event_id`).
Limpar exigiria varredura da planilha a cada POST.

## Critérios de pronto

1. Fluxo completo gera **dois** POSTs: `parcial: true` com o contato, depois o completo sem a flag, com o
   mesmo `event_id`.
2. Abandono depois do e-mail gera **um** POST, e voltar/avançar não gera outro.
3. O parcial não leva modelo de negócio, equipe nem faturamento — as perguntas ainda não foram feitas.
4. `npm run gate` verde.

Suíte: `e2e/form-aplicacao.spec.js`.

## Ordem de deploy — obrigatória

**Apps Script antes do front.** Um backend sem `savePartialLead` trataria a pré-captura como lead
completo: linha em `Respostas`, e-mail para a equipe e `Lead` no CAPI. Publicar em *Gerenciar implantações
→ editar a implantação existente → Nova versão*; nunca uma implantação nova, porque a URL `/exec` está
fixa em `formulario.html`.

Depois do deploy, rodar `testEnsureSheet()` (cria `Parciais`) e `testSavePartialLead()` no editor, e
conferir: 1 linha em `Parciais`, nenhuma em `Respostas`, nenhum e-mail.

## Fora do escopo

Aviso por e-mail de lead parcial (exigiria trigger com atraso para não virar ruído), limpeza da linha em
`Parciais` quando o lead completa, reenvio ao editar o contato depois de voltar.
