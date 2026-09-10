# SDD — Nova home: LP Diagnóstico Gratuito

* **Status**: Implementado na branch `feat/home-diagnostico` — F0 a F8 concluídas, gate verde (432 testes). Revisão da autora aplicada em 2026-09-10 (§6.3)
* **Substitui**: `src/index.html` atual (home institucional "Silêncio Operacional / três pilares")
* **Fonte da verdade do conteúdo**: `COPY - LP DIAGNÓSTICO.md`, fornecido pela autora, refinado na §3 deste documento
* **Arquivos afetados**: `src/index.html`, `src/index-legado.html` (novo), `public/index.md`, `public/llms.txt`, `public/llms-full.txt`, `public/.well-known/ai-catalog.json`, `public/.well-known/agent-card.json`, `public/.well-known/agent-skills/boutique-brand-voice/SKILL.md`, `public/fotos/talita-issei.webp` (novo), `tests/home.spec.js`, `tests/home-legado.spec.js` (novo), `docs/specs/HARNESS_AEO.md` §B6
* **Contrato que rege**: [`HARNESS_AEO.md`](../HARNESS_AEO.md) — §B1 head, §B2 JSON-LD, §B3 bloco AEO, §B4 camada máquina, §B5 a11y, §B6 vocabulário

---

## 1. Objetivo

Trocar a home institucional por uma landing page de conversão para a **sessão de Diagnóstico
Gratuito**, preservando integralmente:

1. O destino do CTA — `/formulario.html`, com todo o rastreamento (UTMs, `fbclid`, `event_id`,
   CAPI) que `docs/specs/pages/formulario.md` já especifica. **O formulário não é tocado.**
2. O contrato de `<head>`, JSON-LD, bloco AEO visível e a11y cobrado por `npm run gate`.
3. A camada agêntica (`llms*.txt`, `.well-known/*`, companion `.md`, WebMCP, header `Link`).
4. A identidade "Silêncio e Elegância" — paleta, tipografia e componentes do `STYLE_GUIDE.md`.

E mantendo a home anterior **acessível para comparação, fora da indexação**.

**Não-objetivo:** mudar identidade visual, tocar no formulário, criar rota nova para a LP.

---

## 2. Decisões de arquitetura

### D1. A LP entra como `index.html`, não como rota nova

`/` já concentra canonical, sitemap, `og:url`, o `MARKDOWN_MAP` do CloudFront (`/` → `/index.md`),
o WebMCP e todo o histórico de link. Criar `/diagnostico` e redirecionar `/` custaria uma
CloudFront Function nova, um canonical novo e uma entrada de sitemap — e entregaria menos.

| O que | Arquivo | URL | `meta robots` |
| :-- | :-- | :-- | :-- |
| LP nova | `src/index.html` | `/` | `index, follow, max-image-preview:large, max-snippet:-1` |
| Home anterior | `src/index-legado.html` | `/index-legado` | `noindex, nofollow` |

`vite.config.js` descobre os dois por glob e o `vite-plugin-sitemap` exclui o legado sozinho,
lendo o `meta robots` do próprio arquivo (`naoIndexaveis`). **Nenhuma lista manual.**

### D2. O legado sofre quatro remoções cirúrgicas

Copiar `index.html` para `index-legado.html` sem editar cria conflitos silenciosos. Remover:

| Remover | Por quê |
| :-- | :-- |
| `<link rel="canonical" href=".../">` | declararia o legado como canônico de `/`, que agora tem outro conteúdo |
| `<link rel="alternate" type="text/markdown">` | `/index.md` passa a conter a copy nova — o companion descreveria outra página |
| O `<script type="application/ld+json">` inteiro | os `@id` `#webpage`, `#service`, `#website` colidiriam com os da home nova. Página `noindex` é isenta de §B2 |
| O bloco WebMCP (`navigator.modelContext`) | a tool `get_overview` faz `fetch('/index.md')` — serviria conteúdo alheio à página que a registrou |

**GA4 e Meta Pixel permanecem.** `tests/seo.spec.js` cobra `G-8HNXV7KTY9` em *toda* página do
glob, inclusive `noindex` — o teste de GA4 não é condicionado à indexabilidade. Como nada linka
para `/index-legado`, o volume de pageview é desprezível.

`og:*` e `twitter:*` também permanecem: são inertes numa página que ninguém compartilha, e
removê-los é diff sem ganho.

### D3. Público e qualificador mudam em todo o site, não só na página

Decisões da autora, tomadas na abertura desta proposta:

| Dimensão | Antes (site atual) | Agora |
| :-- | :-- | :-- |
| Público | "empresários" (masculino genérico) | **fundadoras** de empresas de serviço |
| Qualificador de entrada | faturamento acima de R$ 50k/mês | **equipe a partir de 5 colaboradores** |
| Segmento | genérico | **empresas de serviço** |

O corte de R$ 50k/mês **sai da camada pública** — página, FAQ, JSON-LD, `index.md`, `llms.txt`,
`llms-full.txt` e `SKILL.md`. Continua existindo como **pergunta de qualificação dentro do
formulário** (`faturamento_mensal`, campo 7 de `formulario.md`): deixa de ser porteira anunciada
e vira dado de triagem. O formulário não muda.

