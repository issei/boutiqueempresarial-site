# SDD — Formulário de Aplicação, Fase 5: fluxo conversacional com diagnóstico espelhado

*   **Status**: Implementado
*   **Arquivos afetados**: `src/formulario.html`, `src/obrigada.html`, `e2e/form-aplicacao.spec.js`, `tests/a11y.spec.js`
*   **Não afetados**: `apps_script_atualizado.gs` (contrato de dados inalterado — ver §3)
*   **Contrato de dados**: `docs/specs/pages/formulario.md` §3 permanece a fonte da verdade. Esta fase **não** cria, renomeia ou remove chave alguma
*   **Continuação de**: `docs/specs/formulario-fase4-ajustes.md`
*   **Referência visual**: protótipo HTML `ConversationalForm` (Boutique Empresarial Design System) — referência de aparência e comportamento, **não** código de produção. Todos os valores necessários estão transcritos em §5

---

## 1. Objetivo

Converter o formulário de 8 etapas de um questionário sequenciado em uma **sessão de diagnóstico conversacional**: a cada avanço o formulário devolve ao respondente uma leitura da resposta anterior, e a página de obrigado entrega um fechamento escrito para a combinação específica de desafio, modelo, time e faturamento.

A hipótese é de conclusão, não de captação: o funil já qualifica, mas 8 etapas sem devolutiva parecem burocracia. Devolver análise a cada passo transforma o preenchimento em amostra do serviço.

**Preservado integralmente**: as 8 etapas e a ordem da Fase 4, as chaves JSON congeladas, o rastreamento (D1/D2/D9 corrigidos), o consentimento LGPD real (D3), a deduplicação Pixel↔CAPI (D4), o transporte `text/plain` + `keepalive`, e o `noindex` da página (`HARNESS_AEO.md` §6.1).

## 2. Metacognição — auditoria do protótipo contra o contrato vigente

O protótipo foi desenhado sem o spec em mão e divergiu dele em três pontos. Nenhum é estético; dois quebram correções já pagas em fases anteriores.

| # | Divergência do protótipo | Conflito | Decisão |
| :-- | :--- | :--- | :--- |
| P1 | 6 perguntas: `email` ausente | `email` é chave **congelada** (`formulario.md` §3.1) e entrada de `sendToMetaCAPI()` (`em`, SHA-256). A Fase 4 decidiu explicitamente "E-mail: mantém, na posição atual". Sem ele o EMQ cai e a correção de D2 perde metade do efeito | **Rejeitada.** O fluxo conversacional tem 8 etapas, não 6 |
| P2 | Checkbox de consentimento ausente | Reintroduz D3 (consentimento falso, LGPD Art. 8º §1º), corrigido na Fase 3. Além disso o CAPI **só dispara com `consentimento === true`** — sem ele, nenhum lead chega ao Meta | **Rejeitada.** Consentimento permanece na última etapa, adjacente ao botão de envio |
| P3 | Conclusão renderizada na própria página | `obrigada.html` é onde `fbq('track','Lead', {}, {eventID})` dispara (critério de aceite 7 da `formulario.md`). Concluir dentro de `formulario.html` sem navegar deixa o Pixel sem evento | **Rejeitada.** A conclusão personalizada renderiza em `obrigada.html` — ver §6 |

### 2.1 O que o protótipo contribui, e que o contrato atual não tem

| Item | Estado hoje | Fase 5 |
| :-- | :--- | :--- |
| Devolutiva por etapa | nenhuma | bloco de análise nas etapas 2, 6, 7 e 8, derivado da resposta anterior |
| Avanço | botão "Continuar" em toda etapa | automático na escolha única (380 ms); botão só onde há digitação ou envio |
| Apresentação das opções | `.rl` soltos | bloco único com hairline interna e inversão de tinta na seleção |
| Progresso | barra percentual (`.bar`/`.step`) | etapas nomeadas (Contexto · Contato · Empresa · Envio) + contador `n/8` |
| Página de obrigado | agradecimento genérico | espelho das respostas + fechamento por eixo × segmento (20 variantes) |

### 2.2 Defeito novo encontrado na auditoria

