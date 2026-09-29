import React, { useState } from 'react';
import {
  Pressable,
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

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#D4451B',
  primaryLight: '#FFF0EB',
  primarySoft: '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EBE5DC',
  divider: '#F4EFE9',

  // Status Colors
  greenBadge: '#DCFCE7',
  greenText: '#15803D',
  greenDot: '#10B981',

  // Progress Bar
  progressTrack: '#F2ECE5',
  progressBar: '#F0562A',

  // Info Banner (Blue)
  infoBg: '#EFF6FF',
  infoBorder: '#BFDBFE',
  infoText: '#1D4ED8',

  // Warning Banner (Red)
  warningBg: '#FEF2F2',
  warningBorder: '#FECACA',
  warningText: '#DC2626',

  tabInactive: '#827A74',
  tabBorder: '#EAE4DB',
};

// ─── Mock Storage Location Items ─────────────────────────────────────────────
interface StorageLocationItem {
  id: string;
  name: string;
  code: string;
  type: string;
  status: 'Active' | 'Inactive';
  capacityKg: number;
  currentKg: number;
}

const MOCK_STORAGE_LOCATIONS: StorageLocationItem[] = [
  {
    id: '1',
    name: 'Cold Storage A',
    code: 'CS-A01',
    type: 'Cold Storage (2°C - 6°C)',
    status: 'Active',
    capacityKg: 2000,
    currentKg: 1650,
  },
  {
    id: '2',
    name: 'Dry Storage B',
    code: 'DS-B01',
    type: 'Ambient Dry (18°C - 24°C)',
    status: 'Active',
    capacityKg: 1500,
    currentKg: 920,
  },
  {
    id: '3',
    name: 'Cold Storage B',
    code: 'CS-B02',
    type: 'Cold Storage (2°C - 6°C)',
    status: 'Active',
    capacityKg: 2000,
    currentKg: 1480,
  },
  {
    id: '4',
    name: 'Ambient Staging C',
    code: 'AM-C01',
    type: 'Produce Sorting Area',
    status: 'Active',
    capacityKg: 1800,
    currentKg: 1250,
  },
  {
    id: '5',
    name: 'Incoming QC Zone Q1',
    code: 'QC-Q01',
    type: 'Quality Inspection Holding',
    status: 'Active',
    capacityKg: 1000,
    currentKg: 620,
  },
  {
    id: '6',
    name: 'Crate Buffer Bay D',
    code: 'CB-D01',
    type: 'Returnable Plastic Crates',
    status: 'Active',
    capacityKg: 1200,
    currentKg: 900,
  },
  {
    id: '7',
    name: 'Reserve Rack R1',
    code: 'RR-R01',
    type: 'Emergency Buffer Storage',
    status: 'Active',
    capacityKg: 500,
    currentKg: 600,
  },
  {
    id: '8',
    name: 'Deep Chill Vault (Maintenance)',
    code: 'DC-V01',
    type: 'Deep Freeze (-5°C)',
    status: 'Inactive',
    capacityKg: 0,
    currentKg: 0,
  },
];

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

