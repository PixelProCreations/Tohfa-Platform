// Design id: M3S06
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import type { InventoryScreenBaseProps } from './types';
import { WarehouseSelector } from './WarehouseSelector';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';

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

// ─── Custom Icons matching Design Mockup ─────────────────────────────────────

function StockTabBoxIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v2A1.5 1.5 0 0 1 17.5 8h-11A1.5 1.5 0 0 1 5 6.5v-2z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M5.5 8h13a1 1 0 0 1 1 1v10.5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4.5 19.5V9a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M9.5 13.5h5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LedgerTabIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3.5l2 1.5 2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 1.5V20.5H6V3.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 9h6M9 12.5h6M9 16h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function AllocationTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M12 2v20" stroke={color} strokeWidth="1.8" />
      <Path d="M12 12h10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function VerifyTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5v15a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M7 6.5h4.5v4.5H7z" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 8.8l1 1 2-2" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 7.5h2.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M14 10h2.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M7 14.5h10" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path d="M7 17.5h6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

function DownArrowGreenIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v16M5 13l7 7 7-7" stroke={adminColors.success.text} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UpArrowRedIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 20V4M5 11l7-7 7 7" stroke={adminColors.danger.text} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BranchArrowIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3v12a3 3 0 0 0 3 3h12M17 14l4 4-4 4" stroke={adminColors.brandDeep} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockSmallIcon({ color = adminColors.brandDeep }: { color?: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" stroke={color} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
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
  // rbac: stock_ledger.view_all MAIN=all, SUB=none. With it the ledger spans
  // warehouses (selector + cross-warehouse batch list, from the absorbed Main
  // screen); without it the ledger is forced to scope.warehouseId (view_own).
  const canViewAll = can('inventory.stock_ledger.view_all');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(
    canViewAll ? undefined : scope.warehouseId,
  );
  // 'Verify / Adjust a Batch': stock_adjustment.create MAIN=all, SUB=own.
  const canAdjust = can('inventory.stock_adjustment.create');
  const firstBatch = batches[0];

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.container}>
        <SWAHeader 
          title="Stock Ledger"
          onBack={onBack}
          showFilter={true}
          onFilterPress={() => onNavigate?.('M3S16')}
          showWarehouse={!canViewAll}
          warehouseName={scope.warehouseName}
          bottomContent={
            canViewAll ? (
              <WarehouseSelector
                scope={{}}
                options={warehouseOptions}
                selectedId={selectedWarehouseId}
                onSelect={setSelectedWarehouseId}
              />
            ) : null
          }
        />

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
            <StockTabBoxIcon color={activeTab === 'Stock' ? adminColors.onBrand : adminColors.ink} />
            <Text style={[styles.tabCardText, activeTab === 'Stock' && styles.activeTabCardText]}>Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabCard, activeTab === 'Ledger' && styles.activeTabCard]}
            onPress={() => setActiveTab('Ledger')}
            activeOpacity={0.7}
          >
            <LedgerTabIcon color={activeTab === 'Ledger' ? adminColors.onBrand : adminColors.ink} />
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
            <AllocationTabIcon color={activeTab === 'Allocation' ? adminColors.onBrand : adminColors.ink} />
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
            <VerifyTabIcon color={activeTab === 'Verify' ? adminColors.onBrand : adminColors.ink} />
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
                <LockSmallIcon />
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

          {canAdjust && firstBatch ? (
            <TouchableOpacity
              style={styles.adjustBtn}
              activeOpacity={0.8}
              onPress={() =>
                onNavigate?.('M3S11', {
                  produceName: firstBatch.name,
                  batchId: firstBatch.batchId,
                  zone: firstBatch.zone,
                  systemCount: firstBatch.quantityKg,
                })
              }
            >
              <Text style={styles.adjustBtnText}>Verify / Adjust a Batch</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  adjustBtn: {
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    paddingVertical: adminSpacing.md,
    marginHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xl,
    alignItems: 'center',
  },
  adjustBtnText: { ...adminType.sectionHead, color: adminColors.ink },
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand, // status bar blends with header
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  warehousePillRow: {
    paddingTop: 10,
    paddingBottom: 2,
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandDeep,
    borderWidth: 1.5,
    borderColor: adminColors.onBrand,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehousePillText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  tabCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  tabCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  activeTabCard: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  tabCardText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  activeTabCardText: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  ledgerCard: {
    backgroundColor: adminColors.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptTypeText: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
  },
  receiptQuantityText: {
    ...adminType.sectionHead,
    color: adminColors.success.text,
  },
  dispatchTypeText: {
    ...adminType.rowTitle,
    color: adminColors.danger.text,
  },
  dispatchQuantityText: {
    ...adminType.sectionHead,
    color: adminColors.danger.text,
  },
  allocationTypeText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  neutralQuantityText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  productTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  metaLabelText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  metaValueText: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  timeText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  loadMoreRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 16,
  },
  loadMoreText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
});
