/**
 * Variance Review (design M3S12), BR-107.
 *
 * With a `verificationId` route param: one count as the server recorded it
 * (GET /admin/stock-verifications/{id}): the system quantity it snapshotted,
 * what was counted and the variance. "Raise adjustment" hands a RECORDED
 * count's non-zero variance to the adjustment workflow
 * (POST /admin/stock-verifications/{id}/adjustment, Idempotency-Key): the
 * server creates one PENDING COUNT_CORRECTION of exactly the variance, and
 * the stock moves only when another admin approves it (BR-37a/b). The
 * action is drawn only when canRaiseAdjustment says so (status, variance,
 * no adjustment yet, inventory.stock_adjustment.create).
 *
 * Without one: the review queue, the scope's counts that found a variance
 * (GET /admin/stock-verifications?hasVariance=true).
 */
import React, { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { ApiError } from '../../../../../shell/api/client';
import { useIdempotencyKey } from '../../../api/hooks';
import { t } from '../../../i18n';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  EmptyState,
  InfoCard,
  InfoNote,
  ScopeHeader,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { canRaiseAdjustment, stockActionErrorKey, type VerificationView } from './adjustmentMappers';
import { StockListRow, VarianceTiles } from './StockParts';
import type { InventoryScreenBaseProps } from './types';
import { useRaiseAdjustmentMutation, useVerificationDetail, useVerificationList } from './useStockAdjustmentData';

export interface VarianceReviewScreenProps extends InventoryScreenBaseProps {
  /** The warehouse every request sends (InventoryFlow, BR-30). */
  warehouseId: string | undefined;
  /** The count to review; undefined shows the review queue. */
  verificationId: string | undefined;
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.problem.code === 'NOT_FOUND';
}

function VarianceQueue({ scope, onNavigate, onBack, warehouseId }: VarianceReviewScreenProps) {
  const list = useVerificationList(warehouseId, true);
  const state = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });
  return (
    <WalletScreen title={t('stockCount.review.title')} onBack={onBack} headerExtra={<ScopeHeader scope={scope} />}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <InfoNote tone="info">{t('stockCount.review.queueNote')}</InfoNote>
        {state === 'loading' ? <AdminLoadingState /> : null}
        {state === 'error' ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
        {state === 'empty' ? <EmptyState title={t('stockCount.review.empty')} /> : null}
        {list.items.map((item) => (
          <StockListRow
            key={item.id}
            title={item.batchCode}
            meta={t('stockShared.pair', { first: item.productLabel, second: item.verifiedAt })}
            detail={t('stockCount.row.variance', { variance: item.varianceText })}
            badge={{ label: item.statusLabel, tone: item.statusTone }}
            onPress={() => onNavigate?.('M3S12', { verificationId: item.id })}
          />
        ))}
        {list.hasMore ? <WalletButton label={t('stockShared.loadMore')} variant="outline" onPress={list.loadMore} /> : null}
      </ScrollView>
    </WalletScreen>
  );
}

function CountBody({ count }: { count: VerificationView }) {
  return (
    <>
      <InfoCard
        rows={[
          [
            { label: t('stockShared.field.batch'), value: count.batchCode },
            { label: t('stockShared.field.product'), value: count.productLabel },
          ],
          [
            { label: t('stockCount.review.countedAt'), value: count.verifiedAt },
            { label: t('stockShared.field.reference'), value: count.ref },
          ],
        ]}
      />
      <SectionTitle right={<StatusBadge label={count.statusLabel} tone={count.statusTone} />}>
        {t('stockCount.review.figures')}
      </SectionTitle>
      <VarianceTiles
        systemText={count.systemText}
        countedText={count.countedText}
        varianceText={count.varianceText}
        varianceGrams={count.varianceGrams}
      />
      {count.notes ? <InfoNote tone="info">{t('stockCount.review.notes', { text: count.notes })}</InfoNote> : null}
      {count.varianceGrams === 0 ? <InfoNote tone="success">{t('stockCount.review.matched')}</InfoNote> : null}
      {count.adjustmentId !== null && count.adjustmentStatusLabel !== null ? (
        <InfoNote tone="brandSoft">{t('stockCount.review.raised', { status: count.adjustmentStatusLabel })}</InfoNote>
      ) : null}
      {count.varianceGrams !== 0 && count.adjustmentId === null ? (
        <InfoNote tone="warning">{t('stockCount.review.ledgerNote')}</InfoNote>
      ) : null}
    </>
  );
}

export function VarianceReviewScreen(props: VarianceReviewScreenProps) {
  const { scope, can, onNavigate, onBack, warehouseId, verificationId } = props;
  const detail = useVerificationDetail(warehouseId, verificationId);
  const raise = useRaiseAdjustmentMutation();
  const idempotency = useIdempotencyKey();
  const [actionError, setActionError] = useState<unknown>(null);

  if (verificationId === undefined) return <VarianceQueue {...props} />;

  const count = detail.item;
  if (count === undefined) {
    return (
      <WalletScreen title={t('stockCount.review.title')} onBack={onBack} headerExtra={<ScopeHeader scope={scope} />}>
        {detail.isLoading ? <AdminLoadingState /> : null}
        {!detail.isLoading && isNotFound(detail.error) ? <EmptyState title={t('stockCount.review.notFound')} /> : null}
        {!detail.isLoading && !isNotFound(detail.error) && detail.error ? (
          <AdminErrorState error={detail.error} onRetry={detail.refresh} />
        ) : null}
      </WalletScreen>
    );
  }

  const offerRaise = canRaiseAdjustment(can, count);

  const runRaise = () => {
    setActionError(null);
    raise.mutate(
      { id: count.id, idempotencyKey: idempotency.keyFor({ action: 'raise', id: count.id }) },
      {
        onSuccess: (result) => {
          idempotency.reset();
          onNavigate?.('M3S17', { adjustmentId: result.adjustment.id });
        },
        onError: setActionError,
      },
    );
  };

  const confirmRaise = () => {
    Alert.alert(t('stockCount.review.raiseConfirmTitle'), t('stockCount.review.raiseConfirmBody', { variance: count.varianceText }), [
      { text: t('stockShared.keep'), style: 'cancel' },
      { text: t('stockCount.review.raise'), onPress: runRaise },
    ]);
  };

  return (
    <WalletScreen
      title={t('stockCount.review.title')}
      subtitle={count.batchCode}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} />}
      footer={
        !offerRaise && count.adjustmentId === null ? undefined : (
        <WalletFooter>
          {offerRaise ? (
            <WalletButton label={t('stockCount.review.raise')} disabled={raise.isPending} onPress={confirmRaise} />
          ) : null}
          {count.adjustmentId !== null ? (
            <WalletButton
              label={t('stockCount.review.viewAdjustment')}
              variant="outline"
              onPress={() => onNavigate?.('M3S17', { adjustmentId: count.adjustmentId })}
            />
          ) : null}
        </WalletFooter>
        )
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {actionError ? <InfoNote tone="danger">{t(stockActionErrorKey(actionError))}</InfoNote> : null}
        <CountBody count={count} />
      </ScrollView>
    </WalletScreen>
  );
}
