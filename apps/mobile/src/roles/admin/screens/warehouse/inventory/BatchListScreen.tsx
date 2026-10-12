// Design id: M3S04
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import type { InventoryScreenBaseProps } from './types';
import { SWAHeader } from '../../swa/components';

export type BatchListScreenProps = InventoryScreenBaseProps;

interface BatchItem {
  id: string;
  product: string;
  grade: string;
  status: string;
  available: string;
  storage: string;
  dateText: string;
  warehouse: string;
}

const ALL_BATCHES: BatchItem[] = [
  {
    id: 'BAT-2026-00124',
    product: 'Tomato',
    grade: 'Grade 1',
    status: 'Active',
    available: '95 KG',
    storage: 'Cold Storage · A03',
    dateText: 'Received 24 Sep 2026',
    warehouse: 'Coonoor',
  },
  {
    id: 'BAT-2026-00125',
    product: 'Tomato',
    grade: 'Grade 1',
    status: 'Active',
    available: '150 KG',
    storage: 'Cold Storage · A04',
    dateText: 'Received 24 Sep 2026',
    warehouse: 'Coonoor',
  },
  {
    id: 'BAT-2026-00098',
    product: 'Tomato',
    grade: 'Grade 1',
    status: 'Active',
    available: '0 KG',
    storage: 'Cold Storage · A01',
    dateText: 'Fully consumed',
    warehouse: 'Ooty',
  },
];

export function BatchListScreen({ scope, onNavigate, onBack }: BatchListScreenProps) {
  // If scope has a specific warehouseId, user is logged in as a Subwarehouse user.
  // If scope.warehouseId is undefined, user is logged in as a Main Warehouse user.
  const isSubwarehouse = Boolean(scope?.warehouseId);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('All');

  const filteredBatches = ALL_BATCHES.filter(batch => {
    if (isSubwarehouse) {
      // Subwarehouse user sees existing subwarehouse screen as it is
      return true;
    }
    if (selectedWarehouse === 'All') return true;
    return batch.warehouse === selectedWarehouse;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader
          title="Batches"
          subtitle="Tomato · Grade 1 · 5 Active Batches"
          onBack={onBack}
          colors={['#F0562A', '#F0562A']}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Warehouse: show filter pills to display details from all subwarehouses */}
          {!isSubwarehouse && (
            <View style={styles.filterRow}>
              {['All', 'Coonoor', 'Ooty', 'Kotagiri'].map(wh => (
                <TouchableOpacity
                  key={wh}
                  style={[styles.pill, selectedWarehouse === wh && styles.pillActive]}
                  onPress={() => setSelectedWarehouse(wh)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillText, selectedWarehouse === wh && styles.pillTextActive]}>
                    {wh === 'All' ? 'All Warehouses' : wh}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {filteredBatches.map(batch => (
            <TouchableOpacity
              key={batch.id}
              style={styles.batchCard}
              onPress={() => onNavigate?.('M3S05', { batchId: batch.id })}
              activeOpacity={0.7}
            >
              <View style={styles.batchHeader}>
                <Text style={styles.batchId}>{batch.id}</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{batch.status}</Text>
                </View>
              </View>
              <Text style={styles.batchSubtitle}>{batch.product} · {batch.grade}</Text>

              <View style={styles.batchStatsRow}>
                <View style={styles.batchStatCol}>
                  <Text style={styles.batchStatLabel}>Available</Text>
                  <Text style={styles.batchStatValue}>{batch.available}</Text>
                </View>
                <View style={styles.batchStatCol}>
                  <Text style={styles.batchStatLabel}>Storage</Text>
                  <Text style={styles.batchStatValue}>{batch.storage}</Text>
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
    backgroundColor: '#F0562A',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pillActive: {
    backgroundColor: '#F0562A',
    borderColor: '#F0562A',
  },
  pillText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
    marginBottom: 14,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  batchId: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  batchSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 12,
  },
  batchStatsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  batchStatCol: {
    width: '48%',
  },
  batchStatLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  batchStatValue: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  batchDate: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: '#854D0E',
    textAlign: 'right',
    marginTop: 4,
  },
});
