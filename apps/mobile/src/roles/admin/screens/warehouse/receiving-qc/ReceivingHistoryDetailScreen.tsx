/**
 * Receiving History Detail (FINAL_LIST #91), shared by the Main and Sub
 * warehouse admins, and the Goods Receiving wizard's receipt_detail step.
 *
 * One receipt-detail design instead of three: this screen absorbed
 * SubWarehouseGoodsReceiptDetailScreen (open-variance receipt: status, variance,
 * supplier, notes, "Take Action") and replaces the wizard's inline receipt
 * detail (timeline, QC results, quantity summary). Those sections render when
 * the record carries the data, so a Main and a Sub record show the same layout.
 *
 * Read-only: nothing here mutates. "Take Action" only hands control to the
 * host (the Sub shell opens the wizard's Damage / Mismatch step).
 *
 * Scope: a Sub admin sees only receipts of its own warehouse
 * (inventory.batch.view = own, BR-30); a receipt of another warehouse resolves
 * to "not found", never to a forbidden state (CLAUDE.md 2.1: no existence leak).
 * Main (scope.warehouseId undefined) sees all four warehouses.
 * Gate: inventory.batch.view or inventory.goods_receipt.record to view;
 * the Batch Link tile needs inventory.batch.view.
 */
import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { QC_CRITERIA, findReceivingRecord, isMainScope, recordsInScope } from './fixtures';
import {
  CheckmarkCircleOutlineIcon,
  ClipboardChecklistIcon,
  CrossCircleIcon,
  PermissionNote,
  RECEIVING_CODES,
  WarningTriangleIcon,
} from './ReceivingParts';
import type { ReceiptResult, ReceivingRecord, WarehouseScreenBaseProps } from './types';

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TimelineIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6l-9.5 9.5-5-5L1 18"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 6h6v6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WarningCircleIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function QrCodeIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h3M18 14h3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function TruckIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export interface ReceivingHistoryDetailScreenProps extends WarehouseScreenBaseProps {
  /** Receipt to show, looked up in `records` within the scope. */
  receiptId?: string | undefined;
  /** A record given directly (the wizard's receipt being recorded). Still scope-checked. */
  record?: ReceivingRecord | undefined;
  /** Record source (defaults to the shared fixtures until the API serves receipts). */
  records?: ReceivingRecord[] | undefined;
  onNavigateTimeline?: (() => void) | undefined;
  onNavigateDiscrepancy?: (() => void) | undefined;
  onNavigateBatch?: (() => void) | undefined;
  onNavigateShipment?: (() => void) | undefined;
  /** Hand an open variance to the host (Sub shell: wizard Damage / Mismatch). Not a mutation. */
  onTakeAction?: (() => void) | undefined;
}

function resultTone(result: ReceiptResult) {
  if (result === 'Accepted') return adminColors.success;
  if (result === 'Rejected') return adminColors.danger;
  if (result === 'Open') return adminColors.brandSoft;
  return adminColors.warning;
}

