/**
 * Invoice routes. Middleware order is FIXED: requireAuth -> requirePermission -> validate ->
 * handler. The list, the detail and the download share one visibility rule in the service
 * (`invoiceVisibility`), so each returns exactly the invoices the list does; any other id is
 * 404 (BR-30, BR-36).
 *
 * The one request that skips requireAuth is a download carrying a signed `token` minted by
 * `redirect=true`: a browser following that 302 cannot send a bearer header. The token is only
 * minted after the caller's visibility check, binds the invoice id and expires after 5 minutes;
 * an invalid or expired one is 403. Without a token the request takes the bearer route
 * (no token at all: 401).
 */
import { Router, type Response } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import { getValidated, validate } from '../../http/validate.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import {
  listInvoicesQuery,
  invoiceIdParams,
  downloadInvoiceQuery,
} from './invoices.schema.js';
import { invoicesService } from './invoices.service.js';

export const invoicesRouter: Router = Router();

function sendPdf(res: Response, id: string, pdf: Buffer): void {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="invoice-${id}.pdf"`);
  res.send(pdf);
}

// GET /v1/invoices - List own or all invoices based on role
invoicesRouter.get(
  '/',
  requireAuth,
  requirePermission('invoice.view_own'),
  validate({ query: listInvoicesQuery }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const query = getValidated(req, 'query', listInvoicesQuery);
    const result = await invoicesService.listInvoices(actor, query);
    res.json(result);
  }),
);

// GET /v1/invoices/:id/download?token=&expires= - signed link, no bearer token. Anything
// without a `token` falls through to the bearer route below.
invoicesRouter.get(
  '/:id/download',
  (req, _res, next) => {
    if (typeof req.query['token'] !== 'string') {
      next('route');
      return;
    }
    next();
  },
  validate({ params: invoiceIdParams, query: downloadInvoiceQuery }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', invoiceIdParams);
    const query = getValidated(req, 'query', downloadInvoiceQuery);
    sendPdf(res, id, await invoicesService.getSignedPdf(id, query));
  }),
);

// GET /v1/invoices/:id/download - PDF inline, or a 302 to a signed link when redirect=true
invoicesRouter.get(
  '/:id/download',
  requireAuth,
  requirePermission('invoice.view_own'),
  validate({ params: invoiceIdParams, query: downloadInvoiceQuery }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', invoiceIdParams);
    const query = getValidated(req, 'query', downloadInvoiceQuery);
    if (query.redirect) {
      const signed = await invoicesService.signedDownloadUrlFor(actor, id);
      res.redirect(302, signed.url);
      return;
    }
    sendPdf(res, id, await invoicesService.getPdf(actor, id));
  }),
);

// GET /v1/invoices/:id - Invoice detail
invoicesRouter.get(
  '/:id',
  requireAuth,
  requirePermission('invoice.view_own'),
  validate({ params: invoiceIdParams }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', invoiceIdParams);
    const result = await invoicesService.getInvoice(actor, id);
    res.json(result);
  }),
);
