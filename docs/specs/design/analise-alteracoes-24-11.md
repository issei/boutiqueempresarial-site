# Alterações de 24/11 na página `/analise`: revisão e plano

**Status:** Draft para aprovação do Issei (2026-11-24). Nada implementado.
**Fontes:** resumo `alteracoes-24-11-para-dev.md` e PDF da página, enviados em 24/11; base comparada: `origin/main` (`e6ca596`, PR #61), `src/analise.html`.
**Relaciona-se com:** `home-analise-operacao.md` (texto de 20/11), `pagina-analise-operacao.md` (página de entrada), Spec 032 do CRM.

## 1. Revisão

### 1.1 Precisa de decisão

| # | Achado | Recomendação |
| :-- | :-- | :-- |
| R1 | **Falta o metaprompt atualizado.** O resumo diz que, se divergir, vale o `metaprompt-nova-pagina-bio.md`. A cópia em Downloads é de 20/11 17:09, com o texto antigo, e não veio outra anexada. O "antes" da microcopy do hero ("Análise individual e gratuita. Você responde 5 perguntas…") também não é o texto que está no ar nem o de 20/11: o resumo compara com uma versão intermediária que não temos. | Pedir o metaprompt de 24/11 à Talita e conferir antes do merge. Enquanto isso, usar resumo + PDF. Não aplicar o metaprompt de 20/11 por cima. |
| R2 | **5 ou 6 perguntas, e o e-mail.** Resumo e PDF dizem "5 perguntas" e o PDF não tem o campo de e-mail. No ar são 6, por decisão do Issei em 21/11, porque o CRM recusa lead sem e-mail. O resumo diz que perguntas e opções não mudam. | Manter o e-mail e escrever "6 perguntas" nos três lugares (microcopy do hero, apoio e passo 1). Avisar a Talita. |
| R3 | **Ordem dos itens de "Com a operação organizada".** Resumo: 3 = "A equipe resolve o dia a dia…", 4 = "Sobra tempo para vender…". PDF: 3 = "Sobra tempo…", 4 = "A equipe…". O texto é o mesmo. | Seguir o resumo, salvo se o metaprompt de 24/11 disser o contrário. |
| R4 | **Moldura da foto em "Quem vai conversar com você".** O PDF mostra arco com borda laranja. No ar é um retângulo arredondado, e o resumo diz que a seção não muda. | Não mudar. As fotos continuam as atuais (decisão de 20/11). |
| R5 | **Prévia do link (`og-image.jpg`) diz "sem depender do dono".** A regra de 20/11 proíbe "dono", e a imagem é a que aparece ao compartilhar `/analise`. É a mesma imagem da home. | Fora do pedido de 24/11. Se quiser corrigir, gerar uma imagem só de `/analise` com o título novo, sem tocar na da home. |

### 1.2 Pontos de atenção

- **Promessa com prazo no H1.** "O plano para aumentar o faturamento da sua empresa nos próximos 30 dias" não usa verbo proibido, mas pode ser lido como resultado em 30 dias. O resto da página fala em *plano* de 30 dias. Vale a Talita confirmar, também por causa da política de anúncios da Meta. O texto é final, então não mexo.
- **JSON-LD.** O resumo pede atualizar o `FAQPage`. A `/analise` não tem JSON-LD: ela é `noindex` e o bloco foi retirado de propósito (`pagina-analise-operacao.md`, D2). Não há o que atualizar. O JSON-LD da home é de outra página e não muda.
- **Sai do hero a frase "Se a sua aplicação for aprovada, eu entro em contato para marcar".** A condição continua no passo 2 do formulário, no texto legal e em "para empresas aprovadas".
- **"plano de 30 dias" e "plano de ação de 30 dias" convivem** (cartão 04 e cartão escuro x quadro, FAQ e metadados). Está assim no resumo e no PDF. Mantido.
- **"Resumo (Em síntese)".** Nem o PDF nem a página têm esse rótulo. Entendo como o nome do bloco, e só o texto muda.
- **"trava" continua** na última resposta do FAQ ("o que trava a operação"). Resumo e PDF não mudam essa resposta.
- **Botão novo no ponto cego:** a página passa de 5 para 6 CTAs (contando a barra fixa).
- **Hero:** o título novo é mais curto que o atual; o teto de 3rem fica.

### 1.3 Varredura "grátis"/"gratuita"

Em `src/analise.html` são quatro ocorrências, e as quatro caem com as mudanças do resumo:

| Linha | Texto | Some em |
| :-- | :-- | :-- |
| 505 | "Uma sessão individual e gratuita." | §2.1 Hero |
| 512 | selo "Gratuita" | §2.1 Hero |
| 743 | "Nada. A análise é gratuita." | §2.9 FAQ |
| 780 | "Análise gratuita · 45 minutos · Individual" | §2.10 Por que agora |

`title`, description, Open Graph, Twitter e alt das fotos não usam a palavra. JSON-LD: não há na página. `obrigada.html` e o Apps Script: nenhuma ocorrência. Nos testes, `tests/analise.spec.js` fixa o texto antigo (linhas 9, 100 e 102).

**Fora do alcance da regra** (entendi "a página inteira" como `/analise`): a home, `index.md`, `llms*.txt` (trechos da home) e `.well-known/*` continuam com "Diagnóstico Gratuito", o nome do produto da home.

## 2. Plano por seção (`src/analise.html`)

Textos: os do resumo, literais. Sem biblioteca nova, só HTML/CSS e os tokens atuais.

1. **Hero:** eyebrow, H1 (com `<em>`), subtítulo e microcopy ("Você responde 6 perguntas em 2 minutos.", R2). Remover `<ul class="selos">` e o CSS `.selos`. Foto e legenda iguais.
2. **Quadro da sessão (novo, depois da faixa):** `<section>` com cartão branco. Eyebrow, frase em Playfair como `<h2>`, parágrafo com `<strong>` e `<dl>` de três dados em CSS grid: três colunas com divisória vertical a partir de 600 px, empilhados abaixo disso. Valor em `--accent-text` (contraste AA), legenda em maiúsculas por CSS.
3. **Sinais:** itens 2, 6, 7 e o texto do contador. O JS do contador não muda.
4. **Ponto cego:** grid de duas colunas a partir de 900 px. `<ol class="ciclo">` vira 4 cartões numerados (número e setas ↓ por `::before`/`::after`). A linha lateral do passo 4 ao 1 é decorativa, em CSS, com ponta de seta e sem SVG interativo. Passo 4 com borda `--accent-light`, legenda, botão para `#aplicar` e quadro final com barra laranja. Saem `.caixa-borda` e os dois parágrafos antigos. Ordem no DOM = ordem no celular.
5. **O que você leva:** título e texto do 01, textos do 02 e do 04. Cartão 03 e cartão escuro iguais.
6. **Dois caminhos:** 3º item da esquerda; lista da direita com 4 itens na ordem do resumo (R3).
7. **Para quem é:** texto de "É para você".
8. **Formulário:** passo 3 e placeholder do desafio. Campos, payload, `formulario: "analise"` e envio **não mudam**, então CRM e Apps Script ficam como estão.
9. **FAQ:** resumo (`.aeo-tldr`), "Tem custo?", números ou relatórios, time sem processo. Continuam 7 perguntas.
10. **Por que agora:** título com `<em>` e linha abaixo do botão.
11. **Metadados:** description, OG e Twitter (150 caracteres; o teste aceita de 50 a 160). `title` igual.

Fora de `analise.html`:

- `tests/analise.spec.js`: H1, subtítulo, ordem dos h2 (entra o do quadro), sinais, ciclo, cartões, 3 + 4 itens, 6 CTAs, FAQ, micro e metadados; **teste novo que falha com `gr[aá]tis|gratuit` em qualquer texto, atributo ou meta da página**; quadro empilhado e ponto cego em uma coluna a 390 px, sem rolagem lateral.
- `home-analise-operacao.md`: nota no topo apontando este arquivo como o texto vigente.
- `public/llms*.txt`: a entrada de `/analise` já não diz "gratuita"; nada a mudar.

## 3. Entrega

- **Uma PR só, do site** (branch a partir da `main`). Sem mudança no CRM, no Apps Script, na planilha ou na home.
- **Rascunho até o ok do Issei.** Push, PR e deploy só com a decisão dele.
- **Bloqueio conhecido:** a CI de PR do site travou duas vezes instalando os navegadores do Playwright (limite de 60 min, nenhum teste rodou). Corrigir antes, ou a PR não terá o gate da CI.

## 4. Critérios de aceite

1. Nenhum "grátis"/"gratuita"/"gratuito" em `/analise`, inclusive metadados e atributos.
2. Textos das seções 1 a 11 literais, com as exceções aprovadas (R2, R3).
3. Os 6 CTAs levam a `#aplicar`; o payload é igual ao de hoje.
4. 390 px sem rolagem lateral; axe sem serious/critical; contraste AA no quadro e no ciclo.
5. `git diff origin/main -- src/index.html` vazio.
6. `npm run gate` verde.

## Allowlist de implementação

- Paths: `src/analise.html`, `tests/analise.spec.js`, `docs/specs/design/`
- Efeitos proibidos: push, PR e deploy sem decisão do Issei; envio real de formulário em teste.
