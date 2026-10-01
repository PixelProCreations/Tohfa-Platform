import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { RmaRecord } from './SubWarehouseReturnsIssuesScreen';

// ─── Design Tokens (Primary Brand Color: #F0562A) ────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',
  greenBg:       '#ECFDF5',
  greenBorder:   '#A7F3D0',
  greenText:     '#059669',
  redBg:         '#FEF2F2',
  redBorder:     '#FECACA',
  redText:       '#DC2626',
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

function CheckmarkIcon({ size = 18, color = '#059669' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseCrossIcon({ size = 18, color = '#DC2626' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function QuestionCircleIcon({ size = 18, color = '#059669' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export interface SubWarehouseReviewReturnRequestScreenProps {
  rma: RmaRecord;
  inspectedQty?: string;
  inspectionNotes?: string;
  onBack: () => void;
  onApprove?: (rma: RmaRecord) => void;
  onReject?: (rma: RmaRecord) => void;
  onDecision?: (decision: {
    status: 'Approved' | 'Rejected';
    approvedQty: string;
    refundAmount: string;
  }) => void;
}

export function SubWarehouseReviewReturnRequestScreen({
  rma,
  inspectedQty = '1.8 KG',
  inspectionNotes = 'Product partially damaged...',
  onBack,
  onApprove,
  onReject,
  onDecision,
}: SubWarehouseReviewReturnRequestScreenProps) {
  const handleApprove = () => {
    if (onApprove) {
      onApprove(rma);
    } else if (onDecision) {
      onDecision({
        status: 'Approved',
        approvedQty: inspectedQty,
        refundAmount: '₹200.00',
      });
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(rma);
    } else if (onDecision) {
      onDecision({
        status: 'Rejected',
        approvedQty: '0 KG',
        refundAmount: '₹0.00',
      });
    }
  };

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
            <Text style={styles.headerTitle}>Review Return Request</Text>
            <Text style={styles.headerSubtitle}>{rma.rmaId}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── RMA Summary ─── */}
        <Text style={styles.sectionHeader}>RMA Summary</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Customer</Text>
              <Text style={styles.fieldBoldVal}>{rma.customerName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Order</Text>
              <Text style={styles.fieldBoldVal}>{rma.orderId}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Issue</Text>
              <Text style={styles.fieldBoldVal}>{rma.issueCategory}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Requested Quantity</Text>
              <Text style={styles.fieldBoldVal}>{rma.requestedQuantity}</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.col}>
            <Text style={styles.fieldLabel}>Inspected Quantity</Text>
            <Text style={styles.fieldBoldVal}>{inspectedQty}</Text>
          </View>
        </View>

        {/* ─── Evidence Summary ─── */}
        <Text style={styles.sectionHeader}>Evidence Summary</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Customer Evidence</Text>
              <Text style={styles.fieldBoldVal}>2 Photos</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Inspection Evidence</Text>
              <Text style={styles.fieldBoldVal}>3 Photos</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.col}>
            <Text style={styles.fieldLabel}>Inspection Notes</Text>
            <Text style={styles.notesText}>{inspectionNotes}</Text>
          </View>
        </View>

        {/* ─── Review Timeline ─── */}
        <Text style={styles.sectionHeader}>Review Timeline</Text>
        <View style={styles.timelineContainer}>
          {[
            { title: 'Issue Reported', isLast: false },
            { title: 'RMA Created', isLast: false },
            { title: 'Inspection Completed', isLast: false },
            { title: 'Ready for Review', isLast: true },
          ].map((item, idx) => (
            <View key={idx} style={styles.timelineRow}>
              <View style={styles.timelineNodeCol}>
                <View style={styles.timelineRing}>
                  <View style={styles.timelineInnerDot} />
                </View>
                {!item.isLast && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ─── Decision Section ─── */}
        <Text style={styles.sectionHeader}>Decision</Text>
        <View style={styles.decisionRow}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={handleReject}
            activeOpacity={0.8}
          >
            <CloseCrossIcon size={16} color="#DC2626" />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.approveBtn}
            onPress={handleApprove}
            activeOpacity={0.8}
          >
            <CheckmarkIcon size={16} color="#059669" />
            <Text style={styles.approveBtnText}>Approve</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
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
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* Section Header */
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 8,
    marginTop: 12,
  },

  /* Card */
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
  },
  twoColRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  fieldBoldVal: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  cardDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 10,
  },
  notesText: {
    fontSize: 13,
    color: PALETTE.textInk,
    fontWeight: '600',
    lineHeight: 18,
  },

  /* Timeline */
  timelineContainer: {
    paddingLeft: 4,
    marginBottom: 8,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#059669',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: '#EBE5DC',
    marginVertical: 2,
  },
  timelineTextCol: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 14,
    justifyContent: 'center',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  /* Decision Row (Side by side Reject / Approve buttons) */
  decisionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.redBg,
    borderWidth: 1.5,
    borderColor: PALETTE.redBorder,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
  },
  rejectBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.redText,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.greenBg,
    borderWidth: 1.5,
    borderColor: PALETTE.greenBorder,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
  },
  approveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.greenText,
  },

  /* Confirm Approve Card (Screenshot 4) */
  confirmApproveCard: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
  },
  confirmApproveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  confirmApproveTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#059669',
  },
  confirmApproveBox: {
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  confirmApproveText: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    lineHeight: 18,
  },
  confirmApproveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 12,
    paddingVertical: 13,
    gap: 8,
    marginBottom: 10,
  },
  confirmApproveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  confirmCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingVertical: 13,
    gap: 8,
  },
  confirmCancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#8D4321',
  },
});
