/**
 * Admin farmer directory and profile (BR-108), with BR-04 (tier from config), BR-14 (free-tier limits
 * unset), BR-16 (customer view untouched), BR-33 (locked fields, masked Aadhaar), BR-35 (audit rows)
 * and BR-53 (masked account numbers).
 *
 * Layers:
 *  1. service against a fake repo (scope SQL per role, locked fields, audit images, idempotent verify,
 *     subscription limits, masking)
 *  2. request schemas
 *  3. the router: permission wiring and FIELD_LOCKED (refused before any SQL runs)
 *  4. BR-16: the customer catalog schemas carry none of the admin farmer fields
 *  5. PostgreSQL: the real repo and SQL inside a transaction that is always rolled back
 */
import type { Server } from 'node:http';
import type pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { InMemoryBlobStorage } from '../../storage/blobStorage.js';
import { aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { catalogHomeSchema, productSchema } from '../catalog/catalog.schema.js';
import {
  adminFarmersRepo,
  type AdminFarmersRepo,
  type FarmerDocumentRow,
  type FarmerPatch,
  type FarmerProfileRow,
  type ListArgs,
  type UserPatch,
} from './admin-farmers.repo.js';
import { adminFarmersRouter } from './admin-farmers.routes.js';
import {
  adminFarmerDetail,
  adminFarmerListItem,
  listAdminFarmersQuery,
  updateAdminFarmerBody,
  type AdminFarmerPayoutDestination,
} from './admin-farmers.schema.js';
import { createAdminFarmersService, farmerScopeFilter } from './admin-farmers.service.js';

const ZONE_A = IDS.zoneNorth;
const ZONE_B = '20000000-0000-4000-8000-000000000002';
const W1 = IDS.warehouseOoty;
const FARMER = IDS.farmer;

// ---------------------------------------------------------------------------
// Scopes
// ---------------------------------------------------------------------------
const superScope = (permission = 'farmer.profile.view_all', userId: string = IDS.userSuperAdmin): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN, permission, userId });
const tohfaScope = (permission = 'farmer.profile.view_all', userId: string = IDS.userTohfaAdmin): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.TOHFA_ADMIN, permission, userId });
const farmerAdminScope = (zoneIds: string[] = [ZONE_A], permission = 'farmer.profile.view_all'): ResolvedScope =>
  aScope({ level: ScopeLevel.VIEW, roleCode: RoleCode.FARMER_ADMIN, permission, zoneIds, userId: IDS.userFarmerAdmin });
const mainScope = (permission = 'farmer.profile.view_all'): ResolvedScope =>
  aScope({ level: ScopeLevel.VIEW, roleCode: RoleCode.MAIN_WH_ADMIN, permission });
const subScope = (warehouseId: string = W1, permission = 'farmer.profile.view_all'): ResolvedScope =>
  aScope({ level: ScopeLevel.VIEW, roleCode: RoleCode.SUB_WH_ADMIN, permission, warehouseIds: [warehouseId], userId: IDS.userSubWhAdmin });
// farmer.document.view: since 2026-10-23 the only admin farmer code FARMER still holds (own).
const farmerScope = (farmerId: string = FARMER, permission = 'farmer.document.view'): ResolvedScope =>
  aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.FARMER, permission, farmerId, userId: IDS.userFarmer });
const lockedScope = (): ResolvedScope => superScope('farmer.profile.edit_locked_field');

// ---------------------------------------------------------------------------
// Fake repo and recording executor
// ---------------------------------------------------------------------------
function aProfile(overrides: Partial<FarmerProfileRow> = {}): FarmerProfileRow {
  return {
    id: FARMER,
    userId: IDS.userFarmer,
    tohfaFarmerId: 'TF-0001',
    fullName: 'Murugan Selvam',
    mobile: '+919812345678',
    email: null,
    accountStatus: 'ACTIVE',
    applicationStatus: 'APPROVED',
    kycStatus: 'VERIFIED',
    zone: { id: ZONE_A, code: 'Z-N', name: 'North' },
    aadhaarLast4: '1234',
    dob: '1980-01-01',
    gender: 'MALE',
    farmingExperienceYears: 18,
    addressLine1: '12/3 Main Road',
    addressLine2: null,
    village: 'Ithalar',
    taluk: 'Ooty',
    district: 'The Nilgiris',
    pincode: '643001',
    isMarketBlocked: false,
    marketBlockReason: null,
    overallRating: 72,
    ratingTier: { code: 'GOOD', label: 'Good' },
    approvedAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2025-12-01T00:00:00Z'),
    ...overrides,
  };
}

function aDocument(overrides: Partial<FarmerDocumentRow> = {}): FarmerDocumentRow {
  return {
    id: newId(),
    farmerId: FARMER,
    docType: 'ID_PROOF',
    storageKey: 'farmers/f1/aadhaar.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    isMandatory: true,
    verificationStatus: 'UNVERIFIED',
    verifiedBy: null,
    verifiedAt: null,
    rejectReason: null,
    createdAt: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  };
}

interface Calls {
  list: ListArgs[];
  updateUser: UserPatch[];
  updateFarmer: FarmerPatch[];
  markVerified: string[];
  scopes: string[];
}

