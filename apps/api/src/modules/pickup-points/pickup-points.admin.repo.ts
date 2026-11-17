import type { Executor } from '../../db/pool.js';

export interface AdminPickupPointRow {
  id: string;
  name: string;
  address: string | null;
  public_phone: string | null;
  is_public: boolean;
  is_active: boolean;
  operating_hours: unknown;
}

/** A pre-built `scopedWhere(scope, { warehouseColumn: 'id', startIndex })` fragment. */
export interface ScopeFragment {
  sql: string;
  params: unknown[];
}

export interface PickupPointPatch {
  public_phone?: string | null;
  is_public?: boolean;
  operating_hours?: unknown;
}

const COLS = 'id, name, address, public_phone, is_public, is_active, operating_hours';

export interface AdminPickupPointsRepo {
  list(db: Executor, scope: ScopeFragment): Promise<AdminPickupPointRow[]>;
  lockOne(db: Executor, id: string, scope: ScopeFragment): Promise<AdminPickupPointRow | null>;
  update(db: Executor, id: string, patch: PickupPointPatch): Promise<AdminPickupPointRow>;
}

export const adminPickupPointsRepo: AdminPickupPointsRepo = {
  async list(db, scope) {
    const res = await db.query<AdminPickupPointRow>(
      `SELECT ${COLS} FROM warehouses WHERE deleted_at IS NULL AND (${scope.sql}) ORDER BY name`,
      scope.params,
    );
    return res.rows;
  },
  // Scope placeholders start at $2 ($1 is the id).
  async lockOne(db, id, scope) {
    const res = await db.query<AdminPickupPointRow>(
      `SELECT ${COLS} FROM warehouses WHERE id = $1 AND deleted_at IS NULL AND (${scope.sql}) FOR UPDATE`,
      [id, ...scope.params],
    );
    return res.rows[0] ?? null;
  },
  async update(db, id, patch) {
    const sets: string[] = [];
    const params: unknown[] = [id];
    if ('public_phone' in patch) {
      params.push(patch.public_phone);
      sets.push(`public_phone = $${params.length}`);
    }
    if ('is_public' in patch) {
      params.push(patch.is_public);
      sets.push(`is_public = $${params.length}`);
    }
    if ('operating_hours' in patch) {
      params.push(patch.operating_hours === null ? null : JSON.stringify(patch.operating_hours));
      sets.push(`operating_hours = $${params.length}::jsonb`);
    }
    const res = await db.query<AdminPickupPointRow>(
      `UPDATE warehouses SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING ${COLS}`,
      params,
    );
    return res.rows[0] as AdminPickupPointRow;
  },
};
