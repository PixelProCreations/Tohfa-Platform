/**
 * Staff Filters full-page screen (design M14 filter overlay).
 *
 * Shared by StaffScreen (status only) and AttendanceScreen (role + attendance
 * + status + warehouse). Sections are shown conditionally via props:
 *
 *   showRoleFilter       — All / Warehouse Staff / Driver chips
 *   showAttendanceFilter — All / Present / Absent / On Leave chips
 *   showDateRangeFilter  — Today / 7 Days / 30 Days / This Month / Custom
 *   showWarehouseSelector — warehouse chip list (Main scope only)
 *
 * When showWarehouseSelector is false and a warehouseName is provided, the
 * screen shows the orange lock note instead (scope is pinned).
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import {
  CalendarIcon,
  isAllWarehouses,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { FilterSlidersIcon, PersonIcon } from './StaffParts';
import type { StaffStatus, WarehouseScope } from './types';

// ─── Types ───────────────────────────────────────────────────────────────────

export type StaffStatusFilter = 'All' | StaffStatus;
export type StaffRoleFilter = 'All' | 'Warehouse Staff' | 'Driver';
export type StaffAttendanceFilter = 'All' | 'Present' | 'Absent' | 'On Leave';
export type HistoryDateRange = 'Today' | '7 Days' | '30 Days' | 'This Month' | 'Custom';

export interface StaffFilterValues {
  searchQuery: string;
  status: StaffStatusFilter;
  role?: StaffRoleFilter | undefined;
  attendance?: StaffAttendanceFilter | undefined;
  warehouseId?: string | undefined;
  dateRange?: HistoryDateRange | undefined;
}

export interface StaffFiltersScreenProps {
  scope: WarehouseScope;
  initialFilters: StaffFilterValues;
  /** Show Role chips (All / Warehouse Staff / Driver). Default false. */
  showRoleFilter?: boolean | undefined;
  /** Show Attendance chips (All / Present / Absent / On Leave). Default false. */
  showAttendanceFilter?: boolean | undefined;
  /** Show Date Range chips for the history screen. Default false. */
  showDateRangeFilter?: boolean | undefined;
  /** Show warehouse chip selector for the Main scope. Default false. */
  showWarehouseSelector?: boolean | undefined;
  /** Name of the locked warehouse shown in the scope-lock note. */
  warehouseName?: string | undefined;
  /** Warehouse options for the selector (id + name pairs). */
  warehouses?: readonly { id: string; name: string }[] | undefined;
  onBack: () => void;
  onApply: (filters: StaffFilterValues) => void;
}

// ─── Option lists ─────────────────────────────────────────────────────────────

const ROLE_OPTIONS: readonly StaffRoleFilter[] = ['All', 'Warehouse Staff', 'Driver'];
const ATTENDANCE_OPTIONS: readonly StaffAttendanceFilter[] = ['All', 'Present', 'Absent', 'On Leave'];
const STATUS_OPTIONS: readonly StaffStatusFilter[] = ['All', 'ACTIVE', 'INACTIVE'];
const DATE_RANGE_OPTIONS: readonly HistoryDateRange[] = ['Today', '7 Days', '30 Days', 'This Month', 'Custom'];

