// Design id: M3S04
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { adminColors, adminType } from '../../../theme';
import { formatKgNumber } from '../../../money/quantity';
import type { BatchRow, InventoryLiveStateProps, InventoryScreenBaseProps } from './types';
import { SWAHeader } from '../../swa/components';

export interface BatchListScreenProps extends InventoryScreenBaseProps, InventoryLiveStateProps {
  /** Live batches from /admin/batches for the selected product. */
  batches?: readonly BatchRow[] | undefined;
  /** Load the next cursor page. */
  onLoadMore?: (() => void) | undefined;
  /** True when more pages remain. */
  hasMore?: boolean | undefined;
}

export function BatchListScreen({ scope, onNavigate, onBack, batches, isLoading, onLoadMore, hasMore }: BatchListScreenProps) {
  const liveBatches = batches ?? [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader
          title="Batches"
          subtitle={liveBatches.length > 0 ? `${liveBatches[0]!.productName} · ${liveBatches[0]!.gradeLabel} · ${liveBatches.length} batch${liveBatches.length !== 1 ? 'es' : ''}` : 'Loading…'}
          onBack={onBack}
          warehouseLocked={scope.warehouseId !== undefined}
          warehouseName={scope.warehouseName}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading && liveBatches.length === 0 ? (
            <View style={{ paddingTop: 24, alignItems: 'center' }}>
              <Text style={styles.batchDate}>Loading…</Text>
            </View>
          ) : null}
          {liveBatches.map((batch: BatchRow) => (
            <TouchableOpacity
              key={batch.id}
              style={styles.batchCard}
              onPress={() => onNavigate?.('M3S05', { batchId: batch.id })}
              activeOpacity={0.7}
            >
              <View style={styles.batchHeader}>
                <Text style={styles.batchId}>{batch.batchCode}</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{batch.statusLabel}</Text>
                </View>
              </View>
              <Text style={styles.batchProduct}>{`${batch.productName} · ${batch.gradeLabel}`}</Text>

              <View style={styles.batchStatsRow}>
                <View style={styles.batchStatCol}>
                  <Text style={styles.batchStatLabel}>Available</Text>
                  <Text style={styles.batchStatValueAvailable}>
                    {batch.availableGrams !== null ? `${formatKgNumber(batch.availableGrams)} kg` : '—'}
                  </Text>
                </View>
                <View style={styles.batchStatCol}>
                  <Text style={styles.batchStatLabel}>Storage</Text>
                  <Text style={styles.batchStatValueStorage}>{batch.storageLocation ?? '—'}</Text>
                </View>
              </View>

              <Text style={styles.batchDate}>{batch.receivedOn ? `Received ${batch.receivedOn}` : ''}</Text>
            </TouchableOpacity>
          ))}
          {hasMore ? (
            <TouchableOpacity onPress={onLoadMore} style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={styles.batchDate}>Load more ↓</Text>
            </TouchableOpacity>
          ) : null}
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  batchCard: {
    backgroundColor: adminColors.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  batchId: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  activeBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  batchProduct: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 14,
  },
  batchStatsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  batchStatCol: {
    width: '42%',
  },
  batchStatLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  batchStatValueAvailable: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  batchStatValueStorage: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  batchDate: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    textAlign: 'right',
    marginTop: 4,
  },
});
