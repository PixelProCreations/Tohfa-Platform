/**
 * Attendance overview: one day's attendance for the warehouse(s) in scope.
 * Matching M14-S03 Today's Attendance exact mockup.
 */
// Design id: M14-S03
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminOverlay, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  EmptyState,
  inScope,
  isAllWarehouses,
  SearchBar,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  ATTENDANCE_RECORDS,
  STAFF_WAREHOUSES,
} from './fixtures';
import {
  CalendarIcon,
  ChevronDownIcon,
  ClockOutlineIcon,
  PersonIcon,
  RefreshIcon,
  UpdateAttendanceModal,
} from './StaffParts';
import { StaffFiltersScreen } from './StaffFiltersScreen';
import type { AttendanceFilter, AttendanceRecord, AttendanceStatus, WarehouseScope, WarehouseScreenBaseProps } from './types';

const ATTENDANCE_STATUS_OPTIONS: readonly AttendanceStatus[] = ['Present', 'Absent', 'On Leave'];

function getStatusToneColor(status: AttendanceStatus): string {
  if (status === 'Present') return adminColors.success.text;
  if (status === 'Absent') return adminColors.danger.text;
  return adminColors.warning.text;
}

export interface AttendanceScreenProps extends WarehouseScreenBaseProps {
  initialFilter?: AttendanceFilter | undefined;
  initialWarehouseId?: string | undefined;
  onSelectRecord?: ((record: AttendanceRecord) => void) | undefined;
  onNavigateToHistory?: (() => void) | undefined;
  onNavigateToCorrection?: ((record: AttendanceRecord) => void) | undefined;
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  records?: readonly AttendanceRecord[] | undefined;
  role?: string | undefined;
}

