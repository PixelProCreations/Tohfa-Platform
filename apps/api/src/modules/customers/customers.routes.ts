/**
 * SWA Module 7 (Customers): `/v1/admin/customers/**`. Wiring only (CLAUDE.md §4):
 *
 *   requireAuth -> requirePermission -> validate -> asyncHandler(handler)
 *
 * Mount at `/v1/admin/customers`.
 *
 * BR-93: the wallet paths are GET-only. There is deliberately no POST/PUT/PATCH/DELETE on any
 * wallet path, so a write falls through to the 404 handler; the test suite asserts the route
 * table. The only mutating route here is the support reply.
 *
 * The reply route resolves TWO scopes. `support.ticket.respond` is granted at `all` to the
 * warehouse admins in docs/rbac.json (it predates the per-warehouse customer surface), so it
 * cannot decide which customers an actor may see. Visibility therefore comes from
 * `customer.support_history.view` (BR-91, BR-97), resolved first and kept on `res.locals`, and the
 * reply itself is authorised by `support.ticket.respond` (BR-97d).
 */
import { Router, type RequestHandler } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope, type ResolvedScope } from '../../rbac/requirePermission.js';
import { customersService, type CustomersService } from './customers.service.js';
import {
  customerIdParams,
  listCustomersQuery,
  pageQuery,
  replyBody,
  ticketParams,
  walletTxnParams,
} from './customers.schema.js';

const VISIBILITY_SCOPE = 'customerVisibilityScope';

/** Keeps the scope just resolved by `requirePermission` before the next one overwrites it. */
const keepScopeAsVisibility: RequestHandler = (req, res, next) => {
  res.locals[VISIBILITY_SCOPE] = requireScope(req.scope);
  next();
};

export function createCustomersRouter(service: CustomersService = customersService): Router {
  const router = Router();

  router.get(
    '/',
    requireAuth,
    requirePermission('customer.list.view'),
    validate({ query: listCustomersQuery }),
    asyncHandler(async (req, res) => {
      res.json(await service.list(requireScope(req.scope), getValidated(req, 'query', listCustomersQuery)));
    }),
  );

  router.get(
    '/:customerId',
    requireAuth,
    requirePermission('customer.detail.view'),
    validate({ params: customerIdParams }),
    asyncHandler(async (req, res) => {
      const { customerId } = getValidated(req, 'params', customerIdParams);
      res.json(await service.get(requireScope(req.scope), customerId));
    }),
  );

  router.get(
    '/:customerId/purchases',
    requireAuth,
    requirePermission('customer.purchase_history.view'),
    validate({ params: customerIdParams, query: pageQuery }),
    asyncHandler(async (req, res) => {
      const { customerId } = getValidated(req, 'params', customerIdParams);
      res.json(await service.listPurchases(requireScope(req.scope), customerId, getValidated(req, 'query', pageQuery)));
    }),
  );

  router.get(
    '/:customerId/orders',
    requireAuth,
    requirePermission('customer.purchase_history.view'),
    validate({ params: customerIdParams, query: pageQuery }),
    asyncHandler(async (req, res) => {
      const { customerId } = getValidated(req, 'params', customerIdParams);
      res.json(await service.listOrders(requireScope(req.scope), customerId, getValidated(req, 'query', pageQuery)));
    }),
  );

  router.get(
    '/:customerId/wallet',
    requireAuth,
    requirePermission('customer.wallet.view'),
    validate({ params: customerIdParams }),
    asyncHandler(async (req, res) => {
      const { customerId } = getValidated(req, 'params', customerIdParams);
      res.json(await service.getWallet(requireScope(req.scope), customerId));
    }),
  );

  router.get(
    '/:customerId/wallet/transactions',
    requireAuth,
    requirePermission('customer.wallet.view'),
    validate({ params: customerIdParams, query: pageQuery }),
    asyncHandler(async (req, res) => {
      const { customerId } = getValidated(req, 'params', customerIdParams);
      res.json(
        await service.listWalletTransactions(requireScope(req.scope), customerId, getValidated(req, 'query', pageQuery)),
      );
    }),
  );

  router.get(
    '/:customerId/wallet/transactions/:txnId',
    requireAuth,
    requirePermission('customer.wallet.view'),
    validate({ params: walletTxnParams }),
    asyncHandler(async (req, res) => {
      const { customerId, txnId } = getValidated(req, 'params', walletTxnParams);
      res.json(await service.getWalletTransaction(requireScope(req.scope), customerId, txnId));
    }),
  );

  router.get(
    '/:customerId/issues',
    requireAuth,
    requirePermission('customer.issues.view'),
    validate({ params: customerIdParams, query: pageQuery }),
    asyncHandler(async (req, res) => {
      const { customerId } = getValidated(req, 'params', customerIdParams);
      res.json(await service.listIssues(requireScope(req.scope), customerId, getValidated(req, 'query', pageQuery)));
    }),
  );

  router.get(
    '/:customerId/support-tickets',
    requireAuth,
    requirePermission('customer.support_history.view'),
    validate({ params: customerIdParams, query: pageQuery }),
    asyncHandler(async (req, res) => {
      const { customerId } = getValidated(req, 'params', customerIdParams);
      res.json(
        await service.listSupportTickets(requireScope(req.scope), customerId, getValidated(req, 'query', pageQuery)),
      );
    }),
  );

  router.get(
    '/:customerId/support-tickets/:ticketId',
    requireAuth,
    requirePermission('customer.support_history.view'),
    validate({ params: ticketParams }),
    asyncHandler(async (req, res) => {
      const { customerId, ticketId } = getValidated(req, 'params', ticketParams);
      res.json(await service.getSupportTicket(requireScope(req.scope), customerId, ticketId));
    }),
  );

  router.post(
    '/:customerId/support-tickets/:ticketId/replies',
    requireAuth,
    requirePermission('customer.support_history.view'),
    keepScopeAsVisibility,
    requirePermission('support.ticket.respond'),
    validate({ params: ticketParams, body: replyBody }),
    asyncHandler(async (req, res) => {
      const { customerId, ticketId } = getValidated(req, 'params', ticketParams);
      const visibility = res.locals[VISIBILITY_SCOPE] as ResolvedScope;
      const message = await service.reply(
        requireScope(req.scope),
        visibility,
        customerId,
        ticketId,
        getValidated(req, 'body', replyBody),
      );
      res.status(201).json(message);
    }),
  );

  return router;
}

/** The production router. Mount at `/v1/admin/customers`. */
export const customersRouter: Router = createCustomersRouter();
