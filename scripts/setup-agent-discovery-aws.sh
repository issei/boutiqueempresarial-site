#!/usr/bin/env bash
# ==============================================================================
# setup-agent-discovery-aws.sh
#
# As duas camadas de descoberta agêntica que NÃO moram no repositório, porque
# são resposta HTTP e DNS — não arquivo estático. Ver docs/AGENT_READINESS.md.
#
#   link-headers   Response Headers Policy no CloudFront: injeta o header
#                  `Link` (RFC 8288) em toda resposta. Um agente que faz um
#                  GET / qualquer descobre os manifestos sem ler o HTML.
#
#   markdown-negotiation  Publica a CloudFront Function que serve o companion .md
#                  a quem manda `Accept: text/markdown`, e roteia .html.
#
#   dns-aid        Registro HTTPS em `_agents.` no Route 53 (DNS-AID). É a
#                  camada anterior a qualquer HTTP: o resolver já entrega.
#
#   dnssec-status  Só leitura: estado da assinatura da zona e se a cadeia de
#                  confiança fechou (DS cadastrado no Registro.br).
#
# Uso:
#   ./scripts/setup-agent-discovery-aws.sh link-headers
#   ./scripts/setup-agent-discovery-aws.sh markdown-negotiation
#   HOSTED_ZONE_ID=Z0123456789ABC ./scripts/setup-agent-discovery-aws.sh dns-aid
#   ./scripts/setup-agent-discovery-aws.sh dnssec-status
#
# Idempotente: reexecutar atualiza, não duplica.
#
# Credencial: exige um principal com permissão de Route 53, CloudFront e KMS. O
# `aws configure` desta máquina aponta para um IAM user sem Route 53 — use o
# perfil SSO de administrador (AWS_PROFILE=... ou `aws sso login`), senão o
# script morre em AccessDenied no primeiro comando.
# ==============================================================================

set -euo pipefail

DOMINIO="boutiqueempresarial.com.br"

# O nome carrega o domínio de propósito. A conta AWS é compartilhada com
# mauricio.issei.com.br, que tem a sua própria policy de header Link; a primeira
# versão deste script usava o mesmo nome genérico dela ("RFC8288-Link-Headers-
# AgentDiscovery"), achou a policy do outro site na busca por nome e a
# SOBRESCREVEU — o mauricio.issei.com.br passou a anunciar os manifestos daqui.
# Recurso compartilhado por coincidência de nome não é reuso, é colisão.
# Cria ou atualiza a função em DEVELOPMENT e ecoa o ETag. Publicar é decisão de
# quem chama — sempre depois de testar.
deploy_funcao() {
  local nome="$1" fonte="$2" comentario="$3"
  [ -f "$fonte" ] || { echo "não achei $fonte — rode da raiz do repositório" >&2; exit 1; }

  if aws cloudfront describe-function --name "$nome" --stage DEVELOPMENT >/dev/null 2>&1; then
    local atual
    atual=$(aws cloudfront describe-function --name "$nome" --stage DEVELOPMENT \
      --query ETag --output text)
    aws cloudfront update-function --name "$nome" --if-match "$atual" \
      --function-config "Comment='${comentario}',Runtime=cloudfront-js-2.0" \
      --function-code "fileb://${fonte}" --query ETag --output text
  else
    aws cloudfront create-function --name "$nome" \
      --function-config "Comment='${comentario}',Runtime=cloudfront-js-2.0" \
      --function-code "fileb://${fonte}" --query ETag --output text
  fi
}

# O header Link sai de uma CloudFront Function, não de uma Response Headers
# Policy. A policy é o caminho canônico e foi a primeira tentativa, mas
# **policy custom exige plano Business nesta distribuição** — o console mostra
# o campo desabilitado. Functions são recurso à parte e continuam disponíveis;
# o resultado no header é idêntico, sem migrar de plano por causa de um header.
link_headers() {
  local nome="BoutiqueViewerResponse"
  local etag
  etag=$(deploy_funcao "$nome" "infra/cloudfront-functions/viewer-response.js" \
    "Header Link RFC 8288 + Vary Accept")
  echo "Função pronta em DEVELOPMENT: ${nome}"

  aws cloudfront publish-function --name "$nome" --if-match "$etag" >/dev/null
  echo "Publicada em LIVE."

  cat <<EOF

Falta ANEXAR ao comportamento padrão da distribuição de ${DOMINIO}:

  Console → CloudFront → Behaviors → Default (*) → Edit
    Function associations → Viewer response → CloudFront Functions → ${nome}

Atenção: é o slot **Viewer response**, não o Viewer request — este último já
tem a BoutiqueViewerRequest, e são associações independentes.

Para conferir depois:

  curl -sI https://${DOMINIO}/ | grep -iE '^(link|vary):'
EOF
}

dns_aid() {
  : "${HOSTED_ZONE_ID:?informe HOSTED_ZONE_ID (aws route53 list-hosted-zones-by-name --dns-name ${DOMINIO}.)}"

  # Só o registro _index. NÃO publique _mcp/_a2a: não há servidor MCP nem A2A
  # neste domínio, e anunciar endpoint inexistente é pior que não anunciar nada.
  #
  # O Route 53 aceita SOMENTE SvcParamKeys registradas (mandatory, alpn,
  # no-default-alpn, port, ipv4hint, ech, ipv6hint). Chaves genéricas keyNNNNN
  # — a tentação de anunciar o caminho do manifesto — são rejeitadas com
  # InvalidChangeBatch, e o change batch é atômico: nada é aplicado. O caminho
  # dos manifestos vive no ARD (/.well-known/ai-catalog.json), não no DNS.
  aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch "$(cat <<EOF
{
  "Comment": "DNS-AID — descoberta de agentes",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "_index._agents.${DOMINIO}.",
        "Type": "HTTPS",
        "TTL": 3600,
        "ResourceRecords": [
          { "Value": "1 ${DOMINIO}. alpn=\"h2,http/1.1\" port=443 mandatory=alpn,port" }
        ]
      }
    }
  ]
}
EOF
)" >/dev/null

  cat <<EOF
