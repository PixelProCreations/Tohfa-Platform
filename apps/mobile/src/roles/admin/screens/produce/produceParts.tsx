/**
 * Small pieces shared by the produce screens: the design's status pill
 * (origin/Superadmin-main components/AdminStatusBadge.tsx, reduced to the tones
 * these screens use) and the date label.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { t, type TranslationKey } from '../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';
import { PRODUCE_DASH } from './produceLogic';

export type ProduceBadgeTone = 'default' | 'success' | 'warning';

export function ProduceStatusBadge({ label, tone }: { label: string; tone: ProduceBadgeTone }): React.JSX.Element {
  const colors =
    tone === 'success'
      ? adminColors.success
      : tone === 'warning'
        ? adminColors.warning
        : { bg: adminColors.canvas, text: adminColors.muted, border: adminColors.border };
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[styles.text, { color: colors.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const MONTH_KEYS: readonly TranslationKey[] = [
  'produce.month.1',
  'produce.month.2',
  'produce.month.3',
  'produce.month.4',
  'produce.month.5',
  'produce.month.6',
  'produce.month.7',
  'produce.month.8',
  'produce.month.9',
  'produce.month.10',
  'produce.month.11',
  'produce.month.12',
];

const MONTH_LONG_KEYS: readonly TranslationKey[] = [
  'produce.monthLong.1',
  'produce.monthLong.2',
  'produce.monthLong.3',
  'produce.monthLong.4',
  'produce.monthLong.5',
  'produce.monthLong.6',
  'produce.monthLong.7',
  'produce.monthLong.8',
  'produce.monthLong.9',
  'produce.monthLong.10',
  'produce.monthLong.11',
  'produce.monthLong.12',
];

export function shortMonthName(month: number): string {
  const key = MONTH_KEYS[month - 1];
  return key === undefined ? PRODUCE_DASH : t(key);
}

export function longMonthName(month: number): string {
  const key = MONTH_LONG_KEYS[month - 1];
  return key === undefined ? PRODUCE_DASH : t(key);
}

/** YYYY-MM-DD (or an ISO timestamp) as "1 Oct 2026"; a dash when absent or malformed. */
export function formatProduceDate(iso: string | null | undefined): string {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return PRODUCE_DASH;
  const y = iso.slice(0, 4);
  const m = Number(iso.slice(5, 7));
  const d = Number(iso.slice(8, 10));
  return `${d} ${shortMonthName(m)} ${y}`;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: adminRadius.full,
    borderWidth: 1,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...adminType.caption,
  },
});