export function AttendanceScreen({
  scope,
  onBack,
  onTabChange: _onTabChange,
  initialFilter = 'All',
  initialWarehouseId,
  onSelectRecord,
  onNavigateToHistory: _onNavigateToHistory,
  onNavigateToCorrection,
  warehouseOptions = STAFF_WAREHOUSES,
  records = ATTENDANCE_RECORDS,
  role,
}: AttendanceScreenProps) {
  const isMain = isAllWarehouses(scope);
  const [filter, setFilter] = useState<AttendanceFilter>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(initialWarehouseId);
  const [roleFilter, setRoleFilter] = useState<'All' | 'Warehouse Staff' | 'Driver'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [showFilterScreen, setShowFilterScreen] = useState(false);
  const [dayRecords, setDayRecords] = useState<AttendanceRecord[]>(() => [...records]);
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<AttendanceRecord | null>(null);
  const [statusDropdownRecord, setStatusDropdownRecord] = useState<AttendanceRecord | null>(null);

  const warehouseName = isMain
    ? 'All Warehouses'
    : (scope.warehouseName ?? scope.warehouseId ?? 'Coonoor Warehouse');

  const visible = useMemo(() => {
    return dayRecords.filter((r) => {
      if (!inScope(scope, r.warehouseId, selectedWarehouseId)) return false;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || r.name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q);
      const matchesRole =
        roleFilter === 'All'
          ? true
          : roleFilter === 'Driver'
          ? r.type === 'driver' || r.role.toLowerCase().includes('driver')
          : r.type === 'warehouse' || !r.role.toLowerCase().includes('driver');
      const matchesFilter = filter === 'All' || r.status === filter;
      return matchesQuery && matchesRole && matchesFilter;
    });
  }, [dayRecords, scope, selectedWarehouseId, searchQuery, roleFilter, filter]);

  const count = (status: AttendanceStatus) =>
    String(dayRecords.filter((r) => inScope(scope, r.warehouseId, selectedWarehouseId) && r.status === status).length);
  const totalCount = String(
    dayRecords.filter((r) => inScope(scope, r.warehouseId, selectedWarehouseId)).length
  );

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
      title="Today's Attendance"
      onBack={onBack}
      headerRight={
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => setDayRecords([...records])}
          activeOpacity={0.8}
          accessibilityLabel="Refresh attendance"
        >
          <RefreshIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
      }
      headerExtra={
        <View style={styles.pillContainer}>
          <View style={styles.warehouseDatePill}>
            <Text style={styles.warehouseDatePillText}>
              🏬 {warehouseName.replace(/Warehouse/i, '').trim()} Warehouse · 25 Sep 2026
            </Text>
          </View>
        </View>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 4 Stats Cards in Row (Image 3 Left) */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>PRESENT</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{count('Present')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ABSENT</Text>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{count('Absent')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ON LEAVE</Text>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{count('On Leave')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL</Text>
            <Text style={[styles.statValue, { color: '#111827' }]}>{totalCount}</Text>
          </View>
        </View>

        {/* Search Bar with Filter Icon */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search employee..."
          onFilterPress={() => setShowFilterScreen(true)}
        />

        {visible.length === 0 ? (
          <EmptyState title="No attendance records" subtitle="No employee records match the current filter." />
        ) : (
          <View style={styles.listContainer}>
            {visible.map((item) => {
              const toneColor = getStatusToneColor(item.status);

              const isSuperAdmin = role === 'SUPER_ADMIN';

              const handleItemPress = () => {
                if (isSuperAdmin && onNavigateToCorrection) {
                  onNavigateToCorrection(item);
                } else if (onSelectRecord) {
                  onSelectRecord(item);
                }
              };

              const handleUpdatePress = () => {
                if (isSuperAdmin && onNavigateToCorrection) {
                  onNavigateToCorrection(item);
                } else {
                  setSelectedRecordForModal(item);
                }
              };

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.employeeCard}
                  onPress={handleItemPress}
                  activeOpacity={0.85}
                >
                  {/* Top Row: Avatar, Name/Role, Status Pill, Update Button */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.avatarCircle}>
                      <PersonIcon size={22} color="#8B5E3C" />
                    </View>

                    <View style={styles.employeeInfo}>
                      <Text style={styles.employeeName}>{item.name}</Text>
                      <Text style={styles.employeeRole}>{item.role}</Text>
                    </View>

                    {/* Attendance Dropdown Pill */}
                    <TouchableOpacity
                      style={styles.statusPill}
                      onPress={() => setStatusDropdownRecord(item)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Change attendance status for ${item.name}`}
                    >
                      <View style={[styles.statusDot, { backgroundColor: toneColor }]} />
                      <Text style={[styles.statusPillText, { color: toneColor }]}>{item.status}</Text>
                      <ChevronDownIcon size={12} color={adminColors.muted} />
                    </TouchableOpacity>

                    {/* Update Button */}
                    <TouchableOpacity
                      style={styles.updateBtn}
                      onPress={handleUpdatePress}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.updateBtnText}>Update</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Divider */}
                  <View style={styles.cardDivider} />

                  {/* Bottom Row: Date, Check-in, Check-out */}
                  <View style={styles.cardBottomRow}>
                    <View style={styles.metaItem}>
                      <CalendarIcon size={14} color="#6B7280" />
                      <Text style={styles.metaText}>25 Sep 2026</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <ClockOutlineIcon size={14} color="#6B7280" />
                      <Text style={styles.metaText}>
                        Check-in {item.status === 'Absent' ? '--:--' : (item.checkInTime || '9:02 AM')}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaText}>
                        Check-out {item.status === 'Absent' ? '--:--' : '06:05 PM'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Update Attendance Bottom Modal Sheet (Image 3 Right) */}
      {selectedRecordForModal && (
        <UpdateAttendanceModal
          visible={!!selectedRecordForModal}
          name={selectedRecordForModal.name}
          initialStatus={selectedRecordForModal.status}
          initialCheckIn={selectedRecordForModal.checkInTime || '09:02 AM'}
          initialCheckOut="06:05 PM"
          onClose={() => setSelectedRecordForModal(null)}
          onUpdate={({ status, checkIn }) => {
            setDayRecords((prev) =>
              prev.map((r) =>
                r.id === selectedRecordForModal.id
                  ? { ...r, status, checkInTime: status === 'Absent' ? undefined : checkIn }
                  : r
              )
            );
            setSelectedRecordForModal(null);
          }}
        />
      )}

      {/* Quick Status Dropdown Menu (Present / Absent / On Leave) */}
      <Modal
        visible={!!statusDropdownRecord}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusDropdownRecord(null)}
      >
        <TouchableOpacity
          style={styles.statusMenuBackdrop}
          activeOpacity={1}
          onPress={() => setStatusDropdownRecord(null)}
        >
          <View style={styles.statusMenuSheet}>
            <Text style={styles.statusMenuTitle}>
              {statusDropdownRecord?.name} — Attendance Status
            </Text>
            {ATTENDANCE_STATUS_OPTIONS.map((opt) => {
              const isSelected = statusDropdownRecord?.status === opt;
              const optColor = getStatusToneColor(opt);
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.statusMenuOption, isSelected && styles.statusMenuOptionSelected]}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  onPress={() => {
                    if (!statusDropdownRecord) return;
                    setDayRecords((prev) =>
                      prev.map((r) =>
                        r.id === statusDropdownRecord.id
                          ? {
                              ...r,
                              status: opt,
                              checkInTime: opt === 'Absent' ? undefined : (r.checkInTime || '09:02 AM'),
                            }
                          : r
                      )
                    );
                    setStatusDropdownRecord(null);
                  }}
                >
                  <View style={styles.statusMenuOptionLeft}>
                    <View style={[styles.statusDot, { backgroundColor: optColor }]} />
                    <Text style={[styles.statusMenuOptionText, { color: optColor }]}>{opt}</Text>
                  </View>
                  {isSelected ? <Text style={[styles.statusMenuCheck, { color: optColor }]}>✓</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillContainer: {
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 4,
  },
  warehouseDatePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  warehouseDatePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: adminSpacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEBE6',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  listContainer: {
    gap: 12,
    marginTop: 8,
  },
  employeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEBE6',
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5EBE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  employeeRole: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  updateBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#6B7280',
  },
  statusMenuBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  statusMenuSheet: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    gap: adminSpacing.xs,
  },
  statusMenuTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  statusMenuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.sm + 2,
    paddingHorizontal: adminSpacing.md,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  statusMenuOptionSelected: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
  },
  statusMenuOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  statusMenuOptionText: {
    ...adminType.rowTitle,
    fontSize: 14,
  },
  statusMenuCheck: {
    ...adminType.rowTitle,
    fontSize: 15,
  },
});
