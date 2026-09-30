# SDD — Página de Agendamento do Diagnóstico (`agendar`)

*   **Status**: Implementada localmente (v1.1, alinhada à Spec 017 v1.1 do CRM; contrato OpenAPI 1.0.0). Aguarda revisão da copy, publicação e liberação coordenada (F7). Divergências e decisões da implementação em §14.
*   **Arquivos afetados (na implementação)**: `src/agendar.html`, `src/js/agendar.js`, `tests/agendar.spec.js`, `e2e/agendar.spec.js`, `docs/specs/ARCHITECTURE.md` (tabela de páginas), `src/privacidade.html` (uso do e-mail e do Google Agenda para agendamento)
*   **Contrato da API que a página consome**: `boutiqueempresarial-crm/docs/openapi/agendamento.json`, congelado ao fim da fatia F2 da Spec 017 (campo `info.version`). É a única fonte do contrato: as respostas simuladas dos testes (§11) são copiadas dos exemplos desse arquivo, com a versão anotada em `tests/fixtures/agendar/VERSION`. Em divergência sobre a API, **o CRM vence**; a página se adapta.
*   **Substitui**: nada. Substitui apenas o passo manual de combinar horário depois do formulário.

---

## 1. Objetivo

Depois de completar o formulário, o lead recebe um e-mail do CRM com um link pessoal. Esta página mostra **só os dias e horários livres**, deixa o lead confirmar um deles e permite remarcar ou cancelar. Ela não guarda nada: toda regra, todo horário e todo estado vivem no CRM. A página é apresentação e transporte.

## 2. Fora de escopo

*   Qualquer cálculo de disponibilidade, regra de etapa ou validade de link (é do CRM).
*   Mostrar o link na `obrigada.html` (evolução; exige o CRM devolver o token na resposta da integração).
*   Evento de conversão no Pixel/GA4 ao agendar (evolução; exige spec em `docs/specs/design/`, ver §9).
*   Escolha de formato da reunião: é sempre Google Meet.
*   Login, cadastro ou qualquer dado além do token.

## 3. Informações básicas (template)

*   **Nome do arquivo**: `agendar.html`
*   **URL final**: `boutiqueempresarial.com.br/agendar` (a `viewer-request.js` já reescreve `/agendar` para `/agendar.html`)
*   **Título (SEO)**: `Agendar Diagnóstico Gratuito | Boutique Empresarial`
*   **Descrição**: `Escolha o horário do seu Diagnóstico Gratuito com a Boutique Empresarial. A conversa acontece por Google Meet.`
*   **Header**: minimalista (só o logo). **Footer**: simples.
*   **Paleta e vibe**: clara, autoridade sem gritar (`STYLE_GUIDE.md`): fundo `#f5f2eb`, texto `#1f1f1f`, ouro `#C5A059` só em detalhe, Playfair Display nos títulos, Inter no corpo. Sem desvio de paleta.

## 4. O link e o token (decisões)

*   **Formato do link**: `https://boutiqueempresarial.com.br/agendar#t=<token>`. O token vai no **fragmento (`#`)**, não na query (`?`). O fragmento nunca é enviado ao servidor nem no cabeçalho `Referer`, então não aparece em log da CloudFront, do S3 nem em sistemas de terceiros. (A ideia inicial era `?id=`; o CRM define o formato do link em `site_base_url`, e a Spec 017 do CRM foi ajustada para `#t=`.)
*   **O token não é o `event_id`.** O `event_id` do formulário nasce no navegador e circula em Pixel e CAPI. O token é gerado pelo CRM. **A página trata o token como opaco**: só confere que é uma string de 20 a 200 caracteres em `[A-Za-z0-9_.-]`; o formato interno é do CRM e pode mudar sem mexer no site.
*   **Ordem de execução no `<head>`** (crítica para não vazar o token para Pixel e GA4):
    1.  Primeiro script inline da página: lê `location.hash`, valida o formato do token, guarda em `sessionStorage` (`be_agendar_t`) e chama `history.replaceState(null, '', location.pathname)`.
    2.  Só depois: bloco inline de consentimento, `cookie-consent.js`, Pixel e `gtag.js`. Assim `PageView` e `page_location` nunca contêm o token.
