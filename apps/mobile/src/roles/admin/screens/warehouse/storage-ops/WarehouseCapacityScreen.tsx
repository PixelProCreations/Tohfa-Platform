/**
 * Warehouse Capacity, live from GET /warehouses/{id}/capacity
 * (warehouse.own.view; Sub own; BR-66b): the configured capacity, the used kg
 * (the server's sum of ACTIVE batch stock), what is left (negative when over
 * capacity, never clamped) and the server's utilisation percentage.
 *
 * Below it, the warehouse's storage locations with their configured capacity
 * and the stock DERIVED from batches recorded against each location code
 * (needs inventory.batch.view). The old warehouse comparison, storage-area
 * percentages and "Operational" status were fixed example numbers and are gone;
 * so is the capacity-alert threshold (no system_config key exists for it).
 *
 * Set Capacity (PATCH /warehouses/{id}/capacity) needs
 * `warehouse.capacity.set` (Main all, Sub none). As design M15-05 asks, the
 * form says a change never modifies inventory (BR-66e), then shows Current /
 * New / Difference and asks "Update warehouse capacity?" before the PATCH
 * (../shared/CapacityReviewPanel). No targets: BR-80 says they are not built.
 * "Manage Capacity Limits" still opens Warehouse Settings when the host
 * provides it, on this screen's warehouse.
 */
