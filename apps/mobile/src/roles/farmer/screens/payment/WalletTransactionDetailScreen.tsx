import React, { useEffect } from 'react';
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
import Svg, { Path } from 'react-native-svg';
import { authPalette as P } from '../../theme';

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

function ArrowDownIcon({ size = 26, color = P.twGreen700 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M19 12l-7 7-7-7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ArrowUpRightIcon({ size = 26, color = P.twRed600 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 17L17 7M7 7h10v10"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface WalletTransactionItem {
  id: string;
  title: string;
  type: 'credit' | 'debit';
  amount: string;
  date: string;
  ref: string;
  orderId?: string;
  crop?: string;
  channel?: string;
  creditedOn?: string;
  balanceAfter?: string;
}

export interface WalletTransactionDetailScreenProps {
  transaction?: WalletTransactionItem;
  onBack?: () => void;
}

/**
 * Shown for any field a real transaction genuinely has no value for (e.g. an ADJUSTMENT
 * with no order reference). Previously this screen substituted plausible-looking fake data
 * instead ('#ORD-20260915', 'Online', a fake date) -- on a screen that shows a specific
 * money movement, that is worse than a blank: it invents evidence for a transaction that
 * never had it. Same reasoning as Step5Review's NOT_PROVIDED.
 */
const NOT_AVAILABLE = '—';

export function WalletTransactionDetailScreen({
  transaction,
  onBack,
}: WalletTransactionDetailScreenProps): React.JSX.Element {
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

  // No transaction was threaded through navigation -- this screen has nothing of its own to
  // fetch (WalletScreen already loaded the real object before navigating here), so there is
  // nothing honest to show. Distinct from any field on a real transaction being empty, which
  // is handled per-row below with NOT_AVAILABLE rather than invented data.
  if (!transaction) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={P.white} />
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowBackIcon size={20} color={P.twGreen800} />
            </TouchableOpacity>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.headerTitle}>Transaction Detail</Text>
            </View>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>This transaction could not be opened.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isCredit = transaction.type === 'credit';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={20} color={P.twGreen800} />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Transaction Detail</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Hero Badge & Amount */}
        <View style={styles.heroSection}>
          <View style={[styles.statusIconBox, { backgroundColor: isCredit ? P.twGreen50 : P.twRed50 }]}>
            {isCredit ? (
              <ArrowDownIcon size={26} color={P.twGreen700} />
            ) : (
              <ArrowUpRightIcon size={26} color={P.twRed600} />
            )}
          </View>
          <Text style={[styles.amountText, { color: isCredit ? P.twGreen700 : P.twGray900 }]}>
            {transaction.amount}
          </Text>
          <Text style={styles.subtitle}>
            {transaction.title} · {transaction.date}
          </Text>
        </View>

        {/* Details Table Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order</Text>
            <Text style={styles.detailValueMono}>{transaction.orderId ?? NOT_AVAILABLE}</Text>
          </View>

          {transaction.crop && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Crop</Text>
              <Text style={styles.detailValue}>{transaction.crop}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Channel</Text>
            <Text style={styles.detailValue}>{transaction.channel ?? NOT_AVAILABLE}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Credited On</Text>
            <Text style={styles.detailValue}>{transaction.creditedOn ?? NOT_AVAILABLE}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Wallet Balance After</Text>
            <Text style={styles.detailValueBold}>{transaction.balanceAfter ?? NOT_AVAILABLE}</Text>
          </View>
        </View>
      </ScrollView>
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: P.twGray500,
    textAlign: 'center',
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
    gap: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusIconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: P.twGray500,
    marginTop: 4,
  },
  detailsCard: {
    backgroundColor: P.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: P.twGray200,
    paddingHorizontal: 16,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: P.twGray100,
  },
  detailLabel: {
    fontSize: 13.5,
    color: P.twGray500,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13.5,
    color: P.twGray900,
    fontWeight: '600',
  },
  detailValueMono: {
    fontSize: 13.5,
    color: P.twGray900,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  detailValueBold: {
    fontSize: 14,
    color: P.twGray900,
    fontWeight: '800',
  },
});
