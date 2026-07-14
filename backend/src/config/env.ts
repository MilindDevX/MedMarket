import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL:            z.string().min(1),
  JWT_ACCESS_SECRET:       z.string().min(1),
  JWT_REFRESH_SECRET:      z.string().min(1),
  PORT:                    z.string().default('3000'),
  NODE_ENV:                z.string().default('development'),
  CLOUDINARY_CLOUD_NAME:   z.string().optional(),
  CLOUDINARY_API_KEY:      z.string().optional(),
  CLOUDINARY_API_SECRET:   z.string().optional(),
  GEMINI_API_KEY:          z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Missing required environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// SEC-10: Warn if Cloudinary credentials are missing (required for pharmacy document uploads)
if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
  console.warn('⚠️  Cloudinary credentials not set. Document upload features will fail at runtime.');
}
