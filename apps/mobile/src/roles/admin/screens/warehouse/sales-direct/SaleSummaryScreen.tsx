import React, { useState } from 'react';
import {
  Alert,
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

function ShieldCheckIcon({ size = 16, color = adminColors.info.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

import { SelectCustomerScreen } from './SelectCustomerScreen';

export interface SaleSummaryScreenProps {
  onBack?: (() => void) | undefined;
  onContinueToCustomer?: (() => void) | undefined;
}

export function SaleSummaryScreen({
  onBack,
  onContinueToCustomer,
}: SaleSummaryScreenProps) {
  const [showCustomerSelection, setShowCustomerSelection] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 'tomato-1',
      name: 'Tomato',
      grade: 'Grade 1',
      quantityKg: 2,
      pricePerKg: 100,
    },
    {
      id: 'carrot-1',
      name: 'Carrot',
      grade: 'Grade 1',
      quantityKg: 1,
      pricePerKg: 120,
    },
  ]);

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantityKg + delta);
          return { ...item, quantityKg: newQty };
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.quantityKg * item.pricePerKg,
    0
  );
  const discount = 0;
  const gst = 0;
  const total = subtotal - discount + gst;

  const handleContinue = () => {
    if (onContinueToCustomer) {
      onContinueToCustomer();
    } else {
      setShowCustomerSelection(true);
    }
  };

  if (showCustomerSelection) {
    return (
      <SelectCustomerScreen
        onBack={() => setShowCustomerSelection(false)}
        onContinueToPayment={() => {
          Alert.alert('Payment', 'Proceeding to payment terminal.');
        }}
      />
    );
  }

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
          <Text style={styles.headerTitle}>Sale Summary</Text>
        </View>
      </View>

      {/* ─── Main Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Sale Market ─── */}
        <Text style={styles.sectionHeading}>Sale Market</Text>
        <View style={styles.card}>
          <View style={styles.marketRow}>
            <View style={{ flex: 1.3, paddingRight: 8 }}>
              <Text style={styles.marketLabel}>Company Name</Text>
              <Text style={styles.marketValue}>Nilgiri Fresh Traders Pvt Ltd</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.marketLabel}>PO Number</Text>
              <Text style={styles.marketValue}>PO-2026-0842</Text>
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={styles.marketLabel}>Credit Terms</Text>
            <Text style={styles.marketValue}>Net 15 days</Text>
          </View>
        </View>

        {/* ─── 2. Sale Items ─── */}
        <Text style={styles.sectionHeading}>Sale Items</Text>
        <View style={styles.card}>
          {cartItems.map((item, idx) => {
            const itemTotal = item.quantityKg * item.pricePerKg;
            const isTomato = item.id.includes('tomato');

            return (
              <View key={item.id}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.itemRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSubtitle}>
                      {item.grade} · {item.quantityKg} KG × ₹{item.pricePerKg}
                    </Text>
                  </View>

                  <View style={styles.itemRightCol}>
                    <Text style={styles.itemPrice}>₹{itemTotal}</Text>
                    {isTomato ? (
                      <View style={styles.stepperWrap}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(item.id, -1)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepperBtnText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.stepperValue}>{item.quantityKg}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateQuantity(item.id, 1)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.stepperBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => removeItem(item.id)}
                        activeOpacity={0.7}
                        style={{ marginTop: 4 }}
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
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
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

          <View style={styles.thickDivider} />

          <View style={[styles.breakdownRow, { paddingTop: 10, paddingBottom: 2 }]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
        </View>

        <View style={{ height: 16 }} />
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
  },
});
