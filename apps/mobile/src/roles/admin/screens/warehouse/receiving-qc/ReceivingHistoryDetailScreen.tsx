/**
 * Receiving History Detail (design M2-15 "Receipt History Detail", FINAL_LIST
 * #91), shared by the Main and Sub warehouse admins, and the Goods Receiving
 * wizard's receipt_detail step.
 *
 * One receipt-detail design instead of three: this screen absorbed
 * SubWarehouseGoodsReceiptDetailScreen and replaces the wizard's inline
 * receipt detail. Sections render when the receipt carries the data.
 *
 * Live data: the receipt by uuid with its latest quality check (useReceipt,
 * BR-119 / BR-120: received-by and checked-by names, condition levels,
 * damaged / spoiled, rejection reason, assigned vs listed grade, batch code)
 * and its purchase order (usePurchaseOrder: the farmer's name as Supplier, an
 * admin-only surface; never a farm location, BR-16). The timeline lists only
 * the events the API records (received = the arrival, quality checked); the
 * Main "Historical Discrepancy" view lists the receipt's persisted damage /
 * mismatch reports (useReceiptDiscrepancies, BR-121).
 *
 * Read-only: nothing here mutates. "Take Action" (a receipt still awaiting
 * its quality check) and the Discrepancy link only hand control to the host.
 *
 * Scope: a receipt of another warehouse answers 404 and resolves to "not
 * found", never to a forbidden state (CLAUDE.md 2.1: no existence leak).
 * Gate: inventory.batch.view or inventory.goods_receipt.record to view; the
 * Batch Link needs inventory.batch.view and a batch on the receipt.
 */
import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  CheckmarkCircleOutlineIcon,
  ClipboardChecklistIcon,
  CrossCircleIcon,
  PermissionNote,
  RECEIVING_CODES,
} from './ReceivingParts';
import type { LiveReceiptDetail } from './liveTypes';
import { isMainScope, kgLabel, receivingWarehouseFilter } from './mappers';
import { isNotFoundError, liveReceiptTone, receiptTimelineOf } from './receivingLists';
import { quantityDetailOf } from './receivingViews';
import { usePurchaseOrder, useReceipt, useReceiptDiscrepancies, useReceivingNaming } from './useReceivingData';
import type { WarehouseScreenBaseProps } from './types';

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

/** What a host needs to act on the receipt shown (both uuids). */
export interface ReceiptRef {
  receiptId: string;
  purchaseOrderId: string;
}

export interface ReceivingHistoryDetailScreenProps extends WarehouseScreenBaseProps {
  /** The goods receipt (uuid); the screen reads it. */
  receiptId?: string | undefined;
  onNavigateTimeline?: (() => void) | undefined;
  /** Sub: the Discrepancy tile (the host opens the wizard's Damage / Mismatch step for this receipt). */
  onNavigateDiscrepancy?: ((receipt: ReceiptRef) => void) | undefined;
  /** Batch Link: the batch the receipt was stocked as (only when it has one). */
  onViewBatch?: ((batchId: string) => void) | undefined;
  /** Shipment Link: the receipt's purchase order (uuid). */
  onNavigateShipment?: ((purchaseOrderId: string) => void) | undefined;
  /** A receipt still awaiting its quality check: hand it to the host (resume in the wizard). Not a mutation. */
  onTakeAction?: ((receipt: ReceiptRef) => void) | undefined;
  /** Label of the bottom return button (the wizard returns to a step, not to the history list). */
  backLabel?: string | undefined;
}

/** "480 KG", or '' when the weight is unknown (the row is then hidden). */
function kg(grams: number | null): string {
  return grams === null ? '' : kgLabel(grams);
}

