import type { Executor } from '../../db/pool.js';
import type {
  AgeBucket,
  PayoutDue,
  PayoutDuesTotals,
  PayoutDuesQuery,
} from './payouts.schema.js';

// ---------------------------------------------------------------------------
// Internal DB row types
// ---------------------------------------------------------------------------

export interface PayoutRow {
  id: string;
  payout_number: string;
  farmer_id: string;
  farmer_name: string;
  amount: string;
  mode: string;
  status: string;
  requires_dual_approval: boolean;
  initiated_by: string;
  released_by: string | null;
  released_at: Date | null;
  gateway_payout_id: string | null;
  failure_reason: string | null;
  paid_at: Date | null;
  remarks: string | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface PayoutApprovalRow {
  approver_id: string;
  approved_at: Date;
}

export interface PayoutRepo {
  listPayoutDues(
    db: Executor,
    query: PayoutDuesQuery,
  ): Promise<{ items: PayoutDue[]; totals: PayoutDuesTotals; nextCursor: string | null }>;

  createPayout(
    db: Executor,
    params: {
      farmerId: string;
      amount: string;
      mode: string;
      bankAccountId?: string;
      dueIds?: string[];
      remarks?: string;
      initiatedBy: string;
    },
  ): Promise<{ payout: PayoutRow; approvals: PayoutApprovalRow[] }>;

  /**
   * `forUpdate` locks the payout row until the caller's transaction ends. The
   * approve path uses it so two approvers cannot both pass the "still pending"
   * check and both release the payout (BR-72).
   */
  findPayoutById(
    db: Executor,
    payoutId: string,
    forUpdate?: boolean,
  ): Promise<{ payout: PayoutRow; approvals: PayoutApprovalRow[] } | null>;

  addApproval(
    db: Executor,
    params: {
      payoutId: string;
      approverId: string;
      approverRoleCode: string;
      note?: string;
    },
  ): Promise<PayoutApprovalRow[]>;

  updatePayoutStatus(
    db: Executor,
    params: {
      payoutId: string;
      status: string;
      releasedBy?: string;
      releasedAt?: Date;
      gatewayPayoutId?: string;
      failureReason?: string;
      paidAt?: Date;
    },
  ): Promise<void>;

  getFarmerName(db: Executor, farmerId: string): Promise<string | null>;

  /**
   * BR-70: take the farmer row lock, in the same mode and at the same point
   * as the bank-accounts module's delete path (`lockFarmer` there), so a
   * payout being created and a destination being deleted for the same farmer
   * run one after the other. Without it the delete's "any unsettled payout
   * still pointing here?" check can run before this payout is visible, and the
   * account is then soft-deleted underneath a payout that is already in flight.
   */
  lockFarmer(db: Executor, farmerId: string): Promise<void>;

  /**
   * BR-70: true only when `bankAccountId` is a destination (bank account or
   * UPI id) of `farmerId` that has not been soft-deleted. One predicate for
   * "does not exist", "belongs to someone else" and "deleted", so the caller
   * cannot tell the three apart.
   */
  findActiveBankAccountOfFarmer(db: Executor, bankAccountId: string, farmerId: string): Promise<boolean>;

