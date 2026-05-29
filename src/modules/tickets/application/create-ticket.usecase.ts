/**
 * Caso de uso: Crear ticket.
 *
 * Orquesta: valida invariantes -> persiste vía TicketRepository ->
 * calcula slaDueAt -> programa el job diferido de reasignación ->
 * emite TicketCreated. No conoce HTTP ni SQL.
 *
 * Pendiente de implementación.
 */
export {};
