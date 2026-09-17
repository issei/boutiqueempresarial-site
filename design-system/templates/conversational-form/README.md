# Formulário conversacional — Sessão Estratégica de Diagnóstico BE

Especificação da nova experiência de lead (one-question-at-a-time). O protótipo
funcional é `ConversationalForm.dc.html` nesta pasta; este documento cobre os
entregáveis A–H do briefing.

Fonte de verdade do conteúdo: `uploads/Formulário - Sessão Estratégica de Diagnóstico BE.md`.
Identidade: `tokens/`, `readme.md` (raiz) — nada da composição da home foi reaproveitado.

---

## A. Conceito visual

**Uma folha de papel creme onde a marca fala primeiro e a pergunta responde.**
A tela 1 abre com um hero editorial — eyebrow, título em Playfair 400 e
subtítulo em Inter — seguido do contexto recolhido e só então da pergunta. A
hierarquia é título > subtítulo > pergunta > resposta, e por isso a pergunta
usa uma escala menor (máx. 1.75rem) que o título (máx. 2.9rem): ela é a voz que
conduz, não a manchete.

As alternativas não flutuam: formam **um único bloco branco** com borda
hairline e filetes internos, ancorado sob a pergunta como a tabela de análise
do hero. A linha escolhida inverte para tinta — o mesmo gesto do botão da marca
no hover. Sem sombra, sem raio, sem gradiente. A sofisticação vem de três
coisas: Playfair em 400, entrelinha generosa e vazio.

## B. Arquitetura da experiência

| # | Tela | Etapa | Componente | Microcopy de continuidade |
| --- | --- | --- | --- | --- |
| 1 | Hero + maior desafio da operação | Desafio | Hero (eyebrow + título + subtítulo) → disclosure "O que eu analiso na sua sessão" → pergunta → bloco de 4 alternativas ("Outro" revela campo dentro do bloco) | — |
| 2 | Nome | Contexto | Bloco de plano (dinâmico) + campo sublinhado | "Perfeito." (do arquivo) + eixo de análise correspondente |
| 3 | Modelo de negócio | Contexto | 5 blocos, "Outro" revela campo | "Obrigada, {nome}." |
| 4 | Tamanho do time | Contexto | Bloco de plano (modelo) + 4 blocos | "Certo." + recorte do modelo de negócio |
| 5 | Faturamento médio | Contexto | Bloco de plano (time) + 4 blocos + nota | "Entendi." + prioridade do tamanho |
| 6 | WhatsApp | Contato | Bloco de plano (faturamento) + campo `tel` com máscara | "Quase lá." + calibragem da faixa |
| — | Envio | — | Botão "Enviando…" a 60% | — |
| ✓ | Conclusão | — | "Aplicação recebida, {nome}." + síntese única ("O que eu já sei da sua operação") + "Próximo passo" | "Obrigada pelas respostas — elas já me dizem por onde a sua sessão começa." |
| ✕ | Falha | — | "Não conseguimos enviar agora." + "Tentar novamente" (respostas preservadas) | — |

**Não há tela de abertura separada — o hero e a primeira pergunta dividem a
tela 1.** De cima para baixo: eyebrow, título (Playfair, máx. 2.9rem),
subtítulo (Inter, máx. 1.125rem), filete, disclosure "+ O que eu analiso na sua
sessão" e, depois dela, a pergunta com suas alternativas. O contexto vem
**antes** da pergunta, recolhido: presente e auxiliar, sem disputar atenção.
Hero e disclosure aparecem só na tela 1; das telas 2 a 6 a pergunta é o
elemento de topo.

**Três alterações de ordem em relação ao arquivo, justificadas:**

1. **WhatsApp foi da pergunta 3 para a última.** O briefing pede dados de
   contato ao final (§5) e perguntas sensíveis depois de haver contexto (§16).
   O nome permanece na posição 2 porque é o que permite personalizar a conversa
   ("Obrigada, Talita.") — e a copy original já o introduz com "Perfeito.".
2. **A frase de abertura virou lede curto**, sem alterar sentido: "Preencha os
   dados abaixo para solicitar" foi removido porque não há mais um formulário
   "abaixo"; "45 minutos" e "onde o seu time trava" ficaram na linha de contexto
   acima da primeira pergunta.
