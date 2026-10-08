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

// ─── Design Tokens (TOHFA Admin App Design System) ───────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#7A2E14',
  primaryLight:  '#FDF3F0',
  primarySoft:   '#FDF3F0',
  primaryBorder: '#EEDCD3',

  pageBg:        '#F3EFE9',
  cardBg:        '#FFFFFF',
  textInk:       '#1A1A1A',
  textSecondary: '#5F5E5A',
  textMuted:     '#5F5E5A',
  border:        '#EEDCD3',
  divider:       '#EEDCD3',

  infoBg:        '#E6F1FB',
  infoBorder:    '#EEDCD3',
  infoText:      '#0C447C',

  amberPillBg:   '#FEF3E2',
  amberPillText: '#854F0B',
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

function LockIcon({ size = 12, color = PALETTE.amberPillText }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 16, color = '#0284C7' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EmptyCartIcon({ size = 56, color = '#D1CBC4' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="21" r="1.5" stroke={color} strokeWidth="1.6" />
      <Circle cx="19" cy="21" r="1.5" stroke={color} strokeWidth="1.6" />
      <Path d="M2.5 3h3.2l2.4 12.2a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6l1.8-8.2H6.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlusIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

import { SubWarehouseSelectProductsScreen } from './SubWarehouseSelectProductsScreen';
import { SubWarehouseSelectCustomerScreen } from './SubWarehouseSelectCustomerScreen';

export interface SubWarehouseNewSaleScreenProps {
  initialCustomerName?: string | undefined;
  onBack?: (() => void) | undefined;
  onSelectProducts?: (() => void) | undefined;
}

export function SubWarehouseNewSaleScreen({
  initialCustomerName,
  onBack,
  onSelectProducts,
}: SubWarehouseNewSaleScreenProps) {
  const [salesChannel, setSalesChannel] = useState<'Direct' | 'LiveMarket'>('Direct');
  const [selectedCustomer, setSelectedCustomer] = useState<string>(
    initialCustomerName || 'Select Customer / Walk-in'
  );
  const [showSelectProducts, setShowSelectProducts] = useState(false);
  const [showSelectCustomer, setShowSelectCustomer] = useState(false);

  const handleSelectCustomer = () => {
    setShowSelectCustomer(true);
  };

  const handleSelectProductsPress = () => {
    if (onSelectProducts) {
      onSelectProducts();
    } else {
      setShowSelectProducts(true);
    }
  };

  if (showSelectCustomer) {
    return (
      <SubWarehouseSelectCustomerScreen
        onBack={() => setShowSelectCustomer(false)}
        onContinueToPayment={(cust) => {
          setSelectedCustomer(`${cust.name} (${cust.code})`);
          setShowSelectCustomer(false);
        }}
      />
    );
  }

  if (showSelectProducts) {
    return (
      <SubWarehouseSelectProductsScreen
        onBack={() => setShowSelectProducts(false)}
        onContinue={() => {
          setShowSelectProducts(false);
          Alert.alert('Success', 'Products added to sale order.');
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
        <View style={styles.warehousePill}>
          <LockIcon size={12} color={PALETTE.amberPillText} />
          <Text style={styles.warehousePillText}>Coonoor Warehouse</Text>
        </View>

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
          onPress={handleSelectCustomer}
          activeOpacity={0.75}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.customerSubLabel}>CUSTOMER</Text>
            <Text style={styles.customerValueText}>{selectedCustomer}</Text>
          </View>
          <ChevronDownIcon size={20} color={PALETTE.textSecondary} />
        </TouchableOpacity>

        {/* ─── 4. Products Empty State ─── */}
        <Text style={styles.sectionHeading}>Products</Text>
        <View style={styles.emptyProductsContainer}>
          <EmptyCartIcon size={52} color="#D8D2CA" />
          <Text style={styles.emptyProductsText}>No products added</Text>
        </View>
      </ScrollView>

      {/* ─── Bottom Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.selectProductsBtn}
          onPress={handleSelectProductsPress}
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 14,
    marginBottom: 8,
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.amberPillBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  warehousePillText: {
    color: PALETTE.amberPillText,
    fontSize: 12,
    fontWeight: '600',
  },
  channelContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
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
    borderColor: '#D4CDC5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: PALETTE.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PALETTE.primary,
  },
  channelLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.infoBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.infoBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 6,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.infoText,
    lineHeight: 17,
  },
  customerSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 6,
  },
  customerSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  customerValueText: {
    fontSize: 15,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  emptyProductsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyProductsText: {
    fontSize: 14,
    fontWeight: '500',
    color: PALETTE.textMuted,
    marginTop: 12,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: PALETTE.pageBg,
  },
  selectProductsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  selectProductsBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
