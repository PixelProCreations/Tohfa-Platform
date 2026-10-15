/**
 * Source scan of the live stock count (M3S10-M3S12, BR-106) and stock
 * adjustment (M3S13, M3S14, M3S17, BR-37) screens. Hooks and JSX cannot render
 * in this plain-Node vitest, so the wiring is pinned by reading the sources,
 * as transfers_wiring.test.ts does; the decisions themselves are tested in
 * mappers_stockAdjustments.test.ts.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const INVENTORY = path.join(__dirname, '..', 'screens', 'warehouse', 'inventory');
const read = (name: string) => fs.readFileSync(path.join(INVENTORY, name), 'utf8');

const SCREENS = [
  'StockVerificationScreen.tsx',
  'PhysicalCountScreen.tsx',
  'VarianceReviewScreen.tsx',
  'StockAdjustmentRequestScreen.tsx',
  'AdjustmentHistoryScreen.tsx',
  'AdjustmentDetailScreen.tsx',
].map((name) => ({ name, source: read(name) }));
const FLOW = read('InventoryFlow.tsx');
const DETAIL = read('AdjustmentDetailScreen.tsx');
const REVIEW = read('VarianceReviewScreen.tsx');

describe('stock count and adjustment screens are live', () => {
  it('the sample fixtures are gone and no screen carries demo batches or sample ids', () => {
    expect(fs.existsSync(path.join(INVENTORY, 'fixtures.ts'))).toBe(false);
    for (const { name, source } of SCREENS) {
      expect({ name, sample: /SAMPLE_|ADJ-0|BAT-20|fixtures|'Tomato'|100 KG/.test(source) }).toEqual({ name, sample: false });
    }
  });

  it('every screen reads through the live hooks and never shows the server detail', () => {
    for (const { name, source } of SCREENS) {
      expect({ name, live: /from '\.\/useStockAdjustmentData'/.test(source) }).toEqual({ name, live: true });
      expect({ name, detail: /problem\.detail|\.message\b/.test(source) }).toEqual({ name, detail: false });
    }
  });

  it('every write sends an Idempotency-Key from useIdempotencyKey (root CLAUDE.md 2.4)', () => {
    for (const name of ['PhysicalCountScreen.tsx', 'StockAdjustmentRequestScreen.tsx', 'AdjustmentDetailScreen.tsx', 'VarianceReviewScreen.tsx']) {
      const source = read(name);
      expect({ name, key: /useIdempotencyKey\(\)/.test(source) && /idempotencyKey: \w+\.keyFor\(/.test(source) }).toEqual({ name, key: true });
    }
  });

  it('BR-37a: Approve and Reject are drawn only from adjustmentActions (the approve grant on a PENDING row)', () => {
    expect(DETAIL).toMatch(/const actions = adjustmentActions\(can, adjustment\);/);
    expect(DETAIL).toMatch(/\{actions\.approve \? \(\s*<WalletButton label=\{t\('stockAdj\.detail\.approve'\)\}/);
    expect(DETAIL).toMatch(/\{actions\.reject && !rejectOpen \? \(/);
    // Action failures (a self-approval among them) show the mapped words, not the generic error.
    expect(DETAIL).toMatch(/t\(stockActionErrorKey\(actionError\)\)/);
  });

  it('BR-106: Raise adjustment is drawn only from canRaiseAdjustment and opens the raised adjustment', () => {
    expect(REVIEW).toMatch(/const offerRaise = canRaiseAdjustment\(can, count\);/);
    expect(REVIEW).toMatch(/\{offerRaise \? \(/);
    expect(REVIEW).toMatch(/onNavigate\?\.\('M3S17', \{ adjustmentId: result\.adjustment\.id \}\)/);
    expect(REVIEW).toMatch(/useVerificationList\(warehouseId, true\)/);
  });

  it('InventoryFlow renders the live screens with the computed warehouse and uuid params', () => {
    expect(FLOW).toMatch(/case 'M3S10':\s*return <StockVerificationScreen \{\.\.\.live\} \/>;/);
    expect(FLOW).toMatch(/<PhysicalCountScreen \{\.\.\.live\} presetBatchId=\{batchIdParam\(params\)\} \/>/);
    expect(FLOW).toMatch(/<VarianceReviewScreen \{\.\.\.live\} verificationId=\{uuidParam\(params, 'verificationId'\)\} \/>/);
    expect(FLOW).toMatch(/<StockAdjustmentRequestScreen \{\.\.\.live\} presetBatchId=\{batchIdParam\(params\)\} \/>/);
    expect(FLOW).toMatch(/<AdjustmentDetailScreen \{\.\.\.live\} adjustmentId=\{adjustmentId\} \/>/);
    // The Main dashboard's approval link carries no id: it opens the PENDING queue.
    expect(FLOW).toMatch(/if \(adjustmentId === undefined\) return <AdjustmentHistoryScreen \{\.\.\.live\} initialFilter="PENDING" \/>;/);
  });
});
