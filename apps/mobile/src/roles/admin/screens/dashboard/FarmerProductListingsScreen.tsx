import React, { useMemo, useState } from 'react';
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
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { adminColors } from '../../theme';
import { ProduceVerificationApprovalScreen } from './ProduceVerificationApprovalScreen';

// ─── Theme Tokens (Derived from Admin Theme & Tokens) ────────────────────────
const THEME = {
  headerBg: adminColors.brand, // Matches Purchases screen & theme primary (#F0562A)
  headerPillBg: 'rgba(255, 255, 255, 0.22)',
  white: '#FFFFFF',

  // Canvas & Surfaces
  canvas: adminColors.canvas, // #F3EFE9 — App canvas soft cream
  card: adminColors.card, // #FFFFFF — Card surface
  border: adminColors.border, // #EEDCD3 — Border stroke
  borderLight: '#F3ECE4',

  // Typography
  titleRust: '#A63D18', // Section heading rust
  titleRustDark: '#7A2E14',
  ink: '#1F2937', // Dark ink for names & titles
  muted: '#6B7280', // Secondary gray for metadata
  labelBrown: '#8C5A47', // "LISTED PRODUCTS" uppercase label

  // Search input
  inputBg: '#FFFFFF',
  inputBorder: '#E5E7EB',
  placeholderColor: '#9CA3AF',

  // Filter Chips
  filterActiveBg: adminColors.brand,
  filterActiveText: '#FFFFFF',
  filterInactiveBg: '#FFFFFF',
  filterInactiveBorder: '#E5E7EB',
  filterInactiveText: '#374151',

  // Status Pending Badge
  pendingBadgeBg: '#FEF3C2', // Soft warm yellow
  pendingBadgeText: '#B45309', // Amber text
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

/** Exact Slider / Filter icon from top right header and filter panel */
function FilterSlidersIcon({ size = 20, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="15" y1="4" x2="15" y2="10" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="4" y1="17" x2="20" y2="17" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="9" y1="14" x2="9" y2="20" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = THEME.placeholderColor }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Mock Data: 8 Farmers & 24 Pending Listings (Exact from Mockup) ──────────

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
      {
        id: 'L-403',
        cropName: 'Tomato',
        grade: 'Grade 1',
        quantityKg: 40,
        pricePerKg: 98,
        submittedTime: '11:20 AM',
        status: 'Pending',
        zone: 'Ooty',
      },
    ],
  },
  {
    farmerId: 'FR-00521',
    farmerName: 'Venkatesan',
    avatarInitial: 'V',
    zone: 'Coonoor',
    products: [
      {
        id: 'L-501',
        cropName: 'Potato',
        grade: 'Grade 1',
        quantityKg: 70,
        pricePerKg: 42,
        submittedTime: '11:35 AM',
        status: 'Pending',
        zone: 'Coonoor',
      },
      {
        id: 'L-502',
        cropName: 'Carrot',
        grade: 'Grade 1',
        quantityKg: 28,
        pricePerKg: 82,
        submittedTime: '11:50 AM',
        status: 'Pending',
        zone: 'Coonoor',
      },
      {
        id: 'L-503',
        cropName: 'Beans',
        grade: 'Grade 2',
        quantityKg: 18,
        pricePerKg: 58,
        submittedTime: '12:05 PM',
        status: 'Pending',
        zone: 'Coonoor',
      },
    ],
  },
  {
    farmerId: 'FR-00618',
    farmerName: 'Murugan',
    avatarInitial: 'M',
    zone: 'Ooty',
    products: [
      {
        id: 'L-601',
        cropName: 'Carrot',
        grade: 'Grade 1',
        quantityKg: 33,
        pricePerKg: 78,
        submittedTime: '12:50 PM',
        status: 'Pending',
        zone: 'Ooty',
      },
      {
        id: 'L-602',
        cropName: 'Beans',
        grade: 'Grade 1',
        quantityKg: 22,
        pricePerKg: 63,
        submittedTime: '1:05 PM',
        status: 'Pending',
        zone: 'Ooty',
      },
      {
        id: 'L-603',
        cropName: 'Potato',
        grade: 'Grade 2',
        quantityKg: 90,
        pricePerKg: 38,
        submittedTime: '1:20 PM',
        status: 'Pending',
        zone: 'Ooty',
      },
      {
        id: 'L-604',
        cropName: 'Tomato',
        grade: 'Grade 1',
        quantityKg: 38,
        pricePerKg: 100,
        submittedTime: '1:35 PM',
        status: 'Pending',
        zone: 'Ooty',
      },
    ],
  },
  {
    farmerId: 'FR-00729',
    farmerName: 'Devi',
    avatarInitial: 'D',
    zone: 'Coonoor',
    products: [
      {
        id: 'L-701',
        cropName: 'Onion',
        grade: 'Grade 1',
        quantityKg: 45,
        pricePerKg: 55,
        submittedTime: '1:50 PM',
        status: 'Pending',
        zone: 'Coonoor',
      },
      {
        id: 'L-702',
        cropName: 'Carrot',
        grade: 'Grade 2',
        quantityKg: 27,
        pricePerKg: 72,
        submittedTime: '2:05 PM',
        status: 'Pending',
        zone: 'Coonoor',
      },
      {
        id: 'L-703',
        cropName: 'Beans',
        grade: 'Grade 1',
        quantityKg: 19,
        pricePerKg: 68,
        submittedTime: '2:20 PM',
        status: 'Pending',
        zone: 'Coonoor',
      },
    ],
  },
  {
    farmerId: 'FR-00810',
    farmerName: 'Selvi',
    avatarInitial: 'S',
    zone: 'Ooty',
    products: [
      {
        id: 'L-801',
        cropName: 'Tomato',
        grade: 'Grade 1',
        quantityKg: 30,
        pricePerKg: 92,
        submittedTime: '2:35 PM',
        status: 'Pending',
        zone: 'Ooty',
      },
    ],
  },
];

