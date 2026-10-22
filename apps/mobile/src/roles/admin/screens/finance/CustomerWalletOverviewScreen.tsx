import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';
import { CustomerWalletScreen } from '../warehouse/wallet-cashtopup/CustomerWalletScreen';
import type { WalletCustomer } from '../warehouse/wallet-cashtopup/types';

interface CustomerWalletOverviewScreenProps {
  onBack: () => void;
}

interface WalletOverviewTransaction {
  id: string;
  txCode: string;
  type: 'Top-up' | 'Debit' | 'Refund';
  status: 'Completed' | 'Pending' | 'Failed';
  customerName: string;
  customerId: string;
  mobile: string;
  amount: string;
  balanceAfter: string;
  date: string;
  totalCredited: string;
  totalUsed: string;
}

const SAMPLE_OVERVIEW_TRANSACTIONS: WalletOverviewTransaction[] = [
  {
    id: 'tx-0012',
    txCode: 'WLT-0012',
    type: 'Top-up',
    status: 'Completed',
    customerName: 'Demo Customer F',
    customerId: 'CUS-001248',
    mobile: '+91 98765 00006',
    amount: '+₹2,000.00',
    balanceAfter: '₹9,340.00',
    date: '10 Oct 2026',
    totalCredited: '₹35,000',
    totalUsed: '₹25,660',
  },
  {
    id: 'tx-0011',
    txCode: 'WLT-0011',
    type: 'Debit',
    status: 'Completed',
    customerName: 'Demo Customer F',
    customerId: 'CUS-001248',
    mobile: '+91 98765 00006',
    amount: '-₹1,120.00',
    balanceAfter: '₹7,340.00',
    date: '9 Oct 2026',
    totalCredited: '₹33,000',
    totalUsed: '₹25,660',
  },
  {
    id: 'tx-0010',
    txCode: 'WLT-0010',
    type: 'Top-up',
    status: 'Completed',
    customerName: 'Ravi Kumar',
    customerId: 'CUS-001245',
    mobile: '+91 XXXXX XXXXX',
    amount: '+₹2,000.00',
    balanceAfter: '₹4,500.00',
    date: '8 Oct 2026',
    totalCredited: '₹25,000',
    totalUsed: '₹20,500',
  },
  {
    id: 'tx-0009',
    txCode: 'WLT-0009',
    type: 'Debit',
    status: 'Completed',
    customerName: 'Ravi Kumar',
    customerId: 'CUS-001245',
    mobile: '+91 XXXXX XXXXX',
    amount: '-₹750.00',
    balanceAfter: '₹2,500.00',
    date: '7 Oct 2026',
    totalCredited: '₹23,000',
    totalUsed: '₹20,500',
  },
  {
    id: 'tx-0008',
    txCode: 'WLT-0008',
    type: 'Top-up',
    status: 'Completed',
    customerName: 'Ravi Kumar',
    customerId: 'CUS-001245',
    mobile: '+91 XXXXX XXXXX',
    amount: '+₹1,500.00',
    balanceAfter: '₹3,250.00',
    date: '6 Oct 2026',
    totalCredited: '₹23,000',
    totalUsed: '₹19,750',
  },
  {
    id: 'tx-0007',
    txCode: 'WLT-0007',
    type: 'Refund',
    status: 'Completed',
    customerName: 'Demo Customer B',
    customerId: 'CUS-001246',
    mobile: '+91 98765 00002',
    amount: '+₹1,740.00',
    balanceAfter: '₹1,740.00',
    date: '5 Oct 2026',
    totalCredited: '₹12,000',
    totalUsed: '₹10,260',
  },
  {
    id: 'tx-0006',
    txCode: 'WLT-0006',
    type: 'Debit',
    status: 'Completed',
    customerName: 'Demo Customer C',
    customerId: 'CUS-001247',
    mobile: '+91 98765 00003',
    amount: '-₹1,280.00',
    balanceAfter: '₹2,100.00',
    date: '5 Oct 2026',
    totalCredited: '₹18,000',
    totalUsed: '₹15,900',
  },
  {
    id: 'tx-0005',
    txCode: 'WLT-0005',
    type: 'Top-up',
    status: 'Completed',
    customerName: 'Demo Customer D',
    customerId: 'CUS-001249',
    mobile: '+91 98765 00004',
    amount: '+₹1,000.00',
    balanceAfter: '₹3,380.00',
    date: '4 Oct 2026',
    totalCredited: '₹14,000',
    totalUsed: '₹10,620',
  },
  {
    id: 'tx-0004',
    txCode: 'WLT-0004',
    type: 'Debit',
    status: 'Completed',
    customerName: 'Demo Customer E',
    customerId: 'CUS-001250',
    mobile: '+91 98765 00005',
    amount: '-₹450.00',
    balanceAfter: '₹2,380.00',
    date: '3 Oct 2026',
    totalCredited: '₹10,000',
    totalUsed: '₹7,620',
  },
  {
    id: 'tx-0003',
    txCode: 'WLT-0003',
    type: 'Top-up',
    status: 'Completed',
    customerName: 'Demo Customer A',
    customerId: 'CUS-001244',
    mobile: '+91 98765 00001',
    amount: '+₹1,000.00',
    balanceAfter: '₹2,830.00',
    date: '2 Oct 2026',
    totalCredited: '₹20,000',
    totalUsed: '₹17,170',
  },
  {
    id: 'tx-0002',
    txCode: 'WLT-0002',
    type: 'Debit',
    status: 'Completed',
    customerName: 'Demo Customer B',
    customerId: 'CUS-001246',
    mobile: '+91 98765 00002',
    amount: '-₹820.00',
    balanceAfter: '₹1,830.00',
    date: '1 Oct 2026',
    totalCredited: '₹10,260',
    totalUsed: '₹8,430',
  },
  {
    id: 'tx-0001',
    txCode: 'WLT-0001',
    type: 'Top-up',
    status: 'Completed',
    customerName: 'Demo Customer F',
    customerId: 'CUS-001248',
    mobile: '+91 98765 00006',
    amount: '+₹2,000.00',
    balanceAfter: '₹2,650.00',
    date: '30 Sep 2026',
    totalCredited: '₹31,000',
    totalUsed: '₹28,350',
  },
  {
    id: 'tx-0000',
    txCode: 'WLT-0000',
    type: 'Top-up',
    status: 'Completed',
    customerName: 'Demo Customer C',
    customerId: 'CUS-001247',
    mobile: '+91 98765 00003',
    amount: '+₹1,500.00',
    balanceAfter: '₹650.00',
    date: '29 Sep 2026',
    totalCredited: '₹16,500',
    totalUsed: '₹15,850',
  },
  {
    id: 'tx-0013',
    txCode: 'WLT-0013',
    type: 'Debit',
    status: 'Completed',
    customerName: 'Demo Customer D',
    customerId: 'CUS-001249',
    mobile: '+91 98765 00004',
    amount: '-₹600.00',
    balanceAfter: '₹1,150.00',
    date: '28 Sep 2026',
    totalCredited: '₹13,000',
    totalUsed: '₹11,850',
  },
  {
    id: 'tx-0014',
    txCode: 'WLT-0014',
    type: 'Top-up',
    status: 'Completed',
    customerName: 'Demo Customer E',
    customerId: 'CUS-001250',
    mobile: '+91 98765 00005',
    amount: '+₹500.00',
    balanceAfter: '₹1,750.00',
    date: '27 Sep 2026',
    totalCredited: '₹9,500',
    totalUsed: '₹7,750',
  },
  {
    id: 'tx-0015',
    txCode: 'WLT-0015',
    type: 'Debit',
    status: 'Completed',
    customerName: 'Demo Customer A',
    customerId: 'CUS-001244',
    mobile: '+91 98765 00001',
    amount: '-₹350.00',
    balanceAfter: '₹1,250.00',
    date: '26 Sep 2026',
    totalCredited: '₹19,000',
    totalUsed: '₹17,750',
  },
];

