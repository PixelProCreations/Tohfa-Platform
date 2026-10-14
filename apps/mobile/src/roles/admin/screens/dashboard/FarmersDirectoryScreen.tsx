import React, { useMemo, useState } from 'react';
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
import Svg, { Circle, Path } from 'react-native-svg';
import { adminColors } from '../../theme';
import { SearchFarmersScreen } from './SearchFarmersScreen';
import { FarmerProfileDetailScreen, type FarmerProfileData } from './FarmerProfileDetailScreen';

// ─── Theme Colors ────────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand, // Matches Purchases screen & theme primary (#F0562A)
  white: adminColors.onBrand,
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,
  ink: adminColors.ink,
  muted: adminColors.muted,
  labelMuted: '#6B7280',
  brandOrange: adminColors.brand,
  titleRustDark: adminColors.brandDeep,
  greenText: adminColors.success.text,
  amberText: adminColors.warning.text,
  avatarBg: '#FFF3EC',
  avatarIcon: '#A63D18',
  filterBtnBg: 'rgba(255, 255, 255, 0.22)',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function CommunityHeaderIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="8" r="3.2" fill={color} />
      <Path d="M2 18c0-3.3 2.7-6 6-6s6 2.7 6 6" fill={color} />
      <Circle cx="16" cy="9" r="2.6" fill={color} />
      <Path d="M12.5 18c.5-2.2 2.3-4 4.5-4 2.8 0 5 2.2 5 4" fill={color} />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 20, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M4 12h16M4 18h16" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Circle cx="8" cy="6" r="2.5" fill={color} />
      <Circle cx="16" cy="12" r="2.5" fill={color} />
      <Circle cx="10" cy="18" r="2.5" fill={color} />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FarmerCardAvatarIcon({ size = 24, color = THEME.avatarIcon }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.6" stroke={color} strokeWidth="1.8" />
      <Path
        d="M5.5 19.5c0-3.5 2.9-6.5 6.5-6.5s6.5 3 6.5 6.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
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

export interface FarmersDirectoryScreenProps {
  onSelectFarmer?: (farmer: FarmerProfileData) => void;
  onBack?: () => void;
}

export function FarmersDirectoryScreen({ onSelectFarmer, onBack }: FarmersDirectoryScreenProps) {
  const [internalView, setInternalView] = useState<'list' | 'search_filter' | 'profile'>('list');
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfileData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<{
    zone: string;
    method: string;
    certification: string;
    rating: string;
    status: string;
    keyword: string;
  }>({
    zone: 'All',
    method: 'All',
    certification: 'All',
    rating: 'All',
    status: 'All',
    keyword: '',
  });

  const allFarmers: FarmerProfileData[] = [
    {
      farmerId: 'FR-00124',
      name: 'Ramesh Kumar',
      zone: 'Coonoor',
      farmingMethod: 'Organic',
      accountStatus: 'Active',
      certification: 'Certified',
      farmCount: 1,
      listingCount: 18,
      rating: '4.6 ★',
      auditStatus: 'Upcoming',
    },
    {
      farmerId: 'FR-00131',
      name: 'Selvi',
      zone: 'Coonoor',
      farmingMethod: 'Organic',
      accountStatus: 'Active',
      certification: 'Certified',
      farmCount: 1,
      listingCount: 12,
      rating: '4.3 ★',
      auditStatus: 'Completed',
    },
    {
      farmerId: 'FR-00118',
      name: 'Kumar',
      zone: 'Ooty',
      farmingMethod: 'Organic',
      accountStatus: 'Pending',
      certification: 'Certified',
      farmCount: 1,
      listingCount: 8,
      rating: '4.1 ★',
      auditStatus: 'Pending',
    },
    {
      farmerId: 'FR-00142',
      name: 'Vijay Anand',
      zone: 'Kotagiri',
      farmingMethod: 'Organic',
      accountStatus: 'Active',
      certification: 'Certified',
      farmCount: 2,
      listingCount: 15,
      rating: '4.8 ★',
      auditStatus: 'Upcoming',
    },
    {
      farmerId: 'FR-00155',
      name: 'Anand P.',
      zone: 'Gudalur',
      farmingMethod: 'Organic',
      accountStatus: 'Inactive',
      certification: 'Certified',
      farmCount: 1,
      listingCount: 5,
      rating: '4.0 ★',
      auditStatus: 'Completed',
    },
  ];

  // Filtering logic
  const filteredFarmers = useMemo(() => {
    return allFarmers.filter((f) => {
      // Keyword
      const text = `${f.name} ${f.farmerId} ${f.zone}`.toLowerCase();
      const q = (searchQuery || activeFilters.keyword).toLowerCase().trim();
      if (q && !text.includes(q)) return false;

      // Zone filter
      if (activeFilters.zone !== 'All' && f.zone.toLowerCase() !== activeFilters.zone.toLowerCase()) {
        return false;
      }
      // Status filter
      if (activeFilters.status !== 'All' && f.accountStatus.toLowerCase() !== activeFilters.status.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [allFarmers, searchQuery, activeFilters]);

  // Sub-screens
  if (internalView === 'search_filter') {
    return (
      <SearchFarmersScreen
        onBack={() => setInternalView('list')}
        onApplyFilters={(filters) => {
          setActiveFilters(filters);
          if (filters.keyword) setSearchQuery(filters.keyword);
          setInternalView('list');
        }}
      />
    );
  }

  if (internalView === 'profile' && selectedFarmer) {
    return (
      <FarmerProfileDetailScreen
        farmer={selectedFarmer}
        onBack={() => setInternalView('list')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Exact Match to Screenshot with Back Button ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleWrap}>
            {onBack && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onBack}
                activeOpacity={0.7}
                accessibilityLabel="Go back"
              >
                <BackArrowIcon size={22} color={THEME.white} />
              </TouchableOpacity>
            )}
            <CommunityHeaderIcon size={22} color={THEME.white} />
            <Text style={styles.headerTitle}>Farmers</Text>
          </View>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setInternalView('search_filter')}
            activeOpacity={0.8}
            accessibilityLabel="Filter Farmers"
          >
            <FilterSlidersIcon size={20} color={THEME.white} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.headerSubtitle, { paddingLeft: onBack ? 34 : 0 }]}>Farmer Community</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 4 Summary KPI Cards (2x2 Grid) ─── */}
        <View style={styles.kpiGrid}>
          {/* Tile 1: All Farmers */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>ALL FARMERS</Text>
            <Text style={styles.kpiValueDark}>245</Text>
          </View>

          {/* Tile 2: Active */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>ACTIVE</Text>
            <Text style={styles.kpiValueGreen}>221</Text>
          </View>

          {/* Tile 3: Pending/Attention */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>PENDING/ATTENTION</Text>
            <Text style={styles.kpiValueAmber}>12</Text>
          </View>

          {/* Tile 4: Inactive */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>INACTIVE</Text>
            <Text style={styles.kpiValueDark}>12</Text>
          </View>
        </View>

        {/* ─── Search Bar (Tappable & Typeable) ─── */}
        <TouchableOpacity
          style={styles.searchBarBox}
          onPress={() => setInternalView('search_filter')}
          activeOpacity={0.9}
        >
          <SearchIcon size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Farmer ID, name or zone"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </TouchableOpacity>

        {/* ─── Farmer Cards List ─── */}
        {filteredFarmers.map((farmer) => (
          <TouchableOpacity
            key={farmer.farmerId}
            style={styles.farmerCard}
            onPress={() => {
              setSelectedFarmer(farmer);
              onSelectFarmer?.(farmer);
              setInternalView('profile');
            }}
            activeOpacity={0.75}
          >
            {/* Top row: Avatar + Name + Subtitle */}
            <View style={styles.farmerCardHeader}>
              <View style={styles.avatarCircle}>
                <FarmerCardAvatarIcon size={22} color={THEME.avatarIcon} />
              </View>
              <View style={{ flex: 1, paddingLeft: 12 }}>
                <Text style={styles.farmerName}>{farmer.name}</Text>
                <Text style={styles.farmerMeta}>
                  {farmer.farmerId} · {farmer.zone}
                </Text>
              </View>
            </View>

            {/* Divider Line */}
            <View style={styles.cardDivider} />

            {/* Bottom 3-Column Attributes */}
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Farming</Text>
                <Text style={styles.statVal}>{farmer.farmingMethod}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Rating</Text>
                <Text style={styles.statVal}>{farmer.rating}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Status</Text>
                <Text
                  style={[
                    styles.statVal,
                    farmer.accountStatus === 'Active'
                      ? styles.statusActive
                      : styles.statusPending,
                  ]}
                >
                  {farmer.accountStatus}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet Matching Screenshot 1 Exact UI ───────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },
  header: {
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    paddingRight: 4,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: THEME.filterBtnBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },

  // 2x2 KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48.3%',
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.labelMuted,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  kpiValueDark: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.ink,
  },
  kpiValueGreen: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.greenText,
  },
  kpiValueAmber: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.amberText,
  },

  // Search Bar
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: THEME.ink,
    paddingVertical: 0,
  },

  // Farmer Cards
  farmerCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
  },
  farmerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: THEME.ink,
  },
  farmerMeta: {
    fontSize: 12.5,
    color: THEME.muted,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3ECE4',
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11.5,
    color: THEME.labelMuted,
    marginBottom: 3,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.ink,
  },
  statusActive: {
    color: THEME.greenText,
  },
  statusPending: {
    color: THEME.amberText,
  },
});
