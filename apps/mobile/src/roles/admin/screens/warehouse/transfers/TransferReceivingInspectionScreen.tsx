/**
 * Transfer Receiving Inspection: verify what arrived of an IN_TRANSIT transfer
 * and record the receipt (POST /warehouse-transfers/{id}/receive,
 * Idempotency-Key), live.
 *
 * Gate: scope-locked; for Sub the transfer's destination must be
 * scope.warehouseId, otherwise "not found" (the server answers 404 for a
 * transfer outside the scope, BR-30, and 403 WAREHOUSE_SCOPE_VIOLATION for a
 * Sub admin of the source). Complete Transfer Receipt needs
 * `transfer.inter_warehouse.receive` on an IN_TRANSIT transfer.
 *
 * Quantities are integer grams (transferReceiving.ts): each line of the
 * transfer gets the verified received quantity (pre-filled with what was
 * sent, as before); the body sends EVERY line as a kg string, and a receipt
 * note is required as soon as any line is short (BR-102: the shortfall is
 * recorded, not written off). One Idempotency-Key per body, and a write whose
 * outcome is unknown is replayed with the same body (BR-118). The summary
 * after the receive (transfer, route, sent, received, discrepancy and the
 * destination batch codes the scope can read) is shown in a dialog before
 * returning, from the receive response.
 *
 * Not offered, because the API has nothing behind them (owner decision): an
 * arrival step, per-line damage / spoilage / condition / grade match, the
 * actual product, accept / partial accept / reject (a transfer receive has no
 * decision: it records the quantities), the receipt number, a storage
 * location and resolving the discrepancy.
 */
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ApiError } from '../../../../../shell/api/client';
import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  CheckIcon,
  EmptyState,
  InfoCard,
  InfoNote,
  isAllWarehouses,
  PermissionNote,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { TRANSFER_CODES } from './TransferParts';
import {
  buildTransferReceiveBody,
  canReceiveTransfer,
  destBatchIdsToRead,
  initialReceivedEntries,
  RECEIPT_NOTE_MAX,
  RECEIVE_PROBLEM_KEY,
  receiptSummaryLines,
  receiveFigures,
  sourceBatchIdsToRead,
  toLiveTransferDetail,
  TRANSFER_RECEIVING_CODES,
  transferProductLabel,
  transferReceiptSummary,
  transferRouteText,
} from './transferReceiving';
import {
  readBatchCodes,
  useReceiveTransfer,
  useTransferBatchFacts,
  useTransferDetail,
  useTransferNaming,
} from './useTransferReceiving';
import type { WarehouseScreenBaseProps } from './types';

export interface TransferReceivingInspectionScreenProps extends WarehouseScreenBaseProps {
  /** The transfer's uuid. */
  transferId?: string | undefined;
  /** The receipt was recorded (after its summary was shown). */
  onCompleteTransfer?: ((transferId: string) => void) | undefined;
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.problem.status === 404;
}

