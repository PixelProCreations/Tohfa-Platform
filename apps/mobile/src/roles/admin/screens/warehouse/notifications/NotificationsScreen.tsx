// Design id: M13-S01
/**
 * Notifications — the signed-in warehouse admin's own notifications.
 *
 * Behaviour comes from the props-driven WarehouseNotificationsScreen
 * (controlled `notifications`, mark one / mark all read, clear all, Unread
 * filter) plus what only the rewritten Sub list had: the order / wallet /
 * returns / system categories, tap-through to the detail screen and the
 * per-item action routed by the host (Review / Stock / Orders / Wallet /
 * Returns). It also absorbs the Main list (mark-all confirmation), System
 * Messages and Message History, whose rows had the same shape: they are the
 * 'System' and 'Messages' chips here, with the search box they carried.
 *
 * Layout is the ORIGINAL Sub Warehouse notifications design (owner's
 * decision, restoring what the W4k consolidation simplified): orange header
 * with '<warehouse> · N new alerts' and a profile circle at the right; a
 * scrolling row of counted chips (All, Unread, then one per category present);
 * the search box; the Approval / Exception Alerts banner; white cards with a
 * round category icon, title + relative time, message, a status tag pill and,
 * on unread cards, a tinted background with a brand stripe and '● Mark read'.
 * The design had no per-item CTA; the routed action ('Review →') is kept as
 * the tag row's trailing link, and on the detail screen.
 *
 * Gates (FINAL_LIST #62): the list and Read All / Mark read are NOT gated on
 * the client: notification.own.view and notification.own.mark_read are `all`
 * for every role in docs/rbac.json, so a client check carries no information
 * and only denied the list while /auth/me had not loaded. The server still
 * enforces both codes and own-data. An action link still needs the code of
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
  CategoryBadge,
  ChevronRightIcon,
  ConfirmDialog,
  DoubleCheckIcon,
  FILTER_LABEL,
  FilterTabs,
  NOTIFICATION_FILTERS,
  PersonIcon,
  TARGET_ROW_LABEL,
  canOpenTarget,
  matchesFilter,
  tagOf,
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
  /** Per-item action link (opens a screen outside this module). */
  onOpenTarget?: ((target: NotificationTarget, item: NotificationItem) => void) | undefined;
  /** Entry to the approval / exception alerts; the banner is hidden without it. */
  onOpenAlerts?: (() => void) | undefined;
  /** Filter chip to open on (System Messages / Message History entries). */
  initialFilter?: NotificationFilter | undefined;
  /** Profile circle in the header; non-interactive (cosmetic) without it. */
  onOpenProfile?: (() => void) | undefined;
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
  onOpenProfile,
}: NotificationsScreenProps) {
  const [filter, setFilter] = useState<NotificationFilter>(initialFilter);
  const [query, setQuery] = useState('');
  const [confirmingMarkAll, setConfirmingMarkAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Category chips with nothing in them are hidden (All / Unread / the open chip stay).
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

  const avatar = onOpenProfile ? (
    <TouchableOpacity
      style={styles.avatar}
      onPress={onOpenProfile}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Open profile"
    >
      <PersonIcon />
    </TouchableOpacity>
  ) : (
    <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <PersonIcon />
    </View>
  );

  return (
    <WalletScreen
      title="Notifications"
      subtitle={`${scopeLabel(scope)} · ${unreadCount} new ${unreadCount === 1 ? 'alert' : 'alerts'}`}
      onBack={onBack}
      headerRight={
        <View style={styles.headerRight}>
          {unreadCount > 0 ? (
            <HeaderIconButton onPress={() => setConfirmingMarkAll(true)} accessibilityLabel="Mark all as read">
              <DoubleCheckIcon />
            </HeaderIconButton>
          ) : null}
          {avatar}
        </View>
      }
    >
      <FilterTabs
        options={filters}
        value={filter}
        onChange={setFilter}
        labelOf={(f) => FILTER_LABEL[f]}
        countOf={(f) => notifications.filter((n) => matchesFilter(n, f)).length}
      />

      <ScrollView contentContainerStyle={[walletLayout.scrollContent, styles.list]} showsVerticalScrollIndicator={false}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search title, message, reference ID" />

        {onOpenAlerts ? (
          <TouchableOpacity
            style={styles.alertsBanner}
            onPress={onOpenAlerts}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={styles.alertsIcon}>
              <AlertTriangleIcon size={18} color={adminColors.warning.text} />
            </View>
            <Text style={styles.alertsText}>Approval / Exception Alerts</Text>
            <ChevronRightIcon color={adminColors.warning.text} />
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
            const tag = tagOf(item);
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
                  <View style={styles.tagRow}>
                    <StatusBadge label={tag.label} tone={tag.tone} />
                    <View style={styles.tagRowActions}>
                      {showAction && item.target !== undefined ? (
                        <TouchableOpacity
                          onPress={() => {
                            if (!item.isRead) onMarkAsRead(item.id);
                            if (item.target !== undefined) onOpenTarget?.(item.target, item);
                          }}
                          hitSlop={HIT_SLOP}
                          accessibilityRole="button"
                        >
                          <Text style={styles.actionLinkText}>{TARGET_ROW_LABEL[item.target]} →</Text>
                        </TouchableOpacity>
                      ) : null}
                      {!item.isRead ? (
                        <TouchableOpacity
                          style={styles.markReadRow}
                          onPress={() => onMarkAsRead(item.id)}
                          hitSlop={HIT_SLOP}
                          accessibilityRole="button"
                          accessibilityLabel={`Mark ${item.title} as read`}
                        >
                          <View style={styles.unreadDot} />
                          <Text style={styles.markReadLabel}>Mark read</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
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

// Fixed indicator / glyph sizes, not spacing.
const DOT = 7;
const AVATAR = 36;
const ALERT_ICON = 32;
const STRIPE = 4;
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

const styles = StyleSheet.create({
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  // Was a translucent white circle over the orange header; nearest solid token is brandDeep.
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: adminColors.brandDeep,
    borderWidth: 1,
    borderColor: adminColors.onBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: adminSpacing.md, paddingTop: adminSpacing.md },
  alertsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  alertsIcon: {
    width: ALERT_ICON,
    height: ALERT_ICON,
    borderRadius: ALERT_ICON / 2,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertsText: { ...adminType.rowTitle, color: adminColors.warning.text, flex: 1 },
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
  // Original unread card: tinted background with a brand-coloured left stripe.
  cardUnread: {
    backgroundColor: adminColors.brandTint,
    borderLeftWidth: STRIPE,
    borderLeftColor: adminColors.brand,
  },
  cardBody: { flex: 1 },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  cardTitle: { ...adminType.rowTitle, color: adminColors.ink, flex: 1, marginRight: adminSpacing.sm },
  cardTitleUnread: { color: adminColors.brand },
  cardTime: { ...adminType.rowMeta, color: adminColors.muted },
  cardMessage: { ...adminType.body, color: adminColors.muted, marginBottom: adminSpacing.sm },
  tagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: adminSpacing.sm },
  tagRowActions: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  actionLinkText: { ...adminType.caption, color: adminColors.brandDeep },
  markReadRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },
  unreadDot: { width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: adminColors.brand },
  markReadLabel: { ...adminType.caption, color: adminColors.brand },
  clearWrap: { marginTop: adminSpacing.sm },
});
