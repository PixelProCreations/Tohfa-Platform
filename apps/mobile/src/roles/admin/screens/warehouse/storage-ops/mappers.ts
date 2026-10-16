/**
 * API rows -> the live storage-ops views (operational issues, warehouse
 * activity, storage locations, capacity, performance and the operations hub),
 * and the form drafts -> request bodies.
 *
 * Pure, so plain-Node vitest covers every branch
 * (../../../tests/mappers_storageOps.test.ts). Weights are integer grams: the
 * API's kg strings are read as text (parseKgToGrams), never through
 * parseFloat. Every word comes from the admin i18n catalogue.
 *
 * What the API does not carry is not invented. An issue has no location,
 * photos or people's names (only user uuids); an activity event has no free
 * text and no detail route; a storage location has no rack / shelf / bin
 * layout and no stock of its own. Per-location stock is DERIVED from the
 * warehouse's ACTIVE batches whose free-text `storageLocation` equals the
 * location's code (the code is what the receiving flow records), and the
 * screens say so.
 */
import type { BatchDto } from '../../../api/inventory';
import type { WarehouseActivityEventDto, ActivityTypeCode } from '../../../api/warehouseActivity';
import type {
  CreateWarehouseIssueBody,
  IssueCategoryCode,
  IssueSeverityCode,
  IssueStatusCode,
  UpdateWarehouseIssueBody,
  WarehouseIssueCommentDto,
  WarehouseIssueDto,
} from '../../../api/warehouseIssues';
import type { StockMovementTypeCode, WarehousePerformanceDto } from '../../../api/warehouseOps';
import type { StorageLocationDto, WarehouseCapacityDto } from '../../../api/warehouses';
import { t, type TranslationKey } from '../../../i18n';
import { formatKg, gramsToKgString, parseKgToGrams } from '../../../money/quantity';
import type { AdminTone } from '../../../theme';
import { formatAdminDate } from '../../../utils/datetime';
import { gradeLabel } from '../inventory/mappers';
import type { ActivityModule, WarehouseScope } from './types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function has<K extends string>(table: Record<K, unknown>, value: string): value is K {
  return Object.prototype.hasOwnProperty.call(table, value);
}

function text(value: string | null | undefined): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

/** A Quantity string as grams; null when absent or not a Quantity. */
function grams(value: string | null | undefined): number | null {
  return typeof value === 'string' ? parseKgToGrams(value) : null;
}

// ─── Warehouse and dates ─────────────────────────────────────────────────────

export function isUuid(value: string | undefined | null): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

/**
 * The warehouse uuid every storage-ops request sends (BR-30). A Sub scope is
 * ALWAYS its own warehouse, whatever was selected; the Main view sends its pick
 * only when the pick is a uuid (the old fixture ids such as 'WH-OOTY' are not,
 * and the server refuses them). undefined = nothing to ask for yet.
 */
export function storageWarehouseId(scope: WarehouseScope, selectedId: string | undefined): string | undefined {
  if (scope.warehouseId !== undefined) return isUuid(scope.warehouseId) ? scope.warehouseId : undefined;
  return isUuid(selectedId) ? selectedId : undefined;
}

/** The IST calendar date `daysBack` days before `now`, as YYYY-MM-DD (fixed +05:30, as utils/datetime). */
export function istDate(now: Date, daysBack = 0): string {
  return new Date(now.getTime() + IST_OFFSET_MS - daysBack * DAY_MS).toISOString().slice(0, 10);
}

// ─── Operational issues (BR-103) ─────────────────────────────────────────────

export const ISSUE_STATUS_LABEL: Readonly<Record<IssueStatusCode, TranslationKey>> = {
  OPEN: 'storageOps.issue.status.OPEN',
  IN_PROGRESS: 'storageOps.issue.status.IN_PROGRESS',
  RESOLVED: 'storageOps.issue.status.RESOLVED',
  CLOSED: 'storageOps.issue.status.CLOSED',
};

export const ISSUE_STATUS_TONE: Readonly<Record<IssueStatusCode, AdminTone>> = {
  OPEN: 'danger',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'info',
};

