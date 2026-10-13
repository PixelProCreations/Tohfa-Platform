/**
 * Order Issue — report a problem with a customer order, then confirm it.
 *
 * Two steps in one screen: the issue form, and the "Issue Submitted"
 * confirmation that used to be its own route (M5S16B). Submitting the form is
 * a local step change, so the confirmation can never be reached without an
 * issue having been raised from this screen (or a deep link with
 * `initialStep: 'submitted'`).
 *
 * Gates: none. docs/rbac.json has no permission code for raising an order
 * issue from the warehouse app, so the form stays ungated exactly as before
 * (spec gap, reported to the orchestrator for SPEC_GAPS.md).
 */
// Design id: M5S16 (M5S16_OrderIssue), absorbs M5S16B (M5S16B_IssueSubmitted)
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Modal } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import type { OrderIssueStep, OrderScreenBaseProps } from './types';

export interface OrderIssueScreenProps extends OrderScreenBaseProps {
  /** Which step to open on; the host passes `params.step` here (M5S16B deep links -> 'submitted'). */
  initialStep?: OrderIssueStep | undefined;
  /** Issue id shown on the submitted step. Falls back to the mock id the form generates. */
  issueId?: string | undefined;
  /** "View Issue" on the submitted step. Without it the screen navigates to 'M4S09'. */
  onViewIssue?: (() => void) | undefined;
}

// Mock ids, as hard-coded by the old M5S16 / M5S16B screens until issues are wired to the API.
const SAMPLE_ORDER_ID = 'ORD-1024';
const SAMPLE_NEW_ISSUE_ID = 'ISS-0028';

const ISSUE_TYPES = ['Quality', 'Quantity', 'Missing', 'Wrong', 'Damaged', 'Late'];

const ORDER_ITEMS = ['Tomato - Grade 1 (2 KG)', 'Carrot - Grade 1 (3 KG)', 'Potato - Grade 1 (5 KG)', 'Whole Order'];

const ITEM_PLACEHOLDER = 'Select item';

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={adminColors.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CameraPhotoIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={adminColors.muted}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={adminColors.muted} strokeWidth="1.8" />
    </Svg>
  );
}

function SendPlaneIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RadioSelectedIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.brand} strokeWidth="2.2" />
      <Circle cx="12" cy="12" r="4.5" fill={adminColors.brand} />
    </Svg>
  );
}

function RadioUnselectedIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.border} strokeWidth="2" />
    </Svg>
  );
}

function InfoCircleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.danger.text} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={adminColors.danger.text} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SuccessCheckIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.success.text} strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5L16 9.5"
        stroke={adminColors.success.text}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EyeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={adminColors.onBrand} strokeWidth="2" />
    </Svg>
  );
}

// ─── Shared header ───────────────────────────────────────────────────────────

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
        <BackArrowIcon />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

// ─── Step: form (M5S16) ──────────────────────────────────────────────────────

interface IssueFormStepProps {
  orderId: string;
  onBack: () => void;
  onSubmit: () => void;
}

