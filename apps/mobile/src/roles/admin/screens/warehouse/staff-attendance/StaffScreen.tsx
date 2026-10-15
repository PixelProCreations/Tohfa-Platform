/**
 * Staff (warehouse floor staff roster), live from GET /admin/warehouse-staff.
 *
 * Gate: `admin.staff.list_view` (SA/TOHFA all, MAIN own, SUB none: a Sub
 * Warehouse Admin cannot list staff, BR-83). Without it the screen renders a
 * not-available note and sends no request. The Main scope (warehouseId
 * undefined) gets the warehouse selector, fed by GET /warehouses; a confined
 * scope gets its locked pill.
 *
 * Server filters only: warehouse, status (ACTIVE / INACTIVE) and a search on
 * name or staff code. The record has no driver / warehouse-staff type, so the
 * old DRIVERS / WAREHOUSE STAFF split and the "Deliveries Today" figure are gone.
 * Today's attendance badge and the KPI tiles come from today's roll call
 * (admin.staff.attendance.view), never from fixed numbers.
 */
// Design id: M14-S01
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  CalendarIcon,
  ChipGroup,
  HeaderIconButton,
  isAllWarehouses,
  KpiRow,
  ScopeHeader,
  SearchBar,
  StatusBadge,
  WalletButton,
  WalletScreen,
  WarehouseTabBar,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  attendanceByStaff,
  attendanceStatusLabel,
  attendanceStatusTone,
  canManageStaff,
  canViewAttendance,
  istToday,
  STAFF_CODES,
  staffStatusLabel,
  staffStatusTone,
  staffWarehouseFilter,
} from './mappers';
import { ChevronRightIcon, FilterSlidersIcon, HistoryIcon, StaffAvatar, StaffGroupIcon } from './StaffParts';
import { StaffFiltersScreen, type StaffFilterValues, type StaffStatusFilter } from './StaffFiltersScreen';
import type { StaffMember, WarehouseScreenBaseProps } from './types';
import { useRollCall, useStaffList, useStaffWarehouses } from './useStaffData';

/** The docs/rbac.json code that lists the roster (admin.staff.list_view). */
export const STAFF_ROSTER_CODE = STAFF_CODES.listView;

const STATUS_FILTERS: readonly StaffStatusFilter[] = ['All', 'ACTIVE', 'INACTIVE'];
/** Wait this long after the last keystroke before searching (UI pacing, not a business rule). */
const SEARCH_DEBOUNCE_MS = 350;

function statusFilterLabel(value: StaffStatusFilter): string {
  return value === 'All' ? t('staff.filter.all') : staffStatusLabel(value);
}

export interface StaffScreenProps extends WarehouseScreenBaseProps {
  onSelectStaff?: ((staff: StaffMember) => void) | undefined;
  /** "Add Staff": opens the form in create mode (admin.staff.manage). */
  onAddStaff?: (() => void) | undefined;
  onNavigateToAttendance?: (() => void) | undefined;
  onNavigateToHistory?: (() => void) | undefined;
}