3. **A tela de abertura foi eliminada** (§4: "o visitante não deve sentir que
   está preenchendo"; §13: nada compete com a pergunta). O briefing pedia uma
   porta de entrada — ela agora É a primeira pergunta, que é o principal ponto
   de entrada interativo previsto no §7.

O arquivo tem **6 perguntas**, não 11 como cita o briefing; o contador segue o
arquivo (`01 / 06`).

### Micro-entrega de valor (auto-diagnóstico)

**Toda pergunta de escolha devolve um bloco na tela seguinte**, nomeando o
recorte que aquela resposta dá à sessão. É o que transforma o preenchimento em
auto-diagnóstico: a pessoa vai sabendo o que a sessão vai olhar no caso dela.

| Bloco na tela | Alimentado pela resposta de | Eyebrow |
| --- | --- | --- |
| 2 (nome) | Desafio da operação | O QUE EU VOU ANALISAR NO SEU CASO |
| 4 (tamanho do time) | Modelo de negócio | COMO ISSO MUDA A ANÁLISE |
| 5 (faturamento) | Tamanho do time | A PRIORIDADE NO SEU TAMANHO DE OPERAÇÃO |
| 6 (WhatsApp) | Faturamento | COMO EU CALIBRO A SESSÃO |
| Conclusão | Todas, combinadas | O QUE EU JÁ SEI DA SUA OPERAÇÃO |

A tela 3 não tem bloco: a resposta anterior é o nome, que não é diagnóstico.

**Desafio → eixo de análise.** Único conjunto que não é copy nova: cada opção
corresponde a um dos três eixos que o arquivo-fonte já declara em "O que eu
analiso na sua sessão", apenas passado para a primeira pessoa.

| Resposta | Eixo | Texto |
| --- | --- | --- |
| Equipe dependente / preciso aprovar quase tudo | Dependência de aprovação | "…mapeio quais tarefas travam na sua mão ao longo do dia e quais decisões a sua equipe já deve tomar sozinha." |
| Falta de padrão nas entregas e retrabalho | Erros de execução e refação | "…localizo em qual etapa da prestação do serviço acontecem as falhas repetidas, para você parar de refazer o trabalho do funcionário." |
| Informações perdidas / WhatsApp | Fluxo de informação | "…avalio como os pedidos e prazos são repassados no WhatsApp, para você acompanhar as entregas sem precisar mandar mensagem cobrando o tempo todo." |
| Outro | Os três eixos da operação | "…percorro os três eixos — dependência de aprovação, erros de execução e fluxo de informação — para localizar onde a sua operação trava." |

**Modelo de negócio → o que muda na análise.** Copy proposta.

| Resposta | Título | Texto |
| --- | --- | --- |
| Agência / Assessoria | Entrega recorrente, cliente a cliente | "Em agência e assessoria eu começo pelo que se repete em toda conta: quanto da entrega já está descrito e quanto ainda mora na cabeça de quem executa." |
| Consultoria / Mentoria | A entrega que nasce em você | "Em consultoria e mentoria a entrega tende a ficar colada em você. Eu olho o que pode ser padronizado sem descaracterizar o seu método." |
| Prestação de Serviços B2B | O combinado de cada contrato | "No B2B eu acompanho como cada contrato é conduzido, e onde o que foi combinado com o cliente se perde entre quem vende e quem executa." |
| Prestação de Serviços B2C | Volume e repetição | "No B2C o volume expõe qualquer falha de padrão. Eu olho o que a sua equipe faz muitas vezes ao dia e como isso é conferido antes de chegar ao cliente." |
| Outro | A sua operação, no seu formato | "Antes de falar de estrutura, eu entendo como a sua entrega acontece hoje — é isso que define o que vale padronizar primeiro." |

**Tamanho do time → a prioridade estrutural.** Copy proposta.

| Resposta | Título | Texto |
| --- | --- | --- |
| Apenas eu | Estrutura antes da primeira contratação | "Sozinha, o risco não é o time: é você se tornar o gargalo de um negócio que ainda vai crescer. Eu olho o que precisa estar descrito antes da primeira contratação." |
| 2 a 4 colaboradores | A saída do combinado verbal | "Com até quatro pessoas quase tudo funciona por combinado verbal. Eu olho quais rotinas já precisam existir por escrito para o time não parar quando você não responde." |
| 5 a 15 colaboradores | A camada de coordenação | "De 5 a 15 pessoas a operação passa a precisar de coordenação, e não só de execução. Eu olho quem decide o quê, e onde essa decisão hoje volta para você." |
| Mais de 15 colaboradores | Padrão que se replica | "Acima de 15 pessoas o que trava raramente é esforço: é a falta de um padrão replicável. Eu olho como a sua operação se sustenta quando entra mais uma equipe." |

**Faturamento → calibragem da sessão.** Copy proposta.

| Resposta | Título | Texto |
| --- | --- | --- |
| Até R$ 30 mil/mês | Uma frente por vez | "Nessa faixa eu prefiro apontar uma frente só: a que devolve mais tempo para você com o menor ajuste na rotina." |
| R$ 30 mil a R$ 100 mil/mês | Organização que acompanha o crescimento | "Nessa faixa a operação costuma ter crescido mais rápido que a organização. Eu olho o que precisa ser ajustado agora para o próximo salto não custar a sua rotina." |
| R$ 100 mil a R$ 300 mil/mês | Previsibilidade da entrega | "Nessa faixa o tema deixa de ser vender e passa a ser entregar sempre no mesmo padrão. Eu olho em que ponto a entrega oscila." |
| Acima de R$ 300 mil/mês | Estabilidade da operação | "Nessa faixa a conversa é estabilidade: o que precisa existir para a operação não depender da sua presença diária." |

**Conclusão: a combinatória, em um bloco só.** A versão anterior tinha dois
blocos ("Seu ponto de partida" e "O retrato que você me deu") que ambos abriam
com "na sessão eu começo…" — redundante e frio. Agora há **uma** síntese, e ela
devolve à pessoa a dor nas palavras dela antes de dizer o que será feito:

```
linha:  {modelo curto} · {time curto} · {faixa curta}
        → "Consultoria/mentoria · um time de 5 a 15 · acima de R$ 300 mil/mês"

texto:  "Você me disse que o que mais pesa hoje é {dor}. É por aí que eu
         começo: {foco do desafio}. E, num time desse tamanho, {foco do tamanho}."
        → "Você me disse que o que mais pesa hoje é a equipe depender da sua
           aprovação para quase tudo. É por aí que eu começo: as decisões que
           ainda travam na sua mão. E, num time desse tamanho, quem decide o
           quê sem passar por você."
```

Dores (espelham a escolha da tela 1 em linguagem falada): "a equipe depender da
sua aprovação para quase tudo" · "a falta de padrão nas entregas e o retrabalho
que vem com ela" · "a informação que se perde no meio das mensagens". Se a
pessoa escolheu "Outro", a síntese **cita o que ela escreveu**, entre aspas.

Focos do desafio: "as decisões que ainda travam na sua mão" · "a etapa em que a
entrega sai do padrão" · "como pedido e prazo circulam no seu time" · "o ponto
em que a sua operação trava".
Focos do tamanho: "o que precisa estar descrito antes da próxima contratação" ·
"quais rotinas precisam sair do combinado verbal" · "quem decide o quê sem
passar por você" · "o padrão que se replica a cada nova equipe".

Em vez de escrever 5 × 4 × 4 = 80 textos, a frase é **composta** de partes
curtas — leitura natural em qualquer combinação, manutenção viável.

**"Próximo passo" substituiu a linha abstrata.** "A conversa termina aqui — e a
análise da sua operação começa agora" era bonita e vazia. No lugar entrou o que
de fato acontece, com os fatos do arquivo-fonte: análise pessoal, três vagas por
semana, contato pelo WhatsApp em até 48h úteis, 45 minutos. Filete dourado à
esquerda; a síntese fica no cartão branco. Dois blocos, dois trabalhos
distintos: o que eu já sei / o que acontece agora.

**Regra de conteúdo aplicada em toda a copy proposta:** descreve *o que eu
analiso*, nunca *o resultado que você terá*. Nenhum número, prazo, percentual
ou prova social foi criado — isso continua vedado pelo §2 do briefing.

Tratamento visual dos blocos de pergunta: filete vertical de 2px em
`--be-gold` à esquerda (o padrão de lista de qualificação do site), eyebrow em
ouro de texto, título em Playfair 1.15rem, explicação em Inter .95rem. Aparecem
**antes** da pergunta, depois do ack.

## C. Wireframe (por tipo de tela)

```
┌──────────────────────────────────────────────────────┐
│ Boutique Empresarial.        DESAFIO CONTEXTO CONTATO  02 / 06 │  header
│                                                      │
│              Perfeito.                    ← ack itálico ouro │
│              Para identificarmos sua aplicação,      │
│              qual o seu nome?             ← H2 Playfair 400, máx 1.75rem │
│              ┌────────────────────────────┐          │
│              │ Digite seu primeiro nome   │ ← cartão branco + sublinhado │
│              │ ──────────────────────────  │          │
│              └────────────────────────────┘          │
├──────────────────────────────────────────────────────┤
│ ← Voltar   Enter ↵ para continuar        [ Continuar ] │  footer
└──────────────────────────────────────────────────────┘

Tela 1 acrescenta acima do ack:
   SESSÃO ESTRATÉGICA DE DIAGNÓSTICO BE      ← eyebrow
   Uma reunião individual de 45 minutos…     ← H1, máx 2.9rem
   Eu vou analisar a sua operação…           ← subtítulo Inter
   ────────────────────────────────────
   + O QUE EU ANALISO NA SUA SESSÃO          ← disclosure

Escolha única: um bloco branco único (1px #E5E5E5) com as 4–5 linhas
separadas por filete #EFEDE8, 60px mínimo, numeral "01" em ouro.
Linha escolhida → fundo tinta, texto creme, numeral ouro claro.
"Outro" selecionado → campo sublinhado surge como última linha do bloco.
```

Mobile: mesma ordem, largura total, `100dvh`, rodapé com
`env(safe-area-inset-bottom)`; a pergunta permanece no centro visual porque
`main` é `flex:1; align-items:center`.

## D. Design system aplicado

Tudo vem de `tokens/`. Valores usados:

- **Cor:** fundo `#f5f2eb`; bloco `#ffffff` / borda `#E5E5E5`; tinta `#1f1f1f`;
  apoio `#555`; ouro decorativo `#C5A059` (ponto do wordmark, filete final);
  ouro de texto `#886829` (contador, numerais, ack); inativo `#a39f95`;
  erro `#b91c1c`. Selecionado = fundo tinta, texto creme, numeral ouro.
- **Tipo:** Playfair Display 400 no hero (`clamp(1.9rem,3.8vw,2.9rem)`), na
  pergunta (`clamp(1.3rem,2.3vw,1.75rem)`), nas alternativas
  (`clamp(1rem,1.4vw,1.15rem)`) e no campo (`clamp(1.25rem,2.2vw,1.7rem)`); ack
  em Playfair itálico 1.05rem. Inter 300 no subtítulo
  (`clamp(1rem,1.3vw,1.125rem)`), notas e rodapé; Inter caixa-alta
  `.7rem / .14em` no progresso e eyebrow. A pergunta fica deliberadamente
  abaixo do título na escala — hierarquia, não timidez.
- **Escala/espaço:** medida 760px; gutter `clamp(20px,5vw,64px)`; 44px entre
  hero e pergunta; 22–28px entre pergunta e bloco de resposta; linhas sem gap
  (filete faz a separação); 16–20px de padding vertical e 22px horizontal por
  linha.
- **Bordas:** 0 em todo canto; bloco de resposta com 1px #E5E5E5 (vira #b91c1c
  em erro) e filetes internos #EFEDE8; 2px de raio só no botão primário (raio
  do site); sublinhado 1px → 2px no foco.
