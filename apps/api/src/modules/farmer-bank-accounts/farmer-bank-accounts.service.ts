import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import type { Actor } from '../../auth/requireAuth.js';
import { AppError } from '../../http/problem.js';
import { farmerBankAccountsRepo, type BankAccountRow } from './farmer-bank-accounts.repo.js';
import type {
  CreateFarmerBankAccountBody,
  FarmerBankAccountResponse,
  FarmerUpiResponse,
  UpdateFarmerBankAccountBody,
  UpdateFarmerUpiBody,
} from './farmer-bank-accounts.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface FarmerBankAccountsServiceDeps {
  repo?: typeof farmerBankAccountsRepo;
  db?: Executor;
  runTx?: TransactionRunner;
}

/**
 * The only shape an audit before/after image may take (BR-35, BR-53a). An
 * explicit allow-list, so a column added to the table later cannot reach
 * audit_log by accident. The account-number token, verification metadata,
 * deletion marker and farmer id are deliberately absent.
 */
export function toAuditImage(row: BankAccountRow): Record<string, unknown> {
  return {
    id: row.id,
    accountHolderName: row.accountHolderName,
    accountNumberLast4: row.accountNumberLast4,
    ifsc: row.ifsc,
    bankName: row.bankName,
    branchName: row.branchName,
    upiVpa: row.upiVpa,
    isVerified: row.isVerified,
    isDefault: row.isDefault,
  };
}

function toBankAccountResponse(row: BankAccountRow): FarmerBankAccountResponse {
  return {
    id: row.id,
    accountHolderName: row.accountHolderName,
    accountNumberLast4: row.accountNumberLast4,
    ifsc: row.ifsc,
    bankName: row.bankName,
    branchName: row.branchName,
    upiVpa: row.upiVpa,
    isVerified: row.isVerified,
    isDefault: row.isDefault,
    createdAt: row.createdAt.toISOString(),
  };
}

