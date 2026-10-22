import React, { useMemo, useState } from 'react';
import {
  Alert,
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
} from '../../theme';

export interface AdminOperationsOverviewScreenProps {
  onBack?: () => void;
  onExportReports?: () => void;
  onNavigateToStockLedger?: () => void;
  onNavigateToStockVerification?: () => void;
  onNavigateToTransfers?: () => void;
  onNotifications?: () => void;
  onPlusAction?: () => void;
  onSelectWarehouse?: (warehouseId: string) => void;
}

// ─── Header & Section Icons ──────────────────────────────────────────────────

function WarehouseHeaderIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 21V13.5h7V21"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="9.8" y="17" width="2" height="2" rx="0.3" fill={color} />
      <Rect x="12.2" y="17" width="2" height="2" rx="0.3" fill={color} />
      <Rect x="11" y="14.5" width="2" height="2" rx="0.3" fill={color} />
    </Svg>
  );
}

function PlusHeaderIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function BellHeaderIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 15V10a6 6 0 0 0-12 0v5l-2 3h16l-2-3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 18v1a2 2 0 0 0 4 0v-1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchGrayIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="6.5" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="16" x2="21" y2="21" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersOrangeIcon({ size = 18, color = '#D97736' }: { size?: number; color?: string }) {
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

function StockLedgerBoxIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top lid wider than box */}
      <Rect x="4" y="4.5" width="16" height="4.5" rx="1.2" stroke={color} strokeWidth="2" fill="none" />
      {/* Box body */}
      <Rect x="5" y="9" width="14" height="11" rx="1.2" stroke={color} strokeWidth="2" fill="none" />
      {/* Center slot handle */}
      <Line x1="10" y1="13" x2="14" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StockVerificationCheckIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Outer rounded card */}
      <Rect x="3.5" y="4" width="17" height="15.5" rx="2.5" stroke={color} strokeWidth="1.8" fill="none" />
      {/* 2 checklist lines on left */}
      <Line x1="6.5" y1="9" x2="10" y2="9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="6.5" y1="13.5" x2="10" y2="13.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Checkmark on right */}
      <Path
        d="M13 11.5L15 13.5L18.8 9.2"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InterWarehouseArrowsIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top arrow pointing right */}
      <Line x1="7" y1="8.5" x2="17" y2="8.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path
        d="M13.5 5.2L17 8.5L13.5 11.8"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom arrow pointing left */}
      <Line x1="17" y1="15.5" x2="7" y2="15.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path
        d="M10.5 12.2L7 15.5L10.5 18.8"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminOperationsOverviewScreen({
  onNavigateToStockLedger,
  onNavigateToStockVerification,
  onNavigateToTransfers,
  onNotifications,
  onPlusAction,
  onSelectWarehouse,
}: AdminOperationsOverviewScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('All Warehouses');
  const [draftWarehouseFilter, setDraftWarehouseFilter] = useState('All Warehouses');

  // Warehouse items fixture in state for interactive actions
  const [warehouseList, setWarehouseList] = useState([
    {
      id: 'wh-ooty',
      title: 'Ooty (WH-MAIN)',
      status: 'Active' as 'Active' | 'Pending',
      failedLoad: false,
      line1: 'Capacity/utilization 50,000 kg · 42% · Products 5 · Batches 4',
      line2: 'Available 1,980 kg · Pending receipts 1 · Transfers 1',
      line3: 'Open discrepancies 0 · Updated 13 Oct 2026, 09:00',
    },
    {
      id: 'wh-coonoor',
      title: 'Coonoor (WH-SUB1)',
      status: 'Active' as 'Active' | 'Pending',
      failedLoad: false,
      line1: 'Capacity/utilization 40,000 kg · 38% · Products 4 · Batches 3',
      line2: 'Available 1,520 kg · Pending receipts 1 · Transfers 0',
      line3: 'Open discrepancies 1 · Updated 13 Oct 2026, 09:00',
    },
    {
      id: 'wh-kotagiri',
      title: 'Kotagiri (WH-SUB2)',
      status: 'Pending' as 'Active' | 'Pending',
      failedLoad: true,
      line1: 'Capacity/utilization: failed to load',
      line2: 'Products 0 · Batches 0 · Available 0 kg',
      line3: 'Pending receipts 0 · Transfers 0 · Open discrepancies 0',
    },
    {
      id: 'wh-gudalur',
      title: 'Gudalur Market (WH-SUB3)',
      status: 'Active' as 'Active' | 'Pending',
      failedLoad: false,
      line1: 'Capacity/utilization 20,000 kg · 28% · Products 2 · Batches 2',
      line2: 'Available 550 kg · Pending receipts 0 · Transfers 0',
      line3: 'Open discrepancies 0 · Updated 12 Oct 2026, 18:00',
    },
  ]);

  const handleActivateKotagiri = () => {
    setWarehouseList((prev) =>
      prev.map((w) =>
        w.id === 'wh-kotagiri'
          ? {
              ...w,
              status: 'Active' as const,
              failedLoad: false,
              line1: 'Capacity/utilization 35,000 kg · 30% · Products 3 · Batches 2',
              line2: 'Available 1,100 kg · Pending receipts 0 · Transfers 0',
              line3: 'Open discrepancies 0 · Updated Just now',
            }
          : w
      )
    );
    Alert.alert(
      'Warehouse Activated',
      'Kotagiri (WH-SUB2) has been activated successfully and is now operational.'
    );
  };

  const handleCancelKotagiri = () => {
    Alert.alert('Action Cancelled', 'No changes made to Kotagiri warehouse status.');
  };

  const filteredWarehouses = useMemo(() => {
    let list = warehouseList;
    if (selectedWarehouseFilter !== 'All Warehouses') {
      list = list.filter((w) => w.title === selectedWarehouseFilter);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        w.line1.toLowerCase().includes(q) ||
        w.line2.toLowerCase().includes(q)
    );
  }, [searchQuery, warehouseList, selectedWarehouseFilter]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Header Banner (Exact match to Images 1 & 3) ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          {/* Left: Building icon + Inventory & Warehouse title */}
          <View style={styles.headerLeftGroup}>
            <WarehouseHeaderIcon size={24} color={adminColors.onBrand} />
            <Text style={styles.headerTitle}>Inventory & Warehouse</Text>
          </View>

          {/* Right: Plus Icon Button (Static as requested in Image 3) + Notification Bell */}
          <View style={styles.headerRightGroup}>
            <TouchableOpacity
              style={styles.headerCircleBtn}
              onPress={() => {
                if (onPlusAction) onPlusAction();
                else Alert.alert('Add', 'New warehouse or inventory transaction.');
              }}
              activeOpacity={0.8}
              accessibilityLabel="Add"
            >
              <PlusHeaderIcon size={18} color={adminColors.onBrand} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerCircleBtn}
              onPress={() => {
                if (onNotifications) onNotifications();
                else Alert.alert('Notifications', 'No new warehouse notifications.');
              }}
              activeOpacity={0.8}
              accessibilityLabel="Notifications"
            >
              <BellHeaderIcon size={18} color={adminColors.onBrand} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Search Bar with Filter Sliders Icon (Matching Image 1 & 3) ── */}
        <View style={styles.searchBarContainer}>
          <SearchGrayIcon size={18} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#9E9E9E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.searchFilterBtn}
            onPress={() => {
              setDraftWarehouseFilter(selectedWarehouseFilter);
              setShowFilterModal(true);
            }}
            activeOpacity={0.7}
            accessibilityLabel="Filter"
          >
            <FilterSlidersOrangeIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ── 6 Summary Metric Cards (Matching Images 1 & 3) ── */}
        <View style={styles.kpiGridContainer}>
          {/* Row 1 */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValueText}>4,810 kg</Text>
              <Text style={styles.kpiLabelText}>Total Available Stock</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValueText}>11</Text>
              <Text style={styles.kpiLabelText}>Inventory Batches</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiValueText, styles.kpiValueSmall]}>Not configured</Text>
              <Text style={styles.kpiLabelText}>Low-Stock Items</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValueText}>5</Text>
              <Text style={styles.kpiLabelText}>Pending Verification</Text>
            </View>
          </View>

          {/* Row 3 */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValueText}>2</Text>
              <Text style={styles.kpiLabelText}>Pending Transfer Receipts</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValueText}>1</Text>
              <Text style={styles.kpiLabelText}>Stock Discrepancies</Text>
            </View>
          </View>
        </View>

        {/* ── Warehouse comparison (Matching Images 1 & 3) ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Warehouse comparison</Text>

          {filteredWarehouses.map((wh) => (
            <TouchableOpacity
              key={wh.id}
              style={styles.warehouseCompareCard}
              onPress={() => onSelectWarehouse?.(wh.id)}
              activeOpacity={0.9}
            >
              <View style={styles.compareHeaderRow}>
                <Text style={styles.compareTitle}>{wh.title}</Text>
                <View
                  style={[
                    styles.badge,
                    wh.status === 'Active' ? styles.badgeActive : styles.badgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      wh.status === 'Active' ? styles.badgeActiveText : styles.badgePendingText,
                    ]}
                  >
                    {wh.status}
                  </Text>
                </View>
              </View>

              {wh.failedLoad ? (
                <>
                  <Text style={styles.compareFailedLine}>{wh.line1}</Text>
                  <Text style={styles.compareLine}>{wh.line2}</Text>
                  <Text style={styles.compareMetaLine}>{wh.line3}</Text>
                  <View style={styles.compareActionsRow}>
                    <TouchableOpacity
                      style={styles.activateWhBtn}
                      onPress={handleActivateKotagiri}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.activateWhBtnText}>Active warehouse</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelWhBtn}
                      onPress={handleCancelKotagiri}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelWhBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.compareLine}>{wh.line1}</Text>
                  <Text style={styles.compareLine}>{wh.line2}</Text>
                  <Text style={styles.compareMetaLine}>{wh.line3}</Text>
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Quick links (Matching Images 1 & 3) ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Quick links</Text>
          <View style={styles.quickLinksRow}>
            {/* Card 1: Stock Ledger & Batches */}
            <TouchableOpacity
              style={styles.quickLinkCard}
              onPress={onNavigateToStockLedger}
              activeOpacity={0.75}
            >
              <StockLedgerBoxIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickLinkLabel}>{'Stock Ledger &\nBatches'}</Text>
            </TouchableOpacity>

            {/* Card 2: Stock Verification */}
            <TouchableOpacity
              style={styles.quickLinkCard}
              onPress={() => {
                if (onNavigateToStockVerification) onNavigateToStockVerification();
                else Alert.alert('Stock Verification', 'Opening Stock Verification workflow.');
              }}
              activeOpacity={0.75}
            >
              <StockVerificationCheckIcon size={24} color={adminColors.brand} />
              <Text style={styles.quickLinkLabel}>{'Stock Verification'}</Text>
            </TouchableOpacity>

            {/* Card 3: Inter-Warehouse Transfers */}
            <TouchableOpacity
              style={styles.quickLinkCard}
              onPress={() => {
                if (onNavigateToTransfers) onNavigateToTransfers();
                else Alert.alert('Inter-Warehouse Transfers', 'Opening Transfers workflow.');
              }}
              activeOpacity={0.75}
            >
              <InterWarehouseArrowsIcon size={24} color={adminColors.brand} />
              <Text style={styles.quickLinkLabel}>{'Inter-Warehouse\nTransfers'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>

      {/* Filter Modal with Apply & Close buttons */}
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
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Filter Warehouses</Text>
            {[
              'All Warehouses',
              'Ooty (WH-MAIN)',
              'Coonoor (WH-SUB1)',
              'Kotagiri (WH-SUB2)',
              'Gudalur Market (WH-SUB3)',
            ].map((wh) => {
              const isSelected = draftWarehouseFilter === wh;
              return (
                <TouchableOpacity
                  key={wh}
                  style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                  onPress={() => setDraftWarehouseFilter(wh)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      isSelected && styles.modalOptionTextSelected,
                    ]}
                  >
                    {wh}
                  </Text>
                  {isSelected && (
                    <View style={styles.radioDotOuter}>
                      <View style={styles.radioDotInner} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Apply and Close buttons */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={() => {
                  setSelectedWarehouseFilter(draftWarehouseFilter);
                  setShowFilterModal(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalApplyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
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

  // ── Header Banner (Images 1 & 3) ──
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Scroll & Content ──
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 16,
    paddingBottom: adminSpacing.xxxl,
  },

  // ── Search Bar (Images 1 & 3) ──
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E1D7',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1412',
    marginLeft: 8,
    paddingVertical: 0,
  },
  searchFilterBtn: {
    padding: 6,
  },

  // ── 6 KPI Cards Grid (Images 1 & 3) ──
  kpiGridContainer: {
    marginBottom: 20,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#F0ECE6',
    ...adminShadow.sm,
  },
  kpiValueText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1412',
    marginBottom: 4,
  },
  kpiValueSmall: {
    fontSize: 15,
  },
  kpiLabelText: {
    fontSize: 12,
    color: '#707070',
    fontWeight: '500',
  },

  // ── Section Common ──
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7A3205',
    marginBottom: 12,
  },

  // ── Warehouse Comparison Cards (Images 1 & 3) ──
  warehouseCompareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0ECE6',
    marginBottom: 12,
    ...adminShadow.sm,
  },
  compareHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compareTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1412',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  badgeActive: {
    backgroundColor: '#E8F5E9',
  },
  badgeActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  badgePending: {
    backgroundColor: '#FFF3E0',
  },
  badgePendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B25E00',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  compareLine: {
    fontSize: 12,
    color: '#5C554F',
    lineHeight: 18,
    marginBottom: 2,
  },
  compareMetaLine: {
    fontSize: 12,
    color: adminColors.muted,
    lineHeight: 18,
    marginTop: 2,
  },
  compareFailedLine: {
    fontSize: 12,
    color: '#D32F2F',
    fontWeight: '600',
    marginBottom: 2,
  },
  compareActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  activateWhBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E1D7',
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activateWhBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A3205',
  },
  cancelWhBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E8E1D7',
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelWhBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7A3205',
  },

  // ── Quick Links (Images 1 & 3) ──
  quickLinksRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickLinkCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0ECE6',
    ...adminShadow.sm,
  },
  quickLinkLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1412',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 15,
  },

  // ── Modal Styles ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.xl,
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    ...adminShadow.lg,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1412',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE6',
  },
  modalOptionSelected: {
    backgroundColor: '#FFF8F2',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  modalOptionText: {
    fontSize: 14,
    color: '#1A1412',
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: adminColors.brand,
  },
  radioDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: adminColors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: adminColors.brand,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCloseBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0DAD5',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1412',
  },
  modalApplyBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  modalApplyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
