import { defineConfig } from 'vite'
import { resolve, parse } from 'path';
import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite'
import { globSync } from 'glob';
import sitemap from 'vite-plugin-sitemap';


// Seleciona todos os HTMLs na pasta src
const htmlFiles = globSync('src/*.html');
const htmlInput = Object.fromEntries(
  htmlFiles.map(file => [
    parse(file).name,
    resolve(__dirname, file)
  ])
);

// Rotas com `noindex` no <head>. Listar URL noindex no sitemap é pedir ao crawler
// que visite o que se pediu para ele ignorar — HARNESS_AEO.md §B1.
const naoIndexaveis = htmlFiles
  .filter((file) => /<meta[^>]+name=["']robots["'][^>]*noindex/i.test(readFileSync(file, 'utf8')))
  .map((file) => (parse(file).name === 'index' ? '/' : `/${parse(file).name}`));

export default defineConfig({
  root: 'src',
  publicDir: '../public', 
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: htmlInput,
    },
  },
  plugins: [
    tailwindcss(),
    sitemap({
      hostname: 'https://boutiqueempresarial.com.br',
      // A exclusão sai do próprio `meta robots` de cada src/*.html — nunca de uma
      // lista manual, que apodrece na página seguinte.
      exclude: naoIndexaveis,
    })
  ]
})