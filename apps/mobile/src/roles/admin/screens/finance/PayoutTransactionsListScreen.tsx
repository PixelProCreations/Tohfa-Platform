// Design id: M13-S04
/**
 * Payout Transactions List Screen for Accounts & Finance (Super Admin).
 *
 * Displays all farmer payout transactions, status badges (Completed, Awaiting approval,
 * Processing, Failed), payment method details, and allows navigating into individual
 * payout approval / transaction details.
 *
 * Strictly follows admin design tokens (adminColors, adminRadius, adminSpacing, adminType).
 * No raw hex or rgba color literals.
 */
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  OverviewCardsGrid,
  OverviewDashboardCard,
} from '../../components/OverviewDashboardCard';
import {
  ChevronRightIcon,
  SearchIcon,
} from '../../components/AdminIcons';
import { PurchaseOrderPayoutScreen } from '../sales/PurchaseOrderPayoutScreen';
import type { PurchaseOrderRecord } from '../sales/PurchaseSalesOrdersScreen';
import { WalletScreen } from '../warehouse/wallet-cashtopup/WalletParts';

export interface PayoutTransactionItem {
  id: string;
  payoutNumber: string;
  farmerName: string;
  farmerId: string;
  produceName: string;
  quantityKg: number;
  amount: number;
  paymentMode: 'NEFT' | 'IMPS' | 'UPI' | 'Bank Transfer';
  bankName: string;
  accountMasked: string;
  dateStr: string;
  status: 'Completed' | 'Awaiting approval' | 'Processing' | 'Failed';
  orderRecord: PurchaseOrderRecord;
}

const PAYOUT_TRANSACTIONS_DATA: PayoutTransactionItem[] = [
  {
    id: 'pt-1',
    payoutNumber: 'PY-0002',
    farmerName: 'Kumar',
    farmerId: 'FMR-00098',
    produceName: 'Beans',
    quantityKg: 300,
    amount: 18000,
    paymentMode: 'NEFT',
    bankName: 'HDFC Bank',
    accountMasked: '****0123',
    dateStr: '8 Oct 2026, 11:20 AM',
    status: 'Awaiting approval',
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
    id: 'pt-2',
    payoutNumber: 'PY-0001',
    farmerName: 'Rajesh',
    farmerId: 'FMR-00045',
    produceName: 'Potato',
    quantityKg: 60,
    amount: 3300,
    paymentMode: 'IMPS',
    bankName: 'State Bank of India',
    accountMasked: '****4821',
    dateStr: '5 Oct 2026, 02:45 PM',
    status: 'Completed',
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
    id: 'pt-3',
    payoutNumber: 'PY-0003',
    farmerName: 'Vijay Anand',
    farmerId: 'FMR-00234',
    produceName: 'Cabbage',
    quantityKg: 200,
    amount: 8200,
    paymentMode: 'Bank Transfer',
    bankName: 'ICICI Bank',
    accountMasked: '****1920',
    dateStr: '4 Oct 2026, 04:15 PM',
    status: 'Completed',
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
    id: 'pt-4',
    payoutNumber: 'PY-0005',
    farmerName: 'Kumar Village Farm',
    farmerId: 'FMR-00098',
    produceName: 'Beans',
    quantityKg: 60,
    amount: 3300,
    paymentMode: 'Bank Transfer',
    bankName: 'HDFC Bank',
    accountMasked: '****0123',
    dateStr: '6 Oct 2026, 09:30 AM',
    status: 'Failed',
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
    id: 'pt-5',
    payoutNumber: 'PY-0006',
    farmerName: 'Selvi B.',
    farmerId: 'FMR-00142',
    produceName: 'Carrot',
    quantityKg: 240,
    amount: 12600,
    paymentMode: 'NEFT',
    bankName: 'Canara Bank',
    accountMasked: '****7712',
    dateStr: '9 Oct 2026, 03:00 PM',
    status: 'Processing',
    orderRecord: {
      id: 'po-sel-6',
      poNumber: 'PO-0016',
      payoutId: 'PY-0006',
      farmerId: 'FMR-00142',
      farmerName: 'Selvi B.',
      produceName: 'Carrot',
      grade: 'Grade 1',
      quantityKg: 240,
      unitPrice: 52.5,
      totalPrice: 12600,
      warehouse: 'Main Warehouse, Ooty',
      dateStr: '9 Oct 2026',
      purchaseStatus: 'Open',
      receiptStatus: 'Completed',
      payoutStatus: 'Awaiting approval',
      goodsReceiptId: 'GR-0016',
      listingCode: 'LST-2916',
    },
  },
  {
    id: 'pt-6',
    payoutNumber: 'PY-0007',
    farmerName: 'Ramasamy S.',
    farmerId: 'FMR-00189',
    produceName: 'Broccoli',
    quantityKg: 180,
    amount: 15400,
    paymentMode: 'NEFT',
    bankName: 'State Bank of India',
    accountMasked: '****3390',
    dateStr: '10 Oct 2026, 01:10 PM',
    status: 'Awaiting approval',
    orderRecord: {
      id: 'po-ram-7',
      poNumber: 'PO-0017',
      payoutId: 'PY-0007',
      farmerId: 'FMR-00189',
      farmerName: 'Ramasamy S.',
      produceName: 'Broccoli',
      grade: 'Grade 1',
      quantityKg: 180,
      unitPrice: 85.5,
      totalPrice: 15400,
      warehouse: 'Coonoor Warehouse',
      dateStr: '10 Oct 2026',
      purchaseStatus: 'Open',
      receiptStatus: 'Completed',
      payoutStatus: 'Awaiting approval',
      goodsReceiptId: 'GR-0017',
      listingCode: 'LST-2917',
    },
  },
];

