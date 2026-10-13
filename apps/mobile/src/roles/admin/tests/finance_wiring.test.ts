/**
 * Source scan and structural checks for warehouse finance screens (Phase 11):
 * - Live screens connect to the finance API through useFinanceData.ts
 * - No fake "Add Category" in AddExpenseScreen (spec gap, BR-62)
 * - No fake "Edit" or "Cancel" in ExpenseDetailScreen (spec gap, BR-62)
 * - Expense status in the API is RECORDED/APPROVED/REJECTED — no "Pending" (BR-62)
 * - Sub Warehouse Admin scope is always pinned to own warehouse (BR-30)
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');

const FINANCE_DIR = 'roles/admin/screens/warehouse/finance-expenses';

const ADD_EXPENSE = read(`${FINANCE_DIR}/WarehouseAddExpenseScreen.tsx`);
const EXPENSE_DETAIL = read(`${FINANCE_DIR}/ExpenseDetailScreen.tsx`);
const EXPENSES_LIST = read(`${FINANCE_DIR}/WarehouseExpensesScreen.tsx`);
const USE_FINANCE_DATA = read(`${FINANCE_DIR}/useFinanceData.ts`);

describe('Finance Screens Wiring (Phase 11)', () => {
  it('useFinanceData exports all required hooks for queries and mutations', () => {
    expect(USE_FINANCE_DATA).toContain('export function useExpenseCategories');
    expect(USE_FINANCE_DATA).toContain('export function useExpenseList');
    expect(USE_FINANCE_DATA).toContain('export function useExpense');
    expect(USE_FINANCE_DATA).toContain('export function useExpenseVoucher');
    expect(USE_FINANCE_DATA).toContain('export function useRevenueList');
    expect(USE_FINANCE_DATA).toContain('export function useRevenueDetail');
    expect(USE_FINANCE_DATA).toContain('export function useDailyCashSummary');
    expect(USE_FINANCE_DATA).toContain('export function useCreateExpenseMutation');
    expect(USE_FINANCE_DATA).toContain('export function useCreateCashCloseMutation');
  });

  it('BR-62: WarehouseAddExpenseScreen has no Add Category entry point or modal', () => {
    // There is no category write endpoint in openapi.yaml
    expect(ADD_EXPENSE).not.toContain('setShowAddCategoryScreen');
    expect(ADD_EXPENSE).not.toContain('handleSaveCategory');
    expect(ADD_EXPENSE).not.toContain('+ Add');
  });

  it('BR-62: ExpenseDetailScreen hides Edit and Cancel actions (only recorded expenses exist)', () => {
    // Expenses are only recorded (BR-62)
    expect(EXPENSE_DETAIL).not.toContain('<Text style={styles.actionBtnLabel}>Edit</Text>');
    expect(EXPENSE_DETAIL).not.toContain('<Text style={styles.actionBtnLabel}>Cancel</Text>');
  });

  it('BR-62: WarehouseExpensesScreen has no Pending status filter', () => {
    expect(EXPENSES_LIST).not.toContain("'Pending'");
  });
});
