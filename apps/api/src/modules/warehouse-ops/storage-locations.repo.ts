/**
 * BR-79 / BR-125: SQL for storage locations. Every function takes an `Executor` so the service can
 * join its transaction; no authorization decision lives here (the service has already established
 * that the caller may reach the warehouse). Rows are mapped here, so snake_case never escapes this
 * file.
 *
 * BR-125: the tree level and the usage figures are DERIVED in the read query itself, never stored
 * and never looked up per row: one recursive CTE walks the warehouse's locations from its roots
 * (level, and each node's path of ancestors), one aggregate reads the linked batches, and the
 * subtree roll-up joins every node to each of its ancestors through that path.
 */
import type { Executor } from '../../db/pool.js';
import { logger } from '../../logger.js';
import type {
  CreateStorageLocationBody,
  ListStorageLocationsQuery,
  StorageLocation,
  UpdateStorageLocationBody,
} from './storage-locations.schema.js';

/** BR-125: four tiers (levels 0-3), UNCONFIRMED. Used only when system_config has no usable row. */
export const FALLBACK_STORAGE_LOCATION_MAX_DEPTH = 4;

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
  parent_id: string | null;
  level: number;
  used_kg: string;
  batch_count: number;
  subtree_used_kg: string;
  subtree_batch_count: number;
}

/** What validating a new parent needs, read in one statement. */
export interface HierarchyFacts {
  /** null when no live location with that id exists in the warehouse. */
  parentIsActive: boolean | null;
  /** Level of the would-be parent (root = 0); null when it does not exist. */
  parentLevel: number | null;
  /** The would-be parent is the moved location itself or one of its descendants. */
  parentInSubtree: boolean;
  /** Levels below the moved location (0 for a leaf, or for a new location). */
  subtreeHeight: number;
}

/** What deactivating a location must check. */
export interface LocationUsage {
  activeChildCount: number;
  /** ACTIVE batches with qty_available > 0 linked directly to the location. */
  batchCount: number;
}

/** A location a batch may be placed in, as seen under a FOR SHARE lock. */
export interface PlaceableLocation {
  id: string;
  code: string;
  isActive: boolean;
}

/**
 * The read: the warehouse's tree, its linked-batch usage and the subtree roll-up, then the
 * location rows. `$1` is always the warehouse id; `where` may add conditions on `l`.
 *
 * Usage is the on-hand quantity (`qty_available`, maintained from the ledger) of ACTIVE batches
 * with stock: physical occupancy, so it deliberately does NOT subtract BR-100 cart holds or pending
 * counter sales, which are still on the shelf.
 */
function readSql(where: string, tail = ''): string {
  return `
    WITH RECURSIVE tree AS (
      SELECT r.id, 0 AS level, ARRAY[r.id] AS path
        FROM storage_locations r
       WHERE r.warehouse_id = $1 AND r.deleted_at IS NULL AND r.parent_id IS NULL
      UNION ALL
      SELECT c.id, t.level + 1, t.path || c.id
        FROM storage_locations c
        JOIN tree t ON c.parent_id = t.id
       WHERE c.deleted_at IS NULL
    ),
    placed AS (
      SELECT b.storage_location_id AS location_id, sum(b.qty_available) AS used, count(*)::int AS n
        FROM inventory_batches b
       WHERE b.warehouse_id = $1
         AND b.storage_location_id IS NOT NULL
         AND b.status = 'ACTIVE'
         AND b.qty_available > 0
       GROUP BY b.storage_location_id
    ),
    rollup AS (
      SELECT ancestor.id, sum(p.used) AS used, sum(p.n)::int AS n
        FROM tree d
        CROSS JOIN LATERAL unnest(d.path) AS ancestor(id)
        JOIN placed p ON p.location_id = d.id
       GROUP BY ancestor.id
    )
    SELECT l.id, l.warehouse_id, l.code, l.name, l.location_type, l.capacity_kg::text AS capacity_kg,
           l.is_active, l.created_at, l.updated_at, l.parent_id,
           COALESCE(t.level, 0) AS level,
           round(COALESCE(p.used, 0), 3)::text AS used_kg,
           COALESCE(p.n, 0) AS batch_count,
           round(COALESCE(r.used, 0), 3)::text AS subtree_used_kg,
           COALESCE(r.n, 0) AS subtree_batch_count
      FROM storage_locations l
      LEFT JOIN tree t ON t.id = l.id
      LEFT JOIN placed p ON p.location_id = l.id
      LEFT JOIN rollup r ON r.id = l.id
     WHERE l.warehouse_id = $1 AND l.deleted_at IS NULL AND ${where}
     ${tail}
  `;
}

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
    parentId: row.parent_id,
    level: Number(row.level),
    usedKg: row.used_kg,
    batchCount: Number(row.batch_count),
    subtreeUsedKg: row.subtree_used_kg,
    subtreeBatchCount: Number(row.subtree_batch_count),
  };
}

