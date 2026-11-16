/**
 * Tohfa Admin Work Queue: live tasks (GET /admin/tasks, BR-77) as the design's
 * task cards (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen, M1-S03), and
 * the design's "Filter and sort tasks" sheet (M1-S03a) mapped onto what the
 * API actually carries. Pure (no React), so tests/work_queue_logic.test.ts
 * covers it in plain Node.
 *
 * What the design shows but the API does not carry is not invented:
 *   - the design's categories Purchase exception, Farmer application, Audit
 *     follow-up and Quality discrepancy have no task source on the server yet
 *     (UNSOURCED_CATEGORIES). They stay in the type filter so the design's
 *     picker is intact, and choosing one shows the empty state without a
 *     request, rather than a list of something else;
 *   - a task has no assignee, priority, "blocked", "exception" or "in review"
 *     state (openapi /admin/tasks: OPEN or DONE only). The design's Assigned-to
 *     field is drawn disabled with a "not available yet" hint, and Exception /
 *     Blocked / In review stay selectable but match nothing (the empty state;
 *     the request does not change). "Overdue" is derived from dueOn, which the
 *     server sends only where a delivery date exists;
 *   - the design has no Done status and no Mark as Done control, so neither is
 *     offered; the list is always the caller's open tasks;
 *   - a task has no task number of its own (the design's "TSK-..."), so the
 *     code line is the record's reference from params.
 */
import type { TaskItemDto, TaskType } from '../../api/tasks';
import { t, type TranslationKey } from '../../i18n';
import { formatAdminDay, istDay, istWeekday } from '../../utils/datetime';
import { kgLabel } from '../warehouse/dashboard-home-more/mappers_dashboardHome';
import { mapTaskDestination } from '../warehouse/dashboard-home-more/mappers_tasks';

/** Every type GET /admin/tasks produces (docs/openapi.yaml TaskType). */
export const API_TASK_TYPES: readonly TaskType[] = [
  'GOODS_RECEIPT_QC',
  'ORDER_PACK',
  'ORDER_DISPATCH',
  'ORDER_PICKUP_OTP',
  'RETURN_INSPECTION',
  'RETURN_APPROVAL',
];

/** The design's task categories with no backend task source yet. */
export const UNSOURCED_CATEGORIES = ['PURCHASE_EXCEPTION', 'FARMER_APPLICATION', 'AUDIT_FOLLOW_UP', 'QUALITY_DISCREPANCY'] as const;
export type UnsourcedCategory = (typeof UNSOURCED_CATEGORIES)[number];

export type WorkQueueTypeFilter = 'all' | UnsourcedCategory | TaskType;
export const TYPE_FILTERS: readonly WorkQueueTypeFilter[] = ['all', ...UNSOURCED_CATEGORIES, ...API_TASK_TYPES];

export const TYPE_LABEL: Record<WorkQueueTypeFilter, TranslationKey> = {
  all: 'workQueue.type.all',
  PURCHASE_EXCEPTION: 'workQueue.type.PURCHASE_EXCEPTION',
  FARMER_APPLICATION: 'workQueue.type.FARMER_APPLICATION',
  AUDIT_FOLLOW_UP: 'workQueue.type.AUDIT_FOLLOW_UP',
  QUALITY_DISCREPANCY: 'workQueue.type.QUALITY_DISCREPANCY',
  GOODS_RECEIPT_QC: 'workQueue.type.GOODS_RECEIPT_QC',
  ORDER_PACK: 'workQueue.type.ORDER_PACK',
  ORDER_DISPATCH: 'workQueue.type.ORDER_DISPATCH',
  ORDER_PICKUP_OTP: 'workQueue.type.ORDER_PICKUP_OTP',
  RETURN_INSPECTION: 'workQueue.type.RETURN_INSPECTION',
  RETURN_APPROVAL: 'workQueue.type.RETURN_APPROVAL',
};

/**
 * The `type` to send GET /admin/tasks: undefined for All (every type), the
 * type itself for an API type, null for a design category with no source
 * (send nothing; the list is empty).
 */
export function apiTaskTypeFor(filter: WorkQueueTypeFilter): TaskType | undefined | null {
  if (filter === 'all') return undefined;
  return (API_TASK_TYPES as readonly string[]).includes(filter) ? (filter as TaskType) : null;
}

