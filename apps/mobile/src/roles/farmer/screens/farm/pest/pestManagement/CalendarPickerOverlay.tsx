import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import { MONTHS_FULL } from './dateUtils';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { WEEKDAY_LABEL_KEYS } from './labels';
import { styles } from './styles';
import type { ReportFormState } from './useReportForm';

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];


type CalendarFormSlice = Pick<
  ReportFormState,
  | 'setIsCalendarOpen'
  | 'calendarDate'
  | 'setCalendarDate'
  | 'calendarYear'
  | 'calendarMonth'
  | 'isYearPickerOpen'
  | 'setIsYearPickerOpen'
  | 'handlePrevMonth'
  | 'handleNextMonth'
  | 'handleApplyCalendarDate'
  | 'handleSelectYear'
>;

/** In-modal dynamic calendar picker for "Date Detected". */
export function CalendarPickerOverlay({ form }: { form: CalendarFormSlice }): React.JSX.Element {
  const {
    setIsCalendarOpen,
    calendarDate,
    setCalendarDate,
    calendarYear,
    calendarMonth,
    isYearPickerOpen,
    setIsYearPickerOpen,
    handlePrevMonth,
    handleNextMonth,
    handleApplyCalendarDate,
    handleSelectYear,
  } = form;

  return (
    <View style={styles.inModalOverlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setIsCalendarOpen(false)} />
      <View style={styles.calModalCard}>
        {/* Header */}
        <View style={styles.calHeader}>
          <Text style={styles.calFieldBadge}>{t('farmer.pestManagement.report.dateDetected')}</Text>
          <Text style={styles.calSelectedDateTitle}>
            {calendarDate.getDate()} {MONTHS_FULL[calendarDate.getMonth()]} {calendarYear}
          </Text>
        </View>

        {/* Navigation Row */}
        <View style={styles.calMonthNav}>
          <TouchableOpacity
            style={styles.calNavBtn}
            onPress={handlePrevMonth}
            accessibilityLabel={t('farmer.pestManagement.report.prevMonth')}
          >
            <ChevronLeftIcon size={18} color={P.deepGreen} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.calMonthYearBtn}
            onPress={() => setIsYearPickerOpen(!isYearPickerOpen)}
            activeOpacity={0.75}
          >
            <Text style={styles.calMonthYearLabel}>
              {MONTHS_FULL[calendarMonth]} {calendarYear}
            </Text>
            <ChevronDownIcon size={14} color={P.deepGreen} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.calNavBtn}
            onPress={handleNextMonth}
            accessibilityLabel={t('farmer.pestManagement.report.nextMonth')}
          >
            <ChevronRightIcon size={18} color={P.deepGreen} />
          </TouchableOpacity>
        </View>

        {/* Year Quick Selector */}
        {isYearPickerOpen ? (
          <View style={styles.yearGridContainer}>
            <ScrollView style={styles.yearScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.yearGrid}>
                {YEAR_OPTIONS.map((y) => {
                  const isSel = calendarYear === y;
                  return (
                    <TouchableOpacity
                      key={`yr-${y}`}
                      style={[styles.yearChip, isSel && styles.yearChipActive]}
                      onPress={() => handleSelectYear(y)}
                    >
                      <Text style={[styles.yearChipText, isSel && styles.yearChipTextActive]}>{y}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        ) : (
          <>
            {/* Weekdays Row */}
            <View style={styles.calWeekdaysRow}>
              {WEEKDAY_LABEL_KEYS.map((key) => (
                <Text key={key} style={styles.calWeekdayText}>
                  {t(key)}
                </Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.calDaysGrid}>
              {Array.from({ length: new Date(calendarYear, calendarMonth, 1).getDay() }).map((_, idx) => (
                <View key={`empty-${idx}`} style={styles.calDayCellEmpty} />
              ))}
              {Array.from({ length: new Date(calendarYear, calendarMonth + 1, 0).getDate() }).map((_, idx) => {
                const day = idx + 1;
                const isSelected =
                  calendarDate.getFullYear() === calendarYear &&
                  calendarDate.getMonth() === calendarMonth &&
                  calendarDate.getDate() === day;
                const isToday =
                  new Date().getFullYear() === calendarYear &&
                  new Date().getMonth() === calendarMonth &&
                  new Date().getDate() === day;

                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={styles.calDayCell}
                    onPress={() => setCalendarDate(new Date(calendarYear, calendarMonth, day))}
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
          </>
        )}

        {/* Actions */}
        <View style={styles.calFooterActions}>
          <TouchableOpacity style={styles.calCancelBtn} onPress={() => setIsCalendarOpen(false)}>
            <Text style={styles.calCancelBtnText}>{t('farmer.pestManagement.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calApplyBtn} onPress={handleApplyCalendarDate}>
            <Text style={styles.calApplyBtnText}>{t('farmer.pestManagement.report.applyDate')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
