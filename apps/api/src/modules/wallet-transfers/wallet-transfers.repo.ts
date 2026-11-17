import type { Executor } from '../../db/pool.js';

export interface TransferConfigRaw {
  enabled: unknown;
  minAmount: unknown;
  maxPerTxn: unknown;
  maxDaily: unknown;
  /** 0150: money string, total sent per Asia/Kolkata calendar month. */
  maxMonthly: unknown;
  /** 0150: number of transfers per Asia/Kolkata calendar day. */
  maxDailyCount: unknown;
}

export interface LookupLimitsRaw {
  perCustomerPerHour: unknown;
  perIpPerHour: unknown;
}

export interface CustomerIdentityRow {
  customer_id: string;
  user_id: string;
  full_name: string;
  mobile: string;
}

/** Everything that decides whether a customer may take part in a transfer (BR-150j). */
export interface CustomerEligibilityRow extends CustomerIdentityRow {
  user_status: string;
  user_deleted: boolean;
  customer_deleted: boolean;
  /** Null when the customer has no wallet yet (created on demand). */
  wallet_status: string | null;
}

export interface SentStatsRow {
  /** Money strings. */
  day_total: string;
  day_count: number;
  month_total: string;
}

export interface TransferRow {
  id: string;
  sender_customer_id: string;
  recipient_customer_id: string;
  amount: string;
  note: string | null;
  created_at: Date;
  /** Microsecond UTC text of created_at, for the keyset cursor. */
  cursor_ts: string;
  /** The other party, from the reader's point of view. */
  counterparty_name: string;
  counterparty_mobile: string;
}

export interface AdminTransferRow {
  id: string;
  amount: string;
  note: string | null;
  created_at: Date;
  cursor_ts: string;
  debit_txn_id: string;
  credit_txn_id: string;
  sender_customer_id: string;
  sender_name: string;
  sender_mobile: string;
  recipient_customer_id: string;
  recipient_name: string;
  recipient_mobile: string;
}

export interface AdminTransferFilters {
  customerId?: string | undefined;
  /** Inclusive Asia/Kolkata calendar dates, YYYY-MM-DD. */
  from?: string | undefined;
  to?: string | undefined;
  minAmount?: string | undefined;
  maxAmount?: string | undefined;
}

export interface InsertTransferData {
  id: string;
  senderCustomerId: string;
  recipientCustomerId: string;
  senderWalletId: string;
  recipientWalletId: string;
  amount: string;
  note: string | null;
  debitTxnId: string;
  creditTxnId: string;
  createdBy: string;
}

export interface WalletTransfersRepo {
  getConfig(db: Executor): Promise<TransferConfigRaw>;
  getLookupLimits(db: Executor): Promise<LookupLimitsRaw>;
  /** An active, non-deleted customer (whose wallet, if any, is ACTIVE) with this exact mobile. */
  findCustomerByMobile(db: Executor, mobile: string): Promise<CustomerIdentityRow | null>;
  findCustomerById(db: Executor, customerId: string): Promise<CustomerIdentityRow | null>;
  /** Status of the customer, its user and its wallet, whatever they are. */
  findEligibility(db: Executor, customerId: string): Promise<CustomerEligibilityRow | null>;
  /** Row-lock both wallets in id order so opposite-direction transfers cannot deadlock. */
  lockWallets(db: Executor, walletIds: string[]): Promise<void>;
  /** What the customer sent today and this month (Asia/Kolkata calendar). */
  sentStats(db: Executor, customerId: string): Promise<SentStatsRow>;
  newId(db: Executor): Promise<string>;
  insertTransfer(db: Executor, data: InsertTransferData): Promise<{ created_at: Date }>;
  listForCustomer(
    db: Executor,
    customerId: string,
    after: { ts: string; id: string } | undefined,
    limit: number,
  ): Promise<TransferRow[]>;
  listAdmin(
    db: Executor,
    filters: AdminTransferFilters,
    after: { ts: string; id: string } | undefined,
    limit: number,
  ): Promise<AdminTransferRow[]>;
}

