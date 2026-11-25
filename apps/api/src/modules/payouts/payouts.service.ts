import { randomUUID } from 'node:crypto';
import { isMoney, parseMoney, toPaise } from '@tohfa/shared-types';
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
  RejectPayoutInput,
  IntimatePayoutInput,
  IntimatePayoutResponse,
  BulkCreatePayoutsInput,
  BulkCreatePayoutsResponse,
  ExportPayoutsQuery,
  ListPayoutsQuery,
  ListPayoutsResponse,
  PayoutDetailResponse,
} from './payouts.schema.js';

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

  rejectPayout(
    actor: Actor,
    scope: ResolvedScope,
    payoutId: string,
    input: RejectPayoutInput,
    idempotencyKey?: string,
  ): Promise<PayoutResponse>;

  intimatePayout(
    actor: Actor,
    scope: ResolvedScope,
    payoutId: string,
    input: IntimatePayoutInput,
  ): Promise<IntimatePayoutResponse>;

  createBulkPayouts(
    actor: Actor,
    scope: ResolvedScope,
    input: BulkCreatePayoutsInput,
    idempotencyKey?: string,
  ): Promise<BulkCreatePayoutsResponse>;

  exportPayouts(
    scope: ResolvedScope,
    query: ExportPayoutsQuery,
  ): Promise<{ filename: string; csv: string }>;

  listPayouts(
    actor: Actor,
    scope: ResolvedScope,
    query: ListPayoutsQuery,
  ): Promise<ListPayoutsResponse>;

  getPayoutById(
    actor: Actor,
    scope: ResolvedScope,
    payoutId: string,
  ): Promise<PayoutDetailResponse>;
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
    rejectedBy: payout.rejected_by ?? null,
    rejectedAt: payout.rejected_at ? new Date(payout.rejected_at).toISOString() : null,
    rejectionReason: payout.rejection_reason ?? null,
    intimatedAt: payout.intimated_at ? new Date(payout.intimated_at).toISOString() : null,
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

        // Validate farmer exists and is not disabled/blocked (D8)
        const farmerName = await repo.getFarmerName(tx, input.farmerId);
        if (!farmerName) {
          throw new AppError('NOT_FOUND', {
            status: 404,
            detail: `Farmer ${input.farmerId} not found.`,
          });
        }
        if (repo.isFarmerBlockedOrInactive && (await repo.isFarmerBlockedOrInactive(tx, input.farmerId))) {
          throw new AppError('CONFLICT', {
            status: 409,
            detail: `Farmer ${input.farmerId} account is disabled or blocked from payouts.`,
          });
        }

        // Validate amount is positive. Compared as integer paise: Money is never
        // turned into a float (CLAUDE.md 2.2).
        const amountPaise = isMoney(input.amount) ? toPaise(input.amount) : 0;
        if (amountPaise <= 0) {
          throw new AppError('BAD_REQUEST', {
            status: 422,
            detail: 'Payout amount must be a positive number.',
          });
        }

        // BR-31c: the threshold is system_config.payout_dual_approval_threshold,
        // read on every request; the boundary is strictly `>`. A missing or
        // malformed value refuses the payout: guessing a limit here would
        // either block every payout or silently drop the dual control.
        const thresholdPaise = await repo.getDualApprovalThresholdPaise(tx);
        if (thresholdPaise === null) {
          throw new AppError('INTERNAL', {
            status: 500,
            detail: 'system_config.payout_dual_approval_threshold is missing or malformed.',
          });
        }
        requiresDualApproval = amountPaise > thresholdPaise;

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

        // BR-144: validate and settle items/dues
        let itemsToPersist: Array<{ goodsReceiptId: string; amount: string }> = [];

        if (input.items && input.items.length > 0) {
          const uniqueGrIds = new Set(input.items.map((i) => i.goodsReceiptId));
          if (uniqueGrIds.size !== input.items.length) {
            throw new AppError('BAD_REQUEST', {
              status: 422,
              detail: 'Duplicate goods receipt in payout items.',
            });
          }

          let itemsSumPaise = 0;
          for (const item of input.items) {
            const itemPaise = isMoney(item.amount) ? toPaise(item.amount) : 0;
            if (itemPaise <= 0) {
              throw new AppError('BAD_REQUEST', {
                status: 422,
                detail: `Item amount for goods receipt ${item.goodsReceiptId} must be positive.`,
              });
            }
            itemsSumPaise += itemPaise;
          }

          if (itemsSumPaise !== amountPaise) {
            throw new AppError('BAD_REQUEST', {
              status: 422,
              detail: `Payout amount ₹${input.amount} does not match sum of items.`,
            });
          }

          const grIds = input.items.map((i) => i.goodsReceiptId);
          const dues = await repo.getGoodsReceiptsDues(tx, input.farmerId, grIds);
          const dueMap = new Map(dues.map((d) => [d.id, d]));

          for (const item of input.items) {
            const due = dueMap.get(item.goodsReceiptId);
            if (!due) {
              throw new AppError('NOT_FOUND', {
                status: 404,
                detail: `Goods receipt ${item.goodsReceiptId} not found or has no accepted goods for this farmer.`,
              });
            }
            const itemPaise = toPaise(parseMoney(item.amount));
            if (itemPaise > due.remainingDuePaise) {
              throw new AppError('BAD_REQUEST', {
                status: 422,
                detail: `Item amount ₹${item.amount} exceeds remaining due of ₹${(due.remainingDuePaise / 100).toFixed(2)} for goods receipt ${item.goodsReceiptId}.`,
              });
            }
          }

          itemsToPersist = input.items;
        } else if (input.dueIds && input.dueIds.length > 0) {
          const dues = await repo.getGoodsReceiptsDues(tx, input.farmerId, input.dueIds);
          const dueMap = new Map(dues.map((d) => [d.id, d]));
          let unallocatedPaise = amountPaise;

          for (const grId of input.dueIds) {
            const due = dueMap.get(grId);
            if (!due) {
              throw new AppError('NOT_FOUND', {
                status: 404,
                detail: `Goods receipt ${grId} not found or has no accepted goods for this farmer.`,
              });
            }
            if (unallocatedPaise <= 0) break;
            const allocatePaise = Math.min(unallocatedPaise, due.remainingDuePaise);
            if (allocatePaise > 0) {
              itemsToPersist.push({
                goodsReceiptId: grId,
                amount: (allocatePaise / 100).toFixed(2),
              });
              unallocatedPaise -= allocatePaise;
            }
          }

          if (unallocatedPaise > 0) {
            throw new AppError('BAD_REQUEST', {
              status: 422,
              detail: `Payout amount exceeds total remaining dues for the specified dueIds.`,
            });
          }
        }

        const created = await repo.createPayout(tx, {
          farmerId: input.farmerId,
          amount: input.amount,
          mode: input.mode,
          initiatedBy: actor.userId,
          requiresDualApproval,
          ...(input.bankAccountId !== undefined ? { bankAccountId: input.bankAccountId } : {}),
          ...(input.dueIds !== undefined ? { dueIds: input.dueIds } : {}),
          ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
        });
        const payout = created.payout;

        if (itemsToPersist.length > 0) {
          await repo.insertPayoutItems(tx, payout.id, itemsToPersist);
        }

        // At or below the threshold: approve immediately (single-approval path)
        if (!requiresDualApproval) {
          await repo.updatePayoutStatus(tx, {
            payoutId: payout.id,
            status: 'APPROVED',
            releasedBy: actor.userId,
            releasedAt: new Date(),
          });
          payout.status = 'APPROVED';
        } else {
          // Above the threshold → PENDING_APPROVAL, requires second Super Admin
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
    async approvePayout(actor, scope, payoutId, input, idempotencyKey) {
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

        // For dual-approval payouts, approver must have payout.approve_above_10k permission (BR-31)
        if (scope.permission !== 'payout.approve_above_10k') {
          throw new AppError('FORBIDDEN', {
            status: 403,
            detail: 'Approvals for payouts above the dual-approval threshold require payout.approve_above_10k permission (BR-31).',
          });
        }

        const updatedApprovals = await repo.addApproval(tx, {
          payoutId,
          approverId: actor.userId,
          approverRoleCode: scope.roleCode,
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

    // -------------------------------------------------------------------
    // POST /admin/payouts/{id}/reject  (D2 / BR-234)
    // -------------------------------------------------------------------
    async rejectPayout(actor, scope, payoutId, input, idempotencyKey) {
      const key = requireIdempotencyKey(idempotencyKey);

      const outcome = await runTx(async (tx) => {
        const idem = await beginIdempotent<PayoutResponse>(idempotency, tx, {
          actorUserId: actor.userId,
          key,
          operation: 'payout.reject',
          request: { payoutId, reason: input.reason },
        });
        if (idem.replay) return { replayed: true as const, response: idem.response };

        const existing = await repo.findPayoutById(tx, payoutId, true);
        if (!existing) {
          throw new AppError('NOT_FOUND', {
            status: 404,
            detail: `Payout ${payoutId} not found.`,
          });
        }

        const { payout } = existing;
        if (payout.status !== 'PENDING_APPROVAL' && payout.status !== 'REQUESTED') {
          throw new AppError('INVALID_STATE_TRANSITION', {
            status: 409,
            detail: `Payout is in status ${payout.status}; only REQUESTED or PENDING_APPROVAL payouts can be rejected.`,
          });
        }

        const now = new Date();
        await repo.updatePayoutStatus(tx, {
          payoutId,
          status: 'REJECTED',
          rejectedBy: actor.userId,
          rejectedAt: now,
          rejectionReason: input.reason,
        });

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actorRole: scope.roleCode,
          actionCode: 'payout.reject',
          entityType: 'payouts',
          entityId: payoutId,
          before: { status: payout.status },
          after: { status: 'REJECTED', reason: input.reason },
          changedFields: ['status', 'rejectionReason'],
        });

        const final = await repo.findPayoutById(tx, payoutId);
        const result = toResponse(final!.payout, final!.approvals);
        await idem.complete(result);
        return { replayed: false as const, response: result };
      });

      if (!outcome.replayed) {
        const farmerUserId = await repo.getFarmerUserId(db, outcome.response.farmerId);
        if (farmerUserId) {
          await eventBus.publish('payout.rejected', {
            userId: farmerUserId,
            payoutId: outcome.response.id,
            amount: outcome.response.amount,
            reference: outcome.response.payoutNumber,
            reason: input.reason,
          });
        }
      }

      return outcome.response;
    },

    // -------------------------------------------------------------------
    // POST /admin/payouts/{id}/intimate  (D3 / BR-235)
    // -------------------------------------------------------------------
    async intimatePayout(actor, scope, payoutId, input) {
      const outcome = await runTx(async (tx) => {
        const existing = await repo.findPayoutById(tx, payoutId, true);
        if (!existing) {
          throw new AppError('NOT_FOUND', {
            status: 404,
            detail: `Payout ${payoutId} not found.`,
          });
        }

        const { payout } = existing;
        if (payout.status !== 'APPROVED' && payout.status !== 'PROCESSING' && payout.status !== 'PAID') {
          throw new AppError('INVALID_STATE_TRANSITION', {
            status: 409,
            detail: `Payout is in status ${payout.status}; only APPROVED, PROCESSING, or PAID payouts can be intimated.`,
          });
        }

        const now = new Date();
        await repo.updatePayoutStatus(tx, {
          payoutId,
          status: payout.status,
          intimatedAt: now,
          intimatedBy: actor.userId,
        });

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actorRole: scope.roleCode,
          actionCode: 'payout.intimate',
          entityType: 'payouts',
          entityId: payoutId,
          after: {
            status: payout.status,
            note: input.note ?? null,
            intimatedAt: now.toISOString(),
          },
        });

        return {
          payoutId: payout.id,
          payoutNumber: payout.payout_number,
          farmerId: payout.farmer_id,
          amount: payout.amount,
          status: payout.status as PayoutResponse['status'],
          intimatedAt: now.toISOString(),
          intimatedBy: actor.userId,
          note: input.note ?? null,
        };
      });

      const farmerUserId = await repo.getFarmerUserId(db, outcome.farmerId);
      if (farmerUserId) {
        await eventBus.publish('payout.intimated', {
          userId: farmerUserId,
          payoutId: outcome.payoutId,
          amount: outcome.amount,
          reference: outcome.payoutNumber,
          note: outcome.note ?? '',
          intimationId: `${outcome.payoutId}:${outcome.intimatedAt}`,
        });
      }

      return {
        payoutId: outcome.payoutId,
        payoutNumber: outcome.payoutNumber,
        farmerId: outcome.farmerId,
        status: outcome.status,
        intimatedAt: outcome.intimatedAt,
        intimatedBy: outcome.intimatedBy,
        note: outcome.note,
      };
    },

    // -------------------------------------------------------------------
    // POST /admin/payouts/bulk  (D4 / BR-236)
    // -------------------------------------------------------------------
    async createBulkPayouts(actor, scope, input, idempotencyKey) {
      const key = requireIdempotencyKey(idempotencyKey);

      const outcome = await runTx(async (tx) => {
        const idem = await beginIdempotent<BulkCreatePayoutsResponse>(idempotency, tx, {
          actorUserId: actor.userId,
          key,
          operation: 'payout.bulk_create',
          request: input,
        });
        if (idem.replay) return { replayed: true as const, response: idem.response };

        const thresholdPaise = await repo.getDualApprovalThresholdPaise(tx);
        if (thresholdPaise === null) {
          throw new AppError('INTERNAL', {
            status: 500,
            detail: 'system_config.payout_dual_approval_threshold is missing or malformed.',
          });
        }

        const batchId = randomUUID();
        const createdResponses: PayoutResponse[] = [];
        const releasedForEvents: PayoutResponse[] = [];
        const grnRemainingCache = new Map<string, number>();
        let totalPaise = 0;

        for (let idx = 0; idx < input.items.length; idx++) {
          const item = input.items[idx]!;
          const farmerName = await repo.getFarmerName(tx, item.farmerId);
          if (!farmerName) {
            throw new AppError('NOT_FOUND', {
              status: 404,
              detail: `items[${idx}]: Farmer ${item.farmerId} not found.`,
            });
          }
          if (repo.isFarmerBlockedOrInactive && (await repo.isFarmerBlockedOrInactive(tx, item.farmerId))) {
            throw new AppError('CONFLICT', {
              status: 409,
              detail: `items[${idx}]: Farmer ${item.farmerId} account is disabled or blocked.`,
            });
          }

          const amountPaise = isMoney(item.amount) ? toPaise(item.amount) : 0;
          if (amountPaise <= 0) {
            throw new AppError('BAD_REQUEST', {
              status: 422,
              detail: `items[${idx}]: Payout amount must be a positive number.`,
            });
          }

          await repo.lockFarmer(tx, item.farmerId);
          if (item.bankAccountId !== undefined) {
            const owned = await repo.findActiveBankAccountOfFarmer(tx, item.bankAccountId, item.farmerId);
            if (!owned) {
              throw new AppError('NOT_FOUND', {
                status: 404,
                detail: `items[${idx}]: Bank account ${item.bankAccountId} not found.`,
              });
            }
          }

          let itemsToPersist: Array<{ goodsReceiptId: string; amount: string }> = [];
          if (item.items && item.items.length > 0) {
            const uniqueGrIds = new Set(item.items.map((i) => i.goodsReceiptId));
            if (uniqueGrIds.size !== item.items.length) {
              throw new AppError('BAD_REQUEST', {
                status: 422,
                detail: `items[${idx}]: Duplicate goods receipt in payout items.`,
              });
            }
            let itemsSumPaise = 0;
            for (const sub of item.items) {
              const subPaise = isMoney(sub.amount) ? toPaise(sub.amount) : 0;
              if (subPaise <= 0) {
                throw new AppError('BAD_REQUEST', {
                  status: 422,
                  detail: `items[${idx}]: Item amount for goods receipt ${sub.goodsReceiptId} must be positive.`,
                });
              }
              itemsSumPaise += subPaise;
            }
            if (itemsSumPaise !== amountPaise) {
              throw new AppError('BAD_REQUEST', {
                status: 422,
                detail: `items[${idx}]: Payout amount ₹${item.amount} does not match sum of items.`,
              });
            }
            const dues = await repo.getGoodsReceiptsDues(tx, item.farmerId, item.items.map((i) => i.goodsReceiptId));
            const dueMap = new Map(dues.map((d) => [d.id, d]));
            for (const sub of item.items) {
              const due = dueMap.get(sub.goodsReceiptId);
              if (!due) {
                throw new AppError('NOT_FOUND', {
                  status: 404,
                  detail: `items[${idx}]: Goods receipt ${sub.goodsReceiptId} not found for this farmer.`,
                });
              }
              const currentRemaining = grnRemainingCache.get(sub.goodsReceiptId) ?? due.remainingDuePaise;
              const subPaise = toPaise(parseMoney(sub.amount));
              if (subPaise > currentRemaining) {
                throw new AppError('BAD_REQUEST', {
                  status: 422,
                  detail: `items[${idx}]: Item amount ₹${sub.amount} exceeds remaining due for goods receipt ${sub.goodsReceiptId}.`,
                });
              }
              grnRemainingCache.set(sub.goodsReceiptId, currentRemaining - subPaise);
            }
            itemsToPersist = item.items;
          } else if (item.dueIds && item.dueIds.length > 0) {
            const dues = await repo.getGoodsReceiptsDues(tx, item.farmerId, item.dueIds);
            const dueMap = new Map(dues.map((d) => [d.id, d]));
            let unallocatedPaise = amountPaise;
            for (const grId of item.dueIds) {
              const due = dueMap.get(grId);
              if (!due) {
                throw new AppError('NOT_FOUND', {
                  status: 404,
                  detail: `items[${idx}]: Goods receipt ${grId} not found for this farmer.`,
                });
              }
              if (unallocatedPaise <= 0) break;
              const available = grnRemainingCache.get(grId) ?? due.remainingDuePaise;
              const allocatePaise = Math.min(unallocatedPaise, available);
              if (allocatePaise > 0) {
                itemsToPersist.push({
                  goodsReceiptId: grId,
                  amount: `${Math.floor(allocatePaise / 100)}.${String(allocatePaise % 100).padStart(2, '0')}`,
                });
                grnRemainingCache.set(grId, available - allocatePaise);
                unallocatedPaise -= allocatePaise;
              }
            }
            if (unallocatedPaise > 0) {
              throw new AppError('BAD_REQUEST', {
                status: 422,
                detail: `items[${idx}]: Payout amount exceeds total remaining dues for specified dueIds.`,
              });
            }
          }

          const needsDual = amountPaise > thresholdPaise;
          const created = await repo.createPayout(tx, {
            farmerId: item.farmerId,
            amount: item.amount,
            mode: item.mode,
            initiatedBy: actor.userId,
            requiresDualApproval: needsDual,
            ...(item.bankAccountId !== undefined ? { bankAccountId: item.bankAccountId } : {}),
            ...(item.dueIds !== undefined ? { dueIds: item.dueIds } : {}),
            ...(item.remarks !== undefined ? { remarks: item.remarks } : {}),
          });
          const payout = created.payout;
          if (itemsToPersist.length > 0) {
            await repo.insertPayoutItems(tx, payout.id, itemsToPersist);
          }

          const nextStatus = needsDual ? 'PENDING_APPROVAL' : 'APPROVED';
          await repo.updatePayoutStatus(tx, {
            payoutId: payout.id,
            status: nextStatus,
            ...(needsDual ? {} : { releasedBy: actor.userId, releasedAt: new Date() }),
          });

          await writeAuditLog(tx, {
            actorId: actor.userId,
            actorRole: scope.roleCode,
            actionCode: 'payout.farmer.initiate',
            entityType: 'payouts',
            entityId: payout.id,
            after: {
              batchId,
              amount: item.amount,
              farmerId: item.farmerId,
              requiresDualApproval: needsDual,
              status: nextStatus,
            },
          });

          const final = await repo.findPayoutById(tx, payout.id);
          const mapped = toResponse(final!.payout, final!.approvals);
          createdResponses.push(mapped);
          if (!needsDual) releasedForEvents.push(mapped);
          totalPaise += amountPaise;
        }

        const totalAmount = `${Math.floor(totalPaise / 100)}.${String(totalPaise % 100).padStart(2, '0')}`;
        const batchResult: BulkCreatePayoutsResponse = {
          batchId,
          createdCount: createdResponses.length,
          totalAmount,
          items: createdResponses,
        };

        await idem.complete(batchResult);
        return { replayed: false as const, response: batchResult, releasedForEvents };
      });

      if (!outcome.replayed) {
        for (const p of outcome.releasedForEvents) {
          const farmerUserId = await repo.getFarmerUserId(db, p.farmerId);
          if (farmerUserId) {
            await eventBus.publish('payout.released', {
              userId: farmerUserId,
              payoutId: p.id,
              amount: p.amount,
              reference: p.payoutNumber,
            });
          }
        }
      }

      return outcome.response;
    },

    async exportPayouts(_scope, query) {
      const rows = await repo.listPayoutsForExport(pool, query.from, query.to);
      const csvLines = [
        'payout_number,farmer_name,amount,status,created_at',
        ...rows.map((r) => {
          const paise = toPaise(parseMoney(r.amount));
          const formattedAmount = `₹${(paise / 100).toFixed(2)}`;
          const escapedName = r.farmer_name.includes(',') || r.farmer_name.includes('"')
            ? `"${r.farmer_name.replace(/"/g, '""')}"`
            : r.farmer_name;
          return `${r.payout_number},${escapedName},${formattedAmount},${r.status},${r.created_at.toISOString()}`;
        }),
      ];

      const fromLabel = query.from ? query.from.slice(0, 10) : 'all';
      const toLabel = query.to ? query.to.slice(0, 10) : 'all';
      const filename = `payouts_${fromLabel}_${toLabel}.csv`;

      return {
        filename,
        csv: csvLines.join('\n') + '\n',
      };
    },

    async listPayouts(_actor: Actor, _scope: ResolvedScope, query: ListPayoutsQuery): Promise<ListPayoutsResponse> {
      return repo.listPayouts(db, query);
    },

    async getPayoutById(_actor: Actor, _scope: ResolvedScope, payoutId: string): Promise<PayoutDetailResponse> {
      const detail = await repo.getPayoutDetail(db, payoutId);
      if (!detail) {
        throw new AppError('NOT_FOUND', { detail: `Payout ${payoutId} not found.` });
      }
      return detail;
    },
  };
}

