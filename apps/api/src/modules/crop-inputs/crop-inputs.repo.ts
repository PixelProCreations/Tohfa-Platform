import type { Executor } from '../../db/pool.js';
import type {
  CreateCropInputBody,
  InputType,
  InputUnit,
  UpdateCropInputBody,
} from './crop-inputs.schema.js';

export interface CropInputRecord {
  id: string;
  farmerId: string;
  farmCropId: string;
  inputType: InputType;
  inputName: string;
  appliedOn: string;
  quantity: number;
  unit: InputUnit;
  nitrogenPct: number | null;
  phosphorusPct: number | null;
  potassiumPct: number | null;
  applicationMethod: string | null;
  costInr: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CropInputCursor {
  createdAt: string;
  id: string;
}

interface CropInputRow {
  id: string;
  farmer_id: string;
  farm_crop_id: string;
  input_type: string;
  input_name: string;
  applied_on: string;
  quantity: string | number;
  unit: string;
  nitrogen_pct: string | number | null;
  phosphorus_pct: string | number | null;
  potassium_pct: string | number | null;
  application_method: string | null;
  cost_inr: string | number | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date | null;
}

function mapRow(row: CropInputRow): CropInputRecord {
  return {
    id: row.id,
    farmerId: row.farmer_id,
    farmCropId: row.farm_crop_id,
    inputType: row.input_type as InputType,
    inputName: row.input_name,
    appliedOn: String(row.applied_on).slice(0, 10),
    quantity: Number(row.quantity),
    unit: row.unit as InputUnit,
    nitrogenPct: row.nitrogen_pct !== null ? Number(row.nitrogen_pct) : null,
    phosphorusPct: row.phosphorus_pct !== null ? Number(row.phosphorus_pct) : null,
    potassiumPct: row.potassium_pct !== null ? Number(row.potassium_pct) : null,
    applicationMethod: row.application_method,
    costInr: row.cost_inr !== null ? Number(row.cost_inr) : null,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  };
}

export interface CropInputsRepo {
  lockFarmer(db: Executor, farmerId: string): Promise<void>;
  checkFarmCropBelongsToFarmer(db: Executor, farmerId: string, farmCropId: string): Promise<boolean>;
  findCropInputById(
    db: Executor,
    farmerId: string,
    farmCropId: string,
    id: string,
  ): Promise<CropInputRecord | null>;
  listCropInputs(
    db: Executor,
    farmerId: string,
    farmCropId: string,
    limit: number,
    cursor?: CropInputCursor,
  ): Promise<{ items: CropInputRecord[]; next: CropInputCursor | null }>;
  createCropInput(
    db: Executor,
    farmerId: string,
    farmCropId: string,
    data: CreateCropInputBody,
  ): Promise<CropInputRecord>;
  updateCropInput(
    db: Executor,
    farmerId: string,
    farmCropId: string,
    id: string,
    patch: UpdateCropInputBody,
  ): Promise<CropInputRecord | null>;
  softDeleteCropInput(
    db: Executor,
    farmerId: string,
    farmCropId: string,
    id: string,
  ): Promise<boolean>;
  getAllActiveInputsForCrop(
    db: Executor,
    farmerId: string,
    farmCropId: string,
  ): Promise<CropInputRecord[]>;
}

export const cropInputsRepo: CropInputsRepo = {
  async lockFarmer(db, farmerId) {
    await db.query(`SELECT id FROM farmers WHERE id = $1 FOR UPDATE`, [farmerId]);
  },

  async checkFarmCropBelongsToFarmer(db, farmerId, farmCropId) {
    const result = await db.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1
           FROM farm_crops fc
           JOIN plots p ON fc.plot_id = p.id
           JOIN farms f ON p.farm_id = f.id
          WHERE fc.id = $1
            AND f.farmer_id = $2
            AND fc.deleted_at IS NULL
            AND p.deleted_at IS NULL
            AND f.deleted_at IS NULL
       ) AS exists`,
      [farmCropId, farmerId],
    );
    return result.rows[0]?.exists ?? false;
  },

  async findCropInputById(db, farmerId, farmCropId, id) {
    const result = await db.query<CropInputRow>(
      `SELECT id, farmer_id, farm_crop_id, input_type, input_name,
              applied_on::text, quantity, unit, nitrogen_pct, phosphorus_pct,
              potassium_pct, application_method, cost_inr, notes,
              created_at, updated_at
         FROM crop_inputs
        WHERE id = $1 AND farmer_id = $2 AND farm_crop_id = $3 AND deleted_at IS NULL`,
      [id, farmerId, farmCropId],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  },

  async listCropInputs(db, farmerId, farmCropId, limit, cursor) {
    const params: unknown[] = [farmerId, farmCropId, limit + 1];
    let cursorClause = '';

    if (cursor) {
      params.push(cursor.createdAt, cursor.id);
      cursorClause = 'AND (created_at, id) < ($4::timestamptz, $5::uuid)';
    }

    const result = await db.query<CropInputRow>(
      `SELECT id, farmer_id, farm_crop_id, input_type, input_name,
              applied_on::text, quantity, unit, nitrogen_pct, phosphorus_pct,
              potassium_pct, application_method, cost_inr, notes,
              created_at, updated_at
         FROM crop_inputs
        WHERE farmer_id = $1 AND farm_crop_id = $2 AND deleted_at IS NULL
              ${cursorClause}
     ORDER BY created_at DESC, id DESC
        LIMIT $3`,
      params,
    );

    const hasMore = result.rows.length > limit;
    const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
    const items = rows.map(mapRow);

    let next: CropInputCursor | null = null;
    if (hasMore && items.length > 0) {
      const last = items[items.length - 1];
      if (last) {
        next = { createdAt: last.createdAt, id: last.id };
      }
    }

    return { items, next };
  },

  async createCropInput(db, farmerId, farmCropId, data) {
    const result = await db.query<CropInputRow>(
      `INSERT INTO crop_inputs (
         farmer_id, farm_crop_id, input_type, input_name, applied_on,
         quantity, unit, nitrogen_pct, phosphorus_pct, potassium_pct,
         application_method, cost_inr, notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, farmer_id, farm_crop_id, input_type, input_name,
                 applied_on::text, quantity, unit, nitrogen_pct, phosphorus_pct,
                 potassium_pct, application_method, cost_inr, notes,
                 created_at, updated_at`,
      [
        farmerId,
        farmCropId,
        data.inputType,
        data.inputName,
        data.appliedOn,
        data.quantity,
        data.unit,
        data.nitrogenPct ?? null,
        data.phosphorusPct ?? null,
        data.potassiumPct ?? null,
        data.applicationMethod ?? null,
        data.costInr ?? null,
        data.notes ?? null,
      ],
    );
    const row = result.rows[0];
    if (!row) throw new Error('INSERT failed to return row');
    return mapRow(row);
  },

  async updateCropInput(db, farmerId, farmCropId, id, patch) {
    const sets: string[] = ['updated_at = now()'];
    const params: unknown[] = [id, farmerId, farmCropId];

    const addSet = (column: string, value: unknown) => {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    };

    if ('inputType' in patch && patch.inputType !== undefined) addSet('input_type', patch.inputType);
    if ('inputName' in patch && patch.inputName !== undefined) addSet('input_name', patch.inputName);
    if ('appliedOn' in patch && patch.appliedOn !== undefined) addSet('applied_on', patch.appliedOn);
    if ('quantity' in patch && patch.quantity !== undefined) addSet('quantity', patch.quantity);
    if ('unit' in patch && patch.unit !== undefined) addSet('unit', patch.unit);
    if ('nitrogenPct' in patch) addSet('nitrogen_pct', patch.nitrogenPct ?? null);
    if ('phosphorusPct' in patch) addSet('phosphorus_pct', patch.phosphorusPct ?? null);
    if ('potassiumPct' in patch) addSet('potassium_pct', patch.potassiumPct ?? null);
    if ('applicationMethod' in patch) addSet('application_method', patch.applicationMethod ?? null);
    if ('costInr' in patch) addSet('cost_inr', patch.costInr ?? null);
    if ('notes' in patch) addSet('notes', patch.notes ?? null);

    const result = await db.query<CropInputRow>(
      `UPDATE crop_inputs
          SET ${sets.join(', ')}
        WHERE id = $1 AND farmer_id = $2 AND farm_crop_id = $3 AND deleted_at IS NULL
    RETURNING id, farmer_id, farm_crop_id, input_type, input_name,
              applied_on::text, quantity, unit, nitrogen_pct, phosphorus_pct,
              potassium_pct, application_method, cost_inr, notes,
              created_at, updated_at`,
      params,
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  },

  async softDeleteCropInput(db, farmerId, farmCropId, id) {
    const result = await db.query(
      `UPDATE crop_inputs
          SET deleted_at = now()
        WHERE id = $1 AND farmer_id = $2 AND farm_crop_id = $3 AND deleted_at IS NULL`,
      [id, farmerId, farmCropId],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async getAllActiveInputsForCrop(db, farmerId, farmCropId) {
    const result = await db.query<CropInputRow>(
      `SELECT id, farmer_id, farm_crop_id, input_type, input_name,
              applied_on::text, quantity, unit, nitrogen_pct, phosphorus_pct,
              potassium_pct, application_method, cost_inr, notes,
              created_at, updated_at
         FROM crop_inputs
        WHERE farmer_id = $1 AND farm_crop_id = $2 AND deleted_at IS NULL
     ORDER BY applied_on ASC, created_at ASC`,
      [farmerId, farmCropId],
    );
    return result.rows.map(mapRow);
  },
};
