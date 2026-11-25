/**
 * Review Return — the inspection result and the decision (plan phase 10).
 *
 * Shows what the inspection recorded per item, then Approve and Reject.
 * BR-61: Approve exists only for an INSPECTED return with rma.refund.approve
 * (approveGate), and is drawn disabled, with the reason, when nothing was
 * accepted on any line: a Rs 0 approval would leave the return stuck in
 * APPROVED (wallet.move refuses a zero credit, and an APPROVED return cannot
 * be rejected). Reject stays offered (PENDING or INSPECTED, same code).
 *
 * Drawn with a dash until the API can back them: the issue category, the
 * inspected quantity (the return keeps accepted and damaged per item, shown in
 * the list below; which of them the design means by "inspected" is not
 * specified), the customer and inspection evidence, the inspection notes and
 * the Main "Refund Summary" (the server works the refund out from the order
 * price only when it is paid). Customer and order come from the order detail
 * when the caller can read it.
 */
// Design id: M10-S04
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminSpacing, adminType } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { approveGate, returnActions, totalRequestedGrams } from './mappers';
import {
  InfoCard,
  isAllWarehouses,
  PermissionNote,
  ReturnDetailGate,
  ReturnItemsList,
  ReturnsButton,
  ReturnsFooter,
  ReturnsScreen,
  ReturnsTimeline,
  SectionTitle,
} from './ReturnsParts';
import type { ReturnDetailView, ReturnOrderView, ReturnsLiveStateProps, ReturnTimelineEntry, WarehouseScreenBaseProps } from './types';

export interface ReviewReturnRequestScreenProps extends WarehouseScreenBaseProps, ReturnsLiveStateProps {
  detail: ReturnDetailView | undefined;
  /** The status trail, oldest first. */
  timeline: readonly ReturnTimelineEntry[];
  /** The linked order's facts, once loaded (and only when the caller can read orders). */
  order?: ReturnOrderView | undefined;
  notFound?: boolean | undefined;
  onApprove: () => void;
  onReject: () => void;
}

export function ReviewReturnRequestScreen({
  scope,
  can,
  onBack,
  detail,
  timeline,
  order,
  notFound,
  onApprove,
  onReject,
  isLoading,
  error,
  onRetry,
}: ReviewReturnRequestScreenProps) {
  const noValue = ADMIN_NO_VALUE;
  const gate = detail === undefined ? null : approveGate(detail.status, detail.items, can);
  const actions = detail === undefined ? null : returnActions(detail.status, can);

  const footer =
    gate === null || actions === null ? null : (
      <ReturnsFooter>
        {gate.visible ? (
          <ReturnsButton label={t('returns.action.approve')} variant="successOutline" disabled={!gate.enabled} onPress={onApprove} />
        ) : null}
        {gate.noteKey ? <PermissionNote>{t(gate.noteKey)}</PermissionNote> : null}
        {actions.reject ? <ReturnsButton label={t('returns.action.reject')} variant="dangerOutline" onPress={onReject} /> : null}
        {!gate.visible && !actions.reject ? <PermissionNote>{t('returns.detail.noAction')}</PermissionNote> : null}
      </ReturnsFooter>
    );

  return (
    <ReturnsScreen title={t('returns.review.title')} subtitle={detail?.reference} onBack={onBack} footer={footer}>
      <ReturnDetailGate detail={detail} notFound={notFound} isLoading={isLoading} error={error} onRetry={onRetry}>
        {(d) => (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <SectionTitle>{t('returns.review.summary')}</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: t('returns.detail.customer'), value: order?.buyerName ?? noValue },
                  { label: t('returns.detail.order'), value: order?.orderNumber ?? noValue },
                ],
                [
                  { label: t('returns.review.issue'), value: noValue },
                  { label: t('returns.review.requestedQty'), value: formatKg(totalRequestedGrams(d.items)) },
                ],
                [{ label: t('returns.review.inspectedQty'), value: noValue }],
              ]}
            />

            <SectionTitle>{t('returns.detail.items')}</SectionTitle>
            <ReturnItemsList items={d.items} />

            <SectionTitle>{t('returns.review.evidenceSection')}</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: t('returns.review.customerEvidence'), value: noValue },
                  { label: t('returns.review.inspectionEvidence'), value: noValue },
                ],
                [{ label: t('returns.review.inspectionNotes'), value: noValue }],
              ]}
            />

            {isAllWarehouses(scope) ? (
              <>
                <SectionTitle>{t('returns.review.refundSummary')}</SectionTitle>
                <InfoCard
                  rows={[
                    [
                      { label: t('returns.detail.refundAmount'), value: noValue },
                      { label: t('returns.detail.refundMethod'), value: noValue },
                    ],
                  ]}
                />
              </>
            ) : null}

            <SectionTitle>{t('returns.review.timeline')}</SectionTitle>
            {timeline.length === 0 ? <Text style={styles.muted}>{t('returns.detail.timelineEmpty')}</Text> : <ReturnsTimeline items={timeline} />}
          </ScrollView>
        )}
      </ReturnDetailGate>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.sm, paddingBottom: adminSpacing.xl },
  muted: { ...adminType.rowMeta, color: adminColors.muted },
});
