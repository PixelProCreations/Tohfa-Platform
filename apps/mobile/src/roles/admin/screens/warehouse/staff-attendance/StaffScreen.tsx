/**
 * Staff (warehouse workforce roster): drivers and warehouse staff.
 *
 * Gate (FINAL_LIST 120, rbac 1.2.0): `warehouse.staff.list_view`, MAIN_WH_ADMIN
 * all, SUB_WH_ADMIN own. Without it the screen renders a not-available note;
 * the hosts also hide the entry. A Sub scope is locked to its own warehouse
 * (scope.warehouseName in the header pill); the Main scope (warehouseId
 * undefined) gets the All-warehouses selector.
 *
 * The old Sub screen carried a red banner saying "No admin staff list ... SWA's
 * role matrix doesn't grant admin-staff visibility" while rendering the roster.
 * That contradicted itself (and is now wrong: SUB holds the roster code, the
 * admin-account list is admin.staff.list_view), so it is removed.
 *
 * Absorbs Main MainWarehouseStaffScreen (pair M14-S01): for the Main view the
 * roster is split into DRIVERS / WAREHOUSE STAFF sections with status badges
 * and a per-row warehouse label, and the "Attendance Dashboard" banner opens
 * the attendance overview. KPI tiles are counted from the visible rows instead
 * of fixed numbers.
 */
// Design id: M14-S01
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  CalendarIcon,
  EmptyState,
  HeaderIconButton,
  inScope,
  isAllWarehouses,
  ScopeHeader,
  SearchBar,
  SectionTitle,
  StatusBadge,
  WalletScreen,
  WarehouseTabBar,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { STAFF_MEMBERS, STAFF_WAREHOUSES, staffWarehouseName } from './fixtures';
import { attendanceTone, ChevronRightIcon, FilterSlidersIcon, HistoryIcon, StaffAvatar, StaffGroupIcon } from './StaffParts';
import { StaffFiltersScreen, type StaffFilterValues } from './StaffFiltersScreen';
import type { StaffMember, WarehouseScope, WarehouseScreenBaseProps } from './types';

/** rbac code for the warehouse roster (not admin.staff.list_view, the admin-account list). */
export const STAFF_ROSTER_CODE = 'warehouse.staff.list_view';

type RosterFilter = 'All' | 'Warehouse Staff' | 'Drivers';
const FILTERS: readonly RosterFilter[] = ['All', 'Warehouse Staff', 'Drivers'];

export interface StaffScreenProps extends WarehouseScreenBaseProps {
  onSelectStaff?: ((staff: StaffMember) => void) | undefined;
  onNavigateToAttendance?: (() => void) | undefined;
  onNavigateToHistory?: (() => void) | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Roster rows; defaults to the mock set until a roster API exists. */
  members?: readonly StaffMember[] | undefined;
}

