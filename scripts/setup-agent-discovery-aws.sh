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
#   dns-aid        Registro HTTPS em `_agents.` no Route 53 (DNS-AID). É a
#                  camada anterior a qualquer HTTP: o resolver já entrega.
#
#   dnssec-status  Só leitura: estado da assinatura da zona e se a cadeia de
#                  confiança fechou (DS cadastrado no Registro.br).
#
# Uso:
#   ./scripts/setup-agent-discovery-aws.sh link-headers
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
POLICY_NAME="RFC8288-Link-Headers-AgentDiscovery"

# O header é o mesmo conjunto de <link rel> que as páginas declaram no <head>.
# Se um mudar, o outro muda junto — senão a descoberta diverge por porta de entrada.
LINK_VALUE='</.well-known/api-catalog>; rel="api-catalog", </.well-known/ai-catalog.json>; rel="service-desc"; type="application/json", </llms.txt>; rel="service-doc"; type="text/plain", </.well-known/oauth-protected-resource>; rel="oauth-protected-resource"'

link_headers() {
  local existente
  existente=$(aws cloudfront list-response-headers-policies --type custom \
    --query "ResponseHeadersPolicyList.Items[?ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name=='${POLICY_NAME}'].ResponseHeadersPolicy.Id" \
    --output text)

  local config
  config=$(cat <<EOF
{
  "Name": "${POLICY_NAME}",
  "Comment": "Header Link RFC 8288 para descoberta por agentes de IA",
  "CustomHeadersConfig": {
    "Quantity": 1,
    "Items": [
      {
        "Header": "Link",
        "Value": "${LINK_VALUE//\"/\\\"}",
        "Override": true
      }
    ]
  }
}
EOF
)

  if [ -n "$existente" ] && [ "$existente" != "None" ]; then
    local etag
    etag=$(aws cloudfront get-response-headers-policy --id "$existente" --query ETag --output text)
    aws cloudfront update-response-headers-policy \
      --id "$existente" --if-match "$etag" \
      --response-headers-policy-config "$config" >/dev/null
    echo "Policy atualizada: ${POLICY_NAME} (${existente})"
  else
    existente=$(aws cloudfront create-response-headers-policy \
      --response-headers-policy-config "$config" \
      --query "ResponseHeadersPolicy.Id" --output text)
    echo "Policy criada: ${POLICY_NAME} (${existente})"
  fi

  # Deliberadamente NÃO anexa sozinho: anexar exige reescrever o
  # DistributionConfig inteiro, e um update-distribution malformado derruba o
  # site. Um comando manual é mais barato que um rollback.
  cat <<EOF

Falta anexar a policy ao comportamento padrão da distribuição:

  Console → CloudFront → distribuição de ${DOMINIO} → Behaviors → Default (*)
          → Response headers policy → ${POLICY_NAME}

Para conferir depois do deploy:

  curl -sI https://${DOMINIO}/ | grep -i '^link:'
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
  link-headers)  link_headers ;;
  dns-aid)       dns_aid ;;
  dnssec-status) dnssec_status ;;
  *) echo "uso: $0 {link-headers|dns-aid|dnssec-status}" >&2; exit 1 ;;
esac
