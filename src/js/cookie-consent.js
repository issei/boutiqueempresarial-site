/**
 * Consentimento de cookies — LGPD/ANPD, Google Consent Mode v2 e consent do Meta Pixel.
 * Spec: docs/specs/design/cookie-consent.md
 *
 * O PADRÃO NEGADO NÃO MORA AQUI. Ele é um bloco inline no <head> de cada página,
 * porque precisa rodar antes do Pixel e do gtag.js — um módulo é adiado e chegaria
 * tarde demais. Este arquivo só cuida da interface e da atualização do consentimento
 * quando a pessoa decide. Os dois lados combinam pela chave BE_CONSENT.
 */

const KEY = "be_consent";
const VERSION = 1;
const NONE = { analytics: false, marketing: false };
const ALL = { analytics: true, marketing: true };

function load() {
    try {
        const raw = JSON.parse(localStorage.getItem(KEY) || "null");
        return raw && raw.v === VERSION ? raw.cat : null;
    } catch (e) { return null; } // modo privado ou payload corrompido: pergunta de novo
}

function apply(cat) {
    const s = (on) => (on ? "granted" : "denied");
    try {
        gtag("consent", "update", {
            ad_storage: s(cat.marketing),
            ad_user_data: s(cat.marketing),
            ad_personalization: s(cat.marketing),
            analytics_storage: s(cat.analytics)
        });
    } catch (e) { /* gtag bloqueado: nada a atualizar */ }
    // O Pixel enfileira os eventos enquanto revogado e os libera no grant.
    try { fbq("consent", cat.marketing ? "grant" : "revoke"); } catch (e) { /* idem */ }
}

function save(cat) {
    try {
        localStorage.setItem(KEY, JSON.stringify({ v: VERSION, ts: new Date().toISOString(), cat }));
    } catch (e) { /* sem persistência: a escolha vale só nesta página */ }
    apply(cat);
    const banner = document.getElementById("cc-banner");
    if (banner) banner.remove();
    renderReopen();
}

function styles() {
    if (document.getElementById("cc-styles")) return;
    const el = document.createElement("style");
    el.id = "cc-styles";
    // Tokens com fallback: identidade-visual.html não carrega style.css.
    el.textContent = `
/* Canto inferior DIREITO: o conteúdo do site é alinhado à esquerda e o CTA do
   hero fica lá — no canto esquerdo o aviso cobriria o botão principal. */
.cc-card{position:fixed;bottom:16px;right:16px;z-index:9998;width:min(380px,calc(100vw - 32px));
 background:#fff;color:var(--text-primary,#1f1f1f);border:1px solid var(--border-color,#E5E5E5);
 border-top:2px solid var(--gold-subtle,#C5A059);border-radius:4px;padding:18px 20px;
 box-shadow:0 8px 30px rgba(31,31,31,.15);font-family:var(--font-inter,'Inter',system-ui,sans-serif);
 font-size:.85rem;line-height:1.55;animation:cc-in .25s ease-out}
/* Sem opacity: um fade real deixa o texto abaixo de 4,5:1 durante a animação, e o
   axe do WebKit na CI pegava o banner no meio dele (color-contrast, página
   aleatória a cada rodada). Mesmo motivo do slide de etapa em formulario.html. */
@keyframes cc-in{from{transform:translateY(12px)}to{transform:none}}
@media (prefers-reduced-motion:reduce){.cc-card{animation:none}}
.cc-card p{margin:0 0 14px;color:var(--text-secondary,#555)}
/* Sublinhado obrigatório: dentro de um parágrafo o link não pode se distinguir
   só pela cor (WCAG 1.4.1 / axe link-in-text-block). */
.cc-card a{color:var(--gold-text,#886829);text-decoration:underline}
.cc-ttl{display:block;margin-bottom:6px;font-weight:600;font-size:.9rem;color:var(--text-primary,#1f1f1f)}
.cc-acts{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.cc-btn{font:inherit;font-weight:600;padding:8px 16px;border-radius:2px;cursor:pointer;
 border:1px solid var(--text-primary,#1f1f1f);background:#fff;color:var(--text-primary,#1f1f1f)}
.cc-btn--on{background:var(--text-primary,#1f1f1f);color:#fff}
.cc-btn:hover{opacity:.85}
.cc-link{font:inherit;background:none;border:0;padding:8px 2px;cursor:pointer;
 color:var(--gold-text,#886829);text-decoration:underline;margin-left:auto}
.cc-card :focus-visible,.cc-dlg :focus-visible,.cc-reopen:focus-visible{outline:2px solid var(--gold-text,#886829);outline-offset:2px}
.cc-dlg{border:1px solid var(--border-color,#E5E5E5);border-radius:4px;padding:0;
 width:min(460px,calc(100vw - 32px));color:var(--text-primary,#1f1f1f);
 font-family:var(--font-inter,'Inter',system-ui,sans-serif)}
.cc-dlg::backdrop{background:rgba(31,31,31,.5)}
.cc-dlg form{padding:24px;margin:0}
.cc-dlg h2{margin:0 0 18px;font-size:1.1rem;font-weight:600}
.cc-cat{display:flex;gap:12px;padding:12px 0;border-top:1px solid var(--border-color,#E5E5E5);
 font-size:.85rem;line-height:1.5}
.cc-cat input{margin-top:3px;flex:0 0 auto;width:16px;height:16px;accent-color:var(--gold-text,#886829)}
.cc-cat span{display:block;color:var(--text-secondary,#555);margin-top:2px}
.cc-dlg .cc-acts{margin-top:20px;justify-content:flex-end}
.cc-reopen{font:inherit;font-size:inherit;background:none;border:0;padding:0;cursor:pointer;
 color:inherit;text-decoration:underline}
/* Abaixo de 768px a home tem uma barra de CTA fixa de 88px no rodapé. O aviso
   sobe acima dela: cobrir o botão de conversão custaria mais que o consentimento. */
@media (max-width:767px){.cc-card{left:16px;right:16px;bottom:96px;width:auto}}`;
    document.head.appendChild(el);
}

