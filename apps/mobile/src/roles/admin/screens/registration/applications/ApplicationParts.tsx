/**
 * Shared look of the application screens (team design, tofhafarmfin-rbac),
 * drawn on the admin theme only: the brand header banner with a white back
 * arrow, the light back button card, status badges, label/value rows and the
 * numbered section heading.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import type { ApplicationTone } from './applicationLogic';

const ICON_SIZE = adminSpacing.input;

export function BackArrowIcon({ color }: { color: string }) {
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ChevronBackIcon({ color }: { color: string }) {
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19L8 12L15 5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** The light screens' (list, reject) back button: a white card with a chevron. */
export function BackButtonCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.backCard}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t('farmerApps.back')}
      testID="farmerApps.back"
    >
      <ChevronBackIcon color={adminColors.ink} />
    </TouchableOpacity>
  );
}

export interface HeaderBannerProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  /** Shown after the subtitle as a pill (Approved / Rejected), or as text. */
  status?: { label: string; tone: ApplicationTone; pill: boolean } | undefined;
  /** Drawn inside the banner under the title row (the design's 01/02/03 mode pills). */
  children?: React.ReactNode | undefined;
}

/** The review screen's brand-orange header: back arrow, applicant name, "code · status". */
export function HeaderBanner({ title, subtitle, onBack, status, children }: HeaderBannerProps) {
  return (
    <View style={styles.banner}>
      <View style={styles.bannerRow}>
        <TouchableOpacity
          style={styles.bannerBack}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('farmerApps.back')}
          testID="farmerApps.back"
        >
          <BackArrowIcon color={adminColors.onBrand} />
        </TouchableOpacity>
        <View style={styles.bannerTitleBox}>
          <Text style={styles.bannerTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.bannerSubtitleRow}>
            <Text style={styles.bannerSubtitle}>{subtitle}</Text>
            {status === undefined ? null : status.pill ? (
              <StatusBadge label={status.label} tone={status.tone} />
            ) : (
              <Text style={styles.bannerSubtitle}>{status.label}</Text>
            )}
          </View>
        </View>
      </View>
      {children}
    </View>
  );
}

export function StatusBadge({ label, tone }: { label: string; tone: ApplicationTone }) {
  return (
    <View style={[styles.badge, { backgroundColor: adminColors[tone].bg }]}>
      <Text style={[styles.badgeText, { color: adminColors[tone].text }]}>{label}</Text>
    </View>
  );
}

export function SectionHeading({ label }: { label: string }) {
  return (
    <Text style={styles.sectionHeading} accessibilityRole="header">
      {label}
    </Text>
  );
}

/**
 * The 2026-11-19 design's section heading with its "Step n of 5" badge on the
 * right. `state` is the application's own progress through that step
 * (detail/reviewFacts.ts), so the badge reports data rather than decoration.
 */
export function StepHeader({ label, step, total, state }: { label: string; step: number; total: number; state: 'done' | 'current' | 'pending' }) {
  const tone = state === 'done' ? styles.stepBadgeDone : state === 'current' ? styles.stepBadgeCurrent : null;
  const textTone = state === 'done' ? styles.stepBadgeDoneText : state === 'current' ? styles.stepBadgeCurrentText : null;
  return (
    <View style={styles.stepHeaderRow}>
      <Text style={styles.stepHeading} accessibilityRole="header">
        {label}
      </Text>
      <View style={[styles.stepBadge, tone]} testID="farmerApps.stepBadge">
        <Text style={[styles.stepBadgeText, textTone]}>{t('farmerApps.step', { n: step, total })}</Text>
      </View>
    </View>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export interface InfoRowProps {
  label: string;
  value: string;
  last?: boolean | undefined;
  valueTone?: ApplicationTone | undefined;
  /** The design's small grey line under a label (for example the Aadhaar's "Used to verify identity with TOHFA"). */
  hint?: string | undefined;
  /** Drawn after the value, for the design's inline badges. */
  valueSuffix?: React.ReactNode | undefined;
}

export function InfoRow({ label, value, last = false, valueTone, hint, valueSuffix }: InfoRowProps) {
  return (
    <View style={[styles.row, last ? styles.rowLast : null]}>
      <View style={styles.labelBox}>
        <Text style={styles.label}>{label}</Text>
        {hint === undefined ? null : <Text style={styles.labelHint}>{hint}</Text>}
      </View>
      <View style={styles.valueBox}>
        <Text style={[styles.value, valueTone === undefined ? null : { color: adminColors[valueTone].text }]}>{value}</Text>
        {valueSuffix}
      </View>
    </View>
  );
}

export const partStyles = StyleSheet.create({
  avatar: {
    width: ADMIN_BUTTON_HEIGHT,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.mdLg,
  },
  avatarText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  errorBox: {
    backgroundColor: adminColors.danger.bg,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
  },
  errorText: {
    ...adminType.body,
    color: adminColors.danger.text,
  },
});

const styles = StyleSheet.create({
  backCard: {
    width: ADMIN_BUTTON_HEIGHT,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  banner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.smMd,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  bannerBack: {
    padding: adminSpacing.xs,
    marginRight: adminSpacing.xs,
  },
  bannerTitleBox: { flex: 1 },
  bannerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  bannerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    marginTop: adminSpacing.xs,
  },
  bannerSubtitle: {
    // The design sets 12/500 here; adminType.body (13/400) is the nearest step.
    ...adminType.body,
    color: adminColors.onBrand,
  },
  badge: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
  },
  badgeText: {
    ...adminType.caption,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.xs,
  },
  /** The same heading inside a StepHeader row, whose own margins position it. */
  stepHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.smMd,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: adminSpacing.md,
    paddingVertical: adminSpacing.smMd,
    borderBottomWidth: 1,
    // The design's in-card hairline is lighter than the card's own stroke.
    borderBottomColor: adminColors.dashboard.divider,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.xs,
  },
  /** The design's "Step n of 5": small orange type on a soft brand pill, no stroke. */
  stepBadge: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.full,
    paddingVertical: adminSpacing.xs,
    paddingHorizontal: adminSpacing.sm,
  },
  stepBadgeDone: {
    backgroundColor: adminColors.success.bg,
  },
  stepBadgeCurrent: {
    backgroundColor: adminColors.brandTint,
  },
  stepBadgeText: {
    ...adminType.caption,
    color: adminColors.brand,
  },
  stepBadgeDoneText: { color: adminColors.success.text },
  stepBadgeCurrentText: { color: adminColors.brand },
  labelBox: { flexShrink: 1 },
  labelHint: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  valueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    flexShrink: 1,
  },
  label: {
    ...adminType.body,
    color: adminColors.muted,
  },
  value: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
});