| # | Defeito | Evidência | Impacto | Decisão |
| :-- | :--- | :--- | :--- | :--- |
| D11 | `maximum-scale=1.0, user-scalable=no` | a Fase 3 marcou a remoção em `formulario.md` §4.4; confirmado ausente do `<meta name="viewport">` de `src/formulario.html` | WCAG 1.4.4 (reprova) | **Resolvido** — nunca reintroduzido; nada a remover na Etapa 1 |

### 2.3 Decisões que dependem da autora

1. **Copy dos 4 blocos de análise e das 20 variantes de fechamento** — redigidos no protótipo em voz de terceira pessoa aproximada. Precisam de passada da autora antes do merge; o `copy-writer` obedece `STYLE_GUIDE.md`, mas tom de sessão é julgamento dela.
2. **Avanço automático** — 380 ms é agressivo para quem relê a opção antes de decidir. Alternativa: 600 ms, ou avanço só no segundo toque. Recomendo 380 ms com botão "← Voltar" sempre visível (é o que o protótipo faz).
3. **Blocos de análise nas etapas de contato (3 e 4)** — hoje não têm. Ficam sem devolutiva duas telas seguidas. Recomendo manter vazias: WhatsApp e e-mail não produzem leitura diagnóstica e um bloco genérico ali soa a enchimento.

---

## 3. Contrato de dados — delta

**Nenhuma mudança.** As 8 chaves de `formulario.md` §3.1, as 12 de rastreamento de §3.2 e a ordem canônica de colunas de §5.1 permanecem exatamente como estão. `apps_script_atualizado.gs` não é tocado nesta fase, e portanto `ensureSheet()` **não** arquiva a aba `Respostas`.

Único acréscimo, e ele não sai do navegador:

| Chave | Onde vive | Para quê |
| :-- | :--- | :--- |
| `be_perfil` | `localStorage`, gravada no submit | `obrigada.html` lê para montar o fechamento. Objeto: `{ eixo, segmento, nome, time, faturamento }` — todos slugs/rótulos já presentes nas respostas, nenhum dado novo |

> `be_perfil` é conveniência de renderização, não fonte de verdade. Se estiver ausente ou corrompida, `obrigada.html` cai no agradecimento genérico atual — ver §6.3.

## 4. Fluxo — 8 etapas, ordem da Fase 4 preservada

| # | Pergunta | Campo | Tipo | Bloco de análise | Avanço |
| :-- | :--- | :--- | :--- | :--- | :--- |
| 1 | Qual é o maior desafio da sua operação hoje? | `maior_problema_gestao` (+`_outro`) | radio 4 + Outro | — | automático (manual se "Outro") |
| 2 | Para começar, qual o seu nome? | `nome_completo` | text | ✅ de `maior_problema_gestao` | botão |
| 3 | Qual o seu WhatsApp com DDD? | `whatsapp` | tel | — | botão |
| 4 | E-mail corporativo | `email` | email | — | botão |
| 5 | Qual é o modelo de negócio da sua empresa? | `modelo_negocio` (+`_outro`) | radio 4 + Outro | — | automático (manual se "Outro") |
| 6 | Quantidade de pessoas no time | `tamanho_equipe` | radio 4 | ✅ de `modelo_negocio` | automático |
| 7 | Faturamento médio mensal | `faturamento_mensal` | radio 4 | ✅ de `tamanho_equipe` | automático |
| 8 | Termo de Consentimento | `consentimento` | checkbox | ✅ de `faturamento_mensal` | botão (envio) |

**Progresso**: ~~quatro etapas nomeadas — Contexto (1) · Contato (2–4) · Empresa (5–7) · Envio (8) — mais contador `n/8`~~ **removido** — ver `docs/specs/design/formulario-progresso-topo.md`. Resta só `.dots` (indicador por etapa, sem contador nem rótulo). `.bar`/`.step` percentual segue fora de uso desde a Fase 5.

### 4.1 Regras de validação

Inalteradas em relação a `formulario.md` §4.3. Acrescenta:

| Caso | Regra |
| :-- | :--- |
| "Outro" selecionado | texto ≥ 2 caracteres; **avanço automático suspenso** e foco no campo em ~60 ms |
| avanço automático | só dispara se a etapa está válida; erro cancela o timer |
| tecla numérica 1–4 | seleciona a opção correspondente na etapa de radio |
| `Enter` em campo de texto | equivale ao botão primário |

