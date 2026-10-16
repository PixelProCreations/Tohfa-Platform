/**
 * Transfer Detail: route, information, lines and the progress timeline of one
 * live transfer (GET /warehouse-transfers/{id}).
 *
 * Gate: `transfer.inter_warehouse.view`; a transfer outside the scope (or an
 * unknown id) is the server's 404, shown as "not found", never a 403 leak.
 * Actions (display only; the server enforces each again):
 *   - Approve: `transfer.high_value.approve` (SA only) on PENDING_APPROVAL; it
 *     dispatches the transfer. Sends an Idempotency-Key. The initiator cannot
 *     approve their own transfer (403 SELF_APPROVAL_FORBIDDEN, shown as text).
 *   - Cancel: `transfer.inter_warehouse.initiate` (MAIN all, SUB none) on
 *     PENDING_APPROVAL, with a required reason.
 *   - Receive at Destination: `transfer.inter_warehouse.receive` on IN_TRANSIT,
 *     only for a destination the scope covers.
 * There is no dispatch step to press: a transfer below the threshold is
 * dispatched when it is created, a high-value one when it is approved.
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ApiError } from '../../../../../shell/api/client';
import { useIdempotencyKey } from '../../../api/hooks';
import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { formatKg } from '../../../money/quantity';
import { formatAdminDate } from '../../../utils/datetime';
import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  CheckIcon,
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
import { cancelReasonOf, CANCEL_REASON_MAX, transferActions } from './mappers';
import { RouteArrowIcon, transferRouteLabel } from './TransferParts';
import {
  useApproveTransferMutation,
  useCancelTransferMutation,
  useTransferDetail,
  useTransferWarehouses,
} from './useTransfersData';
import type { TransferDetailView, TransferLineView, WarehouseScreenBaseProps } from './types';

export interface TransferDetailScreenProps extends WarehouseScreenBaseProps {
  transferId?: string | undefined;
  /** Open the receiving inspection for this transfer. */
  onReceiveTransfer?: ((transferId: string) => void) | undefined;
  onBackToTransfers?: (() => void) | undefined;
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.problem.code === 'NOT_FOUND';
}

function LineRow({ line }: { line: TransferLineView }) {
  return (
    <View style={styles.lineRow}>
      <View style={styles.lineText}>
        <Text style={styles.lineTitle}>{line.batchCode}</Text>
        <Text style={styles.lineMeta}>{line.gradeLabel}</Text>
      </View>
      <View style={styles.lineQty}>
        <Text style={styles.lineTitle}>{t('transfers.detail.line.sent', { qty: formatKg(line.sentGrams) })}</Text>
        {line.receivedGrams !== null ? (
          <Text style={styles.lineMeta}>{t('transfers.detail.line.received', { qty: formatKg(line.receivedGrams) })}</Text>
        ) : null}
        {line.varianceGrams !== null && line.varianceGrams !== 0 ? (
          <Text style={styles.lineShort}>{t('transfers.detail.line.variance', { qty: formatKg(line.varianceGrams) })}</Text>
        ) : null}
      </View>
    </View>
  );
}

