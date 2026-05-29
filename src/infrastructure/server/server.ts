import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';
import { buildContainer } from '../../app.js';
import { config } from '../../shared/config/index.js';
import { loggerOptions } from '../../shared/logger/logger.js';
import { errorHandler } from '../../shared/middlewares/error-handler.js';
import { globalRateLimit } from '../../shared/middlewares/rate-limit.js';
import { buildAuthRoutes } from '../../modules/auth/auth.routes.js';
import { buildUserRoutes } from '../../modules/users/users.routes.js';

/**
 * Construye y configura la instancia de Fastify con la pila de seguridad y las
 * rutas de cada módulo. La terminación HTTPS se delega a un reverse proxy /
 * load balancer (por eso `trustProxy: true`, para resolver bien la IP cliente).
 */
export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({ logger: loggerOptions, trustProxy: true });

  // ── Seguridad ──
  await app.register(helmet);
  await app.register(cors, { origin: config.cors.origins, credentials: true });
  await app.register(rateLimit, globalRateLimit);

  // ── Manejo central de errores ──
  app.setErrorHandler(errorHandler);

  // ── Health checks ──
  app.get('/health', async () => ({ status: 'ok' }));
  app.get('/ready', async () => ({ status: 'ready' }));

  // ── Rutas de módulos ──
  const container = buildContainer();
  await app.register(buildAuthRoutes(container.authController), { prefix: '/api/v1/auth' });
  await app.register(buildUserRoutes(container.userController, container.authenticate), {
    prefix: '/api/v1/users',
  });

  return app;
}