export function StaffScreen({
  scope,
  can,
  onBack,
  onTabChange,
  onSelectStaff,
  onAddStaff,
  onNavigateToAttendance,
  onNavigateToHistory,
}: StaffScreenProps) {
  const isMain = isAllWarehouses(scope);
  const allowed = can(STAFF_ROSTER_CODE);
  const attendanceAllowed = allowed && canViewAttendance(can);
  const [now] = useState(() => new Date());
  const today = istToday(now);

  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>('All');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const [showFilterScreen, setShowFilterScreen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [searchInput]);

  const warehouses = useStaffWarehouses(scope, can);
  const warehouseId = staffWarehouseFilter(scope, selectedWarehouseId);
  const list = useStaffList(
    scope,
    { warehouseId, status: statusFilter === 'All' ? undefined : statusFilter, q: search },
    warehouses.nameOf,
    allowed,
  );
  const rollCall = useRollCall(scope, today, warehouseId, warehouses.nameOf, now, attendanceAllowed);
  const todayByStaff = useMemo(() => attendanceByStaff(rollCall.rows), [rollCall.rows]);

  if (showFilterScreen) {
    return (
      <StaffFiltersScreen
        scope={scope}
        initialFilters={{ searchQuery: searchInput, status: statusFilter }}
        onBack={() => setShowFilterScreen(false)}
        onApply={(next: StaffFilterValues) => {
          setSearchInput(next.searchQuery);
          setSearch(next.searchQuery.trim());
          setStatusFilter(next.status);
          setShowFilterScreen(false);
        }}
      />
    );
  }

  const frame = (children: React.ReactNode, footer?: React.ReactNode) => (
    <WalletScreen
      title={
        <View style={styles.headerTitleRow}>
          <StaffGroupIcon color={adminColors.onBrand} />
          <Text style={styles.headerTitleText}>{t('staff.list.title')}</Text>
        </View>
      }
      onBack={onBack}
      headerRight={
        allowed ? (
          <HeaderIconButton accessibilityLabel={t('staff.list.filterA11y')} onPress={() => setShowFilterScreen(true)}>
            <FilterSlidersIcon />
          </HeaderIconButton>
        ) : undefined
      }
      headerExtra={
        <ScopeHeader
          scope={scope}
          label={isMain ? t('staff.scope.all') : scope.warehouseName ?? scope.warehouseId}
          warehouseOptions={warehouses.options}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={isMain && can(STAFF_CODES.warehouseList) ? setSelectedWarehouseId : undefined}
        />
      }
      footer={footer ?? <WarehouseTabBar onTabChange={onTabChange} onBack={onBack} />}
    >
      {children}
    </WalletScreen>
  );

  if (!allowed) {
    return frame(<AdminEmptyState title={t('staff.denied.title')} subtitle={t('staff.denied.roster')} />);
  }

  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });
  const summary = rollCall.summary;
  const kpi = (value: number | undefined) => (value === undefined ? t('staff.kpi.unknown') : String(value));

  const renderCard = (staff: StaffMember) => {
    const mark = todayByStaff.get(staff.id);
    return (
      <TouchableOpacity
        key={staff.id}
        style={styles.card}
        onPress={onSelectStaff ? () => onSelectStaff(staff) : undefined}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('staff.list.rowA11y', { name: staff.name, code: staff.staffCode })}
      >
        <View style={styles.cardHeader}>
          <StaffAvatar />
          <View style={styles.cardInfo}>
            <Text style={styles.name}>{staff.name}</Text>
            <Text style={styles.meta}>
              {isMain
                ? t('staff.list.metaWithWarehouse', { code: staff.staffCode, designation: staff.designation, warehouse: staff.warehouseName })
                : t('staff.list.meta', { code: staff.staffCode, designation: staff.designation })}
            </Text>
            <View style={styles.badgeRow}>
              <StatusBadge label={staffStatusLabel(staff.status)} tone={staffStatusTone(staff.status)} />
              {attendanceAllowed && mark !== undefined ? (
                <StatusBadge label={attendanceStatusLabel(mark)} tone={attendanceStatusTone(mark)} />
              ) : null}
            </View>
          </View>
          <ChevronRightIcon color={adminColors.muted} />
        </View>
      </TouchableOpacity>
    );
  };

  const footer = canManageStaff(can) && onAddStaff ? (
    <View>
      <View style={styles.footerAction}>
        <WalletButton label={t('staff.list.add')} onPress={onAddStaff} />
      </View>
      <WarehouseTabBar onTabChange={onTabChange} onBack={onBack} />
    </View>
  ) : undefined;

  return frame(
    <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
      {attendanceAllowed && onNavigateToAttendance ? (
        <TouchableOpacity style={styles.banner} onPress={onNavigateToAttendance} activeOpacity={0.8} accessibilityRole="button">
          <View style={styles.bannerIcon}>
            <CalendarIcon color={adminColors.brand} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.bannerTitle}>{t('staff.list.attendanceBanner')}</Text>
            <Text style={styles.meta}>{t('staff.list.attendanceBannerSub')}</Text>
          </View>
          <ChevronRightIcon color={adminColors.brand} />
        </TouchableOpacity>
      ) : null}

      {attendanceAllowed ? (
        <KpiRow
          items={[
            { value: kpi(summary?.total), label: t('staff.kpi.active') },
            { value: kpi(summary?.present), label: t('staff.kpi.presentToday'), tone: 'success' },
            { value: kpi(summary?.absent), label: t('staff.kpi.absent'), tone: 'danger' },
            { value: kpi(summary?.leave), label: t('staff.kpi.leave'), tone: 'warning' },
          ]}
        />
      ) : null}

      <ChipGroup options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} labelOf={statusFilterLabel} />
      <View style={styles.gap} />
      <SearchBar value={searchInput} onChangeText={setSearchInput} placeholder={t('staff.list.searchPlaceholder')} />

      {view === 'loading' ? <AdminLoadingState /> : null}
      {view === 'error' ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
      {view === 'empty' ? <AdminEmptyState title={t('staff.list.empty.title')} subtitle={t('staff.list.empty.subtitle')} /> : null}
      {view === 'ready' ? list.items.map(renderCard) : null}
      {view === 'ready' && list.hasMore ? (
        <WalletButton label={t('staff.common.loadMore')} variant="outline" onPress={list.loadMore} />
      ) : null}

      {attendanceAllowed && !isMain ? (
        <View style={styles.actionRow}>
          {onNavigateToAttendance ? (
            <TouchableOpacity style={styles.actionCard} onPress={onNavigateToAttendance} activeOpacity={0.8} accessibilityRole="button">
              <CalendarIcon color={adminColors.brand} />
              <Text style={styles.actionText}>{t('staff.attendance.title')}</Text>
            </TouchableOpacity>
          ) : null}
          {onNavigateToHistory ? (
            <TouchableOpacity style={styles.actionCard} onPress={onNavigateToHistory} activeOpacity={0.8} accessibilityRole="button">
              <HistoryIcon color={adminColors.brand} />
              <Text style={styles.actionText}>{t('staff.history.title')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </ScrollView>,
    footer,
  );
}

const BANNER_ICON = 40;

const styles = StyleSheet.create({
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  headerTitleText: { ...adminType.title, color: adminColors.onBrand },
  gap: { height: adminSpacing.md },
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
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  badgeRow: { flexDirection: 'row', gap: adminSpacing.xs, marginTop: adminSpacing.xs },
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
  footerAction: { paddingHorizontal: adminSpacing.md, paddingTop: adminSpacing.sm, backgroundColor: adminColors.card },
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
