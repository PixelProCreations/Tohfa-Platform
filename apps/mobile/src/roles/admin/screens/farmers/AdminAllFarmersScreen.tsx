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

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FarmersManagementHeaderIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

// Bottom Nav Icons matching Image 1
function NavHomeIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </Svg>
  );
}

function NavWorkQueueIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 11l3 3L22 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function NavOperationsIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="20" x2="18" y2="10" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="12" y1="20" x2="12" y2="4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="6" y1="20" x2="6" y2="14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function NavFinanceIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M2 10h20" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

function NavMoreIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
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
  id: string;
  name: string;
  code: string;
  initials: string;
  farmName?: string;
  location: string;
  status: 'ACTIVE' | 'DISABLED';
  rating: number | null;
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
  docsCount: string;
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
    code: 'FMR-00124',
    initials: 'RK',
    farmName: 'Mixed vegetable farm.',
    location: 'Coonoor',
    farmingType: 'Natural',
    status: 'ACTIVE',
    rating: 3.0,
    ratingTier: 'Good',
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
    code: 'FMR-00131',
    initials: 'S',
    farmName: 'Organic Tea & Veggies',
    location: 'Coonoor',
    farmingType: 'Organic',
    status: 'ACTIVE',
    rating: 4.0,
    ratingTier: 'Excellent',
    mobile: '+91 98765 43211',
    aadhaar: 'XXXX XXXX 1928',
    memberSince: '15 Feb 2026',
    subscription: 'Active · Paid',
    kycVerifiedText: 'KYC Pending',
    hasExpiredCert: false,
  },
  {
    id: 'fmr-00109',
    name: 'Revathi',
    code: 'FMR-00109',
    initials: 'R',
    farmName: 'Ooty Hills Organic',
    location: 'Ooty',
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
    id: 'fmr-00140',
    name: 'Vijay Anand',
    code: 'FMR-00140',
    initials: 'VA',
    farmName: 'Wild Eden Organic Farms',
    location: 'Ooty',
    farmingType: 'Organic',
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
];

export const DEMO_APPLICATIONS: ApplicationListItem[] = [
  {
    id: 'app-2026-0101',
    name: 'Sathish Kumar Farm',
    applicantName: 'Sathish Kumar',
    code: 'APP-2026-0101',
    status: 'Pending',
    phone: '+91 99801 00100',
    address: 'Thottam Street, Ooty',
    zone: 'Ooty, zone A',
    farmingType: 'Natural',
    crops: 'Carrot, Cabbage',
    submittedDate: '05 Oct 2026',
    kycStatus: 'KYC Pending',
    docsCount: 'Docs 0/3',
    landArea: '1.8 acres',
    fmbSketch: 'Missing',
    reviewNotes: 'Waiting on document verification.',
    identityProofNumber: 'XXXX XXXX 4821',
    identityProofStatus: 'Pending',
  },
  {
    id: 'app-2026-0105',
    name: 'Hari Organic',
    applicantName: 'Hari Organic',
    code: 'APP-2026-0105',
    status: 'Correction Required',
    phone: '+91 99801 00105',
    address: 'Green Valley, Coonoor',
    zone: 'Coonoor, zone B',
    farmingType: 'Organic',
    crops: 'Potato, Beetroot',
    submittedDate: '29 Sep 2026',
    kycStatus: 'KYC Pending',
    docsCount: 'Docs 2/3',
    landArea: '2.5 acres',
    fmbSketch: 'Provided',
    reviewNotes: 'Correction required in bank passbook.',
    identityProofNumber: 'XXXX XXXX 3390',
    identityProofStatus: 'Pending',
  },
  {
    id: 'app-2026-0107',
    name: 'Prakash Farmer',
    applicantName: 'Prakash Farmer',
    code: 'APP-2026-0107',
    status: 'Approved',
    phone: '+91 99801 00107',
    address: 'Hill Top, Kotagiri',
    zone: 'Kotagiri, zone C',
    farmingType: 'Organic',
    crops: 'Broccoli, Lettuce',
    submittedDate: '20 Sep 2026',
    approvedDate: '10 Oct 2026',
    kycStatus: 'KYC Verified',
    docsCount: 'Docs 3/3',
    landArea: '2.0 acre',
    fmbSketch: 'fmb-0101.pdf',
    reviewNotes: 'All requirements met. Ready for approval.',
    identityProofNumber: 'XXXX XXXX 0000',
    identityProofStatus: 'Verified',
  },
];

interface Props {
  onBack?: () => void;
  onSelectFarmer: (farmer: FarmerListItem) => void;
  onReviewApplication?: (application: ApplicationListItem) => void;
  onNavigateTab?: (tab: 'Dashboard' | 'Farmers' | 'Sales' | 'Reports' | 'Profile') => void;
  showBottomNav?: boolean;
}

