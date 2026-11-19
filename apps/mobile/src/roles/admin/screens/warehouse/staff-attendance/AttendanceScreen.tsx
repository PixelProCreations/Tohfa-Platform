/**
 * Attendance overview: one day's roll call, live from GET
 * /admin/staff-attendance/roll-call (admin.staff.attendance.view; SUB none).
 *
 * The day starts at today's Asia/Kolkata date from the real clock and moves
 * with the arrows or the month picker; a day after today cannot be chosen (the
 * server refuses it, BR-84f). The Main scope gets the warehouse selector (GET
 * /warehouses); a confined admin is locked to its own warehouse.
 *
 * KPI tiles are the roll call's own exact counts. Rows open Attendance Detail,
 * where a single day is marked or corrected. With admin.staff.attendance.mark
 * (SA, MAIN; TOHFA and SUB none) the screen also offers "Mark unmarked as
 * present", a bulk PUT /dates/{date} for the staff with no mark yet; it never
 * overwrites an existing Absent or Leave. The marks are upserts, and the spec
 * declares no Idempotency-Key on them.
 */
// Design id: M14-S03
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { adminColors, adminOverlay, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  ChipGroup,
  HeaderIconButton,
  isAllWarehouses,
  KpiRow,
  ScopeHeader,
  SearchBar,
  WalletButton,
  WalletScreen,
  WarehouseTabBar,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  ATTENDANCE_FILTERS,
  attendanceFilterLabel,
  attendanceStatusLabel,
  attendanceStatusTone,
  bulkPresentChunks,
  calendarMonthOf,
  canMarkAttendance,
  canViewAttendance,
  clampToToday,
  dayOf,
  filterRollCall,
  formatIsoDate,
  isAfterDate,
  istToday,
  monthOf,
  shiftIsoDate,
  STAFF_CODES,
  staffWarehouseFilter,
  withDay,
} from './mappers';
import { AttendanceStatusText, ChevronDownIcon, DateNavigator, DatePickerModal, HistoryIcon, ListCard, ListRow, RefreshIcon, StaffAvatar } from './StaffParts';
import type { AttendanceFilter, AttendanceRecordRef, RollCallRow, WarehouseScreenBaseProps } from './types';
import { useBulkAttendanceMutation, useRollCall, useStaffWarehouses } from './useStaffData';

export interface AttendanceScreenProps extends WarehouseScreenBaseProps {
  /** Chip selected on entry (the old Today's Attendance key opens 'All'). */
  initialFilter?: AttendanceFilter | undefined;
  onSelectRecord?: ((record: AttendanceRecordRef) => void) | undefined;
  onNavigateToHistory?: (() => void) | undefined;
  /**
   * Super Admin only: navigate directly to the correction screen for a record.
   * When provided alongside role='SUPER_ADMIN', the per-row Update button routes
   * here instead of opening the detail screen.
   */
  onNavigateToCorrection?: ((record: AttendanceRecordRef) => void) | undefined;
  role?: string | undefined;
}

