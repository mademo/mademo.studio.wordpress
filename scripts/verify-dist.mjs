#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve(process.argv[2] ?? 'wordpress/theme/mademo/dist');
const manifestPath = path.join(distDir, '.vite', 'manifest.json');

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (!fs.existsSync(manifestPath)) {
  fail(`Manifest Vite absent : ${manifestPath}`);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch (error) {
  fail(`Manifest Vite illisible : ${error.message}`);
}

const entry = manifest['index.html'] ?? manifest['src/main.tsx'];
if (!entry?.file) {
  fail('Entrée Vite index.html/src/main.tsx absente du manifeste.');
}

const referencedFiles = [
  entry.file,
  ...(entry.css ?? []),
  ...(entry.imports ?? []).map((key) => manifest[key]?.file),
].filter(Boolean);

for (const file of referencedFiles) {
  const absolutePath = path.join(distDir, file);
  if (!fs.existsSync(absolutePath)) {
    fail(`Asset référencé mais absent : ${file}`);
  }
}

console.log(`✓ Bundle Vite valide : ${referencedFiles.length} asset(s) contrôlé(s).`);
