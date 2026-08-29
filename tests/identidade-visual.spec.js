import { test, expect } from '@playwright/test';

test.describe('Guia de Identidade Visual (página interna, não indexada)', () => {
    test('carrega e expõe título, descrição e metadados de não indexação', async ({ page }) => {
        const response = await page.goto('/identidade-visual.html');
        expect(response.status()).toBe(200);

        await expect(page).toHaveTitle(/Identidade Visual/);

        const description = page.locator('meta[name="description"]');
        await expect(description).toHaveAttribute('content', /.+/);

        const robots = page.locator('meta[name="robots"]');
        await expect(robots).toHaveAttribute('content', 'noindex, nofollow');
    });

    test('não é linkada a partir da home pública', async ({ page }) => {
        await page.goto('/');
        const link = page.locator('a[href*="identidade-visual"]');
        await expect(link).toHaveCount(0);
    });
});
