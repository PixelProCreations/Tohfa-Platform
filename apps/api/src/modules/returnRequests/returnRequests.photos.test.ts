/**
 * BR-204: a customer return carries up to five photos: the caller's own ISSUE_PHOTO uploads (the
 * support-ticket photo flow), stored as storage keys and only ever returned as signed read URLs,
 * on the customer reads (POST response, GET /returns/me, /returns/me/{id}) and the staff detail.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../audit/auditLog.js', () => ({ writeAuditLog: async () => undefined }));

import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { aScope, newId } from '../../test/factories.js';
import type { ReturnRequestsRepo } from './returnRequests.repo.js';
import { createReturnRequestsService, CUSTOMER_FILE_PERMISSION } from './returnRequests.service.js';
import type { ReturnRequestResponse } from './returnRequests.schema.js';
import { createReturnRequestBody } from './returnRequests.schema.js';

const USER = newId();
const CUSTOMER = newId();
const ORDER = newId();
const ITEM = newId();
const WH = newId();
const db = {} as Executor;

function harness(uploads: Array<{ id: string; storageKey: string; uploadedBy: string | null }>) {
  let stored: string[] = [];
  const row = (): ReturnRequestResponse => ({
    id: 'r1', orderId: ORDER, customerId: CUSTOMER, warehouseId: WH, status: 'PENDING', reason: 'bad',
    note: null, photos: stored, items: [], createdAt: new Date().toISOString(), updatedAt: null,
  });
  const repo = {
    async findOrderForReturn() { return { id: ORDER, customerId: CUSTOMER, warehouseId: WH, status: 'DELIVERED' }; },
    async findOrderItemsByIds() { return [{ id: ITEM, qtyKg: '2.000', unitPrice: '10.00', status: 'DELIVERED' }]; },
    async sumAlreadyReturnedQty() { return {}; },
    async insertReturnRequest(_db: Executor, input: { photoKeys?: string[] }) {
      stored = input.photoKeys ?? [];
      return { id: 'r1', orderId: ORDER, customerId: CUSTOMER, status: 'PENDING', reason: 'bad', note: null, photoKeys: stored, createdAt: new Date(), updatedAt: null };
    },
    async insertReturnRequestItems() { return []; },
    async insertStatusHistory() { return undefined; },
    async findByIdForCustomer() { return row(); },
    async findById() { return row(); },
    async listForCustomer() { return { items: [row()], nextCursor: null, hasMore: false }; },
  } as unknown as ReturnRequestsRepo;
  const svc = createReturnRequestsService({
    repo,
    db,
    runTx: (fn) => fn(db),
    findUploads: async (_db, ids) => uploads.filter((u) => ids.includes(u.id)),
    photoUrl: async (key) => `https://signed.example/${key}?sig=1`,
  });
  return { svc, stored: () => stored };
}

const actor = { userId: USER, roles: [{ code: 'CUSTOMER' as const }], farmerId: null, customerId: CUSTOMER };
const customerScope = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.CUSTOMER, permission: CUSTOMER_FILE_PERMISSION, customerId: CUSTOMER, userId: USER });
const staffScope = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN, permission: 'rma.request.process' });

describe('BR-204: return photos', () => {
  it('BR-204a: own ISSUE_PHOTO uploads are stored as keys and returned as signed URLs everywhere', async () => {
    const id = newId();
    const { svc, stored } = harness([{ id, storageKey: 'issue_photo/abc.jpg', uploadedBy: USER }]);
    const created = await svc.createReturnRequest(actor, customerScope, ORDER, {
      reason: 'bad', items: [{ orderItemId: ITEM, qty: '1.000' }], photoUploadIds: [id],
    });
    expect(stored()).toEqual(['issue_photo/abc.jpg']);
    expect(created.photos).toEqual(['https://signed.example/issue_photo/abc.jpg?sig=1']);

    const mine = await svc.getOwn(customerScope, 'r1');
    expect(mine.photos).toEqual(['https://signed.example/issue_photo/abc.jpg?sig=1']);
    const list = await svc.listOwn(customerScope, { limit: 20 });
    expect(list.items[0]!.photos).toEqual(['https://signed.example/issue_photo/abc.jpg?sig=1']);
    const staff = await svc.getById(staffScope, 'r1');
    expect(staff.photos).toEqual(['https://signed.example/issue_photo/abc.jpg?sig=1']);
  });

  it("BR-204b: another user's upload, or an upload of another purpose, is 422 and nothing is stored", async () => {
    const other = newId();
    const wrong = newId();
    const { svc, stored } = harness([
      { id: other, storageKey: 'issue_photo/x.jpg', uploadedBy: newId() },
      { id: wrong, storageKey: 'listing_photo/y.jpg', uploadedBy: USER },
    ]);
    const body = (ids: string[]) => ({ reason: 'bad', items: [{ orderItemId: ITEM, qty: '1.000' }], photoUploadIds: ids });
    await expect(svc.createReturnRequest(actor, customerScope, ORDER, body([other]))).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    await expect(svc.createReturnRequest(actor, customerScope, ORDER, body([wrong]))).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    await expect(svc.createReturnRequest(actor, customerScope, ORDER, body([newId()]))).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(stored()).toEqual([]);
  });

  it('BR-204c: at most five photos; none is fine (defaults to [])', () => {
    const ids = Array.from({ length: 6 }, newId);
    expect(createReturnRequestBody.safeParse({ reason: 'r', items: [{ orderItemId: ITEM, qty: '1.000' }], photoUploadIds: ids }).success).toBe(false);
    const ok = createReturnRequestBody.parse({ reason: 'r', items: [{ orderItemId: ITEM, qty: '1.000' }] });
    expect(ok.photoUploadIds).toEqual([]);
  });
});
