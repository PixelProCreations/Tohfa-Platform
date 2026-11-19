import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import { fromPaise } from '@tohfa/shared-types';
import type { Can } from '../../permissions/can';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import type { PricingRecordItem } from './MarketPricingOverviewScreen';
import { useCreateRetailPrice } from '../../api/pricingHooks';
import { parseRupeesToPaise } from '../../money/paise';
import type { PricingGrade } from '../../api/pricing';

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
  can?: Can | undefined;
  warehouseId?: string | undefined;
  onBack: () => void;
  record?: PricingRecordItem | null | undefined;
  onSaveSuccess?: ((updatedRecord: PricingRecordItem) => void) | undefined;
}

const DEFAULT_RECORD: PricingRecordItem = {
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

export function EditRetailPriceScreen({
  can,
  warehouseId: _warehouseId,
  onBack,
  record,
  onSaveSuccess,
}: EditRetailPriceScreenProps): React.JSX.Element {
  const canEdit = can ? can('pricing.retail_price.set') : true;
  const retailWrite = useCreateRetailPrice({ enabled: canEdit });

  const item: PricingRecordItem = record ?? DEFAULT_RECORD;

  const [newPrice, setNewPrice] = useState('');
  const [reason, setReason] = useState('');

  // Extract ceiling paise
  const ceilingPaiseMatch = item.ceiling.match(/[\d.]+/);
  const ceilingPaise = ceilingPaiseMatch ? parseRupeesToPaise(ceilingPaiseMatch[0]) : 6000;

  const newPaise = parseRupeesToPaise(newPrice);
  const hasProposed = newPaise !== null && newPaise > 0;
  const proposedText = hasProposed ? `₹${(newPaise / 100).toFixed(2)}/kg` : '—';

  const diffPaise = hasProposed && ceilingPaise !== null ? ceilingPaise - newPaise : null;
  const diffText =
    diffPaise !== null
      ? diffPaise >= 0
        ? `₹${(diffPaise / 100).toFixed(2)}`
        : `-₹${(Math.abs(diffPaise) / 100).toFixed(2)}`
      : '—';

  const handleSave = () => {
    if (!canEdit) {
      Alert.alert('Permission Denied', 'You do not have permission to update retail prices.');
      return;
    }
    if (!hasProposed || newPaise === null) {
      Alert.alert('Required Field', 'Please enter a valid new retail price.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Required Field', 'Please enter a change reason.');
      return;
    }

    const updated: PricingRecordItem = {
      ...item,
      retailPrice: `₹${(newPaise / 100).toFixed(2)}/kg`,
      badge: diffPaise !== null && diffPaise < 0 ? 'Over ceiling' : 'Compliant',
      difference:
        diffPaise !== null
          ? diffPaise >= 0
            ? `Difference ₹${(diffPaise / 100).toFixed(2)} below`
            : `Difference over by ₹${(Math.abs(diffPaise) / 100).toFixed(2)}`
          : item.difference,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    if (item.cropId && item.grade) {
      const validGrade: PricingGrade =
        item.grade === 'Grade 1' || item.grade === 'GRADE_1'
          ? 'GRADE_1'
          : item.grade === 'Grade 2' || item.grade === 'GRADE_2'
          ? 'GRADE_2'
          : 'GRADE_3';

      retailWrite.run(
        {
          cropId: item.cropId,
          grade: validGrade,
          price: fromPaise(newPaise),
          effectiveFrom: new Date().toISOString().slice(0, 10),
        },
        () => {
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
            ],
          );
        },
      );
    } else {
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
        ],
      );
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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
            <Text style={styles.tableValue}>{item.pricingUnit ?? '₹/kg'}</Text>
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
            <Text style={styles.tableValue}>—</Text>
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
          editable={canEdit}
        />

        {/* ── Field 2: Effective from (readonly) with Lock Icon ── */}
        <View style={styles.fieldLabelWithIconRow}>
          <Text style={styles.fieldLabelNoMargin}>Effective from</Text>
          <LockIcon />
        </View>
        <View style={styles.readonlyInputBox}>
          <Text style={styles.readonlyInputText}>Immediately</Text>
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
          editable={canEdit}
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
                : diffPaise !== null && diffPaise < 0
                ? 'Proposed retail price is above the applicable ceiling.'
                : 'Proposed retail price is within the applicable ceiling.'}
            </Text>
          </View>
        </View>

        {/* ── Bottom Buttons Matching Image 5 ── */}
        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveBtn,
              hasProposed && canEdit && styles.saveBtnActive,
              !canEdit && styles.saveBtnDisabled,
            ]}
            onPress={canEdit && hasProposed ? handleSave : undefined}
            disabled={!canEdit || !hasProposed || retailWrite.isPending}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.saveBtnText,
                hasProposed && canEdit && styles.saveBtnTextActive,
                !canEdit && styles.saveBtnTextDisabled,
              ]}
            >
              {retailWrite.isPending ? 'Saving...' : 'Save Retail Price'}
            </Text>
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
    color: adminColors.muted,
  },
  tableValue: {
    ...adminType.body,
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
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
    marginTop: 4,
  },
  fieldLabelNoMargin: {
    ...adminType.caption,
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
    color: adminColors.muted,
  },
  summaryValue: {
    ...adminType.body,
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
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  saveBtnTextActive: {
    color: adminColors.onBrand,
  },
  saveBtnTextDisabled: {
    color: adminColors.muted,
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
    color: adminColors.ink,
  },
});
