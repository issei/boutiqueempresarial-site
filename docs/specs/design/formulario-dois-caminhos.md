# Formulário com dois caminhos: empresário e gerente

**Status**: Draft — decisões D1 a D7 aprovadas pelo Issei em 2026-10-25; textos do gerente aguardam revisão da Talita
**Fonte**: "Formulário de Diagnóstico — Especificação para o editor" (Talita, 2026-10-23)
**Emenda**: `docs/specs/pages/formulario.md` §3 (contrato de dados) e §5.1 (colunas da planilha); `docs/specs/pages/aplicacao-conversacional.md` (fluxo e devolutivas); `docs/specs/design/formulario-tracking-funil.md` (parâmetro `path`)
**CRM**: Spec 030 do `boutiqueempresarial-crm` (`specs/030-caminho-do-gerente-no-lead.md`) — **publicar o CRM antes deste site**

## Problema

O formulário só fala com o dono de empresa. A página passa a receber também gerentes, coordenadores e
supervisores, que não respondem por modelo de negócio nem faturamento. Hoje eles respondem perguntas que
não são deles, e o CRM não sabe distinguir os dois públicos para separar a oferta depois do diagnóstico.

## Solução

Uma nova primeira pergunta, obrigatória e de escolha única, decide o caminho. O caminho do empresário
continua o de hoje; o do gerente é novo e mais curto. As etapas dos dois caminhos ficam no mesmo
`src/formulario.html` e a navegação pula as que não são do caminho escolhido.

### Etapa 1 (todos): posição

**Qual é a sua posição na empresa?**

| Opção (valor de `posicao`) | Caminho | Frase de transição na etapa seguinte |
| :-- | :-- | :-- |
| Sou dono ou sócio | empresário | Agora me conta um pouco sobre a sua empresa. |
| Lidero um time na empresa (gerente, coordenador, supervisor) | gerente | Agora me conta um pouco sobre o time que você lidera. |

### Caminho empresário

Mesmas etapas e ordem de hoje (maior desafio → nome → WhatsApp → e-mail → modelo de negócio → tamanho
da equipe → faturamento). Única mudança, as faixas de `tamanho_equipe` (D1):

`Menos de 3 colaboradores` · `3 a 4 colaboradores` · `5 a 15 colaboradores` · `Mais de 15 colaboradores`

### Caminho gerente (D4: ordem da Talita)

| # | Pergunta | Chave | Opções |
| :-- | :-- | :-- | :-- |
| 1 | Nome completo | `nome_completo` | — |
| 2 | E-mail | `email` | — |
| 3 | WhatsApp | `whatsapp` | — |
| 4 | Qual é o seu vínculo com a empresa? | `vinculo` | CLT · PJ |
| 5 | Quantas pessoas respondem diretamente a você? | `pessoas_lideradas` | 3 a 5 · 6 a 10 · 11 a 20 · Mais de 20 |
| 6 | Qual é o maior desafio com o seu time hoje? | `maior_desafio_gerente` (+ `_outro`) | O time me procura para quase tudo · Preciso cobrar pendências uma por uma · Tenho dificuldade de cobrar e dar retorno sem desgastar a relação · Sou cobrado pelo resultado, mas não consigo mostrar o que o time entrega · Outro |
| 7 | O que você quer conquistar nos próximos 12 meses? | `objetivo_12m` (+ `_outro`) | Ser reconhecido pelo resultado do time · Crescer de cargo · Ter tempo para o trabalho que só eu faço · Liderar com menos desgaste · Outro |

`modelo_negocio`, `tamanho_equipe`, `faturamento_mensal` e `maior_problema_gestao` vão vazios no gerente.
`email` e `whatsapp` seguem chaves congeladas (CAPI).

### Consentimento (D2, D3)

Sem caixa de seleção nos dois caminhos: o aviso do rodapé continua sendo o consentimento, e continua
dizendo **"Ao responder"** (sustenta a pré-captura). Texto novo do rodapé:

> Esta é uma aplicação e não garante o agendamento. Ao responder, você autoriza o uso dos seus dados apenas
> para avaliação desta aplicação, conforme a nossa Política de Privacidade.

### Topo da página (os dois caminhos)

| Elemento | Texto |
| :-- | :-- |
| Pré-headline | Para empresários e líderes com equipe a partir de 3 pessoas |
| Headline | Quantas vezes o seu time te procurou hoje? |
| Subheadline | E quantas dessas vezes precisavam mesmo de você? Em um diagnóstico de 45 minutos, eu te mostro por que o time depende tanto de você e o que mudar primeiro na forma de conduzir a equipe. |
| Autoridade | Talita Issei · 15 anos em multinacionais como KPMG, Itaú, Vivo e Accenture |
| Título da lista | O que olhamos juntos |
| Item 1 | **Como você acompanha o time:** onde estão as pendências, as prioridades e os responsáveis |
| Item 2 | **Como as decisões chegam até você:** quais precisam mesmo da sua autorização |
| Item 3 | **O que já custou caro:** erros e retrabalhos recentes, com exemplos da sua realidade |
| Acima do botão de envio | Leva cerca de 2 minutos. Depois do envio, eu mesma entro em contato. Deixe um número com WhatsApp. |

O bloco `.intro` passa a aparecer na etapa de posição (a nova primeira). `<meta description>`,
`og:description` e o JSON-LD da página são revistos para não restringir o público a "empresas de serviço"
de dono (contrato do `HARNESS_AEO.md`; a home é outro arquivo e outra spec).

### Comportamento

- `data-path` em cada etapa (`empresario`, `gerente` ou ambos). `nav()` pula as fora do caminho; contador
  `n/N` e barra derivam do caminho ativo (princípio do D5 de `formulario.md`).
