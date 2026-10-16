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
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { adminColors, adminOverlay, adminRadius, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';
import { ProduceVerificationApprovalScreen } from './ProduceVerificationApprovalScreen';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function FilterSlidersIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="15" y1="4" x2="15" y2="10" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="4" y1="17" x2="20" y2="17" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="9" y1="14" x2="9" y2="20" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

export interface ProductListingItem {
  id: string;
  cropName: string;
  grade: 'Grade 1' | 'Grade 2';
  quantityKg: number;
  pricePerKg: number;
  submittedTime: string;
  status: 'Pending';
  zone: 'Coonoor' | 'Ooty';
}

export interface FarmerListingGroup {
  farmerId: string;
  farmerName: string;
  avatarInitial: string;
  zone: 'Coonoor' | 'Ooty';
  products: ProductListingItem[];
}

const MOCK_FARMERS_DATA: FarmerListingGroup[] = [
  {
    farmerId: 'FR-00189',
    farmerName: 'Ramesh',
    avatarInitial: 'R',
    zone: 'Coonoor',
    products: [
      {
        id: 'L-101',
        cropName: 'Tomato',
        grade: 'Grade 1',
        quantityKg: 50,
        pricePerKg: 100,
        submittedTime: '08:15 AM',
        status: 'Pending',
        zone: 'Coonoor',
      },
      {
        id: 'L-102',
        cropName: 'Carrot',
        grade: 'Grade 1',
        quantityKg: 30,
        pricePerKg: 80,
        submittedTime: '08:40 AM',
        status: 'Pending',
        zone: 'Coonoor',
      },
      {
        id: 'L-103',
        cropName: 'Beans',
        grade: 'Grade 2',
        quantityKg: 20,
        pricePerKg: 60,
        submittedTime: '09:05 AM',
        status: 'Pending',
        zone: 'Coonoor',
      },
    ],
  },
  {
    farmerId: 'FR-00312',
    farmerName: 'Kumar',
    avatarInitial: 'K',
    zone: 'Ooty',
    products: [
      {
        id: 'L-201',
        cropName: 'Carrot',
        grade: 'Grade 2',
        quantityKg: 80,
        pricePerKg: 70,
        submittedTime: '09:20 AM',
        status: 'Pending',
        zone: 'Ooty',
      },
      {
        id: 'L-202',
        cropName: 'Onion',
        grade: 'Grade 1',
        quantityKg: 60,
        pricePerKg: 50,
        submittedTime: '09:35 AM',
        status: 'Pending',
        zone: 'Ooty',
      },
    ],
  },
  {
    farmerId: 'FR-00405',
    farmerName: 'Suresh Chakravarthi',
    avatarInitial: 'S',
    zone: 'Coonoor',
    products: [
      {
        id: 'L-301',
        cropName: 'Beans',
        grade: 'Grade 1',
        quantityKg: 30,
        pricePerKg: 120,
        submittedTime: '09:50 AM',
        status: 'Pending',
        zone: 'Coonoor',
      },
      {
        id: 'L-302',
        cropName: 'Tomato',
        grade: 'Grade 1',
        quantityKg: 45,
        pricePerKg: 95,
        submittedTime: '10:05 AM',
        status: 'Pending',
        zone: 'Coonoor',
      },
      {
        id: 'L-303',
        cropName: 'Potato',
        grade: 'Grade 2',
        quantityKg: 100,
        pricePerKg: 40,
        submittedTime: '10:20 AM',
        status: 'Pending',
        zone: 'Coonoor',
      },
      {
        id: 'L-304',
        cropName: 'Carrot',
        grade: 'Grade 1',
        quantityKg: 25,
        pricePerKg: 85,
        submittedTime: '10:35 AM',
        status: 'Pending',
        zone: 'Coonoor',
      },
    ],
  },
  {
    farmerId: 'FR-00242',
    farmerName: 'Lakshmi',
    avatarInitial: 'L',
    zone: 'Ooty',
    products: [
      {
        id: 'L-401',
        cropName: 'Beans',
        grade: 'Grade 1',
        quantityKg: 35,
        pricePerKg: 65,
        submittedTime: '10:50 AM',
        status: 'Pending',
        zone: 'Ooty',
      },
      {
        id: 'L-402',
        cropName: 'Onion',
        grade: 'Grade 2',
        quantityKg: 55,
        pricePerKg: 48,
        submittedTime: '11:05 AM',
        status: 'Pending',
        zone: 'Ooty',
      },
    ],
  },
];

export interface FarmerProductListingsScreenProps {
  onBack: () => void;
  onNavigateDetail?: (listingId: string) => void;
}

export function FarmerProductListingsScreen({
  onBack,
  onNavigateDetail,
}: FarmerProductListingsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedZone, setSelectedZone] = useState<'All' | 'Coonoor' | 'Ooty'>('All');
  const [selectedCrop, setSelectedCrop] = useState<'All' | 'Tomato' | 'Carrot' | 'Beans' | 'Onion' | 'Potato'>('All');
  const [selectedGrade, setSelectedGrade] = useState<'All' | 'Grade 1' | 'Grade 2'>('All');
  const [selectedListingForReview, setSelectedListingForReview] = useState<ProductListingItem | null>(null);

  // Filter Farmers and their Product Listings
  const filteredFarmerGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return MOCK_FARMERS_DATA.map((farmer) => {
      const filteredProducts = farmer.products.filter((product) => {
        if (selectedZone !== 'All' && farmer.zone !== selectedZone) return false;
        if (selectedCrop !== 'All' && product.cropName !== selectedCrop) return false;
        if (selectedGrade !== 'All' && product.grade !== selectedGrade) return false;

        if (q) {
          const matchCrop = product.cropName.toLowerCase().includes(q);
          const matchFarmer = farmer.farmerName.toLowerCase().includes(q);
          const matchZone = farmer.zone.toLowerCase().includes(q);
          const matchId = product.id.toLowerCase().includes(q);
          if (!matchCrop && !matchFarmer && !matchZone && !matchId) return false;
        }

        return true;
      });

      return {
        ...farmer,
        products: filteredProducts,
      };
    }).filter((farmer) => farmer.products.length > 0);
  }, [searchQuery, selectedZone, selectedCrop, selectedGrade]);

  const totalFilteredCount = useMemo(() => {
    return filteredFarmerGroups.reduce((acc, curr) => acc + curr.products.length, 0);
  }, [filteredFarmerGroups]);

  const handleClearFilters = () => {
    setSelectedZone('All');
    setSelectedCrop('All');
    setSelectedGrade('All');
    setSearchQuery('');
  };

  if (selectedListingForReview) {
    return (
      <ProduceVerificationApprovalScreen
        onBack={() => setSelectedListingForReview(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('farmerProductListings.title') || 'Farmer Produce Listing'}</Text>

          <TouchableOpacity
            style={[styles.filterBtn, showFilterPanel && styles.filterBtnActive]}
            onPress={() => setShowFilterPanel(!showFilterPanel)}
            activeOpacity={0.8}
            accessibilityLabel="Filter listings"
          >
            <FilterSlidersIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle Counter */}
        <Text style={styles.counterText}>
          {totalFilteredCount} {t('farmerProductListings.subtitle')}
        </Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('farmerProductListings.search.placeholder')}
            placeholderTextColor={adminColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ─── Expandable Filter Panel ─── */}
        {showFilterPanel && (
          <View style={styles.filterCard}>
            <View style={styles.filterTitleRow}>
              <FilterSlidersIcon size={18} color={adminColors.brandDeep} />
              <Text style={styles.filterTitle}>{t('farmerProductListings.filters.title')}</Text>
            </View>

            {/* Filter by Zone */}
            <Text style={styles.filterSectionLabel}>{t('farmerProductListings.filter.zone')}</Text>
            <View style={styles.chipsRow}>
              {(['All', 'Coonoor', 'Ooty'] as const).map((z) => {
                const active = selectedZone === z;
                return (
                  <TouchableOpacity
                    key={z}
                    style={[styles.filterChip, active ? styles.filterChipActive : styles.filterChipInactive]}
                    onPress={() => setSelectedZone(z)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : styles.filterChipTextInactive]}>
                      {z === 'All' ? t('farmerProductListings.filter.all') : z}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Filter by Crop */}
            <Text style={styles.filterSectionLabel}>{t('farmerProductListings.filter.crop')}</Text>
            <View style={styles.chipsRow}>
              {(['All', 'Tomato', 'Carrot', 'Beans', 'Onion', 'Potato'] as const).map((c) => {
                const active = selectedCrop === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.filterChip, active ? styles.filterChipActive : styles.filterChipInactive]}
                    onPress={() => setSelectedCrop(c)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : styles.filterChipTextInactive]}>
                      {c === 'All' ? t('farmerProductListings.filter.all') : c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Filter by Grade */}
            <Text style={styles.filterSectionLabel}>{t('farmerProductListings.filter.grade')}</Text>
            <View style={styles.chipsRow}>
              {(['All', 'Grade 1', 'Grade 2'] as const).map((g) => {
                const active = selectedGrade === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.filterChip, active ? styles.filterChipActive : styles.filterChipInactive]}
                    onPress={() => setSelectedGrade(g)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : styles.filterChipTextInactive]}>
                      {g === 'All' ? t('farmerProductListings.filter.all') : g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Filter Action Buttons */}
            <View style={styles.filterActionsRow}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setShowFilterPanel(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>{t('farmerProductListings.filter.apply')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.clearBtnText}>{t('farmerProductListings.filter.clear')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── Farmer Groups & Product Items List ─── */}
        {filteredFarmerGroups.map((group) => (
          <View key={group.farmerId} style={styles.farmerCard}>
            {/* Farmer Header Info */}
            <View style={styles.farmerHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{group.avatarInitial}</Text>
              </View>
              <View style={styles.farmerInfoCol}>
                <Text style={styles.farmerName}>{group.farmerName}</Text>
                <Text style={styles.farmerSub}>
                  {group.farmerId} · {group.zone}
                </Text>
              </View>
            </View>

            <Text style={styles.listedProductsLabel}>{t('farmerProductListings.label.listedProducts')}</Text>
            <View style={styles.productsDivider} />

            {/* Product Items */}
            {group.products.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.productRow,
                  index < group.products.length - 1 && styles.productRowBorder,
                ]}
                onPress={() => {
                  if (onNavigateDetail) {
                    onNavigateDetail(item.id);
                  } else {
                    setSelectedListingForReview(item);
                  }
                }}
                activeOpacity={0.7}
              >
                {/* Row 1: Crop Name & Status Badge */}
                <View style={styles.productTopLine}>
                  <Text style={styles.cropName}>{item.cropName}</Text>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>{t('farmerProductListings.badge.pending')}</Text>
                  </View>
                </View>

                {/* Row 2: Grade, Quantity & Price */}
                <Text style={styles.productMeta}>
                  {item.grade} · {item.quantityKg} KG · ₹{item.pricePerKg}/KG
                </Text>

                {/* Row 3: Submitted Time */}
                <Text style={styles.submittedMeta}>
                  {t('farmerProductListings.submittedAt', { time: item.submittedTime })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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

  // ─── Header ───
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.xs,
  },
  headerTitle: {
    flex: 1,
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.sm,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: adminOverlay.whitePillActive,
  },

  // ─── Scroll Area ───
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // ─── Subtitle Counter ───
  counterText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    letterSpacing: -0.2,
  },

  // ─── Search Bar ───
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },

  // ─── Filter Panel ───
  filterCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
  },
  filterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  filterTitle: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  filterSectionLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  filterChip: {
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
  },
  filterChipInactive: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterChipText: {
    ...adminType.caption,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  filterChipTextInactive: {
    color: adminColors.ink,
  },
  filterActionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brand,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.muted,
  },

  // ─── Farmer Card ───
  farmerCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  farmerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  farmerInfoCol: {
    flex: 1,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  farmerName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    letterSpacing: -0.2,
  },
  farmerSub: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 1,
  },
  listedProductsLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.brandDeep,
    letterSpacing: 0.5,
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
  },
  productsDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginBottom: adminSpacing.sm,
  },

  // ─── Listed Product Item ───
  productRow: {
    paddingVertical: adminSpacing.sm,
  },
  productRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  productTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  cropName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    letterSpacing: -0.2,
  },
  pendingBadge: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 3.5,
  },
  pendingBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.warning.text,
  },
  productMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 3,
  },
  submittedMeta: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
