/**
 * Eventos de dominio del módulo de tickets.
 *  - TicketCreated
 *  - TicketAssigned
 *  - TicketReassigned   (incluye motivo: AUTO_REASSIGN / ESCALATION)
 *  - SLABreached
 *
 * Consumidos por suscriptores del event bus (notificaciones, auditoría,
 * (re)programación de jobs).
 *
 * Pendiente de implementación.
 */
export {};
