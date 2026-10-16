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

function CheckmarkCircleSuccessIcon({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Circle cx="24" cy="24" r="23" fill={adminColors.success.bg} />
      <Circle cx="24" cy="24" r="16" stroke={adminColors.success.text} strokeWidth="2" />
      <Path
        d="M17 24l5 5 10-10"
        stroke={adminColors.success.text}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FilePlusIcon({ size = 20, color = adminColors.ink }: { size?: number; color?: string }) {
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
      <Line x1="12" y1="12" x2="12" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="9" y1="15" x2="15" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
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

// ─── Options Constants ───────────────────────────────────────────────────────

export {
  FOLLOWUP_REQUIRED_OPTIONS,
  RESOLUTION_OUTCOME_OPTIONS,
  TOHFA_RESPONSE_OPTIONS,
};

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

  const [tohfaResponse, setTohfaResponse] = useState<string>('No TOHFA response recorded');
  const [showTohfaResponsePicker, setShowTohfaResponsePicker] = useState(false);

  const [followupRequired, setFollowupRequired] = useState<string>('Select');
  const [showFollowupPicker, setShowFollowupPicker] = useState(false);

  const [uploadedAttachment, setUploadedAttachment] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Success State (Image 3)
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
    setIsSavedSuccessfully(true);
  };

  const handleFinishAndReturn = () => {
    const updated: DisputeItem = {
      ...dispute,
      status: 'Resolved',
      resolutionNote: resolutionSummary.trim() || outcome,
    };
    if (onResolvedSuccess) {
      onResolvedSuccess(updated);
    } else {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
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
              {dispute.id} · {dispute.status}
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Success View (Image 3) ─── */}
      {isSavedSuccessfully ? (
        <View style={styles.successContainer}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.successContentPad}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.successIconBadgeWrap}>
              <CheckmarkCircleSuccessIcon size={56} />
            </View>

            <Text style={styles.successTitle}>Resolution Saved Successfully</Text>
            <Text style={styles.successSub}>Confirmed by the server</Text>

            {/* Summary Confirmation Card */}
            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Dispute</Text>
                  <Text style={styles.fieldValueBold}>{dispute.id}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Updated Status</Text>
                  <Text style={styles.fieldValueBold}>Resolved</Text>
                </View>
              </View>

              <View style={styles.fieldGroupLast}>
                <Text style={styles.fieldLabel}>Outcome</Text>
                <Text style={styles.fieldValueRegular}>{outcome}</Text>
              </View>
            </View>

            {/* Resolved Not Closed Notice Card */}
            <View style={styles.noticeBoxWarm}>
              <InfoCircleIcon size={18} color={adminColors.warning.text} />
              <Text style={styles.noticeTextWarm}>
                The dispute is Resolved, not Closed. Closing is a separate step that needs a confirmed rule.
              </Text>
            </View>
          </ScrollView>

          {/* Fixed Bottom Button in Success State */}
          <View style={styles.fixedBottomContainer}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleFinishAndReturn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Back to Disputes"
            >
              <Text style={styles.primaryBtnText}>Back to Disputes</Text>
            </TouchableOpacity>
            <Text style={styles.screenCaption}>M10-S04 · Dispute Resolution</Text>
          </View>
        </View>
      ) : (
        /* ─── Form View (Images 1, 2, & 4) ─── */
        <View style={{ flex: 1 }}>
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Dispute summary */}
            <Text style={styles.sectionHeader}>Dispute summary</Text>
            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Dispute</Text>
                  <Text style={styles.fieldValueBold}>{dispute.id}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <Text style={styles.fieldValueBold}>{dispute.status}</Text>
                </View>
              </View>

              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Farmer</Text>
                  <Text style={styles.fieldValueBold}>{dispute.raisedBy}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Category</Text>
                  <Text style={styles.fieldValueBold}>{dispute.category}</Text>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Subject</Text>
                <Text style={styles.fieldValueBold}>{dispute.title}</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Original complaint</Text>
                <Text style={styles.fieldValueRegular}>{dispute.description}</Text>
              </View>

              <View style={styles.twoColRowLast}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>TOHFA reference</Text>
                  <Text style={styles.fieldValueBold}>
                    {dispute.linkedRecord || 'Purchase Order PO-2026-00124'}
                  </Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Evidence</Text>
                  <Text style={styles.fieldValueBold}>
                    {dispute.evidence ? `${dispute.evidence.length} attached` : '2 attached'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. Previous mediation notes */}
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

            {/* 3. Outcome Form */}
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
                <ChevronDownIcon size={18} />
              </TouchableOpacity>

              <Text style={styles.proposedNotice}>Proposed — Requires TOHFA Approval</Text>

              {/* Field: Resolution Summary */}
              <Text style={styles.formFieldLabel}>
                Resolution Summary <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View style={styles.textareaWrapper}>
                <TextInput
                  style={styles.textarea}
                  placeholder="Summarize agreed resolution terms"
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
                  placeholder="Record immediate actions or mediation steps"
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
              <TouchableOpacity
                style={[styles.dropdownBtn, styles.disabledDropdown]}
                onPress={() => setShowTohfaResponsePicker(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Select TOHFA response"
              >
                <Text style={styles.disabledDropdownText}>{tohfaResponse}</Text>
                <ChevronDownIcon size={18} color={adminColors.muted} />
              </TouchableOpacity>

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
                <ChevronDownIcon size={18} />
              </TouchableOpacity>

              {/* Field: Supporting Attachment */}
              <Text style={styles.formFieldLabel}>Supporting Attachment (optional)</Text>
              <TouchableOpacity
                style={styles.uploadDashedCard}
                onPress={() => {
                  if (uploadedAttachment) {
                    setUploadedAttachment(null);
                  } else {
                    setUploadedAttachment('resolution_agreement_signed.pdf');
                  }
                }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Upload supporting attachment"
              >
                <FilePlusIcon size={20} color={adminColors.brand} />
                <Text style={styles.uploadText}>
                  {uploadedAttachment ? uploadedAttachment : 'Upload file'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Authority Disclaimer Card */}
            <View style={styles.noticeBoxWarm}>
              <InfoCircleIcon size={18} color={adminColors.warning.text} />
              <Text style={styles.noticeTextWarm}>
                Refunds, payouts, amount changes and other financial adjustments are outside the Farmer Admin&apos;s authority. Non-binding mediation only.
              </Text>
            </View>

            {validationError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{validationError}</Text>
              </View>
            )}

            <View style={{ height: 130 }} />
          </ScrollView>

          {/* Fixed Bottom Action Buttons: Review & Cancel */}
          <View style={styles.fixedBottomContainer}>
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
            <Text style={styles.screenCaption}>M10-S04 · Dispute Resolution</Text>
          </View>
        </View>
      )}

      {/* ─── Resolution Outcome Picker Modal (Image 4) ─── */}
      <Modal
        visible={showOutcomePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOutcomePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowOutcomePicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.pickerModalCard}>
                <Text style={styles.pickerTitle}>Resolution Outcome</Text>
                <View style={styles.pickerOptionsList}>
                  {RESOLUTION_OUTCOME_OPTIONS.map((item, idx) => {
                    const isSelected = outcome === item;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.pickerOptionRow,
                          isSelected && styles.pickerOptionRowActive,
                        ]}
                        onPress={() => {
                          setOutcome(item);
                          setShowOutcomePicker(false);
                          if (validationError) setValidationError(null);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            isSelected && styles.pickerOptionTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── TOHFA Response Picker Modal ─── */}
      <Modal
        visible={showTohfaResponsePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTohfaResponsePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowTohfaResponsePicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.pickerModalCard}>
                <Text style={styles.pickerTitle}>TOHFA Response</Text>
                <View style={styles.pickerOptionsList}>
                  {TOHFA_RESPONSE_OPTIONS.map((item, idx) => {
                    const isSelected = tohfaResponse === item;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.pickerOptionRow,
                          isSelected && styles.pickerOptionRowActive,
                        ]}
                        onPress={() => {
                          setTohfaResponse(item);
                          setShowTohfaResponsePicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            isSelected && styles.pickerOptionTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Follow-up Picker Modal ─── */}
      <Modal
        visible={showFollowupPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFollowupPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFollowupPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.pickerModalCard}>
                <Text style={styles.pickerTitle}>Follow-up Required</Text>
                <View style={styles.pickerOptionsList}>
                  {FOLLOWUP_REQUIRED_OPTIONS.map((item, idx) => {
                    const isSelected = followupRequired === item;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.pickerOptionRow,
                          isSelected && styles.pickerOptionRowActive,
                        ]}
                        onPress={() => {
                          setFollowupRequired(item);
                          setShowFollowupPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            isSelected && styles.pickerOptionTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
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
    width: 38,
    height: 38,
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
    ...adminType.rowMeta,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  sectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  twoColRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  col: {
    flex: 1,
    paddingRight: adminSpacing.sm,
  },
  fieldGroup: {
    marginBottom: adminSpacing.md,
  },
  fieldGroupLast: {
    marginBottom: 0,
    marginTop: adminSpacing.sm,
  },
  fieldLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 11.5,
    marginBottom: 2,
  },
  fieldValueBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14.5,
    fontWeight: '800',
  },
  fieldValueRegular: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    lineHeight: 18,
  },
  noteAuthorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: adminSpacing.sm,
    paddingTop: adminSpacing.xs,
  },
  noteAuthorText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 11.5,
    fontWeight: '600',
  },
  noteDateText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 11.5,
  },

  // Form Fields
  formFieldLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '700',
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
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
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 12,
    marginBottom: 4,
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
    backgroundColor: adminColors.canvas,
    borderColor: adminColors.border,
  },
  disabledDropdownText: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 13,
  },
  proposedNotice: {
    ...adminType.caption,
    color: adminColors.brand,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: adminSpacing.sm,
  },
  textareaWrapper: {
    position: 'relative',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    marginBottom: adminSpacing.sm,
  },
  textarea: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    minHeight: 80,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    textAlignVertical: 'top',
  },
  resizeIndicator: {
    position: 'absolute',
    right: 4,
    bottom: 4,
  },
  uploadDashedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    paddingVertical: adminSpacing.md,
    marginTop: 2,
    marginBottom: adminSpacing.sm,
  },
  uploadText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '700',
  },

  // Notices
  noticeBoxWarm: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  noticeTextWarm: {
    flex: 1,
    ...adminType.rowMeta,
    color: adminColors.ink,
    fontSize: 12,
    lineHeight: 17,
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
  },

  // Fixed Bottom Buttons
  fixedBottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    ...adminShadow.md,
  },
  primaryBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  primaryBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  secondaryBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
    fontSize: 14,
    fontWeight: '700',
  },
  screenCaption: {
    ...adminType.caption,
    color: adminColors.muted,
    textAlign: 'center',
    fontSize: 10.5,
    marginTop: 4,
  },

  // Success State View
  successContainer: {
    flex: 1,
  },
  successContentPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.xl,
    paddingBottom: 120,
    alignItems: 'center',
  },
  successIconBadgeWrap: {
    marginBottom: adminSpacing.md,
  },
  successTitle: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
  successSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: adminSpacing.xl,
  },

  // Options Picker Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  pickerModalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    ...adminShadow.lg,
  },
  pickerTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: adminSpacing.md,
  },
  pickerOptionsList: {
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  pickerOptionRow: {
    paddingVertical: 12,
    paddingHorizontal: adminSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  pickerOptionRowActive: {
    backgroundColor: adminColors.brandTint,
  },
  pickerOptionText: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13.5,
  },
  pickerOptionTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
});
