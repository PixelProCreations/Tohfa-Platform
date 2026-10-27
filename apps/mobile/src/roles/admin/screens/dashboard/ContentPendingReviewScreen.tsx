import React, { useState } from 'react';
import {
  Alert,
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

export interface ContentPendingReviewScreenProps {
  onBack: () => void;
  onNavigateEditContent?: () => void;
  onPublishSuccess?: () => void;
}

export function ContentPendingReviewScreen({
  onBack,
  onNavigateEditContent,
  onPublishSuccess,
}: ContentPendingReviewScreenProps) {
  const [status, setStatus] = useState<'Draft' | 'Pending' | 'Published'>('Draft');

  const handlePublish = () => {
    setStatus('Published');
    Alert.alert('Published', 'Content item published successfully.');
    if (onPublishSuccess) onPublishSuccess();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Terracotta Header (Screenshot 3) ─── */}
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
          {/* Edit Pencil Icon Button: redirects directly to Create Content with resumed details, no popup! */}
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
        {/* ─── 15-Row Dotted Metadata Card (Matching Screenshot 3 Exactly) ─── */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Content ID</Text>
            <Text style={styles.metaValueBold}>CNT-012 · version 1</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Type</Text>
            <Text style={styles.metaValueBold}>Video</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValueBold}>{status}</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Category</Text>
            <Text style={styles.metaValueBold}>Organic Farming</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Related crops</Text>
            <Text style={styles.metaValueBold}>—</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Farming types</Text>
            <Text style={styles.metaValueBold}>—</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Season</Text>
            <Text style={styles.metaValueBold}>Not configured</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Language</Text>
            <Text style={styles.metaValueBold}>English</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Author</Text>
            <Text style={styles.metaValueBold}>Demo TOHFA Admin</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Reviewer</Text>
            <Text style={styles.metaValueBold}>—</Text>
          </View>
          <View style={styles.dottedDivider} />

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Expert verification</Text>
            <Text style={styles.metaValueBold}>Not required (not crop-specific)</Text>
          </View>
          <View style={styles.dottedDivider} />

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

        {/* ─── Description Section (Screenshot 3) ─── */}
        <Text style={styles.sectionHeading}>Description</Text>
        <Text style={styles.descriptionText}>A demonstration of organic practices.</Text>

        {/* ─── Video Section (Screenshot 3) ─── */}
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

        {/* ─── Version History Section (Screenshot 3) ─── */}
        <Text style={styles.sectionHeading}>Version history</Text>
        <Text style={styles.versionDate}>13 Oct 2026, 09:00 · Demo TOHFA Admin</Text>
        <Text style={styles.versionTitle}>Version 1: Created</Text>
      </ScrollView>

      {/* ─── Docked Bottom Actions (Screenshot 3: Pending + Publish + Cancel) ─── */}
      <View style={styles.dockedFooter}>
        <TouchableOpacity
          style={styles.pendingSolidBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.pendingSolidBtnText}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryOutlineBtn}
          onPress={handlePublish}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryOutlineBtnText}>Publish</Text>
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

  // ─── Version History ───
  versionDate: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 2,
  },
  versionTitle: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },

  // ─── Docked Footer (Screenshot 3) ───
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
  pendingSolidBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingSolidBtnText: {
    color: adminColors.onBrand,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryOutlineBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryOutlineBtnText: {
    color: adminColors.brand,
    fontSize: 14,
    fontWeight: '700',
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
