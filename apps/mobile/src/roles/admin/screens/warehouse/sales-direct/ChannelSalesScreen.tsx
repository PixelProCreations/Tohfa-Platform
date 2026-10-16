/**
 * Channel Sales — the HORECA or B2B order list, read-only.
 *
 * Data: GET /admin/sales/horeca | /admin/sales/b2b (BR-85h), cursor-paged,
 * through useChannelOrders. The API takes only cursor / limit, so the search
 * box filters the rows loaded so far, on the device, and the KPI tiles count
 * those loaded rows only; both say so on screen.
 *
 * There is no create-channel-order route (BR-13: 501) and no stock-check
 * route, so this screen places nothing; it only lists and opens orders.
 *
 * Gates (docs/rbac.json): sales.horeca.view / sales.b2b.view. Without the
 * code no request is made and a short note is shown instead.
 */
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { formatAdminDate } from '../../../utils/datetime';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import type { WarehouseScreenBaseProps } from '../finance-expenses';
import { ChannelOrderDetailScreen } from './ChannelOrderDetailScreen';
import { channelStatusGroup, tallyChannelOrders, type ChannelStatusGroup } from './mappers';
import { CHANNEL_GROUP_KEY, CHANNEL_ORDER_STATUS_KEY, PAYMENT_STATUS_KEY } from './salesLabels';
import type { ChannelOrderItem, SalesChannel } from './types';
import { useChannelOrders, useSalesWarehouseOptions } from './useSalesData';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EyeMonitorIcon({ size = 18, color = adminColors.info.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Labels ──────────────────────────────────────────────────────────────────

const TITLE_KEY = {
  HORECA: 'sales.channelSales.title.HORECA',
  B2B: 'sales.channelSales.title.B2B',
} as const;

const NOTICE_KEY = {
  HORECA: 'sales.channelSales.notice.HORECA',
  B2B: 'sales.channelSales.notice.B2B',
} as const;

const EMPTY_KEY = {
  HORECA: 'sales.channelSales.empty.HORECA',
  B2B: 'sales.channelSales.empty.B2B',
} as const;

const KPI_GROUPS: readonly ChannelStatusGroup[] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'];

/** Badge colours per status group; the exact status is the badge text. */
const GROUP_BADGE: Record<ChannelStatusGroup, { bg: string; text: string }> = {
  PENDING: { bg: adminColors.warning.bg, text: adminColors.warning.text },
  IN_PROGRESS: { bg: adminColors.info.bg, text: adminColors.info.text },
  COMPLETED: { bg: adminColors.success.bg, text: adminColors.success.text },
  CLOSED: { bg: adminColors.canvas, text: adminColors.muted },
};

/** The business a row belongs to, or its customer code, or an honest "unknown". */
export function channelBusinessLabel(order: Pick<ChannelOrderItem, 'businessName' | 'customerCode'>): string {
  return order.businessName ?? order.customerCode ?? t('sales.channelSales.unknownBusiness');
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface ChannelSalesScreenProps extends WarehouseScreenBaseProps {
  channel: SalesChannel;
  /** Host navigation to the order detail; renders inline when absent. */
  onSelectOrder?: ((order: ChannelOrderItem) => void) | undefined;
}

export function ChannelSalesScreen({
  scope,
  can,
  onBack,
  onNavigate,
  onTabChange,
  channel,
  onSelectOrder,
}: ChannelSalesScreenProps): React.JSX.Element {
  const canView = can(channel === 'HORECA' ? 'sales.horeca.view' : 'sales.b2b.view');
  const list = useChannelOrders(channel, { enabled: canView });
  const warehouses = useSalesWarehouseOptions(scope, can);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ChannelOrderItem | null>(null);

  const tally = useMemo(() => tallyChannelOrders(list.items), [list.items]);

  // Local filter over the loaded rows only: the list API has no search param.
  const query = searchQuery.trim().toLowerCase();
  const visibleOrders = useMemo(() => {
    if (!query) return list.items;
    return list.items.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(query) ||
        channelBusinessLabel(order).toLowerCase().includes(query) ||
        t(CHANNEL_ORDER_STATUS_KEY[order.status]).toLowerCase().includes(query),
    );
  }, [list.items, query]);

  const handleOrderPress = (order: ChannelOrderItem) => {
    if (onSelectOrder) {
      onSelectOrder(order);
    } else {
      setSelectedOrder(order);
    }
  };

  if (selectedOrder) {
    return (
      <ChannelOrderDetailScreen
        scope={scope}
        can={can}
        onNavigate={onNavigate}
        onTabChange={onTabChange}
        channel={channel}
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
      />
    );
  }

  const viewState = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });
  const now = new Date();

  const header = (
    <View style={styles.headerBanner}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t('sales.channelSales.backA11y')}
        >
          <ArrowBackIcon size={24} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t(TITLE_KEY[channel])}
        </Text>
      </View>
    </View>
  );

  if (!canView) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        {header}
        <View style={styles.mainContainer}>
          <AdminEmptyState title={t('sales.common.noPermission')} />
        </View>
      </SafeAreaView>
    );
  }

  const listHeader = (
    <>
      <View style={styles.policyBanner}>
        <EyeMonitorIcon size={18} color={adminColors.info.text} />
        <Text style={styles.policyBannerText}>{t(NOTICE_KEY[channel])}</Text>
      </View>

      <View style={styles.mainKpiRow}>
        <View style={styles.mainKpiCardHalf}>
          <Text style={styles.mainKpiLabel}>{t('sales.channelSales.loadedOrders')}</Text>
          <Text style={styles.mainKpiValue}>{tally.orders}</Text>
        </View>
        <View style={styles.mainKpiCardHalf}>
          <Text style={styles.mainKpiLabel}>{t('sales.channelSales.loadedValue')}</Text>
          <Text style={styles.mainKpiValue}>{formatPaise(tally.valuePaise)}</Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        {KPI_GROUPS.map((group) => (
          <View key={group} style={styles.kpiBox}>
            <Text style={styles.kpiNumber}>{tally.byGroup[group]}</Text>
            <Text style={styles.kpiLabel} numberOfLines={2}>
              {t(CHANNEL_GROUP_KEY[group])}
            </Text>
          </View>
        ))}
      </View>
      <Text style={styles.loadedNote}>{t('sales.channelSales.loadedNote', { count: tally.orders })}</Text>

      <View style={styles.searchBarWrap}>
        <SearchIcon size={18} color={adminColors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('sales.channelSales.searchPlaceholder')}
          placeholderTextColor={adminColors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          accessibilityLabel={t('sales.channelSales.searchA11y')}
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      {header}

      <View style={styles.mainContainer}>
        {viewState === 'loading' ? (
          <AdminLoadingState />
        ) : viewState === 'error' ? (
          <AdminErrorState error={list.error} onRetry={list.refresh} />
        ) : (
          <FlatList
            data={visibleOrders}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshing={list.isRefreshing}
            onRefresh={list.refresh}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              viewState === 'empty' ? (
                <AdminEmptyState title={t(EMPTY_KEY[channel])} />
              ) : (
                <AdminEmptyState
                  title={t('sales.channelSales.emptySearch', { query: searchQuery.trim() })}
                  subtitle={list.hasMore ? t('sales.channelSales.emptySearchHint') : undefined}
                />
              )
            }
            renderItem={({ item }) => {
              const badge = GROUP_BADGE[channelStatusGroup(item.status)];
              const warehouseName = warehouses.nameOf(item.warehouseId);
              const meta = [t('sales.common.itemCount', { count: item.itemCount }), warehouseName]
                .filter((part): part is string => Boolean(part))
                .join(' · ');
              return (
                <TouchableOpacity
                  style={styles.orderCard}
                  onPress={() => handleOrderPress(item)}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityLabel={t('sales.channelSales.openOrderA11y', { orderNumber: item.orderNumber })}
                >
                  <View style={styles.cardTopRow}>
                    <Text style={styles.orderIdText}>{item.orderNumber}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                        {t(CHANNEL_ORDER_STATUS_KEY[item.status])}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.businessNameText}>{channelBusinessLabel(item)}</Text>
                  <View style={styles.cardDivider} />

                  <View style={styles.cardBottomRow}>
                    <Text style={styles.itemCountText}>{meta}</Text>
                    <Text style={styles.amountText}>{formatPaise(item.totalPaise)}</Text>
                  </View>
                  <View style={styles.cardBottomRow}>
                    <Text style={styles.dateText}>{formatAdminDate(item.placedAt, now)}</Text>
                    <Text style={styles.dateText}>{t(PAYMENT_STATUS_KEY[item.paymentStatus])}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={
              list.hasMore ? (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={list.loadMore}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={styles.loadMoreText}>{t('sales.common.loadMore')}</Text>
                </TouchableOpacity>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    flex: 1,
    marginLeft: adminSpacing.sm,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
  },
  policyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.info.bg,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  policyBannerText: {
    ...adminType.rowMeta,
    flex: 1,
    color: adminColors.info.text,
  },
  mainKpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  mainKpiCardHalf: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    ...adminShadow.sm,
  },
  mainKpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  mainKpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiNumber: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    marginBottom: 2,
  },
  kpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    textAlign: 'center',
  },
  loadedNote: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    marginBottom: adminSpacing.md,
  },
  searchInput: {
    ...adminType.body,
    flex: 1,
    marginLeft: adminSpacing.sm,
    color: adminColors.ink,
    padding: 0,
  },
  listContent: {
    paddingBottom: 24,
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
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    borderRadius: adminRadius.sm,
    marginLeft: adminSpacing.sm,
  },
  statusBadgeText: {
    ...adminType.caption,
  },
  businessNameText: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 10,
  },
  cardDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginBottom: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCountText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    flexShrink: 1,
  },
  dateText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: adminSpacing.xs,
  },
  amountText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginLeft: adminSpacing.sm,
  },
  loadMoreBtn: {
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
  },
  loadMoreText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
});