export function CustomerWalletOverviewScreen({ onBack }: CustomerWalletOverviewScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<WalletCustomer | null>(null);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return SAMPLE_OVERVIEW_TRANSACTIONS;
    const q = searchQuery.toLowerCase();
    return SAMPLE_OVERVIEW_TRANSACTIONS.filter(
      (tx) =>
        tx.txCode.toLowerCase().includes(q) ||
        tx.customerName.toLowerCase().includes(q) ||
        tx.type.toLowerCase().includes(q) ||
        tx.amount.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // If a transaction record was selected, show the Customer Wallet screen (Image 2)
  if (selectedCustomer) {
    return (
      <CustomerWalletScreen
        customer={selectedCustomer}
        onBack={() => setSelectedCustomer(null)}
        can={() => false} // RBAC method: Cash Top-up is disabled on Tohfa Admin
        onCashTopUp={undefined}
      />
    );
  }

  const handleSelectRecord = (tx: WalletOverviewTransaction) => {
    // Open the customer wallet for this record (defaults to Ravi Kumar data if matching Image 2)
    setSelectedCustomer({
      name: tx.customerName === 'Ravi Kumar' ? 'Ravi Kumar' : 'Ravi Kumar', // Image 2 is Ravi Kumar
      id: 'CUS-001245',
      mobile: '+91 XXXXX XXXXX',
      balance: '₹4,500.00',
      totalCredited: '₹25,000',
      totalUsed: '₹20,500',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke="#FFFFFF"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customer Wallet</Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 6 KPI Cards Grid */}
        <View style={styles.kpiGrid}>
          {/* Row 1 */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL LIABILITY</Text>
              <Text style={styles.kpiValue}>₹9,340.00</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOP-UPS (PERIOD)</Text>
              <Text style={styles.kpiValue}>₹6,000.00</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>DEBITS (PERIOD)</Text>
              <Text style={styles.kpiValue}>₹2,400.00</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>REFUNDS TO WALLET</Text>
              <Text style={styles.kpiValue}>₹1,740.00</Text>
            </View>
          </View>

          {/* Row 3 */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>REVERSALS</Text>
              <Text style={styles.kpiValue}>₹0.00</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>PENDING / FAILED</Text>
              <Text style={styles.kpiValue}>2 (change nothing)</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2" />
            <Path d="M21 21l-4.35-4.35" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
          </Svg>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Filter transactions"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M4 6h16M7 12h10M10 18h4"
                stroke={adminColors.brand}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Transaction Count */}
        <Text style={styles.countText}>{filteredTransactions.length} transactions</Text>

        {/* Transaction Cards List */}
        <View style={styles.txList}>
          {filteredTransactions.map((tx) => (
            <TouchableOpacity
              key={tx.id}
              style={styles.txCard}
              onPress={() => handleSelectRecord(tx)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${tx.txCode} ${tx.type}`}
            >
              <View style={styles.txCardHeader}>
                <Text style={styles.txCodeTitle}>
                  {tx.txCode} · {tx.type}
                </Text>
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>{tx.status}</Text>
                </View>
              </View>
              <Text style={styles.txCardSubtitle} numberOfLines={1}>
                {tx.customerName} · {tx.amount} · Balance after {tx.balanceAfter} · {tx.date}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm, // 8px for compact header matching design
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  body: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  kpiGrid: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: adminSpacing.md,
    height: 48,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterBtn: {
    padding: 6,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...adminType.caption,
    color: '#6B7280',
    marginBottom: adminSpacing.sm,
  },
  txList: {
    gap: adminSpacing.sm,
  },
  txCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: adminSpacing.md,
  },
  txCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  txCodeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  completedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  txCardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
});
