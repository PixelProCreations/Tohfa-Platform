import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  assignTicketBody,
  createSupportTicketBody,
  listAdminTicketsQuery,
  listMyTicketsQuery,
  sendTicketMessageBody,
  ticketIdParams,
  transitionTicketStatusBody,
} from './support-tickets.schema.js';
import { supportTicketsService } from './support-tickets.service.js';

// ── Farmer Router (Mounted under /v1/farmers/me) ─────────────────────────────
export const farmerSupportTicketsRouter: Router = Router();

// GET /v1/farmers/me/support-tickets/categories
farmerSupportTicketsRouter.get(
  '/support-tickets/categories',
  requireAuth,
  requirePermission('farmer.support_ticket.manage_own'),
  asyncHandler(async (_req, res) => {
    res.json(await supportTicketsService.listCategories());
  }),
);

// GET /v1/farmers/me/support-tickets
farmerSupportTicketsRouter.get(
  '/support-tickets',
  requireAuth,
  requirePermission('farmer.support_ticket.manage_own'),
  validate({ query: listMyTicketsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listMyTicketsQuery);
    res.json(await supportTicketsService.listMyTickets(scope, query));
  }),
);

// POST /v1/farmers/me/support-tickets
farmerSupportTicketsRouter.post(
  '/support-tickets',
  requireAuth,
  requirePermission('farmer.support_ticket.manage_own'),
  validate({ body: createSupportTicketBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createSupportTicketBody);
    const result = await supportTicketsService.createTicket(scope, body);
    res.status(201).json(result);
  }),
);

// GET /v1/farmers/me/support-tickets/:id
farmerSupportTicketsRouter.get(
  '/support-tickets/:id',
  requireAuth,
  requirePermission('farmer.support_ticket.manage_own'),
  validate({ params: ticketIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', ticketIdParams);
    res.json(await supportTicketsService.getMyTicket(scope, id));
  }),
);

// POST /v1/farmers/me/support-tickets/:id/messages
farmerSupportTicketsRouter.post(
  '/support-tickets/:id/messages',
  requireAuth,
  requirePermission('farmer.support_ticket.manage_own'),
  validate({ params: ticketIdParams, body: sendTicketMessageBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', ticketIdParams);
    const body = getValidated(req, 'body', sendTicketMessageBody);
    const msg = await supportTicketsService.addMyTicketMessage(scope, id, body);
    res.status(201).json(msg);
  }),
);

// PATCH /v1/farmers/me/support-tickets/:id/close
farmerSupportTicketsRouter.patch(
  '/support-tickets/:id/close',
  requireAuth,
  requirePermission('farmer.support_ticket.manage_own'),
  validate({ params: ticketIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', ticketIdParams);
    res.json(await supportTicketsService.closeMyTicket(scope, id));
  }),
);

// ── Admin Router (Mounted under /v1/admin) ───────────────────────────────────
export const adminSupportTicketsRouter: Router = Router();

// GET /v1/admin/support-tickets
adminSupportTicketsRouter.get(
  '/support-tickets',
  requireAuth,
  requirePermission('support.ticket.manage_any'),
  validate({ query: listAdminTicketsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listAdminTicketsQuery);
    res.json(await supportTicketsService.listAllTickets(scope, query));
  }),
);

// GET /v1/admin/support-tickets/:id
adminSupportTicketsRouter.get(
  '/support-tickets/:id',
  requireAuth,
  requirePermission('support.ticket.manage_any'),
  validate({ params: ticketIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', ticketIdParams);
    res.json(await supportTicketsService.getAdminTicket(scope, id));
  }),
);

// POST /v1/admin/support-tickets/:id/messages
adminSupportTicketsRouter.post(
  '/support-tickets/:id/messages',
  requireAuth,
  requirePermission('support.ticket.manage_any'),
  validate({ params: ticketIdParams, body: sendTicketMessageBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', ticketIdParams);
    const body = getValidated(req, 'body', sendTicketMessageBody);
    const msg = await supportTicketsService.addAdminMessage(scope, id, body);
    res.status(201).json(msg);
  }),
);

// PATCH /v1/admin/support-tickets/:id/status
adminSupportTicketsRouter.patch(
  '/support-tickets/:id/status',
  requireAuth,
  requirePermission('support.ticket.manage_any'),
  validate({ params: ticketIdParams, body: transitionTicketStatusBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', ticketIdParams);
    const body = getValidated(req, 'body', transitionTicketStatusBody);
    res.json(await supportTicketsService.transitionStatus(scope, id, body));
  }),
);

// PATCH /v1/admin/support-tickets/:id/assign
adminSupportTicketsRouter.patch(
  '/support-tickets/:id/assign',
  requireAuth,
  requirePermission('support.ticket.manage_any'),
  validate({ params: ticketIdParams, body: assignTicketBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', ticketIdParams);
    const body = getValidated(req, 'body', assignTicketBody);
    res.json(await supportTicketsService.assignTicket(scope, id, body));
  }),
);
