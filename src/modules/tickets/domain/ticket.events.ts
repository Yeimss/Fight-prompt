import type { DomainEvent } from '../../../shared/events/event-bus.js';
import type { AssignmentReason, TicketStatus } from './ticket.entity.js';

/**
 * Eventos de dominio del módulo de tickets. Los casos de uso los emiten sin
 * conocer a sus consumidores (auditoría, notificaciones, (re)programación del
 * job de reasignación). Añadir un consumidor = añadir un suscriptor (OCP).
 */
export const TICKET_EVENTS = {
  Created: 'TicketCreated',
  Assigned: 'TicketAssigned',
  Reassigned: 'TicketReassigned',
  StatusChanged: 'TicketStatusChanged',
  Commented: 'TicketCommented',
  SLABreached: 'SLABreached',
} as const;

interface BaseTicketEvent extends DomainEvent {
  ticketId: string;
  /** Usuario que originó el evento; null si lo provocó el sistema (worker). */
  actorId: string | null;
}

export interface TicketCreatedEvent extends BaseTicketEvent {
  name: typeof TICKET_EVENTS.Created;
  assigneeId: string | null;
  slaDueAt: Date | null;
}

export interface TicketAssignedEvent extends BaseTicketEvent {
  name: typeof TICKET_EVENTS.Assigned;
  assigneeId: string;
  slaDueAt: Date | null;
}

export interface TicketReassignedEvent extends BaseTicketEvent {
  name: typeof TICKET_EVENTS.Reassigned;
  fromUserId: string | null;
  toUserId: string;
  reason: AssignmentReason;
  slaDueAt: Date | null;
}

export interface TicketStatusChangedEvent extends BaseTicketEvent {
  name: typeof TICKET_EVENTS.StatusChanged;
  from: TicketStatus;
  to: TicketStatus;
}

export interface TicketCommentedEvent extends BaseTicketEvent {
  name: typeof TICKET_EVENTS.Commented;
  body: string;
}

export interface SLABreachedEvent extends BaseTicketEvent {
  name: typeof TICKET_EVENTS.SLABreached;
  assigneeId: string | null;
  autoReassignCount: number;
}

export type TicketDomainEvent =
  | TicketCreatedEvent
  | TicketAssignedEvent
  | TicketReassignedEvent
  | TicketStatusChangedEvent
  | TicketCommentedEvent
  | SLABreachedEvent;
