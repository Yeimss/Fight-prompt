import type { PrismaClient } from '@prisma/client';
import type { Role, UserProps } from '../domain/user.entity.js';
import type { CreateUserInput, UserRepository } from '../domain/user.repository.js';

/**
 * Implementación del UserRepository con Prisma sobre SQL Server.
 * El campo `role` se persiste como String (SQL Server no soporta enums); su
 * valor ya viene acotado al union Role desde la capa de aplicación.
 */
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateUserInput): Promise<UserProps> {
    const row = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        name: input.name,
        role: input.role,
      },
    });
    return this.toProps(row);
  }

  async findById(id: string): Promise<UserProps | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toProps(row) : null;
  }

  async findByEmail(email: string): Promise<UserProps | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? this.toProps(row) : null;
  }

  async findByRole(role: Role): Promise<UserProps[]> {
    const rows = await this.prisma.user.findMany({ where: { role, isActive: true } });
    return rows.map((r) => this.toProps(r));
  }

  private toProps(row: {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): UserProps {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      name: row.name,
      role: row.role as Role,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
