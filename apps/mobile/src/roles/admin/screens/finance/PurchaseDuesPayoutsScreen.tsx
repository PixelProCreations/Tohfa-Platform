import React, { useState, useMemo } from 'react';
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  OverviewCardsGrid,
  OverviewDashboardCard,
} from '../../components/OverviewDashboardCard';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="21" x2="4" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="4" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="21" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="21" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="12" x2="20" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="1" y1="14" x2="7" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="16" x2="23" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon({ size = 16, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CopyIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="9" width="13" height="13" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function PaperPlaneIcon({ size = 28, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 2L11 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShieldCheckIcon({ size = 32, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PackageBoxIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BankBuildingIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RetryIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M23 4v6h-6M1 20v-6h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AlertOctagonIcon({ size = 20, color = adminColors.danger.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="16" x2="12.01" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TohfaLeafLogo({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Circle cx="20" cy="20" r="18" fill={adminColors.brand} />
      <Path
        d="M20 8C13 15 13 25 20 30C27 25 27 15 20 8Z"
        fill="#16A34A"
        stroke={adminColors.onBrand}
        strokeWidth="1.5"
      />
      <Path d="M20 12V26" stroke={adminColors.onBrand} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

function ClockIcon({ size = 16, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownloadIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Data Types ──────────────────────────────────────────────────────────────

export type PayoutStatusType = 'awaiting_approval' | 'ready' | 'paid' | 'settled' | 'failed' | 'not_yet';

export interface PayoutBadgeItem {
  label: string;
  variant: 'green' | 'amber' | 'blue';
  hasCheck?: boolean;
  hasClock?: boolean;
}

export interface PayoutRecord {
  id: string;
  payoutId: string;
  farmerName: string;
  farmerId: string;
  purchaseOrder: string;
  goodsReceiptId: string;
  produceName: string;
  quantityKg: number;
  grade: string;
  unitPrice: number;
  amount: number;
  amountFormatted: string;
  statusType: PayoutStatusType;
  statusLabel: string;
  accountNoMasked?: string;
  isAlert?: boolean;
  badges?: PayoutBadgeItem[];
}

const MOCK_PAYOUTS: PayoutRecord[] = [
  {
    id: 'pay-1',
    payoutId: 'PY-0038',
    farmerName: 'Selvi Farm House',
    farmerId: 'FMR-00124',
    purchaseOrder: 'PO-2026-0038',
    goodsReceiptId: 'GR-0038',
    produceName: 'Carrot',
    quantityKg: 260,
    grade: 'Grade 1',
    unitPrice: 25,
    amount: 6500,
    amountFormatted: '₹6,500',
    statusType: 'ready',
    statusLabel: 'Ready for Payment',
    accountNoMasked: '•••• 4521',
    badges: [
      { label: 'Bank Verified', variant: 'green', hasCheck: true },
      { label: 'Ready for Payment', variant: 'green' },
    ],
  },
  {
    id: 'pay-2',
    payoutId: 'PY-0024',
    farmerName: 'Rajan Farming',
    farmerId: 'FMR-00124',
    purchaseOrder: 'PO-2026-0038',
    goodsReceiptId: 'GR-0024',
    produceName: 'Cabbage',
    quantityKg: 360,
    grade: 'Grade 1',
    unitPrice: 30,
    amount: 10800,
    amountFormatted: '₹10,800',
    statusType: 'awaiting_approval',
    statusLabel: 'SA Approval Required',
    accountNoMasked: '•••• 8820',
    badges: [
      { label: 'Bank Verified', variant: 'green', hasCheck: true },
      { label: 'SA Approval Required', variant: 'amber' },
    ],
  },
  {
    id: 'pay-3',
    payoutId: 'PY-0002',
    farmerName: 'Kumar Farm',
    farmerId: 'FMR-00124',
    purchaseOrder: 'PO-2026-0038',
    goodsReceiptId: 'GR-0002',
    produceName: 'Beans',
    quantityKg: 300,
    grade: 'Grade 1',
    unitPrice: 42,
    amount: 18500,
    amountFormatted: '₹18,500',
    statusType: 'settled',
    statusLabel: 'Completed',
    accountNoMasked: '•••• 0123',
    badges: [
      { label: 'Completed', variant: 'green', hasCheck: true },
      { label: 'Individual Payment', variant: 'green' },
    ],
  },
  {
    id: 'pay-4',
    payoutId: 'PY-0005',
    farmerName: 'Kumar village farming',
    farmerId: 'FMR-00124',
    purchaseOrder: 'PO-2026-0038',
    goodsReceiptId: 'GR-0009',
    produceName: 'Beans',
    quantityKg: 200,
    grade: 'Grade 2',
    unitPrice: 49,
    amount: 9800,
    amountFormatted: '₹9,800',
    statusType: 'settled',
    statusLabel: 'Completed',
    accountNoMasked: '•••• 9876',
    badges: [
      { label: 'Completed', variant: 'green', hasCheck: true },
      { label: 'Individual Payment', variant: 'green' },
    ],
  },
  {
    id: 'pay-5',
    payoutId: 'PY-0001',
    farmerName: 'Rajesh Farm',
    farmerId: 'FMR-00124',
    purchaseOrder: 'PO-2026-0038',
    goodsReceiptId: 'GR-0001',
    produceName: 'Potato',
    quantityKg: 155,
    grade: 'Grade 1',
    unitPrice: 40,
    amount: 6200,
    amountFormatted: '₹6,200',
    statusType: 'settled',
    statusLabel: 'Completed',
    accountNoMasked: '•••• 7123',
    badges: [
      { label: 'Completed', variant: 'green', hasCheck: true },
      { label: 'Individual Payment', variant: 'green' },
    ],
  },
  {
    id: 'pay-6',
    payoutId: 'PY-0081',
    farmerName: 'Selvi Farm house',
    farmerId: 'FMR-00124',
    purchaseOrder: 'PO-2026-0038',
    goodsReceiptId: 'GR-0061',
    produceName: 'Beetroot',
    quantityKg: 312,
    grade: 'Grade 1',
    unitPrice: 40,
    amount: 12500,
    amountFormatted: '₹12,500',
    statusType: 'settled',
    statusLabel: 'Completed',
    accountNoMasked: '•••• 9876',
    badges: [
      { label: 'Completed', variant: 'green', hasCheck: true },
      { label: 'Individual Payment', variant: 'green' },
    ],
  },
  {
    id: 'pay-7',
    payoutId: 'BPY - 0023',
    farmerName: '',
    farmerId: 'DRAFT-BAT-0028',
    purchaseOrder: 'BPO-2026-0038',
    goodsReceiptId: 'BGR-0028',
    produceName: 'Assorted Produce',
    quantityKg: 3500,
    grade: 'Grade 1 & 2',
    unitPrice: 42.9,
    amount: 150200,
    amountFormatted: '₹1,50,200',
    statusType: 'ready',
    statusLabel: 'Bulk Payment',
    accountNoMasked: '•••• 4821',
    badges: [
      { label: 'Processing', variant: 'amber', hasClock: true },
      { label: 'Bulk Payment', variant: 'blue' },
    ],
  },
];

export interface PurchaseDuesPayoutsScreenProps {
  onBack: () => void;
}

type ScreenMode = 'list' | 'details' | 'individual_flow' | 'batch_wizard';
type IndivFlowStep = 'form' | 'processing' | 'paid' | 'settled';

// ─── Reusable Batch Stepper Component (Exact match to Images 1, 2, 3, 4) ─────
function ExactBatchStepper({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: 'Select Farmers' },
    { num: 2, label: 'Review & Confirm' },
    { num: 3, label: 'Submission' },
    { num: 4, label: 'Processing' },
    { num: 5, label: 'Completed' },
  ];

  return (
    <View style={styles.stepperMainRow}>
      {steps.map((step, idx) => {
        const isPastOrActive = step.num <= currentStep;
        const isNextActive = step.num < currentStep;
        const isLastDotted = step.num === 4 && currentStep < 5;

        return (
          <React.Fragment key={step.num}>
            <View style={styles.stepperItemCol}>
              <View
                style={[
                  styles.stepperCircleNode,
                  isPastOrActive ? styles.stepperCircleNodeOrange : styles.stepperCircleNodeGrey,
                ]}
              >
                <Text
                  style={[
                    styles.stepperCircleNodeText,
                    isPastOrActive ? styles.stepperNodeTextWhite : styles.stepperNodeTextGrey,
                  ]}
                >
                  {step.num}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepperLabelText,
                  isPastOrActive ? styles.stepperLabelTextOrange : styles.stepperLabelTextGrey,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>

            {idx < steps.length - 1 && (
              <View
                style={[
                  styles.stepperConnectorLine,
                  isNextActive
                    ? styles.stepperLineSolidOrange
                    : isLastDotted
                    ? styles.stepperLineDottedGrey
                    : styles.stepperLineSolidGrey,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export function PurchaseDuesPayoutsScreen({ onBack }: PurchaseDuesPayoutsScreenProps) {
  const [mode, setMode] = useState<ScreenMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayout, setSelectedPayout] = useState<PayoutRecord>(MOCK_PAYOUTS[2]!);
  const [payoutState, setPayoutState] = useState<PayoutStatusType>('awaiting_approval');

  // Receipt Modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Individual payment sub-flow state
  const [indivStep, setIndivStep] = useState<IndivFlowStep>('form');
  const [remarks, setRemarks] = useState('');
  const [showPaidModal, setShowPaidModal] = useState(false);

  // Batch wizard sub-flow state
  const [batchStep, setBatchStep] = useState<number>(1);
  const [selectedFarmerIds, setSelectedFarmerIds] = useState<string[]>(['pay-1', 'pay-3', 'pay-4']);
  const [batchConfirmed, setBatchConfirmed] = useState(true);

  const filteredPayouts = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_PAYOUTS;
    const q = searchQuery.toLowerCase().trim();
    return MOCK_PAYOUTS.filter(
      (p) =>
        p.payoutId.toLowerCase().includes(q) ||
        p.farmerName.toLowerCase().includes(q) ||
        p.farmerId.toLowerCase().includes(q) ||
        p.produceName.toLowerCase().includes(q) ||
        p.purchaseOrder.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const toggleSelectFarmer = (id: string) => {
    setSelectedFarmerIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SUB-VIEW: Payout Details (M13-S77 middle/right, Image 3 & Image 4 Settled, Image 5 Failed)
  // ─────────────────────────────────────────────────────────────────────────────
  if (mode === 'details') {
    const isSettled = payoutState === 'settled';
    const isFailed = payoutState === 'failed';
    const isApproved = payoutState === 'ready' || isSettled;
    const isAwaitingApproval = payoutState === 'awaiting_approval';

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.headerBanner}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setMode('list')}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back to list"
          >
            <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payout {selectedPayout.payoutId}</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.detailScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Settled Banner (Image 3 Left) */}
          {isSettled && (
            <View style={styles.settledTopBanner}>
              <View style={styles.settledBannerCheckCircle}>
                <CheckIcon size={14} color={adminColors.onBrand} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.settledBannerTitle}>Settled</Text>
                <Text style={styles.settledBannerSubtitle}>Payment successfully completed and settled.</Text>
              </View>
            </View>
          )}

          {/* Top Failed Banner (Image 5) */}
          {isFailed && (
            <>
              <View style={styles.failedTopBanner}>
                <AlertOctagonIcon size={24} color={adminColors.danger.text} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.failedBannerTitle}>Payment Failed</Text>
                  <Text style={styles.failedBannerSubtitle}>
                    Bank account details could not be verified by the payment provider.
                  </Text>
                </View>
              </View>

              {/* Batch Reference Card */}
              <View style={[styles.card, styles.batchRefRowCard]}>
                <PackageBoxIcon size={20} color={adminColors.brand} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.batchRefLabel}>Batch Reference</Text>
                  <Text style={styles.batchRefValue}>BAT-2026-0023</Text>
                </View>
              </View>
            </>
          )}

          {/* 1 · Farmer Details */}
          <Text style={styles.sectionHeading}>1 · Farmer details</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Farmer ID</Text>
              <Text style={styles.detailValueBold}>{selectedPayout.farmerId}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Farmer name</Text>
              <Text style={styles.detailValueBold}>{selectedPayout.farmerName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Registered contact</Text>
              <Text style={styles.detailValueBold}>Not shown here</Text>
            </View>
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>Verified payout account</Text>
              <Text style={styles.detailValueBold}>
                {selectedPayout.accountNoMasked || '•••• 0123'} {isFailed ? '/ Bank of India' : ''}
              </Text>
            </View>
          </View>

          {/* 2 · Purchase Details */}
          <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>2 · Purchase details</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase order</Text>
              <Text style={styles.detailValueBold}>{selectedPayout.purchaseOrder}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase date</Text>
              <Text style={styles.detailValueBold}>8 Oct 2026</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Goods receipt</Text>
              <Text style={styles.detailValueBold}>{selectedPayout.goodsReceiptId}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Produce</Text>
              <Text style={styles.detailValueBold}>{selectedPayout.produceName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Accepted quantity</Text>
              <Text style={styles.detailValueBold}>{selectedPayout.quantityKg} kg</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Accepted grade</Text>
              <Text style={styles.detailValueBold}>{selectedPayout.grade}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Unit price</Text>
              <Text style={styles.detailValueBold}>₹{selectedPayout.unitPrice.toFixed(2)} per kg</Text>
            </View>
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailLabel}>Purchase value</Text>
              <Text style={styles.detailValueBold}>₹12,600.00</Text>
            </View>
          </View>

          {/* 3 · Payout Calculation */}
          <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>3 · Payout calculation</Text>
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Accepted produce value</Text>
              <Text style={styles.detailValueBold}>₹12,600.00</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Approved adjustments</Text>
              <Text style={styles.detailValueBold}>₹0.00</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Net payable amount</Text>
              <Text style={styles.detailValueBold}>₹12,600.00</Text>
            </View>
            {isFailed ? (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Previous payout attempt</Text>
                  <View style={styles.badgeRedSmall}>
                    <Text style={styles.badgeRedSmallText}>Failed</Text>
                  </View>
                </View>
                <View style={[styles.detailRow, styles.detailRowLast]}>
                  <Text style={styles.detailLabel}>Original transaction reference</Text>
                  <Text style={styles.detailValueBold}>TXN78543028</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Currency</Text>
                  <Text style={styles.detailValueBold}>INR</Text>
                </View>
                <View style={[styles.detailRow, styles.detailRowLast]}>
                  <Text style={styles.detailLabel}>Calculation reference</Text>
                  <Text style={styles.detailValueBold}>CALC-PAY-0002</Text>
                </View>
              </>
            )}
          </View>

          {/* 4 · Approval History */}
          <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>4 · Approval history</Text>
          {isFailed ? (
            <View style={styles.card}>
              <View style={styles.attemptCardHeader}>
                <View>
                  <Text style={styles.attemptTitle}>Attempt 1</Text>
                  <Text style={styles.attemptDate}>10 Nov 2026, 11:42 AM</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.attemptAmount}>₹15,000</Text>
                  <View style={styles.badgeRedSmall}>
                    <Text style={styles.badgeRedSmallText}>Failed</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.detailRow, { marginTop: 8 }]}>
                <Text style={styles.detailLabel}>Failure reason</Text>
                <Text style={[styles.detailValueBold, { color: adminColors.danger.text }]}>Beneficiary account not found</Text>
              </View>
              <View style={[styles.detailRow, styles.detailRowLast]}>
                <Text style={styles.detailLabel}>Provider reference</Text>
                <Text style={styles.detailValueBold}>TXN78543026</Text>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Requested by</Text>
                <Text style={styles.detailValueBold}>Demo TOHFA Admin, 9 Oct 2026, 10:00</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Approval</Text>
                {isApproved ? (
                  <View style={styles.badgeGreenApproved}>
                    <CheckIcon size={11} color={adminColors.onBrand} />
                    <Text style={styles.badgeGreenApprovedText}>Approved</Text>
                  </View>
                ) : (
                  <Text style={[styles.detailValueBold, { color: adminColors.warning.text }]}>
                    Awaiting Super Admin Approval
                  </Text>
                )}
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Approver</Text>
                <Text style={styles.detailValueBold}>{isApproved ? 'Super Admin' : '—'}</Text>
              </View>
              {isApproved && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Approved on</Text>
                  <Text style={styles.detailValueBold}>9 Oct 2026, 10:25 AM</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rejection reason</Text>
                <Text style={styles.detailValueBold}>—</Text>
              </View>
              <View style={[styles.detailRow, styles.detailRowLast]}>
                <Text style={styles.detailLabel}>Processing reference</Text>
                <Text style={styles.detailValueBold}>{isApproved ? 'TXN-PY-0002' : '—'}</Text>
              </View>
            </View>
          )}

          {/* Timeline block under Approval History (Image 4) */}
          {isSettled ? (
            <View style={styles.settledTimelineContainer}>
              <View style={styles.timelineItem}>
                <Text style={styles.timelineMeta}>9 Oct 2026, 10:00 · TOHFA Admin</Text>
                <Text style={styles.timelineTitle}>Payout requested and escalated to the Super Admin: ₹12,600.00</Text>
              </View>
              <View style={styles.timelineItem}>
                <Text style={styles.timelineMeta}>9 Oct 2026, 10:00 · Approved</Text>
                <Text style={styles.timelineTitle}>Payout approved by Super Admin</Text>
              </View>
              <View style={styles.timelineItem}>
                <Text style={styles.timelineMeta}>9 Oct 2026, 10:00 · Payment Initiated</Text>
                <Text style={styles.timelineTitle}>Payment request sent to bank</Text>
              </View>
              <View style={styles.timelineItem}>
                <Text style={styles.timelineMeta}>9 Oct 2026, 10:00 · Paid</Text>
                <Text style={styles.timelineTitle}>Amount transferred to farmer bank account</Text>
              </View>
              <View style={[styles.timelineItem, { borderLeftWidth: 0 }]}>
                <Text style={styles.timelineMeta}>9 Oct 2026, 10:00 · Settled</Text>
                <Text style={styles.timelineTitle}>Reconciled with bank and marked as settled</Text>
              </View>
            </View>
          ) : !isFailed ? (
            <View style={styles.historySubBlock}>
              <Text style={styles.historySubMeta}>9 Oct 2026, 10:00 · Demo TOHFA Admin</Text>
              <Text style={styles.historySubTitle}>
                Payout requested and escalated to the Super Admin: ₹12,600.00
              </Text>
            </View>
          ) : null}

          {/* 5 · Payment Information */}
          <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>5 · Payment information</Text>
          {isFailed ? (
            <View style={styles.retryAvailableBox}>
              <View style={styles.retryIconCircle}>
                <RetryIcon size={20} color={adminColors.brand} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.retryTitle}>Retry available</Text>
                <Text style={styles.retrySubtitle}>
                  Correct or verify the farmer's bank details before retrying. A new transition reference will be generated
                </Text>
              </View>
            </View>
          ) : isSettled ? (
            <>
              <View style={styles.card}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment method</Text>
                  <Text style={styles.detailValueBold}>Bank transfer</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Provider reference</Text>
                  <Text style={styles.detailValueBold}>TXN78543021</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Initiated</Text>
                  <Text style={styles.detailValueBold}>9 Oct 2026, 10:30 AM</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Processed / Paid</Text>
                  <Text style={styles.detailValueBold}>9 Oct 2026, 10:30 AM</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Settlement reference</Text>
                  <Text style={styles.detailValueBold}>SET-2026-00156</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Settlement Date</Text>
                  <Text style={styles.detailValueBold}>9 Oct 2026, 11:05 AM</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reconciliation status</Text>
                  <View style={styles.badgeGreenApproved}>
                    <CheckIcon size={11} color={adminColors.onBrand} />
                    <Text style={styles.badgeGreenApprovedText}>Reconciled</Text>
                  </View>
                </View>
                <View style={[styles.detailRow, styles.detailRowLast]}>
                  <Text style={styles.detailLabel}>Failure reason</Text>
                  <Text style={styles.detailValueBold}>—</Text>
                </View>
              </View>

              <View style={styles.infoAlertBanner}>
                <Text style={styles.infoAlertText}>
                  Payment successfully transferred and reconciled with the bank. Payout is fully settled.
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.card}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment method</Text>
                <Text style={styles.detailValueBold}>Bank transfer (configured)</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Provider reference</Text>
                <Text style={styles.detailValueBold}>—</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Initiated</Text>
                <Text style={styles.detailValueBold}>—</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Processed</Text>
                <Text style={styles.detailValueBold}>—</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Failure reason</Text>
                <Text style={styles.detailValueBold}>—</Text>
              </View>
              <View style={[styles.detailRow, styles.detailRowLast]}>
                <Text style={styles.detailLabel}>Reconciliation status</Text>
                <Text style={styles.detailValueBold}>Not applicable</Text>
              </View>
            </View>
          )}

          <View style={{ height: adminSpacing.xxxl * 2 }} />
        </ScrollView>

        {/* Bottom Actions Fixed Bar */}
        <View style={styles.bottomBarFixed}>
          {isSettled ? (
            <View style={styles.approvalButtonsRow}>
              <TouchableOpacity
                style={styles.whiteOutlineBtn}
                onPress={() => setMode('list')}
                activeOpacity={0.85}
              >
                <Text style={styles.whiteOutlineBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.orangePrimaryBtnFlex}
                onPress={() => setShowReceiptModal(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.orangePrimaryBtnText}>Download Receipt</Text>
              </TouchableOpacity>
            </View>
          ) : isFailed ? (
            <TouchableOpacity
              style={styles.orangePrimaryBtn}
              onPress={() => {
                Alert.alert('Retrying Payout', 'Initiating retry with bank gateway...');
                setPayoutState('ready');
                setIndivStep('processing');
                setMode('individual_flow');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.orangePrimaryBtnText}>🔄 Retry Payout</Text>
            </TouchableOpacity>
          ) : isAwaitingApproval ? (
            <View style={styles.approvalButtonsRow}>
              <TouchableOpacity
                style={styles.greenApprovalBtn}
                onPress={() => {
                  setPayoutState('ready');
                  Alert.alert('Payout Approved', `Payout ${selectedPayout.payoutId} has been approved.`);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.greenApprovalBtnText}>Approval</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectOutlineBtn}
                onPress={() => {
                  setPayoutState('failed');
                  Alert.alert('Payout Rejected', `Payout ${selectedPayout.payoutId} has been marked as rejected.`);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.rejectOutlineBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.orangePrimaryBtn}
              onPress={() => {
                setIndivStep('form');
                setMode('individual_flow');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.orangePrimaryBtnText}>Make Individual Payment</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── PAYMENT RECEIPT MODAL (Image 3 Right) ─── */}
        <Modal
          visible={showReceiptModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowReceiptModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.receiptModalCard}>
              <TouchableOpacity
                style={styles.receiptCloseBtn}
                onPress={() => setShowReceiptModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <CloseIcon size={20} color={adminColors.ink} />
              </TouchableOpacity>

              {/* Header Logo */}
              <View style={{ alignItems: 'center', marginTop: 4 }}>
                <TohfaLeafLogo size={36} />
                <Text style={styles.receiptBrandTitle}>TOHFA</Text>
                <Text style={styles.receiptBrandSubtitle}>Nilgiris Horticulture Organic Farmers Association</Text>
                <Text style={styles.receiptDocTitle}>Payment Receipt</Text>
              </View>

              {/* Receipt Meta */}
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaText}>Receipt No: <Text style={{ fontWeight: '800' }}>RCPT-PY-0002</Text></Text>
                <Text style={styles.receiptMetaText}>Issue Date: <Text style={{ fontWeight: '800' }}>09 Oct 2026</Text></Text>
              </View>

              {/* Payer & Payee Boxes */}
              <View style={styles.payerPayeeRow}>
                <View style={styles.payerBox}>
                  <Text style={styles.partyLabel}>Payer</Text>
                  <Text style={styles.partyValue}>TOHFA</Text>
                </View>
                <View style={styles.payeeBox}>
                  <Text style={styles.partyLabel}>Payee (Farm)</Text>
                  <Text style={styles.partyValue}>Kumar farm house</Text>
                </View>
              </View>

              <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                {/* Purchase & Payout Details */}
                <Text style={styles.receiptSectionHead}>Purchase & Payout Details</Text>
                <View style={styles.receiptTableCard}>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableLabel}>Purchase order</Text>
                    <Text style={styles.receiptTableValue}>PO-0002</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableLabel}>Produce</Text>
                    <Text style={styles.receiptTableValue}>Beans</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableLabel}>Accepted quantity</Text>
                    <Text style={styles.receiptTableValue}>300 kg</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableLabel}>Unit price</Text>
                    <Text style={styles.receiptTableValue}>₹42.00 per kg</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableLabel}>Gross Purchase Value</Text>
                    <Text style={styles.receiptTableValue}>₹12,600.00</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableLabel}>Approved Adjustments</Text>
                    <Text style={styles.receiptTableValue}>₹0.00</Text>
                  </View>
                  <View style={[styles.receiptTableRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.receiptTableLabel}>Net Amount Paid</Text>
                    <Text style={styles.receiptTableValue}>₹12,600.00</Text>
                  </View>
                </View>

                {/* Payment Information */}
                <Text style={[styles.receiptSectionHead, { marginTop: 10 }]}>Payment Information</Text>
                <View style={styles.receiptTableCard}>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableLabel}>Payment method</Text>
                    <Text style={styles.receiptTableValue}>Bank transfer</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableLabel}>Provider reference</Text>
                    <Text style={styles.receiptTableValue}>TXN78543021</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableLabel}>Initiated</Text>
                    <Text style={styles.receiptTableValue}>9 Oct 2026, 10:30 AM</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableLabel}>Processed / Paid</Text>
                    <Text style={styles.receiptTableValue}>9 Oct 2026, 10:30 AM</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableLabel}>Settlement reference</Text>
                    <Text style={styles.receiptTableValue}>SET-2026-00156</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.receiptTableLabel}>Settlement Date</Text>
                    <Text style={styles.receiptTableValue}>9 Oct 2026, 11:05 AM</Text>
                  </View>
                  <View style={[styles.receiptTableRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.receiptTableLabel}>Reconciliation status</Text>
                    <Text style={[styles.receiptTableValue, { color: adminColors.success.text }]}>Reconciled</Text>
                  </View>
                </View>
              </ScrollView>

              {/* Total Banner */}
              <View style={styles.receiptTotalBanner}>
                <Text style={styles.receiptTotalLabel}>Amount Paid</Text>
                <Text style={styles.receiptTotalValue}>₹12,600.00</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.receiptActionsRow}>
                <TouchableOpacity
                  style={styles.whiteOutlineBtn}
                  onPress={() => setShowReceiptModal(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.whiteOutlineBtnText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.orangePrimaryBtnFlex}
                  onPress={() => {
                    setShowReceiptModal(false);
                    Alert.alert('Downloaded', 'Receipt RCPT-PY-0002 has been saved to your downloads.');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.orangePrimaryBtnText}>Download PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUB-VIEW: Individual Payment Flow (M13-S78, M13-S79, M13-S80, M13-S81)
  // ─────────────────────────────────────────────────────────────────────────────
  if (mode === 'individual_flow') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.headerBanner}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (indivStep === 'settled') {
                setMode('list');
              } else if (indivStep === 'paid') {
                setIndivStep('processing');
              } else if (indivStep === 'processing') {
                setIndivStep('form');
              } else {
                setMode('details');
              }
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {indivStep === 'form'
              ? 'Individual Payment'
              : indivStep === 'processing'
              ? 'Payment Processing'
              : 'Payment Details'}
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.detailScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 1: FORM (M13-S78) */}
          {indivStep === 'form' && (
            <>
              {/* Farmer Profile Card */}
              <View style={styles.farmerProfileCard}>
                <View style={styles.farmerAvatarCircle}>
                  <Text style={styles.farmerAvatarText}>RK</Text>
                </View>
                <View style={{ flex: 1, marginLeft: adminSpacing.sm }}>
                  <Text style={styles.farmerNameTitle}>Ramesh Kumar</Text>
                  <Text style={styles.farmerSubCode}>FMR-00124 · Ooty</Text>
                  <View style={styles.verifiedBadgeRow}>
                    <View style={styles.greenMiniDot}>
                      <CheckIcon size={10} color={adminColors.onBrand} />
                    </View>
                    <Text style={styles.verifiedBadgeText}>Bank Verified</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.farmerPayableLabel}>Total Payable</Text>
                  <Text style={styles.farmerPayableValue}>{selectedPayout.amountFormatted}</Text>
                </View>
              </View>

              {/* Payout Breakdown */}
              <Text style={styles.sectionHeading}>Payout Breakdown</Text>
              <View style={styles.card}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Produce Amount</Text>
                  <Text style={styles.detailValueBold}>{selectedPayout.amountFormatted}</Text>
                </View>
                <View style={[styles.detailRow, styles.detailRowLast, { backgroundColor: '#F9F6F0', borderRadius: 8, paddingHorizontal: 8, marginHorizontal: -8 }]}>
                  <Text style={[styles.detailLabel, { fontWeight: '800', color: adminColors.ink }]}>Net Payable Amount</Text>
                  <Text style={[styles.detailValueBold, { color: adminColors.brandDeep, fontSize: 16 }]}>
                    {selectedPayout.amountFormatted}
                  </Text>
                </View>
              </View>

              {/* Bank Account Details */}
              <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>Bank Account Details</Text>
              <View style={styles.card}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>A/c Holder</Text>
                  <Text style={styles.detailValueBold}>Ramesh Kumar</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bank</Text>
                  <Text style={styles.detailValueBold}>Indian Bank</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>A/c No</Text>
                  <Text style={styles.detailValueBold}>**********567891</Text>
                </View>
                <View style={[styles.detailRow, styles.detailRowLast]}>
                  <Text style={styles.detailLabel}>IFSC</Text>
                  <Text style={styles.detailValueBold}>IDIB0001234</Text>
                </View>
              </View>

              {/* Payment Method */}
              <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>Payment Method</Text>
              <View style={[styles.card, styles.selectCardRow]}>
                <Text style={styles.selectCardText}>Bank Transfer (NEFT/RTGS)</Text>
                <ChevronRightIcon size={18} color={adminColors.muted} />
              </View>

              {/* Remarks */}
              <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>Payment Remarks (Optional)</Text>
              <View style={styles.remarksInputContainer}>
                <TextInput
                  style={styles.remarksInput}
                  placeholder="Enter remarks..."
                  placeholderTextColor={adminColors.muted}
                  value={remarks}
                  onChangeText={setRemarks}
                />
              </View>

              {/* Notice */}
              <View style={styles.infoAlertBanner}>
                <Text style={styles.infoAlertText}>
                  Payment will be processed instantly through our payment API Provider.
                </Text>
              </View>

              <View style={{ height: adminSpacing.xxxl * 2 }} />
            </>
          )}

          {/* STEP 2, 3, 4: PROCESSING / PAID / SETTLED (M13-S79, M13-S80, M13-S81) */}
          {(indivStep === 'processing' || indivStep === 'paid' || indivStep === 'settled') && (
            <>
              {/* Top Hero Icon */}
              <View style={styles.heroCenterBlock}>
                {indivStep === 'processing' ? (
                  <View style={styles.processingCircleBadge}>
                    <PaperPlaneIcon size={32} color={adminColors.brand} />
                  </View>
                ) : indivStep === 'paid' ? (
                  <View style={styles.paidCircleBadge}>
                    <CheckIcon size={32} color={adminColors.success.text} />
                  </View>
                ) : (
                  <View style={styles.settledCircleBadge}>
                    <ShieldCheckIcon size={36} color={adminColors.success.text} />
                  </View>
                )}

                <Text style={styles.heroTitleText}>
                  {indivStep === 'processing' ? 'Payment Processing' : indivStep === 'paid' ? 'Paid' : 'Settled'}
                </Text>
                <Text style={styles.heroSubtitleText}>
                  {indivStep === 'processing'
                    ? 'Your payout is being processed through our secure payment.'
                    : indivStep === 'paid'
                    ? 'Payment has been successfully completed and recorded.'
                    : 'The payout is fully processed, reconciled and settled.'}
                </Text>
              </View>

              {/* Stepper Bar */}
              <View style={styles.stepperContainer}>
                <View style={styles.stepItem}>
                  <View style={styles.stepCircleDone}>
                    <CheckIcon size={12} color={adminColors.onBrand} />
                  </View>
                  <Text style={styles.stepLabelDone}>Approved</Text>
                  <Text style={styles.stepTimeText}>14 Oct, 05:42 PM</Text>
                </View>

                <View style={[styles.stepLine, styles.stepLineDone]} />

                <View style={styles.stepItem}>
                  <View style={indivStep === 'processing' ? styles.stepCircleActive : styles.stepCircleDone}>
                    {indivStep === 'processing' ? (
                      <View style={styles.stepInnerDot} />
                    ) : (
                      <CheckIcon size={12} color={adminColors.onBrand} />
                    )}
                  </View>
                  <Text style={indivStep === 'processing' ? styles.stepLabelActive : styles.stepLabelDone}>
                    Processing
                  </Text>
                  <Text style={styles.stepTimeText}>14 Oct, 06:12 PM</Text>
                </View>

                <View style={[styles.stepLine, indivStep !== 'processing' && styles.stepLineDone]} />

                <View style={styles.stepItem}>
                  <View style={indivStep === 'processing' ? styles.stepCirclePending : styles.stepCircleDone}>
                    {indivStep !== 'processing' ? (
                      <CheckIcon size={12} color={adminColors.onBrand} />
                    ) : (
                      <Text style={styles.stepNumberPending}>3</Text>
                    )}
                  </View>
                  <Text style={indivStep === 'processing' ? styles.stepLabelPending : styles.stepLabelDone}>
                    Paid
                  </Text>
                  <Text style={styles.stepTimeText}>
                    {indivStep === 'processing' ? 'Pending' : '14 Oct, 06:47 PM'}
                  </Text>
                </View>

                <View style={[styles.stepLine, indivStep === 'settled' && styles.stepLineDone]} />

                <View style={styles.stepItem}>
                  <View style={indivStep === 'settled' ? styles.stepCircleDone : styles.stepCirclePending}>
                    {indivStep === 'settled' ? (
                      <CheckIcon size={12} color={adminColors.onBrand} />
                    ) : (
                      <Text style={styles.stepNumberPending}>4</Text>
                    )}
                  </View>
                  <Text style={indivStep === 'settled' ? styles.stepLabelDone : styles.stepLabelPending}>
                    Settled
                  </Text>
                  <Text style={styles.stepTimeText}>
                    {indivStep === 'settled' ? '14 Oct, 07:10 PM' : 'Not Yet'}
                  </Text>
                </View>
              </View>

              {/* Payout Details Card */}
              <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>Payout Details</Text>
              <View style={styles.card}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Farmer</Text>
                  <Text style={styles.detailValueBold}>Ramesh Kumar (FMR-00124)</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Purchase Reference</Text>
                  <Text style={styles.detailValueBold}>PO-2026-0038</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Method</Text>
                  <Text style={styles.detailValueBold}>Bank Transfer (NEFT/RTGS)</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction Reference No</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.detailValueBold, { marginRight: 6 }]}>TXN78543021</Text>
                    <TouchableOpacity
                      onPress={() => Alert.alert('Copied', 'Transaction reference copied to clipboard.')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <CopyIcon size={16} color={adminColors.brand} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Date</Text>
                  <Text style={styles.detailValueBold}>14 Oct 2026</Text>
                </View>
                {indivStep === 'settled' && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Settlement Date</Text>
                    <Text style={styles.detailValueBold}>14 Oct 2026, 07:10 PM</Text>
                  </View>
                )}
                <View style={[styles.detailRow, styles.detailRowLast, styles.greenHighlightRow]}>
                  <Text style={[styles.detailLabel, { fontWeight: '800', color: adminColors.success.text }]}>
                    Net Payable Amount
                  </Text>
                  <Text style={[styles.detailValueBold, { color: adminColors.success.text, fontSize: 16 }]}>
                    {selectedPayout.amountFormatted}
                  </Text>
                </View>
              </View>

              {/* Status Note */}
              <View style={styles.infoAlertBanner}>
                <Text style={styles.infoAlertText}>
                  {indivStep === 'settled'
                    ? 'Reconciled with bank and marked as settled in accounting ledger.'
                    : "We'll update the status automatically once the payment is confirmed by the bank."}
                </Text>
              </View>

              <View style={{ height: adminSpacing.xxxl * 2 }} />
            </>
          )}
        </ScrollView>

        {/* Bottom Bar Actions for Individual Flow */}
        <View style={styles.bottomBarFixed}>
          {indivStep === 'form' && (
            <TouchableOpacity
              style={styles.orangePrimaryBtn}
              onPress={() => setIndivStep('processing')}
              activeOpacity={0.85}
            >
              <Text style={styles.orangePrimaryBtnText}>Individual Payment</Text>
            </TouchableOpacity>
          )}

          {indivStep === 'processing' && (
            <TouchableOpacity
              style={styles.orangePrimaryBtn}
              onPress={() => setIndivStep('paid')}
              activeOpacity={0.85}
            >
              <Text style={styles.orangePrimaryBtnText}>Check Status & Continue</Text>
            </TouchableOpacity>
          )}

          {indivStep === 'paid' && (
            <TouchableOpacity
              style={styles.orangePrimaryBtn}
              onPress={() => setShowPaidModal(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.orangePrimaryBtnText}>✓ Make as Settled</Text>
            </TouchableOpacity>
          )}

          {indivStep === 'settled' && (
            <View style={styles.approvalButtonsRow}>
              <TouchableOpacity
                style={styles.whiteOutlineBtn}
                onPress={() => setMode('list')}
                activeOpacity={0.85}
              >
                <Text style={styles.whiteOutlineBtnText}>Back to Dues & Payouts</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.orangePrimaryBtnFlex}
                onPress={() => setShowReceiptModal(true)}
                activeOpacity={0.85}
              >
                <DownloadIcon size={16} color={adminColors.onBrand} />
                <Text style={[styles.orangePrimaryBtnText, { marginLeft: 6 }]}>Download Receipt</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Modal: Payment Processing Started Successfully (M13-S81) */}
        <Modal
          visible={showPaidModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowPaidModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.successModalCard}>
              <View style={styles.modalCheckCircle}>
                <CheckIcon size={32} color={adminColors.success.text} />
              </View>

              <Text style={styles.modalSuccessTitle}>Payment Processing Started Successfully!</Text>
              <Text style={styles.modalSuccessSubtitle}>
                The payment request has been submitted to the payment API for processing.
              </Text>

              <View style={styles.txnRefBox}>
                <Text style={styles.txnRefLabel}>Transaction Reference No.</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Text style={styles.txnRefValue}>TXN78543021</Text>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Copied', 'Transaction reference copied.')}
                    style={{ marginLeft: 8 }}
                  >
                    <CopyIcon size={16} color={adminColors.brand} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalFullOrangeBtn}
                onPress={() => {
                  setShowPaidModal(false);
                  setIndivStep('settled');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalFullOrangeBtnText}>View Settled</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUB-VIEW: Create Payout Batch Wizard (M13-S83 - Images 1 & 2 & 4)
  // ─────────────────────────────────────────────────────────────────────────────
  if (mode === 'batch_wizard') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        <View style={styles.headerBanner}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (batchStep > 1 && batchStep < 5) {
                setBatchStep((s) => s - 1);
              } else {
                setMode('list');
              }
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {batchStep === 1 ? 'Create Payout Batch' : 'Payout Batch details'}
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top 4 KPI Cards for Step 1 & 2 (Images 1 & 4) */}
          {(batchStep === 1 || batchStep === 2) && (
            <OverviewCardsGrid style={styles.kpiGridContainer}>
              <OverviewDashboardCard
                title="Eligible Farmers"
                value="58"
                titlePosition="top"
                preserveCase
              />
              <OverviewDashboardCard
                title="Total Payable"
                value="₹6,32,200"
                titlePosition="top"
                preserveCase
              />
              <OverviewDashboardCard
                title="Needs SA Approval"
                value="12"
                titlePosition="top"
                preserveCase
              />
              <OverviewDashboardCard
                title="Not Eligible"
                value="4"
                titlePosition="top"
                preserveCase
              />
            </OverviewCardsGrid>
          )}

          {/* Top Status Card for Step 3, 4, 5 (Images 1 & 2) */}
          {batchStep === 3 && (
            <View style={styles.topStatusCard}>
              <View style={styles.topStatusGreenCircle}>
                <CheckIcon size={26} color="#16A34A" />
              </View>
              <Text style={styles.topStatusTitle}>Batch Submitted Successfully</Text>
              <Text style={styles.topStatusSubtitle}>
                The payout batch has been submitted to the payment. Payments will be processed according to their approval status.
              </Text>
            </View>
          )}

          {batchStep === 4 && (
            <View style={styles.topStatusCard}>
              <View style={styles.topStatusOrangeCircle}>
                <PaperPlaneIcon size={24} color={adminColors.brand} />
              </View>
              <Text style={styles.topStatusTitle}>Payment Processing</Text>
              <Text style={styles.topStatusSubtitle}>
                Your payout is being processed through our secure payment.
              </Text>
            </View>
          )}

          {batchStep === 5 && (
            <View style={styles.topStatusCard}>
              <View style={styles.topStatusGreenCircle}>
                <ShieldCheckIcon size={28} color="#16A34A" />
              </View>
              <Text style={styles.topStatusTitle}>Batch Completed Successfully</Text>
              <Text style={styles.topStatusSubtitle}>
                All payouts in this batch have been processed, settled, and marked as completed.
              </Text>
            </View>
          )}

          {/* Stepper with Connecting Lines (Exact to Mockups) */}
          <ExactBatchStepper currentStep={batchStep} />

          {/* Batch Summary Card (Steps 1, 2, 3, 4, 5) */}
          <View style={{ paddingHorizontal: adminSpacing.lg }}>
            <View style={styles.card}>
              <View style={styles.cardHeaderTitleRow}>
                <PackageBoxIcon size={20} color={adminColors.brand} />
                <Text style={styles.cardHeadingWithIcon}>Batch Summary</Text>
              </View>

              {batchStep >= 2 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Batch ID</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.detailValueBold, { marginRight: 6 }]}>DRAFT-BAT-0028</Text>
                    <CopyIcon size={14} color={adminColors.brand} />
                  </View>
                </View>
              )}

              {batchStep >= 3 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Submitted Date</Text>
                  <Text style={styles.detailValueBold}>18 Nov 2026, 03:52 PM</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Selected Farmers</Text>
                <Text style={styles.detailValueBold}>12</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total payable</Text>
                <Text style={styles.detailValueBold}>₹1,54,300</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Requires SA Approval</Text>
                <Text style={styles.detailValueBold}>3</Text>
              </View>
              <View style={[styles.detailRow, batchStep < 5 && styles.detailRowLast]}>
                <Text style={styles.detailLabel}>Direct Process</Text>
                <Text style={styles.detailValueBold}>9</Text>
              </View>

              {batchStep === 5 && (
                <>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Completed</Text>
                    <Text style={[styles.detailValueBold, { color: adminColors.success.text }]}>12</Text>
                  </View>
                  <View style={[styles.detailRow, styles.detailRowLast]}>
                    <Text style={styles.detailLabel}>Failed</Text>
                    <Text style={styles.detailValueBold}>0</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* STEP 1 CONTENT: SELECT FARMERS (Image 4) */}
          {batchStep === 1 && (
            <View style={{ marginTop: adminSpacing.md }}>
              {/* Search Bar */}
              <View style={styles.searchBarContainer}>
                <SearchIcon size={18} color={adminColors.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search common or scientific name"
                  placeholderTextColor={adminColors.muted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <FilterSlidersIcon size={18} color={adminColors.brand} />
              </View>

              <Text style={styles.counterText}>8 payouts · 3 unrequested dues</Text>

              {/* Checkbox Farmers List */}
              <View style={{ paddingHorizontal: adminSpacing.lg }}>
                {filteredPayouts.map((item) => {
                  const isChecked = selectedFarmerIds.includes(item.id);
                  const isAwaiting = item.statusType === 'awaiting_approval';
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.recordCard}
                      onPress={() => toggleSelectFarmer(item.id)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {/* Checkbox */}
                        <View style={[styles.batchCheckSquare, isChecked && styles.batchCheckSquareActive]}>
                          {isChecked && <CheckIcon size={12} color={adminColors.onBrand} />}
                        </View>

                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={styles.recordTopRow}>
                            <Text style={styles.recordTitle}>{item.payoutId} · {item.farmerName}</Text>
                            <Text style={styles.recordAmountText}>{item.amountFormatted}</Text>
                          </View>

                          <View style={styles.recordBottomRow}>
                            <Text style={styles.recordSubCode}>{item.farmerId} | {item.purchaseOrder}</Text>
                            <ChevronRightIcon size={16} color={adminColors.muted} />
                          </View>

                          <View style={styles.tagsRow}>
                            <View style={styles.badgeGreenSmall}>
                              <CheckIcon size={9} color={adminColors.success.text} />
                              <Text style={styles.badgeGreenSmallText}>Bank Verified</Text>
                            </View>

                            {isAwaiting ? (
                              <View style={styles.badgeAmberSmall}>
                                <Text style={styles.badgeAmberSmallText}>SA Approval Required</Text>
                              </View>
                            ) : (
                              <View style={styles.badgeGreenSmall}>
                                <Text style={styles.badgeGreenSmallText}>Ready for Payment</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 2 CONTENT: REVIEW & CONFIRM (Image 1 Right) */}
          {batchStep === 2 && (
            <View style={{ paddingHorizontal: adminSpacing.lg, marginTop: adminSpacing.md }}>
              {/* Selected Farmers (12) Card */}
              <View style={styles.card}>
                <View style={styles.cardHeaderTitleRow}>
                  <UserIcon size={18} color={adminColors.brand} />
                  <Text style={styles.cardHeadingWithIcon}>Selected Farmers (12)</Text>
                </View>

                {[
                  { name: 'Kumar Farm', code: 'FMR-00124 | PO-2026-0038', amount: '₹18,500', needsSA: true },
                  { name: 'Suseela Devi Farm house', code: 'FMR-00124 | PO-2026-0038', amount: '₹9,500', needsSA: false },
                  { name: 'Kumaran farming', code: 'FMR-00124 | PO-2026-0038', amount: '₹6,000', needsSA: false },
                  { name: 'Lakshmi Farm house', code: 'FMR-00124 | PO-2026-0038', amount: '₹12,500', needsSA: false },
                ].map((farmer, idx) => (
                  <View key={idx} style={[styles.farmerReviewItem, idx === 3 && { borderBottomWidth: 0 }]}>
                    <View style={styles.farmerReviewTop}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <UserIcon size={14} color={adminColors.brand} />
                        <Text style={[styles.farmerReviewName, { marginLeft: 6 }]}>{farmer.name}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.farmerReviewAmount}>{farmer.amount}</Text>
                        <ChevronRightIcon size={14} color={adminColors.muted} />
                      </View>
                    </View>
                    <Text style={styles.farmerReviewCode}>{farmer.code}</Text>
                    <View style={styles.farmerReviewFooter}>
                      <Text style={styles.farmerReviewAcct}>A/c No. ***9876</Text>
                      <View style={styles.badgeGreenSmall}>
                        <CheckIcon size={9} color={adminColors.success.text} />
                        <Text style={styles.badgeGreenSmallText}>Bank Verified</Text>
                      </View>
                      {farmer.needsSA ? (
                        <View style={styles.badgeAmberSmall}>
                          <Text style={styles.badgeAmberSmallText}>SA Approval Required</Text>
                        </View>
                      ) : (
                        <View style={styles.badgeGreenSmall}>
                          <Text style={styles.badgeGreenSmallText}>Ready for Payment</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* TOHFA Payout Account Card */}
              <View style={[styles.card, { marginTop: adminSpacing.md }]}>
                <View style={styles.cardHeaderTitleRow}>
                  <BankBuildingIcon size={20} color={adminColors.brand} />
                  <Text style={styles.cardHeadingWithIcon}>TOHFA Payout Account</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account Name</Text>
                  <Text style={styles.detailValueBold}>TOHFA Farming Pvt Ltd.</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account Number</Text>
                  <Text style={styles.detailValueBold}>******4821</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={styles.badgeGreenApproved}>
                    <CheckIcon size={11} color={adminColors.onBrand} />
                    <Text style={styles.badgeGreenApprovedText}>Verified</Text>
                  </View>
                </View>
                <View style={[styles.detailRow, styles.detailRowLast]}>
                  <Text style={styles.detailLabel}>Payment Method</Text>
                  <Text style={styles.detailValueBold}>Bank Transfer</Text>
                </View>
              </View>

              {/* Review Checkbox */}
              <TouchableOpacity
                style={styles.confirmCheckboxRow}
                onPress={() => setBatchConfirmed(!batchConfirmed)}
                activeOpacity={0.8}
              >
                <View style={[styles.confirmCheckboxBox, batchConfirmed && styles.confirmCheckboxBoxActive]}>
                  {batchConfirmed ? <CheckIcon size={14} color={adminColors.onBrand} /> : null}
                </View>
                <Text style={styles.confirmCheckboxLabel}>
                  I have reviewed the selected farmers and payout amounts.
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3 CONTENT: SUBMISSION DETAILS (Image 1) */}
          {batchStep === 3 && (
            <View style={{ paddingHorizontal: adminSpacing.lg, marginTop: adminSpacing.md }}>
              <View style={styles.card}>
                <View style={styles.cardHeaderTitleRow}>
                  <BankBuildingIcon size={20} color={adminColors.brand} />
                  <Text style={styles.cardHeadingWithIcon}>Submission Details</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment Method</Text>
                  <Text style={styles.detailValueBold}>Bank Transfer</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Source Account</Text>
                  <Text style={styles.detailValueBold}>******4821</Text>
                </View>
                <View style={[styles.detailRow, styles.detailRowLast]}>
                  <Text style={styles.detailLabel}>Submitted By</Text>
                  <Text style={styles.detailValueBold}>TOHFA Admin</Text>
                </View>
              </View>
            </View>
          )}

          {/* STEP 4 & 5 CONTENT: FARMERS STATUS TABLE (Image 2 & 3) */}
          {(batchStep === 4 || batchStep === 5) && (
            <View style={{ paddingHorizontal: adminSpacing.lg, marginTop: adminSpacing.md }}>
              {batchStep === 5 && (
                <>
                  <View style={[styles.searchBarContainer, { marginHorizontal: 0, marginBottom: 8 }]}>
                    <SearchIcon size={18} color={adminColors.muted} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search common or scientific name"
                      placeholderTextColor={adminColors.muted}
                    />
                    <FilterSlidersIcon size={18} color={adminColors.brand} />
                  </View>
                  <Text style={[styles.counterText, { marginHorizontal: 0 }]}>8 payouts · 3 unrequested dues</Text>
                </>
              )}

              <View style={styles.card}>
                <View style={styles.tableHeaderRow}>
                  <Text style={styles.tableHeaderLabel}>Farmer Details</Text>
                  <Text style={styles.tableHeaderLabel}>Payout Amount & Status</Text>
                </View>

                {[
                  { name: 'Kumar Farm', code: 'FMR-00124 | PO-2026-0038', amount: '₹18,500', isStep4NeedsSA: true },
                  { name: 'Suseela Devi Farm house', code: 'FMR-00124 | PO-2026-0038', amount: '₹9,500' },
                  { name: 'Kumaran farming', code: 'FMR-00124 | PO-2026-0038', amount: '₹6,000' },
                  { name: 'Lakshmi Farm house', code: 'FMR-00124 | PO-2026-0038', amount: '₹12,500' },
                ].map((item, idx) => (
                  <View key={idx} style={[styles.tableDataRow, idx === 3 && { borderBottomWidth: 0 }]}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                      <UserIcon size={16} color={adminColors.brand} />
                      <View style={{ marginLeft: 8, flex: 1 }}>
                        <Text style={styles.recordTitle}>{item.name}</Text>
                        <Text style={styles.recordSubCode}>{item.code}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.recordAmountText}>{item.amount}</Text>
                        <ChevronRightIcon size={14} color={adminColors.muted} />
                      </View>
                      {batchStep === 5 ? (
                        <View style={styles.badgeGreenApproved}>
                          <CheckIcon size={10} color={adminColors.onBrand} />
                          <Text style={styles.badgeGreenApprovedText}>Completed</Text>
                        </View>
                      ) : item.isStep4NeedsSA ? (
                        <View style={styles.badgeAmberSmall}>
                          <Text style={styles.badgeAmberSmallText}>SA Approval Required</Text>
                        </View>
                      ) : (
                        <View style={styles.badgeGreenSmall}>
                          <Text style={styles.badgeGreenSmallText}>Ready for Payment</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.infoAlertBanner}>
                <Text style={styles.infoAlertText}>
                  {batchStep === 5
                    ? 'All 12 payouts have been successfully completed and settled.'
                    : 'Payouts are being processed via bank transfer.'}
                </Text>
              </View>
            </View>
          )}

          <View style={{ height: adminSpacing.xxxl * 2 }} />
        </ScrollView>

        {/* Batch Bottom Sticky Action Bar */}
        <View style={styles.bottomBarFixed}>
          {batchStep === 1 && (
            <TouchableOpacity
              style={styles.orangePrimaryBtn}
              onPress={() => setBatchStep(2)}
              activeOpacity={0.85}
            >
              <Text style={styles.orangePrimaryBtnText}>Continue to review</Text>
            </TouchableOpacity>
          )}

          {batchStep === 2 && (
            <TouchableOpacity
              style={[styles.orangePrimaryBtn, !batchConfirmed && { opacity: 0.5 }]}
              disabled={!batchConfirmed}
              onPress={() => setBatchStep(3)}
              activeOpacity={0.85}
            >
              <Text style={styles.orangePrimaryBtnText}>Continue</Text>
            </TouchableOpacity>
          )}

          {batchStep === 3 && (
            <View style={styles.approvalButtonsRow}>
              <TouchableOpacity
                style={styles.whiteOutlineBtn}
                onPress={() => {
                  setBatchStep(1);
                  setMode('list');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.whiteOutlineBtnText}>Back to Dues & Payouts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.orangePrimaryBtnFlex}
                onPress={() => setBatchStep(4)}
                activeOpacity={0.85}
              >
                <Text style={styles.orangePrimaryBtnText}>Process payout</Text>
              </TouchableOpacity>
            </View>
          )}

          {batchStep === 4 && (
            <View style={styles.approvalButtonsRow}>
              <TouchableOpacity
                style={styles.whiteOutlineBtn}
                onPress={() => {
                  setBatchStep(1);
                  setMode('list');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.whiteOutlineBtnText}>Back to Dues & Payouts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.orangePrimaryBtnFlex}
                onPress={() => setBatchStep(5)}
                activeOpacity={0.85}
              >
                <Text style={styles.orangePrimaryBtnText}>Simulate Bank Settlement</Text>
              </TouchableOpacity>
            </View>
          )}

          {batchStep === 5 && (
            <View style={styles.approvalButtonsRow}>
              <TouchableOpacity
                style={styles.whiteOutlineBtn}
                onPress={() => {
                  setBatchStep(1);
                  setMode('list');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.whiteOutlineBtnText}>Back to Dues & Payouts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.orangePrimaryBtnFlex}
                onPress={() => Alert.alert('Report Downloaded', 'Batch report DRAFT-BAT-0028 saved.')}
                activeOpacity={0.85}
              >
                <Text style={styles.orangePrimaryBtnText}>Download Batch Report</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN VIEW: Purchase Dues & Farmer Payouts (M13-S77 Left)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Top Header Banner */}
      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to Accounts & Finance"
        >
          <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchase Dues & Payouts</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top 4 KPI Cards (reusing OverviewDashboardCard in 2x2 grid) */}
        <OverviewCardsGrid style={styles.kpiGridContainer}>
          <OverviewDashboardCard
            title="TOTAL Outstanding"
            value="₹32,450.00"
            titlePosition="top"
            preserveCase
          />
          <OverviewDashboardCard
            title="Ready for Payment"
            value="₹6,32,200"
            titlePosition="top"
            preserveCase
          />
          <OverviewDashboardCard
            title="AWAITING SA APPROVAL"
            value="₹3,16,000"
            titlePosition="top"
            preserveCase
          />
          <OverviewDashboardCard
            title="Processing"
            value="₹1,54,300"
            titlePosition="top"
            preserveCase
          />
        </OverviewCardsGrid>

        {/* Search & Filter Bar */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search common or scientific name"
            placeholderTextColor={adminColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.filterIconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Filter"
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Counter Subheading */}
        <Text style={styles.counterText}>8 payouts · 3 unrequested dues</Text>

        {/* Payout Records List */}
        <View style={{ paddingHorizontal: adminSpacing.lg }}>
          {filteredPayouts.map((item) => {
            const isAlert = item.isAlert;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.recordCard}
                onPress={() => {
                  setSelectedPayout(item);
                  setPayoutState(item.statusType);
                  setMode('details');
                }}
                activeOpacity={0.75}
              >
                <View style={styles.recordTopRow}>
                  <Text style={styles.recordTitle} numberOfLines={1}>
                    {item.payoutId}{item.farmerName ? ` · ${item.farmerName}` : ''}
                  </Text>
                  <Text style={styles.recordAmountText}>{item.amountFormatted}</Text>
                </View>

                <Text style={styles.recordSubCode}>
                  {item.farmerId} | {item.purchaseOrder}
                </Text>

                <View style={styles.recordBadgesRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    {item.badges && item.badges.length > 0 ? (
                      item.badges.map((b, bIdx) => (
                        <View
                          key={bIdx}
                          style={[
                            styles.customBadgePill,
                            b.variant === 'green' && styles.customBadgeGreen,
                            b.variant === 'amber' && styles.customBadgeAmber,
                            b.variant === 'blue' && styles.customBadgeBlue,
                          ]}
                        >
                          {b.hasCheck && (
                            <CheckIcon size={10} color="#2E7D32" />
                          )}
                          {b.hasClock && (
                            <ClockIcon size={10} color="#D97706" />
                          )}
                          <Text
                            style={[
                              styles.customBadgePillText,
                              b.variant === 'green' && styles.customBadgeTextGreen,
                              b.variant === 'amber' && styles.customBadgeTextAmber,
                              b.variant === 'blue' && styles.customBadgeTextBlue,
                              (b.hasCheck || b.hasClock) && { marginLeft: 3 },
                            ]}
                          >
                            {b.label}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <View style={[styles.statusBadge, styles.badgeGreen]}>
                        <Text style={[styles.badgeText, styles.badgeTextGreen]}>
                          {item.statusLabel}
                        </Text>
                      </View>
                    )}
                  </View>

                  <ChevronRightIcon size={16} color={adminColors.muted} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: adminSpacing.xxxl * 2 }} />
      </ScrollView>

      {/* Bottom Sticky Button: + Create Payout Batch (M13-S77) */}
      <View style={styles.bottomBarFixed}>
        <TouchableOpacity
          style={styles.orangePrimaryBtn}
          onPress={() => {
            setBatchStep(1);
            setMode('batch_wizard');
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.orangePrimaryBtnText}>Create Payout Batch</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: 8,
    paddingHorizontal: adminSpacing.lg,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingBottom: adminSpacing.xxxl * 2,
  },
  detailScrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxxl * 2,
  },
  kpiGridContainer: {
    paddingHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.sm,
  },
  searchBarContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: adminSpacing.xs,
    fontSize: 13,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterIconButton: {
    padding: adminSpacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    fontSize: 12.5,
    fontWeight: '600',
    marginHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  recordCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    marginBottom: adminSpacing.sm + 2,
    ...adminShadow.sm,
  },
  recordCardAlert: {
    borderColor: adminColors.danger.border,
    borderWidth: 1.5,
  },
  recordCardSelected: {
    borderColor: adminColors.brand,
    borderWidth: 1.5,
  },
  recordTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recordTitle: {
    ...adminType.rowTitle,
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.ink,
    flex: 1,
    marginRight: adminSpacing.xs,
  },
  recordAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  recordBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  recordSubCode: {
    ...adminType.rowMeta,
    fontSize: 12,
    color: adminColors.muted,
  },
  recordBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  customBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  customBadgeGreen: {
    backgroundColor: '#E8F5E9',
  },
  customBadgeAmber: {
    backgroundColor: '#FFF3E0',
  },
  customBadgeBlue: {
    backgroundColor: '#E0F2FE',
  },
  customBadgePillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  customBadgeTextGreen: {
    color: '#2E7D32',
  },
  customBadgeTextAmber: {
    color: '#D97706',
  },
  customBadgeTextBlue: {
    color: '#0284C7',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  badgeAmber: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeGreen: {
    backgroundColor: adminColors.success.bg,
  },
  badgeBlue: {
    backgroundColor: adminColors.info.bg,
  },
  badgeOrange: {
    backgroundColor: '#FFF0EA',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextAmber: {
    color: adminColors.warning.text,
  },
  badgeTextGreen: {
    color: adminColors.success.text,
  },
  badgeTextBlue: {
    color: adminColors.info.text,
  },
  badgeTextOrange: {
    color: adminColors.brandDeep,
  },
  badgeGreenSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  badgeGreenSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  badgeAmberSmall: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeAmberSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: adminColors.warning.text,
  },
  badgeRedSmall: {
    backgroundColor: adminColors.danger.bg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeRedSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: adminColors.danger.text,
  },
  badgeGreenApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
    gap: 3,
  },
  badgeGreenApprovedText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.xs,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminColors.border,
    marginBottom: 4,
  },
  cardHeadingWithIcon: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminColors.border,
  },
  detailRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  detailLabel: {
    ...adminType.rowMeta,
    fontSize: 12.5,
    color: adminColors.muted,
  },
  detailValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  historySubBlock: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: adminColors.brand,
    padding: adminSpacing.sm,
    marginTop: adminSpacing.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  historySubMeta: {
    ...adminType.rowMeta,
    fontSize: 11,
    color: adminColors.muted,
    marginBottom: 2,
  },
  historySubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
  },
  settledTopBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: adminRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  settledBannerCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settledBannerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#16A34A',
  },
  settledBannerSubtitle: {
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 1,
  },
  failedTopBanner: {
    backgroundColor: adminColors.danger.bg,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  failedBannerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.danger.text,
  },
  failedBannerSubtitle: {
    fontSize: 12,
    color: adminColors.ink,
    marginTop: 2,
  },
  batchRefRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: adminSpacing.md,
  },
  batchRefLabel: {
    fontSize: 11,
    color: adminColors.muted,
    fontWeight: '600',
  },
  batchRefValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  attemptCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminColors.border,
  },
  attemptTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
  },
  attemptDate: {
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 1,
  },
  attemptAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 2,
  },
  retryAvailableBox: {
    backgroundColor: '#FFF8F4',
    borderWidth: 1,
    borderColor: '#FBE2D5',
    borderRadius: adminRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: adminSpacing.md,
    marginTop: adminSpacing.xs,
  },
  retryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  retrySubtitle: {
    fontSize: 11.5,
    color: adminColors.ink,
    lineHeight: 16,
    marginTop: 2,
  },
  settledTimelineContainer: {
    marginTop: adminSpacing.xs,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.sm,
  },
  timelineItem: {
    borderLeftWidth: 2,
    borderLeftColor: adminColors.brand,
    paddingLeft: 10,
    paddingBottom: 8,
    marginBottom: 4,
  },
  timelineMeta: {
    fontSize: 10.5,
    color: adminColors.muted,
    fontWeight: '600',
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 1,
  },
  bottomBarFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm + 2,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    ...adminShadow.md,
  },
  orangePrimaryBtn: {
    width: '100%',
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  orangePrimaryBtnFlex: {
    flex: 1,
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  orangePrimaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: 0.2,
  },
  modalFullOrangeBtn: {
    width: '100%',
    height: 48,
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.lg,
    ...adminShadow.sm,
  },
  modalFullOrangeBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: 0.2,
  },
  approvalButtonsRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  greenApprovalBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#16A34A',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  greenApprovalBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  rejectOutlineBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: adminColors.danger.text,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectOutlineBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.danger.text,
  },
  whiteOutlineBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteOutlineBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
  },
  farmerProfileCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  farmerAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7EDE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  farmerNameTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  farmerSubCode: {
    fontSize: 12,
    color: adminColors.muted,
    marginTop: 1,
  },
  verifiedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  greenMiniDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  farmerPayableLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: adminColors.muted,
  },
  farmerPayableValue: {
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginTop: 2,
  },
  selectCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  selectCardText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  remarksInputContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
  },
  remarksInput: {
    fontSize: 13,
    color: adminColors.ink,
    minHeight: 36,
  },
  infoAlertBanner: {
    backgroundColor: '#FFF8F4',
    borderWidth: 1,
    borderColor: '#FBE2D5',
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  infoAlertText: {
    fontSize: 12,
    color: adminColors.brandDeep,
    lineHeight: 17,
  },
  heroCenterBlock: {
    alignItems: 'center',
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    paddingHorizontal: adminSpacing.lg,
  },
  processingCircleBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF0EA',
    borderWidth: 2,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.sm,
  },
  paidCircleBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: adminColors.success.bg,
    borderWidth: 2,
    borderColor: adminColors.success.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.sm,
  },
  settledCircleBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.sm,
  },
  heroTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
  },
  heroSubtitleText: {
    fontSize: 12.5,
    color: adminColors.muted,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Top Status Card (M13-S83 Step 3, 4, 5 - Images 1 & 2)
  topStatusCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.sm,
    alignItems: 'center',
    ...adminShadow.sm,
  },
  topStatusGreenCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.xs,
  },
  topStatusOrangeCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.xs,
  },
  topStatusTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: adminColors.ink,
    textAlign: 'center',
    marginTop: 4,
  },
  topStatusSubtitle: {
    fontSize: 12,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  // Stepper Elements
  stepperMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.lg,
    marginVertical: adminSpacing.md,
  },
  stepperItemCol: {
    alignItems: 'center',
  },
  stepperCircleNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepperCircleNodeOrange: {
    backgroundColor: adminColors.brand,
  },
  stepperCircleNodeGrey: {
    backgroundColor: '#E5E7EB',
  },
  stepperCircleNodeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  stepperNodeTextWhite: {
    color: adminColors.onBrand,
  },
  stepperNodeTextGrey: {
    color: '#9CA3AF',
  },
  stepperLabelText: {
    fontSize: 9.5,
    textAlign: 'center',
  },
  stepperLabelTextOrange: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  stepperLabelTextGrey: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  stepperConnectorLine: {
    flex: 1,
    height: 2,
    marginBottom: 16,
    marginHorizontal: 3,
  },
  stepperLineSolidOrange: {
    backgroundColor: adminColors.brand,
  },
  stepperLineSolidGrey: {
    backgroundColor: '#E5E7EB',
  },
  stepperLineDottedGrey: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    height: 0,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.md,
    marginVertical: adminSpacing.sm,
    ...adminShadow.sm,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircleDone: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF0EA',
    borderWidth: 2,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: adminColors.brand,
  },
  stepCirclePending: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F2EFEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepNumberPending: {
    fontSize: 10,
    fontWeight: '700',
    color: adminColors.muted,
  },
  stepLabelDone: {
    fontSize: 10.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  stepLabelActive: {
    fontSize: 10.5,
    fontWeight: '800',
    color: adminColors.brand,
  },
  stepLabelPending: {
    fontSize: 10.5,
    fontWeight: '600',
    color: adminColors.muted,
  },
  stepTimeText: {
    fontSize: 8.5,
    color: adminColors.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  stepLine: {
    height: 2,
    backgroundColor: '#EDE8E0',
    flex: 0.6,
    marginTop: 10,
  },
  stepLineDone: {
    backgroundColor: '#16A34A',
  },
  greenHighlightRow: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  successModalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.xl,
    alignItems: 'center',
    ...adminShadow.lg,
  },
  modalCheckCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  modalSuccessTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
    textAlign: 'center',
  },
  modalSuccessSubtitle: {
    fontSize: 12.5,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  txnRefBox: {
    width: '100%',
    backgroundColor: '#F9F6F0',
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    alignItems: 'center',
    marginVertical: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  txnRefLabel: {
    fontSize: 11,
    color: adminColors.muted,
    fontWeight: '600',
  },
  txnRefValue: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  batchCheckSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchCheckSquareActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  confirmCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  confirmCheckboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  confirmCheckboxBoxActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  confirmCheckboxLabel: {
    flex: 1,
    fontSize: 12.5,
    color: adminColors.ink,
    lineHeight: 18,
    fontWeight: '600',
  },
  farmerReviewItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminColors.border,
  },
  farmerReviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  farmerReviewName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  farmerReviewAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
    marginRight: 4,
  },
  farmerReviewCode: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 1,
  },
  farmerReviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  farmerReviewAcct: {
    fontSize: 11,
    color: adminColors.muted,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminColors.border,
  },
  tableHeaderLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: adminColors.muted,
  },
  tableDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminColors.border,
  },
  // Receipt Modal Styles
  receiptModalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    ...adminShadow.lg,
  },
  receiptCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
  },
  receiptBrandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: adminColors.ink,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  receiptBrandSubtitle: {
    fontSize: 10,
    color: adminColors.muted,
    textAlign: 'center',
  },
  receiptDocTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 8,
  },
  receiptMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    marginTop: 4,
  },
  receiptMetaText: {
    fontSize: 11,
    color: adminColors.muted,
  },
  payerPayeeRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  payerBox: {
    flex: 1,
    backgroundColor: '#F9F6F0',
    padding: 8,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  payeeBox: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  partyLabel: {
    fontSize: 10,
    color: adminColors.muted,
    fontWeight: '600',
  },
  partyValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 2,
  },
  receiptSectionHead: {
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 4,
  },
  receiptTableCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  receiptTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminColors.border,
  },
  receiptTableLabel: {
    fontSize: 11,
    color: adminColors.muted,
  },
  receiptTableValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  receiptTotalBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: adminRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  receiptTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.success.text,
  },
  receiptTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: adminColors.success.text,
  },
  receiptActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
