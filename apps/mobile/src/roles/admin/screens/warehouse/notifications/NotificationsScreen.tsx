// Design id: M13-S01
/**
 * Notifications — the signed-in warehouse admin's own notifications.
 *
 * Base: the props-driven WarehouseNotificationsScreen (controlled
 * `notifications`, mark one / mark all read, clear all, Unread filter). It
 * gains what only the rewritten Sub list had: the order / wallet / returns /
 * system categories, tap-through to the detail screen and the per-item action
 * button routed by the host (Review / Stock / Orders / Wallet / Returns). It
 * also absorbs the Main list (mark-all confirmation), System Messages and
 * Message History, whose rows had the same shape: they are the 'System' and
 * 'Messages' filter tabs here, with the search box they carried.
 *
 * Gates (FINAL_LIST #62): the list and Read All / Mark read are NOT gated on
 * the client: notification.own.view and notification.own.mark_read are `all`
 * for every role in docs/rbac.json, so a client check carries no information
 * and only denied the list while /auth/me had not loaded. The server still
 * enforces both codes and own-data. An action button still needs the code of
 * the screen it opens (canOpenTarget). Own notifications have no warehouse
 * selector; the header names the viewer's scope.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { scopeLabel } from '../finance-expenses/FinanceParts';
import {
  EmptyState,
  HeaderIconButton,
  SearchBar,
  StatusBadge,
  WalletButton,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  AlertTriangleIcon,
  CATEGORY_TONE,
  CategoryBadge,
  ChevronRightIcon,
  ConfirmDialog,
  DoubleCheckIcon,
  FilterTabs,
  NOTIFICATION_FILTERS,
  TARGET_ROW_LABEL,
  canOpenTarget,
  matchesFilter,
} from './NotificationParts';
import type {
  NotificationFilter,
  NotificationItem,
  NotificationTarget,
  WarehouseScreenBaseProps,
} from './types';

export interface NotificationsScreenProps extends WarehouseScreenBaseProps {
  /** The viewer's notifications (controlled by the host). */
  notifications: readonly NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  /** Clear the list; the button is hidden without it. */
  onClearAll?: (() => void) | undefined;
  /** Tap-through to the notification detail. */
  onSelectNotification: (item: NotificationItem) => void;
  /** Per-item action button (opens a screen outside this module). */
  onOpenTarget?: ((target: NotificationTarget, item: NotificationItem) => void) | undefined;
  /** Entry to the approval / exception alerts; the row is hidden without it. */
  onOpenAlerts?: (() => void) | undefined;
  /** Filter tab to open on (System Messages / Message History entries). */
  initialFilter?: NotificationFilter | undefined;
}

