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

import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
  ADMIN_BUTTON_HEIGHT,
} from '../../theme';

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
      <StatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="chevron_right" size={20} color={adminColors.ink} style={{ transform: [{ rotate: '180deg' }] }} />
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
            <Icon name="check_circle" size={18} color={adminColors.onBrand} style={{ marginRight: 8 }} />
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
    backgroundColor: adminColors.canvas,
  },
  header: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  content: {
    paddingHorizontal: adminSpacing.lg,
  },
  title: {
    ...adminType.title,
    color: adminColors.brandDeep,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.lg,
  },
  priceCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  label: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: adminSpacing.lg,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.xs,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  btnSymbol: {
    fontSize: 20,
    fontWeight: '400',
    color: adminColors.ink,
    lineHeight: 24,
  },
  priceDisplay: {
    alignItems: 'center',
    minWidth: 120,
  },
  priceAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 2,
    lineHeight: 44,
  },
  currentText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
  },
  saveBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
});
