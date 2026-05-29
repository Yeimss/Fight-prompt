import { z } from 'zod';
import { ROLES } from '../../shared/auth/roles.js';

/** Validación de entrada para la gestión de usuarios. */
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(150),
  // Política mínima de contraseña; el hashing real lo hace argon2.
  password: z.string().min(8).max(128),
  role: z.enum(ROLES),
});

export type CreateUserInputDto = z.infer<typeof createUserSchema>;
