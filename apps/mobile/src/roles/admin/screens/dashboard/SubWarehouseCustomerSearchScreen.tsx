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

const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',

  blueInfoBg:    '#EBF3FC',
  blueInfoBorder:'#BFDBFE',
  blueInfoText:  '#1E40AF',
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

function SearchIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function QrScanIcon({ size = 20, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="8" y="8" width="3" height="3" fill={color} />
      <Rect x="13" y="8" width="3" height="3" fill={color} />
      <Rect x="8" y="13" width="3" height="3" fill={color} />
      <Rect x="13" y="13" width="3" height="3" fill={color} />
    </Svg>
  );
}

function ProhibitedIcon({ size = 18, color = '#1E40AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M5.6 5.6l12.8 12.8" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export interface SubWarehouseCustomerSearchScreenProps {
  onBack?: () => void;
  onSelectCustomer?: (customer: { name: string; code: string; phone?: string; balance: string }) => void;
  onNavigateToWallet?: (customer: { name: string; code: string; phone?: string; balance: string }) => void;
  onNavigateToCashTopUp?: () => void;
}

export function SubWarehouseCustomerSearchScreen({
  onBack,
  onSelectCustomer,
  onNavigateToWallet,
  onNavigateToCashTopUp,
}: SubWarehouseCustomerSearchScreenProps) {
  const [query, setQuery] = useState('');
  const [selectedCustomerForWallet, setSelectedCustomerForWallet] = useState<{
    name: string;
    code: string;
    phone: string;
    balance: string;
  } | null>(null);

  // If a customer is opened, show the Customer Wallet screen (Screenshots 1 & 2)
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
            onNavigateToCashTopUp();
          } else if (onSelectCustomer) {
            onSelectCustomer(selectedCustomerForWallet);
          }
        }}
      />
    );
  }

  const sampleCustomers = [
    { name: 'Ravi Kumar', code: 'CUS-001245', phone: '+91 98765 43210', balance: '₹4,500' },
    { name: 'Priya Stores', code: 'CUS-00152', phone: '+91 98451 12345', balance: '₹2,100' },
    { name: 'Anand Kumar', code: 'CUS-00188', phone: '+91 97123 67890', balance: '₹850' },
  ];

  const filteredCustomers = query.trim().length > 0
    ? sampleCustomers.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.code.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.includes(query)
      )
    : sampleCustomers;

  const handleCustomerPress = (c: { name: string; code: string; phone: string; balance: string }) => {
    if (onNavigateToWallet) {
      onNavigateToWallet(c);
    } else {
      setSelectedCustomerForWallet(c);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowBackIcon size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Search</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search input with QR scan button */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={19} color={PALETTE.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Customer ID or mobile number"
            placeholderTextColor={PALETTE.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          <TouchableOpacity
            onPress={() => Alert.alert('QR Scanner', 'Opening QR & Barcode scanner...')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <QrScanIcon size={22} color={PALETTE.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Notice Info Banner */}
        <View style={styles.noticeBanner}>
          <View style={styles.noticeIconWrap}>
            <ProhibitedIcon size={18} color={PALETTE.blueInfoText} />
          </View>
          <Text style={styles.noticeBannerText}>
            No "Create Customer" action exists here — customer creation isn't an SWA permission in this build.
          </Text>
        </View>

        {/* Customer List (Matching or Recent/Suggested) */}
        <View style={{ marginTop: 20 }}>
          <Text style={styles.resultsHeader}>
            {query.trim().length > 0 ? 'Matching Customers' : 'Recent / Suggested Customers'}
          </Text>
          {filteredCustomers.map((c) => (
            <TouchableOpacity
              key={c.code}
              style={styles.customerResultCard}
              onPress={() => handleCustomerPress(c)}
              activeOpacity={0.75}
            >
              <View>
                <Text style={styles.custResultName}>{c.name}</Text>
                <Text style={styles.custResultSub}>{c.code} · {c.phone}</Text>
              </View>
              <View style={styles.custBalancePill}>
                <Text style={styles.custBalanceText}>{c.balance}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: PALETTE.textInk,
  },
  noticeBanner: {
    backgroundColor: PALETTE.blueInfoBg,
    borderWidth: 1,
    borderColor: PALETTE.blueInfoBorder,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noticeIconWrap: {
    marginTop: 1,
  },
  noticeBannerText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '500',
    color: PALETTE.blueInfoText,
    lineHeight: 17,
  },
  resultsHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 10,
  },
  customerResultCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 10,
  },
  custResultName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  custResultSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 3,
  },
  custBalancePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  custBalanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
});
