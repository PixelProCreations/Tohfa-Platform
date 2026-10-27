/**
 * Attendance History: past attendance grouped by date or by staff member.
 *
 * Gate (FINAL_LIST 124): no rbac code exists for attendance; ungated and
 * scope-locked only (SPEC_GAPS W4t-3). The All-warehouses selector shows only
 * for the Main scope (warehouseId undefined); a Sub scope gets its locked
 * warehouse pill.
 *
 * Absorbs the History view of Main MainWarehouseAttendanceScreen (pair
 * M14-S03): the 30 Days range and the "By Staff" grouping (one card per person
 * per month). The Sub screen already had a Group by Staff switch that rendered
 * nothing different; it now shows those monthly summaries. KPI tiles are
 * counted from the rows in range instead of fixed numbers. The Today chip opens
 * the Attendance overview when the host offers it.
 */
// Design id: M14-S03
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  CalendarIcon,
  ChipGroup,
  EmptyState,
  InfoCard,
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
  ATTENDANCE_DATE_HEADER,
  ATTENDANCE_HISTORY,
  HISTORY_RANGE_DATES,
  STAFF_MONTH_SUMMARIES,
  STAFF_WAREHOUSES,
} from './fixtures';
import { AttendanceStatusText, ChevronRightIcon, ListCard, ListRow } from './StaffParts';
import { StaffFiltersScreen, StaffFilterValues } from './StaffFiltersScreen';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { useAttendanceHistoryList, useAttendanceSummary } from './useStaffData';
import type { AttendanceHistoryEntry, StaffMonthSummary, WarehouseScope, WarehouseScreenBaseProps } from './types';

type HistoryRange = 'Today' | '7 Days' | '30 Days' | 'This Month';
type GroupBy = 'Date' | 'Staff';
const RANGES: readonly HistoryRange[] = ['Today', '7 Days', '30 Days', 'This Month'];
const GROUPS: readonly GroupBy[] = ['Date', 'Staff'];

export interface AttendanceHistoryScreenProps extends WarehouseScreenBaseProps {
  /** Today chip: open the Attendance overview (folded Today's Attendance). */
  onNavigateToToday?: (() => void) | undefined;
  initialWarehouseId?: string | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  entries?: readonly AttendanceHistoryEntry[] | undefined;
  monthSummaries?: readonly StaffMonthSummary[] | undefined;
}

