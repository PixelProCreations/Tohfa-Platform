
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from './theme';

export interface DatePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date, formattedDate: string) => void;
  value: Date | string | null | undefined;
  title?: string;
  minDate?: Date;
  maxDate?: Date;
  format?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Accepts whatever a caller's own date-ish state happens to be -- a real `Date`, an ISO
 * string, or a `DD / MM / YYYY`-style string (this app's own registration screens hold dates
 * as that formatted string, not a `Date`, since it's typed directly as well as filled by this
 * picker) -- and always returns a valid `Date`, defaulting to now rather than throwing on
 * anything unparseable so a bad/empty draft value can never crash the picker on open.
 */
export function parseDateInput(value: Date | string | null | undefined): Date {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? new Date() : value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) return new Date();

    // `DD / MM / YYYY` (and tolerant variants: no spaces, `-` separators) -- this app's own
    // registration date fields, which is the shape this picker is actually fed in practice.
    const slashMatch = trimmed.match(/^(\d{1,2})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{4})$/);
    if (slashMatch?.[1] && slashMatch[2] && slashMatch[3]) {
      const day = Number(slashMatch[1]);
      const month = Number(slashMatch[2]);
      const year = Number(slashMatch[3]);
      const parsed = new Date(year, month - 1, day);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // Fall back to whatever the JS engine's own parser accepts (ISO 8601, etc.).
    const nativeParsed = new Date(trimmed);
    if (!isNaN(nativeParsed.getTime())) return nativeParsed;

    return new Date();
  }
  return new Date();
}

/** Token-substitution formatter: `DD`, `MM`, `YYYY`, `MMM` (short month name). */
export function formatDateOutput(date: Date, format: string): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  const monthShort = MONTH_SHORT_NAMES[date.getMonth()] ?? '';

  return format
    .replace(/YYYY/g, year)
    .replace(/MMM/g, monthShort)
    .replace(/MM/g, month)
    .replace(/DD/g, day);
}

