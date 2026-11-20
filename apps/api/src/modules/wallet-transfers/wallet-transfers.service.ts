/**
 * Customer-to-customer wallet transfers ("Send money", BR-150).
 *
 * ON since migration 0150 (product-owner decision). system_config `wallet_transfer.enabled` is kept
 * as an ops kill switch; every entry point checks it and fails closed when it is not `true`.
 *
 * Money moves only through the ledger: one TRANSFER_OUT debit on the sender and one TRANSFER_IN
 * credit on the recipient, inserted by walletService.move in ONE transaction with the transfer
 * record and its audit_log row; the balance triggers (0007) do the rest and reject an overdraft
 * (WALLET_INSUFFICIENT). The Idempotency-Key is claimed first in that transaction, so a replay
 * returns the stored response and moves nothing; a failed attempt rolls the claim back.
 *
 * Both wallets are row-locked (id order) before the caps are read, so concurrent sends from one
 * wallet are serialised: they can neither overdraw nor both slip under a daily/monthly cap.
 */
import {
  add,
  greaterThan,
  isMoney,
  lessThan,
  parseMoney,
  type Money,
} from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import { writeAuditLog, type AuditEntry } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { eventBus, type EventBus } from '../../events/bus.js';
import { AppError } from '../../http/problem.js';
import {
  beginIdempotent,
  idempotencyStore,
  requireIdempotencyKey,
  type IdempotencyStore,
} from '../../http/idempotency.js';
import { logger } from '../../logger.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { maskMobile } from '../sales/sales.math.js';
import { walletRepo, type WalletRepo } from '../wallet/wallet.repo.js';
import { walletService, type WalletService } from '../wallet/wallet.service.js';
import { walletTransfersRepo, type WalletTransfersRepo } from './wallet-transfers.repo.js';
import type {
  AdminListTransfersQuery,
  AdminListTransfersResponse,
  CreateTransferBody,
  CreateTransferResponse,
  ListTransfersQuery,
  ListTransfersResponse,
  TransferRecipient,
} from './wallet-transfers.schema.js';

const OPERATION = 'wallet.transfer.send';
const CURSOR_TAG = 'wtr';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MICRO_TS_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;
/** Every recipient lookup takes at least this long, found or not (BR-150g timing). */
const DEFAULT_LOOKUP_FLOOR_MS = 150;
/** Same body for every "no eligible recipient" outcome: unknown, disabled, deleted or frozen. */
const RECIPIENT_NOT_FOUND_DETAIL = 'No customer account uses this mobile number.';

/** "Ravi Kumar" -> "R*** K***": enough to confirm a recipient, not enough to identify a stranger. */
export function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '***';
  return parts.map((p) => `${p.charAt(0).toUpperCase()}***`).join(' ');
}

interface TransferConfig {
  minAmount: Money;
  maxPerTxn: Money;
  maxDaily: Money;
  maxMonthly: Money;
  maxDailyCount: number;
}

function configMoney(key: string, v: unknown): Money {
  if (typeof v === 'string' && isMoney(v) && greaterThan(parseMoney(v), parseMoney('0'))) return parseMoney(v);
  throw new AppError('INTERNAL', { detail: `system_config.${key} is missing or is not a positive money value (BR-150).` });
}

function configCount(key: string, v: unknown): number {
  if (typeof v === 'number' && Number.isInteger(v) && v > 0) return v;
  throw new AppError('INTERNAL', { detail: `system_config.${key} is missing or is not a positive integer (BR-150).` });
}

export interface WalletTransfersService {
  lookup(actor: Actor, mobile: string): Promise<TransferRecipient>;
  send(actor: Actor, scope: ResolvedScope, body: CreateTransferBody, idempotencyKey: string | undefined): Promise<CreateTransferResponse>;
  list(actor: Actor, query: ListTransfersQuery): Promise<ListTransfersResponse>;
  adminList(query: AdminListTransfersQuery): Promise<AdminListTransfersResponse>;
}

