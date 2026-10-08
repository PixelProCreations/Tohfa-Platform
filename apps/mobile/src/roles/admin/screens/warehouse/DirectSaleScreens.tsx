import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

const PALETTE = {
  headerBg: '#F0562A',
  headerBgDark: '#D4451B',
  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  border: '#EDE8E0',
  borderLight: '#F4EFE9',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  primary: '#F0562A',
  primarySoft: '#FEF1EC',
  primaryBorder: '#FCD9CE',
  greenBadgeBg: '#E6F4EA',
  greenBadgeText: '#0D6B4F',
  greenCheckBg: '#D1FAE5',
  greenCheckIcon: '#10B981',
  infoBannerBg: '#FFF4ED',
  infoBannerBorder: '#FFE2D1',
  infoBannerText: '#8A583A',
  amountBg: '#FBF5EE',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowLeftWhiteIcon({ size = 22, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#9E9690' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ShoppingCartIcon({ size = 24, color = '#9E9690' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="21" r="1" stroke={color} strokeWidth="2" />
      <Circle cx="20" cy="21" r="1" stroke={color} strokeWidth="2" />
      <Path
        d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UserCustomerIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 14, color = '#1E1612' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CashBanknoteIcon({ size = 24, color = '#1E1612' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="12" rx="2" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="2.5" stroke={color} strokeWidth="1.8" />
      <Path d="M6 12h.01M18 12h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function UpiQrIcon({ size = 24, color = '#1E1612' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.8" />
      <Path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2v1h-2z" fill={color} />
    </Svg>
  );
}

function CreditCardIcon({ size = 24, color = '#1E1612' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth="1.8" />
      <Line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function WalletIcon({ size = 24, color = '#1E1612' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 7H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M16 14h5v4h-5a2 2 0 0 1-2-2 2 2 0 0 1 2-2Z" stroke={color} strokeWidth="1.8" />
      <Path d="M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function CheckmarkCircleLargeIcon({ size = 44, color = '#10B981' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="#E6F4EA" />
      <Path d="M8 12.5l2.5 2.5L16 9.5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InvoiceDocumentIcon({ size = 18, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Data Types ─────────────────────────────────────────────────────────────

export interface ProductItem {
  id: string;
  name: string;
  grade: string;
  batchId: string;
  pricePerKg: number;
  availableKg: number;
  quantitySelected: number;
}

export interface DirectSaleCustomerItem {
  id: string;
  name: string;
  customerId: string;
  phone?: string | undefined;
}

export interface SaleRecordItem {
  id: string;
  saleId: string;
  customerName: string;
  itemCount: number;
  warehouse: string;
  amount: number;
  status: 'Paid' | 'Pending';
}

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'p1',
    name: 'Tomato',
    grade: 'Grade 1',
    batchId: 'BAT-2026-0012',
    pricePerKg: 100,
    availableKg: 48,
    quantitySelected: 2,
  },
  {
    id: 'p2',
    name: 'Carrot',
    grade: 'Grade 1',
    batchId: 'BAT-2026-0018',
    pricePerKg: 120,
    availableKg: 25,
    quantitySelected: 1,
  },
  {
    id: 'p3',
    name: 'Potato',
    grade: 'Grade 1',
    batchId: 'BAT-2026-0034',
    pricePerKg: 45,
    availableKg: 80,
    quantitySelected: 0,
  },
];

const INITIAL_CUSTOMERS: DirectSaleCustomerItem[] = [
  { id: 'c1', name: 'Arun Kumar', customerId: 'CUS-00251', phone: '+91 98765 43210' },
  { id: 'c2', name: 'Ravi Teja', customerId: 'CUS-00194', phone: '+91 94432 12345' },
  { id: 'c3', name: 'Meena Stores', customerId: 'CUS-00318', phone: '+91 98421 98765' },
];

const INITIAL_SALES_HISTORY: SaleRecordItem[] = [
  {
    id: 's1',
    saleId: 'SALE-00251',
    customerName: 'Arun Kumar',
    itemCount: 2,
    warehouse: 'Coonoor',
    amount: 320,
    status: 'Paid',
  },
  {
    id: 's2',
    saleId: 'SALE-00250',
    customerName: 'Ravi Teja',
    itemCount: 4,
    warehouse: 'Ooty',
    amount: 850,
    status: 'Paid',
  },
  {
    id: 's3',
    saleId: 'SALE-00249',
    customerName: 'Nilgiri HORECA',
    itemCount: 12,
    warehouse: 'Coonoor',
    amount: 4800,
    status: 'Paid',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Screen 1: New Direct Sale Screen
// ─────────────────────────────────────────────────────────────────────────────

export interface NewDirectSaleScreenProps {
  warehouseName?: string | undefined;
  onBack: () => void;
  onSelectProducts: () => void;
  cartItems?: ProductItem[] | undefined;
}

export function NewDirectSaleScreen({
  warehouseName = 'Coonoor',
  onBack,
  onSelectProducts,
  cartItems = [],
}: NewDirectSaleScreenProps) {
  const [selectedWH, setSelectedWH] = useState(warehouseName);
  const [showWHModal, setShowWHModal] = useState(false);

  const WH_LIST = ['Coonoor', 'Ooty', 'Kotagiri', 'Gudalur'];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.8}>
            <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Direct Sale</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad}>
        {/* Sale Context */}
        <Text style={styles.sectionLabel}>Sale Context</Text>
        <View style={styles.card}>
          <View style={styles.contextRow}>
            {/* Warehouse Selector */}
            <TouchableOpacity
              style={styles.contextCol}
              onPress={() => setShowWHModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.contextTitle}>Warehouse</Text>
              <View style={styles.whSelectRow}>
                <Text style={styles.contextValue}>{selectedWH}</Text>
                <ChevronDownIcon size={12} color="#1E1612" />
              </View>
            </TouchableOpacity>

            {/* Sales Channel */}
            <View style={styles.contextColRight}>
              <Text style={styles.contextTitle}>Sales Channel</Text>
              <Text style={styles.contextValue}>Direct Sale</Text>
            </View>
          </View>
        </View>

        {/* Current Cart */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Current Cart</Text>
        <View style={styles.card}>
          {cartItems.length === 0 ? (
            <View style={styles.emptyCartWrap}>
              <ShoppingCartIcon size={36} color="#9E9690" />
              <Text style={styles.emptyCartText}>No products selected</Text>
            </View>
          ) : (
            <View style={styles.cartListWrap}>
              {cartItems.map((item, index) => (
                <View key={item.id}>
                  {index > 0 && <View style={styles.cardDivider} />}
                  <View style={styles.cartItemRow}>
                    <Text style={styles.cartItemName}>
                      {item.name} - {item.quantitySelected} KG
                    </Text>
                    <Text style={styles.cartItemPrice}>
                      ₹{item.pricePerKg * item.quantitySelected}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA Button */}
      <View style={styles.bottomCtaWrap}>
        <TouchableOpacity style={styles.ctaButton} onPress={onSelectProducts} activeOpacity={0.85}>
          <SearchIcon size={18} color="#FFFFFF" />
          <Text style={styles.ctaButtonText}>Select Products</Text>
        </TouchableOpacity>
      </View>

      {/* Warehouse Selector Modal */}
      <Modal visible={showWHModal} transparent animationType="fade" onRequestClose={() => setShowWHModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowWHModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Warehouse</Text>
            {WH_LIST.map((wh) => (
              <TouchableOpacity
                key={wh}
                style={[styles.modalOption, selectedWH === wh && styles.modalOptionActive]}
                onPress={() => {
                  setSelectedWH(wh);
                  setShowWHModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, selectedWH === wh && styles.modalOptionTextActive]}>
                  {wh} Warehouse
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 2: Select Products Screen
// ─────────────────────────────────────────────────────────────────────────────

export interface SelectProductsScreenProps {
  onBack: () => void;
  onReviewCart: (selectedProducts: ProductItem[]) => void;
  initialProducts?: ProductItem[] | undefined;
}

export function SelectProductsScreen({
  onBack,
  onReviewCart,
  initialProducts = INITIAL_PRODUCTS,
}: SelectProductsScreenProps) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter((p) =>
    `${p.name} ${p.grade} ${p.batchId}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            quantitySelected: item.quantitySelected > 0 ? 0 : 2,
          };
        }
        return item;
      })
    );
  };

  const handleReviewCart = () => {
    const selected = products.filter((p) => p.quantitySelected > 0);
    const fallback = products.slice(0, 2);
    onReviewCart(selected.length > 0 ? selected : fallback);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.8}>
            <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Products</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#9E9690" />
          <TextInput
            style={styles.searchInput}
            placeholder="Product, crop, grade, batch"
            placeholderTextColor="#9E9690"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Product Cards */}
        {filteredProducts.map((p) => {
          const isSelected = p.quantitySelected > 0;
          return (
            <View key={p.id} style={styles.productCard}>
              <View style={styles.productTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>
                    {p.name} - {p.grade}
                  </Text>
                  <Text style={styles.productBatch}>Batch {p.batchId}</Text>
                </View>
                <View style={styles.greenPill}>
                  <Text style={styles.greenPillText}>₹{p.pricePerKg}/KG</Text>
                </View>
              </View>

              <View style={styles.productDivider} />

              <View style={styles.productBottomRow}>
                <Text style={styles.availableText}>Available {p.availableKg} KG</Text>
                <TouchableOpacity
                  onPress={() => toggleSelect(p.id)}
                  style={styles.selectBtn}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.selectBtnText, isSelected && { color: PALETTE.greenBadgeText, fontWeight: '800' }]}>
                    {isSelected ? `Selected (${p.quantitySelected} KG) ✓` : 'Select →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom CTA Button */}
      <View style={styles.bottomCtaWrap}>
        <TouchableOpacity style={styles.ctaButton} onPress={handleReviewCart} activeOpacity={0.85}>
          <ShoppingCartIcon size={18} color="#FFFFFF" />
          <Text style={styles.ctaButtonText}>Review Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 3: Sale Summary Screen
// ─────────────────────────────────────────────────────────────────────────────

export interface SaleSummaryScreenProps {
  onBack: () => void;
  onContinueToCustomer: () => void;
  saleItems?: ProductItem[] | undefined;
}

export function SaleSummaryScreen({
  onBack,
  onContinueToCustomer,
  saleItems = [
    {
      id: 'p1',
      name: 'Tomato',
      grade: 'Grade 1',
      batchId: 'BAT-2026-0012',
      pricePerKg: 100,
      availableKg: 48,
      quantitySelected: 2,
    },
    {
      id: 'p2',
      name: 'Carrot',
      grade: 'Grade 1',
      batchId: 'BAT-2026-0018',
      pricePerKg: 120,
      availableKg: 25,
      quantitySelected: 1,
    },
  ],
}: SaleSummaryScreenProps) {
  const subtotal = saleItems.reduce((acc, item) => acc + item.pricePerKg * item.quantitySelected, 0);
  const total = subtotal;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.8}>
            <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sale Summary</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad}>
        {/* Sale Items Section */}
        <Text style={styles.sectionLabel}>Sale Items</Text>
        <View style={styles.card}>
          {saleItems.map((item, idx) => (
            <View key={item.id}>
              {idx > 0 && <View style={styles.cardDivider} />}
              <View style={styles.summaryItemRow}>
                <Text style={styles.summaryItemName}>
                  {item.name} - {item.quantitySelected} KG
                </Text>
                <Text style={styles.summaryItemPrice}>
                  ₹{item.pricePerKg * item.quantitySelected}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing Section */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Pricing</Text>
        <View style={styles.card}>
          <View style={styles.summaryItemRow}>
            <Text style={styles.pricingLabel}>Subtotal</Text>
            <Text style={styles.pricingValue}>₹{subtotal}</Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.summaryItemRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA Button */}
      <View style={styles.bottomCtaWrap}>
        <TouchableOpacity style={styles.ctaButton} onPress={onContinueToCustomer} activeOpacity={0.85}>
          <UserCustomerIcon size={18} color="#FFFFFF" />
          <Text style={styles.ctaButtonText}>Continue to Customer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 4: Select Customer Screen
// ─────────────────────────────────────────────────────────────────────────────

export interface SelectCustomerScreenProps {
  onBack: () => void;
  onSelectCustomer: (customer: DirectSaleCustomerItem) => void;
  customers?: DirectSaleCustomerItem[] | undefined;
}

export function SelectCustomerScreen({
  onBack,
  onSelectCustomer,
  customers = INITIAL_CUSTOMERS,
}: SelectCustomerScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.8}>
            <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Customer</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#9E9690" />
          <TextInput
            style={styles.searchInput}
            placeholder="Name / Customer ID / Phone"
            placeholderTextColor="#9E9690"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Customer Cards */}
        {filtered.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={styles.customerCard}
            onPress={() => onSelectCustomer(c)}
            activeOpacity={0.75}
          >
            <Text style={styles.customerCardName}>{c.name}</Text>
            <Text style={styles.customerCardSub}>{c.customerId}</Text>
          </TouchableOpacity>
        ))}

        {/* Info Disclaimer */}
        <Text style={styles.disclaimerText}>
          This flow only selects an existing customer — creating/editing follows the Role & Feature matrix.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 5: Payment Screen
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentMethodType = 'Cash' | 'UPI' | 'Card' | 'Wallet';

export interface PaymentScreenProps {
  amount?: number | undefined;
  onBack: () => void;
  onConfirmPayment: (method: PaymentMethodType) => void;
}

export function PaymentScreen({
  amount = 320,
  onBack,
  onConfirmPayment,
}: PaymentScreenProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('Cash');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.8}>
            <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad}>
        {/* Amount Due Top Card */}
        <View style={styles.amountDueCard}>
          <Text style={styles.amountDueLabel}>AMOUNT DUE</Text>
          <Text style={styles.amountDueValue}>₹{amount}</Text>
        </View>

        {/* Payment Method 2x2 Grid */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Payment Method</Text>
        <View style={styles.paymentMethodGrid}>
          {/* Cash */}
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedMethod === 'Cash' && styles.paymentMethodCardActive,
            ]}
            onPress={() => setSelectedMethod('Cash')}
            activeOpacity={0.8}
          >
            <CashBanknoteIcon
              size={24}
              color={selectedMethod === 'Cash' ? PALETTE.primary : PALETTE.textInk}
            />
            <Text
              style={[
                styles.paymentMethodText,
                selectedMethod === 'Cash' && styles.paymentMethodTextActive,
              ]}
            >
              Cash
            </Text>
          </TouchableOpacity>

          {/* UPI */}
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedMethod === 'UPI' && styles.paymentMethodCardActive,
            ]}
            onPress={() => setSelectedMethod('UPI')}
            activeOpacity={0.8}
          >
            <UpiQrIcon
              size={24}
              color={selectedMethod === 'UPI' ? PALETTE.primary : PALETTE.textInk}
            />
            <Text
              style={[
                styles.paymentMethodText,
                selectedMethod === 'UPI' && styles.paymentMethodTextActive,
              ]}
            >
              UPI
            </Text>
          </TouchableOpacity>

          {/* Card */}
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedMethod === 'Card' && styles.paymentMethodCardActive,
            ]}
            onPress={() => setSelectedMethod('Card')}
            activeOpacity={0.8}
          >
            <CreditCardIcon
              size={24}
              color={selectedMethod === 'Card' ? PALETTE.primary : PALETTE.textInk}
            />
            <Text
              style={[
                styles.paymentMethodText,
                selectedMethod === 'Card' && styles.paymentMethodTextActive,
              ]}
            >
              Card
            </Text>
          </TouchableOpacity>

          {/* Wallet */}
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedMethod === 'Wallet' && styles.paymentMethodCardActive,
            ]}
            onPress={() => setSelectedMethod('Wallet')}
            activeOpacity={0.8}
          >
            <WalletIcon
              size={24}
              color={selectedMethod === 'Wallet' ? PALETTE.primary : PALETTE.textInk}
            />
            <Text
              style={[
                styles.paymentMethodText,
                selectedMethod === 'Wallet' && styles.paymentMethodTextActive,
              ]}
            >
              Wallet
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payment Summary */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Payment Summary</Text>
        <View style={styles.card}>
          <View style={styles.summaryItemRow}>
            <View>
              <Text style={styles.contextTitle}>Amount</Text>
              <Text style={styles.summaryItemPrice}>₹{amount}</Text>
            </View>
            <View style={{ alignItems: 'flex-start' }}>
              <Text style={styles.contextTitle}>Method</Text>
              <Text style={styles.summaryItemPrice}>{selectedMethod}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA Button */}
      <View style={styles.bottomCtaWrap}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => onConfirmPayment(selectedMethod)}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaButtonText}>Confirm Payment</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 6: Sale Confirmation Screen
// ─────────────────────────────────────────────────────────────────────────────

function ShieldCheckIcon({ size = 18, color = '#065F46' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SaleConfirmationScreenProps {
  saleId?: string | undefined;
  warehouseName?: string | undefined;
  customerName?: string | undefined;
  amount?: number | undefined;
  onViewInvoice: () => void;
  onNewSale: () => void;
  onBack: () => void;
}

export function SaleConfirmationScreen({
  saleId = 'SALE-00251',
  warehouseName = 'Coonoor',
  customerName = 'Rajesh Kumar',
  amount = 320,
  onViewInvoice,
  onNewSale,
  onBack,
}: SaleConfirmationScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header */}
      <View style={[styles.headerBanner, { paddingBottom: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 36 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' }}>
            Sale Confirmation
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollPad, { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }]}>
        {/* Success Icon & Heading */}
        <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 14 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <CheckmarkCircleLargeIcon size={34} color="#10B981" />
          </View>
          <Text style={{ fontSize: 19, fontWeight: '800', color: PALETTE.textInk }}>Sale Completed</Text>
        </View>

        {/* 1. Sale Information */}
        <Text style={{ fontSize: 13, fontWeight: '800', color: PALETTE.textInk, marginTop: 12, marginBottom: 8 }}>Sale Information</Text>
        <View style={[styles.card, { borderRadius: 14, padding: 16, borderWidth: 1, borderColor: PALETTE.border }]}>
          <View style={styles.infoGridRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '500', color: PALETTE.textSecondary, marginBottom: 4 }}>Sale ID</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: PALETTE.textInk }}>{saleId}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '500', color: PALETTE.textSecondary, marginBottom: 4 }}>Date</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: PALETTE.textInk }}>24 Sep, 6:35 PM</Text>
            </View>
          </View>

          <View style={[styles.infoGridRow, { marginTop: 14 }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '500', color: PALETTE.textSecondary, marginBottom: 4 }}>Warehouse</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: PALETTE.textInk }}>{warehouseName}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '500', color: PALETTE.textSecondary, marginBottom: 4 }}>Channel</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: PALETTE.textInk }}>Direct Sale</Text>
            </View>
          </View>
        </View>

        {/* 2. Customer */}
        <Text style={{ fontSize: 13, fontWeight: '800', color: PALETTE.textInk, marginTop: 12, marginBottom: 8 }}>Customer</Text>
        <View style={[styles.card, { borderRadius: 14, padding: 16, borderWidth: 1, borderColor: PALETTE.border }]}>
          <Text style={{ fontSize: 12, fontWeight: '500', color: PALETTE.textSecondary, marginBottom: 2 }}>{customerName}</Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color: PALETTE.textInk }}>CUS-00291</Text>
        </View>

        {/* 3. Products */}
        <Text style={{ fontSize: 13, fontWeight: '800', color: PALETTE.textInk, marginTop: 12, marginBottom: 8 }}>Products</Text>
        <View style={[styles.card, { borderRadius: 14, padding: 16, borderWidth: 1, borderColor: PALETTE.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: PALETTE.textInk, marginBottom: 2 }}>Tomato</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: PALETTE.textSecondary }}>Grade 1 · 2 KG</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: PALETTE.textInk }}>₹200</Text>
          </View>
          <View style={{ height: 1, backgroundColor: PALETTE.border, marginVertical: 10 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
            <View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: PALETTE.textInk, marginBottom: 2 }}>Carrot</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: PALETTE.textSecondary }}>Grade 1 · 1 KG</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '800', color: PALETTE.textInk }}>₹120</Text>
          </View>
        </View>

        {/* 4. Payment */}
        <Text style={{ fontSize: 13, fontWeight: '800', color: PALETTE.textInk, marginTop: 12, marginBottom: 8 }}>Payment</Text>
        <View style={[styles.card, { borderRadius: 14, padding: 16, borderWidth: 1, borderColor: PALETTE.border }]}>
          <View style={styles.infoGridRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '500', color: PALETTE.textSecondary, marginBottom: 4 }}>Method</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: PALETTE.textInk }}>Cash</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '500', color: PALETTE.textSecondary, marginBottom: 4 }}>Status</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: PALETTE.textInk }}>Paid</Text>
            </View>
          </View>
          <View style={[styles.infoGridRow, { marginTop: 14 }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '500', color: PALETTE.textSecondary, marginBottom: 4 }}>Amount</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: PALETTE.textInk }}>₹{amount}</Text>
            </View>
          </View>
        </View>

        {/* 5. Invoice */}
        <Text style={{ fontSize: 13, fontWeight: '800', color: PALETTE.textInk, marginTop: 12, marginBottom: 8 }}>Invoice</Text>
        <View style={[styles.card, { borderRadius: 14, padding: 16, borderWidth: 1, borderColor: PALETTE.border }]}>
          <Text style={{ fontSize: 11, fontWeight: '500', color: PALETTE.textSecondary, marginBottom: 4 }}>Invoice Number</Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color: PALETTE.textInk }}>INV-00251</Text>
        </View>

        {/* Info Banner Disclaimer */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#EAF5EE', borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0', paddingHorizontal: 14, paddingVertical: 12, gap: 10, marginTop: 14, marginBottom: 10 }}>
          <ShieldCheckIcon color="#065F46" />
          <Text style={{ flex: 1, fontSize: 11.5, fontWeight: '500', color: '#065F46', lineHeight: 16.5 }}>
            This screen only ever appears after the server confirms payment, sale, and the inventory ledger movement together — never on a local/optimistic success.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA Dual Buttons */}
      <View style={[styles.bottomConfirmationButtonsWrap, { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 20, gap: 10 }]}>
        <TouchableOpacity style={[styles.ctaButton, { height: 48, borderRadius: 12 }]} onPress={onViewInvoice} activeOpacity={0.85}>
          <InvoiceDocumentIcon size={18} color="#FFFFFF" />
          <Text style={[styles.ctaButtonText, { fontSize: 15, fontWeight: '800' }]}>View Invoice</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.secondaryButton, { height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: PALETTE.primary }]} onPress={onNewSale} activeOpacity={0.8}>
          <Text style={[styles.secondaryButtonText, { fontSize: 15, fontWeight: '800', color: PALETTE.primary }]}>New Sale</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 7: Sale Details Screen
// ─────────────────────────────────────────────────────────────────────────────

export interface SaleDetailsScreenProps {
  saleId?: string | undefined;
  status?: string | undefined;
  movementId?: string | undefined;
  total?: number | undefined;
  onBack: () => void;
}

export function SaleDetailsScreen({
  saleId = 'SALE-00251',
  status = 'Paid',
  movementId = 'MOV-00251',
  total = 320,
  onBack,
}: SaleDetailsScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.8}>
            <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ marginLeft: 4 }}>
            <Text style={styles.headerTitle}>Sale Details</Text>
            <Text style={styles.headerSubtitle}>{saleId} · {status}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad}>
        {/* Items Section */}
        <Text style={styles.sectionLabel}>Items</Text>
        <View style={styles.card}>
          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryItemName}>Tomato - Grade 1 - 2 KG</Text>
            <Text style={styles.summaryItemPrice}>₹200</Text>
          </View>
          <View style={styles.cardDivider} />
          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryItemName}>Carrot - Grade 1 - 1 KG</Text>
            <Text style={styles.summaryItemPrice}>₹120</Text>
          </View>
        </View>

        {/* Financial Summary */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Financial Summary</Text>
        <View style={styles.card}>
          <View style={styles.summaryItemRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>
        </View>

        {/* Inventory Reference */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Inventory Reference</Text>
        <View style={styles.card}>
          <Text style={styles.contextTitle}>Movement</Text>
          <Text style={styles.infoVal}>{movementId}</Text>
        </View>

        <Text style={styles.disclaimerText}>
          This is a reference only — detailed stock movement stays in Module 3.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 8: Market Day Sales Screen
// ─────────────────────────────────────────────────────────────────────────────

export interface MarketDaySalesScreenProps {
  onBack: () => void;
  onSelectSummary?: () => void;
}

export function MarketDaySalesScreen({
  onBack,
  onSelectSummary,
}: MarketDaySalesScreenProps) {
  const [selectedMarket, setSelectedMarket] = useState('Coonoor Market');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.8}>
            <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Market Day Sales</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad}>
        {/* Market & Status Card */}
        <View style={styles.card}>
          <View style={styles.contextRow}>
            <View style={styles.contextCol}>
              <Text style={styles.contextTitle}>Market</Text>
              <View style={styles.whSelectRow}>
                <Text style={styles.contextValue}>{selectedMarket}</Text>
                <ChevronDownIcon size={12} color="#1E1612" />
              </View>
            </View>
            <View style={styles.contextColRight}>
              <Text style={styles.contextTitle}>Status</Text>
              <Text style={[styles.contextValue, { color: '#10B981' }]}>Live</Text>
            </View>
          </View>
        </View>

        {/* 2 KPI Cards */}
        <View style={[styles.kpiDualRow, { marginTop: 14 }]}>
          <View style={styles.kpiDualCard}>
            <Text style={styles.kpiDualLabel}>TODAY'S SALES</Text>
            <Text style={styles.kpiDualValue}>₹7,200</Text>
          </View>
          <View style={styles.kpiDualCard}>
            <Text style={styles.kpiDualLabel}>TRANSACTIONS</Text>
            <Text style={styles.kpiDualValue}>15</Text>
          </View>
        </View>

        {/* Market Sales List */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <Text style={styles.sectionHeading}>Market Sales List</Text>
          <TouchableOpacity onPress={onSelectSummary} activeOpacity={0.7}>
            <Text style={styles.viewAllLink}>Summary →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.historyTopRow}>
            <Text style={styles.historySaleId}>SALE-M-0015</Text>
            <View style={styles.greenPill}>
              <Text style={styles.greenPillText}>Paid</Text>
            </View>
          </View>
          <Text style={[styles.historyCustomerText, { marginTop: 6 }]}>2 Products · 3 KG</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 9: HORECA Sales Screen
// ─────────────────────────────────────────────────────────────────────────────

export interface HorecaSalesScreenProps {
  onBack: () => void;
}

export function HorecaSalesScreen({ onBack }: HorecaSalesScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header */}
      <View style={styles.headerBanner}>
        <View style={[styles.headerTopRow, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.8}>
              <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>HORECA Sales</Text>
          </View>
          <View style={styles.viewOnlyPill}>
            <Text style={styles.viewOnlyPillText}>VIEW ONLY</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad}>
        {/* 2 KPI Cards */}
        <View style={styles.kpiDualRow}>
          <View style={styles.kpiDualCard}>
            <Text style={styles.kpiDualLabel}>HORECA SALES</Text>
            <Text style={styles.kpiDualValue}>₹4,800</Text>
          </View>
          <View style={styles.kpiDualCard}>
            <Text style={styles.kpiDualLabel}>ORDERS</Text>
            <Text style={styles.kpiDualValue}>5</Text>
          </View>
        </View>

        {/* HORECA Orders Card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <View style={styles.historyTopRow}>
            <Text style={styles.historySaleId}>HORECA-0021</Text>
            <View style={styles.greenPill}>
              <Text style={styles.greenPillText}>Paid</Text>
            </View>
          </View>
          <Text style={[styles.historyCustomerText, { marginTop: 4 }]}>Hilltop Resort & Restaurant</Text>
          <View style={[styles.historyBottomRow, { marginTop: 10 }]}>
            <Text style={styles.historyWarehouseText}>4 Items · Coonoor</Text>
            <Text style={styles.historyAmountText}>₹1,250</Text>
          </View>
        </View>

        {/* View Access Disclaimer */}
        <Text style={styles.disclaimerText}>
          No New HORECA Sale, Edit, Delete or order approval — MWA has view access only here.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 10: B2B Sales Screen
// ─────────────────────────────────────────────────────────────────────────────

export interface B2bSalesScreenProps {
  onBack: () => void;
}

export function B2bSalesScreen({ onBack }: B2bSalesScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header */}
      <View style={styles.headerBanner}>
        <View style={[styles.headerTopRow, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.8}>
              <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>B2B Sales</Text>
          </View>
          <View style={styles.viewOnlyPill}>
            <Text style={styles.viewOnlyPillText}>VIEW ONLY</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad}>
        {/* 2 KPI Cards */}
        <View style={styles.kpiDualRow}>
          <View style={styles.kpiDualCard}>
            <Text style={styles.kpiDualLabel}>B2B SALES</Text>
            <Text style={styles.kpiDualValue}>₹4,400</Text>
          </View>
          <View style={styles.kpiDualCard}>
            <Text style={styles.kpiDualLabel}>ORDERS</Text>
            <Text style={styles.kpiDualValue}>4</Text>
          </View>
        </View>

        {/* B2B Orders Card */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <View style={styles.historyTopRow}>
            <Text style={styles.historySaleId}>B2B-0041</Text>
            <View style={styles.greenPill}>
              <Text style={styles.greenPillText}>Paid</Text>
            </View>
          </View>
          <Text style={[styles.historyCustomerText, { marginTop: 4 }]}>Green Valley Retail Pvt Ltd</Text>
          <View style={[styles.historyBottomRow, { marginTop: 10 }]}>
            <Text style={styles.historyWarehouseText}>12 Items · Ooty</Text>
            <Text style={styles.historyAmountText}>₹4,400</Text>
          </View>
        </View>

        {/* View Access Disclaimer */}
        <Text style={styles.disclaimerText}>
          Monitoring only — no order creation, editing or approval actions for MWA.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen 11: Sales History Screen
// ─────────────────────────────────────────────────────────────────────────────

export interface SalesHistoryScreenProps {
  onBack: () => void;
  onSelectRecord?: ((record: SaleRecordItem) => void) | undefined;
  historyRecords?: SaleRecordItem[] | undefined;
}

export function SalesHistoryScreen({
  onBack,
  onSelectRecord,
  historyRecords = INITIAL_SALES_HISTORY,
}: SalesHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = historyRecords.filter(
    (item) =>
      item.saleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.warehouse.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={onBack} activeOpacity={0.8}>
            <ArrowLeftWhiteIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sales History</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#9E9690" />
          <TextInput
            style={styles.searchInput}
            placeholder="Sale ID / customer / invoice"
            placeholderTextColor="#9E9690"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* History List */}
        {filtered.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.historyCard}
            onPress={() => (onSelectRecord ? onSelectRecord(item) : Alert.alert('Sale Details', `${item.saleId} · ₹${item.amount}`))}
            activeOpacity={0.75}
          >
            <View style={styles.historyTopRow}>
              <Text style={styles.historySaleId}>{item.saleId}</Text>
              <View style={styles.greenPill}>
                <Text style={styles.greenPillText}>{item.status}</Text>
              </View>
            </View>

            <Text style={styles.historyCustomerText}>
              {item.customerName} · {item.itemCount} items
            </Text>

            <View style={styles.historyBottomRow}>
              <Text style={styles.historyWarehouseText}>
                Direct · {item.warehouse}
              </Text>
              <Text style={styles.historyAmountText}>₹{item.amount}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  viewOnlyPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewOnlyPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6B5A4E',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.primary,
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  contextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contextCol: {
    flex: 1,
  },
  contextColRight: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 12,
  },
  contextTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  whSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contextValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  emptyCartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  emptyCartText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textMuted,
  },
  cartListWrap: {
    paddingVertical: 4,
  },
  cartItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cartItemName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  cardDivider: {
    height: 1,
    backgroundColor: PALETTE.borderLight,
    marginVertical: 6,
  },

  // 2-column KPI
  kpiDualRow: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiDualCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
  },
  kpiDualLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: PALETTE.textSecondary,
    marginBottom: 6,
  },
  kpiDualValue: {
    fontSize: 20,
    fontWeight: '900',
    color: PALETTE.textInk,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },

  // Product Card
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 12,
  },
  productTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  productBatch: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  greenPill: {
    backgroundColor: PALETTE.greenBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  greenPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: PALETTE.greenBadgeText,
  },
  productDivider: {
    height: 1,
    backgroundColor: PALETTE.borderLight,
    marginVertical: 10,
  },
  productBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availableText: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
    fontWeight: '600',
  },
  selectBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.primary,
  },

  // Summary Styles
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryItemName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  pricingLabel: {
    fontSize: 13.5,
    color: PALETTE.textSecondary,
    fontWeight: '600',
  },
  pricingValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  totalLabel: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: PALETTE.textInk,
  },

  // Customer Card
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  customerCardName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  customerCardSub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 3,
    fontWeight: '600',
  },
  disclaimerText: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    marginTop: 12,
    lineHeight: 16,
    paddingHorizontal: 4,
  },

  // Payment Screen
  amountDueCard: {
    backgroundColor: PALETTE.amountBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE8DE',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountDueLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8A583A',
    letterSpacing: 0.5,
  },
  amountDueValue: {
    fontSize: 26,
    fontWeight: '900',
    color: PALETTE.textInk,
    marginTop: 4,
  },
  paymentMethodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  paymentMethodCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  paymentMethodCardActive: {
    borderColor: PALETTE.primary,
    backgroundColor: PALETTE.primarySoft,
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  paymentMethodTextActive: {
    color: PALETTE.primary,
    fontWeight: '900',
  },

  // Confirmation Screen
  successHeadWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  successHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: PALETTE.textInk,
    marginTop: 12,
  },
  successSaleId: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginTop: 3,
  },
  infoGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  confirmationInfoBanner: {
    backgroundColor: PALETTE.infoBannerBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.infoBannerBorder,
    padding: 12,
    marginTop: 20,
  },
  confirmationInfoBannerText: {
    fontSize: 11.5,
    lineHeight: 16,
    color: PALETTE.infoBannerText,
    fontWeight: '500',
  },
  bottomConfirmationButtonsWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PALETTE.pageBg,
    gap: 10,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  // Sales History Screen
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 12,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historySaleId: {
    fontSize: 14.5,
    fontWeight: '900',
    color: PALETTE.textInk,
  },
  historyCustomerText: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  historyBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  historyWarehouseText: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
    fontWeight: '600',
  },
  historyAmountText: {
    fontSize: 15,
    fontWeight: '900',
    color: PALETTE.textInk,
  },

  // Bottom CTA
  bottomCtaWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PALETTE.pageBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.borderLight,
  },
  ctaButton: {
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 14,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modalOptionActive: {
    backgroundColor: PALETTE.primarySoft,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  modalOptionTextActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
});
