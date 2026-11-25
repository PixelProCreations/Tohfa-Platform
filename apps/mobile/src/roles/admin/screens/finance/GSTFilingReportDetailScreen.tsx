import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';

import { getInvoiceSummary, listInvoices, type InvoiceType } from '../../api/invoices';
import { useAdminQuery } from '../../api/hooks';
import { t } from '../../i18n';
import { adminColors, adminType } from '../../theme';
import { formatAdminDay } from '../../utils/datetime';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { countText, moneyText } from '../dashboard/saOverviewFormat';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

/** The GST-registered sale invoices (BR-15: GST applies to B2B and Horeca). */
const GST_INVOICE_TYPE: InvoiceType = 'SALE_B2B';
const GST_PAGE = 50;

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:     adminColors.brandDeep,
  orange:        adminColors.brand,
  pageBg:        adminColors.canvas,
  cardBg:        adminColors.card,
  ink:           adminColors.ink,
  labelMuted:    adminColors.muted,
  border:        adminColors.border,
  green:         adminColors.success.text,
  greenBg:       adminColors.success.bg,
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={adminColors.ink}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DownloadIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface GSTFilingReportDetailScreenProps {
  onBack: () => void;
}

/**
 * GSTR-1 view over the caller's B2B invoices (GET /invoices?type=SALE_B2B).
 * No filing period is applied: the list endpoint is not asked for a quarter,
 * so the subtitle's period is dashed rather than claimed. No GST amount, rate
 * or split is computed on the phone (brief 07 R6): the list carries none, so
 * those figures are dashed. The GSTR-1 JSON export has no endpoint (R3).
 */
export function GSTFilingReportDetailScreen({
  onBack,
}: GSTFilingReportDetailScreenProps) {
  const listQuery = useAdminQuery(['admin', 'invoices', 'gst-filing', GST_INVOICE_TYPE], (signal) =>
    listInvoices({ type: GST_INVOICE_TYPE, limit: GST_PAGE }, signal),
  );
  const summaryQuery = useAdminQuery(['admin', 'invoices', 'gst-filing-summary', GST_INVOICE_TYPE], (signal) =>
    getInvoiceSummary({ type: GST_INVOICE_TYPE }, signal),
  );

  const invoices = listQuery.data?.items ?? [];
  // The server's count over every matching invoice, never the page length (R4).
  const invoiceCount = countText(summaryQuery.data?.count);

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button First */}
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <BackChevronIcon />
        </TouchableOpacity>

        {/* Heading Next */}
        <Text style={styles.screenTitle}>GST Filing Report</Text>
        <Text style={styles.screenSub}>{t('wiringFinance.gstFiling.subtitle', { period: ADMIN_NO_VALUE })}</Text>

        {/* Overview Stats Card: the summary total is gross, not taxable, and no GST is summed (R5, R6). */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total Taxable Sales</Text>
              <Text style={styles.summaryVal}>{ADMIN_NO_VALUE}</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>{t('wiringFinance.gstFiling.totalOutputGst')}</Text>
              <Text style={[styles.summaryVal, { color: PALETTE.green }]}>{ADMIN_NO_VALUE}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.taxSplitRow}>
            <Text style={styles.splitText}>CGST: {ADMIN_NO_VALUE}</Text>
            <Text style={styles.splitText}>·</Text>
            <Text style={styles.splitText}>SGST: {ADMIN_NO_VALUE}</Text>
            <Text style={styles.splitText}>·</Text>
            <Text style={styles.splitText}>IGST: {ADMIN_NO_VALUE}</Text>
          </View>
        </View>

        {/* Invoices List */}
        <Text style={styles.sectionTitle}>{t('wiringFinance.gstFiling.listTitle', { count: invoiceCount })}</Text>
        {listQuery.isPending ? (
          <AdminLoadingState />
        ) : listQuery.error ? (
          <AdminErrorState error={listQuery.error} onRetry={() => void listQuery.refetch()} />
        ) : invoices.length === 0 ? (
          <AdminEmptyState title={t('wiringFinance.gstFiling.empty')} />
        ) : (
          <View style={styles.invoiceStack}>
            {invoices.map((inv) => (
              <View key={inv.id} style={styles.invoiceCard}>
                <View style={styles.invTopRow}>
                  {/* The list carries no buyer; the name is on the invoice detail only. */}
                  <Text style={styles.clientName}>{ADMIN_NO_VALUE}</Text>
                  <Text style={styles.invAmount}>{moneyText(inv.totalAmount)}</Text>
                </View>

                <Text style={styles.invMeta}>
                  {t('wiringFinance.gstFiling.invoiceMeta', { number: inv.invoiceNumber, gstin: ADMIN_NO_VALUE })}
                </Text>
                <Text style={styles.invDate}>
                  {t('wiringFinance.gstFiling.date', { date: formatAdminDay(inv.issueDate) || ADMIN_NO_VALUE })}
                </Text>

                <View style={styles.taxRow}>
                  <Text style={styles.taxDetail}>
                    {t('wiringFinance.gstFiling.taxable', { amount: moneyText(inv.taxableAmount) })}
                  </Text>
                  <Text style={styles.taxDetail}>{t('wiringFinance.gstFiling.gst', { amount: ADMIN_NO_VALUE })}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action Button: no GSTR-1 export endpoint, so drawn unavailable (R3). */}
        <TouchableOpacity
          style={[styles.downloadBtn, styles.actionUnavailable]}
          disabled
          activeOpacity={1}
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          testID="finance.gstFiling.export"
        >
          <DownloadIcon />
          <Text style={styles.downloadBtnText}>Export GST Portal JSON (GSTR-1)</Text>
        </TouchableOpacity>
        <Text style={styles.unavailableNote}>{t('wiringFinance.gstFiling.exportUnavailable')}</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: adminColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.titleRust,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 13,
    fontWeight: '400',
    color: PALETTE.labelMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 18,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginBottom: 4,
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 14,
  },
  taxSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  splitText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.labelMuted,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.titleRust,
    marginBottom: 12,
  },
  invoiceStack: {
    gap: 12,
    marginBottom: 24,
  },
  invoiceCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
  },
  invTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
  },
  invAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.ink,
  },
  invMeta: {
    fontSize: 12,
    color: PALETTE.labelMuted,
    marginBottom: 2,
  },
  invDate: {
    fontSize: 11.5,
    color: PALETTE.labelMuted,
    marginBottom: 8,
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.pageBg,
    padding: 8,
    borderRadius: 8,
  },
  taxDetail: {
    fontSize: 11.5,
    color: PALETTE.ink,
    fontWeight: '600',
  },
  downloadBtn: {
    backgroundColor: PALETTE.orange,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.orange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 3,
  },
  downloadBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  /** The designed control, kept visible, drawn as unavailable (screens/community/ pattern). */
  actionUnavailable: {
    opacity: 0.5,
  },
  unavailableNote: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 8,
  },
});