function LockIcon({ size = 12, color = PALETTE.textSecondary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
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

function SlashCircleIcon({ size = 18, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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

export interface SubWarehouseStorageInfoScreenProps {
  onBack: () => void;
  onTabChange?: ((tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void) | undefined;
}

type FilterType = 'All' | 'Active' | 'Inactive';

export function SubWarehouseStorageInfoScreen({
  onBack,
  onTabChange,
}: SubWarehouseStorageInfoScreenProps) {
  const [filter, setFilter] = useState<FilterType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = MOCK_STORAGE_LOCATIONS.filter((item) => {
    if (filter === 'Active' && item.status !== 'Active') return false;
    if (filter === 'Inactive' && item.status !== 'Inactive') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        decelerationRate={0.985}
        bounces={true}
      >
        {/* ─── Top Brand Header (#F0562A) ─── */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.75}
            >
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Storage Information</Text>
          </View>
        </View>

        {/* ─── Sub-Header Locked Warehouse Row ─── */}
        <View style={styles.subHeaderLockedRow}>
          <LockIcon size={13} color={PALETTE.textSecondary} />
          <Text style={styles.lockedWarehouseText}>Coonoor Warehouse</Text>
        </View>

        {/* ─── Main Content Container ─── */}
        <View style={styles.mainContainer}>
          {/* 1. 2x2 Metric Cards Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>STORAGE LOCATIONS</Text>
              <Text style={styles.metricValue}>8</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>ACTIVE LOCATIONS</Text>
              <Text style={styles.metricValue}>7</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>OCCUPIED</Text>
              <Text style={styles.metricValue}>6</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>AVAILABLE</Text>
              <Text style={styles.metricValue}>2</Text>
            </View>
          </View>

          {/* 2. Storage Capacity Section */}
          <Text style={styles.sectionHeading}>Storage Capacity</Text>
          <View style={styles.card}>
            <View style={styles.capacityHeaderRow}>
              <Text style={styles.capacityHeaderLabel}>Capacity Used</Text>
              <Text style={styles.capacityHeaderPercent}>74.2%</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '74.2%' }]} />
            </View>

            <View style={styles.capacityDetailsRow}>
              <View style={styles.capacityCol}>
                <Text style={styles.capacityDetailLabel}>Total Capacity</Text>
                <Text style={styles.capacityDetailValue}>10,000 kg</Text>
              </View>

              <View style={styles.capacityCol}>
                <Text style={styles.capacityDetailLabel}>Current Occupancy</Text>
                <Text style={styles.capacityDetailValue}>7,420 kg</Text>
              </View>
            </View>

            <View style={[styles.capacityDetailsRow, { marginTop: 10 }]}>
              <View style={styles.capacityCol}>
                <Text style={styles.capacityDetailLabel}>Available Capacity</Text>
                <Text style={styles.capacityDetailValue}>2,580 kg</Text>
              </View>
            </View>
          </View>

          {/* 3. Blue Info Notice Box */}
          <View style={styles.blueNoticeBox}>
            <Text style={styles.blueNoticeText}>
              Capacity is displayed, never editable by SWA.
            </Text>
          </View>

          {/* 4. Filter Pills Row */}
          <View style={styles.filtersRow}>
            {(['All', 'Active', 'Inactive'] as FilterType[]).map((tab) => {
              const isActive = filter === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => setFilter(tab)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 5. Search Bar Input */}
          <View style={styles.searchBarContainer}>
            <SearchIcon size={18} color={PALETTE.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Location name, code, storage type"
              placeholderTextColor={PALETTE.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* 6. Storage Location Cards List */}
          <View style={styles.locationsList}>
            {filteredLocations.map((item) => (
              <View key={item.id} style={styles.locationCard}>
                <View style={styles.locationCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationCardTitle}>{item.name}</Text>
                    <Text style={styles.locationCardCode}>{item.code}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'Active' ? styles.statusBadgeActive : styles.statusBadgeInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        item.status === 'Active' ? styles.statusBadgeTextActive : styles.statusBadgeTextInactive,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.locationCardDataRow}>
                  <View style={styles.locationDataCol}>
                    <Text style={styles.locationDataLabel}>Capacity</Text>
                    <Text style={styles.locationDataValue}>
                      {item.capacityKg.toLocaleString()} kg
                    </Text>
                  </View>

                  <View style={styles.locationDataColRight}>
                    <Text style={styles.locationDataLabel}>Current</Text>
                    <Text style={styles.locationDataValue}>
                      {item.currentKg.toLocaleString()} kg
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* 7. Red Warning Alert Box */}
          <View style={styles.redWarningBox}>
            <SlashCircleIcon size={18} color={PALETTE.warningText} />
            <Text style={styles.redWarningText}>
              No Edit Capacity, Add Storage Location, or Delete Location — this screen is view-oriented for SWA.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomTabBar}>
        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Home');
            else onBack();
          }}
          accessibilityRole="tab"
        >
          <HomeTabIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Receiving');
          }}
          accessibilityRole="tab"
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('Inventory');
          }}
          accessibilityRole="tab"
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </Pressable>

        <Pressable
          style={styles.tabItem}
          onPress={() => {
            if (onTabChange) onTabChange('More');
          }}
          accessibilityRole="tab"
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // ─── Header Banner ─────────────────────────────────────────────────────────
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // ─── Sub-Header Locked Warehouse ───────────────────────────────────────────
  subHeaderLockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  lockedWarehouseText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },

  // ─── Main Container ────────────────────────────────────────────────────────
  mainContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  // ─── 2x2 Metrics Grid ──────────────────────────────────────────────────────
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  // ─── Section Headings ──────────────────────────────────────────────────────
  sectionHeading: {
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 4,
    marginBottom: 10,
    letterSpacing: -0.2,
  },

  // ─── Standard Card & Capacity ──────────────────────────────────────────────
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  capacityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  capacityHeaderLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  capacityHeaderPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: PALETTE.progressTrack,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: PALETTE.progressBar,
  },
  capacityDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  capacityCol: {
    flex: 1,
  },
  capacityDetailLabel: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    marginBottom: 3,
    fontWeight: '500',
  },
  capacityDetailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  // ─── Blue Info Box ─────────────────────────────────────────────────────────
  blueNoticeBox: {
    backgroundColor: PALETTE.infoBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.infoBorder,
    padding: 12,
    marginBottom: 14,
  },
  blueNoticeText: {
    fontSize: 12,
    lineHeight: 16,
    color: PALETTE.infoText,
    fontWeight: '600',
  },

  // ─── Filter Pills ──────────────────────────────────────────────────────────
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  filterPillActive: {
    backgroundColor: PALETTE.primarySoft,
    borderColor: PALETTE.primary,
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  filterPillTextActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },

  // ─── Search Bar ────────────────────────────────────────────────────────────
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: PALETTE.textInk,
    padding: 0,
  },

  // ─── Location Cards List ───────────────────────────────────────────────────
  locationsList: {
    gap: 10,
    marginBottom: 14,
  },
  locationCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  locationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  locationCardCode: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusBadgeActive: {
    backgroundColor: PALETTE.greenBadge,
  },
  statusBadgeInactive: {
    backgroundColor: PALETTE.border,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: PALETTE.greenText,
  },
  statusBadgeTextInactive: {
    color: PALETTE.textMuted,
  },
  locationCardDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationDataCol: {
    flex: 1,
  },
  locationDataColRight: {
    alignItems: 'flex-end',
  },
  locationDataLabel: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    marginBottom: 3,
    fontWeight: '500',
  },
  locationDataValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  // ─── Red Warning Box ───────────────────────────────────────────────────────
  redWarningBox: {
    backgroundColor: PALETTE.warningBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.warningBorder,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  redWarningText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: PALETTE.warningText,
    fontWeight: '500',
  },

  // ─── Bottom Tab Bar ────────────────────────────────────────────────────────
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 2.5,
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
});
