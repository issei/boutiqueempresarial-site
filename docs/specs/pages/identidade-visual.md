# Especificação de Nova Página — `identidade-visual.html`

Baseado no template `docs/specs/PAGE_SPEC_TEMPLATE.md`, estendido com um mapeamento completo de design tokens (necessário porque esta página introduz um **segundo sistema visual**, à parte do `STYLE_GUIDE.md` atual do site institucional).

**Status:** Proposta — aguardando aprovação antes da implementação (fluxo SDD do projeto).
**Origem:** `Especificação de Identidade Visual e UI Design` (sistema visual "Talita Issei", v1.0) — anexo fornecido pelo usuário, referente à identidade usada nos cards do Instagram.

---

## 0. Objetivo da Página

Criar uma página **interna, não indexada e não linkada na navegação pública**, que funcione como **guia vivo / template visual** para quem produz conteúdo (cards de Instagram, carrosséis, notas). A página deve renderizar, ao vivo em HTML/CSS, todos os componentes de assinatura do sistema "Talita Issei" (dualidade Editorial/Paper vs. Notepad/Bastidores), para que:

* quem estiver criando um novo card possa **copiar a estrutura HTML de um bloco pronto** em vez de recriar do zero em uma ferramenta de design;
* haja uma **fonte única da verdade** para cores, tipografia e componentes dessa identidade, evitando divergência entre posts;
* fique claro que **esta página não faz parte da jornada comercial do site** (não tem CTA de conversão, não aparece no menu, não deve ranquear no Google).

Esta página **não substitui** o `docs/specs/STYLE_GUIDE.md` existente (identidade "Silêncio e Elegância" do site institucional) — ela documenta um sistema visual paralelo, usado apenas para conteúdo social, e deve ser isolada para não vazar estilos para o resto do site.

---

## 1. Informações Básicas

| Campo | Valor |
| :--- | :--- |
| **Nome do arquivo** | `identidade-visual.html` |
| **URL final** | `boutiqueempresarial.com.br/identidade-visual` |
| **Título da página** | `Guia de Identidade Visual (Uso Interno) — Boutique Empresarial` |
| **Meta description** | `Referência interna de componentes visuais para produção de conteúdo. Página não destinada à indexação.` |
| **Indexação** | **NÃO indexar.** Ver seção 6. |
| **Link no menu/footer** | Nenhum. Acesso apenas por URL direta. |

---

## 2. Estrutura e Layout

### Header
* [x] Minimalista — apenas um rótulo de contexto, não o header institucional do site.
* Faixa fixa no topo (fora do sistema dual claro/escuro) identificando a página como interna, ex.: `Guia de Identidade Visual · Uso interno · não indexado`, com link de volta para `/`.

### Seções de conteúdo (ordem)

1. **Intro (Modo Claro — Paper)**
   * H1: `Identidade Visual — Cards de Conteúdo`
   * Parágrafo curto explicando a dualidade Editorial (claro) vs. Bastidores (escuro) e como usar a página (copiar blocos prontos).

2. **Paleta de Cores (Modo Claro)**
   * Grid de swatches — um card por token (cor sólida + nome da variável CSS + hex + aplicação), cobrindo os 11 tokens da tabela da seção 3 deste documento.

3. **Tipografia (Modo Claro)**
   * Amostra viva de cada nível da tabela de hierarquia (seção 4): nome da autora, @handle, H1, diagnóstico, checklist regular, checklist itálico, texto de interface iOS — cada um rotulado com família/peso/tamanho desktop e mobile.

4. **Componente: Cabeçalho de Autoria (Modo Claro)**
   * Exemplo vivo do bloco avatar + nome + selo verificado + @handle (ver seção 5.1).

5. **Componente: Divisor Editorial (Modo Claro)**
   * Exemplo vivo da linha de 96–120px (seção 5.4).

6. **Componente: Checklist Estilo A — Diagnóstico (Modo Claro)**
   * Lista de 3–5 itens com marcador quadrado verde + check branco, fonte serifada regular (seção 5.5).

7. **Card de exemplo completo — Modo Claro (Fachada Editorial)**
   * Réplica do padrão visto no card "Talita Issei" enviado como referência: cabeçalho de autoria, texto de diagnóstico em negrito, checklist estilo A, divisor, chamada `Continuação na legenda`, barra de ações (curtir/comentar/enviar).

