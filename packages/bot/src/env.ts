import { config } from 'dotenv';
import { z } from 'zod';

config({ path: '../../.env' });

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_CLIENT_SECRET: z.string().min(1),
  GUILD_ID: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1024).max(65535).default(3001),
  API_SECRET: z.string().min(32),
  API_BASE_URL: z.string().url(),
  DATABASE_PATH: z.string().optional(),
  DASHBOARD_URL: z.string().url().optional(),
});

// Throws at startup if any required variable is missing or malformed.
// This is intentional — a bot with bad config should never start.
export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
