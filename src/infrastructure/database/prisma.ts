import { PrismaClient } from '@prisma/client';
import { config } from '../../shared/config/index.js';

/**
 * Cliente Prisma (SQL Server) — singleton compartido por la aplicación.
 * Se reutiliza la misma instancia para no agotar el pool de conexiones.
 */
export const prisma = new PrismaClient({
  log: config.isProduction ? ['error'] : ['query', 'warn', 'error'],
});
