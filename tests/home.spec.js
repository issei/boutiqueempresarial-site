import { test, expect } from '@playwright/test';

// O rótulo do CTA é afirmado literalmente porque é a única coisa que liga a página ao funil:
// se alguém reescrever o botão sem reescrever o destino, ou o contrário, é aqui que aparece.
// Texto de docs/specs/pages/home-copy-v3.md §3.
const CTA = 'Quero entender por que o meu time me procura tanto';

const H2 = [
    'Veja se o seu dia se parece com este.',
    'O que olhamos juntos nos 45 minutos',
    'O que muda quando o time sabe o que pode decidir sem você',
    'O que acontece se nada mudar',
    'Quem vai conversar com você',
    'Talvez esta conversa não seja para você',
    'Perguntas frequentes',
    'Como funciona',
];

const AGENDA = [
    ['8h10', 'Alguém te faz uma pergunta que poderia ter resolvido sozinho.'],
    ['9h30', 'Chega um problema sem nenhuma ideia de solução, e quem resolve é você.'],
    ['11h', 'Você manda mensagem para cada pessoa para saber como está cada entrega.'],
    ['14h', 'A pessoa que entrou há um mês pergunta, pela terceira vez, algo que você já explicou.'],
    ['16h', 'Um cliente pede uma resposta, e ninguém do time se sente seguro para dar sem falar com você.'],
    ['17h30', 'Você queria dar um retorno para alguém sobre a semana, mas não sobrou tempo.'],
    ['18h', 'O seu próprio trabalho ainda não começou.'],
];

// textContent, não innerText: o eyebrow e outros rótulos aplicam text-transform.
const texto = (page, seletor) => page.locator(seletor).first().evaluate((e) => e.textContent.replace(/\s+/g, ' ').trim());

test.describe('home', () => {
    test('carrega os elementos principais', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle('Diagnóstico Gratuito | Boutique Empresarial');
        await expect(page.locator('header')).toBeVisible();
        await expect(page.locator('h1')).toHaveText('Quantas vezes o seu time te procurou hoje?');
    });

    test('os h2 seguem a ordem da copy v3', async ({ page }) => {
        await page.goto('/');
        const h2 = await page.locator('main h2').evaluateAll((els) => els.map((e) => e.textContent.trim()));
        expect(h2).toEqual(H2);
    });

    test('hero e fechamento trazem o texto literal da spec', async ({ page }) => {
        await page.goto('/');
        expect(await texto(page, '.eyebrow')).toBe('Para empresários e líderes de equipe');
        expect(await texto(page, '.hero .lead')).toBe(
            'E quantas dessas vezes precisavam mesmo de você? Em um diagnóstico de 45 minutos, eu te mostro por que o time depende tanto de você e o que mudar primeiro na forma de conduzir a equipe.',
        );
        expect(await texto(page, '.hero-nota')).toBe('Diagnóstico gratuito. Você preenche em 2 minutos e eu entro em contato.');
        expect(await texto(page, '.fechamento-frase')).toBe(
            'Descubra em 45 minutos quais decisões o seu time pode tomar sem você.',
        );
        await expect(page.locator('.hero-cred'), 'a linha de credencial saiu do hero').toHaveCount(0);
    });

    test('a agenda do dia tem 7 horários, na ordem, e fecha em 18h', async ({ page }) => {
        await page.goto('/');
        const itens = page.locator('.agenda li');
        await expect(itens).toHaveCount(7);

        const lidos = await itens.evaluateAll((els) =>
            els.map((e) => {
                const t = e.querySelector('time');
                return [t.textContent.trim(), e.textContent.replace(t.textContent, '').replace(/\s+/g, ' ').trim()];
            }),
        );
        expect(lidos).toEqual(AGENDA);

        const conta = page.locator('.conta-rapida');
        await expect(conta.locator('h3')).toHaveText('Faça uma conta rápida.');
        await expect(conta.locator('p')).toHaveCount(2);
    });

    test('os três achados trazem a linha de resultado', async ({ page }) => {
        await page.goto('/');
        expect(await page.locator('.achado h3').allTextContents()).toEqual([
            'Como você acompanha o time',
            'Como as decisões chegam até você',
            'O que já custou caro',
        ]);
        expect(await page.locator('.achado-ganho').allTextContents()).toEqual([
            'Você descobre por que precisa perguntar o status de tudo.',
            'Você descobre o que pode parar de chegar até você.',
            'Você vê, com os seus próprios exemplos, o preço de deixar como está.',
        ]);
    });

    test('o texto antigo da v2 não volta', async ({ page }) => {
        await page.goto('/');
        const corpo = await page.locator('body').evaluate((e) => e.textContent);
        for (const antigo of [
            'Quero agendar meu diagnóstico',
            'a sua equipe ainda depende',
            'empresas de serviço',
            'a partir de 5',
        ]) {
            expect(corpo, `"${antigo}" voltou à home`).not.toContain(antigo);
        }
    });

    test('todo CTA aponta para o mesmo formulário', async ({ page }) => {
        await page.goto('/');

        // Três CTAs: hero, fechamento e a barra fixa do mobile — duas em fluxo (copy v3 §5).
        // Contar antes de afirmar o href impede que a suíte passe caso um deles suma silenciosamente.
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

    test('"Como funciona" não traz botão', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.selecao a.btn')).toHaveCount(0);
        await expect(page.locator('.passos li')).toHaveCount(3);
    });

    test('a barra de CTA fixa é só do mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/');
        await expect(page.locator('.cta-fixa'), 'barra fixa ausente no mobile').toBeVisible();

        // No desktop ela sobraria: a página já tem dois CTAs em fluxo.
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
