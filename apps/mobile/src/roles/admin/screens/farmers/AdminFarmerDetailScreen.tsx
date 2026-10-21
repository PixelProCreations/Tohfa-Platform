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
import type { FarmerListItem } from './AdminAllFarmersScreen';

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
  | 'Audit'
  | 'History'
  | 'Personal'
  | 'Farm & land'
  | 'Soil'
  | 'Product listing';

export interface AdminFarmerDetailScreenProps {
  farmer: FarmerListItem;
  onBack: () => void;
  onEdit?: (currentTab: FarmerDetailTabType) => void;
  onDisable?: () => void;
  onOpenFarmMap?: () => void;
  onOpenKycReview?: () => void;
  onOpenRatingScorecard?: () => void;
  initialTab?: FarmerDetailTabType;
  onTabChange?: (tab: FarmerDetailTabType) => void;
}

type Props = AdminFarmerDetailScreenProps;

export const AdminFarmerDetailScreen: React.FC<Props> = ({
  farmer,
  onBack,
  onEdit,
  onDisable,
  onOpenFarmMap,
  onOpenKycReview,
  onOpenRatingScorecard,
  initialTab = 'Personal',
  onTabChange,
}) => {
  const normalizeTab = (tab?: FarmerDetailTabType): FarmerDetailTabType => {
    if (!tab || tab === 'Overview') return 'Personal';
    if (tab === 'Farm') return 'Farm & land';
    return tab;
  };

  const [activeTab, setActiveTab] = useState<FarmerDetailTabType>(normalizeTab(initialTab));
  const [accountStatus, setAccountStatus] = useState<'Active' | 'Inactive' | 'Terminated'>(
    farmer.status === 'DISABLED' ? 'Inactive' : 'Active'
  );

  useEffect(() => {
    setActiveTab(normalizeTab(initialTab));
  }, [initialTab]);

  // Tab scrollbar interactive state
  const tabScrollRef = useRef<ScrollView>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [trackWidth, setTrackWidth] = useState(200);
  const maxScrollWidthRef = useRef(150);

  const tabs: { key: FarmerDetailTabType; label: string }[] = [
    { key: 'Personal', label: 'Personal' },
    { key: 'Farm & land', label: 'Farm & land' },
    { key: 'Soil', label: 'Soil' },
    { key: 'Product listing', label: 'Product listing' },
    { key: 'KYC', label: 'KYC' },
    { key: 'Ratings', label: 'Ratings' },
    { key: 'Subscription', label: 'Subscription' },
    { key: 'Audit', label: 'Audit' },
    { key: 'History', label: 'History' },
  ];

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
      Alert.alert('Required', 'Please enter a reason for termination.');
      return;
    }
    setAccountStatus('Terminated');
    setTerminateModalVisible(false);
    onDisable?.();
    Alert.alert('Account Terminated', 'Farmer account has been terminated permanently.');
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
          <Text style={styles.headerTitle}>Farmer Profile</Text>
          {onEdit && (
            <TouchableOpacity
              style={[styles.backButton, { marginLeft: 'auto' }]}
              onPress={() => onEdit(activeTab)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Edit"
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
          )}
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
                <Text style={styles.farmerName}>{farmer.name || 'Ramesh Kumar'}</Text>
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
                {farmer.code || 'FMR-00124'} · {farmer.mobile || '+91 90000 20000'}
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

            <View style={styles.redPill}>
              <Text style={styles.redPillText}>Certification expired</Text>
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
                <Text style={styles.tableValue}>{farmer.name || 'Ramesh Kumar'}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Farmer ID</Text>
                <Text style={styles.tableValue}>{farmer.code || 'FMR-00124'}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Phone</Text>
                <Text style={styles.tableValue}>{farmer.mobile || '+91 90000 20000'}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Address</Text>
                <Text style={styles.tableValue}>Demo village 1, Coonoor</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Zone</Text>
                <Text style={styles.tableValue}>{farmer.location || 'Coonoor'}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Farming type</Text>
                <Text style={styles.tableValue}>{farmer.farmingType || 'Natural'}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Farm profile</Text>
                <Text style={styles.tableValue}>Mixed vegetable farm.</Text>
              </View>

              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.tableLabel}>Registered</Text>
                <Text style={styles.tableValue}>{farmer.memberSince || '10 Jan 2026'}</Text>
              </View>
            </View>

            {/* Account Lifecycle */}
            <Text style={styles.sectionHeaderTitle}>Account lifecycle</Text>
            <View style={styles.lifecycleCard}>
              <Text style={styles.lifecycleTime}>5 Oct 2026, 10:00 · Applicant</Text>
              <Text style={styles.lifecycleStatus}>Approved</Text>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.deactivateBtn}
                onPress={handleOpenDeactivateModal}
                activeOpacity={0.8}
              >
                <Text style={styles.deactivateBtnText}>Deactivate account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.terminateBtn}
                onPress={handleOpenTerminateModal}
                activeOpacity={0.8}
              >
                <Text style={styles.terminateBtnText}>Terminate Account</Text>
              </TouchableOpacity>
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

            <View style={styles.tableRow}>
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
                  <Text style={styles.historyCropSubtitle}>05 Aug 2026 · Rejected</Text>
                </View>
                <Text style={styles.historyPrice}>₹18.00/KG</Text>
              </View>
            </View>
          </>
        )}

        {/* ─── TAB 5: KYC (Image 3 Screen 4) ─── */}
        {activeTab === 'KYC' && (
          <View style={styles.detailsCard}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Identity proof</Text>
              <Text style={styles.kycVerifiedText}>Verified</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Land ownership proof</Text>
              <Text style={styles.kycVerifiedText}>Verified</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.tableLabel}>Bank details</Text>
              <Text style={styles.kycVerifiedText}>Verified</Text>
            </View>
          </View>
        )}

        {/* ─── TAB 6: RATINGS (M3-S04d · Ratings tab) ─── */}
        {activeTab === 'Ratings' && (
          <>
            {/* Current Rating Hero Card */}
            <View style={styles.ratingScoreCard}>
              <Text style={styles.ratingScoreLabel}>CURRENT RATING</Text>
              <View style={styles.ratingScoreRow}>
                <Text style={styles.ratingBigNumber}>3.0</Text>
                <Text style={styles.ratingDenominator}> / 5</Text>
              </View>
              <Text style={styles.ratingEffectiveText}>
                Effective 01 Aug 2026 · Source: Audit assessment · By Auditor
              </Text>
            </View>

            {/* Rating Metadata Table Card */}
            <View style={styles.detailsCard}>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Previous rating</Text>
                <Text style={styles.tableValue}>—</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Effective</Text>
                <Text style={styles.tableValue}>10 Jan 2026, 09:30</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Changed by</Text>
                <Text style={styles.tableValue}>System</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Reason</Text>
                <Text style={styles.tableValue}>Initial assessment</Text>
              </View>

              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.tableLabel}>Scale</Text>
                <Text style={styles.tableValue}>1 to 100, steps of 5.0</Text>
              </View>
            </View>

            {/* Rating Categories Section */}
            <Text style={styles.sectionHeaderTitle}>Rating categories</Text>

            {/* New Overall Rating Card */}
            <View style={styles.categoryOverallCard}>
              <Text style={styles.categoryOverallLabel}>NEW OVERALL RATING</Text>
              <View style={styles.categoryOverallRow}>
                <Text style={styles.categoryBigNumber}>78</Text>
                <Text style={styles.categoryDenominator}> / 100</Text>
              </View>
              <Text style={styles.categoryPreviousText}>Previous: 68 / 100</Text>
            </View>

            {/* Categories Breakdown Table */}
            <View style={styles.detailsCard}>
              <View style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>Certification & Compliance</Text>
                <Text style={styles.categoryScore}>8/10</Text>
              </View>

              <View style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>Soil & Land Management</Text>
                <Text style={styles.categoryScore}>7/10</Text>
              </View>

              <View style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>Farming Practices</Text>
                <Text style={styles.categoryScore}>8/10</Text>
              </View>

              <View style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>Environmental Sustainability</Text>
                <Text style={styles.categoryScore}>7/10</Text>
              </View>

              <View style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>Produce Quality & Yield</Text>
                <Text style={styles.categoryScore}>8/10</Text>
              </View>

              <View style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>Traceability & Transparency</Text>
                <Text style={styles.categoryScore}>9/10</Text>
              </View>

              <View style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>Social & Labor Practices</Text>
                <Text style={styles.categoryScore}>7/10</Text>
              </View>

              <View style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>Financial & Operational</Text>
                <Text style={styles.categoryScore}>8/10</Text>
              </View>

              <View style={styles.categoryRow}>
                <Text style={styles.categoryLabel}>Market & Buyer Relations</Text>
                <Text style={styles.categoryScore}>8/10</Text>
              </View>

              <View style={[styles.categoryRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.categoryLabel}>Innovation & Improvement</Text>
                <Text style={styles.categoryScore}>8/10</Text>
              </View>
            </View>

            {/* History Section */}
            <Text style={styles.sectionHeaderTitle}>History</Text>

            {/* History Item 1 */}
            <View style={styles.ratingHistoryCard}>
              <View style={styles.ratingHistoryHeaderRow}>
                <Text style={styles.ratingHistoryScore}>3.0 / 5</Text>
                <Text style={styles.ratingHistoryDate}>01 Aug 2026</Text>
              </View>
              <Text style={styles.ratingHistorySubtitle}>
                Previous 2.5 · Source: Audit assessment · By Auditor
              </Text>
            </View>

            {/* History Item 2 */}
            <View style={styles.ratingHistoryCard}>
              <View style={styles.ratingHistoryHeaderRow}>
                <Text style={styles.ratingHistoryScore}>2.5 / 5</Text>
                <Text style={styles.ratingHistoryDate}>02 Feb 2026</Text>
              </View>
              <Text style={styles.ratingHistorySubtitle}>
                Previous — (first rating) · By Priya Nair
              </Text>
            </View>
          </>
        )}

        {/* ─── TAB 7: SUBSCRIPTION (M3-S04e · Subscription tab) ─── */}
        {activeTab === 'Subscription' && (
          <View style={styles.detailsCard}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Plan</Text>
              <Text style={styles.tableValue}>Basic</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Status</Text>
              <Text style={styles.tableValue}>Active</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Valid from</Text>
              <Text style={styles.tableValue}>10 Jan 2026</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Valid until</Text>
              <Text style={styles.tableValue}>10 Jan 2027</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.tableLabel}>Payment history</Text>
              <Text style={styles.tableValue}>Not available</Text>
            </View>
          </View>
        )}

        {/* ─── TAB 8: AUDIT (M3-S04f · Audit tab) ─── */}
        {activeTab === 'Audit' && (
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
        )}

        {/* ─── TAB 9: HISTORY (M3-S04g · History tab) ─── */}
        {activeTab === 'History' && (
          <View style={styles.historyTabWrap}>
            <Text style={styles.historyEventTime}>10 Jan 2026, 09:00 · System</Text>
            <Text style={styles.historyEventAction}>Registered: — to Active</Text>

            <View style={styles.appendOnlyBox}>
              <LockIcon size={16} color={adminColors.muted} />
              <Text style={styles.appendOnlyText}>The history is append-only.</Text>
            </View>
          </View>
        )}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>

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
                <Text style={styles.summaryTableValue}>{farmer.name || 'Ramesh Kumar'} · {farmer.code || 'FMR-00124'}</Text>
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
            <Text style={styles.bottomSheetTitle}>Terminate this account?</Text>

            <View style={styles.summaryTableCard}>
              <View style={styles.summaryTableRow}>
                <Text style={styles.summaryTableLabel}>Name</Text>
                <Text style={styles.summaryTableValue}>{farmer.name || 'Ramesh Kumar'} · {farmer.code || 'FMR-00124'}</Text>
              </View>
              <View style={styles.summaryTableRow}>
                <Text style={styles.summaryTableLabel}>Action</Text>
                <Text style={styles.summaryTableValue}>Terminate</Text>
              </View>
              <View style={[styles.summaryTableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.summaryTableLabel}>Status</Text>
                <Text style={styles.summaryTableValue}>Active to Terminate</Text>
              </View>
            </View>

            <Text style={styles.inputLabel}>
              Reason <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={styles.textAreaInput}
              multiline
              numberOfLines={3}
              placeholder="Enter reason for termination"
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

            {/* Warning Permanent Banner */}
            <View style={styles.terminateWarningBanner}>
              <BanAlertIcon size={18} color="#D32F2F" />
              <Text style={styles.terminateWarningText}>
                Terminating this account is permanent. The user will lose access, and the account cannot be reactivated or edited. This action cannot be undone.
              </Text>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.terminateSubmitBtn}
                onPress={handleConfirmTerminate}
                activeOpacity={0.8}
              >
                <Text style={styles.terminateSubmitBtnText}>Terminate</Text>
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
    color: adminColors.ink,
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
    flexWrap: 'wrap',
    gap: adminSpacing.md,
    paddingTop: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F5F0EA',
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
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
    backgroundColor: '#DC2626',
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
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    flex: 1,
  },
  categoryScore: {
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.ink,
    marginLeft: 12,
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
  historyEventTime: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginBottom: 3,
  },
  historyEventAction: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.lg,
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
});
