/**
 * Notifications Center screen — used by TOHFA Admin, Super Admin and Farmer Admin.
 *
 * Data: live from useNotificationList(); filter chips are client-side so the
 * user can switch without a network round-trip. The Unread chip also uses a
 * client-side filter (!isRead) rather than re-fetching with unreadOnly=true,
 * keeping the cache consistent.
 *
 * "Mark all read" is shown only when unreadCount > 0 (design decision).
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { t } from '../../i18n';
import {
  adminColors,
  adminSpacing,
} from '../../theme';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationList,
} from '../warehouse/notifications/useNotificationsData';
import type { NotificationItem } from '../warehouse/notifications/types';
import {
  applyFilters,
  countUnread,
  type NotifChip,
} from './notificationsCenterLogic';
import {
  ChipRow,
  DetailModal,
  NotifCard,
  SearchBar,
} from './notificationsCenterParts';
import {
  BackArrowIcon,
  BellOutlineIcon,
  FilterSlidersIcon,
  RefreshArrowsIcon,
  TabHomeIcon,
  TabInventoryIcon,
  TabMoreIcon,
  TabWorkQueueIcon,
} from './notificationsCenterIcons';
import { styles } from './notificationsCenterStyles';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NotificationsCenterScreenProps {
  /** Permission check from the host (RBAC). Currently accepted as a prop for future gating. */
  can: (code: string) => boolean;
  /** Navigate back when the back arrow is pressed. */
  onBack: () => void;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function NotificationsCenterScreen({ onBack }: NotificationsCenterScreenProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState<NotifChip>('All');
  const [showFilterChips, setShowFilterChips] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NotificationItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Data
  const notifList = useNotificationList(false);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = notifList.items;

  const filteredItems = useMemo(
    () => applyFilters(items, activeChip, searchQuery),
    [items, activeChip, searchQuery],
  );

  const unreadCount = useMemo(() => countUnread(items), [items]);

  // Toast helper (auto-dismisses after 2.5 s)
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Handlers
  const handleCardPress = (item: NotificationItem) => {
    if (!item.isRead) {
      markRead.mutate(item.id);
    }
    setSelectedItem(item);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onError: () => {
        Alert.alert(
          t('tohfaHome.notAvailable.title'),
          t('tohfaHome.notAvailable.body'),
        );
      },
    });
  };

  const handleRefresh = () => {
    notifList.refresh();
    showToast(t('notificationsCenter.refreshed'));
  };

  const handleTabPress = () => {
    Alert.alert(
      t('tohfaHome.notAvailable.title'),
      t('tohfaHome.notAvailable.body'),
    );
  };

  // The unreadCount label is split across two nested Text nodes to match the
  // design's mixed styling (bold brand count, muted suffix). The {{count}}
  // key is kept in en.json for future server-rendered use; the display here
  // builds the same string from parts so the number can be styled separately.
  const unreadSuffix =
    unreadCount === 1
      ? t('notificationsCenter.unreadCount', { count: '' }).trim()
      : t('notificationsCenter.unreadCountPlural', { count: '' }).trim();

  return (
    <SafeAreaView style={styles.root}>
      {/* backgroundColor is Android-only; StatusBar types omit it, so we spread it */}
      <StatusBar barStyle="light-content" {...({ backgroundColor: adminColors.brand } as object)} />

      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel={t('notificationsCenter.goBack')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <BellOutlineIcon size={22} color={adminColors.onBrand} />
            <Text style={styles.headerTitle}>{t('notificationsCenter.title')}</Text>
          </View>
        </View>
      </View>

      {/* ─── Scroll Body ───────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={notifList.isRefreshing}
            onRefresh={notifList.refresh}
            tintColor={adminColors.brand}
          />
        }
      >
        {/* Toast banner */}
        {toastMessage !== null && (
          <View style={styles.toastBanner}>
            <Text style={styles.toastBannerText}>{toastMessage}</Text>
          </View>
        )}

        {/* Search bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />

        {/* Unread counter — bold brand count, muted suffix matches design */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            <Text style={styles.countBold}>{unreadCount}</Text>
            {` ${unreadSuffix}`}
          </Text>
        </View>

        {/* Action buttons: Filter, Refresh, Mark all read */}
        <View style={styles.actionBtnRow}>
          <TouchableOpacity
            style={[styles.actionBtn, showFilterChips && styles.actionBtnActive]}
            onPress={() => setShowFilterChips((v) => !v)}
            activeOpacity={0.75}
          >
            <FilterSlidersIcon
              size={16}
              color={showFilterChips ? adminColors.brandDeep : adminColors.ink}
            />
            <Text style={[styles.actionBtnText, showFilterChips && styles.actionBtnTextActive]}>
              {t('notificationsCenter.filter')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleRefresh} activeOpacity={0.75}>
            <RefreshArrowsIcon size={16} color={adminColors.ink} />
            <Text style={styles.actionBtnText}>{t('notificationsCenter.refresh')}</Text>
          </TouchableOpacity>

          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleMarkAllRead}
              activeOpacity={0.75}
            >
              <Text style={styles.actionBtnText}>{t('notificationsCenter.markAllRead')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Chip row — shown when Filter is toggled */}
        {showFilterChips && (
          <ChipRow activeChip={activeChip} onSelect={setActiveChip} />
        )}

        {/* Notification cards */}
        <View style={styles.cardsContainer}>
          {filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{t('notificationsCenter.emptyTitle')}</Text>
              <Text style={styles.emptySub}>{t('notificationsCenter.emptyBody')}</Text>
            </View>
          ) : (
            filteredItems.map((item) => (
              <NotifCard key={item.id} item={item} onPress={handleCardPress} />
            ))
          )}
        </View>

        {/* Load more */}
        {notifList.hasMore && (
          <TouchableOpacity
            style={styles.loadMoreBtn}
            onPress={() => notifList.loadMore()}
            activeOpacity={0.75}
            disabled={notifList.isLoading}
          >
            <Text style={styles.loadMoreText}>
              {notifList.isLoading
                ? t('notificationsCenter.loadingMore')
                : t('notificationsCenter.loadMore')}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>

      {/* ─── Detail Modal ──────────────────────────────────────────────────── */}
      <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      {/* ─── Bottom Tab Bar (display-only, none active on this screen) ──────── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={handleTabPress}
          activeOpacity={0.75}
          accessibilityRole="tab"
          accessibilityLabel={t('notificationsCenter.tabHome')}
        >
          <TabHomeIcon active={false} />
          <Text style={styles.tabLabel}>{t('notificationsCenter.tabHome')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={handleTabPress}
          activeOpacity={0.75}
          accessibilityRole="tab"
          accessibilityLabel={t('notificationsCenter.tabWorkQueue')}
        >
          <TabWorkQueueIcon active={false} />
          <Text style={styles.tabLabel}>{t('notificationsCenter.tabWorkQueue')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={handleTabPress}
          activeOpacity={0.75}
          accessibilityRole="tab"
          accessibilityLabel={t('notificationsCenter.tabInventory')}
        >
          <TabInventoryIcon active={false} />
          <Text style={styles.tabLabel}>{t('notificationsCenter.tabInventory')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={handleTabPress}
          activeOpacity={0.75}
          accessibilityRole="tab"
          accessibilityLabel={t('notificationsCenter.tabMore')}
        >
          <TabMoreIcon active={false} />
          <Text style={styles.tabLabel}>{t('notificationsCenter.tabMore')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

