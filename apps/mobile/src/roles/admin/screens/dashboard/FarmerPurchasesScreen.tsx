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

import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function ReceiptLongIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
      <Path d="M240-80q-50 0-85-35t-35-85v-120h120v-560l60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60v680q0 50-35 85t-85 35H240Zm480-80q17 0 28.5-11.5T760-200v-560H320v440h360v120q0 17 11.5 28.5T720-160ZM360-600v-80h240v80H360Zm0 120v-80h240v80H360Zm320-120q-17 0-28.5-11.5T640-640q0-17 11.5-28.5T680-680q17 0 28.5 11.5T720-640q0 17-11.5 28.5T680-600Zm0 120q-17 0-28.5-11.5T640-520q0-17 11.5-28.5T680-560q17 0 28.5 11.5T720-520q0 17-11.5 28.5T680-480ZM240-160h360v-80H200v40q0 17 11.5 28.5T240-160Zm-40 0v-80 80Z" />
    </Svg>
  );
}

function BellIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 01-3.46 0" />
    </Svg>
  );
}

function HandshakeIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
      <Path d="M475-160q4 0 8-2t6-4l328-328q12-12 17.5-27t5.5-30q0-16-5.5-30.5T817-607L647-777q-11-12-25.5-17.5T591-800q-15 0-30 5.5T534-777l-11 11 74 75q15 14 22 32t7 38q0 42-28.5 70.5T527-522q-20 0-38.5-7T456-550l-75-74-175 175q-3 3-4.5 6.5T200-435q0 8 6 14.5t14 6.5q4 0 8-2t6-4l136-136 56 56-135 136q-3 3-4.5 6.5T285-350q0 8 6 14t14 6q4 0 8-2t6-4l136-135 56 56-135 136q-3 2-4.5 6t-1.5 8q0 8 6 14t14 6q4 0 7.5-1.5t6.5-4.5l136-135 56 56-136 136q-3 3-4.5 6.5T454-180q0 8 6.5 14t14.5 6Zm-1 80q-37 0-65.5-24.5T375-166q-34-5-57-28t-28-57q-34-5-56.5-28.5T206-336q-38-5-62-33t-24-66q0-20 7.5-38.5T149-506l232-231 131 131q2 3 6 4.5t8 1.5q9 0 15-5.5t6-14.5q0-4-1.5-8t-4.5-6L398-777q-11-12-25.5-17.5T342-800q-15 0-30 5.5T285-777L144-635q-9 9-15 21t-8 24q-2 12 0 24.5t8 23.5l-58 58q-17-23-25-50.5T40-590q2-28 14-54.5T87-692l141-141q24-23 53.5-35t60.5-12q31 0 60.5 12t52.5 35l11 11 11-11q24-23 53.5-35t60.5-12q31 0 60.5 12t52.5 35l169 169q23 23 35 53t12 61q0 31-12 60.5T873-437L545-110q-14 14-32.5 22T474-80Zm-99-560Z" />
    </Svg>
  );
}

function HistoryClockIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={color}>
      <Path d="M480-120q-138 0-240.5-91.5T122-440h82q14 104 92.5 172T480-200q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h110v80H120v-240h80v94q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm112-192L440-464v-216h80v184l128 128-56 56Z" />
    </Svg>
  );
}

function ProduceTomatoIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx="12" cy="14" r="7" />
      <Path d="M12 7V3" />
      <Path d="M9 5c1 1.5 2 2 3 2s2-.5 3-2" />
    </Svg>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface FarmerPurchasesScreenProps {
  onBack?: (() => void) | undefined;
  onNavigatePurchaseOrders: () => void;
  onNavigateProduceListings: () => void;
  onNavigateReadyForCollection?: (() => void) | undefined;
  onNavigatePurchaseHistory?: (() => void) | undefined;
  onViewPurchaseOrder?: ((orderId: string) => void) | undefined;
  onProcessHandover?: ((orderId: string) => void) | undefined;
  onCollect?: ((orderId: string) => void) | undefined;
  onOpenNotifications?: (() => void) | undefined;
}

