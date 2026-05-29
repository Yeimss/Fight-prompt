import type { PublicUser } from '../../users/domain/user.entity.js';

/** Contexto de la petición (para auditar el origen del refresh token). */
export interface RequestContext {
  ip?: string | null;
  userAgent?: string | null;
}

/** Par de tokens emitido al cliente. */
export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  /** id del registro del refresh token (uso interno para rotación). */
  refreshRecordId: string;
}

/** Respuesta pública de los flujos de autenticación. */
export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
}
