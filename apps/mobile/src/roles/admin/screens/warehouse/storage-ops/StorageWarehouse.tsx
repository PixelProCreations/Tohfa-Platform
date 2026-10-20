/**
 * Which warehouse the live storage-ops screens ask about, and the header that
 * shows / changes it.
 *
 * Every storage-ops endpoint takes ONE warehouse uuid in its path, so there is
 * no all-warehouses view any more:
 *   - Sub admin: always scope.warehouseId (BR-30), shown as the locked pill.
 *   - Main admin: the warehouse picked from the real list (GET /warehouses,
 *     warehouse.all.view, shared/useWarehouseOptions), defaulting to the first
 *     active one (MAIN before SUB). The pick is kept by StorageFlow so it
 *     survives moving between screens. A pick that is not a uuid (the old
 *     fixture ids such as 'WH-OOTY') is ignored (storageWarehouseId).
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { ScopeHeader } from '../wallet-cashtopup/WalletParts';
import { storageWarehouseId } from './mappers';
import { ChevronDownIcon, PickerModal, STORAGE_CODES, WarehouseIcon } from './StorageParts';
import type { PermissionCheck, WarehouseScope } from './types';

export interface StorageWarehouse {
  /** The uuid every request sends; undefined while there is nothing to ask for. */
  warehouseId: string | undefined;
  warehouseName: string | undefined;
  isMain: boolean;
  /** Header content (locked pill or picker). */
  header: React.ReactNode;
  /** Loading / error / empty while there is no warehouse; null once there is one. */
  placeholder: React.ReactNode;
  /** Main: the real warehouse list, for screens that link to a warehouse by name. */
  options: readonly { warehouseId: string; warehouseName: string }[];
}

export function useStorageWarehouse(
  scope: WarehouseScope,
  can: PermissionCheck,
  selectedId: string | undefined,
  onSelect: (warehouseId: string) => void,
): StorageWarehouse {
  const isMain = scope.warehouseId === undefined;
  const list = useWarehouseOptions({ enabled: isMain && can(STORAGE_CODES.allWarehousesView), activeOnly: true });
  const options = list.options.map((o) => ({ warehouseId: o.warehouseId, warehouseName: o.warehouseName }));
  const picked = isMain
    ? options.find((o) => o.warehouseId === selectedId)?.warehouseId ?? options[0]?.warehouseId
    : undefined;
  const warehouseId = storageWarehouseId(scope, picked);
  const warehouseName = isMain ? options.find((o) => o.warehouseId === warehouseId)?.warehouseName : scope.warehouseName;

  let placeholder: React.ReactNode = null;
  if (warehouseId === undefined) {
    if (isMain && list.isLoading) placeholder = <AdminLoadingState />;
    else if (isMain && list.error) placeholder = <AdminErrorState error={list.error} onRetry={list.refresh} />;
    else placeholder = <AdminEmptyState title={t('storageOps.warehouse.none')} subtitle={t('storageOps.warehouse.noneHint')} />;
  }

  const header = isMain ? (
    <WarehousePicker options={options} selectedId={warehouseId} selectedName={warehouseName} onSelect={onSelect} />
  ) : (
    <ScopeHeader scope={scope} label={warehouseName} />
  );

  return { warehouseId, warehouseName, isMain, header, placeholder, options };
}

function WarehousePicker({
  options,
  selectedId,
  selectedName,
  onSelect,
}: {
  options: readonly { warehouseId: string; warehouseName: string }[];
  selectedId: string | undefined;
  selectedName: string | undefined;
  onSelect: (warehouseId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (options.length === 0) return null;
  const names = options.map((o) => o.warehouseName);
  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={t('storageOps.warehouse.select')}
      >
        <WarehouseIcon size={16} color={adminColors.onBrand} />
        <Text style={styles.buttonText}>{selectedName ?? t('storageOps.warehouse.select')}</Text>
        <ChevronDownIcon size={14} color={adminColors.onBrand} />
      </TouchableOpacity>
      <PickerModal
        visible={open}
        title={t('storageOps.warehouse.select')}
        options={names}
        value={selectedName ?? ''}
        onSelect={(name) => {
          const option = options.find((o) => o.warehouseName === name);
          if (option !== undefined && option.warehouseId !== selectedId) onSelect(option.warehouseId);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: adminColors.brandDeep,
    borderWidth: 1,
    borderColor: adminColors.brandTint,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    marginTop: adminSpacing.sm,
    gap: adminSpacing.xs,
  },
  buttonText: { ...adminType.caption, color: adminColors.onBrand },
});
