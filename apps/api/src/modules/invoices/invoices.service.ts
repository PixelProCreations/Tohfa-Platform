import crypto from 'node:crypto';
import { AppError } from '../../http/problem.js';
import { pool, type Executor } from '../../db/pool.js';
import { config } from '../../config.js';
import { hasRole, type Actor } from '../../auth/requireAuth.js';
import { resolveScope } from '../../rbac/requirePermission.js';
import { fromPaise, toPaise, allocate, RoleCode, ScopeLevel, type Money } from '@tohfa/shared-types';
import {
  invoicesRepo,
  type CreateInvoiceInput,
  type InvoicesRepo,
  type InvoiceVisibility,
} from './invoices.repo.js';
import type {
  DownloadInvoiceQuery,
  InvoiceDetailResponse,
  InvoiceSummaryResponse,
  ListInvoicesQuery,
} from './invoices.schema.js';
import { renderInvoicePdf } from './pdf/invoice-pdf.js';

export interface IssueInvoiceInput {
  invoiceType: CreateInvoiceInput['invoiceType'];
  customerId?: string | null;
  farmerId?: string | null;
  orderId?: string | null;
  purchaseOrderId?: string | null;
  payoutId?: string | null;
  fiscalYear?: string;
  issueDate?: string;
  totalAmount: Money;
  gstInclusive?: boolean;
  placeOfSupply?: string | null;
  issuedBy?: string | null;
  lines: Array<{
    lineNo: number;
    description: string;
    hsnCode?: string | null;
    qty: number;
    unitPrice: Money;
    gstRate: number; // e.g. 5 for 5% GST
    total: Money;
  }>;
}

export interface InvoicesService {
  listInvoices(
    actor: Actor,
    query: ListInvoicesQuery,
  ): Promise<{ items: InvoiceSummaryResponse[]; page: { nextCursor: string | null; hasMore: boolean } }>;
  getInvoice(actor: Actor, id: string): Promise<InvoiceDetailResponse>;
  /** Bearer-token download: the same visibility as the list and the detail. */
  getPdf(actor: Actor, id: string): Promise<Buffer>;
  /** Signed-link download (no bearer token): the HMAC is the authorization. */
  getSignedPdf(id: string, query: Pick<DownloadInvoiceQuery, 'token' | 'expires'>): Promise<Buffer>;
  /** `redirect=true`: mints a signed link only for an invoice `actor` may see (404 otherwise). */
  signedDownloadUrlFor(actor: Actor, id: string): Promise<{ url: string; expiresAt: number }>;
  generateSignedDownloadUrl(id: string): { url: string; expiresAt: number };
  verifyDownloadSignature(id: string, token: string, expires: number): boolean;
  issue(tx: Executor, input: IssueInvoiceInput): Promise<InvoiceDetailResponse>;
}

function calculateCurrentFiscalYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  const startYear = month >= 4 ? year : year - 1;
  const endYear = (startYear + 1).toString().slice(-2);
  return `${startYear}-${endYear}`;
}

/**
 * The invoices `actor` may read, from their `invoice.view_own` grant in docs/rbac.json:
 *  - `all` (SUPER_ADMIN, TOHFA_ADMIN, MAIN_WH_ADMIN): every invoice;
 *  - `own`: the owner dimension docs/rbac.json `scopeFilters` gives the role: a farmer's
 *    farmer_id, a customer's customer_id (BR-36), a Sub Warehouse Admin's assigned warehouse(s),
 *    reached through the invoice's order (BR-30); an invoice without an order has no warehouse,
 *    so no Sub admin sees it;
 *  - anything else, or an `own` caller without its profile row / warehouse: nothing.
 * Farmer is checked before customer because that is the order the list has always applied, so an
 * actor holding both roles keeps the list they had. The list, the detail and the download all
 * call this, which is what keeps them returning the same rows.
 */
export function invoiceVisibility(actor: Actor): InvoiceVisibility {
  const scope = resolveScope(actor, 'invoice.view_own');
  if (scope === null) return { kind: 'none' };
  if (scope.level === ScopeLevel.ALL) return { kind: 'all' };
  if (hasRole(actor, RoleCode.FARMER)) {
    return actor.farmerId === null ? { kind: 'none' } : { kind: 'farmer', farmerId: actor.farmerId };
  }
  if (hasRole(actor, RoleCode.CUSTOMER)) {
    return actor.customerId === null ? { kind: 'none' } : { kind: 'customer', customerId: actor.customerId };
  }
  if (hasRole(actor, RoleCode.SUB_WH_ADMIN) && scope.warehouseIds.length > 0) {
    return { kind: 'warehouses', warehouseIds: scope.warehouseIds };
  }
  return { kind: 'none' };
}

function invoiceNotFound(): AppError {
  // One error for "does not exist" and "not yours": a different answer would confirm the id.
  return new AppError('NOT_FOUND', { detail: 'Invoice not found.' });
}