> **Risco registrado:** um agente que já indexou `llms-full.txt` com "acima de R$ 50k/mês" pode
> repetir o critério antigo por algum tempo. É custo de mudança de posicionamento, não defeito —
> mitigado por atualizar os seis arquivos no mesmo PR, nunca em PRs separados.

### D4. "Diagnóstico Gratuito" entra no vocabulário controlado

A sessão passa a se chamar **Diagnóstico Gratuito** na página e no JSON-LD. É um sétimo termo de
marca, e termo de marca fora do vocabulário controlado deriva na página seguinte. Logo:

* `HARNESS_AEO.md` §B6 e `boutique-brand-voice/SKILL.md` ganham a grafia fixa.
* **Distinção obrigatória**, para as duas coexistirem sem se contradizerem:
  * **Diagnóstico Gratuito** — a sessão de 45 minutos, porta de entrada, sem custo.
  * **Diagnóstico de Estabilidade** — o pilar 1 do programa pago, mais profundo.

### D5. Escassez: dois números, dois objetos

A copy diz "3 vagas por semana"; o site atual diz "5 empresas por ciclo". Não é contradição —
são coisas diferentes, e o `llms-full.txt` precisa dizer isso explicitamente:

* **3 diagnósticos por semana** — limite da agenda da sessão gratuita.
* **5 empresas por ciclo** — limite de vagas do programa.

### D6. `<main id="conteudo">`

`HARNESS_AEO.md` §B5 especifica `conteudo`; `formulario.html` cumpre, a `index.html` atual usa
`main-content`. A página nova adota `conteudo`, com o `skip-link` apontando para ele. O legado
mantém `main-content` — é cópia congelada, não alvo de refactor.

---

## 3. Copy final — texto literal publicado

Refinamentos aplicados sobre o arquivo original, cada um com sua razão:

| # | Original | Publicado | Razão |
| :-- | :-- | :-- | :-- |
| R1 | "o que fazer pra resolver" · "tão te fazendo" · "tá fazendo" · "pra parar" | "para" · "estão te fazendo" · "está fazendo" | `SKILL.md` §Tom: "comando silencioso, elegante". Contração falada contradiz o `<h1>` em Playfair |
| R2 | "exatamente" no H1 **e** na subheadline | mantido só no H1 | repetição a duas linhas de distância |
| R3 | "equipe a partir de 5 colaboradores" só na lista | idem + FAQ + `audience` do JSON-LD | §B2: nenhuma afirmação estruturada sem contraparte visível |
| R4 | (ausente) | FAQ "Para quem a sessão não é?" | `SKILL.md` §Restrição de público manda dizer não sem suavizar. A home atual tem "Para quem não é"; perder isso enfraquece o filtro e aumenta lead desqualificado |
| R5 | "apresento como podemos fazer essa reestruturação juntas" | mantido | posicionamento feminino confirmado pela autora (D3) |

> **Revertidos na revisão da autora (§6.3):** R1 e R2. A página publica a copy de origem literal,
> contrações incluídas ("pra", "pro", "tá", "tão") — só o layout se adapta ao texto. O §3.3
> abaixo já traz o texto publicado.

Nenhum verbo proibido por §B6 ("garante", "elimina", "assegura") aparece na copy de origem.

### 3.1 `<head>` — §B1

| Campo | Valor | Contagem |
| :-- | :-- | :-- |
| `<title>` | `Diagnóstico Gratuito de Operação \| Boutique Empresarial` | 55 (limite 10–60) |
| `meta description` | `Sessão individual de 45 minutos para mapear onde sua operação de serviços depende de você e o que ajustar para o time decidir sozinho.` | 134 (limite 50–160) |
| `link canonical` | `https://boutiqueempresarial.com.br/` | absoluta, sem `.html` |
| `meta robots` | `index, follow, max-image-preview:large, max-snippet:-1` | |
| `og:title` | `Diagnóstico Gratuito \| Boutique Empresarial` | |
| `og:description` | mesma da `description` | |
| `og:image` | `/og-image.jpg` 1200×630 (existente, reaproveitado) | |
| `twitter:*` | `summary_large_image` + title/description/image | |
| `link rel=alternate` | `type="text/markdown"` → `/index.md` | |
| Descoberta | `api-catalog`, `service-desc`, `service-doc` — **os três permanecem** | cobrado por `tests/agent-readiness.spec.js` |
| GA4 | `G-8HNXV7KTY9`, imediatamente após `<head>` | |
| Meta Pixel | `1469019395044653`, com LDU e `disablePushState` | inalterado |

> `og:image` dedicado da LP fica **fora de escopo**: o genérico passa no contrato e um asset novo
> é decisão de design com custo próprio. Gatilho para reavaliar: se a LP virar destino de mídia
> paga com compartilhamento relevante.

### 3.2 Estrutura da página

| # | Seção | Conteúdo |
| :-- | :-- | :-- |
| 0 | `header` | logo + link "Aplicação" → `/formulario.html` (inalterado) |
| 1 | Hero | eyebrow · H1 · subheadline · **CTA 1** |
| 2 | O que analisamos | 3 blocos numerados + parágrafo de fechamento |
| 3 | Quem conduz | seção invertida, retrato, credenciais |
| 4 | Para quem é a sessão | 3 itens |
| 5 | Como funciona a seleção | 3 passos + nota de escassez + **CTA 2** |
| 6 | Bloco AEO | "Em síntese" + 5 `<details>` — §B3 |
| 7 | `footer` | inalterado |

