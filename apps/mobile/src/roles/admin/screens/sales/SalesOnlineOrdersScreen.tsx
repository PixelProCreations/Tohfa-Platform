import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { BackChevronIcon, SALES_PALETTE } from './SalesChannelOverviewScreen';
import { useAdminQuery } from '../../api/hooks';
import { listAdminOrders, type OrderSummaryDto } from '../../api/orders';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

// ─── Order Box Icon ──────────────────────────────────────────────────────────
function PackageBoxIcon({ color = adminColors.brand, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface OnlineOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  pickupLocation: string;
  status: 'Confirmed' | 'Packed' | 'Ready for Pickup' | 'Delivered';
  amount: number;
  itemsCount?: number;
  time?: string;
}

export interface SalesOnlineOrdersScreenProps {
  onBack?: () => void;
  onSelectOrder?: (order: OnlineOrderItem) => void;
  onOpenInvoice?: (order: OnlineOrderItem) => void;
  orders?: OnlineOrderItem[];
}

type FilterTab = 'All' | 'Confirmed' | 'Packed' | 'Ready for Pickup' | 'Delivered';

function toOnlineStatus(status: string): OnlineOrderItem['status'] {
  switch (status) {
    case 'PACKED':
      return 'Packed';
    case 'READY_FOR_PICKUP':
      return 'Ready for Pickup';
    case 'DELIVERED':
    case 'PICKED_UP':
      return 'Delivered';
    case 'CONFIRMED':
    default:
      return 'Confirmed';
  }
}

export function SalesOnlineOrdersScreen({
  onBack,
  onSelectOrder,
  onOpenInvoice,
  orders,
}: SalesOnlineOrdersScreenProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  const query = useAdminQuery(
    ['admin', 'orders', 'online-list'],
    (signal) => listAdminOrders({ channel: 'ONLINE', limit: 50 }, signal),
    { enabled: !orders }
  );

  const displayOrders: OnlineOrderItem[] = orders ?? (query.data?.items ?? []).map((item: OrderSummaryDto) => ({
    id: item.id,
    orderNumber: item.orderNumber,
    customerName: item.customerName ?? ADMIN_NO_VALUE,
    pickupLocation:
      item.fulfillmentType === 'WAREHOUSE_PICKUP'
        ? t('wiringSales.online.warehousePickup')
        : t('wiringSales.online.homeDelivery'),
    status: toOnlineStatus(item.status),
    amount: Number(item.totalAmount) || 0,
    itemsCount: item.itemCount ?? 0,
    time: item.deliveryDate ?? ADMIN_NO_VALUE,
  }));

  const filterTabs: FilterTab[] = ['All', 'Confirmed', 'Packed', 'Ready for Pickup', 'Delivered'];

  const filteredOrders = displayOrders.filter((ord) => {
    if (activeTab === 'All') return true;
    return ord.status === activeTab;
  });

  const getStatusBadgeStyle = (status: OnlineOrderItem['status']) => {
    switch (status) {
      case 'Confirmed':
        return { bg: adminColors.info.bg, text: adminColors.info.text };
      case 'Packed':
        return { bg: adminColors.warning.bg, text: adminColors.warning.text };
      case 'Ready for Pickup':
        return { bg: adminColors.success.bg, text: adminColors.success.text };
      case 'Delivered':
        return { bg: adminColors.card, text: adminColors.muted };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackChevronIcon color={adminColors.ink} />
          </TouchableOpacity>
        </View>

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>Online Orders</Text>
          <Text style={styles.screenSubtitle}>
            {t('wiringSales.online.subtitle', { shown: displayOrders.length })}
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabsContainer}>
          <FlatList
            horizontal
            data={filterTabs}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsList}
            renderItem={({ item }) => {
              const isActive = activeTab === item;
              return (
                <TouchableOpacity
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => setActiveTab(item)}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isActive && styles.filterPillTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Orders List */}
        {query.isPending && displayOrders.length === 0 ? (
          <AdminLoadingState label="Loading online orders..." />
        ) : query.error && displayOrders.length === 0 ? (
          <AdminErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : filteredOrders.length === 0 ? (
          <AdminEmptyState title="No Online Orders" subtitle="No orders found for the selected filter." />
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.ordersList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const badge = getStatusBadgeStyle(item.status);
              return (
                <TouchableOpacity
                  style={styles.orderCard}
                  onPress={() => {
                    if (item.status === 'Ready for Pickup') {
                      onOpenInvoice?.(item);
                    } else {
                      onSelectOrder?.(item);
                    }
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <View style={styles.orderCardLeft}>
                    <View style={styles.packageIconBox}>
                      <PackageBoxIcon color={adminColors.brand} size={20} />
                    </View>
                    <View style={styles.orderInfo}>
                      <View style={styles.orderNumberRow}>
                        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                      </View>
                      <Text style={styles.orderCustomer}>
                        {item.customerName} · {item.pickupLocation}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: badge.bg },
                        ]}
                      >
                        <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.orderCardRight}>
                    <Text style={styles.orderAmount}>₹{item.amount.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  titleBlock: {
    marginBottom: adminSpacing.md,
  },
  screenTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontWeight: '700',
    marginBottom: 4,
  },
  screenSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 18,
  },
  filterTabsContainer: {
    marginBottom: adminSpacing.md,
  },
  filterTabsList: {
    gap: adminSpacing.xs,
  },
  filterPill: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterPillActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterPillText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.muted,
  },
  filterPillTextActive: {
    color: adminColors.onBrand,
  },
  ordersList: {
    paddingBottom: adminSpacing.xxl * 2,
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  orderCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  packageIconBox: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  orderNumber: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  orderCustomer: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: adminSpacing.xs,
    paddingVertical: 2,
    borderRadius: adminRadius.xs,
  },
  statusBadgeText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  orderCardRight: {
    alignItems: 'flex-end',
    marginLeft: adminSpacing.sm,
  },
  orderAmount: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
});
