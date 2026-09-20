/**
 * Boutique Empresarial — Backend de captação de leads
 * Formulário: "Aplicação — Sessão Estratégica de Análise Operacional"
 *
 * Responsabilidades:
 *   1. Receber o POST (text/plain) de src/formulario.html
 *   2. Gravar o lead na planilha, com proteção contra injeção de fórmula
 *   3. Enviar o evento "Lead" para a Meta Conversions API (server-side)
 *   4. Avisar a equipe por e-mail (docs/specs/notificacao-email-lead.md)
 *   5. Guardar a pré-captura do contato na aba "Parciais", sem CAPI e sem
 *      e-mail (docs/specs/design/formulario-envio-parcial.md)
 *
 * ----------------------------------------------------------------------------
 * SETUP OBRIGATÓRIO (uma única vez, antes do primeiro deploy)
 * ----------------------------------------------------------------------------
 * As credenciais NÃO ficam neste arquivo — ele é versionado em Git e um token
 * CAPI é uma credencial de longa duração. Configure em Script Properties:
 *
 *   Editor do Apps Script > Configurações do projeto > Propriedades do script
 *     META_PIXEL_ID     = 1469019395044653
 *     META_ACCESS_TOKEN = <token da Conversions API>
 *     META_TEST_CODE    = <opcional, só durante testes no Events Manager>
 *     ADMIN_PASSWORD    = <frase longa (16+ caracteres) para o painel /admin>
 *
 * Alternativa: rode setupCredentials() uma vez, com os valores preenchidos,
 * e APAGUE os valores do corpo da função em seguida.
 *
 * ----------------------------------------------------------------------------
 * NOTIFICAÇÃO POR E-MAIL (opcional — sem isto, o fluxo é o de sempre)
 * ----------------------------------------------------------------------------
 *     LEAD_NOTIFY_TO             = destino(s) do aviso, separados por vírgula
 *     LEAD_NOTIFY_SUBJECT_PREFIX = <opcional, ex.: [Boutique]>
 *
 * Lidas a cada execução: trocar o destinatário NÃO exige republicar o Web App.
 * Ausentes/vazias, a notificação é pulada em silêncio.
 *
 * ATENÇÃO AO DEPLOY: MailApp introduz um escopo OAuth novo. Rode
 * testNotifyNewLead() uma vez no editor para autorizar e publique em
 * "Gerenciar implantações > editar a implantação existente > Nova versão".
 * Criar uma implantação NOVA geraria outra URL /exec, e a atual está fixa em
 * src/formulario.html.
 * ----------------------------------------------------------------------------
 */

const CONFIG = {
  SHEET_NAME: 'Respostas',
  API_VERSION: 'v21.0',
  LOCK_TIMEOUT_MS: 10000,
  DEFAULT_COUNTRY: 'br',
  CONTENT_NAME: 'Sessão Estratégica de Análise Operacional',
  NOTIFY_CACHE_TTL_S: 21600
};

/**
 * Aba separada da pré-captura (docs/specs/design/formulario-envio-parcial.md).
 * Separada de propósito: `Respostas` continua sendo só aplicação completa, e
 * nenhuma fórmula, filtro ou integração apontada para ela enxerga lead parcial.
 * Só as respostas que já existem quando o contato fica válido — as três últimas
 * perguntas ainda não foram feitas.
 */
const PARTIAL_SHEET_NAME = 'Parciais';
const CRM_SHEET_NAME = 'CRM';
const CRM_HEADERS = ['Event ID', 'Status', 'Notas', 'Próxima Ação', 'Data Ação', 'Atualizado em'];

/**
 * Sessão do painel /admin: a senha só entra no login; depois vale um token no cache.
 * ponytail: o contador de erros é GLOBAL (o Apps Script não expõe o IP), então 5 erros
 * bloqueiam o login até para a dona por 15 min. CacheService evicta sem garantia: token
 * perdido = novo login; contador perdido = a trava zera (best-effort).
 */
const ADMIN_MAX_FAILS = 5;
const ADMIN_LOCK_S = 900;         // 15 min
const ADMIN_TOKEN_TTL_S = 21600;  // 6 h, teto do CacheService
const PARTIAL_HEADERS = [
  'Data', 'Event ID',
  'Nome Completo', 'E-mail', 'WhatsApp',
  'Maior Desafio (Equipe)', 'Maior Desafio (Outro)',
  'utm_source', 'utm_medium', 'utm_campaign',
  'Página', 'Referrer'
];

