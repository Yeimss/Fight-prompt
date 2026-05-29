/**
 * Puertos de salida que los suscriptores de eventos usan para hablar con la
 * infraestructura de colas, SIN acoplar el dominio/aplicación a BullMQ.
 */

/** Programa la verificación diferida de reasignación de un ticket. */
export interface ReassignmentScheduler {
  scheduleCheck(input: {
    ticketId: string;
    /** Snapshot de lastActivityAt; si cambió al ejecutarse el job, se descarta. */
    expectedLastActivityAt: Date;
    delayMs: number;
  }): Promise<void>;
}

export type NotificationType = 'ASSIGNMENT' | 'REASSIGNMENT' | 'ESCALATION' | 'SLA_BREACH';

export interface NotificationJob {
  type: NotificationType;
  ticketId: string;
  recipientUserId: string | null;
  meta?: Record<string, unknown>;
}

/** Encola una notificación (se procesa con reintentos/backoff por la cola). */
export interface NotificationQueue {
  enqueue(job: NotificationJob): Promise<void>;
}