export function createInvoicesService(repo: InvoicesRepo = invoicesRepo): InvoicesService {
  const service: InvoicesService = {
    async listInvoices(actor, query) {
      return repo.listInvoices(pool, invoiceVisibility(actor), query);
    },

    async getInvoice(actor, id) {
      const invoice = await repo.findById(pool, id, invoiceVisibility(actor));
      if (!invoice) throw invoiceNotFound();
      return invoice;
    },

    async signedDownloadUrlFor(actor, id) {
      await service.getInvoice(actor, id);
      return service.generateSignedDownloadUrl(id);
    },

    generateSignedDownloadUrl(id: string) {
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      const payload = `${id}:${expiresAt}`;
      const token = crypto
        .createHmac('sha256', config.JWT_SECRET)
        .update(payload)
        .digest('hex');

      return {
        url: `/v1/invoices/${id}/download?token=${token}&expires=${expiresAt}`,
        expiresAt,
      };
    },

    verifyDownloadSignature(id: string, token: string, expires: number): boolean {
      if (Date.now() > expires) {
        return false;
      }
      const payload = `${id}:${expires}`;
      const expectedToken = crypto
        .createHmac('sha256', config.JWT_SECRET)
        .update(payload)
        .digest('hex');

      if (typeof token !== 'string' || token.length !== expectedToken.length) {
        return false;
      }

      try {
        const bufA = Buffer.from(token, 'utf8');
        const bufB = Buffer.from(expectedToken, 'utf8');
        if (bufA.length !== bufB.length) {
          return false;
        }
        return crypto.timingSafeEqual(bufA, bufB);
      } catch {
        return false;
      }
    },

    async getPdf(actor, id) {
      return renderInvoicePdf({ invoice: await service.getInvoice(actor, id) });
    },

    async getSignedPdf(id, query) {
      if (
        query.token === undefined ||
        query.expires === undefined ||
        !service.verifyDownloadSignature(id, query.token, query.expires)
      ) {
        throw new AppError('FORBIDDEN', { detail: 'Download signature is invalid or expired.' });
      }
      // Unscoped on purpose: the HMAC binds this id and is minted only by signedDownloadUrlFor,
      // after the caller's own visibility check, and it expires in 5 minutes.
      const invoice = await repo.findById(pool, id, { kind: 'all' });
      if (!invoice) throw invoiceNotFound();
      return renderInvoicePdf({ invoice });
    },

    async issue(tx, input) {
      const fiscalYear = input.fiscalYear ?? calculateCurrentFiscalYear();
      const gstInclusive = input.gstInclusive ?? (input.invoiceType === 'SALE_RETAIL');
      const placeOfSupply = input.placeOfSupply ?? '33-Tamil Nadu';
      const isInterState = placeOfSupply !== '33-Tamil Nadu' && !placeOfSupply.startsWith('33');

      // Compute exact paisa splits with allocate()
      let totalTaxablePaise = 0;
      let totalTaxPaise = 0;
      let totalPaisaSum = 0;

      const processedLines: CreateInvoiceInput['lines'] = [];

      for (const line of input.lines) {
        const lineTotalPaise = toPaise(line.total);
        totalPaisaSum += lineTotalPaise;

        let lineTaxablePaise = lineTotalPaise;
        let lineTaxPaise = 0;

        if (line.gstRate > 0) {
          if (gstInclusive) {
            // Split line total into taxable base and tax proportion using allocate
            // base = total / (1 + rate/100)
            const rateBp = Math.round(line.gstRate * 100); // 5% -> 500 bp
            const split = allocate(line.total, [10000, rateBp]);
            lineTaxablePaise = toPaise(split[0]!);
            lineTaxPaise = toPaise(split[1]!);
          } else {
            const taxPaise = Math.round((lineTotalPaise * line.gstRate) / 100);
            lineTaxablePaise = lineTotalPaise;
            lineTaxPaise = taxPaise;
          }
        }

        totalTaxablePaise += lineTaxablePaise;
        totalTaxPaise += lineTaxPaise;

        processedLines.push({
          lineNo: line.lineNo,
          description: line.description,
          hsnCode: line.hsnCode ?? '0709',
          qty: line.qty,
          unitPrice: line.unitPrice,
          gstRate: line.gstRate,
          taxable: fromPaise(lineTaxablePaise),
          tax: fromPaise(lineTaxPaise),
          total: line.total,
        });
      }

      // Intra-state vs Inter-state GST splitting
      let cgst = fromPaise(0);
      let sgst = fromPaise(0);
      let igst = fromPaise(0);

      if (totalTaxPaise > 0) {
        if (isInterState) {
          igst = fromPaise(totalTaxPaise);
        } else {
          // Split tax equally between CGST and SGST using allocate
          const split = allocate(fromPaise(totalTaxPaise), [1, 1]);
          cgst = split[0]!;
          sgst = split[1]!;
        }
      }

      const totalAmount = fromPaise(totalPaisaSum);
      const taxableAmount = fromPaise(totalTaxablePaise);

      return repo.createInvoice(tx, {
        invoiceType: input.invoiceType,
        customerId: input.customerId,
        farmerId: input.farmerId,
        orderId: input.orderId,
        purchaseOrderId: input.purchaseOrderId,
        payoutId: input.payoutId,
        issueDate: input.issueDate,
        fiscalYear,
        taxableAmount,
        cgst,
        sgst,
        igst,
        totalAmount,
        gstInclusive,
        placeOfSupply,
        issuedBy: input.issuedBy,
        lines: processedLines,
      });
    },
  };

  return service;
}

export const invoicesService = createInvoicesService();
