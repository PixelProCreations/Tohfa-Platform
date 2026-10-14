/**
 * Goods Receiving wizard (FINAL_LIST #90, design module M2), shared by the Main
 * and Sub warehouse admins.
 *
 * One wizard records one delivery against one purchase order, on the real API
 * (integration plan phase 4):
 *   start_receiving        the order, the receiver, the vehicle number
 *   quantity_verification  the received (gross) weight, against the ordered quantity
 *   quality_check          the five checklist rows, moisture, visual score, defect notes
 *   grade_verification     the assigned grade (may differ from the listed one)
 *   receiving_decision     Accept / Partial Accept / Reject
 *   partial_acceptance     the accepted weight; rejected = received - accepted
 *   receipt_summary        everything above, then submit
 *   batch_assignment       the storage location (from GET /warehouses/{id}/storage-locations)
 *   receipt_confirmation   the real grnNumber, and the batch when the API returns one
 *   submission_error       the real error, with a retry that cannot record twice
 *   counter_offer          a revised price for the delivered lot, after the receipt exists
 *
 * Submitting is POST /admin/goods-receipts, then POST .../quality-check
 * (./submission.ts). The server ignores the Idempotency-Key on both (server
 * gap), so the created receipt is kept and a failed quality check retries only
 * the quality check; after a timeout the next attempt re-reads the order and
 * resumes a receipt that now exists. An order that already has a receipt
 * awaiting QC opens on that receipt and never creates another.
 *
 * Steps with no API are not offered (their step keys fall back to the start):
 * the damage / mismatch report, rejected goods and their handling (disposal),
 * the in-progress checklist, the one-page review, and the embedded history and
 * receipt detail (the host's Receiving History serves those). Photos are not
 * offered: the uploader is farmer-only. Rejection reasons are reference data
 * the API does not serve, so a rejection is explained in the defect notes.
 *
 * Gates (docs/rbac.json; `can` only decides what to render, the server checks
 * again, CLAUDE.md 2.1). A gated step is skipped, never shown disabled:
 *   inventory.goods_receipt.record   the wizard itself (else a permission note)
 *   inventory.quality_check.perform  Quality, Grade, Decision; without it only the receipt is recorded
 *   inventory.produce.reject_incoming Reject + Partial Accept outcomes
 *   inventory.batch.assign           Batch & Storage step
 *   inventory.quality.counter_offer  Counter-Offer step and its entry card
 *   inventory.batch.view             View Batch
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';

import { adminErrorKey } from '../../../api/errors';
import type { Grade } from '../../../api/inventory';
import type { CounterOfferCreate, CounterOfferDto, GoodsReceiptCreate, GoodsReceiptDto, QualityCheckCreate, QualityCheckResultDto } from '../../../api/receiving';
import { t } from '../../../i18n';
import { formatKg, parseKgToGrams } from '../../../money/quantity';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { formatAdminDate, formatAdminDay } from '../../../utils/datetime';
import { gradeLabel } from '../inventory/mappers';
import {
  QC_DRAFT_PROBLEM_MESSAGE,
  buildCounterOfferBody,
  buildGoodsReceiptBody,
  buildQualityCheckBody,
  createReceivingKeyRing,
  qcDraftProblem,
  receiptResultLabel,
  receiptResultOf,
  receivingWarehouseFilter,
  type QcDraft,
} from './mappers';
import {
  AlertCircleOutlineIcon,
  BackArrowIcon,
  CheckboxSquareIcon,
  CheckmarkCircleOutlineIcon,
  CheckmarkIcon,
  ChevronDownIcon,
  ChevronRightSmall,
  CrateInventoryIcon,
  CrossCircleIcon,
  ErrorExclamationCircleIcon,
  NotEqualIcon,
  NoticeBox,
  PermissionNote,
  QC_CRITERIA,
  QcCriterionIcon,
  QrCodeIcon,
  RECEIVING_CODES,
  ReceiptPaperIcon,
  RefreshRetryIcon,
  RightArrowIcon,
  SendPaperAirplaneIcon,
  StepperHeader,
  TruckDeliveryIcon,
  WarningTriangleIcon,
} from './ReceivingParts';
import { initialSubmissionState, submitReceiving, type SubmissionStage, type SubmissionState } from './submission';
import type {
  QcCriterionId,
  QcResult,
  ReceivingWizardStep,
  ShipmentLineItem,
  StorageBayOption,
  WarehouseScreenBaseProps,
  WizardShipmentData,
} from './types';

/** The API calls the wizard makes; the host binds them (ReceivingFlow). Each write takes its Idempotency-Key. */
export interface ReceivingWrites {
  createReceipt: (body: GoodsReceiptCreate, idempotencyKey: string) => Promise<GoodsReceiptDto>;
  receiptsOfPurchaseOrder: (purchaseOrderId: string) => Promise<readonly GoodsReceiptDto[]>;
  getReceipt: (id: string) => Promise<GoodsReceiptDto>;
  recordQualityCheck: (id: string, body: QualityCheckCreate, idempotencyKey: string) => Promise<QualityCheckResultDto>;
  createCounterOffer: (id: string, body: CounterOfferCreate, idempotencyKey: string) => Promise<CounterOfferDto>;
}

export interface GoodsReceivingWizardScreenProps extends WarehouseScreenBaseProps {
  /** Step to open on. A step the admin may not perform falls through to the next allowed one. */
  initialStep: ReceivingWizardStep;
  /** The purchase order being received (GET /admin/purchase-orders/{id}). */
  shipment: WizardShipmentData;
  /** A receipt of this order still awaiting QC: the wizard completes it instead of creating another. */
  pendingReceipt?: GoodsReceiptDto | undefined;
  /** The receiving warehouse's storage locations. */
  storageLocations?: readonly StorageBayOption[] | undefined;
  storageLocationsLoading?: boolean | undefined;
  writes: ReceivingWrites;
  /** Name of the admin doing the receiving (Start Receiving "Receiver"). */
  receiverName?: string | undefined;
  onFinish?: (() => void) | undefined;
  onBackToShipments?: (() => void) | undefined;
  /** Inventory Batch Detail for the batch the quality check created (inventory.batch.view). */
  onViewBatch?: ((batchId: string) => void) | undefined;
  /** The host's receipt detail for the recorded receipt. */
  onViewReceipt?: ((receiptId: string) => void) | undefined;
  /** The host's Receiving History list. */
  onViewHistory?: (() => void) | undefined;
}

/** Stepper stages, in order. Quality and Batch drop out when their gate fails. */
type StepperStage = 'Shipment' | 'Quantity' | 'Quality' | 'Grade' | 'Decision' | 'Summary' | 'Batch';

/** Steps with no API behind them: never shown, whatever a host or deep link asks for. */
const STEPS_WITHOUT_API: ReadonlySet<ReceivingWizardStep> = new Set<ReceivingWizardStep>([
  'damage_mismatch',
  'rejected_goods',
  'record_handling',
  'receiving_in_progress',
  'continue_receiving',
  'review_receiving',
  'receiving_history',
  'receipt_detail',
]);

/** Where a step the admin may not perform falls through to. */
const STEP_FALLBACK: Partial<Record<ReceivingWizardStep, ReceivingWizardStep>> = {
  quality_check: 'receipt_summary',
  grade_verification: 'receipt_summary',
  receiving_decision: 'receipt_summary',
  partial_acceptance: 'receiving_decision',
  batch_assignment: 'receipt_summary',
};

/** The grades a quality check may assign (docs/openapi.yaml Grade). */
const GRADES: readonly Grade[] = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'];

const ALL_PASS: Record<QcCriterionId, QcResult> = {
  appearance: 'pass',
  size: 'pass',
  moisture: 'pass',
  damage: 'pass',
  freshness: 'pass',
};

/** Received - Expected, as the absorbed Quantity Verification rule states (never typed by the user). */
function lineStatus(line: ShipmentLineItem): 'Shortage' | 'Excess' | 'Match' {
  if (line.expectedGrams === null || line.receivedGrams === null) return 'Match';
  const diff = line.receivedGrams - line.expectedGrams;
  return diff < 0 ? 'Shortage' : diff > 0 ? 'Excess' : 'Match';
}

function kg(value: number | null): string {
  return value === null ? t('inventory.noValue') : formatKg(value);
}

function signedKg(value: number | null): string {
  if (value === null) return t('inventory.noValue');
  return `${value > 0 ? '+' : ''}${formatKg(value)}`;
}

/** Grams from typed kg, or null when nothing valid (or nothing above zero) was typed. */
function positiveGrams(input: string): number | null {
  const value = parseKgToGrams(input);
  return value !== null && value > 0 ? value : null;
}

