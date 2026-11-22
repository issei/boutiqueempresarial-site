> **Status:** implementada na branch `feat/home-analise-operacao` (2026-11-20). Fonte: metaprompt da Talita de 20/11, copiado abaixo sem alteração. Divergência decidida pelo Issei em 21/11: o formulário ganhou o campo "Seu e-mail" (o CRM recusa lead sem e-mail), e o texto passou de "5 perguntas" para "6 perguntas".

# Metaprompt: nova página da bio (Análise de Operação e Equipe)

Use este arquivo como instrução para implementar a nova página inicial de boutiqueempresarial.com.br. Ele explica a intenção de cada mudança e traz o texto final. A referência visual e de comportamento é o arquivo `previa-pagina-bio.html`, que está nesta mesma pasta, junto com o PDF `pagina-bio-analise-operacao.pdf`.

Este arquivo substitui a spec do PR #60 (`docs/specs/design/home-copy-v5.md`) nos pontos em que os dois divergem: o formulário agora fica dentro da página e a seção de resultados saiu.

---

## 1. Contexto

A página da bio vende uma sessão gratuita de 45 minutos. Ela se chamava "Diagnóstico Gratuito" e falava de erros e de revisão. Agora a sessão se chama **Análise de Operação e Equipe**, e a promessa é faturar mais com a equipe que o empresário já tem, sem ele precisar trabalhar mais.

O trabalho da página é um só: fazer a pessoa certa preencher o formulário. A página mostra o problema, por que ele acontece e o que a pessoa leva da sessão. O método e o preço ficam para a sessão.

## 2. Para quem é

- Empresários com equipe de 3 ou mais pessoas, que querem atender mais clientes sem contratar no mesmo ritmo e sem trabalhar mais.
- Gerentes e líderes não são excluídos. A página só não é para quem não tem equipe ou acha que o time funciona bem sem uma estrutura organizada.

## 3. Regras de texto (não mudar sem falar com a Talita)

- Não usar a palavra "dono". Usar "empresário" quando precisar.
- Nenhum preço e nenhum valor em reais no texto da página. A exceção são as faixas de faturamento do formulário.
- Não prometer resultado com verbo de garantia ("garante", "elimina", "assegura").
- Sem prazo de retorno. O contato acontece "se a sua aplicação for aprovada".
- Tom profissional, sem metáforas.
- O texto abaixo é final. Não reescrever, só aplicar.

## 4. O que muda em relação à página atual

| Página atual | Página nova | Por quê |
| --- | --- | --- |
| "Diagnóstico Gratuito" sobre erros e revisão | "Análise de Operação e Equipe", sobre faturar mais com a mesma equipe | Vender o resultado que o empresário quer, e não o meio |
| Eyebrow "Para empresários e líderes de equipe" | "Análise de Operação e Equipe · para empresários com equipe" | Deixar claro que a promessa é ligada à equipe |
| Botões levam para `formulario.html` | Todos os botões levam para `#aplicar`, o formulário na própria página | Menos um passo até a aplicação |
| Formulário separado, com dois caminhos e várias etapas | Formulário embutido com 5 campos | Aplicação mais curta |
| Lista de 7 sinais | Lista de 8 sinais, ligados a retrabalho, contratação e ferramenta | Conectar a dor do dia a dia à promessa |
| Calculadora "Faça uma conta rápida" | Removida | A conta é feita com a pessoa na sessão |
| "Por que revisar tudo não diminui os erros" | "Por que contratar mais gente não aumenta o faturamento na mesma proporção" | Explicar o problema pela crença central: a empresa cresce quando o que o funcionário mais antigo sabe passa a valer para quem entra |
| "O que resolve": indicadores, processos e gestão de pessoas | Removida | O método é apresentado na sessão. Mostrar antes faz a pessoa achar que resolve sozinha |
| "O que olhamos juntos" + "3 ajustes por escrito" | "O que você leva dos 45 minutos", com 4 itens e o plano de 30 dias | Itens decididos em 20/11 |
| Trechos como "quem entrega bem e quem dá mais trabalho" e "avaliar o time" | Removidos | Eles reforçam a ideia de que o problema é a pessoa |
| Pergunta "Não sou dono. Serve para mim?" | Removida | A página não separa dono e líder |
| Seção de resultados (número de empresas e depoimento) | **Não entra** | Decisão da Talita em 20/11 |

## 5. Ordem das seções e texto final

