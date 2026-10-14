import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { adminColors, adminType } from '../../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ size = 12, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EmptyCartIcon({ size = 56, color = adminColors.border }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="21" r="1.5" stroke={color} strokeWidth="1.6" />
      <Circle cx="19" cy="21" r="1.5" stroke={color} strokeWidth="1.6" />
      <Path d="M2.5 3h3.2l2.4 12.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6l1.8-8.2H6.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlusIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

import { WarehouseChips } from './SalesParts';
import type { SaleProduct, WarehouseScreenBaseProps } from './types';

// Design id: M6-S02
// No direct/walk-in sale code exists in docs/rbac.json (SPEC_GAPS "Sales
// Direct" #110): ungated, and a Sub admin is locked to its own warehouse.
export interface NewSaleScreenProps extends WarehouseScreenBaseProps {
  /** Customer already chosen (from Select Customer or the caller), shown on the card. */
  customerLabel?: string | undefined;
  /** Main only: the warehouse the sale is made from (Main's warehouse selector, M6-S02). */
  saleWarehouseId?: string | undefined;
  onSelectWarehouse?: ((warehouseId: string | undefined) => void) | undefined;
  /** Products already picked (Main's "Current Cart", M6-S02). */
  cartItems?: readonly SaleProduct[] | undefined;
  onSelectCustomer: () => void;
  onSelectProducts: () => void;
}

export function NewSaleScreen({
  scope,
  customerLabel,
  saleWarehouseId,
  onSelectWarehouse,
  cartItems = [],
  onBack,
  onSelectCustomer,
  onSelectProducts,
}: NewSaleScreenProps) {
  const [salesChannel, setSalesChannel] = useState<'Direct' | 'LiveMarket'>('Direct');
  const selectedCustomer = customerLabel || 'Select Customer / Walk-in';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner (#F0562A) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Sale</Text>
        </View>
      </View>

      {/* ─── Main Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Warehouse ─── */}
        <Text style={styles.sectionHeading}>Warehouse</Text>
        {scope.warehouseId !== undefined ? (
          <View style={styles.warehousePill}>
            <LockIcon size={12} color={adminColors.warning.text} />
            <Text style={styles.warehousePillText}>{scope.warehouseName}</Text>
          </View>
        ) : (
          <WarehouseChips
            scope={scope}
            selected={saleWarehouseId}
            onSelect={(id) => onSelectWarehouse?.(id)}
            allowAll={false}
          />
        )}

        {/* ─── 2. Sales Channel ─── */}
        <Text style={styles.sectionHeading}>Sales Channel</Text>

        <View style={styles.channelContainer}>
          {/* Direct Customer Option */}
          <TouchableOpacity
            style={styles.channelRow}
            onPress={() => setSalesChannel('Direct')}
            activeOpacity={0.8}
          >
            <View style={[styles.radioOuter, salesChannel === 'Direct' && styles.radioOuterSelected]}>
              {salesChannel === 'Direct' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.channelLabel}>Direct Customer</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Live Market Option */}
          <TouchableOpacity
            style={styles.channelRow}
            onPress={() => setSalesChannel('LiveMarket')}
            activeOpacity={0.8}
          >
            <View style={[styles.radioOuter, salesChannel === 'LiveMarket' && styles.radioOuterSelected]}>
              {salesChannel === 'LiveMarket' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.channelLabel}>Live Market</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 3. Customer ─── */}
        <Text style={styles.sectionHeading}>Customer</Text>
        <TouchableOpacity
          style={styles.customerSelectCard}
          onPress={onSelectCustomer}
          activeOpacity={0.75}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.customerSubLabel}>CUSTOMER</Text>
            <Text style={styles.customerValueText}>{selectedCustomer}</Text>
          </View>
          <ChevronDownIcon size={20} color={adminColors.muted} />
        </TouchableOpacity>

        {/* ─── 4. Products Empty State ─── */}
        <Text style={styles.sectionHeading}>Products</Text>
        {cartItems.length === 0 ? (
          <View style={styles.emptyProductsContainer}>
            <EmptyCartIcon size={52} color={adminColors.border} />
            <Text style={styles.emptyProductsText}>No products added</Text>
          </View>
        ) : (
          <View style={styles.channelContainer}>
            {cartItems.map((item, idx) => (
              <View key={item.id}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.channelRow}>
                  <Text style={[styles.channelLabel, { flex: 1 }]}>
                    {item.name} - {item.selectedQty ?? 1} KG
                  </Text>
                  <Text style={styles.channelLabel}>₹{item.pricePerKg * (item.selectedQty ?? 1)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ─── Bottom Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.selectProductsBtn}
          onPress={onSelectProducts}
          activeOpacity={0.85}
        >
          <PlusIcon size={18} />
          <Text style={styles.selectProductsBtnText}>Select Products</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: 0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 14,
    marginBottom: 8,
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  warehousePillText: {
    color: adminColors.warning.text,
    ...adminType.rowTitle,
  },
  channelContainer: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: adminColors.brand,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: adminColors.brand,
  },
  channelLabel: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.info.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 6,
  },
  infoBannerText: {
    flex: 1,
    ...adminType.body,
    color: adminColors.info.text,
    lineHeight: 17,
  },
  customerSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 6,
  },
  customerSubLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  customerValueText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  emptyProductsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyProductsText: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 12,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: adminColors.canvas,
  },
  selectProductsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  selectProductsBtnText: {
    color: adminColors.onBrand,
    ...adminType.title,
  },
});