8. **Transição para o Modo Escuro**
   * Seção full-bleed com `--bg-dark-notepad` iniciando o bloco "Bastidores".

9. **Topo "Apple Notes" (Modo Escuro)**
   * Exemplo vivo do falso header `< Notas` / `•••` (seção 5.3).

10. **Componente: Grifo de Seleção iOS (Modo Escuro)**
    * Título de exemplo com um trecho grifado (caixa caramelo + pinos), demonstrando a marcação de destaque (seção 5.2) — este é o componente mais específico e deve ter destaque próprio na página, com anotação de como aplicar em qualquer título.

11. **Componente: Checklist Estilo B — Método (Modo Escuro)**
    * Lista com marcador textual `[ ]`, fonte serifada itálica, título de etapa em `--accent-amber` (ex.: `Etapa 1 - ...`), replicando o segundo print de referência.

12. **Card de exemplo completo — Modo Escuro (Bastidores)**
    * Réplica do card "Notas" enviado como referência: topo Apple Notes, título com grifo, etapa numerada, checklist `[ ]`, barra de ações.

13. **Grid & Layout (Modo Claro)**
    * Explicação textual + régua visual do container central (max-width 680–760px), alinhamento à esquerda, espaçamento de 8px/80–120px entre seções — conforme seção 6 deste documento.

14. **Fazer / Evitar (Modo Claro)**
    * Tabela do Do's/Don'ts (seção 7), reaproveitada tal como está na especificação original.

### Footer
* [x] Simples — apenas: link `Voltar para o site`, nota de versão do guia (`v1.0`) e data da última atualização.

---

## 3. Sistema de Cores (Tokens)

Estes tokens são **exclusivos desta página** — não devem ser adicionados ao `src/style.css` global nem à `@theme` do Tailwind usada pelo restante do site, para não colidir com a paleta "Silêncio e Elegância" (`--bg-color`, `--accent-color` etc. já usados em `index.html`, `privacidade.html` etc. têm nomes parecidos e colidiriam em significado).

**Decisão de implementação:** criar um arquivo próprio `src/identidade-visual.css`, importado **apenas** por `identidade-visual.html`, com os tokens abaixo em um seletor com escopo restrito (ex.: `.ig-guide { ... }` envolvendo todo o `<body>` da página), evitando qualquer vazamento global.

| Token (escopado) | Hex | Aplicação |
| :--- | :--- | :--- |
| `--ig-bg-paper` | `#FFFFFF` | Fundo modo claro (Hero, componentes editoriais). |
| `--ig-bg-warm-paper` | `#FBFAF7` | Fundo alternativo claro (blocos de leitura longa). |
| `--ig-bg-dark-notepad` | `#121212` | Fundo modo escuro (seções Método/Bastidores). |
| `--ig-text-ink-primary` | `#111522` | Títulos/texto principal sobre fundo claro. |
| `--ig-text-ink-muted` | `#92949B` | Texto de apoio sobre fundo claro (@handle, legendas). |
| `--ig-text-dark-primary` | `#F5F5F7` | Texto principal sobre fundo escuro. |
| `--ig-accent-amber` | `#EAA034` | Ícones/texto estilo iOS, numeração de etapas. |
| `--ig-highlight-caramel` | `#9E7138` | Fundo do grifo de seleção (usar com `rgba(158,113,56,0.6)`). |
| `--ig-highlight-pin` | `#E7D6C2` | Pinos/handles da seleção. |
| `--ig-verified-cyan` | `#13C4E5` | Exclusivo do selo de verificação. |
| `--ig-check-green` | `#5C9E31` | Fundo do ícone de check quadrado. |

> Nota para o dev: o azul-ciano (`--ig-verified-cyan`) é usado **apenas** no selo de verificação — não usar em botões, links ou qualquer outro elemento.

---

## 4. Tipografia

### Famílias

