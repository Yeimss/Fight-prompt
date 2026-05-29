import type { preHandlerHookHandler } from 'fastify';
import type { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import { prisma } from './infrastructure/database/prisma.js';
import { createRedisConnection } from './infrastructure/redis/connection.js';
import { config } from './shared/config/index.js';
import { SystemClock } from './shared/clock/clock.js';
import { InProcessEventBus } from './shared/events/event-bus.js';
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

import { PrismaTicketRepository } from './modules/tickets/infrastructure/ticket.prisma.repository.js';
import { PrismaTicketAssignmentRepository } from './modules/tickets/infrastructure/ticket-assignment.prisma.repository.js';
import { PrismaTicketEventRepository } from './modules/tickets/infrastructure/ticket-event.prisma.repository.js';
import { LeastLoadedStrategy } from './modules/tickets/application/strategies/least-loaded.strategy.js';
import { CreateTicketUseCase } from './modules/tickets/application/create-ticket.usecase.js';
import { AssignTicketUseCase } from './modules/tickets/application/assign-ticket.usecase.js';
import { AddCommentUseCase } from './modules/tickets/application/add-comment.usecase.js';
import { ChangeStatusUseCase } from './modules/tickets/application/change-status.usecase.js';
import { GetTicketsUseCase } from './modules/tickets/application/get-tickets.usecase.js';
import { ReassignTicketUseCase } from './modules/tickets/application/reassign-ticket.usecase.js';
import { TicketController } from './modules/tickets/infrastructure/ticket.controller.js';
import { registerAuditSubscriber } from './modules/tickets/application/subscribers/audit.subscriber.js';
import { registerNotificationSubscriber } from './modules/tickets/application/subscribers/notification.subscriber.js';
import { registerReassignmentScheduler } from './modules/tickets/application/subscribers/reassignment-scheduler.subscriber.js';
import type { TicketRepository } from './modules/tickets/domain/ticket.repository.js';
import {
  BullNotificationQueue,
  BullReassignmentScheduler,
  createNotificationsQueue,
  createReassignmentQueue,
} from './jobs/queue.js';

/**
 * Composition Root: instancia infraestructura (repos, colas, bus) y la inyecta
 * en casos de uso y controllers. Lo usan TANTO el proceso API como el worker, de
 * modo que ambos comparten el mismo event bus con sus suscriptores cableados.
 */
export interface AppContainer {
  // HTTP
  authController: AuthController;
  userController: UserController;
  ticketController: TicketController;
  authenticate: preHandlerHookHandler;
  // Worker
  reassignUseCase: ReassignTicketUseCase;
  ticketRepo: TicketRepository;
  reassignmentQueue: Queue;
  notificationsQueue: Queue;
  // Recursos a cerrar
  redis: Redis;
}

export function buildContainer(): AppContainer {
  const clock = new SystemClock();

  // ── Infraestructura compartida ──
  const redis = createRedisConnection();
  const reassignmentQueue = createReassignmentQueue(redis);
  const notificationsQueue = createNotificationsQueue(redis);
  const scheduler = new BullReassignmentScheduler(reassignmentQueue);
  const notifications = new BullNotificationQueue(notificationsQueue);
  const bus = new InProcessEventBus();

  // ── Auth / Users ──
  const jwt = new JwtService(config.jwt.accessSecret, config.jwt.accessTtl);
  const userRepo = new PrismaUserRepository(prisma);
  const refreshRepo = new PrismaRefreshTokenRepository(prisma);
  const issuer = new TokenIssuer(jwt, refreshRepo, config.jwt.refreshTtl, clock);
  const loginUseCase = new LoginUseCase(userRepo, passwordHasher, issuer);
  const refreshUseCase = new RefreshTokenUseCase(userRepo, refreshRepo, issuer, clock);
  const logoutUseCase = new LogoutUseCase(refreshRepo);
  const createUserUseCase = new CreateUserUseCase(userRepo, passwordHasher);

  // ── Tickets ──
  const ticketRepo = new PrismaTicketRepository(prisma);
  const assignmentRepo = new PrismaTicketAssignmentRepository(prisma);
  const ticketEventRepo = new PrismaTicketEventRepository(prisma);
  const strategy = new LeastLoadedStrategy(userRepo, ticketRepo);

  const createTicketUseCase = new CreateTicketUseCase(
    ticketRepo,
    userRepo,
    assignmentRepo,
    bus,
    clock,
    config.tickets.slaMinutes,
  );
  const assignTicketUseCase = new AssignTicketUseCase(
    ticketRepo,
    userRepo,
    assignmentRepo,
    bus,
    clock,
    config.tickets.slaMinutes,
  );
  const addCommentUseCase = new AddCommentUseCase(ticketRepo, bus, clock, config.tickets.slaMinutes);
  const changeStatusUseCase = new ChangeStatusUseCase(
    ticketRepo,
    bus,
    clock,
    config.tickets.slaMinutes,
  );
  const getTicketsUseCase = new GetTicketsUseCase(ticketRepo);
  const reassignUseCase = new ReassignTicketUseCase(
    ticketRepo,
    userRepo,
    strategy,
    bus,
    clock,
    config.tickets.slaMinutes,
    config.tickets.maxAutoReassignments,
  );

  // ── Suscriptores del event bus (auditoría, notificación, (re)programación) ──
  registerAuditSubscriber(bus, ticketEventRepo);
  registerNotificationSubscriber(bus, notifications);
  registerReassignmentScheduler(bus, scheduler, config.tickets.slaMinutes);

  // ── Controllers + middleware ──
  const authController = new AuthController(loginUseCase, refreshUseCase, logoutUseCase);
  const userController = new UserController(createUserUseCase, userRepo);
  const ticketController = new TicketController(
    createTicketUseCase,
    assignTicketUseCase,
    addCommentUseCase,
    changeStatusUseCase,
    getTicketsUseCase,
  );
  const authenticate = makeAuthenticate(jwt);

  return {
    authController,
    userController,
    ticketController,
    authenticate,
    reassignUseCase,
    ticketRepo,
    reassignmentQueue,
    notificationsQueue,
    redis,
  };
}
