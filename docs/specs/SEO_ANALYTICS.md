# SEO & Analytics Specification

## 1. Identidade e Propriedade

* **Domínio Principal:** `https://boutiqueempresarial.com.br`
* **Setor GA4:** Negócios e Indústria (Business & Industrial)
* **Foco de Palavras-chave:** Consultoria empresarial, boutique de negócios, eficiência operacional, estratégia B2B.

## 2. IDs de Rastreamento e Verificação

| Ferramenta | ID / Tipo | Método de Verificação |
| --- | --- | --- |
| **Google Analytics 4** | `G-8HNXV7KTY9` | Script `gtag.js` no `<head>` |
| **Meta Pixel** | `1469019395044653` | `fbq('init', …)` no `<head>`; verificação de domínio por `<meta name="facebook-domain-verification">` |
| **Google Search Console** | Domínio Raiz | Registro DNS TXT no Route 53 |
| **Sitemap** | `/sitemap.xml` | Gerado via `vite-plugin-sitemap` — só rotas indexáveis |
| **Robots.txt** | `/robots.txt` | Arquivo estático em `public/` |

O Pixel também alimenta o servidor: o Apps Script envia o mesmo evento pela Conversions API, deduplicado por `event_id` (`docs/specs/pages/formulario.md` §2).

---

## 3. Implementação Técnica

### Consentimento antes das tags

GA4 e Meta Pixel só coletam depois do consentimento. Cada página traz, **antes** do Pixel e do `gtag.js`,
um bloco inline com `gtag('consent','default', …denied)`; a interface fica em `src/js/cookie-consent.js`.
Ao criar página nova, replicar o bloco inline **junto** com os scripts abaixo — o contrato está em
[`docs/specs/design/cookie-consent.md`](design/cookie-consent.md) e é cobrado por
`e2e/cookie-consent.spec.js`.

### Injeção de Tags (Global)

Todas as páginas HTML em `src/` (as 8, inclusive `404.html`) devem conter o fragmento do GA4 dentro do `<head>`. A posição é
livre: o `gtag.js` é `async`, então ele não bloqueia o parser nem executa antes de chegar da rede —
a ordem entre ele e o Meta Pixel não altera a medição. Hoje o Pixel vem primeiro em todas as
páginas; ver `docs/specs/HARNESS_AEO.md` §6.1.

> **Nota para a IA:** Ao gerar novas páginas, não esqueça de replicar o script de rastreamento.

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-8HNXV7KTY9"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-8HNXV7KTY9');
</script>

```

### Eventos do funil do formulário

Catálogo e restrições em [`docs/specs/design/formulario-tracking-funil.md`](design/formulario-tracking-funil.md).
Resumo: `form_step_view`, `form_answer`, `form_step_complete`, `form_back`, `form_validation_error`,
`form_begin`, `form_contact_captured`, `form_submit_attempt`, `form_submit_error` em `formulario.html`;
`generate_lead` (key event) em `obrigada.html`. Nenhum parâmetro leva PII.

### Estrutura de Metadados (SEO On-Page)

Cada página deve seguir este padrão mínimo para garantir o "rankeamento" e a "vibe" profissional:

1. **Título:** Máximo 60 caracteres. Prefixo do serviço + `| Boutique Empresarial`.
2. **Meta Description:** Máximo 160 caracteres. Deve ser persuasiva e incluir a palavra-chave da página.
3. **Canonical Tag:** `<link rel="canonical" href="https://boutiqueempresarial.com.br/caminho-da-pagina" />`.

---

## 4. Social & Open Graph (Shareability)

Para garantir que o link do site apareça com imagem e título corretos no LinkedIn e WhatsApp:

* **og:type:** `website`
* **og:image:** `/og-image.jpg` (Imagem de 1200x630px localizada em `public/`)
* **og:site_name:** `Boutique Empresarial`
* **og:url:** `<meta property="og:url" content="https://boutiqueempresarial.com.br/NOME_DA_PAGINA" />`

---

## 5. Automação de Indexação

### Sitemap

O plugin `vite-plugin-sitemap` no `vite.config.js` é o responsável por listar todas as rotas `.html` encontradas em `src/`.

* **Frequência de Atualização:** Automática a cada build.
* **Só o que é indexável:** o `vite.config.js` lê o `meta robots` de cada `src/*.html` e exclui do sitemap as páginas `noindex`. Hoje só a home (`/`) entra; formulário, obrigada, legais, legado, guia de identidade e 404 ficam de fora.
* **Submissão:** O arquivo é enviado ao S3 e o Google Search Console o lê diretamente na raiz.

### Robots.txt

Localizado em `public/robots.txt` — **é a fonte; leia o arquivo, não uma cópia aqui.** Além do `Allow: /` e do `Sitemap`, ele carrega `Content-Signal` (`ai-train=no, search=yes, ai-input=yes`), `Agentmap`, `LLMs` e `LLMs-full` (`docs/AGENT_READINESS.md`).

O plugin de sitemap gera um `robots.txt` próprio por padrão e sobrescreveria este no `dist`; por isso `generateRobotsTxt: false` em `vite.config.js`. `tests/agent-readiness.spec.js` cobra o arquivo publicado.

---

## 6. Checklist de Validação para a IA

Sempre que o agente de **Vibe Coding** atuar no projeto, ele deve validar:

* [ ] A nova página possui um `<h1>` único e relevante?
* [ ] As imagens possuem atributo `alt` descritivo?
* [ ] O script do GA4 está presente e com o ID correto?
* [ ] A página tem o `meta robots` certo? (é ele que decide se entra no sitemap — não há lista manual)
* [ ] O bloco inline de consentimento vem antes do Pixel e do `gtag.js`?

---