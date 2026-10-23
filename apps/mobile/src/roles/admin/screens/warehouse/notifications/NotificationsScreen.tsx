/**
 * The signed-in admin's own notifications (GET /notifications), with the All /
 * Unread tabs (the API has no categories), pull-to-refresh and load-more.
 * Controlled: NotificationsFlow fetches, owns the tab and does the read writes;
 * this screen only draws them. Loading, error and empty come from the shared
 * AsyncStates so the area looks the same everywhere. The System Messages
 * entry (M13-04) is drawn only when the host passes `onOpenSystemMessages`
 * (NotificationsFlow checks its code); colours and type are admin theme tokens.
 */
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  CategoryBadge,
  ChevronRightIcon,
  FILTER_LABEL_KEY,
  NOTIFICATION_FILTERS,
  TARGET_ROW_LABEL,
  canOpenTarget,
  type LiveNotificationFilter,
} from './NotificationParts';
import type { NotificationItem, NotificationTarget, WarehouseScreenBaseProps } from './types';

export interface NotificationsScreenProps extends WarehouseScreenBaseProps {
  /** The viewer's notifications for the current tab (already filtered by the server). */
  notifications: readonly NotificationItem[];
  /** The open tab, and the change handler (the host refetches for it). */
  filter: LiveNotificationFilter;
  onFilterChange: (filter: LiveNotificationFilter) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  /** True while a mark-all request is in flight (the button is disabled). */
  markAllPending?: boolean | undefined;
  /** Tap-through to the notification detail. */
  onSelectNotification: (item: NotificationItem) => void;
  /** Per-item action link (opens a screen outside this module). */
  onOpenTarget?: ((target: NotificationTarget, item: NotificationItem) => void) | undefined;
  /** Opens System Messages (M13-04); absent = no entry (the host decides on the code). */
  onOpenSystemMessages?: (() => void) | undefined;
  /** First load in flight (nothing to show yet). */
  isLoading?: boolean | undefined;
  /** The last fetch failed (null/undefined when it did not). */
  error?: unknown;
  onRetry?: (() => void) | undefined;
  /** Pull-to-refresh; no refresh control without it. */
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
  /** Next page; called near the end of the list while `hasMore`. */
  onLoadMore?: (() => void) | undefined;
  hasMore?: boolean | undefined;
}

export function NotificationsScreen({
  can,
  onBack,
  notifications,
  filter,
  onFilterChange,
  onMarkAsRead,
  onMarkAllAsRead,
  markAllPending = false,
  onSelectNotification,
  onOpenTarget,
  onOpenSystemMessages,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onLoadMore,
  hasMore = false,
}: NotificationsScreenProps) {
  const view = queryViewState({ isLoading, error, itemCount: notifications.length });

  const openItem = (item: NotificationItem) => {
    if (!item.isRead) onMarkAsRead(item.id);
    onSelectNotification(item);
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const showAction = item.target !== undefined && onOpenTarget !== undefined && canOpenTarget(can, item.target);
    return (
      <TouchableOpacity
        style={styles.itemRow}
        onPress={() => openItem(item)}
        activeOpacity={0.75}
        accessibilityRole="button"
      >
        {/* Status Dot */}
        <View style={[styles.dot, item.isRead ? styles.dotRead : styles.dotUnread]} />

        {/* Content */}
        <View style={styles.contentCol}>
          {item.title !== '' ? <Text style={styles.itemTitle}>{item.title}</Text> : null}
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
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
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
              accessibilityLabel={t('notifications.a11y.back')}
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

            <Text style={styles.headerTitle}>{t('notifications.title')}</Text>

            <TouchableOpacity
              onPress={onMarkAllAsRead}
              disabled={markAllPending}
              style={markAllPending ? styles.markAllPending : undefined}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ disabled: markAllPending }}
              accessibilityLabel={t('notifications.markAllRead')}
            >
              <Text style={styles.markAllReadText}>{t('notifications.markAllRead')}</Text>
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
          {NOTIFICATION_FILTERS.map((opt) => {
            const active = opt === filter;
            const label = t(FILTER_LABEL_KEY[opt]);
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.tabChip, active ? styles.tabChipActive : styles.tabChipInactive]}
                onPress={() => onFilterChange(opt)}
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

      {onOpenSystemMessages !== undefined ? (
        <TouchableOpacity
          style={styles.systemEntry}
          onPress={onOpenSystemMessages}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={t('systemMessages.entry.title')}
        >
          <CategoryBadge category="system" />
          <View style={styles.contentCol}>
            <Text style={styles.itemTitle}>{t('systemMessages.entry.title')}</Text>
            <Text style={styles.itemTimestamp}>{t('systemMessages.entry.subtitle')}</Text>
          </View>
          <ChevronRightIcon />
        </TouchableOpacity>
      ) : null}

      {/* Notifications List */}
      {view === 'loading' ? (
        <AdminLoadingState />
      ) : view === 'error' ? (
        <AdminErrorState error={error} onRetry={onRetry} />
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
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
            filter === 'Unread' ? (
              <AdminEmptyState title={t('notifications.empty.unread')} />
            ) : (
              <AdminEmptyState title={t('notifications.empty.title')} subtitle={t('notifications.empty.subtitle')} />
            )
          }
          ListFooterComponent={
            hasMore ? <ActivityIndicator style={styles.footerSpinner} color={adminColors.brand} /> : null
          }
        />
      )}
    </View>
  );
}

// Unread / read marker diameter, and the dimmed mark-all while its request runs.
const DOT = 8;
const PENDING_OPACITY = 0.5;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
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
    paddingBottom: adminSpacing.md,
  },
  backButton: {
    paddingRight: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    flex: 1,
    marginLeft: adminSpacing.xs,
  },
  markAllReadText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    textDecorationLine: 'underline',
  },
  tabsWrapper: {
    backgroundColor: adminColors.canvas,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.sm,
  },
  tabsScrollView: {
    flexGrow: 0,
  },
  tabsScroll: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingHorizontal: adminSpacing.lg,
    gap: adminSpacing.sm,
    alignItems: 'center',
  },
  tabChip: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  tabChipActive: {
    backgroundColor: adminColors.brand,
  },
  tabChipInactive: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  tabText: {
    ...adminType.body,
  },
  tabTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  tabTextInactive: {
    color: adminColors.ink,
    fontWeight: '600',
  },
  systemEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    marginHorizontal: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
    padding: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  list: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  listContent: {
    paddingBottom: adminSpacing.xxl,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: adminRadius.full,
    marginTop: adminSpacing.xs,
    marginRight: adminSpacing.sm,
  },
  dotUnread: {
    backgroundColor: adminColors.brand,
  },
  dotRead: {
    backgroundColor: adminColors.border,
  },
  contentCol: {
    flex: 1,
  },
  itemTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  itemMessage: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  itemTimestamp: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  actionLinkBtn: {
    marginTop: adminSpacing.xs,
    alignSelf: 'flex-start',
  },
  actionLinkText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  markAllPending: {
    opacity: PENDING_OPACITY,
  },
  footerSpinner: {
    paddingVertical: adminSpacing.lg,
  },
});