## 5. Frontend — `src/formulario.html`

### 5.1 Classes CSS

Regra da Fase 3 mantida: **nenhuma classe existente é renomeada ou removida.** `.rg` `.rl` `.err` `.shake` `.oth` `.hint` `.btn` `.b-bk` `.h` seguem em uso. `.bar` `.step` `.step.a` deixam de ser usadas pelo progresso novo mas **permanecem no CSS** (mesmo tratamento dado a `.rl.dis`).

Classes novas, todas prefixadas `cf-`: `.cf-an` `.cf-an-kicker` `.cf-an-axis` `.cf-an-text` `.cf-opts` `.cf-opt` `.cf-opt.sel` `.cf-opt-n`. `.cf-prog` `.cf-stage` `.cf-stage.a` `.cf-count` existiram nesta fase e foram removidas em `docs/specs/design/formulario-progresso-topo.md` — diferente do resto desta lista, elas **não** permanecem no CSS.

### 5.2 Valores exatos

**Cores** — todas já existem como custom properties do `STYLE_GUIDE.md`; onde não existirem, criar no `:root`:

| Uso | Valor |
| :-- | :--- |
| fundo da página | `#f5f2eb` |
| tinta primária | `#1f1f1f` |
| tinta secundária | `#555` |
| hairline de estrutura | `#E5E5E5` |
| hairline interna de opção | `#EFEDE8` |
| superfície de opção | `#ffffff` |
| hover de opção | `#FBFAF7` |
| dourado de traço | `#C5A059` |
| dourado de texto (AA) | `#886829` |
| erro | `#b91c1c` |
| etapa inativa do progresso | `#a39f95` |

> O dourado de **texto** é `#886829`, não `#C5A059`. `#C5A059` sobre `#f5f2eb` fica em ~2,1:1 e reprova WCAG AA; serve só para traço e para numerador sobre fundo escuro.

**Bloco de opções**: bloco único, `border: 1px solid #E5E5E5`, cantos retos. Cada `.cf-opt` com `min-height: 60px`, `padding: 16px 22px`, `border-bottom: 1px solid #EFEDE8` — **exceto a última** (`:last-child { border-bottom: 0 }`). Numerador `.cf-opt-n` em `.66rem`/`#886829`. Selecionada: fundo `#1f1f1f`, tinta `#f5f2eb`, numerador `#C5A059`. Foco: `outline: 2px solid #1f1f1f; outline-offset: -2px`.

**Bloco de análise**: `border-left: 2px solid #C5A059`, `padding-left: 20px`, `max-width: 62ch`. Kicker em caixa alta `.68rem`/`letter-spacing:.14em`/`#886829`; eixo em `1.15rem` na serifada do style guide; texto em `.95rem`/`line-height:1.75`/`#555`.

**Movimento**: entrada `cf-rise` 360–420 ms `cubic-bezier(.16,1,.3,1)`; escalonamento das opções `delay = índice × 55 ms`; erro `cf-shake` 400 ms; avanço automático 380 ms. Tudo reduzido a ~0 ms sob `prefers-reduced-motion: reduce`.

**Tipografia**: nada abaixo de `.66rem`; nada abaixo de `.88rem` em texto corrido; inputs em `16px` (evita auto-zoom do iOS sem precisar de `user-scalable=no`).

### 5.3 Acessibilidade

Mantém `formulario.md` §4.4 e acrescenta: cada bloco de opções é `role="radiogroup"` rotulado pela pergunta, opções `role="radio"` com `aria-checked`; o bloco de análise é `aria-live="off"` (é contexto, não notificação — anunciá-lo interrompe a leitura da pergunta); foco automático em campo de texto **só acima de 768px**.

## 6. Conclusão personalizada — `src/obrigada.html`

### 6.1 Chave

`` `${eixo}_${segmento}` ``, com

*   `eixo` ← `maior_problema_gestao` → `dependencia` | `retrabalho` | `informacao` | `outro`
*   `segmento` ← `modelo_negocio` → `agencia` | `consultoria` | `b2b` | `b2c` | `segmento_outro`

20 combinações, fallback `outro_segmento_outro`. O índice `P01–P20` da planilha de copy é redundante com o par e **não** é mantido em código — o lookup é pelo par.

