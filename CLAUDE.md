# Boutique Empresarial — Workflow Claude Design ↔ Claude Code

> Este arquivo cobre só o ciclo Design ↔ Code. Para tudo mais (specs de página,
> gate, deploy, subagentes), o índice é [`AGENTS.md`](AGENTS.md) — se algo aqui
> contradiz `AGENTS.md` ou um spec em `docs/specs/`, eles vencem.

## Contexto do projeto

- **Produto:** site institucional da Boutique Empresarial — funil único do
  **Diagnóstico Gratuito** (landing + formulário de 9 etapas + confirmação).
- **Stack:** Vite 6 + Tailwind v4, MPA estático, HTML/CSS, mínimo de JS possível
  (zero runtime CSS, zero hidratação — ver `AGENTS.md`).
- **Design system:** [`design-system/`](design-system/readme.md) — tokens CSS
  (`design-system/tokens/`), componentes React-shaped para prototipagem
  (`design-system/components/`), kits navegáveis (`design-system/ui_kits/`).
  Gerado pela skill `boutique-empresarial-design`, a partir do código-fonte real
  (não de screenshot).
- **Ambiente de produção:** <https://boutiqueempresarial.com.br/>
- **Onde ficam as specs de design:** `docs/specs/design/` — dentro da árvore de
  specs que já existe (`docs/specs/`), não uma pasta paralela.

## Diferença importante deste projeto

O `design-system/` usa primitivos **React** (`FormStep`, `ScaleSelect`,
`Button`...) porque é isso que o Claude Design manipula no canvas. A produção
é **HTML/CSS estático** em `src/*.html`. Handoff aqui nunca é "importar o
componente" — é traduzir o primitivo para o padrão HTML/Tailwind já usado nas
páginas existentes, reaproveitando as custom properties de
`design-system/tokens/*.css`. Se um token do design-system divergir de
`src/style.css`, **`src/style.css` é a fonte da verdade** (o próprio
`design-system/readme.md`, seção "Known gaps", já documenta um caso assim).

## O ciclo

### 1. Sincronizar (sempre antes de desenhar)
Rode `/design-sync` na sessão atual antes de qualquer nova rodada — importa o
`design-system/` e a produção real para dentro do Claude Design.

### 2. Spec de intenção
Antes do canvas, escreva/atualize `docs/specs/design/<feature>.md`: objetivo,
restrições vindas do código (página/rota em `src/`, regra de negócio do funil,
contrato de `docs/specs/HARNESS_AEO.md` se a página tiver bloco AEO), critérios
de pronto.

### 3. Editar no Claude Design
Referencie componentes pelo nome real do design system (ver
`design-system/readme.md` §Components) — nunca "um botão", sempre `Button` ou
`ApplyLink`.

### 4. Validar
Peça explicitamente: *"Revise contra `design-system/` e contra os critérios de
`docs/specs/design/<arquivo>.md`, e contra a paleta/tipografia de
`docs/specs/STYLE_GUIDE.md`. Aponte qualquer divergência antes de eu aprovar."*
Desvio de paleta/tipografia exige ADR em `docs/specs/`, não decisão de meio de
tarefa (regra já vigente em `AGENTS.md`).

### 5. Handoff para o Code
No prompt do handoff, deixe explícito:
```
Implemente esta spec (docs/specs/design/<arquivo>.md) traduzindo os
primitivos do design-system para HTML/Tailwind estático em src/ —
sem introduzir React. Reaproveite os tokens de design-system/tokens/
e os padrões já usados em src/*.html. Ao final, liste arquivos alterados
e qualquer divergência entre spec e implementação, com a justificativa.
```

### 6. Implementar
Fluxo normal do repo: `npm run gate` verde é a definição de pronto — não
"parece certo visualmente". Teste em `tests/<nome>.spec.js` se a página for
nova.

### 7. Re-sincronizar e fechar o loop
Depois do merge/deploy, rode `/design-sync` de novo antes da próxima feature.
Marque a spec em `docs/specs/design/` como implementada, com link do PR.

## Regras fixas

1. Nunca gerar HTML/CSS de produção sem ter rodado `/design-sync` na sessão atual.
2. Nunca aprovar um design sem checá-lo contra `design-system/` e contra
   `docs/specs/STYLE_GUIDE.md`.
3. Toda feature de UI relevante tem um arquivo em `docs/specs/design/` — se não
   existir, criar antes de prosseguir.
4. Ao final da implementação, reportar divergências entre spec e código
   explicitamente — não silenciar ajustes "pequenos".
5. Antes de tentar uma direção de design totalmente diferente, pedir para
   salvar o estado atual (Claude Design não versiona automaticamente).

## Comandos de referência

| Onde | Comando/ação | Para quê |
| :-- | :-- | :-- |
| Claude Code | `/design-sync` | Importa `design-system/` e a produção real pro Claude Design |
| Claude Design | Export → Handoff to Claude Code | Envia o design pronto pro Code, com o prompt da seção 5 |