function dialog(onSave) {
    const cur = load() || NONE;
    const dlg = document.createElement("dialog");
    dlg.className = "cc-dlg";
    // <dialog> nativo já entrega backdrop, trava de foco e Esc — nada disso em JS.
    dlg.innerHTML = `
      <form method="dialog">
        <h2>Preferências de cookies</h2>
        <div class="cc-cat">
          <input type="checkbox" id="cc-nec" checked disabled>
          <label for="cc-nec"><strong>Necessários</strong>
            <span>Fazem o site funcionar e guardam esta sua escolha. Sempre ativos.</span></label>
        </div>
        <div class="cc-cat">
          <input type="checkbox" id="cc-ana"${cur.analytics ? " checked" : ""}>
          <label for="cc-ana"><strong>Análise</strong>
            <span>Google Analytics: mostram, de forma agregada, como as páginas são usadas.</span></label>
        </div>
        <div class="cc-cat">
          <input type="checkbox" id="cc-mkt"${cur.marketing ? " checked" : ""}>
          <label for="cc-mkt"><strong>Marketing</strong>
            <span>Meta Pixel: medem o resultado dos anúncios que trazem você até aqui.</span></label>
        </div>
        <div class="cc-acts">
          <button type="submit" value="cancel" class="cc-btn">Cancelar</button>
          <button type="submit" value="save" class="cc-btn cc-btn--on">Salvar</button>
        </div>
      </form>`;
    dlg.addEventListener("close", () => {
        if (dlg.returnValue === "save") {
            onSave({
                analytics: dlg.querySelector("#cc-ana").checked,
                marketing: dlg.querySelector("#cc-mkt").checked
            });
        }
        dlg.remove();
    });
    document.body.appendChild(dlg);
    dlg.showModal();
}

function banner() {
    const el = document.createElement("div");
    el.className = "cc-card";
    el.id = "cc-banner";
    el.setAttribute("role", "region");
    el.setAttribute("aria-label", "Aviso de cookies");
    el.innerHTML = `
      <strong class="cc-ttl">Cookies</strong>
      <p>Usamos cookies de análise e de marketing para entender o uso do site e medir nossos
         anúncios. Você escolhe. Detalhes na
         <a href="/privacidade.html">Política de Privacidade</a>.</p>
      <div class="cc-acts">
        <button type="button" class="cc-btn cc-btn--on" data-cc="all">Aceitar</button>
        <button type="button" class="cc-btn" data-cc="none">Recusar</button>
        <button type="button" class="cc-link" data-cc="prefs">Preferências</button>
      </div>`;
    el.querySelector('[data-cc="all"]').addEventListener("click", () => save(ALL));
    el.querySelector('[data-cc="none"]').addEventListener("click", () => save(NONE));
    el.querySelector('[data-cc="prefs"]').addEventListener("click", () => dialog(save));
    document.body.appendChild(el);
}

/**
 * Reabrir as preferências é exigência da ANPD (a escolha precisa ser revisável).
 * Vai para dentro do <footer>; páginas sem rodapé (formulario, obrigada, 404)
 * chamam window.cookieConsent.open() a partir do próprio texto legal.
 */
function renderReopen() {
    const host = document.querySelector("footer .footer-legal") || document.querySelector("footer");
    if (!host || document.getElementById("cc-reopen")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "cc-reopen";
    btn.className = "cc-reopen";
    btn.textContent = "Preferências de cookies";
    btn.addEventListener("click", () => dialog(save));
    host.appendChild(btn);
}

function init() {
    styles();
    const stored = load();
    if (stored) {
        // O inline do <head> já aplicou esta escolha; aqui só o Pixel, que não
        // existia àquela altura (o script dele vem depois do bloco de consent).
        try { fbq("consent", stored.marketing ? "grant" : "revoke"); } catch (e) { /* bloqueado */ }
    } else if (navigator.globalPrivacyControl === true) {
        save(NONE); // sinal GPC é recusa expressa: não perguntar de novo
    } else {
        banner();
    }
    renderReopen();
    window.cookieConsent = {
        open: () => dialog(save),
        get: load,
        reset: () => { try { localStorage.removeItem(KEY); } catch (e) { } location.reload(); }
    };
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();

export { };
