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
import type { ExpenseDraft, ExpenseRecord, VoucherRecord, WarehouseScreenBaseProps } from './types';
import { VoucherDetailScreen } from './VoucherDetailScreen';
import { VouchersScreen } from './VouchersScreen';

const EXPENSE_LOG_PERMISSION = 'finance.expense.log';
const ALL_WAREHOUSES_LABEL = 'All Warehouses';
const FILTER_ALL = 'All';
// Category chips offered by the filter view (ported from the Main filter screen).
const FILTER_CATEGORIES = [FILTER_ALL, 'Transport', 'Loading'] as const;

const SAMPLE_EXPENSE_RECORDS: ExpenseRecord[] = [
  {
    id: 'EXP-001245',
    categoryRef: 'Transport · Collection point → Warehouse',
    amount: 2400,
    timestamp: '25 Sep - 09:30 AM',
    status: 'Recorded',
  },
  {
    id: 'EXP-001244',
    categoryRef: 'Loading / Unloading · Morning unloading',
    amount: 1800,
    timestamp: '25 Sep - 08:15 AM',
    status: 'Pending',
  },
  {
    id: 'EXP-001241',
    categoryRef: 'Warehouse Operations · Storage Crates & Pallets',
    amount: 1200,
    timestamp: '24 Sep - 05:45 PM',
    status: 'Approved',
  },
  {
    id: 'EXP-001238',
    categoryRef: 'Utilities · Generator Diesel & Power',
    amount: 620,
    timestamp: '24 Sep - 02:30 PM',
    status: 'Recorded',
  },
  {
    id: 'EXP-001235',
    categoryRef: 'Maintenance · Digital Weigh Scale Calibration',
    amount: 400,
    timestamp: '24 Sep - 11:00 AM',
    status: 'Recorded',
  },
];

export interface WarehouseExpensesScreenProps extends WarehouseScreenBaseProps {
  onAddExpense?: (() => void) | undefined;
  /** Passed through to ExpenseDetailScreen's compact layout (ported from the Main copy). */
  isShortVersion?: boolean | undefined;
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
  selected: string;
  canLogExpense: boolean;
  onBack: () => void;
  onApply: (category: string) => void;
  onAddExpense: () => void;
}

/** Category chooser. Local to this file: nothing else filters expenses by category. */
function ExpenseCategoryFilterView({
  selected,
  canLogExpense,
  onBack,
  onApply,
  onAddExpense,
}: ExpenseCategoryFilterViewProps) {
  const [draft, setDraft] = useState(selected);

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
          <Text style={styles.filterHeaderTitle}>Expenses</Text>
          {canLogExpense ? (
            <TouchableOpacity style={styles.addButton} onPress={onAddExpense} activeOpacity={0.75}>
              <PlusIcon size={18} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.filterContent}>
        <Text style={styles.sectionHeading}>Category</Text>
        <View style={styles.chipsRow}>
          {FILTER_CATEGORIES.map((cat) => {
            const isSelected = draft === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setDraft(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.applyButton} onPress={() => onApply(draft)} activeOpacity={0.8}>
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>
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
}: WarehouseExpensesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(FILTER_ALL);
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
        const query = searchQuery.trim().toLowerCase();
        const matchesCategory =
          categoryFilter === FILTER_ALL ||
          rec.categoryRef.toLowerCase().startsWith(categoryFilter.toLowerCase());
        const matchesQuery =
          !query ||
          rec.id.toLowerCase().includes(query) ||
          rec.categoryRef.toLowerCase().includes(query) ||
          rec.status.toLowerCase().includes(query);
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
        selected={categoryFilter}
        canLogExpense={canLogExpense}
        onBack={() => setShowFilterScreen(false)}
        onApply={(cat) => {
          setCategoryFilter(cat);
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
        warehouse={warehouseLabel}
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
        warehouse={warehouseLabel}
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
          });
        }}
        initialExpense={initialExpense}
      />
    );
  }

  // Main view shows portfolio-wide totals; a single warehouse shows its day/month view.
  const kpis = isAllWarehouses
    ? [
        { label: 'TOTAL EXPENSES', value: '₹1,48,600' },
        { label: 'TRANSACTIONS', value: '82' },
        { label: 'AVERAGE', value: '₹1,812' },
        { label: 'PENDING', value: '8' },
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

        <View style={styles.warehousePillRow}>
          <View style={styles.warehousePill}>
            <LockIcon size={11} />
            <Text style={styles.warehousePillText}>{warehouseLabel}</Text>
          </View>
        </View>
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
            <FilterSlidersIcon size={18} />
          </TouchableOpacity>
        </View>

        {categoryFilter !== FILTER_ALL ? (
          <Text style={styles.activeFilterText}>Category: {categoryFilter}</Text>
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
                    <Text style={styles.recordTimestamp}>{item.timestamp}</Text>
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
  // Old fill was a 25% white overlay on orange; no overlay token exists, so the
  // button and pill use the deep-orange token as a solid darker disc.
  addButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePillRow: {
    marginLeft: 36,
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandDeep,
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
  applyButton: {
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
