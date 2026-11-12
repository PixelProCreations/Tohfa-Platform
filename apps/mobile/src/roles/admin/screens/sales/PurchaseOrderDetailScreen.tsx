/**
 * Purchase Order Detail: unified RBAC screen for both:
 *   1. Sales / Warehouse Purchase Order Receipt Detail (when `order` is provided;
 *      `onOpenReceipt` gated by `receiving.receipt.view` / `purchase.order.view`).
 *   2. Farmer Admin Procurement Purchase Order & Negotiation Detail (when `orderId`
 *      is provided without `order`; listing/handover gated by RBAC `can`).
 *
 * Absorbs `screens/dashboard/PurchaseOrderDetailScreen.tsx`.
 */
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
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { BackArrowIcon, CheckCircleIcon } from '../../components/AdminIcons';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { ADMIN_BUTTON_HEIGHT, adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import type { PurchaseOrderRecord } from '../warehouse/sales-direct/types';

function TargetPlusIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ReceiptIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 2v18l2.5-1.5L9 20l2.5-1.5L14 20l2.5-1.5L19 20l2.5-1.5V2H4z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="8" y1="6" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="10" x2="16" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function HourglassIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface PurchaseOrderDetailScreenProps {
  onBack: () => void;
  can?: Can | undefined;
  /** Warehouse/Sales PO record mode. */
  order?: PurchaseOrderRecord | undefined;
  onOpenReceipt?: (() => void) | undefined;
  /** Farmer procurement PO detail mode. */
  orderId?: string | undefined;
  onViewOriginalListing?: (() => void) | undefined;
  onProcessHandover?: (() => void) | undefined;
}

export function PurchaseOrderDetailScreen({
  order,
  orderId,
  can,
  onBack,
  onOpenReceipt,
  onViewOriginalListing,
  onProcessHandover,
}: PurchaseOrderDetailScreenProps) {
  if (order) {
    return <SalesPurchaseOrderDetail order={order} can={can} onBack={onBack} onOpenReceipt={onOpenReceipt} />;
  }
  return (
    <ProcurementPurchaseOrderDetail
      orderId={orderId}
      can={can}
      onBack={onBack}
      onViewOriginalListing={onViewOriginalListing}
      onProcessHandover={onProcessHandover}
    />
  );
}

function SalesPurchaseOrderDetail({
  order,
  can,
  onBack,
  onOpenReceipt,
}: {
  order: PurchaseOrderRecord;
  can?: Can | undefined;
  onBack: () => void;
  onOpenReceipt?: (() => void) | undefined;
}) {
  const canOpenReceipt = can ? (can('receiving.receipt.view') || can('purchase.order.view')) : true;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to purchase orders"
        >
          <BackArrowIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Purchase order {order.poNumber}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeading}>Purchase order {order.poNumber}</Text>

        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PO number</Text>
            <Text style={styles.detailValueBold}>{order.poNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Source listing</Text>
            <Text style={styles.detailValueBold}>{order.listingCode}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Farmer</Text>
            <Text style={styles.detailValueBold}>{order.farmerName} (FMR-00098)</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Product, grade</Text>
            <Text style={styles.detailValueBold}>
              {order.produceName} · {order.grade}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ordered quantity</Text>
            <Text style={styles.detailValueBold}>{order.quantityKg} kg</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Original listing price</Text>
            <Text style={styles.detailValueBold}>₹{order.unitPrice.toFixed(2)}/kg</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Accepted counter-offer</Text>
            <Text style={styles.detailValueBold}>None</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Final agreed terms</Text>
            <Text style={styles.detailValueBold}>
              ₹{order.unitPrice.toFixed(2)}/kg · total ₹
              {order.totalPrice.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Warehouse</Text>
            <Text style={styles.detailValueBold}>{order.warehouse}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValueBold}>{order.dateStr}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Receipt status</Text>
            <Text style={styles.detailValueBold}>{order.receiptStatus}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>PO status</Text>
            <Text style={styles.detailValueBold}>{order.purchaseStatus}</Text>
          </View>
        </View>

        <Text style={[styles.sectionHeading, styles.activitySectionSpacing]}>Activity</Text>
        <View style={styles.activityBlock}>
          <Text style={styles.activityMeta}>{order.dateStr}, 09:00 - System</Text>
          <Text style={styles.activityTitle}>Purchase order generated: From listing {order.listingCode}</Text>
          <View style={styles.activityDivider} />
        </View>

        <View style={styles.actionsRow}>
          {canOpenReceipt && onOpenReceipt ? (
            <TouchableOpacity
              style={styles.openReceiptButton}
              onPress={onOpenReceipt}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Open Goods Receipt"
            >
              <Text style={styles.openReceiptButtonText}>Open Goods Receipt</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onBack}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ProcurementPurchaseOrderDetail({
  orderId,
  can,
  onBack,
  onViewOriginalListing,
  onProcessHandover,
}: {
  orderId?: string | undefined;
  can?: Can | undefined;
  onBack: () => void;
  onViewOriginalListing?: (() => void) | undefined;
  onProcessHandover?: (() => void) | undefined;
}) {
  const [negotiationType, setNegotiationType] = useState<'Counter Offer' | 'Direct Approval'>('Counter Offer');
  const canViewListing = can ? can('produce.listing.review') : true;
  const canHandover = can ? (can('purchase.order.handover') || can('purchase.order.view')) : true;

  const subtitleText = orderId
    ? `${orderId} · ${t('purchaseOrderDetail.subtitle')}`
    : `PO-2026-00124 · ${t('purchaseOrderDetail.subtitle')}`;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel={t('purchaseOrderDetail.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('purchaseOrderDetail.title')}</Text>
        </View>
        <Text style={styles.headerSubtitle}>{subtitleText}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{t('purchaseOrderDetail.section.summary')}</Text>
        <View style={styles.procurementCard}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>{t('purchaseOrderDetail.label.orderId')}</Text>
              <Text style={styles.fieldValue}>{orderId ?? 'PO-2026-00124'}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>{t('purchaseOrderDetail.label.listingId')}</Text>
              <Text style={styles.fieldValue}>LST-00452</Text>
            </View>
          </View>

          <View style={[styles.gridRow, styles.fieldRowSpacing]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>{t('purchaseOrderDetail.label.farmer')}</Text>
              <Text style={styles.fieldValue}>Ramesh Kumar</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>{t('purchaseOrderDetail.label.produce')}</Text>
              <Text style={styles.fieldValue}>Carrot, Grade 1</Text>
            </View>
          </View>

          <View style={[styles.gridRow, styles.fieldRowSpacing]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>{t('purchaseOrderDetail.label.quantity')}</Text>
              <Text style={styles.fieldValue}>30 kg</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>{t('purchaseOrderDetail.label.agreedPrice')}</Text>
              <Text style={styles.fieldValue}>₹45/kg</Text>
            </View>
          </View>

          <View style={styles.fieldRowSpacing}>
            <Text style={styles.fieldLabel}>{t('purchaseOrderDetail.label.totalAmount')}</Text>
            <Text style={styles.fieldValue}>₹1,350</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('purchaseOrderDetail.section.farmerInfo')}</Text>
        <View style={styles.procurementCard}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Farmer ID</Text>
              <Text style={styles.fieldValue}>FR-00241</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Farm/Location</Text>
              <Text style={styles.fieldValue}>Coonoor</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Produce Information</Text>
        <View style={styles.procurementCard}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Listed Quantity</Text>
              <Text style={styles.fieldValue}>50 kg</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Agreed Quantity</Text>
              <Text style={styles.fieldValue}>30 kg</Text>
            </View>
          </View>

          <View style={[styles.gridRow, styles.fieldRowSpacing]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Listed Price</Text>
              <Text style={styles.fieldValue}>₹50/kg</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Agreed Price</Text>
              <Text style={styles.fieldValue}>₹45/kg</Text>
            </View>
          </View>
        </View>

        {canViewListing && onViewOriginalListing ? (
          <TouchableOpacity style={styles.outlineActionBtn} onPress={onViewOriginalListing} activeOpacity={0.8}>
            <Text style={styles.outlineActionBtnText}>View Original Listing</Text>
          </TouchableOpacity>
        ) : null}

        {canHandover && onProcessHandover ? (
          <TouchableOpacity style={styles.primaryActionBtn} onPress={onProcessHandover} activeOpacity={0.85}>
            <Text style={styles.primaryActionBtnText}>Process Farmer Handover</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.sectionTitle}>{t('purchaseOrderDetail.section.terms')}</Text>
        <View style={styles.chipToggleRow}>
          <TouchableOpacity
            style={[styles.chip, negotiationType === 'Counter Offer' ? styles.chipActive : styles.chipInactive]}
            onPress={() => setNegotiationType('Counter Offer')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.chipText,
                negotiationType === 'Counter Offer' ? styles.chipTextActive : styles.chipTextInactive,
              ]}
            >
              Counter Offer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, negotiationType === 'Direct Approval' ? styles.chipActive : styles.chipInactive]}
            onPress={() => setNegotiationType('Direct Approval')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.chipText,
                negotiationType === 'Direct Approval' ? styles.chipTextActive : styles.chipTextInactive,
              ]}
            >
              Direct Approval
            </Text>
          </TouchableOpacity>
        </View>

        {negotiationType === 'Counter Offer' ? (
          <>
            <View style={styles.procurementCard}>
              <Text style={styles.termHeading}>ORIGINAL FARMER REQUEST</Text>
              <Text style={styles.termBody}>Quantity: 50 kg · Price: ₹50/kg</Text>
            </View>
            <View style={styles.procurementCard}>
              <Text style={styles.termHeading}>TOHFA COUNTER OFFER</Text>
              <Text style={styles.termBody}>Quantity: 30 kg · Price: ₹45/kg</Text>
            </View>
            <View style={[styles.procurementCard, styles.finalTermsCard]}>
              <Text style={styles.termHeading}>FINAL AGREED TERMS</Text>
              <Text style={styles.finalTermBody}>Quantity: 30 kg · Price: ₹45/kg · Total: ₹1,350</Text>
            </View>
          </>
        ) : (
          <View style={[styles.procurementCard, styles.finalTermsCard]}>
            <Text style={styles.termHeading}>DIRECT APPROVAL — NO COUNTER OFFER</Text>
            <Text style={styles.finalTermBody}>Quantity: 50 kg · Price: ₹100/kg · Total: ₹5,000</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('purchaseOrderDetail.section.timeline')}</Text>
        <View style={styles.timelineContainer}>
          {[
            { title: 'Listing Created', time: '28 Sep · Farmer', icon: <TargetPlusIcon size={16} color={adminColors.brandDeep} /> },
            { title: 'Listing Approved', time: '29 Sep · Farmer Admin', icon: <CheckCircleIcon size={16} color={adminColors.brandDeep} /> },
            { title: 'Purchase Order Created', time: '29 Sep · System', icon: <ReceiptIcon size={16} color={adminColors.brandDeep} /> },
            { title: 'Terms Confirmed', time: '29 Sep · Farmer Admin', icon: <CheckCircleIcon size={16} color={adminColors.brandDeep} /> },
            { title: 'Awaiting Handover', time: '30 Sep · Current', icon: <HourglassIcon size={16} color={adminColors.brandDeep} /> },
          ].map((item, index, arr) => (
            <View key={item.title} style={styles.timelineRow}>
              <View style={styles.timelineIndicatorCol}>
                <View style={styles.timelineIconBadge}>{item.icon}</View>
                {index < arr.length - 1 ? <View style={styles.timelineLine} /> : null}
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
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
    paddingTop: adminSpacing.sm,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    marginTop: adminSpacing.xs,
    paddingLeft: adminSpacing.xxl,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxxl,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  activitySectionSpacing: {
    marginTop: adminSpacing.xl,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xs,
    ...adminShadow.sm,
  },
  procurementCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    borderStyle: 'dashed',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    ...adminType.body,
    color: adminColors.muted,
    flex: 1,
  },
  detailValueBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    textAlign: 'right',
    flexShrink: 1,
  },
  activityBlock: {
    marginTop: adminSpacing.xs,
  },
  activityMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  activityTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  activityDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.xl,
  },
  openReceiptButton: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  openReceiptButtonText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  closeButton: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  closeButtonText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    width: '48%',
  },
  fieldLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  fieldValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  fieldRowSpacing: {
    marginTop: adminSpacing.md,
  },
  chipToggleRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  chip: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: adminColors.brand,
  },
  chipInactive: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  chipText: {
    ...adminType.body,
  },
  chipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  chipTextInactive: {
    color: adminColors.ink,
    fontWeight: '600',
  },
  termHeading: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: adminSpacing.xs,
  },
  termBody: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  finalTermsCard: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
  },
  finalTermBody: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  timelineContainer: {
    paddingLeft: adminSpacing.xs,
    paddingTop: adminSpacing.xs,
    marginBottom: adminSpacing.xl,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    minHeight: 52,
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    width: 32,
    position: 'relative',
  },
  timelineIconBadge: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.xl,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineLine: {
    position: 'absolute',
    top: 32,
    bottom: -6,
    width: 2,
    backgroundColor: adminColors.border,
    zIndex: 1,
  },
  timelineTextCol: {
    flex: 1,
    paddingLeft: adminSpacing.md,
    paddingTop: adminSpacing.xs,
    paddingBottom: adminSpacing.md,
  },
  timelineTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  timelineTime: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  outlineActionBtn: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.xl,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.md,
    backgroundColor: adminColors.card,
  },
  outlineActionBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  primaryActionBtn: {
    borderRadius: adminRadius.xl,
    height: ADMIN_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
    backgroundColor: adminColors.brand,
  },
  primaryActionBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  bottomSpacer: {
    height: adminSpacing.xxxl,
  },
});
