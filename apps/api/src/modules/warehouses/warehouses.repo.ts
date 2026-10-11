/**
 * REFERENCE PATTERN — copy this structure for every new module. See CLAUDE.md.
 *
 * <name>.repo.ts is the ONLY place that writes SQL for this module.
 * Rules:
 *  - Every function takes an `Executor` first so the service can compose calls
 *    inside one transaction (`withTransaction`).
 *  - Values are always positional params (`$1`), never string-interpolated.
 *    The ONE exception is a pre-built scope fragment from `scopedWhere`, whose
 *    column names come from our own code and whose values are still params.
 *  - Rows are mapped to the domain shape HERE, so snake_case never escapes
 *    this file.
 *  - No authorization decisions live here — the repo applies the filter it is
 *    handed; deciding what that filter is, is the service's job.
 */
import type { Executor } from '../../db/pool.js';
import type { ScopedWhere } from '../../rbac/requirePermission.js';
import type {
  ListWarehousesQuery,
  WarehouseCapacityResponse,
  WarehouseDetail,
  WarehouseType,
} from './warehouses.schema.js';

/** Raw row shape as it comes out of Postgres. Never leaves this file. */
interface WarehouseRow {
  id: string;
  code: string;
  name: string;
  type: string;
  address: string | null;
  city: string | null;
  pincode: string | null;
  lat: string | null;
  lng: string | null;
  capacity_kg: string | null;
  operating_hours: unknown;
  contact_phone: string | null;
  is_market_day_venue: boolean;
  market_day_of_week: number | null;
  is_active: boolean;
  created_at: Date;
}

function toWarehouse(row: WarehouseRow): WarehouseDetail {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type as WarehouseType,
    address: row.address,
    city: row.city,
    pincode: row.pincode,
    // lat/lng are NUMERIC(9,6); pg hands them over as strings on purpose.
    latitude: row.lat === null ? null : Number(row.lat),
    longitude: row.lng === null ? null : Number(row.lng),
    // capacity_kg is NUMERIC(12,3); kept as the decimal string pg returns.
    capacityKg: row.capacity_kg,
    contactPhone: row.contact_phone,
    operatingHours: row.operating_hours,
    isMarketDayVenue: row.is_market_day_venue,
    marketDayOfWeek: row.market_day_of_week,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
  };
}

export interface ListArgs {
  filters: ListWarehousesQuery;
  /** Scope fragment produced by `scopedWhere(scope, { warehouseColumn: 'w.id' })`. */
  scope: ScopedWhere;
}

export interface ListResult {
  items: WarehouseDetail[];
  total: number;
}

/** The only warehouse column a capacity change reads or writes. */
export interface CapacityRow {
  capacityKg: string | null;
}

/**
 * The repository interface. The service depends on THIS, not on the concrete
 * implementation, which is what makes `warehouses.test.ts` able to run with a
 * plain object stub and no database.
 */
export interface WarehousesRepo {
  list(db: Executor, args: ListArgs): Promise<ListResult>;
  findById(db: Executor, id: string, scope: ScopedWhere): Promise<WarehouseDetail | null>;
  /** Capacity plus the derived usage. `scope` placeholders must start at `$2`. */
  findCapacity(
    db: Executor,
    id: string,
    scope: ScopedWhere,
  ): Promise<WarehouseCapacityResponse | null>;
  /** Row-locks the warehouse and returns its current capacity (the before image). */
  lockCapacity(db: Executor, id: string, scope: ScopedWhere): Promise<CapacityRow | null>;
  /** Writes `warehouses.capacity_kg` and returns the stored (normalised) value. */
  setCapacity(db: Executor, id: string, capacityKg: string): Promise<string>;
}

const SELECT_COLUMNS = `
  w.id, w.code, w.name, w.type, w.address, w.city, w.pincode, w.lat, w.lng,
  w.capacity_kg, w.operating_hours, w.contact_phone, w.is_market_day_venue,
  w.market_day_of_week, w.is_active, w.created_at
`;

interface CapacityDbRow {
  warehouse_id: string;
  capacity_kg: string | null;
  used_kg: string;
  available_kg: string | null;
  utilization_percent: string | null;
}

