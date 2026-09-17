repo: issei/boutiqueempresarial-site
branch: main

## Last sync

date: 2026-09-14T00:00:00Z

### Updated in this project

- Extracted the institutional and Instagram palettes into `tokens/` and wired `styles.css`.
- Copied the real webfonts, logo, portrait and the six social SVG icons into `assets/`.
- Authored 28 React primitives across site, forms and social-card concerns.
- Built clickable UI kits for the website funnel and the Instagram carousel.

## Screen map

| Project screen | Repo files |
| --- | --- |
| `ui_kits/site/HomeScreen.jsx` | `src/index.html`, `src/style.css` |
| `ui_kits/site/FormScreen.jsx` | `src/formulario.html`, `src/obrigada.html` |
| `ui_kits/site/ProgramScreen.jsx` | `src/index-legado.html` |
| `ui_kits/social/CardSlides.jsx` | `src/identidade-visual.html`, `src/identidade-visual.css` |
| `tokens/*.css` | `src/style.css`, `src/identidade-visual.css`, `docs/specs/STYLE_GUIDE.md` |
| `guidelines/*.card.html` | `docs/specs/STYLE_GUIDE.md`, `docs/specs/ASSETS_GUIDE.md`, `src/identidade-visual.html` |
| `assets/` | `src/assets/fonts/`, `public/boutiquelogo.webp`, `public/fotos/talita-issei.webp`, `public/favicon.svg` |
