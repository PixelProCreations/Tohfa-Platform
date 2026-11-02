/**
 * BR-18e: marking the fiscal cash tag is its own permission, `wallet.cash_topup.fiscal_tag`
 * (docs/rbac.json: "Mark the fiscal cash tag that triggers the server-side wallet credit"), and the
 * cash top-up route enforces it server-side in addition to `wallet.cash_topup.process`.
 *
 * WHY THIS FILE EXISTS: the route only checked `wallet.cash_topup.process`, so the fiscal-tag code
 * in rbac.json gated nothing. Today every role granted `process` is also granted `fiscal_tag`, so
 * with the real rbac.json no request changes outcome; the gap would open silently the day the two
 * grants diverge. To prove the gate, rbac.json is loaded for real and ONE grant is overridden in
 * memory (SUB_WH_ADMIN: fiscal_tag -> none), exactly the divergence the gate exists for.
 *
 * requireAuth is replaced by a stub that installs the actor (the JWT and the Redis revocation check
 * are not under test here), and the service is a spy, so nothing touches a database.
 */
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type * as RequireAuthModule from '../../auth/requireAuth.js';
import type * as LoadRbacModule from '../../rbac/loadRbac.js';

vi.mock('../../rbac/loadRbac.js', async (importOriginal) => {
  const actual = await importOriginal<typeof LoadRbacModule>();
  return {
    ...actual,
    loadRbac: (...args: Parameters<typeof actual.loadRbac>) => {
      const rbac = actual.loadRbac(...args);
      const permission = (code: string) => {
        const found = rbac.permission(code);
        return code === 'wallet.cash_topup.fiscal_tag'
          ? { ...found, grants: { ...found.grants, [RoleCode.SUB_WH_ADMIN]: ScopeLevel.NONE } }
          : found;
      };
      return { ...rbac, permission, grantFor: (code: string, role: RoleCode) => permission(code).grants[role] ?? ScopeLevel.NONE };
    },
  };
});

vi.mock('../../auth/requireAuth.js', async (importOriginal) => {
  const actual = await importOriginal<typeof RequireAuthModule>();
  return {
    ...actual,
    requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      req.actor = JSON.parse(req.header('x-test-actor') ?? 'null') as RequireAuthModule.Actor;
      next();
    },
  };
});

const processCashTopup = vi.fn();
vi.mock('./topup.service.js', () => ({
  topupService: { processCashTopup: (...args: unknown[]) => processCashTopup(...args) },
}));

const { adminTopupRouter } = await import('./topup.routes.js');
const { errorHandler } = await import('../../http/errorHandler.js');
const { loadRbac } = await import('../../rbac/loadRbac.js');

const WAREHOUSE = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';
const CUSTOMER = '9d0f2c1e-7a55-4b6e-8f10-2c3d4e5f6a7b';

function app() {
  const server = express();
  server.use(express.json());
  server.use('/v1/admin', adminTopupRouter);
  server.use(errorHandler);
  return server;
}

function post(actor: { userId: string; roles: Array<{ code: RoleCode; warehouseId?: string }> }) {
  return request(app())
    .post(`/v1/admin/wallets/${CUSTOMER}/cash-topup`)
    .set('x-test-actor', JSON.stringify({ farmerId: null, customerId: null, ...actor }))
    .set('Idempotency-Key', '5b0f5f1e-2c1e-4a8e-9d55-1f2e3d4c5b6a')
    .send({ amount: '500.00', warehouseId: WAREHOUSE, fiscalCashTag: 'OOTY-2026-10-26-0001' });
}

describe('BR-18e: the cash top-up route enforces wallet.cash_topup.fiscal_tag server-side', () => {
  beforeEach(() => {
    processCashTopup.mockReset();
    processCashTopup.mockResolvedValue({ id: 'txn-1' });
  });

  it('BR-18e: the override under test is real: SUB_WH_ADMIN still holds wallet.cash_topup.process but no longer holds wallet.cash_topup.fiscal_tag', () => {
    const rbac = loadRbac();
    expect(rbac.permission('wallet.cash_topup.process').grants[RoleCode.SUB_WH_ADMIN]).toBe(ScopeLevel.ALL);
    expect(rbac.permission('wallet.cash_topup.fiscal_tag').grants[RoleCode.SUB_WH_ADMIN]).toBe(ScopeLevel.NONE);
  });

  it('BR-18e: a role that may process a cash top-up but not mark the fiscal cash tag is 403 FORBIDDEN problem+json naming wallet.cash_topup.fiscal_tag, and the service is never called', async () => {
    const res = await post({ userId: '00000000-0000-4000-8000-000000000002', roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: WAREHOUSE }] });
    expect(res.status).toBe(403);
    expect(res.headers['content-type']).toContain('application/problem+json');
    expect(res.body.code).toBe('FORBIDDEN');
    expect(JSON.stringify(res.body)).toContain('wallet.cash_topup.fiscal_tag');
    expect(processCashTopup).not.toHaveBeenCalled();
  });

  it('BR-18e: a role holding both permissions reaches the service, which receives the scope of wallet.cash_topup.process', async () => {
    const res = await post({ userId: '00000000-0000-4000-8000-000000000003', roles: [{ code: RoleCode.MAIN_WH_ADMIN }] });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(processCashTopup).toHaveBeenCalledTimes(1);
    const scope = processCashTopup.mock.calls[0]![1] as { permission: string };
    expect(scope.permission).toBe('wallet.cash_topup.process');
  });
});
