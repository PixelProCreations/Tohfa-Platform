/**
 * The three states every API-backed warehouse screen needs before it has data:
 * loading, error with Retry, and empty. One look across the area, on the admin
 * theme, matching the existing EmptyState (wallet-cashtopup/WalletParts.tsx)
 * and the WarehouseScopeGate, which renders through these too.
 *
 * Pick the state with ./queryViewState.ts; these components only draw it.
 * Error text never comes from the server's `detail`: AdminErrorState maps the
 * error to an i18n key with adminErrorKey (roles/admin/api/errors.ts).
 *
 * Lives in screens/warehouse/shared/, not a components/ folder, because the
 * cross-role guard forbids a role-level components/ directory.
 */
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { buildThemeForRole, EmptyState, ThemeProvider } from '@tohfa/mobile-ui';
import type { EmptyStateAction, EmptyStateVariant } from '@tohfa/mobile-ui';
import { RoleCode } from '@tohfa/shared-types';
import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';

// All five admin roles resolve to the same admin orange in buildThemeForRole.
const ADMIN_EMPTY_THEME = buildThemeForRole(RoleCode.MAIN_WH_ADMIN);

export interface AdminLoadingStateProps {
  /** Defaults to the generic "Loading…". */
  label?: string | undefined;
}

export function AdminLoadingState({ label }: AdminLoadingStateProps) {
  return (
    <View style={styles.centered} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={adminColors.brand} />
      <Text style={styles.caption}>{label ?? t('async.loading')}</Text>
    </View>
  );
}

export interface AdminErrorStateProps {
  /** What the request threw; picks the message through adminErrorKey. */
  error?: unknown;
  onRetry?: (() => void) | undefined;
  /** Overrides, for a caller with its own wording (the scope gate). */
  title?: string | undefined;
  message?: string | undefined;
  retryLabel?: string | undefined;
  /** Extra actions under Retry (e.g. Sign out). */
  children?: React.ReactNode;
}

export function AdminErrorState({ error, onRetry, title, message, retryLabel, children }: AdminErrorStateProps) {
  return (
    <View style={styles.centered}>
      <Text style={styles.title} accessibilityRole="header">
        {title ?? t('async.error.title')}
      </Text>
      <Text style={styles.body}>{message ?? t(adminErrorKey(error))}</Text>
      {onRetry ? (
        <AdminStateButton label={retryLabel ?? t('async.retry')} onPress={onRetry} variant="primary" />
      ) : null}
      {children}
    </View>
  );
}

export interface AdminEmptyStateProps {
  /** Defaults to the generic "Nothing here yet". */
  title?: string | undefined;
  /** Secondary line; passed to the shared EmptyState as `message`. */
  subtitle?: string | undefined;
  /** `screen` (default) for a whole empty screen/list, `compact` inside a card/section. */
  variant?: EmptyStateVariant | undefined;
  /** Material Symbols name known to the icon font; `null` hides the icon. Default 'inbox'. */
  iconName?: string | null | undefined;
  testID?: string | undefined;
  action?: EmptyStateAction | undefined;
}

/**
 * The admin areas' empty state. It only forwards to the shared EmptyState from
 * @tohfa/mobile-ui (the one "nothing here" UI in the app). The ThemeProvider
 * gives it the admin role's accent: admin screens are not wrapped in one, and
 * without it the shared component would use the default farmer green (only
 * visible on its optional action button; text and icon colours are neutrals).
 */
export function AdminEmptyState({ title, subtitle, variant, iconName, testID, action }: AdminEmptyStateProps) {
  return (
    <ThemeProvider theme={ADMIN_EMPTY_THEME}>
      <EmptyState
        title={title ?? t('async.empty.title')}
        message={subtitle}
        variant={variant}
        iconName={iconName}
        testID={testID}
        action={action}
      />
    </ThemeProvider>
  );
}

export interface AdminStateButtonProps {
  label: string;
  onPress: () => void;
  variant: 'primary' | 'secondary';
}

/** The full-width button the error state (and the scope gate's Sign out) uses. */
export function AdminStateButton({ label, onPress, variant }: AdminStateButtonProps) {
  const primary = variant === 'primary';
  return (
    <TouchableOpacity
      style={[styles.button, primary ? styles.primary : styles.secondary]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={[styles.buttonText, primary ? styles.primaryText : styles.secondaryText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  centered: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: adminSpacing.xxl,
    paddingHorizontal: adminSpacing.xl,
  },
  caption: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: adminSpacing.md,
    textAlign: 'center',
  },
  title: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    textAlign: 'center',
  },
  body: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xl,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.md,
  },
  primary: {
    backgroundColor: adminColors.brand,
  },
  secondary: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  buttonText: {
    ...adminType.rowTitle,
  },
  primaryText: {
    color: adminColors.onBrand,
  },
  secondaryText: {
    color: adminColors.ink,
  },
});