As palavras entre `<em>` aparecem em itálico laranja, no padrão atual do site.

### 5.1 Topo
- Logo e botão "Quero a análise" (leva a `#aplicar`).

### 5.2 Hero (fundo escuro, foto da Talita à direita)
- Eyebrow: Análise de Operação e Equipe · para empresários com equipe
- H1: Em 45 minutos, eu te mostro como a sua empresa pode <em>faturar mais com a equipe que você já tem</em>, sem você precisar trabalhar mais.
- Sub: Uma sessão individual e gratuita. Você sai com o **plano de 30 dias** com os pontos que mais travam o seu faturamento e o que fazer primeiro na próxima semana.
- Botão: Quero a análise da minha operação
- Microcopy: Você responde 5 perguntas em 2 minutos, aqui mesmo na página. Se a sua aplicação for aprovada, eu entro em contato para marcar.
- Selos: 45 minutos · Individual · Plano de 30 dias · Gratuita
- Legenda da foto: **Talita Issei** 15 anos em multinacionais como KPMG, Itaú, Vivo e Accenture
- O H1 ficou mais longo que o atual: reduzir o tamanho máximo para cerca de 3rem.

### 5.3 Faixa
OPERAÇÃO ✦ EQUIPE ✦ FATURAMENTO

### 5.4 Sinais (caixas de marcar com contador)
- Eyebrow: Antes de tudo
- Título: Veja se isto acontece <em>na sua empresa</em>
- Apoio: Marque o que se parece com a sua semana.
- Itens:
  1. A entrega chega e você precisa conferir antes de mandar para o cliente.
  2. A entrega volta para ajuste, e o time faz de novo um trabalho que já estava pago.
  3. Você encontra o mesmo erro que já tinha corrigido no mês passado.
  4. Você contratou mais gente, a folha subiu, e o seu trabalho subiu junto.
  5. Você paga uma ferramenta, e os pedidos continuam chegando pelo WhatsApp.
  6. Quem entrou há pouco tempo erra o que o funcionário mais antigo já sabe, e quem ensina é você.
  7. Quando você passa um dia fora, o trabalho fica parado esperando a sua resposta.
  8. Você adia um cliente novo porque não sabe quem vai conseguir entregar.
- Contador: "0 de 8" e o texto "Toque nas frases ao lado. Cada uma é um sinal de que parte do que você paga ao time vai para refazer trabalho e para esperar por você."

### 5.5 O ponto cego (fundo escuro)
- Eyebrow: O ponto cego
- Título: Por que contratar mais gente <em>não aumenta</em> o faturamento na mesma proporção
- Texto: Quando o jeito certo de fazer cada entrega está só na sua cabeça e na do funcionário mais antigo, cada pessoa nova aprende perguntando. A folha sobe, e a parte da sua semana que vai para ensinar e conferir sobe junto.
- Pílulas em ciclo: Entra alguém novo → Aprende perguntando para você → Erra no que não está escrito → Você confere e corrige ↺
- Cartão com borda, dois parágrafos:
  - Isso acontece com times bons e com empresários cuidadosos. Quem entra erra exatamente no que não está escrito. Se você trocar a pessoa, a próxima erra no mesmo ponto. A empresa cresce quando o que o funcionário mais antigo sabe passa a valer para quem entra.
  - Por isso, uma ferramenta nova, a IA ou mais uma contratação costumam acelerar o que já existe na operação, inclusive o retrabalho.

### 5.6 O que você leva dos 45 minutos (fundo bege)
- Eyebrow: A análise
- Título: O que você leva dos <em>45 minutos</em>
- Quatro cartões numerados:
  1. **Se você paga duas vezes pelo mesmo trabalho.** Se você está pagando duas vezes pelo mesmo trabalho: uma para o time fazer e outra para refazer, porque a entrega não saiu certa da primeira vez.
  2. **O que fazer antes de contratar.** Por que contratar mais gente aumenta a folha e o seu trabalho, mas não aumenta o faturamento na mesma proporção, e o que fazer antes da próxima contratação.
  3. **Por que o time não segue o processo.** Por que o time não segue o processo nem usa a ferramenta pela qual você pagou, e o que muda para ele passar a seguir.
  4. **O plano de 30 dias.** O plano de 30 dias com os pontos que mais travam o seu faturamento, e o que fazer primeiro na próxima semana.
