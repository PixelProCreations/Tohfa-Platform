import React, { useMemo, useState } from 'react';
import {
  Modal,
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
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

export interface InterWarehouseTransfersScreenProps {
  onBack: () => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="6.5" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="16" x2="21" y2="21" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = '#D97736' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top track & pip */}
      <Line x1="3" y1="6.5" x2="21" y2="6.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="15" y1="4" x2="15" y2="9" stroke={color} strokeWidth="2.2" strokeLinecap="round" />

      {/* Middle track & pip */}
      <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="9.5" x2="8" y2="14.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />

      {/* Bottom track & pip */}
      <Line x1="3" y1="17.5" x2="21" y2="17.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="16" y1="15" x2="16" y2="20" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronUpIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CalendarIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="8" cy="14" r="1" fill={color} />
      <Circle cx="12" cy="14" r="1" fill={color} />
      <Circle cx="16" cy="14" r="1" fill={color} />
      <Circle cx="8" cy="18" r="1" fill={color} />
      <Circle cx="12" cy="18" r="1" fill={color} />
    </Svg>
  );
}

function ChevronLeftIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Data Types & Fixtures ───────────────────────────────────────────────────

export type TransferWarehouseFilter =
  | 'All'
  | 'Main Warehouse, Ooty'
  | 'Sub Warehouse, Coonoor'
  | 'Sub Warehouse, Kotagiri'
  | 'Gudalur Market';

export type TransferProductFilter = 'All' | 'Tomato' | 'Beans' | 'Cabbage' | 'Potato';
export type TransferGradeFilter = 'All' | 'Grade 1' | 'Grade 2' | 'Grade 3';
export type TransferStatusFilter =
  | 'All'
  | 'Draft'
  | 'Submitted'
  | 'Approved'
  | 'Dispatched'
  | 'In Transit'
  | 'Partially Received'
  | 'Received'
  | 'Discrepancy'
  | 'Rejected';

export interface TransferTimelineLog {
  id: string;
  date: string;
  actor: string;
  title: string;
  note?: string;
}

export interface InterWarehouseTransferItem {
  id: string;
  transferId: string;
  routeText: string;
  sourceWarehouse: TransferWarehouseFilter;
  destWarehouse: TransferWarehouseFilter;
  date: string;
  product: TransferProductFilter;
  grade: TransferGradeFilter;
  batchId: string;
  requestedKg: number;
  approvedText: string;
  dispatchedKgText: string;
  receivedKgText: string;
  dispatchRef: string;
  transportText: string;
  receivedPhysicallyText: string;
  damageMissingExcessText: string;
  stillExpectedText: string;
  mismatchText: string;
  reasonText: string;
  initiatedBy: string;
  dispatchedInfo: string;
  receivedInfo: string;
  status: TransferStatusFilter;
  timelineLogs: TransferTimelineLog[];
}

type TransferItem = InterWarehouseTransferItem;

