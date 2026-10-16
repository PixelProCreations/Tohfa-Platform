/**
 * Stock Adjustment Request (design M3S13): raise a manual adjustment on one
 * real batch (POST /admin/stock-adjustments, BR-37).
 *
 * The admin picks the batch (or arrives with a `batchId` route param), the
 * type, the direction and an unsigned quantity, and writes a reason (5-500
 * characters). DAMAGE, SHRINKAGE and EXPIRY can only remove stock; only a
 * COUNT_CORRECTION may add. The quantity is signed here as integer grams
 * (buildCreateAdjustmentBody) and sent as a kg string.
 *
 * Nothing moves on submit: the adjustment is PENDING until an admin other
 * than its creator approves it (BR-37a), and the approval writes the ledger
 * row (BR-37b). Sends an Idempotency-Key, so a retried submit raises once.
 * Gate: inventory.stock_adjustment.create (the flow refuses the route
 * without it; the server checks it again).
 */
import React, { useState } from 'react';
import { ScrollView, Text, TextInput } from 'react-native';
import { useIdempotencyKey } from '../../../api/hooks';
import { ADJUSTMENT_REASON_MAX, type StockAdjustmentType } from '../../../api/stockAdjustments';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  ChipGroup,
  InfoNote,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  ADJUSTMENT_DRAFT_ERROR_KEY,
  ADJUSTMENT_TYPE_OPTIONS,
  adjustmentTypeLabel,
  buildCreateAdjustmentBody,
  directionsFor,
  stockActionErrorKey,
  type AdjustmentDirection,
} from './adjustmentMappers';
import { BatchPicker, BatchSummaryCard, stockStyles } from './StockParts';
import type { BatchRow, InventoryScreenBaseProps } from './types';
import { useBatch } from './useInventoryData';
import { useActiveBatchOptions, useCreateAdjustmentMutation } from './useStockAdjustmentData';

export interface StockAdjustmentRequestScreenProps extends InventoryScreenBaseProps {
  /** The warehouse every request sends (InventoryFlow, BR-30). */
  warehouseId: string | undefined;
  /** A batch uuid from the route; undefined shows the picker. */
  presetBatchId: string | undefined;
}

const DIRECTION_LABEL: Record<AdjustmentDirection, 'stockAdj.direction.remove' | 'stockAdj.direction.add'> = {
  remove: 'stockAdj.direction.remove',
  add: 'stockAdj.direction.add',
};

export function StockAdjustmentRequestScreen({ scope, onNavigate, onBack, warehouseId, presetBatchId }: StockAdjustmentRequestScreenProps) {
  const preset = useBatch(warehouseId, presetBatchId);
  const options = useActiveBatchOptions(presetBatchId === undefined ? warehouseId : undefined);
  const create = useCreateAdjustmentMutation();
  const idempotency = useIdempotencyKey();
  const [picked, setPicked] = useState<BatchRow | undefined>(undefined);
  const [type, setType] = useState<StockAdjustmentType>('DAMAGE');
  const [direction, setDirection] = useState<AdjustmentDirection>('remove');
  const [qtyText, setQtyText] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);

  const batch = presetBatchId !== undefined ? preset.batch : picked;
  const draft = buildCreateAdjustmentBody({
    batchId: batch?.id,
    type,
    direction,
    qtyText,
    reason,
    availableGrams: batch?.availableGrams ?? null,
  });
  const draftError = submitted && !draft.ok ? t(ADJUSTMENT_DRAFT_ERROR_KEY[draft.error]) : null;

  const changeType = (next: StockAdjustmentType) => {
    setType(next);
    // A loss type can only remove stock; drop an "add" picked for a count correction.
    if (!directionsFor(next).includes(direction)) setDirection('remove');
  };

  const submit = () => {
    setSubmitted(true);
    if (!draft.ok) return;
    setActionError(null);
    create.mutate(
      { body: draft.body, idempotencyKey: idempotency.keyFor(draft.body) },
      {
        onSuccess: (adjustment) => {
          idempotency.reset();
          onNavigate?.('M3S17', { adjustmentId: adjustment.id });
        },
        onError: setActionError,
      },
    );
  };

  const renderBatch = () => {
    if (presetBatchId !== undefined) {
      if (preset.isLoading) return <AdminLoadingState />;
      if (preset.batch === undefined) return <AdminErrorState error={preset.error} onRetry={preset.refresh} />;
      return <BatchSummaryCard batch={preset.batch} />;
    }
    return (
      <>
        {picked !== undefined ? <BatchSummaryCard batch={picked} /> : null}
        <BatchPicker
          batches={options.items}
          selectedId={picked?.id}
          onSelect={setPicked}
          isLoading={options.isLoading}
          error={options.error}
          onRetry={options.refresh}
          hasMore={options.hasMore}
          onLoadMore={options.loadMore}
        />
      </>
    );
  };

  return (
    <WalletScreen
      title={t('stockAdj.request.title')}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} />}
      footer={
        <WalletFooter>
          <WalletButton label={t('stockAdj.request.submit')} disabled={create.isPending} onPress={submit} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} keyboardShouldPersistTaps="handled">
        {actionError ? <InfoNote tone="danger">{t(stockActionErrorKey(actionError))}</InfoNote> : null}
        <SectionTitle>{t('stockShared.batch.title')}</SectionTitle>
        {renderBatch()}

        <SectionTitle>{t('stockAdj.request.type')}</SectionTitle>
        <ChipGroup options={ADJUSTMENT_TYPE_OPTIONS} value={type} onChange={changeType} labelOf={adjustmentTypeLabel} />

        <SectionTitle>{t('stockAdj.request.direction')}</SectionTitle>
        <ChipGroup
          options={directionsFor(type)}
          value={direction}
          onChange={setDirection}
          labelOf={(option) => t(DIRECTION_LABEL[option])}
        />

        <Text style={stockStyles.fieldLabel}>{t('stockAdj.request.qtyLabel')}</Text>
        <TextInput
          style={stockStyles.input}
          value={qtyText}
          onChangeText={setQtyText}
          keyboardType="decimal-pad"
          placeholder={t('stockShared.kgPlaceholder')}
          placeholderTextColor={adminColors.placeholder}
          accessibilityLabel={t('stockAdj.request.qtyLabel')}
        />

        <Text style={stockStyles.fieldLabel}>{t('stockAdj.request.reasonLabel')}</Text>
        <TextInput
          style={[stockStyles.input, stockStyles.multiline]}
          value={reason}
          onChangeText={setReason}
          maxLength={ADJUSTMENT_REASON_MAX}
          multiline
          placeholder={t('stockAdj.request.reasonPlaceholder')}
          placeholderTextColor={adminColors.placeholder}
          accessibilityLabel={t('stockAdj.request.reasonLabel')}
        />
        {draftError ? <Text style={stockStyles.error}>{draftError}</Text> : null}

        <InfoNote tone="brandSoft">{t('stockAdj.request.note')}</InfoNote>
      </ScrollView>
    </WalletScreen>
  );
}
