import { RoleCode } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { beginIdempotent, idempotencyStore, requireIdempotencyKey, type IdempotencyStore } from '../../http/idempotency.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { eventBus } from '../../events/bus.js';
import { payoutsRepo, type PayoutRepo, type PayoutRow } from './payouts.repo.js';
import type {
  PayoutDue,
  PayoutDuesTotals,
  PayoutDuesQuery,
  PayoutResponse,
  CreatePayoutInput,
  ApprovePayoutInput,
} from './payouts.schema.js';

// ---------------------------------------------------------------------------
// BR-31: dual-approval threshold
// ---------------------------------------------------------------------------
const DUAL_APPROVAL_THRESHOLD = 10_000.00;

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

export interface PayoutsService {
  listPayoutDues(
    actor: Actor,
    scope: ResolvedScope,
    query: PayoutDuesQuery,
  ): Promise<{ items: PayoutDue[]; page: { nextCursor: string | null; hasMore: boolean }; totals: PayoutDuesTotals }>;

  createPayout(
    actor: Actor,
    scope: ResolvedScope,
    input: CreatePayoutInput,
    idempotencyKey?: string,
  ): Promise<PayoutResponse>;

  approvePayout(
    actor: Actor,
    scope: ResolvedScope,
    payoutId: string,
    input: ApprovePayoutInput,
    idempotencyKey?: string,
  ): Promise<PayoutResponse>;
}

// ---------------------------------------------------------------------------
// Helper: map DB row → response
// ---------------------------------------------------------------------------

