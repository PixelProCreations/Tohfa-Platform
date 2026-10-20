/**
 * Storage Location Detail, live from
 * GET /warehouses/{id}/storage-locations/{locationId} (inventory.batch.view;
 * Sub own; BR-79). A location outside the caller's warehouse is 404.
 *
 * Shows what the API carries: code, name, free-text type, capacity and the
 * active flag. The old Section / Rack / Shelf card is gone (the API has no
 * layout). "Stored stock" and occupancy are DERIVED from the warehouse's
 * ACTIVE batches whose free-text storage location equals this location's code
 * (what the receiving flow records), and the screen says so.
 *
 * Edit name / type / capacity and activate / deactivate (PATCH) need
 * `warehouse.storage_location.manage` (Main all, Sub none). View Stock opens
 * Inventory & Stock (host).
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  InfoCard,
  InfoNote,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  buildLocationBody,
  locationBatches,
  locationStockOf,
  toLocationRow,
  type LocationDraft,
  type LocationDraftField,
} from './mappers';
import { ProgressBar, STORAGE_CODES } from './StorageParts';
import type { StorageWarehouse } from './StorageWarehouse';
import { useActiveBatches, useStorageLocation, useUpdateStorageLocation } from './useStorageData';
import type { WarehouseScreenBaseProps } from './types';

export interface StorageLocationDetailScreenProps extends WarehouseScreenBaseProps {
  warehouse: StorageWarehouse;
  locationId?: string | undefined;
  onViewStock?: (() => void) | undefined;
  /** A stored batch row: that product in Inventory & Stock. */
  onViewProductDetail?: ((product: string) => void) | undefined;
  onViewActivity?: (() => void) | undefined;
}

export function StorageLocationDetailScreen({
  can,
  onBack,
  warehouse,
  locationId,
  onViewStock,
  onViewProductDetail,
  onViewActivity,
}: StorageLocationDetailScreenProps) {
  const canViewStock = can(STORAGE_CODES.batchView);
  const canManage = can(STORAGE_CODES.storageLocationManage);
  const query = useStorageLocation(warehouse.warehouseId, locationId);
  const batches = useActiveBatches(warehouse.warehouseId, canViewStock);
  const update = useUpdateStorageLocation(warehouse.warehouseId, locationId);
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState<string | undefined>(undefined);

  const dto = query.location;
  const row = useMemo(
    () => (dto === undefined ? undefined : toLocationRow(dto, locationStockOf(batches.stockByCode, dto.code), new Date())),
    [dto, batches.stockByCode],
  );
  const stored = useMemo(() => (dto === undefined ? [] : locationBatches(batches.items, dto.code)), [dto, batches.items]);
  const none = t('storageOps.notAvailable');

  const toggleActive = () => {
    if (row === undefined) return;
    setActionError(undefined);
    update.mutate({ isActive: !row.isActive }, { onError: (err) => setActionError(t(adminErrorKey(err))) });
  };

  return (
    <WalletScreen
      title={row?.name ?? t('storageOps.location.title')}
      subtitle={row?.code}
      onBack={onBack}
      headerExtra={warehouse.header}
      headerRight={row !== undefined ? <StatusBadge label={row.statusLabel} tone={row.statusTone} /> : undefined}
    >
      {warehouse.placeholder ??
        (row === undefined || dto === undefined ? (
          query.isLoading ? (
            <AdminLoadingState />
          ) : locationId === undefined ? (
            <AdminEmptyState title={t('storageOps.location.notFound')} />
          ) : (
            <AdminErrorState error={query.error} onRetry={query.refresh} />
          )
        ) : (
          <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <SectionTitle>{t('storageOps.location.section.info')}</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: t('storageOps.location.field.code'), value: row.code },
                  { label: t('storageOps.location.field.type'), value: row.typeLabel },
                ],
                [
                  { label: t('storageOps.location.field.capacity'), value: row.capacity ?? t('storageOps.location.capacityNotSet') },
                  { label: t('storageOps.location.field.created'), value: row.createdAt },
                ],
              ]}
            />

            {canManage && editing ? (
              <EditLocationForm
                warehouseId={warehouse.warehouseId}
                locationId={dto.id}
                initial={{ code: dto.code, name: dto.name, locationType: dto.locationType ?? '', capacityKg: dto.capacityKg ?? '' }}
                onDone={() => setEditing(false)}
              />
            ) : null}
            {canManage && !editing ? (
              <View style={styles.actions}>
                <WalletButton label={t('storageOps.location.edit')} variant="outline" flex onPress={() => setEditing(true)} />
                <WalletButton
                  label={t(row.isActive ? 'storageOps.location.deactivate' : 'storageOps.location.activate')}
                  variant="neutral"
                  flex
                  disabled={update.isPending}
                  onPress={toggleActive}
                />
              </View>
            ) : null}
            {actionError !== undefined ? <Text style={styles.error}>{actionError}</Text> : null}

            {canViewStock ? (
              <>
                <SectionTitle>{t('storageOps.location.section.occupancy')}</SectionTitle>
                <View style={styles.card}>
                  {batches.isLoading ? (
                    <AdminLoadingState />
                  ) : batches.error ? (
                    <AdminErrorState error={batches.error} onRetry={batches.refresh} />
                  ) : (
                    <>
                      <View style={styles.occupancyHead}>
                        <Text style={styles.ink}>{t('storageOps.location.stored', { quantity: row.stockLabel ?? none })}</Text>
                        <Text style={styles.ink}>
                          {row.occupancyPercent === null ? none : t('storageOps.percent', { value: row.occupancyPercent })}
                        </Text>
                      </View>
                      {row.occupancyPercent !== null ? (
                        <ProgressBar percent={row.occupancyPercent} tone={row.occupancyPercent > 100 ? 'danger' : 'brand'} />
                      ) : null}
                      <Text style={styles.muted}>
                        {t('storageOps.location.availableLine', { available: row.available ?? none })}
                      </Text>
                    </>
                  )}
                </View>
                <InfoNote tone="brandSoft">{t('storageOps.locations.stockNote')}</InfoNote>
                {!batches.complete ? <Text style={styles.muted}>{t('storageOps.partial')}</Text> : null}

                <SectionTitle>{t('storageOps.location.section.stock')}</SectionTitle>
                {stored.length === 0 && !batches.isLoading ? (
                  <Text style={styles.muted}>{t('storageOps.location.noStock')}</Text>
                ) : (
                  stored.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={styles.card}
                      onPress={() => onViewProductDetail?.(b.productName)}
                      disabled={onViewProductDetail === undefined}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                    >
                      <View style={styles.occupancyHead}>
                        <Text style={styles.ink}>{b.product}</Text>
                        <Text style={styles.ink}>{b.quantity}</Text>
                      </View>
                      <Text style={styles.muted}>{b.batchCode}</Text>
                    </TouchableOpacity>
                  ))
                )}
                {onViewStock ? <WalletButton label={t('storageOps.location.viewStock')} variant="outline" onPress={onViewStock} /> : null}
              </>
            ) : null}
            {onViewActivity ? (
              <View style={styles.spaced}>
                <WalletButton label={t('storageOps.location.viewActivity')} variant="neutral" onPress={onViewActivity} />
              </View>
            ) : null}
          </ScrollView>
        ))}
    </WalletScreen>
  );
}

