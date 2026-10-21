# SDD — Reescrita de copy: Home (`index.html`) e Aplicação (`formulario.html`)

*   **Status**: Aprovado — em implementação (PR da branch `claude/project-thread-8yo8og`)
*   **Arquivos afetados**: `src/index.html`, `src/formulario.html`, `src/obrigada.html` (só §5), JSON-LD de FAQ em `src/index.html`, `public/*.md` / `llms.txt` se espelharem a Home, testes que citem os textos trocados (§7)
*   **Não afetados**: `src/js/form-copy.js`, `apps_script_atualizado.gs`, contrato de dados (`formulario.md` §3), rastreamento Pixel/CAPI/GA4, consentimento, `noindex` do formulário
*   **Referência visual**: Design System → `ui_kits/site/index.html` (telas Home e Aplicação). É referência de aparência. Todos os valores estão transcritos abaixo; **não** copiar `.jsx`
*   **Natureza**: troca de copy + 4 seções novas na Home + reordenação. Nenhuma chave, `name`, `id` de campo ou ordem de etapa muda

---

## 0. Regra de ouro

Só texto e estrutura de seções mudam. Se uma alteração tocar `name=`, `id=` de campo, ordem das 7 etapas, os textos das **opções** do formulário, ou os eventos `fbq`/`gtag`, **pare e pergunte**.

## 1. Home — ordem final das seções

Container: **todas** as seções, incluindo cabeçalho e hero, usam o mesmo container (`--container-body`). Antes, cabeçalho e hero usavam `--container-wide`; isso desalinhava a primeira dobra. A única exceção é a seção da Talita (foto + texto), que mantém `--container-wide`.

| # | Seção | Fundo | Observação |
| :-- | :--- | :--- | :--- |
| 1 | Cabeçalho | creme | wordmark "Boutique Empresarial." + link "Aplicação" (inalterado) |
| 2 | Hero (primeira dobra) | creme | §1.1 |
| 3 | Você se reconhece… | creme, filete no topo | **nova** |
| 4 | O que analisamos na sessão | branco, filete | 3 cartões; copy nova |
| 5 | O que muda quando a equipe ganha autonomia | creme | **nova** |
| 6 | O que acontece se nada mudar | creme, filete | **nova** |
| 7 | Quem conduz a sua análise | tinta (escuro) | copy nova |
| 8 | Para quem é | creme | + linha "Para quem não é" |
| 9 | Como funciona | branco, filete | 3 passos + botão |
| 10 | Perguntas frequentes | creme, filete | 5 itens; sem bloco "Em síntese" |
| 11 | Fechamento | tinta (escuro) | **nova**; promessa + botão |
| 12 | Rodapé | creme | **sem** a promessa em duas linhas (agora vive na seção 11) |

### 1.1 Hero

*   Linha acima do título (eyebrow, caixa-alta, `letter-spacing .2em`, `margin-bottom 20px`): `Para donos de empresas de serviço com equipe a partir de 5 pessoas`
*   `h1` (Playfair 400, `clamp(2.5rem, 4.4vw, 3.5rem)`, `line-height 1.08`, `letter-spacing -0.025em`, **`text-wrap: pretty`** — não `balance`, que estreita o título e o desalinha do texto): `Sua empresa cresceu, mas a sua equipe ainda depende de você para quase tudo`
*   Texto (Inter 300, `1.25rem`, `line-height 1.7`, `max-width 54ch`): `Em uma sessão individual de 45 minutos, analiso como a sua operação funciona hoje, mostro quais decisões, entregas e informações ainda passam por você e por onde começar a mudar isso.`
*   Botão: `Quero agendar meu diagnóstico` (`margin-top 36px`)
*   Abaixo do botão (Inter 300, `.95rem`, `margin 16px 0 0`): `Leva 2 minutos. Eu mesma ligo para você — sem robô, sem automação.` (ver §6, pendência de canal)
*   Linha de credibilidade (`.95rem`, `margin-top 24px`, `padding-top 20px`, `border-top 1px solid --be-border`): **`Talita Issei`** (600) + `, 15 anos de experiência em multinacionais como KPMG, Itaú, Vivo e Accenture`

### 1.2 Você se reconhece em alguma destas situações?

