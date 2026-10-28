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
import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';

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
  subtitle?: string | undefined;
}

export function AdminEmptyState({ title, subtitle }: AdminEmptyStateProps) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title ?? t('async.empty.title')}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
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
  empty: { alignItems: 'center', paddingVertical: adminSpacing.xxl, paddingHorizontal: adminSpacing.lg },
  emptyTitle: { ...adminType.sectionHead, color: adminColors.ink, textAlign: 'center' },
  emptySubtitle: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs, textAlign: 'center' },
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
