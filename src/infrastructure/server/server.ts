import Fastify, { type FastifyInstance } from 'fastify';
import { config } from '../../shared/config/index.js';

/**
 * Construye y configura la instancia de Fastify:
 *  - Plugins de seguridad: helmet, cors, rate-limit, jwt.
 *  - Logger Pino + correlationId por request.
 *  - errorHandler central.
 *  - Health checks (/health, /ready).
 *  - Registro de rutas por módulo bajo /api/v1.
 *
 * La implementación detallada queda pendiente; este esqueleto deja un servidor
 * mínimo arrancable con un health check.
 */
export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: config.logLevel },
  });

  app.get('/health', async () => ({ status: 'ok' }));

  // TODO: registrar plugins de seguridad, errorHandler y rutas de módulos.
  //   await app.register(import('@fastify/helmet'));
  //   await app.register(authRoutes,    { prefix: '/api/v1/auth' });
  //   await app.register(usersRoutes,   { prefix: '/api/v1/users' });
  //   await app.register(ticketsRoutes, { prefix: '/api/v1/tickets' });

  return app;
}
