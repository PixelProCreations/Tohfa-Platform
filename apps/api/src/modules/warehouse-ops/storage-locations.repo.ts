/**
 * BR-79: SQL for storage locations. Every function takes an `Executor` so the service can join its
 * transaction; no authorization decision lives here (the service has already established that the
 * caller may reach the warehouse). Rows are mapped here, so snake_case never escapes this file.
 */
import type { Executor } from '../../db/pool.js';
import type {
  CreateStorageLocationBody,
  ListStorageLocationsQuery,
  StorageLocation,
  UpdateStorageLocationBody,
} from './storage-locations.schema.js';

interface Row {
  id: string;
  warehouse_id: string;
  code: string;
  name: string;
  location_type: string | null;
  capacity_kg: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
}

const COLUMNS = `
  id, warehouse_id, code, name, location_type, capacity_kg::text AS capacity_kg, is_active, created_at, updated_at
`;

function toLocation(row: Row): StorageLocation {
  return {
    id: row.id,
    warehouseId: row.warehouse_id,
    code: row.code,
    name: row.name,
    locationType: row.location_type,
    capacityKg: row.capacity_kg,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
  };
}

export interface StorageLocationsRepo {
  list(db: Executor, warehouseId: string, query: ListStorageLocationsQuery): Promise<{ items: StorageLocation[]; total: number }>;
  findById(db: Executor, warehouseId: string, id: string): Promise<StorageLocation | null>;
  /** Row-locks the location (the before image of an update). */
  lockById(db: Executor, warehouseId: string, id: string): Promise<StorageLocation | null>;
  /** Throws the raw pg unique violation (23505, `uq_storage_locations_code`) when the code is taken. */
  insert(db: Executor, warehouseId: string, body: CreateStorageLocationBody): Promise<StorageLocation>;
  update(db: Executor, id: string, patch: UpdateStorageLocationBody): Promise<StorageLocation>;
}

export const storageLocationsRepo: StorageLocationsRepo = {
  async list(db, warehouseId, query) {
    const params: unknown[] = [warehouseId];
    const conditions = ['warehouse_id = $1', 'deleted_at IS NULL'];
    if (query.q !== undefined) {
      params.push(`%${query.q}%`);
      const at = `$${params.length}`;
      conditions.push(`(code ILIKE ${at} OR name ILIKE ${at} OR location_type ILIKE ${at})`);
    }
    if (query.isActive !== undefined) {
      params.push(query.isActive);
      conditions.push(`is_active = $${params.length}`);
    }
    const where = conditions.join(' AND ');

    const count = await db.query<{ total: string }>(`SELECT count(*)::text AS total FROM storage_locations WHERE ${where}`, params);
    const rows = await db.query<Row>(
      `SELECT ${COLUMNS} FROM storage_locations WHERE ${where}
        ORDER BY lower(code), id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, query.pageSize, (query.page - 1) * query.pageSize],
    );
    return { items: rows.rows.map(toLocation), total: Number(count.rows[0]?.total ?? '0') };
  },

  async findById(db, warehouseId, id) {
    const result = await db.query<Row>(
      `SELECT ${COLUMNS} FROM storage_locations WHERE id = $1 AND warehouse_id = $2 AND deleted_at IS NULL`,
      [id, warehouseId],
    );
    const row = result.rows[0];
    return row === undefined ? null : toLocation(row);
  },

  async lockById(db, warehouseId, id) {
    const result = await db.query<Row>(
      `SELECT ${COLUMNS} FROM storage_locations WHERE id = $1 AND warehouse_id = $2 AND deleted_at IS NULL FOR UPDATE`,
      [id, warehouseId],
    );
    const row = result.rows[0];
    return row === undefined ? null : toLocation(row);
  },

  async insert(db, warehouseId, body) {
    const result = await db.query<Row>(
      `INSERT INTO storage_locations (warehouse_id, code, name, location_type, capacity_kg)
       VALUES ($1, $2, $3, $4, $5::numeric)
       RETURNING ${COLUMNS}`,
      [warehouseId, body.code, body.name, body.locationType ?? null, body.capacityKg ?? null],
    );
    return toLocation(result.rows[0]!);
  },

  async update(db, id, patch) {
    const sets: string[] = ['updated_at = now()'];
    const params: unknown[] = [id];
    const set = (column: string, value: unknown, cast = ''): void => {
      params.push(value);
      sets.push(`${column} = $${params.length}${cast}`);
    };
    if (patch.name !== undefined) set('name', patch.name);
    if (patch.locationType !== undefined) set('location_type', patch.locationType);
    if (patch.capacityKg !== undefined) set('capacity_kg', patch.capacityKg, '::numeric');
    if (patch.isActive !== undefined) set('is_active', patch.isActive);

    const result = await db.query<Row>(
      `UPDATE storage_locations SET ${sets.join(', ')} WHERE id = $1 RETURNING ${COLUMNS}`,
      params,
    );
    return toLocation(result.rows[0]!);
  },
};
