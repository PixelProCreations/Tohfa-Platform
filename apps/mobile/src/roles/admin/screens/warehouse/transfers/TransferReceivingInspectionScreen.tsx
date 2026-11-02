/**
 * Transfer Receiving Inspection: count what arrived, line by line, and record
 * the receipt (POST /warehouse-transfers/{id}/receive, Idempotency-Key).
 *
 * The server has no inspection step beyond this: the screen collects each
 * line's received quantity (0 to the quantity sent) and a receipt note, which
 * is required as soon as any line is short (BR-102; the shortfall is recorded,
 * not written off). A line received above zero becomes a new ACTIVE batch at
 * the destination on the server.
 *
 * Gate: `transfer.inter_warehouse.receive` on an IN_TRANSIT transfer whose
 * destination the scope covers (a Sub admin of the source is refused by the
 * server with WAREHOUSE_SCOPE_VIOLATION; any other is a 404). The receipt is
 * a stock-moving write, so one Idempotency-Key per body is reused across
 * retries (root CLAUDE.md 2.4).
 *
 * Design M2-16, reduced to what the API backs (receiptViews.ts): each line
 * shows what was sent and, when a batch read the scope may make carried it,
 * the crop name (else the batch code the transfer carries); the Quantity
 * Verification tiles total sent, received and the difference as typed; one
 * confirmation dialog comes before the POST, whose button is disabled while
 * it is pending; and the screen ends on the Transfer Receiving Summary built
 * from the receive response. A transfer opened when already RECEIVED shows
 * that summary from its read. Not drawn (no API, owner decision): an arrival
 * step, per-line damage / spoilage / condition, accept / partial / reject,
 * a transfer receipt number, resolving the discrepancy, a storage location and
 * the initiator's name.
 */
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ApiError } from '../../../../../shell/api/client';
import { useIdempotencyKey } from '../../../api/hooks';
import type { WarehouseTransferDto } from '../../../api/transfers';
import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { OverviewCardsGrid, OverviewDashboardCard } from '../../../components';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  CheckIcon,
  EmptyState,
  InfoCard,
  InfoNote,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  buildReceiveTransferBody,
  kgInputText,
  RECEIPT_NOTE_MAX,
  RECEIVE_ERROR_KEY,
  receiveShortfallGrams,
  toTransferDetail,
  transferActions,
} from './mappers';
import {
  lineProductName,
  receiveConfirmation,
  receiveTotals,
  transferBatchIdsToRead,
  transferReceiptSummary,
  type BatchFacts,
} from './receiptViews';
import { TransferReceiptSummaryView } from './TransferReceiptSummaryView';
import { transferRouteLabel } from './TransferParts';
import {
  useReceiveTransferMutation,
  useTransferBatchFacts,
  useTransferDetail,
  useTransferWarehouses,
} from './useTransfersData';
import type { TransferDetailView, WarehouseScreenBaseProps } from './types';

export interface TransferReceivingInspectionScreenProps extends WarehouseScreenBaseProps {
  transferId?: string | undefined;
  /** The receipt was recorded. */
  onCompleteTransfer?: ((transferId: string) => void) | undefined;
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.problem.code === 'NOT_FOUND';
}

function initialEntries(transfer: TransferDetailView): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of transfer.lines) out[line.id] = kgInputText(line.sentGrams);
  return out;
}

