import { ErrorCode } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { effectiveAvailableSql } from '../../db/shelfAvailability.js';
import { AppError } from '../../http/problem.js';
import { CURSOR_TAGS, encodeKeysetCursor, requireKeysetCursor } from '../../http/keysetCursor.js';
import { MICRO_TS_SQL } from '../../http/microTimestamp.js';
import { scopedWhere, type ResolvedScope, type ScopedWhere } from '../../rbac/requirePermission.js';
import type {
  AllocationChannel,
  AllocationConfigView,
  AllocationView,
  ChannelAllocationRow,
  EffectivePercentage,
  ListAllocationsQuery,
  UpdateAllocationConfigBody,
} from './allocations.schema.js';

export interface PageMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ListAllocationsResult {
  items: AllocationView[];
  page: PageMeta;
}

export interface InsertAllocationItem {
  batchId: string;
  warehouseId: string;
  channel: AllocationChannel;
  allocatedQtyKg: string;
  computedBy?: 'AUTO' | 'MANUAL';
}

/**
 * BR-100: the dashboard's available figure is the row's stored available_qty capped by the batch's
 * unclaimed shelf. A DIRECT counter sale draws the batch without decrementing any allocation
 * (BR-95), so the stored figure alone would tell staff there is stock that is not on the shelf.
 * allocated / consumed / reserved are returned as stored.
 */
const EFFECTIVE_AVAILABLE = effectiveAvailableSql('a', 'b');

function toAllocationView(row: ChannelAllocationRow): AllocationView {
  const formatDate = (val: Date | string): string => {
    if (val instanceof Date) return val.toISOString().split('T')[0]!;
    return String(val).split('T')[0]!;
  };

  return {
    id: row.id,
    batchId: row.batch_id,
    warehouseId: row.warehouse_id,
    cropId: row.crop_id,
    cropName: row.crop_name ?? undefined,
    grade: row.grade,
    allocationDate: formatDate(row.created_at),
    channel: row.channel,
    allocatedQtyKg: row.allocated_qty,
    consumedQtyKg: row.consumed_qty,
    reservedQtyKg: row.reserved_qty,
    availableQtyKg: row.available_qty,
    computedBy: row.computed_by,
    overriddenBy: row.overridden_by,
  };
}

function renumber(scope: ScopedWhere, startIndex: number): ScopedWhere {
  let sql = scope.sql;
  scope.params.forEach((_, idx) => {
    const oldPlaceholder = `$${idx + 1}`;
    const newPlaceholder = `__PARAM_${idx}__`;
    sql = sql.split(oldPlaceholder).join(newPlaceholder);
  });
  scope.params.forEach((_, idx) => {
    const newPlaceholder = `__PARAM_${idx}__`;
    const targetPlaceholder = `$${startIndex + idx}`;
    sql = sql.split(newPlaceholder).join(targetPlaceholder);
  });
  return {
    sql,
    params: scope.params,
    nextIndex: startIndex + scope.params.length,
  };
}

export interface AllocationConfigFilter {
  warehouseId?: string | null | undefined;
  cropId?: string | null | undefined;
  grade?: string | null | undefined;
}

export interface AllocationsRepo {
  getEffectivePercentages(
    db: Executor,
    effectiveDate: string,
    cropId?: string | null,
    warehouseId?: string | null,
    grade?: string | null,
  ): Promise<EffectivePercentage[]>;
  insertBatchAllocations(
    db: Executor,
    items: InsertAllocationItem[],
  ): Promise<ChannelAllocationRow[]>;
  saveAllocationConfig(
    db: Executor,
    input: UpdateAllocationConfigBody,
    setBy: string,
  ): Promise<AllocationConfigView>;
  getAllocationConfig(
    db: Executor,
    filter?: AllocationConfigFilter | string | null,
  ): Promise<AllocationConfigView>;
  listAllocations(
    db: Executor,
    scope: ResolvedScope,
    filters: ListAllocationsQuery,
  ): Promise<ListAllocationsResult>;
  getAvailableQuantityForChannel(
    db: Executor,
    warehouseId: string,
    cropId: string,
    channel: AllocationChannel,
  ): Promise<string>;
}

