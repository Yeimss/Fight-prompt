import { NotFoundError } from '../../../shared/errors/app-error.js';
import type { Role } from '../../../shared/auth/roles.js';
import type { TicketProps } from '../domain/ticket.entity.js';
import type { TicketListFilter, TicketRepository } from '../domain/ticket.repository.js';

/**
 * Consultas de tickets. Aplica visibilidad por rol: USER solo ve sus tickets
 * (creados o asignados); ADMIN/AGENT ven todos.
 */
export class GetTicketsUseCase {
  constructor(private readonly tickets: TicketRepository) {}

  async list(
    requester: { id: string; role: Role },
    filter: TicketListFilter,
  ): Promise<TicketProps[]> {
    if (requester.role === 'USER') {
      // USER: limitado a lo que creó (el repo filtra por createdById).
      return this.tickets.list({ ...filter, createdById: requester.id });
    }
    return this.tickets.list(filter);
  }

  async getById(requester: { id: string; role: Role }, id: string): Promise<TicketProps> {
    const ticket = await this.tickets.findById(id);
    if (!ticket) throw new NotFoundError('Ticket no encontrado');

    if (
      requester.role === 'USER' &&
      ticket.createdById !== requester.id &&
      ticket.assigneeId !== requester.id
    ) {
      // No revelar existencia a quien no le corresponde.
      throw new NotFoundError('Ticket no encontrado');
    }
    return ticket;
  }
}
