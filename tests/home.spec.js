import { test, expect } from '@playwright/test';

// O rótulo do CTA mudou com a LP do Diagnóstico. Ele é afirmado literalmente porque é a
// única coisa que liga a página ao funil: se alguém reescrever o botão sem reescrever o
// destino, ou o contrário, é aqui que aparece.
const CTA = 'Solicitar Diagnóstico Gratuito';

test.describe('home', () => {
    test('carrega os elementos principais', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/Boutique Empresarial/);
        await expect(page.locator('header')).toBeVisible();
        await expect(page.locator('h1')).toContainText('onde sua equipe trava sem você');
    });

    test('todo CTA aponta para o mesmo formulário', async ({ page }) => {
        await page.goto('/');

        // Três CTAs: hero, fim da seleção e a barra fixa do mobile. Contar antes de
        // afirmar o href impede que a suíte passe caso um deles suma silenciosamente.
        //
        // Seletor de CSS, não `getByRole`: a barra fixa é `display:none` fora do
        // mobile, e `getByRole` só enxerga a árvore de acessibilidade — no desktop
        // ela contaria 2 e o teste reprovaria por motivo errado. Aqui o alvo é o
        // destino de todo CTA que existe no DOM, em qualquer viewport.
        const ctas = page.locator('a.btn');
        await expect(ctas).toHaveCount(3);

        for (const cta of await ctas.evaluateAll((els) =>
            els.map((e) => ({ href: e.getAttribute('href'), texto: e.textContent.trim() })),
        )) {
            expect(cta.href, `CTA "${cta.texto}" com destino divergente`).toBe('/formulario.html');
            expect(cta.texto, 'rótulo de CTA divergente').toBe(CTA);
        }
    });

    test('a barra de CTA fixa é só do mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');
        await expect(page.locator('.cta-fixa'), 'barra fixa ausente no mobile').toBeVisible();

        // No desktop ela sobraria: a página já tem dois CTAs em fluxo.
        await page.setViewportSize({ width: 1280, height: 900 });
        await expect(page.locator('.cta-fixa'), 'barra fixa vazando para o desktop').toBeHidden();
    });
});
