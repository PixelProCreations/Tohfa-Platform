// Design id: M11-S02
/**
 * Revenue: the sales-income list, read-only. Serves both warehouse roles (it
 * was SubWarehouseRevenueScreen and absorbs MainWarehouseRevenueScreen).
 *
 * Scope (finance.sales_income.view: MAIN all, SUB own):
 * - Sub scope: locked to own warehouse, showing Subwarehouse Revenue screen as is.
 * - Main scope: displays aggregated details from all subwarehouses by default.
 *   Each record displays the warehouse name when All Warehouses is selected.
 *   After selecting a warehouse filter, only that warehouse's rows appear and
 *   the individual warehouse name is hidden from cards.
 *   Search bar features a filter icon with warehouse, category, status, and payment options.
 */
import React, { useState } from 'react';
import {
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
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  ChipGroup,
  EmptyState,
  inScope,
  isAllWarehouses,
  KpiRow,
  ScopeHeader,
  SearchIcon,
  SlidersIcon,
  StatusBadge,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { WarehouseSelector } from '../inventory';
import { FINANCE_CODES, FinanceNotAvailable, scopeLabel } from './FinanceParts';
import { formatPaiseOrDash } from './mappers';
import { formatPaise } from '../../../money/paise';
import { RevenueDetailScreen } from './RevenueDetailScreen';
import { useRevenueList } from './useFinanceData';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import type { RevenueRecord, WarehouseScope, WarehouseScreenBaseProps } from './types';

const CATEGORY_FILTERS = ['All', 'Orders', 'Direct Sales', 'Other'] as const;
type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

const STATUS_FILTERS = ['All', 'Completed', 'Pending'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const PAYMENT_FILTERS = ['All', 'Wallet', 'UPI', 'Cash', 'Bank Transfer'] as const;
type PaymentFilter = (typeof PAYMENT_FILTERS)[number];

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface RevenueScreenProps extends WarehouseScreenBaseProps {
  records?: readonly RevenueRecord[] | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Open a record. Without it the record opens inside this screen (Main's embedded detail). */
  onSelectRevenue?: ((record: RevenueRecord) => void) | undefined;
  onViewOrder?: (() => void) | undefined;
  onViewInvoice?: (() => void) | undefined;
  initialWarehouseId?: string | undefined;
  hideWarehouseFilter?: boolean | undefined;
}

/** A list row as revenue-detail props. */
export function revenueDetailOf(record: RevenueRecord) {
  return {
    revenueId: record.id,
    finalAmount: formatPaiseOrDash(record.amountPaise),
    paymentMethod: record.paymentMethod,
    paymentStatus: record.status,
    salesChannel: record.orderRef.split('·')[0]?.trim(),
    transactionDate: record.timestamp,
    warehouseName: record.warehouseName,
  };
}

export function RevenueScreen({
  scope,
  can,
  onBack,
  onTabChange,
  records: initialRecords,
  warehouseOptions: initialWarehouseOptions,
  onSelectRevenue,
  onViewOrder,
  onViewInvoice,
  initialWarehouseId,
  hideWarehouseFilter = false,
}: RevenueScreenProps) {
  const isMain = isAllWarehouses(scope);
  const { options: liveWarehouseOptions } = useWarehouseOptions();
  const warehouseOptions = initialWarehouseOptions ?? liveWarehouseOptions;
  const { revenueRecords: liveRevenues } = useRevenueList({});
  const records = initialRecords ?? liveRevenues;

  const [selectedFilter, setSelectedFilter] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(initialWarehouseId);
  const [appliedStatus, setAppliedStatus] = useState<StatusFilter>('All');
  const [appliedPaymentMethod, setAppliedPaymentMethod] = useState<PaymentFilter>('All');
  const [openRecord, setOpenRecord] = useState<RevenueRecord | null>(null);

  // Filter Modal States
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempWarehouseId, setTempWarehouseId] = useState<string | undefined>(undefined);
  const [tempCategory, setTempCategory] = useState<CategoryFilter>('All');
  const [tempStatus, setTempStatus] = useState<StatusFilter>('All');
  const [tempPaymentMethod, setTempPaymentMethod] = useState<PaymentFilter>('All');

  if (!can(FINANCE_CODES.salesIncome)) {
    return <FinanceNotAvailable title="Revenue" message="Your role does not include sales income." onBack={onBack} />;
  }

  if (openRecord) {
    return (
      <RevenueDetailScreen
        scope={scope}
        can={can}
        onBack={() => setOpenRecord(null)}
        onTabChange={onTabChange}
        onViewOrder={onViewOrder}
        onViewInvoice={onViewInvoice}
        {...revenueDetailOf(openRecord)}
      />
    );
  }

  const query = searchQuery.trim().toLowerCase();
  const visible = records.filter((rec) => {
    if (isMain) {
      if (selectedWarehouseId && selectedWarehouseId !== 'All') {
        if (rec.warehouseId !== selectedWarehouseId && rec.warehouseName !== selectedWarehouseId) {
          return false;
        }
      }
    } else {
      if (!inScope(scope, rec.warehouseId, selectedWarehouseId)) {
        return false;
      }
    }
    if (selectedFilter !== 'All' && rec.category !== selectedFilter) return false;
    if (appliedStatus !== 'All' && rec.status !== appliedStatus) return false;
    if (appliedPaymentMethod !== 'All' && rec.paymentMethod !== appliedPaymentMethod) return false;
    return (
      !query ||
      rec.id.toLowerCase().includes(query) ||
      rec.orderRef.toLowerCase().includes(query) ||
      rec.paymentMethod.toLowerCase().includes(query) ||
      (rec.warehouseName && rec.warehouseName.toLowerCase().includes(query))
    );
  });

  const openRevenue = (record: RevenueRecord) => {
    if (onSelectRevenue) onSelectRevenue(record);
    else setOpenRecord(record);
  };

  // Aggregated KPIs when All Warehouses is active, or calculated for filtered warehouse
  const totalAmount = visible.reduce((sum, r) => sum + (r.amountPaise ?? 0), 0);
  const onlineOrderAmount = visible.filter((r) => r.category === 'Orders').reduce((sum, r) => sum + (r.amountPaise ?? 0), 0);
  const marketSalesAmount = visible.filter((r) => r.category === 'Direct Sales').reduce((sum, r) => sum + (r.amountPaise ?? 0), 0);

  const displayTotalRevenue = formatPaise(totalAmount);
  const displayTodayRevenue = formatPaise(totalAmount);
  const displayOnlineOrder = formatPaise(onlineOrderAmount);
  const displayMarketSales = formatPaise(marketSalesAmount);


  const hasActiveFilters =
    (isMain && selectedWarehouseId !== undefined) ||
    selectedFilter !== 'All' ||
    appliedStatus !== 'All' ||
    appliedPaymentMethod !== 'All';

  return (
    <WalletScreen
      title="Revenue"
      onBack={onBack}
      headerExtra={
        isMain ? (
          hideWarehouseFilter ? undefined : (
            <WarehouseSelector
              scope={scope}
              options={warehouseOptions}
              selectedId={selectedWarehouseId}
              onSelect={setSelectedWarehouseId}
            />
          )
        ) : (
          <ScopeHeader
            scope={scope}
            label={`${scopeLabel(scope)} · Today`}
            warehouseOptions={warehouseOptions}
            selectedWarehouseId={selectedWarehouseId}
            onSelectWarehouse={setSelectedWarehouseId}
          />
        )
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI Cards */}
        <KpiRow
          items={[
            { label: 'TOTAL REVENUE', value: displayTotalRevenue },
            { label: "TODAY'S REVENUE", value: displayTodayRevenue },
          ]}
        />
        <KpiRow
          items={[
            { label: 'ONLINE / ORDER', value: displayOnlineOrder },
            { label: 'MARKET SALES', value: displayMarketSales },
          ]}
        />



        {/* Category Filter Pills (Subwarehouse only - Main uses the full screen filter) */}
        {!isMain && (
          <View style={styles.filters}>
            <ChipGroup options={CATEGORY_FILTERS} value={selectedFilter} onChange={setSelectedFilter} />
          </View>
        )}

        {/* Search Bar with Filter Icon */}
        <View style={styles.searchBar}>
          <SearchIcon color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Revenue ID, Order ID, Invoice or Customer"
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => {
              setTempWarehouseId(selectedWarehouseId);
              setTempCategory(selectedFilter);
              setTempStatus(appliedStatus);
              setTempPaymentMethod(appliedPaymentMethod);
              setShowFilterModal(true);
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Filter options"
          >
            <SlidersIcon color={hasActiveFilters ? adminColors.brand : adminColors.muted} />
          </TouchableOpacity>
        </View>

        {/* Records List */}
        {visible.length === 0 ? (
          <EmptyState title="No revenue found" subtitle="Try a different search or filter criteria." />
        ) : (
          <View style={styles.list}>
            {visible.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => openRevenue(item)}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.recordId}>{item.id}</Text>
                  <StatusBadge label={item.status} tone={item.status === 'Completed' ? 'success' : 'warning'} />
                </View>
                <Text style={styles.orderRef}>{item.orderRef}</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.amount}>{formatPaise(item.amountPaise ?? 0)}</Text>
                  <Text style={styles.meta}>{item.paymentMethod}</Text>
                </View>
                <Text style={styles.meta}>
                  {item.timestamp}
                  {isMain && item.warehouseName ? ` · ${item.warehouseName}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Filter Full Screen Modal */}
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
              <BackArrowIcon />
            </TouchableOpacity>
            <Text style={styles.filterModalTitle}>Filter Revenue</Text>
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
                  {warehouseOptions.map((wh) => {
                    if (wh.warehouseId === undefined) return null;
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

            {/* Section 2: Channel / Category */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Channel / Category</Text>
              <View style={styles.chipWrap}>
                {CATEGORY_FILTERS.map((cat) => {
                  const active = tempCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.filterChip, active && styles.filterChipActive]}
                      onPress={() => setTempCategory(cat)}
                    >
                      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Section 3: Status */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              <View style={styles.chipWrap}>
                {STATUS_FILTERS.map((st) => {
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
                {PAYMENT_FILTERS.map((pm) => {
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
                setSelectedFilter(tempCategory);
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
                setTempCategory('All');
                setTempStatus('All');
                setTempPaymentMethod('All');
                setSelectedWarehouseId(undefined);
                setSelectedFilter('All');
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
    </WalletScreen>
  );
}

const styles = StyleSheet.create({

  filters: { marginBottom: adminSpacing.md },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    marginBottom: adminSpacing.md,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    marginLeft: adminSpacing.sm,
    paddingVertical: 0,
  },
  filterBtn: {
    padding: adminSpacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },

  list: { gap: adminSpacing.md },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    gap: adminSpacing.xs,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recordId: { ...adminType.rowTitle, color: adminColors.brandDeep },
  orderRef: { ...adminType.body, color: adminColors.ink },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amount: { ...adminType.sectionHead, color: adminColors.success.text },
  meta: { ...adminType.rowMeta, color: adminColors.muted },

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
