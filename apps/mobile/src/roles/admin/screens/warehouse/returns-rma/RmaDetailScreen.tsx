/**
 * RMA Detail — everything about one return request, with the Inspect Product
 * entry into the review flow.
 *
 * Gates (docs/rbac.json; the server re-checks, CLAUDE.md 2.1):
 *   - "Inspect Product" only with `rma.request.process` (FINAL_LIST row 105).
 * The warehouse field comes from the viewer's scope (Sub) or the record
 * (Main), never from a 'Coonoor Warehouse' literal.
 *
 * Customer evidence photos are shown as non-expandable thumbnails: the image
 * viewer (SubWarehouseImageViewerScreen, FINAL_LIST row 106) was dropped by the
 * owner, so a thumbnail no longer opens anything.
 *
 * Absorbs MainWarehouseRmaDetailScreen (pair M10-S02): its "Refund
 * Information" card (amount + method) is rendered for the Main view; its
 * "View Customer" button had no handler and is not ported.
 */
// Design id: M10-S02
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getCustomer } from '../../../api/customers';
import { getAdminOrder } from '../../../api/orders';
import { formatMoney } from '../orders/mappers';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { toReturnTimeline, toRmaRecord } from './mappers';
import { useReturn, useReturnHistory } from './useReturnData';
import {
  InfoCard,
  isAllWarehouses,
  PermissionNote,
  ReturnsButton,
  ReturnsFooter,
  ReturnsScreen,
  ReturnsTimeline,
  SectionTitle,
} from './ReturnsParts';
import type { RmaRecord, RmaScreenBaseProps } from './types';

export interface RmaDetailScreenProps extends RmaScreenBaseProps {
  onInspectProduct: (rma: RmaRecord) => void;
}

function VerifiedCheckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l2.4 2.1 3.2-.4 1.3 2.9 3.1 1.1-.3 3.2 2.1 2.4-2.1 2.4.3 3.2-3.1 1.1-1.3 2.9-3.2-.4L12 22l-2.4-2.1-3.2.4-1.3-2.9-3.1-1.1.3-3.2L0.2 12l2.1-2.4-.3-3.2 3.1-1.1 1.3-2.9 3.2.4L12 2z"
        stroke={adminColors.success.text}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={adminColors.success.text}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ImageIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={adminColors.brand} strokeWidth="1.8" />
      <Circle cx="8.5" cy="8.5" r="1.5" fill={adminColors.brand} />
      <Path d="M21 15l-5-5L5 21" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InspectClipboardIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={adminColors.onBrand} strokeWidth="2" />
      <Rect x="8" y="10" width="3" height="3" stroke={adminColors.onBrand} strokeWidth="1.5" />
      <Path d="M13 11.5h4M13 15.5h4" stroke={adminColors.onBrand} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

/** Mock refund method shown on the Main "Refund Information" card (ported from the Main twin). */
const REFUND_METHOD = 'TOHFA Wallet';

