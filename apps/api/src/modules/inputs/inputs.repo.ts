import type { Executor } from '../../db/pool.js';
import type { AdminInputResponse, InputStatus, SupportingDoc } from './inputs.schema.js';

export interface InputCursor {
  createdAt: string;
  id: string;
}

export interface ListInputsFilter {
  status?: InputStatus | undefined;
  category?: string | undefined;
  search?: string | undefined;
  cursor?: InputCursor | undefined;
  limit: number;
}

interface InputRow {
  id: string;
  code: string;
  name: string;
  category: string;
  subcategory: string | null;
  farming_type: string | null;
  manufacturer: string;
  registration_id: string | null;
  composition: string | null;
  applicable_crops: string[];
  dosage: string | null;
  application_method: string | null;
  status: InputStatus;
  reference_note: string | null;
  status_reason: string | null;
  supporting_docs: unknown;
  approved_by: string | null;
  approved_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  created_at_cursor: string;
  updated_at: Date;
}

function toInputRecord(row: InputRow): AdminInputResponse {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    farmingType: row.farming_type,
    manufacturer: row.manufacturer,
    registrationId: row.registration_id,
    composition: row.composition,
    applicableCrops: row.applicable_crops ?? [],
    dosage: row.dosage,
    applicationMethod: row.application_method,
    status: row.status,
    supportingDocs: Array.isArray(row.supporting_docs) ? (row.supporting_docs as SupportingDoc[]) : [],
    referenceNote: row.reference_note,
    statusReason: row.status_reason,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at === null ? null : row.approved_at.toISOString(),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const INPUT_SELECT = `
  SELECT i.id, i.code, i.name, i.category, i.subcategory, i.farming_type, i.manufacturer,
         i.registration_id, i.composition, i.applicable_crops, i.dosage, i.application_method,
         i.status, i.reference_note, i.status_reason, i.supporting_docs,
         i.approved_by, i.approved_at, i.created_by, i.updated_by, i.created_at,
         to_char(i.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at_cursor,
         i.updated_at
    FROM approved_inputs i
`;

export const inputsRepo = {
  async list(db: Executor, filter: ListInputsFilter): Promise<{ items: AdminInputResponse[]; next: InputCursor | null }> {
    const params: unknown[] = [];
    const conditions: string[] = ['i.deleted_at IS NULL'];

    if (filter.status !== undefined) {
      params.push(filter.status);
      conditions.push(`i.status = $${params.length}`);
    }
    if (filter.category !== undefined) {
      params.push(filter.category);
      conditions.push(`lower(i.category) = lower($${params.length})`);
    }
    if (filter.search !== undefined) {
      params.push(`%${filter.search}%`);
      const p = `$${params.length}`;
      conditions.push(`(i.name ILIKE ${p} OR i.code ILIKE ${p} OR i.manufacturer ILIKE ${p})`);
    }
    if (filter.cursor !== undefined) {
      params.push(filter.cursor.createdAt, filter.cursor.id);
      const n = params.length;
      conditions.push(`(i.created_at, i.id) < ($${n - 1}::timestamptz, $${n}::uuid)`);
    }

    params.push(filter.limit + 1);
    const res = await db.query<InputRow>(
      `${INPUT_SELECT}
        WHERE ${conditions.join(' AND ')}
        ORDER BY i.created_at DESC, i.id DESC
        LIMIT $${params.length}`,
      params,
    );

    const hasMore = res.rows.length > filter.limit;
    const rows = hasMore ? res.rows.slice(0, filter.limit) : res.rows;
    const last = rows[rows.length - 1];
    return {
      items: rows.map(toInputRecord),
      next: hasMore && last !== undefined ? { createdAt: last.created_at_cursor, id: last.id } : null,
    };
  },

  async findById(db: Executor, id: string, approvedOnly = false): Promise<AdminInputResponse | null> {
    const res = await db.query<InputRow>(
      `${INPUT_SELECT}
        WHERE i.id = $1 AND i.deleted_at IS NULL ${approvedOnly ? "AND i.status = 'APPROVED'" : ''}
        LIMIT 1`,
      [id],
    );
    const row = res.rows[0];
    return row === undefined ? null : toInputRecord(row);
  },

  async create(
    db: Executor,
    data: {
      code: string;
      name: string;
      category: string;
      subcategory: string | null;
      farmingType: string | null;
      manufacturer: string;
      registrationId: string | null;
      composition: string | null;
      applicableCrops: string[];
      dosage: string | null;
      applicationMethod: string | null;
      status: InputStatus;
      referenceNote: string | null;
      statusReason: string | null;
      supportingDocs: SupportingDoc[];
      approvedBy: string | null;
      actorId: string;
    },
  ): Promise<string> {
    const res = await db.query<{ id: string }>(
      `INSERT INTO approved_inputs (
         code, name, category, subcategory, farming_type, manufacturer,
         registration_id, composition, applicable_crops, dosage, application_method,
         status, reference_note, status_reason, supporting_docs,
         approved_by, approved_at, created_by, updated_by
       )
       VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9::text[], $10, $11,
         $12, $13, $14, $15::jsonb,
         $16, ${data.status === 'APPROVED' ? 'now()' : 'NULL'}, $17, $17
       )
       RETURNING id`,
      [
        data.code,
        data.name,
        data.category,
        data.subcategory,
        data.farmingType,
        data.manufacturer,
        data.registrationId,
        data.composition,
        data.applicableCrops,
        data.dosage,
        data.applicationMethod,
        data.status,
        data.referenceNote,
        data.statusReason,
        JSON.stringify(data.supportingDocs),
        data.approvedBy,
        data.actorId,
      ],
    );
    return res.rows[0]!.id;
  },

  async update(
    db: Executor,
    id: string,
    patch: Record<string, unknown>,
    actorId: string,
  ): Promise<boolean> {
    const map: Record<string, { col: string; cast?: string }> = {
      code: { col: 'code' },
      name: { col: 'name' },
      category: { col: 'category' },
      subcategory: { col: 'subcategory' },
      farmingType: { col: 'farming_type' },
      manufacturer: { col: 'manufacturer' },
      registrationId: { col: 'registration_id' },
      composition: { col: 'composition' },
      applicableCrops: { col: 'applicable_crops', cast: '::text[]' },
      dosage: { col: 'dosage' },
      applicationMethod: { col: 'application_method' },
      status: { col: 'status' },
      referenceNote: { col: 'reference_note' },
      statusReason: { col: 'status_reason' },
      supportingDocs: { col: 'supporting_docs', cast: '::jsonb' },
      approvedBy: { col: 'approved_by' },
    };

    const sets: string[] = [];
    const params: unknown[] = [id];

    for (const [k, spec] of Object.entries(map)) {
      if (!(k in patch) || patch[k] === undefined) continue;
      const val = k === 'supportingDocs' ? JSON.stringify(patch[k]) : patch[k];
      params.push(val);
      sets.push(`${spec.col} = $${params.length}${spec.cast ?? ''}`);
    }
    if (patch['status'] === 'APPROVED') {
      sets.push('approved_at = now()');
    }
    params.push(actorId);
    sets.push(`updated_by = $${params.length}`, 'updated_at = now()');

    const res = await db.query(
      `UPDATE approved_inputs SET ${sets.join(', ')} WHERE id = $1 AND deleted_at IS NULL`,
      params,
    );
    return (res.rowCount ?? 0) > 0;
  },

  async softDelete(db: Executor, id: string, actorId: string): Promise<boolean> {
    const res = await db.query(
      `UPDATE approved_inputs SET deleted_at = now(), updated_by = $2, updated_at = now() WHERE id = $1 AND deleted_at IS NULL`,
      [id, actorId],
    );
    return (res.rowCount ?? 0) > 0;
  },
};
