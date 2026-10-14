import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../theme';

// ─── Design Tokens (Directly Bound to Theme File Structure) ───────────────────
const THEME = {
  headerBg: adminColors.brand,
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,

  // Typography
  titleRustDark: adminColors.brandDeep,
  ink: adminColors.ink,
  muted: adminColors.muted,
  labelMuted: '#78716C',

  // Semantic
  green: adminColors.success.text,
  red: adminColors.danger.text,
  orangeBtn: adminColors.brand,
  btnBg: adminColors.brandTint,
  btnBorder: adminColors.border,
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
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

function CircleSlashIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface FarmerHandoverScreenProps {
  orderId?: string;
  farmerName?: string;
  farmerPhone?: string;
  expectedQty?: number;
  onBack: () => void;
  onConfirmHandover: (receivedQty: number, qualityStatus: string, notes: string) => void;
  onReportIssue?: () => void;
}

export function FarmerHandoverScreen({
  orderId = 'PO-2026-00124',
  farmerName = 'Ramesh Kumar',
  farmerPhone = '+91 XXXXX XXXXX',
  expectedQty = 30,
  onBack,
  onConfirmHandover,
}: FarmerHandoverScreenProps) {
  const [receivedQtyInput, setReceivedQtyInput] = useState(expectedQty.toString());
  const [quality, setQuality] = useState<'Accepted' | 'Quality Issue'>('Accepted');
  const [notes, setNotes] = useState('');

  const receivedQtyNum = parseFloat(receivedQtyInput) || 0;
  const difference = receivedQtyNum - expectedQty;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Matching Screenshot 3 Exactly ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Farmer Handover</Text>
        </View>

        <Text style={styles.headerSubtitle}>Status: Awaiting Handover</Text>
      </View>

      {/* ─── Scroll Body ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Farmer & Phone */}
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Farmer</Text>
              <Text style={styles.fieldValue}>{farmerName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <Text style={styles.fieldValue}>{farmerPhone}</Text>
            </View>
          </View>
        </View>

        {/* Card 2: PO ID & Agreed Quantity */}
        <View style={[styles.card, { marginTop: 10 }]}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>PO ID</Text>
              <Text style={styles.fieldValue}>{orderId}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Agreed Quantity</Text>
              <Text style={styles.fieldValue}>{expectedQty} kg</Text>
            </View>
          </View>
        </View>

        {/* Section: Actual Handover Quantity */}
        <Text style={styles.sectionHeading}>Actual Handover Quantity</Text>

        {/* Card 3: 3-column KPI */}
        <View style={styles.card}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>EXPECTED</Text>
              <Text style={styles.kpiValue}>{expectedQty} kg</Text>
            </View>

            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>RECEIVED</Text>
              <Text style={styles.kpiValue}>{receivedQtyNum} kg</Text>
            </View>

            <View style={styles.kpiCol}>
              <Text style={styles.kpiLabel}>DIFFERENCE</Text>
              <Text
                style={[
                  styles.kpiValue,
                  { color: difference === 0 ? THEME.green : difference < 0 ? THEME.red : THEME.ink },
                ]}
              >
                {difference > 0 ? `+${difference}` : difference} kg
              </Text>
            </View>
          </View>
        </View>

        {/* Input: Received Quantity */}
        <Text style={styles.inputLabel}>Received Quantity (kg)</Text>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            value={receivedQtyInput}
            onChangeText={setReceivedQtyInput}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Section: Handover Verification */}
        <Text style={styles.sectionHeading}>Handover Verification</Text>

        <Text style={styles.subLabel}>Quality</Text>
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, quality === 'Accepted' ? styles.chipActive : styles.chipInactive]}
            onPress={() => setQuality('Accepted')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.chipText,
                quality === 'Accepted' ? styles.chipTextActive : styles.chipTextInactive,
              ]}
            >
              Accepted
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, quality === 'Quality Issue' ? styles.chipActive : styles.chipInactive]}
            onPress={() => setQuality('Quality Issue')}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.chipText,
                quality === 'Quality Issue' ? styles.chipTextActive : styles.chipTextInactive,
              ]}
            >
              Quality Issue
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.subLabel, { marginTop: 14 }]}>Notes</Text>
        <View style={[styles.inputCard, styles.notesCard]}>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>


        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() => onConfirmHandover(receivedQtyNum, quality, notes)}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Confirm Handover</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },

  header: {
    backgroundColor: THEME.headerBg,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
    marginLeft: 38,
    fontWeight: '500',
  },

  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.titleRustDark,
    marginTop: 18,
    marginBottom: 8,
  },

  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: THEME.labelMuted,
    marginBottom: 4,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.ink,
  },

  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.labelMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.ink,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginTop: 14,
    marginBottom: 6,
  },
  inputCard: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textInput: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.ink,
    padding: 0,
  },

  subLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: THEME.orangeBtn,
    borderColor: THEME.orangeBtn,
  },
  chipInactive: {
    backgroundColor: THEME.card,
    borderColor: THEME.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: THEME.white,
  },
  chipTextInactive: {
    color: '#4B5563',
  },

  notesCard: {
    minHeight: 88,
  },
  notesInput: {
    fontSize: 14,
    color: THEME.ink,
    padding: 0,
    minHeight: 68,
  },

  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FBF9F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    gap: 10,
    marginTop: 18,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: THEME.muted,
    lineHeight: 17,
  },

  confirmBtn: {
    backgroundColor: THEME.orangeBtn,
    borderRadius: adminRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  confirmBtnText: {
    ...adminType.rowTitle,
    fontSize: 15,
    color: THEME.white,
  },
});

