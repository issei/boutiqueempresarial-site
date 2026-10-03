# Agendamento na tela de obrigado — Spec de design

*   **Status**: v1.1 (2026-10-03): o toggle do CRM comanda a jornada (§4); a rota `link` é a da Spec 021 do CRM (OpenAPI 1.1.0). Implementada localmente em 2026-10-02 (cartão, módulo e testes com a API simulada). **Depende da rota `POST /public/agendamento/link` do CRM, que ainda não existe**: enquanto ela não estiver no ar, o cartão mostra o estado Fallback (§4). Sem `/design-sync` nesta rodada (ver §9).
*   **Arquivos**: `src/obrigada.html`, `src/js/obrigada-agendar.js`, `tests/obrigada.spec.js`, `tests/fixtures/agendar/link.json`, `scripts/preview-obrigada.mjs`, `e2e/form-aplicacao.spec.js` (asserts do cartão), docs.
*   **Relacionados**: `pages/agendar.md` (página de destino), `pages/aplicacao-conversacional.md` §6 (fechamento personalizado), `STYLE_GUIDE.md`, `HARNESS_AEO.md` §B5/§B6, `adr-e2e-nao-enviar-formulario-para-producao.md`; no CRM, Spec 017.

## 1. Objetivo

Depois de enviar a aplicação, o lead ainda está engajado. A tela de obrigado oferece, ali mesmo, o botão para escolher o horário do Diagnóstico Gratuito, em vez de depender só do e-mail com o link. A página `/agendar` continua sendo quem agenda; o cartão só entrega o link pessoal.

## 2. Restrições vindas do código

*   O CRM responde ao Apps Script só com `{id, resultado}` e o formulário envia em `no-cors` (resposta opaca): o navegador **não recebe token** no envio. Por isso a obrigada o **troca** pelo `event_id` (já na URL como `?eid=` e em `localStorage.ld`) numa rota pública do CRM (§5).
*   O `event_id` não é segredo (circula em URL, Pixel e CAPI). Quem manda no risco é o CRM (§5, salvaguardas); o site nunca usa o `event_id` como credencial de nada além dessa troca.
*   A conversão (Pixel `Lead`, GA4 `generate_lead`) **não pode depender do cartão**: o módulo é independente e uma falha da API não altera nenhum evento.
*   Token nunca em `dataLayer`, `console`, URL da obrigada nem evento de Pixel/GA4. Vive só no `href` do botão (sem storage: a troca é idempotente, recarregar repete a chamada).
*   Sem `eid` (acesso direto, crawl, `?eid=` malformado): cartão não renderiza e nenhuma requisição sai.
*   Sem evento novo de analytics (`agendar.md` §9 adia a conversão de agendamento).

## 3. Layout

Ordem: logo → H1 de confirmação (personalizado por `be_perfil`) → filete → fechamento → **cartão** → nota. Coluna de 500 px, centrada, como hoje.

*   Cartão `#fff` sobre o creme, borda `1px #E5E5E5`, filete superior de **2 px em `--gold-subtle`**, `border-radius: 2px` (o raio de `agendar.html`), sem sombra, texto alinhado à esquerda.
*   Kicker em Inter, caixa-alta, `--gold-text` (`#886829`). **O ouro `#C5A059` nunca carrega texto** (2.20:1); só o filete.
*   H2 em Playfair; apoio em Inter (o `body` desta página é Playfair, o cartão volta ao Inter do `STYLE_GUIDE.md`).
*   Botão: `#1f1f1f` / texto branco, 48 px de altura mínima, largura total até 480 px, foco `2px --gold-text`.
*   Estados numa região `aria-live="polite"` com `aria-busy`; **o foco não se move** (o visitante não agiu).
*   Movimento: fade de 200 ms ao aparecer o botão, só sob `prefers-reduced-motion: no-preference`.

## 4. Estados e copy

Copy escrita pelo agente `copy-writer` (vocabulário `HARNESS_AEO.md` §B6). **Pendente de revisão da autora.**

| Estado | Quando | Conteúdo |
| :-- | :-- | :-- |
| Preparando | a troca está em andamento | esqueleto + "Preparando o seu link de agendamento..." |
| Pronto | `200 {token}` | kicker "Próximo passo"; H2 "Escolha o dia e o horário do seu Diagnóstico Gratuito"; "A conversa acontece por Google Meet. Ao confirmar, o convite chega ao seu e-mail."; botão **Escolher horário** → `/agendar.html#t=<token>`; "Também enviamos o link por e-mail." |
| Obrigada de sempre (v1.1, substitui o Fallback) | `409 agendamento_desligado` (toggle `ativo` desligado no CRM) e qualquer outra resposta, rede, timeout ou tentativas esgotadas | sem cartão: a obrigada de antes do agendamento, com a nota "Suas informações são confidenciais. Retornaremos em até 48h úteis via WhatsApp/E-mail caso sua aplicação seja aprovada." (`#nota-legado`, visível por padrão: sem JS, sem `eid` ou com a API fora). O Fallback antigo ("O link foi enviado ao seu e-mail") saiu porque seria falso com o envio de e-mail desligado |

**Toggle (v1.1)**: `ativo` desligado = obrigada de sempre; `ativo` ligado = cartão. Dentro do cartão, `envio_email` (campo da resposta de `link`) liga a linha "Também enviamos o link por e-mail." e o trecho "O e-mail de agendamento vai para o endereço informado na aplicação." da nota; desligado, nenhuma tela promete e-mail.

