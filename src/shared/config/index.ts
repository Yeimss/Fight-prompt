import { envSchema, type Env } from './env.js';

/**
 * Configuración tipada y validada de la aplicación.
 * Importar siempre `config` desde aquí en lugar de leer `process.env` disperso.
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env: Env = parsed.data;

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  logLevel: env.LOG_LEVEL,
  isProduction: env.NODE_ENV === 'production',

  database: {
    url: env.DATABASE_URL,
  },

  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
    refreshTtl: env.JWT_REFRESH_TTL,
  },

  cors: {
    // '*' => permitir cualquier origen (solo apto para desarrollo).
    origins: env.CORS_ORIGINS === '*' ? true : env.CORS_ORIGINS.split(',').map((o) => o.trim()),
  },

  tickets: {
    slaMinutes: env.TICKET_SLA_MINUTES,
    sweepIntervalMinutes: env.REASSIGNMENT_SWEEP_INTERVAL_MINUTES,
    maxAutoReassignments: env.MAX_AUTO_REASSIGNMENTS,
  },
} as const;