- **Sombra:** nenhuma.
- **Estados:** ver F/E. Foco sempre `2px solid #1f1f1f` a 2px de offset.
- **Animação:** entrada 400ms `ease-out` (18px lateral, direção segue o
  sentido); alternativas 360ms `cf-rise` com 55ms de escalonamento; seleção
  200ms; shake 400ms `cubic-bezier(.36,.07,.19,.97)`; erro 240ms.
  `prefers-reduced-motion` reduz tudo a 0.

## E. Especificação das interações

- **Escolha única:** clique/toque, ou teclas `1–5` fora de um campo. Hover
  tinge a linha de `#FBFAF7`; foco desenha o anel para dentro
  (`outline-offset:-2px`) para não vazar do bloco. Feedback imediato (inversão
  da linha) e avanço automático em 380ms — desligável pelo tweak
  `autoAdvance`. "Outro" não avança: revela o campo e leva o foco a ele.
  Validação: opção obrigatória; "Outro" exige texto.
- **Texto (nome):** campo sublinhado, foco automático no desktop (não no
  mobile, para o teclado não subir antes do toque). `Enter` avança.
- **WhatsApp:** `type="tel" inputmode="tel" autocomplete="tel-national"`,
  máscara `(00) 00000-0000` aplicada a cada tecla, aceita 10 ou 11 dígitos.