### 3.3 Texto literal

**Hero**

* H1: `Descubra exatamente onde sua equipe trava sem você, e o que fazer pra resolver`
* Subheadline: `Uma sessão individual de 45 minutos para analisar a operação da sua empresa de serviços e apontar exatamente onde a estrutura precisa de ajuste para o seu time rodar com autonomia.`
* CTA 1: `Solicitar Diagnóstico Gratuito` → `/formulario.html`

**Seção 2 — O que analisamos e entregamos na sua sessão**

Intro: `Durante a reunião, avaliamos o momento atual da sua operação e entregamos clareza sobre três pontos centrais:`

| Nº | Título | Corpo |
| :-- | :-- | :-- |
| 01 | O que ainda trava em você | Mapeamos quais decisões do dia a dia hoje dependem só da sua aprovação, e indicamos o que seu time já pode decidir sozinho, sem precisar de você no meio. |
| 02 | Onde a entrega falha | Identificamos em que etapa do serviço sua equipe mais erra ou gera retrabalho, e apontamos o que falta pra isso parar de se repetir. |
| 03 | Onde a informação se perde | Avaliamos se o WhatsApp e a falta de rotina clara tão te fazendo perder o controle do que cada um tá fazendo, e mostramos como organizar isso. |

Fechamento: `Ao final do encontro, você sai sabendo com clareza o que tá travando sua operação, e o que precisa corrigir primeiro. Se fizer sentido pro seu momento, apresento como podemos fazer essa reestruturação juntas através da Boutique Empresarial.`

**Seção 3 — Quem conduz a sua análise**

* Nome: `Talita Issei`
* P1: `Já vi dezenas de empresários trabalhando 12 horas por dia porque o time não decide nada sem eles. Antes de ajudar empresários a resolver isso, passei mais de 15 anos gerindo projeto, processo e gente em operações multinacionais — KPMG, Itaú, Vivo, Accenture.` — as marcas ficam **dentro da frase**, como na copy de origem: linha própria de credenciais separada por ponto médio é a mesma meta-string que o §6.2 R1 retirou. **Nunca logo** — marca de terceiro sem licença não entra no repositório.
* P2: `Há 5 anos aplico essa bagagem em empresas de serviço, ajudando empresários a identificar falha operacional e transformar time dependente em time que roda sozinho.`

**Seção 4 — Para quem é a sessão**

* `Empresas de serviço com equipe a partir de 5 colaboradores`
* `Negócio com operação ativa e carteira de clientes em expansão`
* `Fundadoras decididas a sair do operacional pra focar em gestão e crescimento`

**Seção 5 — Como funciona a seleção**

Intro: `Por ser uma análise individual, conduzida diretamente por mim, libero apenas 3 vagas por semana.`

1. `Preenche o formulário de aplicação abaixo`
2. `Eu analiso se o momento da sua empresa se encaixa na metodologia`
3. `Com o perfil aprovado, minha equipe entra em contato pra agendar seu horário`

CTA 2: `Solicitar Diagnóstico Gratuito` → `/formulario.html`

### 3.4 Bloco AEO — §B3

Delimitado por `<!-- AEO-BODY:START -->` / `<!-- AEO-BODY:END -->`, imediatamente antes do
`<footer>`. **Este texto é literalmente o mesmo do `FAQPage` no JSON-LD** — `tests/aeo.spec.js`
compara os dois por `textContent` normalizado; parafrasear reprova o gate.

**Em síntese** (`.aeo-tldr`, alvo do `SpeakableSpecification`):

> O Diagnóstico Gratuito é uma sessão individual de 45 minutos que analisa a operação de uma
> empresa de serviços e aponta onde a estrutura precisa de ajuste para o time rodar com
> autonomia. A análise cobre três pontos: quais decisões ainda dependem só da fundadora, em que
> etapa da entrega o time erra ou gera retrabalho, e onde a informação se perde entre WhatsApp e
> rotina indefinida. É conduzida por Talita Issei, com mais de 15 anos gerindo projeto, processo
> e gente em operações multinacionais. São três vagas por semana, para empresas de serviço com
> equipe a partir de 5 colaboradores.

**FAQ** (`.aeo-faq`, `<details>` nativo, sem JavaScript):

| Pergunta | Resposta |
| :-- | :-- |
| O que é o Diagnóstico Gratuito? | O Diagnóstico Gratuito é uma sessão individual de 45 minutos, conduzida por Talita Issei, que analisa a operação da sua empresa de serviços e aponta onde a estrutura precisa de ajuste para o time rodar com autonomia. |
| A sessão tem custo? | Não. A sessão é gratuita e dura 45 minutos. Ao final, se fizer sentido para o seu momento, Talita apresenta como a reestruturação pode ser conduzida através da Boutique Empresarial. |
| Para quem é a sessão? | A sessão é para empresas de serviço com equipe a partir de 5 colaboradores, com operação ativa e carteira de clientes em expansão, conduzidas por fundadoras decididas a sair do operacional. |
| Para quem a sessão não é? | A sessão não é para negócio em fase inicial, para operação de uma pessoa só, nem para quem procura tática de marketing e crescimento rápido. Nesses casos a resposta é não. |
| Como funciona a seleção? | São três vagas por semana. Você preenche o formulário de aplicação, Talita analisa se o momento da sua empresa se encaixa na metodologia e, com o perfil aprovado, a equipe entra em contato para agendar o horário. |

