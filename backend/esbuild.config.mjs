/**
 * esbuild.config.mjs — Production build script
 *
 * Render deploy commands:
 *   Build command:  npm install && npm run build
 *   Start command:  npm start
 *
 * The build:
 *   1. Runs `prisma generate` to ensure the generated client exists
 *   2. Bundles src/ into dist/index.js via esbuild
 *   3. All node_modules (including Prisma) stay external — resolved at runtime
 */
import { build } from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';

// Step 1 — Prisma generate (creates src/generated/prisma/client.js)
console.log('⏳ Generating Prisma client…');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');
} catch (err) {
  // On Render this must succeed; locally it may fail if engines are blocked
  console.error('❌ prisma generate failed:', err.message);
  process.exit(1);
}

// Step 2 — Clean dist/
if (fs.existsSync('dist')) fs.rmSync('dist', { recursive: true });
fs.mkdirSync('dist', { recursive: true });

// Step 3 — Bundle
console.log('⏳ Bundling with esbuild…');

await build({
  entryPoints: ['src/index.ts'],
  bundle:      true,
  platform:    'node',
  target:      'node20',
  format:      'esm',
  outfile:     'dist/index.js',
  sourcemap:   true,

  // Mark ALL packages (node_modules) as external so they're
  // require()'d at runtime. This handles Prisma's native .node binaries
  // and the generated client which has complex internal imports.
  packages: 'external',
});

console.log('✅ Build complete → dist/index.js');