export function ReceivingHistoryDetailScreen({
  scope,
  can,
  onBack,
  receiptId,
  record,
  records,
  onNavigateTimeline,
  onNavigateDiscrepancy,
  onNavigateBatch,
  onNavigateShipment,
  onTakeAction,
}: ReceivingHistoryDetailScreenProps) {
  const canView = can(RECEIVING_CODES.batchView) || can(RECEIVING_CODES.receiptRecord);
  const canViewBatch = can(RECEIVING_CODES.batchView);

  const visible = (r: ReceivingRecord | undefined): ReceivingRecord | undefined =>
    r !== undefined && (isMainScope(scope) || r.warehouseId === '' || r.warehouseId === scope.warehouseId) ? r : undefined;
  const rec = visible(record ?? findReceivingRecord(receiptId, recordsInScope(scope, records)));

  const header = (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn} accessibilityLabel="Back">
          <ArrowBackIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receiving History Detail</Text>
      </View>
    </View>
  );

  if (!canView || rec === undefined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        {header}
        <View style={[styles.container, styles.contentPad]}>
          <PermissionNote
            message={!canView ? 'You do not have permission to view goods receipts.' : 'Receipt not found.'}
          />
        </View>
      </SafeAreaView>
    );
  }

  const tone = resultTone(rec.result);
  const varianceKg = rec.receivedKg - rec.expectedKg;
  const variancePct = rec.expectedKg > 0 ? Math.round((Math.abs(varianceKg) / rec.expectedKg) * 100) : 0;
  const tiles = [
    { key: 'timeline', label: 'Timeline', icon: <TimelineIcon size={24} />, onPress: onNavigateTimeline },
    { key: 'discrepancy', label: 'Discrepancy', icon: <WarningCircleIcon size={24} />, onPress: onNavigateDiscrepancy },
    {
      key: 'batch',
      label: 'Batch Link',
      icon: <QrCodeIcon size={24} />,
      onPress: canViewBatch ? onNavigateBatch : undefined,
    },
    { key: 'shipment', label: 'Shipment Link', icon: <TruckIcon size={24} />, onPress: onNavigateShipment },
  ].filter(t => t.onPress !== undefined);
  const showTakeAction = onTakeAction !== undefined && rec.result === 'Open' && can(RECEIVING_CODES.receiptRecord);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      {header}

      <ScrollView style={styles.container} contentContainerStyle={styles.contentPad} showsVerticalScrollIndicator={false}>
        {/* ─── Receipt History Detail Card ─── */}
        <View style={styles.detailCard}>
          <Text style={styles.cardHeading}>Receipt History Detail</Text>

          <View style={styles.infoGrid}>
            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Receipt ID</Text>
                <Text style={styles.gridValBold}>{rec.receiptId}</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Shipment ID</Text>
                <Text style={styles.gridValBold}>{rec.shipmentId}</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Warehouse</Text>
                <Text style={styles.gridValBold}>{rec.warehouseName}</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Result</Text>
                <View style={[styles.resultPill, { backgroundColor: tone.bg }]}>
                  <Text style={[styles.resultPillText, { color: tone.text }]}>{rec.result}</Text>
                </View>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Received By</Text>
                <Text style={styles.gridValBold}>{rec.receivedBy}</Text>
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Date</Text>
                <Text style={styles.gridValBold}>{rec.date}</Text>
              </View>
            </View>
          </View>

          {/* Product & Quantity Sub-strip */}
          <View style={styles.productStrip}>
            <View>
              <Text style={styles.stripLabel}>Product Received</Text>
              <Text style={styles.stripVal}>
                {rec.product} · {rec.grade}
              </Text>
            </View>
            <View style={styles.stripRight}>
              <Text style={styles.stripLabel}>Accepted / Expected</Text>
              <Text style={[styles.stripVal, { color: adminColors.brand }]}>
                {rec.acceptedKg} KG / {rec.expectedKg} KG
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Action Navigation Tiles (only those the host wires) ─── */}
        {tiles.length > 0 && (
          <View style={styles.tilesGrid}>
            {tiles.map(t => (
              <TouchableOpacity key={t.key} style={styles.actionTile} onPress={t.onPress} activeOpacity={0.75}>
                {t.icon}
                <Text style={styles.tileLabel}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ─── Quantity summary (absorbed SW Goods Receipt Detail + wizard detail) ─── */}
        <Text style={styles.sectionHeader}>Quantity Summary</Text>
        <View style={styles.listCard}>
          <View style={styles.listRow}>
            <Text style={styles.listLabel}>Expected</Text>
            <Text style={styles.listValue}>{rec.expectedKg} KG</Text>
          </View>
          <View style={styles.listRow}>
            <Text style={styles.listLabel}>Received</Text>
            <Text style={styles.listValue}>{rec.receivedKg} KG</Text>
          </View>
          {varianceKg !== 0 && (
            <View style={styles.listRow}>
              <Text style={styles.listLabel}>Variance</Text>
              <Text style={[styles.listValue, { color: adminColors.danger.text }]}>
                {Math.abs(varianceKg)} KG ({variancePct}%)
              </Text>
            </View>
          )}
          <View style={styles.listRow}>
            <Text style={styles.listLabel}>Accepted</Text>
            <Text style={[styles.listValue, { color: adminColors.success.text }]}>{rec.acceptedKg} KG</Text>
          </View>
          <View style={[styles.listRow, styles.listRowLast]}>
            <Text style={styles.listLabel}>Rejected</Text>
            <Text style={[styles.listValue, rec.rejectedKg > 0 && { color: adminColors.danger.text }]}>
              {rec.rejectedKg} KG{rec.rejectionReason ? ` · ${rec.rejectionReason}` : ''}
            </Text>
          </View>
        </View>

        {/* ─── Receipt information: supplier / batch (internal traceability only, BR-16) ─── */}
        {(rec.supplier !== undefined || (rec.batchId !== undefined && canViewBatch)) && (
          <>
            <Text style={styles.sectionHeader}>Receipt Information</Text>
            <View style={styles.listCard}>
              {rec.supplier !== undefined && (
                <View style={[styles.listRow, !(rec.batchId !== undefined && canViewBatch) && styles.listRowLast]}>
                  <Text style={styles.listLabel}>Supplier</Text>
                  <Text style={styles.listValue}>{rec.supplier}</Text>
                </View>
              )}
              {rec.batchId !== undefined && canViewBatch && (
                <View style={[styles.listRow, styles.listRowLast]}>
                  <Text style={styles.listLabel}>Batch</Text>
                  <Text style={styles.listValue}>{rec.batchId}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* ─── QC results ─── */}
        {rec.qcResults !== undefined && (
          <>
            <Text style={styles.sectionHeader}>QC Results</Text>
            <View style={styles.listCard}>
              {QC_CRITERIA.map((crit, idx) => {
                const r = rec.qcResults?.[crit.id] ?? 'pass';
                return (
                  <View key={crit.id} style={[styles.listRow, idx === QC_CRITERIA.length - 1 && styles.listRowLast]}>
                    <Text style={styles.listLabel}>{crit.title}</Text>
                    {r === 'pass' ? (
                      <CheckmarkCircleOutlineIcon color={adminColors.success.text} size={18} />
                    ) : r === 'fail' ? (
                      <CrossCircleIcon color={adminColors.danger.text} size={18} />
                    ) : (
                      <WarningTriangleIcon color={adminColors.warning.text} size={16} />
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ─── Timeline ─── */}
        {rec.timeline !== undefined && rec.timeline.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Timeline</Text>
            <View style={styles.timelineCard}>
              {rec.timeline.map((evt, idx) => {
                const isLast = idx === (rec.timeline?.length ?? 0) - 1;
                return (
                  <View key={`${evt.title}-${evt.time}`} style={styles.timelineRow}>
                    <View style={styles.timelineLineCol}>
                      <View style={styles.timelineDotOuter}>
                        <View style={styles.timelineDotInner} />
                      </View>
                      {!isLast && <View style={styles.timelineConnectorLine} />}
                    </View>
                    <View style={styles.timelineContentCol}>
                      <Text style={styles.timelineEventTitle}>{evt.title}</Text>
                      <Text style={styles.timelineEventTime}>{evt.time}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ─── Notes ─── */}
        {rec.notes !== undefined && (
          <>
            <Text style={styles.sectionHeader}>Notes</Text>
            <View style={styles.listCard}>
              <Text style={styles.notesText}>{rec.notes}</Text>
            </View>
          </>
        )}

        {showTakeAction && (
          <TouchableOpacity style={styles.primaryBtn} onPress={onTakeAction} activeOpacity={0.8}>
            <ClipboardChecklistIcon color={adminColors.onBrand} size={18} />
            <Text style={styles.primaryBtnText}>Take Action</Text>
          </TouchableOpacity>
        )}

        {/* Bottom Return Action */}
        <TouchableOpacity style={styles.returnBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.returnBtnText}>← Back to Receiving History</Text>
        </TouchableOpacity>

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: adminSpacing.xs,
    marginRight: 2,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  contentPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  cardHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: 14,
  },
  infoGrid: {
    gap: 14,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    ...adminType.rowMeta,
    fontWeight: '600',
    color: adminColors.muted,
    marginBottom: 3,
  },
  gridValBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  resultPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  resultPillText: {
    ...adminType.caption,
  },
  productStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 10,
    marginTop: 14,
  },
  stripRight: {
    alignItems: 'flex-end',
  },
  stripLabel: {
    ...adminType.rowMeta,
    fontWeight: '700',
    color: adminColors.muted,
  },
  stripVal: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: 2,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  actionTile: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  tileLabel: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: adminSpacing.sm,
  },
  sectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    marginTop: adminSpacing.xs,
  },
  listCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xs,
    marginBottom: adminSpacing.lg,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  listLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  listValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
  timelineCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineLineCol: {
    alignItems: 'center',
    width: 28,
  },
  timelineDotOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: adminColors.success.text,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: adminColors.success.text,
  },
  timelineConnectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: adminColors.border,
    minHeight: 28,
  },
  timelineContentCol: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: adminSpacing.lg,
  },
  timelineEventTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  timelineEventTime: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  notesText: {
    ...adminType.body,
    color: adminColors.muted,
    paddingVertical: adminSpacing.sm,
  },
  primaryBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  primaryBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  returnBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnBtnText: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.brand,
  },
});
