import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
  borderRow:          '#F2ECE5',
  cardBg:             '#FFFFFF',
  redText:            '#E24B4A',
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

export interface PartialAcceptanceScreenProps {
  shipmentId?: string;
  productName?: string;
  receivedQtyNum?: number;
  onBack?: () => void;
  onContinueToSummary?: () => void;
}

export function PartialAcceptanceScreen({
  shipmentId = 'SHP-000124',
  productName = 'Tomato',
  receivedQtyNum = 480,
  onBack,
  onContinueToSummary,
}: PartialAcceptanceScreenProps) {
  const [acceptedVal, setAcceptedVal] = useState('445');

  const acceptedNum = parseInt(acceptedVal, 10) || 0;
  const calculatedRejected = Math.max(0, receivedQtyNum - acceptedNum);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Partial Acceptance / Rejection</Text>
        </View>
        <Text style={styles.headerSubtitle}>{shipmentId} · Product-level decision</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Product Table Summary ─── */}
        <View style={styles.tableCard}>
          {/* Header Row */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.headerCol, { flex: 1.25 }]}>PRODUCT</Text>
            <Text style={[styles.headerCol, { flex: 1 }]}>RECEIVED</Text>
            <Text style={[styles.headerCol, { flex: 1 }]}>ACCEPTED</Text>
            <Text style={[styles.headerCol, { flex: 1, textAlign: 'right' }]}>REJECTED</Text>
          </View>

          {/* Row */}
          <View style={styles.tableDataRow}>
            <Text style={[styles.cellText, { flex: 1.25, fontWeight: '800' }]}>
              {productName}
            </Text>
            <Text style={[styles.cellText, { flex: 1 }]}>
              {receivedQtyNum} KG
            </Text>
            <Text style={[styles.cellText, { flex: 1 }]}>
              {acceptedNum} KG
            </Text>
            <Text style={[styles.cellText, { flex: 1, textAlign: 'right', color: PALETTE.redText }]}>
              {calculatedRejected} KG
            </Text>
          </View>
        </View>

        {/* ─── 2. Validation Notice Box (Orange Palette) ─── */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Validated automatically: Accepted + Rejected = Received for every product — the form never allows Accepted or Rejected to exceed Received.
          </Text>
        </View>

        {/* ─── 3. Detail Form Section ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Partial Acceptance Detail — {productName}</Text>
        </View>

        {/* Accepted Quantity Input */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Accepted Quantity</Text>
          <View style={styles.inputBoxActive}>
            <TextInput
              style={styles.inputText}
              value={acceptedVal}
              onChangeText={setAcceptedVal}
              keyboardType="numeric"
            />
            <Text style={styles.inputUnit}>KG</Text>
          </View>
        </View>

        {/* Rejected (calculated) Card */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Rejected (calculated)</Text>
          <View style={styles.readOnlyBox}>
            <Text style={styles.readOnlyValue}>{calculatedRejected} KG</Text>
          </View>
        </View>

        {/* Outlined Action Button */}
        <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8}>
          <Text style={styles.secondaryBtnText}>Add Rejection Detail</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ─── Pinned Bottom Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onContinueToSummary}
          activeOpacity={0.8}
        >
          <ArrowForwardIcon size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Continue to Goods Receipt Summary</Text>
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
  tableCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerCol: {
    fontSize: 11,
    fontWeight: '800',
    color: PALETTE.textSecondary,
    letterSpacing: 0.5,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: PALETTE.borderRow,
  },
  cellText: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  noticeBox: {
    backgroundColor: PALETTE.noticeBgOrange,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.noticeBorderOrange,
    padding: 14,
    marginBottom: 20,
  },
  noticeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.orangeDeep,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    letterSpacing: -0.2,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginBottom: 6,
  },
  inputBoxActive: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    height: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    flex: 1,
    padding: 0,
  },
  inputUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  readOnlyBox: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    height: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  readOnlyValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  secondaryBtn: {
    backgroundColor: '#FDF3F0',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F7CFC4',
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  secondaryBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
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
