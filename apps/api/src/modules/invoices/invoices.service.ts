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
  type InvoiceSummaryGroup,
  type InvoicesRepo,
  type InvoiceVisibility,
} from './invoices.repo.js';
import {
  invoiceStatuses,
  invoiceTypes,
  type DownloadInvoiceQuery,
  type InvoiceDetailResponse,
  type InvoiceSummary,
  type InvoiceSummaryQuery,
  type InvoiceSummaryResponse,
  type ListInvoicesQuery,
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
  /**
   * GST computed ONCE for the whole invoice by the caller (BR-98: the Direct/Market sale rounds
   * half up on the subtotal, not per line). When set, line totals are taken as taxable values with
   * no per-line tax, this amount is split CGST/SGST (or IGST) and added on top, and the invoice is
   * GST-exclusive. When omitted, the per-line computation below is used unchanged.
   */
  invoiceGst?: Money;
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
  /**
   * GET /invoices/summary (BR-30, BR-36): counts and totals by status and by type over exactly the
   * invoices `listInvoices` would return `actor` for the same filters. Out of scope is all zeros.
   */
  summarizeInvoices(actor: Actor, query: InvoiceSummaryQuery): Promise<InvoiceSummary>;
  /** Folds the repo's (status, type) groups into the response; every status and type is present. */
  toInvoiceSummary(groups: InvoiceSummaryGroup[]): InvoiceSummary;
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

/**
 * Every bucket is summed in integer paise (CLAUDE.md §2.2) and converted to Money once at the end.
 * Every status and every type gets a bucket, zero when nothing matched, so the tiles have a stable
 * shape and an empty scope is indistinguishable from an empty warehouse.
 */
function toInvoiceSummary(groups: InvoiceSummaryGroup[]): InvoiceSummary {
  const paise = (text: string): number => {
    const value = Number(text);
    // fromPaise() refuses a non-safe integer too; this names the cause if a sum ever overflows.
    if (!Number.isSafeInteger(value)) throw new Error(`invoice summary paise out of range: ${text}`);
    return value;
  };
  const byStatus = new Map<string, { count: number; paise: number }>(invoiceStatuses.map((s) => [s, { count: 0, paise: 0 }]));
  const byType = new Map<string, { count: number; paise: number }>(invoiceTypes.map((t) => [t, { count: 0, paise: 0 }]));
  let count = 0;
  let totalPaise = 0;
  for (const group of groups) {
    const amount = paise(group.totalPaise);
    count += group.count;
    totalPaise += amount;
    const status = byStatus.get(group.status);
    if (status !== undefined) {
      status.count += group.count;
      status.paise += amount;
    }
    const type = byType.get(group.invoiceType);
    if (type !== undefined) {
      type.count += group.count;
      type.paise += amount;
    }
  }
  return {
    count,
    totalAmount: fromPaise(totalPaise),
    byStatus: invoiceStatuses.map((status) => ({
      status,
      count: byStatus.get(status)!.count,
      totalAmount: fromPaise(byStatus.get(status)!.paise),
    })),
    byType: invoiceTypes.map((type) => ({
      type,
      count: byType.get(type)!.count,
      totalAmount: fromPaise(byType.get(type)!.paise),
    })),
  };
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

    async summarizeInvoices(actor, query) {
      return toInvoiceSummary(await repo.summarizeInvoices(pool, invoiceVisibility(actor), query));
    },

    toInvoiceSummary,

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
      const invoiceGst = input.invoiceGst;
      const gstInclusive = invoiceGst !== undefined ? false : (input.gstInclusive ?? (input.invoiceType === 'SALE_RETAIL'));
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

        if (invoiceGst !== undefined) {
          // Per-invoice GST: the line is taxable value only; the tax is added once below.
        } else if (line.gstRate > 0) {
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

      if (invoiceGst !== undefined) {
        totalTaxPaise = toPaise(invoiceGst);
        totalPaisaSum += totalTaxPaise;
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
