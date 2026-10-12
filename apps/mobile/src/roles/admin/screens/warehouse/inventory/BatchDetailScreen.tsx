// Design id: M3S05
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, InteractionManager } from 'react-native';
import { adminColors, adminType } from '../../../theme';
import type { InventoryScreenBaseProps } from './types';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';
import { SAMPLE_BATCH_DETAIL } from './fixtures';

export type BatchDetailScreenProps = InventoryScreenBaseProps;

function LedgerIcon({ color = adminColors.brandDeep }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 20V5.5L7.5 3.5 10 5.5l2-2 2 2 2-2 3 2V20H5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M8 9h8M8 13h8M8 16.5h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function VerifyIcon({ color = adminColors.brandDeep }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4z" stroke={color} strokeWidth="1.8" />
      <Path d="M7.5 10l2 2 3.5-3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 15h10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function BatchDetailScreen({ scope, onNavigate, onBack, routeParams }: BatchDetailScreenProps) {
  const warehouse = (scope.warehouseName ?? String(routeParams?.warehouseName ?? 'Coonoor')).replace(' Warehouse', '');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Fixed Header */}
      <SWAHeader
        title={SAMPLE_BATCH_DETAIL.batchCode}
        subtitle={`${SAMPLE_BATCH_DETAIL.product} · ${SAMPLE_BATCH_DETAIL.grade}`}
        onBack={onBack}
        badge={
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>{SAMPLE_BATCH_DETAIL.status}</Text>
          </View>
        }
      />

      <ScrollView 
        style={styles.body} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >

        {/* ── Batch Information ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Batch Information</Text>
          <View style={styles.card}>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Batch Code</Text>
                <Text style={styles.fieldValue}>{SAMPLE_BATCH_DETAIL.batchCode}</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Product</Text>
                <Text style={styles.fieldValue}>{SAMPLE_BATCH_DETAIL.product}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Grade</Text>
                <Text style={styles.fieldValue}>{SAMPLE_BATCH_DETAIL.grade}</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Warehouse</Text>
                <Text style={styles.fieldValue}>{warehouse}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Storage Location</Text>
                <Text style={styles.fieldValue}>{SAMPLE_BATCH_DETAIL.storageLocation}</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Received Quantity</Text>
                <Text style={styles.fieldValue}>{SAMPLE_BATCH_DETAIL.receivedQty}</Text>
              </View>
            </View>
            <View style={[styles.gridRow, { marginBottom: 0 }]}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Available Quantity</Text>
                <Text style={styles.fieldValue}>{SAMPLE_BATCH_DETAIL.availableQty}</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Received Date</Text>
                <Text style={styles.fieldValue}>{SAMPLE_BATCH_DETAIL.receivedDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Traceability ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Traceability</Text>
            <Text style={styles.sectionMuted}>Internal only</Text>
          </View>
          <View style={styles.card}>
            <View style={[styles.gridRow, { marginBottom: 0 }]}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Goods Receipt</Text>
                <Text style={styles.fieldValue}>{SAMPLE_BATCH_DETAIL.goodsReceipt}</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Source Farmer</Text>
                <Text style={styles.fieldValue}>{SAMPLE_BATCH_DETAIL.sourceFarmer}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Stock Movement Summary ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Movement Summary</Text>
          <View style={styles.movementRow}>
            <View style={styles.movementCard}>
              <Text style={styles.movementValue}>{SAMPLE_BATCH_DETAIL.movementReceived}</Text>
              <Text style={styles.movementLabel}>RECEIVED</Text>
            </View>
            <View style={styles.movementCard}>
              <Text style={styles.movementValue}>{SAMPLE_BATCH_DETAIL.movementDispatched}</Text>
              <Text style={styles.movementLabel}>DISPATCHED</Text>
            </View>
            <View style={styles.movementCard}>
              <Text style={styles.movementValue}>{SAMPLE_BATCH_DETAIL.movementReserved}</Text>
              <Text style={styles.movementLabel}>RESERVED</Text>
            </View>
          </View>
        </View>

        {/* ── Actions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => InteractionManager.runAfterInteractions(() => onNavigate?.('M3S06'))}
            activeOpacity={0.7}
          >
            <LedgerIcon />
            <Text style={styles.actionBtnText}>View Stock Ledger</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { marginBottom: 0 }]}
            onPress={() => InteractionManager.runAfterInteractions(() => onNavigate?.('M3S10'))}
            activeOpacity={0.7}
          >
            <VerifyIcon />
            <Text style={styles.actionBtnText}>Verify Stock</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  body: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },

  // Sections
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 8,
  },
  sectionMuted: {
    fontSize: 12,
    fontWeight: '500',
    color: adminColors.muted,
  },

  // Card
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  gridCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: adminColors.muted,
    letterSpacing: 0.2,
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },

  // Movement cards
  movementRow: {
    flexDirection: 'row',
    gap: 8,
  },
  movementCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  movementValue: {
    fontSize: 17,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 4,
  },
  movementLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: adminColors.muted,
    letterSpacing: 0.5,
  },

  // Action buttons
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    height: 48,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // Active badge — white pill with border matching reference
  activeBadge: {
    backgroundColor: adminColors.card,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: adminColors.onBrand,
  },
  activeBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.success.text,
  },
});
