import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error.js';
import type { JwtService } from '../security/jwt.service.js';
import { roleHasPermission, type Permission } from '../auth/permissions.js';

/**
 * Crea el middleware `authenticate`: verifica el access token (Bearer) y adjunta
 * el usuario autenticado a la request. Lanza 401 si falta o es inválido.
 */
export function makeAuthenticate(jwt: JwtService): preHandlerHookHandler {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de acceso ausente');
    }

    const token = header.slice('Bearer '.length).trim();
    try {
      const payload = jwt.verifyAccessToken(token);
      request.authUser = { id: payload.sub, role: payload.role };
    } catch {
      throw new UnauthorizedError('Token de acceso inválido o expirado');
    }
  };
}

/**
 * Middleware de autorización (RBAC). Exige que el rol del usuario tenga TODOS los
 * permisos indicados. Debe ejecutarse después de `authenticate`.
 */
export function authorize(...required: Permission[]): preHandlerHookHandler {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = request.authUser;
    if (!user) {
      throw new UnauthorizedError('No autenticado');
    }
    const allowed = required.every((p) => roleHasPermission(user.role, p));
    if (!allowed) {
      throw new ForbiddenError('No tienes permisos para esta acción');
    }
  };
}