const INITIAL_TRANSFERS: TransferItem[] = [
  {
    id: 'tr-0006',
    transferId: 'TR-0006',
    routeText: 'Ooty to Coonoor · 14 Oct 2026, 09:00',
    sourceWarehouse: 'Main Warehouse, Ooty',
    destWarehouse: 'Sub Warehouse, Coonoor',
    date: '14 Oct 2026, 09:00',
    product: 'Tomato',
    grade: 'Grade 1',
    batchId: 'BT-0001',
    requestedKg: 20,
    approvedText: 'n/a',
    dispatchedKgText: '—',
    receivedKgText: '0 kg',
    dispatchRef: 'DSP-TR-0006',
    transportText: 'Demo vehicle (placeholder)',
    receivedPhysicallyText: '0 kg',
    damageMissingExcessText: '0 / 0 / 0 kg',
    stillExpectedText: '20 kg',
    mismatchText: 'None',
    reasonText: 'Regular replenishment',
    initiatedBy: 'Demo Main Warehouse Admin',
    dispatchedInfo: '—',
    receivedInfo: '—',
    status: 'Draft',
    timelineLogs: [
      {
        id: 'tl-1',
        date: '14 Oct 2026, 09:00',
        actor: 'Demo Main Warehouse Admin',
        title: 'Transfer created',
      },
    ],
  },
  {
    id: 'tr-0005',
    transferId: 'TR-0005',
    routeText: 'Ooty to Kotagiri · 10 Oct 2026, 09:00',
    sourceWarehouse: 'Main Warehouse, Ooty',
    destWarehouse: 'Sub Warehouse, Kotagiri',
    date: '10 Oct 2026, 09:00',
    product: 'Potato',
    grade: 'Grade 1',
    batchId: 'BT-0008',
    requestedKg: 80,
    approvedText: 'n/a',
    dispatchedKgText: '80 kg',
    receivedKgText: '50 kg',
    dispatchRef: 'DSP-TR-0005',
    transportText: 'Demo vehicle (placeholder)',
    receivedPhysicallyText: '50 kg',
    damageMissingExcessText: '0 / 0 / 0 kg',
    stillExpectedText: '30 kg',
    mismatchText: '30 kg still expected',
    reasonText: 'Demo transfer reason (placeholder).',
    initiatedBy: 'Demo Main Warehouse Admin',
    dispatchedInfo: '10 Oct 2026, 12:00',
    receivedInfo: '12 Oct 2026, 11:00',
    status: 'Partially Received',
    timelineLogs: [
      {
        id: 'tl-2',
        date: '12 Oct 2026, 11:00',
        actor: 'Demo Sub Warehouse Admin (Kotagiri)',
        title: 'Partially received: 50 kg',
      },
      {
        id: 'tl-3',
        date: '10 Oct 2026, 12:00',
        actor: 'Demo Main Warehouse Admin',
        title: 'Stock dispatched: 80 kg',
      },
      {
        id: 'tl-4',
        date: '10 Oct 2026, 09:00',
        actor: 'Demo Main Warehouse Admin',
        title: 'Transfer created',
      },
    ],
  },
  {
    id: 'tr-0004',
    transferId: 'TR-0004',
    routeText: 'Ooty to Coonoor · 13 Oct 2026, 09:00',
    sourceWarehouse: 'Main Warehouse, Ooty',
    destWarehouse: 'Sub Warehouse, Coonoor',
    date: '13 Oct 2026, 09:00',
    product: 'Tomato',
    grade: 'Grade 1',
    batchId: 'BT-0001',
    requestedKg: 30,
    approvedText: 'n/a',
    dispatchedKgText: '—',
    receivedKgText: '0 kg',
    dispatchRef: 'DSP-TR-0004',
    transportText: 'Demo vehicle (placeholder)',
    receivedPhysicallyText: '0 kg',
    damageMissingExcessText: '0 / 0 / 0 kg',
    stillExpectedText: '30 kg',
    mismatchText: 'None',
    reasonText: 'Stock rebalance request',
    initiatedBy: 'Demo Main Warehouse Admin',
    dispatchedInfo: '—',
    receivedInfo: '—',
    status: 'Submitted',
    timelineLogs: [
      {
        id: 'tl-5',
        date: '13 Oct 2026, 09:15',
        actor: 'Demo Main Warehouse Admin',
        title: 'Transfer submitted',
      },
      {
        id: 'tl-6',
        date: '13 Oct 2026, 09:00',
        actor: 'Demo Main Warehouse Admin',
        title: 'Transfer created',
      },
    ],
  },
  {
    id: 'tr-0003',
    transferId: 'TR-0003',
    routeText: 'Ooty to Gudalur Market · 9 Oct 2026, 09:00',
    sourceWarehouse: 'Main Warehouse, Ooty',
    destWarehouse: 'Gudalur Market',
    date: '9 Oct 2026, 09:00',
    product: 'Cabbage',
    grade: 'Grade 2',
    batchId: 'BT-0007',
    requestedKg: 40,
    approvedText: 'n/a',
    dispatchedKgText: '40 kg',
    receivedKgText: '35 kg',
    dispatchRef: 'DSP-TR-0003',
    transportText: 'Demo vehicle (placeholder)',
    receivedPhysicallyText: '35 kg',
    damageMissingExcessText: '5 / 5 / 0 kg',
    stillExpectedText: '0 kg',
    mismatchText: 'Damaged 5, missing 5 kg',
    reasonText: 'Discrepancy logged at destination dock',
    initiatedBy: 'Demo Main Warehouse Admin',
    dispatchedInfo: '9 Oct 2026, 12:00',
    receivedInfo: '11 Oct 2026, 11:00',
    status: 'Discrepancy',
    timelineLogs: [
      {
        id: 'tl-7',
        date: '11 Oct 2026, 11:00',
        actor: 'Demo Sub Warehouse Admin (Gudalur)',
        title: 'Discrepancy reported: Damaged 5 kg, missing 5 kg',
      },
      {
        id: 'tl-8',
        date: '9 Oct 2026, 12:00',
        actor: 'Demo Main Warehouse Admin',
        title: 'Stock dispatched: 40 kg',
      },
      {
        id: 'tl-9',
        date: '9 Oct 2026, 09:00',
        actor: 'Demo Main Warehouse Admin',
        title: 'Transfer created',
      },
    ],
  },
  {
    // Exact match to Screenshot 4
    id: 'tr-0002',
    transferId: 'TR-0002',
    routeText: 'Ooty to Kotagiri · 12 Oct 2026, 09:00',
    sourceWarehouse: 'Main Warehouse, Ooty',
    destWarehouse: 'Sub Warehouse, Kotagiri',
    date: '12 Oct 2026, 09:00',
    product: 'Beans',
    grade: 'Grade 1',
    batchId: 'BT-0002',
    requestedKg: 50,
    approvedText: '50 kg',
    dispatchedKgText: '50 kg',
    receivedKgText: '0 kg',
    dispatchRef: 'DSP-TR-0002',
    transportText: 'Demo vehicle (placeholder)',
    receivedPhysicallyText: '0 kg',
    damageMissingExcessText: '0 / 0 / 0 kg',
    stillExpectedText: '50 kg',
    mismatchText: '50 kg still expected',
    reasonText: 'Demo transfer reason (placeholder).',
    initiatedBy: 'Demo Main Warehouse Admin',
    dispatchedInfo: '12 Oct 2026, 12:00',
    receivedInfo: '—',
    status: 'In Transit',
    timelineLogs: [
      {
        id: 'tl-10',
        date: '12 Oct 2026, 12:00',
        actor: 'Demo Main Warehouse Admin',
        title: 'Goods in transit',
      },
      {
        id: 'tl-11',
        date: '12 Oct 2026, 12:00',
        actor: 'Demo Main Warehouse Admin',
        title: 'Stock dispatched: 50 kg',
      },
      {
        id: 'tl-12',
        date: '12 Oct 2026, 09:10',
        actor: 'Demo Main Warehouse Admin',
        title: 'Transfer submitted',
      },
      {
        id: 'tl-13',
        date: '12 Oct 2026, 09:00',
        actor: 'Demo Main Warehouse Admin',
        title: 'Transfer created',
      },
    ],
  },
  {
    id: 'tr-0001',
    transferId: 'TR-0001',
    routeText: 'Ooty to Coonoor · 5 Oct 2026, 09:30',
    sourceWarehouse: 'Main Warehouse, Ooty',
    destWarehouse: 'Sub Warehouse, Coonoor',
    date: '5 Oct 2026, 09:30',
    product: 'Tomato',
    grade: 'Grade 1',
    batchId: 'BT-0001',
    requestedKg: 60,
    approvedText: '60 kg',
    dispatchedKgText: '60 kg',
    receivedKgText: '60 kg',
    dispatchRef: 'DSP-TR-0001',
    transportText: 'Demo vehicle (placeholder)',
    receivedPhysicallyText: '60 kg',
    damageMissingExcessText: '0 / 0 / 0 kg',
    stillExpectedText: '0 kg',
    mismatchText: 'None',
    reasonText: 'Replenishment complete',
    initiatedBy: 'Demo Main Warehouse Admin',
    dispatchedInfo: '5 Oct 2026, 11:00',
    receivedInfo: '6 Oct 2026, 15:00',
    status: 'Received',
    timelineLogs: [
      {
        id: 'tl-14',
        date: '6 Oct 2026, 15:00',
        actor: 'Coonoor Admin',
        note: 'Stock received: 60 kg',
        title: 'Stock received: 60 kg',
      },
      {
        id: 'tl-15',
        date: '5 Oct 2026, 11:00',
        actor: 'Demo Main Warehouse Admin',
        title: 'Stock dispatched: 60 kg',
      },
      {
        id: 'tl-16',
        date: '5 Oct 2026, 09:30',
        actor: 'Demo Main Warehouse Admin',
        title: 'Transfer created',
      },
    ],
  },
];

