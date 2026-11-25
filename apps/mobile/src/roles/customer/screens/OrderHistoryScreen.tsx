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
}: {
  onNavigate?: ((screen: string, params?: Record<string, unknown>) => void) | undefined;
}) => {
  const { data: orders, isLoading } = useOrders();
  const reorderMutation = useReorder();

  const handleReorder = (orderId: string) => {
    reorderMutation.mutate(orderId, {
      onSuccess: () => {
        onNavigate?.('Cart');
      },
      onError: (error) => {
        console.error('Reorder failed', error);
      }
    });
  };

  if (isLoading) return <ActivityIndicator style={styles.centered} />;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Order History</Text>
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
              <Text style={styles.status}>{item.status}</Text>
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
  container: { flex: 1, padding: 16, backgroundColor: colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: colors.white, padding: 16, borderRadius: 8, marginBottom: 16, shadowColor: neutral('black'), shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderNumber: { fontSize: 18, fontWeight: 'bold' },
  status: { fontSize: 16, color: colors.success },
  text: { fontSize: 16, marginBottom: 4 },
  reorderBtn: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  reorderBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
