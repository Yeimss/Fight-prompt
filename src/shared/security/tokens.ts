import { createHash, randomBytes } from 'node:crypto';

/**
 * Utilidades para refresh tokens opacos.
 *
 * El refresh token es un valor aleatorio de alta entropía (256 bits). En la base
 * de datos NUNCA se guarda en claro: se almacena su SHA-256 (determinista, lo que
 * permite buscarlo por hash). Al ser un secreto aleatorio de alta entropía, un
 * hash rápido como SHA-256 es suficiente — no requiere KDF lento como las
 * contraseñas.
 */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString('hex'); // 64 chars hex
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex'); // 64 chars hex
}
