// Design id: M3S11
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
} from 'react-native';
import { adminColors, adminShadow, adminType } from '../../../theme';
import type { InventoryScreenBaseProps } from './types';
import Svg, { Path, Rect } from 'react-native-svg';
import { SWAHeader } from '../../swa/components';

export interface PhysicalCountScreenProps extends InventoryScreenBaseProps {}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function WarningTriangleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={adminColors.warning.text}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={adminColors.warning.text} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowRightIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M12 5l7 7-7 7" stroke={adminColors.onBrand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckedSquareIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect width="24" height="24" rx="6" fill={adminColors.success.text} />
      <Path d="M7 12.5l3.5 3.5 6.5-7" stroke={adminColors.onBrand} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UncheckedSquareIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="1" width="22" height="22" rx="5" stroke={adminColors.placeholder} strokeWidth="1.8" fill={adminColors.card} />
    </Svg>
  );
}

export function PhysicalCountScreen({ scope, can, onNavigate, onBack }: PhysicalCountScreenProps) {
  const [physicalCount, setPhysicalCount] = useState('95.000');
  const [checklist, setChecklist] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: false,
    4: false,
  });

  const toggleCheck = (idx: number) => {
    setChecklist(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const checklistItems = [
    'Storage location checked',
    'Batch checked',
    'Quantity counted',
    'Damaged quantity identified',
    'Count confirmed',
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.container}>
        <SWAHeader
          title="Physical Count"
          onBack={onBack}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Product Information - 2x2 Grid */}
          <View style={styles.productCard}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Product</Text>
                <Text style={styles.colValue}>Tomato</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Grade</Text>
                <Text style={styles.colValue}>Grade 1</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, { marginTop: 12 }]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Batch</Text>
                <Text style={styles.colValue}>BAT-2026-00124</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Storage Location</Text>
                <Text style={styles.colValue}>Cold Storage · A03</Text>
              </View>
            </View>
          </View>

          {/* System Quantity */}
          <Text style={styles.sectionHeader}>System Quantity</Text>
          <View style={styles.systemQuantityCard}>
            <Text style={styles.systemQuantityNumber}>100 KG</Text>
            <Text style={styles.systemQuantitySub}>SYSTEM QUANTITY</Text>
          </View>

          {/* Physical Count Input */}
          <Text style={styles.sectionHeader}>Physical Count</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.textInput}
              value={physicalCount}
              onChangeText={setPhysicalCount}
              keyboardType="decimal-pad"
              placeholder="0.000"
              placeholderTextColor={adminColors.muted}
            />
            <Text style={styles.unitText}>KG</Text>
          </View>

          {/* Variance Warning Banner */}
          <View style={styles.varianceWarningBox}>
            <WarningTriangleIcon />
            <Text style={styles.varianceWarningText}>
              Variance Detected — System 100 KG vs. Physical 95 KG
            </Text>
          </View>

          {/* Verification Checklist */}
          <Text style={styles.sectionHeader}>Verification Checklist</Text>
          <View style={styles.checklistCard}>
            {checklistItems.map((item, idx) => {
              const isChecked = !!checklist[idx];
              const isLast = idx === checklistItems.length - 1;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.checklistItemRow, !isLast && styles.itemBorderBottom]}
                  activeOpacity={0.7}
                  onPress={() => toggleCheck(idx)}
                >
                  {isChecked ? <CheckedSquareIcon /> : <UncheckedSquareIcon />}
                  <Text style={styles.checklistText}>
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bottom Spacing */}
          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Fixed Continue Button at Bottom */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.continueBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('M3S12')}
          >
            <ArrowRightIcon />
            <Text style={styles.continueBtnText}>Continue to Variance Review</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand, // status bar blends with header
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  productCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 14,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  colLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  colValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  sectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 8,
    marginTop: 6,
  },
  systemQuantityCard: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  systemQuantityNumber: {
    ...adminType.title,
    color: adminColors.brandDeep,
  },
  systemQuantitySub: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    letterSpacing: 0.6,
    marginTop: 4,
  },
  inputBox: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  textInput: {
    ...adminType.title,
    flex: 1,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  unitText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  varianceWarningBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  varianceWarningText: {
    ...adminType.rowTitle,
    flex: 1,
    color: adminColors.brandDeep,
    lineHeight: 17,
  },
  checklistCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  itemBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.canvas,
  },
  checklistText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: adminColors.canvas,
  },
  continueBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...adminShadow.sm,
  },
  continueBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
});