export interface StorageLocationsRepo {
  list(db: Executor, warehouseId: string, query: ListStorageLocationsQuery): Promise<{ items: StorageLocation[]; total: number }>;
  findById(db: Executor, warehouseId: string, id: string): Promise<StorageLocation | null>;
  /** Row-locks the location (the before image of an update), then reads it with its derived fields. */
  lockById(db: Executor, warehouseId: string, id: string): Promise<StorageLocation | null>;
  /** Throws the raw pg unique violation (23505, `uq_storage_locations_code`) when the code is taken. */
  insert(db: Executor, warehouseId: string, body: CreateStorageLocationBody): Promise<StorageLocation>;
  update(db: Executor, warehouseId: string, id: string, patch: UpdateStorageLocationBody): Promise<StorageLocation>;
  /** BR-125: serialises hierarchy changes of one warehouse (the same lock the cycle trigger takes). */
  lockHierarchy(db: Executor, warehouseId: string): Promise<void>;
  /** BR-125: the would-be parent (share-locked) and, for a move, the moved subtree's shape. */
  hierarchyFacts(db: Executor, warehouseId: string, movedId: string | null, parentId: string): Promise<HierarchyFacts>;
  /** BR-125: active children and placed batches of a location. */
  usage(db: Executor, warehouseId: string, id: string): Promise<LocationUsage>;
  /** BR-125: whether the location's parent (if any) is active; null when it has none. */
  parentIsActive(db: Executor, id: string): Promise<boolean | null>;
  /** BR-125: `system_config.storage_location_max_depth`, or the documented fallback (logged). */
  maxDepth(db: Executor): Promise<number>;
}

