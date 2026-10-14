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
import { adminColors } from '../../theme';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // Matches Purchases screen & theme primary (#F0562A)
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

  // Accent
  brandOrange: adminColors.brand,
  greenSuccess: adminColors.success.text,
  greenCircleBg: '#DCFCE7',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

/** Exact green checkmark inside green circle */
function CheckCircleIcon({ size = 20, color = THEME.greenSuccess }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M8.5 12l2.5 2.5 4.5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ReviewProduceListingScreenProps {
  listingId?: string;
  cropName?: string;
  grade?: string;
  onBack: () => void;
  onViewFullListingDetail: () => void;
  onCompleteReview?: () => void;
}

export function ReviewProduceListingScreen({
  listingId = 'PL-001245',
  cropName = 'Tomato',
  grade = 'Grade 1',
  onBack,
  onViewFullListingDetail,
  onCompleteReview,
}: ReviewProduceListingScreenProps) {
  const checklistItems = [
    'Farmer information',
    'Produce & Grade',
    'Quantity & Quality',
    'Pricing & Fair-price compliance',
    'Certification',
    'TOHFA requirement',
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Review Produce Listing (Image 4) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Review Produce Listing</Text>
        </View>

        <Text style={styles.headerSubtitle}>
          {listingId} · {cropName} — {grade}
        </Text>
      </View>

      {/* ─── Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Badge: Normal */}
        <View style={styles.badgeWrap}>
          <View style={styles.normalBadge}>
            <Text style={styles.normalBadgeText}>Normal</Text>
          </View>
        </View>

        {/* Section: Review Checklist */}
        <Text style={styles.sectionTitle}>Review Checklist</Text>

        <View style={styles.card}>
          {checklistItems.map((item, index) => (
            <View
              key={item}
              style={[
                styles.checklistItem,
                index < checklistItems.length - 1 && styles.checklistItemBorder,
              ]}
            >
              <CheckCircleIcon size={20} color={THEME.greenSuccess} />
              <Text style={styles.checklistText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Button: View Full Listing Detail (Image 4) */}
        <TouchableOpacity
          style={styles.outlineActionBtn}
          onPress={onViewFullListingDetail}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineActionBtnText}>View Full Listing Detail</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 42,
  },

  // ─── Scroll Area ───
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },

  // ─── Badge ───
  badgeWrap: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  normalBadge: {
    backgroundColor: THEME.brandOrange,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  normalBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.white,
  },

  // ─── Section Title ───
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.sectionTitle,
    letterSpacing: -0.2,
    marginBottom: 12,
  },

  // ─── Checklist Card ───
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  checklistItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderLight,
  },
  checklistText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: THEME.ink,
    letterSpacing: -0.1,
  },

  // ─── Outline Action Button ───
  outlineActionBtn: {
    backgroundColor: THEME.white,
    borderWidth: 1.5,
    borderColor: THEME.brandOrange,
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.brandOrange,
  },
});
