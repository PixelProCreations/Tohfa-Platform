import React, { useMemo, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  CategoryBadge,
  FILTER_LABEL,
  NOTIFICATION_FILTERS,
  TARGET_ROW_LABEL,
  canOpenTarget,
  matchesFilter,
} from './NotificationParts';
import { WarehouseSelector } from '../inventory';
import { AdminLoadingState, AdminErrorState } from '../shared/AsyncStates';
import type {
  NotificationFilter,
  NotificationItem,
  NotificationTarget,
  WarehouseScope,
  WarehouseScreenBaseProps,
} from './types';

function SettingsGearIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

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
  /** Open notification settings preferences */
  onOpenSettings?: (() => void) | undefined;
  isLoading?: boolean | undefined;
  error?: unknown | undefined;
  onRetry?: (() => void) | undefined;
}

export function NotificationsScreen({
  scope,
  can,
  onBack,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotification,
  onOpenTarget,
  initialFilter = 'All',
  onOpenSettings,
  isLoading,
  error,
  onRetry,
}: NotificationsScreenProps) {
  const [filter, setFilter] = useState<NotificationFilter>(initialFilter);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);

  // All category tabs are always available for horizontal scrolling
  const filters = NOTIFICATION_FILTERS;

  const visible = useMemo(() => {
    return notifications.filter((n) => matchesFilter(n, filter));
  }, [notifications, filter]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const openItem = (item: NotificationItem) => {
    if (!item.isRead) onMarkAsRead(item.id);
    onSelectNotification(item);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      {/* Header with Warm Orange Accent */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M19 12H5M12 19l-7-7 7-7"
                    stroke={adminColors.onBrand}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Notifications</Text>
            </View>

            {onOpenSettings ? (
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={onOpenSettings}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Notification Settings"
              >
                <SettingsGearIcon />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={onMarkAllAsRead}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Mark all as read"
              >
                <Text style={styles.markAllReadText}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Warehouse Selector Pill under Title */}
          <View style={styles.selectorWrapper}>
            <WarehouseSelector
              scope={scope}
              selectedId={selectedWarehouseId}
              onSelect={setSelectedWarehouseId}
            />
          </View>
        </SafeAreaView>
      </View>

      {/* Notifications List with Unread Subheader */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? <AdminLoadingState /> : null}
        {error ? <AdminErrorState error={error} onRetry={onRetry} /> : null}

        {/* Unread banner row */}
        <View style={styles.subHeaderRow}>
          <Text style={styles.unreadCountText}>
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity
            onPress={onMarkAllAsRead}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.markAllLinkText}>Mark all →</Text>
          </TouchableOpacity>
        </View>

        {visible.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySubtitle}>No notifications in this category.</Text>
          </View>
        ) : (
          visible.map((item) => {
            const showAction =
              item.target !== undefined && onOpenTarget !== undefined && canOpenTarget(can, item.target);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, !item.isRead && styles.itemCardUnread]}
                onPress={() => openItem(item)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                {/* Category Icon Badge */}
                <View style={styles.cardIconWrap}>
                  <CategoryBadge category={item.category} size={38} />
                </View>

                {/* Content */}
                <View style={styles.contentCol}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {!item.isRead ? <View style={styles.unreadPillDot} /> : null}
                  </View>
                  <Text style={styles.itemMessage} numberOfLines={2}>
                    {item.message}
                  </Text>
                  <Text style={styles.itemTimestamp}>{item.timestamp}</Text>

                  {showAction && item.target !== undefined ? (
                    <TouchableOpacity
                      style={styles.actionLinkBtn}
                      onPress={() => {
                        if (!item.isRead) onMarkAsRead(item.id);
                        if (item.target !== undefined) onOpenTarget?.(item.target, item);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingBottom: adminSpacing.md,
  },
  headerSafeArea: {
    backgroundColor: adminColors.brand,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    paddingRight: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    marginLeft: adminSpacing.xs,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllReadText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
    textDecorationLine: 'underline',
  },
  selectorWrapper: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.xs,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
  },
  unreadCountText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontWeight: '600',
  },
  markAllLinkText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  listContent: {
    paddingBottom: adminSpacing.xl,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginHorizontal: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    padding: adminSpacing.md,
  },
  itemCardUnread: {
    borderColor: adminColors.brand,
    borderLeftWidth: 4,
    borderLeftColor: adminColors.brand,
  },
  cardIconWrap: {
    marginRight: adminSpacing.md,
    paddingTop: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unreadPillDot: {
    width: 8,
    height: 8,
    borderRadius: adminRadius.xs,
    backgroundColor: adminColors.brand,
    marginLeft: 6,
  },
  contentCol: {
    flex: 1,
  },
  itemTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    lineHeight: 20,
  },
  itemMessage: {
    ...adminType.body,
    color: adminColors.muted,
    lineHeight: 18,
    marginTop: 3,
  },
  itemTimestamp: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  actionLinkBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  actionLinkText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  emptyWrap: {
    padding: adminSpacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  emptySubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
  },
});

