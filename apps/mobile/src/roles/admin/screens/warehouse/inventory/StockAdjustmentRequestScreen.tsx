// Design id: M3S13
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import type { InventoryScreenBaseProps } from './types';
import Svg, { Path, Circle } from 'react-native-svg';

export type StockAdjustmentRequestScreenProps = InventoryScreenBaseProps;

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function DownArrowRedIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v16M6 14l6 6 6-6" stroke="#EF4444" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RadioSelectedIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#F0562A" strokeWidth="2.2" fill="#FFFFFF" />
      <Circle cx="12" cy="12" r="4.5" fill="#F0562A" />
    </Svg>
  );
}

function RadioUnselectedIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#D4D4D8" strokeWidth="1.8" fill="#FFFFFF" />
    </Svg>
  );
}

function CameraAddIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-2.5h4"
        stroke="#71717A"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="11" cy="14" r="3.5" stroke="#71717A" strokeWidth="1.8" />
      <Path
        d="M18 4v5M15.5 6.5h5"
        stroke="#71717A"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function SendPlaneWhiteIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 4l19 8-19 8 5-8-5-8z"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 12h14"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const REASONS = [
  'Physical Counting Error',
  'Damage',
  'Spoilage',
  'Missing Stock',
  'Other (configured reason)',
];

export function StockAdjustmentRequestScreen({ can, onNavigate, onBack, routeParams }: StockAdjustmentRequestScreenProps) {
  // rbac: inventory.stock_adjustment.create MAIN=all, SUB=own (own warehouse only).
  const canCreateAdjustment = can('inventory.stock_adjustment.create');
  const [selectedReason, setSelectedReason] = useState('Physical Counting Error');
  const [notes, setNotes] = useState('');

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#F0562A" />

      {/* Top SafeArea for Header */}
      <SafeAreaView style={styles.topSafeArea}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            {onBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Back"
              >
                <BackArrowIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle} numberOfLines={1}>Stock Adjustment Request</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Top 3 Quantity Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>100 KG</Text>
              <Text style={styles.summaryLabel}>SYSTEM</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>95 KG</Text>
              <Text style={styles.summaryLabel}>PHYSICAL</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValueRed}>-5 KG</Text>
              <Text style={styles.summaryLabel}>VARIANCE</Text>
            </View>
          </View>

          {/* Adjustment Requested */}
          <Text style={styles.sectionHeader}>Adjustment Requested</Text>
          <View style={styles.adjustmentBadge}>
            <DownArrowRedIcon />
            <Text style={styles.adjustmentBadgeText}>ADJUSTMENT_DOWN · -5 KG</Text>
          </View>

          {/* Reason Section */}
          <View style={styles.reasonHeaderRow}>
            <Text style={styles.sectionHeader}>Reason</Text>
            <Text style={styles.requiredText}>Required</Text>
          </View>

          <View style={styles.reasonsCard}>
            {REASONS.map((reason, idx) => {
              const isSelected = selectedReason === reason;
              const isLast = idx === REASONS.length - 1;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.reasonRow, !isLast && styles.reasonBorderBottom]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedReason(reason)}
                >
                  {isSelected ? <RadioSelectedIcon /> : <RadioUnselectedIcon />}
                  <Text style={styles.reasonText}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Notes Section */}
          <Text style={styles.sectionHeader}>Notes</Text>
          <View style={styles.notesBox}>
            <TextInput
              style={styles.notesInput}
              multiline
              numberOfLines={4}
              placeholder=""
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Evidence Section */}
          <Text style={styles.sectionHeader}>Evidence</Text>
          <TouchableOpacity style={styles.evidenceBox} activeOpacity={0.7}>
            <CameraAddIcon />
            <Text style={styles.evidenceText}>Add Photo</Text>
          </TouchableOpacity>

          {/* Bottom Spacing */}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Fixed Submit Button at Bottom (only with stock_adjustment.create) */}
        {canCreateAdjustment ? (
          <SafeAreaView style={styles.bottomSafeArea}>
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.submitBtn}
                activeOpacity={0.85}
                onPress={() => onNavigate?.('M3S17', { ...(routeParams ?? {}), reason: selectedReason, notes, submitted: true })}
              >
                <SendPlaneWhiteIcon />
                <Text style={styles.submitBtnText}>Submit Adjustment Request</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F0562A',
  },
  topSafeArea: {
    backgroundColor: '#F0562A',
  },
  header: {
    backgroundColor: '#F0562A',
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  body: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 2,
  },
  summaryLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '800',
    color: '#5C6B62',
    letterSpacing: 0.8,
  },
  summaryValueRed: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 2,
  },
  sectionHeader: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 8,
  },
  adjustmentBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 7,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  adjustmentBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.3,
  },
  reasonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  requiredText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '600',
    color: '#71717A',
  },
  reasonsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    overflow: 'hidden',
    marginBottom: 12,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  reasonBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#F4F1EA',
  },
  reasonText: {
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
    color: '#18181B',
  },
  notesBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    height: 68,
    padding: 12,
    marginBottom: 12,
  },
  notesInput: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: '#18181B',
    textAlignVertical: 'top',
    padding: 0,
    flex: 1,
  },
  evidenceBox: {
    width: 68,
    height: 68,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D4D4D8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  evidenceText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '600',
    color: '#71717A',
    marginTop: 4,
  },
  bottomSafeArea: {
    backgroundColor: '#FAF7F2',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'android' ? 16 : 12,
    paddingTop: 6,
    backgroundColor: '#FAF7F2',
  },
  submitBtn: {
    backgroundColor: '#F0562A',
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitBtnText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

