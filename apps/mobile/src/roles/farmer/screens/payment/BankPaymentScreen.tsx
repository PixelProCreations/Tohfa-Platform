import React, { useEffect } from 'react';
import {
  BackHandler,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P } from '../../theme';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGray800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleIcon({ size = 18, color = P.twBlue700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="8" r="1.2" fill={color} />
    </Svg>
  );
}

function BankColumnsIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 4l9 5.5v2H3v-2z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Line x1="6" y1="11.5" x2="6" y2="18.5" stroke={color} strokeWidth="1.8" />
      <Line x1="10" y1="11.5" x2="10" y2="18.5" stroke={color} strokeWidth="1.8" />
      <Line x1="14" y1="11.5" x2="14" y2="18.5" stroke={color} strokeWidth="1.8" />
      <Line x1="18" y1="11.5" x2="18" y2="18.5" stroke={color} strokeWidth="1.8" />
      <Path d="M2 19h20v2H2v-2z" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function QrCodeIcon({ size = 22, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.8" />
      <Rect x="14" y="4" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.8" />
      <Rect x="4" y="14" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="7" cy="7" r="1" fill={color} />
      <Circle cx="17" cy="7" r="1" fill={color} />
      <Circle cx="7" cy="17" r="1" fill={color} />
      <Path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" fill={color} />
    </Svg>
  );
}

function ReceiptDocIcon({ size = 22, color = P.twBlue700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="3" width="14" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Line x1="8.5" y1="8" x2="15.5" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8.5" y1="12" x2="15.5" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8.5" y1="16" x2="12.5" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function WalletIcon({ size = 22, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M16 12h5v4h-5a2 2 0 010-4z" stroke={color} strokeWidth="1.8" />
      <Circle cx="18" cy="14" r="1" fill={color} />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Component Props ──────────────────────────────────────────────────────────

export interface BankPaymentScreenProps {
  onBack?: () => void;
  onNavigateToBankAccount?: () => void;
  onNavigateToUpiId?: () => void;
  onNavigateToPayoutHistory?: () => void;
  onNavigateToWallet?: () => void;
}

export function BankPaymentScreen({
  onBack,
  onNavigateToBankAccount,
  onNavigateToUpiId,
  onNavigateToPayoutHistory,
  onNavigateToWallet,
}: BankPaymentScreenProps): React.JSX.Element {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onBack]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.twGreen800} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Bank & Payment</Text>
            <Text style={styles.headerSubtitle}>Manage how you receive payouts</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.noticeBanner}>
          <View style={styles.noticeIconCol}>
            <InfoCircleIcon size={20} color={P.twBlue700} />
          </View>
          <Text style={styles.noticeText}>
            Bank and UPI details are verified manually by TOHFA Admin before they can receive a payout. This can take up to 2 business days.
          </Text>
        </View>

        {/* 4 Navigation Cards */}
        <View style={styles.cardsList}>
          {/* Card 1: Bank Account */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={onNavigateToBankAccount}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel="Bank Account. HDFC Bank ending in 4821. Verified."
          >
            <View style={[styles.iconBox, { backgroundColor: P.twGreen50 }]}>
              <BankColumnsIcon size={22} color={P.twGreen700} />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Bank Account</Text>
              <Text style={styles.cardSubtitle}>HDFC Bank • • • • 4821</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            </View>

            <ChevronRightIcon size={18} color={P.twGray400} />
          </TouchableOpacity>

          {/* Card 2: UPI ID */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={onNavigateToUpiId}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel="UPI ID. murugan.r at okhdfcbank. Pending Verification."
          >
            <View style={[styles.iconBox, { backgroundColor: P.twAmber50 }]}>
              <QrCodeIcon size={22} color={P.twAmber800} />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>UPI ID</Text>
              <Text style={styles.cardSubtitle}>murugan.r@okhdfcbank</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending Verification</Text>
              </View>
            </View>

            <ChevronRightIcon size={18} color={P.twGray400} />
          </TouchableOpacity>

          {/* Card 3: Payout History */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={onNavigateToPayoutHistory}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel="Payout History. All past and pending payouts."
          >
            <View style={[styles.iconBox, { backgroundColor: P.twBlue50 }]}>
              <ReceiptDocIcon size={22} color={P.twBlue700} />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Payout History</Text>
              <Text style={styles.cardSubtitle}>All past and pending payouts</Text>
            </View>

            <ChevronRightIcon size={18} color={P.twGray400} />
          </TouchableOpacity>

          {/* Card 4: Wallet */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={onNavigateToWallet}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel="Wallet. Balance 4250 rupees, 3 recent transactions."
          >
            <View style={[styles.iconBox, { backgroundColor: P.twAmber50 }]}>
              <WalletIcon size={22} color={P.twAmber800} />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Wallet</Text>
              <Text style={styles.cardSubtitle}>Balance: ₹4,250 · 3 recent transactions</Text>
            </View>

            <ChevronRightIcon size={18} color={P.twGray400} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 14,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.twGray50,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  noticeBanner: {
    flexDirection: 'row',
    backgroundColor: P.twBlue50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twSky200,
    padding: 14,
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  noticeIconCol: {
    marginRight: 10,
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: P.twBlue800,
    fontWeight: '500',
  },
  cardsList: {
    gap: 12,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12.5,
    fontWeight: '400',
    color: P.twGray500,
    marginTop: 3,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: P.twGreen100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGreen800,
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: P.twAmber100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twAmber900,
  },
});
