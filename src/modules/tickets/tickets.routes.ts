import type { FastifyInstance, preHandlerHookHandler } from 'fastify';
import { authorize } from '../../shared/middlewares/auth.middleware.js';
import { PERMISSIONS } from '../../shared/auth/permissions.js';
import type { TicketController } from './infrastructure/ticket.controller.js';

/**
 * Rutas de tickets bajo /api/v1/tickets. Todas requieren autenticación; cada una
 * exige además el permiso correspondiente de la matriz RBAC.
 *
 *   POST   /                crear              (TICKET_CREATE)
 *   GET    /                listar             (TICKET_READ_OWN — el caso de uso filtra por rol)
 *   GET    /:id             ver                (TICKET_READ_OWN)
 *   POST   /:id/assign      asignar manual     (TICKET_ASSIGN)
 *   POST   /:id/comments    comentar/actividad (TICKET_COMMENT)
 *   PATCH  /:id/status      cambiar estado     (TICKET_CLOSE)
 */
export function buildTicketRoutes(
  controller: TicketController,
  authenticate: preHandlerHookHandler,
) {
  return async function ticketRoutes(app: FastifyInstance): Promise<void> {
    app.addHook('preHandler', authenticate);

    app.post('/', { preHandler: authorize(PERMISSIONS.TICKET_CREATE) }, controller.create);
    app.get('/', { preHandler: authorize(PERMISSIONS.TICKET_READ_OWN) }, controller.list);
    app.get('/:id', { preHandler: authorize(PERMISSIONS.TICKET_READ_OWN) }, controller.getById);
    app.post('/:id/assign', { preHandler: authorize(PERMISSIONS.TICKET_ASSIGN) }, controller.assign);
    app.post(
      '/:id/comments',
      { preHandler: authorize(PERMISSIONS.TICKET_COMMENT) },
      controller.comment,
    );
    app.patch(
      '/:id/status',
      { preHandler: authorize(PERMISSIONS.TICKET_CLOSE) },
      controller.changeStatus,
    );
  };
}