`h2`. Lista com filete dourado à esquerda (`.pain` já existente):
1. `Orçamentos, prazos e respostas para clientes só saem depois que você aprova`
2. `Você revisa tarefas que já pagou alguém para fazer`
3. `Para saber como está cada entrega, você precisa perguntar para a equipe`
4. `Mesmo de férias, você continua respondendo mensagens de trabalho`

Parágrafo (`margin-top 40px`): `Na maioria das vezes, isso tem uma raiz comum: a operação ainda não tem processos, papéis e indicadores bem definidos.`

### 1.3 O que analisamos na sessão

`h2` + 3 cartões (`01`/`02`/`03`, grade de 3, `gap 40px`):
*   **Decisões que dependem de você** — `Mapeio quais decisões do dia a dia hoje precisam da sua aprovação e quais a equipe já pode assumir.`
*   **Falhas na entrega** — `Identifico em qual etapa do serviço acontecem os erros e o retrabalho, e o que precisa mudar para que eles não se repitam.`
*   **Fluxo de informação** — `Avalio como as demandas circulam pelo WhatsApp e pelos canais internos, e mostro como organizar isso para você acompanhar as entregas sem precisar perguntar o status.`

Fechamento (`margin-top 56px`, `1.125rem`): `Ao final, você sai com clareza sobre o que trava a sua operação e o que corrigir primeiro. Se fizer sentido para o seu momento, apresento como podemos fazer essa reestruturação juntos na` **`Boutique Empresarial`** `.`

### 1.4 O que muda quando a equipe ganha autonomia (lista de filete)
1. `Você ganha mais tempo na agenda, porque deixa de aprovar e revisar tarefas que a equipe já consegue resolver`
2. `A operação fica mais previsível: rotina, metas e indicadores mostram o que cada pessoa está entregando`
3. `Você decide com mais segurança, porque passa a ter dados para saber quem está entregando, quando contratar e quando desligar`

### 1.5 O que acontece se nada mudar (lista de filete)
1. `Você continua pagando a equipe e gastando o seu tempo para revisar e refazer o trabalho`
2. `Sem dados sobre quem realmente entrega, a decisão de contratar ou demitir continua no feeling — e o risco de contratar errado cresce junto com a equipe`

### 1.6 Quem conduz a sua análise
`h2` (cor creme) · nome `Talita Issei` (Playfair 2rem) · filete dourado 56px · dois parágrafos (Inter 300, `1.0625rem`, cor `--be-ink-inverse`):
1. `Já acompanhei empresários que não saem de férias sem o celular, que aprovam orçamento dentro do carro e que só descobrem que um prazo atrasou quando o cliente liga reclamando. Antes de trabalhar com esse problema, passei 15 anos em multinacionais como KPMG, Itaú, Vivo e Accenture, 4 deles à frente de gestão de equipes e projetos.`
2. `Há 5 anos levo essa experiência para pequenas e médias empresas, ajudando donos e sócios a formar equipes que decidem sem precisar deles o tempo todo.`

### 1.7 Para quem é (lista de filete)
1. `Donos e sócios de empresas de serviço com 5 ou mais colaboradores`
2. `Empresas com operação ativa e carteira de clientes em crescimento`
3. `Empresários que decidiram sair do operacional para cuidar da gestão e do crescimento`

Abaixo (`margin-top 32px`): **`Para quem não é:`** `negócios em fase inicial, quem trabalha sozinho ou quem procura estratégias de marketing.`

### 1.8 Como funciona
Passos numerados com hairline (componente existente, `01`–`03`):
1. `Você preenche o formulário, que leva cerca de 2 minutos`
2. `Eu mesma entro em contato por telefone para entender o momento da sua empresa`
3. `Se fizer sentido, marcamos a sessão de 45 minutos com você e com quem decide junto com você`

Botão `Quero agendar meu diagnóstico` (`margin-top 40px`).

### 1.9 Perguntas frequentes (`h2`; 5 itens, nesta ordem)
1. **A sessão tem custo?** — `Não, a sessão é gratuita e dura 45 minutos.`
2. **No final, vou receber uma proposta de venda?** — `O foco da conversa é entender o que trava a sua operação hoje. Se ao final fizer sentido para o seu momento, mostro como a reestruturação pode ser feita com a Boutique Empresarial.`
3. **Para quem é a sessão?** — `Para donos e sócios de empresas de serviço com equipe a partir de 5 colaboradores, com operação ativa e que querem sair do operacional.`
4. **Como funciona?** — `Você preenche o formulário, eu entro em contato por telefone para entender o seu momento e, se fizer sentido, marcamos a sessão.`
5. **Para quem a sessão não é?** — `Para negócios em fase inicial, para quem trabalha sozinho ou para quem procura estratégias de marketing.`

