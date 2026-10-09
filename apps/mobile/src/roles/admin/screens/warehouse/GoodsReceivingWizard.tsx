import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  ToastAndroid,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export type ReceivingWizardStep =
  | 'start_receiving'
  | 'quantity_verification'
  | 'quality_check'
  | 'damage_mismatch'
  | 'receiving_decision'
  | 'partial_acceptance'
  | 'receipt_summary'
  | 'receiving_history'
  | 'receipt_detail'
  | 'rejected_goods'
  | 'record_handling'
  | 'receiving_in_progress'
  | 'continue_receiving'
  | 'receipt_confirmation'
  | 'submission_error';

export interface WizardShipmentData {
  code: string;
  produce: string;
  grade?: string | undefined;
  expectedQty: number;
  receivedQty?: number | undefined;
  acceptedQty?: number | undefined;
  rejectedQty?: number | undefined;
  receivedDate?: string | undefined;
  receivedTime?: string | undefined;
  reference?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  batchSource?: string | undefined;
}

interface GoodsReceivingWizardProps {
  initialStep: ReceivingWizardStep;
  shipment?: WizardShipmentData | undefined;
  onClose: () => void;
  onFinish?: (() => void) | undefined;
  onBackToShipments?: (() => void) | undefined;
  onViewBatch?: ((batchId: string) => void) | undefined;
}

const PRIMARY_COLOR = '#F0562A';
const SUCCESS_COLOR = '#1E8E5A';

