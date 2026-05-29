import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import { authorize } from '../../shared/middlewares/auth.middleware.js';
import { PERMISSIONS } from '../../shared/auth/permissions.js';
import type { UserController } from './infrastructure/user.controller.js';

/**
 * Rutas de usuarios bajo /api/v1/users.
 *   POST /        crear usuario   (requiere USER_MANAGE => ADMIN)
 *   GET  /me      datos del usuario autenticado
 *
 * `authenticate` se inyecta para reutilizar la instancia única de JwtService.
 */
export function buildUserRoutes(controller: UserController, authenticate: preHandlerHookHandler) {
  return async function userRoutes(app: FastifyInstance): Promise<void> {
    app.post(
      '/',
      { preHandler: [authenticate, authorize(PERMISSIONS.USER_MANAGE)] },
      controller.create,
    );

    app.get('/me', { preHandler: [authenticate] }, controller.me);
  };
}
