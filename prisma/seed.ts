import { PrismaClient } from '@prisma/client';
import { passwordHasher } from '../src/shared/security/password.js';

/**
 * Seed: crea un usuario ADMIN inicial si no existe.
 *
 * Las credenciales se toman de variables de entorno; en producción NUNCA se debe
 * dejar la contraseña por defecto. El sistema arranca sin usuarios, por lo que
 * este admin inicial es el que luego crea agentes y usuarios.
 *
 *   SEED_ADMIN_EMAIL     (default admin@tickets.local)
 *   SEED_ADMIN_PASSWORD  (default ChangeMe_123!)
 */
const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@tickets.local').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe_123!';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`ℹ️  El admin "${email}" ya existe; no se crea de nuevo.`);
    return;
  }

  const passwordHash = await passwordHasher.hash(password);
  await prisma.user.create({
    data: { email, name: 'Administrador', role: 'ADMIN', passwordHash },
  });

  console.log(`✅ Admin creado: ${email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log('⚠️  Usando contraseña por defecto "ChangeMe_123!". Cámbiala cuanto antes.');
  }
}

main()
  .catch((err) => {
    console.error('❌ Error en el seed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
