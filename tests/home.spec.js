import { test, expect } from '@playwright/test';

// Textos de docs/specs/design/home-analise-operacao.md (Análise de Operação e Equipe). O rótulo do
// CTA e o destino são afirmados literalmente: são o que liga a página à aplicação.
const CTA = 'Quero a análise da minha operação';
const H1 = 'Em 45 minutos, eu te mostro como a sua empresa pode faturar mais com a equipe que você já tem, sem você precisar trabalhar mais.';
const SUB = 'Uma sessão individual e gratuita. Você sai com o plano de 30 dias com os pontos que mais travam o seu faturamento e o que fazer primeiro na próxima semana.';

const H2 = [
    'Veja se isto acontece na sua empresa',
    'Por que contratar mais gente não aumenta o faturamento na mesma proporção',
    'O que você leva dos 45 minutos',
    'Dois caminhos para o seu próximo ano',
    'Eu sou a Talita Issei.',
    'Para quem é esta análise',
    'Quero a análise da minha operação',
    'Perguntas frequentes',
    'Em 45 minutos, veja onde a sua operação trava o faturamento e o que fazer primeiro.',
];

const SINAIS = [
    'A entrega chega e você precisa conferir antes de mandar para o cliente.',
    'A entrega volta para ajuste, e o time faz de novo um trabalho que já estava pago.',
    'Você encontra o mesmo erro que já tinha corrigido no mês passado.',
    'Você contratou mais gente, a folha subiu, e o seu trabalho subiu junto.',
    'Você paga uma ferramenta, e os pedidos continuam chegando pelo WhatsApp.',
    'Quem entrou há pouco tempo erra o que o funcionário mais antigo já sabe, e quem ensina é você.',
    'Quando você passa um dia fora, o trabalho fica parado esperando a sua resposta.',
    'Você adia um cliente novo porque não sabe quem vai conseguir entregar.',
];

// textContent, não innerText: o eyebrow e outros rótulos aplicam text-transform.
const texto = (page, seletor) => page.locator(seletor).first().evaluate((e) => e.textContent.replace(/\s+/g, ' ').trim());

let posts;

test.beforeEach(async ({ context }) => {
    posts = [];
    // Nenhum envio chega à produção (docs/specs/adr-e2e-nao-enviar-formulario-para-producao.md).
    await context.route('**/script.google.com/**', (r) => {
        posts.push(JSON.parse(r.request().postData()));
        r.fulfill({ status: 200, contentType: 'application/json', body: '{"result":"success"}' });
    });
    await context.route('**/api.boutiqueempresarial.com.br/**', (r) => r.fulfill({ status: 503, body: '{}' }));
    await context.route('**/api.ipify.org/**', (r) => r.abort());
    await context.route('**://connect.facebook.net/**', (r) => r.abort());
    await context.route('**://www.googletagmanager.com/**', (r) => r.abort());
    // Sem o banner de cookies cobrindo o formulário (o banner tem suíte própria).
    await context.addInitScript(() => {
        localStorage.setItem('be_consent', JSON.stringify({ v: 1, ts: '2026-01-01T00:00:00.000Z', cat: { analytics: true, marketing: true } }));
    });
});

async function preencher(page) {
    await page.fill('#f-nome', 'Maria Teste');
    await page.fill('#f-whats', '11987654321');
    await page.fill('#f-email', 'Maria@Exemplo.com');
    await page.locator('input[name=faturamento_mensal][value="R$ 100 mil a R$ 300 mil/mês"]').check({ force: true });
    await page.locator('input[name=tamanho_equipe][value="5 a 15 colaboradores"]').check({ force: true });
    await page.fill('#f-desafio', 'As entregas voltam para ajuste.');
}

