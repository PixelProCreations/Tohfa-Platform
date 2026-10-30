/**
 * Return History Detail — read-only record of a closed RMA: inspection,
 * decision, refund and timeline.
 *
 * Gates: none; read-only (FINAL_LIST row 102).
 */
// Design id: M10-S06D
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { adminSpacing } from '../../../theme';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getCustomer } from '../../../api/customers';
import { toReturnTimeline, toRmaRecord } from './mappers';
import { useReturn, useReturnHistory } from './useReturnData';
import { InfoCard, ReturnsScreen, ReturnsTimeline, SectionTitle } from './ReturnsParts';
import type { ReturnHistoryRecord, WarehouseScreenBaseProps } from './types';

export interface ReturnHistoryDetailScreenProps extends WarehouseScreenBaseProps {
  returnId?: string | undefined;
  record: ReturnHistoryRecord;
}

const NOT_AVAILABLE = '—';

export function ReturnHistoryDetailScreen({ scope, can, returnId, record, onBack }: ReturnHistoryDetailScreenProps) {
  const effectiveId = returnId ?? record.id;
  const returnQuery = useReturn(effectiveId);
  const rma = returnQuery.data ? toRmaRecord(returnQuery.data) : undefined;

  const historyQuery = useReturnHistory(effectiveId);
  const timelineItems = historyQuery.data ? toReturnTimeline(historyQuery.data.items) : (record.timeline ?? []);

  const isRejected = record.status === 'Rejected';
  const decision = record.decision ?? (isRejected ? 'Rejected' : 'Approved');

  const customerId = rma?.customerId ?? record.customerId ?? NOT_AVAILABLE;
  const customerQuery = useAdminQuery(
    adminKeys.detail('customers', customerId),
    (signal) => getCustomer(customerId, signal),
    { enabled: can('customer.detail.view') && customerId !== NOT_AVAILABLE },
  );
  // BR-92: real name/code from the customer record once loaded; the mapper's '—'
  // placeholder only shows while that query is pending or the id is missing.
  const customerName = customerQuery.data?.name ?? rma?.customerName ?? record.customerName ?? NOT_AVAILABLE;
  const orderId = rma?.orderId ?? record.orderId ?? NOT_AVAILABLE;
  const orderDate = rma?.orderDate ?? record.orderDate ?? NOT_AVAILABLE;
  const warehouse =
    rma?.warehouseName ??
    record.warehouseName ??
    (scope.warehouseName ? scope.warehouseName.replace(/ Sub-Warehouse| Warehouse/, '') : NOT_AVAILABLE);
  const salesChannel = rma?.salesChannel ?? record.salesChannel ?? NOT_AVAILABLE;
  const description = rma?.description ?? record.description ?? record.reasonTag ?? NOT_AVAILABLE;
  const reportedDate = rma?.reportedDate ?? record.reportedDate ?? record.date ?? NOT_AVAILABLE;
  const processedBy = record.processedBy ? record.processedBy.replace('Warehouse Admin', 'SWA') : NOT_AVAILABLE;

  return (
    <ReturnsScreen title="Return History Detail" subtitle={record.rmaId} onBack={onBack}>
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
            [{ label: 'Reported Date', value: reportedDate }],
            [{ label: 'Description', value: description }],
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

        {timelineItems.length > 0 ? (
          <>
            <SectionTitle>Timeline</SectionTitle>
            <ReturnsTimeline items={timelineItems} />
          </>
        ) : null}
      </ScrollView>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.sm, paddingBottom: adminSpacing.xl },
});
