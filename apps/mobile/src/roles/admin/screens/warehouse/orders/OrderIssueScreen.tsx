/**
 * Order Issue — report a problem with a customer order, then confirm it.
 *
 * Two steps in one screen: the issue form, and the "Issue Submitted"
 * confirmation that used to be its own route (M5S16B). The confirmation is
 * reached ONLY after POST /admin/orders/{id}/issues answered 2xx (BR-35,
 * BR-152; Idempotency-Key), or by a deep link carrying a real `issueId` (the
 * issue list opens it that way). A failure stays on the form with the error
 * shown.
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - "Submit Issue" renders only with `warehouse.issue.manage`.
 *
 * "View Issue" on the confirmation opens the operational issues list, which
 * needs `warehouse.issue.view` (../availability.ts 'operationalIssues'); a
 * caller without that permission gets no bottom action.
 *
 * Live data: the order number and the affected-item options are the order's
 * own lines (GET /admin/orders/{orderId}). The submitted step's Issue ID and
 * Status are the issue number and status the server returned (or the route's
 * issue id, with no status), never an invented one.
 *
 * What is sent: the issue type as a stable code (quality, quantity, ...), and
 * the description. The endpoint has no field for the affected item or quantity
 * and the order detail carries no order-item ids for `lineItemIds`, so the
 * admin's affected-item and quantity entries travel as lines of the
 * description. The photo tile is a design placeholder: there is no upload
 * endpoint for it, so nothing is sent for it.
 */
// Design id: M5S16 (M5S16_OrderIssue), absorbs M5S16B (M5S16B_IssueSubmitted)
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Path, Circle } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { isAreaAvailable } from '../availability';
import type { CreateOrderIssueBody, OrderIssueResponseDto } from '../../../api/orders';
import { adminErrorKey } from '../../../api/errors';
import { t, type TranslationKey } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import type { OrderDetailView, OrderIssueStep, OrderScreenBaseProps, OrdersLiveStateProps } from './types';
import type { LiveOrderAction } from './useOrdersData';

export interface OrderIssueScreenProps extends OrderScreenBaseProps, OrdersLiveStateProps {
  /** The order; undefined while loading or when the route names no order the API knows. */
  order?: OrderDetailView | undefined;
  /** Which step to open on; the host passes `params.step` here (M5S16B deep links -> 'submitted'). */
  initialStep?: OrderIssueStep | undefined;
  /** Issue id shown on the submitted step (deep link); without one the step shows ADMIN_NO_VALUE. */
  issueId?: string | undefined;
  /** "View Issue" on the submitted step. Without it the screen navigates to 'M4S09'. */
  onViewIssue?: (() => void) | undefined;
  /** POST .../issues. */
  report?: LiveOrderAction<CreateOrderIssueBody> | undefined;
}

/** The stable code the server stores for an issue-type option: the last key segment ('quality', 'late', ...). */
export function issueTypeCode(key: TranslationKey): string {
  return key.slice(key.lastIndexOf('.') + 1);
}

/** The server's answer to POST .../issues, or undefined for anything else (a re-read that found it landed). */
function asIssueResponse(result: unknown): OrderIssueResponseDto | undefined {
  if (typeof result !== 'object' || result === null) return undefined;
  const { id, issueNumber, status } = result as Record<string, unknown>;
  return typeof id === 'string' && typeof issueNumber === 'string' && typeof status === 'string'
    ? { id, issueNumber, status }
    : undefined;
}

/** The server's description limit (docs/openapi.yaml createAdminOrderIssue). */
export const ISSUE_DESCRIPTION_MAX = 4000;

/**
 * The request body: the typed description, then the affected item and quantity
 * the admin entered as extra lines (the endpoint has no fields for them), cut
 * to the server's limit. Null when there is no description to send.
 */
