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
 */
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import {
  CheckIcon,
  EmptyState,
  InfoCard,
  InfoNote,
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
}: StorageLocationAssignmentScreenProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(warehouseId);
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);

  const effectiveWarehouseId = scope.warehouseId ?? selectedWarehouseId;
  const locations = useMemo(
    () =>
      effectiveWarehouseId === undefined
        ? []
        : locationsInScope(scope, selectedWarehouseId).filter((l) => l.status === 'Active' && l.capacityKg > l.currentKg),
    [scope, selectedWarehouseId, effectiveWarehouseId],
  );
  const selected = locations.find((l) => l.id === selectedLocationId);
  const canAssign = can(STORAGE_CODES.batchAssign);
  const warehouseLabel = effectiveWarehouseId === undefined ? 'Select a warehouse' : storageWarehouseName(effectiveWarehouseId);

  return (
    <WalletScreen
      title="Storage Location Assignment"
      subtitle={`Batch ${batchId}`}
      onBack={onBack}
      headerExtra={
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
          label={scope.warehouseId === undefined && warehouseId !== undefined ? warehouseLabel : undefined}
        />
      }
      footer={
        selected && canAssign && onConfirmAssignment ? (
          <WalletFooter>
            <WalletButton
              label="Confirm Location Assignment & Complete Receiving →"
              onPress={() => onConfirmAssignment(selected.id)}
            />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <InfoCard
          rows={[
            [
              { label: 'Warehouse', value: warehouseLabel },
              { label: 'Batch', value: batchId },
            ],
            [
              { label: 'Product', value: productName },
              { label: 'Quantity', value: quantity },
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
              <Text style={styles.selectedSub}>
                {selected.code} · {selected.type} · {formatKg(selected.capacityKg - selected.currentKg)} free
              </Text>
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
              {locations.length === 0 ? (
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
                        <Text style={styles.locSub}>
                          {loc.code} · Capacity: {formatKg(loc.capacityKg - loc.currentKg)} free
                        </Text>
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
