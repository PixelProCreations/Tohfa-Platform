/**
 * Tasks and alerts: SQL only (BR-77, BR-78).
 *
 * Nothing here is a stored task or alert. Each type is one SELECT over records that already exist
 * (returns, goods receipts, orders, inventory batches, warehouses); `deriveItems` UNIONs the
 * branches the caller asked for into one relation, and every read goes through that relation, so a
 * list, a summary, a by-key lookup and the clean-up of stale state cannot disagree about what
 * currently exists.
 *
 * Every branch must expose the same ten columns, in this order:
 *   item_key, type, ref_type, ref_id, warehouse_id, created_at, since, due_on, params
 * `created_at` is the record's own creation time (tasks), `since` when the condition began where a
 * timestamp for it exists (alerts), `due_on` a calendar date. A branch that has no honest value for
 * one of them says NULL rather than inventing one.
 *
 * The literal type, status and ref names interpolated into the branches below come from constants
 * in this file, never from a request; every value that does come from a request or from
 * system_config is a positional parameter.
 */
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseScopeFilter } from '../../rbac/warehouseScope.js';
import { TASK_TYPES, type AlertType, type ItemKind, type RefType, type TaskType } from './tasks-alerts.schema.js';

/** Business thresholds from system_config. `null` means missing or unusable: that alert type is then not raised. */
export interface AlertThresholds {
  /** `alert_batch_expiry_days`: a non-negative integer. */
  expiryDays: number | null;
  /** `alert_capacity_utilization_percent`: 0 to 100, kept as a decimal string for NUMERIC arithmetic. */
  capacityPercent: string | null;
  /** `low_stock_threshold_kg`: non-negative, kept as a decimal string for NUMERIC arithmetic. */
  lowStockKg: string | null;
}

export const NO_THRESHOLDS: AlertThresholds = { expiryDays: null, capacityPercent: null, lowStockKg: null };

export type ItemParams = Record<string, string | number | boolean | null>;
export type UserItemState = 'DONE' | 'DISMISSED' | 'SNOOZED';

export interface DerivedItem {
  itemKey: string;
  type: string;
  refType: RefType;
  refId: string;
  warehouseId: string;
  createdAt: Date | null;
  since: Date | null;
  dueOn: string | null;
  params: ItemParams;
  /** This caller's stored state for the item, if any. An ended snooze is still reported as SNOOZED here: see `snoozedNow`. */
  userState: UserItemState | null;
  snoozedUntil: Date | null;
  /** True only while a snooze has not yet ended. */
  snoozedNow: boolean;
}

/** The position after the last row of a page: the database's own microsecond rendering, not a JS Date. */
export interface ItemCursor {
  sortAt: string;
  itemKey: string;
}

export type TaskListState = 'open' | 'done';
export type AlertListState = 'active' | 'snoozed';

export interface ListArgs {
  kind: ItemKind;
  userId: string;
  scope: ResolvedScope;
  types: readonly string[];
  thresholds: AlertThresholds;
  warehouseId?: string | undefined;
  state: TaskListState | AlertListState;
  cursor?: ItemCursor | undefined;
  limit: number;
}

export interface StateRow {
  itemKey: string;
  state: UserItemState;
  snoozedUntil: Date | null;
  updatedAt: Date;
}

export interface TasksAlertsRepo {
  getAlertThresholds(db: Executor): Promise<AlertThresholds>;
  /** `alert_snooze_max_hours`; null when missing or not a positive integer. */
  getSnoozeMaxHours(db: Executor): Promise<number | null>;
  warehouseExists(db: Executor, warehouseId: string): Promise<boolean>;
  list(db: Executor, args: ListArgs): Promise<{ items: DerivedItem[]; next: ItemCursor | null }>;
  /** Open (no stored state) task counts per type, within scope. Types with no open task are absent. */
  countOpenTasks(
    db: Executor,
    args: { userId: string; scope: ResolvedScope; warehouseId?: string | undefined },
  ): Promise<Partial<Record<TaskType, number>>>;
  /** The item if it currently exists inside the scope, whatever state the caller stored for it. */
  findVisible(
    db: Executor,
    args: { kind: ItemKind; userId: string; scope: ResolvedScope; type: string; itemKey: string; thresholds: AlertThresholds },
  ): Promise<DerivedItem | null>;
  upsertState(
    db: Executor,
    args: { userId: string; kind: ItemKind; itemKey: string; state: UserItemState; snoozedUntil: Date | null },
  ): Promise<StateRow>;
  /** Deletes this user's state rows for items of `kind` that no longer exist in scope. Returns how many. */
  pruneCleared(
    db: Executor,
    args: { kind: ItemKind; userId: string; scope: ResolvedScope; types: readonly string[]; thresholds: AlertThresholds },
  ): Promise<number>;
}

