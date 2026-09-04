// Quality gate único e fail-closed — HARNESS_AEO.md §A2.
// Roda build + testes em sequência e para no primeiro erro.
// É o único comando que a CI e o desenvolvedor executam: se uma verificação
// não está aqui, ela não existe.
import { spawnSync } from 'node:child_process';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

// rtk (Rust Token Killer) comprime a saída de comando antes de ela virar
// contexto de agente. É otimização, não requisito: local ele existe, no VM
// cloud não instala (PLANO_MULTIAGENTE.md §9.5). Detectar e degradar.
const hasRtk = spawnSync('rtk', ['--version'], { shell: true }).status === 0;

const steps = [
  { name: 'build', cmd: npx, args: ['vite', 'build'] },
  {
    name: 'testes (smoke + SEO + AEO + a11y)',
    cmd: hasRtk ? 'rtk' : npx,
    args: hasRtk ? ['playwright', 'test'] : ['playwright', 'test'],
  },
];

console.log(`gate: ${steps.length} etapas${hasRtk ? ' · rtk ligado' : ''}`);

for (const [i, step] of steps.entries()) {
  console.log(`\n── ${i + 1}/${steps.length} ${step.name}`);
  const r = spawnSync(step.cmd, step.args, { stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error(`\n✗ gate VERMELHO na etapa "${step.name}"`);
    process.exit(r.status ?? 1);
  }
}

console.log('\n✓ gate VERDE');
