import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default('postgresql://postgres@localhost:5432/sarvraksha_dev'),
  JWT_SECRET: z.string().min(32).default('sarvraksha_default_dev_jwt_secret_must_be_at_least_32_chars!'),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().default(900), // 15 minutes
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().default(7),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('CRITICAL: Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
