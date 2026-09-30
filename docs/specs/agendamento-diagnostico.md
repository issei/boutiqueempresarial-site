# Agendamento do Diagnóstico — Spec de intenção

> **Status: SUPERADA (2026-09-29). Não implementar como está.** Este rascunho foi escrito sem acesso ao CRM real e trata a planilha do Apps Script como o CRM. O CRM é o repositório `boutiqueempresarial-crm` (Go, Lambda, Neon), que já tem `data_diagnostico`, a etapa Agendado e o histórico append-only. A spec correta nasce no repositório do CRM (com ADR para cancelar/remarcar e para as rotas públicas). Substituída por `docs/specs/pages/agendar.md` (neste repositório) e pela Spec 017 + ADR 0006 do CRM. **Agentes: não usar este arquivo como fonte.**
> Contexto: `apps_script_atualizado.gs` (backend), `src/admin.html` (CRM), `src/formulario.html` (captação).

## 1. Objetivo

Quando um lead conclui o formulário, ele recebe **na hora** um e-mail com um link pessoal para escolher um horário. A página mostra só dias e horários realmente livres. Ao confirmar, o horário some para os outros, a dona da agenda recebe o convite no Google Calendar (com link do Meet) e o CRM já fica com data e status atualizados. Sem troca de mensagens para combinar horário.

## 2. Decisões já tomadas

| Tema | Decisão |
|---|---|
| Onde o lead agenda | Página própria no site (`src/agendar.html`), mesmo visual do site |
| Onde se configura a disponibilidade | Nova seção "Agenda" no `admin.html` |
| Formato da reunião | Google Meet, link gerado automaticamente |
| Disparo do e-mail | Imediato após o cadastro completo, com lembrete se não agendar em 24h |
| Backend | O mesmo Apps Script e a mesma planilha que já guardam leads e CRM |

## 3. Experiência ponta a ponta

**Lead**
1. Termina o formulário e cai em `obrigada.html` (sem mudança).
2. Em segundos recebe o e-mail "Escolha o melhor horário para o seu Diagnóstico", com um botão único.
3. O botão abre `agendar.html?t=<token>`. A página saúda o lead pelo nome, mostra os próximos dias com vaga e, ao escolher um dia, os horários livres.
4. Confirma. Vê a tela "Agendado para terça, 6 de outubro, às 14h" e recebe o convite do Google com o link do Meet.
5. Se precisar mudar, o mesmo link permite remarcar ou cancelar (libera o horário antigo).

**Dona da agenda**
1. Recebe o convite no Google Calendar dela, com o lead como convidado e o Meet anexado.
2. No CRM, o lead passa a "Agendado", com a data da reunião em "Data Ação".
3. Em "Agenda" no admin, define quando aceita reuniões. Mudanças valem para a próxima consulta de horários, sem republicar nada.

## 4. Como o sistema decide quais horários mostrar

Horário livre = janela configurada − reuniões já agendadas − compromissos do Google Calendar dela.

Parâmetros configuráveis no admin (guardados na aba `Disponibilidade` da planilha, editáveis também à mão):

- Dias da semana atendidos e, para cada um, uma ou mais faixas (ex.: seg a sex, 9h–12h e 14h–18h).
- Duração da reunião (ex.: 45 min) e intervalo entre reuniões (ex.: 15 min).
- Antecedência mínima (ex.: 4 h, para ninguém marcar para daqui a 10 minutos).
- Horizonte máximo (ex.: 21 dias à frente).
- Datas bloqueadas (feriados, viagens).
- Limite de reuniões por dia (opcional).

Fuso: tudo calculado em America/Sao_Paulo e exibido com o fuso explícito na página e no convite.

## 5. Desenho técnico

**Novas ações no `doPost`** (mantêm o padrão atual: POST `text/plain`, dentro do `LockService`, resposta JSON):

- `slots` (público, exige token do lead): devolve os horários livres. Cache curto (~60 s) para não estourar a cota do Calendar.
- `book` (público, exige token): dentro do lock, **recalcula** se o horário ainda está livre, cria o evento e grava. Se alguém pegou antes, responde "horário indisponível" e a página recarrega as opções. O lock que já existe garante que duas pessoas não fiquem com o mesmo horário.
- `cancel` / `reschedule` (público, exige token).
- `get_availability` e `save_availability` (admin, exigem o token de sessão que o painel já usa).