*   Sem token no hash e sem token na `sessionStorage` (aba nova sem o link): estado "link inválido" (§6.6). Recarregar a página na mesma aba continua funcionando porque o token ficou na `sessionStorage`.
*   O token só sai da página no **corpo JSON** das chamadas à API, nunca em URL, cabeçalho de log, `console.log` nem atributo do DOM.
*   `<meta name="referrer" content="no-referrer">` na página.

## 5. Chamadas à API

Base: `https://api.boutiqueempresarial.com.br/public/agendamento` (API pública separada do CRM, Spec 017 §6.1). A base fica numa única constante em `agendar.js`. Todas `POST`, `Content-Type: application/json`, `credentials: 'omit'`, com `AbortController` e limite de 10 s (o CRM consulta o Google antes de responder `slots`). O navegador envia preflight; o CORS da API pública libera só a origem do site.

| Ação | Rota | Corpo | Cabeçalho extra |
| :-- | :-- | :-- | :-- |
| Carregar horários | `/public/agendamento/slots` | `{token}` | — |
| Reservar | `/public/agendamento/reservar` | `{token, inicio}` | `Idempotency-Key` |
| Remarcar | `/public/agendamento/remarcar` | `{token, inicio}` | `Idempotency-Key` |
| Cancelar | `/public/agendamento/cancelar` | `{token}` | `Idempotency-Key` |

*   `Idempotency-Key`: um `crypto.randomUUID()` por **tentativa de ação**. Se a rede falhar e o lead tentar de novo a mesma ação, reaproveita a mesma chave; ao escolher outro horário, gera uma nova.
*   Resposta de `slots`: `{primeiro_nome, duracao_min, fuso, dias:[{data, horarios:[ISO8601]}], agendamento_atual: null | {inicio, fim, meet_url, pode_alterar}}`. Com `agendamento_atual` preenchido, a página abre direto no estado Confirmado (§6.3) e só mostra Remarcar/Cancelar se `pode_alterar` for verdadeiro. A página formata **tudo** no fuso devolvido (`America/Sao_Paulo`) com `Intl.DateTimeFormat`, independente do fuso do aparelho, e escreve o fuso na tela ("horário de Brasília").
*   A página nunca calcula horário livre, nunca guarda a lista de horários além da tela aberta e nunca confia em dado que não veio da API.

## 6. Estados e comportamento

Uma única página, um único `<main id="conteudo">`, com regiões que se alternam. Cada troca de estado move o foco para o título do estado e anuncia em uma região `aria-live="polite"`.

**6.1 Carregando.** Esqueleto e `aria-busy="true"` enquanto `slots` responde. Nenhum horário aparece antes da resposta.

**6.2 Escolha (lead ainda sem horário).** Título (H1): "Escolha o melhor horário para o seu Diagnóstico Gratuito". Subtítulo com o primeiro nome e a duração vindos da API, e a informação de que a conversa é por Google Meet e o convite chega por e-mail. Depois:
*   **Dias**: grupo de rádios estilizados (`role="radiogroup"` com `<input type="radio">` real), com data por extenso ("terça, 6 de outubro"). Quebra em várias linhas; sem rolagem horizontal em 375 px.
*   **Horários** do dia escolhido: mesmo padrão de rádios, com `HH:MM`, alvos de toque com pelo menos 44 px.
*   **Confirmar horário**: o botão **nunca fica desabilitado sem explicação**. Sem seleção completa, o clique mostra "Escolha um dia e um horário" no texto de apoio (`aria-describedby`). Durante o envio o botão mostra "Confirmando..." e bloqueia clique duplo.

