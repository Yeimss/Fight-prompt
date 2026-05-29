import type {
  AssignmentReason,
  TicketPriority,
  TicketProps,
  TicketStatus,
} from './ticket.entity.js';

export interface CreateTicketData {
  title: string;
  description: string;
  priority: TicketPriority;
  createdById: string;
  assigneeId: string | null;
  lastActivityAt: Date;
  slaDueAt: Date | null;
}

export interface UpdateTicketData {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
  lastActivityAt?: Date;
  slaDueAt?: Date | null;
  deletedAt?: Date | null;
}

export interface TicketListFilter {
  status?: TicketStatus;
  assigneeId?: string;
  createdById?: string;
  limit?: number;
  offset?: number;
}

/** Carga de trabajo de un agente (tickets activos asignados). */
export interface AgentLoad {
  userId: string;
  openCount: number;
}

/**
 * Datos para reasignar atómicamente. La implementación debe, dentro de una
 * transacción con bloqueo de fila:
 *   1. Bloquear el ticket (UPDLOCK).
 *   2. Verificar que `lastActivityAt` sigue siendo `expectedLastActivityAt`
 *      (idempotencia: si cambió, otro proceso/actividad ya actuó → no hacer nada).
 *   3. Actualizar asignado, SLA, lastActivityAt e incrementar autoReassignCount.
 *   4. Insertar la fila de auditoría en ticket_assignments.
 * Devuelve el ticket actualizado, o null si el guard falló (no se reasignó).
 */
export interface CommitReassignmentInput {
  ticketId: string;
  expectedLastActivityAt: Date;
  fromUserId: string | null;
  toUserId: string;
  reason: AssignmentReason;
  newLastActivityAt: Date;
  /** null detiene el ciclo automático (caso escalado: lo toma un humano). */
  newSlaDueAt: Date | null;
}

export interface TicketRepository {
  create(input: CreateTicketData): Promise<TicketProps>;
  findById(id: string): Promise<TicketProps | null>;
  list(filter: TicketListFilter): Promise<TicketProps[]>;
  update(id: string, patch: UpdateTicketData): Promise<TicketProps>;

  /**
   * Tickets vencidos (status activo, slaDueAt < ahora, con asignado). Usa hints
   * de bloqueo (UPDLOCK, READPAST) para que varios workers tomen filas distintas.
   */
  findOverdue(now: Date, limit: number): Promise<TicketProps[]>;

  /** Reasignación atómica con guard de idempotencia (ver CommitReassignmentInput). */
  commitAutoReassignment(input: CommitReassignmentInput): Promise<TicketProps | null>;

  /** Conteo de tickets activos por agente (para estrategia "menos cargado"). */
  countActiveByAssignees(userIds: string[]): Promise<AgentLoad[]>;
}
