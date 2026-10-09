// Design id: M11-S02D
/**
 * Revenue Detail: one sales-income record, read-only. Serves both warehouse
 * roles (it was SubWarehouseRevenueDetailScreen and absorbs the Main copy,
 * MainWarehouseRevenueDetailScreen).
 *
 * Main vs Sub (pair_table M11-S02D, "divergent"): the Sub version took the
 * record as props and showed a locked warehouse header; it is kept. Main's
 * screen was a short mock that the Main revenue list embedded; its compact
 * layout survives as `isShortVersion` (Revenue ID, Customer, Final Amount,
 * Payment Method, no actions), used when Main opens a record from history.
 *
 * Gating (docs/rbac.json; the server re-checks, CLAUDE.md 2.1):
 *   - finance.sales_income.view: the record itself (MAIN all, SUB own).
 *   - View Order: order.list.view_all. View Invoice: invoice.view_own. Each is
 *     shown only with its code AND a host that can open that screen ("only
 *     links that correspond to existing screens are shown", the Main callout).
 * There is no revenue edit code, so nothing here edits revenue.
 */
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { InfoCard, InfoNote, ScopeHeader, SectionTitle, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { SAMPLE_REVENUE_DETAIL } from './fixtures';
import { FINANCE_CODES, FinanceNotAvailable, PadlockIcon, scopeLabel } from './FinanceParts';
import type { RevenueDetail, WarehouseScreenBaseProps } from './types';

export interface RevenueDetailScreenProps extends WarehouseScreenBaseProps, RevenueDetail {
  /** Compact layout ported from the Main copy (opened from history). */
  isShortVersion?: boolean | undefined;
  onViewOrder?: (() => void) | undefined;
  onViewInvoice?: (() => void) | undefined;
  onViewTransactionHistory?: (() => void) | undefined;
}

function BagIcon({ size = 22, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 6h18M16 10a4 4 0 0 1-8 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InvoiceIcon({ size = 22, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PaymentIcon({ size = 22, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="2" stroke={color} strokeWidth="2" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HistoryIcon({ size = 22, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 8v4l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.05 11a9 9 0 1 1 .5 4m-.5-4v4h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function RevenueDetailScreen({
  scope,
  can,
  onBack,
  isShortVersion = false,
  onViewOrder,
  onViewInvoice,
  onViewTransactionHistory,
  revenueId = SAMPLE_REVENUE_DETAIL.revenueId,
  orderId = SAMPLE_REVENUE_DETAIL.orderId,
  invoiceId = SAMPLE_REVENUE_DETAIL.invoiceId,
  customer = SAMPLE_REVENUE_DETAIL.customer,
  salesChannel = SAMPLE_REVENUE_DETAIL.salesChannel,
  quantity = SAMPLE_REVENUE_DETAIL.quantity,
  product = SAMPLE_REVENUE_DETAIL.product,
  finalAmount = SAMPLE_REVENUE_DETAIL.finalAmount,
  paymentMethod = SAMPLE_REVENUE_DETAIL.paymentMethod,
  paymentStatus = SAMPLE_REVENUE_DETAIL.paymentStatus,
  transactionDate = SAMPLE_REVENUE_DETAIL.transactionDate,
  warehouseName,
}: RevenueDetailScreenProps) {
  if (!can(FINANCE_CODES.salesIncome)) {
    return (
      <FinanceNotAvailable title="Revenue Detail" message="Your role does not include sales income." onBack={onBack} />
    );
  }

  const warehouse = warehouseName ?? scopeLabel(scope);
  const amount = `₹${finalAmount}`;
  const rows = isShortVersion
    ? [
        [
          { label: 'Revenue ID', value: revenueId },
          { label: 'Customer', value: customer },
        ],
        [
          { label: 'Final Amount', value: amount },
          { label: 'Payment Method', value: paymentMethod },
        ],
      ]
    : [
        [
          { label: 'Revenue ID', value: revenueId },
          { label: 'Order ID', value: orderId },
        ],
        [
          { label: 'Invoice ID', value: invoiceId },
          { label: 'Customer', value: customer },
        ],
        [
          { label: 'Sales Channel', value: salesChannel },
          { label: 'Quantity', value: quantity },
        ],
        [
          { label: 'Product', value: product },
          { label: 'Final Amount', value: amount },
        ],
        [
          { label: 'Payment Method', value: paymentMethod },
          { label: 'Payment Status', value: paymentStatus },
        ],
        [
          { label: 'Transaction Date', value: transactionDate },
          { label: 'Warehouse', value: warehouse },
        ],
      ];

  const actions: { key: string; label: string; icon: React.ReactNode; onPress: () => void }[] = [];
  if (onViewOrder && can(FINANCE_CODES.orderList)) {
    actions.push({ key: 'order', label: 'View Order', icon: <BagIcon />, onPress: onViewOrder });
  }
  if (onViewInvoice && can(FINANCE_CODES.invoiceView)) {
    actions.push({ key: 'invoice', label: 'View Invoice', icon: <InvoiceIcon />, onPress: onViewInvoice });
  }
  actions.push({
    key: 'payment',
    label: 'View Payment',
    icon: <PaymentIcon />,
    onPress: () => Alert.alert('Payment', `${paymentMethod} · ${paymentStatus} · ${amount}`),
  });
  if (onViewTransactionHistory) {
    actions.push({ key: 'history', label: 'Transaction History', icon: <HistoryIcon />, onPress: onViewTransactionHistory });
  }

  return (
    <WalletScreen
      title="Revenue Detail"
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} label={`${warehouse} · Today`} />}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>Revenue Detail</SectionTitle>
        <InfoCard rows={rows} />

        {isShortVersion ? null : (
          <>
            <View style={styles.lockBanner}>
              <View style={styles.lockIconWrap}>
                <PadlockIcon />
              </View>
              <Text style={styles.lockBannerText}>
                No manual revenue editing here: no permission code grants it.
              </Text>
            </View>

            <SectionTitle>Related Actions</SectionTitle>
            <View style={styles.actionsGrid}>
              {actions.map((action) => (
                <TouchableOpacity
                  key={action.key}
                  style={styles.actionBtn}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  {action.icon}
                  <Text style={styles.actionBtnText}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <InfoNote tone="warning">
              Only links that correspond to existing screens and data are shown; nothing is fabricated.
            </InfoNote>
          </>
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginTop: adminSpacing.lg,
  },
  lockIconWrap: {
    width: 32,
    height: 32,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBannerText: { ...adminType.rowMeta, flex: 1, color: adminColors.muted },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm },
  actionBtn: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.lg,
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  actionBtnText: { ...adminType.rowTitle, color: adminColors.ink, textAlign: 'center' },
});
