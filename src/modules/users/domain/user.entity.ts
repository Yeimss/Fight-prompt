/**
 * Entidad de dominio User.
 * Roles: ADMIN | AGENT | USER. Reglas de activación/desactivación.
 * Pendiente de implementación.
 */
export type Role = 'ADMIN' | 'AGENT' | 'USER';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
