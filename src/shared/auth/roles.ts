/**
 * Roles del sistema (fuente única de verdad).
 * SQL Server no soporta enums en Prisma, por eso se persisten como String;
 * aquí los acotamos con un union type validado en el borde (Zod).
 */
export const ROLES = ['ADMIN', 'AGENT', 'USER'] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
