/**
 * Return History Detail — read-only record of a closed RMA: inspection,
 * decision, refund and timeline.
 *
 * Gates: none; read-only (FINAL_LIST row 102).
 *
 * Absorbs MainWarehouseReturnHistoryDetailScreen (pair M10-S06D): its "RMA"
 * summary card (RMA, customer, decision, refund) is rendered for the Main
 * view. Its header filter button only went back and is not ported.
 */
// Design id: M10-S06D
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { adminSpacing } from '../../../theme';
import { InfoCard, ReturnsScreen, ReturnsTimeline, SectionTitle } from './ReturnsParts';
import { INITIAL_RMA_ITEMS } from './fixtures';
import type { ReturnHistoryRecord, WarehouseScreenBaseProps } from './types';

export interface ReturnHistoryDetailScreenProps extends WarehouseScreenBaseProps {
  record: ReturnHistoryRecord;
}

const NOT_AVAILABLE = '—';

export function ReturnHistoryDetailScreen({ scope, record, onBack }: ReturnHistoryDetailScreenProps) {
  const isRejected = record.status === 'Rejected';
  const decision = record.decision ?? (isRejected ? 'Rejected' : 'Approved');
  const matchedRma = INITIAL_RMA_ITEMS.find(
    (item) => item.rmaId === record.rmaId || item.orderId === record.orderId,
  );

  const customerName = record.customerName || matchedRma?.customerName || 'Ravi Kumar';
  const customerId = record.customerId || matchedRma?.customerId || 'CUS-001245';
  const orderId = record.orderId || matchedRma?.orderId || 'ORD-002145';
  const orderDate = record.orderDate || matchedRma?.orderDate || '24 Sep 2026';
  const warehouse =
    record.warehouseName ||
    (scope.warehouseName ? scope.warehouseName.replace(/ Sub-Warehouse| Warehouse/, '') : 'Coonoor');
  const salesChannel = record.salesChannel || matchedRma?.salesChannel || 'Online Order';
  const ticketId = record.ticketId || matchedRma?.ticketId || 'TKT-2026-00125';
  const issueCategory = record.issueCategory || record.reasonTag || matchedRma?.issueCategory || 'Damaged';
  const reportedDate = record.reportedDate || matchedRma?.reportedDate || record.date || '25 Sep 2026';
  const description =
    record.description || matchedRma?.description || 'Customer reported damaged produce after pickup.';
  const processedBy = record.processedBy ? record.processedBy.replace('Warehouse Admin', 'SWA') : 'SWA – Suresh';

  return (
    <ReturnsScreen title="Return History Detail" onBack={onBack}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>Customer</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Customer', value: customerName },
              { label: 'Customer ID', value: customerId },
            ],
          ]}
        />

        <SectionTitle>Order</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Order ID', value: orderId },
              { label: 'Date', value: orderDate },
            ],
            [
              { label: 'Warehouse', value: warehouse },
              { label: 'Sales Channel', value: salesChannel },
            ],
          ]}
        />

        <SectionTitle>Issue</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Ticket ID', value: ticketId },
              { label: 'Issue Category', value: issueCategory },
            ],
            [{ label: 'Reported Date', value: reportedDate }],
            [{ label: 'Description', value: description }],
          ]}
        />

        <SectionTitle>Inspection</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Inspection Result', value: record.inspectionResult ?? NOT_AVAILABLE },
              { label: 'Returned Quantity', value: record.returnedQuantity ?? NOT_AVAILABLE },
            ],
            [{ label: 'Inspection Notes', value: record.inspectionNotes ?? NOT_AVAILABLE }],
          ]}
        />

        <SectionTitle>Decision</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Decision', value: decision },
              { label: 'Decision Date', value: record.decisionDate ?? record.date },
            ],
            [{ label: 'Processed By', value: processedBy }],
          ]}
        />

        <SectionTitle>Refund</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Refund Status', value: record.refundStatus ?? (isRejected ? 'None' : NOT_AVAILABLE) },
              { label: 'Refund Method', value: record.refundMethod ?? (isRejected ? 'N/A' : NOT_AVAILABLE) },
            ],
            [
              { label: 'Amount', value: record.refundAmount ?? NOT_AVAILABLE },
              { label: 'Reference', value: record.refundReference ?? NOT_AVAILABLE },
            ],
          ]}
        />

        {record.timeline && record.timeline.length > 0 ? (
          <>
            <SectionTitle>Timeline</SectionTitle>
            <ReturnsTimeline items={record.timeline} />
          </>
        ) : null}
      </ScrollView>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.sm, paddingBottom: adminSpacing.xxl },
});
