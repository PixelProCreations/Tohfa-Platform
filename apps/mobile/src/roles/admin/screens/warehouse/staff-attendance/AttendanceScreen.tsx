/**
 * Attendance overview: one day's attendance for the warehouse(s) in scope.
 *
 * Gate (FINAL_LIST 122): no rbac code exists for attendance, so the screen is
 * ungated and scope-locked only (SPEC_GAPS W4t-3). A Sub scope sees its own
 * warehouse (scope.warehouseName in the date row); the Main scope (warehouseId
 * undefined) gets the All-warehouses selector.
 *
 * Folds two screens (owner decision 2026-10-09):
 *   - SubWarehouseTodayAttendanceScreen (dropped as a separate screen; it was
 *     the more complete file): the Present / Absent / On Leave filter chips
 *     (its filter state existed but no chips were drawn), the check-in time and
 *     date on each row, the history shortcut in the header, and the record
 *     detail, which now opens AttendanceDetailScreen.
 *   - Main MainWarehouseAttendanceScreen (pair M14-S03, one 852-line screen
 *     with Today / History / Detail views): the "All Warehouses · date" row
 *     with the month date picker and, for the Main view, rows grouped into
 *     PRESENT / ABSENT / ON LEAVE sections. Its History view is
 *     AttendanceHistoryScreen and its Detail view AttendanceDetailScreen.
 * KPI tiles are counted from the visible rows instead of fixed numbers.
 */
// Design id: M14-S03
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  ChipGroup,
  EmptyState,
  HeaderIconButton,
  inScope,
  isAllWarehouses,
  KpiRow,
  ScopeHeader,
  SearchBar,
  SectionTitle,
  WalletScreen,
  WarehouseTabBar,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  ATTENDANCE_DAY,
  ATTENDANCE_MONTH_DAYS,
  ATTENDANCE_MONTH_FIRST_WEEKDAY,
  ATTENDANCE_MONTH_LABEL,
  ATTENDANCE_MONTH_SHORT,
  ATTENDANCE_RECORDS,
  STAFF_WAREHOUSES,
  staffWarehouseName,
} from './fixtures';
import {
  AttendanceStatusText,
  DateNavigator,
  DatePickerModal,
  FilterSlidersIcon,
  HistoryIcon,
  ListCard,
  ListRow,
  StaffAvatar,
  attendanceTone,
} from './StaffParts';
import { StaffFiltersScreen } from './StaffFiltersScreen';
import type { AttendanceFilter, AttendanceRecord, AttendanceStatus, WarehouseScope, WarehouseScreenBaseProps } from './types';

