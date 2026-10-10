/**
 * Pieces shared by the direct-sale screens.
 *
 * WarehouseChips is the Main Warehouse "All warehouses" selector. It renders
 * only for an all-warehouses scope (`scope.warehouseId` undefined); a Sub
 * admin is locked to its own warehouse and never sees it (FINAL_LIST rows
 * 109, 110, 115, 116). Hiding it is presentation only: the server applies the
 * warehouse filter for SUB regardless (root CLAUDE.md 2.1).
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { WALLET_WAREHOUSES } from '../wallet-cashtopup';
import type { WarehouseScope } from './types';

/** The four warehouses a Main admin can pick from (owner decision: Main `own` = all four). */
export const SALE_WAREHOUSES: readonly WarehouseScope[] = WALLET_WAREHOUSES;

/** True when the viewer sees every warehouse (the Main view). */
export function isAllWarehouses(scope: WarehouseScope): boolean {
  return scope.warehouseId === undefined;
}

/** Does a row of warehouse `warehouseId` belong in this view? Sub: own only; Main: the picked one or all. */
export function inWarehouse(
  scope: WarehouseScope,
  picked: string | undefined,
  warehouseId: string | undefined,
): boolean {
  const filter = scope.warehouseId ?? picked;
  return filter === undefined || warehouseId === undefined || warehouseId === filter;
}

export interface WarehouseChipsProps {
  scope: WarehouseScope;
  /** Picked warehouse id; undefined = all warehouses. */
  selected: string | undefined;
  onSelect: (warehouseId: string | undefined) => void;
  /** Offer an "All warehouses" chip (lists); a new sale must pick one warehouse. */
  allowAll?: boolean | undefined;
  options?: readonly WarehouseScope[] | undefined;
}

export function WarehouseChips({
  scope,
  selected,
  onSelect,
  allowAll = true,
  options = SALE_WAREHOUSES,
}: WarehouseChipsProps) {
  if (!isAllWarehouses(scope)) return null;
  const chips: { id: string | undefined; label: string }[] = [
    ...(allowAll ? [{ id: undefined, label: 'All warehouses' }] : []),
    ...options.map((w) => ({ id: w.warehouseId, label: w.warehouseName ?? w.warehouseId ?? '' })),
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chips.map((c) => {
        const active = c.id === selected;
        return (
          <TouchableOpacity
            key={c.id ?? 'all'}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(c.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: adminSpacing.sm,
    paddingVertical: adminSpacing.sm,
  },
  chip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs + 2,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  chipActive: {
    backgroundColor: adminColors.brandSoft.bg,
    borderColor: adminColors.brandSoft.border,
  },
  chipText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  chipTextActive: {
    ...adminType.caption,
    color: adminColors.brandSoft.text,
  },
});
