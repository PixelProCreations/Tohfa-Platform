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
 * Drawn with a dash until the API can back them: the return-window
 * eligibility, the customer evidence photos, the issue category, the ticket,
 * the requested resolution, the Main "Refund Information" card, and the
 * product name, grade, purchased quantity, unit price and line total of each
 * returned item (the order's lines carry no order-item id, so a return item
 * cannot be matched to its line). The customer, order number, date, warehouse,
 * sales channel and payment status come from the order detail when the caller
 * can read it (order.list.view_all), and are dashes while it is not loaded.
 */
// Design id: M10-S02
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { returnActions, totalRequestedGrams } from './mappers';
import {
  EvidenceThumbnails,
  InfoCard,
  isAllWarehouses,
  IssueTag,
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
import type { ReturnDetailView, ReturnOrderView, ReturnsLiveStateProps, ReturnTimelineEntry, WarehouseScreenBaseProps } from './types';

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
      <Path d="M9 12l2 2 4-4" stroke={adminColors.success.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface RmaDetailScreenProps extends WarehouseScreenBaseProps, ReturnsLiveStateProps {
  detail: ReturnDetailView | undefined;
  timeline: readonly ReturnTimelineEntry[];
  notFound?: boolean | undefined;
  /** The linked order's facts, once loaded (and only when the caller can read orders). */
  order?: ReturnOrderView | undefined;
  onInspect: () => void;
  onReview: () => void;
  onReject: () => void;
  onRefund: () => void;
}

export function RmaDetailScreen({
  scope,
  can,
  onBack,
  detail,
  timeline,
  notFound,
  order,
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
  const noValue = ADMIN_NO_VALUE;
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
            <View style={styles.eligibleBanner}>
              <VerifiedCheckIcon />
              <Text style={styles.eligibleBannerText}>{t('returns.detail.eligibility', { value: noValue })}</Text>
            </View>

            <SectionTitle>{t('returns.detail.request')}</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: t('returns.detail.reference'), value: d.reference },
                  { label: t('returns.detail.status'), value: <StatusBadge label={d.statusLabel} tone={d.statusTone} /> },
                ],
                [{ label: t('returns.detail.created'), value: d.created }],
              ]}
            />

            <SectionTitle>{t('returns.detail.customer')}</SectionTitle>
            <View style={styles.customerCard}>
              <Text style={styles.customerName}>{order?.buyerName ?? noValue}</Text>
              <Text style={styles.customerContact}>{`${order?.customerCode ?? noValue} · ${order?.mobileMasked ?? noValue}`}</Text>
            </View>

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
                [{ label: t('returns.detail.payment'), value: order?.paymentStatusLabel ?? noValue }],
              ]}
            />

            <SectionTitle>{t('returns.detail.productSection')}</SectionTitle>
            {d.items.map((item) => (
              <View key={item.orderItemId} style={styles.productBlock}>
                <InfoCard
                  rows={[
                    [
                      { label: t('returns.item.product'), value: noValue },
                      { label: t('returns.item.grade'), value: noValue },
                    ],
                    [
                      { label: t('returns.item.quantityPurchased'), value: noValue },
                      { label: t('returns.item.unitPrice'), value: noValue },
                    ],
                    [{ label: t('returns.item.lineTotal'), value: noValue }],
                  ]}
                />
              </View>
            ))}

            <SectionTitle>{t('returns.detail.issueSection')}</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: t('returns.detail.issueCategory'), value: <IssueTag label={noValue} /> },
                  { label: t('returns.detail.reported'), value: d.created },
                ],
              ]}
            />

            <SectionTitle>{t('returns.detail.reason')}</SectionTitle>
            <InfoCard rows={[[{ label: t('returns.detail.reason'), value: d.reason }], ...(d.note ? [[{ label: t('returns.detail.note'), value: d.note }]] : [])]} />

            <SectionTitle>{t('returns.detail.evidence')}</SectionTitle>
            <EvidenceThumbnails />

            <SectionTitle>{t('returns.detail.ticketSection')}</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: t('returns.detail.ticket'), value: noValue },
                  { label: t('returns.detail.reference'), value: d.reference },
                ],
              ]}
            />

            <SectionTitle>{t('returns.detail.quantitySection')}</SectionTitle>
            <InfoCard rows={[[{ label: t('returns.detail.requestedQty'), value: formatKg(totalRequestedGrams(d.items)) }]]} />

            <SectionTitle>{t('returns.detail.resolutionSection')}</SectionTitle>
            <InfoCard rows={[[{ label: t('returns.detail.resolution'), value: noValue }]]} />

            {isAllWarehouses(scope) ? (
              <>
                <SectionTitle>{t('returns.detail.refundInfo')}</SectionTitle>
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
  eligibleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.smMd,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    backgroundColor: adminColors.success.bg,
    borderWidth: 1,
    borderColor: adminColors.success.border,
    borderRadius: adminRadius.md,
  },
  eligibleBannerText: { ...adminType.caption, color: adminColors.success.text, flex: 1 },
  customerCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
  },
  customerName: { ...adminType.caption, color: adminColors.muted, marginBottom: adminSpacing.xs },
  customerContact: { ...adminType.rowTitle, color: adminColors.ink },
  productBlock: { marginBottom: adminSpacing.sm },
});
