// Pré-visualização local da tela de obrigado, com a API de agendamento simulada.
// Uso: node scripts/preview-obrigada.mjs <pronto|pronto-sem-email|preparando|legado|sem-eid> [--mobile] [--captura]
// Requer `npm run dev` rodando. Vai direto à obrigada: nunca submete o formulário
// nem alcança script.google.com ou a API real (docs/specs/adr-e2e-nao-enviar-formulario-para-producao.md).
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import { bloquearTerceiros, simularApi, ok, erro, SLOTS, RESERVA } from '../tests/fixtures/agendar/mock.js';

const CENARIOS = ['pronto', 'pronto-sem-email', 'preparando', 'legado', 'sem-eid'];
const cenario = process.argv[2];
const mobile = process.argv.includes('--mobile');
const captura = process.argv.includes('--captura');
if (!CENARIOS.includes(cenario)) {
  console.error(`Uso: node scripts/preview-obrigada.mjs <${CENARIOS.join('|')}> [--mobile] [--captura]`);
  process.exit(1);
}

const link = JSON.parse(fs.readFileSync(new URL('../tests/fixtures/agendar/link.json', import.meta.url), 'utf8'));
const BASE = process.env.PREVIEW_URL || 'http://localhost:5173';

const browser = await chromium.launch({ headless: captura });
const context = await browser.newContext({
  viewport: mobile ? { width: 375, height: 812 } : { width: 1280, height: 900 },
  deviceScaleFactor: mobile ? 2 : 1,
});
const page = await context.newPage();

await bloquearTerceiros(page);
await page.route('**/script.google.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"result":"success"}' }));
await simularApi(page, {
  link: {
    pronto: ok(link.pronto),
    'pronto-sem-email': ok(link.prontoSemEmail),
    preparando: () => new Promise(() => {}), // nunca responde: fica em "Preparando"
    legado: erro('agendamento_desligado'), // CRM com o agendamento desligado
    'sem-eid': erro('indisponivel'),
  }[cenario],
  slots: ok(SLOTS.semAgendamento), // o seletor de horários já abre na obrigada
  reservar: ok(RESERVA.reservar.comMeet, 201),
});
await page.addInitScript(() => {
  localStorage.setItem('be_perfil', JSON.stringify({
    eixo: 'retrabalho', segmento: 'agencia', nome: 'Maria',
    time: '5 a 15 colaboradores', faturamento: 'R$ 30 mil a R$ 100 mil/mês',
  }));
});

await page.goto(`${BASE}/obrigada.html${cenario === 'sem-eid' ? '' : '?eid=preview-event-id'}`);

if (captura) {
  const pronto = { pronto: '#agendador .ag-opcao', 'pronto-sem-email': '#agendador .ag-opcao', legado: '#nota-legado:not([hidden])' }[cenario];
  if (pronto) await page.locator(pronto).first().waitFor();
  await page.waitForTimeout(500); // fade de entrada (200 ms) termina antes da captura
  fs.mkdirSync('test-results/preview-obrigada', { recursive: true });
  const arq = `test-results/preview-obrigada/${cenario}-${mobile ? 'mobile' : 'desktop'}.png`;
  await page.screenshot({ path: arq, fullPage: true });
  console.log(arq);
  await browser.close();
} else {
  console.log(`obrigada.html (${cenario}${mobile ? ', 375px' : ''}) aberta. Feche a janela para encerrar.`);
  await new Promise((fim) => browser.on('disconnected', fim));
}
