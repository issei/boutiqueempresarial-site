/**
 * Boutique Empresarial — Backend de captação de leads
 * Formulário: "Aplicação — Sessão Estratégica de Análise Operacional"
 *
 * Responsabilidades:
 *   1. Receber o POST (text/plain) de src/formulario.html
 *   2. Gravar o lead na planilha, com proteção contra injeção de fórmula
 *   3. Enviar o evento "Lead" para a Meta Conversions API (server-side)
 *   4. Avisar a equipe por e-mail (docs/specs/notificacao-email-lead.md)
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

/** Ordem canônica das colunas. Alterar aqui exige republicar o Web App. */
const HEADERS = [
  'Data', 'Event ID',
  'Nome Completo', 'E-mail', 'WhatsApp', 'Instagram/Site',
  'Modelo de Negócio', 'Modelo (Outro)',
  'Tamanho da Equipe', 'Faturamento Mensal',
  'Autonomia Operacional', 'Autonomia (Outro)',
  'Maior Problema (Gestão)', 'Problema (Outro)',
  'Prioridade', 'Informações Adicionais', 'Consentimento',
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

/** Health check do endpoint (abrir a /exec no navegador). */
function doGet() {
  return jsonOut({ result: 'ok', service: 'boutique-leads', version: CONFIG.API_VERSION });
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
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
function ensureSheet() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = doc.getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    sheet = doc.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    return sheet;
  }

  const width = Math.max(sheet.getLastColumn(), 1);
  const current = sheet.getRange(1, 1, 1, width).getValues()[0];
  const matches = current.length >= HEADERS.length &&
    HEADERS.every(function (h, i) { return String(current[i]).trim() === h; });

  if (!matches) {
    const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
    sheet.setName(CONFIG.SHEET_NAME + '_legado_' + stamp);
    sheet = doc.insertSheet(CONFIG.SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function saveToSheet(data, capiStatus) {
  const sheet = ensureSheet();

  sheet.appendRow([
    new Date(),
    sanitizeInput(data.event_id),

    sanitizeInput(data.nome_completo),
    sanitizeInput(data.email),
    asText(onlyDigits(data.whatsapp)),
    sanitizeInput(data.instagram_site),

    sanitizeInput(data.modelo_negocio),
    sanitizeInput(data.modelo_negocio_outro),

    sanitizeInput(data.tamanho_equipe),
    sanitizeInput(data.faturamento_mensal),

    sanitizeInput(data.autonomia_operacional),
    sanitizeInput(data.autonomia_operacional_outro),

    // Array serializado com "; " — as próprias opções contêm vírgulas.
    sanitizeInput(data.maior_problema_gestao),
    sanitizeInput(data.maior_problema_gestao_outro),

    sanitizeInput(data.prioridade_resolucao),
    sanitizeInput(data.informacoes_adicionais),
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
    optionalLine('Instagram/site', plainText(data.instagram_site)),
    '',
    'Modelo de negócio: ' + withOther(data.modelo_negocio, data.modelo_negocio_outro),
    'Tamanho da equipe: ' + plainText(data.tamanho_equipe),
    'Faturamento mensal: ' + faturamento,
    'Autonomia operacional: ' + withOther(data.autonomia_operacional, data.autonomia_operacional_outro),
    'Maior problema: ' + withOther(data.maior_problema_gestao, data.maior_problema_gestao_outro),
    'Prioridade: ' + plainText(data.prioridade_resolucao),
    optionalLine('Informações adicionais', plainText(data.informacoes_adicionais)),
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

/** Linha omitida por completo quando o campo opcional veio vazio. */
function optionalLine(label, value) {
  return value ? label + ': ' + value : null;
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
      user_data: userData,
      custom_data: {
        currency: 'BRL',
        value: 0,
        content_name: CONFIG.CONTENT_NAME,
        status: 'submitted',
        lead_faturamento: data.faturamento_mensal || '',
        lead_equipe: data.tamanho_equipe || '',
        lead_prioridade: data.prioridade_resolucao || ''
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
 * serializa arrays — `maior_problema_gestao` chega como lista.
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
    LEAD_NOTIFY_TO: ''      // destino(s) do aviso de novo lead, separados por vírgula
  });
}

/** Cria/valida a aba com o cabeçalho canônico sem gravar nenhum lead. */
function testEnsureSheet() {
  const sheet = ensureSheet();
  console.log('Aba pronta: ' + sheet.getName() + ' (' + sheet.getLastColumn() + ' colunas)');
}

/** Lead fictício com todos os campos do contrato, para os testes manuais. */
function leadFixture() {
  return {
    event_id: 'teste-' + Date.now(),
    nome_completo: 'Fulana de Teste',
    email: 'fulana@exemplo.com.br',
    whatsapp: '(11) 98888-7777',
    instagram_site: '@exemplo',
    modelo_negocio: 'Outro',
    modelo_negocio_outro: 'Consultoria de nicho',
    tamanho_equipe: '4 a 8 pessoas',
    faturamento_mensal: 'De R$ 100 mil a R$ 300 mil',
    autonomia_operacional: 'Depende de mim para quase tudo',
    autonomia_operacional_outro: '',
    maior_problema_gestao: ['Processos indefinidos', 'Equipe sem autonomia'],
    maior_problema_gestao_outro: '',
    prioridade_resolucao: 'Imediata',
    informacoes_adicionais: '',
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
