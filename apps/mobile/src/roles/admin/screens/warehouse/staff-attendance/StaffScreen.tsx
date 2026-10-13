import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

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
import { attendanceTone, FilterSlidersIcon, HistoryIcon, StaffAvatar, StaffGroupIcon } from './StaffParts';
import { StaffFiltersScreen, type StaffFilterValues } from './StaffFiltersScreen';
import type { StaffMember, WarehouseScope, WarehouseScreenBaseProps } from './types';

/** rbac code for the warehouse roster (not admin.staff.list_view, the admin-account list). */
export const STAFF_ROSTER_CODE = 'warehouse.staff.list_view';

type RosterFilter = 'All' | 'Warehouse Staff' | 'Drivers';
const FILTERS: readonly RosterFilter[] = ['All', 'Warehouse Staff', 'Drivers'];
const SUB_FILTERS: readonly RosterFilter[] = ['Warehouse Staff', 'Drivers'];

/** ID badge icon displayed next to "Staff" on the Main Warehouse header (Image 1). */
function StaffBadgeIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 3h6v2H9V3z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="4" y="5" width="16" height="16" rx="3" stroke={color} strokeWidth="1.8" />
      <Circle cx="8.5" cy="11.5" r="2" stroke={color} strokeWidth="1.6" />
      <Path d="M6 16.5c0-1.6 1.1-2.5 2.5-2.5s2.5.9 2.5 2.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M13.5 11h4.5M13.5 14h3" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

/** Delivery truck avatar for drivers in Main Warehouse list (Image 1). */
function MainDriverAvatar() {
  return (
    <View style={styles.driverAvatar}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Rect x="1" y="4" width="14" height="12" rx="2" stroke="#C8622A" strokeWidth="1.8" />
        <Path d="M15 8h4l3 3.5v4.5h-7V8z" stroke="#C8622A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="5.5" cy="18.5" r="2.2" stroke="#C8622A" strokeWidth="1.8" />
        <Circle cx="18" cy="18.5" r="2.2" stroke="#C8622A" strokeWidth="1.8" />
      </Svg>
    </View>
  );
}

/** Person avatar for warehouse staff in Main Warehouse list (Image 1). */
function MainStaffPersonAvatar() {
  return (
    <View style={styles.staffPersonAvatar}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M19 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-7A3.5 3.5 0 0 0 5 18.5V20" stroke="#8C6E4E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="12" cy="7.5" r="3.5" stroke="#8C6E4E" strokeWidth="1.8" />
      </Svg>
    </View>
  );
}