export const ISSUE_SEVERITY_LABEL: Readonly<Record<IssueSeverityCode, TranslationKey>> = {
  LOW: 'storageOps.issue.severity.LOW',
  MEDIUM: 'storageOps.issue.severity.MEDIUM',
  HIGH: 'storageOps.issue.severity.HIGH',
  CRITICAL: 'storageOps.issue.severity.CRITICAL',
};

export const ISSUE_SEVERITY_TONE: Readonly<Record<IssueSeverityCode, AdminTone>> = {
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'danger',
  CRITICAL: 'danger',
};

export const ISSUE_CATEGORY_LABEL: Readonly<Record<IssueCategoryCode, TranslationKey>> = {
  EQUIPMENT: 'storageOps.issue.category.EQUIPMENT',
  STORAGE: 'storageOps.issue.category.STORAGE',
  QUALITY: 'storageOps.issue.category.QUALITY',
  SAFETY: 'storageOps.issue.category.SAFETY',
  STAFFING: 'storageOps.issue.category.STAFFING',
  OTHER: 'storageOps.issue.category.OTHER',
};

export function issueStatusLabel(status: string): string {
  return has(ISSUE_STATUS_LABEL, status) ? t(ISSUE_STATUS_LABEL[status]) : t('storageOps.status.unknown', { status });
}

export function issueStatusTone(status: string): AdminTone {
  return has(ISSUE_STATUS_TONE, status) ? ISSUE_STATUS_TONE[status] : 'info';
}

export function issueSeverityLabel(severity: string): string {
  return has(ISSUE_SEVERITY_LABEL, severity) ? t(ISSUE_SEVERITY_LABEL[severity]) : t('storageOps.status.unknown', { status: severity });
}

export function issueSeverityTone(severity: string): AdminTone {
  return has(ISSUE_SEVERITY_TONE, severity) ? ISSUE_SEVERITY_TONE[severity] : 'info';
}

export function issueCategoryLabel(category: string): string {
  return has(ISSUE_CATEGORY_LABEL, category) ? t(ISSUE_CATEGORY_LABEL[category]) : t('storageOps.status.unknown', { status: category });
}

