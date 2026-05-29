import type { Role } from '../../../shared/auth/roles.js';

/**
 * Entidad de dominio User.
 * Roles: ADMIN | AGENT | USER (definidos en shared/auth/roles).
 */
export type { Role };

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

/** Representación segura del usuario para exponer al exterior (sin hash). */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
}

export function toPublicUser(user: UserProps): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}
