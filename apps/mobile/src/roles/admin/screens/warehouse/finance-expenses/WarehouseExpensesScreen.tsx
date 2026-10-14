/**
 * Warehouse expenses list — serves BOTH the Main Warehouse admin (scope has no
 * warehouseId = "All Warehouses") and the Sub Warehouse admin (scope is one
 * warehouse). It replaces the old SubWarehouseExpensesScreen /
 * MainWarehouseExpensesScreen / MainWarehouseExpensesFilterScreen trio.
 *
 * Gating (docs/rbac.json codes; the server re-checks every one of them, `can`
 * only decides what is worth rendering — CLAUDE.md 2.1):
 *   - finance.expense.log: the list is the expense log, so rows are rendered
 *     only with it; every "Add expense" entry (header +, FAB, empty-state
 *     button, filter view +) needs it too.
 * There is deliberately NO approve/reject action here. Approved/Rejected are
 * data labels on a row, not controls.
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

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow } from '../../../theme';
import { ExpenseCategoriesScreen } from './ExpenseCategoriesScreen';
import { ExpenseDetailScreen } from './ExpenseDetailScreen';
import { WarehouseAddExpenseScreen } from './WarehouseAddExpenseScreen';
import type { ExpenseDraft, ExpenseRecord, VoucherRecord, WarehouseScope, WarehouseScreenBaseProps } from './types';
import { VoucherDetailScreen } from './VoucherDetailScreen';
import { VouchersScreen } from './VouchersScreen';
import { WarehouseSelector } from '../inventory';

const EXPENSE_LOG_PERMISSION = 'finance.expense.log';
const ALL_WAREHOUSES_LABEL = 'All Warehouses';
const FILTER_ALL = 'All';
// Category chips offered by the filter view (ported from the Main filter screen).
const FILTER_CATEGORIES = [
  FILTER_ALL,
  'Transport',
  'Loading',
  'Warehouse Operations',
  'Utilities',
  'Maintenance',
] as const;

export const DEFAULT_WAREHOUSE_OPTIONS: readonly WarehouseScope[] = [
  { warehouseId: 'WH-COON', warehouseName: 'Coonoor Warehouse' },
  { warehouseId: 'WH-OOTY', warehouseName: 'Ooty Warehouse' },
  { warehouseId: 'WH-KOTA', warehouseName: 'Kotagiri Warehouse' },
  { warehouseId: 'WH-GUDA', warehouseName: 'Gudalur Market Warehouse' },
];

const SAMPLE_EXPENSE_RECORDS: ExpenseRecord[] = [
  {
    id: 'EXP-001245',
    categoryRef: 'Transport · Collection point → Warehouse',
    amount: 2400,
    timestamp: '25 Sep - 09:30 AM',
    status: 'Recorded',
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor Warehouse',
  },
  {
    id: 'EXP-001244',
    categoryRef: 'Loading / Unloading · Morning unloading',
    amount: 1800,
    timestamp: '25 Sep - 08:15 AM',
    status: 'Pending',
    warehouseId: 'WH-OOTY',
    warehouseName: 'Ooty Warehouse',
  },
  {
    id: 'EXP-001241',
    categoryRef: 'Warehouse Operations · Storage Crates & Pallets',
    amount: 1200,
    timestamp: '24 Sep - 05:45 PM',
    status: 'Approved',
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor Warehouse',
  },
  {
    id: 'EXP-001238',
    categoryRef: 'Utilities · Generator Diesel & Power',
    amount: 620,
    timestamp: '24 Sep - 02:30 PM',
    status: 'Recorded',
    warehouseId: 'WH-KOTA',
    warehouseName: 'Kotagiri Warehouse',
  },
  {
    id: 'EXP-001235',
    categoryRef: 'Maintenance · Digital Weigh Scale Calibration',
    amount: 400,
    timestamp: '24 Sep - 11:00 AM',
    status: 'Recorded',
    warehouseId: 'WH-GUDA',
    warehouseName: 'Gudalur Market Warehouse',
  },
  {
    id: 'EXP-001230',
    categoryRef: 'Transport · Inter-warehouse shuttle transfer',
    amount: 3200,
    timestamp: '23 Sep - 04:30 PM',
    status: 'Recorded',
    warehouseId: 'WH-OOTY',
    warehouseName: 'Ooty Warehouse',
  },
  {
    id: 'EXP-001228',
    categoryRef: 'Loading / Unloading · Evening shift crates',
    amount: 1450,
    timestamp: '23 Sep - 06:15 PM',
    status: 'Approved',
    warehouseId: 'WH-KOTA',
    warehouseName: 'Kotagiri Warehouse',
  },
  {
    id: 'EXP-001225',
    categoryRef: 'Utilities · Cold Storage Electricity Bill',
    amount: 5100,
    timestamp: '22 Sep - 10:00 AM',
    status: 'Recorded',
    warehouseId: 'WH-GUDA',
    warehouseName: 'Gudalur Market Warehouse',
  },
];

export interface WarehouseExpensesScreenProps extends WarehouseScreenBaseProps {
  onAddExpense?: (() => void) | undefined;
  /** Passed through to ExpenseDetailScreen's compact layout (ported from the Main copy). */
  isShortVersion?: boolean | undefined;
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  initialWarehouseId?: string | undefined;
  hideWarehouseFilter?: boolean | undefined;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusCircleIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.2" />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function PlusIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ size = 11, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.placeholder }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="4" cy="12" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="10" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="20" cy="14" r="2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// ─── Absorbed filter view (was MainWarehouseExpensesFilterScreen) ────────────