test.describe('home', () => {
    test('carrega os elementos principais', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle('Análise de Operação e Equipe | Boutique Empresarial');
        await expect(page.locator('header')).toBeVisible();
        expect(await texto(page, 'h1')).toBe(H1);
        await expect(page.locator('h1 em')).toHaveText('faturar mais com a equipe que você já tem');
    });

    test('a fonte não mudou: Playfair nos títulos e Inter no corpo', async ({ page }) => {
        await page.goto('/');
        const fonte = (sel) => page.locator(sel).first().evaluate((e) => getComputedStyle(e).fontFamily);
        expect(await fonte('h1')).toContain('Playfair Display');
        expect(await fonte('main p')).toContain('Inter');
    });

    test('o H1 tem teto de 3rem', async ({ page }) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await page.goto('/');
        const px = await page.locator('h1').evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
        expect(px).toBeLessThanOrEqual(48);
    });

    test('os h2 seguem a ordem da spec', async ({ page }) => {
        await page.goto('/');
        const h2 = await page.locator('main h2').evaluateAll((els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
        expect(h2).toEqual(H2);
    });

    test('hero e fechamento trazem o texto literal da spec', async ({ page }) => {
        await page.goto('/');
        expect(await texto(page, '.hero .eyebrow')).toBe('Análise de Operação e Equipe · para empresários com equipe');
        expect(await texto(page, '.hero .lead')).toBe(SUB);
        await expect(page.locator('.hero .lead strong')).toHaveText('plano de 30 dias');
        expect(await texto(page, '.hero-nota')).toBe('Você responde 6 perguntas em 2 minutos, aqui mesmo na página. Se a sua aplicação for aprovada, eu entro em contato para marcar.');
        expect(await page.locator('.selos li').allTextContents()).toEqual(['45 minutos', 'Individual', 'Plano de 30 dias', 'Gratuita']);
        expect(await texto(page, '.faixa')).toBe('Operação ✦ Equipe ✦ Faturamento');
        expect(await texto(page, '.agora .micro')).toBe('Análise gratuita · 45 minutos · Individual');
    });

    test('os oito sinais são caixas de marcar e o contador acompanha', async ({ page }) => {
        await page.goto('/');
        const rotulos = page.locator('.sinal');
        await expect(rotulos).toHaveCount(8);
        expect(await rotulos.allTextContents()).toEqual(SINAIS);
        await expect(page.locator('.contador')).toContainText('0 de 8');

        await rotulos.nth(0).click();
        await rotulos.nth(3).click();
        await expect(page.locator('#sinais-n')).toHaveText('2');
        await rotulos.nth(0).click();
        await expect(page.locator('#sinais-n')).toHaveText('1');
    });

    test('sem JavaScript a página continua legível', async ({ browser }) => {
        const ctx = await browser.newContext({ javaScriptEnabled: false });
        const page = await ctx.newPage();
        await page.goto('/');
        await expect(page.locator('.contador')).toContainText('0 de 8');
        await expect(page.locator('#form-aplicar')).toBeVisible();
        await expect(page.locator('.aeo-faq details')).toHaveCount(7);
        await ctx.close();
    });

    test('o ciclo do ponto cego e os quatro itens da análise', async ({ page }) => {
        await page.goto('/');
        expect(await page.locator('.ciclo li').allTextContents()).toEqual([
            'Entra alguém novo', 'Aprende perguntando para você', 'Erra no que não está escrito', 'Você confere e corrige',
        ]);
        expect(await page.locator('.achado h3').allTextContents()).toEqual([
            'Se você paga duas vezes pelo mesmo trabalho',
            'O que fazer antes de contratar',
            'Por que o time não segue o processo',
            'O plano de 30 dias',
        ]);
    });

    test('os dois caminhos: três perdas e seis ganhos', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.caminho:not(.dark) li')).toHaveCount(3);
        await expect(page.locator('.caminho.dark li')).toHaveCount(6);
    });

    test('as fotos da Talita continuam as atuais', async ({ page }) => {
        await page.goto('/');
        const srcs = await page.locator('main img').evaluateAll((els) => els.map((e) => e.getAttribute('src')));
        expect(srcs).toEqual(['/fotos/talita-issei.webp', '/fotos/talita-issei.webp']);
    });

    test('regras de texto: sem "dono", sem preço, sem "Diagnóstico Gratuito", sem resultados', async ({ page }) => {
        await page.goto('/');
        const corpo = await page.evaluate(() => {
            const c = document.body.cloneNode(true);
            c.querySelectorAll('script, noscript').forEach((s) => s.remove());
            return c.textContent;
        });
        expect(corpo, '"dono" na home').not.toMatch(/\bdon[oa]s?\b/i);
        expect(corpo, '"Diagnóstico Gratuito" na home').not.toMatch(/diagn[oó]stico gratuito/i);
        // "não garante o agendamento" do texto legal é a exceção literal da spec.
        const limpo = corpo.replace('não garante o agendamento', '');
        for (const termo of ['Resultados', 'depoimento', 'Empresas com quem', 'garante', 'elimina', 'assegura']) {
            expect(limpo, `"${termo}" na home`).not.toContain(termo);
        }
        // Valor em reais só nas faixas de faturamento do formulário (spec §3).
        const foraDoForm = await page.evaluate(() => {
            const c = document.body.cloneNode(true);
            c.querySelectorAll('#form-aplicar, script, noscript').forEach((s) => s.remove());
            return c.textContent;
        });
        expect(foraDoForm, 'preço fora do formulário').not.toContain('R$');
        // A calculadora saiu.
        await expect(page.locator('#calc')).toHaveCount(0);
    });

    test('todo CTA leva a #aplicar', async ({ page }) => {
        await page.goto('/');
        // Cinco CTAs: hero, cartão escuro da análise, "dois caminhos", "por que agora" e a barra
        // fixa do mobile. Contar antes impede que a suíte passe caso um deles suma.
        const ctas = page.locator('a.btn');
        await expect(ctas).toHaveCount(5);
        for (const cta of await ctas.evaluateAll((els) => els.map((e) => ({ href: e.getAttribute('href'), texto: e.textContent.trim() })))) {
            expect(cta.href, `CTA "${cta.texto}" com destino divergente`).toBe('#aplicar');
            expect(cta.texto, 'rótulo de CTA divergente').toBe(CTA);
        }
        await expect(page.locator('.apply-link')).toHaveAttribute('href', '#aplicar');
        await expect(page.locator('.apply-link')).toHaveText('Quero a análise');
        // Nenhum link da página aponta mais para o formulário antigo.
        await expect(page.locator('a[href*="formulario"]')).toHaveCount(0);
        await expect(page.locator('section#aplicar form#form-aplicar')).toHaveCount(1);
    });

    test('formulário: campo vazio mostra erro no próprio campo e nada é enviado', async ({ page }) => {
        let dialogo = false;
        page.on('dialog', (d) => { dialogo = true; d.dismiss(); });
        await page.goto('/');
        await page.locator('#f-enviar').click();
        for (const id of ['nome_completo', 'whatsapp', 'email', 'faturamento_mensal', 'tamanho_equipe', 'desafio']) {
            await expect(page.locator(`#err-${id}`), `sem erro em ${id}`).toBeVisible();
        }
        await expect(page.locator('#f-nome')).toHaveAttribute('aria-invalid', 'true');
        await expect(page.locator('#f-nome')).toBeFocused();
        expect(dialogo, 'alerta do navegador').toBe(false);
        expect(posts).toHaveLength(0);

        // Corrigir apaga o erro daquele campo.
        await page.fill('#f-nome', 'Maria');
        await expect(page.locator('#err-nome_completo')).toBeHidden();
    });

    test('formulário: envia os 6 campos com UTM para o Apps Script e leva à obrigada', async ({ page }) => {
        await page.goto('/?utm_source=meta&utm_medium=paid_social&utm_campaign=c1');
        await preencher(page);
        await page.locator('#f-enviar').click();
        await page.waitForURL(/\/obrigada\.html\?.*eid=/);

        expect(posts).toHaveLength(1);
        const d = posts[0];
        expect(d.nome_completo).toBe('Maria Teste');
        expect(d.whatsapp).toBe('(11) 98765-4321');
        expect(d.email).toBe('maria@exemplo.com');
        // Mesmos valores gravados pelo formulario.html (comparáveis com os antigos).
        expect(d.faturamento_mensal).toBe('R$ 100 mil a R$ 300 mil/mês');
        expect(d.tamanho_equipe).toBe('5 a 15 colaboradores');
        expect(d.maior_problema_gestao).toBe('Outro');
        expect(d.maior_problema_gestao_outro).toBe('As entregas voltam para ajuste.');
        expect(d.utm_source).toBe('meta');
        expect(d.utm_campaign).toBe('c1');
        expect(d.first_utm_source).toBe('meta');
        expect(d.landing_page).toBe('/');
        expect(d.consentimento).toBe(true);
        expect(d.parcial).toBeUndefined();
        expect(d.event_id).toMatch(/^[0-9a-f-]{36}$/);
        expect(new URL(page.url()).searchParams.get('eid')).toBe(d.event_id);
    });

    test('a barra de CTA fixa é só do mobile', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        await expect(page.locator('.cta-fixa'), 'barra fixa ausente no mobile').toBeVisible();

        // No desktop ela sobraria: a página já tem CTAs em fluxo.
        await page.setViewportSize({ width: 1280, height: 900 });
        await expect(page.locator('.cta-fixa'), 'barra fixa vazando para o desktop').toBeHidden();
    });

    test('390 px: sem scroll horizontal, a barra some sobre o formulário e o rodapé fica acima dela', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');

        const largura = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(largura, 'scroll horizontal em 390 px').toBeLessThanOrEqual(0);

        await page.locator('.hero-cta a').click();
        await expect(page.locator('#f-nome')).toBeInViewport();
        await expect(page.locator('.cta-fixa'), 'barra fixa cobrindo o formulário').toBeHidden();

        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await expect(page.locator('.cta-fixa')).toBeVisible();
        const barra = await page.locator('.cta-fixa').boundingBox();
        const rodape = await page.locator('footer').last().boundingBox();
        expect(rodape.y + rodape.height, 'rodapé coberto pela barra fixa').toBeLessThanOrEqual(barra.y + 1);
    });
});
