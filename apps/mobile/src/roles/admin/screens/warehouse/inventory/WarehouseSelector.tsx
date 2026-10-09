/**
 * All-warehouses selector for the Main Warehouse view of the inventory screens.
 *
 * Rendered only when `scope.warehouseId` is undefined (Main, rbac grant `all`).
 * A Sub admin is locked to one warehouse, so for a set warehouseId this returns
 * null and the header shows the locked warehouse pill instead. The options come
 * from the host; nothing here names a warehouse.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import type { WarehouseScope } from './types';

export interface WarehouseSelectorProps {
  scope: WarehouseScope;
  options?: readonly WarehouseScope[] | undefined;
  /** Selected warehouseId; undefined = all warehouses. */
  selectedId: string | undefined;
  onSelect: (warehouseId: string | undefined) => void;
}

export function WarehouseSelector({ scope, options = [], selectedId, onSelect }: WarehouseSelectorProps) {
  if (scope.warehouseId !== undefined) return null;
  const chips: { id: string | undefined; label: string }[] = [
    { id: undefined, label: 'All Warehouses' },
    ...options
      .filter((o) => o.warehouseId !== undefined)
      .map((o) => ({ id: o.warehouseId, label: o.warehouseName ?? String(o.warehouseId) })),
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chips.map((chip) => {
        const active = chip.id === selectedId;
        return (
          <TouchableOpacity
            key={chip.id ?? 'all'}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(chip.id)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: adminSpacing.sm, marginTop: adminSpacing.md },
  chip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandDeep,
  },
  chipActive: { backgroundColor: adminColors.card },
  chipText: { ...adminType.rowTitle, color: adminColors.onBrand },
  chipTextActive: { color: adminColors.brand },
});
