import type { Executor } from '../../db/pool.js';

export interface ServedPincodeRow {
  pincode: string;
  warehouse_id: string | null;
  delivery_available: boolean;
}

export interface AreaRequestRow {
  id: string;
  area: string;
  locality: string;
  city: string;
  pincode: string | null;
  contact: string | null;
  customer_id: string | null;
  status: 'NEW' | 'REVIEWED' | 'SERVED' | 'DECLINED';
  created_at: Date;
}

export interface InsertAreaRequest {
  requesterKey: string;
  areaKey: string;
  customerId: string | null;
  area: string;
  locality: string;
  city: string;
  pincode: string | null;
  contact: string | null;
}

export interface ServiceabilityRepo {
  /** Active served pincode whose warehouse (when set) is still a public pickup point. */
  getServedPincode(db: Executor, pincode: string): Promise<ServedPincodeRow | null>;
  getNumberConfig(db: Executor, key: string): Promise<unknown>;
  /** Idempotent per (requester, area): `created` is false when the row already existed. */
  insertAreaRequest(db: Executor, r: InsertAreaRequest): Promise<{ row: AreaRequestRow; created: boolean }>;
  listAreaRequests(db: Executor, status: string | undefined, limit: number): Promise<AreaRequestRow[]>;
}

const COLS = 'id, area, locality, city, pincode, contact, customer_id, status, created_at';

export const serviceabilityRepo: ServiceabilityRepo = {
  async getServedPincode(db, pincode) {
    const res = await db.query<ServedPincodeRow>(
      `SELECT sp.pincode, sp.warehouse_id, sp.delivery_available
         FROM served_pincodes sp
         LEFT JOIN warehouses w ON w.id = sp.warehouse_id
        WHERE sp.pincode = $1 AND sp.is_active
          AND (sp.warehouse_id IS NULL OR (w.is_public AND w.is_active AND w.deleted_at IS NULL))`,
      [pincode],
    );
    return res.rows[0] ?? null;
  },

  async getNumberConfig(db, key) {
    const res = await db.query<{ value: unknown }>('SELECT value FROM system_config WHERE key = $1', [key]);
    return res.rows[0]?.value ?? null;
  },

  async insertAreaRequest(db, r) {
    const ins = await db.query<AreaRequestRow>(
      `INSERT INTO service_area_requests (requester_key, area_key, customer_id, area, locality, city, pincode, contact)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (requester_key, area_key) DO NOTHING
       RETURNING ${COLS}`,
      [r.requesterKey, r.areaKey, r.customerId, r.area, r.locality, r.city, r.pincode, r.contact],
    );
    if (ins.rows[0] !== undefined) return { row: ins.rows[0], created: true };
    const existing = await db.query<AreaRequestRow>(
      `SELECT ${COLS} FROM service_area_requests WHERE requester_key = $1 AND area_key = $2`,
      [r.requesterKey, r.areaKey],
    );
    return { row: existing.rows[0] as AreaRequestRow, created: false };
  },

  async listAreaRequests(db, status, limit) {
    const res = await db.query<AreaRequestRow>(
      `SELECT ${COLS} FROM service_area_requests
        WHERE ($1::text IS NULL OR status = $1)
        ORDER BY created_at DESC, id DESC
        LIMIT $2`,
      [status ?? null, limit],
    );
    return res.rows;
  },
};
