/** BR-183: top-up receipt (transaction id, balanceAfter, status) is own-only. */
import { describe, expect, it } from 'vitest';
import type { Executor } from '../../db/pool.js';
import { anActor } from '../../test/factories.js';
import type { TopupReceiptRow, TopupRepo } from './topup.repo.js';
import { createTopupService } from './topup.service.js';

const ME = '40000000-0000-4000-8000-00000000000a';
const TOPUP = '70000000-0000-4000-8000-000000000001';
const TXN = '71000000-0000-4000-8000-000000000001';

function harness(row: Partial<TopupReceiptRow> | null) {
  const repo = {
    findOwnTopupReceipt: async (_db: Executor, customerId: string) =>
      row !== null && customerId === ME
        ? ({
            id: TOPUP, channel: 'UPI', amount: '500.00', status: 'SUCCESS',
            created_at: new Date('2026-11-17T04:00:00Z'), updated_at: null,
            wallet_txn_id: TXN, balance_after: '1500.00', txn_at: new Date('2026-11-17T04:01:00Z'),
            ...row,
          } as TopupReceiptRow)
        : null,
  } as unknown as TopupRepo;
  return createTopupService({ repo, db: {} as Executor });
}

describe('BR-183: top-up receipt', () => {
  it('a SUCCESS top-up returns transaction id, balanceAfter and status', async () => {
    const r = await harness({}).getTopupReceipt(anActor({ customerId: ME }), TOPUP);
    expect(r).toMatchObject({ topupId: TOPUP, status: 'SUCCESS', amount: '500.00', transactionId: TXN, balanceAfter: '1500.00' });
    expect(r.completedAt).toBe('2026-11-17T04:01:00.000Z');
  });

  it('a PENDING top-up has no transaction yet', async () => {
    const r = await harness({ status: 'PENDING', wallet_txn_id: null, balance_after: null, txn_at: null })
      .getTopupReceipt(anActor({ customerId: ME }), TOPUP);
    expect(r).toMatchObject({ status: 'PENDING', transactionId: null, balanceAfter: null, completedAt: null });
  });

  it('BR-36: another customer, or a non-customer, gets 404', async () => {
    const svc = harness({});
    await expect(svc.getTopupReceipt(anActor({ customerId: '40000000-0000-4000-8000-00000000000b' }), TOPUP))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(svc.getTopupReceipt(anActor({}), TOPUP)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});
