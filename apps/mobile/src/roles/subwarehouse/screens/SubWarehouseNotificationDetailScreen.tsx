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
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens (#F0562A Unified Subwarehouse Palette) ────────────────────
const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#D4451B',
  primaryLight: '#FFF0EB',
  primarySoft: '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
  divider: '#F4EFE9',

  // Badges
  actionRequiredBg: '#FEE2E2',
  actionRequiredText: '#DC2626',
  timestampBadgeBg: '#F3EDE6',
  timestampBadgeText: '#59524C',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function ReviewTrayIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 10l5 5 5-5M12 15V3"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface SubWarehouseNotificationDetailScreenProps {
  onBack: () => void;
  onReviewReceiving?: () => void;
  notificationData?: {
    title?: string;
    actionRequired?: string;
    time?: string;
    message?: string;
    reference?: string;
    source?: string;
    product?: string;
    expectedQuantity?: string;
    receivedTime?: string;
    readTime?: string;
  };
}

export function SubWarehouseNotificationDetailScreen({
  onBack,
  onReviewReceiving,
  notificationData,
}: SubWarehouseNotificationDetailScreenProps) {
  const data = {
    title: notificationData?.title ?? 'Quality Check Required',
    actionRequired: notificationData?.actionRequired ?? 'Action Required',
    time: notificationData?.time ?? '10:32 AM · Today',
    message:
      notificationData?.message ??
      'A new incoming shipment has arrived at Coonoor Warehouse and requires quantity verification and quality check.',
    reference: notificationData?.reference ?? 'GR-1024',
    source: notificationData?.source ?? 'Main Warehouse',
    product: notificationData?.product ?? 'Tomato',
    expectedQuantity: notificationData?.expectedQuantity ?? '150 KG',
    receivedTime: notificationData?.receivedTime ?? '10:32 AM',
    readTime: notificationData?.readTime ?? '10:35 AM',
  };

  const handleReview = () => {
    if (onReviewReceiving) {
      onReviewReceiving();
    } else {
      Alert.alert(
        'Review Receiving',
        `Navigating to Quality Check inspection for Shipment ${data.reference} (${data.product}).`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Brand Header (#F0562A) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.75}
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>Notification</Text>
        </View>
      </View>

      {/* ─── Scrollable Main Content Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        decelerationRate={0.985}
        bounces={true}
      >
        <View style={styles.mainContainer}>
          {/* 1. Top Title & Badges Card */}
          <View style={styles.card}>
            <Text style={styles.topCardTitle}>{data.title}</Text>
            <View style={styles.badgeRow}>
              {/* Action Required Badge */}
              <View style={styles.actionRequiredBadge}>
                <View style={styles.redDot} />
                <Text style={styles.actionRequiredText}>{data.actionRequired}</Text>
              </View>

              {/* Timestamp Badge */}
              <View style={styles.timestampBadge}>
                <Text style={styles.timestampBadgeText}>{data.time}</Text>
              </View>
            </View>
          </View>

          {/* 2. Message Section */}
          <Text style={styles.sectionHeading}>Message</Text>
          <View style={styles.card}>
            <Text style={styles.messageText}>{data.message}</Text>
          </View>

          {/* 3. Related Information Section */}
          <Text style={styles.sectionHeading}>Related Information</Text>
          <View style={styles.card}>
            {/* Grid Row 1: Reference & Source */}
            <View style={styles.infoGridRow}>
              <View style={styles.infoGridCol}>
                <Text style={styles.infoGridLabel}>Reference</Text>
                <Text style={styles.infoGridValue}>{data.reference}</Text>
              </View>
              <View style={styles.infoGridCol}>
                <Text style={styles.infoGridLabel}>Source</Text>
                <Text style={styles.infoGridValue}>{data.source}</Text>
              </View>
            </View>

            {/* Grid Row 2: Product & Expected Quantity */}
            <View style={[styles.infoGridRow, { marginTop: 14 }]}>
              <View style={styles.infoGridCol}>
                <Text style={styles.infoGridLabel}>Product</Text>
                <Text style={styles.infoGridValue}>{data.product}</Text>
              </View>
              <View style={styles.infoGridCol}>
                <Text style={styles.infoGridLabel}>Expected Quantity</Text>
                <Text style={styles.infoGridValue}>{data.expectedQuantity}</Text>
              </View>
            </View>
          </View>

          {/* 4. Timeline Section */}
          <Text style={styles.sectionHeading}>Timeline</Text>
          <View style={styles.card}>
            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>Received</Text>
              <Text style={styles.timelineValue}>{data.receivedTime}</Text>
            </View>

            <View style={styles.dividerLine} />

            <View style={styles.timelineRow}>
              <Text style={styles.timelineLabel}>Read</Text>
              <Text style={styles.timelineValue}>{data.readTime}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom Fixed Sticky Action Button ─── */}
      <View style={styles.bottomFooter}>
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={handleReview}
          activeOpacity={0.85}
        >
          <ReviewTrayIcon size={18} color="#FFFFFF" />
          <Text style={styles.reviewButtonText}>Review Receiving</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingBottom: 28,
  },

  // ─── Header Banner ─────────────────────────────────────────────────────────
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 6,
    marginRight: 8,
    marginLeft: -4,
  },
  headerTitleText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // ─── Main Container ────────────────────────────────────────────────────────
  mainContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.2,
  },

  // ─── Cards ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  topCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: PALETTE.textInk,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionRequiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.actionRequiredBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PALETTE.actionRequiredText,
  },
  actionRequiredText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.actionRequiredText,
  },
  timestampBadge: {
    backgroundColor: PALETTE.timestampBadgeBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  timestampBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.timestampBadgeText,
  },

  // ─── Message Section ───────────────────────────────────────────────────────
  messageText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: PALETTE.textInk,
    lineHeight: 20,
  },

  // ─── Related Info Grid ─────────────────────────────────────────────────────
  infoGridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoGridCol: {
    flex: 1,
  },
  infoGridLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginBottom: 3,
  },
  infoGridValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  // ─── Timeline ──────────────────────────────────────────────────────────────
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  timelineValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  dividerLine: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 10,
  },

  // ─── Bottom Footer Action Button ───────────────────────────────────────────
  bottomFooter: {
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: PALETTE.divider,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
