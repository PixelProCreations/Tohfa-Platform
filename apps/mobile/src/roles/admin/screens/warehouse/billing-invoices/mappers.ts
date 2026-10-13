/**
 * Invoice DTO -> screen model.
 *
 * - Money strings become integer paise here, once (root CLAUDE.md §2.2).
 *   Parsing is strict: an amount the API should never send (e.g. 3 decimals)
 *   throws, and because mapping runs inside the query function that surfaces
 *   as the screen's error state rather than a silently rounded figure.
 * - Status/type maps are exhaustive `Record`s over the OpenAPI enums, plus a
 *   fallback so a value the server adds later renders as "Unknown"/"Other"
 *   instead of crashing.
 * - The models are allow-lists (BR-36): only the fields below are copied, so
 *   anything else the server adds to the payload never reaches a screen.
 */
import type {
  InvoiceDetailDto,
  InvoiceDto,
  InvoiceLineDto,
  InvoiceStatusDto,
  InvoiceTypeDto,
} from '../../../api/invoices';
import { INVOICE_TYPES } from '../../../api/invoices';
import type { TranslationKey } from '../../../i18n';
import { parseRupeesToPaise, type Paise } from '../../../money/paise';
import { parseKgToGrams, type Grams } from '../../../money/quantity';
import { formatIstDate } from '../../../utils/datetime';

export type StatusTone = 'success' | 'danger' | 'warning' | 'info';

export interface InvoiceStatusMeta {
  labelKey: TranslationKey;
  tone: StatusTone;
}

const STATUS_META: Record<InvoiceStatusDto, InvoiceStatusMeta> = {
  DRAFT: { labelKey: 'admin.invoices.status.DRAFT', tone: 'warning' },
  ISSUED: { labelKey: 'admin.invoices.status.ISSUED', tone: 'success' },
  CANCELLED: { labelKey: 'admin.invoices.status.CANCELLED', tone: 'danger' },
  CREDIT_NOTED: { labelKey: 'admin.invoices.status.CREDIT_NOTED', tone: 'info' },
};
const UNKNOWN_STATUS: InvoiceStatusMeta = { labelKey: 'admin.invoices.status.unknown', tone: 'info' };

const TYPE_LABEL: Record<InvoiceTypeDto, TranslationKey> = {
  SALE_RETAIL: 'admin.invoices.type.SALE_RETAIL',
  SALE_B2B: 'admin.invoices.type.SALE_B2B',
  PURCHASE_FARMER: 'admin.invoices.type.PURCHASE_FARMER',
  PAYOUT: 'admin.invoices.type.PAYOUT',
  SUBSCRIPTION: 'admin.invoices.type.SUBSCRIPTION',
};
const UNKNOWN_TYPE: TranslationKey = 'admin.invoices.type.unknown';

function has<K extends string>(map: Record<K, unknown>, key: string): key is K {
  return Object.prototype.hasOwnProperty.call(map, key);
}

export function invoiceStatusMeta(status: string): InvoiceStatusMeta {
  return has(STATUS_META, status) ? STATUS_META[status] : UNKNOWN_STATUS;
}

export function invoiceTypeLabelKey(type: string): TranslationKey {
  return has(TYPE_LABEL, type) ? TYPE_LABEL[type] : UNKNOWN_TYPE;
}

/**
 * The list's type filter chips: `undefined` = "All" (no `type` param). The
 * API filters by `type` only — there is no `status` query param on
 * `GET /invoices`, so there is no status filter.
 */
export const INVOICE_TYPE_FILTERS: readonly (InvoiceTypeDto | undefined)[] = [
  undefined,
  ...INVOICE_TYPES,
];

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  typeLabelKey: TranslationKey;
  status: InvoiceStatusMeta;
  /** DD/MM/YYYY, or the raw value if it is not a date. */
  issueDateLabel: string;
  taxablePaise: Paise | null;
  totalPaise: Paise;
  gstApplicable: boolean;
}

export interface InvoiceLine {
  key: string;
  description: string;
  hsnCode: string | null;
  qtyGrams: Grams | null;
  unitPricePaise: Paise | null;
  gstRate: number | null;
  taxablePaise: Paise | null;
  taxPaise: Paise | null;
  totalPaise: Paise | null;
}

export interface InvoiceDetail extends InvoiceRow {
  placeOfSupply: string | null;
  cgstPaise: Paise | null;
  sgstPaise: Paise | null;
  igstPaise: Paise | null;
  gstInclusive: boolean;
  lines: InvoiceLine[];
}

function optionalPaise(value: string | undefined): Paise | null {
  return value === undefined ? null : parseRupeesToPaise(value);
}

/**
 * Spec says `Quantity` (kg string); the server currently sends a JSON number
 * from `parseFloat` of a 3-decimal column. `toFixed(3)` recovers that exact
 * 3-decimal string before converting, so no float arithmetic touches it.
 */
function qtyToGrams(qty: string | number | undefined): Grams | null {
  if (qty === undefined) return null;
  return parseKgToGrams(typeof qty === 'number' ? qty.toFixed(3) : qty);
}

export function toInvoiceRow(dto: InvoiceDto): InvoiceRow {
  return {
    id: dto.id,
    invoiceNumber: dto.invoiceNumber,
    typeLabelKey: invoiceTypeLabelKey(dto.invoiceType),
    status: invoiceStatusMeta(dto.status),
    issueDateLabel: formatIstDate(dto.issueDate) ?? dto.issueDate,
    taxablePaise: optionalPaise(dto.taxableAmount),
    totalPaise: parseRupeesToPaise(dto.totalAmount),
    gstApplicable: dto.gstApplicable ?? false,
  };
}

function toInvoiceLine(line: InvoiceLineDto, index: number): InvoiceLine {
  return {
    key: String(index),
    description: line.description ?? '',
    hsnCode: line.hsnCode ?? null,
    qtyGrams: qtyToGrams(line.qty),
    unitPricePaise: optionalPaise(line.unitPrice),
    gstRate: line.gstRate ?? null,
    taxablePaise: optionalPaise(line.taxable),
    taxPaise: optionalPaise(line.tax),
    totalPaise: optionalPaise(line.total),
  };
}

export function toInvoiceDetail(dto: InvoiceDetailDto): InvoiceDetail {
  return {
    ...toInvoiceRow(dto),
    placeOfSupply: dto.placeOfSupply ?? null,
    cgstPaise: optionalPaise(dto.cgst),
    sgstPaise: optionalPaise(dto.sgst),
    igstPaise: optionalPaise(dto.igst),
    gstInclusive: dto.gstInclusive ?? false,
    lines: (dto.lines ?? []).map(toInvoiceLine),
  };
}
