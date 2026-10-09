/**
 * Channel Sales — read-only monitoring list of B2B or HORECA orders.
 *
 * Replaces the SubWarehouseB2BSalesScreen / SubWarehouseHorecaSalesScreen
 * twins; the channel difference is the `channel` prop plus fixtures.ts.
 *
 * Ungated on purpose: docs/rbac.json has no per-channel view code (its
 * conflicts[] 'Manage sales channels' records B2B/Horeca MW=view, SW=none), so
 * the matrix cannot be expressed here yet. See SPEC_GAPS.md #5. The screen has
 * no write path, so nothing it renders contradicts rbac.json.
 */
import React, { useState } from 'react';
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

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow } from '../../../theme';
import type { WarehouseScreenBaseProps } from '../finance-expenses';
import { ChannelOrderDetailScreen } from './ChannelOrderDetailScreen';
import { CHANNEL_COPY, CHANNEL_KPIS, CHANNEL_ORDERS } from './fixtures';
import type { ChannelOrderItem, SalesChannel } from './types';

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

function EyeMonitorIcon({ size = 16, color = adminColors.info.text }: { size?: number; color?: string }) {
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
  channel,
  onSelectOrder,
}: ChannelSalesScreenProps): React.JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<ChannelOrderItem | null>(null);

  const copy = CHANNEL_COPY[channel];
  const kpis = CHANNEL_KPIS[channel];

  const filteredOrders = CHANNEL_ORDERS[channel].filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      order.id.toLowerCase().includes(q) ||
      order.businessName.toLowerCase().includes(q) ||
      order.status.toLowerCase().includes(q)
    );
  });

  const handleOrderPress = (order: ChannelOrderItem) => {
    if (onSelectOrder) {
      onSelectOrder(order);
    } else {
      setSelectedOrderDetail(order);
    }
  };

  if (selectedOrderDetail) {
    return (
      <ChannelOrderDetailScreen
        scope={scope}
        can={can}
        onNavigate={onNavigate}
        channel={channel}
        order={selectedOrderDetail}
        onBack={() => setSelectedOrderDetail(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{copy.salesTitle}</Text>
        </View>
      </View>

      {/* ─── Main Content ─── */}
      <View style={styles.mainContainer}>
        {/* ─── Policy Notice Banner ─── */}
        <View style={styles.policyBanner}>
          <EyeMonitorIcon size={18} color={adminColors.info.text} />
          <Text style={styles.policyBannerText}>{copy.monitoringNotice}</Text>
        </View>

        {/* ─── KPI Metrics 4-Box Row ─── */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiNumber}>{kpis.orders}</Text>
            <Text style={styles.kpiLabel}>ORDERS</Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiNumber}>{kpis.pending}</Text>
            <Text style={styles.kpiLabel}>PENDING</Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiNumber}>{kpis.processing}</Text>
            <Text style={styles.kpiLabel}>PROCESSING</Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiNumber}>{kpis.completed}</Text>
            <Text style={styles.kpiLabel}>COMPLETED</Text>
          </View>
        </View>

        {/* ─── Sales Value Card ─── */}
        <View style={styles.salesValueCard}>
          <Text style={styles.salesValueLabel}>Sales Value</Text>
          <Text style={styles.salesValueNumber}>₹{kpis.salesValue.toLocaleString('en-IN')}</Text>
        </View>

        {/* ─── Search Bar ─── */}
        <View style={styles.searchBarWrap}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={copy.searchPlaceholder}
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* ─── Orders List ─── */}
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            // Only a completed order is "done"; every other status is still in flight.
            const tone = item.status === 'Completed' ? adminColors.success : adminColors.warning;
            return (
              <TouchableOpacity
                style={styles.orderCard}
                onPress={() => handleOrderPress(item)}
                activeOpacity={0.82}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.orderIdText}>{item.id}</Text>
                  <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.statusText, { color: tone.text }]}>{item.status}</Text>
                  </View>
                </View>

                <Text style={styles.businessNameText}>{item.businessName}</Text>

                <View style={styles.cardBottomRow}>
                  <View>
                    <Text style={styles.itemCountText}>{item.itemCountText}</Text>
                    <Text style={styles.dateText}>{item.dateText}</Text>
                  </View>
                  <Text style={styles.amountText}>₹{item.amount.toLocaleString('en-IN')}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
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
    borderBottomLeftRadius: adminRadius.xl,
    borderBottomRightRadius: adminRadius.xl,
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
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
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
    letterSpacing: 0.3,
  },
  salesValueCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  salesValueLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  salesValueNumber: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
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
    paddingBottom: adminSpacing.input,
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
  },
  orderIdText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  statusPill: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  statusText: {
    ...adminType.caption,
  },
  businessNameText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  itemCountText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  dateText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  amountText: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
});
