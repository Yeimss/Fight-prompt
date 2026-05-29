import type { Clock } from '../../../shared/clock/clock.js';
import type { JwtService } from '../../../shared/security/jwt.service.js';
import { generateOpaqueToken, hashToken } from '../../../shared/security/tokens.js';
import { parseDurationMs } from '../../../shared/utils/duration.js';
import type { Role } from '../../../shared/auth/roles.js';
import type { RefreshTokenRepository } from '../domain/refresh-token.repository.js';
import type { IssuedTokens, RequestContext } from './auth.types.js';

/**
 * Emite un access token (JWT) y crea un nuevo refresh token persistido.
 * Centraliza la emisión para que login y refresh compartan exactamente la misma
 * lógica (rotación incluida).
 */
export class TokenIssuer {
  constructor(
    private readonly jwt: JwtService,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly refreshTtl: string,
    private readonly clock: Clock,
  ) {}

  async issue(
    user: { id: string; role: Role },
    ctx: RequestContext = {},
  ): Promise<IssuedTokens> {
    const accessToken = this.jwt.signAccessToken({ sub: user.id, role: user.role });

    const refreshToken = generateOpaqueToken();
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(this.clock.now().getTime() + parseDurationMs(this.refreshTtl));

    const record = await this.refreshTokens.create({
      userId: user.id,
      tokenHash,
      expiresAt,
      createdByIp: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
    });

    return { accessToken, refreshToken, refreshRecordId: record.id };
  }
}
