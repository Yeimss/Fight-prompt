import type { Job, Processor } from 'bullmq';
import { logger } from '../shared/logger/logger.js';
import type { ReassignTicketUseCase } from '../modules/tickets/application/reassign-ticket.usecase.js';
import type { TicketRepository } from '../modules/tickets/domain/ticket.repository.js';
import { JOB_NAMES } from './queue.js';

export interface CheckReassignmentJobData {
  ticketId: string;
  expectedLastActivityAt: string; // ISO
}

export interface ReassignmentProcessorDeps {
  reassign: ReassignTicketUseCase;
  tickets: TicketRepository;
  sweepLimit: number;
  now: () => Date;
}

/**
 * Procesador de la cola `reassignment`. Atiende dos tipos de job:
 *
 *  - check-reassignment (diferido por ticket): al vencer el delay (= SLA),
 *    verifica si hubo actividad desde que se programó; si no, reasigna.
 *  - sweep (repetible, red de seguridad): consulta los tickets vencidos y los
 *    reasigna. Garantiza que ninguno quede sin revisar aunque se pierda un job.
 *
 * El job SOLO dispara el caso de uso; la lógica vive en el dominio/aplicación.
 */
export function createReassignmentProcessor(deps: ReassignmentProcessorDeps): Processor {
  return async (job: Job) => {
    if (job.name === JOB_NAMES.checkReassignment) {
      const data = job.data as CheckReassignmentJobData;
      const result = await deps.reassign.execute({
        ticketId: data.ticketId,
        expectedLastActivityAt: new Date(data.expectedLastActivityAt),
        trigger: 'deferred',
      });
      return result;
    }

    if (job.name === JOB_NAMES.sweep) {
      const overdue = await deps.tickets.findOverdue(deps.now(), deps.sweepLimit);
      logger.info({ count: overdue.length }, 'Barrido de reasignación: tickets vencidos');
      const results = await Promise.all(
        overdue.map((t) => deps.reassign.execute({ ticketId: t.id, trigger: 'sweep' })),
      );
      return {
        scanned: overdue.length,
        reassigned: results.filter((r) => r.status === 'reassigned').length,
        escalated: results.filter((r) => r.status === 'escalated').length,
      };
    }

    return undefined;
  };
}
