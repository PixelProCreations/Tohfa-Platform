/**
 * Screen 41 — Bulk Price Update
 * Super Admin can apply a percentage change across selected crops
 * with checkboxes for selection.
 */
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
import { Icon } from '@tohfa/mobile-ui';

import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
  ADMIN_BUTTON_HEIGHT,
} from '../../theme';

interface CropItem {
  id: string;
  name: string;
  currentPrice: number;
  category: 'Vegetables' | 'Fruits' | 'Dairy' | 'Grains';
}

const CROPS: CropItem[] = [
  // Vegetables
  { id: '1', name: 'Carrots', currentPrice: 42, category: 'Vegetables' },
  { id: '2', name: 'Cabbage', currentPrice: 28, category: 'Vegetables' },
  { id: '3', name: 'Beetroot', currentPrice: 35, category: 'Vegetables' },
  { id: '4', name: 'Tomatoes', currentPrice: 30, category: 'Vegetables' },
  { id: '5', name: 'Onions', currentPrice: 25, category: 'Vegetables' },
  
  // Fruits
  { id: '6', name: 'Apples', currentPrice: 120, category: 'Fruits' },
  { id: '7', name: 'Bananas', currentPrice: 40, category: 'Fruits' },
  { id: '8', name: 'Mangoes', currentPrice: 80, category: 'Fruits' },
  { id: '9', name: 'Oranges', currentPrice: 60, category: 'Fruits' },
  
  // Dairy
  { id: '10', name: 'Milk', currentPrice: 55, category: 'Dairy' },
  { id: '11', name: 'Curd', currentPrice: 60, category: 'Dairy' },
  { id: '12', name: 'Butter', currentPrice: 450, category: 'Dairy' },
  { id: '13', name: 'Cheese', currentPrice: 400, category: 'Dairy' },
  
  // Grains
  { id: '14', name: 'Rice', currentPrice: 45, category: 'Grains' },
  { id: '15', name: 'Wheat', currentPrice: 30, category: 'Grains' },
  { id: '16', name: 'Millets', currentPrice: 50, category: 'Grains' },
  { id: '17', name: 'Corn', currentPrice: 35, category: 'Grains' },
];

interface BulkPriceUpdateScreenProps {
  onBack: () => void;
  onApply?: (selectedIds: string[], percentage: number) => void;
}

