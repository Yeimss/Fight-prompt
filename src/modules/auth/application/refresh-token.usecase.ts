import type { Clock } from '../../../shared/clock/clock.js';
import { UnauthorizedError } from '../../../shared/errors/app-error.js';
import { hashToken } from '../../../shared/security/tokens.js';
import { toPublicUser } from '../../users/domain/user.entity.js';
import type { UserRepository } from '../../users/domain/user.repository.js';
import type { RefreshTokenRepository } from '../domain/refresh-token.repository.js';
import type { AuthResult, RequestContext } from './auth.types.js';
import type { TokenIssuer } from './token-issuer.js';

/**
 * Caso de uso: Refrescar tokens (rotación).
 *
 * Valida el refresh token presentado, emite uno nuevo y revoca el anterior
 * (rotación). Incluye DETECCIÓN DE REÚSO: si llega un token ya revocado, se
 * asume robo y se revoca toda la familia de tokens del usuario.
 */
export class RefreshTokenUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly issuer: TokenIssuer,
    private readonly clock: Clock,
  ) {}

  async execute(rawToken: string, ctx: RequestContext = {}): Promise<AuthResult> {
    const record = await this.refreshTokens.findByHash(hashToken(rawToken));

    if (!record) {
      throw new UnauthorizedError('Refresh token inválido');
    }

    // Reúso de un token ya revocado => posible robo: invalidar todo.
    if (record.revokedAt) {
      await this.refreshTokens.revokeAllForUser(record.userId);
      throw new UnauthorizedError('Refresh token revocado');
    }

    if (record.expiresAt.getTime() <= this.clock.now().getTime()) {
      throw new UnauthorizedError('Refresh token expirado');
    }

    const user = await this.users.findById(record.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Usuario no válido');
    }

    // Emitir el nuevo par y revocar el anterior enlazándolo (rotación).
    const tokens = await this.issuer.issue(user, ctx);
    await this.refreshTokens.revoke(record.id, tokens.refreshRecordId);

    return {
      user: toPublicUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: 'Bearer',
    };
  }
}
