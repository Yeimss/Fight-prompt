import { logger } from '../logger/logger.js';

/**
 * Event bus interno (desacoplamiento).
 *
 * Los casos de uso emiten eventos de dominio sin conocer a sus consumidores.
 * Empieza como un bus EN PROCESO (basado en un registro de handlers). Si en el
 * futuro se separan servicios, se reemplaza esta implementación por un broker
 * (RabbitMQ/Kafka) respetando la interfaz, sin tocar la lógica de negocio.
 */
export interface DomainEvent {
  readonly name: string;
  readonly occurredAt: Date;
}

export type EventHandler<E extends DomainEvent = DomainEvent> = (event: E) => Promise<void>;

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventName: string, handler: EventHandler): void;
}

/**
 * Implementación en proceso. Los handlers se ejecutan de forma concurrente y sus
 * errores se aíslan: un suscriptor que falla NO interrumpe al publicador ni a los
 * demás suscriptores (solo se loggea). La publicación es "fire-and-collect": se
 * espera a que todos terminen, pero ninguna excepción se propaga al emisor.
 */
export class InProcessEventBus implements EventBus {
  private readonly handlers = new Map<string, EventHandler[]>();

  subscribe(eventName: string, handler: EventHandler): void {
    const list = this.handlers.get(eventName) ?? [];
    list.push(handler);
    this.handlers.set(eventName, list);
  }

  async publish(event: DomainEvent): Promise<void> {
    const list = this.handlers.get(event.name) ?? [];
    await Promise.all(
      list.map((handler) =>
        handler(event).catch((err) => {
          logger.error({ err, event: event.name }, 'Error en suscriptor de evento');
        }),
      ),
    );
  }
}
