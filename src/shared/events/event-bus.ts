/**
 * Event bus interno (desacoplamiento).
 *
 * Los casos de uso emiten eventos de dominio (TicketCreated, TicketReassigned,
 * SLABreached...) sin conocer a sus consumidores. Suscriptores reaccionan:
 * notificaciones, auditoría, (re)programación de jobs de reasignación, etc.
 *
 * Empieza como un bus en proceso (EventEmitter). Si en el futuro se separan
 * servicios, se reemplaza esta implementación por un broker (RabbitMQ/Kafka)
 * sin tocar la lógica de negocio.
 *
 * Pendiente de implementación.
 */
export interface DomainEvent {
  readonly name: string;
  readonly occurredAt: Date;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventName: string, handler: (event: DomainEvent) => Promise<void>): void;
}
