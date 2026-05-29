import { z } from 'zod';

/**
 * Esquema de validación de variables de entorno.
 * Se valida UNA sola vez al arranque: si falta o es inválida una variable,
 * el proceso falla rápido (fail-fast) en lugar de romper en tiempo de ejecución.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().min(1),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Secretos JWT: exigimos longitud mínima para evitar claves débiles.
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  // TTL del access token (~30 min) y del refresh token (rotativo).
  JWT_ACCESS_TTL: z.string().default('30m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  // CORS: lista separada por comas de orígenes permitidos. '*' solo en desarrollo.
  CORS_ORIGINS: z.string().default('*'),

  TICKET_SLA_MINUTES: z.coerce.number().default(60),
  REASSIGNMENT_SWEEP_INTERVAL_MINUTES: z.coerce.number().default(5),
  MAX_AUTO_REASSIGNMENTS: z.coerce.number().default(3),
});

export type Env = z.infer<typeof envSchema>;