O bloco **"Em síntese"** (TL;DR) e o `h2` correspondente são **removidos**. No lugar fica só o filete dourado (64px, `margin 40px 0 8px`) acima do `h2` "Perguntas frequentes".

> **Emenda (2026-10-21, decisão da autora).** O título "Em síntese" sai, mas o resumo **não**:
> `HARNESS_AEO.md` §B3 exige `.aeo-tldr` visível na home (alvo do `SpeakableSpecification`) e
> `tests/aeo.spec.js` cobra isso. A exceção `SEM_BLOCO_AEO` não serve, porque tira também o FAQ
> e o `FAQPage`, que o §B2 exige na home. Fica: filete dourado → `h2` "Perguntas frequentes" →
> `.aeo-tldr` com um parágrafo curto (3 frases, sem título), reescrito na voz da copy v2 → os 5
> itens. Gate e contrato AEO sem mudança.

### 1.10 Fechamento
Seção escura, conteúdo centralizado, `gap 36px`:
*   Frase (Playfair, `clamp(1.6rem, 3vw, 2.25rem)`, `line-height 1.25`, `letter-spacing -0.02em`, `max-width 24ch`, `text-wrap: balance`, cor creme): `Quando tudo depende de você, o crescimento vira peso. Nós transformamos isso em estrutura.`
*   Botão `Quero agendar meu diagnóstico`

### 1.11 Botão — token
Todos os 3 botões usam o laranja `--be-accent` (`#B84A22`, `adr-botao-laranja.md`). Rótulo único em toda a página: `Quero agendar meu diagnóstico`. O link do botão é o mesmo de hoje (`/formulario`).

## 2. Aplicação (`formulario.html`) — só a 1ª etapa

Apenas a introdução e o rodapé da etapa 1 mudam. Etapas 2–7, opções, validação, `.cf-an` e o fechamento ficam como estão.

*   Eyebrow (`.cf-eyebrow`): `Para donos de empresas de serviço com equipe a partir de 5 pessoas` (era "Sessão Estratégica de Diagnóstico")
*   Headline (`.cf-headline`): `Sua empresa cresceu, mas a sua equipe ainda depende de você para quase tudo`
*   Texto (`.cf-lead`): `Em uma sessão individual de 45 minutos, analiso como a sua operação funciona hoje, mostro quais decisões, entregas e informações ainda passam por você e por onde começar a mudar isso.`
*   **Nova** linha de credibilidade logo abaixo do texto (`.9rem`, `line-height 1.5`, cor `--be-ink`, `margin-top 1rem`): **`Talita Issei`** (600) + `, 15 anos de experiência em multinacionais como KPMG, Itaú, Vivo e Accenture`
*   Sanfona (`<details>`): título `O que analisamos com você` (era "O que analisamos na sua sessão"). Três itens, rótulo em negrito + texto:
    1. **`Decisões que dependem de você:`** `quais tarefas precisam da sua aprovação e quais a equipe já pode assumir`
    2. **`Falhas na entrega:`** `em qual etapa do serviço acontecem os erros e o retrabalho`
    3. **`Fluxo de informação:`** `como organizar o WhatsApp e os canais internos para você acompanhar as entregas sem precisar perguntar o status`
*   Rodapé da **1ª etapa apenas** (continua oculto nas demais): `⏳` **`Preenchimento rápido, leva cerca de 2 minutos.`** `É uma análise individual, conduzida diretamente por mim — sem robô, sem automação. Depois que você enviar, eu mesma entro em contato por telefone para entender o momento da sua empresa. Deixe um número com WhatsApp.`

## 3. O que NÃO pode mudar (proteção de fluxo)

