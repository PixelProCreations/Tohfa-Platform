import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand + Inspect Element Tokens) ─────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#6B7280',
  border:        '#E7E2D6',
  divider:       '#F0ECE3',
  invoiceBrown:  '#F0562A',
  greenBadge:    '#E6F5ED',
  greenText:     '#1E8E5A',
  activeChipBg:  '#FFF0EB',
  activeChipBorder: '#F0562A',
  activeChipText:   '#F0562A',
  chipBg:        '#FFFFFF',
  chipBorder:    '#E5E7EB',
  chipText:      '#4B5563',
};

export interface HistoryInvoiceRecord {
  id: string;
  customerName: string;
  time: string;
  amount: string;
  status: 'Generated' | 'Pending';
  saleType: 'Retail Sale' | 'B2B Sale';
  date: string;
}

const HISTORY_INVOICES: HistoryInvoiceRecord[] = [
  {
    id: 'INV-2026-001245',
    customerName: 'Ravi Kumar',
    time: '10:42 AM',
    amount: '₹2,450',
    status: 'Generated',
    saleType: 'Retail Sale',
    date: '25 Sep 2026',
  },
  {
    id: 'INV-2026-001244',
    customerName: 'Anitha',
    time: '10:10 AM',
    amount: '₹1,200',
    status: 'Generated',
    saleType: 'Retail Sale',
    date: '25 Sep 2026',
  },
  {
    id: 'INV-2026-001240',
    customerName: 'Ganesh K.',
    time: '4:20 PM',
    amount: '₹640',
    status: 'Pending',
    saleType: 'Retail Sale',
    date: '24 Sep 2026',
  },
];

// ─── Pure SVG Icons ─────────────────────────────────────────────────────────

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

function FilterSlidersIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#8A928D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

import { InvoiceHistoryFilterState } from './SubWarehouseInvoiceHistoryFiltersScreen';

// ─── Component Props ─────────────────────────────────────────────────────────

export interface SubWarehouseInvoiceHistoryScreenProps {
  onBack?: (() => void) | undefined;
  onNavigateToInvoiceDetail?: ((invoiceId: string) => void) | undefined;
  onOpenFilters?: (() => void) | undefined;
  appliedFilters?: InvoiceHistoryFilterState | undefined;
  onClearFilters?: (() => void) | undefined;
}

export function SubWarehouseInvoiceHistoryScreen({
  onBack,
  onNavigateToInvoiceDetail,
  onOpenFilters,
  appliedFilters,
  onClearFilters,
}: SubWarehouseInvoiceHistoryScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Retail Sale' | 'B2B Sale'>('All');

  const hasActiveFilters = Boolean(
    appliedFilters && (
      (appliedFilters.invoiceType && appliedFilters.invoiceType !== 'All') ||
      (appliedFilters.invoiceStatus && appliedFilters.invoiceStatus !== 'All') ||
      (appliedFilters.datePreset && appliedFilters.datePreset !== 'All Time') ||
      (appliedFilters.sortBy && appliedFilters.sortBy !== 'Newest First') ||
      appliedFilters.searchQuery
    )
  );

  const effectiveType = appliedFilters?.invoiceType !== undefined && appliedFilters.invoiceType !== 'All'
    ? appliedFilters.invoiceType
    : activeFilter;

  const query = (searchQuery || appliedFilters?.searchQuery || '').trim().toLowerCase();

  const filtered = HISTORY_INVOICES.filter((item) => {
    if (effectiveType !== 'All' && item.saleType !== effectiveType) return false;
    if (appliedFilters?.invoiceStatus && appliedFilters.invoiceStatus !== 'All' && item.status !== appliedFilters.invoiceStatus) {
      return false;
    }
    if (!query) return true;
    return (
      item.id.toLowerCase().includes(query) ||
      item.customerName.toLowerCase().includes(query)
    );
  }).sort((a, b) => {
    const sort = appliedFilters?.sortBy || 'Newest First';
    if (sort === 'Oldest First') {
      return a.id.localeCompare(b.id);
    }
    if (sort === 'Highest Amount') {
      const numA = parseInt(a.amount.replace(/[^0-9]/g, ''), 10);
      const numB = parseInt(b.amount.replace(/[^0-9]/g, ''), 10);
      return numB - numA;
    }
    if (sort === 'Lowest Amount') {
      const numA = parseInt(a.amount.replace(/[^0-9]/g, ''), 10);
      const numB = parseInt(b.amount.replace(/[^0-9]/g, ''), 10);
      return numA - numB;
    }
    return b.id.localeCompare(a.id);
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Invoice History</Text>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={onOpenFilters || (() => Alert.alert('Filter', 'Filter options...'))}
            activeOpacity={0.8}
            accessibilityLabel="Filter History"
          >
            <FilterSlidersIcon size={18} color="#FFFFFF" />
            {hasActiveFilters && <View style={styles.activeFilterDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Search Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Customer ID / Name / Invoice Number"
            placeholderTextColor="#8A928D"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {/* ─── Filter Chips ─── */}
        <View style={styles.chipsRow}>
          {(['All', 'Retail Sale', 'B2B Sale'] as const).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.chip, isActive && styles.activeChip]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Date Section ─── */}
        <Text style={styles.dateSectionHeading}>25 Sep 2026</Text>

        {/* ─── Invoices Cards ─── */}
        {filtered.map((inv) => (
          <TouchableOpacity
            key={inv.id}
            style={styles.card}
            onPress={() =>
              onNavigateToInvoiceDetail
                ? onNavigateToInvoiceDetail(inv.id)
                : Alert.alert('Invoice', `Opening ${inv.id}`)
            }
            activeOpacity={0.75}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.invoiceIdText}>{inv.id}</Text>
              <View style={styles.badgeGreen}>
                <Text style={styles.badgeGreenText}>{inv.status}</Text>
              </View>
            </View>

            <Text style={styles.customerText}>{inv.customerName}</Text>

            <View style={styles.cardBottomRow}>
              <Text style={styles.timeText}>{inv.time}</Text>
              <Text style={styles.amountText}>{inv.amount}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: PALETTE.pageBg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 12.5,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  chip: {
    backgroundColor: PALETTE.chipBg,
    borderWidth: 1,
    borderColor: PALETTE.chipBorder,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  activeChip: {
    backgroundColor: PALETTE.activeChipBg,
    borderColor: PALETTE.activeChipBorder,
  },
  chipText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.chipText,
  },
  activeChipText: {
    color: PALETTE.activeChipText,
    fontWeight: '700',
  },
  dateSectionHeading: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 10,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceIdText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.invoiceBrown,
  },
  badgeGreen: {
    backgroundColor: PALETTE.greenBadge,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeGreenText: {
    fontFamily: 'Poppins',
    fontSize: 9.5,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  customerText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    color: PALETTE.textSecondary,
  },
  amountText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
});