---

## 4. JSON-LD — §B2

Um `@graph`. Nós persistentes com `@id` estável; toda URL absoluta e **sem `.html`** —
`tests/aeo.spec.js` reprova `@id`/`url` com extensão.

| Nó | `@id` | Papel | Contraparte visível |
| :-- | :-- | :-- | :-- |
| `Organization` | `.../#organization` | persistente, inalterado | rodapé |
| `ProfessionalService` | `.../#service` | `description` reescrita: sai R$ 50k, entra "empresas de serviço" | seções 3 e 4 |
| `WebSite` | `.../#website` | persistente, inalterado | — |
| `WebPage` | `.../#webpage` | `name` = novo `<title>`; `speakable` → `.aeo-tldr`; `dateModified` ISO com `-03:00` | a página |
| `Person` | `.../#talita` | **novo** — `name`, `jobTitle`, `worksFor` → `#organization`, `description` = texto literal da seção 3 | seção 3 |
| `Service` | `.../#diagnostico` | **novo** — `name: "Diagnóstico Gratuito"`, `provider` → `#service`, `audience`, `offers` → `Offer` com `price: "0"`, `priceCurrency: "BRL"`, `availability: InStock` | hero + seções 2 e 5 |
| `FAQPage` | — | as 5 perguntas da §3.4, texto idêntico | `.aeo-faq` |

`BreadcrumbList` não se aplica: §B2 o exige em "todas exceto a home".

O `Offer` com `price: "0"` é o ganho de AEO desta página: torna a gratuidade um fato estruturado
e citável por answer engine, com contraparte visível no eyebrow (`Sem custo`) e no FAQ.

---

## 5. Camada para máquinas — §B4

Seis arquivos descrevem a home antiga. Atualizados **no mesmo PR** — divergência entre o que o
humano lê e o que o agente lê é exatamente o defeito que o `HARNESS_AEO.md` existe para impedir.

| Arquivo | Mudança |
| :-- | :-- |
| `public/index.md` | reescrito: resumo, os três pontos da análise, quem conduz, para quem é, seleção, FAQ com o texto literal da §3.4, CTA |
| `public/llms.txt` | entrada "Página Inicial" reescrita (propósito, conceitos, público); §Diretrizes item 3 passa a "equipe a partir de 5 colaboradores"; sai "faturamento > R$ 50k/mês" |
| `public/llms-full.txt` | "Em síntese", "Para quem é", "Para quem não é" e FAQ alinhados; **registra D5** (3 diagnósticos/semana ≠ 5 empresas/ciclo) |
| `.well-known/ai-catalog.json` | `representativeQueries` da entrada `doc:home`: saem "três pilares" e "Silêncio Operacional", entram "o que é o Diagnóstico Gratuito", "como funciona a sessão de diagnóstico", "para quem é o diagnóstico" |
| `.well-known/agent-card.json` | `description` e a skill `get_overview` passam a descrever o Diagnóstico Gratuito além dos pilares |
| `.well-known/agent-skills/boutique-brand-voice/SKILL.md` | grafia fixa `Diagnóstico Gratuito` (D4); §Restrição de público reescrita (D3) |

Os três pilares **continuam** documentados em `llms-full.txt` e no `SKILL.md`: descrevem o
programa, que não mudou. O que muda é a porta de entrada.

**Sem alteração de infra.** `MARKDOWN_MAP` já mapeia `/` → `/index.md`; o header `Link` da
`viewer-response.js` não depende de conteúdo. `/index-legado` não ganha companion — página
`noindex` não é fonte de citação.

---

## 6. Proposta visual — "editorial de linha fina"

Mesma paleta, mesmas duas fontes, **zero dependência nova, zero framework de animação**.

**A estrutura da página é a estrutura de um laudo.** A oferta é um diagnóstico que entrega três
achados — então a página se organiza como o documento que a sessão produz: um índice do que será
examinado, os três achados, quem assina, para quem serve, como solicitar. Isso não é metáfora
decorativa: é a informação que o visitante precisa, na ordem em que ela existe no produto.

Uma só jogada ousada — a seção de autoridade invertida com o retrato. Todo o resto é quieto.

