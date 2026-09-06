# auth.md — Boutique Empresarial

Como agentes de IA consomem os dados públicos de `boutiqueempresarial.com.br`.
A resposta curta: **sem credencial**. Faça `GET`.

## Recursos protegidos

- Resource: `https://boutiqueempresarial.com.br`
- Authorization Server: `https://boutiqueempresarial.com.br` (metadados em
  `/.well-known/oauth-authorization-server` e `/.well-known/openid-configuration`)
- Protected Resource Metadata: `/.well-known/oauth-protected-resource`
- Scopes declarados: `site:read`, `faq:read`
- Método de apresentação de token: `header` (Bearer)

## Registro de agentes

Os escopos acima cobrem apenas leitura de conteúdo público institucional. Não há
registro de credencial:

```json
{
  "identity_types_supported": ["anonymous"],
  "anonymous": {
    "credential_types_supported": ["none"]
  },
  "claim_uri": "https://boutiqueempresarial.com.br/.well-known/oauth-protected-resource"
}
```

## Escopo dos metadados OAuth

`/.well-known/openid-configuration` e `/.well-known/oauth-authorization-server` existem
para conformidade de descoberta (OIDC Discovery / RFC 8414) e para carregar o bloco
`agent_auth`. Eles são **declarativos**: não há authorization server em operação neste
domínio, que é um site estático servido por S3 + CloudFront.

- Nenhum token é emitido. `authorization_endpoint` e `token_endpoint` estão declarados por
  exigência de formato e **não respondem** — não tente `authorization_code` nem `implicit`.
- `jwks_uri` resolve para um conjunto vazio (`{"keys": []}`), o que é a verdade: nada é
  assinado porque nada é emitido.
- O modelo de acesso real é o de `agent_auth`: **anônimo**, `credential_types_supported:
  ["none"]`.

## Dados pessoais

O único ponto do site que coleta dado pessoal é o formulário de aplicação
(`/formulario.html`), preenchido por humanos com consentimento explícito de LGPD. Ele
**não é uma API** e não deve ser submetido por agente. A governança está em
`/privacidade.html`.

## MCP

Detalhes das ferramentas em `/.well-known/mcp/server-card.json` — atenção ao campo
`status`: o endpoint HTTP em `/mcp` é **planejado**, não está no ar. Hoje as ferramentas
rodam na própria página via WebMCP (`navigator.modelContext`) e todos os recursos são
acessíveis por HTTPS direto.