interface ExpenseCategoryFilterViewProps {
  selectedCategory: string;
  selectedWarehouseId?: string | undefined;
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  isMain: boolean;
  hideWarehouseFilter?: boolean | undefined;
  canLogExpense: boolean;
  onBack: () => void;
  onApply: (category: string, warehouseId?: string | undefined) => void;
  onAddExpense: () => void;
}

/** Category & Warehouse chooser. */
function ExpenseCategoryFilterView({
  selectedCategory,
  selectedWarehouseId,
  warehouseOptions = DEFAULT_WAREHOUSE_OPTIONS,
  isMain,
  hideWarehouseFilter = false,
  canLogExpense,
  onBack,
  onApply,
  onAddExpense,
}: ExpenseCategoryFilterViewProps) {
  const [draftCategory, setDraftCategory] = useState(selectedCategory);
  const [draftWarehouse, setDraftWarehouse] = useState<string | undefined>(selectedWarehouseId);

  const handleReset = () => {
    setDraftCategory(FILTER_ALL);
    setDraftWarehouse(undefined);
  };

  return (
    <SafeAreaView style={styles.filterRoot}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.headerBanner}>
        <View style={styles.filterHeaderRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} />
          </TouchableOpacity>
          <Text style={styles.filterHeaderTitle}>Filter Expenses</Text>
          {canLogExpense ? (
            <TouchableOpacity style={styles.addButton} onPress={onAddExpense} activeOpacity={0.75}>
              <PlusIcon size={18} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView style={styles.filterContentScroll} contentContainerStyle={styles.filterContent}>
        {/* Warehouse Selection (Main Warehouse only when not fixed from hub) */}
        {isMain && !hideWarehouseFilter ? (
          <View style={styles.filterSection}>
            <Text style={styles.sectionHeading}>Warehouses</Text>
            <View style={styles.chipsRow}>
              <TouchableOpacity
                style={[styles.chip, (!draftWarehouse || draftWarehouse === 'All') && styles.chipSelected]}
                onPress={() => setDraftWarehouse(undefined)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, (!draftWarehouse || draftWarehouse === 'All') && styles.chipTextSelected]}>
                  All Warehouses
                </Text>
              </TouchableOpacity>
              {warehouseOptions.map((w) => {
                const id = w.warehouseId;
                const name = w.warehouseName ?? w.warehouseId ?? '';
                const isSelected = draftWarehouse === id || draftWarehouse === name;
                return (
                  <TouchableOpacity
                    key={id ?? name}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setDraftWarehouse(id ?? name)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {name.replace(/ Warehouse$/, '')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Category Selection */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionHeading}>Category</Text>
          <View style={styles.chipsRow}>
            {FILTER_CATEGORIES.map((cat) => {
              const isSelected = draftCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => setDraftCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.filterButtonsRow}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.8}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => onApply(draftCategory, draftWarehouse)}
            activeOpacity={0.8}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export function WarehouseExpensesScreen({
  scope,
  can,
  onBack,
  onTabChange,
  onAddExpense,
  isShortVersion,
  warehouseOptions = DEFAULT_WAREHOUSE_OPTIONS,
  initialWarehouseId,
  hideWarehouseFilter = false,
}: WarehouseExpensesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(FILTER_ALL);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(initialWarehouseId);
  const [showAddExpenseScreen, setShowAddExpenseScreen] = useState(false);
  const [showCategoriesScreen, setShowCategoriesScreen] = useState(false);
  const [showFilterScreen, setShowFilterScreen] = useState(false);
  const [showVouchersScreen, setShowVouchersScreen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherRecord | null>(null);
  const [showReceiptScreen, setShowReceiptScreen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null);

  const canLogExpense = can(EXPENSE_LOG_PERMISSION);
  const isAllWarehouses = scope.warehouseId === undefined;
  const warehouseLabel = isAllWarehouses
    ? ALL_WAREHOUSES_LABEL
    : (scope.warehouseName ?? ALL_WAREHOUSES_LABEL);

  const selectedWhOption = warehouseOptions.find(
    (w) => w.warehouseId === selectedWarehouseId || w.warehouseName === selectedWarehouseId
  );

  const handleAddNewExpense = () => {
    if (!canLogExpense) return;
    if (onAddExpense) {
      onAddExpense();
    } else {
      setShowFilterScreen(false);
      setShowAddExpenseScreen(true);
    }
  };

  const filteredRecords = canLogExpense
    ? SAMPLE_EXPENSE_RECORDS.filter((rec) => {
        // Warehouse filter
        if (isAllWarehouses) {
          if (selectedWarehouseId && selectedWarehouseId !== 'All') {
            if (rec.warehouseId !== selectedWarehouseId && rec.warehouseName !== selectedWarehouseId) {
              return false;
            }
          }
        } else {
          // Subwarehouse: lock to scope if warehouseId is set
          if (scope.warehouseId && rec.warehouseId && rec.warehouseId !== scope.warehouseId) {
            return false;
          }
        }

        const query = searchQuery.trim().toLowerCase();
        const matchesCategory =
          categoryFilter === FILTER_ALL ||
          rec.categoryRef.toLowerCase().startsWith(categoryFilter.toLowerCase());
        const matchesQuery =
          !query ||
          rec.id.toLowerCase().includes(query) ||
          rec.categoryRef.toLowerCase().includes(query) ||
          rec.status.toLowerCase().includes(query) ||
          (rec.warehouseName && rec.warehouseName.toLowerCase().includes(query));
        return matchesCategory && matchesQuery;
      })
    : [];

  if (showCategoriesScreen) {
    return (
      <ExpenseCategoriesScreen
        scope={scope}
        can={can}
        onBack={() => setShowCategoriesScreen(false)}
        onTabChange={onTabChange}
      />
    );
  }

  if (showFilterScreen) {
    return (
      <ExpenseCategoryFilterView
        selectedCategory={categoryFilter}
        selectedWarehouseId={selectedWarehouseId}
        warehouseOptions={warehouseOptions}
        isMain={isAllWarehouses}
        hideWarehouseFilter={hideWarehouseFilter}
        canLogExpense={canLogExpense}
        onBack={() => setShowFilterScreen(false)}
        onApply={(cat, whId) => {
          setCategoryFilter(cat);
          setSelectedWarehouseId(whId);
          setShowFilterScreen(false);
        }}
        onAddExpense={handleAddNewExpense}
      />
    );
  }

  if (selectedVoucher) {
    return (
      <VoucherDetailScreen
        scope={scope}
        can={can}
        voucher={selectedVoucher}
        onBack={() => setSelectedVoucher(null)}
        onTabChange={onTabChange}
      />
    );
  }

  if (showVouchersScreen) {
    return (
      <VouchersScreen
        scope={scope}
        can={can}
        onBack={() => setShowVouchersScreen(false)}
        onTabChange={onTabChange}
        onSelectVoucher={(voucher) => setSelectedVoucher(voucher)}
      />
    );
  }

  if (selectedExpense && showReceiptScreen) {
    return (
      <ExpenseDetailScreen
        scope={scope}
        can={can}
        expenseId={selectedExpense.id}
        amount={selectedExpense.amount}
        category={selectedExpense.categoryRef.split('·')[0]?.trim() || 'Transport'}
        date="25 Sep 2026"
        description="Transport from collection point to warehouse"
        paymentMethod="Cash"
        vendorPayee="Local Transport Co."
        warehouse={isAllWarehouses ? (selectedExpense.warehouseName ?? warehouseLabel) : warehouseLabel}
        createdBy="Warehouse Admin"
        status={selectedExpense.status}
        isShortVersion={isShortVersion}
        onBack={() => setShowReceiptScreen(false)}
        onTabChange={onTabChange}
        isReceiptView={true}
      />
    );
  }

  if (selectedExpense) {
    return (
      <ExpenseDetailScreen
        scope={scope}
        can={can}
        expenseId={selectedExpense.id}
        amount={selectedExpense.amount}
        category={selectedExpense.categoryRef.split('·')[0]?.trim() || 'Transport'}
        date="25 Sep 2026"
        description="Transport from collection point to warehouse"
        paymentMethod="Cash"
        vendorPayee="Local Transport Co."
        warehouse={isAllWarehouses ? (selectedExpense.warehouseName ?? warehouseLabel) : warehouseLabel}
        createdBy="Warehouse Admin"
        status={selectedExpense.status}
        isShortVersion={isShortVersion}
        onBack={() => setSelectedExpense(null)}
        onTabChange={onTabChange}
        onEdit={canLogExpense ? () => setShowAddExpenseScreen(true) : undefined}
        onViewReceipt={() => setShowReceiptScreen(true)}
        onViewVouchers={() => setShowVouchersScreen(true)}
      />
    );
  }

  if (showAddExpenseScreen && canLogExpense) {
    const initialExpense: ExpenseDraft = {
      expenseId: 'EXP-001245',
      amount: '2400',
      category: 'Transport',
      date: '25 Sep 2026',
      description: 'Transport from collection point to warehouse',
      paymentMethod: 'Cash',
      vendorPayee: 'Local Transport Co.',
    };
    return (
      <WarehouseAddExpenseScreen
        scope={scope}
        can={can}
        onBack={() => setShowAddExpenseScreen(false)}
        onTabChange={onTabChange}
        onSaveSuccess={() => {
          setShowAddExpenseScreen(false);
          setSelectedExpense({
            id: 'EXP-001245',
            categoryRef: 'Transport',
            amount: 2400,
            timestamp: '25 Sep - 09:30 AM',
            status: 'Recorded',
            warehouseId: 'WH-COON',
            warehouseName: 'Coonoor Warehouse',
          });
        }}
        initialExpense={initialExpense}
      />
    );
  }

  const totalFilteredAmount = filteredRecords.reduce((sum, r) => sum + r.amount, 0);
  const pendingCount = filteredRecords.filter((r) => r.status === 'Pending').length;
  const avgExpense = filteredRecords.length > 0 ? Math.round(totalFilteredAmount / filteredRecords.length) : 0;
  const isSpecificWarehouseFilter = isAllWarehouses && selectedWarehouseId && selectedWarehouseId !== 'All';

  // Main view shows portfolio-wide totals when All Warehouses is chosen; single warehouse shows filtered view.
  const kpis = isAllWarehouses
    ? [
        { label: 'TOTAL EXPENSES', value: isSpecificWarehouseFilter ? `₹${totalFilteredAmount.toLocaleString()}` : '₹1,48,600' },
        { label: 'TRANSACTIONS', value: isSpecificWarehouseFilter ? `${filteredRecords.length}` : '82' },
        { label: 'AVERAGE', value: isSpecificWarehouseFilter ? `₹${avgExpense.toLocaleString()}` : '₹1,812' },
        { label: 'PENDING', value: isSpecificWarehouseFilter ? `${pendingCount}` : '8' },
      ]
    : [
        { label: "TODAY'S EXPENSES", value: '₹6,420' },
        { label: 'THIS MONTH', value: '₹1,48,600' },
        { label: 'PENDING', value: '8' },
        { label: 'APPROVED', value: '42' },
      ];

  const categorySummary = [
    { label: 'Transport', value: '₹32,500' },
    { label: 'Loading', value: '₹18,400' },
    { label: 'Unloading', value: '₹12,600' },
    { label: 'Maintenance', value: '₹8,200' },
    { label: 'Utilities', value: '₹5,500' },
    { label: 'Other', value: '₹3,400' },
  ];

  const statusTone = (status: ExpenseRecord['status']) => {
    if (status === 'Pending') return adminColors.warning;
    if (status === 'Rejected') return adminColors.danger;
    return adminColors.success; // Recorded, Approved
  };

  const hasActiveFilters =
    categoryFilter !== FILTER_ALL ||
    (isAllWarehouses && selectedWarehouseId !== undefined && selectedWarehouseId !== 'All');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.75}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowBackIcon size={22} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Expenses</Text>
          </View>

          {canLogExpense ? (
            <TouchableOpacity style={styles.addButton} onPress={handleAddNewExpense} activeOpacity={0.75}>
              <PlusCircleIcon size={22} />
            </TouchableOpacity>
          ) : null}
        </View>

        {isAllWarehouses ? (
          hideWarehouseFilter ? null : (
            <View style={styles.warehousePillRow}>
              <WarehouseSelector
                scope={scope}
                options={warehouseOptions}
                selectedId={selectedWarehouseId}
                onSelect={setSelectedWarehouseId}
              />
            </View>
          )
        ) : (
          <View style={styles.warehousePillRow}>
            <View style={styles.warehousePill}>
              <LockIcon size={11} />
              <Text style={styles.warehousePillText}>{warehouseLabel}</Text>
            </View>
          </View>
        )}
      </View>

      {/* ─── Main Content Scroll ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 4 Top KPI Cards (2x2 Grid) ─── */}
        <View style={styles.kpiGrid}>
          {[kpis.slice(0, 2), kpis.slice(2, 4)].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.kpiRow}>
              {row.map((kpi) => (
                <View key={kpi.label} style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>{kpi.label}</Text>
                  <Text style={styles.kpiValue}>{kpi.value}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* ─── Expense Categories Summary ─── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Expense Categories Summary</Text>
            <TouchableOpacity
              onPress={() => setShowCategoriesScreen(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.sectionActionText}>View All ›</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.breakdownCard}
            onPress={() => setShowCategoriesScreen(true)}
            activeOpacity={0.8}
          >
            {categorySummary.map((row, index) => (
              <View key={row.label}>
                {index > 0 ? <View style={styles.tableDivider} /> : null}
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>{row.label}</Text>
                  <Text style={styles.tableValue}>{row.value}</Text>
                </View>
              </View>
            ))}
          </TouchableOpacity>
        </View>

        {/* ─── Search & Filter Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Expense ID, Voucher, Vendor..."
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          <TouchableOpacity onPress={() => setShowFilterScreen(true)} activeOpacity={0.7}>
            <FilterSlidersIcon size={18} color={hasActiveFilters ? adminColors.brand : adminColors.muted} />
          </TouchableOpacity>
        </View>

        {hasActiveFilters ? (
          <View style={styles.activeFilterRow}>
            <Text style={styles.activeFilterText}>
              {[
                isSpecificWarehouseFilter
                  ? `Warehouse: ${selectedWhOption?.warehouseName?.replace(/ Warehouse$/, '') ?? selectedWarehouseId}`
                  : null,
                categoryFilter !== FILTER_ALL ? `Category: ${categoryFilter}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setCategoryFilter(FILTER_ALL);
                if (!hideWarehouseFilter) {
                  setSelectedWarehouseId(undefined);
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearFilterText}>Clear</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ─── Expense Records List (the expense log) ─── */}
        {filteredRecords.length > 0 ? (
          <View style={styles.cardsList}>
            {filteredRecords.map((item) => {
              const tone = statusTone(item.status);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.recordCard}
                  onPress={() => setSelectedExpense(item)}
                  activeOpacity={0.75}
                >
                  <View style={styles.recordHeaderRow}>
                    <View style={styles.recordTitleCol}>
                      <Text style={styles.recordId}>{item.id}</Text>
                      <Text style={styles.recordCategoryRef}>{item.categoryRef}</Text>
                    </View>
                    {/* Status is a data label, not an action: nothing here approves or rejects. */}
                    <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: tone.text }]}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={styles.cardDivider} />
                  <View style={styles.recordFooterRow}>
                    <Text style={styles.recordTimestamp}>
                      {item.timestamp}{isAllWarehouses ? ` · ${item.warehouseName ?? 'Coonoor Warehouse'}` : ''}
                    </Text>
                    <Text style={styles.recordAmount}>-₹{item.amount.toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {canLogExpense ? 'No expenses found' : 'Expense log unavailable'}
            </Text>
            <Text style={styles.emptyBody}>
              {canLogExpense
                ? 'Try a different search or category, or record a new expense.'
                : 'Your role does not include the expense log.'}
            </Text>
            {canLogExpense ? (
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddNewExpense} activeOpacity={0.8}>
                <Text style={styles.emptyButtonText}>Add Expense</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        <View style={styles.listEndSpacer} />
      </ScrollView>

      {canLogExpense ? (
        <TouchableOpacity style={styles.fab} onPress={handleAddNewExpense} activeOpacity={0.85}>
          <PlusIcon size={24} />
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  filterRoot: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.input,
    paddingTop: 10,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: adminSpacing.md,
    padding: 2,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  filterHeaderTitle: {
    ...adminType.title,
    flex: 1,
    color: adminColors.onBrand,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePillRow: {
    marginLeft: 36,
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 5,
    borderRadius: adminRadius.full,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehousePillText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },

  // ─── 2x2 KPI Grid ───
  kpiGrid: {
    gap: 10,
    marginBottom: adminSpacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...adminShadow.sm,
  },
  kpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: adminSpacing.xs,
  },
  kpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },

  // ─── Sections & Tables ───
  sectionWrap: {
    marginBottom: adminSpacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
    paddingHorizontal: 2,
  },
  // 14/800 -> sectionHead 13/800
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  sectionActionText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  breakdownCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xs,
    ...adminShadow.sm,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  tableLabel: {
    ...adminType.body,
    color: adminColors.ink,
  },
  tableValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  tableDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },

  // ─── Search Bar ───
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: adminSpacing.lg,
    gap: 10,
    ...adminShadow.sm,
  },
  searchInput: {
    ...adminType.body,
    flex: 1,
    color: adminColors.ink,
    padding: 0,
    margin: 0,
  },
  activeFilterText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },

  // ─── Records List ───
  cardsList: {
    gap: adminSpacing.md,
  },
  recordCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 14,
    ...adminShadow.sm,
  },
  recordHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  recordTitleCol: {
    flex: 1,
  },
  // 15/800 -> rowTitle 12.5/800
  recordId: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  statusBadgeText: {
    ...adminType.caption,
  },
  recordCategoryRef: {
    ...adminType.body,
    color: adminColors.ink,
  },
  cardDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.sm,
  },
  recordFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // 16/800 -> rowTitle 12.5/800
  recordAmount: {
    ...adminType.rowTitle,
    color: adminColors.danger.text,
  },
  recordTimestamp: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },

  // ─── Empty state / FAB ───
  emptyState: {
    alignItems: 'center',
    paddingVertical: adminSpacing.xl,
    gap: adminSpacing.sm,
  },
  emptyTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  emptyBody: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: adminSpacing.sm,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.xl,
    paddingVertical: adminSpacing.md,
  },
  emptyButtonText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  listEndSpacer: {
    height: 72,
  },
  fab: {
    position: 'absolute',
    right: adminSpacing.lg,
    bottom: adminSpacing.xl,
    width: 52,
    height: 52,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.md,
  },

  // ─── Filter view ───
  filterContent: {
    padding: adminSpacing.lg,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xl,
  },
  chip: {
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.lg,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  chipSelected: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  chipText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  chipTextSelected: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
    paddingHorizontal: 2,
  },
  clearFilterText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  filterContentScroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  filterSection: {
    marginBottom: adminSpacing.lg,
  },
  filterButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xl,
  },
  resetButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  applyButton: {
    flex: 2,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 15/800 -> rowTitle 12.5/800
  applyButtonText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
});
