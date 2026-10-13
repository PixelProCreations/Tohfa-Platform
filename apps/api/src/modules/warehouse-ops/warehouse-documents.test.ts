/**
 * BR-105: warehouse documents.
 *
 *  a  body and query validation: fixed doc types, lengths, real dates, expiry not before issue, strict
 *     bodies, at least one field on PATCH
 *  b  the derived status (no expiry, far, the warning boundary day, yesterday, today, archived) and the
 *     window from system_config with the documented fallback
 *  c  the upload rule: another user's, a deleted and an unknown upload are 422; a reused upload is 409
 *  d  scope: a Sub admin reads its own warehouse, the same 404 for another and an unknown warehouse
 *     and for a document under the wrong warehouse; a Sub admin is 403 on every write
 *  e  edit changes only the given fields; an archived document is 409 on edit; archive is once
 *  f  the list filters by type and derived status and excludes archived rows by default
 *  g  one masked audit row per change in the same transaction; a no-op writes nothing
 *
 * Layers: schema and pure-function tests (no I/O), service tests against a hand-written fake repo
 * (these always run), service tests against real Postgres in a rolled-back transaction, and
 * real-HTTP tests through the real app router (both gated on DATABASE_URL).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { InMemoryBlobStorage } from '../../storage/blobStorage.js';
import { aScope, describeIfDatabase, newId } from '../../test/factories.js';
import { requireDatabaseTables } from '../../test/dbFixtures.js';
import {
  addDays,
  createWarehouseDocumentBody,
  deriveDocumentStatus,
  istDate,
  listWarehouseDocumentsQuery,
  updateWarehouseDocumentBody,
} from './warehouse-documents.schema.js';
import {
  DEFAULT_DOCUMENT_EXPIRY_WARNING_DAYS,
  createWarehouseDocumentsService,
} from './warehouse-documents.service.js';
import {
  warehouseDocumentsRepo,
  type DocumentPatch,
  type InsertDocumentValues,
  type ListDocumentsFilter,
  type WarehouseDocumentRecord,
  type WarehouseDocumentsRepo,
} from './warehouse-documents.repo.js';
import { inRolledBackTx, loadWarehouseIds, startHttpHarness, type HttpHarness, type WarehouseIds } from './testkit.js';

const UPLOAD = '11111111-1111-4111-8111-111111111111';
const goodBody = { docType: 'FSSAI', title: 'FSSAI licence 2026', documentNumber: 'FS-123', issueDate: '2026-01-01', expiryDate: '2027-01-01', uploadId: UPLOAD };

const caught = async (promise: Promise<unknown>): Promise<AppError> => {
  const error = await promise.then(() => null, (e: unknown) => e);
  expect(error).toBeInstanceOf(AppError);
  return error as AppError;
};

// ===========================================================================
// 1. Schemas and the pure status derivation
// ===========================================================================
describe('warehouse document schemas', () => {
  it('BR-105a: the create body needs a fixed docType, a 1-160 title and an uploadId, trims, and is strict', () => {
    expect(createWarehouseDocumentBody.parse({ docType: 'LEASE', title: '  Lease  ', uploadId: UPLOAD })).toEqual({ docType: 'LEASE', title: 'Lease', uploadId: UPLOAD });
    expect(createWarehouseDocumentBody.safeParse(goodBody).success).toBe(true);
    expect(createWarehouseDocumentBody.safeParse({ ...goodBody, title: 't'.repeat(160), documentNumber: 'n'.repeat(80) }).success).toBe(true);
    for (const bad of [
      {},
      { ...goodBody, docType: 'PERMIT' },
      { ...goodBody, docType: 'fssai' },
      { ...goodBody, title: '' },
      { ...goodBody, title: '   ' },
      { ...goodBody, title: 't'.repeat(161) },
      { ...goodBody, documentNumber: '' },
      { ...goodBody, documentNumber: 'n'.repeat(81) },
      { ...goodBody, uploadId: 'not-a-uuid' },
      { docType: 'LEASE', title: 'x' },
      { ...goodBody, warehouseId: newId() },
      { ...goodBody, status: 'ACTIVE' },
    ]) {
      expect(createWarehouseDocumentBody.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });

  it('BR-105a: dates must be real YYYY-MM-DD days and the expiry may not precede the issue (same day allowed)', () => {
    for (const date of ['2026-02-30', '2026-13-01', '2026-1-1', '01-01-2026', '2026-01-01T00:00:00Z', '']) {
      expect(createWarehouseDocumentBody.safeParse({ ...goodBody, issueDate: date, expiryDate: null }).success, date).toBe(false);
      expect(createWarehouseDocumentBody.safeParse({ ...goodBody, issueDate: null, expiryDate: date }).success, date).toBe(false);
    }
    expect(createWarehouseDocumentBody.safeParse({ ...goodBody, issueDate: '2028-02-29', expiryDate: null }).success).toBe(true);
    const before = createWarehouseDocumentBody.safeParse({ ...goodBody, issueDate: '2026-05-02', expiryDate: '2026-05-01' });
    expect(before.success).toBe(false);
    expect(before.error?.issues[0]?.path).toEqual(['expiryDate']);
    expect(createWarehouseDocumentBody.safeParse({ ...goodBody, issueDate: '2026-05-01', expiryDate: '2026-05-01' }).success).toBe(true);
    expect(createWarehouseDocumentBody.safeParse({ ...goodBody, issueDate: undefined, expiryDate: '2020-01-01' }).success).toBe(true);
  });

  it('BR-105a: the update body needs at least one field, is strict, allows null to clear the optional fields, never the title or type', () => {
    expect(updateWarehouseDocumentBody.safeParse({}).success).toBe(false);
    expect(updateWarehouseDocumentBody.safeParse({ warehouseId: newId() }).success).toBe(false);
    expect(updateWarehouseDocumentBody.safeParse({ archivedAt: null }).success).toBe(false);
    expect(updateWarehouseDocumentBody.safeParse({ title: null }).success).toBe(false);
    expect(updateWarehouseDocumentBody.safeParse({ docType: null }).success).toBe(false);
    expect(updateWarehouseDocumentBody.safeParse({ uploadId: null }).success).toBe(false);
    expect(updateWarehouseDocumentBody.safeParse({ documentNumber: null, issueDate: null, expiryDate: null }).success).toBe(true);
    expect(updateWarehouseDocumentBody.safeParse({ issueDate: '2026-05-02', expiryDate: '2026-05-01' }).success).toBe(false);
    expect(updateWarehouseDocumentBody.safeParse({ expiryDate: '2026-02-29' }).success).toBe(false);
    expect(updateWarehouseDocumentBody.safeParse({ uploadId: UPLOAD }).success).toBe(true);
  });

  it('BR-105a: the list query is strict, pages at most 100, filters by type and derived status', () => {
    expect(listWarehouseDocumentsQuery.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(listWarehouseDocumentsQuery.parse({ docType: 'LEASE', status: 'EXPIRING_SOON', q: ' lease ' })).toMatchObject({ docType: 'LEASE', status: 'EXPIRING_SOON', q: 'lease' });
    expect(listWarehouseDocumentsQuery.safeParse({ pageSize: '101' }).success).toBe(false);
    expect(listWarehouseDocumentsQuery.safeParse({ status: 'VALID' }).success).toBe(false);
    expect(listWarehouseDocumentsQuery.safeParse({ docType: 'PERMIT' }).success).toBe(false);
    expect(listWarehouseDocumentsQuery.safeParse({ warehouseId: newId() }).success).toBe(false);
  });
});

describe('warehouse document derived status', () => {
  const today = '2026-10-13';
  const live = (expiryDate: string | null) => ({ archivedAt: null, expiryDate });

  it('BR-105b: no expiry is ACTIVE; a far expiry is ACTIVE', () => {
    expect(deriveDocumentStatus(live(null), today, 30)).toBe('ACTIVE');
    expect(deriveDocumentStatus(live('2027-10-13'), today, 30)).toBe('ACTIVE');
    expect(deriveDocumentStatus(live(addDays(today, 31)), today, 30)).toBe('ACTIVE');
  });

  it('BR-105b: the warning boundary day is EXPIRING_SOON (inclusive), so is today; yesterday is EXPIRED', () => {
    expect(deriveDocumentStatus(live(addDays(today, 30)), today, 30)).toBe('EXPIRING_SOON');
    expect(deriveDocumentStatus(live(addDays(today, 1)), today, 30)).toBe('EXPIRING_SOON');
    expect(deriveDocumentStatus(live(today), today, 30)).toBe('EXPIRING_SOON');
    expect(deriveDocumentStatus(live(addDays(today, -1)), today, 30)).toBe('EXPIRED');
    expect(deriveDocumentStatus(live('2020-01-01'), today, 30)).toBe('EXPIRED');
  });

  it('BR-105b: an archived document is ARCHIVED whatever its expiry', () => {
    for (const expiryDate of [null, '2020-01-01', today, '2030-01-01']) {
      expect(deriveDocumentStatus({ archivedAt: '2026-10-01T00:00:00.000Z', expiryDate }, today, 30)).toBe('ARCHIVED');
    }
  });

  it('BR-105b: a custom window moves the boundary; a zero window warns only on the day itself', () => {
    expect(deriveDocumentStatus(live(addDays(today, 7)), today, 7)).toBe('EXPIRING_SOON');
    expect(deriveDocumentStatus(live(addDays(today, 8)), today, 7)).toBe('ACTIVE');
    expect(deriveDocumentStatus(live(today), today, 0)).toBe('EXPIRING_SOON');
    expect(deriveDocumentStatus(live(addDays(today, 1)), today, 0)).toBe('ACTIVE');
  });

  it('BR-105b: "today" is the Asia/Kolkata calendar day, across month and year ends', () => {
    expect(istDate(new Date('2026-10-12T18:29:59Z'))).toBe('2026-10-12');
    expect(istDate(new Date('2026-10-12T18:30:00Z'))).toBe('2026-10-13');
    expect(istDate(new Date('2026-12-31T19:00:00Z'))).toBe('2027-01-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });
});

// ===========================================================================
// 2. Service against a fake repo (no database)
// ===========================================================================
interface FakeUpload {
  owner: string | null;
  deleted: boolean;
  storageKey: string;
  mimeType: string;
}

interface AuditCall {
  actorId: string;
  actionCode: string;
  entityType: string;
  entityId: string;
  warehouseId: string;
  before: unknown;
  after: unknown;
  changedFields: string[] | null;
}

function fakeWorld() {
  const warehouses = new Set<string>();
  const docs = new Map<string, WarehouseDocumentRecord>();
  const uploads = new Map<string, FakeUpload>();
  const audits: AuditCall[] = [];
  const listCalls: Array<{ warehouseId: string; filter: ListDocumentsFilter }> = [];
  const writes: string[] = [];
  let windowDays: number | null = 30;
  let clock = 0;
  const stamp = (): string => new Date(Date.UTC(2026, 9, 1) + ++clock * 1000).toISOString();

  const db: Executor = {
    async query(sql: string, params: unknown[] = []) {
      if (sql.includes('FROM warehouses')) {
        const present = warehouses.has(String(params[0]));
        return { rows: present ? [{ '?column?': 1 }] : [], rowCount: present ? 1 : 0 } as never;
      }
      if (sql.includes('INSERT INTO audit_log')) {
        audits.push({
          actorId: params[0] as string,
          actionCode: params[3] as string,
          entityType: params[4] as string,
          entityId: params[5] as string,
          warehouseId: params[6] as string,
          before: params[8] === null ? null : JSON.parse(params[8] as string),
          after: params[9] === null ? null : JSON.parse(params[9] as string),
          changedFields: (params[10] as string[] | null) ?? null,
        });
        return { rows: [{ id: newId() }], rowCount: 1 } as never;
      }
      throw new Error(`fake db: unexpected query ${sql}`);
    },
  };

  const uniqueViolation = (): Error =>
    Object.assign(new Error('duplicate key value violates unique constraint'), { code: '23505', constraint: 'uq_warehouse_documents_upload' });
  const assertUploadFree = (uploadId: string, exceptId: string | null): void => {
    for (const doc of docs.values()) {
      if (doc.uploadId === uploadId && doc.archivedAt === null && doc.id !== exceptId) throw uniqueViolation();
    }
  };

  const repo: WarehouseDocumentsRepo = {
    async readExpiryWarningDays() {
      return windowDays;
    },
    async list(_db, warehouseId, filter) {
      listCalls.push({ warehouseId, filter });
      const items = [...docs.values()].filter((doc) => doc.warehouseId === warehouseId);
      return { items, total: items.length };
    },
    async findById(_db, warehouseId, id) {
      const doc = docs.get(id);
      return doc !== undefined && doc.warehouseId === warehouseId ? { ...doc } : null;
    },
    async lockById(_db, warehouseId, id) {
      const doc = docs.get(id);
      return doc !== undefined && doc.warehouseId === warehouseId ? { ...doc } : null;
    },
    async findUploadOwner(_db, uploadId) {
      const upload = uploads.get(uploadId);
      if (upload === undefined || upload.deleted) return undefined;
      return upload.owner;
    },
    async findLiveFile(_db, uploadId) {
      const upload = uploads.get(uploadId);
      return upload === undefined || upload.deleted ? null : { storageKey: upload.storageKey, mimeType: upload.mimeType };
    },
    async insert(_db, values: InsertDocumentValues) {
      writes.push('insert');
      assertUploadFree(values.uploadId, null);
      const doc: WarehouseDocumentRecord = {
        id: newId(),
        ...values,
        archivedAt: null,
        archivedBy: null,
        createdAt: stamp(),
        updatedAt: null,
      };
      docs.set(doc.id, doc);
      return { ...doc };
    },
    async update(_db, id, patch: DocumentPatch) {
      writes.push('update');
      const current = docs.get(id)!;
      if (patch.uploadId !== undefined) assertUploadFree(patch.uploadId, id);
      const next: WarehouseDocumentRecord = { ...current, updatedAt: stamp() };
      for (const [key, value] of Object.entries(patch)) {
        if (value !== undefined) (next as unknown as Record<string, unknown>)[key] = value;
      }
      docs.set(id, next);
      return { ...next };
    },
    async archive(_db, id, userId) {
      writes.push('archive');
      const current = docs.get(id)!;
      const next = { ...current, archivedAt: stamp(), archivedBy: userId, updatedAt: stamp() };
      docs.set(id, next);
      return { ...next };
    },
  };

  const logs: string[] = [];
  const storage = new InMemoryBlobStorage('http://files.test');
  // 2026-10-12 20:00 UTC is already 2026-10-13 in Asia/Kolkata.
  const now = (): Date => new Date('2026-10-12T20:00:00Z');
  const service = createWarehouseDocumentsService({
    repo,
    db,
    runTx: async (fn) => fn(db),
    storage,
    now,
    log: (message) => logs.push(message),
  });
  return {
    service,
    warehouses,
    docs,
    uploads,
    audits,
    listCalls,
    writes,
    logs,
    setWindow: (value: number | null) => {
      windowDays = value;
    },
  };
}

describe('warehouse documents service (fake repo)', () => {
  const OOTY = '10000000-0000-4000-8000-000000000001';
  const COON = '10000000-0000-4000-8000-000000000002';
  const ADMIN = '00000000-0000-4000-8000-0000000000a1';
  const OTHER_USER = '00000000-0000-4000-8000-0000000000b2';
  const manage = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'warehouse.document.manage', userId: ADMIN });
  const subOoty = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [OOTY], permission: 'warehouse.document.view', userId: OTHER_USER });

  function setup() {
    const world = fakeWorld();
    world.warehouses.add(OOTY);
    world.warehouses.add(COON);
    const upload = (owner: string | null = ADMIN, deleted = false): string => {
      const id = newId();
      world.uploads.set(id, { owner, deleted, storageKey: `warehouse_documents/${id}.pdf`, mimeType: 'application/pdf' });
      return id;
    };
    return { ...world, upload };
  }

  it('BR-105c: creating needs an upload the caller uploaded; unknown, deleted and foreign uploads are the same 422 on body.uploadId', async () => {
    const w = setup();
    const created = await w.service.create(manage, OOTY, { ...goodBody, uploadId: w.upload() } as never);
    expect(created).toMatchObject({ warehouseId: OOTY, docType: 'FSSAI', title: 'FSSAI licence 2026', uploadedBy: ADMIN, status: 'ACTIVE', archivedAt: null });

    const messages = new Set<string>();
    for (const uploadId of [newId(), w.upload(ADMIN, true), w.upload(OTHER_USER), w.upload(null)]) {
      const error = await caught(w.service.create(manage, OOTY, { ...goodBody, uploadId } as never));
      expect(error.status).toBe(422);
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(Object.keys(error.errors ?? {})).toEqual(['body.uploadId']);
      messages.add(JSON.stringify(error.errors) + error.message);
    }
    expect(messages.size, 'unknown, deleted and foreign uploads must be indistinguishable').toBe(1);
    expect(w.audits).toHaveLength(1);
  });

  it('BR-105c: an upload already backing a live document is 409 CONFLICT, on create and on a file replacement', async () => {
    const w = setup();
    const shared = w.upload();
    const first = await w.service.create(manage, OOTY, { ...goodBody, uploadId: shared } as never);
    const dup = await caught(w.service.create(manage, COON, { ...goodBody, uploadId: shared } as never));
    expect(dup.status).toBe(409);
    expect(dup.code).toBe('CONFLICT');

    const second = await w.service.create(manage, OOTY, { ...goodBody, uploadId: w.upload() } as never);
    const replace = await caught(w.service.update(manage, OOTY, second.id, { uploadId: shared }));
    expect(replace.code).toBe('CONFLICT');

    // Once the first is archived its file is free again (the unique index is on live rows only).
    await w.service.archive(manage, OOTY, first.id);
    expect((await w.service.update(manage, OOTY, second.id, { uploadId: shared })).uploadId).toBe(shared);
    expect(w.audits.map((a) => a.actionCode)).toEqual([
      'warehouse.document.create',
      'warehouse.document.create',
      'warehouse.document.archive',
      'warehouse.document.update',
    ]);
  });

  it('BR-105d: another and an unknown warehouse, and a document under the wrong warehouse, are the same 404; nothing is written', async () => {
    const w = setup();
    const mine = await w.service.create(manage, OOTY, { ...goodBody, uploadId: w.upload() } as never);
    const theirs = await w.service.create(manage, COON, { ...goodBody, uploadId: w.upload() } as never);
    expect((await w.service.list(subOoty, OOTY, { page: 1, pageSize: 20 })).items.map((d) => d.id)).toEqual([mine.id]);
    expect((await w.service.get(subOoty, OOTY, mine.id)).id).toBe(mine.id);

    const messages = new Set<string>();
    for (const call of [
      () => w.service.list(subOoty, COON, { page: 1, pageSize: 20 }),
      () => w.service.list(subOoty, newId(), { page: 1, pageSize: 20 }),
      () => w.service.get(subOoty, COON, theirs.id),
      () => w.service.get(subOoty, newId(), theirs.id),
    ]) {
      const error = await caught(call());
      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      messages.add(error.message.replace(/[0-9a-f-]{36}/g, '<id>'));
    }
    expect(messages.size).toBe(1);

    const auditsBefore = w.audits.length;
    for (const call of [
      () => w.service.get(manage, OOTY, theirs.id),
      () => w.service.update(manage, OOTY, theirs.id, { title: 'x' }),
      () => w.service.archive(manage, OOTY, theirs.id),
      () => w.service.create(manage, newId(), { ...goodBody, uploadId: w.upload() } as never),
    ]) {
      expect((await caught(call())).status).toBe(404);
    }
    // A Sub scope widened to `all` stays confined to its assigned warehouse even for a write.
    const subWide = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [OOTY], permission: 'warehouse.document.manage', userId: ADMIN });
    expect((await caught(w.service.archive(subWide, COON, theirs.id))).status).toBe(404);
    expect(w.audits.length).toBe(auditsBefore);
    expect(w.docs.get(theirs.id)?.archivedAt).toBeNull();
  });

  it('BR-105c: GET one returns a short-lived signed fileUrl and the MIME type; the list carries no fileUrl', async () => {
    const w = setup();
    const uploadId = w.upload();
    const created = await w.service.create(manage, OOTY, { ...goodBody, uploadId } as never);
    expect(created).not.toHaveProperty('fileUrl');
    const one = await w.service.get(subOoty, OOTY, created.id);
    expect(one.mimeType).toBe('application/pdf');
    expect(one.fileUrl).toContain(`warehouse_documents/${uploadId}.pdf`);
    expect(one.fileUrl).toContain('expires=');
    const list = await w.service.list(subOoty, OOTY, { page: 1, pageSize: 20 });
    expect(list.items[0]).not.toHaveProperty('fileUrl');
    expect(list.items[0]).not.toHaveProperty('mimeType');

    // A file whose uploads row was deleted later is not signed.
    w.uploads.get(uploadId)!.deleted = true;
    expect(await w.service.get(subOoty, OOTY, created.id)).toMatchObject({ fileUrl: null, mimeType: null });
  });

  it('BR-105f: the list passes the IST day and the configured window to SQL, and reports the window', async () => {
    const w = setup();
    w.setWindow(7);
    const page = await w.service.list(manage, OOTY, { page: 2, pageSize: 5, status: 'EXPIRING_SOON', docType: 'LEASE', q: '50%_off' });
    expect(page).toMatchObject({ page: 2, pageSize: 5, total: 0, items: [], expiryWarningDays: 7 });
    expect(w.listCalls).toEqual([
      { warehouseId: OOTY, filter: { page: 2, pageSize: 5, status: 'EXPIRING_SOON', docType: 'LEASE', q: '50%_off', today: '2026-10-13', windowDays: 7 } },
    ]);
  });

  it('BR-105b: the window falls back to 30 (logged) when system_config is missing or unusable, and statuses use it', async () => {
    const w = setup();
    expect(DEFAULT_DOCUMENT_EXPIRY_WARNING_DAYS).toBe(30);
    w.setWindow(null);
    const created = await w.service.create(manage, OOTY, { ...goodBody, issueDate: null, expiryDate: addDays('2026-10-13', 30), uploadId: w.upload() } as never);
    expect(created.status).toBe('EXPIRING_SOON');
    const list = await w.service.list(manage, OOTY, { page: 1, pageSize: 20 });
    expect(list.expiryWarningDays).toBe(30);
    expect(w.logs.length).toBeGreaterThan(0);
    expect(w.logs[0]).toContain('warehouse_document_expiry_warning_days');

    w.setWindow(10);
    expect((await w.service.get(manage, OOTY, created.id)).status).toBe('ACTIVE');
    w.setWindow(0);
    const today = await w.service.create(manage, OOTY, { ...goodBody, issueDate: null, expiryDate: '2026-10-13', uploadId: w.upload() } as never);
    expect(today.status).toBe('EXPIRING_SOON');
    const yesterday = await w.service.create(manage, OOTY, { ...goodBody, issueDate: null, expiryDate: '2026-10-12', uploadId: w.upload() } as never);
    expect(yesterday.status).toBe('EXPIRED');
  });

  it('BR-105e: PATCH changes only the given fields, can clear the optional ones, and re-checks the merged dates', async () => {
    const w = setup();
    const created = await w.service.create(manage, OOTY, { ...goodBody, uploadId: w.upload() } as never);
    const renamed = await w.service.update(manage, OOTY, created.id, { title: 'Renewed FSSAI' });
    expect(renamed).toMatchObject({ title: 'Renewed FSSAI', docType: 'FSSAI', documentNumber: 'FS-123', issueDate: '2026-01-01', expiryDate: '2027-01-01', uploadId: created.uploadId });
    expect(renamed.updatedAt).not.toBeNull();

    const cleared = await w.service.update(manage, OOTY, created.id, { documentNumber: null, expiryDate: null });
    expect(cleared).toMatchObject({ documentNumber: null, expiryDate: null, issueDate: '2026-01-01', title: 'Renewed FSSAI' });

    // The stored issue date is 2026-01-01: an expiry before it is 422 even though the body alone is valid.
    const merged = await caught(w.service.update(manage, OOTY, created.id, { expiryDate: '2025-12-31' }));
    expect(merged.status).toBe(422);
    expect(merged.code).toBe('VALIDATION_FAILED');
    expect(Object.keys(merged.errors ?? {})).toEqual(['body.expiryDate']);
    await w.service.update(manage, OOTY, created.id, { expiryDate: '2026-06-01' });
    const mergedIssue = await caught(w.service.update(manage, OOTY, created.id, { issueDate: '2026-07-01' }));
    expect(mergedIssue.status).toBe(422);
    expect(Object.keys(mergedIssue.errors ?? {})).toEqual(['body.expiryDate']);
    expect(w.docs.get(created.id)).toMatchObject({ issueDate: '2026-01-01', expiryDate: '2026-06-01' });
  });

  it('BR-105e: replacing the file applies the upload rule and makes the caller the uploader', async () => {
    const w = setup();
    const created = await w.service.create(manage, OOTY, { ...goodBody, uploadId: w.upload() } as never);
    const foreign = await caught(w.service.update(manage, OOTY, created.id, { uploadId: w.upload(OTHER_USER) }));
    expect(foreign.status).toBe(422);
    expect(Object.keys(foreign.errors ?? {})).toEqual(['body.uploadId']);

    const otherAdmin = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.TOHFA_ADMIN, permission: 'warehouse.document.manage', userId: OTHER_USER });
    const renewal = w.upload(OTHER_USER);
    const replaced = await w.service.update(otherAdmin, OOTY, created.id, { uploadId: renewal });
    expect(replaced).toMatchObject({ uploadId: renewal, uploadedBy: OTHER_USER });
  });

  it('BR-105e: an archived document is 409 on edit; archive is once and a repeat is a no-op that writes nothing', async () => {
    const w = setup();
    const created = await w.service.create(manage, OOTY, { ...goodBody, uploadId: w.upload() } as never);
    const archived = await w.service.archive(manage, OOTY, created.id);
    expect(archived).toMatchObject({ status: 'ARCHIVED', archivedBy: ADMIN });
    expect(archived.archivedAt).not.toBeNull();

    const writes = w.writes.length;
    const audits = w.audits.length;
    const again = await w.service.archive(manage, OOTY, created.id);
    expect(again).toEqual(archived);
    expect(w.writes.length).toBe(writes);
    expect(w.audits.length).toBe(audits);

    for (const patch of [{ title: 'x' }, { title: created.title }, { expiryDate: null }]) {
      const error = await caught(w.service.update(manage, OOTY, created.id, patch));
      expect(error.status).toBe(409);
      expect(error.code).toBe('INVALID_STATE_TRANSITION');
    }
    expect(w.writes.length).toBe(writes);
  });

  it('BR-105g: one masked audit row per change (no title, no document number) with the changed field names; a no-op writes nothing', async () => {
    const w = setup();
    const uploadId = w.upload();
    const created = await w.service.create(manage, OOTY, { ...goodBody, title: 'SECRET TITLE', documentNumber: 'SECRET-NO', uploadId } as never);
    await w.service.update(manage, OOTY, created.id, { title: 'SECRET RENAMED', documentNumber: 'SECRET-NO-2', expiryDate: '2027-06-30', docType: 'LICENSE' });
    const writes = w.writes.length;
    // Same values again: nothing changes, nothing is written or audited.
    await w.service.update(manage, OOTY, created.id, { title: 'SECRET RENAMED', expiryDate: '2027-06-30', uploadId });
    expect(w.writes.length).toBe(writes);
    await w.service.archive(manage, OOTY, created.id);

    expect(w.audits.map((a) => a.actionCode)).toEqual(['warehouse.document.create', 'warehouse.document.update', 'warehouse.document.archive']);
    for (const audit of w.audits) {
      expect(audit).toMatchObject({ actorId: ADMIN, entityType: 'warehouse_document', entityId: created.id, warehouseId: OOTY });
    }
    const [create, update, archive] = w.audits;
    expect(create!.before).toBeNull();
    expect(create!.after).toEqual({ docType: 'FSSAI', issueDate: '2026-01-01', expiryDate: '2027-01-01', uploadId, archived: false });
    expect(update!.before).toEqual({ docType: 'FSSAI', issueDate: '2026-01-01', expiryDate: '2027-01-01', uploadId, archived: false });
    expect(update!.after).toEqual({ docType: 'LICENSE', issueDate: '2026-01-01', expiryDate: '2027-06-30', uploadId, archived: false });
    expect([...update!.changedFields!].sort()).toEqual(['docType', 'documentNumber', 'expiryDate', 'title']);
    expect(archive!.before).toMatchObject({ archived: false });
    expect(archive!.after).toMatchObject({ archived: true });
    expect(archive!.changedFields).toEqual(['archived']);
    expect(JSON.stringify(w.audits)).not.toContain('SECRET');
  });
});

// ===========================================================================
// 3. Service against real Postgres, in a rolled-back transaction
// ===========================================================================
describeIfDatabase('warehouse documents service (PostgreSQL)', () => {
  let ready = false;
  let wh: WarehouseIds;

  beforeAll(async () => {
    ready = await requireDatabaseTables('warehouse_documents', 'uploads', 'warehouses', 'system_config');
    if (ready) {
      const { pool } = await import('../../db/pool.js');
      wh = await loadWarehouseIds(pool);
    }
  });

  const dbTest = (name: string, fn: () => Promise<void>) =>
    it(name, async (context) => {
      if (!ready) context.skip();
      await fn();
    });

  // 2026-10-12 20:00 UTC = 2026-10-13 01:30 IST.
  const TODAY = '2026-10-13';
  const now = (): Date => new Date('2026-10-12T20:00:00Z');
  const service = (tx: Executor) =>
    createWarehouseDocumentsService({ repo: warehouseDocumentsRepo, db: tx, runTx: async (fn) => fn(tx), storage: new InMemoryBlobStorage('http://files.test'), now, log: () => undefined });
  const manage = (userId: string) => aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'warehouse.document.manage', userId });
  const subView = (userId: string, warehouseId: string) =>
    aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [warehouseId], permission: 'warehouse.document.view', userId });

  let seq = 0;
  async function actor(tx: Executor): Promise<string> {
    seq += 1;
    const user = await tx.query<{ id: string }>(
      `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, 'CI document admin', 'ADMIN', 'ACTIVE') RETURNING id`,
      [`+9196${String(Date.now() + seq).slice(-8)}`],
    );
    return user.rows[0]!.id;
  }
  async function upload(tx: Executor, owner: string, deleted = false): Promise<string> {
    const id = newId();
    await tx.query(
      `INSERT INTO uploads (id, storage_key, bucket, mime_type, size_bytes, uploaded_by, deleted_at)
       VALUES ($1, $2, 'private', 'application/pdf', 1024, $3, CASE WHEN $4::boolean THEN now() END)`,
      [id, `warehouse_documents/${id}.pdf`, owner, deleted],
    );
    return id;
  }
  const body = (uploadId: string, extra: Record<string, unknown> = {}) => ({ ...goodBody, uploadId, ...extra }) as never;

  dbTest('BR-105d: a Sub admin reads its own warehouse and gets the same 404 for another, an unknown warehouse and a crossed document', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      const tag = `D${Date.now()}`;
      const mine = await svc.create(manage(userId), wh.ooty, body(await upload(tx, userId), { title: `${tag} mine` }));
      const theirs = await svc.create(manage(userId), wh.coonoor, body(await upload(tx, userId), { title: `${tag} theirs` }));
      const sub = subView(userId, wh.ooty);
      expect((await svc.list(sub, wh.ooty, { page: 1, pageSize: 20, q: tag })).items.map((d) => d.id)).toEqual([mine.id]);
      const one = await svc.get(sub, wh.ooty, mine.id);
      expect(one).toMatchObject({ id: mine.id, mimeType: 'application/pdf' });
      expect(one.fileUrl).toContain(`warehouse_documents/${mine.uploadId}.pdf`);
      for (const call of [
        () => svc.list(sub, wh.coonoor, { page: 1, pageSize: 20 }),
        () => svc.list(sub, newId(), { page: 1, pageSize: 20 }),
        () => svc.get(sub, wh.coonoor, theirs.id),
        () => svc.get(manage(userId), wh.ooty, theirs.id),
      ]) {
        expect((await caught(call())).status).toBe(404);
      }
    });
  });

  dbTest('BR-105c: foreign, deleted and unknown uploads are 422; a reused live upload is 409', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const other = await actor(tx);
      const svc = service(tx);
      for (const uploadId of [await upload(tx, other), await upload(tx, userId, true), newId()]) {
        const error = await caught(svc.create(manage(userId), wh.ooty, body(uploadId)));
        expect(error.status).toBe(422);
        expect(Object.keys(error.errors ?? {})).toEqual(['body.uploadId']);
      }
      const shared = await upload(tx, userId);
      await svc.create(manage(userId), wh.ooty, body(shared));
      await tx.query('SAVEPOINT dup');
      const dup = await caught(svc.create(manage(userId), wh.coonoor, body(shared)));
      await tx.query('ROLLBACK TO SAVEPOINT dup');
      expect(dup.status).toBe(409);
      expect(dup.code).toBe('CONFLICT');
    });
  });

  dbTest('BR-105e/b: edit changes only the given fields; archived is 409 on edit; archive is once; dates round-trip as YYYY-MM-DD', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      const created = await svc.create(manage(userId), wh.ooty, body(await upload(tx, userId)));
      expect(created).toMatchObject({ issueDate: '2026-01-01', expiryDate: '2027-01-01', status: 'ACTIVE', uploadedBy: userId, updatedAt: null });
      const edited = await svc.update(manage(userId), wh.ooty, created.id, { expiryDate: addDays(TODAY, 30), documentNumber: null });
      expect(edited).toMatchObject({ title: goodBody.title, docType: 'FSSAI', issueDate: '2026-01-01', expiryDate: addDays(TODAY, 30), documentNumber: null, status: 'EXPIRING_SOON' });
      expect(edited.updatedAt).not.toBeNull();
      const merged = await caught(svc.update(manage(userId), wh.ooty, created.id, { expiryDate: '2025-12-31' }));
      expect(merged.status).toBe(422);

      const archived = await svc.archive(manage(userId), wh.ooty, created.id);
      expect(archived).toMatchObject({ status: 'ARCHIVED', archivedBy: userId });
      const again = await svc.archive(manage(userId), wh.ooty, created.id);
      expect(again.archivedAt).toBe(archived.archivedAt);
      expect((await caught(svc.update(manage(userId), wh.ooty, created.id, { title: 'x' }))).code).toBe('INVALID_STATE_TRANSITION');
    });
  });

  dbTest('BR-105f/b: the list filters by type and derived status in SQL, excludes archived by default, orders by expiry then title', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      await tx.query(`UPDATE system_config SET value = '10'::jsonb WHERE key = 'warehouse_document_expiry_warning_days'`);
      const tag = `F${Date.now()}`;
      const make = async (title: string, docType: string, expiryDate: string | null) =>
        svc.create(manage(userId), wh.kotagiri, body(await upload(tx, userId), { title: `${tag} ${title}`, docType, issueDate: null, expiryDate }));
      const noExpiry = await make('b-none', 'LEASE', null);
      const far = await make('far', 'LICENSE', addDays(TODAY, 11));
      const boundary = await make('boundary', 'FSSAI', addDays(TODAY, 10));
      const today = await make('today', 'LEASE', TODAY);
      const expired = await make('expired', 'INSURANCE', addDays(TODAY, -1));
      const gone = await make('archived', 'LEASE', addDays(TODAY, 2));
      await svc.archive(manage(userId), wh.kotagiri, gone.id);
      const aNone = await make('a-none', 'OTHER', null);

      const ids = async (query: Record<string, unknown>) =>
        (await svc.list(manage(userId), wh.kotagiri, { page: 1, pageSize: 100, q: tag, ...query } as never)).items.map((d) => d.id);
      expect(await ids({})).toEqual([expired.id, today.id, boundary.id, far.id, aNone.id, noExpiry.id]);
      expect(await ids({ status: 'EXPIRING_SOON' })).toEqual([today.id, boundary.id]);
      expect(await ids({ status: 'EXPIRED' })).toEqual([expired.id]);
      expect(await ids({ status: 'ACTIVE' })).toEqual([far.id, aNone.id, noExpiry.id]);
      expect(await ids({ status: 'ARCHIVED' })).toEqual([gone.id]);
      expect(await ids({ docType: 'LEASE' })).toEqual([today.id, noExpiry.id]);
      const page = await svc.list(manage(userId), wh.kotagiri, { page: 1, pageSize: 100, q: tag });
      expect(page.expiryWarningDays).toBe(10);
      for (const item of page.items) expect(deriveDocumentStatus(item, TODAY, 10)).toBe(item.status);

      // Wildcards in q are literal.
      expect(await ids({ q: `${tag}%` })).toEqual([]);

      // Fallback: the row missing means 30 days.
      await tx.query(`DELETE FROM system_config WHERE key = 'warehouse_document_expiry_warning_days'`);
      const fallback = await svc.list(manage(userId), wh.kotagiri, { page: 1, pageSize: 100, q: tag, status: 'EXPIRING_SOON' });
      expect(fallback.expiryWarningDays).toBe(30);
      expect(fallback.items.map((d) => d.id)).toEqual([today.id, boundary.id, far.id]);
    });
  });

  dbTest('BR-105g: one masked audit row per change in the same transaction; a no-op writes nothing', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      const created = await svc.create(manage(userId), wh.ooty, body(await upload(tx, userId), { title: 'SECRET TITLE', documentNumber: 'SECRET-NO' }));
      await svc.update(manage(userId), wh.ooty, created.id, { title: 'SECRET 2' });
      await svc.update(manage(userId), wh.ooty, created.id, { title: 'SECRET 2' });
      await svc.archive(manage(userId), wh.ooty, created.id);
      await svc.archive(manage(userId), wh.ooty, created.id);
      const rows = await tx.query<{ action_code: string; warehouse_id: string; entity_type: string; before: unknown; after: unknown; changed_fields: string[] | null }>(
        `SELECT action_code, warehouse_id::text, entity_type, before, after, changed_fields FROM audit_log
          WHERE actor_id = $1 AND entity_id = $2 ORDER BY action_code`,
        [userId, created.id],
      );
      expect(rows.rows.map((r) => r.action_code)).toEqual(['warehouse.document.archive', 'warehouse.document.create', 'warehouse.document.update']);
      for (const row of rows.rows) expect(row).toMatchObject({ warehouse_id: wh.ooty, entity_type: 'warehouse_document' });
      expect(rows.rows[2]!.changed_fields).toEqual(['title']);
      expect(JSON.stringify(rows.rows)).not.toContain('SECRET');
    });
  });
});

// ===========================================================================
// 4. Real HTTP through the real app router
// ===========================================================================
describeIfDatabase('warehouse documents routes (real app router, PostgreSQL)', () => {
  let ready = false;
  let harness: HttpHarness;
  const tag = `CIDOC${Date.now()}`;
  const uploadIds: string[] = [];

  beforeAll(async () => {
    ready = await requireDatabaseTables('warehouse_documents', 'uploads', 'warehouses');
    if (ready) harness = await startHttpHarness();
  });

  afterAll(async () => {
    if (!ready) return;
    const { pool } = await import('../../db/pool.js');
    await pool.query(`DELETE FROM warehouse_documents WHERE title LIKE $1`, [`${tag}%`]);
    if (uploadIds.length > 0) await pool.query(`DELETE FROM uploads WHERE id = ANY($1::uuid[])`, [uploadIds]);
    await harness.stop();
  });

  const dbTest = (name: string, fn: () => Promise<void>) =>
    it(name, async (context) => {
      if (!ready) context.skip();
      await fn();
    });

  async function upload(): Promise<string> {
    const { pool } = await import('../../db/pool.js');
    const id = newId();
    await pool.query(
      `INSERT INTO uploads (id, storage_key, bucket, mime_type, size_bytes, uploaded_by) VALUES ($1, $2, 'private', 'application/pdf', 1024, $3)`,
      [id, `warehouse_documents/${tag}/${id}.pdf`, harness.actorId],
    );
    uploadIds.push(id);
    return id;
  }
  const base = (warehouseId: string): string => `/v1/warehouses/${warehouseId}/documents`;

  dbTest('BR-105d (HTTP): 401 without a token; farmer, customer and farmer admin 403 everywhere; a Sub admin 403 on every write', async () => {
    const id = '99999999-9999-4999-8999-999999999999';
    const routes: Array<{ method: 'get' | 'post' | 'patch'; path: string; body?: object; subAllowed: boolean }> = [
      { method: 'get', path: base(harness.warehouse.ooty), subAllowed: true },
      { method: 'get', path: `${base(harness.warehouse.ooty)}/${id}`, subAllowed: true },
      { method: 'post', path: base(harness.warehouse.ooty), body: { ...goodBody, title: `${tag} x` }, subAllowed: false },
      { method: 'patch', path: `${base(harness.warehouse.ooty)}/${id}`, body: { title: 'x' }, subAllowed: false },
      { method: 'post', path: `${base(harness.warehouse.ooty)}/${id}/archive`, subAllowed: false },
    ];
    for (const route of routes) {
      expect((await request(harness.server)[route.method](route.path).send(route.body)).status, `${route.method} ${route.path}`).toBe(401);
      for (const role of ['farmer', 'customer', 'farmerAdmin'] as const) {
        const res = await request(harness.server)[route.method](route.path).set('Authorization', harness.auth(role)).send(route.body);
        expect(res.status, `${route.method} ${route.path} as ${role}`).toBe(403);
      }
      if (!route.subAllowed) {
        const res = await request(harness.server)[route.method](route.path).set('Authorization', harness.auth('subOoty')).send(route.body);
        expect(res.status, `${route.method} ${route.path} as Sub`).toBe(403);
      }
    }
  });

  dbTest('BR-105d/e (HTTP): Main creates, edits and archives; a Sub admin reads its own warehouse (200) and gets 404 elsewhere', async () => {
    const created = await request(harness.server)
      .post(base(harness.warehouse.ooty))
      .set('Authorization', harness.auth('main'))
      .send({ ...goodBody, title: `${tag} fssai`, uploadId: await upload() });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    expect(created.body).toMatchObject({ warehouseId: harness.warehouse.ooty, status: expect.any(String) });
    const path = `${base(harness.warehouse.ooty)}/${created.body.id as string}`;

    const list = await request(harness.server).get(base(harness.warehouse.ooty)).query({ q: tag }).set('Authorization', harness.auth('subOoty'));
    expect(list.status).toBe(200);
    expect(list.body.items.map((d: { id: string }) => d.id)).toEqual([created.body.id]);
    expect(list.body.items[0]).not.toHaveProperty('fileUrl');
    expect(typeof list.body.expiryWarningDays).toBe('number');
    const one = await request(harness.server).get(path).set('Authorization', harness.auth('subOoty'));
    expect(one.status).toBe(200);
    expect(one.body).toMatchObject({ mimeType: 'application/pdf', fileUrl: expect.any(String) });

    for (const target of [base(harness.warehouse.coonoor), `${base(harness.warehouse.coonoor)}/${created.body.id as string}`, base(newId())]) {
      const res = await request(harness.server).get(target).set('Authorization', harness.auth('subOoty'));
      expect(res.status, target).toBe(404);
    }

    const bad = await request(harness.server).post(base(harness.warehouse.ooty)).set('Authorization', harness.auth('main')).send({ ...goodBody, title: `${tag} bad`, issueDate: '2026-05-02', expiryDate: '2026-05-01', uploadId: await upload() });
    expect(bad.status).toBe(422);
    const dup = await request(harness.server).post(base(harness.warehouse.coonoor)).set('Authorization', harness.auth('main')).send({ ...goodBody, title: `${tag} dup`, uploadId: created.body.uploadId });
    expect(dup.status).toBe(409);
    expect((await request(harness.server).patch(path).set('Authorization', harness.auth('main')).send({})).status).toBe(422);
    const edited = await request(harness.server).patch(path).set('Authorization', harness.auth('superAdmin')).send({ documentNumber: null });
    expect(edited.status).toBe(200);
    expect(edited.body.documentNumber).toBeNull();
    const archived = await request(harness.server).post(`${path}/archive`).set('Authorization', harness.auth('tohfaAdmin'));
    expect(archived.status).toBe(200);
    expect(archived.body.status).toBe('ARCHIVED');
    expect((await request(harness.server).post(`${path}/archive`).set('Authorization', harness.auth('main'))).status).toBe(200);
    expect((await request(harness.server).patch(path).set('Authorization', harness.auth('main')).send({ title: `${tag} z` })).status).toBe(409);
    const del = await request(harness.server).delete(path).set('Authorization', harness.auth('superAdmin'));
    expect([404, 405]).toContain(del.status);
  });
});
