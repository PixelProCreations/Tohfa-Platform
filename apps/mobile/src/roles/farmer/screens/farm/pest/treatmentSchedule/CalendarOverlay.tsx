import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '../pestManagement/icons';
import { CALENDAR_YEARS, WEEKDAY_IDS } from './constants';
import { monthFull } from './dateUtils';
import { ts } from './i18n';
import type { ScheduleAction, ScheduleState } from './scheduleReducer';
import { styles } from './styles';

interface CalendarOverlayProps {
  state: ScheduleState;
  patch: (p: Partial<ScheduleState>) => void;
  dispatch: (a: ScheduleAction) => void;
  onApply: () => void;
}

export function CalendarOverlay({ state, patch, dispatch, onApply }: CalendarOverlayProps): React.JSX.Element {
  const { calDate, calYear, calMonth, isYearPickerOpen } = state;
  const close = () => patch({ isCalendarOpen: false });
  const today = new Date();

  return (
    <View style={styles.inModalOverlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={close} />
      <View style={styles.calModalCard}>
        <View style={styles.calHeader}>
          <Text style={styles.calFieldBadge}>{ts('farmer.treatmentSchedule.field.scheduledDate')}</Text>
          <Text style={styles.calSelectedDateTitle}>
            {calDate.getDate()} {monthFull(calDate.getMonth())} {calDate.getFullYear()}
          </Text>
        </View>

        <View style={styles.calMonthNav}>
          <TouchableOpacity style={styles.calNavBtn} onPress={() => dispatch({ type: 'prevMonth' })}>
            <ChevronLeftIcon size={18} color={P.deepGreen} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.calMonthYearBtn}
            onPress={() => patch({ isYearPickerOpen: !isYearPickerOpen })}
          >
            <Text style={styles.calMonthYearLabel}>
              {monthFull(calMonth)} {calYear}
            </Text>
            <ChevronDownIcon size={14} color={P.deepGreen} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.calNavBtn} onPress={() => dispatch({ type: 'nextMonth' })}>
            <ChevronRightIcon size={18} color={P.deepGreen} />
          </TouchableOpacity>
        </View>

        {isYearPickerOpen ? (
          <View style={styles.yearGridContainer}>
            <ScrollView style={styles.yearScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.yearGrid}>
                {CALENDAR_YEARS.map((y) => {
                  const isSel = calYear === y;
                  return (
                    <TouchableOpacity
                      key={`yr-${y}`}
                      style={[styles.yearChip, isSel && styles.yearChipActive]}
                      onPress={() =>
                        patch({
                          calYear: y,
                          calDate: new Date(
                            y,
                            calMonth,
                            Math.min(calDate.getDate(), new Date(y, calMonth + 1, 0).getDate()),
                          ),
                          isYearPickerOpen: false,
                        })
                      }
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
            <View style={styles.calWeekdaysRow}>
              {WEEKDAY_IDS.map((wd) => (
                <Text key={wd} style={styles.calWeekdayText}>
                  {ts(`farmer.pestManagement.weekday.${wd}`)}
                </Text>
              ))}
            </View>

            <View style={styles.calDaysGrid}>
              {Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.calDayCellEmpty} />
              ))}

              {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
                const day = i + 1;
                const isSelected =
                  calDate.getFullYear() === calYear && calDate.getMonth() === calMonth && calDate.getDate() === day;
                const isToday =
                  today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;

                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    style={styles.calDayCell}
                    onPress={() => patch({ calDate: new Date(calYear, calMonth, day) })}
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

        <View style={styles.calFooterActions}>
          <TouchableOpacity style={styles.calCancelBtn} onPress={close}>
            <Text style={styles.calCancelBtnText}>{ts('farmer.pestManagement.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.calApplyBtn} onPress={onApply}>
            <Text style={styles.calApplyBtnText}>{ts('farmer.pestManagement.report.applyDate')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
