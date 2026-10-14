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

import { adminColors } from '../../../theme';
import { DEFAULT_ORDER_FILTERS, DEFAULT_PURCHASE_FILTERS } from './fixtures';
import type {
  OrderFiltersVariant,
  OrderFilterState,
  PurchaseFilterState,
  WarehouseScope,
  WarehouseScreenBaseProps,
} from './types';

function BackArrowIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#64748B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FlagIcon({ size = 17, color = '#1E293B' }: { size?: number; color?: string }) {
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

function TruckIcon({ size = 18, color = '#1E293B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="4" width="14" height="12" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M15 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function StoreIcon({ size = 17, color = '#1E293B' }: { size?: number; color?: string }) {
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

function CalendarIcon({ size = 17, color = '#1E293B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PaymentIcon({ size = 18, color = '#1E293B' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M2 10h20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="14" r="2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}



function FunnelIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

  const clearAll = () => {
    setSearchQuery('');
    setOrderStatus('All');
    setOrderType('Pickup');
    setChannel('Online');
    setDatePreset('Today');
    setPaymentStatus('All');
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
        <Text style={styles.headerTitle}>Order Filters</Text>
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
          <SearchIcon size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Order ID, customer or phone"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {/* Status */}
        <View style={styles.sectionHeadRow}>
          <FlagIcon size={17} color="#1E293B" />
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
          <TruckIcon size={18} color="#1E293B" />
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
          <StoreIcon size={17} color="#1E293B" />
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
          <CalendarIcon size={17} color="#1E293B" />
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
          <PaymentIcon size={18} color="#1E293B" />
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


      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={apply} activeOpacity={0.85} accessibilityRole="button">
          <FunnelIcon size={18} color="#FFFFFF" />
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
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  body: {
    flex: 1,
    backgroundColor: '#FBF8F2',
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    paddingVertical: 0,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#FDF4EC',
    borderWidth: 1.5,
    borderColor: '#F0562A',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  chipTextActive: {
    color: '#F0562A',
  },

  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FBF8F2',
    borderTopWidth: 1,
    borderTopColor: '#F1ECE4',
  },
  applyButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F0562A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