/** The issue list status chips; 'ALL' sends no status filter. */
export type IssueListFilter = IssueStatusCode | 'ALL';
export const ISSUE_FILTERS: readonly IssueListFilter[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ALL'];

export function issueFilterLabel(filter: IssueListFilter): string {
  return filter === 'ALL' ? t('storageOps.filter.all') : t(ISSUE_STATUS_LABEL[filter]);
}

/** The server-side `status` filter of a chip. */
export function issueFilterStatus(filter: IssueListFilter): IssueStatusCode | undefined {
  return filter === 'ALL' ? undefined : filter;
}

/** One issue as the list and the detail show it. */
export interface IssueRow {
  id: string;
  issueNumber: string;
  warehouseId: string;
  title: string;
  description: string | undefined;
  status: IssueStatusCode;
  statusLabel: string;
  statusTone: AdminTone;
  severity: IssueSeverityCode;
  severityLabel: string;
  severityTone: AdminTone;
  category: IssueCategoryCode;
  categoryLabel: string;
  reportedAt: string;
  updatedAt: string | undefined;
  resolvedAt: string | undefined;
  resolutionNote: string | undefined;
  closedAt: string | undefined;
  isAssigned: boolean;
}

export function toIssueRow(dto: WarehouseIssueDto, now: Date): IssueRow {
  const when = (iso: string | null | undefined) => (iso ? formatAdminDate(iso, now) || undefined : undefined);
  return {
    id: dto.id,
    issueNumber: dto.issueNumber,
    warehouseId: dto.warehouseId,
    title: dto.title,
    description: text(dto.description),
    status: dto.status,
    statusLabel: issueStatusLabel(dto.status),
    statusTone: issueStatusTone(dto.status),
    severity: dto.severity,
    severityLabel: issueSeverityLabel(dto.severity),
    severityTone: issueSeverityTone(dto.severity),
    category: dto.category,
    categoryLabel: issueCategoryLabel(dto.category),
    reportedAt: formatAdminDate(dto.createdAt, now),
    updatedAt: when(dto.updatedAt),
    resolvedAt: when(dto.resolvedAt),
    resolutionNote: text(dto.resolutionNote),
    closedAt: when(dto.closedAt),
    isAssigned: dto.assignedTo !== null,
  };
}

export interface IssueCommentRow {
  id: string;
  body: string;
  at: string;
}

export function toIssueCommentRow(dto: WarehouseIssueCommentDto, now: Date): IssueCommentRow {
  return { id: dto.id, body: dto.body, at: formatAdminDate(dto.createdAt, now) };
}

/**
 * The status moves an issue's detail offers, mirroring BR-103 rule 3 so the
 * screen does not offer a button the server will refuse. The server still
 * decides (409 INVALID_STATE_TRANSITION). CLOSED is terminal.
 */
export const ISSUE_NEXT_STATUSES: Readonly<Record<IssueStatusCode, readonly IssueStatusCode[]>> = {
  OPEN: ['IN_PROGRESS', 'RESOLVED'],
  IN_PROGRESS: ['OPEN', 'RESOLVED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
};

/** The action label of a status move ("Start work", "Resolve", "Reopen", ...). */
export function issueActionLabel(from: IssueStatusCode, to: IssueStatusCode): string {
  if (to === 'IN_PROGRESS') return t(from === 'RESOLVED' ? 'storageOps.issue.action.reopen' : 'storageOps.issue.action.start');
  if (to === 'OPEN') return t('storageOps.issue.action.backToOpen');
  if (to === 'RESOLVED') return t('storageOps.issue.action.resolve');
  return t('storageOps.issue.action.close');
}

/** A closed issue takes no new comment (BR-103 rule 5). */
export function canCommentOn(status: IssueStatusCode): boolean {
  return status !== 'CLOSED';
}

/** Field limits of the issue form (the server's zod schema; validation lengths, not business thresholds). */
export const ISSUE_LIMITS = { title: 160, description: 4000, resolutionNote: 2000, comment: 2000 } as const;

export interface IssueDraft {
  category: IssueCategoryCode | undefined;
  severity: IssueSeverityCode | undefined;
  title: string;
  description: string;
}

export type IssueDraftField = 'category' | 'severity' | 'title' | 'description';

export type IssueDraftResult =
  | { ok: true; body: CreateWarehouseIssueBody }
  | { ok: false; errors: Partial<Record<IssueDraftField, TranslationKey>> };

/** Validates the Report Issue form and builds the POST body (only documented fields). */
export function buildCreateIssueBody(draft: IssueDraft): IssueDraftResult {
  const errors: Partial<Record<IssueDraftField, TranslationKey>> = {};
  const title = draft.title.trim();
  const description = draft.description.trim();
  if (draft.category === undefined) errors.category = 'storageOps.report.error.category';
  if (draft.severity === undefined) errors.severity = 'storageOps.report.error.severity';
  if (title === '') errors.title = 'storageOps.report.error.title';
  else if (title.length > ISSUE_LIMITS.title) errors.title = 'storageOps.report.error.titleLong';
  if (description.length > ISSUE_LIMITS.description) errors.description = 'storageOps.report.error.descriptionLong';
  if (draft.category === undefined || draft.severity === undefined || Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    body: {
      category: draft.category,
      severity: draft.severity,
      title,
      ...(description === '' ? {} : { description }),
    },
  };
}

export type StatusChangeResult = { ok: true; body: UpdateWarehouseIssueBody } | { ok: false; error: TranslationKey };

/** The PATCH body of a status move; RESOLVED needs a resolution note (422 on the server otherwise). */
export function buildStatusChange(to: IssueStatusCode, note: string): StatusChangeResult {
  if (to !== 'RESOLVED') return { ok: true, body: { status: to } };
  const resolutionNote = note.trim();
  if (resolutionNote === '') return { ok: false, error: 'storageOps.issue.error.noteRequired' };
  if (resolutionNote.length > ISSUE_LIMITS.resolutionNote) return { ok: false, error: 'storageOps.issue.error.noteLong' };
  return { ok: true, body: { status: to, resolutionNote } };
}

export type CommentResult = { ok: true; body: string } | { ok: false; error: TranslationKey };

export function buildComment(input: string): CommentResult {
  const body = input.trim();
  if (body === '') return { ok: false, error: 'storageOps.issue.error.commentEmpty' };
  if (body.length > ISSUE_LIMITS.comment) return { ok: false, error: 'storageOps.issue.error.commentLong' };
  return { ok: true, body };
}

// ─── Offset paging (issues, storage locations) ───────────────────────────────

/** The page after `last`, or undefined when every row is loaded. */
export function nextOffsetPage(last: { page: number; pageSize: number; total: number; items: readonly unknown[] }): number | undefined {
  if (last.items.length === 0) return undefined;
  return last.page * last.pageSize < last.total ? last.page + 1 : undefined;
}

// ─── Warehouse activity (BR-104) ─────────────────────────────────────────────

/** The activity chips: exactly the API's types plus 'ALL'. */
export type ActivityFilter = ActivityTypeCode | 'ALL';
export const ACTIVITY_FILTERS: readonly ActivityFilter[] = [
  'ALL',
  'STOCK_MOVEMENT',
  'GOODS_RECEIPT',
  'TRANSFER',
  'ISSUE',
  'RETURN',
  'DOCUMENT',
];

export const ACTIVITY_TYPE_LABEL: Readonly<Record<ActivityTypeCode, TranslationKey>> = {
  STOCK_MOVEMENT: 'storageOps.activity.type.STOCK_MOVEMENT',
  GOODS_RECEIPT: 'storageOps.activity.type.GOODS_RECEIPT',
  TRANSFER: 'storageOps.activity.type.TRANSFER',
  ISSUE: 'storageOps.activity.type.ISSUE',
  RETURN: 'storageOps.activity.type.RETURN',
  DOCUMENT: 'storageOps.activity.type.DOCUMENT',
};

export function activityFilterLabel(filter: ActivityFilter): string {
  return filter === 'ALL' ? t('storageOps.filter.all') : t(ACTIVITY_TYPE_LABEL[filter]);
}

export function activityFilterTypes(filter: ActivityFilter): ActivityTypeCode[] | undefined {
  return filter === 'ALL' ? undefined : [filter];
}

/** 'Today' = today's IST date as both ends; 'All' = no range. */
export type ActivityPresetRange = { from: string; to: string } | undefined;

export function activityPresetRange(preset: 'Today' | 'All', now: Date): ActivityPresetRange {
  if (preset === 'All') return undefined;
  const today = istDate(now);
  return { from: today, to: today };
}

export const MOVEMENT_TYPE_LABEL: Readonly<Record<StockMovementTypeCode, TranslationKey>> = {
  RECEIPT: 'storageOps.movement.RECEIPT',
  SALE: 'storageOps.movement.SALE',
  TRANSFER_OUT: 'storageOps.movement.TRANSFER_OUT',
  TRANSFER_IN: 'storageOps.movement.TRANSFER_IN',
  ADJUSTMENT: 'storageOps.movement.ADJUSTMENT',
  WASTAGE: 'storageOps.movement.WASTAGE',
  RETURN_IN: 'storageOps.movement.RETURN_IN',
  RESERVATION: 'storageOps.movement.RESERVATION',
  RELEASE: 'storageOps.movement.RELEASE',
};

export function movementTypeLabel(type: string): string {
  return has(MOVEMENT_TYPE_LABEL, type) ? t(MOVEMENT_TYPE_LABEL[type]) : type;
}

/** One activity event as the list and the detail show it (built from the list row; no detail route). */
export interface ActivityRow {
  /** type + source id: unique across the merged feed. */
  key: string;
  type: ActivityTypeCode;
  typeLabel: string;
  sourceId: string;
  /** A stock movement's reference is its movement type, shown as a label; the rest pass through. */
  reference: string;
  statusLabel: string | undefined;
  statusTone: AdminTone;
  severityLabel: string | undefined;
  severityTone: AdminTone | undefined;
  /** Signed for a stock movement, gross for a goods receipt. */
  quantity: string | undefined;
  directionLabel: string | undefined;
  when: string;
  occurredAt: string;
  /** True when the source row recorded who did it (the API sends a uuid only, no name). */
  hasActor: boolean;
  /** Where "Open" goes: an issue opens its detail in the flow, a receipt the receiving module. */
  module: ActivityModule | undefined;
}

function activityStatus(event: WarehouseActivityEventDto): { label: string | undefined; tone: AdminTone } {
  if (event.status === null) return { label: undefined, tone: 'info' };
  if (event.type === 'ISSUE') return { label: issueStatusLabel(event.status), tone: issueStatusTone(event.status) };
  // Receipt / transfer / return / document statuses belong to other modules; shown as the server sends them.
  return { label: t('storageOps.status.unknown', { status: event.status }), tone: 'info' };
}

export function toActivityRow(event: WarehouseActivityEventDto, now: Date): ActivityRow {
  const status = activityStatus(event);
  const qty = grams(event.qtyKg);
  return {
    key: `${event.type}:${event.sourceId}`,
    type: event.type,
    typeLabel: has(ACTIVITY_TYPE_LABEL, event.type) ? t(ACTIVITY_TYPE_LABEL[event.type]) : event.type,
    sourceId: event.sourceId,
    reference: event.type === 'STOCK_MOVEMENT' ? movementTypeLabel(event.reference) : event.reference,
    statusLabel: status.label,
    statusTone: status.tone,
    severityLabel: event.severity === null ? undefined : issueSeverityLabel(event.severity),
    severityTone: event.severity === null ? undefined : issueSeverityTone(event.severity),
    quantity: qty === null ? undefined : formatKg(qty),
    directionLabel:
      event.direction === null
        ? undefined
        : t(event.direction === 'INBOUND' ? 'storageOps.activity.direction.INBOUND' : 'storageOps.activity.direction.OUTBOUND'),
    when: formatAdminDate(event.occurredAt, now),
    occurredAt: event.occurredAt,
    hasActor: event.actorId !== null,
    module: event.type === 'ISSUE' ? 'operational_issue' : event.type === 'GOODS_RECEIPT' ? 'receiving' : undefined,
  };
}

// ─── Storage locations (BR-79) and derived stock ─────────────────────────────

/** Stock derived from the batches recorded against one location code. */
export interface LocationStock {
  grams: number;
  batchCount: number;
}

/**
 * ACTIVE batch stock per storage-location code. `storageLocation` on a batch
 * is free text (the receiving flow records the location's code), so this is a
 * best-effort derivation, not a stored per-location balance.
 */
export function stockByLocationCode(batches: readonly BatchDto[]): Map<string, LocationStock> {
  const out = new Map<string, LocationStock>();
  for (const batch of batches) {
    if (batch.status !== 'ACTIVE') continue;
    const code = text(batch.storageLocation);
    const qty = grams(batch.qtyAvailableKg);
    if (code === undefined || qty === null) continue;
    const prev = out.get(code) ?? { grams: 0, batchCount: 0 };
    out.set(code, { grams: prev.grams + qty, batchCount: prev.batchCount + 1 });
  }
  return out;
}

/** A location's derived stock: undefined while the batches are unknown, zero when none is recorded against it. */
export function locationStockOf(stockByCode: ReadonlyMap<string, LocationStock> | undefined, code: string): LocationStock | undefined {
  if (stockByCode === undefined) return undefined;
  return stockByCode.get(code) ?? { grams: 0, batchCount: 0 };
}

export interface LocationBatchRow {
  id: string;
  batchCode: string;
  product: string;
  productName: string;
  quantity: string;
}

/** The ACTIVE batches recorded against `code`, largest first. */
export function locationBatches(batches: readonly BatchDto[], code: string): LocationBatchRow[] {
  return batches
    .filter((b) => b.status === 'ACTIVE' && text(b.storageLocation) === code)
    .map((b) => ({ batch: b, qty: grams(b.qtyAvailableKg) ?? 0 }))
    .sort((a, b) => b.qty - a.qty)
    .map(({ batch, qty }) => {
      const productName = text(batch.cropName) ?? t('storageOps.location.unknownProduct');
      return {
        id: batch.id,
        batchCode: batch.batchCode,
        productName,
        product: t('storageOps.location.product', { product: productName, grade: gradeLabel(batch.grade) }),
        quantity: formatKg(qty),
      };
    });
}

/** Whole-number percent of `used` over `capacity` (grams); null without a positive capacity. */
export function percentOf(usedGrams: number, capacityGrams: number | null): number | null {
  if (capacityGrams === null || capacityGrams <= 0) return null;
  return Math.round((usedGrams * 100) / capacityGrams);
}

export interface LocationRow {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  /** Free text from the server; undefined when not set. */
  locationType: string | undefined;
  typeLabel: string;
  isActive: boolean;
  statusLabel: string;
  statusTone: AdminTone;
  capacityGrams: number | null;
  capacity: string | undefined;
  /** Derived from batches; undefined until the batches are known. */
  stock: LocationStock | undefined;
  stockLabel: string | undefined;
  occupancyPercent: number | null;
  available: string | undefined;
  createdAt: string;
}

export function toLocationRow(dto: StorageLocationDto, stock: LocationStock | undefined, now: Date): LocationRow {
  const capacityGrams = grams(dto.capacityKg);
  const locationType = text(dto.locationType);
  const used = stock?.grams ?? 0;
  return {
    id: dto.id,
    warehouseId: dto.warehouseId,
    code: dto.code,
    name: dto.name,
    locationType,
    typeLabel: locationType ?? t('storageOps.location.typeNotSet'),
    isActive: dto.isActive,
    statusLabel: t(dto.isActive ? 'storageOps.location.active' : 'storageOps.location.inactive'),
    statusTone: dto.isActive ? 'success' : 'danger',
    capacityGrams,
    capacity: capacityGrams === null ? undefined : formatKg(capacityGrams),
    stock,
    stockLabel: stock === undefined ? undefined : formatKg(stock.grams),
    occupancyPercent: stock === undefined ? null : percentOf(used, capacityGrams),
    available: stock === undefined || capacityGrams === null ? undefined : formatKg(capacityGrams - used),
    createdAt: formatAdminDate(dto.createdAt, now),
  };
}

export interface LocationGroup {
  /** undefined = locations with no type set. */
  type: string | undefined;
  title: string;
  rows: LocationRow[];
}

/** Locations grouped by their free-text type (typed groups by name, untyped last), rows by code. */
export function groupLocationsByType(rows: readonly LocationRow[]): LocationGroup[] {
  const groups = new Map<string, LocationRow[]>();
  for (const row of rows) {
    const key = row.locationType ?? '';
    const list = groups.get(key);
    if (list === undefined) groups.set(key, [row]);
    else list.push(row);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)))
    .map(([key, list]) => ({
      type: key === '' ? undefined : key,
      title: key === '' ? t('storageOps.location.typeNotSet') : key,
      rows: [...list].sort((a, b) => a.code.localeCompare(b.code)),
    }));
}

