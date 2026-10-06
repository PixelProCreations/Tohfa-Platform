import React from 'react';
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
import Svg, { Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerBg: '#F0562A',
  bannerBg: '#F0562A', // Exact vibrant brand orange theme
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  orangeDeep: '#7A2E14',
  greenText: '#1E8E5A',
  redText: '#D32F2F',
  noticeBg: '#FAF8F5',
  noticeBorder: '#EEDCD3',
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

function WalletIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="2.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 9.5h18" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Rect x="13.5" y="12.5" width="4.5" height="3.5" rx="1" stroke={color} strokeWidth="1.6" />
    </Svg>
  );
}

export interface WalletSummaryScreenProps {
  customerName?: string;
  onBack?: () => void;
  onCashTopUp?: () => void;
}

export function WalletSummaryScreen({
  customerName = 'Rajesh Kumar',
  onBack,
  onCashTopUp,
}: WalletSummaryScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Wallet Summary</Text>
        </View>
        <Text style={styles.headerSubtitle}>{customerName}</Text>
      </View>

      <View style={styles.bodyContainer}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollPad}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Terracotta Available Balance Card */}
          <View style={styles.balanceBanner}>
            <Text style={styles.balanceAmount}>₹1,250</Text>
            <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
          </View>

          {/* Stats Summary Card */}
          <View style={styles.card}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Credited</Text>
              <Text style={styles.statValue}>₹10,500</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabelHighlight}>Current Balance</Text>
              <Text style={styles.statValueHighlight}>₹1,250</Text>
            </View>
          </View>

          {/* ─── Recent Transactions ─── */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.txRow}>
              <Text style={styles.txCreditText}>+ ₹500 · Cash Top-Up</Text>
              <Text style={styles.txDate}>24 Sep</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.txRow}>
              <Text style={styles.txDebitText}>- ₹200 · Order Payment</Text>
              <Text style={styles.txDate}>23 Sep</Text>
            </View>
          </View>

          {/* Disclaimer Note */}
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              No Edit Balance field or Save Balance button — wallet credit only happens server-side via Module 8.
            </Text>
          </View>
        </ScrollView>

        {/* Pinned Bottom Bar matching Left Design */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.topUpBtn}
            onPress={onCashTopUp}
            activeOpacity={0.8}
          >
            <WalletIcon size={18} color="#FFFFFF" />
            <Text style={styles.topUpBtnText}>Cash Top-Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
    marginLeft: 38,
    fontWeight: '500',
  },
  bodyContainer: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  balanceBanner: {
    backgroundColor: PALETTE.bannerBg,
    borderRadius: 14, // LG 14px from Design System PDF
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    opacity: 0.9,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  statValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  statLabelHighlight: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
  },
  statValueHighlight: {
    fontSize: 14.5,
    fontWeight: '900',
    color: PALETTE.orangeDeep,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 12,
  },
  sectionHeaderRow: {
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txCreditText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  txDebitText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.redText,
  },
  txDate: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  disclaimerBox: {
    backgroundColor: PALETTE.noticeBg,
    borderColor: PALETTE.noticeBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 11.5,
    lineHeight: 16,
    color: PALETTE.textSecondary,
  },
  topUpBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12, // MD 12px from Design System PDF
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  topUpBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bottomBar: {
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 16 : 24,
  },
});
