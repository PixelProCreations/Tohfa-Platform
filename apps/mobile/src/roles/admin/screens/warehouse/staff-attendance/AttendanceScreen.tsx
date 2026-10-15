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
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  SearchIcon,
  SectionTitle,
  SlidersIcon,
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
} from './fixtures';
import {
  AttendanceStatusText,
  DateNavigator,
  DatePickerModal,
  HistoryIcon,
  ListCard,
  ListRow,
  StaffAvatar,
  attendanceTone,
} from './StaffParts';
import { StaffFiltersScreen, StaffFilterValues } from './StaffFiltersScreen';
import type { AttendanceFilter, AttendanceRecord, AttendanceStatus, WarehouseScope, WarehouseScreenBaseProps } from './types';

const FILTERS: readonly AttendanceFilter[] = ['All', 'Present', 'Absent', 'On Leave'];
const SECTIONS: readonly AttendanceStatus[] = ['Present', 'Absent', 'On Leave', 'Not Checked In'];

export interface AttendanceScreenProps extends WarehouseScreenBaseProps {
  /** Chip selected on entry (the old Today's Attendance key opens 'All'). */
  initialFilter?: AttendanceFilter | undefined;
  initialWarehouseId?: string | undefined;
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
  onSelectRecord,
  onNavigateToHistory,
  warehouseOptions = STAFF_WAREHOUSES,
  records = ATTENDANCE_RECORDS,
}: AttendanceScreenProps) {
  const isMain = isAllWarehouses(scope);
  const [filter, setFilter] = useState<AttendanceFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(initialWarehouseId);
  const [roleFilter, setRoleFilter] = useState<'All' | 'Warehouse Staff' | 'Driver'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
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
    const matchesRole =
      roleFilter === 'All'
        ? true
        : roleFilter === 'Driver'
        ? r.type === 'driver' || r.role.toLowerCase().includes('driver')
        : r.type === 'warehouse' || !r.role.toLowerCase().includes('driver');
    return matchesQuery && matchesRole && (filter === 'All' || r.status === filter);
  });
  const count = (status: AttendanceStatus) => String(dayRecords.filter((r) => r.status === status).length);
  const shiftDay = (delta: number) => setDay((d) => Math.min(ATTENDANCE_MONTH_DAYS, Math.max(1, d + delta)));
  const scopeLabel = isMain ? 'All Warehouses' : scope.warehouseName ?? scope.warehouseId ?? '';

  const renderRow = (record: AttendanceRecord, index: number, list: readonly AttendanceRecord[]) => (
    <ListRow
      key={record.id}
      title={record.name}
      subtitle={record.role}
      leading={isMain ? <StaffAvatar type={record.type} tone={record.status === 'Present' ? undefined : attendanceTone(record.status)} /> : undefined}
      trailing={
        <AttendanceStatusText
          status={record.status}
          lines={!isMain ? [record.status === 'Present' ? record.checkInTime : undefined] : [record.status === 'Present' ? record.checkInTime : undefined, dateText]}
        />
      }
      divider={index < list.length - 1}
      onPress={onSelectRecord ? () => onSelectRecord({ ...record, dateText }) : undefined}
    />
  );

  const grouped = isMain && filter === 'All';

  if (showFilterScreen) {
    const isSpecificScope = !isMain || !!initialWarehouseId;
    const currentWarehouseScope = selectedWarehouseId ? warehouseOptions.find((w) => w.warehouseId === selectedWarehouseId) : undefined;
    const currentWarehouseName = isSpecificScope ? (currentWarehouseScope?.warehouseName ?? scope.warehouseName ?? selectedWarehouseId) : undefined;

    return (
      <StaffFiltersScreen
        initialFilters={{
          searchQuery,
          role: roleFilter,
          attendance: filter,
          status: statusFilter,
          warehouseId: selectedWarehouseId,
        }}
        showWarehouseSelector={isMain && !initialWarehouseId}
        warehouseName={currentWarehouseName}
        warehouses={[
          { id: 'ALL', name: 'All Warehouses' },
          ...warehouseOptions
            .filter((w) => !!w.warehouseId)
            .map((w) => ({ id: w.warehouseId!, name: w.warehouseName ?? w.warehouseId! })),
        ]}
        onBack={() => setShowFilterScreen(false)}
        onApply={(newFilters) => {
          setSearchQuery(newFilters.searchQuery);
          setRoleFilter(newFilters.role);
          setFilter(newFilters.attendance);
          setStatusFilter(newFilters.status);
          if (isMain && !initialWarehouseId && newFilters.warehouseId !== undefined) {
            setSelectedWarehouseId(newFilters.warehouseId);
          }
          setShowFilterScreen(false);
        }}
      />
    );
  }

  return (
    <WalletScreen
      title="Today's attendance"
      subtitle={dateText}
      onBack={onBack}
      headerRight={
        onNavigateToHistory ? (
          <HeaderIconButton onPress={onNavigateToHistory} accessibilityLabel="Attendance history">
            <HistoryIcon />
          </HeaderIconButton>
        ) : undefined
      }
      headerExtra={
        <>
          <DateNavigator
            label={`${scopeLabel} · ${dateText}`}
            onPrev={() => shiftDay(-1)}
            onNext={() => shiftDay(1)}
            onPressLabel={() => {
              setPickerDay(day);
              setPickerOpen(true);
            }}
          />
          <ScopeHeader
            scope={scope}
            warehouseOptions={isMain ? warehouseOptions : undefined}
            selectedWarehouseId={isMain ? selectedWarehouseId : undefined}
            onSelectWarehouse={isMain ? setSelectedWarehouseId : undefined}
          />
        </>
      }
      footer={<WarehouseTabBar onTabChange={onTabChange} onBack={onBack} activeTab="More" />}
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
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search employee..."
          onFilterPress={() => setShowFilterScreen(true)}
        />

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
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: adminSpacing.lg,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  kpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  kpiValue: {
    ...adminType.kpiValue,
  },
  searchBar: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    ...adminType.body,
    color: adminColors.ink,
  },
});
