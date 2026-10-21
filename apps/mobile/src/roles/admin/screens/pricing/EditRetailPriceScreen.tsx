import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import type { PricingRecordItem } from './MarketPricingOverviewScreen';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockIcon({ size = 14, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface EditRetailPriceScreenProps {
  onBack: () => void;
  record?: PricingRecordItem | null;
  onSaveSuccess?: (updatedRecord: PricingRecordItem) => void;
}

export function EditRetailPriceScreen({
  onBack,
  record,
  onSaveSuccess,
}: EditRetailPriceScreenProps) {
  const item: PricingRecordItem = record || {
    id: 'pr-1',
    product: 'Tomato',
    grade: 'Grade 1',
    category: 'Vegetables',
    badge: 'Compliant',
    ceiling: '₹60.00/kg',
    retailPrice: '₹55.00/kg',
    difference: 'Difference ₹5.00 below',
    updatedAt: '11 Oct 2026, 10:00',
    pricingUnit: '₹/kg',
  };

  const [newPrice, setNewPrice] = useState('');
  const [reason, setReason] = useState('');

  // Ceiling numeric extraction for calculation
  const ceilingNum = parseFloat(item.ceiling.replace(/[^\d.]/g, '')) || 60;
  const currentPriceNum = parseFloat(item.retailPrice.replace(/[^\d.]/g, '')) || 55;
  const newPriceNum = parseFloat(newPrice);

  const hasProposed = !isNaN(newPriceNum) && newPriceNum > 0;
  const proposedText = hasProposed ? `₹${newPriceNum.toFixed(2)}/kg` : '—';
  const diffVal = hasProposed ? ceilingNum - newPriceNum : null;
  const diffText = diffVal !== null ? `₹${diffVal.toFixed(2)}` : '—';

  const handleSave = () => {
    if (!newPrice) {
      Alert.alert('Required Field', 'Please enter a valid new retail price.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Required Field', 'Please enter a change reason.');
      return;
    }

    const updated: PricingRecordItem = {
      ...item,
      retailPrice: `₹${newPriceNum.toFixed(2)}/kg`,
      badge: newPriceNum > ceilingNum ? 'Over ceiling' : 'Compliant',
      difference:
        diffVal !== null
          ? diffVal >= 0
            ? `Difference ₹${diffVal.toFixed(2)} below`
            : `Difference over by ₹${Math.abs(diffVal).toFixed(2)}`
          : item.difference,
      updatedAt: '19 Oct 2026, 19:30',
    };

    Alert.alert(
      'Retail Price Updated',
      `The retail price for ${item.product} · ${item.grade} has been updated to ${updated.retailPrice}.`,
      [
        {
          text: 'OK',
          onPress: () => {
            if (onSaveSuccess) onSaveSuccess(updated);
            else onBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Header Banner Matching Image 4 ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowIcon />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            Edit retail price
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section: Retails price Matching Image 4 ── */}
        <Text style={styles.sectionHeading}>Retails price</Text>

        <View style={styles.tableCard}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Product / crop</Text>
            <Text style={styles.tableValue}>{item.product}</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Category</Text>
            <Text style={styles.tableValue}>{item.category}</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Grade</Text>
            <Text style={styles.tableValue}>{item.grade}</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Pricing unit</Text>
            <Text style={styles.tableValue}>{item.pricingUnit || '₹/kg'}</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Current retail price</Text>
            <Text style={styles.tableValue}>{item.retailPrice}</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Applicable ceiling</Text>
            <Text style={styles.tableValue}>{item.ceiling}</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Current effective date</Text>
            <Text style={styles.tableValue}>11 Oct 2026</Text>
          </View>
        </View>

        {/* ── Input 1: New retail price (₹) * ── */}
        <Text style={styles.fieldLabel}>New retail price (₹) *</Text>
        <TextInput
          style={styles.textInput}
          keyboardType="numeric"
          value={newPrice}
          onChangeText={setNewPrice}
          placeholder="Enter price"
          placeholderTextColor={adminColors.placeholder}
        />

        {/* ── Field 2: Effective from (readonly) with Lock Icon ── */}
        <View style={styles.fieldLabelWithIconRow}>
          <Text style={styles.fieldLabelNoMargin}>Effective from</Text>
          <LockIcon />
        </View>
        <View style={styles.readonlyInputBox}>
          <Text style={styles.readonlyInputText}>Immediately (14 Oct 2026)</Text>
        </View>

        {/* ── Input 3: Change reason * (multiline) ── */}
        <Text style={styles.fieldLabel}>Change reason *</Text>
        <TextInput
          style={styles.textAreaInput}
          multiline
          numberOfLines={3}
          value={reason}
          onChangeText={setReason}
          placeholder="State reason for price change"
          placeholderTextColor={adminColors.placeholder}
        />

        {/* ── Comparison Summary Card Matching Image 4 ── */}
        <View style={styles.summaryCard}>
          <View style={styles.tableRow}>
            <Text style={styles.summaryLabel}>Current retail price</Text>
            <Text style={styles.summaryValue}>{item.retailPrice}</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.summaryLabel}>Proposed retail price</Text>
            <Text style={styles.summaryValue}>{proposedText}</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.summaryLabel}>Applicable ceiling</Text>
            <Text style={styles.summaryValue}>{item.ceiling}</Text>
          </View>
          <View style={styles.tableDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.summaryLabel}>Difference (ceiling minus proposed)</Text>
            <Text style={styles.summaryValue}>{diffText}</Text>
          </View>

          {/* Callout Pill at bottom of card */}
          <View style={styles.calloutBox}>
            <Text style={styles.calloutText}>
              {!hasProposed
                ? 'Enter the new retail price.'
                : diffVal !== null && diffVal < 0
                ? 'Proposed retail price is above the applicable ceiling.'
                : 'Proposed retail price is within the applicable ceiling.'}
            </Text>
          </View>
        </View>

        {/* ── Bottom Buttons Matching Image 4 ── */}
        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              hasProposed && styles.saveBtnActive,
            ]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.saveBtnText,
                hasProposed && styles.saveBtnTextActive,
              ]}
            >
              Save Retail Price
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: adminColors.onBrand,
    flex: 1,
    marginLeft: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl * 2,
  },

  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },

  // Table Card
  tableCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  tableLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
  },
  tableValue: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  tableDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    opacity: 0.5,
  },

  // Fields
  fieldLabel: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
    marginTop: 4,
  },
  fieldLabelNoMargin: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
  },
  fieldLabelWithIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    marginBottom: 6,
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    height: 44,
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  readonlyInputBox: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.md,
    height: 44,
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  readonlyInputText: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.muted,
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 10,
    height: 80,
    textAlignVertical: 'top',
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },

  // Summary Comparison Card
  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  summaryLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
  },
  summaryValue: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  calloutBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    paddingVertical: 10,
    paddingHorizontal: adminSpacing.md,
    marginTop: 10,
  },
  calloutText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.muted,
  },

  // Bottom Buttons
  bottomButtonsRow: {
    flexDirection: 'row',
    columnGap: 10,
    marginBottom: adminSpacing.xl,
  },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  saveBtnText: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.muted,
  },
  saveBtnTextActive: {
    color: adminColors.onBrand,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
});
