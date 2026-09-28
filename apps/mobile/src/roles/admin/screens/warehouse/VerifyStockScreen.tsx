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
import { WAREHOUSE_THEME } from './WarehouseOverviewScreen';

function BackChevronIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18l-6-6 6-6"
        stroke={WAREHOUSE_THEME.ink}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MinusIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14" stroke={WAREHOUSE_THEME.ink} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function PlusIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={WAREHOUSE_THEME.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarningTriangleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
        stroke="#B45309"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SubmitApprovalIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
export interface VerifyStockAdjustmentData {
  physicalCount: number;
  varianceKg: number;
  variancePct: number;
  reason: string;
  produceName: string;
  batchId: string;
  zone: string;
  systemCount: number;
}

export interface VerifyStockScreenProps {
  onBack?: () => void;
  produceName?: string;
  batchId?: string;
  zone?: string;
  systemCount?: number;
  initialPhysicalCount?: number;
  onSubmitApproval?: (data: VerifyStockAdjustmentData) => void;
}

export function VerifyStockScreen({
  onBack,
  produceName = 'Carrots',
  batchId = 'BT-4471',
  zone = 'Zone A-2',
  systemCount = 240,
  initialPhysicalCount = 225,
  onSubmitApproval,
}: VerifyStockScreenProps) {
  const [physicalCount, setPhysicalCount] = useState(initialPhysicalCount);
  const [reason, setReason] = useState('');

  const varianceKg = physicalCount - systemCount;
  const variancePct = systemCount > 0 ? (varianceKg / systemCount) * 100 : 0;
  const exceedsTolerance = Math.abs(variancePct) > 5;

  const handleMinus = () => {
    setPhysicalCount((prev) => Math.max(0, prev - 1));
  };

  const handlePlus = () => {
    setPhysicalCount((prev) => prev + 1);
  };

  const handleSubmit = () => {
    onSubmitApproval?.({
      physicalCount,
      varianceKg,
      variancePct,
      reason,
      produceName,
      batchId,
      zone,
      systemCount,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={WAREHOUSE_THEME.bg} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        {onBack && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackChevronIcon />
          </TouchableOpacity>
        )}

        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Verify Stock</Text>
          <Text style={styles.subtitle}>
            {produceName} · Batch {batchId} · {zone}
          </Text>
        </View>

        {/* Counter Card */}
        <View style={styles.counterCard}>
          <Text style={styles.counterCardTitle}>Adjust to physical count</Text>

          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={handleMinus}
              activeOpacity={0.7}
            >
              <MinusIcon />
            </TouchableOpacity>

            <View style={styles.counterValueBlock}>
              <Text style={styles.physicalNumber}>{physicalCount} kg</Text>
              <Text style={styles.systemCountText}>system: {systemCount} kg</Text>
              <Text style={[styles.varianceText, varianceKg < 0 ? { color: WAREHOUSE_THEME.red } : { color: '#0D8253' }]}>
                {varianceKg > 0 ? `+${varianceKg}` : varianceKg} kg variance ({variancePct.toFixed(2)}%)
              </Text>
            </View>

            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={handlePlus}
              activeOpacity={0.7}
            >
              <PlusIcon />
            </TouchableOpacity>
          </View>
        </View>

        {/* Reason for variance */}
        <View style={styles.reasonSection}>
          <Text style={styles.fieldLabel}>Reason for variance</Text>
          <TextInput
            style={styles.reasonInput}
            placeholder="e.g. Spoilage during storage..."
            placeholderTextColor="#A59E99"
            multiline
            value={reason}
            onChangeText={setReason}
            textAlignVertical="top"
          />
        </View>

        {/* Tolerance Warning Box */}
        {exceedsTolerance && (
          <View style={styles.toleranceAlertBox}>
            <WarningTriangleIcon />
            <Text style={styles.toleranceAlertText}>
              Variance exceeds ±5% tolerance — this adjustment will route to SA/TA for approval before the ledger updates.
            </Text>
          </View>
        )}

        {/* Submit for Approval Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <SubmitApprovalIcon />
          <Text style={styles.submitBtnText}>Submit for Approval</Text>
        </TouchableOpacity>

        <View style={{ height: 36 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WAREHOUSE_THEME.bg,
  },
  container: {
    flex: 1,
    backgroundColor: WAREHOUSE_THEME.bg,
  },
  contentPad: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    backgroundColor: WAREHOUSE_THEME.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerBlock: {
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: WAREHOUSE_THEME.titleRust,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: WAREHOUSE_THEME.muted,
    marginTop: 6,
  },
  counterCard: {
    backgroundColor: WAREHOUSE_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    padding: 20,
    marginBottom: 20,
  },
  counterCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: WAREHOUSE_THEME.ink,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  stepperBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F5F1EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValueBlock: {
    alignItems: 'center',
  },
  physicalNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: WAREHOUSE_THEME.ink,
  },
  systemCountText: {
    fontSize: 13,
    color: WAREHOUSE_THEME.muted,
    marginTop: 4,
  },
  varianceText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  reasonSection: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: WAREHOUSE_THEME.ink,
    marginBottom: 8,
  },
  reasonInput: {
    backgroundColor: WAREHOUSE_THEME.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.border,
    padding: 14,
    height: 90,
    fontSize: 14,
    color: WAREHOUSE_THEME.ink,
  },
  toleranceAlertBox: {
    backgroundColor: WAREHOUSE_THEME.alertBg,
    borderWidth: 1,
    borderColor: WAREHOUSE_THEME.alertBorder,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  toleranceAlertText: {
    flex: 1,
    fontSize: 13,
    color: WAREHOUSE_THEME.alertText,
    lineHeight: 18,
    marginLeft: 10,
  },
  submitBtn: {
    backgroundColor: WAREHOUSE_THEME.orange,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
