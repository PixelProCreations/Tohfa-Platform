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
import type { ReturnHistoryRecord, WarehouseScreenBaseProps } from './types';

export interface ReturnHistoryDetailScreenProps extends WarehouseScreenBaseProps {
  record: ReturnHistoryRecord;
}

const NOT_AVAILABLE = '—';

export function ReturnHistoryDetailScreen({ scope, record, onBack }: ReturnHistoryDetailScreenProps) {
  const isRejected = record.status === 'Rejected';
  const decision = record.decision ?? (isRejected ? 'Rejected' : 'Approved');

  const customerName = record.customerName || NOT_AVAILABLE;
  const customerId = record.customerId || NOT_AVAILABLE;
  const orderId = record.orderId || NOT_AVAILABLE;
  const orderDate = record.orderDate || NOT_AVAILABLE;
  const warehouse =
    record.warehouseName ||
    (scope.warehouseName ? scope.warehouseName.replace(/ Sub-Warehouse| Warehouse/, '') : NOT_AVAILABLE);
  const salesChannel = record.salesChannel || NOT_AVAILABLE;
  const ticketId = record.ticketId || NOT_AVAILABLE;
  const issueCategory = record.issueCategory || record.reasonTag || NOT_AVAILABLE;
  const reportedDate = record.reportedDate || record.date || NOT_AVAILABLE;
  const description = record.description || NOT_AVAILABLE;
  const processedBy = record.processedBy ? record.processedBy.replace('Warehouse Admin', 'SWA') : NOT_AVAILABLE;

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
