/**
 * Storage Location Assignment: pick where a received batch is put away.
 *
 * The locations are live (GET /warehouses/{id}/storage-locations, active ones
 * only). There is NO server route that assigns an existing batch to a
 * location: `inventory_batches.storage_location` is free text written when the
 * goods receipt is created (the receiving wizard sends the location code). So
 * this screen does not write anything itself: "Confirm" hands the chosen
 * location's CODE to the host (`onConfirmAssignment`), which records it on the
 * receipt it is creating. Without a host handler, or without
 * `inventory.batch.assign`, the location can be browsed but not confirmed.
 *
 * The batch comes from the host (`batchId`, `productName`, `quantity`); there
 * is no demo batch any more. No host opens this route today.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { InfoCard, InfoNote, PermissionNote, WalletButton, WalletFooter, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { toLocationRow } from './mappers';
import { STORAGE_CODES } from './StorageParts';
import type { StorageWarehouse } from './StorageWarehouse';
import { useStorageLocationList } from './useStorageData';
import type { WarehouseScreenBaseProps } from './types';

export interface StorageLocationAssignmentScreenProps extends WarehouseScreenBaseProps {
  warehouse: StorageWarehouse;
  batchId?: string | undefined;
  productName?: string | undefined;
  quantity?: string | undefined;
  /** Confirm: the chosen storage location's CODE (what a batch records). */
  onConfirmAssignment?: ((locationCode: string) => void) | undefined;
}

export function StorageLocationAssignmentScreen({
  can,
  onBack,
  warehouse,
  batchId,
  productName,
  quantity,
  onConfirmAssignment,
}: StorageLocationAssignmentScreenProps) {
  const locations = useStorageLocationList(warehouse.warehouseId);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const rows = useMemo(() => {
    const now = new Date();
    return locations.items.filter((l) => l.isActive).map((l) => toLocationRow(l, undefined, now));
  }, [locations.items]);
  const selected = rows.find((r) => r.id === selectedId);
  const canAssign = can(STORAGE_CODES.batchAssign);
  const view = queryViewState({ isLoading: locations.isLoading, error: locations.error, itemCount: rows.length });
  const none = t('storageOps.notAvailable');

  return (
    <WalletScreen
      title={t('storageOps.assign.title')}
      subtitle={batchId}
      onBack={onBack}
      headerExtra={warehouse.header}
      footer={
        selected && canAssign && onConfirmAssignment && batchId !== undefined ? (
          <WalletFooter>
            <WalletButton label={t('storageOps.assign.confirm')} onPress={() => onConfirmAssignment(selected.code)} />
          </WalletFooter>
        ) : undefined
      }
    >
      {warehouse.placeholder ?? (
        <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
          {batchId === undefined ? (
            <AdminEmptyState title={t('storageOps.assign.noBatch')} />
          ) : (
            <InfoCard
              rows={[
                [
                  { label: t('storageOps.assign.field.warehouse'), value: warehouse.warehouseName ?? none },
                  { label: t('storageOps.assign.field.batch'), value: batchId },
                ],
                [
                  { label: t('storageOps.assign.field.product'), value: productName ?? none },
                  { label: t('storageOps.assign.field.quantity'), value: quantity ?? none },
                ],
              ]}
            />
          )}
          <InfoNote tone="brandSoft">{t('storageOps.assign.note')}</InfoNote>
          {!canAssign ? <PermissionNote>{t('storageOps.assign.noPermission')}</PermissionNote> : null}

          {view === 'loading' ? <AdminLoadingState /> : null}
          {view === 'error' ? <AdminErrorState error={locations.error} onRetry={locations.refresh} /> : null}
          {view === 'empty' ? <AdminEmptyState title={t('storageOps.assign.empty')} /> : null}
          {view === 'ready'
            ? rows.map((loc) => {
                const active = loc.id === selectedId;
                return (
                  <TouchableOpacity
                    key={loc.id}
                    style={[styles.locCard, active && styles.locCardSelected]}
                    onPress={() => setSelectedId(loc.id)}
                    activeOpacity={0.75}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                  >
                    <View style={styles.locText}>
                      <Text style={styles.locZone}>{loc.typeLabel}</Text>
                      <Text style={styles.locTitle}>{loc.name}</Text>
                      <Text style={styles.locSub}>
                        {t('storageOps.locations.rowMeta', { code: loc.code, capacity: loc.capacity ?? t('storageOps.location.capacityNotSet') })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            : null}
        </ScrollView>
      )}
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  locCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  locCardSelected: { borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  locText: { flex: 1 },
  locZone: { ...adminType.caption, color: adminColors.brand },
  locTitle: { ...adminType.sectionHead, color: adminColors.ink },
  locSub: { ...adminType.rowMeta, color: adminColors.muted },
});
