// Camada agêntica — docs/AGENT_READINESS.md.
// O que esta suíte impede: manifesto que promete um recurso que não existe.
// Um agente não interpreta layout; ele segue links de dentro de JSON. Um href
// quebrado aqui não aparece na tela de ninguém — só quebra silenciosamente para
// a máquina, que é exatamente o consumidor que estes arquivos existem para servir.
import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';

const SITE = 'https://boutiqueempresarial.com.br';

// Artefatos servidos da raiz. Os sem extensão são exigência das RFCs 8414/9727/9728.
const JSON_ARTEFATOS = [
  '/.well-known/ai-catalog.json',
  '/.well-known/agent-catalog',
  '/.well-known/api-catalog',
  '/.well-known/agent-card.json',
  '/.well-known/mcp/server-card.json',
  '/.well-known/oauth-protected-resource',
  '/.well-known/oauth-authorization-server',
  '/.well-known/openid-configuration',
  '/.well-known/jwks.json',
  '/.well-known/agent-skills/index.json',
];

const TEXTO_ARTEFATOS = ['/auth.md', '/llms.txt', '/llms-full.txt', '/robots.txt'];

// Declarados por exigência de formato e documentados como inertes em /auth.md:
// não há servidor neste domínio. Cobrar 200 deles seria cobrar uma mentira.
const DECLARATIVOS = ['/mcp', '/oauth/authorize', '/oauth/token'];

test.describe('artefatos de descoberta', () => {
  for (const caminho of [...JSON_ARTEFATOS, ...TEXTO_ARTEFATOS]) {
    test(`${caminho} responde 200`, async ({ request }) => {
      const res = await request.get(caminho);
      expect(res.status(), `${caminho} não é servido`).toBe(200);
    });
  }

  for (const caminho of JSON_ARTEFATOS) {
    test(`${caminho} parseia como JSON`, async ({ request }) => {
      const bruto = await (await request.get(caminho)).text();
      expect(() => JSON.parse(bruto), `${caminho} não é JSON válido`).not.toThrow();
    });
  }

  test('toda URL do próprio domínio citada nos artefatos resolve 200', async ({ request }) => {
    const quebrados = [];
    for (const caminho of [...JSON_ARTEFATOS, ...TEXTO_ARTEFATOS]) {
      const texto = await (await request.get(caminho)).text();
      const urls = [...texto.matchAll(/https:\/\/boutiqueempresarial\.com\.br[^"\s)`]*/g)]
        .map((m) => m[0].replace(/[.,]$/, ''))
        .map((u) => new URL(u).pathname);

      for (const alvo of new Set(urls)) {
        if (DECLARATIVOS.includes(alvo)) continue;
        const r = await request.get(alvo);
        if (r.status() >= 400) quebrados.push(`${caminho} → ${alvo} (${r.status()})`);
      }
    }
    expect(quebrados.join('\n'), 'referências quebradas em manifesto agêntico').toBe('');
  });
});

test.describe('contrato dos manifestos', () => {
  // A regra que custou mais iterações na mauricio-site: o validador só lê o trio
  // anônimo DENTRO de `agent_auth`. Preenchê-lo em `methods[]` ou no topo do
  // documento é ignorado. Este teste trava o nível certo.
  test('agent_auth está na AS metadata com o trio anônimo completo', async ({ request }) => {
    const as = await (await request.get('/.well-known/oauth-authorization-server')).json();
    const bloco = as.agent_auth;

    expect(bloco, 'sem bloco agent_auth na AS metadata').toBeTruthy();
    expect(bloco.skill, 'agent_auth.skill precisa apontar para /auth.md').toBe(`${SITE}/auth.md`);
    expect(bloco.identity_types_supported, 'agent_auth.identity_types_supported').toContain('anonymous');
    expect(bloco.anonymous?.credential_types_supported, 'agent_auth.anonymous.credential_types_supported').toContain('none');
    expect(bloco.claim_uri, 'agent_auth.claim_uri ausente').toBeTruthy();
    expect(bloco.register_uri, 'agent_auth.register_uri ausente').toBeTruthy();
  });

  // jwks vazio é a verdade — nada é assinado porque nada é emitido. Se um dia
  // aparecer chave aqui sem authorization server no ar, o site passa a mentir.
  test('jwks declara conjunto vazio, coerente com /auth.md', async ({ request }) => {
    const jwks = await (await request.get('/.well-known/jwks.json')).json();
    expect(jwks.keys, 'jwks.keys não é lista vazia').toEqual([]);
  });

  test('cards MCP e A2A declaram que o endpoint é planejado', async ({ request }) => {
    for (const caminho of ['/.well-known/mcp/server-card.json', '/.well-known/agent-card.json']) {
      const card = await (await request.get(caminho)).json();
      expect(card.status?.endpoint, `${caminho}: sem status.endpoint`).toBe('planned');
      expect(card.status?.availableToday, `${caminho}: sem availableToday`).toContain('webmcp');
    }
  });

  test('digest da skill bate com o SKILL.md servido', async ({ request }) => {
    const index = await (await request.get('/.well-known/agent-skills/index.json')).json();
    for (const skill of index.skills) {
      const corpo = await (await request.get(new URL(skill.url).pathname)).body();
      const digest = `sha256:${createHash('sha256').update(corpo).digest('hex')}`;
      expect(digest, `digest desatualizado para ${skill.name}`).toBe(skill.digest);
    }
  });

  test('robots.txt anuncia sinais e mapas para agentes', async ({ request }) => {
    const txt = await (await request.get('/robots.txt')).text();
    for (const marca of ['Content-Signal:', 'Sitemap:', 'Agentmap:', 'LLMs:', 'LLMs-full:']) {
      expect(txt, `robots.txt sem "${marca}"`).toContain(marca);
    }
  });
});

test.describe('descoberta a partir da página', () => {
  test('a home declara os links de descoberta', async ({ page }) => {
    await page.goto('/');
    for (const rel of ['api-catalog', 'service-desc', 'service-doc']) {
      expect(
        await page.locator(`link[rel="${rel}"]`).count(),
        `home sem <link rel="${rel}">`,
      ).toBeGreaterThan(0);
    }
  });

  // WebMCP ainda não existe em nenhum browser do Playwright: injeta-se um duplo
  // antes do load para provar que o registro roda e com que shape.
  test('WebMCP registra get_overview e get_faq', async ({ page }) => {
    await page.addInitScript(() => {
      window.__tools = [];
      navigator.modelContext = { registerTool: (t) => window.__tools.push(t) };
    });
    await page.goto('/');

    const tools = await page.evaluate(() => window.__tools.map((t) => t.name));
    expect(tools, 'tools WebMCP não registradas').toEqual(['get_overview', 'get_faq']);

    // get_faq lê o FAQPage da própria página: o que a tool devolve é o que o
    // humano lê. Sem essa amarra o agente ganharia uma fonte paralela.
    const respostas = await page.evaluate(() => window.__tools[1].execute());
    expect(respostas.length, 'get_faq devolveu FAQ vazio').toBeGreaterThan(0);
    expect(respostas[0]).toHaveProperty('pergunta');
    expect(respostas[0]).toHaveProperty('resposta');
  });
});
