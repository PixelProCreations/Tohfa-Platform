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
import Svg, { Path } from 'react-native-svg';
import { adminColors, adminShadow, adminSpacing } from '../../theme';

function BackArrowWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

export interface ReturnsRmaDetailData {
  id: string;
  rmaNumber: string;
  salesOrder: string;
  invoice: string;
  customer: string;
  purchaseDate: string;
  originalItems: string;
  paymentReference: string;
  productAndQty: string;
  reason: string;
  evidence: string;
  requestedDate: string;
  reviewStatus: 'Approved' | 'Pending' | 'Rejected';
  approvedQuantity: string;
  decisionReason: string;
  reviewer: string;
  refundStatus: string;
  refundReference: string;
  refundAmount: string;
  originalPayment: string;
  initiatedDate: string;
  completedDate: string;
  failureReason: string;
  history: { meta: string; title: string }[];
}

export interface ReturnsRmaDetailScreenProps {
  rma: ReturnsRmaDetailData;
  onBack: () => void;
}

export function ReturnsRmaDetailScreen({ rma, onBack }: ReturnsRmaDetailScreenProps) {
  const isApproved = rma.reviewStatus === 'Approved';
  const isRejected = rma.reviewStatus === 'Rejected';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Header Banner ── */}
      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to Returns"
        >
          <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Returns, {rma.rmaNumber}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Original transaction ── */}
        <Text style={styles.sectionHeading}>Original transaction</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sales order</Text>
            <Text style={styles.detailValueBold}>{rma.salesOrder}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Invoice</Text>
            <Text style={styles.detailValueBold}>{rma.invoice}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer</Text>
            <Text style={styles.detailValueBold}>{rma.customer}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purchase date</Text>
            <Text style={styles.detailValueBold}>{rma.purchaseDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Original items</Text>
            <Text style={styles.detailValueBold}>{rma.originalItems}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Payment reference</Text>
            <Text style={styles.detailValueBold}>{rma.paymentReference}</Text>
          </View>
        </View>

        {/* ── 2. Return request ── */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Return request</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>RMA</Text>
            <Text style={styles.detailValueBold}>{rma.rmaNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Product and quantity</Text>
            <Text style={styles.detailValueBold}>{rma.productAndQty}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reason</Text>
            <Text style={styles.detailValueBold}>{rma.reason}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Evidence</Text>
            <Text style={styles.detailValueBold}>{rma.evidence}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Requested</Text>
            <Text style={styles.detailValueBold}>{rma.requestedDate}</Text>
          </View>
        </View>

        {/* ── 3. Review and decision ── */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Review and decision</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Review status</Text>
            <Text
              style={[
                styles.detailValueBold,
                isApproved
                  ? { color: '#047857' }
                  : isRejected
                  ? { color: '#DC2626' }
                  : { color: '#B45309' },
              ]}
            >
              {rma.reviewStatus}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Approved quantity</Text>
            <Text style={styles.detailValueBold}>{rma.approvedQuantity}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Decision reason</Text>
            <Text style={styles.detailValueBold}>{rma.decisionReason}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Reviewer</Text>
            <Text style={styles.detailValueBold}>{rma.reviewer}</Text>
          </View>
        </View>

        {/* ── 4. Refund tracking ── */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Refund tracking</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Refund status</Text>
            <Text style={styles.detailValueBold}>{rma.refundStatus}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Refund reference</Text>
            <Text style={styles.detailValueBold}>{rma.refundReference}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Refund amount</Text>
            <Text style={styles.detailValueBold}>{rma.refundAmount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Original payment</Text>
            <Text style={styles.detailValueBold}>{rma.originalPayment}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Initiated</Text>
            <Text style={styles.detailValueBold}>{rma.initiatedDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Completed</Text>
            <Text style={styles.detailValueBold}>{rma.completedDate}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Failure reason</Text>
            <Text style={styles.detailValueBold}>{rma.failureReason || '—'}</Text>
          </View>
        </View>

        {/* ── 5. History ── */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>History</Text>
        <View style={styles.card}>
          {rma.history.map((h, i) => {
            const isLast = i === rma.history.length - 1;
            return (
              <View key={i} style={[styles.historyRow, isLast && styles.detailRowLast]}>
                <Text style={styles.historyMeta}>{h.meta}</Text>
                <Text style={styles.historyTitle}>{h.title}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: 8,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: 16,
    paddingBottom: adminSpacing.xxxl,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#8A4A00',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE8E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...adminShadow.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 12.5,
    color: '#6D6761',
    fontWeight: '500',
  },
  detailValueBold: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
    maxWidth: '60%',
    textAlign: 'right',
  },
  historyRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F0ECE4',
  },
  historyMeta: {
    fontSize: 11,
    color: '#786F68',
    marginBottom: 2,
  },
  historyTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
});