Outros textos da página: `<title>` "Aplicação Recebida | Boutique Empresarial"; description "Recebemos a sua aplicação ao Diagnóstico Gratuito da Boutique Empresarial. Escolha o dia e o horário da conversa por Google Meet."; nota final "Suas informações são confidenciais. O e-mail de agendamento vai para o endereço informado na aplicação."

**Conflitos de copy para a autora decidir**: (a) a nota antiga prometia "48h úteis ... caso sua aplicação seja aprovada"; saiu, porque contradiz agendar na hora e promete prazo; (b) o rodapé do formulário diz "não garante o agendamento" (`formulario.html`), o que contém o verbo proibido "garante" numa negação e convive mal com o botão; sugestão: "o agendamento depende da nossa confirmação"; (c) a nota antiga citava WhatsApp, a nova só o e-mail, porque o contato alternativo do site é só e-mail. O texto do formulário **não foi alterado** nesta rodada.

## 5. Handoff ao CRM (proposta; implementação no repositório do CRM)

`POST https://api.boutiqueempresarial.com.br/public/agendamento/link`, corpo `{"event_id":"<uuid>"}`, `credentials: 'omit'`, mesmo CORS da API pública.

| Resposta | Significado | Cartão |
| :-- | :-- | :-- |
| `200 {"token":"...","envio_email":bool}` | lead existe, completo e agendável | Pronto (com ou sem a frase do e-mail) |
| `202 {}` | o CRM ainda não gravou o lead (o Apps Script repassa depois do envio) | repete |
| `409 agendamento_desligado` | toggle desligado no CRM | obrigada de sempre |
| `404`, `409 lead_nao_agendavel`, `410`, `429`, `503`, rede, timeout | outros casos | obrigada de sempre |

*   O site repete até **6 vezes, a cada 2 s** em `202` (teto de ~12 s, mais o timeout de 10 s por tentativa), e então cai no Fallback.
*   Como o token é HMAC recomputável sem armazenamento (Spec 017 §5.6), a troca é **idempotente**; recarregar a obrigada devolve o mesmo token.
*   **Salvaguardas pedidas**: janela curta de troca (sugestão ≤ 30 min após `criado_em`), só para lead com `cadastro_completo`, limite por IP e por `event_id`, `404` indistinguível. A troca expõe só o que o token já expõe (primeiro nome e agendamento).
*   A Spec 017 §2 lista "link na `obrigada.html`" como fora de escopo: precisa de emenda e de card próprio no CRM.
*   **Ordem de implantação segura**: sem a rota (ou com `ativo` desligado) a resposta é `404`/`503` e o cartão cai no Fallback; o site pode ir ao ar antes do CRM.
*   `tests/fixtures/agendar/link.json` é **proposta nossa, não do OpenAPI**: reconferir contra o OpenAPI do CRM quando a rota existir.

## 6. Critérios de pronto

1.  `npm run gate` verde.
2.  Pronto: o botão tem `href` exatamente `/agendar.html#t=<token>`, com o rótulo "Escolher horário".
3.  `202` seguido de `200` chega a Pronto; `202` repetido até esgotar e todas as respostas da §5 caem no Fallback, sem botão.
4.  Sem `eid`: nenhuma requisição à API e nenhum cartão.
5.  O token não aparece na URL da obrigada, no `dataLayer` nem em requisição ao Pixel/GA4; Pixel `Lead` e `generate_lead` seguem disparando com a API fora do ar.
6.  axe sem `serious`/`critical` em Preparando, Pronto e Fallback; sem rolagem horizontal em 375 px.
7.  Copy sem os termos proibidos do §B6.
8.  Nenhum teste alcança `api.boutiqueempresarial.com.br` nem `script.google.com` de verdade (ADR).

## 7. Como validar o visual localmente

```bash
npm run dev                                    # em um terminal (porta 5173)
node scripts/preview-obrigada.mjs pronto       # em outro; abre o Chromium visível
```

Cenários: `pronto`, `preparando` (a API nunca responde), `fallback` (API fora do ar), `sem-eid`. Acrescente `--mobile` para 375 px e `--captura` para salvar PNG em `test-results/preview-obrigada/` em vez de manter a janela aberta. O script grava `be_perfil` e o consentimento, simula a API e **vai direto à obrigada: nunca submete o formulário** nem alcança produção.

## 8. Fora de escopo

Conversão de agendamento no Pixel/GA4; seletor de horário embutido na obrigada; alterar o texto do formulário; qualquer alteração no CRM a partir deste repositório.

## 9. Divergências e notas da implementação

*   **`/design-sync` não rodado**: grava no projeto do Claude Design e só deve ser iniciado pelo usuário. Rodar antes da próxima rodada de design (regra 1 do `CLAUDE.md`).
*   `href` usa `/agendar.html#t=` (e não `/agendar#t=` do e-mail): o servidor de desenvolvimento do Vite não reescreve `/agendar`, e o `.html` funciona igual na CloudFront.
*   O logo estava alinhado à esquerda da coluna (o preflight do Tailwind o torna `display:block`, e `text-align:center` não o alcança); ganhou `margin: 0 auto`.
*   `<div class="c">` interno, aberto e nunca fechado dentro do `<main>`, foi removido.
