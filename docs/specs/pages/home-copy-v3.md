# SDD — Copy v3 da Home (`index.html`): empresários e líderes de equipe

*   **Status**: Implementado (PR a abrir). Decisões D1–D6 fechadas pelo Issei em 2026-10-25; formulário novo já no ar (PR #55). A §10 (`/design-sync` depois do merge) fica dispensada por decisão do Issei em 2026-10-27 ("Dispensar nos dois").
*   **Fonte**: "PÁG EMPRESÁRIO E GP.md" (Talita, 2026-10-25), texto literal
*   **Substitui**: `docs/specs/pages/home-e-aplicacao-copy-v2.md` §1 e §4 (só a parte da Home). O §2 (formulário) da v2 deixa de valer quando a spec do formulário (thread paralela) for aprovada
*   **Arquivos afetados**: `src/index.html`, `public/index.md`, `public/llms.txt`, `public/llms-full.txt`, `tests/home.spec.js`; `public/.well-known/agent-skills/boutique-brand-voice/SKILL.md` (só a linha do público, D5)
*   **Não afetados (fora do escopo para não colidir com a thread do formulário)**: `src/formulario.html`, `src/js/form-copy.js`, `e2e/form-aplicacao.spec.js`, `src/obrigada.html`, `src/diagnostico*.html`, Apps Script, contrato de dados, Pixel/CAPI/GA4
*   **Natureza**: troca de copy, mudança de público (dono → dono **e** líder de equipe), corte da equipe mínima (5 → 3 pessoas), 1 bloco visual novo (a "agenda do dia"), FAQ trocado

---

## 0. Regra de ouro

Só texto, ordem e estrutura das seções mudam. Destino dos botões (`/formulario.html`), preservação de UTM (`attribution.js`), barra fixa do mobile, cabeçalho, rodapé, cookies e eventos de rastreamento ficam como estão. Texto da tela é **literal** do documento da Talita. **Regra do Issei (2026-10-25): o que a copy nova não traz, sai.** Onde a página precisa obrigatoriamente de um texto (title, description, resumo AEO, JSON-LD), ele é montado só com frases literais da copy, sem frase nova.

## 1. O que muda de fundo (resumo para quem revisa)

| Tema | Hoje (v2) | v3 |
| :-- | :-- | :-- |
| Público | Donos de empresas de serviço com equipe a partir de 5 | Empresários **e líderes de equipe**, time de 3 ou mais pessoas |
| Promessa | Sessão analisa a **operação** (processos, papéis, indicadores) | Diagnóstico mostra **por que o time depende tanto de você** (forma de conduzir a equipe) |
| Voz | Analiso / mapeio / identifico | Olhamos juntos / você descobre |
| CTA | `Quero agendar meu diagnóstico` | `Quero entender por que o meu time me procura tanto` |
| Seções | 12 | 12, com conteúdo e ordem diferentes (ver §2) |
| FAQ | 5 perguntas | 6 perguntas novas |

Consequência que amarra as duas threads: a home passa a convidar **gerentes** e **times de 3 a 4 pessoas**. O formulário de hoje não tem caminho para gerente e trata "2 a 4 colaboradores" como faixa abaixo do corte. Ver decisão **D1**.

## 2. Ordem final das seções

Os `###` vazios do documento foram lidos como divisões de bloco; os títulos de seção são os negritos que abrem cada trecho. Fundos seguem o ritmo atual (creme/branco com filete, escuro para autoridade e fechamento).

| # | Seção | Fundo | Origem |
| :-- | :--- | :--- | :--- |
| 1 | Cabeçalho | creme | inalterado |
| 2 | Hero | creme | §3.1 — copy nova |
| 3 | Veja se o seu dia se parece com este. | creme, filete | §3.2 — **nova** (substitui "Você se reconhece…") |
| 4 | O que olhamos juntos nos 45 minutos | branco, filete | §3.3 — 3 cartões, copy nova, + linha de resultado em itálico |
| 5 | O que muda quando o time sabe o que pode decidir sem você | creme | §3.4 — lista, 6 itens |
| 6 | O que acontece se nada mudar | creme, filete | §3.5 — lista, 3 itens |
| 7 | Quem vai conversar com você | tinta (escuro) | §3.6 — foto mantida, copy nova |
| 8 | Talvez esta conversa não seja para você | creme | §3.7 — parágrafo único (substitui "Para quem é" + "Para quem não é") |
| 9 | Perguntas frequentes | creme, filete | §3.8 — 6 itens + `.aeo-tldr` |
| 10 | Como funciona | branco, filete | §3.9 — 3 passos + botão |
| 11 | Fechamento | tinta (escuro) | §3.10 — título novo + botão |
| 12 | Rodapé | creme | inalterado |

Diferença de ordem em relação à v2: no documento, **Perguntas frequentes vem antes de Como funciona**, e "Como funciona" emenda direto no fechamento. A spec segue o documento.

## 3. Copy literal por seção

### 3.1 Hero
*   Eyebrow (`.eyebrow`): `Para empresários e líderes de equipe` (D2: decidido, sem o número)
*   `h1`: `Quantas vezes o seu time te procurou hoje?`
*   Texto (`.lead`): `E quantas dessas vezes precisavam mesmo de você? Em um diagnóstico de 45 minutos, eu te mostro por que o time depende tanto de você e o que mudar primeiro na forma de conduzir a equipe.`
*   Botão: `Quero entender por que o meu time me procura tanto`
*   Abaixo do botão (`.hero-nota`): `Diagnóstico gratuito. Você preenche em 2 minutos e eu entro em contato.`
*   Linha de credibilidade (`.hero-cred`): **sai** (D3). A primeira dobra termina na `.hero-nota`.

### 3.2 Veja se o seu dia se parece com este.
`h2`: `Veja se o seu dia se parece com este.`

Agenda do dia — lista ordenada; o horário é um rótulo à esquerda (Inter 600, cor `--gold` ou tinta, largura fixa para alinhar), o texto ao lado. Reaproveita o filete dourado da `.pain-list`; no mobile o horário fica acima do texto. Marcação semântica: `<ol class="agenda">` com `<li><time>8h10</time> …</li>` (sem atributo `datetime`, é ilustrativo).

1. **8h10.** `Alguém te faz uma pergunta que poderia ter resolvido sozinho.`
2. **9h30.** `Chega um problema sem nenhuma ideia de solução, e quem resolve é você.`
3. **11h.** `Você manda mensagem para cada pessoa para saber como está cada entrega.`
4. **14h.** `A pessoa que entrou há um mês pergunta, pela terceira vez, algo que você já explicou.`
5. **16h.** `Um cliente pede uma resposta, e ninguém do time se sente seguro para dar sem falar com você.`
6. **17h30.** `Você queria dar um retorno para alguém sobre a semana, mas não sobrou tempo.`
7. **18h.** `O seu próprio trabalho ainda não começou.` (último item com destaque: peso maior, é o fecho da cena)

Parágrafo (`margin-top 40px`): `E quando uma entrega atrasa, é você quem explica, para o cliente ou para quem cobra resultado de você. Muitas vezes, você foi o último a saber do atraso.`

Caixa "conta rápida" (fundo branco, borda `--be-border`, padding 32px; é um exercício, então vem destacada da lista):
*   Título (`h3`): `Faça uma conta rápida.`
*   `Pense no dia de ontem. Quantas vezes alguém do time te procurou? Agora separe essas vezes em dois grupos: as que precisavam de uma autorização sua e as que a pessoa poderia ter resolvido sozinha se soubesse que podia.`
*   `Se o segundo grupo for o maior, já dá para ver de onde vem a falta de tempo. O próximo passo é descobrir o que o seu time pode decidir sem você.`

### 3.3 O que olhamos juntos nos 45 minutos
`h2` + 3 cartões (`.achados-grid`, `01`/`02`/`03`). Cada cartão: `h3`, parágrafo, e uma linha final em itálico (nova classe `.achado-ganho`, Inter 400 itálico, cor `--be-ink`, `margin-top 16px`).

*   **Como você acompanha o time** — `Se existe um momento fixo na semana para olhar pendências, prioridades e quem é responsável por cada coisa. E onde essas informações ficam: em um lugar só ou espalhadas no WhatsApp, na memória das pessoas e em várias ferramentas.` — *`Você descobre por que precisa perguntar o status de tudo.`*
*   **Como as decisões chegam até você** — `Quantas vezes por dia o time te procura, para decisões simples ou para decisões que precisam mesmo da sua autorização. E se você decide com números sobre o time ou pela sensação do momento.` — *`Você descobre o que pode parar de chegar até você.`*
*   **O que já custou caro** — `Dois ou três erros ou retrabalhos dos últimos meses e quanto eles custaram em tempo ou dinheiro.` — *`Você vê, com os seus próprios exemplos, o preço de deixar como está.`*

Fechamento da seção (`.achados-fecho`, substitui o "Ao final, você sai com clareza…"): **`Antes de qualquer proposta, falamos sobre o seu momento:`** `quanto tempo você tem e quem do time pode participar da mudança. Se não for a hora, eu te digo com franqueza.`

### 3.4 O que muda quando o time sabe o que pode decidir sem você
`h2` + `.pain-list`:
1. `Quem traz um problema já chega com uma proposta, e você aprova ou ajusta.`
2. `Na segunda-feira, você já sabe o que cada pessoa vai entregar na semana.`
3. `Você tem horários do dia sem interrupção para fazer o seu trabalho.`
4. `Quem entra no time aprende sem depender de você repetir tudo.`
5. `Sobra tempo para dar retorno ao time, e o mesmo erro deixa de se repetir.`
6. `Você consegue tirar uns dias sem levar o notebook.`

### 3.5 O que acontece se nada mudar
`h2` + `.pain-list`:
1. `Cada pessoa nova que entra traz mais perguntas para você.`
2. `Você continua cobrando pendências uma por uma, todos os dias.`
3. `Sem tempo para dar retorno, o time repete os mesmos erros e você continua corrigindo.`

Observação: os itens 2 e 3 de "muda" e "nada mudar" se espelham de propósito (cobrar pendência ↔ saber na segunda; erro repetido ↔ erro deixa de se repetir). Não reordenar.

### 3.6 Quem vai conversar com você
Seção `.autoridade` (foto + texto, `--container-wide`), mesma foto e `alt`.
*   `h2`: `Quem vai conversar com você`
*   `.autoridade-nome`: **sai** (a copy não traz a linha de nome; o nome já abre o parágrafo 1)
*   Parágrafo 1: `Eu sou a Talita Issei. Passei 15 anos em multinacionais como KPMG, Itaú, Vivo e Accenture. Em 4 deles, estive à frente da gestão de equipes e projetos, conduzindo times no dia a dia: definindo prioridades, acompanhando entregas e respondendo pelo resultado.`
*   Parágrafo 2: `Há 5 anos, levo essa experiência para pequenas e médias empresas, trabalhando com empresários e líderes na forma como eles conduzem o próprio time.`

### 3.7 Talvez esta conversa não seja para você
`h2`: `Talvez esta conversa não seja para você`

Parágrafo único: `Ela não serve para quem trabalha sozinho, para quem ainda não tem equipe nem para quem procura estratégia de marketing ou vendas. Ela é para empresários e líderes com um time de 3 ou mais pessoas que sentem que tudo passa por eles e querem mudar isso agora.`

Sai a lista "Para quem é" (empresas de serviço, carteira em crescimento, sair do operacional) e o "Para quem não é" separado. Note que "negócios em fase inicial" deixa de ser excludente e "empresas de serviço" deixa de ser requisito.

### 3.8 Perguntas frequentes
Mesmo bloco `AEO-BODY` (filete → `h2` → `.aeo-tldr` → `.aeo-faq`). 6 `<details>`, nesta ordem, e o JSON-LD `FAQPage` com **exatamente** as mesmas 6 perguntas e respostas:

1. **Quanto custa?** — `Nada. O diagnóstico é gratuito.`
2. **Preciso mudar a empresa inteira para isso funcionar?** — `Não. As mudanças acontecem na forma como você conduz o seu time: como ele traz os problemas, como você acompanha as entregas e quando você está disponível.`
3. **Já faço reunião com o time e nada mudou. Serve para mim?** — `Serve. Na conversa, eu olho como as suas reuniões acontecem hoje: o que se decide nelas, quem sai com o quê e como isso é acompanhado durante a semana.`
4. **Estou sem tempo nenhum. Faz sentido agendar?** — `Faz, se você quer entender de onde vem a falta de tempo. No final, conversamos sobre o seu momento. Se não for a hora de mudar, eu te digo.`
5. **Vou receber uma proposta no final?** — `Se fizer sentido para o seu momento, sim. A decisão é sua, e o que você descobriu fica com você de qualquer forma.`
6. **Preciso preparar alguma coisa?** — `Não é obrigatório. Mas ajuda lembrar de dois ou três erros ou retrabalhos dos últimos meses. São eles que mostram, com a sua realidade, o que precisa mudar.`

`.aeo-tldr` (exigido por HARNESS_AEO §B3 e `tests/aeo.spec.js`; D4, só frase literal — 2ª frase do hero):

`Em um diagnóstico de 45 minutos, eu te mostro por que o time depende tanto de você e o que mudar primeiro na forma de conduzir a equipe.`

### 3.9 Como funciona
`h2` + `.passos` (`01`–`03`):
1. `Você preenche o formulário em 2 minutos.`
2. `Eu entro em contato para entender o momento do seu time.`
3. `Marcamos os 45 minutos no horário que for melhor para você.`

O documento põe o botão só no fechamento. Para não ter dois botões colados (Como funciona → Fechamento ficam vizinhos), **sai o botão de "Como funciona"**. Ver §5.

### 3.10 Fechamento
Seção escura, como hoje:
*   Frase (`.fechamento-frase`): `Descubra em 45 minutos quais decisões o seu time pode tomar sem você.`
*   Botão: `Quero entender por que o meu time me procura tanto`

## 4. Head, dados estruturados e companions

| Item | Hoje | v3 |
| :-- | :-- | :-- |
| `<title>` | `Diagnóstico Gratuito de Operação \| Boutique Empresarial` | `Diagnóstico Gratuito \| Boutique Empresarial` (43; D4) |
| `meta description` (50–160) | fala de "operação" | `Quantas vezes o seu time te procurou hoje? E quantas dessas vezes precisavam mesmo de você?` (D4) |
| `og:title` / `og:description` | idem | acompanham title/description |
| JSON-LD `Service.audience` | `Donos e sócios de empresas de serviço com equipe a partir de 5 colaboradores` | trecho literal de §3.7: `empresários e líderes com um time de 3 ou mais pessoas` |
| JSON-LD `Service.description` | analisa a operação | 2ª frase do hero, literal: `Em um diagnóstico de 45 minutos, eu te mostro por que o time depende tanto de você e o que mudar primeiro na forma de conduzir a equipe.` |
| JSON-LD `Service.serviceType` | `Diagnóstico operacional` | campo opcional do schema.org: **sai** (a copy não traz um tipo) |
| JSON-LD `ProfessionalService.description` / `knowsAbout` | "Arquitetura de Negócios… sem depender da fundadora" | **não mexer neste PR** (é a descrição da empresa, não da página); listar no PR como resíduo |
| JSON-LD `Person#talita.description` | já bate com §3.6 | sem mudança |
| JSON-LD `FAQPage` | 5 itens | os 6 de §3.8, idênticos à tela |
| `WebPage.name` / `dateModified` | — | acompanha o `<title>`; data do merge |
| `public/index.md`, `llms.txt`, `llms-full.txt` | espelham a v2 | reescritos com §3 |
| `og-image.jpg` | arte da v2 | fora do escopo; listar no PR se o texto da imagem contradiz a v3 |

## 5. Botões e barra fixa

*   Rótulo único: `Quero entender por que o meu time me procura tanto` (49 caracteres; o atual tem 30). Destino `/formulario.html`, laranja `--be-accent`.
*   Botões em fluxo: **2** (hero, fechamento) em vez de 3. Com a barra fixa do mobile, `a.btn` passa de 4 para **3** no DOM. `tests/home.spec.js` muda a contagem e o literal `CTA`.
*   Barra fixa no mobile: o rótulo quebra em 2 linhas a 375 px (D6). Mesma fonte; `body { padding-bottom }` ajustado à altura real da barra.

## 6. Componentes novos/alterados (CSS em `index.html`, sem JS)

1.  `.agenda` (§3.2): lista ordenada com horário à esquerda. Grade `5.5rem 1fr` acima de 640 px; empilhado abaixo. Sem animação.
2.  `.conta-rapida` (§3.2): caixa branca com borda.
3.  `.achado-ganho` (§3.3): linha final em itálico nos cartões.
4.  `.nao-e` passa a ser um parágrafo normal sob `h2`; a lista "Para quem é" sai.
5.  Remover o botão de `.selecao` (`.selecao-cta`).
6.  Remover `.hero-cred` do hero e o CSS dela (D3).

Regra do repo (`CLAUDE.md` do site, regra 3): a "agenda do dia" é UI nova; criar `docs/specs/design/home-agenda-do-dia.md` com o desenho acima antes de implementar, e rodar `/design-sync` na sessão local antes de gerar HTML.

## 7. Busca obrigatória antes de editar (listar no PR)

```
grep -rn "Quero agendar meu diagnóstico" src e2e tests public scripts
grep -rn "a sua equipe ainda depende" src e2e tests public
grep -rn "5 colaboradores\|5 pessoas\|5 ou mais" src public tests
grep -rn "empresas de serviço" src public
grep -rn "Quem conduz a sua análise\|O que analisamos" src tests public
```

Ocorrências em `src/formulario.html`, `src/js/form-copy.js` e `e2e/form-aplicacao.spec.js` **não** são editadas aqui: pertencem à thread do formulário. Só listar.

## 8. Critérios de aceite

1.  As 12 seções de §2, na ordem, com texto idêntico caractere a caractere aos literais de §3.
2.  Um único `h1`; títulos de seção em `h2`; cartões e "Faça uma conta rápida." em `h3`.
3.  Exatamente 3 `a.btn` no DOM (2 em fluxo + barra fixa), todos com o rótulo de §5 e `href="/formulario.html"`; UTM preservada no clique.
4.  `.agenda` com 7 itens, horários na ordem 8h10 → 18h; em 375 px sem rolagem horizontal.
5.  `FAQPage` com 6 perguntas idênticas às `<details>` (`tests/aeo.spec.js` verde); `.aeo-tldr` visível.
6.  `title` 10–60 e description 50–160 (`tests/seo.spec.js` verde).
7.  `public/index.md` e `llms*.txt` sem nenhuma frase da v2 que a v3 removeu (grep do §7 limpo em `public/`).
8.  `git diff --stat` não toca nenhum arquivo da lista "Não afetados".
9.  Em 375 px, a última linha do rodapé fica visível acima da barra fixa (D6).
10. `npm run gate` verde (unit, a11y, contraste do botão ≥ 5:1, sem regressão de CLS).

## 9. Decisões (todas fechadas)

*   **D1 — Ordem de publicação com o formulário. DECIDIDO (Issei, 2026-10-25):** a home v3 só vai ao ar **junto com ou depois** do formulário novo. PR separado; merge em `main` só quando o formulário novo estiver no ar ou no mesmo dia.
*   **D2 — Eyebrow. DECIDIDO (Issei, 2026-10-25):** manter o texto da home, `Para empresários e líderes de equipe`. O corte de 3 pessoas aparece só em §3.7. A diferença para o eyebrow do formulário é intencional. **Revisto em 2026-10-29:** a Talita disse que a diferença não era intencional e o formulário passou a usar o texto da home.
*   **D3 — Credibilidade no hero. DECIDIDO (Issei, 2026-10-25):** tirar, como na copy nova. Remover `.hero-cred` (HTML e CSS); a autoridade fica só em §3.6.
*   **D4 — Title, description e resumo AEO. DECIDIDO (Issei, 2026-10-25):** só frases literais da copy (§3.8 e §4). Contrato AEO e gate sem mudança.
*   **D5 — `boutique-brand-voice/SKILL.md`. DECIDIDO (Issei, 2026-10-25):** atualizar no mesmo PR, só a linha do público, com o trecho literal `empresários e líderes com um time de 3 ou mais pessoas`.
*   **D6 — Barra fixa do mobile. DECIDIDO (Issei, 2026-10-25):** aceitar o rótulo em 2 linhas, mesma fonte dos outros botões; aumentar o `padding-bottom` do `body` (hoje 88px) na medida da barra nova para ela não cobrir o rodapé.

## 10. Depois do merge

Protocolo de sync (`/design-sync`), status deste arquivo para "Implementado" com link do PR, e status da v2 (§1/§4) para "Substituído pela v3".