/** Search icon for Main Warehouse search bar (Image 1). */
function SearchLensIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke="#78716C" strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke="#78716C" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface StaffScreenProps extends WarehouseScreenBaseProps {
  onSelectStaff?: ((staff: StaffMember) => void) | undefined;
  onNavigateToAttendance?: ((warehouseId?: string) => void) | undefined;
  onNavigateToHistory?: ((warehouseId?: string) => void) | undefined;
  selectedWarehouseId?: string | undefined;
  onSelectWarehouse?: ((id: string | undefined) => void) | undefined;
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
  selectedWarehouseId: externalWarehouseId,
  onSelectWarehouse: externalOnSelectWarehouse,
  warehouseOptions = STAFF_WAREHOUSES,
  members = STAFF_MEMBERS,
}: StaffScreenProps) {
  const isMain = isAllWarehouses(scope);
  const [filter, setFilter] = useState<RosterFilter>(isMain ? 'All' : 'Warehouse Staff');
  const [searchQuery, setSearchQuery] = useState('');
  const [internalWarehouseId, setInternalWarehouseId] = useState<string | undefined>(externalWarehouseId);
  const [filterWarehouseId, setFilterWarehouseId] = useState<string | undefined>(undefined);
  const [showFilterScreen, setShowFilterScreen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'All' | 'Warehouse Staff' | 'Driver'>(
    isMain ? 'All' : 'Warehouse Staff',
  );
  const [attendanceFilter, setAttendanceFilter] = useState<'All' | 'Present' | 'Absent' | 'On Leave'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  const selectedWarehouseId = externalWarehouseId !== undefined ? externalWarehouseId : internalWarehouseId;
  const setSelectedWarehouseId = (id: string | undefined) => {
    setInternalWarehouseId(id);
    externalOnSelectWarehouse?.(id);
  };

  const isTopWarehouseSelected = Boolean(selectedWarehouseId && selectedWarehouseId !== 'all');
  const effectiveWarehouseId = isTopWarehouseSelected ? selectedWarehouseId : filterWarehouseId;

  const scoped = useMemo(
    () =>
      isMain
        ? effectiveWarehouseId
          ? members.filter((m) => m.warehouseId === effectiveWarehouseId)
          : members
        : members.filter((m) => inScope(scope, m.warehouseId)),
    [members, isMain, effectiveWarehouseId, scope],
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
          warehouseId: filterWarehouseId,
        }}
        warehouseName={isMain ? (selectedWarehouseId ? staffWarehouseName(selectedWarehouseId) : undefined) : scope.warehouseName ?? scope.warehouseId}
        warehouseOptions={warehouseOptions}
        isTopWarehouseSelected={isMain ? isTopWarehouseSelected : true}
        onBack={() => setShowFilterScreen(false)}
        onApply={(newFilters) => {
          setSearchQuery(newFilters.searchQuery);
          setRoleFilter(newFilters.role);
          setAttendanceFilter(newFilters.attendance);
          setStatusFilter(newFilters.status);
          setFilterWarehouseId(newFilters.warehouseId);
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
          {isMain ? <StaffBadgeIcon size={24} color={adminColors.onBrand} /> : <StaffGroupIcon size={22} color={adminColors.onBrand} />}
          <Text style={styles.headerTitleText}>Staff</Text>
        </View>
      }
      onBack={onBack}
      headerRight={
        isMain ? undefined : (
          <HeaderIconButton accessibilityLabel="Filter staff" onPress={() => setShowFilterScreen(true)}>
            <FilterSlidersIcon />
          </HeaderIconButton>
        )
      }
      headerExtra={
        <ScopeHeader
          scope={scope}
          label={isMain ? undefined : scope.warehouseName ?? scope.warehouseId}
          warehouseOptions={warehouseOptions}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={(id) => {
            setSelectedWarehouseId(id);
            setFilterWarehouseId(undefined);
          }}
        />
      }
      footer={!isMain && onTabChange ? <WarehouseTabBar onTabChange={onTabChange} onBack={onBack} /> : undefined}
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

  const renderAttendancePill = (att: string) => {
    const isPresent = att === 'Present';
    const isAbsent = att === 'Absent';
    return (
      <View style={[styles.mainBadge, isPresent ? styles.badgePresent : isAbsent ? styles.badgeAbsent : styles.badgeLeave]}>
        <Text style={[styles.badgeText, isPresent ? styles.badgePresentText : isAbsent ? styles.badgeAbsentText : styles.badgeLeaveText]}>
          {att}
        </Text>
      </View>
    );
  };

  const renderCard = (staff: StaffMember) => {
    if (isMain) {
      const isDriver = staff.type === 'driver';
      return (
        <TouchableOpacity
          key={staff.id}
          style={styles.mainStaffCard}
          onPress={onSelectStaff ? () => onSelectStaff(staff) : undefined}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <View style={styles.mainCardTopRow}>
            {isDriver ? <MainDriverAvatar /> : <MainStaffPersonAvatar />}
            <View style={styles.mainCardInfo}>
              <Text style={styles.mainCardName}>{staff.name}</Text>
              <Text style={styles.mainCardMeta}>
                {isDriver ? `Driver ID: ${staff.staffId}` : `Staff ID: ${staff.staffId} · ${staff.role}`}
              </Text>
              <View style={styles.mainBadgeRow}>
                <View style={[styles.mainBadge, styles.badgeActive]}>
                  <Text style={styles.badgeActiveText}>{staff.status}</Text>
                </View>
                {renderAttendancePill(staff.attendance)}
              </View>
            </View>
          </View>
          {isDriver ? (
            <View style={styles.deliveriesTodayRow}>
              <Text style={styles.deliveriesTodayText}>
                Deliveries Today: <Text style={styles.deliveriesTodayBold}>{staff.deliveriesToday ?? 0}</Text>
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      );
    }

    return (
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
            </Text>
          </View>
        </View>
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
      </TouchableOpacity>
    );
  };

  return frame(
    <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
      {/* ─── 4 Top KPI Cards (2x2 Grid) ─── */}
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

      {/* ─── Action Cards: Side by Side (Image 1 for Main) ─── */}
      {isMain ? (
        <View style={styles.actionCardsRow}>
          <TouchableOpacity
            style={styles.actionCardMain}
            onPress={() => onNavigateToAttendance?.(effectiveWarehouseId)}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <CalendarIcon size={26} color={adminColors.brand} />
            <Text style={styles.actionCardMainText}>Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCardMain}
            onPress={() => onNavigateToHistory?.(effectiveWarehouseId)}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <HistoryIcon size={26} color={adminColors.brand} />
            <Text style={styles.actionCardMainText}>Attendance History</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Active Filter Tags */}
      {(attendanceFilter !== 'All' || statusFilter !== 'All') && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {attendanceFilter !== 'All' && (
            <TouchableOpacity
              onPress={() => setAttendanceFilter('All')}
              activeOpacity={0.7}
              style={styles.filterTag}
            >
              <Text style={styles.filterTagText}>Attendance: {attendanceFilter} ✕</Text>
            </TouchableOpacity>
          )}
          {statusFilter !== 'All' && (
            <TouchableOpacity
              onPress={() => setStatusFilter('All')}
              activeOpacity={0.7}
              style={styles.filterTag}
            >
              <Text style={styles.filterTagText}>Status: {statusFilter} ✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter Chips for Sub Warehouse only */}
      {!isMain ? (
        <View style={styles.chipRow}>
          {SUB_FILTERS.map((item) => {
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

      {/* ─── Search Bar ─── */}
      {isMain ? (
        <View style={styles.searchBarWrap}>
          <SearchLensIcon />
          <TextInput
            style={styles.searchBarInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Staff name, Staff ID, Driver ID, Role"
            placeholderTextColor={adminColors.placeholder}
            returnKeyType="search"
          />
          <TouchableOpacity
            onPress={() => setShowFilterScreen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Filter staff"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FilterSlidersIcon size={20} color={adminColors.brand} />
          </TouchableOpacity>
        </View>
      ) : (
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Staff name, Staff ID, Driver ID, Role" />
      )}

      {visible.length === 0 ? <EmptyState title="No staff found" subtitle="Try another name, ID or filter." /> : null}

      {/* ─── Drivers & Warehouse Staff Sections ─── */}
      {isMain ? (
        <>
          {drivers.length > 0 ? (
            <View style={styles.sectionHeaderWrap}>
              <Text style={styles.sectionTitleText}>DRIVERS</Text>
            </View>
          ) : null}
          {drivers.map(renderCard)}
          {warehouseStaff.length > 0 ? (
            <View style={styles.sectionHeaderWrap}>
              <Text style={styles.sectionTitleText}>WAREHOUSE STAFF</Text>
            </View>
          ) : null}
          {warehouseStaff.map(renderCard)}
        </>
      ) : (
        visible.map(renderCard)
      )}

      {/* Sub Warehouse Bottom Action Row */}
      {!isMain ? (
        <View style={styles.actionRow}>
          {onNavigateToAttendance ? (
            <TouchableOpacity style={styles.actionCard} onPress={() => onNavigateToAttendance?.()} activeOpacity={0.8} accessibilityRole="button">
              <CalendarIcon size={22} color={adminColors.brand} />
              <Text style={styles.actionText}>Attendance</Text>
            </TouchableOpacity>
          ) : null}
          {onNavigateToHistory ? (
            <TouchableOpacity style={styles.actionCard} onPress={() => onNavigateToHistory?.()} activeOpacity={0.8} accessibilityRole="button">
              <HistoryIcon size={22} color={adminColors.brand} />
              <Text style={styles.actionText}>Attendance History</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </ScrollView>,
  );
}

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
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
  },
  kpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  actionCardsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  actionCardMain: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.lg,
    paddingHorizontal: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
  },
  actionCardMainText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    textAlign: 'center',
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
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    gap: adminSpacing.xs,
  },
  filterTagText: {
    ...adminType.caption,
    color: adminColors.brand,
  },
  chipRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  chip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
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
    ...adminType.caption,
    color: adminColors.muted,
  },
  chipTextActive: {
    color: adminColors.brand,
  },
  sectionHeaderWrap: {
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
  },
  sectionTitleText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    letterSpacing: 0.8,
  },
  mainStaffCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  mainCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffPersonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: adminColors.brandSoft.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCardInfo: {
    marginLeft: adminSpacing.md,
    flex: 1,
  },
  mainCardName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  mainCardMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  mainBadgeRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.xs,
  },
  mainBadge: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  badgeActive: {
    backgroundColor: adminColors.success.bg,
  },
  badgeActiveText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  badgePresent: {
    backgroundColor: adminColors.success.bg,
  },
  badgePresentText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  badgeAbsent: {
    backgroundColor: adminColors.danger.bg,
  },
  badgeAbsentText: {
    ...adminType.caption,
    color: adminColors.danger.text,
  },
  badgeLeave: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeLeaveText: {
    ...adminType.caption,
    color: adminColors.warning.text,
  },
  badgeText: {
    ...adminType.caption,
  },
  deliveriesTodayRow: {
    marginTop: adminSpacing.sm,
    marginLeft: 60,
  },
  deliveriesTodayText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  deliveriesTodayBold: {
    fontWeight: '800',
    color: adminColors.ink,
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
  name: { ...adminType.rowTitle, color: adminColors.ink },
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 3 },
  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.md },
  threeCol: { flexDirection: 'row', gap: adminSpacing.sm },
  col: { flex: 1 },
  colLabel: { ...adminType.caption, color: adminColors.muted, marginBottom: 4 },
  colValue: { ...adminType.sectionHead, color: adminColors.ink },
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
