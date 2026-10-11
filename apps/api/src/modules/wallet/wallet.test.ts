import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, parseMoney, type Money } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { createWalletService } from './wallet.service.js';
import {
  decodeTxnCursor,
  encodeTxnCursor,
  walletRepo,
  type WalletRepo,
  type WalletRow,
  type WalletTransactionRow,
  type WalletTxnListFilters,
  type InsertTransactionData,
  type ListTransactionsResult,
} from './wallet.repo.js';
import {
  IDS,
  aScope,
  describeIfDatabase,
  newId,
} from '../../test/factories.js';
import { ensureStandardUsers, requireDatabaseTables } from '../../test/dbFixtures.js';
import { pool } from '../../db/pool.js';

interface RecordingRepo extends WalletRepo {
  lastFindOwner: string | null;
}

function fakeRepo(rows: WalletRow[]): RecordingRepo {
  const repo: RecordingRepo = {
    lastFindOwner: null,
    async findWalletByOwner(
      _db: Executor,
      ownerType: 'CUSTOMER' | 'FARMER',
      ownerId: string,
    ): Promise<WalletRow | null> {
      repo.lastFindOwner = `${ownerType}:${ownerId}`;
      return rows.find((r) => r.owner_type === ownerType && (r.customer_id === ownerId || r.farmer_id === ownerId)) ?? null;
    },
    async createWallet(
      _db: Executor,
      ownerType: 'CUSTOMER' | 'FARMER',
      ownerId: string,
    ): Promise<WalletRow> {
      const newWallet: WalletRow = {
        id: newId(),
        owner_type: ownerType,
        customer_id: ownerType === 'CUSTOMER' ? ownerId : null,
        farmer_id: ownerType === 'FARMER' ? ownerId : null,
        balance: '0.00',
        currency: 'INR',
        status: 'ACTIVE',
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };
      rows.push(newWallet);
      return newWallet;
    },
    async listTransactions(
      _db: Executor,
      _walletId: string,
      _query: WalletTxnListFilters,
    ): Promise<ListTransactionsResult> {
      return { items: [], nextCursor: null, hasMore: false };
    },
    async findTransactionByIdempotencyKey(
      _db: Executor,
      _key: string,
    ): Promise<WalletTransactionRow | null> {
      return null;
    },
    async insertTransaction(
      _db: Executor,
      _input: InsertTransactionData,
    ): Promise<WalletTransactionRow> {
      return {} as WalletTransactionRow;
    },
  };
  return repo;
}

const noopDb: Executor = {
  query: async () => {
    throw new Error('the fake repo should never reach the database');
  },
};