| # | Elemento | Especificação | Mobile |
| :-- | :-- | :-- | :-- |
| V1 | Escala tipográfica | `h1: clamp(2.5rem, 4.4vw, 3.5rem)` com `text-wrap: balance`; subheadline `1.25rem/1.7`, `max-width: 54ch`; respiro de seção `clamp(72px, 11vh, 128px)`. **O teto do clamp é ditado pela coluna (7/12 de 1200px ≈ 700px), não pela viewport** — a 4.5rem o título quebrava em seis linhas, achado na captura da F5 | h1 nunca abaixo de 2.5rem |
| V2 | ~~Hero como índice do laudo~~ | **removido** — ver §6.3 A1. O grid de 12 colunas fica, segurando título e subheadline nas 1–7 | — |
| V3 | ~~Eyebrow~~ | **removido** — ver §6.2 R1. Os três fatos da oferta (individual, 45 minutos, sem custo) vivem na subheadline, em frase, onde já estavam | — |
| V4 | Achados (seção 2) | cartões numerados `01/02/03` com a mesma estrutura da seção "Arquitetura Operacional" do `index-legado.html` — ver §6.3 A2 | pilha, mesma ordem |
| V5 | Seção de autoridade | **única seção invertida**: fundo `#1f1f1f`, texto `#f5f2eb`, ouro em detalhe. Cria respiro visual no meio da página e ancora credibilidade. Contraste ≈ 15:1 | retrato acima do texto |
| V6 | Retrato | ver §6.1 | 100% da largura útil, `aspect-ratio` fixo |
| V7 | Credenciais | dentro da frase de P1, não em linha própria (§3.3). Ênfase por peso tipográfico, sem separador decorativo e sem logo | idem |
| V8 | Para quem é (seção 4) | **reusa `.pain-list`**, que já existe no CSS (filete ouro à esquerda). Não inventa componente | idem |
| V9 | Seleção (seção 5) | linha do tempo: filete de 1px ligando os 3 passos — vertical no mobile, horizontal no desktop. Numeral em `--gold-text` (`#886829`, o que passa 4.5:1), nunca em `--gold-subtle` | vertical |
| V10 | ~~Escassez~~ | **removida** — ver §6.3 A4. A escassez fica na frase da copy: "libero apenas 3 vagas por semana" | — |
| V11 | CTA fixa | barra inferior `position: fixed` **apenas** em `max-width: 767px`, com `padding-bottom` compensatório no `body`. Alvo ≥ 48px. ~15 linhas de CSS, zero JS | é o item |
| V12 | Movimento | **nenhum movimento não solicitado** — ver §6.2 R3. Transição só onde responde a uma ação: `<details>` do FAQ, `:hover`/`:focus-visible` dos dois CTAs | idem |
| V13 | Fundo | `#f5f2eb` chapado, como no resto do site. **Sem gradiente** — ver §6.2 R4. A divisão sai do filete `--border-color` e da inversão da seção de autoridade | idem |
| V14 | Medida | container de 900px no corpo; hero e seção invertida rompem para 1200px. O contraste de medida é a art direction que custa duas linhas de CSS | container único, sem ruptura |

**Onde o CSS mora:** o que for específico da LP fica no `<style>` da própria página, como a home
atual já faz. Só sobe para `src/style.css` o que uma segunda página vier a usar. `.pain-list`,
`.container`, `.btn`, `.skip-link` e o bloco `.aeo` já existem e são reusados.

### 6.1 Retrato — asset e processamento

| | |
| :-- | :-- |
| **Origem** | `IMG_2552.jpg` — 2298×3446, JPEG, 323 KB, retrato de estúdio de corpo inteiro sentado. Substituiu `IMG_3624.png` na revisão da autora (§6.3 A3) |
| **Destino** | `public/fotos/talita-issei.webp` |
| **Recorte** | 4:5 na largura inteira (`crop=2296:2870:1:20`) — do topo da cabeça até abaixo das mãos apoiadas no joelho. Mais fechado que isso corta o braço ou as mãos |
| **Saída** | 800×1000, WebP q≈82, **alvo < 80kb** (`ASSETS_GUIDE.md` §Regras de Dimensão e Peso) |
| **Ferramenta** | `ffmpeg` com `libwebp` — já disponível no ambiente. **Nenhuma dependência nova**: nem `sharp`, nem ImageMagick, nem serviço externo |
| **Cor** | a origem vem em Adobe RGB (1998) e o `ffmpeg` ignora o perfil ICC — sem conversão o retrato sai lavado. Convertida para sRGB com `lut3d`, a partir de uma LUT gerada pela matriz Adobe RGB → sRGB (D65). Conferir o perfil (`ffprobe -show_frames`) antes de trocar a foto de novo |
| **Marcação** | `width="800" height="1000"` explícitos (CLS), `loading="lazy"`, `alt` descritivo — nunca `alt=""`, é conteúdo |
| **Fallback** | se o processamento falhar, a seção roda só com tipografia e o desenvolvimento não bloqueia |

> **A foto já está na paleta.** Blusa branca, poltrona clara e fundo bege, próximos do `#f5f2eb`
> da marca: sobre a seção invertida (`#1f1f1f`) o retrato lê como um retângulo claro em campo
> escuro — exatamente o contraste editorial que V5 procura. Não há tratamento de cor a fazer,
> e recortar o fundo não é necessário nem desejável.
>
> **Os valores de recorte se verificam no render, não no cálculo.** Enquadramento estimado por
> coordenada erra por alguns por cento; conferir a saída antes de commitar é mais barato que
> descobrir no PR.

### 6.2 Revisão do §6 na F2 — quatro devices retirados

