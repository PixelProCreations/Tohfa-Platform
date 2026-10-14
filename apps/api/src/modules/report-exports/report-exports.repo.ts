/**
 * Report exports (BR-76): SQL only, and every statement is a SELECT.
 *
 * The data itself is read by the report and finance repos, unchanged: an export must show exactly
 * the numbers the report endpoint it exports shows, so there is one set of SQL, not two. This repo
 * holds only what is new: the row cap and the warehouse code that names the file.
 */
import type { Executor } from '../../db/pool.js';

/** Returned when `export_max_rows` is missing or is not a non-negative integer. */
const DEFAULT_EXPORT_MAX_ROWS = 50000;

export interface ReportExportsRepo {
  /** `system_config.export_max_rows`, or 50000 when the row is missing or unusable. */
  getMaxRows(db: Executor): Promise<number>;
  /** The `warehouses.code` of an id, or null when there is no such warehouse. */
  findWarehouseCode(db: Executor, id: string): Promise<string | null>;
}

export const reportExportsRepo: ReportExportsRepo = {
  async getMaxRows(db) {
    const res = await db.query<{ value: unknown }>(`SELECT value FROM system_config WHERE key = 'export_max_rows' LIMIT 1`);
    const value = res.rows[0]?.value;
    const parsed =
      typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : DEFAULT_EXPORT_MAX_ROWS;
  },

  async findWarehouseCode(db, id) {
    const res = await db.query<{ code: string }>(`SELECT code FROM warehouses WHERE id = $1`, [id]);
    return res.rows[0]?.code ?? null;
  },
};