function SearchLensIcon({ size = 18, color = '#64748B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

const FILTERS: readonly AttendanceFilter[] = ['All', 'Present', 'Absent', 'On Leave'];
const SECTIONS: readonly AttendanceStatus[] = ['Present', 'Absent', 'On Leave', 'Not Checked In'];

export interface AttendanceScreenProps extends WarehouseScreenBaseProps {
  /** Chip selected on entry (the old Today's Attendance key opens 'All'). */
  initialFilter?: AttendanceFilter | undefined;
  initialWarehouseId?: string | undefined;
  isOutsideWarehouseSelected?: boolean | undefined;
  onSelectRecord?: ((record: AttendanceRecord) => void) | undefined;
  onNavigateToHistory?: (() => void) | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Rows of the mock day; defaults to the fixture set until an attendance API exists. */
  records?: readonly AttendanceRecord[] | undefined;
}

export function AttendanceScreen({
  scope,
  onBack,
  onTabChange,
  initialFilter = 'All',
  initialWarehouseId,
  isOutsideWarehouseSelected = false,
  onSelectRecord,
  onNavigateToHistory,
  warehouseOptions = STAFF_WAREHOUSES,
  records = ATTENDANCE_RECORDS,
}: AttendanceScreenProps) {
  const isMain = isAllWarehouses(scope);
  const [filter, setFilter] = useState<AttendanceFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(initialWarehouseId);
  const [showFilterScreen, setShowFilterScreen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDay, setPickerDay] = useState(ATTENDANCE_DAY);
  const [day, setDay] = useState(ATTENDANCE_DAY);

  const dateText = `${day} ${ATTENDANCE_MONTH_SHORT}`;
  // The mock rows describe one day only; any other day shows the empty state.
  const dayRecords = useMemo(
    () => (day === ATTENDANCE_DAY ? records.filter((r) => inScope(scope, r.warehouseId, selectedWarehouseId)) : []),
    [day, records, scope, selectedWarehouseId],
  );
  const visible = dayRecords.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || r.name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q);
    return matchesQuery && (filter === 'All' || r.status === filter);
  });
  const count = (status: AttendanceStatus) => String(dayRecords.filter((r) => r.status === status).length);
  const shiftDay = (delta: number) => setDay((d) => Math.min(ATTENDANCE_MONTH_DAYS, Math.max(1, d + delta)));
  const scopeLabel = isMain
    ? (selectedWarehouseId ? staffWarehouseName(selectedWarehouseId) : 'All Warehouses')
    : scope.warehouseName ?? (scope.warehouseId ? staffWarehouseName(scope.warehouseId) : 'Coonoor Warehouse');

  const renderRow = (record: AttendanceRecord, index: number, list: readonly AttendanceRecord[]) => (
    <ListRow
      key={record.id}
      title={record.name}
      subtitle={record.role}
      leading={isMain ? <StaffAvatar type={record.type} tone={record.status === 'Present' ? undefined : attendanceTone(record.status)} /> : undefined}
      trailing={
        <AttendanceStatusText
          status={record.status}
          lines={[record.status === 'Present' ? record.checkInTime : undefined, dateText]}
        />
      }
      divider={index < list.length - 1}
      onPress={onSelectRecord ? () => onSelectRecord({ ...record, dateText }) : undefined}
    />
  );

  const grouped = isMain && filter === 'All';

  if (showFilterScreen) {
    const isTopLocked = isOutsideWarehouseSelected || Boolean(isMain && selectedWarehouseId && selectedWarehouseId !== 'all');
    return (
      <StaffFiltersScreen
        initialFilters={{
          searchQuery,
          role: 'All',
          attendance: filter,
          status: 'All',
          warehouseId: selectedWarehouseId,
        }}
        warehouseName={isMain ? (selectedWarehouseId ? staffWarehouseName(selectedWarehouseId) : undefined) : scope.warehouseName ?? scope.warehouseId}
        warehouseOptions={warehouseOptions}
        isTopWarehouseSelected={isTopLocked}
        onBack={() => setShowFilterScreen(false)}
        onApply={(newFilters) => {
          setSearchQuery(newFilters.searchQuery);
          setFilter(newFilters.attendance);
          if (!isOutsideWarehouseSelected) {
            setSelectedWarehouseId(newFilters.warehouseId);
          }
          setShowFilterScreen(false);
        }}
      />
    );
  }

  return (
    <WalletScreen
      title="Attendance"
      onBack={onBack}
      headerRight={
        onNavigateToHistory ? (
          <TouchableOpacity
            style={styles.historyButton}
            onPress={onNavigateToHistory}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Attendance history"
          >
            <HistoryIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : undefined
      }
      headerExtra={
        <DateNavigator
          label={`${scopeLabel} · ${dateText}`}
          onPrev={() => shiftDay(-1)}
          onNext={() => shiftDay(1)}
          onPressLabel={() => {
            setPickerDay(day);
            setPickerOpen(true);
          }}
        />
      }
      footer={!isMain && onTabChange ? <WarehouseTabBar onTabChange={onTabChange} onBack={onBack} /> : undefined}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <KpiRow
          items={[
            { value: count('Present'), label: 'PRESENT', tone: 'success' },
            { value: count('Absent'), label: 'ABSENT', tone: 'danger' },
            { value: count('On Leave'), label: 'ON LEAVE', tone: 'warning' },
            { value: String(dayRecords.length), label: 'TOTAL' },
          ]}
        />
        <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />
        <View style={styles.gap} />
        {isMain ? (
          <View style={styles.searchBarWrap}>
            <SearchLensIcon />
            <TextInput
              style={styles.searchBarInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search employee..."
              placeholderTextColor={adminColors.placeholder}
              returnKeyType="search"
            />
            <TouchableOpacity
              onPress={() => setShowFilterScreen(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Filter attendance"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <FilterSlidersIcon size={20} color={adminColors.brand} />
            </TouchableOpacity>
          </View>
        ) : (
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search employee..." />
        )}

        {visible.length === 0 ? (
          <EmptyState title="No attendance records" subtitle={`Nothing recorded for ${dateText} with this filter.`} />
        ) : grouped ? (
          SECTIONS.map((status) => {
            const rows = visible.filter((r) => r.status === status);
            if (rows.length === 0) return null;
            return (
              <View key={status}>
                <SectionTitle>{status.toUpperCase()}</SectionTitle>
                <ListCard>{rows.map(renderRow)}</ListCard>
              </View>
            );
          })
        ) : (
          <ListCard>{visible.map(renderRow)}</ListCard>
        )}
      </ScrollView>

      <DatePickerModal
        visible={pickerOpen}
        monthLabel={ATTENDANCE_MONTH_LABEL}
        daysInMonth={ATTENDANCE_MONTH_DAYS}
        firstWeekday={ATTENDANCE_MONTH_FIRST_WEEKDAY}
        selectedDay={pickerDay}
        onSelectDay={setPickerDay}
        onApply={() => {
          setDay(pickerDay);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  gap: { height: adminSpacing.md },
  historyButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  searchBarInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
});