export function StaffScreen({
  scope,
  can,
  onBack,
  onTabChange,
  onSelectStaff,
  onNavigateToAttendance,
  onNavigateToHistory,
  warehouseOptions = STAFF_WAREHOUSES,
  members = STAFF_MEMBERS,
}: StaffScreenProps) {
  const isMain = isAllWarehouses(scope);
  const [filter, setFilter] = useState<RosterFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const [showFilterScreen, setShowFilterScreen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'All' | 'Warehouse Staff' | 'Driver'>('All');
  const [attendanceFilter, setAttendanceFilter] = useState<'All' | 'Present' | 'Absent' | 'On Leave'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  const scoped = useMemo(
    () => members.filter((m) => inScope(scope, m.warehouseId, selectedWarehouseId)),
    [members, scope, selectedWarehouseId],
  );
  const visible = scoped.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q || m.name.toLowerCase().includes(q) || m.staffId.toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
    const matchesFilter =
      filter === 'All' || (filter === 'Warehouse Staff' && m.type === 'warehouse') || (filter === 'Drivers' && m.type === 'driver');
    const matchesRole =
      roleFilter === 'All' ||
      (roleFilter === 'Warehouse Staff' && m.type === 'warehouse') ||
      (roleFilter === 'Driver' && m.type === 'driver');
    const matchesAttendance = attendanceFilter === 'All' || m.attendance === attendanceFilter;
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchesSearch && matchesFilter && matchesRole && matchesAttendance && matchesStatus;
  });

  if (showFilterScreen) {
    return (
      <StaffFiltersScreen
        initialFilters={{
          searchQuery,
          role: roleFilter,
          attendance: attendanceFilter,
          status: statusFilter,
        }}
        warehouseName={isMain ? undefined : scope.warehouseName ?? scope.warehouseId}
        onBack={() => setShowFilterScreen(false)}
        onApply={(newFilters) => {
          setSearchQuery(newFilters.searchQuery);
          setRoleFilter(newFilters.role);
          setAttendanceFilter(newFilters.attendance);
          setStatusFilter(newFilters.status);
          if (newFilters.role === 'Warehouse Staff') setFilter('Warehouse Staff');
          else if (newFilters.role === 'Driver') setFilter('Drivers');
          else setFilter('All');
          setShowFilterScreen(false);
        }}
      />
    );
  }

  const frame = (children: React.ReactNode) => (
    <WalletScreen
      title={
        <View style={styles.headerTitleRow}>
          <StaffGroupIcon size={22} color={adminColors.onBrand} />
          <Text style={styles.headerTitleText}>Staff</Text>
        </View>
      }
      onBack={onBack}
      headerRight={
        <HeaderIconButton accessibilityLabel="Filter staff" onPress={() => setShowFilterScreen(true)}>
          <FilterSlidersIcon />
        </HeaderIconButton>
      }
      headerExtra={
        <ScopeHeader
          scope={scope}
          label={isMain ? undefined : scope.warehouseName ?? scope.warehouseId}
          warehouseOptions={warehouseOptions}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={setSelectedWarehouseId}
        />
      }
      footer={<WarehouseTabBar onTabChange={onTabChange} onBack={onBack} />}
    >
      {children}
    </WalletScreen>
  );

  if (!can(STAFF_ROSTER_CODE)) {
    return frame(
      <EmptyState title="Staff roster not available" subtitle="Your role does not include the warehouse staff roster." />,
    );
  }

  const count = (pred: (m: StaffMember) => boolean) => String(scoped.filter(pred).length);
  const drivers = visible.filter((m) => m.type === 'driver');
  const warehouseStaff = visible.filter((m) => m.type === 'warehouse');

  const renderCard = (staff: StaffMember) => (
    <TouchableOpacity
      key={staff.id}
      style={styles.card}
      onPress={onSelectStaff ? () => onSelectStaff(staff) : undefined}
      activeOpacity={0.85}
      accessibilityRole="button"
    >
      <View style={styles.cardHeader}>
        <StaffAvatar type={staff.type} />
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{staff.name}</Text>
          <Text style={styles.meta}>
            {staff.type === 'driver' ? 'Driver ID: ' : 'Staff ID: '}
            {staff.staffId}
            {isMain && staff.warehouseId ? ` · ${staffWarehouseName(staff.warehouseId)}` : ''}
          </Text>
          {isMain ? (
            <View style={styles.badgeRow}>
              <StatusBadge label={staff.status} tone={staff.status === 'Active' ? 'success' : 'danger'} />
              <StatusBadge label={staff.attendance} tone={attendanceTone(staff.attendance)} />
            </View>
          ) : null}
        </View>
      </View>
      {isMain ? (
        staff.type === 'driver' ? (
          <Text style={styles.footerText}>Deliveries Today: {staff.deliveriesToday ?? 0}</Text>
        ) : null
      ) : (
        <>
          <View style={styles.divider} />
          <View style={styles.threeCol}>
            {(staff.type === 'driver'
              ? [
                  ['Status', staff.status],
                  ["Today's Attendance", staff.attendance],
                  ['Deliveries Today', String(staff.deliveriesToday ?? 0)],
                ]
              : [
                  ['Role', staff.role],
                  ['Status', staff.status],
                  ['Attendance', staff.attendance],
                ]
            ).map(([label, value]) => (
              <View key={label} style={styles.col}>
                <Text style={styles.colLabel}>{label}</Text>
                <Text style={styles.colValue}>{value}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </TouchableOpacity>
  );

  return frame(
    <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
      {isMain && onNavigateToAttendance ? (
        <TouchableOpacity style={styles.banner} onPress={onNavigateToAttendance} activeOpacity={0.8} accessibilityRole="button">
          <View style={styles.bannerIcon}>
            <CalendarIcon color={adminColors.brand} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.bannerTitle}>Attendance Dashboard</Text>
            <Text style={styles.meta}>View today&apos;s attendance & history</Text>
          </View>
          <ChevronRightIcon color={adminColors.brand} />
        </TouchableOpacity>
      ) : null}

      <View style={styles.kpiGrid}>
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TOTAL VISIBLE</Text>
            <Text style={styles.kpiValue}>{scoped.length}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>PRESENT TODAY</Text>
            <Text style={[styles.kpiValue, { color: adminColors.success.text }]}>
              {count((m) => m.attendance === 'Present')}
            </Text>
          </View>
        </View>
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>ABSENT</Text>
            <Text style={[styles.kpiValue, { color: adminColors.danger.text }]}>
              {count((m) => m.attendance === 'Absent')}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>ON LEAVE</Text>
            <Text style={[styles.kpiValue, { color: adminColors.warning.text }]}>
              {count((m) => m.attendance === 'On Leave')}
            </Text>
          </View>
        </View>
      </View>

      {(attendanceFilter !== 'All' || statusFilter !== 'All') && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 4 }}>
          {attendanceFilter !== 'All' && (
            <TouchableOpacity
              onPress={() => setAttendanceFilter('All')}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFF1EB',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 14,
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#F0562A' }}>
                Attendance: {attendanceFilter} ✕
              </Text>
            </TouchableOpacity>
          )}
          {statusFilter !== 'All' && (
            <TouchableOpacity
              onPress={() => setStatusFilter('All')}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFF1EB',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 14,
                gap: 4,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#F0562A' }}>
                Status: {statusFilter} ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.chipRow}>
        {FILTERS.map((item) => {
          const active = item === filter;
          return (
            <TouchableOpacity
              key={item}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => {
                setFilter(item);
                if (item === 'Warehouse Staff') setRoleFilter('Warehouse Staff');
                else if (item === 'Drivers') setRoleFilter('Driver');
                else setRoleFilter('All');
              }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Staff name, Staff ID, Driver ID, Role" />

      {visible.length === 0 ? <EmptyState title="No staff found" subtitle="Try another name, ID or filter." /> : null}

      {isMain ? (
        <>
          {drivers.length > 0 ? <SectionTitle>DRIVERS</SectionTitle> : null}
          {drivers.map(renderCard)}
          {warehouseStaff.length > 0 ? <SectionTitle>WAREHOUSE STAFF</SectionTitle> : null}
          {warehouseStaff.map(renderCard)}
        </>
      ) : (
        visible.map(renderCard)
      )}

      {!isMain ? (
        <View style={styles.actionRow}>
          {onNavigateToAttendance ? (
            <TouchableOpacity style={styles.actionCard} onPress={onNavigateToAttendance} activeOpacity={0.8} accessibilityRole="button">
              <CalendarIcon size={22} color="#F0562A" />
              <Text style={styles.actionText}>Attendance</Text>
            </TouchableOpacity>
          ) : null}
          {onNavigateToHistory ? (
            <TouchableOpacity style={styles.actionCard} onPress={onNavigateToHistory} activeOpacity={0.8} accessibilityRole="button">
              <HistoryIcon size={22} color="#F0562A" />
              <Text style={styles.actionText}>Attendance History</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </ScrollView>,
  );
}

const BANNER_ICON = 40;

const styles = StyleSheet.create({
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  headerTitleText: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  kpiGrid: {
    gap: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    color: '#1D4ED8',
  },
  chipRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: adminColors.card,
  },
  chipActive: {
    borderColor: '#F0562A',
    backgroundColor: '#FFF7ED',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#F0562A',
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  cardInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  meta: { fontSize: 13, color: '#64748B', marginTop: 3 },
  badgeRow: { flexDirection: 'row', gap: adminSpacing.xs, marginTop: adminSpacing.xs },
  footerText: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.sm },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: adminSpacing.md },
  threeCol: { flexDirection: 'row', gap: adminSpacing.sm },
  col: { flex: 1 },
  colLabel: { fontSize: 11, color: '#64748B', marginBottom: 4 },
  colValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  bannerIcon: {
    width: BANNER_ICON,
    height: BANNER_ICON,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: { ...adminType.rowTitle, color: adminColors.brandDeep },
  actionRow: { flexDirection: 'row', gap: adminSpacing.md, marginTop: adminSpacing.sm },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.lg,
  },
  actionText: { ...adminType.rowTitle, color: adminColors.ink },
});
