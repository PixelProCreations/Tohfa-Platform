import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { Can } from '../../permissions/can';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { t, type TranslationKey } from '../../i18n';
import { formatKg } from '../../money/quantity';
import type { ReturnStatus } from '../../api/returns';
import { isReturnStatus, RETURN_ORDER_CODE } from '../warehouse/returns-rma/mappers';
import { useReturn, useReturnOrder } from '../warehouse/returns-rma/useReturnsData';
import type { ReturnDetailView } from '../warehouse/returns-rma/types';
import { AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

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

// ─── Status ───

type BadgeTone = 'amber' | 'green' | 'red';

/** Label and badge tone of each docs/openapi.yaml ReturnStatus; anything else reads "Unknown". */
const FINANCE_RETURN_VIEW: Readonly<Record<ReturnStatus, { labelKey: TranslationKey; tone: BadgeTone; closed: boolean }>> = {
  PENDING: { labelKey: 'wiringPayouts.returnStatus.PENDING', tone: 'amber', closed: false },
  INSPECTED: { labelKey: 'wiringPayouts.returnStatus.INSPECTED', tone: 'amber', closed: false },
  APPROVED: { labelKey: 'wiringPayouts.returnStatus.APPROVED', tone: 'green', closed: false },
  REJECTED: { labelKey: 'wiringPayouts.returnStatus.REJECTED', tone: 'red', closed: true },
  REFUND_PENDING_BANK: { labelKey: 'wiringPayouts.returnStatus.REFUND_PENDING_BANK', tone: 'amber', closed: false },
  REFUNDED: { labelKey: 'wiringPayouts.returnStatus.REFUNDED', tone: 'green', closed: true },
};

export function financeReturnView(status: string): { labelKey: TranslationKey; tone: BadgeTone; closed: boolean } {
  return isReturnStatus(status)
    ? FINANCE_RETURN_VIEW[status]
    : { labelKey: 'wiringPayouts.returnStatus.unknown', tone: 'amber', closed: false };
}

// ─── Types ───────────────────────────────────────────────────────────────────

/** Kept for the finance barrel (screens/finance/index.ts): the detail is now the API's return. */
export type ReturnsRmaDetailData = ReturnDetailView;

export interface ReturnsRmaDetailScreenProps {
  /** The return uuid; the screen reads it with GET /admin/returns/{id} (useReturn). */
  returnId: string;
  can?: Can | undefined;
  onBack: () => void;
}

/**
 * One return, read from the server (useReturn: the return plus its status
 * history) and, when the caller may read orders, its order (useReturnOrder).
 * Nothing is rebuilt from the list row and nothing is invented: a value the
 * API does not carry (product, grade, unit price, line total, ticket id,
 * requested resolution) is the dash.
 */
export function ReturnsRmaDetailScreen({ returnId, can, onBack }: ReturnsRmaDetailScreenProps) {
  const live = useReturn(undefined, returnId);
  const detail = live.detail;
  const mayReadOrder = typeof can === 'function' && can(RETURN_ORDER_CODE);
  const { order } = useReturnOrder(undefined, mayReadOrder ? detail?.orderId : undefined);

  const rmaNumber = detail?.reference ?? ADMIN_NO_VALUE;
  const statusLabel = detail === undefined ? ADMIN_NO_VALUE : t(financeReturnView(detail.status).labelKey);
  const customerName = order?.buyerName || ADMIN_NO_VALUE;
  const customerCode = order?.customerCode ?? ADMIN_NO_VALUE;
  const customerPhone = order?.mobileMasked ?? ADMIN_NO_VALUE;
  const orderId = order?.orderNumber || ADMIN_NO_VALUE;
  const orderDate = order?.placedLabel || ADMIN_NO_VALUE;
  const warehouse = order?.warehouseName || ADMIN_NO_VALUE;
  const orderType = order?.channelLabel || ADMIN_NO_VALUE;
  const paymentStatus = order?.paymentStatusLabel || ADMIN_NO_VALUE;
  // The return items carry an order-item id only: no product name, grade or price.
  const productName = ADMIN_NO_VALUE;
  const productGrade = ADMIN_NO_VALUE;
  const singleItem = detail !== undefined && detail.items.length === 1 ? detail.items[0] : undefined;
  const productQty = singleItem === undefined ? ADMIN_NO_VALUE : formatKg(singleItem.requestedGrams);
  const unitPrice = ADMIN_NO_VALUE;
  const lineTotal = ADMIN_NO_VALUE;
  const reason = detail?.reason || ADMIN_NO_VALUE;
  const reportedDate = detail?.created || ADMIN_NO_VALUE;
  const description = detail?.note ?? ADMIN_NO_VALUE;
  const ticketId = ADMIN_NO_VALUE;
  const returnQuantity = productQty;
  const requestedResolution = ADMIN_NO_VALUE;

  if (detail === undefined) {
    return (
      <SafeAreaView style={styles.root}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
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
          </View>
        </View>
        {live.error ? (
          <AdminErrorState error={live.error} onRetry={live.refresh} />
        ) : (
          <AdminLoadingState label={t('wiringPayouts.returns.loading')} />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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
          <Text style={styles.headerSubtitle}>{rmaNumber} • {statusLabel}</Text>
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
            {/* The server's status trail (GET /admin/returns/{id}/history), oldest first. */}
            {live.timeline.length === 0 ? (
              <View style={[styles.timelineItem, { paddingBottom: 0 }]}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { backgroundColor: adminColors.warning.text }]} />
                </View>
                <View style={styles.timelineRight}>
                  <Text style={styles.timelineTitle}>{t('wiringPayouts.returns.detail.noHistory')}</Text>
                  <Text style={styles.timelineMeta}>{ADMIN_NO_VALUE}</Text>
                </View>
              </View>
            ) : (
              live.timeline.map((entry, index) => {
                const last = index === live.timeline.length - 1;
                return (
                  <View key={entry.id} style={[styles.timelineItem, last && { paddingBottom: 0 }]}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineDot, { backgroundColor: last ? adminColors.warning.text : adminColors.success.text }]} />
                      {last ? null : <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineRight}>
                      <Text style={styles.timelineTitle}>{entry.title}</Text>
                      <Text style={styles.timelineMeta}>{entry.note ? `${entry.time} · ${entry.note}` : entry.time}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* ── 9. Bottom Action Button ── */}
        {/* Intimate Payout — no endpoint exists; disabled per R3 */}
        <View style={styles.actionWrap}>
          <TouchableOpacity
            style={[styles.intimatePayoutBtn, styles.actionUnavailable]}
            disabled
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel="Intimate Payout"
            accessibilityState={{ disabled: true }}
          >
            <Text style={styles.intimatePayoutBtnText}>Intimate Payout</Text>
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
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerSubtitle: {
    ...adminType.caption,
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
    ...adminType.sectionHead,
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
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  customerCode: {
    ...adminType.caption,
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
    ...adminType.body,
    fontWeight: '500',
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
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  productQty: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  productGrade: {
    ...adminType.caption,
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
    ...adminType.rowTitle,
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
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.warning.text,
  },
  descriptionText: {
    ...adminType.body,
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
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  timelineMeta: {
    ...adminType.caption,
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
    ...adminType.sectionHead,
    color: adminColors.brand,
  },
  intimatePayoutBtnTextDone: {
    color: adminColors.success.text,
  },
  actionUnavailable: {
    opacity: 0.5,
  },
});
