/**
 * Initiate New Transfer: pick the source and destination warehouses (the real
 * warehouse list, uuids), pick one or more ACTIVE batches of the source with a
 * kg quantity each, optionally a vehicle number and notes, and submit
 * (POST /warehouse-transfers with an Idempotency-Key).
 *
 * Gate: `transfer.inter_warehouse.initiate` (SA all, MAIN all, SUB none,
 * BR-26); without it a not-available note renders and TransfersFlow refuses
 * the route. The warehouse list needs `warehouse.all.view`, which every holder
 * of the initiate code also holds.
 *
 * The server decides what happens next: a transfer below the high-value
 * threshold (system_config, value-based) is dispatched at once (IN_TRANSIT);
 * one at or above it, or with an unvalued line, waits for Super Admin
 * approval (PENDING_APPROVAL). The app does not guess the threshold; it reports
 * the status the server returns. There is no ETA or driver: the API has none.
 */
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useIdempotencyKey } from '../../../api/hooks';
import { adminErrorKey } from '../../../api/errors';
import type { WarehouseTransferDto } from '../../../api/transfers';
import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  ChipGroup,
  EmptyState,
  InfoNote,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  buildCreateTransferBody,
  canInitiateTransfer,
  createdOutcomeKey,
  INITIATE_ERROR_KEY,
  TRANSFER_NOTES_MAX,
  VEHICLE_NUMBER_MAX,
  type InitiateDraftLine,
  type TransferBatchOption,
} from './mappers';
import { ArrowDownRouteIcon, DispatchIcon } from './TransferParts';
import { useCreateTransferMutation, useTransferBatchOptions, useTransferWarehouses } from './useTransfersData';
import type { WarehouseScreenBaseProps } from './types';

export interface InitiateNewTransferScreenProps extends WarehouseScreenBaseProps {
  /** The transfer was created (the host opens it). */
  onTransferCreated?: ((transfer: WarehouseTransferDto) => void) | undefined;
}

