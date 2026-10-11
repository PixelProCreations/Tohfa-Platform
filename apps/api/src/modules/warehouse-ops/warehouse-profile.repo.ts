/**
 * BR-80: SQL for the warehouse profile write. Only `contact_phone` and `operating_hours` are ever
 * written here; the full detail read reuses the existing warehouses repo.
 */
import type { Executor } from '../../db/pool.js';
import { warehousesRepo } from '../_example/warehouses.repo.js';
import type { WarehouseDetail } from '../_example/warehouses.schema.js';
import type { OperatingHours } from './warehouse-profile.schema.js';

export interface ProfileRow {
  contactPhone: string | null;
  operatingHours: unknown;
}

export interface ProfilePatch {
  contactPhone?: string | null;
  operatingHours?: OperatingHours | null;
}

export interface WarehouseProfileRepo {
  /** Row-locks the warehouse and returns the two editable columns (the before image). */
  lock(db: Executor, id: string): Promise<ProfileRow | null>;
  update(db: Executor, id: string, patch: ProfilePatch): Promise<void>;
  /** The full warehouse detail, same shape as GET /v1/warehouses/{id}. */
  findDetail(db: Executor, id: string): Promise<WarehouseDetail | null>;
}

export const warehouseProfileRepo: WarehouseProfileRepo = {
  async lock(db, id) {
    const result = await db.query<{ contact_phone: string | null; operating_hours: unknown }>(
      `SELECT contact_phone, operating_hours FROM warehouses WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
      [id],
    );
    const row = result.rows[0];
    return row === undefined ? null : { contactPhone: row.contact_phone, operatingHours: row.operating_hours };
  },

  async update(db, id, patch) {
    const sets: string[] = ['updated_at = now()'];
    const params: unknown[] = [id];
    if (patch.contactPhone !== undefined) {
      params.push(patch.contactPhone);
      sets.push(`contact_phone = $${params.length}`);
    }
    if (patch.operatingHours !== undefined) {
      params.push(patch.operatingHours === null ? null : JSON.stringify(patch.operatingHours));
      sets.push(`operating_hours = $${params.length}::jsonb`);
    }
    await db.query(`UPDATE warehouses SET ${sets.join(', ')} WHERE id = $1`, params);
  },

  // Visibility was settled by the service; the fragment is the unrestricted one.
  findDetail: (db, id) => warehousesRepo.findById(db, id, { sql: 'TRUE', params: [], nextIndex: 2 }),
};
