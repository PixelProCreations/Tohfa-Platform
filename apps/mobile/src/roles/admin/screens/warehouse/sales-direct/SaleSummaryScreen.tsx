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
import { adminColors, adminType, adminShadow } from '../../../theme';

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

function ArrowRightIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="2.4"
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

const SAMPLE_CART: CartItem[] = [
  {
    id: 'prod-1',
    name: 'Tomato',
    grade: 'Grade 1',
    quantityKg: 2,
    pricePerKg: 100,
  },
  {
    id: 'prod-2',
    name: 'Carrot',
    grade: 'Grade 1',
    quantityKg: 1,
    pricePerKg: 120,
  },
];

function cartFromProducts(products: readonly SaleProduct[] | undefined): CartItem[] {
  if (!products || products.length === 0) return SAMPLE_CART;
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    grade: p.grade,
    quantityKg: p.selectedQty ?? 1,
    pricePerKg: p.pricePerKg,
  }));
}

export interface SaleSummaryScreenProps extends WarehouseScreenBaseProps {
  items?: readonly SaleProduct[] | undefined;
  saleWarehouse?: WarehouseScope | undefined;
  channel?: string | undefined;
  customerName?: string | undefined;
  customerCode?: string | undefined;
  onContinueToCustomer: (total: number, itemsCount: number) => void;
}

export function SaleSummaryScreen({
  items,
  customerName = 'Rajesh Kumar',
  customerCode = 'CUS-00291',
  onBack,
  onContinueToCustomer,
}: SaleSummaryScreenProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => cartFromProducts(items));

  const handleIncrement = (id: string) => {
    setCartItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, quantityKg: it.quantityKg + 1 } : it)),
    );
  };

  const handleDecrement = (id: string) => {
    setCartItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, quantityKg: Math.max(1, it.quantityKg - 1) } : it)),
    );
  };

  const handleRemove = (id: string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== id));
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.quantityKg * item.pricePerKg,
    0,
  );
  const discount = 0;
  const gst = 0;
  const total = subtotal - discount + gst;

  const handleContinue = () => onContinueToCustomer(total || 320, cartItems.length || 2);

  const displayCustomer = customerCode ? `${customerName} · ${customerCode}` : customerName;

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
        {/* ─── 1. Sale Market (Customer) ─── */}
        <Text style={styles.sectionHeading}>Sale Market</Text>
        <View style={styles.card}>
          <Text style={styles.customerSubLabel}>Customer</Text>
          <Text style={styles.customerValueText}>{displayCustomer}</Text>
        </View>

        {/* ─── 2. Sale Items ─── */}
        <Text style={styles.sectionHeading}>Sale Items</Text>
        <View style={styles.card}>
          {cartItems.map((item, idx) => {
            const itemTotal = item.quantityKg * item.pricePerKg;
            const isFirst = idx === 0;

            return (
              <View key={item.id}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.itemBlock}>
                  <View style={styles.itemTopRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>₹{itemTotal}</Text>
                  </View>

                  <View style={styles.itemBottomRow}>
                    <Text style={styles.itemDetail}>
                      {item.grade} · {item.quantityKg} KG × ₹{item.pricePerKg}
                    </Text>

                    {isFirst ? (
                      <View style={styles.stepperWrap}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleDecrement(item.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperQtyText}>{item.quantityKg}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => handleIncrement(item.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleRemove(item.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.removeText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
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

        {/* ─── 3. Price Breakdown ─── */}
        <Text style={styles.sectionHeading}>Price Breakdown</Text>
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

          <View style={[styles.breakdownRow, { paddingTop: 10, paddingBottom: 2 }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ─── Bottom Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <ArrowRightIcon size={18} />
          <Text style={styles.continueBtnText}>Continue to Customer</Text>
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
    paddingTop: 12,
    paddingBottom: 16,
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
    paddingBottom: 20,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 14,
    marginBottom: 8,
    fontWeight: '700',
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  customerSubLabel: {
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 4,
  },
  customerValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  itemBlock: {
    paddingVertical: 4,
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: adminColors.ink,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDetail: {
    fontSize: 12.5,
    color: adminColors.muted,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandSoft.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 6,
  },
  stepperBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  stepperBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  stepperQtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
    minWidth: 14,
    textAlign: 'center',
  },
  removeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: adminColors.danger.text,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 13.5,
    color: adminColors.muted,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.ink,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: adminColors.ink,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: adminColors.ink,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: adminColors.canvas,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  continueBtnText: {
    color: adminColors.onBrand,
    ...adminType.title,
    fontSize: 16,
  },
});
