import { test, expect } from '@playwright/test';

// Página de venda do diagnóstico — docs/specs/pages/diagnostico.md §4 e §6.
const CTA = 'Quero descobrir o que parar de aprovar';
const FIXA = 'Quero descobrir · R$ 197';
const COM_MICRO = ['topo', 'para-quem', 'recebe', 'caminhos', 'ps'];
const MICRO = 'R$ 197 · resultado completo em até 2 dias úteis · garantia de 7 dias';
const POSICOES = ['topo', 'para-quem', 'recebe', 'caminhos', 'oferta', 'ps', 'fixa'];
const CHECKOUT = 'https://pay.hotmart.com/TESTE';

const ctas = (page) =>
    page.locator('a[data-checkout]').evaluateAll((els) =>
        els.map((e) => ({ src: e.dataset.checkout, texto: e.textContent.trim(), url: new URL(e.href) }))
            .map((c) => ({ ...c, base: c.url.origin + c.url.pathname, q: Object.fromEntries(c.url.searchParams) })),
    );

// O link real ainda não existe: o teste serve a página com a constante preenchida.
const comCheckout = (page) =>
    page.route('**/diagnostico.html*', async (route) => {
        const res = await route.fetch();
        const html = (await res.text()).replace("const CHECKOUT = '';", `const CHECKOUT = '${CHECKOUT}';`);
        await route.fulfill({ response: res, body: html });
    });

test.describe('diagnostico', () => {
    test('sete CTAs com o mesmo rótulo (a barra fixa tem o seu), microtexto nos cinco da página', async ({ page }) => {
        await page.goto('/diagnostico.html');
        const lista = await ctas(page);
        expect(lista.map((c) => c.src)).toEqual(POSICOES);
        for (const c of lista) expect(c.texto).toBe(c.src === 'fixa' ? FIXA : CTA);
        const micros = await page.locator('.micro').allTextContents();
        expect(micros).toEqual(COM_MICRO.map(() => MICRO));
    });

    test('sem link de saída além do checkout, da página do gerente e dos documentos legais', async ({ page }) => {
        await page.goto('/diagnostico.html');
        const hrefs = await page.locator('main a[href]:not([data-checkout]), footer a[href]')
            .evaluateAll((els) => els.map((e) => e.getAttribute('href')));
        expect(hrefs.sort()).toEqual(['/diagnostico-gerente.html', '/privacidade.html', '/termos.html']);
    });

    test('sem link configurado, o CTA leva à oferta, sem rastreio', async ({ page }) => {
        await page.goto('/diagnostico.html?utm_source=meta');
        const hrefs = await page.locator('a[data-checkout]').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
        expect(hrefs).toEqual(POSICOES.map(() => '#oferta'));
    });

    test('UTMs da URL seguem para o checkout, com src e sck', async ({ page }) => {
        await comCheckout(page);
        await page.goto('/diagnostico.html?utm_source=meta&utm_medium=cpc&utm_campaign=c1&utm_content=a&fbclid=F');
        for (const { src, base, q } of await ctas(page)) {
            expect(base).toBe(CHECKOUT);
            expect(q).toMatchObject({ utm_source: 'meta', utm_content: 'a', fbclid: 'F', src, sck: 'meta|cpc|c1|a|' });
        }
    });

    test('sem UTM na URL, usa o último toque do cookie be_attr', async ({ page, context, baseURL }) => {
        const attr = { last: { utm_source: 'google', utm_campaign: 'c2' } };
        await context.addCookies([{ name: 'be_attr', value: encodeURIComponent(JSON.stringify(attr)), url: baseURL }]);
        await comCheckout(page);
        await page.goto('/diagnostico.html');
        const [{ q }] = await ctas(page);
        expect(q).toMatchObject({ utm_source: 'google', sck: 'google||c2||' });
    });

    test('visita direta: só src, sem sck', async ({ page }) => {
        await comCheckout(page);
        await page.goto('/diagnostico.html');
        const [{ q }] = await ctas(page);
        expect(q).toEqual({ src: 'topo' });
    });

    test('Pixel: ViewContent no carregamento, InitiateCheckout no clique', async ({ page }) => {
        // Um fbq já definido faz o snippet do Pixel sair cedo: o stub grava as chamadas.
        await page.addInitScript(() => {
            window.fbq = (...a) => (window.__fbq ||= []).push(a);
        });
        await page.goto('/diagnostico.html');
        await page.locator('a[data-checkout="topo"]').click();
        const eventos = await page.evaluate(() => window.__fbq.filter((a) => a[0] === 'track').map((a) => a[1]));
        expect(eventos).toEqual(['PageView', 'ViewContent', 'InitiateCheckout']);
    });

    test('barra fixa no celular só aparece depois do topo', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/diagnostico.html');
        const barra = page.locator('.cta-fixa');
        await expect(barra).toBeHidden();
        await page.locator('.soltar').scrollIntoViewIfNeeded();
        await expect(barra).toBeVisible();
    });

    test('barra fixa some enquanto outro botão ou a oferta estão na tela', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/diagnostico.html');
        const barra = page.locator('.cta-fixa');
        await page.locator('.soltar').scrollIntoViewIfNeeded();
        await expect(barra).toBeVisible();
        await page.locator('a[data-checkout="recebe"]').scrollIntoViewIfNeeded();
        await expect(barra).toBeHidden();
        await page.locator('#oferta').scrollIntoViewIfNeeded();
        await expect(barra).toBeHidden();
    });

    test('checklist marca ao tocar e a página não tem marcador [X]', async ({ page }) => {
        await page.goto('/diagnostico.html');
        const item = page.locator('.checklist label').first();
        await item.click();
        await expect(item.locator('input')).toBeChecked();
        expect(await page.locator('main').innerText()).not.toContain('[X]');
    });
});
