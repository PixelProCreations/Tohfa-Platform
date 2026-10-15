/**
 * Customer Search: find a customer to view their wallet or take a cash top-up.
 *
 * Serves both Main Warehouse admins (scope.warehouseId undefined = all
 * warehouses) and Sub Warehouse admins (one warehouse). The whole screen is
 * gated by 'customer.list.view'. This is presentation only; the server
 * re-checks the code and the warehouse scope on every request (CLAUDE.md 2.1).
 *
 * Live mode (plan phase 9, `live`): the wallet flow passes the counter lookup
 * (GET /admin/sales/customers/lookup, sales.sale.create) and this screen only
 * draws it: the search box, the server's matches (masked mobile as sent,
 * BR-92g) and the loading / error / no-match states. No sample rows, recent
 * searches or scanner stub are shown then. Without `live` the old sample
 * search remains for hosts not yet moved to the wallet flow.
 */
import React, { useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CustomerWalletScreen } from '../wallet-cashtopup/CustomerWalletScreen';
import { CUSTOMER_WALLET_TRANSACTIONS } from '../wallet-cashtopup/fixtures';
import { LOOKUP_NO_MATCH_KEY, type LookupView, type TopUpCustomer } from '../wallet-cashtopup/mappers';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminType, adminRadius, adminSpacing } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import type { WarehouseScreenBaseProps } from '../finance-expenses';
import type { CustomerSearchItem } from './types';

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 21l-4.35-4.35"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** The live counter lookup, owned by the wallet flow (plan phase 9). */
export interface CustomerLookupLiveProps {
  query: string;
  onQueryChange: (text: string) => void;
  customers: readonly TopUpCustomer[];
  view: LookupView;
  error: unknown;
  onRetry: () => void;
  onSelect: (customer: TopUpCustomer) => void;
}

export interface CustomerSearchScreenProps extends WarehouseScreenBaseProps {
  onSelectCustomer?: ((name: string, id?: string) => void) | ((customer: CustomerSearchItem) => void);
  onNavigateToWallet?: (customer: CustomerSearchItem) => void;
  onNavigateToCashTopUp?: ((customer?: CustomerSearchItem) => void) | undefined;
  /** Live mode: the server lookup instead of the sample search. */
  live?: CustomerLookupLiveProps | undefined;
}

