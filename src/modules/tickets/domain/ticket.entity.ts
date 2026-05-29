import { ACTIVE_STATUSES, TICKET_STATUSES, TICKET_PRIORITIES } from './ticket.constants.js';

/**
 * Entidad de dominio Ticket: reglas invariantes SIN dependencias de framework
 * ni de base de datos. La lógica de tiempo recibe `now` (reloj inyectable) para
 * ser determinista en tests.
 */
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export type AssignmentReason = 'MANUAL' | 'AUTO_REASSIGN' | 'ESCALATION';

export interface TicketProps {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  createdById: string;
  lastActivityAt: Date;
  slaDueAt: Date | null;
  autoReassignCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Calcula el vencimiento del SLA a partir de un instante base. */
export function computeSlaDueAt(from: Date, slaMinutes: number): Date {
  return new Date(from.getTime() + slaMinutes * 60_000);
}

/** ¿El ticket sigue "vivo" (OPEN/IN_PROGRESS)? */
export function isTicketActive(status: TicketStatus): boolean {
  return (ACTIVE_STATUSES as readonly string[]).includes(status);
}

/** ¿El ticket venció el SLA sin actividad y sigue activo? */
export function isOverdue(ticket: TicketProps, now: Date): boolean {
  return (
    isTicketActive(ticket.status) &&
    ticket.slaDueAt !== null &&
    ticket.slaDueAt.getTime() <= now.getTime()
  );
}

/** Transiciones de estado permitidas (un CLOSED es terminal). */
const ALLOWED_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  IN_PROGRESS: ['OPEN', 'RESOLVED', 'CLOSED'],
  RESOLVED: ['IN_PROGRESS', 'CLOSED'],
  CLOSED: [],
};

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}