export function AttendanceScreen({ scope, can, onBack, onTabChange, initialFilter = 'All', onSelectRecord, onNavigateToHistory, onNavigateToCorrection, role }: AttendanceScreenProps) {
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const [quickStatusRecord, setQuickStatusRecord] = useState<AttendanceRecordRef | null>(null);
  const isMain = isAllWarehouses(scope);
  const allowed = canViewAttendance(can);
  const [now] = useState(() => new Date());
  const today = istToday(now);
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState<AttendanceFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(today);
  const [bulkDone, setBulkDone] = useState<number | null>(null);

  const warehouses = useStaffWarehouses(scope, can);
  const warehouseId = staffWarehouseFilter(scope, selectedWarehouseId);
  const rollCall = useRollCall(scope, date, warehouseId, warehouses.nameOf, now, allowed);
  const bulk = useBulkAttendanceMutation();

  const scopeLabel = isMain ? (selectedWarehouseId === undefined ? t('staff.scope.all') : warehouses.nameOf(selectedWarehouseId)) : scope.warehouseName ?? '';
  const changeDate = (next: string) => {
    setDate(clampToToday(next, today));
    setBulkDone(null);
  };

  const frame = (children: React.ReactNode) => (
    <WalletScreen
      title={t('staff.attendance.title')}
      onBack={onBack}
      headerRight={
        allowed ? (
          <View style={styles.headerButtons}>
            <HeaderIconButton onPress={() => rollCall.refresh()} accessibilityLabel={t('staff.attendance.refresh')}>
              <RefreshIcon color={adminColors.onBrand} />
            </HeaderIconButton>
            {onNavigateToHistory ? (
              <HeaderIconButton onPress={onNavigateToHistory} accessibilityLabel={t('staff.history.title')}>
                <HistoryIcon color={adminColors.onBrand} />
              </HeaderIconButton>
            ) : null}
          </View>
        ) : undefined
      }
      headerExtra={
        allowed ? (
          <>
            <DateNavigator
              label={t('staff.attendance.dateLabel', { scope: scopeLabel, date: formatIsoDate(date) })}
              onPrev={() => changeDate(shiftIsoDate(date, -1))}
              onNext={date < today ? () => changeDate(shiftIsoDate(date, 1)) : undefined}
              onPressLabel={() => {
                setPickerDate(date);
                setPickerOpen(true);
              }}
            />
            {isMain && can(STAFF_CODES.warehouseList) ? (
              <ScopeHeader
                scope={scope}
                warehouseOptions={warehouses.options}
                selectedWarehouseId={selectedWarehouseId}
                onSelectWarehouse={setSelectedWarehouseId}
              />
            ) : null}
          </>
        ) : undefined
      }
      footer={<WarehouseTabBar onTabChange={onTabChange} onBack={onBack} />}
    >
      {children}
    </WalletScreen>
  );

  if (!allowed) {
    return frame(<AdminEmptyState title={t('staff.denied.title')} subtitle={t('staff.denied.attendance')} />);
  }

  const visible = filterRollCall(rollCall.rows, filter, searchQuery);
  const view = queryViewState({ isLoading: rollCall.isLoading, error: rollCall.error, itemCount: rollCall.rows.length });
  const summary = rollCall.summary;
  const kpi = (value: number | undefined) => (value === undefined ? t('staff.kpi.unknown') : String(value));
  const chunks = bulkPresentChunks(rollCall.rows);
  const showBulk = canMarkAttendance(can) && chunks.length > 0;

  const makeRecordRef = (row: RollCallRow): AttendanceRecordRef => ({
    staffId: row.staffId,
    date,
    name: row.name,
    designation: row.designation,
  });

  const handleRowUpdate = (row: RollCallRow) => {
    if (isSuperAdmin && onNavigateToCorrection) {
      onNavigateToCorrection(makeRecordRef(row));
    } else if (onSelectRecord) {
      onSelectRecord(makeRecordRef(row));
    } else {
      setQuickStatusRecord(makeRecordRef(row));
    }
  };

  const renderRow = (row: RollCallRow, index: number, list: readonly RollCallRow[]) => (
    <ListRow
      key={row.staffId}
      title={row.name}
      subtitle={isMain ? t('staff.attendance.rowMeta', { designation: row.designation, warehouse: row.warehouseName }) : row.designation}
      leading={<StaffAvatar tone={row.status === 'PRESENT' ? undefined : attendanceStatusTone(row.status)} />}
      trailing={
        <View style={styles.trailingRow}>
          <TouchableOpacity
            style={styles.statusPill}
            onPress={() => handleRowUpdate(row)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('staff.attendance.updateA11y', { name: row.name })}
          >
            <AttendanceStatusText
              label={attendanceStatusLabel(row.status)}
              tone={attendanceStatusTone(row.status)}
              lines={[row.checkInText === null ? null : t('staff.attendance.checkedInAt', { time: row.checkInText })]}
            />
            <ChevronDownIcon size={12} color={adminColors.muted} />
          </TouchableOpacity>
        </View>
      }
      divider={index < list.length - 1}
      onPress={onSelectRecord ? () => onSelectRecord(makeRecordRef(row)) : undefined}
    />
  );

  const cal = calendarMonthOf(pickerDate);
  const pickerIsCurrentMonth = monthOf(pickerDate) === monthOf(today);

  return frame(
    <>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <KpiRow
          items={[
            { value: kpi(summary?.present), label: t('staff.kpi.present'), tone: 'success' },
            { value: kpi(summary?.absent), label: t('staff.kpi.absent'), tone: 'danger' },
            { value: kpi(summary?.leave), label: t('staff.kpi.leave'), tone: 'warning' },
            { value: kpi(summary?.notMarked), label: t('staff.kpi.notMarked') },
          ]}
        />
        <ChipGroup options={ATTENDANCE_FILTERS} value={filter} onChange={setFilter} labelOf={attendanceFilterLabel} />
        <View style={styles.gap} />
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder={t('staff.attendance.searchPlaceholder')} />

        {showBulk ? (
          <View style={styles.bulk}>
            {bulk.error ? <Text style={styles.errorText}>{t(adminErrorKey(bulk.error))}</Text> : null}
            <WalletButton
              label={t('staff.attendance.bulkPresent', { count: summary?.notMarked ?? 0 })}
              variant="outline"
              disabled={bulk.isPending}
              onPress={() =>
                bulk.mutate(
                  { date, chunks },
                  {
                    onSuccess: (created) => {
                      setBulkDone(created);
                      rollCall.refresh();
                    },
                  },
                )
              }
            />
          </View>
        ) : null}
        {bulkDone !== null ? <Text style={styles.doneText}>{t('staff.attendance.bulkDone', { count: bulkDone })}</Text> : null}

        {view === 'loading' ? <AdminLoadingState /> : null}
        {view === 'error' ? <AdminErrorState error={rollCall.error} onRetry={rollCall.refresh} /> : null}
        {view === 'empty' ? <AdminEmptyState title={t('staff.attendance.empty.title')} subtitle={t('staff.attendance.empty.subtitle')} /> : null}
        {view === 'ready' && visible.length === 0 ? (
          <AdminEmptyState title={t('staff.attendance.noMatch.title')} subtitle={t('staff.attendance.noMatch.subtitle', { date: formatIsoDate(date) })} />
        ) : null}
        {view === 'ready' && visible.length > 0 ? <ListCard>{visible.map(renderRow)}</ListCard> : null}
      </ScrollView>

      {/* Quick status info modal — tapping the chevron pill shows detail for non-SA users */}
      <Modal
        visible={!!quickStatusRecord}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickStatusRecord(null)}
      >
        <TouchableOpacity
          style={styles.statusBackdrop}
          activeOpacity={1}
          onPress={() => setQuickStatusRecord(null)}
        >
          <View style={styles.statusSheet}>
            <Text style={styles.statusSheetTitle}>{quickStatusRecord?.name ?? ''}</Text>
            <Text style={styles.statusSheetSub}>{t('staff.attendance.tapToUpdate')}</Text>
            <TouchableOpacity
              style={styles.statusSheetBtn}
              onPress={() => {
                if (quickStatusRecord && onSelectRecord) {
                  onSelectRecord(quickStatusRecord);
                }
                setQuickStatusRecord(null);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.statusSheetBtnText}>{t('staff.attendance.openDetail')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <DatePickerModal
        visible={pickerOpen}
        monthLabel={cal.label}
        daysInMonth={cal.daysInMonth}
        firstWeekday={cal.firstWeekday}
        selectedDay={dayOf(pickerDate)}
        maxDay={pickerIsCurrentMonth ? dayOf(today) : undefined}
        onSelectDay={(day) => setPickerDate(withDay(pickerDate, day))}
        onPrevMonth={() => setPickerDate(withDay(shiftIsoDate(withDay(pickerDate, 1), -1), dayOf(pickerDate)))}
        onNextMonth={
          pickerIsCurrentMonth
            ? undefined
            : () => setPickerDate(clampToToday(withDay(shiftIsoDate(withDay(pickerDate, cal.daysInMonth), 1), dayOf(pickerDate)), today))
        }
        onApply={() => {
          if (!isAfterDate(pickerDate, today)) changeDate(pickerDate);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </>,
  );
}

const styles = StyleSheet.create({
  gap: { height: adminSpacing.md },
  bulk: { marginBottom: adminSpacing.md },
  errorText: { ...adminType.rowMeta, color: adminColors.danger.text, marginBottom: adminSpacing.sm },
  doneText: { ...adminType.rowMeta, color: adminColors.success.text, marginBottom: adminSpacing.md },
  headerButtons: {
    flexDirection: 'row',
    gap: adminSpacing.xs,
  },
  trailingRow: {
    alignItems: 'flex-end',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 4,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  statusBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  statusSheet: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    gap: adminSpacing.sm,
  },
  statusSheetTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 16,
  },
  statusSheetSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  statusSheetBtn: {
    marginTop: adminSpacing.xs,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.sm + 2,
    alignItems: 'center',
  },
  statusSheetBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontSize: 14,
  },
});
