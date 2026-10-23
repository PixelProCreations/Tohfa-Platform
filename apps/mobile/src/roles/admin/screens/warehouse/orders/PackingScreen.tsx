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
 *   - "Mark Ready for Pickup" on the packed result is POST .../dispatch, which
 *     moves a PACKED pickup order to READY_FOR_PICKUP: `order.dispatch`.
 *   - "Prepare for Dispatch (Delivery)" is hidden: delivery dispatch is not
 *     enabled in Track 1 (BR-21; availability.ts 'orderDelivery').
 *
 * Live data (API integration plan, phase 5): the order is GET
 * /admin/orders/{orderId}; "Yes, Confirm Packing" is POST .../pack and "Mark
 * Ready for Pickup" POST .../dispatch, each with an Idempotency-Key and safe to
 * retry (orderActions.ts: after a timeout the order is re-read, and a status
 * that already moved counts as done). The whole order is packed as ordered:
 * the detail sends no order-item ids, so `packedLines` cannot be built (spec
 * gap), and the packed-quantity, packaging, notes and photo fields, which
 * nothing would send, are hidden. The tick lists are a packing aid only.
 *
 * The packing step shows the design's generic checklist (Product selected /
 * Quantity verified / Grade verified, packingChecklist) above the per-line
 * ticks ("Order Items"). Both are local ticks: nothing from them is sent, and
 * Confirm Packing does not wait on them. The design's per-item batch ids stay
 * hidden: AdminOrderDetail carries none (BR-99 allow-list).
 */
// Design id: M5S07 (Packing), absorbs M5S08 (Confirm Packing)
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import type { DispatchOrderBody, PackOrderBody } from '../../../api/orders';
import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { packingChecklist } from './mappers';
import type { OrderDetailView, OrderScreenBaseProps, OrdersLiveStateProps, PackingStep, WarehouseNavigate } from './types';
import type { LiveOrderAction } from './useOrdersData';

export interface PackingScreenProps extends OrderScreenBaseProps, OrdersLiveStateProps {
  /** Which step to open on; the host passes `params.step` (old M5S08 links use 'confirm'). */
  initialStep?: PackingStep | undefined;
  /** The order; undefined while loading or when the route names no order the API knows. */
  order?: OrderDetailView | undefined;
  /** POST .../pack. */
  pack?: LiveOrderAction<PackOrderBody> | undefined;
  /** POST .../dispatch (a pickup order -> READY_FOR_PICKUP). */
  markReady?: LiveOrderAction<DispatchOrderBody> | undefined;
}

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

function InfoCircleIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.info.text} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={adminColors.info.text} strokeWidth="2" strokeLinecap="round" />
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

/** A refused or failed write, worded for warehouse staff (adminErrorKey), never the server's detail. */
function WriteError({ error }: { error: unknown }) {
  if (error === null || error === undefined) return null;
  return (
    <View style={styles.errorBox}>
      <Text style={styles.errorText}>{t(adminErrorKey(error))}</Text>
    </View>
  );
}

/**
 * The packer's ticks (the generic checks and the order lines) live in the
 * parent so that stepping back from the confirmation does not wipe what was
 * already ticked. They are a packing aid only: nothing from them is sent (see
 * the header). Generic checks are keyed `check:<key>`, apart from line keys.
 */
function usePackingChecklist() {
  const [checked, setChecked] = useState<Readonly<Record<string, boolean>>>({});
  const toggle = (key: string) => setChecked((prev) => ({ ...prev, [key]: prev[key] !== true }));
  return { checked, toggle };
}

type PackingChecklist = ReturnType<typeof usePackingChecklist>;

// ─── Step: packing (M5S07) ───────────────────────────────────────────────────

