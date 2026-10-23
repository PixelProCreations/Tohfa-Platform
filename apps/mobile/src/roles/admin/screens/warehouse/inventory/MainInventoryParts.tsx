/**
 * Building blocks of the Inventory tab overview (./MainInventoryDashboard.tsx):
 * stat card, section header, list rows, health grid, movement row and quick
 * action tiles. Admin theme only (colours, type, spacing and radius from
 * ../../../theme); every string arrives already translated from the caller.
 *
 * Why a stat card of its own: the only shared tile in the admin screens
 * (customers/CustomersParts StatTiles) draws a centred value and label with no
 * subtitle and no attention tone, both of which this design needs, and
 * widening it would change the Customers screens.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import type { QuickActionKey } from './mainInventoryMappers';
import type { MovementDirection } from './types';

// ─── Stat cards ──────────────────────────────────────────────────────────────

export interface InventoryStatCardProps {
  title: string;
  value: string;
  subtitle: string;
  tone: 'default' | 'danger';
  onPress?: (() => void) | undefined;
}

/** One KPI card: title, figure, subtitle. Half the grid's width. */
export function InventoryStatCard({ title, value, subtitle, tone, onPress }: InventoryStatCardProps) {
  return (
    <TouchableOpacity
      style={[styles.statCard, tone === 'danger' && styles.statCardDanger]}
      onPress={onPress}
      disabled={onPress === undefined}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <Text style={styles.statTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.statValue, tone === 'danger' && styles.statValueDanger]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statSubtitle} numberOfLines={2}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

/** Two columns of stat cards. */
export function InventoryStatGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.statGrid}>{children}</View>;
}

// ─── Sections ────────────────────────────────────────────────────────────────

export function InventorySectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {actionLabel !== undefined && onAction !== undefined ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7} accessibilityRole="button">
          <Text style={styles.sectionLink}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/** A white card holding rows. */
export function InventoryListCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.listCard}>{children}</View>;
}

/** One label / value row in an InventoryListCard; `divider` draws the line above it. */
export function InventoryListRow({
  label,
  value,
  divider,
  onPress,
}: {
  label: string;
  value: string;
  divider: boolean;
  onPress?: (() => void) | undefined;
}) {
  return (
    <TouchableOpacity
      style={[styles.listRow, divider && styles.listRowDivider]}
      onPress={onPress}
      disabled={onPress === undefined}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <Text style={styles.listLabel}>{label}</Text>
      <Text style={styles.listValue}>{value}</Text>
    </TouchableOpacity>
  );
}

/** The soft warning note under the cards. */
export function InventoryInfoNote({ text }: { text: string }) {
  return (
    <View style={styles.infoNote}>
      <InfoCircleIcon />
      <Text style={styles.infoNoteText}>{text}</Text>
    </View>
  );
}

export type HealthTone = 'success' | 'warning' | 'ink';

export interface HealthCell {
  key: string;
  label: string;
  value: string;
  tone: HealthTone;
}

/** The Inventory Health card: a 2-column grid of label / figure cells. */
export function InventoryHealthGrid({ cells }: { cells: readonly HealthCell[] }) {
  return (
    <View style={styles.healthCard}>
      {cells.map((cell) => (
        <View key={cell.key} style={styles.healthCell}>
          <Text style={styles.healthLabel}>{cell.label}</Text>
          <Text style={[styles.healthValue, healthToneStyle(cell.tone)]}>{cell.value}</Text>
        </View>
      ))}
    </View>
  );
}

function healthToneStyle(tone: HealthTone) {
  if (tone === 'success') return styles.toneSuccess;
  if (tone === 'warning') return styles.toneWarning;
  return styles.toneInk;
}