- Voltar à posição e trocar de opção limpa as respostas do outro caminho.
- Campos "Outro" só aparecem, e só vão no payload, com "Outro" marcado.
- Pré-captura (`sendPartial()`) igual nos dois caminhos: dispara quando nome + WhatsApp + e-mail validam e leva `posicao` (G1), que já foi respondida na etapa 1.
- WebMCP: `get_form_state`, `answer_field` e `next_step` só enxergam as etapas do caminho ativo.
- Celular: opções longas do gerente (até 72 caracteres) cabem no bloco de opções em 360 px sem rolagem
  horizontal.

### Obrigada e agendamento (D7)

Todo gerente passa por análise: a rota `link` do CRM devolve `em_analise: true` e a obrigada mostra a nota
"em análise" já existente (Spec 023 do CRM), sem seletor de datas. O fechamento personalizado do gerente
(§6) aparece acima da nota.

### Eventos

- GA4: todos os `form_*` ganham `path` (`empresario` | `gerente`). `step_name` já cobre as etapas novas.
- Pixel: `FormStart`, `ContactCaptured` e `Lead` inalterados.
- CAPI (D6): `custom_data` ganha `lead_caminho` (`empresario` | `gerente`). Vínculo, objetivo e desafio do
  gerente **não** vão à Meta; `lead_faturamento` e `lead_equipe` vão vazios no gerente. Antes de
  implementar, ler os Business Tools Terms da Meta (Platform Terms e Developer Policies já revisados em
  2026-10-25, ver o plano).

### Apps Script

- Colunas novas no fim do cabeçalho: `Posição | Vínculo | Pessoas Lideradas | Maior Desafio (Gerente) |
  Desafio Gerente (Outro) | Objetivo 12 meses | Objetivo (Outro)`. Efeito conhecido: o primeiro `doPost`
  após publicar arquiva a aba `Respostas` como `Respostas_legado_<timestamp>` (nada é apagado).
- Aba `Parciais` ganha a coluna `Posição` no fim. Efeito conhecido: o primeiro parcial após publicar arquiva a aba `Parciais`, como acontece com a `Respostas` (nada é apagado).
- E-mail interno (`notifyNewLead`) mostra o caminho e os campos dele.
- Repasse ao CRM inalterado (manda o JSON inteiro).

## Textos do gerente (rascunho, aguarda revisão da Talita, D5)

Rascunho no plano ("Plano: nova pergunta de posição no formulário", seção "Rascunho dos textos novos"):
devolutivas depois do vínculo, de pessoas lideradas e do maior desafio; fechamento por desafio + frase por
objetivo; texto da faixa "Menos de 3 colaboradores" do empresário. Entram em `src/js/form-copy.js` só
depois da revisão.

## Decisões

| # | Decisão (Issei, 2026-10-25) | Alternativa descartada |
| :-- | :-- | :-- |
| D1 | Faixas do empresário: Menos de 3 · 3 a 4 · 5 a 15 · Mais de 15 | Mesmas faixas do gerente |
| D2 | Rodapé da Talita com "Ao responder" em vez de "Ao enviar" | Texto literal (quebraria a pré-captura) |
| D3 | Sem caixa de consentimento, aviso no rodapé para os dois caminhos | Caixa só no gerente |
| D4 | Gerente na ordem da Talita (contato primeiro) | Desafio primeiro |
| D5 | Claude rascunha os textos do gerente; Talita revisa | Esperar a Talita escrever |
| D6 | CAPI recebe só `lead_caminho` | Nada novo; caminho + pessoas lideradas |
| D7 | Todo gerente passa por análise antes do agendamento | Só "Outro" + "Outro" |
| G1 | Pré-captura leva `posicao` junto do contato | Só o contato |

## Critérios de pronto

1. Sem resposta na posição, o formulário não avança.
2. Caminho empresário: mesmas etapas e ordem; faixas novas; payload de hoje + `posicao`.
3. Caminho gerente: 8 etapas contando a posição, na ordem da tabela; payload com os campos do gerente e
   sem modelo, tamanho, faturamento e maior problema.
4. "Outro" do gerente: campo só aparece e só vai no payload com "Outro" marcado.
5. Trocar a posição limpa o outro caminho; contador e barra mostram o total do caminho ativo.
6. Pré-captura dispara nos dois caminhos, uma vez por `event_id`, com `posicao` no payload.
7. Eventos GA4 com `path`; nenhum evento com contato ou texto livre.
8. WebMCP só expõe etapas do caminho ativo.
9. axe sem `serious`/`critical`; 360 px sem rolagem horizontal.
10. Topo e rodapé com o texto literal acima; meta e JSON-LD coerentes.
11. Obrigada do gerente: fechamento + nota "em análise", sem seletor.
12. `npm run gate` verde.

Testes: `e2e/form-aplicacao.spec.js`, `tests/formulario-webmcp.spec.js`, `tests/obrigada.spec.js`,
`tests/a11y.spec.js`, `tests/seo.spec.js`, `tests/aeo.spec.js`.

## Ordem de deploy — obrigatória

1. CRM (Spec 030) em produção.
2. Apps Script publicado no editor do Google.
3. Este site. A home nova (`home-copy-v3`) vai junto ou depois.

## Arquivos

`src/formulario.html`, `src/js/form-copy.js`, `src/obrigada.html`, `apps_script_atualizado.gs`, os testes
acima, `docs/specs/pages/formulario.md`, `docs/specs/pages/aplicacao-conversacional.md`,
`docs/specs/design/formulario-tracking-funil.md`. **Não** toca `src/index.html`, `public/index.md`,
`public/llms*.txt` nem `tests/home.spec.js` (home, outro trabalho em paralelo).