/* ─── Svg Icons ─── */
function BackArrowIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkIcon({ color = '#FFFFFF', size = 12 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CameraPlusIcon({ color = '#6B7280', size = 28 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.8" />
      <Path d="M19 10v3M17.5 11.5h3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function WarningTriangleIcon({ color = '#B45309', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function AlertCircleOutlineIcon({ color = PRIMARY_COLOR, size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function EyeIcon({ color = '#B45309' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function RulerIcon({ color = '#B45309' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.3 8.7l-6-6a2 2 0 0 0-2.8 0L3.2 12a2 2 0 0 0 0 2.8l6 6a2 2 0 0 0 2.8 0l9.3-9.3a2 2 0 0 0 0-2.8zM7.5 10.5l2-2M10.5 13.5l2-2M13.5 16.5l2-2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DropIcon({ color = '#B45309' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BugIcon({ color = '#B45309' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4a3 3 0 0 0-3 3v2h6V7a3 3 0 0 0-3-3zM8 12a4 4 0 0 0 8 0v4a4 4 0 0 1-8 0v-4zM6 10l-3-2M18 10l3-2M5 14H2M22 14h-3M6 18l-3 2M18 18l3 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LeafIcon({ color = '#B45309' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10zM2 21c0-3 1.85-5.36 5.08-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PictureIcon({ color = '#9CA3AF' }: { color?: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Circle cx="8.5" cy="8.5" r="1.5" stroke={color} strokeWidth="1.8" />
      <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckmarkCircleOutlineIcon({ color = '#1E8E5A', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function NotEqualIcon({ color = '#B45309', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top row: horizontal bar and checkmark */}
      <Path d="M4 8h5.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <Path d="M13 8l2 2 4.5-4.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Bottom row: horizontal bar and cross */}
      <Path d="M4 16h5.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
      <Path d="M14 13.5l4.5 4.5M18.5 13.5l-4.5 4.5" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CrossCircleIcon({ color = '#DC2626', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BoxStorageIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClipboardChecklistIcon({ color = '#FFFFFF', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SendPaperAirplaneIcon({ color = '#FFFFFF', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RightArrowIcon({ color = '#FFFFFF', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronRightSmall({ color = '#9CA3AF', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockSmallIcon({ color = '#B45309', size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckboxSquareIcon({ checked = false, color = PRIMARY_COLOR }: { checked?: boolean; color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        fill={checked ? color : '#FFFFFF'}
        stroke={checked ? color : '#D1D5DB'}
        strokeWidth="2"
      />
      {checked && (
        <Path
          d="M7 12l3.5 3.5L17 8"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

function PencilDraftIcon({ color = '#B45309', size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReceiptPaperIcon({ color = '#FFFFFF', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 7h8M8 11h8M8 15h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function QrCodeIcon({ color = '#1E1612', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M19 15v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TruckDeliveryIcon({ color = '#1E1612', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function TrashOutlineRedIcon({ color = '#E11D48', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CrateInventoryIcon({ color = '#92400E', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 4v6M14 4v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function RefreshRetryIcon({ color = '#FFFFFF', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 4v6h-6M1 20v-6h6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ErrorExclamationCircleIcon({ color = '#DC2626', size = 32 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 7v6" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      <Circle cx="12" cy="16.5" r="1.2" fill={color} />
    </Svg>
  );
}

function RedCrossBadgeIcon({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StepperCheckIcon({ size = 15, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4 4L19 7"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* ─── Stepper Component ─── */
interface StepperProps {
  currentStepIndex: number; // 1 to 5
}

function StepperHeader({ currentStepIndex }: StepperProps) {
  const steps = [
    { number: 1, label: 'Shipment' },
    { number: 2, label: 'Quantity' },
    { number: 3, label: 'Quality' },
    { number: 4, label: 'Decision' },
    { number: 5, label: 'Summary' },
  ];

  const progressPercent = Math.min(
    100,
    Math.max(0, ((currentStepIndex - 1) / (steps.length - 1)) * 100)
  );

  return (
    <View style={styles.stepperCard}>
      <View style={styles.stepperRow}>
        {/* Continuous Connecting Line behind the circles */}
        <View style={styles.stepperTrackContainer}>
          <View style={styles.stepperTrackBg} />
          <View style={[styles.stepperTrackProgress, { width: `${progressPercent}%` }]} />
        </View>

        {steps.map((step) => {
          const isDone = step.number < currentStepIndex;
          const isCurrent = step.number === currentStepIndex;

          return (
            <View key={step.number} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isDone && styles.stepCircleDone,
                  isCurrent && styles.stepCircleCurrent,
                ]}
              >
                {isDone ? (
                  <StepperCheckIcon />
                ) : (
                  <Text
                    style={[
                      styles.stepNumberText,
                      isCurrent && styles.stepNumberTextCurrent,
                    ]}
                  >
                    {step.number}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isDone && styles.stepLabelDone,
                  isCurrent && styles.stepLabelCurrent,
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/* ─── Main Wizard Component ─── */
export function GoodsReceivingWizard({
  initialStep,
  shipment,
  onClose,
  onFinish,
  onBackToShipments,
  onViewBatch,
}: GoodsReceivingWizardProps) {
  const [currentStep, setCurrentStep] = useState<ReceivingWizardStep>(initialStep);
  const [history, setHistory] = useState<ReceivingWizardStep[]>([initialStep]);

  useEffect(() => {
    setCurrentStep(initialStep);
    setHistory([initialStep]);
  }, [initialStep]);

  const goToStep = (step: ReceivingWizardStep) => {
    setHistory(prev => [...prev, step]);
    setCurrentStep(step);
  };

  /* Navigation handler based on back button: pops exactly ONE screen */
  const handleBack = () => {
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
      onClose();
    }
  };

  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);
  const [hasEncounteredSubmitError, setHasEncounteredSubmitError] = useState(false);

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

  // Screen 1: Start Receiving States
  const [receivedDate, setReceivedDate] = useState(shipment?.receivedDate ?? '24 Sep 2026');
  const [receivedTime, setReceivedTime] = useState(shipment?.receivedTime ?? '10:30 AM');
  const [startReceivingPhotos, setStartReceivingPhotos] = useState<string[]>([]);

  // Screen 3: Quality Check States
  type QCStatus = 'pass' | 'attention' | 'fail';
  const [qcStatusMap, setQcStatusMap] = useState<Record<string, QCStatus>>({
    appearance: 'pass',
    size: 'pass',
    moisture: 'pass',
    damage: 'attention',
    freshness: 'pass',
  });
  const [qcPhotos, setQcPhotos] = useState<string[]>(['sample_photo_1']);
  const [qcNotes, setQcNotes] = useState('');

  // Screen 4 & 5: Quantities & Decisions
  const initExpected = shipment?.expectedQty ?? 150;
  const initReceived = shipment?.receivedQty ?? 145;
  const initRejected = shipment?.rejectedQty ?? 5;
  const initAccepted = shipment?.acceptedQty ?? Math.max(0, initReceived - initRejected);

  const [expectedQty, setExpectedQty] = useState(initExpected);
  const [receivedQty, setReceivedQty] = useState(initReceived);
  const [rejectedQty, setRejectedQty] = useState(initRejected);
  const [acceptedQty, setAcceptedQty] = useState(initAccepted);
  const [rejectionReason, setRejectionReason] = useState('Quality Below Grade');
  const [partialNotes, setPartialNotes] = useState('');

  // Screen 5: Damage / Mismatch States
  const issueTypes = [
    'Quantity Mismatch',
    'Quality Mismatch',
    'Grade Mismatch',
    'Damaged',
    'Missing',
    'Other (configured reason)',
  ];
  const [selectedIssueType, setSelectedIssueType] = useState('Quantity Mismatch');
  const [issueDescription, setIssueDescription] = useState('');

  // History Tab Filter
  const [historyFilter, setHistoryFilter] = useState<'All' | 'Accepted' | 'Partial' | 'Rejected'>('All');
  const [historySearch, setHistorySearch] = useState('');

  // Rejected Goods & Record Handling States
  const [selectedRejectedReason, setSelectedRejectedReason] = useState('Damaged');
  const [handlingStatus, setHandlingStatus] = useState<'Pending' | 'Recorded'>('Pending');
  const [handlingMethod, setHandlingMethod] = useState('Select method');
  const [handlingDate, setHandlingDate] = useState('24 Sep 2026');
  const [handlingTime, setHandlingTime] = useState('11:45 AM');
  const [handlingRemarks, setHandlingRemarks] = useState('');

  /* ──────────────────────────────────────────────────────────
     SCREEN 1: Start Receiving
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'start_receiving') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Start Receiving</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <StepperHeader currentStepIndex={1} />

          <View style={styles.whiteCard}>
            <Text style={styles.subtleLabel}>You're receiving</Text>
            <Text style={styles.boldReceiptCode}>GR-1024</Text>

            <View style={styles.produceInnerCard}>
              <View>
                <Text style={styles.produceTitle}>Tomato</Text>
                <Text style={styles.produceSub}>Grade 1</Text>
              </View>
              <Text style={styles.produceExpQty}>Exp. 150 KG</Text>
            </View>
          </View>


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
        <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quantity Verification</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <StepperHeader currentStepIndex={2} />


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
              <Text style={[styles.statTileNumber, { color: '#E11D48' }]}>-{expectedQty - receivedQty} KG</Text>
              <Text style={styles.statTileLabel}>DIFFERENCE</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Multiple Items on this Shipment</Text>
          <View style={styles.shipmentItemCard}>
            <View style={styles.shipmentItemTopRow}>
              <Text style={styles.shipmentItemTitle}>Tomato</Text>
              <View style={styles.redBadgePill}>
                <Text style={styles.redBadgeText}>-{expectedQty - receivedQty} KG</Text>
              </View>
            </View>
            <Text style={styles.shipmentItemDesc}>
              Expected <Text style={{ fontWeight: '700', color: '#1E1612' }}>{expectedQty} KG</Text> · Received <Text style={{ fontWeight: '700', color: '#1E1612' }}>{receivedQty} KG</Text>
            </Text>
          </View>

          <Text style={styles.sectionHeader}>Report an Issue</Text>
          <TouchableOpacity
            style={styles.reportIssueBtn}
            activeOpacity={0.8}
            onPress={() => goToStep('damage_mismatch')}
          >
            <AlertCircleOutlineIcon color={PRIMARY_COLOR} size={18} />
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
            <Text style={styles.primaryCtaText}>Continue to Quality Check  →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 3: Quality Check
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'quality_check') {
    const criteria = [
      { id: 'appearance', code: '01 — REQUIRED', title: 'Appearance', icon: <EyeIcon /> },
      { id: 'size', code: '02 — REQUIRED', title: 'Size Uniformity', icon: <RulerIcon /> },
      { id: 'moisture', code: '03 — REQUIRED', title: 'Moisture', icon: <DropIcon /> },
      { id: 'damage', code: '04 — REQUIRED', title: 'Damage / Pest', icon: <BugIcon /> },
      { id: 'freshness', code: '05 — REQUIRED', title: 'Freshness', icon: <LeafIcon /> },
    ];

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Quality Check</Text>
            <Text style={styles.headerSub}>Tomato · Grade 1 · Received {receivedQty} KG</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <StepperHeader currentStepIndex={3} />

          {criteria.map(crit => {
            const currentVal = qcStatusMap[crit.id] || 'pass';

            return (
              <View key={crit.id} style={styles.criteriaCard}>
                <View style={styles.criteriaHeader}>
                  <View style={styles.criteriaIconWrap}>{crit.icon}</View>
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
            onPress={() => goToStep('receiving_decision')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Text style={styles.primaryCtaText}>Continue to Decision</Text>
              <RightArrowIcon color="#FFFFFF" size={18} />
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
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receiving Decision</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <StepperHeader currentStepIndex={4} />

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
              <Text style={[styles.decisionTableValue, { color: '#1E8E5A', fontWeight: '800' }]}>{acceptedQty} KG</Text>
            </View>
            <View style={[styles.decisionTableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.decisionTableLabel}>Rejected</Text>
              <Text style={[styles.decisionTableValue, { color: '#E11D48', fontWeight: '800' }]}>{rejectedQty} KG</Text>
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
              <CheckmarkCircleOutlineIcon color="#059669" size={24} />
            </View>
            <View style={styles.outcomeTextBox}>
              <Text style={styles.outcomeAcceptTitle}>Accept</Text>
              <Text style={styles.outcomeAcceptSub}>Full {receivedQty} KG accepted, no rejection</Text>
            </View>
          </TouchableOpacity>

          {/* Outcome 2: Partial Accept */}
          <TouchableOpacity
            style={styles.outcomePartialCard}
            activeOpacity={0.8}
            onPress={() => {
              const defaultRej = rejectedQty > 0 ? rejectedQty : 5;
              const calcAccepted = Math.max(0, receivedQty - defaultRej);
              setAcceptedQty(calcAccepted);
              setRejectedQty(defaultRej);
              goToStep('partial_acceptance');
            }}
          >
            <View style={styles.outcomeIconBoxAmber}>
              <NotEqualIcon color="#B45309" size={22} />
            </View>
            <View style={styles.outcomeTextBox}>
              <Text style={styles.outcomePartialTitle}>Partial Accept</Text>
              <Text style={styles.outcomePartialSub}>
                {Math.max(0, receivedQty - (rejectedQty > 0 ? rejectedQty : 5))} KG accepted, {rejectedQty > 0 ? rejectedQty : 5} KG rejected
              </Text>
            </View>
          </TouchableOpacity>

          {/* Outcome 3: Reject */}
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
              <CrossCircleIcon color="#DC2626" size={24} />
            </View>
            <View style={styles.outcomeTextBox}>
              <Text style={styles.outcomeRejectTitle}>Reject</Text>
              <Text style={styles.outcomeRejectSub}>Reject the full received quantity ({receivedQty} KG)</Text>
            </View>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 4B: Partial Acceptance (Sub-screen of Decision)
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'partial_acceptance') {
    const rejectionReasons = [
      'Damage / Pest',
      'Quality Below Grade',
      'Quantity Shortage',
      'Wrong Product',
      'Other (configured reason)',
    ];

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partial Acceptance</Text>
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
              <Text style={[styles.statTileNumber, { color: '#E11D48' }]}>{rejectedQty} KG</Text>
              <Text style={styles.statTileLabel}>REJECTED</Text>
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
            placeholderTextColor="#9CA3AF"
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
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receipt Summary</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <StepperHeader currentStepIndex={5} />

          {/* GR-1024 Metadata Card */}
          <View style={styles.whiteCard}>
            <Text style={styles.summaryCardReceiptCode}>GR-1024</Text>
            <View style={styles.summaryMetaGrid}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Source</Text>
                <Text style={styles.summaryMetaVal}>Main Warehouse</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Destination</Text>
                <Text style={styles.summaryMetaVal}>Coonoor Warehouse</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: 12 }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Product</Text>
                <Text style={styles.summaryMetaVal}>Tomato</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Grade</Text>
                <Text style={styles.summaryMetaVal}>Grade 1</Text>
              </View>
            </View>
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
              <Text style={[styles.decisionTableValue, { color: '#1E8E5A', fontWeight: '800' }]}>{acceptedQty} KG</Text>
            </View>
            <View style={[styles.decisionTableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.decisionTableLabel}>Rejected</Text>
              <Text style={[styles.decisionTableValue, { color: '#E11D48', fontWeight: '800' }]}>{rejectedQty} KG</Text>
            </View>
          </View>

          {/* QC Summary Checklist */}
          <Text style={styles.sectionHeader}>QC Summary</Text>
          <View style={styles.qcSummaryCard}>
            <View style={styles.qcSummaryRow}>
              <Text style={styles.qcSummaryLabel}>Appearance</Text>
              <WarningTriangleIcon color="#D97706" size={16} />
            </View>
            <View style={styles.qcSummaryRow}>
              <Text style={styles.qcSummaryLabel}>Size Uniformity</Text>
              <CheckmarkCircleOutlineIcon color="#059669" size={18} />
            </View>
            <View style={styles.qcSummaryRow}>
              <Text style={styles.qcSummaryLabel}>Moisture</Text>
              <CrossCircleIcon color="#DC2626" size={18} />
            </View>
            <View style={styles.qcSummaryRow}>
              <Text style={styles.qcSummaryLabel}>Damage / Pest</Text>
              <WarningTriangleIcon color="#D97706" size={16} />
            </View>
            <View style={[styles.qcSummaryRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.qcSummaryLabel}>Freshness</Text>
              <CheckmarkCircleOutlineIcon color="#059669" size={18} />
            </View>
          </View>

          {/* Issues Box */}
          <Text style={styles.sectionHeader}>Issues</Text>
          <View style={styles.issuesCard}>
            <View style={styles.issuesIconCircle}>
              <AlertCircleOutlineIcon color="#DC2626" size={18} />
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
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <CheckmarkCircleOutlineIcon color="#FFFFFF" size={20} />
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
    const historyList = [
      {
        code: 'GR-1024',
        status: 'Partially Accepted',
        statusColor: '#B45309',
        statusBg: '#FEF3C7',
        produce: 'Tomato · Grade 1',
        received: '145 KG',
        accepted: '140 KG',
        rejected: '5 KG',
        date: '24 Sep 2026',
      },
      {
        code: 'GR-1023',
        status: 'Accepted',
        statusColor: '#15803D',
        statusBg: '#DCFCE7',
        produce: 'Carrot · Grade 1',
        received: '80 KG',
        accepted: '80 KG',
        rejected: undefined,
        date: '24 Sep 2026',
      },
      {
        code: 'GR-1018',
        status: 'Rejected',
        statusColor: '#DC2626',
        statusBg: '#FEE2E2',
        produce: 'Spinach · Grade 2',
        received: '30 KG',
        accepted: undefined,
        rejected: '30 KG',
        date: '22 Sep 2026',
      },
    ];

    const filtered = historyList.filter(item => {
      if (historyFilter === 'Accepted' && item.status !== 'Accepted') return false;
      if (historyFilter === 'Partial' && item.status !== 'Partially Accepted') return false;
      if (historyFilter === 'Rejected' && item.status !== 'Rejected') return false;
      if (historySearch && !item.code.toLowerCase().includes(historySearch.toLowerCase()) && !item.produce.toLowerCase().includes(historySearch.toLowerCase())) {
        return false;
      }
      return true;
    });

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
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
              placeholderTextColor="#9CA3AF"
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
          {filtered.map(item => (
            <TouchableOpacity
              key={item.code}
              style={styles.historyCard}
              activeOpacity={0.8}
              onPress={() => goToStep('receipt_detail')}
            >
              <View style={styles.historyCardTopRow}>
                <Text style={styles.historyCardCode}>{item.code}</Text>
                <View style={[styles.historyStatusPill, { backgroundColor: item.statusBg }]}>
                  <Text style={[styles.historyStatusText, { color: item.statusColor }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.historyCardProduce}>{item.produce}</Text>
              <View style={styles.historyCardStatsRow}>
                <Text style={styles.historyStatLabel}>Received <Text style={styles.historyStatVal}>{item.received}</Text></Text>
                {item.accepted && <Text style={styles.historyStatLabel}>Accepted <Text style={styles.historyStatVal}>{item.accepted}</Text></Text>}
                {item.rejected && <Text style={styles.historyStatLabel}>Rejected <Text style={[styles.historyStatVal, { color: '#E11D48' }]}>{item.rejected}</Text></Text>}
              </View>
              <Text style={styles.historyCardDate}>{item.date}</Text>
            </TouchableOpacity>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 7: GR-1024 Audit / Receipt Detail Screen
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'receipt_detail') {
    const timelineEvents = [
      { title: 'Dispatched', time: '23 Sep · 09:10 AM' },
      { title: 'Arrived', time: '24 Sep · 10:30 AM' },
      { title: 'Receiving Started', time: '24 Sep · 10:35 AM' },
      { title: 'Quantity Checked', time: '24 Sep · 10:42 AM' },
      { title: 'QC Completed', time: '24 Sep · 10:50 AM' },
      { title: 'Partial Acceptance Confirmed', time: '24 Sep · 10:54 AM' },
    ];

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.headerTitle}>GR-1024</Text>
            <View style={styles.headerStatusBadge}>
              <Text style={styles.headerStatusBadgeText}>Partially Accepted</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Timeline Section */}
          <Text style={styles.sectionHeader}>Timeline</Text>
          <View style={styles.timelineCard}>
            {timelineEvents.map((evt, idx) => {
              const isLast = idx === timelineEvents.length - 1;
              return (
                <View key={idx} style={styles.timelineRow}>
                  <View style={styles.timelineLineCol}>
                    <View style={styles.timelineDotOuter}>
                      <View style={styles.timelineDotInner} />
                    </View>
                    {!isLast && <View style={styles.timelineConnectorLine} />}
                  </View>
                  <View style={styles.timelineContentCol}>
                    <Text style={styles.timelineEventTitle}>{evt.title}</Text>
                    <Text style={styles.timelineEventTime}>{evt.time}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Audit Information */}
          <Text style={styles.sectionHeader}>Audit Information</Text>
          <View style={styles.whiteCard}>
            <View style={styles.summaryMetaGrid}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Received By</Text>
                <Text style={styles.summaryMetaVal}>SWA-COO-01</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Date</Text>
                <Text style={styles.summaryMetaVal}>24 Sep 2026</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: 12 }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Warehouse</Text>
                <Text style={styles.summaryMetaVal}>Coonoor</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Receipt ID</Text>
                <Text style={styles.summaryMetaVal}>GR-1024</Text>
              </View>
            </View>
          </View>

          {/* QC Results */}
          <Text style={styles.sectionHeader}>QC Results</Text>
          <View style={styles.qcSummaryCard}>
            <View style={styles.qcSummaryRow}>
              <Text style={styles.qcSummaryLabel}>Appearance</Text>
              <WarningTriangleIcon color="#D97706" size={16} />
            </View>
            <View style={styles.qcSummaryRow}>
              <Text style={styles.qcSummaryLabel}>Size Uniformity</Text>
              <CheckmarkCircleOutlineIcon color="#059669" size={18} />
            </View>
            <View style={styles.qcSummaryRow}>
              <Text style={styles.qcSummaryLabel}>Moisture</Text>
              <CrossCircleIcon color="#DC2626" size={18} />
            </View>
            <View style={styles.qcSummaryRow}>
              <Text style={styles.qcSummaryLabel}>Damage / Pest</Text>
              <WarningTriangleIcon color="#D97706" size={16} />
            </View>
            <View style={[styles.qcSummaryRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.qcSummaryLabel}>Freshness</Text>
              <CheckmarkCircleOutlineIcon color="#059669" size={18} />
            </View>
          </View>

          {/* Quantity Summary */}
          <Text style={styles.sectionHeader}>Quantity Summary</Text>
          <View style={styles.decisionTableCard}>
            <View style={styles.decisionTableRow}>
              <Text style={styles.decisionTableLabel}>Expected</Text>
              <Text style={styles.decisionTableValue}>150 KG</Text>
            </View>
            <View style={styles.decisionTableRow}>
              <Text style={styles.decisionTableLabel}>Received</Text>
              <Text style={styles.decisionTableValue}>145 KG</Text>
            </View>
            <View style={styles.decisionTableRow}>
              <Text style={styles.decisionTableLabel}>Accepted</Text>
              <Text style={[styles.decisionTableValue, { color: '#1E8E5A', fontWeight: '800' }]}>140 KG</Text>
            </View>
            <View style={[styles.decisionTableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.decisionTableLabel}>Rejected</Text>
              <Text style={[styles.decisionTableValue, { color: '#E11D48', fontWeight: '800' }]}>5 KG · Damage/Pest</Text>
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

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            onPress={() => {
              // No redirect; batch and storage will be connected in future
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BoxStorageIcon />
              <Text style={styles.primaryCtaText}>Continue to Batch & Storage</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN 8: Rejected Goods
     ────────────────────────────────────────────────────────── */
  if (currentStep === 'rejected_goods') {
    const reasons = [
      'Damaged',
      'Quantity Mismatch',
      'Quality Mismatch',
      'Missing Produce',
      'Other (configured reason)',
    ];

    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Rejected Goods</Text>
            <Text style={styles.headerSub}>GR-1024</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Rejected Product */}
          <Text style={styles.sectionHeader}>Rejected Product</Text>
          <View style={styles.whiteCard}>
            <View style={styles.summaryMetaGrid}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Product</Text>
                <Text style={styles.summaryMetaVal}>Tomato</Text>
              </View>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Grade</Text>
                <Text style={styles.summaryMetaVal}>Grade 1</Text>
              </View>
            </View>
            <View style={[styles.summaryMetaGrid, { marginTop: 12 }]}>
              <View style={styles.summaryMetaCol}>
                <Text style={styles.summaryMetaLabel}>Batch / Receipt</Text>
                <Text style={styles.summaryMetaVal}>GR-1024</Text>
              </View>
            </View>
          </View>

          {/* Quantity */}
          <Text style={styles.sectionHeader}>Quantity</Text>
          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>150 KG</Text>
              <Text style={styles.statTileLabel}>EXPECTED</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>145 KG</Text>
              <Text style={styles.statTileLabel}>RECEIVED</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statTileNumber}>140 KG</Text>
              <Text style={styles.statTileLabel}>ACCEPTED</Text>
            </View>
          </View>

          {/* Rejected Quantity Banner */}
          <View style={styles.rejectedQtyBanner}>
            <Text style={styles.rejectedQtyNum}>5 KG</Text>
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
                  <Text style={[styles.issueTypeText, isSelected && { fontWeight: '700', color: '#1E1612' }]}>
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
              5 KG showed pest damage on inspection — isolated and rejected.
            </Text>
          </View>

          {/* Disposal / Handling Record */}
          <Text style={styles.sectionHeader}>Disposal / Handling Record</Text>
          <View style={styles.handlingStatusPill}>
            <ClockSmallIcon color="#B45309" size={16} />
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
        <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Handling</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Rejected Quantity Banner */}
          <View style={styles.rejectedQtyBanner}>
            <Text style={styles.rejectedQtyNum}>5 KG</Text>
            <Text style={styles.rejectedQtyLabel}>REJECTED QUANTITY</Text>
          </View>

          {/* Handling Information */}
          <Text style={styles.sectionHeader}>Handling Information</Text>
          <TouchableOpacity
            style={styles.dropdownSelectBox}
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert('Select Method', 'Choose handling method', [
                { text: 'Return to Vendor', onPress: () => setHandlingMethod('Return to Vendor') },
                { text: 'Disposal', onPress: () => setHandlingMethod('Disposal') },
                { text: 'Quarantine', onPress: () => setHandlingMethod('Quarantine') },
              ]);
            }}
          >
            <View>
              <Text style={styles.dropdownLabel}>HANDLING / DISPOSAL METHOD</Text>
              <Text style={[styles.dropdownValue, handlingMethod === 'Select method' && { color: '#6B7280' }]}>
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
            placeholderTextColor="#9CA3AF"
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
        <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Receiving in Progress</Text>
            <Text style={styles.headerSub}>{shipment?.code ?? 'GR-1024'} · {shipment?.produce ?? 'Tomato'}</Text>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Draft Banner */}
          <View style={styles.draftStatusBanner}>
            <PencilDraftIcon color="#B45309" size={16} />
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
            <TouchableOpacity style={styles.checklistRow} onPress={() => goToStep('continue_receiving')} activeOpacity={0.7}>
              <View style={styles.checkCircleActive} />
              <Text style={[styles.checklistRowText, { fontWeight: '700', color: '#1E1612' }]}>Quality Check</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.checklistRow, { borderBottomWidth: 0 }]} onPress={() => goToStep('receiving_decision')} activeOpacity={0.7}>
              <View style={styles.checkCirclePending} />
              <Text style={[styles.checklistRowText, { color: '#9CA3AF' }]}>Final Decision</Text>
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

          {/* QC Progress */}
          <Text style={styles.sectionHeader}>QC Progress</Text>
          <TouchableOpacity style={styles.whiteCard} onPress={() => goToStep('continue_receiving')} activeOpacity={0.8}>
            <Text style={styles.qcProgressNumbers}>4 / 5 Completed</Text>
            <Text style={styles.qcProgressSub}>QUALITY CHECKS</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '80%' }]} />
            </View>
          </TouchableOpacity>

          {/* Sections */}
          <Text style={styles.sectionHeader}>Sections</Text>
          <View style={styles.whiteCard}>
            <TouchableOpacity style={styles.checklistRow} onPress={() => goToStep('quantity_verification')} activeOpacity={0.7}>
              <View style={styles.checkCircleDone}>
                <CheckmarkIcon size={10} />
              </View>
              <Text style={styles.checklistRowText}>Quantity Verification</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checklistRow} onPress={() => goToStep('continue_receiving')} activeOpacity={0.7}>
              <View style={styles.checkCircleActive} />
              <Text style={[styles.checklistRowText, { fontWeight: '700', color: '#1E1612' }]}>Quality Check</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checklistRow} onPress={() => goToStep('damage_mismatch')} activeOpacity={0.7}>
              <View style={styles.checkCircleDone}>
                <CheckmarkIcon size={10} />
              </View>
              <Text style={styles.checklistRowText}>Damage Check</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checklistRow} onPress={() => goToStep('quality_check')} activeOpacity={0.7}>
              <View style={styles.checkCircleDone}>
                <CheckmarkIcon size={10} />
              </View>
              <Text style={styles.checklistRowText}>Photos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.checklistRow, { borderBottomWidth: 0 }]} onPress={() => goToStep('receiving_decision')} activeOpacity={0.7}>
              <View style={styles.checkCirclePending} />
              <Text style={[styles.checklistRowText, { color: '#9CA3AF' }]}>Final Decision</Text>
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
        <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
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
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#1E1612', textAlign: 'left', marginBottom: 20 }}>
              {shipment?.produce ?? 'Tomato'} — {shipment?.grade ?? 'Grade 1'}
            </Text>
            <View style={{ alignItems: 'center', paddingBottom: 6 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#1E1612', textAlign: 'center' }}>
                Check 5 of 5
              </Text>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#6B7280', letterSpacing: 0.8, marginTop: 4, textAlign: 'center', textTransform: 'uppercase' }}>
                FRESHNESS
              </Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            activeOpacity={0.85}
            onPress={() => goToStep('receiving_decision')}
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
        <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
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
              <View style={[styles.confirmationCheckCircle, { backgroundColor: '#FEE2E2', width: 56, height: 56, borderRadius: 28, marginTop: 10, marginBottom: 12 }]}>
                <CrossCircleIcon color="#DC2626" size={28} />
              </View>
              <Text style={[styles.confirmationMainTitle, { marginBottom: 4 }]}>Goods Receipt Completed</Text>
              <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 20 }}>
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
                  <Text style={[styles.decisionTableValue, { color: '#DC2626', fontWeight: '800' }]}>
                    {rejectedQty || expectedQty} KG
                  </Text>
                </View>
              </View>

              {/* QC Result Card */}
              <View style={styles.whiteCard}>
                <Text style={{ fontSize: 12.5, color: '#6B7280', marginBottom: 4, fontWeight: '500' }}>QC Result</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E1612' }}>Rejected</Text>
              </View>

              {/* Rejected Goods Card */}
              <TouchableOpacity
                style={[styles.whiteCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 }]}
                onPress={() => goToStep('rejected_goods')}
                activeOpacity={0.75}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TrashOutlineRedIcon color="#DC2626" size={22} />
                  <View>
                    <Text style={{ fontSize: 12.5, color: '#6B7280', fontWeight: '500' }}>Rejected Goods</Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E1612', marginTop: 2 }}>Created</Text>
                  </View>
                </View>
                <ChevronRightSmall />
              </TouchableOpacity>

              {/* Single Action: View Receipt */}
              <TouchableOpacity
                style={[styles.actionPrimaryBtn, { justifyContent: 'flex-start', paddingHorizontal: 20, gap: 14, marginTop: 8 }]}
                activeOpacity={0.85}
                onPress={() => goToStep('receipt_detail')}
              >
                <ReceiptPaperIcon color="#FFFFFF" size={20} />
                <Text style={styles.actionPrimaryBtnText}>View Receipt</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ─────────────── VARIANT 2: FULL ACCEPTANCE (Image 3) ─────────────── */}
          {isFullAccept && (
            <>
              <View style={[styles.confirmationCheckCircle, { backgroundColor: '#D1FAE5', width: 56, height: 56, borderRadius: 28, marginTop: 10, marginBottom: 12 }]}>
                <CheckmarkIcon color="#059669" size={26} />
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
                  <Text style={[styles.decisionTableValue, { color: '#1E8E5A', fontWeight: '800' }]}>
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
                  <View style={styles.summaryMetaCol}>
                    <Text style={styles.summaryMetaLabel}>QC</Text>
                    <Text style={[styles.summaryMetaVal, { marginTop: 3 }]}>Passed</Text>
                  </View>
                  <View style={styles.summaryMetaCol}>
                    <Text style={styles.summaryMetaLabel}>Batch</Text>
                    <Text style={[styles.summaryMetaVal, { marginTop: 3 }]}>BAT-2026-00125</Text>
                  </View>
                </View>
              </View>

              {/* Inventory Result Card */}
              <View style={[styles.whiteCard, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
                <CrateInventoryIcon color="#92400E" size={24} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>Full quantity accepted</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E1612', marginTop: 2 }}>
                    Batch Created · BAT-2026-00125
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={{ gap: 12, marginTop: 8 }}>
                <TouchableOpacity
                  style={[styles.actionPrimaryBtn, { justifyContent: 'flex-start', paddingHorizontal: 20, gap: 14, marginBottom: 0 }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (onViewBatch) {
                      onViewBatch('BAT-2026-00125');
                    } else {
                      Alert.alert('View Batch', `BAT-2026-00125\nFull ${acceptedQty || expectedQty} KG ${shipment?.produce ?? 'Tomato'} allocated to Bay A-01.`);
                    }
                  }}
                >
                  <QrCodeIcon color="#FFFFFF" size={20} />
                  <Text style={styles.actionPrimaryBtnText}>View Batch</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionSecondaryBtn, { justifyContent: 'flex-start', paddingHorizontal: 20, gap: 14, marginBottom: 0 }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (onBackToShipments) onBackToShipments();
                    else onClose();
                  }}
                >
                  <TruckDeliveryIcon color="#92400E" size={20} />
                  <Text style={[styles.actionSecondaryBtnText, { color: '#92400E' }]}>Back to Incoming Shipments</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ─────────────── VARIANT 3: PARTIALLY ACCEPTED (Image 4) ─────────────── */}
          {isPartialAccept && (
            <>
              <View style={[styles.confirmationCheckCircle, { backgroundColor: '#D1FAE5', width: 56, height: 56, borderRadius: 28, marginTop: 10, marginBottom: 12 }]}>
                <CheckmarkIcon color="#059669" size={26} />
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
                  <Text style={[styles.decisionTableValue, { color: '#1E8E5A', fontWeight: '800' }]}>
                    {acceptedQty} KG
                  </Text>
                </View>
                <View style={[styles.decisionTableRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.decisionTableLabel}>Rejected</Text>
                  <Text style={[styles.decisionTableValue, { color: '#DC2626', fontWeight: '800' }]}>
                    {rejectedQty} KG
                  </Text>
                </View>
              </View>

              {/* Reason Card */}
              <View style={styles.whiteCard}>
                <Text style={{ fontSize: 12.5, color: '#6B7280', marginBottom: 4, fontWeight: '500' }}>Reason</Text>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E1612' }}>
                  {rejectionReason || 'Damage / Pest (recorded QC reason)'}
                </Text>
              </View>

              {/* Inventory Result Card */}
              <View style={[styles.whiteCard, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
                <CrateInventoryIcon color="#92400E" size={24} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>{acceptedQty} KG accepted</Text>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E1612', marginTop: 2 }}>
                    Batch Created · BAT-2026-00126
                  </Text>
                </View>
              </View>

              {/* Rejected Goods Card */}
              <TouchableOpacity
                style={[styles.whiteCard, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 }]}
                onPress={() => goToStep('rejected_goods')}
                activeOpacity={0.75}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TrashOutlineRedIcon color="#DC2626" size={22} />
                  <View>
                    <Text style={{ fontSize: 12.5, color: '#6B7280', fontWeight: '500' }}>Rejected Goods</Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E1612', marginTop: 2 }}>Pending Handling</Text>
                  </View>
                </View>
                <ChevronRightSmall />
              </TouchableOpacity>

              {/* Actions */}
              <View style={{ gap: 12, marginTop: 8 }}>
                <TouchableOpacity
                  style={[styles.actionPrimaryBtn, { justifyContent: 'flex-start', paddingHorizontal: 20, gap: 14, marginBottom: 0 }]}
                  activeOpacity={0.85}
                  onPress={() => goToStep('receipt_detail')}
                >
                  <ReceiptPaperIcon color="#FFFFFF" size={20} />
                  <Text style={styles.actionPrimaryBtnText}>View Receipt</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionSecondaryBtn, { justifyContent: 'flex-start', paddingHorizontal: 20, gap: 14, marginBottom: 0 }]}
                  activeOpacity={0.8}
                  onPress={() => {
                    // Future inventory navigation
                  }}
                >
                  <CrateInventoryIcon color="#92400E" size={20} />
                  <Text style={[styles.actionSecondaryBtnText, { color: '#92400E' }]}>Go to Inventory</Text>
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
        <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Submission Error</Text>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, marginTop: -40 }}>
          <View style={[styles.confirmationCheckCircle, { backgroundColor: '#FEE2E2', width: 68, height: 68, borderRadius: 34, marginBottom: 20 }]}>
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
                <ActivityIndicator color="#FFFFFF" size="small" />
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
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={PRIMARY_COLOR} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Damage / Mismatch</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionHeader}>Issue Type</Text>
          <View style={styles.issueTypeListCard}>
            {issueTypes.map((type, idx) => {
              const isSelected = selectedIssueType === type;
              const isLast = idx === issueTypes.length - 1;

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
              <Text style={[styles.statTileNumber, { color: '#E11D48' }]}>-{expectedQty - receivedQty} KG</Text>
              <Text style={styles.statTileLabel}>SHORTAGE</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Describe the Issue</Text>
          <TextInput
            style={styles.describeIssueInput}
            placeholder="Describe what happened..."
            placeholderTextColor="#9CA3AF"
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
            onPress={() => goToStep('quality_check')}
          >
            <Text style={styles.primaryCtaText}>Continue  →</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: '#FAF8F5',
  },
  header: {
    backgroundColor: PRIMARY_COLOR,
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
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.92)',
    marginTop: 2,
  },
  headerStatusBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerStatusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
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
    backgroundColor: '#E5E7EB',
    borderRadius: 1.5,
  },
  stepperTrackProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
    backgroundColor: SUCCESS_COLOR,
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
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleCurrent: {
    backgroundColor: PRIMARY_COLOR,
  },
  stepCircleDone: {
    backgroundColor: SUCCESS_COLOR,
  },
  stepNumberText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  stepNumberTextCurrent: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  stepLabelDone: {
    color: '#4B5563',
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: PRIMARY_COLOR,
    fontWeight: '700',
  },

  /* White Card */
  whiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  subtleLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  boldReceiptCode: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1612',
    marginBottom: 12,
  },
  produceInnerCard: {
    backgroundColor: '#FAF5EE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  produceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1612',
  },
  produceSub: {
    fontSize: 12.5,
    color: '#9CA3AF',
    marginTop: 2,
  },
  produceExpQty: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },

  /* Sections */
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1612',
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
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  requiredTag: {
    fontSize: 13,
    color: '#6B7280',
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
    fontSize: 13,
    fontWeight: '700',
    color: '#1E1612',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1612',
  },

  /* Dashed Add Box */
  dashedAddBox: {
    width: 88,
    height: 88,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dashedAddBoxText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 6,
  },

  /* Quantity Verification */
  shortageBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  shortageBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  statTileNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1612',
    marginBottom: 4,
  },
  statTileLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  shipmentItemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1612',
  },
  redBadgePill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  redBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#DC2626',
  },
  shipmentItemDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  reportIssueBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: PRIMARY_COLOR,
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  reportIssueBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E1612',
  },

  /* Quality Check */
  criteriaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAE4DB',
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
    backgroundColor: '#FDF4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  criteriaTextWrap: {
    flex: 1,
  },
  criteriaCode: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.3,
  },
  criteriaTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1612',
    marginTop: 1,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBtnText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  choiceBtnPassActive: {
    backgroundColor: '#E6F4EA',
    borderColor: '#1E8E5A',
    borderWidth: 1.5,
  },
  choiceBtnPassTextActive: {
    color: '#15803D',
    fontWeight: '700',
  },
  choiceBtnAttentionActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D97706',
    borderWidth: 1.5,
  },
  choiceBtnAttentionTextActive: {
    color: '#B45309',
    fontWeight: '700',
  },
  choiceBtnFailActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
    borderWidth: 1.5,
  },
  choiceBtnFailTextActive: {
    color: '#DC2626',
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
    backgroundColor: '#FAF5EE',
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
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qcPhotoDeleteX: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: -2,
  },
  qcPhotoAddBox: {
    width: 76,
    height: 76,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qcPhotoAddText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 4,
  },
  qcNotesArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    height: 80,
    fontSize: 13,
    color: '#1E1612',
    textAlignVertical: 'top',
  },

  /* Decision Screen Styles */
  decisionTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  decisionTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  decisionTableLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  decisionTableValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1612',
  },
  outcomeAcceptCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#1E8E5A',
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
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1E8E5A',
  },
  outcomeAcceptSub: {
    fontSize: 12.5,
    color: '#047857',
    marginTop: 2,
  },
  outcomePartialCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#D97706',
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
    fontSize: 15.5,
    fontWeight: '800',
    color: '#B45309',
  },
  outcomePartialSub: {
    fontSize: 12.5,
    color: '#92400E',
    marginTop: 2,
  },
  outcomeRejectCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#DC2626',
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
    fontSize: 15.5,
    fontWeight: '800',
    color: '#DC2626',
  },
  outcomeRejectSub: {
    fontSize: 12.5,
    color: '#B91C1C',
    marginTop: 2,
  },

  /* Damage / Mismatch Screen */
  issueTypeListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  issueTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  radioOuterCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterCircleSelected: {
    borderColor: PRIMARY_COLOR,
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY_COLOR,
  },
  issueTypeText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1E1612',
  },
  issueTypeTextSelected: {
    fontWeight: '800',
    color: '#1E1612',
  },
  describeIssueInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    height: 80,
    fontSize: 13.5,
    color: '#1E1612',
    textAlignVertical: 'top',
    marginBottom: 16,
  },

  /* Receipt Summary & Detail */
  summaryCardReceiptCode: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1612',
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
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  summaryMetaVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1612',
  },
  qcSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  qcSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  qcSummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1612',
  },
  issuesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FEE2E2',
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
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  issuesTextBox: {
    flex: 1,
  },
  issuesTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E1612',
  },
  issuesSub: {
    fontSize: 12.5,
    color: '#6B7280',
    marginTop: 2,
  },

  /* History Screen */
  searchBarWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E1612',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1612',
  },
  historyStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  historyStatusText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  historyCardProduce: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1612',
    marginBottom: 8,
  },
  historyCardStatsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 8,
  },
  historyStatLabel: {
    fontSize: 12.5,
    color: '#6B7280',
  },
  historyStatVal: {
    fontWeight: '800',
    color: '#1E1612',
  },
  historyCardDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  /* Timeline */
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    borderColor: '#1E8E5A',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E8E5A',
  },
  timelineConnectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#D1D5DB',
    minHeight: 28,
  },
  timelineContentCol: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 16,
  },
  timelineEventTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1612',
  },
  timelineEventTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  /* Bottom Docked CTA Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  primaryCtaBtn: {
    backgroundColor: PRIMARY_COLOR,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  primaryCtaText: {
    fontFamily: 'Poppins',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  /* Rejected Goods Screen Styles */
  rejectedQtyBanner: {
    backgroundColor: '#FFE4E6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  rejectedQtyNum: {
    fontSize: 24,
    fontWeight: '900',
    color: '#E11D48',
  },
  rejectedQtyLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E11D48',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  rejectedNotesText: {
    fontSize: 13.5,
    color: '#4B5563',
    lineHeight: 20,
    fontWeight: '500',
  },
  handlingStatusPill: {
    backgroundColor: '#FEF3C7',
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
    fontSize: 12.5,
    fontWeight: '800',
    color: '#B45309',
  },

  /* Record Handling Screen Styles */
  dropdownSelectBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropdownLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dropdownValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1612',
  },
  dashedAddBoxSmall: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    backgroundColor: '#FAF8F5',
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  /* Receiving in Progress Screen Styles */
  draftStatusBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  draftStatusBannerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checklistRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E1612',
  },
  checkCircleDone: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1E8E5A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PRIMARY_COLOR,
  },
  checkCirclePending: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  qcProgressNumbers: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1612',
  },
  qcProgressSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginTop: 2,
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY_COLOR,
  },

  /* Continue Receiving & Confirmation Screen Styles */
  largeCheckBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  allChecksCompletedTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1E1612',
    textAlign: 'center',
    marginBottom: 8,
  },
  allChecksCompletedSub: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmationCheckCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  confirmationMainTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1E1612',
    textAlign: 'center',
    marginBottom: 20,
  },
  rejectedGoodsAlertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionPrimaryBtn: {
    backgroundColor: PRIMARY_COLOR,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  actionPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  actionSecondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  actionSecondaryBtnText: {
    color: '#1E1612',
    fontSize: 15,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statePillActive: {
    backgroundColor: '#FFF5ED',
    borderColor: PRIMARY_COLOR,
  },
  statePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  statePillTextActive: {
    color: PRIMARY_COLOR,
  },
});
