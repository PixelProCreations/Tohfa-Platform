/**
 * Attendance History (design M14-05), the remaining client work:
 *   - a By Date row opens the existing Attendance Detail for that staff member's
 *     day (GET /admin/staff-attendance?staffId&from=date&to=date);
 *   - a By Staff row opens a monthly-totals sheet backed by
 *     GET /admin/staff-attendance/summary?month&staffId;
 *   - From / To can be picked (the list and the summary both take from/to);
 *     the span cap is the server's (system_config staff_attendance_max_range_days,
 *     a 422 the screen shows as an error), never a client constant.
 * Read-only: nothing here marks attendance (admin.staff.attendance.mark is a
 * pending spec gap, rules contradiction 27). BR-84.
 *
 * The pure parts are tested directly; the wiring is pinned by reading the
 * sources, because JSX cannot render in this plain-Node vitest.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AttendanceSummaryDto } from '../api/attendance';
import en from '../i18n/en.json';
import ta from '../i18n/ta.json';
import {
  historyEntryRecord,
  historySelectionDates,
  monthSheetTitle,
  monthSummaryParams,
  toMonthTotals,
  withRangeEdge,
} from '../screens/warehouse/staff-attendance/mappers';
import type { AttendanceHistoryEntry } from '../screens/warehouse/staff-attendance/types';

const STAFF_DIR = path.join(__dirname, '..', 'screens', 'warehouse', 'staff-attendance');

/** Source with comment lines dropped, so doc comments do not count. */
function code(file: string): string {
  return fs
    .readFileSync(path.join(STAFF_DIR, file), 'utf8')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line) && !/^\s*\{\/\*/.test(line))
    .join('\n');
}

const STAFF = '44444444-4444-4444-8444-444444444444';
const TODAY = '2026-09-25';

const entry: AttendanceHistoryEntry = {
  id: 'att-1',
  staffId: STAFF,
  date: '2026-09-24',
  dateText: '24 Sep 2026',
  name: 'Arun Kumar',
  designation: 'Driver',
  status: 'PRESENT',
  timeRange: '08:58 AM – 06:10 PM',
};

describe('historyEntryRecord: a By Date row opens that day in Attendance Detail', () => {
  it('BR-84: carries the staff id and the day the row is for, plus the name to show while loading', () => {
    expect(historyEntryRecord(entry)).toEqual({ staffId: STAFF, date: '2026-09-24', name: 'Arun Kumar', designation: 'Driver' });
  });
});

describe('historySelectionDates: a preset range or the picked From / To', () => {
  it('a preset is computed from today (as before)', () => {
    expect(historySelectionDates('7 Days', { from: '2026-09-01', to: '2026-09-02' }, TODAY)).toEqual({ from: '2026-09-19', to: TODAY });
  });

  it('Custom is the picked range as is', () => {
    expect(historySelectionDates('Custom', { from: '2026-08-01', to: '2026-08-31' }, TODAY)).toEqual({ from: '2026-08-01', to: '2026-08-31' });
  });
});

describe('withRangeEdge: picking From or To keeps a valid range', () => {
  const range = { from: '2026-09-01', to: '2026-09-25' };

  it('sets the picked edge', () => {
    expect(withRangeEdge(range, 'from', '2026-08-15', TODAY)).toEqual({ from: '2026-08-15', to: '2026-09-25' });
    expect(withRangeEdge(range, 'to', '2026-09-10', TODAY)).toEqual({ from: '2026-09-01', to: '2026-09-10' });
  });

  it('BR-84b: From after To moves To up to it, and To before From moves From down (from <= to)', () => {
    expect(withRangeEdge({ from: '2026-09-01', to: '2026-09-10' }, 'from', '2026-09-20', TODAY)).toEqual({ from: '2026-09-20', to: '2026-09-20' });
    expect(withRangeEdge(range, 'to', '2026-08-20', TODAY)).toEqual({ from: '2026-08-20', to: '2026-08-20' });
  });

  it('BR-84f: a day after today (Asia/Kolkata) is clamped to today', () => {
    expect(withRangeEdge(range, 'to', '2026-10-03', TODAY)).toEqual({ from: '2026-09-01', to: TODAY });
    expect(withRangeEdge(range, 'from', '2026-10-03', TODAY)).toEqual({ from: TODAY, to: TODAY });
  });
});

