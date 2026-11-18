import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { customerFonts } from '../theme';
import { t, type TranslationKey } from '../../../i18n/customer';
import {
  walletPouchCard,
  walletMoneyAddedSuccess,
  profileEmailVerified,
} from '../assets/images';
import { CustomerSendMoneyScreen } from './CustomerSendMoneyScreen';
import { fetchTopupReceipt, useWallet, useWalletTransactions, type TopupMode, type WalletTransaction } from '../api/wallet';
import { useWalletTopup, type TopupOutcome } from '../api/topup';
import { mapProblem } from '../api/problem';
import {
  DEFAULT_TX_FILTERS,
  activeFilterCount,
  checkAmount,
  formatInr,
  formatInrCompact,
  formatIstDateTime,
  formatSignedAmount,
  presentTransaction,
  sanitizeAmountText,
  shortfallToTopupText,
  topupChips,
  txnCodeFromId,
  type TransactionFilters,
  type TxTab,
  type TxDateRange,
} from '../api/walletMoney';
import type { WalletTransactionType } from '../api/wallet';

export interface CustomerWalletScreenProps {
  initialMode?: 'main' | 'add_money' | 'send_money';
  /** Prefill for the Add Money amount (a checkout shortfall, rounded up to whole rupees). */
  initialAmount?: string | undefined;
  onNavigate?: ((screen: string, params?: Record<string, unknown>) => void) | undefined;
  onBack?: (() => void) | undefined;
  /** Called when the user closes a successful top-up (Topup-from-checkout returns to Checkout). */
  onTopupComplete?: (() => void) | undefined;
}

// ── SVG ICONS ─────────────────────────────────────────────────────────────────

