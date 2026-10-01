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
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens (#F0562A Existing Orange Palette) ─────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#7A726C',
  textBody:      '#4B5563',
  border:        '#F0ECE3',
  divider:       '#F0ECE3',
  activeChipBg:  '#FFF0EB',
  activeChipBorder: '#F0562A',
  activeChipText:   '#F0562A',
  chipBg:        '#FFFFFF',
  chipBorder:    '#E5E7EB',
  chipText:      '#4B5563',
  clearBorder:   '#D1D5DB',
  clearText:     '#4B5563',
};

// ─── Filter State Types ─────────────────────────────────────────────────────

export interface InvoiceFilterState {
  searchQuery: string;
  status: 'All' | 'Generated' | 'Pending' | 'Cancelled';
  invoiceType: 'All' | 'Retail Sale' | 'Market Sale' | 'B2B Sale';
  datePreset: 'All Time' | 'Today' | 'Last 7 Days' | 'This Month' | 'Custom';
  startDate: string;
  endDate: string;
  customer: string;
  orderId: string;
  minAmount: string;
  maxAmount: string;
}

export const DEFAULT_INVOICE_FILTERS: InvoiceFilterState = {
  searchQuery: '',
  status: 'All',
  invoiceType: 'All',
  datePreset: 'All Time',
  startDate: '',
  endDate: '',
  customer: '',
  orderId: '',
  minAmount: '',
  maxAmount: '',
};

// ─── Pure SVG Icons ─────────────────────────────────────────────────────────

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

