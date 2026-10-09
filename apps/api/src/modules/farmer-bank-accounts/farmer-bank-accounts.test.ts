import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import { anActor, aRole, describeIfDatabase, IDS } from '../../test/factories.js';
import {
  createFarmerBankAccountsService,
  type TransactionRunner,
} from './farmer-bank-accounts.service.js';
import { farmerBankAccountsRepo, type BankAccountRow } from './farmer-bank-accounts.repo.js';
import {
  createFarmerBankAccountBody,
  updateFarmerBankAccountBody,
  updateFarmerUpiBody,
} from './farmer-bank-accounts.schema.js';

type Repo = typeof farmerBankAccountsRepo;

const FARMER_ID = '33333333-3333-4000-8000-333333333333';
const OTHER_FARMER_ID = '44444444-4444-4000-8000-444444444444';
const ACCOUNT_ID = '55555555-5555-4000-8000-555555555555';
const UPI_ID = '66666666-6666-4000-8000-666666666666';
const FULL_NUMBER = '12345678901234';

/** Exactly the keys an audit image may carry. */
const AUDIT_KEYS = [
  'accountHolderName',
  'accountNumberLast4',
  'bankName',
  'branchName',
  'id',
  'ifsc',
  'isDefault',
  'isVerified',
  'upiVpa',
];

function aFarmerActor(userId: string = IDS.userFarmer) {
  return anActor({ userId, roles: [aRole(RoleCode.FARMER)], farmerId: FARMER_ID });
}

