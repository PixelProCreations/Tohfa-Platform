import { describe, expect, it } from 'vitest';
import { createCan } from './can';

describe('createCan', () => {
  it('grants exactly the codes /auth/me returned (server already dropped scope "none")', () => {
    const can = createCan(['invoice.view_own', 'wallet.cash_topup.process']);
    expect(can('invoice.view_own')).toBe(true);
    expect(can('wallet.cash_topup.process')).toBe(true);
    expect(can('rma.refund.bank_process')).toBe(false);
  });

  it('denies everything when there is no session yet', () => {
    const can = createCan(undefined);
    expect(can('invoice.view_own')).toBe(false);
  });

  it('does not do prefix or wildcard matching', () => {
    const can = createCan(['wallet.cash_topup.process']);
    expect(can('wallet.cash_topup')).toBe(false);
    expect(can('wallet.*')).toBe(false);
  });
});