export function InterWarehouseTransfersScreen({ onBack }: InterWarehouseTransfersScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState<TransferItem | null>(null);

  // Filters State
  const [appliedSourceWh, setAppliedSourceWh] = useState<TransferWarehouseFilter>('All');
  const [appliedDestWh, setAppliedDestWh] = useState<TransferWarehouseFilter>('All');
  const [appliedDate, setAppliedDate] = useState<string>('');
  const [appliedProduct, setAppliedProduct] = useState<TransferProductFilter>('All');
  const [appliedGrade, setAppliedGrade] = useState<TransferGradeFilter>('All');
  const [appliedStatus, setAppliedStatus] = useState<TransferStatusFilter>('All');

  // Modal Draft Filters
  const [draftSourceWh, setDraftSourceWh] = useState<TransferWarehouseFilter>('All');
  const [draftDestWh, setDraftDestWh] = useState<TransferWarehouseFilter>('All');
  const [draftDate, setDraftDate] = useState<string>('');
  const [draftProduct, setDraftProduct] = useState<TransferProductFilter>('All');
  const [draftGrade, setDraftGrade] = useState<TransferGradeFilter>('All');
  const [draftStatus, setDraftStatus] = useState<TransferStatusFilter>('All');

  // Dropdown Toggles
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sourceWhDropdownOpen, setSourceWhDropdownOpen] = useState(false);
  const [destWhDropdownOpen, setDestWhDropdownOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Interactive Calendar Modal State
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(9); // October = 9 (0-indexed)

  const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleSelectCalendarDay = (day: number) => {
    const dd = String(day).padStart(2, '0');
    const mm = String(calendarMonth + 1).padStart(2, '0');
    const yyyy = String(calendarYear);
    setDraftDate(`${dd}-${mm}-${yyyy}`);
    setShowCalendarModal(false);
  };

  const handleOpenCalendar = () => {
    closeAllDropdowns();
    if (draftDate && draftDate.includes('-')) {
      const parts = draftDate.split('-');
      if (parts.length === 3 && parts[1] && parts[2]) {
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        if (!isNaN(m) && m >= 0 && m <= 11) setCalendarMonth(m);
        if (!isNaN(y) && y > 2000) setCalendarYear(y);
      }
    }
    setShowCalendarModal(true);
  };

  const isDaySelected = (day: number) => {
    if (!draftDate || !draftDate.includes('-')) return false;
    const parts = draftDate.split('-');
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      return d === day && m === calendarMonth && y === calendarYear;
    }
    return false;
  };

  const isTodayDay = (day: number) => {
    return day === 22 && calendarMonth === 9 && calendarYear === 2026;
  };

  const closeAllDropdowns = () => {
    setSourceWhDropdownOpen(false);
    setDestWhDropdownOpen(false);
    setProductDropdownOpen(false);
    setGradeDropdownOpen(false);
    setStatusDropdownOpen(false);
  };

  const openFilterModal = () => {
    setDraftSourceWh(appliedSourceWh);
    setDraftDestWh(appliedDestWh);
    setDraftDate(appliedDate);
    setDraftProduct(appliedProduct);
    setDraftGrade(appliedGrade);
    setDraftStatus(appliedStatus);
    closeAllDropdowns();
    setShowFilterModal(true);
  };

  const handleApplyFilters = () => {
    setAppliedSourceWh(draftSourceWh);
    setAppliedDestWh(draftDestWh);
    setAppliedDate(draftDate);
    setAppliedProduct(draftProduct);
    setAppliedGrade(draftGrade);
    setAppliedStatus(draftStatus);
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    setDraftSourceWh('All');
    setDraftDestWh('All');
    setDraftDate('');
    setDraftProduct('All');
    setDraftGrade('All');
    setDraftStatus('All');
    setAppliedSourceWh('All');
    setAppliedDestWh('All');
    setAppliedDate('');
    setAppliedProduct('All');
    setAppliedGrade('All');
    setAppliedStatus('All');
    setShowFilterModal(false);
  };

  // Filtered List
  const filteredTransfers = useMemo(() => {
    return INITIAL_TRANSFERS.filter((t) => {
      if (
        searchQuery.trim() &&
        !t.transferId.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.product.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !t.routeText.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (appliedSourceWh !== 'All' && t.sourceWarehouse !== appliedSourceWh) {
        return false;
      }
      if (appliedDestWh !== 'All' && t.destWarehouse !== appliedDestWh) {
        return false;
      }
      if (appliedDate.trim()) {
        try {
          const parts = appliedDate.trim().split('-');
          if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
            const filterDay = parseInt(parts[0], 10);
            const filterMonth = parseInt(parts[1], 10) - 1;
            const filterYear = parseInt(parts[2], 10);
            const filterTimestamp = new Date(filterYear, filterMonth, filterDay).setHours(0, 0, 0, 0);

            const dateClean = t.date.replace(/·.*/, '').trim();
            const itemTime = new Date(dateClean).setHours(0, 0, 0, 0);
            if (!isNaN(filterTimestamp) && !isNaN(itemTime)) {
              if (itemTime < filterTimestamp) {
                return false;
              }
            }
          }
        } catch {
          // ignore parsing error
        }
      }
      if (appliedProduct !== 'All' && t.product !== appliedProduct) {
        return false;
      }
      if (appliedGrade !== 'All' && t.grade !== appliedGrade) {
        return false;
      }
      if (appliedStatus !== 'All' && t.status !== appliedStatus) {
        return false;
      }
      return true;
    });
  }, [
    searchQuery,
    appliedSourceWh,
    appliedDestWh,
    appliedDate,
    appliedProduct,
    appliedGrade,
    appliedStatus,
  ]);

  // ═════════════════════════════════════════════════════════════════════════════
  // VIEW: TRANSFER DETAILS DRILLDOWN (Exact Match to Screenshot 4)
  // ═════════════════════════════════════════════════════════════════════════════
  if (selectedTransfer) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header: "← Transfer TR-0002" */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => setSelectedTransfer(null)}
              activeOpacity={0.8}
            >
              <BackArrowWhiteIcon />
              <Text style={styles.headerTitle}>Transfer {selectedTransfer.transferId}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Card Title: "Transfer TR-0002" */}
          <Text style={styles.detailsCardTitle}>
            Transfer {selectedTransfer.transferId}
          </Text>

          {/* Details Table Card (Matching Screenshot 4) */}
          <View style={styles.detailsTableCard}>
            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Transfer</Text>
              <Text style={styles.detailTableValBold}>
                {selectedTransfer.transferId} · {selectedTransfer.status}
              </Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>From, to</Text>
              <Text style={styles.detailTableValBold}>
                {selectedTransfer.sourceWarehouse} to {selectedTransfer.destWarehouse}
              </Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Product, grade, batch</Text>
              <Text style={styles.detailTableValBold}>
                {selectedTransfer.product} · {selectedTransfer.grade} · {selectedTransfer.batchId}
              </Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Requested / dispatched</Text>
              <Text style={styles.detailTableValBold}>
                {selectedTransfer.requestedKg} kg / {selectedTransfer.dispatchedKgText}
              </Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Dispatch reference</Text>
              <Text style={styles.detailTableValBold}>{selectedTransfer.dispatchRef}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Transport</Text>
              <Text style={styles.detailTableValBold}>{selectedTransfer.transportText}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Received (physically)</Text>
              <Text style={styles.detailTableValBold}>{selectedTransfer.receivedPhysicallyText}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Damaged / missing / excess</Text>
              <Text style={styles.detailTableValBold}>
                {selectedTransfer.damageMissingExcessText}
              </Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Still expected</Text>
              <Text style={styles.detailTableValBold}>{selectedTransfer.stillExpectedText}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Mismatch</Text>
              <Text style={styles.detailTableValBold}>{selectedTransfer.mismatchText}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Reason</Text>
              <Text style={styles.detailTableValBold}>{selectedTransfer.reasonText}</Text>
            </View>
          </View>

          {/* Timeline Section (Matching Screenshot 4) */}
          <Text style={[styles.detailsCardTitle, { marginTop: adminSpacing.xl }]}>
            Timeline
          </Text>

          <View style={styles.timelineListContainer}>
            {selectedTransfer.timelineLogs.map((log, idx) => (
              <React.Fragment key={log.id}>
                {idx > 0 && <View style={styles.timelineDivider} />}
                <View style={styles.timelineItem}>
                  <Text style={styles.timelineMetaLine}>
                    {log.date} · {log.actor}
                  </Text>
                  <Text style={styles.timelineTitleBold}>{log.title}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <View style={{ height: adminSpacing.xxxl }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // MAIN VIEW: TRANSFERS LIST (Matching Screenshot 1)
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.8}>
            <BackArrowWhiteIcon />
            <Text style={styles.headerTitle}>Inter-Warehouse Transfers</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar with Right Filter Button */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.searchFilterBtn}
            onPress={openFilterModal}
            activeOpacity={0.7}
            accessibilityLabel="Open filters"
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* Count Label: "6 of 6 transfers" (Directly below search matching Image 3) */}
        <Text style={styles.recordsCountLabel}>
          {filteredTransfers.length} of {INITIAL_TRANSFERS.length} transfers
        </Text>

        {/* Transfers List Cards */}
        {filteredTransfers.map((item) => {
          const isDraft = item.status === 'Draft';
          const isSubmitted = item.status === 'Submitted';
          const isPartial = item.status === 'Partially Received';
          const isDiscrepancy = item.status === 'Discrepancy';
          const isReceived = item.status === 'Received';
          const isInTransit = item.status === 'In Transit';

          return (
            <View key={item.id} style={styles.transferCard}>
              {/* Header Row: ID + Status Pill */}
              <View style={styles.cardHeaderRow}>
                <Text style={styles.transferCardTitle}>{item.transferId}</Text>
                {isDraft ? (
                  <Text style={styles.draftText}>Draft</Text>
                ) : (
                  <View
                    style={[
                      styles.statusPill,
                      isSubmitted && styles.statusPillSubmitted,
                      isPartial && styles.statusPillPartial,
                      isDiscrepancy && styles.statusPillDiscrepancy,
                      (isReceived || isInTransit) && styles.statusPillReceived,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isSubmitted && styles.statusTextSubmitted,
                        isPartial && styles.statusTextPartial,
                        isDiscrepancy && styles.statusTextDiscrepancy,
                        (isReceived || isInTransit) && styles.statusTextReceived,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                )}
              </View>

              {/* Info Lines */}
              <Text style={styles.transferInfoLine}>{item.routeText}</Text>
              <Text style={styles.transferInfoLine}>
                {item.product} · {item.grade}
              </Text>
              <Text style={styles.transferInfoLine}>
                Requested {item.requestedKg} kg · Approved {item.approvedText} · Dispatched{' '}
                {item.dispatchedKgText} · Received {item.receivedKgText}
              </Text>
              <Text style={styles.transferInfoLine}>
                Mismatch: {item.mismatchText}
              </Text>
              <Text style={styles.transferInfoLine}>
                Initiated by {item.initiatedBy} · Dispatched {item.dispatchedInfo} · Received{' '}
                {item.receivedInfo}
              </Text>

              {/* Action Link: View Transfer Details (Matching Image 3) */}
              <TouchableOpacity
                style={styles.cardActionBtn}
                onPress={() => setSelectedTransfer(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionLinkText}>View Transfer Details</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>

      {/* ═════════════════════════════════════════════════════════════════════════
          FILTERS MODAL (Matching Screenshots 1, 2, 3)
      ═════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filters</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 1. Source warehouse Dropdown */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Source warehouse</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    sourceWhDropdownOpen && styles.dropdownTriggerActive,
                  ]}
                  onPress={() => {
                    closeAllDropdowns();
                    setSourceWhDropdownOpen((prev) => !prev);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownTriggerText}>{draftSourceWh}</Text>
                  {sourceWhDropdownOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                </TouchableOpacity>

                {sourceWhDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {(
                      [
                        'All',
                        'Main Warehouse, Ooty',
                        'Sub Warehouse, Coonoor',
                        'Sub Warehouse, Kotagiri',
                        'Gudalur Market',
                      ] as TransferWarehouseFilter[]
                    ).map((wh) => {
                      const isSelected = draftSourceWh === wh;
                      return (
                        <TouchableOpacity
                          key={wh}
                          style={[
                            styles.dropdownOption,
                            isSelected && styles.dropdownOptionSelected,
                          ]}
                          onPress={() => {
                            setDraftSourceWh(wh);
                            setSourceWhDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {wh}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 2. Destination warehouse Dropdown */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Destination warehouse</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    destWhDropdownOpen && styles.dropdownTriggerActive,
                  ]}
                  onPress={() => {
                    closeAllDropdowns();
                    setDestWhDropdownOpen((prev) => !prev);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownTriggerText}>{draftDestWh}</Text>
                  {destWhDropdownOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                </TouchableOpacity>

                {destWhDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {(
                      [
                        'All',
                        'Main Warehouse, Ooty',
                        'Sub Warehouse, Coonoor',
                        'Sub Warehouse, Kotagiri',
                        'Gudalur Market',
                      ] as TransferWarehouseFilter[]
                    ).map((wh) => {
                      const isSelected = draftDestWh === wh;
                      return (
                        <TouchableOpacity
                          key={wh}
                          style={[
                            styles.dropdownOption,
                            isSelected && styles.dropdownOptionSelected,
                          ]}
                          onPress={() => {
                            setDraftDestWh(wh);
                            setDestWhDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {wh}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 3. Requested on or after */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Requested on or after</Text>
                <TouchableOpacity
                  style={styles.dateInputContainer}
                  onPress={handleOpenCalendar}
                  activeOpacity={0.8}
                >
                  <TextInput
                    style={styles.dateTextInput}
                    placeholder="dd-mm-yyyy"
                    placeholderTextColor={adminColors.placeholder}
                    value={draftDate}
                    onChangeText={setDraftDate}
                  />
                  <TouchableOpacity
                    onPress={handleOpenCalendar}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <CalendarIcon size={18} color={adminColors.muted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>

              {/* 4. Product Dropdown (Exact Match to Screenshot 1: All, Tomato, Beans, Cabbage, Potato) */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Product</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    productDropdownOpen && styles.dropdownTriggerActive,
                  ]}
                  onPress={() => {
                    closeAllDropdowns();
                    setProductDropdownOpen((prev) => !prev);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownTriggerText}>{draftProduct}</Text>
                  {productDropdownOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                </TouchableOpacity>

                {productDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {(
                      [
                        'All',
                        'Tomato',
                        'Beans',
                        'Cabbage',
                        'Potato',
                      ] as TransferProductFilter[]
                    ).map((prod) => {
                      const isSelected = draftProduct === prod;
                      return (
                        <TouchableOpacity
                          key={prod}
                          style={[
                            styles.dropdownOption,
                            isSelected && styles.dropdownOptionSelected,
                          ]}
                          onPress={() => {
                            setDraftProduct(prod);
                            setProductDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {prod}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 5. Grade Dropdown (Exact Match to Screenshot 2: All, Grade 1, Grade 2, Grade 3) */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Grade</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    gradeDropdownOpen && styles.dropdownTriggerActive,
                  ]}
                  onPress={() => {
                    closeAllDropdowns();
                    setGradeDropdownOpen((prev) => !prev);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownTriggerText}>{draftGrade}</Text>
                  {gradeDropdownOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                </TouchableOpacity>

                {gradeDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {(
                      ['All', 'Grade 1', 'Grade 2', 'Grade 3'] as TransferGradeFilter[]
                    ).map((grade) => {
                      const isSelected = draftGrade === grade;
                      return (
                        <TouchableOpacity
                          key={grade}
                          style={[
                            styles.dropdownOption,
                            isSelected && styles.dropdownOptionSelected,
                          ]}
                          onPress={() => {
                            setDraftGrade(grade);
                            setGradeDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {grade}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* 6. Status Dropdown (Exact Match to Screenshot 3: Draft, Submitted, Approved, Dispatched, In Transit, Partially Received, Received, Discrepancy, Rejected) */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Status</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    statusDropdownOpen && styles.dropdownTriggerActive,
                  ]}
                  onPress={() => {
                    closeAllDropdowns();
                    setStatusDropdownOpen((prev) => !prev);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownTriggerText}>{draftStatus}</Text>
                  {statusDropdownOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                </TouchableOpacity>

                {statusDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {(
                      [
                        'All',
                        'Draft',
                        'Submitted',
                        'Approved',
                        'Dispatched',
                        'In Transit',
                        'Partially Received',
                        'Received',
                        'Discrepancy',
                        'Rejected',
                      ] as TransferStatusFilter[]
                    ).map((status) => {
                      const isSelected = draftStatus === status;
                      return (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.dropdownOption,
                            isSelected && styles.dropdownOptionSelected,
                          ]}
                          onPress={() => {
                            setDraftStatus(status);
                            setStatusDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {status}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Action Buttons: Apply & Reset */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={handleApplyFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.modalApplyBtnText}>Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={handleResetFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.modalResetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Interactive Calendar Date Picker Modal ── */}
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <TouchableOpacity
          style={styles.calendarModalBackdrop}
          activeOpacity={1}
          onPress={() => setShowCalendarModal(false)}
        >
          <TouchableOpacity
            style={styles.calendarCard}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Calendar Header with Prev/Next buttons */}
            <View style={styles.calendarHeaderRow}>
              <TouchableOpacity
                style={styles.calNavBtn}
                onPress={handlePrevMonth}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <ChevronLeftIcon size={18} color="#1A1412" />
              </TouchableOpacity>

              <Text style={styles.calendarHeaderTitle}>
                {MONTH_NAMES[calendarMonth]} {calendarYear}
              </Text>

              <TouchableOpacity
                style={styles.calNavBtn}
                onPress={handleNextMonth}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <ChevronRightIcon size={18} color="#1A1412" />
              </TouchableOpacity>
            </View>

            {/* Weekdays Row */}
            <View style={styles.calendarWeekdaysRow}>
              {WEEKDAYS.map((wd) => (
                <Text key={wd} style={styles.calendarWeekdayText}>
                  {wd}
                </Text>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View style={styles.calendarGrid}>
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <View key={`empty-${idx}`} style={styles.calendarDayCell} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const isSelected = isDaySelected(dayNum);
                const isToday = isTodayDay(dayNum);

                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    style={[
                      styles.calendarDayCell,
                      styles.calendarDayBtn,
                      isSelected && styles.calendarDayBtnSelected,
                      isToday && !isSelected && styles.calendarDayBtnToday,
                    ]}
                    onPress={() => handleSelectCalendarDay(dayNum)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextSelected,
                        isToday && !isSelected && styles.calendarDayTextToday,
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Footer Row: Clear, Today, Close */}
            <View style={styles.calendarFooterRow}>
              <TouchableOpacity
                style={styles.calendarFooterBtn}
                onPress={() => {
                  setDraftDate('');
                  setShowCalendarModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.calendarClearText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.calendarFooterBtn, styles.calendarTodayBtn]}
                onPress={() => {
                  const today = new Date(2026, 9, 22);
                  const dd = String(today.getDate()).padStart(2, '0');
                  const mm = String(today.getMonth() + 1).padStart(2, '0');
                  const yyyy = String(today.getFullYear());
                  setDraftDate(`${dd}-${mm}-${yyyy}`);
                  setShowCalendarModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.calendarTodayText}>Today</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.calendarFooterBtn}
                onPress={() => setShowCalendarModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.calendarCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl,
  },

  // ── Search Bar Container ──
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0ECE6',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: adminColors.ink,
    marginLeft: 8,
    paddingVertical: 0,
  },
  searchFilterBtn: {
    padding: 6,
  },

  // ── Quick Filter Pill Button ──
  filterPillContainer: {
    marginBottom: adminSpacing.sm,
  },
  filterPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E1D7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    ...adminShadow.sm,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5C3818',
  },

  recordsCountLabel: {
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
    marginTop: 2,
  },

  // ── Transfer List Cards ──
  transferCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0ECE6',
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  transferCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: adminColors.ink,
  },
  draftText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1412',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  statusPillSubmitted: {
    backgroundColor: '#E1F5FE',
  },
  statusTextSubmitted: {
    color: '#0277BD',
    fontWeight: '700',
    fontSize: 11,
  },
  statusPillPartial: {
    backgroundColor: '#FFF3E0',
  },
  statusTextPartial: {
    color: '#B25E00',
    fontWeight: '700',
    fontSize: 11,
  },
  statusPillDiscrepancy: {
    backgroundColor: '#FFEBEE',
  },
  statusTextDiscrepancy: {
    color: '#C62828',
    fontWeight: '700',
    fontSize: 11,
  },
  statusPillReceived: {
    backgroundColor: '#E8F5E9',
  },
  statusTextReceived: {
    color: '#2E7D32',
    fontWeight: '700',
    fontSize: 11,
  },
  statusPillText: {
    fontSize: 11,
  },

  transferInfoLine: {
    fontSize: 12,
    color: '#4A443F',
    lineHeight: 18,
    marginBottom: 2,
  },
  cardActionBtn: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F4EFEA',
  },
  actionLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A3205',
  },

  // ── Transfer Details Drilldown Styles (Screenshot 4) ──
  detailsCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7A3205',
    marginBottom: 10,
  },
  detailsTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEBE4',
    paddingHorizontal: 16,
    paddingVertical: 6,
    ...adminShadow.sm,
  },
  detailTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailTableLabel: {
    fontSize: 13,
    color: '#8A827B',
    flex: 1,
  },
  detailTableValBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1412',
    textAlign: 'right',
    flex: 1.4,
  },
  tableDivider: {
    height: 1,
    borderBottomWidth: 1,
    borderColor: '#F0EBE4',
    borderStyle: 'dashed',
  },

  // ── Timeline Section (Screenshot 4) ──
  timelineListContainer: {
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  timelineItem: {
    paddingVertical: 10,
  },
  timelineDivider: {
    height: 1,
    borderBottomWidth: 1,
    borderColor: '#E8E1D7',
    borderStyle: 'dashed',
  },
  timelineMetaLine: {
    fontSize: 12,
    color: '#8F6E4A',
    marginBottom: 4,
  },
  timelineTitleBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1412',
  },

  // ── Filters Modal Styles ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalContent: {
    width: '92%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    ...adminShadow.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1412',
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A443F',
    marginBottom: 8,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E1D7',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownTriggerActive: {
    borderColor: '#1A1412',
    borderWidth: 1.8,
  },
  dropdownTriggerText: {
    fontSize: 14,
    color: '#1A1412',
    fontWeight: '500',
  },
  dateInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E1D7',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 48,
  },
  dateTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1412',
    paddingVertical: 0,
  },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#707070',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    ...adminShadow.sm,
  },
  dropdownOption: {
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  dropdownOptionSelected: {
    backgroundColor: '#707070',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#1A1412',
  },
  dropdownOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Modal Buttons
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalApplyBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E1D7',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1412',
  },
  modalResetBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E1D7',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalResetBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1412',
  },

  // ── Calendar Modal Styles ──
  calendarModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  calendarCard: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    ...adminShadow.md,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  calNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F2EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1412',
  },
  calendarWeekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#8A827B',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  calendarDayBtn: {
    borderRadius: 19,
  },
  calendarDayBtnSelected: {
    backgroundColor: adminColors.brand,
  },
  calendarDayBtnToday: {
    borderWidth: 1,
    borderColor: adminColors.brand,
  },
  calendarDayText: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#1A1412',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  calendarFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0ECE6',
  },
  calendarFooterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  calendarTodayBtn: {
    backgroundColor: '#FFF4ED',
    borderRadius: 8,
  },
  calendarClearText: {
    fontSize: 13,
    color: '#8A827B',
    fontWeight: '600',
  },
  calendarTodayText: {
    fontSize: 13,
    color: adminColors.brand,
    fontWeight: '700',
  },
  calendarCloseText: {
    fontSize: 13,
    color: '#1A1412',
    fontWeight: '600',
  },
});