Registrado aqui porque o §6 já estava aprovado quando a skill `frontend-design` foi carregada na
F2 e apontou que quatro dos itens eram **defaults reconhecíveis de página gerada**, não escolhas
para este brief. A identidade não se move — creme, Playfair e ouro são o `STYLE_GUIDE.md`, são o
brief, e brief vence. O que se move são os devices livres.

| Rev | Item retirado | Por quê | O que entrou no lugar |
| :-- | :-- | :-- | :-- |
| R1 | Eyebrow caixa-alta com `letter-spacing` largo e ponto médio (`A · B · C`) | dois tells no mesmo elemento: o rótulo caixa-alta acima do título e a meta-string com ponto médio. Aparecem em qualquer assunto — logo, não dizem nada deste | os três fatos ficam na subheadline, em frase |
| R2 | Numeral `01/02/03` nos achados | numeral é informação só quando o conteúdo é **sequência**. As três frentes do diagnóstico são paralelas, não etapas. A sequência real da página é a seleção (§5), e **lá a numeração fica** | a pergunta que cada frente investiga: `Quem decide?` · `Onde erra?` · `Onde se perde?` |
| R3 | Revelação por scroll seção a seção | entrada *fade-and-slide-up* por seção é o default gerado. Um momento orquestrado vence efeitos espalhados — e aqui o melhor número de momentos é zero | movimento só em resposta a ação: `<details>`, `:hover`, `:focus-visible` |
| R4 | Gradiente radial de fundo | lavagem de gradiente como decoração, mesma família de default. O creme chapado é o chão real da marca | nada. O filete e a seção invertida já dividem a página |

**As quatro revisões reduzem código.** Menos CSS, menos animação, menos device — a skill de design
e o `ponytail` apontaram para o mesmo lado, o que é um bom sinal de que o corte é real e não gosto.

### 6.3 Revisão da autora — 2026-09-10

A autora revisou a página na branch e pediu quatro ajustes. Onde houver conflito, eles vencem o
§6 e o §6.2.

| Rev | Pedido | O que mudou |
| :-- | :-- | :-- |
| A1 | Tirar do hero o índice "O que a sessão examina" | V2 removido. O hero fica com título, subheadline e CTA |
| A2 | "O que analisamos" com a estrutura da "Arquitetura Operacional" do `index-legado.html` | V4 e §6.2 R2 revertidos: cartão branco com borda sobre o creme, numeral `01/02/03` em Playfair `--gold-text`, título da copy em `h3`, corpo abaixo. Três colunas a partir de 900px — não 768px como no legado, onde o cartão ficaria com ~130px de texto útil. Sem o hover com sombra do legado: o cartão não é clicável |
| A3 | Trocar o retrato | nova origem em §6.1; mesmo destino, mesmas dimensões. `src`, `width`/`height` e o `image` do nó `Person` não mudam — só o `alt` |
| A4 | Texto fiel à copy de origem, sem reinventar palavra ou expressão | §3 R1 e R2 revertidos. Saem as perguntas `Quem decide?` · `Onde erra?` · `Onde se perde?` (inclusive de `index.md` e `llms-full.txt`) e a nota de escassez (V10) — nada disso está na copy. O bloco AEO (§3.4) fica: é contrato do gate, não copy da página |

---

## 7. Acessibilidade — §B5

Cobrado por `tests/a11y.spec.js` em **ambas** as páginas (o glob pega o legado também).

| Item | Regra desta página |
| :-- | :-- |
| Estrutura | `skip-link` primeiro focável → `<main id="conteudo">`; exatamente um `<h1>`; hierarquia sem salto (h1 → h2 por seção → h3 nos blocos) |
| Contraste | creme sobre `#1f1f1f` na seção invertida ≈ 15:1; ouro **decorativo** = `--gold-subtle`, ouro **em texto** = `--gold-text` |
| Numerais dos achados (V4) | texto visível em `--gold-text` sobre o branco do cartão (≈ 5,2:1) |
| CTA fixa (V11) | não pode cobrir conteúdo nem o `footer`: `padding-bottom` no `body` igual à altura da barra |
| Movimento (V12) | inteiro dentro de `prefers-reduced-motion: no-preference` |
| Retrato | `alt` descritivo, não `alt=""` — é conteúdo, não decoração |
| Zoom | 200% sem perda; zero scroll horizontal em 375px |
| Gate | zero violações `serious`/`critical` no axe |

---

## 8. Testes

| Arquivo | Ação |
| :-- | :-- |
| `tests/seo.spec.js` | **nenhuma** — itera por glob, pega as duas páginas sozinho |
| `tests/aeo.spec.js` | **nenhuma** — idem |
| `tests/a11y.spec.js` | **nenhuma** — idem |
| `tests/smoketest.spec.js` | **nenhuma** — parte de `/` e segue os links; `/index-legado` não é linkado e não entra no crawl, por desenho |
| `tests/agent-readiness.spec.js` | **nenhuma** — cobra os três `link rel` de descoberta, que a página nova mantém |
| `tests/home.spec.js` | **atualizar** — afirma o CTA literal `"Aplicar para a Boutique"`, que deixa de existir. Passa a afirmar `"Solicitar Diagnóstico Gratuito"` e o mesmo `href` de destino |
| `tests/home-legado.spec.js` | **novo, mínimo** — a página responde 200, tem `noindex` e **não** declara canonical. Uma asserção que falha se alguém "consertar" o legado por engano |

