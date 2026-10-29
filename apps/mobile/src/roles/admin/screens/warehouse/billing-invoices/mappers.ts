/**
 * Mappers between the backend invoice DTOs and the billing-invoices screen models.
 *
 * Rules enforced here:
 *   BR-16:  The list row never exposes a buyer name — GET /invoices sends none,
 *           and the detail only surfaces what InvoiceDetailRecord allows.
 *   BR-36:  Navigation always uses the invoice uuid (`id`), never the invoice number.
 *   BR-128: buyerName / buyerGstin come from the DTO as-is; a null buyer is left
 *           undefined in the record (farmer-side invoice — never invent a name).
 *   BR-30:  KPI tiles come from GET /invoices/summary (server-scoped, via invoiceKpis).
 *
 * The client-side filterAndSortInvoices / invoiceListQuery / invoiceKpis helpers live
 * here so the screens never import implementation detail from the data layer.
 */
import type { Money } from '@tohfa/shared-types';
import { format as formatMoney, fromPaise, parseMoney, toPaise } from '@tohfa/shared-types';
import type {
  InvoiceDetailDto,
  InvoiceDto,
  InvoiceStatus as ApiInvoiceStatus,
  InvoiceSummaryDto,
  InvoiceType,
} from '../../../api/invoices';
import type {
  InvoiceDetailRecord,
  InvoiceFilterState,
  InvoiceLineItem,
  InvoiceRecord,
  InvoiceSaleType,
  InvoiceStatus,
} from './types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function formatCalendarDate(yyyyMmDd: string): string {
  const parts = yyyyMmDd.split('-');
  if (parts.length !== 3) return yyyyMmDd;
  const year = parts[0];
  const monthIdx = parseInt(parts[1] ?? '1', 10) - 1;
  const month = MONTHS[monthIdx] ?? parts[1];
  const day = (parts[2] ?? '01').padStart(2, '0');
  return `${day} ${month} ${year}`;
}

/** Human label for an InvoiceType, matching the billing.type.* i18n keys. */
export function invoiceTypeLabel(type: InvoiceType): InvoiceSaleType {
  switch (type) {
    case 'SALE_RETAIL':
      return 'Retail Sale';
    case 'SALE_B2B':
      return 'B2B Sale';
    case 'PURCHASE_FARMER':
      return 'Farmer Purchase';
    case 'PAYOUT':
      return 'Payout';
    case 'SUBSCRIPTION':
      return 'Subscription';
    default:
      return type;
  }
}

/**
 * Maps the API status to the screen's InvoiceStatus.
 * CREDIT_NOTED is kept distinct from CANCELLED (a credit note is not a cancellation).
 */
export function mapInvoiceStatus(status: ApiInvoiceStatus): InvoiceStatus {
  switch (status) {
    case 'ISSUED':
      return 'Generated';
    case 'DRAFT':
      return 'Pending';
    case 'CANCELLED':
      return 'Cancelled';
    case 'CREDIT_NOTED':
      return 'CreditNoted';
    default:
      return 'Generated';
  }
}

function apiStatusLabel(status: ApiInvoiceStatus): string {
  switch (status) {
    case 'ISSUED':
      return 'Issued';
    case 'DRAFT':
      return 'Draft';
    case 'CANCELLED':
      return 'Cancelled';
    case 'CREDIT_NOTED':
      return 'Credit Noted';
    default:
      return status;
  }
}

/**
 * Formats a Money string (decimal rupees, max 2 d.p.) to a rupee display string.
 * Returns '—' for undefined / null / empty / unparseable values (including strings
 * with more than 2 decimal places, which the Money type forbids).
 */
export function formatMoneyAmount(amount: Money | string | number | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') return '—';
  const str = String(amount);
  // Valid Money: digits with at most 2 decimal places, no extra digits
  if (!/^\d+(\.\d{1,2})?$/.test(str)) return '—';
  try {
    const money = parseMoney(str as Money);
    return formatMoney(money);
  } catch {
    return '—';
  }
}

/** Integer paise from a rupee amount string ('2450.50' → 245050); null when unparseable. */
function safeToPaise(amount: Money | string | undefined | null): number | null {
  if (!amount) return null;
  const str = String(amount);
  if (!/^\d+(\.\d{1,2})?$/.test(str)) return null;
  try {
    return toPaise(str as Money);
  } catch {
    return null;
  }
}