/** The live lookup's body (search box, matches, states). */
function LiveLookupBody({ can, live }: { can: WarehouseScreenBaseProps['can']; live: CustomerLookupLiveProps }) {
  // The lookup's own code; hiding is presentation only, the server re-checks it.
  if (!can('sales.sale.create')) {
    return (
      <View style={styles.scrollContent}>
        <View style={styles.deniedCard}>
          <Text style={styles.deniedText}>{t('wallet.lookup.notAvailable')}</Text>
        </View>
      </View>
    );
  }
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.searchBarContainer}>
        <SearchIcon size={18} color={adminColors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('wallet.lookup.placeholder')}
          placeholderTextColor={adminColors.placeholder}
          value={live.query}
          onChangeText={live.onQueryChange}
          autoFocus={true}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.sectionWrap}>
        {live.view === 'idle' ? <Text style={styles.emptyText}>{t('wallet.lookup.prompt')}</Text> : null}
        {live.view === 'loading' ? <AdminLoadingState /> : null}
        {live.view === 'error' ? <AdminErrorState error={live.error} onRetry={live.onRetry} /> : null}
        {live.view === 'noMatch' ? <AdminEmptyState title={t(LOOKUP_NO_MATCH_KEY)} /> : null}
        {live.view === 'ready' ? (
          <>
            <Text style={styles.resultsHeader}>{t('wallet.lookup.results')}</Text>
            {live.customers.map((c) => (
              <TouchableOpacity
                key={c.customerUuid}
                style={styles.customerResultCard}
                onPress={() => live.onSelect(c)}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <View style={styles.flex}>
                  <Text style={styles.custResultName}>{c.name}</Text>
                  <Text style={styles.custResultSub}>
                    {c.code} · {c.mobileMasked}
                  </Text>
                </View>
                {c.balancePaise === null ? null : (
                  <View style={styles.custBalancePill}>
                    <Text style={styles.custBalanceText}>{formatPaise(c.balancePaise)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const RECENT_SEARCHES = ['Rajesh Kumar', 'CUS-00192', 'XXXXX12345'];

const SEARCH_DATABASE: CustomerSearchItem[] = [
  { name: 'Rajesh Kumar', code: 'CUS-00291', id: 'CUS-00291', phone: '+91 98765 43210', balance: '₹4,500', status: 'Active' },
  { name: 'Priya Stores', code: 'CUS-00152', id: 'CUS-00152', phone: '+91 98451 12345', balance: '₹2,100', status: 'Active' },
  { name: 'Ganesh K.', code: 'CUS-00087', id: 'CUS-00087', phone: '+91 99887 76655', balance: '₹620', status: 'Inactive' },
  { name: 'Ramesh Patel', code: 'CUS-00192', id: 'CUS-00192', phone: '+91 98111 12345', balance: '₹1,250', status: 'Active' },
  { name: 'Anand Kumar', code: 'CUS-00188', id: 'CUS-00188', phone: '+91 97123 67890', balance: '₹850', status: 'Active' },
];

export function CustomerSearchScreen({
  scope,
  can,
  onBack,
  onSelectCustomer,
  onNavigateToWallet,
  onNavigateToCashTopUp,
  live,
}: CustomerSearchScreenProps) {
  // Hooks stay unconditional and before every early return.
  const [query, setQuery] = useState('');
  const [selectedCustomerForWallet, setSelectedCustomerForWallet] = useState<CustomerSearchItem | null>(null);

  if (live !== undefined) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
          >
            <ArrowBackIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('wallet.lookup.title')}</Text>
        </View>
        <LiveLookupBody can={can} live={live} />
      </SafeAreaView>
    );
  }

  // Declared before the internal-wallet branch below, which calls it.
  const handleCustomerPress = (c: CustomerSearchItem) => {
    if (onNavigateToWallet) {
      onNavigateToWallet(c);
    } else if (onSelectCustomer) {
      if ((onSelectCustomer as any).length >= 2) {
        (onSelectCustomer as any)(c.name, c.code);
      } else {
        (onSelectCustomer as any)(c);
      }
    } else {
      setSelectedCustomerForWallet(c);
    }
  };

  // If a customer is opened internally without onNavigateToWallet, show customer wallet
  if (selectedCustomerForWallet) {
    return (
      <CustomerWalletScreen
        scope={scope}
        can={can}
        customer={{
          name: selectedCustomerForWallet.name,
          id: selectedCustomerForWallet.code,
          mobile: selectedCustomerForWallet.phone,
          balance: selectedCustomerForWallet.balance.includes('.00')
            ? selectedCustomerForWallet.balance
            : `${selectedCustomerForWallet.balance}.00`,
          totalCredited: '₹25,000',
          totalUsed: '₹20,500',
        }}
        transactions={CUSTOMER_WALLET_TRANSACTIONS}
        onBack={() => setSelectedCustomerForWallet(null)}
        onCashTopUp={() => {
          if (onNavigateToCashTopUp) {
            onNavigateToCashTopUp(selectedCustomerForWallet);
          } else if (onSelectCustomer) {
            handleCustomerPress(selectedCustomerForWallet);
          }
        }}
      />
    );
  }

  // Hiding the screen is presentation only; the server re-checks
  // 'customer.list.view' (and the warehouse scope) on every request.
  if (!can('customer.list.view')) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Customers</Text>
        </View>
        <View style={styles.scrollContent}>
          <View style={styles.deniedCard}>
            <Text style={styles.deniedText}>Customer search is not available for your role.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const trimmed = query.trim().toLowerCase();
  const searchResults = trimmed
    ? SEARCH_DATABASE.filter(
        (c) =>
          c.name.toLowerCase().includes(trimmed) ||
          c.code.toLowerCase().includes(trimmed) ||
          c.phone.toLowerCase().includes(trimmed)
      )
    : SEARCH_DATABASE;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header (Orange Theme with Back Arrow) ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowBackIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Customers</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Search Bar ─── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Customer ID or mobile number"
            placeholderTextColor={adminColors.placeholder}
            value={query}
            onChangeText={setQuery}
            autoFocus={true}
            clearButtonMode="while-editing"
          />
          {/* The QR scanner button was a placeholder alert with no scanner behind it; removed. */}
        </View>

        {/* Read-only scope indicator, not a toggle. Main Warehouse searches every
            warehouse (the real search will omit the warehouseId filter; the mock
            data has no warehouse field). A Sub Warehouse admin is limited to their
            own warehouse server-side, so no pill is shown for them. */}
        {scope.warehouseId === undefined && (
          <View style={styles.scopePill}>
            <Text style={styles.scopePillText}>All warehouses</Text>
          </View>
        )}

        {/* ─── Customer Results ─── */}
        <View style={styles.sectionWrap}>
          <Text style={styles.resultsHeader}>
            {trimmed ? 'Matching Customers' : 'Recent / Suggested Customers'}
          </Text>

          {searchResults.length > 0 ? (
            searchResults.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={styles.customerResultCard}
                onPress={() => handleCustomerPress(c)}
                activeOpacity={0.75}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.custResultName}>{c.name}</Text>
                  <Text style={styles.custResultSub}>
                    {c.code} · {c.phone}
                  </Text>
                </View>
                <View style={styles.custBalancePill}>
                  <Text style={styles.custBalanceText}>{c.balance}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No matching customers found</Text>
            </View>
          )}
        </View>

        {/* ─── Quick Recent Tags (when not typing) ─── */}
        {!trimmed && (
          <View style={[styles.sectionWrap, { marginTop: adminSpacing.md }]}>
            <Text style={styles.resultsHeader}>Recent Searches</Text>
            <View style={styles.recentTagsWrap}>
              {RECENT_SEARCHES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.recentTag}
                  onPress={() => setQuery(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.recentTagText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  flex: { flex: 1 },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: Platform.OS === 'android' ? adminSpacing.md : adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    gap: adminSpacing.md,
  },
  backBtn: {
    padding: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  deniedCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.xl,
    alignItems: 'center',
  },
  deniedText: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
  },
  searchBarContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  searchInput: {
    ...adminType.body,
    flex: 1,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  scopePill: {
    alignSelf: 'flex-start',
    marginTop: adminSpacing.sm,
    backgroundColor: adminColors.brandSoft.bg,
    borderWidth: 1,
    borderColor: adminColors.brandSoft.border,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
  },
  scopePillText: {
    ...adminType.caption,
    color: adminColors.brandSoft.text,
  },
  // Old notice (pale orange bg, orange-200 border, orange-700 text) -> brandTint bg + border, brandDeep text.
  noticeBanner: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  noticeIconWrap: {
    marginTop: 1,
  },
  noticeBannerText: {
    ...adminType.rowMeta,
    flex: 1,
    color: adminColors.brandDeep,
  },
  sectionWrap: {
    marginTop: adminSpacing.lg,
  },
  resultsHeader: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  customerResultCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
  },
  custResultName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  custResultSub: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 3,
  },
  custBalancePill: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.xs,
  },
  custBalanceText: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
  },
  emptyWrap: {
    padding: adminSpacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  recentTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  recentTag: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  recentTagText: {
    ...adminType.rowMeta,
    color: adminColors.ink,
  },
});
