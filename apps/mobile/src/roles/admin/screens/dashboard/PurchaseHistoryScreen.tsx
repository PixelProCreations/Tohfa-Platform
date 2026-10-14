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

import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';

// ─── Design Tokens (Directly Bound to Theme File Structure) ───────────────────
const THEME = {
  headerBg: adminColors.brand,
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,
  divider: '#F3ECE4',

  // Typography
  titleRustDark: adminColors.brandDeep,
  ink: adminColors.ink,
  muted: adminColors.muted,

  // Badges
  greenBg: adminColors.success.bg,
  greenText: adminColors.success.text,
  amberBg: adminColors.warning.bg,
  amberText: adminColors.warning.text,

  // Buttons & Chips
  btnBg: adminColors.brandTint,
  btnBorder: adminColors.border,
  btnText: adminColors.brandDeep,
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
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

function FilterSlidersIcon({ size = 20, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="15" cy="6" r="2.5" fill={THEME.headerBg} stroke={color} strokeWidth="2" />
      <Circle cx="9" cy="12" r="2.5" fill={THEME.headerBg} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="18" r="2.5" fill={THEME.headerBg} stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = '#6B7280' }: { size?: number; color?: string }) {
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
        <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

        {/* ─── Header ─── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setFilterModalVisible(false)}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <BackArrowIcon size={22} color={THEME.white} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Filter History</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.filterCard}>
            {/* Status Filter */}
            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.chipRow}>
              {(['All', 'Completed'] as const).map((item) => {
                const active = statusFilter === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setStatusFilter(item)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Produce Filter */}
            <Text style={[styles.filterSectionTitle, { marginTop: 20 }]}>Produce</Text>
            <View style={styles.chipRow}>
              {(['All', 'Tomato', 'Beans', 'Carrot'] as const).map((crop) => {
                const active = produceFilter === crop;
                return (
                  <TouchableOpacity
                    key={crop}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setProduceFilter(crop)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {crop}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Time Period Filter */}
            <Text style={[styles.filterSectionTitle, { marginTop: 20 }]}>Time Period</Text>
            <View style={styles.chipRow}>
              {(['All', 'Last 7 Days', 'Last 30 Days'] as const).map((item) => {
                const active = periodFilter === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setPeriodFilter(item)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active && styles.filterChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Page Actions */}
          <View style={styles.modalBtnRow}>
            <TouchableOpacity
              style={styles.modalResetBtn}
              onPress={() => {
                setStatusFilter('All');
                setProduceFilter('All');
                setPeriodFilter('All');
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.modalResetText}>Clear All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalApplyBtn}
              onPress={() => setFilterModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalApplyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Straight Bottom (Matching Screenshot 2 Exactly) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Purchase History</Text>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.8}
            accessibilityLabel="Filter purchase history"
          >
            <FilterSlidersIcon size={20} color={THEME.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Search Bar (Placeholder matching Screenshot 2) ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="PO ID, Farmer, Listing, Produce"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* ─── Active Filter Pills ─── */}
        {(produceFilter !== 'All' || periodFilter !== 'All' || statusFilter !== 'All') && (
          <View style={styles.activeFilterRow}>
            {produceFilter !== 'All' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>{produceFilter}</Text>
                <TouchableOpacity onPress={() => setProduceFilter('All')}>
                  <CloseIcon size={14} color={THEME.btnText} />
                </TouchableOpacity>
              </View>
            )}
            {periodFilter !== 'All' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>{periodFilter}</Text>
                <TouchableOpacity onPress={() => setPeriodFilter('All')}>
                  <CloseIcon size={14} color={THEME.btnText} />
                </TouchableOpacity>
              </View>
            )}
            {statusFilter !== 'All' && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterChipText}>{statusFilter}</Text>
                <TouchableOpacity onPress={() => setStatusFilter('All')}>
                  <CloseIcon size={14} color={THEME.btnText} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ─── History Cards (Tapping content opens order detail) ─── */}
        {filteredHistory.map((order) => (
          <TouchableOpacity
            key={order.id}
            style={styles.historyCard}
            onPress={() => onViewOrder(order.id)}
            activeOpacity={0.85}
          >
            {/* Header: PO ID + Badge */}
            <View style={styles.cardHeaderRow}>
              <Text style={styles.orderIdText}>{order.id}</Text>
              <View style={styles.badgeGreen}>
                <Text style={styles.badgeTextGreen}>Completed</Text>
              </View>
            </View>

            {/* Subline: Farmer · Produce */}
            <Text style={styles.farmerProduceText}>
              {order.farmer} · {order.produce}
            </Text>

            {/* Divider */}
            <View style={styles.cardDivider} />

            {/* Detail: Quantity */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity</Text>
              <Text style={styles.detailValue}>{order.quantity}</Text>
            </View>

            {/* Detail: Total */}
            <View style={[styles.detailRow, { marginTop: 6 }]}>
              <Text style={styles.detailLabel}>Total</Text>
              <Text style={styles.detailValue}>{order.total}</Text>
            </View>

            {/* Detail: Collection Date */}
            <Text style={styles.collectionDateText}>
              Collection Date: {order.collectionDate}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },

  // Straight header matching Screenshot 2
  header: {
    backgroundColor: THEME.headerBg,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: THEME.white,
    marginLeft: 12,
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.ink,
    padding: 0,
  },

  activeFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.btnBg,
    borderColor: THEME.btnBorder,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  activeFilterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.btnText,
  },

  historyCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.ink,
  },
  badgeGreen: {
    backgroundColor: THEME.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeTextGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.greenText,
  },
  farmerProduceText: {
    fontSize: 13,
    color: THEME.muted,
    marginTop: 4,
  },
  cardDivider: {
    height: 1,
    backgroundColor: THEME.divider,
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    color: THEME.muted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.ink,
  },
  collectionDateText: {
    fontSize: 12,
    color: THEME.muted,
    marginTop: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  filterCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.titleRustDark,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: THEME.amberBg,
    borderColor: '#FDBA74',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  filterChipTextActive: {
    color: THEME.titleRustDark,
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalResetBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.btnBg,
  },
  modalResetText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.titleRustDark,
  },
  modalApplyBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: THEME.headerBg,
  },
  modalApplyText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.white,
  },
});