function toUpiResponse(row: BankAccountRow): FarmerUpiResponse {
  return {
    id: row.id,
    // A UPI row is selected by `upi_vpa IS NOT NULL`, so this is never null here.
    upiVpa: row.upiVpa as string,
    isVerified: row.isVerified,
    isDefault: row.isDefault,
  };
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

  /** The acting role for the audit row, omitted rather than undefined. */
  function actorRole(actor: Actor): { actorRole?: string } {
    const role = actor.roles[0]?.code;
    return role !== undefined ? { actorRole: role } : {};
  }

  function notFound(what: string): AppError {
    return new AppError('NOT_FOUND', { detail: `${what} not found` });
  }

  async function audit(
    tx: Executor,
    actor: Actor,
    actionCode: string,
    entityId: string,
    images: { before?: BankAccountRow; after?: BankAccountRow },
  ): Promise<void> {
    await writeAuditLog(tx, {
      actorId: actor.userId,
      ...actorRole(actor),
      actionCode,
      entityType: 'farmer_bank_account',
      entityId,
      ...(images.before !== undefined ? { before: toAuditImage(images.before) } : {}),
      ...(images.after !== undefined ? { after: toAuditImage(images.after) } : {}),
    });
  }

  /**
   * The UPI holder name is the farmer's real name, never a placeholder: a
   * payout provider matches the holder against the VPA owner.
   */
  async function requireHolderName(farmerId: string): Promise<string> {
    const name = (await repo.getFarmerName(db, farmerId))?.trim();
    if (!name) {
      throw new AppError('VALIDATION_FAILED', {
        status: 422,
        detail: 'Add your full name to your profile before registering a UPI ID.',
      });
    }
    return name;
  }

  /**
   * Soft-delete one destination (BR-53e) and, when it was the default, hand
   * the default to the most recently created remaining destination in the same
   * transaction so a farmer with payout destinations never has none primary.
   * Runs inside the caller's transaction, after lockFarmer.
   */
  async function softDeleteDestination(
    tx: Executor,
    actor: Actor,
    farmerId: string,
    existing: BankAccountRow,
    actionCode: string,
  ): Promise<void> {
    if (await repo.hasInFlightPayoutReferences(tx, existing.id)) {
      throw new AppError('INVALID_STATE_TRANSITION', {
        detail:
          'This payout destination is used by a payout that has not settled yet. ' +
          'Delete it after the payout is paid, failed or reversed.',
      });
    }

    await repo.softDelete(tx, existing.id, farmerId);
    await audit(tx, actor, actionCode, existing.id, { before: existing });

    if (existing.isDefault) {
      const next = await repo.findNewestActiveDestination(tx, farmerId);
      if (next) {
        const promoted = await repo.setDefault(tx, next.id, farmerId);
        if (!promoted) throw notFound('Payout destination');
        await audit(tx, actor, 'farmer_bank_account.promote_default', promoted.id, {
          before: next,
          after: promoted,
        });
      }
    }
  }

  return {
    async listMyBankAccounts(actor: Actor): Promise<FarmerBankAccountResponse[]> {
      const farmer = await requireFarmer(actor);
      const rows = await repo.listBankAccounts(db, farmer.id);
      return rows.map(toBankAccountResponse);
    },

    async createMyBankAccount(
      actor: Actor,
      body: CreateFarmerBankAccountBody,
    ): Promise<FarmerBankAccountResponse> {
      const farmer = await requireFarmer(actor);

      return runTx(async (tx) => {
        await repo.lockFarmer(tx, farmer.id);
        // The first destination of either kind is the default automatically.
        const activeCount = await repo.countActiveDestinations(tx, farmer.id);
        const shouldBeDefault = body.isDefault || activeCount === 0;

        if (shouldBeDefault) {
          await repo.clearDefaults(tx, farmer.id);
        }

        // Only the last 4 digits are kept: the full number is never stored,
        // logged, audited or returned (BR-53a).
        const created = await repo.insert(tx, {
          farmerId: farmer.id,
          accountHolderName: body.accountHolderName,
          accountNumberLast4: body.accountNumber.slice(-4),
          ifsc: body.ifsc,
          bankName: body.bankName,
          branchName: body.branchName,
          isDefault: shouldBeDefault,
        });

        await audit(tx, actor, 'farmer_bank_account.create', created.id, { after: created });
        return toBankAccountResponse(created);
      });
    },

    async updateMyBankAccount(
      actor: Actor,
      id: string,
      body: UpdateFarmerBankAccountBody,
    ): Promise<FarmerBankAccountResponse> {
      const farmer = await requireFarmer(actor);

      return runTx(async (tx) => {
        await repo.lockFarmer(tx, farmer.id);
        const existing = await repo.findById(tx, id, farmer.id, 'BANK', true);
        if (!existing) throw notFound('Bank account');

        // BR-53c: changing the account number or IFSC invalidates verification.
        const numberChanged = body.accountNumber !== undefined;
        const resetVerified = numberChanged || (body.ifsc !== undefined && body.ifsc !== existing.ifsc);

        if (body.isDefault === true) {
          await repo.clearDefaults(tx, farmer.id);
        }

        const updated = await repo.update(tx, id, farmer.id, {
          accountHolderName: body.accountHolderName,
          accountNumberLast4: body.accountNumber?.slice(-4),
          // A new number makes any stored token describe the old one.
          accountNumberToken: numberChanged ? null : undefined,
          ifsc: body.ifsc,
          bankName: body.bankName,
          branchName: body.branchName,
          isVerified: resetVerified ? false : undefined,
          isDefault: body.isDefault,
        });
        if (!updated) throw notFound('Bank account');

        await audit(tx, actor, 'farmer_bank_account.update', id, { before: existing, after: updated });
        return toBankAccountResponse(updated);
      });
    },

    async setDefaultBankAccount(actor: Actor, id: string): Promise<FarmerBankAccountResponse> {
      const farmer = await requireFarmer(actor);

      return runTx(async (tx) => {
        await repo.lockFarmer(tx, farmer.id);
        // Either kind of the farmer's own destinations may become the default.
        const existing = await repo.findById(tx, id, farmer.id, 'ANY', true);
        if (!existing) throw notFound('Payout destination');

        await repo.clearDefaults(tx, farmer.id);
        const updated = await repo.setDefault(tx, id, farmer.id);
        if (!updated) throw notFound('Payout destination');

        await audit(tx, actor, 'farmer_bank_account.set_default', id, { before: existing, after: updated });
        return toBankAccountResponse(updated);
      });
    },

    async deleteMyBankAccount(actor: Actor, id: string): Promise<void> {
      const farmer = await requireFarmer(actor);

      return runTx(async (tx) => {
        await repo.lockFarmer(tx, farmer.id);
        const existing = await repo.findById(tx, id, farmer.id, 'BANK', true);
        if (!existing) throw notFound('Bank account');

        await softDeleteDestination(tx, actor, farmer.id, existing, 'farmer_bank_account.delete');
      });
    },

    async getMyUpi(actor: Actor): Promise<FarmerUpiResponse> {
      const farmer = await requireFarmer(actor);
      const existing = await repo.findUpiByFarmerId(db, farmer.id);
      if (!existing) throw notFound('UPI ID');
      return toUpiResponse(existing);
    },

    async updateMyUpi(actor: Actor, body: UpdateFarmerUpiBody): Promise<FarmerUpiResponse> {
      const farmer = await requireFarmer(actor);
      const holderName = await requireHolderName(farmer.id);

      return runTx(async (tx) => {
        await repo.lockFarmer(tx, farmer.id);
        const existing = await repo.findUpiByFarmerId(tx, farmer.id);

        let saved: BankAccountRow | null;
        if (existing) {
          // isDefault is only touched when explicitly sent; an omitted flag keeps the current one.
          if (body.isDefault === true) {
            await repo.clearDefaults(tx, farmer.id);
          }
          saved = await repo.update(tx, existing.id, farmer.id, {
            upiVpa: body.upiVpa,
            accountHolderName: holderName,
            isVerified: false,
            isDefault: body.isDefault,
          });
        } else {
          const activeCount = await repo.countActiveDestinations(tx, farmer.id);
          const shouldBeDefault = body.isDefault === true || activeCount === 0;
          if (shouldBeDefault) {
            await repo.clearDefaults(tx, farmer.id);
          }
          saved = await repo.insertUpi(tx, {
            farmerId: farmer.id,
            accountHolderName: holderName,
            upiVpa: body.upiVpa,
            isDefault: shouldBeDefault,
          });
        }
        if (!saved) throw notFound('UPI ID');

        await audit(tx, actor, 'farmer_bank_account.upsert_upi', saved.id, {
          ...(existing ? { before: existing } : {}),
          after: saved,
        });
        return toUpiResponse(saved);
      });
    },

    async deleteMyUpi(actor: Actor): Promise<void> {
      const farmer = await requireFarmer(actor);

      return runTx(async (tx) => {
        await repo.lockFarmer(tx, farmer.id);
        const existing = await repo.findUpiByFarmerId(tx, farmer.id);
        if (!existing) throw notFound('UPI ID');

        await softDeleteDestination(tx, actor, farmer.id, existing, 'farmer_bank_account.delete_upi');
      });
    },
  };
}

export const farmerBankAccountsService = createFarmerBankAccountsService();