/** Integer paise from a rupee filter string typed by the user ('500' → 50000). */
function filterBoundPaise(v: string): number | null {
  if (!v) return null;
  const parsed = parseFloat(v);
  if (isNaN(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

export function mapInvoiceDtoToRecord(dto: InvoiceDto): InvoiceRecord {
  return {
    // BR-36: navigation uses the uuid; the invoice number is display-only
    id: dto.id,
    invoiceNumber: dto.invoiceNumber,
    invoiceType: dto.invoiceType,
    saleType: invoiceTypeLabel(dto.invoiceType),
    orderId: dto.orderId ?? dto.purchaseOrderId ?? undefined,
    // BR-16: the list endpoint sends no buyer field; leave customerName empty
    customerName: '',
    amount: formatMoneyAmount(dto.totalAmount),
    amountPaise: safeToPaise(dto.totalAmount),
    issueDate: dto.issueDate,
    date: formatCalendarDate(dto.issueDate),
    status: mapInvoiceStatus(dto.status),
    statusLabel: apiStatusLabel(dto.status),
    warehouseId: undefined,
  };
}

export function mapInvoiceDetailDtoToRecord(dto: InvoiceDetailDto): InvoiceDetailRecord {
  const items: InvoiceLineItem[] = (dto.lines ?? []).map((line) => ({
    name: line.description,
    hsn: line.hsnCode ? `HSN ${line.hsnCode}` : '',
    // Quantity as the API sent it — string or number, no float math (spec gap noted in api/invoices.ts)
    quantity: String(line.qty),
    unitPrice: formatMoneyAmount(line.unitPrice),
    lineTotal: formatMoneyAmount(line.total),
  }));

  const cgstPaise = dto.cgst ? toPaise(dto.cgst) : 0;
  const sgstPaise = dto.sgst ? toPaise(dto.sgst) : 0;
  const igstPaise = dto.igst ? toPaise(dto.igst) : 0;
  const taxTotalPaise = cgstPaise + sgstPaise + igstPaise;

  return {
    // BR-36: id is the uuid, used for the download call
    id: dto.id,
    invoiceNumber: dto.invoiceNumber,
    invoiceType: dto.invoiceType,
    typeLabel: invoiceTypeLabel(dto.invoiceType),
    date: formatCalendarDate(dto.issueDate),
    status: mapInvoiceStatus(dto.status),
    statusLabel: apiStatusLabel(dto.status),
    orderId: dto.orderId ?? dto.purchaseOrderId ?? undefined,
    // BR-128: buyer fields come from the DTO; null means no buyer (farmer-side invoice)
    buyerName: dto.buyerName !== null ? (dto.buyerName ?? undefined) : undefined,
    buyerGstin: dto.buyerGstin !== null ? (dto.buyerGstin ?? undefined) : undefined,
    // customerName is what the Sub preview reads — buyer name or '' when there is none
    customerName: dto.buyerName ?? '',
    placeOfSupply: dto.placeOfSupply ?? undefined,
    items,
    taxable: formatMoneyAmount(dto.taxableAmount ?? dto.totalAmount),
    cgst: formatMoneyAmount(dto.cgst),
    sgst: formatMoneyAmount(dto.sgst),
    igst: formatMoneyAmount(dto.igst),
    gst: formatMoney(fromPaise(taxTotalPaise)),
    total: formatMoneyAmount(dto.totalAmount),
    // Every invoice the detail route returns is visible to the caller (BR-36);
    // the PDF may not be available yet when pdfUrl is null, but the download
    // button is still shown so the user can check back.
    downloadAvailable: true,
  };
}

// ─── Client-side list helpers ────────────────────────────────────────────────

/**
 * Filter and sort a loaded page of invoice rows.
 *
 * `search` is the live search string (typed in the header bar); it overrides
 * `filters.searchQuery` when non-empty so the caller doesn't need to sync both.
 * Amount bounds are rupee strings typed by the user and are compared in integer paise.
 */
export function filterAndSortInvoices(
  rows: InvoiceRecord[],
  filters: InvoiceFilterState,
  search: string,
): InvoiceRecord[] {
  const q = (search || filters.searchQuery).toLowerCase().trim();
  const minPaise = filterBoundPaise(filters.minAmount);
  const maxPaise = filterBoundPaise(filters.maxAmount);

  const filtered = rows.filter((row) => {
    if (filters.status !== 'All' && row.status !== filters.status) return false;
    if (filters.invoiceType !== 'All' && row.invoiceType !== filters.invoiceType) return false;
    if (q) {
      const haystack = `${row.invoiceNumber} ${row.customerName}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    const paise = row.amountPaise;
    if (paise !== null) {
      if (minPaise !== null && paise < minPaise) return false;
      if (maxPaise !== null && paise > maxPaise) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (filters.sortBy) {
      case 'Oldest First':
        return a.issueDate.localeCompare(b.issueDate);
      case 'Highest Amount':
        return (b.amountPaise ?? 0) - (a.amountPaise ?? 0);
      case 'Lowest Amount':
        return (a.amountPaise ?? 0) - (b.amountPaise ?? 0);
      case 'Newest First':
      default:
        return b.issueDate.localeCompare(a.issueDate);
    }
  });
}

// ─── GET /invoices query builder ────────────────────────────────────────────

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a DD/MM/YYYY user string to YYYY-MM-DD; undefined when the input is malformed. */
function parseCustomDate(s: string): string | undefined {
  const parts = s.split('/');
  if (parts.length !== 3) return undefined;
  const [dd, mm, yyyy] = parts;
  if (!dd || !mm || !yyyy) return undefined;
  const d = parseInt(dd, 10);
  const mo = parseInt(mm, 10);
  const y = parseInt(yyyy, 10);
  if (isNaN(d) || isNaN(mo) || isNaN(y)) return undefined;
  return `${String(y).padStart(4, '0')}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * Builds the server query for GET /invoices from the current filter state.
 * The server is the source of truth for scope (BR-30); a warehouseId in the
 * filter state is not sent (no warehouseId query param on GET /invoices).
 */
export function invoiceListQuery(
  filters: InvoiceFilterState,
  now: Date = new Date(),
): { type?: InvoiceType; fromDate?: string; toDate?: string } {
  const type = filters.invoiceType !== 'All' ? filters.invoiceType : undefined;

  let fromDate: string | undefined;
  let toDate: string | undefined;

  switch (filters.datePreset) {
    case 'Today': {
      const today = toYmd(now);
      fromDate = today;
      toDate = today;
      break;
    }
    case 'Last 7 Days': {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      fromDate = toYmd(d);
      toDate = toYmd(now);
      break;
    }
    case 'This Month': {
      fromDate = toYmd(new Date(now.getFullYear(), now.getMonth(), 1));
      toDate = toYmd(now);
      break;
    }
    case 'Custom': {
      fromDate = parseCustomDate(filters.startDate);
      toDate = parseCustomDate(filters.endDate);
      break;
    }
    // 'All Time': no date params
  }

  // exactOptionalPropertyTypes: omit keys whose value is undefined rather than
  // including them as explicit `undefined`, which is a distinct assignment.
  return {
    ...(type !== undefined ? { type } : {}),
    ...(fromDate !== undefined ? { fromDate } : {}),
    ...(toDate !== undefined ? { toDate } : {}),
  };
}

// ─── Hub KPI tiles ────────────────────────────────────────────────────────────

/**
 * Derives the four hub KPI tile values from a today summary and an all-time summary.
 * Both come from GET /invoices/summary (BR-30: server-scoped, never from constants).
 * Returns '—' for every tile when either summary is loading / unavailable.
 */
export function invoiceKpis(
  todaySummary: InvoiceSummaryDto | undefined,
  allSummary: InvoiceSummaryDto | undefined,
): { today: string; issued: string; draft: string; cancelled: string } {
  if (!todaySummary || !allSummary) {
    return { today: '—', issued: '—', draft: '—', cancelled: '—' };
  }

  const countByStatus = (summary: InvoiceSummaryDto, status: ApiInvoiceStatus): number =>
    summary.byStatus.find((s) => s.status === status)?.count ?? 0;

  return {
    today: String(todaySummary.count),
    issued: String(countByStatus(allSummary, 'ISSUED')),
    draft: String(countByStatus(allSummary, 'DRAFT')),
    cancelled: String(countByStatus(allSummary, 'CANCELLED')),
  };
}
