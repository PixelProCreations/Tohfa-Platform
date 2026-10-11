import { z } from 'zod';

/**
 * Tasks and alerts are DERIVED from existing records (BR-77); nothing here is a table of its own.
 * The type lists below are the whole vocabulary: a new source needs a new entry here, a new SQL
 * branch in the repo and a line in docs/openapi.yaml.
 */
export const TASK_TYPES = [
  'RETURN_INSPECTION',
  'RETURN_APPROVAL',
  'GOODS_RECEIPT_QC',
  'ORDER_PACK',
  'ORDER_DISPATCH',
  'ORDER_PICKUP_OTP',
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const ALERT_TYPES = ['BATCH_NEAR_EXPIRY', 'LOW_STOCK', 'CAPACITY_NEAR_FULL'] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const ITEM_KINDS = ['TASK', 'ALERT'] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

export const REF_TYPES = ['RETURN_REQUEST', 'GOODS_RECEIPT', 'ORDER', 'INVENTORY_BATCH', 'WAREHOUSE'] as const;
export type RefType = (typeof REF_TYPES)[number];

/** Lower-case canonical form only: the API itself emits `uuid::text`, so anything else is a typo. */
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const ITEM_KEY_MAX_LENGTH = 200;

/**
 * `<TYPE>:<uuid>`, except LOW_STOCK which names a group of batches: `LOW_STOCK:<warehouse uuid>:<crop uuid>:<grade>`.
 * Built from the type lists so the two cannot drift.
 */
function itemKeyPattern(types: readonly string[]): RegExp {
  const plain = types.filter((type) => type !== 'LOW_STOCK').join('|');
  const alternatives = [plain === '' ? null : `(?:${plain}):${UUID}`, types.includes('LOW_STOCK') ? `LOW_STOCK:${UUID}:${UUID}:[A-Z0-9_]{1,20}` : null];
  return new RegExp(`^(?:${alternatives.filter((a) => a !== null).join('|')})$`);
}

const TASK_ITEM_KEY = itemKeyPattern(TASK_TYPES);
const ALERT_ITEM_KEY = itemKeyPattern(ALERT_TYPES);
const ANY_ITEM_KEY = itemKeyPattern([...TASK_TYPES, ...ALERT_TYPES]);

export function isTaskItemKey(value: string): boolean {
  return value.length <= ITEM_KEY_MAX_LENGTH && TASK_ITEM_KEY.test(value);
}

export function isAlertItemKey(value: string): boolean {
  return value.length <= ITEM_KEY_MAX_LENGTH && ALERT_ITEM_KEY.test(value);
}

/** A key of either kind: what a pagination cursor may carry. */
export function isAnyItemKey(value: string): boolean {
  return value.length <= ITEM_KEY_MAX_LENGTH && ANY_ITEM_KEY.test(value);
}

/** The type is the part before the first colon; only call this on a key that passed `is*ItemKey`. */
export function itemKeyType(itemKey: string): string {
  return itemKey.slice(0, itemKey.indexOf(':'));
}

export const taskItemKeyParam = z
  .object({
    itemKey: z.string().refine(isTaskItemKey, { message: 'itemKey is not the key of a task.' }),
  })
  .strict();
export type TaskItemKeyParam = z.infer<typeof taskItemKeyParam>;

export const alertItemKeyParam = z
  .object({
    itemKey: z.string().refine(isAlertItemKey, { message: 'itemKey is not the key of an alert.' }),
  })
  .strict();
export type AlertItemKeyParam = z.infer<typeof alertItemKeyParam>;

const pageParams = {
  cursor: z.string().min(1).max(512).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  warehouseId: z.string().uuid().optional(),
};

export const TASK_STATES = ['open', 'done'] as const;
export const listTasksQuery = z
  .object({
    ...pageParams,
    type: z.enum(TASK_TYPES).optional(),
    state: z.enum(TASK_STATES).default('open'),
  })
  .strict();
export type ListTasksQuery = z.infer<typeof listTasksQuery>;

export const taskSummaryQuery = z.object({ warehouseId: z.string().uuid().optional() }).strict();
export type TaskSummaryQuery = z.infer<typeof taskSummaryQuery>;

export const ALERT_STATES = ['active', 'snoozed'] as const;
export const listAlertsQuery = z
  .object({
    ...pageParams,
    type: z.enum(ALERT_TYPES).optional(),
    state: z.enum(ALERT_STATES).default('active'),
  })
  .strict();
export type ListAlertsQuery = z.infer<typeof listAlertsQuery>;

/** An absolute time; the range check (future, within `alert_snooze_max_hours`) needs the clock and config, so it lives in the service. */
export const snoozeAlertBody = z.object({ until: z.string().datetime({ offset: true }) }).strict();
export type SnoozeAlertBody = z.infer<typeof snoozeAlertBody>;

/** Machine values only: quantities are decimal strings, dates ISO, ids uuid. The client formats and translates. */
const itemParams = z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]));
const page = z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }).strict();

export const taskResponse = z
  .object({
    itemKey: z.string(),
    type: z.enum(TASK_TYPES),
    titleKey: z.string(),
    refType: z.enum(REF_TYPES),
    refId: z.string().uuid(),
    warehouseId: z.string().uuid(),
    createdAt: z.string().datetime(),
    dueOn: z.string().nullable(),
    params: itemParams,
    state: z.enum(['OPEN', 'DONE']),
  })
  .strict();
export type TaskResponse = z.infer<typeof taskResponse>;

export const taskListResponse = z.object({ items: z.array(taskResponse), page }).strict();
export type TaskListResponse = z.infer<typeof taskListResponse>;

export const taskSummaryResponse = z
  .object({
    open: z.number().int(),
    byType: z.record(z.enum(TASK_TYPES), z.number().int()),
  })
  .strict();
export type TaskSummaryResponse = z.infer<typeof taskSummaryResponse>;

export const alertResponse = z
  .object({
    itemKey: z.string(),
    type: z.enum(ALERT_TYPES),
    messageKey: z.string(),
    refType: z.enum(REF_TYPES),
    refId: z.string().uuid(),
    warehouseId: z.string().uuid(),
    since: z.string().datetime().nullable(),
    params: itemParams,
    state: z.enum(['ACTIVE', 'SNOOZED']),
    snoozedUntil: z.string().datetime().nullable(),
  })
  .strict();
export type AlertResponse = z.infer<typeof alertResponse>;

export const alertListResponse = z.object({ items: z.array(alertResponse), page }).strict();
export type AlertListResponse = z.infer<typeof alertListResponse>;

/** What a mutation answers: the caller's own state row for that item. */
export const itemStateResponse = z
  .object({
    itemKey: z.string(),
    state: z.enum(['DONE', 'DISMISSED', 'SNOOZED']),
    snoozedUntil: z.string().datetime().nullable(),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type ItemStateResponse = z.infer<typeof itemStateResponse>;