// Design id: M4-S07
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { parseKgToGrams } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { capacityChangeReview, type CapacityReview } from '../shared/capacityReview';
import { CapacityReviewPanel, confirmCapacityChange } from '../shared/CapacityReviewPanel';
import { InfoNote, KpiRow, LockIcon, SectionTitle, StatusBadge, WalletButton, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { locationStockOf, parseCapacityInput, toCapacityView, toLocationRow } from './mappers';
import { ProgressBar, STORAGE_CODES } from './StorageParts';
import type { StorageWarehouse } from './StorageWarehouse';
import { useActiveBatches, useCapacity, useSetCapacity, useStorageLocationList } from './useStorageData';
import type { WarehouseScreenBaseProps } from './types';

export interface WarehouseCapacityScreenProps extends WarehouseScreenBaseProps {
  warehouse: StorageWarehouse;
  /** View Capacity History (host: warehouse activity). */
  onViewHistory?: (() => void) | undefined;
  /** Manage Capacity Limits (host: Warehouse Settings) on this warehouse; shown only with warehouse.capacity.set. */
  onManageCapacity?: ((warehouseId: string | undefined) => void) | undefined;
}

export function WarehouseCapacityScreen({ can, onBack, warehouse, onViewHistory, onManageCapacity }: WarehouseCapacityScreenProps) {
  const capacity = useCapacity(warehouse.warehouseId);
  const locations = useStorageLocationList(warehouse.warehouseId);
  const batches = useActiveBatches(warehouse.warehouseId, can(STORAGE_CODES.batchView));
  const canSet = can(STORAGE_CODES.capacitySet);
  const view = capacity.capacity === undefined ? undefined : toCapacityView(capacity.capacity);
  const rows = useMemo(() => {
    const now = new Date();
    return locations.items.map((l) => toLocationRow(l, locationStockOf(batches.stockByCode, l.code), now));
  }, [locations.items, batches.stockByCode]);
  const none = t('storageOps.notAvailable');
  // The stored capacity for the review: null when none is set, undefined until it is read.
  const currentGrams =
    capacity.capacity === undefined ? undefined : capacity.capacity.capacityKg === null ? null : parseKgToGrams(capacity.capacity.capacityKg) ?? undefined;

  return (
    <WalletScreen title={t('storageOps.capacity.title')} onBack={onBack} headerExtra={warehouse.header}>
      {warehouse.placeholder ?? (
        <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {view === undefined ? (
            capacity.isLoading ? (
              <AdminLoadingState />
            ) : (
              <AdminErrorState error={capacity.error} onRetry={capacity.refresh} />
            )
          ) : (
            <>
              <KpiRow
                items={[
                  { value: view.utilizationLabel ?? none, label: t('storageOps.capacity.kpi.utilization'), tone: view.overCapacity ? 'danger' : undefined },
                  { value: view.used, label: t('storageOps.capacity.kpi.used') },
                ]}
              />
              <KpiRow
                items={[
                  { value: view.capacity ?? t('storageOps.location.capacityNotSet'), label: t('storageOps.capacity.kpi.capacity') },
                  { value: view.available ?? none, label: t('storageOps.capacity.kpi.available'), tone: view.overCapacity ? 'danger' : 'success' },
                ]}
              />
              {view.utilizationPercent !== null ? (
                <ProgressBar percent={view.utilizationPercent} tone={view.overCapacity ? 'danger' : 'brand'} />
              ) : null}
              {view.overCapacity ? <Text style={styles.error}>{t('storageOps.capacity.over')}</Text> : null}
              {!view.isSet ? <Text style={styles.muted}>{t('storageOps.capacity.notSetHint')}</Text> : null}
            </>
          )}

          {canSet ? <SetCapacityForm warehouseId={warehouse.warehouseId} currentGrams={currentGrams} /> : null}
          {canSet && onManageCapacity ? (
            <View style={styles.spaced}>
              <WalletButton label={t('storageOps.capacity.manage')} variant="outline" onPress={() => onManageCapacity(warehouse.warehouseId)} />
            </View>
          ) : null}
          {!canSet ? (
            <InfoNote tone="warning" icon={<LockIcon size={16} color={adminColors.warning.text} />}>
              {t('storageOps.capacity.viewOnly')}
            </InfoNote>
          ) : null}

          <SectionTitle>{t('storageOps.capacity.locations')}</SectionTitle>
          {locations.isLoading ? <AdminLoadingState /> : null}
          {!locations.isLoading && locations.error ? <AdminErrorState error={locations.error} onRetry={locations.refresh} /> : null}
          {!locations.isLoading && !locations.error && rows.length === 0 ? (
            <AdminEmptyState title={t('storageOps.locations.empty')} />
          ) : null}
          {rows.map((row) => (
            <View key={row.id} style={styles.item}>
              <View style={styles.itemHead}>
                <Text style={styles.itemTitle}>{row.name}</Text>
                <StatusBadge label={row.statusLabel} tone={row.statusTone} />
              </View>
              <Text style={styles.muted}>
                {t('storageOps.capacity.locationLine', {
                  code: row.code,
                  stored: row.stockLabel ?? none,
                  capacity: row.capacity ?? t('storageOps.location.capacityNotSet'),
                })}
              </Text>
              {row.occupancyPercent !== null ? (
                <ProgressBar percent={row.occupancyPercent} tone={row.occupancyPercent > 100 ? 'danger' : 'brand'} />
              ) : null}
            </View>
          ))}
          {rows.length > 0 ? <InfoNote tone="brandSoft">{t('storageOps.locations.stockNote')}</InfoNote> : null}

          {onViewHistory ? (
            <View style={styles.spaced}>
              <WalletButton label={t('storageOps.capacity.history')} variant="neutral" onPress={onViewHistory} />
            </View>
          ) : null}
        </ScrollView>
      )}
    </WalletScreen>
  );
}

/**
 * PATCH /warehouses/{id}/capacity; only rendered with warehouse.capacity.set.
 * Edit -> Review (Current / New / Difference) -> confirm -> PATCH.
 */
function SetCapacityForm({ warehouseId, currentGrams }: { warehouseId: string | undefined; currentGrams: number | null | undefined }) {
  const [input, setInput] = useState('');
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [review, setReview] = useState<CapacityReview | null>(null);
  const set = useSetCapacity(warehouseId);

  const startReview = () => {
    const parsed = parseCapacityInput(input);
    const next = parsed.ok && parsed.value !== null ? capacityChangeReview(currentGrams, parsed.value) : null;
    if (next === null) {
      setMessage(t(parsed.ok ? 'storageOps.capacity.error.invalid' : parsed.error));
      return;
    }
    setMessage(undefined);
    set.reset();
    setReview(next);
  };

  const update = (confirmed: CapacityReview) => {
    set.mutate(confirmed.newKg, {
      onSuccess: () => {
        setInput('');
        setReview(null);
        setMessage(t('capacityChange.success'));
      },
      onError: (err) => setMessage(t(adminErrorKey(err))),
    });
  };

  if (review !== null) {
    return (
      <View style={styles.form}>
        <CapacityReviewPanel review={review} />
        {message !== undefined ? <Text style={styles.error}>{message}</Text> : null}
        <View style={styles.actions}>
          <WalletButton label={t('capacityChange.action.back')} variant="neutral" flex onPress={() => setReview(null)} />
          <WalletButton
            label={set.isPending ? t('capacityChange.action.updating') : t('capacityChange.action.update')}
            flex
            disabled={set.isPending || review.unchanged}
            onPress={() => confirmCapacityChange(review, () => update(review))}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <Text style={styles.itemTitle}>{t('storageOps.capacity.set')}</Text>
      <TextInput
        style={styles.input}
        value={input}
        onChangeText={setInput}
        keyboardType="decimal-pad"
        placeholder={t('storageOps.capacity.placeholder')}
        placeholderTextColor={adminColors.placeholder}
      />
      <Text style={styles.muted}>{t('capacityChange.notice')}</Text>
      {message !== undefined ? <Text style={styles.muted}>{message}</Text> : null}
      <WalletButton label={t('capacityChange.action.review')} onPress={startReview} />
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    gap: adminSpacing.xs,
  },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { ...adminType.rowTitle, color: adminColors.ink, flex: 1 },
  muted: { ...adminType.rowMeta, color: adminColors.muted },
  error: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.xs },
  spaced: { marginTop: adminSpacing.md },
  actions: { flexDirection: 'row', gap: adminSpacing.sm },
  form: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  input: {
    ...adminType.body,
    color: adminColors.ink,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
});
