// Design id: M3S15
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { adminColors, adminRadius, adminShadow, adminType } from '../../../theme';
import { formatKgNumber } from '../../../money/quantity';
import type { InventoryScreenBaseProps, StockMovementRow } from './types';
import Svg, { Path } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';

export interface StockMovementDetailScreenProps extends InventoryScreenBaseProps {
  /** The movement row extracted from route params (BR-37: no per-id ledger read). */
  movement?: StockMovementRow | undefined;
  /** Warehouse name for display; resolved by useInventoryWarehouseName. */
  warehouseName?: string | undefined;
}


function MoreDotsIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
        fill={adminColors.card}
      />
    </Svg>
  );
}


function QrIcon({ color = adminColors.brand, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h2v-3h-2v3zm4 0h2v-3h-2v3zm-4 4h2v-2h-2v2zm4 0h2v-2h-2v2zm0-4h2v-2h-2v2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DocumentReferenceIcon({ color = adminColors.brand, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HistoryLedgerIcon({ color = adminColors.brand, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 3v5h5M12 7v5l4 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


export function StockMovementDetailScreen({ scope, onNavigate, onBack, movement, warehouseName }: StockMovementDetailScreenProps) {
  // Warehouse label: prefer the resolved prop (useInventoryWarehouseName), then scope fallback.
  const warehouseLabel = warehouseName ?? scope.warehouseName ?? '—';

  // Product label is "ProductName · GradeLabel" — split for the two-column grid.
  const productParts = movement?.productLabel?.split(' · ') ?? [];
  const productName = productParts[0] ?? '—';
  const gradeLabel = productParts[1] ?? '—';

  // BR-37: no per-id ledger read. All data comes from movement prop (route params).
  // Compute "before" from balanceAfter - delta. Both are number | null per the type.
  const beforeGrams =
    movement != null && movement.balanceAfterGrams != null && movement.deltaGrams != null
      ? movement.balanceAfterGrams - movement.deltaGrams
      : null;
  const beforeText = beforeGrams != null ? `${formatKgNumber(Math.max(0, beforeGrams))} kg` : '—';

  // Colour the quantity card to match direction: 'in' = green, 'out' = red.
  const qtyColor = movement?.direction === 'out' ? adminColors.danger.text : adminColors.success.text;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader 
          title="Stock Movement"
          onBack={onBack}
          rightAction={
            <TouchableOpacity 
              style={styles.moreButton} 
              activeOpacity={0.7}
              onPress={() => onNavigate?.('M3S18')}
            >
              <MoreDotsIcon />
            </TouchableOpacity>
          }
        />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Top Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.receiptBadge}>
              <Text style={styles.receiptBadgeText}>
                {movement ? `${movement.typeLabel} · Completed` : '—'}
              </Text>
            </View>
            <Text style={styles.movementIdBig}>{movement?.id ?? '—'}</Text>
          </View>

          {/* Movement Summary - 2-Column Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Movement Summary</Text>
            <View style={styles.infoCard}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Movement Type</Text>
                  <Text style={styles.colValue}>{movement?.typeLabel ?? '—'}</Text>
                </View>
                <View style={styles.col}>
                  {/* Ledger entries are final (append-only). Status is always Completed. */}
                  <Text style={styles.colLabel}>Status</Text>
                  <Text style={styles.colValue}>Completed</Text>
                </View>
              </View>

              <View style={[styles.twoColRow, { marginTop: 12 }]}>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Movement ID</Text>
                  <Text style={styles.colValue}>{movement?.id ?? '—'}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Warehouse</Text>
                  <Text style={styles.colValue}>{warehouseLabel}</Text>
                </View>
              </View>

              <View style={[styles.twoColRow, { marginTop: 12 }]}>
                <View style={styles.fullCol}>
                  <Text style={styles.colLabel}>Date & Time</Text>
                  <Text style={styles.colValue}>{movement?.performedAt ?? '—'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Product Information - 2-Column Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Product / Crop</Text>
                  <Text style={styles.colValue}>{productName}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Grade</Text>
                  <Text style={styles.colValue}>{gradeLabel}</Text>
                </View>
              </View>

              <View style={[styles.twoColRow, { marginTop: 12 }]}>
                <View style={styles.col}>
                  {/* All produce quantities are in KG. */}
                  <Text style={styles.colLabel}>Unit</Text>
                  <Text style={styles.colValue}>KG</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Batch</Text>
                  <Text style={styles.colValue}>{movement?.batchCode ?? '—'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quantity Movement */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity Movement</Text>
            <View style={styles.quantityCard}>
              <Text style={[styles.quantityCardLabel, { color: qtyColor }]}>QUANTITY MOVEMENT</Text>
              <Text style={[styles.quantityBigValue, { color: qtyColor }]}>{movement?.deltaText ?? '—'}</Text>

              <View style={styles.flowRow}>
                <View style={styles.flowStep}>
                  <Text style={styles.flowStepValue}>{beforeText}</Text>
                  <Text style={styles.flowStepLabel}>BEFORE</Text>
                </View>
                <Text style={styles.flowArrow}>→</Text>
                <View style={styles.flowStep}>
                  <Text style={[styles.flowStepValueGreen, { color: qtyColor }]}>{movement?.deltaText ?? '—'}</Text>
                  <Text style={[styles.flowStepLabelGreen, { color: qtyColor }]}>MOVEMENT</Text>
                </View>
                <Text style={styles.flowArrow}>→</Text>
                <View style={styles.flowStep}>
                  <Text style={styles.flowStepValue}>{movement?.balanceText ?? '—'}</Text>
                  <Text style={styles.flowStepLabel}>AFTER</Text>
                </View>
              </View>
            </View>

          </View>

          {/* Storage Location — no storage hierarchy API; all fields show '—'. */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Storage Location</Text>
            <View style={styles.infoCard}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Storage Type</Text>
                  <Text style={styles.colValue}>{'—'}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Section</Text>
                  <Text style={styles.colValue}>{'—'}</Text>
                </View>
              </View>

              <View style={[styles.twoColRow, { marginTop: 12 }]}>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Rack</Text>
                  <Text style={styles.colValue}>{'—'}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Shelf / Bin</Text>
                  <Text style={styles.colValue}>{'—'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Reference */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reference</Text>
            <View style={styles.infoCard}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>{movement?.refType ?? 'Reference'}</Text>
                  <Text style={styles.colValue}>{movement?.refId ?? '—'}</Text>
                </View>
                <View style={styles.col}>
                  {/* 'Received From' has no API field — not exposed on ledger rows. */}
                  <Text style={styles.colLabel}>Received From</Text>
                  <Text style={styles.colValue}>{'—'}</Text>
                </View>
              </View>

              <View style={[styles.twoColRow, { marginTop: 12 }]}>
                <View style={styles.fullCol}>
                  <Text style={styles.colLabel}>Related Batch</Text>
                  <Text style={styles.colValue}>{movement?.batchCode ?? '—'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Performed By — performer identity is not on the ledger row; date is. */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performed By</Text>
            <View style={styles.infoCard}>
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Performed By</Text>
                  <Text style={styles.colValue}>{'—'}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.colLabel}>Date & Time</Text>
                  <Text style={styles.colValue}>{movement?.performedAt ?? '—'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Notes — remarks from the ledger row; no photo evidence API. */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.infoCard}>
              <Text style={styles.colLabel}>Remarks</Text>
              <Text style={styles.notesText}>{movement?.remarks || '—'}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <TouchableOpacity
              style={styles.actionOutlineBtn}
              onPress={() => onNavigate?.('M3S04')}
              activeOpacity={0.7}
            >
              <QrIcon color={adminColors.brand} size={18} />
              <Text style={styles.actionBtnText}>View Batch</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOutlineBtn}
              onPress={() => onNavigate?.('M3S06')}
              activeOpacity={0.7}
            >
              <DocumentReferenceIcon color={adminColors.brand} size={18} />
              <Text style={styles.actionBtnText}>View Reference</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOutlineBtn}
              onPress={() => onNavigate?.('M3S06')}
              activeOpacity={0.7}
            >
              <HistoryLedgerIcon color={adminColors.brand} size={18} />
              <Text style={styles.actionBtnText}>View Ledger History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOutlineBtn}
              onPress={() => onNavigate?.('M3S18')}
              activeOpacity={0.7}
            >
              <DocumentReferenceIcon color={adminColors.brand} size={18} />
              <Text style={styles.actionBtnText}>View Movement Receipt</Text>
            </TouchableOpacity>
          </View>



          <View style={{ height: 28 }} />
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
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: adminColors.onBrand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  heroCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  receiptBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  receiptBadgeText: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
  },
  movementIdBig: {
    ...adminType.title,
    color: adminColors.ink,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
  },
  twoColRow: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  fullCol: {
    flex: 1,
  },
  colLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 3,
  },
  colValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  quantityCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  quantityCardLabel: {
    ...adminType.caption,
    color: adminColors.success.text,
    letterSpacing: 0.8,
  },
  quantityBigValue: {
    ...adminType.kpiValue,
    color: adminColors.success.text,
    marginVertical: 6,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
    gap: 12,
  },
  flowStep: {
    alignItems: 'center',
  },
  flowStepValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  flowStepLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  flowStepValueGreen: {
    ...adminType.sectionHead,
    color: adminColors.success.text,
  },
  flowStepLabelGreen: {
    ...adminType.caption,
    color: adminColors.success.text,
    marginTop: 2,
  },
  flowArrow: {
    ...adminType.title,
    color: adminColors.muted,
    marginBottom: 10,
  },
  notesText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 2,
    marginBottom: 12,
  },
  actionOutlineBtn: {
    backgroundColor: adminColors.brandTint,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  actionBtnText: {
    ...adminType.sectionHead,
    color: adminColors.brand,
  },
});
