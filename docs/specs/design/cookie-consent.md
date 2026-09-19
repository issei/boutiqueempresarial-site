# Banner de cookies e Google Consent Mode v2

**Status**: Implementada (PR: a preencher)

## Objetivo

Deixar de carregar GA4 e Meta Pixel sem consentimento, com um aviso **discreto mas visível**, e dar à
pessoa como rever a escolha depois. Referência de arquitetura: `D:\projetos\mauricio-site`
(`src/js/cookie-consent.js`) — adaptada, não copiada.

## Por que duas partes

O padrão negado tem de ser declarado **antes** de o Pixel e o `gtag.js` rodarem. Um `<script type="module">`
é adiado até o fim do parse, então chegaria tarde. Daí a divisão:

| Parte | Onde | Papel |
| :-- | :-- | :-- |
| Bloco inline | `<head>` das 8 páginas, **antes** do Pixel | `gtag('consent','default', …denied)`, releitura do que já foi decidido, e `window.__ccMarketing` para o Pixel |
| `src/js/cookie-consent.js` | módulo adiado | banner, diálogo de preferências, link de reabertura, `consent update` |

O Pixel ganhou `fbq('consent', window.__ccMarketing ? 'grant' : 'revoke')` **antes** de `fbq('init')`:
enquanto revogado ele enfileira os eventos e os libera no `grant`, sem perder o `PageView`.

## Categorias

Três, não quatro — o site não usa cookies de personalização e inventar a categoria seria descrever
errado o que fazemos.

| Categoria | Estado inicial | Cobre | Sinais do Consent Mode |
| :-- | :-- | :-- | :-- |
| Necessários | sempre ativo | funcionamento e a própria escolha (`be_consent`) | `functionality_storage`, `security_storage` |
| Análise | negado | GA4 | `analytics_storage` |
| Marketing | negado | Meta Pixel | `ad_storage`, `ad_user_data`, `ad_personalization` |

`wait_for_update: 500` dá meio segundo para o módulo aplicar a escolha guardada antes de o GA4 decidir
disparar sem consentimento.

## Interface

- **Banner**: cartão de até 380 px no canto inferior **direito**, fundo branco, filete dourado no topo —
  discreto, sem cobrir a página, sem escurecer o fundo. **Aceitar**, **Recusar** e **Preferências**,
  com Recusar do mesmo peso visual de Aceitar (a ANPD não admite recusa mais difícil que aceite).
  O canto direito não é estética: o conteúdo é alinhado à esquerda e a primeira versão, à esquerda,
  cobria o botão "Solicitar Diagnóstico Gratuito" do hero. Abaixo de 768 px o cartão ocupa a largura
  e sobe para 96 px do rodapé, acima da barra fixa de CTA da home.
- **Preferências**: `<dialog>` nativo. Backdrop, trava de foco e Esc vêm do navegador; checkboxes reais
  em vez de toggles com `aria-pressed`. Bem menos código que a referência, e acessível de origem.
- **Reabrir**: o módulo injeta um botão "Preferências de cookies" em `footer .footer-legal` (ou no
  `footer`). Nas páginas sem rodapé, `formulario.html` chama `window.cookieConsent.open()` do próprio
  texto legal; `obrigada.html` e `404.html` ficam sem — são páginas terminais e a escolha vale para todo
  o domínio.
- **Cores e tipografia**: tokens de `src/style.css` com fallback literal, porque `identidade-visual.html`
  não carrega a folha. Nenhuma cor nova — sem desvio de paleta, sem ADR.

## Armazenamento

`localStorage["be_consent"] = { v: 1, ts: <ISO>, cat: { analytics, marketing } }`. Versão incompatível ou
`localStorage` indisponível equivale a "ainda não decidiu": pergunta de novo. Nunca "assume aceito".

`navigator.globalPrivacyControl === true` é tratado como recusa expressa: grava a recusa e não mostra
o banner.

## API

`window.cookieConsent.open()` / `.get()` / `.reset()`.

## Critérios de pronto

1. Sem escolha: banner visível e os quatro sinais em `denied`.
2. O `consent default` aparece nos bytes servidos **antes** do `gtag.js`, e `fbq('consent')` antes de
   `fbq('init')` — asserção sobre o HTML servido, não sobre o DOM.
3. Aceitar concede; recusar mantém negado e sobrevive a recarregar.
4. Preferências concedem só análise.
5. `npm run gate` verde, incluindo axe nas 8 páginas com o banner na tela.

Suíte: `e2e/cookie-consent.spec.js`.

## Fora do escopo

Bloqueio de scripts de terceiros no servidor (o Consent Mode já é o mecanismo suportado por GA4 e Meta),
página `/cookies.html` dedicada com a tabela de cookies (a Política de Privacidade já descreve o uso),
registro de consentimento no backend e tradução.

## Pendências não técnicas

- Revisão do texto do banner e da seção de cookies da Política de Privacidade por quem responde por
  privacidade.
- **LDU (D10)**: o Pixel continua com `dataProcessingOptions ['LDU'], 1, 1000` para todo mundo. Com
  consentimento explícito no lugar, forçar LDU a 100% do tráfego passa a ser redundante e custa dados de
  otimização. Reavaliar — é decisão de negócio, e não foi mexida aqui.
