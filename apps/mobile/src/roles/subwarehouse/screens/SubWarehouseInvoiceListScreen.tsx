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

// ─── Design Tokens (#F0562A Existing Orange Palette + Inspect Specs) ─────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#7A726C',
  textBody:      '#4B5563',
  border:        '#F0ECE3',
  divider:       '#F0ECE3',
  greenBadge:    '#E6F5ED',
  greenText:     '#1E8E5A',
  pendingBadge:  '#FFF0EB',
  pendingText:   '#F0562A',
  infoBoxBg:     '#EFF6FF',
  infoBoxBorder: '#BFDBFE',
  infoBoxText:   '#1E40AF',
  viewBtnBg:     '#FFF0EB',
  viewBtnText:   '#F0562A',
  linkText:      '#F0562A',
};

export interface InvoiceRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  saleType: string;
  amount: string;
  date: string;
  status: 'Generated' | 'Pending' | 'Cancelled';
}

const INVOICE_ITEMS: InvoiceRecord[] = [
  {
    id: 'INV-2026-001245',
    orderNumber: 'ORD-002154',
    customerName: 'Ravi Kumar',
    saleType: 'Retail Sale',
    amount: '₹2,450',
    date: '25 Sep 2026 · 10:42 AM',
    status: 'Generated',
  },
  {
    id: 'INV-2026-001244',
    orderNumber: 'ORD-002151',
    customerName: 'Anitha',
    saleType: 'Market Sale',
    amount: '₹1,200',
    date: '25 Sep 2026 · 10:10 AM',
    status: 'Generated',
  },
  {
    id: 'INV-2026-001240',
    orderNumber: 'ORD-002140',
    customerName: 'Ganesh K.',
    saleType: 'Retail Sale',
    amount: '₹640',
    date: '24 Sep 2026 · 4:20 PM',
    status: 'Pending',
  },
];

// ─── Pure SVG Icons (No Rect or Circle to avoid Hermes runtime errors) ───────

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

function SearchIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
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