function statusLabel(v: StaffStatusFilter): string {
  if (v === 'ACTIVE') return t('staff.filter.active');
  if (v === 'INACTIVE') return t('staff.filter.inactive');
  return t('staff.filter.all');
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export function StaffFiltersScreen({
  scope,
  initialFilters,
  showRoleFilter = false,
  showAttendanceFilter = false,
  showDateRangeFilter = false,
  showWarehouseSelector = false,
  warehouseName,
  warehouses = [],
  onBack,
  onApply,
}: StaffFiltersScreenProps) {
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery);
  const [status, setStatus] = useState<StaffStatusFilter>(initialFilters.status);
  const [role, setRole] = useState<StaffRoleFilter>(initialFilters.role ?? 'All');
  const [attendance, setAttendance] = useState<StaffAttendanceFilter>(initialFilters.attendance ?? 'All');
  const [dateRange, setDateRange] = useState<HistoryDateRange>(initialFilters.dateRange ?? 'This Month');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(initialFilters.warehouseId ?? 'ALL');

  const isLocked = !showWarehouseSelector && !isAllWarehouses(scope);
  const lockedName = warehouseName ?? scope.warehouseName ?? scope.warehouseId ?? '';

  const clearAll = () => {
    setSearchQuery('');
    setStatus('All');
    setRole('All');
    setAttendance('All');
    setDateRange('This Month');
    setSelectedWarehouse('ALL');
  };

  const handleApply = () => {
    onApply({
      searchQuery,
      status,
      role: showRoleFilter ? role : undefined,
      attendance: showAttendanceFilter ? attendance : undefined,
      dateRange: showDateRangeFilter ? dateRange : undefined,
      warehouseId: showWarehouseSelector && selectedWarehouse !== 'ALL' ? selectedWarehouse : undefined,
    });
  };

  return (
    <WalletScreen
      title={t('staff.filters.title')}
      onBack={onBack}
      headerRight={
        <TouchableOpacity onPress={clearAll} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.clearAll}>{t('staff.filters.clearAll')}</Text>
        </TouchableOpacity>
      }
      footer={
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85} accessibilityRole="button">
            <FilterSlidersIcon size={18} color={adminColors.onBrand} />
            <Text style={styles.applyBtnText}>{t('staff.filters.apply')}</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <ScrollView
        contentContainerStyle={walletLayout.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={styles.searchBar}>
          <PersonIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('staff.filters.searchPlaceholder')}
            placeholderTextColor={adminColors.placeholder ?? adminColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            returnKeyType="done"
          />
        </View>

        {/* Role */}
        {showRoleFilter ? (
          <>
            <SectionHead icon="person">{t('staff.filters.role')}</SectionHead>
            <ChipRow options={ROLE_OPTIONS} selected={role} onSelect={setRole} />
          </>
        ) : null}

        {/* Attendance */}
        {showAttendanceFilter ? (
          <>
            <SectionHead icon="calendar">{t('staff.filters.attendance')}</SectionHead>
            <ChipRow options={ATTENDANCE_OPTIONS} selected={attendance} onSelect={setAttendance} />
          </>
        ) : null}

        {/* Status */}
        <SectionHead icon="flag">{t('staff.filters.status')}</SectionHead>
        <ChipRow options={STATUS_OPTIONS} selected={status} onSelect={setStatus} labelFor={statusLabel} />

        {/* Date Range */}
        {showDateRangeFilter ? (
          <>
            <SectionHead icon="calendar">{t('staff.filters.dateRange')}</SectionHead>
            <ChipRow options={DATE_RANGE_OPTIONS} selected={dateRange} onSelect={setDateRange} />
          </>
        ) : null}

        {/* Warehouse selector */}
        {showWarehouseSelector && warehouses.length > 0 ? (
          <>
            <SectionHead icon="warehouse">{t('staff.filters.warehouse')}</SectionHead>
            <ChipRow
              options={['ALL', ...warehouses.map((w) => w.id)]}
              selected={selectedWarehouse}
              onSelect={setSelectedWarehouse}
              labelFor={(id) => id === 'ALL' ? t('staff.filters.allWarehouses') : (warehouses.find((w) => w.id === id)?.name ?? id)}
            />
          </>
        ) : null}

        {/* Scope lock note */}
        {isLocked && lockedName ? (
          <View style={styles.lockNote}>
            <Text style={styles.lockNoteText}>
              {t('staff.filters.scopeLocked', { warehouse: lockedName })}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHead({ icon, children }: { icon: 'person' | 'calendar' | 'flag' | 'warehouse'; children: React.ReactNode }) {
  return (
    <View style={styles.sectionHead}>
      {icon === 'person'    ? <PersonIcon size={18} color={adminColors.ink} /> : null}
      {icon === 'calendar'  ? <CalendarIcon size={17} color={adminColors.ink} /> : null}
      {icon === 'flag'      ? <FlagIcon size={17} color={adminColors.ink} /> : null}
      {icon === 'warehouse' ? <WarehouseIcon size={18} color={adminColors.ink} /> : null}
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
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
        const active = opt === selected;
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

// Inline minimal icons not in StaffParts
function FlagIcon({ size = 17, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v19"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WarehouseIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  clearAll: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    textDecorationLine: 'underline',
    fontSize: 13,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  chip: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
  },
  chipActive: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
  },
  chipText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  chipTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  lockNote: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.xl,
  },
  lockNoteText: {
    ...adminType.body,
    color: adminColors.brandDeep,
    fontWeight: '600',
    lineHeight: 18,
  },
  footer: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  applyBtn: {
    height: ADMIN_BUTTON_HEIGHT,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
  },
  applyBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
});