* **Serifada (títulos, diagnóstico, checklist, nome da autora):** `Playfair Display` — **reaproveitar a fonte já carregada no site** (`STYLE_GUIDE.md`) em vez de importar `DM Serif Display`/`Libre Baskerville`/`Cormorant Garamond` como sugere a especificação original. Motivo: evita uma requisição extra de fonte e o `font-display: swap` já é a política do projeto (`ASSETS_GUIDE.md`); os cards de referência usam uma serifada de alto contraste e o `Playfair Display` cumpre esse papel sem custo adicional de performance. Se a diferença visual for considerada relevante pelo time de conteúdo, importar `DM Serif Display` como alternativa (peso único ~ menor custo que Cormorant/Baskerville).
* **Sans-serif (interface, @handle, microtextos):** `Inter` — já carregada no site, reaproveitar sem alterações.

### Hierarquia

| Elemento | Família | Peso/Estilo | Desktop | Mobile |
| :--- | :--- | :--- | :--- | :--- |
| Nome da autora | Serifada | Bold (700) | 32px | 24px |
| Identificador `@handle` | Sans-serif | Regular (400) | 16px | 14px |
| Título principal (H1 da própria página-guia) | Serifada | Regular/Bold | 56–64px | 36–42px |
| Diagnóstico (frase de abertura do card) | Serifada | Bold (700) | 32px | 24px |
| Checklist — dor (Estilo A) | Serifada | Regular (400) | 24px | 18px |
| Checklist — método (Estilo B) | Serifada | Itálico (400i) | 24px | 18px |
| Interface iOS (`Notas`, `•••`) | Sans-serif | Semibold (600) | 18px | 16px |

---

## 5. Anatomia dos Componentes de Assinatura

### 5.1 Cabeçalho de Autoria (Modo Claro)
* Avatar circular 48–64px (`border-radius: 50%`), à esquerda.
* Nome + selo de verificação na mesma linha; `@handle` em `--ig-text-ink-muted` na linha abaixo.
* Selo: SVG inline de roseta/estrela poligonal preenchida em `--ig-verified-cyan` com check branco central — implementar como símbolo SVG reutilizável, não como imagem.
* **Asset do avatar:** usar uma imagem placeholder neutra (ex.: `public/boutiquelogo.webp` ou um avatar genérico a ser adicionado em `public/`) — **não** usar a foto real de terceiros sem autorização, já que esta é uma página de referência de layout, não um post real.

### 5.2 Grifo de Seleção iOS (Modo Escuro) — componente crítico
* Caixa de fundo `--ig-highlight-caramel` a ~60% de opacidade atrás do trecho grifado.
* Dois pinos circulares `--ig-highlight-pin` com haste vertical fina — um no canto superior-esquerdo do trecho, outro no canto inferior-direito.
* Implementar como um `<mark>` ou `<span class="ig-highlight">` com `::before`/`::after` posicionados para os pinos, para poder ser aplicado a qualquer palavra/trecho dentro de um título, sem markup repetido.

### 5.3 Topo "Apple Notes" (Modo Escuro)
* Esquerda: chevron `<` + `Notas`, sans-serif bold, `--ig-accent-amber`.
* Direita: `•••`, mesma cor.
* Implementar como um parcial de HTML reutilizável (ex.: `<header class="ig-notes-bar">`) já que aparece em toda seção escura.

### 5.4 Divisor Editorial (Modo Claro)
* Linha sólida `--ig-text-ink-primary`, 3–4px de espessura, 96–120px de largura, alinhada à esquerda (não centralizada, não full-width).

### 5.5 Checklists
* **Estilo A (claro):** marcador = quadrado verde arredondado (`--ig-check-green`) com check branco; fonte serifada regular.
* **Estilo B (escuro):** marcador = sintaxe textual `[ ]` em cinza/âmbar; fonte serifada itálica.

---

## 6. Layout e Grid

* Container central: `max-width: 680–760px`, `margin: 0 auto`; as faixas de fundo (claro/escuro) ocupam a tela toda.
* Alinhamento padrão: **à esquerda** para títulos, listas, divisores e botões. Não centralizar blocos de texto longo.
* Espaçamento em múltiplos de 8px: 80–120px entre seções grandes; 40–56px entre título e parágrafo.
* Cada card de exemplo (seções 7 e 12 da estrutura) deve ser exibido com proporção de referência 4:5 (formato de post), com `overflow: hidden` e sem quebrar o layout responsivo da própria página-guia ao redor dele.

---

## 7. Fazer / Evitar

