import React, { useState, useMemo } from 'react';
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
import { adminColors, adminShadow, adminSpacing } from '../../theme';
import { OverviewDashboardCard } from '../../components/OverviewDashboardCard';
import { PurchaseOrderPayoutScreen } from '../sales/PurchaseOrderPayoutScreen';
import type { PurchaseOrderRecord } from '../sales/PurchaseSalesOrdersScreen';

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

export interface PayoutListItem {
  id: string;
  title: string;
  status: 'Awaiting approval' | 'Failed' | 'Paid' | 'Not yet a payout' | 'Pending initiation';
  line1: string;
  line2?: string;
  isAlert?: boolean;
  orderRecord: PurchaseOrderRecord;
}

const DUES_PAYOUTS_DATA: PayoutListItem[] = [
  {
    id: 'pay-1',
    title: 'PY-0002 · Kumar Farm',
    status: 'Awaiting approval',
    line1: 'PO-0002 · 300 kg accepted · ₹18,000.00',
    line2: 'Above ₹10,000: needs a Super Admin who is not the initiator',
    isAlert: true,
    orderRecord: {
      id: 'po-kum-2',
      poNumber: 'PO-0002',
      payoutId: 'PY-0002',
      farmerId: 'FMR-00098',
      farmerName: 'Kumar',
      produceName: 'Beans',
      grade: 'Grade 1',
      quantityKg: 300,
      unitPrice: 42,
      totalPrice: 12600,
      warehouse: 'Main Warehouse, Ooty',
      dateStr: '8 Oct 2026',
      purchaseStatus: 'Closed',
      receiptStatus: 'Completed',
      payoutStatus: 'Awaiting approval',
      goodsReceiptId: 'GR-0002',
      listingCode: 'LST-2902',
    },
  },
  {
    id: 'pay-2',
    title: 'PY-0005 · Kumar village farming',
    status: 'Failed',
    line1: 'PO-0009 · 60 kg accepted · ₹3,300.00',
    line2: 'Declined by the bank (demo) · No retry — not defined',
    isAlert: false,
    orderRecord: {
      id: 'po-kum-5',
      poNumber: 'PO-0009',
      payoutId: 'PY-0005',
      farmerId: 'FMR-00098',
      farmerName: 'Kumar',
      produceName: 'Beans',
      grade: 'Grade 2',
      quantityKg: 60,
      unitPrice: 55,
      totalPrice: 3300,
      warehouse: 'Main Warehouse, Ooty',
      dateStr: '6 Oct 2026',
      purchaseStatus: 'Closed',
      receiptStatus: 'Completed',
      payoutStatus: 'Failed',
      goodsReceiptId: 'GR-0009',
      listingCode: 'LST-2909',
    },
  },
  {
    id: 'pay-3',
    title: 'PY-0001 · Rajesh Farm',
    status: 'Paid',
    line1: 'PO-0009 · 60 kg accepted · ₹3,300.00',
    line2: 'Declined by the bank (demo) · No retry — not defined',
    isAlert: false,
    orderRecord: {
      id: 'po-raj-1',
      poNumber: 'PO-0009',
      payoutId: 'PY-0001',
      farmerId: 'FMR-00045',
      farmerName: 'Rajesh',
      produceName: 'Potato',
      grade: 'Grade 1',
      quantityKg: 60,
      unitPrice: 55,
      totalPrice: 3300,
      warehouse: 'Main Warehouse, Ooty',
      dateStr: '5 Oct 2026',
      purchaseStatus: 'Closed',
      receiptStatus: 'Completed',
      payoutStatus: 'Paid',
      goodsReceiptId: 'GR-0001',
      listingCode: 'LST-2901',
    },
  },
  {
    id: 'pay-4',
    title: 'Unrequested due · Selvi',
    status: 'Not yet a payout',
    line1: 'GR-0003 · 120 kg accepted · ₹2,400.00',
    isAlert: false,
    orderRecord: {
      id: 'po-sel-4',
      poNumber: 'PO-0012',
      payoutId: 'PY-0010',
      farmerId: 'FMR-00082',
      farmerName: 'Selvi',
      produceName: 'Carrot',
      grade: 'Grade 2',
      quantityKg: 120,
      unitPrice: 20,
      totalPrice: 2400,
      warehouse: 'Sub Warehouse, Coonoor',
      dateStr: '10 Oct 2026',
      purchaseStatus: 'Open',
      receiptStatus: 'Completed',
      payoutStatus: 'Not yet a payout',
      goodsReceiptId: 'GR-0003',
      listingCode: 'LST-2912',
    },
  },
  {
    id: 'pay-5',
    title: 'PY-0003 · Vijay Farm',
    status: 'Paid',
    line1: 'PO-0003 · 200 kg accepted · ₹8,200.00',
    line2: 'Processed via bank transfer · Completed',
    isAlert: false,
    orderRecord: {
      id: 'po-vij-3',
      poNumber: 'PO-0003',
      payoutId: 'PY-0003',
      farmerId: 'FMR-00234',
      farmerName: 'Vijay Anand',
      produceName: 'Cabbage',
      grade: 'Grade 1',
      quantityKg: 200,
      unitPrice: 41,
      totalPrice: 8200,
      warehouse: 'Main Warehouse, Ooty',
      dateStr: '4 Oct 2026',
      purchaseStatus: 'Closed',
      receiptStatus: 'Completed',
      payoutStatus: 'Paid',
      goodsReceiptId: 'GR-0003',
      listingCode: 'LST-2903',
    },
  },
  {
    id: 'pay-6',
    title: 'PY-0004 · Meena Farm',
    status: 'Awaiting approval',
    line1: 'PO-0008 · 90 kg accepted · ₹3,150.00',
    line2: 'Awaiting dual authorization',
    isAlert: false,
    orderRecord: {
      id: 'po-mee-4',
      poNumber: 'PO-0008',
      payoutId: 'PY-0004',
      farmerId: 'FMR-00055',
      farmerName: 'Meena',
      produceName: 'Carrot',
      grade: 'Grade 2',
      quantityKg: 90,
      unitPrice: 35,
      totalPrice: 3150,
      warehouse: 'Sub Warehouse, Coonoor',
      dateStr: '24 Sep 2026',
      purchaseStatus: 'Closed',
      receiptStatus: 'Completed',
      payoutStatus: 'Awaiting approval',
      goodsReceiptId: 'GR-0004',
      listingCode: 'LST-2908',
    },
  },
  {
    id: 'pay-7',
    title: 'PY-0006 · Ramesh Farm',
    status: 'Pending initiation',
    line1: 'PO-0006 · 150 kg accepted · ₹4,500.00',
    line2: 'Pending initiation by Accounts team',
    isAlert: false,
    orderRecord: {
      id: 'po-ram-6',
      poNumber: 'PO-0006',
      payoutId: 'PY-0006',
      farmerId: 'FMR-00102',
      farmerName: 'Ramesh',
      produceName: 'Potato',
      grade: 'Grade 2',
      quantityKg: 150,
      unitPrice: 30,
      totalPrice: 4500,
      warehouse: 'Main Warehouse, Ooty',
      dateStr: '2 Oct 2026',
      purchaseStatus: 'Closed',
      receiptStatus: 'Completed',
      payoutStatus: 'Pending initiation',
      goodsReceiptId: 'GR-0006',
      listingCode: 'LST-2906',
    },
  },
  {
    id: 'pay-8',
    title: 'PY-0007 · Praveen Raj',
    status: 'Pending initiation',
    line1: 'PO-0007 · 220 kg accepted · ₹7,700.00',
    line2: 'Pending initiation by Accounts team',
    isAlert: false,
    orderRecord: {
      id: 'po-pra-7',
      poNumber: 'PO-0007',
      payoutId: 'PY-0007',
      farmerId: 'FMR-00411',
      farmerName: 'Praveen Raj',
      produceName: 'Beans',
      grade: 'Grade 1',
      quantityKg: 220,
      unitPrice: 35,
      totalPrice: 7700,
      warehouse: 'Sub Warehouse, Coonoor',
      dateStr: '1 Oct 2026',
      purchaseStatus: 'Closed',
      receiptStatus: 'Completed',
      payoutStatus: 'Pending initiation',
      goodsReceiptId: 'GR-0007',
      listingCode: 'LST-2907',
    },
  },
  {
    id: 'pay-9',
    title: 'Unrequested due · Anand',
    status: 'Not yet a payout',
    line1: 'GR-0004 · 80 kg accepted · ₹1,600.00',
    isAlert: false,
    orderRecord: {
      id: 'po-ana-9',
      poNumber: 'PO-0014',
      payoutId: 'PY-0014',
      farmerId: 'FMR-00301',
      farmerName: 'Anand',
      produceName: 'Beetroot',
      grade: 'Grade 2',
      quantityKg: 80,
      unitPrice: 20,
      totalPrice: 1600,
      warehouse: 'Main Warehouse, Ooty',
      dateStr: '11 Oct 2026',
      purchaseStatus: 'Open',
      receiptStatus: 'Completed',
      payoutStatus: 'Not yet a payout',
      goodsReceiptId: 'GR-0004',
      listingCode: 'LST-2914',
    },
  },
  {
    id: 'pay-10',
    title: 'Unrequested due · Murugan',
    status: 'Not yet a payout',
    line1: 'GR-0005 · 100 kg accepted · ₹2,000.00',
    isAlert: false,
    orderRecord: {
      id: 'po-mur-10',
      poNumber: 'PO-0015',
      payoutId: 'PY-0015',
      farmerId: 'FMR-00302',
      farmerName: 'Murugan',
      produceName: 'Cabbage',
      grade: 'Grade 2',
      quantityKg: 100,
      unitPrice: 20,
      totalPrice: 2000,
      warehouse: 'Sub Warehouse, Coonoor',
      dateStr: '12 Oct 2026',
      purchaseStatus: 'Open',
      receiptStatus: 'Completed',
      payoutStatus: 'Not yet a payout',
      goodsReceiptId: 'GR-0005',
      listingCode: 'LST-2915',
    },
  },
];