function InspectionForm({
  transfer,
  facts,
  header,
  onBack,
  onReceived,
}: {
  transfer: TransferDetailView;
  facts: ReadonlyMap<string, BatchFacts>;
  header: React.ReactNode;
  onBack: () => void;
  /** The receive POST answered: the transfer, now RECEIVED. */
  onReceived: (saved: WarehouseTransferDto) => void;
}) {
  const [entered, setEntered] = useState<Record<string, string>>(() => initialEntries(transfer));
  const [note, setNote] = useState('');
  const [submitError, setSubmitError] = useState<unknown>(null);
  const receive = useReceiveTransferMutation();
  const receiveKey = useIdempotencyKey();

  const result = buildReceiveTransferBody(transfer.lines, entered, note);
  const shortGrams = receiveShortfallGrams(transfer.lines, entered);
  const totals = receiveTotals(transfer.lines, entered);
  const kgOrUnknown = (grams: number | null) => (grams === null ? t('transfers.kpi.unknown') : formatKg(grams));

  /** The POST itself; reached only from the confirmation dialog. */
  const send = () => {
    if (!result.ok || receive.isPending) return;
    setSubmitError(null);
    const body = result.body;
    receive.mutate(
      { id: transfer.id, body, idempotencyKey: receiveKey.keyFor({ id: transfer.id, body }) },
      {
        onSuccess: (saved) => {
          receiveKey.reset();
          onReceived(saved);
        },
        onError: setSubmitError,
      },
    );
  };

  /** One confirmation before the stock-moving POST, as the goods receiving wizard asks before its quality check. */
  const confirmSubmit = () => {
    if (!result.ok || receive.isPending) return;
    const confirmation = receiveConfirmation(transfer, transfer.sentGrams - result.shortGrams);
    Alert.alert(confirmation.title, confirmation.body, [
      { text: t('transfers.confirm.cancel'), style: 'cancel' },
      { text: t('transfers.confirm.ok'), onPress: () => send() },
    ]);
  };

  return (
    <WalletScreen
      title={t('transfers.inspection.title')}
      subtitle={t('transfers.detail.subtitle', { code: transfer.code, route: transferRouteLabel(transfer) })}
      onBack={onBack}
      headerExtra={header}
      footer={
        <WalletFooter>
          <WalletButton
            label={t('transfers.inspection.submit')}
            icon={<CheckIcon />}
            disabled={!result.ok || receive.isPending}
            onPress={confirmSubmit}
          />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>{t('transfers.inspection.details')}</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: t('transfers.detail.number'), value: transfer.code },
              { label: t('transfers.detail.quantity'), value: formatKg(transfer.sentGrams) },
            ],
            [
              { label: t('transfers.inspection.source'), value: transfer.sourceName },
              { label: t('transfers.inspection.destination'), value: transfer.destinationName },
            ],
          ]}
        />

        <SectionTitle>{t('transfers.inspection.lines')}</SectionTitle>
        {transfer.lines.map((line) => {
          const product = lineProductName(line, facts);
          return (
            <View key={line.id} style={styles.lineCard}>
              <Text style={styles.lineTitle}>{product ?? line.batchCode}</Text>
              <Text style={styles.lineMeta}>
                {product === undefined
                  ? t('transfers.inspection.lineMeta', { grade: line.gradeLabel, qty: formatKg(line.sentGrams) })
                  : t('transfers.inspection.lineBatchMeta', {
                      batch: line.batchCode,
                      grade: line.gradeLabel,
                      qty: formatKg(line.sentGrams),
                    })}
              </Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={entered[line.id] ?? ''}
                  onChangeText={(text) => setEntered((prev) => ({ ...prev, [line.id]: text }))}
                  keyboardType="decimal-pad"
                  placeholderTextColor={adminColors.placeholder}
                  accessibilityLabel={t('transfers.inspection.qtyA11y', { batch: line.batchCode })}
                />
                <Text style={styles.unit}>{t('transfers.common.kgUnit')}</Text>
              </View>
              {!result.ok && result.lineId === line.id ? (
                <Text style={styles.error}>{t(RECEIVE_ERROR_KEY[result.error])}</Text>
              ) : null}
            </View>
          );
        })}

        <SectionTitle>{t('transfers.verify.title')}</SectionTitle>
        <OverviewCardsGrid style={styles.grid}>
          <OverviewDashboardCard value={formatKg(totals.sentGrams)} title={t('transfers.verify.sent')} icon="truck" />
          <OverviewDashboardCard value={kgOrUnknown(totals.receivedGrams)} title={t('transfers.verify.received')} icon="receiving" />
          <OverviewDashboardCard
            value={kgOrUnknown(totals.differenceGrams)}
            title={t('transfers.verify.difference')}
            icon="alert"
            tone={totals.differenceGrams !== null && totals.differenceGrams < 0 ? 'warning' : 'default'}
          />
        </OverviewCardsGrid>

        <Text style={styles.fieldLabel}>
          {shortGrams > 0 ? t('transfers.inspection.noteRequired') : t('transfers.inspection.noteOptional')}
        </Text>
        <TextInput
          style={[styles.input, styles.noteInput]}
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={RECEIPT_NOTE_MAX}
          placeholder={t('transfers.inspection.notePlaceholder')}
          placeholderTextColor={adminColors.placeholder}
          accessibilityLabel={t('transfers.inspection.noteA11y')}
        />
        {shortGrams > 0 ? (
          <InfoNote tone="warning">{t('transfers.inspection.shortNote', { qty: formatKg(shortGrams) })}</InfoNote>
        ) : null}
        {!result.ok && result.lineId === undefined && shortGrams > 0 ? (
          <Text style={styles.error}>{t(RECEIVE_ERROR_KEY[result.error])}</Text>
        ) : null}
        {submitError ? <InfoNote tone="danger">{t(adminErrorKey(submitError))}</InfoNote> : null}
        <InfoNote tone="brandSoft">{t('transfers.inspection.ledgerNote')}</InfoNote>
      </ScrollView>
    </WalletScreen>
  );
}

