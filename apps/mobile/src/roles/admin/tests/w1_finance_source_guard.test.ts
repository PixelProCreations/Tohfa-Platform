/**
 * Brief 07 (admin wiring honesty fixes), work stream W1: one source guard over
 * every finance report, ledger, invoice, GST and expense screen this stream
 * owns. The screens import react-native, so the behaviour is pinned by render
 * tests in w1_finance_*.test.tsx; this file pins the patterns that must never
 * come back, whatever a later edit does to the screen:
 *   - a missing value spelled inline instead of ADMIN_NO_VALUE (R1)
 *   - a blank report date sent to the server (P2)
 *   - success shown on a timer, or a success message with no endpoint (R3)
 *   - an identifier built out of a UUID or another field (R9)
 *   - money parsed or formatted as a float (R7)
 *   - the demo export list (R10)
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

const FINANCE_DIR = path.join(__dirname, '..', 'screens', 'finance');

export const W1_FILES = [
  'FinanceManagementFlow.tsx',
  'FinancialDashboardScreen.tsx',
  'ProfitLossScreen.tsx',
  'PLStatementScreen.tsx',
  'BasicAccountingLedgerScreen.tsx',
  'SalesIncomeRevenueScreen.tsx',
  'TransactionHistoryScreen.tsx',
  'InvoicesGstBillingScreen.tsx',
  'GSTFilingReportDetailScreen.tsx',
  'GSTAccountingScreen.tsx',
  'ExpensesScreen.tsx',
  'AddManualJournalEntryScreen.tsx',
  'ReportsExportScreen.tsx',
] as const;

const read = (file: string) => fs.readFileSync(path.join(FINANCE_DIR, file), 'utf8');

/** Source without block and line comments, so a comment explaining a removal does not trip a scan. */
const code = (file: string) =>
  read(file)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('W1 source guard (brief 07)', () => {
  it.each(W1_FILES)('R1: %s spells no missing value inline', (file) => {
    const src = code(file);
    // A quoted dash, a dash as the whole JSX text, or a literal fallback.
    expect(src).not.toMatch(/(['"`])—\1/);
    expect(src).not.toMatch(/>\s*—\s*</);
    expect(src).not.toMatch(/\?\?\s*0\b|\|\|\s*0\b|\?\?\s*1\b/);
  });

  it.each(W1_FILES)('P2: %s never sends a blank report date or search', (file) => {
    const src = code(file);
    expect(src).not.toMatch(/\bfrom:\s*''/);
    expect(src).not.toMatch(/\bto:\s*''/);
    expect(src).not.toMatch(/\bq:\s*''/);
  });

  it.each(W1_FILES)('R3: %s shows no success on a timer', (file) => {
    expect(code(file)).not.toContain('setTimeout(');
  });

  it.each(W1_FILES)('R3: %s carries none of the fake success messages', (file) => {
    const src = code(file);
    for (const fake of [
      'Journal Entry Posted',
      'Vouchers Verified',
      'Expenses Approved',
      'GSTR-1 JSON Generated',
      'Report Exported',
      'Report Downloaded Successfully',
      'export initiated',
      'Download Ready',
      'Deduction Successful',
    ]) {
      expect(src, `${file}: ${fake}`).not.toContain(fake);
    }
  });

  it.each(W1_FILES)('R9: %s builds no identifier out of another field', (file) => {
    const src = code(file);
    for (const prefix of ['SO-', 'GR-', 'PY-', 'LST-', 'DUE-', 'PAY-']) {
      expect(src, `${file}: \`${prefix}\${`).not.toContain(`\`${prefix}\${`);
    }
    expect(src).not.toMatch(/\$\{[^}]*\}\s*Buyer/);
  });

  it.each(W1_FILES)('R7: %s never parses or float-formats money', (file) => {
    const src = code(file);
    expect(src).not.toContain('parseFloat(');
    expect(src).not.toContain('parseInt(');
    expect(src).not.toMatch(/\bNumber\(/);
    expect(src).not.toContain('toLocaleString(');
    expect(src).not.toContain('.toFixed(');
  });

  it.each(W1_FILES)('R10: %s carries no demo data', (file) => {
    const src = code(file);
    expect(src).not.toMatch(/'Demo /);
    expect(src).not.toContain('(demo)');
    expect(src).not.toContain('WH-COON');
  });

  it('P4: ReportsExportScreen has no SAMPLE_EXPORTS fixture', () => {
    expect(code('ReportsExportScreen.tsx')).not.toContain('SAMPLE_EXPORTS');
  });

  it('P3: FinanceManagementFlow lists every warehouse, not the first four', () => {
    expect(code('FinanceManagementFlow.tsx')).not.toContain('.slice(0, 4)');
  });

  it('P3: the P&L screens make no "verified" claim', () => {
    for (const file of ['PLStatementScreen.tsx', 'ProfitLossScreen.tsx'] as const) {
      expect(code(file).toLowerCase(), file).not.toContain('verified');
    }
  });

  it('BR-63: no finance screen subtracts expenses from revenue on the phone', () => {
    for (const file of W1_FILES) {
      const src = code(file);
      expect(src, file).not.toMatch(/totalRevNum|totalExpNum|profit\s*=\s*\w+\s*-\s*\w+/);
    }
  });
});
