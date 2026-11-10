/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { OverviewDashboardCard, OverviewCardsGrid } from '../../components/OverviewDashboardCard';
import { type Can } from '../../permissions/can';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FarmersManagementHeaderIcon({ size = 24, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FarmerAvatarSilhouetteIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function FarmApplicationsHeaderIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="4" width="14" height="17" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="11" r="2" stroke={color} strokeWidth="1.8" />
      <Path d="M9 16c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function SearchMagnifierIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-3.5-3.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="21" x2="4" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="4" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="21" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="21" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="12" x2="20" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="1" y1="14" x2="7" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="16" x2="23" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// Bottom Nav Icons matching Image 1 (Home, Farmers, Produce, Audits, More)
function NavHomeIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </Svg>
  );
}

function NavFarmersIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function NavProduceIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a4 4 0 0 0-4 4v1a6 6 0 1 0 8 0V6a4 4 0 0 0-4-4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function NavAuditsIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function NavMoreIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="1.8" fill={color} />
      <Circle cx="12" cy="5" r="1.8" fill={color} />
      <Circle cx="19" cy="5" r="1.8" fill={color} />
      <Circle cx="5" cy="12" r="1.8" fill={color} />
      <Circle cx="12" cy="12" r="1.8" fill={color} />
      <Circle cx="19" cy="12" r="1.8" fill={color} />
      <Circle cx="5" cy="19" r="1.8" fill={color} />
      <Circle cx="12" cy="19" r="1.8" fill={color} />
      <Circle cx="19" cy="19" r="1.8" fill={color} />
    </Svg>
  );
}

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface FarmerListItem {
  id?: string;
  name: string;
  code?: string;
  initials?: string;
  farmName?: string;
  location?: string;
  status?: 'ACTIVE' | 'DISABLED';
  rating?: number | string | null;
  ratingTier?: string;
  mobile?: string;
  aadhaar?: string;
  memberSince?: string;
  subscription?: string;
  farmSize?: string;
  fmbZones?: string;
  primaryCrops?: string;
  soilType?: string;
  irrigation?: string;
  aadhaarStatus?: 'Verified' | 'Pending' | 'Uploaded';
  pattaStatus?: 'Verified' | 'Pending' | 'Uploaded';
  passbookStatus?: 'Verified' | 'Pending' | 'Uploaded';
  certStatus?: 'Verified' | 'Pending' | 'Expired';
  kycNotes?: string;
  // Extra fields for rich mockup parity
  farmingType?: string;
  kycVerifiedText?: string;
  hasExpiredCert?: boolean;
  farmerId?: string;
  zone?: string;
  farmingMethod?: string;
  accountStatus?: string;
  certification?: string;
  farmCount?: number;
  listingCount?: number;
  auditStatus?: string;
  [key: string]: any;
}

export interface ApplicationListItem {
  id: string;
  name: string;
  applicantName: string;
  code: string;
  status: 'Pending' | 'Correction Required' | 'Approved' | 'Rejected';
  phone: string;
  address: string;
  zone: string;
  farmingType: string;
  crops: string;
  submittedDate: string;
  approvedDate?: string;
  kycStatus: string;
  farmSize: string;
  soilType: string;
  landArea: string;
  fmbSketch: string;
  reviewNotes: string;
  identityProofNumber: string;
  identityProofStatus: 'Pending' | 'Verified';
}

