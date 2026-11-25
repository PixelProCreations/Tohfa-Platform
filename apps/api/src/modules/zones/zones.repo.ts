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

export interface PublicZoneRow {
  id: string;
  name: string;
  warehouseTown: string;
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
  listPublic(db: Executor): Promise<PublicZoneRow[]>;
  isActiveWarehouse(db: Executor, warehouseId: string): Promise<boolean>;
  countActiveFarmersInZone(db: Executor, zoneId: string): Promise<number>;
  createZone(
    db: Executor,
    data: { code: string; name: string; warehouseId: string | null; description: string | null; isActive: boolean },
  ): Promise<string>;
  updateZone(
    db: Executor,
    id: string,
    patch: {
      name?: string | undefined;
      warehouseId?: string | null | undefined;
      description?: string | null | undefined;
      isActive?: boolean | undefined;
    },
  ): Promise<boolean>;
  replaceZoneTaluks(db: Executor, zoneId: string, taluks: string[]): Promise<void>;
  transferFarmers(
    db: Executor,
    sourceZoneId: string,
    targetZoneId: string,
    farmerIds?: string[] | undefined,
  ): Promise<string[]>;
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

  async listPublic(db) {
    const query = `
      SELECT z.id,
             z.name,
             COALESCE(w.city, '') AS "warehouseTown"
        FROM zones z
        LEFT JOIN warehouses w ON w.id = z.warehouse_id
       WHERE z.is_active = true AND z.deleted_at IS NULL
       ORDER BY z.name ASC
    `;
    const result = await db.query<PublicZoneRow>(query);
    return result.rows;
  },

  async isActiveWarehouse(db, warehouseId) {
    const res = await db.query<{ ok: boolean }>(
      `SELECT true AS ok FROM warehouses WHERE id = $1 AND is_active = true AND deleted_at IS NULL LIMIT 1`,
      [warehouseId],
    );
    return res.rows.length > 0;
  },

  async countActiveFarmersInZone(db, zoneId) {
    const res = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM farmers WHERE zone_id = $1 AND deleted_at IS NULL`,
      [zoneId],
    );
    return Number(res.rows[0]?.count ?? 0);
  },

  async createZone(db, data) {
    const res = await db.query<{ id: string }>(
      `INSERT INTO zones (code, name, warehouse_id, description, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [data.code, data.name, data.warehouseId, data.description, data.isActive],
    );
    return res.rows[0]!.id;
  },

  async updateZone(db, id, patch) {
    const sets: string[] = [];
    const params: unknown[] = [id];
    if (patch.name !== undefined) {
      params.push(patch.name);
      sets.push(`name = $${params.length}`);
    }
    if ('warehouseId' in patch && patch.warehouseId !== undefined) {
      params.push(patch.warehouseId);
      sets.push(`warehouse_id = $${params.length}`);
    }
    if ('description' in patch && patch.description !== undefined) {
      params.push(patch.description);
      sets.push(`description = $${params.length}`);
    }
    if (patch.isActive !== undefined) {
      params.push(patch.isActive);
      sets.push(`is_active = $${params.length}`);
    }
    if (sets.length === 0) return true;
    sets.push('updated_at = now()');
    const res = await db.query(
      `UPDATE zones SET ${sets.join(', ')} WHERE id = $1 AND deleted_at IS NULL`,
      params,
    );
    return (res.rowCount ?? 0) > 0;
  },

  async replaceZoneTaluks(db, zoneId, taluks) {
    await db.query(`DELETE FROM zone_taluks WHERE zone_id = $1`, [zoneId]);
    for (const taluk of taluks) {
      await db.query(
        `INSERT INTO zone_taluks (zone_id, taluk) VALUES ($1, $2)`,
        [zoneId, taluk],
      );
    }
  },

  async transferFarmers(db, sourceZoneId, targetZoneId, farmerIds) {
    const params: unknown[] = [targetZoneId, sourceZoneId];
    let filterSql = '';
    if (farmerIds !== undefined && farmerIds.length > 0) {
      params.push(farmerIds);
      filterSql = ` AND id = ANY($3::uuid[])`;
    }
    const res = await db.query<{ id: string }>(
      `UPDATE farmers
          SET zone_id = $1,
              updated_at = now()
        WHERE zone_id = $2
          AND deleted_at IS NULL${filterSql}
        RETURNING id`,
      params,
    );
    return res.rows.map((r) => r.id);
  },
};
