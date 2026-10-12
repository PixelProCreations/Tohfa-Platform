// Design id: M3S05
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import type { InventoryScreenBaseProps } from './types';
import Svg, { Circle, Path } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';

export type BatchDetailScreenProps = InventoryScreenBaseProps;

function StoragePinIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s-7-4.5-7-11a7 7 0 1 1 14 0c0 6.5-7 11-7 11z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function AllocationPieIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z" stroke={color} strokeWidth="2" />
      <Path d="M12 2v20" stroke={color} strokeWidth="2" />
      <Path d="M12 12h10" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function GoodsReceiptIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3.5l2 1.5 2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 1.5V20.5H6V3.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9.5 9h5M9.5 13h5M9.5 17h3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TraceabilityHistoryIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12a9 9 0 1 0 2.64-6.36L3 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3 3v5h5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function BatchDetailScreen({ onBack }: BatchDetailScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader
          title="Batch BT-000128"
          subtitle="Tomato · Grade 1 · Ooty"
          onBack={onBack}
          colors={['#F0562A', '#F0562A']}
        />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Card */}
          <View style={styles.card}>
            <View style={styles.metricRow}>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Original</Text>
                <Text style={styles.metricValue}>120 KG</Text>
              </View>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Available</Text>
                <Text style={styles.metricValue}>85 KG</Text>
              </View>
            </View>

            <View style={[styles.metricRow, { marginTop: 14 }]}>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Reserved</Text>
                <Text style={styles.metricValue}>15 KG</Text>
              </View>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Allocated</Text>
                <Text style={styles.metricValue}>15 KG</Text>
              </View>
            </View>

            <View style={[styles.metricRow, { marginTop: 14 }]}>
              <View style={styles.metricCol}>
                <Text style={styles.metricLabel}>Consumed</Text>
                <Text style={styles.metricValue}>5 KG</Text>
              </View>
            </View>
          </View>

          {/* Notice Card */}
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>
              Source Farmer ID is internal traceability only — never exposed in customer-facing inventory views (farm-anonymous presentation).
            </Text>
          </View>

          {/* Movement Timeline */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Movement Timeline</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.viewLink}>View →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.timelineRow}>
                <Text style={styles.timelineItemText}>Goods Receipt</Text>
              </View>
              <View style={styles.dashedDivider} />

              <View style={styles.timelineRow}>
                <Text style={styles.timelineItemText}>Batch Created</Text>
              </View>
              <View style={styles.dashedDivider} />

              <View style={styles.timelineRow}>
                <Text style={styles.timelineItemText}>Allocation</Text>
              </View>
              <View style={styles.dashedDivider} />

              <View style={styles.timelineRow}>
                <Text style={styles.timelineItemText}>Reservation</Text>
              </View>
            </View>
          </View>

          {/* 2x2 Grid Action Cards */}
          <View style={styles.gridContainer}>
            <View style={styles.gridRow}>
              <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
                <StoragePinIcon size={26} color="#F0562A" />
                <Text style={styles.actionCardLabel}>Storage</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
                <AllocationPieIcon size={26} color="#F0562A" />
                <Text style={styles.actionCardLabel}>Allocation</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.gridRow}>
              <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
                <GoodsReceiptIcon size={26} color="#F0562A" />
                <Text style={styles.actionCardLabel}>Goods Receipt</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
                <TraceabilityHistoryIcon size={26} color="#F0562A" />
                <Text style={styles.actionCardLabel}>Traceability</Text>
              </TouchableOpacity>
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
  noticeCard: {
    backgroundColor: '#FFF5EB',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  noticeText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '600',
    color: '#9A3412',
    lineHeight: 18,
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
  timelineRow: {
    paddingVertical: 10,
  },
  timelineItemText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  dashedDivider: {
    height: 1,
    borderWidth: 0.8,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  gridContainer: {
    marginTop: 18,
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  actionCardLabel: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111827',
  },
});
