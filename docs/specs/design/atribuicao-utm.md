# Atribuição de mídia: primeiro e último toque em cookie first-party

**Status**: Em implementação (branch `feat/atribuicao-utm`)
**Data**: 2026-10-07
**Relaciona-se com**: `docs/specs/pages/formulario.md` §3.2; CRM Spec 022 (repositório `boutiqueempresarial-crm`)

## Problema

O Meta reporta mais leads atribuídos do que o CRM tem com UTM. Muitos leads entram como "Orgânico". A investigação de 2026-10-07 achou duas causas no site:

1. **A home (landing dos anúncios) não lia as UTMs.** Os CTAs `href="/formulario.html"` não levam a query string. Anúncio → home → formulário = lead sem UTM.
2. **As UTMs ficavam só em `sessionStorage`.** O valor morre quando a aba fecha. Quem clica no anúncio hoje e volta amanhã sem parâmetros envia o formulário sem UTM. O comentário dizia "first-touch", mas o código era último toque dentro da aba.

## Decisão

Um módulo `src/js/attribution.js`, carregado no `<head>` de toda página pública, grava a atribuição num cookie first-party.

| Item | Valor |
| :-- | :-- |
| Cookie | `be_attr`, JSON com `first` e `last` |
| Parâmetros lidos | `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid` |
| Toque | gravado só quando a URL traz ao menos um parâmetro: `{parâmetros, at (ISO 8601), landing (pathname), ref (referrer)}` |
| `first` | gravado uma vez, **nunca sobrescrito** |
| `last` | sobrescrito a cada visita **com** parâmetros (último toque não direto). Visita sem parâmetro não apaga nada |
| Validade | 90 dias, renovada a cada toque |
| Escopo | `path=/`, `domain=.boutiqueempresarial.com.br` em produção (cobre `www` e o domínio sem `www`), `SameSite=Lax`, `Secure` em https |
| Tamanho | cada valor truncado em 150 caracteres (cookie < 4 KB) |
| Base legal | legítimo interesse: atribuição do próprio funil, sem compartilhamento com terceiros pelo cookie. Grava **sem** depender do banner de consentimento (decisão do responsável do produto, 2026-10-07). Listado em `privacidade.html` |

O módulo expõe `window.BE_ATTR = {first, last}`. Como é `type="module"` e vem antes do módulo inline do formulário, executa antes dele (módulos rodam em ordem de documento).

## Formulário

- `tracking[k]` = URL atual → `BE_ATTR.last[k]` → `sessionStorage` (fallback para cookie bloqueado). `sessionStorage` continua sendo gravado.
- Campos novos no payload (parcial e final): `first_utm_source`, `first_utm_medium`, `first_utm_campaign`, `first_utm_content`, `first_utm_term`, `first_fbclid`, `first_gclid`, `first_touch_at`, `last_touch_at`, `landing_page`. Vazio = `""`.
- `utm_*`, `fbclid` e `gclid` passam a significar o último toque não direto.

## Pixel: um Lead por envio (`obrigada.html`)

- O `Lead` do Pixel só dispara com `eid` (URL ou `ld`), sempre com `eventID` = `eid` (deduplicação com o CAPI).
- Sem `eid` não dispara: visita direta à obrigada não é envio. Antes, disparava um `Lead` sem `eventID`, que a Meta não deduplica.
- Uma vez por `eid`: a flag `localStorage['lead_sent_<eid>']` impede que reabrir a página (inclusive depois da janela de 48 h de deduplicação da Meta) conte o mesmo lead de novo.

## Fora de escopo

- Planilha: as colunas `first_*` não entram na aba Respostas (o CRM é o destino; o Apps Script repassa o JSON inteiro).
- Propagar a query string nos links da home: desnecessário com o cookie.

## Critérios de pronto

`tests/atribuicao.spec.js` (todos falham sem o módulo):

1. Home com `?utm_source=meta&utm_campaign=c1&utm_content=a` → CTA → payload do formulário com `utm_content=a`, `first_utm_content=a`, `landing_page=/`.
2. Nova página sem parâmetros no mesmo contexto → o payload continua com `utm_content=a`.
3. Visita posterior com `utm_content=b` → `utm_content=b` e `first_utm_content=a`.
4. Visita sem parâmetros não cria cookie; cookie corrompido não quebra a página.

`npm run gate` verde.
