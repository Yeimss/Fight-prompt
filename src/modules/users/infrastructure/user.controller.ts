import type { FastifyReply, FastifyRequest } from 'fastify';
import { NotFoundError, UnauthorizedError } from '../../../shared/errors/app-error.js';
import type { CreateUserUseCase } from '../application/create-user.usecase.js';
import { toPublicUser } from '../domain/user.entity.js';
import type { UserRepository } from '../domain/user.repository.js';
import { createUserSchema } from '../users.schemas.js';

/**
 * Controller HTTP de usuarios. La creación de usuarios es una operación de
 * administración (protegida por permiso USER_MANAGE en las rutas).
 */
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly users: UserRepository,
  ) {}

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const input = createUserSchema.parse(request.body);
    const user = await this.createUserUseCase.execute(input);
    reply.status(201).send(user);
  };

  me = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.authUser) {
      throw new UnauthorizedError('No autenticado');
    }
    const user = await this.users.findById(request.authUser.id);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }
    reply.status(200).send(toPublicUser(user));
  };
}
