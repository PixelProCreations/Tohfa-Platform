import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { authPalette as P, typography } from '../../theme';
import { ApiError, formatErrorMessage } from '../../../../shell/api/client';
import { t } from '../../../../i18n/farmer';
import {
  getMyUpiPreference,
  listMyBankAccounts,
  type FarmerBankAccount,
  type FarmerUpiPreference,
} from '../../api/payoutDestinations';
import { formatMoneyAmount, getMyWallet, type Wallet } from '../../api/wallet';

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

function InfoCircleIcon({ size = 18, color = P.twBlue700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="8" r="1.2" fill={color} />
    </Svg>
  );
}

function BankColumnsIcon({ size = 22, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 4l9 5.5v2H3v-2z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Line x1="6" y1="11.5" x2="6" y2="18.5" stroke={color} strokeWidth="1.8" />
      <Line x1="10" y1="11.5" x2="10" y2="18.5" stroke={color} strokeWidth="1.8" />
      <Line x1="14" y1="11.5" x2="14" y2="18.5" stroke={color} strokeWidth="1.8" />
      <Line x1="18" y1="11.5" x2="18" y2="18.5" stroke={color} strokeWidth="1.8" />
      <Path d="M2 19h20v2H2v-2z" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function QrCodeIcon({ size = 22, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.8" />
      <Rect x="14" y="4" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.8" />
      <Rect x="4" y="14" width="6" height="6" rx="1.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="7" cy="7" r="1" fill={color} />
      <Circle cx="17" cy="7" r="1" fill={color} />
      <Circle cx="7" cy="17" r="1" fill={color} />
      <Path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" fill={color} />
    </Svg>
  );
}

function ReceiptDocIcon({ size = 22, color = P.twBlue700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="3" width="14" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Line x1="8.5" y1="8" x2="15.5" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8.5" y1="12" x2="15.5" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8.5" y1="16" x2="12.5" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function WalletIcon({ size = 22, color = P.twAmber800 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M16 12h5v4h-5a2 2 0 010-4z" stroke={color} strokeWidth="1.8" />
      <Circle cx="18" cy="14" r="1" fill={color} />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = P.twGray400 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Component Props ──────────────────────────────────────────────────────────

export interface BankPaymentScreenProps {
  onBack?: () => void;
  onNavigateToBankAccount?: () => void;
  onNavigateToUpiId?: () => void;
  onNavigateToPayoutHistory?: () => void;
  onNavigateToWallet?: () => void;
}

export function BankPaymentScreen({
  onBack,
  onNavigateToBankAccount,
  onNavigateToUpiId,
  onNavigateToPayoutHistory,
  onNavigateToWallet,
}: BankPaymentScreenProps): React.JSX.Element {
  // Both cards come from the server (GET /farmers/me/bank-accounts and GET /farmers/me/upi).
  // Each is loaded and can fail on its own, so one failing never blanks or invents the other.
  // `undefined` = not loaded yet, `null` = loaded and the farmer has none.
  const [bank, setBank] = useState<FarmerBankAccount | null | undefined>(undefined);
  const [upi, setUpi] = useState<FarmerUpiPreference | null | undefined>(undefined);
  const [bankError, setBankError] = useState<string | null>(null);
  const [upiError, setUpiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // The wallet card loads on its own too, so a wallet failure never hides the bank/UPI cards
  // (and vice versa). `undefined` = not loaded yet, `null` = the server has no wallet for us.
  const [wallet, setWallet] = useState<Wallet | null | undefined>(undefined);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  const loadWallet = useCallback(async () => {
    setWalletLoading(true);
    setWalletError(null);
    setWallet(undefined);
    try {
      setWallet(await getMyWallet());
    } catch (err) {
      // A 404 means there is no wallet row: an empty state, not an error.
      if (err instanceof ApiError && err.problem.status === 404) setWallet(null);
      else setWalletError(formatErrorMessage(err, t('farmer.payment.loadFailed')));
    }
    setWalletLoading(false);
  }, []);

  const loadDestinations = useCallback(async () => {
    setLoading(true);
    setBankError(null);
    setUpiError(null);
    setBank(undefined);
    setUpi(undefined);
    const loadBank = async () => {
      try {
        const list = await listMyBankAccounts();
        // Same rule as BankAccountScreen: only rows that are actually a bank account.
        const banks = list.filter((a) => a.bankName !== null);
        setBank(banks.find((a) => a.isDefault) ?? banks[0] ?? null);
      } catch (err) {
        setBankError(formatErrorMessage(err, t('farmer.payment.loadFailed')));
      }
    };
    const loadUpi = async () => {
      try {
        setUpi(await getMyUpiPreference());
      } catch (err) {
        // A 404 means no UPI id is registered yet: an empty state, not an error.
        if (err instanceof ApiError && err.problem.status === 404) setUpi(null);
        else setUpiError(formatErrorMessage(err, t('farmer.payment.loadFailed')));
      }
    };
    await Promise.all([loadBank(), loadUpi()]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadDestinations();
    void loadWallet();
  }, [loadDestinations, loadWallet]);

  const loadError = bankError ?? upiError ?? walletError;
  const retryAll = () => {
    void loadDestinations();
    void loadWallet();
  };

  // What each card shows, derived once so the visible text and the screen-reader label
  // can never disagree.
  const verifiedText = t('farmer.payment.status.verified');
  const pendingText = t('farmer.payment.status.pending');
  const notAddedText = t('farmer.payment.status.notAdded');

  let bankSubtitle: string | null = null;
  let bankBadge: { text: string; verified: boolean } | null = null;
  if (bankError) {
    bankSubtitle = t('farmer.payment.summary.unavailable');
  } else if (bank === null) {
    bankSubtitle = t('farmer.payment.summary.bank.empty');
    bankBadge = { text: notAddedText, verified: false };
  } else if (bank) {
    bankSubtitle = bank.accountNumberLast4
      ? `${bank.bankName ?? ''} • • • • ${bank.accountNumberLast4}`.trim()
      : (bank.bankName ?? '');
    bankBadge = { text: bank.isVerified ? verifiedText : pendingText, verified: bank.isVerified };
  }

  let upiSubtitle: string | null = null;
  let upiBadge: { text: string; verified: boolean } | null = null;
  if (upiError) {
    upiSubtitle = t('farmer.payment.summary.unavailable');
  } else if (upi === null) {
    upiSubtitle = t('farmer.payment.summary.upi.empty');
    upiBadge = { text: notAddedText, verified: false };
  } else if (upi) {
    upiSubtitle = upi.upiVpa;
    upiBadge = { text: upi.isVerified ? verifiedText : pendingText, verified: upi.isVerified };
  }

  // The balance string is formatted, never computed: formatMoneyAmount only re-groups digits.
  // The transaction count is deliberately absent: /wallets/me/transactions is cursor-paged and
  // returns no total, so any number here would be a page size, not a count.
  let walletSubtitle: string | null = null;
  if (walletError) {
    walletSubtitle = t('farmer.payment.summary.unavailable');
  } else if (wallet === null) {
    walletSubtitle = t('farmer.payment.summary.wallet.empty');
  } else if (wallet) {
    walletSubtitle = t('farmer.payment.summary.wallet.balance', {
      amount: formatMoneyAmount(wallet.balance),
    });
  }
  const walletLabel = [t('farmer.payment.summary.wallet.title'), walletSubtitle]
    .filter((x): x is string => !!x)
    .join('. ');

  const bankLabel = [t('farmer.payment.summary.bank.title'), bankSubtitle, bankBadge?.text]
    .filter((x): x is string => !!x)
    .join('. ');
  const upiLabel = [t('farmer.payment.summary.upi.title'), upiSubtitle, upiBadge?.text]
    .filter((x): x is string => !!x)
    .join('. ');

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
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.twGreen800} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Bank & Payment</Text>
            <Text style={styles.headerSubtitle}>Manage how you receive payouts</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.noticeBanner}>
          <View style={styles.noticeIconCol}>
            <InfoCircleIcon size={20} color={P.twBlue700} />
          </View>
          <Text style={styles.noticeText}>
            Bank and UPI details are verified manually by TOHFA Admin before they can receive a payout. This can take up to 2 business days.
          </Text>
        </View>

        {loadError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{loadError}</Text>
            <TouchableOpacity
              onPress={retryAll}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('farmer.payment.retry')}
            >
              <Text style={styles.errorRetryText}>{t('farmer.payment.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* 4 Navigation Cards */}
        <View style={styles.cardsList}>
          {/* Card 1: Bank Account */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={onNavigateToBankAccount}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel={bankLabel}
          >
            <View style={[styles.iconBox, { backgroundColor: P.twGreen50 }]}>
              <BankColumnsIcon size={22} color={P.twGreen700} />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Bank Account</Text>
              {loading ? (
                <View style={styles.loadingRow} accessibilityLabel={t('farmer.payment.loading')}>
                  <ActivityIndicator size="small" color={P.forestGreen} />
                </View>
              ) : (
                <>
                  <Text style={styles.cardSubtitle}>{bankSubtitle}</Text>
                  {bankBadge ? (
                    <View style={bankBadge.verified ? styles.verifiedBadge : styles.pendingBadge}>
                      <Text
                        style={bankBadge.verified ? styles.verifiedBadgeText : styles.pendingBadgeText}
                      >
                        {bankBadge.text}
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>

            <ChevronRightIcon size={18} color={P.twGray400} />
          </TouchableOpacity>

          {/* Card 2: UPI ID */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={onNavigateToUpiId}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel={upiLabel}
          >
            <View style={[styles.iconBox, { backgroundColor: P.twAmber50 }]}>
              <QrCodeIcon size={22} color={P.twAmber800} />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>UPI ID</Text>
              {loading ? (
                <View style={styles.loadingRow} accessibilityLabel={t('farmer.payment.loading')}>
                  <ActivityIndicator size="small" color={P.forestGreen} />
                </View>
              ) : (
                <>
                  <Text style={styles.cardSubtitle}>{upiSubtitle}</Text>
                  {upiBadge ? (
                    <View style={upiBadge.verified ? styles.verifiedBadge : styles.pendingBadge}>
                      <Text
                        style={upiBadge.verified ? styles.verifiedBadgeText : styles.pendingBadgeText}
                      >
                        {upiBadge.text}
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>

            <ChevronRightIcon size={18} color={P.twGray400} />
          </TouchableOpacity>

          {/* Card 3: Payout History */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={onNavigateToPayoutHistory}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel="Payout History. All past and pending payouts."
          >
            <View style={[styles.iconBox, { backgroundColor: P.twBlue50 }]}>
              <ReceiptDocIcon size={22} color={P.twBlue700} />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Payout History</Text>
              <Text style={styles.cardSubtitle}>All past and pending payouts</Text>
            </View>

            <ChevronRightIcon size={18} color={P.twGray400} />
          </TouchableOpacity>

          {/* Card 4: Wallet */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={onNavigateToWallet}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel={walletLabel}
          >
            <View style={[styles.iconBox, { backgroundColor: P.twAmber50 }]}>
              <WalletIcon size={22} color={P.twAmber800} />
            </View>

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Wallet</Text>
              {walletLoading ? (
                <View style={styles.loadingRow} accessibilityLabel={t('farmer.payment.loading')}>
                  <ActivityIndicator size="small" color={P.forestGreen} />
                </View>
              ) : (
                <Text style={styles.cardSubtitle}>{walletSubtitle}</Text>
              )}
            </View>

            <ChevronRightIcon size={18} color={P.twGray400} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

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
    fontSize: typography.title,
    fontWeight: '800',
    color: P.twGray900,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 2,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: P.twGray50,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  noticeBanner: {
    flexDirection: 'row',
    backgroundColor: P.twBlue50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: P.twSky200,
    padding: 14,
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  noticeIconCol: {
    marginRight: 10,
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    fontSize: typography.bodySmall,
    lineHeight: 18,
    color: P.twBlue800,
    fontWeight: '500',
  },
  cardsList: {
    gap: 12,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: P.twGray200,
    padding: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1.5,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.twGray900,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: typography.bodySmall,
    fontWeight: '400',
    color: P.twGray500,
    marginTop: 3,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: P.twGreen100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  verifiedBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twGreen800,
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: P.twAmber100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  pendingBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: P.twAmber900,
  },
  loadingRow: {
    alignItems: 'flex-start',
    marginTop: 6,
  },
  errorBanner: {
    backgroundColor: P.twRed50,
    borderColor: P.twRed200,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 6,
  },
  errorBannerText: {
    color: P.twRed700,
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },
  errorRetryText: {
    color: P.twRed700,
    fontSize: typography.bodySmall,
    fontWeight: '800',
  },
});
