/**
 * Per-kind copy and mock data for the report screens.
 *
 * Mock only: there is no returns/sales report endpoint the screens call yet
 * (SPEC_GAPS.md W3b-1). The values are the ones the two twin screens
 * hard-coded, moved here so the screens hold no data.
 */
import type { ReportKind, ReportKpi, ReportRecord } from './types';

export interface ReportCopy {
  title: string;
  /** Four KPI tiles, rendered two per row. */
  kpis: readonly [ReportKpi, ReportKpi, ReportKpi, ReportKpi];
}

export const REPORT_COPY: Record<ReportKind, ReportCopy> = {
  RETURNS: {
    title: 'Returns Report',
    kpis: [
      { label: 'Total Returns', value: '22' },
      { label: 'Pending', value: '5' },
      { label: 'Completed', value: '15' },
      { label: 'Refunded', value: '14' },
    ],
  },
  SALES: {
    title: 'Sales Report',
    kpis: [
      { label: 'Total Sales', value: '₹5,84,200' },
      { label: 'Today', value: '₹24,850' },
      { label: 'Transactions', value: '284' },
      { label: 'Avg Sale', value: '₹2,057' },
    ],
  },
};

/**
 * The single sample record both twins showed. The twins hard-coded its
 * warehouse as a literal name; it is left unset so the screen falls back to
 * the viewer's scope instead.
 */
export const SAMPLE_REPORT_RECORD: ReportRecord = {
  id: '001245',
  dateText: '25 Sep 2026',
};
