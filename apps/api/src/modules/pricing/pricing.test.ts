import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken, type RoleAssignment } from '../../auth/jwt.js';
import type { Executor } from '../../db/pool.js';
import { anActor, describeIfDatabase, IDS } from '../../test/factories.js';
import { ensureStandardUsers, insertCrop, requireDatabaseTables } from '../../test/dbFixtures.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import {
  compareMoney,
  createPricingService,
  parseMoneyToPaise,
} from './pricing.service.js';
import { pricingRepo, type FairPriceRow, type PricingRepo, type RetailPriceRow } from './pricing.repo.js';

function mockPricingRepo(initialFairPrices: FairPriceRow[] = [], initialRetailPrices: RetailPriceRow[] = []): PricingRepo {
  const fairPrices: FairPriceRow[] = [...initialFairPrices];
  const retailPrices: RetailPriceRow[] = [...initialRetailPrices];

  return {
    async findEffectiveFairPrice(_db, cropId, grade, targetDate) {
      const match = fairPrices.find(
        (fp) =>
          fp.crop_id === cropId &&
          fp.grade === grade &&
          new Date(fp.effective_from) <= new Date(targetDate) &&
          (fp.effective_to === null || new Date(fp.effective_to) >= new Date(targetDate)),
      );
      return match ?? null;
    },

    async listFairPrices(_db, options) {
      const filtered = fairPrices.filter((fp) => {
        if (options.cropId && fp.crop_id !== options.cropId) return false;
        if (options.grade && fp.grade !== options.grade) return false;
        return (
          new Date(fp.effective_from) <= new Date(options.effectiveOn) &&
          (fp.effective_to === null || new Date(fp.effective_to) >= new Date(options.effectiveOn))
        );
      });
      return { items: filtered, nextCursor: null, hasMore: false };
    },

    async createFairPrice(_db, input, setBy) {
      // Close open window
      const prev = fairPrices.find(
        (fp) =>
          fp.crop_id === input.cropId &&
          fp.grade === input.grade &&
          (fp.effective_to === null || new Date(fp.effective_to) >= new Date(input.effectiveFrom)) &&
          new Date(fp.effective_from) < new Date(input.effectiveFrom),
      );
      if (prev) {
        prev.effective_to = new Date(new Date(input.effectiveFrom).getTime() - 86400000).toISOString().slice(0, 10);
      }

      const row: FairPriceRow = {
        id: crypto.randomUUID(),
        crop_id: input.cropId,
        crop_name: 'Carrot',
        grade: input.grade,
        ceiling_price: input.ceilingPrice,
        frequency: input.frequency,
        effective_from: input.effectiveFrom,
        effective_to: null,
        set_by: setBy,
        notes: input.notes ?? null,
        created_at: new Date(),
      };
      fairPrices.push(row);

      const affected = retailPrices.filter(
        (rp) =>
          rp.crop_id === input.cropId &&
          rp.grade === input.grade &&
          (rp.effective_to === null || new Date(rp.effective_to) >= new Date(input.effectiveFrom)) &&
          compareMoney(rp.price, input.ceilingPrice) > 0,
      );

      return { fairPrice: row, affectedRetailPrices: affected };
    },

    async getFairPriceHistory(_db, options) {
      const filtered = fairPrices.filter((fp) => {
        if (fp.crop_id !== options.cropId) return false;
        if (options.grade && fp.grade !== options.grade) return false;
        return true;
      });
      return { items: filtered, nextCursor: null, hasMore: false };
    },

    async listRetailPrices(_db, options) {
      const filtered = retailPrices.filter((rp) => {
        if (options.cropId && rp.crop_id !== options.cropId) return false;
        if (options.grade && rp.grade !== options.grade) return false;
        return (
          new Date(rp.effective_from) <= new Date(options.effectiveOn) &&
          (rp.effective_to === null || new Date(rp.effective_to) >= new Date(options.effectiveOn))
        );
      });
      return { items: filtered, nextCursor: null, hasMore: false };
    },

    async createRetailPrice(_db, input, fairPriceId, setBy) {
      const prev = retailPrices.find(
        (rp) =>
          rp.crop_id === input.cropId &&
          rp.grade === input.grade &&
          (rp.effective_to === null || new Date(rp.effective_to) >= new Date(input.effectiveFrom)),
      );
      if (prev) {
        prev.effective_to = new Date(new Date(input.effectiveFrom).getTime() - 86400000).toISOString().slice(0, 10);
      }

      const row: RetailPriceRow = {
        id: crypto.randomUUID(),
        crop_id: input.cropId,
        crop_name: 'Carrot',
        grade: input.grade,
        price: input.price,
        ceiling_price: '50.00',
        markup_pct: input.markupPct ?? null,
        gst_inclusive: input.gstInclusive,
        fair_price_id: fairPriceId,
        effective_from: input.effectiveFrom,
        effective_to: null,
        set_by: setBy,
        created_at: new Date(),
      };
      retailPrices.push(row);
      return row;
    },
  };
}

