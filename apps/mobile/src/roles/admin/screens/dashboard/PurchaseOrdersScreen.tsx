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
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function FilterSlidersIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="15" cy="6" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
      <Circle cx="9" cy="12" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="18" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── PO Data Model ───────────────────────────────────────────────────────────

export interface PurchaseOrderItem {
  id: string;
  listingId: string;
  farmer: string;
  produce: string;
  quantity: string;
  total: string;
  status: 'Awaiting Handover' | 'Collection Scheduled' | 'Completed';
}

const SAMPLE_ORDERS: PurchaseOrderItem[] = [
  {
    id: 'PO-2026-00124',
    listingId: 'LST-00452',
    farmer: 'Ramesh Kumar',
    produce: 'Carrot, Grade 1',
    quantity: '50 kg',
    total: '₹2,250',
    status: 'Awaiting Handover',
  },
  {
    id: 'PO-2026-00119',
    listingId: 'LST-00448',
    farmer: 'Selvi',
    produce: 'Beans, Grade 1',
    quantity: '30 kg',
    total: '₹1,350',
    status: 'Collection Scheduled',
  },
  {
    id: 'PO-2026-00108',
    listingId: 'LST-00431',
    farmer: 'Kumar',
    produce: 'Tomato, Grade 1',
    quantity: '25 kg',
    total: '₹2,500',
    status: 'Completed',
  },
];

// ─── Props ───────────────────────────────────────────────────────────────────

export interface PurchaseOrdersScreenProps {
  onBack: () => void;
  onViewOrder: (orderId: string) => void;
  onHandover?: ((orderId: string) => void) | undefined;
  onCollect?: ((orderId: string) => void) | undefined;
  onViewHistory?: (() => void) | undefined;
}

export function PurchaseOrdersScreen({
  onBack,
  onViewOrder,
  onHandover,
  onCollect,
  onViewHistory,
}: PurchaseOrdersScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Awaiting Handover' | 'Collection Scheduled' | 'Completed'>('All');
  const [produceFilter, setProduceFilter] = useState<'All' | 'Carrot' | 'Beans' | 'Tomato'>('All');

  // Filter items
  const filteredOrders = SAMPLE_ORDERS.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.id.toLowerCase().includes(q) ||
      order.listingId.toLowerCase().includes(q) ||
      order.farmer.toLowerCase().includes(q) ||
      order.produce.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'All' || order.status === statusFilter;

    const matchesProduce =
      produceFilter === 'All' || order.produce.toLowerCase().includes(produceFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesProduce;
  });

  // If viewing Filter Page
  if (filterModalVisible) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* ─── Header ─── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setFilterModalVisible(false)}
              activeOpacity={0.7}
              accessibilityLabel={t('purchaseOrders.backLabel')}
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>{t('purchaseOrders.filterPage.title')}</Text>
            <View style={styles.headerRightSpacer} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.filterScrollPad}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.filterCard}>
            {/* Status Filter */}
            <Text style={styles.filterSectionTitle}>{t('purchaseOrders.filterPage.status')}</Text>
            <View style={styles.chipRow}>
              {(['All', 'Awaiting Handover', 'Collection Scheduled', 'Completed'] as const).map((st) => {
                const isActive = statusFilter === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setStatusFilter(st)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Produce Filter */}
            <Text style={[styles.filterSectionTitle, styles.filterSectionSpacing]}>
              {t('purchaseOrders.filterPage.produce')}
            </Text>
            <View style={styles.chipRow}>
              {(['All', 'Carrot', 'Beans', 'Tomato'] as const).map((prod) => {
                const isActive = produceFilter === prod;
                return (
                  <TouchableOpacity
                    key={prod}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setProduceFilter(prod)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {prod}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={() => {
                  setStatusFilter('All');
                  setProduceFilter('All');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalResetText}>{t('purchaseOrders.filterPage.clearAll')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalApplyText}>{t('purchaseOrders.filterPage.apply')}</Text>
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

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel={t('purchaseOrders.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('purchaseOrders.title')}</Text>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel={t('purchaseOrders.filterPage.title')}
          >
            <FilterSlidersIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrap}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('purchaseOrders.searchPlaceholder')}
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

      {/* ─── List Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.listPad}
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('purchaseOrders.empty')}</Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const isAwaiting = order.status === 'Awaiting Handover';
            const isCollection = order.status === 'Collection Scheduled';
            const isCompleted = order.status === 'Completed';

            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => onViewOrder(order.id)}
                activeOpacity={0.8}
              >
                {/* Header: ID + Status Badge */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.orderIdText}>{order.id}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isAwaiting && styles.badgeAmber,
                      isCollection && styles.badgeBlue,
                      isCompleted && styles.badgeGreen,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isAwaiting && styles.badgeTextAmber,
                        isCollection && styles.badgeTextBlue,
                        isCompleted && styles.badgeTextGreen,
                      ]}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>

                {/* Farmer and Produce */}
                <Text style={styles.farmerProduceText}>
                  {order.farmer} · {order.produce}
                </Text>

                {/* Details */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity</Text>
                  <Text style={styles.detailValue}>{order.quantity}</Text>
                </View>

                <View style={[styles.detailRow, styles.detailRowSpacing]}>
                  <Text style={styles.detailLabel}>Total</Text>
                  <Text style={styles.detailValue}>{order.total}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  headerRightSpacer: {
    width: 36,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
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
    paddingBottom: 40,
  },
  historyBanner: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.brand,
  },
  historyBannerText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  emptyContainer: {
    paddingVertical: 60,
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
    fontWeight: '700',
    color: adminColors.ink,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeAmber: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeBlue: {
    backgroundColor: adminColors.info.bg,
  },
  badgeGreen: {
    backgroundColor: adminColors.success.bg,
  },
  statusBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  badgeTextAmber: {
    color: adminColors.warning.text,
  },
  badgeTextBlue: {
    color: adminColors.info.text,
  },
  badgeTextGreen: {
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
  actionBtnRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: adminColors.brandTint,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  filterCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: 18,
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