| Fazer | Evitar |
| :--- | :--- |
| Alternar seções inteiras claro → escuro → claro para manter a dualidade Editorial/Bastidores. | Misturar o padrão "Apple Notes" (topo `< Notas` / `•••`) em fundo claro. |
| Fotos reais, orgânicas, com recortes limpos (circulares ou cantos sutilmente arredondados). | Fotos de banco de imagens genéricas ou excessivamente manipuladas. |
| Listas curtas (3–5 itens), fáceis de escanear. | Texto justificado ou centralizado em blocos longos. |
| CTAs diretos e conversacionais (ex.: "Continuação na legenda"). | Botões com gradiente, bordas em pílula, sombras pesadas. |

---

## 8. Assets e Recursos

* **Fontes:** `Playfair Display` + `Inter`, já carregadas via Google Fonts no restante do site — reaproveitar o mesmo `<link>` de `STYLE_GUIDE.md`/`SEO_ANALYTICS.md`, sem novo import.
* **Avatar placeholder:** definir/gerar 1 imagem circular neutra em `public/` (ex. `public/avatar-placeholder.webp`, ≤ 20kb, seguindo `ASSETS_GUIDE.md`).
* **Ícones:** selo verificado, chevron, reticências, check, coração/comentário/enviar — todos como SVG inline (zero requisições extras, zero dependência de ícone externo).
* **Scripts:** nenhum necessário. Página 100% estática (HTML + CSS), consistente com a arquitetura MPA do projeto (`ARCHITECTURE.md`).

---

## 9. Não-Indexação — Requisitos Técnicos

Seguindo o padrão já usado em `privacidade.html`/`termos.html` (meta tag, não `robots.txt`, porque o Google precisa acessar a página para ler a tag):

1. `<meta name="robots" content="noindex, nofollow">` no `<head>`.
   * Diferente de `privacidade.html`/`termos.html` (que usam `noindex, follow`, pois são páginas legais com valor de referência), aqui o correto é **`nofollow`**: é uma página de uso interno, sem necessidade de repassar sinal de rastreamento a partir dela.
2. **Não incluir** a página em `sitemap.xml`. O plugin `vite-plugin-sitemap` (`vite.config.js`) hoje inclui automaticamente todo `.html` de `src/`; será necessário configurar a opção de exclusão do plugin (`exclude: ['/identidade-visual']`) para essa rota não aparecer no sitemap gerado.
3. **Não linkar** a página em nenhum menu, footer ou CTA do site público — acesso só por URL direta/documentação interna.
4. `robots.txt` **não precisa** de `Disallow` para esta rota (mesma lógica já documentada no arquivo: bloquear via `robots.txt` impediria o Google de ler o `noindex`).
5. Manter o script do GA4 no `<head>`, por consistência com o padrão obrigatório do projeto (`SEO_ANALYTICS.md`) — não há dado sensível na página, então isso não representa risco de privacidade.
6. `og:title`/`og:image` podem ser omitidos (a página não deve ser compartilhada externamente).

---

## 10. Testes (conforme `TESTING_GUIDE.md`)

* Como a página **não é linkada** a partir de `/`, o crawler dinâmico do `tests/smoketest.spec.js` não vai alcançá-la — não há regressão a esperar dele, mas também não há cobertura automática por padrão.
* Criar um teste dedicado `tests/identidade-visual.spec.js` que:
  1. Navega diretamente para `/identidade-visual` e valida status 200.
  2. Confirma a presença de `<meta name="robots" content="noindex, nofollow">`.
  3. Confirma que a rota **não aparece** em `/sitemap.xml`.
  4. Verifica presença de `<title>` (mesmo não sendo indexada, é boa prática ter um título coerente para quem acessa a aba do navegador).

---

## 11. Fora de Escopo

* Nenhuma alteração no `docs/specs/STYLE_GUIDE.md` ou em `src/style.css` (tokens globais do site institucional).
* Nenhum CTA de conversão, formulário ou integração com `formulario.html`.
* Nenhuma automação de geração de cards (export para imagem, Canva, etc.) — a página é apenas referência visual em HTML, não uma ferramenta de exportação.

---

**Nota para o desenvolvedor:** ao implementar, registrar `identidade-visual` na exclusão do `vite-plugin-sitemap` (seção 9.2) e criar `src/identidade-visual.css` isolado (seção 3) — esses dois pontos são os únicos desvios do fluxo padrão de criação de página descrito em `ARCHITECTURE.md`.
