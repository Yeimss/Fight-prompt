import { logger } from '../shared/logger/logger.js';

/**
 * Punto de entrada del PROCESO WORKER (separado del API).
 *
 * Levanta los Workers BullMQ (reassignment, notifications) y programa el job
 * repetible de barrido. Se despliega y escala de forma independiente del API:
 * más carga de reasignación -> más réplicas de este proceso.
 *
 * Pendiente de implementación.
 */
async function bootstrapWorker(): Promise<void> {
  logger.info('Worker de jobs iniciado (pendiente de implementación)');
  // TODO: instanciar Workers de BullMQ y el scheduler de barrido.
}

bootstrapWorker().catch((err) => {
  logger.error({ err }, 'Fallo al iniciar el worker');
  process.exit(1);
});
