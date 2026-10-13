/**
 * Title bar for warehouse screens: optional back button + title + subtitle.
 * Token-only styling (root CLAUDE.md §2.7); copy is passed in already
 * translated so this stays free of catalogue knowledge.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@tohfa/mobile-ui';
import { t } from '../../../i18n';
import { adminTheme } from '../../../theme';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string | null | undefined;
  onBack?: (() => void) | undefined;
}

export function ScreenHeader(props: ScreenHeaderProps): React.JSX.Element {
  const { colors, spacing, typography, weights, minTouchTarget } = adminTheme;
  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.primaryPressed,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          gap: spacing.sm,
        },
      ]}
    >
      {props.onBack === undefined ? null : (
        <Pressable
          onPress={props.onBack}
          accessibilityRole="button"
          accessibilityLabel={t('admin.common.back')}
          hitSlop={spacing.sm}
          style={[styles.back, { minWidth: minTouchTarget, minHeight: minTouchTarget }]}
        >
          <Icon name="arrow_back" color={colors.white} size={typography.title} />
        </Pressable>
      )}
      <View style={styles.titles}>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={{ color: colors.white, fontSize: typography.title, fontWeight: weights.bold }}
        >
          {props.title}
        </Text>
        {props.subtitle ? (
          <Text numberOfLines={1} style={{ color: colors.white, fontSize: typography.bodySmall }}>
            {props.subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center' },
  back: { alignItems: 'center', justifyContent: 'center' },
  titles: { flex: 1 },
});
