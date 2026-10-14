/**
 * Screen 40 — Set/Update Fair Price
 * Super Admin can update the ceiling price for a single produce item
 * with increment/decrement controls.
 */
import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@tohfa/mobile-ui';

const P = {
  pageBg: '#FAF8F5',
  cardBg: '#FFFFFF',
  orange: '#E8562A',
  orangeBg: '#FFECE8',
  ink: '#5D2510',
  darkBrown: '#5D2510',
  body: '#6B6560',
  muted: '#9A8F88',
  lightGray: '#B0A9A3',
  border: '#EDE9E4',
};

interface UpdateFairPriceScreenProps {
  onBack: () => void;
  onSave: (newPrice: number) => void;
  itemName?: string;
  category?: string;
  currentPrice?: number;
}

export function UpdateFairPriceScreen({
  onBack,
  onSave,
  itemName = 'Carrots',
  category = 'Vegetables',
  currentPrice = 42,
}: UpdateFairPriceScreenProps) {
  const [price, setPrice] = useState(currentPrice);

  const increment = () => setPrice((p) => p + 1);
  const decrement = () => setPrice((p) => Math.max(1, p - 1));

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={P.pageBg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="chevron_right" size={20} color={P.ink} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Update Fair Price</Text>
        <Text style={styles.subtitle}>
          {itemName} · {category} · SA only
        </Text>

        {/* Price Card */}
        <View style={styles.priceCard}>
          <Text style={styles.label}>New ceiling price (per kg)</Text>

          <View style={styles.priceRow}>
            <TouchableOpacity style={styles.circleBtn} onPress={decrement} activeOpacity={0.7}>
              <Text style={styles.btnSymbol}>−</Text>
            </TouchableOpacity>

            <View style={styles.priceDisplay}>
              <Text style={styles.priceAmount}>₹{price}</Text>
              <Text style={styles.currentText}>current: ₹{currentPrice}/kg</Text>
            </View>

            <TouchableOpacity style={styles.circleBtn} onPress={increment} activeOpacity={0.7}>
              <Text style={styles.btnSymbol}>+</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => onSave(price)}
            activeOpacity={0.8}
          >
            <Icon name="check_circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnText}>Save New Ceiling</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.pageBg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: P.darkBrown,
    marginBottom: 4,
    letterSpacing: -0.3,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  subtitle: {
    fontSize: 13,
    color: P.lightGray,
    marginBottom: 20,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  priceCard: {
    backgroundColor: P.cardBg,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: P.border,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: P.darkBrown,
    marginBottom: 16,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: P.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: P.border,
  },
  btnSymbol: {
    fontSize: 20,
    fontWeight: '400',
    color: P.darkBrown,
    lineHeight: 24,
  },
  priceDisplay: {
    alignItems: 'center',
    minWidth: 120,
  },
  priceAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: P.darkBrown,
    marginBottom: 2,
    lineHeight: 44,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  currentText: {
    fontSize: 12,
    color: P.lightGray,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.orange,
    borderRadius: 10,
    paddingVertical: 14,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
});
