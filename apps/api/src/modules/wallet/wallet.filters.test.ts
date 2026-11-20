/** BR-183: transaction-list filters (type, from/to date, status). */
import { describe, expect, it } from 'vitest';
import { listMyTransactionsQuery } from './wallet.schema.js';

describe('BR-183: GET /wallets/me/transactions filters', () => {
  it('a bare date covers the whole UTC day on both ends', () => {
    const q = listMyTransactionsQuery.parse({ from: '2026-11-01', to: '2026-11-17' });
    expect(q.from).toBe('2026-11-01T00:00:00.000Z');
    expect(q.to).toBe('2026-11-17T23:59:59.999Z');
  });
  it('a date-time passes through unchanged', () => {
    expect(listMyTransactionsQuery.parse({ from: '2026-11-01T05:30:00.000Z' }).from).toBe('2026-11-01T05:30:00.000Z');
  });
  it('rejects a malformed date, an unknown type and an unknown status', () => {
    expect(listMyTransactionsQuery.safeParse({ from: '01-11-2026' }).success).toBe(false);
    expect(listMyTransactionsQuery.safeParse({ type: 'BOGUS' }).success).toBe(false);
    expect(listMyTransactionsQuery.safeParse({ status: 'PENDING' }).success).toBe(false);
  });
  it('BR-129: status=COMPLETED is accepted (every ledger row is COMPLETED)', () => {
    expect(listMyTransactionsQuery.parse({ status: 'COMPLETED', type: 'TOPUP_DIGITAL' })).toMatchObject({
      status: 'COMPLETED',
      type: 'TOPUP_DIGITAL',
    });
  });
});
