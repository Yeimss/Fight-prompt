import type { FastifyReply, FastifyRequest } from 'fastify';
import type { LoginUseCase } from '../application/login.usecase.js';
import type { LogoutUseCase } from '../application/logout.usecase.js';
import type { RefreshTokenUseCase } from '../application/refresh-token.usecase.js';
import type { RequestContext } from '../application/auth.types.js';
import { loginSchema, logoutSchema, refreshSchema } from '../auth.schemas.js';

/**
 * Controller HTTP de autenticación. Valida la entrada con Zod, invoca el caso de
 * uso y mapea la respuesta. Sin lógica de negocio.
 */
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  login = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const input = loginSchema.parse(request.body);
    const result = await this.loginUseCase.execute(input, this.context(request));
    reply.status(200).send(result);
  };

  refresh = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const input = refreshSchema.parse(request.body);
    const result = await this.refreshUseCase.execute(input.refreshToken, this.context(request));
    reply.status(200).send(result);
  };

  logout = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const input = logoutSchema.parse(request.body);
    await this.logoutUseCase.execute(input.refreshToken);
    reply.status(204).send();
  };

  private context(request: FastifyRequest): RequestContext {
    return { ip: request.ip, userAgent: request.headers['user-agent'] ?? null };
  }
}
