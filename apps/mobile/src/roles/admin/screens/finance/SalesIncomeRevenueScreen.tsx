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
import { SalesOrderDetailScreen, type SalesOrderRecord } from '../sales/SalesOrderDetailScreen';

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

export interface SalesIncomeItem {
  id: string;
  soNumber: string;
  customerName: string;
  status: 'Collected' | 'Refund failed' | 'Pending' | 'In fulfilment' | 'Completed';
  line1: string;
  line2: string;
  orderRecord: SalesOrderRecord;
}

const SALES_INCOME_DATA: SalesIncomeItem[] = [
  {
    id: 'inc-1',
    soNumber: 'SO-0013',
    customerName: 'Nilgiri Fresh Traders',
    status: 'Collected',
    line1: 'B2B · ₹12,560.00 · Main Warehouse, Ooty · 1 Oct 2026',
    line2: "Invoice INV-0001 · Tax ₹0.00 (invoicing system's amount)",
    orderRecord: {
      id: 'so-13',
      soNumber: 'SO-0013',
      customerName: 'Nilgiri Fresh Traders',
      customerId: 'C-2001',
      channel: 'B2B',
      status: 'Completed',
      itemCount: 4,
      totalPrice: 12560,
      paymentStatus: 'Paid',
      warehouse: 'Main Warehouse, Ooty',
      subMeta: 'WH-MAIN · Invoice Issued (INV-0001)',
      dateTime: '1 Oct 2026, 09:30',
      paymentRef: 'PAY-8001',
      invoiceRef: 'INV-0001',
      itemName: 'Potato',
      itemGrade: 'Grade 1',
      itemQty: 350,
      itemUnitPrice: 35.88,
      fulfilledQty: 350,
      remainingQty: 0,
      fulfilmentStatus: 'Completed',
    },
  },
  {
    id: 'inc-2',
    soNumber: 'SO-0011',
    customerName: 'Demo Customer E',
    status: 'Refund failed',
    line1: 'Online · ₹280.00 · Refund permission required to view detail',
    line2: 'WH-MAIN · Delivery attempt failed (demo)',
    orderRecord: {
      id: 'so-11',
      soNumber: 'SO-0011',
      customerName: 'Demo Customer E',
      customerId: 'C-1005',
      channel: 'Online',
      status: 'Issue',
      itemCount: 1,
      totalPrice: 280,
      paymentStatus: 'Paid',
      warehouse: 'Main Warehouse, Ooty',
      subMeta: 'Delivery attempt failed (demo)',
      dateTime: '11 Oct 2026, 10:00',
      paymentRef: 'PAY-7012',
      invoiceRef: '—',
      itemName: 'Garlic',
      itemGrade: 'Grade 1',
      itemQty: 2,
      itemUnitPrice: 140,
      fulfilledQty: 0,
      remainingQty: 2,
      fulfilmentStatus: 'Issue',
      exceptionNote: 'Delivery attempt failed (demo).',
    },
  },
  {
    id: 'inc-3',
    soNumber: 'SO-0004',
    customerName: 'Demo Hotel Pvt Ltd',
    status: 'Collected',
    line1: 'HORECA · ₹3,700.00 · Main Warehouse, Ooty · 8 Oct 2026',
    line2: 'WH-MAIN · Invoice Draft',
    orderRecord: {
      id: 'so-4',
      soNumber: 'SO-0004',
      customerName: 'Demo Hotel Pvt Ltd',
      customerId: 'C-1004',
      channel: 'HORECA',
      status: 'In fulfilment',
      itemCount: 2,
      totalPrice: 3700,
      paymentStatus: 'Paid',
      warehouse: 'Main Warehouse, Ooty',
      subMeta: 'WH-MAIN · Invoice Draft',
      dateTime: '8 Oct 2026, 11:30',
      paymentRef: 'PAY-7004',
      invoiceRef: 'INV-DRAFT-04',
      itemName: 'Carrot',
      itemGrade: 'Grade 1',
      itemQty: 100,
      itemUnitPrice: 37,
      fulfilledQty: 50,
      remainingQty: 50,
      fulfilmentStatus: 'In fulfilment',
    },
  },
  {
    id: 'inc-4',
    soNumber: 'SO-0005',
    customerName: 'Demo Traders LLP',
    status: 'Collected',
    line1: 'B2B · ₹7,400.00 · Main Warehouse, Ooty · 7 Oct 2026',
    line2: 'WH-MAIN · Invoice Issued (INV-2026-0001)',
    orderRecord: {
      id: 'so-5',
      soNumber: 'SO-0005',
      customerName: 'Demo Traders LLP',
      customerId: 'C-1006',
      channel: 'B2B',
      status: 'Completed',
      itemCount: 2,
      totalPrice: 7400,
      paymentStatus: 'Paid',
      warehouse: 'Main Warehouse, Ooty',
      subMeta: 'WH-MAIN · Invoice Issued (INV-2026-0001)',
      dateTime: '7 Oct 2026, 14:00',
      paymentRef: 'PAY-7005',
      invoiceRef: 'INV-2026-0001',
      itemName: 'Beans',
      itemGrade: 'Grade 1',
      itemQty: 150,
      itemUnitPrice: 49.33,
      fulfilledQty: 150,
      remainingQty: 0,
      fulfilmentStatus: 'Completed',
    },
  },
];