/** Positional parameter collector, so a branch can add values without knowing its own index. */
class Params {
  readonly values: unknown[] = [];
  add(value: unknown): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }
}

const IST_TODAY = `(now() AT TIME ZONE 'Asia/Kolkata')::date`;

/** `timestamptz` branch columns that no source has a value for. */
const NO_TIME = 'NULL::timestamptz';

function returnBranch(type: TaskType, status: 'PENDING' | 'INSPECTED'): string {
  // return_requests carries no warehouse of its own; the order it was filed against does.
  return `SELECT '${type}:' || r.id::text, '${type}'::text, 'RETURN_REQUEST'::text, r.id, o.warehouse_id,
                 r.created_at, ${NO_TIME}, NULL::date,
                 jsonb_build_object('orderNumber', o.order_number)
            FROM return_requests r
            JOIN orders o ON o.id = r.order_id
           WHERE r.status = '${status}'::return_status`;
}

function orderBranch(type: TaskType, status: 'CONFIRMED' | 'PACKED' | 'READY_FOR_PICKUP'): string {
  return `SELECT '${type}:' || o.id::text, '${type}'::text, 'ORDER'::text, o.id, o.warehouse_id,
                 o.placed_at, ${NO_TIME}, o.delivery_date,
                 jsonb_build_object('orderNumber', o.order_number, 'fulfilmentType', o.fulfilment_type::text)
            FROM orders o
           WHERE o.status = '${status}'::order_status`;
}

type Branch = (params: Params, thresholds: AlertThresholds) => string | null;