function IssueFormStep({ orderId, onBack, onSubmit }: IssueFormStepProps) {
  const [issueType, setIssueType] = useState('Quality');
  const [selectedItem, setSelectedItem] = useState(ITEM_PLACEHOLDER);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [affectedQty, setAffectedQty] = useState('');
  const [description, setDescription] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);

  return (
    <View style={styles.container}>
      <Header title="Order Issue" onBack={onBack} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.orderRefLabel}>{orderId}</Text>

        <View style={styles.sectionHeaderRowTop}>
          <Text style={styles.sectionHeading}>Issue Type</Text>
          <Text style={styles.helperLabel}>Required</Text>
        </View>

        <View style={styles.categoryCard}>
          {ISSUE_TYPES.map((type, index) => {
            const isSelected = issueType === type;
            const isLast = index === ISSUE_TYPES.length - 1;
            return (
              <React.Fragment key={type}>
                <TouchableOpacity style={styles.radioRow} activeOpacity={0.75} onPress={() => setIssueType(type)}>
                  {isSelected ? <RadioSelectedIcon /> : <RadioUnselectedIcon />}
                  <Text style={styles.radioText}>{type}</Text>
                </TouchableOpacity>
                {!isLast && <View style={styles.cardDivider} />}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={styles.sectionHeading}>Affected Item</Text>
        <TouchableOpacity style={styles.dropdownBox} activeOpacity={0.75} onPress={() => setShowItemPicker(true)}>
          <View style={styles.dropdownTextWrap}>
            <Text style={styles.dropdownCaption}>AFFECTED ITEM</Text>
            <Text style={[styles.dropdownValue, selectedItem === ITEM_PLACEHOLDER && styles.dropdownPlaceholder]}>
              {selectedItem}
            </Text>
          </View>
          <ChevronDownIcon />
        </TouchableOpacity>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Affected Quantity</Text>
          <Text style={styles.helperLabel}>If supported</Text>
        </View>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 2 KG"
            placeholderTextColor={adminColors.placeholder}
            value={affectedQty}
            onChangeText={setAffectedQty}
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Description</Text>
          <Text style={styles.helperLabel}>Required</Text>
        </View>
        <View style={styles.textareaBox}>
          <TextInput
            style={styles.textareaInput}
            placeholder="Describe the issue..."
            placeholderTextColor={adminColors.placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <Text style={styles.sectionHeading}>Photos</Text>
        <TouchableOpacity
          style={[styles.photoBox, hasPhoto && styles.photoBoxActive]}
          activeOpacity={0.75}
          onPress={() => setHasPhoto(!hasPhoto)}
        >
          <CameraPhotoIcon />
          <Text style={styles.photoBoxText}>{hasPhoto ? '1 Photo' : 'Add Photo'}</Text>
        </TouchableOpacity>

        <View style={styles.noticeBox}>
          <View style={styles.noticeIconWrap}>
            <InfoCircleIcon />
          </View>
          <Text style={styles.noticeText}>
            Further RMA/refund processing happens in Module 10 — Returns & Issues. No refund calculation is performed here.
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={onSubmit}>
          <SendPlaneIcon />
          <Text style={styles.primaryBtnText}>Submit Issue</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showItemPicker} transparent animationType="fade" onRequestClose={() => setShowItemPicker(false)}>
        {/* Was a translucent overlay; no translucent token, so the scrim is transparent and the card carries adminShadow.lg. */}
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowItemPicker(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Affected Item</Text>
            {ORDER_ITEMS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.modalOption, selectedItem === item && styles.modalOptionSelected]}
                onPress={() => {
                  setSelectedItem(item);
                  setShowItemPicker(false);
                }}
              >
                <Text style={[styles.modalOptionText, selectedItem === item && styles.modalOptionTextSelected]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Step: submitted (folded M5S16B) ─────────────────────────────────────────

interface IssueSubmittedStepProps {
  issueId: string;
  onBack: () => void;
  onViewIssue: () => void;
}

function IssueSubmittedStep({ issueId, onBack, onViewIssue }: IssueSubmittedStepProps) {
  return (
    <View style={styles.container}>
      <Header title="Issue Submitted" onBack={onBack} />

      <View style={styles.submittedContent}>
        <View style={styles.heroContainer}>
          <View style={styles.successCircleBadge}>
            <SuccessCheckIcon />
          </View>
          <Text style={styles.heroTitle}>Issue Submitted</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Issue ID</Text>
              <Text style={styles.fieldValue}>{issueId}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValue}>Open</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={onViewIssue}>
          <EyeIcon />
          <Text style={styles.primaryBtnText}>View Issue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export function OrderIssueScreen({
  orderId = SAMPLE_ORDER_ID,
  initialStep = 'form',
  issueId,
  onViewIssue,
  onBack,
  onNavigate,
}: OrderIssueScreenProps) {
  const [step, setStep] = useState<OrderIssueStep>(initialStep);
  // The id the old M5S16 handed to M5S16B on submit; a caller-supplied id (deep link) wins.
  const [submittedIssueId, setSubmittedIssueId] = useState(issueId ?? SAMPLE_NEW_ISSUE_ID);

  const handleSubmit = () => {
    setSubmittedIssueId(issueId ?? SAMPLE_NEW_ISSUE_ID);
    setStep('submitted');
  };

  const handleViewIssue = () => {
    if (onViewIssue) {
      onViewIssue();
    } else {
      // M4S09 = operational issues; M5S16B sent the issue id, orderId is added for context.
      onNavigate?.('M4S09', { orderId, issueId: submittedIssueId });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {step === 'form' ? (
        <IssueFormStep orderId={orderId} onBack={onBack} onSubmit={handleSubmit} />
      ) : (
        <IssueSubmittedStep
          issueId={submittedIssueId}
          // Back from the confirmation returns to the form, not out of the screen.
          onBack={() => setStep('form')}
          onViewIssue={handleViewIssue}
        />
      )}
    </SafeAreaView>
  );
}

// Fixed component sizes (no size token exists for these): photo tile, inputs, success badge.
const PHOTO_TILE = 72;
const INPUT_HEIGHT = 46;
const TEXTAREA_HEIGHT = 85;
const SUCCESS_BADGE = 68;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: adminColors.brand },
  container: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: 14,
    gap: adminSpacing.md,
  },
  backButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  content: { flex: 1 },
  contentContainer: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxxl,
  },
  orderRefLabel: { ...adminType.rowTitle, color: adminColors.muted, marginBottom: adminSpacing.sm, paddingLeft: 2 },
  sectionHeaderRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  categoryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.md,
  },
  radioText: { ...adminType.sectionHead, color: adminColors.ink },
  cardDivider: { height: 1, backgroundColor: adminColors.border, marginHorizontal: adminSpacing.lg },
  sectionHeading: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.sm },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: adminSpacing.sm,
  },
  helperLabel: { ...adminType.rowMeta, color: adminColors.muted },
  dropdownBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  dropdownTextWrap: { flex: 1 },
  dropdownCaption: { ...adminType.caption, color: adminColors.muted, letterSpacing: 0.5, marginBottom: 2 },
  dropdownValue: { ...adminType.sectionHead, color: adminColors.ink },
  dropdownPlaceholder: { color: adminColors.placeholder },
  inputBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: INPUT_HEIGHT,
    paddingHorizontal: 14,
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  textInput: { ...adminType.body, color: adminColors.ink, paddingVertical: 0 },
  textareaBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: TEXTAREA_HEIGHT,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...adminShadow.sm,
  },
  textareaInput: { ...adminType.body, color: adminColors.ink, textAlignVertical: 'top', height: '100%' },
  photoBox: {
    width: PHOTO_TILE,
    height: PHOTO_TILE,
    borderRadius: adminRadius.sm,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: adminSpacing.lg,
  },
  photoBoxActive: { borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  photoBoxText: { ...adminType.caption, color: adminColors.muted, marginTop: adminSpacing.xs },
  noticeBox: {
    backgroundColor: adminColors.danger.bg,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
  },
  noticeIconWrap: { marginTop: 1 },
  noticeText: { ...adminType.rowTitle, flex: 1, color: adminColors.danger.text },
  primaryBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    ...adminShadow.md,
  },
  primaryBtnText: { ...adminType.sectionHead, color: adminColors.onBrand },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  modalCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 18,
    ...adminShadow.lg,
  },
  modalTitle: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.md },
  modalOption: { paddingVertical: adminSpacing.md, paddingHorizontal: 10, borderRadius: adminRadius.xs },
  modalOptionSelected: { backgroundColor: adminColors.brandTint },
  modalOptionText: { ...adminType.body, color: adminColors.ink },
  modalOptionTextSelected: { fontWeight: '700', color: adminColors.brand },
  // Submitted step
  submittedContent: { flex: 1, paddingTop: 36, paddingHorizontal: adminSpacing.lg },
  heroContainer: { alignItems: 'center', marginBottom: 28 },
  successCircleBadge: {
    width: SUCCESS_BADGE,
    height: SUCCESS_BADGE,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
  },
  heroTitle: { ...adminType.title, color: adminColors.ink },
  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 20,
    paddingVertical: 18,
    ...adminShadow.sm,
  },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1 },
  fieldLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  fieldValue: { ...adminType.sectionHead, color: adminColors.ink },
  bottomBar: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
});
