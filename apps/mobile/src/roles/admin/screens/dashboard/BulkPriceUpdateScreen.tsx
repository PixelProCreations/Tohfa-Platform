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

const P = {
  pageBg: '#FAF8F5',
  cardBg: '#FFFFFF',
  orange: '#E8562A',
  orangeBg: '#FFECE8',
  orangeText: '#E8562A',
  ink: '#5D2510',
  darkBrown: '#5D2510',
  body: '#6B6560',
  muted: '#9A8F88',
  lightGray: '#B0A9A3',
  border: '#EDE9E4',
};

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
  onApply: (selectedIds: string[], percentage: number) => void;
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
                  {isSelected && <Icon name="check" size={16} color="#FFFFFF" />}
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
                  {isSelected && <Icon name="check" size={16} color="#FFFFFF" />}
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
                  {isSelected && <Icon name="check" size={16} color="#FFFFFF" />}
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
                  {isSelected && <Icon name="check" size={16} color="#FFFFFF" />}
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
          onPress={() => onApply(selectedIds, percentage)}
          disabled={selectedIds.length === 0}
          activeOpacity={0.8}
        >
          <Icon name="check_circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: P.darkBrown,
    marginBottom: 6,
    letterSpacing: -0.3,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  subtitle: {
    fontSize: 13,
    color: P.lightGray,
    marginBottom: 20,
    lineHeight: 18,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  cropList: {
    gap: 12,
    marginBottom: 24,
  },
  categoryHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: P.darkBrown,
    marginBottom: 8,
    marginTop: 0,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  cropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: P.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: P.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: P.orange,
    borderColor: P.orange,
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 3,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  cropPrice: {
    fontSize: 12,
    color: P.lightGray,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  percentBadge: {
    backgroundColor: '#FFEBE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  percentBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: P.orangeText,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: P.darkBrown,
    marginBottom: 16,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  percentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    backgroundColor: P.cardBg,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: P.border,
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
  percentDisplay: {
    fontSize: 36,
    fontWeight: '700',
    color: P.darkBrown,
    lineHeight: 40,
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: P.orange,
    borderRadius: 10,
    paddingVertical: 14,
  },
  applyBtnDisabled: {
    backgroundColor: P.muted,
    opacity: 0.5,
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Manrope, system-ui, sans-serif',
  },
});
