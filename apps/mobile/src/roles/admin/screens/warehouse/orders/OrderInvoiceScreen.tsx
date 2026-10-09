/**
 * Order Invoice — read-only invoice for a customer order.
 *
 * Design id: M5S18 (M5S18_OrderInvoice).
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - "Download Invoice" and "Share": `invoice.view_own`.
 *   - There is deliberately no Generate action here: this screen views an
 *     invoice that already exists, and generation is a separate permission.
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import type { OrderScreenBaseProps } from './types';

export type OrderInvoiceScreenProps = OrderScreenBaseProps;

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

/** Mock order / invoice the design hard-coded; callers pass the real order once invoices are wired. */
const SAMPLE_ORDER_ID = 'ORD-1024';
const MOCK_INVOICE_NO = 'INV-2026-001024';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DownloadIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.info.text} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={adminColors.info.text} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function OrderInvoiceScreen({ can, onBack, orderId = SAMPLE_ORDER_ID }: OrderInvoiceScreenProps) {
  const canViewInvoice = can('invoice.view_own');

  const handleDownload = () => {
    Alert.alert('Invoice Downloaded', `Invoice ${MOCK_INVOICE_NO} downloaded successfully.`);
  };

  const handleShare = () => {
    Alert.alert('Share Invoice', 'Invoice link ready to share.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invoice</Text>
        </View>

        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>{MOCK_INVOICE_NO}</Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.brandCard}>
            <View style={styles.brandHeader}>
              <Text style={styles.brandTitle}>TOHFA</Text>
              <Text style={styles.brandSub}>Nilgiris Horticulture Organic Farmers Association</Text>
              <Text style={styles.invoiceCode}>{MOCK_INVOICE_NO}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Order Number</Text>
                <Text style={styles.fieldValue}>{orderId}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Date</Text>
                <Text style={styles.fieldValue}>24 Sep 2026</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, styles.rowGap]}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Customer</Text>
                <Text style={styles.fieldValue}>Arun Kumar</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Sales Channel</Text>
                <Text style={styles.fieldValue}>Online</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.itemsCard}>
            <View style={styles.itemRow}>
              <View>
                <Text style={styles.itemName}>Tomato</Text>
                <Text style={styles.itemMeta}>Grade 1</Text>
                <Text style={styles.itemMeta}>2 KG × ₹100</Text>
              </View>
              <Text style={styles.itemTotal}>₹200</Text>
            </View>

            <View style={styles.itemDivider} />

            <View style={styles.itemRow}>
              <View>
                <Text style={styles.itemName}>Carrot</Text>
                <Text style={styles.itemMeta}>Grade 1</Text>
                <Text style={styles.itemMeta}>3 KG × ₹120</Text>
              </View>
              <Text style={styles.itemTotal}>₹360</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Totals</Text>
          <View style={styles.totalsCard}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>₹560</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Discount</Text>
              <Text style={styles.totalsValue}>₹0</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>GST</Text>
              <Text style={styles.totalsValue}>₹28</Text>
            </View>

            <View style={styles.totalsDivider} />

            <View style={styles.totalFinalRow}>
              <Text style={styles.totalFinal}>Total</Text>
              <Text style={styles.totalFinal}>₹588</Text>
            </View>
          </View>

          <View style={styles.paymentStatusCard}>
            <Text style={styles.paymentStatusLabel}>Payment Status</Text>
            <View style={styles.paymentStatusBadge}>
              <Text style={styles.paymentStatusValue}>Paid</Text>
            </View>
          </View>

          <View style={styles.gstInfoBox}>
            <View style={styles.infoIconNudge}>
              <InfoCircleIcon />
            </View>
            <Text style={styles.gstInfoText}>
              GST invoice generation for B2B/HORECA is a separate permission from ordinary invoice generation — not assumed here unless granted.
            </Text>
          </View>

          {/* Hidden, not disabled, without invoice.view_own. */}
          {canViewInvoice ? (
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.8} onPress={handleDownload}>
                <DownloadIcon />
                <Text style={styles.downloadBtnText}>Download Invoice</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8} onPress={handleShare}>
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const BACK_BUTTON_SIZE = 32;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 14,
    paddingBottom: adminSpacing.md,
    gap: adminSpacing.md,
  },
  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  subtitleRow: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: adminColors.brand,
  },
  subtitleText: {
    ...adminType.rowTitle,
    // Was a translucent overlay; no translucent token, so solid onBrand.
    color: adminColors.onBrand,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 14,
    paddingBottom: adminSpacing.xl,
  },
  brandCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  brandHeader: {
    alignItems: 'center',
    paddingBottom: adminSpacing.xs,
  },
  brandTitle: {
    ...adminType.title,
    color: adminColors.brandDeep,
    letterSpacing: 0.8,
    marginBottom: adminSpacing.xs,
    textAlign: 'center',
  },
  brandSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 6,
    textAlign: 'center',
  },
  invoiceCode: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 14,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowGap: {
    marginTop: 14,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  fieldValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  itemsCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemName: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  itemMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  itemTotal: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  itemDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 10,
  },
  totalsCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  totalsLabel: {
    ...adminType.body,
    fontWeight: '500',
    color: adminColors.muted,
  },
  totalsValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  totalsDivider: {
    height: 1.5,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.md,
  },
  totalFinalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalFinal: {
    ...adminType.title,
    color: adminColors.ink,
  },
  paymentStatusCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 18,
    paddingVertical: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...adminShadow.sm,
  },
  paymentStatusLabel: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  paymentStatusBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
  },
  paymentStatusValue: {
    ...adminType.sectionHead,
    color: adminColors.success.text,
  },
  gstInfoBox: {
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    borderRadius: adminRadius.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
  },
  infoIconNudge: {
    marginTop: 1,
  },
  gstInfoText: {
    ...adminType.rowTitle,
    flex: 1,
    color: adminColors.info.text,
  },
  actionsContainer: {
    marginBottom: 30,
  },
  downloadBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    height: ADMIN_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  downloadBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  shareBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    height: ADMIN_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
});
