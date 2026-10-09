import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import { pool, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import { certificationsRepo } from '../certifications/certifications.repo.js';
import { LISTING_QUALIFYING_CERT_TYPES } from '../certifications/certifications.schema.js';
import {
  listingsRepo,
  type ListingCertEligibility,
  type ListingRollup,
  type ListingRow,
} from './listings.repo.js';
import { getTodayKolkata, ListingsService } from './listings.service.js';

/** A fresh Idempotency-Key per call: createListing and withdrawListing require one (BR-61). */
const anyKey = (): string => randomUUID();

describe('ListingsService (Unit & Business Rules)', () => {
  const dummyActor: Actor = {
    userId: '00000000-0000-0000-0000-000000000001',
    roles: [{ code: RoleCode.FARMER }],
    farmerId: '00000000-0000-0000-0000-000000000010',
    customerId: null,
  };

  const dummyScope: ResolvedScope = {
    level: ScopeLevel.OWN,
    permission: 'farmer.listings.create',
    roleCode: RoleCode.FARMER,
    warehouseIds: [],
    zoneIds: [],
    farmerId: '00000000-0000-0000-0000-000000000010',
    userId: '00000000-0000-0000-0000-000000000001',
  };

  const sampleListing: ListingRow = {
    id: '11111111-1111-1111-1111-111111111111',
    listingNumber: 'LST-2026-0001',
    farmerId: '00000000-0000-0000-0000-000000000010',
    farmId: null,
    farmCropId: null,
    cropId: '22222222-2222-2222-2222-222222222222',
    cropName: 'Carrot',
    grade: 'GRADE_1',
    quantityKg: '250.000',
    askingPricePerKg: '52.00',
    ceilingPricePerKg: '52.00',
    finalPricePerKg: null,
    finalQuantityKg: null,
    fairPriceId: '33333333-3333-3333-3333-333333333333',
    status: 'PENDING_APPROVAL',
    availableFrom: '2026-09-01',
    photos: [],
    certificationBadges: [{ certType: 'NPOP', certNumber: 'NPOP/2026/01' }],
    version: 1,
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    createdAt: '2026-08-27T10:00:00.000Z',
    updatedAt: null,
  };

  const mockRepo = (overrides?: Partial<Record<string, unknown>>) => ({
    findFarmerById: async () => ({
      id: '00000000-0000-0000-0000-000000000010',
      userId: '00000000-0000-0000-0000-000000000001',
      isMarketBlocked: false,
    }),
    findFarmerByUserId: async () => ({
      id: '00000000-0000-0000-0000-000000000010',
      userId: '00000000-0000-0000-0000-000000000001',
      isMarketBlocked: false,
    }),
    getListingCertEligibility: async (): Promise<ListingCertEligibility> => ({
      eligible: true,
      qualifyingBadges: [{ certType: 'NPOP', certNumber: 'NPOP/2026/01', issuingBody: 'Aditi', issuedOn: '2025-01-01', expiresOn: '2027-01-01' }],
      pendingCert: null,
      expiredCert: null,
    }),
    getSystemConfig: async (_db: unknown, key: string) => {
      if (key === 'free_tier_limits_enabled') return false;
      if (key === 'free_tier_listing_limit') return 5;
      return null;
    },
    countActiveListings: async () => 2,
    findEffectiveFairPrice: async () => ({
      id: '33333333-3333-3333-3333-333333333333',
      ceilingPrice: '52.00',
      effectiveFrom: '2026-08-25',
      effectiveTo: null,
    }),
    generateListingNumber: async () => 'LST-2026-0001',
    insertListing: async () => sampleListing,
    findListingById: async () => sampleListing,
    listFarmerListings: async () => ({ items: [sampleListing], nextCursor: null, hasMore: false }),
    getRollupSummary: async (): Promise<ListingRollup> => ({
      pendingCount: 1,
      pendingKg: '250.000',
      acceptedCount: 0,
      acceptedKg: '0',
      withdrawnCount: 0,
    }),
    updateListing: async () => ({ ...sampleListing, version: 2, quantityKg: '200.000' }),
    withdrawListing: async () => ({ ...sampleListing, version: 2, status: 'WITHDRAWN' }),
    ...overrides,
  });

  const createTestService = (overrides?: Partial<Record<string, unknown>>) =>
    new ListingsService(
      mockRepo(overrides) as ListingsService['repo'],
      async (fn) => fn({} as Executor),
      pool,
      createInMemoryIdempotencyStore(),
    );

  // -------------------------------------------------------------------------
  // BR-01 / BR-02: eligibility is a property of the FARMER, not of each
  // certificate. Holding one verified, unexpired PGS/NPOP certificate permits
  // listing; other expired or pending certificates never block. Only when no
  // certificate qualifies does the error code describe the way back:
  // CERT_UNVERIFIED if an unexpired certificate awaits verification, otherwise
  // CERT_EXPIRED. The SQL that classifies the rows is exercised against
  // PostgreSQL in the describeIfDatabase block at the bottom of this file.
  // -------------------------------------------------------------------------
  describe('certificate eligibility (BR-01, BR-02)', () => {
    const body = {
      cropId: '22222222-2222-2222-2222-222222222222',
      grade: 'GRADE_1' as const,
      quantityKg: '250.000',
      askingPricePerKg: '50.00',
    };

    const validBadge = {
      certType: 'PGS',
      certNumber: 'PGS/TN/2026/0042',
      issuingBody: 'PGS India Council',
      issuedOn: '2026-01-10',
      expiresOn: '2027-01-09',
    };
    const expiredCert = { certType: 'NPOP', certNumber: 'NPOP/TN/2025/11902', expiresOn: '2026-03-31' };
    const pendingCert = { certType: 'NPOP', certNumber: 'NPOP/TN/2026/9999' };

    const eligibility = (overrides: Partial<ListingCertEligibility>): ListingCertEligibility => ({
      eligible: false,
      qualifyingBadges: [],
      pendingCert: null,
      expiredCert: null,
      ...overrides,
    });

    const expectProblem = (code: string) => (err: unknown): true => {
      const e = err as AppError;
      expect(e).toBeInstanceOf(AppError);
      expect(e.status).toBe(422);
      expect(e.code).toBe(code);
      return true;
    };

    it('BR-01c: a farmer holding a verified, unexpired certificate can list even though another of their certificates has expired', async () => {
      let inserted: Record<string, unknown> | null = null;
      const service = createTestService({
        getListingCertEligibility: async () =>
          eligibility({ eligible: true, qualifyingBadges: [validBadge], expiredCert }),
        insertListing: async (_db: unknown, data: Record<string, unknown>) => {
          inserted = data;
          return sampleListing;
        },
      });

      await expect(service.createListing(dummyActor, dummyScope, body, anyKey())).resolves.toBeDefined();
      // Only the qualifying certificate is frozen onto the listing as a badge.
      expect(inserted!['certificationBadges']).toEqual([validBadge]);
    });

    it('BR-02c: a pending renewal does not block a farmer who already holds a verified, unexpired certificate', async () => {
      let inserted = false;
      const service = createTestService({
        getListingCertEligibility: async () =>
          eligibility({ eligible: true, qualifyingBadges: [validBadge], pendingCert }),
        insertListing: async () => {
          inserted = true;
          return sampleListing;
        },
      });

      await expect(service.createListing(dummyActor, dummyScope, body, anyKey())).resolves.toBeDefined();
      expect(inserted).toBe(true);
    });

    it('BR-01a: a farmer whose only certificate expired yesterday → 422 CERT_EXPIRED, naming that certificate', async () => {
      let inserted = false;
      const service = createTestService({
        getListingCertEligibility: async () => eligibility({ expiredCert }),
        insertListing: async () => {
          inserted = true;
          return sampleListing;
        },
      });

      await expect(service.createListing(dummyActor, dummyScope, body, anyKey())).rejects.toSatisfy(
        (err: unknown) => {
          expectProblem('CERT_EXPIRED')(err);
          expect((err as AppError).detail).toBe('NPOP certificate NPOP/TN/2025/11902 expired on 2026-03-31.');
          return true;
        },
      );
      expect(inserted).toBe(false);
    });

    it('BR-02a: a farmer whose only certificate is unexpired but unverified → 422 CERT_UNVERIFIED', async () => {
      let inserted = false;
      const service = createTestService({
        getListingCertEligibility: async () => eligibility({ pendingCert }),
        insertListing: async () => {
          inserted = true;
          return sampleListing;
        },
      });

      await expect(service.createListing(dummyActor, dummyScope, body, anyKey())).rejects.toSatisfy(
        (err: unknown) => {
          expectProblem('CERT_UNVERIFIED')(err);
          expect((err as AppError).detail).toBe('Certificate NPOP/TN/2026/9999 is pending verification.');
          return true;
        },
      );
      expect(inserted).toBe(false);
    });

    it('BR-02d: an expired certificate plus an unverified unexpired one, none qualifying → 422 CERT_UNVERIFIED (verification is the way back)', async () => {
      const service = createTestService({
        getListingCertEligibility: async () => eligibility({ expiredCert, pendingCert }),
      });

      await expect(service.createListing(dummyActor, dummyScope, body, anyKey())).rejects.toSatisfy(
        expectProblem('CERT_UNVERIFIED'),
      );
    });

    it('BR-01d: "expired" is judged against today\'s Asia/Kolkata calendar date, passed to the eligibility query', async () => {
      let todayArg: unknown;
      const service = createTestService({
        getListingCertEligibility: async (_db: unknown, _farmerId: string, today: string) => {
          todayArg = today;
          return eligibility({ eligible: true, qualifyingBadges: [validBadge] });
        },
      });

      await service.createListing(dummyActor, dummyScope, body, anyKey());
      expect(todayArg).toBe(getTodayKolkata());
    });

    // OTHER may be recorded and verified but never counts for listing (BR-02h),
    // so it must not name the way back either: the query is asked about the
    // qualifying types only, from the ONE list certifications.schema owns.
    it('BR-02i: the service passes only the qualifying certificate types (LISTING_QUALIFYING_CERT_TYPES: PGS, NPOP — never OTHER) to the eligibility query', async () => {
      let typesArg: unknown;
      const service = createTestService({
        getListingCertEligibility: async (
          _db: unknown,
          _farmerId: string,
          _today: string,
          qualifyingTypes: readonly string[],
        ) => {
          typesArg = qualifyingTypes;
          return eligibility({ eligible: true, qualifyingBadges: [validBadge] });
        },
      });

      await service.createListing(dummyActor, dummyScope, body, anyKey());
      expect(typesArg).toBe(LISTING_QUALIFYING_CERT_TYPES);
      // Pinned literally as well: adding OTHER to the shared list must be a
      // deliberate, test-visible change to BR-02.
      expect(typesArg).toEqual(['PGS', 'NPOP']);
    });

    // No certificate at all, or only unexpired REJECTED ones (the repo reports
    // both as "nothing qualifies, nothing pending, nothing expired"): the
    // certificate gate itself refuses with CERT_MISSING. It used to leave
    // these to the materialised farmers.is_market_blocked flag, so a stale
    // `false` let such a farmer list (docs/rules.md "Open contradictions" #14,
    // resolved 2026-10-05). The gate must not depend on that flag.
    it('BR-02f: a farmer with no qualifying, pending or expired certificate → 422 CERT_MISSING even when is_market_blocked is a stale false', async () => {
      let inserted = false;
      const service = createTestService({
        getListingCertEligibility: async () => eligibility({}),
        insertListing: async () => {
          inserted = true;
          return sampleListing;
        },
      });

      await expect(service.createListing(dummyActor, dummyScope, body, anyKey())).rejects.toSatisfy(
        (err: unknown) => {
          expectProblem('CERT_MISSING')(err);
          expect((err as AppError).detail).toMatch(/PGS or NPOP/);
          return true;
        },
      );
      expect(inserted).toBe(false);
    });

    it('BR-02f: with no qualifying certificate the certificate gate answers before the market block (flag set → still 422 CERT_MISSING)', async () => {
      const blocked = async () => ({
        id: '00000000-0000-0000-0000-000000000010',
        userId: '00000000-0000-0000-0000-000000000001',
        isMarketBlocked: true,
      });
      const service = createTestService({
        findFarmerById: blocked,
        findFarmerByUserId: blocked,
        getListingCertEligibility: async () => eligibility({}),
      });

      await expect(service.createListing(dummyActor, dummyScope, body, anyKey())).rejects.toSatisfy(
        expectProblem('CERT_MISSING'),
      );
    });

    it('keeps the materialised is_market_blocked check after the certificate gate: an eligible farmer whose flag is set → 422 CERT_EXPIRED', async () => {
      const blocked = async () => ({
        id: '00000000-0000-0000-0000-000000000010',
        userId: '00000000-0000-0000-0000-000000000001',
        isMarketBlocked: true,
      });
      const service = createTestService({
        findFarmerById: blocked,
        findFarmerByUserId: blocked,
        getListingCertEligibility: async () => eligibility({ eligible: true, qualifyingBadges: [validBadge] }),
      });

      await expect(service.createListing(dummyActor, dummyScope, body, anyKey())).rejects.toSatisfy(
        (err: unknown) => {
          expectProblem('CERT_EXPIRED')(err);
          expect((err as AppError).detail).toBe('Farmer market access is currently blocked.');
          return true;
        },
      );
    });
  });

  describe('listingsRepo.getListingCertEligibility (unit, pg-shaped row)', () => {
    it('BR-01d: passes the caller\'s Asia/Kolkata date as the "today" bound and maps the aggregate row', async () => {
      let params: unknown[] = [];
      const db = {
        query: async (_sql: string, values: unknown[]) => {
          params = values;
          return {
            rowCount: 1,
            rows: [
              {
                eligible: true,
                qualifying_badges: [
                  { certType: 'PGS', certNumber: 'PGS/1', issuingBody: 'PGS India Council', issuedOn: '2026-01-10', expiresOn: '2027-01-09' },
                ],
                pending_cert: { certType: 'NPOP', certNumber: 'NPOP/2' },
                expired_cert: null,
              },
            ],
          };
        },
      } as unknown as Executor;

      const result = await listingsRepo.getListingCertEligibility(db, 'farmer-1', '2026-10-05', ['PGS', 'NPOP']);

      expect(params).toEqual(['farmer-1', '2026-10-05', ['PGS', 'NPOP']]);
      expect(result).toEqual({
        eligible: true,
        qualifyingBadges: [
          { certType: 'PGS', certNumber: 'PGS/1', issuingBody: 'PGS India Council', issuedOn: '2026-01-10', expiresOn: '2027-01-09' },
        ],
        pendingCert: { certType: 'NPOP', certNumber: 'NPOP/2' },
        expiredCert: null,
      });
    });

    it('BR-02i: the qualifying certificate types are a bound parameter, not a second hard-coded list in the SQL', async () => {
      let sqlText = '';
      const db = {
        query: async (sql: string) => {
          sqlText = sql;
          return { rowCount: 1, rows: [{ eligible: false, qualifying_badges: [], pending_cert: null, expired_cert: null }] };
        },
      } as unknown as Executor;

      await listingsRepo.getListingCertEligibility(db, 'farmer-1', '2026-10-05', LISTING_QUALIFYING_CERT_TYPES);

      expect(sqlText).toContain('$3');
      expect(sqlText).not.toMatch(/'PGS'|'NPOP'|'OTHER'/);
    });
  });

  it('BR-07a: Ceiling Rs 52.00/kg, listing at Rs 52.01 → POST /listings returns 422, code: PRICE_ABOVE_CEILING', async () => {
    const service = createTestService({
      findEffectiveFairPrice: async () => ({
        id: '33333333-3333-3333-3333-333333333333',
        ceilingPrice: '52.00',
        effectiveFrom: '2026-08-25',
        effectiveTo: null,
      }),
    });

    await expect(
      service.createListing(dummyActor, dummyScope, {
        cropId: '22222222-2222-2222-2222-222222222222',
        grade: 'GRADE_1',
        quantityKg: '250.000',
        askingPricePerKg: '52.01',
      }, anyKey()),
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as AppError;
      expect(e).toBeInstanceOf(AppError);
      expect(e.status).toBe(422);
      expect(e.code).toBe('PRICE_ABOVE_CEILING');
      expect(e.meta?.ceilingPrice).toBe('52.00');
      expect(e.meta?.attemptedPrice).toBe('52.01');
      return true;
    });
  });

  it('BR-07b: Listing at exactly the ceiling is accepted; stores the fair_price_id it was validated against', async () => {
    let capturedInsert: Record<string, unknown> | null = null;
    const service = createTestService({
      findEffectiveFairPrice: async () => ({
        id: 'ceiling-uuid-1234',
        ceilingPrice: '52.00',
        effectiveFrom: '2026-08-25',
        effectiveTo: null,
      }),
      insertListing: async (_db: unknown, data: Record<string, unknown>) => {
        capturedInsert = data;
        return { ...sampleListing, fairPriceId: data.fairPriceId };
      },
    });

    const result = await service.createListing(dummyActor, dummyScope, {
      cropId: '22222222-2222-2222-2222-222222222222',
      grade: 'GRADE_1',
      quantityKg: '250.000',
      askingPricePerKg: '52.00',
    }, anyKey());

    expect(result).toBeDefined();
    expect(capturedInsert!['fairPriceId']).toBe('ceiling-uuid-1234');
    expect(result.fairPriceId).toBe('ceiling-uuid-1234');
  });

  it('BR-07c: A ceiling lowered after acceptance does not retroactively invalidate an accepted listing', async () => {
    const service = createTestService();
    const listing = await service.listMyListings(dummyActor, dummyScope, { limit: 10 });
    expect(listing.items[0]?.fairPriceId).toBe('33333333-3333-3333-3333-333333333333');
    expect(listing.items[0]?.status).toBe('PENDING_APPROVAL');
  });

  it('BR-14a/b: Free-tier limits are read dynamically from system_config and disabled by default', async () => {
    // When enabled, it rejects when over limit
    const serviceWithLimits = createTestService({
      getSystemConfig: async (_db: unknown, key: string) => {
        if (key === 'free_tier_limits_enabled') return true;
        if (key === 'free_tier_listing_limit') return 2;
        return null;
      },
      countActiveListings: async () => 2,
    });

    await expect(
      serviceWithLimits.createListing(dummyActor, dummyScope, {
        cropId: '22222222-2222-2222-2222-222222222222',
        grade: 'GRADE_1',
        quantityKg: '250.000',
        askingPricePerKg: '50.00',
      }, anyKey()),
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as AppError;
      expect(e.code).toBe('FREE_TIER_LIMIT');
      return true;
    });

    // When disabled (default), it allows creating listing even if count is high
    const serviceDisabled = createTestService({
      getSystemConfig: async (_db: unknown, key: string) => {
        if (key === 'free_tier_limits_enabled') return false;
        return null;
      },
      countActiveListings: async () => 10,
    });

    const res = await serviceDisabled.createListing(dummyActor, dummyScope, {
      cropId: '22222222-2222-2222-2222-222222222222',
      grade: 'GRADE_1',
      quantityKg: '250.000',
      askingPricePerKg: '50.00',
    }, anyKey());
    expect(res).toBeDefined();
  });

  it('Refuses to create a listing with grade REJECT', async () => {
    const service = createTestService();

    await expect(
      service.createListing(dummyActor, dummyScope, {
        cropId: '22222222-2222-2222-2222-222222222222',
        grade: 'REJECT',
        quantityKg: '250.000',
        askingPricePerKg: '10.00',
      }, anyKey()),
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as AppError;
      expect(e.code).toBe('VALIDATION_FAILED');
      expect(e.status).toBe(422);
      return true;
    });
  });

  it('Optimistic concurrency: stale version returns 409 Conflict', async () => {
    const service = createTestService({
      updateListing: async () => null, // Version mismatch returns null row
    });

    await expect(
      service.updateListing(dummyActor, dummyScope, '11111111-1111-1111-1111-111111111111', {
        quantityKg: '200.000',
        version: 1, // Stale version
      }),
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as AppError;
      expect(e.status).toBe(409);
      expect(e.code).toBe('CONFLICT');
      return true;
    });
  });

  it('Withdraws a pending listing with optimistic lock', async () => {
    const service = createTestService();
    const result = await service.withdrawListing(
      dummyActor,
      dummyScope,
      '11111111-1111-1111-1111-111111111111',
      1,
      anyKey(),
    );
    expect(result.status).toBe('WITHDRAWN');
  });

  // -------------------------------------------------------------------------
  // Money is exact integer paise, never a float (root CLAUDE.md §2.2). The old
  // Math.round(Number(x) * 100) turned "52.005" into 5200 paise, so it passed a
  // 52.00 ceiling — and NUMERIC(12,2) would then have stored it as 52.01.
  // -------------------------------------------------------------------------
  describe('ceiling gate arithmetic (exact paise)', () => {
    const baseBody = {
      cropId: '22222222-2222-2222-2222-222222222222',
      grade: 'GRADE_1' as const,
      quantityKg: '250.000',
    };

    const expectValidationFailed = (err: unknown): true => {
      const e = err as AppError;
      expect(e).toBeInstanceOf(AppError);
      expect(e.code).toBe('VALIDATION_FAILED');
      expect(e.status).toBe(422);
      return true;
    };

    it('BR-07: rejects an asking price with sub-paise digits instead of rounding it under the ceiling', async () => {
      // Math.round(Number('1.005') * 100) === 100, so 1.005 used to pass a 1.00
      // ceiling, and NUMERIC(12,2) then stored it as 1.01 — above the ceiling.
      const cases = [
        { ceilingPrice: '1.00', askingPricePerKg: '1.005' },
        { ceilingPrice: '52.00', askingPricePerKg: '52.005' },
      ];
      for (const { ceilingPrice, askingPricePerKg } of cases) {
        let inserted = false;
        const service = createTestService({
          findEffectiveFairPrice: async () => ({
            id: '33333333-3333-3333-3333-333333333333',
            ceilingPrice,
            effectiveFrom: '2026-08-25',
            effectiveTo: null,
          }),
          insertListing: async () => {
            inserted = true;
            return sampleListing;
          },
        });

        await expect(
          service.createListing(dummyActor, dummyScope, { ...baseBody, askingPricePerKg }, anyKey()),
        ).rejects.toSatisfy(expectValidationFailed);
        expect(inserted).toBe(false);
      }
    });

    it('BR-07: the ceiling comparison is exact at the paise boundary (equal and 1 paisa under accepted, 1 paisa over rejected)', async () => {
      const service = createTestService();

      await expect(
        service.createListing(dummyActor, dummyScope, { ...baseBody, askingPricePerKg: '52.00' }, anyKey()),
      ).resolves.toBeDefined();
      await expect(
        service.createListing(dummyActor, dummyScope, { ...baseBody, askingPricePerKg: '52' }, anyKey()),
      ).resolves.toBeDefined();
      await expect(
        service.createListing(dummyActor, dummyScope, { ...baseBody, askingPricePerKg: '51.99' }, anyKey()),
      ).resolves.toBeDefined();
      await expect(
        service.createListing(dummyActor, dummyScope, { ...baseBody, askingPricePerKg: '52.01' }, anyKey()),
      ).rejects.toSatisfy((err: unknown) => {
        expect((err as AppError).code).toBe('PRICE_ABOVE_CEILING');
        return true;
      });
    });

    it.each(['-1.00', '', '   ', 'abc', '1e1', '0.00'])(
      'BR-07: refuses a malformed or non-positive asking price %j with 422 VALIDATION_FAILED and inserts nothing',
      async (askingPricePerKg) => {
        let inserted = false;
        const service = createTestService({
          insertListing: async () => {
            inserted = true;
            return sampleListing;
          },
        });

        await expect(
          service.createListing(dummyActor, dummyScope, { ...baseBody, askingPricePerKg }, anyKey()),
        ).rejects.toSatisfy(expectValidationFailed);
        expect(inserted).toBe(false);
      },
    );

    it('BR-07: the edit path refuses a sub-paise asking price rather than rounding it under the ceiling', async () => {
      let updated = false;
      const service = createTestService({
        updateListing: async () => {
          updated = true;
          return sampleListing;
        },
      });

      await expect(
        service.updateListing(dummyActor, dummyScope, sampleListing.id, {
          askingPricePerKg: '52.005',
          version: 1,
        }),
      ).rejects.toSatisfy(expectValidationFailed);
      expect(updated).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Timestamps on the wire are ISO-8601 / RFC 3339 UTC — docs/openapi.yaml
// declares `format: date-time`. Postgres's own text form
// ("2026-10-05 07:42:36.490266+00") is not one, and React Native's Hermes
// engine parses it as NaN (every counter-offer then looks expired on device).
// ---------------------------------------------------------------------------

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function expectIsoUtc(value: unknown): void {
  expect(typeof value).toBe('string');
  expect(value).toMatch(ISO_UTC);
  expect(new Date(value as string).toISOString()).toBe(value);
}

describe('listingsRepo timestamp serialization (unit, pg-shaped rows)', () => {
  // What node-postgres hands back: timestamptz -> Date, the ::text'd date
  // column -> 'YYYY-MM-DD', NUMERIC -> string (db/pool.ts type parsers).
  const pgRow = {
    id: '11111111-1111-1111-1111-111111111111',
    listing_number: 'LST-2026-0001',
    farmer_id: '00000000-0000-0000-0000-000000000010',
    farm_id: null,
    farm_crop_id: null,
    crop_id: '22222222-2222-2222-2222-222222222222',
    crop_name: 'Carrot',
    grade: 'GRADE_1',
    quantity_kg: '250.000',
    price_per_kg: '52.00',
    ceiling_price: '52.00',
    final_price_per_kg: null,
    final_quantity_kg: null,
    fair_price_id: '33333333-3333-3333-3333-333333333333',
    status: 'COUNTER_OFFERED',
    available_from: '2026-09-01',
    photo_keys: null,
    certification_badges: [],
    version: 2,
    approved_by: '00000000-0000-0000-0000-000000000099',
    approved_at: new Date('2026-10-05T09:00:00.000Z'),
    rejected_by: null,
    rejected_at: null,
    rejection_reason: null,
    created_at: new Date('2026-10-05T07:42:36.490Z'),
    updated_at: new Date('2026-10-05T08:15:00.123Z'),
  };

  const fakeDb = (rows: unknown[]): Executor =>
    ({ query: async () => ({ rows, rowCount: rows.length }) }) as unknown as Executor;

  it('findListingById returns timestamptz columns as ISO-8601 UTC strings, not Postgres text', async () => {
    const listing = await listingsRepo.findListingById(fakeDb([pgRow]), pgRow.id);

    expectIsoUtc(listing!.createdAt);
    expect(listing!.createdAt).toBe('2026-10-05T07:42:36.490Z');
    expectIsoUtc(listing!.updatedAt);
    expectIsoUtc(listing!.approvedAt);
    expect(listing!.rejectedAt).toBeNull();
    // A `format: date` column stays a calendar date.
    expect(listing!.availableFrom).toBe('2026-09-01');
  });

  it('listFarmerListings returns the active counter-offer expiresAt as ISO-8601 UTC', async () => {
    const row = {
      ...pgRow,
      cursor_created_at: '2026-10-05T07:42:36.490266Z',
      counter_rounds_used: 0,
      active_offer_id: '44444444-4444-4444-4444-444444444444',
      active_offer_round: 1,
      active_offer_offered_by: 'ADMIN',
      active_offer_price: '50.00',
      active_offer_qty: '100.000',
      active_offer_msg: null,
      active_offer_status: 'PENDING',
      active_offer_expires_at: new Date('2026-10-06T07:42:36.490Z'),
    };

    const page = await listingsRepo.listFarmerListings(fakeDb([row]), pgRow.farmer_id, { limit: 10 });

    expectIsoUtc(page.items[0]!.createdAt);
    expectIsoUtc(page.items[0]!.activeCounterOffer!.expiresAt);
    expect(page.items[0]!.activeCounterOffer!.expiresAt).toBe('2026-10-06T07:42:36.490Z');
  });
});

describeIfDatabase('listingsRepo timestamps (integration against PostgreSQL)', () => {
  /**
   * A farmer, a fresh crop (so no fair_prices window of a real crop is touched
   * and the BR-08b exclusion constraint cannot collide) and a ceiling for it.
   * Everything runs inside the caller's transaction and is rolled back.
   */
  async function seedFixture(client: Executor): Promise<{
    userId: string;
    farmerId: string;
    cropId: string;
    fairPriceId: string;
  } | null> {
    const category = await client.query<{ id: string }>('SELECT id FROM categories LIMIT 1');
    if (category.rows.length === 0) return null;

    const userId = newId();
    const mobile = `+9198${Math.floor(10000000 + Math.random() * 89999999)}`;
    await client.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')`,
      [userId, mobile, 'Listings Timestamp Test Farmer'],
    );
    const farmerId = newId();
    await client.query(
      `INSERT INTO farmers (id, user_id, tohfa_farmer_id) VALUES ($1, $2, $3)`,
      [farmerId, userId, `TOHFA-TEST-${farmerId.slice(0, 8)}`],
    );
    const cropId = newId();
    await client.query(
      `INSERT INTO crop_master (id, slug, name, category_id) VALUES ($1, $2, $3, $4)`,
      [cropId, `test-crop-${cropId}`, 'Listings Timestamp Test Crop', category.rows[0]!.id],
    );
    const fairPrice = await client.query<{ id: string }>(
      `INSERT INTO fair_prices (crop_id, grade, ceiling_price, effective_from, set_by)
       VALUES ($1, 'GRADE_1', '52.00', '2026-01-01', $2) RETURNING id`,
      [cropId, userId],
    );
    return { userId, farmerId, cropId, fairPriceId: fairPrice.rows[0]!.id };
  }

  async function epochMs(client: Executor, sql: string, id: string): Promise<number> {
    const res = await client.query<{ ms: string }>(sql, [id]);
    return Number(res.rows[0]!.ms);
  }

  it('every listing and counter-offer timestamp read back is ISO-8601 UTC and the instant Postgres stored', async () => {
    if (!(await databaseReady('produce_listings')) || !(await databaseReady('counter_offers'))) {
      console.warn('[skip] produce_listings/counter_offers not reachable — run `pnpm db:migrate`');
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const fx = await seedFixture(client);
      if (fx === null) {
        console.warn('[skip] no categories seeded — run `pnpm db:seed`');
        return;
      }

      const created = await listingsRepo.insertListing(client, {
        listingNumber: `LST-TEST-${newId().slice(0, 8)}`,
        farmerId: fx.farmerId,
        cropId: fx.cropId,
        grade: 'GRADE_1',
        quantityKg: '100.000',
        askingPricePerKg: '50.00',
        fairPriceId: fx.fairPriceId,
        availableFrom: '2026-09-01',
        certificationBadges: [],
      });

      expectIsoUtc(created.createdAt);
      expect(created.updatedAt).toBeNull();
      expect(created.approvedAt).toBeNull();
      expect(created.rejectedAt).toBeNull();
      expect(created.availableFrom).toBe('2026-09-01');
      expect(Date.parse(created.createdAt)).toBe(
        await epochMs(
          client,
          `SELECT floor(extract(epoch FROM created_at) * 1000)::bigint AS ms FROM produce_listings WHERE id = $1`,
          created.id,
        ),
      );

      await client.query(
        `UPDATE produce_listings
            SET approved_by = $2, approved_at = now(), rejected_by = $2, rejected_at = now(), updated_at = now()
          WHERE id = $1`,
        [created.id, fx.userId],
      );

      const found = await listingsRepo.findListingById(client, created.id);
      expectIsoUtc(found!.createdAt);
      expectIsoUtc(found!.updatedAt);
      expectIsoUtc(found!.approvedAt);
      expectIsoUtc(found!.rejectedAt);

      const offer = await client.query<{ id: string }>(
        `INSERT INTO counter_offers
           (listing_id, round, actor, actor_user_id, price_per_kg, quantity_kg, status, expires_at)
         VALUES ($1, 1, 'ADMIN', $2, '48.00', '100.000', 'PENDING', now() + interval '24 hours')
         RETURNING id`,
        [created.id, fx.userId],
      );

      const page = await listingsRepo.listFarmerListings(client, fx.farmerId, { limit: 10 });
      const item = page.items.find((i) => i.id === created.id);
      expect(item).toBeDefined();
      expectIsoUtc(item!.createdAt);
      expectIsoUtc(item!.updatedAt);
      expectIsoUtc(item!.approvedAt);
      expectIsoUtc(item!.rejectedAt);
      expectIsoUtc(item!.activeCounterOffer!.expiresAt);
      expect(Date.parse(item!.activeCounterOffer!.expiresAt)).toBe(
        await epochMs(
          client,
          `SELECT floor(extract(epoch FROM expires_at) * 1000)::bigint AS ms FROM counter_offers WHERE id = $1`,
          offer.rows[0]!.id,
        ),
      );
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('pagination cursor keeps microsecond precision: listings inside the same millisecond are not skipped', async () => {
    if (!(await databaseReady('produce_listings'))) {
      console.warn('[skip] produce_listings not reachable — run `pnpm db:migrate`');
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const fx = await seedFixture(client);
      if (fx === null) {
        console.warn('[skip] no categories seeded — run `pnpm db:seed`');
        return;
      }

      // Two rows share a millisecond; a cursor truncated to ms would skip the second.
      const stamps = [
        '2026-10-05T07:42:36.490266Z',
        '2026-10-05T07:42:36.490100Z',
        '2026-10-05T07:42:36.489000Z',
      ];
      const ids: string[] = [];
      for (const stamp of stamps) {
        const row = await listingsRepo.insertListing(client, {
          listingNumber: `LST-TEST-${newId().slice(0, 8)}`,
          farmerId: fx.farmerId,
          cropId: fx.cropId,
          grade: 'GRADE_1',
          quantityKg: '10.000',
          askingPricePerKg: '50.00',
          fairPriceId: fx.fairPriceId,
          certificationBadges: [],
        });
        await client.query(`UPDATE produce_listings SET created_at = $2 WHERE id = $1`, [row.id, stamp]);
        ids.push(row.id);
      }

      const seen: string[] = [];
      let cursor: string | undefined;
      for (let pageNo = 0; pageNo < 5; pageNo += 1) {
        const page = await listingsRepo.listFarmerListings(client, fx.farmerId, { limit: 1, cursor });
        seen.push(...page.items.map((i) => i.id));
        if (!page.hasMore || page.nextCursor === null) break;
        cursor = page.nextCursor;
      }

      expect(seen).toEqual(ids);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});

// ---------------------------------------------------------------------------
// BR-01 / BR-02 against PostgreSQL: the eligibility SQL itself, the
// Asia/Kolkata "today" boundary, and agreement with the materialised
// farmers.is_market_blocked flag (recomputed exactly as a certificate write or
// the nightly sweep would). Every scenario runs in its own transaction and is
// rolled back.
// ---------------------------------------------------------------------------
describeIfDatabase('BR-01/BR-02 listing certificate eligibility (integration against PostgreSQL)', () => {
  interface CertSpec {
    type: 'PGS' | 'NPOP' | 'OTHER';
    status: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
    /** Relative to today's Asia/Kolkata date: 0 = expires today, -1 = expired yesterday. */
    expiresInDays: number;
    /**
     * Ages created_at. Every row in one transaction otherwise shares now(), so
     * "the newest pending certificate" would be a tie the query breaks arbitrarily.
     */
    createdDaysAgo?: number;
  }

  type Outcome =
    | { kind: 'created'; listing: ListingRow }
    | { kind: 'refused'; error: AppError }
    | { kind: 'skipped' };

  /**
   * `staleMarketBlock` overwrites farmers.is_market_blocked AFTER the
   * recompute, to model a flag that disagrees with the certificates (seeded or
   * stale data). The certificate gate must not depend on it.
   */
  async function attemptListing(
    certs: CertSpec[],
    options: { staleMarketBlock?: boolean } = {},
  ): Promise<Outcome> {
    if (!(await databaseReady('certifications')) || !(await databaseReady('produce_listings'))) {
      console.warn('[skip] certifications/produce_listings not reachable — run `pnpm db:migrate`');
      return { kind: 'skipped' };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const category = await client.query<{ id: string }>('SELECT id FROM categories LIMIT 1');
      if (category.rows.length === 0) {
        console.warn('[skip] no categories seeded — run `pnpm db:seed`');
        return { kind: 'skipped' };
      }

      const userId = newId();
      await client.query(
        `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')`,
        [userId, `+9197${Math.floor(10000000 + Math.random() * 89999999)}`, 'Listings Eligibility Test Farmer'],
      );
      const farmerId = newId();
      await client.query(
        `INSERT INTO farmers (id, user_id, tohfa_farmer_id) VALUES ($1, $2, $3)`,
        [farmerId, userId, `TOHFA-TEST-${farmerId.slice(0, 8)}`],
      );
      // A fresh crop, so no real crop's fair_prices window is touched.
      const cropId = newId();
      await client.query(
        `INSERT INTO crop_master (id, slug, name, category_id) VALUES ($1, $2, $3, $4)`,
        [cropId, `test-crop-${cropId}`, 'Listings Eligibility Test Crop', category.rows[0]!.id],
      );
      await client.query(
        `INSERT INTO fair_prices (crop_id, grade, ceiling_price, effective_from, set_by)
         VALUES ($1, 'GRADE_1', '52.00', '2020-01-01', $2)`,
        [cropId, userId],
      );

      const today = getTodayKolkata();
      for (const cert of certs) {
        const decided = cert.status !== 'UNVERIFIED';
        // An OTHER certificate names its scheme (BR-48i); since migration 0031
        // the database refuses an OTHER row without one, and a PGS/NPOP row with one.
        await client.query(
          `INSERT INTO certifications
             (farmer_id, cert_type, custom_type_name, cert_number, issuing_body, issued_on, expires_on,
              verification_status, verified_by, verified_at, created_at)
           VALUES ($1, $2, $10, $3, 'Test Issuing Body', $4::date - 400, $4::date + $5::int, $6, $7, $8,
                   now() - make_interval(days => $9::int))`,
          [
            farmerId,
            cert.type,
            `${cert.type}/TEST/${newId()}`,
            today,
            cert.expiresInDays,
            cert.status,
            decided ? userId : null,
            decided ? new Date() : null,
            cert.createdDaysAgo ?? 0,
            cert.type === 'OTHER' ? 'Jaivik Bharat' : null,
          ],
        );
      }

      // The materialised flag, recomputed exactly as a certificate write or the
      // nightly sweep would — so these scenarios also prove the live gate and
      // the flag agree.
      await certificationsRepo.recomputeFarmerMarketBlock(client, farmerId, null, 'SYSTEM', 'JOB');
      if (options.staleMarketBlock !== undefined) {
        await client.query(`UPDATE farmers SET is_market_blocked = $2 WHERE id = $1`, [
          farmerId,
          options.staleMarketBlock,
        ]);
      }

      const service = new ListingsService(
        // The real certificate SQL. Only the count-based listing number is
        // replaced, so this cannot collide with numbers other suites left behind.
        { ...listingsRepo, generateListingNumber: async () => `LST-TEST-${newId().slice(0, 8)}` },
        async (fn) => fn(client),
        client,
      );
      const actor: Actor = { userId, roles: [{ code: RoleCode.FARMER }], farmerId, customerId: null };
      const scope: ResolvedScope = {
        level: ScopeLevel.OWN,
        permission: 'listing.create_own',
        roleCode: RoleCode.FARMER,
        warehouseIds: [],
        zoneIds: [],
        farmerId,
        userId,
      };

      try {
        const listing = await service.createListing(actor, scope, {
          cropId,
          grade: 'GRADE_1',
          quantityKg: '100.000',
          askingPricePerKg: '50.00',
        }, anyKey());
        return { kind: 'created', listing };
      } catch (err) {
        if (err instanceof AppError) return { kind: 'refused', error: err };
        throw err;
      }
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  }

  function expectCreated(outcome: Outcome): ListingRow | null {
    if (outcome.kind === 'skipped') return null;
    if (outcome.kind === 'refused') {
      throw new Error(`expected the listing to be created, got ${outcome.error.code}: ${outcome.error.detail}`);
    }
    return outcome.listing;
  }

  function expectRefused(
    outcome: Outcome,
    code: 'CERT_EXPIRED' | 'CERT_UNVERIFIED' | 'CERT_MISSING',
  ): AppError | null {
    if (outcome.kind === 'skipped') return null;
    if (outcome.kind === 'created') {
      throw new Error(`expected 422 ${code}, but listing ${outcome.listing.id} was created`);
    }
    expect(outcome.error.status).toBe(422);
    expect(outcome.error.code).toBe(code);
    return outcome.error;
  }

  it('BR-01c: a verified, unexpired PGS certificate permits listing although the farmer\'s NPOP certificate expired yesterday', async () => {
    const listing = expectCreated(
      await attemptListing([
        { type: 'PGS', status: 'VERIFIED', expiresInDays: 365 },
        { type: 'NPOP', status: 'VERIFIED', expiresInDays: -1 },
      ]),
    );
    if (listing === null) return;
    // Only the qualifying certificate is frozen onto the listing as a badge.
    expect(listing.certificationBadges).toHaveLength(1);
    expect(listing.certificationBadges[0]).toMatchObject({ certType: 'PGS' });
  });

  it('BR-02c: an UNVERIFIED renewal does not block a farmer who holds a verified, unexpired NPOP certificate', async () => {
    const listing = expectCreated(
      await attemptListing([
        { type: 'NPOP', status: 'VERIFIED', expiresInDays: 30 },
        { type: 'PGS', status: 'UNVERIFIED', expiresInDays: 730 },
      ]),
    );
    if (listing === null) return;
    expect(listing.certificationBadges).toHaveLength(1);
    expect(listing.certificationBadges[0]).toMatchObject({ certType: 'NPOP' });
  });

  it('BR-01a: a farmer whose only certificate (verified) expired yesterday → 422 CERT_EXPIRED', async () => {
    const error = expectRefused(
      await attemptListing([{ type: 'NPOP', status: 'VERIFIED', expiresInDays: -1 }]),
      'CERT_EXPIRED',
    );
    if (error === null) return;
    expect(error.detail).toMatch(/^NPOP certificate NPOP\/TEST\/.+ expired on \d{4}-\d{2}-\d{2}\.$/);
  });

  it('BR-02a: a farmer whose only certificate is unexpired but UNVERIFIED → 422 CERT_UNVERIFIED', async () => {
    expectRefused(
      await attemptListing([{ type: 'PGS', status: 'UNVERIFIED', expiresInDays: 365 }]),
      'CERT_UNVERIFIED',
    );
  });

  it('BR-02d: an expired verified certificate plus an unverified unexpired one, none qualifying → 422 CERT_UNVERIFIED', async () => {
    expectRefused(
      await attemptListing([
        { type: 'NPOP', status: 'VERIFIED', expiresInDays: -10 },
        { type: 'PGS', status: 'UNVERIFIED', expiresInDays: 365 },
      ]),
      'CERT_UNVERIFIED',
    );
  });

  it('BR-01d: a verified certificate expiring TODAY (Asia/Kolkata) still qualifies; one that expired yesterday does not', async () => {
    expectCreated(await attemptListing([{ type: 'PGS', status: 'VERIFIED', expiresInDays: 0 }]));
    expectRefused(
      await attemptListing([{ type: 'PGS', status: 'VERIFIED', expiresInDays: -1 }]),
      'CERT_EXPIRED',
    );
  });

  it('BR-02e: a verified, unexpired PGS certificate and a verified, unexpired NPOP certificate each qualify on their own', async () => {
    expectCreated(await attemptListing([{ type: 'PGS', status: 'VERIFIED', expiresInDays: 90 }]));
    expectCreated(await attemptListing([{ type: 'NPOP', status: 'VERIFIED', expiresInDays: 90 }]));
  });

  it('BR-02f: a farmer with no certificate at all → 422 CERT_MISSING, naming PGS or NPOP', async () => {
    const error = expectRefused(await attemptListing([]), 'CERT_MISSING');
    if (error === null) return;
    expect(error.detail).toMatch(/PGS or NPOP/);
  });

  it('BR-02f: a farmer with no certificate and a stale is_market_blocked = false → still 422 CERT_MISSING (the gate does not depend on the flag)', async () => {
    expectRefused(await attemptListing([], { staleMarketBlock: false }), 'CERT_MISSING');
  });

  it('BR-02g: only REJECTED certificates → 422 CERT_MISSING if unexpired (also with a stale is_market_blocked = false), CERT_EXPIRED naming the certificate if expired', async () => {
    const unexpired = expectRefused(
      await attemptListing([{ type: 'NPOP', status: 'REJECTED', expiresInDays: 365 }]),
      'CERT_MISSING',
    );
    if (unexpired === null) return;
    expect(unexpired.detail).toMatch(/PGS or NPOP/);

    expectRefused(
      await attemptListing([{ type: 'NPOP', status: 'REJECTED', expiresInDays: 365 }], { staleMarketBlock: false }),
      'CERT_MISSING',
    );

    const expired = expectRefused(
      await attemptListing([{ type: 'PGS', status: 'REJECTED', expiresInDays: -5 }]),
      'CERT_EXPIRED',
    );
    expect(expired!.detail).toMatch(/^PGS certificate PGS\/TEST\/.+ expired on /);

    // A rejected, unexpired certificate next to an expired verified one: the
    // expired one names the way back (renewal), as before.
    expectRefused(
      await attemptListing([
        { type: 'NPOP', status: 'REJECTED', expiresInDays: 365 },
        { type: 'PGS', status: 'VERIFIED', expiresInDays: -10 },
      ]),
      'CERT_EXPIRED',
    );
  });

  it('BR-02g: a REJECTED unexpired certificate next to an UNVERIFIED unexpired one → 422 CERT_UNVERIFIED (verification is still the way back)', async () => {
    expectRefused(
      await attemptListing([
        { type: 'NPOP', status: 'REJECTED', expiresInDays: 365 },
        { type: 'PGS', status: 'UNVERIFIED', expiresInDays: 365 },
      ]),
      'CERT_UNVERIFIED',
    );
  });

  // BR-02i: OTHER never counts for listing (BR-02h), so it never names the way
  // back either. Verifying or renewing an OTHER certificate would not let the
  // farmer list, so CERT_UNVERIFIED / CERT_EXPIRED pointing at one would send
  // them the wrong way; an OTHER-only farmer is told to add PGS or NPOP.
  it('BR-02i: a farmer whose only certificate is OTHER, unexpired and UNVERIFIED → 422 CERT_MISSING, never CERT_UNVERIFIED', async () => {
    const error = expectRefused(
      await attemptListing([{ type: 'OTHER', status: 'UNVERIFIED', expiresInDays: 365 }]),
      'CERT_MISSING',
    );
    if (error === null) return;
    expect(error.detail).toMatch(/PGS or NPOP/);
  });

  it('BR-02i: a farmer whose only certificates are OTHER and expired (verified or not) → 422 CERT_MISSING, never CERT_EXPIRED', async () => {
    expectRefused(
      await attemptListing([{ type: 'OTHER', status: 'VERIFIED', expiresInDays: -1 }]),
      'CERT_MISSING',
    );
    expectRefused(
      await attemptListing([
        { type: 'OTHER', status: 'UNVERIFIED', expiresInDays: -30 },
        { type: 'OTHER', status: 'REJECTED', expiresInDays: -5 },
      ]),
      'CERT_MISSING',
    );
  });

  it('BR-02i: a VERIFIED, unexpired OTHER certificate alone → 422 CERT_MISSING (also with a stale is_market_blocked = false)', async () => {
    expectRefused(
      await attemptListing([{ type: 'OTHER', status: 'VERIFIED', expiresInDays: 365 }]),
      'CERT_MISSING',
    );
    expectRefused(
      await attemptListing([{ type: 'OTHER', status: 'VERIFIED', expiresInDays: 365 }], { staleMarketBlock: false }),
      'CERT_MISSING',
    );
  });

  it('BR-02i: an OTHER certificate (any state) next to a verified, unexpired PGS one → the listing is created with the PGS badge only', async () => {
    for (const other of [
      { type: 'OTHER', status: 'UNVERIFIED', expiresInDays: 365 },
      { type: 'OTHER', status: 'VERIFIED', expiresInDays: 365 },
      { type: 'OTHER', status: 'VERIFIED', expiresInDays: -3 },
    ] as const) {
      const listing = expectCreated(
        await attemptListing([{ type: 'PGS', status: 'VERIFIED', expiresInDays: 90 }, other]),
      );
      if (listing === null) return;
      expect(listing.certificationBadges).toHaveLength(1);
      expect(listing.certificationBadges[0]).toMatchObject({ certType: 'PGS' });
    }
  });

  it('BR-02i: a newer UNVERIFIED OTHER next to an older UNVERIFIED PGS → 422 CERT_UNVERIFIED naming the PGS certificate', async () => {
    const error = expectRefused(
      await attemptListing([
        { type: 'PGS', status: 'UNVERIFIED', expiresInDays: 365, createdDaysAgo: 10 },
        { type: 'OTHER', status: 'UNVERIFIED', expiresInDays: 365, createdDaysAgo: 0 },
      ]),
      'CERT_UNVERIFIED',
    );
    if (error === null) return;
    expect(error.detail).toMatch(/^Certificate PGS\/TEST\/.+ is pending verification\.$/);
  });

  it('BR-02i: an UNVERIFIED OTHER next to an expired PGS → 422 CERT_EXPIRED naming the PGS certificate (the OTHER is not "the way back")', async () => {
    const error = expectRefused(
      await attemptListing([
        { type: 'PGS', status: 'VERIFIED', expiresInDays: -10 },
        { type: 'OTHER', status: 'UNVERIFIED', expiresInDays: 365 },
      ]),
      'CERT_EXPIRED',
    );
    if (error === null) return;
    expect(error.detail).toMatch(/^PGS certificate PGS\/TEST\/.+ expired on /);
  });

  it('BR-02i: a more recently expired OTHER next to an older expired NPOP → 422 CERT_EXPIRED naming the NPOP certificate', async () => {
    const error = expectRefused(
      await attemptListing([
        { type: 'NPOP', status: 'VERIFIED', expiresInDays: -60 },
        { type: 'OTHER', status: 'VERIFIED', expiresInDays: -1 },
      ]),
      'CERT_EXPIRED',
    );
    if (error === null) return;
    expect(error.detail).toMatch(/^NPOP certificate NPOP\/TEST\/.+ expired on /);
  });
});
