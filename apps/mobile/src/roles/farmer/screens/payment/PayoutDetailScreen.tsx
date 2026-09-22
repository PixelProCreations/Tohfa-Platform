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
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { authPalette as P } from '../../theme';
import type { PayoutRecord } from './PayoutHistoryScreen';

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

function HourglassIcon({ size = 28, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 3h14M5 21h14M7 3v4.5a5 5 0 002.5 4.3L12 13l2.5-1.2A5 5 0 0017 7.5V3M7 21v-4.5a5 5 0 012.5-4.3L12 11l2.5 1.2a5 5 0 012.5 4.3V21"
        stroke={color}
        strokeWidth="2"
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

export interface PayoutDetailScreenProps {
  payout?: PayoutRecord;
  onBack?: () => void;
}

export function PayoutDetailScreen({
  payout,
  onBack,
}: PayoutDetailScreenProps): React.JSX.Element {
  const current = payout ?? {
    id: 'pay-2',
    title: 'Payout to UPI',
    method: 'UPI — murugan.r@okhdfcbank',
    date: '17 Sep 2026',
    refId: 'TXN-91027',
    status: 'Processing',
    amount: '₹4,400',
    requestedOn: '17 Sep 2026, 09:20 AM',
    source: 'Wallet Withdrawal',
  };

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
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.twGreen800} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Payout Detail</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Status & Amount Card */}
        <View style={styles.amountCard}>
          <View style={styles.statusIconBox}>
            <HourglassIcon size={28} color={P.twAmber800} />
          </View>
          <Text style={styles.amountText}>{current.amount}</Text>
          <Text style={styles.statusSubtitle}>
            {current.status} · Requested {current.date}
          </Text>
        </View>

        {/* Metadata Details Table */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Method</Text>
            <Text style={styles.detailValue}>{current.method}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference ID</Text>
            <Text style={styles.detailValueMono}>{current.refId}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Requested On</Text>
            <Text style={styles.detailValue}>{current.requestedOn}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Source</Text>
            <Text style={styles.detailValue}>{current.source}</Text>
          </View>
        </View>

        {/* High-value approval policy banner */}
        <View style={styles.policyBanner}>
          <View style={styles.policyIconCol}>
            <InfoCircleIcon size={18} color={P.twBlue700} />
          </View>
          <Text style={styles.policyText}>
            Payouts above ₹10,000 need an additional TOHFA approval step before processing — this can add a short delay for larger amounts.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  scrollContainer: {
    flex: 1,
    backgroundColor: P.twGray50,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
    gap: 18,
  },
  amountCard: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusIconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: P.twAmber100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.5,
  },
  statusSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 4,
  },
  detailsCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  detailLabel: {
    fontSize: 13.5,
    color: P.twGray500,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13.5,
    color: P.twGray900,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
    paddingLeft: 12,
  },
  detailValueMono: {
    fontSize: 13.5,
    color: P.twGray900,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  policyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: P.twBlue50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twSky200,
    padding: 14,
  },
  policyIconCol: {
    marginRight: 10,
    marginTop: 2,
  },
  policyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: P.twBlue800,
    fontWeight: '500',
  },
});
