import React, { useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
  SubWarehouseTransactionDetailScreen,
  type TransactionDetailData,
} from './SubWarehouseTransactionDetailScreen';

const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#6B7280',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',

  greenAmount:   '#059669',
  redAmount:     '#DC2626',
  redCalloutBg:  '#FFF1F2',
  redCalloutBorder:'#FECDD3',
  redCalloutText:'#BE123C',
};

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

function CashIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function LockIcon({ size = 16, color = '#BE123C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface SubWarehouseCustomerWalletScreenProps {
  onBack?: () => void;
  onNavigateToCashTopUp?: () => void;
  onNavigateToTransactionDetail?: (data: TransactionDetailData) => void;
  customer?: {
    name: string;
    id: string;
    mobile: string;
    balance: string;
    totalCredited: string;
    totalUsed: string;
  };
}

export function SubWarehouseCustomerWalletScreen({
  onBack,
  onNavigateToCashTopUp,
  onNavigateToTransactionDetail,
  customer = {
    name: 'Ravi Kumar',
    id: 'CUS-001245',
    mobile: '+91 XXXXX XXXXX',
    balance: '₹4,500.00',
    totalCredited: '₹25,000',
    totalUsed: '₹20,500',
  },
}: SubWarehouseCustomerWalletScreenProps) {
  const [selectedTx, setSelectedTx] = useState<TransactionDetailData | null>(null);

  const handleOpenTransaction = (tx: TransactionDetailData) => {
    if (onNavigateToTransactionDetail) {
      onNavigateToTransactionDetail(tx);
    } else {
      setSelectedTx(tx);
    }
  };

  if (selectedTx) {
    return (
      <SubWarehouseTransactionDetailScreen
        details={selectedTx}
        onBack={() => setSelectedTx(null)}
      />
    );
  }
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowBackIcon size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Wallet</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Top Card */}
        <View style={styles.customerCard}>
          <Text style={styles.custName}>{customer.name}</Text>
          <Text style={styles.custId}>Customer ID: {customer.id}</Text>
          <Text style={styles.custMobileLabel}>Mobile</Text>
          <Text style={styles.custMobileValue}>{customer.mobile}</Text>
        </View>

        {/* Large Balance Banner Card */}
        <View style={styles.balanceBanner}>
          <Text style={styles.balanceAmount}>{customer.balance}</Text>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
        </View>

        {/* Wallet Summary */}
        <Text style={styles.sectionTitle}>Wallet Summary</Text>
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Credited</Text>
            <Text style={styles.summaryValue}>{customer.totalCredited}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Used</Text>
            <Text style={styles.summaryValue}>{customer.totalUsed}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.currentBalanceLabel}>Current Balance</Text>
            <Text style={styles.currentBalanceValue}>{customer.balance.split('.')[0]}</Text>
          </View>
        </View>

        {/* Recent Wallet Transactions */}
        <Text style={styles.sectionTitle}>Recent Wallet Transactions</Text>
        <View style={styles.card}>
          {/* Item 1 - Cash Top-Up (Opens Transaction Detail screen from screenshot) */}
          <TouchableOpacity
            style={styles.txRow}
            onPress={() =>
              handleOpenTransaction({
                transactionId: 'WT-20260925-001245',
                type: 'Cash Top-Up',
                amount: '₹2,000',
                previousBalance: '₹2,500',
                newBalance: '₹4,500',
                dateTime: 'Today, 10:42 AM',
                status: 'Completed',
                warehouse: 'Coonoor',
                processedBy: 'SWA – Suresh',
                referenceId: 'FC-20260925-0012',
              })
            }
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.txTypeGreen}>Cash Top-Up</Text>
              <Text style={styles.txDate}>Today, 10:42 AM</Text>
            </View>
            <Text style={styles.txAmountGreen}>+₹2,000</Text>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Item 2 - Purchase */}
          <TouchableOpacity
            style={styles.txRow}
            onPress={() =>
              handleOpenTransaction({
                transactionId: 'WT-20260924-001198',
                type: 'Purchase',
                amount: '-₹750',
                previousBalance: '₹5,250',
                newBalance: '₹4,500',
                dateTime: 'Yesterday, 4:20 PM',
                status: 'Completed',
                warehouse: 'Coonoor',
                processedBy: 'POS Terminal',
                referenceId: 'ORD-20260924-8831',
              })
            }
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.txTypeRed}>Purchase</Text>
              <Text style={styles.txDate}>Yesterday, 4:20 PM</Text>
            </View>
            <Text style={styles.txAmountRed}>-₹750</Text>
          </TouchableOpacity>
          <View style={styles.divider} />

          {/* Item 3 - Cash Top-Up */}
          <TouchableOpacity
            style={styles.txRow}
            onPress={() =>
              handleOpenTransaction({
                transactionId: 'WT-20260920-001150',
                type: 'Cash Top-Up',
                amount: '₹1,500',
                previousBalance: '₹1,000',
                newBalance: '₹2,500',
                dateTime: '20 Sep, 11:30 AM',
                status: 'Completed',
                warehouse: 'Coonoor',
                processedBy: 'SWA – Suresh',
                referenceId: 'FC-20260920-0044',
              })
            }
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.txTypeGreen}>Cash Top-Up</Text>
              <Text style={styles.txDate}>20 Sep, 11:30 AM</Text>
            </View>
            <Text style={styles.txAmountGreen}>+₹1,500</Text>
          </TouchableOpacity>
        </View>

        {/* Red Warning Banner (Image 2) */}
        <View style={styles.redWarningBox}>
          <LockIcon size={16} color={PALETTE.redCalloutText} />
          <Text style={styles.redWarningText}>
            No Edit Balance / Set Balance / Adjust Wallet / Manual Credit action exists anywhere on this screen.
          </Text>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Sticky Bottom Action Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cashTopUpBtn}
          onPress={onNavigateToCashTopUp}
          activeOpacity={0.85}
        >
          <CashIcon size={20} color="#FFFFFF" />
          <Text style={styles.cashTopUpBtnText}>Cash Top-Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  customerCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
  },
  custName: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  custId: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 2,
  },
  custMobileLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 10,
  },
  custMobileValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 2,
  },
  balanceBanner: {
    backgroundColor: PALETTE.primary,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  balanceLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 8,
    marginBottom: 8,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  currentBalanceLabel: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  currentBalanceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: PALETTE.textInk,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 10,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txTypeGreen: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.greenAmount,
  },
  txTypeRed: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.redAmount,
  },
  txDate: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  txAmountGreen: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.greenAmount,
  },
  txAmountRed: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.redAmount,
  },
  redWarningBox: {
    backgroundColor: PALETTE.redCalloutBg,
    borderColor: PALETTE.redCalloutBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
  },
  redWarningText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.redCalloutText,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: PALETTE.divider,
  },
  cashTopUpBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cashTopUpBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
