import type { UserRepository } from '../../../users/domain/user.repository.js';
import type { ReassignmentStrategy } from '../../domain/reassignment.strategy.js';
import type { TicketProps } from '../../domain/ticket.entity.js';

/**
 * Estrategia "round-robin": rota secuencialmente entre los AGENT activos,
 * excluyendo al asignado actual. El índice de rotación es en memoria (suficiente
 * para una sola instancia de worker; para multi-instancia convendría persistirlo
 * en Redis).
 */
export class RoundRobinStrategy implements ReassignmentStrategy {
  private cursor = 0;

  constructor(private readonly users: UserRepository) {}

  async pickNextAssignee(ticket: TicketProps): Promise<string | null> {
    const agents = (await this.users.findByRole('AGENT'))
      .map((a) => a.id)
      .filter((id) => id !== ticket.assigneeId)
      .sort();
    if (agents.length === 0) return null;

    const pick = agents[this.cursor % agents.length] ?? null;
    this.cursor = (this.cursor + 1) % agents.length;
    return pick;
  }
}
