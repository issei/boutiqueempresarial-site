# Boutique Empresarial — Design System

Design system for **Boutique Empresarial**, a Brazilian business-architecture
practice (*Arquitetura de Negócios*) that restructures service companies so
they run without the founder at the centre of every decision. The public
product is a single conversion funnel: a free 45-minute **Diagnóstico
Gratuito** that qualifies founders into the paid restructuring programme.

The practice is led by **Talita Issei**, *Arquiteta de Negócios* — 15+ years
running projects, processes and people at KPMG, Itaú, Vivo and Accenture, and
five years applying that to service businesses. She is the face of both
surfaces: she conducts the diagnosis and she is the author of the Instagram
content.

The brand's stated philosophy is **"Silêncio e Elegância"** — authority without
raising its voice. Functional minimalism, generous white space, serif for
authority and sans for legibility. Its own words for what it sells:
*"Quando tudo depende de você, o crescimento vira peso. Nós transformamos isso
em estrutura."*

## Surfaces represented here

| Surface | What it is | Palette | Recreated in |
| --- | --- | --- | --- |
| **Site institucional** | `boutiqueempresarial.com.br` — the Diagnóstico landing page, the 9-step application form, the confirmation page, plus the legacy programme page still in the repo | Cream `#f5f2eb` / ink `#1f1f1f` / one gold hairline | `ui_kits/site/` |
| **Cards sociais** | Instagram carousels for `@issei.talita`, governed by an internal guide page | Light "Fachada Editorial" ↔ dark "Bastidores" with iOS amber `#EAA034` | `ui_kits/social/` |

**These two palettes do not mix.** The site never uses amber; the cards never
use the site's cream or its gold hairline. Token prefixes enforce the split:
`--be-*` for the institution, `--ti-*` for the content system.

## Sources

Everything here was read from source, not inferred from screenshots.

- **GitHub:** <https://github.com/issei/boutiqueempresarial-site> (branch `main`) —
  the repository this system is derived from. Worth exploring further if you are
  building against this brand: the page specs under `docs/specs/pages/` and the
  `STYLE_GUIDE.md` / `ASSETS_GUIDE.md` / `HARNESS_AEO.md` documents carry
  reasoning that this design system condenses.
- **Attached codebase:** `boutiqueempresarial-site/` (same repository, mounted
  locally). Files read:
  - `src/style.css` — the institutional token source of truth
  - `src/index.html` — home (Diagnóstico Gratuito), with page-specific CSS
  - `src/index-legado.html` — the legacy programme page
  - `src/formulario.html` — the 9-step application form
  - `src/obrigada.html` — confirmation page
  - `src/identidade-visual.css` + `src/identidade-visual.html` — the internal
    Instagram visual guide
  - `docs/specs/STYLE_GUIDE.md`, `docs/specs/ASSETS_GUIDE.md`
  - `public/llms.txt` — the brand's own tone-of-voice instructions for AI
- **Live site:** <https://boutiqueempresarial.com.br/>
- No Figma file, no slide deck, and no PDF brand book were provided.

---

## CONTENT FUNDAMENTALS

### Language
Brazilian Portuguese, always. No English in UI copy, no anglicisms
("hacks", "growth", "mindset" all absent). Trademark symbols are used on the
proprietary names: *Boutique Empresarial™*, *Diagnóstico de Estabilidade™*,
*Arquitetura Operacional™*, *Ritmo de Execução™*.

### Voice: "comando silencioso"
The repo's own `llms.txt` specifies the register: **elegant, direct, minimal,
authoritative.** It explicitly bans exclamation marks in excess and aggressive
digital-marketing jargon. Two vocabulary rules are stated as law:

- Say **"Arquitetura de Negócios"**, never "consultoria".
- Say **"Estabilidade"**, never "produtividade".

### Person
The site moves between two voices on purpose:

- **"Nós" / impersonal** for what the method does: *"Durante a reunião,
  avaliamos o momento atual da sua operação"*, *"Mapeamos quais decisões…"*
- **"Eu" (Talita)** the moment authority or scarcity is at stake: *"Por ser uma
  análise individual, conduzida diretamente por mim, libero apenas 3 vagas por
  semana"*, *"Eu analiso se o momento da sua empresa se encaixa"*.