export function BulkPriceUpdateScreen({ onBack, onApply }: BulkPriceUpdateScreenProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(['1', '2']);
  const [percentage, setPercentage] = useState(5);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const increment = () => setPercentage((p) => p + 1);
  const decrement = () => setPercentage((p) => Math.max(1, p - 1));

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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <Text style={styles.title}>Bulk Price Update</Text>
        <Text style={styles.subtitle}>
          Apply a percentage change across selected crops · SA only
        </Text>

        {/* Crop List */}
        <View style={styles.cropList}>
          {/* Vegetables */}
          <Text style={styles.categoryHeader}>Vegetables</Text>
          {CROPS.filter((c) => c.category === 'Vegetables').map((crop) => {
            const isSelected = selectedIds.includes(crop.id);
            return (
              <TouchableOpacity
                key={crop.id}
                style={styles.cropCard}
                onPress={() => toggleSelection(crop.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  {isSelected && <Icon name="check" size={16} color={adminColors.onBrand} />}
                </View>
                <View style={styles.cropInfo}>
                  <Text style={styles.cropName}>{crop.name}</Text>
                  <Text style={styles.cropPrice}>Current: ₹{crop.currentPrice}/kg</Text>
                </View>
                <View style={styles.percentBadge}>
                  <Text style={styles.percentBadgeText}>+{percentage}%</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Fruits */}
          <Text style={[styles.categoryHeader, { marginTop: 16 }]}>Fruits</Text>
          {CROPS.filter((c) => c.category === 'Fruits').map((crop) => {
            const isSelected = selectedIds.includes(crop.id);
            return (
              <TouchableOpacity
                key={crop.id}
                style={styles.cropCard}
                onPress={() => toggleSelection(crop.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  {isSelected && <Icon name="check" size={16} color={adminColors.onBrand} />}
                </View>
                <View style={styles.cropInfo}>
                  <Text style={styles.cropName}>{crop.name}</Text>
                  <Text style={styles.cropPrice}>Current: ₹{crop.currentPrice}/kg</Text>
                </View>
                <View style={styles.percentBadge}>
                  <Text style={styles.percentBadgeText}>+{percentage}%</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Dairy */}
          <Text style={[styles.categoryHeader, { marginTop: 16 }]}>Dairy</Text>
          {CROPS.filter((c) => c.category === 'Dairy').map((crop) => {
            const isSelected = selectedIds.includes(crop.id);
            return (
              <TouchableOpacity
                key={crop.id}
                style={styles.cropCard}
                onPress={() => toggleSelection(crop.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  {isSelected && <Icon name="check" size={16} color={adminColors.onBrand} />}
                </View>
                <View style={styles.cropInfo}>
                  <Text style={styles.cropName}>{crop.name}</Text>
                  <Text style={styles.cropPrice}>Current: ₹{crop.currentPrice}/kg</Text>
                </View>
                <View style={styles.percentBadge}>
                  <Text style={styles.percentBadgeText}>+{percentage}%</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Grains */}
          <Text style={[styles.categoryHeader, { marginTop: 16 }]}>Grains</Text>
          {CROPS.filter((c) => c.category === 'Grains').map((crop) => {
            const isSelected = selectedIds.includes(crop.id);
            return (
              <TouchableOpacity
                key={crop.id}
                style={styles.cropCard}
                onPress={() => toggleSelection(crop.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  {isSelected && <Icon name="check" size={16} color={adminColors.onBrand} />}
                </View>
                <View style={styles.cropInfo}>
                  <Text style={styles.cropName}>{crop.name}</Text>
                  <Text style={styles.cropPrice}>Current: ₹{crop.currentPrice}/kg</Text>
                </View>
                <View style={styles.percentBadge}>
                  <Text style={styles.percentBadgeText}>+{percentage}%</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Percentage Control */}
        <Text style={styles.sectionLabel}>Apply percentage change to selected</Text>
        <View style={styles.percentCard}>
          <TouchableOpacity style={styles.circleBtn} onPress={decrement} activeOpacity={0.7}>
            <Text style={styles.btnSymbol}>−</Text>
          </TouchableOpacity>

          <Text style={styles.percentDisplay}>+{percentage}%</Text>

          <TouchableOpacity style={styles.circleBtn} onPress={increment} activeOpacity={0.7}>
            <Text style={styles.btnSymbol}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Apply Button */}
        <TouchableOpacity
          style={[styles.applyBtn, selectedIds.length === 0 && styles.applyBtnDisabled]}
          onPress={() => (onApply ? onApply(selectedIds, percentage) : onBack())}
          disabled={selectedIds.length === 0}
          activeOpacity={0.8}
        >
          <Icon name="check_circle" size={18} color={adminColors.onBrand} style={{ marginRight: 8 }} />
          <Text style={styles.applyBtnText}>Apply to Selected</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
  },
  title: {
    ...adminType.title,
    color: adminColors.brandDeep,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.lg,
    lineHeight: 18,
  },
  cropList: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.xl,
  },
  categoryHeader: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 8,
    marginTop: 0,
  },
  cropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: adminRadius.xs,
    borderWidth: 2,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 3,
  },
  cropPrice: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  percentBadge: {
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: adminRadius.xs,
  },
  percentBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brand,
  },
  sectionLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  percentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    paddingVertical: 20,
    paddingHorizontal: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
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
  percentDisplay: {
    fontSize: 36,
    fontWeight: '800',
    color: adminColors.brandDeep,
    lineHeight: 40,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
  },
  applyBtnDisabled: {
    backgroundColor: adminColors.muted,
    opacity: 0.5,
  },
  applyBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
});