function fakeRepo(
  state: {
    profile?: FarmerProfileRow | null;
    document?: FarmerDocumentRow | null;
    destinations?: AdminFarmerPayoutDestination[];
    config?: Record<string, unknown>;
  } = {},
): { repo: AdminFarmersRepo; calls: Calls } {
  const calls: Calls = { list: [], updateUser: [], updateFarmer: [], markVerified: [], scopes: [] };
  let profile = state.profile === undefined ? aProfile() : state.profile;
  let document = state.document === undefined ? aDocument() : state.document;
  const repo: AdminFarmersRepo = {
    async list(_db, args) {
      calls.list.push(args);
      return { items: [], nextCursor: null, hasMore: false };
    },
    async findProfile(_db, _id, scope) {
      calls.scopes.push(scope.sql);
      return profile;
    },
    async isVisible(_db, _id, scope) {
      calls.scopes.push(scope.sql);
      return profile !== null;
    },
    async lockFarmer(_db, _id, scope) {
      calls.scopes.push(scope.sql);
      return profile !== null;
    },
    async findLandLocations() {
      return [];
    },
    async findCertificationSummary() {
      return { total: 0, verified: 0, unverified: 0, rejected: 0, expired: 0, qualifying: 0, nextQualifyingExpiry: null };
    },
    async updateUser(_db, _userId, patch) {
      calls.updateUser.push(patch);
      profile = profile === null ? null : { ...profile, ...patch };
    },
    async updateFarmer(_db, _farmerId, patch) {
      calls.updateFarmer.push(patch);
      profile = profile === null ? null : { ...profile, ...patch };
    },
    async listDocuments() {
      return document === null ? [] : [document];
    },
    async findDocumentForUpdate() {
      return document;
    },
    async markDocumentVerified(_db, id, by) {
      calls.markVerified.push(id);
      document = { ...document!, verificationStatus: 'VERIFIED', verifiedBy: by, verifiedAt: new Date(), rejectReason: null };
      return document;
    },
    async listPayoutDestinations() {
      return state.destinations ?? [];
    },
    async findCurrentSubscription() {
      return null;
    },
    async getConfig(_db, key) {
      return state.config?.[key];
    },
  };
  return { repo, calls };
}

interface RecordedQuery {
  sql: string;
  params: unknown[];
}

/** An executor that records every statement and answers an audit insert with an id. */
function recordingTx(log: RecordedQuery[]): Executor {
  return {
    async query(sql: string, params: unknown[] = []) {
      log.push({ sql, params });
      return { rows: [{ id: newId() }], rowCount: 1 } as never;
    },
  } as Executor;
}

function serviceWith(repo: AdminFarmersRepo, log: RecordedQuery[] = []) {
  const tx = recordingTx(log);
  return createAdminFarmersService({
    repo,
    db: tx,
    transaction: async (fn) => fn(tx),
    storage: new InMemoryBlobStorage(),
  });
}

const auditInserts = (log: RecordedQuery[]): RecordedQuery[] => log.filter((q) => /INSERT INTO audit_log/.test(q.sql));

async function caught(promise: Promise<unknown>): Promise<AppError> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppError);
  return error as AppError;
}

// ---------------------------------------------------------------------------
// 1. Service (fake repo)
// ---------------------------------------------------------------------------
describe('admin farmers: scope filter per role (BR-108a)', () => {
  it('BR-108a: SUPER_ADMIN, TOHFA_ADMIN and MAIN_WH_ADMIN (no scope dimension) are unrestricted', () => {
    for (const scope of [superScope(), tohfaScope(), mainScope()]) {
      expect(farmerScopeFilter(scope)).toMatchObject({ sql: 'TRUE', params: [] });
    }
  });

  it('BR-108a: a FARMER_ADMIN is confined to its zones by a WHERE clause on the farmer\'s current zone', () => {
    const filter = farmerScopeFilter(farmerAdminScope([ZONE_A]));
    expect(filter.sql).toMatch(/f\.zone_id = ANY\(\$1::uuid\[\]\)/);
    expect(filter.params).toEqual([[ZONE_A]]);
  });

  it('BR-108a: a SUB_WH_ADMIN is confined to farmers whose zone belongs to its warehouse', () => {
    const filter = farmerScopeFilter(subScope(W1));
    expect(filter.sql).toMatch(/z\.warehouse_id = ANY\(\$1::uuid\[\]\)/);
    expect(filter.params).toEqual([[W1]]);
  });

  // Since 2026-10-23 FARMER reaches this module only through `farmer.document.view` (own).
  it('BR-108a: a FARMER reaches only its own row; a customer-shaped scope fails closed', () => {
    const own = farmerScopeFilter(farmerScope(FARMER));
    expect(own.sql).toMatch(/f\.id = \$1::uuid/);
    expect(own.params).toEqual([FARMER]);
    const customer = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.CUSTOMER, customerId: IDS.customer });
    expect(farmerScopeFilter(customer).sql).toBe('FALSE');
  });

  it('BR-108a: the list hands the FARMER_ADMIN zone filter to the repo, and the page envelope comes back', async () => {
    const { repo, calls } = fakeRepo();
    const page = await serviceWith(repo).list(farmerAdminScope([ZONE_A]), listAdminFarmersQuery.parse({ q: 'mur', limit: '5' }));
    expect(calls.list[0]!.scope.params).toEqual([[ZONE_A]]);
    expect(calls.list[0]!.filters).toMatchObject({ q: 'mur' });
    expect(calls.list[0]!.limit).toBe(5);
    expect(page).toEqual({ items: [], page: { nextCursor: null, hasMore: false } });
  });

  it('BR-108a: a farmer outside the caller\'s scope is NOT_FOUND (404), never 403, on every single-farmer read', async () => {
    const { repo } = fakeRepo({ profile: null });
    const service = serviceWith(repo);
    const scope = farmerAdminScope([ZONE_B]);
    for (const call of [
      () => service.get(scope, FARMER),
      () => service.listDocuments(scope, FARMER),
      () => service.getSubscription(scope, FARMER),
      () => service.listBankAccounts(tohfaScope('farmer.bank_account.view'), FARMER),
    ]) {
      const error = await caught(call());
      expect(error.code).toBe('NOT_FOUND');
      expect(error.status).toBe(404);
    }
  });
});

describe('admin farmers: profile (BR-108c, BR-33b, BR-04)', () => {
  it('BR-33b: the profile carries Aadhaar only as its last four digits, and validates against the response schema', async () => {
    const { repo } = fakeRepo();
    const detail = await serviceWith(repo).get(superScope(), FARMER);
    expect(adminFarmerDetail.parse(detail)).toEqual(detail);
    expect(detail.aadhaarLast4).toBe('1234');
    expect(JSON.stringify(detail)).not.toMatch(/aadhaarToken|aadhaar_token|storageKey/);
  });

  it('BR-04: the rating tier is the one the repo resolved from rating_tier_config, never recomputed from a literal', async () => {
    const { repo } = fakeRepo({ profile: aProfile({ overallRating: 72, ratingTier: { code: 'EXCELLENT', label: 'Top' } }) });
    const detail = await serviceWith(repo).get(superScope(), FARMER);
    expect(detail.rating).toEqual({ overallRating: 72, ratingTier: { code: 'EXCELLENT', label: 'Top' } });
  });
});

