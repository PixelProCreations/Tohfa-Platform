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
import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';
import { ProduceListingDetailsScreen } from './ProduceListingDetailsScreen';
import { ReviewProduceListingScreen } from './ReviewProduceListingScreen';
import { ListingHistoryScreen } from './ListingHistoryScreen';
import { AdminFarmerDetailScreen } from '../farmers/AdminFarmerDetailScreen';
import { ProduceVerificationApprovalScreen } from './ProduceVerificationApprovalScreen';

// ─── Exact SVG Icons ──────────────────────────────────────────────────────────

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

function SearchIcon({ size = 18, color = adminColors.placeholder }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Data Interface ───────────────────────────────────────────────────────────

export interface ListingCardItem {
  id: string;
  title: string;
  crop: 'Tomato' | 'Carrot' | 'Beans' | 'Other';
  grade: 'Grade 1' | 'Grade 2';
  quantityKg: number;
  pricePerKg?: number;
  status: 'Pending Review' | 'Counter Offer Sent' | 'Approved' | 'Rejected' | 'Review Restricted';
  farmerName?: string;
  farmerId?: string;
  submittedTime?: string;
  reason?: string;
  zone: 'Coonoor' | 'Ooty';
  isOwnListing?: boolean;
}

// ─── Mock Listings ────────────────────────────────────────────────────────────

const MOCK_LISTINGS: ListingCardItem[] = [
  {
    id: 'PL-001241',
    title: 'Tomato',
    crop: 'Tomato',
    grade: 'Grade 1',
    quantityKg: 50,
    pricePerKg: 100,
    status: 'Pending Review',
    farmerName: 'Ramesh',
    farmerId: 'FR-00241',
    submittedTime: '29 Sep, 10:24 AM',
    zone: 'Coonoor',
  },
  {
    id: 'PL-001242',
    title: 'Beans',
    crop: 'Beans',
    grade: 'Grade 1',
    quantityKg: 75,
    pricePerKg: 100,
    status: 'Counter Offer Sent',
    farmerName: 'Kumar',
    zone: 'Ooty',
  },
  {
    id: 'PL-001243',
    title: 'Carrot',
    crop: 'Carrot',
    grade: 'Grade 2',
    quantityKg: 80,
    pricePerKg: 70,
    status: 'Approved',
    farmerName: 'Selvi',
    zone: 'Ooty',
  },
  {
    id: 'PL-001244',
    title: 'Beans',
    crop: 'Beans',
    grade: 'Grade 2',
    quantityKg: 40,
    pricePerKg: 85,
    status: 'Rejected',
    reason: 'Quality incomplete',
    zone: 'Coonoor',
  },
  {
    id: 'PL-001245',
    title: 'Your Listing — Tomato',
    crop: 'Tomato',
    grade: 'Grade 1',
    quantityKg: 30,
    status: 'Review Restricted',
    zone: 'Coonoor',
    isOwnListing: true,
  },
  {
    id: 'PL-001246',
    title: 'Tomato',
    crop: 'Tomato',
    grade: 'Grade 1',
    quantityKg: 65,
    pricePerKg: 95,
    status: 'Pending Review',
    farmerName: 'Suresh',
    farmerId: 'FR-00189',
    submittedTime: '29 Sep, 11:10 AM',
    zone: 'Coonoor',
  },
  {
    id: 'PL-001247',
    title: 'Carrot',
    crop: 'Carrot',
    grade: 'Grade 1',
    quantityKg: 120,
    pricePerKg: 80,
    status: 'Pending Review',
    farmerName: 'Mani',
    farmerId: 'FR-00305',
    submittedTime: '29 Sep, 11:35 AM',
    zone: 'Ooty',
  },
  {
    id: 'PL-001248',
    title: 'Beans',
    crop: 'Beans',
    grade: 'Grade 1',
    quantityKg: 50,
    pricePerKg: 110,
    status: 'Pending Review',
    farmerName: 'Anitha',
    farmerId: 'FR-00412',
    submittedTime: '29 Sep, 11:45 AM',
    zone: 'Coonoor',
  },
  {
    id: 'PL-001249',
    title: 'Tomato',
    crop: 'Tomato',
    grade: 'Grade 2',
    quantityKg: 90,
    pricePerKg: 75,
    status: 'Approved',
    farmerName: 'Rajendran',
    zone: 'Coonoor',
  },
  {
    id: 'PL-001250',
    title: 'Carrot',
    crop: 'Carrot',
    grade: 'Grade 2',
    quantityKg: 60,
    pricePerKg: 65,
    status: 'Rejected',
    reason: 'Pest marks detected',
    zone: 'Ooty',
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ProduceListingsScreenProps {
  onBack: () => void;
  initialFilter?: 'all' | 'pending' | 'counter';
  onSelectListing?: (item: ListingCardItem) => void;
  role?: string;
  completedProduceNames?: string[];
  onSelectFarmerDetails?: (group: any, item: any) => void;
  onSelectFarmerProduce?: (group: any, item: any) => void;
}

export interface FarmerListingGroup {
  farmerName: string;
  farmerId: string;
  zone: string;
  avatarChar: string;
  pendingCountText: string;
  products: {
    id: string;
    crop: string;
    grade: string;
    quantityKg: number;
    pricePerKg: number;
    submittedTime: string;
    status: 'Pending View' | 'Pending Review' | 'Approved' | 'Rejected';
  }[];
}

const MOCK_FARMER_GROUPS: FarmerListingGroup[] = [
  {
    farmerName: 'Ramesh',
    farmerId: 'FR-00241',
    zone: 'Coonoor',
    avatarChar: 'R',
    pendingCountText: '3 pending listings',
    products: [
      {
        id: 'PL-001241',
        crop: 'Tomato',
        grade: 'Grade 1',
        quantityKg: 50,
        pricePerKg: 100,
        submittedTime: '08:15 AM',
        status: 'Pending View',
      },
      {
        id: 'PL-001242',
        crop: 'Carrot',
        grade: 'Grade 1',
        quantityKg: 30,
        pricePerKg: 80,
        submittedTime: '08:40 AM',
        status: 'Pending View',
      },
      {
        id: 'PL-001243',
        crop: 'Beans',
        grade: 'Grade 2',
        quantityKg: 20,
        pricePerKg: 60,
        submittedTime: '09:05 AM',
        status: 'Pending View',
      },
    ],
  },
  {
    farmerName: 'Kumar',
    farmerId: 'FR-00388',
    zone: 'Ooty',
    avatarChar: 'K',
    pendingCountText: '2 pending listings',
    products: [
      {
        id: 'PL-001244',
        crop: 'Carrot',
        grade: 'Grade 2',
        quantityKg: 80,
        pricePerKg: 70,
        submittedTime: '08:20 AM',
        status: 'Pending View',
      },
      {
        id: 'PL-001245',
        crop: 'Onion',
        grade: 'Grade 1',
        quantityKg: 60,
        pricePerKg: 50,
        submittedTime: '09:35 AM',
        status: 'Pending View',
      },
    ],
  },
  {
    farmerName: 'Suresh Chakravarthi',
    farmerId: 'FR-00189',
    zone: 'Coonoor',
    avatarChar: 'S',
    pendingCountText: '4 pending listings',
    products: [
      {
        id: 'PL-001246',
        crop: 'Tomato',
        grade: 'Grade 1',
        quantityKg: 40,
        pricePerKg: 95,
        submittedTime: '07:45 AM',
        status: 'Pending View',
      },
      {
        id: 'PL-001247',
        crop: 'Carrot',
        grade: 'Grade 1',
        quantityKg: 50,
        pricePerKg: 75,
        submittedTime: '08:00 AM',
        status: 'Pending View',
      },
    ],
  },
];

export function ProduceListingsScreen({
  onBack,
  initialFilter = 'all',
  onSelectListing,
  role,
  completedProduceNames,
  onSelectFarmerDetails,
  onSelectFarmerProduce,
}: ProduceListingsScreenProps) {
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Drill-down into Listing Details / Review / History
  const [detailsItem, setDetailsItem] = useState<ListingCardItem | null>(null);
  const [currentSubView, setCurrentSubView] = useState<'details' | 'review' | 'history' | 'farmer' | 'verification'>('details');

  // Filters Popup Modal State
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Selected Filter States
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>(
    initialFilter === 'pending' ? 'Pending' : 'All'
  );
  const [cropFilter, setCropFilter] = useState<'All' | 'Tomato' | 'Carrot' | 'Beans'>('All');
  const [gradeFilter, setGradeFilter] = useState<'All' | 'Grade 1' | 'Grade 2'>('All');
  const [zoneFilter, setZoneFilter] = useState<'All' | 'Coonoor' | 'Ooty'>('All');

  // Filtered Listings Calculation
  const filteredListings = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return MOCK_LISTINGS.filter((item) => {
      // 1. Status Filter
      if (statusFilter !== 'All') {
        if (statusFilter === 'Pending') {
          if (item.status !== 'Pending Review' && item.status !== 'Review Restricted' && item.status !== 'Counter Offer Sent') {
            return false;
          }
        } else if (statusFilter === 'Approved') {
          if (item.status !== 'Approved') return false;
        } else if (statusFilter === 'Rejected') {
          if (item.status !== 'Rejected') return false;
        }
      }

      // 2. Crop Filter
      if (cropFilter !== 'All' && item.crop !== cropFilter) {
        return false;
      }

      // 3. Grade Filter
      if (gradeFilter !== 'All' && item.grade !== gradeFilter) {
        return false;
      }

      // 4. Zone Filter
      if (zoneFilter !== 'All' && item.zone !== zoneFilter) {
        return false;
      }

      // 5. Search Text Query
      if (q) {
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCrop = item.crop.toLowerCase().includes(q);
        const matchId = item.id.toLowerCase().includes(q);
        const matchFarmer = item.farmerName?.toLowerCase().includes(q) || false;
        const matchFarmerId = item.farmerId?.toLowerCase().includes(q) || false;
        return matchTitle || matchCrop || matchId || matchFarmer || matchFarmerId;
      }

      return true;
    });
  }, [searchQuery, statusFilter, cropFilter, gradeFilter, zoneFilter]);

  // Grouped Farmer Calculation for S02 Product Listings
  const filteredFarmerGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return MOCK_FARMER_GROUPS;

    return MOCK_FARMER_GROUPS.map((group) => {
      const matchFarmer = group.farmerName.toLowerCase().includes(q) || group.farmerId.toLowerCase().includes(q);
      if (matchFarmer) return group;
      const matchedProducts = group.products.filter(
        (p) => p.crop.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      );
      if (matchedProducts.length > 0) {
        return { ...group, products: matchedProducts };
      }
      return null;
    }).filter(Boolean) as FarmerListingGroup[];
  }, [searchQuery]);

  // If a listing is selected, handle sub-views
  if (detailsItem) {
    if (currentSubView === 'farmer') {
      return (
        <AdminFarmerDetailScreen
          farmerId={detailsItem.farmerId ?? detailsItem.id}
          farmerName={detailsItem.farmerName ?? 'Farmer'}
          onBack={() => setCurrentSubView('details')}
        />
      );
    }

    if (currentSubView === 'review') {
      return (
        <ReviewProduceListingScreen
          listingId={detailsItem.id}
          cropName={detailsItem.crop}
          grade={detailsItem.grade}
          onBack={() => setCurrentSubView('details')}
          onViewFullListingDetail={() => setCurrentSubView('details')}
        />
      );
    }

    if (currentSubView === 'history') {
      return (
        <ListingHistoryScreen
          listingId={detailsItem.id}
          cropName={detailsItem.crop}
          grade={detailsItem.grade}
          onBack={() => setCurrentSubView('details')}
        />
      );
    }

    if (currentSubView === 'verification') {
      return (
        <ProduceVerificationApprovalScreen
          listingId={detailsItem.id}
          cropName={detailsItem.crop}
          farmerName={detailsItem.farmerName || 'Ramesh Kumar'}
          onBack={() => setCurrentSubView('details')}
          onSubmitSuccess={() => setCurrentSubView('details')}
        />
      );
    }

    return (
      <ProduceListingDetailsScreen
        listingId={detailsItem.id}
        cropName={detailsItem.crop}
        farmerName={detailsItem.farmerName || 'Ramesh Kumar'}
        onBack={() => setDetailsItem(null)}
        onViewFarmer={() => setCurrentSubView('farmer')}
        onViewFullHistory={() => setCurrentSubView('history')}
        onReviewListing={() => setCurrentSubView('review')}
        onNavigateToVerification={() => setCurrentSubView('verification')}
      />
    );
  }

  // If viewing Filters Page
  if (showFilterModal) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* ─── Header ─── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setShowFilterModal(false)}
              activeOpacity={0.7}
              accessibilityLabel={t('produceListings.backLabel')}
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>{t('produceListings.filterPage.title')}</Text>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.lg, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.filterPageCard}>
            {/* ─── 1. Status Filter ─── */}
            <Text style={styles.filterCategoryLabel}>{t('produceListings.filterPage.status')}</Text>
            <View style={styles.chipsRow}>
              {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((opt) => {
                const isActive = statusFilter === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
                    onPress={() => setStatusFilter(opt)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isActive ? styles.chipTextActive : styles.chipTextInactive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ─── 2. Crop Filter ─── */}
            <Text style={[styles.filterCategoryLabel, { marginTop: adminSpacing.lg }]}>
              {t('produceListings.filterPage.crop')}
            </Text>
            <View style={styles.chipsRow}>
              {(['All', 'Tomato', 'Carrot', 'Beans'] as const).map((opt) => {
                const isActive = cropFilter === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
                    onPress={() => setCropFilter(opt)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isActive ? styles.chipTextActive : styles.chipTextInactive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ─── 3. Grade Filter ─── */}
            <Text style={[styles.filterCategoryLabel, { marginTop: adminSpacing.lg }]}>
              {t('produceListings.filterPage.grade')}
            </Text>
            <View style={styles.chipsRow}>
              {(['All', 'Grade 1', 'Grade 2'] as const).map((opt) => {
                const isActive = gradeFilter === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
                    onPress={() => setGradeFilter(opt)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isActive ? styles.chipTextActive : styles.chipTextInactive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ─── 4. Zone Filter ─── */}
            <Text style={[styles.filterCategoryLabel, { marginTop: adminSpacing.lg }]}>
              {t('produceListings.filterPage.zone')}
            </Text>
            <View style={styles.chipsRow}>
              {(['All', 'Coonoor', 'Ooty'] as const).map((opt) => {
                const isActive = zoneFilter === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
                    onPress={() => setZoneFilter(opt)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isActive ? styles.chipTextActive : styles.chipTextInactive,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ─── Bottom Actions: Apply & Clear ─── */}
          <View style={styles.filterActionsRow}>
            <TouchableOpacity
              style={styles.clearOutlineBtn}
              onPress={() => {
                setStatusFilter('All');
                setCropFilter('All');
                setGradeFilter('All');
                setZoneFilter('All');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.clearOutlineBtnText}>{t('produceListings.filterPage.clearAll')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyOutlineBtn}
              onPress={() => setShowFilterModal(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.applyOutlineBtnText}>{t('produceListings.filterPage.apply')}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
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
            accessibilityLabel={t('produceListings.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('produceListings.title')}</Text>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.8}
            accessibilityLabel="Open Filters"
          >
            <FilterSlidersIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Counter Text */}
        <Text style={styles.pendingCounterText}>{t('produceListings.pendingCounter')}</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={adminColors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('produceListings.searchPlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* ─── Listing Cards List ─── */}
        <View style={styles.cardsList}>
          {role === 'FARMER_ADMIN' ? (
            filteredFarmerGroups.map((group) => (
              <View key={group.farmerId} style={styles.groupCard}>
                {/* Farmer Header Row */}
                <TouchableOpacity
                  style={styles.groupHeaderRow}
                  onPress={() => {
                    if (onSelectFarmerDetails) {
                      onSelectFarmerDetails(group, group.products[0]);
                    } else {
                      setDetailsItem({
                        id: group.products[0]?.id || 'PL-001241',
                        title: group.products[0]?.crop || 'Produce',
                        crop: (group.products[0]?.crop as any) || 'Tomato',
                        grade: (group.products[0]?.grade as any) || 'Grade 1',
                        quantityKg: group.products[0]?.quantityKg || 50,
                        status: 'Pending Review',
                        farmerName: group.farmerName,
                        farmerId: group.farmerId,
                        zone: group.zone as any,
                      });
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.groupAvatarCircle}>
                    <Text style={styles.groupAvatarText}>{group.avatarChar}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupFarmerName}>{group.farmerName}</Text>
                    <Text style={styles.groupPendingText}>{group.pendingCountText}</Text>
                  </View>
                </TouchableOpacity>

                {/* Listed Products Label */}
                <Text style={styles.listedProductsLabel}>LISTED PRODUCTS</Text>

                {/* Products list inside farmer card */}
                <View style={styles.groupProductsList}>
                  {group.products.map((prod) => (
                    <TouchableOpacity
                      key={prod.id}
                      style={styles.groupProductItem}
                      onPress={() => {
                        if (onSelectFarmerDetails) {
                          onSelectFarmerDetails(group, prod);
                        } else if (onSelectListing) {
                          onSelectListing({
                            id: prod.id,
                            title: prod.crop,
                            crop: prod.crop as any,
                            grade: prod.grade as any,
                            quantityKg: prod.quantityKg,
                            pricePerKg: prod.pricePerKg,
                            status: 'Pending Review',
                            farmerName: group.farmerName,
                            farmerId: group.farmerId,
                            zone: group.zone as any,
                          });
                        } else {
                          setDetailsItem({
                            id: prod.id,
                            title: prod.crop,
                            crop: prod.crop as any,
                            grade: prod.grade as any,
                            quantityKg: prod.quantityKg,
                            pricePerKg: prod.pricePerKg,
                            status: 'Pending Review',
                            farmerName: group.farmerName,
                            farmerId: group.farmerId,
                            zone: group.zone as any,
                          });
                        }
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={styles.groupProductHeader}>
                        <Text style={styles.groupProductTitle}>{prod.crop}</Text>
                        <View style={styles.groupPendingBadge}>
                          <Text style={styles.groupPendingBadgeText}>Pending View</Text>
                        </View>
                      </View>

                      <Text style={styles.groupProductSpecs}>
                        {prod.grade} · {prod.quantityKg} KG · ₹{prod.pricePerKg}/KG
                      </Text>

                      <Text style={styles.groupProductSubmitted}>
                        Submitted: {prod.submittedTime}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          ) : (
            filteredListings.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => {
                  onSelectListing?.(item);
                  setDetailsItem(item);
                  setCurrentSubView('details');
                }}
                activeOpacity={0.75}
              >
                {/* Row 1: Crop / Title & Status Badge */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{item.title}</Text>

                  {item.status === 'Pending Review' && (
                    <View style={[styles.badge, styles.badgePending]}>
                      <Text style={[styles.badgeText, styles.badgeTextPending]}>Pending Review</Text>
                    </View>
                  )}
                  {item.status === 'Counter Offer Sent' && (
                    <View style={[styles.badge, styles.badgeCounter]}>
                      <Text style={[styles.badgeText, styles.badgeTextCounter]}>Counter Offer Sent</Text>
                    </View>
                  )}
                  {item.status === 'Approved' && (
                    <View style={[styles.badge, styles.badgeApproved]}>
                      <Text style={[styles.badgeText, styles.badgeTextApproved]}>Approved</Text>
                    </View>
                  )}
                  {item.status === 'Rejected' && (
                    <View style={[styles.badge, styles.badgeRejected]}>
                      <Text style={[styles.badgeText, styles.badgeTextRejected]}>Rejected</Text>
                    </View>
                  )}
                  {item.status === 'Review Restricted' && (
                    <View style={[styles.badge, styles.badgeRestricted]}>
                      <Text style={[styles.badgeText, styles.badgeTextRestricted]}>Review Restricted</Text>
                    </View>
                  )}
                </View>

                {/* Row 2: Specs */}
                <Text style={styles.cardSpecText}>
                  {item.grade} · {item.quantityKg} KG
                  {item.pricePerKg ? ` · ₹${item.pricePerKg}/KG` : ''}
                </Text>

                {/* Thin Divider Line */}
                {(item.farmerName || item.reason) && <View style={styles.cardDivider} />}

                {/* Metadata: Farmer */}
                {item.farmerName && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Farmer:</Text>
                    <Text style={styles.metaValue}>
                      {item.farmerName}
                      {item.farmerId ? ` · ${item.farmerId}` : ''}
                    </Text>
                  </View>
                )}

                {/* Metadata: Submitted Time */}
                {item.submittedTime && (
                  <View style={[styles.metaRow, { marginTop: 4 }]}>
                    <Text style={styles.metaLabel}>Submitted:</Text>
                    <Text style={styles.metaValue}>{item.submittedTime}</Text>
                  </View>
                )}

                {/* Metadata: Reason */}
                {item.reason && (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Reason:</Text>
                    <Text style={styles.metaValue}>{item.reason}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingBottom: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerTitle: {
    flex: 1,
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.md,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Scroll Body ───
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },

  // ─── Counter Text ───
  pendingCounterText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
    letterSpacing: -0.2,
  },

  // ─── Search Bar ───
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },

  // ─── Listing Cards List ───
  cardsList: {
    gap: adminSpacing.md,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    letterSpacing: -0.2,
  },
  cardSpecText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  metaValue: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // ─── Badges ───
  badge: {
    borderRadius: adminRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  badgePending: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeTextPending: {
    color: adminColors.warning.text,
  },
  badgeCounter: {
    backgroundColor: adminColors.info.bg,
  },
  badgeTextCounter: {
    color: adminColors.info.text,
  },
  badgeApproved: {
    backgroundColor: adminColors.success.bg,
  },
  badgeTextApproved: {
    color: adminColors.success.text,
  },
  badgeRejected: {
    backgroundColor: adminColors.danger.bg,
  },
  badgeTextRejected: {
    color: adminColors.danger.text,
  },
  badgeRestricted: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeTextRestricted: {
    color: adminColors.warning.text,
  },

  // ─── Filter Page Card ───
  filterPageCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: adminSpacing.lg,
  },
  filterCategoryLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: 10,
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  chip: {
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 9,
  },
  chipActive: {
    backgroundColor: adminColors.brand,
  },
  chipInactive: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  chipText: {
    ...adminType.caption,
  },
  chipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '800',
  },
  chipTextInactive: {
    color: adminColors.ink,
    fontWeight: '700',
  },

  // ─── Filter Bottom Actions ───
  filterActionsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 26,
  },
  applyOutlineBtn: {
    flex: 1,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.xl,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyOutlineBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  clearOutlineBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderRadius: adminRadius.xl,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearOutlineBtnText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },

  // ─── Farmer Grouped Styles (Image 2 Screen 1) ───
  groupCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: adminSpacing.md,
  },
  groupAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  groupFarmerName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    letterSpacing: -0.2,
  },
  groupPendingText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 1,
  },
  listedProductsLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.muted,
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  groupProductsList: {
    gap: 10,
  },
  groupProductItem: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  groupProductHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  groupProductTitle: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  groupPendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  groupPendingBadgeText: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    fontWeight: '600',
  },
  groupProductSpecs: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '600',
    marginBottom: 2,
  },
  groupProductSubmitted: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
  },
});