const BRANCHES: Record<TaskType | AlertType, Branch> = {
  RETURN_INSPECTION: () => returnBranch('RETURN_INSPECTION', 'PENDING'),
  RETURN_APPROVAL: () => returnBranch('RETURN_APPROVAL', 'INSPECTED'),
  GOODS_RECEIPT_QC: () =>
    `SELECT 'GOODS_RECEIPT_QC:' || g.id::text, 'GOODS_RECEIPT_QC'::text, 'GOODS_RECEIPT'::text, g.id, g.warehouse_id,
            g.created_at, ${NO_TIME}, NULL::date,
            jsonb_build_object('grnNumber', g.grn_number, 'grossQtyKg', g.gross_qty_kg::text)
       FROM goods_receipts g
      WHERE g.status = 'AWAITING_QC'::grn_status`,
  ORDER_PACK: () => orderBranch('ORDER_PACK', 'CONFIRMED'),
  ORDER_DISPATCH: () => orderBranch('ORDER_DISPATCH', 'PACKED'),
  ORDER_PICKUP_OTP: () => orderBranch('ORDER_PICKUP_OTP', 'READY_FOR_PICKUP'),

  BATCH_NEAR_EXPIRY: (params, thresholds) => {
    if (thresholds.expiryDays === null) return null;
    const days = params.add(thresholds.expiryDays);
    // `since` is when the batch entered the horizon, but never before it existed. A batch already
    // past its expiry that is still ACTIVE with stock left keeps raising the alert.
    return `SELECT 'BATCH_NEAR_EXPIRY:' || b.id::text, 'BATCH_NEAR_EXPIRY'::text, 'INVENTORY_BATCH'::text, b.id, b.warehouse_id,
                   ${NO_TIME},
                   GREATEST(b.created_at, ((b.expiry_on - ${days}::int)::timestamp AT TIME ZONE 'Asia/Kolkata')),
                   NULL::date,
                   jsonb_build_object('batchCode', b.batch_code, 'expiryOn', b.expiry_on,
                                      'daysToExpiry', b.expiry_on - ${IST_TODAY},
                                      'qtyAvailableKg', b.qty_available::text)
              FROM inventory_batches b
             WHERE b.status = 'ACTIVE'
               AND b.qty_available > 0
               AND b.expiry_on IS NOT NULL
               AND b.expiry_on <= ${IST_TODAY} + ${days}::int`;
  },

  LOW_STOCK: (params, thresholds) => {
    if (thresholds.lowStockKg === null) return null;
    const limit = params.add(thresholds.lowStockKg);
    const shown = params.add(thresholds.lowStockKg);
    // Working default, not a client rule: the group is warehouse + crop + grade, and only ACTIVE
    // batches count. A group with no ACTIVE batch at all has nothing to be low about.
    return `SELECT 'LOW_STOCK:' || g.warehouse_id::text || ':' || g.crop_id::text || ':' || g.grade::text,
                   'LOW_STOCK'::text, 'WAREHOUSE'::text, g.warehouse_id, g.warehouse_id,
                   ${NO_TIME}, ${NO_TIME}, NULL::date,
                   jsonb_build_object('cropId', g.crop_id, 'grade', g.grade::text,
                                      'totalQtyKg', g.total::text, 'thresholdKg', ${shown}::text)
              FROM (SELECT b.warehouse_id, b.crop_id, b.grade, SUM(b.qty_available) AS total
                      FROM inventory_batches b
                     WHERE b.status = 'ACTIVE'
                     GROUP BY b.warehouse_id, b.crop_id, b.grade
                    HAVING SUM(b.qty_available) < ${limit}::numeric) g`;
  },

  CAPACITY_NEAR_FULL: (params, thresholds) => {
    if (thresholds.capacityPercent === null) return null;
    const limit = params.add(thresholds.capacityPercent);
    const shown = params.add(thresholds.capacityPercent);
    // `used` is the capacity endpoint's own derivation (ACTIVE batches, BR-66), compared exactly
    // in NUMERIC: 89.9999 percent is not 90 percent.
    return `SELECT 'CAPACITY_NEAR_FULL:' || w.id::text, 'CAPACITY_NEAR_FULL'::text, 'WAREHOUSE'::text, w.id, w.id,
                   ${NO_TIME}, ${NO_TIME}, NULL::date,
                   jsonb_build_object('capacityKg', w.capacity_kg::text, 'usedKg', used.kg::text,
                                      'utilizationPercent', round(used.kg * 100 / w.capacity_kg, 2)::text,
                                      'thresholdPercent', ${shown}::text)
              FROM warehouses w
             CROSS JOIN LATERAL (SELECT COALESCE(SUM(b.qty_available), 0)::numeric(14,3) AS kg
                                   FROM inventory_batches b
                                  WHERE b.warehouse_id = w.id AND b.status = 'ACTIVE') used
             WHERE w.deleted_at IS NULL
               AND w.capacity_kg IS NOT NULL
               AND used.kg * 100 >= w.capacity_kg * ${limit}::numeric`;
  },
};

/** The UNION of the requested branches as a relation named `d`, or null when none of them applies. */
function deriveItems(types: readonly string[], params: Params, thresholds: AlertThresholds): string | null {
  const branches: string[] = [];
  for (const type of types) {
    const branch = (BRANCHES as Record<string, Branch | undefined>)[type]?.(params, thresholds);
    if (branch !== null && branch !== undefined) branches.push(branch);
  }
  if (branches.length === 0) return null;
  // sort_at gives every row a total order: when it began, else when the record was created, else
  // the epoch for the alerts that are a point-in-time state with no onset.
  return `WITH d AS (
            SELECT u.*, COALESCE(u.since, u.created_at, 'epoch'::timestamptz) AS sort_at
              FROM (${branches.map((b) => `(${b})`).join('\n UNION ALL\n ')}) AS u(
                     item_key, type, ref_type, ref_id, warehouse_id, created_at, since, due_on, params)
          )`;
}

