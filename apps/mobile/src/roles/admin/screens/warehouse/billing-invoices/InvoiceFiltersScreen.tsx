/**
 * Invoice Filters: search, status, type, date range, customer, order, amount
 * range and sort for the invoice list (both layouts).
 *
 * Scope (FINAL_LIST row 5): filter UI only, no action to gate. The warehouse
 * filter renders only for the Main view (scope.warehouseId undefined); a Sub
 * admin is locked to its own warehouse, so applying never carries a warehouse.
 *
 * Absorbs SubWarehouseInvoiceHistoryFiltersScreen (folded with Invoice History
 * into the one list): its Sort By section is here, its status/type options are
 * covered by this screen's, and its InvoiceHistoryFilterState is
 * InvoiceFilterState.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { BillingButton, BillingFooter, BillingScreen, ChipGroup, isAllWarehouses, SearchBar } from './BillingParts';
import { BILLING_WAREHOUSES, DEFAULT_INVOICE_FILTERS } from './fixtures';
import type { InvoiceFilterState, WarehouseScope, WarehouseScreenBaseProps } from './types';

export interface InvoiceFiltersScreenProps extends WarehouseScreenBaseProps {
  initialFilters?: InvoiceFilterState | undefined;
  onApplyFilters: (filters: InvoiceFilterState) => void;
  /** Warehouses for the Main warehouse filter (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
}

const STATUS_OPTIONS: readonly InvoiceFilterState['status'][] = ['All', 'Generated', 'Pending', 'Cancelled'];
const TYPE_OPTIONS: readonly InvoiceFilterState['invoiceType'][] = ['All', 'Retail Sale', 'Market Sale', 'B2B Sale'];
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

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function LabeledInput({
  label,
  value,
  placeholder,
  onChangeText,
  numeric = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  numeric?: boolean;
}) {
  return (
    <View style={styles.inputCol}>
      <Text style={styles.inputSubLabel}>{label}</Text>
      <TextInput
        style={styles.textInput}
        placeholder={placeholder}
        placeholderTextColor={adminColors.placeholder}
        keyboardType={numeric ? 'numeric' : 'default'}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

export function InvoiceFiltersScreen({
  scope,
  onBack,
  initialFilters = DEFAULT_INVOICE_FILTERS,
  onApplyFilters,
  warehouseOptions = BILLING_WAREHOUSES,
}: InvoiceFiltersScreenProps) {
  const [filters, setFilters] = useState<InvoiceFilterState>({ ...initialFilters });
  const allWarehouses = isAllWarehouses(scope);
  const set = (patch: Partial<InvoiceFilterState>) => setFilters((prev) => ({ ...prev, ...patch }));
  const handleClearAll = () => setFilters({ ...DEFAULT_INVOICE_FILTERS });
  // A Sub scope never filters by another warehouse: drop any stale value on apply.
  const handleApply = () => onApplyFilters(allWarehouses ? filters : { ...filters, warehouseId: undefined });

  const warehouseLabels = [
    ALL_WAREHOUSES,
    ...warehouseOptions
      .filter((o) => o.warehouseId !== undefined)
      .map((o) => o.warehouseName ?? String(o.warehouseId)),
  ];
  const selectedWarehouseLabel =
    warehouseOptions.find((o) => o.warehouseId === filters.warehouseId)?.warehouseName ?? ALL_WAREHOUSES;

  return (
    <BillingScreen
      title="Invoice Filters"
      onBack={onBack}
      headerRight={
        <TouchableOpacity
          style={styles.headerResetButton}
          onPress={handleClearAll}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Clear All Filters"
        >
          <Text style={styles.headerResetText}>Reset</Text>
        </TouchableOpacity>
      }
      footer={
        <BillingFooter>
          <View style={styles.footerRow}>
            <BillingButton label="Clear All" variant="neutral" flex onPress={handleClearAll} />
            <BillingButton label="Apply Filters" flex onPress={handleApply} />
          </View>
        </BillingFooter>
      }
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Section label="Search">
          <SearchBar
            value={filters.searchQuery}
            onChangeText={(text) => set({ searchQuery: text })}
            placeholder="Search Invoice / Order / Customer"
          />
        </Section>

        {allWarehouses ? (
          <Section label="Warehouse">
            <ChipGroup
              options={warehouseLabels}
              value={selectedWarehouseLabel}
              onChange={(label) =>
                set({ warehouseId: warehouseOptions.find((o) => o.warehouseName === label)?.warehouseId })
              }
            />
          </Section>
        ) : null}

        <Section label="Invoice Status">
          <ChipGroup options={STATUS_OPTIONS} value={filters.status} onChange={(status) => set({ status })} />
        </Section>

        <Section label="Invoice Type">
          <ChipGroup
            options={TYPE_OPTIONS}
            value={filters.invoiceType}
            onChange={(invoiceType) => set({ invoiceType })}
          />
        </Section>

        <Section label="Date Range">
          <ChipGroup
            options={DATE_PRESETS}
            value={filters.datePreset}
            onChange={(datePreset) => set({ datePreset })}
          />
          {filters.datePreset === 'Custom' ? (
            <View style={styles.inputRow}>
              <LabeledInput
                label="From"
                value={filters.startDate}
                placeholder="DD/MM/YYYY"
                onChangeText={(startDate) => set({ startDate })}
              />
              <LabeledInput
                label="To"
                value={filters.endDate}
                placeholder="DD/MM/YYYY"
                onChangeText={(endDate) => set({ endDate })}
              />
            </View>
          ) : null}
        </Section>

        <Section label="Customer & Order">
          <View style={styles.inputStack}>
            <LabeledInput
              label="Customer"
              value={filters.customer}
              placeholder="e.g. Ravi Kumar"
              onChangeText={(customer) => set({ customer })}
            />
            <LabeledInput
              label="Order ID"
              value={filters.orderId}
              placeholder="e.g. ORD-002154"
              onChangeText={(orderId) => set({ orderId })}
            />
          </View>
        </Section>

        <Section label="Amount Range (₹)">
          <View style={styles.inputRow}>
            <LabeledInput
              label="Min"
              value={filters.minAmount}
              placeholder="₹ 0"
              numeric
              onChangeText={(minAmount) => set({ minAmount })}
            />
            <LabeledInput
              label="Max"
              value={filters.maxAmount}
              placeholder="Any"
              numeric
              onChangeText={(maxAmount) => set({ maxAmount })}
            />
          </View>
        </Section>

        <Section label="Sort By">
          <ChipGroup options={SORT_OPTIONS} value={filters.sortBy} onChange={(sortBy) => set({ sortBy })} />
        </Section>
      </ScrollView>
    </BillingScreen>
  );
}

const INPUT_HEIGHT = 44;

const styles = StyleSheet.create({
  headerResetButton: { paddingHorizontal: adminSpacing.sm, paddingVertical: adminSpacing.xs },
  headerResetText: { ...adminType.rowTitle, color: adminColors.onBrand },
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.md, paddingBottom: adminSpacing.xl },
  sectionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  sectionLabel: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.sm },
  inputRow: { flexDirection: 'row', gap: adminSpacing.md, marginTop: adminSpacing.md },
  inputStack: { gap: adminSpacing.md },
  inputCol: { flex: 1 },
  inputSubLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  textInput: {
    ...adminType.body,
    height: INPUT_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    color: adminColors.ink,
  },
  footerRow: { flexDirection: 'row', gap: adminSpacing.md },
});
