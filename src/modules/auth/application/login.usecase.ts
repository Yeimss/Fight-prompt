import { UnauthorizedError } from '../../../shared/errors/app-error.js';
import type { PasswordHasher } from '../../../shared/security/password.js';
import { toPublicUser } from '../../users/domain/user.entity.js';
import type { UserRepository } from '../../users/domain/user.repository.js';
import type { AuthResult, RequestContext } from './auth.types.js';
import type { TokenIssuer } from './token-issuer.js';

export interface LoginCommand {
  email: string;
  password: string;
}

/**
 * Caso de uso: Login.
 *
 * Verifica credenciales con argon2 y emite access + refresh token. El mensaje de
 * error es genérico ("credenciales inválidas") para no revelar si el email existe
 * (evita enumeración de usuarios).
 */
export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly issuer: TokenIssuer,
  ) {}

  async execute(command: LoginCommand, ctx: RequestContext = {}): Promise<AuthResult> {
    const email = command.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);

    const passwordOk = user
      ? await this.hasher.verify(user.passwordHash, command.password)
      : // Verificación señuelo para igualar el tiempo de respuesta y mitigar
        // ataques de temporización / enumeración de usuarios.
        await this.hasher.verify(await this.dummyHash(), command.password);

    if (!user || !user.isActive || !passwordOk) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const tokens = await this.issuer.issue(user, ctx);

    return {
      user: toPublicUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: 'Bearer',
    };
  }

  // Hash señuelo (argon2id real) calculado una sola vez y cacheado, para que la
  // verificación cuando el email no existe tenga un coste de tiempo equivalente.
  private dummyHashCache: Promise<string> | null = null;
  private dummyHash(): Promise<string> {
    this.dummyHashCache ??= this.hasher.hash('dummy-password-for-constant-timing');
    return this.dummyHashCache;
  }
}
