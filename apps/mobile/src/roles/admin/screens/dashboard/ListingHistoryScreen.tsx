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
import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';

// ─── Exact SVG Icons ──────────────────────────────────────────────────────────

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

/** Icon 1: Target / plus in circle (Listing Created) */
function TargetPlusIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Icon 2: Play triangle pointing right (Submitted for Review) */
function PlayTriangleIcon({ size = 15, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 5l12 7-12 7V5z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </Svg>
  );
}

/** Icon 3: ID badge / user card (Assigned to Farmer Admin) */
function IdBadgeIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.8" />
      <Path d="M8 18c0-2 1.8-3 4-3s4 1 4 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

/** Icon 4: Eye icon (Listing Reviewed) */
function EyeIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
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
function SwapArrowsIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h14M14 4.5l4 3.5-4 3.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 16H6M10 12.5l-4 3.5 4 3.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ListingHistoryScreenProps {
  listingId?: string | undefined;
  cropName?: string | undefined;
  grade?: string | undefined;
  onBack: () => void;
}

export function ListingHistoryScreen({
  listingId,
  cropName,
  grade,
  onBack,
}: ListingHistoryScreenProps) {
  const historyEvents = [
    {
      title: t('listingHistory.event.created'),
      time: '29 Sep · 10:24 AM',
      icon: <TargetPlusIcon size={16} color={adminColors.brandDeep} />,
    },
    {
      title: t('listingHistory.event.submitted'),
      time: '29 Sep · 10:25 AM',
      icon: <PlayTriangleIcon size={15} color={adminColors.brandDeep} />,
    },
    {
      title: t('listingHistory.event.assigned'),
      time: '29 Sep · 11:10 AM',
      icon: <IdBadgeIcon size={16} color={adminColors.brandDeep} />,
    },
    {
      title: t('listingHistory.event.reviewed'),
      time: '29 Sep · 11:18 AM',
      icon: <EyeIcon size={16} color={adminColors.brandDeep} />,
    },
    {
      title: t('listingHistory.event.counterSent'),
      time: '29 Sep · 11:20 AM',
      icon: <SwapArrowsIcon size={16} color={adminColors.brandDeep} />,
    },
  ];

  const subtitle = [listingId, cropName && grade ? `${cropName} — ${grade}` : cropName || grade]
    .filter(Boolean)
    .join(' · ');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel={t('listingHistory.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('listingHistory.title')}</Text>
        </View>

        {subtitle ? (
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        ) : null}
      </View>

      {/* ─── Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Timeline Events List */}
        <View style={styles.timelineCard}>
          {historyEvents.map((ev) => (
            <View key={ev.title} style={styles.timelineItem}>
              <View style={styles.timelineIconBadge}>{ev.icon}</View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>{ev.title}</Text>
                <Text style={styles.timelineTime}>{ev.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: adminSpacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },

  // ─── Header ───
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginLeft: 42,
  },

  // ─── Scroll Body ───
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },

  // ─── Timeline Card ───
  timelineCard: {
    backgroundColor: adminColors.canvas,
    gap: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
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
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    letterSpacing: -0.2,
  },
  timelineTime: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },

  // ─── Notice Box ───
  noticeBox: {
    backgroundColor: adminColors.brandTintWarm,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
  },
  noticeText: {
    ...adminType.rowMeta,
    color: adminColors.brandDeep,
    lineHeight: 18,
  },
});