Critério único de pronto: **`npm run gate` verde**.

---

## 9. Critérios de aceite

- [x] `/` serve a LP nova; `/index-legado` serve a home anterior com `noindex, nofollow`.
- [x] `/index-legado` sem canonical, sem `rel=alternate`, sem JSON-LD e sem WebMCP (D2).
- [x] `sitemap.xml` do `dist/` contém `/` e **não** contém `/index-legado`.
- [x] Os dois CTAs apontam para `/formulario.html`; o formulário não foi alterado.
- [x] As 5 respostas do `FAQPage` são idênticas, caractere a caractere, ao `.aeo-faq`.
- [x] `speakable` aponta para `.aeo-tldr`, que existe.
- [x] Nenhum `@id`/`url` do `@graph` contém `.html`.
- [x] Os seis arquivos da §5 descrevem a LP nova; nenhum menciona "R$ 50k/mês" na camada pública.
- [x] `HARNESS_AEO.md` §B6 e o `SKILL.md` registram `Diagnóstico Gratuito` (D4).
- [x] `public/fotos/talita-issei.webp` com 800×1000 e menos de 80kb, marcado com `width`, `height`, `loading="lazy"` e `alt` descritivo.
- [x] Zero violações axe `serious`/`critical` nas duas páginas; zero scroll horizontal em 375px.
- [x] `npm run gate` verde.

---

## 10. Plano de execução

Rege-se por [`PLANO_MULTIAGENTE.md`](../PLANO_MULTIAGENTE.md): **modelo caro decide, modelo
barato executa, o gate arbitra**. A ordem é vinculante — a F1 preserva o legado **antes** de o
original ser sobrescrito, e o retrato entra **antes** da página para que ela seja escrita uma
vez, não escrita com fallback e reeditada depois.

### 10.1 A decisão de custo que rege este plano

`PLANO_MULTIAGENTE.md` §6 regra 5 — *sem subagente para tarefa de um arquivo* — e a nota do §0
decidem quase tudo aqui. **A sessão que aprovou este SDD já leu** `index.html`, `HARNESS_AEO.md`,
as três suítes do gate, `style.css`, `llms.txt`, `index.md`, `llms-full.txt` e a copy de origem.
Despachar um subagente para escrever `src/index.html` faria ele partir frio e **re-derivar todo
esse contexto** — o oposto da economia que o pipeline existe para produzir.

Aplicada a ordem de alavancas do §5 (cortar contexto que entra → cortar output que sai → baixar
tier → baixar effort), o fan-out se paga em exatamente **três** pontos, e em nenhum outro:

| Onde o fan-out paga | Por quê |
| :-- | :-- |
| `gate-runner` em **toda** execução do gate | o log de ~280 testes do Playwright é o maior bloco de contexto do ciclo. Ele morre dentro do agente e só o veredito atravessa. Item de maior retorno da lista |
| `copy-writer` ×3 em paralelo na F6 | os três arquivos de prosa da camada máquina precisam do §3 deste SDD e do arquivo-alvo — **não** do contexto da sessão principal. Fan-out legítimo |
| `page-auditor` ×2 em paralelo na F3 | detectar desvio de contrato em Haiku custa alguns milhares de tokens; descobrir o mesmo desvio por gate vermelho custa um build inteiro mais 280 testes |

E **onde não paga** — registrado para o plano não virar teatro:

* `src/index.html` (F2) — é o único arquivo que precisa de todos os specs ao mesmo tempo, e o contexto já está carregado.
* `tests/home.spec.js` (~10 linhas) e `tests/home-legado.spec.js` (~15 linhas) — regra 5.
* Os dois `.well-known/*.json` — edições de 3 linhas cada — regra 5.
* `test-author` — **não é invocado**. Nenhuma suíte nova: as três do gate iteram por glob e absorvem a página nova sozinhas.
* `head-fixer` — **condicional**. Só roda se o `page-auditor` devolver delta.

### 10.2 Fases

| Fase | Entrega | Executor | Modelo | Ferramenta / skill |
| :-- | :-- | :-- | :-- | :-- |
| **F0. Branch + retrato** | branch `feat/home-diagnostico`; `public/fotos/talita-issei.webp` conforme §6.1 | sessão principal | Opus | `ffmpeg` + `libwebp` |
| **F1. Backup** | `src/index-legado.html` com as 4 remoções de D2; `tests/home-legado.spec.js` | sessão principal | Opus | — |
| **F2. Página** | `src/index.html`: head §3.1, estrutura §3.2, copy §3.3, JSON-LD §4, bloco AEO §3.4, CSS §6 | sessão principal | Opus | skills `frontend-design` + `ponytail` |
| **F3. Auditoria** | deltas de contrato nas duas páginas → correção | `page-auditor` ×2 ∥ → `head-fixer` (se houver delta) | Haiku | — |
| **F4. Teste + gate** | `tests/home.spec.js` atualizado; primeiro veredito | sessão principal → `gate-runner` | Opus → Haiku | — |
| **F5. Verificação visual** | capturas em 375px e 1440px para aprovação da autora | sessão principal | Opus | MCP `claude-in-chrome` |
| **F6. Camada máquina** | `index.md`, `llms.txt`, `llms-full.txt` (∥) + os 2 `.well-known/*.json` | `copy-writer` ×3 ∥ → sessão principal | Sonnet → Opus | skill `ponytail` |
| **F7. Vocabulário** | `HARNESS_AEO.md` §B6 + `boutique-brand-voice/SKILL.md` (D4) | sessão principal | Opus | — |
| **F8. Fechamento** | gate verde, revisão, PR | `gate-runner` → sessão principal | Haiku → Opus | `/code-review` medium, `/commit-push-pr` |

