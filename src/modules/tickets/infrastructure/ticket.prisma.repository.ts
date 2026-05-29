import { Prisma, type PrismaClient } from '@prisma/client';
import type {
  TicketPriority,
  TicketProps,
  TicketStatus,
} from '../domain/ticket.entity.js';
import type {
  AgentLoad,
  CommitReassignmentInput,
  CreateTicketData,
  TicketListFilter,
  TicketRepository,
  UpdateTicketData,
} from '../domain/ticket.repository.js';

const ACTIVE = ['OPEN', 'IN_PROGRESS'];

interface TicketRow {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  createdById: string;
  lastActivityAt: Date;
  slaDueAt: Date | null;
  autoReassignCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Implementación del TicketRepository con Prisma sobre SQL Server.
 *
 * La atomicidad de la reasignación se garantiza en `commitAutoReassignment`
 * mediante una transacción que bloquea la fila (WITH (UPDLOCK, ROWLOCK)) y
 * revalida el guard de idempotencia. Así, aunque dos workers detecten el mismo
 * ticket vencido, solo uno consigue reasignarlo.
 */
export class PrismaTicketRepository implements TicketRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateTicketData): Promise<TicketProps> {
    const row = await this.prisma.ticket.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        createdById: input.createdById,
        assigneeId: input.assigneeId,
        lastActivityAt: input.lastActivityAt,
        slaDueAt: input.slaDueAt,
      },
    });
    return this.toProps(row);
  }

  async findById(id: string): Promise<TicketProps | null> {
    const row = await this.prisma.ticket.findFirst({ where: { id, deletedAt: null } });
    return row ? this.toProps(row) : null;
  }

  async list(filter: TicketListFilter): Promise<TicketProps[]> {
    const rows = await this.prisma.ticket.findMany({
      where: {
        deletedAt: null,
        status: filter.status,
        assigneeId: filter.assigneeId,
        createdById: filter.createdById,
      },
      orderBy: { createdAt: 'desc' },
      take: filter.limit ?? 50,
      skip: filter.offset ?? 0,
    });
    return rows.map((r) => this.toProps(r));
  }

  async update(id: string, patch: UpdateTicketData): Promise<TicketProps> {
    const row = await this.prisma.ticket.update({ where: { id }, data: patch });
    return this.toProps(row);
  }

  async findOverdue(now: Date, limit: number): Promise<TicketProps[]> {
    // Consulta indexada por (status, slaDueAt). La seguridad ante concurrencia la
    // aporta el guard transaccional de commitAutoReassignment, no este barrido.
    const rows = await this.prisma.ticket.findMany({
      where: {
        deletedAt: null,
        status: { in: ACTIVE },
        slaDueAt: { not: null, lte: now },
      },
      orderBy: { slaDueAt: 'asc' },
      take: limit,
    });
    return rows.map((r) => this.toProps(r));
  }

  async commitAutoReassignment(input: CommitReassignmentInput): Promise<TicketProps | null> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Bloquear la fila (equivalente a SELECT ... FOR UPDATE).
      const locked = await tx.$queryRaw<TicketRow[]>(
        Prisma.sql`SELECT id, lastActivityAt, status, assigneeId
                   FROM [Ticket] WITH (UPDLOCK, ROWLOCK)
                   WHERE id = ${input.ticketId}`,
      );
      const row = locked[0];
      if (!row) return null;

      // 2. Guard de idempotencia: ¿sigue sin actividad y activo?
      const unchanged = row.lastActivityAt.getTime() === input.expectedLastActivityAt.getTime();
      if (!unchanged || !ACTIVE.includes(row.status)) {
        return null; // otro proceso/actividad ya actuó
      }

      // 3. Reasignar + refrescar SLA + incrementar contador.
      const updated = await tx.ticket.update({
        where: { id: input.ticketId },
        data: {
          assigneeId: input.toUserId,
          lastActivityAt: input.newLastActivityAt,
          slaDueAt: input.newSlaDueAt,
          autoReassignCount: { increment: 1 },
        },
      });

      // 4. Auditoría de la asignación.
      await tx.ticketAssignment.create({
        data: {
          ticketId: input.ticketId,
          fromUserId: input.fromUserId,
          toUserId: input.toUserId,
          reason: input.reason,
        },
      });

      return this.toProps(updated);
    });
  }

  async countActiveByAssignees(userIds: string[]): Promise<AgentLoad[]> {
    if (userIds.length === 0) return [];
    const rows = await this.prisma.ticket.groupBy({
      by: ['assigneeId'],
      where: { assigneeId: { in: userIds }, status: { in: ACTIVE }, deletedAt: null },
      _count: { _all: true },
    });
    return rows
      .filter((r) => r.assigneeId !== null)
      .map((r) => ({ userId: r.assigneeId as string, openCount: r._count._all }));
  }

  private toProps(row: TicketRow): TicketProps {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status as TicketStatus,
      priority: row.priority as TicketPriority,
      assigneeId: row.assigneeId,
      createdById: row.createdById,
      lastActivityAt: row.lastActivityAt,
      slaDueAt: row.slaDueAt,
      autoReassignCount: row.autoReassignCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