export interface PurchaseDuesPayoutsScreenProps {
  onBack: () => void;
}

export function PurchaseDuesPayoutsScreen({ onBack }: PurchaseDuesPayoutsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayoutOrder, setSelectedPayoutOrder] = useState<PurchaseOrderRecord | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string>('pay-1');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return DUES_PAYOUTS_DATA;
    const q = searchQuery.toLowerCase().trim();
    return DUES_PAYOUTS_DATA.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.line1.toLowerCase().includes(q) ||
        (item.line2 && item.line2.toLowerCase().includes(q)) ||
        item.status.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  if (selectedPayoutOrder) {
    return (
      <PurchaseOrderPayoutScreen
        order={selectedPayoutOrder}
        onBack={() => setSelectedPayoutOrder(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Top Header Banner (matching compact margin fix) ── */}
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
        <Text style={styles.headerTitle}>Purchase Dues & Payouts</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top KPI Grid: 7 Cards (Reusing OverviewDashboardCard) ── */}
        <View style={styles.kpiGrid}>
          <OverviewDashboardCard
            title="TOTAL DUE"
            value="₹32,450.00"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />
          <OverviewDashboardCard
            title="PENDING INITIATION"
            value="3"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />
          <OverviewDashboardCard
            title="AWAITING APPROVAL"
            value="2"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />
          <OverviewDashboardCard
            title="PAID (PERIOD)"
            value="2"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />
          <OverviewDashboardCard
            title="FAILED"
            value="1"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />
          <OverviewDashboardCard
            title="UNREQUESTED DUES"
            value="3"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />

          {/* Full-width card: Overdue */}
          <OverviewDashboardCard
            title="OVERDUE (PERIOD YOU SET)"
            value="No ageing period approved"
            titlePosition="top"
            preserveCase
            style={styles.kpiCardFull}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValueSubdued}
          />
        </View>

        {/* ── Search & Filter Bar ── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color="#786F68" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search common or scientific name"
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
        <Text style={styles.counterText}>8 payouts · 3 unrequested dues</Text>

        {/* ── Records List ── */}
        {filteredItems.map((item) => {
          const isAwaiting = item.status === 'Awaiting approval';
          const isFailed = item.status === 'Failed';
          const isPaid = item.status === 'Paid';
          const isNotYet = item.status === 'Not yet a payout';

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.recordCard,
                selectedCardId === item.id && styles.recordCardAlert,
              ]}
              onPress={() => {
                setSelectedCardId(item.id);
                setSelectedPayoutOrder(item.orderRecord);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordTitle}>{item.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isAwaiting
                      ? styles.badgeBlue
                      : isFailed
                      ? styles.badgeRed
                      : isPaid
                      ? styles.badgeGreen
                      : isNotYet
                      ? styles.badgeAmber
                      : styles.badgeGray,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isAwaiting
                        ? styles.badgeTextBlue
                        : isFailed
                        ? styles.badgeTextRed
                        : isPaid
                        ? styles.badgeTextGreen
                        : isNotYet
                        ? styles.badgeTextAmber
                        : styles.badgeTextGray,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.recordLine1}>{item.line1}</Text>
              {item.line2 ? <Text style={styles.recordLine2}>{item.line2}</Text> : null}
            </TouchableOpacity>
          );
        })}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.md,
    marginTop: 14,
    rowGap: 10,
  },
  kpiCard: {
    width: '48.5%',
    minHeight: 74,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  kpiCardFull: {
    width: '100%',
    minHeight: 70,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  kpiTitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: adminColors.ink,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    color: adminColors.ink,
    letterSpacing: -0.3,
  },
  kpiValueSubdued: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: '#4A4A4A',
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
  recordCard: {
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
  recordCardAlert: {
    borderColor: adminColors.danger.border,
    borderWidth: 1.5,
  },
  recordHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  recordTitle: {
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
  badgeBlue: {
    backgroundColor: adminColors.info.bg,
  },
  badgeRed: {
    backgroundColor: adminColors.danger.bg,
  },
  badgeGreen: {
    backgroundColor: adminColors.success.bg,
  },
  badgeAmber: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeGray: {
    backgroundColor: '#F3F0EA',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextBlue: {
    color: adminColors.info.text,
  },
  badgeTextRed: {
    color: adminColors.danger.text,
  },
  badgeTextGreen: {
    color: adminColors.success.text,
  },
  badgeTextAmber: {
    color: adminColors.warning.text,
  },
  badgeTextGray: {
    color: adminColors.muted,
  },
  recordLine1: {
    fontSize: 12.5,
    color: '#5A524D',
    marginTop: 2,
    lineHeight: 18,
  },
  recordLine2: {
    fontSize: 12,
    color: '#786F68',
    marginTop: 3,
    lineHeight: 16,
  },
});
