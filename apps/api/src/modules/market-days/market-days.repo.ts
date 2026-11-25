import type { Executor } from '../../db/pool.js';
import type {
  CreateMarketDayInput,
  ListMarketDaysQuery,
  MarketDayResponse,
  PatchMarketDayInput,
} from './market-days.schema.js';

export interface MarketDayRow {
  id: string;
  warehouse_id: string;
  warehouse_name?: string | undefined;
  market_date: string | Date;
  start_time: string;
  end_time: string;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export function toMarketDayResponse(row: MarketDayRow): MarketDayResponse {
  let dateStr: string;
  if (row.market_date instanceof Date) {
    const year = row.market_date.getFullYear();
    const month = String(row.market_date.getMonth() + 1).padStart(2, '0');
    const day = String(row.market_date.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  } else {
    dateStr = String(row.market_date).slice(0, 10);
  }

  return {
    id: row.id,
    warehouseId: row.warehouse_id,
    warehouseName: row.warehouse_name,
    marketDate: dateStr,
    startTime: row.start_time,
    endTime: row.end_time,
    isActive: row.is_active,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: (row.created_at instanceof Date ? row.created_at : new Date(row.created_at)).toISOString(),
    updatedAt: (row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at)).toISOString(),
  };
}

export interface MarketDaysRepo {
  create(
    db: Executor,
    input: CreateMarketDayInput,
    createdBy?: string,
  ): Promise<MarketDayResponse>;
  findById(db: Executor, id: string): Promise<MarketDayResponse | null>;
  update(
    db: Executor,
    id: string,
    patch: PatchMarketDayInput,
  ): Promise<MarketDayResponse | null>;
  list(db: Executor, query: ListMarketDaysQuery): Promise<MarketDayResponse[]>;
}

export const marketDaysRepo: MarketDaysRepo = {
  async create(db, input, createdBy) {
    const res = await db.query<MarketDayRow>(
      `INSERT INTO market_days (
         warehouse_id,
         market_date,
         start_time,
         end_time,
         is_active,
         notes,
         created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.warehouseId,
        input.marketDate,
        input.startTime,
        input.endTime,
        input.isActive ?? true,
        input.notes ?? null,
        createdBy ?? null,
      ],
    );

    const row = res.rows[0]!;
    // Fetch warehouse name
    const whRes = await db.query<{ name: string }>(
      `SELECT name FROM warehouses WHERE id = $1`,
      [row.warehouse_id],
    );
    row.warehouse_name = whRes.rows[0]?.name;

    return toMarketDayResponse(row);
  },

  async findById(db, id) {
    const res = await db.query<MarketDayRow>(
      `SELECT md.*, w.name AS warehouse_name
         FROM market_days md
         JOIN warehouses w ON w.id = md.warehouse_id
        WHERE md.id = $1 AND md.deleted_at IS NULL`,
      [id],
    );
    if (res.rows.length === 0) return null;
    return toMarketDayResponse(res.rows[0]!);
  },

  async update(db, id, patch) {
    const setClauses: string[] = ['updated_at = now()'];
    const params: unknown[] = [id];

    if (patch.startTime !== undefined) {
      params.push(patch.startTime);
      setClauses.push(`start_time = $${params.length}`);
    }
    if (patch.endTime !== undefined) {
      params.push(patch.endTime);
      setClauses.push(`end_time = $${params.length}`);
    }
    if (patch.isActive !== undefined) {
      params.push(patch.isActive);
      setClauses.push(`is_active = $${params.length}`);
    }
    if (patch.notes !== undefined) {
      params.push(patch.notes);
      setClauses.push(`notes = $${params.length}`);
    }

    const res = await db.query<MarketDayRow>(
      `UPDATE market_days
          SET ${setClauses.join(', ')}
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING *`,
      params,
    );
    if (res.rows.length === 0) return null;

    const row = res.rows[0]!;
    const whRes = await db.query<{ name: string }>(
      `SELECT name FROM warehouses WHERE id = $1`,
      [row.warehouse_id],
    );
    row.warehouse_name = whRes.rows[0]?.name;

    return toMarketDayResponse(row);
  },

  async list(db, query) {
    const params: unknown[] = [];
    const conditions: string[] = ['md.deleted_at IS NULL'];

    if (query.warehouseId) {
      params.push(query.warehouseId);
      conditions.push(`md.warehouse_id = $${params.length}`);
    }
    if (query.from) {
      params.push(query.from);
      conditions.push(`md.market_date >= $${params.length}::date`);
    }
    if (query.to) {
      params.push(query.to);
      conditions.push(`md.market_date <= $${params.length}::date`);
    }

    const res = await db.query<MarketDayRow>(
      `SELECT md.*, w.name AS warehouse_name
         FROM market_days md
         JOIN warehouses w ON w.id = md.warehouse_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY md.market_date ASC, md.start_time ASC`,
      params,
    );

    return res.rows.map(toMarketDayResponse);
  },
};
