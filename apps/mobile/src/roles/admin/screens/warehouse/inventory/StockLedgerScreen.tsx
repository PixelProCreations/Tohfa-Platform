// Design id: M3S06
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import type { InventoryScreenBaseProps } from './types';
import { WarehouseSelector } from './WarehouseSelector';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

/** One batch row of the cross-warehouse batch list (absorbed Main StockLedgerScreen). */
export interface StockBatchItem {
  id: string;
  name: string;
  quantityKg: number;
  batchId: string;
  zone: string;
  receivedDate: string;
  warehouseName?: string | undefined;
}

const SAMPLE_BATCHES: StockBatchItem[] = [
  { id: '1', name: 'Carrots', quantityKg: 240, batchId: 'BT-4471', zone: 'Zone A-2', receivedDate: 'Received Sep 9' },
  { id: '2', name: 'Cabbage', quantityKg: 180, batchId: 'BT-4460', zone: 'Zone B-1', receivedDate: 'Received Sep 7' },
  { id: '3', name: 'Beetroot', quantityKg: 95, batchId: 'BT-4452', zone: 'Zone A-3', receivedDate: 'Received Sep 5' },
];

export interface StockLedgerScreenProps extends InventoryScreenBaseProps {
  /** Batches for the all-warehouses view; defaults to the design sample. */
  batches?: readonly StockBatchItem[] | undefined;
}

// ─── Custom Icons matching Reference Mockup Exactly ─────────────────────────

function BackArrowIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function FilterSlidersIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 7h18M16 4.5v5M3 12h18M8 9.5v5M3 17h18M14 14.5v5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockSmallIcon({ size = 13, color = '#78350F' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth="2.2"
      />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function StockTabBoxIcon({ color = '#18181B' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v1.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1.5z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M5 9v9.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V9"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M10 13.5h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function LedgerTabIcon({ color = '#FFFFFF' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 4.5l2 1.5 2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 1.5V20H6V4.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9.5 10.5h5M9.5 14h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function AllocationTabIcon({ color = '#18181B' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z" stroke={color} strokeWidth="1.8" />
      <Path d="M12 2v20" stroke={color} strokeWidth="1.8" />
      <Path d="M12 12h10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function VerifyTabIcon({ color = '#5C6B62' }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M7 8.5h3.5M7 12h3.5M7 15.5h3.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path
        d="M12.5 12l1.8 1.8 3.5-3.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DownArrowGreenIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v16M5 13l7 7 7-7" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UpArrowRedIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20V4M5 11l7-7 7 7" stroke="#EF4444" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BranchArrowIcon({ color = '#854F0B' }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M6 18l5-5M11 13l6-6M17 7h-5M17 7v5M11 13h6M17 13l-3-3" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReservationLockClockIcon({ color = '#854F0B' }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M5 11h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="17.5" cy="17.5" r="4.5" fill="#FAF7F2" stroke={color} strokeWidth="1.6" />
      <Path d="M17.5 15.5v2h1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function StockLedgerScreen({
  scope,
  can,
  onNavigate,
  onBack,
  warehouseOptions,
  batches = SAMPLE_BATCHES,
}: StockLedgerScreenProps) {
  const [activeTab, setActiveTab] = useState<'Stock' | 'Ledger' | 'Allocation' | 'Verify'>('Ledger');
  // rbac: stock_ledger.view_all MAIN=all, SUB=none.
  const canViewAll = can('inventory.stock_ledger.view_all');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(
    canViewAll ? undefined : scope.warehouseId,
  );
  const canAdjust = can('inventory.stock_adjustment.create');

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />

      {/* Top SafeArea for Header */}
      <SafeAreaView style={styles.topSafeArea}>
        <View style={styles.header}>
          {/* Top Row: Back Arrow + Title + Filter Button */}
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              {onBack && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={onBack}
                  activeOpacity={0.7}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityLabel="Back"
                >
                  <BackArrowIcon size={22} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              <Text style={styles.headerTitle} numberOfLines={1}>Stock Ledger</Text>
            </View>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => onNavigate?.('M3S16')}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Filter"
            >
              <FilterSlidersIcon size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Warehouse Pill Row inside Header */}
          {!canViewAll && scope.warehouseName ? (
            <View style={styles.warehousePill}>
              <LockSmallIcon size={13} color="#78350F" />
              <Text style={styles.warehousePillText}>{scope.warehouseName}</Text>
            </View>
          ) : null}

          {canViewAll ? (
            <View style={{ marginTop: 10 }}>
              <WarehouseSelector
                scope={{}}
                options={warehouseOptions}
                selectedId={selectedWarehouseId}
                onSelect={setSelectedWarehouseId}
              />
            </View>
          ) : null}
        </View>
      </SafeAreaView>

      <View style={styles.container}>
        {/* 4 Tab Cards matching reference */}
        <View style={styles.tabCardsRow}>
          <TouchableOpacity
            style={[styles.tabCard, activeTab === 'Stock' && styles.activeTabCard]}
            onPress={() => {
              setActiveTab('Stock');
              onNavigate?.('M3S02');
            }}
            activeOpacity={0.7}
          >
            <StockTabBoxIcon color={activeTab === 'Stock' ? '#FFFFFF' : '#5C6B62'} />
            <Text style={[styles.tabCardText, activeTab === 'Stock' && styles.activeTabCardText]}>Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabCard, activeTab === 'Ledger' && styles.activeTabCard]}
            onPress={() => setActiveTab('Ledger')}
            activeOpacity={0.7}
          >
            <LedgerTabIcon color={activeTab === 'Ledger' ? '#FFFFFF' : '#5C6B62'} />
            <Text style={[styles.tabCardText, activeTab === 'Ledger' && styles.activeTabCardText]}>Ledger</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabCard, activeTab === 'Allocation' && styles.activeTabCard]}
            onPress={() => {
              setActiveTab('Allocation');
              onNavigate?.('M3S07');
            }}
            activeOpacity={0.7}
          >
            <AllocationTabIcon color={activeTab === 'Allocation' ? '#FFFFFF' : '#5C6B62'} />
            <Text style={[styles.tabCardText, activeTab === 'Allocation' && styles.activeTabCardText]}>Allocation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabCard, activeTab === 'Verify' && styles.activeTabCard]}
            onPress={() => {
              setActiveTab('Verify');
              onNavigate?.('M3S10');
            }}
            activeOpacity={0.7}
          >
            <VerifyTabIcon color={activeTab === 'Verify' ? '#FFFFFF' : '#5C6B62'} />
            <Text style={[styles.tabCardText, activeTab === 'Verify' && styles.activeTabCardText]}>Verify</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Card 1: RECEIPT */}
          <TouchableOpacity
            style={styles.ledgerCard}
            onPress={() => onNavigate?.('M3S15')}
            activeOpacity={0.7}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.typeWithIconRow}>
                <DownArrowGreenIcon />
                <Text style={styles.receiptTypeText}>RECEIPT</Text>
              </View>
              <Text style={styles.receiptQuantityText}>+100 KG</Text>
            </View>

            <Text style={styles.productTitle}>Tomato · Grade 1</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabelText}>Batch <Text style={styles.metaValueText}>BAT-2026-00124</Text></Text>
              <Text style={styles.timeText}>24 Sep · 10:54 AM</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabelText}>Ref <Text style={styles.metaValueText}>GR-1024</Text></Text>
              <Text style={styles.metaLabelText}>Balance <Text style={styles.metaValueText}>100 KG</Text></Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: DISPATCH */}
          <TouchableOpacity
            style={styles.ledgerCard}
            onPress={() => onNavigate?.('M3S15')}
            activeOpacity={0.7}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.typeWithIconRow}>
                <UpArrowRedIcon />
                <Text style={styles.dispatchTypeText}>DISPATCH</Text>
              </View>
              <Text style={styles.dispatchQuantityText}>-20 KG</Text>
            </View>

            <Text style={styles.productTitle}>Tomato · Grade 1</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabelText}>Order <Text style={styles.metaValueText}>ORD-10242</Text></Text>
              <Text style={styles.timeText}>24 Sep · 02:30 PM</Text>
            </View>

            <View style={[styles.metaRow, { justifyContent: 'flex-end' }]}>
              <Text style={styles.metaLabelText}>Balance <Text style={styles.metaValueText}>80 KG</Text></Text>
            </View>
          </TouchableOpacity>

          {/* Card 3: ALLOCATION_ONLINE */}
          <TouchableOpacity
            style={styles.ledgerCard}
            onPress={() => onNavigate?.('M3S15')}
            activeOpacity={0.7}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.typeWithIconRow}>
                <BranchArrowIcon />
                <Text style={styles.allocationTypeText}>ALLOCATION_ONLINE</Text>
              </View>
              <Text style={styles.neutralQuantityText}>20 KG</Text>
            </View>

            <Text style={styles.productTitle}>Tomato · Grade 1</Text>

            <View style={[styles.metaRow, { justifyContent: 'flex-end', marginTop: 4 }]}>
              <Text style={styles.timeText}>24 Sep · 02:32 PM</Text>
            </View>
          </TouchableOpacity>

          {/* Card 4: RESERVATION_HOLD */}
          <TouchableOpacity
            style={styles.ledgerCard}
            onPress={() => onNavigate?.('M3S15')}
            activeOpacity={0.7}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.typeWithIconRow}>
                <ReservationLockClockIcon />
                <Text style={styles.allocationTypeText}>RESERVATION_HOLD</Text>
              </View>
              <Text style={styles.neutralQuantityText}>10 KG</Text>
            </View>

            <Text style={styles.productTitle}>Tomato · Grade 1</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabelText}>Order <Text style={styles.metaValueText}>ORD-10245</Text></Text>
              <Text style={styles.timeText}>24 Sep · 03:10 PM</Text>
            </View>
          </TouchableOpacity>

          {/* Load Earlier Movements */}
          <TouchableOpacity style={styles.loadMoreRow} activeOpacity={0.7}>
            <Text style={styles.loadMoreText}>Load earlier movements ↓</Text>
          </TouchableOpacity>

          {/* Batches across warehouses (absorbed Main StockLedgerScreen) */}
          {canViewAll ? (
            <>
              <Text style={styles.batchSectionTitle}>Batches across warehouses</Text>
              {batches.map((item) => (
                <View key={item.id} style={styles.batchCard}>
                  <View style={styles.batchRow}>
                    <Text style={styles.batchName}>{item.name}</Text>
                    <Text style={styles.batchName}>{item.quantityKg} kg</Text>
                  </View>
                  <View style={styles.batchRow}>
                    <Text style={styles.batchMeta}>
                      Batch {item.batchId} · {item.zone}
                      {item.warehouseName ? ` · ${item.warehouseName}` : ''}
                    </Text>
                    <Text style={styles.batchMeta}>{item.receivedDate}</Text>
                  </View>
                </View>
              ))}
            </>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0562A',
  },
  topSafeArea: {
    backgroundColor: '#F0562A',
  },
  header: {
    backgroundColor: '#F0562A',
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  backButton: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  filterButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FCEFE3',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
    gap: 6,
  },
  warehousePillText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: '#78350F',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  tabCardsRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    gap: 10,
  },
  tabCard: {
    flex: 1,
    height: 74,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  activeTabCard: {
    backgroundColor: '#F0562A',
    borderColor: '#F0562A',
  },
  tabCardText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: '#5C6B62',
  },
  activeTabCardText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  ledgerCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAE6DF',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptTypeText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  receiptQuantityText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  dispatchTypeText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  dispatchQuantityText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: '#EF4444',
  },
  allocationTypeText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '800',
    color: '#854F0B',
    letterSpacing: 0.5,
  },
  neutralQuantityText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
  },
  productTitle: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: '#18181B',
    marginTop: 6,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  metaLabelText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '500',
    color: '#4E5D56',
  },
  metaValueText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '800',
    color: '#18181B',
  },
  timeText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: '#71717A',
  },
  loadMoreRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    marginBottom: 20,
  },
  loadMoreText: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: '#854F0B',
  },
  batchSectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },
  batchCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginHorizontal: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
    gap: adminSpacing.xs,
  },
  batchRow: { flexDirection: 'row', justifyContent: 'space-between' },
  batchName: { ...adminType.rowTitle, color: adminColors.ink },
  batchMeta: { ...adminType.rowMeta, color: adminColors.muted },
});
