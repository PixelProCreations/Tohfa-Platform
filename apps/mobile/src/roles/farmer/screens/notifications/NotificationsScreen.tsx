import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { t } from '../../../../i18n/farmer';
import { authPalette as P, colors } from '../../theme';
import {
  listNotifications,
  markNotificationAsRead,
  type NotificationItem as ApiNotificationItem,
} from '../../api/notifications';

// --- SVG Icons for Notifications ---

function ChevronLeftIcon({ color = P.ink, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 19L8 12L15 5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CartIcon({ color = P.twAmber600, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 3H5.2L7.3 14.2C7.4 14.8 7.9 15.3 8.6 15.3H18.2C18.8 15.3 19.3 14.8 19.4 14.2L20.7 7.2C20.8 6.5 20.3 6 19.6 6H6.1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="19.5" r="1.5" fill={color} />
      <Circle cx="17.5" cy="19.5" r="1.5" fill={color} />
    </Svg>
  );
}

function AlertTriangleIcon({ color = P.twRed600, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3L2 20H22L12 3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function CheckmarkIcon({ color = P.twGreen600, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5L9.5 17L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ color = P.twOrange600, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth="2" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="2" x2="8" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="16" y1="2" x2="16" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ClipboardCheckIcon({ color = P.sky600, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="17" rx="2.5" stroke={color} strokeWidth="2" />
      <Path d="M8.5 12L11 14.5L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DeviceTutorialIcon({ color = P.twPurple600, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="6" y="3" width="12" height="18" rx="2.5" stroke={color} strokeWidth="2" />
      <Line x1="10.5" y1="18" x2="13.5" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// --- Types ---

export type NotificationCategory = 'all' | 'reminders' | 'approvals' | 'alerts' | 'success';

interface UINotificationItem {
  id: string;
  section: 'TODAY' | 'YESTERDAY' | 'EARLIER';
  category: 'reminders' | 'approvals' | 'alerts' | 'success';
  title: string;
  message: string;
  time: string;
  hasAction?: boolean | undefined;
  actionLabel?: string | undefined;
  isUnread: boolean;
  iconBg: string;
  iconColor: string;
  iconType: 'cart' | 'warning' | 'check' | 'calendar' | 'clipboard' | 'tutorial';
  data?: Record<string, unknown> | undefined;
}

interface NotificationsScreenProps {
  onBack: () => void;
  onNavigateToCounterOffer?: (listingId?: string) => void;
}

// --- Helpers ---

function getSection(createdAt: string): 'TODAY' | 'YESTERDAY' | 'EARLIER' {
  const date = new Date(createdAt);
  const now = new Date();

  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    return 'TODAY';
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return 'YESTERDAY';
  }

  return 'EARLIER';
}

function formatRelativeTime(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) {
    const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return `Yesterday, ${timeStr}`;
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function categorizeNotification(item: ApiNotificationItem): 'reminders' | 'approvals' | 'alerts' | 'success' {
  const rawCat = typeof item.data?.category === 'string' ? item.data.category.toLowerCase() : '';
  if (rawCat === 'reminders' || rawCat === 'approvals' || rawCat === 'alerts' || rawCat === 'success') {
    return rawCat;
  }

  const event = typeof item.data?.eventName === 'string' ? item.data.eventName.toLowerCase() : '';
  if (
    event.includes('counter_offer') ||
    event.includes('approved') ||
    event.includes('order.confirmed')
  ) {
    return 'approvals';
  }
  if (
    event.includes('rejected') ||
    event.includes('expiring') ||
    event.includes('warning') ||
    event.includes('alert')
  ) {
    return 'alerts';
  }
  if (
    event.includes('payout') ||
    event.includes('paid') ||
    event.includes('credited') ||
    event.includes('delivered') ||
    event.includes('goods.received')
  ) {
    return 'success';
  }
  if (event.includes('info_requested') || event.includes('dispatched') || event.includes('due')) {
    return 'reminders';
  }

  const text = `${item.title ?? ''} ${item.body}`.toLowerCase();
  if (text.includes('counter') || text.includes('offer') || text.includes('approved') || text.includes('approval')) {
    return 'approvals';
  }
  if (text.includes('warn') || text.includes('alert') || text.includes('danger') || text.includes('expir') || text.includes('reject')) {
    return 'alerts';
  }
  if (text.includes('credit') || text.includes('paid') || text.includes('payout') || text.includes('payment') || text.includes('success')) {
    return 'success';
  }

  return 'reminders';
}

function getIconMeta(
  category: 'reminders' | 'approvals' | 'alerts' | 'success',
  title: string,
  body: string,
): {
  iconType: 'cart' | 'warning' | 'check' | 'calendar' | 'clipboard' | 'tutorial';
  iconBg: string;
  iconColor: string;
} {
  const text = `${title} ${body}`.toLowerCase();
  if (category === 'approvals') {
    if (text.includes('listing') || text.includes('certif') || text.includes('doc')) {
      return { iconType: 'clipboard', iconBg: P.sky100, iconColor: P.sky600 };
    }
    return { iconType: 'cart', iconBg: P.twAmber100, iconColor: P.twAmber600 };
  }
  if (category === 'alerts') {
    return { iconType: 'warning', iconBg: P.twRed100, iconColor: P.twRed600 };
  }
  if (category === 'success') {
    return { iconType: 'check', iconBg: P.twGreen100, iconColor: P.twGreen600 };
  }
  if (text.includes('tutorial') || text.includes('video') || text.includes('learn')) {
    return { iconType: 'tutorial', iconBg: P.twPurple100, iconColor: P.twPurple600 };
  }
  return { iconType: 'calendar', iconBg: P.twOrange100, iconColor: P.twOrange600 };
}

export function NotificationsScreen({
  onBack,
  onNavigateToCounterOffer,
}: NotificationsScreenProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<NotificationCategory>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [rawItems, setRawItems] = useState<ApiNotificationItem[]>([]);
  const [_unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await listNotifications({ limit: 50 });
      setRawItems(res.items);
      setUnreadCount(res.unreadCount);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
      setError('Unable to load notifications. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  // Map raw API items to UI items with computed styling and categorization
  const notifications: UINotificationItem[] = useMemo(() => {
    return rawItems.map((item) => {
      const title = item.title?.trim() || t('farmer.notifications.title');
      const message = item.body;
      const category = categorizeNotification(item);
      const section = getSection(item.createdAt);
      const time = formatRelativeTime(item.createdAt);
      const isUnread = item.readAt === null && !readIds.has(item.id);
      const isCounterOffer =
        item.data?.listingId !== undefined ||
        (typeof item.data?.eventName === 'string' &&
          item.data.eventName.toLowerCase().includes('counter_offer')) ||
        `${title} ${message}`.toLowerCase().includes('counter') ||
        `${title} ${message}`.toLowerCase().includes('offer') ||
        `${title} ${message}`.includes('சலுகை') ||
        `${title} ${message}`.includes('மறு விலை');
      const hasAction = isCounterOffer;
      const actionLabel = hasAction ? t('farmer.notifications.reviewOffer') : undefined;
      const { iconType, iconBg, iconColor } = getIconMeta(category, title, message);

      return {
        id: item.id,
        section,
        category,
        title,
        message,
        time,
        hasAction,
        actionLabel,
        isUnread,
        iconBg,
        iconColor,
        iconType,
        data: item.data,
      };
    });
  }, [rawItems, readIds]);

  // Filter items by active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    return notifications.filter((item) => item.category === activeTab);
  }, [activeTab, notifications]);

  // Tab counts
  const reminderCount = useMemo(
    () => notifications.filter((n) => n.category === 'reminders' && n.isUnread).length,
    [notifications],
  );
  const approvalCount = useMemo(
    () => notifications.filter((n) => n.category === 'approvals' && n.isUnread).length,
    [notifications],
  );
  const alertCount = useMemo(
    () => notifications.filter((n) => n.category === 'alerts' && n.isUnread).length,
    [notifications],
  );

  const totalUnread = useMemo(
    () => notifications.filter((n) => n.isUnread).length,
    [notifications],
  );

  const markAllAsRead = async () => {
    const unreadItems = notifications.filter((n) => n.isUnread);
    if (unreadItems.length === 0) return;

    // Optimistically mark all in state
    setReadIds((prev) => {
      const next = new Set(prev);
      unreadItems.forEach((n) => next.add(n.id));
      return next;
    });
    setUnreadCount(0);

    // Call backend API for all unread items
    await Promise.allSettled(unreadItems.map((n) => markNotificationAsRead(n.id)));
  };

  const toggleItemRead = (item: UINotificationItem) => {
    if (item.isUnread) {
      setReadIds((prev) => new Set(prev).add(item.id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      void markNotificationAsRead(item.id).catch((err) => {
        console.warn('Failed to mark notification as read:', err);
      });
    }

    if (item.hasAction && onNavigateToCounterOffer) {
      const listingId = typeof item.data?.listingId === 'string' ? item.data.listingId : undefined;
      onNavigateToCounterOffer(listingId);
    }
  };

  const sections: ('TODAY' | 'YESTERDAY' | 'EARLIER')[] = ['TODAY', 'YESTERDAY', 'EARLIER'];
  const sectionLabel = (section: 'TODAY' | 'YESTERDAY' | 'EARLIER'): string => {
    switch (section) {
      case 'TODAY':
        return t('farmer.notifications.section.today');
      case 'YESTERDAY':
        return t('farmer.notifications.section.yesterday');
      default:
        return t('farmer.notifications.section.earlier');
    }
  };

  const renderIcon = (type: UINotificationItem['iconType'], color: string) => {
    switch (type) {
      case 'cart':
        return <CartIcon color={color} />;
      case 'warning':
        return <AlertTriangleIcon color={color} />;
      case 'check':
        return <CheckmarkIcon color={color} />;
      case 'calendar':
        return <CalendarIcon color={color} />;
      case 'clipboard':
        return <ClipboardCheckIcon color={color} />;
      case 'tutorial':
        return <DeviceTutorialIcon color={color} />;
      default:
        return <CheckmarkIcon color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t('farmer.common.back')}
        >
          <ChevronLeftIcon />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('farmer.notifications.title')}</Text>

        <TouchableOpacity
          onPress={markAllAsRead}
          disabled={totalUnread === 0}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
        >
          <Text style={[styles.markAllReadText, totalUnread === 0 && styles.markAllReadDisabled]}>
            {t('farmer.notifications.markAllRead')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {/* Tab: All */}
          <Pressable style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]} onPress={() => setActiveTab('all')}>
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>{t('farmer.notifications.tab.all')}</Text>
            {activeTab === 'all' && <View style={styles.activeIndicator} />}
          </Pressable>

          {/* Tab: Reminders */}
          <Pressable style={[styles.tabButton, activeTab === 'reminders' && styles.tabButtonActive]} onPress={() => setActiveTab('reminders')}>
            <Text style={[styles.tabText, activeTab === 'reminders' && styles.tabTextActive]}>
              {t('farmer.notifications.tab.reminders')}
            </Text>
            {reminderCount > 0 && (
              <View style={styles.badgeGray}>
                <Text style={styles.badgeGrayText}>{reminderCount}</Text>
              </View>
            )}
            {activeTab === 'reminders' && <View style={styles.activeIndicator} />}
          </Pressable>

          {/* Tab: Approvals */}
          <Pressable style={[styles.tabButton, activeTab === 'approvals' && styles.tabButtonActive]} onPress={() => setActiveTab('approvals')}>
            <Text style={[styles.tabText, activeTab === 'approvals' && styles.tabTextActive]}>
              {t('farmer.notifications.tab.approvals')}
            </Text>
            {approvalCount > 0 && (
              <View style={styles.badgeGray}>
                <Text style={styles.badgeGrayText}>{approvalCount}</Text>
              </View>
            )}
            {activeTab === 'approvals' && <View style={styles.activeIndicator} />}
          </Pressable>

          {/* Tab: Alerts */}
          <Pressable style={[styles.tabButton, activeTab === 'alerts' && styles.tabButtonActive]} onPress={() => setActiveTab('alerts')}>
            <Text style={[styles.tabText, activeTab === 'alerts' && styles.tabTextActive]}>{t('farmer.notifications.tab.alerts')}</Text>
            {alertCount > 0 && (
              <View style={styles.badgeRed}>
                <Text style={styles.badgeRedText}>{alertCount}</Text>
              </View>
            )}
            {activeTab === 'alerts' && <View style={styles.activeIndicator} />}
          </Pressable>

          {/* Tab: Success */}
          <Pressable style={[styles.tabButton, activeTab === 'success' && styles.tabButtonActive]} onPress={() => setActiveTab('success')}>
            <Text style={[styles.tabText, activeTab === 'success' && styles.tabTextActive]}>{t('farmer.notifications.tab.success')}</Text>
            {activeTab === 'success' && <View style={styles.activeIndicator} />}
          </Pressable>
        </ScrollView>
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brandGreen} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Notice</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchNotifications()} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(true)}
              colors={[colors.brandGreen]}
              tintColor={colors.brandGreen}
            />
          }
        >
          {sections.map((sectionName) => {
            const sectionItems = filteredNotifications.filter((n) => n.section === sectionName);
            if (sectionItems.length === 0) return null;

            return (
              <View key={sectionName} style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>{sectionLabel(sectionName)}</Text>
                {sectionItems.map((item) => {
                  const isUnread = item.isUnread;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.85}
                      onPress={() => toggleItemRead(item)}
                      style={[styles.card, isUnread ? styles.cardUnread : styles.cardRead]}
                    >
                      {/* Icon Column */}
                      <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                        {renderIcon(item.iconType, item.iconColor)}
                      </View>

                      {/* Content Column */}
                      <View style={styles.contentColumn}>
                        <View style={styles.titleRow}>
                          <Text style={styles.itemTitle}>{item.title}</Text>
                          {isUnread && <View style={styles.unreadDot} />}
                        </View>

                        <Text style={styles.itemMessage}>{item.message}</Text>

                        {/* Action Link (e.g. Review offer >) */}
                        {item.actionLabel && (
                          <View style={styles.actionRow}>
                            <Text style={styles.actionLabel}>{item.actionLabel}</Text>
                          </View>
                        )}

                        {/* Timestamp */}
                        <Text style={styles.timestampText}>{item.time}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}

          {filteredNotifications.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>{t('farmer.notifications.empty.title')}</Text>
              <Text style={styles.emptySubtitle}>{t('farmer.notifications.empty.subtitle')}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.paleStoneBgAlt,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: P.white,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: P.twGray900,
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGreen700,
  },
  markAllReadDisabled: {
    color: P.twGray400,
  },
  tabsWrapper: {
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.borderGreyLight,
  },
  tabsContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginRight: 8,
    position: 'relative',
  },
  tabButtonActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: P.twGray500,
  },
  tabTextActive: {
    color: P.twGreen600,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: P.twGreen600,
    borderRadius: 2,
  },
  badgeGray: {
    backgroundColor: P.twGray200,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeGrayText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twGray700,
  },
  badgeRed: {
    backgroundColor: P.twRed100,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeRedText: {
    fontSize: 11,
    fontWeight: '700',
    color: P.twRed600,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 14,
    color: P.twGray600,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.brandGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: P.white,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: P.stoneMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardUnread: {
    borderWidth: 1.5,
    borderColor: P.twGreen500,
  },
  cardRead: {
    borderWidth: 1,
    borderColor: P.twGray200,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.twGray900,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: P.twGreen600,
    marginLeft: 8,
  },
  itemMessage: {
    fontSize: 13,
    color: P.twGray600,
    lineHeight: 18,
    marginTop: 3,
  },
  actionRow: {
    marginTop: 5,
    alignSelf: 'flex-start',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: P.coralRed,
  },
  timestampText: {
    fontSize: 12,
    color: P.twGray400,
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray700,
  },
  emptySubtitle: {
    fontSize: 13,
    color: P.twGray400,
    marginTop: 4,
  },
});
