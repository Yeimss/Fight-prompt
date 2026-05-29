import type { Clock } from '../../../shared/clock/clock.js';
import type { EventBus } from '../../../shared/events/event-bus.js';
import { logger } from '../../../shared/logger/logger.js';
import type { UserRepository } from '../../users/domain/user.repository.js';
import type { ReassignmentStrategy } from '../domain/reassignment.strategy.js';
import { computeSlaDueAt, isOverdue, isTicketActive } from '../domain/ticket.entity.js';
import type { TicketRepository } from '../domain/ticket.repository.js';
import { TICKET_EVENTS } from '../domain/ticket.events.js';

export type ReassignTrigger = 'deferred' | 'sweep';

export interface ReassignCommand {
  ticketId: string;
  /** Snapshot de lastActivityAt al programar el job diferido (detección de actividad). */
  expectedLastActivityAt?: Date;
  trigger: ReassignTrigger;
}

export interface ReassignResult {
  status: 'reassigned' | 'escalated' | 'skipped';
  reason?: string;
  toUserId?: string;
}

/**
 * Caso de uso: Reasignación automática (núcleo del sistema).
 *
 * Disparado por el job (diferido o de barrido). El job SOLO dispara; la política
 * de "a quién" vive en ReassignmentStrategy. Garantías:
 *  - Idempotencia/locking: la escritura va por commitAutoReassignment, que
 *    bloquea la fila y revalida que no hubo actividad (dos workers no reasignan
 *    el mismo ticket).
 *  - Detección de actividad: si lastActivityAt cambió desde que se programó el
 *    job, se descarta.
 *  - Tope/escalado: tras MAX reasignaciones, se escala a un supervisor (ADMIN)
 *    con razón ESCALATION y se detiene el ciclo (slaDueAt = null).
 */
export class ReassignTicketUseCase {
  constructor(
    private readonly tickets: TicketRepository,
    private readonly users: UserRepository,
    private readonly strategy: ReassignmentStrategy,
    private readonly bus: EventBus,
    private readonly clock: Clock,
    private readonly slaMinutes: number,
    private readonly maxAutoReassignments: number,
  ) {}

  async execute(command: ReassignCommand): Promise<ReassignResult> {
    const now = this.clock.now();
    const ticket = await this.tickets.findById(command.ticketId);

    if (!ticket) return { status: 'skipped', reason: 'not_found' };
    if (!isTicketActive(ticket.status)) return { status: 'skipped', reason: 'inactive' };

    // ¿Hubo actividad desde que se programó este job? (solo aplica al diferido)
    if (
      command.expectedLastActivityAt &&
      ticket.lastActivityAt.getTime() !== command.expectedLastActivityAt.getTime()
    ) {
      return { status: 'skipped', reason: 'activity_detected' };
    }

    // ¿Realmente venció? (el barrido ya lo prefiltra; doble verificación barata)
    if (!isOverdue(ticket, now)) return { status: 'skipped', reason: 'not_overdue' };

    // ── Tope alcanzado → escalar a supervisor ──
    if (ticket.autoReassignCount >= this.maxAutoReassignments) {
      return this.escalate(ticket.id, ticket.assigneeId, ticket.lastActivityAt, ticket.autoReassignCount, now);
    }

    // ── Reasignación normal según estrategia ──
    const nextAssignee = await this.strategy.pickNextAssignee(ticket);
    if (!nextAssignee) {
      await this.publishSlaBreached(ticket.id, ticket.assigneeId, ticket.autoReassignCount, now);
      return { status: 'skipped', reason: 'no_candidate' };
    }

    const newSlaDueAt = computeSlaDueAt(now, this.slaMinutes);
    const committed = await this.tickets.commitAutoReassignment({
      ticketId: ticket.id,
      expectedLastActivityAt: ticket.lastActivityAt,
      fromUserId: ticket.assigneeId,
      toUserId: nextAssignee,
      reason: 'AUTO_REASSIGN',
      newLastActivityAt: now,
      newSlaDueAt,
    });

    if (!committed) return { status: 'skipped', reason: 'lost_race' };

    await this.bus.publish({
      name: TICKET_EVENTS.Reassigned,
      occurredAt: now,
      ticketId: ticket.id,
      actorId: null,
      fromUserId: ticket.assigneeId,
      toUserId: nextAssignee,
      reason: 'AUTO_REASSIGN',
      slaDueAt: newSlaDueAt,
    });

    logger.info({ ticketId: ticket.id, toUserId: nextAssignee }, 'Ticket reasignado automáticamente');
    return { status: 'reassigned', toUserId: nextAssignee };
  }

  private async escalate(
    ticketId: string,
    currentAssignee: string | null,
    expectedLastActivityAt: Date,
    autoReassignCount: number,
    now: Date,
  ): Promise<ReassignResult> {
    const admins = await this.users.findByRole('ADMIN');
    const supervisor = admins.find((a) => a.id !== currentAssignee) ?? admins[0];

    if (!supervisor) {
      await this.publishSlaBreached(ticketId, currentAssignee, autoReassignCount, now);
      return { status: 'skipped', reason: 'no_supervisor' };
    }

    // slaDueAt = null detiene el ciclo automático: ahora lo atiende un humano.
    const committed = await this.tickets.commitAutoReassignment({
      ticketId,
      expectedLastActivityAt,
      fromUserId: currentAssignee,
      toUserId: supervisor.id,
      reason: 'ESCALATION',
      newLastActivityAt: now,
      newSlaDueAt: null,
    });

    if (!committed) return { status: 'skipped', reason: 'lost_race' };

    await this.publishSlaBreached(ticketId, currentAssignee, autoReassignCount, now);
    await this.bus.publish({
      name: TICKET_EVENTS.Reassigned,
      occurredAt: now,
      ticketId,
      actorId: null,
      fromUserId: currentAssignee,
      toUserId: supervisor.id,
      reason: 'ESCALATION',
      slaDueAt: null,
    });

    logger.warn({ ticketId, supervisorId: supervisor.id }, 'Ticket escalado a supervisor');
    return { status: 'escalated', toUserId: supervisor.id };
  }

  private async publishSlaBreached(
    ticketId: string,
    assigneeId: string | null,
    autoReassignCount: number,
    now: Date,
  ): Promise<void> {
    await this.bus.publish({
      name: TICKET_EVENTS.SLABreached,
      occurredAt: now,
      ticketId,
      actorId: null,
      assigneeId,
      autoReassignCount,
    });
  }
}