export const DatePicker: React.FC<DatePickerProps> = ({
  visible,
  onClose,
  onSelect,
  value,
  title = 'Select Date',
  minDate,
  maxDate,
  format = 'DD / MM / YYYY',
}) => {
  const theme = useTheme();

  const [currentMode, setCurrentMode] = useState<'days' | 'month' | 'year'>('days');

  const initialDate = useMemo(() => {
    const parsed = parseDateInput(value);
    if (maxDate && parsed > maxDate) return new Date(maxDate.getTime());
    if (minDate && parsed < minDate) return new Date(minDate.getTime());
    return parsed;
  }, [value, minDate, maxDate]);

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  const yearScrollViewRef = useRef<ScrollView>(null);

  // Sync state when the modal becomes visible or the caller's value changes underneath it --
  // re-derived fresh each open rather than trusted as still-current stale state.
  useEffect(() => {
    if (visible) {
      const parsed = parseDateInput(value);
      const safe =
        maxDate && parsed > maxDate
          ? new Date(maxDate.getTime())
          : minDate && parsed < minDate
            ? new Date(minDate.getTime())
            : parsed;
      setSelectedDate(safe);
      setViewYear(safe.getFullYear());
      setViewMonth(safe.getMonth());
      setCurrentMode('days');
    }
  }, [visible, value, minDate, maxDate]);

  const minYear = minDate ? minDate.getFullYear() : 1920;
  const maxYear = maxDate ? maxDate.getFullYear() : new Date().getFullYear() + 20;

  const yearsList = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear]);

  // Auto-scroll to the selected year when year mode opens, so a birth year decades back
  // doesn't leave the farmer scrolling through a hundred rows to find where they landed.
  useEffect(() => {
    if (currentMode === 'year' && yearScrollViewRef.current) {
      const index = yearsList.indexOf(viewYear);
      if (index >= 0) {
        const rowIndex = Math.floor(index / 3);
        const approxOffset = Math.max(0, rowIndex * 50 - 60);
        setTimeout(() => {
          yearScrollViewRef.current?.scrollTo({ y: approxOffset, animated: false });
        }, 50);
      }
    }
  }, [currentMode, viewYear, yearsList]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      if (viewYear > minYear) {
        setViewMonth(11);
        setViewYear((y) => y - 1);
      }
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      if (viewYear < maxYear) {
        setViewMonth(0);
        setViewYear((y) => y + 1);
      }
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  const isDateDisabled = (day: number) => {
    const target = new Date(viewYear, viewMonth, day);
    if (minDate) {
      const minCheck = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
      if (target < minCheck) return true;
    }
    if (maxDate) {
      const maxCheck = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
      if (target > maxCheck) return true;
    }
    return false;
  };

  const isToday = (day: number) => {
    const now = new Date();
    return now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === day;
  };

  const isDaySelected = (day: number) => {
    return (
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  };

  const handleSelectDay = (day: number) => {
    if (isDateDisabled(day)) return;
    setSelectedDate(new Date(viewYear, viewMonth, day));
  };

  const handleSelectMonth = (monthIndex: number) => {
    setViewMonth(monthIndex);
    // Keep the selected day valid for the new month (e.g. the 31st doesn't exist in April).
    const maxDays = new Date(viewYear, monthIndex + 1, 0).getDate();
    const safeDay = Math.min(selectedDate.getDate(), maxDays);
    setSelectedDate(new Date(viewYear, monthIndex, safeDay));
    setCurrentMode('days');
  };

  const handleSelectYear = (year: number) => {
    setViewYear(year);
    const maxDays = new Date(year, viewMonth + 1, 0).getDate();
    const safeDay = Math.min(selectedDate.getDate(), maxDays);
    setSelectedDate(new Date(year, viewMonth, safeDay));
    setCurrentMode('days');
  };

  const handleApply = () => {
    onSelect(selectedDate, formatDateOutput(selectedDate, format));
    onClose();
  };

  const primaryColor = theme.colors.primary || '#2E7D32';
  const isPrevMonthDisabled = viewYear <= minYear && viewMonth === 0;
  const isNextMonthDisabled = viewYear >= maxYear && viewMonth === 11;

  // Leading blank cells so day 1 lands under the correct weekday column.
  const leadingBlanks = Array.from({ length: startDayOfWeek }, (_, i) => `blank-${i}`);
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={[styles.dialog, { backgroundColor: theme.colors.white }]}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Close date picker"
                  style={styles.closeBtn}
                >
                  <Text style={[styles.closeIcon, { color: theme.colors.onSurfaceVariant ?? '#666' }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Month / Year nav bar -- tapping the label switches view mode instead of only
                  the arrows moving month-by-month. */}
              <View style={styles.navBar}>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={handlePrevMonth}
                  disabled={isPrevMonthDisabled}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                >
                  <Text
                    style={[
                      styles.navArrow,
                      { color: isPrevMonthDisabled ? theme.colors.onSurfaceVariant ?? '#bbb' : primaryColor },
                    ]}
                  >
                    ‹
                  </Text>
                </TouchableOpacity>

                <View style={styles.navLabels}>
                  <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() => setCurrentMode(currentMode === 'month' ? 'days' : 'month')}
                    accessibilityRole="button"
                    accessibilityLabel="Choose month"
                  >
                    <Text style={[styles.navLabelText, { color: theme.colors.onSurface }]}>
                      {MONTH_NAMES[viewMonth]}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() => setCurrentMode(currentMode === 'year' ? 'days' : 'year')}
                    accessibilityRole="button"
                    accessibilityLabel="Choose year"
                  >
                    <Text style={[styles.navLabelText, { color: primaryColor }]}>{viewYear}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={handleNextMonth}
                  disabled={isNextMonthDisabled}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                >
                  <Text
                    style={[
                      styles.navArrow,
                      { color: isNextMonthDisabled ? theme.colors.onSurfaceVariant ?? '#bbb' : primaryColor },
                    ]}
                  >
                    ›
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Body: exactly one of the three modes at a time. */}
              {currentMode === 'days' ? (
                <View>
                  <View style={styles.weekdayRow}>
                    {WEEKDAY_NAMES.map((wd) => (
                      <View key={wd} style={styles.weekdayCell}>
                        <Text style={[styles.weekdayText, { color: theme.colors.onSurfaceVariant ?? '#888' }]}>
                          {wd}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.dayGrid}>
                    {leadingBlanks.map((key) => (
                      <View key={key} style={styles.dayCell} />
                    ))}
                    {dayNumbers.map((day) => {
                      const disabled = isDateDisabled(day);
                      const selected = isDaySelected(day);
                      const today = isToday(day);
                      return (
                        <TouchableOpacity
                          key={day}
                          activeOpacity={0.6}
                          style={styles.dayCell}
                          disabled={disabled}
                          onPress={() => handleSelectDay(day)}
                          accessibilityRole="button"
                          accessibilityLabel={`${day} ${MONTH_NAMES[viewMonth]} ${viewYear}`}
                          accessibilityState={{ disabled, selected }}
                        >
                          <View
                            style={[
                              styles.dayCircle,
                              selected ? { backgroundColor: primaryColor } : null,
                              !selected && today ? { borderWidth: 1, borderColor: primaryColor } : null,
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayText,
                                {
                                  color: selected
                                    ? theme.colors.white
                                    : disabled
                                      ? theme.colors.onSurfaceVariant ?? '#ccc'
                                      : theme.colors.onSurface,
                                },
                              ]}
                            >
                              {day}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {currentMode === 'month' ? (
                <View style={styles.monthGrid}>
                  {MONTH_SHORT_NAMES.map((name, index) => {
                    const selected = index === viewMonth;
                    return (
                      <TouchableOpacity
                        key={name}
                        activeOpacity={0.6}
                        style={[styles.monthCell, selected ? { backgroundColor: primaryColor } : null]}
                        onPress={() => handleSelectMonth(index)}
                        accessibilityRole="button"
                        accessibilityLabel={name}
                        accessibilityState={{ selected }}
                      >
                        <Text
                          style={[
                            styles.monthCellText,
                            { color: selected ? theme.colors.white : theme.colors.onSurface },
                          ]}
                        >
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}

              {currentMode === 'year' ? (
                <ScrollView ref={yearScrollViewRef} style={styles.yearScroll}>
                  <View style={styles.yearGrid}>
                    {yearsList.map((year) => {
                      const selected = year === viewYear;
                      return (
                        <TouchableOpacity
                          key={year}
                          activeOpacity={0.6}
                          style={[styles.yearCell, selected ? { backgroundColor: primaryColor } : null]}
                          onPress={() => handleSelectYear(year)}
                          accessibilityRole="button"
                          accessibilityLabel={String(year)}
                          accessibilityState={{ selected }}
                        >
                          <Text
                            style={[
                              styles.yearCellText,
                              { color: selected ? theme.colors.white : theme.colors.onSurface },
                            ]}
                          >
                            {year}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              ) : null}

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.footerBtn}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Text style={[styles.footerBtnText, { color: theme.colors.onSurfaceVariant ?? '#666' }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.footerBtn}
                  onPress={handleApply}
                  accessibilityRole="button"
                  accessibilityLabel="Apply selected date"
                >
                  <Text style={[styles.footerBtnText, { color: primaryColor, fontWeight: '700' }]}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 16,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navArrow: {
    fontSize: 26,
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  navLabels: {
    flexDirection: 'row',
    gap: 8,
  },
  navLabelText: {
    fontSize: 15,
    fontWeight: '700',
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  monthCell: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellText: {
    fontSize: 13,
    fontWeight: '600',
  },
  yearScroll: {
    maxHeight: 260,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  yearCell: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearCellText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    marginTop: 16,
  },
  footerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  footerBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
