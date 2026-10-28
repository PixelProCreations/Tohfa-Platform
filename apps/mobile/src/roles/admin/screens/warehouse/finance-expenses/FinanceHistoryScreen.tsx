/**
 * Finance History: revenue and expense transactions in one list.
 *
 * Serves both Main Warehouse admins (scope.warehouseId undefined = all
 * warehouses) and Sub Warehouse admins (one warehouse). What a viewer sees is
 * gated by docs/rbac.json codes through `can`: Revenue rows need
 * 'finance.sales_income.view', Expense rows need 'finance.expense.log'. A viewer
 * holding neither gets an empty state. This is presentation only; the server
 * re-checks every code and scope (CLAUDE.md 2.1).
 */
import React, { useState } from 'react';
import {
  Alert,
  Modal,
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
import { useExpenses, useRevenueList } from './useFinanceData';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import type { FinanceHistoryItem, WarehouseScreenBaseProps, WarehouseTab } from './types';

export interface FinanceHistoryScreenProps extends WarehouseScreenBaseProps {
  onSelectItem?: ((item: FinanceHistoryItem) => void) | undefined;
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
      <Path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function TrendUpIcon({ size = 18, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6l-9.5 9.5-5-5L1 18"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M17 6h6v6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TruckIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// ─── Bottom Tab Icons ────────────────────────────────────────────────────────

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
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

// ─── Main Component ──────────────────────────────────────────────────────────

export function FinanceHistoryScreen({
  scope,
  can,
  onBack,
  onTabChange,
  onSelectItem,
  initialWarehouseId,
  hideWarehouseFilter = false,
}: FinanceHistoryScreenProps) {
  const isMain = scope.warehouseId === undefined;

  const [filterTab, setFilterTab] = useState<'All' | 'Revenue' | 'Expenses'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(initialWarehouseId);
  const [selectedType, setSelectedType] = useState<'All' | 'Revenue' | 'Expenses'>('All');
  const [appliedStatus, setAppliedStatus] = useState<string>('All');
  const [appliedPaymentMethod, setAppliedPaymentMethod] = useState<string>('All');

  // Filter Modal State
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempWarehouseId, setTempWarehouseId] = useState<string | undefined>(undefined);
  const [tempType, setTempType] = useState<'All' | 'Revenue' | 'Expenses'>('All');
  const [tempStatus, setTempStatus] = useState<string>('All');
  const [tempPaymentMethod, setTempPaymentMethod] = useState<string>('All');

  const effectiveWarehouseId = isMain
    ? (selectedWarehouseId && selectedWarehouseId !== 'All' ? selectedWarehouseId : undefined)
    : scope.warehouseId;
  const { expenses } = useExpenses({ warehouseId: effectiveWarehouseId });
  const { revenueRecords } = useRevenueList({});
  const { options: liveWarehouseOptions } = useWarehouseOptions();

  const liveExpenseHistory: FinanceHistoryItem[] = expenses.map((e) => ({
    id: e.id,
    type: 'Expense',
    title: e.categoryRef.split('·')[0]?.trim() || 'Expense',
    amount: e.amount,
    time: e.timestamp,
    warehouseId: e.warehouseId,
    warehouseName: e.warehouseName,
  }));

  const liveRevenueHistory: FinanceHistoryItem[] = revenueRecords.map((r) => ({
    id: r.id,
    type: 'Revenue',
    title: r.orderRef,
    amount: r.amount,
    time: r.timestamp,
    warehouseId: r.warehouseId,
    warehouseName: r.warehouseName,
  }));

  const liveHistory = [...liveExpenseHistory, ...liveRevenueHistory];
  const historySource = liveHistory;

  const canSeeRevenue = can('finance.sales_income.view');
  const canSeeExpense = can('finance.expense.log');
  const canSeeAny = canSeeRevenue || canSeeExpense;
  const canSeeBoth = canSeeRevenue && canSeeExpense;
  const warehouseLabel = scope.warehouseId === undefined ? 'All Warehouses' : (scope.warehouseName ?? '');

  // A filter chip for a type the viewer cannot see would be a dead control, and
  // with a single visible type "All" is that type, so the chips only appear
  // when there is something to choose between.
  const effectiveFilter = canSeeBoth ? filterTab : 'All';

  const handleTabPress = (tab: WarehouseTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      onBack();
    }
  };

  const filteredHistory = historySource.filter((item) => {
    if (item.type === 'Revenue' && !canSeeRevenue) return false;
    if (item.type === 'Expense' && !canSeeExpense) return false;
    const filterToUse = isMain ? selectedType : effectiveFilter;
    if (filterToUse === 'Revenue' && item.type !== 'Revenue') return false;
    if (filterToUse === 'Expenses' && item.type !== 'Expense') return false;
    if (isMain && selectedWarehouseId !== undefined && item.warehouseId !== selectedWarehouseId) return false;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      item.id.toLowerCase().includes(query) ||
      item.title.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query) ||
      (item.warehouseName && item.warehouseName.toLowerCase().includes(query))
    );
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Finance History</Text>
            {!isMain && <Text style={styles.headerSubtitle}>{warehouseLabel}</Text>}
          </View>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!canSeeAny ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              You do not have access to revenue or expense history.
            </Text>
          </View>
        ) : (
          <>
            {/* ─── Top Net Summary Card ─── */}
            <View style={styles.summaryCard}>
              {canSeeRevenue && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Revenue</Text>
                  <Text style={styles.revenueValue}>₹24,850</Text>
                </View>
              )}

              {canSeeBoth && <View style={styles.divider} />}

              {canSeeExpense && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Expenses</Text>
                  <Text style={styles.expensesValue}>₹6,420</Text>
                </View>
              )}

              {/* Net needs both sides, so it is only shown to a viewer who can see both. */}
              {canSeeBoth && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Net</Text>
                    <Text style={styles.netValue}>₹18,430</Text>
                  </View>
                </>
              )}
            </View>

            {/* ─── Filter Pills (Subwarehouse only - Main uses Filter modal) ─── */}
            {canSeeBoth && !isMain && (
              <View style={styles.filterPillsRow}>
                {(['All', 'Revenue', 'Expenses'] as const).map((tab) => {
                  const isActive = filterTab === tab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.filterPill, isActive && styles.filterPillActive]}
                      onPress={() => setFilterTab(tab)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                        {tab}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* ─── Search & Filter Bar ─── */}
            <View style={styles.searchBar}>
              <SearchIcon size={18} color={adminColors.placeholder} />
              <TextInput
                style={styles.searchInput}
                placeholder="Transaction, Voucher, Invoice, Order..."
                placeholderTextColor={adminColors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              <TouchableOpacity
                onPress={() => {
                  setTempWarehouseId(selectedWarehouseId);
                  setTempType(selectedType);
                  setTempStatus(appliedStatus);
                  setTempPaymentMethod(appliedPaymentMethod);
                  setShowFilterModal(true);
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FilterSlidersIcon
                  size={18}
                  color={
                    selectedWarehouseId !== undefined || selectedType !== 'All'
                      ? adminColors.brand
                      : adminColors.muted
                  }
                />
              </TouchableOpacity>
            </View>

            {/* ─── Transactions List Card ─── */}
            <View style={styles.cardContainer}>
              {filteredHistory.length === 0 && (
                <Text style={styles.emptyText}>No transactions found.</Text>
              )}
              {filteredHistory.map((item, index) => (
                <React.Fragment key={item.id}>
                  <TouchableOpacity
                    style={styles.txRow}
                    onPress={() => {
                      if (onSelectItem) {
                        onSelectItem(item);
                      } else {
                        Alert.alert(
                          item.id,
                          `Transaction: ${item.id}\nType: ${item.type}\nTitle: ${item.title}\nAmount: ₹${item.amount.toLocaleString()}\nTime: ${item.time}`
                        );
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Left Icon */}
                    <View
                      style={[
                        styles.iconBox,
                        item.type === 'Revenue'
                          ? { backgroundColor: adminColors.success.bg }
                          : { backgroundColor: adminColors.brandTint },
                      ]}
                    >
                      {item.type === 'Revenue' ? (
                        <TrendUpIcon size={18} color={adminColors.success.text} />
                      ) : (
                        <TruckIcon size={18} color={adminColors.brandDeep} />
                      )}
                    </View>

                    {/* Text Col */}
                    <View style={styles.textCol}>
                      <Text style={styles.txId}>{item.id}</Text>
                      <Text style={styles.txTitle}>{item.title}</Text>
                    </View>

                    {/* Amount Col */}
                    <View style={styles.amountCol}>
                      <Text
                        style={[
                          styles.txAmount,
                          item.type === 'Revenue'
                            ? { color: adminColors.success.text }
                            : { color: adminColors.danger.text },
                        ]}
                      >
                        {item.type === 'Revenue' ? `+₹${item.amount.toLocaleString()}` : `-₹${item.amount.toLocaleString()}`}
                      </Text>
                      <Text style={styles.txTime}>
                        {item.time}
                        {isMain && item.warehouseName ? ` · ${item.warehouseName}` : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {index < filteredHistory.length - 1 && <View style={styles.rowDivider} />}
                </React.Fragment>
              ))}
            </View>

            {/* ─── Pagination Info Callout (Subwarehouse only) ─── */}
            {!isMain && (
              <View style={styles.infoCallout}>
                <Text style={styles.infoCalloutText}>
                  Large histories are paginated server-side rather than loaded all at once.
                </Text>
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>



      {/* ─── Filter Full Screen Modal ─── */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <SafeAreaView style={styles.fullScreenFilterModal}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

          {/* Top Orange Header */}
          <View style={styles.filterModalHeader}>
            <TouchableOpacity
              onPress={() => setShowFilterModal(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowBackIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.filterModalTitle}>Filter History</Text>
            <TouchableOpacity
              onPress={() => setShowFilterModal(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.filterCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.filterModalScroll}
            contentContainerStyle={styles.filterModalScrollContent}
          >
            {/* Section 1: Warehouse (only for Main Warehouse when not fixed from hub) */}
            {isMain && !hideWarehouseFilter ? (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Warehouse</Text>
                <View style={styles.chipWrap}>
                  <TouchableOpacity
                    style={[styles.filterChip, tempWarehouseId === undefined && styles.filterChipActive]}
                    onPress={() => setTempWarehouseId(undefined)}
                  >
                    <Text style={[styles.filterChipText, tempWarehouseId === undefined && styles.filterChipTextActive]}>
                      All Warehouses
                    </Text>
                  </TouchableOpacity>
                  {liveWarehouseOptions.map((wh) => {
                    const active = tempWarehouseId === wh.warehouseId;
                    return (
                      <TouchableOpacity
                        key={wh.warehouseId}
                        style={[styles.filterChip, active && styles.filterChipActive]}
                        onPress={() => setTempWarehouseId(wh.warehouseId)}
                      >
                        <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                          {wh.warehouseName ?? wh.warehouseId}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Section 2: Type (All, Revenue, Expenses) */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Transaction Type</Text>
              <View style={styles.chipWrap}>
                {(['All', 'Revenue', 'Expenses'] as const).map((t) => {
                  const active = tempType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setTempType(t)}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 3: Status */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              <View style={styles.chipWrap}>
                {['All', 'Completed', 'Pending'].map((st) => {
                  const active = tempStatus === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setTempStatus(st)}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{st}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 4: Payment Method */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Payment Method</Text>
              <View style={styles.chipWrap}>
                {['All', 'Wallet', 'UPI', 'Cash', 'Bank Transfer'].map((pm) => {
                  const active = tempPaymentMethod === pm;
                  return (
                    <TouchableOpacity
                      key={pm}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setTempPaymentMethod(pm)}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{pm}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer Buttons */}
          <View style={styles.filterFooter}>
            <TouchableOpacity
              style={styles.modalApplyBtn}
              onPress={() => {
                setSelectedWarehouseId(tempWarehouseId);
                setSelectedType(tempType);
                setAppliedStatus(tempStatus);
                setAppliedPaymentMethod(tempPaymentMethod);
                setShowFilterModal(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalApplyBtnText}>Apply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalResetBtn}
              onPress={() => {
                setTempWarehouseId(undefined);
                setTempType('All');
                setTempStatus('All');
                setTempPaymentMethod('All');
                setSelectedWarehouseId(undefined);
                setSelectedType('All');
                setAppliedStatus('All');
                setAppliedPaymentMethod('All');
                setShowFilterModal(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalResetBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.input,
    paddingTop: 10,
    paddingBottom: adminSpacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: adminSpacing.md,
    padding: 2,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.onBrand,
    marginTop: 2,
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
  bottomSpacer: {
    height: adminSpacing.input,
  },

  // Top Summary Card
  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  summaryLabel: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  revenueValue: {
    ...adminType.sectionHead,
    color: adminColors.success.text,
  },
  expensesValue: {
    ...adminType.sectionHead,
    color: adminColors.danger.text,
  },
  netValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 10,
  },

  // Filter Pills
  filterPillsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  filterPill: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 7,
  },
  filterPillActive: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
  },
  filterPillText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  filterPillTextActive: {
    color: adminColors.brandDeep,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    marginBottom: adminSpacing.lg,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },

  // Empty state
  emptyCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
  },
  emptyText: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
    padding: adminSpacing.md,
  },

  // Transactions Card Container
  cardContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.xs,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  textCol: {
    flex: 1,
  },
  txId: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  txTitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  txAmount: {
    ...adminType.sectionHead,
  },
  txTime: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginHorizontal: adminSpacing.lg,
  },

  // Info Callout (pagination note)
  infoCallout: {
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    marginBottom: adminSpacing.lg,
  },
  infoCalloutText: {
    ...adminType.rowMeta,
    color: adminColors.info.text,
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
    ...adminShadow.sm,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  navLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 3,
  },
  navLabelActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },

  // Filter Full Screen Modal Styles
  fullScreenFilterModal: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  filterModalHeader: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 14,
  },
  filterModalTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  filterCloseText: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  filterModalScroll: {
    flex: 1,
  },
  filterModalScrollContent: {
    padding: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  filterSection: {
    marginBottom: adminSpacing.lg,
  },
  filterSectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
    textTransform: 'uppercase',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterChipActive: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  filterFooter: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  modalApplyBtn: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  modalResetBtn: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalResetBtnText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
});
