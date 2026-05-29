import { createSigner, createVerifier } from 'fast-jwt';
import type { Role } from '../auth/roles.js';
import { parseDurationMs } from '../utils/duration.js';

/**
 * Payload del access token. Se mantiene mínimo: identificador y rol.
 * Cualquier dato adicional debe resolverse en cada request, no incrustarse.
 */
export interface AccessTokenPayload {
  sub: string; // userId
  role: Role;
}

/**
 * Servicio de access tokens (JWT) basado en fast-jwt, desacoplado del framework
 * HTTP para poder usarlo y testearlo sin levantar el servidor.
 *
 * El refresh token NO es un JWT: es un valor opaco aleatorio persistido y
 * revocable (ver tokens.ts + RefreshTokenRepository).
 */
export class JwtService {
  private readonly sign: (payload: AccessTokenPayload) => string;
  private readonly verifyToken: (token: string) => AccessTokenPayload & {
    iat: number;
    exp: number;
  };

  constructor(secret: string, accessTtl: string) {
    this.sign = createSigner({
      key: secret,
      expiresIn: parseDurationMs(accessTtl),
      algorithm: 'HS256',
    });
    this.verifyToken = createVerifier({ key: secret, algorithms: ['HS256'] });
  }

  signAccessToken(payload: AccessTokenPayload): string {
    return this.sign(payload);
  }

  /** Verifica firma y expiración. Lanza si el token es inválido o expiró. */
  verifyAccessToken(token: string): AccessTokenPayload {
    const decoded = this.verifyToken(token);
    return { sub: decoded.sub, role: decoded.role };
  }
}
