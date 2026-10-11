/**
 * All-warehouses dropdown selector for the Main Warehouse view.
 *
 * Rendered only when `scope.warehouseId` is undefined (Main, rbac grant `all`).
 * Renders a clean dropdown button that opens a warehouse selection modal,
 * consistent across the warehouse app.
 */
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import type { WarehouseScope } from './types';

function BuildingWarehouseIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownSmallIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckSmallIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface WarehouseSelectorProps {
  scope: WarehouseScope;
  options?: readonly WarehouseScope[] | undefined;
  /** Selected warehouseId; undefined = all warehouses. */
  selectedId: string | undefined;
  onSelect: (warehouseId: string | undefined) => void;
}

export function WarehouseSelector({ scope, options = [], selectedId, onSelect }: WarehouseSelectorProps) {
  if (scope.warehouseId !== undefined) return null;
  const [showModal, setShowModal] = useState(false);

  const selectedName =
    options.find((o) => o.warehouseId === selectedId)?.warehouseName ?? 'All Warehouses';

  const validOptions = options.filter((o) => o.warehouseId !== undefined);

  return (
    <>
      <TouchableOpacity
        style={styles.dropdownBtn}
        activeOpacity={0.8}
        onPress={() => setShowModal(true)}
      >
        <BuildingWarehouseIcon color={adminColors.onBrand} />
        <Text style={styles.dropdownBtnText}>
          {selectedId ? selectedName : 'All Warehouses'}
        </Text>
        <ChevronDownSmallIcon />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View style={styles.dropdownModalCard}>
            <Text style={styles.dropdownModalTitle}>Select Warehouse</Text>

            <TouchableOpacity
              style={[styles.dropdownModalItem, selectedId === undefined && styles.dropdownModalItemActive]}
              onPress={() => {
                onSelect(undefined);
                setShowModal(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownModalItemText,
                  selectedId === undefined && styles.dropdownModalItemTextActive,
                ]}
              >
                All Warehouses
              </Text>
              {selectedId === undefined ? <CheckSmallIcon /> : null}
            </TouchableOpacity>

            {validOptions.map((item) => {
              const active = item.warehouseId === selectedId;
              return (
                <TouchableOpacity
                  key={item.warehouseId}
                  style={[styles.dropdownModalItem, active && styles.dropdownModalItemActive]}
                  onPress={() => {
                    onSelect(item.warehouseId);
                    setShowModal(false);
                  }}
                >
                  <Text style={[styles.dropdownModalItemText, active && styles.dropdownModalItemTextActive]}>
                    {item.warehouseName ?? item.warehouseId}
                  </Text>
                  {active ? <CheckSmallIcon /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dropdownBtn: {
    alignSelf: 'flex-start',
    backgroundColor: adminColors.brandDeep,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  dropdownBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: adminSpacing.xl,
  },
  dropdownModalCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.lg,
    ...adminShadow.md,
  },
  dropdownModalTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  dropdownModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.sm,
    borderRadius: adminRadius.sm,
  },
  dropdownModalItemActive: {
    backgroundColor: adminColors.brandTint,
  },
  dropdownModalItemText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownModalItemTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
});
