import type { FastifyInstance } from 'fastify';
import { loginRateLimit } from '../../shared/middlewares/rate-limit.js';
import type { AuthController } from './infrastructure/auth.controller.js';

/**
 * Rutas de autenticación. Se registran bajo el prefijo /api/v1/auth.
 *   POST /login    (rate-limit estricto anti fuerza bruta)
 *   POST /refresh
 *   POST /logout
 */
export function buildAuthRoutes(controller: AuthController) {
  return async function authRoutes(app: FastifyInstance): Promise<void> {
    app.post('/login', { config: loginRateLimit }, controller.login);
    app.post('/refresh', controller.refresh);
    app.post('/logout', controller.logout);
  };
}
