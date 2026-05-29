/**
 * Implementación del TicketRepository con Prisma sobre SQL Server.
 *
 * Nota SQL Server: para findOverdue se debe usar una consulta con hint de
 * bloqueo (WITH (UPDLOCK, READPAST)) dentro de una transacción para emular el
 * comportamiento "SKIP LOCKED" y evitar que dos workers tomen el mismo ticket.
 *
 * Pendiente de implementación.
 */
export {};