function Body({ transfer }: { transfer: TransferDetailView }) {
  const now = new Date();
  const lastDone = transfer.timeline.reduce((acc, step, idx) => (step.done ? idx : acc), -1);
  return (
    <>
      <View style={styles.card}>
        <View style={styles.routeRow}>
          <View style={styles.routeCol}>
            <Text style={styles.routeLabel}>{t('transfers.detail.from')}</Text>
            <Text style={styles.routeValue}>{transfer.sourceName}</Text>
          </View>
          <View style={styles.routeArrow}>
            <RouteArrowIcon size={18} />
          </View>
          <View style={[styles.routeCol, styles.routeColEnd]}>
            <Text style={styles.routeLabel}>{t('transfers.detail.to')}</Text>
            <Text style={styles.routeValue}>{transfer.destinationName}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.statusRow}>
          <StatusBadge label={transfer.statusLabel} tone={transfer.statusTone} />
          {transfer.hasDiscrepancy ? <StatusBadge label={t('transfers.row.discrepancy')} tone="danger" /> : null}
        </View>
      </View>

      <SectionTitle>{t('transfers.detail.info')}</SectionTitle>
      <InfoCard
        rows={[
          [
            { label: t('transfers.detail.number'), value: transfer.code },
            { label: t('transfers.detail.quantity'), value: formatKg(transfer.sentGrams) },
          ],
          [
            { label: t('transfers.detail.vehicle'), value: transfer.vehicleNumber ?? t('transfers.detail.vehicleNone') },
            { label: t('transfers.detail.value'), value: formatPaise(transfer.totalValuePaise) },
          ],
          [{ label: t('transfers.detail.created'), value: formatAdminDate(transfer.createdAt, now) }],
        ]}
      />
      {transfer.hasUnvaluedLines ? <InfoNote tone="warning">{t('transfers.detail.unvalued')}</InfoNote> : null}
      {transfer.notes ? <InfoNote tone="info">{t('transfers.detail.notes', { text: transfer.notes })}</InfoNote> : null}
      {transfer.receiptNote ? (
        <InfoNote tone="warning">{t('transfers.detail.receiptNote', { text: transfer.receiptNote })}</InfoNote>
      ) : null}
      {transfer.cancelReason ? (
        <InfoNote tone="danger">{t('transfers.detail.cancelReason', { text: transfer.cancelReason })}</InfoNote>
      ) : null}

      <SectionTitle>{t('transfers.detail.lines')}</SectionTitle>
      <View style={styles.card}>
        {transfer.lines.map((line) => (
          <LineRow key={line.id} line={line} />
        ))}
      </View>

      <SectionTitle>{t('transfers.detail.progress')}</SectionTitle>
      <View style={styles.card}>
        {transfer.timeline.map((step, idx) => {
          const isLast = idx === transfer.timeline.length - 1;
          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={styles.stepRail}>
                <View style={[styles.stepDot, step.done ? styles.stepDotDone : styles.stepDotPending]}>
                  {step.done ? <CheckIcon size={11} /> : null}
                </View>
                {!isLast ? <View style={[styles.stepLine, step.done && idx < lastDone && styles.stepLineDone]} /> : null}
              </View>
              <View style={styles.stepTextCol}>
                <Text style={[styles.stepText, step.done && styles.stepTextDone]}>{step.label}</Text>
                {step.at ? <Text style={styles.lineMeta}>{formatAdminDate(step.at, now)}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>

      {transfer.status === 'PENDING_APPROVAL' ? <InfoNote tone="brandSoft">{t('transfers.detail.pendingNote')}</InfoNote> : null}
    </>
  );
}

export function TransferDetailScreen({ scope, can, onBack, transferId, onReceiveTransfer, onBackToTransfers }: TransferDetailScreenProps) {
  const { nameOf } = useTransferWarehouses(scope, can);
  const detail = useTransferDetail(scope, transferId, nameOf);
  const approve = useApproveTransferMutation();
  const cancel = useCancelTransferMutation();
  const approveKey = useIdempotencyKey();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState<unknown>(null);

  const transfer = detail.transfer;
  const header = <ScopeHeader scope={scope} label={scope.warehouseId === undefined ? t('transfers.scope.all') : undefined} />;

  if (transfer === undefined) {
    const notFound = transferId === undefined || isNotFound(detail.error);
    return (
      <WalletScreen title={t('transfers.detail.title')} onBack={onBack} headerExtra={header}>
        {detail.isLoading ? <AdminLoadingState /> : null}
        {!detail.isLoading && notFound ? (
          <EmptyState title={t('transfers.detail.notFound.title')} subtitle={t('transfers.detail.notFound.subtitle')} />
        ) : null}
        {!detail.isLoading && !notFound && detail.error ? <AdminErrorState error={detail.error} onRetry={detail.refresh} /> : null}
      </WalletScreen>
    );
  }

  const actions = transferActions(scope, can, transfer);
  const busy = approve.isPending || cancel.isPending;
  const validReason = cancelReasonOf(reason);

  const runApprove = () => {
    setActionError(null);
    approve.mutate(
      { id: transfer.id, idempotencyKey: approveKey.keyFor({ action: 'approve', id: transfer.id }) },
      {
        onSuccess: () => {
          approveKey.reset();
          Alert.alert(t('transfers.detail.approved.title'), t('transfers.detail.approved.body', { code: transfer.code }));
        },
        onError: setActionError,
      },
    );
  };

  const confirmApprove = () => {
    Alert.alert(t('transfers.detail.approve.confirmTitle'), t('transfers.detail.approve.confirmBody', { code: transfer.code }), [
      { text: t('transfers.common.keep'), style: 'cancel' },
      { text: t('transfers.detail.approve'), onPress: runApprove },
    ]);
  };

  const submitCancel = () => {
    if (validReason === null) return;
    setActionError(null);
    cancel.mutate(
      { id: transfer.id, body: { reason: validReason } },
      {
        onSuccess: () => {
          setCancelOpen(false);
          setReason('');
          (onBackToTransfers ?? onBack)();
        },
        onError: setActionError,
      },
    );
  };

  return (
    <WalletScreen
      title={t('transfers.detail.title')}
      subtitle={t('transfers.detail.subtitle', { code: transfer.code, route: transferRouteLabel(transfer) })}
      onBack={onBack}
      headerExtra={header}
      footer={
        <WalletFooter>
          {actions.receive && onReceiveTransfer ? (
            <WalletButton label={t('transfers.detail.receive')} onPress={() => onReceiveTransfer(transfer.id)} />
          ) : null}
          {actions.approve ? (
            <WalletButton label={t('transfers.detail.approve')} icon={<CheckIcon />} disabled={busy} onPress={confirmApprove} />
          ) : null}
          {actions.cancel && !cancelOpen ? (
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => setCancelOpen(true)}
              disabled={busy}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.dangerButtonText}>{t('transfers.detail.cancel')}</Text>
            </TouchableOpacity>
          ) : null}
          <WalletButton label={t('transfers.detail.backToList')} variant="outline" onPress={onBackToTransfers ?? onBack} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {actionError ? <InfoNote tone="danger">{t(adminErrorKey(actionError))}</InfoNote> : null}
        {actions.cancel && cancelOpen ? (
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>{t('transfers.detail.cancelReasonLabel')}</Text>
            <TextInput
              style={styles.input}
              value={reason}
              onChangeText={setReason}
              maxLength={CANCEL_REASON_MAX}
              multiline
              placeholder={t('transfers.detail.cancelReasonPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              accessibilityLabel={t('transfers.detail.cancelReasonLabel')}
            />
            <View style={styles.cancelActions}>
              <WalletButton label={t('transfers.common.keep')} variant="outline" flex onPress={() => setCancelOpen(false)} />
              <TouchableOpacity
                style={[styles.dangerButton, styles.flex, (validReason === null || busy) && styles.disabled]}
                onPress={submitCancel}
                disabled={validReason === null || busy}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ disabled: validReason === null || busy }}
              >
                <Text style={styles.dangerButtonText}>{t('transfers.detail.cancelConfirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        <Body transfer={transfer} />
      </ScrollView>
    </WalletScreen>
  );
}

const ROUTE_ARROW = 34;
const STEP_DOT = 20;
const STEP_LINE = 22;

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginTop: adminSpacing.sm,
  },
  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.md },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routeCol: { flex: 1 },
  routeColEnd: { alignItems: 'flex-end' },
  routeArrow: {
    width: ROUTE_ARROW,
    height: ROUTE_ARROW,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeLabel: { ...adminType.caption, color: adminColors.muted },
  routeValue: { ...adminType.title, color: adminColors.ink, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  lineText: { flex: 1 },
  lineQty: { alignItems: 'flex-end' },
  lineTitle: { ...adminType.sectionHead, color: adminColors.ink },
  lineMeta: { ...adminType.rowMeta, color: adminColors.muted },
  lineShort: { ...adminType.rowMeta, color: adminColors.danger.text },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepRail: { alignItems: 'center', width: STEP_DOT + 2, marginRight: adminSpacing.md },
  stepDot: { width: STEP_DOT, height: STEP_DOT, borderRadius: adminRadius.full, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: adminColors.brand },
  stepDotPending: { backgroundColor: adminColors.card, borderWidth: 2, borderColor: adminColors.border },
  stepLine: { width: 2, height: STEP_LINE, backgroundColor: adminColors.border },
  stepLineDone: { backgroundColor: adminColors.brand },
  stepTextCol: { flex: 1 },
  stepText: { ...adminType.body, color: adminColors.muted, paddingTop: 1 },
  stepTextDone: { ...adminType.sectionHead, color: adminColors.ink },
  fieldLabel: { ...adminType.rowTitle, color: adminColors.muted, marginBottom: adminSpacing.xs },
  input: {
    ...adminType.body,
    color: adminColors.ink,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    minHeight: ADMIN_BUTTON_HEIGHT * 2,
    textAlignVertical: 'top',
  },
  cancelActions: { flexDirection: 'row', gap: adminSpacing.sm, marginTop: adminSpacing.md },
  flex: { flex: 1 },
  disabled: { opacity: 0.5 },
  dangerButton: {
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.danger.bg,
    borderWidth: 1,
    borderColor: adminColors.danger.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: { ...adminType.sectionHead, color: adminColors.danger.text },
});
