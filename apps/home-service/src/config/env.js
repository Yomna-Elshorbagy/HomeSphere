import dotenv from 'dotenv';
import { z } from 'zod';

// Load local .env first (takes precedence)
dotenv.config();
dotenv.config({ path: '../../.env' }); // Load from root as fallback

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SERVICE_URL: z.string().url().default('http://localhost:3000'),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
