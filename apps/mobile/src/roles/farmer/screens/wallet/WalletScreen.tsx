import React, { useState, useEffect } from 'react';
import {
  BackHandler,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  downloadInvoice,
  formatMoneyAmount,
  getMyInvoices,
  getMyWallet,
  getMyWalletTransactions,
  type Invoice,
  type Wallet,
  type WalletTransaction,
  type WalletTransactionType,
} from '../../api/wallet';
import { Badge, Card, EmptyState, ErrorState, Icon, Skeleton } from '@tohfa/mobile-ui';
import { t, type TranslationKey } from '../../../../i18n/farmer';

import {
  MIN_TOUCH_TARGET,
  colors,
  fontSizes,
  radius,
  spacing,
  typography,
  weights,
} from '../../theme';

type TabKey = 'ALL' | 'CREDIT' | 'DEBIT' | 'ADJUST';

export function WalletScreen(): React.JSX.Element {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabKey>('ALL');

  const [loadingWallet, setLoadingWallet] = useState<boolean>(true);
  const [loadingTxns, setLoadingTxns] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load wallet balance
  const loadWallet = useCallback(async () => {
    try {
      setError(null);
      const [walletRes, invoicesRes] = await Promise.all([
        getMyWallet(),
        getMyInvoices(),
      ]);
      setWallet(walletRes);
      setInvoices(invoicesRes.items);
    } catch {
      setError(t('error.generic'));
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  // Re-query transactions from API on tab change (never filter client-side!)
  const loadTransactions = useCallback(async (tab: TabKey) => {
    try {
      setLoadingTxns(true);
      let queryType: WalletTransactionType | undefined;
      if (tab === 'CREDIT') queryType = 'SALE_CREDIT';
      else if (tab === 'DEBIT') queryType = 'PAYOUT_DEBIT';
      else if (tab === 'ADJUST') queryType = 'ADJUSTMENT';

      const res = await getMyWalletTransactions({ type: queryType });
      setTransactions(res.items);
    } catch {
      setError(t('error.generic'));
    } finally {
      setLoadingTxns(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    void loadTransactions(selectedTab);
  }, [selectedTab, loadTransactions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadWallet();
    void loadTransactions(selectedTab);
  }, [loadWallet, loadTransactions, selectedTab]);

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const res = await downloadInvoice(invoiceId);
      // Opens or provides download URL
      if (res.downloadUrl) {
        // Successfully fetched URL
      }
    } catch {
      setError(t('error.generic'));
    }
  };

  const renderTransactionItem = ({ item }: { item: WalletTransaction }) => {
    const isCredit =
      item.type === 'SALE_CREDIT' ||
      item.type === 'TOPUP_CASH' ||
      item.type === 'TOPUP_DIGITAL' ||
      item.type === 'ORDER_REFUND';

    return (
      <View style={styles.txnRow}>
        <View style={styles.txnIconContainer}>
          <Icon
            name={isCredit ? 'arrow_downward' : 'arrow_upward'}
            size={20}
            color={isCredit ? colors.primary : colors.danger}
          />
        </View>

        <View style={styles.txnDetails}>
          <Text style={styles.txnType}>
            {t(`farmer.wallet.type.${item.type}` as TranslationKey) || item.type}
          </Text>
          <Text style={styles.txnDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>


        <View style={styles.txnAmounts}>
          <Text
            style={[
              styles.txnAmount,
              isCredit ? styles.txnAmountCredit : styles.txnAmountDebit,
            ]}
          >
            {isCredit ? '+' : '-'}
            {formatMoneyAmount(item.amount)}
          </Text>
          <Text style={styles.txnBalanceAfter}>
            Bal: {formatMoneyAmount(item.balanceAfter)}
          </Text>
        </View>
      </View>
    );
  };

  if (loadingWallet) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('farmer.wallet.title')}</Text>
          </View>
          <View style={styles.skeletonContainer}>
            <Skeleton height={120} width="100%" style={styles.skeletonCard} />
            <Skeleton height={44} width="100%" style={styles.skeletonItem} />
            <Skeleton height={80} width="100%" style={styles.skeletonCard} />
            <Skeleton height={80} width="100%" style={styles.skeletonCard} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !wallet) {
    return (
      <SafeAreaView style={styles.screen}>
        <ErrorState
          error={error}
          onRetry={() => {
            setLoadingWallet(true);
            void loadWallet();
            void loadTransactions(selectedTab);
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowBackIcon size={20} color={P.twGreen800} />
            </TouchableOpacity>
          )}

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Wallet</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Dark Green Available Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>₹4,250</Text>

          <View style={styles.balanceDivider} />

          <View style={styles.balanceStatsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>₹28,600</Text>
              <Text style={styles.statLabel}>Total Received</Text>
            </View>

            <View style={styles.statVerticalDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statValue}>₹24,350</Text>
              <Text style={styles.statLabel}>Total Withdrawn</Text>
            </View>
          </View>
        </View>

        {/* 3 Action Buttons Row */}
        <View style={styles.actionRow}>
          {/* Add Money */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateToAddMoney}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Add Money"
          >
            <View style={styles.actionIconCircle}>
              <PlusCircleIcon size={22} color={P.twGreen700} />
            </View>
            <Text style={styles.actionCardText}>Add Money</Text>
          </TouchableOpacity>

          {/* Withdraw */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateToWithdraw}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Withdraw"
          >
            <View style={styles.actionIconCircle}>
              <ArrowUpRightIcon size={22} color={P.twGreen700} />
            </View>
            <Text style={styles.actionCardText}>Withdraw</Text>
          </TouchableOpacity>

          {/* Payout History */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={onNavigateToPayoutHistory}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Payout History"
          >
            <View style={styles.actionIconCircle}>
              <ReceiptIcon size={22} color={P.twGreen700} />
            </View>
            <Text style={styles.actionCardText}>Payout History</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.txSection}>
          <Text style={styles.sectionHeader}>RECENT TRANSACTIONS</Text>

          <View style={styles.txList}>
            {SAMPLE_TRANSACTIONS.map((item) => {
              const isCredit = item.type === 'credit';
              const isTopUp = item.title.includes('Top-up');

              const iconBg = isTopUp
                ? P.twBlue50
                : isCredit
                  ? P.twGreen50
                  : P.twRed50;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.txCard}
                  onPress={() => onNavigateToTransactionDetail && onNavigateToTransactionDetail(item)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}, ${item.amount}`}
                >
                  <View style={[styles.txIconBox, { backgroundColor: iconBg }]}>
                    {isTopUp ? (
                      <CreditCardMiniIcon size={18} color={P.twBlue700} />
                    ) : isCredit ? (
                      <ArrowDownIcon size={18} color={P.twGreen700} />
                    ) : (
                      <ArrowUpIcon size={18} color={P.twRed600} />
                    )}
                  </View>

                  <View style={styles.txContent}>
                    <Text style={styles.txTitle}>{item.title}</Text>
                    <Text style={styles.txSubtitle}>
                      {item.date} · {item.ref}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.txAmount,
                      { color: isCredit ? P.twGreen700 : P.twRed600 },
                    ]}
                  >
                    {item.amount}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  centerContainer: { padding: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, padding: spacing.lg, gap: spacing.md },
  header: { gap: spacing.xs },
  title: {
    fontSize: fontSizes.h1,
    lineHeight: typography.h1.lineHeight,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: P.twGray200,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  errorText: { color: colors.danger, fontSize: fontSizes.body, lineHeight: typography.body.lineHeight },
  balanceCard: {
    backgroundColor: P.deepGreen,
    borderRadius: 20,
    padding: 20,
    shadowColor: P.deepGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: fontSizes.body,
    lineHeight: typography.body.lineHeight,
    fontWeight: weights.medium,
    color: colors.surface,
  },
  balanceValue: {
    fontSize: fontSizes.display,
    lineHeight: typography.display.lineHeight,
    fontWeight: weights.extrabold,
    color: colors.white,
  },
  walletMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  walletCurrency: { color: colors.surface, fontSize: fontSizes.caption, lineHeight: typography.caption.lineHeight },
  tabsRow: { flexDirection: 'row', gap: spacing.xs },
  tabButton: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.surfacePressed,
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: P.white,
  },
  tabButtonText: {
    fontSize: fontSizes.caption,
    lineHeight: typography.caption.lineHeight,
    fontWeight: weights.medium,
    color: colors.onSurface,
  },
  statVerticalDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txnDetails: { flex: 1, gap: 2 },
  txnType: {
    fontSize: fontSizes.body,
    lineHeight: typography.body.lineHeight,
    fontWeight: weights.semibold,
    color: colors.onSurface,
  },
  txnDate: {
    fontSize: fontSizes.caption,
    lineHeight: typography.caption.lineHeight,
    color: colors.onSurfaceVariant,
  },
  txnAmounts: { alignItems: 'flex-end', gap: 2 },
  txnAmount: {
    fontSize: fontSizes.body,
    lineHeight: typography.body.lineHeight,
    fontWeight: weights.bold,
  },
  txnAmountCredit: { color: colors.primary },
  txnAmountDebit: { color: colors.danger },
  txnBalanceAfter: {
    fontSize: fontSizes.caption,
    lineHeight: typography.caption.lineHeight,
    color: colors.onSurfaceVariant,
  },
  emptyContainer: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { color: colors.onSurfaceVariant, fontSize: fontSizes.body, lineHeight: typography.body.lineHeight },
  invoicesSection: { gap: spacing.xs },
  sectionTitle: {
    fontSize: fontSizes.h2,
    lineHeight: typography.h2.lineHeight,
    fontWeight: weights.bold,
    color: colors.onSurface,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: radius.card,
    gap: spacing.sm,
  },
  invoiceInfo: { flex: 1 },
  invoiceNumber: { fontSize: fontSizes.caption, lineHeight: typography.caption.lineHeight, fontWeight: weights.bold, color: colors.onSurface },
  invoiceDate: { fontSize: fontSizes.caption, lineHeight: typography.caption.lineHeight, color: colors.onSurfaceVariant },
  invoiceAmount: { fontSize: fontSizes.caption, lineHeight: typography.caption.lineHeight, fontWeight: weights.bold, color: colors.onSurface },
  invoiceBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txContent: {
    flex: 1,
    paddingRight: 8,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: P.twGray900,
  },
  txSubtitle: {
    fontSize: 12,
    color: P.twGray500,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
});
