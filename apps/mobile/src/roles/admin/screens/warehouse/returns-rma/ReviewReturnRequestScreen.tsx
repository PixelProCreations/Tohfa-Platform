/**
 * Review Return Request — the inspection outcome and evidence, then the
 * Approve / Reject decision.
 *
 * Gates (docs/rbac.json; the server re-checks, CLAUDE.md 2.1):
 *   - Approve and Reject only with `rma.request.process` (FINAL_LIST row 104).
 */
// Design id: M10-S04
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminSpacing, adminType } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getCustomer } from '../../../api/customers';
import { toReturnTimeline, toRmaRecord } from './mappers';
import { useReturn, useReturnHistory } from './useReturnData';
import {
  InfoCard,
  isAllWarehouses,
  PermissionNote,
  ReturnsButton,
  ReturnsScreen,
  ReturnsTimeline,
  SectionTitle,
} from './ReturnsParts';
import type { RmaRecord, RmaScreenBaseProps } from './types';

export interface ReviewReturnRequestScreenProps extends RmaScreenBaseProps {
  inspectedQty?: string | undefined;
  inspectionNotes?: string | undefined;
  onApprove: (rma: RmaRecord) => void;
  onReject: (rma: RmaRecord) => void;
}

const CUSTOMER_EVIDENCE = '—';
const INSPECTION_EVIDENCE = '—';
const REFUND_METHOD = 'TOHFA Wallet';

function CheckmarkIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={adminColors.success.text} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseCrossIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={adminColors.danger.text} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ReviewReturnRequestScreen({
  scope,
  can,
  returnId,
  rma: initialRma,
  inspectedQty = '—',
  inspectionNotes = '—',
  onBack,
  onApprove,
  onReject,
}: ReviewReturnRequestScreenProps) {
  const effectiveId = returnId ?? initialRma?.id;
  const returnQuery = useReturn(effectiveId);
  const rma = returnQuery.data ? toRmaRecord(returnQuery.data) : initialRma;

  const historyQuery = useReturnHistory(effectiveId);
  const timelineItems = historyQuery.data ? toReturnTimeline(historyQuery.data.items) : [];

  const canProcess = can('rma.request.process');

  const customerId = rma?.customerId;
  const customerQuery = useAdminQuery(
    adminKeys.detail('customers', customerId ?? ''),
    (signal) => getCustomer(customerId!, signal),
    { enabled: can('customer.detail.view') && Boolean(customerId && customerId !== '—') },
  );
  const customerName = customerQuery.data?.name ?? rma?.customerName;

  if (returnQuery.isLoading && !rma) {
    return (
      <ReturnsScreen title="Review Return Request" onBack={onBack}>
        <AdminLoadingState />
      </ReturnsScreen>
    );
  }

  if (returnQuery.isError && !rma) {
    return (
      <ReturnsScreen title="Review Return Request" onBack={onBack}>
        <AdminErrorState error={returnQuery.error} onRetry={() => returnQuery.refetch()} />
      </ReturnsScreen>
    );
  }

  if (!rma) {
    return (
      <ReturnsScreen title="Review Return Request" onBack={onBack}>
        <AdminErrorState error={new Error('Return not found')} onRetry={onBack} />
      </ReturnsScreen>
    );
  }

  return (
    <ReturnsScreen title="Review Return Request" subtitle={rma.rmaId} onBack={onBack}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>RMA Summary</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Customer', value: customerName ?? rma.customerName },
              { label: 'Order', value: rma.orderId },
            ],
            [
              { label: 'Requested Quantity', value: rma.requestedQuantity },
              { label: 'Inspected Quantity', value: inspectedQty },
            ],
          ]}
        />

        <SectionTitle>Evidence Summary</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Customer Evidence', value: CUSTOMER_EVIDENCE },
              { label: 'Inspection Evidence', value: INSPECTION_EVIDENCE },
            ],
            [{ label: 'Inspection Notes', value: <Text style={styles.notesText}>{inspectionNotes}</Text> }],
          ]}
        />

        {isAllWarehouses(scope) ? (
          <>
            <SectionTitle>Refund Summary</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'Refund Amount', value: rma.lineTotal },
                  { label: 'Refund Method', value: REFUND_METHOD },
                ],
              ]}
            />
          </>
        ) : null}

        <SectionTitle>Review Timeline</SectionTitle>
        <ReturnsTimeline items={timelineItems} />

        <SectionTitle>Decision</SectionTitle>
        {canProcess ? (
          <View style={styles.decisionRow}>
            <ReturnsButton
              flex
              variant="dangerOutline"
              label="Reject"
              icon={<CloseCrossIcon />}
              onPress={() => onReject(rma)}
            />
            <ReturnsButton
              flex
              variant="successOutline"
              label="Approve"
              icon={<CheckmarkIcon />}
              onPress={() => onApprove(rma)}
            />
          </View>
        ) : (
          <PermissionNote>Deciding an RMA needs the RMA processing permission.</PermissionNote>
        )}
      </ScrollView>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.sm, paddingBottom: adminSpacing.xl },
  notesText: { ...adminType.body, color: adminColors.ink },
  decisionRow: { flexDirection: 'row', gap: adminSpacing.md, marginTop: adminSpacing.xs, marginBottom: adminSpacing.lg },
});
