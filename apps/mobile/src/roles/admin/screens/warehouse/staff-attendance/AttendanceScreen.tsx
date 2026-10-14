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

import { adminSpacing } from '../../../theme';
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
import type { AttendanceFilter, AttendanceRecord, AttendanceStatus, WarehouseScope, WarehouseScreenBaseProps } from './types';

const FILTERS: readonly AttendanceFilter[] = ['All', 'Present', 'Absent', 'On Leave'];
const SECTIONS: readonly AttendanceStatus[] = ['Present', 'Absent', 'On Leave', 'Not Checked In'];

export interface AttendanceScreenProps extends WarehouseScreenBaseProps {
  /** Chip selected on entry (the old Today's Attendance key opens 'All'). */
  initialFilter?: AttendanceFilter | undefined;
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
  onSelectRecord,
  onNavigateToHistory,
  warehouseOptions = STAFF_WAREHOUSES,
  records = ATTENDANCE_RECORDS,
}: AttendanceScreenProps) {
  const isMain = isAllWarehouses(scope);
  const [filter, setFilter] = useState<AttendanceFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
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

  return (
    <WalletScreen
      title="Attendance"
      onBack={onBack}
      headerRight={
        onNavigateToHistory ? (
          <HeaderIconButton onPress={onNavigateToHistory} accessibilityLabel="Attendance history">
            <HistoryIcon />
          </HeaderIconButton>
        ) : undefined
      }
      headerExtra={
        isMain ? (
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
              warehouseOptions={warehouseOptions}
              selectedWarehouseId={selectedWarehouseId}
              onSelectWarehouse={setSelectedWarehouseId}
            />
          </>
        ) : undefined
      }
      footer={<WarehouseTabBar onTabChange={onTabChange} onBack={onBack} activeTab="More" />}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {!isMain ? (
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>PRESENT</Text>
              <Text style={[styles.kpiValue, { color: '#16A34A' }]}>{count('Present')}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ABSENT</Text>
              <Text style={[styles.kpiValue, { color: '#DC2626' }]}>{count('Absent')}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ON LEAVE</Text>
              <Text style={[styles.kpiValue, { color: '#D97706' }]}>{count('On Leave')}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL</Text>
              <Text style={[styles.kpiValue, { color: '#111827' }]}>{String(dayRecords.length)}</Text>
            </View>
          </View>
        ) : (
          <KpiRow
            items={[
              { value: count('Present'), label: 'PRESENT', tone: 'success' },
              { value: count('Absent'), label: 'ABSENT', tone: 'danger' },
              { value: count('On Leave'), label: 'ON LEAVE', tone: 'warning' },
              { value: String(dayRecords.length), label: 'TOTAL' },
            ]}
          />
        )}

        {isMain ? (
          <>
            <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />
            <View style={styles.gap} />
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search employee..." />
          </>
        ) : (
          <View style={styles.searchBar}>
            <SearchIcon size={18} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search employee..."
              placeholderTextColor="#6B7280"
            />
            <TouchableOpacity
              onPress={() => {
                setFilter((prev) => {
                  if (prev === 'All') return 'Present';
                  if (prev === 'Present') return 'Absent';
                  if (prev === 'Absent') return 'On Leave';
                  return 'All';
                });
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Filter attendance"
            >
              <SlidersIcon size={18} color={filter !== 'All' ? '#C2410C' : '#4B5563'} />
            </TouchableOpacity>
          </View>
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
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#111827',
  },
});
