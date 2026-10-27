import React, { useState } from 'react';
import {
  Alert,
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

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocumentPdfIcon({ size = 38, color = '#6E6258' }: { size?: number; color?: string }) {
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

interface Props {
  application?: any;
  onBack: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onRequestMoreInfo?: () => void;
}

export const AdminApplicationDetailScreen: React.FC<Props> = ({
  application = {},
  onBack,
  onApprove,
  onReject,
  onRequestMoreInfo,
}) => {
  const initialStatus = application.status ?? 'Pending';
  const isInitiallyApproved = initialStatus === 'Approved';

  const [currentStatus, setCurrentStatus] = useState<'Pending' | 'Approved' | 'Rejected'>(
    isInitiallyApproved ? 'Approved' : 'Pending'
  );
  const [docVerified, setDocVerified] = useState<boolean>(isInitiallyApproved);
  const [fmbMissing, setFmbMissing] = useState<boolean>(!isInitiallyApproved);
  const [reviewNotes, setReviewNotes] = useState<string>(
    isInitiallyApproved
      ? 'All requirements met. Ready for approval.'
      : 'Waiting on document verification.'
  );
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [bottomActionView, setBottomActionView] = useState<'scheduleAudit' | 'decision'>('scheduleAudit');

  const applicantName = application.applicantName ?? application.name ?? 'Sathish Kumar';
  const appCode = application.code ?? 'APP-2026-0101';
  const phone = application.phone ?? '+91 99801 00100';
  const address = application.address ?? 'Thottam Street, Ooty';
  const submittedDate = application.submittedDate ?? '05 Oct 2026';

  const isApproved = currentStatus === 'Approved';
  const isBlocked = !docVerified || fmbMissing;

  const handleMarkVerified = () => {
    setDocVerified(true);
    setShowPreviewModal(false);
    Alert.alert('Document Verified', 'Identity proof has been marked as verified.');
  };

  const handleSaveProgress = () => {
    Alert.alert('Progress Saved', 'Review notes and verification progress saved successfully.');
  };

  const handleScheduleAudit = () => {
    Alert.alert(
      'Schedule Audit',
      'Audit has been scheduled for Sathish Kumar Farm. Ready to review decision.',
      [
        {
          text: 'Proceed to Decision',
          onPress: () => setBottomActionView('decision'),
        },
        {
          text: 'OK',
          onPress: () => setBottomActionView('decision'),
        },
      ]
    );
  };

  const handleApprove = () => {
    if (isBlocked) {
      Alert.alert(
        'Approval Blocked',
        'Identity proof is unverified or the FMB sketch is missing. Would you like to mark all requirements verified and approve?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Verify & Approve',
            onPress: () => {
              setDocVerified(true);
              setFmbMissing(false);
              setReviewNotes('All requirements met. Ready for approval.');
              setCurrentStatus('Approved');
              onApprove?.();
            },
          },
        ]
      );
      return;
    }

    setCurrentStatus('Approved');
    Alert.alert('Application Approved', `${applicantName}'s application has been approved.`, [
      {
        text: 'OK',
        onPress: () => {
          onApprove?.();
        },
      },
    ]);
  };

  const handleReject = () => {
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
            onReject?.();
            Alert.alert('Application Rejected', 'Application was rejected.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header: Sathish Kumar ─── */}
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
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 01 · Applicant ─── */}
        <Text style={styles.sectionHeading}>01 · Applicant</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{applicantName}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{phone}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Address</Text>
            <Text style={styles.value}>{address}</Text>
          </View>

          {isApproved ? (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Zone</Text>
                <Text style={styles.value}>Ooty</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Address</Text>
                <Text style={styles.value}>{address}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Application ID</Text>
                <Text style={styles.value}>{appCode}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Application States</Text>
                <Text style={styles.value}>Approved</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Submitted</Text>
                <Text style={styles.value}>{submittedDate}</Text>
              </View>

              <View style={[styles.row, { borderBottomWidth: 0 }]}>
                <Text style={styles.label}>Approved</Text>
                <Text style={styles.value}>10 Oct 2026</Text>
              </View>
            </>
          ) : (
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Submitted</Text>
              <Text style={styles.value}>{submittedDate}</Text>
            </View>
          )}
        </View>

        {/* ─── 02 · Farm & land ─── */}
        <Text style={styles.sectionHeading}>02 · Farm & land</Text>
        <View style={styles.card}>
          {isApproved ? (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Farm location</Text>
                <Text style={styles.value}>Demo plot, Ooty</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Land area</Text>
                <Text style={styles.value}>2.0 acre</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Area type</Text>
                <Text style={styles.value}>Rectangular</Text>
              </View>

              <View style={[styles.row, { borderBottomWidth: 0 }]}>
                <Text style={styles.label}>FMB sketch</Text>
                <Text style={[styles.value, { color: adminColors.ink }]}>fmb-0101.pdf</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Location</Text>
                <Text style={styles.value}>Ooty, zone A</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Land area</Text>
                <Text style={styles.value}>1.8 acres</Text>
              </View>

              <View style={[styles.row, { borderBottomWidth: 0 }]}>
                <Text style={styles.label}>FMB sketch</Text>
                <TouchableOpacity
                  onPress={() => setFmbMissing((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.value,
                      { color: fmbMissing ? '#D32F2F' : '#2E7D32' },
                    ]}
                  >
                    {fmbMissing ? 'Missing' : 'Provided'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* ─── 03 · KYC documents ─── */}
        <Text style={styles.sectionHeading}>03 · KYC documents</Text>
        {isApproved ? (
          <View style={styles.approvedKycContainer}>
            {/* Identity proof */}
            <View style={styles.docItemCard}>
              <View style={styles.docHeaderRow}>
                <Text style={styles.docTitle}>Identity proof</Text>
                <View style={styles.badgeVerified}>
                  <Text style={styles.badgeVerifiedText}>Verified</Text>
                </View>
              </View>
              <Text style={styles.docSub}>Number XXXX XXXX 0000 · Submitted 5 Oct 2026</Text>
            </View>

            {/* Land ownership proof */}
            <View style={styles.docItemCard}>
              <View style={styles.docHeaderRow}>
                <Text style={styles.docTitle}>Land ownership proof</Text>
                <View style={styles.badgeVerified}>
                  <Text style={styles.badgeVerifiedText}>Verified</Text>
                </View>
              </View>
              <Text style={styles.docSub}>Number XXXX XXXX 0977 · Submitted 5 Oct 2026</Text>
            </View>

            {/* Bank details */}
            <View style={styles.docItemCard}>
              <View style={styles.docHeaderRow}>
                <Text style={styles.docTitle}>Bank details</Text>
                <View style={styles.badgePending}>
                  <Text style={styles.badgePendingText}>Pending</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.docActionCard}>
              <View style={styles.docHeaderRow}>
                <Text style={styles.docTitle}>Identity proof</Text>
                <View style={docVerified ? styles.badgeVerified : styles.badgePending}>
                  <Text style={docVerified ? styles.badgeVerifiedText : styles.badgePendingText}>
                    {docVerified ? 'Verified' : 'Pending'}
                  </Text>
                </View>
              </View>
              <Text style={styles.docSub}>XXXX XXXX 4821 · submitted 05 Oct 2026</Text>

              <View style={styles.docButtonsRow}>
                <TouchableOpacity
                  style={styles.previewBtn}
                  onPress={() => setShowPreviewModal(true)}
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
                    {docVerified ? 'Verified' : 'Mark verified'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.docProposedCaption}>
              2 more documents (land ownership proof, bank details) are shown the same way — proposed list, to confirm.
            </Text>
          </>
        )}

        {/* ─── 04 · Farming ─── */}
        <Text style={styles.sectionHeading}>04 · Farming</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Farming type</Text>
            <Text style={styles.value}>{isApproved ? 'Organic' : 'Natural'}</Text>
          </View>

          <View style={isApproved ? styles.row : [styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>Crops</Text>
            <Text style={styles.value}>Carrot, Cabbage</Text>
          </View>

          {isApproved && (
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.label}>Declaration</Text>
              <Text style={[styles.value, { flex: 1, textAlign: 'right' }]}>
                Organic practices declaration submitted
              </Text>
            </View>
          )}
        </View>

        {/* ─── 05 · Decision ─── */}
        <Text style={styles.sectionHeading}>05 · Decision</Text>
        {isApproved ? (
          <View style={styles.decisionApprovedSection}>
            {/* Requirements for approval card */}
            <View style={styles.reqCard}>
              <Text style={styles.reqCardTitle}>Requirements for approval</Text>

              <View style={styles.reqRow}>
                <Text style={styles.reqLabel}>Identity proof</Text>
                <View style={styles.badgeVerified}>
                  <Text style={styles.badgeVerifiedText}>Verified</Text>
                </View>
              </View>

              <View style={styles.reqRow}>
                <Text style={styles.reqLabel}>Land ownership proof</Text>
                <View style={styles.badgeVerified}>
                  <Text style={styles.badgeVerifiedText}>Verified</Text>
                </View>
              </View>

              <View style={styles.reqRow}>
                <Text style={styles.reqLabel}>Bank details</Text>
                <View style={styles.badgePending}>
                  <Text style={styles.badgePendingText}>Pending</Text>
                </View>
              </View>

              <View style={[styles.reqRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.reqLabel}>Farm location, land area and FMB sketch</Text>
                <View style={styles.badgeProvided}>
                  <Text style={styles.badgeProvidedText}>Provided</Text>
                </View>
              </View>
            </View>

            {/* Review notes */}
            <Text style={styles.fieldLabel}>Review notes</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesBoxText}>{reviewNotes}</Text>
            </View>

            <TouchableOpacity
              style={styles.saveProgressBtn}
              onPress={handleSaveProgress}
              activeOpacity={0.8}
            >
              <Text style={styles.saveProgressBtnText}>Save Progress</Text>
            </TouchableOpacity>

            {/* Review history */}
            <Text style={[styles.fieldLabel, { marginTop: adminSpacing.lg }]}>Review history</Text>
            <Text style={styles.reviewHistoryTime}>5 Oct 2026, 10:00 · Applicant</Text>
            <Text style={styles.reviewHistoryStatus}>Approved</Text>
          </View>
        ) : (
          <View style={styles.decisionPendingSection}>
            {/* Warning block alert box */}
            {isBlocked ? (
              <View style={styles.blockedAlertBox}>
                <Text style={styles.blockedAlertText}>
                  Approval is blocked: Identity proof is unverified and the FMB sketch is missing.
                </Text>
              </View>
            ) : (
              <View style={styles.unblockedAlertBox}>
                <Text style={styles.unblockedAlertText}>
                  All requirements met. Ready for approval.
                </Text>
              </View>
            )}

            {/* Review notes input */}
            <Text style={styles.fieldLabel}>Review notes</Text>
            <TextInput
              style={styles.notesInput}
              value={reviewNotes}
              onChangeText={setReviewNotes}
              multiline
            />

            <TouchableOpacity
              style={styles.saveProgressBtn}
              onPress={handleSaveProgress}
              activeOpacity={0.8}
            >
              <Text style={styles.saveProgressBtnText}>Save Progress</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>

      {/* ─── Sticky Bottom Action Bar (Pending State) ─── */}
      {!isApproved && (
        <View style={styles.bottomActionBar}>
          {bottomActionView === 'scheduleAudit' ? (
            <TouchableOpacity
              style={styles.scheduleAuditBtn}
              onPress={handleScheduleAudit}
              activeOpacity={0.8}
            >
              <Text style={styles.scheduleAuditBtnText}>Schedule Audit</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.approveBtn, isBlocked ? styles.approveBtnDisabled : styles.approveBtnEnabled]}
                onPress={handleApprove}
                activeOpacity={0.8}
              >
                <Text style={styles.approveBtnText}>Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.rejectBtn} onPress={handleReject} activeOpacity={0.8}>
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* ─── Modal: KYC Documents Preview (matching Image 2 & 3 Right) ─── */}
      <Modal visible={showPreviewModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          {/* Dimmed Background Content Preview */}
          <View style={styles.modalBgTopArea}>
            <View style={styles.modalTopFilterRow}>
              <View style={styles.modalFilterPillInactive}>
                <Text style={styles.modalFilterPillTextInactive}>KYC</Text>
              </View>
              <View style={styles.modalFilterPillActive}>
                <Text style={styles.modalFilterPillTextActive}>FMB & land</Text>
              </View>
              <View style={styles.modalFilterPillInactive}>
                <Text style={styles.modalFilterPillTextInactive}>Soil</Text>
              </View>
            </View>

            <View style={styles.modalPlotCard}>
              <View style={styles.modalPlotCardHeader}>
                <Text style={styles.modalPlotTitle}>PLT-00124-1</Text>
                <View style={styles.badgeVerified}>
                  <Text style={styles.badgeVerifiedText}>Verified</Text>
                </View>
              </View>
              <Text style={styles.modalPlotSub}>Demo plot, Coonoor</Text>
              <Text style={styles.modalPlotSub}>Rectangular · 1 acre · Tomato</Text>
              <Text style={styles.modalPlotSub}>Submitted 12 Jan 2026</Text>
            </View>
          </View>

          {/* Bottom Sheet Card */}
          <View style={styles.bottomSheet}>
            <Text style={styles.bottomSheetTitle}>KYC documents preview</Text>

            <View style={styles.docPreviewFileBox}>
              <DocumentPdfIcon />
              <Text style={styles.docPreviewFileName}>KYC documents</Text>
              <Text style={styles.docPreviewFileSub}>kyc-doc-1.pdf</Text>
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
                onPress={() => setShowPreviewModal(false)}
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
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxxl + 60,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0EA',
  },
  label: {
    fontSize: 12.5,
    color: adminColors.muted,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  docActionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  docSub: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
  },
  docButtonsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  previewBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.brand,
  },
  markVerifiedBtn: {
    flex: 1,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markVerifiedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  docProposedCaption: {
    fontSize: 10.5,
    color: adminColors.muted,
    marginTop: 8,
    lineHeight: 14,
  },
  approvedKycContainer: {
    gap: adminSpacing.sm,
  },
  docItemCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  badgeVerified: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  badgeVerifiedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2E7D32',
  },
  badgePending: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  badgePendingText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#D97706',
  },
  badgeProvided: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  badgeProvidedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2E7D32',
  },
  decisionPendingSection: {
    gap: adminSpacing.md,
  },
  decisionApprovedSection: {
    gap: adminSpacing.sm,
  },
  blockedAlertBox: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
  },
  blockedAlertText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D32F2F',
    lineHeight: 16,
  },
  unblockedAlertBox: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
  },
  unblockedAlertText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  notesInput: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    fontSize: 13,
    color: adminColors.ink,
    minHeight: 65,
    textAlignVertical: 'top',
  },
  notesBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    minHeight: 55,
  },
  notesBoxText: {
    fontSize: 13,
    color: adminColors.ink,
  },
  saveProgressBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveProgressBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.brand,
  },
  reqCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    gap: adminSpacing.sm,
  },
  reqCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 4,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0EA',
  },
  reqLabel: {
    fontSize: 12.5,
    color: adminColors.ink,
    flex: 1,
  },
  reviewHistoryTime: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginBottom: 2,
  },
  reviewHistoryStatus: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
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
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
    flexDirection: 'row',
    gap: adminSpacing.md,
    ...adminShadow.lg,
  },
  scheduleAuditBtn: {
    flex: 1,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleAuditBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  approveBtn: {
    flex: 1,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnDisabled: {
    backgroundColor: '#A39B95',
  },
  approveBtnEnabled: {
    backgroundColor: '#2E7D32',
  },
  approveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: '#D32F2F',
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D32F2F',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'flex-end',
  },
  modalBgTopArea: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 40,
    paddingBottom: adminSpacing.xl,
    opacity: 0.85,
  },
  modalTopFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: adminSpacing.md,
  },
  modalFilterPillActive: {
    backgroundColor: '#A17D62',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: adminRadius.full,
  },
  modalFilterPillInactive: {
    backgroundColor: '#D1C4B7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: adminRadius.full,
  },
  modalFilterPillTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalFilterPillTextInactive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#524B46',
  },
  modalPlotCard: {
    backgroundColor: '#EAE2D8',
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    gap: 3,
  },
  modalPlotCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalPlotTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  modalPlotSub: {
    fontSize: 11.5,
    color: '#6B6560',
  },
  bottomSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl + 4,
    borderTopRightRadius: adminRadius.xl + 4,
    paddingHorizontal: adminSpacing.xl,
    paddingTop: adminSpacing.xl,
    paddingBottom: adminSpacing.xxxl,
    gap: adminSpacing.lg,
    ...adminShadow.lg,
  },
  bottomSheetTitle: {
    ...adminType.sectionHead,
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  docPreviewFileBox: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.xl,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  docPreviewFileName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  docPreviewFileSub: {
    fontSize: 12,
    color: adminColors.muted,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  modalMarkVerifiedBtn: {
    flex: 1,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMarkVerifiedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  modalCloseBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
});