/** Ordem canônica das colunas. Alterar aqui exige republicar o Web App. */
const HEADERS = [
  'Data', 'Event ID',
  'Nome Completo', 'E-mail', 'WhatsApp',
  'Modelo de Negócio', 'Modelo (Outro)',
  'Tamanho da Equipe', 'Faturamento Mensal',
  'Maior Desafio (Equipe)', 'Maior Desafio (Outro)',
  'Consentimento',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'FBCLID', 'GCLID', 'FBC', 'FBP',
  'Página', 'Referrer', 'IP', 'User Agent', 'Status CAPI'
];

/* ========================================================================== */
/* ENTRADA                                                                    */
/* ========================================================================== */

function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(CONFIG.LOCK_TIMEOUT_MS)) {
    return jsonOut({ result: 'error', error: 'Server Busy' });
  }
  try {
    const data = JSON.parse(e.postData.contents);

    // Painel admin. Fica dentro do lock para o contador de tentativas ser atômico.
    if (data.action === 'login') return adminLogin(data);
    if (data.action === 'logout') {
      const key = tokenKey(data.token);
      if (key) CacheService.getScriptCache().remove(key);
      return jsonOut({ result: 'ok' });
    }
    if (data.action === 'leads') {
      if (!checkToken(data)) return jsonOut({ result: 'error', code: 403 });
      // ponytail: leitura sob o lock (poucas centenas de ms); se a planilha crescer e
      // atrasar o formulário, mover para antes do lock.
      return jsonOut({ result: 'ok', leads: getAllLeads() });
    }
    if (data.action === 'update_crm') {
      if (!checkToken(data)) return jsonOut({ result: 'error', code: 403 });
      upsertCrm(data);
      return jsonOut({ result: 'ok' });
    }

    // Pré-captura: sai daqui sem CAPI e sem e-mail. Um "Lead" server-side antes
    // da qualificação passaria a otimizar a campanha para "deu o contato", e o
    // aviso interno de um lead que ainda está preenchendo é ruído.
    if (data.parcial === true) return savePartialLead(data);

    // O CAPI roda antes da gravação apenas para que seu status entre na mesma
    // linha; qualquer falha dele é capturada e nunca impede o registro do lead.
    let capiStatus = 'não enviado (sem consentimento)';
    if (data.consentimento === true || data.consentimento === 'Sim') {
      try {
        capiStatus = sendToMetaCAPI(data);
      } catch (capiError) {
        capiStatus = 'erro: ' + capiError;
        console.error('Erro CAPI', capiError);
      }
    }

    saveToSheet(data, capiStatus);

    // A pré-captura deste lead já não faz sentido: só a aplicação completa fica.
    // Efeito colateral — falhar aqui nunca pode transformar um lead salvo em erro.
    try {
      deletePartialLead(data);
    } catch (cleanError) {
      console.error('Erro ao limpar parcial', cleanError);
    }

    // Marca o lead como concluído para que uma pré-captura atrasada (rede lenta,
    // cold start) não grave em `Parciais` alguém que já aplicou.
    const doneId = String(data.event_id || '');
    if (doneId) {
      try {
        CacheService.getScriptCache().put('done_' + doneId, '1', CONFIG.NOTIFY_CACHE_TTL_S);
      } catch (cacheError) {
        console.error('Erro ao marcar lead concluído', cacheError);
      }
    }

    // O aviso é efeito colateral: o lead já está salvo. Qualquer falha aqui é
    // registrada e descartada — nunca transforma um registro válido em erro.
    try {
      notifyNewLead(data, capiStatus);
    } catch (mailError) {
      console.error('Erro notificação', mailError);
    }

    return jsonOut({ result: 'success', event_id: data.event_id || '' });
  } catch (ex) {
    console.error('Erro doPost', ex);
    return jsonOut({ result: 'error', error: ex.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Health check. O painel admin não usa GET: credencial em URL vaza em log, então
 * login, leads e CRM entram todos por doPost.
 */
function doGet() {
  return jsonOut({ result: 'ok', service: 'boutique-leads', version: CONFIG.API_VERSION });
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ========================================================================== */
/* PAINEL ADMIN / CRM                                                         */
/* ========================================================================== */

/** Troca a senha por um token de sessão. Após ADMIN_MAX_FAILS erros, recusa até a senha certa. */
function adminLogin(data) {
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('admin_fails') || 0);
  if (fails >= ADMIN_MAX_FAILS) return jsonOut({ result: 'error', code: 429 });

  var expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD') || '';
  if (!expected || String(data.pw || '') !== expected) {
    cache.put('admin_fails', String(fails + 1), ADMIN_LOCK_S);
    return jsonOut({ result: 'error', code: 403 });
  }

  cache.remove('admin_fails');
  var token = Utilities.getUuid() + Utilities.getUuid();
  cache.put(tokenKey(token), '1', ADMIN_TOKEN_TTL_S);
  return jsonOut({ result: 'ok', token: token });
}

/** Chave do token no cache, ou '' se o formato não for o emitido (2 UUIDs = 72 chars). */
function tokenKey(token) {
  token = String(token || '');
  return token.length === 72 ? 'admin_tok_' + token : '';
}

function checkToken(data) {
  var key = tokenKey(data.token);
  return !!key && CacheService.getScriptCache().get(key) === '1';
}

/** Todos os leads da aba Respostas, enriquecidos com dados da aba CRM. */
function getAllLeads() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
  var crm = getCrmData();
  var tz = Session.getScriptTimeZone();

  return rows.map(function(row) {
    var obj = {};
    HEADERS.forEach(function(h, i) { obj[h] = row[i]; });
    if (obj['Data'] instanceof Date) {
      obj['Data'] = Utilities.formatDate(obj['Data'], tz, "yyyy-MM-dd'T'HH:mm:ss");
    }
    var eventId = String(obj['Event ID'] || '');
    var crmRow = crm[eventId] || {};
    obj['crm_status'] = crmRow.status || 'Novo';
    obj['crm_notas'] = crmRow.notas || '';
    obj['crm_proxima_acao'] = crmRow.proxima_acao || '';
    obj['crm_data_acao'] = crmRow.data_acao || '';
    return obj;
  }).reverse(); // mais recentes primeiro
}

/** Map de event_id → dados CRM. */
function getCrmData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CRM_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return {};

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, CRM_HEADERS.length).getValues();
  var map = {};
  rows.forEach(function(row) {
    var id = String(row[0]);
    if (id) map[id] = { status: row[1], notas: row[2], proxima_acao: row[3], data_acao: row[4] };
  });
  return map;
}

