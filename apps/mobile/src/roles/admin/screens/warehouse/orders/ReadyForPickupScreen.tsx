/**
 * Ready for Pickup — packed orders waiting at the counter for the customer.
 *
 * Design id: M5S09 (M5S09_ReadyForPickup).
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - Opening a card into pickup verification, and the bottom action that also
 *     starts verification: `order.pickup_otp.verify`. Without it the cards are
 *     plain, non-pressable rows and the bottom action is not rendered.
 * Both now open the pickup wizard (route 'M5S11') on its 'verify' step; the
 * old M5S10 route was folded into it.
 *
 * Live data (API integration plan, phase 5): the rows are GET /admin/orders
 * with status READY_FOR_PICKUP, page by page. The list carries no customer
 * name (BR-101), so a card shows the order number, items, total and when it
 * was placed; the name is on the verify step, from the detail. The bottom
 * action opened verification with no order, so it is gone: every pickup starts
 * from its order's card.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { t } from '../../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import type { OrderListRow, OrderScreenBaseProps, OrdersLiveStateProps } from './types';

export interface ReadyForPickupScreenProps extends OrderScreenBaseProps, OrdersLiveStateProps {
  /** Orders READY_FOR_PICKUP, page by page. */
  orders?: readonly OrderListRow[] | undefined;
  onLoadMore?: (() => void) | undefined;
  hasMore?: boolean | undefined;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z"
        stroke={adminColors.muted}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function OrderCardBody({ order }: { order: OrderListRow }) {
  return (
    <>
      <View style={styles.cardTopRow}>
        <Text style={styles.orderIdText}>{order.orderNumber}</Text>
        <View style={styles.timeBadge}>
          <Text style={styles.timeBadgeText}>{order.placedAgo}</Text>
        </View>
      </View>

      <View style={styles.itemsPriceRow}>
        <Text style={styles.itemsText}>{order.itemsLabel}</Text>
        <Text style={styles.amountText}>{order.amountLabel}</Text>
      </View>

      <View style={styles.packedReadyRow}>
        <Text style={styles.packedTimeText}>{t('orders.ready.placedAt', { at: order.placedLabel })}</Text>
        <View style={styles.readyBadge}>
          <Text style={styles.readyBadgeText}>Ready</Text>
        </View>
      </View>
    </>
  );
}

export function ReadyForPickupScreen({
  can,
  onBack,
  onNavigate,
  orders = [],
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onLoadMore,
  hasMore = false,
}: ReadyForPickupScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const canVerify = can('order.pickup_otp.verify');
  const query = searchQuery.trim().toLowerCase();
  const filteredOrders = query === '' ? orders : orders.filter((order) => order.orderNumber.toLowerCase().includes(query));
  const view = queryViewState({ isLoading, error, itemCount: orders.length });

  const renderOrder = ({ item: order }: { item: OrderListRow }) =>
    canVerify ? (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.75}
        onPress={() => onNavigate?.('M5S11', { orderId: order.id, step: 'verify' })}
      >
        <OrderCardBody order={order} />
      </TouchableOpacity>
    ) : (
      <View style={styles.orderCard}>
        <OrderCardBody order={order} />
      </View>
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ready for Pickup</Text>
        </View>

        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>
            {view === 'ready' || view === 'empty'
              ? t(hasMore ? 'orders.list.countMore' : 'orders.list.count', { count: orders.length })
              : t('orders.noValue')}
          </Text>
        </View>

        {view === 'loading' ? (
          <AdminLoadingState />
        ) : view === 'error' ? (
          <AdminErrorState error={error} onRetry={onRetry} />
        ) : (
          <FlatList
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            data={filteredOrders}
            keyExtractor={(order) => order.id}
            renderItem={renderOrder}
            ListHeaderComponent={
              <View style={styles.searchBox}>
                <SearchIcon />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t('orders.list.searchPlaceholder')}
                  placeholderTextColor={adminColors.placeholder}
                />
              </View>
            }
            showsVerticalScrollIndicator={false}
            onEndReached={hasMore ? onLoadMore : undefined}
            onEndReachedThreshold={0.5}
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />
              ) : undefined
            }
            ListEmptyComponent={<AdminEmptyState title={t(query === '' ? 'orders.empty.ready' : 'orders.empty.search')} />}
            ListFooterComponent={hasMore ? <ActivityIndicator color={adminColors.brand} /> : <View style={styles.bottomSpacer} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const BACK_BUTTON_SIZE = 32;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 14,
    paddingBottom: adminSpacing.md,
    gap: adminSpacing.md,
  },
  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  subtitleRow: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: adminColors.brand,
  },
  subtitleText: {
    ...adminType.rowTitle,
    // Was a translucent overlay; no translucent token, so solid onBrand.
    color: adminColors.onBrand,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 14,
    paddingBottom: 20,
  },
  searchBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: ADMIN_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: adminSpacing.lg,
    gap: 10,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    height: '100%',
  },
  orderCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  orderIdText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  timeBadge: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 10,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
  },
  timeBadgeText: {
    ...adminType.caption,
    color: adminColors.warning.text,
  },
  itemsPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemsText: {
    ...adminType.body,
    fontWeight: '500',
    color: adminColors.muted,
  },
  amountText: {
    ...adminType.title,
    color: adminColors.ink,
  },
  packedReadyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packedTimeText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  readyBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  readyBadgeText: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
  },
  bottomSpacer: {
    height: 20,
  },
});