export const allocationsRepo: AllocationsRepo = {
  async getEffectivePercentages(
    db: Executor,
    effectiveDate: string,
    cropId?: string | null,
    warehouseId?: string | null,
    grade?: string | null,
  ): Promise<EffectivePercentage[]> {
    const configsToTry = [
      { warehouseId: warehouseId ?? null, cropId: cropId ?? null, grade: grade ?? null },
      { warehouseId: warehouseId ?? null, cropId: cropId ?? null, grade: null },
      { warehouseId: null, cropId: cropId ?? null, grade: grade ?? null },
      { warehouseId: null, cropId: cropId ?? null, grade: null },
      { warehouseId: warehouseId ?? null, cropId: null, grade: null },
      { warehouseId: null, cropId: null, grade: null },
    ];

    for (const c of configsToTry) {
      if (c.warehouseId !== null && !warehouseId) continue;
      if (c.cropId !== null && !cropId) continue;
      if (c.grade !== null && !grade) continue;

      const res = await db.query<{ channel: AllocationChannel; percentage: string }>(
        `WITH latest_window AS (
           SELECT effective_from
             FROM allocation_config
            WHERE warehouse_id IS NOT DISTINCT FROM $1
              AND crop_id IS NOT DISTINCT FROM $2
              AND grade IS NOT DISTINCT FROM $3
              AND effective_from <= $4::date
            ORDER BY effective_from DESC
            LIMIT 1
         )
         SELECT channel, percentage
           FROM allocation_config
          WHERE warehouse_id IS NOT DISTINCT FROM $1
            AND crop_id IS NOT DISTINCT FROM $2
            AND grade IS NOT DISTINCT FROM $3
            AND effective_from = (SELECT effective_from FROM latest_window)`,
        [c.warehouseId, c.cropId, c.grade, effectiveDate],
      );

      if (res.rows.length === 4) {
        return res.rows.map((r) => ({
          channel: r.channel,
          percentage: Number(r.percentage),
        }));
      }
    }

    // Fallback if no window found in DB (safety seed values: 70/10/10/10)
    return [
      { channel: 'ONLINE', percentage: 70 },
      { channel: 'LIVE_MARKET', percentage: 10 },
      { channel: 'RESERVE', percentage: 10 },
      { channel: 'BUFFER', percentage: 10 },
    ];
  },

  async insertBatchAllocations(
    db: Executor,
    items: InsertAllocationItem[],
  ): Promise<ChannelAllocationRow[]> {
    const inserted: ChannelAllocationRow[] = [];

    for (const item of items) {
      const res = await db.query<ChannelAllocationRow>(
        `INSERT INTO allocations (
           batch_id,
           warehouse_id,
           channel,
           allocated_qty,
           computed_by
         ) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (batch_id, channel) DO NOTHING
         RETURNING *`,
        [
          item.batchId,
          item.warehouseId,
          item.channel,
          item.allocatedQtyKg,
          item.computedBy ?? 'AUTO',
        ],
      );
      if (res.rows.length > 0) {
        inserted.push(res.rows[0]!);
      }
    }

    return inserted;
  },

  async saveAllocationConfig(
    db: Executor,
    input: UpdateAllocationConfigBody,
    setBy: string,
  ): Promise<AllocationConfigView> {
    try {
      const warehouseId = input.warehouseId ?? null;
      const cropId = input.cropId ?? null;
      const grade = input.grade ?? null;

      for (const item of input.channels) {
        await db.query(
          `INSERT INTO allocation_config (
             channel,
             percentage,
             effective_from,
             warehouse_id,
             crop_id,
             grade,
             set_by
           ) VALUES ($1, $2, $3::date, $4, $5, $6, $7)
           ON CONFLICT (channel, effective_from, warehouse_id, crop_id, grade)
           DO UPDATE SET
             percentage = EXCLUDED.percentage,
             set_by = EXCLUDED.set_by,
             updated_at = now()`,
          [item.channel, item.percentage, input.effectiveFrom, warehouseId, cropId, grade, setBy],
        );
      }

      return {
        effectiveFrom: input.effectiveFrom,
        warehouseId,
        cropId,
        grade,
        channels: input.channels,
        setBy,
        setAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      const errObj = err as { code?: string; hint?: string; message?: string };
      if (
        errObj.code === '23514' ||
        errObj.hint?.includes('ALLOCATION_SUM_INVALID') ||
        errObj.message?.includes('ALLOCATION_SUM_INVALID')
      ) {
        throw new AppError(ErrorCode.ALLOCATION_SUM_INVALID, {
          status: 422,
          detail: 'Allocation percentages must sum to exactly 100',
          cause: err,
        });
      }
      throw err;
    }
  },

  async getAllocationConfig(
    db: Executor,
    filter?: AllocationConfigFilter | string | null,
  ): Promise<AllocationConfigView> {
    const f: AllocationConfigFilter =
      typeof filter === 'string'
        ? { cropId: filter }
        : (filter ?? {});

    const configsToTry = [
      { warehouseId: f.warehouseId ?? null, cropId: f.cropId ?? null, grade: f.grade ?? null },
      { warehouseId: f.warehouseId ?? null, cropId: f.cropId ?? null, grade: null },
      { warehouseId: null, cropId: f.cropId ?? null, grade: f.grade ?? null },
      { warehouseId: null, cropId: f.cropId ?? null, grade: null },
      { warehouseId: f.warehouseId ?? null, cropId: null, grade: null },
      { warehouseId: null, cropId: null, grade: null },
    ];

    for (const c of configsToTry) {
      const res = await db.query<{
        channel: AllocationChannel;
        percentage: string;
        effective_from: Date | string;
        warehouse_id: string | null;
        crop_id: string | null;
        grade: string | null;
        set_by: string | null;
        created_at: Date | string | null;
      }>(
        `WITH latest_window AS (
           SELECT effective_from
             FROM allocation_config
            WHERE warehouse_id IS NOT DISTINCT FROM $1
              AND crop_id IS NOT DISTINCT FROM $2
              AND grade IS NOT DISTINCT FROM $3
              AND effective_from <= CURRENT_DATE
            ORDER BY effective_from DESC
            LIMIT 1
         )
         SELECT channel, percentage, effective_from, warehouse_id, crop_id, grade, set_by, created_at
           FROM allocation_config
          WHERE warehouse_id IS NOT DISTINCT FROM $1
            AND crop_id IS NOT DISTINCT FROM $2
            AND grade IS NOT DISTINCT FROM $3
            AND effective_from = (SELECT effective_from FROM latest_window)
          ORDER BY CASE channel
            WHEN 'ONLINE' THEN 1
            WHEN 'LIVE_MARKET' THEN 2
            WHEN 'RESERVE' THEN 3
            WHEN 'BUFFER' THEN 4
            ELSE 5
          END`,
        [c.warehouseId, c.cropId, c.grade],
      );

      if (res.rows.length === 4) {
        const first = res.rows[0]!;
        const effectiveFrom = typeof first.effective_from === 'string'
          ? (first.effective_from as string).slice(0, 10)
          : new Date(first.effective_from).toISOString().slice(0, 10);
        return {
          effectiveFrom,
          warehouseId: first.warehouse_id ?? null,
          cropId: first.crop_id ?? null,
          grade: first.grade ?? null,
          channels: res.rows.map((r) => ({
            channel: r.channel,
            percentage: Number(r.percentage),
          })),
          setBy: first.set_by,
          setAt: first.created_at ? new Date(first.created_at).toISOString() : undefined,
        };
      }
    }

    return {
      effectiveFrom: new Date().toISOString().slice(0, 10),
      warehouseId: f.warehouseId ?? null,
      cropId: f.cropId ?? null,
      grade: f.grade ?? null,
      channels: [
        { channel: 'ONLINE', percentage: 70 },
        { channel: 'LIVE_MARKET', percentage: 10 },
        { channel: 'RESERVE', percentage: 10 },
        { channel: 'BUFFER', percentage: 10 },
      ],
      setBy: null,
      setAt: undefined,
    };
  },

  async listAllocations(
    db: Executor,
    scope: ResolvedScope,
    filters: ListAllocationsQuery,
  ): Promise<ListAllocationsResult> {
    const params: unknown[] = [];
    const conditions: string[] = [];

    const baseScope = scopedWhere(scope, { warehouseColumn: 'a.warehouse_id' });
    const scoped = renumber(baseScope, params.length + 1);
    conditions.push(scoped.sql);
    params.push(...scoped.params);

    if (filters.warehouseId !== undefined) {
      params.push(filters.warehouseId);
      conditions.push(`a.warehouse_id = $${params.length}`);
    }
    if (filters.channel !== undefined) {
      params.push(filters.channel);
      conditions.push(`a.channel = $${params.length}`);
    }
    if (filters.allocationDate !== undefined) {
      params.push(filters.allocationDate);
      conditions.push(`b.received_on = $${params.length}::date`);
    }
    if (filters.cursor !== undefined && filters.cursor.length > 0) {
      // Keyset on (created_at, id), matching the ORDER BY (the old `a.id < cursor` skipped rows).
      const after = requireKeysetCursor(CURSOR_TAGS.allocations, filters.cursor);
      params.push(after.ts, after.id);
      conditions.push(`(a.created_at, a.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
    }

    const where = conditions.length === 0 ? 'TRUE' : conditions.join(' AND ');
    const limit = filters.limit;
    params.push(limit + 1);

    const querySql = `
      SELECT a.id, a.batch_id, a.warehouse_id, a.channel, a.allocated_qty, a.consumed_qty,
             a.reserved_qty, ${EFFECTIVE_AVAILABLE}::text AS available_qty, a.computed_by,
             a.overridden_by, a.created_at, ${MICRO_TS_SQL('a.created_at')} AS cursor_ts,
             b.crop_id, cm.name AS crop_name, b.grade
        FROM allocations a
        JOIN inventory_batches b ON b.id = a.batch_id
        LEFT JOIN crop_master cm ON cm.id = b.crop_id
       WHERE ${where}
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT $${params.length}
    `;

    const res = await db.query<ChannelAllocationRow & { cursor_ts: string }>(querySql, params);
    const rows = res.rows;
    const hasMore = rows.length > limit;
    const itemsToReturn = hasMore ? rows.slice(0, limit) : rows;
    const last = itemsToReturn[itemsToReturn.length - 1];
    const nextCursor =
      hasMore && last !== undefined
        ? encodeKeysetCursor(CURSOR_TAGS.allocations, { ts: last.cursor_ts, id: last.id })
        : null;

    return {
      items: itemsToReturn.map(toAllocationView),
      page: {
        nextCursor,
        hasMore,
      },
    };
  },

  async getAvailableQuantityForChannel(
    db: Executor,
    warehouseId: string,
    cropId: string,
    channel: AllocationChannel,
  ): Promise<string> {
    const res = await db.query<{ available_qty: string }>(
      `SELECT COALESCE(SUM(${EFFECTIVE_AVAILABLE}), 0)::numeric(14,3)::text AS available_qty
         FROM allocations a
         JOIN inventory_batches b ON b.id = a.batch_id
        WHERE a.warehouse_id = $1
          AND b.crop_id = $2
          AND a.channel = $3
          AND b.status = 'ACTIVE'`,
      [warehouseId, cropId, channel],
    );
    return res.rows[0]?.available_qty ?? '0.000';
  },
};
