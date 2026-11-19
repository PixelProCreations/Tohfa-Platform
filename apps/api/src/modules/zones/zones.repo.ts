import type { Executor } from '../../db/pool.js';

export interface ZoneListRow {
  id: string;
  code: string;
  name: string;
  warehouseId: string | null;
  warehouseName: string | null;
  description: string | null;
  taluks: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface ZoneDetailRow extends ZoneListRow {
  manager: {
    userId: string;
    fullName: string;
    mobile: string;
  } | null;
}

export interface ZonesListFilter {
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL' | undefined;
  warehouseId?: string | undefined;
  zoneIds?: string[] | undefined;
}

export interface ZonesRepo {
  list(db: Executor, filter: ZonesListFilter): Promise<ZoneListRow[]>;
  findById(db: Executor, id: string): Promise<ZoneDetailRow | null>;
}

export const zonesRepo: ZonesRepo = {
  async list(db, filter) {
    const conditions: string[] = ['z.deleted_at IS NULL'];
    const values: unknown[] = [];

    if (filter.status === 'ACTIVE') {
      conditions.push('z.is_active = true');
    } else if (filter.status === 'INACTIVE') {
      conditions.push('z.is_active = false');
    }

    if (filter.warehouseId !== undefined) {
      values.push(filter.warehouseId);
      conditions.push(`z.warehouse_id = $${values.length}`);
    }

    if (filter.zoneIds !== undefined) {
      values.push(filter.zoneIds);
      conditions.push(`z.id = ANY($${values.length}::uuid[])`);
    }

    const whereClause = conditions.join(' AND ');
    const query = `
      SELECT z.id,
             z.code,
             z.name,
             z.warehouse_id AS "warehouseId",
             w.name AS "warehouseName",
             z.description,
             z.is_active AS "isActive",
             z.created_at AS "createdAt",
             COALESCE(array_agg(zt.taluk ORDER BY zt.taluk) FILTER (WHERE zt.taluk IS NOT NULL), '{}') AS taluks
        FROM zones z
        LEFT JOIN warehouses w ON w.id = z.warehouse_id
        LEFT JOIN zone_taluks zt ON zt.zone_id = z.id
       WHERE ${whereClause}
       GROUP BY z.id, w.name
       ORDER BY z.name ASC
    `;

    const result = await db.query<ZoneListRow>(query, values);
    return result.rows;
  },

  async findById(db, id) {
    const query = `
      SELECT z.id,
             z.code,
             z.name,
             z.warehouse_id AS "warehouseId",
             w.name AS "warehouseName",
             z.description,
             z.is_active AS "isActive",
             z.created_at AS "createdAt",
             COALESCE(array_agg(zt.taluk ORDER BY zt.taluk) FILTER (WHERE zt.taluk IS NOT NULL), '{}') AS taluks
        FROM zones z
        LEFT JOIN warehouses w ON w.id = z.warehouse_id
        LEFT JOIN zone_taluks zt ON zt.zone_id = z.id
       WHERE z.id = $1 AND z.deleted_at IS NULL
       GROUP BY z.id, w.name
    `;

    const zoneResult = await db.query<ZoneListRow>(query, [id]);
    const zone = zoneResult.rows[0];
    if (zone === undefined) {
      return null;
    }

    const managerQuery = `
      SELECT u.id AS "userId",
             u.full_name AS "fullName",
             u.mobile
        FROM user_roles ur
        JOIN users u ON u.id = ur.user_id
       WHERE ur.role_code = 'FARMER_ADMIN'
         AND ur.zone_id = $1
         AND ur.valid_to IS NULL
         AND u.status = 'ACTIVE'
         AND u.deleted_at IS NULL
       ORDER BY ur.created_at ASC
       LIMIT 1
    `;

    const managerResult = await db.query<{ userId: string; fullName: string; mobile: string }>(managerQuery, [id]);
    const manager = managerResult.rows[0] ?? null;

    return {
      ...zone,
      manager,
    };
  },
};
