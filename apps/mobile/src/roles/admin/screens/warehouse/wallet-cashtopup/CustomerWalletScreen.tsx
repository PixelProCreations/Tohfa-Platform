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
 * Scope (samples only): a Sub admin sees only transactions recorded at its own
 * warehouse. Live rows are not filtered (see below).
 *
 * Absorbs dashboard/MainWarehouseCustomerWalletScreen and
 * customers/WalletSummaryScreen (same content, nothing role-specific). The
 * transaction detail it used to nest is the flow's TransactionDetail route.
 *
 * Live (plan phase 6): opened for a customer with a uuid (`customerUuid`), the
 * flow passes `live`: the balance, status, transaction count and last
 * movement are GET /admin/customers/{id}/wallet, and the transactions are its
 * ledger, newest first, with the server's own sign, paged with "Load more".
 * Nothing is filtered by warehouse here (the ledger is the customer's whole
 * wallet, and the balance is its sum, BR-93e). The read is GET-only (BR-93):
 * no route under /admin/customers moves money. Total Credited / Total Used are
 * hidden in live mode (the API has no such figures).
 *
 * Without `live` (only customers/CustomerSearchScreen's sample search still
 * does this; the wallet flow never does), the caller passes the customer and
 * transactions to show; this screen holds no samples.
 */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import type { CustomerWalletView } from '../customers/types';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import type { ResolvedWalletCustomer, WalletCustomer, WalletTransactionRecord, WarehouseScreenBaseProps } from './types';
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

/** The live wallet of a customer (GET /admin/customers/{id}/wallet and its ledger). */
export interface LiveWalletProps {
  /** The summary, once loaded. */
  wallet: CustomerWalletView | undefined;
  isLoading: boolean;
  error: unknown;
  /** The ledger's own first load and failure. */
  transactionsLoading: boolean;
  transactionsError: unknown;
  onRetry: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
}

export interface CustomerWalletScreenProps extends WarehouseScreenBaseProps {
  customer?: WalletCustomer | undefined;
  transactions?: readonly WalletTransactionRecord[] | undefined;
  /** Server data and its states; when given, nothing but server values is shown. */
  live?: LiveWalletProps | undefined;
  /** Start a cash top-up for this customer. */
  onCashTopUp?: ((customer: ResolvedWalletCustomer) => void) | undefined;
  onOpenTransaction?: ((transaction: WalletTransactionRecord) => void) | undefined;
}

function isDebit(tx: WalletTransactionRecord): boolean {
  return (tx.amount ?? '').trim().startsWith('-');
}

export function CustomerWalletScreen({
  scope,
  can,
  onBack,
  customer,
  transactions = [],
  live,
  onCashTopUp,
  onOpenTransaction,
}: CustomerWalletScreenProps) {
  const noValue = t('customers.noValue');
  const active: ResolvedWalletCustomer = {
    name: customer?.name ?? noValue,
    id: customer?.id ?? noValue,
    mobile: customer?.mobile ?? '',
    balance: live ? live.wallet?.balanceLabel ?? noValue : customer?.balance ?? noValue,
    totalCredited: customer?.totalCredited ?? noValue,
    totalUsed: customer?.totalUsed ?? noValue,
    ...(customer?.customerUuid === undefined ? {} : { customerUuid: customer.customerUuid }),
  };
  // Live rows are the customer's whole ledger as the server scoped it; samples keep the old warehouse filter.
  const visible = live ? transactions : transactions.filter((tx) => inScope(scope, tx.warehouseId));
  const showTopUp = can('wallet.cash_topup.process') && onCashTopUp !== undefined;
  const summaryView = live ? queryViewState({ isLoading: live.isLoading, error: live.error, itemCount: live.wallet ? 1 : 0 }) : 'ready';
  const txView = live
    ? queryViewState({ isLoading: live.transactionsLoading, error: live.transactionsError, itemCount: visible.length })
    : visible.length === 0
      ? 'empty'
      : 'ready';

  return (
    <WalletScreen
      title={t('wallet.customer.title')}
      subtitle={active.name}
      onBack={onBack}
      footer={
        showTopUp ? (
          <WalletFooter>
            <WalletButton label={t('wallet.topup.title')} icon={<CashIcon />} onPress={() => onCashTopUp(active)} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView
        contentContainerStyle={walletLayout.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          live ? (
            <RefreshControl refreshing={live.isRefreshing} onRefresh={live.onRefresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />
          ) : undefined
        }
      >
        <Card>
          <Text style={styles.customerName}>{active.name}</Text>
          <Text style={styles.customerMeta}>{t('wallet.customer.code', { code: active.id })}</Text>
          {active.mobile ? (
            <View style={styles.mobileBlock}>
              <Text style={styles.customerMeta}>{t('wallet.customer.mobile')}</Text>
              <Text style={styles.mobileValue}>{active.mobile}</Text>
            </View>
          ) : null}
        </Card>

        <View style={styles.balanceBanner}>
          <Text style={styles.balanceAmount}>{active.balance}</Text>
          <Text style={styles.balanceLabel}>{t('wallet.customer.available')}</Text>
        </View>

        <SectionTitle>{t('wallet.customer.summary')}</SectionTitle>
        {summaryView === 'loading' ? (
          <AdminLoadingState />
        ) : summaryView === 'error' ? (
          <AdminErrorState error={live?.error} onRetry={live?.onRetry} />
        ) : live ? (
          <Card>
            <AmountRow label={t('customers.wallet.statusLabel')} value={live.wallet?.statusLabel ?? noValue} />
            <AmountRow
              divider
              label={t('customers.wallet.transactions')}
              value={String(live.wallet?.transactionCount ?? noValue)}
            />
            <AmountRow divider label={t('customers.wallet.lastTransaction')} value={live.wallet?.lastTransactionLabel ?? noValue} />
            <AmountRow divider label={t('wallet.customer.currentBalance')} value={active.balance} emphasis="total" />
          </Card>
        ) : (
          <Card>
            <AmountRow label={t('wallet.customer.totalCredited')} value={active.totalCredited} />
            <AmountRow divider label={t('wallet.customer.totalUsed')} value={active.totalUsed} />
            <AmountRow divider label={t('wallet.customer.currentBalance')} value={active.balance.split('.')[0] ?? active.balance} emphasis="total" />
          </Card>
        )}

        <SectionTitle>{t('wallet.customer.recent')}</SectionTitle>
        <Card>
          {txView === 'loading' ? (
            <AdminLoadingState />
          ) : txView === 'error' ? (
            <AdminErrorState error={live?.transactionsError} onRetry={live?.onRetry} />
          ) : txView === 'empty' ? (
            live ? (
              <EmptyState title={t('customers.wallet.noTransactions')} />
            ) : (
              <EmptyState title={t('wallet.customer.noTransactions')} subtitle={t('wallet.customer.noTransactionsHint')} />
            )
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
          {live && txView === 'ready' && live.hasMore ? (
            <TouchableOpacity style={styles.loadMore} onPress={live.onLoadMore} activeOpacity={0.7} accessibilityRole="button">
              <Text style={styles.loadMoreText}>{t('customers.loadMore')}</Text>
            </TouchableOpacity>
          ) : null}
        </Card>

        <View style={styles.notice}>
          <LockIcon size={16} color={adminColors.brandDeep} />
          <Text style={styles.noticeText}>{t('wallet.customer.readOnlyNote')}</Text>
        </View>
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
  loadMore: { alignItems: 'center', paddingVertical: adminSpacing.sm },
  loadMoreText: { ...adminType.rowTitle, color: adminColors.brand },
});
