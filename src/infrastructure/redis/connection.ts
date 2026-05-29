import IORedis, { type Redis } from 'ioredis';
import { config } from '../../shared/config/index.js';

/**
 * Crea una conexión Redis para BullMQ.
 *
 * `maxRetriesPerRequest: null` es REQUISITO de BullMQ para los comandos
 * bloqueantes de los Workers. Se crea una conexión nueva por llamada porque
 * BullMQ recomienda no compartir la misma conexión entre Queue y Worker.
 */
export function createRedisConnection(): Redis {
  return new IORedis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: null,
  });
}
