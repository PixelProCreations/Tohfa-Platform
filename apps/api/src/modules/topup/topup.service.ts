import { fromPaise, parseMoney, toPaise, RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { config } from '../../config.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import {
  beginIdempotent,
  idempotencyStore,
  requireIdempotencyKey,
  type IdempotencyStore,
} from '../../http/idempotency.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { paymentGateway, type PaymentGateway } from '../../payments/index.js';
import { walletService, type WalletService } from '../wallet/wallet.service.js';
import {
  topupRepo,
  type TopupRecord,
  type TopupRepo,
  type TopupWithPayment,
} from './topup.repo.js';
import type {
  CashTopupCreateInput,
  CashTopupCustomerLookupQuery,
  CashTopupCustomerLookupResponse,
  CreateTopupInput,
  TopupIntentResponse,
  WebhookResponse,
} from './topup.schema.js';
import { maskMobile } from '../sales/sales.math.js';
import type { WalletTransactionResponse } from '../wallet/wallet.schema.js';

export interface TopupService {
  createTopup(
    actor: Actor,
    scope: ResolvedScope,
    input: CreateTopupInput,
    idempotencyKey?: string,
  ): Promise<TopupIntentResponse>;

  processCashTopup(
    actor: Actor,
    scope: ResolvedScope,
    customerId: string,
    input: CashTopupCreateInput,
    idempotencyKey?: string,
  ): Promise<WalletTransactionResponse>;

  processRazorpayWebhook(
    rawBody: Buffer | string,
    signature: string | undefined,
    eventId: string | undefined,
  ): Promise<WebhookResponse>;

  reconcilePendingTopups(olderThanMinutes?: number): Promise<{ reconciledCount: number }>;

  /**
   * BR-91i: find the customer standing at the counter for a cash top-up, by exact mobile or code.
   *
   * WHY no BR-91 visibility predicate here: BR-91 makes a customer visible to a Sub admin once
   * they have a SUCCESS top-up at the warehouse. Gating THIS lookup on that predicate meant a
   * customer's first top-up at a warehouse could never be started, because the action that grants
   * visibility was blocked by the visibility check. The exposure stays narrow: exact match only
   * (no browsing), the mobile is masked, and the shape is the sales counter's allow-list.
   * Customer list/detail and the sales counter lookup keep BR-91 unchanged.
   */
  lookupCashTopupCustomers(scope: ResolvedScope, query: CashTopupCustomerLookupQuery): Promise<CashTopupCustomerLookupResponse>;
}

const systemScope: ResolvedScope = {
  level: ScopeLevel.ALL,
  permission: 'wallet.topup.digital',
  roleCode: RoleCode.SUPER_ADMIN,
  warehouseIds: [],
  zoneIds: [],
  userId: '00000000-0000-0000-0000-000000000000',
};

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

/** The `operation` recorded on an idempotency_keys claim for a cash top-up (BR-18d). */
const CASH_TOPUP_OPERATION = 'wallet.cash_topup.process';

