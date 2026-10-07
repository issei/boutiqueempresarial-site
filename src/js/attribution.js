/**
 * Atribuição de mídia em cookie first-party — primeiro e último toque.
 * Spec: docs/specs/design/atribuicao-utm.md
 *
 * `first` nunca é sobrescrito; `last` só muda quando a visita traz parâmetros
 * (último toque não direto). Visita sem UTM não apaga nada.
 * Módulo carregado antes do script do formulário: módulos rodam em ordem de documento.
 */

const KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"];
const NAME = "be_attr";
const MAX_AGE = 90 * 24 * 60 * 60;
const cut = (v) => String(v || "").slice(0, 150);

function read() {
    try {
        const m = document.cookie.match(/(?:^|;\s*)be_attr=([^;]+)/);
        const v = m ? JSON.parse(decodeURIComponent(m[1])) : null;
        return v && typeof v === "object" ? v : {};
    } catch (e) { return {}; }
}

let attr = {};
try {
    attr = read();
    const q = new URLSearchParams(location.search);
    let touch = null;
    KEYS.forEach((k) => { const v = q.get(k); if (v) (touch = touch || {})[k] = cut(v); });
    if (touch) {
        touch.at = new Date().toISOString();
        touch.landing = cut(location.pathname);
        touch.ref = cut(document.referrer);
        if (!attr.first) attr.first = touch;
        attr.last = touch;
        document.cookie = NAME + "=" + encodeURIComponent(JSON.stringify(attr)) +
            "; path=/; max-age=" + MAX_AGE + "; SameSite=Lax" +
            (location.protocol === "https:" ? "; Secure" : "") +
            (/(^|\.)boutiqueempresarial\.com\.br$/.test(location.hostname) ? "; domain=.boutiqueempresarial.com.br" : "");
    }
} catch (e) { /* cookie bloqueado ou URL malformada: o formulário cai na URL e no sessionStorage */ }

window.BE_ATTR = { first: attr.first || {}, last: attr.last || {} };