/** One stock movement: direction badge, type and where, signed quantity. */
export function InventoryMovementRow({
  title,
  subtitle,
  qty,
  time,
  direction,
  onPress,
}: {
  title: string;
  subtitle: string;
  qty: string;
  time: string;
  direction: MovementDirection;
  onPress?: (() => void) | undefined;
}) {
  return (
    <TouchableOpacity
      style={styles.movementCard}
      onPress={onPress}
      disabled={onPress === undefined}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <View style={styles.movementBadge}>
        <DirectionIcon direction={direction} />
      </View>
      <View style={styles.movementInfo}>
        <Text style={styles.movementTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.movementSub} numberOfLines={1}>
          {subtitle}
        </Text>
        <Text style={styles.movementSub} numberOfLines={1}>
          {time}
        </Text>
      </View>
      <Text style={[styles.movementQty, direction === 'out' && styles.movementQtyOut]}>{qty}</Text>
    </TouchableOpacity>
  );
}

// ─── Quick actions ───────────────────────────────────────────────────────────

export function InventoryQuickActionGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.quickGrid}>{children}</View>;
}

export function InventoryQuickActionTile({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: QuickActionKey;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickTile} onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={label}>
      <QuickActionIcon icon={icon} />
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Icons (shapes from the design reference; colours from the theme) ────────

const ICON = 24;
const SMALL_ICON = 18;

function QuickActionIcon({ icon }: { icon: QuickActionKey }) {
  const color = adminColors.brand;
  if (icon === 'consolidated') {
    return (
      <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L2 7l10 5 10-5-10-5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M2 17l10 5 10-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M2 12l10 5 10-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (icon === 'verification') {
    return (
      <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
        <Path
          d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
        <Path d="M9 13.5l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (icon === 'allocation') {
    return (
      <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
        <Path d="M12 3v9h9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 12l-6.36 6.36" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (icon === 'lowStock') {
    return (
      <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
        <Path d="M3 7l6 6 4-4 8 8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M21 12v5h-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h14M15 5l3 3-3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 16H6M9 13l-3 3 3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoCircleIcon() {
  const color = adminColors.warning.text;
  return (
    <Svg width={SMALL_ICON} height={SMALL_ICON} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Up for stock in, down for stock out, a dash when the movement carries no readable quantity. */
function DirectionIcon({ direction }: { direction: MovementDirection }) {
  const color = direction === 'out' ? adminColors.danger.text : adminColors.warning.text;
  const d = direction === 'in' ? 'M12 19V5M5 12l7-7 7 7' : direction === 'out' ? 'M12 5v14M5 12l7 7 7-7' : 'M5 12h14';
  return (
    <Svg width={SMALL_ICON} height={SMALL_ICON} viewBox="0 0 24 24" fill="none">
      <Path d={d} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: adminSpacing.md,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    alignItems: 'flex-start',
  },
  statCardDanger: {
    borderColor: adminColors.danger.border,
  },
  statTitle: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  statValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  statValueDanger: {
    color: adminColors.danger.text,
  },
  statSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpacing.input,
    marginBottom: adminSpacing.md,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  sectionLink: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  listCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xs,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.md,
  },
  listRowDivider: {
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  listLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    flexShrink: 1,
  },
  listValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginLeft: adminSpacing.md,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.lg,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  infoNoteText: {
    ...adminType.rowMeta,
    color: adminColors.warning.text,
    flex: 1,
  },
  healthCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.sm,
  },
  healthCell: {
    width: '50%',
    paddingVertical: adminSpacing.sm,
    paddingHorizontal: adminSpacing.sm,
  },
  healthLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  healthValue: {
    ...adminType.rowTitle,
    marginTop: adminSpacing.xs,
  },
  toneSuccess: { color: adminColors.success.text },
  toneWarning: { color: adminColors.warning.text },
  toneInk: { color: adminColors.ink },
  movementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  movementBadge: {
    width: adminSpacing.xxl,
    height: adminSpacing.xxl,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.warning.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movementInfo: {
    flex: 1,
    marginHorizontal: adminSpacing.md,
  },
  movementTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  movementSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  movementQty: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
  },
  movementQtyOut: {
    color: adminColors.danger.text,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: adminSpacing.md,
  },
  quickTile: {
    width: '31.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.lg,
    paddingHorizontal: adminSpacing.sm,
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  quickLabel: {
    ...adminType.caption,
    color: adminColors.ink,
    textAlign: 'center',
  },
});
