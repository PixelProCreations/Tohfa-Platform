/**
 * Customer delivery addresses — SQL only. Every statement is keyed on BOTH the
 * address id and the owning customer_id, so a guessed id belonging to another
 * customer simply matches no row (BR-36, BR-160).
 */
import type { Executor } from '../../db/pool.js';
import type { CustomerAddress, UpdateAddressBody } from './customer-addresses.schema.js';

export interface NewAddress {
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  district: string | null;
  state: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
  landmark: string | null;
  contactPhone: string | null;
  nearestPickupPointId: string | null;
}

export interface CustomerAddressesRepo {
  /** True when the id is a live, active warehouse (pickup point). */
  pickupPointExists(db: Executor, warehouseId: string): Promise<boolean>;
  list(db: Executor, customerId: string): Promise<CustomerAddress[]>;
  findOwn(db: Executor, customerId: string, addressId: string): Promise<CustomerAddress | null>;
  countLive(db: Executor, customerId: string): Promise<number>;
  insert(db: Executor, customerId: string, address: NewAddress): Promise<CustomerAddress>;
  update(
    db: Executor,
    customerId: string,
    addressId: string,
    patch: UpdateAddressBody,
  ): Promise<CustomerAddress | null>;
  softDelete(db: Executor, customerId: string, addressId: string): Promise<boolean>;
  /** Clears is_default on every live address of the customer (before setting a new one). */
  clearDefault(db: Executor, customerId: string): Promise<void>;
  markDefault(db: Executor, customerId: string, addressId: string): Promise<void>;
  /** Mirrors customers.default_address_id; null clears it. */
  setCustomerDefault(db: Executor, customerId: string, addressId: string | null): Promise<void>;
}

const COLUMNS = `
  a.id, a.label, a.line1, a.line2, a.city, a.district, a.state, a.pincode,
  a.lat::float8 AS lat, a.lng::float8 AS lng,
  a.landmark, a.contact_phone AS "contactPhone", a.nearest_pickup_point_id AS "nearestPickupPointId",
  a.is_default AS "isDefault",
  a.created_at AS "createdAt", a.updated_at AS "updatedAt"`;

interface Row extends Omit<CustomerAddress, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date | null;
}

function toAddress(row: Row): CustomerAddress {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}

const PATCH_COLUMNS: Record<keyof UpdateAddressBody, string> = {
  label: 'label',
  line1: 'line1',
  line2: 'line2',
  city: 'city',
  district: 'district',
  state: 'state',
  pincode: 'pincode',
  lat: 'lat',
  lng: 'lng',
  landmark: 'landmark',
  contactPhone: 'contact_phone',
  nearestPickupPointId: 'nearest_pickup_point_id',
};

export const customerAddressesRepo: CustomerAddressesRepo = {
  async pickupPointExists(db, warehouseId) {
    const res = await db.query(
      `SELECT 1 FROM warehouses WHERE id = $1 AND is_active AND deleted_at IS NULL`,
      [warehouseId],
    );
    return (res.rowCount ?? 0) > 0;
  },

  async list(db, customerId) {
    const res = await db.query<Row>(
      `SELECT ${COLUMNS}
         FROM customer_addresses a
        WHERE a.customer_id = $1 AND a.deleted_at IS NULL
        ORDER BY a.is_default DESC, a.created_at ASC`,
      [customerId],
    );
    return res.rows.map(toAddress);
  },

  async findOwn(db, customerId, addressId) {
    const res = await db.query<Row>(
      `SELECT ${COLUMNS}
         FROM customer_addresses a
        WHERE a.id = $1 AND a.customer_id = $2 AND a.deleted_at IS NULL`,
      [addressId, customerId],
    );
    const row = res.rows[0];
    return row ? toAddress(row) : null;
  },

  async countLive(db, customerId) {
    const res = await db.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM customer_addresses
        WHERE customer_id = $1 AND deleted_at IS NULL`,
      [customerId],
    );
    return res.rows[0]?.n ?? 0;
  },

  async insert(db, customerId, a) {
    const res = await db.query<Row>(
      `INSERT INTO customer_addresses AS a
              (customer_id, label, line1, line2, city, district, state, pincode, lat, lng,
               landmark, contact_phone, nearest_pickup_point_id, geom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::numeric, $10::numeric, $11, $12, $13,
               CASE WHEN $9::numeric IS NULL THEN NULL
                    ELSE ST_SetSRID(ST_MakePoint(($10::numeric)::float8, ($9::numeric)::float8), 4326)::geography END)
       RETURNING ${COLUMNS}`,
      [customerId, a.label, a.line1, a.line2, a.city, a.district, a.state, a.pincode, a.lat, a.lng,
        a.landmark, a.contactPhone, a.nearestPickupPointId],
    );
    return toAddress(res.rows[0]!);
  },

  async update(db, customerId, addressId, patch) {
    const sets: string[] = [];
    const params: unknown[] = [addressId, customerId];
    const position: Partial<Record<keyof UpdateAddressBody, number>> = {};
    for (const [key, column] of Object.entries(PATCH_COLUMNS) as Array<[keyof UpdateAddressBody, string]>) {
      if (patch[key] !== undefined) {
        params.push(patch[key]);
        position[key] = params.length;
        sets.push(`${column} = $${params.length}${key === 'lat' || key === 'lng' ? '::numeric' : ''}`);
      }
    }
    // The schema only lets lat and lng change together, so both positions exist here.
    if (position.lat !== undefined && position.lng !== undefined) {
      sets.push(
        `geom = CASE WHEN $${position.lat}::numeric IS NULL THEN NULL
                     ELSE ST_SetSRID(ST_MakePoint(($${position.lng}::numeric)::float8, ($${position.lat}::numeric)::float8), 4326)::geography END`,
      );
    }
    const res = await db.query<Row>(
      `UPDATE customer_addresses AS a
          SET ${sets.join(', ')}, updated_at = now()
        WHERE a.id = $1 AND a.customer_id = $2 AND a.deleted_at IS NULL
       RETURNING ${COLUMNS}`,
      params,
    );
    const row = res.rows[0];
    return row ? toAddress(row) : null;
  },

  async softDelete(db, customerId, addressId) {
    const res = await db.query(
      `UPDATE customer_addresses
          SET deleted_at = now(), is_default = false, updated_at = now()
        WHERE id = $1 AND customer_id = $2 AND deleted_at IS NULL`,
      [addressId, customerId],
    );
    return (res.rowCount ?? 0) > 0;
  },

  async clearDefault(db, customerId) {
    await db.query(
      `UPDATE customer_addresses SET is_default = false, updated_at = now()
        WHERE customer_id = $1 AND is_default AND deleted_at IS NULL`,
      [customerId],
    );
  },

  async markDefault(db, customerId, addressId) {
    await db.query(
      `UPDATE customer_addresses SET is_default = true, updated_at = now()
        WHERE id = $1 AND customer_id = $2 AND deleted_at IS NULL`,
      [addressId, customerId],
    );
  },

  async setCustomerDefault(db, customerId, addressId) {
    await db.query(
      `UPDATE customers SET default_address_id = $2, updated_at = now() WHERE id = $1`,
      [customerId, addressId],
    );
  },
};
