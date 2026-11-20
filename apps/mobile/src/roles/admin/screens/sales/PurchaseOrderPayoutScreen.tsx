import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import type { PurchaseOrderRecord } from '../warehouse/sales-direct/types';

function BackArrowWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface PurchaseOrderPayoutScreenProps {
  order: PurchaseOrderRecord;
  onBack: () => void;
}

export function PurchaseOrderPayoutScreen({
  order,
  onBack,
}: PurchaseOrderPayoutScreenProps) {
  const [showIntimateModal, setShowIntimateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const initialStatus =
    (order as any).payoutStatus === 'Failed'
      ? 'Failed'
      : (order as any).payoutStatus === 'Paid'
      ? 'Paid'
      : 'Awaiting Super Admin Approval';
  const [payoutStatus, setPayoutStatus] = useState<string>(initialStatus);

  const payoutId = (order as any).payoutId || (order.id === '1' ? 'PY-0005' : order.id === '2' ? 'PY-0004' : 'PY-0002');
  const goodsReceiptId = (order as any).goodsReceiptId || 'GR-0002';
  const farmerId = (order as any).farmerId || 'FMR-00098';
  const formattedAmount = `₹${order.totalPrice.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const handleConfirmIntimate = () => {
    setShowIntimateModal(false);
    setPayoutStatus('Intimated · Processing');
    Alert.alert(
      'Payout Intimated',
      `Payout ${payoutId} for ${order.farmerName} (${formattedAmount}) has been intimated to the finance department.`
    );
  };

  const handleConfirmReject = () => {
    setShowRejectModal(false);
    setPayoutStatus('Rejected');
    Alert.alert(
      'Payout Rejected',
      `Payout ${payoutId} has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Top Header Banner ── */}
      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to purchase orders"
        >
          <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payout {payoutId}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Farmer Details ── */}
        <Text style={styles.sectionHeading}>1 · Farmer details</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Farmer ID</Text>
            <Text style={styles.detailValueBold}>{farmerId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Farmer name</Text>
            <Text style={styles.detailValueBold}>{order.farmerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Registered contact</Text>
            <Text style={styles.detailValueBold}>Not shown here</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Verified payout account</Text>
            <Text style={styles.detailValueBold}>•••• 0123</Text>
          </View>
        </View>

        {/* ── 2. Purchase Details ── */}
        <Text style={[styles.sectionHeading, { marginTop: 20 }]}>2 · Purchase details</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purchase order</Text>
            <Text style={styles.detailValueBold}>{order.poNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purchase date</Text>
            <Text style={styles.detailValueBold}>{order.dateStr}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Goods receipt</Text>
            <Text style={styles.detailValueBold}>{goodsReceiptId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Produce</Text>
            <Text style={styles.detailValueBold}>{order.produceName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Accepted quantity</Text>
            <Text style={styles.detailValueBold}>{order.quantityKg} kg</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Accepted grade</Text>
            <Text style={styles.detailValueBold}>{order.grade}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Unit price</Text>
            <Text style={styles.detailValueBold}>₹{order.unitPrice.toFixed(2)} per kg</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Purchase value</Text>
            <Text style={styles.detailValueBold}>{formattedAmount}</Text>
          </View>
        </View>

        {/* ── 3. Payout Calculation ── */}
        <Text style={[styles.sectionHeading, { marginTop: 20 }]}>3 · Payout calculation</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Accepted produce value</Text>
            <Text style={styles.detailValueBold}>{formattedAmount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Approved adjustments</Text>
            <Text style={styles.detailValueBold}>₹0.00</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Net payable amount</Text>
            <Text style={styles.detailValueBold}>{formattedAmount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Currency</Text>
            <Text style={styles.detailValueBold}>INR</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Calculation reference</Text>
            <Text style={styles.detailValueBold}>CALC-{payoutId}</Text>
          </View>
        </View>

        {/* ── 4. Approval History ── */}
        <Text style={[styles.sectionHeading, { marginTop: 20 }]}>4 · Approval history</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Requested by</Text>
            <Text style={styles.detailValueBold}>Demo TOHFA Admin, 9 Oct 2026, 10:00</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Approval</Text>
            <Text
              style={[
                styles.detailValueBold,
                payoutStatus === 'Rejected' && { color: adminColors.danger.text },
                payoutStatus.includes('Intimated') && { color: adminColors.success.text },
              ]}
            >
              {payoutStatus}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Approver</Text>
            <Text style={styles.detailValueBold}>—</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rejection reason</Text>
            <Text style={styles.detailValueBold}>{rejectionReason || '—'}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Processing reference</Text>
            <Text style={styles.detailValueBold}>—</Text>
          </View>
        </View>
        <View style={styles.historySubBlock}>
          <Text style={styles.historySubMeta}>9 Oct 2026, 10:00 · Demo TOHFA Admin</Text>
          <Text style={styles.historySubTitle}>
            Payout requested and escalated to the Super Admin: {formattedAmount}
          </Text>
        </View>

        {/* ── 5. Payment Information ── */}
        <Text style={[styles.sectionHeading, { marginTop: 20 }]}>5 · Payment information</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment method</Text>
            <Text style={styles.detailValueBold}>Bank transfer (configured)</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Provider reference</Text>
            <Text style={styles.detailValueBold}>—</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Initiated</Text>
            <Text style={styles.detailValueBold}>—</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Processed</Text>
            <Text style={styles.detailValueBold}>—</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Failure reason</Text>
            <Text style={styles.detailValueBold}>—</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Reconciliation status</Text>
            <Text style={styles.detailValueBold}>Not applicable</Text>
          </View>
        </View>

        {/* Super Admin Notice Banner */}
        <View style={styles.thresholdNoticeBanner}>
          <Text style={styles.thresholdNoticeText}>
            This amount is above ₹10,000.00, so it needs a Super Admin who is not the requester.
          </Text>
        </View>

        {/* ── Action Buttons Row ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowIntimateModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Intimate"
          >
            <Text style={styles.actionButtonText}>Intimate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowRejectModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Reject"
          >
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={onBack}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.actionButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>

      {/* ── 6. Intimate Payout Modal (Image 4) ── */}
      <Modal
        visible={showIntimateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowIntimateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowIntimateModal(false)}
        >
          <TouchableOpacity
            style={styles.modalSheet}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Intimate this payout?</Text>

            <View style={styles.modalCard}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Payout</Text>
                <Text style={styles.modalValueBold}>
                  {payoutId} · PO {order.poNumber}
                </Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Farmer</Text>
                <Text style={styles.modalValueBold}>{order.farmerName}</Text>
              </View>

              <View style={[styles.modalRow, styles.detailRowLast]}>
                <Text style={styles.modalLabel}>Amount</Text>
                <Text style={styles.modalValueBold}>{formattedAmount}</Text>
              </View>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={handleConfirmIntimate}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimaryBtnText}>Intimate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => setShowIntimateModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── 7. Reject Payout Modal (Matching Image 4 design) ── */}
      <Modal
        visible={showRejectModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRejectModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRejectModal(false)}
        >
          <TouchableOpacity
            style={styles.modalSheet}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Reject this payout?</Text>

            <View style={styles.modalCard}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Payout</Text>
                <Text style={styles.modalValueBold}>
                  {payoutId} · PO {order.poNumber}
                </Text>
              </View>

              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Farmer</Text>
                <Text style={styles.modalValueBold}>{order.farmerName}</Text>
              </View>

              <View style={[styles.modalRow, styles.detailRowLast]}>
                <Text style={styles.modalLabel}>Amount</Text>
                <Text style={styles.modalValueBold}>{formattedAmount}</Text>
              </View>
            </View>

            {/* Optional Rejection Reason */}
            <Text style={styles.modalInputLabel}>Reason for Rejection</Text>
            <TextInput
              style={styles.modalReasonInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter reason for rejecting payout..."
              placeholderTextColor={adminColors.placeholder}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalDangerBtn}
                onPress={handleConfirmReject}
                activeOpacity={0.8}
              >
                <Text style={styles.modalDangerBtnText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => setShowRejectModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: 16,
    paddingBottom: adminSpacing.xxxl,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: 10,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    ...adminShadow.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9.5,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    borderStyle: 'dashed',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    ...adminType.body,
    color: adminColors.muted,
    flex: 1,
  },
  detailValueBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    textAlign: 'right',
    flexShrink: 1,
  },
  historySubBlock: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  historySubMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 3,
  },
  historySubTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  thresholdNoticeBanner: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  thresholdNoticeText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  actionButtonText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },

  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  modalTitle: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: 16,
  },
  modalCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    borderStyle: 'dashed',
  },
  modalLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  modalValueBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  modalInputLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 6,
  },
  modalReasonInput: {
    height: 44,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    ...adminType.body,
    color: adminColors.ink,
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  modalPrimaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  modalDangerBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.danger.text,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDangerBtnText: {
    ...adminType.rowTitle,
    color: adminColors.danger.text,
  },
  modalSecondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  modalSheetFooterCode: {
    textAlign: 'center',
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 18,
  },
});
