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
import { adminColors, adminOverlay, adminRadius, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';
import { SearchFarmersScreen } from './SearchFarmersScreen';
import { FarmerProfileDetailScreen, type FarmerProfileData } from './FarmerProfileDetailScreen';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function CommunityHeaderIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="8" r="3.2" fill={color} />
      <Path d="M2 18c0-3.3 2.7-6 6-6s6 2.7 6 6" fill={color} />
      <Circle cx="16" cy="9" r="2.6" fill={color} />
      <Path d="M12.5 18c.5-2.2 2.3-4 4.5-4 2.8 0 5 2.2 5 4" fill={color} />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 6h16M4 12h16M4 18h16" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Circle cx="8" cy="6" r="2.5" fill={color} />
      <Circle cx="16" cy="12" r="2.5" fill={color} />
      <Circle cx="10" cy="18" r="2.5" fill={color} />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FarmerCardAvatarIcon({ size = 24, color = adminColors.brandDeep }: { size?: number; color?: string }) {
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

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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
  onSelectFarmer?: ((farmer: FarmerProfileData) => void) | undefined;
  onBack?: (() => void) | undefined;
  onNavigateAuditHistory?: (() => void) | undefined;
}

export function FarmersDirectoryScreen({ onSelectFarmer, onBack, onNavigateAuditHistory }: FarmersDirectoryScreenProps) {
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
      const text = `${f.name} ${f.farmerId} ${f.zone}`.toLowerCase();
      const q = (searchQuery || activeFilters.keyword).toLowerCase().trim();
      if (q && !text.includes(q)) return false;

      if (activeFilters.zone !== 'All' && f.zone.toLowerCase() !== activeFilters.zone.toLowerCase()) {
        return false;
      }
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
        onNavigateAuditHistory={onNavigateAuditHistory}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
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
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
            )}
            <CommunityHeaderIcon size={22} color={adminColors.onBrand} />
            <Text style={styles.headerTitle}>{t('farmersDirectory.title')}</Text>
          </View>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setInternalView('search_filter')}
            activeOpacity={0.8}
            accessibilityLabel="Filter Farmers"
          >
            <FilterSlidersIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.headerSubtitle, { paddingLeft: onBack ? adminSpacing.xl : 0 }]}>
          {t('farmersDirectory.subtitle')}
        </Text>
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
            <Text style={styles.kpiLabel}>{t('farmersDirectory.kpi.allFarmers')}</Text>
            <Text style={styles.kpiValueDark}>245</Text>
          </View>

          {/* Tile 2: Active */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('farmersDirectory.kpi.active')}</Text>
            <Text style={styles.kpiValueGreen}>221</Text>
          </View>

          {/* Tile 3: Pending/Attention */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('farmersDirectory.kpi.pending')}</Text>
            <Text style={styles.kpiValueAmber}>12</Text>
          </View>

          {/* Tile 4: Inactive */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>{t('farmersDirectory.kpi.inactive')}</Text>
            <Text style={styles.kpiValueDark}>12</Text>
          </View>
        </View>

        {/* ─── Search Bar ─── */}
        <TouchableOpacity
          style={styles.searchBarBox}
          onPress={() => setInternalView('search_filter')}
          activeOpacity={0.9}
        >
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('farmersDirectory.search.placeholder')}
            placeholderTextColor={adminColors.muted}
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
                <FarmerCardAvatarIcon size={22} color={adminColors.brandDeep} />
              </View>
              <View style={styles.farmerCardInfo}>
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
                <Text style={styles.statLabel}>{t('farmersDirectory.label.farming')}</Text>
                <Text style={styles.statVal}>{farmer.farmingMethod}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>{t('farmersDirectory.label.rating')}</Text>
                <Text style={styles.statVal}>{farmer.rating}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>{t('farmersDirectory.label.status')}</Text>
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

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtn: {
    paddingRight: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.brandTint,
    marginTop: adminSpacing.xs,
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.md,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },

  // 2x2 KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  kpiCard: {
    width: '48.3%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  kpiLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
    letterSpacing: 0.2,
  },
  kpiValueDark: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  kpiValueGreen: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
  },
  kpiValueAmber: {
    ...adminType.rowTitle,
    color: adminColors.warning.text,
  },

  // Search Bar
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },

  // Farmer Cards
  farmerCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  farmerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerCardInfo: {
    flex: 1,
    paddingLeft: adminSpacing.md,
  },
  farmerName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  farmerMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 3,
  },
  statVal: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  statusActive: {
    color: adminColors.success.text,
  },
  statusPending: {
    color: adminColors.warning.text,
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