describe('admin farmers: locked fields and the audited edit (BR-33, BR-35, BR-108d)', () => {
  it.each([
    ['mobile', { mobile: '+919800000001' }],
    ['aadhaarLast4', { aadhaarLast4: '9999' }],
    ['aadhaar', { aadhaar: '123412341234' }],
    ['mobile (malformed value)', { mobile: 'not-a-number' }],
  ])('BR-33a: TOHFA_ADMIN sending %s is 403 FIELD_LOCKED and nothing in the request is applied or audited', async (_label, locked) => {
    const { repo, calls } = fakeRepo();
    const log: RecordedQuery[] = [];
    const error = await caught(
      serviceWith(repo, log).update(tohfaScope('farmer.profile.edit'), null, FARMER, updateAdminFarmerBody.parse({ fullName: 'New Name', ...locked })),
    );
    expect(error.code).toBe('FIELD_LOCKED');
    expect(error.status).toBe(403);
    expect(calls.updateUser).toEqual([]);
    expect(calls.updateFarmer).toEqual([]);
    expect(auditInserts(log)).toEqual([]);
  });

  it('BR-33: SUPER_ADMIN (edit_locked_field) may change mobile and aadhaarLast4; the audit row records both, Aadhaar as last 4 only', async () => {
    const { repo, calls } = fakeRepo();
    const log: RecordedQuery[] = [];
    const detail = await serviceWith(repo, log).update(
      superScope('farmer.profile.edit'),
      lockedScope(),
      FARMER,
      updateAdminFarmerBody.parse({ mobile: '+919800000001', aadhaarLast4: '9999' }),
    );
    expect(calls.updateUser).toEqual([{ mobile: '+919800000001' }]);
    expect(calls.updateFarmer).toEqual([{ aadhaarLast4: '9999' }]);
    expect(detail.mobile).toBe('+919800000001');
    const inserts = auditInserts(log);
    expect(inserts).toHaveLength(1);
    const params = inserts[0]!.params;
    expect(params[3]).toBe('farmer.profile.edit');
    expect(params[4]).toBe('farmer');
    expect(params[5]).toBe(FARMER);
    expect(JSON.parse(params[8] as string)).toMatchObject({ mobile: '+919812345678', aadhaarLast4: '1234' });
    expect(JSON.parse(params[9] as string)).toMatchObject({ mobile: '+919800000001', aadhaarLast4: '9999' });
    expect(new Set(params[10] as string[])).toEqual(new Set(['mobile', 'aadhaarLast4']));
  });

  it('BR-33b: a full Aadhaar number is refused even for SUPER_ADMIN (422, never stored), as are malformed locked values', async () => {
    for (const body of [{ aadhaar: '123412341234' }, { mobile: '9812345678' }, { aadhaarLast4: '12345' }]) {
      const { repo, calls } = fakeRepo();
      const error = await caught(serviceWith(repo).update(superScope('farmer.profile.edit'), lockedScope(), FARMER, updateAdminFarmerBody.parse(body)));
      expect(error.code, JSON.stringify(body)).toBe('VALIDATION_FAILED');
      expect(calls.updateUser).toEqual([]);
      expect(calls.updateFarmer).toEqual([]);
    }
  });

  it('BR-35: TOHFA_ADMIN editing unlocked fields writes one farmer.profile.edit row with before/after images and changed field names', async () => {
    const { repo, calls } = fakeRepo();
    const log: RecordedQuery[] = [];
    const detail = await serviceWith(repo, log).update(
      tohfaScope('farmer.profile.edit'),
      null,
      FARMER,
      updateAdminFarmerBody.parse({ fullName: 'Murugan S', village: 'Kotagiri', pincode: '643001' }),
    );
    expect(calls.updateUser).toEqual([{ fullName: 'Murugan S' }]);
    expect(calls.updateFarmer).toEqual([{ village: 'Kotagiri' }]);
    expect(detail.fullName).toBe('Murugan S');
    const inserts = auditInserts(log);
    expect(inserts).toHaveLength(1);
    expect(inserts[0]!.params[0]).toBe(IDS.userTohfaAdmin);
    expect(inserts[0]!.params[2]).toBe(RoleCode.TOHFA_ADMIN);
    expect(new Set(inserts[0]!.params[10] as string[])).toEqual(new Set(['fullName', 'village']));
  });

  it('BR-35: a request that repeats the current values writes nothing and no audit row', async () => {
    const { repo, calls } = fakeRepo();
    const log: RecordedQuery[] = [];
    await serviceWith(repo, log).update(tohfaScope('farmer.profile.edit'), null, FARMER, updateAdminFarmerBody.parse({ fullName: 'Murugan Selvam' }));
    expect(calls.updateUser).toEqual([]);
    expect(auditInserts(log)).toEqual([]);
  });

  it('BR-108d: an edit of a farmer the scoped load does not return (missing or outside scope) is 404 and writes nothing', async () => {
    const { repo, calls } = fakeRepo({ profile: null });
    const log: RecordedQuery[] = [];
    const error = await caught(serviceWith(repo, log).update(tohfaScope('farmer.profile.edit'), null, newId(), updateAdminFarmerBody.parse({ fullName: 'X Y' })));
    expect(error.code).toBe('NOT_FOUND');
    expect(calls.updateUser).toEqual([]);
    expect(auditInserts(log)).toEqual([]);
  });
});

