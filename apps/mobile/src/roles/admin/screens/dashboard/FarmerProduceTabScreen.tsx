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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { adminColors, adminOverlay, adminRadius, adminSpacing, adminType } from '../../theme';
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

function TomatoFruitIcon({
  size = 22,
  color = adminColors.onBrand,
  leafColor,
}: {
  size?: number;
  color?: string;
  leafColor?: string;
}) {
  const isWhite = color?.toLowerCase() === adminColors.onBrand.toLowerCase();
  const resolvedLeafColor = leafColor ?? (isWhite ? color : adminColors.muted);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="14" r="5.8" stroke={color} strokeWidth="2.2" />
      <Path
        d="M12 8.2c.3-1.8 1.1-3 2.3-3.6"
        stroke={resolvedLeafColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M11.8 8.2C11.6 5.8 9.6 4.2 7.8 4.8c-.3 2.1 1.5 3.6 4 3.4z"
        fill={resolvedLeafColor}
      />
    </Svg>
  );
}

function BellIcon({ size = 19, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SwapArrowsIcon({ size = 20, color = adminColors.info.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 8h13M12 4.5l4 3.5-4 3.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 16H8M12 12.5l-4 3.5 4 3.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RestrictedIcon({ size = 20, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="2.2" />
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function ClipboardClockIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 4h2a2 2 0 0 1 2 2v4.5M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Circle cx="18" cy="18" r="4.5" stroke={color} strokeWidth="2" />
      <Path d="M18 16v2l1.5 1" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function HistoryClockIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12a9 9 0 1 0 2.64-6.36L3 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3 3v5h5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 7.5v4.5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface FarmerProduceTabScreenProps {
  onNavigateToListings: (filter?: 'all' | 'pending' | 'counter') => void;
  onNavigateToHistory: () => void;
  onOpenNotifications?: () => void;
  onBack?: () => void;
}

export function FarmerProduceTabScreen({
  onNavigateToListings,
  onNavigateToHistory,
  onOpenNotifications,
  onBack,
}: FarmerProduceTabScreenProps) {
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
            <TomatoFruitIcon size={24} color={adminColors.onBrand} />
            <Text style={styles.headerTitle}>{t('farmerProduceTab.title')}</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <BellIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.headerSubtitle, { paddingLeft: onBack ? adminSpacing.xl : 0 }]}>
          {t('farmerProduceTab.subtitle')}
        </Text>
      </View>

      {/* ─── Scrollable Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 2x2 KPI Grid ─── */}
        <View style={styles.kpiGrid}>
          {/* Tile 1: Pending Review */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('farmerProduceTab.kpi.pendingReview')}</Text>
            <Text style={styles.kpiValue}>24</Text>
          </View>

          {/* Tile 2: Today's Reviews */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('farmerProduceTab.kpi.todayReviews')}</Text>
            <Text style={styles.kpiValue}>18</Text>
            <Text style={styles.kpiSubMuted}>{t('farmerProduceTab.kpi.todayReviewsBreakdown')}</Text>
          </View>

          {/* Tile 3: Counter Offers */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('farmerProduceTab.kpi.counterOffers')}</Text>
            <Text style={styles.kpiValue}>06</Text>
            <Text style={styles.kpiSubBlue}>{t('farmerProduceTab.kpi.awaitingResponse')}</Text>
          </View>

          {/* Tile 4: Your Listings */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('farmerProduceTab.kpi.yourListings')}</Text>
            <Text style={[styles.kpiValue, styles.kpiValueAmber]}>03</Text>
            <Text style={styles.kpiSubAmber}>{t('farmerProduceTab.kpi.reviewRestricted')}</Text>
          </View>
        </View>

        {/* ─── Section: Needs Your Attention ─── */}
        <Text style={styles.sectionHeader}>{t('farmerProduceTab.section.attention')}</Text>

        <View style={styles.attentionList}>
          {/* Card 1: Tomato — Grade 1 */}
          <View style={[styles.attentionCard, styles.attentionBorderBrown]}>
            <View style={styles.attentionIconCol}>
              <TomatoFruitIcon size={22} color={adminColors.brandDeep} />
            </View>
            <View style={styles.attentionContentCol}>
              <Text style={styles.attentionTitle}>Tomato — Grade 1</Text>
              <Text style={styles.attentionSub}>50 KG · Pending Review</Text>
              <TouchableOpacity
                onPress={() => onNavigateToListings('pending')}
                activeOpacity={0.7}
                style={styles.actionLinkTouch}
              >
                <Text style={styles.actionLinkText}>{t('farmerProduceTab.action.review')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 2: Carrot — Grade 2 */}
          <View style={[styles.attentionCard, styles.attentionBorderBlue]}>
            <View style={styles.attentionIconCol}>
              <SwapArrowsIcon size={20} color={adminColors.info.text} />
            </View>
            <View style={styles.attentionContentCol}>
              <Text style={styles.attentionTitle}>Carrot — Grade 2</Text>
              <Text style={styles.attentionSub}>80 KG · Counter Offer Awaiting Response</Text>
              <TouchableOpacity
                onPress={() => onNavigateToListings('counter')}
                activeOpacity={0.7}
                style={styles.actionLinkTouch}
              >
                <Text style={styles.actionLinkText}>{t('farmerProduceTab.action.view')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 3: Your Listing — Tomato */}
          <View style={[styles.attentionCard, styles.attentionBorderAmber]}>
            <View style={styles.attentionIconCol}>
              <RestrictedIcon size={22} color={adminColors.warning.text} />
            </View>
            <View style={styles.attentionContentCol}>
              <Text style={styles.attentionTitle}>Your Listing — Tomato</Text>
              <Text style={styles.attentionSub}>30 KG · Pending Review · Review Restricted</Text>
            </View>
          </View>
        </View>

        {/* ─── Section: Quick Actions ─── */}
        <Text style={styles.sectionHeader}>{t('farmerProduceTab.section.quickActions')}</Text>

        <View style={styles.quickActionsRow}>
          {/* Tile 1: Pending Listings */}
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => onNavigateToListings('pending')}
            activeOpacity={0.8}
          >
            <ClipboardClockIcon size={26} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>{t('farmerProduceTab.action.pendingListings')}</Text>
          </TouchableOpacity>

          {/* Tile 2: Listing History */}
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={onNavigateToHistory}
            activeOpacity={0.8}
          >
            <HistoryClockIcon size={26} color={adminColors.brand} />
            <Text style={styles.quickActionLabel}>{t('farmerProduceTab.action.listingHistory')}</Text>
          </TouchableOpacity>
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

  // ─── Header ───
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.xl,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
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
    letterSpacing: -0.4,
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.brandTint,
    letterSpacing: -0.1,
  },

  // ─── Body Scroll ───
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },

  // ─── 2x2 KPI Grid ───
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.xl,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    minHeight: 96,
  },
  kpiLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.muted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  kpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    letterSpacing: -0.5,
  },
  kpiValueAmber: {
    color: adminColors.warning.text,
  },
  kpiSubMuted: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.muted,
    marginTop: 4,
  },
  kpiSubBlue: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.info.text,
    marginTop: 4,
  },
  kpiSubAmber: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.warning.text,
    marginTop: 4,
  },

  // ─── Needs Your Attention ───
  sectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    letterSpacing: -0.2,
    marginBottom: adminSpacing.md,
  },
  attentionList: {
    gap: adminSpacing.md,
    marginBottom: adminSpacing.xl,
  },
  attentionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    gap: adminSpacing.md,
  },
  attentionBorderBrown: {
    borderLeftWidth: 4,
    borderLeftColor: adminColors.brandDeep,
  },
  attentionBorderBlue: {
    borderLeftWidth: 4,
    borderLeftColor: adminColors.info.text,
  },
  attentionBorderAmber: {
    borderLeftWidth: 4,
    borderLeftColor: adminColors.warning.text,
  },
  attentionIconCol: {
    paddingTop: 2,
  },
  attentionContentCol: {
    flex: 1,
  },
  attentionTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  attentionSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 6,
  },
  actionLinkTouch: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  actionLinkText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.brand,
  },

  // ─── Quick Actions ───
  quickActionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  quickActionTile: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.lg,
    paddingHorizontal: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  quickActionLabel: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