function BatchRow({
  option,
  qtyText,
  error,
  onToggle,
  onChangeQty,
}: {
  option: TransferBatchOption;
  /** undefined = not selected. */
  qtyText: string | undefined;
  error: string | undefined;
  onToggle: () => void;
  onChangeQty: (text: string) => void;
}) {
  const selected = qtyText !== undefined;
  return (
    <View style={[styles.batchCard, selected && styles.batchCardSelected]}>
      <TouchableOpacity onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} activeOpacity={0.8}>
        <Text style={styles.batchTitle}>{option.batchCode}</Text>
        <Text style={styles.batchMeta}>
          {t('transfers.initiate.batchMeta', {
            crop: option.cropName ?? t('transfers.initiate.cropUnknown'),
            grade: option.gradeLabel,
            qty: formatKg(option.availableGrams),
          })}
        </Text>
      </TouchableOpacity>
      {selected ? (
        <>
          <View style={styles.qtyInputBox}>
            <TextInput
              style={styles.qtyInput}
              keyboardType="decimal-pad"
              value={qtyText}
              onChangeText={onChangeQty}
              placeholder={t('transfers.initiate.qtyPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              accessibilityLabel={t('transfers.initiate.qtyA11y', { batch: option.batchCode })}
            />
            <Text style={styles.qtyUnit}>{t('transfers.common.kgUnit')}</Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </>
      ) : null}
    </View>
  );
}

export function InitiateNewTransferScreen({ scope, can, onBack, onTransferCreated }: InitiateNewTransferScreenProps) {
  const allowed = canInitiateTransfer(can);
  const warehouses = useTransferWarehouses(scope, can);
  const active = useMemo(() => warehouses.options.filter((o) => o.isActive), [warehouses.options]);
  const ids = useMemo(() => active.map((o) => o.warehouseId), [active]);

  const [sourceId, setSourceId] = useState<string | undefined>(undefined);
  const [destId, setDestId] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [vehicle, setVehicle] = useState('');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState<unknown>(null);

  // Before a pick, the source defaults to the scope's warehouse when it has one, else the first option.
  const source = sourceId ?? (scope.warehouseId !== undefined && ids.includes(scope.warehouseId) ? scope.warehouseId : ids[0]);
  const destination = destId !== undefined && destId !== source ? destId : ids.find((id) => id !== source);

  const batches = useTransferBatchOptions(allowed ? source : undefined);
  const create = useCreateTransferMutation();
  const createKey = useIdempotencyKey();

  if (!allowed) {
    return (
      <WalletScreen title={t('transfers.initiate.title')} onBack={onBack}>
        <EmptyState title={t('transfers.initiate.notAvailable.title')} subtitle={t('transfers.initiate.notAvailable.subtitle')} />
      </WalletScreen>
    );
  }

  if (active.length === 0) {
    return (
      <WalletScreen title={t('transfers.initiate.title')} onBack={onBack}>
        {warehouses.isLoading ? <AdminLoadingState /> : null}
        {!warehouses.isLoading && warehouses.error ? <AdminErrorState error={warehouses.error} onRetry={warehouses.refresh} /> : null}
        {!warehouses.isLoading && !warehouses.error ? <AdminEmptyState title={t('transfers.initiate.noWarehouses')} /> : null}
      </WalletScreen>
    );
  }

  const nameOf = (id: string) => warehouses.nameOf(id);
  const optionById = new Map(batches.items.map((b) => [b.batchId, b]));
  const draftLines: InitiateDraftLine[] = Object.entries(selected).map(([batchId, qtyText]) => ({
    batchId,
    qtyText,
    availableGrams: optionById.get(batchId)?.availableGrams ?? 0,
  }));
  const result = buildCreateTransferBody({ fromWarehouseId: source, toWarehouseId: destination, lines: draftLines, vehicleNumber: vehicle, notes });
  const lineError = (batchId: string) =>
    !result.ok && result.batchId === batchId ? t(INITIATE_ERROR_KEY[result.error]) : undefined;
  const formError = !result.ok && result.batchId === undefined && draftLines.length > 0 ? t(INITIATE_ERROR_KEY[result.error]) : undefined;

  const selectSource = (id: string) => {
    if (id === source) return;
    setSourceId(id);
    setSelected({}); // batches belong to the source warehouse
  };

  const toggleBatch = (batchId: string) =>
    setSelected((prev) => {
      if (prev[batchId] !== undefined) {
        const next = { ...prev };
        delete next[batchId];
        return next;
      }
      return { ...prev, [batchId]: '' };
    });

  const submit = () => {
    if (!result.ok) return;
    setSubmitError(null);
    const body = result.body;
    create.mutate(
      { body, idempotencyKey: createKey.keyFor(body) },
      {
        onSuccess: (transfer) => {
          createKey.reset();
          Alert.alert(
            t('transfers.initiate.result.title', { code: transfer.transferNumber }),
            t(createdOutcomeKey(transfer.status), { to: nameOf(transfer.toWarehouseId) }),
            [{ text: t('transfers.common.ok'), onPress: () => (onTransferCreated ? onTransferCreated(transfer) : onBack()) }],
          );
        },
        onError: setSubmitError,
      },
    );
  };

  const batchView = queryViewState({ isLoading: batches.isLoading, error: batches.error, itemCount: batches.items.length });

  return (
    <WalletScreen
      title={t('transfers.initiate.title')}
      subtitle={t('transfers.initiate.subtitle')}
      onBack={onBack}
      footer={
        <WalletFooter>
          <WalletButton
            label={t('transfers.initiate.submit')}
            icon={<DispatchIcon />}
            disabled={!result.ok || create.isPending}
            onPress={submit}
          />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.label}>{t('transfers.initiate.source')}</Text>
          {source !== undefined ? <ChipGroup options={ids} value={source} onChange={selectSource} labelOf={nameOf} /> : null}
          <View style={styles.routeDividerRow}>
            <View style={styles.routeDividerLine} />
            <View style={styles.routeArrowBox}>
              <ArrowDownRouteIcon />
            </View>
            <View style={styles.routeDividerLine} />
          </View>
          <Text style={styles.label}>{t('transfers.initiate.destination')}</Text>
          {destination !== undefined ? (
            <ChipGroup options={ids.filter((id) => id !== source)} value={destination} onChange={setDestId} labelOf={nameOf} />
          ) : null}
        </View>

        <SectionTitle>{t('transfers.initiate.batches')}</SectionTitle>
        {batchView === 'loading' ? <AdminLoadingState /> : null}
        {batchView === 'error' ? <AdminErrorState error={batches.error} onRetry={batches.refresh} /> : null}
        {batchView === 'empty' ? <AdminEmptyState title={t('transfers.initiate.noBatches')} /> : null}
        {batchView === 'ready'
          ? batches.items.map((option) => (
              <BatchRow
                key={option.batchId}
                option={option}
                qtyText={selected[option.batchId]}
                error={lineError(option.batchId)}
                onToggle={() => toggleBatch(option.batchId)}
                onChangeQty={(text) => setSelected((prev) => ({ ...prev, [option.batchId]: text }))}
              />
            ))
          : null}
        {batchView === 'ready' && batches.hasMore ? (
          <WalletButton label={t('transfers.list.loadMore')} variant="outline" onPress={batches.loadMore} />
        ) : null}

        <View style={styles.card}>
          <Text style={styles.label}>{t('transfers.initiate.vehicle')}</Text>
          <TextInput
            style={styles.textInput}
            value={vehicle}
            onChangeText={setVehicle}
            maxLength={VEHICLE_NUMBER_MAX}
            autoCapitalize="characters"
            placeholder={t('transfers.initiate.vehiclePlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            accessibilityLabel={t('transfers.initiate.vehicle')}
          />
          <Text style={[styles.label, styles.labelSpaced]}>{t('transfers.initiate.notes')}</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            maxLength={TRANSFER_NOTES_MAX}
            multiline
            placeholder={t('transfers.initiate.notesPlaceholder')}
            placeholderTextColor={adminColors.placeholder}
            accessibilityLabel={t('transfers.initiate.notes')}
          />
        </View>

        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        {submitError ? <InfoNote tone="danger">{t(adminErrorKey(submitError))}</InfoNote> : null}
        <InfoNote tone="brandSoft">{t('transfers.list.approvalNote')}</InfoNote>
      </ScrollView>
    </WalletScreen>
  );
}

const ROUTE_ARROW = 32;

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginTop: adminSpacing.md,
  },
  label: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.sm },
  labelSpaced: { marginTop: adminSpacing.lg },
  routeDividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: adminSpacing.md },
  routeDividerLine: { flex: 1, height: 1, backgroundColor: adminColors.border },
  routeArrowBox: {
    width: ROUTE_ARROW,
    height: ROUTE_ARROW,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: adminSpacing.sm,
  },
  batchCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  batchCardSelected: { borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  batchTitle: { ...adminType.sectionHead, color: adminColors.ink },
  batchMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  qtyInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    height: ADMIN_BUTTON_HEIGHT,
    marginTop: adminSpacing.sm,
  },
  qtyInput: { ...adminType.title, flex: 1, color: adminColors.ink, padding: 0 },
  qtyUnit: { ...adminType.sectionHead, color: adminColors.muted },
  textInput: {
    ...adminType.body,
    color: adminColors.ink,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    height: ADMIN_BUTTON_HEIGHT,
  },
  notesInput: { height: ADMIN_BUTTON_HEIGHT * 2, paddingTop: adminSpacing.sm, textAlignVertical: 'top' },
  error: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.xs },
});
