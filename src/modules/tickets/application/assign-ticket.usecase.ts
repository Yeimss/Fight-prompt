import type { Clock } from '../../../shared/clock/clock.js';
import type { EventBus } from '../../../shared/events/event-bus.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/app-error.js';
import type { UserRepository } from '../../users/domain/user.repository.js';
import { computeSlaDueAt, isTicketActive, type TicketProps } from '../domain/ticket.entity.js';
import type { TicketAssignmentRepository } from '../domain/ticket-assignment.repository.js';
import type { TicketRepository } from '../domain/ticket.repository.js';
import { TICKET_EVENTS } from '../domain/ticket.events.js';

export interface AssignTicketCommand {
  ticketId: string;
  assigneeId: string;
  actorId: string;
}

/**
 * Caso de uso: Asignar ticket (manual).
 * Refresca lastActivityAt y el SLA, registra la asignación (MANUAL) y emite
 * TicketAssigned (un suscriptor reprograma el job de reasignación).
 */
export class AssignTicketUseCase {
  constructor(
    private readonly tickets: TicketRepository,
    private readonly users: UserRepository,
    private readonly assignments: TicketAssignmentRepository,
    private readonly bus: EventBus,
    private readonly clock: Clock,
    private readonly slaMinutes: number,
  ) {}

  async execute(command: AssignTicketCommand): Promise<TicketProps> {
    const ticket = await this.tickets.findById(command.ticketId);
    if (!ticket) throw new NotFoundError('Ticket no encontrado');
    if (!isTicketActive(ticket.status)) {
      throw new ConflictError('No se puede asignar un ticket resuelto o cerrado');
    }

    const assignee = await this.users.findById(command.assigneeId);
    if (!assignee || !assignee.isActive) {
      throw new NotFoundError('El usuario asignado no existe o está inactivo');
    }

    const now = this.clock.now();
    const slaDueAt = computeSlaDueAt(now, this.slaMinutes);
    const fromUserId = ticket.assigneeId;

    const updated = await this.tickets.update(ticket.id, {
      assigneeId: command.assigneeId,
      lastActivityAt: now,
      slaDueAt,
    });

    await this.assignments.create({
      ticketId: ticket.id,
      fromUserId,
      toUserId: command.assigneeId,
      reason: 'MANUAL',
    });

    await this.bus.publish({
      name: TICKET_EVENTS.Assigned,
      occurredAt: now,
      ticketId: ticket.id,
      actorId: command.actorId,
      assigneeId: command.assigneeId,
      slaDueAt,
    });

    return updated;
  }
}
