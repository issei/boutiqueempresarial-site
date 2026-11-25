import fs from 'node:fs';
import { test, expect } from '@playwright/test';

// Página /analise (noindex) — texto de docs/specs/design/home-analise-operacao.md, página de entrada em
// docs/specs/design/pagina-analise-operacao.md. O rótulo do
// CTA e o destino são afirmados literalmente: são o que liga a página à aplicação.
const CTA = 'Quero a análise da minha operação';
const H1 = 'O plano para aumentar o faturamento da sua empresa nos próximos 30 dias, com a equipe que você já tem.';
const SUB = 'Se a sua operação cresceu, os custos subiram e o lucro não acompanhou na mesma proporção, você está pagando caro por horas da equipe que não viram faturamento: retrabalho, falhas na execução e um time totalmente dependente de você para resolver problemas básicos.';
const DESC = 'Em 45 minutos, mapeamos o que reduz o faturamento da sua empresa e você sai com um plano de ação de 30 dias para faturar mais com a equipe que já tem.';

const H2 = [
    'Em 45 minutos, mapeamos os pontos da sua operação e da sua equipe que hoje reduzem o seu faturamento, e o que resolver primeiro.',
    'Veja se isto acontece na sua empresa',
    'Por que contratar mais gente não aumenta o faturamento na mesma proporção',
    'O que você leva dos 45 minutos',
    'Dois caminhos para o seu próximo ano',
    'Eu sou a Talita Issei.',
    'Para quem é esta análise',
    'Quero a análise da minha operação',
    'Perguntas frequentes',
    'Em 45 minutos, veja o que reduz o seu faturamento hoje e o que resolver primeiro.',
];