interface PackingStepViewProps {
  order: OrderDetailView;
  checklist: PackingChecklist;
  canMarkPacked: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

function PackingStepView({ order, checklist, canMarkPacked, onBack, onConfirm }: PackingStepViewProps) {
  const checkedCount = order.lines.filter((line) => checklist.checked[line.key] === true).length;
  const checks = packingChecklist().map((check) => ({ ...check, key: `check:${check.key}` }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header title={t('orders.packing.title')} onBack={onBack} />

        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>
            {t('orders.packing.subtitle', { order: order.orderNumber, checked: checkedCount, total: order.lines.length })}
          </Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>{t('orders.packing.checklistTitle')}</Text>
          <View style={styles.checklistCard}>
            {checks.map((check, index) => (
              <TouchableOpacity
                key={check.key}
                style={[styles.checklistItem, index < checks.length - 1 && styles.checklistItemBorder]}
                activeOpacity={0.7}
                onPress={() => checklist.toggle(check.key)}
              >
                {checklist.checked[check.key] === true ? <GreenCheckboxIcon /> : <EmptyCheckboxIcon />}
                <Text style={styles.checklistText}>{check.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>{t('orders.packing.orderItems')}</Text>
          <View style={styles.checklistCard}>
            {order.lines.map((line, index) => (
              <TouchableOpacity
                key={line.key}
                style={[styles.checklistItem, index < order.lines.length - 1 && styles.checklistItemBorder]}
                activeOpacity={0.7}
                onPress={() => checklist.toggle(line.key)}
              >
                {checklist.checked[line.key] === true ? <GreenCheckboxIcon /> : <EmptyCheckboxIcon />}
                <Text style={styles.checklistText}>{line.checklistLabel}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Packed quantity, packaging, notes and photo are not sent anywhere
              (the detail carries no order-item id for packedLines), so they are hidden. */}
          <View style={styles.infoBox}>
            <InfoCircleIcon />
            <Text style={styles.infoText}>{t('orders.packing.wholeOrder')}</Text>
          </View>

          <View style={styles.scrollSpacer} />
        </ScrollView>

        {canMarkPacked ? (
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={onConfirm}>
              <CheckmarkIcon />
              <Text style={styles.primaryBtnText}>{t('orders.packing.confirm')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

// ─── Step: confirm (folded M5S08) ────────────────────────────────────────────

/** The confirmation's checklist, as the M5S08 design words it. */
const CONFIRM_CHECKS = [
  'orders.packing.confirmCheck.allItems',
  'orders.packing.confirmCheck.quantities',
  'orders.packing.confirmCheck.completed',
] as const;

interface ConfirmStepViewProps {
  order: OrderDetailView;
  checkedCount: number;
  canMarkPacked: boolean;
  canMarkReady: boolean;
  pack: LiveOrderAction<PackOrderBody>;
  markReady: LiveOrderAction<DispatchOrderBody>;
  onBack: () => void;
  onNavigate?: WarehouseNavigate | undefined;
}

function ConfirmStepView({ order, checkedCount, canMarkPacked, canMarkReady, pack, markReady, onBack, onNavigate }: ConfirmStepViewProps) {
  // The packed result shows once this screen packed the order or the order is
  // already past CONFIRMED (opened from the detail to mark it ready).
  const [packedHere, setPackedHere] = useState(false);
  const isPacked = packedHere || order.status !== 'confirmed';

  if (isPacked) {
    // Only a PACKED pickup order is marked ready (POST .../dispatch); delivery
    // dispatch is not enabled in Track 1 (BR-21), so that button is hidden.
    const offerReady = canMarkReady && order.status === 'packed' && order.fulfilment === 'pickup';
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Header title={t('orders.packing.packedTitle')} onBack={onBack} />

          <View style={styles.contentPacked}>
            <View style={styles.heroContainer}>
              <View style={styles.successCircleBadge}>
                <BigSuccessCheckIcon />
              </View>
              <Text style={styles.heroTitle}>{order.status === 'confirmed' || order.status === 'packed' ? t('orders.packing.packedTitle') : order.statusLabel}</Text>
            </View>

            <View style={styles.packedSummaryCard}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>{t('orders.packing.field.order')}</Text>
                <Text style={styles.detailValue}>{order.orderNumber}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>{t('orders.packing.field.packedAt')}</Text>
                <Text style={styles.detailValue}>{order.packedLabel ?? t('orders.noValue')}</Text>
              </View>
            </View>

            <WriteError error={markReady.error} />
          </View>

          {offerReady ? (
            <View style={styles.bottomBarPacked}>
              <TouchableOpacity
                style={[styles.primaryBtn, markReady.isPending && styles.primaryBtnPending]}
                activeOpacity={0.8}
                disabled={markReady.isPending}
                onPress={() => markReady.run({}, () => onNavigate?.('M5S09'))}
              >
                <PersonCheckIcon />
                <Text style={styles.primaryBtnText}>{markReady.isPending ? t('orders.action.saving') : t('orders.packing.markReady')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header title={t('orders.packing.confirm')} onBack={onBack} />

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.confirmPromptBox}>
            <QuestionCircleIcon />
            <Text style={styles.confirmPromptText}>{t('orders.packing.confirmPrompt')}</Text>
          </View>

          <View style={styles.orderDetailsCard}>
            <View style={styles.twoColRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>{t('orders.packing.field.order')}</Text>
                <Text style={styles.detailValue}>{order.orderNumber}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>{t('orders.packing.field.items')}</Text>
                <Text style={styles.detailValue}>
                  {checkedCount} / {order.lines.length}
                </Text>
              </View>
            </View>

            <View style={[styles.twoColRow, styles.twoColRowSpaced]}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>{t('orders.packing.field.totalQuantity')}</Text>
                <Text style={styles.detailValue}>{order.totalGrams === null ? t('orders.noValue') : formatKg(order.totalGrams)}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>{t('orders.packing.field.customer')}</Text>
                <Text style={styles.detailValue}>{order.buyerName}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.checklistSectionTitle}>{t('orders.packing.confirmChecklist')}</Text>
          {CONFIRM_CHECKS.map((key) => (
            <View key={key} style={styles.checklistRowCard}>
              <GreenCheckboxIcon />
              <Text style={styles.checklistText}>{t(key)}</Text>
            </View>
          ))}

          <WriteError error={pack.error} />

          <View style={styles.scrollSpacer} />
        </ScrollView>

        {canMarkPacked ? (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.primaryBtn, pack.isPending && styles.primaryBtnPending]}
              activeOpacity={0.8}
              disabled={pack.isPending}
              // The whole order, as ordered: packedLines needs order-item ids the detail does not send.
              onPress={() => pack.run({}, () => setPackedHere(true))}
            >
              <CheckmarkIcon />
              <Text style={styles.primaryBtnText}>{pack.isPending ? t('orders.action.saving') : t('orders.packing.confirmYes')}</Text>
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
  order,
  initialStep = 'packing',
  isLoading = false,
  error,
  onRetry,
  pack,
  markReady,
}: PackingScreenProps) {
  const [step, setStep] = useState<PackingStep>(initialStep);
  const checklist = usePackingChecklist();
  const view = queryViewState({ isLoading, error, itemCount: order === undefined ? 0 : 1 });

  if (view !== 'ready' || order === undefined || pack === undefined || markReady === undefined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Header title={t('orders.packing.title')} onBack={onBack} />
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

  const canMarkPacked = can('order.mark_packed');
  // An order already past CONFIRMED has nothing to pack: open on its packed result.
  if (step === 'confirm' || order.status !== 'confirmed') {
    return (
      <ConfirmStepView
        order={order}
        checkedCount={order.lines.filter((line) => checklist.checked[line.key] === true).length}
        canMarkPacked={canMarkPacked}
        canMarkReady={can('order.dispatch')}
        pack={pack}
        markReady={markReady}
        onBack={initialStep === 'confirm' || order.status !== 'confirmed' ? onBack : () => setStep('packing')}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <PackingStepView
      order={order}
      checklist={checklist}
      canMarkPacked={canMarkPacked}
      onBack={onBack}
      onConfirm={() => setStep('confirm')}
    />
  );
}

// Fixed control sizes (not spacing): checkbox, success badge.
const CHECKBOX_SIZE = 22;
const SUCCESS_BADGE = 68;

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
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between' },
  twoColRowSpaced: { marginTop: 14 },
  detailCol: { flex: 1 },
  detailLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: 3 },
  detailValue: { ...adminType.sectionHead, color: adminColors.ink },
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
  primaryBtnPending: { backgroundColor: adminColors.brandTint },
  errorBox: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.md,
  },
  errorText: { ...adminType.body, color: adminColors.danger.text },

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
