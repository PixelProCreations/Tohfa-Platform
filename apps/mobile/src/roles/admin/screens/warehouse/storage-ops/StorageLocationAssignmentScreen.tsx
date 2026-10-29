/**
 * Storage Location Assignment: put a received batch away into a storage
 * location (the last step of receiving).
 *
 * Gate: Confirm Location Assignment needs `inventory.quality_check.perform`.
 *
 * Live mode (`live`, the Goods Receiving wizard's Sub storage step): the
 * locations come from the API (code, name, type, capacity).
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
  PermissionNote,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { STORAGE_CODES } from './StorageParts';
import type { WarehouseScreenBaseProps } from './types';

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

export interface StorageLocationAssignmentScreenProps extends WarehouseScreenBaseProps {
  batchId?: string | undefined;
  productName: string;
  quantity: string;
  /** The batch's warehouse (Main view). A Sub scope always uses its own. */
  warehouseId?: string | undefined;
  /** Confirm Location Assignment: the chosen storage location id. */
  onConfirmAssignment?: ((locationId: string) => void) | undefined;
  /** Live locations and confirm (the receiving wizard); required. */
  live: StorageAssignmentLive;
}

/** One row of the picker, from the API options. */
interface LocationRow {
  id: string;
  name: string;
  type: string;
  sub: string;
  rowSub: string;
}

export function StorageLocationAssignmentScreen({
  can,
  onBack,
  batchId,
  productName,
  quantity,
  live,
}: StorageLocationAssignmentScreenProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);

  const locations = useMemo((): LocationRow[] => {
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
  }, [live.options]);

  const selected = locations.find((l) => l.id === selectedLocationId);
  const canAssign = can(STORAGE_CODES.qualityCheckPerform);
  const warehouseLabel = live.warehouseName;

  /** Live: a warehouse with no location set up still completes receiving (the location is optional on the check). */
  const liveNoLocations = !live.isLoading && (live.error === null || live.error === undefined) && live.options.length === 0;

  const footerButton =
    (selected !== undefined || liveNoLocations) && canAssign ? (
      <WalletFooter>
        <WalletButton
          label={t('receiving.wizard.confirmLocationComplete')}
          disabled={live.confirming}
          onPress={() => live.onConfirm(selected?.id)}
        />
      </WalletFooter>
    ) : undefined;

  return (
    <WalletScreen
      title={t('storageOps.assignment.title')}
      subtitle={batchId ? t('receiving.wizard.batchSubtitle', { code: batchId }) : undefined}
      onBack={onBack}
      footer={footerButton}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <InfoCard
          rows={[
            [
              { label: t('receiving.wizard.warehouse'), value: warehouseLabel },
              ...(batchId ? [{ label: t('receiving.wizard.batch'), value: batchId }] : []),
            ],
            [
              { label: t('receiving.wizard.product'), value: productName },
              { label: t('receiving.wizard.quantity'), value: quantity },
            ],
          ]}
        />

        <InfoNote tone="brandSoft">
          {t('storageOps.assignment.note')}
        </InfoNote>

        {selected ? (
          <View style={styles.selectedCard}>
            <View style={styles.selectedText}>
              <Text style={styles.selectedLabel}>{t('storageOps.assignment.assignedTitle')}</Text>
              <Text style={styles.selectedTitle}>{selected.name}</Text>
              <Text style={styles.selectedSub}>{selected.sub}</Text>
            </View>
            <TouchableOpacity style={styles.changeButton} onPress={() => setPickerOpen(true)} activeOpacity={0.7} accessibilityRole="button">
              <Text style={styles.changeButtonText}>{t('storageOps.assignment.change')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <WalletButton
          label={selected ? t('storageOps.assignment.changeLocation') : t('storageOps.assignment.selectLocation')}
          variant="outline"
          onPress={() => setPickerOpen(true)}
        />
        {!canAssign ? <PermissionNote>{t('storageOps.assignment.noPermission')}</PermissionNote> : null}
      </ScrollView>

      <Modal
        visible={pickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('storageOps.assignment.pickerTitle')}</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)} accessibilityRole="button">
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {live.isLoading ? (
                <AdminLoadingState label={t('storageOps.assignment.loadingLocations')} />
              ) : live.error ? (
                <AdminErrorState
                  error={live.error}
                  onRetry={live.onRetry}
                  retryLabel={t('async.retry')}
                />
              ) : locations.length === 0 ? (
                <EmptyState
                  title={t('storageOps.assignment.noLocationsTitle')}
                  subtitle={t('storageOps.assignment.noLocationsSubtitle')}
                />
              ) : (
                locations.map((item) => {
                  const isSelected = item.id === selectedLocationId;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.pickerRow, isSelected && styles.pickerRowSelected]}
                      onPress={() => {
                        setSelectedLocationId(item.id);
                        setPickerOpen(false);
                      }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                    >
                      <View style={styles.pickerRowText}>
                        <Text style={[styles.pickerRowName, isSelected && styles.pickerRowNameSelected]}>{item.name}</Text>
                        <Text style={styles.pickerRowSub}>{item.rowSub}</Text>
                      </View>
                      {isSelected ? (
                        <View style={styles.checkCircle}>
                          <CheckIcon size={14} color={adminColors.onBrand} />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  selectedCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.brand,
    padding: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  selectedText: { flex: 1, marginRight: adminSpacing.md },
  selectedLabel: { ...adminType.rowMeta, color: adminColors.brand, marginBottom: 4 },
  selectedTitle: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: 2 },
  selectedSub: { ...adminType.caption, color: adminColors.muted },
  changeButton: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  changeButtonText: { ...adminType.caption, fontWeight: '600', color: adminColors.brand },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    maxHeight: '80%',
    ...adminShadow.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: adminSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  modalTitle: { ...adminType.sectionHead, color: adminColors.ink },
  modalCloseText: { ...adminType.sectionHead, color: adminColors.muted },
  modalScroll: { padding: adminSpacing.md },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: adminSpacing.md,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.sm,
    backgroundColor: adminColors.canvas,
  },
  pickerRowSelected: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  pickerRowText: { flex: 1 },
  pickerRowName: { ...adminType.body, color: adminColors.ink, marginBottom: 2 },
  pickerRowNameSelected: { fontWeight: '700', color: adminColors.brand },
  pickerRowSub: { ...adminType.caption, color: adminColors.muted },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});