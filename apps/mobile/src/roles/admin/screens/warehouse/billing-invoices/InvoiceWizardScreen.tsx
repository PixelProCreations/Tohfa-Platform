/**
 * Invoice Wizard: one screen with four internal steps (Transaction Summary ->
 * Invoice Items -> Customer Details -> Review Invoice) that ends at Invoice
 * Generated.
 *
 * Two entries:
 *   - From Generate Invoice (or the hub's Invoice Required card) with the
 *     picked `transaction`; starts at the summary step.
 *   - Post-sale from Sale Confirmation with a prefilled `review` summary;
 *     starts at the Review step, and back from it leaves the wizard.
 *
 * Gate (FINAL_LIST row 8): Generate Invoice renders only with invoice.generate
 * (a note says why otherwise). The server assigns the invoice number and
 * re-checks the permission (CLAUDE.md 2.1); this screen never counts numbers.
 *
 * Absorbs SubWarehouseReviewInvoiceScreen (its design comment says M9-S04,
 * which pair_table.csv gives to Generate Invoice) as the Review step: same
 * card, and its "Invoice Generation Failed" modal with Retry / Cancel replaces
 * the old demo failure alert. Overlay: the modal scrim was 55% translucent black;
 * it is the canvas token now (no translucent token exists; as CancelOrderScreen).
 */
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import {
  BillingButton,
  BillingFooter,
  BillingScreen,
  Card,
  InfoCard,
  InfoNote,
  PermissionNote,
  SectionTitle,
} from './BillingParts';
import { SAMPLE_GENERATED_INVOICE_ID, SAMPLE_INVOICE_DETAIL } from './fixtures';
import type { InvoiceReviewData, InvoiceWizardStep, WarehouseScreenBaseProps, WizardTransactionRecord } from './types';

export interface InvoiceWizardScreenProps extends WarehouseScreenBaseProps {
  /** Sale being invoiced (picker / Invoice Required entry). */
  transaction: WizardTransactionRecord;
  /** Post-sale entry: open on the Review step with this summary. */
  review?: InvoiceReviewData | undefined;
  /** Called with the server-assigned invoice number. */
  onSuccess: (invoiceId: string) => void;
}

const STEPS: readonly InvoiceWizardStep[] = ['summary', 'items', 'customer', 'review'];
const STEP_TITLES: Record<InvoiceWizardStep, string> = {
  summary: 'Transaction Summary',
  items: 'Invoice Items',
  customer: 'Customer Details',
  review: 'Review Invoice',
};

function ArrowRightIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={adminColors.onBrand} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckCircleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path d="M8 12l3 3 5-6" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={adminColors.info.text} strokeWidth="2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={adminColors.info.text} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="16" r="1" fill={adminColors.info.text} />
    </Svg>
  );
}

