import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { errorHandler, notFoundHandler } from '../../http/errorHandler.js';
import { signAccessToken } from '../../auth/jwt.js';
import { aScope, newId } from '../../test/factories.js';
import type { CustomerSupportRepo, MessageDbRow, TicketDbRow } from './customer-support.repo.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import { createTicketBody } from './customer-support.schema.js';
import { createCustomerSupportRouter } from './customer-support.routes.js';
import { createCustomerSupportService, type CustomerSupportService } from './customer-support.service.js';

const db = {} as Executor;
const CUSTOMER = newId();
const USER = newId();
const scope = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.CUSTOMER, permission: 'support.ticket.create_own', userId: USER, customerId: CUSTOMER });

const ticket = (over: Partial<TicketDbRow> = {}): TicketDbRow => ({
  id: newId(), ticket_number: 'TKT-2026-00001', order_id: null, category: 'QUALITY', subject: 's', description: 'd',
  photo_keys: null, status: 'OPEN', resolved_at: null, created_at: new Date(), updated_at: new Date(), message_count: 0, ...over,
});

function build(opts: { tickets?: TicketDbRow[]; messages?: MessageDbRow[]; uploads?: Array<{ id: string; storageKey: string; uploadedBy: string | null }>; terms?: string[] } = {}) {
  const tickets = opts.tickets ?? [];
  const inserted: unknown[] = [];
  const audits: unknown[][] = [];
  const txDb = { query: async (sql: string, params?: unknown[]) => { if (/audit_log/i.test(sql)) { audits.push(params ?? []); return { rows: [{ id: 'a' }], rowCount: 1 }; } return { rows: [], rowCount: 0 }; } } as unknown as Executor;
  const repo: CustomerSupportRepo = {
    async createTicket(_d, customerId, input) {
      expect(customerId).toBe(CUSTOMER);
      const t = ticket({ subject: input.subject, description: input.description, order_id: input.orderId, photo_keys: input.photoKeys });
      tickets.push(t);
      return t;
    },
    async listTickets(_d, cid) { expect(cid).toBe(CUSTOMER); return { rows: tickets, total: tickets.length }; },
    async findTicket(_d, cid, id) { return cid === CUSTOMER ? tickets.find((t) => t.id === id) ?? null : null; },
    async listMessages() { return opts.messages ?? []; },
    async insertMessage(_d, input) { inserted.push(input); return { id: newId(), ticket_id: input.ticketId, from_customer: true, body: input.body, attachment_key: input.attachmentKey, created_at: new Date() }; },
    async touchTicket() {},
    async cancelOpenTicket(_d, id) {
      const t = tickets.find((x) => x.id === id);
      if (t === undefined || t.status !== 'OPEN') return false;
      t.status = 'CANCELLED';
      return true;
    },
    async orderBelongsToCustomer(_d, _c, orderId) { return orderId === OWN_ORDER; },
    async findUploads() { return opts.uploads ?? []; },
  };
  const service = createCustomerSupportService({
    repo, db, transaction: (fn) => fn(txDb), publicUrl: (k) => `https://cdn/${k}`,
    identityLookup: async () => ({ terms: opts.terms ?? [], personNames: [] }),
    idempotency: createInMemoryIdempotencyStore(),
  });
  return { service, tickets, inserted, audits };
}
const OWN_ORDER = newId();

