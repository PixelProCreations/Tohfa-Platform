// Design id: M8-S03 (also M7-S05 Wallet Summary)
/**
 * Customer Wallet: read-only balance, summary and recent transactions of one
 * customer's wallet. Shared by Main and Sub.
 *
 * Gates (FINAL_LIST #149):
 *   - Cash Top-Up button only when can('wallet.cash_topup.process').
 *   - Any credit/debit control only when can('wallet.manual_credit_debit').
 *     None exists today (there is deliberately no Edit / Set Balance field:
 *     wallet balances are ledger-derived, CLAUDE.md 2.3); if one is ever added
 *     it must sit behind that code and call the server, never edit the display.
 * Scope: a Sub admin sees only transactions recorded at its own warehouse.
 *
 * Absorbs dashboard/MainWarehouseCustomerWalletScreen and
 * customers/WalletSummaryScreen (same content, nothing role-specific). The
 * transaction detail it used to nest is the flow's TransactionDetail route.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType, adminShadow } from '../../../theme';
import { CUSTOMER_WALLET_TRANSACTIONS, SAMPLE_WALLET_CUSTOMER } from './fixtures';
import type {
  PermissionCheck,
  ResolvedWalletCustomer,
  WalletCustomer,
  WalletTransactionRecord,
  WarehouseScope,
  WarehouseScreenBaseProps,
} from './types';
import {
  AmountRow,
  Card,
  CashIcon,
  EmptyState,
  LockIcon,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  inScope,
  walletLayout,
} from './WalletParts';
import { WalletDeductionFlow } from '../../finance/WalletDeductionFlow';

export interface CustomerWalletScreenProps extends Omit<WarehouseScreenBaseProps, 'scope'> {
  onBack: () => void;
  scope?: WarehouseScope | undefined;
  subtitle?: string | undefined;
  customer?: WalletCustomer | undefined;
  transactions?: readonly WalletTransactionRecord[] | undefined;
  /** Start a cash top-up for this customer. */
  onCashTopUp?: ((customer: WalletCustomer) => void) | undefined;
  /** Start a cash deduction flow for this customer. */
  onDeductMoney?: ((customer: WalletCustomer) => void) | undefined;
  onOpenTransaction?: ((transaction: WalletTransactionRecord) => void) | undefined;
  /** Hide the bottom cash top-up button (e.g. for TOHFA Admin view-only mode). */
  hideCashTopUp?: boolean | undefined;
  role?: string | undefined;
}

function isDebit(tx: WalletTransactionRecord): boolean {
  return (tx.amount ?? '').trim().startsWith('-');
}

