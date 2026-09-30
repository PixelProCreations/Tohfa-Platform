import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens (#F0562A Existing Orange Palette) ─────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  balanceCardBg: '#F0562A',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#7A726C',
  border:        '#F0ECE3',
  divider:       '#F0ECE3',
  greenAmount:   '#1E8E5A',
  redAmount:     '#DC2626',
  noticeBg:      '#FFF1F2',
  noticeBorder:  '#FECDD3',
  noticeText:    '#BE123C',
};

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

function LockNoticeIcon({ size = 18, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 11a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 9V6a4 4 0 0 1 8 0v3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CashBanknoteIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 7h18a2 2 0 012 2v8a2 2 0 01-2 2H2a2 2 0 01-2-2V9a2 2 0 012-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 15a2 2 0 100-4 2 2 0 000 4zM6 11h.01M18 11h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface SubWarehouseCustomerWalletScreenProps {
  customerName?: string;
  onBack: () => void;
  onCashTopUp?: () => void;
}

export function SubWarehouseCustomerWalletScreen({
  customerName = 'Rajesh Kumar',
  onBack,
  onCashTopUp,
}: SubWarehouseCustomerWalletScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Wallet</Text>
            <Text style={styles.headerSubtitle}>{customerName}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Balance Hero Card (Solid Orange) ─── */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceAmount}>₹1,250</Text>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
        </View>

        {/* ─── Wallet Summary ─── */}
        <Text style={styles.sectionHeading}>Wallet Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Credited</Text>
            <Text style={styles.summaryVal}>₹10,500</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Used</Text>
            <Text style={styles.summaryVal}>₹9,250</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryBoldLabel}>Current Balance</Text>
            <Text style={styles.summaryBoldVal}>₹1,250</Text>
          </View>
        </View>

        {/* ─── Recent Transactions ─── */}
        <Text style={styles.sectionHeading}>Recent Transactions</Text>
        <View style={styles.transactionsCard}>
          {/* Tx 1 */}
          <View style={styles.txRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.txAmount, { color: PALETTE.greenAmount }]}>+ ₹500</Text>
              <Text style={styles.txSub}>Cash Top-Up</Text>
            </View>
            <Text style={styles.txDate}>24 Sep</Text>
          </View>

          <View style={styles.divider} />

          {/* Tx 2 */}
          <View style={styles.txRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.txAmount, { color: PALETTE.redAmount }]}>- ₹200</Text>
              <Text style={styles.txSub}>Order Payment</Text>
            </View>
            <Text style={styles.txDate}>24 Sep</Text>
          </View>

          <View style={styles.divider} />

          {/* Tx 3 */}
          <View style={styles.txRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.txAmount, { color: PALETTE.greenAmount }]}>+ ₹1,000</Text>
              <Text style={styles.txSub}>Cash Top-Up</Text>
            </View>
            <Text style={styles.txDate}>20 Sep</Text>
          </View>
        </View>

        {/* ─── Module Notice Box ─── */}
        <View style={styles.noticeBox}>
          <View style={styles.noticeIconWrap}>
            <LockNoticeIcon size={16} color="#DC2626" />
          </View>
          <Text style={styles.noticeText}>
            No Edit Balance / Set Balance / Adjust Wallet Balance action exists anywhere on this
            screen. Cash top-up happens through the authorized transaction flow in Module 8.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ─── Bottom Cash Top-Up Action Bar ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cashTopUpBtn}
          onPress={onCashTopUp || (() => Alert.alert('Cash Top-Up', `Opening Cash Top-Up flow for ${customerName}`))}
          activeOpacity={0.8}
        >
          <CashBanknoteIcon size={20} color="#FFFFFF" />
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
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.95,
    marginTop: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    backgroundColor: PALETTE.pageBg,
  },
  balanceCard: {
    backgroundColor: PALETTE.balanceCardBg,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  balanceAmount: {
    fontFamily: 'Poppins',
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  balanceLabel: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: 0.8,
  },
  sectionHeading: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 8,
  },
  summaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    color: PALETTE.textSecondary,
  },
  summaryVal: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  summaryBoldLabel: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  summaryBoldVal: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  transactionsCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  txAmount: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
  },
  txSub: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  txDate: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },
  noticeBox: {
    backgroundColor: PALETTE.noticeBg,
    borderWidth: 1,
    borderColor: PALETTE.noticeBorder,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  noticeIconWrap: {
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 11,
    color: PALETTE.noticeText,
    lineHeight: 16,
    fontWeight: '500',
  },
  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  cashTopUpBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cashTopUpBtnText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
