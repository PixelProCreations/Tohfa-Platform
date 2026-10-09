import type { Executor } from '../../db/pool.js';

export interface BankAccountRow {
  id: string;
  farmerId: string;
  accountHolderName: string;
  accountNumberLast4: string | null;
  accountNumberToken: string | null;
  ifsc: string | null;
  bankName: string | null;
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
  ifsc: string;
  bankName: string;
  branchName?: string | undefined;
  isDefault: boolean;
}

export interface InsertUpiParams {
  farmerId: string;
  accountHolderName: string;
  upiVpa: string;
  isDefault: boolean;
}

export interface UpdateBankAccountParams {
  accountHolderName?: string | undefined;
  accountNumberLast4?: string | undefined;
  /** Only ever NULL: the full number is never stored, so there is nothing to token. */
  accountNumberToken?: null | undefined;
  ifsc?: string | undefined;
  bankName?: string | undefined;
  branchName?: string | null | undefined;
  upiVpa?: string | undefined;
  isVerified?: boolean | undefined;
  isDefault?: boolean | undefined;
}

/**
 * Which kind of payout destination a lookup is for. The table holds both bank
 * accounts and UPI ids; a UPI row must never be reachable through a bank
 * endpoint (and vice versa), so every lookup names its kind.
 */
export type DestinationKind = 'BANK' | 'UPI' | 'ANY';

/**
 * Payout statuses that are still in flight. PAID, FAILED and REVERSED are the
 * settled states: no code path moves a payout out of them, so a destination
 * referenced only by those may be soft-deleted without disturbing a payout.
 */
