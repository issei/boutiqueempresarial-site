# Agendar: data, botão desabilitado e "Nenhum horário funciona para mim" — Spec de design

*   **Status**: (2026-10-07: o seletor, incluindo "Nenhum horário funciona para mim", também roda embutido na obrigada, via `src/js/agendador.js`.) Implementada localmente em 2026-10-03 (testes com a API simulada). **Depende do CRM** (Spec 021, OpenAPI 1.1.0): rotas `sem-horario` e `link`. Sem `/design-sync` nesta rodada (ver §8).
*   **Origem**: handoff `Recriação de telas do site.zip` (`Agendar.dc.html` + README), do Claude Design.
*   **Arquivos**: `src/agendar.html`, `src/js/agendar.js`, `src/obrigada.html`, `src/js/obrigada-agendar.js`, `tests/agendar.spec.js`, `tests/obrigada.spec.js`, `e2e/agendar.spec.js`, `e2e/form-aplicacao.spec.js`, `tests/fixtures/agendar/`, `scripts/preview-obrigada.mjs`.
*   **Relacionados**: `pages/agendar.md` (§6.2, §6.7), `design/obrigada-agendamento.md`, `STYLE_GUIDE.md`; no CRM, Spec 021.

## 1. Objetivo

Três ajustes em `/agendar` e o controle da jornada pelo toggle do CRM:

1. Dia no formato `06/10, terça-feira`.
2. **Confirmar horário** desabilitado até haver dia e horário.
3. Botão **Nenhum horário funciona para mim**, que leva ao estado `sem-horario` e avisa o CRM (a vendedora vê na timeline do lead; com o envio ligado o lead recebe o link por e-mail).
4. O toggle do CRM comanda a jornada: `ativo` desligado = obrigada de sempre; `ativo` ligado = cartão de agendamento; `envio_email_ativo` desligado = nenhuma tela promete e-mail.

## 2. Comportamento

*   **Data**: `DD/MM, dia da semana por extenso` (`diaExtenso`), também em "Diagnóstico agendado para 06/10, terça-feira, às 14h" e "Horário atual: …". Fuso sempre o da API.
*   **Confirmar**: `disabled` + `aria-disabled="true"`, `opacity: .45`, `cursor: not-allowed`, `transition: opacity .2s` (padrão de `.rl.dis` em `formulario.html`) enquanto faltar dia ou horário. Trocar o dia zera a hora. O `aria-disabled` de envio em andamento (`.75`, `progress`) segue reservado ao "Confirmando…". No modo remarcar vale a mesma regra para "Confirmar novo horário".
*   **Nenhum horário funciona para mim**: secundário (`.ag-btn`), em `.ag-acoes`, à direita de Confirmar. Visível sem seleção completa, oculto com dia e horário, **ausente no modo remarcar**. Durante a chamada mostra "Enviando…" com `aria-disabled`.
*   **`sem-horario`**: `mostrar('sem-horario', …)` (foco no h1, anúncio). h1 "Combinado, vamos encontrar outro horário". A copy vem de `email_enviado` na resposta: `true` = e-mail + contato da Talita; `false` = só o contato da Talita. "Ver os horários de novo" volta à escolha com dia e hora zerados (`carregar()`).
*   **Erro** da rota: `classificar()` + `mostrarErro()`; "Tentar novamente" reaproveita a `Idempotency-Key`.
*   **Obrigada**: `409 agendamento_desligado` (e qualquer falha) volta à obrigada de sempre, sem cartão (`design/obrigada-agendamento.md` §4). `envio_email` liga a frase "Também enviamos o link por e-mail." e o trecho do e-mail na nota.

## 3. Handoff ao CRM

Implementado no CRM, Spec 021: `POST /public/agendamento/sem-horario` (`{token}` + `Idempotency-Key` → `{email_enviado}`) e `POST /public/agendamento/link` (`{event_id}` → `{token, envio_email}` | `202` | `409 agendamento_desligado`). Fixtures em `tests/fixtures/agendar/` copiam os exemplos do OpenAPI 1.1.0 (`VERSION`).

## 4. Critérios de pronto

1.  `npm run gate` verde.
2.  Data no formato novo em escolha, confirmado e remarcar.
3.  Confirmar desabilitado sem dia e horário, habilitado com os dois, desabilitado de novo ao trocar o dia.
4.  "Nenhum horário funciona…" visível sem seleção completa, oculto com ela, ausente em remarcar.
5.  `sem-horario` com `email_enviado` true e false (copy certa), erro com mesma `Idempotency-Key`, clique duplo com uma só requisição, "Ver os horários de novo" zera a seleção.
6.  axe sem `serious`/`critical` nos dois estados novos; foco no h1.
7.  Obrigada: `link` `409 agendamento_desligado` e demais falhas mostram a obrigada de sempre; `envio_email` false não cita e-mail.

## 5. Fora de escopo

Evento de analytics `agendar_sem_horario` (o README do design sugere; `agendar.md` §9 adia analytics de agendamento); canal da Talita (WhatsApp ou e-mail, pergunta 3 do README: o texto fica genérico); limite por IP no `link` (CRM).

## 6. Divergências entre handoff e implementação

*   O README do handoff pede o botão em `.ag-acoes` "à direita" e oculto em remarcar: feito. A pergunta em aberto 2 (aparecer em remarcar) foi respondida como "não", como no design.
*   O texto do estado `sem-horario` do handoff afirma sempre o e-mail; a implementação só o afirma quando o CRM confirma o envio (`email_enviado`), por causa do toggle de e-mail.
*   O handoff reverte a regra da `agendar.md` v1.1 ("Confirmar nunca desabilitado"); a spec foi atualizada (v1.2).
*   `description` da obrigada voltou a ser neutra (não cita escolher horário), porque o cartão depende do toggle.

## 7. Como validar o visual

```bash
npm run dev
node scripts/preview-obrigada.mjs pronto|pronto-sem-email|legado|preparando|sem-eid [--mobile] [--captura]
```

`/agendar` com a API simulada: `npx playwright test e2e/agendar.spec.js`.

## 8. Notas

*   **`/design-sync` não rodado** (regra 1 do `CLAUDE.md`): grava no projeto do Claude Design e só o usuário o inicia. O handoff já veio do Claude Design. Rodar antes da próxima rodada de design.
