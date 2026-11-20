import type { Executor } from '../../db/pool.js';

export interface PickupPointRow {
  id: string;
  name: string;
  address: string | null;
  public_phone: string | null;
  operating_hours: unknown;
  lat: string | null;
  lng: string | null;
}

export interface PickupPointsRepo {
  listPublic(db: Executor): Promise<PickupPointRow[]>;
}

export const pickupPointsRepo: PickupPointsRepo = {
  async listPublic(db) {
    // Explicit column list: capacity, contact_phone, code, type etc. are never selected.
    const res = await db.query<PickupPointRow>(
      `SELECT id, name, address, public_phone, operating_hours, lat::text AS lat, lng::text AS lng
         FROM warehouses
        WHERE is_public AND is_active AND deleted_at IS NULL
        ORDER BY name`,
    );
    return res.rows;
  },
};
