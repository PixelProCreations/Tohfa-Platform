import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  greenText: '#059669',
  redText: '#DC2626',
  balanceCardBg: '#F0562A',
  brownText: '#F0562A',
};

function ArrowBackIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 12H4M10 18l-6-6 6-6"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CashIcon({ size = 18, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="6" width="18" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface Customer {
  name: string;
  id: string;
  mobile: string;
  balance: string;
  totalCredited: string;
  totalUsed: string;
}

export interface MainWarehouseCustomerWalletScreenProps {
  customer: Customer;
  onBack: () => void;
  onNavigateToCashTopUp: () => void;
}

export function MainWarehouseCustomerWalletScreen({
  customer,
  onBack,
  onNavigateToCashTopUp,
}: MainWarehouseCustomerWalletScreenProps) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Customer Wallet</Text>
        </View>
        <Text style={styles.headerSubtitle}>{customer.name}</Text>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.balanceCard}>
            <Text style={styles.balanceAmount}>{customer.balance}</Text>
            <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Total Credited</Text>
              <Text style={styles.statValue}>{customer.totalCredited}</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Total Used</Text>
              <Text style={styles.statValue}>{customer.totalUsed}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Recent Transactions</Text>

          <View style={styles.txCard}>
            <View style={[styles.txItem, { borderBottomWidth: 1, borderBottomColor: PALETTE.border }]}>
              <Text style={[styles.txDesc, { color: PALETTE.greenText }]}>+ ₹2,000 · Cash Top-Up</Text>
              <Text style={styles.txDate}>Today</Text>
            </View>
            <View style={styles.txItem}>
              <Text style={[styles.txDesc, { color: PALETTE.redText }]}>- ₹500 · Order Payment</Text>
              <Text style={styles.txDate}>Yesterday</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onNavigateToCashTopUp} activeOpacity={0.8}>
          <CashIcon />
          <Text style={styles.primaryBtnText}>Cash Top-Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.headerOrange,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTop: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4,
  },
  backBtn: { 
    marginRight: 12,
  },
  headerTitle: { 
    fontFamily: 'Poppins',
    fontSize: 18, 
    fontWeight: '800', 
    color: '#FFFFFF',
  },
  headerSubtitle: { 
    fontFamily: 'Poppins',
    fontSize: 12, 
    color: '#FFFFFF', 
    marginLeft: 32,
    fontWeight: '600',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  balanceCard: {
    backgroundColor: PALETTE.balanceCardBg,
    borderRadius: 12,
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceAmount: { 
    fontFamily: 'Poppins',
    fontSize: 32, 
    fontWeight: '800', 
    color: '#FFFFFF', 
    marginBottom: 6,
  },
  balanceLabel: { 
    fontFamily: 'Poppins',
    fontSize: 10, 
    fontWeight: '800', 
    color: '#FFFFFF',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  statCol: { 
    flex: 1,
  },
  statLabel: { 
    fontFamily: 'Poppins',
    fontSize: 11, 
    fontWeight: '600',
    color: '#555', 
    marginBottom: 4,
  },
  statValue: { 
    fontFamily: 'Poppins',
    fontSize: 14, 
    fontWeight: '800', 
    color: PALETTE.textInk,
  },
  sectionTitle: { 
    fontFamily: 'Poppins',
    fontSize: 13, 
    fontWeight: '800', 
    color: PALETTE.brownText, 
    marginBottom: 12,
  },
  txCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  txDesc: { 
    fontFamily: 'Poppins',
    fontSize: 13, 
    fontWeight: '600',
  },
  txDate: { 
    fontFamily: 'Poppins',
    fontSize: 13, 
    color: '#000000', 
    fontWeight: '700',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  primaryBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  primaryBtnText: { 
    fontFamily: 'Poppins',
    color: '#FFFFFF', 
    fontSize: 15, 
    fontWeight: '800',
  },
});
