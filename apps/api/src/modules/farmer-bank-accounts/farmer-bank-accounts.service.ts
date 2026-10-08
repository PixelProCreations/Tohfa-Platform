import { randomUUID } from 'node:crypto';
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import type { Actor } from '../../auth/requireAuth.js';
import { AppError } from '../../http/problem.js';
import {
  farmerBankAccountsRepo,
} from './farmer-bank-accounts.repo.js';
import {
  ifscRegex,
  upiVpaRegex,
  type CreateFarmerBankAccountBody,
  type FarmerBankAccountResponse,
  type FarmerUpiResponse,
  type UpdateFarmerBankAccountBody,
  type UpdateFarmerUpiBody,
} from './farmer-bank-accounts.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface FarmerBankAccountsServiceDeps {
  repo?: typeof farmerBankAccountsRepo;
  db?: Executor;
  runTx?: TransactionRunner;
}

export function createFarmerBankAccountsService(
  deps: FarmerBankAccountsServiceDeps = {},
) {
  const repo = deps.repo ?? farmerBankAccountsRepo;
  const db = deps.db ?? pool;
  const runTx = deps.runTx ?? withTransaction;

  async function requireFarmer(actor: Actor): Promise<{ id: string }> {
    const farmer = await repo.findFarmerByUserId(db, actor.userId);
    if (!farmer) {
      throw new AppError('NOT_FOUND', { detail: 'Farmer profile not found for user' });
    }
    return farmer;
  }

  function validateIfsc(ifsc: string): void {
    if (!ifscRegex.test(ifsc)) {
      throw new AppError('VALIDATION_FAILED', {
        status: 422,
        detail: 'Invalid IFSC format',
        errors: { 'body.ifsc': ['IFSC must be 11 characters starting with 4 letters followed by 0'] },
      });
    }
  }

  function validateAccountNumber(acc: string): void {
    if (!/^\d{9,18}$/.test(acc)) {
      throw new AppError('VALIDATION_FAILED', {
        status: 422,
        detail: 'Invalid account number',
        errors: { 'body.accountNumber': ['Account number must be 9 to 18 digits'] },
      });
    }
  }

  function validateUpi(vpa: string): void {
    if (!upiVpaRegex.test(vpa)) {
      throw new AppError('VALIDATION_FAILED', {
        status: 422,
        detail: 'Invalid UPI ID format',
        errors: { 'body.upiVpa': ['Invalid UPI VPA format'] },
      });
    }
  }

  function getActorRole(actor: Actor): string {
    return actor.roles[0]?.code ?? 'FARMER';
  }

  return {
    async listMyBankAccounts(actor: Actor): Promise<FarmerBankAccountResponse[]> {
      const farmer = await requireFarmer(actor);
      return repo.listByFarmerId(db, farmer.id);
    },

    async createMyBankAccount(
      actor: Actor,
      body: CreateFarmerBankAccountBody,
    ): Promise<FarmerBankAccountResponse> {
      const farmer = await requireFarmer(actor);
      validateIfsc(body.ifsc);
      validateAccountNumber(body.accountNumber);

      const last4 = body.accountNumber.slice(-4);
      const token = `tok_bank_${randomUUID().replace(/-/g, '')}`;

      return runTx(async (tx) => {
        const activeCount = await repo.countActiveAccounts(tx, farmer.id);
        const shouldBeDefault = body.isDefault || activeCount === 0;

        if (shouldBeDefault) {
          await repo.clearDefaults(tx, farmer.id);
        }

        const created = await repo.insert(tx, {
          farmerId: farmer.id,
          accountHolderName: body.accountHolderName,
          accountNumberLast4: last4,
          accountNumberToken: token,
          ifsc: body.ifsc.toUpperCase(),
          bankName: body.bankName,
          branchName: body.branchName,
          isDefault: shouldBeDefault,
        });

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actorRole: getActorRole(actor),
          actionCode: 'farmer_bank_account.create',
          entityType: 'farmer_bank_account',
          entityId: created.id,
          after: created,
        });

        return created;
      });
    },

    async updateMyBankAccount(
      actor: Actor,
      id: string,
      body: UpdateFarmerBankAccountBody,
    ): Promise<FarmerBankAccountResponse> {
      const farmer = await requireFarmer(actor);
      const existing = await repo.findById(db, id);

      if (!existing || existing.farmerId !== farmer.id) {
        throw new AppError('NOT_FOUND', { detail: 'Bank account not found' });
      }

      if (body.ifsc !== undefined) {
        validateIfsc(body.ifsc);
      }
      if (body.accountNumber !== undefined) {
        validateAccountNumber(body.accountNumber);
      }

      return runTx(async (tx) => {
        let last4: string | undefined;
        let token: string | undefined;
        let resetVerified = false;

        if (body.accountNumber !== undefined) {
          last4 = body.accountNumber.slice(-4);
          token = `tok_bank_${randomUUID().replace(/-/g, '')}`;
          resetVerified = true;
        }

        if (body.ifsc !== undefined && body.ifsc.toUpperCase() !== existing.ifsc) {
          resetVerified = true;
        }

        if (body.isDefault === true) {
          await repo.clearDefaults(tx, farmer.id);
        }

        const updated = await repo.update(tx, id, {
          accountHolderName: body.accountHolderName,
          accountNumberLast4: last4,
          accountNumberToken: token,
          ifsc: body.ifsc ? body.ifsc.toUpperCase() : undefined,
          bankName: body.bankName,
          branchName: body.branchName,
          isVerified: resetVerified ? false : undefined,
          isDefault: body.isDefault,
        });

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actorRole: getActorRole(actor),
          actionCode: 'farmer_bank_account.update',
          entityType: 'farmer_bank_account',
          entityId: id,
          before: existing,
          after: updated,
        });

        return updated;
      });
    },

    async setDefaultBankAccount(actor: Actor, id: string): Promise<FarmerBankAccountResponse> {
      const farmer = await requireFarmer(actor);
      const existing = await repo.findById(db, id);

      if (!existing || existing.farmerId !== farmer.id) {
        throw new AppError('NOT_FOUND', { detail: 'Bank account not found' });
      }

      return runTx(async (tx) => {
        await repo.clearDefaults(tx, farmer.id);
        const updated = await repo.setDefault(tx, id);

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actorRole: getActorRole(actor),
          actionCode: 'farmer_bank_account.set_default',
          entityType: 'farmer_bank_account',
          entityId: id,
          before: existing,
          after: updated,
        });

        return updated;
      });
    },

    async deleteMyBankAccount(actor: Actor, id: string): Promise<void> {
      const farmer = await requireFarmer(actor);
      const existing = await repo.findById(db, id);

      if (!existing || existing.farmerId !== farmer.id) {
        throw new AppError('NOT_FOUND', { detail: 'Bank account not found' });
      }

      await runTx(async (tx) => {
        await repo.softDelete(tx, id);

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actorRole: getActorRole(actor),
          actionCode: 'farmer_bank_account.delete',
          entityType: 'farmer_bank_account',
          entityId: id,
          before: existing,
        });
      });
    },

    async getMyUpiPreference(actor: Actor): Promise<FarmerUpiResponse> {
      const farmer = await requireFarmer(actor);
      const upi = await repo.findUpiByFarmerId(db, farmer.id);
      if (!upi) {
        throw new AppError('NOT_FOUND', { detail: 'No UPI preference configured' });
      }
      return upi;
    },

    async setMyUpiPreference(actor: Actor, body: UpdateFarmerUpiBody): Promise<FarmerUpiResponse> {
      const farmer = await requireFarmer(actor);
      validateUpi(body.upiVpa);

      return runTx(async (tx) => {
        const existing = await repo.findUpiByFarmerId(tx, farmer.id);
        if (body.isDefault) {
          await repo.clearDefaults(tx, farmer.id);
        }

        const res = await repo.upsertUpi(tx, {
          farmerId: farmer.id,
          accountHolderName: 'UPI Destination',
          upiVpa: body.upiVpa,
          isDefault: body.isDefault ?? false,
        });

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actorRole: getActorRole(actor),
          actionCode: 'farmer_upi.update',
          entityType: 'farmer_bank_account',
          entityId: res.id ?? null,
          before: existing,
          after: res,
        });

        return res;
      });
    },

    async deleteMyUpiPreference(actor: Actor): Promise<void> {
      const farmer = await requireFarmer(actor);
      const existing = await repo.findUpiByFarmerId(db, farmer.id);

      if (!existing || !existing.id) {
        throw new AppError('NOT_FOUND', { detail: 'No UPI preference found' });
      }

      await runTx(async (tx) => {
        await repo.softDelete(tx, existing.id!);

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actorRole: getActorRole(actor),
          actionCode: 'farmer_upi.delete',
          entityType: 'farmer_bank_account',
          entityId: existing.id ?? null,
          before: existing,
        });
      });
    },
  };
}

export const farmerBankAccountsService = createFarmerBankAccountsService();
