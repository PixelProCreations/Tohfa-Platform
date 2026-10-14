import { describe, expect, it } from 'vitest';
import { makeCan } from '../permissions/can';

describe('makeCan', () => {
  it('grants exactly the codes in the list', () => {
    const can = makeCan(['finance.expense.log', 'finance.sales_income.view']);
    expect(can('finance.expense.log')).toBe(true);
    expect(can('finance.sales_income.view')).toBe(true);
    expect(can('report.export.file')).toBe(false);
  });

  it('fails closed when there is no permission list (not loaded, /me failed)', () => {
    expect(makeCan(undefined)('finance.expense.log')).toBe(false);
    expect(makeCan(null)('finance.expense.log')).toBe(false);
    expect(makeCan([])('finance.expense.log')).toBe(false);
  });

  it('does not treat "*" as a wildcard', () => {
    expect(makeCan(['*'])('finance.expense.log')).toBe(false);
  });

  it('does not match on prefixes', () => {
    expect(makeCan(['finance'])('finance.expense.log')).toBe(false);
    expect(makeCan(['finance.expense.log'])('finance.expense')).toBe(false);
  });
});