/** Atualiza a linha de CRM existente ou insere uma nova. */
function upsertCrm(data) {
  var sheet = ensureSheet(CRM_SHEET_NAME, CRM_HEADERS);
  var eventId = String(data.event_id || '');
  if (!eventId) return;

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === eventId) {
        sheet.getRange(i + 2, 2, 1, 5).setValues([[
          sanitizeInput(data.status), sanitizeInput(data.notas),
          sanitizeInput(data.proxima_acao), sanitizeInput(data.data_acao),
          new Date()
        ]]);
        return;
      }
    }
  }

  sheet.appendRow([
    eventId,
    sanitizeInput(data.status), sanitizeInput(data.notas),
    sanitizeInput(data.proxima_acao), sanitizeInput(data.data_acao),
    new Date()
  ]);
}

/* ========================================================================== */
/* PLANILHA                                                                   */
/* ========================================================================== */

/**
 * Garante uma aba com o cabeçalho canônico.
 * Se a aba existir com cabeçalho divergente (esquema do formulário antigo),
 * ela é ARQUIVADA por renomeação — nunca apagada — e uma nova é criada.
 * Sem isso, as linhas novas entrariam desalinhadas sob os títulos antigos.
 */
function ensureSheet(name, headers) {
  // Sem argumentos = aba de leads completos. Chamadores antigos seguem válidos.
  name = name || CONFIG.SHEET_NAME;
  headers = headers || HEADERS;

  const doc = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = doc.getSheetByName(name);

  if (!sheet) {
    sheet = doc.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    return sheet;
  }

  const width = Math.max(sheet.getLastColumn(), 1);
  const current = sheet.getRange(1, 1, 1, width).getValues()[0];
  const matches = current.length >= headers.length &&
    headers.every(function (h, i) { return String(current[i]).trim() === h; });

  if (!matches) {
    const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
    sheet.setName(name + '_legado_' + stamp);
    sheet = doc.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/**
 * Grava a pré-captura e devolve o mesmo formato de resposta do caminho completo.
 * Roda dentro do lock do doPost, como todo o resto.
 *
 * Duas guardas, ambas por event_id e ambas best-effort (CacheService evicta sem
 * garantia — ver a nota de notifyNewLead):
 *   done_<id>    — o lead já aplicou; a linha parcial seria ruído.
 *   partial_<id> — já gravamos a pré-captura desta sessão; não duplicar.
 * Sem event_id as duas ficam desligadas: falta de chave não pode custar o lead.
 */
function savePartialLead(data) {
  const eventId = String(data.event_id || '');
  const cache = CacheService.getScriptCache();

  if (eventId) {
    if (cache.get('done_' + eventId)) {
      console.log('Lead ' + eventId + ' já concluiu — pré-captura descartada.');
      return jsonOut({ result: 'success', parcial: true, skipped: 'concluido', event_id: eventId });
    }
    if (cache.get('partial_' + eventId)) {
      console.log('Pré-captura de ' + eventId + ' já gravada — pulando.');
      return jsonOut({ result: 'success', parcial: true, skipped: 'duplicado', event_id: eventId });
    }
  }

  ensureSheet(PARTIAL_SHEET_NAME, PARTIAL_HEADERS).appendRow([
    new Date(),
    sanitizeInput(data.event_id),

    sanitizeInput(data.nome_completo),
    sanitizeInput(data.email),
    asText(onlyDigits(data.whatsapp)),

    sanitizeInput(data.maior_problema_gestao),
    sanitizeInput(data.maior_problema_gestao_outro),

    sanitizeInput(data.utm_source),
    sanitizeInput(data.utm_medium),
    sanitizeInput(data.utm_campaign),

    sanitizeInput(data.page_url),
    sanitizeInput(data.referrer)
  ]);

  if (eventId) cache.put('partial_' + eventId, '1', CONFIG.NOTIFY_CACHE_TTL_S);
  return jsonOut({ result: 'success', parcial: true, event_id: eventId });
}

/**
 * Apaga de `Parciais` as linhas do lead que acabou de concluir, para não duplicar
 * com `Respostas`. Casa por event_id OU e-mail: quem recarregou a página no meio
 * do formulário gerou outro event_id, mas o e-mail é o mesmo.
 * Roda dentro do lock do doPost.
 */
function deletePartialLead(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PARTIAL_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return;

  const eventId = String(data.event_id || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  if (!eventId && !email) return;

  // Colunas 2..4 = Event ID, Nome, E-mail (ver PARTIAL_HEADERS).
  const rows = sheet.getRange(2, 2, sheet.getLastRow() - 1, 3).getValues();
  for (let i = rows.length - 1; i >= 0; i--) { // de baixo para cima: deleteRow desloca o resto
    const rowId = String(rows[i][0]).trim();
    const rowEmail = String(rows[i][2]).trim().toLowerCase();
    if ((eventId && rowId === eventId) || (email && rowEmail === email)) {
      sheet.deleteRow(i + 2);
    }
  }
}

function saveToSheet(data, capiStatus) {
  const sheet = ensureSheet();

  sheet.appendRow([
    new Date(),
    sanitizeInput(data.event_id),

    sanitizeInput(data.nome_completo),
    sanitizeInput(data.email),
    asText(onlyDigits(data.whatsapp)),

    sanitizeInput(data.modelo_negocio),
    sanitizeInput(data.modelo_negocio_outro),

    sanitizeInput(data.tamanho_equipe),
    sanitizeInput(data.faturamento_mensal),

    sanitizeInput(data.maior_problema_gestao),
    sanitizeInput(data.maior_problema_gestao_outro),

    (data.consentimento === true || data.consentimento === 'Sim') ? 'Sim' : 'Não',

    sanitizeInput(data.utm_source),
    sanitizeInput(data.utm_medium),
    sanitizeInput(data.utm_campaign),
    sanitizeInput(data.utm_content),
    sanitizeInput(data.utm_term),

    sanitizeInput(data.fbclid),
    sanitizeInput(data.gclid),
    sanitizeInput(data.fbc),
    sanitizeInput(data.fbp),

    sanitizeInput(data.page_url),
    sanitizeInput(data.referrer),
    sanitizeInput(data.ip_address),
    sanitizeInput(data.user_agent),
    sanitizeInput(capiStatus)
  ]);
}

/* ========================================================================== */
/* NOTIFICAÇÃO POR E-MAIL                                                     */
/* ========================================================================== */

/**
 * Aviso interno de novo lead, chamado por doPost DEPOIS de saveToSheet.
 * Sem LEAD_NOTIFY_TO configurada não faz nada — ausência de destinatário é
 * configuração, não erro.
 */
function notifyNewLead(data, capiStatus) {
  const props = PropertiesService.getScriptProperties();
  const to = String(props.getProperty('LEAD_NOTIFY_TO') || '')
    .split(',')
    .map(function (address) { return address.trim(); })
    .filter(String)
    .join(',');
  if (!to) return;

  // Guarda contra aviso duplicado: um reenvio manual após falha de rede repete
  // o mesmo event_id (a página não recarregou). Gravada ANTES do envio — assim
  // uma falha do MailApp custa um aviso perdido, e não um aviso repetido a cada
  // erro transitório. Sem event_id a guarda fica desligada: falta de chave
  // nunca pode ser motivo para não notificar.
  // ponytail: CacheService evicta sem garantia, então a proteção é best-effort.
  // Chave persistente só se avisos duplicados virarem problema real.
  const eventId = String(data.event_id || '');
  if (eventId) {
    const cache = CacheService.getScriptCache();
    if (cache.get('notify_' + eventId)) {
      console.log('Notificação já enviada para ' + eventId + ' — pulando.');
      return;
    }
    cache.put('notify_' + eventId, '1', CONFIG.NOTIFY_CACHE_TTL_S);
  }

  const mail = buildLeadEmail(data, capiStatus);
  MailApp.sendEmail(to, mail.subject, mail.body);
}

/**
 * Monta assunto e corpo em texto puro. Sem efeito colateral: pode rodar no
 * editor quantas vezes quiser sem consumir quota de e-mail.
 *
 * Texto puro é deliberado — campos livres do lead entram sem escaping algum.
 * Migrar para htmlBody exige escapar TODOS os valores vindos de `data`.
 */
function buildLeadEmail(data, capiStatus) {
  const prefix = String(
    PropertiesService.getScriptProperties().getProperty('LEAD_NOTIFY_SUBJECT_PREFIX') || ''
  ).trim();

  const nome = plainText(data.nome_completo);
  const faturamento = plainText(data.faturamento_mensal);
  const subject = (prefix ? prefix + ' ' : '') +
    'Novo lead — ' + (nome || 'sem nome') +
    (faturamento ? ' (' + faturamento + ')' : '');

  const origem = [
    plainText(data.utm_source), plainText(data.utm_medium), plainText(data.utm_campaign)
  ].filter(String).join(' / ');

  const body = [
    'Recebido em: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm'),
    '',
    'Nome: ' + nome,
    'E-mail: ' + plainText(data.email),
    'WhatsApp: ' + plainText(data.whatsapp),
    '',
    'Modelo de negócio: ' + withOther(data.modelo_negocio, data.modelo_negocio_outro),
    'Tamanho da equipe: ' + plainText(data.tamanho_equipe),
    'Faturamento mensal: ' + faturamento,
    'Maior desafio: ' + withOther(data.maior_problema_gestao, data.maior_problema_gestao_outro),
    '',
    // Mesma regra de saveToSheet, repetida em vez de extraída: unificar exigiria
    // tocar no caminho de gravação, que esta mudança se comprometeu a não alterar.
    'Consentimento: ' + ((data.consentimento === true || data.consentimento === 'Sim') ? 'Sim' : 'Não'),
    'Origem: ' + (origem || '—'),
    'Página: ' + plainText(data.page_url),
    'Status CAPI: ' + plainText(capiStatus),
    'ID do evento: ' + plainText(data.event_id)
  ].filter(function (line) { return line !== null; }).join('\n');

  return { subject: subject, body: body };
}

/**
 * Valor cru, para leitura humana. NÃO usa sanitizeInput(): o apóstrofo que ele
 * prefixa é artefato do Sheets e no e-mail apareceria como "'=Fulano".
 */
function plainText(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value.map(function (item) { return plainText(item); }).filter(String).join('; ');
  }
  return String(value).trim();
}

/** "Opção" ou "Opção — texto do campo Outro". */
function withOther(value, other) {
  const base = plainText(value);
  const extra = plainText(other);
  if (base && extra) return base + ' — ' + extra;
  return base || extra;
}

/* ========================================================================== */
/* META CONVERSIONS API                                                       */
/* ========================================================================== */

function sendToMetaCAPI(data) {
  const props = PropertiesService.getScriptProperties();
  const pixelId = props.getProperty('META_PIXEL_ID');
  const accessToken = props.getProperty('META_ACCESS_TOKEN');
  const testCode = props.getProperty('META_TEST_CODE');

  if (!pixelId || !accessToken) {
    throw new Error('META_PIXEL_ID/META_ACCESS_TOKEN ausentes nas Script Properties.');
  }

  const timestamp = Math.floor(new Date().getTime() / 1000);

  // Chaves congeladas do contrato: `whatsapp` e `email` alimentam ph/em.
  let rawPhone = onlyDigits(data.whatsapp);
  if (rawPhone.length >= 10 && rawPhone.length <= 11) rawPhone = '55' + rawPhone;
  const rawEmail = String(data.email || '').trim().toLowerCase();

  const userData = {};
  if (rawEmail) userData.em = [hashSHA256(rawEmail)];
  if (rawPhone) userData.ph = [hashSHA256(rawPhone)];

  // Enriquecimento para elevar o Event Match Quality.
  const parts = String(data.nome_completo || '').trim().toLowerCase().split(/\s+/).filter(String);
  if (parts.length) {
    userData.fn = [hashSHA256(parts[0])];
    if (parts.length > 1) userData.ln = [hashSHA256(parts[parts.length - 1])];
  }
  userData.country = [hashSHA256(CONFIG.DEFAULT_COUNTRY)];
  if (data.event_id) userData.external_id = [hashSHA256(String(data.event_id))];

  if (data.ip_address) userData.client_ip_address = data.ip_address;
  if (data.user_agent) userData.client_user_agent = data.user_agent;
  if (data.fbc) userData.fbc = data.fbc;
  if (data.fbp) userData.fbp = data.fbp;

  const payload = {
    data: [{
      event_name: 'Lead',
      event_time: timestamp,
      event_id: data.event_id,          // deduplicação com o Pixel do navegador
      event_source_url: data.page_url,
      action_source: 'website',
      // LDU espelhando o Pixel do navegador (fbq dataProcessingOptions ['LDU'], 1, 1000):
      // o mesmo evento não pode ter tratamento diferente por canal.
      data_processing_options: ['LDU'],
      data_processing_options_country: 1,
      data_processing_options_state: 1000,
      user_data: userData,
      custom_data: {
        currency: 'BRL',
        value: 0,
        content_name: CONFIG.CONTENT_NAME,
        status: 'submitted',
        lead_faturamento: data.faturamento_mensal || '',
        lead_equipe: data.tamanho_equipe || ''
      }
    }]
  };
  if (testCode) payload.test_event_code = testCode;

  const url = 'https://graph.facebook.com/' + CONFIG.API_VERSION + '/' + pixelId +
    '/events?access_token=' + encodeURIComponent(accessToken);

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    console.error('CAPI HTTP ' + code + ': ' + response.getContentText());
    return 'erro HTTP ' + code;
  }
  return 'enviado (' + code + ')';
}

