import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
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
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { useFarmerList, useApplicationList, useFarmerSummary } from '../../api/farmerHooks';
import { toDesignFarmerItem, toDesignApplicationItem, ratingText, statusLabelKey } from './allFarmersMappers';
import { queryViewState } from '../warehouse/shared/queryViewState';
import { AdminLoadingState, AdminErrorState, AdminEmptyState } from '../warehouse/shared/AsyncStates';
import { t } from '../../i18n';

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

function LocationPinIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function DocumentTextIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UsersIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlusIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
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
      <Rect x="4" y="4" width="16" height="17" rx="2.5" stroke={color} strokeWidth="1.9" />
      <Path d="M9 2.5h6a1 1 0 0 1 1 1V5H8V3.5a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
      <Path d="M8.5 13l2.5 2.5 5-5" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function NavMoreIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="1.5" stroke={color} strokeWidth="2" fill={color} />
      <Circle cx="19" cy="12" r="1.5" stroke={color} strokeWidth="2" fill={color} />
      <Circle cx="5" cy="12" r="1.5" stroke={color} strokeWidth="2" fill={color} />
    </Svg>
  );
}

// ─── Data Types & Demo Data ─────────────────────────────────────────────────

export interface FarmerListItem {
  id: string;
  name: string;
  code?: string;
  farmerId?: string;
  initials?: string;
  farmName?: string;
  location?: string;
  zone?: string;
  farmingType?: string;
  status: 'ACTIVE' | 'DISABLED' | 'PENDING';
  rating?: number | string | null | undefined;
  ratingTier?: string;
  mobile?: string;
  aadhaar?: string;
  memberSince?: string;
  subscription?: string;
  kycVerifiedText?: string;
  kycStatus?: string;
  certStatus?: 'Expired' | 'Pending' | 'Verified';
  hasExpiredCert?: boolean;
  primaryCrops?: string;
  crops?: string;
}

export interface ApplicationListItem {
  id: string;
  name: string;
  applicantName?: string;
  code: string;
  status: 'Pending' | 'Approved' | 'Correction Required' | 'Rejected';
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
  identityProofStatus?: 'Pending' | 'Verified' | null;
}

export interface AdminAllFarmersScreenProps {
  title?: string | undefined;
  onBack?: (() => void) | undefined;
  onSelectFarmer?: ((farmer: FarmerListItem) => void) | undefined;
  onReviewApplication?: ((application: ApplicationListItem) => void) | undefined;
  onNavigateTab?: ((tab: 'Home' | 'Farmers' | 'Produce' | 'Audits' | 'More' | 'Dashboard' | 'Sales' | 'Reports' | 'Profile') => void) | undefined;
  showBottomNav?: boolean | undefined;
  initialTab?: ('farmers' | 'applications') | undefined;
  initialStatusFilter?: string | undefined;
  initialShowFilter?: boolean | undefined;
  can?: Can | undefined;
  role?: string | undefined;
  warehouseId?: string | undefined;
  userScope?: {
    zoneId?: string | undefined;
    warehouseId?: string | undefined;
  } | undefined;
  onViewChange?: ((view: 'list' | 'search_filter' | 'profile') => void) | undefined;
  onNavigateAuditHistory?: (() => void) | undefined;
  onOpenFarmRecords?: (() => void) | undefined;
  onOpenVerificationCompliance?: (() => void) | undefined;
  onOpenApplications?: (() => void) | undefined;
  onAddFarmer?: (() => void) | undefined;
  onOpenApprovalInbox?: (() => void) | undefined;
  onOpenSubscriptionOverview?: (() => void) | undefined;
}

