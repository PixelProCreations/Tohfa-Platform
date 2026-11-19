import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authPalette as P } from '../../../../theme';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { MONTH_KEYS, WEEKDAY_KEYS, nt } from './i18n';
import { ICON_SIZE, styles } from './styles';
import type { NewCropFormApi } from './useNewCropForm';

/** Theme-driven calendar modal for plantation & harvest dates. */
export function CalendarModal({ form }: { form: NewCropFormApi }): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { state, set } = form;
  const { calendarViewYear, calendarViewMonth, selectedCalendarDate } = state;

  const monthName = (index: number): string => nt(`month.${MONTH_KEYS[index] ?? 'january'}`);
  const daysInMonth = new Date(calendarViewYear, calendarViewMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(calendarViewYear, calendarViewMonth, 1).getDay();
  const close = (): void => set({ showDatePicker: false });

  return (
    <Modal statusBarTranslucent navigationBarTranslucent visible={state.showDatePicker} transparent animationType="fade" onRequestClose={close}>
      <View style={[styles.calModalOverlay, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={close} />
        <View style={styles.calModalCard}>
          {/* Header: which date is being selected */}
          <View style={styles.calHeader}>
            <Text style={styles.calFieldBadge}>
              {state.activeDateField === 'plantation'
                ? nt('calendar.plantationDate')
                : nt('calendar.expectedHarvestDate')}
            </Text>
            <Text style={styles.calSelectedDateTitle}>
              {selectedCalendarDate.getDate()} {monthName(selectedCalendarDate.getMonth())}{' '}
              {selectedCalendarDate.getFullYear()}
            </Text>
          </View>

          {/* Month & Year Navigation Row */}
          <View style={styles.calMonthNav}>
            <TouchableOpacity
              style={styles.calNavBtn}
              onPress={form.prevMonth}
              accessibilityRole="button"
              accessibilityLabel={nt('calendar.previousMonthA11y')}
            >
              <ChevronLeftIcon size={ICON_SIZE.nav} color={P.deepGreen} />
            </TouchableOpacity>

            <Text style={styles.calMonthYearLabel}>
              {monthName(calendarViewMonth)} {calendarViewYear}
            </Text>

            <TouchableOpacity
              style={styles.calNavBtn}
              onPress={form.nextMonth}
              accessibilityRole="button"
              accessibilityLabel={nt('calendar.nextMonthA11y')}
            >
              <ChevronRightIcon size={ICON_SIZE.nav} color={P.deepGreen} />
            </TouchableOpacity>
          </View>

          {/* Weekdays Row */}
          <View style={styles.calWeekdaysRow}>
            {WEEKDAY_KEYS.map((key) => (
              <Text key={key} style={styles.calWeekdayText}>
                {nt(`weekday.${key}`)}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.calDaysGrid}>
            {Array.from({ length: firstDayWeekday }).map((_, idx) => (
              <View key={`empty-${idx}`} style={styles.calDayCellEmpty} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isSelected =
                selectedCalendarDate.getFullYear() === calendarViewYear &&
                selectedCalendarDate.getMonth() === calendarViewMonth &&
                selectedCalendarDate.getDate() === day;
              const today = new Date();
              const isToday =
                today.getFullYear() === calendarViewYear &&
                today.getMonth() === calendarViewMonth &&
                today.getDate() === day;

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={styles.calDayCell}
                  onPress={() =>
                    set({ selectedCalendarDate: new Date(calendarViewYear, calendarViewMonth, day) })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${day} ${monthName(calendarViewMonth)} ${calendarViewYear}`}
                >
                  <View
                    style={[
                      styles.calDayInner,
                      isSelected && styles.calDayInnerSelected,
                      !isSelected && isToday && styles.calDayInnerToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        isSelected && styles.calDayTextSelected,
                        !isSelected && isToday && styles.calDayTextToday,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Buttons */}
          <View style={styles.calFooterActions}>
            <TouchableOpacity
              style={styles.calCancelBtn}
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel={nt('calendar.cancelA11y')}
            >
              <Text style={styles.calCancelBtnText}>{nt('calendar.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.calApplyBtn}
              onPress={form.confirmDate}
              accessibilityRole="button"
              accessibilityLabel={nt('calendar.applyA11y')}
            >
              <Text style={styles.calApplyBtnText}>{nt('calendar.apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
