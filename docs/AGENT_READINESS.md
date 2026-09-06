# Agent Readiness — Boutique Empresarial

Como `boutiqueempresarial.com.br` é descoberto, lido e autenticado por agentes de IA.
Documenta **o que está implementado**, **onde fica cada peça** (repositório *e* AWS) e
**o que foi deliberadamente não implementado** — que aqui é a parte mais importante.

Complementa `docs/specs/HARNESS_AEO.md`: aquele spec cobre o que o *humano* e o *crawler
de busca* leem (head, JSON-LD, bloco AEO visível, a11y); este cobre o terceiro consumidor,
o agente, que chega sem sessão e não interpreta layout.

Referência de validação: [isitagentready.com](https://isitagentready.com).
Padrão de origem: `docs/AGENT_READINESS.md` da `mauricio-site`.

---

## 1. Por que isto existe

Um site tradicional serve dois consumidores: humano com navegador e crawler de busca. O
agente é um terceiro — chega sem sessão, precisa descobrir o que existe, em que formato,
sob quais regras de uso e com qual credencial, tudo por leitura de máquina.

A estratégia é **redundância deliberada em camadas**. O agente pode entrar por qualquer
uma, e nenhuma depende das outras:

| Camada | Mecanismo | Descoberto por | Estado |
| :-- | :-- | :-- | :-- |
| **DNS** | registro HTTPS em `_agents.` | resolver, antes de qualquer HTTP | ✅ publicado, DNSSEC validando |
| **Header HTTP** | `Link` (RFC 8288) em toda resposta | quem faz um `GET /` qualquer | função publicada, **falta anexar** |
| **Negociação** | `Accept: text/markdown` → companion `.md` | agente que prefere Markdown | ✅ no ar |
| **HTML** | `<link rel="api-catalog\|service-desc\|service-doc">` | quem lê o `<head>` | ✅ nas 7 páginas |
| **Arquivo bem-conhecido** | `/.well-known/*`, `/llms.txt`, `/robots.txt` | convenção | ✅ |
| **Autenticação** | `/auth.md` + metadados OAuth | quem precisa de escopo/credencial | ✅ |
| **Runtime** | `navigator.modelContext` (WebMCP) | agente que executa a página | ✅ na home |

As três primeiras são resposta HTTP e DNS — não arquivo estático. Ficam em
`scripts/setup-agent-discovery-aws.sh` e exigem execução manual contra a conta AWS.

---

## 2. Inventário — o que satisfaz cada coisa

### Descoberta

| Artefato | Onde |
| :-- | :-- |
| `robots.txt` com `Content-Signal`, `Sitemap`, `Agentmap`, `LLMs`, `LLMs-full` | `public/robots.txt` |
| sitemap XML | gerado no build por `vite-plugin-sitemap` — **só rotas indexáveis** |
| `<link rel>` de descoberta | `src/*.html`, logo após o `viewport` |
| header `Link` RFC 8288 | CloudFront — `scripts/setup-agent-discovery-aws.sh link-headers` |
| DNS-AID | Route 53 — `scripts/setup-agent-discovery-aws.sh dns-aid` |

> ⚠️ **`public/robots.txt` só chega em produção porque `vite.config.js` desliga o
> `generateRobotsTxt` do `vite-plugin-sitemap`.** Com o default (`true`), o plugin
> sobrescreve o arquivo no `dist` por quatro linhas genéricas — foi assim que o
> `Content-Signal` (e, antes dele, os `Disallow` do arquivo original) nunca chegou ao ar,
> com a fonte correta o tempo todo. `tests/agent-readiness.spec.js` passou a cobrar o
> `dist`, não só o dev server, porque o dev server serve `public/` direto e não via o bug.

### Conteúdo legível por máquina

| Artefato | Onde |
| :-- | :-- |
| índice curado | `public/llms.txt` |
| negociação `Accept: text/markdown` | CloudFront Function — `infra/cloudfront-functions/viewer-request.js` |
| conteúdo integral | `public/llms-full.txt` |
| companion Markdown da home | `public/index.md` + `<link rel="alternate">` no `<head>` |
| `Content-Type: text/markdown` em produção | passo dedicado em `.github/workflows/deploy.yml` |

### Protocolo

| Artefato | Onde |
| :-- | :-- |
| ARD (catálogo de recursos agênticos) | `public/.well-known/ai-catalog.json` |
| catálogo no schema do validador | `public/.well-known/agent-catalog` |
| linkset RFC 9727 | `public/.well-known/api-catalog` |
| A2A agent card | `public/.well-known/agent-card.json` |
| MCP server card | `public/.well-known/mcp/server-card.json` |
| índice de skills + `SKILL.md` | `public/.well-known/agent-skills/` |
| WebMCP (`get_overview`, `get_faq`) | `src/index.html`, antes de `</body>` |

### Autenticação

| Artefato | Onde |
| :-- | :-- |
| OIDC discovery | `public/.well-known/openid-configuration` |
| AS metadata RFC 8414 + bloco `agent_auth` | `public/.well-known/oauth-authorization-server` |
| PRM RFC 9728 | `public/.well-known/oauth-protected-resource` |
| JWKS vazio | `public/.well-known/jwks.json` |
| documento humano | `public/auth.md` |

### Verificação

`tests/agent-readiness.spec.js`, dentro de `npm run gate`. Cobra: cada artefato responde
200 e parseia; **toda URL do próprio domínio citada dentro deles resolve 200**; o bloco
`agent_auth` tem o trio anônimo no nível certo; o JWKS continua vazio; os cards continuam
declarando `status.endpoint: "planned"`; o digest da skill bate com o `SKILL.md` servido;
o `robots.txt` anuncia os mapas; a home declara os `<link rel>`; o WebMCP registra as duas
tools e `get_faq` devolve o FAQ da própria página.

O defeito que essa suíte existe para impedir é específico: **manifesto que promete um
recurso que não existe**. Um href quebrado dentro de JSON não aparece na tela de ninguém —
quebra só para a máquina, que é o consumidor para quem estes arquivos foram escritos.

---

## 3. O que NÃO foi implementado, e por quê

Esta seção vale mais que a anterior. O erro caro em readiness agêntica não é faltar um
manifesto — é publicar um que mente.

| Item | Decisão | Motivo |
| :-- | :-- | :-- |
| Endpoint MCP em `/mcp` | **não existe** | o site é estático (S3 + CloudFront). O card declara `status.endpoint: "planned"` e diz explicitamente para não tentar conectar |
| Endpoint A2A | **não existe** | mesma razão; o agent card carrega o mesmo campo `status` |
| Registro DNS `_mcp`/`_a2a` | **não publicar** | anunciar por DNS um endpoint que não responde é pior que não anunciar nada |
| Authorization server OAuth | **não existe** | os três documentos OAuth são declarativos, para conformidade de descoberta e para carregar o `agent_auth`. `jwks.json` é `{"keys": []}` — a verdade: nada é assinado porque nada é emitido |
| Companion `.md` de `formulario`/`privacidade`/`termos` | **não** | as três são `noindex` (HARNESS_AEO.md §6.1). Companion de página não indexável é peso sem leitor |
| DNSSEC | **habilitado** | zona `SIGNING` desde 2026-09-06; ver §4 para o custo, os alarmes e a ordem de rollback |
| Gerador de `llms-full.txt` | **não** | 1 página indexável. O gatilho está em HARNESS_AEO.md §A5 |

O formulário em `/formulario.html` coleta dado pessoal sob consentimento LGPD explícito.
`auth.md` e `llms.txt` declaram que **não é API e não deve ser submetido por agente**.

---

## 4. As camadas que dependem da AWS

### Header `Link` (RFC 8288)

```bash
./scripts/setup-agent-discovery-aws.sh link-headers
```

> 🔴 **Não é uma Response Headers Policy — é uma CloudFront Function.** O caminho canônico
> para injetar `Link` é uma policy custom, e foi a primeira tentativa. Ela está
> **desabilitada no plano desta distribuição**: o console mostra o campo cinza e exigiria
> migrar para Business, o que não se paga por um header. CloudFront Functions são um
> recurso à parte, seguem disponíveis, e o resultado no header é idêntico. A função vive em
> `infra/cloudfront-functions/viewer-response.js` e roda em **`viewer-response`** — slot
> independente do `viewer-request`, que já hospeda a negociação de Markdown.

Publica a função **`BoutiqueViewerResponse`**. O script
**não anexa sozinho** à distribuição: anexar exige reescrever o `DistributionConfig`
inteiro, e um `update-distribution` malformado derruba o site. O script imprime o passo
manual. Conferência depois do deploy:

```bash
curl -sI https://boutiqueempresarial.com.br/ | grep -i '^link:'
```

> O valor do header e os `<link rel>` do `<head>` são o mesmo conjunto. Se um mudar sem o
> outro, a descoberta diverge conforme a porta de entrada do agente.

> 🔴 **A conta AWS é compartilhada com `mauricio.issei.com.br`.** Todo recurso global —
> response headers policy, CloudFront Function, cache policy — precisa de nome com o
> domínio no meio. A primeira versão deste script usava o nome genérico
> `RFC8288-Link-Headers-AgentDiscovery`, que é o da policy **do outro site**: a busca por
> nome encontrou a dele e a sobrescreveu, e `mauricio.issei.com.br` passou a anunciar os
> manifestos do boutique. Ninguém percebe um header errado sem procurar por ele. Antes de
> criar qualquer recurso global, confira quem já o usa:
>
> ```bash
> aws cloudfront list-distributions \
>   --query "DistributionList.Items[].{Alias:Aliases.Items[0],Policy:DefaultCacheBehavior.ResponseHeadersPolicyId}"
> ```

### DNS-AID

```bash
HOSTED_ZONE_ID=Z0123456789ABC ./scripts/setup-agent-discovery-aws.sh dns-aid
```

Publica **só** `_index._agents.boutiqueempresarial.com.br` (HTTPS).

#### ⚠️ Armadilha: Route 53 rejeita `keyNNNNN`

O Route 53 aceita somente SvcParamKeys registradas — `mandatory`, `alpn`,
`no-default-alpn`, `port`, `ipv4hint`, `ech`, `ipv6hint`. Chaves genéricas
(`key65001="/.well-known/…"`, a tentação de anunciar o caminho do manifesto) falham com
`InvalidChangeBatch: does not support undefined parameters`, e o change batch é **atômico**
— nada é aplicado. O caminho dos manifestos vive no ARD, não no DNS.

#### ⚠️ DNSSEC é bloqueante para o check `dnsAid`

Publicar o registro `_index` não faz o check passar. O scanner exige
`dnssecValidated: true` — a mensagem muda de *"records not found"* para *"records found,
but DNSSEC was not validated"*, o que parece progresso e continua `fail`.

---

## 4.1 DNSSEC — estado e operação

Habilitado em **2026-09-06**. Zona `SIGNING`, KSK `boutiqueempresarial_com_br_ksk`
(`ECDSAP256SHA256`), sobre uma KMS key `ECC_NIST_P256` em **us-east-1** — a região é
exigência do Route 53, não escolha. Alias `alias/dnssec-boutiqueempresarial-com-br`.

Este repositório é público: identificadores opacos de recurso (hosted zone, key id, account
id) ficam deliberadamente **fora** da documentação. Não são credenciais, mas em repositório
aberto só servem a reconhecimento. Para obtê-los:

```bash
aws route53 list-hosted-zones-by-name --dns-name boutiqueempresarial.com.br. \
  --query "HostedZones[0].Id" --output text
aws kms describe-key --region us-east-1 \
  --key-id alias/dnssec-boutiqueempresarial-com-br --query "KeyMetadata.KeyId" --output text
```

### Estado atual, a qualquer momento

```bash
./scripts/setup-agent-discovery-aws.sh dnssec-status
```

### O que a habilitação envolveu, na ordem

Registrado porque a ordem é o que separa uma operação sem incidente de uma queda de
domínio — não para ser reexecutado.

1. **Baixar o TTL máximo da zona antes de assinar.** O NS estava em 172800s (48h) e o campo
   `minimum` do SOA em 86400s. Enquanto esses valores estão em cache dos resolvers, um
   rollback demora até 48h para chegar. Foram para 3600 e 300 — é o que transforma um
   problema em uma hora de espera. A AWS trata isso como etapa, não como detalhe.
2. **KMS key com a policy certa.** Três `Allow` para `dnssec-route53.amazonaws.com`
   (`DescribeKey`/`GetPublicKey`/`Sign`, e `CreateGrant` à parte), com `SourceArn` preso à
   hosted zone desta zona — não da outra.
3. **`CreateKeySigningKey` + `EnableHostedZoneDNSSEC`.** A zona passa a ser assinada, mas
   **sem o DS no Registro.br ninguém valida**. Este é o ponto de não-retorno barato: dá para
   desfazer sem consequência.
4. **Alarmes antes do DS.** `DNSSECInternalFailure` e `DNSSECKeySigningKeysNeedingAction`,
   namespace `AWS/Route53`, dimensão `HostedZoneId`, notificando o tópico SNS
   `dnssec-alerts`. As métricas de DNSSEC do Route 53 são globais e **só existem em
   us-east-1** — alarme criado em outra região nunca dispara.
5. **DS no Registro.br.** Só aqui a validação passa a valer. `.com.br` não publica o DS
   automaticamente: é cadastro manual no painel do registrador.

### Proteção contra destruição acidental

A key policy carrega um statement `DenyAccidentalKeyDestruction` que nega
`kms:ScheduleKeyDeletion` e `kms:DisableKey` a **todos os principals**. Um `Deny` explícito
vence qualquer `Allow`, inclusive o do root. O root mantém `kms:*` — incluindo
`PutKeyPolicy` —, então destruir a chave exige primeiro remover esse statement: de um
clique acidental para um ato deliberado em dois passos. Não interfere em
`Sign`/`GetPublicKey`/`DescribeKey`/`CreateGrant`, que é o que o Route 53 usa para assinar.

### 🔴 Ordem obrigatória de rollback

**A chave é ponto único de falha do domínio inteiro.** Com o DS publicado, apagá-la ou
desabilitá-la causa `SERVFAIL` em `boutiqueempresarial.com.br` para qualquer resolver
validador — e a zona tem **MX do Google Workspace**, então cai o site *e* o e-mail.

```
1. remover o DS no Registro.br
2. aguardar ~24h de propagação
3. só então: DisableHostedZoneDNSSEC + DeleteKeySigningKey
```

Inverter a ordem derruba tudo que resolve pelo domínio.

### Custo

~US$1/mês da KMS key, recorrente, enquanto o DNSSEC existir.

---

## 5. `agent_auth` — o shape que funciona

O bloco vive em **`/.well-known/oauth-authorization-server`**, a AS metadata — **não** no
`auth.md`. Três regras não óbvias, herdadas da `mauricio-site` e travadas por teste:

1. **O bloco vai na AS metadata.** O `auth.md` só precisa existir, ser servido como
   `text/markdown` e ter um H1 contendo `auth.md`. Blocos ```json``` dentro dele **não são
   parseados**.
2. **`skill` aponta para `/auth.md`** — não para uma agent-skill publicada. O check se
   chama `authMd` porque valida que a AS metadata amarra de volta ao documento.
3. **O trio anônimo tem que estar dentro do bloco `agent_auth`**:
   `identity_types_supported` + `anonymous.credential_types_supported` + `claim_uri`, os
   três no mesmo nível. Em `methods[]` ou no topo do documento **é ignorado**.

`tests/agent-readiness.spec.js` cobra exatamente esses três níveis — foi a parte que mais
custou iterações de deploy no site irmão, e aqui já nasce travada.

---

## 6. Como ler o scanner

O texto de remediação que a UI do `isitagentready.com` devolve é **genérico e fixo**:
idêntico em todo scan que falha aquele check, seja qual for a causa. Tratá-lo como
diagnóstico faz girar em círculo.

O sinal real está em `evidence[].finding.summary`, que só aparece no JSON:

```bash
curl -s -X POST https://isitagentready.com/api/scan \
  -H 'content-type: application/json' \
  -d '{"url":"https://boutiqueempresarial.com.br"}' > scan.json
```

Os validadores são uma **fila**: cada correção destrava o próximo, e a mensagem de topo
continua igual enquanto a evidência avança.

Quando o validador diz que um campo falta e ele **já existe** em algum nível, isso prova
que o validador não lê aquele nível — diagnostique por eliminação, não por tentativa.

---

## 7. Operação

### Confira o que está no ar, não o que está no repo

Um scan roda contra produção. Repo correto + deploy pendente parece bug de implementação e
não é.

```bash
curl -s https://boutiqueempresarial.com.br/.well-known/oauth-authorization-server | jq .agent_auth
```

### `Content-Type` dos manifestos sem extensão

RFC 8414/9727/9728 exigem caminho sem extensão. O `aws s3 sync` sobe esses objetos como
`binary/octet-stream` e um cliente estrito recusa o parse. `deploy.yml` tem um passo
dedicado que reescreve para `application/json`. **`--metadata-directive REPLACE` zera o
`Cache-Control`** — por isso o passo o reaplica junto.

### Ao editar uma skill, atualize o digest

`public/.well-known/agent-skills/index.json` carrega `digest: sha256:…` de cada `SKILL.md`.
O gate reprova se divergir.

```bash
sha256sum public/.well-known/agent-skills/<nome>/SKILL.md
```

### Ao mudar o conteúdo da home

O texto vive em quatro lugares que precisam continuar idênticos: bloco AEO visível,
`FAQPage` do JSON-LD (ambos já cobrados por `tests/aeo.spec.js`), `public/index.md` e
`public/llms-full.txt`. Os dois últimos ainda são sincronizados à mão — o gatilho para
gerar está em `HARNESS_AEO.md` §A5.

---

## 8. Referências

- `docs/specs/HARNESS_AEO.md` — contrato de head, JSON-LD, bloco AEO e a11y
- `docs/specs/CICD_OIDC.md` — pipeline de deploy e permissões AWS
- `scripts/setup-agent-discovery-aws.sh` — as duas camadas de infra
- `tests/agent-readiness.spec.js` — o que é cobrado
- RFC 8288 (Link) · RFC 9460 (SVCB/HTTPS) · RFC 8414 (AS metadata) · RFC 9727 (api-catalog) · RFC 9728 (PRM)
