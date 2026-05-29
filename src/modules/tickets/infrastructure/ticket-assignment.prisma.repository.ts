import type { PrismaClient } from '@prisma/client';
import type {
  CreateAssignmentInput,
  TicketAssignmentRepository,
} from '../domain/ticket-assignment.repository.js';

/** Implementación del histórico de asignaciones con Prisma sobre SQL Server. */
export class PrismaTicketAssignmentRepository implements TicketAssignmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateAssignmentInput): Promise<void> {
    await this.prisma.ticketAssignment.create({
      data: {
        ticketId: input.ticketId,
        fromUserId: input.fromUserId,
        toUserId: input.toUserId,
        reason: input.reason,
      },
    });
  }
}
