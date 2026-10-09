/**
 * Review Return Request — the inspection outcome and evidence, then the
 * Approve / Reject decision.
 *
 * Gates (docs/rbac.json; the server re-checks, CLAUDE.md 2.1):
 *   - Approve and Reject only with `rma.request.process` (FINAL_LIST row 104).
 *     Approving additionally needs `rma.refund.approve`, which the confirm step
 *     (ApproveReturnScreen) checks.
 *
 * Absorbs MainWarehouseReviewReturnRequestScreen (pair M10-S04). The Main twin
 * bundled confirm + reject + refund in one file; those are the separate
 * ApproveReturn / RejectReturnRequest / RefundStatus routes of ReturnsFlow. Its
 * "Refund Summary" card (amount + method) is rendered for the Main view.
 */
// Design id: M10-S04
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminSpacing, adminType } from '../../../theme';
import { REVIEW_TIMELINE, SAMPLE_INSPECTED_QTY, SAMPLE_INSPECTION_NOTES } from './fixtures';
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

// Mock evidence counts and refund method until RMAs are wired.
const CUSTOMER_EVIDENCE = '2 Photos';
const INSPECTION_EVIDENCE = '3 Photos';
const REFUND_METHOD = 'TOHFA Wallet';

function CheckmarkIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={adminColors.success.text} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseCrossIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={adminColors.danger.text} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ReviewReturnRequestScreen({
  scope,
  can,
  rma,
  inspectedQty = SAMPLE_INSPECTED_QTY,
  inspectionNotes = SAMPLE_INSPECTION_NOTES,
  onBack,
  onApprove,
  onReject,
}: ReviewReturnRequestScreenProps) {
  const canProcess = can('rma.request.process');

  return (
    <ReturnsScreen title="Review Return Request" subtitle={rma.rmaId} onBack={onBack}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>RMA Summary</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Customer', value: rma.customerName },
              { label: 'Order', value: rma.orderId },
            ],
            [
              { label: 'Issue', value: rma.issueCategory },
              { label: 'Requested Quantity', value: rma.requestedQuantity },
            ],
            [{ label: 'Inspected Quantity', value: inspectedQty }],
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
        <ReturnsTimeline items={REVIEW_TIMELINE} />

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
          <PermissionNote>Deciding on a return needs the RMA processing permission.</PermissionNote>
        )}
      </ScrollView>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.sm, paddingBottom: adminSpacing.xxl },
  notesText: { ...adminType.body, color: adminColors.ink },
  decisionRow: { flexDirection: 'row', gap: adminSpacing.md, marginTop: adminSpacing.xs },
});
