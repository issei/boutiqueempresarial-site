import { test, expect } from '@playwright/test';

// CTA → checkout com rastreio — docs/specs/pages/diagnostico.md §4.
// Enquanto o link da Hotmart não existe, o destino é o href estático; o que se
// cobra aqui é a query de rastreio, que vale para qualquer destino.
const CTA = 'Solicitar Diagnóstico Gratuito';

const ctas = (page) =>
    page.locator('a[data-checkout]').evaluateAll((els) =>
        els.map((e) => ({ src: e.dataset.checkout, texto: e.textContent.trim(), url: new URL(e.href) }))
            .map((c) => ({ ...c, path: c.url.pathname, q: Object.fromEntries(c.url.searchParams) })),
    );

test.describe('diagnostico', () => {
    test('três CTAs com o rótulo literal', async ({ page }) => {
        await page.goto('/diagnostico.html');
        const lista = await ctas(page);
        expect(lista.map((c) => c.src)).toEqual(['hero', 'selecao', 'fixa']);
        for (const c of lista) expect(c.texto).toBe(CTA);
    });

    test('UTMs da URL seguem no CTA, com src e sck', async ({ page }) => {
        await page.goto('/diagnostico.html?utm_source=meta&utm_medium=cpc&utm_campaign=c1&utm_content=a&fbclid=F');
        for (const { src, path, q } of await ctas(page)) {
            expect(path).toBe('/formulario.html');
            expect(q).toMatchObject({ utm_source: 'meta', utm_content: 'a', fbclid: 'F', src, sck: 'meta|cpc|c1|a|' });
        }
    });

    test('sem UTM na URL, usa o último toque do cookie be_attr', async ({ page, context, baseURL }) => {
        const attr = { last: { utm_source: 'google', utm_campaign: 'c2' } };
        await context.addCookies([{ name: 'be_attr', value: encodeURIComponent(JSON.stringify(attr)), url: baseURL }]);
        await page.goto('/diagnostico.html');
        const [{ q }] = await ctas(page);
        expect(q).toMatchObject({ utm_source: 'google', sck: 'google||c2||' });
    });

    test('visita direta: só src, sem sck', async ({ page }) => {
        await page.goto('/diagnostico.html');
        const [{ q }] = await ctas(page);
        expect(q).toEqual({ src: 'hero' });
    });
});
