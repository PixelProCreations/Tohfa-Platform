// Design id: M3S16
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { adminColors, adminType } from '../../../theme';
import type { InventoryScreenBaseProps } from './types';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { SWAHeader } from '../../swa/components';

export type InventoryFiltersScreenProps = InventoryScreenBaseProps;

function WarehouseIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21V9l9-6 9 6v12H3z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CropIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a9 9 0 0 1 9 9v1a9 9 0 0 1-9 9 9 9 0 0 1-9-9v-1a9 9 0 0 1 9-9z" stroke={color} strokeWidth="1.8" />
      <Path d="M12 6v12M8 10l4-4 4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StarIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlagIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v18" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QrIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.8" />
      <Path d="M15 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.8" />
      <Path d="M4 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.8" />
      <Path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 19h2v2h-2z" fill={color} />
    </Svg>
  );
}

function PinIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function ArrowsUpDownIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 16V4M7 4l-4 4M7 4l4 4M17 8v12M17 20l-4-4M17 20l4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke={color} strokeWidth="1.8" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function FunnelFilterIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function InventoryFiltersScreen({ scope, onNavigate, onBack, warehouseOptions = [] }: InventoryFiltersScreenProps) {
  // Warehouse facet only for the all-warehouses (Main) view; Sub is locked to its own.
  const showWarehouseFacet = scope.warehouseId === undefined;
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All Grades');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedMovement, setSelectedMovement] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState('Today');
  const [showMore, setShowMore] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader 
          title="Inventory Filters"
          onBack={onBack}
          rightAction={
            <TouchableOpacity onPress={() => {}} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.headerClearAll}>Clear All</Text>
            </TouchableOpacity>
          }
        />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Product, Batch ID..."
              placeholderTextColor={adminColors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Product / Crop */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <CropIcon size={16} color={adminColors.ink} />
              <Text style={styles.sectionTitle}>Product / Crop</Text>
            </View>
            <TouchableOpacity style={styles.dropdown} activeOpacity={0.7}>
              <Text style={styles.dropdownPlaceholder}>Select Product</Text>
              <Icon name="expand_more" size={20} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          {/* Warehouse (Main only) */}
          {showWarehouseFacet ? (
            <View style={styles.filterSection}>
              <View style={styles.sectionHeaderRow}>
                <WarehouseIcon size={16} color={adminColors.ink} />
                <Text style={styles.sectionTitle}>Warehouse</Text>
              </View>
              <View style={styles.chipGroup}>
                {[{ warehouseId: undefined, warehouseName: 'All Warehouses' }, ...warehouseOptions].map((wh) => {
                  const isActive = selectedWarehouseId === wh.warehouseId;
                  return (
                    <TouchableOpacity
                      key={wh.warehouseId ?? 'all'}
                      style={[styles.chip, isActive && styles.activeChip]}
                      onPress={() => setSelectedWarehouseId(wh.warehouseId)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                        {wh.warehouseName ?? wh.warehouseId}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Grade */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <StarIcon size={16} color={adminColors.ink} />
              <Text style={styles.sectionTitle}>Grade</Text>
            </View>
            <View style={styles.chipGroup}>
              {['All Grades', 'Grade 1', 'Grade 2', 'Grade 3'].map((grade) => {
                const isActive = selectedGrade === grade;
                return (
                  <TouchableOpacity 
                    key={grade} 
                    style={[styles.chip, isActive && styles.activeChip]}
                    onPress={() => setSelectedGrade(grade)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isActive && styles.activeChipText]}>{grade}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Batch */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <QrIcon size={16} color={adminColors.ink} />
              <Text style={styles.sectionTitle}>Batch</Text>
            </View>
            <TouchableOpacity style={styles.dropdown} activeOpacity={0.7}>
              <Text style={styles.dropdownPlaceholder}>Search / Select Batch</Text>
              <Icon name="expand_more" size={20} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          {/* Storage Location */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <PinIcon size={16} color={adminColors.ink} />
              <Text style={styles.sectionTitle}>Storage Location</Text>
            </View>
            <TouchableOpacity style={styles.dropdown} activeOpacity={0.7}>
              <Text style={styles.dropdownPlaceholder}>Select Location</Text>
              <Icon name="expand_more" size={20} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          {/* Stock Status */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <FlagIcon size={16} color={adminColors.ink} />
              <Text style={styles.sectionTitle}>Stock Status</Text>
            </View>
            <View style={styles.chipGroup}>
              {['All', 'Available', 'Low Stock', 'Out of Stock'].map((status) => {
                const isActive = selectedStatus === status;
                return (
                  <TouchableOpacity 
                    key={status} 
                    style={[styles.chip, isActive && styles.activeChip]}
                    onPress={() => setSelectedStatus(status)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isActive && styles.activeChipText]}>{status}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Movement Type For Stock Ledger */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <ArrowsUpDownIcon size={16} color={adminColors.ink} />
              <Text style={styles.sectionTitle}>Movement Type <Text style={{fontWeight: '700'}}>For Stock Ledger</Text></Text>
            </View>
            <View style={styles.chipGroup}>
              {['Receipt', 'Dispatch', 'Allocation', 'Reservation', 'Consumption', 'Write-off', 'Adjustment'].map((mov) => {
                const isActive = selectedMovement === mov;
                return (
                  <TouchableOpacity 
                    key={mov} 
                    style={[styles.chip, isActive && styles.activeChip]}
                    onPress={() => setSelectedMovement(mov)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isActive && styles.activeChipText]}>{mov}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Date Range */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <CalendarIcon size={16} color={adminColors.ink} />
              <Text style={styles.sectionTitle}>Date Range</Text>
            </View>
            <View style={styles.chipGroup}>
              {['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Custom'].map((range) => {
                const isActive = selectedDateRange === range;
                return (
                  <TouchableOpacity 
                    key={range} 
                    style={[styles.chip, isActive && styles.activeChip]}
                    onPress={() => setSelectedDateRange(range)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isActive && styles.activeChipText]}>{range}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* From / To Dates */}
          <View style={[styles.filterSection, { flexDirection: 'row', gap: 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateLabel}>From</Text>
              <TouchableOpacity style={styles.dateInput} activeOpacity={0.7}>
                <Text style={styles.dateInputValue}>16 Sep 2026</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateLabel}>To</Text>
              <TouchableOpacity style={styles.dateInput} activeOpacity={0.7}>
                <Text style={styles.dateInputValue}>16 Sep 2026</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Results Count */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsText}>Results</Text>
            <Text style={styles.resultsCount}>23 Results</Text>
          </View>

          {/* Result Card matching Left Reference UI */}
          <View style={styles.resultCard}>
            <View style={styles.resultCardTop}>
              <Text style={styles.resultItemName}>Tomato</Text>
              <View style={styles.receiptBadge}>
                <Text style={styles.receiptBadgeText}>RECEIPT</Text>
              </View>
            </View>

            <Text style={styles.resultItemSubtitle}>Grade 1 · Batch BAT-COO-00241</Text>

            <View style={styles.resultStatsRow}>
              <View style={styles.resultStatCol}>
                <Text style={styles.resultStatLabel}>Quantity</Text>
                <Text style={styles.resultStatQuantity}>+140 KG</Text>
              </View>
              <View style={styles.resultStatCol}>
                <Text style={styles.resultStatLabel}>Ref</Text>
                <Text style={styles.resultStatRef}>GRN-00291</Text>
              </View>
            </View>

            <View style={styles.resultTimeRow}>
              <Text style={styles.resultTimeText}>16 Sep · 10:42 AM</Text>
            </View>
          </View>

          {showMore && (
            <View style={styles.resultCard}>
              <View style={styles.resultCardTop}>
                <Text style={styles.resultItemName}>Carrot</Text>
                <View style={[styles.receiptBadge, { backgroundColor: adminColors.info.bg }]}>
                  <Text style={[styles.receiptBadgeText, { color: adminColors.info.text }]}>TRANSFER</Text>
                </View>
              </View>

              <Text style={styles.resultItemSubtitle}>Grade 1 · Batch BAT-COO-00238</Text>

              <View style={styles.resultStatsRow}>
                <View style={styles.resultStatCol}>
                  <Text style={styles.resultStatLabel}>Quantity</Text>
                  <Text style={styles.resultStatQuantity}>+80 KG</Text>
                </View>
                <View style={styles.resultStatCol}>
                  <Text style={styles.resultStatLabel}>Ref</Text>
                  <Text style={styles.resultStatRef}>TRN-00185</Text>
                </View>
              </View>

              <View style={styles.resultTimeRow}>
                <Text style={styles.resultTimeText}>15 Sep · 03:20 PM</Text>
              </View>
            </View>
          )}

          {/* Load More Link */}
          <TouchableOpacity
            style={styles.loadMoreBtn}
            activeOpacity={0.7}
            onPress={() => setShowMore(true)}
          >
            <Text style={styles.loadMoreText}>
              {showMore ? 'No more results' : 'Load more ↓'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Sticky Action Buttons (Stacked Vertically matching reference) */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={() => onNavigate?.('M3S02')}
            activeOpacity={0.8}
          >
            <FunnelFilterIcon size={18} color={adminColors.onBrand} />
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => {
              setSearchQuery('');
              setSelectedGrade('All Grades');
              setSelectedStatus('All');
              setSelectedMovement(null);
              setSelectedDateRange('Today');
              setShowMore(false);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  headerClearAll: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  searchInput: {
    ...adminType.body,
    flex: 1,
    marginLeft: 8,
    color: adminColors.ink,
  },
  filterSection: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginLeft: 6,
  },
  // Warehouse Box - soft peach tint with orange border
  warehouseBox: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warehouseLockIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  warehouseText: {
    ...adminType.rowMeta,
    flex: 1,
    lineHeight: 16,
    color: adminColors.brandDeep,
  },
  warehouseTextBold: {
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  dropdown: {
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  dropdownPlaceholder: {
    ...adminType.body,
    color: adminColors.muted,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: adminColors.card,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  activeChip: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
    borderWidth: 1.5,
  },
  chipText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  activeChipText: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  dateLabel: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: adminColors.card,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  dateInputValue: {
    ...adminType.body,
    color: adminColors.ink,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  resultsText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  resultsCount: {
    ...adminType.body,
    color: adminColors.muted,
  },
  resultCard: {
    backgroundColor: adminColors.card,
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 12,
  },
  resultCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  resultItemName: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  receiptBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  receiptBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
    letterSpacing: 0.5,
  },
  resultItemSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 14,
  },
  resultStatsRow: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 8,
  },
  resultStatCol: {},
  resultStatLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  resultStatQuantity: {
    ...adminType.sectionHead,
    color: adminColors.success.text,
  },
  resultStatRef: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  resultTimeRow: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  resultTimeText: {
    ...adminType.rowMeta,
    color: adminColors.brandDeep,
  },
  loadMoreBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  loadMoreText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    gap: 10,
  },
  applyButton: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  applyButtonText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  clearButton: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
  },
  clearButtonText: {
    ...adminType.sectionHead,
    color: adminColors.brand,
  },
});

