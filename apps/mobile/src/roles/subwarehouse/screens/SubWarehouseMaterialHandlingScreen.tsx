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
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#7A2E14',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  textMuted: '#5F5E5A',
  border: '#EEDCD3',
  greenBadgeBg: '#EAF3DE',
  greenBadgeText: '#173404',
  redBadgeBg: '#FCEBEB',
  redBadgeText: '#E24B4A',
  activePillBg: '#F0562A',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = PALETTE.textSecondary }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" fill="none" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

function ClipboardIcon({ color = '#B45309' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" fill="none" />
      <Path d="M9 14l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function TrendingDownIcon({ color = '#DC2626' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Polyline points="23 18 13.5 8.5 8.5 13.5 1 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Polyline points="17 18 23 18 23 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function UploadIcon({ color = '#B45309' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function DownloadIcon({ color = '#B45309' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

function PlusIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const MOCK_MATERIALS = [
  { id: 'mat1', name: 'Packaging Box', code: 'MAT-0021', available: 120, status: 'Available', date: 'Today, 10:30 AM' },
  { id: 'mat2', name: 'Crates', code: 'MAT-0034', available: 8, status: 'Low Stock', date: 'Today, 9:15 AM' },
  { id: 'mat3', name: 'Labels', code: 'MAT-0041', available: 340, status: 'Available', date: 'Yesterday' },
];

export interface SubWarehouseMaterialHandlingScreenProps {
  onBack: () => void;
  onSelectMaterial: (id: string) => void;
  onAddMaterial?: () => void;
}

export function SubWarehouseMaterialHandlingScreen({
  onBack,
  onSelectMaterial,
  onAddMaterial,
}: SubWarehouseMaterialHandlingScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowBackIcon size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Material Handling</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        {/* Top Grid */}
        <View style={styles.grid}>
          <View style={styles.gridCard}>
            <ClipboardIcon />
            <Text style={styles.gridVal}>42</Text>
            <Text style={styles.gridLabel}>Total Materials</Text>
          </View>
          <View style={styles.gridCard}>
            <TrendingDownIcon />
            <Text style={[styles.gridVal, { color: '#DC2626' }]}>5</Text>
            <Text style={styles.gridLabel}>Low Material</Text>
          </View>
          <View style={styles.gridCard}>
            <UploadIcon />
            <Text style={styles.gridVal}>18</Text>
            <Text style={styles.gridLabel}>Issued Today</Text>
          </View>
          <View style={styles.gridCard}>
            <DownloadIcon />
            <Text style={styles.gridVal}>12</Text>
            <Text style={styles.gridLabel}>Received Today</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search materials"
            placeholderTextColor={PALETTE.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filters */}
        <View style={styles.filtersRow}>
          {['All', 'Available', 'Low Stock', 'Out of Stock'].map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Materials List */}
        <View style={styles.listContainer}>
          {MOCK_MATERIALS.map((item) => {
            const isRed = item.status === 'Low Stock';
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.listCard}
                activeOpacity={0.7}
                onPress={() => onSelectMaterial(item.id)}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardCode}>{item.code}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: isRed ? PALETTE.redBadgeBg : PALETTE.greenBadgeBg }]}>
                    <Text style={[styles.badgeText, { color: isRed ? PALETTE.redBadgeText : PALETTE.greenBadgeText }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardLabel}>Available</Text>
                <Text style={styles.cardVal}>{item.available} Units</Text>
                <Text style={styles.cardDate}>Last Updated · {item.date}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={onAddMaterial}>
          <PlusIcon color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Add Material</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.primary },
  header: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },

  scroll: { flex: 1, backgroundColor: PALETTE.pageBg },
  scrollContent: { padding: 16, paddingBottom: 100 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 16,
  },
  gridCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
  },
  gridVal: { fontSize: 22, fontWeight: '800', color: PALETTE.textInk, marginTop: 12, marginBottom: 4 },
  gridLabel: { fontSize: 11, color: PALETTE.textSecondary, fontWeight: '600' },

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

  filtersRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: PALETTE.cardBg, borderWidth: 1, borderColor: PALETTE.border },
  filterPillActive: { backgroundColor: PALETTE.primary, borderColor: PALETTE.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: PALETTE.textSecondary },
  filterTextActive: { color: '#FFFFFF' },

  listContainer: { gap: 12 },
  listCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.textInk },
  cardCode: { fontSize: 12, color: PALETTE.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardLabel: { fontSize: 12, color: PALETTE.textSecondary, marginBottom: 4 },
  cardVal: { fontSize: 16, fontWeight: '800', color: PALETTE.textInk, marginBottom: 12 },
  cardDate: { fontSize: 11, color: PALETTE.textMuted },

  bottomBar: {
    backgroundColor: PALETTE.cardBg,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: PALETTE.border,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  primaryBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
