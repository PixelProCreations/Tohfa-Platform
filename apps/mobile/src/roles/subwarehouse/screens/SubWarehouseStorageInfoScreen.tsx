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
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { SubWarehouseStorageLocationDetailScreen } from './SubWarehouseStorageLocationDetailScreen';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#7A2E14',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EBE5DC',
  trackBg:       '#EFEAE2',

  greenBadgeBg:  '#DCFCE7',
  greenBadgeText:'#15803D',
  grayBadgeBg:   '#F3F4F6',
  grayBadgeText: '#6B7280',

  blueBoxBg:     '#EFF6FF',
  blueBoxBorder: '#BFDBFE',
  blueBoxText:   '#1E40AF',

  tabInactive:   '#7A726C',
  tabActive:     '#F0562A',
  tabBorder:     '#EBE5DC',
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

function LockIcon({ size = 13, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2.2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = PALETTE.textSecondary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Bottom Tab Nav Icons ───
function HomeTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21v-7h6v7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 13h4l2 3h4l2-3h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 7v5M9 9.5l3 3 3-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="m3.3 7 8.7 5 8.7-5M12 22V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}

// ─── Data Definitions ────────────────────────────────────────────────────────
export interface StorageLocationItem {
  id: string;
  name: string;
  code: string;
  type: string;
  status: 'Active' | 'Inactive';
  capacity: string;
  current: string;
}

const STORAGE_LOCATIONS: StorageLocationItem[] = [
  {
    id: 'cs-a01',
    name: 'Cold Storage A',
    code: 'CS-A01',
    type: 'Cold Storage',
    status: 'Active',
    capacity: '2,000 kg',
    current: '1,650 kg',
  },
  {
    id: 'ds-b01',
    name: 'Dry Storage B',
    code: 'DS-B01',
    type: 'Dry Storage',
    status: 'Active',
    capacity: '3,000 kg',
    current: '2,200 kg',
  },
  {
    id: 'cs-c01',
    name: 'Cold Storage C',
    code: 'CS-C01',
    type: 'Cold Storage',
    status: 'Active',
    capacity: '1,500 kg',
    current: '1,120 kg',
  },
  {
    id: 'bs-d01',
    name: 'Bulk Storage D',
    code: 'BS-D01',
    type: 'Bulk Storage',
    status: 'Active',
    capacity: '2,500 kg',
    current: '1,850 kg',
  },
  {
    id: 'sa-e01',
    name: 'Staging Area E',
    code: 'SA-E01',
    type: 'Staging Area',
    status: 'Inactive',
    capacity: '1,000 kg',
    current: '600 kg',
  },
];

export interface SubWarehouseStorageInfoScreenProps {
  warehouseName?: string | undefined;
  onBack: () => void;
  onTabChange?: ((tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void) | undefined;
  onSelectLocation?: ((id: string) => void) | undefined;
  onViewStock?: (() => void) | undefined;
}

export function SubWarehouseStorageInfoScreen({
  warehouseName = 'Coonoor Warehouse',
  onBack,
  onTabChange,
  onSelectLocation,
  onViewStock,
}: SubWarehouseStorageInfoScreenProps): React.JSX.Element {
  const [internalSelectedLocationId, setInternalSelectedLocationId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = STORAGE_LOCATIONS.filter((loc) => {
    const matchesFilter = filter === 'All' || loc.status === filter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      loc.name.toLowerCase().includes(q) ||
      loc.code.toLowerCase().includes(q) ||
      loc.type.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  if (internalSelectedLocationId) {
    return (
      <SubWarehouseStorageLocationDetailScreen
        locationId={internalSelectedLocationId}
        warehouseName={warehouseName}
        onBack={() => setInternalSelectedLocationId(null)}
        onViewStock={() => {
          setInternalSelectedLocationId(null);
          if (onViewStock) {
            onViewStock();
          } else if (onTabChange) {
            onTabChange('Inventory');
          }
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.75}
            accessibilityLabel="Back"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Storage Information</Text>
        </View>

        {/* Warehouse Pill Chip */}
        <View style={styles.warehousePill}>
          <LockIcon size={13} color="#FFFFFF" />
          <Text style={styles.warehousePillText}>{warehouseName}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Summary KPI Grid (2x2) ─── */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>STORAGE LOCATIONS</Text>
            <Text style={styles.kpiValue}>8</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>ACTIVE LOCATIONS</Text>
            <Text style={styles.kpiValue}>7</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>OCCUPIED</Text>
            <Text style={styles.kpiValue}>6</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>AVAILABLE</Text>
            <Text style={styles.kpiValue}>2</Text>
          </View>
        </View>

        {/* ─── 2. Storage Capacity Section ─── */}
        <Text style={styles.sectionTitle}>Storage Capacity</Text>
        <View style={styles.capacityCard}>
          <View style={styles.capacityHeaderRow}>
            <Text style={styles.capacityHeadingText}>Capacity Used</Text>
            <Text style={styles.capacityPercentText}>74.2%</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: '74.2%' }]} />
          </View>

          {/* Details Grid */}
          <View style={styles.capacityGrid}>
            <View style={styles.capacityGridCol}>
              <Text style={styles.capacitySubLabel}>Total Capacity</Text>
              <Text style={styles.capacityMainVal}>10,000 kg</Text>
            </View>
            <View style={styles.capacityGridCol}>
              <Text style={styles.capacitySubLabel}>Current Occupancy</Text>
              <Text style={styles.capacityMainVal}>7,420 kg</Text>
            </View>
          </View>

          <View style={[styles.capacityGrid, { marginTop: 14 }]}>
            <View style={styles.capacityGridCol}>
              <Text style={styles.capacitySubLabel}>Available Capacity</Text>
              <Text style={styles.capacityMainVal}>2,580 kg</Text>
            </View>
          </View>
        </View>

        {/* Blue Info Notice Box */}
        <View style={styles.blueNoticeBox}>
          <Text style={styles.blueNoticeText}>
            Capacity is displayed, never editable by SWA.
          </Text>
        </View>

        {/* ─── 3. Filter Pills Row ─── */}
        <View style={styles.filterRow}>
          {(['All', 'Active', 'Inactive'] as const).map((item) => {
            const isActive = filter === item;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setFilter(item)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── 4. Search Bar ─── */}
        <View style={styles.searchBox}>
          <SearchIcon size={18} color={PALETTE.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Location name, code, storage type"
            placeholderTextColor={PALETTE.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ─── 5. Storage Location List ─── */}
        <View style={styles.locationList}>
          {filteredLocations.map((loc) => {
            const isActive = loc.status === 'Active';
            return (
              <TouchableOpacity
                key={loc.id}
                style={styles.locationCard}
                onPress={() => {
                  if (onSelectLocation) {
                    onSelectLocation(loc.id);
                  } else {
                    setInternalSelectedLocationId(loc.id);
                  }
                }}
                activeOpacity={0.75}
              >
                <View style={styles.locCardTop}>
                  <Text style={styles.locName}>{loc.name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: isActive ? PALETTE.greenBadgeBg : PALETTE.grayBadgeBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: isActive ? PALETTE.greenBadgeText : PALETTE.grayBadgeText },
                      ]}
                    >
                      {loc.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.locCode}>{loc.code}</Text>

                <View style={styles.locStatsRow}>
                  <View style={styles.locStatCol}>
                    <Text style={styles.locStatLabel}>Capacity</Text>
                    <Text style={styles.locStatVal}>{loc.capacity}</Text>
                  </View>
                  <View style={styles.locStatCol}>
                    <Text style={styles.locStatLabel}>Current</Text>
                    <Text style={styles.locStatVal}>{loc.current}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ─── Bottom Tab Bar ─── */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange?.('Home')}
          accessibilityRole="tab"
          activeOpacity={0.7}
        >
          <HomeTabNavIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange?.('Receiving')}
          accessibilityRole="tab"
          activeOpacity={0.7}
        >
          <ReceivingTabNavIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange?.('Inventory')}
          accessibilityRole="tab"
          activeOpacity={0.7}
        >
          <InventoryTabNavIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange?.('More')}
          accessibilityRole="tab"
          activeOpacity={0.7}
        >
          <MoreTabNavIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginLeft: 44,
    marginTop: 6,
    gap: 6,
  },
  warehousePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },

  /* 2x2 KPI Grid */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  /* Section Title */
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 10,
  },

  /* Capacity Card */
  capacityCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 12,
  },
  capacityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  capacityHeadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  capacityPercentText: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.trackBg,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: PALETTE.primary,
    borderRadius: 4,
  },
  capacityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  capacityGridCol: {
    flex: 1,
  },
  capacitySubLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  capacityMainVal: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  /* Blue Notice Box */
  blueNoticeBox: {
    backgroundColor: PALETTE.blueBoxBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.blueBoxBorder,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  blueNoticeText: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.blueBoxText,
    lineHeight: 16,
  },

  /* Filter Pills */
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  filterPillActive: {
    borderColor: PALETTE.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  filterPillTextActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },

  /* Search Box */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: PALETTE.textInk,
    padding: 0,
  },

  /* Location Cards List */
  locationList: {
    gap: 12,
  },
  locationCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  locCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  locName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  locCode: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginBottom: 12,
  },
  locStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F3EFE9',
  },
  locStatCol: {
    flex: 1,
  },
  locStatLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  locStatVal: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  /* Bottom Tab Bar */
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  tabLabelActive: {
    color: PALETTE.tabActive,
    fontWeight: '700',
  },
});
