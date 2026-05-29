import type { FastifyReply, FastifyRequest } from 'fastify';
import { UnauthorizedError } from '../../../shared/errors/app-error.js';
import type { Role } from '../../../shared/auth/roles.js';
import type { AddCommentUseCase } from '../application/add-comment.usecase.js';
import type { AssignTicketUseCase } from '../application/assign-ticket.usecase.js';
import type { ChangeStatusUseCase } from '../application/change-status.usecase.js';
import type { CreateTicketUseCase } from '../application/create-ticket.usecase.js';
import type { GetTicketsUseCase } from '../application/get-tickets.usecase.js';
import {
  assignTicketSchema,
  changeStatusSchema,
  commentSchema,
  createTicketSchema,
  listTicketsQuerySchema,
  ticketIdParamSchema,
} from '../tickets.schemas.js';

/**
 * Controller HTTP de tickets. Valida con Zod, invoca el caso de uso y mapea la
 * respuesta. La autorización por permiso se aplica en las rutas.
 */
export class TicketController {
  constructor(
    private readonly createUC: CreateTicketUseCase,
    private readonly assignUC: AssignTicketUseCase,
    private readonly commentUC: AddCommentUseCase,
    private readonly statusUC: ChangeStatusUseCase,
    private readonly getUC: GetTicketsUseCase,
  ) {}

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const body = createTicketSchema.parse(request.body);
    const user = this.requireUser(request);
    const ticket = await this.createUC.execute({
      title: body.title,
      description: body.description,
      priority: body.priority,
      assigneeId: body.assigneeId ?? null,
      createdById: user.id,
    });
    reply.status(201).send(ticket);
  };

  list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const query = listTicketsQuerySchema.parse(request.query);
    const user = this.requireUser(request);
    const tickets = await this.getUC.list(user, query);
    reply.send(tickets);
  };

  getById = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = ticketIdParamSchema.parse(request.params);
    const user = this.requireUser(request);
    const ticket = await this.getUC.getById(user, id);
    reply.send(ticket);
  };

  assign = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = ticketIdParamSchema.parse(request.params);
    const { assigneeId } = assignTicketSchema.parse(request.body);
    const user = this.requireUser(request);
    const ticket = await this.assignUC.execute({ ticketId: id, assigneeId, actorId: user.id });
    reply.send(ticket);
  };

  comment = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = ticketIdParamSchema.parse(request.params);
    const { body } = commentSchema.parse(request.body);
    const user = this.requireUser(request);
    const ticket = await this.commentUC.execute({ ticketId: id, body, actorId: user.id });
    reply.send(ticket);
  };

  changeStatus = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = ticketIdParamSchema.parse(request.params);
    const { status } = changeStatusSchema.parse(request.body);
    const user = this.requireUser(request);
    const ticket = await this.statusUC.execute({ ticketId: id, to: status, actorId: user.id });
    reply.send(ticket);
  };

  private requireUser(request: FastifyRequest): { id: string; role: Role } {
    if (!request.authUser) throw new UnauthorizedError('No autenticado');
    return request.authUser;
  }
}
