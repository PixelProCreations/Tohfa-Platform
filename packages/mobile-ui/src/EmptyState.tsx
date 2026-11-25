/**
 * The ONE empty-state ("no data") UI for the whole mobile app — farmer,
 * customer and admin. A screen with nothing to show (no orders, no
 * certificates, an empty basket, a section with no rows) renders this instead
 * of its own Text/icon/emptyContainer block, so every "nothing here" looks and
 * reads the same everywhere and is fixed in one place.
 *
 * Two layouts:
 * - `screen` (default): the whole screen or list is empty. Centred column: a
 *   large soft-tinted circular badge with the icon in the role's primary
 *   colour, an h3 title, a muted helper line capped at a readable measure,
 *   and (optionally) a primary button that hugs its label rather than
 *   stretching edge to edge. It does not force `flexGrow` (existing callers
 *   sit inside ScrollViews and cards); to centre it vertically in a FlatList,
 *   give the list `contentContainerStyle={{ flexGrow: 1 }}` and pass
 *   `style={{ flex: 1 }}` here.
 * - `compact`: one card or section inside an otherwise populated screen is
 *   empty (e.g. "Active Crops" on the farmer Home). A rounded inset panel
 *   (surfaceVariant fill) with a small tinted badge on the left and the
 *   title / message / action left-aligned beside it, so it reads as a quiet
 *   placeholder row inside a dashboard rather than a second page. It
 *   stretches to its parent's width — give it a width-constrained parent
 *   (not a horizontal ScrollView).
 *
 * The badge tint is `theme.colors.primaryTint` (role-aware: green wash for
 * farmer/customer, orange wash for admin themes — see tokens.roleTintColor).
 *
 * What this is NOT for: loading (use Skeleton), failures (use ErrorState /
 * FormAlert), or a one-word "None" value inside a dense row.
 *
 * Copy is always passed in already translated — this package has no i18n
 * catalogue of its own, and the role screens own their keys. Every size and
 * colour comes from the theme / @tohfa/design-tokens (root CLAUDE.md §2.7).
 *
 * The decorative icon is hidden from screen readers; the title and message are
 * what is announced. `testID` lands on the root view, and the action button
 * gets `action.testID` (or `<testID>-action` when only the root has one), so
 * tests that looked for an ad-hoc block's testID keep working after it is
 * replaced by this component.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { tokens } from '@tohfa/design-tokens';
import { useTheme } from './theme';
import { Icon } from './Icon';
import { Button } from './Button';

export type EmptyStateVariant = 'screen' | 'compact';

export interface EmptyStateAction {
  /** Already-translated button label, e.g. t('farmer.listings.market.createListing'). */
  label: string;
  onPress: () => void;
  testID?: string | undefined;
}

export interface EmptyStateProps {
  /** Already-translated headline, e.g. "No orders yet". */
  title: string;
  /** Optional already-translated secondary line under the title. */
  message?: string | undefined;
  /**
   * Material Symbols name (see ./iconCodepoints.ts — add the codepoint there
   * if a new name is needed). Defaults to `inbox`. Pass `null` for no icon.
   */
  iconName?: string | null | undefined;
  /** Optional primary call to action, e.g. "Create listing". */
  action?: EmptyStateAction | undefined;
  /** `screen` (default) for a whole empty screen/list, `compact` inside a card or section. */
  variant?: EmptyStateVariant | undefined;
  testID?: string | undefined;
  /** Layout-only overrides from the caller (margins, flex). Not for colours. */
  style?: StyleProp<ViewStyle> | undefined;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  iconName = 'inbox',
  action,
  variant = 'screen',
  testID,
  style,
}) => {
  const theme = useTheme();
  const compact = variant === 'compact';

  const iconSize = compact ? tokens.size.emptyStateIconCompact : tokens.size.emptyStateIcon;
  const badgeSize = compact ? tokens.size.emptyStateBadgeCompact : tokens.size.emptyStateBadge;
  const actionTestID = action?.testID ?? (testID ? `${testID}-action` : undefined);
  // Screen title is the design system's h3; the compact title stays at body
  // size so a dashboard section's own header keeps the visual lead.
  const titleStyle = compact ? tokens.typeStyle.bodyMedium : tokens.typeStyle.h3;
  const messageStyle = compact ? tokens.typeStyle.small : tokens.typeStyle.body;

  const badge = iconName ? (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.badge,
        {
          width: badgeSize,
          height: badgeSize,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.primaryTint ?? theme.colors.surfaceVariant ?? theme.colors.surface,
        },
        compact ? { marginRight: theme.spacing.md } : { marginBottom: theme.spacing.lg },
      ]}
    >
      <Icon color={theme.colors.primary} name={iconName} size={iconSize} />
    </View>
  ) : null;

  const textBlock = (
    <>
      <Text
        accessibilityRole="header"
        style={[
          compact ? styles.textStart : styles.textCentered,
          {
            fontSize: compact ? theme.typography.body : titleStyle.size,
            lineHeight: titleStyle.lineHeight,
            fontWeight: theme.weights.semibold,
            color: theme.colors.onSurface,
          },
          !compact && { maxWidth: tokens.size.emptyStateTextMaxWidth },
        ]}
      >
        {title}
      </Text>
      {message ? (
        <Text
          style={[
            compact ? styles.textStart : styles.textCentered,
            {
              fontSize: messageStyle.size,
              lineHeight: messageStyle.lineHeight,
              color: theme.colors.textMuted ?? theme.colors.onSurface,
              marginTop: compact ? theme.spacing.xs : theme.spacing.sm,
            },
            !compact && { maxWidth: tokens.size.emptyStateTextMaxWidth },
          ]}
        >
          {message}
        </Text>
      ) : null}
      {action ? (
        <Button
          onPress={action.onPress}
          style={{
            marginTop: compact ? theme.spacing.sm : theme.spacing.xl,
            alignSelf: compact ? 'flex-start' : 'center',
            ...(compact ? {} : { minWidth: tokens.size.emptyStateActionMinWidth, paddingHorizontal: theme.spacing.xl }),
            borderRadius: theme.radius.pill,
          }}
          size={compact ? 'sm' : 'md'}
          title={action.label}
          {...(actionTestID ? { testID: actionTestID } : {})}
        />
      ) : null}
    </>
  );

  if (compact) {
    return (
      <View
        testID={testID}
        style={[
          styles.compactContainer,
          {
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.radius.lg ?? theme.radius.cardMin,
            backgroundColor: theme.colors.surfaceVariant ?? theme.colors.surface,
          },
          style,
        ]}
      >
        {badge}
        <View style={styles.compactText}>{textBlock}</View>
      </View>
    );
  }

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        { paddingVertical: theme.spacing.xxl, paddingHorizontal: theme.spacing.xxl },
        style,
      ]}
    >
      {badge}
      {textBlock}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactContainer: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  compactText: {
    flex: 1,
    alignItems: 'flex-start',
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCentered: {
    textAlign: 'center',
  },
  textStart: {
    textAlign: 'left',
  },
});
