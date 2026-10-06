import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { RmaRecord } from './SubWarehouseReturnsIssuesScreen';

// ─── Design Tokens (Primary Brand Color: #F0562A) ────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',
  greenIcon:     '#059669',
};

// ─── Icons ───────────────────────────────────────────────────────────────────
function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

export interface ReturnHistoryRecord {
  rmaId: string;
  orderId: string;
  customerName: string;
  reasonTag: string;
  status: 'Completed' | 'Rejected' | 'Approved';
  date: string;
  refundAmount?: string;
  inspectionResult?: string;
  returnedQuantity?: string;
  inspectionNotes?: string;
  decision?: string;
  decisionDate?: string;
  processedBy?: string;
  refundStatus?: string;
  refundMethod?: string;
  refundReference?: string;
  timeline?: Array<{
    id: string;
    title: string;
    time: string;
    isLast: boolean;
  }>;
}

export interface SubWarehouseReturnHistoryDetailScreenProps {
  record?: ReturnHistoryRecord;
  onBack: () => void;
}

export function SubWarehouseReturnHistoryDetailScreen({
  record,
  onBack,
}: SubWarehouseReturnHistoryDetailScreenProps) {
  const currentRecord: ReturnHistoryRecord = record || {
    rmaId: 'RMA-2026-00125',
    orderId: 'ORD-002145',
    customerName: 'Ravi Kumar',
    reasonTag: 'Damaged',
    status: 'Completed',
    date: '25 Sep 2026',
    refundAmount: '₹200',
    inspectionResult: 'Issue Confirmed',
    returnedQuantity: '1.8 KG',
    inspectionNotes: '2 KG received. 0.5 KG visibly damaged.',
    decision: 'Approved',
    decisionDate: '25 Sep 2026',
    processedBy: 'SWA – Suresh',
    refundStatus: 'Completed',
    refundMethod: 'TOHFA Wallet',
    refundReference: 'REF-2026-001245',
    timeline: [
      { id: '1', title: 'Issue Reported', time: '25 Sep, 10:30 AM', isLast: false },
      { id: '2', title: 'Inspection Completed', time: '25 Sep, 10:55 AM', isLast: false },
      { id: '3', title: 'Return Approved', time: '25 Sep, 11:20 AM', isLast: false },
      { id: '4', title: 'Refund Completed', time: '25 Sep, 11:22 AM', isLast: true },
    ],
  };

  const timeline = currentRecord.timeline || [
    { id: '1', title: 'Issue Reported', time: '25 Sep, 10:30 AM', isLast: false },
    { id: '2', title: 'Inspection Completed', time: '25 Sep, 10:55 AM', isLast: false },
    { id: '3', title: 'Return Approved', time: '25 Sep, 11:20 AM', isLast: false },
    { id: '4', title: 'Refund Completed', time: '25 Sep, 11:22 AM', isLast: true },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Return History Detail</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Section: Inspection ─── */}
        <Text style={styles.sectionHeader}>Inspection</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Inspection Result</Text>
              <Text style={styles.fieldBoldVal}>
                {currentRecord.inspectionResult || 'Issue Confirmed'}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Returned Quantity</Text>
              <Text style={styles.fieldBoldVal}>
                {currentRecord.returnedQuantity || '1.8 KG'}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.col}>
            <Text style={styles.fieldLabel}>Inspection Notes</Text>
            <Text style={styles.fieldBoldVal}>
              {currentRecord.inspectionNotes || '2 KG received. 0.5 KG visibly damaged.'}
            </Text>
          </View>
        </View>

        {/* ─── Section: Decision ─── */}
        <Text style={styles.sectionHeader}>Decision</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Decision</Text>
              <Text style={styles.fieldBoldVal}>
                {currentRecord.decision || (currentRecord.status === 'Rejected' ? 'Rejected' : 'Approved')}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Decision Date</Text>
              <Text style={styles.fieldBoldVal}>
                {currentRecord.decisionDate || currentRecord.date}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.col}>
            <Text style={styles.fieldLabel}>Processed By</Text>
            <Text style={styles.fieldBoldVal}>
              {currentRecord.processedBy || 'SWA – Suresh'}
            </Text>
          </View>
        </View>

        {/* ─── Section: Refund ─── */}
        <Text style={styles.sectionHeader}>Refund</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Refund Status</Text>
              <Text style={styles.fieldBoldVal}>
                {currentRecord.refundStatus || (currentRecord.status === 'Rejected' ? 'None' : 'Completed')}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Refund Method</Text>
              <Text style={styles.fieldBoldVal}>
                {currentRecord.refundMethod || (currentRecord.status === 'Rejected' ? 'N/A' : 'TOHFA Wallet')}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Amount</Text>
              <Text style={styles.fieldBoldVal}>
                {currentRecord.refundAmount || '₹200'}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Reference</Text>
              <Text style={styles.fieldBoldVal}>
                {currentRecord.refundReference || 'REF-2026-001245'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Section: Timeline ─── */}
        <Text style={styles.sectionHeader}>Timeline</Text>
        <View style={styles.timelineContainer}>
          {timeline.map((item) => (
            <View key={item.id} style={styles.timelineRow}>
              <View style={styles.timelineNodeCol}>
                <View style={styles.timelineRing}>
                  <View style={styles.timelineInnerDot} />
                </View>
                {!item.isLast && <View style={styles.timelineLine} />}
              </View>

              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 14,
    marginBottom: 10,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 6,
  },
  twoColRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  fieldBoldVal: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
    lineHeight: 18,
  },
  cardDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 12,
  },
  timelineContainer: {
    paddingLeft: 4,
    marginTop: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineNodeCol: {
    alignItems: 'center',
    width: 24,
  },
  timelineRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: PALETTE.greenIcon,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.greenIcon,
  },
  timelineLine: {
    width: 2,
    height: 28,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  timelineTextCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  timelineTime: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 3,
  },
});
