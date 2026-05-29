import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';

/**
 * Manejador central de errores (se registra como errorHandler de Fastify).
 *
 *  - ZodError              -> 422 con el detalle de validación.
 *  - AppError              -> su statusCode/code.
 *  - Rate limit (429)      -> se respeta el statusCode de Fastify.
 *  - Resto                 -> 500 genérico SIN filtrar stack al cliente; se loggea.
 *
 * El log incluye el reqId de Fastify para trazar el flujo completo.
 */
export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof ZodError) {
    reply.status(422).send({
      code: 'VALIDATION_ERROR',
      message: 'Datos de entrada inválidos',
      details: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }

  if (error instanceof AppError) {
    reply.status(error.statusCode).send({ code: error.code, message: error.message });
    return;
  }

  // Errores con statusCode propio de Fastify (p. ej. rate limit 429, body parse 400).
  const fastifyError = error as FastifyError;
  if (typeof fastifyError.statusCode === 'number' && fastifyError.statusCode < 500) {
    reply.status(fastifyError.statusCode).send({
      code: fastifyError.code ?? 'BAD_REQUEST',
      message: error.message,
    });
    return;
  }

  // Inesperado: no exponer detalles internos.
  request.log.error({ err: error }, 'Error no controlado');
  reply.status(500).send({ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' });
}
