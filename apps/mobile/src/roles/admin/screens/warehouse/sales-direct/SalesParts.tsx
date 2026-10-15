/**
 * Pieces shared by the sales screens.
 *
 * WarehouseChips is the Main / all-scope warehouse selector, fed with real
 * warehouse uuids from useSalesWarehouseOptions (GET /warehouses). It renders
 * only for an all-warehouses scope (`scope.warehouseId` undefined); a Sub admin
 * is locked to its own warehouse and never sees it. Hiding it is presentation
 * only: the server applies the warehouse scope regardless (root CLAUDE.md 2.1).
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { WarehouseOption } from '../../../api/warehouseList';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import type { WarehouseScope } from './types';

/** True when the viewer sees every warehouse in its scope (the Main view). */
export function isAllWarehouses(scope: WarehouseScope): boolean {
  return scope.warehouseId === undefined;
}

export interface WarehouseChipsProps {
  scope: WarehouseScope;
  /** Picked warehouse uuid; undefined = all warehouses. */
  selected: string | undefined;
  onSelect: (warehouseId: string | undefined) => void;
  /** Offer an "All warehouses" chip (lists); a new sale must pick one warehouse. */
  allowAll?: boolean | undefined;
  options: readonly WarehouseOption[];
}

export function WarehouseChips({ scope, selected, onSelect, allowAll = true, options }: WarehouseChipsProps) {
  if (!isAllWarehouses(scope)) return null;
  const chips: { id: string | undefined; label: string }[] = [
    ...(allowAll ? [{ id: undefined, label: t('sales.common.allWarehouses') }] : []),
    ...options.map((w) => ({ id: w.warehouseId, label: w.warehouseName })),
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
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
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
    paddingVertical: adminSpacing.xs,
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