/** Scope as a condition on `d.warehouse_id`, appending its parameters. */
function scopeCondition(scope: ResolvedScope, params: Params): string {
  const filter = warehouseScopeFilter(scope, 'd.warehouse_id', params.values.length + 1);
  params.values.push(...filter.params);
  return filter.sql;
}

const STATE_JOIN = (userIndex: string, kindIndex: string): string =>
  `LEFT JOIN task_alert_states s ON s.user_id = ${userIndex}::uuid AND s.kind = ${kindIndex}::text AND s.item_key = d.item_key`;

function stateCondition(kind: ItemKind, state: TaskListState | AlertListState): string {
  if (kind === 'TASK') return state === 'done' ? `s.state = 'DONE'` : 's.state IS NULL';
  // A dismissed alert is in neither list. A snooze that has ended no longer hides the alert.
  return state === 'snoozed'
    ? `s.state = 'SNOOZED' AND s.snoozed_until > now()`
    : `(s.state IS NULL OR (s.state = 'SNOOZED' AND s.snoozed_until <= now()))`;
}

interface ItemRow {
  item_key: string;
  type: string;
  ref_type: RefType;
  ref_id: string;
  warehouse_id: string;
  created_at: Date | null;
  since: Date | null;
  due_on: string | null;
  params: ItemParams;
  sort_at_cursor: string;
  user_state: UserItemState | null;
  snoozed_until: Date | null;
  snoozed_now: boolean | null;
}

const ITEM_COLUMNS = `d.item_key, d.type, d.ref_type, d.ref_id, d.warehouse_id, d.created_at, d.since,
       to_char(d.due_on, 'YYYY-MM-DD') AS due_on, d.params,
       to_char(d.sort_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS sort_at_cursor,
       s.state AS user_state, s.snoozed_until,
       (s.state = 'SNOOZED' AND s.snoozed_until > now()) AS snoozed_now`;

function toItem(row: ItemRow): DerivedItem {
  return {
    itemKey: row.item_key,
    type: row.type,
    refType: row.ref_type,
    refId: row.ref_id,
    warehouseId: row.warehouse_id,
    createdAt: row.created_at,
    since: row.since,
    dueOn: row.due_on,
    params: row.params,
    userState: row.user_state,
    snoozedUntil: row.snoozed_until,
    snoozedNow: row.snoozed_now === true,
  };
}

async function readConfig(db: Executor, key: string): Promise<unknown> {
  const result = await db.query<{ value: unknown }>(`SELECT value FROM system_config WHERE key = $1`, [key]);
  return result.rows[0]?.value ?? null;
}

const isNonNegativeInteger = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0;

