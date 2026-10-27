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
import Svg, {
  ClipPath,
  Defs,
  G,
  Path,
  Rect,
} from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SendArrowIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 2L11 13" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Grass & Mulch field banner illustration matching Screenshot 1 right */
function FieldLandscapeBanner() {
  return (
    <Svg width="100%" height={110} viewBox="0 0 340 110" preserveAspectRatio="none">
      <Defs>
        <ClipPath id="bannerClip">
          <Rect width="340" height="110" rx="14" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#bannerClip)">
        {/* Soft sunshine background */}
        <Rect width="340" height="110" fill={adminColors.warning.bg} opacity="0.6" />
        <Rect width="340" height="60" fill={adminColors.success.bg} opacity="0.4" />
        {/* Grass stalks and mulch texture */}
        <Path d="M-10 110 Q 40 40, 90 110 T 190 110 T 290 110 T 360 110" fill={adminColors.success.text} opacity="0.6" />
        <Path d="M20 110 Q 60 20, 80 110" stroke={adminColors.success.text} strokeWidth="2.5" fill="none" />
        <Path d="M45 110 Q 75 10, 110 110" stroke={adminColors.success.text} strokeWidth="3" fill="none" />
        <Path d="M130 110 Q 150 15, 170 110" stroke={adminColors.brandDeep} strokeWidth="2.2" fill="none" opacity="0.7" />
        <Path d="M180 110 Q 210 25, 230 110" stroke={adminColors.success.text} strokeWidth="2.8" fill="none" />
        <Path d="M250 110 Q 280 15, 310 110" stroke={adminColors.success.text} strokeWidth="3" fill="none" />
        <Path d="M290 110 Q 320 30, 345 110" stroke={adminColors.brandDeep} strokeWidth="2" fill="none" opacity="0.7" />
        {/* Straw mulch bits */}
        <Path d="M10 95 L 60 88 M 80 98 L 130 92 M 150 94 L 210 89 M 230 96 L 290 91" stroke={adminColors.warning.text} strokeWidth="2" opacity="0.7" />
      </G>
    </Svg>
  );
}

// ─── Thread Data Model ────────────────────────────────────────────────────────

export interface MessageThread {
  id: string;
  sender: string;
  status: 'Unread' | 'Replied';
  preview: string;
  timestamp: string;
}

const SAMPLE_THREADS: MessageThread[] = [
  {
    id: 'thread-1',
    sender: 'Selvi (Farmer)',
    status: 'Unread',
    preview: 'How often should the mulch layer be replaced?',
    timestamp: '12 Oct 2026, 14:40',
  },
  {
    id: 'thread-2',
    sender: 'Ramesh Kumar (Farmer)',
    status: 'Replied',
    preview: 'Does mulching work for tomato beds too, or only root crops?',
    timestamp: '11 Oct 2026, 09:12',
  },
  {
    id: 'thread-3',
    sender: 'Meena (Farmer)',
    status: 'Replied',
    preview: 'Thanks, this helped with my cabbage bed too.',
    timestamp: '13 Oct 2026, 08:05',
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ArticleDetailsScreenProps {
  onBack: () => void;
  onOpenChatThread?: (threadId: string) => void;
  onOpenContentDetails?: () => void;
}

export function ArticleDetailsScreen({
  onBack,
  onOpenChatThread,
  onOpenContentDetails,
}: ArticleDetailsScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Terracotta Header (Screenshot 1 right: "Artical details") ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Artical details</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Banner Card (Screenshot 1 right) ─── */}
        <TouchableOpacity
          style={styles.bannerCard}
          onPress={onOpenContentDetails}
          activeOpacity={0.8}
        >
          <FieldLandscapeBanner />
          <View style={styles.bannerInfo}>
            <View style={styles.bannerTitleRow}>
              <Text style={styles.bannerTitle}>Mulching for water retention</Text>
              <View style={styles.badgeGroup}>
                <View style={styles.approvedBadge}>
                  <Text style={styles.approvedBadgeText}>Approved</Text>
                </View>
                <View style={styles.articleBadge}>
                  <Text style={styles.articleBadgeText}>Article</Text>
                </View>
              </View>
            </View>
            <Text style={styles.bannerSubtitle}>
              General · Not crop-specific · English · Demo TOHFA Admin
            </Text>
            <Text style={styles.bannerDate}>Submitted 10 Oct 2026, 09:00</Text>
          </View>
        </TouchableOpacity>

        {/* ─── Recent Messages Header (Screenshot 1 right) ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Recent messages</Text>
          <Text style={styles.sectionHeadingMeta}>{SAMPLE_THREADS.length} threads</Text>
        </View>

        {/* ─── Recent Messages Threads List ─── */}
        <View style={styles.threadsList}>
          {SAMPLE_THREADS.map((item) => {
            const isUnread = item.status === 'Unread';
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.threadCard}
                onPress={() => onOpenChatThread && onOpenChatThread(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.threadHeaderRow}>
                  <Text style={styles.threadSender}>{item.sender}</Text>
                  <View style={isUnread ? styles.unreadBadge : styles.repliedBadge}>
                    <Text style={isUnread ? styles.unreadBadgeText : styles.repliedBadgeText}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.threadPreview} numberOfLines={2}>
                  {item.preview}
                </Text>

                <Text style={styles.threadTimestamp}>{item.timestamp}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Action Button matching Screenshot 1 right */}
      <TouchableOpacity
        style={styles.fabBtn}
        onPress={() => onOpenChatThread && onOpenChatThread('thread-1')}
        activeOpacity={0.85}
        accessibilityLabel="Open Q&A Chat"
      >
        <SendArrowIcon size={20} color={adminColors.onBrand} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Stylesheet (Theme tokens compliant, zero raw hex/rgba) ───────────────────

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
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 20,
    fontWeight: '800',
  },

  // ─── Scroll Area ───
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: 80,
  },

  // ─── Banner Card ───
  bannerCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  bannerInfo: {
    padding: adminSpacing.md,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  bannerTitle: {
    ...adminType.rowTitle,
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  approvedBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: adminRadius.full,
  },
  approvedBadgeText: {
    color: adminColors.success.text,
    fontSize: 11,
    fontWeight: '700',
  },
  articleBadge: {
    backgroundColor: adminColors.info.bg,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: adminRadius.full,
  },
  articleBadgeText: {
    color: adminColors.info.text,
    fontSize: 11,
    fontWeight: '700',
  },
  bannerSubtitle: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 4,
  },
  bannerDate: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 3,
  },

  // ─── Section Header ───
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionHeading: {
    ...adminType.rowTitle,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  sectionHeadingMeta: {
    ...adminType.caption,
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },

  // ─── Threads List ───
  threadsList: {
    gap: 10,
  },
  threadCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  threadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  threadSender: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  unreadBadge: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  unreadBadgeText: {
    color: adminColors.warning.text,
    fontSize: 11,
    fontWeight: '700',
  },
  repliedBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  repliedBadgeText: {
    color: adminColors.success.text,
    fontSize: 11,
    fontWeight: '700',
  },
  threadPreview: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    marginTop: 6,
    lineHeight: 18,
  },
  threadTimestamp: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 6,
  },

  // ─── Floating Action Button ───
  fabBtn: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.md,
  },
});