export function createTopupService(opts: {
  repo?: TopupRepo;
  gateway?: PaymentGateway;
  walletSvc?: WalletService;
  db?: Executor;
  runTx?: TransactionRunner;
  idempotency?: IdempotencyStore;
} = {}): TopupService {
  const repo = opts.repo ?? topupRepo;
  const gateway = opts.gateway ?? paymentGateway;
  const walletSvc = opts.walletSvc ?? walletService;
  const db = opts.db ?? pool;
  const runTx: TransactionRunner = opts.runTx ?? ((fn) => withTransaction(fn));
  const idempotency = opts.idempotency ?? idempotencyStore;

  return {
    async createTopup(actor, _scope, input, idempotencyKey) {
      if (!actor.customerId && !actor.roles.some((r) => r.code === RoleCode.CUSTOMER)) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Only customer accounts can initiate digital top-ups.',
        });
      }

      const wallet = await walletSvc.getWalletForActor(actor);
      const amountPaise = toPaise(input.amount);
      if (amountPaise <= 0) {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: 'Top-up amount must be positive.',
        });
      }

      const receipt = `topup_${wallet.id.slice(0, 8)}_${Date.now()}`;
      const gatewayOrder = await gateway.createOrder({
        amountPaise,
        currency: 'INR',
        receipt,
        notes: {
          walletId: wallet.id,
          customerId: actor.customerId ?? '',
          ...(idempotencyKey ? { idempotencyKey } : {}),
        },
      });

      const { topup } = await repo.createTopupIntent(db, {
        walletId: wallet.id,
        customerId: actor.customerId,
        channel: input.mode,
        amount: input.amount,
        gatewayOrderId: gatewayOrder.gatewayOrderId,
      });

      const presetAmounts = await repo.getPresetAmounts(db);

      const razorpayKeyId =
        gateway.provider === 'razorpay'
          ? config.RAZORPAY_KEY_ID
          : 'rzp_test_mock_publishable_key';

      return {
        topupId: topup.id,
        gateway: 'RAZORPAY',
        gatewayOrderId: gatewayOrder.gatewayOrderId,
        amount: input.amount,
        currency: 'INR',
        status: 'PENDING',
        razorpayKeyId,
        presetAmounts,
      };
    },

    async processCashTopup(actor, scope, customerId, input, idempotencyKey) {
      // docs/openapi.yaml IdempotencyKeyHeader is `required: true` on this money-moving POST
      // (CLAUDE.md 2.4); without a key a retry cannot be told from a second top-up.
      const key = requireIdempotencyKey(idempotencyKey);
      if (!input.fiscalCashTag || input.fiscalCashTag.trim().length === 0) {
        throw new AppError('FISCAL_TAG_REQUIRED', {
          status: 422,
          detail: 'Fiscal cash tag is mandatory for cash top-up.',
        });
      }

      if (scope.warehouseIds && scope.warehouseIds.length > 0 && !scope.warehouseIds.includes(input.warehouseId)) {
        throw new AppError('WAREHOUSE_SCOPE_VIOLATION', {
          status: 403,
          detail: 'Actor cannot process cash top-ups for other warehouses.',
        });
      }

      const cap = await repo.getCashTopupCap(db);
      if (Number(input.amount) > Number(cap)) {
        throw new AppError('CASH_LIMIT_EXCEEDED', {
          status: 422,
          detail: `Cash top-up is capped at INR ${cap} per transaction.`,
        });
      }

      const wallet = await repo.findCustomerWallet(db, customerId);
      if (!wallet) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: 'Customer wallet not found.',
        });
      }

      const outcome = await runTx(async (tx) => {
        // BR-18d: claim the Idempotency-Key BEFORE inserting the top-up. The insert used to run
        // first, so a replay collided on uq_topups_fiscal_cash_tag and the client got 409
        // CONFLICT for a top-up that had in fact succeeded. Now a replay (same key, same body)
        // returns the stored original response and writes nothing; the same key with a different
        // body is 409 IDEMPOTENCY_KEY_REUSED. The claim shares this transaction, so a top-up that
        // fails leaves the key unclaimed (http/idempotency.ts).
        const idem = await beginIdempotent<WalletTransactionResponse>(idempotency, tx, {
          actorUserId: actor.userId,
          key,
          operation: CASH_TOPUP_OPERATION,
          request: { customerId, body: input },
        });
        if (idem.replay) return { replayed: true as const, walletTxn: idem.response };

        let createdTopup: TopupRecord;
        try {
          createdTopup = await repo.createCashTopup(tx, {
            walletId: wallet.id,
            customerId,
            warehouseId: input.warehouseId,
            processedBy: actor.userId,
            amount: input.amount,
            fiscalCashTag: input.fiscalCashTag,
          });
        } catch (err: unknown) {
          const pgErr = err as { code?: string };
          if (pgErr.code === '23505') {
            throw new AppError('CONFLICT', {
              status: 409,
              detail: `Fiscal cash tag ${input.fiscalCashTag} has already been used.`,
            });
          }
          if (pgErr.code === '23514') {
            throw new AppError('CASH_LIMIT_EXCEEDED', {
              status: 422,
              detail: 'Cash top-up amount exceeds allowable ceiling.',
            });
          }
          throw err;
        }

        const txn = await walletSvc.move(
          scope,
          {
            walletId: wallet.id,
            direction: 'CREDIT',
            type: 'TOPUP_CASH',
            amount: input.amount,
            refType: 'TOPUP',
            refId: createdTopup.id,
            // Scoped to the acting user like the claim, so two admins' keys cannot collide on the
            // ledger's UNIQUE idempotency_key (same shape as sales.service.ts `sale:<user>:<key>`).
            idempotencyKey: `cash_topup:${actor.userId}:${key}`,
            remarks: input.remarks ?? `Cash Top-up via tag ${input.fiscalCashTag}`,
            createdBy: actor.userId,
          },
          tx,
        );

        await repo.updateTopupWalletTxn(tx, createdTopup.id, txn.id);

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actorRole: scope.roleCode,
          actionCode: 'wallet.cash_topup.process',
          entityType: 'topup',
          entityId: createdTopup.id,
          warehouseId: input.warehouseId,
          after: {
            status: 'SUCCESS',
            channel: 'CASH',
            amount: input.amount,
            fiscalCashTag: input.fiscalCashTag,
            warehouseId: input.warehouseId,
            walletTxnId: txn.id,
          },
        });

        await idem.complete(txn);
        return { replayed: false as const, topupId: createdTopup.id, walletTxn: txn };
      });

      if (outcome.replayed) return outcome.walletTxn;

      // BR-18c: SMS dispatch outcome outside credit transaction (never re-sent on a replay)
      try {
        await repo.updateTopupSmsStatus(db, outcome.topupId, { sentAt: new Date() });
      } catch (smsErr: unknown) {
        const errorMsg = smsErr instanceof Error ? smsErr.message : 'SMS dispatch error';
        await repo.updateTopupSmsStatus(db, outcome.topupId, { error: errorMsg });
      }

      return outcome.walletTxn;
    },

    async processRazorpayWebhook(rawBody, signature, _eventId) {
      if (!signature) {
        throw new AppError('UNAUTHENTICATED', {
          status: 401,
          detail: 'Missing X-Razorpay-Signature header.',
        });
      }

      const secret = config.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret';
      const isValid = gateway.verifyWebhookSignature(rawBody, signature, secret);

      if (!isValid) {
        throw new AppError('UNAUTHENTICATED', {
          status: 401,
          detail: 'Invalid or forged webhook signature.',
        });
      }

      const event = gateway.parseEvent(rawBody);

      if (event.event === 'payment.captured' && event.payment) {
        const payment = event.payment;
        const gatewayOrderId = payment.orderId;

        if (!gatewayOrderId) {
          return { received: true };
        }

        let topup: TopupWithPayment | null = null;
        if (gatewayOrderId) {
          topup = await repo.findTopupByGatewayOrderId(db, gatewayOrderId);
        }

        if (!topup) {
          return { received: true };
        }

        // Duplicate delivery check: already succeeded or payment captured
        if (topup.status === 'SUCCESS' || topup.gateway_payment_id === payment.paymentId) {
          return { received: true, duplicate: true };
        }

        const creditAmount = parseMoney(fromPaise(payment.amountPaise));
        const idempotencyKey = `rzp_pay_${payment.paymentId}`;

        await withTransaction(async (tx) => {
          // Double check within transaction
          const existingPayment = await repo.findPaymentByGatewayPaymentId(tx, payment.paymentId);
          if (existingPayment && existingPayment.status === 'CAPTURED') {
            return;
          }

          // Credit wallet
          const walletTxn = await walletSvc.move(
            systemScope,
            {
              walletId: topup!.wallet_id,
              direction: 'CREDIT',
              type: 'TOPUP_DIGITAL',
              amount: creditAmount,
              refType: 'TOPUP',
              refId: topup!.id,
              idempotencyKey,
              remarks: `Digital Top-up via Razorpay ${payment.paymentId}`,
              createdBy: null,
            },
            tx,
          );

          await repo.markTopupSuccess(tx, {
            topupId: topup!.id,
            paymentId: topup!.payment_id!,
            gatewayPaymentId: payment.paymentId,
            walletTxnId: walletTxn.id,
            capturedAt: new Date(event.createdAt * 1000),
            rawPayload: event.rawPayload,
          });

          await writeAuditLog(tx, {
            actorId: null,
            actorType: 'SYSTEM',
            actorRole: 'SYSTEM_BOT',
            actionCode: 'wallet.topup.digital',
            entityType: 'topup',
            entityId: topup!.id,
            after: {
              status: 'SUCCESS',
              gatewayPaymentId: payment.paymentId,
              amount: creditAmount,
            },
            changedFields: ['status', 'gateway_payment_id', 'wallet_txn_id'],
          });
        });

        return { received: true, duplicate: false };
      }

      if (event.event === 'payment.failed' && event.payment?.orderId) {
        const topup = await repo.findTopupByGatewayOrderId(db, event.payment.orderId);
        if (topup && topup.status === 'PENDING') {
          await repo.markTopupFailed(db, {
            topupId: topup.id,
            paymentId: topup.payment_id!,
            rawPayload: event.rawPayload,
          });
        }
        return { received: true };
      }

      return { received: true };
    },

    async reconcilePendingTopups(olderThanMinutes = 15) {
      const pendingTopups = await repo.findPendingTopupsOlderThan(db, olderThanMinutes);
      let reconciledCount = 0;

      for (const topup of pendingTopups) {
        if (!topup.gateway_order_id) continue;

        // If gateway supports fetchPayment and payment is captured
        if (gateway.fetchPayment && topup.gateway_payment_id) {
          const payment = await gateway.fetchPayment(topup.gateway_payment_id);
          if (payment && payment.status === 'captured') {
            const creditAmount = parseMoney(fromPaise(payment.amountPaise));
            const idempotencyKey = `rzp_pay_${payment.paymentId}`;

            await withTransaction(async (tx) => {
              const walletTxn = await walletSvc.move(
                systemScope,
                {
                  walletId: topup.wallet_id,
                  direction: 'CREDIT',
                  type: 'TOPUP_DIGITAL',
                  amount: creditAmount,
                  refType: 'TOPUP',
                  refId: topup.id,
                  idempotencyKey,
                  remarks: `Reconciled Top-up ${payment.paymentId}`,
                  createdBy: null,
                },
                tx,
              );

              await repo.markTopupSuccess(tx, {
                topupId: topup.id,
                paymentId: topup.payment_id!,
                gatewayPaymentId: payment.paymentId,
                walletTxnId: walletTxn.id,
              });
            });
            reconciledCount++;
          }
        }
      }

      return { reconciledCount };
    },

    async lookupCashTopupCustomers(_scope, query) {
      // The scope is deliberately unused for filtering (BR-91i, see the interface comment); the
      // route's wallet.cash_topup.process gate is what decides who may ask.
      const rows = await repo.lookupCashTopupCustomers(
        db,
        query.mobile !== undefined
          ? { kind: 'mobile', digits: query.mobile.replace(/[^0-9]/g, '') }
          : { kind: 'code', code: (query.code ?? '').trim() },
      );
      return {
        // BR-92g: always masked, for every scope; the caller already typed the number.
        items: rows.map((row) => ({
          customerId: row.customerId,
          customerCode: row.customerCode,
          name: row.name,
          mobileMasked: maskMobile(row.mobile),
          walletBalance: row.walletBalance,
        })),
      };
    },
  };
}

export const topupService = createTopupService();
