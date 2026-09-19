# Fase 5 — Consentimento no rodapé e redução de steps

**Status**: Especificação aguardando implementação

## Objetivo

Remover a pergunta explícita sobre consentimento (step 8) e expressar o consentimento de forma implícita através de uma observação no rodapé da página.

**Ganho**: formulário mais ágil (7 em vez de 8 steps); consentimento ainda presente, mas menos intrusivo — quem chega no botão "Enviar" já passou por todas as perguntas e está ciente do uso dos dados.

## Mudanças

### 1. Frontend (`src/formulario.html`)

#### Remove
- **Step 8** (linhas 814–824 no estado atual):
  ```html
  <div class="step" data-s="7">
    <div class="cf-an" id="an-7" aria-live="off" hidden></div>
    <div class="rg">
      <label class="rl top"><input type="checkbox" name="consentimento" id="consentimento"
              value="Sim"><span><strong>Termo de Consentimento.</strong> Concordo em ser contatado e
              autorizo o uso dos dados apenas para avaliação desta aplicação.</span></label>
    </div>
    <p class="err" id="err-consentimento" aria-live="polite">É necessário aceitar o termo para enviar a
        aplicação.</p>
  </div>
  ```

#### Altera
- **Texto do rodapé** (linhas 838–840):
  - **Antes**:
    ```
    Esta é uma aplicação e não garante o agendamento. As vagas são limitadas. Ao enviar, você concorda com nossa Política de Privacidade.
    ```
  - **Depois**:
    ```
    Esta é uma aplicação e não garante o agendamento. As vagas são limitadas. Ao enviar, você concorda e autorizo com uso dos dados apenas para avaliação desta aplicação e com nossa Política de Privacidade.
    ```

> **Superado**: "Ao **enviar**" virou "Ao **responder**" para sustentar a pré-captura do contato —
> ver [`formulario-envio-parcial.md`](formulario-envio-parcial.md). O rodapé também ganhou o botão
> "Preferências de cookies" ([`cookie-consent.md`](cookie-consent.md)). O restante desta spec continua
> valendo.

### 2. JavaScript (`src/formulario.html` `<script>`)

#### Remove
- **ANALYSIS_SOURCE**: entrada `7: "faturamento_mensal"` (a pergunta de faturamento fica como step 6, a análise dela não precisa de box)
- **Validação de consentimento**: linhas 1071–1074 (a verificação `if (boxes.length === 1 && boxes[0].name === "consentimento" ...)`)

#### Altera
- **Coleta de dados** (função `collect()`, linhas 1170–1196):
  - Altera `d.consentimento = document.getElementById("consentimento").checked;` para `d.consentimento = true;` (linha 1183)
  - O consentimento agora é implícito — sempre `true` para qualquer envio (qualquer um que chega ao botão "Enviar" já passou por todas as perguntas e está ciente)

#### Última etapa não avança sozinha
- `CHOICE_STEPS` passa de `[0, 4, 5, 6]` para `[0, 4, 5]`. Faturamento (etapa 7) é agora a última; se continuasse em `CHOICE_STEPS`, escolher uma faixa enviaria o formulário em 380 ms, sem o clique em "Enviar aplicação" e sem confirmar o aviso do rodapé.
- A última etapa mostra o botão "Enviar aplicação"; o envio exige o clique explícito.
- Efeito colateral aceito: os atalhos de teclado 1–4 continuam selecionando a opção só nas etapas de `CHOICE_STEPS`, então deixam de valer no faturamento.

## Mapa de etapas (antes → depois)

| # | Antes | Depois |
|---|---|---|
| 0 | Maior desafio | Maior desafio |
| 1 | Nome | Nome |
| 2 | WhatsApp | WhatsApp |
| 3 | E-mail | E-mail |
| 4 | Modelo de negócio | Modelo de negócio |
| 5 | Tamanho equipe | Tamanho equipe |
| 6 | Faturamento | Faturamento |
| 7 | Consentimento ✂️ | — (removida) |

## Impacto em outras áreas

- **Apps Script** (`apps_script_atualizado.gs`): **sem mudanças**. A coluna `consentimento` na planilha continuará sendo preenchida com `true` para todos os leads (automaticamente via `d.consentimento = true` no frontend).
- **Meta CAPI**: a deduplicação e tracking continuam funcionando normalmente (o `event_id` segue o mesmo padrão).
- **Analytics (GA4)**: nenhuma mudança necessária.
- **Testes** (`tests/aplicacao.spec.js`): remover a etapa de clique no consentimento; o formulário agora termina em step 6 (Faturamento).

## Contrato visual

- Redução do número de dots indicadores de progresso: de 8 para 7 dots.
- Redução visual em mobile (menos scroll nas abas).
- O texto do rodapé fica um pouco mais longo (será adaptado com `clamp()` se necessário — avaliar contra devices).

## Critérios de pronto

- [x] Step 8 (consentimento) removida do HTML
- [x] Rodapé atualizado com novo texto de consentimento implícito
- [x] Validação de consentimento removida do JS
- [x] Função `collect()` ajustada (consentimento implícito)
- [x] TOTAL e índices de steps recalculados no JS (derivado automaticamente de `.step.length`)
- [x] `npm run gate` passa
- [x] Testes de formulário atualizados (se houver)
- [x] Nenhuma divergência entre spec e implementação

## Notas

- A coluna `consentimento` na planilha (Apps Script) pode virar um booleano fixo (`true`) ou ser removida conforme a decisão do negócio.
- O texto "Ao enviar, você concorda e autorizo" é a copy da Talita (Fase 3, mas agora aplicada aqui). Se houver ajuste na redação, avisar antes de mergear.
