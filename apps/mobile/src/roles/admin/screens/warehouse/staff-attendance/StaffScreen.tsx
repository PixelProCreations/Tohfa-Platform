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
  ChipGroup,
  EmptyState,
  inScope,
  isAllWarehouses,
  KpiRow,
  ScopeHeader,
  SearchBar,
  SectionTitle,
  StatusBadge,
  WalletScreen,
  WarehouseTabBar,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { STAFF_MEMBERS, STAFF_WAREHOUSES, staffWarehouseName } from './fixtures';
import { attendanceTone, ChevronRightIcon, HistoryIcon, StaffAvatar, StaffGroupIcon } from './StaffParts';
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
    return matchesSearch && matchesFilter;
  });

  const frame = (children: React.ReactNode) => (
    <WalletScreen
      title="Staff"
      onBack={onBack}
      headerRight={<StaffGroupIcon />}
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

      <KpiRow
        items={[
          { value: String(scoped.length), label: 'TOTAL VISIBLE' },
          { value: count((m) => m.attendance === 'Present'), label: 'PRESENT TODAY', tone: 'success' },
          { value: count((m) => m.attendance === 'Absent'), label: 'ABSENT', tone: 'danger' },
          { value: count((m) => m.attendance === 'On Leave'), label: 'ON LEAVE', tone: 'warning' },
        ]}
      />

      <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />
      <View style={styles.searchGap} />
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
              <CalendarIcon size={22} color={adminColors.brand} />
              <Text style={styles.actionText}>Attendance</Text>
            </TouchableOpacity>
          ) : null}
          {onNavigateToHistory ? (
            <TouchableOpacity style={styles.actionCard} onPress={onNavigateToHistory} activeOpacity={0.8} accessibilityRole="button">
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
  searchGap: { height: adminSpacing.md },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  cardInfo: { flex: 1 },
  name: { ...adminType.rowTitle, color: adminColors.ink },
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: adminSpacing.xs, marginTop: adminSpacing.xs },
  footerText: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.sm },
  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.md },
  threeCol: { flexDirection: 'row', gap: adminSpacing.sm },
  col: { flex: 1 },
  colLabel: { ...adminType.rowMeta, color: adminColors.muted },
  colValue: { ...adminType.rowTitle, color: adminColors.ink, marginTop: 2 },
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