describe('walletService.getWalletForActor', () => {
  it('resolves and returns wallet for a customer actor', async () => {
    const repo = fakeRepo([]);
    const service = createWalletService({ repo, db: noopDb });

    await service.getWalletForActor({
      userId: IDS.userSuperAdmin,
      roles: [{ code: RoleCode.CUSTOMER }],
      farmerId: null,
      customerId: 'customer-123',
    });

    expect(repo.lastFindOwner).toBe('CUSTOMER:customer-123');
  });

  it('resolves and returns wallet for a farmer actor', async () => {
    const repo = fakeRepo([]);
    const service = createWalletService({ repo, db: noopDb });

    await service.getWalletForActor({
      userId: IDS.userSuperAdmin,
      roles: [{ code: RoleCode.FARMER }],
      farmerId: 'farmer-456',
      customerId: null,
    });

    expect(repo.lastFindOwner).toBe('FARMER:farmer-456');
  });

  it('throws FORBIDDEN for an actor with no customerId or farmerId', async () => {
    const repo = fakeRepo([]);
    const service = createWalletService({ repo, db: noopDb });

    await expect(
      service.getWalletForActor({
        userId: IDS.userSuperAdmin,
        roles: [{ code: RoleCode.SUPER_ADMIN }],
        farmerId: null,
        customerId: null,
      }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});

describe('walletService.listTransactionsForActor cursor', () => {
  const customerActor = {
    userId: IDS.userSuperAdmin,
    roles: [{ code: RoleCode.CUSTOMER }],
    farmerId: null,
    customerId: 'customer-123',
  };

  it('wallet keyset: a cursor that this endpoint did not produce (e.g. a bare uuid) is 422 VALIDATION_FAILED', async () => {
    const repo = fakeRepo([]);
    const service = createWalletService({ repo, db: noopDb });
    await expect(
      service.listTransactionsForActor(customerActor, { limit: 20, tab: 'all', cursor: newId() }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('wallet keyset: the cursor round-trips both ORDER BY columns and is handed to the repo decoded', async () => {
    const repo = fakeRepo([]);
    let received: WalletTxnListFilters | undefined;
    repo.listTransactions = async (_db, _walletId, filters) => {
      received = filters;
      return { items: [], nextCursor: null, hasMore: false };
    };
    const service = createWalletService({ repo, db: noopDb });
    const key = { ts: '2026-01-02T10:00:00.123456Z', id: newId() };
    await service.listTransactionsForActor(customerActor, { limit: 20, tab: 'all', cursor: encodeTxnCursor(key) });
    expect(received?.after).toEqual(key);
    expect(received).not.toHaveProperty('cursor');
  });
});

describe('walletService.move validations', () => {
  it('throws VALIDATION_FAILED if amount is not positive', async () => {
    const repo = fakeRepo([]);
    const service = createWalletService({ repo, db: noopDb });

    await expect(
      service.move(
        aScope(),
        {
          walletId: newId(),
          direction: 'CREDIT',
          type: 'TOPUP_DIGITAL',
          amount: '0.00' as Money,
          idempotencyKey: newId(),
        },
        noopDb,
      ),
    ).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
  });

  it('BR-88: a move inside a caller transaction runs on that client only (no second pooled transaction) and never issues ROLLBACK', async () => {
    const repo = fakeRepo([]);
    repo.insertTransaction = async (_db, input) => ({
      id: newId(),
      wallet_id: input.walletId,
      idempotency_key: input.idempotencyKey,
      direction: input.direction,
      type: input.type,
      amount: input.amount,
      balance_after: input.amount,
      ref_type: null,
      ref_id: null,
      remarks: null,
      created_by: null,
      created_at: new Date(),
      fiscal_cash_tag: null,
      warehouse_id: null,
    });
    const statements: string[] = [];
    const callerTx: Executor = {
      query: (async (sql: string) => {
        statements.push(sql.trim());
        return { rows: [], rowCount: 0 };
      }) as unknown as Executor['query'],
    };
    let ownTransactions = 0;
    const service = createWalletService({
      repo,
      db: noopDb,
      runTx: async (fn) => {
        ownTransactions += 1;
        return fn(noopDb);
      },
    });

    await service.move(
      aScope(),
      { walletId: newId(), direction: 'CREDIT', type: 'TOPUP_DIGITAL', amount: '1.00' as Money, idempotencyKey: newId() },
      callerTx,
    );

    expect(ownTransactions).toBe(0);
    expect(statements.some((s) => /^ROLLBACK\b(?! TO SAVEPOINT)/i.test(s))).toBe(false);
  });
});

describeIfDatabase('walletService (integration)', () => {
  let ready = false;
  let testUserId: string;
  let testCustomerId: string;
  let testFarmerId: string;
  let testZoneId: string;

  beforeAll(async () => {
    // Throws when a DATABASE_URL is configured but the schema is unreachable/unmigrated.
    ready = await requireDatabaseTables('wallets', 'users', 'customers', 'farmers', 'zones');
    if (!ready) return;

    // service.move stamps scope.userId (aScope() => IDS.userSuperAdmin) into
    // wallet_transactions.created_by, an FK to users. That user used to exist only
    // because golden-thread.e2e had committed it; create it here instead.
    await ensureStandardUsers(pool, 'userSuperAdmin');

    testUserId = newId();
    testCustomerId = newId();
    testFarmerId = newId();
    testZoneId = newId();

    const rand = Math.floor(100000 + Math.random() * 900000);
    // Prefix is +919997, not +919999: at rand's top value (999999) a +919999
    // prefix reproduces farmer-applications.test.ts's hardcoded '+919999999999'
    // mobile character-for-character, colliding on uq_users_mobile_live.
    const mobileCust = `+919997${rand}`;
    const mobileFarm = `+919998${rand}`;
    const customerCode = `CUST-W-${rand}`;
    const farmerIdCode = `TF-W-${rand}`;

    // Setup foreign key dependencies
    await pool.query(`
      INSERT INTO users (id, mobile, full_name, user_type, status)
      VALUES 
        ('${testUserId}', '${mobileCust}', 'Wallet Test Cust User', 'CUSTOMER', 'ACTIVE'),
        ('${newId()}', '${mobileFarm}', 'Wallet Test Farm User', 'FARMER', 'ACTIVE');

      INSERT INTO zones (id, code, name, is_active)
      VALUES ('${testZoneId}', 'ZONE_W_${rand}', 'Wallet Test Zone ${rand}', true);

      INSERT INTO customers (id, user_id, customer_code)
      VALUES ('${testCustomerId}', '${testUserId}', '${customerCode}');

      INSERT INTO farmers (id, user_id, tohfa_farmer_id, zone_id, application_status, kyc_status)
      VALUES ('${testFarmerId}', (SELECT id FROM users WHERE mobile = '${mobileFarm}'), '${farmerIdCode}', '${testZoneId}', 'APPROVED', 'VERIFIED');
    `);
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  it('BR-35: ledger sum equals cached balance', async (ctx) => {
    if (!ready) return ctx.skip();

    const service = createWalletService();
    
    // Create wallets
    const custWallet = await service.getWalletForActor({
      userId: testUserId,
      roles: [{ code: RoleCode.CUSTOMER }],
      farmerId: null,
      customerId: testCustomerId,
    });

    const farmWallet = await service.getWalletForActor({
      userId: newId(),
      roles: [{ code: RoleCode.FARMER }],
      farmerId: testFarmerId,
      customerId: null,
    });

    // Seed initial balance to avoid overdraws: credit ₹5000.00 to both
    const scope = aScope();
    await service.move(scope, {
      walletId: custWallet.id,
      direction: 'CREDIT',
      type: 'TOPUP_DIGITAL',
      amount: parseMoney('5000.00'),
      idempotencyKey: newId(),
    });

    await service.move(scope, {
      walletId: farmWallet.id,
      direction: 'CREDIT',
      type: 'TOPUP_DIGITAL',
      amount: parseMoney('5000.00'),
      idempotencyKey: newId(),
    });

    // Run 500 randomized concurrent operations
    const operations = Array.from({ length: 500 }, () => {
      const isCredit = Math.random() > 0.4; // 60% credit, 40% debit
      const amount = (Math.floor(Math.random() * 5) + 1).toFixed(2); // ₹1 to ₹5
      const isCustomer = Math.random() > 0.5;
      const walletId = isCustomer ? custWallet.id : farmWallet.id;
      const direction: 'CREDIT' | 'DEBIT' = isCredit ? 'CREDIT' : 'DEBIT';

      return {
        walletId,
        direction,
        type: 'ORDER_DEBIT' as const,
        amount: parseMoney(amount),
        idempotencyKey: newId(),
      };
    });

    // Execute concurrently
    await Promise.all(
      operations.map((op) =>
        service.move(scope, op).catch((err) => {
          // Ignore overdraws in case they occur
          if (err.code !== 'WALLET_INSUFFICIENT') throw err;
        })
      )
    );

    // Verify wallets balance in database equals ledger sum
    for (const walletId of [custWallet.id, farmWallet.id]) {
      const walletRes = await pool.query('SELECT balance FROM wallets WHERE id = $1', [walletId]);
      const dbBalance = Number(walletRes.rows[0]!.balance);

      const ledgerRes = await pool.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE -amount END), 0) AS sum
        FROM wallet_transactions 
        WHERE wallet_id = $1
      `, [walletId]);
      const ledgerSum = Number(ledgerRes.rows[0]!.sum);

      expect(dbBalance).toBeCloseTo(ledgerSum, 2);
    }
    // 500 concurrent money moves take ~2s on an idle local Postgres and exceeded vitest's default
    // 5s whenever the machine/database was busy (flaky 5s timeout, not an assertion failure).
  }, 60_000);

  it('BR-17b: one idempotency key moves money once', async (ctx) => {
    if (!ready) return ctx.skip();

    const service = createWalletService();
    
    const wallet = await service.getWalletForActor({
      userId: testUserId,
      roles: [{ code: RoleCode.CUSTOMER }],
      farmerId: null,
      customerId: testCustomerId,
    });

    const idempotencyKey = newId();
    const scope = aScope();

    // Call service concurrently with same idempotency key 10 times
    const results = await Promise.all(
      Array.from({ length: 10 }).map(() =>
        service.move(
          scope,
          {
            walletId: wallet.id,
            direction: 'CREDIT',
            type: 'TOPUP_DIGITAL',
            amount: parseMoney('123.45'),
            idempotencyKey,
          },
        )
      )
    );

    // Assert that all calls return the exact same transaction ID
    const txId = results[0]!.id;
    for (const res of results) {
      expect(res.id).toBe(txId);
    }

    // Assert that only exactly one row is in wallet_transactions for this idempotency key
    const dbRes = await pool.query(
      'SELECT count(*) FROM wallet_transactions WHERE idempotency_key = $1',
      [idempotencyKey],
    );
    expect(dbRes.rows[0]!.count).toBe('1');
  });

  it('BR-88: a replayed idempotency key inside the caller transaction returns the original row and keeps the caller transaction alive (SAVEPOINT, not ROLLBACK)', async (ctx) => {
    if (!ready) return ctx.skip();

    const service = createWalletService();
    const wallet = await service.getWalletForActor({
      userId: testUserId,
      roles: [{ code: RoleCode.CUSTOMER }],
      farmerId: null,
      customerId: testCustomerId,
    });
    const idempotencyKey = newId();
    const input = {
      walletId: wallet.id,
      direction: 'CREDIT' as const,
      type: 'TOPUP_DIGITAL' as const,
      amount: parseMoney('7.00'),
      idempotencyKey,
    };

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const first = await service.move(aScope(), input, client);
      // The same key again on the same client hits wallet_transactions' unique key (23505).
      const second = await service.move(aScope(), input, client);
      expect(second.id).toBe(first.id);

      // The caller's transaction is still usable and still holds the first move.
      const inTx = await client.query<{ count: string }>(
        'SELECT count(*)::text AS count FROM wallet_transactions WHERE idempotency_key = $1',
        [idempotencyKey],
      );
      expect(inTx.rows[0]!.count).toBe('1');
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }

    // The caller rolled back, so nothing of the move survived: proof it was in the caller's tx.
    const after = await pool.query<{ count: string }>(
      'SELECT count(*)::text AS count FROM wallet_transactions WHERE idempotency_key = $1',
      [idempotencyKey],
    );
    expect(after.rows[0]!.count).toBe('0');
  });

  it('wallet keyset: paging by (created_at DESC, id DESC) neither skips nor repeats a row when ids are not in time order', async (ctx) => {
    if (!ready) return ctx.skip();

    // Three rows whose uuids sort AGAINST their time: newest has a mid id, the middle one the
    // largest, the oldest the smallest. A cursor on `id` alone (`t.id < $cursor`) jumps from the
    // newest straight to the oldest and never returns the middle row.
    // Random ids (a rerun never collides) with a forced leading hex digit to fix their sort order.
    const withLead = (lead: string): string => `${lead}${newId().slice(1)}`;
    const newest = withLead('5');
    const middle = withLead('f');
    const oldest = withLead('0');
    const client = await pool.connect();
    let open = false;
    try {
      await client.query('BEGIN');
      open = true;
      const userId = newId();
      const customerId = newId();
      const walletId = newId();
      const suffix = Date.now().toString().slice(-8);
      await client.query(
        `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'Wallet Keyset User', 'CUSTOMER', 'ACTIVE')`,
        [userId, `+9166${suffix}${Math.floor(100 + Math.random() * 900)}`],
      );
      await client.query(`INSERT INTO customers (id, user_id, customer_code) VALUES ($1, $2, $3)`, [
        customerId,
        userId,
        `CUST-KEYSET-${suffix}`,
      ]);
      await client.query(
        `INSERT INTO wallets (id, owner_type, customer_id, balance, currency, status) VALUES ($1, 'CUSTOMER', $2, '0.00', 'INR', 'ACTIVE')`,
        [walletId, customerId],
      );
      for (const [id, at] of [
        [oldest, '2026-01-01T10:00:00Z'],
        [middle, '2026-01-02T10:00:00Z'],
        [newest, '2026-01-03T10:00:00Z'],
      ] as const) {
        await client.query(
          `INSERT INTO wallet_transactions (id, wallet_id, idempotency_key, direction, type, amount, balance_after, created_at)
           VALUES ($1, $2, $3, 'CREDIT', 'TOPUP_DIGITAL', '1.00', '0.00', $4)`,
          [id, walletId, newId(), at],
        );
      }

      const seen: string[] = [];
      let cursor: string | undefined;
      for (let guard = 0; guard < 5; guard += 1) {
        const page = await walletRepo.listTransactions(client, walletId, {
          limit: 1,
          tab: 'all',
          ...(cursor === undefined ? {} : { after: decodeTxnCursor(cursor)! }),
        });
        seen.push(...page.items.map((t) => t.id));
        if (!page.hasMore) break;
        expect(page.nextCursor).not.toBeNull();
        cursor = page.nextCursor!;
      }
      expect(seen).toEqual([newest, middle, oldest]);
    } finally {
      // Always roll back, also when an assertion failed: a released client with an open
      // transaction would let a later test commit these fixture rows.
      if (open) await client.query('ROLLBACK');
      client.release();
    }
  });

  it('throws WALLET_INSUFFICIENT on overdraw', async (ctx) => {
    if (!ready) return ctx.skip();

    const service = createWalletService();
    
    // Create new user & wallet to guarantee 0 balance
    const userId = newId();
    const customerId = newId();
    const randCode = Math.floor(100000 + Math.random() * 900000);
    // +9177 also appears in payouts.test.ts, but at a different total digit
    // length (14 here vs its 12), so the strings can never match — don't
    // shorten this suffix. Disjoint from the +9199... fixtures
    // (mobileCust/mobileFarm above, topup.test.ts, farmer-applications'
    // fixed mobile) via the differing 3rd/4th digit instead.
    const mobile = `+9177${Date.now().toString().slice(-7)}${Math.floor(100 + Math.random() * 900)}`;
    const custCode = `CUST-OVERDRAW-${randCode}`;
    await pool.query(`
      INSERT INTO users (id, mobile, full_name, user_type, status)
      VALUES ('${userId}', '${mobile}', 'Wallet Overdraw User', 'CUSTOMER', 'ACTIVE');
      INSERT INTO customers (id, user_id, customer_code)
      VALUES ('${customerId}', '${userId}', '${custCode}');
    `);

    const wallet = await service.getWalletForActor({
      userId,
      roles: [{ code: RoleCode.CUSTOMER }],
      farmerId: null,
      customerId,
    });

    // Try to debit ₹1.00 from ₹0.00 balance
    await expect(
      service.move(
        aScope(),
        {
          walletId: wallet.id,
          direction: 'DEBIT',
          type: 'ORDER_DEBIT',
          amount: parseMoney('1.00'),
          idempotencyKey: newId(),
        },
      ),
    ).rejects.toMatchObject({
      code: 'WALLET_INSUFFICIENT',
      status: 402,
    });
  });
});
