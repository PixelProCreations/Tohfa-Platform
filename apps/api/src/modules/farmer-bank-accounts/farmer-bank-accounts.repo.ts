import type { Executor } from '../../db/pool.js';
import type { FarmerBankAccountResponse, FarmerUpiResponse } from './farmer-bank-accounts.schema.js';

export interface BankAccountRow {
  id: string;
  farmerId: string;
  accountHolderName: string;
  accountNumberLast4: string | null;
  accountNumberToken: string | null;
  ifsc: string | null;
  bankName: string;
  branchName: string | null;
  upiVpa: string | null;
  isVerified: boolean;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export interface InsertBankAccountParams {
  farmerId: string;
  accountHolderName: string;
  accountNumberLast4: string;
  accountNumberToken: string;
  ifsc: string;
  bankName: string;
  branchName?: string | null | undefined;
  upiVpa?: string | null | undefined;
  isDefault?: boolean | undefined;
}

export interface UpdateBankAccountParams {
  accountHolderName?: string | undefined;
  accountNumberLast4?: string | undefined;
  accountNumberToken?: string | undefined;
  ifsc?: string | undefined;
  bankName?: string | undefined;
  branchName?: string | null | undefined;
  isVerified?: boolean | undefined;
  isDefault?: boolean | undefined;
}

function mapRow(row: any): FarmerBankAccountResponse {
  return {
    id: row.id,
    accountHolderName: row.account_holder_name,
    accountNumberLast4: row.account_number_last4,
    ifsc: row.ifsc,
    bankName: row.bank_name,
    branchName: row.branch_name,
    upiVpa: row.upi_vpa,
    isVerified: row.is_verified,
    isDefault: row.is_default,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };
}

export const farmerBankAccountsRepo = {
  async findFarmerByUserId(db: Executor, userId: string): Promise<{ id: string } | null> {
    const res = await db.query<{ id: string }>(
      `SELECT id
       FROM farmers
       WHERE user_id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [userId],
    );
    return res.rows[0] ?? null;
  },

  async lockFarmer(db: Executor, farmerId: string): Promise<void> {
    await db.query(`SELECT id FROM farmers WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [farmerId]);
  },

  async listByFarmerId(db: Executor, farmerId: string): Promise<FarmerBankAccountResponse[]> {
    const res = await db.query(
      `SELECT id, account_holder_name, account_number_last4, ifsc, bank_name, branch_name, upi_vpa, is_verified, is_default, created_at
       FROM farmer_bank_accounts
       WHERE farmer_id = $1 AND deleted_at IS NULL
       ORDER BY is_default DESC, created_at DESC`,
      [farmerId],
    );
    return res.rows.map(mapRow);
  },

  async findById(db: Executor, id: string, forUpdate = false, farmerId?: string): Promise<BankAccountRow | null> {
    const whereClauses = ['id = $1', 'deleted_at IS NULL'];
    const params: unknown[] = [id];
    if (farmerId) {
      params.push(farmerId);
      whereClauses.push(`farmer_id = $${params.length}`);
    }

    const res = await db.query<any>(
      `SELECT id, farmer_id AS "farmerId", account_holder_name AS "accountHolderName",
              account_number_last4 AS "accountNumberLast4", account_number_token AS "accountNumberToken",
              ifsc, bank_name AS "bankName", branch_name AS "branchName", upi_vpa AS "upiVpa",
              is_verified AS "isVerified", verified_by AS "verifiedBy", verified_at AS "verifiedAt",
              is_default AS "isDefault", created_at AS "createdAt", updated_at AS "updatedAt",
              deleted_at AS "deletedAt"
       FROM farmer_bank_accounts
       WHERE ${whereClauses.join(' AND ')}
       LIMIT 1
       ${forUpdate ? 'FOR UPDATE' : ''}`,
      params,
    );
    return res.rows[0] ?? null;
  },

  async findUpiByFarmerId(db: Executor, farmerId: string): Promise<FarmerUpiResponse | null> {
    const res = await db.query<any>(
      `SELECT id, upi_vpa AS "upiVpa", is_verified AS "isVerified", is_default AS "isDefault"
       FROM farmer_bank_accounts
       WHERE farmer_id = $1 AND upi_vpa IS NOT NULL AND deleted_at IS NULL
       ORDER BY is_default DESC, created_at DESC
       LIMIT 1`,
      [farmerId],
    );
    if (!res.rows[0]) return null;
    return {
      id: res.rows[0].id,
      upiVpa: res.rows[0].upiVpa,
      isVerified: res.rows[0].isVerified,
      isDefault: res.rows[0].isDefault,
    };
  },

  async clearDefaults(db: Executor, farmerId: string): Promise<void> {
    await db.query(
      `UPDATE farmer_bank_accounts
       SET is_default = false, updated_at = now()
       WHERE farmer_id = $1 AND is_default = true AND deleted_at IS NULL`,
      [farmerId],
    );
  },

  async countActiveAccounts(db: Executor, farmerId: string): Promise<number> {
    const res = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM farmer_bank_accounts
       WHERE farmer_id = $1 AND deleted_at IS NULL`,
      [farmerId],
    );
    return Number(res.rows[0]?.count ?? '0');
  },

  async insert(db: Executor, params: InsertBankAccountParams): Promise<FarmerBankAccountResponse> {
    const res = await db.query(
      `INSERT INTO farmer_bank_accounts
         (farmer_id, account_holder_name, account_number_last4, account_number_token,
          ifsc, bank_name, branch_name, upi_vpa, is_verified, is_default, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, $9, now())
       RETURNING id, account_holder_name, account_number_last4, ifsc, bank_name, branch_name, upi_vpa, is_verified, is_default, created_at`,
      [
        params.farmerId,
        params.accountHolderName,
        params.accountNumberLast4,
        params.accountNumberToken,
        params.ifsc,
        params.bankName,
        params.branchName ?? null,
        params.upiVpa ?? null,
        params.isDefault ?? false,
      ],
    );
    return mapRow(res.rows[0]);
  },

  async upsertUpi(
    db: Executor,
    params: { farmerId: string; accountHolderName: string; upiVpa: string; isDefault: boolean },
  ): Promise<FarmerUpiResponse> {
    const existing = await this.findUpiByFarmerId(db, params.farmerId);
    if (existing && existing.id) {
      const res = await db.query<any>(
        `UPDATE farmer_bank_accounts
         SET upi_vpa = $1, is_verified = false, is_default = $2, updated_at = now()
         WHERE id = $3 AND farmer_id = $4 AND deleted_at IS NULL
         RETURNING id, upi_vpa AS "upiVpa", is_verified AS "isVerified", is_default AS "isDefault"`,
        [params.upiVpa, params.isDefault, existing.id, params.farmerId],
      );
      return {
        id: res.rows[0].id,
        upiVpa: res.rows[0].upiVpa,
        isVerified: res.rows[0].isVerified,
        isDefault: res.rows[0].isDefault,
      };
    }

    const res = await db.query<any>(
      `INSERT INTO farmer_bank_accounts
         (farmer_id, account_holder_name, upi_vpa, bank_name, is_verified, is_default, created_at)
       VALUES ($1, $2, $3, 'UPI', false, $4, now())
       RETURNING id, upi_vpa AS "upiVpa", is_verified AS "isVerified", is_default AS "isDefault"`,
      [params.farmerId, params.accountHolderName, params.upiVpa, params.isDefault],
    );
    return {
      id: res.rows[0].id,
      upiVpa: res.rows[0].upiVpa,
      isVerified: res.rows[0].isVerified,
      isDefault: res.rows[0].isDefault,
    };
  },

  async update(
    db: Executor,
    id: string,
    params: UpdateBankAccountParams,
    farmerId?: string,
  ): Promise<FarmerBankAccountResponse> {
    const updates: string[] = ['updated_at = now()'];
    const values: any[] = [id];
    let where = 'WHERE id = $1 AND deleted_at IS NULL';
    if (farmerId) {
      values.push(farmerId);
      where = 'WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL';
    }
    let idx = values.length + 1;

    if (params.accountHolderName !== undefined) {
      updates.push(`account_holder_name = $${idx++}`);
      values.push(params.accountHolderName);
    }
    if (params.accountNumberLast4 !== undefined) {
      updates.push(`account_number_last4 = $${idx++}`);
      values.push(params.accountNumberLast4);
    }
    if (params.accountNumberToken !== undefined) {
      updates.push(`account_number_token = $${idx++}`);
      values.push(params.accountNumberToken);
    }
    if (params.ifsc !== undefined) {
      updates.push(`ifsc = $${idx++}`);
      values.push(params.ifsc);
    }
    if (params.bankName !== undefined) {
      updates.push(`bank_name = $${idx++}`);
      values.push(params.bankName);
    }
    if (params.branchName !== undefined) {
      updates.push(`branch_name = $${idx++}`);
      values.push(params.branchName);
    }
    if (params.isVerified !== undefined) {
      updates.push(`is_verified = $${idx++}`);
      values.push(params.isVerified);
    }
    if (params.isDefault !== undefined) {
      updates.push(`is_default = $${idx++}`);
      values.push(params.isDefault);
    }

    const res = await db.query(
      `UPDATE farmer_bank_accounts
       SET ${updates.join(', ')}
       ${where}
       RETURNING id, account_holder_name, account_number_last4, ifsc, bank_name, branch_name, upi_vpa, is_verified, is_default, created_at`,
      values,
    );
    return mapRow(res.rows[0]);
  },

  async setDefault(db: Executor, id: string, farmerId?: string): Promise<FarmerBankAccountResponse> {
    const values: any[] = [id];
    let where = 'WHERE id = $1 AND deleted_at IS NULL';
    if (farmerId) {
      values.push(farmerId);
      where = 'WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL';
    }
    const res = await db.query(
      `UPDATE farmer_bank_accounts
       SET is_default = true, updated_at = now()
       ${where}
       RETURNING id, account_holder_name, account_number_last4, ifsc, bank_name, branch_name, upi_vpa, is_verified, is_default, created_at`,
      values,
    );
    return mapRow(res.rows[0]);
  },

  async softDelete(db: Executor, id: string, farmerId?: string): Promise<void> {
    const values: any[] = [id];
    let where = 'WHERE id = $1';
    if (farmerId) {
      values.push(farmerId);
      where = 'WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL';
    }
    await db.query(
      `UPDATE farmer_bank_accounts
       SET deleted_at = now(), is_default = false, updated_at = now()
       ${where}`,
      values,
    );
  },

  async hasPayoutReferences(db: Executor, id: string): Promise<boolean> {
    const res = await db.query(
      `SELECT 1 FROM payouts WHERE bank_account_id = $1 LIMIT 1`,
      [id],
    );
    return (res.rowCount ?? 0) > 0;
  },
};
