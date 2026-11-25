import type { Executor } from '../../db/pool.js';
import type {
  CreatePaymentMethodInput,
  ListPaymentMethodsQuery,
  PaymentMethodResponse,
  PaymentMethodType,
  UpdatePaymentMethodInput,
} from './payment-methods.schema.js';

interface PaymentMethodRow {
  id: string;
  type: PaymentMethodType;
  label: string;
  is_default: boolean;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function toResponse(row: PaymentMethodRow): PaymentMethodResponse {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    isDefault: row.is_default,
    config: row.config ?? {},
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export interface PaymentMethodsRepo {
  create(db: Executor, input: CreatePaymentMethodInput): Promise<PaymentMethodResponse>;
  update(db: Executor, id: string, patch: UpdatePaymentMethodInput): Promise<PaymentMethodResponse | null>;
  findById(db: Executor, id: string): Promise<PaymentMethodResponse | null>;
  list(db: Executor, query?: ListPaymentMethodsQuery): Promise<PaymentMethodResponse[]>;
  unsetDefaultExcept(db: Executor, exceptId?: string): Promise<void>;
  deactivate(db: Executor, id: string): Promise<PaymentMethodResponse | null>;
}

export const paymentMethodsRepo: PaymentMethodsRepo = {
  async unsetDefaultExcept(db, exceptId) {
    if (exceptId) {
      await db.query(
        `UPDATE payment_methods SET is_default = false, updated_at = now() WHERE is_default = true AND id != $1`,
        [exceptId],
      );
    } else {
      await db.query(`UPDATE payment_methods SET is_default = false, updated_at = now() WHERE is_default = true`);
    }
  },

  async create(db, input) {
    const res = await db.query<PaymentMethodRow>(
      `INSERT INTO payment_methods (type, label, is_default, config, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, type, label, is_default, config, is_active, created_at, updated_at`,
      [input.type, input.label, input.isDefault ?? false, JSON.stringify(input.config ?? {}), input.isActive ?? true],
    );
    return toResponse(res.rows[0]!);
  },

  async update(db, id, patch) {
    const updates: string[] = [];
    const params: unknown[] = [id];
    let index = 2;

    if (patch.type !== undefined) {
      updates.push(`type = $${index++}`);
      params.push(patch.type);
    }
    if (patch.label !== undefined) {
      updates.push(`label = $${index++}`);
      params.push(patch.label);
    }
    if (patch.isDefault !== undefined) {
      updates.push(`is_default = $${index++}`);
      params.push(patch.isDefault);
    }
    if (patch.config !== undefined) {
      updates.push(`config = $${index++}`);
      params.push(JSON.stringify(patch.config));
    }
    if (patch.isActive !== undefined) {
      updates.push(`is_active = $${index++}`);
      params.push(patch.isActive);
    }

    if (updates.length === 0) {
      return this.findById(db, id);
    }

    updates.push(`updated_at = now()`);

    const sql = `
      UPDATE payment_methods
         SET ${updates.join(', ')}
       WHERE id = $1
       RETURNING id, type, label, is_default, config, is_active, created_at, updated_at
    `;

    const res = await db.query<PaymentMethodRow>(sql, params);
    if (res.rows.length === 0) return null;
    return toResponse(res.rows[0]!);
  },

  async findById(db, id) {
    const res = await db.query<PaymentMethodRow>(
      `SELECT id, type, label, is_default, config, is_active, created_at, updated_at
         FROM payment_methods
        WHERE id = $1`,
      [id],
    );
    if (res.rows.length === 0) return null;
    return toResponse(res.rows[0]!);
  },

  async list(db, query) {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query?.status === 'active') {
      conditions.push('is_active = true');
    } else if (query?.status === 'inactive') {
      conditions.push('is_active = false');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT id, type, label, is_default, config, is_active, created_at, updated_at
        FROM payment_methods
       ${whereClause}
       ORDER BY is_default DESC, created_at ASC
    `;

    const res = await db.query<PaymentMethodRow>(sql, params);
    return res.rows.map(toResponse);
  },

  async deactivate(db, id) {
    const res = await db.query<PaymentMethodRow>(
      `UPDATE payment_methods
          SET is_active = false, is_default = false, updated_at = now()
        WHERE id = $1
        RETURNING id, type, label, is_default, config, is_active, created_at, updated_at`,
      [id],
    );
    if (res.rows.length === 0) return null;
    return toResponse(res.rows[0]!);
  },
};
