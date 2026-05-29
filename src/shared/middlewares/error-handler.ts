/**
 * Manejador central de errores (se registra como errorHandler de Fastify).
 *
 * - AppError  -> respuesta HTTP con su statusCode/code.
 * - ZodError  -> 422 con detalle de validación.
 * - Resto     -> 500 genérico (sin filtrar stack al cliente) + log con requestId.
 *
 * Pendiente de implementación.
 */
export {};
