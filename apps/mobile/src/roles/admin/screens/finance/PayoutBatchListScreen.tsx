// Design id: M13-S05
/**
 * Payout Batch List Screen for Accounts & Finance (Super Admin).
 *
 * Implements the full Payout Batch lifecycle matching mockups:
 * - Payout Batch List with OverviewDashboardCard KPIs, filters, search & batch cards (Images 2 & 3)
 * - Payout Batch Details with batch breakdown and farmer payout list (Image 4)
 * - Payout Transaction Details with calculation breakdown & audit timeline (Image 5)
 *
 * Strictly adheres to TOHFA Admin Design Tokens (adminColors, adminRadius, adminSpacing, adminType).
 * No raw hex or rgba color literals.
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Clipboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

import {
  adminColors,
  adminShadow,
  adminSpacing,
} from '../../theme';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  EyeIcon,
} from '../../components/AdminIcons';
import {
  OverviewCardsGrid,
  OverviewDashboardCard,
} from '../../components/OverviewDashboardCard';
import { WalletScreen } from '../warehouse/wallet-cashtopup/WalletParts';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function CopyIcon({ size = 16, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarOutlineIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.9" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.9" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ListBarsIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchMagnifierIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function CoinsStackIcon({ size = 20, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Ellipse cx="12" cy="6" rx="8" ry="3" stroke={color} strokeWidth="1.9" />
      <Path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" stroke={color} strokeWidth="1.9" />
      <Path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" stroke={color} strokeWidth="1.9" />
    </Svg>
  );
}

function BuildingBankIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 21h18M3 10h18M5 10v8M9 10v8M15 10v8M19 10v8M12 3l9 7H3l9-7z" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleFilledIcon({ size = 18, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={adminColors.success.bg} stroke={color} strokeWidth="1.8" />
      <Path d="M8 12l2.5 2.5L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RefreshSyncIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38l.73.81"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Data Types ─────────────────────────────────────────────────────────────

export interface BatchRecord {
  id: string;
  batchCode: string;
  totalFarmers: number;
  totalAmount: number;
  settlementDate: string;
  submittedDate: string;
  createdBy: string;
  paymentMethod: string;
  status: 'Processing' | 'Completed' | 'Awaiting Approval' | 'Failed';
  timestamp?: string;
  farmerName?: string;
  farmerId?: string;
  purchaseOrder?: string;
  txnNumber?: string;
  settlementRef?: string;
}

export interface FarmerPayoutItem {
  id: string;
  farmerName: string;
  farmerId: string;
  purchaseOrder: string;
  amount: number;
  status: 'Completed' | 'Processing' | 'Awaiting Approval' | 'Failed';
  produce: string;
  quantityKg: number;
  unitPrice: number;
  utrTxn: string;
  settlementRef: string;
  dateStr: string;
}

// ─── Fixture Data (Matches Images 2, 3, 4, 5) ────────────────────────────────

const MOCK_BATCHES: BatchRecord[] = [
  {
    id: 'bat-1',
    batchCode: 'BAT-2026-0028',
    totalFarmers: 12,
    totalAmount: 128400,
    settlementDate: '10 Nov 2026, 05:40 PM',
    submittedDate: '18 Nov 2026, 03:52 PM',
    createdBy: 'Super admin',
    paymentMethod: 'Bank Transfer',
    status: 'Processing',
  },
  {
    id: 'bat-2',
    batchCode: 'BAT-2026-0028',
    totalFarmers: 12,
    totalAmount: 154300,
    settlementDate: '10 Nov 2026, 05:40 PM',
    submittedDate: '18 Nov 2026, 03:52 PM',
    createdBy: 'Super admin',
    paymentMethod: 'Bank Transfer',
    status: 'Completed',
    timestamp: '09 Oct 2026, 11:05 AM',
  },
  {
    id: 'bat-3',
    batchCode: 'TXN78543022',
    farmerName: 'Suseela Devi',
    farmerId: 'FMR-00168',
    purchaseOrder: 'PO-2026-0041',
    txnNumber: 'TXN78543022',
    settlementRef: 'SET-2026-00157',
    totalFarmers: 1,
    totalAmount: 9800,
    settlementDate: '09 Oct 2026, 11:05 AM',
    submittedDate: '09 Oct 2026, 09:30 AM',
    createdBy: 'Super admin',
    paymentMethod: 'Bank Transfer (API)',
    status: 'Completed',
    timestamp: '09 Oct 2026, 11:05 AM',
  },
  {
    id: 'bat-4',
    batchCode: 'BAT-2026-0028',
    totalFarmers: 12,
    totalAmount: 80000,
    settlementDate: '10 Nov 2026, 05:40 PM',
    submittedDate: '18 Nov 2026, 03:52 PM',
    createdBy: 'Super admin',
    paymentMethod: 'Bank Transfer',
    status: 'Awaiting Approval',
  },
  {
    id: 'bat-5',
    batchCode: 'BAT-2026-0028',
    totalFarmers: 12,
    totalAmount: 204300,
    settlementDate: '10 Nov 2026, 05:40 PM',
    submittedDate: '18 Nov 2026, 03:52 PM',
    createdBy: 'Super admin',
    paymentMethod: 'Bank Transfer',
    status: 'Completed',
    timestamp: '09 Oct 2026, 11:05 AM',
  },
  {
    id: 'bat-6',
    batchCode: 'BAT-2026-0028',
    totalFarmers: 12,
    totalAmount: 53200,
    settlementDate: '10 Nov 2026, 05:40 PM',
    submittedDate: '18 Nov 2026, 03:52 PM',
    createdBy: 'Super admin',
    paymentMethod: 'Bank Transfer',
    status: 'Processing',
  },
];

const MOCK_BATCH_FARMERS: FarmerPayoutItem[] = [
  {
    id: 'f-1',
    farmerName: 'Kumar Farm',
    farmerId: 'FMR-00124',
    purchaseOrder: 'PO-2026-0038',
    amount: 18500,
    status: 'Completed',
    produce: 'Beans, Tomato, Carrot',
    quantityKg: 300,
    unitPrice: 42,
    utrTxn: 'TXN78543021',
    settlementRef: 'SET-2026-00156',
    dateStr: '09 Oct 2026, 11:05 AM',
  },
  {
    id: 'f-2',
    farmerName: 'Suseela Devi Farm house',
    farmerId: 'FMR-00124',
    purchaseOrder: 'PO-2026-0038',
    amount: 9500,
    status: 'Completed',
    produce: 'Carrot, Potato',
    quantityKg: 190,
    unitPrice: 50,
    utrTxn: 'TXN78543022',
    settlementRef: 'SET-2026-00157',
    dateStr: '09 Oct 2026, 11:05 AM',
  },
  {
    id: 'f-3',
    farmerName: 'Kumaran farming',
    farmerId: 'FMR-00124',
    purchaseOrder: 'PO-2026-0038',
    amount: 6000,
    status: 'Completed',
    produce: 'Cabbage',
    quantityKg: 200,
    unitPrice: 30,
    utrTxn: 'TXN78543023',
    settlementRef: 'SET-2026-00158',
    dateStr: '09 Oct 2026, 11:05 AM',
  },
  {
    id: 'f-4',
    farmerName: 'Lakshmi Farm house',
    farmerId: 'FMR-00124',
    purchaseOrder: 'PO-2026-0038',
    amount: 12500,
    status: 'Completed',
    produce: 'Capsicum, Beans',
    quantityKg: 250,
    unitPrice: 50,
    utrTxn: 'TXN78543024',
    settlementRef: 'SET-2026-00159',
    dateStr: '09 Oct 2026, 11:05 AM',
  },
];

type BatchFilterTab = 'All' | 'Completed' | 'Processing' | 'Awaiting Approval' | 'Failed';

export interface PayoutBatchListScreenProps {
  onBack: () => void;
}

export function PayoutBatchListScreen({ onBack }: PayoutBatchListScreenProps) {
  const [activeTab, setActiveTab] = useState<BatchFilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<BatchRecord | null>(null);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerPayoutItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredBatches = useMemo(() => {
    return MOCK_BATCHES.filter((b) => {
      if (activeTab === 'Completed' && b.status !== 'Completed') return false;
      if (activeTab === 'Processing' && b.status !== 'Processing') return false;
      if (activeTab === 'Awaiting Approval' && b.status !== 'Awaiting Approval') return false;
      if (activeTab === 'Failed' && b.status !== 'Failed') return false;
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return (
          b.batchCode.toLowerCase().includes(q) ||
          (b.farmerName && b.farmerName.toLowerCase().includes(q)) ||
          (b.farmerId && b.farmerId.toLowerCase().includes(q)) ||
          b.status.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [activeTab, searchQuery]);

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 3: PAYOUT TRANSACTION DETAILS (Image 5)
  // ═══════════════════════════════════════════════════════════════════════════
  if (selectedFarmer) {
    return (
      <WalletScreen
        title="Payout Transaction details"
        subtitle="Super Admin · Transaction Breakdown"
        onBack={() => setSelectedFarmer(null)}
      >
        <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
          {/* Transaction Status Box */}
          <View style={styles.transStatusBox}>
            <View style={styles.transStatusIconWrap}>
              <BuildingBankIcon size={24} color={adminColors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.transStatusHead}>Transaction Status</Text>
              <Text style={styles.transStatusSub}>
                Payment has been successfully completed, reconciled with the bank, and settled.
              </Text>
            </View>
          </View>

          {/* Transaction details Card */}
          <View style={styles.detailCard}>
            <View style={styles.detailSectionHeaderRow}>
              <RefreshSyncIcon size={18} color={adminColors.brand} />
              <Text style={styles.detailSectionTitle}>Transaction details</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction no</Text>
              <TouchableOpacity
                style={styles.copyRow}
                onPress={() => handleCopy(selectedFarmer.utrTxn)}
                activeOpacity={0.7}
              >
                <Text style={styles.detailValueBold}>{selectedFarmer.utrTxn}</Text>
                <CopyIcon size={15} color={copiedId === selectedFarmer.utrTxn ? adminColors.success.text : adminColors.brand} />
              </TouchableOpacity>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payout Ref.</Text>
              <Text style={styles.detailValue}>{selectedFarmer.purchaseOrder}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Settlement Ref</Text>
              <Text style={styles.detailValue}>{selectedFarmer.settlementRef}</Text>
            </View>
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Settlement Date</Text>
              <Text style={styles.detailValue}>{selectedFarmer.dateStr}</Text>
            </View>
          </View>

          {/* Payout Details Card */}
          <View style={styles.detailCard}>
            <View style={styles.detailSectionHeaderRow}>
              <CoinsStackIcon size={18} color={adminColors.brand} />
              <Text style={styles.detailSectionTitle}>Payout Details</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Farmer</Text>
              <Text style={styles.detailValueBold}>{selectedFarmer.farmerName} ({selectedFarmer.farmerId})</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase order</Text>
              <Text style={styles.detailValue}>{selectedFarmer.purchaseOrder}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Produce</Text>
              <Text style={styles.detailValue}>{selectedFarmer.produce}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity</Text>
              <Text style={styles.detailValue}>{selectedFarmer.quantityKg}kg</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Grades</Text>
              <Text style={styles.detailValue}>Grade 1, Grade 2</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Unit Price</Text>
              <Text style={styles.detailValue}>₹{selectedFarmer.unitPrice.toFixed(2)} / kg</Text>
            </View>
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Purchase Value</Text>
              <Text style={styles.detailValueBold}>₹{selectedFarmer.amount.toLocaleString('en-IN')}.00</Text>
            </View>
          </View>

          {/* Payout Calculation Card */}
          <View style={styles.detailCard}>
            <View style={styles.detailSectionHeaderRow}>
              <CoinsStackIcon size={18} color={adminColors.brand} />
              <Text style={styles.detailSectionTitle}>Payout Calculation</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Accepted Produce Value</Text>
              <Text style={styles.detailValue}>₹{selectedFarmer.amount.toLocaleString('en-IN')}.00</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase order</Text>
              <Text style={styles.detailValue}>₹0.00</Text>
            </View>
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.detailLabel, { fontWeight: '700', color: adminColors.ink }]}>Net Payout Amount</Text>
              <Text style={[styles.detailValueBold, { color: adminColors.brand, fontSize: 16 }]}>
                ₹{selectedFarmer.amount.toLocaleString('en-IN')}.00
              </Text>
            </View>
          </View>

          {/* Transaction & Payment Information Card */}
          <View style={styles.detailCard}>
            <View style={styles.detailSectionHeaderRow}>
              <RefreshSyncIcon size={18} color={adminColors.brand} />
              <Text style={styles.detailSectionTitle}>Transaction & Payment Information</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment method</Text>
              <Text style={styles.detailValue}>Bank transfer</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>UTR / Transaction ID</Text>
              <TouchableOpacity
                style={styles.copyRow}
                onPress={() => handleCopy(selectedFarmer.utrTxn)}
                activeOpacity={0.7}
              >
                <Text style={styles.detailValueBold}>{selectedFarmer.utrTxn}</Text>
                <CopyIcon size={15} color={adminColors.brand} />
              </TouchableOpacity>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Settlement Reference</Text>
              <TouchableOpacity
                style={styles.copyRow}
                onPress={() => handleCopy(selectedFarmer.settlementRef)}
                activeOpacity={0.7}
              >
                <Text style={styles.detailValueBold}>{selectedFarmer.settlementRef}</Text>
                <CopyIcon size={15} color={adminColors.brand} />
              </TouchableOpacity>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Initiated On</Text>
              <Text style={styles.detailValue}>9 Oct 2026, 10:30 AM</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Paid On</Text>
              <Text style={styles.detailValue}>9 Oct 2026, 10:30 AM</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Settled Date</Text>
              <Text style={styles.detailValue}>9 Oct 2026, 11:05 AM</Text>
            </View>
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Reconciliation status</Text>
              <View style={styles.reconciledPill}>
                <CheckCircleFilledIcon size={14} color={adminColors.success.text} />
                <Text style={styles.reconciledPillText}>Reconciled</Text>
              </View>
            </View>
          </View>

          {/* Audit Timeline */}
          <View style={styles.timelineCard}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>6 Oct 2026, 10:00 · TOHFA Admin</Text>
                <Text style={styles.timelineText}>Payout requested and escalated to the Super Admin: ₹12,600.00</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>9 Oct 2026, 10:00 · Approved</Text>
                <Text style={styles.timelineText}>Payout approved by Super Admin</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>9 Oct 2026, 10:00 · Payment Initiated</Text>
                <Text style={styles.timelineText}>Payment request sent to bank</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>9 Oct 2026, 10:30 · Paid</Text>
                <Text style={styles.timelineText}>Amount transferred to farmer bank account</Text>
              </View>
            </View>
            <View style={[styles.timelineItem, { borderLeftWidth: 0 }]}>
              <View style={[styles.timelineDot, { backgroundColor: adminColors.success.text }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>9 Oct 2026, 11:05 · Settled</Text>
                <Text style={styles.timelineText}>Reconciled with bank and marked as settled</Text>
              </View>
            </View>
          </View>

          {/* Download Button */}
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => Alert.alert('Report Download', 'Payout transaction report downloaded successfully.')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryActionButtonText}>Download Report</Text>
          </TouchableOpacity>

          <View style={{ height: adminSpacing.xxxl }} />
        </ScrollView>
      </WalletScreen>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 2: PAYOUT BATCH DETAILS (Image 4)
  // ═══════════════════════════════════════════════════════════════════════════
  if (selectedBatch) {
    return (
      <WalletScreen
        title="Payout Batch details"
        subtitle="Super Admin · Batch Summary"
        onBack={() => setSelectedBatch(null)}
      >
        <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
          {/* Top 2 Summary Cards in Row */}
          <View style={styles.topSummaryRow}>
            <View style={styles.topSummaryBox}>
              <CoinsStackIcon size={20} color={adminColors.brand} />
              <View style={{ flex: 1 }}>
                <Text style={styles.topSummaryLabel}>Batch ID</Text>
                <TouchableOpacity
                  style={styles.copyRow}
                  onPress={() => handleCopy(selectedBatch.batchCode)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.topSummaryVal}>{selectedBatch.batchCode}</Text>
                  <CopyIcon size={14} color={adminColors.brand} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.topSummaryBox}>
              <CalendarOutlineIcon size={20} color={adminColors.brand} />
              <View style={{ flex: 1 }}>
                <Text style={styles.topSummaryLabel}>Submitted On</Text>
                <Text style={styles.topSummaryVal}>{selectedBatch.submittedDate}</Text>
              </View>
            </View>
          </View>

          {/* Batch Summary Card */}
          <View style={styles.detailCard}>
            <View style={styles.detailSectionHeaderRow}>
              <CoinsStackIcon size={18} color={adminColors.brand} />
              <Text style={styles.detailSectionTitle}>Batch Summary</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Batch ID</Text>
              <TouchableOpacity
                style={styles.copyRow}
                onPress={() => handleCopy(selectedBatch.batchCode)}
                activeOpacity={0.7}
              >
                <Text style={styles.detailValueBold}>{selectedBatch.batchCode}</Text>
                <CopyIcon size={14} color={adminColors.brand} />
              </TouchableOpacity>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Submitted Date</Text>
              <Text style={styles.detailValueBold}>{selectedBatch.submittedDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Selected Farmers</Text>
              <Text style={styles.detailValueBold}>{selectedBatch.totalFarmers}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total payable</Text>
              <Text style={styles.detailValueBold}>₹{selectedBatch.totalAmount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Requires SA Approval</Text>
              <Text style={styles.detailValueBold}>3</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Direct Process</Text>
              <Text style={styles.detailValueBold}>9</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Completed</Text>
              <Text style={styles.detailValueBold}>12</Text>
            </View>
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.detailLabel}>Failed</Text>
              <Text style={styles.detailValueBold}>0</Text>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBox}>
            <SearchMagnifierIcon size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search common or scientific name"
              placeholderTextColor={adminColors.muted}
            />
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </View>
          <Text style={styles.payoutsCountSub}>6 payouts · 3 unrequested dues</Text>

          {/* Farmer Details Table Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={styles.tableHeaderCol}>Farmer Details</Text>
            <Text style={[styles.tableHeaderCol, { textAlign: 'right' }]}>Payout Amount & Status</Text>
          </View>

          {/* Farmer Details Rows */}
          <View style={styles.tableCard}>
            {MOCK_BATCH_FARMERS.map((farmer, idx) => (
              <TouchableOpacity
                key={farmer.id}
                style={[styles.farmerTableRow, idx === MOCK_BATCH_FARMERS.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => setSelectedFarmer(farmer)}
                activeOpacity={0.7}
              >
                <View style={styles.farmerAvatarWrap}>
                  <Text style={styles.farmerAvatarText}>{farmer.farmerName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, paddingRight: adminSpacing.sm }}>
                  <Text style={styles.farmerNameText}>{farmer.farmerName}</Text>
                  <Text style={styles.farmerSubText}>{farmer.farmerId} · {farmer.purchaseOrder}</Text>
                </View>
                <View style={styles.farmerAmountCol}>
                  <Text style={styles.farmerAmountText}>₹{farmer.amount.toLocaleString('en-IN')}</Text>
                  <View style={styles.completedSmallBadge}>
                    <CheckCircleFilledIcon size={12} color={adminColors.success.text} />
                    <Text style={styles.completedSmallText}>Completed</Text>
                  </View>
                </View>
                <ChevronRightIcon size={16} color={adminColors.muted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Info Notice */}
          <View style={styles.infoNoticeBox}>
            <Text style={styles.infoNoticeText}>
              ℹ All 12 payouts have been successfully completed and settled.
            </Text>
          </View>

          {/* Download Batch Report Button */}
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => Alert.alert('Report Download', 'Payout batch report downloaded successfully.')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryActionButtonText}>Download Batch Report</Text>
          </TouchableOpacity>

          <View style={{ height: adminSpacing.xxxl }} />
        </ScrollView>
      </WalletScreen>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 1: PAYOUT BATCH LIST (Images 2 & 3)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <WalletScreen
      title="Payout Batch list"
      subtitle="Super Admin · All Warehouses"
      onBack={onBack}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top 4 KPI Cards using Reusable OverviewDashboardCard (Image 2) */}
        <OverviewCardsGrid style={styles.kpiGrid}>
          <OverviewDashboardCard
            value="142"
            title="Total Batches"
            subtitle="All batches"
            icon="orders"
            preserveCase
          />
          <OverviewDashboardCard
            value="124"
            title="Completed"
            subtitle="Disbursed"
            icon="clipboard"
            tone="success"
            preserveCase
          />
          <OverviewDashboardCard
            value="6"
            title="Processing"
            subtitle="In transit"
            icon="clock"
            tone="warning"
            preserveCase
          />
          <OverviewDashboardCard
            value="8"
            title="Awaiting Approval"
            subtitle="Needs review"
            icon="alert"
            tone="warning"
            preserveCase
          />
        </OverviewCardsGrid>

        {/* Filter Pills (All Batches, Completed, Processing, Awaiting Approval, Failed) */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPillFull, activeTab === 'All' && styles.filterPillFullActive]}
            onPress={() => setActiveTab('All')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillFullText, activeTab === 'All' && styles.filterPillFullTextActive]}>
              All Batches (142)
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterPillsGrid}>
          <TouchableOpacity
            style={[styles.filterPillHalf, activeTab === 'Completed' && styles.filterPillHalfActive]}
            onPress={() => setActiveTab('Completed')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillHalfText, activeTab === 'Completed' && styles.filterPillHalfTextActive]}>
              Completed (124)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPillHalf, activeTab === 'Processing' && styles.filterPillHalfActive]}
            onPress={() => setActiveTab('Processing')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillHalfText, activeTab === 'Processing' && styles.filterPillHalfTextActive]}>
              Processing (6)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPillHalf, activeTab === 'Awaiting Approval' && styles.filterPillHalfActive]}
            onPress={() => setActiveTab('Awaiting Approval')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillHalfText, activeTab === 'Awaiting Approval' && styles.filterPillHalfTextActive]}>
              Awaiting Approval (8)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPillHalf, activeTab === 'Failed' && styles.filterPillHalfActive]}
            onPress={() => setActiveTab('Failed')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterPillHalfText, activeTab === 'Failed' && styles.filterPillHalfTextActive]}>
              Failed (4)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <SearchMagnifierIcon size={18} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by payout or farmer..."
              placeholderTextColor={adminColors.muted}
            />
          </View>
          <Text style={styles.searchHelperText}>farmer, FMR ID, payout ref. or order no.</Text>
        </View>

        {/* Date Range, Filters, List Button Row */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={styles.dateRangeBtn}
            onPress={() => Alert.alert('Date Range', 'Select custom settlement date window.')}
            activeOpacity={0.8}
          >
            <CalendarOutlineIcon size={16} color={adminColors.ink} />
            <Text style={styles.dateRangeText}>Date Range</Text>
            <ChevronDownIcon size={14} color={adminColors.ink} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => Alert.alert('Filters', 'Additional filter options.')}
            activeOpacity={0.8}
          >
            <Text style={styles.filterBtnText}>Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {}}
            activeOpacity={0.8}
          >
            <ListBarsIcon size={16} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Section Header: Batches | 286 total */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Batches</Text>
          <Text style={styles.sectionCountText}>286 total</Text>
        </View>

        {/* Batches List Cards (Images 2 & 3) */}
        <View style={styles.batchList}>
          {filteredBatches.map((batch) => {
            const isCompleted = batch.status === 'Completed';
            const isProcessing = batch.status === 'Processing';
            const isAwaiting = batch.status === 'Awaiting Approval';

            let badgeBg = adminColors.brandTint;
            let badgeColor = adminColors.brandDeep;
            if (isCompleted) {
              badgeBg = adminColors.success.bg;
              badgeColor = adminColors.success.text;
            } else if (isProcessing) {
              badgeBg = adminColors.danger.bg;
              badgeColor = adminColors.danger.text;
            } else if (isAwaiting) {
              badgeBg = adminColors.brandTint;
              badgeColor = adminColors.brandDeep;
            }

            return (
              <TouchableOpacity
                key={batch.id}
                style={styles.batchCard}
                onPress={() => setSelectedBatch(batch)}
                activeOpacity={0.88}
              >
                {/* Header Row: Coins Icon, Batch ID, Amount */}
                <View style={styles.batchCardTopRow}>
                  <View style={styles.coinIconWrap}>
                    <CoinsStackIcon size={20} color={adminColors.brand} />
                  </View>
                  <View style={{ flex: 1, paddingRight: adminSpacing.sm }}>
                    {batch.farmerName ? (
                      <>
                        <Text style={styles.batchCodeTitle}>{batch.farmerName}</Text>
                        <Text style={styles.batchMetaSub}>{batch.farmerId} · Purchase Order: {batch.purchaseOrder}</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.batchCodeTitle}>{batch.batchCode}</Text>
                        <Text style={styles.batchMetaSub}>Total Farmers: {batch.totalFarmers}</Text>
                      </>
                    )}
                  </View>
                  <Text style={styles.batchAmountText}>₹{batch.totalAmount.toLocaleString('en-IN')}</Text>
                </View>

                {/* Subtitle Line: Settlement Date */}
                <Text style={styles.settlementDateText}>Settlement Date: {batch.settlementDate}</Text>

                <View style={styles.cardDivider} />

                {/* Details & Actions Row */}
                <View style={styles.cardMiddleRow}>
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity
                      style={styles.copyRow}
                      onPress={() => handleCopy(batch.txnNumber || batch.batchCode)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.batchCodeSubBold}>{batch.txnNumber || batch.batchCode}</Text>
                      <CopyIcon size={14} color={copiedId === (batch.txnNumber || batch.batchCode) ? adminColors.success.text : adminColors.muted} />
                    </TouchableOpacity>
                    <Text style={styles.createdByText}>Created By: {batch.createdBy}</Text>
                  </View>

                  <View style={styles.actionIconsRow}>
                    <TouchableOpacity
                      style={styles.actionCircleBtn}
                      onPress={() => setSelectedBatch(batch)}
                      activeOpacity={0.7}
                      accessibilityLabel="View batch details"
                    >
                      <EyeIcon size={18} color={adminColors.ink} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionCircleBtn}
                      onPress={() => Alert.alert('Download', `Downloading report for ${batch.batchCode}...`)}
                      activeOpacity={0.7}
                      accessibilityLabel="Download batch report"
                    >
                      <DownloadIcon size={18} color={adminColors.ink} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.paymentMethodRow}>
                  <Text style={styles.paymentMethodText}>Payment method: {batch.paymentMethod}</Text>
                </View>

                {/* Bottom Row: Status Pill & Timestamp */}
                <View style={styles.batchCardBottomRow}>
                  <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                    {isCompleted ? <CheckCircleFilledIcon size={13} color={badgeColor} /> : null}
                    <Text style={[styles.statusBadgeText, { color: badgeColor }]}>{batch.status}</Text>
                  </View>
                  {batch.timestamp ? (
                    <Text style={styles.timestampText}>{batch.timestamp}</Text>
                  ) : (
                    <Text style={styles.timestampText}>—</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
    </WalletScreen>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    padding: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl * 2,
    gap: adminSpacing.md,
  },
  kpiGrid: {
    marginBottom: adminSpacing.sm,
  },
  filterPillsRow: {
    marginBottom: 6,
  },
  filterPillFull: {
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  filterPillFullActive: {
    backgroundColor: adminColors.brand,
  },
  filterPillFullText: {
    color: adminColors.onBrand,
    fontSize: 15,
    fontWeight: '700',
    includeFontPadding: false,
  },
  filterPillFullTextActive: {
    color: adminColors.onBrand,
  },
  filterPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: adminSpacing.sm,
  },
  filterPillHalf: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillHalfActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  filterPillHalfText: {
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '600',
    includeFontPadding: false,
  },
  filterPillHalfTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  searchSection: {
    gap: 4,
    marginBottom: adminSpacing.xs,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 46,
    gap: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    color: adminColors.ink,
    fontSize: 14,
    padding: 0,
    includeFontPadding: false,
  },
  searchHelperText: {
    color: adminColors.muted,
    fontSize: 11,
    paddingHorizontal: 4,
    includeFontPadding: false,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: adminSpacing.xs,
  },
  dateRangeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 40,
  },
  dateRangeText: {
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '600',
    includeFontPadding: false,
  },
  filterBtn: {
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnText: {
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '600',
    includeFontPadding: false,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionHeading: {
    color: adminColors.brandDeep,
    fontSize: 16,
    fontWeight: '700',
    includeFontPadding: false,
  },
  sectionCountText: {
    color: adminColors.muted,
    fontSize: 12,
    includeFontPadding: false,
  },
  batchList: {
    gap: 12,
  },
  batchCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  batchCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: 6,
  },
  coinIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  batchCodeTitle: {
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '700',
    includeFontPadding: false,
  },
  batchMetaSub: {
    color: adminColors.muted,
    fontSize: 11,
    marginTop: 2,
    includeFontPadding: false,
  },
  batchAmountText: {
    color: adminColors.ink,
    fontSize: 17,
    fontWeight: '800',
    includeFontPadding: false,
  },
  settlementDateText: {
    color: adminColors.muted,
    fontSize: 11,
    marginBottom: adminSpacing.sm,
    includeFontPadding: false,
  },
  cardDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginBottom: adminSpacing.sm,
  },
  cardMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  batchCodeSubBold: {
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },
  createdByText: {
    color: adminColors.muted,
    fontSize: 11,
    marginTop: 2,
    includeFontPadding: false,
  },
  actionIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodRow: {
    marginBottom: 10,
  },
  paymentMethodText: {
    color: adminColors.muted,
    fontSize: 11,
    includeFontPadding: false,
  },
  batchCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },
  timestampText: {
    color: adminColors.muted,
    fontSize: 10,
    includeFontPadding: false,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  // ─── Detail Views Common Styles ───────────────────────────────────────────
  detailScroll: {
    padding: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl * 2,
    gap: adminSpacing.md,
  },
  topSummaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  topSummaryBox: {
    flex: 1,
    backgroundColor: adminColors.brandTint,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topSummaryLabel: {
    color: adminColors.muted,
    fontSize: 10,
    fontWeight: '600',
    includeFontPadding: false,
  },
  topSummaryVal: {
    color: adminColors.ink,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    includeFontPadding: false,
  },
  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  detailSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: adminSpacing.sm,
  },
  detailSectionTitle: {
    color: adminColors.brandDeep,
    fontSize: 15,
    fontWeight: '700',
    includeFontPadding: false,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  detailLabel: {
    color: adminColors.muted,
    fontSize: 12,
    includeFontPadding: false,
  },
  detailValue: {
    color: adminColors.ink,
    fontSize: 12,
    fontWeight: '600',
    includeFontPadding: false,
  },
  detailValueBold: {
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },
  transStatusBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transStatusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transStatusHead: {
    color: adminColors.brandDeep,
    fontSize: 14,
    fontWeight: '700',
    includeFontPadding: false,
  },
  transStatusSub: {
    color: adminColors.ink,
    fontSize: 11,
    marginTop: 2,
    includeFontPadding: false,
  },
  reconciledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: adminColors.success.bg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reconciledPillText: {
    color: adminColors.success.text,
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },
  timelineCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  timelineItem: {
    borderLeftWidth: 2,
    borderLeftColor: adminColors.border,
    paddingLeft: 14,
    paddingBottom: 16,
    position: 'relative',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: adminColors.brand,
    position: 'absolute',
    left: -6,
    top: 2,
  },
  timelineContent: {
    gap: 2,
  },
  timelineDate: {
    color: adminColors.brandDeep,
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },
  timelineText: {
    color: adminColors.ink,
    fontSize: 12,
    includeFontPadding: false,
  },
  primaryActionButton: {
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
    marginTop: 4,
  },
  primaryActionButtonText: {
    color: adminColors.onBrand,
    fontSize: 15,
    fontWeight: '700',
    includeFontPadding: false,
  },
  payoutsCountSub: {
    color: adminColors.muted,
    fontSize: 11,
    paddingHorizontal: 4,
    includeFontPadding: false,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.sm,
    marginTop: 4,
  },
  tableHeaderCol: {
    color: adminColors.brandDeep,
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },
  tableCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 4,
    ...adminShadow.sm,
  },
  farmerTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  farmerAvatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  farmerAvatarText: {
    color: adminColors.brandDeep,
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },
  farmerNameText: {
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },
  farmerSubText: {
    color: adminColors.muted,
    fontSize: 10,
    marginTop: 2,
    includeFontPadding: false,
  },
  farmerAmountCol: {
    alignItems: 'flex-end',
    marginRight: 6,
  },
  farmerAmountText: {
    color: adminColors.ink,
    fontSize: 14,
    fontWeight: '700',
    includeFontPadding: false,
  },
  completedSmallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: adminColors.success.bg,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginTop: 2,
  },
  completedSmallText: {
    color: adminColors.success.text,
    fontSize: 9,
    fontWeight: '700',
    includeFontPadding: false,
  },
  infoNoticeBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: 12,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  infoNoticeText: {
    color: adminColors.brandDeep,
    fontSize: 12,
    fontWeight: '600',
    includeFontPadding: false,
  },
});
