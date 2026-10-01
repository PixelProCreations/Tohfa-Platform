import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { SWAHeader } from '../components';

interface M3S16Props {
  onNavigate: (screen: string) => void;
  onBack: () => void;
}

function WarehouseIcon({ size = 16, color = '#1D2420' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21V9l9-6 9 6v12H3z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CropIcon({ size = 16, color = '#1D2420' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a9 9 0 0 1 9 9v1a9 9 0 0 1-9 9 9 9 0 0 1-9-9v-1a9 9 0 0 1 9-9z" stroke={color} strokeWidth="1.8" />
      <Path d="M12 6v12M8 10l4-4 4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StarIcon({ size = 16, color = '#1D2420' }: { size?: number; color?: string }) {
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

function FlagIcon({ size = 16, color = '#1D2420' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v18" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QrIcon({ size = 16, color = '#1D2420' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.8" />
      <Path d="M15 3h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.8" />
      <Path d="M4 14h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.8" />
      <Path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 19h2v2h-2z" fill={color} />
    </Svg>
  );
}

function PinIcon({ size = 16, color = '#1D2420' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function FunnelFilterIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

export const M3S16_InventoryFilters: React.FC<M3S16Props> = ({ onNavigate, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All Grades');
  const [selectedStatus, setSelectedStatus] = useState('All');
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
            <Icon name="search" size={18} color="#7A726C" />
            <TextInput
              style={styles.searchInput}
              placeholder="Product, Batch ID..."
              placeholderTextColor="#7A726C"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Warehouse - Locked Box matching reference */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <WarehouseIcon size={16} color="#1D2420" />
              <Text style={styles.sectionTitle}>Warehouse</Text>
            </View>
            <View style={styles.warehouseBox}>
              <Icon name="lock" size={16} color="#E85226" style={styles.warehouseLockIcon} />
              <Text style={styles.warehouseText}>
                <Text style={styles.warehouseTextBold}>Coonoor Warehouse — </Text>
                Assigned Warehouse. Not an editable dropdown; SWA cannot select Ooty, Kotagiri or Gudalur. This scope also applies to any export.
              </Text>
            </View>
          </View>

          {/* Product / Crop */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <CropIcon size={16} color="#1D2420" />
              <Text style={styles.sectionTitle}>Product / Crop</Text>
            </View>
            <TouchableOpacity style={styles.dropdown} activeOpacity={0.7}>
              <Text style={styles.dropdownPlaceholder}>Select Product</Text>
              <Icon name="expand_more" size={20} color="#7A726C" />
            </TouchableOpacity>
          </View>

          {/* Grade */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <StarIcon size={16} color="#1D2420" />
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

          {/* Stock Status */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <FlagIcon size={16} color="#1D2420" />
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

          {/* Batch */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <QrIcon size={16} color="#1D2420" />
              <Text style={styles.sectionTitle}>Batch</Text>
            </View>
            <TouchableOpacity style={styles.dropdown} activeOpacity={0.7}>
              <Text style={styles.dropdownPlaceholder}>Search / Select Batch</Text>
              <Icon name="expand_more" size={20} color="#7A726C" />
            </TouchableOpacity>
          </View>

          {/* Storage Location */}
          <View style={styles.filterSection}>
            <View style={styles.sectionHeaderRow}>
              <PinIcon size={16} color="#1D2420" />
              <Text style={styles.sectionTitle}>Storage Location</Text>
            </View>
            <TouchableOpacity style={styles.dropdown} activeOpacity={0.7}>
              <Text style={styles.dropdownPlaceholder}>Select Location</Text>
              <Icon name="expand_more" size={20} color="#7A726C" />
            </TouchableOpacity>
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
                <View style={[styles.receiptBadge, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.receiptBadgeText, { color: '#2563EB' }]}>TRANSFER</Text>
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
            onPress={() => onNavigate('M3S02')}
            activeOpacity={0.8}
          >
            <FunnelFilterIcon size={18} color="#FFFFFF" />
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => {
              setSearchQuery('');
              setSelectedGrade('All Grades');
              setSelectedStatus('All');
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
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  headerClearAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontFamily: 'Poppins',
    color: '#1D2420',
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
    fontSize: 13,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
    marginLeft: 6,
  },
  // Warehouse Box - soft peach tint with orange border
  warehouseBox: {
    backgroundColor: '#FFF8F2',
    borderWidth: 1,
    borderColor: '#E87D4D',
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
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#8B3A18',
    fontWeight: '500',
    fontFamily: 'Poppins',
  },
  warehouseTextBold: {
    fontWeight: '700',
    color: '#8B3A18',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EAE6DF',
  },
  dropdownPlaceholder: {
    fontSize: 13,
    fontWeight: '400',
    color: '#7A726C',
    fontFamily: 'Poppins',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D8D2C6',
  },
  activeChip: {
    backgroundColor: '#FFF8F2',
    borderColor: '#E85226',
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5C6B63',
    fontFamily: 'Poppins',
  },
  activeChipText: {
    color: '#E85226',
    fontWeight: '600',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7A726C',
    fontFamily: 'Poppins',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
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
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: '#1D2420',
  },
  receiptBadge: {
    backgroundColor: '#E6F5ED',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  receiptBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 0.5,
  },
  resultItemSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: '#78716C',
    marginBottom: 14,
  },
  resultStatsRow: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 8,
  },
  resultStatCol: {},
  resultStatLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '500',
    color: '#8C7A6B',
    marginBottom: 2,
  },
  resultStatQuantity: {
    fontFamily: 'Poppins',
    fontSize: 15.5,
    fontWeight: '800',
    color: '#16A34A',
  },
  resultStatRef: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '800',
    color: '#1D2420',
  },
  resultTimeRow: {
    alignItems: 'flex-end',
    marginTop: 2,
  },
  resultTimeText: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '600',
    color: '#8B4513',
  },
  loadMoreBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  loadMoreText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: '#8B4513',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAE6DF',
    gap: 10,
  },
  applyButton: {
    backgroundColor: '#E85226',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  clearButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E85226',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E85226',
    fontFamily: 'Poppins',
  },
});