export interface FarmerProductListingsScreenProps {
  onBack: () => void;
  onSelectListing?: (item: ProductListingItem) => void;
}

export function FarmerProductListingsScreen({
  onBack,
  onSelectListing,
}: FarmerProductListingsScreenProps) {
  // Drill-down State: Produce Verification & Approval (S-03)
  const [selectedListing, setSelectedListing] = useState<{
    item: ProductListingItem;
    farmer: FarmerListingGroup;
  } | null>(null);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Drawer / Panel Visibility (Screenshot 3)
  const [showFilters, setShowFilters] = useState(false);

  // Active Filter selections
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending Review'>('All');
  const [gradeFilter, setGradeFilter] = useState<'All' | 'Grade 1' | 'Grade 2'>('All');
  const [zoneFilter, setZoneFilter] = useState<'All' | 'Coonoor' | 'Ooty'>('All');

  // Filtered Farmers List (Declared unconditionally at top of component)
  const filteredFarmers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return MOCK_FARMERS_DATA.map((group) => {
      // Zone filter check
      if (zoneFilter !== 'All' && group.zone !== zoneFilter) {
        return null;
      }

      // Filter products inside this farmer group
      const matchingProducts = group.products.filter((p) => {
        // Grade filter check
        if (gradeFilter !== 'All' && p.grade !== gradeFilter) {
          return false;
        }

        // Search text check
        if (q) {
          const matchCrop = p.cropName.toLowerCase().includes(q);
          const matchFarmer = group.farmerName.toLowerCase().includes(q);
          const matchId = p.id.toLowerCase().includes(q);
          const matchFarmerId = group.farmerId.toLowerCase().includes(q);
          return matchCrop || matchFarmer || matchId || matchFarmerId;
        }

        return true;
      });

      if (matchingProducts.length === 0) return null;

      return {
        ...group,
        products: matchingProducts,
      };
    }).filter(Boolean) as FarmerListingGroup[];
  }, [searchQuery, gradeFilter, zoneFilter]);

  const totalFilteredListings = useMemo(() => {
    return filteredFarmers.reduce((sum, f) => sum + f.products.length, 0);
  }, [filteredFarmers]);

  // If a listing item is tapped, navigate into Produce Verification & Approval (AFTER all hooks)
  if (selectedListing) {
    return (
      <ProduceVerificationApprovalScreen
        listingId="PL-001245"
        cropName={selectedListing.item.cropName}
        farmerName={
          selectedListing.farmer.farmerName === 'Ramesh'
            ? 'Ramesh Kumar'
            : selectedListing.farmer.farmerName
        }
        onBack={() => setSelectedListing(null)}
        onViewListing={() => setSelectedListing(null)}
        onSubmitSuccess={() => {
          setSelectedListing(null);
          onBack();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Terracotta Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Farmer Product Listings</Text>

          <TouchableOpacity
            style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.8}
            accessibilityLabel="Toggle Filters"
          >
            <FilterSlidersIcon size={20} color={THEME.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtitle counter */}
        <Text style={styles.counterText}>
          {totalFilteredListings} pending · {filteredFarmers.length} farmers
        </Text>

        {/* Search Bar (Listing ID, Farmer, Product, Crop) */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={THEME.placeholderColor} />
          <TextInput
            style={styles.searchInput}
            placeholder="Listing ID, Farmer, Product, Crop"
            placeholderTextColor={THEME.placeholderColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* ─── Filter Panel (Matching Screenshot 3) ─── */}
        {showFilters && (
          <View style={styles.filterCard}>
            <View style={styles.filterTitleRow}>
              <FilterSlidersIcon size={18} color={THEME.titleRustDark} />
              <Text style={styles.filterTitle}>Filters</Text>
            </View>

            {/* Status Filter */}
            <Text style={styles.filterSectionLabel}>Status</Text>
            <View style={styles.chipsRow}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  statusFilter === 'All' ? styles.filterChipActive : styles.filterChipInactive,
                ]}
                onPress={() => setStatusFilter('All')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === 'All'
                      ? styles.filterChipTextActive
                      : styles.filterChipTextInactive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  statusFilter === 'Pending Review'
                    ? styles.filterChipActive
                    : styles.filterChipInactive,
                ]}
                onPress={() => setStatusFilter('Pending Review')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    statusFilter === 'Pending Review'
                      ? styles.filterChipTextActive
                      : styles.filterChipTextInactive,
                  ]}
                >
                  Pending Review
                </Text>
              </TouchableOpacity>
            </View>

            {/* Grade Filter */}
            <Text style={styles.filterSectionLabel}>Grade</Text>
            <View style={styles.chipsRow}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  gradeFilter === 'All' ? styles.filterChipActive : styles.filterChipInactive,
                ]}
                onPress={() => setGradeFilter('All')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    gradeFilter === 'All'
                      ? styles.filterChipTextActive
                      : styles.filterChipTextInactive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  gradeFilter === 'Grade 1' ? styles.filterChipActive : styles.filterChipInactive,
                ]}
                onPress={() => setGradeFilter('Grade 1')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    gradeFilter === 'Grade 1'
                      ? styles.filterChipTextActive
                      : styles.filterChipTextInactive,
                  ]}
                >
                  Grade 1
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  gradeFilter === 'Grade 2' ? styles.filterChipActive : styles.filterChipInactive,
                ]}
                onPress={() => setGradeFilter('Grade 2')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    gradeFilter === 'Grade 2'
                      ? styles.filterChipTextActive
                      : styles.filterChipTextInactive,
                  ]}
                >
                  Grade 2
                </Text>
              </TouchableOpacity>
            </View>

            {/* Zone Filter */}
            <Text style={styles.filterSectionLabel}>Zone</Text>
            <View style={styles.chipsRow}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  zoneFilter === 'All' ? styles.filterChipActive : styles.filterChipInactive,
                ]}
                onPress={() => setZoneFilter('All')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    zoneFilter === 'All'
                      ? styles.filterChipTextActive
                      : styles.filterChipTextInactive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  zoneFilter === 'Coonoor' ? styles.filterChipActive : styles.filterChipInactive,
                ]}
                onPress={() => setZoneFilter('Coonoor')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    zoneFilter === 'Coonoor'
                      ? styles.filterChipTextActive
                      : styles.filterChipTextInactive,
                  ]}
                >
                  Coonoor
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  zoneFilter === 'Ooty' ? styles.filterChipActive : styles.filterChipInactive,
                ]}
                onPress={() => setZoneFilter('Ooty')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    zoneFilter === 'Ooty'
                      ? styles.filterChipTextActive
                      : styles.filterChipTextInactive,
                  ]}
                >
                  Ooty
                </Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons: Apply & Clear */}
            <View style={styles.filterActionsRow}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setShowFilters(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  setStatusFilter('All');
                  setGradeFilter('All');
                  setZoneFilter('All');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── Farmer Group Cards ─── */}
        {filteredFarmers.map((farmer) => (
          <View key={farmer.farmerId} style={styles.farmerCard}>
            {/* Top Farmer Row */}
            <View style={styles.farmerHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{farmer.avatarInitial}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.farmerName}>{farmer.farmerName}</Text>
                <Text style={styles.farmerSub}>{farmer.products.length} pending listings</Text>
              </View>
            </View>

            {/* LISTED PRODUCTS Section Heading */}
            <Text style={styles.listedProductsLabel}>LISTED PRODUCTS</Text>
            <View style={styles.productsDivider} />

            {/* Product Items inside card */}
            {farmer.products.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.productRow,
                  index < farmer.products.length - 1 && styles.productRowBorder,
                ]}
                onPress={() => {
                  onSelectListing?.(item);
                  setSelectedListing({ item, farmer });
                }}
                activeOpacity={0.75}
              >
                {/* Row 1: Crop Name & Pending Badge */}
                <View style={styles.productTopLine}>
                  <Text style={styles.cropName}>{item.cropName}</Text>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Pending</Text>
                  </View>
                </View>

                {/* Row 2: Grade, Quantity, Price */}
                <Text style={styles.productMeta}>
                  {item.grade} · {item.quantityKg} KG · ₹{item.pricePerKg}/KG
                </Text>

                {/* Row 3: Submitted Time */}
                <Text style={styles.submittedMeta}>
                  Submitted: <Text style={styles.submittedTimeBold}>{item.submittedTime}</Text>
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },

  // ─── Header ───
  header: {
    backgroundColor: THEME.headerBg,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
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
    marginRight: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.3,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.headerPillBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },

  // ─── Scroll Area ───
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },

  // ─── Subtitle Counter ───
  counterText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.titleRustDark,
    marginBottom: 10,
    letterSpacing: -0.2,
  },

  // ─── Search Bar ───
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.ink,
    padding: 0,
  },

  // ─── Filter Panel ───
  filterCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 16,
  },
  filterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  filterTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.titleRustDark,
  },
  filterSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterChipActive: {
    backgroundColor: THEME.filterActiveBg,
  },
  filterChipInactive: {
    backgroundColor: THEME.filterInactiveBg,
    borderWidth: 1,
    borderColor: THEME.filterInactiveBorder,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: THEME.filterActiveText,
    fontWeight: '700',
  },
  filterChipTextInactive: {
    color: THEME.filterInactiveText,
  },
  filterActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.headerBg,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: THEME.headerBg,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#4B5563',
  },

  // ─── Farmer Card ───
  farmerCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 14,
    marginBottom: 14,
  },
  farmerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5ECE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#78350F',
  },
  farmerName: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.ink,
    letterSpacing: -0.2,
  },
  farmerSub: {
    fontSize: 12,
    color: THEME.muted,
    marginTop: 1,
  },
  listedProductsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.labelBrown,
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 8,
  },
  productsDivider: {
    height: 1,
    backgroundColor: THEME.borderLight,
    marginBottom: 8,
  },

  // ─── Listed Product Item ───
  productRow: {
    paddingVertical: 10,
  },
  productRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: THEME.borderLight,
  },
  productTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cropName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: THEME.ink,
    letterSpacing: -0.2,
  },
  pendingBadge: {
    backgroundColor: THEME.pendingBadgeBg,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.pendingBadgeText,
  },
  productMeta: {
    fontSize: 12,
    color: THEME.muted,
    marginBottom: 3,
  },
  submittedMeta: {
    fontSize: 11.5,
    color: THEME.muted,
  },
  submittedTimeBold: {
    fontWeight: '800',
    color: THEME.ink,
  },
});