export interface LocationDraft {
  code: string;
  name: string;
  locationType: string;
  capacityKg: string;
}

export type LocationDraftField = 'code' | 'name' | 'locationType' | 'capacityKg';
export const LOCATION_LIMITS = { code: 40, name: 120, locationType: 40 } as const;

/** A typed capacity as the API's kg string, or an error key; '' = no capacity (null). */
export function parseCapacityInput(input: string): { ok: true; value: string | null } | { ok: false; error: TranslationKey } {
  const trimmed = input.trim();
  if (trimmed === '') return { ok: true, value: null };
  const g = parseKgToGrams(trimmed);
  if (g === null || g <= 0) return { ok: false, error: 'storageOps.capacity.error.invalid' };
  return { ok: true, value: gramsToKgString(g) };
}

export type LocationDraftResult =
  | { ok: true; body: { code: string; name: string; locationType: string | null; capacityKg: string | null } }
  | { ok: false; errors: Partial<Record<LocationDraftField, TranslationKey>> };

/** Validates the create / edit location form (the code is only used on create). */
export function buildLocationBody(draft: LocationDraft): LocationDraftResult {
  const errors: Partial<Record<LocationDraftField, TranslationKey>> = {};
  const code = draft.code.trim();
  const name = draft.name.trim();
  const locationType = draft.locationType.trim();
  if (code === '' || code.length > LOCATION_LIMITS.code) errors.code = 'storageOps.location.error.code';
  if (name === '' || name.length > LOCATION_LIMITS.name) errors.name = 'storageOps.location.error.name';
  if (locationType.length > LOCATION_LIMITS.locationType) errors.locationType = 'storageOps.location.error.type';
  const capacity = parseCapacityInput(draft.capacityKg);
  if (!capacity.ok) errors.capacityKg = capacity.error;
  if (!capacity.ok || Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, body: { code, name, locationType: locationType === '' ? null : locationType, capacityKg: capacity.value } };
}

