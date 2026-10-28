/**
 * Storage Location Assignment: put a received batch away into a storage
 * location (the last step of receiving).
 *
 * Gate (FINAL_LIST 136): Confirm Location Assignment needs
 * `inventory.batch.assign` (MAIN all, SUB all). Without it the location can
 * still be browsed but not confirmed. Confirming is a local hand-off to the
 * host until the batch-assignment call is wired.
 *
 * Scope: the warehouse comes from scope (Sub: its own, locked), or for the Main
 * view from the batch (`warehouseId`) or, when unknown, the warehouse selector.
 * The old screen defaulted the warehouse to 'Coonoor' and listed three
 * invented zones; the picker now lists the active locations of that warehouse
 * with their free capacity (profile-settings STORAGE_LOCATIONS).
 *
 * Live mode (`live`, the Goods Receiving wizard's Sub storage step): the
 * locations come from the API (code, name, type, capacity: no used KG, so no
 * "free" figure and no full-location filter), and nothing is read from the
 * fixtures. The batch line is omitted: the quality check creates the batch
 * and sets this location in the same call (BR-106), so it does not exist yet.
 * Without `live` the screen behaves exactly as before (StorageFlow).
 */
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { kgLabel } from '../receiving-qc/mappers';
import type { LiveStorageOption } from '../receiving-qc/liveTypes';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  CheckIcon,
  EmptyState,
  InfoCard,
  InfoNote,
  isAllWarehouses,
  PermissionNote,
  ScopeHeader,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { DEMO_ASSIGNMENT_BATCH, locationsInScope, STORAGE_WAREHOUSES, storageWarehouseName } from './fixtures';
import { formatKg, STORAGE_CODES } from './StorageParts';
import type { WarehouseScreenBaseProps } from './types';

export interface StorageLocationAssignmentScreenProps extends WarehouseScreenBaseProps {
  batchId?: string | undefined;
  productName?: string | undefined;
  quantity?: string | undefined;
  /** The batch's warehouse (Main view). A Sub scope always uses its own. */
  warehouseId?: string | undefined;
  /** Confirm Location Assignment: the chosen storage location id. */
  onConfirmAssignment?: ((locationId: string) => void) | undefined;
  /** Live locations and confirm (the receiving wizard); see the file comment. */
  live?: StorageAssignmentLive | undefined;
}

export interface StorageAssignmentLive {
  options: readonly LiveStorageOption[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  /** The warehouse's name (the scope's own for a Sub admin). */
  warehouseName: string;
  /** A confirm is in flight: the button is disabled (no double submit). */
  confirming: boolean;
  /** The chosen location id; undefined when the warehouse has no location set up (the location is optional). */
  onConfirm: (locationId: string | undefined) => void;
}

/** One row of the picker, from the fixtures or from the API. */
interface LocationRow {
  id: string;
  name: string;
  type: string;
  /** The chosen card's line: "A-01 · Cold Zone · 620 KG free" (fixtures) / "A-01 · Cold · Capacity: 2,000 KG" (live). */
  sub: string;
  /** The picker row's line: "A-01 · Capacity: 620 KG free" (fixtures) / "A-01 · Capacity: 2,000 KG" (live). */
  rowSub: string;
}

export function StorageLocationAssignmentScreen({
  scope,
  can,
  onBack,
  batchId = DEMO_ASSIGNMENT_BATCH.batchId,
  productName = DEMO_ASSIGNMENT_BATCH.productName,
  quantity = DEMO_ASSIGNMENT_BATCH.quantity,
  warehouseId,
  onConfirmAssignment,
  live,
}: StorageLocationAssignmentScreenProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(warehouseId);
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);

  const effectiveWarehouseId = scope.warehouseId ?? selectedWarehouseId;
  const locations = useMemo((): LocationRow[] => {
    if (live !== undefined) {
      return live.options.map((l) => {
        const capacity = l.capacityGrams === null ? '' : t('receiving.wizard.capacity', { qty: kgLabel(l.capacityGrams) });
        return {
          id: l.id,
          name: l.label,
          type: l.zone,
          sub: [l.code, l.zone, capacity].filter((part) => part !== '').join(' · '),
          rowSub: [l.code, capacity].filter((part) => part !== '').join(' · '),
        };
      });
    }
    return effectiveWarehouseId === undefined
      ? []
      : locationsInScope(scope, selectedWarehouseId)
          .filter((l) => l.status === 'Active' && l.capacityKg > l.currentKg)
          .map((l) => ({
            id: l.id,
            name: l.name,
            type: l.type,
            sub: `${l.code} · ${l.type} · ${formatKg(l.capacityKg - l.currentKg)} free`,
            rowSub: `${l.code} · Capacity: ${formatKg(l.capacityKg - l.currentKg)} free`,
          }));
  }, [live, scope, selectedWarehouseId, effectiveWarehouseId]);
  const selected = locations.find((l) => l.id === selectedLocationId);
  const canAssign = can(STORAGE_CODES.batchAssign);
  const warehouseLabel =
    live !== undefined
      ? live.warehouseName
      : effectiveWarehouseId === undefined
        ? 'Select a warehouse'
        : storageWarehouseName(effectiveWarehouseId);
  /** Live: a warehouse with no location set up still completes receiving (the location is optional on the check). */
  const liveNoLocations = live !== undefined && !live.isLoading && (live.error === null || live.error === undefined) && live.options.length === 0;
  const footerButton =
    live !== undefined ? (
      (selected !== undefined || liveNoLocations) && canAssign ? (
        <WalletFooter>
          <WalletButton
            label={t('receiving.wizard.confirmLocationComplete')}
            disabled={live.confirming}
            onPress={() => live.onConfirm(selected?.id)}
          />
        </WalletFooter>
      ) : undefined
    ) : selected && canAssign && onConfirmAssignment ? (
      <WalletFooter>
        <WalletButton
          label="Confirm Location Assignment & Complete Receiving →"
          onPress={() => onConfirmAssignment(selected.id)}
        />
      </WalletFooter>
    ) : undefined;