- **Avanço/retorno:** `Continuar` / `Enter` valida e entra pela direita;
  `← Voltar` entra pela esquerda e preserva as respostas.
- **Erro:** shake no bloco de resposta, sublinhado vermelho, mensagem
  contextual em `role="alert"` (nunca "Selecione uma opção").
- **Envio:** botão vira "Enviando…" a 60%, desabilitado; 900ms simulados.
- **Sucesso:** "Aplicação recebida, {primeiro nome}." + regra de retorno
  existente (48h úteis via WhatsApp). Sem rodapé — a conversa acabou.
- **Falha:** tela própria, respostas preservadas, "Tentar novamente"
  reenvia. Tweak `simulateFailure` exibe o estado.
- **Bloco de plano:** entra com `cf-rise` 420ms junto da tela; é conteúdo, não
  controle — não recebe foco nem hover.
- **Disclosure de contexto:** botão de texto com marcador "+"/"–" em ouro;
  expande os três itens de análise em .88rem. `aria-expanded`, sem animação
  de altura (apenas `cf-rise` no conteúdo).
- **Progresso:** etapas `Desafio → Contexto → Contato` (ativa em tinta) +
  `02 / 06` em ouro; tweak `progressStyle` escolhe `both | stages | counter`.

## F. Responsividade

