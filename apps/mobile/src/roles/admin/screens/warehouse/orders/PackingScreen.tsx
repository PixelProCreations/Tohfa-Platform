/**
 * Packing — pack an order's items, then confirm packing.
 *
 * The designed "Confirm Packing" screen used to be its own route (M5S08). It
 * is now the 'confirm' step of this screen, so the packing form and its
 * confirmation share one piece of state and the host can still deep-link to
 * the confirmation with `initialStep: 'confirm'`.
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - "Confirm Packing" (packing step) and "Yes, Confirm Packing" (confirm
 *     step) both lead to marking the order packed: `order.mark_packed`.
 *   - The onward "Mark Ready for Pickup" / "Prepare for Dispatch" actions on
 *     the packed confirmation have no code assigned yet and stay ungated.
 */
// Design id: M5S07 (Packing), absorbs M5S08 (Confirm Packing)
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import type { OrderScreenBaseProps, PackingStep, WarehouseNavigate } from './types';

export interface PackingScreenProps extends OrderScreenBaseProps {
  /** Which step to open on; the host passes `params.step` (old M5S08 links use 'confirm'). */
  initialStep?: PackingStep | undefined;
}

/** Mock order id used until orders are wired to the API. */
const SAMPLE_ORDER_ID = 'ORD-1024';

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

const PACKAGE_OPTIONS = ['Select', 'Crate / Corrugated Box', 'Plastic Bag', 'Paper Pouch', 'Insulated Box'];

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

function GreenCheckboxIcon() {
  return (
    <View style={styles.greenCheckbox}>
      <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
        <Path
          d="M20 6L9 17l-5-5"
          stroke={adminColors.onBrand}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

function EmptyCheckboxIcon() {
  return <View style={styles.emptyCheckbox} />;
}

function ChevronDownIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={adminColors.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoCircleIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.info.text} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={adminColors.info.text} strokeWidth="2" strokeLinecap="round" />
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

function CheckmarkIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={adminColors.onBrand}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function QuestionCircleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.warning.text} strokeWidth="2" />
      <Path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"
        stroke={adminColors.warning.text}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BigSuccessCheckIcon() {
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

function PersonCheckIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="8.5" cy="7" r="4" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path
        d="M17 11l2 2 4-4"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Shared pieces ───────────────────────────────────────────────────────────

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

interface ChecklistItem {
  id: string;
  name: string;
  checked: boolean;
}

/**
 * The packing form's state lives in the parent so that stepping back from the
 * confirmation does not wipe what the packer already ticked and typed.
 */
function usePackingForm() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', name: 'Tomato · 2 KG', checked: true },
    { id: '2', name: 'Carrot · 3 KG', checked: true },
    { id: '3', name: 'Beans · 1 KG', checked: false },
    { id: '4', name: 'Cabbage · 2 KG', checked: false },
  ]);
  const [packedQty, setPackedQty] = useState('');
  const [packageType, setPackageType] = useState('Select');
  const [showPackagePicker, setShowPackagePicker] = useState(false);
  const [packageCount, setPackageCount] = useState('2');
  const [notes, setNotes] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);

  const toggleCheck = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  };

  return {
    checklist,
    toggleCheck,
    packedQty,
    setPackedQty,
    packageType,
    setPackageType,
    showPackagePicker,
    setShowPackagePicker,
    packageCount,
    setPackageCount,
    notes,
    setNotes,
    hasPhoto,
    setHasPhoto,
  };
}

type PackingForm = ReturnType<typeof usePackingForm>;

// ─── Step: packing (M5S07) ───────────────────────────────────────────────────

