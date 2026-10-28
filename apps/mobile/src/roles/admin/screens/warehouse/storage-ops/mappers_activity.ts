/**
 * Warehouse Activity (design D03: Today's Operations / the activity log) on
 * GET /warehouses/{id}/activity (BR-104). Every decision the screen makes is a
 * pure function here so plain-Node vitest covers it
 * (tests/storageOps_activity.test.ts); the hook and the screen only pass
 * values through.
 *
 * WHY the rows carry only what the API sends: an activity event has no actor
 * name, no free text and no farm data (BR-104 item 5), so a card or the detail
 * screen shows the type, reference, status, kg, direction, warehouse and time,
 * and hides everything else. Nothing here invents a value for a missing field.
 *
 * No React or react-native import.
 */
import { ACTIVITY_TYPES, type ActivityTypeCode, type WarehouseActivityEventDto } from '../../../api/warehouseActivity';
import { hasKey, t } from '../../../i18n';
import { formatKg, parseKgToGrams } from '../../../money/quantity';
import { formatAdminDate, istDay } from '../../../utils/datetime';
import type { ActivityModule, ActivityPreset, WarehouseScope } from './types';

/** docs/rbac.json code for the feed (Main all, Sub own). */
export const ACTIVITY_VIEW_CODE = 'warehouse.activity.view';
/** docs/rbac.json code for GET /warehouses (the Main all-warehouses list). */
export const ALL_WAREHOUSES_VIEW_CODE = 'warehouse.all.view';

/**
 * Rows read per warehouse feed. A technical page size (the API allows 1-100),
 * not a business threshold: the design has no "load more", so the screen shows
 * the newest page of each warehouse.
 */
export const ACTIVITY_FEED_LIMIT = 50;

// ─── Filter chips ────────────────────────────────────────────────────────────

/** A filter chip: everything, or one of the API's six event types. */
export type ActivityChip = 'all' | ActivityTypeCode;

/** The chips in screen order. Only filters the API takes (no Material Handling, cash, QC or orders). */
export const ACTIVITY_CHIPS: readonly ActivityChip[] = ['all', ...ACTIVITY_TYPES];

export function activityTypeLabel(type: ActivityTypeCode): string {
  return t(`storageOps.activity.type.${type}`);
}

export function activityChipLabel(chip: ActivityChip): string {
  return chip === 'all' ? t('storageOps.activity.filter.all') : activityTypeLabel(chip);
}

/** The `type` filter the API is sent; undefined = every type. */
export function activityTypesFor(chip: ActivityChip): readonly ActivityTypeCode[] | undefined {
  return chip === 'all' ? undefined : [chip];
}

/** Today = the IST calendar day as from = to; All = no range. */
export function activityRange(preset: ActivityPreset | undefined, now: Date): { from?: string; to?: string } {
  if (preset !== 'Today') return {};
  const day = istDay(now);
  return { from: day, to: day };
}

// ─── Which feeds to read ─────────────────────────────────────────────────────

export interface ActivityWarehouse {
  id: string;
  /** The warehouse's full live name ("Coonoor Warehouse"). */
  name: string;
}

/**
 * The warehouses whose feeds the screen reads. A Sub admin always reads its
 * own warehouse, whatever is selected (BR-30). Main reads the selected live
 * warehouse, or every live warehouse with no selection; before the live list
 * has loaded, or for a selection the list does not hold, it reads nothing
 * rather than guessing an id.
 */
export function activityFetchTargets(
  scope: WarehouseScope,
  selectedId: string | undefined,
  live: readonly ActivityWarehouse[] | undefined,
): ActivityWarehouse[] {
  if (scope.warehouseId !== undefined) return [{ id: scope.warehouseId, name: scope.warehouseName ?? '' }];
  if (live === undefined) return [];
  if (selectedId !== undefined) return live.filter((w) => w.id === selectedId);
  return [...live];
}

// ─── Merging several warehouses' pages ───────────────────────────────────────

export interface ActivityFeedPage {
  warehouseId: string;
  items: readonly WarehouseActivityEventDto[];
  /** The server has older events of this warehouse than the last item. */
  hasMore: boolean;
}

export interface MergedActivityEvent {
  warehouseId: string;
  event: WarehouseActivityEventDto;
}

const FRACTION_RE = /(T\d{2}:\d{2}:\d{2})\.(\d+)/;

/**
 * Microseconds since the epoch. The API sends microsecond precision; Date
 * keeps milliseconds, so the fraction is read from the text and added back.
 * A value that is not a date sorts last.
 */
