import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#7A2E14',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  border: '#EEDCD3',
  infoBg: '#FEF3E2',
  infoText: '#854F0B',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon({ size = 14, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#7A726C' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WarehouseBoxIcon({ color = '#B45309' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21V9l9-6 9 6v12H3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21v-6h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="11" y="17" width="2" height="2" fill={color} />
    </Svg>
  );
}

export interface SubWarehouseCapacityScreenProps {
  onBack: () => void;
  onTabChange?: (tab: string) => void;
}

export function SubWarehouseCapacityScreen({
  onBack,
  onTabChange,
}: SubWarehouseCapacityScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  const FILTERS = ['All', 'Available', 'Occupied', 'Unavailable'];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Warehouse Capacity</Text>
        </View>
        <View style={styles.warehousePill}>
          <LockIcon size={13} color="#FFFFFF" />
          <Text style={styles.warehousePillText}>Coonoor Warehouse</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.sectionTitle}>Storage Locations</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>STORAGE TOTAL</Text>
            <Text style={styles.statValBlack}>4,300 kg</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>AVAILABLE CAPACITY</Text>
            <Text style={styles.statValGreen}>1,350 kg</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search storage locations..."
            placeholderTextColor={PALETTE.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filtersRow}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>{filter}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.listContainer}>
          <View style={styles.listItem}>
            <View style={styles.itemIconWrap}>
              <WarehouseBoxIcon color="#B45309" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Cold Storage A</Text>
              <Text style={styles.itemSub}>Code: CS-A01</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.badgeText, { color: '#0F766E' }]}>Available</Text>
            </View>
          </View>

          <View style={styles.listItem}>
            <View style={styles.itemIconWrap}>
              <WarehouseBoxIcon color="#B45309" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Dry Storage B</Text>
              <Text style={styles.itemSub}>Code: DS-B02</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.badgeText, { color: '#B45309' }]}>Occupied</Text>
            </View>
          </View>

          <View style={styles.listItem}>
            <View style={styles.itemIconWrap}>
              <WarehouseBoxIcon color="#B45309" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Material Storage</Text>
              <Text style={styles.itemSub}>Code: MS-01</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.badgeText, { color: '#DC2626' }]}>Unavailable</Text>
            </View>
          </View>
        </View>

        {/* Info Notice */}
        <View style={styles.infoNotice}>
          <LockIcon size={16} color={PALETTE.infoText} />
          <Text style={styles.infoNoticeText}>
            View only. Locations are scoped to your assigned warehouse — no capacity editing, storage configuration, or quantity allocation here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.primary },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginLeft: 44,
    marginTop: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  warehousePillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  scroll: { flex: 1, backgroundColor: PALETTE.pageBg },
  scrollContent: { padding: 16, paddingBottom: 40 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.textInk, marginBottom: 12 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
  },
  statLabel: { fontSize: 10, fontWeight: '800', color: PALETTE.textSecondary, marginBottom: 6 },
  statValBlack: { fontSize: 22, fontWeight: '800', color: PALETTE.textInk },
  statValGreen: { fontSize: 22, fontWeight: '800', color: '#0F766E' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14, color: PALETTE.textInk, padding: 0 },

  filtersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterPill: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterPillActive: { borderColor: '#B45309' },
  filterPillText: { fontSize: 13, fontWeight: '600', color: PALETTE.textSecondary },
  filterPillTextActive: { color: '#B45309', fontWeight: '800' },

  listContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 8,
    marginBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE9',
  },
  itemIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3EFE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemTextWrap: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '800', color: PALETTE.textInk, marginBottom: 2 },
  itemSub: { fontSize: 12, color: PALETTE.textSecondary },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },

  infoNotice: {
    flexDirection: 'row',
    backgroundColor: PALETTE.infoBg,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoNoticeText: { flex: 1, color: PALETTE.infoText, fontSize: 13, lineHeight: 20, fontWeight: '600' },
});