describe('customer support tickets: service', () => {
  it('creates an own ticket with an ISSUE_PHOTO upload and maps status', async () => {
    const up = { id: newId(), storageKey: 'issue_photo/a.jpg', uploadedBy: USER };
    const { service } = build({ uploads: [up] });
    const t = await service.createTicket(scope, { category: 'QUALITY', subject: 'Soft carrots', description: 'Bad', photoUploadIds: [up.id] });
    expect(t.photos).toEqual(['https://cdn/issue_photo/a.jpg']);
    expect(t.status).toBe('OPEN');
    expect(Object.keys(t)).not.toContain('priority');
  });

  it('BR-212: the same Idempotency-Key and body replays the same ticket; a different body is 409', async () => {
    const { service, tickets } = build();
    const body = { category: 'OTHER' as const, subject: 'Late', description: 'Where is it', photoUploadIds: [] };
    const first = await service.createTicket(scope, body, 'key-1');
    const replay = await service.createTicket(scope, body, 'key-1');
    expect(replay.id).toBe(first.id);
    expect(tickets).toHaveLength(1);
    await expect(service.createTicket(scope, { ...body, subject: 'Different' }, 'key-1')).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED', status: 409 });
    await service.createTicket(scope, body);
    await service.createTicket(scope, body);
    expect(tickets).toHaveLength(3);
  });

  it('maps INVESTIGATING to IN_PROGRESS', async () => {
    const t = ticket({ status: 'INVESTIGATING' });
    const { service } = build({ tickets: [t] });
    expect((await service.getTicket(scope, t.id)).status).toBe('IN_PROGRESS');
  });

  it('rejects a photo that is not the caller\'s own or has the wrong purpose (422)', async () => {
    const other = { id: newId(), storageKey: 'issue_photo/a.jpg', uploadedBy: newId() };
    await expect(build({ uploads: [other] }).service.createTicket(scope, { category: 'OTHER', subject: 's', description: 'd', photoUploadIds: [other.id] })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    const wrong = { id: newId(), storageKey: 'profile_photo/a.jpg', uploadedBy: USER };
    await expect(build({ uploads: [wrong] }).service.createTicket(scope, { category: 'OTHER', subject: 's', description: 'd', photoUploadIds: [wrong.id] })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('BR-97: refuses ticket text naming a farmer or farm (422)', async () => {
    const { service } = build({ terms: ['Green Valley Farm'] });
    await expect(service.createTicket(scope, { category: 'QUALITY', subject: 'Bad', description: 'From green valley farm', photoUploadIds: [] })).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
  });

  it('BR-97: refuses a message naming a farmer; redacts staff text read back', async () => {
    const t = ticket();
    const staff: MessageDbRow = { id: newId(), ticket_id: t.id, from_customer: false, body: 'Sent from Green Valley Farm', attachment_key: null, created_at: new Date() };
    const { service } = build({ tickets: [t], messages: [staff], terms: ['Green Valley Farm'] });
    await expect(service.addMessage(scope, t.id, { message: 'Green Valley Farm was late' })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    const d = await service.getTicket(scope, t.id);
    expect(d.messages[0]).toMatchObject({ sender: 'SUPPORT', redacted: true });
    expect(JSON.stringify(d)).not.toContain('Green Valley');
  });

  it('BR-36: another customer\'s ticket is 404, not 403', async () => {
    const t = ticket();
    const { service } = build({ tickets: [t] });
    const stranger = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.CUSTOMER, customerId: newId() });
    await expect(service.getTicket(stranger, t.id)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    await expect(service.addMessage(stranger, t.id, { message: 'hi' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('an order that is not the caller\'s is 404', async () => {
    await expect(build().service.createTicket(scope, { category: 'OTHER', subject: 's', description: 'd', orderId: newId(), photoUploadIds: [] })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('a CLOSED ticket takes no messages: 409', async () => {
    const t = ticket({ status: 'CLOSED' });
    await expect(build({ tickets: [t] }).service.addMessage(scope, t.id, { message: 'hi' })).rejects.toMatchObject({ code: 'CONFLICT', status: 409 });
  });

  it('BR-196: cancels an own OPEN ticket, writes an audit row, and a second cancel is 409', async () => {
    const t = ticket();
    const { service, audits } = build({ tickets: [t] });
    const out = await service.cancelTicket(scope, t.id);
    expect(out.status).toBe('CANCELLED');
    expect(audits).toHaveLength(1);
    expect(audits[0]).toContain('support.ticket.cancel');
    await expect(service.cancelTicket(scope, t.id)).rejects.toMatchObject({ code: 'CONFLICT', status: 409 });
  });

  it('BR-196: CLOSED, RESOLVED and IN_PROGRESS tickets cannot be cancelled (409); a stranger gets 404', async () => {
    for (const status of ['CLOSED', 'RESOLVED', 'INVESTIGATING']) {
      const t = ticket({ status });
      await expect(build({ tickets: [t] }).service.cancelTicket(scope, t.id)).rejects.toMatchObject({ status: 409 });
    }
    const t = ticket();
    const stranger = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.CUSTOMER, permission: 'support.ticket.create_own', userId: USER, customerId: newId() });
    await expect(build({ tickets: [t] }).service.cancelTicket(stranger, t.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('BR-197: a ticket linked to an order carries its orderNumber', async () => {
    const t = ticket({ order_number: 'TOH-2026-000039' });
    expect((await build({ tickets: [t] }).service.getTicket(scope, t.id)).orderNumber).toBe('TOH-2026-000039');
  });

  it('BR-199: up to five photos are accepted, six are refused', () => {
    const ids = Array.from({ length: 6 }, () => newId());
    expect(createTicketBody.safeParse({ subject: 's', description: 'd', photoUploadIds: ids.slice(0, 5) }).success).toBe(true);
    expect(createTicketBody.safeParse({ subject: 's', description: 'd', photoUploadIds: ids }).success).toBe(false);
  });

  it('adds a customer message to an open ticket', async () => {
    const t = ticket();
    const { service, inserted } = build({ tickets: [t] });
    const m = await service.addMessage(scope, t.id, { message: 'any update?' });
    expect(m.sender).toBe('CUSTOMER');
    expect(inserted).toHaveLength(1);
  });
});

describe('customer support tickets: routes (real middleware, stub service)', () => {
  const stub = new Proxy({} as CustomerSupportService, { get: () => async () => ({ ok: true }) });
  const app = express();
  app.use(express.json());
  app.use('/v1/support', createCustomerSupportRouter(stub));
  app.use(notFoundHandler);
  app.use(errorHandler);
  const tok = (code: RoleCode, extra: Record<string, string> = {}) =>
    `Bearer ${signAccessToken({ sub: newId(), roles: [{ code }], farmerId: null, customerId: null, ...extra } as never)}`;
  const customer = tok(RoleCode.CUSTOMER, { customerId: newId() });
  const admin = tok(RoleCode.SUPER_ADMIN);

  it('401 anonymous, 403 admin, 200/201 customer', async () => {
    const id = newId();
    expect((await request(app).get('/v1/support/tickets')).status).toBe(401);
    expect((await request(app).get('/v1/support/tickets').set('Authorization', admin)).status).toBe(403);
    expect((await request(app).get('/v1/support/tickets').set('Authorization', customer)).status).toBe(200);
    expect((await request(app).get(`/v1/support/tickets/${id}`).set('Authorization', customer)).status).toBe(200);
    expect((await request(app).post('/v1/support/tickets').set('Authorization', customer).send({ subject: 's', description: 'd' })).status).toBe(201);
    expect((await request(app).post(`/v1/support/tickets/${id}/cancel`).set('Authorization', customer)).status).toBe(200);
    expect((await request(app).post(`/v1/support/tickets/${id}/messages`).set('Authorization', customer).send({ message: 'm' })).status).toBe(201);
  });

  it('422 on a priority field or blank subject', async () => {
    expect((await request(app).post('/v1/support/tickets').set('Authorization', customer).send({ subject: 's', description: 'd', priority: 'URGENT' })).status).toBe(422);
    expect((await request(app).post('/v1/support/tickets').set('Authorization', customer).send({ subject: ' ', description: 'd' })).status).toBe(422);
  });
});
