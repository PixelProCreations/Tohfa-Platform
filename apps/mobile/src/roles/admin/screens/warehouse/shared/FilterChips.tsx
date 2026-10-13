/**
 * A horizontal single-select chip row (e.g. "All / Active / Inactive").
 * Options carry an already-translated label; `key` keeps React stable.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { adminTheme } from '../../../theme';

const { colors, spacing, typography, weights, radius, minTouchTarget } = adminTheme;

export interface ChipOption<T> {
  key: string;
  value: T;
  label: string;
}

export function FilterChips<T>(props: {
  accessibilityLabel: string;
  options: readonly ChipOption<T>[];
  selectedKey: string;
  onSelect: (value: T) => void;
}): React.JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={props.accessibilityLabel}
      style={styles.noGrow}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm }}
    >
      {props.options.map((option) => {
        const selected = option.key === props.selectedKey;
        return (
          <Pressable
            key={option.key}
            onPress={() => props.onSelect(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.chip,
              {
                minHeight: minTouchTarget,
                paddingHorizontal: spacing.md,
                borderRadius: radius.chip,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primaryPale : colors.surface,
              },
            ]}
          >
            <Text
              style={{
                color: selected ? colors.primaryPressed : colors.onSurface,
                fontSize: typography.bodySmall,
                fontWeight: selected ? weights.semibold : weights.regular,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  noGrow: { flexGrow: 0 },
  chip: { borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center' },
});
