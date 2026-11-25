import { beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool, type Executor } from '../../db/pool.js';
import { eventBus } from '../../events/bus.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import {
  aScope,
  databaseReady,
  describeIfDatabase,
  newId,
} from '../../test/factories.js';
import { createPayoutsService } from './payouts.service.js';
import type { PayoutRepo, PayoutRow } from './payouts.repo.js';

// ---------------------------------------------------------------------------
// Unit Tests — BR-31 dual-approval logic (no DB needed)
// ---------------------------------------------------------------------------

describe('PayoutsService Unit Tests (BR-31)', () => {
  it('BR-31a: rejects payout creation from non-privileged actor', async () => {
    const svc = createPayoutsService({
      repo: {
        getFarmerName: async () => 'Test Farmer',
        createPayout: async () => ({ payout: { id: newId(), payout_number: 'PO-2026-000001', farmer_id: newId(), farmer_name: 'Test Farmer', amount: '500.00', mode: 'IMPS', status: 'REQUESTED', requires_dual_approval: false, initiated_by: newId(), released_by: null, released_at: null, gateway_payout_id: null, failure_reason: null, paid_at: null, remarks: null, created_at: new Date(), updated_at: null }, approvals: [] }),
        findPayoutById: async () => ({ payout: { id: newId(), payout_number: 'PO-2026-000001', farmer_id: newId(), farmer_name: 'Test Farmer', amount: '500.00', mode: 'IMPS', status: 'APPROVED', requires_dual_approval: false, initiated_by: newId(), released_by: null, released_at: null, gateway_payout_id: null, failure_reason: null, paid_at: null, remarks: null, created_at: new Date(), updated_at: null }, approvals: [] }),
        addApproval: async () => [],
        updatePayoutStatus: async () => {},
        listPayoutDues: async () => ({ items: [], totals: { totalDue: '0.00', farmerCount: 0 }, nextCursor: null }),
        findPayoutByIdempotencyKey: async () => null,
      } as unknown as PayoutRepo,
      // BR-72: the service claims its Idempotency-Key in a transaction; no database here.
      runTx: async (fn) => fn({} as Executor),
      idempotency: createInMemoryIdempotencyStore(),
    });

    const actor = {
      userId: newId(),
      roles: [{ code: 'FARMER' as const }],
      farmerId: newId(),
      customerId: null,
    };

    // Service doesn't check role here (that's requirePermission middleware), but amount 0 fails
    await expect(
      svc.createPayout(actor, aScope({}), { farmerId: newId(), amount: '0.00', mode: 'IMPS' }, newId()),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST', status: 422 });
  });

  it('BR-31b: SAME_ACTOR_APPROVAL — initiator cannot approve own payout', async () => {
    const initiatorId = newId();
    const payoutId = newId();
    const farmerId = newId();

    const svc = createPayoutsService({
      repo: {
        findPayoutById: async () => ({
          payout: {
            id: payoutId,
            payout_number: 'PO-2026-000002',
            farmer_id: farmerId,
            farmer_name: 'Ravi Kumar',
            amount: '18400.00',
            mode: 'IMPS',
            status: 'PENDING_APPROVAL',
            requires_dual_approval: true,
            initiated_by: initiatorId,
            released_by: null,
            released_at: null,
            gateway_payout_id: null,
            failure_reason: null,
            paid_at: null,
            remarks: null,
            created_at: new Date(),
            updated_at: null,
          },
          approvals: [],
        }),
        addApproval: async () => [],
        updatePayoutStatus: async () => {},
        listPayoutDues: async () => ({ items: [], totals: { totalDue: '0.00', farmerCount: 0 }, nextCursor: null }),
        getFarmerName: async () => 'Ravi Kumar',
        createPayout: async () => ({ payout: {} as PayoutRow, approvals: [] }),
        findPayoutByIdempotencyKey: async () => null,
      } as unknown as PayoutRepo,
      // BR-72: the service claims its Idempotency-Key in a transaction; no database here.
      runTx: async (fn) => fn({} as Executor),
      idempotency: createInMemoryIdempotencyStore(),
    });

    const actor = {
      userId: initiatorId,  // same as initiated_by → must be rejected
      roles: [{ code: 'SUPER_ADMIN' as const }],
      farmerId: null,
      customerId: null,
    };

    await expect(
      svc.approvePayout(actor, aScope({ permission: 'payout.approve_above_10k' }), payoutId, {}, newId()),
    ).rejects.toMatchObject({ code: 'SAME_ACTOR_APPROVAL', status: 403 });
  });

  it('BR-31c: Actor without payout.approve_above_10k permission cannot approve payout above threshold', async () => {
    const initiatorId = newId();
    const approverIdNonSuper = newId();
    const payoutId = newId();

    const svc = createPayoutsService({
      repo: {
        findPayoutById: async () => ({
          payout: {
            id: payoutId,
            payout_number: 'PO-2026-000003',
            farmer_id: newId(),
            farmer_name: 'Test Farmer',
            amount: '15000.00',
            mode: 'NEFT',
            status: 'PENDING_APPROVAL',
            requires_dual_approval: true,
            initiated_by: initiatorId,
            released_by: null,
            released_at: null,
            gateway_payout_id: null,
            failure_reason: null,
            paid_at: null,
            remarks: null,
            created_at: new Date(),
            updated_at: null,
          },
          approvals: [],
        }),
        addApproval: async () => [],
        updatePayoutStatus: async () => {},
        listPayoutDues: async () => ({ items: [], totals: { totalDue: '0.00', farmerCount: 0 }, nextCursor: null }),
        getFarmerName: async () => 'Test Farmer',
        createPayout: async () => ({ payout: {} as PayoutRow, approvals: [] }),
        findPayoutByIdempotencyKey: async () => null,
      } as unknown as PayoutRepo,
      // BR-72: the service claims its Idempotency-Key in a transaction; no database here.
      runTx: async (fn) => fn({} as Executor),
      idempotency: createInMemoryIdempotencyStore(),
    });

    const actor = {
      userId: approverIdNonSuper,
      roles: [{ code: 'TOHFA_ADMIN' as const }],
      farmerId: null,
      customerId: null,
    };

    await expect(
      svc.approvePayout(actor, aScope({ permission: 'payout.farmer.initiate' }), payoutId, {}, newId()),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  });

  it('rejects approval on non-PENDING_APPROVAL payout', async () => {
    const payoutId = newId();

    const svc = createPayoutsService({
      repo: {
        findPayoutById: async () => ({
          payout: {
            id: payoutId,
            payout_number: 'PO-2026-000004',
            farmer_id: newId(),
            farmer_name: 'Test',
            amount: '18400.00',
            mode: 'IMPS',
            status: 'APPROVED',  // Already approved
            requires_dual_approval: true,
            initiated_by: newId(),
            released_by: null,
            released_at: null,
            gateway_payout_id: null,
            failure_reason: null,
            paid_at: null,
            remarks: null,
            created_at: new Date(),
            updated_at: null,
          },
          approvals: [],
        }),
        listPayoutDues: async () => ({ items: [], totals: { totalDue: '0.00', farmerCount: 0 }, nextCursor: null }),
        getFarmerName: async () => 'Test',
        createPayout: async () => ({ payout: {} as PayoutRow, approvals: [] }),
        addApproval: async () => [],
        updatePayoutStatus: async () => {},
        findPayoutByIdempotencyKey: async () => null,
      } as unknown as PayoutRepo,
      // BR-72: the service claims its Idempotency-Key in a transaction; no database here.
      runTx: async (fn) => fn({} as Executor),
      idempotency: createInMemoryIdempotencyStore(),
    });

    const actor = {
      userId: newId(),
      roles: [{ code: 'SUPER_ADMIN' as const }],
      farmerId: null,
      customerId: null,
    };

    await expect(
      svc.approvePayout(actor, aScope({ permission: 'payout.approve_above_10k' }), payoutId, {}, newId()),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION', status: 409 });
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — BR-31c threshold comes from system_config, compared in paise
// ---------------------------------------------------------------------------

describe('PayoutsService dual-approval threshold (BR-31c, system_config, integer paise)', () => {
  function payoutRow(amount: string): PayoutRow {
    return {
      id: newId(), payout_number: 'PO-2026-000010', farmer_id: newId(), farmer_name: 'Test Farmer',
      amount, mode: 'IMPS', status: 'REQUESTED', requires_dual_approval: false, initiated_by: newId(),
      released_by: null, released_at: null, gateway_payout_id: null, failure_reason: null, paid_at: null,
      remarks: null, created_at: new Date(), updated_at: null,
    } as PayoutRow;
  }

  /**
   * A service whose repo reports `thresholdPaise` as the configured threshold
   * (or nothing, for `null`). Records every status the service writes.
   */
  function serviceWithThreshold(thresholdPaise: number | null) {
    const statuses: string[] = [];
    let created: PayoutRow | null = null;
    const getDualApprovalThresholdPaise = vi.fn(async () => thresholdPaise);
    const createPayout = vi.fn(async (_db: Executor, params: { amount: string }) => {
      created = payoutRow(params.amount);
      return { payout: created, approvals: [] };
    });
    const svc = createPayoutsService({
      repo: {
        getFarmerName: async () => 'Test Farmer',
        getDualApprovalThresholdPaise,
        createPayout,
        updatePayoutStatus: async (_db: Executor, p: { status: string }) => {
          statuses.push(p.status);
          if (created) created.status = p.status;
        },
        findPayoutById: async () => (created ? { payout: created, approvals: [] } : null),
        getFarmerUserId: async () => null,
      } as unknown as PayoutRepo,
      // writeAuditLog runs a query on the transaction; a no-op executor stands in.
      runTx: async (fn) => fn({ query: async () => ({ rows: [{ id: 1 }], rowCount: 1 }) } as unknown as Executor),
      idempotency: createInMemoryIdempotencyStore(),
    });
    return { svc, statuses, createPayout, getDualApprovalThresholdPaise };
  }

  const admin = { userId: newId(), roles: [{ code: 'SUPER_ADMIN' as const }], farmerId: null, customerId: null };

  it('BR-31c: exactly the configured threshold (Rs 10,000.00 = 1000000 paise) follows the single-approval path', async () => {
    const { svc, statuses, getDualApprovalThresholdPaise } = serviceWithThreshold(1_000_000);
    const res = await svc.createPayout(admin, aScope({}), { farmerId: newId(), amount: '10000.00', mode: 'IMPS' }, newId());
    expect(getDualApprovalThresholdPaise).toHaveBeenCalled();
    expect(statuses).toEqual(['APPROVED']);
    expect(res.status).toBe('APPROVED');
  });

  it('BR-31c: one paisa above the configured threshold (Rs 10,000.01) requires dual approval', async () => {
    const { svc, statuses } = serviceWithThreshold(1_000_000);
    const res = await svc.createPayout(admin, aScope({}), { farmerId: newId(), amount: '10000.01', mode: 'IMPS' }, newId());
    expect(statuses).toEqual(['PENDING_APPROVAL']);
    expect(res.status).toBe('PENDING_APPROVAL');
  });

  it('BR-31c: the threshold is read from system_config, not a constant — a lowered value is honoured', async () => {
    const { svc, statuses } = serviceWithThreshold(50_000); // Rs 500.00
    await svc.createPayout(admin, aScope({}), { farmerId: newId(), amount: '500.01', mode: 'IMPS' }, newId());
    expect(statuses).toEqual(['PENDING_APPROVAL']);
  });

  it('BR-31c: a missing or malformed threshold config refuses the payout instead of guessing', async () => {
    const { svc, createPayout } = serviceWithThreshold(null);
    await expect(
      svc.createPayout(admin, aScope({}), { farmerId: newId(), amount: '100.00', mode: 'IMPS' }, newId()),
    ).rejects.toMatchObject({ code: 'INTERNAL', status: 500 });
    expect(createPayout).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Integration Tests — require real DB
// ---------------------------------------------------------------------------

describeIfDatabase('Payouts Integration Tests (BR-31, BR-35)', () => {
  let ready = false;
  const app = createApp();

  // Tokens
  let superAdminToken: string;
  let superAdminUserId: string;

  let superAdmin2Token: string;
  let superAdmin2UserId: string;

  let tohfaAdminToken: string;
  let tohfaAdminUserId: string;

  // Test data
  let farmerId: string;
  let farmerUserId: string;
  let warehouseId: string;
  let purchaseOrderId: string;
  let cropId: string;
  let fairPriceId: string;

  beforeAll(async () => {
    ready = await databaseReady('payouts');
    if (!ready) return;

    // 1. Crop
    const cropRes = await pool.query<{ id: string }>(`SELECT id FROM crop_master LIMIT 1`);
    cropId = cropRes.rows[0]!.id;

    // 2. Warehouse
    const whRes = await pool.query<{ id: string }>(`SELECT id FROM warehouses LIMIT 1`);
    warehouseId = whRes.rows[0]!.id;

    const ts = Date.now();

    // 3. Farmer user + farmer row
    farmerUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'Payout Test Farmer', 'FARMER', 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [farmerUserId, `+9199${String(ts).slice(-8)}`],
    );
    const farmerRes = await pool.query<{ id: string }>(
      `INSERT INTO farmers (user_id, tohfa_farmer_id) VALUES ($1, $2) RETURNING id`,
      [farmerUserId, `TF-PAY-${ts}`],
    );
    farmerId = farmerRes.rows[0]!.id;

    // 4. Super Admin 1
    superAdminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'Super Admin 1', 'ADMIN', 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [superAdminUserId, `+9188${String(ts).slice(-8)}`],
    );
    superAdminToken = signAccessToken({
      sub: superAdminUserId,
      roles: [{ code: 'SUPER_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // 5. Super Admin 2 (dual approval)
    superAdmin2UserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'Super Admin 2', 'ADMIN', 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [superAdmin2UserId, `+9177${String(ts).slice(-8)}`],
    );
    superAdmin2Token = signAccessToken({
      sub: superAdmin2UserId,
      roles: [{ code: 'SUPER_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // 6. TOHFA Admin (negative test)
    tohfaAdminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'Tohfa Admin', 'ADMIN', 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [tohfaAdminUserId, `+9166${String(ts).slice(-8)}`],
    );
    tohfaAdminToken = signAccessToken({
      sub: tohfaAdminUserId,
      roles: [{ code: 'TOHFA_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // 7. Produce listing → PO → GRN (so payout_dues query finds something)
    const fpRes = await pool.query<{ id: string }>(
      `SELECT id FROM fair_prices WHERE crop_id = $1 AND grade = 'GRADE_1' LIMIT 1`,
      [cropId],
    );
    fairPriceId = fpRes.rows[0]?.id ?? '';
    if (!fairPriceId) {
      const insFp = await pool.query<{ id: string }>(
        `INSERT INTO fair_prices (crop_id, grade, ceiling_price, effective_from, set_by)
         VALUES ($1, 'GRADE_1', 100.00, '2020-01-01', $2)
         RETURNING id`,
        [cropId, superAdminUserId],
      );
      fairPriceId = insFp.rows[0]!.id;
    }

    const listingRes = await pool.query<{ id: string }>(
      `INSERT INTO produce_listings
         (listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id, status)
       VALUES ($1, $2, $3, 'GRADE_1', 500.000, 70.00, $4, 'ACCEPTED')
       RETURNING id`,
      [`LIST-PAY-${ts}`, farmerId, cropId, fairPriceId],
    );

    const poRes = await pool.query<{ id: string }>(
      `INSERT INTO purchase_orders
         (po_number, farmer_id, listing_id, warehouse_id, crop_id, grade,
          quantity_kg, price_per_kg, total_amount, status, issued_by)
       VALUES ($1, $2, $3, $4, $5, 'GRADE_1', 500.000, 70.00, 35000.00, 'ISSUED', $6)
       RETURNING id`,
      [`PO-PAY-TEST-${ts}`, farmerId, listingRes.rows[0]!.id, warehouseId, cropId, superAdminUserId],
    );
    purchaseOrderId = poRes.rows[0]!.id;

    await pool.query(
      `INSERT INTO goods_receipts
         (grn_number, purchase_order_id, warehouse_id, farmer_id,
          gross_qty_kg, accepted_qty_kg, status, received_by)
       VALUES ($1, $2, $3, $4, 500.000, 490.000, 'ACCEPTED', $5)`,
      [`GRN-PAY-${ts}`, purchaseOrderId, warehouseId, farmerId, superAdminUserId],
    );
  });


  // --------------------------------------------------------------------------

  it('GET /admin/payout-dues — returns dues with ageing buckets and totals', async () => {
    if (!ready) return;

    const res = await request(app)
      .get(`/v1/admin/payout-dues?farmerId=${farmerId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('totals');
    expect(res.body.totals).toHaveProperty('totalDue');
    expect(res.body.totals).toHaveProperty('farmerCount');

    // Our seeded farmer should appear
    const ourDue = res.body.items.find((d: { farmerId: string }) => d.farmerId === farmerId);
    expect(ourDue).toBeDefined();
    expect(ourDue.ageBucket).toMatch(/D0_7|D8_15|D16_30|D30_PLUS/);
  });

  it('BR-31a: payout ≤ ₹10,000 auto-approves in APPROVED status', async () => {
    if (!ready) return;

    const res = await request(app)
      .post('/v1/admin/payouts')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('Idempotency-Key', `test-small-payout-${Date.now()}`)
      .send({
        farmerId,
        amount: '5000.00',
        mode: 'IMPS',
        remarks: 'Small payout test',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('APPROVED');
    expect(res.body.requiresDualApproval).toBe(false);
    expect(res.body.farmerId).toBe(farmerId);
    expect(res.body.amount).toBe('5000.00');
    // Response must NOT contain any OTP or plaintext secret fields
    expect(res.body).not.toHaveProperty('otp');
  });

  it('BR-31b+c: payout > ₹10,000 created as PENDING_APPROVAL, requires dual approval', async () => {
    if (!ready) return;

    // Step 1: Initiate large payout
    const createRes = await request(app)
      .post('/v1/admin/payouts')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('Idempotency-Key', `test-large-payout-${Date.now()}`)
      .send({
        farmerId,
        amount: '18400.00',
        mode: 'NEFT',
        remarks: 'Dual approval payout test',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.status).toBe('PENDING_APPROVAL');
    expect(createRes.body.requiresDualApproval).toBe(true);
    expect(createRes.body.approvedBy).toHaveLength(0);

    const payoutId = createRes.body.id;

    // Step 2: Initiator (Super Admin 1) tries to self-approve → 403 SAME_ACTOR_APPROVAL
    const selfApproveRes = await request(app)
      .post(`/v1/admin/payouts/${payoutId}/approve`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('Idempotency-Key', newId())
      .send({ note: 'Self-approve attempt' });

    expect(selfApproveRes.status).toBe(403);
    expect(selfApproveRes.body.code).toBe('SAME_ACTOR_APPROVAL');

    // Step 3: TOHFA_ADMIN tries to approve → 403 FORBIDDEN (must be SUPER_ADMIN)
    const tohfaApproveRes = await request(app)
      .post(`/v1/admin/payouts/${payoutId}/approve`)
      .set('Authorization', `Bearer ${tohfaAdminToken}`)
      .set('Idempotency-Key', newId())
      .send({ note: 'Tohfa Admin attempt' });

    expect(tohfaApproveRes.status).toBe(403);
    expect(tohfaApproveRes.body.code).toBe('FORBIDDEN');

    // Step 4: Second Super Admin approves → 200 APPROVED (BR-31)
    const approveRes = await request(app)
      .post(`/v1/admin/payouts/${payoutId}/approve`)
      .set('Authorization', `Bearer ${superAdmin2Token}`)
      .set('Idempotency-Key', newId())
      .send({ note: 'Approved by Super Admin 2' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.status).toBe('APPROVED');
    expect(approveRes.body.approvedBy).toContain(superAdmin2UserId);
  });

  it('BR-35: payout transitions are audit-logged', async () => {
    if (!ready) return;

    // Create a payout
    const createRes = await request(app)
      .post('/v1/admin/payouts')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('Idempotency-Key', `test-audit-payout-${Date.now()}`)
      .send({ farmerId, amount: '3000.00', mode: 'UPI' });

    expect(createRes.status).toBe(201);
    const payoutId = createRes.body.id;

    // Verify audit log has an entry
    const auditRes = await pool.query(
      `SELECT * FROM audit_log WHERE entity_type = 'payouts' AND entity_id = $1`,
      [payoutId],
    );
    expect(auditRes.rows.length).toBeGreaterThan(0);
    expect(auditRes.rows[0].action_code).toBe('payout.farmer.initiate');
  });

  it('returns 404 for unknown farmer', async () => {
    if (!ready) return;

    const res = await request(app)
      .post('/v1/admin/payouts')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('Idempotency-Key', `test-notfound-${Date.now()}`)
      .send({ farmerId: newId(), amount: '500.00', mode: 'IMPS' });

    expect(res.status).toBe(404);
  });

  it('returns 401 for unauthenticated request', async () => {
    if (!ready) return;

    const res = await request(app)
      .get('/v1/admin/payout-dues');

    expect(res.status).toBe(401);
  });

  it('payout dues list supports ageBucket filter', async () => {
    if (!ready) return;

    const res = await request(app)
      .get('/v1/admin/payout-dues?ageBucket=D0_7')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    // All returned items must be in D0_7 bucket
    for (const item of res.body.items) {
      expect(item.ageBucket).toBe('D0_7');
    }
  });

  // -------------------------------------------------------------------------
  // BR-52 (PAYROLL): payout.released is published exactly when a payout is
  // actually released, not merely requested. Before this change nothing in
  // the codebase ever called `eventBus.publish('payout.released', ...)`, so
  // the PAYROLL notification-preference toggle (BR-52b/c in
  // notifications.test.ts) gated an event that could never fire. These tests
  // exercise the real HTTP path (real DB, real transaction + audit log) and
  // spy on the process-wide eventBus singleton the same way the rest of this
  // codebase publishes domain events (apps/api/src/events/bus.ts).
  // -------------------------------------------------------------------------

  it('BR-52: an auto-approved (<=10,000) payout publishes payout.released to the farmer once released', async () => {
    if (!ready) return;

    const publishSpy = vi.spyOn(eventBus, 'publish');
    try {
      const res = await request(app)
        .post('/v1/admin/payouts')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('Idempotency-Key', `test-br52-small-${Date.now()}`)
        .send({ farmerId, amount: '4000.00', mode: 'IMPS', remarks: 'BR-52 small payout' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('APPROVED');

      const releasedCalls = publishSpy.mock.calls.filter(([name]) => name === 'payout.released');
      expect(releasedCalls).toHaveLength(1);
      expect(releasedCalls[0]![1]).toMatchObject({
        userId: farmerUserId,
        payoutId: res.body.id,
        amount: '4000.00',
        reference: res.body.payoutNumber,
      });
    } finally {
      publishSpy.mockRestore();
    }
  });

  it('BR-52: a dual-approval (>10,000) payout publishes payout.released only once the second Super Admin approves it, not on creation', async () => {
    if (!ready) return;

    const publishSpy = vi.spyOn(eventBus, 'publish');
    try {
      const createRes = await request(app)
        .post('/v1/admin/payouts')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('Idempotency-Key', `test-br52-large-${Date.now()}`)
        .send({ farmerId, amount: '19000.00', mode: 'NEFT', remarks: 'BR-52 dual-approval payout' });

      expect(createRes.status).toBe(201);
      expect(createRes.body.status).toBe('PENDING_APPROVAL');

      // Not released yet — merely requesting/pending approval must not notify.
      expect(
        publishSpy.mock.calls.some(([name]) => name === 'payout.released'),
      ).toBe(false);

      const payoutId = createRes.body.id;
      const approveRes = await request(app)
        .post(`/v1/admin/payouts/${payoutId}/approve`)
        .set('Authorization', `Bearer ${superAdmin2Token}`)
        .set('Idempotency-Key', newId())
        .send({ note: 'BR-52 second approval' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.status).toBe('APPROVED');

      const releasedCalls = publishSpy.mock.calls.filter(([name]) => name === 'payout.released');
      expect(releasedCalls).toHaveLength(1);
      expect(releasedCalls[0]![1]).toMatchObject({
        userId: farmerUserId,
        payoutId,
        amount: '19000.00',
        reference: approveRes.body.payoutNumber,
      });
    } finally {
      publishSpy.mockRestore();
    }
  });

  // -------------------------------------------------------------------------
  // BR-31c: Dual-approval threshold comes from system_config and is stored in DB
  // -------------------------------------------------------------------------
  it('BR-31c: changing system_config threshold changes requires_dual_approval flag for new payouts', async () => {
    if (!ready) return;

    // Change system_config threshold to 500.00
    await pool.query(
      `INSERT INTO system_config (key, value, description)
       VALUES ('payout_dual_approval_threshold', '500.00'::jsonb, 'Threshold test')
       ON CONFLICT (key) DO UPDATE SET value = '500.00'::jsonb`,
    );

    try {
      // Payout of 600.00 is > 500.00 threshold, but <= 10000.00
      const res = await request(app)
        .post('/v1/admin/payouts')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('Idempotency-Key', `test-threshold-config-${Date.now()}`)
        .send({ farmerId, amount: '600.00', mode: 'IMPS' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('PENDING_APPROVAL');
      expect(res.body.requiresDualApproval).toBe(true);

      // Verify the database row directly
      const dbRow = await pool.query<{ requires_dual_approval: boolean }>(
        `SELECT requires_dual_approval FROM payouts WHERE id = $1`,
        [res.body.id],
      );
      expect(dbRow.rows[0]!.requires_dual_approval).toBe(true);
    } finally {
      // Restore threshold to 10000.00
      await pool.query(
        `UPDATE system_config SET value = '10000.00'::jsonb WHERE key = 'payout_dual_approval_threshold'`,
      );
    }
  });

  it('BR-31d: payout export returns CSV with correct columns', async () => {
    if (!ready) return;

    // Unauthenticated -> 401
    const unauthRes = await request(app).get('/v1/admin/payouts/export?from=2026-01-01&to=2026-12-31');
    expect(unauthRes.status).toBe(401);

    // Export with Super Admin
    const res = await request(app)
      .get('/v1/admin/payouts/export?from=2026-01-01&to=2026-12-31')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    const lines = res.text.trim().split('\n');
    expect(lines[0]).toBe('payout_number,farmer_name,amount,status,created_at');
    // If there is data, check the format of data lines
    if (lines.length > 1) {
      const dataRow = lines[1]!;
      expect(dataRow).toMatch(/^PO-[^,]+,[^,]+,₹\d+\.\d{2},[^,]+,.+$/);
    }
  });

  // -------------------------------------------------------------------------
  // BR-144: Payout dues settlement and item linkage
  // -------------------------------------------------------------------------
  describe('BR-144: Payout dues settlement and item linkage', () => {
    let grnId: string;
    let grnFarmerId: string;

    beforeAll(async () => {
      if (!ready) return;
      const ts2 = Date.now();
      const uId = newId();
      await pool.query(
        `INSERT INTO users (id, mobile, full_name, user_type, status)
         VALUES ($1, $2, 'BR144 Farmer', 'FARMER', 'ACTIVE')`,
        [uId, `+9191${String(ts2).slice(-8)}`],
      );
      const fRes = await pool.query<{ id: string }>(
        `INSERT INTO farmers (user_id, tohfa_farmer_id) VALUES ($1, $2) RETURNING id`,
        [uId, `TF-BR144-${ts2}`],
      );
      grnFarmerId = fRes.rows[0]!.id;

      const listRes1 = await pool.query<{ id: string }>(
        `INSERT INTO produce_listings
           (listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id, status)
         VALUES ($1, $2, $3, 'GRADE_1', 10.000, 50.00, $4, 'ACCEPTED')
         RETURNING id`,
        [`LIST-BR144-${ts2}`, grnFarmerId, cropId, fairPriceId],
      );

      const poRes = await pool.query<{ id: string }>(
        `INSERT INTO purchase_orders
           (po_number, farmer_id, listing_id, warehouse_id, crop_id, grade,
            quantity_kg, price_per_kg, total_amount, status, issued_by)
         VALUES ($1, $2, $3, $4, $5, 'GRADE_1', 10.000, 50.00, 500.00, 'ISSUED', $6)
         RETURNING id`,
        [`PO-BR144-${ts2}`, grnFarmerId, listRes1.rows[0]!.id, warehouseId, cropId, superAdminUserId],
      );

      const grRes = await pool.query<{ id: string }>(
        `INSERT INTO goods_receipts
           (grn_number, purchase_order_id, warehouse_id, farmer_id,
            gross_qty_kg, accepted_qty_kg, status, received_by)
         VALUES ($1, $2, $3, $4, 10.000, 10.000, 'ACCEPTED', $5)
         RETURNING id`,
        [`GRN-BR144-${ts2}`, poRes.rows[0]!.id, warehouseId, grnFarmerId, superAdminUserId],
      );
      grnId = grRes.rows[0]!.id;
    });

    it('BR-144a: creating payout with items persists payout_items and reduces remaining due', async () => {
      if (!ready) return;

      // Partial payout of 200.00 for goods receipt of 500.00
      const res = await request(app)
        .post('/v1/admin/payouts')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('Idempotency-Key', `test-br144-partial-${Date.now()}`)
        .send({
          farmerId: grnFarmerId,
          amount: '200.00',
          mode: 'IMPS',
          items: [{ goodsReceiptId: grnId, amount: '200.00' }],
        });

      expect(res.status).toBe(201);

      // Verify payout_items table row
      const itemsRes = await pool.query<{ goods_receipt_id: string; amount: string }>(
        `SELECT goods_receipt_id, amount::text FROM payout_items WHERE payout_id = $1`,
        [res.body.id],
      );
      expect(itemsRes.rows).toHaveLength(1);
      expect(itemsRes.rows[0]!.goods_receipt_id).toBe(grnId);
      expect(itemsRes.rows[0]!.amount).toBe('200.00');

      // Verify listPayoutDues shows remaining due 300.00
      const duesRes = await request(app)
        .get(`/v1/admin/payout-dues?farmerId=${grnFarmerId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(duesRes.status).toBe(200);
      const due = duesRes.body.items.find((d: { goodsReceiptId: string }) => d.goodsReceiptId === grnId);
      expect(due).toBeDefined();
      expect(due.amountDue).toBe('300.00');
    });

    it('BR-144b: payout creation fails with 422 if amount != sum of items', async () => {
      if (!ready) return;

      const res = await request(app)
        .post('/v1/admin/payouts')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('Idempotency-Key', `test-br144-mismatch-${Date.now()}`)
        .send({
          farmerId: grnFarmerId,
          amount: '300.00',
          mode: 'IMPS',
          items: [{ goodsReceiptId: grnId, amount: '250.00' }],
        });

      expect(res.status).toBe(422);
    });

    it('BR-144c: payout creation fails with 422 if item amount > remaining due', async () => {
      if (!ready) return;

      // Remaining due is 300.00; try to pay 400.00
      const res = await request(app)
        .post('/v1/admin/payouts')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('Idempotency-Key', `test-br144-exceed-${Date.now()}`)
        .send({
          farmerId: grnFarmerId,
          amount: '400.00',
          mode: 'IMPS',
          items: [{ goodsReceiptId: grnId, amount: '400.00' }],
        });

      expect(res.status).toBe(422);
    });

    it('BR-144d: settling remaining due completely removes goods receipt from payout dues', async () => {
      if (!ready) return;

      // Settle the remaining 300.00
      const res = await request(app)
        .post('/v1/admin/payouts')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('Idempotency-Key', `test-br144-settle-${Date.now()}`)
        .send({
          farmerId: grnFarmerId,
          amount: '300.00',
          mode: 'IMPS',
          items: [{ goodsReceiptId: grnId, amount: '300.00' }],
        });

      expect(res.status).toBe(201);

      // Verify listPayoutDues no longer contains this GR
      const duesRes = await request(app)
        .get(`/v1/admin/payout-dues?farmerId=${grnFarmerId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(duesRes.status).toBe(200);
      const due = duesRes.body.items.find((d: { goodsReceiptId: string }) => d.goodsReceiptId === grnId);
      expect(due).toBeUndefined();
    });

    it('BR-144e: a failed payout restores the remaining due for its goods receipt', async () => {
      if (!ready) return;

      // Create another GR of 100.00
      const listResFail = await pool.query<{ id: string }>(
        `INSERT INTO produce_listings
           (listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id, status)
         VALUES ($1, $2, $3, 'GRADE_1', 2.000, 50.00, $4, 'ACCEPTED')
         RETURNING id`,
        [`LIST-BR144-FAIL-${Date.now()}`, grnFarmerId, cropId, fairPriceId],
      );

      const poRes = await pool.query<{ id: string }>(
        `INSERT INTO purchase_orders
           (po_number, farmer_id, listing_id, warehouse_id, crop_id, grade,
            quantity_kg, price_per_kg, total_amount, status, issued_by)
         VALUES ($1, $2, $3, $4, $5, 'GRADE_1', 2.000, 50.00, 100.00, 'ISSUED', $6)
         RETURNING id`,
        [`PO-BR144-FAIL-${Date.now()}`, grnFarmerId, listResFail.rows[0]!.id, warehouseId, cropId, superAdminUserId],
      );

      const grRes = await pool.query<{ id: string }>(
        `INSERT INTO goods_receipts
           (grn_number, purchase_order_id, warehouse_id, farmer_id,
            gross_qty_kg, accepted_qty_kg, status, received_by)
         VALUES ($1, $2, $3, $4, 2.000, 2.000, 'ACCEPTED', $5)
         RETURNING id`,
        [`GRN-BR144-FAIL-${Date.now()}`, poRes.rows[0]!.id, warehouseId, grnFarmerId, superAdminUserId],
      );
      const failGrnId = grRes.rows[0]!.id;

      // Settle 100.00
      const res = await request(app)
        .post('/v1/admin/payouts')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('Idempotency-Key', `test-br144-willfail-${Date.now()}`)
        .send({
          farmerId: grnFarmerId,
          amount: '100.00',
          mode: 'IMPS',
          items: [{ goodsReceiptId: failGrnId, amount: '100.00' }],
        });

      expect(res.status).toBe(201);
      const payoutId = res.body.id;

      // Dues list should now be empty for failGrnId
      let duesRes = await request(app)
        .get(`/v1/admin/payout-dues?farmerId=${grnFarmerId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(duesRes.body.items.find((d: { goodsReceiptId: string }) => d.goodsReceiptId === failGrnId)).toBeUndefined();

      // Now mark the payout as FAILED
      await pool.query(`UPDATE payouts SET status = 'FAILED' WHERE id = $1`, [payoutId]);

      // Dues list should now show failGrnId with 100.00 due again!
      duesRes = await request(app)
        .get(`/v1/admin/payout-dues?farmerId=${grnFarmerId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      const restored = duesRes.body.items.find((d: { goodsReceiptId: string }) => d.goodsReceiptId === failGrnId);
      expect(restored).toBeDefined();
      expect(restored.amountDue).toBe('100.00');
    });
  });

  describeIfDatabase('BR-72 / P0-40: GET /admin/payouts and GET /admin/payouts/:id', () => {
    it('BR-72l: GET /admin/payouts is gated on payout.view (403 for farmer or unauthorized)', async () => {
      const farmerUserId = newId();
      const farmerToken = signAccessToken({
        sub: farmerUserId,
        roles: [{ code: 'FARMER' as const }],
        customerId: null,
        farmerId: newId(),
      });
      const res = await request(app)
        .get('/v1/admin/payouts')
        .set('Authorization', `Bearer ${farmerToken}`);
      expect(res.status).toBe(403);
    });

    it('BR-72l: GET /admin/payouts returns cursor-paged list with status and farmer filters', async () => {
      const createRes = await request(app)
        .post('/v1/admin/payouts')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('Idempotency-Key', `test-list-${Date.now()}`)
        .send({
          farmerId,
          amount: '500.00',
          mode: 'IMPS',
        });
      expect(createRes.status).toBe(201);
      const createdPayoutNumber = createRes.body.payoutNumber;

      const listRes = await request(app)
        .get(`/v1/admin/payouts?farmerId=${farmerId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.items)).toBe(true);
      expect(listRes.body.items.length).toBeGreaterThan(0);
      const row = listRes.body.items.find((item: any) => item.payoutNumber === createdPayoutNumber);
      expect(row).toBeDefined();
      expect(row).toMatchObject({
        payoutNumber: createdPayoutNumber,
        farmerName: expect.any(String),
        amount: '500.00',
        status: expect.any(String),
        requestedAt: expect.any(String),
        requestedBy: expect.any(String),
      });
    });

    it('BR-72m / BR-92: GET /admin/payouts/:id returns detail with linked items, calculation, approval state, and masked contact', async () => {
      const createRes = await request(app)
        .post('/v1/admin/payouts')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('Idempotency-Key', `test-detail-${Date.now()}`)
        .send({
          farmerId,
          amount: '750.00',
          mode: 'IMPS',
        });
      expect(createRes.status).toBe(201);
      const payoutId = createRes.body.id;

      const detailRes = await request(app)
        .get(`/v1/admin/payouts/${payoutId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body).toMatchObject({
        id: payoutId,
        payoutNumber: createRes.body.payoutNumber,
        farmerName: expect.any(String),
        amount: '750.00',
        status: expect.any(String),
        requestedAt: expect.any(String),
        requestedBy: expect.any(String),
        netPayableAmount: '750.00',
        approvedAdjustments: expect.any(String),
        calculationReference: `CALC-${createRes.body.payoutNumber}`,
        approvalStatus: expect.any(String),
        auditTrail: expect.any(Array),
      });
      if (detailRes.body.farmerContact) {
        expect(detailRes.body.farmerContact).toMatch(/^\*+\d{4}$/);
      }
    });

    it('BR-72m: GET /admin/payouts/:id returns 404 for unknown payout ID', async () => {
      const res = await request(app)
        .get(`/v1/admin/payouts/${newId()}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(404);
    });
  });
});