type StatusFilter = 'All' | 'Completed' | 'Awaiting approval' | 'Processing' | 'Failed';

export interface PayoutTransactionsListScreenProps {
  onBack: () => void;
}

export function PayoutTransactionsListScreen({ onBack }: PayoutTransactionsListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>('All');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderRecord | null>(null);

  const filteredItems = useMemo(() => {
    return PAYOUT_TRANSACTIONS_DATA.filter((item) => {
      const matchesFilter = selectedFilter === 'All' || item.status === selectedFilter;
      if (!matchesFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.payoutNumber.toLowerCase().includes(q) ||
        item.farmerName.toLowerCase().includes(q) ||
        item.produceName.toLowerCase().includes(q) ||
        item.bankName.toLowerCase().includes(q) ||
        item.paymentMode.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedFilter]);

  if (selectedOrder) {
    return (
      <PurchaseOrderPayoutScreen
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
      />
    );
  }

  const totalAmount = PAYOUT_TRANSACTIONS_DATA.reduce((acc, curr) => acc + curr.amount, 0);
  const completedCount = PAYOUT_TRANSACTIONS_DATA.filter((i) => i.status === 'Completed').length;
  const awaitingCount = PAYOUT_TRANSACTIONS_DATA.filter((i) => i.status === 'Awaiting approval').length;
  const failedCount = PAYOUT_TRANSACTIONS_DATA.filter((i) => i.status === 'Failed').length;

  return (
    <WalletScreen
      title="Payout Transactions list"
      subtitle="Super Admin · Disbursals & Settlements"
      onBack={onBack}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI Grid using Reusable OverviewDashboardCard */}
        <OverviewCardsGrid style={styles.kpiGrid}>
          <OverviewDashboardCard
            value={`₹${totalAmount.toLocaleString('en-IN')}`}
            title="Total Disbursed"
            subtitle="Settled amounts"
            icon="wallet"
            preserveCase
          />
          <OverviewDashboardCard
            value={String(completedCount)}
            title="Completed"
            subtitle="Successful payouts"
            icon="clipboard"
            tone="success"
            preserveCase
          />
          <OverviewDashboardCard
            value={String(awaitingCount)}
            title="Awaiting"
            subtitle="Pending review"
            icon="clock"
            tone="warning"
            preserveCase
          />
          <OverviewDashboardCard
            value={String(failedCount)}
            title="Failed"
            subtitle="Requires retry"
            icon="alert"
            tone="danger"
            preserveCase
          />
        </OverviewCardsGrid>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={adminColors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by PY#, farmer, or produce"
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Status Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
          {(['All', 'Completed', 'Awaiting approval', 'Processing', 'Failed'] as StatusFilter[]).map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* List of Payout Transactions */}
        <View style={styles.listContainer}>
          {filteredItems.map((item) => {
            const isCompleted = item.status === 'Completed';
            const isAwaiting = item.status === 'Awaiting approval';
            const isFailed = item.status === 'Failed';

            const badgeBg = isCompleted
              ? adminColors.success.bg
              : isAwaiting
              ? adminColors.brandTint
              : isFailed
              ? adminColors.danger.bg
              : adminColors.warning.bg;

            const badgeText = isCompleted
              ? adminColors.success.text
              : isAwaiting
              ? adminColors.brandDeep
              : isFailed
              ? adminColors.danger.text
              : adminColors.warning.text;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.transactionCard}
                onPress={() => setSelectedOrder(item.orderRecord)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={styles.headerTitleGroup}>
                    <Text style={styles.payoutNumber}>{item.payoutNumber}</Text>
                    <Text style={styles.farmerName}>· {item.farmerName}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.statusBadgeText, { color: badgeText }]}>{item.status}</Text>
                  </View>
                </View>

                <View style={styles.amountProduceRow}>
                  <Text style={styles.amountText}>₹{item.amount.toLocaleString('en-IN')}</Text>
                  <Text style={styles.produceText}>
                    {item.produceName} ({item.quantityKg} kg)
                  </Text>
                </View>

                <View style={styles.cardFooterRow}>
                  <Text style={styles.bankDetailText}>
                    {item.bankName} ({item.paymentMode}) · {item.accountMasked}
                  </Text>
                  <Text style={styles.dateText}>{item.dateStr.split(',')[0]}</Text>
                </View>

                <View style={styles.chevronHint}>
                  <ChevronRightIcon size={16} color={adminColors.muted} />
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredItems.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No payout transactions found.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl * 2,
    gap: adminSpacing.md,
  },
  kpiGrid: {
    marginBottom: adminSpacing.xs,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  kpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  kpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  searchInput: {
    ...adminType.body,
    flex: 1,
    color: adminColors.ink,
    paddingVertical: adminSpacing.sm,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: adminSpacing.xs,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
  },
  listContainer: {
    gap: adminSpacing.sm,
    marginTop: adminSpacing.xs,
  },
  transactionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: adminSpacing.xs,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  payoutNumber: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  farmerName: {
    ...adminType.body,
    color: adminColors.muted,
  },
  statusBadge: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    borderRadius: adminRadius.sm,
  },
  statusBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  amountProduceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  amountText: {
    ...adminType.title,
    color: adminColors.brandDeep,
  },
  produceText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  bankDetailText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  dateText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  chevronHint: {
    position: 'absolute',
    right: adminSpacing.md,
    top: '50%',
  },
  emptyState: {
    padding: adminSpacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    ...adminType.body,
    color: adminColors.muted,
  },
});
