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
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

export interface StockVerificationScreenProps {
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

// ─── Data Types & Fixtures ───────────────────────────────────────────────────

export type VerificationWarehouseFilter = 'All' | 'Ooty' | 'Coonoor' | 'Kotagiri' | 'Gudalur Market';
export type VerificationStatusFilter =
  | 'All'
  | 'Matched'
  | 'Variance identified'
  | 'Submitted for review'
  | 'Adjustment pending approval'
  | 'Closed';
export type VerificationProductFilter = 'All' | 'Cabbage' | 'Potato' | 'Carrot' | 'Beans';
export type VerificationGradeFilter = 'All' | 'Grade 1' | 'Grade 2' | 'Grade 3';
export type VerificationVerifierFilter =
  | 'All'
  | 'Demo Sub Warehouse Admin'
  | 'Demo Main Warehouse Admin'
  | 'Demo Sub Warehouse Admin (Gudalur)'
  | 'Demo Sub Warehouse Admin (Kotagiri)';

export interface VerificationItem {
  id: string;
  verificationId: string;
  warehouseCity: 'Ooty' | 'Coonoor' | 'Kotagiri' | 'Gudalur Market';
  warehouseFull: string;
  date: string;
  type: string;
  product: 'Cabbage' | 'Potato' | 'Carrot' | 'Beans';
  grade: 'Grade 1' | 'Grade 2' | 'Grade 3';
  batchId: string;
  systemQtyKg: number;
  countedQtyKg: number;
  varianceKg: number;
  status: VerificationStatusFilter;
  reasonCode: string;
  notes: string;
  evidence: string;
  countedBy: string;
  verifiedBy: string;
  linkedAdjustment: string;
  historyDate: string;
  historyActor: string;
  historyNote: string;
}

const INITIAL_VERIFICATIONS: VerificationItem[] = [
  {
    id: 'ver-0005',
    verificationId: 'VER-0005',
    warehouseCity: 'Ooty',
    warehouseFull: 'Main Warehouse, Ooty',
    date: '13 Oct 2026',
    type: 'Physical count',
    product: 'Beans',
    grade: 'Grade 1',
    batchId: 'BT-0002',
    systemQtyKg: 225,
    countedQtyKg: 223,
    varianceKg: -2,
    status: 'Submitted for review',
    reasonCode: 'Counting error',
    notes: 'Demo variance note (placeholder).',
    evidence: 'None',
    countedBy: 'Demo Main Warehouse Admin, 13 Oct 2026, 09:30',
    verifiedBy: 'Demo Main Warehouse Admin',
    linkedAdjustment: 'None',
    historyDate: '13 Oct 2026, 09:30',
    historyActor: 'Demo Main Warehouse Admin',
    historyNote: 'Verification recorded: Counted 223 kg against 225 kg',
  },
  {
    id: 'ver-0004',
    verificationId: 'VER-0004',
    warehouseCity: 'Kotagiri',
    warehouseFull: 'Sub Warehouse, Kotagiri',
    date: '13 Oct 2026',
    type: 'Physical count',
    product: 'Potato',
    grade: 'Grade 1',
    batchId: 'BT-0005',
    systemQtyKg: 200,
    countedQtyKg: 195,
    varianceKg: -5,
    status: 'Variance identified',
    reasonCode: 'Damaged in storage',
    notes: 'Moisture ingress caused bag damage.',
    evidence: 'IMG-0045.jpg',
    countedBy: 'Demo Sub Warehouse Admin (Kotagiri), 13 Oct 2026, 08:45',
    verifiedBy: 'Demo Sub Warehouse Admin (Kotagiri)',
    linkedAdjustment: 'ADJ-0002',
    historyDate: '13 Oct 2026, 08:45',
    historyActor: 'Demo Sub Warehouse Admin (Kotagiri)',
    historyNote: 'Verification recorded: Counted 195 kg against 200 kg',
  },
  {
    id: 'ver-0003',
    verificationId: 'VER-0003',
    warehouseCity: 'Gudalur Market',
    warehouseFull: 'Sub Warehouse, Gudalur Market',
    date: '12 Oct 2026',
    type: 'Physical count',
    product: 'Carrot',
    grade: 'Grade 1',
    batchId: 'BT-0006',
    systemQtyKg: 117,
    countedQtyKg: 113,
    varianceKg: -4,
    status: 'Submitted for review',
    reasonCode: 'Shrinkage loss',
    notes: 'Natural weight reduction in cold unit.',
    evidence: 'None',
    countedBy: 'Demo Sub Warehouse Admin (Gudalur), 12 Oct 2026, 17:15',
    verifiedBy: 'Demo Sub Warehouse Admin (Gudalur)',
    linkedAdjustment: 'none',
    historyDate: '12 Oct 2026, 17:15',
    historyActor: 'Demo Sub Warehouse Admin (Gudalur)',
    historyNote: 'Verification recorded: Counted 113 kg against 117 kg',
  },
  {
    id: 'ver-0002',
    verificationId: 'VER-0002',
    warehouseCity: 'Ooty',
    warehouseFull: 'Main Warehouse, Ooty',
    date: '13 Oct 2026',
    type: 'Physical count',
    product: 'Potato',
    grade: 'Grade 1',
    batchId: 'BT-0008',
    systemQtyKg: 120,
    countedQtyKg: 120,
    varianceKg: 0,
    status: 'Matched',
    reasonCode: 'None',
    notes: 'Count exactly matches system balance.',
    evidence: 'None',
    countedBy: 'Demo Main Warehouse Admin, 13 Oct 2026, 08:15',
    verifiedBy: 'Demo Main Warehouse Admin',
    linkedAdjustment: 'none',
    historyDate: '13 Oct 2026, 08:15',
    historyActor: 'Demo Main Warehouse Admin',
    historyNote: 'Verification recorded: Counted 120 kg against 120 kg',
  },
  {
    id: 'ver-0001',
    verificationId: 'VER-0001',
    warehouseCity: 'Coonoor',
    warehouseFull: 'Sub Warehouse, Coonoor',
    date: '11 Oct 2026',
    type: 'Physical count',
    product: 'Cabbage',
    grade: 'Grade 2',
    batchId: 'BT-0007',
    systemQtyKg: 100,
    countedQtyKg: 98,
    varianceKg: -2,
    status: 'Closed',
    reasonCode: 'Handling loss',
    notes: 'Minor trimming during restack.',
    evidence: 'None',
    countedBy: 'Demo Sub Warehouse Admin, 11 Oct 2026, 15:30',
    verifiedBy: 'Demo Sub Warehouse Admin',
    linkedAdjustment: 'ADJ-0001',
    historyDate: '11 Oct 2026, 15:30',
    historyActor: 'Demo Sub Warehouse Admin',
    historyNote: 'Verification recorded: Counted 98 kg against 100 kg',
  },
];

export function StockVerificationScreen({ onBack }: StockVerificationScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVerification, setSelectedVerification] = useState<VerificationItem | null>(null);

