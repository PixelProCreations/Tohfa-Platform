/**
 * Full staff directory: searchable, filterable list of all staff members.
 * Separate from StaffScreen (the hub with KPI cards). Ported from design
 * (origin/Superadmin-main StaffListScreen).
 *
 * - Wired to GET /admin/staff via useStaffList.
 * - Role/Status/Warehouse filters are client-side chips in a bottom sheet.
 * - "Create Account" docked button shown only when can('staff.account.create').
 * - Attendance column not yet available from the API — shown as `—` (spec gap).
 */
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ADMIN_BUTTON_HEIGHT,
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../../theme';
import { t } from '../../../i18n';
import { CalendarIcon, EmptyState, SearchBar, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { CloseIcon, FilterSlidersIcon, PersonIcon } from './StaffParts';
import { useStaffList, useStaffWarehouses } from './useStaffData';
import type { StaffMember, StaffStatus, WarehouseScreenBaseProps } from './types';

export interface StaffListScreenProps extends WarehouseScreenBaseProps {
  onSelectStaff?: ((staff: StaffMember) => void) | undefined;
  onCreateAccount?: (() => void) | undefined;
}



type RoleFilter = 'All' | 'Warehouse Staff' | 'Driver' | 'Sub Warehouse Admin' | 'Tohfa Admin';
type StatusFilterOption = 'All' | 'ACTIVE' | 'INACTIVE';

const ROLE_OPTIONS: readonly RoleFilter[] = [
  'All',
  'Warehouse Staff',
  'Driver',
  'Sub Warehouse Admin',
  'Tohfa Admin',
];
const STATUS_OPTIONS: readonly StatusFilterOption[] = ['All', 'ACTIVE', 'INACTIVE'];

export function StaffListScreen({
  scope,
  can,
  onBack,
  onSelectStaff,
  onCreateAccount,
}: StaffListScreenProps) {
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('All');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');

  const isSubWh = scope.warehouseId !== undefined && !can('admin.staff.list_view_all');
  const warehouses = useStaffWarehouses(scope, can);

  const staffQuery = useStaffList(
    scope,
    {
      warehouseId: isSubWh ? scope.warehouseId : warehouseFilter !== 'ALL' ? warehouseFilter : undefined,
      status: statusFilter !== 'All' ? (statusFilter as StaffStatus) : undefined,
      q: searchInput,
    },
    warehouses.nameOf,
    true,
  );

  const allMembers = useMemo(() => staffQuery.items ?? [], [staffQuery.items]);

  const filtered = useMemo(() => {
    if (roleFilter === 'All') return allMembers;
    return allMembers.filter((s) => {
      const d = s.designation.toLowerCase();
      if (roleFilter === 'Warehouse Staff') return d.includes('warehouse') && !d.includes('admin');
      if (roleFilter === 'Driver') return d.includes('driver');
      if (roleFilter === 'Sub Warehouse Admin') return d.includes('sub');
      if (roleFilter === 'Tohfa Admin') return d.includes('tohfa') || d.includes('admin');
      return true;
    });
  }, [allMembers, roleFilter]);

  const hasActiveFilters = roleFilter !== 'All' || statusFilter !== 'All' || (!isSubWh && warehouseFilter !== 'ALL');

  const clearFilters = () => {
    setRoleFilter('All');
    setStatusFilter('All');
    setWarehouseFilter('ALL');
  };

  const canCreate = can('staff.account.create');

  return (
    <WalletScreen
      title={t('staffList.title')}
      onBack={onBack}
      footer={
        canCreate && onCreateAccount ? (
          <View style={styles.dockedFooter}>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={onCreateAccount}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('staffList.createAccount')}
            >
              <Text style={styles.createBtnText}>{t('staffList.createAccount')}</Text>
            </TouchableOpacity>
          </View>
        ) : undefined
      }
    >
      <ScrollView
        contentContainerStyle={walletLayout.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search + filter bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <SearchBar
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder={t('staffList.searchPlaceholder')}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterIconBtn, hasActiveFilters && styles.filterIconBtnActive]}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('staffList.filterA11y')}
          >
            <FilterSlidersIcon size={18} color={hasActiveFilters ? adminColors.onBrand : adminColors.brand} />
            {hasActiveFilters && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>

        <Text style={styles.countText}>
          {t('staffList.count', { count: filtered.length })}
        </Text>

        {staffQuery.isLoading ? (
          <Text style={styles.loadingText}>{t('staffList.loading')}</Text>
        ) : filtered.length === 0 ? (
          <EmptyState title={t('staffList.empty')} subtitle={t('staffList.emptyHint')} />
        ) : (
          <View style={styles.list}>
            {filtered.map((staff) => (
              <StaffRow
                key={staff.id}
                staff={staff}
                showWarehouse={!isSubWh}
                onPress={onSelectStaff ? () => onSelectStaff(staff) : undefined}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Filter sheet */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('staffList.filter.title')}</Text>
              <View style={styles.sheetHeaderRight}>
                {hasActiveFilters && (
                  <TouchableOpacity onPress={clearFilters} activeOpacity={0.7}>
                    <Text style={styles.clearText}>{t('staffList.filter.clearAll')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowFilters(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <CloseIcon size={20} color={adminColors.ink} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <Text style={styles.groupLabel}>{t('staffList.filter.role')}</Text>
              <ChipRow options={ROLE_OPTIONS} selected={roleFilter} onSelect={setRoleFilter} />

              <Text style={styles.groupLabel}>{t('staffList.filter.status')}</Text>
              <ChipRow
                options={STATUS_OPTIONS}
                selected={statusFilter}
                onSelect={setStatusFilter}
                labelFor={(o) => o === 'ACTIVE' ? t('staffList.filter.active') : o === 'INACTIVE' ? t('staffList.filter.inactive') : t('staffList.filter.all')}
              />

              {!isSubWh && warehouses.options.length > 0 && (
                <>
                  <Text style={styles.groupLabel}>{t('staffList.filter.warehouse')}</Text>
                  <ChipRow
                    options={['ALL', ...warehouses.options.map((w) => w.warehouseId)]}
                    selected={warehouseFilter}
                    onSelect={setWarehouseFilter}
                    labelFor={(id) => id === 'ALL' ? t('staffList.filter.allWarehouses') : (warehouses.nameOf(id) ?? id)}
                  />
                </>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilters(false)} activeOpacity={0.85}>
              <Text style={styles.applyBtnText}>{t('staffList.filter.apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </WalletScreen>
  );
}

function StaffRow({
  staff,
  showWarehouse,
  onPress,
}: {
  staff: StaffMember;
  showWarehouse: boolean;
  onPress?: (() => void) | undefined;
}) {
  const isActive = staff.status === 'ACTIVE';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85} accessibilityRole="button">
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <PersonIcon size={22} color={adminColors.brand} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{staff.name}</Text>
          <Text style={styles.cardSub}>
            {showWarehouse
              ? `${staff.warehouseName} · ${staff.designation}`
              : staff.designation}
          </Text>
        </View>
        <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
            {isActive ? t('staffList.statusActive') : t('staffList.statusInactive')} ›
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBottom}>
        <View style={styles.attendanceLabel}>
          <CalendarIcon size={15} color={adminColors.muted} />
          <Text style={styles.attendanceLabelText}>{t('staffList.todayAttendance')}</Text>
        </View>
        {/* Attendance not yet returned by GET /admin/staff (spec gap) */}
        <Text style={styles.attendanceDash}>—</Text>
      </View>
    </TouchableOpacity>
  );
}

function ChipRow<T extends string>({
  options,
  selected,
  onSelect,
  labelFor,
}: {
  options: readonly T[];
  selected: T;
  onSelect: (v: T) => void;
  labelFor?: (v: T) => string;
}) {
  return (
    <View style={styles.chips}>
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {labelFor ? labelFor(opt) : opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  searchBox: {
    flex: 1,
  },
  filterIconBtn: {
    width: 42,
    height: 42,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: adminColors.onBrand,
  },
  countText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
    marginLeft: 2,
  },
  loadingText: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: adminSpacing.xl,
  },
  list: {
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
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  cardSub: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 3,
    borderRadius: adminRadius.sm,
  },
  badgeActive: { backgroundColor: adminColors.success.bg },
  badgeInactive: { backgroundColor: adminColors.danger.bg },
  badgeText: {
    ...adminType.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  badgeTextActive: { color: adminColors.success.text },
  badgeTextInactive: { color: adminColors.danger.text },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 10,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendanceLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  attendanceLabelText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  attendanceDash: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  dockedFooter: {
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    padding: adminSpacing.md,
  },
  createBtn: {
    height: ADMIN_BUTTON_HEIGHT,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  createBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
    fontSize: 15,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    maxHeight: '80%',
    ...adminShadow.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
    paddingBottom: adminSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  sheetTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontSize: 17,
  },
  sheetHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  clearText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '600',
    fontSize: 13,
  },
  groupLabel: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    fontSize: 13,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.xs,
  },
  chip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 7,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 4,
  },
  chipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  chipText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '500',
    fontSize: 12,
  },
  chipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  applyBtn: {
    height: ADMIN_BUTTON_HEIGHT,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.lg,
    ...adminShadow.sm,
  },
  applyBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
    fontSize: 15,
  },
});
