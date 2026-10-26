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
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  type DisputeItem,
  FOLLOWUP_REQUIRED_OPTIONS,
  INITIAL_DISPUTES,
  RESOLUTION_OUTCOME_OPTIONS,
  TOHFA_RESPONSE_OPTIONS,
} from './fixtures';

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

function ChevronDownIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 18, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="8" x2="12" y2="8.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="12" y1="11" x2="12" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function UploadFileIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 18v-6M9 15l3-3 3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ResizeGripIcon({ size = 12, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Line x1="14" y1="6" x2="6" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="14" y1="10" x2="10" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function CheckmarkCircleSuccessIcon({ size = 72 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72" fill="none">
      <Circle cx="36" cy="36" r="35" fill={adminColors.success.bg} stroke={adminColors.success.border} strokeWidth="1.5" />
      <Path
        d="M23 36.5l9 9 17-17"
        stroke={adminColors.success.text}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface FarmerDisputeResolutionScreenProps {
  dispute?: DisputeItem | undefined;
  onBack: () => void;
  onResolvedSuccess?: ((updatedDispute: DisputeItem) => void) | undefined;
}

export function FarmerDisputeResolutionScreen({
  dispute: propDispute,
  onBack,
  onResolvedSuccess,
}: FarmerDisputeResolutionScreenProps) {
  const dispute = propDispute ?? INITIAL_DISPUTES[0]!;

  // Form State
  const [outcome, setOutcome] = useState<string>('Select an outcome');
  const [showOutcomePicker, setShowOutcomePicker] = useState(false);

  const [resolutionSummary, setResolutionSummary] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  const [tohfaResponse] = useState<string>('No TOHFA response recorded');

  const [followupRequired, setFollowupRequired] = useState<string>('Select');
  const [showFollowupPicker, setShowFollowupPicker] = useState(false);

  const [uploadedAttachment, setUploadedAttachment] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Review confirmation modal
  const [showReviewConfirmModal, setShowReviewConfirmModal] = useState(false);

  // Success view
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  const handleReviewAndSubmit = () => {
    if (outcome === 'Select an outcome') {
      setValidationError('Please select a valid resolution outcome.');
      return;
    }
    if (!resolutionSummary.trim()) {
      setValidationError('Please enter a resolution summary.');
      return;
    }
    setValidationError(null);
    setShowReviewConfirmModal(true);
  };

  const handleConfirmFinalResolution = () => {
    setShowReviewConfirmModal(false);
    setIsSavedSuccessfully(true);
  };

  const handleFinishAndReturn = () => {
    const updated: DisputeItem = {
      ...dispute,
      status: 'Resolved',
      lastActivityDate: '15 Oct 2026',
      resolutionNote: resolutionSummary.trim() || outcome,
    };
    if (onResolvedSuccess) {
      onResolvedSuccess(updated);
    } else {
      onBack();
    }
  };

  const handlePickAttachment = () => {
    Alert.alert('Upload Attachment', 'Attach a signed resolution or supporting file:', [
      { text: 'Resolution_Agreement_Signed.pdf', onPress: () => setUploadedAttachment('Resolution_Agreement_Signed.pdf') },
      { text: 'Inspection_Report.jpg', onPress: () => setUploadedAttachment('Inspection_Report.jpg') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Terracotta Header (Screenshot 1) ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Dispute Resolution</Text>
            <Text style={styles.headerSubtitle}>
              {dispute.id} · {isSavedSuccessfully ? 'Resolved' : dispute.status}
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Success View State ─── */}
      {isSavedSuccessfully ? (
        <View style={styles.successContainer}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.successContentPad}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.successIconBadgeWrap}>
              <CheckmarkCircleSuccessIcon size={72} />
            </View>

            <Text style={styles.successTitle}>Resolution Saved Successfully</Text>
            <Text style={styles.successSub}>Confirmed by the mediation desk</Text>

            {/* Summary Confirmation Card */}
            <View style={styles.successCard}>
              <View style={styles.successCardRow}>
                <View style={styles.successColLeft}>
                  <Text style={styles.successFieldLabel}>Dispute</Text>
                  <Text style={styles.successFieldValue}>{dispute.id}</Text>
                </View>
                <View style={styles.successColRight}>
                  <Text style={styles.successFieldLabel}>Updated Status</Text>
                  <View style={styles.resolvedBadge}>
                    <Text style={styles.resolvedBadgeText}>Resolved</Text>
                  </View>
                </View>
              </View>

              <View style={styles.successCardDivider} />

              <View style={styles.successCardOutcomeRow}>
                <Text style={styles.successFieldLabel}>Outcome</Text>
                <Text style={styles.successFieldValue}>{outcome}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.successBackBtn}
              onPress={handleFinishAndReturn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Back to Disputes"
            >
              <Text style={styles.successBackBtnText}>Back to Disputes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      ) : (
        /* ─── Form View with Fixed Bottom Action Bar (Screenshots 1 & 2) ─── */
        <View style={styles.formContainer}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Dispute summary (Screenshot 1) */}
            <Text style={styles.sectionHeader}>Dispute summary</Text>
            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.colLeft}>
                  <Text style={styles.fieldLabel}>Dispute</Text>
                  <Text style={styles.fieldValueBold}>{dispute.id}</Text>
                </View>
                <View style={styles.colRight}>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <Text style={styles.fieldValueBold}>{dispute.status}</Text>
                </View>
              </View>

              <View style={styles.twoColRow}>
                <View style={styles.colLeft}>
                  <Text style={styles.fieldLabel}>Farmer</Text>
                  <Text style={styles.fieldValueBold}>{dispute.raisedBy}</Text>
                </View>
                <View style={styles.colRight}>
                  <Text style={styles.fieldLabel}>Category</Text>
                  <Text style={styles.fieldValueBold}>{dispute.category}</Text>
                </View>
              </View>

              <View style={styles.fullWidthField}>
                <Text style={styles.fieldLabel}>Subject</Text>
                <Text style={styles.fieldValueBold}>{dispute.title}</Text>
              </View>

              <View style={styles.fullWidthField}>
                <Text style={styles.fieldLabel}>Original complaint</Text>
                <Text style={styles.fieldValueRegular}>{dispute.description}</Text>
              </View>

              <View style={styles.twoColRowLast}>
                <View style={styles.colLeft}>
                  <Text style={styles.fieldLabel}>TOHFA reference</Text>
                  <Text style={styles.fieldValueBold}>
                    {dispute.linkedRecord || 'Purchase Order PO-2026-00124'}
                  </Text>
                </View>
                <View style={styles.colRight}>
                  <Text style={styles.fieldLabel}>Evidence</Text>
                  <Text style={styles.fieldValueBold}>
                    {dispute.evidence ? `${dispute.evidence.length} attached` : '2 attached'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. Previous mediation notes (Screenshot 1) */}
            <Text style={styles.sectionHeader}>Previous mediation notes</Text>
            <View style={styles.card}>
              <Text style={styles.fieldValueRegular}>
                {dispute.adminNotes?.[0]?.text ||
                  'Spoke to the farmer. The accepted price matches the purchase order; the difference needs a TOHFA explanation.'}
              </Text>
              <View style={styles.noteAuthorRow}>
                <Text style={styles.noteAuthorText}>
                  {dispute.adminNotes?.[0]?.author || 'Suresh Kumar'}
                </Text>
                <Text style={styles.noteDateText}>
                  {dispute.adminNotes?.[0]?.date || '09 Oct 2026, 10:30'}
                </Text>
              </View>
            </View>

            {/* 3. Outcome Form (Screenshots 1 & 2) */}
            <Text style={styles.sectionHeader}>Outcome</Text>
            <View style={styles.card}>
              {/* Field: Resolution Outcome */}
              <Text style={styles.formFieldLabel}>
                Resolution Outcome <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setShowOutcomePicker(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Select resolution outcome"
              >
                <Text
                  style={[
                    styles.dropdownBtnText,
                    outcome === 'Select an outcome' && styles.dropdownPlaceholder,
                  ]}
                >
                  {outcome}
                </Text>
                <ChevronDownIcon size={18} color={adminColors.ink} />
              </TouchableOpacity>

              <Text style={styles.proposedNotice}>Proposed — Requires TOHFA Approval</Text>

              {/* Field: Resolution Summary */}
              <Text style={styles.formFieldLabel}>
                Resolution Summary <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.textareaWrapper}>
                <TextInput
                  style={styles.textarea}
                  placeholder=""
                  placeholderTextColor={adminColors.placeholder}
                  multiline
                  numberOfLines={4}
                  value={resolutionSummary}
                  onChangeText={(val) => {
                    setResolutionSummary(val);
                    if (validationError) setValidationError(null);
                  }}
                />
                <View style={styles.resizeIndicator}>
                  <ResizeGripIcon size={12} color={adminColors.muted} />
                </View>
              </View>

              {/* Field: Action Taken */}
              <Text style={styles.formFieldLabel}>Action Taken</Text>
              <View style={styles.textareaWrapper}>
                <TextInput
                  style={styles.textarea}
                  placeholder=""
                  placeholderTextColor={adminColors.placeholder}
                  multiline
                  numberOfLines={4}
                  value={actionTaken}
                  onChangeText={setActionTaken}
                />
                <View style={styles.resizeIndicator}>
                  <ResizeGripIcon size={12} color={adminColors.muted} />
                </View>
              </View>

              {/* Field: TOHFA Response */}
              <Text style={styles.formFieldLabel}>TOHFA Response</Text>
              <View style={styles.disabledDropdown}>
                <Text style={styles.disabledDropdownText}>{tohfaResponse}</Text>
                <ChevronDownIcon size={18} color={adminColors.muted} />
              </View>

              {/* Field: Follow-up Required */}
              <Text style={styles.formFieldLabel}>Follow-up Required</Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setShowFollowupPicker(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Select follow up required"
              >
                <Text
                  style={[
                    styles.dropdownBtnText,
                    followupRequired === 'Select' && styles.dropdownPlaceholder,
                  ]}
                >
                  {followupRequired}
                </Text>
                <ChevronDownIcon size={18} color={adminColors.ink} />
              </TouchableOpacity>

              {/* Field: Supporting Attachment */}
              <Text style={styles.formFieldLabel}>Supporting Attachment (optional)</Text>
              <TouchableOpacity
                style={styles.uploadDashedCard}
                onPress={handlePickAttachment}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Upload supporting attachment"
              >
                <UploadFileIcon size={18} color={adminColors.brandDeep} />
                <Text style={styles.uploadText}>
                  {uploadedAttachment ? uploadedAttachment : 'Upload file'}
                </Text>
              </TouchableOpacity>
            </View>



            {validationError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{validationError}</Text>
              </View>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* 5. Sticky Bottom Action Buttons: Review & Cancel (Screenshots 1 & 2) */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleReviewAndSubmit}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Review resolution"
            >
              <Text style={styles.primaryBtnText}>Review</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onBack}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Cancel resolution"
            >
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ─── Resolution Outcome Picker Bottom Sheet Modal ─── */}
      <Modal
        visible={showOutcomePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOutcomePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowOutcomePicker(false)}>
          <View style={styles.bottomSheetOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.bottomSheetCard}>
                <Text style={styles.bottomSheetTitle}>Select Resolution Outcome</Text>
                <View style={styles.optionsList}>
                  {RESOLUTION_OUTCOME_OPTIONS.filter((o) => o !== 'Select an outcome').map((item, idx) => {
                    const isSelected = outcome === item;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.optionItem,
                          isSelected && styles.optionItemActive,
                        ]}
                        onPress={() => {
                          setOutcome(item);
                          setShowOutcomePicker(false);
                          if (validationError) setValidationError(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                        {isSelected && <Text style={styles.checkMark}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  style={styles.sheetCancelBtn}
                  onPress={() => setShowOutcomePicker(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sheetCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Follow-up Required Picker Bottom Sheet Modal ─── */}
      <Modal
        visible={showFollowupPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFollowupPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFollowupPicker(false)}>
          <View style={styles.bottomSheetOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.bottomSheetCard}>
                <Text style={styles.bottomSheetTitle}>Follow-up Required</Text>
                <View style={styles.optionsList}>
                  {FOLLOWUP_REQUIRED_OPTIONS.map((item, idx) => {
                    const isSelected = followupRequired === item;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.optionItem,
                          isSelected && styles.optionItemActive,
                        ]}
                        onPress={() => {
                          setFollowupRequired(item);
                          setShowFollowupPicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                        {isSelected && <Text style={styles.checkMark}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  style={styles.sheetCancelBtn}
                  onPress={() => setShowFollowupPicker(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sheetCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Review Confirmation Modal ─── */}
      <Modal
        visible={showReviewConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReviewConfirmModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowReviewConfirmModal(false)}>
          <View style={styles.centerOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.confirmCard}>
                <Text style={styles.confirmTitle}>Review Resolution</Text>
                <Text style={styles.confirmSubtitle}>
                  Please review the proposed resolution before confirming:
                </Text>

                <View style={styles.confirmReviewBox}>
                  <Text style={styles.fieldLabel}>Outcome</Text>
                  <Text style={styles.fieldValueBold}>{outcome}</Text>

                  <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Resolution Summary</Text>
                  <Text style={styles.fieldValueRegular}>{resolutionSummary}</Text>

                  {actionTaken.trim() ? (
                    <>
                      <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Action Taken</Text>
                      <Text style={styles.fieldValueRegular}>{actionTaken}</Text>
                    </>
                  ) : null}

                  <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Follow-up</Text>
                  <Text style={styles.fieldValueBold}>{followupRequired}</Text>
                </View>

                <View style={styles.confirmBtnRow}>
                  <TouchableOpacity
                    style={styles.confirmPrimaryBtn}
                    onPress={handleConfirmFinalResolution}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.confirmPrimaryBtnText}>Confirm Resolution</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmSecondaryBtn}
                    onPress={() => setShowReviewConfirmModal(false)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.confirmSecondaryBtnText}>Edit Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -adminSpacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.onBrand,
    opacity: 0.95,
    marginTop: 2,
  },
  formContainer: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
  },
  sectionHeader: {
    ...adminType.rowTitle,
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    marginBottom: 8,
    ...adminShadow.sm,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  twoColRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  col: {
    flex: 1,
  },
  colLeft: {
    flex: 1.25,
    paddingRight: 6,
  },
  colRight: {
    flex: 0.85,
  },
  fullWidthField: {
    marginBottom: 12,
  },
  fullWidthFieldLast: {
    marginBottom: 0,
  },
  fieldLabel: {
    ...adminType.caption,
    fontSize: 11.5,
    fontWeight: '600',
    color: adminColors.muted,
    marginBottom: 3,
  },
  fieldValueBold: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  fieldValueRegular: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    lineHeight: 19.5,
  },
  noteAuthorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  noteAuthorText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11.5,
    fontWeight: '600',
  },
  noteDateText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontSize: 11.5,
    fontWeight: '500',
  },

  // Outcome Form Fields
  formFieldLabel: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  requiredStar: {
    color: adminColors.danger.text,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: 14,
    height: 48,
  },
  dropdownBtnText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13.5,
    fontWeight: '600',
  },
  dropdownPlaceholder: {
    color: adminColors.placeholder,
    fontWeight: '400',
  },
  disabledDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: 14,
    height: 48,
  },
  disabledDropdownText: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 13,
  },
  proposedNotice: {
    ...adminType.caption,
    color: adminColors.warning.text,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 6,
  },
  textareaWrapper: {
    position: 'relative',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    minHeight: 90,
  },
  textarea: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    minHeight: 90,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  resizeIndicator: {
    position: 'absolute',
    right: 5,
    bottom: 5,
  },
  uploadDashedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 14,
    marginTop: 2,
    marginBottom: 4,
  },
  uploadText: {
    ...adminType.body,
    color: adminColors.brandDeep,
    fontSize: 13.5,
    fontWeight: '700',
  },

  // Authority Notice Box (Screenshot 2)
  authorityNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    borderRadius: adminRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  authorityNoticeText: {
    flex: 1,
    ...adminType.caption,
    color: adminColors.warning.text,
    fontSize: 11.5,
    lineHeight: 16.5,
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: adminColors.danger.bg,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  errorBannerText: {
    ...adminType.caption,
    color: adminColors.danger.text,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Fixed Bottom Action Bar (Screenshots 1 & 2)
  bottomBar: {
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 12,
    paddingBottom: 16,
    ...adminShadow.md,
  },
  primaryBtn: {
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  primaryBtnText: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryBtn: {
    height: 48,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brandDeep,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...adminType.body,
    color: adminColors.brandDeep,
    fontSize: 15,
    fontWeight: '800',
  },

  // Bottom Sheet Picker Modals
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  bottomSheetCard: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 32,
    ...adminShadow.lg,
  },
  bottomSheetTitle: {
    ...adminType.title,
    fontSize: 17,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 16,
  },
  optionsList: {
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: adminRadius.md,
    marginBottom: 4,
  },
  optionItemActive: {
    backgroundColor: adminColors.brandTint,
  },
  optionText: {
    ...adminType.body,
    fontSize: 13.5,
    color: adminColors.ink,
  },
  optionTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  checkMark: {
    fontSize: 16,
    color: adminColors.brandDeep,
    fontWeight: '800',
  },
  sheetCancelBtn: {
    height: 44,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelBtnText: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Review Confirmation Modal
  centerOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  confirmCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    ...adminShadow.lg,
  },
  confirmTitle: {
    ...adminType.rowTitle,
    fontSize: 17,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 4,
  },
  confirmSubtitle: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 12,
  },
  confirmReviewBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
    marginBottom: 16,
  },
  confirmBtnRow: {
    gap: 8,
  },
  confirmPrimaryBtn: {
    height: 46,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmPrimaryBtnText: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  confirmSecondaryBtn: {
    height: 44,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSecondaryBtnText: {
    ...adminType.body,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Success State View
  successContainer: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  successContentPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 36,
    paddingBottom: 40,
    alignItems: 'center',
  },
  successIconBadgeWrap: {
    marginBottom: adminSpacing.lg,
  },
  successTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  successSub: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 13.5,
    textAlign: 'center',
    marginBottom: 28,
  },
  successCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.lg,
    marginBottom: 24,
    ...adminShadow.sm,
  },
  successCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successColLeft: {
    flex: 1,
  },
  successColRight: {
    alignItems: 'flex-end',
  },
  successFieldLabel: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.muted,
    marginBottom: 4,
  },
  successFieldValue: {
    ...adminType.body,
    fontSize: 14.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  resolvedBadge: {
    backgroundColor: adminColors.success.bg,
    borderWidth: 1,
    borderColor: adminColors.success.border,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  resolvedBadgeText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  successCardDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 14,
    opacity: 0.6,
  },
  successCardOutcomeRow: {
    width: '100%',
  },
  successBackBtn: {
    width: '100%',
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  successBackBtnText: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontSize: 15,
    fontWeight: '800',
  },
});
