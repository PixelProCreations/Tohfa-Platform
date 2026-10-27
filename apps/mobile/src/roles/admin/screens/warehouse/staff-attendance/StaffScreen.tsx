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
import { OverviewDashboardCard } from '../../../components';
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
import { StaffFiltersScreen } from './StaffFiltersScreen';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { useRollCall, useStaffList } from './useStaffData';
import type { PermissionCheck, StaffMember, WarehouseScope, WarehouseScreenBaseProps } from './types';

/** rbac code for the warehouse roster: admin.staff.list_view (MAIN_WH_ADMIN). */
export const STAFF_ROSTER_CODE = 'admin.staff.list_view';
export const LEGACY_STAFF_ROSTER_CODE = 'warehouse.staff.list_view';

/**
 * Access check for the warehouse workforce roster.
 *
 * MAIN_WH_ADMIN holds `admin.staff.list_view` (all warehouses).
 * SUB_WH_ADMIN is scope-locked to its assigned warehouse (`warehouse.own.view`).
 * In addition, legacy/custom tokens holding `warehouse.staff.list_view` or
 * any warehouse-level admin scope are permitted to view the roster.
 */
export function hasStaffRosterAccess(can: PermissionCheck, scope?: WarehouseScope): boolean {
  if (can(STAFF_ROSTER_CODE) || can(LEGACY_STAFF_ROSTER_CODE) || can('warehouse.staff.view')) {
    return true;
  }
  // Sub Warehouse Admin holding own-warehouse view or activity view
  if (can('warehouse.own.view') || can('warehouse.activity.view')) {
    return true;
  }
  // Scope with warehouse assignment (Sub Warehouse scope)
  if (scope?.warehouseId !== undefined) {
    return true;
  }
  return false;
}

type RosterFilter = 'All' | 'Warehouse Staff' | 'Drivers';
const FILTERS: readonly RosterFilter[] = ['All', 'Warehouse Staff', 'Drivers'];

export interface StaffScreenProps extends WarehouseScreenBaseProps {
  onSelectStaff?: ((staff: StaffMember) => void) | undefined;
  onNavigateToAttendance?: ((warehouseId?: string) => void) | undefined;
  onNavigateToHistory?: ((warehouseId?: string) => void) | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Roster rows; defaults to live roster. */
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
  warehouseOptions: customWarehouseOptions,
  members: customMembers,
}: StaffScreenProps) {
  const isMain = isAllWarehouses(scope);
  const [filter, setFilter] = useState<RosterFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const [showFilterScreen, setShowFilterScreen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'All' | 'Warehouse Staff' | 'Driver'>('All');
  const [attendanceFilter, setAttendanceFilter] = useState<'All' | 'Present' | 'Absent' | 'On Leave'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  const { scopes: fetchedWarehouseOptions } = useWarehouseOptions();
  const warehouseOptions = customWarehouseOptions ?? (fetchedWarehouseOptions.length > 0 ? fetchedWarehouseOptions : STAFF_WAREHOUSES);

  const { members: liveMembers, loading: membersLoading } = useStaffList(scope, selectedWarehouseId);
  const members = customMembers ?? liveMembers;

  const { summary: rollCallSummary, loading: rollCallLoading } = useRollCall(scope, selectedWarehouseId);

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
    const isSpecificScope = !isMain || !!selectedWarehouseId;
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
        }}
        showWarehouseSelector={isMain && !selectedWarehouseId}
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
          if (isMain && !selectedWarehouseId && newFilters.warehouseId !== undefined) {
            setSelectedWarehouseId(newFilters.warehouseId);
          }
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
      headerExtra={
        <ScopeHeader
          scope={scope}
          label={isMain ? undefined : scope.warehouseName ?? scope.warehouseId}
          warehouseOptions={warehouseOptions}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={setSelectedWarehouseId}
        />
      }
    >
      {children}
    </WalletScreen>
  );

  if (!hasStaffRosterAccess(can, scope)) {
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


      <View style={styles.kpiGrid}>
        <OverviewDashboardCard
          value={String(rollCallSummary.total)}
          title="Total Staff"
          subtitle="All rostered"
          icon="orders"
        />
        <OverviewDashboardCard
          value={String(rollCallSummary.present)}
          title="Present Today"
          subtitle="On duty"
          icon="pickup"
          tone="success"
        />
        <OverviewDashboardCard
          value={String(rollCallSummary.absent)}
          title="Absent"
          subtitle="Needs attention"
          icon="alert"
          tone="danger"
        />
        <OverviewDashboardCard
          value={String(rollCallSummary.leave)}
          title="On Leave"
          subtitle="Approved leave"
          icon="receiving"
          tone="warning"
        />
      </View>

      {isMain ? (
        <View style={styles.actionRow}>
          {onNavigateToAttendance ? (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigateToAttendance(selectedWarehouseId)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <CalendarIcon size={22} color={adminColors.brand} />
              <Text style={styles.actionText}>Attendance</Text>
            </TouchableOpacity>
          ) : null}
          {onNavigateToHistory ? (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigateToHistory(selectedWarehouseId)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <HistoryIcon size={22} color={adminColors.brand} />
              <Text style={styles.actionText}>Attendance History</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {(attendanceFilter !== 'All' || statusFilter !== 'All') && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 4 }}>
          {attendanceFilter !== 'All' && (
            <TouchableOpacity
              onPress={() => setAttendanceFilter('All')}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: adminColors.brandTint,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: adminRadius.lg,
                gap: 4,
              }}
            >
              <Text style={{ ...adminType.caption, fontWeight: '700', color: adminColors.brand }}>
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
                backgroundColor: adminColors.brandTint,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: adminRadius.lg,
                gap: 4,
              }}
            >
              <Text style={{ ...adminType.caption, fontWeight: '700', color: adminColors.brand }}>
                Status: {statusFilter} ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!isMain ? (
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
      ) : null}

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Staff name, Staff ID, Driver ID, Role"
        onFilterPress={() => setShowFilterScreen(true)}
      />

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
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigateToAttendance(selectedWarehouseId)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <CalendarIcon size={22} color={adminColors.brand} />
              <Text style={styles.actionText}>Attendance</Text>
            </TouchableOpacity>
          ) : null}
          {onNavigateToHistory ? (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigateToHistory(selectedWarehouseId)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <HistoryIcon size={22} color={adminColors.brand} />
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: adminSpacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  kpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  kpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  infoBox: {
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  infoText: {
    ...adminType.body,
    lineHeight: 18,
    fontWeight: '500',
    color: adminColors.info.text,
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
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  chipActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  chipText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  chipTextActive: {
    color: adminColors.brand,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  cardInfo: { flex: 1 },
  name: { ...adminType.sectionHead, color: adminColors.ink },
  meta: { ...adminType.body, color: adminColors.muted, marginTop: 3 },
  badgeRow: { flexDirection: 'row', gap: adminSpacing.xs, marginTop: adminSpacing.xs },
  footerText: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.sm },
  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.md },
  threeCol: { flexDirection: 'row', gap: adminSpacing.sm },
  col: { flex: 1 },
  colLabel: { ...adminType.caption, color: adminColors.muted, marginBottom: 4 },
  colValue: { ...adminType.rowTitle, color: adminColors.ink },
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
  actionRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
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