export const tasksAlertsRepo: TasksAlertsRepo = {
  async getAlertThresholds(db) {
    const [expiry, capacity, lowStock] = await Promise.all([
      readConfig(db, 'alert_batch_expiry_days'),
      readConfig(db, 'alert_capacity_utilization_percent'),
      readConfig(db, 'low_stock_threshold_kg'),
    ]);
    return {
      expiryDays: isNonNegativeInteger(expiry) ? expiry : null,
      capacityPercent: typeof capacity === 'number' && Number.isFinite(capacity) && capacity >= 0 && capacity <= 100 ? String(capacity) : null,
      lowStockKg: typeof lowStock === 'number' && Number.isFinite(lowStock) && lowStock >= 0 ? String(lowStock) : null,
    };
  },

  async getSnoozeMaxHours(db) {
    const value = await readConfig(db, 'alert_snooze_max_hours');
    return isNonNegativeInteger(value) && value > 0 ? value : null;
  },

  async warehouseExists(db, warehouseId) {
    const result = await db.query(`SELECT 1 FROM warehouses WHERE id = $1 AND deleted_at IS NULL`, [warehouseId]);
    return (result.rowCount ?? 0) > 0;
  },

  async list(db, args) {
    const params = new Params();
    const derived = deriveItems(args.types, params, args.thresholds);
    if (derived === null) return { items: [], next: null };
    const user = params.add(args.userId);
    const kind = params.add(args.kind);
    const conditions = [scopeCondition(args.scope, params), stateCondition(args.kind, args.state)];
    if (args.warehouseId !== undefined) conditions.push(`d.warehouse_id = ${params.add(args.warehouseId)}::uuid`);
    if (args.cursor !== undefined) {
      const sortAt = params.add(args.cursor.sortAt);
      const itemKey = params.add(args.cursor.itemKey);
      conditions.push(`(d.sort_at, (d.item_key COLLATE "C")) < (${sortAt}::timestamptz, ${itemKey}::text)`);
    }
    const limit = params.add(args.limit + 1);

    const result = await db.query<ItemRow>(
      `${derived}
       SELECT ${ITEM_COLUMNS}
         FROM d
         ${STATE_JOIN(user, kind)}
        WHERE ${conditions.join('\n          AND ')}
        ORDER BY d.sort_at DESC, (d.item_key COLLATE "C") DESC
        LIMIT ${limit}::int`,
      params.values,
    );

    const hasMore = result.rows.length > args.limit;
    const page = hasMore ? result.rows.slice(0, args.limit) : result.rows;
    const last = page[page.length - 1];
    return {
      items: page.map(toItem),
      next: hasMore && last !== undefined ? { sortAt: last.sort_at_cursor, itemKey: last.item_key } : null,
    };
  },

  async countOpenTasks(db, args) {
    const params = new Params();
    const derived = deriveItems(TASK_TYPES, params, NO_THRESHOLDS);
    if (derived === null) return {};
    const user = params.add(args.userId);
    const kind = params.add('TASK');
    const conditions = [scopeCondition(args.scope, params), stateCondition('TASK', 'open')];
    if (args.warehouseId !== undefined) conditions.push(`d.warehouse_id = ${params.add(args.warehouseId)}::uuid`);

    const result = await db.query<{ type: TaskType; n: number }>(
      `${derived}
       SELECT d.type, count(*)::int AS n
         FROM d
         ${STATE_JOIN(user, kind)}
        WHERE ${conditions.join('\n          AND ')}
        GROUP BY d.type`,
      params.values,
    );
    return Object.fromEntries(result.rows.map((row) => [row.type, row.n]));
  },

  async findVisible(db, args) {
    const params = new Params();
    const derived = deriveItems([args.type], params, args.thresholds);
    if (derived === null) return null;
    const user = params.add(args.userId);
    const kind = params.add(args.kind);
    const scope = scopeCondition(args.scope, params);
    const key = params.add(args.itemKey);

    const result = await db.query<ItemRow>(
      `${derived}
       SELECT ${ITEM_COLUMNS}
         FROM d
         ${STATE_JOIN(user, kind)}
        WHERE d.item_key = ${key}::text
          AND ${scope}`,
      params.values,
    );
    const row = result.rows[0];
    return row === undefined ? null : toItem(row);
  },

  async upsertState(db, args) {
    const result = await db.query<{ item_key: string; state: UserItemState; snoozed_until: Date | null; updated_at: Date }>(
      `INSERT INTO task_alert_states (user_id, kind, item_key, state, snoozed_until, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (user_id, kind, item_key)
       DO UPDATE SET state = EXCLUDED.state, snoozed_until = EXCLUDED.snoozed_until, updated_at = now()
       RETURNING item_key, state, snoozed_until, updated_at`,
      [args.userId, args.kind, args.itemKey, args.state, args.snoozedUntil],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('task_alert_states upsert returned no row');
    return { itemKey: row.item_key, state: row.state, snoozedUntil: row.snoozed_until, updatedAt: row.updated_at };
  },

  async pruneCleared(db, args) {
    const params = new Params();
    const derived = deriveItems(args.types, params, args.thresholds);
    const user = params.add(args.userId);
    const kind = params.add(args.kind);
    // With no branch that can apply (every threshold unusable), nothing exists, so every row is stale.
    const stillExists =
      derived === null
        ? 'FALSE'
        : `EXISTS (${derived}
                   SELECT 1 FROM d WHERE d.item_key = s.item_key AND ${scopeCondition(args.scope, params)})`;
    const result = await db.query(
      `DELETE FROM task_alert_states s
        WHERE s.user_id = ${user}::uuid
          AND s.kind = ${kind}::text
          AND NOT ${stillExists}`,
      params.values,
    );
    return result.rowCount ?? 0;
  },
};