**6.3 Confirmado.** "Diagnóstico agendado para terça, 6 de outubro, às 14h (horário de Brasília)". Se `meet_url` vier, botão "Abrir o Google Meet" (`rel="noopener"`); se vier nulo, texto "O convite do Google Agenda chega ao seu e-mail com o link do Meet." Ações secundárias: "Remarcar" e "Cancelar agendamento".

**6.4 Remarcar.** Volta à escolha (§6.2) mostrando o horário atual no topo; ao confirmar chama `remarcar`. O resultado leva de novo a §6.3.

**6.5 Cancelar.** Confirmação **inline** (sem `window.confirm`): "Cancelar este horário?" com "Sim, cancelar" e "Manter". Depois do sucesso: "Agendamento cancelado. Se quiser, escolha outro horário." e volta à escolha.

**6.6 Erros (mapeados pelo status devolvido pelo CRM).** Todos com mensagem em pt-BR, sem texto técnico e sem jargão.

| Situação | Texto (proposta) | Ação oferecida |
| :-- | :-- | :-- |
| `404` ou token ausente/malformado | "Este link não é válido." | Contato alternativo |
| `410` expirado ou revogado | "Este link expirou. Fale com a gente e enviamos um novo." | Contato alternativo |
| `409 lead_nao_agendavel` | "Nossa equipe já está em contato com você. Se precisar mudar algo, fale com a gente." | Contato alternativo |
| `409 horario_indisponivel` | "Esse horário acabou de ser reservado. Escolha outro." | Recarrega `slots` e mantém o dia |
| `409 fora_do_prazo` | "Faltando pouco para a conversa, alterações são feitas com a nossa equipe." | Contato alternativo |
| `422` | "Não foi possível confirmar. Escolha o horário de novo." | Volta à escolha |
| `429` | "Muitas tentativas. Aguarde um instante e tente de novo." | "Tentar novamente" |
| `503`, timeout, rede | "Não conseguimos carregar os horários agora. Tente de novo em alguns minutos." | "Tentar novamente" |
| `dias` vazio | "No momento não há horários disponíveis. Fale com a gente e encontramos um horário." | Contato alternativo |

*   **Contato alternativo**: o mesmo canal de contato que o site já usa (a definir na implementação, sem inventar número; se não houver link de WhatsApp público no site, usar o e-mail de contato da `privacidade.html`).
*   A página **nunca inventa um horário** nem exibe horário de uma resposta anterior depois de um erro.

## 7. Conteúdo, copy e vocabulário

*   Copy da §6 é **proposta** para revisão da autora (o agente `copy-writer` conhece o vocabulário). Vocabulário controlado do `HARNESS_AEO.md` §B6: "Diagnóstico Gratuito" (a sessão individual sem custo), nunca "Diagnóstico de Estabilidade".
*   Proibidos: "revolucionário", "disruptivo", "game-changer", "solução completa", "de última geração", e verbos que prometam resultado ("garante", "elimina", "assegura").
*   A duração vem da API (`duracao_min`); a copy nunca fixa "45 minutos".

## 8. Contrato da página (`HARNESS_AEO.md`)

*   **Indexável?**: **Não.** `meta robots` = `noindex,nofollow`. A página fica isenta de canonical, OG, Twitter, bloco AEO e companion Markdown; o `vite.config.js` já a tira do sitemap.
*   **JSON-LD**: nenhum obrigatório (página noindex e sem conteúdo editorial). Não declarar dado estruturado.
*   **Head**: `meta charset` na primeira linha, `viewport`, `lang="pt-BR"`, title (10 a 60 caracteres, sufixo `| Boutique Empresarial`), description (50 a 160 caracteres), GA4 com `G-8HNXV7KTY9`, Pixel e consentimento, na ordem da §4.
*   **Acessibilidade (WCAG 2.1 AA, `HARNESS_AEO.md` §B5)**: skip link como primeiro focável; `<main id="conteudo">`; exatamente um `<h1>`; foco visível; contraste mínimo 4.5:1 (não usar ouro `#C5A059` em texto sobre `#f5f2eb` sem validar); zoom de 200%; sem scroll horizontal em 375 px; zero violações `serious`/`critical` no axe em **todos** os estados; respeitar `prefers-reduced-motion`.
*   **JavaScript**: um único módulo `src/js/agendar.js`, sem framework e sem dependência nova. Com JS desligado, a página mostra um aviso ("Ative o JavaScript para escolher o horário ou fale com a gente"), dentro de `<noscript>`.

