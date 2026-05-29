import type { UserProps, Role } from './user.entity.js';

/**
 * Puerto del repositorio de usuarios.
 * findAvailableAgents() apoya a las estrategias de reasignación.
 * Pendiente de implementación.
 */
export interface UserRepository {
  create(data: Partial<UserProps>): Promise<UserProps>;
  findById(id: string): Promise<UserProps | null>;
  findByEmail(email: string): Promise<UserProps | null>;
  findByRole(role: Role): Promise<UserProps[]>;
}
