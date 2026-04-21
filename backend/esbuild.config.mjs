// esbuild.config.mjs
// Production build: bundles TypeScript → single ESM file in dist/
// Handles .ts import extensions that tsc with NodeNext resolution cannot emit.
import { build } from 'esbuild';
import { execSync } from 'child_process';
import fs from 'fs';

// Type-check first (non-blocking on import extensions because noEmit is true)
console.log('⏳ Type-checking...');
try {
  execSync('tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ Type-check passed');
} catch {
  console.error('❌ Type errors found. Fix them before building.');
  process.exit(1);
}

// Clean dist
if (fs.existsSync('dist')) fs.rmSync('dist', { recursive: true });
fs.mkdirSync('dist', { recursive: true });

console.log('⏳ Bundling with esbuild...');
await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/index.js',
  // External: don't bundle native modules or Prisma generated client
  external: [
    '@prisma/client',
    'prisma',
    'bcryptjs',
    'jsonwebtoken',
    'cloudinary',
    'multer',
    'express',
    'cors',
    'helmet',
    'morgan',
    'dotenv',
    'express-rate-limit',
    'uuid',
    'zod',
  ],
  sourcemap: true,
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});

console.log('✅ Build complete → dist/index.js');
