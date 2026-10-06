import React from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary:            '#F0562A', // Brand Orange
  headerBg:           '#F0562A',
  headerText:         '#FFFFFF',

  orangeDeep:         '#7A2E14', // Deep Orange / Terracotta for section headings
  noticeBgOrange:     '#FDF3F0', // Pure Brand Orange Tint (NO yellow)
  noticeBorderOrange: '#F7CFC4', // Soft Orange border
  pageBg:             '#F3EFE9', // Canvas soft cream

  textInk:            '#1A1A1A',
  textSecondary:      '#5F5E5A',
  border:             '#EEDCD3',
  borderRow:          '#F2ECE5',
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

function EyeIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
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

function HistoryIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QrCodeIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Path d="M14 14h3v3h-3zM17 17h4v4h-4zM14 20h3" fill={color} />
    </Svg>
  );
}

export interface GoodsReceiptSummaryScreenProps {
  grnId?: string;
  shipmentId?: string;
  source?: string;
  destination?: string;
  date?: string;
  expectedQty?: string;
  receivedQty?: string;
  acceptedQty?: string;
  rejectedQty?: string;
  onBack?: () => void;
  onAssignBatch?: () => void;
  onViewPreview?: () => void;
  onViewDetail?: () => void;
  onViewActivity?: () => void;
}

export function GoodsReceiptSummaryScreen({
  grnId = 'GRN-000842',
  shipmentId = 'SHP-000124',
  source = 'Farmer Admin',
  destination = 'Coonoor',
  date = '25 Sep 2026',
  expectedQty = '500 KG',
  receivedQty = '480 KG',
  acceptedQty = '445 KG',
  rejectedQty = '55 KG',
  onBack,
  onAssignBatch,
  onViewPreview,
  onViewDetail,
  onViewActivity,
}: GoodsReceiptSummaryScreenProps) {
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
          <Text style={styles.headerTitle}>Goods Receipt Summary</Text>
        </View>
        <Text style={styles.headerSubtitle}>{grnId}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Shipment Information Section ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Shipment</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Shipment ID</Text>
              <Text style={styles.gridValue}>{shipmentId}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Source</Text>
              <Text style={styles.gridValue}>{source}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginBottom: 0 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Destination</Text>
              <Text style={styles.gridValue}>{destination}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Date</Text>
              <Text style={styles.gridValue}>{date}</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Quantity Breakdown Section ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quantity</Text>
        </View>

        <View style={styles.listCard}>
          <View style={styles.listRow}>
            <Text style={styles.listLabel}>Expected</Text>
            <Text style={styles.listValue}>{expectedQty}</Text>
          </View>
          <View style={styles.listRow}>
            <Text style={styles.listLabel}>Received</Text>
            <Text style={styles.listValue}>{receivedQty}</Text>
          </View>
          <View style={styles.listRow}>
            <Text style={styles.listLabel}>Accepted</Text>
            <Text style={styles.listValue}>{acceptedQty}</Text>
          </View>
          <View style={[styles.listRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.listLabel}>Rejected</Text>
            <Text style={styles.listValue}>{rejectedQty}</Text>
          </View>
        </View>

        {/* ─── 3. Decision Section ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Decision</Text>
        </View>

        <View style={styles.decisionCard}>
          <Text style={styles.decisionValue}>PARTIAL ACCEPT</Text>
        </View>

        {/* ─── 4. Next Steps Section ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Next Steps</Text>
        </View>

        <TouchableOpacity style={styles.nextStepCard} onPress={onAssignBatch} activeOpacity={0.8}>
          <Text style={styles.nextStepTitle}>Assign Batch →</Text>
        </TouchableOpacity>

        {/* 3 Grid Actions (Preview, Full Detail, Activity) */}
        <View style={styles.actionGridRow}>
          <TouchableOpacity
            style={styles.actionGridCard}
            activeOpacity={0.8}
            onPress={onViewPreview || onAssignBatch}
          >
            <EyeIcon size={18} color={PALETTE.primary} />
            <Text style={styles.actionGridLabel}>Preview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionGridCard}
            activeOpacity={0.8}
            onPress={onViewDetail || onAssignBatch}
          >
            <FileTextIcon size={18} color={PALETTE.primary} />
            <Text style={styles.actionGridLabel}>Full Detail</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionGridCard}
            activeOpacity={0.8}
            onPress={onViewActivity || onAssignBatch}
          >
            <HistoryIcon size={18} color={PALETTE.primary} />
            <Text style={styles.actionGridLabel}>Activity</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 5. Receipt Reference ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Receipt Reference</Text>
        </View>

        <TouchableOpacity
          style={styles.referenceCard}
          onPress={() => Alert.alert('Receipt Reference', `${grnId} for Shipment ${shipmentId} is recorded in warehouse ledger.`)}
          activeOpacity={0.8}
        >
          <Text style={styles.referenceText}>{grnId}</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ─── Pinned Bottom Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onAssignBatch}
          activeOpacity={0.8}
        >
          <QrCodeIcon size={20} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Assign Batch</Text>
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
  listCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 18,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.borderRow,
  },
  listLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  listValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  decisionCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  decisionValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.primary,
    letterSpacing: 0.5,
  },
  nextStepCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  nextStepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  actionGridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionGridCard: {
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
  actionGridLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  referenceCard: {
    backgroundColor: PALETTE.noticeBgOrange,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.noticeBorderOrange,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  referenceText: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    letterSpacing: 0.5,
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
