// Copy do diagnóstico conversacional (Fase 5) — docs/specs/pages/aplicacao-conversacional.md §2.1/§6.
// Módulo de dados, sem lógica de UI. Compartilhado por formulario.html e obrigada.html.
(function (global) {
  "use strict";

  // Bloco de análise por etapa: kicker fixo por pergunta, axis/text por resposta.
  // Chaveado pelo campo que ALIMENTA o bloco (a pergunta cuja resposta é lida).
  var ANALISE = {
    maior_problema_gestao: {
      kicker: "O que eu vou analisar no seu caso",
      by: {
        "Equipe dependente / preciso aprovar quase tudo": {
          axis: "Dependência de aprovação",
          text: "Na sua sessão eu mapeio quais tarefas travam na sua mão ao longo do dia e quais decisões a sua equipe já deve tomar sozinha.",
        },
        "Falta de padrão nas entregas e retrabalho": {
          axis: "Erros de execução e refação",
          text: "Na sua sessão eu localizo em qual etapa da prestação do serviço acontecem as falhas repetidas, para você parar de refazer o trabalho do funcionário.",
        },
        "Informações perdidas e excesso de mensagens no WhatsApp": {
          axis: "Fluxo de informação",
          text: "Na sua sessão eu avalio como os pedidos e prazos são repassados no WhatsApp, para você acompanhar as entregas sem precisar mandar mensagem cobrando o tempo todo.",
        },
        Outro: {
          axis: "Os três eixos da operação",
          text: "Na sua sessão eu percorro os três eixos — dependência de aprovação, erros de execução e fluxo de informação — para localizar onde a sua operação trava.",
        },
      },
    },
    modelo_negocio: {
      kicker: "Como isso muda a análise",
      by: {
        "Agência / Assessoria": {
          axis: "Entrega recorrente, cliente a cliente",
          text: "Em agência e assessoria eu começo pelo que se repete em toda conta: quanto da entrega já está descrito e quanto ainda mora na cabeça de quem executa.",
        },
        "Consultoria / Mentoria": {
          axis: "A entrega que nasce em você",
          text: "Em consultoria e mentoria a entrega tende a ficar colada em você. Eu olho o que pode ser padronizado sem descaracterizar o seu método.",
        },
        "Prestação de Serviços B2B": {
          axis: "O combinado de cada contrato",
          text: "No B2B eu acompanho como cada contrato é conduzido, e onde o que foi combinado com o cliente se perde entre quem vende e quem executa.",
        },
        "Prestação de Serviços B2C": {
          axis: "Volume e repetição",
          text: "No B2C o volume expõe qualquer falha de padrão. Eu olho o que a sua equipe faz muitas vezes ao dia e como isso é conferido antes de chegar ao cliente.",
        },
        Outro: {
          axis: "A sua operação, no seu formato",
          text: "Antes de falar de estrutura, eu entendo como a sua entrega acontece hoje — é isso que define o que vale padronizar primeiro.",
        },
      },
    },
    tamanho_equipe: {
      kicker: "A prioridade no seu tamanho de operação",
      by: {
        "Apenas eu": {
          axis: "Estrutura antes da primeira contratação",
          text: "Sozinha, o risco não é o time: é você se tornar o gargalo de um negócio que ainda vai crescer. Eu olho o que precisa estar descrito antes da primeira contratação.",
        },
        "2 a 4 colaboradores": {
          axis: "A saída do combinado verbal",
          text: "Com até quatro pessoas quase tudo funciona por combinado verbal. Eu olho quais rotinas já precisam existir por escrito para o time não parar quando você não responde.",
        },
        "5 a 15 colaboradores": {
          axis: "A camada de coordenação",
          text: "De 5 a 15 pessoas a operação passa a precisar de coordenação, e não só de execução. Eu olho quem decide o quê, e onde essa decisão hoje volta para você.",
        },
        "Mais de 15 colaboradores": {
          axis: "Padrão que se replica",
          text: "Acima de 15 pessoas o que trava raramente é esforço: é a falta de um padrão replicável. Eu olho como a sua operação se sustenta quando entra mais uma equipe.",
        },
      },
    },
    faturamento_mensal: {
      kicker: "Como eu calibro a sessão",
      by: {
        "Até R$ 30 mil/mês": {
          axis: "Uma frente por vez",
          text: "Nessa faixa eu prefiro apontar uma frente só: a que devolve mais tempo para você com o menor ajuste na rotina.",
        },
        "R$ 30 mil a R$ 100 mil/mês": {
          axis: "Organização que acompanha o crescimento",
          text: "Nessa faixa a operação costuma ter crescido mais rápido que a organização. Eu olho o que precisa ser ajustado agora para o próximo salto não custar a sua rotina.",
        },
        "R$ 100 mil a R$ 300 mil/mês": {
          axis: "Previsibilidade da entrega",
          text: "Nessa faixa o tema deixa de ser vender e passa a ser entregar sempre no mesmo padrão. Eu olho em que ponto a entrega oscila.",
        },
        "Acima de R$ 300 mil/mês": {
          axis: "Estabilidade da operação",
          text: "Nessa faixa a conversa é estabilidade: o que precisa existir para a operação não depender da sua presença diária.",
        },
      },
    },
  };

  // [Tamanho do Time]: forma que encaixa depois de "com …".
  var TIME_COM = {
    "Apenas eu": "apenas você",
    "2 a 4 colaboradores": "um time de 2 a 4 pessoas",
    "5 a 15 colaboradores": "um time de 5 a 15 pessoas",
    "Mais de 15 colaboradores": "um time de mais de 15 pessoas",
  };

  // [Faturamento]: forma que encaixa depois de "faturamento de …".
  var FAT_DE = {
    "Até R$ 30 mil/mês": "até R$ 30 mil/mês",
    "R$ 30 mil a R$ 100 mil/mês": "R$ 30 mil a R$ 100 mil/mês",
    "R$ 100 mil a R$ 300 mil/mês": "R$ 100 mil a R$ 300 mil/mês",
    "Acima de R$ 300 mil/mês": "mais de R$ 300 mil/mês",
  };

  // eixo ← maior_problema_gestao
  var AXIS_SLUG = {
    "Equipe dependente / preciso aprovar quase tudo": "dependencia",
    "Falta de padrão nas entregas e retrabalho": "retrabalho",
    "Informações perdidas e excesso de mensagens no WhatsApp": "informacao",
    Outro: "outro",
  };

  // segmento ← modelo_negocio
  var SEG_SLUG = {
    "Agência / Assessoria": "agencia",
    "Consultoria / Mentoria": "consultoria",
    "Prestação de Serviços B2B": "b2b",
    "Prestação de Serviços B2C": "b2c",
    Outro: "segmento_outro",
  };

  // Fechamento — uma entrada por combinação eixo × segmento (20). Chave: `${eixo}_${segmento}`.
  var FECHAMENTO = {
    dependencia_agencia: "[Nome], tocar uma agência com [Tamanho do Time] e faturamento de [Faturamento] aprovando cada entrega final limita a capacidade da empresa. Na sessão vamos alinhar onde e como passar autonomia para o time.",
    dependencia_consultoria: "[Nome], uma consultoria com [Tamanho do Time] e faturamento de [Faturamento] não aceita novos projetos se cada decisão depende de você. Na sessão vamos criar a rotina para liberar sua agenda.",
    dependencia_b2b: "[Nome], serviços B2B com [Tamanho do Time] e faturamento de [Faturamento] pedem agilidade no atendimento. Se você revisa tudo, a entrega atrasa. Na sessão vamos desenhar o processo para o time andar sozinho.",
    dependencia_b2c: "[Nome], sua operação B2C com [Tamanho do Time] e faturamento de [Faturamento] precisa rodar sem sua presença constante. Na sessão vamos ajustar o fluxo para o time tocar o dia a dia.",
    dependencia_segmento_outro: "[Nome], uma empresa com [Tamanho do Time] e faturamento de [Faturamento] para de crescer se toda decisão precisa da sua aprovação. Na sessão vamos mapear como passar tarefas para a equipe.",
    retrabalho_agencia: "[Nome], uma agência com [Tamanho do Time] e faturamento de [Faturamento] reduz a margem de lucro cada vez que um trabalho volta por falta de padrão. Na sessão vamos montar o passo a passo que evita refação.",
    retrabalho_consultoria: "[Nome], sua consultoria com [Tamanho do Time] e faturamento de [Faturamento] perde produtividade quando a equipe entrega trabalhos fora do padrão. Na sessão vamos alinhar o método exato de execução.",
    retrabalho_b2b: "[Nome], serviços B2B com [Tamanho do Time] e faturamento de [Faturamento] exigem padronização para manter o custo previsto no contrato. Na sessão vamos ajustar os processos de entrega da equipe.",
    retrabalho_b2c: "[Nome], no B2C com [Tamanho do Time] e faturamento de [Faturamento], erros na entrega fazem o cliente buscar concorrentes. Na sessão vamos estruturar a lista de checagem do serviço.",
    retrabalho_segmento_outro: "[Nome], com [Tamanho do Time] e faturamento de [Faturamento], o time refaz trabalho por falta de instruções escritas. Na sessão vamos organizar o padrão de entrega das tarefas.",
    informacao_agencia: "[Nome], sua agência com [Tamanho do Time] e faturamento de [Faturamento] não pode perder prazos por pedidos perdidos em mensagens. Na sessão vamos organizar o canal oficial de informações do time.",
    informacao_consultoria: "[Nome], sua consultoria com [Tamanho do Time] e faturamento de [Faturamento] perde tempo quando dados de clientes somem em conversas soltas. Na sessão vamos organizar esse registro.",
    informacao_b2b: "[Nome], uma empresa B2B com [Tamanho do Time] e faturamento de [Faturamento] precisa de alinhamentos registrados para evitar cobranças indevidas. Na sessão vamos padronizar onde as informações ficam salvas.",
    informacao_b2c: "[Nome], com [Tamanho do Time] e faturamento de [Faturamento], usar aplicativo de mensagem para comandar o time gera desorganização. Na sessão vamos definir os canais e responsáveis de cada tarefa.",
    informacao_segmento_outro: "[Nome], com [Tamanho do Time] e faturamento de [Faturamento], perder prazos por orientações espalhadas em mensagens gera custos. Na sessão vamos centralizar o fluxo de trabalho.",
    outro_agencia: "[Nome], sua agência com [Tamanho do Time] e faturamento de [Faturamento] tem demandas bem específicas. Na sessão vamos analisar a rotina atual e ajustar o que está atrasando o time.",
    outro_consultoria: "[Nome], sua consultoria com [Tamanho do Time] e faturamento de [Faturamento] exige organização sob medida. Na sessão vamos analisar o trabalho da equipe e simplificar os processos.",
    outro_b2b: "[Nome], serviços B2B com [Tamanho do Time] e faturamento de [Faturamento] lidam com rotinas operacionais detalhadas. Na sessão vamos identificar onde simplificar a rotina da equipe.",
    outro_b2c: "[Nome], sua operação B2C com [Tamanho do Time] e faturamento de [Faturamento] tem problemas práticos de rotina. Na sessão vamos organizar o passo a passo do atendimento e da entrega.",
    outro_segmento_outro: "[Nome], com [Tamanho do Time] e faturamento de [Faturamento], cada empresa tem falhas específicas na operação. Na sessão vamos mapear a rotina do seu time e organizar as etapas.",
  };

  // Replace literal dos três tokens — a copy é editada pela autora, não deve exigir
  // toque em código (template string exigiria). Sem [Nome], a frase abre sem vocativo.
  function preencher(tpl, vars) {
    var out = tpl;
    Object.keys(vars).forEach(function (token) {
      out = out.split(token).join(vars[token]);
    });
    if (!vars["[Nome]"]) {
      out = out.replace(/^,\s*/, "");
      out = out.charAt(0).toUpperCase() + out.slice(1);
    }
    return out;
  }

  global.FormCopy = {
    ANALISE: ANALISE,
    TIME_COM: TIME_COM,
    FAT_DE: FAT_DE,
    AXIS_SLUG: AXIS_SLUG,
    SEG_SLUG: SEG_SLUG,
    FECHAMENTO: FECHAMENTO,
    preencher: preencher,
  };
})(window);
