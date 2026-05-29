/**
 * Entidad de dominio Ticket.
 *
 * Contiene las reglas invariantes, SIN dependencias de framework ni de la base
 * de datos:
 *  - Transiciones de estado válidas (p. ej. un ticket CLOSED no se reasigna).
 *  - Cálculo de slaDueAt a partir de lastActivityAt + SLA.
 *  - isOverdue(clock): ¿venció el SLA sin actividad?
 *  - registerActivity(clock): refresca lastActivityAt y recalcula el SLA.
 *
 * Pendiente de implementación.
 */
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

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
