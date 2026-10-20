/**
 * Attendance History: past attendance over a range ending today, live.
 *
 *   Group by Date   GET /admin/staff-attendance?from&to   rows newest day first, cursor paged;
 *                   the KPI tiles are the response's exact counts over every matching row.
 *   Group by Staff  GET /admin/staff-attendance/summary?from&to   per-member counts.
 *
 * Gate: admin.staff.attendance.view (SUB none). The ranges are computed from
 * today's Asia/Kolkata date on the real clock (Today, last 7 days, last 30
 * days, this month), never from fixed demo dates. Opened from Staff Detail, the
 * view is narrowed to that member (`staffId`). Search applies to the By Staff
 * list (the summary returns every member at once); the dated list has no
 * server search, so it is not filtered on the client either.
 */
// Design id: M14-S03
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  CalendarIcon,
  ChipGroup,
  HeaderIconButton,
  InfoCard,
  isAllWarehouses,
  KpiRow,
  ScopeHeader,
  SearchBar,
  SectionTitle,
  WalletButton,
  WalletScreen,
  WarehouseTabBar,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  attendanceStatusLabel,
  attendanceStatusTone,
  canViewAttendance,
  formatIsoDate,
  groupHistoryByDate,
  HISTORY_RANGES,
  historyRangeDates,
  historyRangeLabel,
  istToday,
  STAFF_CODES,
  staffWarehouseFilter,
  type HistoryRange,
} from './mappers';
import { AttendanceStatusText, ListCard, ListRow } from './StaffParts';
import type { WarehouseScreenBaseProps } from './types';
import { useAttendanceList, useAttendanceSummary, useStaffWarehouses } from './useStaffData';

type GroupBy = 'Date' | 'Staff';
const GROUPS: readonly GroupBy[] = ['Date', 'Staff'];

export interface AttendanceHistoryScreenProps extends WarehouseScreenBaseProps {
  /** Header shortcut back to today's Attendance overview. */
  onNavigateToToday?: (() => void) | undefined;
  /** Narrow to one staff member (opened from Staff Detail). */
  staffId?: string | undefined;
  staffName?: string | undefined;
}

