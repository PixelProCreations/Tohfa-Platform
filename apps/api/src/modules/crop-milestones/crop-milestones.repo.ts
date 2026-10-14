import type { Executor } from '../../db/pool.js';
import type { MilestoneStatus, UpdateMilestoneBody } from './crop-milestones.schema.js';

export interface CropMilestoneRecord {
  id: string;
  farmerId: string;
  farmCropId: string;
  templateId: string | null;
  stageCode: string;
  stageName: string;
  sequenceOrder: number;
  status: MilestoneStatus;
  targetDate: string | null;
  completedOn: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CropMilestoneTemplateRecord {
  id: string;
  cropMasterId: string | null;
  stageCode: string;
  stageName: string;
  description: string | null;
  sequenceOrder: number;
  expectedDaysAfterPlanting: number | null;
}

export interface FarmCropBasicInfo {
  id: string;
  cropId: string;
  plantedOn: string | null;
}

interface CropMilestoneRow {
  id: string;
  farmer_id: string;
  farm_crop_id: string;
  template_id: string | null;
  stage_code: string;
  stage_name: string;
  sequence_order: number;
  status: string;
  target_date: string | null;
  completed_on: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date | null;
}

function mapRow(row: CropMilestoneRow): CropMilestoneRecord {
  return {
    id: row.id,
    farmerId: row.farmer_id,
    farmCropId: row.farm_crop_id,
    templateId: row.template_id,
    stageCode: row.stage_code,
    stageName: row.stage_name,
    sequenceOrder: Number(row.sequence_order),
    status: row.status as MilestoneStatus,
    targetDate: row.target_date !== null ? String(row.target_date).slice(0, 10) : null,
    completedOn: row.completed_on !== null ? String(row.completed_on).slice(0, 10) : null,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  };
}

export interface CropMilestonesRepo {
  lockFarmer(db: Executor, farmerId: string): Promise<void>;
  getFarmCropBasicInfo(db: Executor, farmerId: string, farmCropId: string): Promise<FarmCropBasicInfo | null>;
  listMilestonesForCrop(db: Executor, farmerId: string, farmCropId: string): Promise<CropMilestoneRecord[]>;
  findMilestoneById(
    db: Executor,
    farmerId: string,
    farmCropId: string,
    id: string,
  ): Promise<CropMilestoneRecord | null>;
  updateMilestone(
    db: Executor,
    farmerId: string,
    farmCropId: string,
    id: string,
    patch: UpdateMilestoneBody,
  ): Promise<CropMilestoneRecord | null>;
  listTemplates(db: Executor, cropMasterId?: string): Promise<CropMilestoneTemplateRecord[]>;
  insertMilestones(
    db: Executor,
    milestones: Array<{
      farmerId: string;
      farmCropId: string;
      templateId: string | null;
      stageCode: string;
      stageName: string;
      sequenceOrder: number;
      targetDate: string | null;
    }>,
  ): Promise<CropMilestoneRecord[]>;
}

export const cropMilestonesRepo: CropMilestonesRepo = {
  async lockFarmer(db, farmerId) {
    await db.query(`SELECT id FROM farmers WHERE id = $1 FOR UPDATE`, [farmerId]);
  },

  async getFarmCropBasicInfo(db, farmerId, farmCropId) {
    const result = await db.query<{ id: string; crop_id: string; planted_on: string | null }>(
      `SELECT fc.id, fc.crop_id, fc.planted_on::text
         FROM farm_crops fc
         JOIN plots p ON fc.plot_id = p.id
         JOIN farms f ON p.farm_id = f.id
        WHERE fc.id = $1
          AND f.farmer_id = $2
          AND fc.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND f.deleted_at IS NULL`,
      [farmCropId, farmerId],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      cropId: row.crop_id,
      plantedOn: row.planted_on !== null ? String(row.planted_on).slice(0, 10) : null,
    };
  },

  async listMilestonesForCrop(db, farmerId, farmCropId) {
    const result = await db.query<CropMilestoneRow>(
      `SELECT id, farmer_id, farm_crop_id, template_id, stage_code, stage_name,
              sequence_order, status, target_date::text, completed_on::text, notes,
              created_at, updated_at
         FROM farm_crop_milestones
        WHERE farmer_id = $1 AND farm_crop_id = $2 AND deleted_at IS NULL
     ORDER BY sequence_order ASC, created_at ASC`,
      [farmerId, farmCropId],
    );
    return result.rows.map(mapRow);
  },

  async findMilestoneById(db, farmerId, farmCropId, id) {
    const result = await db.query<CropMilestoneRow>(
      `SELECT id, farmer_id, farm_crop_id, template_id, stage_code, stage_name,
              sequence_order, status, target_date::text, completed_on::text, notes,
              created_at, updated_at
         FROM farm_crop_milestones
        WHERE id = $1 AND farmer_id = $2 AND farm_crop_id = $3 AND deleted_at IS NULL`,
      [id, farmerId, farmCropId],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  },

  async updateMilestone(db, farmerId, farmCropId, id, patch) {
    const sets: string[] = ['updated_at = now()'];
    const params: unknown[] = [id, farmerId, farmCropId];

    const addSet = (column: string, value: unknown) => {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    };

    if ('status' in patch && patch.status !== undefined) addSet('status', patch.status);
    if ('completedOn' in patch) addSet('completed_on', patch.completedOn ?? null);
    if ('targetDate' in patch) addSet('target_date', patch.targetDate ?? null);
    if ('notes' in patch) addSet('notes', patch.notes ?? null);

    const result = await db.query<CropMilestoneRow>(
      `UPDATE farm_crop_milestones
          SET ${sets.join(', ')}
        WHERE id = $1 AND farmer_id = $2 AND farm_crop_id = $3 AND deleted_at IS NULL
    RETURNING id, farmer_id, farm_crop_id, template_id, stage_code, stage_name,
              sequence_order, status, target_date::text, completed_on::text, notes,
              created_at, updated_at`,
      params,
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  },

  async listTemplates(db, cropMasterId) {
    let query = `
      SELECT id, crop_master_id, stage_code, stage_name, description,
             sequence_order, expected_days_after_planting
        FROM crop_milestone_templates
    `;
    const params: unknown[] = [];

    if (cropMasterId) {
      query += ` WHERE crop_master_id = $1 OR crop_master_id IS NULL `;
      params.push(cropMasterId);
    } else {
      query += ` WHERE crop_master_id IS NULL `;
    }

    query += ` ORDER BY sequence_order ASC, created_at ASC`;

    const result = await db.query<{
      id: string;
      crop_master_id: string | null;
      stage_code: string;
      stage_name: string;
      description: string | null;
      sequence_order: number;
      expected_days_after_planting: number | null;
    }>(query, params);

    return result.rows.map((r) => ({
      id: r.id,
      cropMasterId: r.crop_master_id,
      stageCode: r.stage_code,
      stageName: r.stage_name,
      description: r.description,
      sequenceOrder: Number(r.sequence_order),
      expectedDaysAfterPlanting: r.expected_days_after_planting !== null ? Number(r.expected_days_after_planting) : null,
    }));
  },

  async insertMilestones(db, milestones) {
    if (milestones.length === 0) return [];

    const inserted: CropMilestoneRecord[] = [];
    for (const m of milestones) {
      const res = await db.query<CropMilestoneRow>(
        `INSERT INTO farm_crop_milestones (
           farmer_id, farm_crop_id, template_id, stage_code, stage_name,
           sequence_order, target_date, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
         ON CONFLICT (farm_crop_id, stage_code) DO NOTHING
         RETURNING id, farmer_id, farm_crop_id, template_id, stage_code, stage_name,
                   sequence_order, status, target_date::text, completed_on::text, notes,
                   created_at, updated_at`,
        [
          m.farmerId,
          m.farmCropId,
          m.templateId,
          m.stageCode,
          m.stageName,
          m.sequenceOrder,
          m.targetDate,
        ],
      );
      const row = res.rows[0];
      if (row) inserted.push(mapRow(row));
    }
    return inserted;
  },
};
