/**
 * Rutas del módulo de tickets (Fastify plugin).
 *   POST   /api/v1/tickets
 *   GET    /api/v1/tickets
 *   GET    /api/v1/tickets/:id
 *   PATCH  /api/v1/tickets/:id
 *   POST   /api/v1/tickets/:id/assign
 *   POST   /api/v1/tickets/:id/comments   (registra actividad -> refresca SLA)
 *
 * Protegidas por authenticate + authorize según rol.
 * Pendiente de implementación.
 */
export {};
