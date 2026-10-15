/**
 * All-warehouses dropdown selector for the Main Warehouse view.
 *
 * Rendered when `scope.warehouseId` is undefined (Main Warehouse role).
 * Shows a white pill button with orange building icon, dark warehouse title,
 * and rotating chevron arrow. Tapping opens an anchored dropdown list
 * in the same screen without opening a popup new screen.
 */
import React, { useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import type { WarehouseScope } from './types';

function BuildingWarehouseIcon({ color = adminColors.onBrand }: { color?: string | undefined }) {
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

function ChevronDownSmallIcon({ color = adminColors.onBrand, rotated = false }: { color?: string | undefined; rotated?: boolean | undefined }) {
  return (
    <View style={rotated ? { transform: [{ rotate: '180deg' }] } : undefined}>
      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
        <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

function CheckSmallIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={adminColors.brand} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const DEFAULT_WAREHOUSES: readonly WarehouseScope[] = [
  { warehouseId: 'WH-OOTY', warehouseName: 'Ooty' },
  { warehouseId: 'WH-COON', warehouseName: 'Coonoor' },
  { warehouseId: 'WH-KOTA', warehouseName: 'Kotagiri' },
  { warehouseId: 'WH-GUDA', warehouseName: 'Gudalur Market' },
];

export interface WarehouseSelectorProps {
  scope: WarehouseScope;
  options?: readonly WarehouseScope[] | undefined;
  /** Selected warehouseId; undefined = all warehouses. */
  selectedId: string | undefined;
  onSelect: (warehouseId: string | undefined) => void;
  allowAll?: boolean | undefined;
}

export function WarehouseSelector({ scope, options = [], selectedId, onSelect, allowAll = true }: WarehouseSelectorProps) {
  if (scope.warehouseId !== undefined) return null;

  const [showModal, setShowModal] = useState(false);
  const dropdownBtnRef = useRef<TouchableOpacity>(null);
  const [dropdownLayout, setDropdownLayout] = useState<{ top: number; left: number; width: number } | null>(null);

  const warehouseList =
    options.length > 0 && options.some((o) => o.warehouseId !== undefined)
      ? options.filter((o) => o.warehouseId !== undefined)
      : DEFAULT_WAREHOUSES;

  const selectedName =
    selectedId === undefined
      ? (allowAll ? 'All Warehouses' : (warehouseList[0]?.warehouseName ?? 'Select Warehouse'))
      : (warehouseList.find((w) => w.warehouseId === selectedId)?.warehouseName ?? selectedId);

  const handleToggle = () => {
    if (showModal) {
      setShowModal(false);
      return;
    }
    if (dropdownBtnRef.current) {
      dropdownBtnRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (x !== undefined && y !== undefined && height !== undefined) {
          setDropdownLayout({ top: y + height + 6, left: x, width: Math.max(width, 210) });
        }
        setShowModal(true);
      });
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <TouchableOpacity
        ref={dropdownBtnRef}
        style={styles.dropdownBtn}
        activeOpacity={0.85}
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityLabel={`Selected warehouse: ${selectedName}. Tap to change.`}
      >
        <BuildingWarehouseIcon color={adminColors.onBrand} />
        <Text style={styles.dropdownBtnText}>{selectedName}</Text>
        <ChevronDownSmallIcon color={adminColors.onBrand} rotated={showModal} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.dropdownBackdrop}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View
            style={[
              styles.dropdownMenu,
              dropdownLayout ? { top: dropdownLayout.top, left: dropdownLayout.left, minWidth: dropdownLayout.width } : null,
            ]}
          >
            {allowAll ? (
              <>
                <TouchableOpacity
                  style={[styles.dropdownItem, selectedId === undefined && styles.dropdownItemActive]}
                  onPress={() => {
                    onSelect(undefined);
                    setShowModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedId === undefined && styles.dropdownItemTextActive,
                    ]}
                  >
                    All Warehouses
                  </Text>
                  {selectedId === undefined ? <CheckSmallIcon /> : null}
                </TouchableOpacity>

                <View style={styles.dropdownDivider} />
              </>
            ) : null}

            {warehouseList.map((w, index) => {
              const isSelected = selectedId === w.warehouseId;
              const isLast = index === warehouseList.length - 1;
              return (
                <React.Fragment key={w.warehouseId ?? index}>
                  <TouchableOpacity
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                    onPress={() => {
                      onSelect(w.warehouseId);
                      setShowModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        isSelected && styles.dropdownItemTextActive,
                      ]}
                    >
                      {w.warehouseName ?? w.warehouseId}
                    </Text>
                    {isSelected ? <CheckSmallIcon /> : null}
                  </TouchableOpacity>
                  {!isLast && <View style={styles.dropdownDivider} />}
                </React.Fragment>
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
    backgroundColor: 'transparent',
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 5.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 6,
    borderWidth: 1,
    borderColor: adminColors.onBrand,
  },
  dropdownBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 96,
    left: adminSpacing.lg,
    minWidth: 210,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 6,
    paddingHorizontal: 4,
    ...adminShadow.md,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: adminRadius.md,
  },
  dropdownItemActive: {
    backgroundColor: adminColors.brandTint,
  },
  dropdownItemText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginHorizontal: 8,
    marginVertical: 2,
  },
});