export const DEMO_ALL_FARMERS: FarmerListItem[] = [
  {
    id: 'fmr-00124',
    name: 'Ramesh Kumar',
    code: 'FR-00124',
    initials: 'RK',
    farmName: 'Mixed vegetable farm.',
    location: 'Coonoor',
    farmingType: 'Organic',
    status: 'ACTIVE',
    rating: 4.6,
    ratingTier: 'Excellent',
    mobile: '+91 90000 20000',
    aadhaar: 'XXXX XXXX 4821',
    memberSince: '10 Jan 2026',
    subscription: 'Active · Paid',
    kycVerifiedText: 'KYC Verified',
    hasExpiredCert: true,
  },
  {
    id: 'fmr-00131',
    name: 'Selvi',
    code: 'FR-00131',
    initials: 'S',
    farmName: 'Organic Tea & Veggies',
    location: 'Coonoor',
    farmingType: 'Organic',
    status: 'ACTIVE',
    rating: 4.3,
    ratingTier: 'Excellent',
    mobile: '+91 98765 43211',
    aadhaar: 'XXXX XXXX 1928',
    memberSince: '15 Feb 2026',
    subscription: 'Active · Paid',
    kycVerifiedText: 'KYC Verified',
    hasExpiredCert: false,
  },
  {
    id: 'fmr-00118',
    name: 'Kumar',
    code: 'FR-00118',
    initials: 'K',
    farmName: 'Ooty Hills Organic',
    location: 'Ooty',
    farmingType: 'Organic',
    status: 'ACTIVE',
    rating: 4.1,
    ratingTier: 'Good',
    mobile: '+91 98765 11800',
    aadhaar: 'XXXX XXXX 7701',
    memberSince: '05 Jan 2026',
    subscription: 'Pending',
    kycVerifiedText: 'KYC Verified',
    hasExpiredCert: false,
  },
  {
    id: 'fmr-00140',
    name: 'Vijay Anand',
    code: 'FR-00140',
    initials: 'VA',
    farmName: 'Wild Eden Organic Farms',
    location: 'Ooty',
    farmingType: 'Natural',
    status: 'ACTIVE',
    rating: 4.5,
    ratingTier: 'Excellent',
    mobile: '+91 98765 43210',
    aadhaar: 'XXXX XXXX 7654',
    memberSince: 'Mar 2025',
    subscription: 'Active · Paid',
    kycVerifiedText: 'KYC Verified',
    hasExpiredCert: false,
  },
  {
    id: 'fmr-00109',
    name: 'Revathi',
    code: 'FR-00109',
    initials: 'R',
    farmName: 'Kotagiri Tea Estate',
    location: 'Kotagiri',
    farmingType: 'Organic',
    status: 'DISABLED',
    rating: 3.5,
    ratingTier: 'Good',
    mobile: '+91 98765 88990',
    aadhaar: 'XXXX XXXX 7701',
    memberSince: '05 Jan 2026',
    subscription: 'Inactive',
    kycVerifiedText: 'KYC Verified',
    hasExpiredCert: false,
  },
  {
    id: 'fmr-00145',
    name: 'Murugan P',
    code: 'FR-00145',
    initials: 'MP',
    farmName: 'Coonoor Valley Spices',
    location: 'Coonoor',
    farmingType: 'Natural',
    status: 'ACTIVE',
    rating: 4.2,
    ratingTier: 'Good',
    mobile: '+91 98765 22334',
    aadhaar: 'XXXX XXXX 3341',
    memberSince: '20 Jan 2026',
    subscription: 'Pending',
    kycVerifiedText: 'KYC Verified',
    hasExpiredCert: false,
  },
  {
    id: 'fmr-00152',
    name: 'Lakshmi Narayanan',
    code: 'FR-00152',
    initials: 'LN',
    farmName: 'Highland Organic Estate',
    location: 'Coonoor',
    farmingType: 'Organic',
    status: 'DISABLED',
    rating: 3.8,
    ratingTier: 'Good',
    mobile: '+91 98765 77665',
    aadhaar: 'XXXX XXXX 9912',
    memberSince: '12 Dec 2025',
    subscription: 'Inactive',
    kycVerifiedText: 'KYC Verified',
    hasExpiredCert: false,
  },
];

