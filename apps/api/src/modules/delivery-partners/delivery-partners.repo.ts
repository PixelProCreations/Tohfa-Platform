import type { Executor } from '../../db/pool.js';

export interface DeliveryPartnerRecord {
  id: string;
  name: string;
  phone: string;
  vehicleRef: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt?: Date | null;
}

export interface DeliveryPartnersRepo {
  list(db: Executor, status?: 'active' | 'inactive' | 'all'): Promise<DeliveryPartnerRecord[]>;
  listActive(db: Executor): Promise<DeliveryPartnerRecord[]>;
  findById(db: Executor, id: string): Promise<DeliveryPartnerRecord | null>;
  create(
    db: Executor,
    params: { name: string; phone: string; vehicleRef?: string | null },
  ): Promise<DeliveryPartnerRecord>;
  update(
    db: Executor,
    id: string,
    params: { name?: string | undefined; phone?: string | undefined; vehicleRef?: string | null | undefined; isActive?: boolean | undefined },
  ): Promise<DeliveryPartnerRecord | null>;
  softDelete(db: Executor, id: string): Promise<boolean>;
}

export const deliveryPartnersRepo: DeliveryPartnersRepo = {
  async list(db, status = 'active') {
    let whereClause = 'deleted_at IS NULL';
    if (status === 'active') {
      whereClause += ' AND is_active = true';
    } else if (status === 'inactive') {
      whereClause += ' AND is_active = false';
    }
    const res = await db.query<{
      id: string;
      name: string;
      phone: string;
      vehicle_ref: string | null;
      is_active: boolean;
      created_at: Date;
      updated_at: Date | null;
    }>(
      `SELECT id, name, phone, vehicle_ref, is_active, created_at, updated_at
         FROM delivery_partners
        WHERE ${whereClause}
     ORDER BY name ASC`,
    );
    return res.rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      vehicleRef: r.vehicle_ref,
      isActive: r.is_active,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  async listActive(db) {
    return this.list(db, 'active');
  },

  async findById(db, id) {
    const res = await db.query<{
      id: string;
      name: string;
      phone: string;
      vehicle_ref: string | null;
      is_active: boolean;
      created_at: Date;
      updated_at: Date | null;
      deleted_at: Date | null;
    }>(
      `SELECT id, name, phone, vehicle_ref, is_active, created_at, updated_at, deleted_at
         FROM delivery_partners
        WHERE id = $1`,
      [id],
    );
    const r = res.rows[0];
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      vehicleRef: r.vehicle_ref,
      isActive: r.is_active,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      deletedAt: r.deleted_at,
    };
  },

  async create(db, params) {
    const res = await db.query<{
      id: string;
      name: string;
      phone: string;
      vehicle_ref: string | null;
      is_active: boolean;
      created_at: Date;
      updated_at: Date | null;
    }>(
      `INSERT INTO delivery_partners (name, phone, vehicle_ref, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING id, name, phone, vehicle_ref, is_active, created_at, updated_at`,
      [params.name, params.phone, params.vehicleRef ?? null],
    );
    const r = res.rows[0]!;
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      vehicleRef: r.vehicle_ref,
      isActive: r.is_active,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async update(db, id, params) {
    const sets: string[] = ['updated_at = now()'];
    const values: unknown[] = [id];
    let idx = 2;

    if (params.name !== undefined) {
      sets.push(`name = $${idx++}`);
      values.push(params.name);
    }
    if (params.phone !== undefined) {
      sets.push(`phone = $${idx++}`);
      values.push(params.phone);
    }
    if (params.vehicleRef !== undefined) {
      sets.push(`vehicle_ref = $${idx++}`);
      values.push(params.vehicleRef);
    }
    if (params.isActive !== undefined) {
      sets.push(`is_active = $${idx++}`);
      values.push(params.isActive);
    }

    const res = await db.query<{
      id: string;
      name: string;
      phone: string;
      vehicle_ref: string | null;
      is_active: boolean;
      created_at: Date;
      updated_at: Date | null;
    }>(
      `UPDATE delivery_partners
          SET ${sets.join(', ')}
        WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, name, phone, vehicle_ref, is_active, created_at, updated_at`,
      values,
    );
    const r = res.rows[0];
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      vehicleRef: r.vehicle_ref,
      isActive: r.is_active,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  },

  async softDelete(db, id) {
    const res = await db.query(
      `UPDATE delivery_partners
          SET is_active = false, deleted_at = now(), updated_at = now()
        WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id],
    );
    return (res.rowCount ?? 0) > 0;
  },
};