The reader is always **"você"** — never "o cliente", never plural formal
"vocês". The audience is named in the feminine: *fundadoras*, *empresárias*.

### Register shifts by surface
The site is polished; the Instagram cards and the newest home copy allow spoken
Brazilian contractions — *"tão te fazendo perder o controle"*, *"o que falta pra
isso parar de se repetir"*, *"'Rapidinho' o dia inteiro"*. That informality is
deliberate proximity, not sloppiness. **Legal, form and confirmation copy never
contracts.**

### Structure of an argument
Every page runs the same shape: **name the pain → prove the diagnosis → show
the method in three parts → qualify hard → one action.** Qualification is
always two-sided: *"Para quem é"* is followed by *"Para quem não é"*, and the
"não" is stated flatly — *"Nesses casos a resposta é não."*

### Casing and punctuation
- Sentence case everywhere. Uppercase appears **only** in eyebrow labels
  (`CLAREZA • ESTABILIDADE • ESTRUTURA`) with wide tracking.
- Middot `•` separates eyebrow terms — never a pipe or a slash.
- Curly quotes for scare quotes: *virou o "ponto final" de tudo*.
- Em dash with spaces for asides: *— KPMG, Itaú, Vivo, Accenture*.
- Numbers as digits with the unit spelled: *45 minutos*, *3 vagas por semana*,
  *R$ 30k a R$ 100k*, *5 colaboradores*.
- Headlines take no terminal full stop; the wordmark's gold period is the one
  exception and it is decoration.

### Emoji
Almost never. Exactly two exist in the source, both functional and both inside
conversational copy: **👇** closing a card (*"Continuação na legenda 👇"*) and
**⏳** marking urgency in the form (*"⏳ Aplicação rápida (2 minutos)"*).
Never in headings, never in the institutional site body, never as a bullet or
an icon substitute. Do not add a third.

### Buttons and microcopy
Verb-first, specific, never clever: *Solicitar Diagnóstico Gratuito*,
*Preencher Aplicação*, *Aplicar para a Boutique*, *Enviar aplicação*,
*Próximo*, *Voltar*. Errors are instructions, not apologies: *"Informe seu nome
completo."*, *"Selecione uma opção."*, *"É necessário aceitar o termo para
enviar a aplicação."* Scarcity is stated as fact with a number, never as
pressure.

---

## VISUAL FOUNDATIONS

