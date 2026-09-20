# Especificação de Nova Página - Template

Para solicitar a criação de uma nova página, preencha este template e salve como `docs/specs/pages/NOME_DA_PAGINA.md`.

---

## 1. Informações Básicas
*   **Nome do Arquivo**: `exemplo.html` (deve ser em minúsculo, sem espaços)
*   **URL Final**: `boutiqueempresarial.com.br/exemplo`
*   **Título da Página (SEO)**: `Título Impactante | Boutique Empresarial`
*   **Descrição (Meta Description)**: `Resumo curto e persuasivo do conteúdo da página para aparecer no Google (max 160 caracteres).`

## 2. Estrutura e Layout

### Header
*   [ ] Padrão (Logo + Menu)
*   [ ] Minimalista (Apenas Logo)
*   [ ] Outro: __________________

### Seções de Conteúdo
descreva a ordem e o objetivo de cada bloco.

1.  **Hero Section**:
    *   **Headline (H1)**: "Texto principal de impacto"
    *   **Subheadline**: "Texto de apoio"
    *   **CTA (Botão)**: "Texto do Botão" -> Link para: `/destino`
    *   **Imagem de Fundo/Contexto**: (Descreva a imagem desejada)

2.  **Bloco de Conteúdo 1**:
    *   **Tipo**: (Texto corrido / Lista de Benefícios / Grid de Cards / Depoimento)
    *   **Conteúdo Chave**: O que deve ser comunicado aqui?

3.  **Bloco de Conteúdo 2**:
    ...

### Footer
*   [ ] Padrão Completo
*   [ ] Simples (Copyright apenas)

## 3. Assets e Recursos
*   **Imagens Necessárias**: Liste imagens que precisam ser criadas ou buscadas.
*   **Scripts Específicos**: Precisa de algum comportamento JS especial? (ex: formulário, modal, slider).

## 4. Estilo e Vibe
*   **Paleta Dominante**: (Clara / Escura / Destaque)
*   **Feeling**: (Autoridade / Urgência / Institucional / Vendas)

## 5. Contrato (`HARNESS_AEO.md`)
*   **Indexável?**: (Sim / Não — decide o `meta robots`, e o `vite.config.js` tira do sitemap toda página `noindex`.) Página `noindex` fica isenta de canonical, OG e Twitter.
*   **Tipo no JSON-LD**: (`WebPage` + `FAQPage`… / `ContactPage` / `WebPage` simples — §B2)
*   **Bloco AEO** ("Em síntese" + FAQ, §B3): (Sim / Não — só páginas indexáveis). Se sim, liste as perguntas e respostas aqui: o texto visível e o do JSON-LD são o mesmo.
*   **Companion Markdown** (`public/<slug>.md`, §B4): (Sim / Não — só páginas indexáveis). Se sim, acrescentar a rota em `MARKDOWN_MAP` de `infra/cloudfront-functions/viewer-request.js`.
*   **Rastreamento e consentimento**: bloco inline de consentimento antes do Pixel e do `gtag.js` (`SEO_ANALYTICS.md` §3). Eventos novos exigem spec em `docs/specs/design/`.

---

**Nota para o Desenvolvedor**:
O Vite detecta `src/*.html` sozinho — não registre a página em lugar nenhum. Os testes de SEO, AEO, a11y e smoke também iteram por glob, então a página nova já entra no `npm run gate`. Se ela tiver comportamento próprio, acrescente `tests/<nome>.spec.js`.
