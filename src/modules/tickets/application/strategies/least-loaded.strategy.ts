import type { UserRepository } from '../../../users/domain/user.repository.js';
import type { ReassignmentStrategy } from '../../domain/reassignment.strategy.js';
import type { TicketProps } from '../../domain/ticket.entity.js';
import type { TicketRepository } from '../../domain/ticket.repository.js';

/**
 * Estrategia "menos cargado": reasigna al AGENT activo con menos tickets
 * abiertos, excluyendo al asignado actual. Reparte la carga y favorece que
 * ningún ticket quede esperando. Empates: orden estable por id.
 */
export class LeastLoadedStrategy implements ReassignmentStrategy {
  constructor(
    private readonly users: UserRepository,
    private readonly tickets: TicketRepository,
  ) {}

  async pickNextAssignee(ticket: TicketProps): Promise<string | null> {
    const agents = await this.users.findByRole('AGENT');
    const candidates = agents.filter((a) => a.id !== ticket.assigneeId).map((a) => a.id);
    if (candidates.length === 0) return null;

    const loads = await this.tickets.countActiveByAssignees(candidates);
    const loadByUser = new Map(loads.map((l) => [l.userId, l.openCount]));

    candidates.sort((a, b) => {
      const diff = (loadByUser.get(a) ?? 0) - (loadByUser.get(b) ?? 0);
      return diff !== 0 ? diff : a.localeCompare(b);
    });

    return candidates[0] ?? null;
  }
}