export function TransferReceivingInspectionScreen({
  scope,
  can,
  onBack,
  transferId,
  onCompleteTransfer,
}: TransferReceivingInspectionScreenProps) {
  const { nameOf } = useTransferWarehouses(scope, can);
  const detail = useTransferDetail(scope, transferId, nameOf);
  // The receive response is kept here, not in the form: the write refetches the
  // detail as RECEIVED, which would otherwise swap the form for the not-receivable note.
  const [received, setReceived] = useState<WarehouseTransferDto | null>(null);
  const receivedView = useMemo(() => (received === null ? undefined : toTransferDetail(received, nameOf)), [received, nameOf]);
  const transfer = receivedView ?? detail.transfer;
  const facts = useTransferBatchFacts(transfer === undefined ? [] : transferBatchIdsToRead(scope, can, transfer), scope.warehouseId);
  const header = <ScopeHeader scope={scope} label={scope.warehouseId === undefined ? t('transfers.scope.all') : undefined} />;
  const complete = (id: string) => (onCompleteTransfer ? onCompleteTransfer(id) : onBack());

  if (transfer === undefined) {
    const notFound = transferId === undefined || isNotFound(detail.error);
    return (
      <WalletScreen title={t('transfers.inspection.title')} onBack={onBack} headerExtra={header}>
        {detail.isLoading ? <AdminLoadingState /> : null}
        {!detail.isLoading && notFound ? (
          <EmptyState title={t('transfers.detail.notFound.title')} subtitle={t('transfers.detail.notFound.subtitle')} />
        ) : null}
        {!detail.isLoading && !notFound && detail.error ? <AdminErrorState error={detail.error} onRetry={detail.refresh} /> : null}
      </WalletScreen>
    );
  }

  const summary = transferReceiptSummary(transfer, facts);
  if (summary !== null) {
    return <TransferReceiptSummaryView summary={summary} header={header} onBack={onBack} onDone={() => complete(transfer.id)} />;
  }

  if (!transferActions(scope, can, transfer).receive) {
    // Not receivable here: not IN_TRANSIT, no receive permission, or not this scope's destination.
    return (
      <WalletScreen title={t('transfers.inspection.title')} onBack={onBack} headerExtra={header}>
        <EmptyState
          title={t('transfers.inspection.notReceivable.title')}
          subtitle={t('transfers.inspection.notReceivable.subtitle', { status: transfer.statusLabel })}
        />
      </WalletScreen>
    );
  }

  return (
    <InspectionForm key={transfer.id} transfer={transfer} facts={facts} header={header} onBack={onBack} onReceived={setReceived} />
  );
}

const styles = StyleSheet.create({
  lineCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  lineTitle: { ...adminType.sectionHead, color: adminColors.ink },
  lineMeta: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.sm },
  fieldLabel: { ...adminType.rowTitle, color: adminColors.muted, marginTop: adminSpacing.md, marginBottom: adminSpacing.xs },
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
  noteInput: {
    ...adminType.body,
    flex: 0,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    minHeight: ADMIN_BUTTON_HEIGHT * 2,
    textAlignVertical: 'top',
  },
  unit: { ...adminType.sectionHead, color: adminColors.muted },
  grid: { marginBottom: adminSpacing.md },
  error: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.xs },
});
