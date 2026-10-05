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
import Svg, { Path, Circle } from 'react-native-svg';
import { MainWarehouseReturnHistoryDetailScreen } from './MainWarehouseReturnHistoryDetailScreen';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  badgeBg: '#E8F5E9',
  badgeText: '#2E7D32',
};

function ArrowBackIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 12H4M10 18l-6-6 6-6"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

function FilterIcon({ color = '#FFF', size = 20 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function MainWarehouseReturnHistoryScreen({ onBack }: { onBack: () => void }) {
  const [showDetail, setShowDetail] = useState(false);

  if (showDetail) {
    return <MainWarehouseReturnHistoryDetailScreen onBack={() => setShowDetail(false)} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ArrowBackIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Return History</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
            <FilterIcon />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.searchBar}>
            <SearchIcon />
            <TextInput
              style={styles.searchInput}
              placeholder="Search RMA, Order ID or Customer"
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity style={styles.listCard} activeOpacity={0.8} onPress={() => setShowDetail(true)}>
            <View style={styles.cardHeader}>
              <Text style={styles.rmaId}>RMA-2026-00125</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Refunded</Text>
              </View>
            </View>
            <Text style={styles.customerLine}>Ravi Kumar · ORD-002145</Text>
            
            <View style={styles.divider} />
            
            <View style={styles.productRow}>
              <Text style={styles.productName}>Organic Tomato · 1.8 KG</Text>
              <Text style={styles.productPrice}>₹375</Text>
            </View>
          </TouchableOpacity>

        </ScrollView>
      </View>
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
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  filterBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
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
    paddingVertical: 10,
    marginBottom: 16,
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
  productRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productName: { fontFamily: 'Poppins', fontSize: 12, fontWeight: '500', color: PALETTE.textInk },
  productPrice: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#8A5A30' },
});
