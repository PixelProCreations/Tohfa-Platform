/**
 * Source scan and structural checks for the warehouse finance screens
 * (finance-expenses/ and the wallet-cashtopup Daily Cash screens):
 * - every screen reads the live finance API through useFinanceData.ts; no
 *   fixture module is left to fall back on
 * - no fake "Add Category", "Edit", "Cancel" or receipt control (no endpoint,
 *   BR-62; BR-73 withdrawn)
 * - the add-expense and cash-close writes carry an Idempotency-Key (root
 *   CLAUDE.md 2.4) and the day's figures come from the server (BR-74)
 * - vouchers come from GET /admin/expenses/{id}/voucher (BR-75)
 * - revenue is not offered a warehouse filter the API cannot apply (BR-63)
 *
 * The screens import react-native, which plain-Node vitest cannot load, so
 * these read the source. The decisions themselves (bodies, differences,
 * history merge) are covered as pure functions in mappers_finance.test.ts and
 * finance_dailycash.test.ts.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');
const exists = (rel: string) => fs.existsSync(path.join(SRC, rel));

const FINANCE_DIR = 'roles/admin/screens/warehouse/finance-expenses';
const WALLET_DIR = 'roles/admin/screens/warehouse/wallet-cashtopup';

const FINANCE_SCREENS = fs
  .readdirSync(path.join(SRC, FINANCE_DIR))
  .filter((f) => f.endsWith('.tsx'))
  .map((f) => `${FINANCE_DIR}/${f}`);
const DAILY_CASH_SCREENS = [`${WALLET_DIR}/DailyCashScreen.tsx`, `${WALLET_DIR}/DailyCashSummaryScreen.tsx`];
const ALL_SCREENS = [...FINANCE_SCREENS, ...DAILY_CASH_SCREENS];

/** Source without line and block comments, so a comment explaining a removal does not trip a scan. */
const code = (rel: string) =>
  read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const ADD_EXPENSE = code(`${FINANCE_DIR}/WarehouseAddExpenseScreen.tsx`);
const EXPENSE_DETAIL = code(`${FINANCE_DIR}/ExpenseDetailScreen.tsx`);
const EXPENSES_LIST = code(`${FINANCE_DIR}/WarehouseExpensesScreen.tsx`);
const REVENUE_LIST = code(`${FINANCE_DIR}/RevenueScreen.tsx`);
const VOUCHERS = code(`${FINANCE_DIR}/VouchersScreen.tsx`);
const VOUCHER_DETAIL = code(`${FINANCE_DIR}/VoucherDetailScreen.tsx`);
const FLOW = code(`${FINANCE_DIR}/FinanceFlow.tsx`);
const HUB = code(`${FINANCE_DIR}/FinanceHubScreen.tsx`);
const REPORTS = code(`${FINANCE_DIR}/FinanceReportsScreen.tsx`);
const HISTORY = code(`${FINANCE_DIR}/FinanceHistoryScreen.tsx`);
const DAILY_CASH = code(`${WALLET_DIR}/DailyCashScreen.tsx`);
const DAILY_SUMMARY = code(`${WALLET_DIR}/DailyCashSummaryScreen.tsx`);
const USE_FINANCE_DATA = read(`${FINANCE_DIR}/useFinanceData.ts`);

describe('finance screens wiring', () => {
  it('useFinanceData exports all required hooks for queries and mutations', () => {
    for (const hook of [
      'useExpenseCategories',
      'useExpenseList',
      'useExpense',
      'useExpenseVoucher',
      'useRevenueList',
      'useRevenueDetail',
      'useDailyCashSummary',
      'useFinanceReports',
      'useCreateExpenseMutation',
      'useCreateCashCloseMutation',
    ]) {
      expect(USE_FINANCE_DATA).toContain(`export function ${hook}`);
    }
  });

  it('the finance fixture module is gone and no finance or daily cash screen imports a fixture', () => {
    expect(exists(`${FINANCE_DIR}/fixtures.ts`)).toBe(false);
    for (const file of ALL_SCREENS) {
      expect(read(file), file).not.toMatch(/from '[^']*fixtures'/);
    }
  });

  it('no finance or daily cash screen fakes behaviour with an Alert', () => {
    for (const file of ALL_SCREENS) {
      expect(code(file), file).not.toContain('Alert.alert');
    }
  });

  it('no warehouse list fixture: FinanceFlow and Daily Cash take no warehouseOptions (live picker instead)', () => {
    expect(FLOW).not.toContain('warehouseOptions');
    expect(FLOW).not.toContain('FINANCE_WAREHOUSES');
    expect(DAILY_CASH).not.toContain('warehouseOptions?:');
    expect(read(`${FINANCE_DIR}/index.ts`)).not.toContain('FINANCE_WAREHOUSES');
  });

  it('lists read the live cursor-paged endpoints', () => {
    expect(EXPENSES_LIST).toContain('useExpenseList(');
    expect(EXPENSES_LIST).toContain('loadMore');
    expect(REVENUE_LIST).toContain('useRevenueList(');
    expect(REVENUE_LIST).toContain('loadMore');
    expect(HISTORY).toContain('mergeFinanceHistory(');
    expect(REPORTS).toContain('useFinanceReports(');
    expect(HUB).toContain('useFinanceReports(');
  });

  it('the hub shows no mock trend chart', () => {
    expect(HUB).not.toContain('TREND_BARS');
  });

  it('reports offer no CSV export (no in-app file save or share mechanism)', () => {
    expect(REPORTS).not.toContain('ExportIcon');
    expect(REPORTS).not.toContain('/admin/exports/');
  });
});