describe('the monthly-totals sheet', () => {
  it('BR-84b: asks the summary for one month (YYYY-MM) of one staff member, never a from/to pair as well', () => {
    expect(monthSummaryParams(STAFF, '2026-09-25')).toEqual({ staffId: STAFF, month: '2026-09' });
    expect(monthSummaryParams(STAFF, '2026-09-25')).not.toHaveProperty('from');
    expect(monthSummaryParams(STAFF, '2026-09-25')).not.toHaveProperty('to');
  });

  it("BR-84h: shows the server's exact counts for that member", () => {
    const dto: AttendanceSummaryDto = {
      from: '2026-09-01',
      to: '2026-09-30',
      totals: { present: 22, absent: 2, leave: 1, marked: 25 },
      byStaff: [
        { staffId: STAFF, staffCode: 'STF-0001', staffName: 'Arun Kumar', designation: 'Driver', warehouseId: 'w', present: 22, absent: 2, leave: 1, marked: 25 },
      ],
    };
    expect(toMonthTotals(dto.totals)).toEqual({ present: 22, absent: 2, leave: 1 });
  });

  it('shows no counts until the summary has loaded (never a 0 placeholder)', () => {
    expect(toMonthTotals(undefined)).toBeUndefined();
  });

  it('titles the sheet with the month and the member', () => {
    expect(monthSheetTitle('2026-09-25', 'Arun Kumar')).toBe('Sep 2026 — Arun Kumar');
  });
});

describe('Attendance History wiring (source)', () => {
  it('StaffFlow opens Attendance Detail from a History row', () => {
    const flow = code('StaffFlow.tsx');
    expect(flow).toMatch(/<AttendanceHistoryScreen[\s\S]*?onSelectRecord=\{\(record\) => navigate\('AttendanceDetail', \{ record \}\)\}/);
  });

  it('By Date rows are tappable and By Staff rows open the month sheet', () => {
    const screen = code('AttendanceHistoryScreen.tsx');
    expect(screen).toMatch(/onPress=\{onSelectRecord \? \(\) => onSelectRecord\(historyEntryRecord\(entry\)\) : undefined\}/);
    expect(screen).toMatch(/onPress=\{\(\) => setMonthStaff\(\{ staffId: row\.staffId, name: row\.name \}\)\}/);
    expect(screen).toMatch(/<AttendanceMonthSheet/);
    expect(screen).toMatch(/useAttendanceSummary\(scope, monthSummaryParams\(/);
  });

  it('From / To open the date picker and set a Custom range', () => {
    const screen = code('AttendanceHistoryScreen.tsx');
    expect(screen).toMatch(/<DatePickerModal/);
    expect(screen).toMatch(/withRangeEdge\(dates, pickerEdge, pickerDate, today\)/);
    expect(screen).toMatch(/setSelection\('Custom'\)/);
  });

  it('History stays read-only: no attendance marking from it', () => {
    const screen = code('AttendanceHistoryScreen.tsx');
    expect(screen).not.toMatch(/useMarkAttendanceMutation|useBulkAttendanceMutation|canMarkAttendance/);
    expect(code('AttendanceMonthSheet.tsx')).not.toMatch(/markAttendance|Mutation/);
  });
});

describe('Attendance History strings (en + ta)', () => {
  const KEYS = [
    'staff.history.monthSheet.title',
    'staff.history.monthSheet.note',
    'staff.history.pickFrom',
    'staff.history.pickTo',
    'staff.kpi.present',
    'staff.kpi.absent',
    'staff.kpi.leave',
  ];

  it.each(KEYS)('%s exists in en.json and ta.json', (key) => {
    expect(en).toHaveProperty([key]);
    expect(ta).toHaveProperty([key]);
  });
});