**Evento no Google Calendar**: criado pelo serviço avançado Calendar (`Calendar.Events.insert`) com `conferenceData` para gerar o Meet e `sendUpdates: 'all'`, o que dispara o convite para a dona e para o lead. Título sugerido: "Diagnóstico Boutique Empresarial — {Nome}". Descrição com empresa, desafio principal e WhatsApp do lead.

**Disponibilidade real**: além das reuniões da aba `Agendamentos`, consulta os compromissos da agenda principal dela (free/busy). Assim uma consulta médica marcada por fora já bloqueia o horário.

**Token do lead**: string aleatória longa gerada no cadastro, guardada junto ao `Event ID`. O e-mail do lead nunca vem do navegador; sai da planilha a partir do token. Sem token válido, a página não mostra nada.

**Planilha** (abas novas):

- `Disponibilidade`: os parâmetros da seção 4.
- `Agendamentos`: Event ID, token, início, fim, ID do evento no Calendar, link do Meet, estado (agendado, remarcado, cancelado), criado em.

**CRM**: a aba `CRM` já tem Status, Próxima Ação e Data Ação. Fluxo de status proposto:

| Momento | Status | Data Ação |
|---|---|---|
| Lead cadastra | Novo | vazio |
| E-mail de agendamento enviado | Aguardando agendamento | vazio |
| Lead confirma horário | Agendado | data e hora da reunião |
| Lead cancela | Aguardando agendamento | vazio |
| Lead remarca | Agendado | nova data |

"Próxima Ação" recebe "Reunião de diagnóstico" enquanto estiver agendado. O `admin.html` precisa aceitar os novos valores de status e, de preferência, mostrar a data do agendamento na lista de leads.

**E-mail**: `MailApp`, HTML simples com um botão. Segue o padrão de `notifyNewLead` (efeito colateral: falha no envio nunca invalida o lead salvo). O lembrete de 24h roda por um gatilho de tempo do Apps Script que varre leads "Aguardando agendamento".

**Página `agendar.html`**: MPA estático, JS mínimo, mesmo design system. Deve seguir as regras de `AGENTS.md` para páginas novas (a princípio `noindex` e fora do sitemap, já que o link é pessoal) e passar no `npm run gate`.

## 6. Cuidados e limites

- **Cota de e-mail do Apps Script**: cerca de 100 destinatários por dia em Gmail comum e 1.500 em Google Workspace. Cada lead consome 1 envio (mais o lembrete). Suficiente para o volume atual, mas vale confirmar qual conta é.
- **Novos escopos OAuth** (Calendar, e-mail): exigem autorizar no editor e publicar como **nova versão da implantação existente**, nunca uma implantação nova, porque a URL `/exec` está fixa em `formulario.html` (mesma regra já documentada no cabeçalho do script).
- **Serviço avançado Calendar** precisa ser ativado no projeto do Apps Script.
- **Latência**: Apps Script responde em 1 a 3 s. A página deve mostrar estado de carregamento e nunca prometer o horário antes da confirmação do servidor.
- **LGPD**: o link pessoal expõe só o primeiro nome do lead. Atualizar `privacidade.html` mencionando o uso do e-mail para agendamento e do Google Calendar.
- **Abuso**: `slots` e `book` sem token válido devolvem erro genérico; limitar tentativas por token.

## 7. Fases sugeridas

1. **Backend**: abas novas, cálculo de horários, `slots`, `book`, evento com Meet, atualização do CRM. Funções `testXxx` no estilo das que já existem.
2. **Admin**: seção "Agenda" (parâmetros, datas bloqueadas) e exibição do status/data do agendamento.
3. **Página `agendar.html`**: escolha de dia e horário, confirmação, remarcar e cancelar.
4. **E-mail**: envio imediato no cadastro e lembrete de 24h.
5. **Testes e publicação**: Playwright (fluxo feliz, horário já ocupado, token inválido, mobile), gate, nova versão da implantação.

## 8. Perguntas em aberto

1. Duração da reunião e intervalo entre elas?
2. Quais dias e faixas de horário, e antecedência mínima?
3. A agenda é uma conta Google Workspace ou Gmail comum? Alguém mais entra como convidado além do lead e da dona?
4. O lembrete de 24h deve parar quando o lead agenda, e deve haver um segundo lembrete?
5. Enviar também um lembrete da própria reunião (ex.: 1 dia antes) ao lead?
6. Mostrar o botão de agendar também em `obrigada.html`, além do e-mail? (Custo baixo, aumenta a conversão porque o lead ainda está engajado.)
7. Lead pode remarcar quantas vezes, e até quanto tempo antes da reunião?
