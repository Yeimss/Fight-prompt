import type { Clock } from '../../../shared/clock/clock.js';
import type { EventBus } from '../../../shared/events/event-bus.js';
import { ConflictError, NotFoundError } from '../../../shared/errors/app-error.js';
import { computeSlaDueAt, isTicketActive, type TicketProps } from '../domain/ticket.entity.js';
import type { TicketRepository } from '../domain/ticket.repository.js';
import { TICKET_EVENTS } from '../domain/ticket.events.js';

export interface AddCommentCommand {
  ticketId: string;
  actorId: string;
  body: string;
}

/**
 * Caso de uso: Comentar un ticket (interacción).
 *
 * Es el caso canónico de "actividad": refresca lastActivityAt y recalcula el SLA,
 * lo que efectivamente reinicia el reloj de reasignación. Emite TicketCommented
 * (un suscriptor reprograma el job; el job previo quedará obsoleto porque
 * lastActivityAt cambió).
 */
export class AddCommentUseCase {
  constructor(
    private readonly tickets: TicketRepository,
    private readonly bus: EventBus,
    private readonly clock: Clock,
    private readonly slaMinutes: number,
  ) {}

  async execute(command: AddCommentCommand): Promise<TicketProps> {
    const ticket = await this.tickets.findById(command.ticketId);
    if (!ticket) throw new NotFoundError('Ticket no encontrado');
    if (!isTicketActive(ticket.status)) {
      throw new ConflictError('No se puede comentar un ticket resuelto o cerrado');
    }

    const now = this.clock.now();
    const slaDueAt = computeSlaDueAt(now, this.slaMinutes);

    const updated = await this.tickets.update(ticket.id, {
      lastActivityAt: now,
      slaDueAt,
    });

    await this.bus.publish({
      name: TICKET_EVENTS.Commented,
      occurredAt: now,
      ticketId: ticket.id,
      actorId: command.actorId,
      body: command.body,
    });

    return updated;
  }
}
