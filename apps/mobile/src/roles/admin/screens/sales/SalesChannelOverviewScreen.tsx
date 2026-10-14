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
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens ────────────────────────────────────────────────────────────
export const SALES_PALETTE = {
  primaryOrange: '#F0562A',
  primaryOrangeLight: '#FFF1EB',
  primaryOrangeBorder: '#FAD9CC',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textHeading: '#6B230B',
  textPrimary: '#1F1714',
  textSecondary: '#786F68',
  textMuted: '#9C938C',
  borderSoft: '#EDE7DE',
  borderActive: '#F0562A',
  greenBg: '#E8F8EE',
  greenText: '#1E824C',
  blueBg: '#EBF3FA',
  blueText: '#1D6399',
  amberBg: '#FEF3C7',
  amberText: '#B45309',
  redBg: '#FDE8E8',
  redText: '#D93838',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
export function BackChevronIcon({ color = '#1F1714', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CreditCardIcon({ color = '#1E824C', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2.5" stroke={color} strokeWidth="2" />
      <Path d="M2 10h20" stroke={color} strokeWidth="2" />
      <Circle cx="6" cy="15" r="1" fill={color} />
      <Path d="M10 15h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function ReceiptDocIcon({ color = SALES_PALETTE.primaryOrange, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function DeliveryTruckIcon({ color = SALES_PALETTE.primaryOrange, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="4" width="14" height="11" rx="1.5" stroke={color} strokeWidth="1.8" />
      <Path
        d="M15 8h4.2a1 1 0 0 1 .8.4l2.5 3.3a1 1 0 0 1 .2.6V15h-7.7V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="5.5" cy="18" r="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="17.5" cy="18" r="2.5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function ReturnUndoIcon({ color = SALES_PALETTE.primaryOrange, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 14l-4-4 4-4"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 10h11a4 4 0 1 1 0 8h-1"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronRightIcon({ color = '#B5ACA4', size = 18 }: { color?: string; size?: number }) {
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

export interface SalesChannelOverviewScreenProps {
  onBack?: () => void;
  onSelectChannel?: (channel: 'online' | 'market' | 'horeca' | 'b2b') => void;
  onOpenFulfillment?: () => void;
  onOpenReturns?: () => void;
}

export function SalesChannelOverviewScreen({
  onBack,
  onSelectChannel,
  onOpenFulfillment,
  onOpenReturns,
}: SalesChannelOverviewScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={SALES_PALETTE.pageBg} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackChevronIcon />
          </TouchableOpacity>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>Sales Channels</Text>
          <Text style={styles.screenSubtitle}>
            Cross-channel order volume and value — this month
          </Text>
        </View>

        {/* 4 Channel Selector Cards */}
        <View style={styles.channelGrid}>
          {/* Card 1: Online (Active / Highlighted) */}
          <TouchableOpacity
            style={[styles.channelCard, styles.channelCardActive]}
            onPress={() => onSelectChannel?.('online')}
            activeOpacity={0.8}
          >
            <Text style={[styles.channelNumber, styles.channelNumberActive]}>412</Text>
            <Text style={[styles.channelLabel, styles.channelLabelActive]}>Online</Text>
          </TouchableOpacity>

          {/* Card 2: Market */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={() => onSelectChannel?.('market')}
            activeOpacity={0.8}
          >
            <Text style={styles.channelNumber}>58</Text>
            <Text style={styles.channelLabel}>Market</Text>
          </TouchableOpacity>

          {/* Card 3: Horeca */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={() => onSelectChannel?.('horeca')}
            activeOpacity={0.8}
          >
            <Text style={styles.channelNumber}>19</Text>
            <Text style={styles.channelLabel}>Horeca</Text>
          </TouchableOpacity>

          {/* Card 4: B2B */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={() => onSelectChannel?.('b2b')}
            activeOpacity={0.8}
          >
            <Text style={styles.channelNumber}>7</Text>
            <Text style={styles.channelLabel}>B2B</Text>
          </TouchableOpacity>
        </View>

        {/* 2 Metric Cards */}
        <View style={styles.metricsRow}>
          {/* Total Revenue */}
          <View style={styles.metricCard}>
            <View style={styles.greenIconContainer}>
              <CreditCardIcon color="#2E7D32" size={18} />
            </View>
            <Text style={styles.metricValue}>₹18.4L</Text>
            <Text style={styles.metricLabel}>Total Revenue (MTD)</Text>
          </View>

          {/* Total Orders */}
          <View style={styles.metricCard}>
            <View style={styles.orangeIconContainer}>
              <ReceiptDocIcon color={SALES_PALETTE.primaryOrange} size={18} />
            </View>
            <Text style={styles.metricValue}>496</Text>
            <Text style={styles.metricLabel}>Total Orders</Text>
          </View>
        </View>

        {/* Quick Access Section */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionHeading}>Quick access</Text>

          {/* Item 1: Order Fulfillment Assignment */}
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={onOpenFulfillment}
            activeOpacity={0.7}
          >
            <View style={styles.quickAccessLeft}>
              <View style={styles.quickAccessIconBox}>
                <DeliveryTruckIcon color={SALES_PALETTE.primaryOrange} size={20} />
              </View>
              <View style={styles.quickAccessTexts}>
                <Text style={styles.quickAccessTitle}>Order Fulfillment Assignment</Text>
                <Text style={styles.quickAccessSubtitle}>
                  Assign confirmed orders to a warehouse
                </Text>
              </View>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Item 2: Returns & Refunds */}
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={onOpenReturns}
            activeOpacity={0.7}
          >
            <View style={styles.quickAccessLeft}>
              <View style={styles.quickAccessIconBox}>
                <ReturnUndoIcon color={SALES_PALETTE.primaryOrange} size={18} />
              </View>
              <View style={styles.quickAccessTexts}>
                <Text style={styles.quickAccessTitle}>Returns & Refunds</Text>
                <Text style={styles.quickAccessSubtitle}>6 open RMA tickets</Text>
              </View>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SALES_PALETTE.pageBg,
  },
  container: {
    flex: 1,
    backgroundColor: SALES_PALETTE.pageBg,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: SALES_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  titleBlock: {
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: SALES_PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: SALES_PALETTE.textSecondary,
    lineHeight: 18,
  },
  channelGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  channelCard: {
    flex: 1,
    backgroundColor: SALES_PALETTE.cardBg,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: SALES_PALETTE.borderSoft,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  channelCardActive: {
    borderColor: SALES_PALETTE.primaryOrange,
    backgroundColor: '#FFF8F5',
  },
  channelNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: SALES_PALETTE.textPrimary,
    marginBottom: 2,
  },
  channelNumberActive: {
    color: SALES_PALETTE.primaryOrange,
  },
  channelLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: SALES_PALETTE.textSecondary,
  },
  channelLabelActive: {
    color: SALES_PALETTE.primaryOrange,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  metricCard: {
    flex: 1,
    backgroundColor: SALES_PALETTE.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  greenIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: SALES_PALETTE.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  orangeIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: SALES_PALETTE.primaryOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: SALES_PALETTE.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: SALES_PALETTE.textSecondary,
    fontWeight: '400',
  },
  quickAccessSection: {
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: SALES_PALETTE.textHeading,
    marginBottom: 12,
  },
  quickAccessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SALES_PALETTE.cardBg,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  quickAccessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  quickAccessIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: SALES_PALETTE.primaryOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  quickAccessTexts: {
    flex: 1,
  },
  quickAccessTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: SALES_PALETTE.textPrimary,
    marginBottom: 2,
  },
  quickAccessSubtitle: {
    fontSize: 11,
    color: SALES_PALETTE.textSecondary,
  },
});
