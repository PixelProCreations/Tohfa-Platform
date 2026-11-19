/**
 * Return History Detail — read-only record of a completed (closed) return.
 *
 * Shows: customer, order, issue category, inspection summary, decision and
 * refund. No action buttons: a closed return cannot be acted on (BR-61).
 *
 * Data comes from ReturnDetailView (GET /admin/returns/{id}) plus the linked
 * order (ReturnOrderView) and the status trail (ReturnTimelineEntry[]). Fields
 * the current API does not yet expose (inspectionResult, processedBy, refund
 * details) are shown as the no-value dash until the model is extended.
 *
 * Design id: M10-S06D
 */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminSpacing } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { totalRequestedGrams } from './mappers';
import {
  InfoCard,
  ReturnDetailGate,
  ReturnsScreen,
  ReturnsTimeline,
  SectionTitle,
} from './ReturnsParts';
import type {
  ReturnDetailView,
  ReturnOrderView,
  ReturnsLiveStateProps,
  ReturnTimelineEntry,
  WarehouseScreenBaseProps,
} from './types';

export interface ReturnHistoryDetailScreenProps extends WarehouseScreenBaseProps, ReturnsLiveStateProps {
  detail: ReturnDetailView | undefined;
  order?: ReturnOrderView | undefined;
  timeline: readonly ReturnTimelineEntry[];
  notFound?: boolean | undefined;
}

export function ReturnHistoryDetailScreen({
  scope: _scope,
  can: _can,
  onBack,
  detail,
  order,
  timeline,
  notFound,
  isLoading,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
}: ReturnHistoryDetailScreenProps) {
  const noValue = ADMIN_NO_VALUE;

  return (
    <ReturnsScreen
      title={t('returns.history.detail.title')}
      subtitle={detail?.reference}
      onBack={onBack}
    >
      <ReturnDetailGate detail={detail} notFound={notFound} isLoading={isLoading} error={error} onRetry={onRetry}>
        {(d) => (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  tintColor={adminColors.brand}
                  colors={[adminColors.brand]}
                />
              ) : undefined
            }
          >
            <SectionTitle>{t('returns.detail.customer')}</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: t('returns.detail.buyer'), value: order?.buyerName ?? noValue },
                  { label: t('returns.history.detail.customerId'), value: order?.customerCode ?? noValue },
                ],
              ]}
            />

            <SectionTitle>{t('returns.detail.orderSection')}</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: t('returns.detail.order'), value: order?.orderNumber ?? noValue },
                  { label: t('returns.detail.orderDate'), value: order?.placedLabel ?? noValue },
                ],
                [
                  { label: t('returns.detail.warehouse'), value: order?.warehouseName ?? noValue },
                  { label: t('returns.detail.channel'), value: order?.channelLabel ?? noValue },
                ],
              ]}
            />

            <SectionTitle>{t('returns.detail.issueSection')}</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: t('returns.detail.issueCategory'), value: d.reason },
                  { label: t('returns.detail.reported'), value: d.created },
                ],
                ...(d.note !== null ? [[{ label: t('returns.detail.note'), value: d.note }]] : []),
              ]}
            />

            <SectionTitle>{t('returns.history.detail.inspection')}</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: t('returns.history.detail.inspectionResult'), value: noValue },
                  { label: t('returns.history.detail.returnedQty'), value: formatKg(totalRequestedGrams(d.items)) },
                ],
                [{ label: t('returns.history.detail.inspectionNotes'), value: noValue }],
              ]}
            />

            <SectionTitle>{t('returns.history.detail.decision')}</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: t('returns.history.detail.decisionLabel'), value: d.statusLabel },
                  { label: t('returns.history.detail.decisionDate'), value: noValue },
                ],
                [{ label: t('returns.history.detail.processedBy'), value: noValue }],
              ]}
            />

            <SectionTitle>{t('returns.history.detail.refund')}</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: t('returns.refund.statusLabel'), value: noValue },
                  { label: t('returns.detail.refundMethod'), value: noValue },
                ],
                [
                  { label: t('returns.detail.refundAmount'), value: noValue },
                  { label: t('returns.history.detail.refundRef'), value: noValue },
                ],
              ]}
            />

            {timeline.length > 0 ? (
              <>
                <SectionTitle>{t('returns.detail.timeline')}</SectionTitle>
                <ReturnsTimeline items={timeline} />
              </>
            ) : null}
          </ScrollView>
        )}
      </ReturnDetailGate>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.xxl,
  },
});