function InfoCircleIcon({ size = 18, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16v-4m0-4h.01"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

import { InvoiceFilterState } from './SubWarehouseInvoiceFiltersScreen';

// ─── Component Props ─────────────────────────────────────────────────────────

export interface SubWarehouseInvoiceListScreenProps {
  onBack?: (() => void) | undefined;
  onNavigateToInvoiceDetail?: ((invoiceId: string) => void) | undefined;
  onOpenFilters?: (() => void) | undefined;
  appliedFilters?: InvoiceFilterState | undefined;
  onClearFilters?: (() => void) | undefined;
}

export function SubWarehouseInvoiceListScreen({
  onBack,
  onNavigateToInvoiceDetail,
  onOpenFilters,
  appliedFilters,
  onClearFilters,
}: SubWarehouseInvoiceListScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string>('INV-2026-001245');

  const hasActiveFilters = Boolean(
    appliedFilters && (
      (appliedFilters.status && appliedFilters.status !== 'All') ||
      (appliedFilters.invoiceType && appliedFilters.invoiceType !== 'All') ||
      (appliedFilters.datePreset && appliedFilters.datePreset !== 'All Time') ||
      appliedFilters.customer ||
      appliedFilters.orderId ||
      appliedFilters.minAmount ||
      appliedFilters.maxAmount ||
      appliedFilters.searchQuery
    )
  );

  const query = (searchQuery || appliedFilters?.searchQuery || '').trim().toLowerCase();

  const filteredInvoices = INVOICE_ITEMS.filter((item) => {
    if (query) {
      const match =
        item.id.toLowerCase().includes(query) ||
        item.orderNumber.toLowerCase().includes(query) ||
        item.customerName.toLowerCase().includes(query);
      if (!match) return false;
    }
    if (appliedFilters) {
      if (appliedFilters.status && appliedFilters.status !== 'All' && item.status !== appliedFilters.status) {
        return false;
      }
      if (appliedFilters.invoiceType && appliedFilters.invoiceType !== 'All' && item.saleType !== appliedFilters.invoiceType) {
        return false;
      }
      if (appliedFilters.customer && !item.customerName.toLowerCase().includes(appliedFilters.customer.toLowerCase())) {
        return false;
      }
      if (appliedFilters.orderId && !item.orderNumber.toLowerCase().includes(appliedFilters.orderId.toLowerCase())) {
        return false;
      }
      const num = parseInt(item.amount.replace(/[^0-9]/g, ''), 10);
      if (appliedFilters.minAmount && num < parseInt(appliedFilters.minAmount.replace(/[^0-9]/g, ''), 10)) {
        return false;
      }
      if (appliedFilters.maxAmount && num > parseInt(appliedFilters.maxAmount.replace(/[^0-9]/g, ''), 10)) {
        return false;
      }
    }
    return true;
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

          <Text style={styles.headerTitle}>Invoice List</Text>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={onOpenFilters || (() => Alert.alert('Filter', 'Filter options...'))}
            activeOpacity={0.8}
            accessibilityLabel="Filter Invoices"
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
            placeholder="Search invoice, order or customer"
            placeholderTextColor="#8A928D"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>
        {/* ─── Invoice Cards ─── */}
        {filteredInvoices.map((inv) => {
          const isPending = inv.status === 'Pending';
          const isExpanded = expandedId === inv.id;
          return (
            <TouchableOpacity
              key={inv.id}
              style={styles.invoiceCard}
              onPress={() => setExpandedId(isExpanded ? '' : inv.id)}
              activeOpacity={0.88}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.invoiceId}>{inv.id}</Text>
                <View style={isPending ? styles.pendingBadge : styles.greenBadge}>
                  <Text style={isPending ? styles.pendingBadgeText : styles.greenBadgeText}>
                    {inv.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.customerOrderSub}>
                {inv.customerName} · Order #{inv.orderNumber}
              </Text>

              <View style={styles.cardMidRow}>
                <Text style={styles.saleTypeText}>{inv.saleType}</Text>
                <Text style={styles.amountText}>{inv.amount}</Text>
              </View>

              <Text style={styles.dateText}>{inv.date}</Text>

              {/* Action Buttons (shown only for expanded card) */}
              {isExpanded && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => (onNavigateToInvoiceDetail ? onNavigateToInvoiceDetail(inv.id) : Alert.alert('View', `Opening detail for ${inv.id}`))}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewBtnText}>View</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => Alert.alert('Download', `Downloading PDF for ${inv.id}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.downloadBtnText}>Download</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* ─── Load More Button ─── */}
        <TouchableOpacity
          style={styles.loadMoreWrap}
          onPress={() => Alert.alert('Load More', 'Loading more invoices...')}
          activeOpacity={0.7}
        >
          <Text style={styles.loadMoreText}>Load More ↓</Text>
        </TouchableOpacity>
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
    paddingTop: 14,
    paddingBottom: 32,
    backgroundColor: PALETTE.pageBg,
  },
  searchBar: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '400',
    color: PALETTE.textInk,
    marginLeft: 8,
    paddingVertical: 0,
  },
  infoBox: {
    backgroundColor: PALETTE.infoBoxBg,
    borderWidth: 1,
    borderColor: PALETTE.infoBoxBorder,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  infoIconWrap: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 11,
    color: PALETTE.infoBoxText,
    lineHeight: 16,
    fontWeight: '500',
  },
  invoiceCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invoiceId: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  greenBadge: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  greenBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  pendingBadge: {
    backgroundColor: PALETTE.pendingBadge,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.pendingText,
  },
  customerOrderSub: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  cardMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  saleTypeText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: PALETTE.textSecondary,
  },
  amountText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  dateText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E6E1D8',
  },
  viewBtn: {
    flex: 1,
    backgroundColor: PALETTE.viewBtnBg,
    borderRadius: 8,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBtnText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.viewBtnText,
  },
  downloadBtn: {
    flex: 1,
    backgroundColor: PALETTE.viewBtnBg,
    borderRadius: 8,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadBtnText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.viewBtnText,
  },
  loadMoreWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  loadMoreText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.linkText,
  },
});
