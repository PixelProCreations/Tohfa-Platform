/**
 * Staff list screen (Image 1, 3, 4, 5):
 * Shared directory list of all workforce/staff members across warehouses.
 *
 * For Subwarehouse & Main Warehouse: Displays the list without the docked button.
 * For Tohfa Admin: Displays the list with inline actions and docked "Create Account" button.
 *
 * Features:
 * - Real-time keyword search across Name, ID, Role.
 * - Interactive Filter Popup modal with Role, Status, and Warehouse filters (Image 5).
 * - Dynamic count indicator showing matching admins, warehouse staff, and drivers.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
  ADMIN_BUTTON_HEIGHT,
} from '../../../theme';
import { EmptyState, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { STAFF_MEMBERS, staffWarehouseName } from './fixtures';
import { CalendarIcon, ChevronDownIcon, CloseIcon, FilterSlidersIcon, PersonIcon, SearchIcon, UpdateAttendanceModal } from './StaffParts';
import { isTohfaAdminUser } from './StaffDetailScreen';
import type { StaffMember, WarehouseScreenBaseProps } from './types';

export interface StaffListScreenProps extends WarehouseScreenBaseProps {
  role?: string | undefined;
  members?: readonly StaffMember[] | undefined;
  onSelectStaff?: ((staff: StaffMember) => void) | undefined;
  onEditStaff?: ((staff: StaffMember) => void) | undefined;
  onCreateAccount?: (() => void) | undefined;
}

const ROLE_FILTER_OPTIONS = [
  'All',
  'Warehouse Staff',
  'Driver',
  'Sub Warehouse Admin',
  'TOHFA Admin',
] as const;

const STATUS_FILTER_OPTIONS = ['All', 'Active', 'Pending activation', 'Inactive'] as const;

const WAREHOUSE_FILTER_OPTIONS = [
  { id: 'ALL', name: 'All Warehouses' },
  { id: 'WH-COON', name: 'Coonoor Warehouse' },
  { id: 'WH-OOTY', name: 'Main Warehouse, Ooty' },
  { id: 'WH-KTYM', name: 'Kotagiri Warehouse' },
  { id: 'WH-METP', name: 'Mettupalayam Warehouse' },
] as const;

export function StaffListScreen({
  scope,
  can,
  role,
  onBack,
  members = STAFF_MEMBERS,
  onSelectStaff,
  onEditStaff,
  onCreateAccount,
}: StaffListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [staffList, setStaffList] = useState<StaffMember[]>(() => [...members]);

  useEffect(() => {
    setStaffList([...members]);
  }, [members]);
  const [selectedStaffForModal, setSelectedStaffForModal] = useState<StaffMember | null>(null);
  const isTohfa = isTohfaAdminUser(can, role);
  const isSubWarehouse =
    role === 'SUB_WH_ADMIN' ||
    Boolean(
      scope?.warehouseId &&
        scope.warehouseId !== 'WH-OOTY' &&
        !scope.warehouseId.toLowerCase().includes('main') &&
        scope.warehouseId !== 'ALL'
    );

  // ─── Filter Modal State (Image 5) ─────────────────────────────────────────
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('ALL');

  const hasActiveFilters =
    selectedRoleFilter !== 'All' ||
    selectedStatusFilter !== 'All' ||
    (!isSubWarehouse && selectedWarehouseFilter !== 'ALL');

  const handleClearFilters = () => {
    setSelectedRoleFilter('All');
    setSelectedStatusFilter('All');
    setSelectedWarehouseFilter('ALL');
  };

  // ─── Filtered Staff List ──────────────────────────────────────────────────
  const filteredStaff = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return staffList.filter((s) => {
      // 1. Search Query
      if (q) {
        const matchesQuery =
          s.name.toLowerCase().includes(q) ||
          s.staffId.toLowerCase().includes(q) ||
          s.role.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // 2. Role Filter
      if (selectedRoleFilter !== 'All') {
        const roleLower = s.role.toLowerCase();
        if (selectedRoleFilter === 'Warehouse Staff') {
          if (!roleLower.includes('warehouse staff') && s.type !== 'warehouse') return false;
        } else if (selectedRoleFilter === 'Driver') {
          if (!roleLower.includes('driver') && s.type !== 'driver') return false;
        } else if (selectedRoleFilter === 'Sub Warehouse Admin') {
          if (!roleLower.includes('sub warehouse')) return false;
        } else if (selectedRoleFilter === 'TOHFA Admin') {
          if (!roleLower.includes('tohfa')) return false;
        }
      }

      // 3. Status Filter
      if (selectedStatusFilter !== 'All') {
        if (s.status !== selectedStatusFilter) return false;
      }

      // 4. Warehouse Filter (only applicable for TOHFA Admin and Main Warehouse)
      if (!isSubWarehouse && selectedWarehouseFilter !== 'ALL') {
        if (s.warehouseId && s.warehouseId !== selectedWarehouseFilter) return false;
      }

      return true;
    });
  }, [staffList, searchQuery, selectedRoleFilter, selectedStatusFilter, selectedWarehouseFilter]);

  // Dynamic counts for subtitle
  const adminCount = useMemo(
    () => filteredStaff.filter((s) => s.role.toLowerCase().includes('admin')).length,
    [filteredStaff]
  );
  const whCount = useMemo(
    () =>
      filteredStaff.filter(
        (s) => s.role.toLowerCase().includes('warehouse') || s.type === 'warehouse'
      ).length,
    [filteredStaff]
  );
  const driverCount = useMemo(
    () => filteredStaff.filter((s) => s.type === 'driver' || s.role.toLowerCase().includes('driver')).length,
    [filteredStaff]
  );

  return (
    <WalletScreen
      title="Staff list"
      onBack={onBack}
      footer={
        isTohfa && onCreateAccount ? (
          <View style={styles.dockedFooter}>
            <TouchableOpacity
              style={styles.createAccountBtn}
              onPress={onCreateAccount}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Create Account"
            >
              <Text style={styles.createAccountBtnText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        ) : undefined
      }
    >
      <ScrollView
        contentContainerStyle={walletLayout.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar matching Image 1 & 5 */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBox}>
            <SearchIcon size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowFilterModal(true)}
              style={styles.filterBtn}
            >
              <FilterSlidersIcon
                size={18}
                color={hasActiveFilters ? adminColors.brandDeep : adminColors.brand}
              />
              {hasActiveFilters && <View style={styles.filterActiveBadge} />}
            </TouchableOpacity>
          </View>
          <Text style={styles.subCountText}>
            {`${adminCount} admin · ${whCount} warehouse staff · ${driverCount} drivers`}
          </Text>
        </View>

        {filteredStaff.length === 0 ? (
          <EmptyState
            title="No staff found"
            subtitle="Try adjusting your search keyword or active filters."
          />
        ) : (
          <View style={styles.cardsList}>
            {filteredStaff.map((staff) => {
              const whName =
                staff.warehouseName ??
                (staff.warehouseId
                  ? staffWarehouseName(staff.warehouseId)
                  : 'Main Warehouse, Ooty');
              const isPending = staff.status === 'Pending activation';
              const isActive = staff.status === 'Active';

              return (
                <TouchableOpacity
                  key={staff.id}
                  style={styles.card}
                  onPress={onSelectStaff ? () => onSelectStaff(staff) : undefined}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  {/* Top Row: Avatar, Name & Subtitle, Status Badge with Chevron */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.avatarCircle}>
                      <PersonIcon size={24} color="#8B5E3C" />
                    </View>
                    <View style={styles.cardInfoCol}>
                      <Text style={styles.cardStaffName}>{staff.name}</Text>
                      <Text style={styles.cardStaffSubtitle}>
                        {`${whName}, ${staff.type === 'driver' ? 'Driver' : (staff.role || 'Warehouse staff')}`}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        isActive
                          ? styles.badgeActive
                          : isPending
                          ? styles.badgePending
                          : styles.badgeInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isActive
                            ? styles.badgeTextActive
                            : isPending
                            ? styles.badgeTextPending
                            : styles.badgeTextInactive,
                        ]}
                      >
                        {staff.status || 'Active'} &gt;
                      </Text>
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={styles.cardDivider} />

                  {/* Bottom Row: Today Attendance with Status Pill */}
                  <View style={styles.cardBottomRow}>
                    <View style={styles.todayAttendanceLabelRow}>
                      <CalendarIcon size={16} color={adminColors.muted} />
                      <Text style={styles.todayAttendanceLabel}>Today Attendance</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.attendanceDropdownPill}
                      onPress={() => setSelectedStaffForModal(staff)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              staff.attendance === 'Present'
                                ? '#16A34A'
                                : staff.attendance === 'Absent'
                                ? '#DC2626'
                                : '#D97706',
                          },
                        ]}
                      />
                      <Text style={styles.attendanceDropdownPillText}>{staff.attendance || 'Present'}</Text>
                      <ChevronDownIcon size={14} color={adminColors.muted} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ─── Filter Options Popup Modal (Image 5) ─── */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalCard}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter Staff</Text>
              <View style={styles.filterHeaderActions}>
                {hasActiveFilters && (
                  <TouchableOpacity onPress={handleClearFilters} activeOpacity={0.7}>
                    <Text style={styles.clearFiltersText}>Clear All</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setShowFilterModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <CloseIcon size={20} color={adminColors.ink} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Role Options */}
              <Text style={styles.filterGroupTitle}>Role</Text>
              <View style={styles.filterChipsRow}>
                {ROLE_FILTER_OPTIONS.map((item) => {
                  const active = selectedRoleFilter === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setSelectedRoleFilter(item)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.filterChipText, active && styles.filterChipTextActive]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Status Options */}
              <Text style={styles.filterGroupTitle}>Status</Text>
              <View style={styles.filterChipsRow}>
                {STATUS_FILTER_OPTIONS.map((item) => {
                  const active = selectedStatusFilter === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setSelectedStatusFilter(item)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.filterChipText, active && styles.filterChipTextActive]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Warehouse Location Options: only for TOHFA Admin and Main Warehouse; hidden for Sub Warehouse */}
              {!isSubWarehouse && (
                <>
                  <Text style={styles.filterGroupTitle}>Warehouse Location</Text>
                  <View style={styles.filterChipsRow}>
                    {WAREHOUSE_FILTER_OPTIONS.map((item) => {
                      const active = selectedWarehouseFilter === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.filterChip, active && styles.filterChipActive]}
                          onPress={() => setSelectedWarehouseFilter(item.id)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[styles.filterChipText, active && styles.filterChipTextActive]}
                          >
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Apply Button */}
            <TouchableOpacity
              style={styles.applyFilterBtn}
              onPress={() => setShowFilterModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.applyFilterBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Update Attendance Modal (Screenshot 3 Right) ─── */}
      {selectedStaffForModal && (
        <UpdateAttendanceModal
          visible={!!selectedStaffForModal}
          name={selectedStaffForModal.name}
          initialStatus={selectedStaffForModal.attendance || 'Present'}
          onClose={() => setSelectedStaffForModal(null)}
          onUpdate={({ status }) => {
            setStaffList((prev) =>
              prev.map((s) =>
                s.id === selectedStaffForModal.id ? { ...s, attendance: status } : s
              )
            );
            setSelectedStaffForModal(null);
          }}
        />
      )}
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDF2E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfoCol: {
    flex: 1,
  },
  cardStaffName: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  cardStaffSubtitle: {
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 12,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayAttendanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayAttendanceLabel: {
    fontSize: 13,
    color: adminColors.muted,
  },
  attendanceDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  attendanceDropdownPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.ink,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  searchWrapper: {
    marginBottom: adminSpacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 46,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: adminSpacing.sm,
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 14,
  },
  filterBtn: {
    padding: adminSpacing.xs,
    position: 'relative',
  },
  filterActiveBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: adminColors.brand,
  },
  subCountText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 8,
    marginLeft: 4,
    fontSize: 12,
  },
  cardsList: {
    gap: adminSpacing.md,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '700',
    fontSize: 15,
  },
  badge: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 3,
    borderRadius: adminRadius.sm,
  },
  badgeActive: {
    backgroundColor: '#E8F5E9',
  },
  badgePending: {
    backgroundColor: '#FFF8E1',
  },
  badgeInactive: {
    backgroundColor: '#FFEBEE',
  },
  badgeText: {
    ...adminType.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  badgeTextActive: {
    color: '#2E7D32',
  },
  badgeTextPending: {
    color: '#B78103',
  },
  badgeTextInactive: {
    color: '#C62828',
  },
  cardSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.lg,
    marginTop: adminSpacing.md,
    paddingTop: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F3EFEA',
  },
  actionEdit: {
    ...adminType.rowTitle,
    color: '#D9480F',
    fontSize: 13,
    fontWeight: '600',
  },
  actionDeactivate: {
    ...adminType.rowTitle,
    color: '#D9480F',
    fontSize: 13,
    fontWeight: '600',
  },
  actionActivate: {
    color: '#2E7D32',
  },
  dockedFooter: {
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    padding: adminSpacing.md,
  },
  createAccountBtn: {
    height: ADMIN_BUTTON_HEIGHT,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  createAccountBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
    fontSize: 15,
    fontWeight: '700',
  },

  // Filter Modal Styles
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  filterModalCard: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    maxHeight: '80%',
    ...adminShadow.lg,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
    paddingBottom: adminSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  filterModalTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontSize: 17,
  },
  filterHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  clearFiltersText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '600',
    fontSize: 13,
  },
  filterGroupTitle: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    fontSize: 13,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.xs,
  },
  filterChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 7,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 4,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '500',
    fontSize: 12,
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  applyFilterBtn: {
    height: ADMIN_BUTTON_HEIGHT,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.lg,
    ...adminShadow.sm,
  },
  applyFilterBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
    fontSize: 15,
  },
});