function toResponse(
  payout: PayoutRow,
  approvals: Array<{ approver_id: string; approved_at: Date }>,
): PayoutResponse {
  return {
    id: payout.id,
    payoutNumber: payout.payout_number,
    farmerId: payout.farmer_id,
    farmerName: payout.farmer_name ?? '',
    amount: payout.amount,
    mode: payout.mode as PayoutResponse['mode'],
    status: payout.status as PayoutResponse['status'],
    requiresDualApproval: payout.requires_dual_approval,
    initiatedBy: payout.initiated_by,
    approvedBy: approvals.map((a) => a.approver_id),
    approvedAt: payout.released_at
      ? new Date(payout.released_at).toISOString()
      : approvals.length > 0
        ? approvals[approvals.length - 1]!.approved_at.toISOString()
        : null,
    gatewayPayoutId: payout.gateway_payout_id ?? null,
    failureReason: payout.failure_reason ?? null,
    paidAt: payout.paid_at ? new Date(payout.paid_at).toISOString() : null,
    remarks: payout.remarks ?? null,
    createdAt: new Date(payout.created_at).toISOString(),
    updatedAt: payout.updated_at ? new Date(payout.updated_at).toISOString() : null,
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export function createPayoutsService(
  opts: { repo?: PayoutRepo; runTx?: TransactionRunner; idempotency?: IdempotencyStore } = {},
): PayoutsService {
  const repo = opts.repo ?? payoutsRepo;
  const runTx: TransactionRunner = opts.runTx ?? withTransaction;
  const idempotency = opts.idempotency ?? idempotencyStore;
  const db = pool;

  return {
    // -------------------------------------------------------------------
    // GET /admin/payout-dues
    // -------------------------------------------------------------------
    async listPayoutDues(_actor, _scope, query) {
      const { items, totals, nextCursor } = await repo.listPayoutDues(db, query);
      return {
        items,
        page: { nextCursor, hasMore: nextCursor !== null },
        totals,
      };
    },

    // -------------------------------------------------------------------
    // POST /admin/payouts  (BR-31, BR-70, BR-72)
    // -------------------------------------------------------------------
    async createPayout(actor, _scope, input, idempotencyKey) {
      // BR-72: a missing key is refused before anything else runs, and a replay
      // returns the original payout before the checks below are re-evaluated
      // (a retry after the farmer was deactivated must not turn a created
      // payout into an error). The claim is made in the payout's own
      // transaction, so a refused attempt leaves no claim.
      const key = requireIdempotencyKey(idempotencyKey);

      let requiresDualApproval = false;
      const response = await runTx(async (tx) => {
        const idem = await beginIdempotent<PayoutResponse>(idempotency, tx, {
          actorUserId: actor.userId,
          key,
          operation: 'payout.create',
          request: input,
        });
        if (idem.replay) return { replayed: true as const, response: idem.response };

        // Validate farmer exists
        const farmerName = await repo.getFarmerName(tx, input.farmerId);
        if (!farmerName) {
          throw new AppError('NOT_FOUND', {
            status: 404,
            detail: `Farmer ${input.farmerId} not found.`,
          });
        }

        // Validate amount is positive
        const amountNum = parseFloat(input.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          throw new AppError('BAD_REQUEST', {
            status: 422,
            detail: 'Payout amount must be a positive number.',
          });
        }

        requiresDualApproval = amountNum > DUAL_APPROVAL_THRESHOLD;

        // BR-70: a supplied bank account must be an active destination of THIS
        // farmer. Checked inside the transaction, after the farmer row lock, so
        // a concurrent delete of the destination cannot slip between the check
        // and the insert. Nonexistent, another farmer's and deleted are one
        // 404 with one body: a distinct answer would confirm that an id exists
        // for someone else (BR-36).
        if (input.bankAccountId !== undefined) {
          await repo.lockFarmer(tx, input.farmerId);
          const owned = await repo.findActiveBankAccountOfFarmer(tx, input.bankAccountId, input.farmerId);
          if (!owned) {
            throw new AppError('NOT_FOUND', {
              status: 404,
              detail: `Bank account ${input.bankAccountId} not found.`,
            });
          }
        }

        const created = await repo.createPayout(tx, {
          farmerId: input.farmerId,
          amount: input.amount,
          mode: input.mode,
          initiatedBy: actor.userId,
          ...(input.bankAccountId !== undefined ? { bankAccountId: input.bankAccountId } : {}),
          ...(input.dueIds !== undefined ? { dueIds: input.dueIds } : {}),
          ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
        });
        const payout = created.payout;

        // For amounts ≤ 10,000: approve immediately (single-approval path)
        if (!requiresDualApproval) {
          await repo.updatePayoutStatus(tx, {
            payoutId: payout.id,
            status: 'APPROVED',
            releasedBy: actor.userId,
            releasedAt: new Date(),
          });
          payout.status = 'APPROVED';
        } else {
          // Amount > 10,000 → PENDING_APPROVAL, requires second Super Admin
          await repo.updatePayoutStatus(tx, {
            payoutId: payout.id,
            status: 'PENDING_APPROVAL',
          });
          payout.status = 'PENDING_APPROVAL';
        }

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actionCode: 'payout.farmer.initiate',
          entityType: 'payouts',
          entityId: payout.id,
          after: {
            amount: input.amount,
            farmerId: input.farmerId,
            requiresDualApproval,
            status: payout.status,
          },
        });

        // Final state with farmer name, read in the same transaction: it is what
        // is stored under the key and replayed, so it must be the exact response.
        const final = await repo.findPayoutById(tx, payout.id);
        const result = toResponse(final!.payout, final!.approvals);
        await idem.complete(result);
        return { replayed: false as const, response: result };
      });

      // BR-52/PAYROLL: notify the farmer once the payout is actually released
      // (single-approval path only — a dual-approval payout isn't released
      // yet, it's just PENDING_APPROVAL; that path is notified from
      // approvePayout below, at the point it actually becomes APPROVED).
      // Published after the transaction commits, same as every other domain
      // event in this codebase (events/bus.ts: delivery is fault-isolated and
      // must never roll back the publisher's own transaction). A replay
      // already announced it, so it publishes nothing (BR-72).
      if (!response.replayed && !requiresDualApproval) {
        const farmerUserId = await repo.getFarmerUserId(db, response.response.farmerId);
        if (farmerUserId) {
          await eventBus.publish('payout.released', {
            userId: farmerUserId,
            payoutId: response.response.id,
            amount: response.response.amount,
            reference: response.response.payoutNumber,
          });
        }
      }

      return response.response;
    },

    // -------------------------------------------------------------------
    // POST /admin/payouts/{id}/approve  (BR-31, BR-72)
    // -------------------------------------------------------------------
    async approvePayout(actor, _scope, payoutId, input, idempotencyKey) {
      const key = requireIdempotencyKey(idempotencyKey);

      const outcome = await runTx(async (tx) => {
        // The claim comes first so a replay returns the original body instead of
        // the state error the already-approved payout would otherwise give.
        const idem = await beginIdempotent<PayoutResponse>(idempotency, tx, {
          actorUserId: actor.userId,
          key,
          operation: 'payout.approve',
          request: { payoutId, note: input.note ?? null },
        });
        if (idem.replay) return { replayed: true as const, response: idem.response };

        // Row lock: two approvers racing must not both see PENDING_APPROVAL.
        const existing = await repo.findPayoutById(tx, payoutId, true);
        if (!existing) {
          throw new AppError('NOT_FOUND', {
            status: 404,
            detail: `Payout ${payoutId} not found.`,
          });
        }

        const { payout, approvals } = existing;

        // Only PENDING_APPROVAL payouts can be approved here
        if (payout.status !== 'PENDING_APPROVAL') {
          throw new AppError('INVALID_STATE_TRANSITION', {
            status: 409,
            detail: `Payout is in status ${payout.status}; only PENDING_APPROVAL payouts can be approved.`,
          });
        }

        // BR-31b: initiator cannot approve their own payout
        if (payout.initiated_by === actor.userId) {
          throw new AppError('SAME_ACTOR_APPROVAL', {
            status: 403,
            detail: `You initiated payout ${payout.payout_number}; a different approver is required (BR-31b).`,
          });
        }

        // BR-31d: already approved by this actor
        const alreadyApproved = approvals.some((a) => a.approver_id === actor.userId);
        if (alreadyApproved) {
          throw new AppError('SAME_ACTOR_APPROVAL', {
            status: 403,
            detail: `You have already provided an approval for payout ${payout.payout_number}.`,
          });
        }

        // For dual-approval payouts, second approver must be SUPER_ADMIN
        const isSuperAdmin = actor.roles.some((r) => r.code === RoleCode.SUPER_ADMIN);
        if (!isSuperAdmin) {
          throw new AppError('FORBIDDEN', {
            status: 403,
            detail: 'Approvals for payouts above ₹10,000 require Super Admin role (BR-31).',
          });
        }

        const updatedApprovals = await repo.addApproval(tx, {
          payoutId,
          approverId: actor.userId,
          approverRoleCode: actor.roles[0]?.code ?? 'SUPER_ADMIN',
          ...(input.note !== undefined ? { note: input.note } : {}),
        });

        // Transition to APPROVED
        await repo.updatePayoutStatus(tx, {
          payoutId,
          status: 'APPROVED',
          releasedBy: actor.userId,
          releasedAt: new Date(),
        });

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actionCode: 'payout.approve_above_10k',
          entityType: 'payouts',
          entityId: payoutId,
          after: { status: 'APPROVED', approverCount: updatedApprovals.length },
        });

        const final = await repo.findPayoutById(tx, payoutId);
        const result = toResponse(final!.payout, final!.approvals);
        await idem.complete(result);
        return { replayed: false as const, response: result };
      });

      // BR-52/PAYROLL: this approval is the moment a dual-approval payout
      // actually becomes APPROVED/released (see the matching comment in
      // createPayout for the single-approval path and why publish happens
      // after the transaction commits). A replay announces nothing.
      if (!outcome.replayed) {
        const farmerUserId = await repo.getFarmerUserId(db, outcome.response.farmerId);
        if (farmerUserId) {
          await eventBus.publish('payout.released', {
            userId: farmerUserId,
            payoutId: outcome.response.id,
            amount: outcome.response.amount,
            reference: outcome.response.payoutNumber,
          });
        }
      }

      return outcome.response;
    },
  };
}

// Singleton for production
export const payoutsService = createPayoutsService();