/* ========================================================================== */
/* UTILITÁRIOS                                                                */
/* ========================================================================== */

/**
 * Neutraliza injeção de fórmula no Sheets (CSV/formula injection) e
 * serializa arrays, caso algum campo chegue como lista.
 */
function sanitizeInput(input) {
  if (input === null || input === undefined || input === '') return '';

  if (Array.isArray(input)) {
    return input.map(function (v) { return sanitizeInput(v); }).join('; ');
  }
  if (typeof input === 'boolean') return input ? 'Sim' : 'Não';

  const str = String(input).replace(/[\r\t]/g, ' ');
  if (/^[=+\-@]/.test(str)) return "'" + str;
  return str;
}

/** Força o Sheets a tratar o valor como texto (preserva o zero do DDD). */
function asText(value) {
  return value ? "'" + value : '';
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function hashSHA256(input) {
  if (!input) return null;
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  let txtHash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let hashVal = rawHash[i];
    if (hashVal < 0) hashVal += 256;
    if (hashVal.toString(16).length == 1) txtHash += '0';
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}

/* ========================================================================== */
/* SETUP / DIAGNÓSTICO — rodar manualmente no editor                          */
/* ========================================================================== */

/** Preencha, execute UMA vez, e limpe os valores antes de commitar. */
function setupCredentials() {
  PropertiesService.getScriptProperties().setProperties({
    META_PIXEL_ID: '',      // ex.: 1469019395044653
    META_ACCESS_TOKEN: '',  // token da Conversions API
    LEAD_NOTIFY_TO: '',     // destino(s) do aviso de novo lead, separados por vírgula
    ADMIN_PASSWORD: ''      // frase longa (16+ caracteres) do painel /admin
  });
}

/** Cria/valida as abas com o cabeçalho canônico sem gravar nenhum lead. */
function testEnsureSheet() {
  [ensureSheet(), ensureSheet(PARTIAL_SHEET_NAME, PARTIAL_HEADERS)].forEach(function (sheet) {
    console.log('Aba pronta: ' + sheet.getName() + ' (' + sheet.getLastColumn() + ' colunas)');
  });
}

/**
 * Grava uma pré-captura de teste em "Parciais". Confirma o caminho curto:
 * nenhuma linha em "Respostas", nenhum e-mail, nenhuma chamada ao CAPI.
 */
function testSavePartialLead() {
  const fixture = leadFixture();
  fixture.parcial = true;
  fixture.event_id = 'parcial-teste-' + Date.now();
  console.log(savePartialLead(fixture).getContent());
}

/**
 * Confirma a limpeza: grava dois parciais (mesmo e-mail, event_ids diferentes),
 * conclui com um deles e espera que nenhum sobre em "Parciais".
 */
function testDeletePartialLead() {
  const base = leadFixture();
  base.parcial = true;
  base.email = 'limpeza-' + Date.now() + '@exemplo.com.br';
  const a = Object.assign({}, base, { event_id: 'parcial-a-' + Date.now() });
  const b = Object.assign({}, base, { event_id: 'parcial-b-' + Date.now() });
  savePartialLead(a);
  savePartialLead(b);

  const sheet = ensureSheet(PARTIAL_SHEET_NAME, PARTIAL_HEADERS);
  const count = function () {
    return sheet.getLastRow() < 2 ? 0 : sheet.getRange(2, 4, sheet.getLastRow() - 1, 1).getValues()
      .filter(function (r) { return String(r[0]).toLowerCase() === base.email; }).length;
  };
  console.log('Antes: ' + count() + ' (esperado 2)');
  deletePartialLead(a);
  console.log('Depois: ' + count() + ' (esperado 0)');
}

/** Lead fictício com todos os campos do contrato, para os testes manuais. */
function leadFixture() {
  return {
    event_id: 'teste-' + Date.now(),
    nome_completo: 'Fulana de Teste',
    email: 'fulana@exemplo.com.br',
    whatsapp: '(11) 98888-7777',
    modelo_negocio: 'Outro',
    modelo_negocio_outro: 'Consultoria de nicho',
    tamanho_equipe: '5 a 15',
    faturamento_mensal: 'R$ 100k a R$ 300k',
    maior_problema_gestao: 'Falta de padrão nas entregas e retrabalho',
    maior_problema_gestao_outro: '',
    consentimento: true,
    utm_source: 'instagram',
    utm_medium: 'cpc',
    utm_campaign: 'teste',
    page_url: 'https://exemplo.com.br/formulario.html'
  };
}

/** Mostra o e-mail que SERIA enviado. Não envia nada, não consome quota. */
function testBuildLeadEmail() {
  const mail = buildLeadEmail(leadFixture(), 'enviado (200)');
  console.log(mail.subject);
  console.log('---');
  console.log(mail.body);
}

/**
 * Envia um aviso de teste para LEAD_NOTIFY_TO. Rode UMA vez no editor antes do
 * deploy: é o que dispara o consentimento do escopo de e-mail.
 */
function testNotifyNewLead() {
  const to = PropertiesService.getScriptProperties().getProperty('LEAD_NOTIFY_TO');
  if (!to) {
    console.log('LEAD_NOTIFY_TO não configurada — a notificação está desligada.');
    return;
  }
  notifyNewLead(leadFixture(), 'enviado (200)');
  console.log('Aviso de teste enviado para: ' + to);
  console.log('Cota restante hoje: ' + MailApp.getRemainingDailyQuota());
}