export function createWalletTransfersService(
  deps: {
    repo?: WalletTransfersRepo;
    wallets?: WalletRepo;
    walletSvc?: WalletService;
    idempotency?: IdempotencyStore;
    db?: Executor;
    runTx?: <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;
    bus?: Pick<EventBus, 'publish'>;
    audit?: (tx: Executor, entry: AuditEntry) => Promise<unknown>;
    lookupFloorMs?: number;
  } = {},
): WalletTransfersService {
  const repo = deps.repo ?? walletTransfersRepo;
  const wallets = deps.wallets ?? walletRepo;
  const walletSvc = deps.walletSvc ?? walletService;
  const idempotency = deps.idempotency ?? idempotencyStore;
  const db = deps.db ?? pool;
  const runTx = deps.runTx ?? withTransaction;
  const bus = deps.bus ?? eventBus;
  const audit = deps.audit ?? writeAuditLog;
  const lookupFloorMs = deps.lookupFloorMs ?? DEFAULT_LOOKUP_FLOOR_MS;

  /** Feature flag first (BR-150a), then the limits; anything malformed fails closed. */
  async function loadEnabledConfig(ex: Executor): Promise<TransferConfig> {
    const raw = await repo.getConfig(ex);
    if (raw.enabled !== true) {
      throw new AppError('WALLET_TRANSFER_DISABLED', { detail: 'Sending money to another customer is not available.' });
    }
    const cfg = {
      minAmount: configMoney('wallet_transfer.min_amount', raw.minAmount),
      maxPerTxn: configMoney('wallet_transfer.max_per_txn', raw.maxPerTxn),
      maxDaily: configMoney('wallet_transfer.max_daily', raw.maxDaily),
      maxMonthly: configMoney('wallet_transfer.max_per_month', raw.maxMonthly),
      maxDailyCount: configCount('wallet_transfer.max_daily_count', raw.maxDailyCount),
    };
    if (greaterThan(cfg.minAmount, cfg.maxPerTxn)) {
      throw new AppError('INTERNAL', { detail: 'system_config wallet_transfer.min_amount exceeds max_per_txn (BR-150).' });
    }
    return cfg;
  }

  function requireCustomer(actor: Actor): string {
    if (actor.customerId === null) {
      throw new AppError('FORBIDDEN', { detail: 'Only a customer account can send wallet money.' });
    }
    return actor.customerId;
  }

  /**
   * BR-150j: the sender must be an ACTIVE (OTP-verified: PENDING becomes ACTIVE only on a verified
   * mobile OTP), non-deleted customer whose wallet, if it has one, is ACTIVE.
   */
  async function assertSenderEligible(ex: Executor, customerId: string): Promise<void> {
    const me = await repo.findEligibility(ex, customerId);
    const ok = me !== null && me.user_status === 'ACTIVE' && !me.user_deleted && !me.customer_deleted
      && (me.wallet_status === null || me.wallet_status === 'ACTIVE');
    if (!ok) {
      throw new AppError('FORBIDDEN', {
        detail: 'Your account must be active with a verified mobile number and an active wallet to send money.',
      });
    }
  }

  async function resolveRecipient(ex: Executor, senderCustomerId: string, mobile: string) {
    const recipient = await repo.findCustomerByMobile(ex, mobile);
    if (recipient === null) {
      throw new AppError('NOT_FOUND', { detail: RECIPIENT_NOT_FOUND_DETAIL });
    }
    if (recipient.customer_id === senderCustomerId) {
      throw new AppError('WALLET_TRANSFER_SELF', { detail: 'You cannot send money to your own wallet.' });
    }
    return recipient;
  }

  async function walletFor(ex: Executor, customerId: string) {
    return (await wallets.findWalletByOwner(ex, 'CUSTOMER', customerId)) ?? (await wallets.createWallet(ex, 'CUSTOMER', customerId));
  }

  async function publishSafely(name: 'wallet.credited' | 'wallet.debited', payload: { userId: string; amount: string; balance: string; reference: string }) {
    try {
      await bus.publish(name, payload);
    } catch (err) {
      logger.warn({ err, name, reference: payload.reference }, 'wallet transfer event not published (transfer unaffected)');
    }
  }

  return {
    async lookup(actor, mobile) {
      const me = requireCustomer(actor);
      const started = Date.now();
      try {
        await loadEnabledConfig(db);
        await assertSenderEligible(db, me);
        const r = await resolveRecipient(db, me, mobile);
        return { displayName: maskName(r.full_name), mobileMasked: maskMobile(r.mobile) };
      } finally {
        // Pad found and not-found alike so response time does not tell them apart.
        const wait = lookupFloorMs - (Date.now() - started);
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      }
    },

    async send(actor, scope, body, idempotencyKey) {
      const key = requireIdempotencyKey(idempotencyKey);
      const me = requireCustomer(actor);
      if (!isMoney(body.amount)) {
        throw new AppError('VALIDATION_FAILED', { detail: 'amount must be a money string.', errors: { 'body.amount': ['Invalid money value.'] } });
      }
      const amount = parseMoney(body.amount);
      const note = body.note ?? null;

      const outcome = await runTx(async (tx) => {
        const idem = await beginIdempotent<CreateTransferResponse>(idempotency, tx, {
          actorUserId: actor.userId,
          key,
          operation: OPERATION,
          request: { recipientMobile: body.recipientMobile, amount, note },
        });
        if (idem.replay) return { replayed: true as const, response: idem.response };

        const cfg = await loadEnabledConfig(tx);
        if (lessThan(amount, cfg.minAmount)) {
          throw new AppError('WALLET_TRANSFER_LIMIT_EXCEEDED', { detail: `The minimum transfer is INR ${cfg.minAmount}.` });
        }
        if (greaterThan(amount, cfg.maxPerTxn)) {
          throw new AppError('WALLET_TRANSFER_LIMIT_EXCEEDED', { detail: `The maximum per transfer is INR ${cfg.maxPerTxn}.` });
        }

        await assertSenderEligible(tx, me);
        const recipient = await resolveRecipient(tx, me, body.recipientMobile);
        const senderWallet = await walletFor(tx, me);
        const recipientWallet = await walletFor(tx, recipient.customer_id);
        // Serialises concurrent transfers touching either wallet, so the caps below cannot be
        // raced, the overdraft check sees committed balances, and opposite transfers lock in order.
        await repo.lockWallets(tx, [senderWallet.id, recipientWallet.id]);

        const stats = await repo.sentStats(tx, me);
        if (stats.day_count + 1 > cfg.maxDailyCount) {
          throw new AppError('WALLET_TRANSFER_LIMIT_EXCEEDED', {
            detail: `You can make at most ${cfg.maxDailyCount} transfers per day.`,
          });
        }
        if (greaterThan(add(parseMoney(stats.day_total), amount), cfg.maxDaily)) {
          throw new AppError('WALLET_TRANSFER_LIMIT_EXCEEDED', {
            detail: `This transfer would exceed the daily limit of INR ${cfg.maxDaily}.`,
          });
        }
        if (greaterThan(add(parseMoney(stats.month_total), amount), cfg.maxMonthly)) {
          throw new AppError('WALLET_TRANSFER_LIMIT_EXCEEDED', {
            detail: `This transfer would exceed the monthly limit of INR ${cfg.maxMonthly}.`,
          });
        }

        const transferId = await repo.newId(tx);
        const debit = await walletSvc.move(scope, {
          walletId: senderWallet.id,
          idempotencyKey: `wallet_transfer:${transferId}:out`,
          direction: 'DEBIT',
          type: 'TRANSFER_OUT',
          amount,
          refType: 'WALLET_TRANSFER',
          refId: transferId,
          remarks: note,
          createdBy: actor.userId,
        }, tx);
        const credit = await walletSvc.move(scope, {
          walletId: recipientWallet.id,
          idempotencyKey: `wallet_transfer:${transferId}:in`,
          direction: 'CREDIT',
          type: 'TRANSFER_IN',
          amount,
          refType: 'WALLET_TRANSFER',
          refId: transferId,
          remarks: note,
          createdBy: actor.userId,
        }, tx);

        const row = await repo.insertTransfer(tx, {
          id: transferId,
          senderCustomerId: me,
          recipientCustomerId: recipient.customer_id,
          senderWalletId: senderWallet.id,
          recipientWalletId: recipientWallet.id,
          amount,
          note,
          debitTxnId: debit.id,
          creditTxnId: credit.id,
          createdBy: actor.userId,
        });

        // BR-150m: same transaction, so a rolled-back transfer leaves no audit trail.
        await audit(tx, {
          actorId: actor.userId,
          actorRole: 'CUSTOMER',
          actionCode: OPERATION,
          entityType: 'wallet_transfer',
          entityId: transferId,
          after: {
            senderCustomerId: me,
            recipientCustomerId: recipient.customer_id,
            amount,
            note,
            debitTxnId: debit.id,
            creditTxnId: credit.id,
          },
        });

        const response: CreateTransferResponse = {
          id: transferId,
          direction: 'SENT',
          amount,
          counterparty: { displayName: maskName(recipient.full_name), mobileMasked: maskMobile(recipient.mobile) },
          note,
          status: 'COMPLETED',
          createdAt: row.created_at.toISOString(),
          balanceAfter: debit.balanceAfter,
        };
        await idem.complete(response);
        return {
          replayed: false as const,
          response,
          credited: { userId: recipient.user_id, amount, balance: credit.balanceAfter, reference: transferId },
          debited: { userId: actor.userId, amount, balance: debit.balanceAfter, reference: transferId },
        };
      });

      // After commit, never on a replay. Delivery is best-effort and never fails the transfer.
      if (!outcome.replayed) {
        await publishSafely('wallet.credited', outcome.credited);
        await publishSafely('wallet.debited', outcome.debited);
      }
      return outcome.response;
    },

    async list(actor, query) {
      if (actor.customerId === null) return { items: [], page: { nextCursor: null, hasMore: false } };
      const after = cursorFrom(query.cursor);
      const rows = await repo.listForCustomer(db, actor.customerId, after, query.limit);
      const hasMore = rows.length > query.limit;
      const page = hasMore ? rows.slice(0, query.limit) : rows;
      const last = page[page.length - 1];
      return {
        items: page.map((r) => ({
          id: r.id,
          direction: r.sender_customer_id === actor.customerId ? ('SENT' as const) : ('RECEIVED' as const),
          amount: parseMoney(r.amount),
          counterparty: { displayName: maskName(r.counterparty_name), mobileMasked: maskMobile(r.counterparty_mobile) },
          note: r.note,
          status: 'COMPLETED' as const,
          createdAt: r.created_at.toISOString(),
        })),
        page: {
          nextCursor: hasMore && last !== undefined ? encodeCursor({ ts: last.cursor_ts, id: last.id }) : null,
          hasMore,
        },
      };
    },

    async adminList(query) {
      if (query.from !== undefined && query.to !== undefined && query.from > query.to) {
        throw new AppError('VALIDATION_FAILED', { detail: 'from must not be after to.', errors: { 'query.from': ['from is after to.'] } });
      }
      if (query.minAmount !== undefined && query.maxAmount !== undefined
        && greaterThan(parseMoney(query.minAmount), parseMoney(query.maxAmount))) {
        throw new AppError('VALIDATION_FAILED', { detail: 'minAmount must not exceed maxAmount.', errors: { 'query.minAmount': ['minAmount exceeds maxAmount.'] } });
      }
      const after = cursorFrom(query.cursor);
      const rows = await repo.listAdmin(db, {
        customerId: query.customerId,
        from: query.from,
        to: query.to,
        minAmount: query.minAmount,
        maxAmount: query.maxAmount,
      }, after, query.limit);
      const hasMore = rows.length > query.limit;
      const page = hasMore ? rows.slice(0, query.limit) : rows;
      const last = page[page.length - 1];
      return {
        items: page.map((r) => ({
          id: r.id,
          amount: parseMoney(r.amount),
          note: r.note,
          status: 'COMPLETED' as const,
          createdAt: r.created_at.toISOString(),
          sender: { customerId: r.sender_customer_id, fullName: r.sender_name, mobile: r.sender_mobile },
          recipient: { customerId: r.recipient_customer_id, fullName: r.recipient_name, mobile: r.recipient_mobile },
          debitTxnId: r.debit_txn_id,
          creditTxnId: r.credit_txn_id,
        })),
        page: {
          nextCursor: hasMore && last !== undefined ? encodeCursor({ ts: last.cursor_ts, id: last.id }) : null,
          hasMore,
        },
      };
    },
  };
}

function cursorFrom(raw: string | undefined): { ts: string; id: string } | undefined {
  if (raw === undefined || raw.length === 0) return undefined;
  const after = decodeCursor(raw);
  if (after === null) {
    throw new AppError('VALIDATION_FAILED', {
      detail: 'cursor is not a value returned by this endpoint.',
      errors: { 'query.cursor': ['Invalid cursor.'] },
    });
  }
  return after;
}

export function encodeCursor(k: { ts: string; id: string }): string {
  return Buffer.from(JSON.stringify([CURSOR_TAG, k.ts, k.id]), 'utf8').toString('base64url');
}

export function decodeCursor(raw: string): { ts: string; id: string } | null {
  try {
    const p: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (Array.isArray(p) && p.length === 3 && p[0] === CURSOR_TAG && typeof p[1] === 'string' && typeof p[2] === 'string'
      && MICRO_TS_RE.test(p[1]) && UUID_RE.test(p[2])) {
      return { ts: p[1], id: p[2] };
    }
  } catch {
    // fall through
  }
  return null;
}

export const walletTransfersService: WalletTransfersService = createWalletTransfersService();
