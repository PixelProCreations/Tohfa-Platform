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
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import type { WarehouseScope, WarehouseScreenBaseProps } from './types';

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

export type CustomerFilterStatus = 'All' | 'Active' | 'Inactive' | 'With Orders' | 'With Issues';

export interface CustomerFilterValues {
  searchQuery: string;
  status: CustomerFilterStatus;
  warehouseId?: string | undefined;
}

export interface CustomerFiltersScreenProps extends WarehouseScreenBaseProps {
  initialFilters: CustomerFilterValues;
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  onApplyFilters: (filters: CustomerFilterValues) => void;
}

const STATUS_OPTIONS: readonly CustomerFilterStatus[] = [
  'All',
  'Active',
  'Inactive',
  'With Orders',
  'With Issues',
];

export function CustomerFiltersScreen({
  onBack,
  initialFilters,
  warehouseOptions = [],
  onApplyFilters,
}: CustomerFiltersScreenProps) {
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery ?? '');
  const [status, setStatus] = useState<CustomerFilterStatus>(initialFilters.status ?? 'All');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(
    initialFilters.warehouseId
  );

  const clearAll = () => {
    setSearchQuery('');
    setStatus('All');
    setSelectedWarehouseId(undefined);
  };

  const apply = () => {
    onApplyFilters({
      searchQuery,
      status,
      warehouseId: selectedWarehouseId,
    });
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
        <Text style={styles.headerTitle}>Customer Filters</Text>
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
            placeholder="Search by name, ID or mobile"
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {/* Status */}
        <View style={styles.sectionHeadRow}>
          <FlagIcon size={17} color={adminColors.ink} />
          <Text style={styles.sectionTitle}>Customer Status</Text>
        </View>
        <View style={styles.chipWrap}>
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
        </View>

        {/* Warehouse Selector */}
        {warehouseOptions.length > 0 ? (
          <>
            <View style={styles.sectionHeadRow}>
              <StoreIcon size={17} color={adminColors.ink} />
              <Text style={styles.sectionTitle}>Warehouse</Text>
            </View>
            <View style={styles.chipWrap}>
              <TouchableOpacity
                style={[styles.chip, selectedWarehouseId === undefined && styles.chipActive]}
                onPress={() => setSelectedWarehouseId(undefined)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, selectedWarehouseId === undefined && styles.chipTextActive]}>
                  All Warehouses
                </Text>
              </TouchableOpacity>
              {warehouseOptions
                .filter((w) => !!w.warehouseId)
                .map((wh) => {
                  const active = wh.warehouseId === selectedWarehouseId;
                  const label = wh.warehouseName?.replace(' Warehouse', '').replace(' Market', '') ?? wh.warehouseId!;
                  return (
                    <TouchableOpacity
                      key={wh.warehouseId}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSelectedWarehouseId(wh.warehouseId)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
          </>
        ) : null}
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
    paddingVertical: 14,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  clearAllText: {
    ...adminType.caption,
    fontWeight: '700',
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
    paddingBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
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
    marginTop: 18,
    marginBottom: 12,
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
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.muted,
  },
  chipTextActive: {
    color: adminColors.brand,
  },
  footer: {
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  applyButton: {
    backgroundColor: adminColors.brand,
    height: 50,
    borderRadius: adminRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
  },
  applyButtonText: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
});
