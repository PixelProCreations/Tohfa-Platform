import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../theme';

export type AdminCalendarDateFormat =
  | 'DD-MM-YYYY'
  | 'DD/MM/YYYY'
  | 'YYYY-MM-DD'
  | 'DD MMM YYYY';

export interface AdminCalendarPickerModalProps {
  visible: boolean;
  value?: string | undefined;
  title?: string | undefined;
  format?: AdminCalendarDateFormat | undefined;
  onSelect: (formattedDate: string) => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const MONTH_ABBR = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const CALENDAR_CELL = `${100 / 7}%` as const;
const CALENDAR_CELL_HEIGHT = 38;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parseInitialDate(raw?: string): { year: number; month: number; day: number } {
  const fallback = { year: 2026, month: 9, day: 28 }; // 28-10-2026
  if (!raw || !raw.trim()) return fallback;
  const s = raw.trim();

  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const d = Number(dmy[1]);
    const m = Number(dmy[2]) - 1;
    const y = Number(dmy[3]);
    if (y >= 1900 && y <= 2100 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
      return { year: y, month: m, day: d };
    }
  }

  // YYYY-MM-DD
  const ymd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymd) {
    const y = Number(ymd[1]);
    const m = Number(ymd[2]) - 1;
    const d = Number(ymd[3]);
    if (y >= 1900 && y <= 2100 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
      return { year: y, month: m, day: d };
    }
  }

  // DD MMM YYYY (e.g. 28 Oct 2026)
  const dMonY = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (dMonY) {
    const d = Number(dMonY[1]);
    const monStr = (dMonY[2] ?? '').toLowerCase();
    const m = MONTH_ABBR.findIndex((abbr) => abbr.toLowerCase() === monStr);
    const y = Number(dMonY[3]);
    if (m >= 0 && y >= 1900 && y <= 2100 && d >= 1 && d <= 31) {
      return { year: y, month: m, day: d };
    }
  }

  return fallback;
}

function formatDateValue(
  year: number,
  month: number,
  day: number,
  format: AdminCalendarDateFormat,
): string {
  if (format === 'YYYY-MM-DD') {
    return `${year}-${pad2(month + 1)}-${pad2(day)}`;
  }
  if (format === 'DD/MM/YYYY') {
    return `${pad2(day)}/${pad2(month + 1)}/${year}`;
  }
  if (format === 'DD MMM YYYY') {
    const abbr = MONTH_ABBR[month] ?? 'Jan';
    return `${day} ${abbr} ${year}`;
  }
  return `${pad2(day)}-${pad2(month + 1)}-${year}`;
}

export function AdminCalendarPickerModal({
  visible,
  value,
  title = 'Select Date',
  format = 'DD-MM-YYYY',
  onSelect,
  onClose,
}: AdminCalendarPickerModalProps): React.JSX.Element {
  const initial = useMemo(() => parseInitialDate(value), [value]);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const [selectedDay, setSelectedDay] = useState(initial.day);

  useEffect(() => {
    if (visible) {
      const parsed = parseInitialDate(value);
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
      setSelectedDay(parsed.day);
    }
  }, [visible, value]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const monthLabel = `${MONTH_NAMES[viewMonth] ?? 'October'} ${viewYear}`;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
      setSelectedDay((d) => Math.min(d, 31));
    } else {
      const nextM = viewMonth - 1;
      const maxD = new Date(viewYear, nextM + 1, 0).getDate();
      setViewMonth(nextM);
      setSelectedDay((d) => Math.min(d, maxD));
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
      setSelectedDay((d) => Math.min(d, 31));
    } else {
      const nextM = viewMonth + 1;
      const maxD = new Date(viewYear, nextM + 1, 0).getDate();
      setViewMonth(nextM);
      setSelectedDay((d) => Math.min(d, maxD));
    }
  };

  const handleApply = () => {
    const safeDay = Math.min(selectedDay, daysInMonth);
    onSelect(formatDateValue(viewYear, viewMonth, safeDay, format));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity style={styles.card} activeOpacity={1} onPress={() => undefined}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close calendar"
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6l12 12"
                  stroke={adminColors.ink}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          <View style={styles.monthBar}>
            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={handlePrevMonth}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 18l-6-6 6-6"
                  stroke={adminColors.brandDeep}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={handleNextMonth}
              accessibilityRole="button"
              accessibilityLabel="Next month"
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M9 18l6-6-6-6"
                  stroke={adminColors.brandDeep}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {WEEKDAYS.map((day, idx) => (
              <View key={`wd-${idx}`} style={styles.cell}>
                <Text style={styles.weekday}>{day}</Text>
              </View>
            ))}
            {Array.from({ length: firstWeekday }).map((_, idx) => (
              <View key={`empty-${idx}`} style={styles.cell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const active = day === selectedDay;
              return (
                <TouchableOpacity
                  key={day}
                  style={[styles.cell, active && styles.cellActive]}
                  onPress={() => setSelectedDay(day)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.dayText, active && styles.dayTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApply}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 22, 19, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  title: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: adminSpacing.md,
  },
  cell: {
    width: CALENDAR_CELL,
    height: CALENDAR_CELL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.full,
  },
  weekday: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },
  dayText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dayTextActive: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...adminType.rowTitle,
    fontWeight: '600',
    color: adminColors.ink,
  },
  applyBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    ...adminType.rowTitle,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});

