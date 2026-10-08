# Agendamento na tela de obrigado — Spec de design

*   **Status**: v1.3 (2026-10-08): estado "em análise" para lead de perfil indefinido (§4, §5), contrato `link` do CRM 1.2.0 (Spec 023). v1.2 (2026-10-07): o seletor de dias e horários aparece **dentro do cartão**, sem o botão "Escolher horário" (§1, §3, §4), e o termo da jornada passa a ser "Diagnóstico Operacional". v1.1 (2026-10-03): o toggle do CRM comanda a jornada (§4); a rota `link` é a da Spec 021 do CRM (OpenAPI 1.1.0). Implementada localmente em 2026-10-02 (cartão, módulo e testes com a API simulada). **Depende da rota `POST /public/agendamento/link` do CRM, que ainda não existe**: enquanto ela não estiver no ar, o cartão mostra o estado Fallback (§4). Sem `/design-sync` nesta rodada (ver §9).
*   **Arquivos**: `src/obrigada.html`, `src/js/obrigada-agendar.js`, `tests/obrigada.spec.js`, `tests/fixtures/agendar/link.json`, `scripts/preview-obrigada.mjs`, `e2e/form-aplicacao.spec.js` (asserts do cartão), docs.
*   **Relacionados**: `pages/agendar.md` (página de destino), `pages/aplicacao-conversacional.md` §6 (fechamento personalizado), `STYLE_GUIDE.md`, `HARNESS_AEO.md` §B5/§B6, `adr-e2e-nao-enviar-formulario-para-producao.md`; no CRM, Spec 017.

## 1. Objetivo

Depois de enviar a aplicação, o lead ainda está engajado. A tela de obrigado oferece, ali mesmo, os dias e horários do Diagnóstico Operacional para escolher na hora, sem o passo extra do botão. O seletor é o mesmo de `/agendar` (`src/js/agendador.js`, markup em `src/partials/agendador.html`, CSS em `src/agendador.css`); a obrigada só troca o `event_id` pelo token e o entrega ao módulo, em memória. A página `/agendar` segue existindo para quem chega pelo e-mail.

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
*   Seletor (v1.2): as regras de `.agendador` (opções de dia/horário, botões, avisos) valem nas duas páginas; o H2 do cartão (`[data-ag-titulo]`) acompanha o estado do seletor e o `Confirmar` fica desabilitado até haver dia e horário. As `section` do seletor zeram o `padding` de 100px que `style.css` dá a toda `section`.
*   Estados numa região `aria-live="polite"` com `aria-busy`; **o foco não se move ao carregar** (o visitante não agiu): no modo embutido o foco só vai ao título depois do primeiro clique ou escolha, como em `/agendar`.
*   Movimento: fade de 200 ms ao aparecer o seletor, só sob `prefers-reduced-motion: no-preference`.

## 4. Estados e copy

Copy escrita pelo agente `copy-writer` (vocabulário `HARNESS_AEO.md` §B6). **Pendente de revisão da autora.**

| Estado | Quando | Conteúdo |
| :-- | :-- | :-- |
| Preparando | a troca está em andamento | esqueleto + "Preparando o seu link de agendamento..." |
| Pronto (v1.2) | `200 {token}` | kicker "Próximo passo"; o seletor de `/agendar` embutido (H2 "Escolha o melhor horário para o seu Diagnóstico Operacional", dias, horários, **Confirmar horário**, "Nenhum horário funciona para mim", confirmado, erro); "Também enviamos o link por e-mail." só com `envio_email`. Sem horários ou falha de `slots`: o estado de erro do seletor, com o contato alternativo, dentro do cartão |
| Em análise (v1.3) | `200 {em_analise: true, envio_email}` sem `token` (lead com "Outro" em modelo de negócio e em maior problema; Spec 023 do CRM) | sem cartão e sem seletor; nota "Suas informações são confidenciais. Vamos analisar a sua aplicação. Depois da análise, entramos em contato para combinar o agendamento do seu Diagnóstico Operacional." (`#nota-analise`); só com `envio_email`, acrescenta "Enviamos a confirmação do cadastro para o e-mail informado." (`#nota-analise-email`). Nenhuma chamada a `slots` |
| Obrigada de sempre (v1.1, substitui o Fallback) | `409 agendamento_desligado` (toggle `ativo` desligado no CRM) e qualquer outra resposta, rede, timeout ou tentativas esgotadas | sem cartão: a obrigada de antes do agendamento, com a nota "Suas informações são confidenciais. Retornaremos em até 48h úteis via WhatsApp/E-mail caso sua aplicação seja aprovada." (`#nota-legado`, visível por padrão: sem JS, sem `eid` ou com a API fora). O Fallback antigo ("O link foi enviado ao seu e-mail") saiu porque seria falso com o envio de e-mail desligado |

