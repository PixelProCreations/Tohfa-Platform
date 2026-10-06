import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

import { MainWarehouseRmaDetailScreen } from './MainWarehouseRmaDetailScreen';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  badgeBg: '#FDF0E1',
  badgeText: '#C47432',
};

function BellIcon({ color = '#FFF', size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseIcon({ color = '#FFF', size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

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

function ChevronDownIcon({ color = '#FFF', size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ color = '#999', size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterIcon({ color = '#999', size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface MainWarehouseReturnsIssuesScreenProps {
  onBack?: () => void;
}

export function MainWarehouseReturnsIssuesScreen({ onBack }: MainWarehouseReturnsIssuesScreenProps) {
  const [selectedRma, setSelectedRma] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [tempWarehouse, setTempWarehouse] = useState<'all' | 'coonoor'>('all');

  if (selectedRma) {
    return <MainWarehouseRmaDetailScreen onBack={() => setSelectedRma(false)} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
              <ArrowBackIcon size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Returns & Issues</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8}>
            <BellIcon />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.warehouseDropdown} onPress={() => setShowDropdown(!showDropdown)} activeOpacity={0.8}>
          <WarehouseIcon />
          <Text style={styles.warehouseText}>All Warehouses</Text>
          <ChevronDownIcon />
        </TouchableOpacity>
      </View>

      {showDropdown ? (
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownRow}>
            <TouchableOpacity 
              style={[styles.dropdownBtn, tempWarehouse === 'all' && styles.dropdownBtnActive]}
              onPress={() => setTempWarehouse('all')}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownBtnText, tempWarehouse === 'all' && styles.dropdownBtnTextActive]}>All Warehouses</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownBtn, tempWarehouse === 'coonoor' && styles.dropdownBtnActive]}
              onPress={() => setTempWarehouse('coonoor')}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownBtnText, tempWarehouse === 'coonoor' && styles.dropdownBtnTextActive]}>Coonoor</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.applyBtn} onPress={() => setShowDropdown(false)} activeOpacity={0.8}>
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* KPIs */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>PENDING</Text>
              <Text style={styles.kpiValue}>05</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>UNDER REVIEW</Text>
              <Text style={styles.kpiValue}>03</Text>
            </View>
          </View>
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>APPROVED</Text>
              <Text style={styles.kpiValue}>12</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiLabel}>REFUND PENDING</Text>
              <Text style={styles.kpiValue}>02</Text>
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchBar}>
            <SearchIcon />
            <TextInput
              style={styles.searchInput}
              placeholder="Search RMA, order or customer"
              placeholderTextColor="#999"
            />
            <FilterIcon />
          </View>

          {/* List Card */}
          <TouchableOpacity style={styles.listCard} onPress={() => setSelectedRma(true)} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <Text style={styles.rmaId}>RMA-2026-00125</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Under Review</Text>
              </View>
            </View>
            <Text style={styles.customerLine}>Ravi Kumar · ORD-002145</Text>
            
            <View style={styles.divider} />
            
            <View style={styles.productRow}>
              <Text style={styles.productName}>Organic Tomato · 1.8 KG</Text>
              <Text style={styles.productPrice}>₹450</Text>
            </View>
            <View style={styles.productRow}>
              <Text style={styles.productMeta}>Damaged Product · 25 Sep, 10:40 AM</Text>
              <Text style={styles.viewLink}>View →</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.pageBg },
  header: {
    backgroundColor: PALETTE.headerOrange,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  bellBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  warehouseDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  warehouseText: { fontFamily: 'Poppins', color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  mainContainer: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  kpiBox: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  kpiLabel: { fontFamily: 'Poppins', fontSize: 10, fontWeight: '800', color: PALETTE.textSecondary, marginBottom: 4 },
  kpiValue: { fontFamily: 'Poppins', fontSize: 20, fontWeight: '800', color: PALETTE.textInk },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 13,
    padding: 0,
    marginHorizontal: 8,
    color: PALETTE.textInk,
  },
  listCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rmaId: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: PALETTE.textInk },
  badge: {
    backgroundColor: PALETTE.badgeBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { fontFamily: 'Poppins', fontSize: 10, fontWeight: '800', color: PALETTE.badgeText },
  customerLine: { fontFamily: 'Poppins', fontSize: 11, color: PALETTE.textSecondary, marginTop: 4, fontWeight: '500' },
  divider: { height: 1, backgroundColor: PALETTE.border, marginVertical: 12 },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  productName: { fontFamily: 'Poppins', fontSize: 12, fontWeight: '500', color: PALETTE.textInk },
  productPrice: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: '#8A5A30' },
  productMeta: { fontFamily: 'Poppins', fontSize: 11, color: PALETTE.textSecondary, fontWeight: '500' },
  viewLink: { fontFamily: 'Poppins', fontSize: 11, color: '#8A5A30', fontWeight: '800' },

  dropdownContainer: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
    padding: 16,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dropdownBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dropdownBtnActive: {
    backgroundColor: '#FAEEE3',
    borderColor: PALETTE.primary,
  },
  dropdownBtnText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  dropdownBtnTextActive: {
    color: '#8A5A30',
  },
  applyBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyBtnText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
