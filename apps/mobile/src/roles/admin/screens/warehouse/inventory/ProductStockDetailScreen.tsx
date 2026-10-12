// Design id: M3S03
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import type { InventoryScreenBaseProps } from './types';
import { SWAHeader } from '../../swa/components';

export type ProductStockDetailScreenProps = InventoryScreenBaseProps;

export function ProductStockDetailScreen({ onNavigate, onBack }: ProductStockDetailScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader
          title="Tomato — Grade 1"
          onBack={onBack}
          colors={['#F0562A', '#F0562A']}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Summary Card (2 columns x 2 rows) */}
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Total</Text>
                <Text style={styles.metricValue}>290 KG</Text>
              </View>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Available</Text>
                <Text style={styles.metricValue}>210 KG</Text>
              </View>
            </View>

            <View style={[styles.metricRow, { marginTop: 14 }]}>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Allocated</Text>
                <Text style={styles.metricValue}>30 KG</Text>
              </View>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Reserved</Text>
                <Text style={styles.metricValue}>40 KG</Text>
              </View>
            </View>
          </View>

          {/* Warehouse Distribution */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Warehouse Distribution</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.viewLink}>View →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.listRow}>
                <Text style={styles.listLabel}>Ooty</Text>
                <Text style={styles.listValue}>120 KG</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.listRow}>
                <Text style={styles.listLabel}>Coonoor</Text>
                <Text style={styles.listValue}>80 KG</Text>
              </View>
            </View>
          </View>

          {/* Batch List */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Batch List</Text>
              <TouchableOpacity
                onPress={() => onNavigate?.('M3S04')}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.viewLink}>View →</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.card}
              onPress={() => onNavigate?.('M3S04')}
              activeOpacity={0.7}
            >
              <View style={styles.metricRow}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Total Batches</Text>
                  <Text style={styles.metricValue}>6</Text>
                </View>
                <View style={styles.metricCol}>
                  <Text style={styles.metricLabel}>Storage Locations</Text>
                  <Text style={styles.metricValue}>2</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Allocation Summary */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Allocation Summary</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.viewLink}>View →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.listRow}>
                <Text style={styles.listLabel}>Online</Text>
                <Text style={styles.listValue}>120 KG</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.listRow}>
                <Text style={styles.listLabel}>Reserve</Text>
                <Text style={styles.listValue}>50 KG</Text>
              </View>
            </View>
          </View>

          {/* Recent Movements */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Movements</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.viewLink}>View →</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.card, { paddingVertical: 18, paddingHorizontal: 16 }]}>
              <Text style={styles.movementText}>+100 KG · Receipt · Ooty</Text>
            </View>
          </View>
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
    paddingBottom: 36,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
    overflow: 'hidden',
  },
  metricRow: {
    flexDirection: 'row',
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: '#52290D',
  },
  viewLink: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: '#F0562A',
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  listLabel: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  listValue: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  movementText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
});
