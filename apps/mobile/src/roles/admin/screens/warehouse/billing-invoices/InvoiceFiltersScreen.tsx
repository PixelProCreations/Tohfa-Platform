/**
 * Invoice Filters: search, status, type, date range, customer, order, amount
 * range and sort for the invoice list (both layouts).
 * Styled consistently with the standard filter screens (SalesFiltersScreen, ReturnsFiltersScreen).
 */
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { isAllWarehouses } from './BillingParts';
import { DEFAULT_INVOICE_FILTERS } from './fixtures';
import type { InvoiceFilterState, WarehouseScope, WarehouseScreenBaseProps } from './types';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';

export interface InvoiceFiltersScreenProps extends WarehouseScreenBaseProps {
  initialFilters?: InvoiceFilterState | undefined;
  onApplyFilters: (filters: InvoiceFilterState) => void;
  /** Warehouses for the Main warehouse filter (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
}

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

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

function CalendarIcon({ size = 17, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TagIcon({ size = 17, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BuildingWarehouseIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserIcon({ size = 17, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RupeeIcon({ size = 17, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SortIcon({ size = 17, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FunnelIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const STATUS_OPTIONS: readonly InvoiceFilterState['status'][] = ['All', 'Generated', 'Pending', 'Cancelled', 'CreditNoted'];

const TYPE_OPTIONS: readonly InvoiceFilterState['invoiceType'][] = [
  'All',
  'SALE_RETAIL',
  'SALE_B2B',
  'PURCHASE_FARMER',
  'PAYOUT',
  'SUBSCRIPTION',
];

const TYPE_LABELS: Record<InvoiceFilterState['invoiceType'], string> = {
  All: 'All',
  SALE_RETAIL: 'Retail Sale',
  SALE_B2B: 'B2B Sale',
  PURCHASE_FARMER: 'Farmer Purchase',
  PAYOUT: 'Payout',
  SUBSCRIPTION: 'Subscription',
};
const DATE_PRESETS: readonly InvoiceFilterState['datePreset'][] = [
  'All Time',
  'Today',
  'Last 7 Days',
  'This Month',
  'Custom',
];
const SORT_OPTIONS: readonly InvoiceFilterState['sortBy'][] = [
  'Newest First',
  'Oldest First',
  'Highest Amount',
  'Lowest Amount',
];
const ALL_WAREHOUSES = 'All Warehouses';

export function InvoiceFiltersScreen({
  scope,
  onBack,
  initialFilters = DEFAULT_INVOICE_FILTERS,
  onApplyFilters,
  warehouseOptions = [],
}: InvoiceFiltersScreenProps) {
  const [filters, setFilters] = useState<InvoiceFilterState>({ ...initialFilters });
  const allWarehouses = isAllWarehouses(scope);
  const set = (patch: Partial<InvoiceFilterState>) => setFilters((prev) => ({ ...prev, ...patch }));
  const handleClearAll = () => setFilters({ ...DEFAULT_INVOICE_FILTERS });
  const handleApply = () => onApplyFilters(allWarehouses ? filters : { ...filters, warehouseId: undefined });

  const warehouseList = [
    { id: undefined, name: ALL_WAREHOUSES },
    ...warehouseOptions
      .filter((o) => o.warehouseId !== undefined)
      .map((o) => ({ id: o.warehouseId, name: o.warehouseName ?? String(o.warehouseId) })),
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice Filters</Text>
        <TouchableOpacity
          onPress={handleClearAll}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Clear All"
        >
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search invoice, order or customer"
            placeholderTextColor={adminColors.placeholder}
            value={filters.searchQuery}
            onChangeText={(text) => set({ searchQuery: text })}
            autoCorrect={false}
          />
        </View>

        {/* Status */}
        <View style={styles.sectionHeadRow}>
          <FlagIcon size={17} color={adminColors.ink} />
          <Text style={styles.sectionTitle}>Invoice Status</Text>
        </View>
        <View style={styles.chipWrap}>
          {STATUS_OPTIONS.map((item) => {
            const active = item === filters.status;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => set({ status: item })}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Invoice Type */}
        <View style={styles.sectionHeadRow}>
          <TagIcon size={17} color={adminColors.ink} />
          <Text style={styles.sectionTitle}>Invoice Type</Text>
        </View>
        <View style={styles.chipWrap}>
          {TYPE_OPTIONS.map((item) => {
            const active = item === filters.invoiceType;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => set({ invoiceType: item })}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{TYPE_LABELS[item]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date Range */}
        <View style={styles.sectionHeadRow}>
          <CalendarIcon size={17} color={adminColors.ink} />
          <Text style={styles.sectionTitle}>Date Range</Text>
        </View>
        <View style={styles.chipWrap}>
          {DATE_PRESETS.map((item) => {
            const active = item === filters.datePreset;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => set({ datePreset: item })}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {filters.datePreset === 'Custom' ? (
          <View style={styles.inputRow}>
            <View style={styles.inputCol}>
              <Text style={styles.inputSubLabel}>From</Text>
              <TextInput
                style={styles.textInput}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={adminColors.placeholder}
                value={filters.startDate}
                onChangeText={(startDate) => set({ startDate })}
              />
            </View>
            <View style={styles.inputCol}>
              <Text style={styles.inputSubLabel}>To</Text>
              <TextInput
                style={styles.textInput}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={adminColors.placeholder}
                value={filters.endDate}
                onChangeText={(endDate) => set({ endDate })}
              />
            </View>
          </View>
        ) : null}

        {/* Warehouse Selector */}
        {allWarehouses && (
          <>
            <View style={styles.sectionHeadRow}>
              <BuildingWarehouseIcon size={18} color={adminColors.ink} />
              <Text style={styles.sectionTitle}>Warehouse</Text>
            </View>
            <View style={styles.chipWrap}>
              {warehouseList.map((w) => {
                const active = filters.warehouseId === w.id;
                return (
                  <TouchableOpacity
                    key={w.name}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => set({ warehouseId: w.id })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{w.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Amount Range */}
        <View style={styles.sectionHeadRow}>
          <RupeeIcon size={17} color={adminColors.ink} />
          <Text style={styles.sectionTitle}>Amount Range (₹)</Text>
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputCol}>
            <Text style={styles.inputSubLabel}>Min</Text>
            <TextInput
              style={styles.textInput}
              placeholder="₹ 0"
              placeholderTextColor={adminColors.placeholder}
              keyboardType="numeric"
              value={filters.minAmount}
              onChangeText={(minAmount) => set({ minAmount })}
            />
          </View>
          <View style={styles.inputCol}>
            <Text style={styles.inputSubLabel}>Max</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Any"
              placeholderTextColor={adminColors.placeholder}
              keyboardType="numeric"
              value={filters.maxAmount}
              onChangeText={(maxAmount) => set({ maxAmount })}
            />
          </View>
        </View>

        {/* Sort By */}
        <View style={styles.sectionHeadRow}>
          <SortIcon size={17} color={adminColors.ink} />
          <Text style={styles.sectionTitle}>Sort By</Text>
        </View>
        <View style={styles.chipWrap}>
          {SORT_OPTIONS.map((item) => {
            const active = item === filters.sortBy;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => set({ sortBy: item })}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApply}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Apply Filters"
        >
          <FunnelIcon size={18} color={adminColors.onBrand} />
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  clearAllText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.onBrand,
    textDecorationLine: 'underline',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    height: 48,
    gap: 10,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    marginBottom: adminSpacing.md,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: adminColors.brandSoft.bg,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
  },
  chipText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.muted,
  },
  chipTextActive: {
    color: adminColors.brand,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  inputStack: {
    gap: 10,
  },
  inputCol: {
    flex: 1,
  },
  inputSubLabel: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.muted,
    marginBottom: 4,
  },
  textInput: {
    height: 44,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    ...adminType.body,
    color: adminColors.ink,
  },
  footer: {
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  applyButton: {
    backgroundColor: adminColors.brand,
    height: 50,
    borderRadius: adminRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyButtonText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
});
