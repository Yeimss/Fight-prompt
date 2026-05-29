/**
 * Lógica de los jobs de reasignación. Dos mecanismos complementarios:
 *
 *  1. Job DIFERIDO por ticket (preciso): programado al crear/actualizar un
 *     ticket con delay = SLA. Comprueba si lastActivityAt cambió; si no, dispara
 *     ReassignTicketUseCase.
 *
 *  2. Job de BARRIDO periódico (red de seguridad): cada N minutos consulta
 *     tickets vencidos (findOverdue con locking) y los reasigna. Garantiza que
 *     ningún ticket quede sin revisar aunque se pierda un job diferido.
 *
 * El job SOLO dispara el caso de uso; las reglas viven en el dominio.
 * Pendiente de implementación.
 */
export {};
