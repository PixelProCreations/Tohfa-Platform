/**
 * Invoice Detail: unified RBAC screen for both:
 *   1. Warehouse Billing Invoice Detail (when `invoiceId` is passed; gated by `invoice.view_own` & `scope`).
 *   2. Finance / Sales GST Invoice Detail & Payout Intimation (when `InvoiceDetailData` is passed;
 *      payout intimation gated by `can` when provided).
 *
 * Absorbs `screens/finance/InvoiceDetailScreen.tsx` and pairs M9-S03 / M9-S06.
 */
// Design id: M9-S03
import React, { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BackArrowIcon } from '../../../components/AdminIcons';
import type { Can } from '../../../permissions/can';
import {
  ADMIN_BUTTON_HEIGHT,
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../../theme';
import {
  BillingButton,
  BillingFooter,
  BillingScreen,
  BillingToast,
  Card,
  DownloadIcon,
  HeaderIconButton,
  InfoCard,
  inScope,
  isAllWarehouses,
  PermissionNote,
  SectionTitle,
} from './BillingParts';
import { SAMPLE_INVOICE_DETAIL } from './fixtures';
import type { InvoiceDetailRecord, WarehouseScope, WarehouseScreenBaseProps } from './types';

export interface InvoiceDetailData {
  id: string;
  invoiceNumber: string;
  status: 'Issued' | 'Draft' | 'Cancelled';
  dateStr: string;
  soNumber: string;
  recipient: string;
  billingAddress: string;
  gstin: string;
  itemName: string;
  itemGrade: string;
  itemRate: string;
  itemTotal: string;
  taxableAmount: string;
  taxText: string;
  finalAmountText: string;
  historyEvents: { date: string; title: string }[];
  payoutInfo?: {
    payoutId: string;
    poNumber: string;
    farmerName: string;
    amount: string;
  };
}

export interface InvoiceDetailScreenProps extends Partial<WarehouseScreenBaseProps> {
  onBack: () => void;
  scope?: WarehouseScope | undefined;
  can?: Can | undefined;
  invoiceId?: string | undefined;
  /** Detail record (warehouse) or GST invoice data (finance/sales). */
  invoice?: InvoiceDetailRecord | InvoiceDetailData | undefined;
  onDownload?: ((invoiceId: string) => void) | undefined;
  onShare?: ((invoiceId: string) => void) | undefined;
}

function isFinanceInvoiceData(inv: InvoiceDetailRecord | InvoiceDetailData | undefined): inv is InvoiceDetailData {
  return Boolean(inv && 'invoiceNumber' in inv);
}

function TimelineCheckIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM9 12l2 2 4-4"
        stroke={adminColors.success.text}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function InvoiceDetailScreen({
  scope,
  can,
  onBack,
  invoiceId = SAMPLE_INVOICE_DETAIL.invoiceId,
  invoice,
  onDownload,
  onShare,
}: InvoiceDetailScreenProps) {
  if (isFinanceInvoiceData(invoice)) {
    return <FinanceInvoiceDetail invoice={invoice} can={can} onBack={onBack} />;
  }

  return (
    <WarehouseInvoiceDetail
      scope={scope ?? { warehouseId: undefined }}
      can={can ?? (() => false)}
      onBack={onBack}
      invoiceId={invoiceId}
      invoice={invoice ?? SAMPLE_INVOICE_DETAIL}
      onDownload={onDownload}
      onShare={onShare}
    />
  );
}

function FinanceInvoiceDetail({
  invoice,
  can,
  onBack,
}: {
  invoice: InvoiceDetailData;
  can?: Can | undefined;
  onBack: () => void;
}) {
  const [showIntimateModal, setShowIntimateModal] = useState(false);
  const [isIntimated, setIsIntimated] = useState(false);

  const canIntimatePayout = can ? (can('payout.approve') || can('finance.payout.intimate') || can('invoice.view_own')) : true;

  const payout = invoice.payoutInfo || {
    payoutId: 'PY-0005',
    poNumber: 'PO-0009',
    farmerName: 'Kumar',
    amount: '₹3,300.00',
  };

  const handleConfirmIntimate = () => {
    setShowIntimateModal(false);
    setIsIntimated(true);
    Alert.alert(
      'Payout Intimated',
      `Payout ${payout.payoutId} for ${payout.farmerName} (${payout.amount}) has been intimated to Accounts & Finance.`,
    );
  };

  const isCancelled = invoice.status === 'Cancelled';
  const isIssued = invoice.status === 'Issued';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to Invoices"
        >
          <BackArrowIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice {invoice.invoiceNumber}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.financeScrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.financeSectionHeading}>Invoice {invoice.invoiceNumber}</Text>
        <View style={styles.financeCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Invoice number</Text>
            <Text style={styles.detailValueBold}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text
              style={[
                styles.detailValueBold,
                isCancelled ? styles.statusCancelled : isIssued ? styles.statusIssued : styles.statusDraft,
              ]}
            >
              {invoice.status}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Invoice date</Text>
            <Text style={styles.detailValueBold}>{invoice.dateStr}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sales order</Text>
            <Text style={styles.detailValueBold}>{invoice.soNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient</Text>
            <Text style={styles.detailValueBold}>{invoice.recipient}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Billing address</Text>
            <Text style={styles.detailValueBold}>{invoice.billingAddress || '—'}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>GSTIN</Text>
            <Text style={styles.detailValueBold}>{invoice.gstin || 'Not applicable'}</Text>
          </View>
        </View>

        <Text style={[styles.financeSectionHeading, styles.sectionTopGap]}>Items</Text>
        <View style={styles.financeCard}>
          <View style={styles.itemHeaderRow}>
            <Text style={styles.itemTitle}>
              {invoice.itemName} · {invoice.itemGrade}
            </Text>
            <Text style={styles.itemTotalText}>{invoice.itemTotal}</Text>
          </View>
          <Text style={styles.itemRateText}>{invoice.itemRate}</Text>
        </View>

        <View style={[styles.financeCard, styles.cardTopGap]}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Taxable amount</Text>
            <Text style={styles.detailValueBold}>{invoice.taxableAmount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tax</Text>
            <Text style={styles.detailValueBold}>{invoice.taxText}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Final invoice amount</Text>
            <Text style={styles.detailValueBold}>{invoice.finalAmountText}</Text>
          </View>
        </View>

        <Text style={[styles.financeSectionHeading, styles.sectionTopGap]}>Invoice history</Text>
        <View style={styles.financeCard}>
          {invoice.historyEvents.map((evt, idx) => {
            const isLast = idx === invoice.historyEvents.length - 1;
            return (
              <View key={`${evt.date}-${evt.title}`} style={[styles.historyRow, isLast && styles.detailRowLast]}>
                <Text style={styles.historyMeta}>{evt.date}</Text>
                <Text style={styles.historyTitle}>{evt.title}</Text>
              </View>
            );
          })}
        </View>

        {canIntimatePayout ? (
          <TouchableOpacity
            style={[styles.intimateBtn, isIntimated && styles.intimateBtnDone]}
            onPress={() => setShowIntimateModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.intimateBtnText}>{isIntimated ? 'Payout Intimated' : 'Intimate Payout'}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal visible={showIntimateModal} animationType="slide" transparent onRequestClose={() => setShowIntimateModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowIntimateModal(false)}>
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalSheetTitle}>Intimate this payout?</Text>

            <View style={styles.modalCard}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Payout</Text>
                <Text style={styles.modalValueBold}>
                  {payout.payoutId} · PO {payout.poNumber}
                </Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>Farmer</Text>
                <Text style={styles.modalValueBold}>{payout.farmerName}</Text>
              </View>
              <View style={[styles.modalRow, styles.detailRowLast]}>
                <Text style={styles.modalLabel}>Amount</Text>
                <Text style={styles.modalValueBold}>{payout.amount}</Text>
              </View>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirmIntimate} activeOpacity={0.8}>
                <Text style={styles.modalConfirmText}>Intimate</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowIntimateModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function WarehouseInvoiceDetail({
  scope,
  can,
  onBack,
  invoiceId,
  invoice = SAMPLE_INVOICE_DETAIL,
  onDownload,
  onShare,
}: {
  scope: WarehouseScope;
  can: Can;
  onBack: () => void;
  invoiceId: string;
  invoice?: InvoiceDetailRecord;
  onDownload?: ((invoiceId: string) => void) | undefined;
  onShare?: ((invoiceId: string) => void) | undefined;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showPreview) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowPreview(false);
      return true;
    });
    return () => sub.remove();
  }, [showPreview]);

  const canView = can('invoice.view_own');
  const allWarehouses = isAllWarehouses(scope);
  const record: InvoiceDetailRecord = { ...invoice, invoiceId };

  if (!inScope(scope, record.warehouseId)) {
    return (
      <BillingScreen title="Invoice Detail" onBack={onBack}>
        <View style={styles.scrollContent}>
          <PermissionNote>Invoice {invoiceId} was not found.</PermissionNote>
        </View>
      </BillingScreen>
    );
  }

  const handleDismissToast = React.useCallback(() => {
    setShowToast(false);
  }, []);

  const handlePdfDownload = () => {
    setShowToast(true);
    onDownload?.(invoiceId);
  };

  const handleDownload = () => {
    if (!allWarehouses) {
      setShowPreview(true);
      return;
    }
    handlePdfDownload();
  };

  const handleShare = () => (onShare ? onShare(invoiceId) : Alert.alert('Share', `Sharing ${invoiceId}...`));

  if (showPreview) {
    return (
      <BillingScreen
        title="Invoice Preview"
        onBack={() => setShowPreview(false)}
        toast={showToast ? <BillingToast message="Invoice downloaded" visible={showToast} onDismiss={handleDismissToast} /> : null}
        footer={
          canView ? (
            <BillingFooter>
              <BillingButton label="Download PDF" icon={<DownloadIcon />} onPress={handlePdfDownload} />
              <BillingButton label="Share" variant="outline" onPress={handleShare} />
            </BillingFooter>
          ) : null
        }
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Card style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewBrandTitle}>TOHFA</Text>
              <Text style={styles.previewDocLabel}>Invoice · {record.invoiceId}</Text>
              <View style={styles.brandDivider} />
            </View>

            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Customer</Text>
              <Text style={styles.previewValue}>{record.customerName}</Text>
            </View>

            {record.items.map((item, index) => (
              <View key={`${item.name}-${index}`} style={styles.previewRow}>
                <Text style={styles.previewLabel}>
                  {item.name} · {item.quantity}
                </Text>
                <Text style={styles.previewValue}>{item.lineTotal}</Text>
              </View>
            ))}

            <Text style={styles.previewGrandTotal}>{record.total}</Text>
          </Card>
        </ScrollView>
      </BillingScreen>
    );
  }

  const infoRows = [
    [
      { label: 'Invoice Number', value: record.invoiceId },
      { label: 'Order Number', value: record.orderNumber },
    ],
    [
      { label: 'Date', value: record.date },
      { label: 'Sales Channel', value: record.salesChannel },
    ],
    [{ label: 'Warehouse', value: record.warehouseName ?? record.warehouseId ?? '—' }],
  ];

  const timeline = [
    record.generatedAt ? { title: 'Invoice Generated', time: record.generatedAt } : null,
    record.linkedAt ? { title: 'Invoice Linked to Order', time: record.linkedAt } : null,
  ].filter((step): step is { title: string; time: string } => step !== null);

  return (
    <BillingScreen
      title="Invoice Detail"
      subtitle={`${record.invoiceId} · ${record.status}`}
      onBack={onBack}
      headerRight={
        canView ? (
          <HeaderIconButton onPress={handleDownload} accessibilityLabel="Download Invoice">
            <DownloadIcon />
          </HeaderIconButton>
        ) : null
      }
      toast={showToast ? <BillingToast message="Invoice downloaded" visible={showToast} onDismiss={handleDismissToast} /> : null}
      footer={
        canView ? (
          <BillingFooter>
            <BillingButton label="Print Invoice" icon={<DownloadIcon />} onPress={handleDownload} />
            <BillingButton label="Share" variant="outline" onPress={handleShare} />
          </BillingFooter>
        ) : null
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.brandBlock}>
          <Text style={styles.brandTitle}>TOHFA</Text>
          <Text style={styles.brandSubtitle}>Nilgiris Horticulture Organic Farmers Association</Text>
          <View style={styles.brandDivider} />
          <Text style={styles.invoiceDocLabel}>Invoice · {record.invoiceId}</Text>
        </View>

        <SectionTitle>Invoice Information</SectionTitle>
        <InfoCard rows={infoRows} />

        <SectionTitle>Bill To</SectionTitle>
        <Card>
          <Text style={styles.billToName}>{record.customerName}</Text>
          <Text style={styles.billToDetails}>
            Customer ID: {record.customerId} · Mobile: {record.customerPhone}
          </Text>
        </Card>

        <SectionTitle>Product / Line Items</SectionTitle>
        <Card>
          {record.items.map((item, index) => (
            <View key={`${item.name}-${index}`}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {item.grade} · {item.unit}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} × {item.unitPrice}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>{item.lineTotal}</Text>
              </View>
            </View>
          ))}
        </Card>

        <SectionTitle>Amount Summary</SectionTitle>
        <Card>
          {[
            ['Subtotal', record.subtotal],
            ['Discount', record.discount],
            ['GST', record.gst],
          ].map(([label, value]) => (
            <View key={label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{label}</Text>
              <Text style={styles.summaryValue}>{value}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{record.total}</Text>
          </View>
        </Card>

        <SectionTitle>Payment Information</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Payment Status', value: record.paymentStatus },
              { label: 'Payment Method', value: record.paymentMethod },
            ],
          ]}
        />

        {timeline.length > 0 ? (
          <>
            <SectionTitle>Invoice Timeline</SectionTitle>
            <Card>
              {timeline.map((step, index) => (
                <View key={step.title} style={styles.timelineStep}>
                  <View style={styles.timelineIconCol}>
                    <TimelineCheckIcon />
                    {index < timeline.length - 1 ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>{step.title}</Text>
                    <Text style={styles.timelineTime}>{step.time}</Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        ) : null}

        {record.generatedBy ? (
          <View style={styles.generatedBy}>
            <InfoCard rows={[[{ label: 'Generated By', value: record.generatedBy }]]} />
          </View>
        ) : null}
      </ScrollView>
    </BillingScreen>
  );
}

const TIMELINE_LINE_HEIGHT = 28;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
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
  scroll: { flex: 1, backgroundColor: adminColors.canvas },
  financeScrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl,
  },
  financeSectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  sectionTopGap: { marginTop: adminSpacing.lg },
  cardTopGap: { marginTop: adminSpacing.sm },
  financeCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    ...adminShadow.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.sm + 1,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  detailValueBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    maxWidth: '60%',
    textAlign: 'right',
  },
  statusCancelled: { color: adminColors.danger.text },
  statusIssued: { color: adminColors.success.text },
  statusDraft: { color: adminColors.muted },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: adminSpacing.xs,
  },
  itemTitle: { ...adminType.rowTitle, color: adminColors.ink },
  itemTotalText: { ...adminType.rowTitle, color: adminColors.ink },
  itemRateText: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs, paddingBottom: adminSpacing.xs },
  historyRow: { paddingVertical: adminSpacing.sm + 1, borderBottomWidth: 1, borderBottomColor: adminColors.border },
  historyMeta: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: 2 },
  historyTitle: { ...adminType.rowTitle, color: adminColors.ink },
  intimateBtn: {
    marginTop: adminSpacing.xl,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intimateBtnDone: { backgroundColor: adminColors.brandTint },
  intimateBtnText: { ...adminType.sectionHead, color: adminColors.brand },
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },
  modalSheetTitle: { ...adminType.title, color: adminColors.ink, marginBottom: adminSpacing.md },
  modalCard: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.sm + 1,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  modalLabel: { ...adminType.body, color: adminColors.muted },
  modalValueBold: { ...adminType.rowTitle, color: adminColors.ink },
  modalButtonsRow: { flexDirection: 'row', gap: adminSpacing.md },
  modalConfirmBtn: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: { ...adminType.sectionHead, color: adminColors.brand },
  modalCancelBtn: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { ...adminType.rowTitle, color: adminColors.muted },
  bottomSpacer: { height: adminSpacing.xxxl },

  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.md, paddingBottom: adminSpacing.xl },
  brandBlock: { alignItems: 'center', paddingVertical: adminSpacing.md },
  brandTitle: { ...adminType.title, color: adminColors.brand },
  brandSubtitle: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2, textAlign: 'center' },
  brandDivider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.sm,
  },
  invoiceDocLabel: { ...adminType.sectionHead, color: adminColors.ink },

  billToName: { ...adminType.rowTitle, color: adminColors.ink },
  billToDetails: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },

  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  itemLeft: { flex: 1 },
  itemName: { ...adminType.rowTitle, color: adminColors.ink },
  itemMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 1 },
  itemPrice: { ...adminType.sectionHead, color: adminColors.ink },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.xs,
  },
  summaryLabel: { ...adminType.body, color: adminColors.muted },
  summaryValue: { ...adminType.rowTitle, color: adminColors.ink },
  totalLabel: { ...adminType.sectionHead, color: adminColors.ink },
  totalValue: { ...adminType.kpiValue, color: adminColors.ink },

  timelineStep: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineIconCol: { alignItems: 'center', width: adminSpacing.xl },
  timelineLine: { width: 2, height: TIMELINE_LINE_HEIGHT, backgroundColor: adminColors.border, marginVertical: 2 },
  timelineContent: { flex: 1, marginLeft: adminSpacing.sm, paddingBottom: adminSpacing.md },
  timelineTitle: { ...adminType.rowTitle, color: adminColors.ink },
  timelineTime: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },

  generatedBy: { marginTop: adminSpacing.md, borderRadius: adminRadius.lg },

  previewCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  previewHeader: {
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  previewBrandTitle: {
    ...adminType.title,
    color: adminColors.ink,
    textAlign: 'center',
  },
  previewDocLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.sm,
  },
  previewLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  previewValue: {
    ...adminType.rowTitle,
    fontWeight: '600',
    color: adminColors.ink,
  },
  previewGrandTotal: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    textAlign: 'center',
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
});