export function NotificationsScreen({
  scope,
  can,
  onBack,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotification,
  onOpenTarget,
  onOpenAlerts,
  initialFilter = 'All',
}: NotificationsScreenProps) {
  const [filter, setFilter] = useState<NotificationFilter>(initialFilter);
  const [query, setQuery] = useState('');
  const [confirmingMarkAll, setConfirmingMarkAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Category tabs with nothing in them are hidden (All / Unread / the open tab stay).
  const filters = useMemo(
    () =>
      NOTIFICATION_FILTERS.filter(
        (f) => f === 'All' || f === 'Unread' || f === filter || notifications.some((n) => matchesFilter(n, f)),
      ),
    [notifications, filter],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notifications.filter((n) => {
      if (!matchesFilter(n, filter)) return false;
      if (q === '') return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.reference ?? '').toLowerCase().includes(q)
      );
    });
  }, [notifications, filter, query]);

  const openItem = (item: NotificationItem) => {
    if (!item.isRead) onMarkAsRead(item.id);
    onSelectNotification(item);
  };

  return (
    <WalletScreen
      title="Notifications"
      subtitle={`${scopeLabel(scope)} · ${unreadCount} new ${unreadCount === 1 ? 'alert' : 'alerts'}`}
      onBack={onBack}
      headerRight={
        unreadCount > 0 ? (
          <HeaderIconButton onPress={() => setConfirmingMarkAll(true)} accessibilityLabel="Mark all as read">
            <DoubleCheckIcon />
          </HeaderIconButton>
        ) : undefined
      }
    >
      <FilterTabs
        options={filters}
        value={filter}
        onChange={setFilter}
        countOf={(f) => notifications.filter((n) => matchesFilter(n, f)).length}
      />

      <ScrollView contentContainerStyle={[walletLayout.scrollContent, styles.list]} showsVerticalScrollIndicator={false}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search title, message, reference ID" />

        {onOpenAlerts ? (
          <TouchableOpacity
            style={styles.alertsRow}
            onPress={onOpenAlerts}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <AlertTriangleIcon size={18} color={adminColors.warning.text} />
            <Text style={styles.alertsRowText}>Approval / Exception Alerts</Text>
            <ChevronRightIcon />
          </TouchableOpacity>
        ) : null}

        {visible.length === 0 ? (
          <EmptyState
            title="All Caught Up!"
            subtitle={filter === 'Unread' ? 'No unread notifications at the moment.' : 'No notifications in this category.'}
          />
        ) : (
          visible.map((item) => {
            const showAction =
              item.target !== undefined && onOpenTarget !== undefined && canOpenTarget(can, item.target);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, !item.isRead && styles.cardUnread]}
                onPress={() => openItem(item)}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <CategoryBadge category={item.category} />
                <View style={styles.cardBody}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.cardTime}>{item.timestamp}</Text>
                  </View>
                  <Text style={styles.cardMessage} numberOfLines={2}>
                    {item.message}
                  </Text>
                  <View style={styles.cardFooterRow}>
                    {item.tag ? <StatusBadge label={item.tag} tone={CATEGORY_TONE[item.category]} /> : <View />}
                    {!item.isRead ? (
                      <TouchableOpacity
                        style={styles.unreadRow}
                        onPress={() => onMarkAsRead(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Mark ${item.title} as read`}
                      >
                        <View style={styles.unreadDot} />
                        <Text style={styles.unreadLabel}>Mark read</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  {showAction && item.target !== undefined ? (
                    <TouchableOpacity
                      style={styles.actionLink}
                      onPress={() => {
                        if (!item.isRead) onMarkAsRead(item.id);
                        if (item.target !== undefined) onOpenTarget?.(item.target, item);
                      }}
                      accessibilityRole="button"
                    >
                      <Text style={styles.actionLinkText}>{TARGET_ROW_LABEL[item.target]} →</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {onClearAll && notifications.length > 0 ? (
          <View style={styles.clearWrap}>
            <WalletButton label="Clear all" variant="neutral" onPress={onClearAll} />
          </View>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={confirmingMarkAll}
        title="Mark All Notifications as Read?"
        message={`${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'} will be marked as read.`}
        confirmLabel="Mark All as Read"
        onConfirm={() => {
          onMarkAllAsRead();
          setConfirmingMarkAll(false);
        }}
        onCancel={() => setConfirmingMarkAll(false)}
      />
    </WalletScreen>
  );
}

// Unread dot diameter: an indicator size, not spacing.
const DOT = 7;

const styles = StyleSheet.create({
  list: { gap: adminSpacing.md, paddingTop: adminSpacing.md },
  alertsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.lg,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  alertsRowText: { ...adminType.rowTitle, color: adminColors.warning.text, flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  // Was a peach border + tinted card; the PDF's unread treatment is the brand accent stripe.
  cardUnread: { borderColor: adminColors.brand, borderLeftWidth: 4, backgroundColor: adminColors.brandTint },
  cardBody: { flex: 1 },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  cardTitle: { ...adminType.rowTitle, color: adminColors.ink, flex: 1, marginRight: adminSpacing.sm },
  cardTitleUnread: { color: adminColors.brandDeep },
  cardTime: { ...adminType.rowMeta, color: adminColors.muted },
  cardMessage: { ...adminType.body, color: adminColors.muted, marginBottom: adminSpacing.sm },
  cardFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  unreadRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },
  unreadDot: { width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: adminColors.brand },
  unreadLabel: { ...adminType.caption, color: adminColors.brand },
  actionLink: { alignSelf: 'flex-start', marginTop: adminSpacing.sm },
  actionLinkText: { ...adminType.rowTitle, color: adminColors.brandDeep },
  clearWrap: { marginTop: adminSpacing.sm },
});
