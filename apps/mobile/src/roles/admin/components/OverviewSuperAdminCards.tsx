/**
 * The three list/tile cards the Super Admin design (origin/Superadmin-main
 * components/OverviewDashboardCard.tsx) adds next to the stat card: a Quick
 * Access tile, a Work Queue row card and an Approval Inbox row card.
 *
 * They live here, not in ./OverviewDashboardCard.tsx, because that file is the
 * owner's restored stat card and must not change. Visual spec follows the
 * design; every colour, size and radius is an admin theme token, and every
 * label is passed in by the caller (already translated) so no English string
 * is baked into a component.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../theme';
import { AdminStatusBadge } from './AdminStatusBadge';

/** Tile width for a two-column grid with a gap (matches the design's 48.5%). */
const TILE_WIDTH = '48.5%';
const ICON_WRAP_SIZE = adminSpacing.xxl + adminSpacing.md;

export interface OverviewActionCardProps {
  title: string;
  icon: React.ReactNode;
  onPress?: (() => void) | undefined;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Quick Access tile: round icon over a centred title. */
export function OverviewActionCard({ title, icon, onPress, disabled = false, style, accessibilityLabel }: OverviewActionCardProps) {
  return (
    <TouchableOpacity
      style={[styles.actionCard, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.72 : 1}
      disabled={disabled || !onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <View style={styles.actionIconWrap}>{icon}</View>
      <Text style={styles.actionTitle} numberOfLines={2}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export interface OverviewQueueCardProps {
  title: string;
  badgeLabel: string;
  badgeStatus?: string | undefined;
  meta: string;
  viewDetailsLabel: string;
  onPress?: (() => void) | undefined;
  accentTone?: ('danger' | 'warning' | 'default') | undefined;
  style?: StyleProp<ViewStyle> | undefined;
}

/** Work Queue row: title and status badge, then "meta · View Details". */
export function OverviewQueueCard({
  title,
  badgeLabel,
  badgeStatus,
  meta,
  viewDetailsLabel,
  onPress,
  accentTone = 'default',
  style,
}: OverviewQueueCardProps) {
  const isAlert = accentTone === 'danger';
  return (
    <TouchableOpacity
      style={[styles.queueCard, isAlert && styles.queueCardAlert, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.72 : 1}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.queueTopRow}>
        <Text style={styles.queueTitle} numberOfLines={1}>
          {title}
        </Text>
        <AdminStatusBadge status={badgeStatus ?? (isAlert ? 'FLAGGED' : 'PENDING')} label={badgeLabel} />
      </View>
      <Text style={styles.queueMeta} numberOfLines={1}>
        {meta} · <Text style={styles.queueViewDetails}>{viewDetailsLabel}</Text>
      </Text>
    </TouchableOpacity>
  );
}

export interface OverviewApprovalCardProps {
  category: string;
  title: string;
  meta: string;
  badgeLabel: string;
  statusTone?: ('default' | 'success' | 'warning' | 'info' | 'danger') | undefined;
  onPress?: (() => void) | undefined;
  style?: StyleProp<ViewStyle> | undefined;
}

/** Approval Inbox row: category and status badge over title and meta. */
export function OverviewApprovalCard({ category, title, meta, badgeLabel, statusTone, onPress, style }: OverviewApprovalCardProps) {
  return (
    <TouchableOpacity
      style={[styles.approvalCard, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.72 : 1}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.approvalCategoryRow}>
        <Text style={styles.approvalCategoryText} numberOfLines={1}>
          {category}
        </Text>
        <AdminStatusBadge label={badgeLabel} tone={statusTone ?? 'warning'} />
      </View>
      <Text style={styles.approvalItemTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.approvalItemMeta} numberOfLines={1}>
        {meta}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    width: TILE_WIDTH,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    minHeight: adminSpacing.xxxl * 2,
  },
  actionIconWrap: {
    width: ICON_WRAP_SIZE,
    height: ICON_WRAP_SIZE,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.xs + 2,
  },
  actionTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    textAlign: 'center',
  },
  queueCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  queueCardAlert: {
    borderLeftWidth: adminSpacing.xs,
    borderLeftColor: adminColors.danger.text,
  },
  queueTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  queueTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    flex: 1,
    paddingRight: adminSpacing.xs,
  },
  queueMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  queueViewDetails: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  approvalCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  approvalCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  approvalCategoryText: {
    ...adminType.rowMeta,
    color: adminColors.brandDeep,
    fontWeight: '700',
    flex: 1,
    paddingRight: adminSpacing.xs,
  },
  approvalItemTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 2,
  },
  approvalItemMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
});