function instantMicros(iso: string): number {
  const match = FRACTION_RE.exec(iso);
  const ms = Date.parse(match === null ? iso : iso.replace(FRACTION_RE, '$1'));
  if (!Number.isFinite(ms)) return Number.NEGATIVE_INFINITY;
  const micros = match === null ? 0 : Number((match[2] ?? '').padEnd(6, '0').slice(0, 6));
  return ms * 1000 + micros;
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** The server's order: occurredAt DESC, type DESC, sourceId DESC (BR-104 item 3). */
function newestFirst(a: { at: number; event: WarehouseActivityEventDto }, b: { at: number; event: WarehouseActivityEventDto }): number {
  if (a.at !== b.at) return b.at - a.at;
  const byType = compareText(b.event.type, a.event.type);
  return byType !== 0 ? byType : compareText(b.event.sourceId, a.event.sourceId);
}

/**
 * One newest-first timeline from each warehouse's first page.
 *
 * WHY the cut: a page that has more rows stops at some time T, and the rows
 * of that warehouse older than T were not read. Showing another warehouse's
 * rows older than T would present a timeline with a silent hole in it, so the
 * merge ends at the latest such T. A transfer is a row in both warehouses'
 * feeds (one outbound, one inbound) and appears once per warehouse.
 */
export function mergeActivityPages(pages: readonly ActivityFeedPage[]): MergedActivityEvent[] {
  let cutoff = Number.NEGATIVE_INFINITY;
  const seen = new Set<string>();
  const all: { at: number; warehouseId: string; event: WarehouseActivityEventDto }[] = [];
  for (const page of pages) {
    let oldest = Number.POSITIVE_INFINITY;
    for (const event of page.items) {
      const at = instantMicros(event.occurredAt);
      oldest = Math.min(oldest, at);
      const key = rowKey(page.warehouseId, event);
      if (seen.has(key)) continue;
      seen.add(key);
      all.push({ at, warehouseId: page.warehouseId, event });
    }
    if (page.hasMore && page.items.length > 0) cutoff = Math.max(cutoff, oldest);
  }
  return all
    .filter((e) => e.at >= cutoff)
    .sort(newestFirst)
    .map(({ warehouseId, event }) => ({ warehouseId, event }));
}

// ─── One card ────────────────────────────────────────────────────────────────

export type ActivityStatusTone = 'success' | 'warning' | 'danger';

export interface ActivityStatusBadgeView {
  label: string;
  tone: ActivityStatusTone;
}

const DONE_STATUSES: ReadonlySet<string> = new Set([
  'ACCEPTED',
  'PARTIALLY_ACCEPTED',
  'RECEIVED',
  'RESOLVED',
  'CLOSED',
  'APPROVED',
  'REFUNDED',
  'ARCHIVED',
]);
const PROBLEM_STATUSES: ReadonlySet<string> = new Set(['REJECTED', 'CANCELLED', 'OPEN']);

/**
 * The status badge, or null: no status, or a status the catalogue has no
 * label for (a raw server code is never shown).
 */
export function activityStatusBadge(status: string | null): ActivityStatusBadgeView | null {
  if (status === null) return null;
  const key = `storageOps.activity.status.${status}`;
  if (!hasKey(key)) return null;
  const tone: ActivityStatusTone = DONE_STATUSES.has(status) ? 'success' : PROBLEM_STATUSES.has(status) ? 'danger' : 'warning';
  return { label: t(key), tone };
}

/** "Coonoor Warehouse" -> "Coonoor"; other names unchanged. */
export function shortWarehouseName(name: string): string {
  return name.replace(/\s+Warehouse$/, '');
}

/**
 * The module that owns an event and has a live screen to open. Only goods
 * receipts do (the receiving tab); issues, transfers, returns, documents and
 * ledger rows have no live destination in this app yet, so they open nothing.
 */
export function activityModuleFor(type: ActivityTypeCode): ActivityModule | undefined {
  return type === 'GOODS_RECEIPT' ? 'receiving' : undefined;
}

/** One card / detail view of an event. Only API fields; no actor, free text or farm data. */
export interface ActivityRow {
  /** Unique per warehouse feed (a transfer is in two feeds). */
  key: string;
  type: ActivityTypeCode;
  sourceId: string;
  warehouseId: string;
  /** Short name for the card ("Coonoor"). */
  warehouseName: string;
  /** Full live name for the header ("Coonoor Warehouse"). */
  warehouseFullName: string;
  occurredAt: string;
  title: string;
  status: ActivityStatusBadgeView | null;
  subtitle: string;
  time: string;
  reference: string;
  /** Signed kg ("-12.5 kg"), or null when the event carries none. */
  qtyLabel: string | null;
  /** Inbound / Outbound for a transfer, else null. */
  directionLabel: string | null;
  module: ActivityModule | undefined;
}

function rowKey(warehouseId: string, event: WarehouseActivityEventDto): string {
  return `${warehouseId}:${event.type}:${event.sourceId}`;
}

function subtitleOf(reference: string, qty: string | null, warehouse: string): string {
  if (warehouse === '') {
    // No warehouse name to show (a scope without one): the two-part template
    // carries the kg instead, so the line never ends in a dangling separator.
    return qty === null ? reference : t('storageOps.activity.subtitle', { reference, warehouse: qty });
  }
  return qty === null
    ? t('storageOps.activity.subtitle', { reference, warehouse })
    : t('storageOps.activity.subtitleWithQty', { reference, qty, warehouse });
}

export function toActivityRow(event: WarehouseActivityEventDto, warehouse: ActivityWarehouse, now: Date): ActivityRow {
  const grams = event.qtyKg === null ? null : parseKgToGrams(event.qtyKg);
  const qtyLabel = grams === null ? null : formatKg(grams);
  const warehouseName = shortWarehouseName(warehouse.name);
  return {
    key: rowKey(warehouse.id, event),
    type: event.type,
    sourceId: event.sourceId,
    warehouseId: warehouse.id,
    warehouseName,
    warehouseFullName: warehouse.name,
    occurredAt: event.occurredAt,
    title: activityTypeLabel(event.type),
    status: activityStatusBadge(event.status),
    subtitle: subtitleOf(event.reference, qtyLabel, warehouseName),
    time: formatAdminDate(event.occurredAt, now),
    reference: event.reference,
    qtyLabel,
    directionLabel: event.direction === null ? null : t(`storageOps.activity.direction.${event.direction}`),
    module: activityModuleFor(event.type),
  };
}

/** Client-side search over the loaded rows: type label, reference and warehouse, case-insensitive. */
export function filterActivityRows(rows: readonly ActivityRow[], query: string): ActivityRow[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [...rows];
  return rows.filter((row) =>
    [row.title, row.reference, row.warehouseName, row.warehouseFullName].some((text) => text.toLowerCase().includes(q)),
  );
}