interface PackingStepViewProps {
  orderId: string;
  form: PackingForm;
  canMarkPacked: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

function PackingStepView({ orderId, form, canMarkPacked, onBack, onConfirm }: PackingStepViewProps) {
  const { checklist } = form;
  const checkedCount = checklist.filter((c) => c.checked).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header title="Packing" onBack={onBack} />

        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>
            {orderId} · {checkedCount} / {checklist.length} Items
          </Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Packing Checklist</Text>
          <View style={styles.checklistCard}>
            {checklist.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.checklistItem, index < checklist.length - 1 && styles.checklistItemBorder]}
                activeOpacity={0.7}
                onPress={() => form.toggleCheck(item.id)}
              >
                {item.checked ? <GreenCheckboxIcon /> : <EmptyCheckboxIcon />}
                <Text style={styles.checklistText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Item Detail</Text>
          <View style={styles.itemDetailCard}>
            <View style={styles.twoColRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Tomato</Text>
                <Text style={styles.detailValue}>Grade 1</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>Cold Storage · Rack 02</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, styles.twoColRowSpaced]}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Required</Text>
                <Text style={styles.detailValue}>2 KG</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Packed</Text>
                <Text style={styles.detailValue}>2 KG</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Packed Quantity</Text>
          <View style={styles.packedQtyInputContainer}>
            <TextInput
              style={styles.packedQtyTextInput}
              value={form.packedQty}
              onChangeText={form.setPackedQty}
              placeholder=""
              keyboardType="numeric"
            />
            <Text style={styles.unitText}>KG</Text>
          </View>

          <View style={styles.infoBox}>
            <InfoCircleIcon />
            <Text style={styles.infoText}>
              Packed quantity cannot exceed the ordered quantity without a supported exception workflow.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Package Information</Text>

