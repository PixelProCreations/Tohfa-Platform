import React from 'react';
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

export interface BatchAssignmentScreenProps {
  grnId?: string;
  warehouseName?: string;
  productName?: string;
  grade?: string;
  acceptedQty?: string;
  onBack?: () => void;
  onReviewBatch?: () => void;
}

export function BatchAssignmentScreen({
  grnId = 'GRN-000842',
  warehouseName = 'Coonoor',
  productName = 'Tomato',
  grade = 'Grade 2 (actual)',
  acceptedQty = '445 KG',
  onBack,
  onReviewBatch,
}: BatchAssignmentScreenProps) {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner (Exact match to Image 1 Screen 1) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn}>
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Batch Assignment</Text>
        </View>
        <Text style={styles.headerSubtitle}>{grnId}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top Notice Box (Brand Orange Tint - NO yellow) ─── */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Acceptance creates an inventory batch with warehouse, crop, grade, source reference, and storage information, plus a RECEIPT ledger movement — never a manual balance edit.
          </Text>
        </View>

        {/* ─── Batch Information Section ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Batch Information</Text>
        </View>

        <View style={styles.infoCard}>
          {/* Row 1 */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Goods Receipt</Text>
              <Text style={styles.gridValue}>{grnId}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Warehouse</Text>
              <Text style={styles.gridValue}>{warehouseName}</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Product</Text>
              <Text style={styles.gridValue}>{productName}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Grade</Text>
              <Text style={styles.gridValue}>{grade}</Text>
            </View>
          </View>

          {/* Row 3 */}
          <View style={[styles.gridRow, { marginBottom: 0 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Accepted Quantity</Text>
              <Text style={styles.gridValue}>{acceptedQty}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Unit</Text>
              <Text style={styles.gridValue}>KG</Text>
            </View>
          </View>
        </View>

        {/* ─── Bottom Farmer Traceability Disclaimer Notice Box ─── */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Source farmer information is for internal traceability only and is never exposed in customer-facing product UI.
          </Text>
        </View>

        {/* ─── Action Button: Review Before Creating Batch ─── */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onReviewBatch}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>Review Before Creating Batch</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
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
  noticeBox: {
    backgroundColor: PALETTE.noticeBgOrange,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.noticeBorderOrange,
    padding: 14,
    marginBottom: 20,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.orangeDeep,
    lineHeight: 17.5,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    letterSpacing: -0.2,
  },
  infoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
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
  secondaryBtn: {
    backgroundColor: '#FDF3F0',
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#F7CFC4',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
  },
});
