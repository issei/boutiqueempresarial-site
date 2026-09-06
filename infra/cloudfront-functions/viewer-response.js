/**
 * CloudFront Function (viewer-response) — boutiqueempresarial.com.br
 *
 * Injeta o header `Link` (RFC 8288) para descoberta por agentes, e o
 * `Vary: Accept` que a negociação de Markdown exige.
 *
 * POR QUE UMA FUNÇÃO E NÃO UMA RESPONSE HEADERS POLICY
 * O caminho canônico para isto é uma Response Headers Policy custom. Ela está
 * **desabilitada no plano desta distribuição** — exigiria migrar para Business,
 * o que não se justifica por um header. CloudFront Functions são um recurso à
 * parte e continuam disponíveis, então o header sai daqui.
 *
 * O valor é o mesmo conjunto de `<link rel>` que as páginas declaram no `<head>`
 * e o mesmo que o `llms.txt` anuncia. Se um mudar sem os outros, a descoberta
 * diverge conforme a porta de entrada do agente.
 *
 * Runtime: cloudfront-js-2.0
 * Deploy:  ./scripts/setup-agent-discovery-aws.sh link-headers
 */

var LINK = '</.well-known/api-catalog>; rel="api-catalog", ' +
           '</.well-known/ai-catalog.json>; rel="service-desc"; type="application/json", ' +
           '</llms.txt>; rel="service-doc"; type="text/plain", ' +
           '</llms-full.txt>; rel="describedby"; type="text/plain", ' +
           '</.well-known/oauth-protected-resource>; rel="oauth-protected-resource"';

function handler(event) {
  var headers = event.response.headers;

  headers['link'] = { value: LINK };

  // Vary por TOKEN, nunca por substring: o CloudFront manda `Vary:
  // Accept-Encoding` quando comprime, e um indexOf('accept') casa dentro de
  // "accept-encoding" — o Accept nunca seria acrescentado justamente no caso
  // mais comum. Foi o que o teste pegou antes de isto ir ao ar.
  var vary = headers['vary'] && headers['vary'].value;
  if (!vary) {
    headers['vary'] = { value: 'Accept' };
  } else if (vary.trim() !== '*') {
    var tem = false;
    vary.split(',').forEach(function (t) {
      if (t.trim().toLowerCase() === 'accept') tem = true;
    });
    if (!tem) headers['vary'] = { value: vary + ', Accept' };
  }

  return event.response;
}
