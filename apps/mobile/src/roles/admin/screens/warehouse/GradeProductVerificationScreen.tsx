import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  primary:            '#F0562A', // Brand Orange
  headerBg:           '#F0562A',
  headerText:         '#FFFFFF',

  orangeDeep:         '#7A2E14',
  noticeBgOrange:     '#FDF3F0', // Brand Orange Tint (NO yellow)
  noticeBorderOrange: '#F7CFC4',
  pageBg:             '#F3EFE9', // Canvas soft cream

  textInk:            '#1A1A1A',
  textSecondary:      '#5F5E5A',
  border:             '#EEDCD3',
  cardBg:             '#FFFFFF',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ArrowForwardIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = PALETTE.textInk }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClipboardCheckIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" stroke={color} strokeWidth="2" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StarIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FileTextIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface GradeProductVerificationScreenProps {
  shipmentId?: string;
  expectedProduct?: string;
  expectedGrade?: string;
  onBack?: () => void;
  onContinueToMismatchReport?: () => void;
  onNavigateProductMismatch?: () => void;
  onNavigateGradeMismatch?: () => void;
  onNavigateProductSummary?: () => void;
  onNavigateGradeSummary?: () => void;
}

export function GradeProductVerificationScreen({
  shipmentId = 'SHP-000124',
  expectedProduct = 'Tomato',
  expectedGrade = 'Grade 1',
  onBack,
  onContinueToMismatchReport,
  onNavigateProductMismatch,
  onNavigateGradeMismatch,
  onNavigateProductSummary,
  onNavigateGradeSummary,
}: GradeProductVerificationScreenProps) {
  const [actualProduct, setActualProduct] = useState('Tomato');
  const [actualGrade, setActualGrade] = useState('Grade 1');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner (Exact match to Screenshot 2) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Grade & Product Verification</Text>
        </View>
        <Text style={styles.headerSubtitle}>{shipmentId}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Expected Info Card ─── */}
        <View style={styles.infoCard}>
          <View style={[styles.gridRow, { marginBottom: 0 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Expected Product</Text>
              <Text style={styles.gridValue}>{expectedProduct}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Expected Grade</Text>
              <Text style={styles.gridValue}>{expectedGrade}</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Actual Product Field ─── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Actual Product</Text>
          <TouchableOpacity style={styles.selectBox} activeOpacity={0.7}>
            <Text style={styles.selectText}>{actualProduct}</Text>
            <ChevronDownIcon size={16} />
          </TouchableOpacity>
        </View>

        {/* ─── 3. Actual Grade Field ─── */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Actual Grade</Text>
          <TouchableOpacity style={styles.selectBox} activeOpacity={0.7}>
            <Text style={styles.selectText}>{actualGrade}</Text>
            <ChevronDownIcon size={16} />
          </TouchableOpacity>
        </View>

        {/* ─── 4. Automatic Derivation Notice Box ─── */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Product Match/Mismatch and Grade Match/Mismatch are derived automatically from these two fields.
          </Text>
        </View>

        {/* ─── 5. 2x2 Action Cards Grid ─── */}
        <View style={styles.actionGrid}>
          {/* Row 1 */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={onNavigateProductMismatch ?? onContinueToMismatchReport}
              activeOpacity={0.8}
            >
              <ClipboardCheckIcon size={18} color={PALETTE.primary} />
              <Text style={styles.actionCardText}>Product Mismatch</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={onNavigateGradeMismatch ?? onContinueToMismatchReport}
              activeOpacity={0.8}
            >
              <StarIcon size={18} color={PALETTE.primary} />
              <Text style={styles.actionCardText}>Grade Mismatch</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={onNavigateProductSummary ?? onContinueToMismatchReport}
              activeOpacity={0.8}
            >
              <FileTextIcon size={18} color={PALETTE.primary} />
              <Text style={styles.actionCardText}>Product Summary</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={onNavigateGradeSummary ?? onContinueToMismatchReport}
              activeOpacity={0.8}
            >
              <FileTextIcon size={18} color={PALETTE.primary} />
              <Text style={styles.actionCardText}>Grade Summary</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ─── Pinned Bottom Action Button (Screenshot 2) ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onContinueToMismatchReport}
          activeOpacity={0.8}
        >
          <ArrowForwardIcon size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Continue to Damage / Mismatch Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.headerBg,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  backBtn: {
    padding: 2,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
    paddingLeft: 2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  infoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 5,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginBottom: 6,
  },
  selectBox: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    height: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  noticeBox: {
    backgroundColor: PALETTE.noticeBgOrange,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.noticeBorderOrange,
    padding: 14,
    marginBottom: 16,
  },
  noticeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.orangeDeep,
    lineHeight: 18,
  },
  actionGrid: {
    gap: 10,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  actionCardText: {
    fontSize: 12,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  bottomBar: {
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
  },
  actionBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 15,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