export function TransferReceivingInspectionScreen({
  scope,
  can,
  onBack,
  transferId,
  onCompleteTransfer,
}: TransferReceivingInspectionScreenProps) {
  const naming = useTransferNaming(scope, can);
  const detail = useTransferDetail(scope, can, transferId, naming);
  const transfer =
    detail.transfer !== undefined && (scope.warehouseId === undefined || detail.transfer.destinationWarehouseId === scope.warehouseId)
      ? detail.transfer
      : undefined;
  const batchIds = useMemo(() => (transfer === undefined ? [] : sourceBatchIdsToRead(scope, can, transfer)), [scope, can, transfer]);
  const facts = useTransferBatchFacts(scope, batchIds);
  const receive = useReceiveTransfer();
  // null until the admin edits: each line starts at the quantity sent.
  const [entered, setEntered] = useState<Record<string, string> | null>(null);
  const [note, setNote] = useState('');
  // True from the tap until the summary is shown: a second tap must not send a second receive.
  const [busy, setBusy] = useState(false);

  if (transfer === undefined) {
    const notFound =
      transferId === undefined || !can(TRANSFER_RECEIVING_CODES.view) || isNotFound(detail.error) || detail.transfer !== undefined;
    return (
      <WalletScreen title={t('transfers.inspection.title')} onBack={onBack} headerExtra={<ScopeHeader scope={scope} />}>
        {detail.isLoading ? (
          <AdminLoadingState />
        ) : notFound ? (
          <EmptyState title={t('transfers.detail.notFound.title')} subtitle={t('transfers.inspection.notFound.subtitle')} />
        ) : (
          <AdminErrorState error={detail.error} onRetry={detail.refresh} />
        )}
      </WalletScreen>
    );
  }

  const canReceive = can(TRANSFER_CODES.receive);
  const receivable = canReceiveTransfer(scope, can, transfer);
  const values = entered ?? initialReceivedEntries(transfer.lines);
  const figures = receiveFigures(transfer.lines, values);
  const result = buildTransferReceiveBody(transfer.lines, values, note);
  const mismatch = figures.differenceGrams !== null && figures.differenceGrams !== 0;
  const qtyProblem = !result.ok && (result.problem === 'QTY_INVALID' || result.problem === 'QTY_ABOVE_SENT') ? result.problem : undefined;
  const product = transferProductLabel(transfer, facts.cropNames);
  const sentText = transfer.sentGrams === null ? undefined : formatKg(transfer.sentGrams);
  const route = transferRouteText(transfer);
  const singleLine = transfer.lines.length === 1;

  const detailsRows = [
    [
      { label: t('transfers.detail.transferId'), value: transfer.code },
      ...(transfer.sourceName !== undefined ? [{ label: t('transfers.detail.source'), value: transfer.sourceName }] : []),
    ],
    [
      ...(transfer.destinationName !== undefined ? [{ label: t('transfers.detail.destination'), value: transfer.destinationName }] : []),
      ...(sentText !== undefined
        ? [
            {
              label: t('transfers.inspection.sentQuantity'),
              value: product === undefined ? sentText : t('transfers.inspection.sentProduceQty', { product, qty: sentText }),
            },
          ]
        : []),
    ],
  ].filter((row) => row.length > 0);

  const done = (id: string) => (onCompleteTransfer ? onCompleteTransfer(id) : onBack());

  const submit = async () => {
    if (!result.ok || !receivable || busy) return;
    setBusy(true);
    const outcome = await receive.submit(transfer.id, result.body);
    if (outcome.kind === 'failed') {
      setBusy(false);
      Alert.alert(t('transfers.inspection.failed.title'), t(adminErrorKey(outcome.error)));
      return;
    }
    const saved = toLiveTransferDetail(outcome.transfer, naming);
    const codes = await readBatchCodes(destBatchIdsToRead(scope, can, saved));
    const summary = transferReceiptSummary(saved, codes);
    Alert.alert(t('transfers.summary.title'), summary === null ? saved.code : receiptSummaryLines(summary).join('\n'), [
      { text: t('transfers.summary.ok'), onPress: () => done(saved.id) },
    ]);
  };

  return (
    <WalletScreen
      title={t('transfers.inspection.title')}
      subtitle={route === undefined ? transfer.code : t('transfers.detail.subtitle', { code: transfer.code, route })}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} />}
      footer={
        <WalletFooter>
          {canReceive ? (
            <WalletButton
              label={t('transfers.inspection.submit')}
              icon={<CheckIcon />}
              disabled={!result.ok || !receivable || busy}
              onPress={() => {
                void submit();
              }}
            />
          ) : (
            <PermissionNote>{t('transfers.inspection.noPermission')}</PermissionNote>
          )}
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>Transfer Details</SectionTitle>
        <InfoCard rows={detailsRows} />

        <SectionTitle>Verification</SectionTitle>
        {transfer.lines.map((line) => (
          <React.Fragment key={line.id}>
            <Text style={styles.fieldLabel}>
              {singleLine
                ? t('transfers.inspection.receivedQty')
                : t('transfers.inspection.receivedQtyLine', { batch: line.batchCode, grade: line.gradeLabel })}
            </Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={values[line.id] ?? ''}
                onChangeText={(text) => setEntered({ ...values, [line.id]: text })}
                keyboardType="numeric"
                editable={canReceive && receivable}
                placeholderTextColor={adminColors.placeholder}
                accessibilityLabel={t('transfers.inspection.receivedQtyA11y')}
              />
              <Text style={styles.unit}>{t('transfers.inspection.kgUnit')}</Text>
            </View>
          </React.Fragment>
        ))}
        {qtyProblem !== undefined ? (
          <InfoNote tone="warning">{t(RECEIVE_PROBLEM_KEY[qtyProblem])}</InfoNote>
        ) : mismatch && sentText !== undefined ? (
          <InfoNote tone="warning">{t('transfers.inspection.mismatch', { qty: sentText })}</InfoNote>
        ) : null}
        {figures.shortGrams > 0 ? (
          // BR-102: a short receipt needs a note; the API refuses it without one.
          <>
            <Text style={styles.fieldLabel}>{t('transfers.inspection.receiptNote')}</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                value={note}
                onChangeText={setNote}
                maxLength={RECEIPT_NOTE_MAX}
                editable={canReceive && receivable}
                placeholder={t(RECEIVE_PROBLEM_KEY.NOTE_REQUIRED)}
                placeholderTextColor={adminColors.placeholder}
                accessibilityLabel={t('transfers.inspection.receiptNoteA11y')}
              />
            </View>
          </>
        ) : null}
        {isAllWarehouses(scope) ? (
          <InfoNote tone="brandSoft">
            Inter-warehouse receipts update the destination stock ledger and close the transit manifest.
          </InfoNote>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { ...adminType.rowTitle, color: adminColors.muted, marginBottom: adminSpacing.xs },
  inputBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    height: ADMIN_BUTTON_HEIGHT,
    paddingHorizontal: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { ...adminType.sectionHead, color: adminColors.ink, flex: 1, padding: 0 },
  unit: { ...adminType.sectionHead, color: adminColors.muted },
});
