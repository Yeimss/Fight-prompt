/**
 * Valores válidos del dominio de tickets (SQL Server los persiste como String).
 * Se usan para validar en el borde (Zod) y para acotar los union types.
 */
export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export const ASSIGNMENT_REASONS = ['MANUAL', 'AUTO_REASSIGN', 'ESCALATION'] as const;

/** Estados en los que un ticket sigue "vivo" y puede vencer / reasignarse. */
export const ACTIVE_STATUSES = ['OPEN', 'IN_PROGRESS'] as const;
