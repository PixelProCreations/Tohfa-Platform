/**
 * Cancel Order — pick a reason, confirm, and see the order cancelled.
 *
 * Gates: docs/rbac.json has NO code for an admin cancelling a customer order,
 * so the cancel action is deliberately left ungated (a specification gap the
 * orchestrator records). There is no warehouse selector: the screen acts on
 * the order in focus, which already belongs to the viewer's warehouse scope.
 */
// Design id: M5S17 (M5S17_CancelOrder)
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Modal } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import {
  adminColors,
  adminType,
  adminRadius,
  adminSpacing,
  adminShadow,
  ADMIN_BUTTON_HEIGHT,
} from '../../../theme';
import type { OrderScreenBaseProps } from './types';

/** CancelOrderScreen steps: reason form, confirmation, cancelled result. */
export type CancelOrderStep = 'form' | 'confirm' | 'cancelled';

export interface CancelOrderScreenProps extends OrderScreenBaseProps {
  initialStep?: CancelOrderStep | undefined;
}

const REASON_PLACEHOLDER = 'Select cancellation reason';

const REASONS = [
  'Customer Requested Cancellation',
  'Item Out of Stock',
  'Delivery Unserviceable',
  'Duplicate Order',
  'Payment Failed',
  'Customer Unreachable',
  'Other Operational Reason',
];

// Mock data until the order API is wired.
const MOCK_CUSTOMER = 'Arun Kumar';
const MOCK_TOTAL = '₹850';

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

function CancelCircleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WarningTriangleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={adminColors.warning.text}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={adminColors.warning.text} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleDangerIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.danger.text} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={adminColors.danger.text} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BigCrossCircleIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.danger.text} strokeWidth="2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={adminColors.danger.text} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

function DocumentIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