function SearchIcon({ size = 18, color = '#8A928D' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon({ size = 16, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ResetIcon({ size = 16, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 3v5h5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface SubWarehouseInvoiceFiltersScreenProps {
  initialFilters?: InvoiceFilterState | undefined;
  onBack: () => void;
  onApplyFilters: (filters: InvoiceFilterState) => void;
}

export function SubWarehouseInvoiceFiltersScreen({
  initialFilters = DEFAULT_INVOICE_FILTERS,
  onBack,
  onApplyFilters,
}: SubWarehouseInvoiceFiltersScreenProps): React.JSX.Element {
  const [filters, setFilters] = useState<InvoiceFilterState>({ ...initialFilters });

  const handleClearAll = () => {
    setFilters({ ...DEFAULT_INVOICE_FILTERS });
  };

  const handleApply = () => {
    onApplyFilters(filters);
  };

  const statusOptions: Array<InvoiceFilterState['status']> = [
    'All',
    'Generated',
    'Pending',
    'Cancelled',
  ];

  const typeOptions: Array<InvoiceFilterState['invoiceType']> = [
    'All',
    'Retail Sale',
    'Market Sale',
    'B2B Sale',
  ];

  const datePresets: Array<InvoiceFilterState['datePreset']> = [
    'All Time',
    'Today',
    'Last 7 Days',
    'This Month',
    'Custom',
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Back to Invoice List"
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Invoice Filters</Text>

          <TouchableOpacity
            style={styles.headerResetButton}
            onPress={handleClearAll}
            activeOpacity={0.7}
            accessibilityLabel="Clear All Filters"
          >
            <Text style={styles.headerResetText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Content Scroll ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Search Query */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Search</Text>
          <View style={styles.searchBar}>
            <SearchIcon size={18} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Invoice / Order / Customer"
              placeholderTextColor="#8A928D"
              value={filters.searchQuery}
              onChangeText={(text) => setFilters((prev) => ({ ...prev, searchQuery: text }))}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* 2. Invoice Status */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Invoice Status</Text>
          <View style={styles.chipGrid}>
            {statusOptions.map((st) => {
              const isSelected = filters.status === st;
              return (
                <TouchableOpacity
                  key={st}
                  style={[styles.chip, isSelected && styles.activeChip]}
                  onPress={() => setFilters((prev) => ({ ...prev, status: st }))}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                    {st}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Invoice Type */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Invoice Type</Text>
          <View style={styles.chipGrid}>
            {typeOptions.map((tp) => {
              const isSelected = filters.invoiceType === tp;
              return (
                <TouchableOpacity
                  key={tp}
                  style={[styles.chip, isSelected && styles.activeChip]}
                  onPress={() => setFilters((prev) => ({ ...prev, invoiceType: tp }))}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                    {tp}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Date Range */}
        <View style={styles.sectionCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionLabel}>Date Range</Text>
            <CalendarIcon size={15} color={PALETTE.textSecondary} />
          </View>
          <View style={styles.chipGrid}>
            {datePresets.map((preset) => {
              const isSelected = filters.datePreset === preset;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[styles.chip, isSelected && styles.activeChip]}
                  onPress={() => setFilters((prev) => ({ ...prev, datePreset: preset }))}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, isSelected && styles.activeChipText]}>
                    {preset}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Date Input Row */}
          {filters.datePreset === 'Custom' && (
            <View style={styles.dateInputsRow}>
              <View style={styles.dateInputCol}>
                <Text style={styles.inputSubLabel}>From</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#8A928D"
                  value={filters.startDate}
                  onChangeText={(val) => setFilters((prev) => ({ ...prev, startDate: val }))}
                />
              </View>
              <View style={styles.dateInputCol}>
                <Text style={styles.inputSubLabel}>To</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#8A928D"
                  value={filters.endDate}
                  onChangeText={(val) => setFilters((prev) => ({ ...prev, endDate: val }))}
                />
              </View>
            </View>
          )}
        </View>

        {/* 5. Customer & 6. Order ID */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Customer</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Ravi Kumar"
            placeholderTextColor="#8A928D"
            value={filters.customer}
            onChangeText={(val) => setFilters((prev) => ({ ...prev, customer: val }))}
          />

          <Text style={[styles.sectionLabel, { marginTop: 14 }]}>Order ID</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. ORD-002154"
            placeholderTextColor="#8A928D"
            value={filters.orderId}
            onChangeText={(val) => setFilters((prev) => ({ ...prev, orderId: val }))}
          />
        </View>

        {/* 7. Amount Range */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Amount Range (₹)</Text>
          <View style={styles.amountRow}>
            <View style={styles.amountCol}>
              <Text style={styles.inputSubLabel}>Min</Text>
              <TextInput
                style={styles.textInput}
                placeholder="₹ 0"
                placeholderTextColor="#8A928D"
                keyboardType="numeric"
                value={filters.minAmount}
                onChangeText={(val) => setFilters((prev) => ({ ...prev, minAmount: val }))}
              />
            </View>
            <View style={styles.amountDivider}>
              <Text style={styles.amountDividerText}>–</Text>
            </View>
            <View style={styles.amountCol}>
              <Text style={styles.inputSubLabel}>Max</Text>
              <TextInput
                style={styles.textInput}
                placeholder="₹ 10,000+"
                placeholderTextColor="#8A928D"
                keyboardType="numeric"
                value={filters.maxAmount}
                onChangeText={(val) => setFilters((prev) => ({ ...prev, maxAmount: val }))}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom Action Bar ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearAll}
          activeOpacity={0.7}
        >
          <ResetIcon size={15} color={PALETTE.clearText} />
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApply}
          activeOpacity={0.85}
        >
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerResetButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  headerResetText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    backgroundColor: PALETTE.pageBg,
  },
  sectionCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 12,
  },
  sectionLabel: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 10,
    letterSpacing: 0.1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  searchBar: {
    backgroundColor: '#FAF9F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '400',
    color: PALETTE.textInk,
    marginLeft: 8,
    paddingVertical: 0,
  },
  textInput: {
    backgroundColor: '#FAF9F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    height: 42,
    paddingHorizontal: 12,
    fontFamily: 'Poppins',
    fontSize: 12.5,
    color: PALETTE.textInk,
  },
  inputSubLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: PALETTE.chipBg,
    borderWidth: 1,
    borderColor: PALETTE.chipBorder,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  activeChip: {
    backgroundColor: PALETTE.activeChipBg,
    borderColor: PALETTE.activeChipBorder,
    borderWidth: 1.5,
  },
  chipText: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '500',
    color: PALETTE.chipText,
  },
  activeChipText: {
    color: PALETTE.activeChipText,
    fontWeight: '700',
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  dateInputCol: {
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  amountCol: {
    flex: 1,
  },
  amountDivider: {
    paddingBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountDividerText: {
    fontSize: 18,
    color: PALETTE.textSecondary,
    fontWeight: '600',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.divider,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.clearBorder,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  clearButtonText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.clearText,
  },
  applyButton: {
    flex: 2,
    height: 46,
    borderRadius: 12,
    backgroundColor: PALETTE.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
