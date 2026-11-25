/**
 * Dispatch — assign a delivery partner, confirm, and see the order dispatched.
 *
 * Three designed screens are one survivor here, as inline steps:
 *   'dispatch'   M5S14  order summary + delivery partner assignment
 *   'confirm'    M5S14B "Confirm Dispatch?" summary (was its own route)
 *   'dispatched' M5S14C success card (was its own route)
 * The host passes an old deep link's `params.step` through as `initialStep`.
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - Both "Confirm Dispatch" buttons (the one that opens the confirm step and
 *     the one that performs the dispatch) render only with `order.dispatch`.
 *   - Picking a delivery partner has no rbac code of its own; it is left
 *     ungated, since without `order.dispatch` the choice cannot be submitted.
 *     The partner list itself is GET /admin/delivery-partners, which needs
 *     `delivery.partner.manage` (the flow only fetches it with that code).
 *
 * Live data: the order number, customer and item count are GET
 * /admin/orders/{orderId}. AdminOrderDetail carries no delivery address (BR-99
 * allow-list) and OrderDetailView does not map the delivery slot, so both show
 * ADMIN_NO_VALUE. The delivery slot is READ-ONLY here (a plain field): only the
 * delivery partner is chosen, so the request carries `deliveryPartnerId` and
 * never a slot. The second "Confirm Dispatch" is POST /admin/orders/{id}/dispatch
 * (BR-21, BR-118; Idempotency-Key) through the LiveOrderAction the flow supplies
 * (useOrdersData.ts, same as Packing). The dispatched card is reached ONLY
 * after the server answered 2xx, and shows the status the server returned,
 * never an invented "Dispatched". A failure stays on the confirm step with the
 * error shown. availability.ts still keeps this route out of the app (delivery
 * is not offered, BR-21), so nothing navigates here until that changes.
 */
// Design id: M5S14 (M5S14_Dispatch), absorbs M5S14B, M5S14C
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  } from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import {
  adminColors,
  adminType,
  adminRadius,
  adminSpacing,
  adminShadow,
  ADMIN_BUTTON_HEIGHT,
} from '../../../theme';
import type { DeliveryPartnerDto, DispatchOrderBody } from '../../../api/orders';
import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { detailStatusOf, orderStatusLabel } from './mappers';
import type { DispatchStep, OrderDetailView, OrderScreenBaseProps, OrdersLiveStateProps } from './types';
import type { LiveOrderAction } from './useOrdersData';

/** What a screen needs of the delivery-partner list (GET /admin/delivery-partners). */
export interface DispatchPartners {
  partners: readonly DeliveryPartnerDto[];
  isLoading?: boolean | undefined;
  error?: unknown;
}

/** Statuses that show a delivery dispatch has happened (BR-21). */
const DISPATCHED_STATUSES: readonly OrderDetailView['status'][] = ['dispatched', 'outForDelivery', 'delivered'];

