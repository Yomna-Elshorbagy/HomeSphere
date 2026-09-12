import dotenv from 'dotenv';
import { z } from 'zod';

// Load local .env first (takes precedence)
dotenv.config();
dotenv.config({ path: '../../.env' }); // Load from root as fallback

const envSchema = z.object({
  PORT: z.string().default('3002'),
  DATABASE_URL: z.string().url(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