export const AdminAllFarmersScreen: React.FC<Props> = ({
  onBack,
  onSelectFarmer,
  onReviewApplication,
  onNavigateTab,
  showBottomNav = false,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'farmers' | 'applications'>('farmers');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Filtered farmers
  const filteredFarmers = DEMO_ALL_FARMERS.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.code.toLowerCase().includes(q) ||
      f.location.toLowerCase().includes(q) ||
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
            {activeMainTab === 'farmers' ? (
              <FarmersManagementHeaderIcon />
            ) : (
              <FarmApplicationsHeaderIcon />
            )}
            <Text style={styles.headerTitle}>
              {activeMainTab === 'farmers' ? 'Farmers Management' : 'Farm Applications'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 4 Summary Metric Cards (2x2 Grid matching Screenshots) ─── */}
        <View style={styles.metricsGrid}>
          {/* Card 1: ALL FARMERS */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>ALL FARMERS</Text>
            <Text style={[styles.metricValue, { color: adminColors.ink }]}>245</Text>
          </View>

          {/* Card 2: ACTIVE */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>ACTIVE</Text>
            <Text style={[styles.metricValue, { color: adminColors.success.text }]}>221</Text>
          </View>

          {/* Card 3: PENDING APPROVEL */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>PENDING APPROVEL</Text>
            <Text style={[styles.metricValue, { color: adminColors.warning.text }]}>12</Text>
          </View>

          {/* Card 4: INACTIVE */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>INACTIVE</Text>
            <Text style={[styles.metricValue, { color: adminColors.ink }]}>12</Text>
          </View>
        </View>

        {/* ─── Tab Switcher: [Farmers] | [Applications] ─── */}
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

        {/* ─── Search Bar with Filter Icon ─── */}
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
            style={styles.filterBtn}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.7}
          >
            <FilterSlidersIcon />
          </TouchableOpacity>
        </View>

        {/* ─── Content for FARMERS tab ─── */}
        {activeMainTab === 'farmers' && (
          <View style={styles.tabContentSection}>
            <Text style={styles.countText}>24 of 24 farmers</Text>

            <View style={styles.cardsList}>
              {filteredFarmers.map((farmer) => {
                const isActive = farmer.status === 'ACTIVE';
                return (
                  <TouchableOpacity
                    key={farmer.id}
                    style={styles.farmerCard}
                    activeOpacity={0.8}
                    onPress={() => onSelectFarmer(farmer)}
                  >
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardName}>{farmer.name}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isActive ? styles.statusBadgeTextActive : styles.statusBadgeTextInactive,
                          ]}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardSubText}>
                      {farmer.code} · {farmer.location} · {farmer.farmingType ?? 'Natural'}
                    </Text>

                    <Text style={styles.cardDetailText}>
                      {farmer.kycVerifiedText ?? 'KYC Verified'} · ★ {farmer.rating?.toFixed(1) ?? '3.0'}
                    </Text>

                    {farmer.hasExpiredCert && (
                      <View style={styles.expiredBadge}>
                        <Text style={styles.expiredBadgeText}>Certification expired</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── Content for APPLICATIONS tab ─── */}
        {activeMainTab === 'applications' && (
          <View style={styles.tabContentSection}>
            <Text style={styles.countText}>8 application</Text>

            <View style={styles.cardsList}>
              {filteredApplications.map((app) => {
                const isPending = app.status === 'Pending';
                const isCorrection = app.status === 'Correction Required';
                const isApproved = app.status === 'Approved';

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
                      Submitted {app.submittedDate} · {app.kycStatus} · {app.docsCount}
                    </Text>

                    {!isApproved && (
                      <TouchableOpacity
                        style={styles.reviewAppBtn}
                        onPress={() => onReviewApplication?.(app)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.reviewAppBtnText}>Review Application</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>

      {/* ─── Optional Standalone Bottom Navigation Bar ─── */}
      {showBottomNav && (
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => onNavigateTab?.('Dashboard')}
            activeOpacity={0.7}
          >
            <NavHomeIcon />
            <Text style={styles.navTabLabel}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navTabItem} activeOpacity={0.7}>
            <NavWorkQueueIcon />
            <Text style={styles.navTabLabel}>Work Queue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => onNavigateTab?.('Farmers')}
            activeOpacity={0.7}
          >
            <NavOperationsIcon />
            <Text style={styles.navTabLabel}>Operations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => onNavigateTab?.('Sales')}
            activeOpacity={0.7}
          >
            <NavFinanceIcon />
            <Text style={styles.navTabLabel}>Finance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTabItem}
            onPress={() => onNavigateTab?.('Profile')}
            activeOpacity={0.7}
          >
            <NavMoreIcon />
            <Text style={[styles.navTabLabel, styles.navTabLabelActive]}>More</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="fade">
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalCard}>
            <Text style={styles.filterModalTitle}>Filter Options</Text>
            <Text style={styles.filterModalBody}>Filter by zone, farming method, KYC state, or compliance tier.</Text>
            <TouchableOpacity
              style={styles.filterModalCloseBtn}
              onPress={() => setShowFilterModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.filterModalCloseBtnText}>Done</Text>
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
    paddingTop: 6,
    paddingBottom: adminSpacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backButton: {
    padding: 4,
    marginRight: 4,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 19,
    fontWeight: '800',
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: adminColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
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
    marginBottom: adminSpacing.md,
  },
  searchInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 9,
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
  filterBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  tabContentSection: {},
  countText: {
    fontSize: 11,
    fontWeight: '500',
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  cardsList: {
    gap: adminSpacing.sm,
  },
  farmerCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
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
    color: '#D97706',
  },
  statusBadgeTextCorrection: {
    color: '#1565C0',
  },
  statusBadgeTextApproved: {
    color: '#2E7D32',
  },
  expiredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
    marginTop: 2,
  },
  expiredBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D32F2F',
  },
  reviewAppBtn: {
    marginTop: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAppBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.brand,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingTop: 8,
    paddingBottom: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 2,
  },
  navTabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: adminColors.muted,
  },
  navTabLabelActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.xl,
  },
  filterModalCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.xl,
    width: '100%',
    maxWidth: 340,
    gap: adminSpacing.md,
  },
  filterModalTitle: {
    ...adminType.sectionHead,
    fontSize: 16,
    color: adminColors.ink,
  },
  filterModalBody: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.muted,
  },
  filterModalCloseBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterModalCloseBtnText: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
});