/** The design's status options, in its order. */
export type WorkQueueStatusFilter = 'all' | 'pending' | 'exception' | 'overdue' | 'blocked' | 'inReview';
export const STATUS_FILTERS: readonly WorkQueueStatusFilter[] = ['all', 'pending', 'exception', 'overdue', 'blocked', 'inReview'];
export const STATUS_LABEL: Record<WorkQueueStatusFilter, TranslationKey> = {
  all: 'workQueue.status.all',
  pending: 'workQueue.status.pending',
  exception: 'workQueue.status.exception',
  overdue: 'workQueue.status.overdue',
  blocked: 'workQueue.status.blocked',
  inReview: 'workQueue.status.inReview',
};

/** Statuses no task can have yet: choosing one lists nothing and changes no request. */
const UNSOURCED_STATUSES: readonly WorkQueueStatusFilter[] = ['exception', 'blocked', 'inReview'];

export type WorkQueueDueFilter = 'any' | 'today' | 'thisWeek' | 'overdue' | 'next7';
export const DUE_FILTERS: readonly WorkQueueDueFilter[] = ['any', 'today', 'thisWeek', 'overdue', 'next7'];
export const DUE_LABEL: Record<WorkQueueDueFilter, TranslationKey> = {
  any: 'workQueue.due.any',
  today: 'workQueue.due.today',
  thisWeek: 'workQueue.due.thisWeek',
  overdue: 'workQueue.due.overdue',
  next7: 'workQueue.due.next7',
};

export type WorkQueueSort = 'dueNewest' | 'dueOldest' | 'newest' | 'oldest';
export const SORTS: readonly WorkQueueSort[] = ['dueNewest', 'dueOldest', 'newest', 'oldest'];
export const SORT_LABEL: Record<WorkQueueSort, TranslationKey> = {
  dueNewest: 'workQueue.sort.dueNewest',
  dueOldest: 'workQueue.sort.dueOldest',
  newest: 'workQueue.sort.newest',
  oldest: 'workQueue.sort.oldest',
};

export interface WorkQueueFilters {
  type: WorkQueueTypeFilter;
  status: WorkQueueStatusFilter;
  due: WorkQueueDueFilter;
  /** A warehouse uuid from GET /warehouses; undefined = the caller's whole scope. */
  warehouseId: string | undefined;
  sort: WorkQueueSort;
}

export const DEFAULT_WORK_QUEUE_FILTERS: WorkQueueFilters = {
  type: 'all',
  status: 'all',
  due: 'any',
  warehouseId: undefined,
  sort: 'dueNewest',
};

export type WorkQueueCardStatus = 'pending' | 'overdue' | 'done';
export type WorkQueueDestination = 'orders' | 'receiving' | 'returns';

/** One task as the design's card shows it. */
export interface WorkQueueCard {
  itemKey: string;
  type: TaskType;
  title: string;
  status: WorkQueueCardStatus;
  /** Customer / farmer / supplier name from params; null when the task carries none. */
  person: string | null;
  /** The record's reference (order / GRN / RMA number); null when none. */
  code: string | null;
  /** Produce and quantity from params; null when none. */
  detail: string | null;
  /** "Created 9 Nov 2026" or "Created 9 Nov 2026 · Due 13 Nov 2026". */
  createdLine: string;
  /** YYYY-MM-DD or null (never invented). */
  dueOn: string | null;
  createdAt: string;
  destination: WorkQueueDestination;
}

function stringParam(params: TaskItemDto['params'], keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = params[key];
    if (typeof value === 'string' && value !== '') return value;
    if (typeof value === 'number') return String(value);
  }
  return null;
}

function dueDay(dueOn: string | null): string | null {
  return dueOn === null ? null : dueOn.slice(0, 10);
}

