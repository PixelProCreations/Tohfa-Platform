// Design id: M3S15 (Stock Movement, M3-16), with the movement voucher (M3S18) as an in-screen view.
/**
 * One stock ledger row, opened from a Stock Ledger row
 * (GET /admin/stock-ledger, inventory.stock_ledger.view_own). The flow hands
 * this screen the row the user tapped (movementParam); without one (a deep
 * link) it shows "not found". Read-only: the ledger is append-only (BR-37).
 * Every element of the design renders; values come from movementDetailView,
 * which puts ADMIN_NO_VALUE where the API carries nothing.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { isAreaAvailable } from '../availability';
import { AdminEmptyState } from '../shared/AsyncStates';
import { SWAHeader } from '../../swa/components';
import { movementAdjustmentId, movementDetailView, type MovementDetailView } from './movementDetailMappers';
import type { InventoryScreenBaseProps, StockMovementRow } from './types';

export interface MovementDetailScreenProps extends InventoryScreenBaseProps {
  /** The tapped ledger row; undefined when the route carried none. */
  movement: StockMovementRow | undefined;
  /** The row's warehouse, named from the scope or GET /warehouses; undefined shows the dash. */
  warehouseName: string | undefined;
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

function TimelineGreenDot() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" stroke={adminColors.success.text} strokeWidth="2.5" fill={adminColors.card} />
      <Path d="M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z" fill={adminColors.success.text} />
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

function CheckCircleGreenIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={adminColors.success.bg} stroke={adminColors.success.text} strokeWidth="1.8" />
      <Path d="M8 12.5l2.5 2.5 5.5-5.5" stroke={adminColors.success.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ShareIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <View style={full ? styles.fullCol : styles.col}>
      <Text style={styles.colLabel}>{label}</Text>
      <Text style={styles.colValue}>{value}</Text>
    </View>
  );
}

