/**
 * Admin Produce Control Calendar (BR-142): SQL Repository.
 *
 * Implements scoped read-only queries for produce records, detail, calendar grid,
 * day events, and filter options. Parameterised SQL only through Executor.
 */
import type { Executor } from '../../db/pool.js';
import { CURSOR_TAGS, decodeKeysetCursor, encodeKeysetCursor } from '../../http/keysetCursor.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope, ScopedWhere } from '../../rbac/requirePermission.js';
import type {
  CommonProduceFilters,
  CropRecordSummary,
  ProduceCalendarDay,
  ProduceCalendarEventItem,
  ProduceEventType,
  ProduceFilterCropOption,
  ProduceFilterZoneOption,
  ProduceRecordDetailResponse,
} from './admin-produce.schema.js';

export interface ListProduceRecordsRepoArgs {
  filters: CommonProduceFilters;
  scope: ScopedWhere;
  limit: number;
  cursor?: string | undefined;
  includeTotal?: boolean | undefined;
}

export interface ListProduceRecordsRepoResult {
  items: CropRecordSummary[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number | undefined;
}

export interface GetProduceCalendarRepoArgs {
  month: string;
  filters: CommonProduceFilters;
  scope: ScopedWhere;
}

export interface ListProduceCalendarEventsRepoArgs {
  date: string;
  filters: CommonProduceFilters;
  scope: ScopedWhere;
  limit: number;
  cursor?: string | undefined;
}

export interface ListProduceCalendarEventsRepoResult {
  items: ProduceCalendarEventItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface AdminProduceRepo {
  listRecords(db: Executor, args: ListProduceRecordsRepoArgs): Promise<ListProduceRecordsRepoResult>;
  findRecordById(db: Executor, id: string, scope: ScopedWhere): Promise<ProduceRecordDetailResponse | null>;
  getCalendar(db: Executor, args: GetProduceCalendarRepoArgs): Promise<{ month: string; days: ProduceCalendarDay[] }>;
  listCalendarEvents(db: Executor, args: ListProduceCalendarEventsRepoArgs): Promise<ListProduceCalendarEventsRepoResult>;
  getFilterOptions(db: Executor, scope: ResolvedScope): Promise<{ zones: ProduceFilterZoneOption[]; crops: ProduceFilterCropOption[] }>;
}

function likePattern(value: string): string {
  return `%${value.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

function renumber(scope: ScopedWhere, startIndex: number): ScopedWhere {
  if (scope.params.length === 0) return { ...scope, nextIndex: startIndex };
  let next = startIndex;
  const sql = scope.sql.replace(/\$(\d+)/g, () => `$${next++}`);
  return { sql, params: scope.params, nextIndex: next };
}

interface EventCursor {
  eventType: string;
  recordId: string;
}

function encodeEventCursor(cursor: EventCursor): string {
  return Buffer.from(JSON.stringify([CURSOR_TAGS.produceEvents, cursor.eventType, cursor.recordId]), 'utf8').toString('base64url');
}

function decodeEventCursor(raw: string): EventCursor | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      Array.isArray(parsed) &&
      parsed.length === 3 &&
      parsed[0] === CURSOR_TAGS.produceEvents &&
      typeof parsed[1] === 'string' &&
      typeof parsed[2] === 'string'
    ) {
      return { eventType: parsed[1], recordId: parsed[2] };
    }
  } catch {
    // not valid
  }
  return null;
}

interface RecordRow {
  id: string;
  crop_id: string;
  crop_name: string;
  crop_botanical_name: string | null;
  seed_variety: string | null;
  farmer_id: string;
  tohfa_farmer_id: string;
  farmer_name: string;
  farm_id: string;
  farm_name: string;
  zone_id: string | null;
  zone_code: string | null;
  zone_name: string | null;
  plot_id: string;
  plot_name: string;
  area_acres: string | number | null;
  status: string;
  planted_on: string | null;
  expected_harvest_on: string | null;
  actual_harvest_on: string | null;
  expected_yield_kg: string | number | null;
  actual_yield_kg: string | number | null;
  created_at: Date;
  updated_at: Date | null;
  cursor_ts: string;
}

function mapRecordSummary(r: RecordRow): CropRecordSummary {
  return {
    id: r.id,
    crop: {
      id: r.crop_id,
      name: r.crop_name,
      botanicalName: r.crop_botanical_name,
    },
    variety: r.seed_variety,
    farmer: {
      id: r.farmer_id,
      tohfaFarmerId: r.tohfa_farmer_id,
      name: r.farmer_name,
    },
    farm: {
      id: r.farm_id,
      name: r.farm_name,
    },
    zone: r.zone_id ? { id: r.zone_id, code: r.zone_code ?? '', name: r.zone_name ?? '' } : null,
    plot: {
      id: r.plot_id,
      name: r.plot_name,
      areaAcres: r.area_acres !== null ? Number(r.area_acres) : null,
    },
    status: r.status as CropRecordSummary['status'],
    plantedOn: r.planted_on,
    expectedHarvestOn: r.expected_harvest_on,
    actualHarvestOn: r.actual_harvest_on,
    expectedYieldKg: r.expected_yield_kg !== null ? Number(r.expected_yield_kg) : null,
    actualYieldKg: r.actual_yield_kg !== null ? Number(r.actual_yield_kg) : null,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at ? r.updated_at.toISOString() : null,
  };
}

function buildFilterPredicates(filters: CommonProduceFilters, startIndex: number): { sqlParts: string[]; params: unknown[]; nextIndex: number } {
  const sqlParts: string[] = [];
  const params: unknown[] = [];
  let idx = startIndex;

  if (filters.farmerId) {
    sqlParts.push(`f.id = $${idx++}`);
    params.push(filters.farmerId);
  }
  if (filters.zoneId) {
    sqlParts.push(`f.zone_id = $${idx++}`);
    params.push(filters.zoneId);
  }
  if (filters.cropId) {
    sqlParts.push(`cm.id = $${idx++}`);
    params.push(filters.cropId);
  }
  if (filters.q) {
    sqlParts.push(`(cm.name ILIKE $${idx} ESCAPE '\\' OR cm.botanical_name ILIKE $${idx} ESCAPE '\\')`);
    params.push(likePattern(filters.q));
    idx++;
  }
  if (filters.status && filters.status.length > 0) {
    sqlParts.push(`fc.status = ANY($${idx++}::text[])`);
    params.push(filters.status);
  }

  return { sqlParts, params, nextIndex: idx };
}

const BASE_JOINS = `
  FROM farm_crops fc
  JOIN plots p ON p.id = fc.plot_id AND p.deleted_at IS NULL
  JOIN farms fm ON fm.id = p.farm_id AND fm.deleted_at IS NULL
  JOIN farmers f ON f.id = fm.farmer_id AND f.deleted_at IS NULL
  JOIN users u ON u.id = f.user_id AND u.deleted_at IS NULL
  JOIN crop_master cm ON cm.id = fc.crop_id AND cm.deleted_at IS NULL
  LEFT JOIN zones z ON z.id = f.zone_id AND z.deleted_at IS NULL
`;

export const adminProduceRepo: AdminProduceRepo = {
  async listRecords(db: Executor, args: ListProduceRecordsRepoArgs): Promise<ListProduceRecordsRepoResult> {
    const whereClauses: string[] = ['fc.deleted_at IS NULL'];
    const params: unknown[] = [];
    let idx = 1;

    const filterBuild = buildFilterPredicates(args.filters, idx);
    whereClauses.push(...filterBuild.sqlParts);
    params.push(...filterBuild.params);
    idx = filterBuild.nextIndex;

    const scoped = renumber(args.scope, idx);
    whereClauses.push(scoped.sql);
    params.push(...scoped.params);
    idx = scoped.nextIndex;

    let total: number | undefined;
    if (args.includeTotal) {
      const countSql = `SELECT COUNT(*)::int AS count ${BASE_JOINS} WHERE ${whereClauses.join(' AND ')}`;
      const countRes = await db.query<{ count: number }>(countSql, params);
      total = countRes.rows[0]?.count ?? 0;
    }

    if (args.cursor) {
      const decoded = decodeKeysetCursor(CURSOR_TAGS.produceRecords, args.cursor);
      if (!decoded) {
        throw new AppError('VALIDATION_FAILED', {
          detail: 'cursor is not a value returned by this endpoint.',
          errors: { 'query.cursor': ['Invalid cursor.'] },
        });
      }
      whereClauses.push(`(fc.created_at, fc.id) < ($${idx++}::timestamptz, $${idx++}::uuid)`);
      params.push(decoded.ts, decoded.id);
    }

    params.push(args.limit + 1);
    const limitPlaceholder = `$${idx++}`;

    const selectSql = `
      SELECT
        fc.id,
        cm.id AS crop_id,
        cm.name AS crop_name,
        cm.botanical_name AS crop_botanical_name,
        fc.seed_variety,
        f.id AS farmer_id,
        f.tohfa_farmer_id,
        u.full_name AS farmer_name,
        fm.id AS farm_id,
        fm.name AS farm_name,
        z.id AS zone_id,
        z.code AS zone_code,
        z.name AS zone_name,
        p.id AS plot_id,
        p.name AS plot_name,
        p.area_acres,
        fc.status,
        to_char(fc.planted_on, 'YYYY-MM-DD') AS planted_on,
        to_char(fc.expected_harvest_on, 'YYYY-MM-DD') AS expected_harvest_on,
        to_char(fc.actual_harvest_on, 'YYYY-MM-DD') AS actual_harvest_on,
        fc.expected_yield_kg,
        fc.actual_yield_kg,
        fc.created_at,
        fc.updated_at,
        to_char(fc.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_ts
      ${BASE_JOINS}
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY fc.created_at DESC, fc.id DESC
      LIMIT ${limitPlaceholder}
    `;

    const res = await db.query<RecordRow>(selectSql, params);
    const hasMore = res.rows.length > args.limit;
    const rows = hasMore ? res.rows.slice(0, args.limit) : res.rows;
    const last = rows[rows.length - 1];
    const nextCursor = hasMore && last ? encodeKeysetCursor(CURSOR_TAGS.produceRecords, { ts: last.cursor_ts, id: last.id }) : null;

    return {
      items: rows.map(mapRecordSummary),
      nextCursor,
      hasMore,
      total,
    };
  },

  async findRecordById(db: Executor, id: string, scope: ScopedWhere): Promise<ProduceRecordDetailResponse | null> {
    const scoped = renumber(scope, 2);
    const sql = `
      SELECT
        fc.id,
        cm.id AS crop_id,
        cm.name AS crop_name,
        cm.botanical_name AS crop_botanical_name,
        fc.seed_variety,
        f.id AS farmer_id,
        f.tohfa_farmer_id,
        u.full_name AS farmer_name,
        fm.id AS farm_id,
        fm.name AS farm_name,
        z.id AS zone_id,
        z.code AS zone_code,
        z.name AS zone_name,
        p.id AS plot_id,
        p.name AS plot_name,
        p.area_acres,
        p.soil_type,
        p.irrigation_type,
        p.sun_exposure,
        fc.status,
        to_char(fc.planted_on, 'YYYY-MM-DD') AS planted_on,
        to_char(fc.expected_harvest_on, 'YYYY-MM-DD') AS expected_harvest_on,
        to_char(fc.actual_harvest_on, 'YYYY-MM-DD') AS actual_harvest_on,
        fc.expected_yield_kg,
        fc.actual_yield_kg,
        fc.created_at,
        fc.updated_at,
        to_char(fc.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_ts
      ${BASE_JOINS}
      WHERE fc.id = $1 AND fc.deleted_at IS NULL AND ${scoped.sql}
    `;

    const res = await db.query<RecordRow & { soil_type: string | null; irrigation_type: string | null; sun_exposure: string | null }>(sql, [id, ...scoped.params]);
    const row = res.rows[0];
    if (!row) return null;

    const stagesSql = `
      SELECT
        id,
        stage_code,
        stage_name,
        sequence_order,
        status,
        to_char(target_date, 'YYYY-MM-DD') AS target_date,
        to_char(completed_on, 'YYYY-MM-DD') AS completed_on
      FROM farm_crop_milestones
      WHERE farm_crop_id = $1 AND deleted_at IS NULL
      ORDER BY sequence_order ASC
    `;
    const stagesRes = await db.query<{
      id: string;
      stage_code: string;
      stage_name: string;
      sequence_order: number;
      status: string;
      target_date: string | null;
      completed_on: string | null;
    }>(stagesSql, [id]);

    const countsSql = `
      SELECT
        (SELECT count(*)::int FROM diary_entries WHERE farm_crop_id = $1 AND deleted_at IS NULL) AS diary_count,
        (SELECT count(*)::int FROM crop_inputs WHERE farm_crop_id = $1 AND deleted_at IS NULL) AS input_count
    `;
    const countsRes = await db.query<{ diary_count: number; input_count: number }>(countsSql, [id]);

    const baseSummary = mapRecordSummary(row);
    return {
      ...baseSummary,
      plot: {
        id: row.plot_id,
        name: row.plot_name,
        areaAcres: row.area_acres !== null ? Number(row.area_acres) : null,
        soilType: row.soil_type,
        irrigationType: row.irrigation_type,
        sunExposure: row.sun_exposure,
      },
      stages: stagesRes.rows.map((s) => ({
        id: s.id,
        stageCode: s.stage_code,
        stageName: s.stage_name,
        sequence: s.sequence_order,
        status: s.status as ProduceRecordStage['status'],
        targetDate: s.target_date,
        completedOn: s.completed_on,
      })),
      related: {
        diaryEntryCount: countsRes.rows[0]?.diary_count ?? 0,
        inputLogCount: countsRes.rows[0]?.input_count ?? 0,
      },
    };
  },

  async getCalendar(db: Executor, args: GetProduceCalendarRepoArgs): Promise<{ month: string; days: ProduceCalendarDay[] }> {
    const monthStart = `${args.month}-01`;
    const whereClauses: string[] = ['fc.deleted_at IS NULL'];
    const params: unknown[] = [monthStart];
    let idx = 2;

    const filterBuild = buildFilterPredicates(args.filters, idx);
    whereClauses.push(...filterBuild.sqlParts);
    params.push(...filterBuild.params);
    idx = filterBuild.nextIndex;

    const scoped = renumber(args.scope, idx);
    whereClauses.push(scoped.sql);
    params.push(...scoped.params);

    const baseWhere = whereClauses.join(' AND ');

    const plantingSql = `
      SELECT to_char(fc.planted_on, 'YYYY-MM-DD') AS day_date, count(*)::int AS cnt
      ${BASE_JOINS}
      WHERE ${baseWhere}
        AND fc.planted_on >= $1::date
        AND fc.planted_on < ($1::date + interval '1 month')
      GROUP BY fc.planted_on
    `;

    const growthSql = `
      SELECT to_char(m.completed_on, 'YYYY-MM-DD') AS day_date, count(*)::int AS cnt
      FROM farm_crop_milestones m
      JOIN farm_crops fc ON fc.id = m.farm_crop_id AND fc.deleted_at IS NULL
      JOIN plots p ON p.id = fc.plot_id AND p.deleted_at IS NULL
      JOIN farms fm ON fm.id = p.farm_id AND fm.deleted_at IS NULL
      JOIN farmers f ON f.id = fm.farmer_id AND f.deleted_at IS NULL
      JOIN users u ON u.id = f.user_id AND u.deleted_at IS NULL
      JOIN crop_master cm ON cm.id = fc.crop_id AND cm.deleted_at IS NULL
      LEFT JOIN zones z ON z.id = f.zone_id AND z.deleted_at IS NULL
      WHERE m.deleted_at IS NULL
        AND m.status = 'COMPLETED'
        AND m.completed_on >= $1::date
        AND m.completed_on < ($1::date + interval '1 month')
        AND ${baseWhere}
      GROUP BY m.completed_on
    `;

    const harvestSql = `
      SELECT to_char(fc.actual_harvest_on, 'YYYY-MM-DD') AS day_date, count(*)::int AS cnt
      ${BASE_JOINS}
      WHERE ${baseWhere}
        AND fc.actual_harvest_on >= $1::date
        AND fc.actual_harvest_on < ($1::date + interval '1 month')
      GROUP BY fc.actual_harvest_on
    `;

    const [plantingRes, growthRes, harvestRes] = await Promise.all([
      db.query<{ day_date: string; cnt: number }>(plantingSql, params),
      db.query<{ day_date: string; cnt: number }>(growthSql, params),
      db.query<{ day_date: string; cnt: number }>(harvestSql, params),
    ]);

    const dayMap = new Map<string, { planting: number; growthStage: number; harvest: number }>();

    for (const r of plantingRes.rows) {
      const cur = dayMap.get(r.day_date) ?? { planting: 0, growthStage: 0, harvest: 0 };
      cur.planting += r.cnt;
      dayMap.set(r.day_date, cur);
    }
    for (const r of growthRes.rows) {
      const cur = dayMap.get(r.day_date) ?? { planting: 0, growthStage: 0, harvest: 0 };
      cur.growthStage += r.cnt;
      dayMap.set(r.day_date, cur);
    }
    for (const r of harvestRes.rows) {
      const cur = dayMap.get(r.day_date) ?? { planting: 0, growthStage: 0, harvest: 0 };
      cur.harvest += r.cnt;
      dayMap.set(r.day_date, cur);
    }

    const days: ProduceCalendarDay[] = [];
    const sortedDates = Array.from(dayMap.keys()).sort();
    for (const d of sortedDates) {
      const counts = dayMap.get(d)!;
      if (counts.planting > 0 || counts.growthStage > 0 || counts.harvest > 0) {
        days.push({
          date: d,
          planting: counts.planting,
          growthStage: counts.growthStage,
          harvest: counts.harvest,
        });
      }
    }

    return { month: args.month, days };
  },

  async listCalendarEvents(db: Executor, args: ListProduceCalendarEventsRepoArgs): Promise<ListProduceCalendarEventsRepoResult> {
    const whereClauses: string[] = ['fc.deleted_at IS NULL'];
    const params: unknown[] = [args.date];
    let idx = 2;

    const filterBuild = buildFilterPredicates(args.filters, idx);
    whereClauses.push(...filterBuild.sqlParts);
    params.push(...filterBuild.params);
    idx = filterBuild.nextIndex;

    const scoped = renumber(args.scope, idx);
    whereClauses.push(scoped.sql);
    params.push(...scoped.params);
    idx = scoped.nextIndex;

    const baseWhere = whereClauses.join(' AND ');

    const unionSql = `
      SELECT
        'PLANTING'::text AS event_type,
        to_char(fc.planted_on, 'YYYY-MM-DD') AS event_date,
        NULL::text AS stage_code,
        NULL::text AS stage_name,
        fc.id AS record_id,
        cm.id AS crop_id,
        cm.name AS crop_name,
        f.id AS farmer_id,
        u.full_name AS farmer_name,
        z.id AS zone_id,
        z.name AS zone_name,
        p.id AS plot_id,
        p.name AS plot_name
      ${BASE_JOINS}
      WHERE ${baseWhere} AND fc.planted_on = $1::date

      UNION ALL

      SELECT
        'GROWTH_STAGE'::text AS event_type,
        to_char(m.completed_on, 'YYYY-MM-DD') AS event_date,
        m.stage_code,
        m.stage_name,
        fc.id AS record_id,
        cm.id AS crop_id,
        cm.name AS crop_name,
        f.id AS farmer_id,
        u.full_name AS farmer_name,
        z.id AS zone_id,
        z.name AS zone_name,
        p.id AS plot_id,
        p.name AS plot_name
      FROM farm_crop_milestones m
      JOIN farm_crops fc ON fc.id = m.farm_crop_id AND fc.deleted_at IS NULL
      JOIN plots p ON p.id = fc.plot_id AND p.deleted_at IS NULL
      JOIN farms fm ON fm.id = p.farm_id AND fm.deleted_at IS NULL
      JOIN farmers f ON f.id = fm.farmer_id AND f.deleted_at IS NULL
      JOIN users u ON u.id = f.user_id AND u.deleted_at IS NULL
      JOIN crop_master cm ON cm.id = fc.crop_id AND cm.deleted_at IS NULL
      LEFT JOIN zones z ON z.id = f.zone_id AND z.deleted_at IS NULL
      WHERE m.deleted_at IS NULL
        AND m.status = 'COMPLETED'
        AND m.completed_on = $1::date
        AND ${baseWhere}

      UNION ALL

      SELECT
        'HARVEST'::text AS event_type,
        to_char(fc.actual_harvest_on, 'YYYY-MM-DD') AS event_date,
        NULL::text AS stage_code,
        NULL::text AS stage_name,
        fc.id AS record_id,
        cm.id AS crop_id,
        cm.name AS crop_name,
        f.id AS farmer_id,
        u.full_name AS farmer_name,
        z.id AS zone_id,
        z.name AS zone_name,
        p.id AS plot_id,
        p.name AS plot_name
      ${BASE_JOINS}
      WHERE ${baseWhere} AND fc.actual_harvest_on = $1::date
    `;

    interface EventRow {
      event_type: string;
      event_date: string;
      stage_code: string | null;
      stage_name: string | null;
      record_id: string;
      crop_id: string;
      crop_name: string;
      farmer_id: string;
      farmer_name: string;
      zone_id: string | null;
      zone_name: string | null;
      plot_id: string;
      plot_name: string;
    }

    let cursorPredicate = '';
    if (args.cursor) {
      const decoded = decodeEventCursor(args.cursor);
      if (!decoded) {
        throw new AppError('VALIDATION_FAILED', {
          detail: 'cursor is not a value returned by this endpoint.',
          errors: { 'query.cursor': ['Invalid cursor.'] },
        });
      }
      cursorPredicate = `WHERE (event_type, record_id) > ($${idx++}::text, $${idx++}::uuid)`;
      params.push(decoded.eventType, decoded.recordId);
    }

    params.push(args.limit + 1);
    const limitPlaceholder = `$${idx++}`;

    const wrappedSql = `
      SELECT * FROM (${unionSql}) AS ev
      ${cursorPredicate}
      ORDER BY event_type ASC, record_id ASC
      LIMIT ${limitPlaceholder}
    `;

    const res = await db.query<EventRow>(wrappedSql, params);
    const hasMore = res.rows.length > args.limit;
    const rows = hasMore ? res.rows.slice(0, args.limit) : res.rows;
    const last = rows[rows.length - 1];
    const nextCursor = hasMore && last ? encodeEventCursor({ eventType: last.event_type, recordId: last.record_id }) : null;

    const items: ProduceCalendarEventItem[] = rows.map((r) => ({
      eventType: r.event_type as ProduceEventType,
      date: r.event_date,
      stage: r.stage_code && r.stage_name ? { code: r.stage_code, name: r.stage_name } : null,
      record: {
        id: r.record_id,
        crop: { id: r.crop_id, name: r.crop_name },
        farmer: { id: r.farmer_id, name: r.farmer_name },
        zone: r.zone_id && r.zone_name ? { id: r.zone_id, name: r.zone_name } : null,
        plot: { id: r.plot_id, name: r.plot_name },
      },
    }));

    return { items, nextCursor, hasMore };
  },

  async getFilterOptions(db: Executor, scope: ResolvedScope): Promise<{ zones: ProduceFilterZoneOption[]; crops: ProduceFilterCropOption[] }> {
    let zonesSql = '';
    let zonesParams: unknown[] = [];

    if (scope.roleCode === 'FARMER_ADMIN' || (scope.zoneIds && scope.zoneIds.length > 0)) {
      const zoneIds = scope.zoneIds ?? [];
      if (zoneIds.length === 0) {
        zonesSql = 'SELECT id, code, name FROM zones WHERE FALSE';
      } else {
        zonesSql = `SELECT id, code, name FROM zones WHERE id = ANY($1::uuid[]) AND is_active = true AND deleted_at IS NULL ORDER BY name ASC`;
        zonesParams = [zoneIds];
      }
    } else if (scope.roleCode === 'SUB_WH_ADMIN' || (scope.warehouseIds && scope.warehouseIds.length > 0)) {
      const warehouseIds = scope.warehouseIds ?? [];
      if (warehouseIds.length === 0) {
        zonesSql = 'SELECT id, code, name FROM zones WHERE FALSE';
      } else {
        zonesSql = `SELECT id, code, name FROM zones WHERE warehouse_id = ANY($1::uuid[]) AND is_active = true AND deleted_at IS NULL ORDER BY name ASC`;
        zonesParams = [warehouseIds];
      }
    } else if (['SUPER_ADMIN', 'TOHFA_ADMIN', 'MAIN_WH_ADMIN'].includes(scope.roleCode)) {
      zonesSql = `SELECT id, code, name FROM zones WHERE is_active = true AND deleted_at IS NULL ORDER BY name ASC`;
    } else {
      zonesSql = 'SELECT id, code, name FROM zones WHERE FALSE';
    }

    const cropsSql = `
      SELECT id, name, botanical_name
      FROM crop_master
      WHERE is_active = true AND deleted_at IS NULL
      ORDER BY name ASC
    `;

    const [zonesRes, cropsRes] = await Promise.all([
      db.query<{ id: string; code: string; name: string }>(zonesSql, zonesParams),
      db.query<{ id: string; name: string; botanical_name: string | null }>(cropsSql),
    ]);

    return {
      zones: zonesRes.rows.map((z) => ({ id: z.id, code: z.code, name: z.name })),
      crops: cropsRes.rows.map((c) => ({ id: c.id, name: c.name, botanicalName: c.botanical_name })),
    };
  },
};

