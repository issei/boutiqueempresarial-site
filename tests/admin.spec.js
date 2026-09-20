import { test, expect } from '@playwright/test';

// O painel fala só com o Apps Script; aqui ele é substituído por respostas
// fixas, então nenhum teste toca a planilha nem a rede real.
const APPS_SCRIPT = 'https://script.google.com/macros/s/**';
const TOKEN = 'T'.repeat(72);

/** Responde cada POST com `reply(payload)` e devolve a lista do que o painel enviou. */
async function mockApi(page, reply) {
    const seen = [];
    await page.route(APPS_SCRIPT, async (route) => {
        const request = route.request();
        const payload = JSON.parse(request.postData() || '{}');
        seen.push({ url: request.url(), payload });
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'access-control-allow-origin': '*' },
            body: JSON.stringify(reply(payload)),
        });
    });
    return seen;
}

async function login(page, senha) {
    await page.goto('/admin.html');
    await page.fill('#pw-input', senha);
    await page.click('#btn-login');
}

test.describe('Painel admin (página interna, não indexada)', () => {
    test('a tela de login pede só a senha', async ({ page }) => {
        await page.goto('/admin.html');
        await expect(page.locator('#pw-input')).toBeVisible();
        await expect(page.locator('#url-input')).toHaveCount(0);
    });

    test('senha errada mostra o erro e mantém o painel fechado', async ({ page }) => {
        await mockApi(page, () => ({ result: 'error', code: 403 }));
        await login(page, 'errada');
        await expect(page.locator('#auth-error')).toHaveText('Senha incorreta.');
        await expect(page.locator('#app')).toBeHidden();
    });

    test('trava por excesso de tentativas avisa o bloqueio', async ({ page }) => {
        await mockApi(page, () => ({ result: 'error', code: 429 }));
        await login(page, 'qualquer');
        await expect(page.locator('#auth-error')).toContainText('Muitas tentativas');
        await expect(page.locator('#app')).toBeHidden();
    });

    test('senha certa abre o painel, e senha e token nunca vão na URL', async ({ page }) => {
        const leads = [{
            'Event ID': 'e1',
            'Data': '2026-09-20T10:00:00',
            'Nome Completo': 'Ana Teste',
            'E-mail': 'ana@example.com',
            'WhatsApp': '11999990000',
            'Faturamento Mensal': 'R$ 50 mil',
            crm_status: 'Novo',
        }];
        const seen = await mockApi(page, (payload) =>
            payload.action === 'login' ? { result: 'ok', token: TOKEN } : { result: 'ok', leads });

        await login(page, 'certa');
        await expect(page.locator('#table-container')).toContainText('Ana Teste');

        // A senha só existe no corpo do login; depois, só o token.
        expect(seen.map((s) => s.payload.action)).toEqual(['login', 'leads']);
        expect(seen[0].payload.pw).toBe('certa');
        expect(seen[1].payload.token).toBe(TOKEN);
        expect(seen[1].payload.pw).toBeUndefined();
        for (const { url } of seen) expect(url).not.toMatch(/[?&](pw|token)=/);
    });
});
