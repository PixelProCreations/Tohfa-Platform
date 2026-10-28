// Design id: M3S03
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { adminColors, adminType } from '../../../theme';
import { formatKgNumber } from '../../../money/quantity';
import type { AllocationDashboard, InventoryLiveStateProps, InventoryScreenBaseProps, ProductStock } from './types';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';

export interface ProductStockDetailScreenProps extends InventoryScreenBaseProps, InventoryLiveStateProps {
  /** The product (crop+grade) whose detail is shown. */
  product?: ProductStock | undefined;
  /** Allocation breakdown across channels for this product. */
  allocation?: AllocationDashboard | undefined;
}

// ─── Custom Icons for Action Buttons ──────────────────────────────────────────

function ActionBatchesIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6 4h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke={color} strokeWidth="1.8" />
      <Path d="M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.6" fill={adminColors.card} />
      <Path d="M8 10h8M8 14h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ActionLedgerIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" stroke={color} strokeWidth="1.8" />
      <Path d="M7 8h10M7 12h10M7 16h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ActionPinIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function ActionVerifyIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6.5 4h11A2.5 2.5 0 0 1 20 6.5v12a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5v-12A2.5 2.5 0 0 1 6.5 4z" stroke={color} strokeWidth="1.8" />
      <Path d="M9 2h6a1 1 0 0 1 1 1v1H8V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.6" fill={adminColors.card} />
      <Path d="M8.5 12.5l2.5 2.5 4.5-4.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ProductStockDetailScreen({ scope, onNavigate, onBack, product, allocation, isLoading }: ProductStockDetailScreenProps) {
  // Pull per-channel allocation grams; fall back to '—' when allocation not loaded.
  const channelGrams = (key: string) => {
    const ch = allocation?.channels.find((c) => c.channel === key);
    return ch != null ? `${formatKgNumber(ch.allocatedGrams)} kg` : '—';
  };

  // StockLevel → human label.
  const levelLabel = product?.level === 'inStock' ? 'In Stock' : product?.level === 'low' ? 'Low Stock' : 'Out of Stock';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader
          title={product?.productName ?? (isLoading ? '…' : '—')}
          subtitle={product?.gradeLabel ?? ''}
          onBack={onBack}
          warehouseLocked={scope.warehouseId !== undefined}
          warehouseName={scope.warehouseName}
          badge={
            product ? (
              <View style={styles.availableBadge}>
                <Text style={styles.availableBadgeText}>{levelLabel}</Text>
              </View>
            ) : null
          }
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stock Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stock Summary</Text>
            <View style={styles.summaryCards}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {product != null ? `${formatKgNumber(product.availableGrams)} kg` : '—'}
                </Text>
                <Text style={styles.summaryLabel}>AVAILABLE</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>
                  {product != null ? `${formatKgNumber(product.reservedGrams)} kg` : '—'}
                </Text>
                <Text style={styles.summaryLabel}>RESERVED</Text>
              </View>
              <View style={styles.summaryCard}>
                {/* allocatedGrams is on ProductStock (null when allocations not given). */}
                <Text style={styles.summaryValue}>
                  {product?.allocatedGrams != null ? `${formatKgNumber(product.allocatedGrams)} kg` : '—'}
                </Text>
                <Text style={styles.summaryLabel}>ALLOCATED</Text>
              </View>
            </View>
          </View>

          {/* Allocation — per-channel grams from AllocationDashboard. */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Allocation</Text>
            <View style={styles.allocationSingleCard}>
              <View style={styles.allocationRow}>
                <View style={styles.allocationCol}>
                  <Text style={styles.allocationLabel}>ONLINE</Text>
                  <Text style={styles.allocationValue}>{channelGrams('online')}</Text>
                </View>
                <View style={styles.allocationCol}>
                  <Text style={styles.allocationLabel}>LIVE MARKET</Text>
                  <Text style={styles.allocationValue}>{channelGrams('liveMarket')}</Text>
                </View>
              </View>
              <View style={styles.allocationRow}>
                <View style={styles.allocationCol}>
                  <Text style={styles.allocationLabel}>RESERVE</Text>
                  <Text style={styles.allocationValue}>{channelGrams('reserve')}</Text>
                </View>
                <View style={styles.allocationCol}>
                  <Text style={styles.allocationLabel}>BUFFER</Text>
                  <Text style={styles.allocationValue}>{channelGrams('buffer')}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Batches & Storage — counts and primary storage come from ProductStock. */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Batches & Storage</Text>
            <View style={styles.batchesCard}>
              <View style={styles.infoRowTop}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Active Batches</Text>
                  <Text style={styles.infoValue}>
                    {product != null ? String(product.activeBatchCount) : '—'}
                  </Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Storage Locations</Text>
                  <Text style={styles.infoValue}>
                    {product != null ? String(product.storageLocations.length) : '—'}
                  </Text>
                </View>
              </View>
              <View style={styles.primaryStorageRow}>
                <Text style={styles.infoLabel}>Primary Storage</Text>
                <Text style={styles.primaryStorageValue}>{product?.primaryStorage ?? '—'}</Text>
              </View>
            </View>
          </View>

          {/* Actions - White Cards with Orange Border and Centered Brown Text */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onNavigate?.('M3S04')}
              activeOpacity={0.7}
            >
              <ActionBatchesIcon color={adminColors.brandDeep} />
              <Text style={styles.actionButtonText}>View Batches</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onNavigate?.('M3S06')}
              activeOpacity={0.7}
            >
              <ActionLedgerIcon color={adminColors.brandDeep} />
              <Text style={styles.actionButtonText}>View Ledger</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onNavigate?.('StorageLocationDetail', { locationId: 'CS-A01' })}
              activeOpacity={0.7}
            >
              <ActionPinIcon color={adminColors.brandDeep} />
              <Text style={styles.actionButtonText}>View Storage Locations</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onNavigate?.('M3S10')}
              activeOpacity={0.7}
            >
              <ActionVerifyIcon color={adminColors.brandDeep} />
              <Text style={styles.actionButtonText}>Verify Stock</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  content: {
    flex: 1,
    paddingTop: 10,
  },
  availableBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableBadgeText: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 10,
  },
  // 3 Summary Cards
  summaryCards: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  summaryValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    marginBottom: 4,
  },
  summaryLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.8,
  },
  // Single Allocation Card
  allocationSingleCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
  },
  allocationRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  allocationCol: {
    flex: 1,
  },
  allocationLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  allocationValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  // Batches & Storage Card
  batchesCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
  },
  infoRowTop: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 4,
  },
  infoValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  primaryStorageRow: {
    marginTop: 2,
  },
  primaryStorageValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  // Action Buttons (Centered, Orange Border, Brown Text)
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    height: 48,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
  },
  actionButtonText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginLeft: 10,
  },
});
