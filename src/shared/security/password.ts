import argon2 from 'argon2';

/**
 * Hashing de contraseñas con Argon2id (recomendación OWASP).
 *
 * Parámetros conservadores acordes a las guías OWASP (memoria 19 MiB, 2 iter.).
 * Argon2 incrusta sal y parámetros dentro del propio hash, por lo que no hay que
 * almacenarlos por separado y futuros cambios de coste son retrocompatibles.
 */
const OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export const passwordHasher = {
  hash(plain: string): Promise<string> {
    return argon2.hash(plain, OPTIONS);
  },

  /** Devuelve true si la contraseña coincide. Nunca lanza por hash inválido. */
  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  },
};

export type PasswordHasher = typeof passwordHasher;