  // Filter States
  const [appliedWarehouse, setAppliedWarehouse] = useState<VerificationWarehouseFilter>('All');
  const [appliedDate, setAppliedDate] = useState<string>('');
  const [appliedStatus, setAppliedStatus] = useState<VerificationStatusFilter>('All');
  const [appliedProduct, setAppliedProduct] = useState<VerificationProductFilter>('All');
  const [appliedGrade, setAppliedGrade] = useState<VerificationGradeFilter>('All');
  const [appliedVerifier, setAppliedVerifier] = useState<VerificationVerifierFilter>('All');

  // Draft Filter States for Modal
  const [draftWarehouse, setDraftWarehouse] = useState<VerificationWarehouseFilter>('All');
  const [draftDate, setDraftDate] = useState<string>('');
  const [draftStatus, setDraftStatus] = useState<VerificationStatusFilter>('All');
  const [draftProduct, setDraftProduct] = useState<VerificationProductFilter>('All');
  const [draftGrade, setDraftGrade] = useState<VerificationGradeFilter>('All');
  const [draftVerifier, setDraftVerifier] = useState<VerificationVerifierFilter>('All');

  // Dropdown Open Toggles
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [whDropdownOpen, setWhDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const [verifierDropdownOpen, setVerifierDropdownOpen] = useState(false);

  const closeAllDropdowns = () => {
    setWhDropdownOpen(false);
    setStatusDropdownOpen(false);
    setProductDropdownOpen(false);
    setGradeDropdownOpen(false);
    setVerifierDropdownOpen(false);
  };

  const openFilterModal = () => {
    setDraftWarehouse(appliedWarehouse);
    setDraftDate(appliedDate);
    setDraftStatus(appliedStatus);
    setDraftProduct(appliedProduct);
    setDraftGrade(appliedGrade);
    setDraftVerifier(appliedVerifier);
    closeAllDropdowns();
    setShowFilterModal(true);
  };

  const handleApplyFilters = () => {
    setAppliedWarehouse(draftWarehouse);
    setAppliedDate(draftDate);
    setAppliedStatus(draftStatus);
    setAppliedProduct(draftProduct);
    setAppliedGrade(draftGrade);
    setAppliedVerifier(draftVerifier);
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    setDraftWarehouse('All');
    setDraftDate('');
    setDraftStatus('All');
    setDraftProduct('All');
    setDraftGrade('All');
    setDraftVerifier('All');
    setAppliedWarehouse('All');
    setAppliedDate('');
    setAppliedStatus('All');
    setAppliedProduct('All');
    setAppliedGrade('All');
    setAppliedVerifier('All');
    setShowFilterModal(false);
  };

  // Filtered Verifications List
  const filteredVerifications = useMemo(() => {
    return INITIAL_VERIFICATIONS.filter((v) => {
      if (
        searchQuery.trim() &&
        !v.verificationId.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !v.product.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !v.batchId.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !v.warehouseCity.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (appliedWarehouse !== 'All' && v.warehouseCity !== appliedWarehouse) {
        return false;
      }
      if (appliedStatus !== 'All' && v.status !== appliedStatus) {
        return false;
      }
      if (appliedProduct !== 'All' && v.product !== appliedProduct) {
        return false;
      }
      if (appliedGrade !== 'All' && v.grade !== appliedGrade) {
        return false;
      }
      if (appliedVerifier !== 'All' && !v.countedBy.includes(appliedVerifier)) {
        return false;
      }
      return true;
    });
  }, [
    searchQuery,
    appliedWarehouse,
    appliedStatus,
    appliedProduct,
    appliedGrade,
    appliedVerifier,
  ]);

  // ═════════════════════════════════════════════════════════════════════════════
  // VIEW: VERIFICATION DETAILS DRILLDOWN (Screenshot 1 Right)
  // ═════════════════════════════════════════════════════════════════════════════
  if (selectedVerification) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Top Orange Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => setSelectedVerification(null)}
              activeOpacity={0.8}
            >
              <BackArrowWhiteIcon />
              <Text style={styles.headerTitle}>Verification {selectedVerification.verificationId}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Card Title */}
          <Text style={styles.detailsCardTitle}>
            Verification {selectedVerification.verificationId}
          </Text>

