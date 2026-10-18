import { test, expect } from '@playwright/test';

// Página de venda do diagnóstico, versão do gerente — docs/specs/pages/diagnostico-gerente.md §4 a §6.
// Mesmas regras de CTA e rastreio da página do dono (tests/diagnostico.spec.js).
const URL = '/diagnostico-gerente.html';
const CTA = 'Quero descobrir o que parar de aprovar';
const MICRO = 'R$ 197 · resultado completo em até 2 dias úteis · garantia de 7 dias';
const POSICOES = ['topo', 'para-quem', 'recebe', 'caminhos', 'oferta', 'ps', 'fixa'];
const CHECKOUT = 'https://pay.hotmart.com/TESTE';

const ctas = (page) =>
    page.locator('a[data-checkout]').evaluateAll((els) =>
        els.map((e) => ({ src: e.dataset.checkout, texto: e.textContent.trim(), url: new URL(e.href) }))
            .map((c) => ({ ...c, base: c.url.origin + c.url.pathname, q: Object.fromEntries(c.url.searchParams) })),
    );

const comCheckout = (page) =>
    page.route('**/diagnostico-gerente.html*', async (route) => {
        const res = await route.fetch();
        const html = (await res.text()).replace("const CHECKOUT = '';", `const CHECKOUT = '${CHECKOUT}';`);
        await route.fulfill({ response: res, body: html });
    });

test.describe('diagnostico-gerente', () => {
    // As suítes por glob isentam página noindex; nada mais cobraria que ela CONTINUE fora da busca.
    test('fora da busca: noindex, sem canonical, companion nem JSON-LD; OG próprio', async ({ page }) => {
        await page.goto(URL);
        const head = await page.evaluate(() => ({
            robots: document.querySelector('meta[name="robots"]')?.content ?? '',
            canonical: !!document.querySelector('link[rel="canonical"]'),
            markdown: !!document.querySelector('link[rel="alternate"][type="text/markdown"]'),
            jsonld: !!document.querySelector('script[type="application/ld+json"]'),
            ogUrl: document.querySelector('meta[property="og:url"]')?.content,
        }));
        expect(head).toEqual({
            robots: 'noindex, follow', canonical: false, markdown: false, jsonld: false,
            ogUrl: 'https://boutiqueempresarial.com.br/diagnostico-gerente',
        });
    });

    test('copy do gerente nos blocos trocados', async ({ page }) => {
        await page.goto(URL);
        await expect(page.locator('.topo .rotulo')).toHaveText('PARA GERENTES QUE VIRARAM O PONTO POR ONDE TUDO PASSA');
        await expect(page.locator('h1')).toContainText('no seu time sem perder o controle do resultado que cobram de você.');
        await expect(page.locator('.oferta')).toContainText('Se você entrar na mentoria para gerentes depois, esse valor é descontado.');
        const perguntas = await page.locator('.faq summary').allTextContents();
        expect(perguntas).toContain('Preciso envolver o meu chefe?');
        expect(perguntas).toContain('A empresa pode pagar?');
        expect(perguntas).not.toContain('Eu sou gerente, não dono. Serve para mim?');
        expect(perguntas).not.toContain('Meu sócio pode participar?');
    });

    test('sete CTAs, mesmo rótulo, microtexto embaixo de cada um', async ({ page }) => {
        await page.goto(URL);
        const lista = await ctas(page);
        expect(lista.map((c) => c.src)).toEqual(POSICOES);
        for (const c of lista) expect(c.texto).toBe(CTA);
        expect(await page.locator('.micro').allTextContents()).toEqual(POSICOES.map(() => MICRO));
    });

    test('sem link de saída além do checkout e dos documentos legais', async ({ page }) => {
        await page.goto(URL);
        const hrefs = await page.locator('main a[href]:not([data-checkout]), footer a[href]')
            .evaluateAll((els) => els.map((e) => e.getAttribute('href')));
        expect(hrefs.sort()).toEqual(['/privacidade.html', '/termos.html']);
    });

    test('sem link configurado, o CTA leva à oferta, sem rastreio', async ({ page }) => {
        await page.goto(`${URL}?utm_source=meta`);
        const hrefs = await page.locator('a[data-checkout]').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
        expect(hrefs).toEqual(POSICOES.map(() => '#oferta'));
    });

    test('UTMs da URL seguem para o checkout, com src e sck', async ({ page }) => {
        await comCheckout(page);
        await page.goto(`${URL}?utm_source=ig&utm_medium=stories&utm_campaign=c1&utm_content=a`);
        for (const { src, base, q } of await ctas(page)) {
            expect(base).toBe(CHECKOUT);
            expect(q).toMatchObject({ utm_source: 'ig', utm_content: 'a', src, sck: 'ig|stories|c1|a|' });
        }
    });

    test('visita direta: só src, sem sck', async ({ page }) => {
        await comCheckout(page);
        await page.goto(URL);
        const [{ q }] = await ctas(page);
        expect(q).toEqual({ src: 'topo' });
    });

    test('Pixel: ViewContent do gerente no carregamento, InitiateCheckout no clique', async ({ page }) => {
        await page.addInitScript(() => {
            window.fbq = (...a) => (window.__fbq ||= []).push(a);
        });
        await page.goto(URL);
        await page.locator('a[data-checkout="topo"]').click();
        const track = await page.evaluate(() => window.__fbq.filter((a) => a[0] === 'track'));
        expect(track.map((a) => a[1])).toEqual(['PageView', 'ViewContent', 'InitiateCheckout']);
        expect(track[1][2]).toMatchObject({ content_name: 'Diagnóstico (gerente)', value: 197 });
    });

    test('barra fixa no celular só aparece depois do topo', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(URL);
        const barra = page.locator('.cta-fixa');
        await expect(barra).toBeHidden();
        await page.locator('.para-quem').scrollIntoViewIfNeeded();
        await expect(barra).toBeVisible();
    });

    test('a página do dono leva até aqui pelo FAQ', async ({ page }) => {
        await page.goto('/diagnostico.html');
        await expect(page.locator('.faq a[href="/diagnostico-gerente.html"]')).toHaveCount(1);
        expect((await page.request.get(URL)).status()).toBe(200);
    });
});
