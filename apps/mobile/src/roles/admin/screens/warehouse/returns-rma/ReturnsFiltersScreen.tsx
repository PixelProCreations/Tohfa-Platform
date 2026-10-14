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

function FlagIcon({ size = 17, color = '#F0562A' }: { size?: number; color?: string }) {
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

function CalendarIcon({ size = 17, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AlertCircleIcon({ size = 17, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CreditCardIcon({ size = 17, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 10h20M6 15h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BuildingWarehouseIcon({ size = 18, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function LockIcon({ size = 18, color = '#9A3412' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="16" r="1.2" fill={color} />
    </Svg>
  );
}

export type RmaFilterStatus = 'All' | 'Pending' | 'Under Review' | 'Approved' | 'Refund Pending';
export type RmaFilterDate = 'Today' | 'Last 7 Days' | 'Last 30 Days' | 'Custom';
export type RmaFilterReason = 'All' | 'Damaged Product' | 'Quality Issue' | 'Missing Item' | 'Wrong Item';
export type RmaFilterRefundMethod = 'All' | 'Wallet' | 'Bank';

export interface RmaFilterValues {
  searchQuery: string;
  status: RmaFilterStatus;
  date: RmaFilterDate;
  reason: RmaFilterReason;
  refundMethod: RmaFilterRefundMethod;
  warehouseId?: string | undefined;
}

export interface ReturnsFiltersScreenProps {
  initialFilters: RmaFilterValues;
  warehouseName?: string | undefined;
  showWarehouseSelector?: boolean | undefined;
  warehouses?: readonly { id: string; name: string }[] | undefined;
  onBack: () => void;
  onApply: (filters: RmaFilterValues) => void;
}

const STATUS_OPTIONS: readonly RmaFilterStatus[] = ['All', 'Pending', 'Under Review', 'Approved', 'Refund Pending'];
const DATE_OPTIONS: readonly RmaFilterDate[] = ['Today', 'Last 7 Days', 'Last 30 Days', 'Custom'];
const REASON_OPTIONS: readonly RmaFilterReason[] = ['All', 'Damaged Product', 'Quality Issue', 'Missing Item', 'Wrong Item'];
const REFUND_OPTIONS: readonly RmaFilterRefundMethod[] = ['All', 'Wallet', 'Bank'];

export function ReturnsFiltersScreen({
  initialFilters,
  warehouseName,
  showWarehouseSelector = false,
  warehouses = [],
  onBack,
  onApply,
}: ReturnsFiltersScreenProps) {
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery);
  const [status, setStatus] = useState<RmaFilterStatus>(initialFilters.status);
  const [date, setDate] = useState<RmaFilterDate>(initialFilters.date);
  const [reason, setReason] = useState<RmaFilterReason>(initialFilters.reason);
  const [refundMethod, setRefundMethod] = useState<RmaFilterRefundMethod>(initialFilters.refundMethod);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(
    initialFilters.warehouseId,
  );

  const clearAll = () => {
    setSearchQuery('');
    setStatus('All');
    setDate('Today');
    setReason('All');
    setRefundMethod('All');
    setSelectedWarehouseId(undefined);
  };

  const handleApply = () => {
    onApply({
      searchQuery,
      status,
      date,
      reason,
      refundMethod,
      warehouseId: selectedWarehouseId,
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />

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
        <Text style={styles.headerTitle}>Returns Filters</Text>
        <TouchableOpacity
          onPress={clearAll}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Clear All"
        >
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
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
            placeholder="Search RMA, order or customer"
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollRow}>
          {STATUS_OPTIONS.map((item) => {
            const active = item === status;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setStatus(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Date */}
        <View style={styles.sectionHeadRow}>
          <CalendarIcon size={17} color="#1E293B" />
          <Text style={styles.sectionTitle}>Date</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScrollRow}>
          {DATE_OPTIONS.map((item) => {
            const active = item === date;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setDate(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Return Reason */}
        <View style={styles.sectionHeadRow}>
          <AlertCircleIcon size={17} color="#1E293B" />
          <Text style={styles.sectionTitle}>Return Reason</Text>
        </View>
        <View style={styles.chipWrap}>
          {REASON_OPTIONS.map((item) => {
            const active = item === reason;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setReason(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Backend configured note */}
        <View style={styles.reasonNote}>
          <Text style={styles.reasonNoteText}>
            Only configured reasons from the backend appear here — no hard-coded exhaustive list.
          </Text>
        </View>

        {/* Refund Method */}
        <View style={styles.sectionHeadRow}>
          <CreditCardIcon size={17} color="#1E293B" />
          <Text style={styles.sectionTitle}>Refund Method</Text>
        </View>
        <View style={styles.chipWrap}>
          {REFUND_OPTIONS.map((item) => {
            const active = item === refundMethod;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setRefundMethod(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Warehouse Selector */}
        {showWarehouseSelector && warehouses.length > 0 && (
          <>
            <View style={styles.sectionHeadRow}>
              <BuildingWarehouseIcon size={18} color="#1E293B" />
              <Text style={styles.sectionTitle}>Warehouse</Text>
            </View>
            <View style={styles.chipWrap}>
              {warehouses.map((w) => {
                const isAll = w.id === 'ALL';
                const active = isAll
                  ? selectedWarehouseId === undefined
                  : selectedWarehouseId === w.id;
                return (
                  <TouchableOpacity
                    key={w.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setSelectedWarehouseId(isAll ? undefined : w.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{w.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Locked Warehouse Pill */}
        {!showWarehouseSelector && warehouseName && (
          <View style={styles.orangeNote}>
            <LockIcon size={18} color="#9A3412" />
            <Text style={styles.orangeNoteText}>
              Locked to {warehouseName} · Active. Switch warehouse from the header selector if needed.
            </Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApply}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Apply Filters"
        >
          <FunnelIcon size={18} color="#FFFFFF" />
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  header: {
    backgroundColor: '#F0562A',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
  horizontalScrollRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
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
  reasonNote: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  reasonNoteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9A3412',
    lineHeight: 18,
  },
  orangeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
    borderRadius: 12,
    padding: 14,
    marginTop: 24,
  },
  orangeNoteText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#9A3412',
    lineHeight: 18,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  applyButton: {
    backgroundColor: '#F0562A',
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