Registro publicado: _index._agents.${DOMINIO} (HTTPS)

Validação — pelo mesmo resolver que os scanners usam:

  curl -s -H 'accept: application/dns-json' \\
    "https://cloudflare-dns.com/dns-query?name=_index._agents.${DOMINIO}&type=HTTPS&do=1"

Publicar o registro NÃO basta para o check dnsAid: o scanner exige
dnssecValidated. O DNSSEC desta zona já está habilitado — confira com
'$0 dnssec-status' que a cadeia fechou (DS cadastrado no Registro.br).
EOF
}

markdown_negotiation() {
  local fonte="infra/cloudfront-functions/viewer-request.js"
  local nome="BoutiqueViewerRequest"
  [ -f "$fonte" ] || { echo "não achei $fonte — rode da raiz do repositório" >&2; exit 1; }

  local etag
  etag=$(deploy_funcao "$nome" "$fonte" "Markdown negotiation + roteamento .html")

  # Esta função decide o roteamento de TODAS as URLs do site. Publicar sem
  # testar é apostar o site inteiro num regex. Os dois casos abaixo são o
  # mínimo: o caminho do browser e o do agente.
  echo
  echo "Testes antes de publicar:"
  local falhou=0
  for caso in "/|text/html|/index.html" "/|text/markdown|/index.md" "/formulario|text/html|/formulario.html"; do
    IFS='|' read -r uri accept esperado <<<"$caso"
    local evento obtido
    evento=$(printf '{"version":"1.0","context":{"eventType":"viewer-request"},"viewer":{"ip":"1.2.3.4"},"request":{"method":"GET","uri":"%s","headers":{"accept":{"value":"%s"}},"querystring":{},"cookies":{}}}' "$uri" "$accept")
    obtido=$(aws cloudfront test-function --name "$nome" --if-match "$etag" --stage DEVELOPMENT \
      --event-object "$(printf '%s' "$evento" | base64 -w0 2>/dev/null || printf '%s' "$evento" | base64)" \
      --query "TestResult.FunctionOutput" --output text | sed -n 's/.*"uri":"\([^"]*\)".*/\1/p')
    if [ "$obtido" = "$esperado" ]; then
      echo "  ok   ${uri} (${accept}) -> ${obtido}"
    else
      echo "  FALHA ${uri} (${accept}) -> ${obtido:-vazio}, esperava ${esperado}"
      falhou=1
    fi
  done
  [ "$falhou" -eq 0 ] || { echo; echo "Não publiquei: corrija ${fonte} antes." >&2; exit 1; }

  aws cloudfront publish-function --name "$nome" --if-match "$etag" >/dev/null
  echo
  echo "Publicada em LIVE."
  anexar_instrucoes
}

anexar_instrucoes() {
  cat <<EOF

Falta ANEXAR ao comportamento padrão da distribuição de ${DOMINIO}:

  Console → CloudFront → Behaviors → Default (*) → Edit
    Function associations → Viewer request → CloudFront Functions → BoutiqueViewerRequest

É o único passo que este script não faz: anexar exige reescrever o
DistributionConfig inteiro, e um update-distribution malformado tira o site do
ar. Um clique revisado custa menos que um rollback.

Depois, invalide e confira:

  curl -s -H 'accept: text/markdown' https://${DOMINIO}/ | head -3
EOF
}

dnssec_status() {
  local zid
  zid=$(aws route53 list-hosted-zones-by-name --dns-name "${DOMINIO}." \
    --query "HostedZones[0].Id" --output text | awk -F/ '{print $NF}')

  echo "Hosted zone: ${zid}"
  aws route53 get-dnssec --hosted-zone-id "$zid" \
    --query "{Assinatura:Status.ServeSignature,KSKs:KeySigningKeys[].{Nome:Name,Status:Status,KeyTag:KeyTag,DS:DSRecord}}"

  # A cadeia só fecha com o DS cadastrado no Registro.br. AD=true é a prova de
  # que um resolver validador aceitou a assinatura — o resto é otimismo.
  echo
  echo "Cadeia de confiança, pelo resolver que os scanners usam:"
  curl -s -H 'accept: application/dns-json' \
    "https://cloudflare-dns.com/dns-query?name=${DOMINIO}&type=A&do=1" \
    | grep -o '"AD":[a-z]*' || echo "  (sem resposta — verifique conectividade)"
  echo "  AD:true = validado · AD:false = DS ausente ou cadeia quebrada"
}

case "${1:-}" in
  link-headers)         link_headers ;;
  dns-aid)              dns_aid ;;
  markdown-negotiation) markdown_negotiation ;;
  dnssec-status)        dnssec_status ;;
  *) echo "uso: $0 {link-headers|markdown-negotiation|dns-aid|dnssec-status}" >&2; exit 1 ;;
esac
