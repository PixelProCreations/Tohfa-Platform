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
import { ExpenseRecordDetailScreen } from './ExpenseDetailScreen';
import { EXPENSES_LIST, type ExpenseManagementRecord } from './ExpenseManagementScreen';
import { SalesOrderDetailScreen, type SalesOrderRecord } from '../sales/SalesOrderDetailScreen';
import { PurchaseOrderPayoutScreen } from '../sales/PurchaseOrderPayoutScreen';
import type { PurchaseOrderRecord } from '../sales/PurchaseSalesOrdersScreen';
import { InvoiceDetailScreen, type InvoiceDetailData } from './InvoiceDetailScreen';

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

export interface TransactionEventItem {
  id: string;
  title: string;
  badge: string;
  badgeTone: 'default' | 'success' | 'danger' | 'warning';
  line1: string;
  line2: string;
  line3: string;
  line4: string;
  actionLabel?: string;
}

const EVENTS_DATA: TransactionEventItem[] = [
  {
    id: 'evt-1',
    title: 'Invoice · INV-0004',
    badge: 'Cancelled',
    badgeTone: 'danger',
    line1: '13 Oct 2026, 12:00 · Sales',
    line2: 'Demo Customer D (C-1004)',
    line3: 'SO-0009 · Cancelled',
    line4: 'Amount ₹140.00 · Updated by Demo TOHFA Admin',
    actionLabel: 'View Details',
  },
  {
    id: 'evt-3',
    title: 'Sale · SO-0006',
    badge: 'Confirmed',
    badgeTone: 'success',
    line1: '13 Oct 2026, 10:00 · Sales',
    line2: 'Demo Wholesale Co (B-4002)',
    line3: 'B2B · 1 item',
    line4: 'Amount ₹3,000.00 · Updated by System',
  },
  {
    id: 'evt-4',
    title: 'Sale · SO-0002',
    badge: 'Confirmed',
    badgeTone: 'success',
    line1: '13 Oct 2026, 10:00 · Sales',
    line2: 'Demo Customer B (C-1002)',
    line3: 'Online · 1 item',
    line4: 'Amount ₹300.00 · Updated by System',
  },
  {
    id: 'evt-5',
    title: 'Payout · PY-0002',
    badge: 'Pending',
    badgeTone: 'warning',
    line1: '12 Oct 2026, 16:30 · Payout',
    line2: 'Kumar Farm (FMR-00098)',
    line3: 'PO-0002 · Awaiting Super Admin',
    line4: 'Amount ₹18,000.00 · Updated by Demo TOHFA Admin',
  },
  {
    id: 'evt-6',
    title: 'Expense · EXP-0007',
    badge: 'Recorded',
    badgeTone: 'success',
    line1: '12 Oct 2026, 14:15 · Operations',
    line2: 'Ooty Eco Packs',
    line3: 'Packaging materials · Paid',
    line4: 'Amount ₹3,200.00 · Updated by Main Warehouse Admin',
  },
];


const DEFAULT_EXPENSE_RECORD: ExpenseManagementRecord = {
  id: 'exp-2',
  expenseCode: 'EXP-0002',
  title: 'EXP-0002 · Internet & phone',
  category: 'Operational category 2 (demo)',
  dateStr: '8 Oct 2026',
  description: 'Monthly broadband connectivity',
  warehouse: 'Main Warehouse, Ooty',
  reference: 'EXPREF-102',
  payee: 'Nilgiri Telecom',
  amount: 1800,
  amountFormatted: '₹1,800.00',
  paymentMethod: 'UPI',
  paymentStatus: 'Paid on 8 Oct 2026',
  paymentRef: 'EPAY-102',
  createdBy: 'Demo Main Warehouse Admin, 8 Oct 2026, 14:00',
  status: 'Paid',
  statusBadge: 'Paid',
};

const SAMPLE_SALES_RECORD: SalesOrderRecord = {
  id: 'so-13',
  soNumber: 'SO-0013',
  customerName: 'Nilgiri Fresh Traders',
  customerId: 'C-2001',
  channel: 'B2B',
  status: 'Completed',
  itemCount: 1,
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
};

const SAMPLE_INVOICE_RECORD: InvoiceDetailData = {
  id: 'inv-1',
  invoiceNumber: 'INV-2026-0001',
  status: 'Issued',
  dateStr: '5 Oct 2026',
  soNumber: 'SO-0005',
  recipient: 'Demo Traders LLP (C-1006)',
  billingAddress: '42 Main Bazaar, Ooty',
  gstin: '33AABCT1234D1Z5',
  itemName: 'Beans',
  itemGrade: 'Grade 1',
  itemRate: '150 kg × ₹49.33/kg',
  itemTotal: '₹7,400.00',
  taxableAmount: '₹7,400.00',
  taxText: 'Included: 5% GST (₹370.00)',
  finalAmountText: '₹7,400.00',
  historyEvents: [
    { date: '5 Oct 2026, 15:30 · Demo TOHFA Admin', title: 'Invoice issued: INV-2026-0001' },
    { date: '5 Oct 2026, 14:00 · Demo TOHFA Admin', title: 'Draft created' },
  ],
  payoutInfo: {
    payoutId: 'PY-0001',
    poNumber: 'PO-0005',
    farmerName: 'Rajesh Farm',
    amount: '₹7,400.00',
  },
};

