import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { useAdminQuery } from '../../api/hooks';
import { getSalesReport } from '../../api/reports';
import { useSalesSummary } from '../warehouse/sales-direct/useSalesData';
import { formatPaise } from '../../money/paise';

// ─── Design Tokens ────────────────────────────────────────────────────────────
export const SALES_PALETTE = {
  primaryOrange: adminColors.brand,
  primaryOrangeLight: adminColors.brandTint,
  primaryOrangeBorder: adminColors.border,
  pageBg: adminColors.canvas,
  cardBg: adminColors.card,
  textHeading: adminColors.ink,
  textPrimary: adminColors.ink,
  textSecondary: adminColors.muted,
  textMuted: adminColors.muted,
  borderSoft: adminColors.border,
  borderActive: adminColors.brand,
  greenBg: adminColors.success.bg,
  greenText: adminColors.success.text,
  blueBg: adminColors.info.bg,
  blueText: adminColors.info.text,
  amberBg: adminColors.warning.bg,
  amberText: adminColors.warning.text,
  redBg: adminColors.danger.bg,
  redText: adminColors.danger.text,
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
export function BackChevronIcon({ color = adminColors.ink, size = 18 }: { color?: string; size?: number }) {
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

function CreditCardIcon({ color = adminColors.success.text, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2.5" stroke={color} strokeWidth="2" />
      <Path d="M2 10h20" stroke={color} strokeWidth="2" />
      <Circle cx="6" cy="15" r="1" fill={color} />
      <Path d="M10 15h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function ReceiptDocIcon({ color = adminColors.brand, size = 20 }: { color?: string; size?: number }) {
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

export function DeliveryTruckIcon({ color = adminColors.brand, size = 22 }: { color?: string; size?: number }) {
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

export function ReturnUndoIcon({ color = adminColors.brand, size = 20 }: { color?: string; size?: number }) {
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

export function ChevronRightIcon({ color = adminColors.muted, size = 18 }: { color?: string; size?: number }) {
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

function currentMtdRange(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${d}` };
}

export function SalesChannelOverviewScreen({
  onBack,
  onSelectChannel,
  onOpenFulfillment,
  onOpenReturns,
}: SalesChannelOverviewScreenProps) {
  const mtd = React.useMemo(() => currentMtdRange(), []);
  const { summary } = useSalesSummary(undefined, mtd);
  const salesReport = useAdminQuery(
    ['admin', 'reports', 'sales', 'channels-overview', mtd.from, mtd.to],
    (signal) => getSalesReport(mtd, signal),
  );

  const reportCountFor = (channel: 'ONLINE' | 'MARKET' | 'HORECA' | 'B2B'): string => {
    const row = salesReport.data?.byChannel?.find((c) => c.channel === channel);
    return row !== undefined ? String(row.count) : ADMIN_NO_VALUE;
  };

  const totalOrders = summary ? String(summary.count) : ADMIN_NO_VALUE;
  const totalRevenue = summary ? formatPaise(summary.revenuePaise) : ADMIN_NO_VALUE;

  const onlineCount = reportCountFor('ONLINE');
  const marketCount =
    summary?.byChannel?.MARKET?.count !== undefined
      ? String(summary.byChannel.MARKET.count)
      : reportCountFor('MARKET');
  const horecaCount = reportCountFor('HORECA');
  const b2bCount = reportCountFor('B2B');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
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
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackChevronIcon color={adminColors.ink} />
          </TouchableOpacity>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>Sales Channels</Text>
          <Text style={styles.screenSubtitle}>
            {t('wiringSales.channel.mtdSubtitle', { from: mtd.from, to: mtd.to })}
          </Text>
        </View>

        {/* 4 Channel Selector Cards */}
        <View style={styles.channelGrid}>
          {/* Card 1: Online */}
          <TouchableOpacity
            style={[styles.channelCard, styles.channelCardActive]}
            onPress={() => onSelectChannel?.('online')}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={[styles.channelNumber, styles.channelNumberActive]}>{onlineCount}</Text>
            <Text style={[styles.channelLabel, styles.channelLabelActive]}>Online</Text>
          </TouchableOpacity>

          {/* Card 2: Market */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={() => onSelectChannel?.('market')}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.channelNumber}>{marketCount}</Text>
            <Text style={styles.channelLabel}>Market</Text>
          </TouchableOpacity>

          {/* Card 3: Horeca */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={() => onSelectChannel?.('horeca')}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.channelNumber}>{horecaCount}</Text>
            <Text style={styles.channelLabel}>Horeca</Text>
          </TouchableOpacity>

          {/* Card 4: B2B */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={() => onSelectChannel?.('b2b')}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.channelNumber}>{b2bCount}</Text>
            <Text style={styles.channelLabel}>B2B</Text>
          </TouchableOpacity>
        </View>

        {/* 2 Metric Cards */}
        <View style={styles.metricsRow}>
          {/* Total Revenue */}
          <View style={styles.metricCard}>
            <View style={styles.greenIconContainer}>
              <CreditCardIcon color={adminColors.success.text} size={18} />
            </View>
            <Text style={styles.metricValue}>{totalRevenue}</Text>
            <Text style={styles.metricLabel}>Total Revenue (MTD)</Text>
          </View>

          {/* Total Orders */}
          <View style={styles.metricCard}>
            <View style={styles.orangeIconContainer}>
              <ReceiptDocIcon color={adminColors.brand} size={18} />
            </View>
            <Text style={styles.metricValue}>{totalOrders}</Text>
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
            accessibilityRole="button"
          >
            <View style={styles.quickAccessLeft}>
              <View style={styles.quickAccessIconBox}>
                <DeliveryTruckIcon color={adminColors.brand} size={20} />
              </View>
              <View style={styles.quickAccessTexts}>
                <Text style={styles.quickAccessTitle}>Order Fulfillment Assignment</Text>
                <Text style={styles.quickAccessSubtitle}>
                  Assign confirmed orders to a warehouse
                </Text>
              </View>
            </View>
            <ChevronRightIcon color={adminColors.muted} />
          </TouchableOpacity>

          {/* Item 2: Returns & Refunds */}
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={onOpenReturns}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <View style={styles.quickAccessLeft}>
              <View style={styles.quickAccessIconBox}>
                <ReturnUndoIcon color={adminColors.brand} size={18} />
              </View>
              <View style={styles.quickAccessTexts}>
                <Text style={styles.quickAccessTitle}>Returns & Refunds</Text>
                <Text style={styles.quickAccessSubtitle}>RMA tickets & refund status</Text>
              </View>
            </View>
            <ChevronRightIcon color={adminColors.muted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  contentContainer: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.xxl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  titleBlock: {
    marginBottom: adminSpacing.md,
  },
  screenTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontWeight: '700',
    marginBottom: 4,
  },
  screenSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 18,
  },
  channelGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
    gap: adminSpacing.xs,
  },
  channelCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  channelCardActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  channelNumber: {
    ...adminType.body,
    fontSize: 18,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 2,
  },
  channelNumberActive: {
    color: adminColors.brand,
  },
  channelLabel: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.muted,
  },
  channelLabelActive: {
    color: adminColors.brand,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  metricCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  greenIconContainer: {
    width: 34,
    height: 34,
    borderRadius: adminRadius.xs,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.sm,
  },
  orangeIconContainer: {
    width: 34,
    height: 34,
    borderRadius: adminRadius.xs,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.sm,
  },
  metricValue: {
    ...adminType.title,
    fontSize: 20,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 4,
  },
  metricLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  quickAccessSection: {
    marginTop: adminSpacing.xs,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  quickAccessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  quickAccessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: adminSpacing.sm,
  },
  quickAccessIconBox: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  quickAccessTexts: {
    flex: 1,
  },
  quickAccessTitle: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
    marginBottom: 2,
  },
  quickAccessSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
  },
});