### 6.2 Tokens

| Token | Origem | Forma |
| :-- | :--- | :--- |
| `[Nome]` | `nome_completo` | primeiro nome, inicial maiúscula (`trim().split(/\s+/)[0]`) — o campo pede só o primeiro nome desde a Fase 4, e chega em minúsculas com frequência no mobile |
| `[Tamanho do Time]` | `tamanho_equipe` | forma que encaixa depois de "com": `apenas você`, `um time de 2 a 4 pessoas`, … |
| `[Faturamento]` | `faturamento_mensal` | forma que encaixa depois de "faturamento de": `até R$ 30 mil/mês`, `mais de R$ 300 mil/mês` — **sem** preposição dupla ("de entre", "de acima de") |

Substituição por **replace literal** dos três tokens, não template string: a copy é editada pela autora e não deve exigir toque em código. Sem `[Nome]` resolvido, a frase perde o vocativo inicial e é recapitalizada.

### 6.3 Degradação

`obrigada.html` já é a página que dispara o Pixel e pode ser alcançada por URL direta. Se `be_perfil` não existir, estiver incompleta ou a chave não resolver, a página renderiza o agradecimento atual sem o bloco personalizado. **Nunca** exibe token cru, `undefined` ou bloco vazio — e o `fbq('track','Lead', {}, {eventID})` dispara em qualquer um dos caminhos.

## 7. Fora de escopo

*   Qualquer mudança em `apps_script_atualizado.gs`, no `HEADERS` ou na planilha.
*   Reavaliação de D8 (`no-cors`) e D10 (LDU global) — seguem como em `formulario.md` §6.
*   Companion `.md` da página: continua **não** (a página é `noindex` — `AGENT_READINESS.md` §3).
*   Agendamento dentro do formulário, upload de arquivo, painel de leitura das respostas.
*   Teste A/B entre o fluxo da Fase 4 e o da Fase 5. Se for desejado, muda a estratégia de deploy e precisa de spec própria.

## 8. Critérios de aceite

Os 9 critérios de `formulario.md` §7 continuam valendo sem exceção. Acrescentam-se:

10. As 8 etapas aparecem na ordem da Fase 4; `email` e `consentimento` presentes e obrigatórios.
11. Em etapa de radio **não existe** botão "Continuar"; a seleção avança sozinha em ~380 ms.
12. Selecionar "Outro" abre o campo de texto, dá foco nele e **não** avança; avançar com o campo vazio é bloqueado com mensagem específica.
13. As etapas 2, 6, 7 e 8 exibem bloco de análise coerente com a resposta **imediatamente anterior**; voltar e trocar a resposta atualiza o bloco.
14. Nenhum bloco de análise renderiza vazio, com `undefined` ou com token `[…]` visível, para nenhuma das 17 respostas possíveis.
15. `obrigada.html` renderiza o fechamento correto para as 20 combinações de eixo × segmento, gramaticalmente íntegro, sem token cru e sem preposição duplicada.
16. Nome digitado em minúsculas aparece capitalizado nas três ocorrências (agradecimento da etapa 2, título e fechamento).
17. Sem `be_perfil` no `localStorage`, `obrigada.html` carrega o agradecimento genérico e ainda dispara o Pixel com o `event_id`.
18. Em viewport de 375 px nenhuma linha de opção fica abaixo de 60 px, nada transborda na horizontal e o rodapé não encobre conteúdo.
19. `prefers-reduced-motion: reduce` zera as animações; `user-scalable=no` ausente do `<head>` (D11).
20. Todo texto sobre fundo em ≥ 4,5:1; nenhum texto em `#C5A059`.
21. `npm run gate` verde, incluindo `tests/agent-readiness.spec.js` e `tests/aeo.spec.js` intactos.

## 9. Referências

*   `docs/specs/pages/formulario.md` — contrato de dados e critérios 1–9
*   `docs/specs/formulario-fase4-ajustes.md` — ordem das etapas e decisões de copy vigentes
*   `docs/specs/STYLE_GUIDE.md` — voz, paleta e tipografia
*   `docs/specs/TESTING_GUIDE.md` — regras de ouro do E2E
*   `docs/specs/aplicacao-conversacional-plano.md` — plano de execução desta fase
