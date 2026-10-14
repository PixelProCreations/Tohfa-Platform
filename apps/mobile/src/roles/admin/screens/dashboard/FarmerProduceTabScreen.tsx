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
import { adminColors } from '../../theme';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // Matches Purchases screen & theme primary (#F0562A)
  headerPillBg: 'rgba(255, 255, 255, 0.22)',
  white: adminColors.onBrand,

  // Surfaces
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,
  borderLight: '#F3ECE4',

  // Typography
  titleRustDark: adminColors.brandDeep,
  sectionTitle: '#5C240E',
  ink: adminColors.ink,
  muted: adminColors.muted,
  labelMuted: '#78716C',

  // Accent Colors
  brandOrange: adminColors.brand,
  blueText: '#2B6CB0',
  blueBorder: '#1E3A8A',
  amberText: '#D97706',
  amberBorder: '#D97706',
  brownBorder: '#8C5A47',
};

// ─── Exact SVG Icons ──────────────────────────────────────────────────────────

/** Exact Produce Fruit Icon matching user mockup (circular outline with top-left tilted solid leaf) */
function TomatoFruitIcon({
  size = 22,
  color = THEME.white,
  leafColor,
}: {
  size?: number;
  color?: string;
  leafColor?: string;
}) {
  const isWhite = color?.toLowerCase() === '#ffffff' || color?.toLowerCase() === '#fff';
  const resolvedLeafColor = leafColor ?? (isWhite ? color : '#5C6B63');

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Exact Circular Fruit Outline Body */}
      <Circle cx="12" cy="14" r="5.8" stroke={color} strokeWidth="2.2" />
      {/* Small Stem */}
      <Path
        d="M12 8.2c.3-1.8 1.1-3 2.3-3.6"
        stroke={resolvedLeafColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Solid Leaf tilted to top-left matching screenshot */}
      <Path
        d="M11.8 8.2C11.6 5.8 9.6 4.2 7.8 4.8c-.3 2.1 1.5 3.6 4 3.4z"
        fill={resolvedLeafColor}
      />
    </Svg>
  );
}