// ─── Capacity (BR-66b) ───────────────────────────────────────────────────────

export interface CapacityView {
  isSet: boolean;
  capacity: string | undefined;
  used: string;
  available: string | undefined;
  /** The server's percentage (2 decimals, may exceed 100); null without a capacity. */
  utilizationPercent: number | null;
  /** Rounded for display and the bar. */
  utilizationLabel: string | undefined;
  overCapacity: boolean;
}

export function toCapacityView(dto: WarehouseCapacityDto): CapacityView {
  const capacityGrams = grams(dto.capacityKg);
  const usedGrams = grams(dto.usedKg) ?? 0;
  const availableGrams = grams(dto.availableKg);
  const percent = dto.utilizationPercent;
  return {
    isSet: capacityGrams !== null,
    capacity: capacityGrams === null ? undefined : formatKg(capacityGrams),
    used: formatKg(usedGrams),
    available: availableGrams === null ? undefined : formatKg(availableGrams),
    utilizationPercent: percent,
    utilizationLabel: percent === null ? undefined : t('storageOps.percent', { value: Math.round(percent) }),
    overCapacity: availableGrams !== null && availableGrams < 0,
  };
}

// ─── Performance (BR-80) ─────────────────────────────────────────────────────

export type PerformancePeriodCode = 'TODAY' | 'LAST_7' | 'LAST_30';
export const PERFORMANCE_PERIODS: readonly PerformancePeriodCode[] = ['TODAY', 'LAST_7', 'LAST_30'];