export function RmaDetailScreen({ scope, can, returnId, rma: initialRma, onBack, onInspectProduct }: RmaDetailScreenProps) {
  const effectiveId = returnId ?? initialRma?.id;
  const returnQuery = useReturn(effectiveId);
  const rma = returnQuery.data ? toRmaRecord(returnQuery.data) : initialRma;

  const canProcess = can('rma.request.process');
  const warehouseLabel = scope.warehouseName ?? rma?.warehouseName ?? '';

  const customerId = rma?.customerId;
  const customerQuery = useAdminQuery(
    adminKeys.detail('customers', customerId ?? ''),
    (signal) => getCustomer(customerId!, signal),
    { enabled: can('customer.detail.view') && Boolean(customerId && customerId !== '—') },
  );

  const orderId = rma?.orderId;
  const orderQuery = useAdminQuery(
    adminKeys.detail('orders', orderId ?? ''),
    (signal) => getAdminOrder(orderId!, signal),
    { enabled: Boolean(orderId && orderId !== '—') },
  );

  const historyQuery = useReturnHistory(effectiveId);
  const timelineItems = historyQuery.data ? toReturnTimeline(historyQuery.data.items) : [];

  if (returnQuery.isLoading && !rma) {
    return (
      <ReturnsScreen title="RMA Detail" onBack={onBack}>
        <AdminLoadingState />
      </ReturnsScreen>
    );
  }

  if (returnQuery.isError && !rma) {
    return (
      <ReturnsScreen title="RMA Detail" onBack={onBack}>
        <AdminErrorState error={returnQuery.error} onRetry={() => returnQuery.refetch()} />
      </ReturnsScreen>
    );
  }

  if (!rma) {
    return (
      <ReturnsScreen title="RMA Detail" onBack={onBack}>
        <AdminErrorState error={new Error('Return not found')} onRetry={onBack} />
      </ReturnsScreen>
    );
  }

  const customerData = customerQuery.data;
  const customerName = customerData?.name ?? rma.customerName;
  const customerCode = customerData?.customerCode ?? rma.customerId;
  const customerPhone = customerData
    ? (customerData.mobile ?? customerData.mobileMasked)
    : rma.customerPhone;

  const orderData = orderQuery.data;
  const matchedOrderItem = orderData?.items[0];

  const salesChannel = orderData?.channel ?? rma.salesChannel;
  const paymentStatus = orderData?.paymentStatus ?? rma.paymentStatus;
  const productName = matchedOrderItem?.name ?? rma.productName;
  const productGrade = matchedOrderItem?.grade ?? rma.grade;
  const quantityPurchased = matchedOrderItem ? `${matchedOrderItem.qtyKg} KG` : rma.quantityPurchased;
  const unitPrice = matchedOrderItem ? formatMoney(matchedOrderItem.unitPrice) : rma.unitPrice;
  const lineTotal = matchedOrderItem ? formatMoney(matchedOrderItem.lineTotal) : rma.lineTotal;

  return (
    <ReturnsScreen
      title="RMA Detail"
      subtitle={`${rma.rmaId} • Under Review`}
      onBack={onBack}
      footer={
        <ReturnsFooter>
          {canProcess ? (
            <ReturnsButton label="Inspect Product" icon={<InspectClipboardIcon />} onPress={() => onInspectProduct(rma)} />
          ) : (
            <PermissionNote>Inspecting returns needs the RMA processing permission.</PermissionNote>
          )}
        </ReturnsFooter>
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.eligibleBanner}>
          <VerifiedCheckIcon />
          <Text style={styles.eligibleBannerText}>Reported within return window — Eligible</Text>
        </View>

        <SectionTitle>Customer</SectionTitle>
        <View style={styles.customerCard}>
          <Text style={styles.customerNameText}>{customerName}</Text>
          <Text style={styles.customerContactText}>{`${customerCode} · ${customerPhone}`}</Text>
        </View>

        <SectionTitle>Order</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Order ID', value: rma.orderId },
              { label: 'Order Date', value: rma.orderDate },
            ],
            [
              { label: 'Warehouse', value: warehouseLabel || '—' },
              { label: 'Sales Channel', value: salesChannel },
            ],
            [{ label: 'Payment Status', value: paymentStatus }],
          ]}
        />

        <SectionTitle>Product</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Product', value: productName },
              { label: 'Grade', value: productGrade },
            ],
            [
              { label: 'Quantity Purchased', value: quantityPurchased },
              { label: 'Unit Price', value: unitPrice },
            ],
            [{ label: 'Line Total', value: lineTotal }],
          ]}
        />

        <SectionTitle>Return / Issue Information</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Reported Date', value: rma.reportedDate },
            ],
            [{ label: 'Description', value: <Text style={styles.descriptionText}>{rma.description}</Text> }],
          ]}
        />

        <SectionTitle>Customer Evidence</SectionTitle>
        <View style={styles.evidenceRow}>
          {/* Non-expandable thumbnails: the image viewer was dropped (FINAL_LIST row 106). */}
          <View style={styles.evidenceBox} accessibilityLabel="Customer Photo 1">
            <ImageIcon />
          </View>
          <View style={styles.evidenceBox} accessibilityLabel="Customer Photo 2">
            <ImageIcon />
          </View>
        </View>

        <SectionTitle>Return Quantity</SectionTitle>
        <InfoCard rows={[[{ label: 'Requested Return Quantity', value: rma.requestedQuantity }]]} />

        {isAllWarehouses(scope) ? (
          <>
            <SectionTitle>Refund Information</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'Refund Amount', value: lineTotal },
                  { label: 'Refund Method', value: REFUND_METHOD },
                ],
              ]}
            />
          </>
        ) : null}

        <SectionTitle>Timeline</SectionTitle>
        <ReturnsTimeline items={timelineItems} />
      </ScrollView>
    </ReturnsScreen>
  );
}

// Evidence thumbnail edge: an image size, not spacing.
const EVIDENCE_SIZE = 72;

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.lg, paddingBottom: adminSpacing.xl },
  eligibleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.success.bg,
    borderWidth: 1,
    borderColor: adminColors.success.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
    gap: adminSpacing.sm,
  },
  eligibleBannerText: { ...adminType.rowMeta, color: adminColors.success.text, flex: 1 },
  customerCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  customerNameText: { ...adminType.kpiValue, color: adminColors.ink, marginBottom: adminSpacing.xs },
  customerContactText: { ...adminType.rowMeta, color: adminColors.muted },
  descriptionText: { ...adminType.body, color: adminColors.ink },
  evidenceRow: { flexDirection: 'row', gap: adminSpacing.md, marginBottom: adminSpacing.md },
  evidenceBox: {
    width: EVIDENCE_SIZE,
    height: EVIDENCE_SIZE,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
});