describe('admin farmers: documents and the idempotent verify (BR-108e, BR-35)', () => {
  it('BR-108e: documents are listed with a signed read URL and never their storage key', async () => {
    const { repo } = fakeRepo();
    const result = await serviceWith(repo).listDocuments(superScope('farmer.document.view'), FARMER);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.readUrl).toEqual(expect.any(String));
    expect(JSON.stringify(result)).not.toContain('"storageKey"');
  });

  it('BR-108e: verifying an UNVERIFIED document records the admin and writes one farmer.document.verify audit row', async () => {
    const doc = aDocument();
    const { repo, calls } = fakeRepo({ document: doc });
    const log: RecordedQuery[] = [];
    const result = await serviceWith(repo, log).verifyDocument(tohfaScope('farmer.document.verify'), FARMER, doc.id);
    expect(result.verificationStatus).toBe('VERIFIED');
    expect(result.verifiedBy).toBe(IDS.userTohfaAdmin);
    expect(calls.markVerified).toEqual([doc.id]);
    const inserts = auditInserts(log);
    expect(inserts).toHaveLength(1);
    expect(inserts[0]!.params[3]).toBe('farmer.document.verify');
    expect(inserts[0]!.params[4]).toBe('farmer_document');
    expect(JSON.parse(inserts[0]!.params[8] as string)).toMatchObject({ verificationStatus: 'UNVERIFIED' });
    expect(JSON.parse(inserts[0]!.params[9] as string)).toMatchObject({ verificationStatus: 'VERIFIED' });
    expect(inserts[0]!.params.join(' ')).not.toContain(doc.storageKey);
  });

  it('BR-108e: verifying an already VERIFIED document is a no-op: 200, original verifier kept, no write, no audit row', async () => {
    const verifiedAt = new Date('2026-02-01T00:00:00Z');
    const doc = aDocument({ verificationStatus: 'VERIFIED', verifiedBy: IDS.userSuperAdmin, verifiedAt });
    const { repo, calls } = fakeRepo({ document: doc });
    const log: RecordedQuery[] = [];
    const result = await serviceWith(repo, log).verifyDocument(tohfaScope('farmer.document.verify'), FARMER, doc.id);
    expect(result).toMatchObject({ verificationStatus: 'VERIFIED', verifiedBy: IDS.userSuperAdmin, verifiedAt: verifiedAt.toISOString() });
    expect(calls.markVerified).toEqual([]);
    expect(auditInserts(log)).toEqual([]);
  });

  it('BR-108e: a document that is not this farmer\'s (or deleted) is 404 and nothing is written', async () => {
    const { repo, calls } = fakeRepo({ document: null });
    const log: RecordedQuery[] = [];
    const error = await caught(serviceWith(repo, log).verifyDocument(superScope('farmer.document.verify'), FARMER, newId()));
    expect(error.code).toBe('NOT_FOUND');
    expect(calls.markVerified).toEqual([]);
    expect(auditInserts(log)).toEqual([]);
  });
});

