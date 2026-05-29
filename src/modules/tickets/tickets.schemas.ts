import { z } from 'zod';
import { TICKET_PRIORITIES, TICKET_STATUSES } from './domain/ticket.constants.js';

export const ticketIdParamSchema = z.object({ id: z.string().uuid() });

export const createTicketSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(5000),
  priority: z.enum(TICKET_PRIORITIES).default('MEDIUM'),
  assigneeId: z.string().uuid().optional(),
});

export const assignTicketSchema = z.object({
  assigneeId: z.string().uuid(),
});

export const commentSchema = z.object({
  body: z.string().min(1).max(2000),
});

export const changeStatusSchema = z.object({
  status: z.enum(TICKET_STATUSES),
});

export const listTicketsQuerySchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  assigneeId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});
