import type { Clock } from '../../../shared/clock/clock.js';
import type { EventBus } from '../../../shared/events/event-bus.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/app-error.js';
import {
  canTransition,
  computeSlaDueAt,
  isTicketActive,
  type TicketProps,
  type TicketStatus,
} from '../domain/ticket.entity.js';
import type { TicketRepository } from '../domain/ticket.repository.js';
import { TICKET_EVENTS } from '../domain/ticket.events.js';

export interface ChangeStatusCommand {
  ticketId: string;
  to: TicketStatus;
  actorId: string;
}

/**
 * Caso de uso: Cambiar el estado de un ticket (incluye cerrar).
 *
 * Valida la transición. Si el ticket pasa a un estado terminal (RESOLVED/CLOSED)
 * se anula slaDueAt para detener la reasignación automática; si sigue activo se
 * refresca el SLA. Emite TicketStatusChanged.
 */
export class ChangeStatusUseCase {
  constructor(
    private readonly tickets: TicketRepository,
    private readonly bus: EventBus,
    private readonly clock: Clock,
    private readonly slaMinutes: number,
  ) {}

  async execute(command: ChangeStatusCommand): Promise<TicketProps> {
    const ticket = await this.tickets.findById(command.ticketId);
    if (!ticket) throw new NotFoundError('Ticket no encontrado');

    if (!canTransition(ticket.status, command.to)) {
      throw new ConflictError(`Transición inválida: ${ticket.status} → ${command.to}`);
    }

    const now = this.clock.now();
    const stillActive = isTicketActive(command.to);
    const slaDueAt = stillActive ? computeSlaDueAt(now, this.slaMinutes) : null;

    const updated = await this.tickets.update(ticket.id, {
      status: command.to,
      lastActivityAt: now,
      slaDueAt,
    });

    await this.bus.publish({
      name: TICKET_EVENTS.StatusChanged,
      occurredAt: now,
      ticketId: ticket.id,
      actorId: command.actorId,
      from: ticket.status,
      to: command.to,
    });

    return updated;
  }
}