- Cartão escuro:
  - O plano de 30 dias <em>é seu</em>, mesmo que a gente não trabalhe junto.
  - Se fizer sentido para o seu caso, no final eu apresento como posso te acompanhar. A decisão de seguir é sua.
  - Botão: Quero a análise da minha operação

### 5.7 Dois caminhos
- Título: Dois caminhos para o <em>seu próximo ano</em>
- Cartão claro. Eyebrow "Se nada mudar", título "O que acontece se nada mudar":
  - Cada pessoa nova aumenta a folha e o que você precisa ensinar e conferir.
  - Parte do que você paga ao time continua indo para refazer entregas.
  - Para atender mais clientes, você precisa trabalhar mais.
- Cartão escuro. Eyebrow "Com a operação organizada", título "O que muda quando o time entrega certo da primeira vez":
  - Menos entregas voltam para ajuste, e as horas do time vão para atender mais clientes.
  - O que o funcionário mais antigo sabe passa a valer para quem entra.
  - O time segue o mesmo padrão, e você para de explicar a mesma coisa.
  - Você atende mais clientes antes de precisar contratar.
  - Sobra tempo para vender e para pensar no crescimento da empresa.
  - Você consegue passar uns dias fora sem o trabalho ficar parado esperando você.
- Botão: Quero a análise da minha operação

### 5.8 Quem vai conversar com você (fundo bege, foto)
- Selo da foto: 15 anos em multinacionais
- Eyebrow: Quem vai conversar com você
- Título: Eu sou a <em>Talita Issei.</em>
- Passei 15 anos em multinacionais como KPMG, Itaú, Vivo e Accenture. Em 4 deles, estive à frente da gestão de equipes e projetos, conduzindo times no dia a dia: definindo prioridades, acompanhando entregas e respondendo pelo resultado.
- Há 5 anos, levo essa experiência para pequenas e médias empresas, como escritórios jurídicos, empresas de educação, de imigração e empresas digitais. Trabalho com o empresário e com o time, na forma como o trabalho é montado, registrado e acompanhado.
- Linha: KPMG · Itaú · Vivo · Accenture

### 5.9 Para quem é esta análise
- É para você: Se você tem 3 ou mais pessoas na equipe e quer que ela atenda mais clientes, sem contratar no mesmo ritmo e sem você trabalhar mais.
- Não é para você: Se você ainda não tem equipe, ou se acha que o time funciona bem sem uma estrutura organizada por trás.

### 5.10 Formulário embutido (`id="aplicar"`, fundo bege)
Coluna da esquerda:
- Eyebrow: Aplicação
- Título: Quero a análise da <em>minha operação</em>
- Apoio: São 5 perguntas e leva 2 minutos.
- Passos numerados:
  1. **Você responde** as 5 perguntas do formulário.
  2. **Eu leio as suas respostas.** Se a sua aplicação for aprovada, eu entro em contato pelo WhatsApp para marcar.
  3. **Fazemos os 45 minutos** por vídeo, no horário que for melhor para você.

Coluna da direita, cartão branco com os campos (todos obrigatórios):

| Campo | Tipo | Opções ou exemplo |
| --- | --- | --- |
| Seu nome | texto | |
| WhatsApp com DDD | telefone | exemplo: (11) 90000-0000 |
| Faturamento médio mensal | escolha única | Até R$ 30 mil · R$ 30 mil a R$ 100 mil · R$ 100 mil a R$ 300 mil · Acima de R$ 300 mil |
| Quantas pessoas tem no seu time (CLT + PJ)? | escolha única | Menos de 3 · 3 a 4 · 5 a 15 · Mais de 15 |
| Qual é o seu maior desafio com o seu time hoje? | texto livre | exemplo: as entregas voltam para ajuste, tudo passa por mim, quem entra demora para aprender. |

- Botão de envio: Quero a análise da minha operação
- Texto legal: Esta é uma aplicação e não garante o agendamento. Ao enviar, você autoriza o uso dos seus dados apenas para avaliar esta aplicação, conforme a nossa Política de Privacidade.

Comportamento:
- As faixas de faturamento são as mesmas que o formulário atual já usa, para os dados novos serem comparáveis com os antigos. Manter os mesmos valores gravados na planilha.
- O envio usa o mesmo destino do formulário atual (a planilha do Apps Script), com o mesmo rastreamento de UTM, Pixel e GA4.
- Campo vazio mostra erro no próprio campo, sem alerta do navegador.
- Depois do envio, mostrar uma confirmação na própria página ou levar para `obrigada.html`, conforme o fluxo atual de agendamento.
- No celular, a barra fixa com o botão some enquanto o formulário está na tela, para não cobrir os campos.
- A rolagem dos botões até `#aplicar` é suave, e respeita quem pede menos movimento (`prefers-reduced-motion`).

