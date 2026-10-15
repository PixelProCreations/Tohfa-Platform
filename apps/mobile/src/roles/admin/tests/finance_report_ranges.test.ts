/**
 * Finance report range presets (BR-63 reports take an inclusive IST from/to).
 * Pure date arithmetic; no span cap is applied on the client (system_config).
 */
import { describe, expect, it } from 'vitest';
import {
  addDays,
  previousMonth,
  REPORT_RANGE_PRESETS,
  reportRange,
} from '../screens/warehouse/finance-expenses/reportRanges';

describe('finance report ranges', () => {
  it('offers the four presets in order', () => {
    expect(REPORT_RANGE_PRESETS).toEqual(['today', 'last7', 'monthToDate', 'lastMonth']);
  });

  it('today is a one-day range', () => {
    expect(reportRange('today', '2026-10-15')).toEqual({ from: '2026-10-15', to: '2026-10-15' });
  });

  it('last 7 days includes today and crosses a month end', () => {
    expect(reportRange('last7', '2026-10-15')).toEqual({ from: '2026-10-09', to: '2026-10-15' });
    expect(reportRange('last7', '2026-03-03')).toEqual({ from: '2026-02-25', to: '2026-03-03' });
  });

  it('month to date starts on the 1st', () => {
    expect(reportRange('monthToDate', '2026-10-15')).toEqual({ from: '2026-10-01', to: '2026-10-15' });
    expect(reportRange('monthToDate', '2026-10-01')).toEqual({ from: '2026-10-01', to: '2026-10-01' });
  });

  it('last month is the whole previous calendar month, including February and a year change', () => {
    expect(reportRange('lastMonth', '2026-10-15')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(previousMonth('2026-03-31')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(previousMonth('2028-03-01')).toEqual({ from: '2028-02-01', to: '2028-02-29' });
    expect(previousMonth('2027-01-10')).toEqual({ from: '2026-12-01', to: '2026-12-31' });
  });

  it('addDays crosses a year end both ways', () => {
    expect(addDays('2026-12-31', 1)).toEqual('2027-01-01');
    expect(addDays('2027-01-01', -1)).toEqual('2026-12-31');
  });

  it('rejects a malformed day instead of sending it', () => {
    expect(() => reportRange('today', '15/10/2026')).toThrow();
  });
});
