# Home e intro do formulário — copy v4 e visual novo

**Data:** 2026-10-30 · **Status:** em implementação
**Fonte:** copy da Talita ("COPY - GP E EMPRESÁRIO - OUTUBRO") + mockup do Issei.
**Restrição:** a família de fonte não muda (Playfair Display + Inter). Não mexer em `@font-face` nem em `font-family`.
**Paleta:** ver [`adr-paleta-v4.md`](../adr-paleta-v4.md).

## Visual

Paleta (amostrada do mockup): fundo escuro #131210 (topo, hero, "O ponto cego", "Por que agora", rodapé); creme #f6f2e9; faixa bege #ebe2d1 (seções alternadas, FAQ, "Quem vai conversar"); cartões #ffffff e #fbf8f3; laranja #c14f1b (botões, palavra em itálico dos títulos, números 01/02/03, eyebrows, barra de progresso); laranja claro #e8743b sobre fundo escuro (números das opções do formulário). Contraste mínimo 4.5:1 texto normal, 3:1 título grande.

## Home, na ordem

1. Topo escuro: wordmark e botão "Aplicar ao diagnóstico" (já existem).
2. Hero escuro com a foto da Talita à direita em arco (borda fina laranja), cartão creme sobre a foto "Talita Issei / 15 anos em multinacionais como KPMG, Itaú, Vivo e Accenture". Eyebrow "Para empresários e líderes de equipe" com traço laranja. H1 "Você revisa tudo o que o seu time entrega. <em>E os erros continuam aparecendo.</em>" (itálico laranja). Sub com "três primeiros ajustes por escrito." em negrito. Botão CTA laranja com seta. Microcopy. Selos: 45 minutos · Individual · 3 ajustes por escrito · Gratuito.
3. Faixa laranja: PROCESSOS ✦ GESTÃO DE PESSOAS ✦ INDICADORES.
4. "Veja se isto acontece com você" (eyebrow "Antes de tudo"; apoio "Marque o que se parece com a sua semana."; "com você" em itálico laranja). Sete frases em cartões brancos com caixa de marcar. Cartão escuro com contador "0 de 7" e "Toque nas frases ao lado. Cada uma é um sinal de que a revisão virou a única conferência do seu time."
5. "Faça uma conta rápida" (fundo bege): texto da copy à esquerda; à direita calculadora com − / + em "Entregas que você revisou" (20), "Em quantas encontrou erro" (8), "Quantos erros já tinham aparecido antes" (6) e resultado escuro "75% dos erros já tinham aparecido antes. A maioria se repete: revisar mais não vai resolver." (a frase só quando >50%; abaixo disso só o percentual).
6. Fundo escuro, eyebrow "O ponto cego", título "Por que revisar tudo <em>não diminui</em> os erros". Parágrafo 1; pílulas "Time entrega sem conferir → Você encontra o erro → Corrige ou devolve ↺"; parágrafo 2 em cartão com borda.
7. Eyebrow "O que resolve", título "Implantar as três partes juntas, <em>nesta ordem.</em>". Três cartões: 01 Indicadores (PRIMEIRO), 02 Processos (DEPOIS), 03 Gestão de pessoas (POR FIM, cartão escuro). Nota: "<strong>Quase todo mundo começa pela ferramenta.</strong> Ela só funciona depois que essas três partes estão definidas."
8. Fundo bege, eyebrow "O diagnóstico", título "O que olhamos juntos nos <em>45 minutos</em>". Quatro cartões numerados (título, texto, frase "Você descobre…/Você vê…" destacada com seta). Cartão escuro: "No final, você sai com os <em>três primeiros ajustes por escrito</em>, na ordem em que devem ser feitos." + parágrafo da decisão + CTA.
9. Título "Dois caminhos para o <em>seu próximo ano</em>": cartão claro "Se nada mudar / O que acontece se nada mudar" com ×; cartão escuro "Com as três partes / O que muda quando as três partes funcionam juntas" com ✓. CTA abaixo.
10. Fundo bege: foto com selo "15 anos em multinacionais", eyebrow "Quem vai conversar com você", título "Eu sou a <em>Talita Issei.</em>", dois parágrafos, linha em texto KPMG · Itaú · Vivo · Accenture (sem logos).
11. "Para quem é esta conversa": cartões "É para você" e "Não é para você".
12. "Como funciona": 01/02/03 em linha.
13. Fundo bege, eyebrow "Dúvidas", "Perguntas frequentes": sete `<details>` com + / −.
14. Fundo escuro: eyebrow "Por que agora", parágrafo, título final com "<em>e o que mudar primeiro.</em>", CTA, "Diagnóstico gratuito · 45 minutos · Individual".
15. Rodapé atual.

