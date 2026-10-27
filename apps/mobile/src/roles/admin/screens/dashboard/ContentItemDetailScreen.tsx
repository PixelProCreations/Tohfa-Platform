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
import Svg, { Path } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
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

function PencilEditIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ContentItemDetailScreenProps {
  onBack: () => void;
  onNavigateChat?: () => void;
  onNavigateMessages?: () => void;
  onNavigateEditContent?: () => void;
}

export function ContentItemDetailScreen({
  onBack,
  onNavigateChat,
  onNavigateMessages,
  onNavigateEditContent,
}: ContentItemDetailScreenProps) {
  const handleOpenChat = () => {
    if (onNavigateChat) onNavigateChat();
    else if (onNavigateMessages) onNavigateMessages();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Terracotta Header (Screenshot 1) ─── */}
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            Mulching for water retention
          </Text>
          {/* Edit Pencil Icon Button: redirects directly to Create Content with resumed details (No popup!) */}
          <TouchableOpacity
            style={styles.headerEditBtn}
            onPress={onNavigateEditContent}
            activeOpacity={0.8}
            accessibilityLabel="Edit content details"
          >
            <PencilEditIcon size={18} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Metadata Card (Matching Screenshot 1 top visible rows) ─── */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Published</Text>
            <Text style={styles.metaValueBold}>—</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Expires</Text>
            <Text style={styles.metaValueBold}>—</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Visibility</Text>
            <Text style={styles.metaValueBold}>Everyone</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Featured</Text>
            <Text style={styles.metaValueBold}>No</Text>
          </View>
        </View>

        {/* ─── Description Section (Screenshot 1) ─── */}
        <Text style={styles.sectionHeading}>Description</Text>
        <Text style={styles.descriptionText}>A demonstration of organic practices.</Text>

        {/* ─── Video Section (Screenshot 1) ─── */}
        <Text style={styles.sectionHeading}>Video</Text>
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Source</Text>
            <Text style={styles.metaValueBold}>Link</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>File or link</Text>
            <Text style={styles.metaValueBold} numberOfLines={1}>
              https://video.example.org/organic
            </Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Duration</Text>
            <Text style={styles.metaValueBold}>15 min 0 s</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Processing</Text>
            <Text style={styles.metaValueBold}>Ready</Text>
          </View>
        </View>

        {/* ─── Replies Section (Screenshot 1) ─── */}
        <Text style={styles.sectionHeading}>Replies</Text>
        <View style={styles.repliesList}>
          {/* Reply 1: Selvi */}
          <TouchableOpacity
            style={styles.replyCard}
            onPress={handleOpenChat}
            activeOpacity={0.7}
          >
            <View style={styles.replyHeaderRow}>
              <Text style={styles.replySender}>Selvi (Farmer)</Text>
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>Unread</Text>
              </View>
            </View>
            <Text style={styles.replyPreview}>How often should the mulch layer be replaced?</Text>
            <Text style={styles.replyTimestamp}>12 Oct 2026, 14:40</Text>
          </TouchableOpacity>

          {/* Reply 2: Ramesh Kumar */}
          <TouchableOpacity
            style={styles.replyCard}
            onPress={handleOpenChat}
            activeOpacity={0.7}
          >
            <View style={styles.replyHeaderRow}>
              <Text style={styles.replySender}>Ramesh Kumar (Farmer)</Text>
              <View style={styles.repliedBadge}>
                <Text style={styles.repliedBadgeText}>Replied</Text>
              </View>
            </View>
            <Text style={styles.replyPreview}>
              Does mulching work for tomato beds too, or only root crops?
            </Text>
            <Text style={styles.replyTimestamp}>11 Oct 2026, 09:12</Text>
          </TouchableOpacity>

          {/* Reply 3: Meena */}
          <TouchableOpacity
            style={styles.replyCard}
            onPress={handleOpenChat}
            activeOpacity={0.7}
          >
            <View style={styles.replyHeaderRow}>
              <Text style={styles.replySender}>Meena (Farmer)</Text>
              <View style={styles.repliedBadge}>
                <Text style={styles.repliedBadgeText}>Replied</Text>
              </View>
            </View>
            <Text style={styles.replyPreview}>
              Thanks, this helped with my cabbage bed too.
            </Text>
            <Text style={styles.replyTimestamp}>13 Oct 2026, 08:05</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ─── Docked Bottom Actions (Screenshot 1: View chat + Cancel) ─── */}
      <View style={styles.dockedFooter}>
        <TouchableOpacity
          style={styles.primarySolidBtn}
          onPress={handleOpenChat}
          activeOpacity={0.8}
        >
          <Text style={styles.primarySolidBtnText}>View chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────

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
    flex: 1,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '800',
  },
  headerEditBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Scroll Area ───
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: 90,
  },

  // ─── Meta Card ───
  metaCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  metaLabel: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
  },
  metaValueBold: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  dottedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    marginVertical: 1,
  },

  // ─── Section Headings ───
  sectionHeading: {
    ...adminType.title,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: 12,
    marginBottom: 8,
  },
  descriptionText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    lineHeight: 19,
    marginBottom: 6,
  },

  // ─── Replies List ───
  repliesList: {
    gap: 10,
    marginBottom: 16,
  },
  replyCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  replyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  replySender: {
    ...adminType.body,
    fontSize: 13.5,
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
  replyPreview: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    marginTop: 6,
    lineHeight: 18,
  },
  replyTimestamp: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 6,
  },

  // ─── Docked Footer (Screenshot 1: View chat + Cancel) ───
  dockedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.canvas,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    flexDirection: 'row',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 12,
    gap: 10,
  },
  primarySolidBtn: {
    flex: 2,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarySolidBtnText: {
    color: adminColors.onBrand,
    fontSize: 14,
    fontWeight: '800',
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
});
