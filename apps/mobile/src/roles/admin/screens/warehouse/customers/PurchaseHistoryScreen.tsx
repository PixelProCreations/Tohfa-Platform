/**
 * Purchase History: unified RBAC screen for both:
 *   1. Customer Invoiced Purchase History (Warehouse Main/Sub — gated by `customer.list.view` & `scope`).
 *   2. Farmer Procurement Purchase History (Farmer Admin — gated by `purchase.order.view` when `onViewOrder` is passed).
 *
 * Absorbs `screens/dashboard/PurchaseHistoryScreen.tsx` so both modes share one themed, RBAC-gated screen.
 */
// Design id: M7-S04
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

import { BackArrowIcon, CloseIcon, FilterSlidersIcon, SearchIcon } from '../../../components/AdminIcons';
import { t } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import {
  cardStyles,
  CustomersScreen,
  EmptyState,
  FilterIcon,
  HeaderIconButton,
  isAllWarehouses,
  SearchField,
  StatTiles,
  StatusBadge,
} from './CustomersParts';
import { DEFAULT_CUSTOMER, INITIAL_PURCHASES, PURCHASE_KPIS } from './fixtures';
import type {
  CustomerRef,
  PurchaseFilterState,
  PurchaseRecord,
  WarehouseScope,
  WarehouseScreenBaseProps,
} from './types';

export interface HistoryOrderItem {
  id: string;
  farmer: string;
  produce: string;
  quantity: string;
  total: string;
  collectionDate: string;
  status: 'Completed';
}

const SAMPLE_HISTORY: HistoryOrderItem[] = [
  {
    id: 'PO-2026-00108',
    farmer: 'Kumar',
    produce: 'Tomato',
    quantity: '25 kg',
    total: '₹2,500',
    collectionDate: '28 Sep 2026',
    status: 'Completed',
  },
  {
    id: 'PO-2026-00097',
    farmer: 'Selvi',
    produce: 'Beans',
    quantity: '40 kg',
    total: '₹3,400',
    collectionDate: '25 Sep 2026',
    status: 'Completed',
  },
  {
    id: 'PO-2026-00084',
    farmer: 'Ramesh Kumar',
    produce: 'Carrot',
    quantity: '50 kg',
    total: '₹2,250',
    collectionDate: '22 Sep 2026',
    status: 'Completed',
  },
];

export interface PurchaseHistoryScreenProps extends Partial<WarehouseScreenBaseProps> {
  onBack: () => void;
  scope?: WarehouseScope | undefined;
  can?: Can | undefined;
  customer?: CustomerRef | undefined;
  appliedFilters?: PurchaseFilterState | undefined;
  onOpenFilters?: (() => void) | undefined;
  onSelectPurchase?: ((purchase: PurchaseRecord) => void) | undefined;
  purchases?: readonly PurchaseRecord[] | undefined;
  /** Farmer procurement mode: callback when tapping a completed procurement PO. */
  onViewOrder?: ((orderId: string) => void) | undefined;
}

function amountOf(p: PurchaseRecord): number {
  return parseInt(p.amount.replace(/[^0-9]/g, ''), 10) || 0;
}

function hasActiveFilters(f: PurchaseFilterState | undefined): boolean {
  if (!f) return false;
  return (
    f.purchaseStatus !== 'All' ||
    f.grade !== 'All' ||
    f.datePreset !== 'All Time' ||
    f.sortBy !== 'Newest First' ||
    f.productCrop !== '' ||
    f.searchQuery !== ''
  );
}

export function PurchaseHistoryScreen({
  scope,
  can,
  onBack,
  customer,
  appliedFilters,
  onOpenFilters,
  onSelectPurchase,
  purchases = INITIAL_PURCHASES,
  onViewOrder,
}: PurchaseHistoryScreenProps) {
  const isProcurementMode = Boolean(onViewOrder) && !customer && !onSelectPurchase;

  if (isProcurementMode && onViewOrder) {
    return <ProcurementPurchaseHistory can={can} onBack={onBack} onViewOrder={onViewOrder} />;
  }

  return (
    <CustomerPurchaseHistory
      scope={scope}
      can={can}
      onBack={onBack}
      customer={customer}
      appliedFilters={appliedFilters}
      onOpenFilters={onOpenFilters}
      onSelectPurchase={onSelectPurchase}
      purchases={purchases}
    />
  );
}

