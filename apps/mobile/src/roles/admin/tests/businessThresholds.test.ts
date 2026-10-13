import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CASH_TOPUP_CAP_PAISE, exceedsCashTopupCap } from '../config/businessThresholds';
import { parseRupeesToPaise } from '../money/paise';

describe('cash top-up UX guard', () => {
  it('BR-19a: flags Rs 10,000.01 before submit (server still enforces CASH_LIMIT_EXCEEDED)', () => {
    expect(exceedsCashTopupCap(parseRupeesToPaise('10000.01'))).toBe(true);
  });

  it('BR-19b: Rs 10,000 exactly is not flagged', () => {
    expect(exceedsCashTopupCap(parseRupeesToPaise('10000.00'))).toBe(false);
  });

  it('BR-19: the mirrored constant still matches system_config.cash_topup_cap in the seed', () => {
    // No endpoint exposes cash_topup_cap to clients, so this constant is a copy.
    // This test is the drift alarm: if the seed changes, this fails.
    const seed = fs.readFileSync(
      path.resolve(__dirname, '../../../../../../db/seed/001_reference.sql'),
      'utf8',
    );
    const match = /\('cash_topup_cap',\s*'([0-9.]+)'::jsonb/.exec(seed);
    expect(match?.[1]).toBeDefined();
    expect(parseRupeesToPaise(match?.[1] ?? '')).toBe(CASH_TOPUP_CAP_PAISE);
  });
});