1.  `src/js/form-copy.js` — casa as respostas pelo **texto exato** das opções. Os textos das opções das etapas 1, 5, 6 e 7 ficam byte a byte iguais.
2.  `name` e `id` de todos os campos, e a ordem das 7 etapas.
3.  Eventos de rastreamento (`fbq`, `gtag`, CAPI) e seus gatilhos; `eventID` do Lead em `obrigada.html`.
4.  Consentimento LGPD no rodapé do formulário e o link para a Política de Privacidade.
5.  `noindex` do `formulario.html`.
6.  Destino do botão da Home (`/formulario`) e preservação de UTM/atribuição (`attribution.js`).

## 4. SEO / AEO / dados estruturados

*   O JSON-LD de `FAQPage` da Home deve ter **exatamente** as 5 perguntas e respostas de §1.9, nesta ordem. Pergunta ou resposta divergente entre o JSON-LD e a tela é falha de acessibilidade para buscadores.
*   `<title>` e `<meta name="description">` da Home: **não alterar** neste PR, mas listar no PR se hoje repetem "Solicitar Diagnóstico Gratuito" ou o texto do "Em síntese" removido.
*   Se houver `public/diagnostico.md`, `llms.txt` ou equivalente espelhando a Home, atualizar com o mesmo texto de §1 (a remoção do "Em síntese" tira o resumo que alimentava esses arquivos — reescrever o resumo ali, não na página).
*   Hierarquia: um único `h1` (hero); demais títulos de seção em `h2`; títulos dos cartões em `h3`.

## 5. `obrigada.html` — alinhamento de promessa (decisão pendente)

A nova copy promete **contato por telefone** feito pela Talita. `obrigada.html` hoje diz "Retornaremos em até 48h úteis via WhatsApp/E-mail caso sua aplicação seja aprovada". **Não implementar até a autora decidir o canal.** Texto proposto, se confirmado:

`Suas informações são confidenciais. Retornaremos em até 48h úteis por telefone ou WhatsApp, caso sua aplicação seja aprovada.`

## 6. Pendências de decisão (autora)

1.  Canal de contato real: telefone, WhatsApp ou e-mail (§5).
2.  Anos à frente de gestão: spec usa **4**, conforme última instrução.
3.  Linha "Eu mesma ligo para você" no hero: manter só se o telefone for o canal.

## 7. Busca obrigatória antes de editar

O Claude Code deve rodar e **listar no PR** cada ocorrência encontrada:

```
grep -rn "Solicitar Diagnóstico Gratuito" src e2e tests public
grep -rn "O que analisamos" src e2e tests public
grep -rn "Em síntese" src e2e tests public
grep -rn "Sessão Estratégica de Diagnóstico" src e2e tests public
grep -rn "Descubra exatamente onde" src e2e tests public
grep -rn "fundadora\|Fundadoras" src e2e tests public
```

Qualquer teste (E2E, a11y, snapshot) que cite um texto trocado é atualizado para o novo literal deste spec. Nenhum teste é removido ou enfraquecido.

## 8. Critérios de aceite

1.  Home: as 12 seções de §1 na ordem da tabela; texto idêntico caractere a caractere aos literais; cabeçalho, hero e demais seções com a mesma margem esquerda em 1280 px e em 390 px.
2.  `h1` com `text-wrap: pretty`; borda direita do título não mais estreita que a do texto.
3.  Exatamente 3 botões `Quero agendar meu diagnóstico`, todos laranja `#B84A22`, todos levando a `/formulario` com UTM preservada.
4.  Formulário: etapa 1 mostra eyebrow, headline, texto, credibilidade, sanfona e o rodapé com ⏳; **etapas 2–7 não mostram o rodapé**.
5.  Percurso completo do formulário (7 etapas) termina em `obrigada.html` com `Lead` disparado uma vez e payload do CRM idêntico ao de antes da mudança (mesmas chaves).
6.  `form-copy.js` sem diff. `git diff --stat` não toca `apps_script_atualizado.gs`.
7.  JSON-LD de FAQ válido (Rich Results Test) e igual à tela.
8.  `npm test` / E2E / a11y verdes; contraste do botão ≥ 5:1; sem regressão de CLS na Home.
9.  PR descreve as ocorrências de §7 e lista as pendências de §6 ainda abertas.

## 9. Depois do merge

Rodar o protocolo de sync (`SYNC_PROTOCOL.md` §3): atualizar `ui_kits/site/HomeScreen.jsx` e `FormScreen.jsx` para o que está em `main`, regerar `ui_kits/pages/*`, atualizar `github.md`, e mudar o **Status** deste arquivo para "Implementado".
