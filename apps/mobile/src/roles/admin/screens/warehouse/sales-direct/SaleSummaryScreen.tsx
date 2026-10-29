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
import Svg, { Path } from 'react-native-svg';
import type { SaleProduct, WarehouseScope, WarehouseScreenBaseProps } from './types';
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

function UserIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleIcon({ size = 18, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 4L12 14.01l-3-3"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface CartItem {
  id: string;
  name: string;
  grade: string;
  quantityKg: number;
  pricePerKg: number;
}

/** Cart lines from the products picked on Select Products (Main's Sale Summary slice, M6-S04). */
function cartFromProducts(products: readonly SaleProduct[] | undefined): CartItem[] {
  if (!products || products.length === 0) return [];
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    grade: p.grade,
    quantityKg: p.selectedQty ?? 1,
    pricePerKg: p.pricePerKg,
  }));
}

// Design id: M6-S04
export interface SaleSummaryScreenProps extends WarehouseScreenBaseProps {
  /** Products picked on Select Products; a sample cart when absent. */
  items?: readonly SaleProduct[] | undefined;
  /** Warehouse holding the stock for this sale */
  saleWarehouse?: WarehouseScope | undefined;
  /** Direct sales channel (defaults to 'Direct Sale') */
  channel?: string | undefined;
  /** Continue with the (possibly edited) cart total and line count. */
  onContinueToCustomer: (total: number, itemsCount: number) => void;
}

export function SaleSummaryScreen({
  items,
  saleWarehouse,
  channel = 'Direct Sale',
  scope,
  onBack,
  onContinueToCustomer,
}: SaleSummaryScreenProps) {
  const [cartItems] = useState<CartItem[]>(() => cartFromProducts(items));

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.quantityKg * item.pricePerKg,
    0
  );
  const discount = 0;
  const gst = 0;
  const total = subtotal - discount + gst;

  // Warehouse name resolution
  const warehouseDisplayName =
    saleWarehouse?.warehouseName?.replace(/ Warehouse$/, '') ??
    scope.warehouseName?.replace(/ Warehouse$/, '') ??
    '—';

  const handleContinue = () => {
    if (cartItems.length === 0) return;
    onContinueToCustomer(total, cartItems.length);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner ─── */}
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
          <Text style={styles.headerTitle}>Sale Summary</Text>
        </View>
      </View>

      {/* ─── Main Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Sale Items ─── */}
        <Text style={styles.sectionHeading}>Sale Items</Text>
        <View style={styles.card}>
          {cartItems.map((item, idx) => {
            const itemTotal = item.quantityKg * item.pricePerKg;
            return (
              <View key={item.id}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.itemRow}>
                  <Text style={styles.itemName}>
                    {item.name} - {item.quantityKg} KG
                  </Text>
                  <Text style={styles.itemPrice}>₹{itemTotal}</Text>
                </View>
              </View>
            );
          })}

          {cartItems.length === 0 && (
            <View style={{ paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: adminColors.muted, ...adminType.body }}>
                No items in cart
              </Text>
            </View>
          )}
        </View>

        {/* ─── 2. Pricing ─── */}
        <Text style={styles.sectionHeading}>Pricing</Text>
        <View style={styles.card}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subtotal</Text>
            <Text style={styles.breakdownValue}>₹{subtotal}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Discount</Text>
            <Text style={styles.breakdownValue}>₹{discount}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>GST</Text>
            <Text style={styles.breakdownValue}>₹{gst}</Text>
          </View>

          <View style={styles.divider} />

          <View style={[styles.breakdownRow, { paddingTop: 6, paddingBottom: 2 }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
        </View>

        {/* ─── 3. Stock Validation ─── */}
        <Text style={styles.sectionHeading}>Stock Validation</Text>
        <View style={[styles.card, styles.stockValidationCard]}>
          <CheckCircleIcon size={20} color={adminColors.success.text} />
          <Text style={styles.stockValidationText}>All products available</Text>
        </View>

        {/* ─── 4. Sale Information ─── */}
        <Text style={styles.sectionHeading}>Sale Information</Text>
        <View style={styles.card}>
          <View style={styles.saleInfoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.saleInfoLabel}>Warehouse</Text>
              <Text style={styles.saleInfoValue}>{warehouseDisplayName}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.saleInfoLabel}>Channel</Text>
              <Text style={styles.saleInfoValue}>{channel}</Text>
            </View>
          </View>
        </View>

        {/* ─── Bottom Action Button ─── */}
        <TouchableOpacity
          style={[styles.continueBtn, cartItems.length === 0 && { opacity: 0.5 }]}
          onPress={handleContinue}
          disabled={cartItems.length === 0}
          activeOpacity={0.85}
        >
          <UserIcon size={20} color={adminColors.onBrand} />
          <Text style={styles.continueBtnText}>Continue to Customer</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
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
    paddingTop: 14,
    paddingBottom: 24,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 14,
    marginBottom: 8,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemName: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: 2,
  },
  itemSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
  },
  itemRightCol: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: 4,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandTint,
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 6,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: -1,
  },
  stepperValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    minWidth: 16,
    textAlign: 'center',
  },
  removeText: {
    ...adminType.sectionHead,
    color: adminColors.danger.text,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 12,
  },
  thickDivider: {
    height: 1.5,
    backgroundColor: adminColors.ink,
    marginVertical: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  breakdownLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  breakdownValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  totalLabel: {
    ...adminType.title,
    color: adminColors.ink,
  },
  totalValue: {
    ...adminType.title,
    color: adminColors.ink,
  },
  marketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  marketLabel: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 4,
  },
  marketValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    lineHeight: 19,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.info.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginTop: 14,
    marginBottom: 12,
  },
  infoBannerText: {
    flex: 1,
    ...adminType.body,
    color: adminColors.info.text,
    lineHeight: 17,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: adminColors.canvas,
  },
  stockValidationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  stockValidationText: {
    ...adminType.title,
    color: adminColors.success.text,
  },
  saleInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saleInfoLabel: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 4,
  },
  saleInfoValue: {
    ...adminType.title,
    color: adminColors.ink,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 18,
  },
  continueBtnText: {
    color: adminColors.onBrand,
    ...adminType.title,
  },
});