## 9. Rastreamento e privacidade

*   Consentimento antes de Pixel e GA4, como nas outras páginas (`SEO_ANALYTICS.md` §3, `design/cookie-consent.md`).
*   O token nunca chega a Pixel, GA4, `dataLayer` ou console (§4). O teste da §11 cobre isso.
*   **Sem evento novo nesta versão.** Marcar o agendamento como conversão (por exemplo o evento padrão `Schedule` do Pixel e um evento do GA4) é evolução e pede spec em `docs/specs/design/`, mais o `event_id` compartilhado com o CAPI.
*   `src/privacidade.html` passa a citar o uso do e-mail para agendamento e do Google Agenda/Meet, com o mesmo `dateModified`/data de atualização dos outros textos legais.

## 10. Dependências e ordem

*   **Depende do CRM**: para **começar**, só do OpenAPI congelado na F2 (desenvolvimento e testes com respostas simuladas). Para **publicar**, das fatias F3 e F5 no ar. A página entra no ar antes da liberação: enquanto o agendamento estiver desligado no CRM, ninguém recebe link. A liberação coordenada é a fatia F7 da Spec 017.
*   **CSP**: nenhuma política de segurança de conteúdo está versionada neste repositório. Se a distribuição CloudFront tiver uma, `connect-src` precisa incluir `https://api.boutiqueempresarial.com.br`.
*   **Sem alteração em** `apps_script_atualizado.gs`: o e-mail do link sai do CRM, não do Apps Script.

## 11. Testes e critérios de aceite

Testes em `tests/agendar.spec.js` (contrato, respostas simuladas com `page.route`) e `e2e/agendar.spec.js` (fluxo). Bloquear terceiros como em `e2e/form-aplicacao.spec.js` (Pixel e GTM abortados; consentimento já gravado).

1.  `npm run gate` verde com a página nova (SEO, a11y, AEO, smoke entram por glob).
2.  `meta robots` contém `noindex`; a rota não aparece no sitemap gerado.
3.  Abrir `/agendar#t=<token válido>`: depois do carregamento, `location.hash` está vazio, `sessionStorage` tem `be_agendar_t` e **nenhuma requisição a Pixel, GA4 ou terceiros contém o token** (conferir URL, corpo e cabeçalho de todas as requisições).
4.  O token só aparece no corpo JSON das 4 rotas do CRM; nunca em URL, cabeçalho ou `console`.
5.  Recarregar a página na mesma aba mantém o fluxo (token vem da `sessionStorage`); aba nova sem o hash mostra "Este link não é válido."
6.  Fluxo feliz: carrega horários, escolhe dia e horário, confirma, vê a confirmação com data por extenso no fuso de Brasília, mesmo com o navegador em outro fuso (teste com `timezoneId` diferente).
7.  Horário reservado por outra pessoa (`409 horario_indisponivel`): mensagem, horários recarregados e dia mantido.
8.  Cada linha da tabela da §6.6 tem um teste com a resposta simulada correspondente e a mensagem esperada.
9.  Repetir a mesma ação após falha de rede reaproveita a mesma `Idempotency-Key`; escolher outro horário gera nova chave.
10. Botão Confirmar nunca fica com `disabled` e sem texto de apoio; clique duplo envia uma só requisição.
11. Remarcar e cancelar seguem os estados §6.4 e §6.5, sem `window.confirm`.
16. Com `agendamento_atual` preenchido, a página abre em Confirmado; com `pode_alterar = false`, Remarcar e Cancelar não aparecem e o contato alternativo sim.
17. As respostas simuladas vêm de `tests/fixtures/agendar/` e o arquivo `VERSION` existe.
12. axe sem violações `serious`/`critical` nos estados: carregando, escolha, confirmado, cada erro e sem horários; teclado alcança todos os controles; foco vai ao título do novo estado.
13. Em 375 px não há scroll horizontal; com zoom de 200% nenhum conteúdo se perde.
14. Nenhuma resposta simulada da API é necessária para renderizar o esqueleto e as mensagens de erro (a página falha de forma legível com a API fora do ar).
15. Copy sem os termos proibidos do §B6 e com "Diagnóstico Gratuito" grafado como no vocabulário.

