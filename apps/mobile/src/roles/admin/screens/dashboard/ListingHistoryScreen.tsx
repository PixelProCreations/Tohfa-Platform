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

  // Accent & Timeline
  brandOrange: adminColors.brand,
  peachIconBg: '#FFEDD5',
  peachNoticeBg: '#FFF7ED',
  noticeText: '#9A3412',
};

// ─── Exact SVG Icons ──────────────────────────────────────────────────────────

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

/** Icon 1: Target / plus in circle (Listing Created) */
function TargetPlusIcon({ size = 16, color = THEME.titleRustDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Icon 2: Play triangle pointing right (Submitted for Review) */
function PlayTriangleIcon({ size = 15, color = THEME.titleRustDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 5l12 7-12 7V5z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </Svg>
  );
}

/** Icon 3: ID badge / user card (Assigned to Farmer Admin) */
function IdBadgeIcon({ size = 16, color = THEME.titleRustDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.8" />
      <Path d="M8 18c0-2 1.8-3 4-3s4 1 4 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/** Icon 4: Eye icon (Listing Reviewed) */
function EyeIcon({ size = 16, color = THEME.titleRustDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

/** Icon 5: Opposing horizontal swap arrows (Counter Offer Sent) */
function SwapArrowsIcon({ size = 16, color = THEME.titleRustDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h14M14 4.5l4 3.5-4 3.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 16H6M10 12.5l-4 3.5 4 3.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ListingHistoryScreenProps {
  listingId?: string;
  cropName?: string;
  grade?: string;
  onBack: () => void;
}

export function ListingHistoryScreen({
  listingId = 'PL-001245',
  cropName = 'Tomato',
  grade = 'Grade 1',
  onBack,
}: ListingHistoryScreenProps) {
  const historyEvents = [
    {
      title: 'Listing Created',
      time: '29 Sep · 10:24 AM',
      icon: <TargetPlusIcon size={16} color={THEME.titleRustDark} />,
    },
    {
      title: 'Submitted for Review',
      time: '29 Sep · 10:25 AM',
      icon: <PlayTriangleIcon size={15} color={THEME.titleRustDark} />,
    },
    {
      title: 'Assigned to Farmer Admin',
      time: '29 Sep · 11:10 AM',
      icon: <IdBadgeIcon size={16} color={THEME.titleRustDark} />,
    },
    {
      title: 'Listing Reviewed',
      time: '29 Sep · 11:18 AM',
      icon: <EyeIcon size={16} color={THEME.titleRustDark} />,
    },
    {
      title: 'Counter Offer Sent',
      time: '29 Sep · 11:20 AM',
      icon: <SwapArrowsIcon size={16} color={THEME.titleRustDark} />,
    },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Listing History (Image 5) ─── */}
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

          <Text style={styles.headerTitle}>Listing History</Text>
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
        {/* Timeline Events List */}
        <View style={styles.timelineCard}>
          {historyEvents.map((ev, index) => (
            <View key={ev.title} style={styles.timelineItem}>
              <View style={styles.timelineIconBadge}>{ev.icon}</View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>{ev.title}</Text>
                <Text style={styles.timelineTime}>{ev.time}</Text>
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

  // ─── Scroll Body ───
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },

  // ─── Timeline Card ───
  timelineCard: {
    backgroundColor: THEME.canvas,
    gap: 18,
    marginBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  timelineIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.peachIconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
    letterSpacing: -0.2,
  },
  timelineTime: {
    fontSize: 11.5,
    color: THEME.muted,
    marginTop: 2,
  },

  // ─── Notice Box ───
  noticeBox: {
    backgroundColor: THEME.peachNoticeBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.noticeText,
    lineHeight: 18,
  },
});
