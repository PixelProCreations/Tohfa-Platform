import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authPalette as P } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import { calendarStyles as styles } from './calendarStyles';
import { af } from './i18n';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { formatDisplayDate, monthName, WEEKDAY_LETTER_KEYS } from './model';
import type { DateField, DatePicker } from './useDatePicker';

/** The year quick-selector lists this many years, newest first. */
const YEAR_PICKER_LATEST = 2026;
const YEAR_PICKER_COUNT = 75;
const YEARS = Array.from({ length: YEAR_PICKER_COUNT }, (_, i) => YEAR_PICKER_LATEST - i);

export interface DatePickerModalProps {
  picker: DatePicker;
  /** Receives the picked day as a form date string ("02 Jun 2026"). */
  onApply: (field: DateField, value: string) => void;
}

/** RegisterAnimalScreen's calendar for Date of Birth / Purchase Date. */
export function DatePickerModal({ picker, onApply }: DatePickerModalProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { isOpen, field, date, year, month, isYearPickerOpen } = picker.state;

  const handleApply = () => {
    onApply(field, formatDisplayDate(date));
    picker.close();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={picker.close}
    >
      <View style={styles.calModalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={picker.close} />
        <View style={[styles.calModalCard, { marginTop: insets.top, marginBottom: insets.bottom }]}>
          {/* Header */}
          <View style={styles.calHeader}>
            <Text style={styles.calFieldBadge}>
              {field === 'dob' ? t('farmer.profile.dob') : af('field.purchaseDateTitle')}
            </Text>
            <Text style={styles.calSelectedDateTitle}>
              {date.getDate()} {monthName(date.getMonth())} {date.getFullYear()}
            </Text>
          </View>

          {/* Navigation Row */}
          <View style={styles.calMonthNav}>
            <TouchableOpacity
              style={styles.calNavBtn}
              onPress={picker.prevMonth}
              accessibilityLabel={t('farmer.farmDiary.common.previousMonthLabel')}
            >
              <ChevronLeftIcon size={18} color={P.deepGreen} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.calMonthYearBtn}
              onPress={picker.toggleYearPicker}
              activeOpacity={0.75}
            >
              <Text style={styles.calMonthYearLabel}>
                {monthName(month)} {year}
              </Text>
              <ChevronDownIcon size={14} color={P.deepGreen} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.calNavBtn}
              onPress={picker.nextMonth}
              accessibilityLabel={t('farmer.farmDiary.common.nextMonthLabel')}
            >
              <ChevronRightIcon size={18} color={P.deepGreen} />
            </TouchableOpacity>
          </View>

          {isYearPickerOpen ? (
            <YearGrid selectedYear={year} onPick={picker.pickYear} />
          ) : (
            <DayGrid year={year} month={month} selected={date} onPick={picker.pickDay} />
          )}

          {/* Actions */}
          <View style={styles.calFooterActions}>
            <TouchableOpacity style={styles.calCancelBtn} onPress={picker.close}>
              <Text style={styles.calCancelBtnText}>{t('farmer.common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.calApplyBtn} onPress={handleApply}>
              <Text style={styles.calApplyBtnText}>{t('farmer.farmDiary.list.applyDateButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function YearGrid({ selectedYear, onPick }: { selectedYear: number; onPick: (year: number) => void }) {
  return (
    <View style={styles.yearGridContainer}>
      <ScrollView style={styles.yearScrollView} showsVerticalScrollIndicator={true}>
        <View style={styles.yearGrid}>
          {YEARS.map((y) => {
            const isSel = selectedYear === y;
            return (
              <TouchableOpacity
                key={`yr-${y}`}
                style={[styles.yearChip, isSel && styles.yearChipActive]}
                onPress={() => onPick(y)}
              >
                <Text style={[styles.yearChipText, isSel && styles.yearChipTextActive]}>{y}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function DayGrid({
  year,
  month,
  selected,
  onPick,
}: {
  year: number;
  month: number;
  selected: Date;
  onPick: (day: number) => void;
}) {
  const leadingBlanks = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  return (
    <>
      {/* Weekdays Row */}
      <View style={styles.calWeekdaysRow}>
        {WEEKDAY_LETTER_KEYS.map((key, idx) => (
          <Text key={`${key}-${idx}`} style={styles.calWeekdayText}>
            {t(key)}
          </Text>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.calDaysGrid}>
        {Array.from({ length: leadingBlanks }).map((_, idx) => (
          <View key={`empty-${idx}`} style={styles.calDayCellEmpty} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const isSelected =
            selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

          return (
            <TouchableOpacity key={`day-${day}`} style={styles.calDayCell} onPress={() => onPick(day)}>
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
  );
}
