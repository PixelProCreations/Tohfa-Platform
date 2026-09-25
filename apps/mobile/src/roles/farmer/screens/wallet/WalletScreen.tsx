import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P } from '../../theme';
import type { WalletTransactionItem } from '../payment/WalletTransactionDetailScreen';
import {
  formatMoneyAmount,
  getMyWallet,
  getMyWalletTransactions,
  type Wallet,
  type WalletTransaction,
  type WalletTransactionType,
} from '../../api/wallet';
import { formatErrorMessage } from '../../../../shell/api/client';

// ── SVG Icons ────────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 20, color = P.twGray800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlusCircleIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M12 8v8M8 12h8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowUpRightIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 17L17 7M7 7h10v10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReceiptIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="3" width="14" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Line x1="8.5" y1="8" x2="15.5" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8.5" y1="12" x2="15.5" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8.5" y1="16" x2="12.5" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowDownIcon({ size = 20, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4v16M18 14l-6 6-6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ArrowUpIcon({ size = 20, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20V4M6 10l6-6 6 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CreditCardMiniIcon({ size = 20, color = P.twBlue700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="3" stroke={color} strokeWidth="1.8" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" />
      <Circle cx="7" cy="15" r="1" fill={color} />
    </Svg>
  );
}

// ── Real Transaction Mapping ─────────────────────────────────────────────────

/** Human label for each ledger txnType. Purely display copy, not a business rule. */
const TXN_TYPE_LABELS: Record<WalletTransactionType, string> = {
  TOPUP_CASH: 'Cash Top-up',
  TOPUP_DIGITAL: 'Wallet Top-up',
  ORDER_DEBIT: 'Order Payment',
  ORDER_REFUND: 'Order Refund',
  PAYOUT_DEBIT: 'Withdrawal',
  SALE_CREDIT: 'Sale Settlement',
  SUBSCRIPTION_DEBIT: 'Subscription',
  ADJUSTMENT: 'Adjustment',
};

function formatTxnDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTxnDateTime(iso: string): string {
  const time = new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${formatTxnDate(iso)}, ${time}`;
}

/**
 * Maps a real ledger row to the UI's display shape. Credit vs. debit is read off the sign
 * of `amount` -- docs/openapi.yaml documents it as "Signed: negative for debits" -- rather
 * than a hardcoded guess at which txnType means which direction (ADJUSTMENT can be either).
 */
function toTransactionItem(tx: WalletTransaction): WalletTransactionItem {
  const formattedAmount = formatMoneyAmount(tx.amount);
  const isCredit = !formattedAmount.startsWith('-');
  const amountDisplay = isCredit ? `+ ${formattedAmount}` : `- ${formattedAmount.slice(1)}`;
  const label = TXN_TYPE_LABELS[tx.txnType] ?? 'Wallet Transaction';

  return {
    id: tx.id,
    title: label,
    type: isCredit ? 'credit' : 'debit',
    amount: amountDisplay,
    date: formatTxnDate(tx.performedAt),
    ref: tx.remarks ?? label,
    // exactOptionalPropertyTypes: omit the key entirely rather than set it to `undefined`.
    ...(tx.refId !== null ? { orderId: tx.refId } : {}),
    ...(tx.refType !== null ? { channel: tx.refType } : {}),
    creditedOn: formatTxnDateTime(tx.performedAt),
    balanceAfter: formatMoneyAmount(tx.balanceAfter),
  };
}

// ── Screen Component Props ───────────────────────────────────────────────────

export interface WalletScreenProps {
  onBack?: () => void;
  onNavigateToAddMoney?: () => void;
  onNavigateToWithdraw?: () => void;
  onNavigateToPayoutHistory?: () => void;
  onNavigateToTransactionDetail?: (txn: WalletTransactionItem) => void;
}

export function WalletScreen({
  onBack,
  onNavigateToAddMoney,
  onNavigateToWithdraw,
  onNavigateToPayoutHistory,
  onNavigateToTransactionDetail,
}: WalletScreenProps): React.JSX.Element {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletRes, transactionsRes] = await Promise.all([
        getMyWallet(),
        getMyWalletTransactions(),
      ]);
      setWallet(walletRes);
      setTransactions(transactionsRes.items);
    } catch (err) {
      setError(formatErrorMessage(err, 'Could not load your wallet. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [onBack]);

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

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={P.twGreen700} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorTitle}>Couldn't load your wallet</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => void loadWallet()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Dark Green Available Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>
              {wallet ? formatMoneyAmount(wallet.balance) : formatMoneyAmount('0')}
            </Text>
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

            {transactions.length === 0 ? (
              <View style={styles.emptyTxBox}>
                <Text style={styles.emptyTxText}>
                  No transactions yet. Top up your wallet or make a sale to see activity here.
                </Text>
              </View>
            ) : (
              <View style={styles.txList}>
                {transactions.map((tx) => {
                  const item = toTransactionItem(tx);
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
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: P.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 4,
    paddingBottom: 14,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
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
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.twGray50,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 18,
  },
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
    fontSize: 12.5,
    fontWeight: '600',
    color: P.green100,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '800',
    color: P.white,
    marginTop: 6,
    letterSpacing: -0.5,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: P.twGray50,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: P.twGray900,
    marginBottom: 6,
  },
  errorText: {
    fontSize: 14,
    color: P.twGray500,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: P.deepGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: P.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyTxBox: {
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  emptyTxText: {
    fontSize: 13,
    color: P.twGray500,
    textAlign: 'center',
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
    marginBottom: 6,
  },
  actionCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: P.twGray800,
    textAlign: 'center',
  },
  txSection: {
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 11.5,
    fontWeight: '700',
    color: P.twGray500,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  txList: {
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingVertical: 4,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  txIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
