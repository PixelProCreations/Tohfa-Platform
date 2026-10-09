/**
 * Customer Search: find a customer to view their wallet or take a cash top-up.
 *
 * Serves both Main Warehouse admins (scope.warehouseId undefined = all
 * warehouses) and Sub Warehouse admins (one warehouse). The whole screen is
 * gated by 'customer.list.view'. This is presentation only; the server
 * re-checks the code and the warehouse scope on every request (CLAUDE.md 2.1).
 */
import React, { useState } from 'react';
import {
  Alert,
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
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { CustomerWalletScreen } from '../wallet-cashtopup/CustomerWalletScreen';
import { adminColors, adminType, adminRadius, adminSpacing } from '../../../theme';
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

function QrScanIcon({ size = 20, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Rect x="8" y="8" width="3" height="3" fill={color} />
      <Rect x="13" y="8" width="3" height="3" fill={color} />
      <Rect x="8" y="13" width="3" height="3" fill={color} />
      <Rect x="13" y="13" width="3" height="3" fill={color} />
    </Svg>
  );
}

function InfoNoticeIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8h.01M12 11v5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface CustomerSearchScreenProps extends WarehouseScreenBaseProps {
  onSelectCustomer?: ((name: string, id?: string) => void) | ((customer: CustomerSearchItem) => void);
  onNavigateToWallet?: (customer: CustomerSearchItem) => void;
  onNavigateToCashTopUp?: ((customer?: CustomerSearchItem) => void) | undefined;
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
}: CustomerSearchScreenProps) {
  // Hooks stay unconditional and before every early return.
  const [query, setQuery] = useState('');
  const [selectedCustomerForWallet, setSelectedCustomerForWallet] = useState<CustomerSearchItem | null>(null);

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
          <TouchableOpacity
            onPress={() => Alert.alert('QR Scanner', 'Opening QR & Barcode scanner...')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <QrScanIcon size={20} color={adminColors.muted} />
          </TouchableOpacity>
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

        {/* ─── Notice Info Banner ─── */}
        <View style={styles.noticeBanner}>
          <View style={styles.noticeIconWrap}>
            <InfoNoticeIcon size={18} color={adminColors.brandDeep} />
          </View>
          <Text style={styles.noticeBannerText}>
            Select a customer to view wallet balance and perform authorized top-ups.
          </Text>
        </View>

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
