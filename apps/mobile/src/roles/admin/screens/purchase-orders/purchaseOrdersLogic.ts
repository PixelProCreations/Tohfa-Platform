/**
 * Pure logic of the Purchase Orders screens (no react-native import, so vitest
 * runs it in plain Node): access by permission code, the design's filter chips
 * mapped onto the API's query params, Money / Quantity formatting without
 * floats, status badges, and the list / detail view models.
 *
 * Everything shown comes from GET /admin/purchase-orders(/{id}). A design
 * field the API does not send is the dash, never a guess.
 */
import { format, isMoney, parseMoney } from '@tohfa/shared-types';
import type { PurchaseOrderDetailRowDto, PurchaseOrderListItemDto, PurchaseOrderStatus } from '../../api/purchaseOrders';
import { t, type TranslationKey } from '../../i18n';
import { formatKg, parseKgToGrams } from '../../money/quantity';
import type { Can } from '../../permissions/can';
import { formatAdminDay, istDay } from '../../utils/datetime';

export const DASH = '—';

/** docs/rbac.json: the only code these read-only screens need. */
export const PURCHASE_ORDER_VIEW = 'purchase.order.view';

export interface PurchaseOrdersAccess {
  canView: boolean;
}

/** Fail closed: no `can` means nothing is permitted. */
export function purchaseOrdersAccess(can: Can | undefined): PurchaseOrdersAccess {
  return { canView: typeof can === 'function' && can(PURCHASE_ORDER_VIEW) };
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

/** The design's status chips (list: all four; history: All + Completed). */
export type StatusChip = 'ALL' | 'AWAITING_HANDOVER' | 'COLLECTION_SCHEDULED' | 'COMPLETED';
export const ORDER_STATUS_CHIPS: readonly StatusChip[] = ['ALL', 'AWAITING_HANDOVER', 'COLLECTION_SCHEDULED', 'COMPLETED'];
export const HISTORY_STATUS_CHIPS: readonly StatusChip[] = ['ALL', 'COMPLETED'];

/** The design history's period chips. */
export type PeriodChip = 'ALL' | 'LAST_7' | 'LAST_30';
export const PERIOD_CHIPS: readonly PeriodChip[] = ['ALL', 'LAST_7', 'LAST_30'];

export interface ChipStatusParam {
  /** false: the API has no such status; the chip is drawn disabled. */
  available: boolean;
  status: PurchaseOrderStatus | undefined;
}

/**
 * Design chip -> API `status`. "Awaiting Handover" is an issued order not yet
 * received; "Completed" is the spec's RECEIVED. The API has no "collection
 * scheduled" state, so that chip is not available.
 */
export function chipStatusParam(chip: StatusChip): ChipStatusParam {
  switch (chip) {
    case 'AWAITING_HANDOVER':
      return { available: true, status: 'ISSUED' };
    case 'COMPLETED':
      return { available: true, status: 'RECEIVED' };
    case 'COLLECTION_SCHEDULED':
      return { available: false, status: undefined };
    default:
      return { available: true, status: undefined };
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" minus `days` calendar days. */
function minusDays(day: string, days: number): string {
  const [y, m, d] = day.split('-').map((part) => parseInt(part, 10)) as [number, number, number];
  const shifted = new Date(Date.UTC(y, m - 1, d) - days * DAY_MS);
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${mm}-${dd}`;
}

/** Inclusive IST days ending today (BR-122 `from` / `to` are IST days of `issuedAt`). */
export function periodRange(chip: PeriodChip, now: Date): { from?: string; to?: string } {
  if (chip === 'ALL') return {};
  const today = istDay(now);
  return { from: minusDays(today, chip === 'LAST_7' ? 6 : 29), to: today };
}

/** The API's `q`: trimmed, 1-100 characters, absent when blank. */
export const SEARCH_MAX = 100;
export function searchParam(text: string): string | undefined {
  const trimmed = text.trim();
  return trimmed === '' ? undefined : trimmed.slice(0, SEARCH_MAX);
}

export interface FilterState {
  status: StatusChip;
  period: PeriodChip;
  search: string;
}

export interface ListFilters {
  status?: PurchaseOrderStatus;
  q?: string;
  from?: string;
  to?: string;
}

export function buildListFilters(state: FilterState, now: Date): ListFilters {
  const out: ListFilters = {};
  const status = chipStatusParam(state.status);
  if (status.available && status.status !== undefined) out.status = status.status;
  const q = searchParam(state.search);
  if (q !== undefined) out.q = q;
  const range = periodRange(state.period, now);
  if (range.from !== undefined) out.from = range.from;
  if (range.to !== undefined) out.to = range.to;
  return out;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** "₹2,250" / "₹512.32"; the dash for anything that is not a Money string. */
export function formatMoneyOrDash(value: unknown): string {
  if (typeof value !== 'string' || !isMoney(value)) return DASH;
  return format(parseMoney(value)).replace(/\.00$/, '');
}

export function formatPricePerKgOrDash(value: unknown): string {
  const money = formatMoneyOrDash(value);
  return money === DASH ? DASH : t('purchaseOrders.perKg', { price: money });
}

/** Quantity (kg decimal string) through integer grams; the dash when it does not parse. */
export function formatQtyOrDash(value: unknown): string {
  if (typeof value !== 'string') return DASH;
  const grams = parseKgToGrams(value);
  return grams === null ? DASH : formatKg(grams);
}

export function textOrDash(value: string | null | undefined): string {
  return typeof value === 'string' && value.trim() !== '' ? value : DASH;
}

const GRADE_KEYS: Readonly<Record<string, TranslationKey>> = {
  GRADE_1: 'purchaseOrders.grade.GRADE_1',
  GRADE_2: 'purchaseOrders.grade.GRADE_2',
  GRADE_3: 'purchaseOrders.grade.GRADE_3',
  REJECT: 'purchaseOrders.grade.REJECT',
};

/** "Okra, Grade 1" (the design's "Carrot, Grade 1"); the crop alone without a grade; dash without a crop. */
export function produceLabel(cropName: string | null | undefined, grade: string | undefined): string {
  if (typeof cropName !== 'string' || cropName.trim() === '') return DASH;
  const gradeKey = grade === undefined ? undefined : GRADE_KEYS[grade];
  return gradeKey === undefined ? cropName : t('purchaseOrders.produceGrade', { crop: cropName, grade: t(gradeKey) });
}

// ---------------------------------------------------------------------------
// Status badges
// ---------------------------------------------------------------------------

export type StatusTone = 'amber' | 'blue' | 'green' | 'muted';

export interface StatusView {
  labelKey: TranslationKey | null;
  tone: StatusTone;
}

/** The design's amber / blue / green badges on the API's statuses (plus the server's own enum names). */
export function statusView(status: string): StatusView {
  switch (status) {
    case 'ISSUED':
      return { labelKey: 'purchaseOrders.status.ISSUED', tone: 'amber' };
    case 'PARTIALLY_RECEIVED':
      return { labelKey: 'purchaseOrders.status.PARTIALLY_RECEIVED', tone: 'blue' };
    case 'RECEIVED':
    case 'FULLY_RECEIVED':
      return { labelKey: 'purchaseOrders.status.RECEIVED', tone: 'green' };
    case 'CANCELLED':
      return { labelKey: 'purchaseOrders.status.CANCELLED', tone: 'muted' };
    case 'CLOSED':
      return { labelKey: 'purchaseOrders.status.CLOSED', tone: 'muted' };
    default:
      return { labelKey: null, tone: 'muted' };
  }
}

export function statusLabel(status: string): string {
  const view = statusView(status);
  return view.labelKey === null ? DASH : t(view.labelKey);
}

// ---------------------------------------------------------------------------
// View models
// ---------------------------------------------------------------------------

export interface OrderRowView {
  id: string;
  poNumber: string;
  farmer: string;
  produce: string;
  quantity: string;
  total: string;
  statusText: string;
  tone: StatusTone;
}

export function toOrderRow(dto: PurchaseOrderListItemDto): OrderRowView {
  return {
    id: dto.id,
    poNumber: textOrDash(dto.poNumber),
    farmer: textOrDash(dto.farmerName),
    produce: produceLabel(dto.cropName, dto.grade),
    quantity: formatQtyOrDash(dto.quantityKg),
    total: formatMoneyOrDash(dto.totalAmount),
    statusText: statusLabel(dto.status),
    tone: statusView(dto.status).tone,
  };
}

export interface DetailView {
  poNumber: string;
  statusText: string;
  listingId: string;
  farmer: string;
  produce: string;
  farmerId: string;
  /** Not in the API. */
  farmLocation: string;
  /** Not in the API (the listing's own quantity / price are not returned). */
  listedQty: string;
  listedPrice: string;
  agreedQty: string;
  agreedPrice: string;
  total: string;
}

export function toDetailView(dto: PurchaseOrderDetailRowDto): DetailView {
  return {
    poNumber: textOrDash(dto.poNumber),
    statusText: statusLabel(dto.status),
    listingId: textOrDash(dto.listingId),
    farmer: textOrDash(dto.farmerName),
    produce: produceLabel(dto.cropName, dto.grade),
    farmerId: textOrDash(dto.tohfaFarmerId),
    farmLocation: DASH,
    listedQty: DASH,
    listedPrice: DASH,
    agreedQty: formatQtyOrDash(dto.quantityKg),
    agreedPrice: formatPricePerKgOrDash(dto.pricePerKg),
    total: formatMoneyOrDash(dto.totalAmount),
  };
}

export type TimelineKey = 'listingCreated' | 'listingApproved' | 'poCreated' | 'termsConfirmed' | 'current';

export interface TimelineStep {
  key: TimelineKey;
  title: string;
  time: string;
}

function dayOrDash(iso: string | null | undefined): string {
  if (typeof iso !== 'string') return DASH;
  const day = formatAdminDay(iso);
  return day === '' ? DASH : day;
}

/**
 * The design's five timeline steps. The API returns only when the order was
 * issued and when goods were received, so the listing and terms steps carry
 * the dash; the last step is the order's real status, dated by its latest
 * goods receipt when there is one.
 */
export function timelineSteps(dto: PurchaseOrderDetailRowDto): TimelineStep[] {
  const receipts = dto.goodsReceipts ?? [];
  let latest: string | undefined;
  for (const r of receipts) if (latest === undefined || r.receivedAt > latest) latest = r.receivedAt;
  const latestDay = dayOrDash(latest);
  return [
    { key: 'listingCreated', title: t('purchaseOrders.timeline.listingCreated'), time: DASH },
    { key: 'listingApproved', title: t('purchaseOrders.timeline.listingApproved'), time: DASH },
    { key: 'poCreated', title: t('purchaseOrders.timeline.poCreated'), time: dayOrDash(dto.issuedAt) },
    { key: 'termsConfirmed', title: t('purchaseOrders.timeline.termsConfirmed'), time: DASH },
    {
      key: 'current',
      title: statusLabel(dto.status),
      time: t('purchaseOrders.timeline.currentTime', { day: latestDay }),
    },
  ];
}

// ---------------------------------------------------------------------------
// Paging
// ---------------------------------------------------------------------------

export interface ScrollMetrics {
  layoutMeasurement: { height: number };
  contentOffset: { y: number };
  contentSize: { height: number };
}

/** Within roughly half a screen of the bottom: time to ask for the next page. */
export function isNearEnd(e: ScrollMetrics): boolean {
  const remaining = e.contentSize.height - (e.contentOffset.y + e.layoutMeasurement.height);
  return remaining <= e.layoutMeasurement.height / 2;
}
