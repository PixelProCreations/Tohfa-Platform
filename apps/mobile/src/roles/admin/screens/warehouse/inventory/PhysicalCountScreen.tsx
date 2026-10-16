/**
 * Physical Count (design M3S11): record what is physically on the shelf for
 * one real batch (POST /admin/stock-verifications, BR-107).
 *
 * The app sends only the counted quantity (and optional notes). The server
 * snapshots the batch's ledger balance as the system quantity and derives
 * the variance, so the figures the variance review shows are the server's,
 * not a guess made here. Recording a count never edits the ledger.
 *
 * The batch comes from a `batchId` route param (Batch Detail) or is picked
 * from the warehouse's ACTIVE batches. Sends an Idempotency-Key: the same
 * count retried records once. Gate: inventory.stock_verification.perform
 * (the flow refuses the route without it; the server checks it again).
 */
import React, { useState } from 'react';
import { ScrollView, Text, TextInput } from 'react-native';
import { useIdempotencyKey } from '../../../api/hooks';
import { VERIFICATION_NOTES_MAX } from '../../../api/stockVerifications';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  InfoNote,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { buildCreateVerificationBody, COUNT_DRAFT_ERROR_KEY, stockActionErrorKey } from './adjustmentMappers';
import { BatchPicker, BatchSummaryCard, stockStyles } from './StockParts';
import type { BatchRow, InventoryScreenBaseProps } from './types';
import { useBatch } from './useInventoryData';
import { useActiveBatchOptions, useCreateVerificationMutation } from './useStockAdjustmentData';

export interface PhysicalCountScreenProps extends InventoryScreenBaseProps {
  /** The warehouse every request sends (InventoryFlow, BR-30). */
  warehouseId: string | undefined;
  /** A batch uuid the count is for, from the route; undefined shows the picker. */
  presetBatchId: string | undefined;
}

export function PhysicalCountScreen({ scope, onNavigate, onBack, warehouseId, presetBatchId }: PhysicalCountScreenProps) {
  const preset = useBatch(warehouseId, presetBatchId);
  const options = useActiveBatchOptions(presetBatchId === undefined ? warehouseId : undefined);
  const create = useCreateVerificationMutation();
  const idempotency = useIdempotencyKey();
  const [picked, setPicked] = useState<BatchRow | undefined>(undefined);
  const [countedText, setCountedText] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);

  const batch = presetBatchId !== undefined ? preset.batch : picked;
  const draft = buildCreateVerificationBody({ batchId: batch?.id, countedText, notes });
  const draftError = submitted && !draft.ok ? t(COUNT_DRAFT_ERROR_KEY[draft.error]) : null;

  const submit = () => {
    setSubmitted(true);
    if (!draft.ok) return;
    setActionError(null);
    create.mutate(
      { body: draft.body, idempotencyKey: idempotency.keyFor(draft.body) },
      {
        onSuccess: (verification) => {
          idempotency.reset();
          onNavigate?.('M3S12', { verificationId: verification.id });
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
      title={t('stockCount.count.title')}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} />}
      footer={
        <WalletFooter>
          <WalletButton label={t('stockCount.count.submit')} disabled={create.isPending} onPress={submit} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} keyboardShouldPersistTaps="handled">
        {actionError ? <InfoNote tone="danger">{t(stockActionErrorKey(actionError))}</InfoNote> : null}
        <SectionTitle>{t('stockShared.batch.title')}</SectionTitle>
        {renderBatch()}

        <Text style={stockStyles.fieldLabel}>{t('stockCount.count.countedLabel')}</Text>
        <TextInput
          style={stockStyles.input}
          value={countedText}
          onChangeText={setCountedText}
          keyboardType="decimal-pad"
          placeholder={t('stockShared.kgPlaceholder')}
          placeholderTextColor={adminColors.placeholder}
          accessibilityLabel={t('stockCount.count.countedLabel')}
        />

        <Text style={stockStyles.fieldLabel}>{t('stockCount.count.notesLabel')}</Text>
        <TextInput
          style={[stockStyles.input, stockStyles.multiline]}
          value={notes}
          onChangeText={setNotes}
          maxLength={VERIFICATION_NOTES_MAX}
          multiline
          placeholder={t('stockCount.count.notesPlaceholder')}
          placeholderTextColor={adminColors.placeholder}
          accessibilityLabel={t('stockCount.count.notesLabel')}
        />
        {draftError ? <Text style={stockStyles.error}>{draftError}</Text> : null}

        <InfoNote tone="brandSoft">{t('stockCount.count.note')}</InfoNote>
      </ScrollView>
    </WalletScreen>
  );
}
