/**
 * Module 11 (Warehouse Finance), BR-73: SQL only, for the expense category writes.
 *
 * Names are unique case-insensitively through `uq_expense_categories_name` (lower(name), migration
 * 0047). The service checks first (so a clash is a clean 409) and the index is the backstop for a race.
 * A category is never deleted: deactivating it stops NEW expenses using it while the expenses
 * already recorded keep the label.
 */
import type { Executor } from '../../db/pool.js';
import type { ExpenseCategoryAdminResponse } from './finance.schema.js';

export type ExpenseCategoryAdminRecord = ExpenseCategoryAdminResponse;

export type CategoryStatusFilter = 'ACTIVE' | 'INACTIVE' | 'ALL';

interface CategoryRow {
  id: string;
  name: string;
  is_active: boolean;
  expense_count: number;
}

export interface ExpenseCategoriesRepo {
  list(db: Executor, status: CategoryStatusFilter): Promise<ExpenseCategoryAdminRecord[]>;
  findById(db: Executor, id: string): Promise<ExpenseCategoryAdminRecord | null>;
  /** The id of ANOTHER category that already has this name (case-insensitive), or null. */
  findOtherByName(db: Executor, name: string, exceptId: string | null): Promise<string | null>;
  insert(db: Executor, name: string): Promise<ExpenseCategoryAdminRecord>;
  update(db: Executor, id: string, patch: { name?: string | undefined; isActive?: boolean | undefined }): Promise<ExpenseCategoryAdminRecord | null>;
}

const SELECT = `SELECT c.id, c.name, c.is_active,
       (SELECT count(*)::int FROM expenses e WHERE e.category_id = c.id AND e.deleted_at IS NULL) AS expense_count
  FROM expense_categories c`;

function map(row: CategoryRow): ExpenseCategoryAdminRecord {
  return { id: row.id, name: row.name, isActive: row.is_active, expenseCount: row.expense_count };
}

const findById: ExpenseCategoriesRepo['findById'] = async (db, id) => {
  const result = await db.query<CategoryRow>(`${SELECT} WHERE c.id = $1::uuid`, [id]);
  const row = result.rows[0];
  return row ? map(row) : null;
};

export const expenseCategoriesRepo: ExpenseCategoriesRepo = {
  async list(db, status) {
    const where = status === 'ACTIVE' ? 'WHERE c.is_active' : status === 'INACTIVE' ? 'WHERE NOT c.is_active' : '';
    const result = await db.query<CategoryRow>(`${SELECT} ${where} ORDER BY c.name, c.id`);
    return result.rows.map(map);
  },

  findById,

  async findOtherByName(db, name, exceptId) {
    const result = await db.query<{ id: string }>(
      `SELECT id FROM expense_categories WHERE lower(name) = lower($1) AND ($2::uuid IS NULL OR id <> $2::uuid) LIMIT 1`,
      [name, exceptId],
    );
    return result.rows[0]?.id ?? null;
  },

  async insert(db, name) {
    const result = await db.query<{ id: string }>(`INSERT INTO expense_categories (name) VALUES ($1) RETURNING id`, [name]);
    const id = result.rows[0]?.id;
    if (id === undefined) throw new Error('expense category insert returned no row');
    const created = await findById(db, id);
    if (created === null) throw new Error('the expense category just inserted is not readable');
    return created;
  },

  async update(db, id, patch) {
    const result = await db.query<{ id: string }>(
      `UPDATE expense_categories
          SET name = COALESCE($2, name), is_active = COALESCE($3::boolean, is_active)
        WHERE id = $1::uuid
        RETURNING id`,
      [id, patch.name ?? null, patch.isActive ?? null],
    );
    if (result.rows[0] === undefined) return null;
    return findById(db, id);
  },
};
