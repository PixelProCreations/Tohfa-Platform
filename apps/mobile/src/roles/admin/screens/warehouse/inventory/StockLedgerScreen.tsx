// Design id: M3S06
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, RefreshControl } from 'react-native';
import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { isAreaAvailable } from '../availability';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import type { BatchRow, InventoryLiveStateProps, InventoryScreenBaseProps, StockMovementRow } from './types';
import { movementRouteParams } from './movementDetailMappers';
import { WarehouseSelector } from './WarehouseSelector';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';

export interface StockLedgerScreenProps extends InventoryScreenBaseProps, InventoryLiveStateProps {
  /** Ledger rows, newest first (GET /admin/stock-ledger), page by page. */
  movements?: readonly StockMovementRow[] | undefined;
  /** The warehouse's batches: the all-warehouses batch list (view_all) reads them. */
  batches?: readonly BatchRow[] | undefined;
  onLoadMore?: (() => void) | undefined;
  hasMore?: boolean | undefined;
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
  selectedWarehouseId,
  onSelectWarehouse,
  movements = [],
  batches = [],
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onLoadMore,
  hasMore = false,
}: StockLedgerScreenProps) {
  const [activeTab, setActiveTab] = useState<'Stock' | 'Ledger' | 'Allocation' | 'Verify'>('Ledger');
  // rbac: stock_ledger.view_all MAIN=all, SUB=none. With it the ledger spans
  // warehouses (selector + cross-warehouse batch list, from the absorbed Main
  // screen); without it the flow pins every request to scope.warehouseId (view_own).
  const canViewAll = can('inventory.stock_ledger.view_all');
  // Stock counts (BR-107) are shown only with inventory.stock_verification.perform
  // (availability.ts); a count is started from the Verify tab or Batch Detail.
  const canVerify = isAreaAvailable('stockCounts', can);
  const view = queryViewState({ isLoading, error, itemCount: movements.length });
  const activeBatches = batches.filter((batch) => batch.status === 'active');

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.container}>
        <SWAHeader 
          title="Stock Ledger"
          onBack={onBack}
          showWarehouse={!canViewAll}
          warehouseName={scope.warehouseName}
          bottomContent={
            canViewAll ? (
              <WarehouseSelector
                scope={{}}
                options={warehouseOptions}
                selectedId={selectedWarehouseId}
                onSelect={(id) => onSelectWarehouse?.(id)}
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

          {canVerify ? (
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
          ) : null}
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={[adminColors.brand]}
                tintColor={adminColors.brand}
              />
            ) : undefined
          }
        >
          {view === 'loading' ? <AdminLoadingState /> : null}
          {view === 'error' ? <AdminErrorState error={error} onRetry={onRetry} /> : null}
          {view === 'empty' ? <AdminEmptyState title={t('inventory.empty.ledger')} /> : null}

          {/* One card per ledger row. The tone follows the delta's own sign (BR-37).
              A row opens Movement Detail (M3S15) with the row itself: there is
              no per-id ledger read to fetch it again. */}
          {movements.map((movement) => (
            <TouchableOpacity
              key={movement.id}
              style={styles.ledgerCard}
              onPress={() => onNavigate?.('M3S15', movementRouteParams(movement))}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('inventory.ledger.openMovement')}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.typeWithIconRow}>
                  {movement.kind === 'reservation' ? (
                    <LockSmallIcon />
                  ) : movement.direction === 'in' ? (
                    <DownArrowGreenIcon />
                  ) : movement.direction === 'out' ? (
                    <UpArrowRedIcon />
                  ) : (
                    <BranchArrowIcon />
                  )}
                  <Text
                    style={
                      movement.direction === 'in'
                        ? styles.receiptTypeText
                        : movement.direction === 'out'
                          ? styles.dispatchTypeText
                          : styles.allocationTypeText
                    }
                  >
                    {movement.typeLabel}
                  </Text>
                </View>
                <Text
                  style={
                    movement.direction === 'in'
                      ? styles.receiptQuantityText
                      : movement.direction === 'out'
                        ? styles.dispatchQuantityText
                        : styles.neutralQuantityText
                  }
                >
                  {movement.deltaText}
                </Text>
              </View>

              {movement.productLabel === undefined ? null : (
                <Text style={styles.productTitle}>{movement.productLabel}</Text>
              )}

              <View style={styles.metaRow}>
                {movement.batchCode === undefined ? (
                  <View />
                ) : (
                  <Text style={styles.metaLabelText}>
                    {t('inventory.ledger.batch')} <Text style={styles.metaValueText}>{movement.batchCode}</Text>
                  </Text>
                )}
                <Text style={styles.timeText}>{movement.performedAt}</Text>
              </View>

              {movement.balanceText === '' ? null : (
                <View style={[styles.metaRow, styles.metaRowEnd]}>
                  <Text style={styles.metaLabelText}>
                    {t('inventory.ledger.balance')} <Text style={styles.metaValueText}>{movement.balanceText}</Text>
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* Load Earlier Movements */}
          {hasMore ? (
            <TouchableOpacity style={styles.loadMoreRow} activeOpacity={0.7} onPress={onLoadMore}>
              <Text style={styles.loadMoreText}>Load earlier movements ↓</Text>
            </TouchableOpacity>
          ) : null}

          {/* Batches across warehouses (absorbed Main StockLedgerScreen) */}
          {canViewAll && activeBatches.length > 0 ? (
            <>
              <Text style={styles.batchSectionTitle}>Batches across warehouses</Text>
              {activeBatches.map((item) => (
                <View key={item.id} style={styles.batchCard}>
                  <View style={styles.batchRow}>
                    <Text style={styles.batchName}>{item.productName}</Text>
                    <Text style={styles.batchName}>
                      {item.availableGrams === null ? t('inventory.noValue') : formatKg(item.availableGrams)}
                    </Text>
                  </View>
                  <View style={styles.batchRow}>
                    <Text style={styles.batchMeta}>
                      Batch {item.batchCode}
                      {item.storageLocation === null ? '' : ` · ${item.storageLocation}`}
                    </Text>
                    <Text style={styles.batchMeta}>
                      {item.receivedOn === '' ? '' : t('inventory.batch.receivedOn', { date: item.receivedOn })}
                    </Text>
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
  metaRowEnd: { justifyContent: 'flex-end' },
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand, // status bar blends with header
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
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