export const storageLocationsRepo: StorageLocationsRepo = {
  async list(db, warehouseId, query) {
    const params: unknown[] = [warehouseId];
    const conditions = ['TRUE'];
    if (query.q !== undefined) {
      params.push(`%${query.q}%`);
      const at = `$${params.length}`;
      conditions.push(`(l.code ILIKE ${at} OR l.name ILIKE ${at} OR l.location_type ILIKE ${at})`);
    }
    if (query.isActive !== undefined) {
      params.push(query.isActive);
      conditions.push(`l.is_active = $${params.length}`);
    }
    const where = conditions.join(' AND ');

    const count = await db.query<{ total: string }>(
      `SELECT count(*)::text AS total FROM storage_locations l WHERE l.warehouse_id = $1 AND l.deleted_at IS NULL AND ${where}`,
      params,
    );
    const rows = await db.query<Row>(
      readSql(where, `ORDER BY lower(l.code), l.id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`),
      [...params, query.pageSize, (query.page - 1) * query.pageSize],
    );
    return { items: rows.rows.map(toLocation), total: Number(count.rows[0]?.total ?? '0') };
  },

  async findById(db, warehouseId, id) {
    const result = await db.query<Row>(readSql('l.id = $2'), [warehouseId, id]);
    const row = result.rows[0];
    return row === undefined ? null : toLocation(row);
  },

  async lockById(db, warehouseId, id) {
    // The aggregate read cannot carry FOR UPDATE, so the row is locked first, then read.
    const locked = await db.query(
      `SELECT id FROM storage_locations WHERE id = $1 AND warehouse_id = $2 AND deleted_at IS NULL FOR UPDATE`,
      [id, warehouseId],
    );
    if (locked.rowCount === 0) return null;
    return storageLocationsRepo.findById(db, warehouseId, id);
  },

  async insert(db, warehouseId, body) {
    const result = await db.query<{ id: string }>(
      `INSERT INTO storage_locations (warehouse_id, code, name, location_type, capacity_kg, parent_id)
       VALUES ($1, $2, $3, $4, $5::numeric, $6)
       RETURNING id`,
      [warehouseId, body.code, body.name, body.locationType ?? null, body.capacityKg ?? null, body.parentId ?? null],
    );
    const created = await storageLocationsRepo.findById(db, warehouseId, result.rows[0]!.id);
    if (created === null) throw new Error('storage location vanished inside its own transaction');
    return created;
  },

  async update(db, warehouseId, id, patch) {
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
    if (patch.parentId !== undefined) set('parent_id', patch.parentId, '::uuid');

    await db.query(`UPDATE storage_locations SET ${sets.join(', ')} WHERE id = $1`, params);
    const updated = await storageLocationsRepo.findById(db, warehouseId, id);
    if (updated === null) throw new Error(`storage location ${id} vanished inside its own transaction`);
    return updated;
  },

  async lockHierarchy(db, warehouseId) {
    await db.query(`SELECT pg_advisory_xact_lock(hashtextextended('storage_location_tree:' || $1::text, 0))`, [warehouseId]);
  },

  async hierarchyFacts(db, warehouseId, movedId, parentId) {
    // The parent is share-locked so it cannot be deactivated while a child is being placed under it.
    await db.query(
      `SELECT id FROM storage_locations WHERE id = $1 AND warehouse_id = $2 AND deleted_at IS NULL FOR SHARE`,
      [parentId, warehouseId],
    );
    const result = await db.query<{
      parent_is_active: boolean | null;
      parent_level: number | null;
      parent_in_subtree: boolean;
      subtree_height: number;
    }>(
      `WITH RECURSIVE up AS (
         SELECT s.id, s.parent_id, 0 AS steps
           FROM storage_locations s
          WHERE s.id = $2 AND s.warehouse_id = $1 AND s.deleted_at IS NULL
         UNION ALL
         SELECT s.id, s.parent_id, up.steps + 1
           FROM storage_locations s
           JOIN up ON s.id = up.parent_id
          WHERE up.steps < 10000
       ),
       down AS (
         SELECT s.id, 0 AS depth
           FROM storage_locations s
          WHERE s.id = $3::uuid
         UNION ALL
         SELECT c.id, down.depth + 1
           FROM storage_locations c
           JOIN down ON c.parent_id = down.id
          WHERE c.deleted_at IS NULL AND down.depth < 10000
       )
       SELECT (SELECT s.is_active FROM storage_locations s
                WHERE s.id = $2 AND s.warehouse_id = $1 AND s.deleted_at IS NULL) AS parent_is_active,
              (SELECT max(steps) FROM up)::int AS parent_level,
              EXISTS (SELECT 1 FROM down WHERE down.id = $2) AS parent_in_subtree,
              COALESCE((SELECT max(depth) FROM down), 0)::int AS subtree_height`,
      [warehouseId, parentId, movedId],
    );
    const row = result.rows[0]!;
    return {
      parentIsActive: row.parent_is_active,
      parentLevel: row.parent_level === null ? null : Number(row.parent_level),
      parentInSubtree: row.parent_in_subtree,
      subtreeHeight: Number(row.subtree_height),
    };
  },

  async usage(db, warehouseId, id) {
    const result = await db.query<{ active_child_count: number; batch_count: number }>(
      `SELECT (SELECT count(*)::int FROM storage_locations c
                WHERE c.parent_id = $1 AND c.deleted_at IS NULL AND c.is_active) AS active_child_count,
              (SELECT count(*)::int FROM inventory_batches b
                WHERE b.storage_location_id = $1 AND b.warehouse_id = $2
                  AND b.status = 'ACTIVE' AND b.qty_available > 0) AS batch_count`,
      [id, warehouseId],
    );
    const row = result.rows[0]!;
    return { activeChildCount: Number(row.active_child_count), batchCount: Number(row.batch_count) };
  },

  async parentIsActive(db, id) {
    const result = await db.query<{ is_active: boolean }>(
      `SELECT p.is_active FROM storage_locations l JOIN storage_locations p ON p.id = l.parent_id WHERE l.id = $1 FOR SHARE OF p`,
      [id],
    );
    const row = result.rows[0];
    return row === undefined ? null : row.is_active;
  },

  async maxDepth(db) {
    const result = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'storage_location_max_depth' LIMIT 1`,
    );
    const value = result.rows[0]?.value;
    const parsed =
      typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
    if (Number.isSafeInteger(parsed) && parsed >= 1) return parsed;
    logger.warn(
      { key: 'storage_location_max_depth', fallback: FALLBACK_STORAGE_LOCATION_MAX_DEPTH },
      'system_config row missing or unusable; using the BR-125 fallback depth',
    );
    return FALLBACK_STORAGE_LOCATION_MAX_DEPTH;
  },
};

/**
 * BR-125: a live location of `warehouseId` that a batch may be placed in, share-locked so it cannot
 * be deactivated before the batch that names it commits. Shared by the quality check (BR-106) and
 * the transfer receipt (BR-126). null when no live location with that id is in the warehouse.
 */
export async function findPlaceableLocation(db: Executor, warehouseId: string, id: string): Promise<PlaceableLocation | null> {
  const result = await db.query<{ id: string; code: string; is_active: boolean }>(
    `SELECT id, code, is_active FROM storage_locations
      WHERE id = $1 AND warehouse_id = $2 AND deleted_at IS NULL
      FOR SHARE`,
    [id, warehouseId],
  );
  const row = result.rows[0];
  return row === undefined ? null : { id: row.id, code: row.code, isActive: row.is_active };
}
