import type { RateLimitOptions } from '@fastify/rate-limit';

/**
 * Configuración de rate limiting (@fastify/rate-limit).
 *
 * - global: límite amplio por IP para toda la API.
 * - login : límite estricto para mitigar fuerza bruta de credenciales.
 *
 * En producción conviene un store compartido (Redis) para que el límite sea
 * consistente entre múltiples instancias del API.
 */
export const globalRateLimit: RateLimitOptions = {
  max: 100,
  timeWindow: '1 minute',
};

export const loginRateLimit: { rateLimit: RateLimitOptions } = {
  rateLimit: {
    max: 5,
    timeWindow: '1 minute',
  },
};
