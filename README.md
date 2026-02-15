# Boutique Empresarial — Site

Site estático simples para a Boutique Empresarial.

## Descrição

Este repositório contém o site público da Boutique Empresarial (páginas estáticas gerenciadas com Vite). O projeto é leve, orientado a conteúdo estático (`src/` + `public/`) e utiliza Vite como bundler/dev server.

## Tecnologias

- Node.js (recomendado v20 conforme CI)
- Vite
- Tailwind CSS

(O projeto declara dependências de desenvolvimento: `vite`, `tailwindcss`, `@tailwindcss/vite`, `glob`.)

## Pré-requisitos

- Node.js (recomendo usar a mesma versão que o workflow: v20)
- npm (ou yarn/pnpm — instruções abaixo usam npm)

## Instalação

1. Instale as dependências:

```bash
npm install
```

2. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Por padrão o Vite serve em http://localhost:5173 — abra esse endereço no navegador.

## Scripts úteis (definidos em `package.json`)

- `npm run dev` — inicia o servidor de desenvolvimento (Vite)
- `npm run build` — gera os arquivos de produção (build)
- `npm run preview` — faz preview do build localmente
- `npm run start` — alias para `npm run dev`

## Build e Deploy (CI)

O repositório já inclui um workflow GitHub Actions em `.github/workflows/deploy.yml` que realiza os passos abaixo quando há push para a branch `main`:

1. Checkout do repositório
2. Configura Node.js (o arquivo usa `node-version: 20`)
3. `npm install`
4. `npm run build` (gera a pasta `dist/`)
5. Configura credenciais AWS (assume role)
6. `aws s3 sync dist/ s3://<bucket> --delete`
7. Invalida o cache do CloudFront

Secrets/variáveis necessárias no repositório (Settings → Secrets):

- `AWS_ROLE_ARN` — ARN do role que o workflow deve assumir
- `AWS_REGION` — região AWS (ex.: `us-east-1`)
- `S3_BUCKET_NAME` — nome do bucket S3 para hospedar o site
- `CLOUDFRONT_DISTRIBUTION_ID` — ID da distribuição CloudFront (para invalidar cache)

Observação: o workflow comenta que o `outDir` pode estar configurado para gerar `dist/` na raiz — confirme `vite.config.js` se você customizou `outDir`.

## Estrutura do projeto

- `public/` — arquivos estáticos servidos diretamente (favicon, manifest, sitemap, 404)
- `src/` — páginas HTML do site (ex.: `index.html`, `privacidade.html`, `termos.html`)
- `.github/workflows/deploy.yml` — workflow CI/CD para build e deploy
- `package.json` — scripts e dependências

## Como contribuir

1. Crie uma branch para sua mudança: `git checkout -b feat/minha-mudanca`
2. Faça commits atômicos e descritivos
3. Abra um Pull Request direcionado à `main` quando pronto

O deploy automático ocorre ao merge/push na branch `main`.

## Notas adicionais

- O `package.json` marca o projeto como `private: true`. Se for torná-lo público, adicione um campo `license` apropriado.
- Se você alterar a estrutura de saída do build (`outDir`), atualize também o workflow de deploy para apontar para a pasta correta.

## Contato

Para dúvidas sobre o deploy ou configuração AWS, consulte o responsável pela infraestrutura ou deixe uma issue no repositório.

---

README gerado automaticamente. Ajuste conforme necessário para incluir detalhes específicos (ex.: favicon, domínio, instruções de cache/headers, etc.).
