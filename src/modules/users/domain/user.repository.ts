import type { UserProps, Role } from './user.entity.js';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
}

/**
 * Puerto del repositorio de usuarios.
 * findByRole apoya a las estrategias de reasignación (p. ej. listar AGENTs).
 */
export interface UserRepository {
  create(input: CreateUserInput): Promise<UserProps>;
  findById(id: string): Promise<UserProps | null>;
  findByEmail(email: string): Promise<UserProps | null>;
  findByRole(role: Role): Promise<UserProps[]>;
}
