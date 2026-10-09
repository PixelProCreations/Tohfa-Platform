import React, { useState } from 'react';
import {
  Alert,
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

import { SubWarehouseAddExpenseScreen } from './SubWarehouseAddExpenseScreen';
import { SubWarehouseExpenseDetailScreen } from './SubWarehouseExpenseDetailScreen';
import { SubWarehouseExpenseCategoriesScreen } from './SubWarehouseExpenseCategoriesScreen';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  peachBg:       '#FDF0EB',
  iconColor:     '#8B5E3C',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textDark:      '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9CA3AF',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',

  green:         '#059669',
  greenBg:       '#DCFCE7',
  greenText:     '#15803D',
  red:           '#DC2626',
  redBg:         '#FEE2E2',
  amber:         '#D97706',
  amberBg:       '#FEF3C7',
  amberText:     '#92400E',
  blue:          '#2563EB',
  blueBg:        '#EFF6FF',
  blueBorder:    '#BFDBFE',
  blueText:      '#1E40AF',

  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface ExpenseRecord {
  id: string;
  categoryRef: string;
  amount: number;
  timestamp: string;
  status: 'Recorded' | 'Pending' | 'Approved' | 'Rejected';
}

const SAMPLE_EXPENSE_RECORDS: ExpenseRecord[] = [
  {
    id: 'EXP-001245',
    categoryRef: 'Transport · Coonoor → Warehouse',
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

export interface SubWarehouseExpensesScreenProps {
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
  onAddExpense?: (() => void) | undefined;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function PlusCircleIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.2" />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function LockIcon({ size = 11, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="4" cy="12" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="10" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="20" cy="14" r="2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// ── Tab Bar Icons ──
function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path
        d="M12 8v8M8 12l4 4 4-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}

export function SubWarehouseExpensesScreen({
  onBack,
  onTabChange,
  onAddExpense,
}: SubWarehouseExpensesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddExpenseScreen, setShowAddExpenseScreen] = useState(false);
  const [showCategoriesScreen, setShowCategoriesScreen] = useState(false);
  const [showReceiptScreen, setShowReceiptScreen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null);

  const handleTabPress = (tab: SubWHTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else if (tab === 'More' && onBack) {
      onBack();
    } else if (tab === 'Home' && onBack) {
      onBack();
    }
  };

  const handleAddNewExpense = () => {
    if (onAddExpense) {
      onAddExpense();
    } else {
      setShowAddExpenseScreen(true);
    }
  };

  const filteredRecords = SAMPLE_EXPENSE_RECORDS.filter((rec) => {
    const query = searchQuery.trim().toLowerCase();
    return (
      !query ||
      rec.id.toLowerCase().includes(query) ||
      rec.categoryRef.toLowerCase().includes(query) ||
      rec.status.toLowerCase().includes(query)
    );
  });

  if (showCategoriesScreen) {
    return (
      <SubWarehouseExpenseCategoriesScreen
        onBack={() => setShowCategoriesScreen(false)}
        onTabChange={onTabChange}
      />
    );
  }

  if (showReceiptScreen) {
    return (
      <SubWarehouseExpenseDetailScreen
        expenseId={selectedExpense?.id || 'EXP-001245'}
        amount={selectedExpense?.amount || 2400}
        category={selectedExpense?.categoryRef.split('·')[0]?.trim() || 'Transport'}
        date="25 Sep 2026"
        description="Transport from Coonoor collection point to warehouse"
        paymentMethod="Cash"
        vendorPayee="Coonoor Transport Co."
        warehouse="Coonoor"
        createdBy="SWA – Suresh"
        status={selectedExpense?.status || 'Recorded'}
        onBack={() => setShowReceiptScreen(false)}
        isReceiptView={true}
      />
    );
  }

  if (selectedExpense) {
    return (
      <SubWarehouseExpenseDetailScreen
        expenseId={selectedExpense.id}
        amount={selectedExpense.amount}
        category={selectedExpense.categoryRef.split('·')[0]?.trim() || 'Transport'}
        date="25 Sep 2026"
        description="Transport from Coonoor collection point to warehouse"
        paymentMethod="Cash"
        vendorPayee="Coonoor Transport Co."
        warehouse="Coonoor"
        createdBy="SWA – Suresh"
        status={selectedExpense.status}
        onBack={() => setSelectedExpense(null)}
        onTabChange={onTabChange}
        onEdit={() => {
          setSelectedExpense(null);
          setShowAddExpenseScreen(true);
        }}
        onViewReceipt={() => setShowReceiptScreen(true)}
      />
    );
  }

  if (showAddExpenseScreen) {
    return (
      <SubWarehouseAddExpenseScreen
        onBack={() => setShowAddExpenseScreen(false)}
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
        initialExpense={{
          expenseId: 'EXP-001245',
          amount: '2400',
          category: 'Transport',
          date: '25 Sep 2026',
          description: 'Transport from Coonoor collection point to warehouse',
          paymentMethod: 'Cash',
          vendorPayee: 'Coonoor Transport Co.'
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

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
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Expenses</Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddNewExpense}
            activeOpacity={0.75}
          >
            <PlusCircleIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Coonoor Warehouse Pill */}
        <View style={styles.warehousePillRow}>
          <View style={styles.warehousePill}>
            <LockIcon size={11} color="#FFFFFF" />
            <Text style={styles.warehousePillText}>Coonoor Warehouse</Text>
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
          {/* Row 1: TODAY'S EXPENSES & THIS MONTH */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TODAY'S EXPENSES</Text>
              <Text style={styles.kpiValue}>₹6,420</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>THIS MONTH</Text>
              <Text style={styles.kpiValue}>₹1,48,600</Text>
            </View>
          </View>

          {/* Row 2: PENDING & APPROVED */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>PENDING</Text>
              <Text style={styles.kpiValue}>8</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>APPROVED</Text>
              <Text style={styles.kpiValue}>42</Text>
            </View>
          </View>
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
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Transport</Text>
              <Text style={styles.tableValue}>₹32,500</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Loading</Text>
              <Text style={styles.tableValue}>₹18,400</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Unloading</Text>
              <Text style={styles.tableValue}>₹12,600</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Maintenance</Text>
              <Text style={styles.tableValue}>₹8,200</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Utilities</Text>
              <Text style={styles.tableValue}>₹5,500</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Other</Text>
              <Text style={styles.tableValue}>₹3,400</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ─── Search & Filter Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Expense ID, Voucher, Vendor..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          <TouchableOpacity
            onPress={() => Alert.alert('Filters', 'Open advanced filter options')}
            activeOpacity={0.7}
          >
            <FilterSlidersIcon size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* ─── Expense Records List ─── */}
        <View style={styles.cardsList}>
          {filteredRecords.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.recordCard}
              onPress={() => setSelectedExpense(item)}
              activeOpacity={0.75}
            >
              {/* Header: ID + Status Badge */}
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordId}>{item.id}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'Approved'
                      ? { backgroundColor: PALETTE.greenBg }
                      : item.status === 'Pending'
                      ? { backgroundColor: PALETTE.amberBg }
                      : { backgroundColor: '#FDEEE9' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.status === 'Approved'
                        ? { color: PALETTE.greenText }
                        : item.status === 'Pending'
                        ? { color: PALETTE.amberText }
                        : { color: '#8B5E3C' },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Subtitle: Category & Destination */}
              <Text style={styles.recordCategoryRef}>{item.categoryRef}</Text>

              {/* Amount (Red font for expenses) */}
              <Text style={styles.recordAmount}>₹{item.amount.toLocaleString()}</Text>

              {/* Date & Time */}
              <Text style={styles.recordTimestamp}>{item.timestamp}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePillRow: {
    marginLeft: 36,
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehousePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // ─── 2x2 KPI Grid ───
  kpiGrid: {
    gap: 10,
    marginBottom: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#5C544E',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textDark,
  },

  // ─── Blue Callout ───
  blueCallout: {
    backgroundColor: PALETTE.blueBg,
    borderWidth: 1,
    borderColor: PALETTE.blueBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  blueCalloutText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.blueText,
    lineHeight: 16,
  },

  // ─── Sections & Tables ───
  sectionWrap: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  breakdownCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  tableLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textDark,
  },
  tableValue: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textDark,
  },
  tableDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },

  // ─── Search Bar ───
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: PALETTE.textDark,
    padding: 0,
    margin: 0,
  },

  // ─── Records List ───
  cardsList: {
    gap: 12,
  },
  recordCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  recordHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recordId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8B5E3C',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recordCategoryRef: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textDark,
    marginBottom: 8,
  },
  recordAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.red,
    marginBottom: 4,
  },
  recordTimestamp: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.textMuted,
  },

  // ─── Footer ───
  screenFooterCode: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginVertical: 4,
  },

  // ─── Bottom Navigation ───
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingBottom: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 60,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
