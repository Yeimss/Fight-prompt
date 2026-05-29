import type { TicketProps } from './ticket.entity.js';

/**
 * Puerto (interfaz) del repositorio de tickets.
 * El dominio depende de esta abstracción; la implementación concreta
 * (Prisma/SQL Server) vive en infrastructure. Permite testear los casos de uso
 * con un repositorio en memoria.
 *
 * Pendiente de implementación.
 */
export interface TicketRepository {
  create(data: Partial<TicketProps>): Promise<TicketProps>;
  findById(id: string): Promise<TicketProps | null>;
  update(id: string, data: Partial<TicketProps>): Promise<TicketProps>;

  /**
   * Devuelve tickets vencidos (status activo, slaDueAt < ahora, con asignado).
   * Debe usar locking (FOR UPDATE / SKIP LOCKED equivalente) para evitar que
   * dos workers reasignen el mismo ticket — clave para idempotencia.
   */
  findOverdue(now: Date, limit: number): Promise<TicketProps[]>;
}