export function buildIssueBody(input: {
  issueType: TranslationKey;
  description: string;
  affectedItemLabel: string | undefined;
  affectedQty: string;
}): CreateOrderIssueBody | null {
  const description = input.description.trim();
  if (description === '') return null;
  const lines = [description];
  if (input.affectedItemLabel !== undefined) lines.push(t('orders.issue.sent.item', { item: input.affectedItemLabel }));
  const qty = input.affectedQty.trim();
  if (qty !== '') lines.push(t('orders.issue.sent.qty', { qty }));
  return { issueType: issueTypeCode(input.issueType), description: lines.join('\n').slice(0, ISSUE_DESCRIPTION_MAX) };
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

const ISSUE_TYPES: readonly TranslationKey[] = [
  'orders.issue.type.quality',
  'orders.issue.type.quantity',
  'orders.issue.type.missing',
  'orders.issue.type.wrong',
  'orders.issue.type.damaged',
  'orders.issue.type.late',
];

/** The key of the design's last option, the whole order. */
const WHOLE_ORDER_KEY = 'whole-order';

/** The affected-item options: one per order line, then the whole order. */
function affectedItemOptions(order: OrderDetailView): { key: string; label: string }[] {
  return [
    ...order.lines.map((line) => ({
      key: line.key,
      label: t('orders.issue.itemOption', {
        name: line.name,
        grade: line.gradeLabel,
        qty: line.qtyGrams === null ? ADMIN_NO_VALUE : formatKg(line.qtyGrams),
      }),
    })),
    { key: WHOLE_ORDER_KEY, label: t('orders.issue.wholeOrder') },
  ];
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
  order: OrderDetailView;
  onBack: () => void;
  /** Sends the issue; the screen moves to the submitted step only when this reports a 2xx. */
  report: LiveOrderAction<CreateOrderIssueBody>;
  canReport: boolean;
  onSubmitted: (result: unknown) => void;
}

function IssueFormStep({ order, onBack, report, canReport, onSubmitted }: IssueFormStepProps) {
  const orderItems = affectedItemOptions(order);
  const [issueType, setIssueType] = useState<TranslationKey>('orders.issue.type.quality');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const selectedLabel = orderItems.find((item) => item.key === selectedItem)?.label;
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [affectedQty, setAffectedQty] = useState('');
  const [description, setDescription] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const body = buildIssueBody({ issueType, description, affectedItemLabel: selectedLabel, affectedQty });

  return (
    <View style={styles.container}>
      <Header title={t('orders.issue.title')} onBack={onBack} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.orderRefLabel}>{order.orderNumber}</Text>

        <View style={styles.sectionHeaderRowTop}>
          <Text style={styles.sectionHeading}>{t('orders.issue.issueType')}</Text>
          <Text style={styles.helperLabel}>{t('orders.issue.required')}</Text>
        </View>

        <View style={styles.categoryCard}>
          {ISSUE_TYPES.map((type, index) => {
            const isSelected = issueType === type;
            const isLast = index === ISSUE_TYPES.length - 1;
            return (
              <React.Fragment key={type}>
                <TouchableOpacity style={styles.radioRow} activeOpacity={0.75} onPress={() => setIssueType(type)}>
                  {isSelected ? <RadioSelectedIcon /> : <RadioUnselectedIcon />}
                  <Text style={styles.radioText}>{t(type)}</Text>
                </TouchableOpacity>
                {!isLast && <View style={styles.cardDivider} />}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={styles.sectionHeading}>{t('orders.issue.affectedItem')}</Text>
        <TouchableOpacity style={styles.dropdownBox} activeOpacity={0.75} onPress={() => setShowItemPicker(true)}>
          <View style={styles.dropdownTextWrap}>
            <Text style={styles.dropdownCaption}>{t('orders.issue.affectedItemCaption')}</Text>
            <Text style={[styles.dropdownValue, selectedLabel === undefined && styles.dropdownPlaceholder]}>
              {selectedLabel ?? t('orders.issue.itemPlaceholder')}
            </Text>
          </View>
          <ChevronDownIcon />
        </TouchableOpacity>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>{t('orders.issue.affectedQty')}</Text>
          <Text style={styles.helperLabel}>{t('orders.issue.ifSupported')}</Text>
        </View>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.textInput}
            placeholder={t('orders.issue.affectedQtyPlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            value={affectedQty}
            onChangeText={setAffectedQty}
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>{t('orders.issue.description')}</Text>
          <Text style={styles.helperLabel}>{t('orders.issue.required')}</Text>
        </View>
        <View style={styles.textareaBox}>
          <TextInput
            testID="orders.issue.description"
            style={styles.textareaInput}
            placeholder={t('orders.issue.descriptionPlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <Text style={styles.sectionHeading}>{t('orders.issue.photos')}</Text>
        <TouchableOpacity
          style={[styles.photoBox, hasPhoto && styles.photoBoxActive]}
          activeOpacity={0.75}
          onPress={() => setHasPhoto(!hasPhoto)}
        >
          <CameraPhotoIcon />
          <Text style={styles.photoBoxText}>{hasPhoto ? t('orders.issue.onePhoto') : t('orders.issue.addPhoto')}</Text>
        </TouchableOpacity>

        <View style={styles.noticeBox}>
          <View style={styles.noticeIconWrap}>
            <InfoCircleIcon />
          </View>
          <Text style={styles.noticeText}>{t('orders.issue.notice')}</Text>
        </View>

        <WriteError error={report.error} />
        {/* Hidden without warehouse.issue.manage; disabled until the required description is typed. */}
        {canReport ? (
          <TouchableOpacity
            testID="orders.issue.submit"
            style={[styles.primaryBtn, (body === null || report.isPending) && styles.primaryBtnPending]}
            activeOpacity={0.8}
            disabled={body === null || report.isPending}
            onPress={() => {
              if (body !== null) report.run(body, onSubmitted);
            }}
          >
            <SendPlaneIcon />
            <Text style={styles.primaryBtnText}>{report.isPending ? t('orders.action.saving') : t('orders.issue.submit')}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <Modal visible={showItemPicker} transparent animationType="fade" onRequestClose={() => setShowItemPicker(false)}>
        {/* Was a translucent overlay; no translucent token, so the scrim is transparent and the card carries adminShadow.lg. */}
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowItemPicker(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('orders.issue.itemPickerTitle')}</Text>
            {orderItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.modalOption, selectedItem === item.key && styles.modalOptionSelected]}
                onPress={() => {
                  setSelectedItem(item.key);
                  setShowItemPicker(false);
                }}
              >
                <Text style={[styles.modalOptionText, selectedItem === item.key && styles.modalOptionTextSelected]}>
                  {item.label}
                </Text>
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
  /** The issue number the server returned, else a real issue id from the route, else undefined (ADMIN_NO_VALUE). */
  issueId: string | undefined;
  /** The status the server returned; undefined (ADMIN_NO_VALUE) for a route's issue id. */
  status: string | undefined;
  onBack: () => void;
  /** Omitted when the issues area is hidden: no "View Issue" button. */
  onViewIssue?: (() => void) | undefined;
}

function IssueSubmittedStep({ issueId, status, onBack, onViewIssue }: IssueSubmittedStepProps) {
  return (
    <View style={styles.container}>
      <Header title={t('orders.issue.submittedTitle')} onBack={onBack} />

      <View style={styles.submittedContent}>
        <View style={styles.heroContainer}>
          <View style={styles.successCircleBadge}>
            <SuccessCheckIcon />
          </View>
          <Text style={styles.heroTitle}>{t('orders.issue.submittedTitle')}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('orders.issue.field.issueId')}</Text>
              <Text style={styles.fieldValue}>{issueId ?? ADMIN_NO_VALUE}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('orders.issue.field.status')}</Text>
              <Text style={styles.fieldValue}>{status ?? ADMIN_NO_VALUE}</Text>
            </View>
          </View>
        </View>
      </View>

      {onViewIssue ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={onViewIssue}>
            <EyeIcon />
            <Text style={styles.primaryBtnText}>{t('orders.issue.viewIssue')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export function OrderIssueScreen({
  order,
  initialStep = 'form',
  issueId,
  onViewIssue,
  report,
  can,
  onBack,
  onNavigate,
  isLoading = false,
  error,
  onRetry,
}: OrderIssueScreenProps) {
  const [step, setStep] = useState<OrderIssueStep>(initialStep);
  // What the server answered for the issue raised from this screen.
  const [created, setCreated] = useState<OrderIssueResponseDto | undefined>(undefined);
  const [submittedHere, setSubmittedHere] = useState(false);
  // "Issue Submitted" needs a 2xx from this screen or a real issue id from the
  // route; a bare deep link to the step opens the form instead of claiming a
  // submission nobody made.
  const showSubmitted = step === 'submitted' && (submittedHere || issueId !== undefined);
  const view = queryViewState({ isLoading, error, itemCount: order === undefined ? 0 : 1 });

  const handleViewIssue = () => {
    if (onViewIssue) {
      onViewIssue();
    } else {
      // M4S09 = operational issues; the issue id only when a real one came in, the order for context.
      onNavigate?.('M4S09', { orderId: order?.id, issueId });
    }
  };

  // The submitted step reads nothing from the order; the form needs it loaded.
  if (!showSubmitted && (view !== 'ready' || order === undefined || report === undefined)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.container}>
          <Header title={t('orders.issue.title')} onBack={onBack} />
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
      {!showSubmitted && order !== undefined && report !== undefined ? (
        <IssueFormStep
          order={order}
          onBack={onBack}
          report={report}
          canReport={can('warehouse.issue.manage')}
          onSubmitted={(result) => {
            setCreated(asIssueResponse(result));
            setSubmittedHere(true);
            setStep('submitted');
          }}
        />
      ) : (
        <IssueSubmittedStep
          issueId={created?.issueNumber ?? issueId}
          status={created?.status}
          // Back from the confirmation returns to the form, not out of the screen.
          onBack={() => setStep('form')}
          onViewIssue={isAreaAvailable('operationalIssues', can) ? handleViewIssue : undefined}
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
  primaryBtnPending: { backgroundColor: adminColors.brandTint },
  errorBox: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  errorText: { ...adminType.body, color: adminColors.danger.text },
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
