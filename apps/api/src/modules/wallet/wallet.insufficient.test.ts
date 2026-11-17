import { describe, expect, it } from 'vitest';
import { walletInsufficientError } from './wallet.insufficient.js';
import { walletTxnCode } from './wallet.repo.js';

describe('BR-192: WALLET_INSUFFICIENT carries a typed shortfall', () => {
  it('BR-192: serialises shortfall, balance and required at the top level of the problem', () => {
    const problem = walletInsufficientError({ balance: '150.00', required: '200.00' }).toProblem('/v1/orders');
    expect(problem).toMatchObject({ code: 'WALLET_INSUFFICIENT', status: 402, shortfall: '50.00', balance: '150.00', required: '200.00' });
    expect(problem.meta).toEqual({ shortfall: '50.00' });
  });
  it('BR-192: shortfall is exact in paise (no float drift)', () => {
    const problem = walletInsufficientError({ balance: '0.10', required: '0.30' }).toProblem();
    expect(problem.shortfall).toBe('0.20');
  });
  it('BR-197: txnCode is derived from the ledger id', () => {
    expect(walletTxnCode('9f3a1c7b-2000-4000-8000-000000000000')).toBe('TXN-9F3A1C7B20');
  });
});
