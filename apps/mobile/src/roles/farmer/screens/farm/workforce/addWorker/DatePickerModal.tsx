import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import type { FormAction, FormState } from './formReducer';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { aw, common } from './i18n';
import { styles } from './styles';

// Year quick-picker range: newest year first, preserved from the original screen.
const YEAR_PICKER_LATEST = 2026;
const YEAR_PICKER_COUNT = 75;
const WEEKDAY_INDEXES = [0, 1, 2, 3, 4, 5, 6] as const;

interface Props {
  state: FormState;
  dispatch: React.Dispatch<FormAction>;
  onConfirm: () => void;
}

export function DatePickerModal({ state, dispatch, onConfirm }: Props): React.JSX.Element {
  const { isDatePickerOpen, isYearPickerOpen, calendarDate, calendarYear, calendarMonth } = state;
  const close = () => dispatch({ type: 'patch', patch: { isDatePickerOpen: false } });
  const monthName = (i: number) => aw(`month.${i}`);
  const today = new Date();

  return (
    <Modal
      visible={isDatePickerOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.calModalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={close} />
        <View style={styles.calModalCard}>
          <View style={styles.calHeader}>
            <Text style={styles.calFieldBadge}>{aw('calBadge')}</Text>
            <Text style={styles.calSelectedDateTitle}>
              {calendarDate.getDate()} {monthName(calendarDate.getMonth())} {calendarDate.getFullYear()}
            </Text>
          </View>

          <View style={styles.calMonthNav}>
            <TouchableOpacity
              style={styles.calNavBtn}
              onPress={() => dispatch({ type: 'prevMonth' })}
              accessibilityLabel={aw('calPrevMonth')}
            >
              <ChevronLeftIcon size={18} color={P.deepGreen} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.calMonthYearBtn}
              onPress={() => dispatch({ type: 'patch', patch: { isYearPickerOpen: !isYearPickerOpen } })}
              activeOpacity={0.75}
            >
              <Text style={styles.calMonthYearLabel}>
                {monthName(calendarMonth)} {calendarYear}
              </Text>
              <ChevronDownIcon size={14} color={P.deepGreen} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.calNavBtn}
              onPress={() => dispatch({ type: 'nextMonth' })}
              accessibilityLabel={aw('calNextMonth')}
            >
              <ChevronRightIcon size={18} color={P.deepGreen} />
            </TouchableOpacity>
          </View>

          {isYearPickerOpen ? (
            <View style={styles.yearGridContainer}>
              <ScrollView style={styles.yearScrollView} showsVerticalScrollIndicator={true}>
                <View style={styles.yearGrid}>
                  {Array.from({ length: YEAR_PICKER_COUNT }).map((_, i) => {
                    const y = YEAR_PICKER_LATEST - i;
                    const isSel = calendarYear === y;
                    return (
                      <TouchableOpacity
                        key={`yr-${y}`}
                        style={[styles.yearChip, isSel && styles.yearChipActive]}
                        onPress={() => dispatch({ type: 'pickYear', year: y })}
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
                {WEEKDAY_INDEXES.map((idx) => (
                  <Text key={`wd-${idx}`} style={styles.calWeekdayText}>
                    {aw(`weekday.${idx}`)}
                  </Text>
                ))}
              </View>

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
                    today.getFullYear() === calendarYear &&
                    today.getMonth() === calendarMonth &&
                    today.getDate() === day;

                  return (
                    <TouchableOpacity
                      key={`day-${day}`}
                      style={styles.calDayCell}
                      onPress={() =>
                        dispatch({ type: 'patch', patch: { calendarDate: new Date(calendarYear, calendarMonth, day) } })
                      }
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
              <Text style={styles.calCancelBtnText}>{common.cancel()}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.calApplyBtn} onPress={onConfirm}>
              <Text style={styles.calApplyBtnText}>{aw('calApply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