export function CancelOrderScreen({
  onBack,
  onNavigate,
  orderId = 'ORD-1024',
  initialStep = 'form',
}: CancelOrderScreenProps) {
  const [step, setStep] = useState<CancelOrderStep>(initialStep);
  const [reason, setReason] = useState(REASON_PLACEHOLDER);
  const [showReasonPicker, setShowReasonPicker] = useState(false);

  // ─── STEP 3: Order Cancelled ─────────────────────────────────────────────
  if (step === 'cancelled') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Header title="Order Cancelled" onBack={() => onNavigate?.('M5S01')} />

          <View style={styles.contentPacked}>
            <View style={styles.heroContainer}>
              <View style={styles.cancelCircleBadge}>
                <BigCrossCircleIcon />
              </View>
              <Text style={styles.heroTitle}>Order Cancelled</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Order</Text>
                  <Text style={styles.fieldValue}>{orderId}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <Text style={styles.fieldValue}>Cancelled</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={() => onNavigate?.('M5S01')}>
              <DocumentIcon />
              <Text style={styles.primaryBtnText}>Back to Orders</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STEP 2: Confirm Cancellation ─────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Header title="Confirm Cancellation" onBack={() => setStep('form')} />

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.confirmPromptBox}>
              <WarningTriangleIcon />
              <Text style={styles.confirmPromptText}>Cancel this order?</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Order</Text>
              <Text style={styles.fieldValueBold}>{orderId}</Text>
            </View>

            <View style={styles.dangerAlertBox}>
              <InfoCircleDangerIcon />
              <Text style={styles.dangerAlertText}>
                This action cannot be undone. No refund logic is created here unless the payment/refund service supports it.
              </Text>
            </View>

            <View style={styles.scrollTail} />
          </ScrollView>

          <View style={styles.bottomBarStacked}>
            <TouchableOpacity style={styles.confirmCancelBtn} activeOpacity={0.8} onPress={() => setStep('cancelled')}>
              <CheckmarkIcon />
              <Text style={styles.primaryBtnText}>Cancel Order</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.keepOrderBtn} activeOpacity={0.8} onPress={() => setStep('form')}>
              <Text style={styles.keepOrderBtnText}>Keep Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STEP 1: Cancel Order Form ───────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header title="Cancel Order" onBack={onBack} />

        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>{orderId}</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Customer</Text>
                <Text style={styles.fieldValue}>{MOCK_CUSTOMER}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Total</Text>
                <Text style={styles.fieldValue}>{MOCK_TOTAL}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Cancellation Reason</Text>
          <TouchableOpacity style={styles.dropdownBox} activeOpacity={0.7} onPress={() => setShowReasonPicker(true)}>
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownLabel}>REASON</Text>
              <Text style={styles.dropdownValue}>{reason}</Text>
            </View>
            <ChevronDownIcon />
          </TouchableOpacity>

          <View style={styles.scrollTail} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={() => setStep('confirm')}>
            <CancelCircleIcon />
            <Text style={styles.primaryBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showReasonPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowReasonPicker(false)}
        >
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowReasonPicker(false)}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Cancellation Reason</Text>
              {REASONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.modalOption, reason === r && styles.modalOptionSelected]}
                  onPress={() => {
                    setReason(r);
                    setShowReasonPicker(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, reason === r && styles.modalOptionTextSelected]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// Result badge diameter: an icon size, not spacing.
const BADGE_SIZE = 68;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: adminColors.brand },
  container: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 14,
    paddingBottom: adminSpacing.md,
    gap: adminSpacing.md,
  },
  backButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  subtitleRow: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: adminColors.brand,
  },
  // Was a translucent overlay; no translucent token, so solid onBrand.
  subtitleText: { ...adminType.rowTitle, fontWeight: '600', color: adminColors.onBrand },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: adminSpacing.lg, paddingTop: 14, paddingBottom: 20 },
  scrollTail: { height: adminSpacing.xl },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1 },
  fieldLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  fieldValue: { fontSize: 14, fontWeight: '700', color: adminColors.ink },
  fieldValueBold: { fontSize: 15, fontWeight: '800', color: adminColors.ink },
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
    marginTop: 2,
  },
  dropdownContent: { flex: 1 },
  dropdownLabel: { fontSize: 9.5, fontWeight: '700', color: adminColors.muted, letterSpacing: 0.5, marginBottom: 2 },
  dropdownValue: { fontSize: 13.5, fontWeight: '600', color: adminColors.ink },
  confirmPromptBox: {
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 14,
    paddingHorizontal: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: adminSpacing.lg,
  },
  confirmPromptText: { fontSize: 14.5, fontWeight: '700', color: adminColors.warning.text },
  dangerAlertBox: {
    backgroundColor: adminColors.danger.bg,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  dangerAlertText: { flex: 1, fontSize: 11.5, fontWeight: '600', color: adminColors.danger.text, lineHeight: 16 },
  bottomBar: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  bottomBarStacked: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
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
  confirmCancelBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    marginBottom: 10,
    ...adminShadow.md,
  },
  keepOrderBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepOrderBtnText: { ...adminType.sectionHead, color: adminColors.ink },
  contentPacked: { flex: 1, paddingTop: 36, paddingHorizontal: adminSpacing.lg },
  heroContainer: { alignItems: 'center', marginBottom: 28 },
  cancelCircleBadge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.danger.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
  },
  heroTitle: { ...adminType.title, color: adminColors.ink },
  // Was a translucent overlay; no translucent token, so a solid canvas scrim with the card raised by adminShadow.lg.
  modalOverlay: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: 18,
    ...adminShadow.lg,
  },
  modalTitle: { fontSize: 15, fontWeight: '700', color: adminColors.ink, marginBottom: adminSpacing.md },
  modalOption: { paddingVertical: adminSpacing.md, paddingHorizontal: 10, borderRadius: adminRadius.xs },
  modalOptionSelected: { backgroundColor: adminColors.brandTint },
  modalOptionText: { fontSize: 13.5, color: adminColors.ink },
  modalOptionTextSelected: { fontWeight: '700', color: adminColors.brand },
});
