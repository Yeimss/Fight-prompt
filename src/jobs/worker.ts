import { Worker } from 'bullmq';
import { buildContainer } from '../app.js';
import { config } from '../shared/config/index.js';
import { logger } from '../shared/logger/logger.js';
import { redisConnectionOptions } from '../infrastructure/redis/connection.js';
import { JOB_NAMES, QUEUE_NAMES } from './queue.js';
import { createReassignmentProcessor } from './reassignment.job.js';
import { createNotificationProcessor } from './notification.worker.js';

/**
 * Proceso WORKER (separado del API): consume las colas BullMQ y ejecuta el
 * barrido periódico. Se despliega y escala de forma independiente del API.
 */
async function bootstrapWorker(): Promise<void> {
  const container = buildContainer();

  const reassignmentWorker = new Worker(
    QUEUE_NAMES.reassignment,
    createReassignmentProcessor({
      reassign: container.reassignUseCase,
      tickets: container.ticketRepo,
      sweepLimit: 200,
      now: () => new Date(),
    }),
    { connection: redisConnectionOptions, concurrency: 5 },
  );

  const notificationsWorker = new Worker(QUEUE_NAMES.notifications, createNotificationProcessor(), {
    connection: redisConnectionOptions,
    concurrency: 10,
  });

  reassignmentWorker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err }, 'Job de reasignación falló'),
  );
  notificationsWorker.on('failed', (job, err) =>
    logger.error({ jobId: job?.id, err }, 'Job de notificación falló'),
  );

  // Barrido repetible (red de seguridad): cada N minutos revisa tickets vencidos.
  await container.reassignmentQueue.add(
    JOB_NAMES.sweep,
    {},
    { repeat: { every: config.tickets.sweepIntervalMinutes * 60_000 }, removeOnComplete: true },
  );

  logger.info(
    { sweepEveryMin: config.tickets.sweepIntervalMinutes },
    'Worker iniciado: reassignment + notifications + barrido',
  );

  const shutdown = async (): Promise<void> => {
    logger.info('Cerrando worker…');
    await Promise.allSettled([
      reassignmentWorker.close(),
      notificationsWorker.close(),
      container.reassignmentQueue.close(),
      container.notificationsQueue.close(),
    ]);
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrapWorker().catch((err) => {
  logger.error({ err }, 'Fallo al iniciar el worker');
  process.exit(1);
});
