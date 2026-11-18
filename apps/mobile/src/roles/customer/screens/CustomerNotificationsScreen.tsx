/**
 * Notifications centre (Figma 46:43983), backed by GET /notifications.
 * Today / Yesterday / Earlier are IST calendar days of `createdAt`; the red dot
 * is `readAt === null`; tapping marks the row read (optimistic) and deep-links
 * via notificationTarget(data). See ../api/notifications.ts.
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerSpacing,
} from '../theme';
import {
  formatNotificationTime,
  groupByIstDay,
  notificationKind,
  notificationTarget,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  type NotificationItem,
  type NotificationKind,
  type NotificationSectionKey,
} from '../api/notifications';
import { mapProblem } from '../api/problem';
import { t } from '../../../i18n/customer';

export interface CustomerNotificationsScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
  /** Injectable clock for tests. */
  now?: () => Date;
}

const BackArrowSvg = ({ color = '#1A2E1A', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronRightSvg = ({ color = '#9CA3AF', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PackageSvg = ({ color = '#2E7D32', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16.5 9.4L7.55 4.24M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3.29 7L12 12.01L20.71 7M12 22.08V12"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WalletSvg = ({ color = '#2E7D32', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
      stroke={color}
      strokeWidth={1.8}
    />
    <Path
      d="M16 3H4a2 2 0 00-2 2v2h18V5a2 2 0 00-2-2z"
      stroke={color}
      strokeWidth={1.8}
    />
    <Circle cx={16} cy={14} r={1.5} fill={color} />
  </Svg>
);

const TruckSvg = ({ color = '#9333EA', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={1} y={3} width={15} height={13} rx={1} stroke={color} strokeWidth={1.8} />
    <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx={5.5} cy={18.5} r={2.5} stroke={color} strokeWidth={1.8} />
    <Circle cx={18.5} cy={18.5} r={2.5} stroke={color} strokeWidth={1.8} />
  </Svg>
);

const LeafSvg = ({ color = '#2E7D32', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M2 21c0-3 1.85-5.36 5.08-6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const ReturnSvg = ({ color = '#DC2626', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 14L4 9l5-5"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20 20v-7a4 4 0 00-4-4H4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SupportSvg = ({ color = '#D97706', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface KindVisual {
  bg: string;
  color: string;
  Icon: React.FC<{ color?: string; size?: number }>;
}

const KIND_VISUALS: Record<NotificationKind, KindVisual> = {
  order: { bg: '#EDF8EE', color: '#2E7D32', Icon: PackageSvg },
  order_dispatched: { bg: '#F3E8FF', color: '#9333EA', Icon: TruckSvg },
  wallet: { bg: '#EDF8EE', color: '#2E7D32', Icon: WalletSvg },
  wallet_credit: { bg: '#EDF8EE', color: '#2E7D32', Icon: WalletSvg },
  wallet_debit: { bg: '#FEF3C7', color: '#D97706', Icon: WalletSvg },
  support: { bg: '#FEF3C7', color: '#D97706', Icon: SupportSvg },
  return: { bg: '#FEE2E2', color: '#DC2626', Icon: ReturnSvg },
  general: { bg: '#EDF8EE', color: '#2E7D32', Icon: LeafSvg },
};

const SECTION_LABEL_KEYS = {
  today: 'customer.notifications.today',
  yesterday: 'customer.notifications.yesterday',
  earlier: 'customer.notifications.earlier',
} as const satisfies Record<NotificationSectionKey, string>;

const LOAD_MORE_THRESHOLD_PX = 240;

const NotificationRow = ({
  item,
  now,
  onPress,
}: {
  item: NotificationItem;
  now: Date;
  onPress: (item: NotificationItem) => void;
}) => {
  const visual = KIND_VISUALS[notificationKind(item.data)];
  const unread = item.readAt === null;
  const title = item.title ?? item.body;
  const showBody = item.title !== null && item.title !== '';
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.notificationRow}
      onPress={() => onPress(item)}
      testID={`notification-row-${item.id}`}
      accessibilityRole="button"
      accessibilityLabel={unread ? `${title}, ${t('customer.notifications.unread')}` : title}
    >
      <View style={[styles.iconBox, { backgroundColor: visual.bg }]}>
        <visual.Icon size={18} color={visual.color} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.notifTitle} numberOfLines={1}>
          {title}
        </Text>
        {showBody && (
          <Text style={styles.notifDesc} numberOfLines={2}>
            {item.body}
          </Text>
        )}
      </View>
      <View style={styles.rightCol}>
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatNotificationTime(item.createdAt, now)}</Text>
          {unread && <View style={styles.unreadDot} testID={`notification-unread-${item.id}`} />}
        </View>
        <ChevronRightSvg color="#9CA3AF" size={15} />
      </View>
    </TouchableOpacity>
  );
};

const SkeletonRows = () => (
  <View testID="notifications-skeleton">
    <View style={[styles.skeletonBar, { width: 70, marginBottom: 14 }]} />
    {[0, 1, 2, 3, 4].map((i) => (
      <View key={i} style={styles.notificationRow}>
        <View style={[styles.iconBox, styles.skeletonBlock]} />
        <View style={styles.textCol}>
          <View style={[styles.skeletonBar, { width: '55%' }]} />
          <View style={[styles.skeletonBar, { width: '85%', marginTop: 6 }]} />
        </View>
      </View>
    ))}
  </View>
);

export const CustomerNotificationsScreen: React.FC<CustomerNotificationsScreenProps> = ({
  onNavigate,
  onBack,
  now: nowProp,
}) => {
  const insets = useSafeAreaInsets();
  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);

  const query = useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const [refreshing, setRefreshing] = useState(false);

  const { items, unreadCount, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = query;
  const now = nowProp ? nowProp() : new Date();
  const sections = groupByIstDay(items, now);
  const hasUnread = unreadCount > 0 || items.some((n) => n.readAt === null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      if (layoutMeasurement.height + contentOffset.y >= contentSize.height - LOAD_MORE_THRESHOLD_PX) loadMore();
    },
    [loadMore],
  );

  const onRowPress = useCallback(
    (item: NotificationItem) => {
      if (item.readAt === null) markRead.mutate(item.id);
      const target = notificationTarget(item.data);
      if (target) onNavigate?.(target.screen, target.params);
    },
    [markRead, onNavigate],
  );

  const showSkeleton = query.isPending;
  const showError = query.isError && items.length === 0;
  const showEmpty = query.isSuccess && items.length === 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={[styles.headerRow, { paddingTop: headerTopPadding }]}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack || (() => onNavigate?.('CustomerAccount'))}
            style={styles.circleIconButton}
            accessibilityLabel={t('customer.notifications.back')}
          >
            <BackArrowSvg color={customerColors.heading} size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('customer.notifications.title')}</Text>
        </View>
        {hasUnread && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => markAll.mutate()}
            disabled={markAll.isPending}
            testID="notifications-mark-all"
            accessibilityRole="button"
          >
            <Text style={styles.markAllText}>{t('customer.notifications.markAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={200}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[customerColors.primary]} />
        }
      >
        {showSkeleton && <SkeletonRows />}

        {showError && (
          <View style={styles.stateBox} testID="notifications-error">
            <Text style={styles.stateTitle}>{t('customer.notifications.errorTitle')}</Text>
            <Text style={styles.stateBody}>{mapProblem(query.error).message}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.retryButton}
              onPress={() => void refetch()}
              testID="notifications-retry"
              accessibilityRole="button"
            >
              <Text style={styles.retryText}>{t('customer.notifications.retry')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {showEmpty && (
          <View style={styles.stateBox} testID="notifications-empty">
            <View style={[styles.iconBox, { backgroundColor: '#EDF8EE', marginBottom: 12 }]}>
              <LeafSvg size={18} color="#2E7D32" />
            </View>
            <Text style={styles.stateTitle}>{t('customer.notifications.emptyTitle')}</Text>
            <Text style={styles.stateBody}>{t('customer.notifications.emptyBody')}</Text>
          </View>
        )}

        {sections.map((section, sectionIndex) => (
          <View key={section.key} testID={`notifications-section-${section.key}`}>
            <Text style={[styles.sectionHeader, sectionIndex > 0 && { marginTop: 22 }]}>
              {t(SECTION_LABEL_KEYS[section.key])}
            </Text>
            <View style={styles.groupContainer}>
              {section.items.map((item, i) => (
                <React.Fragment key={item.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <NotificationRow item={item} now={now} onPress={onRowPress} />
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {isFetchingNextPage && (
          <ActivityIndicator style={styles.footerSpinner} color={customerColors.primary} testID="notifications-loading-more" />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: customerSpacing.base,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1A2E1A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    color: '#1A2E1A',
    fontFamily: customerFonts.editorial,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: customerSpacing.base,
    paddingTop: 8,
  },
  sectionHeader: {
    fontSize: 16,
    color: customerColors.heading,
    fontFamily: customerFonts.editorial,
    marginBottom: 10,
  },
  groupContainer: {
    gap: 4,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: customerColors.body,
    fontFamily: customerFonts.semibold,
  },
  notifDesc: {
    fontSize: 10,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
    marginTop: 2,
    lineHeight: 14,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F0F0',
    marginLeft: 50,
  },
  markAllText: {
    fontSize: 12,
    color: customerColors.primary,
    fontFamily: customerFonts.semibold,
    fontWeight: '600',
  },
  stateBox: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  stateTitle: {
    fontSize: 16,
    color: customerColors.heading,
    fontFamily: customerFonts.editorial,
    textAlign: 'center',
  },
  stateBody: {
    fontSize: 12,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: customerColors.primary,
  },
  retryText: {
    fontSize: 13,
    color: customerColors.primary,
    fontFamily: customerFonts.semibold,
  },
  skeletonBlock: {
    backgroundColor: '#F0F0F0',
  },
  skeletonBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F0F0F0',
  },
  footerSpinner: {
    marginTop: 16,
  },
});
