import type { preHandlerHookHandler } from 'fastify';
import { prisma } from './infrastructure/database/prisma.js';
import { config } from './shared/config/index.js';
import { SystemClock } from './shared/clock/clock.js';
import { JwtService } from './shared/security/jwt.service.js';
import { passwordHasher } from './shared/security/password.js';
import { makeAuthenticate } from './shared/middlewares/auth.middleware.js';

import { PrismaUserRepository } from './modules/users/infrastructure/user.prisma.repository.js';
import { CreateUserUseCase } from './modules/users/application/create-user.usecase.js';
import { UserController } from './modules/users/infrastructure/user.controller.js';

import { PrismaRefreshTokenRepository } from './modules/auth/infrastructure/refresh-token.prisma.repository.js';
import { TokenIssuer } from './modules/auth/application/token-issuer.js';
import { LoginUseCase } from './modules/auth/application/login.usecase.js';
import { RefreshTokenUseCase } from './modules/auth/application/refresh-token.usecase.js';
import { LogoutUseCase } from './modules/auth/application/logout.usecase.js';
import { AuthController } from './modules/auth/infrastructure/auth.controller.js';

/**
 * Composition Root: instancia repositorios concretos (infraestructura) y los
 * inyecta en los casos de uso y controllers. Es el único lugar que conoce
 * simultáneamente el dominio y sus implementaciones técnicas.
 */
export interface AppContainer {
  authController: AuthController;
  userController: UserController;
  authenticate: preHandlerHookHandler;
}

export function buildContainer(): AppContainer {
  const clock = new SystemClock();
  const jwt = new JwtService(config.jwt.accessSecret, config.jwt.accessTtl);

  // Repositorios (infraestructura)
  const userRepo = new PrismaUserRepository(prisma);
  const refreshRepo = new PrismaRefreshTokenRepository(prisma);

  // Servicios de aplicación
  const issuer = new TokenIssuer(jwt, refreshRepo, config.jwt.refreshTtl, clock);

  // Casos de uso
  const loginUseCase = new LoginUseCase(userRepo, passwordHasher, issuer);
  const refreshUseCase = new RefreshTokenUseCase(userRepo, refreshRepo, issuer, clock);
  const logoutUseCase = new LogoutUseCase(refreshRepo);
  const createUserUseCase = new CreateUserUseCase(userRepo, passwordHasher);

  // Controllers + middlewares
  const authController = new AuthController(loginUseCase, refreshUseCase, logoutUseCase);
  const userController = new UserController(createUserUseCase, userRepo);
  const authenticate = makeAuthenticate(jwt);

  return { authController, userController, authenticate };
}
