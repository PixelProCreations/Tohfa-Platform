import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createHmac, randomUUID } from 'node:crypto';
import { fromPaise, parseMoney, toPaise, type Money } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { config } from '../../config.js';
import { pool } from '../../db/pool.js';
import {
  aScope,
  databaseReady,
  describeIfDatabase,
  newId,
} from '../../test/factories.js';
import { createTopupService } from './topup.service.js';
import { topupRepo, type TopupRepo } from './topup.repo.js';
import { cashTopupCustomerLookupQuery } from './topup.schema.js';
import type { WalletService } from '../wallet/wallet.service.js';
import { MockPaymentGateway } from '../../payments/mock.gateway.js';
import type { Executor } from '../../db/pool.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';

describe('TopupService Unit Tests', () => {
  const mockGateway = new MockPaymentGateway();

  it('rejects topup initiation for non-customer actor', async () => {
    const service = createTopupService({ gateway: mockGateway });
    const actor = {
      userId: newId(),
      roles: [{ code: 'FARMER' as const }],
      farmerId: newId(),
      customerId: null,
    };

    await expect(
      service.createTopup(actor, aScope(), {
        amount: parseMoney('100.00'),
        mode: 'UPI',
      }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    });
  });

  it('rejects topup initiation with non-positive amount', async () => {
    const service = createTopupService({
      gateway: mockGateway,
      walletSvc: {
        getWalletForActor: async () => ({ id: newId(), balance: '0.00' as Money, ownerType: 'CUSTOMER' as const, ownerId: newId(), status: 'ACTIVE' as const, created_at: new Date() }),
      } as unknown as WalletService,
    });
    const actor = {
      userId: newId(),
      roles: [{ code: 'CUSTOMER' as const }],
      farmerId: null,
      customerId: newId(),
    };

    await expect(
      service.createTopup(actor, aScope(), {
        amount: parseMoney('0.00'),
        mode: 'UPI',
      }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      status: 422,
    });
  });

  it('processRazorpayWebhook rejects missing signature with 401', async () => {
    const service = createTopupService({ gateway: mockGateway });
    await expect(
      service.processRazorpayWebhook(
        Buffer.from(JSON.stringify({ event: 'payment.captured' })),
        undefined,
        'evt_1',
      ),
    ).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      status: 401,
    });
  });

  it('processRazorpayWebhook rejects forged signature with 401', async () => {
    const service = createTopupService({ gateway: mockGateway });
    await expect(
      service.processRazorpayWebhook(
        Buffer.from(JSON.stringify({ event: 'payment.captured' })),
        'forged_signature_hex',
        'evt_1',
      ),
    ).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      status: 401,
    });
  });
});

