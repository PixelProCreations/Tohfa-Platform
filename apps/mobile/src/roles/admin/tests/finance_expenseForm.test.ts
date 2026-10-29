import { describe, expect, it } from 'vitest';
import {
  buildExpenseCreateBody,
  calendarDaysInMonth,
  calendarFirstWeekday,
  isIsoCalendarDay,
  monthStartOf,
  shiftIsoDay,
  type ExpenseFormInput,
} from '../screens/warehouse/finance-expenses/expenseForm';

const CATEGORY = '3f0c6a52-6a43-4d2b-9a55-0d4a1f6c2b11';
const WAREHOUSE = '9b1d2c3e-4f50-4a6b-8c7d-1e2f3a4b5c6d';

function form(overrides: Partial<ExpenseFormInput> = {}): ExpenseFormInput {
  return {
    categoryId: CATEGORY,
    warehouseId: WAREHOUSE,
    requiresWarehouse: true,
    expenseDate: '2026-10-29',
    amountText: '2400',
    paymentMethod: 'Cash',
    vendor: '',
    description: '',
    ...overrides,
  };
}

describe('finance expense form (POST /admin/expenses body)', () => {
  it('BR-62: add-expense body omits empty optional fields and requires real UUIDs', () => {
    const ok = buildExpenseCreateBody(form({ vendor: '   ', description: '' }));
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.body).toEqual({
      categoryId: CATEGORY,
      expenseDate: '2026-10-29',
      amount: '2400.00',
      paymentMethod: 'CASH',
      warehouseId: WAREHOUSE,
    });
    expect('vendor' in ok.body).toBe(false);
    expect('description' in ok.body).toBe(false);

    // The old fixture fallbacks ('cat-1', 'WH-COON') are not UUIDs: the server's strict
    // schema answers 422, so the form must refuse them instead of sending them.
    const fixtureIds = buildExpenseCreateBody(form({ categoryId: 'cat-1', warehouseId: 'WH-COON' }));
    expect(fixtureIds).toEqual({ ok: false, problems: ['category', 'warehouse'] });

    const nothingChosen = buildExpenseCreateBody(form({ categoryId: undefined, warehouseId: undefined }));
    expect(nothingChosen).toEqual({ ok: false, problems: ['category', 'warehouse'] });
  });

  it('BR-62: a Sub admin body carries no warehouseId (the server books it to their own warehouse)', () => {
    const sub = buildExpenseCreateBody(form({ requiresWarehouse: false, warehouseId: undefined }));
    expect(sub.ok).toBe(true);
    if (!sub.ok) return;
    expect('warehouseId' in sub.body).toBe(false);

    // Even when not required, a non-UUID warehouse id is never sent.
    expect(buildExpenseCreateBody(form({ requiresWarehouse: false, warehouseId: 'WH-OOTY' }))).toEqual({
      ok: false,
      problems: ['warehouse'],
    });
  });

  it('BR-62: trimmed vendor and description are sent when present', () => {
    const r = buildExpenseCreateBody(form({ vendor: '  Local Transport Co. ', description: ' Diesel ', paymentMethod: 'Bank' }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.body.vendor).toBe('Local Transport Co.');
    expect(r.body.description).toBe('Diesel');
    expect(r.body.paymentMethod).toBe('BANK');
  });

  it('BR-62: amount is sent as exact paise-safe Money', () => {
    const cases: [string, string, number][] = [
      ['2400', '2400.00', 240000],
      ['1,250.25', '1250.25', 125025],
      ['₹0.30', '0.30', 30],
      ['500.5', '500.50', 50050],
    ];
    for (const [typed, money, paise] of cases) {
      const r = buildExpenseCreateBody(form({ amountText: typed }));
      expect(r.ok, typed).toBe(true);
      if (!r.ok) continue;
      expect(r.body.amount).toBe(money);
      expect(r.amountPaise).toBe(paise);
    }
  });

  it('BR-62: a zero, malformed or over-numeric(12,2) amount is refused before any request', () => {
    for (const typed of ['', '0', '0.00', '12.345', '-5', 'abc', '12345678901']) {
      expect(buildExpenseCreateBody(form({ amountText: typed })), typed).toEqual({ ok: false, problems: ['amount'] });
    }
    // 10 integer digits is the column bound and is accepted.
    expect(buildExpenseCreateBody(form({ amountText: '9999999999.99' })).ok).toBe(true);
  });

  it('BR-62: the expense date must be a real calendar day', () => {
    expect(buildExpenseCreateBody(form({ expenseDate: '2026-02-30' }))).toEqual({ ok: false, problems: ['date'] });
    expect(buildExpenseCreateBody(form({ expenseDate: '25 Sep 2026' }))).toEqual({ ok: false, problems: ['date'] });
    expect(isIsoCalendarDay('2028-02-29')).toBe(true);
    expect(isIsoCalendarDay('2026-02-29')).toBe(false);
  });

  it('BR-62: vendor and description longer than the API allows are refused', () => {
    expect(buildExpenseCreateBody(form({ vendor: 'v'.repeat(201) }))).toEqual({ ok: false, problems: ['vendor'] });
    expect(buildExpenseCreateBody(form({ description: 'd'.repeat(1001) }))).toEqual({
      ok: false,
      problems: ['description'],
    });
  });
});

describe('finance expense date picker helpers (IST calendar days)', () => {
  it('shifts a calendar day across month and year ends', () => {
    expect(shiftIsoDay('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftIsoDay('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftIsoDay('2026-10-29', -2)).toBe('2026-10-27');
  });

  it('gives the month start and the grid shape of a month', () => {
    expect(monthStartOf('2026-10-29')).toBe('2026-10-01');
    expect(calendarDaysInMonth(2026, 1)).toBe(28);
    expect(calendarDaysInMonth(2028, 1)).toBe(29);
    // 1 Oct 2026 is a Thursday.
    expect(calendarFirstWeekday(2026, 9)).toBe(4);
  });
});