export const DEMO_APPLICATIONS: ApplicationListItem[] = [
  {
    id: 'app-2026-0101',
    name: 'Sathish Kumar',
    applicantName: 'Sathish Kumar',
    code: 'APP-2026-0101',
    status: 'Pending',
    phone: '+91 99801 00100',
    address: 'Thottam Street, Ooty',
    zone: 'Ooty',
    farmingType: 'Natural',
    crops: 'Carrot, Cabbage',
    submittedDate: '05 Oct 2026',
    approvedDate: '10 Oct 2026',
    kycStatus: 'Pending Verification',
    farmSize: '2.0 acre',
    soilType: 'Loam',
    landArea: '2.0 acre',
    fmbSketch: 'fmb-0101.pdf',
    reviewNotes: 'Waiting on document verification.',
    identityProofNumber: 'XXXX XXXX 4821',
    identityProofStatus: 'Pending',
  },
  {
    id: 'app-001',
    name: 'Nagaraj S',
    applicantName: 'Nagaraj S',
    code: 'APP-2026-089',
    status: 'Pending',
    phone: '+91 98765 12340',
    address: 'Plot 45, Ketti Valley, Nilgiris',
    zone: 'Coonoor',
    farmingType: 'Organic',
    crops: 'Carrot, Potato, Cabbage',
    submittedDate: '12 Feb 2026',
    kycStatus: 'Pending Verification',
    farmSize: '2.5 acre',
    soilType: 'Red Loam',
    landArea: '2.5 acre',
    fmbSketch: 'fmb-0089.pdf',
    reviewNotes: 'Aadhaar submitted. Patta verification pending with VAO.',
    identityProofNumber: 'XXXX XXXX 3341',
    identityProofStatus: 'Pending',
  },
  {
    id: 'app-002',
    name: 'Priya Dharshini',
    applicantName: 'Priya Dharshini',
    code: 'APP-2026-092',
    status: 'Correction Required',
    phone: '+91 98765 89012',
    address: 'Hill View Farm, Lovedale, Ooty',
    zone: 'Ooty',
    farmingType: 'Natural',
    crops: 'Broccoli, Lettuce, Strawberry',
    submittedDate: '10 Feb 2026',
    kycStatus: 'Needs Attention',
    farmSize: '1.2 acre',
    soilType: 'Black Clay',
    landArea: '1.2 acre',
    fmbSketch: 'fmb-0092.pdf',
    reviewNotes: 'Bank passbook copy is blurred. Re-upload requested.',
    identityProofNumber: 'XXXX XXXX 9902',
    identityProofStatus: 'Pending',
  },
  {
    id: 'app-003',
    name: 'Murugan K',
    applicantName: 'Murugan K',
    code: 'APP-2026-101',
    status: 'Approved',
    phone: '+91 98765 67890',
    address: 'Solada Farm, Kotagiri Road',
    zone: 'Kotagiri',
    farmingType: 'Conventional',
    crops: 'Tea, Pepper, Cardamom',
    submittedDate: '01 Feb 2026',
    approvedDate: '14 Feb 2026',
    kycStatus: 'Fully Verified',
    farmSize: '5.0 acre',
    soilType: 'Forest Loam',
    landArea: '5.0 acre',
    fmbSketch: 'fmb-0101.pdf',
    reviewNotes: 'All requirements met. Ready for approval.',
    identityProofNumber: 'XXXX XXXX 0000',
    identityProofStatus: 'Verified',
  },
];

export interface AdminAllFarmersScreenProps {
  title?: string | undefined;
  onBack?: (() => void) | undefined;
  onSelectFarmer?: ((farmer: FarmerListItem) => void) | undefined;
  onReviewApplication?: ((application: ApplicationListItem) => void) | undefined;
  onNavigateTab?: ((tab: 'Home' | 'Farmers' | 'Produce' | 'Audits' | 'More' | 'Dashboard' | 'Sales' | 'Reports' | 'Profile') => void) | undefined;
  showBottomNav?: boolean | undefined;
  initialTab?: ('farmers' | 'applications') | undefined;
  can?: Can | undefined;
  role?: string | undefined;
  userScope?: {
    zoneId?: string | undefined;
    warehouseId?: string | undefined;
  } | undefined;
  onViewChange?: ((view: 'list' | 'search_filter' | 'profile') => void) | undefined;
  onNavigateAuditHistory?: (() => void) | undefined;
}

type Props = AdminAllFarmersScreenProps;

