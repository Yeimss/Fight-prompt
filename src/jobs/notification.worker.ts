import type { Job, Processor } from 'bullmq';
import { logger } from '../shared/logger/logger.js';
import type { NotificationJob } from '../modules/tickets/application/ports.js';

/**
 * Procesador de la cola `notifications`.
 *
 * Implementación STUB: por ahora solo loggea la notificación. Aquí se enchufaría
 * el adaptador real (email/Slack). Los reintentos y el backoff los gestiona la
 * propia cola (ver createNotificationsQueue); si este handler lanza, BullMQ
 * reintenta con backoff exponencial.
 */
export function createNotificationProcessor(): Processor {
  return async (job: Job) => {
    const data = job.data as NotificationJob;
    logger.info(
      { type: data.type, ticketId: data.ticketId, recipient: data.recipientUserId, meta: data.meta },
      'Notificación enviada (stub)',
    );
  };
}
