import type { Role } from './roles.js';

/**
 * Matriz de permisos explícita (RBAC).
 *
 * Cada acción del sistema es un "permiso" granular. Los roles se definen como un
 * conjunto de permisos. Las rutas exigen un permiso concreto (no un rol), lo que
 * permite reasignar capacidades entre roles sin tocar los controllers.
 *
 *  Acción \ Rol          | ADMIN | AGENT | USER
 *  ----------------------|-------|-------|------
 *  Gestionar usuarios    |   ✓   |       |
 *  Crear ticket          |   ✓   |   ✓   |  ✓
 *  Ver todos los tickets |   ✓   |   ✓   |
 *  Ver tickets propios   |   ✓   |   ✓   |  ✓
 *  Asignar ticket        |   ✓   |   ✓   |
 *  Reasignar (manual)    |   ✓   |   ✓   |
 *  Cerrar ticket         |   ✓   |   ✓   |
 *  Comentar / actualizar |   ✓   |   ✓   |  ✓
 *
 * Nota: la reasignación AUTOMÁTICA por SLA la ejecuta el sistema (worker), no un
 * usuario, por lo que no requiere permiso de rol.
 */
export const PERMISSIONS = {
  USER_MANAGE: 'user:manage',
  TICKET_CREATE: 'ticket:create',
  TICKET_READ_ALL: 'ticket:read:all',
  TICKET_READ_OWN: 'ticket:read:own',
  TICKET_ASSIGN: 'ticket:assign',
  TICKET_REASSIGN: 'ticket:reassign',
  TICKET_CLOSE: 'ticket:close',
  TICKET_COMMENT: 'ticket:comment',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const P = PERMISSIONS;

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: [
    P.USER_MANAGE,
    P.TICKET_CREATE,
    P.TICKET_READ_ALL,
    P.TICKET_READ_OWN,
    P.TICKET_ASSIGN,
    P.TICKET_REASSIGN,
    P.TICKET_CLOSE,
    P.TICKET_COMMENT,
  ],
  AGENT: [
    P.TICKET_CREATE,
    P.TICKET_READ_ALL,
    P.TICKET_READ_OWN,
    P.TICKET_ASSIGN,
    P.TICKET_REASSIGN,
    P.TICKET_CLOSE,
    P.TICKET_COMMENT,
  ],
  USER: [P.TICKET_CREATE, P.TICKET_READ_OWN, P.TICKET_COMMENT],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