/* ─── Main Wizard Component ─── */
export function GoodsReceivingWizardScreen({
  scope,
  can,
  onBack,
  initialStep,
  shipment: ship,
  pendingReceipt,
  storageLocations = [],
  storageLocationsLoading = false,
  writes,
  receiverName,
  onFinish,
  onBackToShipments,
  onViewBatch,
  onViewReceipt,
  onViewHistory,
}: GoodsReceivingWizardScreenProps) {
  const canRecord = can(RECEIVING_CODES.receiptRecord);
  const canQc = can(RECEIVING_CODES.qualityCheck);
  const canReject = can(RECEIVING_CODES.rejectIncoming);
  const canBatch = can(RECEIVING_CODES.batchAssign);
  const canCounter = can(RECEIVING_CODES.counterOffer);
  const canViewBatch = can(RECEIVING_CODES.batchView);

  const isAllowed = (step: ReceivingWizardStep): boolean => {
    if (STEPS_WITHOUT_API.has(step)) return false;
    switch (step) {
      case 'quality_check':
      case 'grade_verification':
      case 'receiving_decision':
        return canRecord && canQc;
      case 'partial_acceptance':
        return canRecord && canQc && canReject;
      case 'batch_assignment':
        return canRecord && canQc && canBatch;
      case 'counter_offer':
        return canRecord && canCounter;
      default:
        return canRecord;
    }
  };

  /** Follow the fallback chain past steps the admin may not perform; a step with no API restarts. */
  const resolveStep = (step: ReceivingWizardStep): ReceivingWizardStep => {
    let s: ReceivingWizardStep = STEPS_WITHOUT_API.has(step) ? 'start_receiving' : step;
    for (let i = 0; i < 4 && !isAllowed(s); i += 1) {
      const next = STEP_FALLBACK[s];
      if (!next) break;
      s = next;
    }
    return s;
  };

  const stages: StepperStage[] = [
    'Shipment',
    'Quantity',
    ...(canQc ? (['Quality', 'Grade', 'Decision'] as const) : []),
    'Summary',
    ...(canQc && canBatch ? (['Batch'] as const) : []),
  ];
  const stepper = (stage: StepperStage) => <StepperHeader labels={stages} current={stages.indexOf(stage)} />;

  /** The step to open on. The result, error and counter-offer steps need a submit first, so a host cannot open them. */
  const resolveInitial = (step: ReceivingWizardStep): ReceivingWizardStep =>
    step === 'receipt_confirmation' || step === 'submission_error' || step === 'counter_offer'
      ? resolveStep('start_receiving')
      : resolveStep(step);

  const [currentStep, setCurrentStep] = useState<ReceivingWizardStep>(() => resolveInitial(initialStep));
  const [history, setHistory] = useState<ReceivingWizardStep[]>(() => [resolveInitial(initialStep)]);

  useEffect(() => {
    const first = resolveInitial(initialStep);
    setCurrentStep(first);
    setHistory([first]);
    // Reset only when the host opens a different step (as before); `can` is stable per session.
  }, [initialStep]);

  const goToStep = (target: ReceivingWizardStep) => {
    const step = resolveStep(target);
    setHistory(prev => [...prev, step]);
    setCurrentStep(step);
  };

  /** Replace the whole history: after a submit there is no going back into the form. */
  const resetToStep = (step: ReceivingWizardStep) => {
    setHistory([step]);
    setCurrentStep(step);
  };

  // Order facts (the purchase order; no warehouse is named in this file)
  const receiptCode = ship.code;
  const expectedProduct = ship.produce;
  const expectedGrade = ship.grade;
  const sourceName = ship.from;
  /** Destination: the Sub scope's own warehouse, or the order's for Main (all warehouses). */
  const destinationName = scope.warehouseName ?? ship.to;
  /** BR-30: a Sub scope always records into its own warehouse uuid. */
  const warehouseId = receivingWarehouseFilter(scope, ship.warehouseId) ?? ship.warehouseId;
  const expectedGrams = ship.expectedGrams;

  // Start Receiving
  const [arrivalConfirmed, setArrivalConfirmed] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState(pendingReceipt?.vehicleNumber ?? '');

  // Quantity: the gross weight is typed once; a resumed receipt keeps its recorded gross.
  const resumedGross = pendingReceipt === undefined ? null : parseKgToGrams(pendingReceipt.grossQtyKg);
  const [grossInput, setGrossInput] = useState('');
  const grossGrams = pendingReceipt === undefined ? positiveGrams(grossInput) : resumedGross;

  // Quality check
  const [qcStatusMap, setQcStatusMap] = useState<Record<QcCriterionId, QcResult>>(ALL_PASS);
  const qcIssueCount = QC_CRITERIA.filter(c => qcStatusMap[c.id] !== 'pass').length;
  const [moisturePct, setMoisturePct] = useState('');
  const [visualScore, setVisualScore] = useState('');
  const [defectNotes, setDefectNotes] = useState('');

  // Grade
  const [assignedGrade, setAssignedGrade] = useState<Grade>(ship.apiGrade ?? 'GRADE_1');
  const actualGrade = gradeLabel(assignedGrade);
  const gradeMatches = ship.apiGrade === undefined || assignedGrade === ship.apiGrade;

  // Decision: accepted is chosen; rejected is always received - accepted.
  const [acceptedGrams, setAcceptedGrams] = useState<number | null>(null);
  const [acceptedInput, setAcceptedInput] = useState('');
  const rejectedGrams = grossGrams !== null && acceptedGrams !== null ? grossGrams - acceptedGrams : null;
  const partialValid =
    grossGrams !== null && acceptedGrams !== null && acceptedGrams > 0 && acceptedGrams < grossGrams;
  const outcomeLabel =
    acceptedGrams === null || rejectedGrams === null
      ? t('inventory.noValue')
      : acceptedGrams === 0
        ? 'Reject'
        : rejectedGrams === 0
          ? 'Accept'
          : 'Partial Accept';

  const setAcceptedFromInput = (text: string) => {
    setAcceptedInput(text);
    setAcceptedGrams(parseKgToGrams(text));
  };

  const shipmentLines: ShipmentLineItem[] = [{ product: expectedProduct, expectedGrams, receivedGrams: grossGrams }];

  // Storage location (free text on the batch; the quality check sends its code)
  const [selectedLocationCode, setSelectedLocationCode] = useState<string | undefined>(undefined);

  // Submission: one key ring and one resumable state for the life of the wizard.
  const keyRing = useRef(createReceivingKeyRing()).current;
  const [submission, setSubmission] = useState<SubmissionState>(() =>
    initialSubmissionState(ship.receiptIds, pendingReceipt),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ error: unknown; stage: SubmissionStage } | null>(null);
  const [result, setResult] = useState<{ receipt: GoodsReceiptDto; qc: QualityCheckResultDto | null } | null>(null);

  const qcDraft: QcDraft = {
    assignedGrade,
    grossGrams,
    acceptedGrams,
    checklist: qcStatusMap,
    moisturePct,
    visualScore,
    defectNotes,
    storageLocation: selectedLocationCode,
  };
  const draftProblem = canQc ? qcDraftProblem(qcDraft) : grossGrams === null ? 'quantities' : null;

  // A ref, not only state: a second tap in the same frame must not start a second submit.
  const submittingRef = useRef(false);
  /**
   * Once a create was sent (or may have landed), the gross is fixed: a retry
   * must send the same body so the re-read can recognise the receipt it made.
   */
  const grossLocked = pendingReceipt !== undefined || submission.receipt !== null || submission.createUnknown;

  const handleConfirmGoodsReceipt = async () => {
    if (submittingRef.current || draftProblem !== null || grossGrams === null) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    const createBody = buildGoodsReceiptBody({ purchaseOrderId: ship.purchaseOrderId, warehouseId, grossGrams, vehicleNumber });
    const qcBody = canQc ? buildQualityCheckBody(qcDraft) : null;
    const outcome = await submitReceiving(
      submission,
      { purchaseOrderId: ship.purchaseOrderId, createBody, qcBody },
      {
        createReceipt: body => writes.createReceipt(body, keyRing.createKey(body)),
        receiptsOfPurchaseOrder: writes.receiptsOfPurchaseOrder,
        getReceipt: writes.getReceipt,
        recordQualityCheck: (id, body) => writes.recordQualityCheck(id, body, keyRing.qcKey(id, body)),
      },
    );
    setSubmission(outcome.state);
    submittingRef.current = false;
    setIsSubmitting(false);
    if (outcome.kind === 'done') {
      setSubmitError(null);
      setResult({ receipt: outcome.receipt, qc: outcome.qc });
      resetToStep('receipt_confirmation');
    } else {
      setSubmitError({ error: outcome.error, stage: outcome.stage });
      goToStep('submission_error');
    }
  };

  /* Navigation handler based on back button: pops exactly ONE screen */
  const handleBack = () => {
    if (currentStep === 'receipt_confirmation' && result !== null) {
      (onFinish ?? onBack)();
    } else if (history.length > 1) {
      const nextHistory = history.slice(0, -1);
      const prevStep = nextHistory[nextHistory.length - 1];
      setHistory(nextHistory);
      if (prevStep) {
        setCurrentStep(prevStep);
      }
    } else {
      onBack();
    }
  };

  /** Summary -> Batch & Storage when allowed and something was accepted, else submit straight away. */
  const handleSummaryConfirm = () => {
    if (isAllowed('batch_assignment') && (acceptedGrams ?? 0) > 0) goToStep('batch_assignment');
    else void handleConfirmGoodsReceipt();
  };

  const pickFrom = (title: string, options: readonly { label: string; onPick: () => void }[]) => {
    Alert.alert(title, undefined, [
      ...options.map(o => ({ text: o.label, onPress: o.onPick })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  // Counter-offer (after the receipt exists; inventory.quality.counter_offer)
  const [counterPrice, setCounterPrice] = useState('');
  const [counterReason, setCounterReason] = useState('');
  const [counterSending, setCounterSending] = useState(false);
  const [counterError, setCounterError] = useState<unknown>(null);
  const [counterSent, setCounterSent] = useState<CounterOfferDto | null>(null);
  const recordedReceipt = result?.receipt ?? null;
  /** The lot the offer is about: the accepted weight, or the recorded one before a quality check. */
  const counterQuantityGrams =
    result?.qc?.qualityCheck.acceptedQtyKg !== undefined
      ? parseKgToGrams(result.qc.qualityCheck.acceptedQtyKg)
      : acceptedGrams ?? grossGrams;
  const counterBody =
    counterQuantityGrams === null
      ? null
      : buildCounterOfferBody({ priceInput: counterPrice, quantityGrams: counterQuantityGrams, message: counterReason });
  const canOfferCounter = canCounter && recordedReceipt !== null && (counterQuantityGrams ?? 0) > 0;

  const sendCounterOffer = async () => {
    if (recordedReceipt === null || counterBody === null || counterSending) return;
    setCounterSending(true);
    setCounterError(null);
    try {
      const offer = await writes.createCounterOffer(
        recordedReceipt.id,
        counterBody,
        keyRing.counterKey(recordedReceipt.id, counterBody),
      );
      setCounterSent(offer);
    } catch (error) {
      setCounterError(error);
    } finally {
      setCounterSending(false);
    }
  };

  /** QC summary rows from the recorded results. */
  const qcSummaryRows = (results: Record<QcCriterionId, QcResult>) =>
    QC_CRITERIA.map((crit, idx) => {
      const r = results[crit.id];
      return (
        <View
          key={crit.id}
          style={[styles.qcSummaryRow, idx === QC_CRITERIA.length - 1 && { borderBottomWidth: 0 }]}
        >
          <Text style={styles.qcSummaryLabel}>{crit.title}</Text>
          {r === 'pass' ? (
            <CheckmarkCircleOutlineIcon color={adminColors.success.text} size={18} />
          ) : r === 'fail' ? (
            <CrossCircleIcon color={adminColors.danger.text} size={18} />
          ) : (
            <WarningTriangleIcon color={adminColors.warning.text} size={16} />
          )}
        </View>
      );
    });

  const header = (title: string, sub?: string) => (
    <>
      <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <BackArrowIcon />
        </TouchableOpacity>
        {sub === undefined ? (
          <Text style={styles.headerTitle}>{title}</Text>
        ) : (
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSub}>{sub}</Text>
          </View>
        )}
      </View>
    </>
  );

  const decisionTable = (accepted: number | null, rejected: number | null) => (
    <View style={styles.decisionTableCard}>
      <View style={styles.decisionTableRow}>
        <Text style={styles.decisionTableLabel}>Expected</Text>
        <Text style={styles.decisionTableValue}>{kg(expectedGrams)}</Text>
      </View>
      <View style={styles.decisionTableRow}>
        <Text style={styles.decisionTableLabel}>Received</Text>
        <Text style={styles.decisionTableValue}>{kg(grossGrams)}</Text>
      </View>
      <View style={styles.decisionTableRow}>
        <Text style={styles.decisionTableLabel}>Accepted</Text>
        <Text style={[styles.decisionTableValue, styles.valueSuccess]}>{kg(accepted)}</Text>
      </View>
      <View style={[styles.decisionTableRow, { borderBottomWidth: 0 }]}>
        <Text style={styles.decisionTableLabel}>Rejected</Text>
        <Text style={[styles.decisionTableValue, styles.valueDanger]}>{kg(rejected)}</Text>
      </View>
    </View>
  );

  /* ──────────────────────────────────────────────────────────
     No permission for this step (every gate failed its fallback)
     ────────────────────────────────────────────────────────── */
  if (!isAllowed(currentStep) && currentStep !== 'receipt_confirmation' && currentStep !== 'submission_error') {
    return (
      <View style={styles.container}>
        {header('Goods Receiving')}
        <View style={styles.scrollContent}>
          <PermissionNote message="You do not have permission to record goods receipts." />
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 1: Start Receiving
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'start_receiving') {
    return (
      <View style={styles.container}>
        {header('Start Receiving')}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {stepper('Shipment')}

          <View style={styles.whiteCard}>
            <Text style={styles.subtleLabel}>You're receiving</Text>
            <Text style={styles.boldReceiptCode}>{receiptCode}</Text>

            <View style={styles.produceInnerCard}>
              <View>
                <Text style={styles.produceTitle}>{expectedProduct}</Text>
                <Text style={styles.produceSub}>{expectedGrade}</Text>
              </View>
              <Text style={styles.produceExpQty}>{t('receiving.wizard.expectedQty', { qty: kg(expectedGrams) })}</Text>
            </View>
          </View>

          {pendingReceipt !== undefined ? (
            <NoticeBox text={t('receiving.wizard.resumeNotice', { grn: pendingReceipt.grnNumber })} />
          ) : null}

          {/* Absorbed StartReceivingScreen: shipment confirmation + receiver information */}
          <Text style={styles.sectionHeader}>Shipment Confirmation</Text>
          <View style={styles.whiteCard}>
            <View style={styles.summaryMetaGrid}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Source</Text>
                <Text style={styles.summaryMetaVal}>{sourceName === '' ? t('inventory.noValue') : sourceName}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Destination</Text>
                <Text style={styles.summaryMetaVal}>{destinationName}</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Expected Product</Text>
                <Text style={styles.summaryMetaVal}>{expectedProduct}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Expected Qty</Text>
                <Text style={styles.summaryMetaVal}>{kg(expectedGrams)}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Receiver Information</Text>
          <View style={styles.whiteCard}>
            <View style={styles.summaryMetaGrid}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Receiver</Text>
                <Text style={styles.summaryMetaVal}>{receiverName ?? '—'}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Warehouse</Text>
                <Text style={styles.summaryMetaVal}>{destinationName}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setArrivalConfirmed(prev => !prev)}
            activeOpacity={0.7}
          >
            <CheckboxSquareIcon checked={arrivalConfirmed} />
            <Text style={styles.checkboxText}>
              I confirm that the physical shipment has arrived and I am starting the receiving inspection.
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionHeader}>Physical Information</Text>
          <Text style={styles.inputLabel}>{t('receiving.wizard.vehicleLabel')}</Text>
          <TextInput
            style={styles.textInput}
            value={vehicleNumber}
            onChangeText={text => setVehicleNumber(text.toUpperCase())}
            editable={!grossLocked}
            autoCapitalize="characters"
            maxLength={20}
            placeholderTextColor={adminColors.placeholder}
          />

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            onPress={() => goToStep('quantity_verification')}
          >
            <Text style={styles.primaryCtaText}>Continue to Quantity Check  →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 2: Quantity Verification
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'quantity_verification') {
    const difference = grossGrams !== null && expectedGrams !== null ? grossGrams - expectedGrams : null;
    return (
      <View style={styles.container}>
        {header('Quantity Verification')}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {stepper('Quantity')}

          <Text style={styles.inputLabel}>{t('receiving.wizard.grossLabel')}</Text>
          {pendingReceipt === undefined ? (
            <TextInput
              style={[styles.textInput, grossLocked && styles.readOnlyInput]}
              editable={!grossLocked}
              value={grossInput}
              onChangeText={setGrossInput}
              keyboardType="decimal-pad"
              placeholder="0.000"
              placeholderTextColor={adminColors.placeholder}
            />
          ) : (
            <View style={[styles.textInput, styles.readOnlyInput]}>
              <Text style={styles.readOnlyValue}>
                {t('receiving.wizard.grossLocked', { qty: kg(grossGrams), grn: pendingReceipt.grnNumber })}
              </Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{kg(expectedGrams)}</Text>
              <Text style={styles.statTileLabel}>EXPECTED</Text>
            </View>

            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{kg(grossGrams)}</Text>
              <Text style={styles.statTileLabel}>RECEIVED</Text>
            </View>

            <View style={styles.statTile}>
              <Text style={[styles.statTileNumber, difference !== null && difference !== 0 && styles.valueDanger]}>
                {signedKg(difference)}
              </Text>
              <Text style={styles.statTileLabel}>DIFFERENCE</Text>
            </View>
          </View>

          {/* Absorbed QuantityVerificationScreen: one row per product line with its status */}
          <Text style={styles.sectionHeader}>Items on this Shipment</Text>
          {shipmentLines.map(line => {
            const status = lineStatus(line);
            const tone =
              status === 'Shortage' ? adminColors.warning : status === 'Excess' ? adminColors.info : adminColors.success;
            const diff =
              line.receivedGrams !== null && line.expectedGrams !== null ? line.receivedGrams - line.expectedGrams : null;
            return (
              <View key={line.product} style={styles.shipmentItemCard}>
                <View style={styles.shipmentItemTopRow}>
                  <Text style={styles.shipmentItemTitle}>{line.product}</Text>
                  {line.receivedGrams !== null ? (
                    <View style={[styles.redBadgePill, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.redBadgeText, { color: tone.text }]}>
                        {status === 'Match' ? status : `${status} ${signedKg(diff)}`}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.shipmentItemDesc}>
                  Expected <Text style={styles.inlineStrong}>{kg(line.expectedGrams)}</Text> · Received <Text style={styles.inlineStrong}>{kg(line.receivedGrams)}</Text>
                </Text>
              </View>
            );
          })}

          <NoticeBox text="Difference is always calculated as Received - Expected — the user never types the difference directly." />

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.primaryCtaBtn, grossGrams === null && styles.primaryCtaBtnDisabled]}
            activeOpacity={0.85}
            disabled={grossGrams === null}
            onPress={() => goToStep(canQc ? 'quality_check' : 'receipt_summary')}
          >
            <Text style={styles.primaryCtaText}>
              {canQc ? 'Continue to Quality Check  →' : t('receiving.wizard.continueToSummary')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 3: Quality Check (the five rows the server records, plus moisture,
     visual score and defect notes)
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'quality_check') {
    return (
      <View style={styles.container}>
        {header('Quality Check', `${expectedProduct} · ${expectedGrade} · ${t('receiving.wizard.receivedQty', { qty: kg(grossGrams) })}`)}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {stepper('Quality')}

          {/* Absorbed QualityCheckScreen: product card with issue badge + configured-scale notice */}
          <View style={styles.qcProductCard}>
            <View style={styles.qcProductText}>
              <Text style={styles.shipmentItemTitle}>{expectedProduct}</Text>
              <Text style={styles.shipmentItemDesc}>{t('receiving.wizard.receivedQty', { qty: kg(grossGrams) })}</Text>
            </View>
            <View
              style={[
                styles.redBadgePill,
                { backgroundColor: qcIssueCount > 0 ? adminColors.warning.bg : adminColors.success.bg },
              ]}
            >
              <Text
                style={[
                  styles.redBadgeText,
                  { color: qcIssueCount > 0 ? adminColors.warning.text : adminColors.success.text },
                ]}
              >
                {qcIssueCount > 0 ? 'Issue' : 'OK'}
              </Text>
            </View>
          </View>
          <NoticeBox text="Freshness and condition scales use configured backend values only — no invented numerical scoring system." />

          {QC_CRITERIA.map(crit => {
            const currentVal = qcStatusMap[crit.id];

            return (
              <View key={crit.id} style={styles.criteriaCard}>
                <View style={styles.criteriaHeader}>
                  <View style={styles.criteriaIconWrap}>
                    <QcCriterionIcon icon={crit.icon} />
                  </View>
                  <View style={styles.criteriaTextWrap}>
                    <Text style={styles.criteriaCode}>{crit.code}</Text>
                    <Text style={styles.criteriaTitle}>{crit.title}</Text>
                  </View>
                </View>

                <View style={styles.choiceRow}>
                  <TouchableOpacity
                    style={[styles.choiceBtn, currentVal === 'pass' && styles.choiceBtnPassActive]}
                    onPress={() => setQcStatusMap(prev => ({ ...prev, [crit.id]: 'pass' }))}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.choiceBtnText, currentVal === 'pass' && styles.choiceBtnPassTextActive]}>Pass</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.choiceBtn, currentVal === 'attention' && styles.choiceBtnAttentionActive]}
                    onPress={() => setQcStatusMap(prev => ({ ...prev, [crit.id]: 'attention' }))}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.choiceBtnText, currentVal === 'attention' && styles.choiceBtnAttentionTextActive]}>Needs Attention</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.choiceBtn, currentVal === 'fail' && styles.choiceBtnFailActive]}
                    onPress={() => setQcStatusMap(prev => ({ ...prev, [crit.id]: 'fail' }))}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.choiceBtnText, currentVal === 'fail' && styles.choiceBtnFailTextActive]}>Fail</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          <View style={styles.rowTwoCols}>
            <View style={styles.colHalf}>
              <Text style={styles.inputLabel}>{t('receiving.wizard.moistureLabel')}</Text>
              <TextInput
                style={styles.textInput}
                value={moisturePct}
                onChangeText={setMoisturePct}
                keyboardType="decimal-pad"
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.inputLabel}>{t('receiving.wizard.visualScoreLabel')}</Text>
              <TextInput
                style={styles.textInput}
                value={visualScore}
                onChangeText={setVisualScore}
                keyboardType="number-pad"
                maxLength={2}
                placeholderTextColor={adminColors.placeholder}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>{t('receiving.wizard.defectNotesLabel')}</Text>
          <TextInput
            style={styles.describeIssueInput}
            multiline
            numberOfLines={3}
            maxLength={500}
            value={defectNotes}
            onChangeText={setDefectNotes}
            placeholderTextColor={adminColors.placeholder}
          />

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            onPress={() => goToStep('grade_verification')}
          >
            <View style={styles.ctaRow}>
              <Text style={styles.primaryCtaText}>{t('receiving.wizard.continueToGrade')}</Text>
              <RightArrowIcon color={adminColors.onBrand} size={18} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 3B: Grade Verification. The product cannot change on a receipt;
     the assigned grade may differ from the listed one. Match is DERIVED.
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'grade_verification') {
    return (
      <View style={styles.container}>
        {header('Grade & Product Verification', receiptCode)}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {stepper('Grade')}

          <View style={styles.whiteCard}>
            <View style={styles.summaryMetaGrid}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Expected Product</Text>
                <Text style={styles.summaryMetaVal}>{expectedProduct}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Expected Grade</Text>
                <Text style={styles.summaryMetaVal}>{expectedGrade === '' ? t('inventory.noValue') : expectedGrade}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.inputLabel}>Actual Grade</Text>
          <TouchableOpacity
            style={styles.dropdownSelectBox}
            activeOpacity={0.7}
            onPress={() =>
              pickFrom(
                'Actual Grade',
                GRADES.map(grade => ({ label: gradeLabel(grade), onPick: () => setAssignedGrade(grade) })),
              )
            }
          >
            <Text style={styles.dropdownValue}>{actualGrade}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>

          <View style={styles.matchChipRow}>
            <View style={[styles.matchChip, { backgroundColor: gradeMatches ? adminColors.success.bg : adminColors.danger.bg }]}>
              <Text style={[styles.matchChipText, { color: gradeMatches ? adminColors.success.text : adminColors.danger.text }]}>
                Grade {gradeMatches ? 'Match' : 'Mismatch'}
              </Text>
            </View>
          </View>

          <NoticeBox text={t('receiving.wizard.gradeNotice')} />

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            onPress={() => goToStep('receiving_decision')}
          >
            <View style={styles.ctaRow}>
              <RightArrowIcon color={adminColors.onBrand} size={18} />
              <Text style={styles.primaryCtaText}>Continue to Decision</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 4: Receiving Decision
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'receiving_decision') {
    return (
      <View style={styles.container}>
        {header('Receiving Decision')}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {stepper('Decision')}

          {decisionTable(acceptedGrams, rejectedGrams)}

          {/* Absorbed AcceptanceDecisionScreen notice */}
          <NoticeBox text="Only three documented outcomes exist: Accept, Partial Accept, Reject — no additional business outcome is invented." />

          <Text style={styles.sectionHeader}>Choose an Outcome</Text>

          {/* Outcome 1: Accept */}
          <TouchableOpacity
            style={styles.outcomeAcceptCard}
            activeOpacity={0.8}
            onPress={() => {
              setAcceptedGrams(grossGrams);
              goToStep('receipt_summary');
            }}
          >
            <View style={styles.outcomeIconBoxGreen}>
              <CheckmarkCircleOutlineIcon color={adminColors.success.text} size={24} />
            </View>
            <View style={styles.outcomeTextBox}>
              <Text style={styles.outcomeAcceptTitle}>Accept</Text>
              <Text style={styles.outcomeAcceptSub}>{t('receiving.wizard.acceptAll', { qty: kg(grossGrams) })}</Text>
            </View>
          </TouchableOpacity>

          {/* Outcome 2: Partial Accept (rejects part of the goods: inventory.produce.reject_incoming) */}
          {canReject && (
          <TouchableOpacity
            style={styles.outcomePartialCard}
            activeOpacity={0.8}
            onPress={() => {
              setAcceptedInput('');
              setAcceptedGrams(null);
              goToStep('partial_acceptance');
            }}
          >
            <View style={styles.outcomeIconBoxAmber}>
              <NotEqualIcon color={adminColors.warning.text} size={22} />
            </View>
            <View style={styles.outcomeTextBox}>
              <Text style={styles.outcomePartialTitle}>Partial Accept</Text>
              <Text style={styles.outcomePartialSub}>{t('receiving.wizard.partialHint')}</Text>
            </View>
          </TouchableOpacity>
          )}

          {/* Outcome 3: Reject (inventory.produce.reject_incoming) */}
          {canReject && (
          <TouchableOpacity
            style={styles.outcomeRejectCard}
            activeOpacity={0.8}
            onPress={() => {
              setAcceptedGrams(0);
              goToStep('receipt_summary');
            }}
          >
            <View style={styles.outcomeIconBoxRed}>
              <CrossCircleIcon color={adminColors.danger.text} size={24} />
            </View>
            <View style={styles.outcomeTextBox}>
              <Text style={styles.outcomeRejectTitle}>Reject</Text>
              <Text style={styles.outcomeRejectSub}>{t('receiving.wizard.rejectAll', { qty: kg(grossGrams) })}</Text>
            </View>
          </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 4C: Quality Counter-Offer (inventory.quality.counter_offer)
     POST /admin/goods-receipts/{id}/counter-offer, once the receipt exists.
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'counter_offer') {
    return (
      <View style={styles.container}>
        {header('Quality Counter-Offer', recordedReceipt?.grnNumber ?? receiptCode)}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.whiteCard}>
            <View style={styles.summaryMetaGrid}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Product</Text>
                <Text style={styles.summaryMetaVal}>{expectedProduct}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Grade (actual)</Text>
                <Text style={styles.summaryMetaVal}>{actualGrade}</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Accepted Quantity</Text>
                <Text style={styles.summaryMetaVal}>{kg(counterQuantityGrams)}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>QC Issues</Text>
                <Text style={styles.summaryMetaVal}>{canQc ? `${qcIssueCount} of ${QC_CRITERIA.length}` : '—'}</Text>
              </View>
            </View>
          </View>

          <NoticeBox text="A counter-offer proposes a revised price for the quality found at receipt. The farmer's response window comes from system configuration and is enforced by the server." />

          {counterSent !== null ? (
            <NoticeBox
              text={t('receiving.wizard.counterSent', {
                round: String(counterSent.round),
                expires: formatAdminDate(counterSent.expiresAt, new Date()),
              })}
            />
          ) : (
            <>
              <Text style={styles.inputLabel}>Revised Price per KG (₹)</Text>
              <TextInput
                style={[styles.textInput, { marginBottom: adminSpacing.lg }]}
                value={counterPrice}
                onChangeText={text => setCounterPrice(text.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={adminColors.placeholder}
                editable={!counterSending}
              />

              <Text style={styles.inputLabel}>Reason</Text>
              <TextInput
                style={styles.describeIssueInput}
                placeholder="Quality found at receipt..."
                placeholderTextColor={adminColors.placeholder}
                multiline
                numberOfLines={3}
                maxLength={500}
                value={counterReason}
                onChangeText={setCounterReason}
                editable={!counterSending}
              />
              {counterError !== null ? <Text style={styles.problemText}>{t(adminErrorKey(counterError))}</Text> : null}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          {counterSent !== null ? (
            <TouchableOpacity style={styles.primaryCtaBtn} activeOpacity={0.85} onPress={handleBack}>
              <Text style={styles.primaryCtaText}>{t('receiving.wizard.done')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryCtaBtn, (counterBody === null || counterSending) && styles.primaryCtaBtnDisabled]}
              activeOpacity={0.85}
              disabled={counterBody === null || counterSending}
              onPress={() => void sendCounterOffer()}
            >
              <View style={styles.ctaRow}>
                {counterSending ? (
                  <ActivityIndicator color={adminColors.onBrand} size="small" />
                ) : (
                  <>
                    <SendPaperAirplaneIcon />
                    <Text style={styles.primaryCtaText}>Send Counter-Offer</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 4B: Partial Acceptance (Sub-screen of Decision)
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'partial_acceptance') {
    return (
      <View style={styles.container}>
        {header('Partial Acceptance / Rejection', `${receiptCode} · Product-level decision`)}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 3 Metric Stat Tiles */}
          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{kg(grossGrams)}</Text>
              <Text style={styles.statTileLabel}>RECEIVED</Text>
            </View>

            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{kg(acceptedGrams)}</Text>
              <Text style={styles.statTileLabel}>ACCEPTED</Text>
            </View>

            <View style={styles.statTile}>
              <Text style={[styles.statTileNumber, styles.valueDanger]}>{kg(rejectedGrams)}</Text>
              <Text style={styles.statTileLabel}>REJECTED</Text>
            </View>
          </View>

          {/* Absorbed PartialAcceptanceScreen: accepted is entered, rejected is calculated */}
          <NoticeBox text="Validated automatically: Accepted + Rejected = Received for every product — the form never allows Accepted or Rejected to exceed Received." />
          <Text style={styles.sectionHeader}>Partial Acceptance Detail — {expectedProduct}</Text>
          <View style={styles.rowTwoCols}>
            <View style={styles.colHalf}>
              <Text style={styles.inputLabel}>Accepted Quantity (KG)</Text>
              <TextInput
                style={styles.textInput}
                value={acceptedInput}
                onChangeText={setAcceptedFromInput}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.inputLabel}>Rejected (calculated)</Text>
              <View style={[styles.textInput, styles.readOnlyInput]}>
                <Text style={styles.readOnlyValue}>{kg(rejectedGrams)}</Text>
              </View>
            </View>
          </View>
          {acceptedInput !== '' && !partialValid ? (
            <Text style={styles.problemText}>{t('receiving.wizard.partialInvalid')}</Text>
          ) : null}

          {/* The rejection is explained in the defect notes (the server needs a reason for any rejected weight). */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>{t('receiving.wizard.defectNotesLabel')}</Text>
            <Text style={styles.requiredTag}>Required</Text>
          </View>
          <TextInput
            style={styles.describeIssueInput}
            placeholder="Notes..."
            placeholderTextColor={adminColors.placeholder}
            multiline
            numberOfLines={3}
            maxLength={500}
            value={defectNotes}
            onChangeText={setDefectNotes}
          />

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.primaryCtaBtn, !partialValid && styles.primaryCtaBtnDisabled]}
            activeOpacity={0.85}
            disabled={!partialValid}
            onPress={() => goToStep('receipt_summary')}
          >
            <Text style={styles.primaryCtaText}>Continue to Summary  →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 5: Receipt Summary
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'receipt_summary') {
    const goesToBatch = isAllowed('batch_assignment') && (acceptedGrams ?? 0) > 0;
    const blocked = isSubmitting || draftProblem !== null;
    return (
      <View style={styles.container}>
        {header('Receipt Summary')}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {stepper('Summary')}

          {/* Receipt Metadata Card (+ absorbed GoodsReceiptSummaryScreen shipment id / date) */}
          <View style={styles.whiteCard}>
            <Text style={styles.summaryCardReceiptCode}>{pendingReceipt?.grnNumber ?? receiptCode}</Text>
            <View style={styles.summaryMetaGrid}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Shipment ID</Text>
                <Text style={styles.summaryMetaVal}>{receiptCode}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Date</Text>
                <Text style={styles.summaryMetaVal}>{formatAdminDay(pendingReceipt?.receivedAt ?? new Date())}</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Source</Text>
                <Text style={styles.summaryMetaVal}>{sourceName === '' ? t('inventory.noValue') : sourceName}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Destination</Text>
                <Text style={styles.summaryMetaVal}>{destinationName}</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Product</Text>
                <Text style={styles.summaryMetaVal}>{expectedProduct}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Grade</Text>
                <Text style={styles.summaryMetaVal}>{canQc ? actualGrade : expectedGrade}</Text>
              </View>
            </View>
          </View>

          {canQc && (
            <>
              <Text style={styles.sectionHeader}>Decision</Text>
              <View style={styles.decisionOutcomeCard}>
                <Text style={styles.decisionOutcomeText}>{outcomeLabel.toUpperCase()}</Text>
              </View>
            </>
          )}

          {decisionTable(canQc ? acceptedGrams : null, canQc ? rejectedGrams : null)}

          {/* QC Summary Checklist (from the recorded results; inventory.quality_check.perform) */}
          {canQc && (
            <>
              <Text style={styles.sectionHeader}>QC Summary</Text>
              <View style={styles.qcSummaryCard}>{qcSummaryRows(qcStatusMap)}</View>

              <Text style={styles.sectionHeader}>Issues</Text>
              <View style={styles.issuesCard}>
                <View style={styles.issuesIconCircle}>
                  <AlertCircleOutlineIcon color={adminColors.danger.text} size={18} />
                </View>
                <View style={styles.issuesTextBox}>
                  <Text style={styles.issuesTitle}>
                    {(rejectedGrams ?? 0) > 0 ? t('receiving.wizard.rejectedQty', { qty: kg(rejectedGrams) }) : 'No items rejected'}
                  </Text>
                  {(rejectedGrams ?? 0) === 0 && defectNotes.trim() !== '' ? (
                    <Text style={styles.issuesSub}>{defectNotes.trim()}</Text>
                  ) : null}
                </View>
              </View>

              {/* A rejection needs a reason (the server refuses one without), so it can be given or edited here. */}
              {(rejectedGrams ?? 0) > 0 ? (
                <>
                  <Text style={styles.inputLabel}>{t('receiving.wizard.defectNotesLabel')}</Text>
                  <TextInput
                    style={styles.describeIssueInput}
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                    value={defectNotes}
                    onChangeText={setDefectNotes}
                    placeholderTextColor={adminColors.placeholder}
                  />
                </>
              ) : null}
            </>
          )}

          {!canQc ? <NoticeBox text={t('receiving.wizard.noQcPermission')} /> : null}

          {onViewHistory ? (
            <>
              <Text style={styles.sectionHeader}>Next Steps</Text>
              <View style={styles.actionGridRow}>
                <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={onViewHistory}>
                  <ReceiptPaperIcon color={adminColors.brand} size={18} />
                  <Text style={styles.actionCardText}>Activity</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}

          {draftProblem !== null ? <Text style={styles.problemText}>{t(QC_DRAFT_PROBLEM_MESSAGE[draftProblem])}</Text> : null}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.primaryCtaBtn, blocked && styles.primaryCtaBtnDisabled]}
            activeOpacity={0.85}
            disabled={blocked}
            onPress={handleSummaryConfirm}
          >
            <View style={styles.ctaRow}>
              {isSubmitting ? (
                <ActivityIndicator color={adminColors.onBrand} size="small" />
              ) : goesToBatch ? (
                <>
                  <QrCodeIcon color={adminColors.onBrand} size={20} />
                  <Text style={styles.primaryCtaText}>Assign Batch & Storage</Text>
                </>
              ) : (
                <>
                  <CheckmarkCircleOutlineIcon color={adminColors.onBrand} size={20} />
                  <Text style={styles.primaryCtaText}>Confirm Goods Receipt</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 5B: Batch & Storage: the storage location the accepted lot goes to.
     Gate: inventory.batch.assign. Without it the summary submits directly.
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'batch_assignment') {
    return (
      <View style={styles.container}>
        {header('Batch Assignment', receiptCode)}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {stepper('Batch')}

          <NoticeBox text="Acceptance creates an inventory batch with warehouse, crop, grade, source reference, and storage information, plus a RECEIPT ledger movement — never a manual balance edit." />

          <Text style={styles.sectionHeader}>Batch Information</Text>
          <View style={styles.whiteCard}>
            <View style={styles.summaryMetaGrid}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Goods Receipt</Text>
                <Text style={styles.summaryMetaVal}>{pendingReceipt?.grnNumber ?? t('inventory.noValue')}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Warehouse</Text>
                <Text style={styles.summaryMetaVal}>{destinationName}</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Product</Text>
                <Text style={styles.summaryMetaVal}>{expectedProduct}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Grade</Text>
                <Text style={styles.summaryMetaVal}>{actualGrade} (actual)</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Accepted Quantity</Text>
                <Text style={styles.summaryMetaVal}>{kg(acceptedGrams)}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Unit</Text>
                <Text style={styles.summaryMetaVal}>KG</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Storage Bay</Text>
          {storageLocationsLoading ? (
            <ActivityIndicator color={adminColors.brand} />
          ) : storageLocations.length === 0 ? (
            <NoticeBox text={t('receiving.wizard.storageEmpty')} />
          ) : (
            <View style={styles.issueTypeListCard}>
              {storageLocations.map((bay, idx) => {
                const isSelected = bay.code === selectedLocationCode;
                return (
                  <TouchableOpacity
                    key={bay.id}
                    style={[styles.issueTypeRow, idx === storageLocations.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => setSelectedLocationCode(isSelected ? undefined : bay.code)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.radioOuterCircle, isSelected && styles.radioOuterCircleSelected]}>
                      {isSelected && <View style={styles.radioInnerCircle} />}
                    </View>
                    <View style={styles.bayTextBox}>
                      <Text style={[styles.issueTypeText, isSelected && styles.issueTypeTextSelected]}>
                        {bay.zone === '' ? `${bay.label} · ${bay.code}` : `${bay.label} · ${bay.zone}`}
                      </Text>
                      {bay.capacityGrams !== null ? (
                        <Text style={styles.baySub}>{t('receiving.wizard.capacity', { qty: kg(bay.capacityGrams) })}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <NoticeBox text="Source farmer information is for internal traceability only and is never exposed in customer-facing product UI." />

          {draftProblem !== null ? <Text style={styles.problemText}>{t(QC_DRAFT_PROBLEM_MESSAGE[draftProblem])}</Text> : null}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.primaryCtaBtn, (isSubmitting || draftProblem !== null) && styles.primaryCtaBtnDisabled]}
            activeOpacity={0.85}
            disabled={isSubmitting || draftProblem !== null}
            onPress={() => void handleConfirmGoodsReceipt()}
          >
            <View style={styles.ctaRow}>
              {isSubmitting ? (
                <ActivityIndicator color={adminColors.onBrand} size="small" />
              ) : (
                <>
                  <CheckmarkCircleOutlineIcon color={adminColors.onBrand} size={20} />
                  <Text style={styles.primaryCtaText}>Confirm Goods Receipt</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 12: Receipt Confirmation: what the server recorded.
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'receipt_confirmation' && result !== null) {
    const qc = result.qc?.qualityCheck;
    const outcome = qc?.outcome ?? result.receipt.status;
    // The check's own figures; when the check landed but its answer was lost, the re-read receipt's.
    const checked = result.receipt.status !== 'AWAITING_QC';
    const acceptedKg = qc?.acceptedQtyKg ?? (checked ? result.receipt.acceptedQtyKg : undefined);
    const rejectedKg = qc?.rejectedQtyKg ?? (checked ? result.receipt.rejectedQtyKg : undefined);
    const accepted = acceptedKg === undefined ? null : parseKgToGrams(acceptedKg);
    const rejected = rejectedKg === undefined ? null : parseKgToGrams(rejectedKg);
    const batch = result.qc?.batch ?? null;
    const isFullReject = outcome === 'REJECTED';
    const isFullAccept = outcome === 'ACCEPTED';
    const isPartialAccept = outcome === 'PARTIALLY_ACCEPTED';
    const isRecordedOnly = !isFullReject && !isFullAccept && !isPartialAccept;
    const title = isFullReject
      ? 'Goods Receipt Completed'
      : isFullAccept
        ? 'Goods Received'
        : isPartialAccept
          ? 'Partially Accepted'
          : receiptResultLabel(receiptResultOf(result.receipt.status));

    return (
      <View style={styles.container}>
        {header('Receipt Confirmation')}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, styles.confirmationContent]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.confirmationCheckCircle,
              styles.confirmationBadge,
              { backgroundColor: isFullReject ? adminColors.danger.bg : adminColors.success.bg },
            ]}
          >
            {isFullReject ? (
              <CrossCircleIcon color={adminColors.danger.text} size={28} />
            ) : (
              <CheckmarkIcon color={adminColors.success.text} size={26} />
            )}
          </View>
          <Text style={styles.confirmationMainTitle}>{title}</Text>
          <Text style={styles.confirmationGrn}>{t('receiving.wizard.grn', { grn: result.receipt.grnNumber })}</Text>
          {isFullReject ? <Text style={styles.confirmationSub}>Full quantity rejected</Text> : null}
          {isRecordedOnly ? <Text style={styles.confirmationSub}>{t('receiving.wizard.recordedAwaitingQc')}</Text> : null}

          {decisionTable(accepted, rejected)}

          {isPartialAccept && qc?.defectNotes ? (
            <View style={styles.whiteCard}>
              <Text style={styles.confirmationCardLabel}>Reason</Text>
              <Text style={styles.confirmationCardValue}>{qc.defectNotes}</Text>
            </View>
          ) : null}

          {/* The batch, only when the API returns one (it returns none today). */}
          {batch !== null ? (
            <View style={[styles.whiteCard, styles.confirmationRow]}>
              <CrateInventoryIcon color={adminColors.warning.text} size={24} />
              <View style={styles.flex}>
                <Text style={styles.confirmationCardLabel}>{kg(accepted)}</Text>
                <Text style={styles.confirmationCardValue}>Batch Created · {batch.batchCode}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.confirmationActions}>
            {batch !== null && canViewBatch && onViewBatch ? (
              <TouchableOpacity
                style={[styles.actionPrimaryBtn, styles.confirmationActionBtn]}
                activeOpacity={0.85}
                onPress={() => onViewBatch(batch.id)}
              >
                <QrCodeIcon color={adminColors.onBrand} size={20} />
                <Text style={styles.actionPrimaryBtnText}>View Batch</Text>
              </TouchableOpacity>
            ) : null}

            {onViewReceipt ? (
              <TouchableOpacity
                style={[styles.actionPrimaryBtn, styles.confirmationActionBtn]}
                activeOpacity={0.85}
                onPress={() => onViewReceipt(result.receipt.id)}
              >
                <ReceiptPaperIcon color={adminColors.onBrand} size={20} />
                <Text style={styles.actionPrimaryBtnText}>View Receipt</Text>
              </TouchableOpacity>
            ) : null}

            {/* Quality counter-offer: an action on the recorded lot, not a fourth outcome */}
            {canOfferCounter && counterSent === null ? (
              <TouchableOpacity
                style={styles.outcomeCounterCard}
                activeOpacity={0.8}
                onPress={() => goToStep('counter_offer')}
              >
                <View style={styles.outcomeIconBoxAmber}>
                  <ReceiptPaperIcon color={adminColors.brand} size={22} />
                </View>
                <View style={styles.outcomeTextBox}>
                  <Text style={styles.outcomeCounterTitle}>Propose Counter-Offer</Text>
                  <Text style={styles.outcomeCounterSub}>Offer a revised price for the quality found at receipt</Text>
                </View>
                <ChevronRightSmall />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.actionSecondaryBtn, styles.confirmationActionBtn]}
              activeOpacity={0.8}
              onPress={() => {
                if (onBackToShipments) onBackToShipments();
                else (onFinish ?? onBack)();
              }}
            >
              <TruckDeliveryIcon color={adminColors.warning.text} size={20} />
              <Text style={[styles.actionSecondaryBtnText, styles.warningText]}>Back to Incoming Shipments</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 13: Submission Error: the server's reason, and a safe retry.
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'submission_error') {
    const unknown = submission.createUnknown || submission.qcUnknown;
    return (
      <View style={styles.container}>
        {header('Submission Error')}

        <View style={styles.errorBody}>
          <View style={[styles.confirmationCheckCircle, styles.errorBadge]}>
            <ErrorExclamationCircleIcon size={34} />
          </View>
          <Text style={styles.allChecksCompletedTitle}>Unable to Complete Receiving</Text>
          <Text style={styles.allChecksCompletedSub}>{t(adminErrorKey(submitError?.error))}</Text>
          {submission.receipt !== null ? (
            <Text style={styles.allChecksCompletedSub}>
              {t('receiving.wizard.receiptKept', { grn: submission.receipt.grnNumber })}
            </Text>
          ) : null}
          {unknown ? <Text style={styles.allChecksCompletedSub}>{t('receiving.wizard.unknownOutcome')}</Text> : null}
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.primaryCtaBtn, isSubmitting && styles.primaryCtaBtnDisabled]}
            activeOpacity={0.85}
            disabled={isSubmitting}
            onPress={() => void handleConfirmGoodsReceipt()}
          >
            <View style={styles.ctaRow}>
              {isSubmitting ? (
                <ActivityIndicator color={adminColors.onBrand} size="small" />
              ) : (
                <>
                  <RefreshRetryIcon />
                  <Text style={styles.primaryCtaText}>Retry</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}


/* ─── Stylesheet matching uploaded mockups ─── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...adminType.title,
    fontWeight: '700',
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  headerSub: {
    ...adminType.body,
    fontWeight: '500',
    color: adminColors.onBrand,
    marginTop: 2,
  },
  headerStatusBadge: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerStatusBadgeText: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.warning.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* Stepper */
  stepperCard: {
    ...adminShadow.sm,
    backgroundColor: adminColors.card,
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
  },
  stepperTrackContainer: {
    position: 'absolute',
    top: 15.5,
    left: 29,
    right: 29,
    height: 3,
    zIndex: 0,
  },
  stepperTrackBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: adminColors.border,
    borderRadius: 1.5,
  },
  stepperTrackProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
    backgroundColor: adminColors.success.text,
    borderRadius: 1.5,
  },
  stepItem: {
    alignItems: 'center',
    width: 65,
    zIndex: 1,
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleCurrent: {
    backgroundColor: adminColors.brand,
  },
  stepCircleDone: {
    backgroundColor: adminColors.success.text,
  },
  stepNumberText: {
    ...adminType.sectionHead,
    fontWeight: '700',
    color: adminColors.muted,
  },
  stepNumberTextCurrent: {
    color: adminColors.onBrand,
  },
  stepLabel: {
    ...adminType.rowMeta,
    fontWeight: '500',
    color: adminColors.muted,
    textAlign: 'center',
  },
  stepLabelDone: {
    color: adminColors.muted,
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: adminColors.brand,
    fontWeight: '700',
  },

  /* White Card */
  whiteCard: {
    ...adminShadow.sm,
    backgroundColor: adminColors.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  subtleLabel: {
    ...adminType.body,
    color: adminColors.muted,
    fontWeight: '500',
    marginBottom: 4,
  },
  boldReceiptCode: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 12,
  },
  produceInnerCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  produceTitle: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.ink,
  },
  produceSub: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 2,
  },
  produceExpQty: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.warning.text,
  },

  /* Sections */
  sectionHeader: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 8,
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  optionalTag: {
    ...adminType.body,
    color: adminColors.muted,
    fontWeight: '500',
  },
  requiredTag: {
    ...adminType.body,
    color: adminColors.muted,
    fontWeight: '500',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  colHalf: {
    flex: 1,
  },
  inputLabel: {
    ...adminType.sectionHead,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  textInput: {
    ...adminType.body,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontWeight: '600',
    color: adminColors.ink,
  },

  /* Dashed Add Box */
  dashedAddBox: {
    width: 88,
    height: 88,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dashedAddBoxText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
    marginTop: 6,
  },

  /* Quantity Verification */
  shortageBanner: {
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  shortageBannerText: {
    ...adminType.sectionHead,
    flex: 1,
    fontWeight: '700',
    color: adminColors.warning.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statTile: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  statTileNumber: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 4,
  },
  statTileLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
    letterSpacing: 0.5,
  },
  shipmentItemCard: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  shipmentItemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  shipmentItemTitle: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.ink,
  },
  redBadgePill: {
    backgroundColor: adminColors.danger.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  redBadgeText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.danger.text,
  },
  shipmentItemDesc: {
    ...adminType.body,
    color: adminColors.muted,
  },
  reportIssueBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  reportIssueBtnText: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.ink,
  },

  /* Quality Check */
  criteriaCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 12,
  },
  criteriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  criteriaIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: adminColors.warning.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  criteriaTextWrap: {
    flex: 1,
  },
  criteriaCode: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
    letterSpacing: 0.3,
  },
  criteriaTitle: {
    ...adminType.title,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 1,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBtnText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.muted,
  },
  choiceBtnPassActive: {
    backgroundColor: adminColors.success.bg,
    borderColor: adminColors.success.border,
    borderWidth: 1.5,
  },
  choiceBtnPassTextActive: {
    color: adminColors.success.text,
    fontWeight: '700',
  },
  choiceBtnAttentionActive: {
    backgroundColor: adminColors.card,
    borderColor: adminColors.warning.border,
    borderWidth: 1.5,
  },
  choiceBtnAttentionTextActive: {
    color: adminColors.warning.text,
    fontWeight: '700',
  },
  choiceBtnFailActive: {
    backgroundColor: adminColors.danger.bg,
    borderColor: adminColors.danger.border,
    borderWidth: 1.5,
  },
  choiceBtnFailTextActive: {
    color: adminColors.danger.text,
    fontWeight: '700',
  },
  qcPhotosRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  qcPhotoThumbnail: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  qcPhotoDeleteBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: adminColors.danger.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qcPhotoDeleteX: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '800',
    marginTop: -2,
  },
  qcPhotoAddBox: {
    width: 76,
    height: 76,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qcPhotoAddText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
    marginTop: 4,
  },
  qcNotesArea: {
    ...adminType.body,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 12,
    padding: 12,
    height: 80,
    color: adminColors.ink,
    textAlignVertical: 'top',
  },

  /* Decision Screen Styles */
  decisionTableCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  decisionTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  decisionTableLabel: {
    ...adminType.body,
    color: adminColors.muted,
    fontWeight: '500',
  },
  decisionTableValue: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.ink,
  },
  outcomeAcceptCard: {
    backgroundColor: adminColors.success.bg,
    borderWidth: 1.5,
    borderColor: adminColors.success.border,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  outcomeIconBoxGreen: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomeTextBox: {
    flex: 1,
  },
  outcomeAcceptTitle: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.success.text,
  },
  outcomeAcceptSub: {
    ...adminType.body,
    color: adminColors.success.text,
    marginTop: 2,
  },
  outcomePartialCard: {
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1.5,
    borderColor: adminColors.warning.border,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  outcomeIconBoxAmber: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomePartialTitle: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.warning.text,
  },
  outcomePartialSub: {
    ...adminType.body,
    color: adminColors.warning.text,
    marginTop: 2,
  },
  outcomeRejectCard: {
    backgroundColor: adminColors.danger.bg,
    borderWidth: 1.5,
    borderColor: adminColors.danger.border,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  outcomeIconBoxRed: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomeRejectTitle: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.danger.text,
  },
  outcomeRejectSub: {
    ...adminType.body,
    color: adminColors.danger.text,
    marginTop: 2,
  },

  /* Damage / Mismatch Screen */
  issueTypeListCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  issueTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    gap: 12,
  },
  radioOuterCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterCircleSelected: {
    borderColor: adminColors.brand,
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: adminColors.brand,
  },
  issueTypeText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  issueTypeTextSelected: {
    fontWeight: '800',
    color: adminColors.ink,
  },
  describeIssueInput: {
    ...adminType.body,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 12,
    padding: 12,
    height: 80,
    color: adminColors.ink,
    textAlignVertical: 'top',
    marginBottom: 16,
  },

  /* Receipt Summary & Detail */
  summaryCardReceiptCode: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 12,
  },
  summaryMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryMetaCol: {
    flex: 1,
  },
  summaryMetaLabel: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 2,
  },
  summaryMetaVal: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.ink,
  },
  qcSummaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  qcSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  qcSummaryLabel: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  issuesCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.danger.bg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  issuesIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminColors.danger.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  issuesTextBox: {
    flex: 1,
  },
  issuesTitle: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.ink,
  },
  issuesSub: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 2,
  },

  /* History Screen */
  searchBarWrap: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchBarInput: {
    ...adminType.body,
    flex: 1,
    color: adminColors.ink,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterPillActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterPillText: {
    ...adminType.sectionHead,
    fontWeight: '700',
    color: adminColors.muted,
  },
  filterPillTextActive: {
    color: adminColors.onBrand,
  },
  historyCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: 12,
  },
  historyCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyCardCode: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.ink,
  },
  historyStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  historyStatusText: {
    ...adminType.caption,
    fontWeight: '800',
  },
  historyCardProduce: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 8,
  },
  historyCardStatsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 8,
  },
  historyStatLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  historyStatVal: {
    fontWeight: '800',
    color: adminColors.ink,
  },
  historyCardDate: {
    ...adminType.body,
    color: adminColors.muted,
  },

  /* Timeline */
  timelineCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    position: 'relative',
  },
  timelineLineCol: {
    alignItems: 'center',
    width: 28,
  },
  timelineDotOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: adminColors.success.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: adminColors.success.text,
  },
  timelineConnectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: adminColors.border,
    minHeight: 28,
  },
  timelineContentCol: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 16,
  },
  timelineEventTitle: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.ink,
  },
  timelineEventTime: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 2,
  },

  /* Bottom Docked CTA Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  primaryCtaBtn: {
    ...adminShadow.sm,
    backgroundColor: adminColors.brand,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  /* Rejected Goods Screen Styles */
  rejectedQtyBanner: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  rejectedQtyNum: {
    ...adminType.title,
    fontWeight: '900',
    color: adminColors.danger.text,
  },
  rejectedQtyLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.danger.text,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  rejectedNotesText: {
    ...adminType.body,
    color: adminColors.muted,
    lineHeight: 20,
    fontWeight: '500',
  },
  handlingStatusPill: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  handlingStatusText: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.warning.text,
  },

  /* Record Handling Screen Styles */
  dropdownSelectBox: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropdownLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dropdownValue: {
    ...adminType.sectionHead,
    fontWeight: '700',
    color: adminColors.ink,
  },
  dashedAddBoxSmall: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  /* Receiving in Progress Screen Styles */
  draftStatusBanner: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  draftStatusBannerText: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.warning.text,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  checklistRowText: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  checkCircleDone: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: adminColors.success.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: adminColors.brand,
  },
  checkCirclePending: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: adminColors.border,
  },
  qcProgressNumbers: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.ink,
  },
  qcProgressSub: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
    letterSpacing: 0.5,
    marginTop: 2,
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: adminColors.border,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: adminColors.brand,
  },

  /* Continue Receiving & Confirmation Screen Styles */
  largeCheckBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  allChecksCompletedTitle: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  allChecksCompletedSub: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmationCheckCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  confirmationMainTitle: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.ink,
    textAlign: 'center',
    marginBottom: 20,
  },
  rejectedGoodsAlertCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionPrimaryBtn: {
    backgroundColor: adminColors.brand,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  actionPrimaryBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
    fontWeight: '800',
  },
  actionSecondaryBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  actionSecondaryBtnText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontWeight: '800',
  },
  statePillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  statePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  statePillActive: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
  },
  statePillText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
  },
  statePillTextActive: {
    color: adminColors.brand,
  },

  /* Absorbed-screen additions (start, quality, grade, partial, summary, batch, counter-offer, review) */
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  checkboxText: {
    ...adminType.body,
    flex: 1,
    color: adminColors.ink,
  },
  qcProductCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.lg,
  },
  qcProductText: {
    flex: 1,
  },
  secondaryCtaBtn: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderColor: adminColors.brandSoft.border,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
  },
  secondaryCtaText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  primaryCtaBtnDisabled: {
    opacity: 0.5,
  },
  matchChipRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  matchChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
  },
  matchChipText: {
    ...adminType.caption,
  },
  actionGrid: {
    gap: 10,
    marginBottom: adminSpacing.lg,
  },
  actionGridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: adminSpacing.sm,
  },
  actionCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionCardText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  readOnlyInput: {
    backgroundColor: adminColors.canvas,
    justifyContent: 'center',
  },
  readOnlyValue: {
    ...adminType.sectionHead,
    color: adminColors.danger.text,
  },
  decisionOutcomeCard: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.brandSoft.border,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: adminSpacing.lg,
  },
  decisionOutcomeText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    letterSpacing: 0.5,
  },
  referenceCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: adminSpacing.lg,
  },
  referenceText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  outcomeCounterCard: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1.5,
    borderColor: adminColors.brandSoft.border,
    borderRadius: adminRadius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  outcomeCounterTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  outcomeCounterSub: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 2,
  },
  bayTextBox: {
    flex: 1,
  },
  baySub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  discrepancyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    flex: 1,
    paddingRight: adminSpacing.sm,
  },
  reviewSourceText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  weightSummaryBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weightSummaryItem: {
    alignItems: 'center',
  },
  reviewActions: {
    marginTop: adminSpacing.sm,
  },
  // Was a 50% translucent black scrim: no translucent token exists, so the backdrop
  // is the solid canvas and the card is raised by adminShadow.lg (as CancelOrderScreen).
  modalOverlay: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.xl,
    alignItems: 'center',
    ...adminShadow.lg,
  },
  modalDesc: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
    marginBottom: 18,
  },
  modalReceiptCard: {
    width: '100%',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 20,
    gap: 6,
  },
  modalReceiptRow: {
    ...adminType.body,
  },
  modalDoneBtn: {
    width: '100%',
    marginBottom: 0,
  },
  // Live-wizard additions (phase 4): theme tokens only.
  flex: { flex: 1 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: adminSpacing.sm },
  valueSuccess: { color: adminColors.success.text, fontWeight: '800' },
  valueDanger: { color: adminColors.danger.text, fontWeight: '800' },
  warningText: { color: adminColors.warning.text },
  inlineStrong: { fontWeight: '700', color: adminColors.ink },
  problemText: { ...adminType.body, color: adminColors.danger.text, marginTop: adminSpacing.sm },
  confirmationContent: { paddingTop: adminSpacing.md, paddingBottom: adminSpacing.xl },
  confirmationBadge: { width: 56, height: 56, borderRadius: 28 },
  confirmationGrn: { ...adminType.sectionHead, color: adminColors.brand, textAlign: 'center', marginBottom: adminSpacing.sm },
  confirmationSub: { ...adminType.body, color: adminColors.muted, textAlign: 'center', marginBottom: adminSpacing.lg },
  confirmationCardLabel: { ...adminType.body, color: adminColors.muted, fontWeight: '500', marginBottom: adminSpacing.xs },
  confirmationCardValue: { ...adminType.sectionHead, fontWeight: '800', color: adminColors.ink },
  confirmationRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  confirmationActions: { gap: adminSpacing.md, marginTop: adminSpacing.sm },
  confirmationActionBtn: { justifyContent: 'flex-start', paddingHorizontal: adminSpacing.lg, gap: adminSpacing.md, marginBottom: 0 },
  errorBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: adminSpacing.xl },
  errorBadge: { backgroundColor: adminColors.danger.bg, width: 68, height: 68, borderRadius: 34, marginBottom: adminSpacing.lg },
});
