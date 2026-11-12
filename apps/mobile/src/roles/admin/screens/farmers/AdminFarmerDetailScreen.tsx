import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { CalendarIcon } from '../../components/AdminIcons';
import { AdminCalendarPickerModal } from '../../components/AdminCalendarPickerModal';
import { type Can } from '../../permissions/can';
import type { FarmerListItem } from './AdminAllFarmersScreen';
import { AdminEditFarmerScreen } from './AdminEditFarmerScreen';
import { AdminAddFarmRecordScreen, type AddRecordTab } from './AdminAddFarmRecordScreen';
import { AdminEditFarmRecordScreen, type EditFarmRecordData } from './AdminEditFarmRecordScreen';
import { FarmRecordsSection } from './FarmRecordsSection';

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocumentIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BanAlertIcon({ size = 18, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function LockIcon({ size = 15, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="11" width="16" height="11" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export type FarmerDetailTabType =
  | 'Overview'
  | 'Farm'
  | 'KYC'
  | 'Ratings'
  | 'Subscription'
  | 'Verification & Compliance'
  | 'Farmer Records'
  | 'Audit'
  | 'History'
  | 'Personal'
  | 'Farm & land'
  | 'Soil'
  | 'Product listing';

export interface CategoryRating {
  id: string;
  name: string;
  score: number;
  max: number;
  notes?: string;
}

export const DEFAULT_CATEGORY_RATINGS: CategoryRating[] = [
  { id: 'cert', name: 'Certification & Compliance', score: 8, max: 10 },
  { id: 'soil', name: 'Soil & Land Management', score: 7, max: 10 },
  { id: 'farming', name: 'Farming Practices', score: 8, max: 10 },
  { id: 'env', name: 'Environmental Sustainability', score: 7, max: 10 },
  { id: 'produce', name: 'Produce Quality & Yield', score: 8, max: 10 },
  { id: 'trace', name: 'Traceability & Transparency', score: 9, max: 10 },
  { id: 'social', name: 'Social & Labor Practices', score: 7, max: 10 },
  { id: 'finance', name: 'Financial & Operational', score: 8, max: 10 },
  { id: 'market', name: 'Market & Buyer Relations', score: 8, max: 10 },
  { id: 'innov', name: 'Innovation & Improvement', score: 8, max: 10 },
];

export interface AdminFarmerDetailScreenProps {
  farmer?: FarmerListItem | undefined;
  farmerId?: string | undefined;
  farmerName?: string | undefined;
  onBack: () => void;
  onEdit?: ((currentTab: FarmerDetailTabType) => void) | undefined;
  onDisable?: (() => void) | undefined;
  onOpenFarmMap?: (() => void) | undefined;
  onOpenKycReview?: (() => void) | undefined;
  onOpenRatingScorecard?: (() => void) | undefined;
  onNavigateAuditHistory?: (() => void) | undefined;
  initialTab?: FarmerDetailTabType | undefined;
  onTabChange?: ((tab: FarmerDetailTabType) => void) | undefined;
  can?: Can | undefined;
  role?: string | undefined;
  userScope?: unknown;
}

type Props = AdminFarmerDetailScreenProps;

export const AdminFarmerDetailScreen: React.FC<Props> = ({
  farmer: passedFarmer,
  farmerId,
  farmerName,
  onBack,
  can,
  role,
  userScope: _userScope,
  onEdit,
  onDisable,
  onOpenFarmMap,
  onOpenKycReview,
  onOpenRatingScorecard,
  onNavigateAuditHistory: _onNavigateAuditHistory,
  initialTab = 'Personal',
  onTabChange,
}) => {
  const farmer: FarmerListItem = React.useMemo(
    () =>
      passedFarmer || ({
        id: farmerId || 'f1',
        name: farmerName || 'Farmer',
        farmName: 'Ramesh Kumar Farm',
        code: 'FMR-00124',
        location: 'Coonoor, Nilgiris',
        phone: '+91 98765 00124',
        mobile: '+91 98765 00124',
        status: 'ACTIVE',
        rating: 4.5,
        cropCount: 3,
        landSize: '4.25 acres',
      } as unknown as FarmerListItem),
    [passedFarmer, farmerId, farmerName],
  );
  const normalizeTab = (tab?: FarmerDetailTabType): FarmerDetailTabType => {
    if (!tab || tab === 'Overview') return 'Personal';
    if (tab === 'Farm') return 'Farm & land';
    return tab;
  };

  const normalizeStatus = (raw?: string): 'ACTIVE' | 'DISABLED' =>
    raw?.toUpperCase() === 'DISABLED' ? 'DISABLED' : 'ACTIVE';

  const resolvedFarmer: FarmerListItem = farmer
    ? {
        id: farmer.id || farmer.farmerId || farmerId || 'FARM-001',
        name: farmer.name || farmerName || 'Farmer',
        phone: farmer.phone || '+91 98765 43210',
        status: normalizeStatus(farmer.status || farmer.accountStatus),
        registeredDate: farmer.registeredDate || '12 Jan 2026',
        farmSize: farmer.farmSize || '5.5 Acres',
        zone: farmer.zone || 'Ooty North',
        crops: farmer.crops || ['Carrot', 'Potato'],
        rating: farmer.rating || '4.8',
        kycStatus: farmer.kycStatus || 'VERIFIED',
        disputeCount: farmer.disputeCount || 0,
        ...(farmer.certStatus ? { certStatus: farmer.certStatus } : {}),
        ...(farmer.hasExpiredCert !== undefined ? { hasExpiredCert: farmer.hasExpiredCert } : {}),
      }
    : {
        id: farmerId || 'FARM-001',
        name: farmerName || 'Farmer',
        phone: '+91 98765 43210',
        status: 'ACTIVE',
        registeredDate: '12 Jan 2026',
        farmSize: '5.5 Acres',
        zone: 'Ooty North',
        crops: ['Carrot', 'Potato'],
        rating: '4.8',
        kycStatus: 'VERIFIED',
        disputeCount: 0,
      };

  const [currentFarmer, setCurrentFarmer] = useState<FarmerListItem>(resolvedFarmer);
  const [activeTab, setActiveTab] = useState<FarmerDetailTabType>(normalizeTab(initialTab));
  const [accountStatus, setAccountStatus] = useState<'Active' | 'Inactive' | 'Disabled' | 'Terminated'>(
    resolvedFarmer.status === 'DISABLED' ? 'Disabled' : 'Active'
  );

  useEffect(() => {
    setCurrentFarmer({
      id: farmer.id || farmer.farmerId || farmerId || 'FARM-001',
      name: farmer.name || farmerName || 'Farmer',
      phone: farmer.phone || farmer.mobile || '+91 98765 43210',
      mobile: farmer.mobile || farmer.phone || '+91 90000 20000',
      location: farmer.location || farmer.zone || 'Coonoor',
      status: normalizeStatus(farmer.status || farmer.accountStatus),
      registeredDate: farmer.registeredDate || '12 Jan 2026',
      farmSize: farmer.farmSize || '5.5 Acres',
      zone: farmer.zone || 'Ooty North',
      crops: farmer.crops || ['Carrot', 'Potato'],
      rating: farmer.rating || '4.8',
      kycStatus: farmer.kycStatus || 'VERIFIED',
      disputeCount: farmer.disputeCount || 0,
      ...(farmer.certStatus ? { certStatus: farmer.certStatus } : {}),
      ...(farmer.hasExpiredCert !== undefined ? { hasExpiredCert: farmer.hasExpiredCert } : {}),
    });
  }, [farmer]);

  // Edit Farm Rating & Profile states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingRating, setIsEditingRating] = useState(false);
  const [categoryRatings, setCategoryRatings] = useState<CategoryRating[]>(DEFAULT_CATEGORY_RATINGS);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('cert');

  const totalRatingScore = categoryRatings.reduce((sum, item) => sum + item.score, 0);

  // RBAC: Profile edits and account actions are gated by permission codes from docs/rbac.json.
  const canEditProfile = Boolean(
    can ? (can('farmer.profile.edit') || can('farmer.profile.edit_locked_field')) : (role === 'TOHFA_ADMIN' || role === 'SUPER_ADMIN')
  );
  const canDisableAccount = Boolean(
    can ? (can('farmer.account.disable') || can('farmer.account.reactivate')) : (role === 'TOHFA_ADMIN' || role === 'SUPER_ADMIN')
  );
  const canEditRating = Boolean(
    can ? can('farmer.rating.edit') : (role === 'FARMER_ADMIN' || role === 'TOHFA_ADMIN' || role === 'SUPER_ADMIN')
  );

  useEffect(() => {
    setActiveTab(normalizeTab(initialTab));
  }, [initialTab]);

  // Tab scrollbar interactive state
  const tabScrollRef = useRef<ScrollView>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [trackWidth, setTrackWidth] = useState(200);
  const maxScrollWidthRef = useRef(150);

  // KYC accordion & document states (Images 4 & 5)
  const [kycIdentityOpen, setKycIdentityOpen] = useState(true);
  const [kycLandOpen, setKycLandOpen] = useState(false);
  const [kycBankOpen, setKycBankOpen] = useState(false);
  const [kycDocStatus, setKycDocStatus] = useState<
    Record<'aadhar' | 'voter' | 'land', 'Verified' | 'Unverified' | 'Rejected'>
  >({
    aadhar: 'Verified',
    voter: 'Verified',
    land: 'Verified',
  });
  const [kycPreviewDoc, setKycPreviewDoc] = useState<{
    key: 'aadhar' | 'voter' | 'land';
    title: string;
    docName: string;
    fileName: string;
  } | null>(null);
  const [liveHistoryEvents, setLiveHistoryEvents] = useState<
    Array<{ id: string; timeActor: string; action: string }>
  >([]);

  const isSuperAdmin = role === 'SUPER_ADMIN' || (can ? can('farmer.document.verify') : false);

  const tabs: { key: FarmerDetailTabType; label: string }[] = React.useMemo(() => {
    const list: { key: FarmerDetailTabType; label: string }[] = [
      { key: 'Personal', label: 'Personal' },
      { key: 'Farm & land', label: 'Farm & land' },
      { key: 'Soil', label: 'Soil' },
      { key: 'Product listing', label: 'Product listing' },
      { key: 'KYC', label: 'KYC' },
      { key: 'Ratings', label: 'Ratings' },
      { key: 'Subscription', label: 'Subscription' },
    ];
    if (isSuperAdmin) {
      list.push({ key: 'Verification & Compliance', label: 'Verification & Compliance' });
      list.push({ key: 'Farmer Records', label: 'Farmer Records' });
    }
    list.push({ key: 'Audit', label: 'Audit' }, { key: 'History', label: 'History' });
    return list;
  }, [isSuperAdmin]);

  useEffect(() => {
    const idx = tabs.findIndex((t) => t.key === activeTab);
    if (idx >= 3) {
      const timer = setTimeout(() => {
        tabScrollRef.current?.scrollTo({
          x: Math.max(0, idx * 96 - 40),
          animated: true,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [activeTab, tabs]);

  const handleTabScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const maxScroll = contentSize.width - layoutMeasurement.width;
    maxScrollWidthRef.current = maxScroll;
    if (maxScroll > 0) {
      const ratio = Math.max(0, Math.min(1, contentOffset.x / maxScroll));
      setScrollProgress(ratio);
    }
  };

  const handleTabPress = (tab: FarmerDetailTabType, index: number) => {
    setActiveTab(tab);
    onTabChange?.(tab);
    tabScrollRef.current?.scrollTo({
      x: Math.max(0, index * 85 - 40),
      animated: true,
    });
  };

  const thumbWidth = 70;
  const maxThumbTranslate = Math.max(0, trackWidth - thumbWidth);
  const thumbLeft = scrollProgress * maxThumbTranslate;

  // Modals state
  const [deactivateModalVisible, setDeactivateModalVisible] = useState(false);
  const [terminateModalVisible, setTerminateModalVisible] = useState(false);
  const [fmbPreviewModalVisible, setFmbPreviewModalVisible] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [flagModalVisible, setFlagModalVisible] = useState(false);
  const [correctionModalVisible, setCorrectionModalVisible] = useState(false);
  const [activeRecordId, setActiveRecordId] = useState('PLT-00124-1');

  // Form input states
  const [reasonInput, setReasonInput] = useState('');
  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [addRecordInitialTab, setAddRecordInitialTab] = useState<AddRecordTab | null>(null);
  const [editingRecordData, setEditingRecordData] = useState<EditFarmRecordData | null>(null);

  // Subscription extend & waive states (Image 4 & 5)
  const [extendBy, setExtendBy] = useState<'30 days' | '90 days' | '1 year'>('30 days');
  const [newExpiryDate, setNewExpiryDate] = useState('12 Apr 1982');
  const [expiryCalendarOpen, setExpiryCalendarOpen] = useState(false);
  const [extendReason, setExtendReason] = useState('Goodwill extension for a payment delay (demo).');
  const [waiveTarget, setWaiveTarget] = useState<'Current renewal (₹500.00)' | 'Full plan'>('Current renewal (₹500.00)');
  const [waiveReason, setWaiveReason] = useState('Waived as compensation for a platform outage (demo).');

  const handleExtendSubscription = () => {
    setLiveHistoryEvents((prev) => [
      {
        id: `hist-ext-${Date.now()}`,
        timeActor: 'Just now · Super Admin',
        action: `Subscription extended by ${extendBy} (new expiry ${newExpiryDate})`,
      },
      ...prev,
    ]);
    Alert.alert('Subscription Extended', `Farmer subscription extended by ${extendBy}. New expiry: ${newExpiryDate}.`);
  };

  const handleWaiveFee = () => {
    setLiveHistoryEvents((prev) => [
      {
        id: `hist-waive-${Date.now()}`,
        timeActor: 'Just now · Super Admin',
        action: `Subscription fee waived (${waiveTarget})`,
      },
      ...prev,
    ]);
    Alert.alert('Fee Waived', `Subscription fee waived for ${waiveTarget}.`);
  };

  const handleOpenDeactivateModal = () => {
    setReasonInput('');
    setInternalNoteInput('');
    setDeactivateModalVisible(true);
  };

  const handleConfirmDeactivate = () => {
    if (!reasonInput.trim()) {
      Alert.alert('Required', 'Please enter a reason for deactivation.');
      return;
    }
    setAccountStatus('Inactive');
    setDeactivateModalVisible(false);
    onDisable?.();
    Alert.alert('Success', 'Farmer account has been deactivated.');
  };

  const handleOpenTerminateModal = () => {
    setReasonInput('');
    setInternalNoteInput('');
    setTerminateModalVisible(true);
  };

  const handleConfirmTerminate = () => {
    if (!reasonInput.trim()) {
      Alert.alert('Required', 'Please enter a reason.');
      return;
    }
    setAccountStatus('Disabled');
    setTerminateModalVisible(false);
    onDisable?.();
    Alert.alert('Account Disabled', 'Farmer account has been disabled.');
  };

  const handleSelectScore = (categoryId: string, score: number) => {
    setCategoryRatings((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, score } : cat))
    );
  };

  const handleUpdateNotes = (categoryId: string, notes: string) => {
    setCategoryRatings((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, notes } : cat))
    );
  };

  const handleSaveRatings = () => {
    setIsEditingRating(false);
    setCurrentFarmer((prev) => ({
      ...prev,
      rating: (totalRatingScore / 10).toFixed(1),
    }));
    Alert.alert('Rating Saved', 'Farm rating updated successfully.');
  };

  const handleOpenVerifyModal = (recordId: string) => {
    setActiveRecordId(recordId);
    setVerifyModalVisible(true);
  };

  const handleConfirmVerify = () => {
    setVerifyModalVisible(false);
    Alert.alert('Verified', `${activeRecordId} marked as verified.`);
  };

  const handleOpenFlagModal = (recordId: string) => {
    setActiveRecordId(recordId);
    setReasonInput('');
    setFlagModalVisible(true);
  };

  const handleConfirmFlag = () => {
    if (!reasonInput.trim()) {
      Alert.alert('Required', 'Please enter a reason.');
      return;
    }
    setFlagModalVisible(false);
    Alert.alert('Discrepancy Flagged', `Discrepancy for ${activeRecordId} has been recorded.`);
  };

  const handleOpenCorrectionModal = (recordId: string) => {
    setActiveRecordId(recordId);
    setReasonInput('');
    setCorrectionModalVisible(true);
  };

  const handleConfirmCorrection = () => {
    if (!reasonInput.trim()) {
      Alert.alert('Required', 'Please enter correction details.');
      return;
    }
    setCorrectionModalVisible(false);
    Alert.alert('Correction Requested', `Correction request for ${activeRecordId} has been sent.`);
  };

  // ─── SUBVIEW: EDIT FARMER PROFILE (Latest Screenshots) ───
  if (isEditingProfile) {
    return (
      <AdminEditFarmerScreen
        farmer={currentFarmer}
        onBack={() => setIsEditingProfile(false)}
        onSave={(updatedFarmer) => {
          if (updatedFarmer) {
            setCurrentFarmer(updatedFarmer);
          }
          setIsEditingProfile(false);
        }}
      />
    );
  }

  // ─── SUBVIEW: EDIT FARM RECORD (Diary -> AdminEditFarmRecordScreen; Plant/Crop, Livestock, Asset -> AdminAddFarmRecordScreen in edit mode) ───
  if (editingRecordData !== null) {
    if (editingRecordData.type === 'diary') {
      return (
        <AdminEditFarmRecordScreen
          record={editingRecordData}
          onBack={() => setEditingRecordData(null)}
          onSave={() => setEditingRecordData(null)}
        />
      );
    }
    const editTab =
      editingRecordData.type === 'crop'
        ? 'Plant'
        : editingRecordData.type === 'livestock'
          ? 'Livestock'
          : 'Assets';
    return (
      <AdminAddFarmRecordScreen
        initialTab={editTab}
        mode="edit"
        initialRecord={editingRecordData}
        farmerName={farmer.name}
        farmerId={farmer.code ?? farmer.id ?? 'FMR-00124'}
        allowAddOptions={false}
        onBack={() => setEditingRecordData(null)}
        onSave={() => setEditingRecordData(null)}
      />
    );
  }

  // ─── SUBVIEW: ADD FARM RECORDS (Images 1-5) ───
  if (addRecordInitialTab !== null) {
    return (
      <AdminAddFarmRecordScreen
        initialTab={addRecordInitialTab}
        farmerName={farmer.name}
        farmerId={farmer.code ?? farmer.id ?? 'FMR-00124'}
        allowAddOptions={false}
        onBack={() => setAddRecordInitialTab(null)}
        onSave={() => setAddRecordInitialTab(null)}
      />
    );
  }

  // ─── SUBVIEW: EDIT FARM RATING (Images 3 & 4) ───
  if (isEditingRating) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* ─── Header: Edit Farm Rating ─── */}
        <View style={styles.headerBanner}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setIsEditingRating(false)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Back to Farmer Profile"
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Farm Rating</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Top Card */}
          <View style={styles.profileSummaryCard}>
            <View style={styles.profileTopRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{farmer.initials || 'RK'}</Text>
              </View>

              <View style={styles.profileDetailsCol}>
                <View style={styles.nameBadgeRow}>
                  <Text style={styles.farmerName}>{currentFarmer.name || 'Ramesh Kumar'}</Text>
                  <View
                    style={[
                      styles.activePill,
                      accountStatus === 'Inactive' && { backgroundColor: '#F3F4F6' },
                      (accountStatus === 'Terminated' || accountStatus === 'Disabled') && { backgroundColor: '#FFEBEE' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.activePillText,
                        accountStatus === 'Inactive' && { color: '#6B7280' },
                        (accountStatus === 'Terminated' || accountStatus === 'Disabled') && { color: '#D32F2F' },
                      ]}
                    >
                      {accountStatus}
                    </Text>
                  </View>
                </View>

                <Text style={styles.farmerIdPhone}>
                  {farmer.code || 'FMR-00124'} · {currentFarmer.mobile || '+91 90000 20000'}
                </Text>
              </View>
            </View>

            {/* Badges Row */}
            <View style={styles.badgesRow}>
              <View style={styles.neutralPill}>
                <Text style={styles.neutralPillText}>{farmer.farmingType || 'Natural'}</Text>
              </View>
              <View style={styles.greenPill}>
                <Text style={styles.greenPillText}>KYC Verified</Text>
              </View>
              <View
                style={
                  currentFarmer.certStatus === 'Expired' || currentFarmer.hasExpiredCert
                    ? styles.redPill
                    : currentFarmer.certStatus === 'Pending'
                    ? styles.amberPill
                    : styles.greenPill
                }
              >
                <Text
                  style={
                    currentFarmer.certStatus === 'Expired' || currentFarmer.hasExpiredCert
                      ? styles.redPillText
                      : currentFarmer.certStatus === 'Pending'
                      ? styles.amberPillText
                      : styles.greenPillText
                  }
                >
                  {currentFarmer.certStatus === 'Expired' || currentFarmer.hasExpiredCert
                    ? 'Certification expired'
                    : currentFarmer.certStatus === 'Pending'
                    ? 'Cert pending'
                    : 'Certified'}
                </Text>
              </View>
              <View style={styles.neutralPill}>
                <Text style={styles.neutralPillText}>Since 10 Jan 2026</Text>
              </View>
            </View>
          </View>

          {/* Section Heading: Edit Rating */}
          <Text style={styles.editRatingSectionTitle}>Edit Rating</Text>

          {/* Accordion Categories */}
          {categoryRatings.map((cat) => {
            const isExpanded = expandedCategory === cat.id;
            return (
              <View key={cat.id} style={styles.accordionCard}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => setExpandedCategory(isExpanded ? null : cat.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.accordionCategoryTitle}>{cat.name}</Text>
                  <View style={styles.accordionScorePill}>
                    <Text style={styles.accordionScoreText}>{cat.score}/{cat.max}</Text>
                  </View>
                  <View style={styles.accordionChevron}>
                    {isExpanded ? (
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path d="M18 15l-6-6-6 6" stroke="#4B5563" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    ) : (
                      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path d="M6 9l6 6 6-6" stroke="#4B5563" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    )}
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.accordionBody}>
                    {/* Numbers Grid: 1-5 and 6-10 */}
                    <View style={styles.scoreRow}>
                      {[1, 2, 3, 4, 5].map((num) => {
                        const isSelected = cat.score === num;
                        return (
                          <TouchableOpacity
                            key={num}
                            style={[
                              styles.scoreButton,
                              isSelected && styles.scoreButtonSelected,
                            ]}
                            onPress={() => handleSelectScore(cat.id, num)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.scoreButtonText,
                                isSelected && styles.scoreButtonTextSelected,
                              ]}
                            >
                              {num}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <View style={styles.scoreRow}>
                      {[6, 7, 8, 9, 10].map((num) => {
                        const isSelected = cat.score === num;
                        return (
                          <TouchableOpacity
                            key={num}
                            style={[
                              styles.scoreButton,
                              isSelected && styles.scoreButtonSelected,
                            ]}
                            onPress={() => handleSelectScore(cat.id, num)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.scoreButtonText,
                                isSelected && styles.scoreButtonTextSelected,
                              ]}
                            >
                              {num}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Notes (optional) Input */}
                    <TextInput
                      style={styles.accordionNotesInput}
                      placeholder="Notes (optional)"
                      placeholderTextColor="#9CA3AF"
                      multiline
                      value={cat.notes || ''}
                      onChangeText={(val) => handleUpdateNotes(cat.id, val)}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Fixed Save Rating Bottom Bar */}
        <View style={styles.fixedBottomBar}>
          <TouchableOpacity
            style={styles.saveRatingBtn}
            onPress={handleSaveRatings}
            activeOpacity={0.8}
          >
            <Text style={styles.saveRatingBtnText}>Save Rating</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header: Farmer Profile ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {activeTab === 'Verification & Compliance'
                ? (farmer.name || 'Ramesh Kumar')
                : 'Farmer Profile'}
            </Text>
            {activeTab === 'Verification & Compliance' && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {(farmer.code || 'FMR-00124')} · Verification & Compliance
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.backButton, { marginLeft: 'auto' }]}
            onPress={() => setIsEditingProfile(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Edit Farmer Profile"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                stroke={adminColors.onBrand}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke={adminColors.onBrand}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Profile Top Card ─── */}
        <View style={styles.profileSummaryCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{farmer.initials || 'RK'}</Text>
            </View>

            <View style={styles.profileDetailsCol}>
              <View style={styles.nameBadgeRow}>
                <Text style={styles.farmerName}>{currentFarmer.name || 'Ramesh Kumar'}</Text>
                <View
                  style={[
                    styles.activePill,
                    accountStatus === 'Inactive' && { backgroundColor: '#F3F4F6' },
                    accountStatus === 'Terminated' && { backgroundColor: '#FFEBEE' },
                  ]}
                >
                  <Text
                    style={[
                      styles.activePillText,
                      accountStatus === 'Inactive' && { color: '#6B7280' },
                      accountStatus === 'Terminated' && { color: '#D32F2F' },
                    ]}
                  >
                    {accountStatus}
                  </Text>
                </View>
              </View>

              <Text style={styles.farmerIdPhone}>
                {farmer.code || 'FMR-00124'} · {currentFarmer.mobile || '+91 90000 20000'}
              </Text>
            </View>
          </View>

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            <View style={styles.neutralPill}>
              <Text style={styles.neutralPillText}>{farmer.farmingType || 'Natural'}</Text>
            </View>

            <TouchableOpacity
              style={styles.greenPill}
              onPress={onOpenKycReview}
              disabled={!onOpenKycReview}
              activeOpacity={0.7}
            >
              <Text style={styles.greenPillText}>KYC Verified</Text>
            </TouchableOpacity>

            <View
              style={
                currentFarmer.certStatus === 'Expired' || currentFarmer.hasExpiredCert
                  ? styles.redPill
                  : currentFarmer.certStatus === 'Pending'
                  ? styles.amberPill
                  : styles.greenPill
              }
            >
              <Text
                style={
                  currentFarmer.certStatus === 'Expired' || currentFarmer.hasExpiredCert
                    ? styles.redPillText
                    : currentFarmer.certStatus === 'Pending'
                    ? styles.amberPillText
                    : styles.greenPillText
                }
              >
                {currentFarmer.certStatus === 'Expired' || currentFarmer.hasExpiredCert
                  ? 'Certification expired'
                  : currentFarmer.certStatus === 'Pending'
                  ? 'Cert pending'
                  : 'Certified'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.neutralPill}
              onPress={onOpenRatingScorecard}
              disabled={!onOpenRatingScorecard}
              activeOpacity={0.7}
            >
              <Text style={styles.neutralPillText}>
                ★ {farmer.rating ? (typeof farmer.rating === 'number' ? farmer.rating.toFixed(1) : farmer.rating) : '3.0'}
              </Text>
            </TouchableOpacity>

            <View style={styles.neutralPill}>
              <Text style={styles.neutralPillText}>Since {farmer.memberSince || '10 Jan 2026'}</Text>
            </View>
          </View>
        </View>

        {/* ─── Horizontal Tabs with Dynamic Interactive Scrollbar ─── */}
        <View style={styles.tabSection}>
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
            onScroll={handleTabScroll}
            scrollEventThrottle={16}
          >
            {tabs.map(({ key, label }, idx) => {
              const active = activeTab === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                  onPress={() => handleTabPress(key, idx)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Dynamic Scrollbar Slider with Arrows */}
          <View
            style={styles.sliderBarWrap}
            onLayout={(e: LayoutChangeEvent) => {
              setTrackWidth(e.nativeEvent.layout.width - 50);
            }}
          >
            <TouchableOpacity
              onPress={() => tabScrollRef.current?.scrollTo({ x: 0, animated: true })}
              activeOpacity={0.7}
              style={styles.sliderArrowTouch}
            >
              <Text style={styles.sliderArrowText}>◀</Text>
            </TouchableOpacity>

            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderThumb,
                  {
                    width: thumbWidth,
                    transform: [{ translateX: thumbLeft }],
                  },
                ]}
              />
            </View>

            <TouchableOpacity
              onPress={() => tabScrollRef.current?.scrollToEnd({ animated: true })}
              activeOpacity={0.7}
              style={styles.sliderArrowTouch}
            >
              <Text style={styles.sliderArrowText}>▶</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── TAB 1: PERSONAL ─── */}
        {activeTab === 'Personal' && (
          <>
            <View style={styles.detailsCard}>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Name</Text>
                <Text style={styles.tableValue}>{currentFarmer.name || 'Ramesh Kumar'}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Farmer ID</Text>
                <Text style={styles.tableValue}>{farmer.code || 'FMR-00124'}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Phone</Text>
                <Text style={styles.tableValue}>{currentFarmer.mobile || '+91 90000 20000'}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Address</Text>
                <Text style={styles.tableValue}>Demo village 1, Coonoor</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Zone</Text>
                <Text style={styles.tableValue}>{currentFarmer.location || 'Coonoor'}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Farming type</Text>
                <Text style={styles.tableValue}>{farmer.farmingType || 'Natural'}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Farm profile</Text>
                <Text style={styles.tableValue}>Mixed vegetable farm.</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Registered</Text>
                <Text style={styles.tableValue}>{farmer.memberSince || '10 Jan 2026'}</Text>
              </View>

              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.tableLabel}>Account States</Text>
                <Text style={styles.tableValue}>{accountStatus}</Text>
              </View>
            </View>

            {/* Account Lifecycle */}
            <Text style={styles.sectionHeaderTitle}>Account lifecycle</Text>
            <View style={styles.lifecycleCard}>
              <Text style={styles.lifecycleTime}>16 Oct 2026, 2:30 · TOHFA Admin</Text>
              <Text style={styles.lifecycleStatus}>Deactivated</Text>
              <Text style={[styles.lifecycleTime, { marginTop: adminSpacing.sm }]}>5 Oct 2026, 10:00 · Applicant</Text>
              <Text style={styles.lifecycleStatus}>Approved</Text>
            </View>

            {/* Action Buttons Row matching Image 2 */}
            <View style={styles.actionButtonsRow}>
              {(!can || can('farmer.account.reactivate')) && (
                <TouchableOpacity
                  style={styles.reactivateBtn}
                  onPress={() => {
                    setAccountStatus('Active');
                    Alert.alert('Account Re-Activated', 'Farmer account has been successfully re-activated.');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.reactivateBtnText}>Re-Activate account</Text>
                </TouchableOpacity>
              )}

              {(!can || can('farmer.account.disable')) && (
                <TouchableOpacity
                  style={styles.deactivateBtn}
                  onPress={handleOpenDeactivateModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deactivateBtnText}>Deactivate account</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* ─── TAB 2: FARM & LAND (Image 2 Screen 1) ─── */}
        {activeTab === 'Farm & land' && (
          <>
            {/* Plot Details Card */}
            <View style={styles.plotCard}>
              <View style={styles.plotHeaderRow}>
                <Text style={styles.plotIdText}>PLT-00124-1</Text>
                <View style={styles.verifiedPill}>
                  <Text style={styles.verifiedPillText}>Verified</Text>
                </View>
              </View>

              <Text style={styles.plotLocationText}>Demo plot, Coonoor</Text>
              <Text style={styles.plotMetaText}>Rectangular · 1 acre · Tomato</Text>
              <Text style={styles.plotSubDateText}>Submitted 12 Jan 2026</Text>

              <View style={styles.actionLinksRow}>
                <TouchableOpacity
                  onPress={() => setFmbPreviewModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionLinkText}>Preview</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleOpenVerifyModal('PLT-00124-1')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionLinkText}>Verify</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleOpenFlagModal('PLT-00124-1')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionLinkText}>Flag a discrepancy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleOpenCorrectionModal('PLT-00124-1')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionLinkText}>Request a correction</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.disclaimerNote}>
              Boundaries are not inferred and no official area is calculated here.
            </Text>

            {/* FMB Sketch Card */}
            <View style={styles.fmbCard}>
              <View style={styles.fmbLeftCol}>
                <DocumentIcon size={22} color={adminColors.brand} />
                <Text style={styles.fmbCardTitle}>FMB Sketch</Text>
              </View>

              <TouchableOpacity
                style={styles.fmbViewBtn}
                onPress={() => setFmbPreviewModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.fmbViewBtnText}>View</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ─── TAB 3: SOIL (Image 2 Screen 3) ─── */}
        {activeTab === 'Soil' && (
          <View style={styles.detailsCard}>
            <View style={styles.plotHeaderRow}>
              <Text style={styles.plotIdText}>SOIL-00124-1</Text>
              <View style={styles.verifiedPill}>
                <Text style={styles.verifiedPillText}>Verified</Text>
              </View>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Sample date</Text>
              <Text style={styles.tableValue}>15 Jan 2026</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.tableLabel}>Soil type</Text>
              <Text style={styles.tableValue}>Loam</Text>
            </View>

            <View style={styles.actionLinksRow}>
              <TouchableOpacity
                onPress={() => setFmbPreviewModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionLinkText}>View report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleOpenVerifyModal('SOIL-00124-1')}
                activeOpacity={0.7}
              >
                <Text style={styles.actionLinkText}>Verify</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleOpenFlagModal('SOIL-00124-1')}
                activeOpacity={0.7}
              >
                <Text style={styles.actionLinkText}>Flag a discrepancy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ─── TAB 4: PRODUCT LISTING (Image 2 Screen 4) ─── */}
        {activeTab === 'Product listing' && (
          <>
            <Text style={styles.sectionHeaderTitle}>Recently listed</Text>

            {/* Product Card 1 */}
            <View style={styles.productCard}>
              <View style={styles.productHeaderRow}>
                <Text style={styles.productTitle}>Tomato · Grade 1</Text>
                <View style={styles.pendingReviewPill}>
                  <Text style={styles.pendingReviewPillText}>Pending Review</Text>
                </View>
              </View>
              <Text style={styles.productMetaLine}>Listed 11 Oct 2026 · 80 KG</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Counter price</Text>
                <Text style={styles.priceValue}>₹34.00/KG</Text>
              </View>
            </View>

            {/* Product Card 2 */}
            <View style={styles.productCard}>
              <View style={styles.productHeaderRow}>
                <Text style={styles.productTitle}>Carrot · Grade A</Text>
                <View style={styles.approvedPill}>
                  <Text style={styles.approvedPillText}>Approved</Text>
                </View>
              </View>
              <Text style={styles.productMetaLine}>Listed 05 Oct 2026 · 115 KG</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Counter price</Text>
                <Text style={styles.priceValue}>₹28.00/KG</Text>
              </View>
            </View>

            {/* Product Card 3 (Image 3) */}
            <View style={styles.productCard}>
              <View style={styles.productHeaderRow}>
                <Text style={styles.productTitle}>Carrot · Grade B</Text>
                <View style={styles.readyBluePill}>
                  <Text style={styles.readyBluePillText}>Ready</Text>
                </View>
              </View>
              <Text style={styles.productMetaLine}>Listed 05 Oct 2026 · 123 KG</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Counter price</Text>
                <Text style={styles.priceValue}>₹56.00 / KG</Text>
              </View>
            </View>

            <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.md }]}>Listing history</Text>

            {/* Listing History Card */}
            <View style={styles.historyCard}>
              <View style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyCropTitle}>Cabbage · Grade A · 150 KG</Text>
                  <Text style={styles.historyCropSubtitle}>07 Sep 2026 · Sold</Text>
                </View>
                <Text style={styles.historyPrice}>₹22.00/KG</Text>
              </View>

              <View style={styles.historyDivider} />

              <View style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyCropTitle}>Tomato · Grade 1 · 95 KG</Text>
                  <Text style={styles.historyCropSubtitle}>22 Aug 2026 · Sold</Text>
                </View>
                <Text style={styles.historyPrice}>₹30.00/KG</Text>
              </View>

              <View style={styles.historyDivider} />

              <View style={styles.historyRow}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyCropTitle}>Beans · Grade C · 60 KG</Text>
                  <Text style={styles.historyCropSubtitle}>06 Aug 2026 · Rejected</Text>
                </View>
                <Text style={styles.historyPrice}>₹18.00/KG</Text>
              </View>
            </View>

            {/* Action Buttons Row matching Image 3 */}
            <View style={[styles.actionButtonsRow, { marginTop: adminSpacing.lg }]}>
              <TouchableOpacity
                style={styles.raisePoBtn}
                onPress={() => Alert.alert('Purchase Order', 'Raise Purchase Order action triggered.')}
                activeOpacity={0.8}
              >
                <Text style={styles.raisePoBtnText}>Raise Purchase Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.blockListingsBtn}
                onPress={() => Alert.alert('Block Listings', 'Block Listings action triggered.')}
                activeOpacity={0.8}
              >
                <Text style={styles.blockListingsBtnText}>Block Listings</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ─── TAB 5: KYC (Images 4 & 5) ─── */}
        {activeTab === 'KYC' && (() => {
          const canVerifyDocs = !can || can('farmer.document.verify');
          const renderKycDocRow = (doc: {
            key: 'aadhar' | 'voter' | 'land';
            title: string;
            docName: string;
            fileName: string;
          }) => {
            const status = kycDocStatus[doc.key];
            return (
              <View key={doc.key} style={styles.kycDocRowCard}>
                <View style={styles.kycDocLeftWrap}>
                  <Text style={styles.kycDocCloseGlyph}>✕</Text>
                  <View style={styles.kycDocLabelWrap}>
                    <Text style={styles.kycDocTitleText}>{doc.title}</Text>
                    {status !== 'Verified' ? (
                      <Text style={styles.kycDocStatusWarning}>{status}</Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.kycDocActionsRow}>
                  <TouchableOpacity
                    style={styles.kycPreviewBtn}
                    onPress={() => setKycPreviewDoc(doc)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Preview ${doc.title}`}
                  >
                    <Text style={styles.kycPreviewBtnText}>Preview</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.kycRejectBtn}
                    onPress={() => {
                      if (!canVerifyDocs) {
                        Alert.alert('Access Restricted', 'You do not have permission to reject KYC documents.');
                        return;
                      }
                      setKycDocStatus((prev) => ({ ...prev, [doc.key]: 'Rejected' }));
                      Alert.alert('Document Rejected', `${doc.title} has been marked as rejected.`);
                    }}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Reject ${doc.title}`}
                  >
                    <Text style={styles.kycRejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          };

          const identityAllVerified =
            kycDocStatus.aadhar === 'Verified' && kycDocStatus.voter === 'Verified';
          const landVerified = kycDocStatus.land === 'Verified';

          return (
            <>
              <View style={styles.kycAccordionCard}>
                {/* Identity proof */}
                <TouchableOpacity
                  style={styles.accordionHeaderRow}
                  onPress={() => setKycIdentityOpen((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  <View style={styles.accordionTitleWrap}>
                    <Text style={styles.kycAccordionChevron}>{kycIdentityOpen ? '∧' : '∨'}</Text>
                    <Text style={styles.accordionTitle}>Identity proof</Text>
                  </View>
                  <Text style={identityAllVerified ? styles.kycVerifiedText : styles.kycWarningStatusText}>
                    {identityAllVerified ? 'Verified' : 'Needs Review'}
                  </Text>
                </TouchableOpacity>

                {kycIdentityOpen && (
                  <View style={styles.kycDocsListWrap}>
                    {renderKycDocRow({
                      key: 'aadhar',
                      title: 'Aadhar card',
                      docName: 'Aadhar Card',
                      fileName: 'aadhar_card-1.pdf',
                    })}
                    {renderKycDocRow({
                      key: 'voter',
                      title: 'Voter ID',
                      docName: 'Voter ID',
                      fileName: 'voter_id-1.pdf',
                    })}
                  </View>
                )}

                <View style={styles.accordionDivider} />

                {/* Land ownership proof */}
                <TouchableOpacity
                  style={styles.accordionHeaderRow}
                  onPress={() => setKycLandOpen((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  <View style={styles.accordionTitleWrap}>
                    <Text style={styles.kycAccordionChevron}>{kycLandOpen ? '∧' : '∨'}</Text>
                    <Text style={styles.accordionTitle}>Land ownership proof</Text>
                  </View>
                  <Text style={landVerified ? styles.kycVerifiedText : styles.kycWarningStatusText}>
                    {landVerified ? 'Verified' : kycDocStatus.land}
                  </Text>
                </TouchableOpacity>

                {kycLandOpen && (
                  <View style={styles.kycDocsListWrap}>
                    {renderKycDocRow({
                      key: 'land',
                      title: 'Patta / Land Ownership',
                      docName: 'Land Ownership Proof',
                      fileName: 'land_ownership-1.pdf',
                    })}
                  </View>
                )}

                <View style={styles.accordionDivider} />

                {/* Bank details */}
                <TouchableOpacity
                  style={styles.accordionHeaderRow}
                  onPress={() => setKycBankOpen((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  <View style={styles.accordionTitleWrap}>
                    <Text style={styles.kycAccordionChevron}>{kycBankOpen ? '∧' : '∨'}</Text>
                    <Text style={styles.accordionTitle}>Bank details</Text>
                  </View>
                  <Text style={styles.kycVerifiedText}>Verified</Text>
                </TouchableOpacity>

                {kycBankOpen && (
                  <View style={styles.bankDetailsContainer}>
                    <Text style={styles.bankAccountsHeader}>Bank accounts</Text>

                    {/* Bank Account 1 */}
                    <View style={styles.bankAccountCard}>
                      <View style={styles.bankAccountHeader}>
                        <Text style={styles.bankAccountName}>Indian Bank · Savings</Text>
                        <View style={styles.verifiedGreenPill}>
                          <Text style={styles.verifiedGreenPillText}>Default for payouts</Text>
                        </View>
                      </View>
                      <Text style={styles.bankAccountMeta}>Account holder: {currentFarmer.name || 'Ramesh Kumar'}</Text>
                      <Text style={styles.bankAccountMeta}>Account number: XXXXXXXX4821</Text>
                      <Text style={styles.bankAccountMeta}>IFSC: IDIB000C123 · Branch: Coonoor</Text>
                    </View>

                    {/* Bank Account 2 */}
                    <View style={styles.bankAccountCard}>
                      <View style={styles.bankAccountHeader}>
                        <Text style={styles.bankAccountName}>Canara Bank · Savings</Text>
                        <View style={styles.secondaryGrayPill}>
                          <Text style={styles.secondaryGrayPillText}>Secondary</Text>
                        </View>
                      </View>
                      <Text style={styles.bankAccountMeta}>Account holder: {currentFarmer.name || 'Ramesh Kumar'}</Text>
                      <Text style={styles.bankAccountMeta}>Account number: XXXXXXXX0097</Text>
                      <Text style={styles.bankAccountMeta}>IFSC: CNRB0001904 · Branch: Ooty</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* UPI IDs */}
              <Text style={styles.subscriptionSectionHeading}>UPI IDs</Text>
              <View style={styles.upiCard}>
                <Text style={styles.upiIdText}>ramesh.kumar@okaxis</Text>
                <View style={styles.verifiedGreenPill}>
                  <Text style={styles.verifiedGreenPillText}>Verified</Text>
                </View>
              </View>

              {/* Payout history (preview) */}
              <Text style={styles.subscriptionSectionHeading}>Payout history (preview)</Text>
              <View style={styles.payoutPreviewCard}>
                <View style={styles.payoutPreviewTopRow}>
                  <Text style={styles.upiIdText}>PAY-0002</Text>
                  <View style={styles.escalatedBluePill}>
                    <Text style={styles.escalatedBluePillText}>Escalated</Text>
                  </View>
                </View>
                <Text style={styles.payoutPreviewSub}>
                  ₹18,000.00 · To Indian Bank ·•4821 · 10 Oct 2026
                </Text>
              </View>

              <View style={styles.payoutPreviewCard}>
                <View style={styles.payoutPreviewTopRow}>
                  <Text style={styles.upiIdText}>PAY-0001</Text>
                  <View style={styles.verifiedGreenPill}>
                    <Text style={styles.verifiedGreenPillText}>Paid</Text>
                  </View>
                </View>
                <Text style={styles.payoutPreviewSub}>
                  ₹7,200.00 · To Indian Bank ·•4821 · 2 Oct 2026
                </Text>
              </View>
            </>
          );
        })()}

        {/* ─── TAB 6: RATINGS (Image 2) ─── */}
        {activeTab === 'Ratings' && (
          <>
            {/* Rating Categories Section */}
            <Text style={styles.sectionHeaderTitle}>Rating categories</Text>

            {/* New Overall Rating Card */}
            <View style={styles.categoryOverallCard}>
              <Text style={styles.categoryOverallLabel}>NEW OVERALL RATING</Text>
              <View style={styles.categoryOverallRow}>
                <Text style={styles.categoryBigNumber}>{totalRatingScore}</Text>
                <Text style={styles.categoryDenominator}> / 100</Text>
              </View>
              <Text style={styles.categoryPreviousText}>Previous: 68 / 100</Text>
            </View>

            {/* Categories Breakdown Table */}
            <View style={styles.detailsCard}>
              {categoryRatings.map((cat, idx) => (
                <View
                  key={cat.id}
                  style={[
                    styles.categoryRow,
                    idx === categoryRatings.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={styles.categoryLabel}>{cat.name}</Text>
                  <View style={styles.categoryScoreBadge}>
                    <Text style={styles.categoryScoreNum}>{cat.score}</Text>
                    <Text style={styles.categoryScoreMax}>/{cat.max}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Farm Information Section */}
            <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>Farm Information</Text>
            <View style={styles.detailsCard}>
              <View style={styles.twoColumnGrid}>
                {/* Left Column */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabelText}>Farm</Text>
                  <Text style={styles.metaValueText}>
                    {farmer.farmName || (farmer.name ? `${farmer.name.split(' ')[0]} Farm 01` : 'Ooty Farm 01')}
                  </Text>

                  <View style={{ height: 14 }} />

                  <Text style={styles.metaLabelText}>Farmer Since</Text>
                  <Text style={styles.metaValueText}>
                    {farmer.memberSince ? farmer.memberSince.split(' ').pop() || '2023' : '2023'}
                  </Text>
                </View>

                {/* Right Column */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabelText}>Zone</Text>
                  <Text style={styles.metaValueText}>{farmer.zone || farmer.location || 'Ooty'}</Text>

                  <View style={{ height: 14 }} />

                  <Text style={styles.metaLabelText}>Last Audit</Text>
                  <Text style={styles.metaValueText}>15 Oct 2026</Text>
                </View>
              </View>
            </View>

            {/* Rating History Section */}
            <Text style={[styles.sectionHeaderTitle, { marginTop: adminSpacing.lg }]}>Rating History</Text>
            <View style={styles.historyRatingCard}>
              <Text style={styles.historyDateMuted}>12 Sep 2026</Text>
              <Text style={styles.historyScoreText}>Rating: 4.6 · Zone: Coonoor</Text>
            </View>
            <View style={[styles.historyRatingCard, { marginTop: 10 }]}>
              <Text style={styles.historyDateMuted}>01 Aug 2026</Text>
              <Text style={styles.historyScoreText}>Rating: 4.4 · Zone: Coonoor</Text>
            </View>
          </>
        )}

        {/* ─── TAB 7: SUBSCRIPTION (Image 4 & Image 5) ─── */}
        {activeTab === 'Subscription' && (
          <>
            <Text style={styles.subscriptionSectionHeading}>Current plan</Text>
            <View style={styles.detailsCard}>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Plan</Text>
                <Text style={styles.tableValue}>Annual subscription</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Status</Text>
                <Text style={[styles.tableValue, { color: adminColors.success.text }]}>Active</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Period</Text>
                <Text style={styles.tableValue}>1 Nov 2025 to 20 Nov 2026</Text>
              </View>

              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.tableLabel}>Amount</Text>
                <Text style={styles.tableValue}>₹500.00 per year</Text>
              </View>
            </View>

            {/* Free-tier limits (RBAC: farmer.subscription.view_tier_limits) */}
            {(!can || can('farmer.subscription.view_tier_limits')) && (
              <>
                <Text style={styles.subscriptionSectionHeading}>Free-tier limits</Text>
                <View style={styles.detailsCard}>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Free listings per month</Text>
                    <Text style={styles.tableValue}>5 of 5 used</Text>
                  </View>

                  <View style={styles.tableRow}>
                    <Text style={styles.tableLabel}>Free storage days</Text>
                    <Text style={styles.tableValue}>7 of 7 used</Text>
                  </View>

                  <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.tableLabel}>Resets</Text>
                    <Text style={styles.tableValue}>1 Nov 2026</Text>
                  </View>
                </View>
              </>
            )}

            {/* Extend subscription (RBAC: farmer.subscription.extend_waive) */}
            {(!can || can('farmer.subscription.extend_waive')) && (
              <>
                <Text style={styles.subscriptionSectionHeading}>Extend subscription</Text>
                <View style={styles.subFormCard}>
                  <Text style={styles.subInputLabel}>Extend by</Text>
                  <View style={styles.subPillsRow}>
                    {(['30 days', '90 days', '1 year'] as const).map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.subSelectorPill,
                          extendBy === opt && styles.subSelectorPillActive,
                        ]}
                        onPress={() => setExtendBy(opt)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.subSelectorPillText,
                            extendBy === opt && styles.subSelectorPillTextActive,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.subInputLabel}>New expiry date (required)</Text>
                  <View style={styles.subDateRow}>
                    <Text style={styles.subDateText}>{newExpiryDate}</Text>
                    <TouchableOpacity
                      onPress={() => setExpiryCalendarOpen(true)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Pick new expiry date"
                    >
                      <CalendarIcon size={18} color={adminColors.muted} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.subInputLabel}>
                    Reason <Text style={{ color: adminColors.danger.text }}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.subTextArea}
                    value={extendReason}
                    onChangeText={setExtendReason}
                    multiline
                    placeholder="Enter reason..."
                    placeholderTextColor={adminColors.placeholder}
                  />

                  <TouchableOpacity
                    style={styles.subPrimaryBtn}
                    onPress={handleExtendSubscription}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.subPrimaryBtnText}>Extend Subscription</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Waive fee (RBAC: farmer.subscription.extend_waive) */}
            {(!can || can('farmer.subscription.extend_waive')) && (
              <>
                <Text style={styles.subscriptionSectionHeading}>Waive fee</Text>
                <View style={styles.subFormCard}>
                  <Text style={styles.subInputLabel}>Waive</Text>
                  <View style={styles.subPillsRow}>
                    {(['Current renewal (₹500.00)', 'Full plan'] as const).map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.subSelectorPill,
                          waiveTarget === opt && styles.subSelectorPillActive,
                        ]}
                        onPress={() => setWaiveTarget(opt)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.subSelectorPillText,
                            waiveTarget === opt && styles.subSelectorPillTextActive,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.subInputLabel}>
                    Reason <Text style={{ color: adminColors.danger.text }}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.subTextArea}
                    value={waiveReason}
                    onChangeText={setWaiveReason}
                    multiline
                    placeholder="Enter reason..."
                    placeholderTextColor={adminColors.placeholder}
                  />

                  <TouchableOpacity
                    style={styles.subDangerOutlineBtn}
                    onPress={handleWaiveFee}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.subDangerOutlineBtnText}>Waive Fee</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}

        {/* ─── TAB: VERIFICATION & COMPLIANCE (Image 4) ─── */}
        {activeTab === 'Verification & Compliance' && (
          <>
            {/* Card 1: PGS Organic */}
            <View style={styles.complianceCardBox}>
              <View style={styles.complianceHeaderRow}>
                <Text style={styles.complianceCertTitle}>PGS Organic</Text>
                <View style={styles.verifiedGreenPill}>
                  <Text style={styles.verifiedGreenPillText}>Verified</Text>
                </View>
              </View>
              <Text style={styles.complianceCertSubtext}>
                Cert. no. PGS-TN-04821 · Issued by PGS India Council
              </Text>
              <Text style={styles.complianceCertSubtext}>
                Expires 30 Aug 2027 · Verified 4 Nov 2025 by Demo Super Admin
              </Text>
              <View style={styles.complianceBtnRow}>
                <TouchableOpacity
                  style={styles.outlineActionBtn}
                  onPress={() => Alert.alert('Issuer Portal', 'Redirecting to pgsindia-ncof.gov.in...')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.outlineActionBtnText}>Verify on Issuer Portal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.outlineDangerBtn}
                  onPress={() => Alert.alert('Marked Unverified', 'Certificate marked unverified.')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.outlineDangerBtnText}>Mark Unverified</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Card 2: NPOP (Expired) with red border */}
            <View style={[styles.complianceCardBox, styles.complianceExpiredBorder]}>
              <View style={styles.complianceHeaderRow}>
                <Text style={styles.complianceCertTitle}>NPOP</Text>
                <View style={styles.expiredRedPill}>
                  <Text style={styles.expiredRedPillText}>Expired</Text>
                </View>
              </View>
              <Text style={styles.complianceCertSubtext}>
                Cert. no. NPOP-2023-1187 · Issued by APEDA
              </Text>
              <Text style={styles.complianceCertSubtext}>
                Expired 24 Sep 2026 · Last verified 2 Sep 2025
              </Text>

              {/* Warning Banner */}
              <View style={styles.complianceWarningBanner}>
                <BanAlertIcon size={16} color={adminColors.danger.text} />
                <Text style={styles.complianceWarningText}>
                  Listings under this certification are blocked until it is renewed and re-verified.
                </Text>
              </View>

              <View style={styles.complianceBtnRow}>
                <TouchableOpacity
                  style={styles.outlineActionBtn}
                  onPress={() => Alert.alert('Issuer Portal', 'Redirecting to issuing portal...')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.outlineActionBtnText}>Verify on Issuer Portal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.solidDangerBtn}
                  onPress={() => Alert.alert('Listings Blocked', 'Listings under this certificate have been blocked.')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.solidDangerBtnText}>Block Listings</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Verify on issuer portal */}
            <Text style={styles.subscriptionSectionHeading}>Verify on issuer portal</Text>
            <View style={styles.detailsCard}>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Issuing body portal</Text>
                <TouchableOpacity onPress={() => Alert.alert('Portal', 'Opening pgsindia-ncof.gov.in in browser')}>
                  <Text style={styles.portalLinkText}>pgsindia-ncof.gov.in</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.portalDescriptionText}>
                Opens the issuing body's own lookup in a new tab. The record here is only marked verified or unverified after you confirm it there — nothing is fetched automatically.
              </Text>
            </View>

            {/* Correct or remove a record */}
            <Text style={styles.subscriptionSectionHeading}>Correct or remove a record</Text>
            <View style={styles.subFormCard}>
              <Text style={styles.subInputLabel}>
                Reason <Text style={{ color: adminColors.danger.text }}>*</Text>
              </Text>
              <TextInput
                style={styles.subTextArea}
                defaultValue="Certificate number was entered incorrectly at onboarding (demo)."
                multiline
                placeholder="Enter correction reason..."
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
          </>
        )}

        {/* ─── TAB 8: AUDIT (M3-S04f · Audit tab) ─── */}
        {activeTab === 'Audit' && (
          <>
            <View style={styles.detailsCard}>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Certification</Text>
                <Text style={styles.auditExpiredValue}>Expired</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Expiry</Text>
                <Text style={styles.tableValue}>24 Sep 2026</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Latest audit</Text>
                <Text style={styles.tableValue}>AUD-2026-40 · Corrective action required</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Next audit</Text>
                <Text style={styles.tableValue}>13 Dec 2026</Text>
              </View>

              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.tableLabel}>Open corrective actions</Text>
                <Text style={styles.tableValue}>1</Text>
              </View>
            </View>
          </>
        )}

        {/* ─── TAB 9: HISTORY (M3-S04g · History tab) ─── */}
        {activeTab === 'History' && (() => {
          const farmerDisplayName = currentFarmer.name || 'Ramesh Kumar';
          const farmerHistoryRecords = [
            ...liveHistoryEvents,
            {
              id: 'hist-audit',
              timeActor: '26 Oct 2026, 11:20 · Demo Super Admin',
              action: `Quarterly Compliance Audit logged (AUD-2026-40 · ${totalRatingScore}/100)`,
            },
            {
              id: 'hist-diary',
              timeActor: `24 Oct 2026, 15:40 · ${farmerDisplayName}`,
              action: `Farm record logged in ${currentFarmer.location || 'Coonoor'} (Diary · Hand weeding)`,
            },
            {
              id: 'hist-cert',
              timeActor: '18 Oct 2026, 14:15 · TOHFA Admin',
              action: 'Certification verified: PGS Organic (PGS-TN-04821)',
            },
            {
              id: 'hist-rating',
              timeActor: '12 Oct 2026, 10:05 · Farmer Admin',
              action: `Farm rating updated: 68/100 to ${totalRatingScore}/100`,
            },
            {
              id: 'hist-kyc',
              timeActor: '05 Oct 2026, 16:30 · Demo Super Admin',
              action: 'KYC verified: Aadhar card, Voter ID & Bank details',
            },
            {
              id: 'hist-sub',
              timeActor: '01 Oct 2026, 09:30 · System',
              action: 'Subscription activated: Annual plan (₹500.00 / year)',
            },
            {
              id: 'hist-reg',
              timeActor: `${farmer.memberSince || '10 Jan 2026'}, 09:00 · System`,
              action: 'Registered: — to Active',
            },
          ];

          return (
            <View style={styles.historyTabWrap}>
              {farmerHistoryRecords.map((entry, idx) => (
                <View
                  key={entry.id}
                  style={[
                    styles.historyEntryRow,
                    idx === farmerHistoryRecords.length - 1 && styles.historyEntryRowLast,
                  ]}
                >
                  <Text style={styles.historyEventTime}>{entry.timeActor}</Text>
                  <Text style={styles.historyEventAction}>{entry.action}</Text>
                </View>
              ))}

              <View style={styles.appendOnlyBox}>
                <LockIcon size={16} color={adminColors.muted} />
                <Text style={styles.appendOnlyText}>The history is append-only.</Text>
              </View>
            </View>
          );
        })()}

        {/* ─── TAB 10: FARMER RECORDS (Super Admin - Images 1-4) ─── */}
        {activeTab === 'Farmer Records' && (
          <FarmRecordsSection
            farmerName={currentFarmer.name}
            farmerCode={farmer.code ?? farmer.id ?? 'FMR-00101'}
            zone={currentFarmer.location}
            onAddRecord={(tab) => setAddRecordInitialTab(tab)}
            onEditRecord={(record) => setEditingRecordData(record)}
            onEditDiary={(record) => setEditingRecordData(record)}
          />
        )}

        <View style={{ height: activeTab === 'Ratings' ? 80 : adminSpacing.xxxl }} />
      </ScrollView>

      {/* ─── Sticky Bottom Action Bar: Edit Rating (Only in Ratings tab - Image 2) ─── */}
      {activeTab === 'Ratings' && canEditRating && (
        <View style={styles.ratingsBottomBar}>
          <TouchableOpacity
            style={styles.editRatingBottomBtn}
            onPress={() => setIsEditingRating(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Edit Rating"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
              <Path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                stroke={adminColors.onBrand}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke={adminColors.onBrand}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.editRatingBottomBtnText}>Edit Rating</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 1: DEACTIVATE THIS ACCOUNT? (Image 1 Screen 2)
         ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={deactivateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeactivateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable
            style={styles.modalBackdropTouch}
            onPress={() => setDeactivateModalVisible(false)}
          />
          <View style={styles.bottomSheetCard}>
            <Text style={styles.bottomSheetTitle}>Deactivate this account?</Text>

            <View style={styles.summaryTableCard}>
              <View style={styles.summaryTableRow}>
                <Text style={styles.summaryTableLabel}>Name</Text>
                <Text style={styles.summaryTableValue}>{currentFarmer.name || 'Ramesh Kumar'} · {farmer.code || 'FMR-00124'}</Text>
              </View>
              <View style={styles.summaryTableRow}>
                <Text style={styles.summaryTableLabel}>Action</Text>
                <Text style={styles.summaryTableValue}>Deactivate</Text>
              </View>
              <View style={[styles.summaryTableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.summaryTableLabel}>Status</Text>
                <Text style={styles.summaryTableValue}>Active to Inactive</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>
              Reason <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={styles.textAreaInput}
              multiline
              numberOfLines={3}
              placeholder="Enter reason for deactivation"
              placeholderTextColor={adminColors.muted}
              value={reasonInput}
              onChangeText={setReasonInput}
            />

            <Text style={[styles.inputLabel, { marginTop: adminSpacing.sm }]}>Internal note (optional)</Text>
            <TextInput
              style={styles.textAreaInput}
              multiline
              numberOfLines={3}
              placeholder="Add internal note"
              placeholderTextColor={adminColors.muted}
              value={internalNoteInput}
              onChangeText={setInternalNoteInput}
            />
            <Text style={styles.inputHelperText}>Up to 200 characters</Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.deactivateSubmitBtn}
                onPress={handleConfirmDeactivate}
                activeOpacity={0.8}
              >
                <Text style={styles.deactivateSubmitBtnText}>Deactivate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDeactivateModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 2: TERMINATE THIS ACCOUNT? (Image 1 Screen 3)
         ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={terminateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTerminateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable
            style={styles.modalBackdropTouch}
            onPress={() => setTerminateModalVisible(false)}
          />
          <View style={styles.bottomSheetCard}>
            <Text style={styles.bottomSheetTitle}>Disable this account?</Text>

            <View style={styles.summaryTableCard}>
              <View style={styles.summaryTableRow}>
                <Text style={styles.summaryTableLabel}>Name</Text>
                <Text style={styles.summaryTableValue}>{currentFarmer.name || 'Ramesh Kumar'} · {farmer.code || 'FMR-00124'}</Text>
              </View>
              <View style={styles.summaryTableRow}>
                <Text style={styles.summaryTableLabel}>Action</Text>
                <Text style={styles.summaryTableValue}>Disable</Text>
              </View>
              <View style={[styles.summaryTableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.summaryTableLabel}>Status</Text>
                <Text style={styles.summaryTableValue}>Active to Disable</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>
              Reason <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={styles.textAreaInput}
              multiline
              numberOfLines={3}
              value={reasonInput}
              onChangeText={setReasonInput}
            />

            <Text style={[styles.inputLabel, { marginTop: adminSpacing.sm }]}>Internal note (optional)</Text>
            <TextInput
              style={styles.textAreaInput}
              multiline
              numberOfLines={3}
              value={internalNoteInput}
              onChangeText={setInternalNoteInput}
            />
            <Text style={styles.inputHelperText}>Up to 200 characters</Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.terminateSubmitBtn}
                onPress={handleConfirmTerminate}
                activeOpacity={0.8}
              >
                <Text style={styles.terminateSubmitBtnText}>Disable</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setTerminateModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 3: FMB SKETCH PREVIEW (Image 2 Screen 2)
         ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={fmbPreviewModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFmbPreviewModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalBackdropTouch}
            onPress={() => setFmbPreviewModalVisible(false)}
          />
          <View style={styles.bottomSheetCard}>
            <Text style={styles.bottomSheetTitle}>FMB Sketch preview</Text>

            <View style={styles.fmbPreviewCard}>
              <DocumentIcon size={38} color="#4B5563" />
              <Text style={styles.fmbPreviewTitle}>FMB Sketch</Text>
              <Text style={styles.fmbPreviewFilename}>fmb-sketch-1.pdf</Text>
            </View>

            <TouchableOpacity
              style={styles.fullWidthCloseBtn}
              onPress={() => setFmbPreviewModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.fullWidthCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 3b: KYC DOCUMENT PREVIEW (Aadhar / Voter ID / Land Ownership - Image 5)
         ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={kycPreviewDoc !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setKycPreviewDoc(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalBackdropTouch}
            onPress={() => setKycPreviewDoc(null)}
          />
          <View style={styles.bottomSheetCard}>
            <Text style={styles.bottomSheetTitle}>
              {kycPreviewDoc ? `${kycPreviewDoc.title} preview` : 'Document preview'}
            </Text>

            <View style={styles.fmbPreviewCard}>
              <DocumentIcon size={38} color="#4B5563" />
              <Text style={styles.fmbPreviewTitle}>{kycPreviewDoc?.docName ?? 'Document'}</Text>
              <Text style={styles.fmbPreviewFilename}>{kycPreviewDoc?.fileName ?? 'document.pdf'}</Text>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.kycModalDangerBtn}
                onPress={() => {
                  if (!kycPreviewDoc) return;
                  if (can && !can('farmer.document.verify')) {
                    Alert.alert('Access Restricted', 'You do not have permission to update KYC verification.');
                    return;
                  }
                  const target = kycPreviewDoc;
                  setKycDocStatus((prev) => ({ ...prev, [target.key]: 'Unverified' }));
                  setKycPreviewDoc(null);
                  Alert.alert('Marked Unverified', `${target.docName} has been marked unverified.`);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.kycModalDangerBtnText}>Mark Unverified</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOutlineBtn}
                onPress={() => setKycPreviewDoc(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalOutlineBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 4: MARK AS VERIFIED? (Image 3 Screen 1)
         ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={verifyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVerifyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalBackdropTouch}
            onPress={() => setVerifyModalVisible(false)}
          />
          <View style={styles.bottomSheetCard}>
            <Text style={styles.bottomSheetTitle}>Mark as verified?</Text>

            <View style={styles.singleRowCard}>
              <Text style={styles.summaryTableLabel}>Record</Text>
              <Text style={styles.summaryTableValue}>{activeRecordId}</Text>
            </View>

            <Text style={styles.disclaimerNote}>
              Your name and the time are recorded.
            </Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalOutlineBtn}
                onPress={handleConfirmVerify}
                activeOpacity={0.8}
              >
                <Text style={styles.modalOutlineBtnText}>Mark Verified</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOutlineBtn}
                onPress={() => setVerifyModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalOutlineBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 5: FLAG A DISCREPANCY? (Image 3 Screen 2)
         ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={flagModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFlagModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable
            style={styles.modalBackdropTouch}
            onPress={() => setFlagModalVisible(false)}
          />
          <View style={styles.bottomSheetCard}>
            <Text style={styles.bottomSheetTitle}>Flag a discrepancy?</Text>

            <View style={styles.singleRowCard}>
              <Text style={styles.summaryTableLabel}>Record</Text>
              <Text style={styles.summaryTableValue}>{activeRecordId}</Text>
            </View>

            <Text style={styles.inputLabel}>
              Reason <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={styles.textAreaInput}
              multiline
              numberOfLines={3}
              placeholder="Enter reason for discrepancy"
              placeholderTextColor={adminColors.muted}
              value={reasonInput}
              onChangeText={setReasonInput}
            />

            <View style={[styles.modalButtonsRow, { marginTop: adminSpacing.lg }]}>
              <TouchableOpacity
                style={styles.modalOutlineBtn}
                onPress={handleConfirmFlag}
                activeOpacity={0.8}
              >
                <Text style={styles.modalOutlineBtnText}>Flag</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOutlineBtn}
                onPress={() => setFlagModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalOutlineBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 6: REQUEST A CORRECTION? (Image 3 Screen 3)
         ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={correctionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCorrectionModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable
            style={styles.modalBackdropTouch}
            onPress={() => setCorrectionModalVisible(false)}
          />
          <View style={styles.bottomSheetCard}>
            <Text style={styles.bottomSheetTitle}>Request a correction?</Text>

            <View style={styles.singleRowCard}>
              <Text style={styles.summaryTableLabel}>Record</Text>
              <Text style={styles.summaryTableValue}>{activeRecordId}</Text>
            </View>

            <Text style={styles.inputLabel}>
              Reason <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={styles.textAreaInput}
              multiline
              numberOfLines={3}
              placeholder="Enter requested correction details"
              placeholderTextColor={adminColors.muted}
              value={reasonInput}
              onChangeText={setReasonInput}
            />

            <View style={[styles.modalButtonsRow, { marginTop: adminSpacing.lg }]}>
              <TouchableOpacity
                style={styles.modalOutlineBtn}
                onPress={handleConfirmCorrection}
                activeOpacity={0.8}
              >
                <Text style={styles.modalOutlineBtnText}>Send Request</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOutlineBtn}
                onPress={() => setCorrectionModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalOutlineBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <AdminCalendarPickerModal
        visible={expiryCalendarOpen}
        format="DD MMM YYYY"
        value={newExpiryDate}
        onSelect={setNewExpiryDate}
        onClose={() => setExpiryCalendarOpen(false)}
      />
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
  headerEditCircleButton: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    padding: 4,
    marginRight: 4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 19,
    fontWeight: '800',
  },
  headerSubtitleText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 2,
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
  profileSummaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: adminSpacing.md,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FDE8E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#662208',
  },
  profileDetailsCol: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  farmerName: {
    ...adminType.rowTitle,
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  activePill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  activePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2E7D32',
  },
  farmerIdPhone: {
    fontSize: 12,
    color: adminColors.muted,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  neutralPill: {
    backgroundColor: '#F5F2EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  neutralPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#524B46',
  },
  greenPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  greenPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  redPill: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  redPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D32F2F',
  },
  amberPill: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  amberPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: adminColors.warning.text,
  },
  tabSection: {
    marginBottom: adminSpacing.md,
  },
  tabsScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  tabButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: adminRadius.full,
  },
  tabButtonActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  tabButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#524B46',
  },
  tabButtonTextActive: {
    color: adminColors.onBrand,
  },
  sliderBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    paddingHorizontal: 2,
  },
  sliderArrowTouch: {
    padding: 2,
  },
  sliderArrowText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  sliderTrack: {
    flex: 1,
    height: 7,
    backgroundColor: '#EDE8E1',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  sliderThumb: {
    height: '100%',
    backgroundColor: '#78736E',
    borderRadius: 4,
  },
  detailsCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: adminSpacing.lg,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0EA',
  },
  tableLabel: {
    fontSize: 12.5,
    color: adminColors.muted,
  },
  tableValue: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  kycVerifiedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  sectionHeaderTitle: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  lifecycleCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: adminSpacing.xl,
  },
  lifecycleTime: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginBottom: 2,
  },
  lifecycleStatus: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  deactivateBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deactivateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.brand,
  },
  terminateBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: '#D1D5DB',
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  terminateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },

  // ─── Farm & Land Styles (Image 2) ───
  plotCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: 8,
  },
  plotHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  plotIdText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  verifiedPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  verifiedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  plotLocationText: {
    fontSize: 12.5,
    color: adminColors.muted,
    marginBottom: 2,
  },
  plotMetaText: {
    fontSize: 12.5,
    color: adminColors.muted,
    marginBottom: 2,
  },
  plotSubDateText: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
  },
  actionLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xs,
  },
  actionLinkText: {
    ...adminType.sectionHead,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  disclaimerNote: {
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: adminSpacing.lg,
    marginTop: 4,
  },
  fmbCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.lg,
  },
  fmbLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  fmbCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  fmbViewBtn: {
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  fmbViewBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.brand,
  },

  // ─── Product Listing Styles (Image 2 Screen 4) ───
  productCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: adminSpacing.md,
  },
  productHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  pendingReviewPill: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  pendingReviewPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E65100',
  },
  approvedPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  approvedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  productMetaLine: {
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F5F0EA',
  },
  priceLabel: {
    fontSize: 12,
    color: adminColors.muted,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  historyCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: adminSpacing.lg,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  historyLeft: {
    flex: 1,
  },
  historyCropTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 2,
  },
  historyCropSubtitle: {
    fontSize: 11.5,
    color: adminColors.muted,
  },
  historyPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
    marginLeft: adminSpacing.md,
  },
  historyDivider: {
    height: 1,
    backgroundColor: '#F5F0EA',
    marginVertical: 6,
  },

  // ─── Modal & Bottom Sheet Styles ───
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  bottomSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : adminSpacing.xl,
    ...adminShadow.lg,
  },
  bottomSheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.lg,
  },
  summaryTableCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: adminRadius.md,
    marginBottom: adminSpacing.md,
    overflow: 'hidden',
  },
  summaryTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryTableLabel: {
    fontSize: 12.5,
    color: adminColors.muted,
  },
  summaryTableValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  singleRowCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: adminRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 12,
    marginBottom: adminSpacing.sm,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: '#DC2626',
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    fontSize: 12.5,
    color: adminColors.ink,
    height: 70,
    textAlignVertical: 'top',
  },
  inputHelperText: {
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 4,
    marginBottom: adminSpacing.lg,
  },
  terminateWarningBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  terminateWarningText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#B91C1C',
    fontWeight: '600',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  deactivateSubmitBtn: {
    flex: 1,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deactivateSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  terminateSubmitBtn: {
    flex: 1,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  terminateSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  modalOutlineBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOutlineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  fmbPreviewCard: {
    backgroundColor: '#FAFAF9',
    borderWidth: 1,
    borderColor: '#E7E5E4',
    borderRadius: adminRadius.lg,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
  },
  fmbPreviewTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 8,
  },
  fmbPreviewFilename: {
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 2,
  },
  fullWidthCloseBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidthCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },

  // ─── Ratings Tab Styles (Images 1 & 2) ───
  heroRatingCard: {
    backgroundColor: adminColors.brand,
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
    ...adminShadow.md,
  },
  heroScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScoreNum: {
    color: adminColors.onBrand,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroScoreDenominator: {
    color: adminColors.onBrand,
    fontSize: 24,
    fontWeight: '700',
    opacity: 0.9,
    marginTop: 6,
  },
  heroRatingLabel: {
    color: adminColors.onBrand,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 6,
    textAlign: 'center',
    opacity: 0.95,
  },
  heroRatingDate: {
    ...adminType.caption,
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    color: adminColors.onBrand,
    opacity: 0.88,
    marginTop: 4,
    textAlign: 'center',
  },
  twoColumnGrid: {
    flexDirection: 'row',
  },
  metaLabelText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
    fontSize: 11.5,
  },
  metaValueText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },
  historyRatingCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    ...adminShadow.sm,
  },
  historyDateMuted: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '500',
    fontSize: 11.5,
  },
  historyScoreText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
    fontSize: 13.5,
    marginTop: 4,
  },
  ratingScoreCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  ratingScoreLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: adminColors.muted,
    marginBottom: 6,
  },
  ratingScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  ratingBigNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: adminColors.ink,
  },
  ratingDenominator: {
    fontSize: 18,
    fontWeight: '700',
    color: adminColors.ink,
  },
  ratingEffectiveText: {
    fontSize: 11.5,
    color: adminColors.muted,
    textAlign: 'center',
  },
  categoryOverallCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  categoryOverallLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: adminColors.muted,
    marginBottom: 6,
  },
  categoryOverallRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  categoryBigNumber: {
    fontSize: 32,
    fontWeight: '900',
    color: adminColors.ink,
  },
  categoryDenominator: {
    fontSize: 18,
    fontWeight: '700',
    color: adminColors.ink,
  },
  categoryPreviousText: {
    fontSize: 11.5,
    color: adminColors.muted,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0EA',
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    flex: 1,
  },
  categoryScoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#F8F5F0',
    borderWidth: 1,
    borderColor: '#EFEAE2',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    marginLeft: 12,
  },
  categoryScoreNum: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  categoryScoreMax: {
    fontSize: 11,
    fontWeight: '600',
    color: adminColors.muted,
  },
  ratingHistoryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: adminSpacing.md,
  },
  ratingHistoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  ratingHistoryScore: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  ratingHistoryDate: {
    fontSize: 11.5,
    color: adminColors.muted,
  },
  ratingHistorySubtitle: {
    fontSize: 11.5,
    color: adminColors.muted,
  },

  // ─── Audit & History Tab Styles (Image 3) ───
  auditExpiredValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D32F2F',
  },
  historyTabWrap: {
    paddingTop: 4,
  },
  historyEntryRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDE6DF',
    paddingVertical: adminSpacing.sm,
  },
  historyEntryRowLast: {
    borderBottomWidth: 0,
    marginBottom: adminSpacing.md,
  },
  historyEventTime: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginBottom: 3,
  },
  historyEventAction: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  appendOnlyBox: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  appendOnlyText: {
    fontSize: 12,
    color: adminColors.muted,
  },

  // ─── Edit Farm Rating Screen & Accordion Styles (Images 3 & 4) ───
  editRatingSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5B3A29',
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  accordionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  accordionCategoryTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  accordionScorePill: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  accordionScoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  accordionChevron: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  scoreButton: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreButtonSelected: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  scoreButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  scoreButtonTextSelected: {
    color: '#FFFFFF',
  },
  accordionNotesInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 65,
    textAlignVertical: 'top',
    marginTop: 8,
    fontSize: 13,
    color: adminColors.ink,
  },
  fixedBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    ...adminShadow.md,
  },
  saveRatingBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveRatingBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ratingsBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: Platform.OS === 'ios' ? adminSpacing.xl : adminSpacing.md,
    ...adminShadow.lg,
  },
  editRatingBottomBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editRatingBottomBtnText: {
    ...adminType.rowTitle,
    fontSize: 14.5,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  subscriptionSectionHeading: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    marginTop: adminSpacing.sm,
  },
  subFormCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  subInputLabel: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
    marginTop: adminSpacing.xs,
  },
  subPillsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  subSelectorPill: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subSelectorPillActive: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
  },
  subSelectorPillText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.ink,
  },
  subSelectorPillTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  subDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    height: 44,
    marginBottom: adminSpacing.md,
  },
  subDateText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  subTextArea: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.sm,
    minHeight: 64,
    textAlignVertical: 'top',
    ...adminType.body,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  subPrimaryBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subPrimaryBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  subDangerOutlineBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subDangerOutlineBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.danger.text,
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: 2,
  },
  reactivateBtn: {
    flex: 1,
    backgroundColor: adminColors.success.text,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactivateBtnText: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  readyBluePill: {
    backgroundColor: adminColors.info.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: adminColors.info.border,
  },
  readyBluePillText: {
    ...adminType.caption,
    color: adminColors.info.text,
    fontWeight: '700',
  },
  raisePoBtn: {
    flex: 1,
    backgroundColor: adminColors.success.text,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  raisePoBtnText: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  blockListingsBtn: {
    flex: 1,
    backgroundColor: adminColors.danger.text,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockListingsBtnText: {
    ...adminType.rowTitle,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  complianceCardBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  complianceExpiredBorder: {
    borderColor: adminColors.danger.border,
    borderWidth: 1.5,
  },
  complianceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  complianceCertTitle: {
    ...adminType.rowTitle,
    fontSize: 16,
    fontWeight: '700',
    color: adminColors.ink,
  },
  verifiedGreenPill: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: adminColors.success.border,
  },
  verifiedGreenPillText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '700',
  },
  expiredRedPill: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
  },
  expiredRedPillText: {
    ...adminType.caption,
    color: adminColors.danger.text,
    fontWeight: '700',
  },
  complianceCertSubtext: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  complianceBtnRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.md,
  },
  outlineActionBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineActionBtnText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.ink,
  },
  outlineDangerBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.md,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineDangerBtnText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.danger.text,
  },
  solidDangerBtn: {
    flex: 1,
    backgroundColor: adminColors.danger.text,
    borderRadius: adminRadius.md,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidDangerBtnText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.onBrand,
  },
  complianceWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.md,
    padding: adminSpacing.sm,
    marginTop: adminSpacing.sm,
  },
  complianceWarningText: {
    ...adminType.caption,
    color: adminColors.danger.text,
    flex: 1,
  },
  portalLinkText: {
    ...adminType.rowTitle,
    color: adminColors.info.text,
    textDecorationLine: 'underline',
  },
  portalDescriptionText: {
    ...adminType.caption,
    color: adminColors.muted,
    paddingVertical: adminSpacing.xs,
  },
  kycAccordionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  accordionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.md,
  },
  accordionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  kycAccordionChevron: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
  },
  accordionTitle: {
    ...adminType.rowTitle,
    fontSize: 14,
    color: adminColors.ink,
  },
  accordionDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  bankDetailsContainer: {
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  bankAccountsHeader: {
    ...adminType.sectionHead,
    fontSize: 13,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  bankAccountCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  bankAccountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  bankAccountName: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  bankAccountMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  secondaryGrayPill: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  secondaryGrayPillText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },
  upiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    marginBottom: adminSpacing.md,
  },
  upiIdText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  escalatedBluePill: {
    backgroundColor: adminColors.info.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: adminColors.info.border,
  },
  escalatedBluePillText: {
    ...adminType.caption,
    color: adminColors.info.text,
    fontWeight: '700',
  },
  kycWarningStatusText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.danger.text,
  },
  kycDocsListWrap: {
    paddingBottom: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  kycDocRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm + 2,
    gap: adminSpacing.sm,
  },
  kycDocLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: adminSpacing.sm,
  },
  kycDocCloseGlyph: {
    fontSize: 13,
    color: adminColors.muted,
    fontWeight: '600',
  },
  kycDocLabelWrap: {
    flex: 1,
  },
  kycDocTitleText: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '600',
    color: adminColors.ink,
  },
  kycDocStatusWarning: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.danger.text,
    fontWeight: '600',
    marginTop: 2,
  },
  kycDocActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs + 2,
  },
  kycPreviewBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kycPreviewBtnText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  kycRejectBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kycRejectBtnText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.danger.text,
  },
  kycModalDangerBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kycModalDangerBtnText: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.danger.text,
  },
  payoutPreviewCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm + 4,
    marginBottom: adminSpacing.sm,
  },
  payoutPreviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  payoutPreviewSub: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 12,
  },
});
