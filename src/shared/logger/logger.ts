import pino from 'pino';
import { config } from '../config/index.js';

/**
 * Logger estructurado (Pino). En desarrollo usa pino-pretty para legibilidad;
 * en producción emite JSON apto para indexar (ELK / Loki / Datadog).
 *
 * Para trazabilidad, derivar un child logger por request con el correlationId:
 *   const reqLogger = logger.child({ requestId });
 */
export const logger = pino({
  level: config.logLevel,
  redact: {
    // Nunca loggear credenciales ni tokens
    paths: ['req.headers.authorization', 'password', 'passwordHash', '*.password'],
    censor: '[REDACTED]',
  },
  transport: config.isProduction
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } },
});