export const AdminAllFarmersScreen: React.FC<Props> = ({
  title = 'Farmer Management',
  onBack,
  onSelectFarmer,
  onReviewApplication,
  onNavigateTab,
  showBottomNav = false,
  initialTab = 'farmers',
  can,
  role,
  userScope,
  onViewChange,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'farmers' | 'applications'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  // RBAC checks
  const effectiveRole = role ?? 'TOHFA_ADMIN';
  const isSubWarehouse = effectiveRole === 'SUB_WH_ADMIN' || Boolean(userScope?.warehouseId && !userScope?.warehouseId.toLowerCase().includes('main'));
  const canViewApplications = can
    ? (can('farmer.application.view') || can('farmer.application.list_pending'))
    : (effectiveRole === 'TOHFA_ADMIN' || effectiveRole === 'FARMER_ADMIN' || effectiveRole === 'SUPER_ADMIN');

  React.useEffect(() => {
    if (initialTab) {
      setActiveMainTab(initialTab);
    }
  }, [initialTab]);

  // Base list of farmers: Sub Warehouse Admin is strictly scoped to Coonoor warehouse farmers only.
  // TOHFA Admin, Main Warehouse Admin, and Farmer Admin see farmers across all warehouses.
  const scopedFarmers = isSubWarehouse
    ? DEMO_ALL_FARMERS.filter(
        (f) =>
          f.location?.toLowerCase() === 'coonoor' ||
          f.zone?.toLowerCase() === 'coonoor'
      )
    : DEMO_ALL_FARMERS;

  // Filtered farmers
  const filteredFarmers = scopedFarmers.filter((f) => {
    // Zone filter (only applicable for TOHFA Admin, Main Warehouse, and Farmer Admin)
    if (
      !isSubWarehouse &&
      selectedZoneFilter !== 'All' &&
      f.location &&
      f.location.toLowerCase() !== selectedZoneFilter.toLowerCase()
    ) {
      return false;
    }
    // Status filter
    if (selectedStatusFilter !== 'All') {
      if (selectedStatusFilter === 'Active' && f.status !== 'ACTIVE') return false;
      if (selectedStatusFilter === 'Inactive' && f.status !== 'DISABLED') return false;
      if (selectedStatusFilter === 'Pending' && f.subscription !== 'Pending') return false;
    }
    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.code && f.code.toLowerCase().includes(q)) ||
      (f.location && f.location.toLowerCase().includes(q)) ||
      (f.farmingType && f.farmingType.toLowerCase().includes(q))
    );
  });

  // Filtered applications
  const filteredApplications = DEMO_APPLICATIONS.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.code.toLowerCase().includes(q) ||
      a.applicantName.toLowerCase().includes(q) ||
      a.crops.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header Banner in Brand Orange #F0562A (Image 1) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
          )}

          <View style={styles.headerTitleBox}>
            <FarmersManagementHeaderIcon size={24} color={adminColors.onBrand} />
            <View style={styles.headerTitleTextCol}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>Farmer Community</Text>
            </View>
          </View>

          {/* Top-right Filter Icon Button */}
          <TouchableOpacity
            style={styles.headerFilterBtn}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Filter Farmers"
          >
            <FilterSlidersIcon size={18} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 4 Summary Metric Cards (Image 1) ─── */}
        <OverviewCardsGrid style={{ marginBottom: adminSpacing.md }}>
          <OverviewDashboardCard
            value={isSubWarehouse ? "68" : "245"}
            title="ALL FARMERS"
            icon="users"
            titlePosition="top"
          />
          <OverviewDashboardCard
            value={isSubWarehouse ? "62" : "221"}
            title="ACTIVE"
            icon="users"
            tone="success"
            titlePosition="top"
          />
          <OverviewDashboardCard
            value={isSubWarehouse ? "3" : "12"}
            title="PENDING APPLICATION"
            icon="clipboard"
            tone="warning"
            titlePosition="top"
            onPress={() => {
              if (canViewApplications) {
                setActiveMainTab('applications');
              }
            }}
          />
          <OverviewDashboardCard
            value={isSubWarehouse ? "3" : "12"}
            title="INACTIVE"
            icon="alert"
            titlePosition="top"
          />
        </OverviewCardsGrid>

        {/* ─── Tab Switcher: [Farmers] | [Applications] (RBAC-aware: only if allowed) ─── */}
        {canViewApplications && (
          <View style={styles.tabToggleContainer}>
            <TouchableOpacity
              style={[
                styles.tabToggleButton,
                activeMainTab === 'farmers' && styles.tabToggleButtonActive,
              ]}
              onPress={() => setActiveMainTab('farmers')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabToggleText,
                  activeMainTab === 'farmers' && styles.tabToggleTextActive,
                ]}
              >
                Farmers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabToggleButton,
                activeMainTab === 'applications' && styles.tabToggleButtonActive,
              ]}
              onPress={() => setActiveMainTab('applications')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabToggleText,
                  activeMainTab === 'applications' && styles.tabToggleTextActive,
                ]}
              >
                Applications
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Search Bar (Image 1: "Search by Farmer ID, name or zone") ─── */}
        <View style={styles.searchBarRow}>
          <View style={styles.searchInputBox}>
            <SearchMagnifierIcon />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Farmer ID, name or zone"
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* ─── Content for FARMERS tab (Matching Image 1) ─── */}
        {activeMainTab === 'farmers' && (
          <View style={styles.tabContentSection}>
            <View style={styles.cardsList}>
              {filteredFarmers.map((farmer) => {
                const isActive = farmer.status === 'ACTIVE' && farmer.subscription !== 'Pending';
                return (
                  <TouchableOpacity
                    key={farmer.id}
                    style={styles.farmerCard}
                    activeOpacity={0.8}
                    onPress={() => {
                      onViewChange?.('profile');
                      onSelectFarmer?.(farmer);
                    }}
                  >
                    {/* Top Row: Avatar + Name + ID/Zone */}
                    <View style={styles.cardTopRow}>
                      <View style={styles.cardAvatarCircle}>
                        <FarmerAvatarSilhouetteIcon size={20} color={adminColors.brand} />
                      </View>
                      <View style={styles.cardIdentityCol}>
                        <Text style={styles.cardFarmerName}>{farmer.name}</Text>
                        <Text style={styles.cardFarmerCodeZone}>
                          {farmer.code} · {farmer.location}
                        </Text>
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.cardDivider} />

                    {/* Bottom Stats Row: Farming | Rating | Status */}
                    <View style={styles.cardStatsRow}>
                      <View style={styles.cardStatCol}>
                        <Text style={styles.cardStatLabel}>Farming</Text>
                        <Text style={styles.cardStatValue}>{farmer.farmingType ?? 'Organic'}</Text>
                      </View>
                      <View style={styles.cardStatCol}>
                        <Text style={styles.cardStatLabel}>Rating</Text>
                        <Text style={styles.cardStatValue}>
                          {farmer.rating != null ? (typeof farmer.rating === 'number' ? `${farmer.rating.toFixed(1)} ★` : `${farmer.rating}`) : '4.6 ★'}
                        </Text>
                      </View>
                      <View style={styles.cardStatCol}>
                        <Text style={styles.cardStatLabel}>Status</Text>
                        <Text
                          style={[
                            styles.cardStatValue,
                            isActive ? styles.statusActiveText : styles.statusPendingText,
                          ]}
                        >
                          {isActive ? 'Active' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── Content for APPLICATIONS tab ─── */}
        {activeMainTab === 'applications' && (
          <View style={styles.tabContentSection}>
            <Text style={styles.countText}>{filteredApplications.length} applications</Text>

            <View style={styles.cardsList}>
              {filteredApplications.map((app) => {
                const isPending = app.status === 'Pending';
                const isCorrection = app.status === 'Correction Required';

                return (
                  <TouchableOpacity
                    key={app.id}
                    style={styles.applicationCard}
                    onPress={() => onReviewApplication?.(app)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardName}>{app.name}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          isPending
                            ? styles.statusBadgePending
                            : isCorrection
                            ? styles.statusBadgeCorrection
                            : styles.statusBadgeApproved,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isPending
                              ? styles.statusBadgeTextPending
                              : isCorrection
                              ? styles.statusBadgeTextCorrection
                              : styles.statusBadgeTextApproved,
                          ]}
                        >
                          {app.status}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardSubText}>
                      {app.code} · {app.zone} · {app.crops}
                    </Text>

                    <Text style={styles.cardDetailText}>
                      Submitted {app.submittedDate} · {app.kycStatus}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ─── Bottom Navigation Bar (Image 1: Home, Farmers, Produce, Audits, More) ─── */}
      {showBottomNav && (
        <View style={styles.bottomNavContainer}>
          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => onNavigateTab?.('Home')}
            activeOpacity={0.7}
          >
            <NavHomeIcon />
            <Text style={styles.navTabLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => onNavigateTab?.('Farmers')}
            activeOpacity={0.7}
          >
            <NavFarmersIcon />
            <Text style={[styles.navTabLabel, styles.navTabLabelActive]}>Farmers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => onNavigateTab?.('Produce')}
            activeOpacity={0.7}
          >
            <NavProduceIcon />
            <Text style={styles.navTabLabel}>Produce</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => onNavigateTab?.('Audits')}
            activeOpacity={0.7}
          >
            <NavAuditsIcon />
            <Text style={styles.navTabLabel}>Audits</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => onNavigateTab?.('More')}
            activeOpacity={0.7}
          >
            <NavMoreIcon />
            <Text style={styles.navTabLabel}>More</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Filter Modal ─── */}
      <Modal visible={showFilterModal} transparent animationType="fade">
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalCard}>
            <Text style={styles.filterModalTitle}>Filter Farmers</Text>
            
            {!isSubWarehouse && (
              <>
                <Text style={styles.filterSectionLabel}>Zone</Text>
                <View style={styles.filterChipRow}>
                  {['All', 'Coonoor', 'Ooty', 'Kotagiri'].map((zone) => (
                    <TouchableOpacity
                      key={zone}
                      style={[
                        styles.filterChip,
                        selectedZoneFilter === zone && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedZoneFilter(zone)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedZoneFilter === zone && styles.filterChipTextActive,
                        ]}
                      >
                        {zone}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.filterSectionLabel}>Status</Text>
            <View style={styles.filterChipRow}>
              {['All', 'Active', 'Pending', 'Inactive'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    selectedStatusFilter === status && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedStatusFilter(status)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedStatusFilter === status && styles.filterChipTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.filterModalCloseBtn}
              onPress={() => setShowFilterModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.filterModalCloseBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 8,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 6,
    marginRight: 6,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitleTextCol: {
    marginLeft: 12,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 1,
  },
  headerFilterBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxxl,
  },
  tabToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDE5DB',
    borderRadius: adminRadius.md,
    padding: 3,
    marginBottom: adminSpacing.md,
  },
  tabToggleButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.sm,
  },
  tabToggleButtonActive: {
    backgroundColor: adminColors.brand,
    ...adminShadow.sm,
  },
  tabToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6E6258',
  },
  tabToggleTextActive: {
    color: adminColors.onBrand,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  searchInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    padding: 0,
  },
  tabContentSection: {},
  countText: {
    fontSize: 11,
    fontWeight: '500',
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  cardsList: {
    gap: adminSpacing.md,
  },
  farmerCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEEAE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIdentityCol: {
    flex: 1,
  },
  cardFarmerName: {
    fontSize: 16,
    fontWeight: '700',
    color: adminColors.ink,
  },
  cardFarmerCodeZone: {
    fontSize: 13,
    fontWeight: '500',
    color: adminColors.muted,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.md,
  },
  cardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStatCol: {
    flex: 1,
  },
  cardStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: adminColors.muted,
    marginBottom: 2,
  },
  cardStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  statusActiveText: {
    color: '#16A34A',
  },
  statusPendingText: {
    color: '#D97706',
  },
  applicationCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardName: {
    ...adminType.rowTitle,
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  cardSubText: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginBottom: 2,
  },
  cardDetailText: {
    fontSize: 11.5,
    color: adminColors.ink,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  statusBadgeActive: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgeInactive: {
    backgroundColor: '#F5F5F5',
  },
  statusBadgePending: {
    backgroundColor: '#FFF3E0',
  },
  statusBadgeCorrection: {
    backgroundColor: '#E3F2FD',
  },
  statusBadgeApproved: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusBadgeTextActive: {
    color: '#2E7D32',
  },
  statusBadgeTextInactive: {
    color: '#757575',
  },
  statusBadgeTextPending: {
    color: '#E65100',
  },
  statusBadgeTextCorrection: {
    color: '#1565C0',
  },
  statusBadgeTextApproved: {
    color: '#2E7D32',
  },
  bottomNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    ...adminShadow.md,
  },
  navTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  navTabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: adminColors.muted,
    marginTop: 4,
  },
  navTabLabelActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  filterModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.xl,
    ...adminShadow.lg,
  },
  filterModalTitle: {
    ...adminType.title,
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: adminSpacing.sm,
    marginBottom: 6,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: adminSpacing.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.ink,
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
  },
  filterModalCloseBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.lg,
  },
  filterModalCloseBtnText: {
    color: adminColors.onBrand,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default AdminAllFarmersScreen;

export { AdminFarmMapScreen } from './AdminFarmMapScreen';
export { AdminRatingScorecardScreen } from './AdminRatingScorecardScreen';
