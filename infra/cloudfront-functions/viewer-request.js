/**
 * CloudFront Function (viewer-request) — boutiqueempresarial.com.br
 *
 * Faz DUAS coisas porque o CloudFront aceita apenas UMA função por evento.
 * Esta substitui a antiga `HandlerExtentionHtml`, cuja lógica está preservada
 * integralmente no passo 2 abaixo — separá-las exigiria um segundo behavior.
 *
 *   1. Negociação de conteúdo (RFC 7231 §5.3.2): um agente que manda
 *      `Accept: text/markdown` recebe o companion `.md` em vez do HTML.
 *   2. Roteamento de páginas: `/` → `/index.html`, `/formulario` → `/formulario.html`.
 *
 * A ordem importa: markdown é avaliado ANTES do sufixo `.html`, senão `/`
 * viraria `/index.html` e nunca chegaria ao mapa.
 *
 * Cache: viewer-request roda antes do cache lookup, então a URI reescrita já é
 * a chave — `/index.html` e `/index.md` são entradas distintas sem precisar de
 * `Accept` na cache policy. O header `Vary: Accept` na Response Headers Policy
 * existe para os caches DEPOIS do CloudFront (browser, proxies).
 *
 * Runtime: cloudfront-js-2.0 (ES2019+)
 * Deploy:  ./scripts/setup-agent-discovery-aws.sh markdown-negotiation
 */

// Toda página com companion. Chave = URI normalizada (sem barra final).
// Ao criar um novo companion em public/, acrescente as duas formas: com e sem
// extensão — o roteamento do site aceita as duas.
var MARKDOWN_MAP = {
  '/': '/index.md',
  '/index': '/index.md',
  '/index.html': '/index.md',
  '/auth': '/auth.md',
  '/auth.md': '/auth.md',
  '/llms': '/llms.txt',
  '/llms.txt': '/llms.txt',
  '/llms-full': '/llms-full.txt',
  '/llms-full.txt': '/llms-full.txt',
};

function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // ── 1. Markdown para quem pediu markdown ────────────────────────────────
  var accept = (request.headers['accept'] || {}).value || '';
  if (prefersMarkdown(accept)) {
    var chave = uri !== '/' && uri.charAt(uri.length - 1) === '/' ? uri.slice(0, -1) : uri;
    var md = MARKDOWN_MAP[chave];
    if (md) {
      request.uri = md;
      return request;
    }
    // Sem companion mapeado: cai para o roteamento normal e serve o HTML.
  }

  // ── 2. Roteamento de páginas (lógica preservada de HandlerExtentionHtml) ──
  if (uri === '/' || uri === '') {
    request.uri = '/index.html';
    return request;
  }
  if (!uri.includes('.')) {
    request.uri = uri + '.html';
  }

  return request;
}

/**
 * Verdadeiro só quando o cliente pediu text/markdown explicitamente e não
 * colocou text/html acima dele. Empate vai para o agente.
 *
 * Precisa ser explícito: um browser manda
 *   Accept: text/html,application/xhtml+xml,...,*\/*;q=0.8
 * e o `*\/*` NÃO é preferência por markdown. Tratar wildcard como aceite
 * serviria .md para todo mundo.
 */
function prefersMarkdown(accept) {
  if (!accept) return false;

  var markdownQ = -1;
  var htmlQ = -1;

  accept.split(',').forEach(function (parte) {
    var tokens = parte.trim().split(';');
    var tipo = tokens[0].trim().toLowerCase();
    var q = 1.0; // default da RFC 7231 §5.3.1

    for (var i = 1; i < tokens.length; i++) {
      var param = tokens[i].trim();
      if (param.indexOf('q=') === 0) {
        var n = parseFloat(param.slice(2));
        q = isNaN(n) ? 0 : n;
        break;
      }
    }

    if (tipo === 'text/markdown') markdownQ = q;
    else if (tipo === 'text/html' && q > htmlQ) htmlQ = q;
  });

  return markdownQ > 0 && markdownQ >= htmlQ;
}