const BackArrowSvg = ({ color = '#1A1A1A', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WalletIconSvg = ({ color = '#2E7D32', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
      stroke={color}
      strokeWidth={1.8}
    />
    <Path
      d="M16 3H4a2 2 0 00-2 2v2h18V5a2 2 0 00-2-2z"
      stroke={color}
      strokeWidth={1.8}
    />
    <Circle cx={16} cy={14} r={1.5} fill={color} />
  </Svg>
);

const CartIconSvg = ({ color = '#DC2626', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={9} cy={21} r={1} fill={color} />
    <Circle cx={20} cy={21} r={1} fill={color} />
    <Path
      d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const RefundIconSvg = ({ color = '#2563EB', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 4v6h6M23 20v-6h-6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const FilterSvg = ({ color = '#2E7D32', size = 13 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const CloseSvg = ({ color = '#6B7280', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SendPaperPlaneSvg = ({ color = '#2E7D32', size = 18 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PlusSvg = ({ color = '#FFFFFF', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19M5 12H19" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const UpiSvg = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 18l8-14 8 14H4z" stroke="#EA580C" strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M12 8v6M10 12h4" stroke="#16A34A" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const CardSvg = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={2} y={5} width={20} height={14} rx={2} stroke="#1A1A1A" strokeWidth={1.8} />
    <Path d="M2 10h20" stroke="#1A1A1A" strokeWidth={1.8} />
    <Rect x={6} y={14} width={4} height={2} rx={0.5} fill="#1A1A1A" />
  </Svg>
);

const BankSvg = ({ size = 22 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 21h18M3 10h18M5 10v7M9 10v7M15 10v7M19 10v7M12 3l9 5H3l9-5z" stroke="#1A1A1A" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TinyTohfaLeafSvg = () => (
  <Svg width={20} height={14} viewBox="0 0 24 16" fill="none">
    <Path
      d="M12 1C6 1 2 5 2 11c0 3 3 5 7 5 5 0 13-5 13-15-4 0-8 0-10 0z"
      fill="#4CAF50"
    />
    <Path
      d="M12 1c2 4 6 7 10 8"
      stroke="#2E7D32"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

const MODE_BY_METHOD: Record<'upi' | 'card' | 'netbanking', TopupMode> = {
  upi: 'UPI',
  card: 'CARD',
  netbanking: 'NETBANKING',
};

const TAB_OPTIONS: Array<{ value: TxTab; labelKey: TranslationKey }> = [
  { value: 'all', labelKey: 'customer.wallet.filter.tab.all' },
  { value: 'credits', labelKey: 'customer.wallet.filter.tab.credits' },
  { value: 'debits', labelKey: 'customer.wallet.filter.tab.debits' },
  { value: 'refunds', labelKey: 'customer.wallet.filter.tab.refunds' },
];

const TYPE_OPTIONS: Array<{ value: WalletTransactionType | undefined; labelKey: TranslationKey }> = [
  { value: undefined, labelKey: 'customer.wallet.filter.type.any' },
  { value: 'TOPUP_DIGITAL', labelKey: 'customer.wallet.filter.type.topups' },
  { value: 'ORDER_DEBIT', labelKey: 'customer.wallet.filter.type.orderPayments' },
  { value: 'ORDER_REFUND', labelKey: 'customer.wallet.filter.type.refunds' },
  { value: 'TRANSFER_OUT', labelKey: 'customer.wallet.filter.type.sent' },
  { value: 'TRANSFER_IN', labelKey: 'customer.wallet.filter.type.received' },
];

const RANGE_OPTIONS: Array<{ value: TxDateRange; labelKey: TranslationKey }> = [
  { value: 'all', labelKey: 'customer.wallet.filter.range.all' },
  { value: '7d', labelKey: 'customer.wallet.filter.range.7d' },
  { value: '30d', labelKey: 'customer.wallet.filter.range.30d' },
  { value: 'month', labelKey: 'customer.wallet.filter.range.month' },
];

const TX_TITLE_KEYS: Record<WalletTransactionType, TranslationKey> = {
  TOPUP_CASH: 'customer.wallet.tx.title.addedToWallet',
  TOPUP_DIGITAL: 'customer.wallet.tx.title.addedToWallet',
  ORDER_DEBIT: 'customer.wallet.tx.title.orderPayment',
  ORDER_REFUND: 'customer.wallet.tx.title.orderRefund',
  PAYOUT_DEBIT: 'customer.wallet.tx.title.payout',
  SALE_CREDIT: 'customer.wallet.tx.title.saleCredit',
  SUBSCRIPTION_DEBIT: 'customer.wallet.tx.title.subscriptionPayment',
  ADJUSTMENT: 'customer.wallet.tx.title.adjustment',
  TRANSFER_OUT: 'customer.wallet.tx.title.moneySent',
  TRANSFER_IN: 'customer.wallet.tx.title.moneyReceived',
};

function amountErrorText(reason: 'empty' | 'invalid' | 'below_min' | 'above_max', limits?: { min: string; max: string } | null): string | null {
  switch (reason) {
    case 'empty':
      return null;
    case 'invalid':
      return t('customer.wallet.topup.error.invalid');
    case 'below_min':
      return limits ? t('customer.wallet.topup.error.belowMin', { amount: formatInrCompact(limits.min) }) : t('customer.wallet.topup.error.tooLow');
    case 'above_max':
      return limits ? t('customer.wallet.topup.error.aboveMax', { amount: formatInrCompact(limits.max) }) : t('customer.wallet.topup.error.tooHigh');
  }
}

function TxIcon({ visual }: { visual: ReturnType<typeof presentTransaction>['visual'] }) {
  if (visual === 'order') return <CartIconSvg color="#DC2626" size={18} />;
  if (visual === 'refund') return <RefundIconSvg color="#2563EB" size={18} />;
  if (visual === 'transfer_out') return <SendPaperPlaneSvg color="#DC2626" size={18} />;
  return <WalletIconSvg color="#2E7D32" size={18} />;
}

const TX_ICON_BG: Record<ReturnType<typeof presentTransaction>['visual'], string> = {
  topup: '#EDF8EE',
  order: '#FFEBEE',
  refund: '#E3F2FD',
  transfer_in: '#EDF8EE',
  transfer_out: '#FFEBEE',
  other: '#F3F4F6',
};

function TransactionRow({ tx }: { tx: WalletTransaction }) {
  const p = presentTransaction(tx);
  const txTitleKey = TX_TITLE_KEYS[tx.txnType];
  const txTitle = txTitleKey ? t(txTitleKey) : t('customer.wallet.tx.title.other');
  return (
    <View style={styles.txRow} accessibilityLabel={`${txTitle} ${tx.txnCode ?? txnCodeFromId(tx.id)}`}>
      <View style={[styles.txIconBox, { backgroundColor: TX_ICON_BG[p.visual] }]}>
        <TxIcon visual={p.visual} />
      </View>
      <View style={styles.txDetailsCol}>
        <Text style={styles.txTitle}>{txTitle}</Text>
        {tx.orderNumber ? <Text style={styles.txOrderRef}>{tx.orderNumber}</Text> : null}
        <Text style={styles.txDate}>{formatIstDateTime(tx.performedAt)}</Text>
        <Text style={styles.txOrderRef}>{tx.txnCode ?? txnCodeFromId(tx.id)}</Text>
      </View>
      <View style={styles.txRightCol}>
        <Text style={[styles.txAmount, { color: p.credit ? '#1A1A1A' : '#DC2626' }]}>{formatSignedAmount(tx.amount)}</Text>
        <View style={styles.successPill}>
          <Text style={styles.successPillText}>{t('customer.wallet.tx.success')}</Text>
        </View>
      </View>
    </View>
  );
}

export const CustomerWalletScreen: React.FC<CustomerWalletScreenProps> = ({
  initialMode = 'main',
  initialAmount,
  onNavigate,
  onBack,
  onTopupComplete,
}) => {
  const insets = useSafeAreaInsets();
  const walletQuery = useWallet();
  const wallet = walletQuery.data;
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_TX_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const txQuery = useWalletTransactions(filters);
  const topup = useWalletTopup();

  const [viewMode, setViewMode] = useState<'main' | 'add_money' | 'send_money'>(initialMode);
  const [amountInput, setAmountInput] = useState<string>(shortfallToTopupText(initialAmount));
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [outcome, setOutcome] = useState<TopupOutcome | null>(null);
  const [topupError, setTopupError] = useState<string | null>(null);
  const [waitSeconds, setWaitSeconds] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [checking, setChecking] = useState(false);

  const headerTopPadding = insets.top > 0
    ? insets.top + 8
    : (Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 44) : 16);

  useEffect(() => {
    if (waitSeconds <= 0) return undefined;
    const id = setInterval(() => setWaitSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [waitSeconds > 0]);

  const limits = wallet?.topupLimits ?? null;
  const frozen = wallet !== undefined && wallet.status !== 'ACTIVE';
  const amountCheck = checkAmount(amountInput, limits);
  const parsedAmount = amountCheck.ok ? amountCheck.amount : null;
  const amountError = amountCheck.ok ? null : amountErrorText(amountCheck.reason, limits);
  const chips = topupChips(limits);
  const processing = topup.isPending;
  const canPay = parsedAmount !== null && !processing && waitSeconds === 0 && !frozen;

  const transactions: WalletTransaction[] = (txQuery.data?.pages ?? []).flatMap((pg) => pg.items);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([walletQuery.refetch(), txQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [walletQuery, txQuery]);

  const handlePay = async () => {
    if (parsedAmount === null || !canPay) return;
    setTopupError(null);
    try {
      const result = await topup.mutateAsync({ amount: parsedAmount, mode: MODE_BY_METHOD[selectedMethod] });
      if (result.status === 'cancelled') {
        setTopupError(t('customer.wallet.topup.cancelled'));
        return;
      }
      if (result.status === 'unavailable') {
        setTopupError(t('customer.wallet.topup.unavailable'));
        return;
      }
      setOutcome(result);
    } catch (err) {
      const e = mapProblem(err);
      if (e.silent) return;
      setTopupError(e.message);
      if (e.action === 'wait' && e.retryAfterSeconds !== null) setWaitSeconds(e.retryAfterSeconds);
    }
  };

  const handleCheckAgain = async () => {
    if (outcome === null || outcome.status !== 'pending') return;
    setChecking(true);
    try {
      const receipt = await fetchTopupReceipt(outcome.intent.topupId);
      void walletQuery.refetch();
      if (receipt.status === 'SUCCESS') setOutcome({ status: 'success', intent: outcome.intent, receipt });
      else if (receipt.status === 'FAILED') setOutcome({ status: 'failed', intent: outcome.intent, receipt, reason: 'server' });
      else setOutcome({ status: 'pending', intent: outcome.intent, receipt });
    } catch {
      // keep the pending state; the user can check again
    } finally {
      setChecking(false);
    }
  };

  const handleModalClose = () => {
    const wasSuccess = outcome?.status === 'success';
    setOutcome(null);
    void walletQuery.refetch();
    if (wasSuccess) {
      setAmountInput('');
      setViewMode('main');
      void txQuery.refetch();
      onTopupComplete?.();
    } else if (outcome?.status === 'pending') {
      setViewMode('main');
    }
  };

  if (viewMode === 'send_money') {
    return (
      <CustomerSendMoneyScreen
        onBack={() => {
          if (initialMode === 'send_money' && onBack) {
            onBack();
          } else {
            setViewMode('main');
          }
        }}
        onNavigate={onNavigate}
      />
    );
  }

  const filterCount = activeFilterCount(filters);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <View style={[styles.headerRow, { paddingTop: headerTopPadding }]}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (viewMode === 'add_money' && initialMode !== 'add_money') {
                setViewMode('main');
              } else if (onBack) {
                onBack();
              } else {
                onNavigate?.('CustomerAccount');
              }
            }}
            style={styles.circleIconButton}
            accessibilityLabel={t('customer.wallet.back')}
          >
            <BackArrowSvg color="#1A1A1A" size={18} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{viewMode === 'add_money' ? t('customer.wallet.header.addMoney') : t('customer.wallet.header.myWallet')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}
      >
        {/* ── TOP WALLET POUCH CARD WITH CASH ─────────────────────────────────── */}
        <View style={styles.walletCardWrap}>
          <Image
            source={walletPouchCard}
            style={styles.walletCardImage}
            resizeMode="contain"
          />
          <View style={styles.walletBalanceOverlay}>
            <TinyTohfaLeafSvg />
            <Text style={styles.walletBalanceLabel}>{t('customer.wallet.balanceLabel')}</Text>
            {walletQuery.isLoading ? (
              <ActivityIndicator accessibilityLabel={t('customer.wallet.loadingBalance')} />
            ) : (
              <Text style={styles.walletBalanceValue}>{formatInr(wallet?.balance)}</Text>
            )}
          </View>
        </View>

        {walletQuery.isError && wallet === undefined ? (
          <View style={extra.banner} accessibilityRole="alert">
            <Text style={extra.bannerText}>{mapProblem(walletQuery.error).message}</Text>
            <TouchableOpacity onPress={() => void walletQuery.refetch()} accessibilityLabel={t('customer.wallet.retryWallet')}>
              <Text style={extra.bannerAction}>{t('customer.wallet.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {frozen ? (
          <View style={extra.banner} accessibilityRole="alert">
            <Text style={extra.bannerText}>{t('customer.wallet.frozen')}</Text>
          </View>
        ) : null}

        {/* ── VIEW 1: MAIN WALLET VIEW ────────────────────────────────────────── */}
        {viewMode === 'main' ? (
          <>
            <View style={styles.actionButtonsWrap}>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={frozen}
                onPress={() => {
                  if (onNavigate) {
                    onNavigate('CustomerSendMoney');
                  } else {
                    setViewMode('send_money');
                  }
                }}
                style={[styles.sendMoneyBtn, frozen && extra.disabled]}
                accessibilityLabel={t('customer.wallet.sendMoney')}
              >
                <SendPaperPlaneSvg color="#2E7D32" size={18} />
                <Text style={styles.sendMoneyBtnText}>{t('customer.wallet.sendMoney')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={frozen}
                onPress={() => setViewMode('add_money')}
                style={[styles.addMoneyMainBtn, frozen && extra.disabled]}
                accessibilityLabel={t('customer.wallet.addMoney')}
              >
                <PlusSvg color="#FFFFFF" size={16} />
                <Text style={styles.addMoneyMainBtnText}>{t('customer.wallet.addMoney')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('customer.wallet.recentTransactions')}</Text>
              <TouchableOpacity
                style={styles.filterPill}
                activeOpacity={0.7}
                accessibilityLabel={t('customer.wallet.filter.button')}
                onPress={() => setFilterOpen(true)}
              >
                <FilterSvg size={13} color="#2E7D32" />
                <Text style={styles.filterPillText}>{filterCount > 0 ? t('customer.wallet.filter.buttonCount', { count: filterCount }) : t('customer.wallet.filter.button')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.transactionsList}>
              {txQuery.isLoading ? (
                <View style={extra.centerBox}>
                  <ActivityIndicator accessibilityLabel={t('customer.wallet.loadingTransactions')} />
                </View>
              ) : txQuery.isError && transactions.length === 0 ? (
                <View style={extra.centerBox} accessibilityRole="alert">
                  <Text style={extra.stateText}>{mapProblem(txQuery.error).message}</Text>
                  <TouchableOpacity onPress={() => void txQuery.refetch()} accessibilityLabel={t('customer.wallet.retryTransactions')}>
                    <Text style={extra.bannerAction}>{t('customer.wallet.retry')}</Text>
                  </TouchableOpacity>
                </View>
              ) : transactions.length === 0 ? (
                <View style={extra.centerBox}>
                  <Text style={extra.stateText}>
                    {filterCount > 0 ? t('customer.wallet.tx.emptyFiltered') : t('customer.wallet.tx.empty')}
                  </Text>
                  {filterCount > 0 ? (
                    <TouchableOpacity onPress={() => setFilters(DEFAULT_TX_FILTERS)} accessibilityLabel={t('customer.wallet.filter.clear')}>
                      <Text style={extra.bannerAction}>{t('customer.wallet.filter.clear')}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <>
                  {transactions.map((tx, i) => (
                    <React.Fragment key={tx.id}>
                      <TransactionRow tx={tx} />
                      {i < transactions.length - 1 ? <View style={styles.divider} /> : null}
                    </React.Fragment>
                  ))}
                  {txQuery.hasNextPage ? (
                    <TouchableOpacity
                      style={extra.loadMore}
                      disabled={txQuery.isFetchingNextPage}
                      onPress={() => void txQuery.fetchNextPage()}
                      accessibilityLabel={t('customer.wallet.tx.loadMoreLabel')}
                    >
                      {txQuery.isFetchingNextPage ? <ActivityIndicator /> : <Text style={extra.bannerAction}>{t('customer.wallet.tx.loadMore')}</Text>}
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </View>
          </>
        ) : (
          /* ── VIEW 2: ADD MONEY VIEW ─────────────────────────────────────────── */
          <View style={styles.addMoneyForm}>
            <Text style={styles.inputLabel}>{t('customer.wallet.topup.enterAmount')}</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder=""
                keyboardType="decimal-pad"
                value={amountInput}
                onChangeText={(text) => {
                  setTopupError(null);
                  setAmountInput(sanitizeAmountText(text));
                }}
                autoFocus={true}
                editable={!processing}
                accessibilityLabel={t('customer.wallet.topup.amountLabel')}
              />
            </View>
            {amountError !== null ? <Text style={extra.fieldError}>{amountError}</Text> : null}
            {limits ? (
              <Text style={extra.hint}>
                {t('customer.wallet.topup.limits', { min: formatInrCompact(limits.min), max: formatInrCompact(limits.max) })}
              </Text>
            ) : null}

            <Text style={[styles.inputLabel, { marginTop: 20 }]}>{t('customer.wallet.topup.quickSelect')}</Text>
            <View style={styles.quickSelectRow}>
              {chips.map((val) => {
                const isSelected = parsedAmount === `${val}.00`;
                return (
                  <TouchableOpacity
                    key={val}
                    activeOpacity={0.7}
                    onPress={() => {
                      setTopupError(null);
                      setAmountInput(String(val));
                    }}
                    style={[styles.quickAmountPill, isSelected && styles.quickAmountPillSelected]}
                  >
                    <Text style={[styles.quickAmountText, isSelected && styles.quickAmountTextSelected]}>
                      ₹ {val.toLocaleString('en-IN')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 24 }]}>{t('customer.wallet.topup.chooseMethod')}</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedMethod('upi')}
              style={styles.paymentMethodRow}
              accessibilityLabel={t('customer.wallet.topup.method.upi')}
            >
              <View style={styles.methodIconBox}>
                <UpiSvg size={22} />
              </View>
              <View style={styles.methodTextCol}>
                <Text style={styles.methodTitle}>{t('customer.wallet.topup.method.upi')}</Text>
                <Text style={styles.methodSubtitle}>{t('customer.wallet.topup.method.upiHint')}</Text>
              </View>
              <View style={[styles.radioCircle, selectedMethod === 'upi' && styles.radioCircleActive]}>
                {selectedMethod === 'upi' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedMethod('card')}
              style={styles.paymentMethodRow}
              accessibilityLabel={t('customer.wallet.topup.method.card')}
            >
              <View style={styles.methodIconBox}>
                <CardSvg size={22} />
              </View>
              <View style={styles.methodTextCol}>
                <Text style={styles.methodTitle}>{t('customer.wallet.topup.method.card')}</Text>
                <Text style={styles.methodSubtitle}>{t('customer.wallet.topup.method.cardHint')}</Text>
              </View>
              <View style={[styles.radioCircle, selectedMethod === 'card' && styles.radioCircleActive]}>
                {selectedMethod === 'card' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedMethod('netbanking')}
              style={styles.paymentMethodRow}
              accessibilityLabel={t('customer.wallet.topup.method.netbanking')}
            >
              <View style={styles.methodIconBox}>
                <BankSvg size={22} />
              </View>
              <View style={styles.methodTextCol}>
                <Text style={styles.methodTitle}>{t('customer.wallet.topup.method.netbanking')}</Text>
                <Text style={styles.methodSubtitle}>{t('customer.wallet.topup.method.netbankingHint')}</Text>
              </View>
              <View style={[styles.radioCircle, selectedMethod === 'netbanking' && styles.radioCircleActive]}>
                {selectedMethod === 'netbanking' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            {topupError !== null ? (
              <Text style={extra.fieldError} accessibilityRole="alert">
                {topupError}
              </Text>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => void handlePay()}
              disabled={!canPay}
              style={[styles.addMoneySubmitBtn, canPay ? styles.addMoneySubmitBtnActive : styles.addMoneySubmitBtnDisabled]}
              accessibilityLabel={t('customer.wallet.topup.submitLabel')}
            >
              {processing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.addMoneySubmitBtnText,
                    canPay ? styles.addMoneySubmitBtnTextActive : styles.addMoneySubmitBtnTextDisabled,
                  ]}
                >
                  {waitSeconds > 0
                    ? t('customer.wallet.topup.tryAgainIn', { seconds: waitSeconds })
                    : t('customer.wallet.topup.submit', { amount: parsedAmount === null ? '' : formatInrCompact(parsedAmount) })}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── MODAL: FILTER ───────────────────────────────────────────────────── */}
      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <View style={extra.sheetBackdrop}>
          <View style={extra.sheet}>
            <View style={extra.sheetHeader}>
              <Text style={styles.sectionTitle}>{t('customer.wallet.filter.title')}</Text>
              <TouchableOpacity onPress={() => setFilterOpen(false)} accessibilityLabel={t('customer.wallet.filter.close')}>
                <CloseSvg size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{t('customer.wallet.filter.direction')}</Text>
            <View style={extra.chipRow}>
              {TAB_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.value}
                  onPress={() => setFilters((f) => ({ ...f, tab: o.value }))}
                  style={[extra.chip, filters.tab === o.value && extra.chipActive]}
                  accessibilityLabel={t('customer.wallet.filter.a11yDirection', { label: t(o.labelKey) })}
                >
                  <Text style={[extra.chipText, filters.tab === o.value && extra.chipTextActive]}>{t(o.labelKey)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>{t('customer.wallet.filter.type')}</Text>
            <View style={extra.chipRow}>
              {TYPE_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.labelKey}
                  onPress={() => setFilters((f) => ({ ...f, type: o.value }))}
                  style={[extra.chip, filters.type === o.value && extra.chipActive]}
                  accessibilityLabel={t('customer.wallet.filter.a11yType', { label: t(o.labelKey) })}
                >
                  <Text style={[extra.chipText, filters.type === o.value && extra.chipTextActive]}>{t(o.labelKey)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>{t('customer.wallet.filter.date')}</Text>
            <View style={extra.chipRow}>
              {RANGE_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.value}
                  onPress={() => setFilters((f) => ({ ...f, range: o.value }))}
                  style={[extra.chip, filters.range === o.value && extra.chipActive]}
                  accessibilityLabel={t('customer.wallet.filter.a11yDate', { label: t(o.labelKey) })}
                >
                  <Text style={[extra.chipText, filters.range === o.value && extra.chipTextActive]}>{t(o.labelKey)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={extra.sheetActions}>
              <TouchableOpacity
                onPress={() => setFilters(DEFAULT_TX_FILTERS)}
                style={[styles.sendMoneyBtn, { flex: 1 }]}
                accessibilityLabel={t('customer.wallet.filter.resetLabel')}
              >
                <Text style={styles.sendMoneyBtnText}>{t('customer.wallet.filter.reset')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFilterOpen(false)}
                style={[styles.addMoneyMainBtn, { flex: 1 }]}
                accessibilityLabel={t('customer.wallet.filter.applyLabel')}
              >
                <Text style={styles.addMoneyMainBtnText}>{t('customer.wallet.filter.apply')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: TOP-UP RESULT ────────────────────────────────────────────── */}
      <Modal visible={outcome !== null} transparent={true} animationType="fade" onRequestClose={handleModalClose}>
        <View style={styles.modalBackdrop}>
          <View style={styles.successModalCard}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleModalClose}
              style={styles.modalCloseBtn}
              accessibilityLabel={t('customer.wallet.close')}
            >
              <CloseSvg size={18} color="#6B7280" />
            </TouchableOpacity>

            {outcome?.status === 'success' ? (
              <>
                <Image source={profileEmailVerified} style={styles.modalSuccessIllustration} resizeMode="contain" />
                <Text style={styles.modalTitle}>{t('customer.wallet.result.successTitle')}</Text>
                <Text style={styles.modalSubtitle}>{t('customer.wallet.result.successBody', { amount: formatInr(outcome.receipt.amount) })}</Text>
                <View style={styles.summaryMetricsCard}>
                  <View style={styles.summaryMetricItem}>
                    <Text style={styles.metricLabel}>{t('customer.wallet.result.addedAmount')}</Text>
                    <Text style={styles.metricValue}>{formatInr(outcome.receipt.amount)}</Text>
                  </View>
                  <View style={styles.summaryMetricItem}>
                    <Text style={styles.metricLabel}>{t('customer.wallet.balanceLabel')}</Text>
                    <Text style={styles.metricValue}>{formatInr(outcome.receipt.balanceAfter)}</Text>
                  </View>
                  <View style={styles.summaryMetricItem}>
                    <Text style={styles.metricLabel}>{t('customer.wallet.result.transactionId')}</Text>
                    <Text style={styles.metricValue}>
                      {outcome.receipt.transactionId ? txnCodeFromId(outcome.receipt.transactionId) : '—'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity activeOpacity={0.8} onPress={handleModalClose} style={styles.viewWalletBtn} accessibilityLabel={t('customer.wallet.result.viewWallet')}>
                  <Text style={styles.viewWalletBtnText}>{onTopupComplete ? t('customer.wallet.result.continue') : t('customer.wallet.result.viewWallet')}</Text>
                </TouchableOpacity>
              </>
            ) : null}

            {outcome?.status === 'pending' ? (
              <>
                <Text style={styles.modalTitle}>{t('customer.wallet.result.pendingTitle')}</Text>
                <Text style={styles.modalSubtitle}>
                  {t('customer.wallet.result.pendingBody', { amount: formatInr(outcome.intent.amount) })}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={checking}
                  onPress={() => void handleCheckAgain()}
                  style={styles.viewWalletBtn}
                  accessibilityLabel={t('customer.wallet.result.checkStatus')}
                >
                  {checking ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.viewWalletBtnText}>{t('customer.wallet.result.checkStatus')}</Text>}
                </TouchableOpacity>
              </>
            ) : null}

            {outcome?.status === 'failed' ? (
              <>
                <Text style={styles.modalTitle}>{t('customer.wallet.result.failedTitle')}</Text>
                <Text style={styles.modalSubtitle}>
                  {outcome.description && outcome.description.length > 0
                    ? outcome.description
                    : t('customer.wallet.result.failedBody')}
                </Text>
                <TouchableOpacity activeOpacity={0.8} onPress={handleModalClose} style={styles.viewWalletBtn} accessibilityLabel={t('customer.wallet.result.tryAgain')}>
                  <Text style={styles.viewWalletBtnText}>{t('customer.wallet.result.tryAgain')}</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: customerFonts.editorial,
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  walletCardWrap: {
    width: '100%',
    height: 215,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  walletCardImage: {
    width: '100%',
    height: '100%',
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  walletBalanceOverlay: {
    position: 'absolute',
    top: 92,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  walletBalanceLabel: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  walletBalanceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 2,
  },
  walletIdText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  walletIdBold: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  actionButtonsWrap: {
    width: '100%',
    gap: 10,
    marginBottom: 8,
  },
  sendMoneyBtn: {
    height: 46,
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: '#2E7D32',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendMoneyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  addMoneyMainBtn: {
    height: 46,
    backgroundColor: '#2E7D32',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addMoneyMainBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: customerFonts.editorial,
    color: '#1A1A1A',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
  },
  transactionsList: {
    gap: 6,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txDetailsCol: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  txOrderRef: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  txDate: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  txRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  successPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  successPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#15803D',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 52,
  },

  // ── ADD MONEY FORM STYLES ──────────────────────────────────────────────────
  addMoneyForm: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#1A1A1A',
    paddingVertical: 6,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    paddingVertical: 0,
  },
  quickSelectRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAmountPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickAmountPillSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  quickAmountTextSelected: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  methodIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodTextCol: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  methodSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#2E7D32',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
  },
  addMoneySubmitBtn: {
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  addMoneySubmitBtnActive: {
    backgroundColor: '#2E7D32',
  },
  addMoneySubmitBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  addMoneySubmitBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addMoneySubmitBtnTextActive: {
    color: '#FFFFFF',
  },
  addMoneySubmitBtnTextDisabled: {
    color: '#9CA3AF',
  },

  // ── MODAL STYLES ───────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
  },
  modalSuccessIllustration: {
    width: 130,
    height: 105,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  summaryMetricsCard: {
    flexDirection: 'row',
    backgroundColor: '#F3F8F2',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '100%',
    marginBottom: 20,
  },
  summaryMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 3,
  },
  viewWalletBtn: {
    width: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewWalletBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

const extra = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  bannerText: { flex: 1, fontSize: 12, color: '#B91C1C' },
  bannerAction: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  disabled: { opacity: 0.45 },
  centerBox: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  stateText: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  loadMore: { alignItems: 'center', paddingVertical: 14 },
  fieldError: { fontSize: 12, color: '#DC2626', marginTop: 6 },
  hint: { fontSize: 11, color: '#6B7280', marginTop: 6 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 6 },
  chipActive: { borderColor: '#2E7D32', backgroundColor: '#E8F5E9' },
  chipText: { fontSize: 12, color: '#1A1A1A' },
  chipTextActive: { color: '#2E7D32', fontWeight: '700' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 22 },
});
