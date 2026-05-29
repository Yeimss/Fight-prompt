import type { DomainEvent, EventBus } from '../../../../shared/events/event-bus.js';
import { isTicketActive } from '../../domain/ticket.entity.js';
import {
  TICKET_EVENTS,
  type TicketReassignedEvent,
  type TicketStatusChangedEvent,
} from '../../domain/ticket.events.js';
import type { ReassignmentScheduler } from '../ports.js';

type WithTicketId = DomainEvent & { ticketId: string };

/**
 * Suscriptor que (RE)PROGRAMA el job diferido de reasignación.
 *
 * Cada vez que un ticket nace o tiene actividad, se programa una verificación
 * con delay = SLA y un snapshot de lastActivityAt (= occurredAt del evento).
 * Si al ejecutarse el job hubo actividad nueva, el snapshot no coincidirá y se
 * descarta — de modo que el job vigente siempre es el último programado.
 *
 * No se reprograma cuando el ticket deja de estar activo (terminal) ni tras una
 * ESCALACIÓN (slaDueAt = null): el ciclo automático se detiene.
 */
export function registerReassignmentScheduler(
  bus: EventBus,
  scheduler: ReassignmentScheduler,
  slaMinutes: number,
): void {
  const delayMs = slaMinutes * 60_000;
  const schedule = (event: WithTicketId): Promise<void> =>
    scheduler.scheduleCheck({
      ticketId: event.ticketId,
      expectedLastActivityAt: event.occurredAt,
      delayMs,
    });

  bus.subscribe(TICKET_EVENTS.Created, (e) => schedule(e as WithTicketId));
  bus.subscribe(TICKET_EVENTS.Assigned, (e) => schedule(e as WithTicketId));
  bus.subscribe(TICKET_EVENTS.Commented, (e) => schedule(e as WithTicketId));

  bus.subscribe(TICKET_EVENTS.Reassigned, (e) => {
    const ev = e as TicketReassignedEvent;
    return ev.slaDueAt ? schedule(ev) : Promise.resolve();
  });

  bus.subscribe(TICKET_EVENTS.StatusChanged, (e) => {
    const ev = e as TicketStatusChangedEvent;
    return isTicketActive(ev.to) ? schedule(ev) : Promise.resolve();
  });
}
