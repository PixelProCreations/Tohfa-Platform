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

// ─── Design Tokens (#F0562A Unified Subwarehouse Palette) ────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EBE5DC',
  divider:       '#F0EAE1',

  infoBg:        '#EBF5FF',
  infoBorder:    '#BAE6FD',
  infoText:      '#0369A1',

  stepperBg:     '#F7EFE9',
  stepperBtnBg:  '#F0E3D8',
  redText:       '#DC2626',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function ShieldCheckIcon({ size = 16, color = '#0284C7' }: { size?: number; color?: string }) {
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

function ArrowRightIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

import { SubWarehouseSelectCustomerScreen } from './SubWarehouseSelectCustomerScreen';

export interface SubWarehouseSaleSummaryScreenProps {
  onBack?: (() => void) | undefined;
  onContinueToCustomer?: (() => void) | undefined;
}

export function SubWarehouseSaleSummaryScreen({
  onBack,
  onContinueToCustomer,
}: SubWarehouseSaleSummaryScreenProps) {
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

  const handleSimulateStockChange = () => {
    Alert.alert(
      'Stock Verified',
      'Simulated backend check: Tomato batch GR-1024 has 48 KG available. Price verified at ₹100/KG.'
    );
  };

  const handleContinue = () => {
    if (onContinueToCustomer) {
      onContinueToCustomer();
    } else {
      setShowCustomerSelection(true);
    }
  };

  if (showCustomerSelection) {
    return (
      <SubWarehouseSelectCustomerScreen
        onBack={() => setShowCustomerSelection(false)}
        onContinueToPayment={() => {
          Alert.alert('Payment', 'Proceeding to payment terminal.');
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

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
        {/* ─── 1. Sale Items ─── */}
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
              <Text style={{ color: PALETTE.textMuted, fontSize: 14 }}>
                No items in cart
              </Text>
            </View>
          )}
        </View>

        {/* ─── 2. Price Breakdown ─── */}
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

        {/* ─── 3. Customer ─── */}
        <Text style={styles.sectionHeading}>Customer</Text>
        <View style={styles.card}>
          <Text style={styles.customerName}>Rajesh Kumar</Text>
          <Text style={styles.customerCode}>CUS-00291</Text>
        </View>

        {/* ─── 4. Sale Channel ─── */}
        <Text style={styles.sectionHeading}>Sale Channel</Text>
        <View style={styles.card}>
          <Text style={styles.channelText}>Direct Customer</Text>
        </View>

        {/* ─── Informational Banner ─── */}
        <View style={styles.infoBanner}>
          <ShieldCheckIcon size={18} color={PALETTE.infoText} />
          <Text style={styles.infoBannerText}>
            Before continuing, the backend re-confirms product existence, active status, available quantity, current price, and warehouse scope.
          </Text>
        </View>

        {/* ─── Simulate Stock Demo Button ─── */}
        <TouchableOpacity
          style={styles.simulateBtn}
          onPress={handleSimulateStockChange}
          activeOpacity={0.75}
        >
          <Text style={styles.simulateBtnText}>Simulate stock change (demo)</Text>
        </TouchableOpacity>

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
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
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
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 14,
    marginBottom: 8,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
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
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  itemRightCol: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 4,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.stepperBg,
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 6,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PALETTE.stepperBtnBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: -1,
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
    minWidth: 16,
    textAlign: 'center',
  },
  removeText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.redText,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 12,
  },
  thickDivider: {
    height: 1.5,
    backgroundColor: '#1E1612',
    marginVertical: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginBottom: 3,
  },
  customerCode: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  channelText: {
    fontSize: 15,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.infoBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.infoBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginTop: 14,
    marginBottom: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.infoText,
    lineHeight: 17,
  },
  simulateBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  simulateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B420F',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: PALETTE.pageBg,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