          <TouchableOpacity style={styles.dropdownBox} activeOpacity={0.7} onPress={() => form.setShowPackagePicker(true)}>
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownLabel}>PACKAGING TYPE</Text>
              <Text style={styles.dropdownValue}>{form.packageType}</Text>
            </View>
            <ChevronDownIcon />
          </TouchableOpacity>

          <View style={styles.textInputBox}>
            <TextInput
              style={styles.singleLineInput}
              value={form.packageCount}
              onChangeText={form.setPackageCount}
              placeholder="Number of packages"
              placeholderTextColor={adminColors.placeholder}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.labelWithOptionalRow}>
            <Text style={styles.fieldLabel}>Packing Notes</Text>
            <Text style={styles.optionalText}>Optional</Text>
          </View>
          <View style={styles.notesInputBox}>
            <TextInput
              style={styles.notesTextInput}
              value={form.notes}
              onChangeText={form.setNotes}
              placeholder="Add packing observations or special handling..."
              placeholderTextColor={adminColors.placeholder}
              multiline
            />
          </View>

          <View style={styles.labelWithOptionalRow}>
            <Text style={styles.fieldLabel}>Package Photo</Text>
            <Text style={styles.optionalText}>Optional</Text>
          </View>
          <TouchableOpacity style={styles.photoBox} activeOpacity={0.7} onPress={() => form.setHasPhoto(!form.hasPhoto)}>
            <CameraPhotoIcon />
            <Text style={styles.photoText}>{form.hasPhoto ? '1 Photo' : 'Add Photo'}</Text>
          </TouchableOpacity>

          <View style={styles.scrollSpacer} />
        </ScrollView>

        {canMarkPacked ? (
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={onConfirm}>
              <CheckmarkIcon />
              <Text style={styles.primaryBtnText}>Confirm Packing</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Modal
          visible={form.showPackagePicker}
          transparent
          animationType="fade"
          onRequestClose={() => form.setShowPackagePicker(false)}
        >
          {/* Was a translucent overlay; no translucent token, so the scrim is dropped and the card floats on adminShadow.lg. */}
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => form.setShowPackagePicker(false)}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Packaging Type</Text>
              {PACKAGE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.modalOption, form.packageType === opt && styles.modalOptionSelected]}
                  onPress={() => {
                    form.setPackageType(opt);
                    form.setShowPackagePicker(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, form.packageType === opt && styles.modalOptionTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// ─── Step: confirm (folded M5S08) ────────────────────────────────────────────

interface ConfirmStepViewProps {
  orderId: string;
  canMarkPacked: boolean;
  onBack: () => void;
  onNavigate?: WarehouseNavigate | undefined;
}

function ConfirmStepView({ orderId, canMarkPacked, onBack, onNavigate }: ConfirmStepViewProps) {
  // M5S08 showed its "Order Packed" result in place after confirming; that
  // stays a sub-state of this step rather than becoming a third step.
  const [isPacked, setIsPacked] = useState(false);

  if (isPacked) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Header title="Order Packed" onBack={() => setIsPacked(false)} />

          <View style={styles.contentPacked}>
            <View style={styles.heroContainer}>
              <View style={styles.successCircleBadge}>
                <BigSuccessCheckIcon />
              </View>
              <Text style={styles.heroTitle}>Order Packed</Text>
            </View>

            <View style={styles.packedSummaryCard}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Order</Text>
                <Text style={styles.detailValue}>{orderId}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Packed at</Text>
                <Text style={styles.detailValue}>11:15 AM</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomBarPacked}>
            <TouchableOpacity
              style={[styles.primaryBtn, styles.stackedBtnGap]}
              activeOpacity={0.8}
              onPress={() => onNavigate?.('M5S09', { orderId })}
            >
              <PersonCheckIcon />
              <Text style={styles.primaryBtnText}>Mark Ready for Pickup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate?.('M5S13', { orderId })}
            >
              <Text style={styles.outlineBtnText}>Prepare for Dispatch (Delivery)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header title="Confirm Packing" onBack={onBack} />

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.confirmPromptBox}>
            <QuestionCircleIcon />
            <Text style={styles.confirmPromptText}>Confirm Packing?</Text>
          </View>

          <View style={styles.orderDetailsCard}>
            <View style={styles.twoColRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Order</Text>
                <Text style={styles.detailValue}>{orderId}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Items</Text>
                <Text style={styles.detailValue}>4 / 4</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, styles.twoColRowSpaced]}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Total Quantity</Text>
                <Text style={styles.detailValue}>8 KG</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Customer</Text>
                <Text style={styles.detailValue}>Arun Kumar</Text>
              </View>
            </View>
          </View>

          <Text style={styles.checklistSectionTitle}>Checklist</Text>
          {['All items checked', 'Quantities verified', 'Packing completed'].map((label) => (
            <View key={label} style={styles.checklistRowCard}>
              <GreenCheckboxIcon />
              <Text style={styles.checklistText}>{label}</Text>
            </View>
          ))}

          <View style={styles.scrollSpacer} />
        </ScrollView>

        {canMarkPacked ? (
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={() => setIsPacked(true)}>
              <CheckmarkIcon />
              <Text style={styles.primaryBtnText}>Yes, Confirm Packing</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export function PackingScreen({
  can,
  onBack,
  onNavigate,
  orderId = SAMPLE_ORDER_ID,
  initialStep = 'packing',
}: PackingScreenProps) {
  const [step, setStep] = useState<PackingStep>(initialStep);
  const form = usePackingForm();
  const canMarkPacked = can('order.mark_packed');

  if (step === 'confirm') {
    return (
      <ConfirmStepView
        orderId={orderId}
        canMarkPacked={canMarkPacked}
        onBack={() => setStep('packing')}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <PackingStepView
      orderId={orderId}
      form={form}
      canMarkPacked={canMarkPacked}
      onBack={onBack}
      onConfirm={() => setStep('confirm')}
    />
  );
}

// Fixed control sizes (not spacing): checkbox, photo tile, success badge, notes box.
const CHECKBOX_SIZE = 22;
const PHOTO_TILE = 68;
const SUCCESS_BADGE = 68;
const NOTES_HEIGHT = 76;

const card = {
  backgroundColor: adminColors.card,
  borderRadius: adminRadius.lg,
  borderWidth: 1,
  borderColor: adminColors.border,
  ...adminShadow.sm,
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: adminColors.brand },
  container: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: 14,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  backButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  subtitleRow: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingBottom: 14,
  },
  // Was a translucent overlay; no translucent token, so solid onBrand text.
  subtitleText: { ...adminType.rowTitle, color: adminColors.onBrand },
  content: { flex: 1, paddingHorizontal: adminSpacing.lg },
  contentContainer: { paddingTop: adminSpacing.md, paddingBottom: adminSpacing.input },
  scrollSpacer: { height: 28 },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },
  checklistCard: { ...card, overflow: 'hidden' },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 13,
  },
  checklistItemBorder: { borderBottomWidth: 1, borderBottomColor: adminColors.border },
  greenCheckbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderRadius: 5,
    backgroundColor: adminColors.success.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  emptyCheckbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    marginRight: adminSpacing.md,
  },
  checklistText: { ...adminType.body, fontWeight: '700', color: adminColors.ink },
  itemDetailCard: { ...card, padding: adminSpacing.lg },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between' },
  twoColRowSpaced: { marginTop: 14 },
  detailCol: { flex: 1 },
  detailLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: 3 },
  detailValue: { ...adminType.sectionHead, color: adminColors.ink },
  packedQtyInputContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    height: ADMIN_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
  },
  packedQtyTextInput: { ...adminType.sectionHead, flex: 1, color: adminColors.ink, height: '100%' },
  unitText: { ...adminType.body, fontWeight: '700', color: adminColors.muted },
  infoBox: {
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    paddingHorizontal: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  infoText: { ...adminType.rowMeta, flex: 1, fontWeight: '600', color: adminColors.info.text },
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
  },
  dropdownContent: { flex: 1 },
  dropdownLabel: { ...adminType.caption, color: adminColors.muted, letterSpacing: 0.5, marginBottom: 2 },
  dropdownValue: { ...adminType.body, fontWeight: '600', color: adminColors.ink },
  fieldLabel: { ...adminType.body, fontWeight: '700', color: adminColors.ink },
  labelWithOptionalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },
  optionalText: { ...adminType.rowMeta, color: adminColors.muted },
  textInputBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: ADMIN_BUTTON_HEIGHT,
    paddingHorizontal: adminSpacing.lg,
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
  },
  singleLineInput: { ...adminType.sectionHead, color: adminColors.ink, height: '100%' },
  notesInputBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    height: NOTES_HEIGHT,
  },
  notesTextInput: { ...adminType.body, color: adminColors.ink, textAlignVertical: 'top', height: '100%' },
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
  },
  photoText: { ...adminType.caption, color: adminColors.muted, marginTop: adminSpacing.xs },
  bottomBar: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  primaryBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    height: ADMIN_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    ...adminShadow.sm,
  },
  primaryBtnText: { ...adminType.sectionHead, color: adminColors.onBrand },
  stackedBtnGap: { marginBottom: 10 },
  outlineBtn: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    height: ADMIN_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: { ...adminType.sectionHead, color: adminColors.brand },
  modalOverlay: { flex: 1, justifyContent: 'center', padding: adminSpacing.input },
  modalCard: { backgroundColor: adminColors.card, borderRadius: adminRadius.lg, padding: 18, ...adminShadow.lg },
  modalTitle: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.md },
  modalOption: { paddingVertical: adminSpacing.md, paddingHorizontal: 10, borderRadius: adminRadius.xs },
  modalOptionSelected: { backgroundColor: adminColors.brandTint },
  modalOptionText: { ...adminType.body, color: adminColors.ink },
  modalOptionTextSelected: { fontWeight: '700', color: adminColors.brand },

  // Confirm step
  confirmPromptBox: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  confirmPromptText: { ...adminType.sectionHead, color: adminColors.warning.text },
  orderDetailsCard: { ...card, padding: adminSpacing.lg, marginBottom: 14 },
  checklistSectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 6,
    marginBottom: 10,
  },
  checklistRowCard: {
    ...card,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  // Confirm step, packed result
  contentPacked: { flex: 1, paddingTop: 36, paddingHorizontal: adminSpacing.lg },
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
  packedSummaryCard: {
    ...card,
    paddingHorizontal: adminSpacing.input,
    paddingVertical: adminSpacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bottomBarPacked: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 14,
    paddingBottom: adminSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
});