export interface SalesIncomeRevenueScreenProps {
  onBack: () => void;
}

export function SalesIncomeRevenueScreen({ onBack }: SalesIncomeRevenueScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderRecord | null>(null);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return SALES_INCOME_DATA;
    const q = searchQuery.toLowerCase().trim();
    return SALES_INCOME_DATA.filter(
      (item) =>
        item.soNumber.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.line1.toLowerCase().includes(q) ||
        item.line2.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // When a record is clicked, redirect to the 3rd screen (SalesOrderDetailScreen)
  if (selectedOrder) {
    return (
      <SalesOrderDetailScreen
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
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
        <Text style={styles.headerTitle}>Sales Income & Revenue</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top KPI Grid: 7 Cards ── */}
        <View style={styles.kpiGrid}>
          <OverviewDashboardCard
            title="GROSS SALES VALUE"
            value="₹2,14,600.00"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />
          <OverviewDashboardCard
            title="DISCOUNTS"
            value="₹0.00"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />
          <OverviewDashboardCard
            title="REFUNDS"
            value="₹1,840.00"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />
          <OverviewDashboardCard
            title="COLLECTED"
            value="₹1,96,900.00"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />
          <OverviewDashboardCard
            title="PENDING"
            value="₹15,860.00"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />
          <OverviewDashboardCard
            title="FAILED"
            value="₹1,840.00"
            titlePosition="top"
            preserveCase
            style={styles.kpiCard}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
          />

          {/* Full-width card: Net Sales Value */}
          <OverviewDashboardCard
            title="NET SALES VALUE"
            value="Not defined"
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
        <Text style={styles.counterText}>24 sales · 4 channels</Text>

        {/* ── Records List ── */}
        {filteredItems.map((item) => {
          const isCollected = item.status === 'Collected' || item.status === 'Completed';
          const isRefundFailed = item.status === 'Refund failed';

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.recordCard}
              onPress={() => setSelectedOrder(item.orderRecord)}
              activeOpacity={0.8}
            >
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordTitle}>
                  {item.soNumber} · {item.customerName}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    isCollected
                      ? styles.badgeGreen
                      : isRefundFailed
                      ? styles.badgeRed
                      : styles.badgeGray,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isCollected
                        ? styles.badgeTextGreen
                        : isRefundFailed
                        ? styles.badgeTextRed
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
  badgeGreen: {
    backgroundColor: '#D1F2DE',
  },
  badgeRed: {
    backgroundColor: '#FEE2E2',
  },
  badgeGray: {
    backgroundColor: '#F3F0EA',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextGreen: {
    color: '#15803D',
  },
  badgeTextRed: {
    color: '#DC2626',
  },
  badgeTextGray: {
    color: '#6D6761',
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
