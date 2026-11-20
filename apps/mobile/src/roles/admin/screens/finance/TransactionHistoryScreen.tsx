import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import type { Can } from '../../permissions/can';
import { adminColors, adminShadow, adminSpacing, adminType } from '../../theme';
import { ExpenseDetailScreen } from '../warehouse/finance-expenses/ExpenseDetailScreen';
import { EXPENSES_LIST, type ExpenseManagementRecord } from './fixtures';
import { SalesOrderDetailScreen, type SalesOrderRecord } from '../sales/SalesOrderDetailScreen';
import { PurchaseOrderPayoutScreen } from '../sales/PurchaseOrderPayoutScreen';
import type { PurchaseOrderRecord } from '../sales/PurchaseSalesOrdersScreen';
import { SalesInvoiceScreen } from '../sales/SalesInvoiceScreen';

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

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
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
};

const SAMPLE_PURCHASE_ORDER: PurchaseOrderRecord = {
  id: 'po-2',
  poNumber: 'PO-0002',
  listingCode: 'LST-2902',
  farmerName: 'Kumar Farm',
  farmerId: 'FMR-00098',
  produceName: 'Carrot',
  grade: 'Grade 1',
  quantityKg: 500,
  unitPrice: 36,
  totalPrice: 18000,
  warehouse: 'Main Warehouse, Ooty',
  dateStr: '12 Oct 2026',
  purchaseStatus: 'Closed',
  receiptStatus: 'Completed',
  payoutStatus: 'Pending',
};

export interface TransactionHistoryScreenProps {
  can?: Can | undefined;
  onBack: () => void;
}

export function TransactionHistoryScreen({ can, onBack }: TransactionHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string>('evt-1');

  // Redirection targets
  const [selectedExpense, setSelectedExpense] = useState<ExpenseManagementRecord | null>(null);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrderRecord | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<PurchaseOrderRecord | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<{ soNumber: string; customerName: string; invoiceNumber: string; total: number } | null>(null);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return EVENTS_DATA;
    const q = searchQuery.toLowerCase().trim();
    return EVENTS_DATA.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q) ||
        item.line1.toLowerCase().includes(q) ||
        item.line2.toLowerCase().includes(q) ||
        item.line3.toLowerCase().includes(q) ||
        item.line4.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleViewDetails = (item: TransactionEventItem) => {
    const titleLower = item.title.toLowerCase();
    const line3Lower = item.line3.toLowerCase();

    if (titleLower.includes('expense') || titleLower.includes('exp-')) {
      const match = EXPENSES_LIST.find((exp) => titleLower.includes(exp.expenseCode.toLowerCase()));
      setSelectedExpense(match || DEFAULT_EXPENSE_RECORD);
    } else if (titleLower.includes('payout') || titleLower.includes('py-') || line3Lower.includes('po-')) {
      setSelectedPayout(SAMPLE_PURCHASE_ORDER);
    } else if (titleLower.includes('so-0006') || line3Lower.includes('b-4002')) {
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
        invoiceRef: 'INV-0006',
        itemName: 'Carrot',
        itemGrade: 'Grade 1',
        itemQty: 100,
        itemUnitPrice: 30.0,
        fulfilledQty: 100,
        remainingQty: 0,
        fulfilmentStatus: 'Completed',
      });
    } else if (titleLower.includes('so-0002') || line3Lower.includes('c-1002')) {
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
      <SalesInvoiceScreen
        orderNumber={selectedInvoice.soNumber}
        customerName={selectedInvoice.customerName}
        invoiceNumber={selectedInvoice.invoiceNumber}
        total={selectedInvoice.total}
        onBack={() => setSelectedInvoice(null)}
      />
    );
  }

  if (selectedExpense) {
    return (
      <ExpenseDetailScreen
        scope={{ warehouseId: undefined, warehouseName: 'All Warehouses' }}
        can={can ?? (() => true)}
        expenseId={selectedExpense.expenseCode}
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
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={adminColors.muted}
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
        <Text style={styles.counterText}>5 items · 3 warehouses</Text>

        {/* ── Events List ── */}
        {filteredItems.map((item) => {
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
              onPress={() => {
                setSelectedCardId(item.id);
                handleViewDetails(item);
              }}
              activeOpacity={0.8}
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

              {/* Action row with "View Details" button */}
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
    paddingTop: adminSpacing.md,
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
    ...adminType.title,
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
    borderColor: adminColors.border,
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
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterIconButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    ...adminType.caption,
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
    borderColor: adminColors.border,
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
    ...adminType.rowTitle,
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
    backgroundColor: adminColors.canvas,
  },
  badgeText: {
    ...adminType.caption,
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
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 2,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 4,
  },
  actionBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
});
