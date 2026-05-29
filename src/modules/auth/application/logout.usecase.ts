import { hashToken } from '../../../shared/security/tokens.js';
import type { RefreshTokenRepository } from '../domain/refresh-token.repository.js';

/**
 * Caso de uso: Logout.
 * Revoca el refresh token presentado. Es idempotente: si el token no existe o ya
 * estaba revocado, no falla (no se filtra información sobre su validez).
 */
export class LogoutUseCase {
  constructor(private readonly refreshTokens: RefreshTokenRepository) {}

  async execute(rawToken: string): Promise<void> {
    const record = await this.refreshTokens.findByHash(hashToken(rawToken));
    if (record && !record.revokedAt) {
      await this.refreshTokens.revoke(record.id);
    }
  }
}