const IST_TODAY = `(date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata')`;
const IST_MONTH = `(date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata')`;

export const walletTransfersRepo: WalletTransfersRepo = {
  async getConfig(db) {
    const res = await db.query<{ key: string; value: unknown }>(
      `SELECT key, value FROM system_config
        WHERE key IN ('wallet_transfer.enabled', 'wallet_transfer.min_amount',
                      'wallet_transfer.max_per_txn', 'wallet_transfer.max_daily',
                      'wallet_transfer.max_per_month', 'wallet_transfer.max_daily_count')`,
    );
    const m = new Map(res.rows.map((r) => [r.key, r.value]));
    return {
      enabled: m.get('wallet_transfer.enabled') ?? null,
      minAmount: m.get('wallet_transfer.min_amount') ?? null,
      maxPerTxn: m.get('wallet_transfer.max_per_txn') ?? null,
      maxDaily: m.get('wallet_transfer.max_daily') ?? null,
      maxMonthly: m.get('wallet_transfer.max_per_month') ?? null,
      maxDailyCount: m.get('wallet_transfer.max_daily_count') ?? null,
    };
  },

  async getLookupLimits(db) {
    const res = await db.query<{ key: string; value: unknown }>(
      `SELECT key, value FROM system_config
        WHERE key IN ('wallet_transfer.lookup_per_hour', 'wallet_transfer.lookup_ip_per_hour')`,
    );
    const m = new Map(res.rows.map((r) => [r.key, r.value]));
    return {
      perCustomerPerHour: m.get('wallet_transfer.lookup_per_hour') ?? null,
      perIpPerHour: m.get('wallet_transfer.lookup_ip_per_hour') ?? null,
    };
  },

  async findCustomerByMobile(db, mobile) {
    const res = await db.query<CustomerIdentityRow>(
      `SELECT c.id AS customer_id, u.id AS user_id, u.full_name, u.mobile
         FROM users u
         JOIN customers c ON c.user_id = u.id
        WHERE u.mobile = $1 AND u.deleted_at IS NULL AND u.status = 'ACTIVE' AND c.deleted_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM wallets w
                           WHERE w.owner_type = 'CUSTOMER' AND w.customer_id = c.id AND w.status <> 'ACTIVE')
        LIMIT 1`,
      [mobile],
    );
    return res.rows[0] ?? null;
  },

  async findCustomerById(db, customerId) {
    const res = await db.query<CustomerIdentityRow>(
      `SELECT c.id AS customer_id, u.id AS user_id, u.full_name, u.mobile
         FROM customers c JOIN users u ON u.id = c.user_id
        WHERE c.id = $1`,
      [customerId],
    );
    return res.rows[0] ?? null;
  },

  async findEligibility(db, customerId) {
    const res = await db.query<CustomerEligibilityRow>(
      `SELECT c.id AS customer_id, u.id AS user_id, u.full_name, u.mobile,
              u.status AS user_status, (u.deleted_at IS NOT NULL) AS user_deleted,
              (c.deleted_at IS NOT NULL) AS customer_deleted,
              (SELECT w.status FROM wallets w WHERE w.owner_type = 'CUSTOMER' AND w.customer_id = c.id LIMIT 1) AS wallet_status
         FROM customers c JOIN users u ON u.id = c.user_id
        WHERE c.id = $1`,
      [customerId],
    );
    return res.rows[0] ?? null;
  },

  async lockWallets(db, walletIds) {
    await db.query(`SELECT id FROM wallets WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE`, [walletIds]);
  },

  async sentStats(db, customerId) {
    const res = await db.query<{ day_total: string; day_count: string; month_total: string }>(
      `SELECT COALESCE(SUM(amount) FILTER (WHERE created_at >= ${IST_TODAY}), 0)::numeric(12,2)::text AS day_total,
              COUNT(*) FILTER (WHERE created_at >= ${IST_TODAY})::text AS day_count,
              COALESCE(SUM(amount), 0)::numeric(12,2)::text AS month_total
         FROM wallet_transfers
        WHERE sender_customer_id = $1
          AND created_at >= ${IST_MONTH}`,
      [customerId],
    );
    const r = res.rows[0];
    return {
      day_total: r?.day_total ?? '0.00',
      day_count: Number(r?.day_count ?? 0),
      month_total: r?.month_total ?? '0.00',
    };
  },

  async newId(db) {
    const res = await db.query<{ id: string }>(`SELECT gen_random_uuid()::text AS id`);
    return res.rows[0]!.id;
  },

  async insertTransfer(db, d) {
    const res = await db.query<{ created_at: Date }>(
      `INSERT INTO wallet_transfers (id, sender_customer_id, recipient_customer_id, sender_wallet_id,
         recipient_wallet_id, amount, note, debit_txn_id, credit_txn_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING created_at`,
      [d.id, d.senderCustomerId, d.recipientCustomerId, d.senderWalletId, d.recipientWalletId,
        d.amount, d.note, d.debitTxnId, d.creditTxnId, d.createdBy],
    );
    return res.rows[0]!;
  },

  async listForCustomer(db, customerId, after, limit) {
    const params: unknown[] = [customerId];
    let keyset = '';
    if (after !== undefined) {
      params.push(after.ts, after.id);
      keyset = `AND (t.created_at, t.id) < ($2::timestamptz, $3::uuid)`;
    }
    params.push(limit + 1);
    const res = await db.query<TransferRow>(
      `SELECT t.id, t.sender_customer_id, t.recipient_customer_id, t.amount::text AS amount, t.note, t.created_at,
              to_char(t.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_ts,
              u.full_name AS counterparty_name, u.mobile AS counterparty_mobile
         FROM wallet_transfers t
         JOIN customers c ON c.id = CASE WHEN t.sender_customer_id = $1 THEN t.recipient_customer_id ELSE t.sender_customer_id END
         JOIN users u ON u.id = c.user_id
        WHERE (t.sender_customer_id = $1 OR t.recipient_customer_id = $1) ${keyset}
        ORDER BY t.created_at DESC, t.id DESC
        LIMIT $${params.length}`,
      params,
    );
    return res.rows;
  },

  async listAdmin(db, f, after, limit) {
    const params: unknown[] = [];
    const where: string[] = [];
    const p = (v: unknown) => { params.push(v); return `$${params.length}`; };
    if (f.customerId !== undefined) {
      const ph = p(f.customerId);
      where.push(`(t.sender_customer_id = ${ph}::uuid OR t.recipient_customer_id = ${ph}::uuid)`);
    }
    if (f.from !== undefined) where.push(`t.created_at >= (${p(f.from)}::date::timestamp AT TIME ZONE 'Asia/Kolkata')`);
    if (f.to !== undefined) where.push(`t.created_at < ((${p(f.to)}::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')`);
    if (f.minAmount !== undefined) where.push(`t.amount >= ${p(f.minAmount)}::numeric`);
    if (f.maxAmount !== undefined) where.push(`t.amount <= ${p(f.maxAmount)}::numeric`);
    if (after !== undefined) where.push(`(t.created_at, t.id) < (${p(after.ts)}::timestamptz, ${p(after.id)}::uuid)`);
    const lim = p(limit + 1);
    const res = await db.query<AdminTransferRow>(
      `SELECT t.id, t.amount::text AS amount, t.note, t.created_at,
              to_char(t.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS cursor_ts,
              t.debit_txn_id, t.credit_txn_id,
              t.sender_customer_id, su.full_name AS sender_name, su.mobile AS sender_mobile,
              t.recipient_customer_id, ru.full_name AS recipient_name, ru.mobile AS recipient_mobile
         FROM wallet_transfers t
         JOIN customers sc ON sc.id = t.sender_customer_id
         JOIN users su ON su.id = sc.user_id
         JOIN customers rc ON rc.id = t.recipient_customer_id
         JOIN users ru ON ru.id = rc.user_id
        ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY t.created_at DESC, t.id DESC
        LIMIT ${lim}`,
      params,
    );
    return res.rows;
  },
};
