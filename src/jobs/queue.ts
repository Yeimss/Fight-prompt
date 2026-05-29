import { Queue, type ConnectionOptions } from 'bullmq';
import type {
  NotificationJob,
  NotificationQueue,
  ReassignmentScheduler,
} from '../modules/tickets/application/ports.js';

/**
 * Colas BullMQ (sobre Redis):
 *  - reassignment: jobs DIFERIDOS por ticket + un job repetible de BARRIDO.
 *  - notifications: envío de avisos con reintentos y backoff exponencial.
 */
export const QUEUE_NAMES = {
  reassignment: 'reassignment',
  notifications: 'notifications',
} as const;

export const JOB_NAMES = {
  checkReassignment: 'check-reassignment',
  sweep: 'sweep',
  notify: 'notify',
} as const;

export function createReassignmentQueue(connection: ConnectionOptions): Queue {
  return new Queue(QUEUE_NAMES.reassignment, {
    connection,
    defaultJobOptions: { removeOnComplete: true, removeOnFail: 200 },
  });
}

export function createNotificationsQueue(connection: ConnectionOptions): Queue {
  return new Queue(QUEUE_NAMES.notifications, {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
      removeOnFail: 500,
    },
  });
}

/** Adaptador del puerto ReassignmentScheduler usando la cola de reasignación. */
export class BullReassignmentScheduler implements ReassignmentScheduler {
  constructor(private readonly queue: Queue) {}

  async scheduleCheck(input: {
    ticketId: string;
    expectedLastActivityAt: Date;
    delayMs: number;
  }): Promise<void> {
    await this.queue.add(
      JOB_NAMES.checkReassignment,
      {
        ticketId: input.ticketId,
        expectedLastActivityAt: input.expectedLastActivityAt.toISOString(),
      },
      { delay: input.delayMs },
    );
  }
}

/** Adaptador del puerto NotificationQueue usando la cola de notificaciones. */
export class BullNotificationQueue implements NotificationQueue {
  constructor(private readonly queue: Queue) {}

  async enqueue(job: NotificationJob): Promise<void> {
    await this.queue.add(JOB_NAMES.notify, job);
  }
}
