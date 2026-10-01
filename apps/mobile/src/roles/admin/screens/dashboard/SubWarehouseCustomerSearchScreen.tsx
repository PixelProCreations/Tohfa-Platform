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
import { SubWarehouseCustomerWalletScreen } from './SubWarehouseCustomerWalletScreen';

// ─── Design Tokens (#F0562A Existing Orange Palette) ─────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9CA3AF',
  textBody:      '#374151',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',
  greenBadge:    '#E6F5ED',
  greenText:     '#10B981',

  orangeNoticeBg:     '#FFF5F2',
  orangeNoticeBorder: '#FED7AA',
  orangeNoticeText:   '#C2410C',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function SearchIcon({ size = 18, color = '#7A726C' }: { size?: number; color?: string }) {
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

function QrScanIcon({ size = 20, color = '#7A726C' }: { size?: number; color?: string }) {
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

function InfoNoticeIcon({ size = 18, color = '#C2410C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8h.01M12 11v5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export interface CustomerSearchItem {
  name: string;
  code: string;
  id?: string;
  phone: string;
  balance: string;
  status?: string;
}

export interface SubWarehouseCustomerSearchScreenProps {
  onBack?: () => void;
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

export function SubWarehouseCustomerSearchScreen({
  onBack,
  onSelectCustomer,
  onNavigateToWallet,
  onNavigateToCashTopUp,
}: SubWarehouseCustomerSearchScreenProps) {
  const [query, setQuery] = useState('');
  const [selectedCustomerForWallet, setSelectedCustomerForWallet] = useState<CustomerSearchItem | null>(null);

  // If a customer is opened internally without onNavigateToWallet, show customer wallet
  if (selectedCustomerForWallet) {
    return (
      <SubWarehouseCustomerWalletScreen
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
        onNavigateToCashTopUp={() => {
          if (onNavigateToCashTopUp) {
            onNavigateToCashTopUp(selectedCustomerForWallet);
          } else if (onSelectCustomer) {
            handleCustomerPress(selectedCustomerForWallet);
          }
        }}
      />
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

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header (Orange Theme with Back Arrow) ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowBackIcon size={22} color="#FFFFFF" />
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
          <SearchIcon size={18} color={PALETTE.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Customer ID or mobile number"
            placeholderTextColor={PALETTE.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus={true}
            clearButtonMode="while-editing"
          />
          <TouchableOpacity
            onPress={() => Alert.alert('QR Scanner', 'Opening QR & Barcode scanner...')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <QrScanIcon size={20} color={PALETTE.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ─── Notice Info Banner ─── */}
        <View style={styles.noticeBanner}>
          <View style={styles.noticeIconWrap}>
            <InfoNoticeIcon size={18} color={PALETTE.orangeNoticeText} />
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
          <View style={[styles.sectionWrap, { marginTop: 10 }]}>
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
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
  },
  searchBarContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  noticeBanner: {
    backgroundColor: PALETTE.orangeNoticeBg,
    borderWidth: 1,
    borderColor: PALETTE.orangeNoticeBorder,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noticeIconWrap: {
    marginTop: 1,
  },
  noticeBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.orangeNoticeText,
    lineHeight: 16,
  },
  sectionWrap: {
    marginTop: 18,
  },
  resultsHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 10,
  },
  customerResultCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 10,
  },
  custResultName: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  custResultSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 3,
  },
  custBalancePill: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  custBalanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  emptyWrap: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: PALETTE.textSecondary,
  },
  recentTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentTag: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recentTagText: {
    fontSize: 12,
    color: PALETTE.textBody,
  },
});