/** PATCH name / type / capacity (the code is immutable); only rendered with warehouse.storage_location.manage. */
function EditLocationForm({
  warehouseId,
  locationId,
  initial,
  onDone,
}: {
  warehouseId: string | undefined;
  locationId: string;
  initial: LocationDraft;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<LocationDraft>(initial);
  const [errors, setErrors] = useState<Partial<Record<LocationDraftField, string>>>({});
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const update = useUpdateStorageLocation(warehouseId, locationId);
  const set = (field: LocationDraftField) => (value: string) => setDraft((d) => ({ ...d, [field]: value }));

  const save = () => {
    const built = buildLocationBody(draft);
    if (!built.ok) {
      setErrors(Object.fromEntries(Object.entries(built.errors).map(([f, k]) => [f, t(k)])));
      return;
    }
    setErrors({});
    const { name, locationType, capacityKg } = built.body;
    update.mutate({ name, locationType, capacityKg }, { onSuccess: onDone, onError: (err) => setSubmitError(t(adminErrorKey(err))) });
  };

  const field = (name: Exclude<LocationDraftField, 'code'>, label: string, numeric = false) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={draft[name]}
        onChangeText={set(name)}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        placeholderTextColor={adminColors.placeholder}
      />
      {errors[name] ? <Text style={styles.error}>{errors[name]}</Text> : null}
    </>
  );

  return (
    <View style={styles.card}>
      {field('name', t('storageOps.location.field.name'))}
      {field('locationType', t('storageOps.location.field.type'))}
      {field('capacityKg', t('storageOps.location.field.capacityKg'), true)}
      {submitError !== undefined ? <Text style={styles.error}>{submitError}</Text> : null}
      <View style={styles.actions}>
        <WalletButton label={t('storageOps.cancel')} variant="neutral" flex onPress={onDone} />
        <WalletButton label={t('storageOps.save')} flex disabled={update.isPending} onPress={save} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    gap: adminSpacing.xs,
  },
  occupancyHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: adminSpacing.sm },
  ink: { ...adminType.rowTitle, color: adminColors.ink },
  muted: { ...adminType.rowMeta, color: adminColors.muted },
  actions: { flexDirection: 'row', gap: adminSpacing.sm, marginVertical: adminSpacing.sm },
  spaced: { marginTop: adminSpacing.sm },
  label: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.sm, marginBottom: adminSpacing.xs },
  input: {
    ...adminType.body,
    color: adminColors.ink,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  error: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.xs },
});
