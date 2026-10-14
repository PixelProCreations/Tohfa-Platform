/**
 * RMA Detail — one return, on GET /admin/returns/{id} and its status history
 * (plan phase 10), with the next step the server will accept.
 *
 * The footer offers only what returnActions allows for the return's status
 * and the caller's docs/rbac.json codes (BR-61): Inspect / Reject on a PENDING
 * return, Review & Decide on an INSPECTED one, Refund to Wallet on an
 * APPROVED one, nothing on a closed one. The server re-checks every write
 * (409 INVALID_STATE_TRANSITION, CLAUDE.md 2.1). There is no bank refund:
 * rma.refund.bank_process is `none` for both warehouse roles.
 *
 * The same screen is Return History's detail (a closed return offers nothing).
 *
 * Hidden, because the return carries no such field: the eligibility banner,
 * the customer contact, payment status, sales channel, product name and grade
 * per item, unit price, evidence photos and the Main "Refund Information"
 * card. The order number and buyer name come from the order detail when the
 * caller can read it.
 */
// Design id: M10-S02
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminSpacing, adminType } from '../../../theme';
import { returnActions } from './mappers';
import {
  InfoCard,
  PermissionNote,
  ReturnDetailGate,
  ReturnItemsList,
  ReturnsButton,
  ReturnsFooter,
  ReturnsScreen,
  ReturnsTimeline,
  SectionTitle,
  StatusBadge,
} from './ReturnsParts';
import type { ReturnDetailView, ReturnsLiveStateProps, ReturnTimelineEntry, WarehouseScreenBaseProps } from './types';

export interface RmaDetailScreenProps extends WarehouseScreenBaseProps, ReturnsLiveStateProps {
  detail: ReturnDetailView | undefined;
  timeline: readonly ReturnTimelineEntry[];
  notFound?: boolean | undefined;
  /** "ORD-…" from the order detail, when it loaded. */
  orderNumber?: string | undefined;
  buyerName?: string | undefined;
  onInspect: () => void;
  onReview: () => void;
  onReject: () => void;
  onRefund: () => void;
}

export function RmaDetailScreen({
  can,
  onBack,
  detail,
  timeline,
  notFound,
  orderNumber,
  buyerName,
  onInspect,
  onReview,
  onReject,
  onRefund,
  isLoading,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
}: RmaDetailScreenProps) {
  const noValue = t('returns.noValue');
  const actions = detail === undefined ? null : returnActions(detail.status, can);

  const footer =
    actions === null ? null : (
      <ReturnsFooter>
        {actions.inspect ? <ReturnsButton label={t('returns.action.inspect')} onPress={onInspect} /> : null}
        {detail?.status === 'INSPECTED' && (actions.approve || actions.reject) ? (
          <ReturnsButton label={t('returns.action.review')} onPress={onReview} />
        ) : null}
        {detail?.status === 'PENDING' && actions.reject ? (
          <ReturnsButton label={t('returns.action.reject')} variant="dangerOutline" onPress={onReject} />
        ) : null}
        {actions.refundWallet ? <ReturnsButton label={t('returns.action.refundWallet')} onPress={onRefund} /> : null}
        {!actions.inspect && !actions.approve && !actions.reject && !actions.refundWallet ? (
          <PermissionNote>{t('returns.detail.noAction')}</PermissionNote>
        ) : null}
      </ReturnsFooter>
    );

  return (
    <ReturnsScreen title={t('returns.detail.title')} subtitle={detail?.reference} onBack={onBack} footer={footer}>
      <ReturnDetailGate detail={detail} notFound={notFound} isLoading={isLoading} error={error} onRetry={onRetry}>
        {(d) => (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={adminColors.brand} colors={[adminColors.brand]} />
              ) : undefined
            }
          >
            <SectionTitle>{t('returns.detail.request')}</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: t('returns.detail.reference'), value: d.reference },
                  { label: t('returns.detail.status'), value: <StatusBadge label={d.statusLabel} tone={d.statusTone} /> },
                ],
                [
                  { label: t('returns.detail.order'), value: orderNumber ?? noValue },
                  { label: t('returns.detail.created'), value: d.created },
                ],
                ...(buyerName === undefined ? [] : [[{ label: t('returns.detail.buyer'), value: buyerName }]]),
              ]}
            />

            <SectionTitle>{t('returns.detail.reason')}</SectionTitle>
            <InfoCard rows={[[{ label: t('returns.detail.reason'), value: d.reason }], ...(d.note ? [[{ label: t('returns.detail.note'), value: d.note }]] : [])]} />

            <SectionTitle>{t('returns.detail.items')}</SectionTitle>
            <ReturnItemsList items={d.items} />

            <SectionTitle>{t('returns.detail.timeline')}</SectionTitle>
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
