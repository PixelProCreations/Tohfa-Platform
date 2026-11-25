import { Router } from 'express';
import { z } from 'zod';
import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { AppError } from '../../http/problem.js';
import { getValidated, validate } from '../../http/validate.js';
import { ScopeLevel } from '@tohfa/shared-types';
import { requirePermission, requireScope, type ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseIdParams } from './warehouses.schema.js';

const hhmm = z.string().regex(/^([01][0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be HH:MM (24-hour)');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');

export const scheduleIdParams = z
  .object({
    id: z.string().uuid('warehouse id must be a UUID'),
    scheduleId: z.string().uuid('scheduleId must be a UUID'),
  })
  .strict();

export const updateMarketStatusBody = z
  .object({
    isMarketOpen: z.boolean(),
    marketOpenTime: hhmm.nullable().optional(),
    marketCloseTime: hhmm.nullable().optional(),
    reason: z.string().trim().min(3, 'reason must be at least 3 characters').max(500).optional(),
  })
  .strict()
  .refine((b) => b.isMarketOpen || (b.reason !== undefined && b.reason.trim().length >= 3), {
    message: 'reason is required when closing the warehouse market',
    path: ['reason'],
  });
export type UpdateMarketStatusBody = z.infer<typeof updateMarketStatusBody>;

export const scheduleModes = ['OPEN', 'CLOSE'] as const;
export const repeatRules = ['ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'] as const;

export const createMarketScheduleBody = z
  .object({
    mode: z.enum(scheduleModes),
    scheduleDate: isoDate,
    scheduleTime: hhmm,
    repeatRule: z.enum(repeatRules).default('ONE_TIME'),
    isActive: z.boolean().default(true),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();
export type CreateMarketScheduleBody = z.infer<typeof createMarketScheduleBody>;

export const updateMarketScheduleBody = z
  .object({
    mode: z.enum(scheduleModes).optional(),
    scheduleDate: isoDate.optional(),
    scheduleTime: hhmm.optional(),
    repeatRule: z.enum(repeatRules).optional(),
    isActive: z.boolean().optional(),
    notes: z.string().trim().max(500).nullable().optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: 'At least one field must be supplied' });
export type UpdateMarketScheduleBody = z.infer<typeof updateMarketScheduleBody>;

export interface MarketStatusView {
  warehouseId: string;
  isMarketOpen: boolean;
  marketOpenTime: string | null;
  marketCloseTime: string | null;
  reason: string | null;
  updatedAt: string | null;
}

export interface AdminMarketStatusView extends MarketStatusView {
  updatedBy: string | null;
}

export interface MarketScheduleView {
  id: string;
  warehouseId: string;
  mode: 'OPEN' | 'CLOSE';
  scheduleDate: string;
  scheduleTime: string;
  repeatRule: 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  isActive: boolean;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export function marketClosedError(warehouseId: string): AppError {
  return new AppError('CONFLICT', {
    status: 409,
    detail: 'Retail market is currently closed for this warehouse.',
    meta: { reason: 'MARKET_CLOSED', warehouseId },
  });
}

export async function isWarehouseMarketOpen(db: Executor, warehouseId: string): Promise<boolean> {
  const res = await db.query<{ is_market_open: boolean }>(
    `SELECT is_market_open FROM warehouses WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
    [warehouseId],
  );
  return res.rows[0]?.is_market_open ?? false;
}

interface ScheduleRow {
  id: string;
  warehouse_id: string;
  mode: 'OPEN' | 'CLOSE';
  schedule_date: string;
  schedule_time: string;
  repeat_rule: 'ONE_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

function toScheduleView(r: ScheduleRow): MarketScheduleView {
  return {
    id: r.id,
    warehouseId: r.warehouse_id,
    mode: r.mode,
    scheduleDate: r.schedule_date,
    scheduleTime: r.schedule_time,
    repeatRule: r.repeat_rule,
    isActive: r.is_active,
    notes: r.notes,
    createdBy: r.created_by,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}

async function loadMarketStatus(db: Executor, warehouseId: string): Promise<AdminMarketStatusView | null> {
  const res = await db.query<{
    id: string;
    is_market_open: boolean;
    market_open_time: string | null;
    market_close_time: string | null;
    market_status_reason: string | null;
    market_status_updated_by: string | null;
    market_status_updated_at: Date | null;
  }>(
    `SELECT id, is_market_open, market_open_time, market_close_time,
            market_status_reason, market_status_updated_by, market_status_updated_at
       FROM warehouses
      WHERE id = $1 AND deleted_at IS NULL
      LIMIT 1`,
    [warehouseId],
  );
  const r = res.rows[0];
  if (!r) return null;
  return {
    warehouseId: r.id,
    isMarketOpen: r.is_market_open,
    marketOpenTime: r.market_open_time,
    marketCloseTime: r.market_close_time,
    reason: r.market_status_reason,
    updatedBy: r.market_status_updated_by,
    updatedAt: r.market_status_updated_at === null ? null : r.market_status_updated_at.toISOString(),
  };
}

const SCHEDULE_COLUMNS = `id, warehouse_id, mode, schedule_date::text AS schedule_date, schedule_time, repeat_rule, is_active, notes, created_by, created_at, updated_at`;

export const warehouseMarketService = {
  async getPublicStatus(warehouseId: string): Promise<MarketStatusView> {
    const status = await loadMarketStatus(pool, warehouseId);
    if (!status) throw new AppError('NOT_FOUND', { detail: `Warehouse ${warehouseId} not found.` });
    const { updatedBy: _omit, ...pub } = status;
    return pub;
  },

  async getAdminStatus(warehouseId: string): Promise<AdminMarketStatusView> {
    const status = await loadMarketStatus(pool, warehouseId);
    if (!status) throw new AppError('NOT_FOUND', { detail: `Warehouse ${warehouseId} not found.` });
    return status;
  },

  async setStatus(scope: ResolvedScope, warehouseId: string, body: UpdateMarketStatusBody): Promise<AdminMarketStatusView> {
    return withTransaction(async (tx) => {
      const before = await loadMarketStatus(tx, warehouseId);
      if (!before) throw new AppError('NOT_FOUND', { detail: `Warehouse ${warehouseId} not found.` });

      await tx.query(
        `UPDATE warehouses
            SET is_market_open = $2,
                market_open_time = COALESCE($3, market_open_time),
                market_close_time = COALESCE($4, market_close_time),
                market_status_reason = $5,
                market_status_updated_by = $6,
                market_status_updated_at = now(),
                updated_at = now()
          WHERE id = $1`,
        [
          warehouseId,
          body.isMarketOpen,
          body.marketOpenTime === undefined ? null : body.marketOpenTime,
          body.marketCloseTime === undefined ? null : body.marketCloseTime,
          body.reason ?? null,
          scope.userId,
        ],
      );

      if (body.marketOpenTime === null || body.marketCloseTime === null) {
        await tx.query(
          `UPDATE warehouses
              SET market_open_time = CASE WHEN $2 THEN NULL ELSE market_open_time END,
                  market_close_time = CASE WHEN $3 THEN NULL ELSE market_close_time END
            WHERE id = $1`,
          [warehouseId, body.marketOpenTime === null, body.marketCloseTime === null],
        );
      }

      const after = await loadMarketStatus(tx, warehouseId);
      if (!after) throw new AppError('NOT_FOUND', { detail: `Warehouse ${warehouseId} not found.` });

      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'warehouse.market_status.update',
        entityType: 'warehouse',
        entityId: warehouseId,
        before,
        after,
        changedFields: changedFields({ ...before }, { ...after }),
      });
      return after;
    });
  },

  async listSchedules(warehouseId: string): Promise<{ items: MarketScheduleView[] }> {
    const status = await loadMarketStatus(pool, warehouseId);
    if (!status) throw new AppError('NOT_FOUND', { detail: `Warehouse ${warehouseId} not found.` });
    const res = await pool.query<ScheduleRow>(
      `SELECT ${SCHEDULE_COLUMNS}
         FROM market_open_close_schedules
        WHERE warehouse_id = $1 AND deleted_at IS NULL
        ORDER BY schedule_date ASC, schedule_time ASC`,
      [warehouseId],
    );
    return { items: res.rows.map(toScheduleView) };
  },

  async createSchedule(scope: ResolvedScope, warehouseId: string, body: CreateMarketScheduleBody): Promise<MarketScheduleView> {
    return withTransaction(async (tx) => {
      const status = await loadMarketStatus(tx, warehouseId);
      if (!status) throw new AppError('NOT_FOUND', { detail: `Warehouse ${warehouseId} not found.` });

      const res = await tx.query<ScheduleRow>(
        `INSERT INTO market_open_close_schedules (warehouse_id, mode, schedule_date, schedule_time, repeat_rule, is_active, notes, created_by)
         VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8)
         RETURNING ${SCHEDULE_COLUMNS}`,
        [
          warehouseId,
          body.mode,
          body.scheduleDate,
          body.scheduleTime,
          body.repeatRule,
          body.isActive,
          body.notes ?? null,
          scope.userId,
        ],
      );
      const created = toScheduleView(res.rows[0]!);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'warehouse.market_schedule.create',
        entityType: 'market_open_close_schedule',
        entityId: created.id,
        after: created,
      });
      return created;
    });
  },

  async updateSchedule(
    scope: ResolvedScope,
    warehouseId: string,
    scheduleId: string,
    body: UpdateMarketScheduleBody,
  ): Promise<MarketScheduleView> {
    return withTransaction(async (tx) => {
      const beforeRes = await tx.query<ScheduleRow>(
        `SELECT ${SCHEDULE_COLUMNS} FROM market_open_close_schedules WHERE id = $1 AND warehouse_id = $2 AND deleted_at IS NULL LIMIT 1`,
        [scheduleId, warehouseId],
      );
      const beforeRow = beforeRes.rows[0];
      if (!beforeRow) throw new AppError('NOT_FOUND', { detail: `Schedule ${scheduleId} not found.` });
      const before = toScheduleView(beforeRow);

      const sets: string[] = [];
      const params: unknown[] = [scheduleId, warehouseId];
      if (body.mode !== undefined) {
        params.push(body.mode);
        sets.push(`mode = $${params.length}`);
      }
      if (body.scheduleDate !== undefined) {
        params.push(body.scheduleDate);
        sets.push(`schedule_date = $${params.length}::date`);
      }
      if (body.scheduleTime !== undefined) {
        params.push(body.scheduleTime);
        sets.push(`schedule_time = $${params.length}`);
      }
      if (body.repeatRule !== undefined) {
        params.push(body.repeatRule);
        sets.push(`repeat_rule = $${params.length}`);
      }
      if (body.isActive !== undefined) {
        params.push(body.isActive);
        sets.push(`is_active = $${params.length}`);
      }
      if ('notes' in body && body.notes !== undefined) {
        params.push(body.notes);
        sets.push(`notes = $${params.length}`);
      }
      sets.push('updated_at = now()');

      const afterRes = await tx.query<ScheduleRow>(
        `UPDATE market_open_close_schedules SET ${sets.join(', ')}
          WHERE id = $1 AND warehouse_id = $2 AND deleted_at IS NULL
          RETURNING ${SCHEDULE_COLUMNS}`,
        params,
      );
      const after = toScheduleView(afterRes.rows[0]!);
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'warehouse.market_schedule.update',
        entityType: 'market_open_close_schedule',
        entityId: scheduleId,
        before,
        after,
        changedFields: changedFields({ ...before }, { ...after }),
      });
      return after;
    });
  },

  async deleteSchedule(scope: ResolvedScope, warehouseId: string, scheduleId: string): Promise<void> {
    await withTransaction(async (tx) => {
      const beforeRes = await tx.query<ScheduleRow>(
        `SELECT ${SCHEDULE_COLUMNS} FROM market_open_close_schedules WHERE id = $1 AND warehouse_id = $2 AND deleted_at IS NULL LIMIT 1`,
        [scheduleId, warehouseId],
      );
      const beforeRow = beforeRes.rows[0];
      if (!beforeRow) throw new AppError('NOT_FOUND', { detail: `Schedule ${scheduleId} not found.` });

      await tx.query(
        `UPDATE market_open_close_schedules SET deleted_at = now(), updated_at = now() WHERE id = $1`,
        [scheduleId],
      );
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'warehouse.market_schedule.delete',
        entityType: 'market_open_close_schedule',
        entityId: scheduleId,
        before: toScheduleView(beforeRow),
      });
    });
  },
};

/**
 * BR-244 (GAP 1): Evaluates due `market_open_close_schedules` in `Asia/Kolkata`
 * and updates `warehouses.is_market_open` via `warehouseMarketService.setStatus()`
 * (writing `audit_log` per change). Marks `ONE_TIME` schedules inactive after firing.
 */
export async function executeDueMarketSchedules(
  asOf: Date = new Date(),
): Promise<{ scanned: number; executed: number }> {
  const istParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .formatToParts(asOf)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});

  const todayIst = `${istParts['year']}-${istParts['month']}-${istParts['day']}`;
  const nowMinutes = Number(istParts['hour']) * 60 + Number(istParts['minute']);
  const dow = new Date(`${todayIst}T00:00:00Z`).getUTCDay();
  const dom = Number(istParts['day']);

  const res = await pool.query<ScheduleRow>(
    `SELECT ${SCHEDULE_COLUMNS}
       FROM market_open_close_schedules
      WHERE is_active = true AND deleted_at IS NULL
        AND schedule_date <= $1::date`,
    [todayIst],
  );

  const systemScope: ResolvedScope = {
    userId: '00000000-0000-0000-0000-000000000000',
    roleCode: 'SUPER_ADMIN',
    level: ScopeLevel.ALL,
    warehouseIds: [],
    zoneIds: [],
  };

  let executed = 0;
  for (const s of res.rows) {
    const [hhStr, mmStr] = s.schedule_time.split(':');
    const schedMinutes = Number(hhStr) * 60 + Number(mmStr);
    const inWindow = schedMinutes <= nowMinutes && nowMinutes - schedMinutes < 1;
    const isOneTimeDue = s.repeat_rule === 'ONE_TIME' && (s.schedule_date < todayIst || schedMinutes <= nowMinutes);

    let matches = false;
    if (isOneTimeDue) {
      matches = true;
    } else if (inWindow) {
      if (s.repeat_rule === 'DAILY') matches = true;
      else if (s.repeat_rule === 'WEEKLY') matches = new Date(`${s.schedule_date}T00:00:00Z`).getUTCDay() === dow;
      else if (s.repeat_rule === 'MONTHLY') matches = Number(s.schedule_date.split('-')[2]) === dom;
      else if (s.repeat_rule === 'CUSTOM') matches = s.schedule_date === todayIst;
    }

    if (!matches) continue;

    await warehouseMarketService.setStatus(systemScope, s.warehouse_id, {
      isMarketOpen: s.mode === 'OPEN',
      reason: `Scheduled ${s.mode} (${s.repeat_rule})`,
    });

    if (s.repeat_rule === 'ONE_TIME') {
      await pool.query(
        `UPDATE market_open_close_schedules SET is_active = false, updated_at = now() WHERE id = $1`,
        [s.id],
      );
    }
    executed += 1;
  }

  return { scanned: res.rows.length, executed };
}

export const warehouseMarketPublicRouter: Router = Router();
warehouseMarketPublicRouter.get(
  '/:id/market-status',
  validate({ params: warehouseIdParams }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', warehouseIdParams);
    res.json(await warehouseMarketService.getPublicStatus(id));
  }),
);

export const adminWarehouseMarketRouter: Router = Router();
adminWarehouseMarketRouter.use(requireAuth, requirePermission('market.schedule.manage'));

adminWarehouseMarketRouter.get(
  '/:id/market-status',
  validate({ params: warehouseIdParams }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', warehouseIdParams);
    res.json(await warehouseMarketService.getAdminStatus(id));
  }),
);

adminWarehouseMarketRouter.post(
  '/:id/market-status',
  validate({ params: warehouseIdParams, body: updateMarketStatusBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', warehouseIdParams);
    const body = getValidated(req, 'body', updateMarketStatusBody);
    res.json(await warehouseMarketService.setStatus(scope, id, body));
  }),
);

adminWarehouseMarketRouter.get(
  '/:id/market-schedules',
  validate({ params: warehouseIdParams }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', warehouseIdParams);
    res.json(await warehouseMarketService.listSchedules(id));
  }),
);

adminWarehouseMarketRouter.post(
  '/:id/market-schedules',
  validate({ params: warehouseIdParams, body: createMarketScheduleBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', warehouseIdParams);
    const body = getValidated(req, 'body', createMarketScheduleBody);
    res.status(201).json(await warehouseMarketService.createSchedule(scope, id, body));
  }),
);

adminWarehouseMarketRouter.patch(
  '/:id/market-schedules/:scheduleId',
  validate({ params: scheduleIdParams, body: updateMarketScheduleBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id, scheduleId } = getValidated(req, 'params', scheduleIdParams);
    const body = getValidated(req, 'body', updateMarketScheduleBody);
    res.json(await warehouseMarketService.updateSchedule(scope, id, scheduleId, body));
  }),
);

adminWarehouseMarketRouter.delete(
  '/:id/market-schedules/:scheduleId',
  validate({ params: scheduleIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id, scheduleId } = getValidated(req, 'params', scheduleIdParams);
    await warehouseMarketService.deleteSchedule(scope, id, scheduleId);
    res.status(204).end();
  }),
);
