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
}

/** The review screen's brand-orange header: back arrow, applicant name, "code · status". */
export function HeaderBanner({ title, subtitle, onBack, status }: HeaderBannerProps) {
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

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export interface InfoRowProps {
  label: string;
  value: string;
  last?: boolean | undefined;
  valueTone?: ApplicationTone | undefined;
}

export function InfoRow({ label, value, last = false, valueTone }: InfoRowProps) {
  return (
    <View style={[styles.row, last ? styles.rowLast : null]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueTone === undefined ? null : { color: adminColors[valueTone].text }]}>{value}</Text>
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
    paddingTop: adminSpacing.xsSm,
    paddingBottom: adminSpacing.sm,
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
    ...adminType.rowMeta,
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
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: adminSpacing.md,
    paddingVertical: adminSpacing.smMd,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
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