const IN_FLIGHT_PAYOUT_STATUSES = ['REQUESTED', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING'];

const ROW_COLUMNS = `
  id, farmer_id AS "farmerId", account_holder_name AS "accountHolderName",
  account_number_last4 AS "accountNumberLast4", account_number_token AS "accountNumberToken",
  ifsc, bank_name AS "bankName", branch_name AS "branchName", upi_vpa AS "upiVpa",
  is_verified AS "isVerified", verified_by AS "verifiedBy", verified_at AS "verifiedAt",
  is_default AS "isDefault", created_at AS "createdAt", updated_at AS "updatedAt",
  deleted_at AS "deletedAt"`;

const KIND_PREDICATE: Record<DestinationKind, string> = {
  BANK: 'AND account_number_last4 IS NOT NULL AND upi_vpa IS NULL',
  UPI: 'AND upi_vpa IS NOT NULL',
  ANY: '',
};

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

  /** The farmer's real name (users.full_name), the same source payouts uses. */
  async getFarmerName(db: Executor, farmerId: string): Promise<string | null> {
    const res = await db.query<{ full_name: string }>(
      `SELECT u.full_name FROM farmers f JOIN users u ON u.id = f.user_id WHERE f.id = $1`,
      [farmerId],
    );
    return res.rows[0]?.full_name ?? null;
  },

  /**
   * Serialises every default-flag mutation for one farmer. Without it two
   * concurrent "make this the default" writes race past clearDefaults and the
   * loser hits uq_farmer_bank_accounts_default as a 500.
   */
  async lockFarmer(db: Executor, farmerId: string): Promise<void> {
    await db.query(`SELECT id FROM farmers WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [farmerId]);
  },

  async listBankAccounts(db: Executor, farmerId: string): Promise<BankAccountRow[]> {
    const res = await db.query<BankAccountRow>(
      `SELECT ${ROW_COLUMNS}
       FROM farmer_bank_accounts
       WHERE farmer_id = $1 AND deleted_at IS NULL ${KIND_PREDICATE.BANK}
       ORDER BY is_default DESC, created_at DESC`,
      [farmerId],
    );
    return res.rows;
  },

  async findById(
    db: Executor,
    id: string,
    farmerId: string,
    kind: DestinationKind,
    forUpdate = false,
  ): Promise<BankAccountRow | null> {
    const res = await db.query<BankAccountRow>(
      `SELECT ${ROW_COLUMNS}
       FROM farmer_bank_accounts
       WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL ${KIND_PREDICATE[kind]}
       LIMIT 1
       ${forUpdate ? 'FOR UPDATE' : ''}`,
      [id, farmerId],
    );
    return res.rows[0] ?? null;
  },

  async findUpiByFarmerId(db: Executor, farmerId: string): Promise<BankAccountRow | null> {
    const res = await db.query<BankAccountRow>(
      `SELECT ${ROW_COLUMNS}
       FROM farmer_bank_accounts
       WHERE farmer_id = $1 AND deleted_at IS NULL ${KIND_PREDICATE.UPI}
       ORDER BY is_default DESC, created_at DESC
       LIMIT 1`,
      [farmerId],
    );
    return res.rows[0] ?? null;
  },

  /** The most recently created active destination of either kind, or null. */
  async findNewestActiveDestination(db: Executor, farmerId: string): Promise<BankAccountRow | null> {
    const res = await db.query<BankAccountRow>(
      `SELECT ${ROW_COLUMNS}
       FROM farmer_bank_accounts
       WHERE farmer_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC, id DESC
       LIMIT 1`,
      [farmerId],
    );
    return res.rows[0] ?? null;
  },

  async clearDefaults(db: Executor, farmerId: string): Promise<void> {
    await db.query(
      `UPDATE farmer_bank_accounts
       SET is_default = false, updated_at = now()
       WHERE farmer_id = $1 AND is_default = true AND deleted_at IS NULL`,
      [farmerId],
    );
  },

  /** Active payout destinations of BOTH kinds: a UPI id is a destination too. */
  async countActiveDestinations(db: Executor, farmerId: string): Promise<number> {
    const res = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM farmer_bank_accounts
       WHERE farmer_id = $1 AND deleted_at IS NULL`,
      [farmerId],
    );
    return Number(res.rows[0]?.count ?? '0');
  },

  async insert(db: Executor, params: InsertBankAccountParams): Promise<BankAccountRow> {
    const res = await db.query<BankAccountRow>(
      `INSERT INTO farmer_bank_accounts
         (farmer_id, account_holder_name, account_number_last4, account_number_token,
          ifsc, bank_name, branch_name, is_verified, is_default, created_at)
       VALUES ($1, $2, $3, NULL, $4, $5, $6, false, $7, now())
       RETURNING ${ROW_COLUMNS}`,
      [
        params.farmerId,
        params.accountHolderName,
        params.accountNumberLast4,
        params.ifsc,
        params.bankName,
        params.branchName ?? null,
        params.isDefault,
      ],
    );
    return res.rows[0] as BankAccountRow;
  },

  /** bank_name stays NULL: a UPI id is not a bank, and we do not make one up. */
  async insertUpi(db: Executor, params: InsertUpiParams): Promise<BankAccountRow> {
    const res = await db.query<BankAccountRow>(
      `INSERT INTO farmer_bank_accounts
         (farmer_id, account_holder_name, upi_vpa, is_verified, is_default, created_at)
       VALUES ($1, $2, $3, false, $4, now())
       RETURNING ${ROW_COLUMNS}`,
      [params.farmerId, params.accountHolderName, params.upiVpa, params.isDefault],
    );
    return res.rows[0] as BankAccountRow;
  },

  async update(
    db: Executor,
    id: string,
    farmerId: string,
    params: UpdateBankAccountParams,
  ): Promise<BankAccountRow | null> {
    const assignments: string[] = ['updated_at = now()'];
    const values: unknown[] = [id, farmerId];
    const assign = (column: string, value: unknown): void => {
      values.push(value);
      assignments.push(`${column} = $${values.length}`);
    };

    if (params.accountHolderName !== undefined) assign('account_holder_name', params.accountHolderName);
    if (params.accountNumberLast4 !== undefined) assign('account_number_last4', params.accountNumberLast4);
    if (params.accountNumberToken !== undefined) assign('account_number_token', params.accountNumberToken);
    if (params.ifsc !== undefined) assign('ifsc', params.ifsc);
    if (params.bankName !== undefined) assign('bank_name', params.bankName);
    if (params.branchName !== undefined) assign('branch_name', params.branchName);
    if (params.upiVpa !== undefined) assign('upi_vpa', params.upiVpa);
    if (params.isVerified !== undefined) assign('is_verified', params.isVerified);
    if (params.isDefault !== undefined) assign('is_default', params.isDefault);

    const res = await db.query<BankAccountRow>(
      `UPDATE farmer_bank_accounts
       SET ${assignments.join(', ')}
       WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL
       RETURNING ${ROW_COLUMNS}`,
      values,
    );
    return res.rows[0] ?? null;
  },

  async setDefault(db: Executor, id: string, farmerId: string): Promise<BankAccountRow | null> {
    const res = await db.query<BankAccountRow>(
      `UPDATE farmer_bank_accounts
       SET is_default = true, updated_at = now()
       WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL
       RETURNING ${ROW_COLUMNS}`,
      [id, farmerId],
    );
    return res.rows[0] ?? null;
  },

  async softDelete(db: Executor, id: string, farmerId: string): Promise<void> {
    await db.query(
      `UPDATE farmer_bank_accounts
       SET deleted_at = now(), is_default = false, updated_at = now()
       WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL`,
      [id, farmerId],
    );
  },

  /** True while a payout that has not settled still points at this destination. */
  async hasInFlightPayoutReferences(db: Executor, id: string): Promise<boolean> {
    const res = await db.query(
      `SELECT 1 FROM payouts WHERE bank_account_id = $1 AND status = ANY($2::payout_status[]) LIMIT 1`,
      [id, IN_FLIGHT_PAYOUT_STATUSES],
    );
    return (res.rowCount ?? 0) > 0;
  },
};