function CustomerPurchaseHistory({
  scope,
  can,
  onBack,
  customer,
  appliedFilters,
  onOpenFilters,
  onSelectPurchase,
  purchases = INITIAL_PURCHASES,
}: Omit<PurchaseHistoryScreenProps, 'onViewOrder'>) {
  const [searchQuery, setSearchQuery] = useState('');
  const allWarehouses = scope ? isAllWarehouses(scope) : false;
  const canViewCustomer = can ? can('customer.list.view') : true;
  const customerName = customer?.name ?? DEFAULT_CUSTOMER.name;

  const query = (searchQuery || appliedFilters?.searchQuery || '').trim().toLowerCase();
  const crop = appliedFilters?.productCrop.trim().toLowerCase() ?? '';
  const sortBy = appliedFilters?.sortBy ?? 'Newest First';

  const rows = purchases
    .filter((p) => {
      if (appliedFilters && appliedFilters.purchaseStatus !== 'All' && p.status !== appliedFilters.purchaseStatus) return false;
      if (appliedFilters && appliedFilters.grade !== 'All' && !p.itemsSummary.toLowerCase().includes(appliedFilters.grade.toLowerCase())) {
        return false;
      }
      if (crop && !p.itemsSummary.toLowerCase().includes(crop)) return false;
      if (!query) return true;
      return (
        p.invoiceNo.toLowerCase().includes(query) ||
        p.itemsSummary.toLowerCase().includes(query) ||
        p.dateText.toLowerCase().includes(query) ||
        (p.orderNo ?? '').toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'Oldest First') return b.id.localeCompare(a.id);
      if (sortBy === 'Highest Amount') return amountOf(b) - amountOf(a);
      if (sortBy === 'Lowest Amount') return amountOf(a) - amountOf(b);
      return a.id.localeCompare(b.id);
    });

  return (
    <CustomersScreen
      title="Purchase History"
      subtitle={customerName}
      onBack={onBack}
      headerRight={
        <HeaderIconButton label="Filter purchases" onPress={onOpenFilters} showDot={hasActiveFilters(appliedFilters)}>
          <FilterIcon />
        </HeaderIconButton>
      }
    >
      <StatTiles items={PURCHASE_KPIS} />
      <SearchField
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search product, order ID or invoice"
        onFilterPress={onOpenFilters}
      />

      {!canViewCustomer ? (
        <EmptyState title="No purchases available" subtitle="Customer purchase history requires customer view permission." />
      ) : rows.length === 0 ? (
        <EmptyState title="No purchases found" subtitle="Try adjusting your search query or filters." />
      ) : (
        rows.map((purchase) => (
          <TouchableOpacity
            key={purchase.id}
            style={cardStyles.card}
            activeOpacity={0.8}
            onPress={() => onSelectPurchase?.(purchase)}
            accessibilityRole="button"
          >
            <View style={cardStyles.rowBetween}>
              <Text style={cardStyles.code}>{purchase.invoiceNo}</Text>
              <StatusBadge label={purchase.status} tone={purchase.status === 'Paid' ? 'success' : 'warning'} />
            </View>
            <Text style={cardStyles.meta}>{purchase.dateText}</Text>
            {allWarehouses ? (
              <>
                {purchase.items && purchase.items.length > 0 ? (
                  <View style={styles.items}>
                    {purchase.items.map((item, idx) => (
                      <View key={item}>
                        <Text style={cardStyles.body}>{item}</Text>
                        {idx < (purchase.items?.length ?? 0) - 1 ? <View style={cardStyles.divider} /> : null}
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={[cardStyles.body, styles.items]} numberOfLines={2}>
                    {purchase.itemsSummary}
                  </Text>
                )}
                <View style={cardStyles.divider} />
                <View style={cardStyles.rowBetween}>
                  <Text style={cardStyles.meta}>{purchase.channel ?? ''}</Text>
                  <Text style={cardStyles.amount}>{purchase.amount}</Text>
                </View>
              </>
            ) : (
              <View style={styles.subWhBottomRow}>
                <Text style={[cardStyles.body, styles.subWhItemsSummary]} numberOfLines={2}>
                  {purchase.itemsSummary}
                </Text>
                <Text style={cardStyles.amount}>{purchase.amount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}
    </CustomersScreen>
  );
}

function ProcurementPurchaseHistory({
  can,
  onBack,
  onViewOrder,
}: {
  can?: Can | undefined;
  onBack: () => void;
  onViewOrder: (orderId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed'>('All');
  const [produceFilter, setProduceFilter] = useState<'All' | 'Tomato' | 'Beans' | 'Carrot'>('All');
  const [periodFilter, setPeriodFilter] = useState<'All' | 'Last 7 Days' | 'Last 30 Days'>('All');

  const canViewOrders = can ? (can('purchase.order.view') || can('produce.listing.review')) : true;

  const filteredHistory = SAMPLE_HISTORY.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.id.toLowerCase().includes(q) ||
      item.farmer.toLowerCase().includes(q) ||
      item.produce.toLowerCase().includes(q) ||
      item.collectionDate.toLowerCase().includes(q);
    const matchesProduce =
      produceFilter === 'All' || item.produce.toLowerCase().includes(produceFilter.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesProduce && matchesStatus;
  });

  if (filterModalVisible) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.7}
                accessibilityLabel={t('purchaseHistory.backLabel')}
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('purchaseHistory.filterPage.title')}</Text>
            </View>
            <View style={styles.headerRightSpacer} />
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.filterScrollPad} showsVerticalScrollIndicator={false}>
          <View style={styles.filterCard}>
            <Text style={styles.filterSectionTitle}>{t('purchaseHistory.filterPage.status')}</Text>
            <View style={styles.chipRow}>
              {(['All', 'Completed'] as const).map((st) => {
                const isActive = statusFilter === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setStatusFilter(st)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{st}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.filterSectionTitle, styles.filterSectionSpacing]}>
              {t('purchaseHistory.filterPage.produce')}
            </Text>
            <View style={styles.chipRow}>
              {(['All', 'Tomato', 'Beans', 'Carrot'] as const).map((prod) => {
                const isActive = produceFilter === prod;
                return (
                  <TouchableOpacity
                    key={prod}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setProduceFilter(prod)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{prod}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.filterSectionTitle, styles.filterSectionSpacing]}>
              {t('purchaseHistory.filterPage.period')}
            </Text>
            <View style={styles.chipRow}>
              {(['All', 'Last 7 Days', 'Last 30 Days'] as const).map((period) => {
                const isActive = periodFilter === period;
                return (
                  <TouchableOpacity
                    key={period}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setPeriodFilter(period)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{period}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={() => {
                  setStatusFilter('All');
                  setProduceFilter('All');
                  setPeriodFilter('All');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalResetText}>{t('purchaseHistory.filterPage.clearAll')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalApplyText}>{t('purchaseHistory.filterPage.apply')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel={t('purchaseHistory.backLabel')}
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('purchaseHistory.title')}</Text>
          </View>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel={t('purchaseHistory.filterPage.title')}
          >
            <FilterSlidersIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('purchaseHistory.searchPlaceholder')}
            placeholderTextColor={adminColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <CloseIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.listPad} showsVerticalScrollIndicator={false}>
        {!canViewOrders ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('purchaseHistory.empty')}</Text>
          </View>
        ) : filteredHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('purchaseHistory.empty')}</Text>
          </View>
        ) : (
          filteredHistory.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.orderCard}
              onPress={() => onViewOrder(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.orderIdText}>{item.id}</Text>
                <View style={styles.statusBadgeGreen}>
                  <Text style={styles.badgeTextGreen}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.farmerProduceText}>
                {item.farmer} · {item.produce}
              </Text>

              <View style={styles.cardDivider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('purchaseHistory.label.quantity')}</Text>
                <Text style={styles.detailValue}>{item.quantity}</Text>
              </View>

              <View style={[styles.detailRow, styles.detailRowSpacing]}>
                <Text style={styles.detailLabel}>{t('purchaseHistory.label.total')}</Text>
                <Text style={styles.detailValue}>{item.total}</Text>
              </View>

              <Text style={styles.collectionDateText}>
                {t('purchaseHistory.label.collectionDate')}: {item.collectionDate}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  items: { marginTop: adminSpacing.sm },
  subWhBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: adminSpacing.sm,
  },
  subWhItemsSummary: {
    flex: 1,
    paddingRight: adminSpacing.md,
  },
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  headerRightSpacer: {
    width: 36,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.headerIcon.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    gap: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },
  scroll: {
    flex: 1,
  },
  listPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  filterScrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl,
  },
  emptyContainer: {
    paddingVertical: adminSpacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  orderCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderIdText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  statusBadgeGreen: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.xs,
  },
  badgeTextGreen: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  farmerProduceText: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  cardDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailRowSpacing: {
    marginTop: adminSpacing.xs,
  },
  detailLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  detailValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  collectionDateText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
  },
  filterCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: adminSpacing.xl,
  },
  filterSectionTitle: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  filterSectionSpacing: {
    marginTop: adminSpacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  filterChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs + 3,
    borderRadius: adminRadius.xl,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterChipActive: {
    backgroundColor: adminColors.warning.bg,
    borderColor: adminColors.warning.border,
  },
  filterChipText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.muted,
  },
  filterChipTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.xxl,
  },
  modalResetBtn: {
    flex: 1,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.brandTint,
  },
  modalResetText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  modalApplyBtn: {
    flex: 1,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brand,
  },
  modalApplyText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
});
