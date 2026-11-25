/**
 * Cancel Order — pick a reason, confirm, and see the order cancelled.
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - Both "Cancel Order" buttons (the one that opens the confirm step and the
 *     one that performs the cancel) render only with `order.cancel`.
 *   There is no warehouse selector: the screen acts on the order in focus,
 *   which already belongs to the viewer's warehouse scope.
 *
 * Live data: the order number, customer and total are GET
 * /admin/orders/{orderId}. "Cancel Order" on the confirm step is POST
 * /admin/orders/{id}/cancel (BR-35, BR-151) with an Idempotency-Key, through
 * the LiveOrderAction the flow supplies (useOrdersData.ts, same as Packing).
 * The cancelled result is reached ONLY after the server answered 2xx; a
 * failure stays on the confirm step with the error shown. The result card
 * shows the order's real status as the server last sent it. The reason list is
 * the design's; the spec has no cancellation-reason enum, so the reason
 * the admin picked is sent as free text (1 to 500 characters).
 */
// Design id: M5S17 (M5S17_CancelOrder)
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Path, Circle } from 'react-native-svg';

import {
  adminColors,
  adminType,
  adminRadius,
  adminSpacing,
  adminShadow,
  ADMIN_BUTTON_HEIGHT,
} from '../../../theme';
import type { CancelOrderBody } from '../../../api/orders';
import { adminErrorKey } from '../../../api/errors';
import { t, type TranslationKey } from '../../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { orderStatusLabel } from './mappers';
import type { OrderDetailView, OrderScreenBaseProps, OrdersLiveStateProps } from './types';
import type { LiveOrderAction } from './useOrdersData';

/** CancelOrderScreen steps: reason form, confirmation, cancelled result. */
export type CancelOrderStep = 'form' | 'confirm' | 'cancelled';

export interface CancelOrderScreenProps extends OrderScreenBaseProps, OrdersLiveStateProps {
  initialStep?: CancelOrderStep | undefined;
  /** The order; undefined while loading or when the route names no order the API knows. */
  order?: OrderDetailView | undefined;
  /** POST .../cancel. */
  cancel?: LiveOrderAction<CancelOrderBody> | undefined;
}

const REASONS: readonly TranslationKey[] = [
  'orders.cancel.reason.customerRequested',
  'orders.cancel.reason.outOfStock',
  'orders.cancel.reason.unserviceable',
  'orders.cancel.reason.duplicate',
  'orders.cancel.reason.paymentFailed',
  'orders.cancel.reason.unreachable',
  'orders.cancel.reason.other',
];

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

/** A refused or failed write, worded for warehouse staff (adminErrorKey), never the server's detail. */
function WriteError({ error }: { error: unknown }) {
  if (error === null || error === undefined) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{t(adminErrorKey(error))}</Text>
    </View>
  );
}

