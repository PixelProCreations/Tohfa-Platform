import React, { useState } from 'react';
import {
  Modal,
  Pressable,
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

// ─── Exact Sample History Data Matching Screenshot 2 ─────────────────────────

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

// ─── Props ───────────────────────────────────────────────────────────────────

export interface PurchaseHistoryScreenProps {
  onBack: () => void;
  onViewOrder: (orderId: string) => void;
}

export function PurchaseHistoryScreen({
  onBack,
  onViewOrder,
}: PurchaseHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed'>('All');
  const [produceFilter, setProduceFilter] = useState<'All' | 'Tomato' | 'Beans' | 'Carrot'>('All');
  const [periodFilter, setPeriodFilter] = useState<'All' | 'Last 7 Days' | 'Last 30 Days'>('All');

  // Filter computation
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

    const matchesStatus =
      statusFilter === 'All' || item.status === statusFilter;

    return matchesSearch && matchesProduce && matchesStatus;
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
              accessibilityLabel={t('purchaseHistory.backLabel')}
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>{t('purchaseHistory.filterPage.title')}</Text>
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
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Produce Filter */}
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
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {prod}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Time Period Filter */}
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
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {period}
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

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel={t('purchaseHistory.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('purchaseHistory.title')}</Text>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel={t('purchaseHistory.filterPage.title')}
          >
            <FilterSlidersIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
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

      {/* ─── List Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.listPad}
        showsVerticalScrollIndicator={false}
      >
        {filteredHistory.length === 0 ? (
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
              {/* Card Header: PO ID + Completed Badge */}
              <View style={styles.cardHeaderRow}>
                <Text style={styles.orderIdText}>{item.id}</Text>
                <View style={styles.statusBadgeGreen}>
                  <Text style={styles.badgeTextGreen}>{item.status}</Text>
                </View>
              </View>

              {/* Farmer and Produce */}
              <Text style={styles.farmerProduceText}>
                {item.farmer} · {item.produce}
              </Text>

              {/* Divider */}
              <View style={styles.cardDivider} />

              {/* Quantity and Total Row */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('purchaseHistory.label.quantity')}</Text>
                <Text style={styles.detailValue}>{item.quantity}</Text>
              </View>

              <View style={[styles.detailRow, styles.detailRowSpacing]}>
                <Text style={styles.detailLabel}>{t('purchaseHistory.label.total')}</Text>
                <Text style={styles.detailValue}>{item.total}</Text>
              </View>

              {/* Collection Date Footer */}
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
    paddingBottom: 40,
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
