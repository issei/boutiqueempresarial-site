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

## Metodologia de Desenvolvimento (SDD & VibeCoding)

Este projeto adota uma abordagem moderna de desenvolvimento de software que combina rigor na especificação com agilidade na implementação.

### 1. SDD (Specification Driven Development)

**"A documentação é a fonte da verdade."**

Antes de escrever qualquer linha de código, definimos o "o quê" e o "como" nas especificações.

*   **Processo**:
    1.  Toda nova feature ou página começa com a criação/atualização de um arquivo em `docs/specs/`.
    2.  Use o template `docs/specs/PAGE_SPEC_TEMPLATE.md` para novas páginas.
    3.  Valide a arquitetura em `docs/specs/ARCHITECTURE.md` e o estilo em `docs/specs/STYLE_GUIDE.md`.
    4.  Somente após a aprovação da *spec*, o código é implementado.

*   **Benefícios**: Clareza, redução de retrabalho e alinhamento entre produto e engenharia.

### 2. VibeCoding

**"Codifique na velocidade do pensamento."**

Após a definição clara via SDD, utilizamos ferramentas de IA e automação para implementar a solução de forma rápida e fluida.

*   **Filosofia**:
    *   Foco no fluxo (*flow*) e na experiência do usuário final.
    *   Iterações rápidas com feedback visual imediato.
    *   O código é "gerado" e "refinado", não apenas "escrito".
    *   A IA atua como par programador, seguindo estritamente as *specs* definidas no passo anterior.


## Testes e Qualidade (QA)

A garantia de qualidade é fundamental para evitar regressões em um ambiente de deploy contínuo. Utilizamos **Playwright** para testes automatizados.

### 1. Tipos de Testes

*   **Smoke Tests (Testes de Fumaça)**:
    *   Verificam se as páginas principais carregam corretamente (Status 200).
    *   Validam se não há links quebrados (404) internos ou assets ausentes.
    *   Garantem que o site está "de pé" após um deploy.
    *   Arquivo: `tests/smoketest.spec.js`

*   **Testes E2E (Ponta a Ponta)**:
    *   Simulam a navegação do usuário real.
    *   Validam fluxos críticos, como funcionamento de menus, formulários e renderização de componentes chave.
    *   Arquivo: `tests/home.spec.js`

### 2. Executando os Testes

Para rodar os testes localmente:

1.  **Smoke Test**: Executa a validação rápida de links e assets.
    ```bash
    npm run test:smoke
    ```

2.  **Todos os Testes (Playwright)**: Executa a suíte completa (E2E + Smoke).
    ```bash
    npx playwright test
    ```

3.  **Relatório Visual**:
    ```bash
    npx playwright show-report
    ```

> **Nota**: O projeto atualmente foca em testes E2E/Smoke devido à natureza estática do site. Testes unitários (Vitest/Jest) podem ser adicionados futuramente caso haja introdução de lógica complexa em JavaScript.


## Como contribuir

1. Crie uma branch para sua mudança: `git checkout -b feat/minha-mudanca`
2. Faça commits atômicos e descritivos
3. Abra um Pull Request direcionado à `main` quando pronto

O deploy automático ocorre ao merge/push na branch `main`.

## Licença e Direitos Autorais

Copyright (c) 2024-2026 Boutique Empresarial. **Todos os direitos reservados**.

Este repositório é público estritamente para fins de **consulta*.
É **estritamente proibido**, sem o consentimento prévio e por escrito:
- Copiar, replicar ou distribuir o código ou seus componentes;
- Criar trabalhos derivados utilizando recursos corporativos, designs ou a arquitetura deste projeto;
- Fazer uso comercial ou não comercial do código-fonte e suas estruturas.

Para mais detalhes, consulte o arquivo [LICENSE](./LICENSE).

## Notas adicionais

- O projeto está marcado com `"license": "UNLICENSED"` e `"private": true` no `package.json` para refletir sua natureza proprietária.
- Se você alterar a estrutura de saída do build (`outDir`), atualize também o workflow de deploy para apontar para a pasta correta.

## Contato

Para dúvidas sobre o deploy ou configuração AWS, consulte o responsável pela infraestrutura ou deixe uma issue no repositório.

---

README gerado automaticamente. Ajuste conforme necessário para incluir detalhes específicos (ex.: favicon, domínio, instruções de cache/headers, etc.).