export interface DispatchScreenProps extends OrderScreenBaseProps, OrdersLiveStateProps {
  /** The order; undefined while loading or when the route names no order the API knows. */
  order?: OrderDetailView | undefined;
  /** Step to open on; an old M5S14B / M5S14C link maps to 'confirm' / 'dispatched'. */
  initialStep?: DispatchStep | undefined;
  /** POST .../dispatch. */
  dispatch?: LiveOrderAction<DispatchOrderBody> | undefined;
  /** The delivery partners the picker offers. */
  partnerList?: DispatchPartners | undefined;
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

function ChevronDownIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SelectedCheckIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={adminColors.brand}
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

function DeliveryTruckIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="14" height="13" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M15 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function HistoryClockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Shared layout pieces ────────────────────────────────────────────────────

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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </>
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

function PrimaryButton({
  label,
  icon,
  onPress,
  testID,
  disabled = false,
}: {
  testID?: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.bottomBar}>
      <TouchableOpacity
        testID={testID}
        style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
        activeOpacity={0.8}
        disabled={disabled}
        onPress={onPress}
      >
        {icon}
        <Text style={styles.primaryBtnText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step: dispatch (M5S14) ──────────────────────────────────────────────────

interface DispatchDetailsStepProps {
  order: OrderDetailView;
  canDispatch: boolean;
  partnerList: DispatchPartners;
  selectedPartnerId: string | null;
  onSelectPartner: (id: string) => void;
  onBack: () => void;
  onConfirm: () => void;
}

function DispatchDetailsStep({
  order,
  canDispatch,
  partnerList,
  selectedPartnerId,
  onSelectPartner,
  onBack,
  onConfirm,
}: DispatchDetailsStepProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const partners = partnerList.partners;
  const selectedPartner = partners.find((partner) => partner.id === selectedPartnerId);

  return (
    <>
      <Header title={t('orders.dispatch.title')} onBack={onBack} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.topSubtitleContainer}>
          <Text style={styles.topSubtitleText}>{t('orders.dispatch.subtitle', { order: order.orderNumber })}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('orders.dispatch.summary')}</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Field label={t('orders.dispatch.field.customer')} value={order.buyerName} />
            </View>
            <View style={styles.col}>
              <Field label={t('orders.dispatch.field.items')} value={String(order.itemCount)} />
            </View>
          </View>
          <View style={styles.rowGap}>
            <Field label={t('orders.dispatch.field.address')} value={ADMIN_NO_VALUE} />
          </View>
          <View style={styles.rowGap}>
            <Field label={t('orders.dispatch.field.slot')} value={ADMIN_NO_VALUE} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>{t('orders.dispatch.partner')}</Text>
        <View style={styles.card}>
          <Text style={styles.assignmentLabel}>{t('orders.dispatch.assignment')}</Text>
          <TouchableOpacity
            testID="orders.dispatch.partnerPicker"
            style={styles.pickerBox}
            activeOpacity={0.75}
            onPress={() => setIsDropdownOpen((prev) => !prev)}
          >
            <Text style={styles.pickerText}>{selectedPartner?.name ?? ADMIN_NO_VALUE}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>

          {isDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {partners.map((partner, index) => {
                const isSelected = selectedPartnerId === partner.id;
                return (
                  <TouchableOpacity
                    key={partner.id}
                    testID={`orders.dispatch.partner.${partner.id}`}
                    style={[
                      styles.dropdownItem,
                      index === partners.length - 1 && styles.dropdownItemLast,
                      isSelected && styles.dropdownItemSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      onSelectPartner(partner.id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextSelected]}>
                      {partner.name}
                    </Text>
                    {isSelected && <SelectedCheckIcon />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {partnerList.error !== null && partnerList.error !== undefined ? <WriteError error={partnerList.error} /> : null}
        </View>

        <View style={styles.scrollTail} />
      </ScrollView>

      {/* Hidden without order.dispatch; disabled until a delivery partner is picked (the slot is read-only here). */}
      {canDispatch ? (
        <PrimaryButton
          label={t('orders.dispatch.confirm')}
          icon={<DeliveryTruckIcon />}
          testID="orders.dispatch.open"
          disabled={selectedPartner === undefined}
          onPress={onConfirm}
        />
      ) : null}
    </>
  );
}

// ─── Step: confirm (folded M5S14B) ───────────────────────────────────────────

interface ConfirmStepProps {
  order: OrderDetailView;
  canDispatch: boolean;
  isPending: boolean;
  error: unknown;
  onBack: () => void;
  onDispatch: () => void;
}

function ConfirmStep({ order, canDispatch, isPending, error, onBack, onDispatch }: ConfirmStepProps) {
  return (
    <>
      <Header title={t('orders.dispatch.confirmTitle')} onBack={onBack} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainerConfirm} showsVerticalScrollIndicator={false}>
        <View style={styles.confirmPromptBox}>
          <QuestionCircleIcon />
          <Text style={styles.confirmPromptText}>{t('orders.dispatch.confirmPrompt')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Field label={t('orders.dispatch.field.order')} value={order.orderNumber} />
            </View>
            <View style={styles.col}>
              <Field label={t('orders.dispatch.field.destination')} value={ADMIN_NO_VALUE} />
            </View>
          </View>
          <View style={styles.rowGap}>
            <Field label={t('orders.dispatch.field.slot')} value={ADMIN_NO_VALUE} />
          </View>
        </View>

        <WriteError error={error} />

        <View style={styles.scrollTail} />
      </ScrollView>

      {canDispatch ? (
        <PrimaryButton
          label={isPending ? t('orders.action.saving') : t('orders.dispatch.confirm')}
          icon={<CheckmarkIcon />}
          testID="orders.dispatch.submit"
          disabled={isPending}
          onPress={onDispatch}
        />
      ) : null}
    </>
  );
}

// ─── Step: dispatched (folded M5S14C) ────────────────────────────────────────

interface DispatchedStepProps {
  order: OrderDetailView;
  /** The status label from the server's answer to the dispatch (the order refetch may lag it). */
  statusLabel: string;
  onBack: () => void;
  onViewHistory: () => void;
}

function DispatchedStep({ order, statusLabel, onBack, onViewHistory }: DispatchedStepProps) {
  return (
    <>
      <Header title={t('orders.dispatch.dispatchedTitle')} onBack={onBack} />

      <View style={styles.contentPacked}>
        <View style={styles.heroContainer}>
          <View style={styles.successCircleBadge}>
            <DeliveryTruckIcon size={32} color={adminColors.success.text} />
          </View>
          <Text style={styles.heroTitle}>{t('orders.dispatch.dispatchedTitle')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Field label={t('orders.dispatch.field.order')} value={order.orderNumber} />
            </View>
            <View style={styles.col}>
              <Field label={t('orders.dispatch.field.status')} value={statusLabel} />
            </View>
          </View>
        </View>
      </View>

      <PrimaryButton label={t('orders.dispatch.viewHistory')} icon={<HistoryClockIcon />} onPress={onViewHistory} />
    </>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export function DispatchScreen({
  can,
  onBack,
  onNavigate,
  order,
  dispatch,
  partnerList = NO_PARTNERS,
  initialStep = 'dispatch',
  isLoading = false,
  error,
  onRetry,
}: DispatchScreenProps) {
  const [step, setStep] = useState<DispatchStep>(initialStep);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  // The status the server returned for the dispatch made from this screen (2xx only).
  const [dispatchedStatus, setDispatchedStatus] = useState<string | undefined>(undefined);
  const [dispatchedHere, setDispatchedHere] = useState(false);
  const canDispatch = can('order.dispatch');
  const view = queryViewState({ isLoading, error, itemCount: order === undefined ? 0 : 1 });
  const selectedPartner = partnerList.partners.find((partner) => partner.id === selectedPartnerId);
  // "Order Dispatched" needs the server's 2xx from this screen, or an order that already reads dispatched
  // (a deep link to the step for any other order opens the partner step instead).
  const isDispatched = dispatchedHere || (order !== undefined && DISPATCHED_STATUSES.includes(order.status));

  if (view !== 'ready' || order === undefined || dispatch === undefined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.container}>
          <Header title={t('orders.dispatch.title')} onBack={onBack} />
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.container}>
        {step === 'dispatch' || (step === 'confirm' && selectedPartner === undefined) || (step === 'dispatched' && !isDispatched) ? (
          <DispatchDetailsStep
            order={order}
            canDispatch={canDispatch}
            partnerList={partnerList}
            selectedPartnerId={selectedPartnerId}
            onSelectPartner={setSelectedPartnerId}
            onBack={onBack}
            onConfirm={() => {
              dispatch.reset();
              setStep('confirm');
            }}
          />
        ) : null}
        {step === 'confirm' && selectedPartner !== undefined ? (
          <ConfirmStep
            order={order}
            canDispatch={canDispatch}
            isPending={dispatch.isPending}
            error={dispatch.error}
            onBack={() => setStep('dispatch')}
            onDispatch={() =>
              // The partner only; the slot is read-only at dispatch and is never sent.
              dispatch.run({ deliveryPartnerId: selectedPartner.id }, (result) => {
                setDispatchedStatus(statusOf(result));
                setDispatchedHere(true);
                setStep('dispatched');
              })
            }
          />
        ) : null}
        {step === 'dispatched' && isDispatched ? (
          <DispatchedStep
            order={order}
            statusLabel={dispatchedStatus === undefined ? order.statusLabel : orderStatusLabel(detailStatusOf(dispatchedStatus))}
            onBack={() => setStep('confirm')}
            onViewHistory={() => onNavigate?.('M5S15', { orderId: order.id })}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const NO_PARTNERS: DispatchPartners = { partners: [] };

/** The `status` of the server's answer to the dispatch, or undefined when it did not carry one. */
function statusOf(result: unknown): string | undefined {
  if (typeof result !== 'object' || result === null) return undefined;
  const status = (result as Record<string, unknown>)['status'];
  return typeof status === 'string' ? status : undefined;
}

// Success badge diameter: an icon size, not spacing (no size token exists for it).
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
    paddingBottom: 14,
    gap: adminSpacing.md,
  },
  backButton: { width: 32, height: 32, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  topSubtitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: adminSpacing.xs,
  },
  topSubtitleText: { ...adminType.rowTitle, color: adminColors.muted },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.sm, paddingBottom: 20 },
  contentContainerConfirm: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.lg, paddingBottom: 20 },
  scrollTail: { height: adminSpacing.xl },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  sectionTitleSpaced: { marginTop: 20 },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 18,
    paddingVertical: adminSpacing.lg,
    ...adminShadow.sm,
  },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1 },
  rowGap: { marginTop: 14 },
  fieldLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: 3 },
  fieldValue: { ...adminType.sectionHead, color: adminColors.ink },
  assignmentLabel: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.sm },
  pickerBox: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: { ...adminType.sectionHead, color: adminColors.ink },
  dropdownMenu: {
    marginTop: adminSpacing.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dropdownItemLast: { borderBottomWidth: 0 },
  dropdownItemSelected: { backgroundColor: adminColors.brandTint },
  dropdownItemText: { ...adminType.body, fontWeight: '500', color: adminColors.muted },
  dropdownItemTextSelected: { fontWeight: '700', color: adminColors.brand },
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
  bottomBar: {
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
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
  primaryBtnDisabled: { backgroundColor: adminColors.brandTint },
  primaryBtnText: { ...adminType.sectionHead, color: adminColors.onBrand },
  errorBox: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.md,
  },
  errorText: { ...adminType.body, color: adminColors.danger.text },
  contentPacked: { flex: 1, paddingTop: 36, paddingHorizontal: adminSpacing.lg },
  heroContainer: { alignItems: 'center', marginBottom: 28 },
  successCircleBadge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
  },
  heroTitle: { ...adminType.title, color: adminColors.ink },
});