// Singleton for production
export const payoutsService = createPayoutsService();

/**
 * BR-246 (GAP 3): Polls PROCESSING payouts against the payment gateway (or mock)
 * and transitions settled rows to PAID or failed rows to FAILED with audit_log.
 */
export async function pollProcessingPayouts(
  batchSize = 50,
  checkGateway: (gatewayPayoutId: string | null) => Promise<'SETTLED' | 'FAILED' | 'PENDING'> = async (
    gatewayPayoutId,
  ) => (gatewayPayoutId ? 'SETTLED' : 'PENDING'),
): Promise<{ scanned: number; settled: number; failed: number }> {
  const res = await pool.query<{
    id: string;
    payout_number: string;
    gateway_payout_id: string | null;
  }>(
    `SELECT id, payout_number, gateway_payout_id
       FROM payouts
      WHERE status = 'PROCESSING'
      ORDER BY updated_at ASC
      LIMIT $1`,
    [batchSize],
  );

  let settled = 0;
  let failed = 0;
  for (const row of res.rows) {
    const outcome = await checkGateway(row.gateway_payout_id);
    if (outcome === 'PENDING') continue;

    await withTransaction(async (tx) => {
      if (outcome === 'SETTLED') {
        const upd = await tx.query(
          `UPDATE payouts SET status = 'PAID', paid_at = now(), updated_at = now()
            WHERE id = $1 AND status = 'PROCESSING'`,
          [row.id],
        );
        if (upd.rowCount === 1) {
          settled += 1;
          await writeAuditLog(tx, {
            actorId: null,
            actorType: 'JOB',
            actionCode: 'payout.settlement_poll',
            entityType: 'payout',
            entityId: row.id,
            before: { status: 'PROCESSING' },
            after: { status: 'PAID' },
            changedFields: ['status', 'paidAt'],
          });
        }
      } else {
        const upd = await tx.query(
          `UPDATE payouts SET status = 'FAILED', failure_reason = 'Gateway settlement failed', updated_at = now()
            WHERE id = $1 AND status = 'PROCESSING'`,
          [row.id],
        );
        if (upd.rowCount === 1) {
          failed += 1;
          await writeAuditLog(tx, {
            actorId: null,
            actorType: 'JOB',
            actionCode: 'payout.settlement_poll',
            entityType: 'payout',
            entityId: row.id,
            before: { status: 'PROCESSING' },
            after: { status: 'FAILED' },
            changedFields: ['status', 'failureReason'],
          });
        }
      }
    });
  }

  return { scanned: res.rows.length, settled, failed };
}
