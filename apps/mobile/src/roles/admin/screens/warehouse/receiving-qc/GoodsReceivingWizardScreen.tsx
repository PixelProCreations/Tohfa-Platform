/**
 * Goods Receiving wizard (FINAL_LIST #90, design module M2), shared by the Main
 * and Sub warehouse admins.
 *
 * One wizard is the whole receiving flow. It absorbed the Main shell's chain of
 * standalone screens and the Sub one-page review; each became a step or was
 * ported into the step that already covered it:
 *   StartReceiving          -> start_receiving (shipment confirmation, receiver, arrival check)
 *   QuantityVerification    -> quantity_verification (per-product table, Received - Expected rule)
 *   QualityCheck            -> quality_check (issue badge, configured-scale notice)
 *   GradeProductVerification-> grade_verification (new step: actual product / grade, derived match)
 *   DamageMismatchReport    -> damage_mismatch (combined discrepancies list)
 *   AcceptanceDecision      -> receiving_decision (three-outcomes notice)
 *   PartialAcceptance       -> partial_acceptance (accepted input, rejected calculated)
 *   GoodsReceiptSummary     -> receipt_summary (shipment id, date, decision, receipt reference, next steps)
 *   BatchAssignment         -> batch_assignment (new step: batch information + storage bay)
 *   SubWarehouseReviewReceiving -> review_receiving (new step: weight & tally, checklist, putaway)
 * plus counter_offer, a new step for inventory.quality.counter_offer, which had
 * no surface. The receipt_detail step renders the shared ReceivingHistoryDetailScreen.
 *
 * Gates (docs/rbac.json; `can` only decides what to render, the server checks
 * again, CLAUDE.md 2.1). A gated step is skipped, never shown disabled:
 *   inventory.goods_receipt.record   the wizard itself (else a permission note)
 *   inventory.quality_check.perform  Quality / Continue Receiving steps, QC summaries
 *   inventory.produce.reject_incoming Reject + Partial Accept outcomes, Rejected Goods, Record Handling
 *   inventory.batch.assign           Batch & Storage step, review putaway bay
 *   inventory.quality.counter_offer  Counter-Offer step and its entry card
 *   inventory.batch.view             View Batch, the embedded history / receipt detail
 *
 * `scope` is the viewer's warehouse (Sub: locked to its own; Main: undefined =
 * all four). The destination shown is the scope's warehouse, or the shipment's
 * own `to` for Main; nothing names a warehouse in this file.
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
  Modal,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminErrorKey } from '../../../api/errors';
import type { Grade } from '../../../api/inventory';
import type {
  GoodsReceiptDiscrepancyCreate,
  GoodsReceiptDiscrepancyType,
  GoodsReceiptPackageUnit,
  QcRejectionReasonCode,
} from '../../../api/receiving';
import { t } from '../../../i18n';
import { formatKgNumber, parseKgToGrams } from '../../../money/quantity';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { formatAdminDate, formatAdminDay, formatAdminTime } from '../../../utils/datetime';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { StorageLocationAssignmentScreen } from '../storage-ops/StorageLocationAssignmentScreen';
import type { LiveDiscrepancy, LiveQcResult, QcCriterionId } from './liveTypes';
import {
  buildCounterOfferBody,
  buildGoodsReceiptBody,
  buildQualityCheckBody,
  createReceivingKeyRing,
  discrepancyTypeLabel,
  GRADES,
  gradeLabel,
  grams,
  kgLabel,
  QC_DRAFT_PROBLEM_MESSAGE,
  QC_ORDER,
  QC_REJECTION_REASON_CODES,
  qcDraftProblem,
  receivingWarehouseFilter,
  rejectionReasonLabel,
  toDiscrepancy,
  type ReceivingKeyRing,
} from './mappers';
import { gradeVerificationOf, quantityDetailOf, receiptDocumentRows, type DiscrepancyInput } from './receivingViews';
import { ensureReceipt, initialSubmissionState, recordReceiptQc, type SubmissionDeps, type SubmissionState } from './submission';
import {
  usePurchaseOrder,
  useReceipt,
  useReceiptDiscrepancies,
  useReceiptDocument,
  useReceivingNaming,
  useReceivingWrites,
  useStorageLocations,
} from './useReceivingData';
import {
  ALL_PASS,
  counterQuantityGrams,
  DISCREPANCY_TYPES,
  discrepancyRows,
  gradeSummaryOf,
  isValidPartial,
  manualDiscrepancyBody,
  outcomeOf,
  pendingBodies,
  phase2Placement,
  qcIssueCountOf,
  receiptActivity,
  reviewQcResults,
  seedSubmission,
  sessionDiscrepancyBodies,
  shortId,
  wizardQcCriteria,
  wizardQcDraft,
  wizardResultOf,
  type DiscrepancyRow,
} from './wizardDraft';

function ArrowBackBrownIcon({ size = 22, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChainLinkIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EyeOffIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function QuestionCircleIcon({ size = 22, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MapPinIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
import {
  AlertCircleOutlineIcon,
  BackArrowIcon,
  CameraPlusIcon,
  CheckboxSquareIcon,
  CheckmarkCircleOutlineIcon,
  CheckmarkIcon,
  ChevronDownIcon,
  ChevronRightSmall,
  ClipboardChecklistIcon,
  ClockSmallIcon,
  CrateInventoryIcon,
  CrossCircleIcon,
  ErrorExclamationCircleIcon,
  EyeIcon,
  FileTextIcon,
  HistoryIcon,
  NotEqualIcon,
  NoticeBox,
  PartialAcceptIcon,
  PencilDraftIcon,
  PermissionNote,
  PictureIcon,
  QcCriterionIcon,
  QrCodeIcon,
  RECEIVING_CODES,
  ReceiptPaperIcon,
  RefreshRetryIcon,
  RejectCircleIcon,
  RightArrowIcon,
  ScaleIcon,
  SearchIcon,
  SendPaperAirplaneIcon,
  StarIcon,
  StepperHeader,
  TrashOutlineRedIcon,
  TruckDeliveryIcon,
  WarningTriangleIcon,
} from './ReceivingParts';
import { ReceivingHistoryDetailScreen } from './ReceivingHistoryDetailScreen';
import type { ReceivingWizardStep, WarehouseScreenBaseProps, WizardShipmentData } from './types';

export interface GoodsReceivingWizardScreenProps extends WarehouseScreenBaseProps {
  /** Step to open on. A step the admin may not perform falls through to the next allowed one. */
  initialStep: ReceivingWizardStep;
  /**
   * No longer read: the wizard reads the purchase order itself
   * (`purchaseOrderId`). Kept optional so the hosts that still pass a sample
   * shipment compile until they move to `purchaseOrderId`.
   */
  shipment?: WizardShipmentData | undefined;
  /** The purchase order (uuid) being received; the wizard reads it (GET /admin/purchase-orders/{id}). */
  purchaseOrderId?: string | undefined;
  /** A receipt (uuid) of that order to continue (e.g. one awaiting its quality check). */
  resumeReceiptId?: string | undefined;
  /** The host's receipt detail for a recorded receipt (uuid). */
  onViewReceipt?: ((receiptId: string) => void) | undefined;
  /** Name of the admin doing the receiving (Start Receiving "Receiver"). */
  receiverName?: string | undefined;
  onFinish?: (() => void) | undefined;
  onBackToShipments?: (() => void) | undefined;
  onViewBatch?: ((batchId: string) => void) | undefined;
  /**
   * No longer called: the storage step stays inside the wizard, so the draft
   * survives and the quality check (which stocks the batch with its location,
   * BR-106) is sent from there. Kept optional for the hosts that still pass it.
   */
  onOpenStorageLocations?: (() => void) | undefined;
  /** Navigate to Inventory */
  onOpenInventory?: (() => void) | undefined;
  /**
   * The host's Receiving History list (ReceivingFlow). When given, "View
   * receiving history" opens it instead of the embedded receiving_history step.
   */
  onViewHistory?: (() => void) | undefined;
}

/** Stepper stages, in order. Quality and Batch drop out when their gate fails. */
type StepperStage = 'Shipment' | 'Quantity' | 'Quality' | 'Grade' | 'Decision' | 'Summary' | 'Batch';

/** Where a step the admin may not perform falls through to. */
const STEP_FALLBACK: Partial<Record<ReceivingWizardStep, ReceivingWizardStep>> = {
  quality_check: 'grade_verification',
  continue_receiving: 'grade_verification',
  partial_acceptance: 'receiving_decision',
  counter_offer: 'receiving_decision',
  rejected_goods: 'receipt_confirmation',
  record_handling: 'receipt_confirmation',
};

/** Steps with no API behind them (disposal / handling of rejected goods, the embedded history list): never opened. */
const UNOFFERED_STEPS: Partial<Record<ReceivingWizardStep, ReceivingWizardStep>> = {
  rejected_goods: 'receipt_confirmation',
  record_handling: 'receipt_confirmation',
};

/** "480 KG", or the dash the design uses for a figure not known or not decided yet. */
function kgOrDash(value: number | null | undefined): string {
  return value === null || value === undefined ? t('receiving.wizard.dash') : kgLabel(value);
}

/** Received - Expected, signed (never typed by the user); the dash until both are known. */
function signedKg(value: number | null): string {
  if (value === null) return t('receiving.wizard.dash');
  return `${value > 0 ? '+' : ''}${kgLabel(value)}`;
}

/** Grams from typed kg; null when nothing valid, or nothing above zero, was typed. */
function positiveGrams(input: string): number | null {
  const value = parseKgToGrams(input);
  return value !== null && value > 0 ? value : null;
}

/** A typed whole count above zero (crates), else undefined. */
function positiveCount(input: string): number | undefined {
  if (!/^\d{1,6}$/.test(input.trim())) return undefined;
  const n = Number(input.trim());
  return n >= 1 ? n : undefined;
}

/** A write that failed, and how its Retry replays it (the held body makes the replay safe, BR-118). */
type RetryAction =
  | { kind: 'create'; next: ReceivingWizardStep; packages?: { count: number; unit: GoodsReceiptPackageUnit } | undefined }
  | { kind: 'qc'; place: 'storage' | 'summary' | 'review'; locationCode?: string | undefined }
  | { kind: 'record'; next: ReceivingWizardStep; packages?: { count: number; unit: GoodsReceiptPackageUnit } | undefined }
  | { kind: 'reports'; next: ReceivingWizardStep; bodies: readonly GoodsReceiptDiscrepancyCreate[] };

interface WriteFailure {
  error: unknown;
  /** The write may have landed (no answer / 5xx): Retry replays the held body. */
  unknown: boolean;
  retry: RetryAction;
}