export function AttendanceHistoryScreen({ scope, can, onBack, onTabChange, onNavigateToToday, staffId, staffName }: AttendanceHistoryScreenProps) {
  const isMain = isAllWarehouses(scope);
  const allowed = canViewAttendance(can);
  const [now] = useState(() => new Date());
  const today = istToday(now);
  const [range, setRange] = useState<HistoryRange>('This Month');
  const [groupBy, setGroupBy] = useState<GroupBy>('Date');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);

  const warehouses = useStaffWarehouses(scope, can);
  const warehouseId = staffWarehouseFilter(scope, selectedWarehouseId);
  const dates = historyRangeDates(range, today);
  const params = { staffId, warehouseId, from: dates.from, to: dates.to };
  const list = useAttendanceList(scope, params, now, allowed && groupBy === 'Date');
  const summary = useAttendanceSummary(scope, params, allowed);

  const frame = (children: React.ReactNode) => (
    <WalletScreen
      title={t('staff.history.title')}
      subtitle={staffName}
      onBack={onBack}
      headerRight={
        allowed && onNavigateToToday ? (
          <HeaderIconButton onPress={onNavigateToToday} accessibilityLabel={t('staff.history.todayA11y')}>
            <CalendarIcon color={adminColors.onBrand} />
          </HeaderIconButton>
        ) : undefined
      }
      headerExtra={
        <ScopeHeader
          scope={scope}
          label={isMain ? t('staff.scope.all') : scope.warehouseName ?? scope.warehouseId}
          warehouseOptions={warehouses.options}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={allowed && isMain && staffId === undefined && can(STAFF_CODES.warehouseList) ? setSelectedWarehouseId : undefined}
        />
      }
      footer={<WarehouseTabBar onTabChange={onTabChange} onBack={onBack} />}
    >
      {children}
    </WalletScreen>
  );

  if (!allowed) {
    return frame(<AdminEmptyState title={t('staff.denied.title')} subtitle={t('staff.denied.attendance')} />);
  }

  const totals = summary.totals;
  const kpi = (value: number | undefined) => (value === undefined ? t('staff.kpi.unknown') : String(value));
  const q = searchQuery.trim().toLowerCase();
  const staffRows = summary.rows.filter((row) => q === '' || row.name.toLowerCase().includes(q) || row.designation.toLowerCase().includes(q));

  const dateView = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });
  const staffView = queryViewState({ isLoading: summary.isLoading, error: summary.error, itemCount: summary.rows.length });

  return frame(
    <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
      <InfoCard
        rows={[
          [
            { label: t('staff.history.from'), value: formatIsoDate(dates.from) },
            { label: t('staff.history.to'), value: formatIsoDate(dates.to) },
          ],
        ]}
      />
      <View style={styles.gap} />
      <ChipGroup options={HISTORY_RANGES} value={range} onChange={setRange} labelOf={historyRangeLabel} />
      <View style={styles.gap} />
      <KpiRow
        items={[
          { value: kpi(totals?.present), label: t('staff.kpi.present'), tone: 'success' },
          { value: kpi(totals?.absent), label: t('staff.kpi.absent'), tone: 'danger' },
          { value: kpi(totals?.leave), label: t('staff.kpi.leave'), tone: 'warning' },
        ]}
      />

      {staffId === undefined ? (
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
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {group === 'Date' ? t('staff.history.groupByDate') : t('staff.history.groupByStaff')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {groupBy === 'Date' || staffId !== undefined ? (
        <>
          {dateView === 'loading' ? <AdminLoadingState /> : null}
          {dateView === 'error' ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
          {dateView === 'empty' ? <AdminEmptyState title={t('staff.history.empty')} /> : null}
          {dateView === 'ready'
            ? groupHistoryByDate(list.items).map((group) => (
                <View key={group.date}>
                  <SectionTitle>{group.dateText}</SectionTitle>
                  <ListCard>
                    {group.entries.map((entry, index) => (
                      <ListRow
                        key={entry.id}
                        title={entry.name}
                        subtitle={entry.designation}
                        trailing={
                          <AttendanceStatusText
                            label={attendanceStatusLabel(entry.status)}
                            tone={attendanceStatusTone(entry.status)}
                            lines={[entry.timeRange]}
                          />
                        }
                        divider={index < group.entries.length - 1}
                      />
                    ))}
                  </ListCard>
                </View>
              ))
            : null}
          {dateView === 'ready' && list.hasMore ? (
            <WalletButton label={t('staff.common.loadMore')} variant="outline" onPress={list.loadMore} />
          ) : null}
        </>
      ) : (
        <>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder={t('staff.history.searchPlaceholder')} />
          {staffView === 'loading' ? <AdminLoadingState /> : null}
          {staffView === 'error' ? <AdminErrorState error={summary.error} onRetry={summary.refresh} /> : null}
          {staffView === 'empty' || (staffView === 'ready' && staffRows.length === 0) ? (
            <AdminEmptyState title={t('staff.history.empty')} />
          ) : null}
          {staffView === 'ready' && staffRows.length > 0 ? (
            <ListCard>
              {staffRows.map((row, index) => (
                <ListRow
                  key={row.staffId}
                  title={row.name}
                  subtitle={t('staff.history.staffCounts', { present: row.present, absent: row.absent, leave: row.leave })}
                  trailing={<Text style={styles.marked}>{t('staff.history.marked', { count: row.marked })}</Text>}
                  divider={index < staffRows.length - 1}
                />
              ))}
            </ListCard>
          ) : null}
        </>
      )}
    </ScrollView>,
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
  marked: { ...adminType.rowMeta, color: adminColors.muted },
});