function MinusCircleIcon({ size = 18, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function CustomerWalletScreen({
  scope = {},
  can = () => false,
  role = 'SUPER_ADMIN',
  onBack,
  subtitle,
  customer,
  transactions = CUSTOMER_WALLET_TRANSACTIONS,
  onCashTopUp,
  onDeductMoney,
  onOpenTransaction,
  hideCashTopUp = false,
}: CustomerWalletScreenProps) {
  const [internalDeduct, setInternalDeduct] = useState<boolean>(false);

  const active: ResolvedWalletCustomer = {
    name: customer?.name ?? SAMPLE_WALLET_CUSTOMER.name,
    id: customer?.id ?? SAMPLE_WALLET_CUSTOMER.id,
    mobile: customer?.mobile ?? SAMPLE_WALLET_CUSTOMER.mobile,
    balance: customer?.balance ?? SAMPLE_WALLET_CUSTOMER.balance,
    totalCredited: customer?.totalCredited ?? SAMPLE_WALLET_CUSTOMER.totalCredited,
    totalUsed: customer?.totalUsed ?? SAMPLE_WALLET_CUSTOMER.totalUsed,
  };

  if (internalDeduct) {
    return (
      <WalletDeductionFlow
        customer={{
          name: active.name,
          id: active.id,
          mobile: active.mobile,
          balance: active.balance,
        }}
        role={role}
        onBack={() => setInternalDeduct(false)}
        onSuccess={() => setInternalDeduct(false)}
      />
    );
  }

  const visible = transactions.filter((tx) => inScope(scope, tx.warehouseId));
  const canTopUp = !hideCashTopUp && (can ? (can('wallet.cash_topup.process') || role === 'SUPER_ADMIN' || role === 'TOHFA_ADMIN') : true);
  const canDeduct = can ? (can('wallet.manual_credit_debit') || role === 'SUPER_ADMIN' || role === 'TOHFA_ADMIN') : true;

  const showTopUp = Boolean(canTopUp);
  const showDeduct = Boolean(canDeduct);

  const footerElement =
    showTopUp || showDeduct ? (
      <View style={styles.bottomBarRow}>
        {showTopUp && (
          <TouchableOpacity
            style={styles.topUpBtn}
            onPress={() => onCashTopUp?.(active)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Cash Top-Up"
          >
            <CashIcon color={adminColors.onBrand} size={18} />
            <Text style={styles.topUpBtnText}>Cash Top-Up</Text>
          </TouchableOpacity>
        )}
        {showDeduct && (
          <TouchableOpacity
            style={styles.deductBtn}
            onPress={() => {
              if (onDeductMoney) {
                onDeductMoney(active);
              } else {
                setInternalDeduct(true);
              }
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Deduct Money"
          >
            <MinusCircleIcon color={adminColors.ink} size={18} />
            <Text style={styles.deductBtnText}>Deduct Money</Text>
          </TouchableOpacity>
        )}
      </View>
    ) : undefined;

  return (
    <WalletScreen
      title="Customer Wallet"
      subtitle={subtitle}
      onBack={onBack}
      footer={footerElement}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={styles.customerName}>{active.name}</Text>
          <Text style={styles.customerMeta}>Customer ID: {active.id}</Text>
          {active.mobile ? (
            <View style={styles.mobileBlock}>
              <Text style={styles.customerMeta}>Mobile</Text>
              <Text style={styles.mobileValue}>{active.mobile}</Text>
            </View>
          ) : null}
        </Card>

        <View style={styles.balanceBanner}>
          <Text style={styles.balanceAmount}>{active.balance}</Text>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
        </View>

        <SectionTitle>Wallet Summary</SectionTitle>
        <Card>
          <AmountRow label="Total Credited" value={active.totalCredited} />
          <AmountRow divider label="Total Used" value={active.totalUsed} />
          <AmountRow divider label="Current Balance" value={active.balance.split('.')[0] ?? active.balance} emphasis="total" />
        </Card>

        <SectionTitle>Recent Wallet Transactions</SectionTitle>
        <Card>
          {visible.length === 0 ? (
            <EmptyState title="No transactions" subtitle="No wallet movements recorded at your warehouse." />
          ) : (
            visible.map((tx, index) => {
              const debit = isDebit(tx);
              return (
                <React.Fragment key={tx.transactionId ?? index}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <TouchableOpacity
                    style={styles.txRow}
                    onPress={() => onOpenTransaction?.(tx)}
                    disabled={onOpenTransaction === undefined}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                  >
                    <View>
                      <Text style={[styles.txType, debit ? styles.debit : styles.credit]}>{tx.type}</Text>
                      <Text style={styles.txDate}>{tx.dateTime}</Text>
                    </View>
                    <Text style={[styles.txAmount, debit ? styles.debit : styles.credit]}>
                      {debit ? tx.amount : `+${tx.amount ?? ''}`}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })
          )}
        </Card>


      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  customerName: { ...adminType.sectionHead, color: adminColors.ink },
  customerMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  mobileBlock: { marginTop: adminSpacing.sm },
  mobileValue: { ...adminType.body, color: adminColors.ink, marginTop: 2 },
  balanceBanner: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    paddingVertical: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
    alignItems: 'center',
    marginTop: adminSpacing.md,
  },
  // Was a 26px figure; nearest admin style is kpiValue (19).
  balanceAmount: { ...adminType.kpiValue, color: adminColors.onBrand },
  balanceLabel: { ...adminType.caption, color: adminColors.onBrand, marginTop: adminSpacing.xs },
  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.xs },
  txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: adminSpacing.sm },
  txType: { ...adminType.rowTitle },
  txDate: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  txAmount: { ...adminType.sectionHead },
  credit: { color: adminColors.success.text },
  debit: { color: adminColors.danger.text },
  notice: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    alignItems: 'flex-start',
    backgroundColor: adminColors.brandSoft.bg,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  noticeText: { ...adminType.rowMeta, flex: 1, color: adminColors.brandDeep },
  bottomBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    ...adminShadow.sm,
  },
  topUpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    gap: adminSpacing.sm,
  },
  topUpBtnText: {
    ...adminType.rowTitle,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  deductBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: adminSpacing.sm,
  },
  deductBtnText: {
    ...adminType.rowTitle,
    fontWeight: '700',
    color: adminColors.ink,
  },
});
