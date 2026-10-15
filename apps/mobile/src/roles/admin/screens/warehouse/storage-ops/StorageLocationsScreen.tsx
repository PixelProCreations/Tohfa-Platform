/**
 * Storage Locations: the warehouse's locations, live from
 * GET /warehouses/{id}/storage-locations (inventory.batch.view; Sub own;
 * BR-79), grouped by their free-text type.
 *
 * A location has a code, a name, a type, an optional capacity and an active
 * flag; there is no rack / shelf / bin layout, so the old invented "Rack 02 ·
 * Shelf 03" rows are gone. The stock shown on a row is DERIVED from the
 * warehouse's ACTIVE batches whose free-text storage location equals the
 * location's code (what the receiving flow records); the screen says so.
 *
 * Add Location (POST) needs `warehouse.storage_location.manage` (Main all, Sub
 * none), so a Sub admin never sees it.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { InfoNote, SectionTitle, StatusBadge, WalletButton, WalletFooter, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { buildLocationBody, groupLocationsByType, locationStockOf, toLocationRow, type LocationDraft, type LocationDraftField } from './mappers';
import { PlusIcon, STORAGE_CODES } from './StorageParts';
import type { StorageWarehouse } from './StorageWarehouse';
import { useActiveBatches, useCreateStorageLocation, useStorageLocationList } from './useStorageData';
import type { WarehouseScreenBaseProps } from './types';

export interface StorageLocationsScreenProps extends WarehouseScreenBaseProps {
  warehouse: StorageWarehouse;
  onSelectLocation?: ((locationId: string) => void) | undefined;
}

const EMPTY_DRAFT: LocationDraft = { code: '', name: '', locationType: '', capacityKg: '' };

export function StorageLocationsScreen({ can, onBack, warehouse, onSelectLocation }: StorageLocationsScreenProps) {
  const locations = useStorageLocationList(warehouse.warehouseId);
  const batches = useActiveBatches(warehouse.warehouseId, can(STORAGE_CODES.batchView));
  const canManage = can(STORAGE_CODES.storageLocationManage);
  const [adding, setAdding] = useState(false);

  const groups = useMemo(() => {
    const now = new Date();
    return groupLocationsByType(locations.items.map((dto) => toLocationRow(dto, locationStockOf(batches.stockByCode, dto.code), now)));
  }, [locations.items, batches.stockByCode]);
  const view = queryViewState({ isLoading: locations.isLoading, error: locations.error, itemCount: locations.items.length });

  return (
    <WalletScreen
      title={t('storageOps.locations.title')}
      onBack={onBack}
      headerExtra={warehouse.header}
      footer={
        canManage && !adding && warehouse.warehouseId !== undefined ? (
          <WalletFooter>
            <WalletButton label={t('storageOps.locations.add')} icon={<PlusIcon />} onPress={() => setAdding(true)} />
          </WalletFooter>
        ) : undefined
      }
    >
      {warehouse.placeholder ?? (
        <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {adding ? <AddLocationForm warehouseId={warehouse.warehouseId} onDone={() => setAdding(false)} /> : null}
          <InfoNote tone="brandSoft">{t('storageOps.locations.stockNote')}</InfoNote>
          {batches.error ? <Text style={styles.muted}>{t('storageOps.locations.stockUnavailable')}</Text> : null}
          {!batches.complete ? <Text style={styles.muted}>{t('storageOps.partial')}</Text> : null}
          {view === 'loading' ? <AdminLoadingState /> : null}
          {view === 'error' ? <AdminErrorState error={locations.error} onRetry={locations.refresh} /> : null}
          {view === 'empty' ? (
            <AdminEmptyState title={t('storageOps.locations.empty')} subtitle={t('storageOps.locations.emptyHint')} />
          ) : null}
          {view === 'ready'
            ? groups.map((group) => (
                <View key={group.title} style={styles.group}>
                  <SectionTitle>{t('storageOps.locations.groupTitle', { type: group.title, count: group.rows.length })}</SectionTitle>
                  {group.rows.map((row) => (
                    <TouchableOpacity
                      key={row.id}
                      style={styles.card}
                      onPress={() => onSelectLocation?.(row.id)}
                      disabled={onSelectLocation === undefined}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={`${row.code} ${row.name}`}
                    >
                      <View style={styles.cardTop}>
                        <Text style={styles.cardTitle}>{row.name}</Text>
                        <StatusBadge label={row.statusLabel} tone={row.statusTone} />
                      </View>
                      <Text style={styles.muted}>
                        {t('storageOps.locations.rowMeta', { code: row.code, capacity: row.capacity ?? t('storageOps.location.capacityNotSet') })}
                      </Text>
                      {row.stock !== undefined ? (
                        <Text style={styles.stock}>
                          {t('storageOps.locations.rowStock', { quantity: row.stockLabel ?? '', count: row.stock.batchCount })}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            : null}
          {!locations.complete ? <Text style={styles.muted}>{t('storageOps.partial')}</Text> : null}
        </ScrollView>
      )}
    </WalletScreen>
  );
}

/** Inline create form (POST .../storage-locations); only rendered with warehouse.storage_location.manage. */
function AddLocationForm({ warehouseId, onDone }: { warehouseId: string | undefined; onDone: () => void }) {
  const [draft, setDraft] = useState<LocationDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Partial<Record<LocationDraftField, string>>>({});
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const create = useCreateStorageLocation(warehouseId);
  const set = (field: LocationDraftField) => (value: string) => setDraft((d) => ({ ...d, [field]: value }));

  const save = () => {
    const built = buildLocationBody(draft);
    if (!built.ok) {
      setErrors(Object.fromEntries(Object.entries(built.errors).map(([f, k]) => [f, t(k)])));
      return;
    }
    setErrors({});
    create.mutate(built.body, {
      onSuccess: onDone,
      onError: (err) => setSubmitError(t(adminErrorKey(err))),
    });
  };

  const field = (name: LocationDraftField, label: string, numeric = false) => (
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
    <View style={styles.form}>
      <Text style={styles.formTitle}>{t('storageOps.locations.add')}</Text>
      {field('code', t('storageOps.location.field.code'))}
      {field('name', t('storageOps.location.field.name'))}
      {field('locationType', t('storageOps.location.field.type'))}
      {field('capacityKg', t('storageOps.location.field.capacityKg'), true)}
      {submitError !== undefined ? <Text style={styles.error}>{submitError}</Text> : null}
      <View style={styles.formActions}>
        <WalletButton label={t('storageOps.cancel')} variant="neutral" flex onPress={onDone} />
        <WalletButton label={t('storageOps.save')} flex disabled={create.isPending} onPress={save} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: adminSpacing.md },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    gap: adminSpacing.xs,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { ...adminType.rowTitle, color: adminColors.ink, flex: 1 },
  muted: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  stock: { ...adminType.rowMeta, color: adminColors.ink },
  form: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  formTitle: { ...adminType.sectionHead, color: adminColors.ink },
  formActions: { flexDirection: 'row', gap: adminSpacing.sm, marginTop: adminSpacing.md },
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