export const AdminAllFarmersScreen: React.FC<AdminAllFarmersScreenProps> = ({
  title,
  onBack,
  onSelectFarmer,
  onReviewApplication,
  onNavigateTab,
  showBottomNav = false,
  initialTab = 'farmers',
  initialStatusFilter = 'All',
  initialShowFilter = false,
  can,
  role,
  warehouseId,
  userScope,
  onViewChange,
  onOpenFarmRecords,
  onOpenVerificationCompliance,
  onOpenApplications,
  onAddFarmer,
  onOpenApprovalInbox,
  onOpenSubscriptionOverview,
}) => {
  const scrollViewRef = useRef<any>(null);
  const [listSectionY, setListSectionY] = useState(0);

  const [activeMainTab, setActiveMainTab] = useState<'farmers' | 'applications'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(initialShowFilter);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>(initialStatusFilter);
  const [selectedCertFilter, setSelectedCertFilter] = useState<'All' | 'Expired' | 'Pending' | 'Verified'>('All');
  const [activeCardFilterName, setActiveCardFilterName] = useState<string | null>(null);

  // RBAC checks
  const normalizedRole = (role ?? 'TOHFA_ADMIN').toUpperCase();
  const isSuperAdmin = normalizedRole === 'SUPER_ADMIN';
  const isTohfaAdmin = normalizedRole === 'TOHFA_ADMIN';
  const isFarmerAdmin = normalizedRole === 'FARMER_ADMIN';
  const effectiveWarehouseId = userScope?.warehouseId ?? warehouseId;
  const isSubWarehouse =
    normalizedRole === 'SUB_WH_ADMIN' ||
    Boolean(effectiveWarehouseId && !effectiveWarehouseId.toLowerCase().includes('main'));
  const _isWarehouseAdmin =
    normalizedRole === 'MAIN_WH_ADMIN' ||
    normalizedRole === 'WAREHOUSE_ADMIN' ||
    isSubWarehouse;

  // Full Admin view (Super Admin and TOHFA Admin share 8-stat cards, zones, quick access)
  const isFullAdmin = isSuperAdmin || isTohfaAdmin;

  // Applications tab allowed for Super Admin, TOHFA Admin, and Farmer Admin
  const canViewApplications =
    isFullAdmin ||
    isFarmerAdmin ||
    (can ? can('farmer.application.view') || can('farmer.application.list_pending') : false);

  const defaultTitle = isFullAdmin ? 'Farmers Management' : 'Farmer Management';
  const displayTitle = title ? title : defaultTitle;

  const farmerSummaryQuery = useFarmerSummary(effectiveWarehouseId);
  const farmerListQuery = useFarmerList(effectiveWarehouseId);
  const applicationListQuery = useApplicationList(effectiveWarehouseId);

  const mappedFarmers = useMemo(
    () => farmerListQuery.items.map(toDesignFarmerItem),
    [farmerListQuery.items],
  );
  const mappedApplications = useMemo(
    () => applicationListQuery.items.map(toDesignApplicationItem),
    [applicationListQuery.items],
  );

  const farmersViewState = queryViewState({
    isLoading: farmerListQuery.isLoading,
    error: farmerListQuery.error,
    itemCount: farmerListQuery.items.length,
  });

  const applicationsViewState = queryViewState({
    isLoading: applicationListQuery.isLoading,
    error: applicationListQuery.error,
    itemCount: applicationListQuery.items.length,
  });

  useEffect(() => {
    if (initialTab) {
      setActiveMainTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialStatusFilter) {
      setSelectedStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  useEffect(() => {
    if (initialShowFilter) {
      setShowFilterModal(true);
    }
  }, [initialShowFilter]);

  // Card click handler: smoothly switches tab/filters and scrolls down to list
  const handleCardPress = (
    targetTab: 'farmers' | 'applications',
    statusFilter = 'All',
    certFilter: 'All' | 'Expired' | 'Pending' | 'Verified' = 'All',
    filterLabel?: string
  ) => {
    setActiveMainTab(targetTab);
    setSelectedStatusFilter(statusFilter);
    setSelectedCertFilter(certFilter);
    setActiveCardFilterName(filterLabel ? filterLabel : null);

    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, listSectionY - 14),
        animated: true,
      });
    }, 60);
  };

  const handleClearCardFilter = () => {
    setSelectedStatusFilter('All');
    setSelectedCertFilter('All');
    setActiveCardFilterName(null);
  };

  // Base list of farmers: Sub Warehouse is scoped to Coonoor
  const scopedFarmers = isSubWarehouse
    ? mappedFarmers.filter(
        (f) =>
          f.location?.toLowerCase() === 'coonoor' ||
          f.zone?.toLowerCase() === 'coonoor'
      )
    : mappedFarmers;

  // Filtered farmers
  const filteredFarmers = scopedFarmers.filter((f) => {
    if (
      !isSubWarehouse &&
      selectedZoneFilter !== 'All' &&
      f.location &&
      f.location.toLowerCase() !== selectedZoneFilter.toLowerCase()
    ) {
      return false;
    }
    if (selectedStatusFilter !== 'All') {
      if (selectedStatusFilter === 'Active' && f.status !== 'ACTIVE') return false;
      if (selectedStatusFilter === 'Inactive' && f.status !== 'DISABLED') return false;
      if (selectedStatusFilter === 'Disabled' && f.status !== 'DISABLED') return false;
      if (selectedStatusFilter === 'Pending' && f.status !== 'PENDING') return false;
    }
    if (selectedCertFilter !== 'All') {
      if (selectedCertFilter === 'Expired' && f.certStatus !== 'Expired' && !f.hasExpiredCert) return false;
      if (selectedCertFilter === 'Pending' && f.certStatus !== 'Pending') return false;
      if (selectedCertFilter === 'Verified' && f.certStatus !== 'Verified') return false;
    }
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
  const filteredApplications = mappedApplications.filter((a) => {
    if (selectedStatusFilter !== 'All') {
      if (selectedStatusFilter === 'Pending' && a.status !== 'Pending') return false;
      if (selectedStatusFilter === 'Correction Required' && a.status !== 'Correction Required') return false;
      if (selectedStatusFilter === 'Approved' && a.status !== 'Approved') return false;
      if (selectedStatusFilter === 'Rejected' && a.status !== 'Rejected') return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      (a.code && a.code.toLowerCase().includes(q)) ||
      (a.applicantName && a.applicantName.toLowerCase().includes(q)) ||
      (a.crops && a.crops.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header Banner in Brand Orange #F0562A ─── */}
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
              <Text style={styles.headerTitle}>{displayTitle}</Text>
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
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── RBAC Stat Cards Grid (Reference Image 5 styling) ─── */}
        {isFullAdmin ? (
          // 8 Summary Metric Cards for Super Admin & TOHFA Admin (Images 1, 2, 5)
          <OverviewCardsGrid style={{ marginBottom: adminSpacing.md }}>
            <OverviewDashboardCard
              value={farmerSummaryQuery.summary?.totalFarmers != null ? String(farmerSummaryQuery.summary.totalFarmers) : ADMIN_NO_VALUE}
              title="Total Farmers"
              icon="users"
              titlePosition="bottom"
              onPress={() => handleCardPress('farmers', 'All', 'All', 'Total Farmers')}
            />
            <OverviewDashboardCard
              value={farmerSummaryQuery.summary?.pendingApplications != null ? String(farmerSummaryQuery.summary.pendingApplications) : ADMIN_NO_VALUE}
              title="Pending Applications"
              icon="clipboard"
              titlePosition="bottom"
              onPress={() => handleCardPress('applications', 'Pending', 'All', 'Pending Applications')}
            />
            <OverviewDashboardCard
              value={farmerSummaryQuery.summary?.activeFarmers != null ? String(farmerSummaryQuery.summary.activeFarmers) : ADMIN_NO_VALUE}
              title="Active Farmers"
              icon="users"
              titlePosition="bottom"
              onPress={() => handleCardPress('farmers', 'Active', 'All', 'Active Farmers')}
            />
            <OverviewDashboardCard
              value={farmerSummaryQuery.summary?.deactivatedFarmers != null ? String(farmerSummaryQuery.summary.deactivatedFarmers) : ADMIN_NO_VALUE}
              title="Deactivated"
              icon="alert"
              tone="danger"
              titlePosition="bottom"
              onPress={() => handleCardPress('farmers', 'Disabled', 'All', 'Deactivated')}
            />
            <OverviewDashboardCard
              value={farmerSummaryQuery.summary?.inactiveFarmers != null ? String(farmerSummaryQuery.summary.inactiveFarmers) : ADMIN_NO_VALUE}
              title="Inactive"
              icon="users"
              titlePosition="bottom"
              onPress={() => handleCardPress('farmers', 'Inactive', 'All', 'Inactive')}
            />
            <OverviewDashboardCard
              value={farmerSummaryQuery.summary?.expiredCertifications != null ? String(farmerSummaryQuery.summary.expiredCertifications) : ADMIN_NO_VALUE}
              title="Expired Certifications"
              icon="clipboard"
              tone="danger"
              titlePosition="bottom"
              onPress={() => handleCardPress('farmers', 'All', 'Expired', 'Expired Certifications')}
            />
            <OverviewDashboardCard
              value={farmerSummaryQuery.summary?.activeSubscriptions != null ? String(farmerSummaryQuery.summary.activeSubscriptions) : ADMIN_NO_VALUE}
              title="Subscription Overview"
              icon="users"
              titlePosition="bottom"
              onPress={() => {
                if (onOpenSubscriptionOverview) onOpenSubscriptionOverview();
                else handleCardPress('farmers', 'Active', 'All', 'Subscription Overview');
              }}
            />
            <OverviewDashboardCard
              value={farmerSummaryQuery.summary?.approvalInbox != null ? String(farmerSummaryQuery.summary.approvalInbox) : ADMIN_NO_VALUE}
              title="Approval Inbox"
              icon="clipboard"
              titlePosition="bottom"
              onPress={() => {
                if (onOpenApprovalInbox) onOpenApprovalInbox();
                else handleCardPress('applications', 'Pending', 'All', 'Approval Inbox');
              }}
            />
          </OverviewCardsGrid>
        ) : (
          // 4 Summary Metric Cards for Farmer Admin & Warehouse Admins (Images 3, 4)
          <OverviewCardsGrid style={{ marginBottom: adminSpacing.md }}>
            <OverviewDashboardCard
              value={farmerSummaryQuery.summary?.totalFarmers != null ? String(farmerSummaryQuery.summary.totalFarmers) : ADMIN_NO_VALUE}
              title="ALL FARMERS"
              icon="users"
              titlePosition="bottom"
              onPress={() => handleCardPress('farmers', 'All', 'All', 'All Farmers')}
            />
            <OverviewDashboardCard
              value={farmerSummaryQuery.summary?.activeFarmers != null ? String(farmerSummaryQuery.summary.activeFarmers) : ADMIN_NO_VALUE}
              title="ACTIVE"
              icon="users"
              tone="success"
              titlePosition="bottom"
              onPress={() => handleCardPress('farmers', 'Active', 'All', 'Active')}
            />
            <OverviewDashboardCard
              value={farmerSummaryQuery.summary?.pendingApplications != null ? String(farmerSummaryQuery.summary.pendingApplications) : ADMIN_NO_VALUE}
              title="PENDING APPROVAL"
              icon="clipboard"
              tone="warning"
              titlePosition="bottom"
              onPress={() => {
                if (canViewApplications) {
                  handleCardPress('applications', 'Pending', 'All', 'Pending Approval');
                } else {
                  handleCardPress('farmers', 'Pending', 'All', 'Pending Approval');
                }
              }}
            />
            <OverviewDashboardCard
              value={farmerSummaryQuery.summary?.inactiveFarmers != null ? String(farmerSummaryQuery.summary.inactiveFarmers) : ADMIN_NO_VALUE}
              title="INACTIVE"
              icon="alert"
              titlePosition="bottom"
              onPress={() => handleCardPress('farmers', 'Inactive', 'All', 'Inactive')}
            />
          </OverviewCardsGrid>
        )}

        {/* ─── Farmers by Zone (Only for Super Admin & TOHFA Admin) ─── */}
        {isFullAdmin && (farmerSummaryQuery.summary?.zones?.length ?? 0) > 0 && (
          <View style={styles.zoneCard}>
            <View style={styles.zoneHeader}>
              <LocationPinIcon size={18} color={adminColors.brand} />
              <Text style={styles.zoneHeaderTitle}>Farmers by Zone</Text>
            </View>
            <View style={styles.zoneList}>
              {(farmerSummaryQuery.summary?.zones ?? []).map((z) => (
                <View key={z.name} style={styles.zoneRow}>
                  <Text style={styles.zoneName}>{z.name}</Text>
                  <View style={styles.zoneBarTrack}>
                    <View
                      style={[
                        styles.zoneBarFill,
                        { width: `${Math.round(z.ratio * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.zoneCount}>{z.count}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={styles.zoneFooter}
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={styles.zoneFooterText}>View Zones →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Quick Access Grid (Only for Super Admin & TOHFA Admin) ─── */}
        {isFullAdmin && (
          <View style={styles.quickAccessSection}>
            <Text style={styles.sectionTitle}>Quick Access</Text>
            <View style={styles.quickAccessGrid}>
              <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={onOpenFarmRecords}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <View style={styles.quickAccessIconWrap}>
                  <DocumentTextIcon size={22} color={adminColors.brand} />
                </View>
                <Text style={styles.quickAccessLabel} numberOfLines={2}>
                  Farm Records
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={onOpenVerificationCompliance}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <View style={styles.quickAccessIconWrap}>
                  <ShieldCheckIcon size={22} color={adminColors.brand} />
                </View>
                <Text style={styles.quickAccessLabel} numberOfLines={2}>
                  Verification &amp; Compliance
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={onOpenApplications ? onOpenApplications : () => handleCardPress('applications', 'All', 'All', 'Applications')}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <View style={styles.quickAccessIconWrap}>
                  <UsersIcon size={22} color={adminColors.brand} />
                </View>
                <Text style={styles.quickAccessLabel} numberOfLines={2}>
                  Farmer&apos;s &amp; Applications
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickAccessCard}
                onPress={onAddFarmer}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <View style={styles.quickAccessIconWrap}>
                  <PlusIcon size={22} color={adminColors.brand} />
                </View>
                <Text style={styles.quickAccessLabel} numberOfLines={2}>
                  Add Farmer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── Target Anchor for Scroll Down ─── */}
        <View onLayout={(e) => setListSectionY(e.nativeEvent.layout.y)}>
          {/* Active Card Filter Banner */}
          {activeCardFilterName && (
            <View style={styles.activeFilterBanner}>
              <Text style={styles.activeFilterText}>
                Showing: <Text style={styles.activeFilterBold}>{activeCardFilterName}</Text>
              </Text>
              <TouchableOpacity
                style={styles.activeFilterClearBtn}
                onPress={handleClearCardFilter}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Clear Filter"
              >
                <Text style={styles.activeFilterClearText}>✕ Clear filter</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ─── Tab Switcher: [Farmers] | [Applications] (RBAC-aware) ─── */}
          {canViewApplications && (
            <View style={styles.tabToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.tabToggleButton,
                  activeMainTab === 'farmers' && styles.tabToggleButtonActive,
                ]}
                onPress={() => {
                  setActiveMainTab('farmers');
                  handleClearCardFilter();
                }}
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
                onPress={() => {
                  setActiveMainTab('applications');
                  handleClearCardFilter();
                }}
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

          {/* ─── Search Bar ─── */}
          <View style={styles.searchBarRow}>
            <View style={styles.searchInputBox}>
              <SearchMagnifierIcon />
              <TextInput
                style={styles.searchInput}
                placeholder="Search common or scientific name"
                placeholderTextColor={adminColors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity
              style={styles.searchFilterBtn}
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Filter"
            >
              <FilterSlidersIcon size={18} color={adminColors.brand} />
            </TouchableOpacity>
          </View>

          {/* Results count label */}
          {((activeMainTab === 'farmers' && farmersViewState === 'ready') ||
            (activeMainTab === 'applications' && applicationsViewState === 'ready')) && (
            <Text style={styles.countText}>
              {activeMainTab === 'farmers'
                ? `${filteredFarmers.length} farmers`
                : `${filteredApplications.length} applications`}
            </Text>
          )}

          {/* ─── Content for FARMERS tab ─── */}
          {activeMainTab === 'farmers' && (
            <>
              {farmersViewState === 'loading' && <AdminLoadingState />}
              {farmersViewState === 'error' && (
                <AdminErrorState
                  error={farmerListQuery.error}
                  onRetry={farmerListQuery.refresh}
                />
              )}
              {farmersViewState === 'empty' && (
                <AdminEmptyState title={t('farmersList.empty.farmers')} />
              )}
              {farmersViewState === 'ready' &&
                (filteredFarmers.length === 0 ? (
                  <AdminEmptyState title={t('farmersList.empty.farmersFiltered')} />
                ) : (
                  <View style={styles.cardsList}>
                    {filteredFarmers.map((farmer) => {
                      const isActive = farmer.status === 'ACTIVE';
                      const hasExpired = farmer.certStatus === 'Expired' || farmer.hasExpiredCert;

                      // Farmer Admin layout (Image 3: Avatar circle + 3-column stats row)
                      if (isFarmerAdmin) {
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
                            <View style={styles.cardTopRow}>
                              <View style={styles.cardAvatarCircle}>
                                <FarmerAvatarSilhouetteIcon size={20} color={adminColors.brand} />
                              </View>
                              <View style={styles.cardIdentityCol}>
                                <Text style={styles.cardFarmerName}>{farmer.name}</Text>
                                <Text style={styles.cardFarmerCodeZone}>
                                  {farmer.code ?? farmer.farmerId ?? ADMIN_NO_VALUE} · {farmer.location ?? ADMIN_NO_VALUE}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.cardDivider} />

                            <View style={styles.cardStatsRow}>
                              <View style={styles.cardStatCol}>
                                <Text style={styles.cardStatLabel}>Farming</Text>
                                <Text style={styles.cardStatValue}>{farmer.farmingType ?? ADMIN_NO_VALUE}</Text>
                              </View>
                              <View style={styles.cardStatCol}>
                                <Text style={styles.cardStatLabel}>Rating</Text>
                                <Text style={styles.cardStatValue}>{ratingText(farmer)}</Text>
                              </View>
                              <View style={styles.cardStatCol}>
                                <Text style={styles.cardStatLabel}>Status</Text>
                                <Text
                                  style={[
                                    styles.cardStatValue,
                                    isActive ? styles.statusActiveText : styles.statusPendingText,
                                  ]}
                                >
                                  {t(statusLabelKey(farmer.status))}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      }

                      // Super Admin, TOHFA Admin, and Warehouse Admins (Images 1, 2, 4)
                      return (
                        <TouchableOpacity
                          key={farmer.id}
                          style={styles.farmerCardClean}
                          activeOpacity={0.8}
                          onPress={() => {
                            onViewChange?.('profile');
                            onSelectFarmer?.(farmer);
                          }}
                        >
                          <View style={styles.cardHeaderRow}>
                            <Text style={styles.farmerNameBold}>{farmer.name}</Text>
                            <View
                              style={
                                isActive
                                  ? styles.statusPillActive
                                  : styles.statusPillDisabled
                              }
                            >
                              <Text
                                style={
                                  isActive
                                    ? styles.statusPillActiveText
                                    : styles.statusPillDisabledText
                                }
                              >
                                {t(statusLabelKey(farmer.status))}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.cardSubText}>
                            {farmer.code ?? farmer.farmerId ?? ADMIN_NO_VALUE} · {farmer.location ?? ADMIN_NO_VALUE} · {farmer.farmingType ?? ADMIN_NO_VALUE}
                          </Text>

                          <View style={styles.farmerCardBottomRow}>
                            <Text style={styles.farmerRatingText}>
                              {farmer.kycVerifiedText ?? ADMIN_NO_VALUE} · {ratingText(farmer)}
                            </Text>
                            {hasExpired ? (
                              <View style={styles.expiredOutlinedPill}>
                                <Text style={styles.expiredOutlinedPillText}>Certification expired</Text>
                              </View>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
            </>
          )}

          {/* ─── Content for APPLICATIONS tab ─── */}
          {activeMainTab === 'applications' && (
            <>
              {applicationsViewState === 'loading' && <AdminLoadingState />}
              {applicationsViewState === 'error' && (
                <AdminErrorState
                  error={applicationListQuery.error}
                  onRetry={applicationListQuery.refresh}
                />
              )}
              {applicationsViewState === 'empty' && (
                <AdminEmptyState title={t('farmersList.empty.applications')} />
              )}
              {applicationsViewState === 'ready' &&
                (filteredApplications.length === 0 ? (
                  <AdminEmptyState title={t('farmersList.empty.applicationsSearch')} />
                ) : (
                  <View style={styles.cardsList}>
                    {filteredApplications.map((app) => {
                      const isPending = app.status === 'Pending';
                      const isCorrection = app.status === 'Correction Required';

                      return (
                        <View key={app.id} style={styles.applicationCard}>
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
                            {app.code} · {app.phone} · {app.farmingType}
                          </Text>

                          <Text style={styles.cardDetailText}>
                            Submitted {app.submittedDate} · {app.kycStatus}
                          </Text>

                          {/* Review Application Action Button (Images 1, 2) */}
                          {isFullAdmin && (
                            <TouchableOpacity
                              style={styles.reviewApplicationBtn}
                              onPress={() => onReviewApplication?.(app)}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.reviewApplicationBtnText}>Review Application</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
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
  zoneCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
  },
  zoneHeaderTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  zoneList: {
    gap: adminSpacing.xs,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zoneName: {
    ...adminType.rowMeta,
    color: adminColors.ink,
    width: 60,
  },
  zoneBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginHorizontal: adminSpacing.sm,
    overflow: 'hidden',
  },
  zoneBarFill: {
    height: '100%',
    backgroundColor: '#8B4513',
    borderRadius: 4,
  },
  zoneCount: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    width: 40,
    textAlign: 'right',
  },
  zoneFooter: {
    marginTop: adminSpacing.sm,
    paddingTop: adminSpacing.xs,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    alignItems: 'flex-end',
  },
  zoneFooterText: {
    ...adminType.rowMeta,
    color: adminColors.brand,
    fontWeight: '600',
  },
  quickAccessSection: {
    marginBottom: adminSpacing.lg,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
    fontSize: 16,
    fontWeight: '700',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  quickAccessCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
    ...adminShadow.sm,
  },
  quickAccessIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF1EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.xs,
  },
  quickAccessLabel: {
    ...adminType.rowMeta,
    color: adminColors.ink,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 12,
  },
  activeFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF4EC',
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 8,
    marginBottom: adminSpacing.sm,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  activeFilterText: {
    fontSize: 12.5,
    color: '#9A3412',
  },
  activeFilterBold: {
    fontWeight: '700',
    color: adminColors.brand,
  },
  activeFilterClearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#FFEDD5',
  },
  activeFilterClearText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: adminColors.brand,
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
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
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
  searchFilterBtn: {
    width: 42,
    height: 42,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  farmerCardClean: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  farmerNameBold: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  farmerCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  farmerRatingText: {
    fontSize: 12.5,
    color: adminColors.muted,
  },
  statusPillActive: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillActiveText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
  },
  statusPillDisabled: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillDisabledText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
  },
  expiredOutlinedPill: {
    borderWidth: 1,
    borderColor: '#F87171',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  expiredOutlinedPillText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '600',
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
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 12.5,
    marginBottom: 2,
  },
  cardDetailText: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  reviewApplicationBtn: {
    marginTop: adminSpacing.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewApplicationBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeCorrection: {
    backgroundColor: '#EFF6FF',
  },
  statusBadgeApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  statusBadgeTextPending: {
    color: '#D97706',
  },
  statusBadgeTextCorrection: {
    color: '#2563EB',
  },
  statusBadgeTextApproved: {
    color: '#166534',
  },
  bottomNavContainer: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navTabLabel: {
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 3,
    fontWeight: '500',
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
    padding: adminSpacing.xl,
  },
  filterModalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.xl,
  },
  filterModalTitle: {
    ...adminType.sectionHead,
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: adminSpacing.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: adminRadius.sm,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: adminColors.ink,
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
  },
  filterModalCloseBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: adminSpacing.md,
  },
  filterModalCloseBtnText: {
    color: adminColors.onBrand,
    fontWeight: '700',
    fontSize: 14,
  },
});
