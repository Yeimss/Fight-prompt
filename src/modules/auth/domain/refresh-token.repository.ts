/**
 * Puerto del repositorio de refresh tokens.
 * El dominio depende de esta abstracción; la implementación (Prisma/SQL Server)
 * vive en infrastructure.
 */
export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedById: string | null;
  createdAt: Date;
}

export interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdByIp?: string | null;
  userAgent?: string | null;
}

export interface RefreshTokenRepository {
  create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord>;

  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;

  /** Marca un token como revocado; replacedById registra la rotación. */
  revoke(id: string, replacedById?: string | null): Promise<void>;

  /** Revoca todos los tokens vigentes de un usuario (logout global / robo). */
  revokeAllForUser(userId: string): Promise<void>;
}
