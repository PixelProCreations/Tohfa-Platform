import React, { useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

const PALETTE = {
  primary:       '#F0562A', // Brand Orange
  headerBg:      '#F0562A',
  headerText:    '#FFFFFF',

  orangeDeep:    '#7A2E14',
  primarySoft:   '#FDF3EC',
  pageBg:        '#F3EFE9', // App canvas soft cream

  textInk:       '#1A1A1A',
  textSecondary: '#5F5E5A',
  border:        '#EEDCD3',
  cardBg:        '#FFFFFF',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function SearchIcon({ size = 18, color = '#7E7973' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CheckmarkIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface FilterState {
  searchQuery: string;
  warehouse: string;
  shipmentType: string;
  dateRange: string;
  receivingResult: string;
}

export interface ReceivingSearchFiltersScreenProps {
  onBack?: () => void;
  onApplyFilters?: (filters: FilterState) => void;
}

export function ReceivingSearchFiltersScreen({
  onBack,
  onApplyFilters,
}: ReceivingSearchFiltersScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouse, setWarehouse] = useState('All');
  const [shipmentType, setShipmentType] = useState('All');
  const [dateRange, setDateRange] = useState('Today');
  const [receivingResult, setReceivingResult] = useState('All');

  const WAREHOUSE_OPTIONS = ['All', 'Ooty', 'Coonoor', 'Kotagiri'];
  const SHIPMENT_TYPE_OPTIONS = ['All', 'Farmer/Admin', 'Inter-Warehouse Transfer'];
  const DATE_OPTIONS = ['Today', 'Last 7 Days', 'Custom'];
  const RESULT_OPTIONS = ['All', 'Accepted', 'Partial', 'Rejected'];

  const handleReset = () => {
    setSearchQuery('');
    setWarehouse('All');
    setShipmentType('All');
    setDateRange('Today');
    setReceivingResult('All');
  };

  const handleApply = () => {
    onApplyFilters?.({
      searchQuery,
      warehouse,
      shipmentType,
      dateRange,
      receivingResult,
    });
    onBack?.();
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Search & Filters</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Search Input Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={17} color="#7E7973" />
          <TextInput
            style={styles.searchInput}
            placeholder="Shipment ID, source ref, product, batch ref, warehous"
            placeholderTextColor="#8C867F"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        {/* ─── Warehouse Section ─── */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionLabel}>Warehouse</Text>
          <View style={styles.chipsRow}>
            {WAREHOUSE_OPTIONS.map((item) => {
              const isSelected = warehouse === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    isSelected ? styles.chipActive : styles.chipInactive,
                  ]}
                  onPress={() => setWarehouse(item)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected ? styles.chipTextActive : styles.chipTextInactive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Shipment Type Section ─── */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionLabel}>Shipment Type</Text>
          <View style={styles.chipsRow}>
            {SHIPMENT_TYPE_OPTIONS.map((item) => {
              const isSelected = shipmentType === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    isSelected ? styles.chipActive : styles.chipInactive,
                  ]}
                  onPress={() => setShipmentType(item)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected ? styles.chipTextActive : styles.chipTextInactive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Date Section ─── */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionLabel}>Date</Text>
          <View style={styles.chipsRow}>
            {DATE_OPTIONS.map((item) => {
              const isSelected = dateRange === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    isSelected ? styles.chipActive : styles.chipInactive,
                  ]}
                  onPress={() => setDateRange(item)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected ? styles.chipTextActive : styles.chipTextInactive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Receiving Result Section ─── */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionLabel}>Receiving Result</Text>
          <View style={styles.chipsRow}>
            {RESULT_OPTIONS.map((item) => {
              const isSelected = receivingResult === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    isSelected ? styles.chipActive : styles.chipInactive,
                  ]}
                  onPress={() => setReceivingResult(item)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected ? styles.chipTextActive : styles.chipTextInactive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Save Filter Notice Box ─── */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Save Filter is not built here — added only if the product requirement eventually supports saved filters.
          </Text>
        </View>

        {/* ─── Bottom Action Buttons ─── */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={handleApply}
            activeOpacity={0.8}
          >
            <CheckmarkIcon size={18} color="#FFFFFF" />
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleReset}
            activeOpacity={0.8}
          >
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  sectionGroup: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  chipActive: {
    backgroundColor: PALETTE.primary,
  },
  chipInactive: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  chipTextInactive: {
    color: PALETTE.textInk,
  },
  noticeBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
    marginTop: 6,
    marginBottom: 24,
  },
  noticeText: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    lineHeight: 16,
  },
  bottomActions: {
    gap: 10,
  },
  applyBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 2,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resetBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    height: 46,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
});
