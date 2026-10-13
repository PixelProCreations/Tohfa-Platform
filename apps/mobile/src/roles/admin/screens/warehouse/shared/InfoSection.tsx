/**
 * Read-only building blocks for detail/settings screens: a card section with
 * an optional title, a label/value row, and a tappable menu row.
 * Token-only styling (root CLAUDE.md §2.7); copy arrives already translated.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import { adminTheme } from '../../../theme';

const { colors, spacing, typography, weights, radius, minTouchTarget } = adminTheme;

export function InfoSection(props: { title?: string | undefined; children: React.ReactNode }): React.JSX.Element {
  return (
    <View
      style={[
        styles.section,
        {
          padding: spacing.lg,
          gap: spacing.sm,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.white,
        },
      ]}
    >
      {props.title === undefined ? null : (
        <Text
          accessibilityRole="header"
          style={{ color: colors.onSurface, fontSize: typography.bodyLarge, fontWeight: weights.semibold }}
        >
          {props.title}
        </Text>
      )}
      {props.children}
    </View>
  );
}

export function InfoRow(props: {
  label: string;
  value: string;
  hint?: string | undefined;
  tone?: 'default' | 'muted' | 'error' | undefined;
  trailing?: React.ReactNode;
}): React.JSX.Element {
  const color =
    props.tone === 'error' ? colors.error : props.tone === 'muted' ? colors.onSurfaceVariant : colors.onSurface;
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={[styles.rowBetween, { gap: spacing.md }]}>
        <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.body }}>{props.label}</Text>
        {props.trailing ?? (
          <Text
            selectable
            style={[styles.value, { color, fontSize: typography.body, fontWeight: weights.medium }]}
          >
            {props.value}
          </Text>
        )}
      </View>
      {props.hint === undefined ? null : (
        <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.caption }}>{props.hint}</Text>
      )}
    </View>
  );
}

export function MenuRow(props: { icon: string; label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      style={[styles.rowBetween, { minHeight: minTouchTarget, gap: spacing.md }]}
    >
      <Icon name={props.icon} color={colors.primary} size={typography.title} />
      <Text style={[styles.flex, { color: colors.onSurface, fontSize: typography.body }]}>{props.label}</Text>
      <Icon name="chevron_right" color={colors.onSurfaceVariant} size={typography.title} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { borderWidth: StyleSheet.hairlineWidth },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { flexShrink: 1, textAlign: 'right' },
  flex: { flex: 1 },
});