export function CancelOrderScreen({
  can,
  onBack,
  onNavigate,
  order,
  cancel,
  initialStep = 'form',
  isLoading = false,
  error,
  onRetry,
}: CancelOrderScreenProps) {
  const [step, setStep] = useState<CancelOrderStep>(initialStep);
  const canCancel = can('order.cancel');
  // True only after POST .../cancel answered 2xx from this screen.
  const [cancelledHere, setCancelledHere] = useState(false);
  const [reason, setReason] = useState<TranslationKey | null>(null);
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const view = queryViewState({ isLoading, error, itemCount: order === undefined ? 0 : 1 });
  // The reason as the admin read it; null until one is picked.
  const reasonText = reason === null ? null : t(reason);

  if (view !== 'ready' || order === undefined || cancel === undefined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.container}>
          <Header title={t('orders.cancel.title')} onBack={onBack} />
          {view === 'loading' ? (
            <AdminLoadingState />
          ) : view === 'error' ? (
            <AdminErrorState error={error} onRetry={onRetry} />
          ) : (
            <AdminEmptyState title={t('orders.empty.notFound')} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ─── STEP 3: Order Cancelled ─────────────────────────────────────────────
  // Only once the server cancelled it: this screen got the 2xx (cancelledHere,
  // set in onDone below), or the order itself already reads CANCELLED. A deep
  // link with initialStep 'cancelled' for an order that is not cancelled falls
  // through to the form instead of claiming a cancellation nobody made.
  if (step === 'cancelled' && (cancelledHere || order.status === 'cancelled')) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.container}>
          <Header title={t('orders.cancel.cancelledTitle')} onBack={() => onNavigate?.('M5S01')} />

          <View style={styles.contentPacked}>
            <View style={styles.heroContainer}>
              <View style={styles.cancelCircleBadge}>
                <BigCrossCircleIcon />
              </View>
              <Text style={styles.heroTitle}>{t('orders.cancel.cancelledTitle')}</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>{t('orders.cancel.field.order')}</Text>
                  <Text style={styles.fieldValue}>{order.orderNumber}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>{t('orders.cancel.field.status')}</Text>
                  <Text style={styles.fieldValue}>
                    {/* The refetch of the order may lag the 2xx by a moment; the server just said CANCELLED. */}
                    {cancelledHere ? orderStatusLabel('cancelled') : order.statusLabel}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={() => onNavigate?.('M5S01')}>
              <DocumentIcon />
              <Text style={styles.primaryBtnText}>{t('orders.cancel.backToOrders')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STEP 2: Confirm Cancellation ─────────────────────────────────────────
  // No reason yet (a deep link straight to the confirm step): back to the form, which asks for one.
  if (step === 'confirm' && reasonText !== null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.container}>
          <Header title={t('orders.cancel.confirmTitle')} onBack={() => setStep('form')} />

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.confirmPromptBox}>
              <WarningTriangleIcon />
              <Text style={styles.confirmPromptText}>{t('orders.cancel.prompt')}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>{t('orders.cancel.field.order')}</Text>
              <Text style={styles.fieldValueBold}>{order.orderNumber}</Text>
            </View>

            <View style={styles.dangerAlertBox}>
              <InfoCircleDangerIcon />
              <Text style={styles.dangerAlertText}>{t('orders.cancel.irreversible')}</Text>
            </View>

            <View style={styles.scrollTail} />
          </ScrollView>

          <View style={styles.bottomBarStacked}>
            <WriteError error={cancel.error} />
            {canCancel && reasonText !== null ? (
              <TouchableOpacity
                testID="orders.cancel.submit"
                style={[styles.confirmCancelBtn, cancel.isPending && styles.primaryBtnPending]}
                activeOpacity={0.8}
                disabled={cancel.isPending}
                onPress={() => cancel.run({ reason: reasonText }, () => {
                  setCancelledHere(true);
                  setStep('cancelled');
                })}
              >
                <CheckmarkIcon />
                <Text style={styles.primaryBtnText}>{cancel.isPending ? t('orders.action.saving') : t('orders.cancel.confirm')}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.keepOrderBtn} activeOpacity={0.8} disabled={cancel.isPending} onPress={() => setStep('form')}>
              <Text style={styles.keepOrderBtnText}>{t('orders.cancel.keep')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STEP 1: Cancel Order Form ───────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.container}>
        <Header title={t('orders.cancel.title')} onBack={onBack} />

        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>{order.orderNumber}</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>{t('orders.cancel.summary')}</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>{t('orders.cancel.field.customer')}</Text>
                <Text style={styles.fieldValue}>{order.buyerName}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>{t('orders.cancel.field.total')}</Text>
                <Text style={styles.fieldValue}>{order.totals.totalLabel}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{t('orders.cancel.reasonSection')}</Text>
          <TouchableOpacity testID="orders.cancel.reasonPicker" style={styles.dropdownBox} activeOpacity={0.7} onPress={() => setShowReasonPicker(true)}>
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownLabel}>{t('orders.cancel.reasonCaption')}</Text>
              <Text style={styles.dropdownValue}>{reason === null ? t('orders.cancel.reasonPlaceholder') : t(reason)}</Text>
            </View>
            <ChevronDownIcon />
          </TouchableOpacity>

          <View style={styles.scrollTail} />
        </ScrollView>

        {/* Hidden without order.cancel; disabled until a reason is picked (the server needs one, 1 to 500 characters). */}
        {canCancel ? (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              testID="orders.cancel.open"
              style={[styles.primaryBtn, reasonText === null && styles.primaryBtnPending]}
              activeOpacity={0.8}
              disabled={reasonText === null}
              onPress={() => {
                cancel.reset();
                setStep('confirm');
              }}
            >
              <CancelCircleIcon />
              <Text style={styles.primaryBtnText}>{t('orders.cancel.confirm')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Modal
          visible={showReasonPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowReasonPicker(false)}
        >
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowReasonPicker(false)}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{t('orders.cancel.reasonPickerTitle')}</Text>
              {REASONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  testID={r}
                  style={[styles.modalOption, reason === r && styles.modalOptionSelected]}
                  onPress={() => {
                    setReason(r);
                    setShowReasonPicker(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, reason === r && styles.modalOptionTextSelected]}>{t(r)}</Text>
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
  fieldValue: { ...adminType.sectionHead, color: adminColors.ink },
  fieldValueBold: { ...adminType.sectionHead, color: adminColors.ink },
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
  dropdownLabel: { ...adminType.caption, color: adminColors.muted, letterSpacing: 0.5, marginBottom: 2 },
  dropdownValue: { ...adminType.sectionHead, color: adminColors.ink },
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
  confirmPromptText: { ...adminType.sectionHead, color: adminColors.warning.text },
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
  dangerAlertText: { flex: 1, ...adminType.rowTitle, color: adminColors.danger.text },
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
  primaryBtnPending: { backgroundColor: adminColors.brandTint },
  errorBox: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  errorText: { ...adminType.body, color: adminColors.danger.text },
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
  modalTitle: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.md },
  modalOption: { paddingVertical: adminSpacing.md, paddingHorizontal: 10, borderRadius: adminRadius.xs },
  modalOptionSelected: { backgroundColor: adminColors.brandTint },
  modalOptionText: { ...adminType.body, color: adminColors.ink },
  modalOptionTextSelected: { fontWeight: '700', color: adminColors.brand },
});