          {/* Details Table Card */}
          <View style={styles.detailsTableCard}>
            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Verification</Text>
              <Text style={styles.detailTableValBold}>{selectedVerification.verificationId}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Warehouse</Text>
              <Text style={styles.detailTableValBold}>{selectedVerification.warehouseFull}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Date and type</Text>
              <Text style={styles.detailTableValBold}>
                {selectedVerification.date} · {selectedVerification.type}
              </Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Product, grade, batch</Text>
              <Text style={styles.detailTableValBold}>
                {selectedVerification.product} · {selectedVerification.grade} · {selectedVerification.batchId}
              </Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>System quantity at start</Text>
              <Text style={styles.detailTableValBold}>{selectedVerification.systemQtyKg} kg</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Counted</Text>
              <Text style={styles.detailTableValBold}>{selectedVerification.countedQtyKg} kg</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Variance</Text>
              <Text style={styles.detailTableValBold}>{selectedVerification.varianceKg} kg</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Result</Text>
              <Text style={styles.detailTableValBold}>{selectedVerification.status}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Reason code</Text>
              <Text style={styles.detailTableValBold}>{selectedVerification.reasonCode}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Notes</Text>
              <Text style={styles.detailTableValBold}>{selectedVerification.notes}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Evidence</Text>
              <Text style={styles.detailTableValBold}>{selectedVerification.evidence}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Counted by</Text>
              <Text style={styles.detailTableValBold}>{selectedVerification.countedBy}</Text>
            </View>
            <View style={styles.tableDivider} />

