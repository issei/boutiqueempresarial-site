# Style Guide - Boutique Empresarial

Este guia define a identidade visual e "vibe" da Boutique Empresarial, mapeando os elementos de design atuais para **Tailwind CSS v4**.

## Filosofia Visual: "Silêncio e Elegância"

O design deve transmitir autoridade sem gritar.
*   **Minimalismo Funcional**: A estrutura é o destaque.
*   **Espaço em Branco (Breathable)**: O conteúdo deve respirar.
*   **Tipografia Clássica e Moderna**: Serif para títulos (Autoridade), Sans-Serif para corpo (Legibilidade).

---

## Paleta de Cores

| Cor | Variável CSS (Atual) | Tailwind Class (Sugerida) | Hex | Uso |
| :--- | :--- | :--- | :--- | :--- |
| **Background Principal** | `--bg-color` | `bg-[#f6f2e9]` | `#f6f2e9` | Creme: fundo geral, reduz cansaço visual. `adr-paleta-v4.md`. |
| **Faixa bege** | `--sand` | `bg-[#ebe2d1]` | `#ebe2d1` | Seções alternadas, FAQ, "Quem vai conversar". |
| **Fundo escuro** | `--ink` | `bg-[#131210]` | `#131210` | Topo, hero, "O ponto cego", "Por que agora", rodapé. |
| **Cartões** | `--card` / `--card-2` | `bg-white` / `bg-[#fbf8f3]` | `#ffffff` / `#fbf8f3` | Cartões sobre creme ou bege. |
| **Texto Primário** | `--text-primary` | `text-gray-900` ou `text-[#1f1f1f]` | `#1f1f1f` | Títulos e texto principal. |
| **Texto Secundário** | `--text-secondary` | `text-gray-600` ou `text-[#555555]` | `#555555` | Descrições e notas. |
| **Destaque (Accent)** | `--accent-color` | `bg-[#c14f1b]` | `#c14f1b` | Botões (texto branco 4,8:1), barra de progresso, palavra em itálico de títulos grandes. Revisa `adr-botao-laranja.md`: `adr-paleta-v4.md`. |
| **Laranja para texto** | `--accent-text` | `text-[#a8420f]` | `#a8420f` | Eyebrows e numerais pequenos sobre creme ou bege (≥ 4,5:1). |
| **Laranja sobre escuro** | `--accent-light` | `text-[#e8743b]` | `#e8743b` | Eyebrows e números das opções sobre `#131210` (6,2:1). |
| **Ouro Sutil (Detalhe)** | `--gold-subtle` | `text-gold-400` ou `text-[#C5A059]` | `#C5A059` | Filetes, bordas, o ponto do wordmark. **Não** para texto — 2.20:1 sobre o creme. |
| **Ouro para texto** | `--gold-text` | `text-[#886829]` | `#886829` | O único ouro que pode carregar uma palavra (≥ 4.5:1). `HARNESS_AEO.md` §B5. |
| **Borda** | `--border-color` | `border-gray-200` ou `border-[#E5E5E5]` | `#E5E5E5` | Divisórias sutis. |

## Tipografia

### Títulos (Serif)
**Fonte:** 'Playfair Display', serif.
**Vibe:** Autoritária, Elegante, Editorial.

*   `h1`: `text-5xl md:text-6xl font-playfair font-normal tracking-tighter tight-leading`
*   `h2`: `text-3xl md:text-4xl font-playfair font-normal mb-8`
*   `h3`: `text-2xl font-playfair font-semibold mb-4`

### Corpo (Sans-Serif)
**Fonte:** 'Inter', sans-serif.
**Vibe:** Limpa, Legível, Moderna.

*   `body`: `font-inter font-light text-lg leading-relaxed`
*   `small`: `uppercase tracking-widest text-xs font-inter` (usado em subtítulos e labels)

## Componentes Chave

### Botões
Botões devem ser sólidos, com bordas retas e transições suaves.

*   **Primário ("Aplicar")**:
    ```html
    <a href="#" class="px-10 py-4 border border-black bg-black text-white text-sm uppercase tracking-wider hover:bg-transparent hover:text-black transition-all duration-300">
      Aplicar
    </a>
    ```

*   **Link de Navegação**:
    `uppercase text-xs tracking-widest hover:border-b hover:border-black transition-all duration-300`

### Cards e Estrutura
*   **Container**: `max-w-4xl mx-auto px-6`
*   **Section**: `py-24` (Respiro amplo)
*   **Step Card**:
    `bg-white p-10 border border-gray-200 hover:shadow-lg transition-shadow duration-300`

---

## Tailwind v4 — estado atual

`src/style.css` **já existe** e é a fonte da verdade dos tokens: `@import "tailwindcss"`, as fontes auto-hospedadas (`@font-face`), o bloco `@theme` e as variáveis `:root` da tabela acima. O `design-system/` (Claude Design) é derivado dele — se divergirem, `src/style.css` vence.

As páginas ainda carregam CSS próprio no `<style>` de cada `.html` (ex.: `formulario.html`, `index.html`); a migração das classes manuais `.btn` / `.container` para utilitários é incremental e ainda não terminou. O trecho abaixo é o `@theme` original, mantido como referência de intenção:

1.  `src/style.css` começa assim:
    ```css
    @import "tailwindcss";

    @theme {
      --font-playfair: 'Playfair Display', serif;
      --font-inter: 'Inter', sans-serif;
      
      --color-brand-bg: #f5f2eb;
      --color-brand-gold: #C5A059;
      --color-brand-black: #1f1f1f;
    }
    ```
2.  Cada página importa `/style.css` (módulo Vite). A exceção é `identidade-visual.html`, que tem o próprio `identidade-visual.css` — é um segundo sistema visual, por decisão (`pages/identidade-visual.md`).
3.  Meta: substituir as classes manuais `.btn` e `.container` pelas utilitárias acima, página a página, sem alterar o visual.

Isso mantém o design system escalável e consistente em todas as novas páginas.
