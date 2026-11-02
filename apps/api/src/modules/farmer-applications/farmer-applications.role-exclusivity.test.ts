/**
 * BR-135 on farmer approval: approving an application gives the applicant's account the FARMER role
 * and a `farmers` row. The account is the application's `user_id` or, when that is null, the live
 * user holding the application's mobile (the users upsert in approveApplication). If that account
 * is a SUPER_ADMIN, TOHFA_ADMIN, MAIN_WH_ADMIN or SUB_WH_ADMIN, approval is refused (409) before
 * anything is written. A Farmer Admin applicant is approved as usual (an elected farmer).
 *
 * Service against a fake repo with `withTransaction` intercepted; no database.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PoolClient } from 'pg';
import type * as PoolModule from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { anActor, IDS } from '../../test/factories.js';
import type { FarmerApplicationRow, FarmerApplicationsRepo } from './farmer-applications.repo.js';
import { createFarmerApplicationsService } from './farmer-applications.service.js';

const capture = vi.hoisted(() => ({
  queries: [] as string[],
}));

vi.mock('../../db/pool.js', async (importOriginal) => {
  const actual = await importOriginal<typeof PoolModule>();
  const tx = {
    query: async (sql: string) => {
      capture.queries.push(sql);
      return { rows: [{ id: '30000000-0000-4000-8000-0000000000aa' }], rowCount: 1 };
    },
  };
  return {
    ...actual,
    withTransaction: async <T>(fn: (client: PoolClient) => Promise<T>): Promise<T> => fn(tx as unknown as PoolClient),
  };
});

const APP_ID = '11111111-1111-1111-1111-111111111111';
const APPLICANT_USER_ID = '00000000-0000-4000-8000-000000000135';
const REACHED_ALLOCATION = 'reached allocateNextTohfaFarmerId';

function anApplication(overrides: Partial<FarmerApplicationRow> = {}): FarmerApplicationRow {
  return {
    id: APP_ID,
    mobile: '+919812300135',
    full_name: 'Applicant',
    preferred_locale: 'en',
    status: 'AUDIT',
    is_draft: false,
    current_step: 5,
    completed_steps: [1, 2, 3, 4],
    step1_personal: {},
    step2_farm_details: {},
    step3_location: { locations: [{ id: 'loc-a', label: 'Plot', areaAcres: 1 }] },
    step4_documents: {},
    user_id: APPLICANT_USER_ID,
    farmer_id: null,
    submitted_at: null,
    created_at: new Date(),
    updated_at: null,
    ...overrides,
  } as FarmerApplicationRow;
}

interface Lookup {
  userId: string | null;
  mobile: string;
}

/**
 * Only the calls approval makes before its first write are real; allocation (the first write)
 * throws a sentinel, so a test that sees the sentinel knows the BR-135 guard let approval through.
 */
function fakeRepo(app: FarmerApplicationRow, applicantRoles: string[]): { repo: FarmerApplicationsRepo; lookups: Lookup[] } {
  const lookups: Lookup[] = [];
  const unexpected = (name: string) => async () => {
    throw new Error(`approval must not call ${name} here`);
  };
  const repo = {
    findById: async () => app,
    findApplicantLiveRoles: async (_db: unknown, lookup: Lookup) => {
      lookups.push(lookup);
      return applicantRoles;
    },
    allocateNextTohfaFarmerId: async () => {
      throw new Error(REACHED_ALLOCATION);
    },
    transitionStatus: unexpected('transitionStatus'),
  } as unknown as FarmerApplicationsRepo;
  return { repo, lookups };
}

const admin = anActor({ userId: IDS.userSuperAdmin });

afterEach(() => {
  capture.queries.length = 0;
});

describe('BR-135: farmer approval never makes a single-role admin a farmer', () => {
  for (const role of ['SUPER_ADMIN', 'TOHFA_ADMIN', 'MAIN_WH_ADMIN', 'SUB_WH_ADMIN']) {
    it(`BR-135: refuses approving an application whose account is a ${role} (409, nothing written)`, async () => {
      const { repo } = fakeRepo(anApplication(), [role]);
      const error = await createFarmerApplicationsService(repo)
        .approveApplication(admin, APP_ID, {})
        .then(
          () => null,
          (e: unknown) => e,
        );
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe('CONFLICT');
      expect((error as AppError).status).toBe(409);
      expect((error as AppError).meta).toMatchObject({ rule: 'BR-135' });
      expect(capture.queries.filter((sql) => /INSERT|UPDATE/.test(sql))).toEqual([]);
    });
  }

  it('BR-135: with no user_id on the application, the account is looked up by the application mobile', async () => {
    const { repo, lookups } = fakeRepo(anApplication({ user_id: null }), ['SUB_WH_ADMIN']);
    await expect(createFarmerApplicationsService(repo).approveApplication(admin, APP_ID, {})).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    expect(lookups).toEqual([{ userId: null, mobile: '+919812300135' }]);
  });

  it('BR-135: a Farmer Admin applicant is approved as usual (an elected farmer may be a farmer)', async () => {
    const { repo, lookups } = fakeRepo(anApplication(), ['FARMER_ADMIN']);
    await expect(createFarmerApplicationsService(repo).approveApplication(admin, APP_ID, {})).rejects.toThrow(
      REACHED_ALLOCATION,
    );
    expect(lookups).toEqual([{ userId: APPLICANT_USER_ID, mobile: '+919812300135' }]);
  });

  it('BR-135: an applicant with no roles yet is approved as usual', async () => {
    const { repo } = fakeRepo(anApplication(), []);
    await expect(createFarmerApplicationsService(repo).approveApplication(admin, APP_ID, {})).rejects.toThrow(
      REACHED_ALLOCATION,
    );
  });
});
