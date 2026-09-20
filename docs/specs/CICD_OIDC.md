# CI/CD & OIDC Specification

Este documento detalha a configuração de Integração Contínua e Deploy Contínuo (CI/CD) utilizando **GitHub Actions** e autenticação segura via **OIDC (OpenID Connect)** com a AWS.

## Fluxo de Autenticação (OIDC)

O método tradicional de usar `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` está **obsoleto** neste projeto por motivos de segurança. Utilizamos OIDC para que o GitHub solicite um token temporário diretamente à AWS.

### Como Funciona
1.  O GitHub Actions inicia o job `deploy`.
2.  A action `aws-actions/configure-aws-credentials` solicita um token JWT ao provedor OIDC do GitHub.
3.  A AWS valida o token JWT e verifica se o repositório/branch corresponde à regra de confiança (Trust Policy) da role IAM.
4.  Se validado, a AWS retorna credenciais temporárias para o GitHub Runner assumir a role.

### Configuração Necessária

No arquivo `.github/workflows/deploy.yml`:

```yaml
permissions:
  id-token: write   # Permite solicitar o JWT ao GitHub
  contents: read    # Permite ler o código
```

E na step de configuração:

```yaml
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: ${{ secrets.AWS_REGION }}
```

## Secrets do Repositório

As seguintes secrets devem estar configuradas no GitHub (Settings > Secrets and variables > Actions):

| Secret Name | Descrição | Exemplo |
| :--- | :--- | :--- |
| `AWS_ROLE_ARN` | ARN da Role IAM criada na AWS para confiar neste repo. | `arn:aws:iam::123456789012:role/GitHubDeployRole` |
| `AWS_REGION` | Região AWS onde o S3/CloudFront estão. | `us-east-1` |
| `S3_BUCKET_NAME` | Nome do bucket S3 de origem. | `boutiqueempresarial-site-origin` |
| `CLOUDFRONT_DISTRIBUTION_ID` | ID da distribuição CloudFront. | `E1A2B3C4D5E6F` |

## Pipelines

| Workflow | Dispara em | Faz |
| :-- | :-- | :-- |
| `.github/workflows/playwright.yml` | push em qualquer branch **exceto** `main` | `npm ci` → browsers Playwright → `npm run gate`. Sobe `playwright-report/` como artifact (30 dias). Node `lts/*`. |
| `.github/workflows/deploy.yml` | push/merge em `main` | job `test` (o gate) e, verde, job `deploy` |

## Pipeline de Deploy (`deploy.yml`)

O pipeline é acionado a cada **push na branch main**. Dois jobs em sequência:

### Job `test`

`npm install` → `npx playwright install --with-deps` → `npm run gate` (Node 20). O relatório do Playwright é sempre publicado como artifact. Vermelho, o job `deploy` não roda (`needs: test`).

### Job `deploy` (environment `production`)

1.  **Checkout** e **Setup Node.js** (v20, cache npm).
2.  **Install**: `npm install`.
3.  **Build**: `npm run build`. O Vite gera os arquivos estáticos em `dist/` (o `outDir` é `../dist`, que cai na raiz do repo).
4.  **Auth AWS**: assume a role via OIDC.
5.  **Deploy to S3** — dois `sync` escopados, cada `--delete` só apaga dentro do próprio filtro:
    *   `dist/assets/` → `s3://…/assets/` com `Cache-Control: public, max-age=31536000, immutable` (arquivos com hash no nome, conteúdo imutável).
    *   `dist/` → `s3://…` excluindo `assets/*`, com `Cache-Control: public, max-age=0, must-revalidate` (HTML, `.md`, favicon, sitemap, manifests: o navegador sempre revalida).
6.  **Content-Type dos companions Markdown**: o `sync` sobe `.md`, `llms.txt` e `llms-full.txt` como `binary/octet-stream`; o passo reescreve para `text/markdown; charset=utf-8` (`HARNESS_AEO.md` §B4).
7.  **Content-Type dos manifestos `.well-known` sem extensão** (`api-catalog`, `agent-catalog`, `oauth-*`, `openid-configuration`): reescreve para `application/json` (`AGENT_READINESS.md` §7).
    *   Nos passos 6 e 7, `--metadata-directive REPLACE` **zera o `Cache-Control`** — por isso o passo o reaplica.
8.  **CloudFront Invalidation**: `create-invalidation --paths "/*"`, para os usuários verem a versão nova imediatamente.

### O que o pipeline **não** faz

*   Não publica as **CloudFront Functions** (`infra/cloudfront-functions/`) nem o DNS-AID: rodam à mão por `scripts/setup-agent-discovery-aws.sh` (`AGENT_READINESS.md` §4).
*   Não publica o **Apps Script** do formulário (`apps_script_atualizado.gs`): é colado no editor do Apps Script e republicado como Web App.

## Manutenção

### Se o deploy falhar na etapa de autenticação:
*   Verifique se o `AWS_ROLE_ARN` está correto.
*   Verifique na AWS IAM se a **Trust Relationship** da role permite a conta do GitHub e o repositório específico.

### Se o deploy falhar no build:
*   Execute `npm run build` localmente para depurar erros de código ou dependência.
