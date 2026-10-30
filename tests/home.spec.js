import { test, expect } from '@playwright/test';

// Textos de docs/specs/design/home-copy-v4.md. O rótulo do CTA é afirmado literalmente porque é a
// única coisa que liga a página ao funil: se alguém reescrever o botão sem reescrever o destino,
// ou o contrário, é aqui que aparece.
const CTA = 'Quero entender por que os erros continuam';
const H1 = 'Você revisa tudo o que o seu time entrega. E os erros continuam aparecendo.';
const SUB = 'Em um diagnóstico individual de 45 minutos, eu te mostro por que os erros se repetem no seu time e você sai com os três primeiros ajustes por escrito.';

const H2 = [
    'Veja se isto acontece com você',
    'Faça uma conta rápida',
    'Por que revisar tudo não diminui os erros',
    'Implantar as três partes juntas, nesta ordem.',
    'O que olhamos juntos nos 45 minutos',
    'Dois caminhos para o seu próximo ano',
    'Eu sou a Talita Issei.',
    'Para quem é esta conversa',
    'Como funciona',
    'Perguntas frequentes',
    'Descubra em 45 minutos por que os erros continuam chegando até você e o que mudar primeiro.',
];

const SINAIS = [
    'A entrega chega e você precisa conferir antes de mandar para o cliente.',
    'Você encontra o mesmo erro que já tinha corrigido no mês passado.',
    'Você devolve, explica de novo, e a pessoa ajusta só aquele ponto.',
    'Quando você está sem tempo para revisar, o trabalho fica parado esperando você.',
    'Quem entrou há pouco tempo erra o que os mais antigos já sabem, e é você quem percebe.',
    'Quando um erro chega ao cliente, é você quem pede desculpas e explica o que aconteceu.',
    'Você sabe que tem gente que entrega bem e gente que dá mais trabalho, mas não tem como mostrar isso com números.',
];

// textContent, não innerText: o eyebrow e outros rótulos aplicam text-transform.
const texto = (page, seletor) => page.locator(seletor).first().evaluate((e) => e.textContent.replace(/\s+/g, ' ').trim());