            <View style={styles.detailTableRow}>
              <Text style={styles.detailTableLabel}>Linked adjustment</Text>
              <Text style={styles.detailTableValBold}>{selectedVerification.linkedAdjustment}</Text>
            </View>
          </View>

          {/* History Section (Matching Screenshot 1 Right) */}
          <Text style={[styles.detailsCardTitle, { marginTop: adminSpacing.xl }]}>
            History
          </Text>

          <View style={styles.historyCard}>
            <Text style={styles.historyMetaLine}>
              {selectedVerification.historyDate} · {selectedVerification.historyActor}
            </Text>
            <Text style={styles.historyNoteBold}>
              {selectedVerification.historyNote}
            </Text>
          </View>

          <View style={{ height: adminSpacing.xxxl }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // MAIN VIEW: VERIFICATIONS LIST (Screenshot 1 Left)
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.8}>
            <BackArrowWhiteIcon />
            <Text style={styles.headerTitle}>Stock Verification</Text>
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

        {/* Count Label */}
        <Text style={styles.recordsCountLabel}>
          {filteredVerifications.length} of {INITIAL_VERIFICATIONS.length} verifications
        </Text>

        {/* Verifications List Cards */}
        {filteredVerifications.map((item) => (
          <View key={item.id} style={styles.verificationCard}>
            <Text style={styles.verificationCardTitle}>{item.verificationId}</Text>
            <Text style={styles.verInfoLine}>
              {item.warehouseCity} · {item.date} · {item.type}
            </Text>
            <Text style={styles.verInfoLine}>
              {item.product} · {item.grade} · batch {item.batchId}
            </Text>
            <Text style={styles.verInfoLine}>
              System {item.systemQtyKg} kg · Counted {item.countedQtyKg} kg · Variance{' '}
              <Text style={styles.varianceBold}>{item.varianceKg} kg</Text>
            </Text>
            <Text style={styles.verInfoLine}>
              Created by {item.countedBy.split(',')[0]} · Verified by {item.verifiedBy}
            </Text>
            <Text style={styles.verInfoLine}>
              Adjustment {item.linkedAdjustment}
            </Text>

            {/* Action Link: View Verification */}
            <TouchableOpacity
              style={styles.cardActionBtn}
              onPress={() => setSelectedVerification(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionLinkText}>View Verification</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>

      {/* ═════════════════════════════════════════════════════════════════════════
          FILTERS MODAL (Matching Screenshot 2, 3, 4, 5)
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
              {/* 1. Warehouse Dropdown */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Warehouse</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    whDropdownOpen && styles.dropdownTriggerActive,
                  ]}
                  onPress={() => {
                    closeAllDropdowns();
                    setWhDropdownOpen((prev) => !prev);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownTriggerText}>{draftWarehouse}</Text>
                  {whDropdownOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                </TouchableOpacity>

                {whDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {(
                      [
                        'All',
                        'Ooty',
                        'Coonoor',
                        'Kotagiri',
                        'Gudalur Market',
                      ] as VerificationWarehouseFilter[]
                    ).map((wh) => {
                      const isSelected = draftWarehouse === wh;
                      return (
                        <TouchableOpacity
                          key={wh}
                          style={[
                            styles.dropdownOption,
                            isSelected && styles.dropdownOptionSelected,
                          ]}
                          onPress={() => {
                            setDraftWarehouse(wh);
                            setWhDropdownOpen(false);
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

              {/* 2. On or after Input Field */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>On or after</Text>
                <View style={styles.dateInputContainer}>
                  <TextInput
                    style={styles.dateTextInput}
                    placeholder="dd-mm-yyyy"
                    placeholderTextColor={adminColors.placeholder}
                    value={draftDate}
                    onChangeText={setDraftDate}
                  />
                  <CalendarIcon size={18} color={adminColors.muted} />
                </View>
              </View>

              {/* 3. Status Dropdown (Matching Screenshot 3) */}
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
                        'Matched',
                        'Variance identified',
                        'Submitted for review',
                        'Adjustment pending approval',
                        'Closed',
                      ] as VerificationStatusFilter[]
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

              {/* 4. Product Dropdown (Matching Screenshot 4) */}
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
                        'Cabbage',
                        'Potato',
                        'Carrot',
                        'Beans',
                      ] as VerificationProductFilter[]
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

              {/* 5. Grade Dropdown (Matching User Specification: Grade 1, Grade 2, Grade 3) */}
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
                      ['All', 'Grade 1', 'Grade 2', 'Grade 3'] as VerificationGradeFilter[]
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

              {/* 6. Verifier Dropdown (Matching Screenshot 5) */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Verifier</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownTrigger,
                    verifierDropdownOpen && styles.dropdownTriggerActive,
                  ]}
                  onPress={() => {
                    closeAllDropdowns();
                    setVerifierDropdownOpen((prev) => !prev);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dropdownTriggerText}>{draftVerifier}</Text>
                  {verifierDropdownOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                </TouchableOpacity>

                {verifierDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {(
                      [
                        'All',
                        'Demo Sub Warehouse Admin',
                        'Demo Main Warehouse Admin',
                        'Demo Sub Warehouse Admin (Gudalur)',
                        'Demo Sub Warehouse Admin (Kotagiri)',
                      ] as VerificationVerifierFilter[]
                    ).map((verifier) => {
                      const isSelected = draftVerifier === verifier;
                      return (
                        <TouchableOpacity
                          key={verifier}
                          style={[
                            styles.dropdownOption,
                            isSelected && styles.dropdownOptionSelected,
                          ]}
                          onPress={() => {
                            setDraftVerifier(verifier);
                            setVerifierDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              isSelected && styles.dropdownOptionTextSelected,
                            ]}
                          >
                            {verifier}
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

  recordsCountLabel: {
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
    marginTop: 2,
  },

  // ── Verification List Cards (Screenshot 1 Left) ──
  verificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0ECE6',
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  verificationCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  verInfoLine: {
    fontSize: 12,
    color: '#4A443F',
    lineHeight: 18,
    marginBottom: 2,
  },
  varianceBold: {
    fontWeight: '700',
    color: '#1A1412',
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

  // ── Verification Details Drilldown Styles (Screenshot 1 Right) ──
  detailsCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A3525',
    marginBottom: 10,
  },
  detailsTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0ECE6',
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
    color: adminColors.muted,
    flex: 1,
  },
  detailTableValBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1412',
    textAlign: 'right',
    flex: 1.3,
  },
  tableDivider: {
    height: 1,
    backgroundColor: '#F4EFEA',
  },

  // ── History Section ──
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0ECE6',
    padding: 16,
    ...adminShadow.sm,
  },
  historyMetaLine: {
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 4,
  },
  historyNoteBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1412',
    lineHeight: 18,
  },

  // ── Filters Modal (Screenshots 2, 3, 4, 5) ──
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
});