export function AttendanceHistoryScreen({
  scope,
  onBack,
  onTabChange,
  onNavigateToToday,
  initialWarehouseId,
  warehouseOptions: customWarehouseOptions,
  entries: customEntries,
  monthSummaries: customMonthSummaries,
}: AttendanceHistoryScreenProps) {
  const isMain = isAllWarehouses(scope);
  const [range, setRange] = useState<HistoryRange>('This Month');
  const [groupBy, setGroupBy] = useState<GroupBy>('Date');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(initialWarehouseId);
  const [roleFilter, setRoleFilter] = useState<'All' | 'Warehouse Staff' | 'Driver'>('All');
  const [attendanceFilter, setAttendanceFilter] = useState<'All' | 'Present' | 'Absent' | 'On Leave'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [showFilterScreen, setShowFilterScreen] = useState(false);

  const { scopes: fetchedWarehouseOptions } = useWarehouseOptions();
  const warehouseOptions = customWarehouseOptions ?? (fetchedWarehouseOptions.length > 0 ? fetchedWarehouseOptions : STAFF_WAREHOUSES);

  const { entries: liveEntries } = useAttendanceHistoryList(scope, selectedWarehouseId);
  const entries = customEntries ?? (liveEntries.length > 0 ? liveEntries : ATTENDANCE_HISTORY);

  const { staffSummaries: liveSummaries } = useAttendanceSummary(scope, selectedWarehouseId);
  const monthSummaries = customMonthSummaries ?? (liveSummaries.length > 0 ? liveSummaries : STAFF_MONTH_SUMMARIES);

  const inRange = (olderThanWeek: boolean | undefined, dateHeader?: string) => {
    if (range === 'Today') return dateHeader === undefined ? !olderThanWeek : dateHeader === ATTENDANCE_DATE_HEADER;
    if (range === '7 Days') return !olderThanWeek;
    return true;
  };
  const q = searchQuery.toLowerCase().trim();

  const rows = entries.filter(
    (e) =>
      inScope(scope, e.warehouseId, selectedWarehouseId) &&
      inRange(e.olderThanWeek, e.dateHeader) &&
      (!q || e.name.toLowerCase().includes(q) || e.dateHeader.toLowerCase().includes(q)) &&
      (roleFilter === 'All'
        ? true
        : roleFilter === 'Driver'
        ? (e.role?.toLowerCase().includes('driver') ?? false)
        : !(e.role?.toLowerCase().includes('driver') ?? false)) &&
      (attendanceFilter === 'All' || e.status === attendanceFilter),
  );
  const months = monthSummaries.filter(
    (m) =>
      inScope(scope, m.warehouseId, selectedWarehouseId) &&
      inRange(m.olderThanWeek) &&
      (!q || m.staffName.toLowerCase().includes(q)) &&
      (roleFilter === 'All'
        ? true
        : roleFilter === 'Driver'
        ? m.role.toLowerCase().includes('driver')
        : !m.role.toLowerCase().includes('driver')),
  );

  const dates = HISTORY_RANGE_DATES[range];
  const count = (status: AttendanceHistoryEntry['status']) => String(rows.filter((r) => r.status === status).length);
  const dateGroups = Array.from(new Set(rows.map((r) => r.dateHeader)));
  const staffGroups = Array.from(new Set(months.map((m) => `${m.staffName} · ${m.role}`)));

  if (showFilterScreen) {
    const isSpecificScope = !isMain || !!initialWarehouseId;
    const currentWarehouseScope = selectedWarehouseId ? warehouseOptions.find((w) => w.warehouseId === selectedWarehouseId) : undefined;
    const currentWarehouseName = isSpecificScope ? (currentWarehouseScope?.warehouseName ?? scope.warehouseName ?? selectedWarehouseId) : undefined;

    return (
      <StaffFiltersScreen
        initialFilters={{
          searchQuery,
          role: roleFilter,
          attendance: attendanceFilter,
          status: statusFilter,
          warehouseId: selectedWarehouseId,
          dateRange: range,
        }}
        showDateRangeFilter={true}
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
          setAttendanceFilter(newFilters.attendance);
          setStatusFilter(newFilters.status);
          if (newFilters.dateRange) {
            setRange(newFilters.dateRange);
            if (newFilters.dateRange === 'Today' && onNavigateToToday) onNavigateToToday();
          }
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
      title="Attendance History"
      onBack={onBack}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <InfoCard
          rows={[
            [
              { label: 'From', value: dates.from },
              { label: 'To', value: dates.to },
            ],
          ]}
        />
        <View style={styles.gap} />
        <KpiRow
          items={[
            { value: count('Present'), label: 'PRESENT', tone: 'success' },
            { value: count('Absent'), label: 'ABSENT', tone: 'danger' },
            { value: count('On Leave'), label: 'LEAVE', tone: 'warning' },
          ]}
        />

        <View style={styles.segmented}>
          {GROUPS.map((group) => {
            const active = group === groupBy;
            return (
              <TouchableOpacity
                key={group}
                style={[styles.segment, active && styles.segmentActive]}
                onPress={() => setGroupBy(group)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>Group by {group}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search staff..."
          onFilterPress={() => setShowFilterScreen(true)}
        />

        {groupBy === 'Date' ? (
          dateGroups.length === 0 ? (
            <EmptyState title="No attendance in this range" />
          ) : (
            dateGroups.map((header) => {
              const group = rows.filter((r) => r.dateHeader === header);
              return (
                <View key={header}>
                  <SectionTitle>{header}</SectionTitle>
                  <ListCard>
                    {group.map((entry, index) => (
                      <ListRow
                        key={entry.id}
                        title={entry.name}
                        subtitle={entry.role}
                        trailing={<AttendanceStatusText status={entry.status} lines={[entry.timeRange]} />}
                        divider={index < group.length - 1}
                      />
                    ))}
                  </ListCard>
                </View>
              );
            })
          )
        ) : staffGroups.length === 0 ? (
          <EmptyState title="No attendance in this range" />
        ) : (
          staffGroups.map((label) => {
            const group = months.filter((m) => `${m.staffName} · ${m.role}` === label);
            return (
              <View key={label}>
                <SectionTitle>{label.toUpperCase()}</SectionTitle>
                <ListCard>
                  {group.map((month, index) => (
                    <ListRow
                      key={month.id}
                      title={month.monthLabel}
                      subtitle={`Present ${month.present} · Absent ${month.absent} · Leave ${month.leave}`}
                      leading={<CalendarIcon color={adminColors.brand} />}
                      trailing={<ChevronRightIcon color={adminColors.muted} />}
                      divider={index < group.length - 1}
                    />
                  ))}
                </ListCard>
              </View>
            );
          })
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  gap: { height: adminSpacing.md },
  segmented: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  segment: { flex: 1, alignItems: 'center', paddingVertical: adminSpacing.sm, borderRadius: adminRadius.sm },
  segmentActive: { backgroundColor: adminColors.brand },
  segmentText: { ...adminType.rowMeta, color: adminColors.muted },
  segmentTextActive: { ...adminType.caption, color: adminColors.onBrand },
});
