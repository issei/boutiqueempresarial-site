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
| **Background Principal** | `--bg-color` | `bg-offwhite-50` ou `bg-[#f5f2eb]` | `#f5f2eb` | Fundo geral, reduz cansaço visual. |
| **Texto Primário** | `--text-primary` | `text-gray-900` ou `text-[#1f1f1f]` | `#1f1f1f` | Títulos e texto principal. |
| **Texto Secundário** | `--text-secondary` | `text-gray-600` ou `text-[#555555]` | `#555555` | Descrições e notas. |
| **Destaque (Accent)** | `--accent-color` | `text-black` ou `bg-black` | `#1C1C1C` | Botões e elementos de ênfase máxima. |
| **Ouro Sutil (Detalhe)** | `--gold-subtle` | `text-gold-400` ou `text-[#C5A059]` | `#C5A059` | Pontos, linhas finas e números. |
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

## Migração para Tailwind v4

Atualmente, o projeto utiliza variáveis CSS no `<style>` do `index.html`. Para migrar totalmente para o **Tailwind v4**, devemos:

1.  Criar um arquivo `src/style.css` com:
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
2.  Importar este CSS no `index.html` (ou via módulo Vite).
3.  Substituir as classes manuais `.btn` e `.container` pelas classes utilitárias configuradas acima.

Isso garantirá que o design system seja escalável e consistente em todas as novas páginas.