test.describe('home', () => {
    test('carrega os elementos principais', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle('Diagnóstico Gratuito | Boutique Empresarial');
        await expect(page.locator('header')).toBeVisible();
        expect(await texto(page, 'h1')).toBe(H1);
        await expect(page.locator('h1 em')).toHaveText('E os erros continuam aparecendo.');
    });

    test('a fonte não mudou: Playfair nos títulos e Inter no corpo', async ({ page }) => {
        await page.goto('/');
        const fonte = (sel) => page.locator(sel).first().evaluate((e) => getComputedStyle(e).fontFamily);
        expect(await fonte('h1')).toContain('Playfair Display');
        expect(await fonte('main p')).toContain('Inter');
    });

    test('os h2 seguem a ordem da copy v4', async ({ page }) => {
        await page.goto('/');
        const h2 = await page.locator('main h2').evaluateAll((els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
        expect(h2).toEqual(H2);
    });

    test('hero e fechamento trazem o texto literal da spec', async ({ page }) => {
        await page.goto('/');
        expect(await texto(page, '.hero .eyebrow')).toBe('Para empresários e líderes de equipe');
        expect(await texto(page, '.hero .lead')).toBe(SUB);
        await expect(page.locator('.hero .lead strong')).toHaveText('três primeiros ajustes por escrito.');
        expect(await texto(page, '.hero-nota')).toBe('Diagnóstico gratuito. Você preenche em 2 minutos e eu entro em contato.');
        expect(await page.locator('.selos li').allTextContents()).toEqual(['45 minutos', 'Individual', '3 ajustes por escrito', 'Gratuito']);
        expect(await texto(page, '.agora .micro')).toBe('Diagnóstico gratuito · 45 minutos · Individual');
    });

    test('os sete sinais são caixas de marcar e o contador acompanha', async ({ page }) => {
        await page.goto('/');
        const rotulos = page.locator('.sinal');
        await expect(rotulos).toHaveCount(7);
        expect(await rotulos.allTextContents()).toEqual(SINAIS);
        await expect(page.locator('.contador')).toContainText('0 de 7');

        await rotulos.nth(0).click();
        await rotulos.nth(3).click();
        await expect(page.locator('#sinais-n')).toHaveText('2');
        await rotulos.nth(0).click();
        await expect(page.locator('#sinais-n')).toHaveText('1');
    });

    test('a calculadora começa em 20 / 8 / 6 = 75% e respeita os limites', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#v-rev')).toHaveText('20');
        await expect(page.locator('#v-err')).toHaveText('8');
        await expect(page.locator('#v-rep')).toHaveText('6');
        await expect(page.locator('#r-pct')).toHaveText('75%');
        await expect(page.locator('#r-b')).toBeVisible();

        // 3/8 = 38%: abaixo de 50% só o percentual, sem a frase.
        for (let i = 0; i < 3; i++) await page.locator('button[data-k="rep"][data-d="-1"]').click();
        await expect(page.locator('#r-pct')).toHaveText('38%');
        await expect(page.locator('#r-b')).toBeHidden();

        // Os erros repetidos nunca passam dos erros encontrados.
        for (let i = 0; i < 12; i++) await page.locator('button[data-k="rep"][data-d="1"]').click();
        await expect(page.locator('#v-rep')).toHaveText('8');
        await expect(page.locator('#r-pct')).toHaveText('100%');

        // Baixar as entregas puxa os erros junto.
        for (let i = 0; i < 20; i++) await page.locator('button[data-k="rev"][data-d="-1"]').click();
        await expect(page.locator('#v-rev')).toHaveText('0');
        await expect(page.locator('#v-err')).toHaveText('0');
        await expect(page.locator('#r-pct')).toHaveText('0%');
    });

    test('sem JavaScript a página continua legível', async ({ browser }) => {
        const ctx = await browser.newContext({ javaScriptEnabled: false });
        const page = await ctx.newPage();
        await page.goto('/');
        await expect(page.locator('.contador')).toContainText('0 de 7');
        await expect(page.locator('#r-pct')).toHaveText('75%');
        await expect(page.locator('.aeo-faq details')).toHaveCount(7);
        await ctx.close();
    });

    test('as três partes vêm na ordem Indicadores, Processos, Gestão de pessoas', async ({ page }) => {
        await page.goto('/');
        expect(await page.locator('.parte h3').allTextContents()).toEqual(['Indicadores', 'Processos', 'Gestão de pessoas']);
        expect(await page.locator('.parte-ordem').allTextContents()).toEqual(['Primeiro', 'Depois', 'Por fim']);
        expect(await texto(page, '.nota')).toBe('Quase todo mundo começa pela ferramenta. Ela só funciona depois que essas três partes estão definidas.');
    });

    test('os quatro achados trazem a linha de resultado', async ({ page }) => {
        await page.goto('/');
        expect(await page.locator('.achado h3').allTextContents()).toEqual([
            'Como o trabalho chega até você',
            'Como você acompanha o time',
            'Como as responsabilidades estão divididas',
            'O que já custou caro',
        ]);
        expect(await page.locator('.achado-ganho').allTextContents()).toEqual([
            'Você descobre por que as entregas chegam com erro.',
            'Você descobre o que precisa acompanhar para não ter que revisar tudo.',
            'Você descobre o que pode deixar de passar pela sua revisão.',
            'Você vê, com os seus próprios exemplos, o preço de deixar como está.',
        ]);
    });

    test('os dois caminhos: três perdas e seis ganhos', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.caminho:not(.dark) li')).toHaveCount(3);
        await expect(page.locator('.caminho.dark li')).toHaveCount(6);
    });

    test('o texto antigo da v3 não volta', async ({ page }) => {
        await page.goto('/');
        const corpo = await page.locator('body').evaluate((e) => e.textContent);
        for (const antigo of [
            'Quantas vezes o seu time te procurou',
            'me procura tanto',
            'depende tanto de você',
            'Quero agendar meu diagnóstico',
            'Talvez esta conversa não seja para você',
            'empresas de serviço',
            'a partir de 5',
        ]) {
            expect(corpo, `"${antigo}" voltou à home`).not.toContain(antigo);
        }
    });

    test('todo CTA aponta para o mesmo formulário', async ({ page }) => {
        await page.goto('/');

        // Cinco CTAs: hero, cartão escuro do diagnóstico, "dois caminhos", "por que agora" e a
        // barra fixa do mobile. Contar antes de afirmar o href impede que a suíte passe caso um
        // deles suma silenciosamente.
        //
        // Seletor de CSS, não `getByRole`: a barra fixa é `display:none` fora do mobile, e
        // `getByRole` só enxerga a árvore de acessibilidade.
        const ctas = page.locator('a.btn');
        await expect(ctas).toHaveCount(5);

        for (const cta of await ctas.evaluateAll((els) =>
            els.map((e) => ({ href: e.getAttribute('href'), texto: e.textContent.trim() })),
        )) {
            expect(cta.href, `CTA "${cta.texto}" com destino divergente`).toBe('/formulario.html');
            expect(cta.texto, 'rótulo de CTA divergente').toBe(CTA);
        }
        await expect(page.locator('.apply-link')).toHaveAttribute('href', '/formulario.html');
    });

    test('"Como funciona" não traz botão', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.selecao a.btn')).toHaveCount(0);
        await expect(page.locator('.passos li')).toHaveCount(3);
    });

    test('a barra de CTA fixa é só do mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');
        await expect(page.locator('.cta-fixa'), 'barra fixa ausente no mobile').toBeVisible();

        // No desktop ela sobraria: a página já tem CTAs em fluxo.
        await page.setViewportSize({ width: 1280, height: 900 });
        await expect(page.locator('.cta-fixa'), 'barra fixa vazando para o desktop').toBeHidden();
    });

    test('375 px: sem scroll horizontal e a última linha do rodapé fica acima da barra fixa', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');

        const largura = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(largura, 'scroll horizontal em 375 px').toBeLessThanOrEqual(0);

        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        const barra = await page.locator('.cta-fixa').boundingBox();
        const rodape = await page.locator('footer').last().boundingBox();
        expect(rodape.y + rodape.height, 'rodapé coberto pela barra fixa').toBeLessThanOrEqual(barra.y + 1);
    });
});
