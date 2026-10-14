/**
 * The invoice API rows -> the billing screens' types. Pure (no React), so
 * plain-Node vitest covers every rule (../../../tests/mappers_invoices.test.ts).
 *
 * Money becomes integer paise (parseMoney/toPaise through the order area's
 * moneyToPaise) and a line quantity integer grams (parseKgToGrams), read as
 * text and never through float maths. A figure the server did not send shows
 * as "no value", never as 0.
 *
 * Nothing is recomputed: the taxable value, each tax component and the total
 * are the invoice's own figures (the signed PDF is the document of record,
 * BR-36). The app adds nothing up.
 *
 * Every mapper is an allow-list: it copies named fields only, so a customer,
 * farm or farmer field a future server might add can never reach a screen
 * (BR-16). Statuses and types go through exhaustive tables with a fallback.
 */
import type { Paise } from '@tohfa/shared-types';
import type { InvoiceDetailDto, InvoiceDto, InvoiceLineDto, InvoiceStatus, InvoiceType } from '../../../api/invoices';
import { t, type TranslationKey } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { formatKg, parseKgToGrams } from '../../../money/quantity';
import type { AdminTone } from '../../../theme';
import { formatAdminDay } from '../../../utils/datetime';
import { moneyToPaise } from '../orders/mappers';
import type {
  InvoiceDayGroup,
  InvoiceDetailView,
  InvoiceHistoryChip,
  InvoiceLineView,
  InvoiceRow,
  InvoiceTaxRow,
  InvoiceUiStatus,
} from './types';

function has<K extends string>(table: Readonly<Record<K, unknown>>, key: string): key is K {
  return Object.prototype.hasOwnProperty.call(table, key);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** docs/openapi.yaml Invoice.issueDate is a calendar date. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function noValue(): string {
  return t('billing.noValue');
}

function paiseLabel(paise: Paise | null): string {
  return paise === null ? noValue() : formatPaise(paise);
}

/**
 * A line quantity in integer grams. The spec sends a kg string; the server
 * sends a JSON number today, which is read through its shortest text form
 * (1.25 -> "1.25"), so no float arithmetic ever touches it. Anything that is
 * not a plain kg value (an exponent, a unit) is null.
 */
function gramsOf(value: unknown): number | null {
  if (typeof value === 'string') return parseKgToGrams(value);
  if (typeof value === 'number' && Number.isFinite(value)) return parseKgToGrams(String(value));
  return null;
}

// ─── Ids and filters ─────────────────────────────────────────────────────────

/**
 * An invoice uuid, or undefined. Hosts that still pass a sample invoice
 * number ('INV-2026-001245') get "not found" instead of a request (BR-36: the
 * server answers 404 for anything it does not show this caller anyway).
 */
export function invoiceIdParam(value: unknown): string | undefined {
  return typeof value === 'string' && UUID_RE.test(value) ? value : undefined;
}

/** docs/openapi.yaml listInvoices `type`: the history chips filter on the server. */
const HISTORY_TYPE: Readonly<Record<InvoiceHistoryChip, InvoiceType | undefined>> = {
  All: undefined,
  Retail: 'SALE_RETAIL',
  B2B: 'SALE_B2B',
};

export function historyTypeFilter(chip: InvoiceHistoryChip): InvoiceType | undefined {
  return HISTORY_TYPE[chip];
}

// ─── Status and type ─────────────────────────────────────────────────────────

/** docs/openapi.yaml Invoice.status, every value, 1:1. */
export const INVOICE_STATUS_TABLE: Readonly<Record<InvoiceStatus, InvoiceUiStatus>> = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  CANCELLED: 'cancelled',
  CREDIT_NOTED: 'creditNoted',
};

const INVOICE_STATUS_LABEL: Readonly<Record<InvoiceUiStatus, TranslationKey>> = {
  issued: 'billing.status.issued',
  draft: 'billing.status.draft',
  cancelled: 'billing.status.cancelled',
  creditNoted: 'billing.status.creditNoted',
  unknown: 'billing.status.unknown',
};

const INVOICE_STATUS_TONE: Readonly<Record<InvoiceUiStatus, AdminTone>> = {
  issued: 'success',
  draft: 'warning',
  cancelled: 'danger',
  creditNoted: 'info',
  unknown: 'brandSoft',
};

export function invoiceStatusOf(status: string): InvoiceUiStatus {
  return has(INVOICE_STATUS_TABLE, status) ? INVOICE_STATUS_TABLE[status] : 'unknown';
}