### 5.11 Perguntas frequentes
- Eyebrow: Dúvidas · Título: Perguntas frequentes
- Resumo: Na Análise de Operação e Equipe, em 45 minutos, eu te mostro como a sua empresa pode faturar mais com a equipe que você já tem, sem você precisar trabalhar mais. Você sai com o plano de 30 dias.
- Perguntas:
  1. **Quanto custa?** Nada. A análise é gratuita.
  2. **Preciso levar números ou relatórios?** Não. Eu faço as perguntas e você responde com o que sabe da sua semana. Se puder, deixe aberta a ferramenta que o time usa para organizar o trabalho, para me mostrar uma tarefa.
  3. **Já tentei ferramenta, consultoria ou contratar um gerente e nada mudou. Serve para mim?** Serve. Na conversa, eu olho o que já foi feito: quem montou o processo, onde ele ficou e se alguém acompanhou até o time usar. É aí que costuma estar o motivo de não ter funcionado.
  4. **O meu time não segue processo nenhum. Por onde começa?** Pela entrega que mais volta para ajuste ou que mais passa pela sua mão. É ela que entra no plano de 30 dias como primeiro ponto.
  5. **Estou sem tempo nenhum. Faz sentido agendar?** São 45 minutos. Se a maior parte da sua semana vai para conferir e responder o time, é desse tempo que a conversa trata.
  6. **Vou receber uma proposta no final?** Se fizer sentido para o seu caso, sim. Eu apresento como posso te acompanhar para colocar o plano em prática. A decisão é sua, e o plano fica com você de qualquer forma.
  7. **A minha empresa é de um segmento diferente. Funciona?** Já trabalhei com escritórios jurídicos, empresas de educação, de imigração e empresas digitais. O serviço muda de uma empresa para outra. A forma de encontrar o que trava a operação é a mesma.

### 5.12 Por que agora (fundo escuro)
- Eyebrow: Por que agora
- Texto: O fim do ano é quando você planeja 2027 e decide se vai contratar. Antes da próxima contratação, vale saber se você está pagando duas vezes pelo mesmo trabalho.
- Título: Em 45 minutos, veja onde a sua operação trava o faturamento <em>e o que fazer primeiro.</em>
- Botão: Quero a análise da minha operação
- Micro: Análise gratuita · 45 minutos · Individual

### 5.13 Rodapé
Igual ao atual.

## 6. Metadados e partes técnicas

- Title: Análise de Operação e Equipe | Boutique Empresarial
- Meta description, Open Graph e Twitter: Em 45 minutos, eu te mostro como a sua empresa pode faturar mais com a equipe que você já tem, sem você precisar trabalhar mais.
- JSON-LD: `FAQPage` com as 7 perguntas acima, com o texto idêntico ao visível. A descrição do serviço é o resumo da seção 5.11, e o nome do serviço é "Análise de Operação e Equipe".
- Atualizar `public/index.md`, `public/llms.txt`, `public/llms-full.txt` e as descrições das ferramentas WebMCP da home com o nome e a promessa novos.
- Em `docs/specs/HARNESS_AEO.md` §B6, incluir "Análise de Operação e Equipe" no vocabulário controlado.
- Atualizar os testes que fixam o texto antigo: `tests/home.spec.js`, `tests/seo.spec.js` e `tests/aeo.spec.js`.
- Remover o JS da calculadora. Manter o JS do contador de sinais.
- O `formulario.html` atual continua no ar para os links antigos, mas a home não aponta mais para ele.

## 7. Pronto quando

- `npm run gate` verde.
- Nenhuma ocorrência de "dono", de preço ou de "Diagnóstico Gratuito" no texto da home.
- Nenhuma seção de resultados ou depoimento na página.
- Todos os botões da página levam a `#aplicar`.
- O formulário grava os 5 campos na planilha, com UTM, e o teste de envio não manda dados para produção (ver `docs/specs/adr-e2e-nao-enviar-formulario-para-producao.md`).
- No celular (390px), nada rola para os lados e a barra fixa não cobre o formulário.
