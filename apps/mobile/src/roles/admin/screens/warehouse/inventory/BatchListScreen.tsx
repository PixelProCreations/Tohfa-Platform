// Design id: M3S04
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { adminColors, adminType } from '../../../theme';
import type { InventoryScreenBaseProps } from './types';
import { SWAHeader } from '../../swa/components';

export type BatchListScreenProps = InventoryScreenBaseProps;

export function BatchListScreen({ scope, onNavigate, onBack }: BatchListScreenProps) {
  const batches = [
    {
      id: 'BAT-2026-00124',
      product: 'Tomato',
      grade: 'Grade 1',
      status: 'Active',
      available: '95 KG',
      storage: 'Cold Storage · A03',
      dateText: 'Received 24 Sep 2026',
    },
    {
      id: 'BAT-2026-00125',
      product: 'Tomato',
      grade: 'Grade 1',
      status: 'Active',
      available: '150 KG',
      storage: 'Cold Storage · A04',
      dateText: 'Received 24 Sep 2026',
    },
    {
      id: 'BAT-2026-00098',
      product: 'Tomato',
      grade: 'Grade 1',
      status: 'Active',
      available: '0 KG',
      storage: 'Cold Storage · A01',
      dateText: 'Fully consumed',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader 
          title="Batches"
          subtitle="Tomato · Grade 1 · 5 Active Batches"
          onBack={onBack}
          warehouseLocked={scope.warehouseId !== undefined}
          warehouseName={scope.warehouseName}
        />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {batches.map((batch, index) => (
          <TouchableOpacity
            key={index}
            style={styles.batchCard}
            onPress={() => onNavigate?.('M3S05')}
            activeOpacity={0.7}
          >
            <View style={styles.batchHeader}>
              <Text style={styles.batchId}>{batch.id}</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{batch.status}</Text>
              </View>
            </View>
            <Text style={styles.batchProduct}>{batch.product} · {batch.grade}</Text>
            
            <View style={styles.batchStatsRow}>
              <View style={styles.batchStatCol}>
                <Text style={styles.batchStatLabel}>Available</Text>
                <Text style={styles.batchStatValueAvailable}>{batch.available}</Text>
              </View>
              <View style={styles.batchStatCol}>
                <Text style={styles.batchStatLabel}>Storage</Text>
                <Text style={styles.batchStatValueStorage}>{batch.storage}</Text>
              </View>
            </View>
            
            <Text style={styles.batchDate}>{batch.dateText}</Text>
          </TouchableOpacity>
        ))}
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
