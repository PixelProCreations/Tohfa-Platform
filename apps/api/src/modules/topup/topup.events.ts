/**
 * `wallet.credited` (BR-163): published after a top-up credit COMMITS, best-effort.
 * The ledger row is the truth; a lost notification must never undo or fail it.
 */
import type { Executor } from '../../db/pool.js';
import { eventBus as defaultBus, type EventBus } from '../../events/bus.js';
import { logger } from '../../logger.js';

export interface WalletCredit {
  walletId: string;
  amount: string;
  balanceAfter: string;
  /** Human-facing and unique per credit (notification dedupe key): fiscal tag or gateway payment id. */
  reference: string;
}

/** The login user who owns a wallet (customer or farmer). */
export async function findWalletOwnerUser(db: Executor, walletId: string): Promise<string | null> {
  const res = await db.query<{ userId: string }>(
    `SELECT COALESCE(c.user_id, f.user_id) AS "userId"
       FROM wallets w
  LEFT JOIN customers c ON c.id = w.customer_id
  LEFT JOIN farmers f   ON f.id = w.farmer_id
      WHERE w.id = $1`,
    [walletId],
  );
  return res.rows[0]?.userId ?? null;
}

export type WalletCreditedPublisher = (credit: WalletCredit) => Promise<void>;

export function createWalletCreditedPublisher(opts: {
  db: Executor;
  bus?: EventBus;
  lookup?: (db: Executor, walletId: string) => Promise<string | null>;
}): WalletCreditedPublisher {
  const bus = opts.bus ?? defaultBus;
  const lookup = opts.lookup ?? findWalletOwnerUser;
  return async (credit) => {
    try {
      const userId = await lookup(opts.db, credit.walletId);
      if (userId === null) return;
      await bus.publish('wallet.credited', {
        userId,
        amount: credit.amount,
        balance: credit.balanceAfter,
        reference: credit.reference,
      });
    } catch (err) {
      logger.warn({ err, walletId: credit.walletId }, 'wallet.credited not published (credit unaffected)');
    }
  };
}
