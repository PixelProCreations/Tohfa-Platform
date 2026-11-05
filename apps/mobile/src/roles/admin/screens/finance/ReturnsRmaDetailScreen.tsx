import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function UserAvatarIcon({ size = 22, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path
        d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ImagePlaceholderIcon({ size = 32, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Circle cx="8.5" cy="8.5" r="1.5" stroke={color} strokeWidth="1.5" />
      <Path
        d="M21 15l-5-5L5 21"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReturnsRmaDetailData {
  id?: string;
  rmaNumber?: string;
  salesOrder?: string;
  invoice?: string;
  customer?: string;
  customerPhone?: string;
  customerCode?: string;
  purchaseDate?: string;
  originalItems?: string;
  paymentReference?: string;
  productAndQty?: string;
  productName?: string;
  productGrade?: string;
  unitPrice?: string;
  lineTotal?: string;
  orderWarehouse?: string;
  orderType?: string;
  orderStatus?: string;
  reason?: string;
  evidence?: string;
  requestedDate?: string;
  reviewStatus?: 'Approved' | 'Pending' | 'Rejected' | string;
  approvedQuantity?: string;
  returnQuantity?: string;
  requestedResolution?: string;
  decisionReason?: string;
  reviewer?: string;
  refundStatus?: string;
  refundReference?: string;
  refundAmount?: string;
  originalPayment?: string;
  initiatedDate?: string;
  completedDate?: string;
  failureReason?: string;
  ticketId?: string;
  history?: { meta: string; title: string }[];
}

export interface ReturnsRmaDetailScreenProps {
  rma: ReturnsRmaDetailData;
  can?: ((permission: string) => boolean) | undefined;
  onBack: () => void;
}

export function ReturnsRmaDetailScreen({ rma, can, onBack }: ReturnsRmaDetailScreenProps) {
  const [intimated, setIntimated] = useState(false);

  const rmaNumber = rma.rmaNumber || 'RMA-2026-00125';
  const customerName = rma.customer || 'Ravi Kumar';
  const customerCode = rma.customerCode || 'CUS-001245';
  const customerPhone = rma.customerPhone || '+91 XXXXX XXXXX';
  const orderId = rma.salesOrder || 'ORD-002145';
  const orderDate = rma.purchaseDate || '24 Sep 2026';
  const warehouse = rma.orderWarehouse || 'Coonoor Warehouse';
  const orderType = rma.orderType || 'Online Order';
  const paymentStatus = rma.orderStatus || 'Paid';
  const productName = rma.productName || 'Tomato';
  const productGrade = rma.productGrade || 'Grade 1';
  const productQty = rma.productAndQty || '5 KG';
  const unitPrice = rma.unitPrice || '₹100 / KG';
  const lineTotal = rma.lineTotal || '₹500';
  const reason = rma.reason || 'Damaged';
  const reportedDate = rma.requestedDate || '25 Sep 2026';
  const description = rma.evidence || 'Customer reported damaged produce after pickup.';
  const ticketId = rma.ticketId || 'TKT-2026-00125';
  const returnQuantity = rma.returnQuantity || rma.approvedQuantity || '2 KG';
  const requestedResolution = rma.requestedResolution || 'Refund';

  const handleIntimatePayout = () => {
    // RBAC permission check for returns payout / refund processing
    const hasPermission = can
      ? can('rma.refund.approve') ||
        can('rma.refund.wallet_process') ||
        can('payout.farmer.initiate') ||
        can('sales.return.review')
      : true;

    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'You do not have permission (rma.refund.approve) to intimate payout for this return.'
      );
      return;
    }

    Alert.alert(
      'Intimate Payout',
      `Confirm payout intimation of ₹200 for ${customerName} (${rmaNumber})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setIntimated(true);
            Alert.alert(
              'Payout Intimated',
              `Payout intimation for ${rmaNumber} has been successfully recorded and sent to Accounts & Finance.`
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Orange Header Banner ── */}
      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Return Detail</Text>
          <Text style={styles.headerSubtitle}>{rmaNumber} • Under Review</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Customer Card ── */}
        <View style={styles.card}>
          <View style={styles.customerRow}>
            <View style={styles.avatarWrap}>
              <UserAvatarIcon size={22} color={adminColors.brand} />
            </View>
            <View style={styles.customerMeta}>
              <Text style={styles.customerName}>{customerName}</Text>
              <Text style={styles.customerCode}>
                {customerCode} · {customerPhone}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 2. Order Information Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Order Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order ID</Text>
            <Text style={styles.infoValue}>{orderId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order Date</Text>
            <Text style={styles.infoValue}>{orderDate}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Warehouse</Text>
            <Text style={styles.infoValue}>{warehouse}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order Type</Text>
            <Text style={styles.infoValue}>{orderType}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Payment Status</Text>
            <Text style={styles.infoValue}>{paymentStatus}</Text>
          </View>
        </View>

        {/* ── 3. Product Information Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Product Information</Text>
          <View style={styles.productHeaderRow}>
            <Text style={styles.productName}>{productName}</Text>
            <Text style={styles.productQty}>{productQty}</Text>
          </View>
          <Text style={styles.productGrade}>{productGrade}</Text>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <View style={styles.priceCol}>
              <Text style={styles.infoLabel}>Unit Price</Text>
              <Text style={styles.priceValue}>{unitPrice}</Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.infoLabel}>Line Total</Text>
              <Text style={styles.priceValue}>{lineTotal}</Text>
            </View>
          </View>
        </View>

        {/* ── 4. Return / Issue Information Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Return / Issue Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reason</Text>
            <View style={styles.warningPill}>
              <Text style={styles.warningPillText}>{reason}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reported Date</Text>
            <Text style={styles.infoValue}>{reportedDate}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast, { flexDirection: 'column', alignItems: 'flex-start', paddingTop: adminSpacing.sm }]}>
            <Text style={[styles.infoLabel, { marginBottom: 4 }]}>Description</Text>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        </View>

        {/* ── 5. Customer Evidence Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Customer Evidence</Text>
          <View style={styles.evidenceGrid}>
            <View style={styles.evidenceBox}>
              <ImagePlaceholderIcon size={28} color={adminColors.muted} />
            </View>
            <View style={styles.evidenceBox}>
              <ImagePlaceholderIcon size={28} color={adminColors.muted} />
            </View>
          </View>
        </View>

        {/* ── 6. Ticket Information Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Ticket Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ticket ID</Text>
            <Text style={styles.infoValue}>{ticketId}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>RMA Number</Text>
            <Text style={styles.infoValue}>{rmaNumber}</Text>
          </View>
        </View>

        {/* ── 7. Return Details Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Return Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Return Quantity</Text>
            <Text style={styles.infoValue}>{returnQuantity}</Text>
          </View>
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>Requested Resolution</Text>
            <Text style={styles.infoValue}>{requestedResolution}</Text>
          </View>
        </View>

        {/* ── 8. Timeline Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Timeline</Text>
          <View style={styles.timelineWrap}>
            {/* Step 1 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: adminColors.success.text }]} />
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineRight}>
                <Text style={styles.timelineTitle}>Issue Reported</Text>
                <Text style={styles.timelineMeta}>25 Sep 2026, 10:30 AM</Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: adminColors.success.text }]} />
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineRight}>
                <Text style={styles.timelineTitle}>RMA Created</Text>
                <Text style={styles.timelineMeta}>25 Sep 2026, 10:30 AM</Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: adminColors.success.text }]} />
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineRight}>
                <Text style={styles.timelineTitle}>Assigned for Review</Text>
                <Text style={styles.timelineMeta}>25 Sep 2026, 10:35 AM</Text>
              </View>
            </View>

            {/* Step 4 */}
            <View style={[styles.timelineItem, { paddingBottom: 0 }]}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: adminColors.warning.text }]} />
              </View>
              <View style={styles.timelineRight}>
                <Text style={styles.timelineTitle}>Inspection Pending</Text>
                <Text style={styles.timelineMeta}>25 Sep 2026, 10:40 AM</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── 9. Bottom Action Button ── */}
        <View style={styles.actionWrap}>
          <TouchableOpacity
            style={[styles.intimatePayoutBtn, intimated && styles.intimatePayoutBtnDone]}
            onPress={handleIntimatePayout}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Intimate Payout"
          >
            <Text style={[styles.intimatePayoutBtnText, intimated && styles.intimatePayoutBtnTextDone]}>
              {intimated ? 'Payout Intimated ✓' : 'Intimate Payout'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  backButton: {
    padding: adminSpacing.xs,
    marginRight: adminSpacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.lg,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  cardHeading: {
    fontSize: 13.5, fontWeight: '700',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  customerMeta: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  customerCode: {
    fontSize: 12.5,
    color: adminColors.muted,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoLabel: {
    fontSize: 12.5, fontWeight: '500',
    color: adminColors.muted,
  },
  infoValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  productHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  productQty: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  productGrade: {
    fontSize: 12.5,
    color: adminColors.muted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceCol: {
    flex: 1,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: 4,
  },
  warningPill: {
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 3,
    borderRadius: adminRadius.sm,
  },
  warningPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: adminColors.warning.text,
  },
  descriptionText: {
    fontSize: 13,
    color: adminColors.ink,
    lineHeight: 18,
  },
  evidenceGrid: {
    flexDirection: 'row',
    gap: adminSpacing.md,
  },
  evidenceBox: {
    width: 84,
    height: 84,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineWrap: {
    paddingLeft: adminSpacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: adminSpacing.lg,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 20,
    marginRight: adminSpacing.sm,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: adminColors.border,
    marginTop: 4,
  },
  timelineRight: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  timelineMeta: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 2,
  },
  actionWrap: {
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  intimatePayoutBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  intimatePayoutBtnDone: {
    backgroundColor: adminColors.success.bg,
    borderColor: adminColors.success.border,
  },
  intimatePayoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.brand,
  },
  intimatePayoutBtnTextDone: {
    color: adminColors.success.text,
  },
});
