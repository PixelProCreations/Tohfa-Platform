/**
 * Pure logic of the Accounts & Finance hub (screens/finance-hub/financeHubLogic):
 * the 30-day IST range, the tile gate (callback AND code, missing can denies),
 * the figures (dash unless a real report backs them) and the flow-bar widths
 * computed from integer paise.
 */
import { describe, expect, it, vi } from 'vitest';
import type { Paise } from '@tohfa/shared-types';
import {
  FINANCE_HUB_TILES,
  financeHubFigures,
  financeHubFlowBars,
  financeHubRange,
  visibleFinanceHubTiles,
} from '../screens/finance-hub/financeHubLogic';
import type { FinanceReportTotals } from '../screens/warehouse/finance-expenses/mappers';
import { makeCan } from '../permissions/can';

const DASH = '—';

function totals(totalPaise: number): FinanceReportTotals {
  return { from: '2026-10-13', to: '2026-11-11', totalPaise: totalPaise as Paise, count: 1, byDay: [], byGroup: [], byPaymentMethod: [] };
}

describe('financeHubRange', () => {
  it('is 30 IST days including today, across a month end', () => {
    expect(financeHubRange('2026-11-11')).toEqual({ from: '2026-10-13', to: '2026-11-11' });
    expect(financeHubRange('2026-03-01')).toEqual({ from: '2026-01-31', to: '2026-03-01' });
  });
});

describe('visibleFinanceHubTiles', () => {
  it('missing can denies every tile', () => {
    const actions = Object.fromEntries(FINANCE_HUB_TILES.map((t) => [t.callback, vi.fn()]));
    expect(visibleFinanceHubTiles(undefined, actions)).toEqual([]);
  });

  it('regular tiles (alwaysShow: false) need the callback and one of the codes', () => {
    const expenses = FINANCE_HUB_TILES.find((t) => t.id === 'expenses')!;
    expect(expenses.alwaysShow).toBeFalsy();
    expect(visibleFinanceHubTiles(makeCan(['finance.expense.log']), { onOpenExpenses: vi.fn() }).map((t) => t.id)).toEqual(['expenses']);
    expect(visibleFinanceHubTiles(makeCan(['finance.expense.log']), {})).toEqual([]);
    expect(visibleFinanceHubTiles(makeCan([]), { onOpenExpenses: vi.fn() })).toEqual([]);
    expect(expenses.codes).toEqual(['finance.expense.log']);
  });

  it('alwaysShow tiles (duesPayouts, reportExport) need only the code, not a callback', () => {
    // duesPayouts: renders with code alone (no callback needed).
    expect(visibleFinanceHubTiles(makeCan(['payout.dues.view']), {}).map((t) => t.id)).toEqual(['duesPayouts']);
    // reportExport: renders with code alone.
    expect(visibleFinanceHubTiles(makeCan(['report.export.file']), {}).map((t) => t.id)).toEqual(['reportExport']);
    // Still denied without the code even with alwaysShow.
    expect(visibleFinanceHubTiles(makeCan([]), {}).map((t) => t.id)).toEqual([]);
  });
});

describe('financeHubFigures', () => {
  it('everything is the dash without reports', () => {
    const f = financeHubFigures({}, DASH);
    expect(Object.values(f)).toEqual(Array(8).fill(DASH));
  });

  it('sales and expenses format exact paise; the rest stay dashes', () => {
    const f = financeHubFigures({ revenue: totals(21460010), expenses: totals(30) }, DASH);
    expect(f.sales).toBe('₹2,14,600.10');
    expect(f.expenses).toBe('₹0.30');
    expect([f.farmerPurchase, f.outstandingDues, f.walletLiability, f.pendingPayouts, f.refunds, f.netSummary]).toEqual(Array(6).fill(DASH));
  });
});

describe('financeHubFlowBars', () => {
  it('no reports: three dash rows with no fill', () => {
    const bars = financeHubFlowBars({}, DASH);
    expect(bars.map((b) => [b.id, b.value, b.fillPercent])).toEqual([
      ['revenue', DASH, null],
      ['purchase', DASH, null],
      ['expense', DASH, null],
    ]);
  });

  it('fills are relative to the largest sourced total; purchase has no source', () => {
    const bars = financeHubFlowBars({ revenue: totals(400_00), expenses: totals(100_00) }, DASH);
    expect(bars.map((b) => [b.id, b.value, b.fillPercent])).toEqual([
      ['revenue', '₹400', 100],
      ['purchase', DASH, null],
      ['expense', '₹100', 25],
    ]);
  });

  it('all-zero totals give empty fills, not NaN', () => {
    const bars = financeHubFlowBars({ revenue: totals(0), expenses: totals(0) }, DASH);
    expect(bars[0]!.fillPercent).toBe(0);
    expect(bars[2]!.fillPercent).toBe(0);
  });
});
