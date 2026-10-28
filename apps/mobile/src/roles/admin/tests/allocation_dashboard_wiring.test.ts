/**
 * Allocation Dashboard (design M3-08, route M3S07): the per-bucket detail
 * sheet and the FCFS note. The sheet's figures are decided by
 * allocationBucketDetail (mappers_inventory.test.ts); this pins the wiring by
 * reading the source, because JSX cannot render in this plain-Node vitest.
 * The screen's strings are covered by orders_billing_i18n.test.ts.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import en from '../i18n/en.json';

const SCREEN = fs.readFileSync(
  path.join(__dirname, '..', 'screens', 'warehouse', 'inventory', 'StockAllocationDashboardScreen.tsx'),
  'utf8',
);
/** The source without comments: the docblock names the permission on purpose. */
const CODE = SCREEN.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

describe('Allocation Dashboard: bucket detail sheet and FCFS note', () => {
  it('tapping a bucket card opens that bucket in the sheet', () => {
    expect(SCREEN).toMatch(/onPress=\{\(\) => setSelectedChannel\(alloc\.channel\)\}/);
    expect(SCREEN).toMatch(/const bucket = allocationBucketDetail\(dashboard, selectedChannel\);/);
    expect(SCREEN).toMatch(/visible=\{bucket !== undefined\}/);
    expect(SCREEN).toMatch(/onRequestClose=\{\(\) => setSelectedChannel\(undefined\)\}/);
  });

  it('the sheet is read-only: no write, and no allocation percentage is offered (allocation.channel_percentage.set is SA only)', () => {
    expect(CODE).not.toMatch(/useAdminMutation|channel_percentage|onSave|onSubmit/);
  });

  it('BR-12: the FCFS note is static translated text that claims only what the rules say', () => {
    expect(SCREEN).toMatch(/t\('inventory\.allocation\.fcfsNote'\)/);
    const note = (en as Record<string, string>)['inventory.allocation.fcfsNote'] ?? '';
    expect(note).toMatch(/first come, first served/i);
    // BR-22: carts hold Online stock; BR-12c: an order above the Online bucket is refused, never drawn from Reserve.
    expect(note).toMatch(/cart/i);
    expect(note).toMatch(/Reserve/);
    // No per-customer limits: no rule defines one.
    expect(note).not.toMatch(/per-customer|limit per customer/i);
    // No threshold baked into the copy (the cart hold window and split come from system_config).
    expect(note).not.toMatch(/\d/);
  });

  it('no raw spacing literal for the bottom spacer', () => {
    expect(SCREEN).not.toMatch(/style=\{\{ height: \d+ \}\}/);
  });
});