const SAMPLE_PAYOUT_RECORD: PurchaseOrderRecord = {
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
};

export interface TransactionHistoryScreenProps {
  onBack: () => void;
}

export function TransactionHistoryScreen({ onBack }: TransactionHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseManagementRecord | null>(null);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrderRecord | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<PurchaseOrderRecord | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetailData | null>(null);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return EVENTS_DATA;
    const q = searchQuery.toLowerCase().trim();
    return EVENTS_DATA.filter(
      (ev) =>
        ev.title.toLowerCase().includes(q) ||
        ev.badge.toLowerCase().includes(q) ||
        ev.line1.toLowerCase().includes(q) ||
        ev.line2.toLowerCase().includes(q) ||
        ev.line3.toLowerCase().includes(q) ||
        ev.line4.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleViewDetails = (item: TransactionEventItem) => {
    const titleLower = item.title.toLowerCase();
    const line1Lower = item.line1.toLowerCase();
    const line3Lower = item.line3.toLowerCase();

    // 0. Invoice Detail Record (1st Screen)
    if (
      item.id === 'evt-1' ||
      titleLower.includes('invoice') ||
      titleLower.includes('inv-')
    ) {
      setSelectedInvoice(SAMPLE_INVOICE_RECORD);
      return;
    }

    // 1. Expense Detail Record (2nd Screen)
    if (
      titleLower.includes('expense') ||
      titleLower.includes('exp-') ||
      line1Lower.includes('operations')
    ) {
      const match = item.title.match(/EXP-\d+/i) || item.line3.match(/EXP-\d+/i);
      const code = match ? match[0].toUpperCase() : 'EXP-0002';
      const found =
        EXPENSES_LIST.find((e) => e.expenseCode === code) ||
        EXPENSES_LIST.find((e) => e.expenseCode === 'EXP-0002') ||
        DEFAULT_EXPENSE_RECORD;
      setSelectedExpense(found);
      return;
    }

    // 2. Payout Detail Record (4th Screen)
    if (
      titleLower.includes('payout') ||
      titleLower.includes('py-') ||
      titleLower.includes('receipt') ||
      titleLower.includes('gr-') ||
      line1Lower.includes('payout') ||
      line1Lower.includes('purchase')
    ) {
      if (item.id === 'evt-2' || titleLower.includes('gr-0004')) {
        setSelectedPayout({
          id: 'po-meena-4',
          poNumber: 'PO-0004',
          payoutId: 'PY-0004',
          farmerId: 'FMR-00177',
          farmerName: 'Meena',
          produceName: 'Carrot',
          grade: 'Grade 1',
          quantityKg: 100,
          unitPrice: 35,
          totalPrice: 3500,
          warehouse: 'Main Warehouse, Ooty',
          dateStr: '13 Oct 2026',
          purchaseStatus: 'Closed',
          receiptStatus: 'Completed',
          payoutStatus: 'Received',
          goodsReceiptId: 'GR-0004',
          listingCode: 'LST-2904',
        });
      } else {
        setSelectedPayout(SAMPLE_PAYOUT_RECORD);
      }
      return;
    }

    // 3. Sales Detail Record (3rd Screen)
    if (item.id === 'evt-3' || titleLower.includes('so-0006')) {
      setSelectedSalesOrder({
        id: 'so-6',
        soNumber: 'SO-0006',
        customerName: 'Demo Wholesale Co',
        customerId: 'B-4002',
        channel: 'B2B',
        status: 'Completed',
        itemCount: 1,
        totalPrice: 3000,
        paymentStatus: 'Paid',
        warehouse: 'Main Warehouse, Ooty',
        subMeta: 'WH-MAIN · Confirmed',
        dateTime: '13 Oct 2026, 10:00',
        paymentRef: 'PAY-7006',
        invoiceRef: 'INV-0003',
        itemName: 'Carrot',
        itemGrade: 'Grade 1',
        itemQty: 100,
        itemUnitPrice: 30.0,
        fulfilledQty: 100,
        remainingQty: 0,
        fulfilmentStatus: 'Completed',
      });
    } else if (item.id === 'evt-4' || titleLower.includes('so-0002')) {
      setSelectedSalesOrder({
        id: 'so-2',
        soNumber: 'SO-0002',
        customerName: 'Demo Customer B',
        customerId: 'C-1002',
        channel: 'Online',
        status: 'Completed',
        itemCount: 1,
        totalPrice: 300,
        paymentStatus: 'Paid',
        warehouse: 'Main Warehouse, Ooty',
        subMeta: 'WH-MAIN · Confirmed',
        dateTime: '13 Oct 2026, 10:00',
        paymentRef: 'PAY-7002',
        invoiceRef: 'INV-0002',
        itemName: 'Potato',
        itemGrade: 'Grade 1',
        itemQty: 10,
        itemUnitPrice: 30.0,
        fulfilledQty: 10,
        remainingQty: 0,
        fulfilmentStatus: 'Completed',
      });
    } else if (item.id === 'evt-1' || titleLower.includes('inv-0004') || line3Lower.includes('so-0009')) {
      setSelectedSalesOrder({
        id: 'so-9',
        soNumber: 'SO-0009',
        customerName: 'Demo Customer D',
        customerId: 'C-1004',
        channel: 'Online',
        status: 'Issue',
        itemCount: 1,
        totalPrice: 140,
        paymentStatus: 'Cancelled',
        warehouse: 'Main Warehouse, Ooty',
        subMeta: 'WH-MAIN · Cancelled',
        dateTime: '13 Oct 2026, 12:00',
        paymentRef: 'PAY-7009',
        invoiceRef: 'INV-0004',
        itemName: 'Beetroot',
        itemGrade: 'Grade 2',
        itemQty: 5,
        itemUnitPrice: 28.0,
        fulfilledQty: 0,
        remainingQty: 5,
        fulfilmentStatus: 'Issue',
      });
    } else {
      setSelectedSalesOrder(SAMPLE_SALES_RECORD);
    }
  };

  if (selectedInvoice) {
    return (
      <InvoiceDetailScreen
        invoice={selectedInvoice}
        onBack={() => setSelectedInvoice(null)}
      />
    );
  }

  if (selectedExpense) {
    return (
      <ExpenseRecordDetailScreen
        expense={selectedExpense}
        onBack={() => setSelectedExpense(null)}
      />
    );
  }

  if (selectedSalesOrder) {
    return (
      <SalesOrderDetailScreen
        order={selectedSalesOrder}
        onBack={() => setSelectedSalesOrder(null)}
      />
    );
  }

  if (selectedPayout) {
    return (
      <PurchaseOrderPayoutScreen
        order={selectedPayout}
        onBack={() => setSelectedPayout(null)}
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
        <Text style={styles.headerTitle}>History</Text>
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
        <Text style={styles.counterText}>58 events</Text>

        {/* ── Events Cards List (Image 4) ── */}
        {filteredEvents.map((item) => {
          const isSuccess = item.badgeTone === 'success';
          const isDanger = item.badgeTone === 'danger';
          const isWarning = item.badgeTone === 'warning';

          const isSelected = selectedCardId === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.eventCard,
                isSelected && styles.eventCardSelected,
              ]}
              onPress={() => setSelectedCardId(item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    isSuccess
                      ? styles.badgeGreen
                      : isDanger
                      ? styles.badgeRed
                      : isWarning
                      ? styles.badgeAmber
                      : styles.badgeGray,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isSuccess
                        ? styles.badgeTextGreen
                        : isDanger
                        ? styles.badgeTextRed
                        : isWarning
                        ? styles.badgeTextAmber
                        : styles.badgeTextGray,
                    ]}
                  >
                    {item.badge}
                  </Text>
                </View>
              </View>

              <Text style={styles.lineText}>{item.line1}</Text>
              <Text style={styles.lineText}>{item.line2}</Text>
              <Text style={styles.lineText}>{item.line3}</Text>
              <Text style={styles.lineText}>{item.line4}</Text>

              {/* Action row with ONLY "View Details" button, as explicitly requested */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCardId(item.id);
                    handleViewDetails(item);
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Text style={styles.actionBtnText}>{item.actionLabel ?? 'View Details'}</Text>
                </TouchableOpacity>
              </View>
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
  eventCard: {
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
  eventCardSelected: {
    borderColor: adminColors.danger.border,
    borderWidth: 1.5,
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
  badgeGreen: {
    backgroundColor: adminColors.success.bg,
  },
  badgeRed: {
    backgroundColor: adminColors.danger.bg,
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
  badgeTextGreen: {
    color: adminColors.success.text,
  },
  badgeTextRed: {
    color: adminColors.danger.text,
  },
  badgeTextAmber: {
    color: adminColors.warning.text,
  },
  badgeTextGray: {
    color: adminColors.muted,
  },
  lineText: {
    fontSize: 12.5,
    color: '#5A524D',
    marginTop: 2,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 4,
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
});
