import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const defaultAppUrl = process.env.APP_URL || (vercelDomain ? `https://${vercelDomain}` : 'http://localhost:3000');
const defaultCors = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(vercelDomain ? [`https://${vercelDomain}`] : []),
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
].join(',');

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  TEST_DATABASE_URL: z.string().optional(),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters long for cryptographic security'),
  APP_URL: z.string().default(defaultAppUrl),
  TRUST_PROXY: z.coerce.number().default(1),
  CORS_ORIGIN: z.string().default(defaultCors),

  // Feature-flagged integrations
  EMAIL_PROVIDER_API_KEY: z.string().optional(),
  WHATSAPP_CLOUD_API_TOKEN: z.string().optional(),
  WHATSAPP_CLOUD_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_CLOUD_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  STORAGE_ADAPTER: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