**Toggle (v1.1)**: `ativo` desligado = obrigada de sempre; `ativo` ligado = cartão. Dentro do cartão, `envio_email` (campo da resposta de `link`) liga a linha "Também enviamos o link por e-mail." e o trecho "O e-mail de agendamento vai para o endereço informado na aplicação." da nota; desligado, nenhuma tela promete e-mail.

Outros textos da página: `<title>` "Aplicação Recebida | Boutique Empresarial"; description "Recebemos a sua aplicação ao Diagnóstico Operacional da Boutique Empresarial. Escolha o dia e o horário da conversa por Google Meet."; nota final "Suas informações são confidenciais. O e-mail de agendamento vai para o endereço informado na aplicação."

**Conflitos de copy para a autora decidir**: (a) a nota antiga prometia "48h úteis ... caso sua aplicação seja aprovada"; saiu, porque contradiz agendar na hora e promete prazo; (b) o rodapé do formulário diz "não garante o agendamento" (`formulario.html`), o que contém o verbo proibido "garante" numa negação e convive mal com o botão; sugestão: "o agendamento depende da nossa confirmação"; (c) a nota antiga citava WhatsApp, a nova só o e-mail, porque o contato alternativo do site é só e-mail. O texto do formulário **não foi alterado** nesta rodada.

## 5. Handoff ao CRM (proposta; implementação no repositório do CRM)

`POST https://api.boutiqueempresarial.com.br/public/agendamento/link`, corpo `{"event_id":"<uuid>"}`, `credentials: 'omit'`, mesmo CORS da API pública.

| Resposta | Significado | Cartão |
| :-- | :-- | :-- |
| `200 {"token":"...","envio_email":bool}` | lead existe, completo e agendável | Pronto (com ou sem a frase do e-mail) |
| `200 {"em_analise":true,"envio_email":bool}` | perfil indefinido, sem link liberado (sem token) | Em análise (nota; com ou sem a frase do e-mail) |
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
2.  Pronto: os dias aparecem sem clique, não existe o botão "Escolher horário", a obrigada chama `link` e depois `slots` (com o token só no corpo) e reservar acontece sem sair da obrigada.
3.  `202` seguido de `200` chega a Pronto; `202` repetido até esgotar e todas as respostas da §5 caem no Fallback, sem seletor.
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

Conversão de agendamento no Pixel/GA4; renome do termo fora desta jornada (home, formulário, privacidade); alterar o texto do formulário; qualquer alteração no CRM a partir deste repositório.

## 9. Divergências e notas da implementação

*   **`/design-sync` não rodado**: grava no projeto do Claude Design e só deve ser iniciado pelo usuário. Rodar antes da próxima rodada de design (regra 1 do `CLAUDE.md`).
*   `href` usa `/agendar.html#t=` (e não `/agendar#t=` do e-mail): o servidor de desenvolvimento do Vite não reescreve `/agendar`, e o `.html` funciona igual na CloudFront.
*   O logo estava alinhado à esquerda da coluna (o preflight do Tailwind o torna `display:block`, e `text-align:center` não o alcança); ganhou `margin: 0 auto`.
*   `<div class="c">` interno, aberto e nunca fechado dentro do `<main>`, foi removido.
*   **v1.2, seletor embutido**: `agendar.js` virou uma linha que chama `iniciarAgendador`; a lógica foi para `agendador.js` e o markup das telas (carregando, escolha, confirmado, sem horário, erro) para `partials/agendador.html` (importado com `?raw`, montado por JS: `/agendar` já exigia JS). `#titulo`/`#anuncio` viraram `[data-ag-titulo]`/`[data-ag-anuncio]`; o `aria-busy` passou de `#conteudo` para `#agendador`.
*   **Efeito colateral em /agendar**: o `padding` de 100px das `section` (de `style.css`) foi zerado também lá; as telas ficam mais juntas do título.
*   O token continua só em memória na obrigada (parâmetro de `iniciarAgendador`); `/agendar` segue lendo-o da `sessionStorage`.
*   Termo: "Diagnóstico Gratuito" virou "Diagnóstico Operacional" só nesta jornada (obrigada, agendar, testes e specs); o restante do site mantém o termo antigo até decisão da autora.
*   **v1.3, em análise**: a decisão é só do CRM (o site não calcula perfil); `be_perfil` segue sendo apenas renderização do fechamento. A copy é proposta nossa, pendente de revisão da autora. Lead liberado pela vendedora dentro da janela de 2 h volta a receber `token` e vê o seletor ao recarregar.