/** docs/openapi.yaml InvoiceType, every value. */
export const INVOICE_TYPE_TABLE: Readonly<Record<InvoiceType, TranslationKey>> = {
  SALE_RETAIL: 'billing.type.SALE_RETAIL',
  SALE_B2B: 'billing.type.SALE_B2B',
  PURCHASE_FARMER: 'billing.type.PURCHASE_FARMER',
  PAYOUT: 'billing.type.PAYOUT',
  SUBSCRIPTION: 'billing.type.SUBSCRIPTION',
};

function invoiceTypeLabel(type: string): string {
  return has(INVOICE_TYPE_TABLE, type) ? t(INVOICE_TYPE_TABLE[type]) : noValue();
}

function issueDateLabel(date: unknown): string {
  if (typeof date !== 'string' || !DATE_RE.test(date)) return noValue();
  // A date-only string parses as UTC midnight, which is 05:30 the same day in IST.
  return formatAdminDay(date) || noValue();
}

// ─── Rows ────────────────────────────────────────────────────────────────────

export function toInvoiceRow(dto: InvoiceDto): InvoiceRow {
  const status = invoiceStatusOf(dto.status);
  const amountPaise = moneyToPaise(dto.totalAmount);
  return {
    id: dto.id,
    invoiceNumber: dto.invoiceNumber,
    typeLabel: invoiceTypeLabel(dto.invoiceType),
    status,
    statusLabel: t(INVOICE_STATUS_LABEL[status]),
    tone: INVOICE_STATUS_TONE[status],
    amountPaise,
    amountLabel: paiseLabel(amountPaise),
    issueDate: typeof dto.issueDate === 'string' ? dto.issueDate : '',
    issueDateLabel: issueDateLabel(dto.issueDate),
  };
}

function toLine(dto: InvoiceLineDto, index: number): InvoiceLineView {
  const qtyGrams = gramsOf(dto.qty);
  const unitPricePaise = moneyToPaise(dto.unitPrice);
  const totalPaise = moneyToPaise(dto.total);
  return {
    key: String(index),
    description: typeof dto.description === 'string' ? dto.description : noValue(),
    hsnCode: typeof dto.hsnCode === 'string' && dto.hsnCode !== '' ? dto.hsnCode : null,
    qtyGrams,
    qtyLabel: qtyGrams === null ? noValue() : formatKg(qtyGrams),
    unitPricePaise,
    unitPriceLabel: paiseLabel(unitPricePaise),
    totalPaise,
    totalLabel: paiseLabel(totalPaise),
  };
}

const TAX_LABEL: Readonly<Record<InvoiceTaxRow['key'], TranslationKey>> = {
  cgst: 'billing.detail.cgst',
  sgst: 'billing.detail.sgst',
  igst: 'billing.detail.igst',
};

/** The tax components the invoice carries, in CGST, SGST, IGST order; a zero or invalid one is left out. */
function taxRows(dto: InvoiceDetailDto): InvoiceTaxRow[] {
  const rows: InvoiceTaxRow[] = [];
  for (const key of ['cgst', 'sgst', 'igst'] as const) {
    const paise = moneyToPaise(dto[key]);
    if (paise === null || paise === 0) continue;
    rows.push({ key, label: t(TAX_LABEL[key]), paise, amountLabel: formatPaise(paise) });
  }
  return rows;
}

export function toInvoiceDetail(dto: InvoiceDetailDto): InvoiceDetailView {
  const row = toInvoiceRow(dto);
  const taxablePaise = moneyToPaise(dto.taxableAmount);
  return {
    ...row,
    placeOfSupply: typeof dto.placeOfSupply === 'string' && dto.placeOfSupply !== '' ? dto.placeOfSupply : null,
    gstApplicable: dto.gstApplicable === true,
    gstInclusive: dto.gstInclusive === true,
    lines: Array.isArray(dto.lines) ? dto.lines.map(toLine) : [],
    taxablePaise,
    taxableLabel: paiseLabel(taxablePaise),
    taxRows: taxRows(dto),
    totalPaise: row.amountPaise,
    totalLabel: row.amountLabel,
  };
}

/** The history layout: rows grouped by issue day, in the order the server sent them (newest first). */
export function groupInvoicesByDay(rows: readonly InvoiceRow[]): InvoiceDayGroup[] {
  const groups: InvoiceDayGroup[] = [];
  const byDay = new Map<string, InvoiceDayGroup>();
  for (const row of rows) {
    let group = byDay.get(row.issueDate);
    if (group === undefined) {
      group = { day: row.issueDate, label: row.issueDateLabel, rows: [] };
      byDay.set(row.issueDate, group);
      groups.push(group);
    }
    group.rows.push(row);
  }
  return groups;
}
