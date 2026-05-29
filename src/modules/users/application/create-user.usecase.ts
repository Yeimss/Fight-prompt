import { ConflictError } from '../../../shared/errors/app-error.js';
import type { PasswordHasher } from '../../../shared/security/password.js';
import type { Role } from '../domain/user.entity.js';
import { toPublicUser, type PublicUser } from '../domain/user.entity.js';
import type { UserRepository } from '../domain/user.repository.js';

export interface CreateUserCommand {
  email: string;
  name: string;
  password: string;
  role: Role;
}

/**
 * Caso de uso: Crear usuario.
 * Verifica unicidad de email, hashea la contraseña con argon2 y persiste.
 * Devuelve la representación pública (sin hash).
 */
export class CreateUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(command: CreateUserCommand): Promise<PublicUser> {
    const email = command.email.trim().toLowerCase();

    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictError('El email ya está registrado');
    }

    const passwordHash = await this.hasher.hash(command.password);

    const user = await this.users.create({
      email,
      name: command.name.trim(),
      passwordHash,
      role: command.role,
    });

    return toPublicUser(user);
  }
}