- **Mobile (<768):** `100dvh`, `main` centrado, rodapé com área segura; blocos
  a 100%; H1 e alternativas encolhem pelo `clamp`; sem foco automático; sem
  atalhos de teclado visíveis. Rolagem só quando as 5 alternativas do modelo de
  negócio somam mais que a altura útil.
- **Tablet:** idêntico ao desktop com gutter de 5vw.
- **Desktop:** medida de 760px centrada, gutter até 64px, foco automático no
  campo, `Enter` e `1–5` funcionam, rodapé em linha única.

## G. Acessibilidade

- Alternativas são `<button role="radio" aria-checked>` dentro de
  `role="radiogroup" aria-labelledby` — navegáveis por Tab, ativáveis por
  Enter/Espaço.
- Campos têm `<label>` visualmente oculto ligado por `for`; placeholder nunca
  é o único rótulo.
- Erros em `role="alert"`, `aria-invalid` no campo, texto além da cor.
- Contraste: tinta/creme 15:1; apoio `#555`/creme 6.9:1; ouro de texto
  `#886829`/creme 4.6:1; creme sobre tinta (selecionado) 15:1.
- Foco visível em todos os controles (2px tinta).
- `prefers-reduced-motion` respeitado; nenhuma animação bloqueia input.
- Alvos ≥ 48px (blocos 64px, botão 48px, Voltar 40px de área clicável).

## H. Critérios de aceitação

1. A tela 1 mostra, em ordem: eyebrow, título com "45 minutos" e "onde o seu
   time trava", subtítulo, disclosure recolhida, pergunta e bloco de
   alternativas. Em 390×844 o hero e a pergunta aparecem sem rolar; as
   alternativas podem exigir rolagem curta.
1b. O título é visivelmente maior que a pergunta, e a pergunta é visivelmente
   maior que as alternativas — três degraus de escala, sem empate.
1d. A tela 2 mostra o eixo correspondente à resposta da tela 1, e trocar essa
   resposta (via "← Voltar") troca o eixo exibido.
1e. As telas 4, 5 e 6 mostram o bloco correspondente à escolha anterior
   (modelo, tamanho e faturamento, nessa ordem). A tela 3 não mostra bloco.
1f. A conclusão traz uma síntese só, que cita a dor escolhida (ou o texto do
   "Outro") e combina modelo, tamanho e faixa, seguida de "Próximo passo" com
   as regras reais de retorno. Nenhum bloco repete a frase de outro.
1g. Nenhuma copy de bloco promete resultado, número ou prazo.
1c. As alternativas leem como um bloco único: nenhuma linha tem borda própria
   nem sombra, e o grupo tem uma só moldura hairline.
2. Cada tela exibe exatamente uma pergunta; nenhum outro campo é visível.
3. Toda a copy das perguntas e alternativas é idêntica ao arquivo-fonte;
   as duas alterações de ordem/hierarquia acima são as únicas.
4. Escolher uma alternativa dá feedback em <200ms e avança em ≤400ms.
5. `Voltar` nunca perde uma resposta; recarregar não é requisito.
6. Enviar sem resposta produz shake + mensagem contextual, nunca genérica.
7. O WhatsApp aceita só 10–11 dígitos e formata enquanto digita.
8. Teclado: Tab percorre tudo, Enter avança, 1–5 selecionam, foco visível.
9. Com `prefers-reduced-motion`, nada se move e o fluxo funciona igual.
10. Nenhum gradiente, sombra, pílula, ícone decorativo ou emoji além de ⏳.
11. Sucesso e falha têm telas próprias na identidade da marca; a falha
    preserva as respostas e permite reenviar.
12. Lighthouse mobile: sem CLS perceptível; nenhuma biblioteca além do runtime.