describe('Cash top-up customer lookup (BR-91i, unit)', () => {
  const OOTY = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';
  const firstTimer = {
    customerId: '9d0f2c1e-7a55-4b6e-8f10-2c3d4e5f6a7b',
    customerCode: 'CUST-FIRST-1',
    name: 'First Timer',
    mobile: '+919876543210',
    walletBalance: parseMoney('0.00'),
  };

  function lookupHarness() {
    const calls: unknown[][] = [];
    const repo = {
      lookupCashTopupCustomers: async (...args: unknown[]) => {
        calls.push(args.slice(1));
        return [firstTimer];
      },
    } as unknown as TopupRepo;
    return { calls, service: createTopupService({ repo, db: {} as Executor }) };
  }

  it('BR-91i: a Sub admin finds a first-time customer by exact mobile; no warehouse-history filter is applied and the mobile is masked', async () => {
    const { calls, service } = lookupHarness();
    const subScope = aScope({
      permission: 'wallet.cash_topup.process',
      roleCode: 'SUB_WH_ADMIN',
      warehouseIds: [OOTY],
    });

    const result = await service.lookupCashTopupCustomers(subScope, { mobile: '+919876543210' });

    // The repo receives the match and nothing else: no visible-warehouse list, so a customer
    // with no order, top-up or preferred warehouse here is still found (the BR-91 gate is not applied).
    // (The repo compares the last 10 digits, as the sales counter lookup does.)
    expect(calls).toEqual([[{ kind: 'mobile', digits: '919876543210' }]]);
    expect(result).toEqual({
      items: [
        {
          customerId: firstTimer.customerId,
          customerCode: 'CUST-FIRST-1',
          name: 'First Timer',
          mobileMasked: '*********3210',
          walletBalance: '0.00',
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain('9876543210');
  });

  it('BR-91i: a lookup by customer code passes the trimmed code as an exact match', async () => {
    const { calls, service } = lookupHarness();
    await service.lookupCashTopupCustomers(aScope({ permission: 'wallet.cash_topup.process' }), { code: '  CUST-FIRST-1 ' });
    expect(calls).toEqual([[{ kind: 'code', code: 'CUST-FIRST-1' }]]);
  });

  it('BR-91i: the repo lookup never matches a soft-deleted user, by mobile or by code', async () => {
    const statements: string[] = [];
    const recording = {
      async query(sql: string) {
        statements.push(sql);
        return { rows: [], rowCount: 0 } as never;
      },
    } as unknown as Executor;
    await topupRepo.lookupCashTopupCustomers(recording, { kind: 'mobile', digits: '9876543210' });
    await topupRepo.lookupCashTopupCustomers(recording, { kind: 'code', code: 'CUST-FIRST-1' });
    expect(statements).toHaveLength(2);
    for (const sql of statements) {
      // The users join itself excludes a deleted account, so a recycled mobile cannot surface it.
      expect(sql.replace(/\s+/g, ' ')).toContain('JOIN users u ON u.id = c.user_id AND u.deleted_at IS NULL');
    }
  });

  it('BR-91i: the top-up lookup takes exactly one of mobile or code; a name/partial search (q) is refused, so it cannot be used to browse customers', () => {
    expect(cashTopupCustomerLookupQuery.safeParse({ mobile: '9876543210' }).success).toBe(true);
    expect(cashTopupCustomerLookupQuery.safeParse({ code: 'CUST-FIRST-1' }).success).toBe(true);
    expect(cashTopupCustomerLookupQuery.safeParse({}).success).toBe(false);
    expect(cashTopupCustomerLookupQuery.safeParse({ mobile: '9876543210', code: 'CUST-FIRST-1' }).success).toBe(false);
    expect(cashTopupCustomerLookupQuery.safeParse({ q: 'First' }).success).toBe(false);
    expect(cashTopupCustomerLookupQuery.safeParse({ mobile: '3210' }).success).toBe(false);
  });
});

describe('Cash top-up idempotency (BR-18d, unit)', () => {
  const OOTY = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';
  const CUSTOMER = '9d0f2c1e-7a55-4b6e-8f10-2c3d4e5f6a7b';
  const WALLET = '4a1d2c3b-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
  const actor = { userId: newId(), roles: [{ code: 'SUB_WH_ADMIN' as const, warehouseId: OOTY }], farmerId: null, customerId: null };
  const scope = aScope({ permission: 'wallet.cash_topup.process', roleCode: 'SUB_WH_ADMIN', warehouseIds: [OOTY], userId: actor.userId });
  const body = (overrides: Partial<{ amount: string; fiscalCashTag: string; remarks: string }> = {}) => ({
    amount: parseMoney(overrides.amount ?? '500.00'),
    warehouseId: OOTY,
    fiscalCashTag: overrides.fiscalCashTag ?? 'OOTY-2026-10-14-0001',
    remarks: overrides.remarks ?? 'Cash at counter 1',
  });

  /**
   * A fake repo that behaves like the real table where it matters here: `topups.fiscal_cash_tag`
   * is UNIQUE (0007_money.sql uq_topups_fiscal_cash_tag), so a second insert with a used tag
   * fails with 23505 exactly as Postgres would.
   */
  function cashHarness(cap: string | null = '10000.00') {
    const usedTags = new Set<string>();
    const topupRows: string[] = [];
    const credits: { idempotencyKey: string; amount: string }[] = [];
    let balancePaise = 0;
    const tx = {
      query: async () => ({ rows: [{ id: newId() }], rowCount: 1 }),
    } as unknown as Executor;
    const repo = {
      getCashTopupCap: async () => cap,
      findCustomerWallet: async () => ({ id: WALLET, balance: '0.00' }),
      createCashTopup: async (_db: Executor, params: { fiscalCashTag: string }) => {
        if (usedTags.has(params.fiscalCashTag)) {
          throw Object.assign(new Error('duplicate key value violates unique constraint "uq_topups_fiscal_cash_tag"'), { code: '23505' });
        }
        usedTags.add(params.fiscalCashTag);
        const id = newId();
        topupRows.push(id);
        return { id };
      },
      updateTopupWalletTxn: async () => undefined,
      updateTopupSmsStatus: async () => undefined,
    } as unknown as TopupRepo;
    const walletSvc = {
      move: async (_scope: unknown, input: { idempotencyKey: string; amount: string; refId: string; remarks: string; createdBy: string }) => {
        credits.push({ idempotencyKey: input.idempotencyKey, amount: input.amount });
        balancePaise += toPaise(parseMoney(input.amount));
        return {
          id: newId(),
          walletId: WALLET,
          txnType: 'TOPUP_CASH',
          amount: input.amount,
          balanceAfter: fromPaise(balancePaise),
          refType: 'TOPUP',
          refId: input.refId,
          fiscalCashTag: null,
          warehouseId: null,
          performedBy: input.createdBy,
          performedAt: new Date().toISOString(),
          remarks: input.remarks,
        };
      },
    } as unknown as WalletService;
    const service = createTopupService({
      repo,
      walletSvc,
      db: tx,
      runTx: async (fn) => fn(tx),
      idempotency: createInMemoryIdempotencyStore(),
    });
    return { service, topupRows, credits };
  }

  it('BR-18d: replaying a cash top-up with the same Idempotency-Key and body returns the original response (not 409) and moves money once', async () => {
    const { service, topupRows, credits } = cashHarness();
    const key = newId();

    const first = await service.processCashTopup(actor, scope, CUSTOMER, body(), key);
    const replay = await service.processCashTopup(actor, scope, CUSTOMER, body(), key);

    expect(replay).toEqual(first);
    expect(topupRows).toHaveLength(1);
    expect(credits).toHaveLength(1);
  });

  it('BR-18d: the same Idempotency-Key with a different body is 409 IDEMPOTENCY_KEY_REUSED and writes no second top-up or credit', async () => {
    const { service, topupRows, credits } = cashHarness();
    const key = newId();

    await service.processCashTopup(actor, scope, CUSTOMER, body(), key);
    await expect(
      service.processCashTopup(actor, scope, CUSTOMER, body({ amount: '600.00', fiscalCashTag: 'OOTY-2026-10-14-0002' }), key),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED', status: 409 });
    expect(topupRows).toHaveLength(1);
    expect(credits).toHaveLength(1);
  });

  it('BR-18d: a cash top-up without an Idempotency-Key is 422 VALIDATION_FAILED and writes nothing', async () => {
    const { service, topupRows, credits } = cashHarness();

    await expect(service.processCashTopup(actor, scope, CUSTOMER, body(), undefined)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      status: 422,
    });
    await expect(service.processCashTopup(actor, scope, CUSTOMER, body(), '   ')).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(topupRows).toHaveLength(0);
    expect(credits).toHaveLength(0);
  });

  it('BR-18d: a used fiscal cash tag under a NEW Idempotency-Key is still 409 CONFLICT (a new request, not a replay)', async () => {
    const { service, topupRows, credits } = cashHarness();

    await service.processCashTopup(actor, scope, CUSTOMER, body(), newId());
    await expect(service.processCashTopup(actor, scope, CUSTOMER, body(), newId())).rejects.toMatchObject({
      code: 'CONFLICT',
      status: 409,
    });
    expect(topupRows).toHaveLength(1);
    expect(credits).toHaveLength(1);
  });

  // ---------------------------------------------------------------------------
  // BR-19c / BR-19d: the cap comparison is exact (integer paise), and the cap comes from
  // system_config only. The comparison used to be `Number(amount) > Number(cap)`.
  // ---------------------------------------------------------------------------
  it('BR-19c: an amount one paisa above the cap is refused even where binary floats cannot tell them apart (compared in integer paise, not Number())', async () => {
    // At this magnitude adjacent doubles are 1/64 rupee apart, so Number() rounds both strings to
    // the SAME double and `Number(amount) > Number(cap)` is false: the over-cap amount was accepted.
    // Both values are still exact in integer paise (below Number.MAX_SAFE_INTEGER).
    const cap = '70368744177664.01';
    const amount = '70368744177664.02';
    expect(Number(amount) > Number(cap)).toBe(false); // the float comparison this test replaces
    const { service, topupRows, credits } = cashHarness(cap);
    await expect(service.processCashTopup(actor, scope, CUSTOMER, body({ amount }), newId())).rejects.toMatchObject({
      code: 'CASH_LIMIT_EXCEEDED',
      status: 422,
    });
    expect(topupRows).toHaveLength(0);
    expect(credits).toHaveLength(0);
  });

  it('BR-19c: a cap stored as a decimal string or as a bare number compares exactly: equal is accepted, one paisa more is refused', async () => {
    for (const cap of ['10000.00', '10000', '10000.0']) {
      const accepted = cashHarness(cap);
      await accepted.service.processCashTopup(actor, scope, CUSTOMER, body({ amount: '10000.00' }), newId());
      expect(accepted.credits, cap).toHaveLength(1);

      const refused = cashHarness(cap);
      await expect(
        refused.service.processCashTopup(actor, scope, CUSTOMER, body({ amount: '10000.01' }), newId()),
        cap,
      ).rejects.toMatchObject({ code: 'CASH_LIMIT_EXCEEDED', status: 422 });
      expect(refused.credits, cap).toHaveLength(0);
    }
  });

  it('BR-19d: a malformed system_config cash_topup_cap fails closed (500 INTERNAL, nothing credited); Number() made it NaN, and every amount passed', async () => {
    for (const cap of ['10,000.00', 'ten thousand', '10000.005', '']) {
      const { service, topupRows, credits } = cashHarness(cap);
      await expect(
        service.processCashTopup(actor, scope, CUSTOMER, body({ amount: '50000.00' }), newId()),
        cap,
      ).rejects.toMatchObject({ code: 'INTERNAL', status: 500 });
      expect(topupRows, cap).toHaveLength(0);
      expect(credits, cap).toHaveLength(0);
    }
  });

  it('BR-19d: a missing system_config cash_topup_cap fails closed (500 INTERNAL, nothing credited): there is no literal fallback', async () => {
    const { service, topupRows, credits } = cashHarness(null);
    await expect(service.processCashTopup(actor, scope, CUSTOMER, body(), newId())).rejects.toMatchObject({
      code: 'INTERNAL',
      status: 500,
    });
    expect(topupRows).toHaveLength(0);
    expect(credits).toHaveLength(0);
  });

  it('BR-19d: the repo reads cash_topup_cap from system_config and reports a missing row as null, never a hard-coded 10000.00', async () => {
    const { topupRepo } = await import('./topup.repo.js');
    const executor = (rows: unknown[]): Executor => ({ query: async () => ({ rows, rowCount: rows.length }) }) as unknown as Executor;
    expect(await topupRepo.getCashTopupCap(executor([]))).toBeNull();
    expect(await topupRepo.getCashTopupCap(executor([{ value: null }]))).toBeNull();
    expect(await topupRepo.getCashTopupCap(executor([{ value: 10000 }]))).toBe('10000');
    expect(await topupRepo.getCashTopupCap(executor([{ value: '7500.50' }]))).toBe('7500.50');
  });
});

describeIfDatabase('Topup & Webhook Integration Tests (BR-17b)', () => {
  let ready = false;
  const app = createApp();

  let testUserId: string;
  let testCustomerId: string;
  let testCustomerToken: string;
  const webhookSecret = config.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret';

  beforeAll(async () => {
    ready = await databaseReady('topups');
    if (!ready) return;

    testUserId = newId();
    testCustomerId = newId();
    const rand = Math.floor(100000 + Math.random() * 900000);
    const mobile = `+919911${rand}`;
    const custCode = `CUST-TOPUP-${rand}`;

    await pool.query(`
      INSERT INTO users (id, mobile, full_name, user_type, status)
      VALUES ('${testUserId}', '${mobile}', 'Topup Test User', 'CUSTOMER', 'ACTIVE');

      INSERT INTO customers (id, user_id, customer_code)
      VALUES ('${testCustomerId}', '${testUserId}', '${custCode}');
    `);

    testCustomerToken = signAccessToken({
      sub: testUserId,
      roles: [{ code: 'CUSTOMER' }],
      farmerId: null,
      customerId: testCustomerId,
    });
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  it('BR-17b: POST /v1/wallets/me/topups creates pending intent without crediting balance', async () => {
    if (!ready) return;

    const res = await request(app)
      .post('/v1/wallets/me/topups')
      .set('Authorization', `Bearer ${testCustomerToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '1000.00',
        mode: 'UPI',
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      gateway: 'RAZORPAY',
      amount: '1000.00',
      currency: 'INR',
      status: 'PENDING',
    });
    expect(res.body).toHaveProperty('topupId');
    expect(res.body).toHaveProperty('gatewayOrderId');
    expect(res.body).toHaveProperty('presetAmounts');

    // Verify wallet balance is NOT credited yet
    const walletRes = await pool.query(
      `SELECT w.balance FROM wallets w WHERE w.customer_id = $1`,
      [testCustomerId],
    );
    expect(Number(walletRes.rows[0]!.balance)).toBe(0);
  });

  it('BR-17b: POST /v1/webhooks/razorpay with valid HMAC signature credits wallet exactly once', async () => {
    if (!ready) return;

    // 1. Create topup intent
    const createRes = await request(app)
      .post('/v1/wallets/me/topups')
      .set('Authorization', `Bearer ${testCustomerToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '750.00',
        mode: 'CARD',
      });

    expect(createRes.status).toBe(201);
    const gatewayOrderId = createRes.body.gatewayOrderId;
    const gatewayPaymentId = `pay_${randomUUID().replace(/-/g, '').slice(0, 14)}`;

    // 2. Build signed webhook payload
    const payload = {
      event: 'payment.captured',
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        payment: {
          entity: {
            id: gatewayPaymentId,
            order_id: gatewayOrderId,
            amount: 75000, // 750.00 in paise
            currency: 'INR',
            status: 'captured',
            method: 'card',
          },
        },
      },
    };
    const rawBodyString = JSON.stringify(payload);
    const signature = createHmac('sha256', webhookSecret).update(Buffer.from(rawBodyString, 'utf-8')).digest('hex');

    // 3. Deliver webhook
    const hookRes1 = await request(app)
      .post('/v1/webhooks/razorpay')
      .set('x-razorpay-signature', signature)
      .set('x-razorpay-event-id', `evt_${gatewayPaymentId}`)
      .set('Content-Type', 'application/json')
      .send(rawBodyString);

    expect(hookRes1.status).toBe(200);
    expect(hookRes1.body).toMatchObject({ received: true, duplicate: false });

    // 4. Verify wallet balance credited by 750.00
    const walletRes = await pool.query(
      `SELECT w.balance FROM wallets w WHERE w.customer_id = $1`,
      [testCustomerId],
    );
    expect(Number(walletRes.rows[0]!.balance)).toBe(750);

    // 5. Replay exact same webhook event -> must return duplicate: true and balance unchanged
    const hookRes2 = await request(app)
      .post('/v1/webhooks/razorpay')
      .set('x-razorpay-signature', signature)
      .set('x-razorpay-event-id', `evt_${gatewayPaymentId}`)
      .set('Content-Type', 'application/json')
      .send(rawBodyString);

    expect(hookRes2.status).toBe(200);
    expect(hookRes2.body).toMatchObject({ received: true, duplicate: true });

    // Verify balance remains 750.00 (not doubled)
    const walletRes2 = await pool.query(
      `SELECT w.balance FROM wallets w WHERE w.customer_id = $1`,
      [testCustomerId],
    );
    expect(Number(walletRes2.rows[0]!.balance)).toBe(750);
  });

  it('BR-17b: POST /v1/webhooks/razorpay with forged signature responds 401 and alters nothing', async () => {
    if (!ready) return;

    const payload = {
      event: 'payment.captured',
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        payment: {
          entity: {
            id: 'pay_forged_999',
            amount: 999999,
          },
        },
      },
    };
    const rawBodyString = JSON.stringify(payload);

    const res = await request(app)
      .post('/v1/webhooks/razorpay')
      .set('x-razorpay-signature', 'forged_signature_that_fails_hmac')
      .set('x-razorpay-event-id', 'evt_forged_1')
      .set('Content-Type', 'application/json')
      .send(rawBodyString);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });
});

describeIfDatabase('Admin Cash Top-up & Daily Reconciliation (BR-18, BR-19, S-33)', () => {
  let ready = false;
  const app = createApp();

  let adminUserId: string;
  let adminToken: string;
  let farmerAdminToken: string;
  let testWarehouseId: string;
  let customerUserId: string;
  let customerId: string;

  beforeAll(async () => {
    ready = await databaseReady('topups');
    if (!ready) return;

    adminUserId = newId();
    testWarehouseId = newId();
    customerUserId = newId();
    customerId = newId();
    const farmerAdminUserId = newId();

    const rand = Math.floor(100000 + Math.random() * 900000);
    const adminMobile = `+919811${rand}`;
    const faMobile = `+919822${rand}`;
    const custMobile = `+919833${rand}`;

    await pool.query(`
      INSERT INTO warehouses (id, code, name, type, address_line1, city, state, pincode)
      VALUES ('${testWarehouseId}', 'WH-TEST-${rand}', 'Ooty Test WH', 'MAIN', '123 Hill Rd', 'Ooty', 'Tamil Nadu', '643001');

      INSERT INTO users (id, mobile, full_name, user_type, status)
      VALUES
        ('${adminUserId}', '${adminMobile}', 'Warehouse Admin', 'ADMIN', 'ACTIVE'),
        ('${farmerAdminUserId}', '${faMobile}', 'Farmer Admin', 'ADMIN', 'ACTIVE'),
        ('${customerUserId}', '${custMobile}', 'Cash Topup Customer', 'CUSTOMER', 'ACTIVE');

      INSERT INTO customers (id, user_id, customer_code)
      VALUES ('${customerId}', '${customerUserId}', 'CUST-CASH-${rand}');
    `);

    adminToken = signAccessToken({
      sub: adminUserId,
      roles: [{ code: 'MAIN_WH_ADMIN', warehouseId: testWarehouseId }],
      farmerId: null,
      customerId: null,
    });

    farmerAdminToken = signAccessToken({
      sub: farmerAdminUserId,
      roles: [{ code: 'FARMER_ADMIN' }],
      farmerId: null,
      customerId: null,
    });
  });

  it('BR-18a: Missing fiscal cash tag on a CASH top-up returns 422 FISCAL_TAG_REQUIRED; no ledger row written', async () => {
    if (!ready) return;

    const res = await request(app)
      .post(`/v1/admin/wallets/${customerId}/cash-topup`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '1500.00',
        warehouseId: testWarehouseId,
        fiscalCashTag: '', // Missing / empty tag
      });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('FISCAL_TAG_REQUIRED');

    // Verify no ledger row was written
    const ledgerRes = await pool.query(
      `SELECT wt.id FROM wallet_transactions wt
         JOIN wallets w ON w.id = wt.wallet_id
        WHERE w.customer_id = $1`,
      [customerId],
    );
    expect(ledgerRes.rows).toHaveLength(0);
  });

  it('FARMER_ADMIN gets 403 FORBIDDEN attempting to process cash top-up', async () => {
    if (!ready) return;

    const res = await request(app)
      .post(`/v1/admin/wallets/${customerId}/cash-topup`)
      .set('Authorization', `Bearer ${farmerAdminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '1000.00',
        warehouseId: testWarehouseId,
        fiscalCashTag: `TAG-${newId().slice(0, 8)}`,
      });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('BR-19a: Rs 10,000.01 returns 422 CASH_LIMIT_EXCEEDED; no ledger row written', async () => {
    if (!ready) return;

    const res = await request(app)
      .post(`/v1/admin/wallets/${customerId}/cash-topup`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '10000.01',
        warehouseId: testWarehouseId,
        fiscalCashTag: `TAG-CAP-${newId().slice(0, 8)}`,
      });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('CASH_LIMIT_EXCEEDED');

    // Verify balance remains 0
    const walletRes = await pool.query(
      `SELECT balance FROM wallets WHERE customer_id = $1`,
      [customerId],
    );
    expect(Number(walletRes.rows[0]?.balance ?? 0)).toBe(0);
  });

  it('BR-19b: Rs 10,000.00 exactly is accepted; two consecutive Rs 10,000 top-ups both succeed', async () => {
    if (!ready) return;

    const tag1 = `TAG-OK1-${newId().slice(0, 8)}`;
    const tag2 = `TAG-OK2-${newId().slice(0, 8)}`;

    // Top-up 1: Rs 10,000.00
    const res1 = await request(app)
      .post(`/v1/admin/wallets/${customerId}/cash-topup`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '10000.00',
        warehouseId: testWarehouseId,
        fiscalCashTag: tag1,
        remarks: 'First 10k top-up',
      });

    expect(res1.status).toBe(201);
    expect(res1.body).toMatchObject({
      txnType: 'TOPUP_CASH',
      amount: '10000.00',
      balanceAfter: '10000.00',
    });

    // Top-up 2: Another Rs 10,000.00 (two consecutive 10k allowed per BR-19)
    const res2 = await request(app)
      .post(`/v1/admin/wallets/${customerId}/cash-topup`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '10000.00',
        warehouseId: testWarehouseId,
        fiscalCashTag: tag2,
        remarks: 'Second 10k top-up',
      });

    expect(res2.status).toBe(201);
    expect(res2.body).toMatchObject({
      txnType: 'TOPUP_CASH',
      amount: '10000.00',
      balanceAfter: '20000.00',
    });

    // Verify database topups records have warehouse_id, processed_by, and audit log
    const topupRows = await pool.query(
      `SELECT t.warehouse_id, t.processed_by, t.fiscal_cash_tag, t.status, t.sms_sent_at
         FROM topups t
        WHERE t.fiscal_cash_tag IN ($1, $2)
        ORDER BY t.created_at ASC`,
      [tag1, tag2],
    );
    expect(topupRows.rows).toHaveLength(2);
    expect(topupRows.rows[0]!.warehouse_id).toBe(testWarehouseId);
    expect(topupRows.rows[0]!.processed_by).toBe(adminUserId);
    expect(topupRows.rows[0]!.status).toBe('SUCCESS');
    expect(topupRows.rows[0]!.sms_sent_at).not.toBeNull();
  });

  it('BR-18b: Duplicate fiscal cash tag returns 409 CONFLICT', async () => {
    if (!ready) return;

    const duplicateTag = `TAG-DUP-${newId().slice(0, 8)}`;

    const res1 = await request(app)
      .post(`/v1/admin/wallets/${customerId}/cash-topup`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '2000.00',
        warehouseId: testWarehouseId,
        fiscalCashTag: duplicateTag,
      });
    expect(res1.status).toBe(201);

    // Second request with SAME physical receipt tag -> must fail with 409
    const res2 = await request(app)
      .post(`/v1/admin/wallets/${customerId}/cash-topup`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', newId())
      .send({
        amount: '2000.00',
        warehouseId: testWarehouseId,
        fiscalCashTag: duplicateTag,
      });

    expect(res2.status).toBe(409);
    expect(res2.body.code).toBe('CONFLICT');
  });

  it('BR-18d: a replayed cash top-up (same Idempotency-Key and body) returns the original 201 body, not 409; exactly one topups row and one wallet credit exist', async () => {
    if (!ready) return;

    const key = newId();
    const tag = `TAG-REPLAY-${newId().slice(0, 8)}`;
    const send = () =>
      request(app)
        .post(`/v1/admin/wallets/${customerId}/cash-topup`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', key)
        .send({ amount: '300.00', warehouseId: testWarehouseId, fiscalCashTag: tag });

    const first = await send();
    expect(first.status).toBe(201);
    const replay = await send();
    expect(replay.status).toBe(201);
    expect(replay.body).toEqual(first.body);

    const topups = await pool.query('SELECT id FROM topups WHERE fiscal_cash_tag = $1', [tag]);
    expect(topups.rows).toHaveLength(1);
    const credits = await pool.query(
      `SELECT id FROM wallet_transactions WHERE ref_type = 'TOPUP' AND ref_id = $1`,
      [topups.rows[0]!.id],
    );
    expect(credits.rows).toHaveLength(1);
    expect(credits.rows[0]!.id).toBe(first.body.id);
  });

  it('BR-18d: the same Idempotency-Key with a different body is 409 IDEMPOTENCY_KEY_REUSED and writes nothing more; a missing key is 422', async () => {
    if (!ready) return;

    const key = newId();
    const tag1 = `TAG-REUSE1-${newId().slice(0, 8)}`;
    const tag2 = `TAG-REUSE2-${newId().slice(0, 8)}`;
    const post = (fiscalCashTag: string, amount: string, idemKey?: string) => {
      const req = request(app).post(`/v1/admin/wallets/${customerId}/cash-topup`).set('Authorization', `Bearer ${adminToken}`);
      return (idemKey === undefined ? req : req.set('Idempotency-Key', idemKey)).send({ amount, warehouseId: testWarehouseId, fiscalCashTag });
    };

    expect((await post(tag1, '400.00', key)).status).toBe(201);
    const reused = await post(tag2, '450.00', key);
    expect(reused.status).toBe(409);
    expect(reused.body.code).toBe('IDEMPOTENCY_KEY_REUSED');
    expect((await pool.query('SELECT id FROM topups WHERE fiscal_cash_tag = $1', [tag2])).rows).toHaveLength(0);

    const noKey = await post(`TAG-NOKEY-${newId().slice(0, 8)}`, '100.00');
    expect(noKey.status).toBe(422);
    expect(noKey.body.code).toBe('VALIDATION_FAILED');
  });

  it('BR-91i: GET /admin/wallets/cash-topup/customers/lookup is gated by wallet.cash_topup.process: Main and Sub pass the gate (422 on an empty query, not 403); Farmer Admin, Farmer and Customer are 403; anonymous is 401', async () => {
    if (!ready) return;

    const token = (code: string, extra: Record<string, unknown> = {}) =>
      signAccessToken({ sub: newId(), roles: [{ code, ...extra }] as never, farmerId: null, customerId: null });
    const call = (bearer?: string) => {
      const req = request(app).get('/v1/admin/wallets/cash-topup/customers/lookup');
      return bearer === undefined ? req : req.set('Authorization', `Bearer ${bearer}`);
    };

    expect((await call()).status).toBe(401);
    for (const allowed of [token('MAIN_WH_ADMIN', { warehouseId: testWarehouseId }), token('SUB_WH_ADMIN', { warehouseId: testWarehouseId })]) {
      const res = await call(allowed);
      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    }
    for (const denied of [token('FARMER_ADMIN'), token('FARMER'), token('CUSTOMER')]) {
      const res = await call(denied);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    }
  });

  it('BR-91i: a first-time customer (no order, top-up or preferred warehouse here) is found by a Sub admin by exact mobile and by code for a cash top-up; the general sales lookup still hides them (BR-91 not widened)', async () => {
    if (!ready) return;

    const rand = Math.floor(100000 + Math.random() * 900000);
    const freshUserId = newId();
    const freshCustomerId = newId();
    const freshMobile = `+919844${rand}`;
    const freshCode = `CUST-FIRST-${rand}`;
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'First Visit Customer', 'CUSTOMER', 'ACTIVE')`,
      [freshUserId, freshMobile],
    );
    await pool.query(`INSERT INTO customers (id, user_id, customer_code) VALUES ($1, $2, $3)`, [freshCustomerId, freshUserId, freshCode]);

    const subToken = signAccessToken({
      sub: newId(),
      roles: [{ code: 'SUB_WH_ADMIN', warehouseId: testWarehouseId }],
      farmerId: null,
      customerId: null,
    });
    const topupLookup = (token: string, query: Record<string, string>) =>
      request(app).get('/v1/admin/wallets/cash-topup/customers/lookup').query(query).set('Authorization', `Bearer ${token}`);

    const byMobile = await topupLookup(subToken, { mobile: freshMobile });
    expect(byMobile.status).toBe(200);
    expect(byMobile.body.items).toHaveLength(1);
    expect(byMobile.body.items[0]).toMatchObject({ customerId: freshCustomerId, customerCode: freshCode, name: 'First Visit Customer' });
    expect(byMobile.body.items[0].mobileMasked).toMatch(/^\*+[0-9]{4}$/);
    expect(JSON.stringify(byMobile.body)).not.toContain(freshMobile.slice(-10));

    const byCode = await topupLookup(subToken, { code: freshCode.toLowerCase() });
    expect(byCode.status).toBe(200);
    expect(byCode.body.items.map((c: { customerId: string }) => c.customerId)).toEqual([freshCustomerId]);

    // A partial/name search is not a top-up lookup: refused, so the carve-out cannot browse.
    expect((await topupLookup(subToken, { q: 'First Visit' })).status).toBe(422);

    // BR-91 itself is unchanged: the sales counter lookup still confines a Sub admin to its customers.
    const salesLookup = await request(app)
      .get('/v1/admin/sales/customers/lookup')
      .query({ code: freshCode })
      .set('Authorization', `Bearer ${subToken}`);
    expect(salesLookup.status).toBe(200);
    expect(salesLookup.body).toEqual({ items: [] });
  });

  it('BR-91i: a Main Warehouse Admin can use the top-up lookup (200), while the sales counter lookup stays 403 for Main (BR-85b unchanged)', async () => {
    if (!ready) return;

    const code = (await pool.query<{ customer_code: string }>('SELECT customer_code FROM customers WHERE id = $1', [customerId])).rows[0]!.customer_code;
    const res = await request(app)
      .get('/v1/admin/wallets/cash-topup/customers/lookup')
      .query({ code })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.items.map((c: { customerId: string }) => c.customerId)).toEqual([customerId]);

    const sales = await request(app)
      .get('/v1/admin/sales/customers/lookup')
      .query({ code })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(sales.status).toBe(403);
  });

  it('Daily cash reconciliation job runs and is idempotent', async () => {
    if (!ready) return;

    const { dailyCashReconciliation } = await import('../../jobs/worker.js');

    // Run 1: Today's date
    const todayStr = new Date().toISOString().split('T')[0]!;
    await dailyCashReconciliation({ targetDate: todayStr }, {} as never);

    // Run 2: Repeat exact same reconciliation -> must succeed idempotently
    await dailyCashReconciliation({ targetDate: todayStr }, {} as never);

    const jobRunRes = await pool.query(
      `SELECT status, items_processed FROM job_runs
        WHERE job_name = 'daily-cash-reconciliation'
        ORDER BY started_at DESC LIMIT 1`,
    );
    expect(jobRunRes.rows[0]!.status).toBe('SUCCEEDED');
  });
});
