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
import type { FinanceHistoryItem, WarehouseScreenBaseProps, WarehouseTab } from './types';

const SAMPLE_HISTORY: FinanceHistoryItem[] = [
  { id: 'REV-000845', type: 'Revenue', title: 'Market Sale', amount: 3450, time: '11:20 AM' },
  { id: 'EXP-001245', type: 'Expense', title: 'Transport', amount: 2400, time: '09:32 AM' },
  { id: 'REV-000844', type: 'Revenue', title: 'B2B Sale · Taj Hotel', amount: 14500, time: '08:45 AM' },
  { id: 'EXP-001244', type: 'Expense', title: 'Loading / Unloading', amount: 1800, time: '08:15 AM' },
  { id: 'REV-000843', type: 'Revenue', title: 'Horeca Order · Café Customer', amount: 6900, time: '24 Sep · 06:10 PM' },
  { id: 'EXP-001238', type: 'Expense', title: 'Generator Diesel & Power', amount: 620, time: '24 Sep · 02:30 PM' },
];

export interface FinanceHistoryScreenProps extends WarehouseScreenBaseProps {
  onSelectItem?: ((item: FinanceHistoryItem) => void) | undefined;
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
}: FinanceHistoryScreenProps) {
  const [filterTab, setFilterTab] = useState<'All' | 'Revenue' | 'Expenses'>('All');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredHistory = SAMPLE_HISTORY.filter((item) => {
    if (item.type === 'Revenue' && !canSeeRevenue) return false;
    if (item.type === 'Expense' && !canSeeExpense) return false;
    if (effectiveFilter === 'Revenue' && item.type !== 'Revenue') return false;
    if (effectiveFilter === 'Expenses' && item.type !== 'Expense') return false;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      item.id.toLowerCase().includes(query) ||
      item.title.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query)
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
            <Text style={styles.headerSubtitle}>{warehouseLabel}</Text>
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

            {/* ─── Filter Pills ─── */}
            {canSeeBoth && (
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
                onPress={() => Alert.alert('Filters', 'Advanced filter options')}
                activeOpacity={0.7}
              >
                <FilterSlidersIcon size={18} color={adminColors.muted} />
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
                      <Text style={styles.txTime}>{item.time}</Text>
                    </View>
                  </TouchableOpacity>

                  {index < filteredHistory.length - 1 && <View style={styles.rowDivider} />}
                </React.Fragment>
              ))}
            </View>

            {/* ─── Pagination Info Callout ─── */}
            <View style={styles.infoCallout}>
              <Text style={styles.infoCalloutText}>
                Large histories are paginated server-side rather than loaded all at once.
              </Text>
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTab} onPress={() => handleTabPress('Home')} activeOpacity={0.7}>
          <HomeTabIcon active={false} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTab} onPress={() => handleTabPress('Receiving')} activeOpacity={0.7}>
          <ReceivingTabIcon active={false} />
          <Text style={styles.navLabel}>Receiving</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTab} onPress={() => handleTabPress('Inventory')} activeOpacity={0.7}>
          <InventoryTabIcon active={false} />
          <Text style={styles.navLabel}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navTab} onPress={() => handleTabPress('More')} activeOpacity={0.7}>
          <MoreTabIcon active />
          <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
        </TouchableOpacity>
      </View>
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
});