  /**
   * The farmer's `users.id`, for publishing `payout.released` (BR-52/PAYROLL)
   * to the right notification recipient. `payouts.farmer_id` is a `farmers`
   * row, not a `users` row, so the event dispatcher — which is keyed on
   * `users.id` everywhere else — needs this translation.
   */
  getFarmerUserId(db: Executor, farmerId: string): Promise<string | null>;
}

// ---------------------------------------------------------------------------
// Age bucket helper
// ---------------------------------------------------------------------------

function toAgeBucket(ageDays: number): AgeBucket {
  if (ageDays <= 7) return 'D0_7';
  if (ageDays <= 15) return 'D8_15';
  if (ageDays <= 30) return 'D16_30';
  return 'D30_PLUS';
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export const payoutsRepo: PayoutRepo = {
  async listPayoutDues(db, query) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    // Payout dues = purchase orders that are accepted and not yet fully paid out.
    // We derive dues from goods_receipts that passed quality check, joined to PO and farmer.
    let sql = `
      SELECT
        gr.id                                                          AS id,
        po.farmer_id                                                   AS farmer_id,
        f.tohfa_farmer_id                                              AS tohfa_farmer_id,
        u.full_name                                                    AS farmer_name,
        gr.purchase_order_id                                           AS purchase_order_id,
        gr.id                                                          AS goods_receipt_id,
        (po.price_per_kg * gr.accepted_qty_kg)::numeric(12,2)          AS amount_due,
        gr.created_at::date                                            AS due_since,
        (CURRENT_DATE - gr.created_at::date)::int                     AS age_days
      FROM goods_receipts gr
      JOIN purchase_orders po ON po.id = gr.purchase_order_id
      JOIN farmers f           ON f.id = po.farmer_id
      JOIN users u             ON u.id = f.user_id
      WHERE gr.status IN ('ACCEPTED', 'PARTIALLY_ACCEPTED', 'QC_DONE')
        AND gr.accepted_qty_kg > 0
        AND NOT EXISTS (
          SELECT 1
          FROM payouts p
          WHERE p.farmer_id = po.farmer_id
            AND p.status IN ('APPROVED', 'PROCESSING', 'PAID')
            AND $${idx} = $${idx}
        )
    `;
    values.push(1); idx++; // dummy self-ref to keep param index consistent

    if (query.farmerId) {
      conditions.push(`po.farmer_id = $${idx}`);
      values.push(query.farmerId); idx++;
    }

    if (query.ageBucket) {
      const bucketConditions: Record<AgeBucket, string> = {
        D0_7: `(CURRENT_DATE - gr.created_at::date) BETWEEN 0 AND 7`,
        D8_15: `(CURRENT_DATE - gr.created_at::date) BETWEEN 8 AND 15`,
        D16_30: `(CURRENT_DATE - gr.created_at::date) BETWEEN 16 AND 30`,
        D30_PLUS: `(CURRENT_DATE - gr.created_at::date) > 30`,
      };
      conditions.push(bucketConditions[query.ageBucket]);
    }

    if (query.cursor) {
      conditions.push(`gr.created_at < $${idx}`);
      values.push(new Date(Buffer.from(query.cursor, 'base64').toString('utf8'))); idx++;
    }

    if (conditions.length > 0) {
      sql += ' AND ' + conditions.join(' AND ');
    }

    sql += ` ORDER BY gr.created_at ASC LIMIT $${idx}`;
    values.push(query.limit + 1); idx++;

    const res = await db.query<{
      id: string;
      farmer_id: string;
      tohfa_farmer_id: string | null;
      farmer_name: string;
      purchase_order_id: string;
      goods_receipt_id: string;
      amount_due: string;
      due_since: Date;
      age_days: number;
    }>(sql, values);

    const rows = res.rows;
    const hasMore = rows.length > query.limit;
    if (hasMore) rows.pop();

    const items: PayoutDue[] = rows.map((r) => ({
      id: r.id,
      farmerId: r.farmer_id,
      tohfaFarmerId: r.tohfa_farmer_id,
      farmerName: r.farmer_name,
      purchaseOrderId: r.purchase_order_id,
      goodsReceiptId: r.goods_receipt_id,
      amountDue: r.amount_due,
      dueSince: r.due_since instanceof Date ? r.due_since.toISOString().slice(0, 10) : String(r.due_since),
      ageDays: r.age_days,
      ageBucket: toAgeBucket(r.age_days),
    }));

    const nextCursor = hasMore
      ? Buffer.from(rows[rows.length - 1]!.due_since.toString()).toString('base64')
      : null;

    // Totals
    const totalsRes = await db.query<{ total_due: string; farmer_count: string }>(`
      SELECT
        COALESCE(SUM((po.price_per_kg * gr.accepted_qty_kg)::numeric(12,2)), 0)::text AS total_due,
        COUNT(DISTINCT po.farmer_id)::text AS farmer_count
      FROM goods_receipts gr
      JOIN purchase_orders po ON po.id = gr.purchase_order_id
      WHERE gr.status IN ('ACCEPTED', 'PARTIALLY_ACCEPTED', 'QC_DONE') AND gr.accepted_qty_kg > 0
    `);

    const totals: PayoutDuesTotals = {
      totalDue: totalsRes.rows[0]?.total_due ?? '0.00',
      farmerCount: parseInt(totalsRes.rows[0]?.farmer_count ?? '0', 10),
    };

    return { items, totals, nextCursor };
  },

  /**
   * BR-72: next `PO-YYYY-NNNNNN`. Called inside the transaction that creates
   * the payout: the transaction-scoped advisory lock is held until that
   * transaction ends, so the next caller reads the committed row and cannot
   * choose the same number. Highest existing suffix + 1, not COUNT(*) + 1, so
   * a gap or a number written by hand is never reused. The lock is taken last,
   * after the key claim and the farmer row lock, so it cannot join a lock cycle.
   */
  async createPayout(db, params) {
    await db.query(`SELECT pg_advisory_xact_lock(hashtextextended('payouts.payout_number', 0))`);
    const numRes = await db.query<{ yr: string; max_seq: string }>(
      `SELECT y.yr,
              COALESCE(MAX(substring(p.payout_number FROM '^PO-' || y.yr || '-([0-9]+)$')::bigint), 0)::text AS max_seq
         FROM (SELECT EXTRACT(YEAR FROM now())::text AS yr) y
         LEFT JOIN payouts p ON p.payout_number LIKE 'PO-' || y.yr || '-%'
        GROUP BY y.yr`,
    );
    const { yr, max_seq: maxSeq } = numRes.rows[0]!;
    const payoutNumber = `PO-${yr}-${String(Number(maxSeq) + 1).padStart(6, '0')}`;

    const insertRes = await db.query<PayoutRow>(
      `INSERT INTO payouts
         (payout_number, farmer_id, bank_account_id, amount, mode, status,
          initiated_by, created_at)
       VALUES ($1, $2, $3, $4, $5, 'REQUESTED', $6, now())
       RETURNING
         id, payout_number, farmer_id, amount::text, mode, status,
         requires_dual_approval, initiated_by, released_by, released_at,
         gateway_payout_id, failure_reason, paid_at, null AS remarks,
         created_at, updated_at`,
      [
        payoutNumber,
        params.farmerId,
        params.bankAccountId ?? null,
        params.amount,
        params.mode,
        params.initiatedBy,
      ],
    );

    const payout = insertRes.rows[0]!;

    // Store farmer name for response
    const nameRes = await db.query<{ full_name: string }>(
      `SELECT u.full_name FROM farmers f JOIN users u ON u.id = f.user_id WHERE f.id = $1`,
      [params.farmerId],
    );
    (payout as PayoutRow).farmer_name = nameRes.rows[0]?.full_name ?? 'Unknown';

    return { payout, approvals: [] };
  },

  async findPayoutById(db, payoutId, forUpdate = false) {
    const res = await db.query<PayoutRow & { farmer_name: string }>(
      `SELECT
         p.id, p.payout_number, p.farmer_id, u.full_name AS farmer_name,
         p.amount::text, p.mode, p.status,
         p.requires_dual_approval, p.initiated_by, p.released_by,
         p.released_at, p.gateway_payout_id, p.failure_reason,
         p.paid_at, null::text AS remarks, p.created_at, p.updated_at
       FROM payouts p
       JOIN farmers f ON f.id = p.farmer_id
       JOIN users u   ON u.id = f.user_id
       WHERE p.id = $1
       ${forUpdate ? 'FOR UPDATE OF p' : ''}`,
      [payoutId],
    );
    if (!res.rows[0]) return null;
    const payout = res.rows[0];

    const approvals = await this._getApprovals(db, payoutId);
    return { payout, approvals };
  },

  async addApproval(db, params) {
    await db.query(
      `INSERT INTO payout_approvals (payout_id, approver_id, approver_role_code, note)
       VALUES ($1, $2, $3, $4)`,
      [params.payoutId, params.approverId, params.approverRoleCode, params.note ?? null],
    );
    return this._getApprovals(db, params.payoutId);
  },

  async updatePayoutStatus(db, params) {
    await db.query(
      `UPDATE payouts SET
         status = $2,
         released_by = COALESCE($3, released_by),
         released_at = COALESCE($4, released_at),
         gateway_payout_id = COALESCE($5, gateway_payout_id),
         failure_reason = COALESCE($6, failure_reason),
         paid_at = COALESCE($7, paid_at),
         updated_at = now()
       WHERE id = $1`,
      [
        params.payoutId,
        params.status,
        params.releasedBy ?? null,
        params.releasedAt ?? null,
        params.gatewayPayoutId ?? null,
        params.failureReason ?? null,
        params.paidAt ?? null,
      ],
    );
  },

  async getFarmerName(db, farmerId) {
    const res = await db.query<{ full_name: string }>(
      `SELECT u.full_name FROM farmers f JOIN users u ON u.id = f.user_id WHERE f.id = $1`,
      [farmerId],
    );
    return res.rows[0]?.full_name ?? null;
  },

  async lockFarmer(db, farmerId) {
    // Same statement as the bank-accounts module's lockFarmer (FOR UPDATE), so the two serialise.
    await db.query(`SELECT id FROM farmers WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, [farmerId]);
  },

  async findActiveBankAccountOfFarmer(db, bankAccountId, farmerId) {
    const res = await db.query(
      `SELECT 1 FROM farmer_bank_accounts WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL`,
      [bankAccountId, farmerId],
    );
    return (res.rowCount ?? 0) > 0;
  },

  async getFarmerUserId(db, farmerId) {
    const res = await db.query<{ user_id: string }>(
      `SELECT user_id FROM farmers WHERE id = $1`,
      [farmerId],
    );
    return res.rows[0]?.user_id ?? null;
  },

  // Internal helper (not part of interface)
  async _getApprovals(db: Executor, payoutId: string): Promise<PayoutApprovalRow[]> {
    const res = await db.query<PayoutApprovalRow>(
      `SELECT approver_id, approved_at FROM payout_approvals WHERE payout_id = $1 ORDER BY approved_at ASC`,
      [payoutId],
    );
    return res.rows;
  },
} as PayoutRepo & { _getApprovals(db: Executor, payoutId: string): Promise<PayoutApprovalRow[]> };
