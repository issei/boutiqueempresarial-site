# Agenda do dia na home (copy v3) — Spec de design

> **Exceção registrada (2026-10-27):** o Issei dispensou o `/design-sync` (regra 1 do `CLAUDE.md` do site) para esta home ("Dispensar nos dois"); a agenda foi implementada direto em HTML/CSS seguindo esta spec.

*   **Status**: Draft, aguarda `/design-sync`. Não implementada.
*   **Fonte**: [`../pages/home-copy-v3.md`](../pages/home-copy-v3.md) §3.2 (agenda do dia e caixa "Faça uma conta rápida"), §3.3 (`.achado-ganho`) e §6 (componentes novos). Esta spec só desenha o que lá está; o texto da tela é o literal de lá.
*   **Arquivos**: `src/index.html` (HTML e CSS dos três componentes, sem JS), `tests/home.spec.js`.
*   **Relacionados**: `STYLE_GUIDE.md`, `HARNESS_AEO.md` §B5, `CLAUDE.md` do site (regra 3: toda UI nova tem spec aqui antes de ser implementada; regra 1: `/design-sync` antes de gerar HTML/CSS).

## 1. Objetivo

A seção "Veja se o seu dia se parece com este." (§3.2 da copy v3) mostra a cena de um dia de quem lidera uma equipe que o procura para tudo, hora a hora, e termina num exercício curto. A cena precisa ler como uma agenda (horário e fato), e o exercício precisa parecer algo para fazer, não mais uma linha da lista. Hoje não existe componente para isso: este documento desenha três.

## 2. Restrições vindas do código

*   Só texto, ordem e estrutura das seções mudam (`home-copy-v3.md` §0). Destino dos botões, preservação de UTM, barra fixa do mobile, cabeçalho, rodapé, cookies e eventos de rastreamento ficam como estão.
*   CSS em `src/index.html`, **sem JS** e sem animação.
*   Reaproveita o filete dourado da `.pain-list` (`src/index.html`) e os tokens já usados na página (`--gold`, `--be-ink`, `--be-border`).
*   Vale o `STYLE_GUIDE.md`: desvio de paleta ou tipografia exige ADR, não decisão desta spec.
*   Os arquivos de `home-copy-v3.md` "Não afetados" continuam intocados.

## 3. Componentes

### 3.1 `.agenda` — a agenda do dia

Lista ordenada. Marcação semântica:

```html
<ol class="agenda">
  <li><time>8h10</time> Alguém te faz uma pergunta que poderia ter resolvido sozinho.</li>
  …
</ol>
```

*   `<time>` **sem** atributo `datetime`: o horário é ilustrativo.
*   O horário é um rótulo à esquerda: Inter 600, cor `--be-ink` (tinta), largura fixa para os textos alinharem. A copy v3 admitia `--gold` ou tinta; o ouro `#C5A059` não carrega texto (2.20:1, `obrigada-agendamento.md` §3), então fica a tinta. O ouro continua só no filete.
*   Acima de 640 px: grade `5.5rem 1fr`. Abaixo de 640 px: empilhado, com o horário **acima** do texto.
*   Reaproveita o filete dourado da `.pain-list`.
*   O último item (18h) tem destaque: peso maior, por ser o fecho da cena.
*   Sem animação.

Conteúdo, 7 itens, na ordem:

| Horário | Texto |
| :-- | :-- |
| 8h10 | Alguém te faz uma pergunta que poderia ter resolvido sozinho. |
| 9h30 | Chega um problema sem nenhuma ideia de solução, e quem resolve é você. |
| 11h | Você manda mensagem para cada pessoa para saber como está cada entrega. |
| 14h | A pessoa que entrou há um mês pergunta, pela terceira vez, algo que você já explicou. |
| 16h | Um cliente pede uma resposta, e ninguém do time se sente seguro para dar sem falar com você. |
| 17h30 | Você queria dar um retorno para alguém sobre a semana, mas não sobrou tempo. |
| 18h | O seu próprio trabalho ainda não começou. |

Abaixo da lista, um parágrafo com `margin-top` de 40 px: "E quando uma entrega atrasa, é você quem explica, para o cliente ou para quem cobra resultado de você. Muitas vezes, você foi o último a saber do atraso."

### 3.2 `.conta-rapida` — a caixa "Faça uma conta rápida."

É um exercício, então vem destacada da lista.

*   Fundo branco, borda `--be-border`, padding de 32 px.
*   Título em `h3`: "Faça uma conta rápida."
*   Dois parágrafos:
    1.  "Pense no dia de ontem. Quantas vezes alguém do time te procurou? Agora separe essas vezes em dois grupos: as que precisavam de uma autorização sua e as que a pessoa poderia ter resolvido sozinha se soubesse que podia."
    2.  "Se o segundo grupo for o maior, já dá para ver de onde vem a falta de tempo. O próximo passo é descobrir o que o seu time pode decidir sem você."

### 3.3 `.achado-ganho` — a linha de resultado dos cartões

Linha final de cada um dos três cartões da seção "O que olhamos juntos nos 45 minutos" (§3.3 da copy).

*   Inter 400, itálico, cor `--be-ink`, `margin-top` de 16 px.
*   Textos (um por cartão, na ordem 01, 02, 03):
    1.  "Você descobre por que precisa perguntar o status de tudo."
    2.  "Você descobre o que pode parar de chegar até você."
    3.  "Você vê, com os seus próprios exemplos, o preço de deixar como está."

## 4. Hierarquia de títulos

*   `h2` da seção: "Veja se o seu dia se parece com este."
*   `h3` da caixa: "Faça uma conta rápida."
*   Os cartões de §3.3 já são `h3`. A `.agenda` não tem título próprio: a lista pertence ao `h2`.

## 5. Acessibilidade e responsivo

*   `<ol>` e `<time>` entregam a ordem e o horário a leitores de tela sem ARIA extra.
*   Em 375 px, sem rolagem horizontal; o horário fica acima do texto.
*   Cor do horário: tinta (`--be-ink`), decidido. A copy v3 admitia "`--gold` ou tinta", mas o ouro `#C5A059` não carrega texto (2.20:1, `obrigada-agendamento.md` §3) e reprovaria o contraste do axe (`tests/a11y.spec.js`).

## 6. Critérios de pronto

1.  `.agenda` com 7 itens, horários na ordem 8h10 → 18h, texto idêntico caractere a caractere aos de §3.1; em 375 px sem rolagem horizontal.
2.  Um único `h1` na página; "Veja se o seu dia se parece com este." em `h2`; "Faça uma conta rápida." em `h3`.
3.  `.conta-rapida` com o texto literal de §3.2.
4.  Cada um dos três cartões de §3.3 termina em `.achado-ganho` com o texto literal de §3.3.
5.  Nenhum JS novo; nenhuma animação.
6.  `npm run gate` verde (a11y, `tests/home.spec.js` com a contagem de itens da agenda, sem regressão de CLS).

## 7. Passos antes de implementar

1.  Rodar `/design-sync` na sessão local do site e conferir os três componentes contra `design-system/` e `STYLE_GUIDE.md` (`CLAUDE.md` do site, regras 1 e 2).
2.  Só então implementar `src/index.html` e `tests/home.spec.js`, junto com o resto da copy v3.

## 8. Fora de escopo

O restante da copy v3 (hero, seções, FAQ, head, `public/`), a barra fixa do mobile e qualquer mudança no formulário. Ver `home-copy-v3.md`.
