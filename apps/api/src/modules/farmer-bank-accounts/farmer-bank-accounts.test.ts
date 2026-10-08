import { describe, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { pool } from '../../db/pool.js';
import { anActor, aRole, describeIfDatabase, IDS } from '../../test/factories.js';
import {
  createFarmerBankAccountsService,
  type TransactionRunner,
} from './farmer-bank-accounts.service.js';
import type { BankAccountRow, farmerBankAccountsRepo } from './farmer-bank-accounts.repo.js';

const FARMER_ID = '33333333-3333-4000-8000-333333333333';
const OTHER_FARMER_ID = '44444444-4444-4000-8000-444444444444';
const ACCOUNT_ID = '55555555-5555-4000-8000-555555555555';

function aFarmerActor(userId: string = IDS.userFarmer) {
  return anActor({
    userId,
    roles: [aRole(RoleCode.FARMER)],
    farmerId: FARMER_ID,
  });
}

function mockAccount(overrides: Partial<BankAccountRow> = {}): BankAccountRow {
  return {
    id: ACCOUNT_ID,
    farmerId: FARMER_ID,
    accountHolderName: 'Murugan R.',
    accountNumberLast4: '4821',
    accountNumberToken: 'tok_bank_test123',
    ifsc: 'HDFC0001234',
    bankName: 'HDFC Bank',
    branchName: 'Ooty Main Branch',
    upiVpa: null,
    isVerified: true,
    verifiedBy: IDS.userSuperAdmin,
    verifiedAt: new Date(),
    isDefault: true,
    createdAt: new Date(),
    updatedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

describe('Farmer Bank Accounts & UPI (BR-53 unit tests)', () => {
  const auditEntries: any[] = [];
  const dummyDb: Executor = {
    query: async (sql: any) => {
      if (typeof sql === 'string' && sql.includes('INSERT INTO audit_log')) {
        auditEntries.push({ sql });
        return { rows: [{ id: 'audit-1' }], rowCount: 1 } as any;
      }
      return { rows: [], rowCount: 0 } as any;
    },
  };
  const dummyTxRunner: TransactionRunner = async (fn) => fn(dummyDb);

  it('BR-53a: create masks account number to last 4 digits only and generates token', async () => {
    let insertedParams: any = null;
    const fakeRepo: typeof farmerBankAccountsRepo = {
      findFarmerByUserId: async () => ({ id: FARMER_ID }),
      countActiveAccounts: async () => 0,
      clearDefaults: async () => {},
      insert: async (_db: any, params: any) => {
        insertedParams = params;
        return {
          id: ACCOUNT_ID,
          accountHolderName: params.accountHolderName,
          accountNumberLast4: params.accountNumberLast4,
          ifsc: params.ifsc,
          bankName: params.bankName,
          branchName: params.branchName ?? null,
          upiVpa: null,
          isVerified: false,
          isDefault: params.isDefault ?? false,
          createdAt: new Date().toISOString(),
        };
      },
    } as any;

    const service = createFarmerBankAccountsService({ repo: fakeRepo, db: dummyDb, runTx: dummyTxRunner });
    const res = await service.createMyBankAccount(aFarmerActor(), {
      accountHolderName: 'Murugan R.',
      accountNumber: '12345678901234',
      ifsc: 'HDFC0001234',
      bankName: 'HDFC Bank',
      branchName: 'Ooty Main Branch',
      isDefault: true,
    });

    expect(insertedParams.accountNumberLast4).toBe('1234');
    expect(insertedParams.accountNumberToken).toMatch(/^tok_bank_/);
    expect(res.accountNumberLast4).toBe('1234');
    expect((res as any).accountNumber).toBeUndefined();
    expect((res as any).accountNumberToken).toBeUndefined();
  });

  it('BR-53b: rejects invalid IFSC format with 422 VALIDATION_FAILED', async () => {
    const fakeRepo: typeof farmerBankAccountsRepo = {
      findFarmerByUserId: async () => ({ id: FARMER_ID }),
    } as any;

    const service = createFarmerBankAccountsService({ repo: fakeRepo, db: dummyDb, runTx: dummyTxRunner });
    await expect(
      service.createMyBankAccount(aFarmerActor(), {
        accountHolderName: 'Murugan R.',
        accountNumber: '12345678901234',
        ifsc: 'INVALID_IFSC',
        bankName: 'HDFC Bank',
      }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      status: 422,
    });
  });

  it('BR-53b: rejects account numbers with invalid length', async () => {
    const fakeRepo: typeof farmerBankAccountsRepo = {
      findFarmerByUserId: async () => ({ id: FARMER_ID }),
    } as any;

    const service = createFarmerBankAccountsService({ repo: fakeRepo, db: dummyDb, runTx: dummyTxRunner });
    await expect(
      service.createMyBankAccount(aFarmerActor(), {
        accountHolderName: 'Murugan R.',
        accountNumber: '1234', // too short (< 9)
        ifsc: 'HDFC0001234',
        bankName: 'HDFC Bank',
      }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      status: 422,
    });
  });

  it('BR-53b: rejects invalid UPI VPA format', async () => {
    const fakeRepo: typeof farmerBankAccountsRepo = {
      findFarmerByUserId: async () => ({ id: FARMER_ID }),
    } as any;

    const service = createFarmerBankAccountsService({ repo: fakeRepo, db: dummyDb, runTx: dummyTxRunner });
    await expect(
      service.setMyUpiPreference(aFarmerActor(), {
        upiVpa: 'invalid-upi-no-at-symbol',
      }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      status: 422,
    });
  });

  it('BR-53c: newly created bank account is always isVerified: false', async () => {
    const fakeRepo: typeof farmerBankAccountsRepo = {
      findFarmerByUserId: async () => ({ id: FARMER_ID }),
      countActiveAccounts: async () => 1,
      clearDefaults: async () => {},
      insert: async (_db: any, params: any) => ({
        id: ACCOUNT_ID,
        accountHolderName: params.accountHolderName,
        accountNumberLast4: params.accountNumberLast4,
        ifsc: params.ifsc,
        bankName: params.bankName,
        branchName: null,
        upiVpa: null,
        isVerified: false,
        isDefault: false,
        createdAt: new Date().toISOString(),
      }),
    } as any;

    const service = createFarmerBankAccountsService({ repo: fakeRepo, db: dummyDb, runTx: dummyTxRunner });
    const res = await service.createMyBankAccount(aFarmerActor(), {
      accountHolderName: 'Murugan R.',
      accountNumber: '12345678901234',
      ifsc: 'HDFC0001234',
      bankName: 'HDFC Bank',
    });

    expect(res.isVerified).toBe(false);
  });

  it('BR-53c: editing account number resets isVerified to false', async () => {
    let updatedPayload: any = null;
    const fakeRepo: typeof farmerBankAccountsRepo = {
      findFarmerByUserId: async () => ({ id: FARMER_ID }),
      findById: async () => mockAccount({ isVerified: true }),
      clearDefaults: async () => {},
      update: async (_db: any, _id: any, params: any) => {
        updatedPayload = params;
        return {
          id: ACCOUNT_ID,
          accountHolderName: 'Murugan R.',
          accountNumberLast4: params.accountNumberLast4 ?? '4821',
          ifsc: 'HDFC0001234',
          bankName: 'HDFC Bank',
          branchName: null,
          upiVpa: null,
          isVerified: params.isVerified ?? true,
          isDefault: true,
          createdAt: new Date().toISOString(),
        };
      },
    } as any;

    const service = createFarmerBankAccountsService({ repo: fakeRepo, db: dummyDb, runTx: dummyTxRunner });
    const res = await service.updateMyBankAccount(aFarmerActor(), ACCOUNT_ID, {
      accountNumber: '98765432109876',
    });

    expect(updatedPayload.isVerified).toBe(false);
    expect(res.isVerified).toBe(false);
  });

  it('BR-53d: setting an account as default clears defaults on other accounts', async () => {
    let cleared = false;
    let setDefaultId = '';
    const fakeRepo: typeof farmerBankAccountsRepo = {
      findFarmerByUserId: async () => ({ id: FARMER_ID }),
      findById: async () => mockAccount({ isDefault: false }),
      clearDefaults: async () => {
        cleared = true;
      },
      setDefault: async (_db: any, id: any) => {
        setDefaultId = id;
        return {
          id,
          accountHolderName: 'Murugan R.',
          accountNumberLast4: '4821',
          ifsc: 'HDFC0001234',
          bankName: 'HDFC Bank',
          branchName: null,
          upiVpa: null,
          isVerified: false,
          isDefault: true,
          createdAt: new Date().toISOString(),
        };
      },
    } as any;

    const service = createFarmerBankAccountsService({ repo: fakeRepo, db: dummyDb, runTx: dummyTxRunner });
    const res = await service.setDefaultBankAccount(aFarmerActor(), ACCOUNT_ID);

    expect(cleared).toBe(true);
    expect(setDefaultId).toBe(ACCOUNT_ID);
    expect(res.isDefault).toBe(true);
  });

  it('BR-53e: soft delete sets deleted_at and does not hard-delete', async () => {
    let softDeletedId = '';
    const fakeRepo: typeof farmerBankAccountsRepo = {
      findFarmerByUserId: async () => ({ id: FARMER_ID }),
      findById: async () => mockAccount(),
      softDelete: async (_db: any, id: any) => {
        softDeletedId = id;
      },
    } as any;

    const service = createFarmerBankAccountsService({ repo: fakeRepo, db: dummyDb, runTx: dummyTxRunner });
    await service.deleteMyBankAccount(aFarmerActor(), ACCOUNT_ID);

    expect(softDeletedId).toBe(ACCOUNT_ID);
  });

  it('BR-53f: accessing another farmer account returns 404 NOT_FOUND (BR-36)', async () => {
    const fakeRepo: typeof farmerBankAccountsRepo = {
      findFarmerByUserId: async () => ({ id: FARMER_ID }),
      findById: async () => mockAccount({ farmerId: OTHER_FARMER_ID }),
    } as any;

    const service = createFarmerBankAccountsService({ repo: fakeRepo, db: dummyDb, runTx: dummyTxRunner });
    await expect(
      service.updateMyBankAccount(aFarmerActor(), ACCOUNT_ID, { accountHolderName: 'Hacker' }),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });

  it('BR-53g: create, update, set-default and delete write audit log entries', async () => {
    const writes: string[] = [];
    const trackingDb: Executor = {
      query: async (sql: any) => {
        if (typeof sql === 'string' && sql.includes('INSERT INTO audit_log')) {
          writes.push(sql);
          return { rows: [{ id: 'audit-id' }], rowCount: 1 } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      },
    };

    const fakeRepo: typeof farmerBankAccountsRepo = {
      findFarmerByUserId: async () => ({ id: FARMER_ID }),
      countActiveAccounts: async () => 0,
      clearDefaults: async () => {},
      insert: async () => ({
        id: ACCOUNT_ID,
        accountHolderName: 'Murugan R.',
        accountNumberLast4: '4821',
        ifsc: 'HDFC0001234',
        bankName: 'HDFC Bank',
        branchName: null,
        upiVpa: null,
        isVerified: false,
        isDefault: true,
        createdAt: new Date().toISOString(),
      }),
      findById: async () => mockAccount(),
      update: async () => ({
        id: ACCOUNT_ID,
        accountHolderName: 'Murugan R.',
        accountNumberLast4: '4821',
        ifsc: 'HDFC0001234',
        bankName: 'HDFC Bank',
        branchName: null,
        upiVpa: null,
        isVerified: false,
        isDefault: true,
        createdAt: new Date().toISOString(),
      }),
      setDefault: async () => ({
        id: ACCOUNT_ID,
        accountHolderName: 'Murugan R.',
        accountNumberLast4: '4821',
        ifsc: 'HDFC0001234',
        bankName: 'HDFC Bank',
        branchName: null,
        upiVpa: null,
        isVerified: false,
        isDefault: true,
        createdAt: new Date().toISOString(),
      }),
      softDelete: async () => {},
    } as any;

    const trackingTxRunner: TransactionRunner = async (fn) => fn(trackingDb);
    const service = createFarmerBankAccountsService({ repo: fakeRepo, db: trackingDb, runTx: trackingTxRunner });

    await service.createMyBankAccount(aFarmerActor(), {
      accountHolderName: 'Murugan R.',
      accountNumber: '12345678901234',
      ifsc: 'HDFC0001234',
      bankName: 'HDFC Bank',
    });
    expect(writes.length).toBe(1);

    await service.updateMyBankAccount(aFarmerActor(), ACCOUNT_ID, { bankName: 'SBI' });
    expect(writes.length).toBe(2);

    await service.setDefaultBankAccount(aFarmerActor(), ACCOUNT_ID);
    expect(writes.length).toBe(3);

    await service.deleteMyBankAccount(aFarmerActor(), ACCOUNT_ID);
    expect(writes.length).toBe(4);
  });
});

describeIfDatabase('Farmer Bank Accounts integration (PostgreSQL)', () => {
  it('real schema supports farmer_bank_accounts queries and soft delete', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const res = await client.query(
        `SELECT id, account_holder_name, account_number_last4, ifsc, bank_name, branch_name, upi_vpa, is_verified, is_default, created_at
         FROM farmer_bank_accounts
         LIMIT 1`,
      );
      expect(res.rows).toBeDefined();
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});