export function ReceivingHistoryDetailScreen({
  scope,
  can,
  onBack,
  receiptId,
  onNavigateTimeline,
  onNavigateDiscrepancy,
  onViewBatch,
  onNavigateShipment,
  onTakeAction,
  backLabel = '← Back to Receiving History',
}: ReceivingHistoryDetailScreenProps) {
  const canView = can(RECEIVING_CODES.batchView) || can(RECEIVING_CODES.receiptRecord);
  const canViewBatch = can(RECEIVING_CODES.batchView);
  const [historySubView, setHistorySubView] = useState<'detail' | 'timeline' | 'discrepancy'>('detail');

  const naming = useReceivingNaming(scope, can);
  const warehouseId = receivingWarehouseFilter(scope, undefined);
  const read = useReceipt(warehouseId, canView ? receiptId : undefined, naming.naming);
  const rec: LiveReceiptDetail | undefined = read.receipt;
  // Same query as the one useReceipt makes for the order's quantity: read once.
  const order = usePurchaseOrder(warehouseId, rec?.purchaseOrderId, naming.naming);
  const discrepancies = useReceiptDiscrepancies(warehouseId, historySubView === 'discrepancy' ? rec?.id : undefined);
  const now = useMemo(() => new Date(), [rec]);
  const timeline = useMemo(() => (rec === undefined ? [] : receiptTimelineOf(rec, now)), [rec, now]);

  const header = (
    <View style={[styles.header, isMainScope(scope) && { backgroundColor: adminColors.brand }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn} accessibilityLabel="Back">
          <ArrowBackIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receiving History Detail</Text>
      </View>
    </View>
  );

  const notFound = rec === undefined && (receiptId === undefined || isNotFoundError(read.error));
  if (canView && !notFound && rec === undefined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        {header}
        <View style={styles.container}>
          {read.isLoading ? <AdminLoadingState /> : <AdminErrorState error={read.error} onRetry={read.refresh} />}
        </View>
      </SafeAreaView>
    );
  }

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

  const ref: ReceiptRef = { receiptId: rec.id, purchaseOrderId: rec.purchaseOrderId };
  const batchId = rec.batchId;
  const openBatch = batchId !== undefined && canViewBatch && onViewBatch ? () => onViewBatch(batchId) : undefined;
  const openShipment = onNavigateShipment ? () => onNavigateShipment(rec.purchaseOrderId) : undefined;
  // The detail grid: a value the API did not carry is not rendered.
  const gridRows = [
    [
      { label: t('receiving.history.receiptId'), value: rec.receiptId },
      { label: t('receiving.history.shipmentId'), value: rec.shipmentId },
    ],
    [
      { label: t('receiving.history.warehouse'), value: rec.warehouseName },
      { label: t('receiving.history.result'), value: rec.resultLabel, pill: true },
    ],
    [
      { label: t('receiving.history.receivedBy'), value: rec.receivedBy ?? '' },
      { label: t('receiving.history.date'), value: rec.day },
    ],
  ]
    .map((row) => row.filter((f) => f.value !== ''))
    .filter((row) => row.length > 0);

  if (isMainScope(scope)) {
    if (historySubView === 'timeline') {
      return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: adminColors.canvas }]}>
          <StatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />
          <View style={[styles.header, { backgroundColor: adminColors.canvas, borderBottomWidth: 1, borderBottomColor: adminColors.border }]}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => setHistorySubView('detail')} activeOpacity={0.7} style={styles.backBtn} accessibilityLabel="Back">
                <ArrowBackIcon size={22} color={adminColors.brandDeep} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: adminColors.brandDeep }]}>Historical Timeline</Text>
            </View>
          </View>

          <ScrollView style={[styles.container, { backgroundColor: adminColors.canvas }]} contentContainerStyle={styles.contentPad} showsVerticalScrollIndicator={false}>
            <Text style={[styles.cardHeading, { color: adminColors.brandDeep, marginBottom: adminSpacing.md }]}>Historical Receiving Timeline</Text>

            <View style={[styles.detailCard, { paddingVertical: adminSpacing.md }]}>
              {timeline.map((row, idx, arr) => (
                <React.Fragment key={row.key}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: adminSpacing.sm }}>
                    <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>{row.title}</Text>
                    <Text style={{ ...adminType.caption, color: adminColors.muted }}>{row.time}</Text>
                  </View>
                  {idx < arr.length - 1 && (
                    <View style={{ borderBottomWidth: 1, borderBottomColor: adminColors.border, borderStyle: 'dashed' }} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    if (historySubView === 'discrepancy') {
      return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: adminColors.canvas }]}>
          <StatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />
          <View style={[styles.header, { backgroundColor: adminColors.canvas, borderBottomWidth: 1, borderBottomColor: adminColors.border }]}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={() => setHistorySubView('detail')} activeOpacity={0.7} style={styles.backBtn} accessibilityLabel="Back">
                <ArrowBackIcon size={22} color={adminColors.brandDeep} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: adminColors.brandDeep }]}>Historical Discrepancy</Text>
            </View>
          </View>

          <ScrollView style={[styles.container, { backgroundColor: adminColors.canvas }]} contentContainerStyle={styles.contentPad} showsVerticalScrollIndicator={false}>
            <Text style={[styles.cardHeading, { color: adminColors.brandDeep, marginBottom: adminSpacing.md }]}>Historical Discrepancy</Text>

            {discrepancies.items.length === 0 ? (
              discrepancies.isLoading ? (
                <AdminLoadingState />
              ) : discrepancies.error !== null && discrepancies.error !== undefined ? (
                <AdminErrorState error={discrepancies.error} onRetry={discrepancies.refresh} />
              ) : (
                <AdminEmptyState title={t('receiving.history.noDiscrepancies')} />
              )
            ) : (
              <View style={[styles.detailCard, { paddingVertical: adminSpacing.md }]}>
                {discrepancies.items.map((d, idx) => (
                  <React.Fragment key={d.id}>
                    {idx > 0 && <View style={{ borderBottomWidth: 1, borderBottomColor: adminColors.border, marginVertical: adminSpacing.xs }} />}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: adminSpacing.sm }}>
                      <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>{d.typeLabel}</Text>
                      <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>{`${d.expected} → ${d.actual}`}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: adminColors.canvas }]}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        {header}

        <ScrollView style={[styles.container, { backgroundColor: adminColors.canvas }]} contentContainerStyle={styles.contentPad} showsVerticalScrollIndicator={false}>
          {/* Receipt History Detail Card */}
          <View style={styles.detailCard}>
            <Text style={[styles.cardHeading, { color: adminColors.brandDeep }]}>Receipt History Detail</Text>

            <View style={styles.infoGrid}>
              {gridRows.map((row) => (
                <View key={row.map((f) => f.label).join('|')} style={styles.gridRow}>
                  {row.map((f) => (
                    <View key={f.label} style={styles.gridCol}>
                      <Text style={styles.gridLabel}>{f.label}</Text>
                      <Text style={styles.gridValBold}>{f.value}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* 4 Action Navigation Tiles (2x2 grid matching Screenshot 1); Batch Link only for a stocked receipt */}
          <View style={styles.tilesGrid}>
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => setHistorySubView('timeline')}
              activeOpacity={0.75}
            >
              <TimelineIcon size={24} color={adminColors.brand} />
              <Text style={styles.tileLabel}>Timeline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => setHistorySubView('discrepancy')}
              activeOpacity={0.75}
            >
              <WarningCircleIcon size={24} color={adminColors.brand} />
              <Text style={styles.tileLabel}>Discrepancy</Text>
            </TouchableOpacity>

            {openBatch !== undefined ? (
              <TouchableOpacity
                style={styles.actionTile}
                onPress={openBatch}
                activeOpacity={0.75}
              >
                <QrCodeIcon size={24} color={adminColors.brand} />
                <Text style={styles.tileLabel}>Batch Link</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.actionTile}
              onPress={openShipment}
              activeOpacity={0.75}
            >
              <TruckIcon size={24} color={adminColors.brand} />
              <Text style={styles.tileLabel}>Shipment Link</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const tone = adminColors[liveReceiptTone(rec.result)];
  const qc = rec.qualityCheck;
  const quantity = quantityDetailOf(rec.expectedGrams, rec.receivedGrams);
  const variancePct =
    quantity.absGrams !== null && rec.expectedGrams !== null && rec.expectedGrams > 0
      ? Math.round((quantity.absGrams / rec.expectedGrams) * 100)
      : null;
  const rejectionReason = qc?.rejectionReasonLabel ?? rec.rejectionReason;
  const supplier = order.shipment?.from;
  const tiles = [
    { key: 'timeline', label: 'Timeline', icon: <TimelineIcon size={24} />, onPress: onNavigateTimeline },
    {
      key: 'discrepancy',
      label: 'Discrepancy',
      icon: <WarningCircleIcon size={24} />,
      onPress: onNavigateDiscrepancy ? () => onNavigateDiscrepancy(ref) : undefined,
    },
    { key: 'batch', label: 'Batch Link', icon: <QrCodeIcon size={24} />, onPress: openBatch },
    { key: 'shipment', label: 'Shipment Link', icon: <TruckIcon size={24} />, onPress: openShipment },
  ].filter(t => t.onPress !== undefined);
  const showTakeAction = onTakeAction !== undefined && rec.result === 'Awaiting QC' && can(RECEIVING_CODES.receiptRecord);
  // Receipt information (internal traceability only, BR-16): only the rows the API carries.
  const infoRows = [
    { key: 'supplier', label: t('receiving.history.supplier'), value: supplier ?? '' },
    { key: 'batch', label: t('receiving.doc.batch'), value: canViewBatch ? rec.batchCode ?? '' : '' },
    { key: 'listedGrade', label: t('receiving.doc.listedGrade'), value: qc?.listedGrade ?? '' },
    { key: 'assignedGrade', label: t('receiving.doc.assignedGrade'), value: qc?.assignedGrade ?? '' },
    { key: 'checkedBy', label: t('receiving.doc.checkedBy'), value: qc?.checkedBy ?? '' },
  ].filter((r) => r.value !== '');
  const quantityRows = [
    { key: 'expected', label: t('receiving.stat.expected'), value: kg(rec.expectedGrams) },
    { key: 'received', label: t('receiving.stat.received'), value: kg(rec.receivedGrams) },
    {
      key: 'variance',
      label: t('receiving.history.variance'),
      value: quantity.absGrams !== null && quantity.absGrams > 0 && variancePct !== null ? `${kgLabel(quantity.absGrams)} (${variancePct}%)` : '',
      color: adminColors.danger.text,
    },
    { key: 'accepted', label: t('receiving.stat.accepted'), value: kg(rec.acceptedGrams), color: adminColors.success.text },
    {
      key: 'rejected',
      label: t('receiving.stat.rejected'),
      value: rec.rejectedGrams === null ? '' : `${kgLabel(rec.rejectedGrams)}${rejectionReason ? ` · ${rejectionReason}` : ''}`,
      color: rec.rejectedGrams !== null && rec.rejectedGrams > 0 ? adminColors.danger.text : undefined,
    },
    { key: 'damaged', label: t('receiving.doc.damaged'), value: qc === null ? '' : kg(qc.damagedGrams) },
    { key: 'spoiled', label: t('receiving.doc.spoiled'), value: qc === null ? '' : kg(qc.spoiledGrams) },
  ].filter((r) => r.value !== '');
  const qcPoints = qc?.points ?? [];
  const notes = qc?.defectNotes;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      {header}

      <ScrollView style={styles.container} contentContainerStyle={styles.contentPad} showsVerticalScrollIndicator={false}>
        {/* ─── Receipt History Detail Card ─── */}
        <View style={styles.detailCard}>
          <Text style={styles.cardHeading}>Receipt History Detail</Text>

          <View style={styles.infoGrid}>
            {gridRows.map((row) => (
              <View key={row.map((f) => f.label).join('|')} style={styles.gridRow}>
                {row.map((f) => (
                  <View key={f.label} style={styles.gridCol}>
                    <Text style={styles.gridLabel}>{f.label}</Text>
                    {'pill' in f && f.pill ? (
                      <View style={[styles.resultPill, { backgroundColor: tone.bg }]}>
                        <Text style={[styles.resultPillText, { color: tone.text }]}>{f.value}</Text>
                      </View>
                    ) : (
                      <Text style={styles.gridValBold}>{f.value}</Text>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* Product & Quantity Sub-strip */}
          <View style={styles.productStrip}>
            <View>
              <Text style={styles.stripLabel}>Product Received</Text>
              <Text style={styles.stripVal}>
                {rec.grade !== '' ? `${rec.product} · ${rec.grade}` : rec.product}
              </Text>
            </View>
            {rec.acceptedGrams !== null && rec.expectedGrams !== null ? (
              <View style={styles.stripRight}>
                <Text style={styles.stripLabel}>Accepted / Expected</Text>
                <Text style={[styles.stripVal, { color: adminColors.brand }]}>
                  {kgLabel(rec.acceptedGrams)} / {kgLabel(rec.expectedGrams)}
                </Text>
              </View>
            ) : null}
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
        {quantityRows.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Quantity Summary</Text>
            <View style={styles.listCard}>
              {quantityRows.map((row, idx) => (
                <View key={row.key} style={[styles.listRow, idx === quantityRows.length - 1 && styles.listRowLast]}>
                  <Text style={styles.listLabel}>{row.label}</Text>
                  <Text style={[styles.listValue, row.color !== undefined && { color: row.color }]}>{row.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ─── Receipt information: supplier / batch / grades / inspector (internal traceability only, BR-16) ─── */}
        {infoRows.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Receipt Information</Text>
            <View style={styles.listCard}>
              {infoRows.map((row, idx) => (
                <View key={row.key} style={[styles.listRow, idx === infoRows.length - 1 && styles.listRowLast]}>
                  <Text style={styles.listLabel}>{row.label}</Text>
                  <Text style={styles.listValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ─── QC results (the recorded check, BR-120) ─── */}
        {qcPoints.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>QC Results</Text>
            <View style={styles.listCard}>
              {qcPoints.map((point, idx) => (
                <View key={point.criterionId} style={[styles.listRow, idx === qcPoints.length - 1 && styles.listRowLast]}>
                  <Text style={styles.listLabel}>
                    {point.conditionLabel !== undefined
                      ? `${t(`receiving.wizard.qc.${point.criterionId}`)} · ${point.conditionLabel}`
                      : t(`receiving.wizard.qc.${point.criterionId}`)}
                  </Text>
                  {point.result === 'pass' ? (
                    <CheckmarkCircleOutlineIcon color={adminColors.success.text} size={18} />
                  ) : (
                    <CrossCircleIcon color={adminColors.danger.text} size={18} />
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* ─── Timeline (the events the API records) ─── */}
        {timeline.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Timeline</Text>
            <View style={styles.timelineCard}>
              {timeline.map((evt, idx) => {
                const isLast = idx === timeline.length - 1;
                return (
                  <View key={evt.key} style={styles.timelineRow}>
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

        {/* ─── Notes (the inspector's defect notes) ─── */}
        {notes !== undefined && (
          <>
            <Text style={styles.sectionHeader}>Notes</Text>
            <View style={styles.listCard}>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          </>
        )}

        {showTakeAction && (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => onTakeAction?.(ref)} activeOpacity={0.8}>
            <ClipboardChecklistIcon color={adminColors.onBrand} size={18} />
            <Text style={styles.primaryBtnText}>Take Action</Text>
          </TouchableOpacity>
        )}

        {/* Bottom Return Action */}
        <TouchableOpacity style={styles.returnBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.returnBtnText}>{backLabel}</Text>
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
