/**
 * Add Material: record received material stock into a storage location.
 *
 * Gate (FINAL_LIST 129): `inventory.material_handling.manage` (MAIN all, SUB
 * own). Entry points hide without it; opened directly, the screen renders a
 * not-available note. Saving is a local mock until a material endpoint exists
 * (SPEC_GAPS W4u-1).
 *
 * Scope: the storage-location picker lists only the locations of the viewer's
 * warehouse (Sub: its own, locked). Main picks the warehouse first with the
 * selector; the list then narrows to it. The helper line names the warehouse
 * from scope, never a hard-coded one.
 */
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import {
  EmptyState,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { locationsInScope, MATERIAL_OPTIONS, STORAGE_WAREHOUSES, storageWarehouseName } from './fixtures';
import { ChevronDownIcon, MinusIcon, PlusIcon, STORAGE_CODES } from './StorageParts';
import type { MaterialOption, WarehouseScreenBaseProps } from './types';

type Condition = 'Good' | 'Damaged';
const CONDITIONS: readonly Condition[] = ['Good', 'Damaged'];

export interface AddMaterialScreenProps extends WarehouseScreenBaseProps {
  /** Preselect a material (Add Stock from Material Detail). */
  initialMaterialName?: string | undefined;
  materialOptions?: readonly MaterialOption[] | undefined;
  onSave: () => void;
}

export function AddMaterialScreen({
  scope,
  can,
  onBack,
  initialMaterialName,
  materialOptions = MATERIAL_OPTIONS,
  onSave,
}: AddMaterialScreenProps) {
  const initialOption = materialOptions.find((o) => o.name === initialMaterialName);
  const [material, setMaterial] = useState<MaterialOption | undefined>(initialOption);
  const [quantity, setQuantity] = useState('');
  const [condition, setCondition] = useState<Condition>('Good');
  const [locationId, setLocationId] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const [picker, setPicker] = useState<'material' | 'location' | null>(null);

  const warehouseId = scope.warehouseId ?? selectedWarehouseId;
  const locations = useMemo(
    () => (warehouseId === undefined ? [] : locationsInScope(scope, selectedWarehouseId).filter((l) => l.status === 'Active')),
    [scope, selectedWarehouseId, warehouseId],
  );
  const location = locations.find((l) => l.id === locationId);

  if (!can(STORAGE_CODES.materialManage)) {
    return (
      <WalletScreen title="Add Material" onBack={onBack}>
        <EmptyState title="Material handling not available" subtitle="Your role does not include managing warehouse materials." />
      </WalletScreen>
    );
  }

  const step = (delta: number) => {
    const current = parseInt(quantity, 10);
    const base = Number.isNaN(current) ? 0 : current;
    setQuantity(String(Math.max(0, base + delta)));
  };
  const qty = parseInt(quantity, 10);
  const canSave = material !== undefined && location !== undefined && !Number.isNaN(qty) && qty > 0;

  return (
    <WalletScreen
      title="Add Material"
      onBack={onBack}
      headerExtra={
        <ScopeHeader
          scope={scope}
          warehouseOptions={STORAGE_WAREHOUSES}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={(id) => {
            setSelectedWarehouseId(id);
            setLocationId(undefined);
          }}
        />
      }
      footer={
        <WalletFooter>
          <WalletButton label="Add Material" onPress={onSave} disabled={!canSave} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>MATERIAL INFORMATION</SectionTitle>
        <FieldLabel required>Material Name</FieldLabel>
        <TouchableOpacity style={styles.dropdown} onPress={() => setPicker('material')} activeOpacity={0.8} accessibilityRole="button">
          <Text style={[styles.dropdownText, !material && styles.placeholder]}>{material?.name ?? 'Select material'}</Text>
          <ChevronDownIcon />
        </TouchableOpacity>
        <FieldLabel required>Material Category</FieldLabel>
        <View style={[styles.dropdown, styles.dropdownDisabled]}>
          <Text style={[styles.dropdownText, !material && styles.placeholder]}>{material?.category ?? 'Select material first'}</Text>
        </View>

        <SectionTitle>QUANTITY</SectionTitle>
        <FieldLabel required>Received Quantity</FieldLabel>
        <View style={styles.dropdown}>
          <TextInput
            style={styles.input}
            placeholder="Enter quantity"
            placeholderTextColor={adminColors.placeholder}
            keyboardType="number-pad"
            value={quantity}
            onChangeText={(t) => setQuantity(t.replace(/[^0-9]/g, ''))}
          />
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepperButton} onPress={() => step(-1)} activeOpacity={0.7} accessibilityLabel="Decrease quantity">
              <MinusIcon />
            </TouchableOpacity>
            <TouchableOpacity style={styles.stepperButton} onPress={() => step(1)} activeOpacity={0.7} accessibilityLabel="Increase quantity">
              <PlusIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>
          </View>
        </View>
        <FieldLabel required>Condition</FieldLabel>
        <View style={styles.toggleRow}>
          {CONDITIONS.map((c) => {
            const active = c === condition;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.toggle, active && styles.toggleActive]}
                onPress={() => setCondition(c)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <SectionTitle>STORAGE LOCATION</SectionTitle>
        <FieldLabel required>Storage Location</FieldLabel>
        <TouchableOpacity
          style={[styles.dropdown, warehouseId === undefined && styles.dropdownDisabled]}
          onPress={() => setPicker('location')}
          disabled={warehouseId === undefined}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={[styles.dropdownText, !location && styles.placeholder]}>{location?.name ?? 'Select storage location'}</Text>
          <ChevronDownIcon />
        </TouchableOpacity>
        <Text style={styles.helper}>
          {warehouseId === undefined
            ? 'Select a warehouse above to list its storage locations.'
            : `Only locations in ${storageWarehouseName(warehouseId)} are shown.`}
        </Text>

        <SectionTitle>ADDITIONAL</SectionTitle>
        <FieldLabel>Notes</FieldLabel>
        <View style={styles.textAreaBox}>
          <TextInput
            style={styles.textArea}
            placeholder="Add any additional notes..."
            placeholderTextColor={adminColors.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </ScrollView>

      <Modal visible={picker !== null} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPicker(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{picker === 'material' ? 'Select Material' : 'Select Storage Location'}</Text>
            {picker === 'material'
              ? materialOptions.map((option) => (
                  <TouchableOpacity
                    key={option.name}
                    style={styles.modalOption}
                    onPress={() => {
                      setMaterial(option);
                      setPicker(null);
                    }}
                  >
                    <Text style={styles.modalOptionTitle}>{option.name}</Text>
                    <Text style={styles.modalOptionSub}>{option.category}</Text>
                  </TouchableOpacity>
                ))
              : locations.map((loc) => (
                  <TouchableOpacity
                    key={loc.id}
                    style={styles.modalOption}
                    onPress={() => {
                      setLocationId(loc.id);
                      setPicker(null);
                    }}
                  >
                    <Text style={styles.modalOptionTitle}>{loc.name}</Text>
                    <Text style={styles.modalOptionSub}>{loc.code}</Text>
                  </TouchableOpacity>
                ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </WalletScreen>
  );
}

function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {children}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.sm },
  required: { color: adminColors.danger.text },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.lg,
    height: 52,
    marginBottom: adminSpacing.lg,
  },
  dropdownDisabled: { backgroundColor: adminColors.brandTint },
  dropdownText: { ...adminType.body, color: adminColors.ink },
  placeholder: { color: adminColors.placeholder },
  input: { flex: 1, ...adminType.body, color: adminColors.ink, paddingVertical: 0 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepperButton: {
    backgroundColor: adminColors.brandTint,
    width: 32,
    height: 32,
    borderRadius: adminRadius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: { flexDirection: 'row', gap: adminSpacing.md, marginBottom: adminSpacing.lg },
  toggle: {
    flex: 1,
    height: 50,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: { backgroundColor: adminColors.brand },
  toggleText: { ...adminType.sectionHead, color: adminColors.brandDeep },
  toggleTextActive: { color: adminColors.onBrand },
  helper: { ...adminType.rowMeta, color: adminColors.muted, marginTop: -adminSpacing.sm, marginBottom: adminSpacing.lg },
  textAreaBox: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    height: 110,
    marginBottom: 20,
  },
  textArea: { flex: 1, ...adminType.body, color: adminColors.ink },
  // Was a translucent black scrim; no translucent token, so a solid canvas scrim with the card raised by adminShadow.lg.
  modalOverlay: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: 20,
    maxHeight: 380,
    ...adminShadow.lg,
  },
  modalTitle: { ...adminType.title, color: adminColors.ink, marginBottom: adminSpacing.lg },
  modalOption: { paddingVertical: adminSpacing.md, borderBottomWidth: 1, borderBottomColor: adminColors.border },
  modalOptionTitle: { ...adminType.sectionHead, color: adminColors.ink },
  modalOptionSub: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
});
