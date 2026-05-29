import pino, { type LoggerOptions } from 'pino';
import { config } from '../config/index.js';

/**
 * Opciones del logger estructurado (Pino). En desarrollo usa pino-pretty para
 * legibilidad; en producción emite JSON apto para indexar (ELK / Loki / Datadog).
 *
 * Se exponen como opciones (no como instancia) para que Fastify construya su
 * propio logger con esta configuración y mantenga su tipado por defecto.
 */
export const loggerOptions: LoggerOptions = {
  level: config.logLevel,
  redact: {
    // Nunca loggear credenciales ni tokens
    paths: ['req.headers.authorization', 'password', 'passwordHash', '*.password', 'refreshToken'],
    censor: '[REDACTED]',
  },
  transport: config.isProduction
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } },
};

/**
 * Instancia de logger para usos fuera de Fastify (workers, scripts, bootstrap).
 * Para trazabilidad por request, usar el logger que Fastify inyecta en cada
 * request (`request.log`), que ya incluye el reqId.
 */
export const logger = pino(loggerOptions);
