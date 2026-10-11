/**
 * BR-97d double gate (owner decision 2026-10-11: keep both codes). The reply route checks
 * `customer.support_history.view` FIRST (its scope decides customer visibility, BR-91) and then
 * `support.ticket.respond` (authorises the write). Every admin role holds both codes, so a token
 * matrix cannot tell "both" from "only one"; this file wraps requirePermission to record which
 * codes each request passed through, in order. Kept in its own file because vi.mock is
 * module-wide.
 */
import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { RoleCode } from '@tohfa/shared-types';
import { IDS, newId } from '../../test/factories.js';
import type * as RequirePermissionNs from '../../rbac/requirePermission.js';
import type { CustomersService } from './customers.service.js';

type RequirePermissionModule = typeof RequirePermissionNs;

const checked: string[] = [];

vi.mock('../../rbac/requirePermission.js', async (importOriginal) => {
  const actual = await importOriginal<RequirePermissionModule>();
  return {
    ...actual,
    requirePermission: (code: string) => {
      const real = actual.requirePermission(code);
      const recorder: typeof real = (req, res, next) => {
        checked.push(code);
        return real(req, res, next);
      };
      return recorder;
    },
  };
});

describe('customers routes: BR-97d double gate on the reply', async () => {
  const { createCustomersRouter } = await import('./customers.routes.js');
  const { signAccessToken } = await import('../../auth/jwt.js');
  const { errorHandler, notFoundHandler } = await import('../../http/errorHandler.js');
  const stub = new Proxy({} as CustomersService, { get: () => async () => ({ ok: true }) });
  const app = express();
  app.use(express.json());
  app.use('/v1/admin/customers', createCustomersRouter(stub));
  app.use(notFoundHandler);
  app.use(errorHandler);
  const ticketId = newId();
  const replyPath = `/v1/admin/customers/${IDS.customer}/support-tickets/${ticketId}/replies`;

  it('BR-97d: the reply passes customer.support_history.view and then support.ticket.respond, in that order, and nothing else', async () => {
    const token = signAccessToken({ sub: newId(), roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: IDS.warehouseOoty }], farmerId: null, customerId: null });
    checked.length = 0;
    const res = await request(app).post(replyPath).set('Authorization', `Bearer ${token}`).send({ message: 'hi' });
    expect(res.status).toBe(201);
    expect(checked).toEqual(['customer.support_history.view', 'support.ticket.respond']);
  });

  it('BR-97d: the reads of the same thread pass customer.support_history.view only', async () => {
    const token = signAccessToken({ sub: newId(), roles: [{ code: RoleCode.SUPER_ADMIN }], farmerId: null, customerId: null });
    checked.length = 0;
    expect((await request(app).get(`/v1/admin/customers/${IDS.customer}/support-tickets/${ticketId}`).set('Authorization', `Bearer ${token}`)).status).toBe(200);
    expect(checked).toEqual(['customer.support_history.view']);
  });
});
