/**
 * Configuración de las colas BullMQ (sobre Redis).
 *  - cola "reassignment": jobs DIFERIDOS por ticket (delay = SLA). Al ejecutarse,
 *    verifica inactividad y dispara el caso de uso de reasignación.
 *  - cola "notifications": envío de correos/avisos con reintentos y backoff.
 *
 * Pendiente de implementación.
 */
export const QUEUE_NAMES = {
  reassignment: 'reassignment',
  notifications: 'notifications',
} as const;
