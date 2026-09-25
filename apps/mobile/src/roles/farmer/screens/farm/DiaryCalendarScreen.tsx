import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { authPalette as P, colors } from '../../theme';
import {
  resolveDiaryEntry,
  toIsoDate,
  toIsoMonth,
  useDiaryCalendarMonth,
  useDiaryDayEntries,
  useDiaryReferenceData,
  type ResolvedDiaryEntry,
} from './diaryLookups';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.deepGreen }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = P.twGray500 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronLeftIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 16, color = P.twGray700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const ALL_FIELDS_LABEL = 'All fields';
const ALL_ACTIVITY_LABEL = 'All activity';

export interface DiaryCalendarScreenProps {
  onBack?: () => void;
  onNavigateToEntryDetail?: (id: string) => void;
}

export function DiaryCalendarScreen({
  onBack,
  onNavigateToEntryDetail: _onNavigateToEntryDetail,
}: DiaryCalendarScreenProps): React.JSX.Element {
  const [today] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  /** Plot id, or null for "All fields". */
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  /** Taxonomy category key, or null for "All activity". */
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState<'field' | 'activity' | null>(null);

  // Month navigation state (the month in view; 0-indexed month)
  const [viewYear, setViewYear] = useState<number>(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => new Date().getMonth());

  // ── Server data ──
  const ref = useDiaryReferenceData();
  const monthData = useDiaryCalendarMonth(toIsoMonth(viewYear, viewMonth));
  const day = useDiaryDayEntries(toIsoDate(selectedDate));

  const startDayCol = new Date(viewYear, viewMonth, 1).getDay(); // S=0 … S=6
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

  const calendarDays: Array<number | null> = [];
  for (let i = 0; i < startDayCol; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    calendarDays.push(d);
  }

  const isSameDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  // Moving the month also moves the selection into it, so the entry list
  // below always belongs to the month on screen: today if it is the current
  // month, otherwise the 1st.
  const goToMonth = (delta: number) => {
    const first = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(first.getFullYear());
    setViewMonth(first.getMonth());
    const isCurrentMonth =
      first.getFullYear() === today.getFullYear() && first.getMonth() === today.getMonth();
    setSelectedDate(isCurrentMonth ? new Date(today) : first);
  };

  const listState = ref.state === 'error' || day.state === 'error'
    ? 'error'
    : ref.state === 'loading' || day.state === 'loading'
      ? 'loading'
      : 'ready';
  const listError = ref.state === 'error' ? ref.error : day.error;
  const retryList = () => {
    if (ref.state === 'error') ref.retry();
    if (day.state === 'error') day.retry();
  };

  const { plotNameById, categoryByKey, subActivityByKey } = ref;
  const resolvedEntries: ResolvedDiaryEntry[] = useMemo(
    () =>
      day.entries.map((e) =>
        resolveDiaryEntry(e, { plotNameById, categoryByKey, subActivityByKey }, day.cropNameById),
      ),
    [day.entries, day.cropNameById, plotNameById, categoryByKey, subActivityByKey],
  );

  const entriesForSelectedDay = resolvedEntries.filter(
    (r) =>
      (selectedPlotId === null || r.entry.plotId === selectedPlotId) &&
      (selectedCategoryKey === null || r.entry.categoryKey === selectedCategoryKey),
  );

  const fieldOptions: { value: string | null; label: string }[] = [
    { value: null, label: ALL_FIELDS_LABEL },
    ...ref.plots.map((p) => ({ value: p.id, label: p.name })),
  ];
  const activityOptions: { value: string | null; label: string }[] = [
    { value: null, label: ALL_ACTIVITY_LABEL },
    ...ref.activeCategories.map((c) => ({ value: c.key, label: c.name })),
  ];

  const selectedFieldLabel =
    selectedPlotId === null ? ALL_FIELDS_LABEL : plotNameById.get(selectedPlotId) ?? ALL_FIELDS_LABEL;
  const selectedActivityLabel =
    selectedCategoryKey === null
      ? ALL_ACTIVITY_LABEL
      : categoryByKey.get(selectedCategoryKey)?.name ?? ALL_ACTIVITY_LABEL;

  const selectedDayOfWeekName = DAY_NAMES[selectedDate.getDay()];
  const selectedMonthName = (MONTH_NAMES[selectedDate.getMonth()] ?? '').toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.deepGreen} />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Diary Calendar</Text>
            <Text style={styles.headerSubtitle}>Your logged activity, month by month</Text>
          </View>
        </View>

        {/* Filter Dropdowns Row */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={styles.filterPill}
            onPress={() => setFilterModalVisible('field')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Filter by field"
          >
            <Text style={styles.filterPillText} numberOfLines={1}>{selectedFieldLabel}</Text>
            <ChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterPill}
            onPress={() => setFilterModalVisible('activity')}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Filter by activity"
          >
            <Text style={styles.filterPillText} numberOfLines={1}>{selectedActivityLabel}</Text>
            <ChevronDownIcon size={16} color={P.twGray500} />
          </TouchableOpacity>
        </View>

        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Month Header Navigation */}
          <View style={styles.monthHeader}>
            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={() => goToMonth(-1)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
            >
              <ChevronLeftIcon size={16} color={P.twGray700} />
            </TouchableOpacity>

            <View style={styles.monthTitleRow}>
              <Text style={styles.monthTitle}>
                {MONTH_NAMES[viewMonth]} {viewYear}
              </Text>
              {monthData.state === 'loading' && (
                <ActivityIndicator size="small" color={colors.brandGreen} />
              )}
            </View>

            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={() => goToMonth(1)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Next month"
            >
              <ChevronRightIcon size={16} color={P.twGray700} />
            </TouchableOpacity>
          </View>

          {/* Entry dots are a hint — a failure here must not block the grid. */}
          {monthData.state === 'error' && (
            <TouchableOpacity
              style={styles.monthErrorRow}
              onPress={monthData.retry}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Retry loading days with entries"
            >
              <Text style={styles.monthErrorText}>{monthData.error} Tap to retry.</Text>
            </TouchableOpacity>
          )}

          {/* Weekday Column Headers */}
          <View style={styles.weekdaysRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayChar, index) => (
              <Text key={`weekday-${index}`} style={styles.weekdayText}>
                {dayChar}
              </Text>
            ))}
          </View>

          {/* Calendar Grid of Days */}
          <View style={styles.daysGrid}>
            {calendarDays.map((dayNum, index) => {
              if (dayNum === null) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const cellDate = new Date(viewYear, viewMonth, dayNum);
              const isSelected = isSameDate(cellDate, selectedDate);
              const isToday = isSameDate(cellDate, today);
              const hasEntries = monthData.countsByDate.has(toIsoDate(cellDate));

              return (
                <TouchableOpacity
                  key={`day-${dayNum}`}
                  style={styles.dayCell}
                  onPress={() => setSelectedDate(cellDate)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.dayBox,
                      isSelected && styles.dayBoxSelected,
                      isToday && !isSelected && styles.dayBoxToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        isSelected && styles.dayNumberSelected,
                        isToday && !isSelected && styles.dayNumberToday,
                        !hasEntries && !isSelected && !isToday && styles.dayNumberNoEntries,
                      ]}
                    >
                      {dayNum}
                    </Text>
                    {hasEntries ? (
                      <View
                        style={[
                          styles.entryDot,
                          isSelected && styles.entryDotSelected,
                          isToday && !isSelected && styles.entryDotToday,
                        ]}
                      />
                    ) : (
                      <View style={styles.entryDotPlaceholder} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legendDivider} />
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>Has entries</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={styles.legendTodayBox} />
              <Text style={styles.legendText}>Today</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={styles.legendSelectedBox} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
          </View>
        </View>

        {/* Selected Day Entries Section */}
        <View style={styles.entriesSection}>
          <View style={styles.entriesSectionHeader}>
            <Text style={styles.entriesSectionDate}>
              {selectedDayOfWeekName}, {selectedDate.getDate()} {selectedMonthName}
            </Text>
            {listState === 'ready' && (
              <Text style={styles.entriesCountText}>
                {entriesForSelectedDay.length} {entriesForSelectedDay.length === 1 ? 'entry' : 'entries'}
              </Text>
            )}
          </View>

          {listState === 'loading' ? (
            <View style={styles.emptyEntriesBox}>
              <ActivityIndicator color={colors.brandGreen} />
              <Text style={[styles.emptyEntriesText, styles.statusTextSpaced]}>
                Loading diary entries…
              </Text>
            </View>
          ) : listState === 'error' ? (
            <View style={[styles.emptyEntriesBox, styles.errorBox]}>
              <Text style={styles.errorText}>{listError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={retryList}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Retry loading diary entries"
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : entriesForSelectedDay.length === 0 ? (
            <View style={styles.emptyEntriesBox}>
              <Text style={styles.emptyEntriesText}>
                {day.entries.length > 0
                  ? 'No entries match these filters for this date.'
                  : 'No entries logged for this date.'}
              </Text>
            </View>
          ) : (
            entriesForSelectedDay.map((r) => (
              <View key={r.entry.id} style={styles.entryCard}>
                <View style={styles.entryIconBox}>
                  <r.Icon size={22} color={colors.brandGreen} />
                </View>

                <View style={styles.entryContent}>
                  <Text style={styles.entryTitle}>
                    {r.categoryName} · {r.cropName}
                  </Text>
                  <Text style={styles.entrySubtitle}>
                    {r.time !== '' ? `${r.plotName} · ${r.time}` : r.plotName}
                  </Text>
                </View>

                <View style={styles.entryRight}>
                  <Text style={styles.entryDuration}>{r.duration}</Text>
                  <ChevronDownIcon size={18} color={P.twGray400} />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Filter Modal for Fields / Activity */}
      <Modal
        visible={filterModalVisible !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {filterModalVisible === 'field' ? 'Select Field' : 'Select Activity'}
            </Text>
            {(filterModalVisible === 'field' ? fieldOptions : activityOptions).map((opt) => {
              const isActive =
                filterModalVisible === 'field'
                  ? selectedPlotId === opt.value
                  : selectedCategoryKey === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value ?? '__all__'}
                  style={styles.modalOption}
                  onPress={() => {
                    if (filterModalVisible === 'field') setSelectedPlotId(opt.value);
                    if (filterModalVisible === 'activity') setSelectedCategoryKey(opt.value);
                    setFilterModalVisible(null);
                  }}
                >
                  <Text style={[styles.modalOptionText, isActive && styles.modalOptionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.lightSurfaceAlt,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: P.nearBlack,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: P.twGray500,
    marginTop: 2,
  },

  filtersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: P.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  filterPillText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: P.twGray700,
    flex: 1,
    marginRight: 6,
  },

  calendarCard: {
    backgroundColor: P.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: P.twGray100,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: P.twGray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray900,
  },
  monthErrorRow: {
    marginTop: -6,
    marginBottom: 10,
    alignItems: 'center',
  },
  monthErrorText: {
    fontSize: 12,
    color: P.twRed700,
    textAlign: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekdayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: P.twGray500,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  dayCell: {
    width: 38,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dayBox: {
    width: 36,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayBoxSelected: {
    backgroundColor: colors.brandGreen,
  },
  dayBoxToday: {
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
  },
  dayNumber: {
    fontSize: 13.5,
    fontWeight: '600',
    color: P.twGray800,
  },
  dayNumberSelected: {
    color: P.white,
    fontWeight: '700',
  },
  dayNumberToday: {
    color: colors.brandGreen,
    fontWeight: '700',
  },
  dayNumberNoEntries: {
    color: P.twGray400,
    fontWeight: '400',
  },
  entryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brandGreen,
    marginTop: 3,
  },
  entryDotSelected: {
    backgroundColor: P.white,
  },
  entryDotToday: {
    backgroundColor: colors.brandGreen,
  },
  entryDotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 3,
  },

  legendDivider: {
    height: 1,
    backgroundColor: P.twGray100,
    marginTop: 14,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandGreen,
  },
  legendTodayBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.brandGreen,
  },
  legendSelectedBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: colors.brandGreen,
  },
  legendText: {
    fontSize: 11.5,
    color: P.twGray500,
  },

  entriesSection: {
    marginTop: 22,
  },
  entriesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  entriesSectionDate: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.6,
  },
  entriesCountText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray100,
    padding: 14,
    marginBottom: 10,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  entryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: colors.brandGreenLight,
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.nearBlack,
  },
  entrySubtitle: {
    fontSize: 12.5,
    color: P.twGray500,
    marginTop: 2,
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryDuration: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brandGreen,
  },
  emptyEntriesBox: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: P.twGray100,
  },
  emptyEntriesText: {
    fontSize: 13.5,
    color: P.twGray500,
    textAlign: 'center',
  },
  statusTextSpaced: {
    marginTop: 10,
  },
  errorBox: {
    backgroundColor: P.twRed50,
    borderColor: P.twRed200,
  },
  errorText: {
    fontSize: 13,
    color: P.twRed700,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twRed200,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.twRed700,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: P.white,
    borderRadius: 18,
    padding: 20,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 14,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  modalOptionText: {
    fontSize: 14,
    color: P.twGray700,
  },
  modalOptionTextActive: {
    color: colors.brandGreen,
    fontWeight: '700',
  },
});