  return (
    <WalletScreen
      title="Storage Location Assignment"
      subtitle={live !== undefined ? undefined : t('receiving.wizard.batchSubtitle', { code: batchId })}
      onBack={onBack}
      headerExtra={
        live === undefined && isAllWarehouses(scope) ? (
          <ScopeHeader
            scope={scope}
            warehouseOptions={STORAGE_WAREHOUSES}
            selectedWarehouseId={selectedWarehouseId}
            onSelectWarehouse={
              warehouseId === undefined
                ? (id) => {
                    setSelectedWarehouseId(id);
                    setSelectedLocationId(undefined);
                  }
                : undefined
            }
            label={warehouseLabel}
          />
        ) : undefined
      }
      footer={footerButton}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <InfoCard
          rows={[
            [
              { label: t('receiving.wizard.warehouse'), value: warehouseLabel },
              // Live: no batch yet (the check creates it, BR-106), so no batch line.
              ...(live !== undefined ? [] : [{ label: t('receiving.wizard.batch'), value: batchId }]),
            ],
            [
              { label: t('receiving.wizard.product'), value: productName },
              { label: t('receiving.wizard.quantity'), value: quantity },
            ],
          ]}
        />

        <InfoNote tone="brandSoft">
          Location hierarchy (Warehouse → Storage Area → Section → Rack → Shelf) reflects this warehouse&apos;s actual
          configuration — not hard-coded if the backend uses a different structure.
        </InfoNote>

        {selected ? (
          <View style={styles.selectedCard}>
            <View style={styles.selectedText}>
              <Text style={styles.selectedLabel}>ASSIGNED STORAGE LOCATION</Text>
              <Text style={styles.selectedTitle}>{selected.name}</Text>
              <Text style={styles.selectedSub}>{selected.sub}</Text>
            </View>
            <TouchableOpacity style={styles.changeButton} onPress={() => setPickerOpen(true)} activeOpacity={0.7} accessibilityRole="button">
              <Text style={styles.changeButtonText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <WalletButton
          label={selected ? 'Change Storage Location' : 'Select Storage Location'}
          variant="outline"
          onPress={() => setPickerOpen(true)}
          disabled={effectiveWarehouseId === undefined}
        />
        {!canAssign ? <PermissionNote>Confirming a storage location needs batch assignment access.</PermissionNote> : null}
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Destination Rack & Shelf</Text>
            <Text style={styles.modalSub}>
              {warehouseLabel} · {productName}
            </Text>
            <ScrollView style={styles.locList}>
              {live !== undefined && locations.length === 0 && live.isLoading ? (
                <AdminLoadingState />
              ) : live !== undefined && locations.length === 0 && live.error !== null && live.error !== undefined ? (
                <AdminErrorState error={live.error} onRetry={live.onRetry} />
              ) : live !== undefined && locations.length === 0 ? (
                <EmptyState title={t('receiving.wizard.storageEmpty')} />
              ) : locations.length === 0 ? (
                <EmptyState title="No free storage locations" subtitle="Every active location in this warehouse is full." />
              ) : (
                locations.map((loc) => {
                  const active = loc.id === selectedLocationId;
                  return (
                    <TouchableOpacity
                      key={loc.id}
                      style={[styles.locCard, active && styles.locCardSelected]}
                      onPress={() => {
                        setSelectedLocationId(loc.id);
                        setPickerOpen(false);
                      }}
                      activeOpacity={0.75}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <View style={[styles.radio, active && styles.radioSelected]}>{active ? <CheckIcon size={11} /> : null}</View>
                      <View style={styles.locText}>
                        <Text style={styles.locZone}>{loc.type}</Text>
                        <Text style={[styles.locTitle, active && styles.locTitleSelected]}>{loc.name}</Text>
                        <Text style={styles.locSub}>{loc.rowSub}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
            <WalletButton label="Close" variant="neutral" onPress={() => setPickerOpen(false)} />
          </View>
        </View>
      </Modal>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    padding: 14,
    marginBottom: 14,
  },
  selectedText: { flex: 1 },
  selectedLabel: { ...adminType.caption, color: adminColors.brand },
  selectedTitle: { ...adminType.sectionHead, color: adminColors.ink, marginTop: 2 },
  selectedSub: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 1 },
  changeButton: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 6,
    borderRadius: adminRadius.xs,
    backgroundColor: adminColors.brandTint,
  },
  changeButtonText: { ...adminType.rowTitle, color: adminColors.brand },
  // Was a translucent black scrim; no translucent token, so a solid canvas scrim with the card raised by adminShadow.lg.
  modalOverlay: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: 20,
    ...adminShadow.lg,
  },
  modalTitle: { ...adminType.title, color: adminColors.ink },
  modalSub: { ...adminType.rowTitle, color: adminColors.brand, marginTop: 2, marginBottom: adminSpacing.lg },
  locList: { marginBottom: adminSpacing.lg },
  locCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: 10,
  },
  locCardSelected: { borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  radio: {
    width: 20,
    height: 20,
    borderRadius: adminRadius.full,
    borderWidth: 2,
    borderColor: adminColors.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: adminColors.brand, backgroundColor: adminColors.brand },
  locText: { flex: 1, marginLeft: adminSpacing.md },
  locZone: { ...adminType.caption, color: adminColors.brand, marginBottom: 2 },
  locTitle: { ...adminType.sectionHead, color: adminColors.ink },
  locTitleSelected: { color: adminColors.brandDeep },
  locSub: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
});
