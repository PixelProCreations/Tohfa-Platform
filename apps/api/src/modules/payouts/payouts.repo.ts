import { parseMoney, toPaise } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { CURSOR_TAGS, encodeKeysetCursor, requireKeysetCursor } from '../../http/keysetCursor.js';
import { MICRO_TS_SQL } from '../../http/microTimestamp.js';
import { maskMobile } from '../sales/sales.math.js';
import type {
  AgeBucket,
  PayoutDue,
  PayoutDuesTotals,
  PayoutDuesQuery,
  ListPayoutsQuery,
  ListPayoutsResponse,
  PayoutListItem,
  PayoutDetailResponse,
  PayoutLinkedItem,
  PayoutAuditEvent,
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
      requiresDualApproval?: boolean;
    },
  ): Promise<{ payout: PayoutRow; approvals: PayoutApprovalRow[] }>;

  insertPayoutItems(
    db: Executor,
    payoutId: string,
    items: Array<{ goodsReceiptId: string; amount: string }>,
  ): Promise<void>;

  getGoodsReceiptsDues(
    db: Executor,
    farmerId: string,
    goodsReceiptIds: string[],
  ): Promise<Array<{
    id: string;
    acceptedValuePaise: number;
    settledAmountPaise: number;
    remainingDuePaise: number;
  }>>;

  listPayoutsForExport(
    db: Executor,
    from?: string,
    to?: string,
  ): Promise<Array<{
    payout_number: string;
    farmer_name: string;
    amount: string;
    status: string;
    created_at: Date;
  }>>;

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
   * BR-31c: the dual-approval threshold, in integer paise, from
   * `system_config.payout_dual_approval_threshold` (stored as rupees, e.g.
   * 10000.00). Read on every request so an admin change takes effect without a
   * deploy. `null` when the key is missing or not a well-formed, non-negative
   * money value — the caller refuses the payout rather than guessing a limit.
   */
  getDualApprovalThresholdPaise(db: Executor): Promise<number | null>;

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

  listPayouts(
    db: Executor,
    query: ListPayoutsQuery,
  ): Promise<ListPayoutsResponse>;

  getPayoutDetail(
    db: Executor,
    payoutId: string,
  ): Promise<PayoutDetailResponse | null>;
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

    // BR-144: Dues = purchase orders/goods receipts where remaining due (accepted value - sum of non-failed payout items) > 0.
    let sql = `
      SELECT
        gr.id                                                                         AS id,
        po.farmer_id                                                                  AS farmer_id,
        f.tohfa_farmer_id                                                             AS tohfa_farmer_id,
        u.full_name                                                                   AS farmer_name,
        gr.purchase_order_id                                                          AS purchase_order_id,
        gr.id                                                                         AS goods_receipt_id,
        ((po.price_per_kg * gr.accepted_qty_kg) - COALESCE(paid.total_paid, 0))::numeric(12,2)::text AS amount_due,
        gr.created_at::date                                                           AS due_since,
        (CURRENT_DATE - gr.created_at::date)::int                                    AS age_days
      FROM goods_receipts gr
      JOIN purchase_orders po ON po.id = gr.purchase_order_id
      JOIN farmers f           ON f.id = po.farmer_id
      JOIN users u             ON u.id = f.user_id
      LEFT JOIN (
        SELECT pi.goods_receipt_id, SUM(pi.amount) AS total_paid
        FROM payout_items pi
        JOIN payouts p ON p.id = pi.payout_id
        WHERE p.status NOT IN ('FAILED', 'REVERSED')
        GROUP BY pi.goods_receipt_id
      ) paid ON paid.goods_receipt_id = gr.id
      WHERE gr.status IN ('ACCEPTED', 'PARTIALLY_ACCEPTED', 'QC_DONE')
        AND gr.accepted_qty_kg > 0
        AND ((po.price_per_kg * gr.accepted_qty_kg) - COALESCE(paid.total_paid, 0)) > 0
    `;

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
        COALESCE(SUM((po.price_per_kg * gr.accepted_qty_kg) - COALESCE(paid.total_paid, 0)), 0)::numeric(12,2)::text AS total_due,
        COUNT(DISTINCT po.farmer_id)::text AS farmer_count
      FROM goods_receipts gr
      JOIN purchase_orders po ON po.id = gr.purchase_order_id
      LEFT JOIN (
        SELECT pi.goods_receipt_id, SUM(pi.amount) AS total_paid
        FROM payout_items pi
        JOIN payouts p ON p.id = pi.payout_id
        WHERE p.status NOT IN ('FAILED', 'REVERSED')
        GROUP BY pi.goods_receipt_id
      ) paid ON paid.goods_receipt_id = gr.id
      WHERE gr.status IN ('ACCEPTED', 'PARTIALLY_ACCEPTED', 'QC_DONE')
        AND gr.accepted_qty_kg > 0
        AND ((po.price_per_kg * gr.accepted_qty_kg) - COALESCE(paid.total_paid, 0)) > 0
    `);

    const totals: PayoutDuesTotals = {
      totalDue: totalsRes.rows[0]?.total_due ?? '0.00',
      farmerCount: parseInt(totalsRes.rows[0]?.farmer_count ?? '0', 10),
    };

    return { items, totals, nextCursor };
  },

  async insertPayoutItems(db, payoutId, items) {
    for (const item of items) {
      await db.query(
        `INSERT INTO payout_items (payout_id, goods_receipt_id, amount)
         VALUES ($1, $2, $3)`,
        [payoutId, item.goodsReceiptId, item.amount],
      );
    }
  },

  async getGoodsReceiptsDues(db, farmerId, goodsReceiptIds) {
    if (goodsReceiptIds.length === 0) return [];
    const res = await db.query<{
      id: string;
      accepted_value: string;
      settled_amount: string;
      remaining_due: string;
    }>(
      `SELECT
         gr.id,
         (po.price_per_kg * gr.accepted_qty_kg)::numeric(12,2)::text AS accepted_value,
         COALESCE(paid.total_paid, 0)::numeric(12,2)::text AS settled_amount,
         ((po.price_per_kg * gr.accepted_qty_kg) - COALESCE(paid.total_paid, 0))::numeric(12,2)::text AS remaining_due
       FROM goods_receipts gr
       JOIN purchase_orders po ON po.id = gr.purchase_order_id
       LEFT JOIN (
         SELECT pi.goods_receipt_id, SUM(pi.amount) AS total_paid
         FROM payout_items pi
         JOIN payouts p ON p.id = pi.payout_id
         WHERE p.status NOT IN ('FAILED', 'REVERSED')
         GROUP BY pi.goods_receipt_id
       ) paid ON paid.goods_receipt_id = gr.id
       WHERE gr.id = ANY($1::uuid[])
         AND po.farmer_id = $2
         AND gr.status IN ('ACCEPTED', 'PARTIALLY_ACCEPTED', 'QC_DONE')
         AND gr.accepted_qty_kg > 0`,
      [goodsReceiptIds, farmerId],
    );
    return res.rows.map((r) => ({
      id: r.id,
      acceptedValuePaise: toPaise(parseMoney(r.accepted_value)),
      settledAmountPaise: toPaise(parseMoney(r.settled_amount)),
      remainingDuePaise: toPaise(parseMoney(r.remaining_due)),
    }));
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
          requires_dual_approval, initiated_by, created_at)
       VALUES ($1, $2, $3, $4, $5, 'REQUESTED', $6, $7, now())
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
        params.requiresDualApproval ?? false,
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

  async getDualApprovalThresholdPaise(db) {
    const res = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'payout_dual_approval_threshold' LIMIT 1`,
    );
    const raw = res.rows[0]?.value;
    if (raw === undefined || raw === null) return null;
    // jsonb 10000.00 arrives as the JS number 10000; parseMoney routes it
    // straight to integer paise and rejects anything not exact to 2 places.
    let paise: number;
    try {
      paise = toPaise(parseMoney(raw));
    } catch {
      return null;
    }
    return paise >= 0 ? paise : null;
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

  async listPayoutsForExport(db, from, to) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (from) {
      params.push(from.length === 10 ? `${from}T00:00:00.000Z` : from);
      conditions.push(`p.created_at >= $${params.length}`);
    }
    if (to) {
      params.push(to.length === 10 ? `${to}T23:59:59.999Z` : to);
      conditions.push(`p.created_at <= $${params.length}`);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const res = await db.query<{
      payout_number: string;
      farmer_name: string;
      amount: string;
      status: string;
      created_at: Date;
    }>(
      `SELECT p.payout_number,
              COALESCE(u.full_name, 'Unknown') AS farmer_name,
              p.amount,
              p.status,
              p.created_at
         FROM payouts p
         JOIN farmers f ON f.id = p.farmer_id
         JOIN users u ON u.id = f.user_id
        ${whereClause}
        ORDER BY p.created_at ASC`,
      params,
    );
    return res.rows;
  },

  // Internal helper (not part of interface)
  async _getApprovals(db: Executor, payoutId: string): Promise<PayoutApprovalRow[]> {
    const res = await db.query<PayoutApprovalRow>(
      `SELECT approver_id, approved_at FROM payout_approvals WHERE payout_id = $1 ORDER BY approved_at ASC`,
      [payoutId],
    );
    return res.rows;
  },

  async listPayouts(db: Executor, query: ListPayoutsQuery): Promise<ListPayoutsResponse> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.status !== undefined) {
      params.push(query.status);
      conditions.push(`p.status = $${params.length}`);
    }
    if (query.farmerId !== undefined) {
      params.push(query.farmerId);
      conditions.push(`p.farmer_id = $${params.length}::uuid`);
    }
    if (query.fromDate !== undefined) {
      params.push(query.fromDate);
      conditions.push(`p.created_at >= $${params.length}::timestamptz`);
    }
    if (query.toDate !== undefined) {
      params.push(query.toDate);
      conditions.push(`p.created_at <= $${params.length}::timestamptz`);
    }
    if (query.cursor !== undefined && query.cursor.length > 0) {
      const after = requireKeysetCursor(CURSOR_TAGS.adminPayouts, query.cursor);
      params.push(after.ts, after.id);
      conditions.push(`(p.created_at, p.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = query.limit ?? 20;
    params.push(limit + 1);

    const result = await db.query<{
      id: string;
      payout_number: string;
      farmer_id: string;
      farmer_name: string;
      amount: string;
      status: string;
      created_at: Date;
      requested_by: string;
      cursor_ts: string;
    }>(
      `SELECT p.id,
              p.payout_number,
              p.farmer_id,
              COALESCE(u_farmer.full_name, 'Unknown') AS farmer_name,
              p.amount::text,
              p.status,
              p.created_at,
              COALESCE(u_init.full_name, 'System') AS requested_by,
              ${MICRO_TS_SQL('p.created_at')} AS cursor_ts
         FROM payouts p
         JOIN farmers f ON f.id = p.farmer_id
         JOIN users u_farmer ON u_farmer.id = f.user_id
         LEFT JOIN users u_init ON u_init.id = p.initiated_by
        ${whereClause}
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT $${params.length}`,
      params,
    );

    const hasMore = result.rows.length > limit;
    const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
    const last = rows[rows.length - 1];
    const nextCursor =
      hasMore && last !== undefined ? encodeKeysetCursor(CURSOR_TAGS.adminPayouts, { ts: last.cursor_ts, id: last.id }) : null;

    const items: PayoutListItem[] = rows.map((r) => ({
      id: r.id,
      payoutNumber: r.payout_number,
      farmerId: r.farmer_id,
      farmerName: r.farmer_name,
      amount: r.amount,
      status: r.status as PayoutListItem['status'],
      requestedAt: new Date(r.created_at).toISOString(),
      requestedBy: r.requested_by,
    }));

    return {
      items,
      page: { nextCursor, hasMore },
      nextCursor,
      hasMore,
    };
  },

  async getPayoutDetail(db: Executor, payoutId: string): Promise<PayoutDetailResponse | null> {
    const payoutRes = await db.query<{
      id: string;
      payout_number: string;
      farmer_id: string;
      farmer_code: string | null;
      farmer_name: string;
      farmer_mobile: string | null;
      amount: string;
      status: string;
      created_at: Date;
      requested_by: string;
      bank_account_last4: string | null;
      failure_reason: string | null;
      released_at: Date | null;
      released_by_name: string | null;
    }>(
      `SELECT p.id,
              p.payout_number,
              p.farmer_id,
              f.tohfa_farmer_id AS farmer_code,
              COALESCE(u_farmer.full_name, 'Unknown') AS farmer_name,
              u_farmer.mobile AS farmer_mobile,
              p.amount::text,
              p.status,
              p.created_at,
              COALESCE(u_init.full_name, 'System') AS requested_by,
              fba.account_number_last4 AS bank_account_last4,
              p.failure_reason,
              p.released_at,
              u_rel.full_name AS released_by_name
         FROM payouts p
         JOIN farmers f ON f.id = p.farmer_id
         JOIN users u_farmer ON u_farmer.id = f.user_id
         LEFT JOIN users u_init ON u_init.id = p.initiated_by
         LEFT JOIN users u_rel ON u_rel.id = p.released_by
         LEFT JOIN farmer_bank_accounts fba ON fba.id = p.bank_account_id
        WHERE p.id = $1`,
      [payoutId],
    );

    const row = payoutRes.rows[0];
    if (!row) return null;

    const itemsRes = await db.query<{
      id: string;
      goods_receipt_id: string;
      amount: string;
      grn_number: string;
      purchase_order_id: string;
      po_number: string;
      po_grade: string;
      po_unit_price: string;
      crop_name: string;
      accepted_qty_kg: string | null;
      accepted_grade: string | null;
    }>(
      `SELECT pi.id,
              pi.goods_receipt_id,
              pi.amount::text,
              gr.grn_number,
              gr.purchase_order_id,
              po.po_number,
              po.grade::text AS po_grade,
              po.price_per_kg::text AS po_unit_price,
              cm.name AS crop_name,
              gr.accepted_qty_kg::text AS accepted_qty_kg,
              qc.assigned_grade::text AS accepted_grade
         FROM payout_items pi
         JOIN goods_receipts gr ON gr.id = pi.goods_receipt_id
         JOIN purchase_orders po ON po.id = gr.purchase_order_id
         JOIN crop_master cm ON cm.id = po.crop_id
         LEFT JOIN quality_checks qc ON qc.goods_receipt_id = gr.id
        WHERE pi.payout_id = $1
        ORDER BY pi.created_at ASC`,
      [payoutId],
    );

    const items: PayoutLinkedItem[] = itemsRes.rows.map((it) => {
      const acceptedQty = it.accepted_qty_kg ?? '0';
      const unitPrice = it.po_unit_price ?? '0';
      const purchaseValue = (parseFloat(acceptedQty) * parseFloat(unitPrice)).toFixed(2);
      return {
        id: it.id,
        purchaseOrderId: it.purchase_order_id,
        purchaseOrderNumber: it.po_number,
        goodsReceiptId: it.goods_receipt_id,
        goodsReceiptNumber: it.grn_number,
        produce: it.crop_name,
        acceptedQuantity: it.accepted_qty_kg,
        acceptedGrade: it.accepted_grade ?? it.po_grade,
        unitPrice: it.po_unit_price,
        purchaseValue,
        amount: it.amount,
      };
    });

    const firstItem = items[0];

    const approvalsRes = await db.query<{
      approver_id: string;
      approver_name: string;
      approver_role_code: string;
      approved_at: Date;
      note: string | null;
    }>(
      `SELECT pa.approver_id,
              u.full_name AS approver_name,
              pa.approver_role_code,
              pa.approved_at,
              pa.note
         FROM payout_approvals pa
         JOIN users u ON u.id = pa.approver_id
        WHERE pa.payout_id = $1
        ORDER BY pa.approved_at ASC`,
      [payoutId],
    );

    const auditRes = await db.query<{
      id: string;
      action_code: string;
      actor_id: string;
      actor_name: string | null;
      outcome: string;
      created_at: Date;
      after: unknown;
    }>(
      `SELECT a.id,
              a.action_code,
              a.actor_id,
              u.full_name AS actor_name,
              a.outcome,
              a.created_at,
              a.after
         FROM audit_log a
         LEFT JOIN users u ON u.id = a.actor_id
        WHERE a.entity_id = $1 AND a.entity_type = 'payouts'
        ORDER BY a.created_at ASC`,
      [payoutId],
    );

    const auditTrail: PayoutAuditEvent[] = auditRes.rows.map((a) => ({
      id: a.id,
      actionCode: a.action_code,
      actorId: a.actor_id,
      actorName: a.actor_name,
      outcome: a.outcome,
      createdAt: new Date(a.created_at).toISOString(),
      details: a.after,
    }));

    const lastApproval = approvalsRes.rows[approvalsRes.rows.length - 1];
    const approverName = lastApproval?.approver_name ?? row.released_by_name ?? null;

    let approvalStatus = row.status;
    if (row.status === 'REQUESTED') approvalStatus = 'Requested';
    else if (row.status === 'PENDING_APPROVAL') approvalStatus = 'Awaiting Super Admin Approval';
    else if (row.status === 'APPROVED') approvalStatus = 'Approved';
    else if (row.status === 'PAID') approvalStatus = 'Paid';
    else if (row.status === 'REJECTED') approvalStatus = 'Rejected';

    const rejectionReason = row.failure_reason ?? approvalsRes.rows.find((a) => a.note)?.note ?? null;

    return {
      id: row.id,
      payoutNumber: row.payout_number,
      farmerId: row.farmer_id,
      farmerName: row.farmer_name,
      amount: row.amount,
      status: row.status as PayoutDetailResponse['status'],
      requestedAt: new Date(row.created_at).toISOString(),
      requestedBy: row.requested_by,
      farmerContact: row.farmer_mobile ? maskMobile(row.farmer_mobile) : null,
      farmerCode: row.farmer_code,
      verifiedPayoutAccount: row.bank_account_last4 ? `•••• ${row.bank_account_last4.trim()}` : null,
      purchaseOrderId: firstItem?.purchaseOrderId ?? null,
      purchaseOrderNumber: firstItem?.purchaseOrderNumber ?? null,
      goodsReceiptId: firstItem?.goodsReceiptId ?? null,
      goodsReceiptNumber: firstItem?.goodsReceiptNumber ?? null,
      produce: firstItem?.produce ?? null,
      acceptedQuantity: firstItem?.acceptedQuantity ?? null,
      acceptedGrade: firstItem?.acceptedGrade ?? null,
      unitPrice: firstItem?.unitPrice ?? null,
      purchaseValue: firstItem?.purchaseValue ?? null,
      items,
      netPayableAmount: row.amount,
      approvedAdjustments: '0.00',
      calculationReference: `CALC-${row.payout_number}`,
      approvalStatus,
      approver: approverName,
      rejectionReason,
      auditTrail,
    };
  },
} as PayoutRepo & { _getApprovals(db: Executor, payoutId: string): Promise<PayoutApprovalRow[]> };