## Formulário, etapa 1 (`.intro`)

Eyebrow "Para empresários e líderes de equipe"; headline = H1 da home (itálico laranja); subtitle = subheadline da home; `.intro-cred` igual com avatar redondo da foto; `<details>` "O que olhamos juntos" com os quatro itens novos (título em negrito + texto curto da copy). Metas: "Para empresários e líderes de equipe. Você revisa tudo o que o seu time entrega. E os erros continuam aparecendo." Perguntas, opções, rodapé e consentimento: sem mudança. Visual: fundo creme, cartão branco arredondado da etapa, barra de progresso laranja, opções com número em círculo escuro (#131210, número #e8743b) e seta laranja à direita.

Metas/AEO/JSON-LD/llms: só frases literais da copy.

## Copy (literal)

Pré-headline: Para empresários e líderes de equipe
Headline: Você revisa tudo o que o seu time entrega. E os erros continuam aparecendo.
Subheadline: Em um diagnóstico individual de 45 minutos, eu te mostro por que os erros se repetem no seu time e você sai com os três primeiros ajustes por escrito.
CTA (todos os botões): Quero entender por que os erros continuam
Microcopy: Diagnóstico gratuito. Você preenche em 2 minutos e eu entro em contato.

### Veja se isto acontece com você
- A entrega chega e você precisa conferir antes de mandar para o cliente.
- Você encontra o mesmo erro que já tinha corrigido no mês passado.
- Você devolve, explica de novo, e a pessoa ajusta só aquele ponto.
- Quando você está sem tempo para revisar, o trabalho fica parado esperando você.
- Quem entrou há pouco tempo erra o que os mais antigos já sabem, e é você quem percebe.
- Quando um erro chega ao cliente, é você quem pede desculpas e explica o que aconteceu.
- Você sabe que tem gente que entrega bem e gente que dá mais trabalho, mas não tem como mostrar isso com números.

### Faça uma conta rápida
Pense na última semana. Quantas entregas do time você revisou? Em quantas encontrou erro? E quantos desses erros já tinham aparecido antes?
Se a maioria dos erros se repete, revisar mais não vai resolver. O que precisa mudar é a forma como o trabalho chega até você.

### Por que revisar tudo não diminui os erros
Quando o time sabe que você vai revisar, a sua revisão passa a ser a única conferência da entrega. A pessoa entrega sem conferir, você encontra o erro e corrige ou devolve, e o motivo do erro continua lá.
Isso não é falta de cuidado do time nem falha sua. Acontece quando falta processo, gestão de pessoas ou indicadores. Quando uma dessas três coisas falta, você compensa revisando tudo.

### O que resolve
Implantar as três partes juntas, nesta ordem:
1. Indicadores: saber com números onde os erros acontecem, com que frequência e com quem.
2. Processos: deixar claro o que é uma entrega pronta, com o passo a passo dentro das tarefas e quem executa conferindo antes de passar para você.
3. Gestão de pessoas: definir quem confere o quê, o que cada um decide sozinho e como o erro vira aprendizado para o time.
Quase todo mundo começa pela ferramenta. Ela só funciona depois que essas três partes estão definidas.

### O que olhamos juntos nos 45 minutos
Como o trabalho chega até você — Se existe um passo a passo claro para as entregas, onde ele fica e se alguém confere antes de você. Você descobre por que as entregas chegam com erro.
Como você acompanha o time — Se você sabe com números onde os erros acontecem e quem entrega bem, ou se decide pela impressão do momento. Você descobre o que precisa acompanhar para não ter que revisar tudo.
Como as responsabilidades estão divididas — Quem faz o quê, o que cada pessoa pode decidir sem você e o que acontece quando um erro aparece. Você descobre o que pode deixar de passar pela sua revisão.
O que já custou caro — Dois ou três erros ou retrabalhos dos últimos meses e quanto eles custaram em tempo ou dinheiro. Você vê, com os seus próprios exemplos, o preço de deixar como está.
No final, você sai com os três primeiros ajustes por escrito, na ordem em que devem ser feitos. Depois, se fizer sentido para o seu caso, eu apresento como posso te acompanhar na implantação desses ajustes. A decisão de seguir é sua, e os três ajustes ficam com você de qualquer forma.

### O que muda quando as três partes funcionam juntas
- A entrega chega para você já conferida, e você revisa só o que precisa da sua decisão.
- O mesmo erro deixa de aparecer, e você para de pedir desculpas ao cliente por algo que poderia ter sido evitado.
- Você sabe com números quem entrega bem e onde o time erra mais.
- Quem entra no time aprende o padrão de qualidade sem depender de você explicar tudo.
- Sobra tempo para dar retorno ao time e para o seu próprio trabalho.
- Você consegue tirar uns dias sem o trabalho ficar parado esperando a sua revisão.

### O que acontece se nada mudar
- Você continua revisando tudo, e cada pessoa nova que entra aumenta o que você precisa revisar.
- Os mesmos erros continuam aparecendo, e cada vez que um deles chega ao cliente, é você quem precisa se explicar.
- A avaliação do time continua sendo feita pela sua impressão.

### Quem vai conversar com você
Eu sou a Talita Issei. Passei 15 anos em multinacionais como KPMG, Itaú, Vivo e Accenture. Em 4 deles, estive à frente da gestão de equipes e projetos, conduzindo times no dia a dia: definindo prioridades, acompanhando entregas e respondendo pelo resultado.
Há 5 anos, levo essa experiência para pequenas e médias empresas, como escritórios jurídicos, empresas de educação, de imigração e empresas digitais, trabalhando com empresários e líderes na forma como eles conduzem o próprio time.

### Para quem é esta conversa
Para empresários e líderes com 3 ou mais pessoas na equipe, que hoje precisam revisar o trabalho do time para garantir a qualidade. Se você ainda não tem equipe, esta conversa não é para você.

### Perguntas frequentes
Quanto custa? — Nada. O diagnóstico é gratuito.
Não sou dono da empresa. Serve para mim? — Serve. As mudanças acontecem na forma como você conduz o seu time: como as entregas chegam até você, como você acompanha e o que cada pessoa decide. Não depende de mudar a empresa inteira.
O meu trabalho é técnico. Tudo precisa da minha revisão. — Na conversa, separamos o que precisa mesmo da sua revisão do que pode ser conferido por quem fez, com um padrão claro do que é uma entrega pronta.
Já tentei ferramenta, curso ou reunião semanal e nada mudou. Serve para mim? — Serve. Na conversa, eu olho o que já existe e o que está faltando entre processos, gestão de pessoas e indicadores. Quase sempre, o que foi feito resolveu só uma dessas partes.
Estou sem tempo nenhum. Faz sentido agendar? — Faz, se você quer entender por que revisar tudo está tomando o seu tempo. Você sai com os três ajustes e decide depois se quer seguir com o acompanhamento.
Vou receber uma proposta no final? — Sim. No final, eu apresento o programa para empresários ou a mentoria para líderes de equipe, conforme o seu caso. A decisão é sua, e os três ajustes ficam com você de qualquer forma.
Preciso preparar alguma coisa? — Não é obrigatório. Mas ajuda lembrar de dois ou três erros ou retrabalhos dos últimos meses. São eles que mostram, com a sua realidade, o que precisa mudar.

### Como funciona
1. Você preenche o formulário em 2 minutos.
2. Eu entro em contato para entender o momento do seu time.
3. Marcamos os 45 minutos no horário que for melhor para você.

### Por que agora
O fim do ano é quando você planeja 2027 e avalia o seu time. Você pode entrar no próximo ano sabendo o que ajustar primeiro, e com critério para avaliar quem entrega bem.

Título final: Descubra em 45 minutos por que os erros continuam chegando até você e o que mudar primeiro.