/** The movement voucher (design M3S18): an in-screen view, not a route. */
function MovementVoucher({ view, outflow, onClose }: { view: MovementDetailView; outflow: boolean; onClose: () => void }) {
  return (
    <>
      <View style={styles.voucherCard}>
        <View style={styles.voucherHeaderRow}>
          <View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{t('inventory.stockMovement.badge', { type: view.typeLabel, status: view.status })}</Text>
            </View>
            <Text style={styles.voucherIdText}>{view.movementId}</Text>
            <Text style={styles.voucherDateText}>{view.dateTime}</Text>
          </View>
          <View style={styles.qrContainer}>
            <QrIcon size={36} />
          </View>
        </View>

        <View style={styles.voucherDashedLine} />

        <View style={styles.twoColRow}>
          <Field label={t('inventory.stockMovement.receipt.product')} value={view.productLabel} />
          <View style={styles.col}>
            <Text style={styles.colLabel}>{t('inventory.stockMovement.receipt.quantity')}</Text>
            <Text style={[styles.colValue, styles.brandValue]}>{view.delta}</Text>
          </View>
        </View>
        <View style={[styles.twoColRow, styles.rowGap]}>
          <Field label={t('inventory.stockMovement.receipt.warehouse')} value={view.warehouse} />
          <Field label={t('inventory.stockMovement.receipt.location')} value={view.location} />
        </View>
        <View style={[styles.twoColRow, styles.rowGap]}>
          <Field label={t('inventory.stockMovement.receipt.batch')} value={view.batch} />
          <Field label={t('inventory.stockMovement.receipt.refDoc')} value={view.reference} />
        </View>

        <View style={styles.voucherDashedLine} />

        <View style={styles.qcVerifiedBox}>
          <CheckCircleGreenIcon />
          <View style={styles.qcTextCol}>
            <Text style={styles.qcTitleText}>{t('inventory.stockMovement.receipt.verified')}</Text>
            <Text style={styles.qcSubText}>
              {view.approvedBy === undefined
                ? ADMIN_NO_VALUE
                : t('inventory.stockMovement.receipt.approvedBy', { name: view.approvedBy })}
            </Text>
          </View>
        </View>

        <View style={styles.auditBox}>
          <Text style={styles.auditTitle}>{t('inventory.stockMovement.receipt.auditTitle')}</Text>
          <View style={styles.auditRow}>
            <Text style={styles.auditKey}>{t('inventory.stockMovement.receipt.opening')}</Text>
            <Text style={styles.auditVal}>{view.before}</Text>
          </View>
          <View style={styles.auditRow}>
            <Text style={styles.auditKey}>
              {t(outflow ? 'inventory.stockMovement.receipt.outward' : 'inventory.stockMovement.receipt.inward')}
            </Text>
            <Text style={[styles.auditVal, outflow ? styles.outValue : styles.inValue]}>{view.delta}</Text>
          </View>
          <View style={[styles.auditRow, styles.auditTotalRow]}>
            <Text style={[styles.auditKey, styles.auditTotalKey]}>{t('inventory.stockMovement.receipt.closing')}</Text>
            <Text style={[styles.auditVal, styles.auditTotalVal]}>{view.after}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        {/* No share / print contract exists in docs/openapi.yaml: the button is drawn, inert. */}
        <TouchableOpacity style={[styles.primaryActionBtn, styles.inert]} activeOpacity={0.8} disabled>
          <ShareIcon />
          <Text style={styles.primaryActionBtnText}>{t('inventory.stockMovement.receipt.share')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryActionBtn} activeOpacity={0.8} onPress={onClose}>
          <Text style={styles.secondaryActionBtnText}>{t('inventory.stockMovement.receipt.back')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

export function MovementDetailScreen({ can, onNavigate, onBack, movement, warehouseName }: MovementDetailScreenProps) {
  const [voucherOpen, setVoucherOpen] = useState(false);
  // View Reference opens a stock adjustment (M3S17), an area behind its own permission.
  const canAdjust = isAreaAvailable('stockAdjustments', can);

  if (movement === undefined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <SWAHeader title={t('inventory.stockMovement.title')} onBack={onBack} />
          <AdminEmptyState title={t('inventory.movementDetail.notFound')} />
        </View>
      </SafeAreaView>
    );
  }

  const view = movementDetailView(movement, warehouseName);
  const outflow = movement.direction === 'out';
  const adjustmentId = movementAdjustmentId(movement);
  const openReference =
    canAdjust ? (
      adjustmentId === undefined ? undefined : () => onNavigate?.('M3S17', { adjustmentId })
    ) : undefined;

  if (voucherOpen) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <SWAHeader title={t('inventory.stockMovement.receipt.title')} onBack={() => setVoucherOpen(false)} />
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <MovementVoucher view={view} outflow={outflow} onClose={() => setVoucherOpen(false)} />
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <SWAHeader
          title={t('inventory.stockMovement.title')}
          onBack={onBack}
          rightAction={
            <TouchableOpacity
              style={styles.moreButton}
              activeOpacity={0.7}
              accessibilityLabel={t('inventory.stockMovement.openReceipt')}
              onPress={() => setVoucherOpen(true)}
            >
              <MoreDotsIcon />
            </TouchableOpacity>
          }
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Top Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.receiptBadge}>
              <Text style={styles.receiptBadgeText}>{t('inventory.stockMovement.badge', { type: view.typeLabel, status: view.status })}</Text>
            </View>
            <Text style={styles.movementIdBig}>{view.movementId}</Text>
          </View>

          {/* Movement Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('inventory.stockMovement.summary')}</Text>
            <View style={styles.infoCard}>
              <View style={styles.twoColRow}>
                <Field label={t('inventory.stockMovement.movementType')} value={view.typeLabel} />
                <Field label={t('inventory.stockMovement.status')} value={view.status} />
              </View>
              <View style={[styles.twoColRow, styles.rowGap]}>
                <Field label={t('inventory.stockMovement.movementId')} value={view.movementId} />
                <Field label={t('inventory.stockMovement.warehouse')} value={view.warehouse} />
              </View>
              <View style={[styles.twoColRow, styles.rowGap]}>
                <Field full label={t('inventory.stockMovement.dateTime')} value={view.dateTime} />
              </View>
            </View>
          </View>

          {/* Product Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('inventory.stockMovement.productInfo')}</Text>
            <View style={styles.infoCard}>
              <View style={styles.twoColRow}>
                <Field label={t('inventory.stockMovement.product')} value={view.product} />
                <Field label={t('inventory.stockMovement.grade')} value={view.grade} />
              </View>
              <View style={[styles.twoColRow, styles.rowGap]}>
                <Field label={t('inventory.stockMovement.unit')} value={t('inventory.stockMovement.unitKg')} />
                <Field label={t('inventory.stockMovement.batch')} value={view.batch} />
              </View>
            </View>
          </View>

          {/* Quantity Movement */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('inventory.stockMovement.quantitySection')}</Text>
            <View style={styles.quantityCard}>
              <Text style={[styles.quantityCardLabel, outflow ? styles.outValue : null]}>{t('inventory.stockMovement.quantityLabel')}</Text>
              <Text style={[styles.quantityBigValue, outflow ? styles.outValue : null]}>{view.delta}</Text>
              <View style={styles.flowRow}>
                <View style={styles.flowStep}>
                  <Text style={styles.flowStepValue}>{view.before}</Text>
                  <Text style={styles.flowStepLabel}>{t('inventory.stockMovement.before')}</Text>
                </View>
                <Text style={styles.flowArrow}>→</Text>
                <View style={styles.flowStep}>
                  <Text style={[styles.flowStepValueGreen, outflow ? styles.outValue : null]}>{view.delta}</Text>
                  <Text style={[styles.flowStepLabelGreen, outflow ? styles.outValue : null]}>{t('inventory.stockMovement.movement')}</Text>
                </View>
                <Text style={styles.flowArrow}>→</Text>
                <View style={styles.flowStep}>
                  <Text style={styles.flowStepValue}>{view.after}</Text>
                  <Text style={styles.flowStepLabel}>{t('inventory.stockMovement.after')}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Storage Location: the API carries no storage type / section / rack / shelf for a batch, so each is the dash. */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('inventory.stockMovement.storage')}</Text>
            <View style={styles.infoCard}>
              <View style={styles.twoColRow}>
                <Field label={t('inventory.stockMovement.storageType')} value={view.storageType} />
                <Field label={t('inventory.stockMovement.section')} value={view.section} />
              </View>
              <View style={[styles.twoColRow, styles.rowGap]}>
                <Field label={t('inventory.stockMovement.rack')} value={view.rack} />
                <Field label={t('inventory.stockMovement.shelf')} value={view.shelf} />
              </View>
            </View>
          </View>

          {/* Reference */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('inventory.stockMovement.reference')}</Text>
            <View style={styles.infoCard}>
              <View style={styles.twoColRow}>
                <Field label={view.referenceLabel} value={view.referenceValue} />
                <Field label={t('inventory.stockMovement.receivedFrom')} value={view.receivedFrom} />
              </View>
              <View style={[styles.twoColRow, styles.rowGap]}>
                <Field full label={t('inventory.stockMovement.relatedBatch')} value={view.batch} />
              </View>
            </View>
          </View>

          {/* Performed By (BR-130: createdByName) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('inventory.stockMovement.performedBySection')}</Text>
            <View style={styles.infoCard}>
              <View style={styles.twoColRow}>
                <Field label={t('inventory.stockMovement.performedBy')} value={view.performedBy} />
                <Field label={t('inventory.stockMovement.dateTime')} value={view.dateTime} />
              </View>
            </View>
          </View>

          {/* Notes & Evidence: the API carries no photos for a ledger row. */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('inventory.stockMovement.notesSection')}</Text>
            <View style={styles.infoCard}>
              <Text style={styles.colLabel}>{t('inventory.stockMovement.notes')}</Text>
              <Text style={styles.notesText}>{view.notes}</Text>
              <View style={styles.evidenceThumbnailsRow}>
                <View style={styles.thumbnailBox}>
                  <Text style={styles.colLabel}>{ADMIN_NO_VALUE}</Text>
                </View>
                <View style={styles.thumbnailBox}>
                  <Text style={styles.colLabel}>{ADMIN_NO_VALUE}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Movement Timeline: only "Ledger Posted" has a time in the API. */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('inventory.stockMovement.timeline')}</Text>
            <View style={styles.timelineCard}>
              {view.timeline.map((event, index) => (
                <View key={event.labelKey} style={styles.timelineStepRow}>
                  <View style={styles.timelineIndicatorCol}>
                    <TimelineGreenDot />
                    {index < view.timeline.length - 1 ? <View style={styles.timelineVerticalLine} /> : null}
                  </View>
                  <View style={styles.timelineTextCol}>
                    <Text style={styles.timelineStepTitle}>{t(event.labelKey)}</Text>
                    <Text style={styles.timelineStepTime}>{event.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('inventory.stockMovement.actions')}</Text>
            <TouchableOpacity
              style={styles.actionOutlineBtn}
              onPress={() => onNavigate?.('M3S05', { batchId: movement.batchId })}
              activeOpacity={0.7}
            >
              <QrIcon />
              <Text style={styles.actionBtnText}>{t('inventory.stockMovement.viewBatch')}</Text>
            </TouchableOpacity>

            {/* Drawn always; it opens only a stock adjustment, and only with the adjustments area. */}
            <TouchableOpacity
              style={[styles.actionOutlineBtn, openReference === undefined ? styles.inert : null]}
              onPress={openReference}
              disabled={openReference === undefined}
              activeOpacity={0.7}
            >
              <DocumentReferenceIcon />
              <Text style={styles.actionBtnText}>{t('inventory.stockMovement.viewReference')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOutlineBtn}
              onPress={() => onNavigate?.('M3S06', { batchId: movement.batchId })}
              activeOpacity={0.7}
            >
              <HistoryLedgerIcon />
              <Text style={styles.actionBtnText}>{t('inventory.stockMovement.viewLedger')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionOutlineBtn} onPress={() => setVoucherOpen(true)} activeOpacity={0.7}>
              <DocumentReferenceIcon />
              <Text style={styles.actionBtnText}>{t('inventory.stockMovement.viewReceipt')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
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
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
  },
  heroCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 18,
    paddingHorizontal: adminSpacing.lg,
    alignItems: 'center',
    marginBottom: 14,
  },
  receiptBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.md,
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
    marginBottom: adminSpacing.sm,
  },
  infoCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
  },
  twoColRow: {
    flexDirection: 'row',
  },
  rowGap: {
    marginTop: adminSpacing.md,
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
  brandValue: {
    color: adminColors.brand,
  },
  inValue: {
    color: adminColors.success.text,
  },
  outValue: {
    color: adminColors.danger.text,
  },
  quantityCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 18,
    paddingHorizontal: adminSpacing.lg,
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
    marginTop: adminSpacing.sm,
    gap: adminSpacing.md,
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
    marginBottom: adminSpacing.md,
  },
  evidenceThumbnailsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  thumbnailBox: {
    width: 48,
    height: 48,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brandTint,
    borderWidth: 1.2,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
  },
  timelineStepRow: {
    flexDirection: 'row',
    minHeight: 46,
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
  },
  timelineVerticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: adminColors.success.text,
    marginVertical: 3,
  },
  timelineTextCol: {
    flex: 1,
    paddingBottom: 10,
  },
  timelineStepTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  timelineStepTime: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  actionOutlineBtn: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.lg,
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
  inert: {
    opacity: 0.5,
  },
  bottomSpacer: {
    height: 28,
  },
  // ── Voucher (design M3S18) ──
  voucherCard: {
    backgroundColor: adminColors.card,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    padding: 18,
    ...adminShadow.sm,
    marginBottom: adminSpacing.lg,
  },
  voucherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.xs,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  statusPillText: {
    ...adminType.caption,
    color: adminColors.onBrand,
    letterSpacing: 0.5,
  },
  voucherIdText: {
    ...adminType.title,
    color: adminColors.ink,
  },
  voucherDateText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  qrContainer: {
    width: 54,
    height: 54,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherDashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderStyle: 'dashed',
    marginVertical: 14,
  },
  qcVerifiedBox: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.success.bg,
    padding: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  qcTextCol: {
    flex: 1,
    marginLeft: 10,
  },
  qcTitleText: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
  },
  qcSubText: {
    ...adminType.rowMeta,
    color: adminColors.success.text,
  },
  auditBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  auditTitle: {
    ...adminType.caption,
    color: adminColors.brand,
    letterSpacing: 0.5,
    marginBottom: adminSpacing.sm,
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  auditTotalRow: {
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingTop: 6,
    marginTop: adminSpacing.xs,
  },
  auditKey: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  auditVal: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  auditTotalKey: {
    fontWeight: '700',
  },
  auditTotalVal: {
    fontWeight: '800',
    color: adminColors.brand,
  },
  actionsContainer: {
    gap: 10,
  },
  primaryActionBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...adminShadow.sm,
  },
  primaryActionBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  secondaryActionBtn: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionBtnText: {
    ...adminType.sectionHead,
    color: adminColors.brand,
  },
});