## 12. Allowlist de implementação

*   **Paths**: `src/agendar.html`, `src/js/agendar.js`, `src/privacidade.html`, `tests/agendar.spec.js`, `e2e/agendar.spec.js`, `tests/fixtures/agendar/`, `docs/specs/ARCHITECTURE.md`, `docs/specs/pages/agendar.md`
*   **Efeitos proibidos**: alterar `apps_script_atualizado.gs`, `src/formulario.html`, `src/obrigada.html`, `infra/`; adicionar dependência npm; `git push` sem instrução explícita; qualquer alteração no repositório do CRM a partir deste projeto.
*   **Tools MCP permitidas**: nenhuma.

## 13. Riscos e decisões pendentes

*   **Copy**: aguardando revisão da autora (§7).
*   **Contato alternativo**: definir o canal público que o site já usa (§6.6).
*   **Token em fragmento**: exige que o CRM monte o link com `#t=` (registrado na Spec 017 do CRM). Se algum cliente de e-mail descartar o fragmento, o lead cai em "link inválido"; testar nos clientes mais comuns antes de publicar.
*   **CORS e preflight**: dependem da API pública separada do CRM; se o mapeamento `public` no domínio da API não for possível, a base muda para um subdomínio (só a constante de `agendar.js` muda).
*   **Deriva de contrato**: a fixture copiada do OpenAPI pode envelhecer; conferir `VERSION` contra o CRM antes de cada publicação.
*   **Conversão no Pixel/GA4**: adiada; sem ela não há medição de agendamentos por campanha.

## 14. Notas da implementação

*   **Chave do erro público**: a API devolve `{"error":{"code","message","fields"}}` (chave `code`, não `codigo`). A página decide pelo `code` e cai no status HTTP quando o corpo não vem. A mensagem exibida é sempre a da tabela §6.6, nunca o `message` da API.
*   **`409 conflito`** (outra operação em andamento no mesmo link) não estava na tabela §6.6: a página mostra "Outra operação está em andamento. Tente de novo em instantes." com "Tentar novamente". `500 erro_interno` e resposta 200 fora do formato tratam-se como `503`.
*   **`422` em `slots`** é tratado como link inválido (o corpo é só o token); `422` em reservar/remarcar volta à escolha.
*   **Após reservar ou remarcar** a página assume `pode_alterar = true` (a resposta não traz o campo); o CRM segue valendo: `409 fora_do_prazo` cai no contato alternativo.
*   **Contato alternativo**: e-mail da `privacidade.html` (`talita@boutiqueempresarial.com.br`), pendência de canal definitivo registrada em §13.
*   **Fragmento**: aceita `#t=<token>` e ignora parâmetros extras após `&`. O formato `[A-Za-z0-9_.-]{20,200}` é o da §4; se o CRM passar a emitir o MAC com `=`, `+` ou `/`, a expressão da §4 precisa mudar nos dois lugares (`agendar.html` e `agendar.js`).
*   **Fixtures**: `tests/fixtures/agendar/` copia os exemplos do OpenAPI 1.0.0; as variantes que o OpenAPI não traz (`derivadas` em `slots.json`) estão marcadas como tal.
