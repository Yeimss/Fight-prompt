import type { DomainEvent, EventBus } from '../../../../shared/events/event-bus.js';
import type { TicketEventRepository } from '../../domain/ticket-event.repository.js';
import { TICKET_EVENTS } from '../../domain/ticket.events.js';

type TicketEventLike = DomainEvent & { ticketId: string; actorId: string | null };

/**
 * Suscriptor de AUDITORÍA: persiste cada evento de ticket en ticket_events
 * (event sourcing ligero). Se suscribe a todos los tipos de evento del módulo.
 */
export function registerAuditSubscriber(
  bus: EventBus,
  ticketEvents: TicketEventRepository,
): void {
  const handler = async (event: DomainEvent): Promise<void> => {
    const e = event as TicketEventLike;
    const { name, occurredAt, ticketId, actorId, ...payload } = e;
    await ticketEvents.append({ ticketId, type: name, payload, actorId });
  };

  for (const type of Object.values(TICKET_EVENTS)) {
    bus.subscribe(type, handler);
  }
}