`∥` = instâncias em paralelo, uma por arquivo.

**Regra de escalada** (`PLANO_MULTIAGENTE.md` §4): agente barato que falha **duas vezes na mesma
asserção** não tenta uma terceira — para e devolve o estado para a sessão principal. Três
tentativas de Haiku somam mais que uma de Opus, e ainda gastam o tempo do humano.

### 10.3 Skills e MCPs — o que entra e o que fica de fora

| Recurso | Papel | Fase |
| :-- | :-- | :-- |
| `ponytail` | já ativo na sessão. Sustenta as decisões de §6: zero framework de animação, zero dependência de imagem, reuso de `.pain-list`/`.btn`/`.aeo` em vez de componente novo | F2, F6 |
| `frontend-design` | a única skill que eleva de fato o item que a autora pediu — "proposta visual sofisticada". Carregada **antes** de escrever o CSS de §6 | F2 |
| `claude-in-chrome` (MCP) | **o gate prova conformidade, não beleza.** Captura em 375px e 1440px fecha o único laço que nenhuma asserção fecha | F5 |
| `/code-review` medium | passada mecânica antes do PR | F8 |
| `rtk` | ativo por hook, comprime saída de shell sem prompt. Ganho local; ausente no cloud (`PLANO_MULTIAGENTE.md` §9.5) | contínuo |
| `caveman` | baseline antes da F0 e `caveman learn --json` depois da F8, se a autora quiser o número. Opcional, local | fora do ciclo |

**Deliberadamente fora:**

* `codegraph` — `HARNESS_AEO.md` §7: não indexa HTML. Este trabalho é HTML.
* `design:accessibility-review` — o axe já é gate fail-closed em §B5. Pagar duas vezes pela mesma verificação.
* `marketing:seo-audit` — o contrato de SEO é o §B1, e ele já é testado. Auditoria genérica não sabe deste contrato.
* `figma` / `canva` (MCP) — exigem OAuth não autorizado neste ambiente. Se a autora quiser mockup antes do código, é preciso autorizá-los primeiro.
* `chrome-devtools` (MCP) — falhou ao conectar. Só necessário se entrar medição de performance, que não está no escopo.

### 10.4 Ponto de decisão de custo

A F2 é o maior bloco de **output** do projeto (~700 linhas de HTML + CSS), e output é o token
caro. Duas rotas legítimas:

| Rota | Custo | Risco |
| :-- | :-- | :-- |
| **F2 na sessão principal (Opus)** — recomendada | maior | menor. O julgamento visual de §6 é a parte que o gate **não** mede |
| **F2 num subagente Sonnet, tendo este SDD como contrato único** | ~2,5× menor no token de saída | o SDD é detalhado o bastante para ser executado sem o contexto da sessão. O que degrada primeiro é o acabamento visual — e nenhuma asserção reprova isso |

Recomendação: **Opus na F2**, porque a página é o produto e a sofisticação visual é o pedido
explícito. Se o limite de uso apertar, a F2 é o lugar certo para trocar por Sonnet — não a F6,
que já é Sonnet, nem o gate, que já é Haiku.

---

## 11. Fora de escopo

| Item | Motivo |
| :-- | :-- |
| Alterar `src/formulario.html` | o CTA aponta para ele inalterado; mexer no funil de rastreamento é outro spec |
| `og:image` dedicado da LP | o genérico 1200×630 passa no contrato; asset novo é decisão de design com custo próprio |
| Redirect 301 de `/index-legado` ou remoção futura | a página existe para comparação; quando deixar de servir, apaga-se o arquivo e o glob resolve |
| Companion `.md` do legado | página `noindex` não é fonte de citação |
| Remover o corte de R$ 50k do formulário | continua como dado de triagem (D3) |
| Teste A/B entre home antiga e nova | exigiria infra de split na CloudFront; não há decisão de negócio |

---

## 12. Referências

* [`HARNESS_AEO.md`](../HARNESS_AEO.md) — contrato de head, JSON-LD, AEO, a11y e gate
* [`STYLE_GUIDE.md`](../STYLE_GUIDE.md) — paleta, tipografia, componentes
* [`ASSETS_GUIDE.md`](../ASSETS_GUIDE.md) — §Regras de Dimensão e Peso (retrato)
* [`pages/formulario.md`](formulario.md) — destino do CTA e contrato de rastreamento
* [`AGENT_READINESS.md`](../../AGENT_READINESS.md) — camada agêntica e WebMCP
* `COPY - LP DIAGNÓSTICO.md` — copy de origem