export function FarmerPurchasesScreen({
  onBack,
  onNavigatePurchaseOrders,
  onNavigateProduceListings,
  onViewPurchaseOrder,
  onOpenNotifications,
}: FarmerPurchasesScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            {onBack && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onBack}
                activeOpacity={0.7}
                accessibilityLabel="Go back"
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
            )}
            <ReceiptLongIcon size={24} color={adminColors.onBrand} />
            <Text style={styles.headerTitle}>{t('farmerPurchases.title')}</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <BellIcon size={18} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.headerSubtitle, { paddingLeft: onBack ? adminSpacing.xl : 0 }]}>
          {t('farmerPurchases.subtitle')}
        </Text>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 2x2 Metric KPI Grid ─── */}
        <View style={styles.kpiGrid}>
          {/* Row 1 */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{t('farmerPurchases.kpi.pendingPurchases')}</Text>
              <Text style={styles.kpiValueDark}>9</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{t('farmerPurchases.kpi.readyForCollection')}</Text>
              <Text style={[styles.kpiValueDark, styles.kpiBlue]}>5</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{t('farmerPurchases.kpi.todayCollections')}</Text>
              <Text style={styles.kpiValueDark}>3</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{t('farmerPurchases.kpi.completedPurchases')}</Text>
              <Text style={[styles.kpiValueDark, styles.kpiGreen]}>142</Text>
            </View>
          </View>
        </View>

        {/* ─── Section: Needs Your Attention ─── */}
        <Text style={styles.sectionHeading}>{t('farmerPurchases.section.attention')}</Text>

        {/* Attention Card 1 */}
        <TouchableOpacity
          style={styles.attentionCard}
          onPress={() => onViewPurchaseOrder?.('PO-2026-00124')}
          activeOpacity={0.8}
        >
          <View style={styles.attentionAccentBar} />
          <View style={styles.attentionContent}>
            <View style={styles.attentionHeaderRow}>
              <View style={styles.attentionIconBadge}>
                <ReceiptLongIcon size={18} color={adminColors.brand} />
              </View>
              <Text style={styles.attentionOrderTitle}>Purchase PO-2026-00124</Text>
            </View>

            <Text style={styles.attentionSubline}>
              Farmer: Ramesh Kumar · Organic Carrot · Grade 1 · 30 kg · ₹45/kg · Awaiting Handover
            </Text>
          </View>
        </TouchableOpacity>

        {/* Attention Card 2 */}
        <TouchableOpacity
          style={styles.attentionCard}
          onPress={() => onViewPurchaseOrder?.('PO-2026-00124')}
          activeOpacity={0.8}
        >
          <View style={styles.attentionAccentBar} />
          <View style={styles.attentionContent}>
            <View style={styles.attentionHeaderRow}>
              <View style={styles.attentionIconBadge}>
                <ReceiptLongIcon size={18} color={adminColors.brand} />
              </View>
              <Text style={styles.attentionOrderTitle}>Purchase PO-2026-00124</Text>
            </View>

            <Text style={styles.attentionSubline}>
              Farmer: Ramesh Kumar · Organic Carrot · Grade 1 · 30 kg · ₹45/kg · Awaiting Handover
            </Text>
          </View>
        </TouchableOpacity>

        {/* ─── Section: Quick Actions ─── */}
        <Text style={styles.sectionHeading}>{t('farmerPurchases.section.quickActions')}</Text>

        <View style={styles.quickGrid}>
          <View style={styles.quickRow}>
            {/* Action 1: Purchase Orders */}
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigatePurchaseOrders}
              activeOpacity={0.8}
            >
              <ReceiptLongIcon size={24} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>{t('farmerPurchases.quickAction.purchaseOrders')}</Text>
            </TouchableOpacity>

            {/* Action 2: Produce Listings */}
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateProduceListings}
              activeOpacity={0.8}
            >
              <ProduceTomatoIcon size={24} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>{t('farmerPurchases.quickAction.produceListings')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtn: {
    paddingRight: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.brandTint,
    marginTop: adminSpacing.xs,
  },

  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // KPI Grid
  kpiGrid: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    ...adminShadow.sm,
  },
  kpiLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  kpiValueDark: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  kpiBlue: {
    color: adminColors.info.text,
  },
  kpiGreen: {
    color: adminColors.success.text,
  },

  // Section Heading
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },

  // Attention Cards
  attentionCard: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.sm,
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  attentionAccentBar: {
    width: 5,
    backgroundColor: adminColors.brand,
  },
  attentionContent: {
    flex: 1,
    padding: adminSpacing.md,
  },
  attentionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  attentionIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionOrderTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  attentionSubline: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 0,
  },
  attentionActionRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  attentionBtn: {
    flex: 1,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.sm,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  attentionBtnText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // Quick Actions 2x2 Grid
  quickGrid: {
    gap: adminSpacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  quickCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.lg,
    paddingHorizontal: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...adminShadow.sm,
  },
  quickCardLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