const SINAIS = [
    'A entrega chega e você precisa conferir antes de mandar para o cliente.',
    'A entrega volta, e o time refaz um trabalho que já estava pago.',
    'Você encontra o mesmo erro que já tinha corrigido no mês passado.',
    'Você contratou mais gente, a folha subiu, e o seu trabalho subiu junto.',
    'Você paga uma ferramenta, e os pedidos continuam chegando pelo WhatsApp.',
    'Quem entra demora meses para trabalhar sozinho, e quem treina é você.',
    'Quando você passa um dia fora, a equipe não consegue decidir e o trabalho para.',
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

test.describe('analise', () => {
    test('carrega os elementos principais', async ({ page }) => {
        await page.goto('/analise');
        await expect(page).toHaveTitle('Análise de Operação e Equipe | Boutique Empresarial');
        await expect(page.locator('header')).toBeVisible();
        expect(await texto(page, 'h1')).toBe(H1);
        await expect(page.locator('h1 em')).toHaveText('com a equipe que você já tem.');
    });

    test('a fonte não mudou: Playfair nos títulos e Inter no corpo', async ({ page }) => {
        await page.goto('/analise');
        const fonte = (sel) => page.locator(sel).first().evaluate((e) => getComputedStyle(e).fontFamily);
        expect(await fonte('h1')).toContain('Playfair Display');
        expect(await fonte('main p')).toContain('Inter');
    });

    test('o H1 tem teto de 3rem', async ({ page }) => {
        await page.setViewportSize({ width: 1600, height: 900 });
        await page.goto('/analise');
        const px = await page.locator('h1').evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
        expect(px).toBeLessThanOrEqual(48);
    });

    test('os h2 seguem a ordem da spec', async ({ page }) => {
        await page.goto('/analise');
        const h2 = await page.locator('main h2').evaluateAll((els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
        expect(h2).toEqual(H2);
    });

    test('hero e fechamento trazem o texto literal da spec', async ({ page }) => {
        await page.goto('/analise');
        expect(await texto(page, '.hero .eyebrow')).toBe('Para empresários com equipe');
        expect(await texto(page, '.hero .lead')).toBe(SUB);
        expect(await texto(page, '.hero-nota')).toBe('Você responde 6 perguntas em 2 minutos.');
        await expect(page.locator('.selos')).toHaveCount(0);
        expect(await texto(page, '.faixa')).toBe('Operação ✦ Equipe ✦ Faturamento');
        expect(await texto(page, '.agora .micro')).toBe('45 minutos · 1:1 com a Talita · Sem custo para empresas aprovadas');
    });

    test('os oito sinais são caixas de marcar e o contador acompanha', async ({ page }) => {
        await page.goto('/analise');
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
        await page.goto('/analise');
        await expect(page.locator('.contador')).toContainText('0 de 8');
        await expect(page.locator('#form-aplicar')).toBeVisible();
        await expect(page.locator('.aeo-faq details')).toHaveCount(7);
        await ctx.close();
    });

    test('o ciclo do ponto cego e os quatro itens da análise', async ({ page }) => {
        await page.goto('/analise');
        expect(await page.locator('.ciclo li').allTextContents()).toEqual([
            'Entra alguém novo', 'Cada um faz do seu jeito', 'O erro volta como retrabalho', 'A correção sobe para você',
        ]);
        expect(await page.locator('.achado h3').allTextContents()).toEqual([
            'Quanto do trabalho pago vira retrabalho',
            'O que fazer antes de contratar',
            'Por que o time não segue o processo',
            'O plano de 30 dias',
        ]);
    });

    test('os dois caminhos: três perdas e quatro ganhos, na ordem do resumo de 24/11', async ({ page }) => {
        await page.goto('/analise');
        await expect(page.locator('.caminho:not(.dark) li')).toHaveCount(3);
        expect(await page.locator('.caminho.dark li').allTextContents()).toEqual([
            'Menos retrabalho, e as horas do time vão para atender mais clientes.',
            'Quem entra aprende o padrão e passa a produzir mais rápido.',
            'A equipe resolve o dia a dia, e você consegue passar uns dias fora.',
            'Sobra tempo para vender e para pensar no crescimento da empresa.',
        ]);
    });

    test('as fotos da Talita continuam as atuais', async ({ page }) => {
        await page.goto('/analise');
        const srcs = await page.locator('main img').evaluateAll((els) => els.map((e) => e.getAttribute('src')));
        expect(srcs).toEqual(['/fotos/talita-issei.webp', '/fotos/talita-issei.webp']);
    });

    test('regras de texto: sem "dono", sem preço, sem "Diagnóstico Gratuito", sem resultados', async ({ page }) => {
        await page.goto('/analise');
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

    // Regra de 24/11: em nenhum texto, atributo ou metadado servido.
    test('sem "grátis" nem "gratuita" em toda a página', async ({ page }) => {
        const html = await (await page.request.get('/analise')).text();
        expect(html).not.toMatch(/gr[aá]tis|gratuit/i);
    });

    test('metadados e imagem de prévia próprios de /analise', async ({ page, request }) => {
        await page.goto('/analise');
        for (const sel of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
            await expect(page.locator(sel)).toHaveAttribute('content', DESC);
        }
        for (const sel of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
            await expect(page.locator(sel)).toHaveAttribute('content', 'https://boutiqueempresarial.com.br/og-analise.jpg');
        }
        expect((await request.get('/og-analise.jpg')).status()).toBe(200);
    });

    test('textos de 24/11: quadro, contador, ponto cego, cartões, formulário e FAQ', async ({ page }) => {
        await page.goto('/analise');
        expect(await page.locator('.dados dd').allTextContents()).toEqual(['45', '1:1', 'Sem custo']);
        expect(await page.locator('.dados dt').allTextContents()).toEqual(['minutos', 'com a Talita Issei', 'para empresas aprovadas']);
        const corpo = await texto(page, 'main');
        for (const t of [
            'Você sai com um plano de ação de 30 dias e as prioridades exatas da sua próxima semana.',
            'Toque nas frases ao lado. Cada uma é um sinal de que parte do que você paga ao time não está virando faturamento.',
            'Cada pessoa nova aumenta a folha no primeiro dia. Sem um padrão claro de execução, ela também aumenta o tempo que você passa treinando, conferindo e corrigindo.',
            'E o ciclo recomeça na próxima contratação.',
            'Quando a empresa tem um método claro de execução, a equipe para de depender de você para resolver o básico e as horas pagas passam a virar faturamento.',
            'É isso que mapeamos na sua Análise de Operação e Equipe.',
            'Onde a sua empresa paga duas vezes pela mesma entrega: uma para o time fazer e outra para refazer.',
            'Se a próxima contratação vai aumentar o faturamento ou só a folha, e o que resolver antes de contratar.',
            'O plano de 30 dias com os pontos que mais reduzem o seu faturamento, e o que fazer primeiro na próxima semana.',
            'Para atender mais clientes, você precisa contratar mais.',
            'Se você tem 3 ou mais pessoas na equipe e quer faturar mais sem contratar no mesmo ritmo.',
            'São 6 perguntas e leva 2 minutos.',
            'A análise acontece por vídeo, em 45 minutos.',
            'Na Análise de Operação e Equipe, em 45 minutos, mapeamos os pontos da sua operação e da sua equipe que hoje reduzem o seu faturamento. Você sai com um plano de ação de 30 dias.',
            'Não, para empresas aprovadas. A análise é feita por mim, individualmente, por isso passa por aplicação.',
            'Não. Eu faço as perguntas e você responde com o que sabe da sua semana.',
            'Pela entrega que mais gera retrabalho ou que mais passa pela sua mão.',
        ]) expect(corpo).toContain(t);
        await expect(page.locator('#f-desafio')).toHaveAttribute('placeholder', 'Ex.: muito retrabalho, tudo passa por mim, quem entra demora para aprender.');
        for (const antigo of ['Isso acontece com times bons', 'uma ferramenta nova, a IA', 'deixe aberta a ferramenta', 'Quanto custa?']) expect(corpo).not.toContain(antigo);
    });

    test('quadro e ponto cego: lado a lado no desktop, empilhados a 390 px', async ({ page }) => {
        const caixas = (sel) => page.locator(sel).evaluateAll((els) => els.map((e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y) }; }));
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto('/analise');
        for (const sel of ['.dados > div', '.ponto-grid > div']) {
            const c = await caixas(sel);
            expect(new Set(c.map((b) => b.x)).size, `${sel} no desktop`).toBe(c.length);
        }
        await page.setViewportSize({ width: 390, height: 844 });
        for (const sel of ['.dados > div', '.ponto-grid > div']) {
            const c = await caixas(sel);
            expect(new Set(c.map((b) => b.x)).size, `${sel} a 390 px`).toBe(1);
            expect(c.every((b, i) => i === 0 || b.y > c[i - 1].y)).toBe(true);
        }
    });

    test('todo CTA leva a #aplicar', async ({ page }) => {
        await page.goto('/analise');
        // Seis CTAs: hero, ponto cego, cartão escuro da análise, "dois caminhos", "por que agora" e a barra
        // fixa do mobile. Contar antes impede que a suíte passe caso um deles suma.
        const ctas = page.locator('a.btn');
        await expect(ctas).toHaveCount(6);
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
        await page.goto('/analise');
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
        await page.goto('/analise?utm_source=meta&utm_medium=paid_social&utm_campaign=c1');
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
        expect(d.landing_page).toBe('/analise');
        expect(d.consentimento).toBe(true);
        expect(d.formulario).toBe('analise'); // Spec 032 do CRM
        expect(d.parcial).toBeUndefined();
        expect(d.event_id).toMatch(/^[0-9a-f-]{36}$/);
        expect(new URL(page.url()).searchParams.get('eid')).toBe(d.event_id);
        expect(await page.evaluate(() => JSON.parse(localStorage.getItem('be_perfil')))).toEqual({ formulario: 'analise' });
    });

    test('a barra de CTA fixa é só do mobile', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/analise');
        await expect(page.locator('.cta-fixa'), 'barra fixa ausente no mobile').toBeVisible();

        // No desktop ela sobraria: a página já tem CTAs em fluxo.
        await page.setViewportSize({ width: 1280, height: 900 });
        await expect(page.locator('.cta-fixa'), 'barra fixa vazando para o desktop').toBeHidden();
    });

    test('390 px: sem scroll horizontal, a barra some sobre o formulário e o rodapé fica acima dela', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/analise');

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

    test('página de entrada: noindex, fora do sitemap e sem disputar a home', async ({ page, request }) => {
        await page.goto('/analise');
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
        await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
        await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
        await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://boutiqueempresarial.com.br/analise');
        // O gate faz o build antes dos testes: o sitemap do dist não lista a página.
        const sitemap = new URL('../dist/sitemap.xml', import.meta.url);
        if (fs.existsSync(sitemap)) expect(fs.readFileSync(sitemap, 'utf8')).not.toContain('/analise');
        // A home continua a de antes: não aponta para a página nova.
        await page.goto('/');
        await expect(page.locator('a[href*="analise"]')).toHaveCount(0);
    });
});
