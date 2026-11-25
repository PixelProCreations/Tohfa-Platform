/**
 * Static guard: the two farmer wallet money-movement screens must not claim
 * that money moved.
 *
 * There is no payout-request endpoint and no wallet top-up endpoint for a
 * farmer in `docs/openapi.yaml` -- every write method on every `/farmers/me`
 * path was checked -- and `roles/farmer/api/wallet.ts` is read-only. Both
 * screens used to pop a success alert ("Withdrawal Requested", "Reference Code
 * Generated", "Simulating secure payment") that no server ever saw.
 *
 * This is a source-level guard rather than a render test on purpose: the thing
 * worth locking down is that no success path can be re-added without a server
 * call. When the endpoints land, wire the handler, flip the UNAVAILABLE flag
 * to `false`, and replace this file with a real behavioural test.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import errorsEn from '../../../i18n/errors.en.json';
import errorsTa from '../../../i18n/errors.ta.json';
import farmerEn from '../../../i18n/farmer.en.json';
import farmerTa from '../../../i18n/farmer.ta.json';

const en: Record<string, string> = { ...errorsEn, ...farmerEn };
const ta: Record<string, string> = { ...errorsTa, ...farmerTa };

const SCREENS = [
  { file: '../screens/payment/WithdrawFundsScreen.tsx', flag: 'WITHDRAWAL_UNAVAILABLE' },
  { file: '../screens/payment/AddMoneyScreen.tsx', flag: 'ADD_MONEY_UNAVAILABLE' },
] as const;

function read(file: string): string {
  return fs.readFileSync(path.resolve(__dirname, file), 'utf8');
}

describe('farmer wallet money actions: unavailable, not fabricated', () => {
  for (const { file, flag } of SCREENS) {
    const name = path.basename(file);

    it(`${name}: shows no alert or other success claim`, () => {
      const src = read(file);
      expect(src).not.toMatch(/\bAlert\.alert\s*\(/);
      expect(src).not.toMatch(/\bAlert\b\s*,/);
    });

    it(`${name}: never calls the success/advance callbacks`, () => {
      const src = read(file);
      // The props stay on the interface for callers, but nothing may invoke them.
      expect(src).not.toMatch(/onRequestSuccess\s*\(/);
      expect(src).not.toMatch(/onSuccess\s*\(/);
      expect(src).not.toMatch(/onNavigateToCashTopUp\s*\(/);
    });

    it(`${name}: the primary action is rendered disabled, not removed`, () => {
      const src = read(file);
      expect(src).toContain(`const ${flag} = true;`);
      expect(src).toContain(`disabled={${flag}}`);
      expect(src).toContain(`accessibilityState={{ disabled: ${flag} }}`);
      // The design element itself must survive: the action button is still there.
      expect(src).toMatch(/<TouchableOpacity/);
    });
  }

  it('the unavailable copy resolves in both locales', () => {
    const keys = [
      'farmer.wallet.withdraw.unavailableTitle',
      'farmer.wallet.withdraw.unavailableBody',
      'farmer.wallet.addMoney.unavailableTitle',
      'farmer.wallet.addMoney.unavailableBody',
    ];
    for (const key of keys) {
      expect(en[key], `missing in en: ${key}`).toBeTruthy();
      expect(ta[key], `missing in ta: ${key}`).toBeTruthy();
    }
  });
});
