import type { PrismaClient } from '@prisma/client';
import type {
  AppendTicketEventInput,
  TicketEventRepository,
} from '../domain/ticket-event.repository.js';

/**
 * Registro inmutable de eventos (event sourcing ligero) con Prisma sobre SQL
 * Server. El payload se serializa a JSON. Solo se insertan filas, nunca se
 * actualizan ni borran.
 */
export class PrismaTicketEventRepository implements TicketEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async append(input: AppendTicketEventInput): Promise<void> {
    await this.prisma.ticketEvent.create({
      data: {
        ticketId: input.ticketId,
        type: input.type,
        payload: JSON.stringify(input.payload ?? {}),
        actorId: input.actorId,
      },
    });
  }
}
