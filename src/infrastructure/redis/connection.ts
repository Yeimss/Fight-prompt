import type { ConnectionOptions } from 'bullmq';
import { config } from '../../shared/config/index.js';

/**
 * Opciones de conexión Redis para BullMQ.
 *
 * Se pasan como OPCIONES (no como instancia compartida): BullMQ crea internamente
 * las conexiones que necesita por cola/worker, evitando el conflicto de tipos por
 * la copia anidada de ioredis que trae BullMQ.
 *
 * `maxRetriesPerRequest: null` es requisito de BullMQ para comandos bloqueantes.
 */
export const redisConnectionOptions: ConnectionOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
};