export const warehousesRepo: WarehousesRepo = {
  async list(db, { filters, scope }): Promise<ListResult> {
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (filters.q !== undefined) {
      params.push(`%${filters.q}%`);
      conditions.push(`(w.name ILIKE $${params.length} OR w.code ILIKE $${params.length})`);
    }
    if (filters.type !== undefined) {
      params.push(filters.type);
      conditions.push(`w.type = $${params.length}`);
    }
    if (filters.isActive !== undefined) {
      params.push(filters.isActive);
      conditions.push(`w.is_active = $${params.length}`);
    }

    // Every table in db/migrations carries `deleted_at`; soft-deleted rows are
    // invisible to the API unless a story explicitly asks for them.
    conditions.push('w.deleted_at IS NULL');

    // Re-number the scope fragment so it continues this query's placeholders.
    const scoped = renumber(scope, params.length + 1);
    conditions.push(scoped.sql);
    params.push(...scoped.params);

    const where = conditions.length === 0 ? 'TRUE' : conditions.join(' AND ');

    const countResult = await db.query<{ total: string }>(
      `SELECT count(*)::text AS total FROM warehouses w WHERE ${where}`,
      params,
    );

    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;
    const rows = await db.query<WarehouseRow>(
      `SELECT ${SELECT_COLUMNS}
         FROM warehouses w
        WHERE ${where}
        ORDER BY w.code ASC
        LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      [...params, filters.pageSize, (filters.page - 1) * filters.pageSize],
    );

    return {
      items: rows.rows.map(toWarehouse),
      total: Number(countResult.rows[0]?.total ?? '0'),
    };
  },

  async findById(db, id, scope): Promise<WarehouseDetail | null> {
    const params: unknown[] = [id];
    const scoped = renumber(scope, 2);
    params.push(...scoped.params);

    const result = await db.query<WarehouseRow>(
      `SELECT ${SELECT_COLUMNS}
         FROM warehouses w
        WHERE w.id = $1 AND w.deleted_at IS NULL AND ${scoped.sql}
        LIMIT 1`,
      params,
    );

    const row = result.rows[0];
    return row === undefined ? null : toWarehouse(row);
  },

  async findCapacity(db, id, scope): Promise<WarehouseCapacityResponse | null> {
    const scoped = renumber(scope, 2);

    // `used` is a read-only derivation, not a rule: only ACTIVE batches count
    // (DEPLETED/EXPIRED/WRITTEN_OFF no longer occupy space) and all arithmetic
    // stays in NUMERIC so no float touches a quantity. Nothing is clamped, so
    // an over-capacity warehouse reports a negative `available`.
    const result = await db.query<CapacityDbRow>(
      `SELECT w.id AS warehouse_id,
              w.capacity_kg::text AS capacity_kg,
              used.kg::text AS used_kg,
              (w.capacity_kg - used.kg)::text AS available_kg,
              round(used.kg * 100 / w.capacity_kg, 2)::text AS utilization_percent
         FROM warehouses w
        CROSS JOIN LATERAL (
              SELECT COALESCE(SUM(b.qty_available), 0)::numeric(14,3) AS kg
                FROM inventory_batches b
               WHERE b.warehouse_id = w.id AND b.status = 'ACTIVE'
        ) used
        WHERE w.id = $1 AND w.deleted_at IS NULL AND ${scoped.sql}
        LIMIT 1`,
      [id, ...scoped.params],
    );

    const row = result.rows[0];
    if (row === undefined) return null;
    return {
      warehouseId: row.warehouse_id,
      capacityKg: row.capacity_kg,
      usedKg: row.used_kg,
      availableKg: row.available_kg,
      utilizationPercent: row.utilization_percent === null ? null : Number(row.utilization_percent),
    };
  },

  async lockCapacity(db, id, scope): Promise<CapacityRow | null> {
    const scoped = renumber(scope, 2);
    const result = await db.query<{ capacity_kg: string | null }>(
      `SELECT w.capacity_kg::text AS capacity_kg
         FROM warehouses w
        WHERE w.id = $1 AND w.deleted_at IS NULL AND ${scoped.sql}
        LIMIT 1
          FOR UPDATE OF w`,
      [id, ...scoped.params],
    );

    const row = result.rows[0];
    return row === undefined ? null : { capacityKg: row.capacity_kg };
  },

  async setCapacity(db, id, capacityKg): Promise<string> {
    const result = await db.query<{ capacity_kg: string }>(
      `UPDATE warehouses
          SET capacity_kg = $2::numeric, updated_at = now()
        WHERE id = $1
    RETURNING capacity_kg::text AS capacity_kg`,
      [id, capacityKg],
    );

    const row = result.rows[0];
    if (row === undefined) {
      throw new Error(`warehouse ${id} vanished between lockCapacity and setCapacity`);
    }
    return row.capacity_kg;
  },
};

/**
 * `scopedWhere` numbers its placeholders from a chosen start index. When a
 * query builds its own filters first, the fragment has to be shifted. Building
 * it with the right `startIndex` up front is preferred; this exists for the
 * cases where the count is only known later.
 */
function renumber(scope: ScopedWhere, startIndex: number): ScopedWhere {
  if (scope.params.length === 0) return scope;

  let next = startIndex;
  const sql = scope.sql.replace(/\$(\d+)/g, () => `$${next++}`);
  return { sql, params: scope.params, nextIndex: next };
}
