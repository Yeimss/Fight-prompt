import type { Clock } from '../../../shared/clock/clock.js';
import type { EventBus } from '../../../shared/events/event-bus.js';
import { NotFoundError } from '../../../shared/errors/app-error.js';
import type { UserRepository } from '../../users/domain/user.repository.js';
import { computeSlaDueAt, type TicketPriority, type TicketProps } from '../domain/ticket.entity.js';
import type { TicketAssignmentRepository } from '../domain/ticket-assignment.repository.js';
import type { TicketRepository } from '../domain/ticket.repository.js';
import { TICKET_EVENTS } from '../domain/ticket.events.js';

export interface CreateTicketCommand {
  title: string;
  description: string;
  priority: TicketPriority;
  createdById: string;
  assigneeId?: string | null;
}

/**
 * Caso de uso: Crear ticket.
 *
 * Calcula y MATERIALIZA slaDueAt (= ahora + SLA) para poder indexar y consultar
 * "qué tickets vencieron". Emite TicketCreated (y TicketAssigned si nace
 * asignado); un suscriptor se encarga de programar el job diferido de
 * reasignación — el caso de uso no conoce BullMQ.
 */
export class CreateTicketUseCase {
  constructor(
    private readonly tickets: TicketRepository,
    private readonly users: UserRepository,
    private readonly assignments: TicketAssignmentRepository,
    private readonly bus: EventBus,
    private readonly clock: Clock,
    private readonly slaMinutes: number,
  ) {}

  async execute(command: CreateTicketCommand): Promise<TicketProps> {
    const now = this.clock.now();
    const assigneeId = command.assigneeId ?? null;

    if (assigneeId) {
      const assignee = await this.users.findById(assigneeId);
      if (!assignee || !assignee.isActive) {
        throw new NotFoundError('El usuario asignado no existe o está inactivo');
      }
    }

    const slaDueAt = computeSlaDueAt(now, this.slaMinutes);

    const ticket = await this.tickets.create({
      title: command.title,
      description: command.description,
      priority: command.priority,
      createdById: command.createdById,
      assigneeId,
      lastActivityAt: now,
      slaDueAt,
    });

    if (assigneeId) {
      await this.assignments.create({
        ticketId: ticket.id,
        fromUserId: null,
        toUserId: assigneeId,
        reason: 'MANUAL',
      });
    }

    await this.bus.publish({
      name: TICKET_EVENTS.Created,
      occurredAt: now,
      ticketId: ticket.id,
      actorId: command.createdById,
      assigneeId,
      slaDueAt,
    });

    return ticket;
  }
}
