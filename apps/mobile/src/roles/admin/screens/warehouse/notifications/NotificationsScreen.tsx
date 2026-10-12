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
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminSpacing, adminType } from '../../../theme';
import {
  FILTER_LABEL,
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
  can,
  onBack,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotification,
  onOpenTarget,
  initialFilter = 'All',
}: NotificationsScreenProps) {
  const [filter, setFilter] = useState<NotificationFilter>(initialFilter);

  // All category tabs are always available for horizontal scrolling
  const filters = NOTIFICATION_FILTERS;

  const visible = useMemo(() => {
    return notifications.filter((n) => matchesFilter(n, filter));
  }, [notifications, filter]);

  const openItem = (item: NotificationItem) => {
    if (!item.isRead) onMarkAsRead(item.id);
    onSelectNotification(item);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />
      {/* Header with Warm Orange Accent */}
      <View style={styles.header}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
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
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Notifications</Text>

            <TouchableOpacity
              onPress={onMarkAllAsRead}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Mark all as read"
            >
              <Text style={styles.markAllReadText}>Mark all read</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Horizontally scrollable Category Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled={true}
          style={styles.tabsScrollView}
          contentContainerStyle={styles.tabsScroll}
          keyboardShouldPersistTaps="handled"
        >
          {filters.map((opt) => {
            const active = opt === filter;
            const label = FILTER_LABEL[opt] ?? opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.tabChip, active ? styles.tabChipActive : styles.tabChipInactive]}
                onPress={() => setFilter(opt)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextInactive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
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
                style={styles.itemRow}
                onPress={() => openItem(item)}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                {/* Status Dot */}
                <View style={[styles.dot, item.isRead ? styles.dotRead : styles.dotUnread]} />

                {/* Content */}
                <View style={styles.contentCol}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemMessage}>{item.message}</Text>
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
    backgroundColor: '#F7F4EE',
  },
  header: {
    backgroundColor: '#F0562A',
  },
  headerSafeArea: {
    backgroundColor: '#F0562A',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    paddingRight: 10,
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 4,
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  tabsWrapper: {
    backgroundColor: '#F7F4EE',
    paddingTop: 10,
    paddingBottom: 8,
  },
  tabsScrollView: {
    flexGrow: 0,
  },
  tabsScroll: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  tabChip: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  tabChipActive: {
    backgroundColor: '#F0562A',
  },
  tabChipInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5DFD7',
  },
  tabText: {
    fontSize: 14,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabTextInactive: {
    color: '#374151',
    fontWeight: '600',
  },
  list: {
    flex: 1,
    backgroundColor: '#F7F4EE',
  },
  listContent: {
    paddingBottom: 30,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE5DC',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 10,
  },
  dotUnread: {
    backgroundColor: '#F0562A',
  },
  dotRead: {
    backgroundColor: '#D1CCC4',
  },
  contentCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 20,
  },
  itemMessage: {
    fontSize: 13.5,
    fontWeight: '400',
    color: '#5F5E5A',
    lineHeight: 18,
    marginTop: 2,
  },
  itemTimestamp: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#7E7A75',
    marginTop: 3,
  },
  actionLinkBtn: {
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  actionLinkText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#7A2E14',
  },
  emptyWrap: {
    padding: 32,
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