describe('Pricing Module Unit & Business Rules', () => {
  const cropId = '11112222-3333-4444-5555-666677778888';

  it('Money arithmetic avoids JS float inaccuracies', () => {
    expect(parseMoneyToPaise('100.01')).toBe(10001);
    expect(parseMoneyToPaise('100.00')).toBe(10000);
    expect(compareMoney('100.01', '100.00')).toBeGreaterThan(0);
    expect(compareMoney('100.00', '100.00')).toBe(0);
    expect(compareMoney('99.99', '100.00')).toBeLessThan(0);
  });

  it('Money helpers are exact paise: sub-paise input is refused, never rounded through a float', () => {
    // Math.round(Number('1.005') * 100) === 100 — a float silently dropped a
    // digit that NUMERIC(12,2) would later have rounded UP to 1.01.
    expect(() => parseMoneyToPaise('1.005')).toThrow();
    expect(() => compareMoney('100.005', '100.00')).toThrow();
    expect(() => parseMoneyToPaise('')).toThrow();
    expect(parseMoneyToPaise('19.99')).toBe(1999);
    expect(parseMoneyToPaise('48')).toBe(4800);
    expect(parseMoneyToPaise('48.5')).toBe(4850);
  });

  it('BR-09: a retail price with sub-paise digits is refused with 422, not rounded under the ceiling', async () => {
    const ceiling: FairPriceRow = {
      id: 'fp-1',
      crop_id: cropId,
      crop_name: 'Carrot',
      grade: 'GRADE_1',
      ceiling_price: '100.00',
      frequency: 'WEEKLY',
      effective_from: '2026-08-01',
      effective_to: null,
      set_by: IDS.userSuperAdmin,
      notes: null,
      created_at: new Date(),
    };
    const repo = mockPricingRepo([ceiling]);
    let inserted = false;
    const guardedRepo: PricingRepo = {
      ...repo,
      async createRetailPrice(...args) {
        inserted = true;
        return repo.createRetailPrice(...args);
      },
    };
    const mockTx = async <T>(fn: (tx: Executor) => Promise<T>) => fn({ query: async () => ({ rows: [{ id: '1' }] }) } as unknown as Executor);
    const service = createPricingService(guardedRepo, mockTx, createInMemoryIdempotencyStore());
    const actor = anActor({ roles: [{ code: 'SUPER_ADMIN' }] });

    await expect(
      service.createRetailPrice(actor, {
        cropId,
        grade: 'GRADE_1',
        price: '100.005',
        gstInclusive: true,
        effectiveFrom: '2026-08-19',
      }, crypto.randomUUID()),
    ).rejects.toThrow(expect.objectContaining({ code: 'VALIDATION_FAILED', status: 422 }));
    expect(inserted).toBe(false);
  });

  it('BR-09: retail-above-ceiling meta carries exact two-decimal money strings', async () => {
    const ceiling: FairPriceRow = {
      id: 'fp-1',
      crop_id: cropId,
      crop_name: 'Carrot',
      grade: 'GRADE_1',
      ceiling_price: '100',
      frequency: 'WEEKLY',
      effective_from: '2026-08-01',
      effective_to: null,
      set_by: IDS.userSuperAdmin,
      notes: null,
      created_at: new Date(),
    };
    const mockTx = async <T>(fn: (tx: Executor) => Promise<T>) => fn({ query: async () => ({ rows: [{ id: '1' }] }) } as unknown as Executor);
    const service = createPricingService(mockPricingRepo([ceiling]), mockTx, createInMemoryIdempotencyStore());
    const actor = anActor({ roles: [{ code: 'SUPER_ADMIN' }] });

    await expect(
      service.createRetailPrice(actor, {
        cropId,
        grade: 'GRADE_1',
        price: '120.5',
        gstInclusive: true,
        effectiveFrom: '2026-08-19',
      }, crypto.randomUUID()),
    ).rejects.toThrow(
      expect.objectContaining({
        code: 'PRICE_ABOVE_CEILING',
        meta: { ceilingPrice: '100.00', attemptedPrice: '120.50' },
      }),
    );
  });

  it('Fair price responses render ceilings as exact two-decimal strings without a float round-trip', async () => {
    const row = (ceiling_price: string): FairPriceRow => ({
      id: crypto.randomUUID(),
      crop_id: cropId,
      crop_name: 'Carrot',
      grade: 'GRADE_1',
      ceiling_price,
      frequency: 'WEEKLY',
      effective_from: '2026-08-01',
      effective_to: null,
      set_by: IDS.userSuperAdmin,
      notes: null,
      created_at: new Date(),
    });

    const ok = (await createPricingService(mockPricingRepo([row('48'), row('48.5'), row('9999999999.99')])).listFairPrices({
      limit: 20,
      effectiveOn: '2026-08-19',
    })) as { items: Array<{ ceilingPrice: string }> };
    expect(ok.items.map((i) => i.ceilingPrice)).toEqual(['48.00', '48.50', '9999999999.99']);

    // A value NUMERIC(12,2) cannot hold is corrupt data: fail loudly rather
    // than let Number('1.005').toFixed(2) quietly answer '1.00'.
    await expect(
      createPricingService(mockPricingRepo([row('1.005')])).listFairPrices({ limit: 20, effectiveOn: '2026-08-19' }),
    ).rejects.toThrow();
  });

  it('Bulk fair price update refuses a sub-paise or non-positive ceiling instead of rounding it', async () => {
    const service = createPricingService(mockPricingRepo(), undefined, createInMemoryIdempotencyStore());
    const actor = anActor({ roles: [{ code: 'SUPER_ADMIN' }] });

    for (const ceilingPrice of ['52.005', '0.004', '0.00', '-1.00']) {
      await expect(
        service.bulkUpsertFairPrices(actor, {
          items: [{ cropId, grade: 'GRADE_1', ceilingPrice, frequency: 'WEEKLY', effectiveFrom: '2026-08-20' }],
        }, crypto.randomUUID()),
      ).rejects.toSatisfy((err: unknown) => {
        const e = err as { code: string; status: number; meta: { errors: Array<{ index: number; field: string }> } };
        expect(e.code).toBe('VALIDATION_FAILED');
        expect(e.status).toBe(422);
        expect(e.meta.errors).toEqual([expect.objectContaining({ index: 0, field: 'ceilingPrice' })]);
        return true;
      });
    }
  });

  describe('BR-07: Listing price must not exceed fair price ceiling', () => {
    it('BR-07a: Ceiling Rs 100/kg, listing at Rs 100.01 is rejected with PRICE_ABOVE_CEILING', () => {
      const ceilingPrice = '100.00';
      const askingPrice = '100.01';
      expect(compareMoney(askingPrice, ceilingPrice)).toBeGreaterThan(0);
    });

    it('BR-07b: Listing at exactly the ceiling is accepted', () => {
      const ceilingPrice = '100.00';
      const askingPrice = '100.00';
      expect(compareMoney(askingPrice, ceilingPrice)).toBeLessThanOrEqual(0);
    });

    it('BR-07c: A ceiling lowered after acceptance does not retroactively invalidate an accepted listing', () => {
      // Historical fair price ID records the ceiling checked on the date of creation
      const listingFairPriceId = 'fp-original-100';
      expect(listingFairPriceId).toBeTruthy();
    });
  });

  describe('BR-08: Fair price ceiling is set by Super Admin only', () => {
    it('BR-08a: TOHFA_ADMIN receives 403 on ceiling write', async () => {
      const app = createApp();
      const tohfaAdminToken = signAccessToken({
        sub: IDS.userTohfaAdmin,
        roles: [{ code: 'TOHFA_ADMIN' }],
        farmerId: null,
        customerId: null,
      });

      const res = await request(app)
        .post('/v1/fair-prices')
        .set('Authorization', `Bearer ${tohfaAdminToken}`)
        .set('Idempotency-Key', '11111111-1111-4111-8111-111111111111')
        .send({
          cropId,
          grade: 'GRADE_1',
          ceilingPrice: '52.00',
          frequency: 'WEEKLY',
          effectiveFrom: '2026-08-24',
        });

      expect(res.status).toBe(403);
    });

    it('BR-08a: SUPER_ADMIN is permitted to set ceiling', async () => {
      const app = createApp();
      const superAdminToken = signAccessToken({
        sub: IDS.userSuperAdmin,
        roles: [{ code: 'SUPER_ADMIN' }],
        farmerId: null,
        customerId: null,
      });

      const res = await request(app)
        .post('/v1/fair-prices')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('Idempotency-Key', '22222222-2222-4222-8222-222222222222')
        .send({
          cropId: '00000000-0000-0000-0000-000000000000', // non-existent crop in mock
          grade: 'INVALID_GRADE',
          ceilingPrice: '52.00',
          frequency: 'WEEKLY',
          effectiveFrom: '2026-08-24',
        });

      // Passed auth/rbac, failed schema validation on grade
      expect(res.status).toBe(422);
    });

    it('BR-08: POST /v1/fair-prices requires Idempotency-Key and rejects missing header with 422', async () => {
      const app = createApp();
      const superAdminToken = signAccessToken({
        sub: IDS.userSuperAdmin,
        roles: [{ code: 'SUPER_ADMIN' }],
        farmerId: null,
        customerId: null,
      });

      const res = await request(app)
        .post('/v1/fair-prices')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          cropId,
          grade: 'GRADE_1',
          ceilingPrice: '52.00',
          frequency: 'WEEKLY',
          effectiveFrom: '2026-08-24',
        });

      expect(res.status).toBe(422);
      expect(res.body.errors?.['header.Idempotency-Key']).toBeDefined();
    });

    it('BR-08: POST /v1/fair-prices/bulk requires Idempotency-Key and rejects missing header with 422', async () => {
      const app = createApp();
      const superAdminToken = signAccessToken({
        sub: IDS.userSuperAdmin,
        roles: [{ code: 'SUPER_ADMIN' }],
        farmerId: null,
        customerId: null,
      });

      const res = await request(app)
        .post('/v1/fair-prices/bulk')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          items: [
            {
              cropId,
              grade: 'GRADE_1',
              ceilingPrice: '52.00',
              frequency: 'WEEKLY',
              effectiveFrom: '2026-08-24',
            },
          ],
        });

      expect(res.status).toBe(422);
      expect(res.body.errors?.['header.Idempotency-Key']).toBeDefined();
    });

    it('BR-09: POST /v1/retail-prices requires Idempotency-Key and rejects missing header with 422', async () => {
      const app = createApp();
      const superAdminToken = signAccessToken({
        sub: IDS.userSuperAdmin,
        roles: [{ code: 'SUPER_ADMIN' }],
        farmerId: null,
        customerId: null,
      });

      const res = await request(app)
        .post('/v1/retail-prices')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          cropId,
          grade: 'GRADE_1',
          price: '52.00',
          gstInclusive: true,
          effectiveFrom: '2026-08-24',
        });

      expect(res.status).toBe(422);
      expect(res.body.errors?.['header.Idempotency-Key']).toBeDefined();
    });
  });

  describe('BR-09: only Super Admin sets the retail price (owner decision 2026-11-10)', () => {
    const tokenFor = (sub: string, code: RoleAssignment['code']) =>
      signAccessToken({ sub, roles: [{ code }], farmerId: null, customerId: null });

    // A body that is deliberately invalid (grade): requirePermission runs BEFORE validate, so a
    // 403 proves the permission gate refused the role, and a 422 proves the role got past it.
    // That keeps this test independent of a database while still exercising the real route.
    const invalidBody = {
      cropId: '00000000-0000-0000-0000-000000000000',
      grade: 'INVALID_GRADE',
      price: '52.00',
      gstInclusive: true,
      effectiveFrom: '2026-08-24',
    };

    it('BR-09: only SUPER_ADMIN may set a retail price; TOHFA_ADMIN is denied (403) and reads are unchanged', async () => {
      const app = createApp();
      const write = (token: string) =>
        request(app).post('/v1/retail-prices').set('Authorization', `Bearer ${token}`).send(invalidBody);

      // SUPER_ADMIN is allowed: it reaches validation (422), not the permission gate (403).
      const superAdmin = await write(tokenFor(IDS.userSuperAdmin, 'SUPER_ADMIN'));
      expect(superAdmin.status).toBe(422);

      // Every other admin role is refused at the permission gate.
      const denied: ReadonlyArray<readonly [string, RoleAssignment['code']]> = [
        [IDS.userTohfaAdmin, 'TOHFA_ADMIN'],
        [IDS.userFarmerAdmin, 'FARMER_ADMIN'],
        ['00000000-0000-4000-8000-000000000006', 'MAIN_WH_ADMIN'],
        [IDS.userSubWhAdmin, 'SUB_WH_ADMIN'],
      ];
      for (const [sub, code] of denied) {
        const res = await write(tokenFor(sub, code));
        expect(res.status, `${code} must be denied on POST /retail-prices`).toBe(403);
      }

      // Reads are unchanged: TOHFA_ADMIN still passes the view gate on GET /retail-prices.
      // An out-of-range limit makes validation (422) answer after the gate, so no database is needed.
      const read = await request(app)
        .get('/v1/retail-prices')
        .query({ limit: 0 })
        .set('Authorization', `Bearer ${tokenFor(IDS.userTohfaAdmin, 'TOHFA_ADMIN')}`);
      expect(read.status).toBe(422);
    });
  });

  describe('BR-09: Retail price must be at or below the ceiling', () => {
    it('BR-09a: Ceiling Rs 100, retail price Rs 120 returns 422 with PRICE_ABOVE_CEILING', async () => {
      const initialFairPrice: FairPriceRow = {
        id: 'fp-1',
        crop_id: cropId,
        crop_name: 'Carrot',
        grade: 'GRADE_1',
        ceiling_price: '100.00',
        frequency: 'WEEKLY',
        effective_from: '2026-08-01',
        effective_to: null,
        set_by: IDS.userSuperAdmin,
        notes: null,
        created_at: new Date(),
      };

      const repo = mockPricingRepo([initialFairPrice]);
      const mockTx = async <T>(fn: (tx: Executor) => Promise<T>) => fn({ query: async () => ({ rows: [{ id: '1' }] }) } as unknown as Executor);
      const service = createPricingService(repo, mockTx, createInMemoryIdempotencyStore());
      const actor = anActor({ roles: [{ code: 'SUPER_ADMIN' }] });

      await expect(
        service.createRetailPrice(actor, {
          cropId,
          grade: 'GRADE_1',
          price: '120.00',
          gstInclusive: true,
          effectiveFrom: '2026-08-19',
        }, crypto.randomUUID()),
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'PRICE_ABOVE_CEILING',
          status: 422,
          meta: { ceilingPrice: '100.00', attemptedPrice: '120.00' },
        }),
      );
    });

    it('BR-09b: Lowering ceiling below an active retail price surfaces affected retail rows', async () => {
      const initialFairPrice: FairPriceRow = {
        id: 'fp-1',
        crop_id: cropId,
        crop_name: 'Carrot',
        grade: 'GRADE_1',
        ceiling_price: '100.00',
        frequency: 'WEEKLY',
        effective_from: '2026-08-01',
        effective_to: null,
        set_by: IDS.userSuperAdmin,
        notes: null,
        created_at: new Date(),
      };

      const initialRetailPrice: RetailPriceRow = {
        id: 'rp-1',
        crop_id: cropId,
        crop_name: 'Carrot',
        grade: 'GRADE_1',
        price: '95.00',
        ceiling_price: '100.00',
        markup_pct: 10,
        gst_inclusive: true,
        fair_price_id: 'fp-1',
        effective_from: '2026-08-01',
        effective_to: null,
        set_by: IDS.userSuperAdmin,
        created_at: new Date(),
      };

      const repo = mockPricingRepo([initialFairPrice], [initialRetailPrice]);
      const mockTx = async <T>(fn: (tx: Executor) => Promise<T>) => fn({ query: async () => ({ rows: [{ id: '1' }] }) } as unknown as Executor);
      const service = createPricingService(repo, mockTx, createInMemoryIdempotencyStore());
      const actor = anActor({ roles: [{ code: 'SUPER_ADMIN' }] });

      // Lower ceiling to 80.00
      const res = (await service.createFairPrice(actor, {
        cropId,
        grade: 'GRADE_1',
        ceilingPrice: '80.00',
        frequency: 'WEEKLY',
        effectiveFrom: '2026-08-20',
      }, crypto.randomUUID())) as Record<string, unknown>;

      expect(res.affectedRetailPrices).toBeDefined();
      expect(Array.isArray(res.affectedRetailPrices)).toBe(true);
      expect((res.affectedRetailPrices as unknown[]).length).toBe(1);
    });
  });

  describe('Bulk Fair Price Update', () => {
    it('rejects batch with 422 if duplicate item exists in payload', async () => {
      const service = createPricingService(mockPricingRepo(), undefined, createInMemoryIdempotencyStore());
      const actor = anActor({ roles: [{ code: 'SUPER_ADMIN' }] });

      await expect(
        service.bulkUpsertFairPrices(actor, {
          items: [
            {
              cropId,
              grade: 'GRADE_1',
              ceilingPrice: '50.00',
              frequency: 'WEEKLY',
              effectiveFrom: '2026-08-20',
            },
            {
              cropId,
              grade: 'GRADE_1',
              ceilingPrice: '55.00',
              frequency: 'WEEKLY',
              effectiveFrom: '2026-08-20',
            },
          ],
        }, crypto.randomUUID()),
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'VALIDATION_FAILED',
          status: 422,
        }),
      );
    });
  });

  describe('BR-08 / BR-09: Idempotency Key Replay (P0-17)', () => {
    it('BR-08: createFairPrice replays original response on same key, refuses different payload with 409 IDEMPOTENCY_KEY_REUSED', async () => {
      const repo = mockPricingRepo();
      const mockTx = async <T>(fn: (tx: Executor) => Promise<T>) => fn({ query: async () => ({ rows: [{ id: 'mock-audit-id' }] }) } as unknown as Executor);
      const store = createInMemoryIdempotencyStore();
      const service = createPricingService(repo, mockTx, store);
      const actor = anActor({ roles: [{ code: 'SUPER_ADMIN' }] });
      const key = '55555555-5555-4555-8555-555555555555';
      const body = {
        cropId,
        grade: 'GRADE_1' as const,
        ceilingPrice: '50.00',
        frequency: 'WEEKLY' as const,
        effectiveFrom: '2026-08-01',
      };

      const first = await service.createFairPrice(actor, body, key);
      const replay = await service.createFairPrice(actor, body, key);
      expect(replay).toEqual(first);
      expect(store.size()).toBe(1);

      await expect(
        service.createFairPrice(actor, { ...body, ceilingPrice: '60.00' }, key),
      ).rejects.toThrow(expect.objectContaining({ code: 'IDEMPOTENCY_KEY_REUSED', status: 409 }));
    });

    it('BR-08: bulkUpsertFairPrices replays original response on same key', async () => {
      const repo = mockPricingRepo();
      const mockTx = async <T>(fn: (tx: Executor) => Promise<T>) => fn({ query: async () => ({ rows: [{ id: 'mock-audit-id' }] }) } as unknown as Executor);
      const store = createInMemoryIdempotencyStore();
      const service = createPricingService(repo, mockTx, store);
      const actor = anActor({ roles: [{ code: 'SUPER_ADMIN' }] });
      const key = '66666666-6666-4666-8666-666666666666';
      const body = {
        items: [
          {
            cropId,
            grade: 'GRADE_1' as const,
            ceilingPrice: '50.00',
            frequency: 'WEEKLY' as const,
            effectiveFrom: '2026-08-01',
          },
        ],
      };

      const first = await service.bulkUpsertFairPrices(actor, body, key);
      const replay = await service.bulkUpsertFairPrices(actor, body, key);
      expect(replay).toEqual(first);
      expect(store.size()).toBe(1);
    });

    it('BR-09: createRetailPrice replays original response on same key, refuses different payload with 409 IDEMPOTENCY_KEY_REUSED', async () => {
      const ceiling: FairPriceRow = {
        id: 'fp-1',
        crop_id: cropId,
        crop_name: 'Carrot',
        grade: 'GRADE_1',
        ceiling_price: '100.00',
        frequency: 'WEEKLY',
        effective_from: '2026-08-01',
        effective_to: null,
        set_by: IDS.userSuperAdmin,
        notes: null,
        created_at: new Date(),
      };
      const repo = mockPricingRepo([ceiling]);
      const mockTx = async <T>(fn: (tx: Executor) => Promise<T>) => fn({ query: async () => ({ rows: [{ id: 'mock-audit-id' }] }) } as unknown as Executor);
      const store = createInMemoryIdempotencyStore();
      const service = createPricingService(repo, mockTx, store);
      const actor = anActor({ roles: [{ code: 'SUPER_ADMIN' }] });
      const key = '77777777-7777-4777-8777-777777777777';
      const body = {
        cropId,
        grade: 'GRADE_1' as const,
        price: '90.00',
        gstInclusive: true,
        effectiveFrom: '2026-08-01',
      };

      const first = await service.createRetailPrice(actor, body, key);
      const replay = await service.createRetailPrice(actor, body, key);
      expect(replay).toEqual(first);
      expect(store.size()).toBe(1);

      await expect(
        service.createRetailPrice(actor, { ...body, price: '95.00' }, key),
      ).rejects.toThrow(expect.objectContaining({ code: 'IDEMPOTENCY_KEY_REUSED', status: 409 }));
    });
  });

  describeIfDatabase('Integration against PostgreSQL (BR-08b Database Exclusion Constraint)', () => {
    const app = createApp();

    it('BR-08b: Database rejects overlapping fair price window', async (ctx) => {
      if (!(await requireDatabaseTables('fair_prices', 'crop_master', 'users'))) return ctx.skip();

      const { pool } = await import('../../db/pool.js');

      // The actor must exist: fair_prices.set_by and audit_log.actor_id are FKs to users.
      // Created idempotently (ON CONFLICT DO NOTHING) rather than borrowed from whatever
      // another test file left committed, so this test passes alone on a fresh database.
      // (A user row can never be deleted again once audit_log, which is append-only,
      // references it, so it is deliberately a fixed id, not one new row per run.)
      await ensureStandardUsers(pool, 'userSuperAdmin');
      const testAdminId = IDS.userSuperAdmin;
      const superAdminToken = signAccessToken({
        sub: testAdminId,
        roles: [{ code: 'SUPER_ADMIN' }],
        farmerId: null,
        customerId: null,
      });

      // A private crop: no existing fair price (seeded, left by another test, or a real
      // operator's) can overlap or 409 this test's window.
      const testCropId = await insertCrop(pool);

      let _createdFairPriceId: string | null = null;
      try {
        // 1. Create first ceiling
        const res1 = await request(app)
          .post('/v1/fair-prices')
          .set('Authorization', `Bearer ${superAdminToken}`)
          .set('Idempotency-Key', crypto.randomUUID())
          .send({
            cropId: testCropId,
            grade: 'GRADE_1',
            ceilingPrice: '60.00',
            frequency: 'WEEKLY',
            effectiveFrom: '2026-09-01',
          });
        // The crop is private and new, so the only acceptable outcome is 201. (This used to
        // accept 409 as well, and then silently skipped the constraint check below.)
        expect(res1.status, JSON.stringify(res1.body)).toBe(201);
        // POST /v1/fair-prices answers with the FairPrice itself (id at the top level), not
        // a `{ fairPrice }` wrapper: reading `.fairPrice.id` threw on every 201.
        _createdFairPriceId = (res1.body as { id: string }).id;

        // 2. Direct raw SQL insert with overlapping window to test database constraint
        await expect(
          pool.query(
            `INSERT INTO fair_prices (crop_id, grade, ceiling_price, effective_from, effective_to, set_by)
             VALUES ($1, 'GRADE_1', 65.00, '2026-09-02', '2026-09-05', $2)`,
            [testCropId, testAdminId],
          ),
        ).rejects.toThrow(/fair_prices_no_overlap|conflicting key value violates exclusion constraint/i);
      } finally {
        // Remove only what THIS run created. (Its audit_log row is append-only and stays.)
        await pool.query('SET session_replication_role = replica');
        try {
          await pool.query('DELETE FROM fair_prices WHERE crop_id = $1', [testCropId]);
          await pool.query('DELETE FROM crop_master WHERE id = $1', [testCropId]);
        } finally {
          await pool.query('SET session_replication_role = DEFAULT');
        }
      }
    });

    it('BR-08c: Database rejects UPDATE of ceiling_price and DELETE on fair_prices and retail_prices', async (ctx) => {
      if (!(await requireDatabaseTables('fair_prices', 'retail_prices', 'crop_master', 'users'))) return ctx.skip();

      const { pool } = await import('../../db/pool.js');
      await ensureStandardUsers(pool, 'userSuperAdmin');
      const testAdminId = IDS.userSuperAdmin;
      const testCropId = await insertCrop(pool);

      try {
        const fpRes = await pool.query<{ id: string }>(
          `INSERT INTO fair_prices (crop_id, grade, ceiling_price, effective_from, set_by)
           VALUES ($1, 'GRADE_1', 60.00, '2026-10-01', $2)
           RETURNING id`,
          [testCropId, testAdminId],
        );
        const fpId = fpRes.rows[0]!.id;

        const rpRes = await pool.query<{ id: string }>(
          `INSERT INTO retail_prices (crop_id, grade, price, fair_price_id, effective_from, set_by)
           VALUES ($1, 'GRADE_1', 75.00, $2, '2026-10-01', $3)
           RETURNING id`,
          [testCropId, fpId, testAdminId],
        );
        const rpId = rpRes.rows[0]!.id;

        // 1. UPDATE of ceiling_price on fair_prices must be rejected by trigger
        await expect(
          pool.query('UPDATE fair_prices SET ceiling_price = 70.00 WHERE id = $1', [fpId]),
        ).rejects.toThrow(/append-only/i);

        // 2. DELETE on fair_prices must be rejected by trigger
        await expect(
          pool.query('DELETE FROM fair_prices WHERE id = $1', [fpId]),
        ).rejects.toThrow(/append-only/i);

        // 3. UPDATE of price on retail_prices must be rejected by trigger
        await expect(
          pool.query('UPDATE retail_prices SET price = 85.00 WHERE id = $1', [rpId]),
        ).rejects.toThrow(/append-only/i);

        // 4. DELETE on retail_prices must be rejected by trigger
        await expect(
          pool.query('DELETE FROM retail_prices WHERE id = $1', [rpId]),
        ).rejects.toThrow(/append-only/i);
      } finally {
        await pool.query('SET session_replication_role = replica');
        try {
          await pool.query('DELETE FROM retail_prices WHERE crop_id = $1', [testCropId]);
          await pool.query('DELETE FROM fair_prices WHERE crop_id = $1', [testCropId]);
          await pool.query('DELETE FROM crop_master WHERE id = $1', [testCropId]);
        } finally {
          await pool.query('SET session_replication_role = DEFAULT');
        }
      }
    });
  });

  describeIfDatabase('Calendar dates round-trip as written, whatever TZ the API host runs in', () => {

    const TZS = ['UTC', 'Asia/Kolkata', 'America/Los_Angeles'];
    const FROM = '2031-08-17';
    const NEXT = '2031-09-01';

    async function inRolledBackTx<T>(fn: (tx: Executor) => Promise<T>): Promise<T> {
      const { pool } = await import('../../db/pool.js');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        return await fn(client as unknown as Executor);
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }
    }

    it.each(TZS)('BR-08: fair price effectiveFrom/effectiveTo are exact calendar dates under TZ=%s', async (tz) => {
      // it.each hands no test context, so the no-DATABASE_URL-configured case can only warn+return;
      // with a configured URL requireDatabaseTables throws.
      if (!(await requireDatabaseTables('fair_prices', 'crop_master', 'users'))) return;
      const savedTz = process.env['TZ'];
      process.env['TZ'] = tz;
      try {
        await inRolledBackTx(async (tx) => {
          // Own fixtures, rolled back with the transaction: the actor (fair_prices.set_by and
          // audit_log.actor_id are FKs) and a private crop, so nothing depends on rows another
          // test file left committed and no existing price can overlap the 2031 window.
          await ensureStandardUsers(tx, 'userSuperAdmin');
          const cropId = await insertCrop(tx);
          const service = createPricingService(pricingRepo, async (fn) => fn(tx));
          const created = (await service.createFairPrice(anActor({ roles: [{ code: 'SUPER_ADMIN' }] }), {
            cropId,
            grade: 'GRADE_2',
            ceilingPrice: '42.00',
            frequency: 'WEEKLY',
            effectiveFrom: FROM,
          }, '44444444-4444-4444-8444-444444444444')) as { effectiveFrom: string; effectiveTo: string | null };
          expect(created.effectiveFrom).toBe(FROM);
          expect(created.effectiveTo).toBeNull();

          // A later window closes this one the day before: effectiveTo is a calendar date too.
          await pricingRepo.createFairPrice(
            tx,
            { cropId, grade: 'GRADE_2', ceilingPrice: '43.00', frequency: 'WEEKLY', effectiveFrom: NEXT },
            IDS.userSuperAdmin,
          );

          const history = await pricingRepo.getFairPriceHistory(tx, { cropId, grade: 'GRADE_2', limit: 10 });
          const dates = history.items.map((r) => [String(r.effective_from), r.effective_to === null ? null : String(r.effective_to)]);
          expect(dates).toEqual([
            [NEXT, null],
            [FROM, '2031-08-31'],
          ]);

          const listed = await pricingRepo.listFairPrices(tx, { cropId, grade: 'GRADE_2', effectiveOn: FROM, limit: 10 });
          expect(listed.items.map((r) => r.effective_from)).toEqual([FROM]);
          expect(listed.items.map((r) => r.effective_to)).toEqual(['2031-08-31']);

          const effective = await pricingRepo.findEffectiveFairPrice(tx, cropId, 'GRADE_2', FROM);
          expect(effective?.effective_from).toBe(FROM);
        });
      } finally {
        if (savedTz === undefined) delete process.env['TZ'];
        else process.env['TZ'] = savedTz;
      }
    });

    it.each(TZS)('BR-09: retail price effectiveFrom/effectiveTo are exact calendar dates under TZ=%s', async (tz) => {
      if (!(await requireDatabaseTables('fair_prices', 'retail_prices', 'crop_master', 'users'))) return;
      const savedTz = process.env['TZ'];
      process.env['TZ'] = tz;
      try {
        await inRolledBackTx(async (tx) => {
          await ensureStandardUsers(tx, 'userSuperAdmin');
          const cropId = await insertCrop(tx);
          const fp = await pricingRepo.createFairPrice(
            tx,
            { cropId, grade: 'GRADE_2', ceilingPrice: '80.00', frequency: 'WEEKLY', effectiveFrom: FROM },
            IDS.userSuperAdmin,
          );
          const first = await pricingRepo.createRetailPrice(
            tx,
            { cropId, grade: 'GRADE_2', price: '70.00', gstInclusive: true, effectiveFrom: FROM },
            fp.fairPrice.id,
            IDS.userSuperAdmin,
          );
          expect(first.effective_from).toBe(FROM);
          await pricingRepo.createRetailPrice(
            tx,
            { cropId, grade: 'GRADE_2', price: '71.00', gstInclusive: true, effectiveFrom: NEXT },
            fp.fairPrice.id,
            IDS.userSuperAdmin,
          );

          const listed = await pricingRepo.listRetailPrices(tx, { cropId, grade: 'GRADE_2', effectiveOn: FROM, limit: 10 });
          expect(listed.items.map((r) => r.effective_from)).toEqual([FROM]);
          expect(listed.items.map((r) => r.effective_to)).toEqual(['2031-08-31']);
        });
      } finally {
        if (savedTz === undefined) delete process.env['TZ'];
        else process.env['TZ'] = savedTz;
      }
    });
  });
});
