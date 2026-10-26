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
import React, { useEffect, useState } from 'react';
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
  ToastAndroid,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';

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
import {
  DEMO_BATCH_IDS,
  DEMO_GRN,
  DEMO_PARTIAL_REJECT_KG,
  DEMO_QC_PROGRESS,
  DEMO_QC_RESULTS,
  DEMO_SHIPMENT,
  GRADE_OPTIONS,
  HANDLING_METHODS,
  INSPECTION_PARAMETERS,
  ISSUE_TYPES,
  PARTIAL_REJECTION_REASONS,
  PRODUCT_OPTIONS,
  QC_CRITERIA,
  REJECTED_GOODS_REASONS,
  STORAGE_BAYS,
  WIZARD_HISTORY_IDS,
  findReceivingRecord,
  recordsInScope,
} from './fixtures';
import { ReceivingHistoryDetailScreen } from './ReceivingHistoryDetailScreen';
import type {
  QcResult,
  ReceiptResult,
  ReceivingOutcome,
  ReceivingRecord,
  ReceivingWizardStep,
  ShipmentLineItem,
  WarehouseScreenBaseProps,
  WizardShipmentData,
} from './types';

export interface GoodsReceivingWizardScreenProps extends WarehouseScreenBaseProps {
  /** Step to open on. A step the admin may not perform falls through to the next allowed one. */
  initialStep: ReceivingWizardStep;
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
  /** Host's storage location assignment screen (Main shell), offered on the Batch & Storage step. */
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

/** Received - Expected, as the absorbed Quantity Verification rule states (never typed by the user). */
function lineStatus(line: ShipmentLineItem): 'Shortage' | 'Excess' | 'Match' {
  const diff = line.receivedKg - line.expectedKg;
  return diff < 0 ? 'Shortage' : diff > 0 ? 'Excess' : 'Match';
}

function signedKg(n: number): string {
  return `${n > 0 ? '+' : ''}${n} KG`;
}

/** Pill tone of a receipt result. */
function resultTone(result: ReceiptResult) {
  if (result === 'Accepted') return adminColors.success;
  if (result === 'Rejected') return adminColors.danger;
  return adminColors.warning;
}

/* ─── Main Wizard Component ─── */
export function GoodsReceivingWizardScreen({
  scope,
  can,
  onBack,
  initialStep,
  shipment,
  receiverName,
  onFinish,
  onBackToShipments,
  onViewBatch,
  onOpenStorageLocations,
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
          // 6th step: Storage Assignment! Redirect directly to Storage Assignment screen
          if (onOpenStorageLocations) {
            onOpenStorageLocations();
          } else {
            goToStep('batch_assignment');
          }
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
          // 7th step: Storage Assignment
          if (onOpenStorageLocations) {
            onOpenStorageLocations();
          } else {
            setBatchSubView('storage_assignment');
            goToStep('batch_assignment');
          }
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

  const [currentStep, setCurrentStep] = useState<ReceivingWizardStep>(() => resolveStep(initialStep));
  const [history, setHistory] = useState<ReceivingWizardStep[]>(() => [resolveStep(initialStep)]);

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

  const [gradeSubView, setGradeSubView] = useState<'main' | 'product_mismatch' | 'grade_mismatch' | 'product_summary' | 'grade_summary'>('main');

  useEffect(() => {
    const first = resolveStep(initialStep);
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

  useEffect(() => {
    if (isSub && currentStep === 'batch_assignment' && onOpenStorageLocations) {
      onOpenStorageLocations();
    }
  }, [isSub, currentStep, onOpenStorageLocations]);

  const goToStep = (target: ReceivingWizardStep) => {
    const step = resolveStep(target);
    setHistory(prev => [...prev, step]);
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

  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);

  const handleConfirmGoodsReceipt = () => {
    setIsSubmittingReceipt(true);
    setTimeout(() => {
      setIsSubmittingReceipt(false);
      goToStep('receipt_confirmation');
    }, 600);
  };

  const handleRetrySubmission = () => {
    setIsSubmittingReceipt(true);
    setTimeout(() => {
      setIsSubmittingReceipt(false);
      goToStep('receipt_confirmation');
    }, 600);
  };

  // Shipment facts (props first, demo shipment otherwise; no warehouse is named here)
  const ship = shipment ?? DEMO_SHIPMENT;
  const receiptCode = ship.code;
  const expectedProduct = ship.produce;
  const expectedGrade = ship.grade ?? DEMO_SHIPMENT.grade ?? '';
  const sourceName = ship.from ?? DEMO_SHIPMENT.from ?? '';
  /** Destination: the Sub scope's own warehouse, or the shipment's for Main (all warehouses). */
  const destinationName = scope.warehouseName ?? ship.to ?? '';

  // Screen 1: Start Receiving States
  const [receivedDate, setReceivedDate] = useState(ship.receivedDate ?? DEMO_SHIPMENT.receivedDate ?? '');
  const [receivedTime, setReceivedTime] = useState(ship.receivedTime ?? DEMO_SHIPMENT.receivedTime ?? '');
  const [, setStartReceivingPhotos] = useState<string[]>([]);
  const [arrivalConfirmed, setArrivalConfirmed] = useState(false);

  // Screen 3: Quality Check States
  const [qcStatusMap, setQcStatusMap] = useState<Record<string, QcResult>>(DEMO_QC_RESULTS);
  const qcIssueCount = QC_CRITERIA.filter(c => (qcStatusMap[c.id] ?? 'pass') !== 'pass').length;

  // Grade & Product verification (absorbed GradeProductVerificationScreen)
  const [actualProduct, setActualProduct] = useState(expectedProduct);
  const [actualGrade, setActualGrade] = useState(expectedGrade);
  const productMatches = actualProduct === expectedProduct;
  const gradeMatches = actualGrade === expectedGrade;

  // Screen 4 & 5: Quantities & Decisions
  const initExpected = ship.expectedQty;
  const initReceived = ship.receivedQty ?? initExpected;
  const initRejected = ship.rejectedQty ?? 0;
  const initAccepted = ship.acceptedQty ?? Math.max(0, initReceived - initRejected);

  const [expectedQty] = useState(initExpected);
  const [receivedQty] = useState(initReceived);
  const [rejectedQty, setRejectedQty] = useState(initRejected);
  const [acceptedQty, setAcceptedQty] = useState(initAccepted);
  const [acceptedInput, setAcceptedInput] = useState(String(initAccepted));
  const [rejectionReason, setRejectionReason] = useState('Quality Below Grade');
  const [partialNotes, setPartialNotes] = useState('');
  const [chosenOutcome, setChosenOutcome] = useState<ReceivingOutcome | null>(null);
  const outcome: ReceivingOutcome = chosenOutcome ?? (acceptedQty === 0 ? 'Reject' : rejectedQty === 0 ? 'Accept' : 'Partial Accept');

  /** Partial Acceptance: Accepted + Rejected = Received, and neither may exceed Received. */
  const setAcceptedFromInput = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '');
    const value = Math.min(receivedQty, Math.max(0, parseInt(digits, 10) || 0));
    setAcceptedInput(digits === '' ? '' : String(value));
    setAcceptedQty(value);
    setRejectedQty(receivedQty - value);
  };

  const shipmentLines: ShipmentLineItem[] = [
    { product: expectedProduct, expectedKg: expectedQty, receivedKg: receivedQty },
    ...(ship.lines ?? []),
  ];

  // Screen 5: Damage / Mismatch States
  const [selectedIssueType, setSelectedIssueType] = useState(ISSUE_TYPES[0] ?? '');
  const [issueDescription, setIssueDescription] = useState('');

  /** Combined discrepancies (absorbed Damage / Mismatch Report), derived from what was recorded. */
  const discrepancies = [
    ...(receivedQty !== expectedQty
      ? [{ id: 'qty', kind: 'Quantity', detail: `Expected ${expectedQty} KG · Actual ${receivedQty} KG` }]
      : []),
    ...(!productMatches
      ? [{ id: 'product', kind: 'Product', detail: `Expected ${expectedProduct} · Actual ${actualProduct}` }]
      : []),
    ...(!gradeMatches ? [{ id: 'grade', kind: 'Grade', detail: `Expected ${expectedGrade} · Actual ${actualGrade}` }] : []),
    ...(canQc && qcIssueCount > 0
      ? [{ id: 'quality', kind: 'Quality', detail: `${qcIssueCount} of ${QC_CRITERIA.length} checks need attention or failed` }]
      : []),
  ];

  // History Tab Filter
  const [historyFilter, setHistoryFilter] = useState<'All' | 'Accepted' | 'Partial' | 'Rejected'>('All');
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | undefined>(undefined);

  // Rejected Goods & Record Handling States
  const [selectedRejectedReason, setSelectedRejectedReason] = useState(REJECTED_GOODS_REASONS[0] ?? '');
  const [handlingStatus, setHandlingStatus] = useState<'Pending' | 'Recorded'>('Pending');
  const [handlingMethod, setHandlingMethod] = useState('Select method');
  const [handlingDate, setHandlingDate] = useState(ship.receivedDate ?? DEMO_SHIPMENT.receivedDate ?? '');
  const [handlingTime, setHandlingTime] = useState(ship.receivedTime ?? DEMO_SHIPMENT.receivedTime ?? '');
  const [handlingRemarks, setHandlingRemarks] = useState('');

  // Batch & storage (absorbed BatchAssignment + the Review Receiving putaway bay)
  const [selectedBayId, setSelectedBayId] = useState(STORAGE_BAYS[0]?.id ?? '');
  const selectedBay = STORAGE_BAYS.find(b => b.id === selectedBayId);
  const batchId = outcome === 'Accept' ? DEMO_BATCH_IDS.full : DEMO_BATCH_IDS.partial;

  // Counter-offer (inventory.quality.counter_offer)
  const [counterPrice, setCounterPrice] = useState('');
  const [counterReason, setCounterReason] = useState('');
  /** Rupees with at most two decimals, kept as a string (CLAUDE.md 2.2: money is never a float). */
  const counterPriceValid = /^\d{1,6}(\.\d{1,2})?$/.test(counterPrice) && !/^0+(\.0+)?$/.test(counterPrice);

  // Review Receiving (absorbed SubWarehouseReviewReceivingScreen)
  const [grossWeight, setGrossWeight] = useState(String(receivedQty));
  const [crateCount, setCrateCount] = useState('0');
  const [inspection, setInspection] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(INSPECTION_PARAMETERS.map(p => [p.id, true])),
  );
  const [isReviewSuccessVisible, setIsReviewSuccessVisible] = useState(false);
  const parsedGross = parseFloat(grossWeight) || 0;
  const parsedCrates = parseInt(crateCount, 10) || 0;
  const tareWeight = parsedCrates * (ship.crateTareKg ?? 0);
  const netWeight = Math.max(0, parsedGross - tareWeight);

  /** Damage / Mismatch continues to the step after the one that opened it (Quality is skipped without its gate). */
  const mismatchFrom = history[history.length - 2];
  const afterMismatchStep: ReceivingWizardStep =
    mismatchFrom === 'grade_verification'
      ? 'receiving_decision'
      : mismatchFrom === 'quality_check'
        ? 'grade_verification'
        : 'quality_check';

  /** Summary -> Batch & Storage when allowed and something was accepted, else submit straight away. */
  const handleSummaryConfirm = () => {
    if (isSub && onOpenStorageLocations) {
      onOpenStorageLocations();
      return;
    }
    if (canBatch && acceptedQty > 0) goToStep('batch_assignment');
    else handleConfirmGoodsReceipt();
  };

  const pickFrom = (title: string, options: string[], onPick: (v: string) => void) => {
    Alert.alert(title, undefined, [
      ...options.map(o => ({ text: o, onPress: () => onPick(o) })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  /** QC summary rows from the recorded results (was a hard-coded icon list). */
  const qcSummaryRows = (results: Partial<Record<string, QcResult>>) =>
    QC_CRITERIA.map((crit, idx) => {
      const r = results[crit.id] ?? 'pass';
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
              <Text style={styles.produceExpQty}>Exp. {expectedQty} KG</Text>
            </View>
          </View>

          {/* Absorbed StartReceivingScreen: shipment confirmation + receiver information */}
          <Text style={styles.sectionHeader}>Shipment Confirmation</Text>
          <View style={styles.whiteCard}>
            <View style={styles.summaryMetaGrid}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Source</Text>
                <Text style={styles.summaryMetaVal}>{sourceName}</Text>
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
                <Text style={styles.summaryMetaVal}>{expectedQty} KG</Text>
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
          <View style={styles.rowTwoCols}>
            <View style={styles.colHalf}>
              <Text style={styles.inputLabel}>Received Date</Text>
              <TextInput style={styles.textInput} value={receivedDate} onChangeText={setReceivedDate} />
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.inputLabel}>Received Time</Text>
              <TextInput style={styles.textInput} value={receivedTime} onChangeText={setReceivedTime} />
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>Receiving Photos</Text>
            <Text style={styles.optionalTag}>Optional</Text>
          </View>

          <TouchableOpacity
            style={styles.dashedAddBox}
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert('Camera', 'Photo captured.');
              setStartReceivingPhotos(prev => [...prev, 'photo']);
            }}
          >
            <CameraPlusIcon />
            <Text style={styles.dashedAddBoxText}>Add Photo</Text>
          </TouchableOpacity>

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


          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{expectedQty} KG</Text>
              <Text style={styles.statTileLabel}>EXPECTED</Text>
            </View>

            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{receivedQty} KG</Text>
              <Text style={styles.statTileLabel}>RECEIVED</Text>
            </View>

            <View style={styles.statTile}>
              <Text
                style={[
                  styles.statTileNumber,
                  receivedQty !== expectedQty && { color: adminColors.danger.text },
                ]}
              >
                {signedKg(receivedQty - expectedQty)}
              </Text>
              <Text style={styles.statTileLabel}>DIFFERENCE</Text>
            </View>
          </View>

          {/* Absorbed QuantityVerificationScreen: one row per product line with its status */}
          <Text style={styles.sectionHeader}>
            {shipmentLines.length > 1 ? 'Multiple Items on this Shipment' : 'Items on this Shipment'}
          </Text>
          {shipmentLines.map(line => {
            const status = lineStatus(line);
            const tone =
              status === 'Shortage' ? adminColors.warning : status === 'Excess' ? adminColors.info : adminColors.success;
            return (
              <View key={line.product} style={styles.shipmentItemCard}>
                <View style={styles.shipmentItemTopRow}>
                  <Text style={styles.shipmentItemTitle}>{line.product}</Text>
                  <View style={[styles.redBadgePill, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.redBadgeText, { color: tone.text }]}>
                      {status === 'Match' ? status : `${status} ${signedKg(line.receivedKg - line.expectedKg)}`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.shipmentItemDesc}>
                  Expected <Text style={{ fontWeight: '700', color: adminColors.ink }}>{line.expectedKg} KG</Text> · Received <Text style={{ fontWeight: '700', color: adminColors.ink }}>{line.receivedKg} KG</Text>
                </Text>
              </View>
            );
          })}

          <Text style={styles.sectionHeader}>Report an Issue</Text>
          <TouchableOpacity
            style={styles.reportIssueBtn}
            activeOpacity={0.8}
            onPress={() => goToStep('damage_mismatch')}
          >
            <AlertCircleOutlineIcon color={adminColors.brand} size={18} />
            <Text style={styles.reportIssueBtnText}>Record Damage / Mismatch</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            onPress={() => goToStep('quality_check')}
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
            <Text style={styles.headerSub}>{expectedProduct} · {expectedGrade} · Received {receivedQty} KG</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {stepper('Quality')}

          {/* Absorbed QualityCheckScreen: product card with issue badge + configured-scale notice */}
          <View style={styles.qcProductCard}>
            <View style={styles.qcProductText}>
              <Text style={styles.shipmentItemTitle}>{expectedProduct}</Text>
              <Text style={styles.shipmentItemDesc}>{receivedQty} KG received</Text>
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

          {QC_CRITERIA.map(crit => {
            const currentVal = qcStatusMap[crit.id] || 'pass';

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
      if (gradeSubView === 'product_mismatch') {
        return (
          <View style={customMismatchStyles.root}>
            <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
            <View style={customMismatchStyles.header}>
              <View style={customMismatchStyles.headerRow}>
                <TouchableOpacity onPress={handleBack} activeOpacity={0.7} style={customMismatchStyles.backBtn}>
                  <BackArrowIcon color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={customMismatchStyles.headerTitle}>Product Mismatch</Text>
              </View>
              <Text style={customMismatchStyles.headerSubtitle}>{receiptCode || 'SHP-000124'}</Text>
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <Text style={customMismatchStyles.sectionHeading}>Product Mismatch Detail</Text>

              <View style={customMismatchStyles.whiteCard}>
                <View style={customMismatchStyles.gridRow}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Expected Product</Text>
                    <Text style={customMismatchStyles.gridVal}>{expectedProduct || 'Tomato'}</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Actual Product</Text>
                    <Text style={customMismatchStyles.gridVal}>—</Text>
                  </View>
                </View>

                <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Quantity Affected</Text>
                    <Text style={customMismatchStyles.gridVal}>—</Text>
                  </View>
                </View>
              </View>

              <View style={customMismatchStyles.subtleNoticeBox}>
                <CheckmarkCircleOutlineIcon size={18} color={adminColors.success.text} />
                <Text style={customMismatchStyles.subtleNoticeText}>
                  No product mismatch on this shipment — actual product matches expected. This panel populates only when a mismatch is actually recorded.
                </Text>
              </View>
            </ScrollView>
          </View>
        );
      }

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
              <Text style={customMismatchStyles.headerSubtitle}>{receiptCode || 'SHP-000124'}</Text>
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <Text style={customMismatchStyles.sectionHeading}>Grade Mismatch Detail</Text>

              <View style={customMismatchStyles.whiteCard}>
                <View style={customMismatchStyles.gridRow}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Expected Grade</Text>
                    <Text style={customMismatchStyles.gridVal}>{expectedGrade || 'Grade 1'}</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Actual Grade</Text>
                    <Text style={customMismatchStyles.gridVal}>{actualGrade || 'Grade 2'}</Text>
                  </View>
                </View>

                <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Quantity Affected</Text>
                    <Text style={customMismatchStyles.gridVal}>{receivedQty || 480} KG</Text>
                  </View>
                </View>
              </View>

              <View style={customMismatchStyles.notesCard}>
                <TextInput
                  style={[customMismatchStyles.notesPlaceholder, { color: adminColors.ink }]}
                  placeholder="Notes on grade mismatch"
                  placeholderTextColor={adminColors.muted}
                  multiline
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
              <Text style={customMismatchStyles.headerSubtitle}>{receiptCode || 'SHP-000124'}</Text>
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
              <Text style={customMismatchStyles.headerSubtitle}>{receiptCode || 'SHP-000124'}</Text>
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <Text style={customMismatchStyles.sectionHeading}>Grade Verification Summary</Text>

              <View style={customMismatchStyles.whiteCard}>
                <Text style={customMismatchStyles.gridLabel}>Overall Status</Text>
                <Text style={[customMismatchStyles.gridVal, { color: adminColors.warning.text, marginTop: adminSpacing.xs }]}>
                  Grade Mismatch — 1 product affected
                </Text>
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
            <Text style={customMismatchStyles.headerSubtitle}>{receiptCode || 'SHP-000124'}</Text>
          </View>

          <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
            <View style={customMismatchStyles.whiteCard}>
              <View style={customMismatchStyles.gridRow}>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>Expected Product</Text>
                  <Text style={customMismatchStyles.gridVal}>{expectedProduct || 'Tomato'}</Text>
                </View>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>Expected Grade</Text>
                  <Text style={customMismatchStyles.gridVal}>{expectedGrade || 'Grade 1'}</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.inputLabel, { ...adminType.caption, color: adminColors.muted, fontWeight: '600', marginBottom: 6 }]}>Actual Product</Text>
            <TouchableOpacity
              style={[styles.dropdownSelectBox, { backgroundColor: adminColors.card, borderColor: adminColors.border, borderRadius: adminRadius.md, height: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }]}
              activeOpacity={0.7}
              onPress={() => pickFrom('Actual Product', PRODUCT_OPTIONS, setActualProduct)}
            >
              <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>{actualProduct || 'Tomato'}</Text>
              <ChevronDownIcon />
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { ...adminType.caption, color: adminColors.muted, fontWeight: '600', marginBottom: 6 }]}>Actual Grade</Text>
            <TouchableOpacity
              style={[styles.dropdownSelectBox, { backgroundColor: adminColors.card, borderColor: adminColors.border, borderRadius: adminRadius.md, height: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }]}
              activeOpacity={0.7}
              onPress={() => pickFrom('Actual Grade', GRADE_OPTIONS, setActualGrade)}
            >
              <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>{actualGrade || 'Grade 1'}</Text>
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
                  onPress={() => setGradeSubView('product_mismatch')}
                  activeOpacity={0.8}
                >
                  <ClipboardChecklistIcon color={adminColors.brand} size={20} />
                  <Text style={{ ...adminType.caption, fontWeight: '700', color: adminColors.ink }}>Product Mismatch</Text>
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
    const hasMismatch = !productMatches || !gradeMatches;
    const openMismatch = (issue: string) => {
      setSelectedIssueType(issue);
      goToStep('damage_mismatch');
    };
    const matchChip = (ok: boolean, label: string) => (
      <View style={[styles.matchChip, { backgroundColor: ok ? adminColors.success.bg : adminColors.danger.bg }]}>
        <Text style={[styles.matchChipText, { color: ok ? adminColors.success.text : adminColors.danger.text }]}>
          {label} {ok ? 'Match' : 'Mismatch'}
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
                <Text style={styles.summaryMetaLabel}>Expected Product</Text>
                <Text style={styles.summaryMetaVal}>{expectedProduct}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Expected Grade</Text>
                <Text style={styles.summaryMetaVal}>{expectedGrade}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.inputLabel}>Actual Product</Text>
          <TouchableOpacity
            style={styles.dropdownSelectBox}
            activeOpacity={0.7}
            onPress={() => pickFrom('Actual Product', PRODUCT_OPTIONS, setActualProduct)}
          >
            <Text style={styles.dropdownValue}>{actualProduct}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Actual Grade</Text>
          <TouchableOpacity
            style={styles.dropdownSelectBox}
            activeOpacity={0.7}
            onPress={() => pickFrom('Actual Grade', GRADE_OPTIONS, setActualGrade)}
          >
            <Text style={styles.dropdownValue}>{actualGrade}</Text>
            <ChevronDownIcon />
          </TouchableOpacity>

          <View style={styles.matchChipRow}>
            {matchChip(productMatches, 'Product')}
            {matchChip(gradeMatches, 'Grade')}
          </View>

          <View style={styles.actionGrid}>
            <View style={styles.actionGridRow}>
              <TouchableOpacity style={styles.actionCard} onPress={() => openMismatch('Product Mismatch')} activeOpacity={0.8}>
                <ClipboardChecklistIcon color={adminColors.brand} size={18} />
                <Text style={styles.actionCardText}>Product Mismatch</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} onPress={() => openMismatch('Grade Mismatch')} activeOpacity={0.8}>
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
            onPress={() =>
              hasMismatch
                ? openMismatch(!productMatches ? 'Product Mismatch' : 'Grade Mismatch')
                : goToStep('receiving_decision')
            }
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
            <Text style={customMismatchStyles.headerSubtitle}>{receiptCode || 'SHP-000124'}</Text>
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
                  <Text style={customMismatchStyles.gridLabel}>Expected Quantity</Text>
                  <Text style={customMismatchStyles.gridVal}>{expectedQty || 500} KG</Text>
                </View>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>Received Quantity</Text>
                  <Text style={customMismatchStyles.gridVal}>{receivedQty || 480} KG</Text>
                </View>
              </View>

              <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>Accepted Quantity</Text>
                  <Text style={customMismatchStyles.gridVal}>—</Text>
                </View>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>Rejected/Damaged</Text>
                  <Text style={customMismatchStyles.gridVal}>35 KG (flagged)</Text>
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
                setChosenOutcome('Accept');
                setAcceptedQty(receivedQty || 480);
                setRejectedQty(0);
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
                setChosenOutcome('Partial Accept');
                setAcceptedQty(445);
                setRejectedQty(55);
                goToStep('receipt_summary');
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
                setChosenOutcome('Reject');
                setAcceptedQty(0);
                setRejectedQty(receivedQty || 480);
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
              <Text style={styles.decisionTableLabel}>Expected</Text>
              <Text style={styles.decisionTableValue}>{expectedQty} KG</Text>
            </View>
            <View style={styles.decisionTableRow}>
              <Text style={styles.decisionTableLabel}>Received</Text>
              <Text style={styles.decisionTableValue}>{receivedQty} KG</Text>
            </View>
            <View style={styles.decisionTableRow}>
              <Text style={styles.decisionTableLabel}>Accepted</Text>
              <Text style={[styles.decisionTableValue, { color: adminColors.success.text, fontWeight: '800' }]}>{acceptedQty} KG</Text>
            </View>
            <View style={[styles.decisionTableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.decisionTableLabel}>Rejected</Text>
              <Text style={[styles.decisionTableValue, { color: adminColors.danger.text, fontWeight: '800' }]}>{rejectedQty} KG</Text>
            </View>
          </View>

          {/* Choose an Outcome */}
          <Text style={styles.sectionHeader}>Choose an Outcome</Text>

          {/* Outcome 1: Accept */}
          <TouchableOpacity
            style={styles.outcomeAcceptCard}
            activeOpacity={0.8}
            onPress={() => {
              setAcceptedQty(receivedQty);
              setRejectedQty(0);
              goToStep('receipt_summary');
            }}
          >
            <View style={styles.outcomeIconBoxGreen}>
              <CheckmarkCircleOutlineIcon color={adminColors.success.text} size={24} />
            </View>
            <View style={styles.outcomeTextBox}>
              <Text style={styles.outcomeAcceptTitle}>Accept</Text>
              <Text style={styles.outcomeAcceptSub}>Full {receivedQty} KG accepted, no rejection</Text>
            </View>
          </TouchableOpacity>

          {/* Outcome 2: Partial Accept (rejects part of the goods: inventory.produce.reject_incoming) */}
          {canReject && (
          <TouchableOpacity
            style={styles.outcomePartialCard}
            activeOpacity={0.8}
            onPress={() => {
              const defaultRej = rejectedQty > 0 ? rejectedQty : DEMO_PARTIAL_REJECT_KG;
              const calcAccepted = Math.max(0, receivedQty - defaultRej);
              setAcceptedQty(calcAccepted);
              setAcceptedInput(String(calcAccepted));
              setRejectedQty(receivedQty - calcAccepted);
              goToStep('partial_acceptance');
            }}
          >
            <View style={styles.outcomeIconBoxAmber}>
              <NotEqualIcon color={adminColors.warning.text} size={22} />
            </View>
            <View style={styles.outcomeTextBox}>
              <Text style={styles.outcomePartialTitle}>Partial Accept</Text>
              <Text style={styles.outcomePartialSub}>
                {Math.max(0, receivedQty - (rejectedQty > 0 ? rejectedQty : DEMO_PARTIAL_REJECT_KG))} KG accepted, {rejectedQty > 0 ? rejectedQty : DEMO_PARTIAL_REJECT_KG} KG rejected
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
              setAcceptedQty(0);
              setRejectedQty(receivedQty);
              goToStep('receipt_summary');
            }}
          >
            <View style={styles.outcomeIconBoxRed}>
              <CrossCircleIcon color={adminColors.danger.text} size={24} />
            </View>
            <View style={styles.outcomeTextBox}>
              <Text style={styles.outcomeRejectTitle}>Reject</Text>
              <Text style={styles.outcomeRejectSub}>Reject the full received quantity ({receivedQty} KG)</Text>
            </View>
          </TouchableOpacity>
          )}

          {/* Quality counter-offer: an action, not a fourth outcome (inventory.quality.counter_offer) */}
          {canCounter && (
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
     No endpoint exists yet (SPEC_GAPS W4n-2): the offer is recorded locally.
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
                <Text style={styles.summaryMetaLabel}>Product</Text>
                <Text style={styles.summaryMetaVal}>{actualProduct}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Grade (actual)</Text>
                <Text style={styles.summaryMetaVal}>{actualGrade}</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Accepted Quantity</Text>
                <Text style={styles.summaryMetaVal}>{acceptedQty} KG</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>QC Issues</Text>
                <Text style={styles.summaryMetaVal}>{canQc ? `${qcIssueCount} of ${QC_CRITERIA.length}` : '—'}</Text>
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
            style={[styles.primaryCtaBtn, !counterPriceValid && styles.primaryCtaBtnDisabled]}
            activeOpacity={0.85}
            disabled={!counterPriceValid}
            onPress={() => {
              Alert.alert('Counter-Offer Recorded', `₹${counterPrice} per KG proposed for ${receiptCode}.`);
              handleBack();
            }}
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
    const rejectionReasons = PARTIAL_REJECTION_REASONS;

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Partial Acceptance / Rejection</Text>
            <Text style={styles.headerSub}>{receiptCode} · Product-level decision</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 3 Metric Stat Tiles */}
          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{receivedQty} KG</Text>
              <Text style={styles.statTileLabel}>RECEIVED</Text>
            </View>

            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{acceptedQty} KG</Text>
              <Text style={styles.statTileLabel}>ACCEPTED</Text>
            </View>

            <View style={styles.statTile}>
              <Text style={[styles.statTileNumber, { color: adminColors.danger.text }]}>{rejectedQty} KG</Text>
              <Text style={styles.statTileLabel}>REJECTED</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Partial Acceptance Detail — {actualProduct}</Text>
          <View style={styles.rowTwoCols}>
            <View style={styles.colHalf}>
              <Text style={styles.inputLabel}>Accepted Quantity (KG)</Text>
              <TextInput
                style={styles.textInput}
                value={acceptedInput}
                onChangeText={setAcceptedFromInput}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.inputLabel}>Rejected (calculated)</Text>
              <View style={[styles.textInput, styles.readOnlyInput]}>
                <Text style={styles.readOnlyValue}>{rejectedQty} KG</Text>
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
              const isSelected = rejectionReason === reason;
              const isLast = idx === rejectionReasons.length - 1;

              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.issueTypeRow, isLast && { borderBottomWidth: 0 }]}
                  onPress={() => setRejectionReason(reason)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.radioOuterCircle, isSelected && styles.radioOuterCircleSelected]}>
                    {isSelected && <View style={styles.radioInnerCircle} />}
                  </View>
                  <Text style={[styles.issueTypeText, isSelected && styles.issueTypeTextSelected]}>
                    {reason}
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

          {/* Evidence */}
          <Text style={styles.sectionHeader}>Evidence</Text>
          <View style={styles.qcPhotosRow}>
            <View style={styles.qcPhotoThumbnail}>
              <PictureIcon />
              <TouchableOpacity style={styles.qcPhotoDeleteBadge} activeOpacity={0.7}>
                <Text style={styles.qcPhotoDeleteX}>×</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.qcPhotoAddBox}
              onPress={() => Alert.alert('Camera', 'Evidence photo added.')}
              activeOpacity={0.7}
            >
              <CameraPlusIcon size={24} />
              <Text style={styles.qcPhotoAddText}>Add Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
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
      const grnCode = DEMO_GRN || receiptCode || 'GRN-000842';

      if (summarySubView === 'preview') {
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
                <View style={customMismatchStyles.previewBox}>
                  <Text style={customMismatchStyles.previewBoxLabel}>Goods Receipt Note</Text>
                  <Text style={customMismatchStyles.previewBoxCode}>{grnCode}</Text>
                </View>
              </View>

              <Text style={[customMismatchStyles.sectionHeading, { marginTop: 8 }]}>Receipt Reference</Text>
              <View style={customMismatchStyles.referenceCard}>
                <Text style={customMismatchStyles.referenceText}>{grnCode}</Text>
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>

            <View style={customMismatchStyles.bottomBar}>
              <TouchableOpacity
                style={customMismatchStyles.orangeBottomBtn}
                onPress={() => goToStep('batch_assignment')}
                activeOpacity={0.8}
              >
                <QrCodeIcon size={18} color={adminColors.onBrand} />
                <Text style={customMismatchStyles.orangeBottomBtnText}>Assign Batch</Text>
              </TouchableOpacity>
            </View>
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
              <View style={customMismatchStyles.whiteCard}>
                <Text style={customMismatchStyles.detailBoxText}>
                  Complete finalized receipt — every field above (Shipment, Quantity, Quality, Grade & Product, Decision) merged into one read-only record referenced as {grnCode}.
                </Text>
              </View>

              <Text style={[customMismatchStyles.sectionHeading, { marginTop: 8 }]}>Receipt Reference</Text>
              <View style={customMismatchStyles.referenceCard}>
                <Text style={customMismatchStyles.referenceText}>{grnCode}</Text>
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>

            <View style={customMismatchStyles.bottomBar}>
              <TouchableOpacity
                style={customMismatchStyles.orangeBottomBtn}
                onPress={() => goToStep('batch_assignment')}
                activeOpacity={0.8}
              >
                <QrCodeIcon size={18} color={adminColors.onBrand} />
                <Text style={customMismatchStyles.orangeBottomBtnText}>Assign Batch</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      if (summarySubView === 'activity') {
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
              <View style={customMismatchStyles.whiteCard}>
                <View style={customMismatchStyles.activityRow}>
                  <Text style={customMismatchStyles.activityTitle}>Quantity Verified</Text>
                  <Text style={customMismatchStyles.activityTime}>10:15 AM</Text>
                </View>
                <View style={customMismatchStyles.activityDashedDivider} />
                <View style={customMismatchStyles.activityRow}>
                  <Text style={customMismatchStyles.activityTitle}>Quality Checked</Text>
                  <Text style={customMismatchStyles.activityTime}>10:22 AM</Text>
                </View>
                <View style={customMismatchStyles.activityDashedDivider} />
                <View style={customMismatchStyles.activityRow}>
                  <Text style={customMismatchStyles.activityTitle}>
                    Decision: {outcome === 'Accept' ? 'Accept' : outcome === 'Reject' ? 'Reject' : 'Partial Accept'}
                  </Text>
                  <Text style={customMismatchStyles.activityTime}>10:30 AM</Text>
                </View>
              </View>

              <Text style={[customMismatchStyles.sectionHeading, { marginTop: 8 }]}>Receipt Reference</Text>
              <View style={customMismatchStyles.referenceCard}>
                <Text style={customMismatchStyles.referenceText}>{grnCode}</Text>
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>

            <View style={customMismatchStyles.bottomBar}>
              <TouchableOpacity
                style={customMismatchStyles.orangeBottomBtn}
                onPress={() => goToStep('batch_assignment')}
                activeOpacity={0.8}
              >
                <QrCodeIcon size={18} color={adminColors.onBrand} />
                <Text style={customMismatchStyles.orangeBottomBtnText}>Assign Batch</Text>
              </TouchableOpacity>
            </View>
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
                  <Text style={customMismatchStyles.gridLabel}>Shipment ID</Text>
                  <Text style={customMismatchStyles.gridVal}>{ship.reference ?? 'SHP-000124'}</Text>
                </View>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>Source</Text>
                  <Text style={customMismatchStyles.gridVal}>{sourceName || 'Farmer Admin'}</Text>
                </View>
              </View>
              <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>Destination</Text>
                  <Text style={customMismatchStyles.gridVal}>{destinationName || 'Coonoor'}</Text>
                </View>
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>Date</Text>
                  <Text style={customMismatchStyles.gridVal}>{receivedDate || '25 Sep 2026'}</Text>
                </View>
              </View>
            </View>

            {/* 2. Quantity Section */}
            <Text style={customMismatchStyles.sectionHeading}>Quantity</Text>
            <View style={customMismatchStyles.infoCard}>
              <View style={customMismatchStyles.tableRow}>
                <Text style={customMismatchStyles.tableLabel}>Expected</Text>
                <Text style={customMismatchStyles.tableVal}>{expectedQty || 500} KG</Text>
              </View>
              <View style={customMismatchStyles.tableRow}>
                <Text style={customMismatchStyles.tableLabel}>Received</Text>
                <Text style={customMismatchStyles.tableVal}>{receivedQty || 480} KG</Text>
              </View>
              <View style={customMismatchStyles.tableRow}>
                <Text style={customMismatchStyles.tableLabel}>Accepted</Text>
                <Text style={customMismatchStyles.tableVal}>{acceptedQty || 445} KG</Text>
              </View>
              <View style={[customMismatchStyles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={customMismatchStyles.tableLabel}>Rejected</Text>
                <Text style={customMismatchStyles.tableVal}>{rejectedQty || 55} KG</Text>
              </View>
            </View>

            {/* 3. Decision Section */}
            <Text style={customMismatchStyles.sectionHeading}>Decision</Text>
            <View style={customMismatchStyles.infoCard}>
              <View style={customMismatchStyles.decisionPill}>
                <Text style={customMismatchStyles.decisionPillText}>
                  {outcome === 'Accept' ? 'ACCEPT' : outcome === 'Reject' ? 'REJECT' : 'PARTIAL ACCEPT'}
                </Text>
              </View>
            </View>

            {/* 4. Next Steps Section */}
            <Text style={customMismatchStyles.sectionHeading}>Next Steps</Text>
            <View style={customMismatchStyles.infoCard}>
              <TouchableOpacity
                style={customMismatchStyles.assignBatchLinkRow}
                activeOpacity={0.7}
                onPress={() => goToStep('batch_assignment')}
              >
                <Text style={customMismatchStyles.assignBatchLinkText}>Assign Batch →</Text>
              </TouchableOpacity>
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
            <Text style={customMismatchStyles.sectionHeading}>Receipt Reference</Text>
            <View style={customMismatchStyles.referenceCard}>
              <Text style={customMismatchStyles.referenceText}>{grnCode}</Text>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Bottom Bar: Assign Batch */}
          <View style={customMismatchStyles.bottomBar}>
            <TouchableOpacity
              style={customMismatchStyles.orangeBottomBtn}
              onPress={() => goToStep('batch_assignment')}
              activeOpacity={0.8}
            >
              <QrCodeIcon size={18} color={adminColors.onBrand} />
              <Text style={customMismatchStyles.orangeBottomBtnText}>Assign Batch</Text>
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
          <Text style={styles.headerTitle}>Receipt Summary</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {stepper('Summary')}

          {/* Receipt Metadata Card (+ absorbed GoodsReceiptSummaryScreen shipment id / date) */}
          <View style={styles.whiteCard}>
            <Text style={styles.summaryCardReceiptCode}>{receiptCode}</Text>
            <View style={styles.summaryMetaGrid}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Shipment ID</Text>
                <Text style={styles.summaryMetaVal}>{ship.reference ?? receiptCode}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Date</Text>
                <Text style={styles.summaryMetaVal}>{receivedDate}</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Source</Text>
                <Text style={styles.summaryMetaVal}>{sourceName}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Destination</Text>
                <Text style={styles.summaryMetaVal}>{destinationName}</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Product</Text>
                <Text style={styles.summaryMetaVal}>{actualProduct}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Grade</Text>
                <Text style={styles.summaryMetaVal}>{actualGrade}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Decision</Text>
          <View style={styles.decisionOutcomeCard}>
            <Text style={styles.decisionOutcomeText}>{outcome.toUpperCase()}</Text>
          </View>

          {/* Metric Table Card */}
          <View style={styles.decisionTableCard}>
            <View style={styles.decisionTableRow}>
              <Text style={styles.decisionTableLabel}>Expected</Text>
              <Text style={styles.decisionTableValue}>{expectedQty} KG</Text>
            </View>
            <View style={styles.decisionTableRow}>
              <Text style={styles.decisionTableLabel}>Received</Text>
              <Text style={styles.decisionTableValue}>{receivedQty} KG</Text>
            </View>
            <View style={styles.decisionTableRow}>
              <Text style={styles.decisionTableLabel}>Accepted</Text>
              <Text style={[styles.decisionTableValue, { color: adminColors.success.text, fontWeight: '800' }]}>{acceptedQty} KG</Text>
            </View>
            <View style={[styles.decisionTableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.decisionTableLabel}>Rejected</Text>
              <Text style={[styles.decisionTableValue, { color: adminColors.danger.text, fontWeight: '800' }]}>{rejectedQty} KG</Text>
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
              <Text style={styles.issuesTitle}>{rejectedQty > 0 ? `${rejectedQty} KG rejected` : 'No items rejected'}</Text>
              <Text style={styles.issuesSub}>Reason: {rejectionReason || 'Quality Below Grade'}</Text>
            </View>
          </View>

          {/* Evidence */}
          <Text style={styles.sectionHeader}>Evidence</Text>
          <View style={styles.qcPhotosRow}>
            <View style={styles.qcPhotoThumbnail}>
              <PictureIcon />
            </View>
            <View style={styles.qcPhotoThumbnail}>
              <PictureIcon />
            </View>
          </View>

          {/* Absorbed GoodsReceiptSummaryScreen: next steps + receipt reference */}
          <Text style={styles.sectionHeader}>Next Steps</Text>
          <View style={styles.actionGridRow}>
            <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={() => goToStep('receipt_detail')}>
              <ReceiptPaperIcon color={adminColors.brand} size={18} />
              <Text style={styles.actionCardText}>Full Detail</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={() => (onViewHistory ? onViewHistory() : goToStep('receiving_history'))}>
              <ClockSmallIcon color={adminColors.brand} size={18} />
              <Text style={styles.actionCardText}>Activity</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeader}>Receipt Reference</Text>
          <TouchableOpacity
            style={styles.referenceCard}
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert(
                'Receipt Reference',
                `${receiptCode} for Shipment ${ship.reference ?? receiptCode} is recorded in the warehouse ledger.`,
              )
            }
          >
            <Text style={styles.referenceText}>{receiptCode}</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            disabled={isSubmittingReceipt}
            onPress={handleSummaryConfirm}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {isSubmittingReceipt ? (
                <ActivityIndicator color={adminColors.onBrand} size="small" />
              ) : canBatch && acceptedQty > 0 ? (
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
      const displayGrn = DEMO_GRN || 'GRN-000842';
      const displayWh = destinationName || 'Coonoor';
      const displayProd = actualProduct || 'Tomato';
      const displayGrade = actualGrade || 'Grade 2';
      const displayAcceptedKg = acceptedQty || 445;

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
                    {`This creates the inventory batch and RECEIPT ledger movement for ${displayAcceptedKg} KG of ${displayProd} at ${displayWh}.`}
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
                <View style={customMismatchStyles.gridRow}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Batch ID</Text>
                    <Text style={customMismatchStyles.gridVal}>BAT-00512</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Batch Code</Text>
                    <Text style={customMismatchStyles.gridVal}>COO-TOM-G2-0925</Text>
                  </View>
                </View>

                <View style={customMismatchStyles.gridRow}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Quantity</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayAcceptedKg} KG</Text>
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
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Goods Receipt</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayGrn}</Text>
                  </View>
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
              <Text style={customMismatchStyles.headerSubtitle}>Batch BAT-00512</Text>
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <View style={customMismatchStyles.whiteCard}>
                <View style={customMismatchStyles.gridRow}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Warehouse</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayWh}</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Batch</Text>
                    <Text style={customMismatchStyles.gridVal}>BAT-00512</Text>
                  </View>
                </View>

                <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Product</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayProd} · {displayGrade}</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Quantity</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayAcceptedKg} KG</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={customMismatchStyles.secondaryBtn}
                activeOpacity={0.8}
                onPress={() => setBatchSubView('storage_list')}
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
              <Text style={customMismatchStyles.headerSubtitle}>Batch BAT-00512</Text>
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <Text style={customMismatchStyles.sectionHeading}>Storage Location List</Text>

              <View style={customMismatchStyles.whiteCard}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}
                  activeOpacity={0.7}
                  onPress={() => setBatchSubView('storage_detail')}
                >
                  <View>
                    <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>Cold Storage A · Rack 02 · Shelf 03</Text>
                    <Text style={{ ...adminType.caption, color: adminColors.muted, marginTop: 3 }}>1,650 / 2,000 KG used</Text>
                  </View>
                  <ChevronRightIcon size={18} color={adminColors.muted} />
                </TouchableOpacity>

                <View style={{ borderBottomWidth: 1, borderBottomColor: adminColors.border, marginVertical: 4 }} />

                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}
                  activeOpacity={0.7}
                  onPress={() => setBatchSubView('storage_detail')}
                >
                  <View>
                    <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>Dry Storage B · Rack 01 · Shelf 01</Text>
                    <Text style={{ ...adminType.caption, color: adminColors.muted, marginTop: 3 }}>920 / 1,500 KG used</Text>
                  </View>
                  <ChevronRightIcon size={18} color={adminColors.muted} />
                </TouchableOpacity>
              </View>
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
                <Text style={customMismatchStyles.headerTitle}>Cold Storage A</Text>
              </View>
              <Text style={customMismatchStyles.headerSubtitle}>Batch BAT-00512</Text>
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <Text style={customMismatchStyles.sectionHeading}>Cold Storage A</Text>

              <View style={customMismatchStyles.whiteCard}>
                <View style={customMismatchStyles.gridRow}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Current Stock</Text>
                    <Text style={customMismatchStyles.gridVal}>1,650 KG</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Capacity</Text>
                    <Text style={customMismatchStyles.gridVal}>2,000 KG</Text>
                  </View>
                </View>

                <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Assigned Batches</Text>
                    <Text style={customMismatchStyles.gridVal}>18</Text>
                  </View>
                </View>
              </View>

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
              <Text style={customMismatchStyles.headerSubtitle}>Batch BAT-00512</Text>
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <Text style={customMismatchStyles.sectionHeading}>Location Assignment Review</Text>

              <View style={customMismatchStyles.whiteCard}>
                <View style={customMismatchStyles.gridRow}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Batch</Text>
                    <Text style={customMismatchStyles.gridVal}>BAT-00512</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Product</Text>
                    <Text style={customMismatchStyles.gridVal}>Tomato</Text>
                  </View>
                </View>

                <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Quantity</Text>
                    <Text style={customMismatchStyles.gridVal}>445 KG</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Selected Location</Text>
                    <Text style={customMismatchStyles.gridVal}>Cold Storage A</Text>
                  </View>
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
              <Text style={customMismatchStyles.headerSubtitle}>Batch BAT-00512</Text>
            </View>

            <ScrollView style={customMismatchStyles.scroll} contentContainerStyle={customMismatchStyles.scrollPad} showsVerticalScrollIndicator={false}>
              <View style={customMismatchStyles.confirmCard}>
                <View style={customMismatchStyles.confirmCardHeader}>
                  <QuestionCircleIcon size={22} color={adminColors.brandDeep} />
                  <Text style={customMismatchStyles.confirmCardTitle}>Confirm Location Assignment?</Text>
                </View>

                <View style={customMismatchStyles.confirmInnerBox}>
                  <Text style={customMismatchStyles.confirmInnerText}>
                    445 KG of Tomato (BAT-00512) will be assigned to Cold Storage A.
                  </Text>
                </View>

                <View style={customMismatchStyles.confirmButtonsRow}>
                  <TouchableOpacity
                    style={customMismatchStyles.confirmActionBtn}
                    activeOpacity={0.75}
                    onPress={() => setBatchSubView('assignment_complete')}
                  >
                    <CheckmarkIcon size={14} color={adminColors.brand} />
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
              <Text style={customMismatchStyles.headerSubtitle}>Batch BAT-00512</Text>
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
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Batch</Text>
                    <Text style={customMismatchStyles.gridVal}>BAT-00512</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Location</Text>
                    <Text style={customMismatchStyles.gridVal}>Cold Storage A</Text>
                  </View>
                </View>

                <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Quantity</Text>
                    <Text style={customMismatchStyles.gridVal}>445 KG</Text>
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
                    <Text style={customMismatchStyles.gridLabel}>Accepted Qty</Text>
                    <Text style={customMismatchStyles.gridVal}>{displayAcceptedKg} KG</Text>
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
                    <Text style={customMismatchStyles.gridLabel}>Source Ref</Text>
                    <Text style={customMismatchStyles.gridVal}>{ship.reference || 'REF-8842'}</Text>
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
                  <Text style={customMismatchStyles.gridLabel}>Accepted Quantity</Text>
                  <Text style={customMismatchStyles.gridVal}>{displayAcceptedKg} KG</Text>
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
                <View style={customMismatchStyles.gridCol}>
                  <Text style={customMismatchStyles.gridLabel}>Received Date</Text>
                  <Text style={customMismatchStyles.gridVal}>25 Sep 2026</Text>
                </View>
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
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Batch Assignment</Text>
            <Text style={styles.headerSub}>{receiptCode}</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {stepper('Batch')}

          <Text style={styles.sectionHeader}>Batch Information</Text>
          <View style={styles.whiteCard}>
            <View style={styles.summaryMetaGrid}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Goods Receipt</Text>
                <Text style={styles.summaryMetaVal}>{receiptCode}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Warehouse</Text>
                <Text style={styles.summaryMetaVal}>{destinationName}</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Product</Text>
                <Text style={styles.summaryMetaVal}>{actualProduct}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Grade</Text>
                <Text style={styles.summaryMetaVal}>{actualGrade} (actual)</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Accepted Quantity</Text>
                <Text style={styles.summaryMetaVal}>{acceptedQty} KG</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Unit</Text>
                <Text style={styles.summaryMetaVal}>KG</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Storage Bay</Text>
          <View style={styles.issueTypeListCard}>
            {STORAGE_BAYS.map((bay, idx) => {
              const isSelected = bay.id === selectedBayId;
              return (
                <TouchableOpacity
                  key={bay.id}
                  style={[styles.issueTypeRow, idx === STORAGE_BAYS.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={() => setSelectedBayId(bay.id)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.radioOuterCircle, isSelected && styles.radioOuterCircleSelected]}>
                    {isSelected && <View style={styles.radioInnerCircle} />}
                  </View>
                  <View style={styles.bayTextBox}>
                    <Text style={[styles.issueTypeText, isSelected && styles.issueTypeTextSelected]}>
                      {bay.label} · {bay.zone}
                    </Text>
                    <Text style={styles.baySub}>Available Capacity: {bay.availableKg} KG</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {onOpenStorageLocations && (
            <TouchableOpacity style={styles.secondaryCtaBtn} activeOpacity={0.8} onPress={onOpenStorageLocations}>
              <Text style={styles.secondaryCtaText}>Review Before Creating Batch</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            disabled={isSubmittingReceipt}
            onPress={handleConfirmGoodsReceipt}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {isSubmittingReceipt ? (
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
     SCREEN 6: Receiving History
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'receiving_history') {
    // Rows come from the shared receiving records, limited to what the scope may see
    // (Sub: own warehouse; Main: all). The shell's Receiving History is the full list.
    const historyList = recordsInScope(scope).filter(r => WIZARD_HISTORY_IDS.includes(r.receiptId));

    const filtered = historyList.filter(item => {
      if (historyFilter === 'Accepted' && item.result !== 'Accepted') return false;
      if (historyFilter === 'Partial' && item.result !== 'Partially Accepted') return false;
      if (historyFilter === 'Rejected' && item.result !== 'Rejected') return false;
      const q = historySearch.toLowerCase();
      if (q && !item.receiptId.toLowerCase().includes(q) && !item.product.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receiving History</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Search Bar */}
          <View style={styles.searchBarWrap}>
            <SearchIcon />
            <TextInput
              style={styles.searchBarInput}
              placeholder="Search GR number / product"
              placeholderTextColor={adminColors.placeholder}
              value={historySearch}
              onChangeText={setHistorySearch}
            />
          </View>

          {/* Filter Pills */}
          <View style={styles.filterPillsRow}>
            {(['All', 'Accepted', 'Partial', 'Rejected'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, historyFilter === tab && styles.filterPillActive]}
                onPress={() => setHistoryFilter(tab)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterPillText, historyFilter === tab && styles.filterPillTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* List Cards */}
          {filtered.map(item => {
            const tone = resultTone(item.result);
            return (
              <TouchableOpacity
                key={item.receiptId}
                style={styles.historyCard}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedHistoryId(item.receiptId);
                  goToStep('receipt_detail');
                }}
              >
                <View style={styles.historyCardTopRow}>
                  <Text style={styles.historyCardCode}>{item.receiptId}</Text>
                  <View style={[styles.historyStatusPill, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.historyStatusText, { color: tone.text }]}>{item.result}</Text>
                  </View>
                </View>
                <Text style={styles.historyCardProduce}>
                  {item.product} · {item.grade}
                </Text>
                <View style={styles.historyCardStatsRow}>
                  <Text style={styles.historyStatLabel}>Received <Text style={styles.historyStatVal}>{item.receivedKg} KG</Text></Text>
                  {item.acceptedKg > 0 && <Text style={styles.historyStatLabel}>Accepted <Text style={styles.historyStatVal}>{item.acceptedKg} KG</Text></Text>}
                  {item.rejectedKg > 0 && <Text style={styles.historyStatLabel}>Rejected <Text style={[styles.historyStatVal, { color: adminColors.danger.text }]}>{item.rejectedKg} KG</Text></Text>}
                </View>
                <Text style={styles.historyCardDate}>{item.date}</Text>
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 7: Receipt Detail — the shared ReceivingHistoryDetailScreen
     (was a third inline copy of the receipt-detail design). A history row shows
     its record; otherwise the receipt being recorded is shown from wizard state.
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'receipt_detail') {
    const selected = selectedHistoryId !== undefined ? findReceivingRecord(selectedHistoryId) : undefined;
    const current: ReceivingRecord = selected ?? {
      receiptId: receiptCode,
      shipmentId: ship.reference ?? receiptCode,
      warehouseId: scope.warehouseId ?? '',
      warehouseName: destinationName,
      result: outcome === 'Accept' ? 'Accepted' : outcome === 'Reject' ? 'Rejected' : 'Partially Accepted',
      receivedBy: receiverName ?? '—',
      date: receivedDate,
      product: actualProduct,
      grade: actualGrade,
      expectedKg: expectedQty,
      receivedKg: receivedQty,
      acceptedKg: acceptedQty,
      rejectedKg: rejectedQty,
      rejectionReason: rejectedQty > 0 ? rejectionReason : undefined,
      batchId: acceptedQty > 0 ? batchId : undefined,
      qcResults: canQc ? qcStatusMap : undefined,
    };

    if (isSub) {
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
              <Text style={styles.headerSub}>{current.receiptId} · Official Receipt</Text>
            </View>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.voucherReceiptCard}>
              <View style={styles.voucherHeaderRow}>
                <View>
                  <View
                    style={[
                      styles.voucherStatusPill,
                      { backgroundColor: current.result === 'Accepted' ? adminColors.success.bg : adminColors.warning.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.voucherStatusText,
                        { color: current.result === 'Accepted' ? adminColors.success.text : adminColors.warning.text },
                      ]}
                    >
                      RECEIPT · {current.result.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.voucherIdText}>{current.receiptId}</Text>
                  <Text style={styles.voucherDateText}>{current.date || '25 Sep 2026'}</Text>
                </View>
                <View style={styles.voucherQrBox}>
                  <QrCodeIcon size={28} color={adminColors.brand} />
                </View>
              </View>

              <View style={styles.voucherDivider} />

              <View style={styles.summaryMetaGrid}>
                <View style={styles.summaryMetaCol}>
                  <Text style={styles.summaryMetaLabel}>Product</Text>
                  <Text style={styles.summaryMetaVal}>{current.product}</Text>
                </View>
                <View style={styles.summaryMetaCol}>
                  <Text style={styles.summaryMetaLabel}>Grade</Text>
                  <Text style={styles.summaryMetaVal}>{current.grade}</Text>
                </View>
              </View>

              <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
                <View style={styles.summaryMetaCol}>
                  <Text style={styles.summaryMetaLabel}>Expected Qty</Text>
                  <Text style={styles.summaryMetaVal}>{current.expectedKg} KG</Text>
                </View>
                <View style={styles.summaryMetaCol}>
                  <Text style={styles.summaryMetaLabel}>Accepted Qty</Text>
                  <Text style={[styles.summaryMetaVal, { color: adminColors.success.text, fontWeight: '800' }]}>{current.acceptedKg} KG</Text>
                </View>
              </View>

              {current.rejectedKg > 0 && (
                <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
                  <View style={styles.summaryMetaCol}>
                    <Text style={styles.summaryMetaLabel}>Rejected Qty</Text>
                    <Text style={[styles.summaryMetaVal, { color: adminColors.danger.text, fontWeight: '800' }]}>{current.rejectedKg} KG</Text>
                  </View>
                  <View style={styles.summaryMetaCol}>
                    <Text style={styles.summaryMetaLabel}>Rejection Reason</Text>
                    <Text style={styles.summaryMetaVal}>{current.rejectionReason ?? 'Quality Below Grade'}</Text>
                  </View>
                </View>
              )}

              <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
                <View style={styles.summaryMetaCol}>
                  <Text style={styles.summaryMetaLabel}>Source</Text>
                  <Text style={styles.summaryMetaVal}>{sourceName}</Text>
                </View>
                <View style={styles.summaryMetaCol}>
                  <Text style={styles.summaryMetaLabel}>Destination</Text>
                  <Text style={styles.summaryMetaVal}>{current.warehouseName}</Text>
                </View>
              </View>

              <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
                <View style={styles.summaryMetaCol}>
                  <Text style={styles.summaryMetaLabel}>Batch Reference</Text>
                  <Text style={styles.summaryMetaVal}>{current.batchId ?? batchId}</Text>
                </View>
                <View style={styles.summaryMetaCol}>
                  <Text style={styles.summaryMetaLabel}>Receiver</Text>
                  <Text style={styles.summaryMetaVal}>{current.receivedBy}</Text>
                </View>
              </View>

              <View style={styles.voucherDivider} />

              <View style={styles.voucherQcBadge}>
                <CheckmarkCircleOutlineIcon size={22} color={adminColors.success.text} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.voucherQcTitle}>Verified & Posted to Ledger</Text>
                  <Text style={styles.voucherQcSub}>Inspected by {current.receivedBy} · Stock updated in inventory</Text>
                </View>
              </View>
            </View>

            <View style={{ gap: 12, marginTop: 12 }}>
              <TouchableOpacity
                style={styles.primaryCtaBtn}
                activeOpacity={0.85}
                onPress={() => Alert.alert('Goods Receipt', `Receipt ${current.receiptId} printed / shared successfully.`)}
              >
                <Text style={styles.primaryCtaText}>Share / Print Receipt</Text>
              </TouchableOpacity>

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

    return (
      <ReceivingHistoryDetailScreen
        scope={scope}
        can={can}
        onBack={handleBack}
        record={current}
        backLabel={selected !== undefined ? undefined : '← Back'}
        onNavigateDiscrepancy={canRecord ? () => goToStep('damage_mismatch') : undefined}
        onNavigateBatch={
          onViewBatch && current.batchId !== undefined ? () => onViewBatch(current.batchId ?? '') : undefined
        }
      />
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 8: Rejected Goods
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'rejected_goods') {
    const reasons = REJECTED_GOODS_REASONS;

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Rejected Goods</Text>
            <Text style={styles.headerSub}>{receiptCode}</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Rejected Product */}
          <Text style={styles.sectionHeader}>Rejected Product</Text>
          <View style={styles.whiteCard}>
            <View style={styles.summaryMetaGrid}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Product</Text>
                <Text style={styles.summaryMetaVal}>{actualProduct}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Grade</Text>
                <Text style={styles.summaryMetaVal}>{actualGrade}</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Batch / Receipt</Text>
                <Text style={styles.summaryMetaVal}>{receiptCode}</Text>
              </View>
            </View>
          </View>

          {/* Quantity */}
          <Text style={styles.sectionHeader}>Quantity</Text>
          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{expectedQty} KG</Text>
              <Text style={styles.statTileLabel}>EXPECTED</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{receivedQty} KG</Text>
              <Text style={styles.statTileLabel}>RECEIVED</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{acceptedQty} KG</Text>
              <Text style={styles.statTileLabel}>ACCEPTED</Text>
            </View>
          </View>

          {/* Rejected Quantity Banner */}
          <View style={styles.rejectedQtyBanner}>
            <Text style={styles.rejectedQtyNum}>{rejectedQty} KG</Text>
            <Text style={styles.rejectedQtyLabel}>REJECTED QUANTITY</Text>
          </View>

          {/* Rejection Reason */}
          <Text style={styles.sectionHeader}>Rejection Reason</Text>
          <View style={styles.issueTypeListCard}>
            {reasons.map((reason, idx) => {
              const isSelected = selectedRejectedReason === reason;
              const isLast = idx === reasons.length - 1;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.issueTypeRow, isLast && { borderBottomWidth: 0 }]}
                  onPress={() => setSelectedRejectedReason(reason)}
                  activeOpacity={0.75}
                >
                  <CheckboxSquareIcon checked={isSelected} />
                  <Text style={[styles.issueTypeText, isSelected && { fontWeight: '700', color: adminColors.ink }]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Evidence */}
          <Text style={styles.sectionHeader}>Evidence</Text>
          <View style={styles.qcPhotosRow}>
            <View style={styles.qcPhotoThumbnail}>
              <PictureIcon />
            </View>
            <View style={styles.qcPhotoThumbnail}>
              <PictureIcon />
            </View>
            <TouchableOpacity
              style={styles.qcPhotoAddBox}
              onPress={() => Alert.alert('Camera', 'Photo added.')}
              activeOpacity={0.7}
            >
              <CameraPlusIcon size={24} />
              <Text style={styles.qcPhotoAddText}>Add Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <Text style={styles.sectionHeader}>Notes</Text>
          <View style={styles.whiteCard}>
            <Text style={styles.rejectedNotesText}>
              {rejectedQty} KG rejected on inspection ({rejectionReason}) — isolated and rejected.
              {partialNotes ? ` ${partialNotes}` : ''}
            </Text>
          </View>

          {/* Disposal / Handling Record */}
          <Text style={styles.sectionHeader}>Disposal / Handling Record</Text>
          <View style={styles.handlingStatusPill}>
            <ClockSmallIcon color={adminColors.warning.text} size={16} />
            <Text style={styles.handlingStatusText}>
              Handling Status: {handlingStatus}
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            onPress={() => goToStep('record_handling')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ClipboardChecklistIcon />
              <Text style={styles.primaryCtaText}>Record Handling</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 9: Record Handling
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'record_handling') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={adminColors.brand} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Handling</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Rejected Quantity Banner */}
          <View style={styles.rejectedQtyBanner}>
            <Text style={styles.rejectedQtyNum}>{rejectedQty} KG</Text>
            <Text style={styles.rejectedQtyLabel}>REJECTED QUANTITY</Text>
          </View>

          {/* Handling Information */}
          <Text style={styles.sectionHeader}>Handling Information</Text>
          <TouchableOpacity
            style={styles.dropdownSelectBox}
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert(
                'Select Method',
                'Choose handling method',
                HANDLING_METHODS.map(m => ({ text: m, onPress: () => setHandlingMethod(m) })),
              );
            }}
          >
            <View>
              <Text style={styles.dropdownLabel}>HANDLING / DISPOSAL METHOD</Text>
              <Text style={[styles.dropdownValue, handlingMethod === 'Select method' && { color: adminColors.muted }]}>
                {handlingMethod}
              </Text>
            </View>
            <ChevronDownIcon />
          </TouchableOpacity>

          {/* Date & Time */}
          <Text style={styles.sectionHeader}>Date & Time</Text>
          <View style={styles.rowTwoCols}>
            <View style={styles.colHalf}>
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput style={styles.textInput} value={handlingDate} onChangeText={setHandlingDate} />
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.inputLabel}>Time</Text>
              <TextInput style={styles.textInput} value={handlingTime} onChangeText={setHandlingTime} />
            </View>
          </View>

          {/* Notes */}
          <Text style={styles.sectionHeader}>Notes</Text>
          <TextInput
            style={styles.describeIssueInput}
            placeholder="Add remarks"
            placeholderTextColor={adminColors.placeholder}
            multiline
            numberOfLines={3}
            value={handlingRemarks}
            onChangeText={setHandlingRemarks}
          />

          {/* Photo */}
          <Text style={styles.sectionHeader}>Photo</Text>
          <TouchableOpacity
            style={styles.dashedAddBoxSmall}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Camera', 'Handling evidence photo captured.')}
          >
            <CameraPlusIcon size={24} />
            <Text style={styles.dashedAddBoxText}>Add Evidence</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            onPress={() => {
              setHandlingStatus('Recorded');
              if (Platform.OS === 'android') {
                ToastAndroid.show('Record submitted', ToastAndroid.SHORT);
              }
              handleBack();
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <SendPaperAirplaneIcon />
              <Text style={styles.primaryCtaText}>Submit Record</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
          {/* Draft Banner */}
          <View style={styles.draftStatusBanner}>
            <PencilDraftIcon color={adminColors.warning.text} size={16} />
            <Text style={styles.draftStatusBannerText}>Draft — Not Submitted</Text>
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
              <Text style={styles.statTileNumber}>{expectedQty} KG</Text>
              <Text style={styles.statTileLabel}>EXPECTED</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{receivedQty} KG</Text>
              <Text style={styles.statTileLabel}>RECEIVED</Text>
            </View>
          </View>

          {/* QC Progress (inventory.quality_check.perform) */}
          {canQc && (
            <>
              <Text style={styles.sectionHeader}>QC Progress</Text>
              <TouchableOpacity style={styles.whiteCard} onPress={() => goToStep('continue_receiving')} activeOpacity={0.8}>
                <Text style={styles.qcProgressNumbers}>
                  {DEMO_QC_PROGRESS.done} / {DEMO_QC_PROGRESS.total} Completed
                </Text>
                <Text style={styles.qcProgressSub}>QUALITY CHECKS</Text>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.round((DEMO_QC_PROGRESS.done / DEMO_QC_PROGRESS.total) * 100)}%` },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </>
          )}

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
            {canQc && (
              <TouchableOpacity style={styles.checklistRow} onPress={() => goToStep('quality_check')} activeOpacity={0.7}>
                <View style={styles.checkCircleDone}>
                  <CheckmarkIcon size={10} />
                </View>
                <Text style={styles.checklistRowText}>Photos</Text>
              </TouchableOpacity>
            )}
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
                Check {QC_CRITERIA.length} of {QC_CRITERIA.length}
              </Text>
              <Text style={{ ...adminType.caption, fontWeight: '700', color: adminColors.muted, letterSpacing: 0.8, marginTop: 4, textAlign: 'center', textTransform: 'uppercase' }}>
                {QC_CRITERIA[QC_CRITERIA.length - 1]?.title ?? ''}
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
    const isFullReject = acceptedQty === 0;
    const isFullAccept = rejectedQty === 0;
    const isPartialAccept = acceptedQty > 0 && rejectedQty > 0;

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
                  <Text style={styles.decisionTableLabel}>Expected</Text>
                  <Text style={styles.decisionTableValue}>{expectedQty} KG</Text>
                </View>
                <View style={styles.decisionTableRow}>
                  <Text style={styles.decisionTableLabel}>Accepted</Text>
                  <Text style={styles.decisionTableValue}>0 KG</Text>
                </View>
                <View style={[styles.decisionTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.decisionTableLabel}>Rejected</Text>
                  <Text style={[styles.decisionTableValue, { color: adminColors.danger.text, fontWeight: '800' }]}>
                    {rejectedQty || expectedQty} KG
                  </Text>
                </View>
              </View>

              {/* QC Result Card */}
              <View style={styles.whiteCard}>
                <Text style={{ ...adminType.body, color: adminColors.muted, marginBottom: 4, fontWeight: '500' }}>QC Result</Text>
                <Text style={{ ...adminType.sectionHead, fontWeight: '800', color: adminColors.ink }}>Rejected</Text>
              </View>

              {/* Rejected Goods Card (inventory.produce.reject_incoming) */}
              {canReject && (
              <TouchableOpacity
                style={[styles.whiteCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 }]}
                onPress={() => goToStep('rejected_goods')}
                activeOpacity={0.75}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TrashOutlineRedIcon color={adminColors.danger.text} size={22} />
                  <View>
                    <Text style={{ ...adminType.body, color: adminColors.muted, fontWeight: '500' }}>Rejected Goods</Text>
                    <Text style={{ ...adminType.sectionHead, fontWeight: '800', color: adminColors.ink, marginTop: 2 }}>Created</Text>
                  </View>
                </View>
                <ChevronRightSmall />
              </TouchableOpacity>
              )}

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
                  <Text style={styles.decisionTableLabel}>Expected</Text>
                  <Text style={styles.decisionTableValue}>{expectedQty} KG</Text>
                </View>
                <View style={styles.decisionTableRow}>
                  <Text style={styles.decisionTableLabel}>Accepted</Text>
                  <Text style={[styles.decisionTableValue, { color: adminColors.success.text, fontWeight: '800' }]}>
                    {acceptedQty || expectedQty} KG
                  </Text>
                </View>
                <View style={[styles.decisionTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.decisionTableLabel}>Rejected</Text>
                  <Text style={styles.decisionTableValue}>0 KG</Text>
                </View>
              </View>

              {/* QC / Batch Card */}
              <View style={styles.whiteCard}>
                <View style={styles.summaryMetaGrid}>
                  {/* QC result from the recorded checks (was always "Passed"); QC gate only */}
                  {canQc && (
                    <View style={styles.summaryMetaCol}>
                      <Text style={styles.summaryMetaLabel}>QC</Text>
                      <Text style={[styles.summaryMetaVal, { marginTop: 3 }]}>
                        {qcIssueCount > 0 ? `Passed · ${qcIssueCount} flagged` : 'Passed'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.summaryMetaCol}>
                    <Text style={styles.summaryMetaLabel}>Batch</Text>
                    <Text style={[styles.summaryMetaVal, { marginTop: 3 }]}>{batchId}</Text>
                  </View>
                </View>
              </View>

              {/* Inventory Result Card */}
              <View style={[styles.whiteCard, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
                <CrateInventoryIcon color={adminColors.warning.text} size={24} />
                <View style={{ flex: 1 }}>
                  <Text style={{ ...adminType.body, color: adminColors.muted, fontWeight: '500' }}>Full quantity accepted</Text>
                  <Text style={{ ...adminType.sectionHead, fontWeight: '800', color: adminColors.ink, marginTop: 2 }}>
                    Batch Created · {batchId}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={{ gap: 12, marginTop: 8 }}>
                {/* View Batch (inventory.batch.view) */}
                {canViewBatch && (
                <TouchableOpacity
                  style={[styles.actionPrimaryBtn, { justifyContent: 'flex-start', paddingHorizontal: 20, gap: 14, marginBottom: 0 }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (onViewBatch) {
                      onViewBatch(batchId);
                    } else {
                      const bayLine = canBatch && selectedBay ? ` allocated to ${selectedBay.label}` : '';
                      Alert.alert('View Batch', `${batchId}\nFull ${acceptedQty || expectedQty} KG ${actualProduct}${bayLine}.`);
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
                  <Text style={styles.decisionTableLabel}>Expected</Text>
                  <Text style={styles.decisionTableValue}>{expectedQty} KG</Text>
                </View>
                <View style={styles.decisionTableRow}>
                  <Text style={styles.decisionTableLabel}>Accepted</Text>
                  <Text style={[styles.decisionTableValue, { color: adminColors.success.text, fontWeight: '800' }]}>
                    {acceptedQty} KG
                  </Text>
                </View>
                <View style={[styles.decisionTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.decisionTableLabel}>Rejected</Text>
                  <Text style={[styles.decisionTableValue, { color: adminColors.danger.text, fontWeight: '800' }]}>
                    {rejectedQty} KG
                  </Text>
                </View>
              </View>

              {/* Reason Card */}
              <View style={styles.whiteCard}>
                <Text style={{ ...adminType.body, color: adminColors.muted, marginBottom: 4, fontWeight: '500' }}>Reason</Text>
                <Text style={{ ...adminType.sectionHead, fontWeight: '800', color: adminColors.ink }}>
                  {rejectionReason || 'Damage / Pest (recorded QC reason)'}
                </Text>
              </View>

              {/* Inventory Result Card */}
              <View style={[styles.whiteCard, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
                <CrateInventoryIcon color={adminColors.warning.text} size={24} />
                <View style={{ flex: 1 }}>
                  <Text style={{ ...adminType.body, color: adminColors.muted, fontWeight: '500' }}>{acceptedQty} KG accepted</Text>
                  <Text style={{ ...adminType.sectionHead, fontWeight: '800', color: adminColors.ink, marginTop: 2 }}>
                    Batch Created · {batchId}
                  </Text>
                </View>
              </View>

              {/* Rejected Goods Card (inventory.produce.reject_incoming) */}
              {canReject && (
              <TouchableOpacity
                style={[styles.whiteCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 }]}
                onPress={() => goToStep('rejected_goods')}
                activeOpacity={0.75}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TrashOutlineRedIcon color={adminColors.danger.text} size={22} />
                  <View>
                    <Text style={{ ...adminType.body, color: adminColors.muted, fontWeight: '500' }}>Rejected Goods</Text>
                    <Text style={{ ...adminType.sectionHead, fontWeight: '800', color: adminColors.ink, marginTop: 2 }}>Pending Handling</Text>
                  </View>
                </View>
                <ChevronRightSmall />
              </TouchableOpacity>
              )}

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
          <Text style={styles.allChecksCompletedSub}>
            Your receiving record was not successfully submitted. Please try again.
          </Text>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            disabled={isSubmittingReceipt}
            onPress={handleRetrySubmission}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {isSubmittingReceipt ? (
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
     SCREEN 13: Damage / Mismatch
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'damage_mismatch') {
    if (!isSub) {
      if (mismatchSubView === 'detail') {
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
              <Text style={customMismatchStyles.headerSubtitle}>{receiptCode || 'SHP-000124'} · Combined discrepancies</Text>
            </View>

            <ScrollView
              style={customMismatchStyles.scroll}
              contentContainerStyle={customMismatchStyles.scrollPad}
              showsVerticalScrollIndicator={false}
            >
              <Text style={customMismatchStyles.sectionHeading}>Quantity — Discrepancy Detail</Text>

              {/* Info Card */}
              <View style={customMismatchStyles.infoCard}>
                <View style={customMismatchStyles.gridRow}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Discrepancy ID</Text>
                    <Text style={customMismatchStyles.gridVal}>DSC-00412</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Type</Text>
                    <Text style={customMismatchStyles.gridVal}>Quantity</Text>
                  </View>
                </View>

                <View style={customMismatchStyles.gridRow}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Product</Text>
                    <Text style={customMismatchStyles.gridVal}>{actualProduct || 'Tomato'}</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Expected</Text>
                    <Text style={customMismatchStyles.gridVal}>{expectedQty || 500} KG</Text>
                  </View>
                </View>

                <View style={customMismatchStyles.gridRow}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Actual</Text>
                    <Text style={customMismatchStyles.gridVal}>{receivedQty || 480} KG</Text>
                  </View>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Created By</Text>
                    <Text style={customMismatchStyles.gridVal}>Suresh</Text>
                  </View>
                </View>

                <View style={[customMismatchStyles.gridRow, { marginBottom: 0 }]}>
                  <View style={customMismatchStyles.gridCol}>
                    <Text style={customMismatchStyles.gridLabel}>Created</Text>
                    <Text style={customMismatchStyles.gridVal}>25 Sep, 10:25 AM</Text>
                  </View>
                </View>
              </View>

              {/* Notes Card */}
              <View style={customMismatchStyles.notesCard}>
                <Text style={customMismatchStyles.notesPlaceholder}>Notes</Text>
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>

            {/* Bottom Button */}
            <View style={customMismatchStyles.bottomBar}>
              <TouchableOpacity
                style={customMismatchStyles.actionBtn}
                onPress={() => goToStep('receiving_decision')}
                activeOpacity={0.8}
              >
                <RightArrowIcon size={18} color={adminColors.onBrand} />
                <Text style={customMismatchStyles.actionBtnText}>Continue to Acceptance Decision</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      const mainDiscrepancies = [
        {
          id: '1',
          title: `Quantity — ${actualProduct || 'Tomato'}`,
          subtitle: `Expected ${expectedQty || 500} KG · Actual ${receivedQty || 480} KG`,
          icon: ScaleIcon,
          status: 'Open',
        },
        {
          id: '2',
          title: `Grade — ${actualProduct || 'Tomato'}`,
          subtitle: `Expected ${expectedGrade || 'Grade 1'} · Actual ${actualGrade || 'Grade 2'}`,
          icon: StarIcon,
          status: 'Open',
        },
        {
          id: '3',
          title: `Quality — ${actualProduct || 'Tomato'}`,
          subtitle: 'Good expected · Damaged actual',
          icon: AlertCircleOutlineIcon,
          status: 'Open',
        },
      ];

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
            <Text style={customMismatchStyles.headerSubtitle}>{receiptCode || 'SHP-000124'} · Combined discrepancies</Text>
          </View>

          <ScrollView
            style={customMismatchStyles.scroll}
            contentContainerStyle={customMismatchStyles.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            {/* Discrepancy Card List */}
            <View style={customMismatchStyles.listCard}>
              {mainDiscrepancies.map((item, index) => {
                const isLast = index === mainDiscrepancies.length - 1;
                const IconComp = item.icon;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[customMismatchStyles.itemRow, !isLast && customMismatchStyles.itemRowBorder]}
                    onPress={() => setMismatchSubView('detail')}
                    activeOpacity={0.75}
                  >
                    <View style={customMismatchStyles.iconCircle}>
                      <IconComp size={18} color={adminColors.brand} />
                    </View>
                    <View style={customMismatchStyles.itemContent}>
                      <Text style={customMismatchStyles.itemTitle}>{item.title}</Text>
                      <Text style={customMismatchStyles.itemSub}>{item.subtitle}</Text>
                    </View>
                    <View style={customMismatchStyles.badge}>
                      <Text style={customMismatchStyles.badgeText}>{item.status}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

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

          {/* Pinned Bottom Action Button */}
          <View style={customMismatchStyles.bottomBar}>
            <TouchableOpacity
              style={customMismatchStyles.actionBtn}
              onPress={() => goToStep('receiving_decision')}
              activeOpacity={0.8}
            >
              <RightArrowIcon size={18} color={adminColors.onBrand} />
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
            <Text style={styles.headerSub}>{receiptCode} · Combined discrepancies</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Absorbed DamageMismatchReportScreen: every discrepancy found so far, derived from the steps */}
          {discrepancies.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Discrepancies</Text>
              <View style={styles.issueTypeListCard}>
                {discrepancies.map((d, idx) => (
                  <View
                    key={d.id}
                    style={[styles.issueTypeRow, idx === discrepancies.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <View style={styles.discrepancyIconCircle}>
                      <AlertCircleOutlineIcon color={adminColors.brand} size={18} />
                    </View>
                    <View style={styles.bayTextBox}>
                      <Text style={styles.issueTypeTextSelected}>
                        {d.kind} — {actualProduct}
                      </Text>
                      <Text style={styles.baySub}>{d.detail}</Text>
                    </View>
                    <View style={[styles.historyStatusPill, { backgroundColor: adminColors.brandTint }]}>
                      <Text style={[styles.historyStatusText, { color: adminColors.brandDeep }]}>Open</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          <Text style={styles.sectionHeader}>Issue Type</Text>
          <View style={styles.issueTypeListCard}>
            {ISSUE_TYPES.map((type, idx) => {
              const isSelected = selectedIssueType === type;
              const isLast = idx === ISSUE_TYPES.length - 1;

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
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionHeader}>Quantity</Text>
          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{expectedQty} KG</Text>
              <Text style={styles.statTileLabel}>EXPECTED</Text>
            </View>

            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>{receivedQty} KG</Text>
              <Text style={styles.statTileLabel}>RECEIVED</Text>
            </View>

            <View style={styles.statTile}>
              <Text
                style={[
                  styles.statTileNumber,
                  receivedQty !== expectedQty && { color: adminColors.danger.text },
                ]}
              >
                {signedKg(receivedQty - expectedQty)}
              </Text>
              <Text style={styles.statTileLabel}>{receivedQty > expectedQty ? 'EXCESS' : 'SHORTAGE'}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Describe the Issue</Text>
          <TextInput
            style={styles.describeIssueInput}
            placeholder="Describe what happened..."
            placeholderTextColor={adminColors.placeholder}
            multiline
            numberOfLines={3}
            value={issueDescription}
            onChangeText={setIssueDescription}
          />

          <Text style={styles.sectionHeader}>Evidence</Text>
          <TouchableOpacity
            style={styles.dashedAddBox}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Evidence', 'Evidence photo attached.')}
          >
            <CameraPlusIcon />
            <Text style={styles.dashedAddBoxText}>Add Evidence</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            onPress={() => goToStep(afterMismatchStep)}
          >
            <Text style={styles.primaryCtaText}>
              {afterMismatchStep === 'receiving_decision' ? 'Continue to Acceptance Decision  →' : 'Continue  →'}
            </Text>
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
              Shipment {receiptCode}
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
                <Text style={[styles.historyStatusText, { color: adminColors.warning.text }]}>QC Pending</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Reference</Text>
                <Text style={styles.summaryMetaVal}>{receiptCode}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Expected Quantity</Text>
                <Text style={styles.summaryMetaVal}>{expectedQty} KG</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: adminSpacing.md }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Vehicle & Driver</Text>
                <Text style={styles.summaryMetaVal}>{ship.vehicle ?? '—'}</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Arrival Time</Text>
                <Text style={styles.summaryMetaVal}>{ship.arrival ?? receivedTime}</Text>
              </View>
            </View>
          </View>

          {/* 2. Weight & tally verification */}
          <Text style={styles.sectionHeader}>Weight & Tally Verification</Text>
          <View style={styles.whiteCard}>
            <View style={styles.produceInnerCard}>
              <Text style={styles.produceTitle}>
                {expectedProduct} ({expectedGrade})
              </Text>
            </View>
            <View style={[styles.rowTwoCols, { marginTop: adminSpacing.md }]}>
              <View style={styles.colHalf}>
                <Text style={styles.inputLabel}>Gross Scale Weight (KG)</Text>
                <TextInput
                  style={styles.textInput}
                  value={grossWeight}
                  onChangeText={setGrossWeight}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.inputLabel}>No. of Crates</Text>
                <TextInput
                  style={styles.textInput}
                  value={crateCount}
                  onChangeText={setCrateCount}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <View style={styles.weightSummaryBox}>
              <View style={styles.weightSummaryItem}>
                <Text style={styles.summaryMetaLabel}>Gross</Text>
                <Text style={styles.summaryMetaVal}>{parsedGross.toFixed(1)} KG</Text>
              </View>
              <View style={styles.weightSummaryItem}>
                <Text style={styles.summaryMetaLabel}>Tare ({parsedCrates} crates)</Text>
                <Text style={styles.summaryMetaVal}>-{tareWeight.toFixed(1)} KG</Text>
              </View>
              <View style={styles.weightSummaryItem}>
                <Text style={styles.summaryMetaLabel}>Net Verified</Text>
                <Text style={[styles.summaryMetaVal, { color: adminColors.brand }]}>{netWeight.toFixed(1)} KG</Text>
              </View>
            </View>
          </View>

          {/* 3. Quality inspection parameters (inventory.quality_check.perform) */}
          {canQc && (
            <>
              <Text style={styles.sectionHeader}>Quality Inspection Parameters</Text>
              <View style={styles.issueTypeListCard}>
                {INSPECTION_PARAMETERS.map((p, idx) => {
                  const checked = inspection[p.id] ?? false;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.issueTypeRow, idx === INSPECTION_PARAMETERS.length - 1 && { borderBottomWidth: 0 }]}
                      onPress={() => setInspection(prev => ({ ...prev, [p.id]: !checked }))}
                      activeOpacity={0.8}
                    >
                      <CheckboxSquareIcon checked={checked} />
                      <View style={styles.bayTextBox}>
                        <Text style={styles.issueTypeTextSelected}>{p.title}</Text>
                        <Text style={styles.baySub}>{p.description}</Text>
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
              <View style={styles.issueTypeListCard}>
                {STORAGE_BAYS.map((bay, idx) => {
                  const isSelected = bay.id === selectedBayId;
                  return (
                    <TouchableOpacity
                      key={bay.id}
                      style={[styles.issueTypeRow, idx === STORAGE_BAYS.length - 1 && { borderBottomWidth: 0 }]}
                      onPress={() => setSelectedBayId(bay.id)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.radioOuterCircle, isSelected && styles.radioOuterCircleSelected]}>
                        {isSelected && <View style={styles.radioInnerCircle} />}
                      </View>
                      <View style={styles.bayTextBox}>
                        <Text style={[styles.issueTypeText, isSelected && styles.issueTypeTextSelected]}>
                          {bay.label} · {bay.zone}
                        </Text>
                        <Text style={styles.baySub}>Available Capacity: {bay.availableKg} KG · Temperature Monitored</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Actions */}
          <View style={styles.reviewActions}>
            <TouchableOpacity
              style={styles.actionPrimaryBtn}
              onPress={() => setIsReviewSuccessVisible(true)}
              activeOpacity={0.85}
            >
              <CheckmarkIcon color={adminColors.onBrand} size={18} />
              <Text style={styles.actionPrimaryBtnText}>Accept & Add to Inventory ({netWeight.toFixed(1)} KG)</Text>
            </TouchableOpacity>

            {canReject && (
              <TouchableOpacity
                style={styles.actionSecondaryBtn}
                onPress={() =>
                  Alert.alert('Report Variance', 'Flag shipment for supervisor review and log partial rejection notice.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm Flag', onPress: handleBack, style: 'destructive' },
                  ])
                }
                activeOpacity={0.8}
              >
                <Text style={[styles.actionSecondaryBtnText, { color: adminColors.muted }]}>
                  Report Variance / Partial Discrepancy
                </Text>
              </TouchableOpacity>
            )}
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
                Shipment <Text style={{ fontWeight: '700', color: adminColors.ink }}>{receiptCode}</Text> has been verified and{' '}
                <Text style={{ fontWeight: '700', color: adminColors.brand }}>
                  {netWeight.toFixed(1)} KG of {expectedProduct}
                </Text>{' '}
                has been added to {destinationName || 'warehouse'} inventory.
              </Text>
              <View style={styles.modalReceiptCard}>
                <Text style={styles.modalReceiptRow}>
                  <Text style={{ color: adminColors.muted }}>GRN Number: </Text>
                  <Text style={{ fontWeight: '700', color: adminColors.ink }}>{DEMO_GRN}</Text>
                </Text>
                {canBatch && selectedBay && (
                  <Text style={styles.modalReceiptRow}>
                    <Text style={{ color: adminColors.muted }}>Storage Bay: </Text>
                    <Text style={{ fontWeight: '700', color: adminColors.ink }}>
                      {selectedBay.label} ({selectedBay.zone})
                    </Text>
                  </Text>
                )}
                <Text style={styles.modalReceiptRow}>
                  <Text style={{ color: adminColors.muted }}>Verified By: </Text>
                  <Text style={{ fontWeight: '700', color: adminColors.ink }}>{receiverName ?? '—'}</Text>
                </Text>
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

  // Fallback return if step is not matched
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

