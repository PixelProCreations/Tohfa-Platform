import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { RmaRecord } from './SubWarehouseReturnsIssuesScreen';

// ─── Design Tokens (Primary Brand Color: #F0562A) ────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  border:        '#EBE5DC',
  greenBg:       '#DCFCE7',
  greenIcon:     '#059669',
};

// ─── Icons ───────────────────────────────────────────────────────────────────
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

function SuccessCheckmarkIcon({ size = 28, color = '#059669' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.2" />
      <Path d="M8 12l2.5 2.5 5.5-5.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SubWarehouseRefundCompletedScreenProps {
  rma: RmaRecord;
  refundAmount?: string;
  transactionId?: string;
  onBack: () => void;
}

export function SubWarehouseRefundCompletedScreen({
  rma,
  refundAmount = '₹200',
  transactionId = 'REF-2026-001245',
  onBack,
}: SubWarehouseRefundCompletedScreenProps) {
  const cleanAmount = refundAmount.replace('.00', '');

  const timelineItems = [
    {
      id: '1',
      title: 'Return Approved',
      time: '25 Sep · 11:20 AM',
      isLast: false,
    },
    {
      id: '2',
      title: 'Refund Initiated',
      time: '25 Sep · 11:22 AM',
      isLast: false,
    },
    {
      id: '3',
      title: 'Wallet Credited',
      time: '25 Sep · 11:22 AM',
      isLast: true,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Refund Completed</Text>
            <Text style={styles.headerSubtitle}>{rma.rmaId}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Center Success Badge */}
        <View style={styles.successIconCircle}>
          <SuccessCheckmarkIcon size={34} color={PALETTE.greenIcon} />
        </View>

        <Text style={styles.title}>Refund Completed</Text>
        <Text style={styles.subtitle}>{cleanAmount} credited to customer wallet</Text>

        {/* Transaction ID Card */}
        <View style={styles.transactionCard}>
          <Text style={styles.transactionLabel}>Transaction ID</Text>
          <Text style={styles.transactionVal}>{transactionId}</Text>
        </View>

        {/* Refund Timeline Section */}
        <Text style={styles.sectionHeader}>Refund Timeline</Text>

        <View style={styles.timelineContainer}>
          {timelineItems.map((item) => (
            <View key={item.id} style={styles.timelineRow}>
              <View style={styles.timelineNodeCol}>
                <View style={styles.timelineRing}>
                  <View style={styles.timelineInnerDot} />
                </View>
                {!item.isLast && <View style={styles.timelineLine} />}
              </View>

              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 28,
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: PALETTE.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textInk,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  transactionCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 24,
  },
  transactionLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  transactionVal: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 16,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineNodeCol: {
    alignItems: 'center',
    width: 24,
  },
  timelineRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: PALETTE.greenIcon,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.greenIcon,
  },
  timelineLine: {
    width: 2,
    height: 28,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  timelineTextCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  timelineTime: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 3,
  },
});