function ErrorCrossIcon() {
  return (
    <Svg width={34} height={34} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.danger.text} strokeWidth="2.2" />
      <Path d="M15 9l-6 6M9 9l6 6" stroke={adminColors.danger.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function InvoiceWizardScreen({
  scope,
  can,
  onBack,
  transaction,
  review,
  onSuccess,
}: InvoiceWizardScreenProps) {
  const enteredAtReview = review !== undefined;
  const [stepIndex, setStepIndex] = useState(enteredAtReview ? STEPS.length - 1 : 0);
  const [showFailure, setShowFailure] = useState(false);
  const canGenerate = can('invoice.generate');
  const step = STEPS[stepIndex] ?? 'summary';
  const detail = SAMPLE_INVOICE_DETAIL;
  const reviewData: InvoiceReviewData = review ?? {
    invoiceType: detail.invoiceType,
    customerName: transaction.customerName,
    itemsCount: detail.items.length,
    subtotal: detail.subtotal,
    gst: detail.gst,
    total: detail.total,
  };

  const handleBack = () => {
    if (stepIndex > 0 && !(enteredAtReview && step === 'review')) setStepIndex(stepIndex - 1);
    else onBack();
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    // Mock until the invoice API is wired (SPEC_GAPS W4g): the server returns the number.
    onSuccess(SAMPLE_GENERATED_INVOICE_ID);
  };

  const handleRetry = () => {
    setShowFailure(false);
    handleGenerate();
  };

  return (
    <BillingScreen
      title={STEP_TITLES[step]}
      onBack={handleBack}
      footer={
        <BillingFooter>
          {step !== 'review' ? (
            <BillingButton label="Continue" icon={<ArrowRightIcon />} onPress={() => setStepIndex(stepIndex + 1)} />
          ) : canGenerate ? (
            <BillingButton label="Generate Invoice" icon={<CheckCircleIcon />} onPress={handleGenerate} />
          ) : (
            <PermissionNote>You do not have permission to generate invoices.</PermissionNote>
          )}
        </BillingFooter>
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}>
          {STEPS.map((s, idx) => (
            <View
              key={s}
              style={[styles.dot, idx < stepIndex && styles.dotDone, idx === stepIndex && styles.dotActive]}
            />
          ))}
        </View>

        {step === 'summary' ? (
          <>
            <SectionTitle>Transaction Summary</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'Order', value: transaction.orderNumber || transaction.id },
                  { label: 'Customer', value: transaction.customerName },
                ],
                [
                  { label: 'Sales Channel', value: transaction.saleType },
                  { label: 'Warehouse', value: scope.warehouseName ?? detail.warehouseName ?? '—' },
                ],
                [{ label: 'Payment Status', value: detail.paymentStatus }],
              ]}
            />
          </>
        ) : null}

        {step === 'items' ? (
          <>
            <SectionTitle>Invoice Items</SectionTitle>
            <Card>
              {detail.items.map((item, index) => (
                <View key={`${item.name}-${index}`}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemTitle}>{item.name}</Text>
                      <Text style={styles.itemDesc}>
                        {item.grade} · {item.quantity} × {item.unitPrice}
                      </Text>
                    </View>
                    <Text style={styles.itemPrice}>{item.lineTotal}</Text>
                  </View>
                </View>
              ))}
            </Card>
            <InfoNote icon={<LockIcon />}>
              Items reflect the source transaction exactly — quantity and unit price cannot be changed from this
              screen.
            </InfoNote>

            <SectionTitle>Billing Summary</SectionTitle>
            <Card>
              {[
                ['Subtotal', detail.subtotal],
                ['Discount', detail.discount],
                ['GST', 'Where applicable'],
              ].map(([label, value]) => (
                <View key={label} style={styles.billingRow}>
                  <Text style={styles.billingLabel}>{label}</Text>
                  <Text style={styles.billingValue}>{value}</Text>
                </View>
              ))}
              <View style={styles.divider} />
              <View style={styles.billingRow}>
                <Text style={styles.billingTotalLabel}>Total</Text>
                <Text style={styles.billingTotalValue}>{detail.total}</Text>
              </View>
            </Card>

            <SectionTitle>Invoice Type</SectionTitle>
            <Card>
              <Text style={styles.itemTitle}>{detail.invoiceType}</Text>
              <Text style={styles.itemDesc}>Derived from source transaction — not editable</Text>
            </Card>
          </>
        ) : null}

        {step === 'customer' ? (
          <>
            <SectionTitle>Customer Details</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'Customer', value: transaction.customerName },
                  { label: 'Customer ID', value: detail.customerId },
                ],
                [{ label: 'Contact', value: detail.customerPhone }],
              ]}
            />
            <InfoNote>
              GST/business fields (GSTIN, billing address) appear here only for B2B/HORECA source transactions that
              actually provide them.
            </InfoNote>
          </>
        ) : null}

        {step === 'review' ? (
          <>
            <SectionTitle>Review Invoice</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'Invoice Type', value: reviewData.invoiceType },
                  { label: 'Customer', value: reviewData.customerName },
                ],
                [
                  { label: 'Items', value: String(reviewData.itemsCount) },
                  { label: 'Subtotal', value: reviewData.subtotal },
                ],
                [
                  { label: 'GST', value: reviewData.gst },
                  { label: 'Total', value: reviewData.total },
                ],
              ]}
            />
            {canGenerate ? (
              <View style={styles.demoButton}>
                <BillingButton
                  label="Simulate generation failure (demo)"
                  variant="outline"
                  onPress={() => setShowFailure(true)}
                />
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <Modal visible={showFailure} transparent animationType="fade" onRequestClose={() => setShowFailure(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <ErrorCrossIcon />
            </View>
            <Text style={styles.modalTitle}>Invoice Generation Failed</Text>
            <Text style={styles.modalMessage}>
              Unable to generate invoice. Fiscal registration service is currently unreachable or timed out. Please
              check your network and retry.
            </Text>
            <View style={styles.modalActions}>
              <BillingButton label="Retry Generation" onPress={handleRetry} />
              <BillingButton label="Cancel" variant="neutral" onPress={() => setShowFailure(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </BillingScreen>
  );
}

const DOT = 8;
const DOT_ACTIVE_WIDTH = 22;
const MODAL_ICON = 64;

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.md, paddingBottom: adminSpacing.xl },
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: adminSpacing.xs, marginBottom: adminSpacing.sm },
  dot: { width: DOT, height: DOT, borderRadius: adminRadius.full, backgroundColor: adminColors.border },
  dotDone: { backgroundColor: adminColors.success.text },
  dotActive: { width: DOT_ACTIVE_WIDTH, backgroundColor: adminColors.brand },

  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemLeft: { flex: 1 },
  itemTitle: { ...adminType.rowTitle, color: adminColors.ink },
  itemDesc: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  itemPrice: { ...adminType.sectionHead, color: adminColors.ink },

  billingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: adminSpacing.xs },
  billingLabel: { ...adminType.body, color: adminColors.muted },
  billingValue: { ...adminType.rowTitle, color: adminColors.ink },
  billingTotalLabel: { ...adminType.sectionHead, color: adminColors.ink },
  billingTotalValue: { ...adminType.kpiValue, color: adminColors.ink },

  demoButton: { marginTop: adminSpacing.lg },

  modalOverlay: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.xl,
  },
  modalCard: {
    alignSelf: 'stretch',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.xl,
    alignItems: 'center',
    ...adminShadow.lg,
  },
  modalIconWrap: {
    width: MODAL_ICON,
    height: MODAL_ICON,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.danger.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  modalTitle: { ...adminType.title, color: adminColors.ink, textAlign: 'center' },
  modalMessage: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  modalActions: { alignSelf: 'stretch', gap: adminSpacing.sm },
});
