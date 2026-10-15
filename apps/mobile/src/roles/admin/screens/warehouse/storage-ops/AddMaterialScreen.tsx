import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { STORAGE_WAREHOUSES } from './fixtures';
import { ChevronDownIcon } from './StorageParts';
import type { WarehouseScreenBaseProps } from './types';

type Condition = 'Good' | 'Damaged';
const CONDITIONS: readonly Condition[] = ['Good', 'Damaged'];

const MATERIAL_OPTIONS = [
  'Select material',
  'Packaging Box',
  'Plastic Crates',
  'Label Roll',
  'Cleaning Liquid',
  'Safety Gloves',
];

const LOCATION_OPTIONS = [
  'Select storage location',
  'Rack 02 · Shelf 03',
  'Rack 01 · Shelf 01',
  'Rack 03 · Shelf 02',
  'Material Storage Area',
  'Cold Storage A',
  'Dry Storage B',
];

export interface AddMaterialScreenProps extends WarehouseScreenBaseProps {
  initialMaterialName?: string | undefined;
  onSave: () => void;
}

export function AddMaterialScreen({
  scope,
  onBack,
  initialMaterialName,
  onSave,
}: AddMaterialScreenProps) {
  const [material, setMaterial] = useState<string | undefined>(initialMaterialName);
  const [materialPickerOpen, setMaterialPickerOpen] = useState(false);

  const [condition, setCondition] = useState<Condition>('Good');

  const [location, setLocation] = useState<string | undefined>(undefined);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  const [notes, setNotes] = useState('');

  return (
    <WalletScreen
      title="Add Material"
      onBack={onBack}
      headerExtra={
        <ScopeHeader
          scope={scope}
          label={scope.warehouseName ?? 'Coonoor Warehouse'}
          warehouseOptions={STORAGE_WAREHOUSES}
        />
      }
      footer={
        <WalletFooter>
          <WalletButton label="Add Material" onPress={onSave} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>MATERIAL INFORMATION</SectionTitle>
        <FieldLabel required>Material Name</FieldLabel>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => {
            setMaterialPickerOpen((prev) => !prev);
            setLocationPickerOpen(false);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={[styles.dropdownText, !material && styles.placeholder]}>
            {material ?? 'Select material'}
          </Text>
          <ChevronDownIcon />
        </TouchableOpacity>

        {materialPickerOpen ? (
          <View style={styles.dropdownList}>
            {MATERIAL_OPTIONS.map((item, idx) => {
              const isHeader = idx === 0;
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.dropdownOption,
                    isHeader && styles.dropdownHeaderOption,
                  ]}
                  onPress={() => {
                    if (isHeader) {
                      setMaterial(undefined);
                    } else {
                      setMaterial(item);
                    }
                    setMaterialPickerOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      isHeader && styles.dropdownHeaderOptionText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

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
          style={styles.dropdown}
          onPress={() => {
            setLocationPickerOpen((prev) => !prev);
            setMaterialPickerOpen(false);
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={[styles.dropdownText, !location && styles.placeholder]}>
            {location ?? 'Select storage location'}
          </Text>
          <ChevronDownIcon />
        </TouchableOpacity>

        {locationPickerOpen ? (
          <View style={styles.dropdownList}>
            {LOCATION_OPTIONS.map((item, idx) => {
              const isHeader = idx === 0;
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.dropdownOption,
                    isHeader && styles.dropdownHeaderOption,
                  ]}
                  onPress={() => {
                    if (isHeader) {
                      setLocation(undefined);
                    } else {
                      setLocation(item);
                    }
                    setLocationPickerOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      isHeader && styles.dropdownHeaderOptionText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        <Text style={styles.helper}>Only locations in Coonoor Warehouse are shown.</Text>

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
  dropdownText: { ...adminType.body, color: adminColors.ink },
  placeholder: { color: adminColors.ink },
  dropdownList: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginTop: -adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  dropdownOption: {
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    backgroundColor: adminColors.card,
  },
  dropdownHeaderOption: {
    backgroundColor: adminColors.muted,
    paddingVertical: adminSpacing.md,
  },
  dropdownOptionText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '500',
  },
  dropdownHeaderOptionText: {
    color: adminColors.onBrand,
    fontWeight: '600',
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
});