/** YYYY-MM-DD `days` after the YYYY-MM-DD `day` (calendar arithmetic in UTC, no time zone involved). */
function addDays(day: string, days: number): string {
  const ms = Date.parse(`${day}T00:00:00.000Z`) + days * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

export function toWorkQueueCard(dto: TaskItemDto, now: Date): WorkQueueCard {
  const known = (API_TASK_TYPES as readonly string[]).includes(dto.type);
  const title = known ? t(TYPE_LABEL[dto.type]) : t('workQueue.type.unknown');
  const produce = stringParam(dto.params, ['produce', 'cropName', 'productName']);
  const qtyRaw = stringParam(dto.params, ['grossQtyKg', 'qtyKg']);
  const qty = qtyRaw === null ? null : kgLabel(qtyRaw) ?? qtyRaw;
  let detail: string | null = null;
  if (produce !== null && qty !== null) detail = t('workQueue.card.produceQty', { produce, qty });
  else detail = produce ?? qty;

  const due = dueDay(dto.dueOn);
  const today = istDay(now);
  let status: WorkQueueCardStatus = 'pending';
  if (dto.state === 'DONE') status = 'done';
  else if (due !== null && due < today) status = 'overdue';

  const created = formatAdminDay(dto.createdAt);
  const dueLabel = due === null ? '' : formatAdminDay(`${due}T00:00:00+05:30`);
  return {
    itemKey: dto.itemKey,
    type: dto.type,
    title,
    status,
    person: stringParam(dto.params, ['customerName', 'customer', 'farmerName', 'supplierName']),
    code: stringParam(dto.params, ['orderNumber', 'grnNumber', 'rmaNumber', 'refCode']),
    detail,
    createdLine:
      due === null
        ? t('workQueue.card.created', { day: created })
        : t('workQueue.card.createdDue', { created, due: dueLabel === '' ? due : dueLabel }),
    dueOn: due,
    createdAt: dto.createdAt,
    destination: mapTaskDestination(dto).module,
  };
}

function matchesDue(card: WorkQueueCard, due: WorkQueueDueFilter, now: Date): boolean {
  if (due === 'any') return true;
  if (card.dueOn === null) return false;
  const today = istDay(now);
  switch (due) {
    case 'today':
      return card.dueOn === today;
    case 'overdue':
      return card.dueOn < today;
    case 'next7':
      return card.dueOn >= today && card.dueOn <= addDays(today, 6);
    case 'thisWeek': {
      // Monday to Sunday of the IST week holding `now`.
      const monday = addDays(today, -((istWeekday(now) + 6) % 7));
      return card.dueOn >= monday && card.dueOn <= addDays(monday, 6);
    }
    default:
      return true;
  }
}

function matchesStatus(card: WorkQueueCard, status: WorkQueueStatusFilter): boolean {
  if (UNSOURCED_STATUSES.includes(status)) return false;
  if (status === 'pending') return card.status === 'pending';
  if (status === 'overdue') return card.status === 'overdue';
  return true;
}

function matchesQuery(card: WorkQueueCard, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  return [card.title, card.person ?? '', card.code ?? '', card.detail ?? '', card.itemKey].some((v) => v.toLowerCase().includes(q));
}

/** Ties keep the server's order (Array.prototype.sort is stable). */
function compareCreated(a: WorkQueueCard, b: WorkQueueCard): number {
  return Date.parse(a.createdAt) - Date.parse(b.createdAt);
}

/** Earliest due day first; a task with no due day after every dated one. */
function compareDue(a: WorkQueueCard, b: WorkQueueCard): number {
  if (a.dueOn === b.dueOn) return 0;
  if (a.dueOn === null) return 1;
  if (b.dueOn === null) return -1;
  return a.dueOn < b.dueOn ? -1 : 1;
}

/** Status (within the loaded list), due window, search and sort over the loaded cards. */
export function applyWorkQueueFilters(
  cards: readonly WorkQueueCard[],
  filters: WorkQueueFilters,
  query: string,
  now: Date,
): WorkQueueCard[] {
  const out = cards.filter((c) => matchesStatus(c, filters.status) && matchesDue(c, filters.due, now) && matchesQuery(c, query));
  switch (filters.sort) {
    case 'newest':
      return out.sort((a, b) => compareCreated(b, a));
    case 'oldest':
      return out.sort(compareCreated);
    case 'dueOldest':
      return out.sort((a, b) => compareDue(a, b) || compareCreated(a, b));
    default:
      return out.sort((a, b) => compareDue(a, b) || compareCreated(b, a));
  }
}
