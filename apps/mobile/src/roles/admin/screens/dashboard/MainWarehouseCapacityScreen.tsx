import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminSpacing,
  adminType,
  ADMIN_BUTTON_HEIGHT,
} from '../../theme';

function ArrowBackIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12H4M10 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SuccessCheckIcon({ size = 32, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M8 12l3 3 5-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface MainWarehouseCapacityScreenProps {
  onBack: () => void;
  warehouseName?: string;
  initialCapacity?: number;
}

export function MainWarehouseCapacityScreen({
  onBack,
  initialCapacity = 10000,
}: MainWarehouseCapacityScreenProps) {
  // Steps: 'overview' | 'edit' | 'review' | 'confirm' | 'updated'
  const [step, setStep] = useState<'overview' | 'edit' | 'review' | 'confirm' | 'updated'>('overview');
  const [currentCapacity, setCurrentCapacity] = useState<number>(initialCapacity);
  const [capacityInput, setCapacityInput] = useState<string>(String(initialCapacity));

  // Calculated metrics
  const usedKg = 7420;
  const newCapacityNum = parseInt(capacityInput, 10) || currentCapacity;
  const availableKg = Math.max(0, currentCapacity - usedKg);
  const utilizationPct = ((usedKg / currentCapacity) * 100).toFixed(1);

  const diffKg = newCapacityNum - currentCapacity;
  const diffSign = diffKg >= 0 ? `+${diffKg.toLocaleString()} kg` : `${diffKg.toLocaleString()} kg`;

  // 1. Edit Capacity Screen
  if (step === 'edit') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('overview')} activeOpacity={0.7} style={styles.backBtn}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Capacity</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionHeaderTitle}>Edit Capacity</Text>

          <Text style={styles.fieldLabel}>Total Warehouse Capacity (kg)</Text>
          <TextInput
            style={styles.textInput}
            value={capacityInput}
            onChangeText={setCapacityInput}
            keyboardType="numeric"
            placeholder="e.g. 10000"
            placeholderTextColor={adminColors.placeholder}
          />

          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>Changing capacity here never modifies inventory.</Text>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setStep('review')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Review Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => {
              setCapacityInput(String(currentCapacity));
              setStep('overview');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 2. Review Changes Screen
  if (step === 'review') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('edit')} activeOpacity={0.7} style={styles.backBtn}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Changes</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          <Text style={styles.sectionHeaderTitle}>Review Changes</Text>

          <View style={styles.reviewCard}>
            <View style={styles.reviewRow}>
              <View style={styles.reviewCol}>
                <Text style={styles.reviewLabel}>Current Capacity</Text>
                <Text style={styles.reviewValue}>{currentCapacity.toLocaleString()} kg</Text>
              </View>
              <View style={styles.reviewCol}>
                <Text style={styles.reviewLabel}>New Capacity</Text>
                <Text style={styles.reviewValue}>{newCapacityNum} kg</Text>
              </View>
            </View>

            <View style={{ marginTop: adminSpacing.lg }}>
              <Text style={styles.reviewLabel}>Difference</Text>
              <Text style={[styles.reviewValue, styles.diffValue]}>{diffSign}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setStep('confirm')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Update Capacity</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setStep('edit')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 3. Confirm Prompt Screen
  if (step === 'confirm') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('review')} activeOpacity={0.7} style={styles.backBtn}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Capacity & Targets</Text>
        </View>

        <View style={styles.confirmContent}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmPrompt}>Update warehouse capacity?</Text>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => {
                setCurrentCapacity(newCapacityNum);
                setStep('updated');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // 4. Capacity Updated Screen
  if (step === 'updated') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('overview')} activeOpacity={0.7} style={styles.backBtn}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Capacity Updated</Text>
        </View>

        <View style={styles.updatedContainer}>
          <View style={styles.successIconWrap}>
            <SuccessCheckIcon size={34} color={adminColors.success.text} />
          </View>
          <Text style={styles.updatedTitle}>Warehouse capacity updated.</Text>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 5. Overview Screen (Capacity & Targets main dashboard)
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
          <ArrowBackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Capacity & Targets</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* 2x2 Capacity Grid */}
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <Text style={styles.cardLabel}>TOTAL CAPACITY</Text>
            <Text style={styles.cardValue}>{currentCapacity.toLocaleString()} kg</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.cardLabel}>USED</Text>
            <Text style={styles.cardValue}>{usedKg.toLocaleString()} kg</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.cardLabel}>AVAILABLE</Text>
            <Text style={styles.cardValue}>{availableKg.toLocaleString()} kg</Text>
          </View>
          <View style={styles.overviewCard}>
            <Text style={styles.cardLabel}>UTILIZATION</Text>
            <Text style={styles.cardValue}>{utilizationPct}%</Text>
          </View>
        </View>

        {/* Warehouse Targets Section */}
        <Text style={styles.sectionHeaderTitle}>Warehouse Targets</Text>
        <View style={styles.targetsCard}>
          <View style={styles.targetCol}>
            <Text style={styles.targetLabel}>Receiving Target</Text>
            <Text style={styles.targetValue}>500 kg/day</Text>
          </View>
          <View style={styles.targetCol}>
            <Text style={styles.targetLabel}>Sales Target</Text>
            <Text style={styles.targetValue}>₹25,000/day</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            setCapacityInput(String(currentCapacity));
            setStep('edit');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Edit Capacity</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    paddingRight: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.xl,
  },
  overviewCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
  },
  cardLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  cardValue: {
    ...adminType.title,
    color: adminColors.ink,
  },
  sectionHeaderTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  targetsCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  targetCol: {
    flex: 1,
  },
  targetLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  targetValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  fieldLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  textInput: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    ...adminType.body,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  infoBanner: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
  },
  infoBannerText: {
    ...adminType.rowMeta,
    color: adminColors.brandDeep,
  },
  reviewCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewCol: {
    flex: 1,
  },
  reviewLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  reviewValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  diffValue: {
    color: adminColors.success.text,
  },
  confirmContent: {
    padding: adminSpacing.lg,
  },
  confirmBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    padding: adminSpacing.lg,
  },
  confirmPrompt: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  confirmBtn: {
    backgroundColor: adminColors.success.bg,
    borderWidth: 1,
    borderColor: adminColors.success.border,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
  },
  updatedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: adminSpacing.xl,
    paddingBottom: adminSpacing.xxl,
  },
  successIconWrap: {
    width: adminSpacing.xxxl + adminSpacing.lg,
    height: adminSpacing.xxxl + adminSpacing.lg,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.xl,
  },
  updatedTitle: {
    ...adminType.title,
    color: adminColors.ink,
    textAlign: 'center',
  },
  bottomBar: {
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    padding: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    gap: adminSpacing.sm,
  },
  primaryBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  secondaryBtn: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: ADMIN_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
});
