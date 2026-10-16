/**
 * roles/admin/api/finance.ts: the warehouse finance and expenses API (docs/openapi.yaml tag
 * Finance):
 *   GET  /admin/expense-categories           finance.expense.log       (BR-62; read-only)
 *   GET  /admin/expenses                     finance.expense.log       (BR-62, BR-63; Sub = own)
 *   POST /admin/expenses                     finance.expense.log       (BR-62; Idempotency-Key)
 *   GET  /admin/expenses/{id}                finance.expense.log       (BR-62, BR-63)
 *   GET  /admin/expenses/{id}/voucher        finance.expense.log       (BR-75)
 *   GET  /admin/finance/revenue              finance.sales_income.view (BR-63; Sub = own)
 *   GET  /admin/finance/revenue/{id}         finance.sales_income.view (BR-63)
 *   GET  /admin/finance/reports/revenue      finance.sales_income.view (BR-63)
 *   GET  /admin/finance/reports/expenses     finance.expense.log       (BR-62, BR-63)
 *   GET  /admin/finance/daily-summary        finance.cash_close.manage (BR-74)
 *   POST /admin/finance/cash-close           finance.cash_close.manage (BR-74; Idempotency-Key)
 *   GET  /admin/finance/cash-close           finance.cash_close.manage (BR-74)
 *   GET  /admin/finance/cash-close/{id}      finance.cash_close.manage (BR-74)
 *
 * The shell client is mocked (same pattern as api_orders.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    request: vi.fn(async () => ({ items: [], page: { nextCursor: null, hasMore: false } })),
  };
});

import { request } from '../../../shell/api/client';
import {
  ERROR_CODES,
  createCashClose,
  createExpense,
  getCashClose,
  getDailyCashSummary,
  getExpense,
  getExpenseVoucher,
  getFinanceExpenseReport,
  getFinanceRevenue,
  getFinanceRevenueReport,
  listCashCloses,
  listExpenseCategories,
  listExpenses,
  listFinanceRevenue,
} from '../api/finance';
import { hasKey } from '../i18n';
import { financeWarehouseFilter } from '../screens/warehouse/finance-expenses/mappers';

const requestMock = vi.mocked(request);

const OWN = '11111111-1111-4111-8111-111111111111';
const FOREIGN = '99999999-9999-4999-8999-999999999999';
const EXPENSE_ID = '22222222-2222-4222-8222-222222222222';
const CATEGORY_ID = '33333333-3333-4333-8333-333333333333';
const ORDER_ID = '44444444-4444-4444-8444-444444444444';
const CLOSE_ID = '55555555-5555-5555-8555-555555555555';
const SUB_SCOPE = { warehouseId: OWN, warehouseCode: 'WH-COON', warehouseName: 'Coonoor' };
const MAIN_SCOPE = {};

beforeEach(() => {
  vi.clearAllMocks();
});

function lastCall(): [string, Record<string, unknown>] {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('request() was not called');
  return [call[0], call[1] as Record<string, unknown>];
}

describe('roles/admin/api/finance', () => {
  describe('BR-62: Expense Categories and Recording', () => {
    it('listExpenseCategories requests GET /admin/expense-categories', async () => {
      await listExpenseCategories();
      const [path, init] = lastCall();
      expect(path).toBe('/admin/expense-categories');
      expect(init.method).toBe('GET');
    });

    it('createExpense sends POST /admin/expenses with Idempotency-Key and payload', async () => {
      const key = 'test-idemp-key-1';
      await createExpense(
        {
          categoryId: CATEGORY_ID,
          amount: '1500.50',
          expenseDate: '2026-10-13',
          paymentMethod: 'CASH',
          warehouseId: OWN,
          description: 'Packing boxes',
        },
        key,
      );

      const [path, init] = lastCall();
      expect(path).toBe('/admin/expenses');
      expect(init.method).toBe('POST');
      expect(init.idempotencyKey).toBe(key);
      expect(init.body).toEqual({
        categoryId: CATEGORY_ID,
        amount: '1500.50',
        expenseDate: '2026-10-13',
        paymentMethod: 'CASH',
        warehouseId: OWN,
        description: 'Packing boxes',
      });
    });

    it('BR-62a: createExpense sends only ExpenseCreate fields (the server body is strict; no receipt field exists)', async () => {
      await createExpense(
        {
          categoryId: CATEGORY_ID,
          amount: '10.00',
          expenseDate: '2026-10-13',
          paymentMethod: 'UPI',
          vendor: 'Nilgiri Freight',
          // A stray field from a caller must not ride along (would be a 422).
          ...({ receiptStorageKey: 'uploads/x.jpg', referenceNumber: 'R-1' } as object),
        },
        'k',
      );
      const [, init] = lastCall();
      expect(init.body).toEqual({
        categoryId: CATEGORY_ID,
        amount: '10.00',
        expenseDate: '2026-10-13',
        paymentMethod: 'UPI',
        vendor: 'Nilgiri Freight',
      });
    });

    it('getExpense requests GET /admin/expenses/{id}', async () => {
      await getExpense(EXPENSE_ID);
      const [path, init] = lastCall();
      expect(path).toBe(`/admin/expenses/${EXPENSE_ID}`);
      expect(init.method).toBe('GET');
    });

    it('listExpenses builds query params correctly', async () => {
      await listExpenses({
        warehouseId: OWN,
        categoryId: CATEGORY_ID,
        paymentMethod: 'CASH',
        status: 'RECORDED',
        from: '2026-10-01',
        to: '2026-10-13',
        limit: 20,
      });

      const [path, init] = lastCall();
      expect(path).toContain('/admin/expenses?');
      expect(path).toContain(`warehouseId=${OWN}`);
      expect(path).toContain(`categoryId=${CATEGORY_ID}`);
      expect(path).toContain('paymentMethod=CASH');
      expect(path).toContain('status=RECORDED');
      expect(path).toContain('from=2026-10-01');
      expect(path).toContain('to=2026-10-13');
      expect(path).toContain('limit=20');
      expect(init.method).toBe('GET');
    });
  });

  describe('BR-63: Revenue and Reports', () => {
    it('listFinanceRevenue builds query params and requests GET /admin/finance/revenue', async () => {
      await listFinanceRevenue({
        from: '2026-10-01',
        to: '2026-10-13',
        channel: 'MARKET',
        paymentMethod: 'CASH',
      });

      const [path, init] = lastCall();
      expect(path).toContain('/admin/finance/revenue?');
      expect(path).toContain('from=2026-10-01');
      expect(path).toContain('to=2026-10-13');
      expect(path).toContain('channel=MARKET');
      expect(path).toContain('paymentMethod=CASH');
      expect(init.method).toBe('GET');
    });

    it('getFinanceRevenue requests GET /admin/finance/revenue/{id}', async () => {
      await getFinanceRevenue(ORDER_ID);
      const [path, init] = lastCall();
      expect(path).toBe(`/admin/finance/revenue/${ORDER_ID}`);
      expect(init.method).toBe('GET');
    });

    it('getFinanceRevenueReport requires from and to params', async () => {
      await getFinanceRevenueReport({ from: '2026-10-01', to: '2026-10-13' });
      const [path, init] = lastCall();
      expect(path).toContain('/admin/finance/reports/revenue?');
      expect(path).toContain('from=2026-10-01');
      expect(path).toContain('to=2026-10-13');
      expect(init.method).toBe('GET');
    });

    it('getFinanceExpenseReport requires from and to params', async () => {
      await getFinanceExpenseReport({ from: '2026-10-01', to: '2026-10-13' });
      const [path, init] = lastCall();
      expect(path).toContain('/admin/finance/reports/expenses?');
      expect(path).toContain('from=2026-10-01');
      expect(path).toContain('to=2026-10-13');
      expect(init.method).toBe('GET');
    });
  });

  describe('BR-74: Daily Cash Summary and Cash Close', () => {
    it('getDailyCashSummary requests GET /admin/finance/daily-summary with date and warehouseId', async () => {
      await getDailyCashSummary({ date: '2026-10-13', warehouseId: OWN });
      const [path, init] = lastCall();
      expect(path).toContain('/admin/finance/daily-summary?');
      expect(path).toContain('date=2026-10-13');
      expect(path).toContain(`warehouseId=${OWN}`);
      expect(init.method).toBe('GET');
    });

    it('createCashClose sends POST /admin/finance/cash-close with Idempotency-Key and body', async () => {
      const key = 'close-key-1';
      await createCashClose(
        {
          date: '2026-10-13',
          warehouseId: OWN,
          countedCash: '45000.00',
          note: 'All tallies match drawer',
        },
        key,
      );

      const [path, init] = lastCall();
      expect(path).toBe('/admin/finance/cash-close');
      expect(init.method).toBe('POST');
      expect(init.idempotencyKey).toBe(key);
      expect(init.body).toEqual({
        date: '2026-10-13',
        warehouseId: OWN,
        countedCash: '45000.00',
        note: 'All tallies match drawer',
      });
    });

    it('listCashCloses builds query params and requests GET /admin/finance/cash-close', async () => {
      await listCashCloses({ warehouseId: OWN, from: '2026-10-01', to: '2026-10-13' });
      const [path, init] = lastCall();
      expect(path).toContain('/admin/finance/cash-close?');
      expect(path).toContain(`warehouseId=${OWN}`);
      expect(path).toContain('from=2026-10-01');
      expect(path).toContain('to=2026-10-13');
      expect(init.method).toBe('GET');
    });

    it('getCashClose requests GET /admin/finance/cash-close/{id}', async () => {
      await getCashClose(CLOSE_ID);
      const [path, init] = lastCall();
      expect(path).toBe(`/admin/finance/cash-close/${CLOSE_ID}`);
      expect(init.method).toBe('GET');
    });
  });

  describe('BR-75: Expense Voucher', () => {
    it('getExpenseVoucher requests GET /admin/expenses/{id}/voucher', async () => {
      await getExpenseVoucher(EXPENSE_ID);
      const [path, init] = lastCall();
      expect(path).toBe(`/admin/expenses/${EXPENSE_ID}/voucher`);
      expect(init.method).toBe('GET');
    });
  });

  describe('BR-30: Warehouse scoping helper', () => {
    it('pins Sub Warehouse Admin scope to own warehouse regardless of selection', () => {
      expect(financeWarehouseFilter(SUB_SCOPE, FOREIGN)).toBe(OWN);
      expect(financeWarehouseFilter(SUB_SCOPE, undefined)).toBe(OWN);
    });

    it('allows Main Warehouse Admin to select any warehouse or none', () => {
      expect(financeWarehouseFilter(MAIN_SCOPE, FOREIGN)).toBe(FOREIGN);
      expect(financeWarehouseFilter(MAIN_SCOPE, undefined)).toBeUndefined();
    });
  });

  describe('ERROR_CODES coverage', () => {
    it('lists all problem codes the finance endpoints document', () => {
      expect([...ERROR_CODES].sort()).toEqual(
        [
          'CONFLICT',
          'FORBIDDEN',
          'IDEMPOTENCY_KEY_REUSED',
          'INTERNAL',
          'NOT_FOUND',
          'UNAUTHENTICATED',
          'VALIDATION_FAILED',
        ].sort(),
      );
    });

    it('every listed error code maps to an admin translation key', () => {
      for (const code of ERROR_CODES) {
        expect(hasKey(`admin.error.${code}`), code).toBe(true);
      }
    });
  });
});