/** Notification Bell in translucent circular button */
function BellIcon({ size = 19, color = THEME.white }: { size?: number; color?: string }) {
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

/** Opposing horizontal swap arrows (⇄) */
function SwapArrowsIcon({ size = 20, color = THEME.blueBorder }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top arrow pointing right */}
      <Path
        d="M3 8h13M12 4.5l4 3.5-4 3.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom arrow pointing left */}
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

/** Circle with diagonal slash (⊘) prohibited/restricted icon */
function RestrictedIcon({ size = 20, color = THEME.amberBorder }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="2.2" />
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

/** Clipboard with clock icon */
function ClipboardClockIcon({ size = 26, color = THEME.brandOrange }: { size?: number; color?: string }) {
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
      {/* Clock on bottom-right */}
      <Circle cx="18" cy="18" r="4.5" stroke={color} strokeWidth="2" />
      <Path d="M18 16v2l1.5 1" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/** Counter-clockwise history clock icon */
function HistoryClockIcon({ size = 26, color = THEME.brandOrange }: { size?: number; color?: string }) {
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

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
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
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Produce / Farmer Produce Control (Image 1) ─── */}
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
                <BackArrowIcon size={22} color={THEME.white} />
              </TouchableOpacity>
            )}
            <TomatoFruitIcon size={24} color={THEME.white} />
            <Text style={styles.headerTitle}>Produce</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <BellIcon size={20} color={THEME.white} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.headerSubtitle, { paddingLeft: onBack ? 34 : 0 }]}>
          Produce Listings · Farmer Produce Control
        </Text>
      </View>

      {/* ─── Scrollable Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 2x2 KPI Grid (Image 1) ─── */}
        <View style={styles.kpiGrid}>
          {/* Tile 1: Pending Review */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>PENDING REVIEW</Text>
            <Text style={styles.kpiValue}>24</Text>
          </View>

          {/* Tile 2: Today's Reviews */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TODAY&apos;S REVIEWS</Text>
            <Text style={styles.kpiValue}>18</Text>
            <Text style={styles.kpiSubMuted}>14 Approved · 2 Rejected · 2 Countered</Text>
          </View>

          {/* Tile 3: Counter Offers */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>COUNTER OFFERS</Text>
            <Text style={styles.kpiValue}>06</Text>
            <Text style={styles.kpiSubBlue}>Awaiting Farmer Response</Text>
          </View>

          {/* Tile 4: Your Listings */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>YOUR LISTINGS</Text>
            <Text style={[styles.kpiValue, styles.kpiValueAmber]}>03</Text>
            <Text style={styles.kpiSubAmber}>Review Restricted</Text>
          </View>
        </View>

        {/* ─── Section: Needs Your Attention ─── */}
        <Text style={styles.sectionHeader}>Needs Your Attention</Text>

        <View style={styles.attentionList}>
          {/* Card 1: Tomato — Grade 1 */}
          <View style={[styles.attentionCard, styles.attentionBorderBrown]}>
            <View style={styles.attentionIconCol}>
              <TomatoFruitIcon size={22} color={THEME.brownBorder} />
            </View>
            <View style={styles.attentionContentCol}>
              <Text style={styles.attentionTitle}>Tomato — Grade 1</Text>
              <Text style={styles.attentionSub}>50 KG · Pending Review</Text>
              <TouchableOpacity
                onPress={() => onNavigateToListings('pending')}
                activeOpacity={0.7}
                style={styles.actionLinkTouch}
              >
                <Text style={styles.actionLinkText}>Review →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 2: Carrot — Grade 2 */}
          <View style={[styles.attentionCard, styles.attentionBorderBlue]}>
            <View style={styles.attentionIconCol}>
              <SwapArrowsIcon size={20} color={THEME.blueBorder} />
            </View>
            <View style={styles.attentionContentCol}>
              <Text style={styles.attentionTitle}>Carrot — Grade 2</Text>
              <Text style={styles.attentionSub}>80 KG · Counter Offer Awaiting Response</Text>
              <TouchableOpacity
                onPress={() => onNavigateToListings('counter')}
                activeOpacity={0.7}
                style={styles.actionLinkTouch}
              >
                <Text style={styles.actionLinkText}>View →</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card 3: Your Listing — Tomato */}
          <View style={[styles.attentionCard, styles.attentionBorderAmber]}>
            <View style={styles.attentionIconCol}>
              <RestrictedIcon size={22} color={THEME.amberBorder} />
            </View>
            <View style={styles.attentionContentCol}>
              <Text style={styles.attentionTitle}>Your Listing — Tomato</Text>
              <Text style={styles.attentionSub}>30 KG · Pending Review · Review Restricted</Text>
            </View>
          </View>
        </View>

        {/* ─── Section: Quick Actions ─── */}
        <Text style={styles.sectionHeader}>Quick Actions</Text>

        <View style={styles.quickActionsRow}>
          {/* Tile 1: Pending Listings */}
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={() => onNavigateToListings('pending')}
            activeOpacity={0.8}
          >
            <ClipboardClockIcon size={26} color={THEME.brandOrange} />
            <Text style={styles.quickActionLabel}>Pending Listings</Text>
          </TouchableOpacity>

          {/* Tile 2: Listing History */}
          <TouchableOpacity
            style={styles.quickActionTile}
            onPress={onNavigateToHistory}
            activeOpacity={0.8}
          >
            <HistoryClockIcon size={26} color={THEME.brandOrange} />
            <Text style={styles.quickActionLabel}>Listing History</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },

  // ─── Header ───
  header: {
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    paddingRight: 4,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.4,
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.headerPillBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.92)',
    letterSpacing: -0.1,
  },

  // ─── Body Scroll ───
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // ─── 2x2 KPI Grid ───
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 22,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 96,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '900',
    color: THEME.ink,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  kpiValueAmber: {
    color: THEME.amberText,
  },
  kpiSubMuted: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 13,
  },
  kpiSubBlue: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.blueText,
    marginTop: 4,
  },
  kpiSubAmber: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.amberText,
    marginTop: 4,
  },

  // ─── Needs Your Attention ───
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.sectionTitle,
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  attentionList: {
    gap: 12,
    marginBottom: 24,
  },
  attentionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  attentionBorderBrown: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.brownBorder,
  },
  attentionBorderBlue: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.blueBorder,
  },
  attentionBorderAmber: {
    borderLeftWidth: 4,
    borderLeftColor: THEME.amberBorder,
  },
  attentionIconCol: {
    paddingTop: 2,
  },
  attentionContentCol: {
    flex: 1,
  },
  attentionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.ink,
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  attentionSub: {
    fontSize: 12,
    color: THEME.muted,
    marginBottom: 6,
  },
  actionLinkTouch: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  actionLinkText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.brandOrange,
  },

  // ─── Quick Actions ───
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionTile: {
    flex: 1,
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.ink,
    textAlign: 'center',
  },
});
