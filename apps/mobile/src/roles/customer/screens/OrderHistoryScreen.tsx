import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { EmptyState } from '@tohfa/mobile-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerRadius,
  customerShadow,
  customerSpacing,
} from '../theme';
import { isActiveStatus, useOrders, type OrderSummary } from '../api/orders';
import { mapProblem } from '../api/problem';
import { formatRupees } from '../utils/money';
import { t } from '../../../i18n/customer';
import { activeOrderBadge, formatIstDate, orderStatusLabel } from '../utils/orderFormat';

export interface OrderHistoryScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onBack?: () => void;
}

const BackArrowSvg = ({ color = customerColors.heading, size = 18 }: { color?: string; size?: number }) => (
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

const SearchSvg = ({ color = customerColors.neutral.neutral500, size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={8} stroke={color} strokeWidth={1.8} />
    <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const ChevronRightSvg = ({ color = customerColors.neutral.neutral500, size = 15 }: { color?: string; size?: number }) => (
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

/**
 * Screen 69 · My Orders / Recent Orders
 * Pixel-perfect implementation from Figma.
 */
export const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({
  onNavigate,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);

  // GET /orders (cursor paged, newest first). Rows are per ORDER (BR-195 thumbnails).
  const ordersQuery = useOrders();
  const orders: OrderSummary[] = useMemo(() => ordersQuery.data?.pages.flatMap((p) => p.items) ?? [], [ordersQuery.data]);
  const q = searchQuery.trim().toLowerCase();
  const matches = (o: OrderSummary) =>
    q.length === 0 ||
    o.orderNumber.toLowerCase().includes(q) ||
    (o.thumbnails ?? []).some((th) => th.productName.toLowerCase().includes(q));
  const filtered = orders.filter(matches);
  const upcoming = filtered.filter((o) => isActiveStatus(o.status));
  const past = filtered.filter((o) => !isActiveStatus(o.status));

  /** Consecutive orders on the same IST day share one date header. */
  const groupByDay = (list: OrderSummary[]) => {
    const groups: { day: string; items: OrderSummary[] }[] = [];
    for (const o of list) {
      const day = formatIstDate(o.placedAt);
      const last = groups[groups.length - 1];
      if (last && last.day === day) last.items.push(o);
      else groups.push({ day, items: [o] });
    }
    return groups;
  };

  const rowTitle = (o: OrderSummary) => {
    const first = o.thumbnails?.[0]?.productName;
    const extra = (o.itemCount ?? 0) - 1;
    if (!first) {
      const n = o.itemCount ?? 0;
      return t(n === 1 ? 'customer.orders.history.itemOne' : 'customer.orders.history.itemMany', { count: n });
    }
    return extra > 0 ? t('customer.orders.history.plusMore', { first, extra }) : first;
  };

  const renderRow = (item: OrderSummary, active: boolean) => {
    const thumb = item.thumbnails?.[0]?.imageUrl;
    return (
      <TouchableOpacity
        key={item.id}
        testID={`order-row-${item.id}`}
        activeOpacity={0.7}
        onPress={() => onNavigate?.('OrderTracking', { orderId: item.id })}
        style={styles.orderRow}
        accessibilityLabel={item.orderNumber}
      >
        {thumb ? <Image source={{ uri: thumb }} style={styles.productThumb} resizeMode="contain" /> : <View style={styles.productThumb} />}
        <View style={styles.orderInfoCol}>
          <Text style={styles.productName} numberOfLines={1}>{rowTitle(item)}</Text>
          <Text style={styles.orderNumber}>{item.orderNumber} · {formatRupees(item.totalAmount)}</Text>
        </View>
        {active ? (
          <View style={styles.orderRightCol}>
            {!!item.deliveryDate && <Text style={styles.deliveryDate}>{formatIstDate(item.deliveryDate)}</Text>}
            <View style={styles.arrivePill}>
              <Text style={styles.arrivePillText}>{activeOrderBadge(item)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.viewDetailsRow}>
            <Text style={styles.viewDetailsText}>{item.status === 'CANCELLED' || item.status === 'RETURNED' ? orderStatusLabel(item.status) : t('customer.orders.history.viewDetails')}</Text>
            <ChevronRightSvg color={customerColors.body} size={13} />
          </View>
        )}
        {active && <ChevronRightSvg color={customerColors.neutral.neutral500} size={15} />}
      </TouchableOpacity>
    );
  };

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
            accessibilityLabel={t('customer.orders.history.back')}
          >
            <BackArrowSvg color={customerColors.heading} size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('customer.orders.history.title')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={ordersQuery.isRefetching} onRefresh={() => void ordersQuery.refetch()} />}
      >
        {/* ── SEARCH BAR ──────────────────────────────────────────────────────── */}
        <View style={[styles.searchBox, customerShadow.subtle]}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('customer.orders.history.search')}
            placeholderTextColor={customerColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <SearchSvg color={customerColors.muted} size={18} />
        </View>

        {ordersQuery.isLoading ? (
          <ActivityIndicator testID="orders-loading" style={{ marginTop: 32 }} />
        ) : ordersQuery.isError ? (
          <View style={styles.ordersList} testID="orders-error">
            <Text style={styles.productName}>{mapProblem(ordersQuery.error).message}</Text>
            <TouchableOpacity onPress={() => void ordersQuery.refetch()}>
              <Text style={styles.viewDetailsText}>{t('customer.orders.history.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : orders.length === 0 ? (
          <EmptyState
            iconName="shopping_cart"
            title={t('customer.orders.history.emptyTitle')}
            action={{ label: t('customer.orders.history.startShopping'), onPress: () => onNavigate?.('Home') }}
            testID="orders-empty"
          />
        ) : (
          <>
            {upcoming.length > 0 && <Text style={styles.sectionTitle}>{t('customer.orders.history.recent')}</Text>}
            {groupByDay(upcoming).map((g) => (
              <React.Fragment key={`u-${g.day}`}>
                <Text style={styles.dateHeader}>{g.day}</Text>
                <View style={styles.ordersList}>{g.items.map((o) => renderRow(o, true))}</View>
              </React.Fragment>
            ))}
            {past.length > 0 && <Text style={[styles.sectionTitle, { marginTop: customerSpacing.lg }]}>{t('customer.orders.history.past')}</Text>}
            {groupByDay(past).map((g) => (
              <React.Fragment key={`p-${g.day}`}>
                <Text style={styles.dateHeader}>{g.day}</Text>
                <View style={styles.ordersList}>{g.items.map((o) => renderRow(o, false))}</View>
              </React.Fragment>
            ))}
            {ordersQuery.hasNextPage && (
              <TouchableOpacity onPress={() => void ordersQuery.fetchNextPage()} testID="orders-more">
                <Text style={styles.viewDetailsText}>{ordersQuery.isFetchingNextPage ? t('customer.orders.history.loading') : t('customer.orders.history.loadMore')}</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: customerColors.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: customerSpacing.base,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 16,
    paddingBottom: 12,
    backgroundColor: customerColors.white,
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
    borderColor: customerColors.heading,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    color: customerColors.heading,
    fontFamily: customerFonts.editorial,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: customerSpacing.base,
    paddingTop: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: customerColors.white,
    borderRadius: customerRadius.pill,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    paddingHorizontal: 16,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: customerColors.body,
    fontFamily: customerFonts.regular,
    paddingVertical: 0,
  },
  sectionTitle: {
    fontSize: 18,
    color: customerColors.heading,
    fontFamily: customerFonts.editorial,
    marginTop: 20,
    marginBottom: 12,
  },
  dateHeader: {
    fontSize: 12,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
    marginBottom: 10,
  },
  ordersList: {
    gap: 14,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  productThumb: {
    width: 36,
    height: 36,
  },
  orderInfoCol: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: customerColors.body,
    fontFamily: customerFonts.semibold,
  },
  orderNumber: {
    fontSize: 10,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
    marginTop: 2,
  },
  orderRightCol: {
    alignItems: 'flex-end',
    gap: 3,
  },
  deliveryDate: {
    fontSize: 10,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
  },
  arrivePill: {
    backgroundColor: customerColors.legacy.greenWash,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: customerRadius.pill,
  },
  arrivePillText: {
    fontSize: 10,
    color: customerColors.brand,
    fontFamily: customerFonts.regular,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 11,
    color: customerColors.body,
    fontFamily: customerFonts.regular,
  },
});