/* ─── Main Wizard Component ─── */
export function GoodsReceivingWizardScreen({
  scope,
  can,
  onBack,
  initialStep,
  purchaseOrderId,
  resumeReceiptId,
  receiverName,
  onFinish,
  onBackToShipments,
  onViewBatch,
  onOpenInventory,
  onViewHistory,
}: GoodsReceivingWizardScreenProps) {
  const canRecord = can(RECEIVING_CODES.receiptRecord);
  const canQc = can(RECEIVING_CODES.qualityCheck);
  const canReject = can(RECEIVING_CODES.rejectIncoming);
  const canBatch = can(RECEIVING_CODES.batchAssign);
  const canCounter = can(RECEIVING_CODES.counterOffer);
  const canViewBatch = can(RECEIVING_CODES.batchView);

  const isAllowed = (step: ReceivingWizardStep): boolean => {
    switch (step) {
      case 'quality_check':
      case 'continue_receiving':
        return canRecord && canQc;
      case 'partial_acceptance':
      case 'rejected_goods':
      case 'record_handling':
        return canRecord && canReject;
      case 'batch_assignment':
        return canRecord && canBatch;
      case 'counter_offer':
        return canRecord && canCounter;
      case 'receiving_history':
      case 'receipt_detail':
        return canViewBatch || canRecord;
      default:
        return canRecord;
    }
  };

  /** Follow the fallback chain past steps the admin may not perform. */
  const resolveStep = (step: ReceivingWizardStep): ReceivingWizardStep => {
    let s = step;
    for (let i = 0; i < 4 && !isAllowed(s); i += 1) {
      const next = STEP_FALLBACK[s];
      if (!next) break;
      s = next;
    }
    return s;
  };

  const isSub = scope.warehouseId !== undefined;

  const SUB_STAGES = [
    'Shipment',
    'Receiving',
    'Quantity',
    'Quality',
    'Decision',
    'Storage',
    'Receipt',
  ] as const;

  const subStageIndex = (stage: string): number => {
    switch (stage) {
      case 'Shipment Arrived':
      case 'Shipment':
        return 0;
      case 'Receiving Started':
      case 'Receiving':
        return 1;
      case 'Quantity Verification':
      case 'Quantity':
        return 2;
      case 'Quality Check':
      case 'Quality':
      case 'Grade':
        return 3;
      case 'Decision':
        return 4;
      case 'Storage Assignment':
      case 'Batch':
      case 'Storage':
        return 5;
      case 'Receipt Completion':
      case 'Summary':
      case 'Receipt':
        return 6;
      default:
        return 0;
    }
  };

  const MAIN_STAGES = [
    'Shipment',
    'Receiving',
    'Quantity',
    'Quality',
    'Decision',
    'Batch',
    'Storage',
    'Receipt',
  ] as const;

  const mainStageIndex = (stage: string): number => {
    switch (stage) {
      case 'Shipment Arrived':
      case 'Shipment':
        return 0;
      case 'Receiving Started':
      case 'Receiving':
        return 1;
      case 'Quantity Verification':
      case 'Quantity':
        return 2;
      case 'Quality Check':
      case 'Quality':
      case 'Grade':
        return 3;
      case 'Decision':
        return 4;
      case 'Batch Assignment':
      case 'Batch':
        return 5;
      case 'Storage Assignment':
      case 'Storage':
        return 6;
      case 'Receipt Completion':
      case 'Summary':
      case 'Receipt':
        return 7;
      default:
        return 0;
    }
  };

  const handleStepPress = (idx: number, _label: string) => {
    if (isSub) {
      switch (idx) {
        case 0:
        case 1:
          goToStep('start_receiving');
          break;
        case 2:
          goToStep('quantity_verification');
          break;
        case 3:
          goToStep(canQc ? 'quality_check' : 'grade_verification');
          break;
        case 4:
          goToStep('receiving_decision');
          break;
        case 5:
          // 6th step: Storage Assignment, inside the wizard so the draft survives (the check is sent from there, BR-106)
          goToStep('batch_assignment');
          break;
        case 6:
          // 7th step: Receipt Completion
          goToStep('receipt_confirmation');
          break;
        default:
          break;
      }
    } else {
      switch (idx) {
        case 0:
        case 1:
          goToStep('start_receiving');
          break;
        case 2:
          goToStep('quantity_verification');
          break;
        case 3:
          goToStep(canQc ? 'quality_check' : 'grade_verification');
          break;
        case 4:
          goToStep('receiving_decision');
          break;
        case 5:
          goToStep('batch_assignment');
          break;
        case 6:
          // 7th step: Storage Assignment, inside the wizard (see the Sub case above)
          setBatchSubView('storage_assignment');
          goToStep('batch_assignment');
          break;
        case 7:
          // 8th step: Receipt Completion
          goToStep('receipt_summary');
          break;
        default:
          break;
      }
    }
  };

  const stepper = (stage: StepperStage | string) => {
    if (isSub) {
      return (
        <StepperHeader
          labels={SUB_STAGES as unknown as string[]}
          current={subStageIndex(stage)}
          onStepPress={handleStepPress}
        />
      );
    }
    return (
      <StepperHeader
        labels={MAIN_STAGES as unknown as string[]}
        current={mainStageIndex(stage)}
        onStepPress={handleStepPress}
      />
    );
  };

  /** The step to open on; a step with no API behind it is never opened. */
  const resolveInitial = (step: ReceivingWizardStep): ReceivingWizardStep => resolveStep(UNOFFERED_STEPS[step] ?? step);

  const [currentStep, setCurrentStep] = useState<ReceivingWizardStep>(() => resolveInitial(initialStep));
  const [history, setHistory] = useState<ReceivingWizardStep[]>(() => [resolveInitial(initialStep)]);

  const [batchSubView, setBatchSubView] = useState<
    | 'assignment'
    | 'review'
    | 'confirm'
    | 'batch_created'
    | 'storage_assignment'
    | 'storage_list'
    | 'storage_detail'
    | 'location_review'
    | 'confirm_location'
    | 'assignment_complete'
  >('assignment');

  // No 'product_mismatch': the actual product cannot be picked (warehouse admins cannot list crops).
  const [gradeSubView, setGradeSubView] = useState<'main' | 'grade_mismatch' | 'product_summary' | 'grade_summary'>('main');

  useEffect(() => {
    const first = resolveInitial(initialStep);
    setCurrentStep(first);
    setHistory([first]);
    if (first === 'damage_mismatch') {
      setMismatchSubView('report');
    }
    if (first === 'receipt_summary') {
      setSummarySubView('main');
    }
    if (first === 'batch_assignment') {
      setBatchSubView('assignment');
    }
    if (first === 'grade_verification') {
      setGradeSubView('main');
    }
    // Reset only when the host opens a different step (as before); `can` is stable per session.
  }, [initialStep]);

  const goToStep = (target: ReceivingWizardStep) => {
    const step = resolveStep(target);
    setHistory(prev => [...prev, step]);
    setCurrentStep(step);
  };

  /** After a write: from the error screen the next step replaces it, so Back does not return to the error. */
  const advance = (target: ReceivingWizardStep) => {
    if (currentStep !== 'submission_error') {
      goToStep(target);
      return;
    }
    const step = resolveStep(target);
    setHistory(prev => [...prev.slice(0, -1), step]);
    setCurrentStep(step);
  };

  const [mismatchSubView, setMismatchSubView] = useState<'report' | 'detail'>('report');
  const [summarySubView, setSummarySubView] = useState<'main' | 'preview' | 'detail' | 'activity'>('main');

  /* Navigation handler based on back button: pops exactly ONE screen */
  const handleBack = () => {
    if (currentStep === 'grade_verification' && !isSub) {
      if (gradeSubView !== 'main') {
        setGradeSubView('main');
        return;
      }
    }
    if (currentStep === 'batch_assignment' && !isSub) {
      if (batchSubView === 'assignment_complete') {
        setBatchSubView('confirm_location');
        return;
      }
      if (batchSubView === 'confirm_location') {
        setBatchSubView('location_review');
        return;
      }
      if (batchSubView === 'location_review') {
        setBatchSubView('storage_detail');
        return;
      }
      if (batchSubView === 'storage_detail') {
        setBatchSubView('storage_list');
        return;
      }
      if (batchSubView === 'storage_list') {
        setBatchSubView('storage_assignment');
        return;
      }
      if (batchSubView === 'storage_assignment') {
        setBatchSubView('batch_created');
        return;
      }
      if (batchSubView === 'batch_created') {
        setBatchSubView('confirm');
        return;
      }
      if (batchSubView === 'confirm') {
        setBatchSubView('review');
        return;
      }
      if (batchSubView === 'review') {
        setBatchSubView('assignment');
        return;
      }
    }
    if (currentStep === 'damage_mismatch' && mismatchSubView === 'detail') {
      setMismatchSubView('report');
      return;
    }
    if (currentStep === 'receipt_summary' && summarySubView !== 'main') {
      setSummarySubView('main');
      return;
    }
    if (history.length > 1) {
      const nextHistory = history.slice(0, -1);
      const prevStep = nextHistory[nextHistory.length - 1];
      setHistory(nextHistory);
      if (prevStep) {
        setCurrentStep(prevStep);
      }
    } else if (currentStep === 'receipt_confirmation') {
      goToStep('receiving_decision');
    } else if (currentStep === 'submission_error') {
      goToStep('receipt_summary');
    } else {
      onBack();
    }
  };

  // ─── Live data ───────────────────────────────────────────────────────────
  const { naming } = useReceivingNaming(scope, can);
  /**
   * The warehouse the reads are keyed by: a Sub scope its own uuid (BR-30),
   * the Main view none (the order and receipt are read by id; the key only
   * has to be stable so one wizard's reads are shared, never another's).
   */
  const queryWh = receivingWarehouseFilter(scope, undefined);
  const resumeRead = useReceipt(queryWh, resumeReceiptId, naming);
  const orderId = purchaseOrderId ?? resumeRead.dto?.purchaseOrderId;
  const order = usePurchaseOrder(queryWh, orderId, naming);
  const ship = order.shipment;
  const writes = useReceivingWrites();

  // One key ring for the wizard's life: the same body always replays with its key (BR-118).
  const ringRef = useRef<ReceivingKeyRing | null>(null);
  if (ringRef.current === null) ringRef.current = createReceivingKeyRing();
  const ring = ringRef.current;
  const deps: SubmissionDeps = {
    createReceipt: (b) => writes.createReceipt(b, ring.createKey(b)),
    recordQualityCheck: (id, b) => writes.recordQualityCheck(id, b, ring.qcKey(id, b)),
    getReceipt: writes.getReceipt,
  };

  // The two-phase submission (./submission.ts). A ref mirrors the state so an
  // async step reads the latest, and a second tap in the same frame is refused.
  const [submission, setSubmissionState] = useState<SubmissionState>(() => initialSubmissionState());
  const submissionRef = useRef(submission);
  const setSubmission = (next: SubmissionState) => {
    submissionRef.current = next;
    setSubmissionState(next);
  };
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [failure, setFailure] = useState<WriteFailure | null>(null);

  // A receipt that already exists is resumed, never recorded again (BR-118).
  const resumeDto = resumeRead.dto;
  const pendingDto = resumeReceiptId === undefined ? order.pendingReceipt : undefined;
  useEffect(() => {
    const seeded = seedSubmission(submissionRef.current, resumeDto, pendingDto);
    if (seeded !== null) {
      submissionRef.current = seeded;
      setSubmissionState(seeded);
    }
  }, [resumeDto, pendingDto]);

  const receiptDto = submission.receipt;
  const receiptUuid = receiptDto?.id ?? resumeReceiptId;
  const receiptRead = useReceipt(queryWh, receiptUuid, naming);
  const liveReceipt = receiptRead.receipt;
  const discrepancyRead = useReceiptDiscrepancies(queryWh, receiptDto?.id);
  const documentRead = useReceiptDocument(queryWh, summarySubView === 'preview' ? receiptDto?.id : undefined);

  /** BR-30: a Sub scope always records into (and puts away in) its own warehouse; Main into the order's. */
  const recordWarehouseId = receivingWarehouseFilter(scope, ship?.warehouseId);
  const storage = useStorageLocations(canBatch ? recordWarehouseId : undefined);

  // Order facts (the purchase order; no warehouse is named in this file)
  const receiptCode = ship?.code ?? '';
  const expectedProduct = ship?.produce ?? '';
  const listedGrade = ship?.apiGrade;
  const expectedGrade = ship?.grade ?? '';
  const sourceName = ship?.from ?? '';
  /** Destination: the Sub scope's own warehouse, or the order's (named from GET /warehouses) for Main. */
  const destinationName = scope.warehouseName ?? ship?.to ?? '';
  const expectedGrams = ship?.expectedGrams ?? null;
  /** The real GRN once the receipt is recorded (phase 1); undefined before. */
  const grn = receiptDto?.grnNumber;

  // Start Receiving
  const [arrivalConfirmed, setArrivalConfirmed] = useState(false);

  // Quantity: typed once; a recorded (or possibly recorded) receipt keeps its gross.
  const [grossInput, setGrossInput] = useState('');
  const grossGrams =
    receiptDto !== null
      ? grams(receiptDto.grossQtyKg)
      : submission.heldCreate !== null
        ? grams(submission.heldCreate.grossQtyKg)
        : positiveGrams(grossInput);
  const grossLocked = receiptDto !== null || submission.heldCreate !== null;
  const quantity = quantityDetailOf(expectedGrams, grossGrams);

  // Quality check: the five API points (QC_ORDER).
  const qcCriteria = wizardQcCriteria();
  const [qcStatusMap, setQcStatusMap] = useState<Record<QcCriterionId, LiveQcResult>>(() => ({ ...ALL_PASS }));
  const qcIssueCount = qcIssueCountOf(qcStatusMap);

  // Grade verification: the actual grade starts at the order's grade (the product cannot change on a receipt).
  const [pickedGrade, setPickedGrade] = useState<Grade | undefined>(undefined);
  const assignedGrade = pickedGrade ?? listedGrade;
  const actualGrade = gradeLabel(assignedGrade);
  const gradeCheck = assignedGrade === undefined ? null : gradeVerificationOf(listedGrade, assignedGrade, grossGrams);
  const gradeMatches = gradeCheck?.status !== 'mismatch';
  const [gradeNote, setGradeNote] = useState('');

  // Decision: the accepted weight is chosen; rejected is always received - accepted.
  const [acceptedGrams, setAcceptedGrams] = useState<number | null>(null);
  const [acceptedInput, setAcceptedInput] = useState('');
  // The design pre-selects "Quality Below Grade" (BELOW_GRADE); the reasons are the API's codes.
  const [rejectionReasonCode, setRejectionReasonCode] = useState<QcRejectionReasonCode>('BELOW_GRADE');
  const [partialNotes, setPartialNotes] = useState('');

  /** What the views show after the check: this session's answer, else the receipt as read back. */
  const result = wizardResultOf(submission.qc, liveReceipt);
  const decided = result !== null && result.variant !== 'awaiting';
  const shownAccepted = decided ? result.acceptedGrams : acceptedGrams;
  const shownRejected = decided
    ? result.rejectedGrams
    : grossGrams !== null && acceptedGrams !== null && acceptedGrams >= 0 && acceptedGrams <= grossGrams
      ? grossGrams - acceptedGrams
      : null;
  const outcome = outcomeOf(grossGrams, shownAccepted);
  const outcomeUpper =
    outcome === 'Accept'
      ? t('receiving.wizard.outcomeUpper.accept')
      : outcome === 'Reject'
        ? t('receiving.wizard.outcomeUpper.reject')
        : outcome === 'Partial Accept'
          ? t('receiving.wizard.outcomeUpper.partial')
          : undefined;
  const reasonLabel = decided ? result.reasonLabel : rejectionReasonLabel(rejectionReasonCode);

  const setAcceptedFromInput = (value: string) => {
    const typed = value.replace(/[^0-9.]/g, '');
    setAcceptedInput(typed);
    setAcceptedGrams(parseKgToGrams(typed));
  };

  /** Where the check (phase 2) is sent from: the storage confirm when a batch is stocked, else the summary (BR-106). */
  const place = phase2Placement({
    canQc,
    canBatch,
    acceptedGrams: shownAccepted,
    // No grade yet: nothing can be stocked.
    assignedGrade: assignedGrade ?? 'REJECT',
  });

  // Damage / Mismatch (BR-121): the session's reports, the persisted ones, and the Sub form.
  const [selectedIssueType, setSelectedIssueType] = useState<GoodsReceiptDiscrepancyType>(DISCREPANCY_TYPES[0] ?? 'QUANTITY');
  const [issueDescription, setIssueDescription] = useState('');
  const [createdReports, setCreatedReports] = useState<LiveDiscrepancy[]>([]);
  const [selectedReportKey, setSelectedReportKey] = useState<string | undefined>(undefined);
  const discrepancyInput: DiscrepancyInput = {
    product: expectedProduct,
    expectedGrams,
    receivedGrams: grossGrams,
    listedGrade,
    // Without an assigned grade there is no listed grade either, so no grade report is derived.
    assignedGrade: assignedGrade ?? 'GRADE_1',
    failedPoints: canQc ? QC_ORDER.filter(id => qcStatusMap[id] !== 'pass') : [],
    damagedGrams: null,
    spoiledGrams: null,
    note: '',
  };
  const persistedReports = [...discrepancyRead.items, ...createdReports];
  const shownBodies = pendingBodies(sessionDiscrepancyBodies(discrepancyInput, gradeNote, null), persistedReports);
  const reportRows = discrepancyRows(discrepancyRead.items, createdReports, shownBodies);
  const selectedReport = reportRows.find(r => r.key === selectedReportKey) ?? reportRows[0];
  const reportsView = queryViewState({ isLoading: discrepancyRead.isLoading, error: discrepancyRead.error, itemCount: reportRows.length });

  // Storage location (free text on the batch; the check sends its code, BR-106)
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);
  const selectedLocation = storage.options.find(o => o.id === selectedLocationId);
  const locationLabel = (code: string | undefined): string | undefined =>
    code === undefined ? undefined : storage.options.find(o => o.code === code)?.label ?? code;

  // Counter-offer (inventory.quality.counter_offer): needs the recorded receipt.
  const [counterPrice, setCounterPrice] = useState('');
  const [counterReason, setCounterReason] = useState('');
  const counterQty = counterQuantityGrams(result, shownAccepted, grossGrams);
  const counterBody =
    counterQty === null ? null : buildCounterOfferBody({ priceInput: counterPrice, quantityGrams: counterQty, message: counterReason });
  const counterPriceValid = counterBody !== null;
  const canOfferCounter = canCounter && receiptDto !== null;

  // Review Receiving (absorbed SubWarehouseReviewReceivingScreen)
  const [crateCount, setCrateCount] = useState('');
  const [inspection, setInspection] = useState<Record<QcCriterionId, boolean>>(() => ({
    appearance: true,
    size: true,
    moisture: true,
    damage: true,
    freshness: true,
  }));
  const [isReviewSuccessVisible, setIsReviewSuccessVisible] = useState(false);
  const reviewCrates = positiveCount(crateCount);
  const reviewPackages = reviewCrates === undefined ? undefined : { count: reviewCrates, unit: 'CRATE' as const };

  /** Damage / Mismatch continues to the step after the one that opened it (Quality is skipped without its gate). */
  const mismatchFrom = history[history.length - 2];
  const afterMismatchStep: ReceivingWizardStep =
    mismatchFrom === 'grade_verification'
      ? 'receiving_decision'
      : mismatchFrom === 'quality_check'
        ? 'grade_verification'
        : 'quality_check';

  // ─── Writes ──────────────────────────────────────────────────────────────

  /** Runs one write at a time; the confirm buttons are disabled meanwhile (no double submit). */
  const withBusy = async (work: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await work();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const fail = (error: unknown, unknown: boolean, retry: RetryAction) => {
    setFailure({ error, unknown, retry });
    if (currentStep !== 'submission_error') goToStep('submission_error');
  };

  /** Phase 1: the goods receipt (its GRN is real from here on). True when the receipt exists. */
  const runCreate = async (retry: RetryAction, packages?: { count: number; unit: GoodsReceiptPackageUnit }): Promise<boolean> => {
    const state = submissionRef.current;
    if (state.receipt !== null) return true;
    if (orderId === undefined || recordWarehouseId === undefined || grossGrams === null) {
      Alert.alert(t('receiving.wizard.grossRequired'));
      return false;
    }
    const body = buildGoodsReceiptBody({
      purchaseOrderId: orderId,
      warehouseId: recordWarehouseId,
      grossGrams,
      packageCount: packages?.count,
      packageUnit: packages?.unit,
    });
    const out = await ensureReceipt(state, body, deps);
    setSubmission(out.state);
    if (out.kind === 'failed') {
      fail(out.error, out.unknown, retry);
      return false;
    }
    return true;
  };

  /** M2-06 Continue (and Record Damage / Mismatch): record the receipt, then move on. */
  const leaveQuantity = (next: ReceivingWizardStep) => {
    void withBusy(async () => {
      if (await runCreate({ kind: 'create', next })) advance(next);
    });
  };

  /** Without inventory.quality_check.perform only the receipt is recorded; its check stays pending. */
  const recordOnly = async (next: ReceivingWizardStep, packages?: { count: number; unit: GoodsReceiptPackageUnit }) => {
    if (await runCreate({ kind: 'record', next, packages }, packages)) advance(next);
  };

  /**
   * Phase 2: the quality check. BR-106: this one call stocks the accepted
   * goods as a batch AND copies the storage location onto it; there is no
   * batch or location write after it.
   */
  const runQc = async (where: 'storage' | 'summary' | 'review', locationCode?: string) => {
    const retry: RetryAction = { kind: 'qc', place: where, locationCode };
    if (assignedGrade === undefined) {
      Alert.alert(t('receiving.wizard.gradeRequired'));
      return;
    }
    const draft = wizardQcDraft({
      assignedGrade,
      grossGrams,
      // The one-page review accepts the full received weight.
      acceptedGrams: where === 'review' ? grossGrams : acceptedGrams,
      results: where === 'review' ? reviewQcResults(inspection) : qcStatusMap,
      rejectionReasonCode,
      rejectionNote: partialNotes,
      storageLocationCode: locationCode,
    });
    const problem = qcDraftProblem(draft);
    if (problem !== null && submissionRef.current.heldQc === null && !submissionRef.current.qcDone) {
      Alert.alert(t(QC_DRAFT_PROBLEM_MESSAGE[problem]));
      return;
    }
    if (!(await runCreate(retry, where === 'review' ? reviewPackages : undefined))) return;
    const state = submissionRef.current;
    if (!state.qcDone) {
      // A held body (outcome unknown) is replayed as is; the draft is not rebuilt over it.
      const body = state.heldQc ?? buildQualityCheckBody(draft);
      const out = await recordReceiptQc(state, body, deps);
      setSubmission(out.state);
      if (out.kind === 'failed') {
        fail(out.error, out.unknown, retry);
        return;
      }
    }
    if (where === 'review') {
      if (currentStep !== 'review_receiving') advance('review_receiving');
      setIsReviewSuccessVisible(true);
    } else if (where === 'storage' && !isSub) {
      setBatchSubView('assignment_complete');
      if (currentStep !== 'batch_assignment') advance('batch_assignment');
    } else {
      advance('receipt_confirmation');
    }
  };

  /** M2-09: send each of the session's reports that the receipt does not have yet, once (per-body key, BR-118). */
  const persistReports = async (bodies: readonly GoodsReceiptDiscrepancyCreate[], next: ReceivingWizardStep): Promise<boolean> => {
    const receiptId = submissionRef.current.receipt?.id;
    if (receiptId === undefined) return true;
    for (const [idx, body] of bodies.entries()) {
      try {
        const dto = await writes.createDiscrepancy(receiptId, body, ring.discrepancyKey(receiptId, body));
        const created = toDiscrepancy(dto, new Date());
        setCreatedReports(prev => (prev.some(p => p.id === created.id) ? prev : [...prev, created]));
      } catch (error) {
        fail(error, false, { kind: 'reports', next, bodies: bodies.slice(idx) });
        return false;
      }
    }
    return true;
  };

  /**
   * "Continue" out of Damage / Mismatch. JUDGMENT CALL (reported): the reports
   * derived from what was recorded are persisted when the admin continues to
   * the decision; the Sub form's own report (type + description) whenever it
   * continues. Nothing is sent before the receipt exists.
   */
  const leaveMismatch = (next: ReceivingWizardStep) => {
    void withBusy(async () => {
      const manual = isSub ? manualDiscrepancyBody({ type: selectedIssueType, description: issueDescription }, discrepancyInput) : null;
      const derived = next === 'receiving_decision' ? sessionDiscrepancyBodies(discrepancyInput, gradeNote, manual) : manual === null ? [] : [manual];
      const todo = pendingBodies(derived, persistedReports);
      if (await persistReports(todo, next)) {
        if (manual !== null) setIssueDescription('');
        advance(next);
      }
    });
  };

  const handleRetrySubmission = () => {
    const retry = failure?.retry;
    if (retry === undefined) return;
    void withBusy(async () => {
      if (retry.kind === 'create') {
        if (await runCreate(retry, retry.packages)) advance(retry.next);
      } else if (retry.kind === 'record') {
        await recordOnly(retry.next, retry.packages);
      } else if (retry.kind === 'qc') {
        await runQc(retry.place, retry.locationCode);
      } else if (await persistReports(pendingBodies(retry.bodies, persistedReports), retry.next)) {
        advance(retry.next);
      }
    });
  };

  /** Summary -> Batch & Storage when a batch will be stocked and the admin may place it, else the check is sent here. */
  const handleSummaryConfirm = () => {
    if (canQc && outcome === null) {
      Alert.alert(t('receiving.wizard.decisionRequired'));
      return;
    }
    if (place === 'storage') {
      if (!isSub) setBatchSubView('assignment');
      goToStep('batch_assignment');
      return;
    }
    void withBusy(() => (place === 'none' ? recordOnly('receipt_confirmation') : runQc('summary')));
  };

  /** Main summary's bottom button: "Assign Batch" when a batch will be stocked, else the confirm that sends the check. */
  const summaryStocks = place === 'storage';

  const sendCounterOffer = () => {
    if (receiptDto === null || counterBody === null) return;
    void withBusy(async () => {
      try {
        const offer = await writes.createCounterOffer(receiptDto.id, counterBody, ring.counterKey(receiptDto.id, counterBody));
        Alert.alert(
          t('receiving.wizard.counterRecordedTitle'),
          t('receiving.wizard.counterSent', { round: offer.round, expires: formatAdminDate(offer.expiresAt, new Date()) }),
        );
        handleBack();
      } catch (error) {
        Alert.alert(t('async.error.title'), t(adminErrorKey(error)));
      }
    });
  };

  const pickFrom = (title: string, options: readonly { label: string; onPick: () => void }[]) => {
    Alert.alert(title, undefined, [
      ...options.map(o => ({ text: o.label, onPress: o.onPick })),
      { text: t('receiving.wizard.cancel'), style: 'cancel' as const },
    ]);
  };

  /** QC summary rows from the recorded results (was a hard-coded icon list). */
  const qcSummaryRows = (results: Readonly<Record<QcCriterionId, LiveQcResult>>) =>
    qcCriteria.map((crit, idx) => {
      const r = results[crit.id];
      return (
        <View
          key={crit.id}
          style={[styles.qcSummaryRow, idx === qcCriteria.length - 1 && { borderBottomWidth: 0 }]}
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

  /** The plain wizard frame for a state with no step to show (no order, loading, error). */
  const stateFrame = (body: React.ReactNode) => (
    <View style={styles.container}>
      <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('receiving.wizard.title')}</Text>
      </View>
      {body}
    </View>
  );

  /* ──────────────────────────────────────────────────────────
     No permission for this step (every gate failed its fallback)
     ────────────────────────────────────────────────────────── */
  if (!isAllowed(currentStep)) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Goods Receiving</Text>
        </View>
        <View style={styles.scrollContent}>
          <PermissionNote message="You do not have permission to record goods receipts." />
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     The purchase order being received: no order (never a sample shipment),
     loading, or an error with Retry, before any step is drawn.
     ────────────────────────────────────────────────────────── */
  if (orderId === undefined) {
    if (resumeReceiptId !== undefined && resumeRead.isLoading) return stateFrame(<AdminLoadingState />);
    if (resumeReceiptId !== undefined && resumeRead.error !== null && resumeRead.error !== undefined) {
      return stateFrame(<AdminErrorState error={resumeRead.error} onRetry={resumeRead.refresh} />);
    }
    return stateFrame(<AdminEmptyState title={t('receiving.wizard.noShipment')} />);
  }
  if (ship === undefined) {
    if (!order.isLoading && order.error !== null && order.error !== undefined) {
      return stateFrame(<AdminErrorState error={order.error} onRetry={order.refresh} />);
    }
    return stateFrame(<AdminLoadingState />);
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 1: Start Receiving
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'start_receiving') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Start Receiving</Text>
        </View>

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
              {expectedGrams !== null ? (
                <Text style={styles.produceExpQty}>{t('receiving.wizard.expectedQty', { qty: kgLabel(expectedGrams) })}</Text>
              ) : null}
            </View>
          </View>

          {/* Absorbed StartReceivingScreen: shipment confirmation + receiver information */}
          <Text style={styles.sectionHeader}>Shipment Confirmation</Text>
          <View style={styles.whiteCard}>
            <View style={styles.summaryMetaGrid}>
              {sourceName !== '' ? (
                <View style={styles.summaryMetaCol}>
                  <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.source')}</Text>
                  <Text style={styles.summaryMetaVal}>{sourceName}</Text>
                </View>
              ) : null}
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
              {expectedGrams !== null ? (
                <View style={styles.summaryMetaCol}>
                  <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.expectedQtyLabel')}</Text>
                  <Text style={styles.summaryMetaVal}>{kgLabel(expectedGrams)}</Text>
                </View>
              ) : null}
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

          {/* No arrival status exists (owner decision): the box stays, it never blocks Continue. */}
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

          {/* Received Date / Time and Receiving Photos are hidden: the server stamps receivedAt itself and the
              wizard has no photo upload (Gaps). */}

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
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quantity Verification</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {stepper('Quantity')}

          {/* The received weight, typed once (design M2-06 "Received Quantity"); a recorded receipt keeps its own. */}
          <Text style={styles.inputLabel}>{t('receiving.wizard.grossLabel')}</Text>
          {grossLocked ? (
            <View style={[styles.textInput, styles.readOnlyInput, { marginBottom: adminSpacing.lg }]}>
              <Text style={styles.readOnlyValue}>
                {grossGrams !== null && grn !== undefined
                  ? t('receiving.wizard.grossLocked', { qty: kgLabel(grossGrams), grn })
                  : kgOrDash(grossGrams)}
              </Text>
            </View>
          ) : (
            <TextInput
              style={[styles.textInput, { marginBottom: adminSpacing.lg }]}
              value={grossInput}
              onChangeText={value => setGrossInput(value.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0.000"
              placeholderTextColor={adminColors.placeholder}
            />
          )}

          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{kgOrDash(expectedGrams)}</Text>
              <Text style={styles.statTileLabel}>{t('receiving.wizard.tile.expected')}</Text>
            </View>

            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{kgOrDash(grossGrams)}</Text>
              <Text style={styles.statTileLabel}>{t('receiving.wizard.tile.received')}</Text>
            </View>

            <View style={styles.statTile}>
              <Text
                style={[
                  styles.statTileNumber,
                  quantity.differenceGrams !== null && quantity.differenceGrams !== 0 && { color: adminColors.danger.text },
                ]}
              >
                {signedKg(quantity.differenceGrams)}
              </Text>
              <Text style={styles.statTileLabel}>{t('receiving.wizard.tile.difference')}</Text>
            </View>
          </View>

          {/* Absorbed QuantityVerificationScreen: the order's one product line (an order has one crop) with its status */}
          <Text style={styles.sectionHeader}>{t('receiving.wizard.itemsOnShipment')}</Text>
          {(() => {
            const status = quantity.status;
            const tone =
              status === 'Shortage' ? adminColors.warning : status === 'Excess' ? adminColors.info : adminColors.success;
            return (
              <View style={styles.shipmentItemCard}>
                <View style={styles.shipmentItemTopRow}>
                  <Text style={styles.shipmentItemTitle}>{expectedProduct}</Text>
                  {status !== null ? (
                    <View style={[styles.redBadgePill, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.redBadgeText, { color: tone.text }]}>
                        {status === 'Match'
                          ? t('receiving.wizard.qtyStatus.Match')
                          : `${t(status === 'Shortage' ? 'receiving.wizard.qtyStatus.Shortage' : 'receiving.wizard.qtyStatus.Excess')} ${signedKg(quantity.differenceGrams)}`}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.shipmentItemDesc}>
                  {t('receiving.wizard.expectedWord')} <Text style={{ fontWeight: '700', color: adminColors.ink }}>{kgOrDash(expectedGrams)}</Text> · {t('receiving.wizard.receivedWord')} <Text style={{ fontWeight: '700', color: adminColors.ink }}>{kgOrDash(grossGrams)}</Text>
                </Text>
              </View>
            );
          })()}

          <Text style={styles.sectionHeader}>Report an Issue</Text>
          <TouchableOpacity
            style={styles.reportIssueBtn}
            activeOpacity={0.8}
            disabled={busy || grossGrams === null}
            onPress={() => leaveQuantity('damage_mismatch')}
          >
            <AlertCircleOutlineIcon color={adminColors.brand} size={18} />
            <Text style={styles.reportIssueBtnText}>Record Damage / Mismatch</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.primaryCtaBtn, (busy || grossGrams === null) && styles.primaryCtaBtnDisabled]}
            activeOpacity={0.85}
            disabled={busy || grossGrams === null}
            onPress={() => leaveQuantity('quality_check')}
          >
            <Text style={styles.primaryCtaText}>
              {canQc ? 'Continue to Quality Check  →' : 'Continue to Grade & Product Check  →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 3: Quality Check
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'quality_check') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Quality Check</Text>
            <Text style={styles.headerSub}>
              {[expectedProduct, expectedGrade, grossGrams === null ? '' : t('receiving.wizard.receivedQty', { qty: kgLabel(grossGrams) })]
                .filter(part => part !== '')
                .join(' · ')}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {stepper('Quality')}

          {/* Absorbed QualityCheckScreen: product card with issue badge + configured-scale notice */}
          <View style={styles.qcProductCard}>
            <View style={styles.qcProductText}>
              <Text style={styles.shipmentItemTitle}>{expectedProduct}</Text>
              {grossGrams !== null ? (
                <Text style={styles.shipmentItemDesc}>{t('receiving.wizard.kgReceived', { qty: kgLabel(grossGrams) })}</Text>
              ) : null}
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
                {qcIssueCount > 0 ? t('receiving.wizard.qcIssue') : t('receiving.wizard.qcOk')}
              </Text>
            </View>
          </View>

          {qcCriteria.map(crit => {
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

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            onPress={() => goToStep('grade_verification')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Text style={styles.primaryCtaText}>Continue to Grade & Product Verification</Text>
              <RightArrowIcon color={adminColors.onBrand} size={18} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryCtaBtn}
            activeOpacity={0.8}
            onPress={() => goToStep('damage_mismatch')}
          >
            <Text style={styles.secondaryCtaText}>Quality Summary</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 3B: Grade & Product Verification (absorbed GradeProductVerificationScreen)
     Product / grade match is DERIVED from the expected and actual fields, never typed.
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'grade_verification') {
    if (!isSub) {
      // No Product Mismatch detail: warehouse admins cannot list crops, so no actual product can be recorded (Gaps).
      if (gradeSubView === 'grade_mismatch') {
        return (
          <View style={customMismatchStyles.root}>
            <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
            <View style={customMismatchStyles.header}>
              <View style={customMismatchStyles.headerRow}>
                <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                  <BackArrowIcon color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={customMismatchStyles.headerTitle}>Grade Mismatch</Text>
              </View>
              <Text style={customMismatchStyles.headerSubtitle}>{receiptCode}</Text>
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <Text style={customMismatchStyles.sectionHeading}>Grade Mismatch Detail</Text>

              <View style={customMismatchStyles.whiteCard}>
                <View style={customMismatchStyles.gridRow}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.expectedGrade')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{expectedGrade}</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.actualGrade')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{actualGrade}</Text>
                  </View>
                </View>

                {gradeCheck?.quantityAffectedGrams !== null && gradeCheck?.quantityAffectedGrams !== undefined ? (
                  <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                    <View style={customMismatchStyles.gridCol}>
                      <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.quantityAffected')}</Text>
                      <Text style={customMismatchStyles.gridVal}>{kgLabel(gradeCheck.quantityAffectedGrams)}</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* The note travels on the grade-mismatch report (BR-121). */}
              <View style={customMismatchStyles.notesCard}>
                <TextInput
                  style={[customMismatchStyles.notesPlaceholder, { color: adminColors.ink }]}
                  placeholder={t('receiving.wizard.gradeNotePlaceholder')}
                  placeholderTextColor={adminColors.muted}
                  multiline
                  value={gradeNote}
                  onChangeText={setGradeNote}
                />
              </View>
            </ScrollView>
          </View>
        );
      }

      if (gradeSubView === 'product_summary') {
        return (
          <View style={customMismatchStyles.root}>
            <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
            <View style={customMismatchStyles.header}>
              <View style={customMismatchStyles.headerRow}>
                <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                  <BackArrowIcon color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={customMismatchStyles.headerTitle}>Product Summary</Text>
              </View>
              <Text style={customMismatchStyles.headerSubtitle}>{receiptCode}</Text>
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <Text style={customMismatchStyles.sectionHeading}>Product Verification Summary</Text>

              <View style={customMismatchStyles.whiteCard}>
                <Text style={customMismatchStyles.gridLabel}>Overall Status</Text>
                <Text style={[customMismatchStyles.gridVal, { color: adminColors.success.text, marginTop: adminSpacing.xs }]}>
                  Product Match — Confirmed
                </Text>
              </View>
            </ScrollView>
          </View>
        );
      }

      if (gradeSubView === 'grade_summary') {
        return (
          <View style={customMismatchStyles.root}>
            <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
            <View style={customMismatchStyles.header}>
              <View style={customMismatchStyles.headerRow}>
                <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                  <BackArrowIcon color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={customMismatchStyles.headerTitle}>Grade Summary</Text>
              </View>
              <Text style={customMismatchStyles.headerSubtitle}>{receiptCode}</Text>
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <Text style={customMismatchStyles.sectionHeading}>Grade Verification Summary</Text>

              <View style={customMismatchStyles.whiteCard}>
                <Text style={customMismatchStyles.gridLabel}>Overall Status</Text>
                {gradeCheck !== null ? (
                  <Text
                    style={[
                      customMismatchStyles.gridVal,
                      {
                        color:
                          gradeSummaryOf(gradeCheck).tone === 'success'
                            ? adminColors.success.text
                            : gradeSummaryOf(gradeCheck).tone === 'warning'
                              ? adminColors.warning.text
                              : adminColors.muted,
                        marginTop: adminSpacing.xs,
                      },
                    ]}
                  >
                    {gradeSummaryOf(gradeCheck).text}
                  </Text>
                ) : null}
              </View>
            </ScrollView>
          </View>
        );
      }

      // Main Grade & Product Verification Screen (Screenshot 1)
      return (
        <View style={customMismatchStyles.root}>
          <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
          <View style={customMismatchStyles.header}>
            <View style={customMismatchStyles.headerRow}>
              <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                <BackArrowIcon color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={customMismatchStyles.headerTitle}>Grade & Product Verification</Text>
            </View>
            <Text style={customMismatchStyles.headerSubtitle}>{receiptCode}</Text>
          </View>

          <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
            <View style={customMismatchStyles.whiteCard}>
              <View style={customMismatchStyles.gridRow}>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.expectedProduct')}</Text>
                  <Text style={customMismatchStyles.gridVal}>{expectedProduct}</Text>
                </View>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.expectedGrade')}</Text>
                  <Text style={customMismatchStyles.gridVal}>{expectedGrade}</Text>
                </View>
              </View>
            </View>

            {/* Actual Product is hidden: warehouse admins cannot list crops, so it cannot be picked (Gaps). */}

            <Text style={[styles.inputLabel, { ...adminType.caption, color: adminColors.muted, fontWeight: '600', marginBottom: 6 }]}>{t('receiving.wizard.actualGrade')}</Text>
            <TouchableOpacity
              style={[styles.dropdownSelectBox, { backgroundColor: adminColors.card, borderColor: adminColors.border, borderRadius: adminRadius.md, height: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }]}
              activeOpacity={0.7}
              onPress={() => pickFrom(t('receiving.wizard.actualGrade'), GRADES.map(g => ({ label: gradeLabel(g), onPick: () => setPickedGrade(g) })))}
            >
              <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>{actualGrade}</Text>
              <ChevronDownIcon />
            </TouchableOpacity>

            <View style={{ gap: 10, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: adminColors.card,
                    borderRadius: adminRadius.md,
                    borderWidth: 1,
                    borderColor: adminColors.border,
                    paddingVertical: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                  onPress={() => setGradeSubView('grade_mismatch')}
                  activeOpacity={0.8}
                >
                  <StarIcon color={adminColors.brand} size={20} />
                  <Text style={{ ...adminType.caption, fontWeight: '700', color: adminColors.ink }}>Grade Mismatch</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: adminColors.card,
                    borderRadius: adminRadius.md,
                    borderWidth: 1,
                    borderColor: adminColors.border,
                    paddingVertical: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                  onPress={() => setGradeSubView('product_summary')}
                  activeOpacity={0.8}
                >
                  <ReceiptPaperIcon color={adminColors.brand} size={20} />
                  <Text style={{ ...adminType.caption, fontWeight: '700', color: adminColors.ink }}>Product Summary</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: adminColors.card,
                    borderRadius: adminRadius.md,
                    borderWidth: 1,
                    borderColor: adminColors.border,
                    paddingVertical: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                  onPress={() => setGradeSubView('grade_summary')}
                  activeOpacity={0.8}
                >
                  <ReceiptPaperIcon color={adminColors.brand} size={20} />
                  <Text style={{ ...adminType.caption, fontWeight: '700', color: adminColors.ink }}>Grade Summary</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={customMismatchStyles.bottomBar}>
            <TouchableOpacity
              style={customMismatchStyles.orangeBottomBtn}
              activeOpacity={0.85}
              onPress={() => goToStep('damage_mismatch')}
            >
              <RightArrowIcon color={adminColors.onBrand} size={18} />
              <Text style={customMismatchStyles.orangeBottomBtnText}>Continue to Damage / Mismatch Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    // The product cannot change on a receipt, so only a grade mismatch is possible (derived, never typed).
    const hasMismatch = !gradeMatches;
    const openMismatch = (issue: GoodsReceiptDiscrepancyType) => {
      setSelectedIssueType(issue);
      goToStep('damage_mismatch');
    };
    const matchChip = (ok: boolean, label: string) => (
      <View style={[styles.matchChip, { backgroundColor: ok ? adminColors.success.bg : adminColors.danger.bg }]}>
        <Text style={[styles.matchChipText, { color: ok ? adminColors.success.text : adminColors.danger.text }]}>
          {label} {ok ? t('receiving.wizard.match') : t('receiving.wizard.mismatch')}
        </Text>
      </View>
    );
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Grade & Product Verification</Text>
            <Text style={styles.headerSub}>{receiptCode}</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {stepper('Grade')}

          <View style={styles.whiteCard}>
            <View style={styles.summaryMetaGrid}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.expectedProduct')}</Text>
                <Text style={styles.summaryMetaVal}>{expectedProduct}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.expectedGrade')}</Text>
                <Text style={styles.summaryMetaVal}>{expectedGrade}</Text>
              </View>
            </View>
          </View>

          {/* Actual Product, its match chip and the Product Mismatch card are hidden: warehouse admins cannot
              list crops, so no actual product can be picked (Gaps). */}

          <Text style={styles.inputLabel}>{t('receiving.wizard.actualGrade')}</Text>
          <TouchableOpacity
            style={styles.dropdownSelectBox}
            activeOpacity={0.7}
            onPress={() => pickFrom(t('receiving.wizard.actualGrade'), GRADES.map(g => ({ label: gradeLabel(g), onPick: () => setPickedGrade(g) })))}
          >
            <Text style={styles.dropdownValue}>{actualGrade}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>

          {gradeCheck !== null && gradeCheck.status !== 'noListedGrade' ? (
            <View style={styles.matchChipRow}>{matchChip(gradeMatches, t('receiving.wizard.gradeWord'))}</View>
          ) : null}

          <View style={styles.actionGrid}>
            <View style={styles.actionGridRow}>
              <TouchableOpacity style={styles.actionCard} onPress={() => openMismatch('QUALITY')} activeOpacity={0.8}>
                <WarningTriangleIcon color={adminColors.brand} size={18} />
                <Text style={styles.actionCardText}>Grade Mismatch</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.actionGridRow}>
              <TouchableOpacity style={styles.actionCard} onPress={() => goToStep('damage_mismatch')} activeOpacity={0.8}>
                <ReceiptPaperIcon color={adminColors.brand} size={18} />
                <Text style={styles.actionCardText}>Product Summary</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => goToStep('damage_mismatch')} activeOpacity={0.8}>
                <ReceiptPaperIcon color={adminColors.brand} size={18} />
                <Text style={styles.actionCardText}>Grade Summary</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            onPress={() => (hasMismatch ? openMismatch('QUALITY') : goToStep('receiving_decision'))}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <RightArrowIcon color={adminColors.onBrand} size={18} />
              <Text style={styles.primaryCtaText}>
                {hasMismatch ? 'Continue to Damage / Mismatch Report' : 'Continue to Decision'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 4: Receiving Decision (Step 4 of 5)
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'receiving_decision') {
    if (!isSub) {
      return (
        <View style={customMismatchStyles.root}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

          {/* Top Header Banner */}
          <View style={customMismatchStyles.header}>
            <View style={customMismatchStyles.headerRow}>
              <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                <BackArrowIcon color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={customMismatchStyles.headerTitle}>Acceptance Decision</Text>
            </View>
            <Text style={customMismatchStyles.headerSubtitle}>{receiptCode}</Text>
          </View>

          <ScrollView
            style={customMismatchStyles.scroll}
            contentContainerStyle={customMismatchStyles.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Quantity Overview Card */}
            <View style={customMismatchStyles.infoCard}>
              <View style={customMismatchStyles.gridRow}>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.expectedQuantity')}</Text>
                  <Text style={customMismatchStyles.gridVal}>{kgOrDash(expectedGrams)}</Text>
                </View>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.receivedQuantity')}</Text>
                  <Text style={customMismatchStyles.gridVal}>{kgOrDash(grossGrams)}</Text>
                </View>
              </View>

              {/* Accepted / rejected are the dash until a decision is made (there is no damage input to flag). */}
              <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.acceptedQuantity')}</Text>
                  <Text style={customMismatchStyles.gridVal}>{kgOrDash(shownAccepted)}</Text>
                </View>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.rejectedDamaged')}</Text>
                  <Text style={customMismatchStyles.gridVal}>{kgOrDash(shownRejected)}</Text>
                </View>
              </View>
            </View>

            {/* 2. Business Logic Disclaimer Box */}
            <View style={customMismatchStyles.noticeBox}>
              <Text style={customMismatchStyles.noticeText}>
                Only three documented outcomes exist: Accept, Partial Accept, Reject — no additional business outcome is invented.
              </Text>
            </View>

            {/* 3. Decision Option Cards */}
            {/* Option A: Accept */}
            <TouchableOpacity
              style={customMismatchStyles.optionCard}
              onPress={() => {
                setAcceptedGrams(grossGrams);
                goToStep('receipt_summary');
              }}
              activeOpacity={0.8}
            >
              <CheckmarkCircleOutlineIcon size={24} color={adminColors.success.text} />
              <View style={customMismatchStyles.optionContent}>
                <Text style={customMismatchStyles.optionTitle}>Accept</Text>
                <Text style={customMismatchStyles.optionSub}>Accept the applicable quantity</Text>
              </View>
            </TouchableOpacity>

            {/* Option B: Partial Accept */}
            <TouchableOpacity
              style={customMismatchStyles.optionCard}
              onPress={() => {
                // Navigation fix: the split is typed on Partial Acceptance (M2-11), never a sample 445 / 55.
                if (!isValidPartial(grossGrams, acceptedGrams)) {
                  setAcceptedGrams(null);
                  setAcceptedInput('');
                }
                goToStep('partial_acceptance');
              }}
              activeOpacity={0.8}
            >
              <PartialAcceptIcon size={24} color={adminColors.brand} />
              <View style={customMismatchStyles.optionContent}>
                <Text style={customMismatchStyles.optionTitle}>Partial Accept</Text>
                <Text style={customMismatchStyles.optionSub}>Accept some, reject the remainder</Text>
              </View>
            </TouchableOpacity>

            {/* Option C: Reject */}
            <TouchableOpacity
              style={customMismatchStyles.optionCard}
              onPress={() => {
                setAcceptedGrams(0);
                goToStep('receipt_summary');
              }}
              activeOpacity={0.8}
            >
              <RejectCircleIcon size={24} color={adminColors.danger.text} />
              <View style={customMismatchStyles.optionContent}>
                <Text style={customMismatchStyles.optionTitle}>Reject</Text>
                <Text style={customMismatchStyles.optionSub}>Reject the incoming goods</Text>
              </View>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receiving Decision</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {stepper('Decision')}

          {/* Metric Summary Table */}
          <View style={styles.decisionTableCard}>
            <View style={styles.decisionTableRow}>
              <Text style={styles.decisionTableLabel}>{t('receiving.wizard.expectedWord')}</Text>
              <Text style={styles.decisionTableValue}>{kgOrDash(expectedGrams)}</Text>
            </View>
            <View style={styles.decisionTableRow}>
              <Text style={styles.decisionTableLabel}>{t('receiving.wizard.receivedWord')}</Text>
              <Text style={styles.decisionTableValue}>{kgOrDash(grossGrams)}</Text>
            </View>
            <View style={styles.decisionTableRow}>
              <Text style={styles.decisionTableLabel}>{t('receiving.wizard.acceptedWord')}</Text>
              <Text style={[styles.decisionTableValue, { color: adminColors.success.text, fontWeight: '800' }]}>{kgOrDash(shownAccepted)}</Text>
            </View>
            <View style={[styles.decisionTableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.decisionTableLabel}>{t('receiving.wizard.rejectedWord')}</Text>
              <Text style={[styles.decisionTableValue, { color: adminColors.danger.text, fontWeight: '800' }]}>{kgOrDash(shownRejected)}</Text>
            </View>
          </View>

          {/* Choose an Outcome */}
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
              {grossGrams !== null ? (
                <Text style={styles.outcomeAcceptSub}>{t('receiving.wizard.acceptAll', { qty: kgLabel(grossGrams) })}</Text>
              ) : null}
            </View>
          </TouchableOpacity>

          {/* Outcome 2: Partial Accept (rejects part of the goods: inventory.produce.reject_incoming) */}
          {canReject && (
          <TouchableOpacity
            style={styles.outcomePartialCard}
            activeOpacity={0.8}
            onPress={() => {
              // The split is typed on Partial Acceptance; no sample rejection is pre-filled.
              if (!isValidPartial(grossGrams, acceptedGrams)) {
                setAcceptedGrams(null);
                setAcceptedInput('');
              }
              goToStep('partial_acceptance');
            }}
          >
            <View style={styles.outcomeIconBoxAmber}>
              <NotEqualIcon color={adminColors.warning.text} size={22} />
            </View>
            <View style={styles.outcomeTextBox}>
              <Text style={styles.outcomePartialTitle}>Partial Accept</Text>
              <Text style={styles.outcomePartialSub}>
                {isValidPartial(grossGrams, acceptedGrams) && acceptedGrams !== null && shownRejected !== null
                  ? t('receiving.wizard.partialSplit', { accepted: kgLabel(acceptedGrams), rejected: kgLabel(shownRejected) })
                  : t('receiving.wizard.partialHint')}
              </Text>
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
              {grossGrams !== null ? (
                <Text style={styles.outcomeRejectSub}>{t('receiving.wizard.rejectAll', { qty: kgLabel(grossGrams) })}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
          )}

          {/* Quality counter-offer: an action, not a fourth outcome (inventory.quality.counter_offer); it needs the recorded receipt */}
          {canOfferCounter && (
            <>
              <Text style={styles.sectionHeader}>Quality Counter-Offer</Text>
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
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 4C: Quality Counter-Offer (inventory.quality.counter_offer)
     POST /admin/goods-receipts/{id}/counter-offers on the recorded receipt (Idempotency-Key from the ring).
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'counter_offer') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Quality Counter-Offer</Text>
            <Text style={styles.headerSub}>{receiptCode}</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.whiteCard}>
            <View style={styles.summaryMetaGrid}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.product')}</Text>
                <Text style={styles.summaryMetaVal}>{expectedProduct}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.gradeActual')}</Text>
                <Text style={styles.summaryMetaVal}>{actualGrade}</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.acceptedQuantity')}</Text>
                <Text style={styles.summaryMetaVal}>{kgOrDash(shownAccepted)}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.qcIssues')}</Text>
                <Text style={styles.summaryMetaVal}>
                  {canQc ? t('receiving.wizard.issuesOf', { count: qcIssueCount, total: qcCriteria.length }) : t('receiving.wizard.dash')}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.inputLabel}>Revised Price per KG (₹)</Text>
          <TextInput
            style={[styles.textInput, { marginBottom: adminSpacing.lg }]}
            value={counterPrice}
            onChangeText={text => setCounterPrice(text.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={adminColors.placeholder}
          />

          <Text style={styles.inputLabel}>Reason</Text>
          <TextInput
            style={styles.describeIssueInput}
            placeholder="Quality found at receipt..."
            placeholderTextColor={adminColors.placeholder}
            multiline
            numberOfLines={3}
            value={counterReason}
            onChangeText={setCounterReason}
          />

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.primaryCtaBtn, (!counterPriceValid || busy || !canOfferCounter) && styles.primaryCtaBtnDisabled]}
            activeOpacity={0.85}
            disabled={!counterPriceValid || busy || !canOfferCounter}
            onPress={sendCounterOffer}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <SendPaperAirplaneIcon />
              <Text style={styles.primaryCtaText}>Send Counter-Offer</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 4B: Partial Acceptance (Sub-screen of Decision)
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'partial_acceptance') {
    // The API's rejection reason codes (QcRejectionReasonCode) replace the sample reason list.
    const rejectionReasons = QC_REJECTION_REASON_CODES;
    const partialValid = isValidPartial(grossGrams, acceptedGrams);

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Partial Acceptance / Rejection</Text>
            <Text style={styles.headerSub}>{t('receiving.wizard.productLevelDecision', { ref: receiptCode })}</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 3 Metric Stat Tiles */}
          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{kgOrDash(grossGrams)}</Text>
              <Text style={styles.statTileLabel}>{t('receiving.wizard.tile.received')}</Text>
            </View>

            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{kgOrDash(shownAccepted)}</Text>
              <Text style={styles.statTileLabel}>{t('receiving.wizard.tile.accepted')}</Text>
            </View>

            <View style={styles.statTile}>
              <Text style={[styles.statTileNumber, { color: adminColors.danger.text }]}>{kgOrDash(shownRejected)}</Text>
              <Text style={styles.statTileLabel}>{t('receiving.wizard.tile.rejected')}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>{t('receiving.wizard.partialDetail', { product: expectedProduct })}</Text>
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
                <Text style={styles.readOnlyValue}>{kgOrDash(shownRejected)}</Text>
              </View>
            </View>
          </View>

          {/* Rejection Reason */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Rejection Reason</Text>
            <Text style={styles.requiredTag}>Required</Text>
          </View>

          <View style={styles.issueTypeListCard}>
            {rejectionReasons.map((reason, idx) => {
              const isSelected = rejectionReasonCode === reason;
              const isLast = idx === rejectionReasons.length - 1;

              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.issueTypeRow, isLast && { borderBottomWidth: 0 }]}
                  onPress={() => setRejectionReasonCode(reason)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.radioOuterCircle, isSelected && styles.radioOuterCircleSelected]}>
                    {isSelected && <View style={styles.radioInnerCircle} />}
                  </View>
                  <Text style={[styles.issueTypeText, isSelected && styles.issueTypeTextSelected]}>
                    {rejectionReasonLabel(reason)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Additional Notes */}
          <Text style={styles.sectionHeader}>Additional Notes</Text>
          <TextInput
            style={styles.describeIssueInput}
            placeholder="Notes..."
            placeholderTextColor={adminColors.placeholder}
            multiline
            numberOfLines={3}
            value={partialNotes}
            onChangeText={setPartialNotes}
          />

          {/* Evidence is hidden: the wizard has no photo upload, and the thumbnail was a sample "attached" photo (Gaps). */}

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
     SCREEN 5: Receipt Summary (Step 5 of 5)
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'receipt_summary') {
    if (!isSub) {
      /** The real GRN (phase 1 recorded the receipt); hidden before there is one. */
      const grnCode = grn ?? '';
      const receiptReference =
        grn !== undefined ? (
          <>
            <Text style={[customMismatchStyles.sectionHeading, { marginTop: 8 }]}>Receipt Reference</Text>
            <View style={customMismatchStyles.referenceCard}>
              <Text style={customMismatchStyles.referenceText}>{grnCode}</Text>
            </View>
          </>
        ) : null;
      /** "Assign Batch" when a batch will be stocked (BR-106), else the confirm that sends the check from here. */
      const summaryBottomBar = (
        <View style={customMismatchStyles.bottomBar}>
          <TouchableOpacity
            style={customMismatchStyles.orangeBottomBtn}
            onPress={handleSummaryConfirm}
            activeOpacity={0.8}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={adminColors.onBrand} size="small" />
            ) : summaryStocks ? (
              <>
                <QrCodeIcon size={18} color={adminColors.onBrand} />
                <Text style={customMismatchStyles.orangeBottomBtnText}>Assign Batch</Text>
              </>
            ) : (
              <>
                <CheckmarkCircleOutlineIcon size={18} color={adminColors.onBrand} />
                <Text style={customMismatchStyles.orangeBottomBtnText}>{t('receiving.wizard.confirmGoodsReceipt')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );

      if (summarySubView === 'preview') {
        // M2-12A: the printable goods receipt note (BR-124) in the preview card's own slots.
        const documentGrn = documentRead.document === undefined ? undefined : receiptDocumentRows(documentRead.document).find(r => r.key === 'grn')?.value;
        const documentView = queryViewState({
          isLoading: documentRead.isLoading,
          error: documentRead.error,
          itemCount: documentGrn === undefined ? 0 : 1,
        });
        return (
          <View style={customMismatchStyles.root}>
            <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

            {/* Header: Receipt Preview */}
            <View style={customMismatchStyles.header}>
              <View style={customMismatchStyles.headerRow}>
                <TouchableOpacity onPress={() => setSummarySubView('main')} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                  <BackArrowIcon color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={customMismatchStyles.headerTitle}>Receipt Preview</Text>
              </View>
              <Text style={customMismatchStyles.headerSubtitle}>{grnCode}</Text>
            </View>

            <ScrollView
              style={customMismatchStyles.scroll}
              contentContainerStyle={customMismatchStyles.scrollPad}
              showsVerticalScrollIndicator={false}
            >
              <Text style={customMismatchStyles.sectionHeading}>Receipt Preview</Text>
              <View style={customMismatchStyles.whiteCard}>
                {documentView === 'loading' ? (
                  <AdminLoadingState />
                ) : documentView === 'error' ? (
                  <AdminErrorState error={documentRead.error} onRetry={documentRead.refresh} />
                ) : documentView === 'empty' ? (
                  <AdminEmptyState title={t('receiving.wizard.noReceipt')} />
                ) : (
                  <View style={customMismatchStyles.previewBox}>
                    <Text style={customMismatchStyles.previewBoxLabel}>Goods Receipt Note</Text>
                    <Text style={customMismatchStyles.previewBoxCode}>{documentGrn}</Text>
                  </View>
                )}
              </View>

              {receiptReference}

              <View style={{ height: 24 }} />
            </ScrollView>

            {summaryBottomBar}
          </View>
        );
      }

      if (summarySubView === 'detail') {
        return (
          <View style={customMismatchStyles.root}>
            <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

            {/* Header: Receipt Detail */}
            <View style={customMismatchStyles.header}>
              <View style={customMismatchStyles.headerRow}>
                <TouchableOpacity onPress={() => setSummarySubView('main')} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                  <BackArrowIcon color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={customMismatchStyles.headerTitle}>Receipt Detail</Text>
              </View>
              <Text style={customMismatchStyles.headerSubtitle}>{grnCode}</Text>
            </View>

            <ScrollView
              style={customMismatchStyles.scroll}
              contentContainerStyle={customMismatchStyles.scrollPad}
              showsVerticalScrollIndicator={false}
            >
              <Text style={customMismatchStyles.sectionHeading}>Receipt Detail</Text>
              {grn !== undefined ? (
                <View style={customMismatchStyles.whiteCard}>
                  <Text style={customMismatchStyles.detailBoxText}>{t('receiving.wizard.detailText', { grn: grnCode })}</Text>
                </View>
              ) : (
                <AdminEmptyState title={t('receiving.wizard.noReceipt')} />
              )}

              {receiptReference}

              <View style={{ height: 24 }} />
            </ScrollView>

            {summaryBottomBar}
          </View>
        );
      }

      if (summarySubView === 'activity') {
        // M2-12C: only what the API recorded, at its recorded times (never sample times).
        const activity = receiptActivity(liveReceipt, result, new Date(), submission.qc?.qualityCheck.checkedAt);
        return (
          <View style={customMismatchStyles.root}>
            <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

            {/* Header: Receipt Activity */}
            <View style={customMismatchStyles.header}>
              <View style={customMismatchStyles.headerRow}>
                <TouchableOpacity onPress={() => setSummarySubView('main')} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                  <BackArrowIcon color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={customMismatchStyles.headerTitle}>Receipt Activity</Text>
              </View>
              <Text style={customMismatchStyles.headerSubtitle}>{grnCode}</Text>
            </View>

            <ScrollView
              style={customMismatchStyles.scroll}
              contentContainerStyle={customMismatchStyles.scrollPad}
              showsVerticalScrollIndicator={false}
            >
              <Text style={customMismatchStyles.sectionHeading}>Receipt Activity</Text>
              {activity.length > 0 ? (
                <View style={customMismatchStyles.whiteCard}>
                  {activity.map((event, idx) => (
                    <React.Fragment key={event.key}>
                      {idx > 0 ? <View style={customMismatchStyles.activityDashedDivider} /> : null}
                      <View style={customMismatchStyles.activityRow}>
                        <Text style={customMismatchStyles.activityTitle}>{event.title}</Text>
                        <Text style={customMismatchStyles.activityTime}>{event.time}</Text>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              ) : receiptRead.isLoading ? (
                <AdminLoadingState />
              ) : receiptRead.error !== null && receiptRead.error !== undefined ? (
                <AdminErrorState error={receiptRead.error} onRetry={receiptRead.refresh} />
              ) : (
                <AdminEmptyState title={t('receiving.wizard.noReceipt')} />
              )}

              {receiptReference}

              <View style={{ height: 24 }} />
            </ScrollView>

            {summaryBottomBar}
          </View>
        );
      }

      {/* Main Goods Receipt Summary (Screenshot 4, Screen 1) */}
      return (
        <View style={customMismatchStyles.root}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

          {/* Top Header Banner */}
          <View style={customMismatchStyles.header}>
            <View style={customMismatchStyles.headerRow}>
              <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                <BackArrowIcon color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={customMismatchStyles.headerTitle}>Goods Receipt Summary</Text>
            </View>
            <Text style={customMismatchStyles.headerSubtitle}>{grnCode}</Text>
          </View>

          <ScrollView
            style={customMismatchStyles.scroll}
            contentContainerStyle={customMismatchStyles.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Shipment Section */}
            <Text style={customMismatchStyles.sectionHeading}>Shipment</Text>
            <View style={customMismatchStyles.infoCard}>
              <View style={customMismatchStyles.gridRow}>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.shipmentId')}</Text>
                  <Text style={customMismatchStyles.gridVal}>{receiptCode}</Text>
                </View>
                {sourceName !== '' ? (
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.source')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{sourceName}</Text>
                  </View>
                ) : null}
              </View>
              <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                {destinationName !== '' ? (
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.destination')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{destinationName}</Text>
                  </View>
                ) : null}
                {receiptDto !== null ? (
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.date')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{formatAdminDay(receiptDto.receivedAt)}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* 2. Quantity Section */}
            <Text style={customMismatchStyles.sectionHeading}>Quantity</Text>
            <View style={customMismatchStyles.infoCard}>
              <View style={customMismatchStyles.tableRow}>
                <Text style={customMismatchStyles.tableLabel}>{t('receiving.wizard.expectedWord')}</Text>
                <Text style={customMismatchStyles.tableVal}>{kgOrDash(expectedGrams)}</Text>
              </View>
              <View style={customMismatchStyles.tableRow}>
                <Text style={customMismatchStyles.tableLabel}>{t('receiving.wizard.receivedWord')}</Text>
                <Text style={customMismatchStyles.tableVal}>{kgOrDash(grossGrams)}</Text>
              </View>
              <View style={customMismatchStyles.tableRow}>
                <Text style={customMismatchStyles.tableLabel}>{t('receiving.wizard.acceptedWord')}</Text>
                <Text style={customMismatchStyles.tableVal}>{kgOrDash(shownAccepted)}</Text>
              </View>
              <View style={[customMismatchStyles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={customMismatchStyles.tableLabel}>{t('receiving.wizard.rejectedWord')}</Text>
                <Text style={customMismatchStyles.tableVal}>{kgOrDash(shownRejected)}</Text>
              </View>
            </View>

            {/* 3. Decision Section */}
            <Text style={customMismatchStyles.sectionHeading}>Decision</Text>
            <View style={customMismatchStyles.infoCard}>
              <View style={customMismatchStyles.decisionPill}>
                <Text style={customMismatchStyles.decisionPillText}>{outcomeUpper ?? t('receiving.wizard.dash')}</Text>
              </View>
            </View>

            {/* 4. Next Steps Section */}
            <Text style={customMismatchStyles.sectionHeading}>Next Steps</Text>
            <View style={customMismatchStyles.infoCard}>
              {summaryStocks ? (
                <TouchableOpacity
                  style={customMismatchStyles.assignBatchLinkRow}
                  activeOpacity={0.7}
                  disabled={busy}
                  onPress={handleSummaryConfirm}
                >
                  <Text style={customMismatchStyles.assignBatchLinkText}>Assign Batch →</Text>
                </TouchableOpacity>
              ) : null}
              <View style={customMismatchStyles.nextStepsRow}>
                <TouchableOpacity
                  style={customMismatchStyles.nextStepActionCard}
                  activeOpacity={0.75}
                  onPress={() => setSummarySubView('preview')}
                >
                  <EyeIcon size={20} color={adminColors.brand} />
                  <Text style={customMismatchStyles.nextStepActionText}>Preview</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={customMismatchStyles.nextStepActionCard}
                  activeOpacity={0.75}
                  onPress={() => setSummarySubView('detail')}
                >
                  <FileTextIcon size={20} color={adminColors.brand} />
                  <Text style={customMismatchStyles.nextStepActionText}>Full Detail</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={customMismatchStyles.nextStepActionCard}
                  activeOpacity={0.75}
                  onPress={() => setSummarySubView('activity')}
                >
                  <HistoryIcon size={20} color={adminColors.brand} />
                  <Text style={customMismatchStyles.nextStepActionText}>Activity</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 5. Receipt Reference Section */}
            {grn !== undefined ? (
              <>
                <Text style={customMismatchStyles.sectionHeading}>Receipt Reference</Text>
                <View style={customMismatchStyles.referenceCard}>
                  <Text style={customMismatchStyles.referenceText}>{grnCode}</Text>
                </View>
              </>
            ) : null}

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Bottom Bar: Assign Batch (or Confirm Goods Receipt when nothing is stocked) */}
          {summaryBottomBar}
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receipt Summary</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {stepper('Summary')}

          {/* Receipt Metadata Card (+ absorbed GoodsReceiptSummaryScreen shipment id / date) */}
          <View style={styles.whiteCard}>
            <Text style={styles.summaryCardReceiptCode}>{grn ?? receiptCode}</Text>
            <View style={styles.summaryMetaGrid}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.shipmentId')}</Text>
                <Text style={styles.summaryMetaVal}>{receiptCode}</Text>
              </View>
              {receiptDto !== null ? (
                <View style={styles.summaryMetaCol}>
                  <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.date')}</Text>
                  <Text style={styles.summaryMetaVal}>{formatAdminDay(receiptDto.receivedAt)}</Text>
                </View>
              ) : null}
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              {sourceName !== '' ? (
                <View style={styles.summaryMetaCol}>
                  <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.source')}</Text>
                  <Text style={styles.summaryMetaVal}>{sourceName}</Text>
                </View>
              ) : null}
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.destination')}</Text>
                <Text style={styles.summaryMetaVal}>{destinationName}</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.product')}</Text>
                <Text style={styles.summaryMetaVal}>{expectedProduct}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.gradeWord')}</Text>
                <Text style={styles.summaryMetaVal}>{actualGrade}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Decision</Text>
          <View style={styles.decisionOutcomeCard}>
            <Text style={styles.decisionOutcomeText}>{outcomeUpper ?? t('receiving.wizard.dash')}</Text>
          </View>

          {/* Metric Table Card */}
          <View style={styles.decisionTableCard}>
            <View style={styles.decisionTableRow}>
              <Text style={styles.decisionTableLabel}>{t('receiving.wizard.expectedWord')}</Text>
              <Text style={styles.decisionTableValue}>{kgOrDash(expectedGrams)}</Text>
            </View>
            <View style={styles.decisionTableRow}>
              <Text style={styles.decisionTableLabel}>{t('receiving.wizard.receivedWord')}</Text>
              <Text style={styles.decisionTableValue}>{kgOrDash(grossGrams)}</Text>
            </View>
            <View style={styles.decisionTableRow}>
              <Text style={styles.decisionTableLabel}>{t('receiving.wizard.acceptedWord')}</Text>
              <Text style={[styles.decisionTableValue, { color: adminColors.success.text, fontWeight: '800' }]}>{kgOrDash(shownAccepted)}</Text>
            </View>
            <View style={[styles.decisionTableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.decisionTableLabel}>{t('receiving.wizard.rejectedWord')}</Text>
              <Text style={[styles.decisionTableValue, { color: adminColors.danger.text, fontWeight: '800' }]}>{kgOrDash(shownRejected)}</Text>
            </View>
          </View>

          {/* QC Summary Checklist (from the recorded results; inventory.quality_check.perform) */}
          {canQc && (
            <>
              <Text style={styles.sectionHeader}>QC Summary</Text>
              <View style={styles.qcSummaryCard}>{qcSummaryRows(qcStatusMap)}</View>
            </>
          )}

          {/* Issues Box */}
          <Text style={styles.sectionHeader}>Issues</Text>
          <View style={styles.issuesCard}>
            <View style={styles.issuesIconCircle}>
              <AlertCircleOutlineIcon color={adminColors.danger.text} size={18} />
            </View>
            <View style={styles.issuesTextBox}>
              <Text style={styles.issuesTitle}>
                {shownRejected !== null && shownRejected > 0
                  ? t('receiving.wizard.rejectedQty', { qty: kgLabel(shownRejected) })
                  : t('receiving.wizard.noItemsRejected')}
              </Text>
              {shownRejected !== null && shownRejected > 0 && reasonLabel !== undefined ? (
                <Text style={styles.issuesSub}>{t('receiving.wizard.reasonLine', { reason: reasonLabel })}</Text>
              ) : null}
            </View>
          </View>

          {/* Evidence is hidden: the wizard has no photo upload, the thumbnails were samples (Gaps). */}

          {/* Absorbed GoodsReceiptSummaryScreen: next steps + receipt reference */}
          <Text style={styles.sectionHeader}>Next Steps</Text>
          <View style={styles.actionGridRow}>
            {receiptDto !== null ? (
              <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={() => goToStep('receipt_detail')}>
                <ReceiptPaperIcon color={adminColors.brand} size={18} />
                <Text style={styles.actionCardText}>Full Detail</Text>
              </TouchableOpacity>
            ) : null}
            {onViewHistory ? (
              <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={onViewHistory}>
                <ClockSmallIcon color={adminColors.brand} size={18} />
                <Text style={styles.actionCardText}>Activity</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {grn !== undefined ? (
            <>
              <Text style={styles.sectionHeader}>Receipt Reference</Text>
              <TouchableOpacity style={styles.referenceCard} activeOpacity={0.8} onPress={() => goToStep('receipt_detail')}>
                <Text style={styles.referenceText}>{grn}</Text>
              </TouchableOpacity>
            </>
          ) : null}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            disabled={busy}
            onPress={handleSummaryConfirm}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {busy ? (
                <ActivityIndicator color={adminColors.onBrand} size="small" />
              ) : summaryStocks ? (
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
     SCREEN 5B: Batch & Storage (absorbed BatchAssignmentScreen + Review Receiving putaway)
     Gate: inventory.batch.assign. Without it the summary submits directly.
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'batch_assignment') {
    if (!isSub) {
      /** The real GRN (phase 1); the batch exists only once the check answered (BR-106), so no batch code before. */
      const displayGrn = grn ?? '';
      const displayWh = destinationName;
      const displayProd = expectedProduct;
      const displayGrade = actualGrade;
      const displayAcceptedKg = kgOrDash(shownAccepted);
      const batchCode = decided ? result.batchCode : undefined;
      const batchSubtitle = batchCode === undefined ? null : (
        <Text style={customMismatchStyles.headerSubtitle}>{t('receiving.wizard.batchSubtitle', { code: batchCode })}</Text>
      );
      const storageView = queryViewState({ isLoading: storage.isLoading, error: storage.error, itemCount: storage.options.length });
      const confirmLocation = () => {
        void withBusy(() => runQc('storage', selectedLocation?.code));
      };

      if (batchSubView === 'confirm') {
        return (
          <View style={customMismatchStyles.root}>
            <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
            <View style={customMismatchStyles.header}>
              <View style={customMismatchStyles.headerRow}>
                <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                  <BackArrowIcon color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={customMismatchStyles.headerTitle}>Batch Creation Review</Text>
              </View>
              <Text style={customMismatchStyles.headerSubtitle}>{displayGrn}</Text>
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <View style={customMismatchStyles.confirmCard}>
                <View style={customMismatchStyles.confirmCardHeader}>
                  <QuestionCircleIcon size={22} color={adminColors.brandDeep} />
                  <Text style={customMismatchStyles.confirmCardTitle}>Confirm Batch Assignment?</Text>
                </View>

                <View style={customMismatchStyles.confirmInnerBox}>
                  <Text style={customMismatchStyles.confirmInnerText}>
                    {t('receiving.wizard.confirmBatchText', { qty: displayAcceptedKg, product: displayProd, warehouse: displayWh })}
                  </Text>
                </View>

                <View style={customMismatchStyles.confirmButtonsRow}>
                  <TouchableOpacity
                    style={customMismatchStyles.confirmActionBtn}
                    activeOpacity={0.75}
                    onPress={() => setBatchSubView('batch_created')}
                  >
                    <CheckmarkIcon size={14} color={adminColors.brand} />
                    <Text style={customMismatchStyles.confirmActionText}>Confirm</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={customMismatchStyles.cancelActionBtn}
                    activeOpacity={0.75}
                    onPress={() => setBatchSubView('review')}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path d="M18 6L6 18M6 6l12 12" stroke={adminColors.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={customMismatchStyles.cancelActionText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        );
      }

      if (batchSubView === 'batch_created') {
        return (
          <View style={customMismatchStyles.root}>
            <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
            <View style={customMismatchStyles.header}>
              <View style={customMismatchStyles.headerRow}>
                <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                  <BackArrowIcon color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={customMismatchStyles.headerTitle}>Batch Created</Text>
              </View>
              <Text style={customMismatchStyles.headerSubtitle}>{displayGrn}</Text>
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 20 }}>
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: adminColors.success.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  <QrCodeIcon size={24} color={adminColors.success.text} />
                </View>
                <Text style={{ ...adminType.title, fontWeight: '800', color: adminColors.ink }}>Batch Created</Text>
              </View>

              <View style={customMismatchStyles.whiteCard}>
                {/* The batch is created by the quality check (BR-106) at the storage confirm: no id or code before. */}
                {batchCode !== undefined ? (
                  <View style={customMismatchStyles.gridRow}>
                    <View style={customMismatchStyles.gridCol}>
                      <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.batchCode')}</Text>
                      <Text style={customMismatchStyles.gridVal}>{batchCode}</Text>
                    </View>
                  </View>
                ) : null}

                <View style={customMismatchStyles.gridRow}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.quantity')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayAcceptedKg}</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Product</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayProd} · {displayGrade}</Text>
                  </View>
                </View>

                <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Warehouse</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayWh}</Text>
                  </View>
                  {grn !== undefined ? (
                    <View style={customMismatchStyles.gridCol}>
                      <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.goodsReceipt')}</Text>
                      <Text style={customMismatchStyles.gridVal}>{displayGrn}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </ScrollView>

            <View style={customMismatchStyles.bottomBar}>
              <TouchableOpacity
                style={customMismatchStyles.orangeBottomBtn}
                activeOpacity={0.85}
                onPress={() => setBatchSubView('storage_assignment')}
              >
                <MapPinIcon size={18} color={adminColors.onBrand} />
                <Text style={customMismatchStyles.orangeBottomBtnText}>Assign Storage Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      if (batchSubView === 'storage_assignment') {
        return (
          <View style={customMismatchStyles.root}>
            <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
            <View style={customMismatchStyles.header}>
              <View style={customMismatchStyles.headerRow}>
                <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                  <BackArrowIcon color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={customMismatchStyles.headerTitle}>Storage Location Assignment</Text>
              </View>
              {batchSubtitle}
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <View style={customMismatchStyles.whiteCard}>
                <View style={customMismatchStyles.gridRow}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.warehouse')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayWh}</Text>
                  </View>
                  {batchCode !== undefined ? (
                    <View style={customMismatchStyles.gridCol}>
                      <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.batch')}</Text>
                      <Text style={customMismatchStyles.gridVal}>{batchCode}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.product')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{[displayProd, displayGrade].filter(v => v !== '').join(' · ')}</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.quantity')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayAcceptedKg}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={customMismatchStyles.secondaryBtn}
                activeOpacity={0.8}
                onPress={() =>
                  // No location set up at this warehouse: the check is sent without one (storageLocation is optional).
                  setBatchSubView(storageView === 'empty' ? 'location_review' : 'storage_list')
                }
              >
                <Text style={customMismatchStyles.secondaryBtnText}>Select Storage Location</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        );
      }

      if (batchSubView === 'storage_list') {
        return (
          <View style={customMismatchStyles.root}>
            <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
            <View style={customMismatchStyles.header}>
              <View style={customMismatchStyles.headerRow}>
                <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                  <BackArrowIcon color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={customMismatchStyles.headerTitle}>Storage Location List</Text>
              </View>
              {batchSubtitle}
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <Text style={customMismatchStyles.sectionHeading}>Storage Location List</Text>

              {storageView === 'loading' ? (
                <AdminLoadingState />
              ) : storageView === 'error' ? (
                <AdminErrorState error={storage.error} onRetry={storage.refresh} />
              ) : storageView === 'empty' ? (
                <AdminEmptyState title={t('receiving.wizard.storageEmpty')} />
              ) : (
                <View style={customMismatchStyles.whiteCard}>
                  {/* The warehouse's active locations (code, name, type, capacity); hierarchy and used KG are not served. */}
                  {storage.options.map((loc, idx) => (
                    <React.Fragment key={loc.id}>
                      {idx > 0 ? <View style={{ borderBottomWidth: 1, borderBottomColor: adminColors.border, marginVertical: 4 }} /> : null}
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectedLocationId(loc.id);
                          setBatchSubView('storage_detail');
                        }}
                      >
                        <View>
                          <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>{loc.label}</Text>
                          {loc.capacityGrams !== null ? (
                            <Text style={{ ...adminType.caption, color: adminColors.muted, marginTop: 3 }}>
                              {t('receiving.wizard.capacity', { qty: kgLabel(loc.capacityGrams) })}
                            </Text>
                          ) : null}
                        </View>
                        <ChevronRightIcon size={18} color={adminColors.muted} />
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        );
      }

      if (batchSubView === 'storage_detail') {
        return (
          <View style={customMismatchStyles.root}>
            <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
            <View style={customMismatchStyles.header}>
              <View style={customMismatchStyles.headerRow}>
                <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                  <BackArrowIcon color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={customMismatchStyles.headerTitle}>{selectedLocation?.label ?? ''}</Text>
              </View>
              {batchSubtitle}
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <Text style={customMismatchStyles.sectionHeading}>{selectedLocation?.label ?? ''}</Text>

              {/* Current Stock and Assigned Batches are hidden: used KG and batch counts per location are not served (Gaps). */}
              {selectedLocation?.capacityGrams !== null && selectedLocation?.capacityGrams !== undefined ? (
                <View style={customMismatchStyles.whiteCard}>
                  <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                    <View style={customMismatchStyles.gridCol}>
                      <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.capacityLabel')}</Text>
                      <Text style={customMismatchStyles.gridVal}>{kgLabel(selectedLocation.capacityGrams)}</Text>
                    </View>
                  </View>
                </View>
              ) : null}

              <TouchableOpacity
                style={customMismatchStyles.orangeBottomBtn}
                activeOpacity={0.85}
                onPress={() => setBatchSubView('location_review')}
              >
                <CheckmarkIcon size={14} color={adminColors.onBrand} />
                <Text style={customMismatchStyles.orangeBottomBtnText}>Assign This Location</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        );
      }

      if (batchSubView === 'location_review') {
        return (
          <View style={customMismatchStyles.root}>
            <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
            <View style={customMismatchStyles.header}>
              <View style={customMismatchStyles.headerRow}>
                <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                  <BackArrowIcon color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={customMismatchStyles.headerTitle}>Assignment Review</Text>
              </View>
              {batchSubtitle}
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <Text style={customMismatchStyles.sectionHeading}>Location Assignment Review</Text>

              <View style={customMismatchStyles.whiteCard}>
                <View style={customMismatchStyles.gridRow}>
                  {batchCode !== undefined ? (
                    <View style={customMismatchStyles.gridCol}>
                      <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.batch')}</Text>
                      <Text style={customMismatchStyles.gridVal}>{batchCode}</Text>
                    </View>
                  ) : null}
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.product')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayProd}</Text>
                  </View>
                </View>

                <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.quantity')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayAcceptedKg}</Text>
                  </View>
                  {selectedLocation !== undefined ? (
                    <View style={customMismatchStyles.gridCol}>
                      <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.selectedLocation')}</Text>
                      <Text style={customMismatchStyles.gridVal}>{selectedLocation.label}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </ScrollView>

            <View style={customMismatchStyles.bottomBar}>
              <TouchableOpacity
                style={customMismatchStyles.orangeBottomBtn}
                activeOpacity={0.85}
                onPress={() => setBatchSubView('confirm_location')}
              >
                <CheckmarkIcon size={14} color={adminColors.onBrand} />
                <Text style={customMismatchStyles.orangeBottomBtnText}>Confirm Assignment</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      if (batchSubView === 'confirm_location') {
        return (
          <View style={customMismatchStyles.root}>
            <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
            <View style={customMismatchStyles.header}>
              <View style={customMismatchStyles.headerRow}>
                <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                  <BackArrowIcon color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={customMismatchStyles.headerTitle}>Assignment Review</Text>
              </View>
              {batchSubtitle}
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <View style={customMismatchStyles.confirmCard}>
                <View style={customMismatchStyles.confirmCardHeader}>
                  <QuestionCircleIcon size={22} color={adminColors.brandDeep} />
                  <Text style={customMismatchStyles.confirmCardTitle}>Confirm Location Assignment?</Text>
                </View>

                <View style={customMismatchStyles.confirmInnerBox}>
                  <Text style={customMismatchStyles.confirmInnerText}>
                    {selectedLocation !== undefined
                      ? t('receiving.wizard.confirmLocationText', { qty: displayAcceptedKg, product: displayProd, location: selectedLocation.label })
                      : t('receiving.wizard.confirmNoLocationText', { qty: displayAcceptedKg, product: displayProd })}
                  </Text>
                </View>

                {/* Phase 2: the quality check stocks the batch AND sets this location in one call (BR-106). */}
                <View style={customMismatchStyles.confirmButtonsRow}>
                  <TouchableOpacity
                    style={customMismatchStyles.confirmActionBtn}
                    activeOpacity={0.75}
                    disabled={busy}
                    onPress={confirmLocation}
                  >
                    {busy ? <ActivityIndicator color={adminColors.brand} size="small" /> : <CheckmarkIcon size={14} color={adminColors.brand} />}
                    <Text style={customMismatchStyles.confirmActionText}>Confirm</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={customMismatchStyles.cancelActionBtn}
                    activeOpacity={0.75}
                    onPress={() => setBatchSubView('location_review')}
                  >
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path d="M18 6L6 18M6 6l12 12" stroke={adminColors.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={customMismatchStyles.cancelActionText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        );
      }

      if (batchSubView === 'assignment_complete') {
        return (
          <View style={customMismatchStyles.root}>
            <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
            <View style={customMismatchStyles.header}>
              <View style={customMismatchStyles.headerRow}>
                <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                  <BackArrowIcon color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={customMismatchStyles.headerTitle}>Assignment Complete</Text>
              </View>
              {batchSubtitle}
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', marginTop: 12, marginBottom: 20 }}>
                <View style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: adminColors.success.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="12" r="10" stroke={adminColors.success.text} strokeWidth="2" />
                    <Path d="M8 12l3 3 5-5" stroke={adminColors.success.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
                <Text style={{ ...adminType.title, fontWeight: '800', color: adminColors.ink }}>Assignment Complete</Text>
              </View>

              <View style={customMismatchStyles.whiteCard}>
                <View style={customMismatchStyles.gridRow}>
                  {batchCode !== undefined ? (
                    <View style={customMismatchStyles.gridCol}>
                      <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.batch')}</Text>
                      <Text style={customMismatchStyles.gridVal}>{batchCode}</Text>
                    </View>
                  ) : null}
                  {decided && result.storageLocation !== undefined ? (
                    <View style={customMismatchStyles.gridCol}>
                      <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.location')}</Text>
                      <Text style={customMismatchStyles.gridVal}>{locationLabel(result.storageLocation)}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.quantity')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayAcceptedKg}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={customMismatchStyles.bottomBar}>
              <TouchableOpacity
                style={customMismatchStyles.orangeBottomBtn}
                activeOpacity={0.85}
                onPress={() => {
                  if (onFinish) {
                    onFinish();
                  } else {
                    onBack();
                  }
                }}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="12" r="10" stroke={adminColors.onBrand} strokeWidth="2" />
                  <Path d="M8 12l3 3 5-5" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={customMismatchStyles.orangeBottomBtnText}>Receipt Completed — Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      if (batchSubView === 'review') {
        return (
          <View style={customMismatchStyles.root}>
            <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
            <View style={customMismatchStyles.header}>
              <View style={customMismatchStyles.headerRow}>
                <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                  <BackArrowIcon color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={customMismatchStyles.headerTitle}>Batch Creation Review</Text>
              </View>
              <Text style={customMismatchStyles.headerSubtitle}>{displayGrn}</Text>
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <Text style={customMismatchStyles.sectionHeading}>Batch Creation Review</Text>

              <View style={customMismatchStyles.whiteCard}>
                <View style={customMismatchStyles.gridRow}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Product</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayProd}</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Grade</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayGrade}</Text>
                  </View>
                </View>

                <View style={customMismatchStyles.gridRow}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.acceptedQty')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayAcceptedKg}</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Warehouse</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayWh}</Text>
                  </View>
                </View>

                <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Goods Receipt</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayGrn}</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.sourceRef')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{receiptCode}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={customMismatchStyles.bottomBar}>
              <TouchableOpacity
                style={customMismatchStyles.orangeBottomBtn}
                activeOpacity={0.85}
                onPress={() => setBatchSubView('confirm')}
              >
                <QrCodeIcon size={18} color={adminColors.onBrand} />
                <Text style={customMismatchStyles.orangeBottomBtnText}>Generate Batch Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      // Default: batchSubView === 'assignment'
      return (
        <View style={customMismatchStyles.root}>
          <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
          <View style={customMismatchStyles.header}>
            <View style={customMismatchStyles.headerRow}>
              <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                <BackArrowIcon color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={customMismatchStyles.headerTitle}>Batch Assignment</Text>
            </View>
            <Text style={customMismatchStyles.headerSubtitle}>{displayGrn}</Text>
          </View>

          <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
            <Text style={customMismatchStyles.sectionHeading}>Batch Information</Text>
            <View style={customMismatchStyles.whiteCard}>
              <View style={customMismatchStyles.gridRow}>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>Goods Receipt</Text>
                  <Text style={customMismatchStyles.gridVal}>{displayGrn}</Text>
                </View>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>Warehouse</Text>
                  <Text style={customMismatchStyles.gridVal}>{displayWh}</Text>
                </View>
              </View>

              <View style={customMismatchStyles.gridRow}>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>Product</Text>
                  <Text style={customMismatchStyles.gridVal}>{displayProd}</Text>
                </View>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>Grade</Text>
                  <Text style={customMismatchStyles.gridVal}>{displayGrade} (actual)</Text>
                </View>
              </View>

              <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.acceptedQuantity')}</Text>
                  <Text style={customMismatchStyles.gridVal}>{displayAcceptedKg}</Text>
                </View>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>Unit</Text>
                  <Text style={customMismatchStyles.gridVal}>KG</Text>
                </View>
              </View>
            </View>

            <Text style={customMismatchStyles.sectionHeading}>Traceability</Text>
            <View style={customMismatchStyles.whiteCard}>
              <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>Source Farmer</Text>
                  <Text style={customMismatchStyles.gridVal}>Internal reference only</Text>
                </View>
                {receiptDto !== null ? (
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.receivedDate')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{formatAdminDay(receiptDto.receivedAt)}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={{ height: 16 }} />
          </ScrollView>

          <View style={customMismatchStyles.bottomBar}>
            <TouchableOpacity
              style={customMismatchStyles.actionBtn}
              activeOpacity={0.85}
              onPress={() => setBatchSubView('review')}
            >
              <Text style={customMismatchStyles.actionBtnText}>Review Before Creating Batch</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    // Sub: the storage-ops Storage Location Assignment screen, rendered INSIDE the wizard (same component, so
    // nothing looks different) so the draft survives; its confirm sends the check (BR-106), then the confirmation.
    return (
      <StorageLocationAssignmentScreen
        scope={scope}
        can={can}
        onBack={handleBack}
        productName={[expectedProduct, actualGrade].filter(v => v !== '').join(' · ')}
        quantity={kgOrDash(shownAccepted)}
        warehouseId={recordWarehouseId}
        live={{
          options: storage.options,
          isLoading: storage.isLoading,
          error: storage.error,
          onRetry: storage.refresh,
          warehouseName: destinationName,
          confirming: busy,
          onConfirm: (locationId) => {
            const code = storage.options.find(o => o.id === locationId)?.code;
            void withBusy(() => runQc('storage', code));
          },
        }}
      />
    );
  }

  // SCREEN 6 (embedded Receiving History) is gone: "Activity" opens the host's live Receiving History
  // (onViewHistory); the embedded list only ever showed sample receipts.

  /* ──────────────────────────────────────────────────────────
     SCREEN 7: Receipt Detail: the receipt as recorded (GET /admin/goods-receipts/{id},
     with its quality check). Main: the shared ReceivingHistoryDetailScreen by receipt uuid.
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'receipt_detail') {
    if (isSub) {
      const current = liveReceipt;
      if (current === undefined) {
        if (receiptRead.isLoading) return stateFrame(<AdminLoadingState />);
        if (receiptRead.error !== null && receiptRead.error !== undefined) {
          return stateFrame(<AdminErrorState error={receiptRead.error} onRetry={receiptRead.refresh} />);
        }
        return stateFrame(<AdminEmptyState title={t('receiving.wizard.noReceipt')} />);
      }
      const check = current.qualityCheck;
      const accepted = current.result === 'Accepted';
      const shownGrade = check?.assignedGrade ?? current.grade;
      const shownReason = check?.rejectionReasonLabel ?? current.rejectionReason;
      return (
        <View style={styles.container}>
          <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleBack}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <BackArrowIcon />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>Goods Receipt</Text>
              <Text style={styles.headerSub}>{t('receiving.wizard.officialReceipt', { grn: current.receiptId })}</Text>
            </View>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.voucherReceiptCard}>
              <View style={styles.voucherHeaderRow}>
                <View>
                  <View
                    style={[
                      styles.voucherStatusPill,
                      { backgroundColor: accepted ? adminColors.success.bg : adminColors.warning.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.voucherStatusText,
                        { color: accepted ? adminColors.success.text : adminColors.warning.text },
                      ]}
                    >
                      {t('receiving.wizard.receiptStatus', { status: current.resultLabel.toUpperCase() })}
                    </Text>
                  </View>
                  <Text style={styles.voucherIdText}>{current.receiptId}</Text>
                  <Text style={styles.voucherDateText}>{current.day}</Text>
                </View>
                <View style={styles.voucherQrBox}>
                  <QrCodeIcon size={28} color={adminColors.brand} />
                </View>
              </View>

              <View style={styles.voucherDivider} />

              <View style={styles.summaryMetaGrid}>
                <View style={styles.summaryMetaCol}>
                  <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.product')}</Text>
                  <Text style={styles.summaryMetaVal}>{current.product}</Text>
                </View>
                <View style={styles.summaryMetaCol}>
                  <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.gradeWord')}</Text>
                  <Text style={styles.summaryMetaVal}>{shownGrade}</Text>
                </View>
              </View>

              <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
                <View style={styles.summaryMetaCol}>
                  <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.expectedQtyLabel')}</Text>
                  <Text style={styles.summaryMetaVal}>{kgOrDash(current.expectedGrams ?? expectedGrams)}</Text>
                </View>
                {current.acceptedGrams !== null ? (
                  <View style={styles.summaryMetaCol}>
                    <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.acceptedQty')}</Text>
                    <Text style={[styles.summaryMetaVal, { color: adminColors.success.text, fontWeight: '800' }]}>{kgLabel(current.acceptedGrams)}</Text>
                  </View>
                ) : null}
              </View>

              {current.rejectedGrams !== null && current.rejectedGrams > 0 && (
                <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
                  <View style={styles.summaryMetaCol}>
                    <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.rejectedQtyLabel')}</Text>
                    <Text style={[styles.summaryMetaVal, { color: adminColors.danger.text, fontWeight: '800' }]}>{kgLabel(current.rejectedGrams)}</Text>
                  </View>
                  {shownReason !== undefined ? (
                    <View style={styles.summaryMetaCol}>
                      <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.rejectionReason')}</Text>
                      <Text style={styles.summaryMetaVal}>{shownReason}</Text>
                    </View>
                  ) : null}
                </View>
              )}

              <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
                {sourceName !== '' ? (
                  <View style={styles.summaryMetaCol}>
                    <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.source')}</Text>
                    <Text style={styles.summaryMetaVal}>{sourceName}</Text>
                  </View>
                ) : null}
                <View style={styles.summaryMetaCol}>
                  <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.destination')}</Text>
                  <Text style={styles.summaryMetaVal}>{current.warehouseName !== '' ? current.warehouseName : destinationName}</Text>
                </View>
              </View>

              <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
                {current.batchCode !== undefined ? (
                  <View style={styles.summaryMetaCol}>
                    <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.batchReference')}</Text>
                    <Text style={styles.summaryMetaVal}>{current.batchCode}</Text>
                  </View>
                ) : null}
                {current.receivedBy !== undefined ? (
                  <View style={styles.summaryMetaCol}>
                    <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.receiver')}</Text>
                    <Text style={styles.summaryMetaVal}>{current.receivedBy}</Text>
                  </View>
                ) : null}
              </View>

              {/* Only a checked receipt is posted: an awaiting-QC receipt has no stock yet. */}
              {check !== null ? (
                <>
                  <View style={styles.voucherDivider} />

                  <View style={styles.voucherQcBadge}>
                    <CheckmarkCircleOutlineIcon size={22} color={adminColors.success.text} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.voucherQcTitle}>Verified & Posted to Ledger</Text>
                      <Text style={styles.voucherQcSub}>
                        {check.checkedBy !== undefined
                          ? t('receiving.wizard.inspectedBy', { name: check.checkedBy })
                          : t('receiving.wizard.stockUpdated')}
                      </Text>
                    </View>
                  </View>
                </>
              ) : null}
            </View>

            {/* Share / Print is hidden: there is no print or share of the receipt note yet (Gaps). */}
            <View style={{ gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                style={styles.actionSecondaryBtn}
                activeOpacity={0.8}
                onPress={handleBack}
              >
                <Text style={styles.actionSecondaryBtnText}>Back to Confirmation</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      );
    }

    if (receiptUuid === undefined) return stateFrame(<AdminEmptyState title={t('receiving.wizard.noReceipt')} />);
    return (
      <ReceivingHistoryDetailScreen
        scope={scope}
        can={can}
        onBack={handleBack}
        receiptId={receiptUuid}
        backLabel={t('receiving.wizard.backLabel')}
        onNavigateDiscrepancy={canRecord ? () => goToStep('damage_mismatch') : undefined}
        onViewBatch={onViewBatch}
        onTakeAction={() => goToStep('quality_check')}
      />
    );
  }

  // SCREENS 8-9 (Rejected Goods disposal, Record Handling) are not offered: no API records a disposal or
  // handling method (Gaps). The rejected weight and reason are recorded by the quality check itself (BR-120).

  /* ──────────────────────────────────────────────────────────
     SCREEN 10: Receiving in Progress
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'receiving_in_progress') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Receiving in Progress</Text>
            <Text style={styles.headerSub}>{receiptCode} · {expectedProduct}</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Draft Banner: a recorded receipt is no draft; it says what the API knows about it. */}
          <View style={styles.draftStatusBanner}>
            <PencilDraftIcon color={adminColors.warning.text} size={16} />
            <Text style={styles.draftStatusBannerText}>
              {receiptDto === null
                ? t('receiving.wizard.draftNotSubmitted')
                : result?.variant === 'awaiting' || result === null
                  ? t('receiving.wizard.recordedAwaitingQc')
                  : liveReceipt?.resultLabel ?? t('receiving.wizard.recordedAwaitingQc')}
            </Text>
          </View>

          {/* Receiving Progress */}
          <Text style={styles.sectionHeader}>Receiving Progress</Text>
          <View style={styles.whiteCard}>
            <TouchableOpacity style={styles.checklistRow} onPress={() => goToStep('start_receiving')} activeOpacity={0.7}>
              <View style={styles.checkCircleDone}>
                <CheckmarkIcon size={10} />
              </View>
              <Text style={styles.checklistRowText}>Shipment Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checklistRow} onPress={() => goToStep('quantity_verification')} activeOpacity={0.7}>
              <View style={styles.checkCircleDone}>
                <CheckmarkIcon size={10} />
              </View>
              <Text style={styles.checklistRowText}>Quantity Verification</Text>
            </TouchableOpacity>
            {canQc && (
              <TouchableOpacity style={styles.checklistRow} onPress={() => goToStep('continue_receiving')} activeOpacity={0.7}>
                <View style={styles.checkCircleActive} />
                <Text style={[styles.checklistRowText, { fontWeight: '700', color: adminColors.ink }]}>Quality Check</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.checklistRow} onPress={() => goToStep('grade_verification')} activeOpacity={0.7}>
              <View style={canQc ? styles.checkCirclePending : styles.checkCircleActive} />
              <Text style={[styles.checklistRowText, canQc ? { color: adminColors.muted } : { fontWeight: '700', color: adminColors.ink }]}>
                Grade & Product Verification
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.checklistRow, { borderBottomWidth: 0 }]} onPress={() => goToStep('receiving_decision')} activeOpacity={0.7}>
              <View style={styles.checkCirclePending} />
              <Text style={[styles.checklistRowText, { color: adminColors.muted }]}>Final Decision</Text>
            </TouchableOpacity>
          </View>

          {/* Quantity */}
          <Text style={styles.sectionHeader}>Quantity</Text>
          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{kgOrDash(expectedGrams)}</Text>
              <Text style={styles.statTileLabel}>{t('receiving.wizard.tile.expected')}</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{kgOrDash(grossGrams)}</Text>
              <Text style={styles.statTileLabel}>{t('receiving.wizard.tile.received')}</Text>
            </View>
          </View>

          {/* QC Progress is hidden: a check is recorded in one call, the API keeps no per-point progress (Gaps). */}

          {/* Sections */}
          <Text style={styles.sectionHeader}>Sections</Text>
          <View style={styles.whiteCard}>
            <TouchableOpacity style={styles.checklistRow} onPress={() => goToStep('quantity_verification')} activeOpacity={0.7}>
              <View style={styles.checkCircleDone}>
                <CheckmarkIcon size={10} />
              </View>
              <Text style={styles.checklistRowText}>Quantity Verification</Text>
            </TouchableOpacity>
            {canQc && (
              <TouchableOpacity style={styles.checklistRow} onPress={() => goToStep('continue_receiving')} activeOpacity={0.7}>
                <View style={styles.checkCircleActive} />
                <Text style={[styles.checklistRowText, { fontWeight: '700', color: adminColors.ink }]}>Quality Check</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.checklistRow} onPress={() => goToStep('damage_mismatch')} activeOpacity={0.7}>
              <View style={styles.checkCircleDone}>
                <CheckmarkIcon size={10} />
              </View>
              <Text style={styles.checklistRowText}>Damage Check</Text>
            </TouchableOpacity>
            {/* "Photos" is hidden: the wizard has no photo upload (Gaps). */}
            <TouchableOpacity style={[styles.checklistRow, { borderBottomWidth: 0 }]} onPress={() => goToStep('receiving_decision')} activeOpacity={0.7}>
              <View style={styles.checkCirclePending} />
              <Text style={[styles.checklistRowText, { color: adminColors.muted }]}>Final Decision</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            onPress={() => goToStep('continue_receiving')}
          >
            {/* Without the QC gate continue_receiving falls through to Grade & Product */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <RightArrowIcon />
              <Text style={styles.primaryCtaText}>Continue Receiving</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 11: Continue Receiving
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'continue_receiving') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Continue Receiving</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionHeader}>
            Quality Check
          </Text>

          <View style={[styles.whiteCard, { paddingVertical: 20, paddingHorizontal: 16 }]}>
            <Text style={{ ...adminType.title, fontWeight: '800', color: adminColors.ink, textAlign: 'left', marginBottom: 20 }}>
              {expectedProduct} — {expectedGrade}
            </Text>
            <View style={{ alignItems: 'center', paddingBottom: 6 }}>
              <Text style={{ ...adminType.title, fontWeight: '800', color: adminColors.ink, textAlign: 'center' }}>
                {t('receiving.wizard.checkOf', { n: qcCriteria.length, total: qcCriteria.length })}
              </Text>
              <Text style={{ ...adminType.caption, fontWeight: '700', color: adminColors.muted, letterSpacing: 0.8, marginTop: 4, textAlign: 'center', textTransform: 'uppercase' }}>
                {qcCriteria[qcCriteria.length - 1]?.title ?? ''}
              </Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            onPress={() => goToStep('grade_verification')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <RightArrowIcon />
              <Text style={styles.primaryCtaText}>Continue</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 12: Receipt Confirmation (Dynamic for Full Accept, Partial, and Full Reject)
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'receipt_confirmation') {
    // What was recorded: this session's check answer, else the receipt as read back (BR-106: batch only once stocked).
    if (result === null) {
      if (receiptRead.isLoading) return stateFrame(<AdminLoadingState />);
      if (receiptRead.error !== null && receiptRead.error !== undefined) {
        return stateFrame(<AdminErrorState error={receiptRead.error} onRetry={receiptRead.refresh} />);
      }
      return stateFrame(<AdminEmptyState title={t('receiving.wizard.noReceipt')} />);
    }
    const isAwaitingQc = result.variant === 'awaiting';
    const isFullReject = result.variant === 'reject';
    const isFullAccept = result.variant === 'accept';
    const isPartialAccept = result.variant === 'partial';
    const resultBatchCode = result.batchCode;
    const resultLocation = locationLabel(result.storageLocation);

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receipt Confirmation</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingTop: 14, paddingBottom: 40 }]}
          showsVerticalScrollIndicator={false}
        >

          {/* ─────────────── RECORDED, QC PENDING (no quality check permission, or not checked yet) ─────────────── */}
          {isAwaitingQc && (
            <>
              <View style={[styles.confirmationCheckCircle, { backgroundColor: adminColors.warning.bg, width: 56, height: 56, borderRadius: 28, marginTop: 10, marginBottom: 12 }]}>
                <ClockSmallIcon color={adminColors.warning.text} size={26} />
              </View>
              <Text style={[styles.confirmationMainTitle, { marginBottom: 4 }]}>{t('receiving.wizard.recordedAwaitingQc')}</Text>
              {!canQc ? (
                <Text style={{ ...adminType.body, color: adminColors.muted, textAlign: 'center', marginBottom: 20 }}>
                  {t('receiving.wizard.noQcPermission')}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[styles.actionPrimaryBtn, { justifyContent: 'flex-start', paddingHorizontal: 20, gap: 14, marginTop: 8 }]}
                activeOpacity={0.85}
                onPress={() => goToStep('receipt_detail')}
              >
                <ReceiptPaperIcon color={adminColors.onBrand} size={20} />
                <Text style={styles.actionPrimaryBtnText}>View Receipt</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ─────────────── VARIANT 1: FULL REJECTION (Image 1) ─────────────── */}
          {isFullReject && (
            <>
              <View style={[styles.confirmationCheckCircle, { backgroundColor: adminColors.danger.bg, width: 56, height: 56, borderRadius: 28, marginTop: 10, marginBottom: 12 }]}>
                <CrossCircleIcon color={adminColors.danger.text} size={28} />
              </View>
              <Text style={[styles.confirmationMainTitle, { marginBottom: 4 }]}>Goods Receipt Completed</Text>
              <Text style={{ ...adminType.body, color: adminColors.muted, textAlign: 'center', marginBottom: 20 }}>
                Full quantity rejected
              </Text>

              {/* Table */}
              <View style={styles.decisionTableCard}>
                <View style={styles.decisionTableRow}>
                  <Text style={styles.decisionTableLabel}>{t('receiving.wizard.expectedWord')}</Text>
                  <Text style={styles.decisionTableValue}>{kgOrDash(expectedGrams)}</Text>
                </View>
                <View style={styles.decisionTableRow}>
                  <Text style={styles.decisionTableLabel}>{t('receiving.wizard.acceptedWord')}</Text>
                  <Text style={styles.decisionTableValue}>{kgOrDash(result.acceptedGrams)}</Text>
                </View>
                <View style={[styles.decisionTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.decisionTableLabel}>{t('receiving.wizard.rejectedWord')}</Text>
                  <Text style={[styles.decisionTableValue, { color: adminColors.danger.text, fontWeight: '800' }]}>
                    {kgOrDash(result.rejectedGrams)}
                  </Text>
                </View>
              </View>

              {/* QC Result Card */}
              <View style={styles.whiteCard}>
                <Text style={{ ...adminType.body, color: adminColors.muted, marginBottom: 4, fontWeight: '500' }}>QC Result</Text>
                <Text style={{ ...adminType.sectionHead, fontWeight: '800', color: adminColors.ink }}>Rejected</Text>
              </View>

              {/* The Rejected Goods (disposal) card is hidden: no API records a disposal (Gaps). */}

              {/* Single Action: View Receipt */}
              <TouchableOpacity
                style={[styles.actionPrimaryBtn, { justifyContent: 'flex-start', paddingHorizontal: 20, gap: 14, marginTop: 8 }]}
                activeOpacity={0.85}
                onPress={() => goToStep('receipt_detail')}
              >
                <ReceiptPaperIcon color={adminColors.onBrand} size={20} />
                <Text style={styles.actionPrimaryBtnText}>View Receipt</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ─────────────── VARIANT 2: FULL ACCEPTANCE (Image 3) ─────────────── */}
          {isFullAccept && (
            <>
              <View style={[styles.confirmationCheckCircle, { backgroundColor: adminColors.success.bg, width: 56, height: 56, borderRadius: 28, marginTop: 10, marginBottom: 12 }]}>
                <CheckmarkIcon color={adminColors.success.text} size={26} />
              </View>
              <Text style={[styles.confirmationMainTitle, { marginBottom: 20 }]}>Goods Received</Text>

              {/* Table */}
              <View style={styles.decisionTableCard}>
                <View style={styles.decisionTableRow}>
                  <Text style={styles.decisionTableLabel}>{t('receiving.wizard.expectedWord')}</Text>
                  <Text style={styles.decisionTableValue}>{kgOrDash(expectedGrams)}</Text>
                </View>
                <View style={styles.decisionTableRow}>
                  <Text style={styles.decisionTableLabel}>{t('receiving.wizard.acceptedWord')}</Text>
                  <Text style={[styles.decisionTableValue, { color: adminColors.success.text, fontWeight: '800' }]}>
                    {kgOrDash(result.acceptedGrams)}
                  </Text>
                </View>
                <View style={[styles.decisionTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.decisionTableLabel}>{t('receiving.wizard.rejectedWord')}</Text>
                  <Text style={styles.decisionTableValue}>{kgOrDash(result.rejectedGrams)}</Text>
                </View>
              </View>

              {/* QC / Batch Card */}
              <View style={styles.whiteCard}>
                <View style={styles.summaryMetaGrid}>
                  {/* QC result from the recorded checks (was always "Passed"); QC gate only */}
                  {canQc && result.failedPoints !== null && (
                    <View style={styles.summaryMetaCol}>
                      <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.qcLabel')}</Text>
                      <Text style={[styles.summaryMetaVal, { marginTop: 3 }]}>
                        {result.failedPoints > 0
                          ? t('receiving.wizard.passedFlagged', { count: result.failedPoints })
                          : t('receiving.wizard.passed')}
                      </Text>
                    </View>
                  )}
                  {resultBatchCode !== undefined ? (
                    <View style={styles.summaryMetaCol}>
                      <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.batch')}</Text>
                      <Text style={[styles.summaryMetaVal, { marginTop: 3 }]}>{resultBatchCode}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Inventory Result Card */}
              {resultBatchCode !== undefined ? (
                <View style={[styles.whiteCard, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
                  <CrateInventoryIcon color={adminColors.warning.text} size={24} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...adminType.body, color: adminColors.muted, fontWeight: '500' }}>Full quantity accepted</Text>
                    <Text style={{ ...adminType.sectionHead, fontWeight: '800', color: adminColors.ink, marginTop: 2 }}>
                      {t('receiving.wizard.batchCreated', { code: resultBatchCode })}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Actions */}
              <View style={{ gap: 12, marginTop: 8 }}>
                {/* View Batch (inventory.batch.view), once there is a batch */}
                {canViewBatch && resultBatchCode !== undefined && (
                <TouchableOpacity
                  style={[styles.actionPrimaryBtn, { justifyContent: 'flex-start', paddingHorizontal: 20, gap: 14, marginBottom: 0 }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (onViewBatch && result.batchId !== undefined) {
                      onViewBatch(result.batchId);
                    } else if (resultBatchCode !== undefined) {
                      Alert.alert(
                        t('receiving.wizard.viewBatch'),
                        resultLocation !== undefined
                          ? t('receiving.wizard.viewBatchAtLocation', { code: resultBatchCode, qty: kgOrDash(result.acceptedGrams), product: expectedProduct, location: resultLocation })
                          : t('receiving.wizard.viewBatchText', { code: resultBatchCode, qty: kgOrDash(result.acceptedGrams), product: expectedProduct }),
                      );
                    }
                  }}
                >
                  <QrCodeIcon color={adminColors.onBrand} size={20} />
                  <Text style={styles.actionPrimaryBtnText}>View Batch</Text>
                </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionSecondaryBtn, { justifyContent: 'flex-start', paddingHorizontal: 20, gap: 14, marginBottom: 0 }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (onBackToShipments) onBackToShipments();
                    else onBack();
                  }}
                >
                  <TruckDeliveryIcon color={adminColors.warning.text} size={20} />
                  <Text style={[styles.actionSecondaryBtnText, { color: adminColors.warning.text }]}>Back to Incoming Shipments</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ─────────────── VARIANT 3: PARTIALLY ACCEPTED (Image 4) ─────────────── */}
          {isPartialAccept && (
            <>
              <View style={[styles.confirmationCheckCircle, { backgroundColor: adminColors.success.bg, width: 56, height: 56, borderRadius: 28, marginTop: 10, marginBottom: 12 }]}>
                <CheckmarkIcon color={adminColors.success.text} size={26} />
              </View>
              <Text style={[styles.confirmationMainTitle, { marginBottom: 20 }]}>Partially Accepted</Text>

              {/* Table */}
              <View style={styles.decisionTableCard}>
                <View style={styles.decisionTableRow}>
                  <Text style={styles.decisionTableLabel}>{t('receiving.wizard.expectedWord')}</Text>
                  <Text style={styles.decisionTableValue}>{kgOrDash(expectedGrams)}</Text>
                </View>
                <View style={styles.decisionTableRow}>
                  <Text style={styles.decisionTableLabel}>{t('receiving.wizard.acceptedWord')}</Text>
                  <Text style={[styles.decisionTableValue, { color: adminColors.success.text, fontWeight: '800' }]}>
                    {kgOrDash(result.acceptedGrams)}
                  </Text>
                </View>
                <View style={[styles.decisionTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.decisionTableLabel}>{t('receiving.wizard.rejectedWord')}</Text>
                  <Text style={[styles.decisionTableValue, { color: adminColors.danger.text, fontWeight: '800' }]}>
                    {kgOrDash(result.rejectedGrams)}
                  </Text>
                </View>
              </View>

              {/* Reason Card */}
              {result.reasonLabel !== undefined ? (
                <View style={styles.whiteCard}>
                  <Text style={{ ...adminType.body, color: adminColors.muted, marginBottom: 4, fontWeight: '500' }}>{t('receiving.wizard.reason')}</Text>
                  <Text style={{ ...adminType.sectionHead, fontWeight: '800', color: adminColors.ink }}>{result.reasonLabel}</Text>
                </View>
              ) : null}

              {/* Inventory Result Card */}
              {resultBatchCode !== undefined ? (
                <View style={[styles.whiteCard, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
                  <CrateInventoryIcon color={adminColors.warning.text} size={24} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...adminType.body, color: adminColors.muted, fontWeight: '500' }}>
                      {t('receiving.wizard.kgAccepted', { qty: kgOrDash(result.acceptedGrams) })}
                    </Text>
                    <Text style={{ ...adminType.sectionHead, fontWeight: '800', color: adminColors.ink, marginTop: 2 }}>
                      {t('receiving.wizard.batchCreated', { code: resultBatchCode })}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* The Rejected Goods (handling) card is hidden: no API records a disposal or handling (Gaps). */}

              {/* Actions */}
              <View style={{ gap: 12, marginTop: 8 }}>
                <TouchableOpacity
                  style={[styles.actionPrimaryBtn, { justifyContent: 'flex-start', paddingHorizontal: 20, gap: 14, marginBottom: 0 }]}
                  activeOpacity={0.85}
                  onPress={() => goToStep('receipt_detail')}
                >
                  <ReceiptPaperIcon color={adminColors.onBrand} size={20} />
                  <Text style={styles.actionPrimaryBtnText}>View Receipt</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionSecondaryBtn, { justifyContent: 'flex-start', paddingHorizontal: 20, gap: 14, marginBottom: 0 }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (onOpenInventory) onOpenInventory();
                    else onFinish?.();
                  }}
                >
                  <CrateInventoryIcon color={adminColors.warning.text} size={20} />
                  <Text style={[styles.actionSecondaryBtnText, { color: adminColors.warning.text }]}>Go to Inventory</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 13: Submission Error (M2-S16D)
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'submission_error') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Submission Error</Text>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, marginTop: -40 }}>
          <View style={[styles.confirmationCheckCircle, { backgroundColor: adminColors.danger.bg, width: 68, height: 68, borderRadius: 34, marginBottom: 20 }]}>
            <ErrorExclamationCircleIcon size={34} />
          </View>
          <Text style={styles.allChecksCompletedTitle}>Unable to Complete Receiving</Text>
          {/* Never the server's own message: the error maps to an i18n key (adminErrorKey). */}
          <Text style={styles.allChecksCompletedSub}>
            {failure === null
              ? t('receiving.wizard.submitFailed')
              : failure.unknown
                ? t('receiving.wizard.unknownOutcome')
                : failure.retry.kind === 'qc' && grn !== undefined
                  ? `${t(adminErrorKey(failure.error))} ${t('receiving.wizard.receiptKept', { grn })}`
                  : t(adminErrorKey(failure.error))}
          </Text>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.primaryCtaBtn, failure === null && styles.primaryCtaBtnDisabled]}
            activeOpacity={0.85}
            disabled={busy || failure === null}
            onPress={handleRetrySubmission}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {busy ? (
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

  /* ──────────────────────────────────────────────────────────
     SCREEN 13: Damage / Mismatch (BR-121): the receipt's persisted reports
     (GET .../discrepancies) plus this session's reports still to send.
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'damage_mismatch') {
    const reportIcon = (row: DiscrepancyRow) =>
      row.type === 'QUANTITY' ? ScaleIcon : row.type === 'QUALITY' ? StarIcon : AlertCircleOutlineIcon;
    const reportTitle = (row: DiscrepancyRow) => t('receiving.wizard.reportTitle', { type: row.typeLabel, product: expectedProduct });
    const reportSubtitle = (row: DiscrepancyRow) => t('receiving.wizard.reportSides', { expected: row.expected, actual: row.actual });

    if (!isSub) {
      if (mismatchSubView === 'detail' && selectedReport !== undefined) {
        const report = selectedReport;
        return (
          <View style={customMismatchStyles.root}>
            <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

            {/* Header: Discrepancy Detail */}
            <View style={customMismatchStyles.header}>
              <View style={customMismatchStyles.headerRow}>
                <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                  <BackArrowIcon color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={customMismatchStyles.headerTitle}>Discrepancy Detail</Text>
              </View>
              <Text style={customMismatchStyles.headerSubtitle}>{t('receiving.wizard.combinedDiscrepancies', { ref: receiptCode })}</Text>
            </View>

            <ScrollView
              style={customMismatchStyles.scroll}
              contentContainerStyle={customMismatchStyles.scrollPad}
              showsVerticalScrollIndicator={false}
            >
              <Text style={customMismatchStyles.sectionHeading}>{t('receiving.wizard.discrepancyDetailHeading', { type: report.typeLabel })}</Text>

              {/* Info Card: id / creator / created only once the report is persisted. */}
              <View style={customMismatchStyles.infoCard}>
                <View style={customMismatchStyles.gridRow}>
                  {report.id !== undefined ? (
                    <View style={customMismatchStyles.gridCol}>
                      <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.discrepancyId')}</Text>
                      <Text style={customMismatchStyles.gridVal}>{shortId(report.id)}</Text>
                    </View>
                  ) : null}
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.type')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{report.typeLabel}</Text>
                  </View>
                </View>

                <View style={customMismatchStyles.gridRow}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.product')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{expectedProduct}</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.expectedWord')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{report.expected}</Text>
                  </View>
                </View>

                <View style={customMismatchStyles.gridRow}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.actual')}</Text>
                    <Text style={customMismatchStyles.gridVal}>{report.actual}</Text>
                  </View>
                  {report.createdBy !== undefined ? (
                    <View style={customMismatchStyles.gridCol}>
                      <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.createdBy')}</Text>
                      <Text style={customMismatchStyles.gridVal}>{report.createdBy}</Text>
                    </View>
                  ) : null}
                </View>

                {report.createdOn !== undefined ? (
                  <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                    <View style={customMismatchStyles.gridCol}>
                      <Text style={customMismatchStyles.gridLabel}>{t('receiving.wizard.created')}</Text>
                      <Text style={customMismatchStyles.gridVal}>{report.createdOn}</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* Notes Card */}
              {report.note !== undefined ? (
                <View style={customMismatchStyles.notesCard}>
                  <Text style={customMismatchStyles.notesPlaceholder}>{report.note}</Text>
                </View>
              ) : null}

              <View style={{ height: 24 }} />
            </ScrollView>

            {/* Bottom Button */}
            <View style={customMismatchStyles.bottomBar}>
              <TouchableOpacity
                style={customMismatchStyles.actionBtn}
                onPress={() => leaveMismatch('receiving_decision')}
                activeOpacity={0.8}
                disabled={busy}
              >
                <RightArrowIcon size={18} color={adminColors.onBrand} />
                <Text style={customMismatchStyles.actionBtnText}>Continue to Acceptance Decision</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      return (
        <View style={customMismatchStyles.root}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

          {/* Top Header Banner (Screenshot 1) */}
          <View style={customMismatchStyles.header}>
            <View style={customMismatchStyles.headerRow}>
              <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                <BackArrowIcon color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={customMismatchStyles.headerTitle}>Damage / Mismatch Report</Text>
            </View>
            <Text style={customMismatchStyles.headerSubtitle}>{t('receiving.wizard.combinedDiscrepancies', { ref: receiptCode })}</Text>
          </View>

          <ScrollView
            style={customMismatchStyles.scroll}
            contentContainerStyle={customMismatchStyles.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            {/* Discrepancy Card List */}
            {reportsView === 'loading' ? (
              <AdminLoadingState />
            ) : reportsView === 'error' ? (
              <AdminErrorState error={discrepancyRead.error} onRetry={discrepancyRead.refresh} />
            ) : reportsView === 'empty' ? (
              <AdminEmptyState title={t('receiving.wizard.noDiscrepancies')} />
            ) : (
              <View style={customMismatchStyles.listCard}>
                {reportRows.map((item, index) => {
                  const isLast = index === reportRows.length - 1;
                  const IconComp = reportIcon(item);
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[customMismatchStyles.itemRow, !isLast && customMismatchStyles.itemRowBorder]}
                      onPress={() => {
                        setSelectedReportKey(item.key);
                        setMismatchSubView('detail');
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={customMismatchStyles.iconCircle}>
                        <IconComp size={18} color={adminColors.brand} />
                      </View>
                      <View style={customMismatchStyles.itemContent}>
                        <Text style={customMismatchStyles.itemTitle}>{reportTitle(item)}</Text>
                        <Text style={customMismatchStyles.itemSub}>{reportSubtitle(item)}</Text>
                      </View>
                      <View style={customMismatchStyles.badge}>
                        <Text style={customMismatchStyles.badgeText}>{item.statusLabel}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Secondary Action Button: View Mismatch Summary */}
            <TouchableOpacity
              style={customMismatchStyles.secondaryBtn}
              onPress={() => goToStep('receipt_summary')}
              activeOpacity={0.8}
            >
              <Text style={customMismatchStyles.secondaryBtnText}>View Mismatch Summary</Text>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Pinned Bottom Action Button: persists the session's reports once, then the decision. */}
          <View style={customMismatchStyles.bottomBar}>
            <TouchableOpacity
              style={customMismatchStyles.actionBtn}
              onPress={() => leaveMismatch('receiving_decision')}
              activeOpacity={0.8}
              disabled={busy}
            >
              {busy ? <ActivityIndicator color={adminColors.onBrand} size="small" /> : <RightArrowIcon size={18} color={adminColors.onBrand} />}
              <Text style={customMismatchStyles.actionBtnText}>Continue to Acceptance Decision</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Damage / Mismatch</Text>
            <Text style={styles.headerSub}>{t('receiving.wizard.combinedDiscrepancies', { ref: receiptCode })}</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Absorbed DamageMismatchReportScreen: the receipt's reports and the ones found so far in this session */}
          {reportRows.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Discrepancies</Text>
              <View style={styles.issueTypeListCard}>
                {reportRows.map((d, idx) => (
                  <View
                    key={d.key}
                    style={[styles.issueTypeRow, idx === reportRows.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <View style={styles.discrepancyIconCircle}>
                      <AlertCircleOutlineIcon color={adminColors.brand} size={18} />
                    </View>
                    <View style={styles.bayTextBox}>
                      <Text style={styles.issueTypeTextSelected}>{reportTitle(d)}</Text>
                      <Text style={styles.baySub}>{reportSubtitle(d)}</Text>
                    </View>
                    <View style={[styles.historyStatusPill, { backgroundColor: adminColors.brandTint }]}>
                      <Text style={[styles.historyStatusText, { color: adminColors.brandDeep }]}>{d.statusLabel}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* The API's report types (GoodsReceiptDiscrepancyType) replace the sample issue list. */}
          <Text style={styles.sectionHeader}>Issue Type</Text>
          <View style={styles.issueTypeListCard}>
            {DISCREPANCY_TYPES.map((type, idx) => {
              const isSelected = selectedIssueType === type;
              const isLast = idx === DISCREPANCY_TYPES.length - 1;

              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.issueTypeRow, isLast && { borderBottomWidth: 0 }]}
                  onPress={() => setSelectedIssueType(type)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.radioOuterCircle, isSelected && styles.radioOuterCircleSelected]}>
                    {isSelected && <View style={styles.radioInnerCircle} />}
                  </View>
                  <Text style={[styles.issueTypeText, isSelected && styles.issueTypeTextSelected]}>
                    {discrepancyTypeLabel(type)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionHeader}>Quantity</Text>
          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{kgOrDash(expectedGrams)}</Text>
              <Text style={styles.statTileLabel}>{t('receiving.wizard.tile.expected')}</Text>
            </View>

            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{kgOrDash(grossGrams)}</Text>
              <Text style={styles.statTileLabel}>{t('receiving.wizard.tile.received')}</Text>
            </View>

            <View style={styles.statTile}>
              <Text
                style={[
                  styles.statTileNumber,
                  quantity.differenceGrams !== null && quantity.differenceGrams !== 0 && { color: adminColors.danger.text },
                ]}
              >
                {signedKg(quantity.differenceGrams)}
              </Text>
              <Text style={styles.statTileLabel}>
                {quantity.status === 'Excess' ? t('receiving.wizard.tile.excess') : t('receiving.wizard.tile.shortage')}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Describe the Issue</Text>
          <TextInput
            style={styles.describeIssueInput}
            placeholder={t('receiving.wizard.describePlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            multiline
            numberOfLines={3}
            value={issueDescription}
            onChangeText={setIssueDescription}
          />

          {/* Evidence is hidden: the wizard has no photo upload, and "Add Evidence" faked an attachment (Gaps). */}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            disabled={busy}
            onPress={() => leaveMismatch(afterMismatchStep)}
          >
            {busy ? (
              <ActivityIndicator color={adminColors.onBrand} size="small" />
            ) : (
              <Text style={styles.primaryCtaText}>
                {afterMismatchStep === 'receiving_decision' ? 'Continue to Acceptance Decision  →' : 'Continue  →'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 14: Review Receiving (absorbed SubWarehouseReviewReceivingScreen)
     One-page review: shipment, weight & tally, inspection checklist (QC gate),
     putaway bay (batch gate), accept (record gate) / report variance (reject gate).
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'review_receiving') {
    const completeReview = () => {
      setIsReviewSuccessVisible(false);
      if (onFinish) onFinish();
      else onBack();
    };
    const reviewLocation = storage.options.find(o => o.id === selectedLocationId);
    /** Records the receipt (gross + crates, BR-123) and, with the QC permission, its check accepting the full weight. */
    const acceptReview = () => {
      void withBusy(() => (canQc ? runQc('review', reviewLocation?.code) : recordOnly('receipt_confirmation', reviewPackages)));
    };
    const reviewResult = result !== null && result.variant !== 'awaiting' ? result : null;
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Review Receiving</Text>
            <Text style={styles.headerSub}>
              {t('receiving.wizard.shipmentRef', { ref: receiptCode })}
              {destinationName ? ` · ${destinationName}` : ''}
            </Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 1. Inward shipment overview */}
          <View style={styles.whiteCard}>
            <View style={styles.reviewCardHeaderRow}>
              <View style={styles.reviewSourceRow}>
                <TruckDeliveryIcon color={adminColors.brand} size={18} />
                <Text style={styles.reviewSourceText}>{sourceName}</Text>
              </View>
              <View style={[styles.historyStatusPill, { backgroundColor: adminColors.warning.bg }]}>
                <Text style={[styles.historyStatusText, { color: adminColors.warning.text }]}>
                  {liveReceipt?.resultLabel ?? ship.statusLabel}
                </Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.reference')}</Text>
                <Text style={styles.summaryMetaVal}>{receiptCode}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.expectedQuantity')}</Text>
                <Text style={styles.summaryMetaVal}>{kgOrDash(expectedGrams)}</Text>
              </View>
            </View>
            {/* Vehicle and arrival time exist only once the receipt is recorded (no driver is recorded). */}
            {receiptDto !== null ? (
              <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
                {liveReceipt?.vehicleNumber !== undefined ? (
                  <View style={styles.summaryMetaCol}>
                    <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.vehicleDriver')}</Text>
                    <Text style={styles.summaryMetaVal}>{liveReceipt.vehicleNumber}</Text>
                  </View>
                ) : null}
                <View style={styles.summaryMetaCol}>
                  <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.arrivalTime')}</Text>
                  <Text style={styles.summaryMetaVal}>{formatAdminTime(receiptDto.receivedAt)}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* 2. Weight & tally verification */}
          <Text style={styles.sectionHeader}>Weight & Tally Verification</Text>
          <View style={styles.whiteCard}>
            <View style={styles.produceInnerCard}>
              <Text style={styles.produceTitle}>
                {expectedGrade !== '' ? t('receiving.wizard.productWithGrade', { product: expectedProduct, grade: expectedGrade }) : expectedProduct}
              </Text>
            </View>
            <View style={[styles.rowTwoCols, { marginTop: adminSpacing.md }]}>
              <View style={styles.colHalf}>
                <Text style={styles.inputLabel}>Gross Scale Weight (KG)</Text>
                <TextInput
                  style={[styles.textInput, grossLocked && styles.readOnlyInput]}
                  value={grossLocked ? (grossGrams === null ? '' : formatKgNumber(grossGrams)) : grossInput}
                  onChangeText={value => setGrossInput(value.replace(/[^0-9.]/g, ''))}
                  editable={!grossLocked}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.inputLabel}>No. of Crates</Text>
                <TextInput
                  style={[styles.textInput, grossLocked && styles.readOnlyInput]}
                  value={grossLocked ? String(receiptDto?.packageCount ?? '') : crateCount}
                  onChangeText={value => setCrateCount(value.replace(/[^0-9]/g, ''))}
                  editable={!grossLocked}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            {/* Tare and Net Verified are hidden: no crate tare weight is served; the receipt records the gross (Gaps). */}
            <View style={styles.weightSummaryBox}>
              <View style={styles.weightSummaryItem}>
                <Text style={styles.summaryMetaLabel}>{t('receiving.wizard.gross')}</Text>
                <Text style={styles.summaryMetaVal}>{kgOrDash(grossGrams)}</Text>
              </View>
            </View>
          </View>

          {/* 3. Quality inspection parameters (inventory.quality_check.perform) */}
          {canQc && (
            <>
              <Text style={styles.sectionHeader}>Quality Inspection Parameters</Text>
              <View style={styles.issueTypeListCard}>
                {/* The API's five check points (ticked = passed) replace the three sample parameters. */}
                {qcCriteria.map((p, idx) => {
                  const checked = inspection[p.id];
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.issueTypeRow, idx === qcCriteria.length - 1 && { borderBottomWidth: 0 }]}
                      onPress={() => setInspection(prev => ({ ...prev, [p.id]: !checked }))}
                      activeOpacity={0.8}
                    >
                      <CheckboxSquareIcon checked={checked} />
                      <View style={styles.bayTextBox}>
                        <Text style={styles.issueTypeTextSelected}>{p.title}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* 4. Putaway storage destination (inventory.batch.assign) */}
          {canBatch && (
            <>
              <Text style={styles.sectionHeader}>Putaway Storage Destination</Text>
              {storage.options.length === 0 ? (
                storage.isLoading ? (
                  <AdminLoadingState />
                ) : storage.error !== null && storage.error !== undefined ? (
                  <AdminErrorState error={storage.error} onRetry={storage.refresh} />
                ) : (
                  <AdminEmptyState title={t('receiving.wizard.storageEmpty')} />
                )
              ) : (
                <View style={styles.issueTypeListCard}>
                  {storage.options.map((bay, idx) => {
                    const isSelected = bay.id === selectedLocationId;
                    return (
                      <TouchableOpacity
                        key={bay.id}
                        style={[styles.issueTypeRow, idx === storage.options.length - 1 && { borderBottomWidth: 0 }]}
                        onPress={() => setSelectedLocationId(bay.id)}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.radioOuterCircle, isSelected && styles.radioOuterCircleSelected]}>
                          {isSelected && <View style={styles.radioInnerCircle} />}
                        </View>
                        <View style={styles.bayTextBox}>
                          <Text style={[styles.issueTypeText, isSelected && styles.issueTypeTextSelected]}>
                            {bay.zone !== '' ? `${bay.label} · ${bay.zone}` : bay.label}
                          </Text>
                          {bay.capacityGrams !== null ? (
                            <Text style={styles.baySub}>{t('receiving.wizard.capacity', { qty: kgLabel(bay.capacityGrams) })}</Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {/* Actions */}
          <View style={styles.reviewActions}>
            <TouchableOpacity
              style={[styles.actionPrimaryBtn, (busy || grossGrams === null) && styles.primaryCtaBtnDisabled]}
              onPress={acceptReview}
              disabled={busy || grossGrams === null}
              activeOpacity={0.85}
            >
              {busy ? <ActivityIndicator color={adminColors.onBrand} size="small" /> : <CheckmarkIcon color={adminColors.onBrand} size={18} />}
              <Text style={styles.actionPrimaryBtnText}>{t('receiving.wizard.acceptAddInventory', { qty: kgOrDash(grossGrams) })}</Text>
            </TouchableOpacity>

            {/* "Report Variance" is hidden: it only flagged locally and went back; no API records such a flag (Gaps). */}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Acceptance success. The scrim was 50% translucent black: no translucent token
            exists, so the backdrop is the solid canvas and the card is raised (adminShadow.lg). */}
        <Modal visible={isReviewSuccessVisible} transparent animationType="fade" onRequestClose={completeReview}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={[styles.confirmationCheckCircle, { backgroundColor: adminColors.success.bg }]}>
                <CheckmarkIcon color={adminColors.success.text} size={26} />
              </View>
              <Text style={styles.confirmationMainTitle}>Receiving Confirmed!</Text>
              <Text style={styles.modalDesc}>
                {t('receiving.wizard.shipmentWord')} <Text style={{ fontWeight: '700', color: adminColors.ink }}>{receiptCode}</Text> {t('receiving.wizard.verifiedAnd')}{' '}
                <Text style={{ fontWeight: '700', color: adminColors.brand }}>
                  {t('receiving.wizard.qtyOfProduct', { qty: kgOrDash(reviewResult?.acceptedGrams), product: expectedProduct })}
                </Text>{' '}
                {t('receiving.wizard.addedToInventory', { warehouse: destinationName })}
              </Text>
              <View style={styles.modalReceiptCard}>
                {grn !== undefined ? (
                  <Text style={styles.modalReceiptRow}>
                    <Text style={{ color: adminColors.muted }}>{t('receiving.wizard.grnNumberLabel')}</Text>
                    <Text style={{ fontWeight: '700', color: adminColors.ink }}>{grn}</Text>
                  </Text>
                ) : null}
                {reviewResult?.batchCode !== undefined ? (
                  <Text style={styles.modalReceiptRow}>
                    <Text style={{ color: adminColors.muted }}>{t('receiving.wizard.batchLabel')}</Text>
                    <Text style={{ fontWeight: '700', color: adminColors.ink }}>{reviewResult.batchCode}</Text>
                  </Text>
                ) : null}
                {reviewResult?.storageLocation !== undefined ? (
                  <Text style={styles.modalReceiptRow}>
                    <Text style={{ color: adminColors.muted }}>{t('receiving.wizard.storageBayLabel')}</Text>
                    <Text style={{ fontWeight: '700', color: adminColors.ink }}>{locationLabel(reviewResult.storageLocation)}</Text>
                  </Text>
                ) : null}
                {receiverName !== undefined ? (
                  <Text style={styles.modalReceiptRow}>
                    <Text style={{ color: adminColors.muted }}>{t('receiving.wizard.verifiedByLabel')}</Text>
                    <Text style={{ fontWeight: '700', color: adminColors.ink }}>{receiverName}</Text>
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity style={[styles.actionPrimaryBtn, styles.modalDoneBtn]} onPress={completeReview} activeOpacity={0.85}>
                <Text style={styles.actionPrimaryBtnText}>Done & Return to Dashboard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // A step this wizard does not draw (the embedded history list is gone): the plain frame, never a blank screen.
  return stateFrame(<AdminEmptyState title={t('receiving.wizard.noShipment')} />);
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
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 14,
    ...adminShadow.sm,
  },
  criteriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  criteriaIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
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
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  criteriaTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  choiceBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderRadius: 12,
    paddingVertical: 11,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.muted,
    letterSpacing: -0.1,
  },
  choiceBtnPassActive: {
    backgroundColor: adminColors.success.bg,
    borderColor: adminColors.success.border,
    borderWidth: 2,
  },
  choiceBtnPassTextActive: {
    color: adminColors.success.text,
    fontWeight: '800',
  },
  choiceBtnAttentionActive: {
    backgroundColor: adminColors.warning.bg,
    borderColor: adminColors.warning.border,
    borderWidth: 2,
  },
  choiceBtnAttentionTextActive: {
    color: adminColors.warning.text,
    fontWeight: '800',
  },
  choiceBtnFailActive: {
    backgroundColor: adminColors.danger.bg,
    borderColor: adminColors.danger.border,
    borderWidth: 2,
  },
  choiceBtnFailTextActive: {
    color: adminColors.danger.text,
    fontWeight: '800',
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
    backgroundColor: adminColors.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    ...adminShadow.md,
  },
  primaryCtaBtn: {
    ...adminShadow.sm,
    backgroundColor: adminColors.brand,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    fontSize: 15,
    lineHeight: 20,
    color: adminColors.onBrand,
    fontWeight: '800',
    letterSpacing: 0.1,
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
  voucherReceiptCard: {
    backgroundColor: adminColors.card,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    padding: 18,
    ...adminShadow.sm,
    marginBottom: 16,
  },
  voucherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voucherStatusPill: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  voucherStatusText: {
    ...adminType.caption,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  voucherIdText: {
    ...adminType.title,
    color: adminColors.ink,
  },
  voucherDateText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  voucherQrBox: {
    width: 48,
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherDivider: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: adminColors.border,
    marginVertical: 14,
  },
  voucherQcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    padding: 12,
  },
  voucherQcTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  voucherQcSub: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
});

const customMismatchStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  lightHeader: {
    backgroundColor: adminColors.canvas,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  backBtn: {
    padding: 2,
    marginRight: 4,
  },
  headerTitle: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  lightHeaderTitle: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.brandDeep,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.onBrand,
    marginTop: 2,
    paddingLeft: 2,
  },
  lightHeaderSubtitle: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.brandDeep,
    marginTop: 2,
    paddingLeft: 2,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 10,
    letterSpacing: -0.1,
  },
  listCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  whiteCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  infoCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.muted,
    marginBottom: 3,
  },
  gridVal: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.ink,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  tableLabel: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.muted,
  },
  tableVal: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.ink,
  },
  decisionPill: {
    borderWidth: 1.5,
    borderColor: adminColors.warning.border,
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.sm,
    paddingVertical: 10,
    alignItems: 'flex-start',
    paddingHorizontal: 14,
  },
  decisionPillText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.warning.text,
    letterSpacing: 0.5,
  },
  assignBatchLinkRow: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  assignBatchLinkText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  nextStepsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  nextStepActionCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
  },
  nextStepActionText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 6,
  },
  referenceCard: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  referenceText: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.brandDeep,
    letterSpacing: 0.5,
  },
  previewBox: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewBoxLabel: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.brandDeep,
    marginBottom: 4,
  },
  previewBoxCode: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  previewNoticeText: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.brandDeep,
    textAlign: 'center',
    paddingVertical: 4,
  },
  detailBoxText: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.ink,
    lineHeight: 18,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityDashedDivider: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    borderStyle: 'dashed',
  },
  activityTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  activityTime: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.muted,
  },
  notesCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    minHeight: 80,
    marginBottom: 16,
  },
  notesPlaceholder: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.muted,
  },
  noticeBox: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.md,
    padding: 14,
    marginBottom: 16,
  },
  noticeText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.brandDeep,
    lineHeight: 17,
  },
  optionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 2,
  },
  optionSub: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.muted,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 12,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.warning.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 3,
  },
  itemSub: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.muted,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.warning.bg,
  },
  badgeText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  secondaryBtn: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  secondaryBtnText: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  bottomBar: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
  },
  actionBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...adminShadow.sm,
  },
  actionBtnText: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  orangeBottomBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...adminShadow.sm,
  },
  orangeBottomBtnText: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  confirmCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 18,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  confirmCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  confirmCardTitle: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  confirmInnerBox: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    padding: 14,
    backgroundColor: adminColors.card,
    marginBottom: 16,
  },
  confirmInnerText: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.ink,
    lineHeight: 18,
  },
  confirmButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  confirmActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmActionText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brand,
  },
  cancelActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cancelActionText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.muted,
  },
  subtleNoticeBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  subtleNoticeText: {
    flex: 1,
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.muted,
    lineHeight: 17,
  },
  linkNoticeBox: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  linkNoticeText: {
    flex: 1,
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.brandDeep,
    lineHeight: 18,
  },
});

