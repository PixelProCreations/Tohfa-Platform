import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { ScheduleAuditFormScreen } from '../audits/ScheduleAuditFormScreen';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckGreenCircleIcon({ size = 18, color = '#2E7D32' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={color} />
      <Path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MapPinIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
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

function DocumentPdfIcon({ size = 32, color = '#6E6258' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SatelliteMapPreview() {
  return (
    <View style={styles.satelliteContainer}>
      <Svg width="100%" height="150" viewBox="0 0 320 150">
        <Rect width="320" height="150" fill="#2E4A28" rx="12" />
        <Rect x="20" y="10" width="120" height="60" fill="#3D5F34" opacity="0.6" />
        <Rect x="160" y="80" width="140" height="60" fill="#243D1F" opacity="0.7" />

        <Polygon
          points="60,25 240,20 260,120 75,130"
          fill="#EAB308"
          fillOpacity="0.28"
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeDasharray="4 2"
        />

        <Line x1="60" y1="60" x2="245" y2="55" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 3" />
        <Line x1="68" y1="95" x2="252" y2="90" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 3" />

        <Circle cx="60" cy="25" r="4.5" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" />
        <Circle cx="240" cy="20" r="4.5" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" />
        <Circle cx="260" cy="120" r="4.5" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" />
        <Circle cx="75" cy="130" r="4.5" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" />
      </Svg>

      <View style={styles.zoneTagOverlay}>
        <View style={styles.zoneBadge}>
          <Text style={styles.zoneBadgeText}>Zone A · Tomato</Text>
        </View>
        <View style={styles.zoneBadge}>
          <Text style={styles.zoneBadgeText}>Zone B · Carrot</Text>
        </View>
        <View style={styles.zoneBadge}>
          <Text style={styles.zoneBadgeText}>Zone C · Cabbage</Text>
        </View>
      </View>

      <View style={styles.gpsCoordPill}>
        <MapPinIcon size={13} color="#FFFFFF" />
        <Text style={styles.gpsCoordText}>11.4064, 76.6932</Text>
      </View>
    </View>
  );
}

// ─── Screen Mode Types ───────────────────────────────────────────────────────
export type ApplicationReviewScreenMode = 'request_info' | 'waiting_audit' | 'schedule_form';

interface Props {
  application?: any;
  onBack: () => void;
  onApprove?: ((updatedApp?: any) => void) | undefined;
  onReject?: (() => void) | undefined;
  onRequestMoreInfo?: (() => void) | undefined;
  can?: ((code: string) => boolean) | undefined;
  role?: string | undefined;
  userRole?: string | undefined;
}

export const AdminApplicationDetailScreen: React.FC<Props> = ({
  application = {},
  onBack,
  onApprove,
  onReject,
  onRequestMoreInfo,
  can,
  role,
  userRole,
}) => {
  const effectiveRole = role ?? userRole ?? 'TOHFA_ADMIN';
  const canApprove = can
    ? can('farmer.application.approve')
    : (effectiveRole === 'TOHFA_ADMIN' || effectiveRole === 'SUPER_ADMIN');
  const canReject = can
    ? can('farmer.application.reject')
    : (effectiveRole === 'TOHFA_ADMIN' || effectiveRole === 'SUPER_ADMIN');

  const initialStatus = application.status ?? 'Pending';
  const isInitiallyApproved = initialStatus === 'Approved';

  // Screen View Mode: Screen 1 (Request info), Screen 2 (Waiting audit), Screen 3 (Schedule form)
  const [screenMode, setScreenMode] = useState<ApplicationReviewScreenMode>('request_info');

  const [currentStatus, setCurrentStatus] = useState<'Pending' | 'Approved' | 'Rejected'>(
    isInitiallyApproved ? 'Approved' : 'Pending'
  );
  const [docVerified, setDocVerified] = useState<boolean>(isInitiallyApproved);
  const [farmDocVerified, setFarmDocVerified] = useState<boolean>(isInitiallyApproved);
  const [fmbMissing, setFmbMissing] = useState<boolean>(!isInitiallyApproved);
  const [reviewNotes, setReviewNotes] = useState<string>(
    isInitiallyApproved
      ? 'All requirements met. Ready for approval.'
      : 'Review in progress.'
  );

  // Tracking Status State & Dropdown
  const trackingOptions = [
    'Submitted',
    'Documents Under Review',
    'Documents Requested',
    'Farm Verification Visit',
    'Audit Scheduled',
    'Audit Completed',
    'Approved',
    'Rejected',
  ];

  const [trackingStatus, setTrackingStatus] = useState<string>(
    application.trackingStatus ?? (isInitiallyApproved ? 'Approved' : 'Documents Under Review')
  );
  const [showStatusDropdown, setShowStatusDropdown] = useState<boolean>(false);

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    filename: string;
    size: string;
    verified: boolean;
  } | null>(null);

  // Section 06: Request more information state (Screen 1)
  const [missingChips, setMissingChips] = useState<string[]>([
    'Identity proof re-upload',
    'FMB sketch',
  ]);
  const [missingMessage, setMissingMessage] = useState<string>(
    'Please re-upload a clear scan of your identity proof and submit a farm sketch (FMB) showing plot boundaries.'
  );

  const missingOptions = [
    'Identity proof re-upload',
    'FMB sketch',
    'Land ownership proof',
    'Bank details',
    'Other',
  ];

  const toggleChip = (chip: string) => {
    setMissingChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  useEffect(() => {
    if (application.status === 'Approved') {
      setCurrentStatus('Approved');
      setDocVerified(true);
      setFarmDocVerified(true);
      setFmbMissing(false);
      setTrackingStatus('Approved');
      setReviewNotes('All requirements met. Ready for approval.');
    } else if (application.status === 'Pending') {
      setCurrentStatus('Pending');
    }
  }, [application.status]);

  // Step 1: Personal Details (from Screenshot 1)
  const applicantName = application.applicantName ?? application.name ?? 'Kumar';
  const appCode = application.code ?? application.id ?? 'APP-2026-0101';
  const dob = application.dob ?? '12 / 06 / 1985';
  const gender = application.gender ?? 'Male';
  const phone = application.phone ?? '+91 98765 43210';
  const aadhaarNumber = application.aadhaarNumber ?? application.aadhaar ?? '3782 4591 0023';
  const address = application.address ?? 'Kotagiri Village, Kotagiri Taluk, The Nilgiris';
  const submittedDate = application.submittedDate ?? '05 Oct 2026';

  // Step 2: Farm Details & Land Area Difference Calculation
  const farmName = application.farmName ?? 'Great Earth Organic Farm';
  const farmingType = application.farmingType ?? 'Organic';
  const yearsExperience = application.yearsExperience ?? '14';
  const numSeparateFarms = application.numSeparateFarms ?? '2';

  // Area entered by farmer
  const rawFarmerAreaStr = String(application.totalAreaAcres ?? application.landArea ?? '2.5');
  const farmerAreaNum = parseFloat(rawFarmerAreaStr.replace(/[^0-9.]/g, '')) || 2.5;

  // Area marked in FMB sketch
  const rawFmbAreaStr = String(application.fmbAreaAcres ?? application.mappedFmbArea ?? '2.45');
  const fmbAreaNum = parseFloat(rawFmbAreaStr.replace(/[^0-9.]/g, '')) || 2.45;

  // Exact Difference & Variance
  const areaDiff = Number((farmerAreaNum - fmbAreaNum).toFixed(2));
  const diffSign = areaDiff > 0 ? `+${areaDiff}` : `${areaDiff}`;
  const diffPercent = Number(((Math.abs(areaDiff) / fmbAreaNum) * 100).toFixed(1));
  const isWithinMargin = diffPercent <= 5;

  // Step 3: Farm Location & Boundaries (from Screenshot 2)
  const gpsLocation = application.gpsLocation ?? '11.4064, 76.6932';
  const gpsAccuracy = application.gpsAccuracy ?? '±8 m (High)';
  const fmbBoundary = application.fmbBoundary ?? `${fmbAreaNum.toFixed(2)} ac (5 pts)`;

  // Step 4: Documents (from Screenshot 2)
  const idProofFilename = 'aadhaar_suresh.pdf · 1.2 MB';
  const farmDocFilename = 'land_deed.pdf · 3.4 MB';
  const certFilename = 'PGS Organic / NPOP certificate · Valid till 15 Mar 2027';

  // Step 5: Lifecycle Tracker (from Screenshot 2)
  const fullAppId = application.fullAppId ?? 'TOHFA-2026-4817';

  const isApproved = currentStatus === 'Approved';

  const handleMarkVerified = () => {
    setDocVerified(true);
    setFarmDocVerified(true);
    setFmbMissing(false);
    setReviewNotes('All requirements met. Ready for approval.');
    setPreviewDoc(null);
    Alert.alert('Document Verified', 'Document has been verified successfully.');
  };

  const handleSaveProgress = () => {
    Alert.alert('Progress Saved', 'Review notes and tracking progress saved successfully.');
  };

  const handleSelectTrackingStatus = (newStatus: string) => {
    setTrackingStatus(newStatus);
    setShowStatusDropdown(false);
    if (newStatus === 'Approved') {
      setCurrentStatus('Approved');
    } else if (newStatus === 'Rejected') {
      setCurrentStatus('Rejected');
    }
    Alert.alert('Status Updated', `Application tracking status updated to: ${newStatus}`);
  };

  const handleSendRequestInfo = () => {
    onRequestMoreInfo?.();
    setTrackingStatus('Documents Requested');
    Alert.alert(
      'Request Sent',
      'The request for missing documents has been sent to the applicant. The application is now waiting for schedule audit.',
      [
        {
          text: 'View Waiting Audit',
          onPress: () => setScreenMode('waiting_audit'),
        },
      ]
    );
  };

  const handleApprove = () => {
    if (!canApprove) {
      Alert.alert(
        'Permission Denied',
        `Your role (${effectiveRole.replace('_', ' ')}) has view-only rights. Approval requires Tohfa Admin authority.`
      );
      return;
    }

    setDocVerified(true);
    setFarmDocVerified(true);
    setFmbMissing(false);
    setTrackingStatus('Approved');
    setReviewNotes('All requirements met. Ready for approval.');
    setCurrentStatus('Approved');

    const updatedApp = {
      ...application,
      status: 'Approved',
      trackingStatus: 'Approved',
      approvedDate: '10 Oct 2026',
      reviewNotes: 'All requirements met. Ready for approval.',
    };

    onApprove?.(updatedApp);
    Alert.alert('Application Approved', `${applicantName}'s application has been approved.`);
  };

  const handleReject = () => {
    if (!canReject) {
      Alert.alert(
        'Permission Denied',
        `Your role (${effectiveRole.replace('_', ' ')}) cannot reject applications.`
      );
      return;
    }

    Alert.alert(
      'Reject Application',
      `Are you sure you want to reject ${applicantName}'s application?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            setCurrentStatus('Rejected');
            setTrackingStatus('Rejected');
            onReject?.();
            Alert.alert('Application Rejected', 'Application was rejected.');
          },
        },
      ]
    );
  };

  // ─── Screen 3: Schedule Audit Form (M5-S02b) ──────────────────────────────
  if (screenMode === 'schedule_form') {
    return (
      <ScheduleAuditFormScreen
        initialAuditId="AUD-2026-0043"
        onBack={() => setScreenMode('waiting_audit')}
        onScheduleSuccess={() => {
          Alert.alert(
            'Audit Scheduled',
            `Audit AUD-2026-0043 has been successfully scheduled for ${applicantName}.`
          );
          setScreenMode('waiting_audit');
        }}
        onSaveDraft={() => {
          Alert.alert('Draft Saved', 'Audit AUD-2026-0043 draft saved successfully.');
          setScreenMode('waiting_audit');
        }}
      />
    );
  }

  // ─── Screen 1 & Screen 2: Entire Application Review ───────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header: Applicant & Status ─── */}
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

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>{applicantName}</Text>
            <View style={styles.headerSubtitleRow}>
              <Text style={styles.headerSubtitle}>{appCode} · </Text>
              {isApproved ? (
                <View style={styles.headerApprovedPill}>
                  <Text style={styles.headerApprovedPillText}>Approved</Text>
                </View>
              ) : (
                <Text style={styles.headerSubtitle}>Pending</Text>
              )}
            </View>
          </View>
        </View>

        {/* ─── Mode Switcher (Screen 1 vs Screen 2 vs Screen 3) ─── */}
        <View style={styles.screenModePillBar}>
          <TouchableOpacity
            style={[
              styles.modePill,
              screenMode === 'request_info' && styles.modePillActive,
            ]}
            onPress={() => setScreenMode('request_info')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.modePillText,
                screenMode === 'request_info' && styles.modePillTextActive,
              ]}
            >
              01 · Request Info
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modePill,
              screenMode === 'waiting_audit' && styles.modePillActive,
            ]}
            onPress={() => setScreenMode('waiting_audit')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.modePillText,
                screenMode === 'waiting_audit' && styles.modePillTextActive,
              ]}
            >
              02 · Waiting Audit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modePill}
            onPress={() => setScreenMode('schedule_form')}
            activeOpacity={0.8}
          >
            <Text style={styles.modePillText}>
              03 · Schedule Audit
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 01 · Step 1: Personal Details (from Screenshot 1) ─── */}
        <View style={styles.stepHeaderRow}>
          <Text style={styles.sectionHeading}>01 · Personal Details</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Step 1 of 5</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Full Name</Text>
            <Text style={styles.valueBold}>{applicantName}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Date of Birth</Text>
            <Text style={styles.value}>{dob}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Gender</Text>
            <Text style={styles.value}>{gender}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inlineBadgeRow}>
              <Text style={styles.valueBold}>{phone}</Text>
              <View style={styles.badgeVerifiedMini}>
                <Text style={styles.badgeVerifiedMiniText}>OTP Verified</Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Aadhaar / ID Number</Text>
              <Text style={styles.captionSub}>Used to verify identity with TOHFA</Text>
            </View>
            <Text style={styles.valueBold}>{aadhaarNumber}</Text>
          </View>

          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>Address</Text>
            <Text style={[styles.value, { flex: 1, textAlign: 'right' }]}>{address}</Text>
          </View>
        </View>

        {/* ─── 02 · Step 2: Farm Details (from Screenshot 1) ─── */}
        <View style={styles.stepHeaderRow}>
          <Text style={styles.sectionHeading}>02 · Farm Details</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Step 2 of 5</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Farm Name</Text>
            <Text style={styles.valueBold}>{farmName}</Text>
          </View>

          <View style={styles.columnBox}>
            <Text style={styles.label}>Type of Farming</Text>
            <View style={styles.farmingChipsRow}>
              {['Natural', 'Organic', 'Bio-dynamic', 'Others'].map((type) => {
                const isSelected = type === farmingType;
                return (
                  <View
                    key={type}
                    style={[
                      styles.farmingTypeChip,
                      isSelected && styles.farmingTypeChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.farmingTypeChipText,
                        isSelected && styles.farmingTypeChipTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Years of Experience</Text>
            <Text style={styles.value}>{yearsExperience} years</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Number of Separate Farms</Text>
            <Text style={styles.valueBold}>{numSeparateFarms} farms</Text>
          </View>

          {/* Land Area Comparison & Difference Calculation */}
          <View style={styles.row}>
            <Text style={styles.label}>Total Area (Farmer Entered)</Text>
            <Text style={styles.valueBold}>{farmerAreaNum.toFixed(2)} acres</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Area Marked in FMB Sketch</Text>
            <Text style={styles.value}>{fmbAreaNum.toFixed(2)} acres</Text>
          </View>

          <View style={styles.areaDiffBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.areaDiffTitle}>Area Variance (Diff)</Text>
              <Text style={styles.areaDiffSub}>
                {isWithinMargin
                  ? 'Difference is within acceptable margin (±5%)'
                  : 'Area variance requires surveyor confirmation'}
              </Text>
            </View>
            <View style={styles.areaDiffPill}>
              <Text style={styles.areaDiffPillText}>
                {diffSign} ac ({diffPercent}%)
              </Text>
            </View>
          </View>
        </View>

        {/* ─── 03 · Step 3: Farm Location & Boundaries (from Screenshot 2) ─── */}
        <View style={styles.stepHeaderRow}>
          <Text style={styles.sectionHeading}>03 · Farm Location & Boundaries</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Step 3 of 5</Text>
          </View>
        </View>

        <View style={styles.cardNoPadding}>
          <SatelliteMapPreview />

          <View style={styles.mapSummaryCard}>
            <View style={styles.mapSummaryRow}>
              <View>
                <Text style={styles.mapSummaryTitle}>{farmName}</Text>
                <Text style={styles.mapSummarySub}>
                  GPS: {gpsLocation} · Accuracy: {gpsAccuracy}
                </Text>
              </View>
              <View style={styles.totalAreaBadge}>
                <Text style={styles.totalAreaBadgeText}>{fmbAreaNum.toFixed(2)} ac</Text>
              </View>
            </View>

            <View style={styles.zonesInfoRow}>
              <View style={styles.zoneStatBox}>
                <Text style={styles.zoneStatLabel}>ZONES</Text>
                <Text style={styles.zoneStatValue}>3 (A, B, C)</Text>
              </View>
              <View style={styles.zoneStatBox}>
                <Text style={styles.zoneStatLabel}>FMB BOUNDARY</Text>
                <Text style={styles.zoneStatValue}>{fmbBoundary}</Text>
              </View>
              <View style={styles.zoneStatBox}>
                <Text style={styles.zoneStatLabel}>FMB STATUS</Text>
                <TouchableOpacity
                  onPress={() => setFmbMissing((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.zoneStatValue,
                      { color: fmbMissing ? '#B45309' : '#2E7D32', fontWeight: '800' },
                    ]}
                  >
                    {fmbMissing ? 'Pending' : 'Provided'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.zonesListContainer}>
              <View style={styles.zoneListItem}>
                <Text style={styles.zoneNameText}>Zone A</Text>
                <Text style={styles.zoneCropText}>Tomato · 1.02 ha</Text>
                <Text style={styles.zoneStatusText}>Active</Text>
              </View>
              <View style={styles.zoneListItem}>
                <Text style={styles.zoneNameText}>Zone B</Text>
                <Text style={styles.zoneCropText}>Carrot · 0.85 ha</Text>
                <Text style={styles.zoneStatusText}>Active</Text>
              </View>
              <View style={[styles.zoneListItem, { borderBottomWidth: 0 }]}>
                <Text style={styles.zoneNameText}>Zone C</Text>
                <Text style={styles.zoneCropText}>Cabbage · 0.58 ha</Text>
                <Text style={styles.zoneStatusText}>Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── 04 · Step 4: Documents (from Screenshot 2) ─── */}
        <View style={styles.stepHeaderRow}>
          <Text style={styles.sectionHeading}>04 · KYC & Farm Documents</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Step 4 of 5</Text>
          </View>
        </View>

        {/* ID Proof */}
        <View style={styles.docActionCard}>
          <View style={styles.docHeaderRow}>
            <View style={styles.docIconTitleRow}>
              <CheckGreenCircleIcon size={20} color={docVerified ? '#2E7D32' : '#B45309'} />
              <View>
                <Text style={styles.docTitle}>ID Proof</Text>
                <Text style={styles.docSub}>{idProofFilename}</Text>
              </View>
            </View>
            <View style={docVerified ? styles.badgeVerified : styles.badgePending}>
              <Text style={docVerified ? styles.badgeVerifiedText : styles.badgePendingText}>
                {docVerified ? 'Verified' : 'Pending'}
              </Text>
            </View>
          </View>

          <View style={styles.docButtonsRow}>
            <TouchableOpacity
              style={styles.previewBtn}
              onPress={() =>
                setPreviewDoc({
                  title: 'ID Proof (Aadhaar)',
                  filename: idProofFilename,
                  size: '1.2 MB',
                  verified: docVerified,
                })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.previewBtnText}>Preview</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.markVerifiedBtn}
              onPress={() => setDocVerified((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Text style={styles.markVerifiedBtnText}>
                {docVerified ? 'Verified ✓' : 'Mark verified'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Farm Documents */}
        <View style={styles.docActionCard}>
          <View style={styles.docHeaderRow}>
            <View style={styles.docIconTitleRow}>
              <CheckGreenCircleIcon size={20} color={farmDocVerified ? '#2E7D32' : '#B45309'} />
              <View>
                <Text style={styles.docTitle}>Farm Documents (Land Deed)</Text>
                <Text style={styles.docSub}>{farmDocFilename}</Text>
              </View>
            </View>
            <View style={farmDocVerified ? styles.badgeVerified : styles.badgePending}>
              <Text style={farmDocVerified ? styles.badgeVerifiedText : styles.badgePendingText}>
                {farmDocVerified ? 'Verified' : 'Pending'}
              </Text>
            </View>
          </View>

          <View style={styles.docButtonsRow}>
            <TouchableOpacity
              style={styles.previewBtn}
              onPress={() =>
                setPreviewDoc({
                  title: 'Farm Documents (Land Deed)',
                  filename: farmDocFilename,
                  size: '3.4 MB',
                  verified: farmDocVerified,
                })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.previewBtnText}>Preview</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.markVerifiedBtn}
              onPress={() => setFarmDocVerified((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Text style={styles.markVerifiedBtnText}>
                {farmDocVerified ? 'Verified ✓' : 'Mark verified'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Certification */}
        <View style={styles.docActionCard}>
          <View style={styles.docHeaderRow}>
            <View style={styles.docIconTitleRow}>
              <CheckGreenCircleIcon size={20} color="#2E7D32" />
              <View>
                <Text style={styles.docTitle}>Certification (Optional)</Text>
                <Text style={styles.docSub}>{certFilename}</Text>
              </View>
            </View>
            <View style={styles.badgeVerified}>
              <Text style={styles.badgeVerifiedText}>Provided</Text>
            </View>
          </View>

          <View style={styles.docButtonsRow}>
            <TouchableOpacity
              style={[styles.previewBtn, { flex: 1 }]}
              onPress={() =>
                setPreviewDoc({
                  title: 'Certification (PGS Organic / NPOP)',
                  filename: certFilename,
                  size: '2.1 MB',
                  verified: true,
                })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.previewBtnText}>Preview Certificate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── 05 · Step 5: Review & Application Tracking (from Screenshot 2) ─── */}
        <View style={styles.stepHeaderRow}>
          <Text style={styles.sectionHeading}>05 · Application Tracking & Lifecycle</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>Step 5 of 5</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Application ID</Text>
            <Text style={styles.valueBold}>{fullAppId}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Submitted On</Text>
            <Text style={styles.value}>{submittedDate}</Text>
          </View>

          {/* Interactive Status Dropdown to Update Tracking Status */}
          <View style={styles.statusDropdownSection}>
            <Text style={styles.label}>Update Tracking Status</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setShowStatusDropdown(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownTriggerText}>{trackingStatus}</Text>
              <ChevronDownIcon size={16} color={adminColors.ink} />
            </TouchableOpacity>
          </View>

          {/* Terms confirmation agreement */}
          <View style={styles.termsAgreementBox}>
            <CheckGreenCircleIcon size={16} color="#2E7D32" />
            <Text style={styles.termsAgreementText}>
              Farmer confirmed all information is accurate and agreed to TOHFA&apos;s Terms and Privacy Policy.
            </Text>
          </View>

          {/* 5-Stage Lifecycle Tracker */}
          <Text style={[styles.fieldLabel, { marginTop: adminSpacing.md }]}>
            Application Progression Tracker
          </Text>
          <View style={styles.lifecycleTracker}>
            {/* Stage 1 */}
            <View style={styles.stageItem}>
              <View style={styles.stageIndicatorCol}>
                <View style={styles.stageDotActive}>
                  <Text style={styles.stageDotText}>✓</Text>
                </View>
                <View style={styles.stageLine} />
              </View>
              <View style={styles.stageContent}>
                <Text style={styles.stageTitle}>Submitted</Text>
                <Text style={styles.stageSub}>{submittedDate} · Complete</Text>
              </View>
            </View>

            {/* Stage 2 */}
            <View style={styles.stageItem}>
              <View style={styles.stageIndicatorCol}>
                <View
                  style={
                    trackingStatus === 'Submitted'
                      ? styles.stageDotPending
                      : trackingStatus === 'Documents Requested'
                        ? styles.stageDotWarning
                        : styles.stageDotActive
                  }
                >
                  <Text style={styles.stageDotText}>
                    {trackingStatus === 'Submitted' ? '2' : '✓'}
                  </Text>
                </View>
                <View style={styles.stageLine} />
              </View>
              <View style={styles.stageContent}>
                <Text style={styles.stageTitle}>Documents Under Review</Text>
                <Text style={styles.stageSub}>
                  {trackingStatus === 'Documents Requested'
                    ? 'Documents requested from applicant'
                    : docVerified && farmDocVerified
                      ? 'All documents verified'
                      : 'In progress · Verification ongoing'}
                </Text>
              </View>
            </View>

            {/* Stage 3 */}
            <View style={styles.stageItem}>
              <View style={styles.stageIndicatorCol}>
                <View
                  style={
                    trackingStatus === 'Farm Verification Visit' || trackingStatus === 'Audit Scheduled'
                      ? styles.stageDotInProgress
                      : trackingStatus === 'Audit Completed' || trackingStatus === 'Approved'
                        ? styles.stageDotActive
                        : styles.stageDotPending
                  }
                >
                  <Text style={styles.stageDotText}>
                    {trackingStatus === 'Audit Completed' || trackingStatus === 'Approved'
                      ? '✓'
                      : '3'}
                  </Text>
                </View>
                <View style={styles.stageLine} />
              </View>
              <View style={styles.stageContent}>
                <Text style={styles.stageTitle}>Farm Verification Visit</Text>
                <Text style={styles.stageSub}>
                  {trackingStatus === 'Farm Verification Visit'
                    ? 'Visit in progress'
                    : trackingStatus === 'Audit Scheduled'
                      ? 'Audit scheduled'
                      : 'Pending visit'}
                </Text>
              </View>
            </View>

            {/* Stage 4 */}
            <View style={styles.stageItem}>
              <View style={styles.stageIndicatorCol}>
                <View
                  style={
                    trackingStatus === 'Audit Completed' || trackingStatus === 'Approved'
                      ? styles.stageDotActive
                      : styles.stageDotPending
                  }
                >
                  <Text style={styles.stageDotText}>
                    {trackingStatus === 'Audit Completed' || trackingStatus === 'Approved'
                      ? '✓'
                      : '4'}
                  </Text>
                </View>
                <View style={styles.stageLine} />
              </View>
              <View style={styles.stageContent}>
                <Text style={styles.stageTitle}>Audit Completed</Text>
                <Text style={styles.stageSub}>
                  {trackingStatus === 'Audit Completed' || trackingStatus === 'Approved'
                    ? 'Field audit report submitted'
                    : 'Pending field audit report'}
                </Text>
              </View>
            </View>

            {/* Stage 5 */}
            <View style={styles.stageItem}>
              <View style={styles.stageIndicatorCol}>
                <View style={isApproved ? styles.stageDotActive : styles.stageDotPending}>
                  <Text style={styles.stageDotText}>{isApproved ? '✓' : '5'}</Text>
                </View>
              </View>
              <View style={styles.stageContent}>
                <Text style={styles.stageTitle}>Final Decision</Text>
                <Text style={styles.stageSub}>
                  {isApproved
                    ? 'Approved by Admin'
                    : trackingStatus === 'Rejected'
                      ? 'Application Rejected'
                      : 'Pending Admin Decision'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── 06 · Request more information (Screen 1 only) ─── */}
        {screenMode === 'request_info' && (
          <>
            <Text style={styles.sectionHeading}>06 · Request More Information</Text>
            <View style={styles.card}>
              <Text style={styles.reqSubHead}>What is missing?</Text>
              <View style={styles.chipsContainer}>
                {missingOptions.map((opt) => {
                  const isSelected = missingChips.includes(opt);
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.chipPill,
                        isSelected && styles.chipPillSelected,
                      ]}
                      onPress={() => toggleChip(opt)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.chipPillText,
                          isSelected && styles.chipPillTextSelected,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.reqSubHead, { marginTop: adminSpacing.md }]}>
                Message to the applicant
              </Text>
              <TextInput
                style={styles.messageInput}
                value={missingMessage}
                onChangeText={setMissingMessage}
                multiline
                placeholder="Enter message for applicant..."
                placeholderTextColor={adminColors.muted}
              />

              <TouchableOpacity
                style={styles.sendRequestBtn}
                onPress={handleSendRequestInfo}
                activeOpacity={0.85}
              >
                <Text style={styles.sendRequestBtnText}>Send Request for Information</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ─── Decision Block: 07 in Screen 1, 06 in Screen 2 ─── */}
        <Text style={styles.sectionHeading}>
          {screenMode === 'request_info' ? '07 · Decision & Notes' : '06 · Decision & Notes'}
        </Text>
        <View style={styles.decisionSection}>
          <Text style={styles.fieldLabel}>Review notes</Text>
          <TextInput
            style={styles.notesInput}
            value={reviewNotes}
            onChangeText={setReviewNotes}
            multiline
            placeholder="Add internal review notes..."
            placeholderTextColor={adminColors.muted}
          />

          <TouchableOpacity
            style={styles.saveProgressBtn}
            onPress={handleSaveProgress}
            activeOpacity={0.8}
          >
            <Text style={styles.saveProgressBtnText}>Save Progress</Text>
          </TouchableOpacity>
        </View>

        {/* Caption matching Screen 2 mockup */}
        {screenMode === 'waiting_audit' && (
          <Text style={styles.screenCaption}>
            M3-S03 · Application Review (Waiting Schedule Audit)
          </Text>
        )}

        <View style={{ height: adminSpacing.xxxl * 2 }} />
      </ScrollView>

      {/* ─── Sticky Bottom Action Bar ─── */}
      <View style={styles.bottomActionBar}>
        {screenMode === 'request_info' ? (
          <>
            <TouchableOpacity
              style={styles.orangeApproveBtn}
              onPress={handleApprove}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Approve Application"
            >
              <Text style={styles.orangeApproveBtnText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rejectOutlineBtn}
              onPress={handleReject}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Reject Application"
            >
              <Text style={styles.rejectOutlineBtnText}>Reject</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.fullScheduleAuditBtn}
            onPress={() => setScreenMode('schedule_form')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Schedule Audit"
          >
            <Text style={styles.fullScheduleAuditBtnText}>Schedule Audit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Modal: Status Dropdown Picker ─── */}
      <Modal visible={showStatusDropdown} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowStatusDropdown(false)}
        >
          <View style={styles.bottomSheet}>
            <Text style={styles.bottomSheetTitle}>Update Tracking Status</Text>
            <View style={styles.statusOptionsList}>
              {trackingOptions.map((opt) => {
                const isSelected = opt === trackingStatus;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.statusOptionItem,
                      isSelected && styles.statusOptionItemSelected,
                    ]}
                    onPress={() => handleSelectTrackingStatus(opt)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        isSelected && styles.statusOptionTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                    {isSelected && <CheckGreenCircleIcon size={16} color={adminColors.brand} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Modal: Document Preview ─── */}
      <Modal visible={previewDoc !== null} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.bottomSheet}>
            <Text style={styles.bottomSheetTitle}>{previewDoc?.title ?? 'Document preview'}</Text>

            <View style={styles.docPreviewFileBox}>
              <DocumentPdfIcon />
              <Text style={styles.docPreviewFileName}>{previewDoc?.filename}</Text>
              <Text style={styles.docPreviewFileSub}>
                File Size: {previewDoc?.size} · Format: PDF Document
              </Text>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalMarkVerifiedBtn}
                onPress={handleMarkVerified}
                activeOpacity={0.8}
              >
                <Text style={styles.modalMarkVerifiedBtnText}>Mark Verified</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setPreviewDoc(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: adminSpacing.sm + 2,
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
  headerTitleBox: {},
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: adminColors.onBrand,
    fontWeight: '500',
  },
  headerApprovedPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  headerApprovedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  screenModePillBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: adminRadius.full,
    padding: 3,
    marginTop: adminSpacing.sm,
    justifyContent: 'space-between',
  },
  modePill: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.full,
  },
  modePillActive: {
    backgroundColor: adminColors.card,
    ...adminShadow.sm,
  },
  modePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  modePillTextActive: {
    color: adminColors.brand,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxxl * 2,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.xs,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  stepBadge: {
    backgroundColor: '#F3E8DF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  stepBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: adminColors.brand,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm + 2,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  cardNoPadding: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0EA',
  },
  columnBox: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0EA',
  },
  label: {
    fontSize: 12.5,
    color: adminColors.muted,
  },
  captionSub: {
    fontSize: 10.5,
    color: adminColors.muted,
    marginTop: 1,
  },
  value: {
    fontSize: 13,
    color: adminColors.ink,
  },
  valueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  inlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeVerifiedMini: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  badgeVerifiedMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2E7D32',
  },
  farmingChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  farmingTypeChip: {
    flex: 1,
    backgroundColor: '#F8F6F2',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmingTypeChipActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  farmingTypeChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: adminColors.muted,
  },
  farmingTypeChipTextActive: {
    color: '#2E7D32',
    fontWeight: '800',
  },
  areaDiffBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginVertical: 6,
  },
  areaDiffTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
  },
  areaDiffSub: {
    fontSize: 10.5,
    color: adminColors.muted,
    marginTop: 1,
  },
  areaDiffPill: {
    backgroundColor: '#F5EBE1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  areaDiffPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: adminColors.brand,
  },
  satelliteContainer: {
    position: 'relative',
    height: 150,
    backgroundColor: '#2E4A28',
  },
  zoneTagOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    gap: 6,
  },
  zoneBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  zoneBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  gpsCoordPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  gpsCoordText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  mapSummaryCard: {
    padding: adminSpacing.md,
    backgroundColor: adminColors.card,
  },
  mapSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mapSummaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  mapSummarySub: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 2,
  },
  totalAreaBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  totalAreaBadgeText: {
    color: '#2E7D32',
    fontWeight: '800',
    fontSize: 12,
  },
  zonesInfoRow: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    padding: 8,
    marginVertical: 8,
    justifyContent: 'space-between',
  },
  zoneStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  zoneStatLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: adminColors.muted,
    marginBottom: 2,
  },
  zoneStatValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  zonesListContainer: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F5F0EA',
  },
  zoneListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0EA',
  },
  zoneNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    width: 60,
  },
  zoneCropText: {
    fontSize: 12,
    color: adminColors.muted,
    flex: 1,
  },
  zoneStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  docActionCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 8,
    ...adminShadow.sm,
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  docIconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  docSub: {
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 1,
  },
  badgeVerified: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  badgeVerifiedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2E7D32',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  badgePendingText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
  },
  docButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  previewBtn: {
    flex: 1,
    height: 38,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  markVerifiedBtn: {
    flex: 1,
    height: 38,
    backgroundColor: adminColors.brand,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markVerifiedBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  statusDropdownSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0EA',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  dropdownTriggerText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  termsAgreementBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  termsAgreementText: {
    flex: 1,
    fontSize: 11,
    color: '#166534',
    lineHeight: 15,
  },
  lifecycleTracker: {
    marginTop: 8,
    paddingLeft: 4,
  },
  stageItem: {
    flexDirection: 'row',
    gap: 12,
  },
  stageIndicatorCol: {
    alignItems: 'center',
    width: 22,
  },
  stageDotActive: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageDotInProgress: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageDotWarning: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#B45309',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageDotPending: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stageLine: {
    width: 2,
    height: 22,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  stageContent: {
    flex: 1,
    paddingBottom: 14,
  },
  stageTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  stageSub: {
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 1,
  },
  reqSubHead: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipPill: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipPillSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: adminColors.brand,
  },
  chipPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: adminColors.muted,
  },
  chipPillTextSelected: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  messageInput: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 10,
    padding: adminSpacing.md,
    fontSize: 12,
    color: adminColors.ink,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: adminSpacing.md,
  },
  sendRequestBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendRequestBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  decisionSection: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 10,
    padding: adminSpacing.md,
    fontSize: 12,
    color: adminColors.ink,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: adminSpacing.md,
  },
  saveProgressBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveProgressBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.brand,
  },
  screenCaption: {
    textAlign: 'center',
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: adminSpacing.lg,
    fontWeight: '600',
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm + 2,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    flexDirection: 'row',
    gap: adminSpacing.md,
    ...adminShadow.lg,
  },
  orangeApproveBtn: {
    flex: 1,
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  orangeApproveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  rejectOutlineBtn: {
    flex: 1,
    height: 48,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectOutlineBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B45309',
  },
  fullScheduleAuditBtn: {
    flex: 1,
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  fullScheduleAuditBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    padding: adminSpacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    ...adminShadow.lg,
  },
  bottomSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
    textAlign: 'center',
    marginBottom: adminSpacing.md,
  },
  statusOptionsList: {
    gap: 6,
  },
  statusOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  statusOptionItemSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: adminColors.brand,
  },
  statusOptionText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: adminColors.ink,
  },
  statusOptionTextSelected: {
    fontWeight: '800',
    color: adminColors.brand,
  },
  docPreviewFileBox: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 12,
    padding: adminSpacing.lg,
    alignItems: 'center',
    marginBottom: adminSpacing.lg,
  },
  docPreviewFileName: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 8,
  },
  docPreviewFileSub: {
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 2,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  modalMarkVerifiedBtn: {
    flex: 1,
    height: 46,
    backgroundColor: adminColors.brand,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMarkVerifiedBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  modalCloseBtn: {
    flex: 1,
    height: 46,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
});
