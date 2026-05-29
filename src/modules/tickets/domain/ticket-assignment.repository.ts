import type { AssignmentReason } from './ticket.entity.js';

/** Puerto para registrar el histórico/auditoría de asignaciones (manual). */
export interface CreateAssignmentInput {
  ticketId: string;
  fromUserId: string | null;
  toUserId: string;
  reason: AssignmentReason;
}

export interface TicketAssignmentRepository {
  create(input: CreateAssignmentInput): Promise<void>;
}
