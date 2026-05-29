import type { TicketProps } from './ticket.entity.js';

/**
 * Estrategia de reasignación (patrón Strategy).
 *
 * Decide A QUIÉN reasignar un ticket vencido. La política es intercambiable
 * sin tocar la infraestructura ni el job:
 *  - RoundRobinStrategy
 *  - LeastLoadedStrategy (agente con menos tickets abiertos)
 *  - SkillBasedStrategy  (por categoría/skill del ticket)
 *
 * Pendiente de implementación.
 */
export interface ReassignmentStrategy {
  /**
   * Devuelve el id del próximo asignado, o null si no hay candidato disponible
   * (en cuyo caso el caso de uso debe escalar a un supervisor).
   */
  pickNextAssignee(ticket: TicketProps): Promise<string | null>;
}
