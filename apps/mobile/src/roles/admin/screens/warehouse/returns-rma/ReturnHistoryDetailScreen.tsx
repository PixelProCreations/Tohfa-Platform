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
import { InfoCard, isAllWarehouses, ReturnsScreen, ReturnsTimeline, SectionTitle } from './ReturnsParts';
import type { ReturnHistoryRecord, WarehouseScreenBaseProps } from './types';

export interface ReturnHistoryDetailScreenProps extends WarehouseScreenBaseProps {
  record: ReturnHistoryRecord;
}

const NOT_AVAILABLE = '—';

export function ReturnHistoryDetailScreen({ scope, record, onBack }: ReturnHistoryDetailScreenProps) {
  const isRejected = record.status === 'Rejected';
  const decision = record.decision ?? (isRejected ? 'Rejected' : 'Approved');

  return (
    <ReturnsScreen title="Return History Detail" subtitle={record.rmaId} onBack={onBack}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isAllWarehouses(scope) ? (
          <>
            <SectionTitle>RMA</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'RMA', value: record.rmaId },
                  { label: 'Customer', value: record.customerName },
                ],
                [
                  { label: 'Decision', value: decision },
                  { label: 'Refund', value: record.refundAmount ?? NOT_AVAILABLE },
                ],
              ]}
            />
          </>
        ) : null}

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
            [{ label: 'Processed By', value: record.processedBy ?? NOT_AVAILABLE }],
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
