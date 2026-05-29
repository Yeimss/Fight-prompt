import type { EventBus } from '../../../../shared/events/event-bus.js';
import type { NotificationQueue } from '../ports.js';
import { TICKET_EVENTS } from '../../domain/ticket.events.js';
import type {
  SLABreachedEvent,
  TicketAssignedEvent,
  TicketReassignedEvent,
} from '../../domain/ticket.events.js';

/**
 * Suscriptor de NOTIFICACIONES: ante asignación/reasignación/incumplimiento de
 * SLA, encola una notificación (la cola la procesa con reintentos/backoff). No
 * envía directamente: solo encola, desacoplando el caso de uso del canal.
 */
export function registerNotificationSubscriber(
  bus: EventBus,
  notifications: NotificationQueue,
): void {
  bus.subscribe(TICKET_EVENTS.Assigned, async (event) => {
    const e = event as TicketAssignedEvent;
    await notifications.enqueue({
      type: 'ASSIGNMENT',
      ticketId: e.ticketId,
      recipientUserId: e.assigneeId,
    });
  });

  bus.subscribe(TICKET_EVENTS.Reassigned, async (event) => {
    const e = event as TicketReassignedEvent;
    await notifications.enqueue({
      type: e.reason === 'ESCALATION' ? 'ESCALATION' : 'REASSIGNMENT',
      ticketId: e.ticketId,
      recipientUserId: e.toUserId,
      meta: { from: e.fromUserId, reason: e.reason },
    });
  });

  bus.subscribe(TICKET_EVENTS.SLABreached, async (event) => {
    const e = event as SLABreachedEvent;
    await notifications.enqueue({
      type: 'SLA_BREACH',
      ticketId: e.ticketId,
      recipientUserId: e.assigneeId,
      meta: { autoReassignCount: e.autoReassignCount },
    });
  });
}
