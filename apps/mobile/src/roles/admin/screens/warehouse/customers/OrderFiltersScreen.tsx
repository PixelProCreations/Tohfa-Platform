import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  DEFAULT_ORDER_FILTERS,
  DEFAULT_PURCHASE_FILTERS,
  type OrderFiltersVariant,
  type OrderFilterState,
  type PurchaseFilterState,
  type WarehouseScope,
  type WarehouseScreenBaseProps,
} from './types';

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
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

function FlagIcon({ size = 17, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v19"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TruckIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="4" width="14" height="12" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M15 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function StoreIcon({ size = 17, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l1-6h16l1 6M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 17, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PaymentIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M2 10h20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="14" r="2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}



function FunnelIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface OrderFiltersBaseProps extends WarehouseScreenBaseProps {
  customerName?: string | undefined;
  warehouseOptions?: readonly WarehouseScope[] | undefined;
}

export type OrderFiltersScreenProps = OrderFiltersBaseProps &
  (
    | {
        config: 'order';
        variant?: OrderFiltersVariant | undefined;
        initialFilters?: OrderFilterState | undefined;
        onApplyFilters: (filters: OrderFilterState) => void;
      }
    | {
        config: 'purchase';
        initialFilters?: PurchaseFilterState | undefined;
        onApplyFilters: (filters: PurchaseFilterState) => void;
      }
  );

const STATUS_OPTIONS = ['All', 'Confirmed', 'Packed', 'Ready for Pickup', 'Picked Up', 'Completed'] as const;
const FULFILLMENT_OPTIONS = ['Pickup', 'Delivery'] as const;
const CHANNEL_OPTIONS = ['Online', 'Live Market', 'HORECA', 'B2B'] as const;
const DATE_OPTIONS = ['Today', 'Yesterday', 'Last 7 Days', 'Custom'] as const;
const PAYMENT_OPTIONS = ['All', 'Paid', 'Pending', 'Failed'] as const;

export function OrderFiltersScreen(props: OrderFiltersScreenProps) {
  const { onBack } = props;

  const [searchQuery, setSearchQuery] = useState(props.initialFilters?.searchQuery ?? '');
  const [orderStatus, setOrderStatus] = useState<string>(
    props.config === 'order' ? props.initialFilters?.orderStatus ?? 'All' : 'All'
  );
  const [orderType, setOrderType] = useState<string>(
    props.config === 'order'
      ? props.initialFilters?.orderType === 'Delivery'
        ? 'Delivery'
        : 'Pickup'
      : 'Pickup'
  );
  const [channel, setChannel] = useState<string>(
    props.config === 'order' ? props.initialFilters?.channel ?? 'Online' : 'Online'
  );
  const [datePreset, setDatePreset] = useState<string>(
    props.initialFilters?.datePreset === 'Yesterday' ||
      props.initialFilters?.datePreset === 'Last 7 Days' ||
      props.initialFilters?.datePreset === 'Custom'
      ? props.initialFilters.datePreset
      : 'Today'
  );
  const [paymentStatus, setPaymentStatus] = useState<string>(
    props.config === 'order' ? props.initialFilters?.paymentStatus ?? 'All' : 'All'
  );
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(
    props.initialFilters?.warehouseId
  );

  const warehouseList = [
    { id: undefined, name: 'All' },
    { id: 'WH-COON', name: 'Coonoor' },
    { id: 'WH-OOTY', name: 'Ooty' },
    { id: 'WH-KOTA', name: 'Kotagiri' },
    { id: 'WH-GUDA', name: 'Gudalur' },
  ];

  const clearAll = () => {
    setSearchQuery('');
    setOrderStatus('All');
    setOrderType('Pickup');
    setChannel('Online');
    setDatePreset('Today');
    setPaymentStatus('All');
    setSelectedWarehouseId(undefined);
  };

  const apply = () => {
    if (props.config === 'order') {
      props.onApplyFilters({
        ...DEFAULT_ORDER_FILTERS,
        ...props.initialFilters,
        searchQuery,
        orderStatus,
        orderType: orderType as 'Pickup' | 'Delivery',
        channel: channel as any,
        datePreset: datePreset as any,
        paymentStatus: paymentStatus as any,
        warehouseId: selectedWarehouseId,
      });
    } else {
      props.onApplyFilters({
        ...DEFAULT_PURCHASE_FILTERS,
        ...props.initialFilters,
        searchQuery,
        datePreset: datePreset as any,
      });
    }
  };



  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {props.config === 'purchase' ? 'Purchase Filters' : 'Order Filters'}
        </Text>
        <TouchableOpacity
          onPress={clearAll}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Clear All"
        >
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Order ID, customer or phone"
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {/* Status */}
        <View style={styles.sectionHeadRow}>
          <FlagIcon size={17} color={adminColors.ink} />
          <Text style={styles.sectionTitle}>Status</Text>
        </View>
        <View style={styles.chipWrap}>
          {STATUS_OPTIONS.map((item) => {
            const active = item === orderStatus;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setOrderStatus(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Fulfillment */}
        <View style={styles.sectionHeadRow}>
          <TruckIcon size={18} color={adminColors.ink} />
          <Text style={styles.sectionTitle}>Fulfillment</Text>
        </View>
        <View style={styles.chipWrap}>
          {FULFILLMENT_OPTIONS.map((item) => {
            const active = item === orderType;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setOrderType(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Channel */}
        <View style={styles.sectionHeadRow}>
          <StoreIcon size={17} color={adminColors.ink} />
          <Text style={styles.sectionTitle}>Channel</Text>
        </View>
        <View style={styles.chipWrap}>
          {CHANNEL_OPTIONS.map((item) => {
            const active = item === channel;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setChannel(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date */}
        <View style={styles.sectionHeadRow}>
          <CalendarIcon size={17} color={adminColors.ink} />
          <Text style={styles.sectionTitle}>Date</Text>
        </View>
        <View style={styles.chipWrap}>
          {DATE_OPTIONS.map((item) => {
            const active = item === datePreset;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setDatePreset(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Payment */}
        <View style={styles.sectionHeadRow}>
          <PaymentIcon size={18} color={adminColors.ink} />
          <Text style={styles.sectionTitle}>Payment</Text>
        </View>
        <View style={styles.chipWrap}>
          {PAYMENT_OPTIONS.map((item) => {
            const active = item === paymentStatus;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setPaymentStatus(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Warehouse */}
        <View style={styles.sectionHeadRow}>
          <StoreIcon size={17} color={adminColors.ink} />
          <Text style={styles.sectionTitle}>Warehouse</Text>
        </View>
        <View style={styles.chipWrap}>
          {warehouseList.map((wh) => {
            const active = wh.id === selectedWarehouseId;
            return (
              <TouchableOpacity
                key={wh.id ?? 'all'}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedWarehouseId(wh.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{wh.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={apply} activeOpacity={0.85} accessibilityRole="button">
          <FunnelIcon size={18} color={adminColors.onBrand} />
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
  },
  backButton: {
    padding: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  clearAllText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    textDecorationLine: 'underline',
  },
  body: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  bodyContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    gap: adminSpacing.sm,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  chip: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
  },
  chipText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  chipTextActive: {
    color: adminColors.brand,
  },

  footer: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    backgroundColor: adminColors.canvas,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  applyButton: {
    height: 52,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
  },
  applyButtonText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
});
