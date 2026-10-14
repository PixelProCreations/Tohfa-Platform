import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseMoney, toPaise } from '@tohfa/shared-types';
import {
  CASH_TOPUP_CAP_PAISE,
  formatCashTopUpCap,
  formatTransferThreshold,
  HIGH_VALUE_TRANSFER_THRESHOLD_KG,
  transferNeedsApproval,
  validateTopUpAmount,
} from '../config/businessThresholds';

const SEED_PATH = path.resolve(__dirname, '../../../../../../db/seed/001_reference.sql');

describe('cash top-up cap (BR-19)', () => {
  it('BR-19: rejects a cash top-up above the cap', () => {
    // Rs 10,000.01 — one paisa over (BR-19a).
    expect(validateTopUpAmount(1_000_001, CASH_TOPUP_CAP_PAISE)).toEqual({
      ok: false,
      reason: 'CASH_LIMIT_EXCEEDED',
    });
    // The old hard-coded Rs 1,00,000 ceiling must no longer be accepted.
    expect(validateTopUpAmount(10_000_000, CASH_TOPUP_CAP_PAISE).ok).toBe(false);
  });

  it('BR-19: accepts a cash top-up of exactly the cap', () => {
    // Rs 10,000 exactly is accepted (BR-19b).
    expect(validateTopUpAmount(1_000_000, CASH_TOPUP_CAP_PAISE)).toEqual({ ok: true });
  });

  it('BR-19: rejects a zero, negative or fractional-paise amount as invalid', () => {
    expect(validateTopUpAmount(0, CASH_TOPUP_CAP_PAISE)).toEqual({ ok: false, reason: 'INVALID_AMOUNT' });
    expect(validateTopUpAmount(-100, CASH_TOPUP_CAP_PAISE)).toEqual({ ok: false, reason: 'INVALID_AMOUNT' });
    expect(validateTopUpAmount(10.5, CASH_TOPUP_CAP_PAISE)).toEqual({ ok: false, reason: 'INVALID_AMOUNT' });
  });

  it('BR-19: the client default matches system_config cash_topup_cap in db/seed/001_reference.sql', () => {
    // Drift guard: the API does not yet expose the cap to clients, so the
    // mobile default must track the seeded system_config value.
    const seed = fs.readFileSync(
      path.resolve(__dirname, '../../../../../../db/seed/001_reference.sql'),
      'utf8',
    );
    const match = /\('cash_topup_cap',\s*'([0-9.]+)'::jsonb/.exec(seed);
    expect(match, 'cash_topup_cap row not found in seed').not.toBeNull();
    expect(CASH_TOPUP_CAP_PAISE).toBe(toPaise(parseMoney(match![1])));
  });

  it('BR-19: renders the cap for display as Rs 10,000', () => {
    expect(formatCashTopUpCap()).toBe('₹10,000');
  });
});

describe('high-value inter-warehouse transfer threshold (BR-26, transfer.high_value.approve)', () => {
  it('BR-26: a transfer at or above the threshold is routed to Super Admin approval when the initiator cannot approve', () => {
    expect(transferNeedsApproval(HIGH_VALUE_TRANSFER_THRESHOLD_KG, false)).toBe(true);
    expect(transferNeedsApproval(HIGH_VALUE_TRANSFER_THRESHOLD_KG + 1, false)).toBe(true);
  });

  it('BR-26: a transfer below the threshold dispatches without approval', () => {
    expect(transferNeedsApproval(HIGH_VALUE_TRANSFER_THRESHOLD_KG - 1, false)).toBe(false);
  });

  it('BR-26: an initiator holding transfer.high_value.approve dispatches a high-value transfer directly', () => {
    expect(transferNeedsApproval(HIGH_VALUE_TRANSFER_THRESHOLD_KG * 2, true)).toBe(false);
  });

  it('BR-26: the threshold is not a system_config value yet (spec gap; add a drift test when it is seeded)', () => {
    // rbac.json transfer.high_value.approve says "threshold undefined" and the
    // seed has no key for it, so the client value is a placeholder. When a key
    // is seeded this test fails on purpose: replace it with a drift guard like
    // the BR-19 one above and mirror the seeded value.
    const seed = fs.readFileSync(SEED_PATH, 'utf8');
    expect(/\('[a-z_]*transfer[a-z_]*',/.test(seed)).toBe(false);
  });

  it('BR-26: renders the threshold for display as 1,000 kg', () => {
    expect(formatTransferThreshold()).toBe('1,000 kg');
  });
});