export const PERFORMANCE_PERIOD_LABEL: Readonly<Record<PerformancePeriodCode, TranslationKey>> = {
  TODAY: 'storageOps.performance.period.TODAY',
  LAST_7: 'storageOps.performance.period.LAST_7',
  LAST_30: 'storageOps.performance.period.LAST_30',
};

/** Inclusive IST dates; today counts as one of the days. */
export function performanceRange(period: PerformancePeriodCode, now: Date): { from: string; to: string } {
  const back = period === 'TODAY' ? 0 : period === 'LAST_7' ? 6 : 29;
  return { from: istDate(now, back), to: istDate(now) };
}

export interface PerformanceView {
  ordersPlaced: number;
  ordersFulfilled: number;
  ordersCancelled: number;
  goodsReceipts: number;
  grossReceived: string;
  accepted: string;
  rejected: string;
  returnsRequested: number;
  movements: { type: string; label: string; entries: number; quantity: string }[];
}

export function toPerformanceView(dto: WarehousePerformanceDto): PerformanceView {
  const kg = (value: string) => formatKg(grams(value) ?? 0);
  return {
    ordersPlaced: dto.orders.placed,
    ordersFulfilled: dto.orders.fulfilled,
    ordersCancelled: dto.orders.cancelled,
    goodsReceipts: dto.receiving.goodsReceipts,
    grossReceived: kg(dto.receiving.grossQtyKg),
    accepted: kg(dto.receiving.acceptedQtyKg),
    rejected: kg(dto.receiving.rejectedQtyKg),
    returnsRequested: dto.returns.requested,
    movements: dto.stockMovements
      .filter((m) => m.entries > 0)
      .map((m) => ({ type: m.movementType, label: movementTypeLabel(m.movementType), entries: m.entries, quantity: kg(m.qtyKg) })),
  };
}

// ─── Operations hub ──────────────────────────────────────────────────────────

/** "12", or "100+" when a capped walk stopped before the end. */
export function countLabel(count: number, complete: boolean): string {
  return complete ? String(count) : t('storageOps.countAtLeast', { count });
}