describe('admin farmers: payout destinations and subscription (BR-108f, BR-53, BR-14)', () => {
  it('BR-53: payout destinations carry only the last four digits of an account number, and reading them writes no audit row', async () => {
    const destination: AdminFarmerPayoutDestination = {
      id: newId(),
      kind: 'BANK',
      accountHolderName: 'Murugan',
      accountNumberLast4: '4321',
      ifsc: 'HDFC0001234',
      bankName: 'HDFC',
      branchName: null,
      upiVpa: null,
      isVerified: false,
      isDefault: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    const { repo } = fakeRepo({ destinations: [destination] });
    const log: RecordedQuery[] = [];
    const result = await serviceWith(repo, log).listBankAccounts(superScope('farmer.bank_account.view'), FARMER);
    expect(result.items).toEqual([destination]);
    expect(auditInserts(log)).toEqual([]);
  });

  it('BR-14b: with the shipped config (gate off, placeholder limit 5) the free-tier listing limit is null, never 5', async () => {
    const { repo } = fakeRepo({ config: { free_tier_limits_enabled: false, free_tier_listing_limit: 5 } });
    const result = await serviceWith(repo).getSubscription(superScope('farmer.subscription.view_tier_limits'), FARMER);
    expect(result).toEqual({ farmerId: FARMER, current: null, freeTierLimits: { enforced: false, listingLimit: null } });
  });

  it('BR-14b: with no config rows at all the limits are null and not enforced (no invented default)', async () => {
    const { repo } = fakeRepo({ config: {} });
    const result = await serviceWith(repo).getSubscription(superScope('farmer.subscription.view_tier_limits'), FARMER);
    expect(result.freeTierLimits).toEqual({ enforced: false, listingLimit: null });
  });

  it('BR-14b: only when the gate is switched on does the limit report the configured value the listing gate applies', async () => {
    const { repo } = fakeRepo({ config: { free_tier_limits_enabled: true, free_tier_listing_limit: 7 } });
    const result = await serviceWith(repo).getSubscription(superScope('farmer.subscription.view_tier_limits'), FARMER);
    expect(result.freeTierLimits).toEqual({ enforced: true, listingLimit: 7 });
  });
});

// ---------------------------------------------------------------------------
// 2. Request schemas
// ---------------------------------------------------------------------------
describe('admin farmers: request schemas (BR-108b, BR-108d)', () => {
  it('BR-108b: the directory accepts q, status, zoneId, ratingTier, limit; refuses unknown keys, bad enums, a foreign cursor and limit > 100', () => {
    expect(listAdminFarmersQuery.safeParse({ q: 'mur', status: 'ACTIVE', zoneId: ZONE_A, ratingTier: 'GOOD', limit: '50' }).success).toBe(true);
    expect(listAdminFarmersQuery.safeParse({ warehouseId: W1 }).success).toBe(false);
    expect(listAdminFarmersQuery.safeParse({ status: 'GONE' }).success).toBe(false);
    expect(listAdminFarmersQuery.safeParse({ ratingTier: 'PLATINUM' }).success).toBe(false);
    expect(listAdminFarmersQuery.safeParse({ cursor: newId() }).success).toBe(false);
    expect(listAdminFarmersQuery.safeParse({ limit: '101' }).success).toBe(false);
  });

  it('BR-108d: the edit body is strict and non-empty; locked keys pass the schema whatever their value (the service decides)', () => {
    expect(updateAdminFarmerBody.safeParse({}).success).toBe(false);
    expect(updateAdminFarmerBody.safeParse({ zoneId: ZONE_A }).success).toBe(false);
    expect(updateAdminFarmerBody.safeParse({ pincode: '043001' }).success).toBe(false);
    expect(updateAdminFarmerBody.safeParse({ mobile: 12 }).success).toBe(true);
    expect(updateAdminFarmerBody.safeParse({ aadhaar: 'x' }).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Router: permission wiring (refused before any SQL)
// ---------------------------------------------------------------------------
describe('admin farmers router (BR-108g, BR-33a)', () => {
  let server: Server;
  const token = (roles: Array<{ code: RoleCode; warehouseId?: string; zoneId?: string }>, extra: { farmerId?: string; customerId?: string } = {}): string =>
    `Bearer ${signAccessToken({ sub: IDS.userSuperAdmin, roles, farmerId: extra.farmerId ?? null, customerId: extra.customerId ?? null })}`;
  const customer = (): string => token([{ code: RoleCode.CUSTOMER }], { customerId: IDS.customer });
  const farmer = (): string => token([{ code: RoleCode.FARMER }], { farmerId: FARMER });

  beforeAll(() => {
    server = createApp().listen(0);
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('BR-108g: the router registers exactly the documented routes', () => {
    const routes = adminFarmersRouter.stack
      .filter((layer) => layer.route !== undefined)
      .flatMap((layer) => {
        const route = layer.route as unknown as { path: string; methods: Record<string, boolean> };
        return Object.keys(route.methods).map((m) => `${m} ${route.path}`);
      });
    expect(new Set(routes)).toEqual(
      new Set([
        'get /',
        'get /:id',
        'patch /:id',
        'get /:id/documents',
        'post /:id/documents/:docId/verify',
        'get /:id/bank-accounts',
        'get /:id/subscription',
      ]),
    );
  });

  it('BR-108g: every route is 401 without a token', async () => {
    const id = newId();
    expect((await request(server).get('/v1/admin/farmers')).status).toBe(401);
    expect((await request(server).get(`/v1/admin/farmers/${id}`)).status).toBe(401);
    expect((await request(server).patch(`/v1/admin/farmers/${id}`).send({ fullName: 'X Y' })).status).toBe(401);
    expect((await request(server).get(`/v1/admin/farmers/${id}/documents`)).status).toBe(401);
    expect((await request(server).post(`/v1/admin/farmers/${id}/documents/${newId()}/verify`)).status).toBe(401);
    expect((await request(server).get(`/v1/admin/farmers/${id}/bank-accounts`)).status).toBe(401);
    expect((await request(server).get(`/v1/admin/farmers/${id}/subscription`)).status).toBe(401);
  });

  it('BR-108g: the directory and profile are 403 for FARMER and CUSTOMER (farmer.profile.view_all = none)', async () => {
    for (const auth of [farmer(), customer()]) {
      expect((await request(server).get('/v1/admin/farmers').set('Authorization', auth)).status).toBe(403);
      expect((await request(server).get(`/v1/admin/farmers/${FARMER}`).set('Authorization', auth)).status).toBe(403);
    }
  });

  it('BR-108g: the edit is 403 for FARMER_ADMIN, MAIN_WH_ADMIN, SUB_WH_ADMIN and CUSTOMER (farmer.profile.edit = none)', async () => {
    for (const auth of [
      token([{ code: RoleCode.FARMER_ADMIN, zoneId: ZONE_A }]),
      token([{ code: RoleCode.MAIN_WH_ADMIN }]),
      token([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: W1 }]),
      customer(),
    ]) {
      const res = await request(server).patch(`/v1/admin/farmers/${FARMER}`).set('Authorization', auth).send({ fullName: 'X Y' });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    }
  });

  it('BR-108g: a FARMER cannot reach even its OWN row through the admin edit or subscription routes (403, owner decision 2026-10-23)', async () => {
    const edit = await request(server).patch(`/v1/admin/farmers/${FARMER}`).set('Authorization', farmer()).send({ fullName: 'X Y' });
    expect(edit.status).toBe(403);
    expect(edit.body.code).toBe('FORBIDDEN');
    const subscription = await request(server).get(`/v1/admin/farmers/${FARMER}/subscription`).set('Authorization', farmer());
    expect(subscription.status).toBe(403);
    expect(subscription.body.code).toBe('FORBIDDEN');
  });

  it('BR-108g: verify is SUPER_ADMIN/TOHFA_ADMIN only; FARMER_ADMIN, MAIN and SUB are 403', async () => {
    for (const auth of [token([{ code: RoleCode.FARMER_ADMIN, zoneId: ZONE_A }]), token([{ code: RoleCode.MAIN_WH_ADMIN }]), token([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: W1 }]), farmer()]) {
      expect((await request(server).post(`/v1/admin/farmers/${FARMER}/documents/${newId()}/verify`).set('Authorization', auth)).status).toBe(403);
    }
  });

  it('BR-108g: documents are 403 for MAIN and SUB (farmer.document.view = none); bank accounts are 403 for everyone but SUPER/TOHFA', async () => {
    for (const auth of [token([{ code: RoleCode.MAIN_WH_ADMIN }]), token([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: W1 }])]) {
      expect((await request(server).get(`/v1/admin/farmers/${FARMER}/documents`).set('Authorization', auth)).status).toBe(403);
    }
    for (const auth of [token([{ code: RoleCode.FARMER_ADMIN, zoneId: ZONE_A }]), token([{ code: RoleCode.MAIN_WH_ADMIN }]), token([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: W1 }]), farmer()]) {
      expect((await request(server).get(`/v1/admin/farmers/${FARMER}/bank-accounts`).set('Authorization', auth)).status).toBe(403);
    }
  });

  it('BR-33a: TOHFA_ADMIN patching mobile or aadhaar through HTTP is 403 FIELD_LOCKED problem+json', async () => {
    for (const body of [{ mobile: '+919800000001' }, { aadhaar: '123412341234', fullName: 'X Y' }]) {
      const res = await request(server).patch(`/v1/admin/farmers/${FARMER}`).set('Authorization', token([{ code: RoleCode.TOHFA_ADMIN }])).send(body);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FIELD_LOCKED');
      expect(res.headers['content-type']).toContain('application/problem+json');
    }
  });
});

// ---------------------------------------------------------------------------
// 4. BR-16: the customer catalog is untouched by these admin fields
// ---------------------------------------------------------------------------
function zodKeys(schema: unknown, seen = new Set<unknown>()): Set<string> {
  const keys = new Set<string>();
  const walk = (s: unknown): void => {
    if (s === null || typeof s !== 'object' || seen.has(s)) return;
    seen.add(s);
    const def = (s as { _def?: Record<string, unknown> })._def;
    const shape = (s as { shape?: unknown }).shape;
    if (shape !== undefined && typeof shape === 'object' && shape !== null) {
      for (const [key, child] of Object.entries(shape)) {
        keys.add(key);
        walk(child);
      }
    }
    if (def !== undefined) for (const value of Object.values(def)) walk(value);
  };
  walk(schema);
  return keys;
}

describe('BR-16: the customer catalog schemas carry none of the admin farmer fields', () => {
  it('BR-16: no farmer-identity key of the admin directory/profile appears anywhere in the catalog product or home schemas', () => {
    const identity = ['farmerId', 'tohfaFarmerId', 'fullName', 'mobile', 'aadhaarLast4', 'landLocations', 'zone', 'zoneId', 'centroid', 'surveyNumber', 'village', 'taluk', 'plots'];
    const catalogKeys = new Set([...zodKeys(productSchema), ...zodKeys(catalogHomeSchema)]);
    expect(catalogKeys.size).toBeGreaterThan(0);
    for (const key of identity) expect(catalogKeys.has(key), key).toBe(false);
    // And the admin schemas do carry them, so the assertion above is not vacuous.
    expect(zodKeys(adminFarmerListItem).has('tohfaFarmerId')).toBe(true);
    expect(zodKeys(adminFarmerDetail).has('landLocations')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. PostgreSQL: real repo, real SQL, always rolled back
// ---------------------------------------------------------------------------
describeIfDatabase('admin farmers (PostgreSQL, rolled back)', () => {
  let pool: pg.Pool;
  let wA = '';
  let wB = '';

  beforeAll(async () => {
    expect(await databaseReady('farmers'), 'the database is reachable and migrated').toBe(true);
    ({ pool } = await import('../../db/pool.js'));
    const wh = await pool.query<{ id: string }>(`SELECT id FROM warehouses WHERE deleted_at IS NULL ORDER BY code LIMIT 2`);
    expect(wh.rows.length, 'two seeded warehouses').toBe(2);
    wA = wh.rows[0]!.id;
    wB = wh.rows[1]!.id;
  });

  async function inRollback<T>(fn: (tx: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      return await fn(client);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  }

  const rand = (): number => Math.floor(10_000_000 + Math.random() * 89_999_999);

  async function aUser(tx: pg.PoolClient, name: string, type: 'ADMIN' | 'FARMER' = 'ADMIN'): Promise<{ id: string; mobile: string }> {
    const id = newId();
    const mobile = `+9195${rand()}`;
    await tx.query(`INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, $4, 'ACTIVE')`, [id, mobile, name, type]);
    return { id, mobile };
  }

  interface World {
    tag: string;
    zoneA: string;
    zoneB: string;
    farmerA: string;
    farmerB: string;
    farmerAUser: string;
    admin: string;
  }

  /** Two zones (A in warehouse wA, B in wB), one farmer in each, all names carrying a unique tag. */
  async function seed(tx: pg.PoolClient): Promise<World> {
    const tag = `bf${rand()}`;
    const zone = async (code: string, warehouseId: string): Promise<string> =>
      (await tx.query<{ id: string }>(`INSERT INTO zones (code, name, warehouse_id) VALUES ($1, $1, $2) RETURNING id`, [`${tag}-${code}`, warehouseId])).rows[0]!.id;
    const zoneA = await zone('A', wA);
    const zoneB = await zone('B', wB);
    const farmer = async (name: string, zoneId: string, rating: number | null): Promise<{ id: string; userId: string }> => {
      const user = await aUser(tx, `${tag} ${name}`, 'FARMER');
      const id = (
        await tx.query<{ id: string }>(
          `INSERT INTO farmers (user_id, tohfa_farmer_id, zone_id, overall_rating, aadhaar_last4, aadhaar_token, village)
           VALUES ($1, $2, $3, $4, '4321', 'tok-secret', 'Ithalar') RETURNING id`,
          [user.id, `${tag}-${name}`, zoneId, rating],
        )
      ).rows[0]!.id;
      return { id, userId: user.id };
    };
    const a = await farmer('Alpha', zoneA, 72);
    const b = await farmer('Beta', zoneB, 40);
    const admin = (await aUser(tx, `${tag} Admin`)).id;
    return { tag, zoneA, zoneB, farmerA: a.id, farmerB: b.id, farmerAUser: a.userId, admin };
  }

  const service = (tx: pg.PoolClient) =>
    createAdminFarmersService({ repo: adminFarmersRepo, db: tx, transaction: async (fn) => fn(tx), storage: new InMemoryBlobStorage() });

  it('BR-108a: a FARMER_ADMIN lists only its zone\'s farmers; another zone\'s farmer is an empty page or a 404, never 403', async () => {
    await inRollback(async (tx) => {
      const w = await seed(tx);
      const fa = farmerAdminScope([w.zoneA]);
      const page = await service(tx).list(fa, listAdminFarmersQuery.parse({ q: w.tag }));
      expect(page.items.map((i) => i.id)).toEqual([w.farmerA]);
      const other = await service(tx).list(fa, listAdminFarmersQuery.parse({ q: w.tag, zoneId: w.zoneB }));
      expect(other).toEqual({ items: [], page: { nextCursor: null, hasMore: false } });
      const error = await caught(service(tx).get(fa, w.farmerB));
      expect(error.status).toBe(404);
      expect((await service(tx).get(fa, w.farmerA)).id).toBe(w.farmerA);
    });
  });

  it('BR-108a: MAIN sees every farmer; SUB only farmers whose zone belongs to its warehouse; SUPER sees both', async () => {
    await inRollback(async (tx) => {
      const w = await seed(tx);
      const ids = async (scope: ResolvedScope): Promise<string[]> =>
        (await service(tx).list(scope, listAdminFarmersQuery.parse({ q: w.tag }))).items.map((i) => i.id).sort();
      expect(await ids(mainScope())).toEqual([w.farmerA, w.farmerB].sort());
      expect(await ids(superScope())).toEqual([w.farmerA, w.farmerB].sort());
      expect(await ids(subScope(wA))).toEqual([w.farmerA]);
      expect(await ids(subScope(wB))).toEqual([w.farmerB]);
    });
  });

  it('BR-04a: the tier comes from rating_tier_config at read time; a newer config generation changes it, and the ratingTier filter follows', async () => {
    await inRollback(async (tx) => {
      const w = await seed(tx);
      const tierOf = async (): Promise<string | null> => (await service(tx).get(superScope(), w.farmerA)).rating.ratingTier?.code ?? null;
      expect(await tierOf()).toBe('GOOD'); // 72 under the seeded 0-100 bands
      const good = await service(tx).list(superScope(), listAdminFarmersQuery.parse({ q: w.tag, ratingTier: 'GOOD' }));
      expect(good.items.map((i) => i.id)).toEqual([w.farmerA]);
      // A newer generation effective today: 72 is now EXCELLENT.
      await tx.query(`DELETE FROM rating_tier_config WHERE effective_from = CURRENT_DATE`);
      await tx.query(
        `INSERT INTO rating_tier_config (tier_code, label, min_score, max_score, sort_order, effective_from) VALUES
           ('POOR', 'Poor', 0, 30, 1, CURRENT_DATE), ('MODERATE', 'Moderate', 30, 50, 2, CURRENT_DATE),
           ('GOOD', 'Good', 50, 60, 3, CURRENT_DATE), ('EXCELLENT', 'Excellent', 60, NULL, 4, CURRENT_DATE)`,
      );
      expect(await tierOf()).toBe('EXCELLENT');
      const excellent = await service(tx).list(superScope(), listAdminFarmersQuery.parse({ q: w.tag, ratingTier: 'EXCELLENT' }));
      expect(excellent.items.map((i) => i.id)).toEqual([w.farmerA]);
    });
  });

  it('BR-108b: q matches name or mobile, status filters the account status, and keyset paging returns every farmer once', async () => {
    await inRollback(async (tx) => {
      const w = await seed(tx);
      const byName = await service(tx).list(superScope(), listAdminFarmersQuery.parse({ q: `${w.tag} alp` }));
      expect(byName.items.map((i) => i.id)).toEqual([w.farmerA]);
      const mobile = (await tx.query<{ mobile: string }>(`SELECT mobile FROM users WHERE id = $1`, [w.farmerAUser])).rows[0]!.mobile;
      const byMobile = await service(tx).list(superScope(), listAdminFarmersQuery.parse({ q: mobile.slice(3) }));
      expect(byMobile.items.map((i) => i.id)).toEqual([w.farmerA]);
      await tx.query(`UPDATE users SET status = 'DISABLED' WHERE id = $1`, [w.farmerAUser]);
      const disabled = await service(tx).list(superScope(), listAdminFarmersQuery.parse({ q: w.tag, status: 'DISABLED' }));
      expect(disabled.items.map((i) => i.id)).toEqual([w.farmerA]);
      const p1 = await service(tx).list(superScope(), listAdminFarmersQuery.parse({ q: w.tag, limit: '1' }));
      expect(p1.page.hasMore).toBe(true);
      const p2 = await service(tx).list(superScope(), listAdminFarmersQuery.parse({ q: w.tag, limit: '1', cursor: p1.page.nextCursor! }));
      expect(p2.page.hasMore).toBe(false);
      expect(new Set([...p1.items, ...p2.items].map((i) => i.id))).toEqual(new Set([w.farmerA, w.farmerB]));
    });
  });

  it('BR-108c: the profile derives land locations from farms/plots, summarises certificates and masks Aadhaar', async () => {
    await inRollback(async (tx) => {
      const w = await seed(tx);
      const farm = (
        await tx.query<{ id: string }>(
          `INSERT INTO farms (farmer_id, name, area_acres, centroid_lat, centroid_lng, is_primary) VALUES ($1, 'Upper field', 2.5, 11.4, 76.7, true) RETURNING id`,
          [w.farmerA],
        )
      ).rows[0]!.id;
      await tx.query(`INSERT INTO farms (farmer_id, name) VALUES ($1, 'Lower field')`, [w.farmerA]);
      await tx.query(`INSERT INTO farms (farmer_id, name, deleted_at) VALUES ($1, 'Sold field', now())`, [w.farmerA]);
      await tx.query(`INSERT INTO plots (farm_id, name, area_acres) VALUES ($1, 'Zone 1', 1.25)`, [farm]);
      await tx.query(
        `INSERT INTO certifications (farmer_id, cert_type, cert_number, issuing_body, issued_on, expires_on, verification_status, verified_by, verified_at)
         VALUES ($1, 'PGS', $2, 'PGS India', CURRENT_DATE - 30, CURRENT_DATE + 300, 'VERIFIED', $3, now()),
                ($1, 'NPOP', $4, 'APEDA', CURRENT_DATE - 400, CURRENT_DATE - 1, 'UNVERIFIED', NULL, NULL)`,
        [w.farmerA, `${w.tag}-1`, w.admin, `${w.tag}-2`],
      );
      const detail = await service(tx).get(superScope(), w.farmerA);
      expect(adminFarmerDetail.parse(detail)).toEqual(detail);
      expect(detail.landLocations.map((l) => l.name)).toEqual(['Upper field', 'Lower field']);
      expect(detail.landLocations[0]).toMatchObject({ areaAcres: 2.5, centroid: { lat: 11.4, lng: 76.7 }, isPrimary: true, hasBoundary: false });
      expect(detail.landLocations[0]!.plots).toEqual([expect.objectContaining({ name: 'Zone 1', areaAcres: 1.25 })]);
      expect(detail.certificationSummary).toMatchObject({ total: 2, verified: 1, unverified: 1, rejected: 0, expired: 1, qualifying: 1 });
      expect(detail.certificationSummary.nextQualifyingExpiry).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(detail.aadhaarLast4).toBe('4321');
      expect(JSON.stringify(detail)).not.toContain('tok-secret');
      expect(detail.zone).toMatchObject({ id: w.zoneA });
    });
  });

  it('BR-33a (PostgreSQL): a TOHFA_ADMIN edit with a locked field changes nothing; a real edit writes one masked audit row in the same transaction', async () => {
    await inRollback(async (tx) => {
      const w = await seed(tx);
      const ta = tohfaScope('farmer.profile.edit', w.admin);
      const error = await caught(service(tx).update(ta, null, w.farmerA, updateAdminFarmerBody.parse({ fullName: 'Changed Name', mobile: '+919800000009' })));
      expect(error.code).toBe('FIELD_LOCKED');
      const name = async (): Promise<string> => (await tx.query<{ full_name: string }>(`SELECT full_name FROM users WHERE id = $1`, [w.farmerAUser])).rows[0]!.full_name;
      expect(await name()).toBe(`${w.tag} Alpha`);

      const detail = await service(tx).update(ta, null, w.farmerA, updateAdminFarmerBody.parse({ fullName: 'Changed Name', taluk: 'Coonoor' }));
      expect(detail).toMatchObject({ fullName: 'Changed Name', address: expect.objectContaining({ taluk: 'Coonoor' }) });
      expect(await name()).toBe('Changed Name');
      const audit = await tx.query<{ n: number; before: Record<string, unknown>; after: Record<string, unknown>; changed: string[] }>(
        `SELECT count(*) OVER ()::int AS n, before, after, changed_fields AS changed FROM audit_log WHERE action_code = 'farmer.profile.edit' AND entity_id = $1`,
        [w.farmerA],
      );
      expect(audit.rows[0]!.n).toBe(1);
      expect(audit.rows[0]!.before).toMatchObject({ fullName: `${w.tag} Alpha`, aadhaarLast4: '4321' });
      expect(audit.rows[0]!.after).toMatchObject({ fullName: 'Changed Name', taluk: 'Coonoor' });
      expect(new Set(audit.rows[0]!.changed)).toEqual(new Set(['fullName', 'taluk']));
      expect(JSON.stringify(audit.rows[0])).not.toContain('tok-secret');
    });
  });

  it('BR-33 (PostgreSQL): SUPER_ADMIN changes the mobile; a mobile already in use is 409 CONFLICT', async () => {
    await inRollback(async (tx) => {
      const w = await seed(tx);
      const sa = superScope('farmer.profile.edit', w.admin);
      const fresh = `+9194${rand()}`;
      expect((await service(tx).update(sa, lockedScope(), w.farmerA, updateAdminFarmerBody.parse({ mobile: fresh }))).mobile).toBe(fresh);
      const taken = (await tx.query<{ mobile: string }>(`SELECT u.mobile FROM users u JOIN farmers f ON f.user_id = u.id WHERE f.id = $1`, [w.farmerB])).rows[0]!.mobile;
      await tx.query('SAVEPOINT s');
      const error = await caught(service(tx).update(sa, lockedScope(), w.farmerA, updateAdminFarmerBody.parse({ mobile: taken })));
      await tx.query('ROLLBACK TO SAVEPOINT s');
      expect(error.code).toBe('CONFLICT');
      expect(error.status).toBe(409);
    });
  });

  it('BR-108e (PostgreSQL): verifying twice records one verification (first verifier kept) and exactly one audit row', async () => {
    await inRollback(async (tx) => {
      const w = await seed(tx);
      const doc = (
        await tx.query<{ id: string }>(
          `INSERT INTO farmer_documents (farmer_id, doc_type, storage_key, mime_type, size_bytes) VALUES ($1, 'ID_PROOF', 'k/aadhaar.pdf', 'application/pdf', 10) RETURNING id`,
          [w.farmerA],
        )
      ).rows[0]!.id;
      const second = (await aUser(tx, `${w.tag} Second`)).id;
      const first = await service(tx).verifyDocument(tohfaScope('farmer.document.verify', w.admin), w.farmerA, doc);
      const again = await service(tx).verifyDocument(superScope('farmer.document.verify', second), w.farmerA, doc);
      expect(first).toMatchObject({ verificationStatus: 'VERIFIED', verifiedBy: w.admin });
      expect(again).toMatchObject({ verificationStatus: 'VERIFIED', verifiedBy: w.admin, verifiedAt: first.verifiedAt });
      const rows = await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log WHERE action_code = 'farmer.document.verify' AND entity_id = $1`, [doc]);
      expect(rows.rows[0]!.n).toBe(1);
      const list = await service(tx).listDocuments(farmerAdminScope([w.zoneA], 'farmer.document.view'), w.farmerA);
      expect(list.items.map((d) => d.id)).toEqual([doc]);
      expect(JSON.stringify(list)).not.toContain('"storageKey"');
      // Another farmer's id with this document is 404.
      expect((await caught(service(tx).verifyDocument(superScope('farmer.document.verify', w.admin), w.farmerB, doc))).status).toBe(404);
    });
  });

  it('BR-53 (PostgreSQL): payout destinations are masked to last 4, never carry the token, and reading writes no audit row', async () => {
    await inRollback(async (tx) => {
      const w = await seed(tx);
      await tx.query(
        `INSERT INTO farmer_bank_accounts (farmer_id, account_holder_name, account_number_last4, account_number_token, ifsc, bank_name, is_default)
         VALUES ($1, 'Alpha', '4321', 'acct-token-secret', 'HDFC0001234', 'HDFC', true)`,
        [w.farmerA],
      );
      const before = (await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log`)).rows[0]!.n;
      const result = await service(tx).listBankAccounts(superScope('farmer.bank_account.view', w.admin), w.farmerA);
      expect(result.items).toEqual([expect.objectContaining({ kind: 'BANK', accountNumberLast4: '4321', isDefault: true })]);
      expect(JSON.stringify(result)).not.toContain('acct-token-secret');
      expect((await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log`)).rows[0]!.n).toBe(before);
    });
  });

  it('BR-14b (PostgreSQL): with the shipped system_config the free-tier listing limit is null and not enforced', async () => {
    await inRollback(async (tx) => {
      const w = await seed(tx);
      const result = await service(tx).getSubscription(farmerAdminScope([w.zoneA], 'farmer.subscription.view_tier_limits'), w.farmerA);
      expect(result).toEqual({ farmerId: w.farmerA, current: null, freeTierLimits: { enforced: false, listingLimit: null } });
      expect((await caught(service(tx).getSubscription(farmerAdminScope([w.zoneA], 'farmer.subscription.view_tier_limits'), w.farmerB))).status).toBe(404);
    });
  });
});
