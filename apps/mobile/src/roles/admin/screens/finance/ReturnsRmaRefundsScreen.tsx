import React, { useState, useMemo } from 'react';
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
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { adminColors, adminShadow, adminSpacing } from '../../theme';
import { ReturnsRmaDetailScreen, type ReturnsRmaDetailData } from './ReturnsRmaDetailScreen';

function BackArrowWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function SearchIcon({ size = 18, color = '#786F68' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="21" x2="4" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="4" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="21" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="21" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="12" x2="20" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="1" y1="14" x2="7" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="16" x2="23" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface ReturnListItem {
  id: string;
  title: string;
  status: 'Pending review' | 'Approved - Refunded' | 'Rejected';
  subtitle: string;
  subtitle2?: string;
  actionText: string;
  detail: ReturnsRmaDetailData;
}

const RETURNS_LIST_DATA: ReturnListItem[] = [
  {
    id: 'rma-2',
    title: 'RMA-0002 · SO-0008',
    status: 'Pending review',
    subtitle: 'Demo Market Buyer 2 · Beans · 3 kg requested',
    actionText: 'Review',
    detail: {
      id: 'rma-2',
      rmaNumber: 'RMA-0002',
      salesOrder: 'SO-0008',
      invoice: 'INV-2026-0001',
      customer: 'Demo Market Buyer 2',
      purchaseDate: '2 Oct 2026, 08:30',
      originalItems: 'Beans 10 kg',
      paymentReference: 'PAY-7008',
      productAndQty: 'Beans · 3 kg',
      reason: 'Produce damaged in transit',
      evidence: 'Photo attached',
      requestedDate: '3 Oct 2026, 10:00',
      reviewStatus: 'Pending',
      approvedQuantity: 'Pending review',
      decisionReason: 'Awaiting manager sign-off.',
      reviewer: 'Pending assignment',
      refundStatus: 'Not initiated',
      refundReference: '—',
      refundAmount: '₹150.00',
      originalPayment: 'PAY-7008',
      initiatedDate: '—',
      completedDate: '—',
      failureReason: '—',
      history: [
        { meta: '3 Oct 2026, 10:00 · Demo Market Buyer 2', title: 'Return requested: 3 kg' },
      ],
    },
  },
  {
    id: 'rma-4',
    title: 'RMA-0004 · SO-0010',
    status: 'Approved - Refunded',
    subtitle: 'Demo Restaurant · Carrot · 5 kg approved',
    subtitle2: 'RF-8002 · ₹250.00 · Completed',
    actionText: 'Details',
    detail: {
      id: 'rma-4',
      rmaNumber: 'RMA-0004',
      salesOrder: 'SO-0010',
      invoice: 'INV-2026-0002',
      customer: 'Demo Restaurant (H-3002)',
      purchaseDate: '4 Oct 2026, 10:00',
      originalItems: 'Carrot 25 kg',
      paymentReference: 'PAY-7011',
      productAndQty: 'Carrot · 5 kg',
      reason: 'Demo recorded reason (placeholder).',
      evidence: 'None provided',
      requestedDate: '8 Oct 2026, 09:00',
      reviewStatus: 'Approved',
      approvedQuantity: '5 kg',
      decisionReason: 'Return accepted (demo).',
      reviewer: 'Demo TOHFA Admin, 9 Oct 2026, 11:00',
      refundStatus: 'Completed',
      refundReference: 'RF-8002',
      refundAmount: '₹250.00',
      originalPayment: 'PAY-7011',
      initiatedDate: '10 Oct 2026, 10:00',
      completedDate: '11 Oct 2026, 10:00',
      failureReason: '—',
      history: [
        { meta: '11 Oct 2026, 10:00 · System', title: 'Refund confirmed: Payment service confirmation' },
        { meta: '10 Oct 2026, 10:00 · Demo TOHFA Admin', title: 'Refund initiated: ₹250.00' },
        { meta: '9 Oct 2026, 11:00 · Demo TOHFA Admin', title: 'Return approved: Return accepted (demo).' },
        { meta: '8 Oct 2026, 09:00 · Demo Restaurant', title: 'Return requested: 5 kg' },
      ],
    },
  },
  {
    id: 'rma-3',
    title: 'RMA-0003 · SO-0009',
    status: 'Rejected',
    subtitle: 'Demo Customer D · Cabbage · 5 kg requested',
    subtitle2: 'Outside the evidence provided (demo)',
    actionText: 'Details',
    detail: {
      id: 'rma-3',
      rmaNumber: 'RMA-0003',
      salesOrder: 'SO-0009',
      invoice: 'INV-2026-0003',
      customer: 'Demo Customer D (C-1004)',
      purchaseDate: '5 Oct 2026, 11:00',
      originalItems: 'Cabbage 10 kg',
      paymentReference: 'PAY-7009',
      productAndQty: 'Cabbage · 5 kg',
      reason: 'Customer dispute on freshness',
      evidence: 'None provided',
      requestedDate: '6 Oct 2026, 14:00',
      reviewStatus: 'Rejected',
      approvedQuantity: '0 kg',
      decisionReason: 'Outside the evidence provided (demo).',
      reviewer: 'Demo TOHFA Admin, 7 Oct 2026, 09:30',
      refundStatus: 'Rejected',
      refundReference: '—',
      refundAmount: '₹0.00',
      originalPayment: 'PAY-7009',
      initiatedDate: '—',
      completedDate: '—',
      failureReason: 'Claim rejected by quality review',
      history: [
        { meta: '7 Oct 2026, 09:30 · Demo TOHFA Admin', title: 'Return rejected: Outside the evidence provided.' },
        { meta: '6 Oct 2026, 14:00 · Demo Customer D', title: 'Return requested: 5 kg' },
      ],
    },
  },
  {
    id: 'rma-1',
    title: 'RMA-0001 · SO-0002',
    status: 'Approved - Refunded',
    subtitle: 'Demo Customer B · Potato · 2 kg approved',
    subtitle2: 'RF-8001 · ₹60.00 · Completed',
    actionText: 'Details',
    detail: {
      id: 'rma-1',
      rmaNumber: 'RMA-0001',
      salesOrder: 'SO-0002',
      invoice: 'INV-2026-0001',
      customer: 'Demo Customer B (C-1002)',
      purchaseDate: '1 Oct 2026, 10:00',
      originalItems: 'Potato 5 kg',
      paymentReference: 'PAY-7002',
      productAndQty: 'Potato · 2 kg',
      reason: 'Underweight delivery',
      evidence: 'Scale photo verified',
      requestedDate: '2 Oct 2026, 09:00',
      reviewStatus: 'Approved',
      approvedQuantity: '2 kg',
      decisionReason: 'Verified with delivery weight receipt.',
      reviewer: 'Demo TOHFA Admin, 2 Oct 2026, 12:00',
      refundStatus: 'Completed',
      refundReference: 'RF-8001',
      refundAmount: '₹60.00',
      originalPayment: 'PAY-7002',
      initiatedDate: '2 Oct 2026, 14:00',
      completedDate: '3 Oct 2026, 10:00',
      failureReason: '—',
      history: [
        { meta: '3 Oct 2026, 10:00 · System', title: 'Refund completed: ₹60.00' },
        { meta: '2 Oct 2026, 12:00 · Demo TOHFA Admin', title: 'Return approved: Verified with scale photo.' },
      ],
    },
  },
];

export interface ReturnsRmaRefundsScreenProps {
  onBack: () => void;
}

export function ReturnsRmaRefundsScreen({ onBack }: ReturnsRmaRefundsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRma, setSelectedRma] = useState<ReturnsRmaDetailData | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return RETURNS_LIST_DATA;
    const q = searchQuery.toLowerCase().trim();
    return RETURNS_LIST_DATA.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        (item.subtitle2 && item.subtitle2.toLowerCase().includes(q)) ||
        item.status.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // When a record is tapped, redirect to ReturnsRmaDetailScreen (Image 2)
  if (selectedRma) {
    return (
      <ReturnsRmaDetailScreen
        rma={selectedRma}
        onBack={() => setSelectedRma(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Top Header Banner ── */}
      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to Accounts & Finance"
        >
          <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Returns, RMA & Refunds</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Search Bar ── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color="#786F68" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#786F68"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.filterIconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Filter"
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ── Counter Line ── */}
        <Text style={styles.counterText}>4 returns · 1 pending review</Text>

        {/* ── Cards List ── */}
        {filteredItems.map((item) => {
          const isPending = item.status === 'Pending review';
          const isApproved = item.status === 'Approved - Refunded';
          const isRejected = item.status === 'Rejected';

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.returnCard}
              onPress={() => setSelectedRma(item.detail)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isPending
                      ? styles.badgeAmber
                      : isApproved
                      ? styles.badgeGreen
                      : styles.badgeRed,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isPending
                        ? styles.badgeTextAmber
                        : isApproved
                        ? styles.badgeTextGreen
                        : styles.badgeTextRed,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              {item.subtitle2 ? (
                <Text style={styles.cardSubtitle2}>{item.subtitle2}</Text>
              ) : null}

              {/* Action Text */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setSelectedRma(item.detail)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Text style={styles.actionBtnText}>{item.actionText}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: 8,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingBottom: adminSpacing.xxxl,
  },
  searchBarContainer: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: adminSpacing.md,
    marginTop: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterIconButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: adminColors.muted,
    marginHorizontal: adminSpacing.md,
    marginTop: 12,
    marginBottom: 10,
  },
  returnCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: adminSpacing.md,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.ink,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  badgeAmber: {
    backgroundColor: '#FEF3C7',
  },
  badgeGreen: {
    backgroundColor: '#D1F2DE',
  },
  badgeRed: {
    backgroundColor: '#FEE2E2',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextAmber: {
    color: '#B45309',
  },
  badgeTextGreen: {
    color: '#047857',
  },
  badgeTextRed: {
    color: '#DC2626',
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: '#5A524D',
    marginTop: 2,
    lineHeight: 18,
  },
  cardSubtitle2: {
    fontSize: 12,
    color: '#786F68',
    marginTop: 2,
    lineHeight: 16,
  },
  actionBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
});
