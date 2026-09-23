import React, { useState, useEffect } from 'react';
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

function BankColumnsIcon({ size = 20, color = P.twGreen700 }: { size?: number; color?: string }) {
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

function QrCodeIcon({ size = 20, color = P.twAmber800 }: { size?: number; color?: string }) {
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

export type PayoutStatus = 'Paid' | 'Processing' | 'Failed';

export interface PayoutRecord {
  id: string;
  title: string;
  method: string;
  date: string;
  refId: string;
  status: PayoutStatus;
  amount: string;
  requestedOn: string;
  source: string;
}

export const PAYOUT_DATA: PayoutRecord[] = [
  {
    id: 'pay-1',
    title: 'Payout to Bank • • • • 4821',
    method: 'Bank — HDFC Bank • • • • 4821',
    date: '14 Jul 2026',
    refId: 'TXN-88213',
    status: 'Paid',
    amount: '₹12,400',
    requestedOn: '14 Jul 2026, 11:15 AM',
    source: 'Wallet Withdrawal',
  },
  {
    id: 'pay-2',
    title: 'Payout to UPI',
    method: 'UPI — murugan.r@okhdfcbank',
    date: '17 Sep 2026',
    refId: 'TXN-91027',
    status: 'Processing',
    amount: '₹4,400',
    requestedOn: '17 Sep 2026, 09:20 AM',
    source: 'Wallet Withdrawal',
  },
  {
    id: 'pay-3',
    title: 'Payout to Bank • • • • 4821',
    method: 'Bank — HDFC Bank • • • • 4821',
    date: '2 Jun 2026',
    refId: 'TXN-79004',
    status: 'Failed',
    amount: '₹6,000',
    requestedOn: '02 Jun 2026, 04:45 PM',
    source: 'Wallet Withdrawal',
  },
];

type FilterTab = 'All' | 'Paid' | 'Processing' | 'Failed';

export interface PayoutHistoryScreenProps {
  onBack?: () => void;
  onNavigateToDetail?: (payout: PayoutRecord) => void;
}

export function PayoutHistoryScreen({
  onBack,
  onNavigateToDetail,
}: PayoutHistoryScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

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

  const filteredPayouts = PAYOUT_DATA.filter((p) => {
    if (activeTab === 'All') return true;
    return p.status === activeTab;
  });

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
            <Text style={styles.headerTitle}>Payout History</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          {(['All', 'Paid', 'Processing', 'Failed'] as FilterTab[]).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabPill, isSelected && styles.tabPillActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.listContainer}>
          {filteredPayouts.map((item) => {
            const isUpi = item.title.includes('UPI');
            const isFailed = item.status === 'Failed';
            const isProcessing = item.status === 'Processing';

            const iconBg = isFailed
              ? P.twRed50
              : isProcessing
              ? P.twAmber50
              : P.twGreen50;

            const iconColor = isFailed
              ? P.twRed600
              : isProcessing
              ? P.twAmber800
              : P.twGreen700;

            const badgeBg = isFailed
              ? P.twRed100
              : isProcessing
              ? P.twAmber100
              : P.twGreen100;

            const badgeText = isFailed
              ? P.twRed600
              : isProcessing
              ? P.twAmber900
              : P.twGreen800;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.payoutCard}
                onPress={() => onNavigateToDetail && onNavigateToDetail(item)}
                activeOpacity={0.78}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.amount}, ${item.status}`}
              >
                <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                  {isUpi ? (
                    <QrCodeIcon size={20} color={iconColor} />
                  ) : (
                    <BankColumnsIcon size={20} color={iconColor} />
                  )}
                </View>

                <View style={styles.cardDetails}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>
                    {item.date} · Ref {item.refId}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.statusBadgeText, { color: badgeText }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.amountText}>{item.amount}</Text>
              </TouchableOpacity>
            );
          })}
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
    marginBottom: 14,
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
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  tabPillActive: {
    backgroundColor: P.forestGreen,
    borderColor: P.forestGreen,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.twGray700,
  },
  tabTextActive: {
    color: P.white,
    fontWeight: '700',
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
  listContainer: {
    gap: 12,
  },
  payoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: P.twGray900,
  },
  cardSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginTop: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: P.twGray900,
  },
});
