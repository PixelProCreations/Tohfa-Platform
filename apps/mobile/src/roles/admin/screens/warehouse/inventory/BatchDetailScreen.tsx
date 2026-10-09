// Design id: M3S05
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, InteractionManager } from 'react-native';
import { adminColors, adminType } from '../../../theme';
import type { InventoryScreenBaseProps } from './types';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';

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
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Fixed Header */}
      <SWAHeader
        title="BAT-2026-00124"
        subtitle="Tomato · Grade 1"
        onBack={onBack}
        badge={
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        }
      />

      {/* Static content — no ScrollView */}
      <View style={styles.body}>

        {/* ── Batch Information ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Batch Information</Text>
          <View style={styles.card}>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Batch Code</Text>
                <Text style={styles.fieldValue}>BAT-2026-00124</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Product</Text>
                <Text style={styles.fieldValue}>Tomato</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Grade</Text>
                <Text style={styles.fieldValue}>Grade 1</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Warehouse</Text>
                <Text style={styles.fieldValue}>{scope.warehouseName ?? String(routeParams?.warehouseName ?? '—')}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Storage Location</Text>
                <Text style={styles.fieldValue}>Cold Storage · A03</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Received Quantity</Text>
                <Text style={styles.fieldValue}>100 KG</Text>
              </View>
            </View>
            <View style={[styles.gridRow, { marginBottom: 0 }]}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Available Quantity</Text>
                <Text style={styles.fieldValue}>95 KG</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Received Date</Text>
                <Text style={styles.fieldValue}>24 Sep 2026</Text>
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
                <Text style={styles.fieldValue}>GR-1024</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Source Farmer</Text>
                <Text style={styles.fieldValue}>Internal reference</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Stock Movement Summary ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Movement Summary</Text>
          <View style={styles.movementRow}>
            <View style={styles.movementCard}>
              <Text style={styles.movementValue}>100 KG</Text>
              <Text style={styles.movementLabel}>RECEIVED</Text>
            </View>
            <View style={styles.movementCard}>
              <Text style={styles.movementValue}>20 KG</Text>
              <Text style={styles.movementLabel}>DISPATCHED</Text>
            </View>
            <View style={styles.movementCard}>
              <Text style={styles.movementValue}>10 KG</Text>
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
            style={styles.actionBtn}
            onPress={() => InteractionManager.runAfterInteractions(() => onNavigate?.('M3S10'))}
            activeOpacity={0.7}
          >
            <VerifyIcon />
            <Text style={styles.actionBtnText}>Verify Stock</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.brand, // status bar area blends with header
  },
  // ── Header uses its own paddingTop:44 ──
  // ── Body fills the rest ──
  body: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },

  // Sections
  section: {},
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 6,
  },
  sectionMuted: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },

  // Card
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  gridCol: {
    flex: 1,
  },
  fieldLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  fieldValue: {
    ...adminType.sectionHead,
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
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  movementValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 3,
  },
  movementLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.5,
  },

  // Action buttons
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    height: 46,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    gap: 8,
  },
  actionBtnText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },

  // Active badge — white pill with border matching reference
  activeBadge: {
    backgroundColor: adminColors.card,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: adminColors.onBrand,
  },
  activeBadgeText: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
  },
});
