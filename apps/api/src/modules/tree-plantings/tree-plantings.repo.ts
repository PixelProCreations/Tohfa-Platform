import type { Executor } from '../../db/pool.js';
import type { CreateTreePlantingBody } from './tree-plantings.schema.js';

export interface TreePlantingRecord {
  id: string;
  farmerId: string;
  farmId: string | null;
  plotId: string | null;
  speciesName: string;
  treeCount: number;
  plantedOn: string | null;
  zoneName: string | null;
  purpose: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface TreePlantingCursor {
  createdAt: string;
  id: string;
}

export type CreateTreePlantingData = CreateTreePlantingBody;

export interface UpdateTreePlantingPatch {
  farmId?: string | null | undefined;
  plotId?: string | null | undefined;
  speciesName?: string | undefined;
  treeCount?: number | undefined;
  plantedOn?: string | null | undefined;
  zoneName?: string | null | undefined;
  purpose?: string | null | undefined;
  notes?: string | null | undefined;
}

interface TreePlantingRow {
  id: string;
  farmer_id: string;
  farm_id: string | null;
  plot_id: string | null;
  species_name: string;
  tree_count: number;
  planted_on: string | null;
  zone_name: string | null;
  purpose: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date | null;
}

function mapRow(row: TreePlantingRow): TreePlantingRecord {
  return {
    id: row.id,
    farmerId: row.farmer_id,
    farmId: row.farm_id,
    plotId: row.plot_id,
    speciesName: row.species_name,
    treeCount: row.tree_count,
    plantedOn: row.planted_on !== null ? String(row.planted_on).slice(0, 10) : null,
    zoneName: row.zone_name,
    purpose: row.purpose,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  };
}

export interface TreePlantingsRepo {
  findTreePlantingById(db: Executor, farmerId: string, id: string): Promise<TreePlantingRecord | null>;
  listTreePlantings(
    db: Executor,
    farmerId: string,
    limit: number,
    cursor?: TreePlantingCursor,
  ): Promise<{ items: TreePlantingRecord[]; next: TreePlantingCursor | null }>;
  createTreePlanting(db: Executor, farmerId: string, data: CreateTreePlantingData): Promise<TreePlantingRecord>;
  updateTreePlanting(
    db: Executor,
    farmerId: string,
    id: string,
    patch: UpdateTreePlantingPatch,
  ): Promise<TreePlantingRecord | null>;
  softDeleteTreePlanting(db: Executor, farmerId: string, id: string): Promise<boolean>;
  checkFarmBelongsToFarmer(db: Executor, farmerId: string, farmId: string): Promise<boolean>;
  checkPlotBelongsToFarmer(db: Executor, farmerId: string, plotId: string): Promise<boolean>;
  lockFarmer(db: Executor, farmerId: string): Promise<void>;
}

export const treePlantingsRepo: TreePlantingsRepo = {
  async lockFarmer(db, farmerId) {
    await db.query(`SELECT id FROM farmers WHERE id = $1 FOR UPDATE`, [farmerId]);
  },

  async findTreePlantingById(db, farmerId, id) {
    const result = await db.query<TreePlantingRow>(
      `SELECT id, farmer_id, farm_id, plot_id, species_name, tree_count,
              planted_on::text, zone_name, purpose, notes, created_at, updated_at
         FROM tree_plantings
        WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL`,
      [id, farmerId],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  },

  async listTreePlantings(db, farmerId, limit, cursor) {
    const params: unknown[] = [farmerId, limit + 1];
    let cursorClause = '';

    if (cursor) {
      params.push(cursor.createdAt, cursor.id);
      cursorClause = 'AND (created_at, id) < ($3::timestamptz, $4::uuid)';
    }

    const result = await db.query<TreePlantingRow>(
      `SELECT id, farmer_id, farm_id, plot_id, species_name, tree_count,
              planted_on::text, zone_name, purpose, notes, created_at, updated_at
         FROM tree_plantings
        WHERE farmer_id = $1 AND deleted_at IS NULL
              ${cursorClause}
     ORDER BY created_at DESC, id DESC
        LIMIT $2`,
      params,
    );

    const hasMore = result.rows.length > limit;
    const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
    const items = rows.map(mapRow);

    let next: TreePlantingCursor | null = null;
    if (hasMore && items.length > 0) {
      const last = items[items.length - 1];
      if (last) {
        next = { createdAt: last.createdAt, id: last.id };
      }
    }

    return { items, next };
  },

  async createTreePlanting(db, farmerId, data) {
    const result = await db.query<TreePlantingRow>(
      `INSERT INTO tree_plantings (
         farmer_id, farm_id, plot_id, species_name, tree_count, planted_on, zone_name, purpose, notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, farmer_id, farm_id, plot_id, species_name, tree_count,
                 planted_on::text, zone_name, purpose, notes, created_at, updated_at`,
      [
        farmerId,
        data.farmId ?? null,
        data.plotId ?? null,
        data.speciesName,
        data.treeCount,
        data.plantedOn ?? null,
        data.zoneName ?? null,
        data.purpose ?? null,
        data.notes ?? null,
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error('INSERT failed to return row');
    return mapRow(row);
  },

  async updateTreePlanting(db, farmerId, id, patch) {
    const sets: string[] = ['updated_at = now()'];
    const params: unknown[] = [id, farmerId];

    const addSet = (column: string, value: unknown) => {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    };

    if ('farmId' in patch) addSet('farm_id', patch.farmId ?? null);
    if ('plotId' in patch) addSet('plot_id', patch.plotId ?? null);
    if ('speciesName' in patch && patch.speciesName !== undefined) addSet('species_name', patch.speciesName);
    if ('treeCount' in patch && patch.treeCount !== undefined) addSet('tree_count', patch.treeCount);
    if ('plantedOn' in patch) addSet('planted_on', patch.plantedOn ?? null);
    if ('zoneName' in patch) addSet('zone_name', patch.zoneName ?? null);
    if ('purpose' in patch) addSet('purpose', patch.purpose ?? null);
    if ('notes' in patch) addSet('notes', patch.notes ?? null);

    const result = await db.query<TreePlantingRow>(
      `UPDATE tree_plantings
          SET ${sets.join(', ')}
        WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL
    RETURNING id, farmer_id, farm_id, plot_id, species_name, tree_count,
              planted_on::text, zone_name, purpose, notes, created_at, updated_at`,
      params,
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  },

  async softDeleteTreePlanting(db, farmerId, id) {
    const result = await db.query(
      `UPDATE tree_plantings
          SET deleted_at = now()
        WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL`,
      [id, farmerId],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async checkFarmBelongsToFarmer(db, farmerId, farmId) {
    const result = await db.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM farms WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL
       ) AS exists`,
      [farmId, farmerId],
    );
    return result.rows[0]?.exists ?? false;
  },

  async checkPlotBelongsToFarmer(db, farmerId, plotId) {
    const result = await db.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM plots p
           JOIN farms f ON p.farm_id = f.id
          WHERE p.id = $1 AND f.farmer_id = $2 AND p.deleted_at IS NULL AND f.deleted_at IS NULL
        ) AS exists`,
      [plotId, farmerId],
    );
    return result.rows[0]?.exists ?? false;
  },
};
