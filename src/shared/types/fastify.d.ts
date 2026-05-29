import 'fastify';
import type { Role } from '../auth/roles.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Usuario autenticado, poblado por el middleware `authenticate`. */
    authUser?: {
      id: string;
      role: Role;
    };
  }
}