describe('BR-62: expenses are recorded once, with no workflow', () => {
  it('BR-62: WarehouseAddExpenseScreen has no Add Category entry point or modal', () => {
    // There is no category write endpoint in openapi.yaml.
    expect(ADD_EXPENSE).not.toContain('setShowAddCategoryScreen');
    expect(ADD_EXPENSE).not.toContain('handleSaveCategory');
    expect(ADD_EXPENSE).not.toContain('+ Add');
  });

  it('BR-62: WarehouseAddExpenseScreen has no edit mode (there is no PATCH /admin/expenses/{id})', () => {
    expect(ADD_EXPENSE).not.toContain('expenseDraft');
    expect(ADD_EXPENSE).not.toContain('initialExpense');
  });

  it('BR-62: WarehouseAddExpenseScreen has no receipt control (ExpenseCreate has no receipt field)', () => {
    expect(ADD_EXPENSE).not.toMatch(/launchCamera|launchImageLibrary|image-picker|ReceiptIcon|receiptUri/);
  });

  it('BR-62: the add-expense submit builds the strict body and replays safely with an Idempotency-Key', () => {
    expect(ADD_EXPENSE).toContain('buildExpenseCreateBody(');
    expect(ADD_EXPENSE).toContain('useCreateExpenseMutation(');
    expect(ADD_EXPENSE).toContain('useIdempotencyKey(');
    expect(ADD_EXPENSE).toMatch(/idempotencyKey:\s*\w+\.keyFor\(/);
    expect(ADD_EXPENSE).toContain('useExpenseCategories(');
    expect(ADD_EXPENSE).toContain('istToday(');
  });

  it('BR-62: ExpenseDetailScreen has no Edit, Cancel or receipt view', () => {
    expect(EXPENSE_DETAIL).not.toMatch(/>\s*Edit\s*</);
    expect(EXPENSE_DETAIL).not.toMatch(/>\s*Cancel\s*</);
    expect(EXPENSE_DETAIL).not.toContain('onEdit');
    expect(EXPENSE_DETAIL).not.toContain('onCancel');
    expect(EXPENSE_DETAIL).not.toContain('isReceiptView');
    expect(EXPENSE_DETAIL).toContain('useExpense(');
  });

  it('BR-62: WarehouseExpensesScreen has no Pending status filter', () => {
    expect(EXPENSES_LIST).not.toContain("'Pending'");
  });
});

describe('BR-63: finance reads are warehouse-scoped by the server', () => {
  it('BR-63: the revenue list offers no warehouse filter (GET /admin/finance/revenue takes none)', () => {
    expect(REVENUE_LIST).not.toContain('useFinanceWarehousePicker');
    expect(REVENUE_LIST).not.toContain('onSelectWarehouse');
  });

  it('BR-63: the expense list sends a uuid warehouse from the live picker, never a fixture id', () => {
    expect(EXPENSES_LIST).toContain('useFinanceWarehousePicker(');
    expect(EXPENSES_LIST).not.toContain("'WH-");
  });
});

describe('BR-74: the daily cash close', () => {
  it('BR-74: Daily Cash reads the server figures and keeps no hard-coded expected closing', () => {
    expect(DAILY_CASH).toContain('useDailyCashSummary(');
    expect(DAILY_CASH).not.toContain('EXPECTED_CLOSING_PAISE');
    expect(DAILY_CASH).not.toContain('expectedClosingPaise(');
    expect(DAILY_SUMMARY).toContain('useDailyCashSummary(');
  });

  it('BR-74: Daily Cash posts the cash close with an Idempotency-Key', () => {
    expect(DAILY_CASH).toContain('buildCashCloseBody(');
    expect(DAILY_CASH).toContain('useCreateCashCloseMutation(');
    expect(DAILY_CASH).toContain('useIdempotencyKey(');
    expect(DAILY_CASH).toMatch(/idempotencyKey:\s*\w+\.keyFor\(/);
  });

  it('BR-74: an already closed day is shown, not closed a second time', () => {
    expect(DAILY_CASH).toMatch(/\.closed/);
  });

  it('BR-74: both Daily Cash screens are gated on finance.cash_close.manage', () => {
    expect(DAILY_CASH).toMatch(/FINANCE_CODES\.cashClose|'finance\.cash_close\.manage'/);
    expect(DAILY_SUMMARY).toMatch(/FINANCE_CODES\.cashClose|'finance\.cash_close\.manage'/);
  });

  it('BR-74: FinanceFlow opens Daily Cash only for finance.cash_close.manage', () => {
    expect(read(`${FINANCE_DIR}/FinanceParts.tsx`)).toMatch(/DailyCash:\s*\[FINANCE_CODES\.cashClose\]/);
  });
});

describe('BR-75: expense vouchers', () => {
  it('BR-75: the voucher detail is read from GET /admin/expenses/{id}/voucher', () => {
    expect(VOUCHER_DETAIL).toContain('useExpenseVoucher(');
  });

  it('BR-75: the vouchers list is built from real expenses (there is no voucher list endpoint)', () => {
    expect(VOUCHERS).toContain('useExpenseList(');
    expect(VOUCHERS).not.toContain('SAMPLE_VOUCHERS');
  });
});

describe('admin theme in finance and daily cash screens', () => {
  it('no numeric fontSize, fontFamily or colour literal', () => {
    for (const file of [...ALL_SCREENS]) {
      const src = code(file);
      expect(src, file).not.toMatch(/fontSize:\s*\d/);
      expect(src, file).not.toContain('fontFamily');
      expect(src, file).not.toMatch(/['"]#[0-9a-fA-F]{3,8}['"]/);
      expect(src, file).not.toMatch(/rgba?\(/);
    }
  });
});