### Colour
Two palettes, strictly separated (see the table above). The institutional side
is a three-colour system: cream ground `#f5f2eb`, white for lifted bands and
cards, ink `#1f1f1f` for type, with `#555555` for body copy and `#E5E5E5` for
hairlines. Gold is the **only** chroma, and it is split for accessibility:
`--be-gold #C5A059` is decorative (rules, borders, the wordmark's period) and
`--be-gold-text #886829` is the only gold allowed to carry a word (2.20:1 vs
4.5:1 on cream). One inverted section per page — ink ground, cream headings,
`#cfcabf` body, ≈15:1.

The social system adds a light/dark duality with an iOS-amber accent, plus two
reserved colours that appear nowhere else: cyan `#13C4E5` for the verified
badge and green `#5C9E31` behind the checklist check.

### Type
**Playfair Display** (self-hosted variable woff2) for every heading, numeral
and the wordmark — at weight **400**, not bold; authority comes from the
letterforms and the negative tracking (−0.02 to −0.025em), not from weight.
**Inter** (self-hosted variable woff2) for body at weight **300** with
line-height **1.8** — the airiness is the brand. `<strong>` goes to 600 and
back to full ink; that is the only emphasis in running text.

One deliberate inversion: the **application form and confirmation page set
Playfair on `<body>`**, so questions read as a letter rather than an interface.

Measures are tight: 66ch body, 54ch lead, 68ch for prose blocks, 46–58ch in the
guide. Social artboards use 56–64px H1, 32px diagnóstico, 24px checklist.

### Space and layout
Sections breathe at `100px` (legacy) or `clamp(72px, 11vh, 128px)` (home).
The scale is multiples of 8 with 4 and 20 as inherited exceptions. The single
most important layout decision is the **measure contrast**: body content sits
in a 900px container while the hero and the one inverted section break out to
1200px. Within the hero, a 12-column grid keeps the title in columns 1–7 — that
column, not the viewport, is what caps the H1 clamp. Forms are 680px; social
reading width is 680–760px.

Alignment is **left**, always. Centring is reserved for three places: the
footer, the manifesto pull-quote on the legacy page, and the form/confirmation
pages. Long blocks are never centred and never justified. Nothing is fixed
except the mobile CTA bar (below 768px), and the page reserves bottom padding
so it cannot cover the last footer line.

### Backgrounds
Flat colour only. **No gradients** anywhere in the institutional system — the
one gradient in the entire codebase is the caramel→amber fill of the social
avatar *placeholder*, which production replaces with a photo. No patterns, no
textures, no noise, no hand-drawn illustration, no background imagery. Bands of
cream and white alternate; that alternation is the whole background language.

### Borders, corners, cards
Corners are essentially **square**. The only radii in the system: 2px (site
button), 4px (form button and 0–10 chips), 3px (checkbox), 6px (social check
tile), 50% (avatars, radio dots, progress dots). Cards are white, **0px
radius**, 1px `#E5E5E5` border, 40px padding — no shadow.

### Shadow
**One shadow exists**: `0 10px 30px rgba(0,0,0,.05)` on the legacy step card's
hover. The home page deliberately dropped it because those cards aren't
clickable. There are no inner shadows, no glows, no elevation scale. If a card
isn't a link, it doesn't lift.

### Transparency and blur
Effectively absent. **Zero `backdrop-filter`** in the codebase. The only alpha
values in the whole system: `rgba(0,0,0,.15)` for a form field's underline,
`rgba(0,0,0,.08)` for a dark card's border, `rgba(158,113,56,.6)` for the iOS
highlight, and opacity `.9`/`.95` on a logo. No protection gradients, no
frosted capsules — text always sits on flat colour, which is why it never needs
one.

### Motion
The home spec states it outright: *"Sem movimento não solicitado."* Nothing
animates on load. Nothing animates on scroll. No parallax, no reveal, no
counter. Motion exists only as feedback:

- **200ms** — radio dot scales in; 0–10 chip fills.
- **300ms** `ease` — button swaps background/colour; link swaps underline colour.
- **400ms** `ease-out` — form step slides in 10px from the right; progress bar advances.
- **400ms** `cubic-bezier(.36,.07,.19,.97)` — horizontal shake on an invalid step.

No bounce, no spring, no overshoot. `prefers-reduced-motion` disables all of it.

### Hover and press
Hover is a **colour inversion**, never an opacity fade and never a scale.
The button goes ink→transparent with the label ink→black; the nav link's gold
hairline goes ink; a footer link goes secondary→primary. Press exists in one
place only: the form button's `transform: scale(.98)`. Disabled is opacity
`.6` (`.45` for a disabled option). Focus is a 2px ink outline at 2px offset,
or a 2px ink underline on a text field — the brand never removes focus.

### Rules and dividers
Two distinct languages. The site uses a **1px gold hairline, 56–64px, flush
left**, to close a name or a summary, plus a 2px gold left-border on
qualification lists. The social system uses a **solid 3–4px ink bar, 96–120px,
flush left**. Neither is ever centred or full-width; the only full-width rule is
the 1px `#E5E5E5` section border.

### Imagery
One real portrait carries the site, and it appears once: a light rectangle
inside the inverted section — no crop shape, no filter, no border, no radius.
The tone is warm-neutral, soft daylight, blurred background, nothing graded or
stylised. The internal guide bans stock photography and heavy retouching
outright, and asks for *"fotos reais, orgânicas, com recortes limpos"*.
Technically: WebP, ≤800px / <80kb for content, ≤1920px / <200kb for heroes,
explicit `width`/`height` to prevent layout shift, `loading="lazy"` below the
fold.

---

## ICONOGRAPHY

**The institutional website has no icons at all.** Not one. Hierarchy is done
with type, space and a gold rule; lists use a gold left-border instead of a
bullet; the FAQ marker is the typographic characters `+` and `–`; the form's
progress is dots and a bar.

The only icons in the brand belong to the **social card system**, and they are
hand-authored inline SVGs in `identidade-visual.html`. All six are copied here
verbatim to `assets/icons/`:

| File | Use | Stroke / fill |
| --- | --- | --- |
| `verified-badge.svg` | Instagram verified seal beside the author name | Filled `#13C4E5`, white 1.8 tick |
| `check.svg` | Tick inside the green check tile (Estilo A checklist) | White stroke 2 |
| `chevron-left.svg` | The "‹ Notas" back arrow on dark cards | Amber stroke 2.4 |
| `heart.svg` | Card action row | `currentColor` stroke 1.6 |
| `comment.svg` | Card action row | `currentColor` stroke 1.6 |
| `send.svg` | Card action row | `currentColor` stroke 1.6 |

Notes:
- **No icon library.** No Lucide, no Heroicons, no Font Awesome, no icon font,
  no sprite sheet — and no substitution was needed, because the real assets
  were available to copy.
- **Unicode as glyph** is a real pattern here: `•••` for the Notes menu,
  `‹` in the back label, `[ ]` as the literal checkbox of the Estilo B
  checklist, `•` as the eyebrow separator, `+`/`–` for the FAQ.
- **Emoji as icon: no.** The two emoji that exist (👇 ⏳) are punctuation in
  conversational copy, not interface elements.
- Favicons and the app icon are in `assets/logo/` (`favicon.svg`,
  `apple-touch-icon.png`).

---

## Components

React primitives, grouped by concern. Every component is styled exclusively
through the CSS custom properties in `tokens/`.

### `components/site/` — institutional surfaces
`Button` · `ApplyLink` · `Wordmark` · `Container` · `Section` · `Eyebrow` ·
`FindingCard` · `PainList` · `StepList` · `GoldRule` · `FaqAccordion` ·
`TldrBlock` · `SiteFooter` · `StickyCta`

### `components/forms/` — the application form
`FormStep` · `TextField` (with `Hint`, `FieldError`) · `RadioGroup` ·
`CheckboxOption` · `ScaleSelect` · `ProgressBar` · `StepDots`

### `components/social/` — Instagram content cards
`ContentCard` (with `StepTitle`) · `AuthorHeader` · `NotesBar` · `ModeTag` ·
`EditorialDivider` · `Checklist` · `SelectionHighlight`

Every component corresponds to something that exists in the source. There are
no invented primitives — no Toast, no Avatar, no Tabs, no Tooltip, because the
brand has none.

**Intentional additions:** none. `Container`, `Section` and `Eyebrow` are
extractions of the source's `.container` / `section` / `.hero-sub` rules rather
than new inventions.

---

## Index

```
styles.css                  @import list — the only file consumers link
thumbnail.html              homepage tile
readme.md                   this file
SKILL.md                    Agent Skills wrapper
github.md                   upstream source association

tokens/
  fonts.css                 @font-face for Inter + Playfair Display
  colors.css                --be-* institutional, --ti-* social, semantic aliases
  typography.css            families, weights, fluid scale, measures
  spacing.css               8pt scale, containers, grid, tap targets
  borders.css               radii, borders, the one shadow, focus ring
  motion.css                durations, easings, @keyframes (step-in, shake)

assets/
  fonts/                    inter-latin.woff2, playfair-latin.woff2
  logo/                     boutiquelogo.webp, boutiqueempresarial.png,
                            favicon.svg, apple-touch-icon.png
  icons/                    the six social SVGs
  fotos/                    talita-issei.webp
  og/                       og-image.jpg

components/site/            14 institutional primitives + site.card.html
components/forms/            7 form primitives + forms.card.html
components/social/           7 content-card primitives + social.card.html

guidelines/                 23 foundation specimen cards
                            (Colors · Type · Spacing · Brand)

ui_kits/site/               Home, Aplicação, Obrigada, Programa — clickable
ui_kits/social/              Instagram carousel, 1080×1350 artboards

templates/conversational-form/
                            One-question-at-a-time application (DC template)
                            + README.md with the full UX spec (A–H)
```

## Known gaps

- **Fonts** are the real self-hosted files from the repo, so no Google Fonts
  substitution was needed. Note the repo's `ASSETS_GUIDE.md` still recommends
  loading them from Google; `style.css` (newer) self-hosts them for privacy.
  Self-hosting is treated as current here.
- `identidade-visual.html`'s swatch table documents `--text-ink-muted` as
  `#92949B` while the stylesheet ships `#5F6368`. The code value is the token;
  the documented value is kept as `--ti-ink-muted-documented`.
- No slide template was provided, so this system contains no slide layouts.
- Legal pages (`privacidade.html`, `termos.html`) were not recreated.
