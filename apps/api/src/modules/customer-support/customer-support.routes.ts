/**
 * Customer support tickets, mounted at `/v1/support`.
 *   requireAuth -> requirePermission -> validate -> handler
 * One permission, `support.ticket.create_own` (CUSTOMER `own`), gates the whole own-ticket surface,
 * as `farmer.support_ticket.manage_own` does for the farmer's.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { createTicketBody, listTicketsQuery, sendMessageBody, ticketIdParams } from './customer-support.schema.js';
import { customerSupportService, type CustomerSupportService } from './customer-support.service.js';

export function createCustomerSupportRouter(service: CustomerSupportService = customerSupportService): Router {
  const router = Router();

  router.post(
    '/tickets',
    requireAuth,
    requirePermission('support.ticket.create_own'),
    validate({ body: createTicketBody }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      res.status(201).json(await service.createTicket(scope, getValidated(req, 'body', createTicketBody), req.header('idempotency-key')));
    }),
  );

  router.get(
    '/tickets',
    requireAuth,
    requirePermission('support.ticket.create_own'),
    validate({ query: listTicketsQuery }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      res.json(await service.listTickets(scope, getValidated(req, 'query', listTicketsQuery)));
    }),
  );

  router.get(
    '/tickets/:id',
    requireAuth,
    requirePermission('support.ticket.create_own'),
    validate({ params: ticketIdParams }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const { id } = getValidated(req, 'params', ticketIdParams);
      res.json(await service.getTicket(scope, id));
    }),
  );

  router.post(
    '/tickets/:id/messages',
    requireAuth,
    requirePermission('support.ticket.create_own'),
    validate({ params: ticketIdParams, body: sendMessageBody }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const { id } = getValidated(req, 'params', ticketIdParams);
      res.status(201).json(await service.addMessage(scope, id, getValidated(req, 'body', sendMessageBody)));
    }),
  );

  router.post(
    '/tickets/:id/cancel',
    requireAuth,
    requirePermission('support.ticket.create_own'),
    validate({ params: ticketIdParams }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const { id } = getValidated(req, 'params', ticketIdParams);
      res.json(await service.cancelTicket(scope, id));
    }),
  );

  return router;
}

export const customerSupportRouter: Router = createCustomerSupportRouter();
