/**
 * BR-135 on the promotion path (BR-114 approve, BR-117 create): promotion is the one live code path
 * that gives an EXISTING account a new admin role. A Farmer Admin is an elected farmer and may hold
 * FARMER (and a farmers row); promoting it into SUPER_ADMIN, TOHFA_ADMIN or MAIN_WH_ADMIN would
 * leave a single-role admin that is also a farmer. Both create and approve refuse that (409, nothing
 * written). Service against a fake repo; no database.
 */
import { describe, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { resolveScope, type ResolvedScope } from '../../rbac/requirePermission.js';
import { aRole, anActor, newId } from '../../test/factories.js';
import type { AdminPromotionsRepo, PromotionRow } from './admin-promotions.repo.js';
import { createAdminPromotionsService } from './admin-promotions.service.js';

function superScope(permission: string): ResolvedScope {
  const scope = resolveScope(anActor({ userId: newId(), roles: [aRole(RoleCode.SUPER_ADMIN)] }), permission);
  if (scope === null) throw new Error(`SUPER_ADMIN holds none of ${permission}`);
  return scope;
}

function aRequest(overrides: Partial<PromotionRow> = {}): PromotionRow {
  return {
    id: newId(),
    targetUserId: newId(),
    fromRole: 'FARMER_ADMIN',
    toRole: 'TOHFA_ADMIN',
    requestedBy: newId(),
    reason: 'Runs the zone well',
    status: 'PENDING',
    decidedBy: null,
    decidedAt: null,
    decisionNote: null,
    createdAt: new Date('2026-11-02T09:00:00Z'),
    ...overrides,
  };
}

interface Target {
  roles: string[];
  hasLiveFarmer: boolean;
}

function fakeRepo(request: PromotionRow | null, target: Target): { repo: AdminPromotionsRepo; events: string[] } {
  const events: string[] = [];
  const repo: AdminPromotionsRepo = {
    async findForUpdate() {
      events.push('load');
      return request;
    },
    async findById() {
      return request;
    },
    async list() {
      return { items: [], nextCursor: null, hasMore: false };
    },
    async hasPendingForTarget() {
      events.push('pendingCheck');
      return false;
    },
    async insertRequest(_db, input) {
      events.push(`insert:${input.fromRole}->${input.toRole}`);
      return aRequest({ ...input });
    },
    async lockTargetRoles() {
      events.push('lockTarget');
      return target.roles;
    },
    async hasLiveFarmer() {
      events.push('farmerCheck');
      return target.hasLiveFarmer;
    },
    async endRoleAssignments(_db, _userId, roleCode) {
      events.push(`end:${roleCode}`);
      return 1;
    },
    async addRoleAssignment(_db, input) {
      events.push(`add:${input.roleCode}`);
    },
    async markApproved(_db, _id, decidedBy, note) {
      events.push('approve');
      return { ...request!, status: 'APPROVED', decidedBy, decidedAt: new Date(), decisionNote: note };
    },
    async markRejected() {
      throw new Error('unexpected reject');
    },
    async revokeSessions() {
      events.push('revokeSessions');
    },
    async revokeRefreshTokens() {
      events.push('revokeRefreshTokens');
      return 1;
    },
  };
  return { repo, events };
}

function serviceWith(repo: AdminPromotionsRepo) {
  const tx = {
    async query() {
      return { rows: [{ id: newId() }], rowCount: 1 } as never;
    },
  } as Executor;
  return createAdminPromotionsService({
    repo,
    db: tx,
    transaction: async (fn) => fn(tx),
    invalidateAccessTokens: async () => undefined,
  });
}

async function caught(promise: Promise<unknown>): Promise<AppError> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppError);
  return error as AppError;
}

const WRITES = /^(insert|add|end|approve|revokeSessions|revokeRefreshTokens)/;

describe('BR-135: promotion never makes a single-role admin out of a farmer or customer', () => {
  it('BR-135: approve refuses promoting a Farmer Admin who also holds FARMER into TOHFA_ADMIN (409, nothing written)', async () => {
    const { repo, events } = fakeRepo(aRequest(), { roles: ['FARMER', 'FARMER_ADMIN'], hasLiveFarmer: true });
    const error = await caught(serviceWith(repo).approve(superScope('admin.promotion.approve'), newId(), {}));
    expect(error.code).toBe('CONFLICT');
    expect(error.status).toBe(409);
    expect(error.meta).toMatchObject({ rule: 'BR-135' });
    expect(events.filter((e) => WRITES.test(e))).toEqual([]);
  });

  it('BR-135: approve refuses when the target has a live farmers row even without a FARMER role', async () => {
    const { repo, events } = fakeRepo(aRequest({ toRole: 'MAIN_WH_ADMIN' }), { roles: ['FARMER_ADMIN'], hasLiveFarmer: true });
    const error = await caught(serviceWith(repo).approve(superScope('admin.promotion.approve'), newId(), {}));
    expect(error.code).toBe('CONFLICT');
    expect(events.filter((e) => WRITES.test(e))).toEqual([]);
  });

  it('BR-135: approve refuses when the target holds CUSTOMER', async () => {
    const { repo } = fakeRepo(aRequest({ toRole: 'SUPER_ADMIN' }), { roles: ['CUSTOMER', 'FARMER_ADMIN'], hasLiveFarmer: false });
    const error = await caught(serviceWith(repo).approve(superScope('admin.promotion.approve'), newId(), {}));
    expect(error.code).toBe('CONFLICT');
  });

  it('BR-135: approve still promotes a Farmer Admin who is not a farmer or customer (admin + admin not restricted)', async () => {
    const { repo, events } = fakeRepo(aRequest(), { roles: ['FARMER_ADMIN'], hasLiveFarmer: false });
    const result = await serviceWith(repo).approve(superScope('admin.promotion.approve'), newId(), {});
    expect(result.status).toBe('APPROVED');
    expect(events).toContain('end:FARMER_ADMIN');
    expect(events).toContain('add:TOHFA_ADMIN');
  });

  it('BR-135: create refuses a promotion request for a Farmer Admin who is also a farmer (409, nothing written)', async () => {
    const { repo, events } = fakeRepo(null, { roles: ['FARMER', 'FARMER_ADMIN'], hasLiveFarmer: true });
    const error = await caught(
      serviceWith(repo).create(superScope('admin.promotion.request'), {
        targetUserId: newId(),
        toRole: 'TOHFA_ADMIN',
        reason: 'Runs the zone well',
      }),
    );
    expect(error.code).toBe('CONFLICT');
    expect(error.meta).toMatchObject({ rule: 'BR-135' });
    expect(events.filter((e) => WRITES.test(e))).toEqual([]);
  });

  it('BR-135: create still accepts a request for a Farmer Admin who is not a farmer', async () => {
    const { repo, events } = fakeRepo(null, { roles: ['FARMER_ADMIN'], hasLiveFarmer: false });
    await serviceWith(repo).create(superScope('admin.promotion.request'), {
      targetUserId: newId(),
      toRole: 'TOHFA_ADMIN',
      reason: 'Runs the zone well',
    });
    expect(events).toContain('insert:FARMER_ADMIN->TOHFA_ADMIN');
  });
});
