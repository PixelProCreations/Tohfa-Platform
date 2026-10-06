import React, { useState, useMemo } from 'react';
import {
  Alert,
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

// ─── Design Tokens (#F0562A Unified Subwarehouse Palette) ────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EBE5DC',
  divider:       '#F0EAE1',

  noticeBg:      '#FEF1EC',
  noticeBorder:  '#FCD9CE',
  noticeText:    '#7A3E26',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function SearchIcon({ size = 18, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2.2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 16, color = '#8B420F' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowRightIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface CustomerRecord {
  id: string;
  code: string;
  name: string;
  phone: string;
  orderCount: number;
}

const MOCK_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'cus-1',
    code: 'CUS-00291',
    name: 'Rajesh Kumar',
    phone: '+91 XXXXX XXXXX',
    orderCount: 12,
  },
  {
    id: 'cus-2',
    code: 'CUS-00152',
    name: 'Priya Stores',
    phone: '+91 XXXXX XXXXX',
    orderCount: 8,
  },
  {
    id: 'cus-3',
    code: 'CUS-00388',
    name: 'Kavitha Greens',
    phone: '+91 XXXXX XXXXX',
    orderCount: 19,
  },
  {
    id: 'cus-4',
    code: 'CUS-00412',
    name: 'Mani Fresh Mart',
    phone: '+91 XXXXX XXXXX',
    orderCount: 5,
  },
];

import { SubWarehousePaymentScreen } from './SubWarehousePaymentScreen';

export interface SubWarehouseSelectCustomerScreenProps {
  onBack?: (() => void) | undefined;
  onContinueToPayment?: ((customer: CustomerRecord) => void) | undefined;
}

export function SubWarehouseSelectCustomerScreen({
  onBack,
  onContinueToPayment,
}: SubWarehouseSelectCustomerScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cus-1');
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_CUSTOMERS;
    const q = searchQuery.toLowerCase();
    return MOCK_CUSTOMERS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [searchQuery]);

  const selectedCustomer =
    MOCK_CUSTOMERS.find((c) => c.id === selectedCustomerId) ?? MOCK_CUSTOMERS[0]!;

  const handleContinue = () => {
    if (onContinueToPayment) {
      onContinueToPayment(selectedCustomer);
    } else {
      setShowPaymentScreen(true);
    }
  };

  if (showPaymentScreen) {
    return (
      <SubWarehousePaymentScreen
        amountDue={320}
        onBack={() => setShowPaymentScreen(false)}
        onPaymentConfirmed={() => {
          setShowPaymentScreen(false);
          if (onBack) onBack();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Brand Header Banner (#F0562A) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Customer</Text>
        </View>
      </View>

      {/* ─── Search Bar ─── */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#9E9690" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, ID or mobile"
            placeholderTextColor="#9E9690"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>
      </View>

      {/* ─── Main Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredCustomers.map((customer) => {
          const isSelected = customer.id === selectedCustomerId;

          return (
            <TouchableOpacity
              key={customer.id}
              style={[
                styles.customerCard,
                isSelected && styles.customerCardSelected,
              ]}
              onPress={() => setSelectedCustomerId(customer.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.customerName}>{customer.name}</Text>
              <Text style={styles.customerSubtitle}>
                {customer.code} · {customer.phone}
              </Text>

              <View style={styles.ordersRow}>
                <Text style={styles.ordersLabel}>Orders</Text>
                <Text style={styles.ordersCount}>{customer.orderCount}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Informational Banner */}
        <View style={styles.noticeBanner}>
          <InfoCircleIcon size={16} color="#8B420F" />
          <Text style={styles.noticeBannerText}>
            SWA has view access to customers only — there's no Create Customer or Edit Customer action anywhere in this flow.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ─── Bottom Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <ArrowRightIcon size={18} />
          <Text style={styles.continueBtnText}>Continue to Payment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  customerCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 12,
  },
  customerCardSelected: {
    borderColor: PALETTE.primary,
    backgroundColor: '#FFFAF7',
    borderWidth: 1.5,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 3,
  },
  customerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginBottom: 12,
  },
  ordersRow: {
    gap: 2,
  },
  ordersLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.textMuted,
  },
  ordersCount: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: PALETTE.noticeBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.noticeBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  noticeBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.noticeText,
    lineHeight: 17,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: PALETTE.pageBg,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
