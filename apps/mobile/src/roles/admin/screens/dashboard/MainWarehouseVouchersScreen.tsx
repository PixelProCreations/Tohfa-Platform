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
import Svg, { Path, Circle } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textDark: '#1E1612',
  textSecondary: '#7A726C',
  border: '#EBE5DC',
  green: '#059669',
  greenBg: '#DCFCE7',
  red: '#DC2626',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="4" cy="12" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="10" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="20" cy="14" r="2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

import { MainWarehouseVouchersFilterScreen } from './MainWarehouseVouchersFilterScreen';

export function MainWarehouseVouchersScreen({ onBack, onVoucherPress }: { onBack: () => void, onVoucherPress: (id: string) => void }) {
  const [activeTab, setActiveTab] = useState('All');
  const [showFilterScreen, setShowFilterScreen] = useState(false);
  const tabs = ['All', 'Expense', 'Revenue'];

  if (showFilterScreen) {
    return (
      <MainWarehouseVouchersFilterScreen
        onBack={() => setShowFilterScreen(false)}
        onApply={() => setShowFilterScreen(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />

      {/* Header */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.75} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vouchers</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Tabs */}
        <View style={styles.tabsRow}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Voucher ID, Expense ID..."
            placeholderTextColor="#9CA3AF"
            clearButtonMode="while-editing"
          />
          <TouchableOpacity activeOpacity={0.7} onPress={() => setShowFilterScreen(true)}>
            <FilterSlidersIcon size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Vouchers List */}
        <TouchableOpacity style={styles.voucherCard} onPress={() => onVoucherPress('VCH-000821')} activeOpacity={0.75}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.voucherId}>VCH-000821</Text>
              <Text style={styles.voucherType}>Expense Voucher · Transport</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Recorded</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.cardFooter}>
            <Text style={styles.expenseId}>EXP-001245</Text>
            <Text style={styles.amount}>₹2,400</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.pageBg },
  headerBanner: { backgroundColor: '#F0562A', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 12, padding: 2 },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  tabsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: PALETTE.border },
  tabActive: { backgroundColor: '#F0562A', borderColor: '#F0562A' },
  tabText: { fontSize: 13, fontWeight: '700', color: PALETTE.textSecondary },
  tabTextActive: { color: '#FFFFFF' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: PALETTE.border, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 14, color: PALETTE.textDark, marginLeft: 8, padding: 0 },
  voucherCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: PALETTE.border, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  voucherId: { fontSize: 15, fontWeight: '800', color: PALETTE.textDark, marginBottom: 2 },
  voucherType: { fontSize: 12, fontWeight: '600', color: PALETTE.textSecondary },
  statusBadge: { backgroundColor: PALETTE.greenBg, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  cardDivider: { height: 1, backgroundColor: PALETTE.border, marginVertical: 14 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expenseId: { fontSize: 12, fontWeight: '600', color: PALETTE.textDark },
  amount: { fontSize: 16, fontWeight: '800', color: PALETTE.red },
});