function aRow(overrides: Partial<BankAccountRow> = {}): BankAccountRow {
  return {
    id: ACCOUNT_ID,
    farmerId: FARMER_ID,
    accountHolderName: 'Murugan R.',
    accountNumberLast4: '4821',
    accountNumberToken: 'legacy-token-must-not-leak',
    ifsc: 'HDFC0001234',
    bankName: 'HDFC Bank',
    branchName: 'Ooty Main Branch',
    upiVpa: null,
    isVerified: true,
    verifiedBy: IDS.userSuperAdmin,
    verifiedAt: new Date('2026-10-01T00:00:00Z'),
    isDefault: false,
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

function aUpiRow(overrides: Partial<BankAccountRow> = {}): BankAccountRow {
  return aRow({
    id: UPI_ID,
    accountNumberLast4: null,
    accountNumberToken: null,
    ifsc: null,
    bankName: null,
    branchName: null,
    upiVpa: 'murugan@okhdfc',
    ...overrides,
  });
}

/**
 * A repo double. Only the methods a test names (plus the farmer lookups every
 * flow needs) exist; calling anything else throws, so an unexpected write
 * fails the test instead of silently passing.
 */
function aRepo(overrides: Partial<Repo> = {}): Repo {
  const base: Partial<Repo> = {
    findFarmerByUserId: async () => ({ id: FARMER_ID }),
    getFarmerName: async () => 'Murugan R.',
    lockFarmer: async () => {},
    hasInFlightPayoutReferences: async () => false,
    ...overrides,
  };
  return new Proxy(base as Repo, {
    get(target, prop: string) {
      const value = target[prop as keyof Repo];
      if (value === undefined) throw new Error(`unexpected repo call: ${prop}`);
      return value;
    },
  });
}

/** findById that honours farmerId and kind exactly like the SQL does. */
function findIn(rows: BankAccountRow[]): Repo['findById'] {
  return async (_db, id, farmerId, kind) =>
    rows.find(
      (row) =>
        row.id === id &&
        row.farmerId === farmerId &&
        (kind === 'ANY' ||
          (kind === 'BANK' && row.accountNumberLast4 !== null && row.upiVpa === null) ||
          (kind === 'UPI' && row.upiVpa !== null)),
    ) ?? null;
}

interface AuditCall {
  actionCode: string;
  actorRole: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

function recordingDb() {
  const audits: AuditCall[] = [];
  const sql: string[] = [];
  const db: Executor = {
    query: async (text: string, params: unknown[] = []) => {
      sql.push(text);
      if (text.includes('INSERT INTO audit_log')) {
        audits.push({
          actionCode: params[3] as string,
          actorRole: params[2] as string | null,
          before: params[8] === null ? null : JSON.parse(params[8] as string),
          after: params[9] === null ? null : JSON.parse(params[9] as string),
        });
        return { rows: [{ id: randomUUID() }], rowCount: 1 } as never;
      }
      return { rows: [], rowCount: 0 } as never;
    },
  };
  const runTx: TransactionRunner = async (fn) => fn(db);
  return { db, runTx, audits, sql };
}

function aService(repo: Repo) {
  const rec = recordingDb();
  const service = createFarmerBankAccountsService({ repo, db: rec.db, runTx: rec.runTx });
  return { service, ...rec };
}

const NEW_ACCOUNT = {
  accountHolderName: 'Murugan R.',
  accountNumber: FULL_NUMBER,
  ifsc: 'HDFC0001234',
  bankName: 'HDFC Bank',
  isDefault: false,
};

describe('Farmer Bank Accounts & UPI (BR-53 unit tests)', () => {
  it('BR-53a: create keeps only the last 4 digits and stores no account-number token', async () => {
    let inserted: Parameters<Repo['insert']>[1] | undefined;
    const { service, audits } = aService(
      aRepo({
        countActiveDestinations: async () => 1,
        clearDefaults: async () => {},
        insert: async (_db, params) => {
          inserted = params;
          return aRow({ accountNumberLast4: params.accountNumberLast4, isVerified: false });
        },
      }),
    );

    const res = await service.createMyBankAccount(aFarmerActor(), NEW_ACCOUNT);

    expect(inserted?.accountNumberLast4).toBe('1234');
    expect(inserted).not.toHaveProperty('accountNumberToken');
    expect(JSON.stringify(inserted)).not.toContain(FULL_NUMBER);
    expect(res.accountNumberLast4).toBe('1234');
    expect(JSON.stringify(res)).not.toContain(FULL_NUMBER);
    expect(res).not.toHaveProperty('accountNumber');
    expect(res).not.toHaveProperty('accountNumberToken');
    expect(JSON.stringify(audits)).not.toContain(FULL_NUMBER);
  });

  it('BR-53b: the request schemas reject a malformed IFSC, account number or UPI id', () => {
    const base = { accountHolderName: 'Murugan R.', bankName: 'HDFC Bank' };
    const accepts = (accountNumber: string, ifsc: string) =>
      createFarmerBankAccountBody.safeParse({ ...base, accountNumber, ifsc }).success;

    expect(accepts(FULL_NUMBER, 'INVALID_IFSC')).toBe(false);
    expect(accepts(FULL_NUMBER, 'HDFC1001234')).toBe(false);
    expect(accepts('1234', 'HDFC0001234')).toBe(false); // too short
    expect(accepts('1'.repeat(19), 'HDFC0001234')).toBe(false); // too long
    expect(accepts('1234abcd5678', 'HDFC0001234')).toBe(false); // not digits
    expect(accepts('1'.repeat(9), 'HDFC0001234')).toBe(true);
    expect(accepts('1'.repeat(18), 'HDFC0001234')).toBe(true);
    expect(updateFarmerBankAccountBody.safeParse({ accountNumber: '12 34' }).success).toBe(false);
    expect(updateFarmerBankAccountBody.safeParse({ ifsc: 'bad' }).success).toBe(false);
    expect(updateFarmerUpiBody.safeParse({ upiVpa: 'invalid-upi-no-at-symbol' }).success).toBe(false);
    expect(updateFarmerUpiBody.safeParse({ upiVpa: 'murugan@okhdfc' }).success).toBe(true);
  });

  it('BR-53b: a lowercase IFSC is accepted and normalised to uppercase before it is stored', () => {
    const created = createFarmerBankAccountBody.parse({ ...NEW_ACCOUNT, ifsc: ' hdfc0001234 ' });
    expect(created.ifsc).toBe('HDFC0001234');
    expect(updateFarmerBankAccountBody.parse({ ifsc: 'sbin0abc123' }).ifsc).toBe('SBIN0ABC123');
  });

  it('BR-53c: a newly created bank account is always isVerified: false', async () => {
    const { service } = aService(
      aRepo({
        countActiveDestinations: async () => 1,
        clearDefaults: async () => {},
        insert: async (_db, params) => {
          expect(params).not.toHaveProperty('isVerified');
          return aRow({ isVerified: false });
        },
      }),
    );
    const res = await service.createMyBankAccount(aFarmerActor(), NEW_ACCOUNT);
    expect(res.isVerified).toBe(false);
  });

  it('BR-53c: editing the account number resets isVerified and clears the stale token', async () => {
    let patch: Parameters<Repo['update']>[3] | undefined;
    const { service } = aService(
      aRepo({
        findById: findIn([aRow({ isVerified: true })]),
        update: async (_db, _id, _farmerId, params) => {
          patch = params;
          return aRow({ isVerified: params.isVerified ?? true, accountNumberLast4: params.accountNumberLast4 ?? '4821' });
        },
      }),
    );

    const res = await service.updateMyBankAccount(aFarmerActor(), ACCOUNT_ID, { accountNumber: '98765432109876' });

    expect(patch?.isVerified).toBe(false);
    expect(patch?.accountNumberLast4).toBe('9876');
    expect(patch?.accountNumberToken).toBeNull();
    expect(res.isVerified).toBe(false);
  });

  it('BR-53c: a changed IFSC resets verification; an unchanged IFSC or a name edit does not', async () => {
    const patches: Parameters<Repo['update']>[3][] = [];
    const { service } = aService(
      aRepo({
        findById: findIn([aRow({ isVerified: true })]),
        update: async (_db, _id, _farmerId, params) => {
          patches.push(params);
          return aRow();
        },
      }),
    );

    await service.updateMyBankAccount(aFarmerActor(), ACCOUNT_ID, { ifsc: 'SBIN0001234' });
    await service.updateMyBankAccount(aFarmerActor(), ACCOUNT_ID, { ifsc: 'HDFC0001234' });
    await service.updateMyBankAccount(aFarmerActor(), ACCOUNT_ID, { bankName: 'HDFC' });

    expect(patches.map((p) => p.isVerified)).toEqual([false, undefined, undefined]);
  });

  it('BR-53d: setting a destination as default clears the others, for a bank account or a UPI id', async () => {
    const kinds: string[] = [];
    const cleared: string[] = [];
    const rows = [aRow(), aUpiRow()];
    const find = findIn(rows);
    const { service } = aService(
      aRepo({
        findById: async (db, id, farmerId, kind, forUpdate) => {
          kinds.push(kind);
          return find(db, id, farmerId, kind, forUpdate);
        },
        clearDefaults: async () => {
          cleared.push('cleared');
        },
        setDefault: async (_db, id) => aRow({ id, isDefault: true }),
      }),
    );

    expect((await service.setDefaultBankAccount(aFarmerActor(), ACCOUNT_ID)).isDefault).toBe(true);
    expect((await service.setDefaultBankAccount(aFarmerActor(), UPI_ID)).isDefault).toBe(true);
    expect(cleared).toHaveLength(2);
    expect(kinds).toEqual(['ANY', 'ANY']);
  });

  it('BR-53e: deleting a destination referenced by an in-flight payout is refused with 409 INVALID_STATE_TRANSITION', async () => {
    let softDeleted = false;
    const { service, audits } = aService(
      aRepo({
        findById: findIn([aRow()]),
        hasInFlightPayoutReferences: async (_db, id) => id === ACCOUNT_ID,
        softDelete: async () => {
          softDeleted = true;
        },
      }),
    );

    await expect(service.deleteMyBankAccount(aFarmerActor(), ACCOUNT_ID)).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
      status: 409,
    });
    expect(softDeleted).toBe(false);
    expect(audits).toHaveLength(0);
  });

  it('BR-53e: the same in-flight guard protects a UPI destination', async () => {
    const { service } = aService(
      aRepo({
        findUpiByFarmerId: async () => aUpiRow(),
        hasInFlightPayoutReferences: async () => true,
      }),
    );
    await expect(service.deleteMyUpi(aFarmerActor())).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
      status: 409,
    });
  });

  it('BR-53e: a destination used only by settled payouts is soft-deleted, never hard-deleted', async () => {
    const softDeleted: string[] = [];
    const { service, audits } = aService(
      aRepo({
        findById: findIn([aRow()]),
        // The guard only counts in-flight payouts, so a PAID/FAILED/REVERSED one is not reported.
        hasInFlightPayoutReferences: async () => false,
        softDelete: async (_db, id, farmerId) => {
          expect(farmerId).toBe(FARMER_ID);
          softDeleted.push(id);
        },
      }),
    );

    await service.deleteMyBankAccount(aFarmerActor(), ACCOUNT_ID);

    expect(softDeleted).toEqual([ACCOUNT_ID]);
    expect(audits.map((a) => a.actionCode)).toEqual(['farmer_bank_account.delete']);
  });

  it('BR-53e: the repo SQL soft-deletes by setting deleted_at, and only in-flight payout statuses block', async () => {
    const calls: { sql: string; params: unknown[] }[] = [];
    const db: Executor = {
      query: async (sql: string, params: unknown[] = []) => {
        calls.push({ sql, params });
        return { rows: [], rowCount: 0 } as never;
      },
    };

    await farmerBankAccountsRepo.softDelete(db, ACCOUNT_ID, FARMER_ID);
    await farmerBankAccountsRepo.hasInFlightPayoutReferences(db, ACCOUNT_ID);

    const [remove, check] = calls;
    expect(remove?.sql).toMatch(/UPDATE farmer_bank_accounts\s+SET deleted_at = now\(\)/);
    expect(remove?.sql).toContain('farmer_id = $2');
    expect(remove?.sql).toContain('deleted_at IS NULL');
    expect(calls.map((c) => c.sql).join('\n')).not.toMatch(/DELETE\s+FROM/i);
    expect(check?.params[1]).toEqual(['REQUESTED', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING']);
    expect(check?.params[1]).not.toContain('PAID');
  });

  it('BR-53f: another farmer\'s account is a 404 NOT_FOUND on every id route, with no write attempted', async () => {
    const lookups: string[] = [];
    const find = findIn([aRow({ farmerId: OTHER_FARMER_ID })]);
    const { service } = aService(
      aRepo({
        findById: async (db, id, farmerId, kind, forUpdate) => {
          lookups.push(farmerId);
          return find(db, id, farmerId, kind, forUpdate);
        },
      }),
    );
    const actor = aFarmerActor();

    for (const call of [
      () => service.updateMyBankAccount(actor, ACCOUNT_ID, { accountHolderName: 'Hacker' }),
      () => service.setDefaultBankAccount(actor, ACCOUNT_ID),
      () => service.deleteMyBankAccount(actor, ACCOUNT_ID),
    ]) {
      await expect(call()).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    }
    // The owner filter is applied by the lookup itself, with the caller's farmer id.
    expect(lookups).toEqual([FARMER_ID, FARMER_ID, FARMER_ID]);
  });

  it('BR-53h: a UPI id passed to a bank-account route is a 404, and a bank id never answers the UPI routes', async () => {
    const { service } = aService(
      aRepo({
        findById: findIn([aUpiRow()]),
        findUpiByFarmerId: async () => null,
      }),
    );
    const actor = aFarmerActor();

    await expect(
      service.updateMyBankAccount(actor, UPI_ID, { bankName: 'HDFC' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    await expect(service.deleteMyBankAccount(actor, UPI_ID)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
    await expect(service.getMyUpi(actor)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    await expect(service.deleteMyUpi(actor)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });

  it('BR-53h: the repo restricts bank lookups to bank rows and UPI lookups to UPI rows', async () => {
    const sql: string[] = [];
    const db: Executor = {
      query: async (text: string) => {
        sql.push(text);
        return { rows: [], rowCount: 0 } as never;
      },
    };
    await farmerBankAccountsRepo.listBankAccounts(db, FARMER_ID);
    await farmerBankAccountsRepo.findById(db, ACCOUNT_ID, FARMER_ID, 'BANK');
    await farmerBankAccountsRepo.findUpiByFarmerId(db, FARMER_ID);

    expect(sql[0]).toContain('account_number_last4 IS NOT NULL AND upi_vpa IS NULL');
    expect(sql[1]).toContain('account_number_last4 IS NOT NULL AND upi_vpa IS NULL');
    expect(sql[1]).toContain('farmer_id = $2');
    expect(sql[2]).toContain('upi_vpa IS NOT NULL');
  });

  it('BR-53h: a UPI row carries the farmer\'s real name and no invented bank name', async () => {
    let inserted: Parameters<Repo['insertUpi']>[1] | undefined;
    const { service } = aService(
      aRepo({
        getFarmerName: async () => '  Murugan Rajan ',
        findUpiByFarmerId: async () => null,
        countActiveDestinations: async () => 0,
        clearDefaults: async () => {},
        insertUpi: async (_db, params) => {
          inserted = params;
          return aUpiRow({ accountHolderName: params.accountHolderName });
        },
      }),
    );

    await service.updateMyUpi(aFarmerActor(), { upiVpa: 'murugan@okhdfc' });

    expect(inserted?.accountHolderName).toBe('Murugan Rajan');
    expect(inserted).not.toHaveProperty('bankName');
  });

  it('BR-53h: registering a UPI id for a farmer with no name is a 422, never a placeholder holder', async () => {
    const { service, audits } = aService(
      aRepo({
        getFarmerName: async () => '   ',
        findUpiByFarmerId: async () => null,
      }),
    );
    await expect(service.updateMyUpi(aFarmerActor(), { upiVpa: 'murugan@okhdfc' })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      status: 422,
    });
    expect(audits).toHaveLength(0);
  });

  it('BR-53h: GET and DELETE /farmers/me/upi answer 404 when no UPI id is registered', async () => {
    const { service } = aService(aRepo({ findUpiByFarmerId: async () => null }));
    await expect(service.getMyUpi(aFarmerActor())).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    await expect(service.deleteMyUpi(aFarmerActor())).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });

  it('BR-53i: the first destination of either kind becomes the default; later ones do not', async () => {
    const flags: boolean[] = [];
    let count = 0;
    const { service } = aService(
      aRepo({
        findUpiByFarmerId: async () => null,
        countActiveDestinations: async () => count,
        clearDefaults: async () => {},
        insert: async (_db, params) => {
          flags.push(params.isDefault);
          return aRow({ isDefault: params.isDefault });
        },
        insertUpi: async (_db, params) => {
          flags.push(params.isDefault);
          return aUpiRow({ isDefault: params.isDefault });
        },
      }),
    );

    await service.updateMyUpi(aFarmerActor(), { upiVpa: 'murugan@okhdfc' }); // first: a UPI id
    count = 1;
    await service.createMyBankAccount(aFarmerActor(), NEW_ACCOUNT); // second: not default
    count = 0;
    await service.createMyBankAccount(aFarmerActor(), NEW_ACCOUNT); // first again: a bank account
    count = 1;
    await service.createMyBankAccount(aFarmerActor(), { ...NEW_ACCOUNT, isDefault: true }); // explicit

    expect(flags).toEqual([true, false, true, true]);
  });

  it('BR-53i: updating the UPI id without isDefault keeps the existing default flag', async () => {
    let patch: Parameters<Repo['update']>[3] | undefined;
    let cleared = false;
    const { service } = aService(
      aRepo({
        findUpiByFarmerId: async () => aUpiRow({ isDefault: true }),
        clearDefaults: async () => {
          cleared = true;
        },
        update: async (_db, _id, _farmerId, params) => {
          patch = params;
          return aUpiRow({ isDefault: true, isVerified: false, upiVpa: params.upiVpa ?? null });
        },
      }),
    );

    const res = await service.updateMyUpi(aFarmerActor(), { upiVpa: 'new.id@okhdfc' });

    expect(patch?.isDefault).toBeUndefined();
    expect(patch?.isVerified).toBe(false);
    expect(cleared).toBe(false);
    expect(res.isDefault).toBe(true);
  });

  it('BR-53i: deleting the default promotes the newest remaining destination, audited, for bank and UPI deletes', async () => {
    const promoted: string[] = [];
    const repo = (deleted: BankAccountRow) =>
      aRepo({
        findById: findIn([deleted]),
        findUpiByFarmerId: async () => deleted,
        softDelete: async () => {},
        findNewestActiveDestination: async () => aRow({ id: 'next-destination', isDefault: false }),
        setDefault: async (_db, id) => {
          promoted.push(id);
          return aRow({ id, isDefault: true });
        },
      });

    const bank = aService(repo(aRow({ isDefault: true })));
    await bank.service.deleteMyBankAccount(aFarmerActor(), ACCOUNT_ID);
    const upi = aService(repo(aUpiRow({ isDefault: true })));
    await upi.service.deleteMyUpi(aFarmerActor());

    expect(promoted).toEqual(['next-destination', 'next-destination']);
    expect(bank.audits.map((a) => a.actionCode)).toEqual([
      'farmer_bank_account.delete',
      'farmer_bank_account.promote_default',
    ]);
    expect(upi.audits.map((a) => a.actionCode)).toEqual([
      'farmer_bank_account.delete_upi',
      'farmer_bank_account.promote_default',
    ]);
  });

  it('BR-53i: deleting a non-default destination promotes nothing', async () => {
    const { service } = aService(
      aRepo({
        findById: findIn([aRow({ isDefault: false })]),
        softDelete: async () => {},
      }),
    );
    // findNewestActiveDestination / setDefault are absent from the repo double: calling them throws.
    await expect(service.deleteMyBankAccount(aFarmerActor(), ACCOUNT_ID)).resolves.toBeUndefined();
  });

  it('BR-53i: every mutation takes the farmer lock before it reads or writes', async () => {
    const order: string[] = [];
    const rows = [aRow({ isDefault: false })];
    const find = findIn(rows);
    const { service } = aService(
      aRepo({
        lockFarmer: async () => {
          order.push('lock');
        },
        countActiveDestinations: async () => 1,
        findUpiByFarmerId: async () => null,
        findById: async (db, id, farmerId, kind, forUpdate) => {
          order.push('find');
          return find(db, id, farmerId, kind, forUpdate);
        },
        insert: async () => {
          order.push('write');
          return aRow();
        },
        insertUpi: async () => {
          order.push('write');
          return aUpiRow();
        },
        update: async () => {
          order.push('write');
          return aRow();
        },
        setDefault: async () => {
          order.push('write');
          return aRow({ isDefault: true });
        },
        clearDefaults: async () => {},
        softDelete: async () => {
          order.push('write');
        },
      }),
    );
    const actor = aFarmerActor();
    const flows = [
      () => service.createMyBankAccount(actor, NEW_ACCOUNT),
      () => service.updateMyBankAccount(actor, ACCOUNT_ID, { bankName: 'HDFC' }),
      () => service.setDefaultBankAccount(actor, ACCOUNT_ID),
      () => service.deleteMyBankAccount(actor, ACCOUNT_ID),
      () => service.updateMyUpi(actor, { upiVpa: 'murugan@okhdfc' }),
      () => service.deleteMyUpi(actor).catch(() => undefined), // no UPI row: still locks first
    ];
    for (const flow of flows) {
      order.length = 0;
      await flow();
      expect(order[0]).toBe('lock');
    }
  });

  it('BR-53g: audit rows carry the actor role and are written for create, update, set-default and delete', async () => {
    const { service, audits } = aService(
      aRepo({
        countActiveDestinations: async () => 0,
        clearDefaults: async () => {},
        insert: async () => aRow(),
        findById: findIn([aRow({ isDefault: false })]),
        update: async () => aRow(),
        setDefault: async () => aRow({ isDefault: true }),
        softDelete: async () => {},
      }),
    );
    const actor = aFarmerActor();
    await service.createMyBankAccount(actor, NEW_ACCOUNT);
    await service.updateMyBankAccount(actor, ACCOUNT_ID, { bankName: 'SBI' });
    await service.setDefaultBankAccount(actor, ACCOUNT_ID);
    await service.deleteMyBankAccount(actor, ACCOUNT_ID);

    expect(audits.map((a) => a.actionCode)).toEqual([
      'farmer_bank_account.create',
      'farmer_bank_account.update',
      'farmer_bank_account.set_default',
      'farmer_bank_account.delete',
    ]);
    expect(audits.every((a) => a.actorRole === RoleCode.FARMER)).toBe(true);
    expect(audits[0]?.before).toBeNull();
    expect(audits[1]?.before).not.toBeNull();
    expect(audits[3]?.after).toBeNull();
  });

  it('BR-53g: the actor role is omitted from the audit row when the actor has none', async () => {
    const { service, audits } = aService(
      aRepo({
        countActiveDestinations: async () => 1,
        insert: async () => aRow(),
      }),
    );
    await service.createMyBankAccount(anActor({ userId: IDS.userFarmer, roles: [], farmerId: FARMER_ID }), NEW_ACCOUNT);
    expect(audits[0]?.actorRole).toBeNull();
  });

  it('BR-53g: audit images for bank and UPI create/update/set-default/delete contain only the allow-listed keys', async () => {
    const dirty = (row: BankAccountRow) => ({ ...row, accountNumberToken: 'tok_secret', deletedAt: new Date() });
    const bank = aRow({ isDefault: true });
    const upi = aUpiRow({ isDefault: true });
    const { service, audits } = aService(
      aRepo({
        countActiveDestinations: async () => 1,
        clearDefaults: async () => {},
        insert: async () => dirty(bank),
        insertUpi: async () => dirty(upi),
        findById: findIn([dirty(bank), dirty(upi)]),
        findUpiByFarmerId: async () => dirty(upi),
        update: async (_db, id) => dirty(id === UPI_ID ? upi : bank),
        setDefault: async (_db, id) => dirty(id === UPI_ID ? upi : bank),
        softDelete: async () => {},
        findNewestActiveDestination: async () => dirty(aRow({ id: 'next', isDefault: false })),
      }),
    );
    const actor = aFarmerActor();

    await service.createMyBankAccount(actor, NEW_ACCOUNT);
    await service.updateMyBankAccount(actor, ACCOUNT_ID, { bankName: 'SBI' });
    await service.setDefaultBankAccount(actor, ACCOUNT_ID);
    await service.setDefaultBankAccount(actor, UPI_ID);
    await service.deleteMyBankAccount(actor, ACCOUNT_ID); // default: also writes a promotion
    await service.updateMyUpi(actor, { upiVpa: 'murugan@okhdfc' });
    await service.deleteMyUpi(actor);

    expect(audits.length).toBeGreaterThanOrEqual(9);
    const images = audits.flatMap((a) => [a.before, a.after]).filter((i): i is Record<string, unknown> => i !== null);
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      expect(Object.keys(image).sort()).toEqual(AUDIT_KEYS);
    }
    const everything = JSON.stringify(audits);
    for (const secret of ['tok_secret', 'legacy-token', 'verifiedBy', 'verifiedAt', 'deletedAt', 'farmerId']) {
      expect(everything).not.toContain(secret);
    }
  });
});

// ---------------------------------------------------------------------------
// Real PostgreSQL: the actual schema, trigger-free soft delete, unique default
// index and the farmers-row lock. Gated on DATABASE_URL; writes committed rows
// under unique names and removes them again.
// ---------------------------------------------------------------------------
describeIfDatabase('Farmer Bank Accounts integration (PostgreSQL)', () => {
  const service = createFarmerBankAccountsService();
  const tag = String(Date.now()).slice(-9);
  const farmerIds: string[] = [];
  let adminUserId = '';
  let actorA: ReturnType<typeof aFarmerActor>;
  let actorB: ReturnType<typeof aFarmerActor>;
  let actorC: ReturnType<typeof aFarmerActor>;
  let farmerA = '';
  let farmerB = '';
  let farmerC = '';

  async function makeFarmer(label: string, digit: string, fullName: string) {
    const userId = randomUUID();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')`,
      [userId, `+9176${tag}${digit}`, fullName],
    );
    const farmer = await pool.query<{ id: string }>(
      `INSERT INTO farmers (user_id, tohfa_farmer_id, application_status, approved_by, approved_at)
       VALUES ($1, $2, 'APPROVED', $3, now()) RETURNING id`,
      [userId, `TF-BA-${label}-${tag}`, adminUserId],
    );
    const farmerId = farmer.rows[0]!.id;
    farmerIds.push(farmerId);
    return { userId, farmerId, actor: anActor({ userId, roles: [aRole(RoleCode.FARMER)], farmerId }) };
  }

  const account = (n: number, extra: Record<string, unknown> = {}) => ({
    ...NEW_ACCOUNT,
    accountNumber: `9900000000${String(n).padStart(4, '0')}`,
    ...extra,
  });

  async function activeRows(farmerId: string) {
    return (
      await pool.query<{ id: string; is_default: boolean; upi_vpa: string | null }>(
        `SELECT id, is_default, upi_vpa FROM farmer_bank_accounts WHERE farmer_id = $1 AND deleted_at IS NULL`,
        [farmerId],
      )
    ).rows;
  }

  async function insertPayout(farmerId: string, accountId: string, status: string) {
    await pool.query(
      `INSERT INTO payouts (payout_number, farmer_id, bank_account_id, amount, mode, status, initiated_by)
       VALUES ($1, $2, $3, 100.00, 'IMPS', $4::payout_status, $5)`,
      [`PO-BA-${tag}-${randomUUID().slice(0, 8)}`, farmerId, accountId, status, adminUserId],
    );
  }

  beforeAll(async () => {
    adminUserId = randomUUID();
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'BA Admin', 'ADMIN', 'ACTIVE')`,
      [adminUserId, `+9175${tag}0`],
    );
    const a = await makeFarmer('A', '1', 'Murugan Rajan');
    const b = await makeFarmer('B', '2', 'Lakshmi Devi');
    const c = await makeFarmer('C', '3', 'Selvam K');
    [actorA, actorB, actorC] = [a.actor, b.actor, c.actor];
    [farmerA, farmerB, farmerC] = [a.farmerId, b.farmerId, c.farmerId];
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM payouts WHERE farmer_id = ANY($1::uuid[])`, [farmerIds]);
    await pool.query(`DELETE FROM farmer_bank_accounts WHERE farmer_id = ANY($1::uuid[])`, [farmerIds]);
    await pool.query(`DELETE FROM farmers WHERE id = ANY($1::uuid[])`, [farmerIds]);
    // The users stay: audit_log rows (append-only) reference them.
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  it('BR-53a: the full number is never stored; the row keeps last 4 and a NULL token, and neither audit nor list leaks it', async () => {
    const created = await service.createMyBankAccount(actorA, account(1));
    const list = await service.listMyBankAccounts(actorA);

    const stored = await pool.query(`SELECT * FROM farmer_bank_accounts WHERE id = $1`, [created.id]);
    const row = stored.rows[0];
    expect(row.account_number_token).toBeNull();
    expect(row.account_number_last4).toBe('0001');
    expect(JSON.stringify(row)).not.toContain('99000000000001');

    const audit = await pool.query(`SELECT before, after FROM audit_log WHERE entity_id = $1`, [created.id]);
    expect(audit.rowCount).toBe(1);
    expect(JSON.stringify(audit.rows)).not.toContain('99000000000001');
    expect(JSON.stringify(list)).not.toContain('99000000000001');
    expect(list.find((item) => item.id === created.id)).toMatchObject({ accountNumberLast4: '0001', isVerified: false });
    await pool.query(`DELETE FROM farmer_bank_accounts WHERE id = $1`, [created.id]);
  });

  it('BR-53e: delete soft-deletes in the real table, hides the row from the list, and keeps it', async () => {
    const created = await service.createMyBankAccount(actorB, account(2));
    await service.deleteMyBankAccount(actorB, created.id);

    const stored = await pool.query(`SELECT deleted_at, is_default FROM farmer_bank_accounts WHERE id = $1`, [created.id]);
    expect(stored.rowCount).toBe(1);
    expect(stored.rows[0].deleted_at).not.toBeNull();
    expect(stored.rows[0].is_default).toBe(false);
    expect((await service.listMyBankAccounts(actorB)).map((a) => a.id)).not.toContain(created.id);
    await expect(service.deleteMyBankAccount(actorB, created.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('BR-53e: a payout that has not settled blocks deletion (409); settled payouts do not', async () => {
    const blocked = await service.createMyBankAccount(actorA, account(3));
    const settled = await service.createMyBankAccount(actorA, account(4));
    await insertPayout(farmerA, blocked.id, 'PENDING_APPROVAL');
    await insertPayout(farmerA, settled.id, 'PAID');
    await insertPayout(farmerA, settled.id, 'FAILED');
    await insertPayout(farmerA, settled.id, 'REVERSED');

    await expect(service.deleteMyBankAccount(actorA, blocked.id)).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
      status: 409,
    });
    await service.deleteMyBankAccount(actorA, settled.id);

    const stored = await pool.query(`SELECT id, deleted_at FROM farmer_bank_accounts WHERE id = ANY($1::uuid[])`, [[blocked.id, settled.id]]);
    const byId = new Map(stored.rows.map((r) => [r.id, r.deleted_at]));
    expect(byId.get(blocked.id)).toBeNull();
    expect(byId.get(settled.id)).not.toBeNull();
  });

  it('BR-53f: another farmer\'s account id is a 404 on update, set-default and delete', async () => {
    const mine = await service.createMyBankAccount(actorB, account(5));
    for (const call of [
      () => service.updateMyBankAccount(actorA, mine.id, { bankName: 'Mine now' }),
      () => service.setDefaultBankAccount(actorA, mine.id),
      () => service.deleteMyBankAccount(actorA, mine.id),
    ]) {
      await expect(call()).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    }
    expect((await service.listMyBankAccounts(actorA)).map((a) => a.id)).not.toContain(mine.id);
    const stored = await pool.query(`SELECT bank_name, deleted_at FROM farmer_bank_accounts WHERE id = $1`, [mine.id]);
    expect(stored.rows[0]).toMatchObject({ bank_name: 'HDFC Bank', deleted_at: null });
  });

  it('BR-53h: a UPI id is not a bank account: separate listing, real holder name, no bank name, 404 on bank routes', async () => {
    const upi = await service.updateMyUpi(actorC, { upiVpa: 'selvam@okhdfc' });

    const stored = (await pool.query(`SELECT * FROM farmer_bank_accounts WHERE id = $1`, [upi.id])).rows[0];
    expect(stored).toMatchObject({
      account_holder_name: 'Selvam K',
      bank_name: null,
      account_number_last4: null,
      account_number_token: null,
      upi_vpa: 'selvam@okhdfc',
      is_verified: false,
    });
    expect(await service.listMyBankAccounts(actorC)).toEqual([]);
    await expect(service.updateMyBankAccount(actorC, upi.id, { bankName: 'X Bank' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
    await expect(service.deleteMyBankAccount(actorC, upi.id)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(await service.getMyUpi(actorC)).toMatchObject({ id: upi.id, upiVpa: 'selvam@okhdfc' });

    await service.deleteMyUpi(actorC);
    await expect(service.getMyUpi(actorC)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    await expect(service.deleteMyUpi(actorC)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    await pool.query(`DELETE FROM farmer_bank_accounts WHERE farmer_id = $1`, [farmerC]);
  });

  it('BR-53i: UPI default semantics and default promotion on delete, across both kinds, in the real table', async () => {
    await pool.query(`DELETE FROM payouts WHERE farmer_id = $1`, [farmerB]);
    await pool.query(`DELETE FROM farmer_bank_accounts WHERE farmer_id = $1`, [farmerB]);

    const upi = await service.updateMyUpi(actorB, { upiVpa: 'lakshmi@okhdfc' });
    expect(upi.isDefault).toBe(true); // first destination of either kind
    const bank = await service.createMyBankAccount(actorB, account(6));
    expect(bank.isDefault).toBe(false);
    const again = await service.updateMyUpi(actorB, { upiVpa: 'lakshmi.new@okhdfc' });
    expect(again).toMatchObject({ id: upi.id, isDefault: true, isVerified: false });

    await service.setDefaultBankAccount(actorB, bank.id);
    expect((await service.getMyUpi(actorB)).isDefault).toBe(false);
    expect((await service.updateMyUpi(actorB, { upiVpa: 'lakshmi.new@okhdfc' })).isDefault).toBe(false);

    // Deleting the default bank account promotes the remaining UPI id.
    await service.deleteMyBankAccount(actorB, bank.id);
    expect((await activeRows(farmerB)).map((r) => [r.id, r.is_default])).toEqual([[upi.id, true]]);

    // And deleting the default UPI id promotes the newest remaining bank account.
    const newer = await service.createMyBankAccount(actorB, account(7));
    await service.deleteMyUpi(actorB);
    expect((await activeRows(farmerB)).map((r) => [r.id, r.is_default])).toEqual([[newer.id, true]]);

    const promotions = await pool.query(
      `SELECT 1 FROM audit_log WHERE action_code = 'farmer_bank_account.promote_default' AND entity_id = ANY($1::uuid[])`,
      [[bank.id, upi.id, newer.id]],
    );
    expect(promotions.rowCount).toBe(2);
  });

  it('BR-53i: concurrent creates with isDefault: true never fail and leave exactly one default', async () => {
    for (let round = 0; round < 5; round += 1) {
      await pool.query(`DELETE FROM farmer_bank_accounts WHERE farmer_id = $1`, [farmerC]);
      const results = await Promise.allSettled([
        service.createMyBankAccount(actorC, account(10 + round, { isDefault: true })),
        service.createMyBankAccount(actorC, account(20 + round, { isDefault: true })),
      ]);

      expect(results.map((r) => r.status)).toEqual(['fulfilled', 'fulfilled']);
      const rows = await activeRows(farmerC);
      expect(rows).toHaveLength(2);
      expect(rows.filter((r) => r.is_default)).toHaveLength(1);
    }
  });

  it('BR-53i: the service really waits on the farmers-row lock before touching defaults', async () => {
    await pool.query(`DELETE FROM farmer_bank_accounts WHERE farmer_id = $1`, [farmerC]);
    const target = await service.createMyBankAccount(actorC, account(30));
    const holder = await pool.connect();
    try {
      await holder.query('BEGIN');
      await farmerBankAccountsRepo.lockFarmer(holder, farmerC);

      // A plain edit rewrites one existing row once, which takes no foreign-key
      // lock on farmers, so only the service's own lockFarmer can make it wait.
      let finished = false;
      const pending = service.updateMyBankAccount(actorC, target.id, { bankName: 'Updated Bank' }).then((r) => {
        finished = true;
        return r;
      });
      await new Promise((resolve) => setTimeout(resolve, 400));
      expect(finished).toBe(false);

      await holder.query('COMMIT');
      await expect(pending).resolves.toMatchObject({ id: target.id, bankName: 'Updated Bank' });
    } finally {
      await holder.query('ROLLBACK'); // no-op after COMMIT; frees the lock if an assertion threw first
      holder.release();
    }
  });
});
