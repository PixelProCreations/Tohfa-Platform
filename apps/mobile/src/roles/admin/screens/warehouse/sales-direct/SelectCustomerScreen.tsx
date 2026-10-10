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
import { adminColors, adminType, adminShadow } from '../../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2.2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 16, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowRightIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function UserOutlineIcon({ size = 18, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckWhiteIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleGreenIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.success.text} strokeWidth="2" fill={adminColors.success.bg} />
      <Path
        d="M8 12l2.5 2.5L16 9.5"
        stroke={adminColors.success.text}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface CustomerRecord {
  id: string;
  code: string;
  name: string;
  phone: string;
  orderCount: number;
  walletBalance: number;
}

const MOCK_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'cus-1',
    code: 'CUS-00291',
    name: 'Rajesh Kumar',
    phone: '+91 XXXXX XXXXX',
    orderCount: 12,
    walletBalance: 1250,
  },
  {
    id: 'cus-2',
    code: 'CUS-00152',
    name: 'Priya Stores',
    phone: '+91 XXXXX XXXXX',
    orderCount: 8,
    walletBalance: 800,
  },
  {
    id: 'cus-3',
    code: 'CUS-00388',
    name: 'Kavitha Greens',
    phone: '+91 XXXXX XXXXX',
    orderCount: 19,
    walletBalance: 3400,
  },
  {
    id: 'cus-4',
    code: 'CUS-00412',
    name: 'Mani Fresh Mart',
    phone: '+91 XXXXX XXXXX',
    orderCount: 5,
    walletBalance: 450,
  },
];

import { PaymentScreen } from './PaymentScreen';

export interface SelectCustomerScreenProps {
  onBack?: (() => void) | undefined;
  onContinueToPayment?: ((customer: CustomerRecord) => void) | undefined;
}

export function SelectCustomerScreen({
  onBack,
  onContinueToPayment,
}: SelectCustomerScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cus-1');
  const [isDetailView, setIsDetailView] = useState<boolean>(false);
  const [isConfirmedSelected, setIsConfirmedSelected] = useState<boolean>(false);
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

  const handleSelectCard = (customer: CustomerRecord) => {
    setSelectedCustomerId(customer.id);
    setIsDetailView(true);
  };

  const handleConfirmSelectCustomer = () => {
    setIsConfirmedSelected(true);
    setIsDetailView(false);
  };

  const handleChangeCustomer = () => {
    setIsConfirmedSelected(false);
    setIsDetailView(false);
  };

  const handleContinue = () => {
    if (onContinueToPayment) {
      onContinueToPayment(selectedCustomer);
    } else {
      setShowPaymentScreen(true);
    }
  };

  if (showPaymentScreen) {
    return (
      <PaymentScreen
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
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner (#F0562A) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (isDetailView) {
                setIsDetailView(false);
              } else if (onBack) {
                onBack();
              }
            }}
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
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, ID or mobile"
            placeholderTextColor={adminColors.placeholder}
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
        {/* State 3: Confirmed Selected Banner (Matching Image 3) */}
        {isConfirmedSelected && (
          <View style={styles.confirmedBannerCard}>
            <View style={styles.confirmedLeftGroup}>
              <CheckCircleGreenIcon size={22} />
              <View>
                <Text style={styles.confirmedLabel}>Selected</Text>
                <Text style={styles.confirmedNameText}>
                  {selectedCustomer.name} · {selectedCustomer.code}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleChangeCustomer}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* State 2: Customer Detail Inspection Card (Matching Image 2) */}
        {!isConfirmedSelected && isDetailView && (
          <View style={styles.detailCard}>
            <View style={styles.detailHeaderRow}>
              <UserOutlineIcon size={18} color={adminColors.warning.text} />
              <Text style={styles.detailCustomerName}>{selectedCustomer.name}</Text>
            </View>

            {/* Row 1: Customer ID & Mobile */}
            <View style={styles.detailGridRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Customer ID</Text>
                <Text style={styles.detailValueCode}>{selectedCustomer.code}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Mobile</Text>
                <Text style={styles.detailValuePhone}>{selectedCustomer.phone}</Text>
              </View>
            </View>

            {/* Row 2: Orders & Wallet */}
            <View style={styles.detailGridRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Orders</Text>
                <Text style={styles.detailValueOrders}>{selectedCustomer.orderCount}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Wallet</Text>
                <Text style={styles.detailValueWallet}>
                  ₹{selectedCustomer.walletBalance.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Select Customer Button */}
            <TouchableOpacity
              style={styles.selectCustomerBtn}
              onPress={handleConfirmSelectCustomer}
              activeOpacity={0.85}
            >
              <CheckWhiteIcon size={18} />
              <Text style={styles.selectCustomerBtnText}>Select Customer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* State 1: Customer List (Matching Image 1) */}
        {!isConfirmedSelected && !isDetailView && (
          <>
            {filteredCustomers.map((customer) => {
              const isSelected = customer.id === selectedCustomerId;

              return (
                <TouchableOpacity
                  key={customer.id}
                  style={[
                    styles.customerCard,
                    isSelected && styles.customerCardSelected,
                  ]}
                  onPress={() => handleSelectCard(customer)}
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
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ─── Bottom Action Button (Matching Reference Image 1) ─── */}
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
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
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
    ...adminType.title,
    color: adminColors.onBrand,
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
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
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

  // ─── Customer Card (List View) ───
  customerCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 12,
  },
  customerCardSelected: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
  },
  customerName: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: 3,
  },
  customerSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 12,
  },
  ordersRow: {
    gap: 2,
  },
  ordersLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  ordersCount: {
    ...adminType.title,
    color: adminColors.ink,
  },

  // ─── Detail Card (Image 2) ───
  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    padding: 16,
    marginBottom: 14,
    ...adminShadow.sm,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  detailCustomerName: {
    ...adminType.title,
    color: adminColors.ink,
  },
  detailGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 3,
  },
  detailValueCode: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  detailValuePhone: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  detailValueOrders: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  detailValueWallet: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  selectCustomerBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    ...adminShadow.sm,
  },
  selectCustomerBtnText: {
    color: adminColors.onBrand,
    ...adminType.sectionHead,
  },

  // ─── Confirmed Selected Banner (Image 3) ───
  confirmedBannerCard: {
    backgroundColor: adminColors.success.bg,
    borderColor: adminColors.success.border,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmedLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  confirmedLabel: {
    ...adminType.caption,
    color: adminColors.success.text,
    marginBottom: 2,
  },
  confirmedNameText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  changeBtnText: {
    ...adminType.sectionHead,
    color: adminColors.warning.text,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  // ─── Notice Banner ───
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.brandTint,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  noticeBannerText: {
    flex: 1,
    ...adminType.body,
    color: adminColors.brandDeep,
    lineHeight: 17,
  },

  // ─── Bottom Bar ───
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: adminColors.canvas,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  continueBtnText: {
    color: adminColors.onBrand,
    ...adminType.title,
  },
});
