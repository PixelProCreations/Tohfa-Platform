// Design id: M3S04
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import type { BatchRow, InventoryLiveStateProps, InventoryScreenBaseProps } from './types';
import { SWAHeader } from '../../swa/components';

export interface BatchListScreenProps extends InventoryScreenBaseProps, InventoryLiveStateProps {
  /** The batches (of one product when the route names one), page by page. */
  batches?: readonly BatchRow[] | undefined;
  onLoadMore?: (() => void) | undefined;
  hasMore?: boolean | undefined;
}

export function BatchListScreen({
  scope,
  onNavigate,
  onBack,
  routeParams,
  batches = [],
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onLoadMore,
  hasMore = false,
}: BatchListScreenProps) {
  const view = queryViewState({ isLoading, error, itemCount: batches.length });
  // Opened from a product: name it from its batches (the route carries only ids).
  const first = routeParams?.['cropId'] === undefined ? undefined : batches[0];
  const subtitle = first === undefined ? undefined : t('inventory.product.label', { product: first.productName, grade: first.gradeLabel });

  const renderBatch = ({ item: batch }: { item: BatchRow }) => (
    <TouchableOpacity
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
      <Text style={styles.batchProduct}>{batch.productName} · {batch.gradeLabel}</Text>

      <View style={styles.batchStatsRow}>
        <View style={styles.batchStatCol}>
          <Text style={styles.batchStatLabel}>Available</Text>
          <Text style={styles.batchStatValueAvailable}>
            {batch.availableGrams === null ? t('inventory.noValue') : formatKg(batch.availableGrams)}
          </Text>
        </View>
        <View style={styles.batchStatCol}>
          <Text style={styles.batchStatLabel}>Storage</Text>
          <Text style={styles.batchStatValueStorage}>{batch.storageLocation ?? t('inventory.noValue')}</Text>
        </View>
      </View>

      {batch.receivedOn === '' ? null : (
        <Text style={styles.batchDate}>{t('inventory.batch.receivedOn', { date: batch.receivedOn })}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader 
          title="Batches"
          subtitle={subtitle}
          onBack={onBack}
          warehouseLocked={scope.warehouseId !== undefined}
          warehouseName={scope.warehouseName}
        />
        
        {view === 'loading' ? (
          <AdminLoadingState />
        ) : view === 'error' ? (
          <AdminErrorState error={error} onRetry={onRetry} />
        ) : (
          <FlatList
            style={styles.content}
            data={batches}
            keyExtractor={(batch) => batch.id}
            renderItem={renderBatch}
            showsVerticalScrollIndicator={false}
            onEndReached={hasMore ? onLoadMore : undefined}
            onEndReachedThreshold={0.5}
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
            ListEmptyComponent={<AdminEmptyState title={t('inventory.empty.batches')} />}
            ListFooterComponent={hasMore ? <ActivityIndicator color={adminColors.brand} /> : null}
          />
        )}
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
