// Design id: M13-S03
/**
 * Approval / Exception Alerts — warehouse-level problems requiring attention.
 *
 * Was SubWarehouseApprovalAlertsScreen and absorbs the Main
 * AlertsAndActionCenterScreen. The rows are now the live alerts of
 * GET /admin/alerts (batch near expiry, low stock, capacity near full), which
 * the server derives inside the viewer's scope: a Sub scope sees its own
 * warehouse, the Main view every warehouse (BR-77). Controlled: the
 * NotificationsFlow fetches and writes; this screen only draws.
 *
 * What the API cannot back is not shown: an alert carries no kind, severity
 * or read state, so the KPI tiles, the Approvals / Exceptions chips and the
 * Main Unread / Resolved / Critical chips are gone; the Main warehouse
 * selector is hidden until a real warehouse list is wired (the alert rows
 * carry a uuid, the old selector offered fixture codes). The Active / Snoozed
 * chips are the server's `state` filter. Dismiss is real (BR-78, own list
 * only); Snooze has no control because the spec gives no snooze length, only
 * a server maximum. "Open record" only navigates, and only when the record's
 * own view code passes (canOpenAlertRecord).
 */
import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { ChipGroup, ScopeHeader, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { AlertTriangleIcon, canOpenAlertRecord } from './NotificationParts';
import type { ApprovalAlertItem, WarehouseScreenBaseProps } from './types';

/** The server's `state` filter of GET /admin/alerts. */
export type AlertStateFilter = 'active' | 'snoozed';

const STATE_FILTERS: readonly AlertStateFilter[] = ['active', 'snoozed'];
const STATE_LABEL_KEY = {
  active: 'alerts.filter.active',
  snoozed: 'alerts.filter.snoozed',
} as const;

export interface ApprovalAlertsScreenProps extends WarehouseScreenBaseProps {
  /** Alert rows for the open state tab (already scoped and filtered by the server). */
  alerts: readonly ApprovalAlertItem[];
  state: AlertStateFilter;
  onStateChange: (state: AlertStateFilter) => void;
  /** Opens the alert's related record (outside this module). */
  onOpenRecord?: ((alert: ApprovalAlertItem) => void) | undefined;
  /** Dismiss in the viewer's own list; no Dismiss control without it. */
  onDismiss?: ((alert: ApprovalAlertItem) => void) | undefined;
  /** The alert whose dismiss is in flight (its control is disabled). */
  dismissingId?: string | undefined;
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
  onLoadMore?: (() => void) | undefined;
  hasMore?: boolean | undefined;
}

export function ApprovalAlertsScreen({
  scope,
  can,
  onBack,
  alerts,
  state,
  onStateChange,
  onOpenRecord,
  onDismiss,
  dismissingId,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onLoadMore,
  hasMore = false,
}: ApprovalAlertsScreenProps) {
  const view = queryViewState({ isLoading, error, itemCount: alerts.length });

  const openRecord = (alert: ApprovalAlertItem) => {
    if (onOpenRecord !== undefined && canOpenAlertRecord(can, alert.record)) onOpenRecord(alert);
  };

  const renderAlert = ({ item: alert }: { item: ApprovalAlertItem }) => {
    const canOpen = onOpenRecord !== undefined && canOpenAlertRecord(can, alert.record);
    const dismissing = dismissingId === alert.id;
    const detail = alert.timestamp === '' ? alert.detail : `${alert.detail} · ${alert.timestamp}`;
    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: adminColors.warning.border }]}
        onPress={() => openRecord(alert)}
        disabled={!canOpen}
        activeOpacity={0.8}
        accessibilityRole={canOpen ? 'button' : undefined}
      >
        <View style={[styles.iconSquare, { backgroundColor: adminColors.warning.bg }]}>
          <AlertTriangleIcon size={18} color={adminColors.warning.text} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{alert.title}</Text>
          {alert.reference !== '' ? <Text style={styles.cardMeta}>{alert.reference}</Text> : null}
          <Text style={styles.cardDetail}>{detail}</Text>
          {alert.snoozedUntil !== undefined ? (
            <Text style={styles.cardMeta}>{t('alerts.snoozedUntil', { time: alert.snoozedUntil })}</Text>
          ) : null}
          <View style={styles.actions}>
            {canOpen ? <Text style={styles.openLink}>Open record →</Text> : null}
            {onDismiss !== undefined ? (
              <TouchableOpacity
                onPress={() => onDismiss(alert)}
                disabled={dismissing}
                style={dismissing ? styles.pending : undefined}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityState={{ disabled: dismissing }}
              >
                <Text style={styles.dismissLink}>{t('alerts.dismiss')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <WalletScreen
      title="Approval / Exception Alerts"
      subtitle="Warehouse-level problems requiring attention"
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} />}
    >
      <View style={styles.chips}>
        <ChipGroup
          options={STATE_FILTERS}
          value={state}
          onChange={onStateChange}
          labelOf={(option) => t(STATE_LABEL_KEY[option])}
        />
      </View>
      {view === 'loading' ? (
        <AdminLoadingState />
      ) : view === 'error' ? (
        <AdminErrorState error={error} onRetry={onRetry} />
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(alert) => alert.id}
          renderItem={renderAlert}
          contentContainerStyle={[walletLayout.scrollContent, styles.content]}
          showsVerticalScrollIndicator={false}
          onEndReached={hasMore ? onLoadMore : undefined}
          onEndReachedThreshold={0.5}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={[adminColors.brand]}
                tintColor={adminColors.brand}
              />
            ) : undefined
          }
          ListEmptyComponent={
            <AdminEmptyState title={t(state === 'snoozed' ? 'alerts.empty.snoozed' : 'alerts.empty.active')} />
          }
          ListFooterComponent={hasMore ? <ActivityIndicator color={adminColors.brand} /> : null}
        />
      )}
    </WalletScreen>
  );
}

// Icon tile size: an icon size, not spacing.
const ICON_SQUARE = 32;

const styles = StyleSheet.create({
  content: { gap: adminSpacing.md, paddingTop: adminSpacing.md },
  chips: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderLeftWidth: 4,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  iconSquare: {
    width: ICON_SQUARE,
    height: ICON_SQUARE,
    borderRadius: adminRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { ...adminType.rowTitle, color: adminColors.ink },
  cardMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  cardDetail: { ...adminType.rowMeta, color: adminColors.ink, marginTop: adminSpacing.xs },
  actions: { flexDirection: 'row', gap: adminSpacing.lg, marginTop: adminSpacing.sm },
  openLink: { ...adminType.rowTitle, color: adminColors.brandDeep },
  dismissLink: { ...adminType.rowTitle, color: adminColors.muted },
  pending: { opacity: 0.5 },
});
