import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { ProductImages } from '../assets/images/products';
import {
  customerColors,
  customerFonts,
  customerSpacing,
  customerShadow,
} from '../theme';

// ── SVG ICONS ───────────────────────────────────────────────────────────────

const BackArrowSvg = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke="#1F2937"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LocationPinSvg = ({ color = '#0284C7' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21C16 16.5 19 12.2 19 8.5C19 4.9 15.9 2 12 2C8.1 2 5 4.9 5 8.5C5 12.2 8 16.5 12 21Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={8.5} r={2.5} stroke={color} strokeWidth={2} />
  </Svg>
);

const ChevronDownSvg = ({ color = '#0284C7' }: { color?: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9l6 6 6-6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CloseSvg = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6l12 12"
      stroke="#1F2937"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TrashSvg = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
      stroke="#EF4444"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M10 11v6M14 11v6" stroke="#EF4444" strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const EditMemoSvg = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke="#1F2937"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke="#1F2937"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CartFloatingSvg = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={10} cy={20} r={1.5} fill="#FFFFFF" />
    <Circle cx={18} cy={20} r={1.5} fill="#FFFFFF" />
  </Svg>
);

// ── TYPES ───────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  name: string;
  weight: string;
  subtitle: string;
  originalPrice: number;
  price: number;
  quantity: number;
  image: any;
  noStock?: boolean;
}

export type DeliveryState = 'home' | 'pickup' | 'customize';

export interface CartScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onGoBack?: () => void;
  onBack?: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({ onNavigate, onGoBack, onBack }) => {
  // ── CART ITEMS STATE ──────────────────────────────────────────────────────
  const [items, setItems] = useState<CartItem[]>([
    {
      id: 'item-1',
      name: 'Royal Gala (1 kg)',
      weight: '1 kg',
      subtitle: 'Sweet & mellow',
      originalPrice: 182.0,
      price: 160.0,
      quantity: 1,
      image: ProductImages.fruitApple,
      noStock: false,
    },
    {
      id: 'item-2',
      name: 'Fuji (1 kg)',
      weight: '1 kg',
      subtitle: 'Extra sweet & juicy',
      originalPrice: 160.0,
      price: 152.0,
      quantity: 1,
      image: ProductImages.fruitApple,
      noStock: false,
    },
    {
      id: 'item-3',
      name: 'Green Curly Lettuce (1 kg)',
      weight: '1 kg',
      subtitle: 'Extra sweet & juicy',
      originalPrice: 145.0,
      price: 132.0,
      quantity: 1,
      image: ProductImages.foryouStrawberries,
      noStock: false,
    },
  ]);

  // ── ADDRESS & FLOW STATES ─────────────────────────────────────────────────
  const [hasSavedAddress, setHasSavedAddress] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [deliveryState, setDeliveryState] = useState<DeliveryState>('home');
  const [marketDropdownVisible, setMarketDropdownVisible] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState('Ooty Market');

  // ── ADDRESS FORM STATE ────────────────────────────────────────────────────
  const [addressForm, setAddressForm] = useState({
    name: 'Suresh',
    phone: '99944 99944',
    pincode: '6411115',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    locality: '123/2',
    flat: '77',
    landmark: 'Sylks Road, Ooty',
    addressType: 'Home' as 'Home' | 'Office' | 'Other',
    isDefault: true,
  });

  // ── CALCULATIONS ──────────────────────────────────────────────────────────
  const itemsTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const originalItemsTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0),
    [items]
  );

  const deliveryFee = items.length > 0 ? 9.0 : 0;
  const originalDeliveryFee = items.length > 0 ? 29.0 : 0;
  const handlingFee = items.length > 0 ? 12.0 : 0;
  const originalHandlingFee = items.length > 0 ? 15.0 : 0;

  const grandTotal = itemsTotal + deliveryFee + handlingFee;
  const savings =
    originalItemsTotal -
    itemsTotal +
    (originalDeliveryFee - deliveryFee) +
    (originalHandlingFee - handlingFee);

  const hasOutOfStock = items.some(item => item.noStock);

  // ── STEPPER HANDLERS ──────────────────────────────────────────────────────
  const handleIncreaseQty = (id: string) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );
  };

  const handleDecreaseQty = (id: string) => {
    setItems(prev =>
      prev
        .map(item => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
        .filter(item => item.quantity > 0)
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // ── SAVE ADDRESS HANDLER ──────────────────────────────────────────────────
  const handleSaveAddress = () => {
    setHasSavedAddress(true);
    // Mark Royal Gala as out of stock to match Screen 3 requirement precisely
    setItems(prev =>
      prev.map(item =>
        item.name.includes('Royal Gala') ? { ...item, noStock: true } : item
      )
    );
    setAddressModalVisible(false);
  };

  const handleResetAddress = () => {
    setAddressForm({
      name: '',
      phone: '',
      pincode: '',
      city: '',
      state: '',
      locality: '',
      flat: '',
      landmark: '',
      addressType: 'Home',
      isDefault: false,
    });
  };

  // ── PAY & CHECKOUT HANDLER ────────────────────────────────────────────────
  const handleCheckout = () => {
    if (hasOutOfStock) {
      Alert.alert(
        'Out of Stock Item',
        'Please remove out-of-stock items before proceeding to checkout.'
      );
      return;
    }
    onNavigate?.('Checkout', {
      address: addressForm,
      total: grandTotal,
      itemsCount: items.length,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── TOP HEADER (Back Button + Editorial Title) ──────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => (onGoBack ? onGoBack() : (onBack ? onBack() : onNavigate?.('Home')))}
          style={styles.backButton}
        >
          <BackArrowSvg />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My cart</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TOP BANNER (Add delivery details / Saved Address) ─────────────── */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setAddressModalVisible(true)}
          style={styles.deliveryBanner}
        >
          <View style={styles.deliveryBannerLeft}>
            <LocationPinSvg color="#0284C7" />
            <Text style={styles.deliveryBannerText} numberOfLines={1}>
              {hasSavedAddress
                ? `${addressForm.name} | ${addressForm.locality || '123/2'}, ${addressForm.city || 'Coimbatore'}, ${addressForm.state || 'Tamil Nadu'} - ${addressForm.pincode || '6411115'}.`
                : 'Add delivery details'}
            </Text>
          </View>
          <ChevronDownSvg color="#0284C7" />
        </TouchableOpacity>

        {/* ── 1. REVIEW ITEMS SECTION (Exact Figma Card: Mint Header) ───────── */}
        <View style={styles.reviewItemsContainer}>
          <View style={styles.reviewItemsHeader}>
            <Text style={styles.reviewItemsTitle}>Review items</Text>
            <Text style={styles.reviewItemsCount}>{items.length} item</Text>
          </View>

          <View style={styles.itemsList}>
            {items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  index < items.length - 1 && styles.itemRowDivider,
                ]}
              >
                {/* Product Thumbnail */}
                <Image source={item.image} style={styles.itemImage} resizeMode="contain" />

                {/* Details */}
                <View style={styles.itemInfo}>
                  <View style={styles.itemNameBadgeRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.noStock && (
                      <View style={styles.noStockBadge}>
                        <Text style={styles.noStockText}>No stock</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                </View>

                {/* Pricing & Stepper / Remove */}
                <View style={styles.itemRightCol}>
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemOldPrice}>₹{item.originalPrice.toFixed(2)}</Text>
                    <Text style={styles.itemCurrentPrice}>₹{item.price.toFixed(2)}</Text>
                  </View>

                  {item.noStock ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleRemoveItem(item.id)}
                      style={styles.removeOutlineBtn}
                    >
                      <TrashSvg />
                      <Text style={styles.removeOutlineBtnText}>Remove</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleDecreaseQty(item.id)}
                        style={styles.stepperAction}
                      >
                        <Text style={styles.stepperSign}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperQty}>{item.quantity}</Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleIncreaseQty(item.id)}
                        style={styles.stepperAction}
                      >
                        <Text style={styles.stepperSign}>+</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}

            {items.length === 0 && (
              <View style={styles.emptyCartWrap}>
                <Text style={styles.emptyCartText}>Your cart is empty.</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── 2. YOUR BILL SECTION (Cream Card with Dotted Divider) ──────────── */}
        <View style={styles.billContainer}>
          <View style={styles.billHeader}>
            <Text style={styles.billHeaderTitle}>Your Bill</Text>
          </View>

          <View style={styles.billBody}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Items total</Text>
              <View style={styles.billPriceCol}>
                <Text style={styles.billOldPrice}>₹{originalItemsTotal.toFixed(2)}</Text>
                <Text style={styles.billValue}>₹{itemsTotal.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.billRow}>
              <Text style={[styles.billLabel, styles.underlinedLabel]}>Delivery Fee</Text>
              <View style={styles.billPriceCol}>
                <Text style={styles.billOldPrice}>₹{originalDeliveryFee.toFixed(2)}</Text>
                <Text style={styles.billValue}>₹{deliveryFee.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.billRow}>
              <Text style={[styles.billLabel, styles.underlinedLabel]}>Handling Fee</Text>
              <View style={styles.billPriceCol}>
                <Text style={styles.billOldPrice}>₹{originalHandlingFee.toFixed(2)}</Text>
                <Text style={styles.billValue}>₹{handlingFee.toFixed(2)}</Text>
              </View>
            </View>

            {/* Dotted Divider */}
            <View style={styles.dottedDivider} />

            <View style={styles.billRow}>
              <Text style={styles.grandTotalLabel}>Grand total</Text>
              <Text style={styles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
            </View>

            {/* Savings Pill */}
            {savings > 0 && (
              <View style={styles.savingsPill}>
                <Text style={styles.savingsText}>
                  You are saving ₹{savings.toFixed(0)} on this order
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── 3. CHOOSE A DELIVERY STATES SECTION (BELOW YOUR BILL - IMAGES 3, 4, 5) ── */}
        {hasSavedAddress && (
          <View style={styles.deliveryStatesCard}>
            {/* Header */}
            <View style={styles.deliveryStatesHeader}>
              <Text style={styles.deliveryStatesTitle}>Choose a delivery states</Text>
              <View style={styles.nearMarketHeaderRight}>
                <Text style={styles.nearMarketHeaderLabel}>Your Near </Text>
                <Text style={styles.nearMarketHeaderGreen}>Ooty Market</Text>
              </View>
            </View>

            {/* Body */}
            <View style={styles.deliveryStatesBody}>
              {/* 3 Radios */}
              <View style={styles.deliveryRadiosRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setDeliveryState('home')}
                  style={styles.radioOption}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      deliveryState === 'home' && styles.radioCircleSelected,
                    ]}
                  >
                    {deliveryState === 'home' && <View style={styles.radioInnerDot} />}
                  </View>
                  <Text
                    style={[
                      styles.radioLabel,
                      deliveryState === 'home' && styles.radioLabelSelected,
                    ]}
                  >
                    Home delivery
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setDeliveryState('pickup')}
                  style={styles.radioOption}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      deliveryState === 'pickup' && styles.radioCircleSelected,
                    ]}
                  >
                    {deliveryState === 'pickup' && <View style={styles.radioInnerDot} />}
                  </View>
                  <Text
                    style={[
                      styles.radioLabel,
                      deliveryState === 'pickup' && styles.radioLabelSelected,
                    ]}
                  >
                    Direct pickup
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setDeliveryState('customize')}
                  style={styles.radioOption}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      deliveryState === 'customize' && styles.radioCircleSelected,
                    ]}
                  >
                    {deliveryState === 'customize' && <View style={styles.radioInnerDot} />}
                  </View>
                  <Text
                    style={[
                      styles.radioLabel,
                      deliveryState === 'customize' && styles.radioLabelSelected,
                    ]}
                  >
                    Customize
                  </Text>
                </TouchableOpacity>
              </View>

              {/* State 1: Home delivery (Image 3) */}
              {deliveryState === 'home' && (
                <View style={styles.deliveryContentBox}>
                  <View style={styles.deliveryContentTextCol}>
                    <Text style={styles.deliveryPersonName}>Suresh,</Text>
                    <Text style={styles.deliveryPhoneText}>99944 99944,</Text>
                    <Text style={styles.deliveryAddressText}>
                      77, Sylks Road, Ooty – 643001,
                    </Text>
                    <Text style={styles.deliveryAddressText}>Tamil Nadu.</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setAddressModalVisible(true)}
                    style={styles.editOutlineBtn}
                  >
                    <EditMemoSvg />
                    <Text style={styles.editOutlineBtnText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* State 2: Direct pickup (Image 4) */}
              {deliveryState === 'pickup' && (
                <View style={styles.deliveryContentBox}>
                  <View style={styles.deliveryContentTextCol}>
                    <Text style={styles.pickupPhoneHeader}>Ph: 99944 99944,</Text>
                    <Text style={styles.pickupMarketDesc}>
                      The main Ooty Municipal Market is located on Commercial Road / Upper Bazar Road, Ooty, Tamil Nadu 643001.
                    </Text>
                  </View>
                  <View style={styles.yourNearSolidBadge}>
                    <Text style={styles.yourNearSolidBadgeText}>Your near</Text>
                  </View>
                </View>
              )}

              {/* State 3: Customize (Image 5) */}
              {deliveryState === 'customize' && (
                <View style={styles.customizeContainer}>
                  {/* Dropdown Selector */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setMarketDropdownVisible(prev => !prev)}
                    style={styles.customizeMarketDropdown}
                  >
                    <View style={styles.customizeDropdownLeft}>
                      <Text style={styles.customizeMarketNameText}>{selectedMarket}</Text>
                      <View style={styles.yourNearLightBadge}>
                        <Text style={styles.yourNearLightBadgeText}>Your near</Text>
                      </View>
                    </View>
                    <ChevronDownSvg color={customerColors.body} />
                  </TouchableOpacity>

                  {/* Inline Dropdown Options — Anchored directly under the input box */}
                  {marketDropdownVisible && (
                    <View style={styles.inlineDropdownMenu}>
                      {[
                        { name: 'Coonoor Market', status: 'Open now' },
                        { name: 'Kotagiri Market', status: 'Open now' },
                        { name: 'Gudalur Market', status: 'Open now' },
                      ].map(market => (
                        <TouchableOpacity
                          key={market.name}
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedMarket(market.name);
                            setMarketDropdownVisible(false);
                          }}
                          style={styles.inlineDropdownItem}
                        >
                          <Text style={styles.inlineDropdownItemName}>{market.name}</Text>
                          <View style={styles.openNowBadge}>
                            <Text style={styles.openNowBadgeText}>{market.status}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Market info box — visible when dropdown is closed */}
                  {!marketDropdownVisible && (
                    <View style={[styles.deliveryContentBox, { marginTop: customerSpacing[12] }]}>
                      <View style={styles.deliveryContentTextCol}>
                        <Text style={styles.pickupPhoneHeader}>Ph: 99944 99944,</Text>
                        <Text style={styles.pickupMarketDesc}>
                          {selectedMarket === 'Coonoor Market'
                            ? 'The Coonoor Municipal Market is located near Bedford Circle, Coonoor, Tamil Nadu 643101.'
                            : selectedMarket === 'Kotagiri Market'
                              ? 'The Kotagiri Weekly Market is located near Johnston Square, Kotagiri, Tamil Nadu 643217.'
                              : selectedMarket === 'Gudalur Market'
                                ? 'The Gudalur Town Farmers Market is located near Ooty Main Road, Gudalur, Tamil Nadu 643212.'
                                : 'The main Ooty Municipal Market is located on Commercial Road / Upper Bazar Road, Ooty, Tamil Nadu 643001.'}
                        </Text>
                      </View>
                      <View style={styles.yourNearSolidBadge}>
                        <Text style={styles.yourNearSolidBadgeText}>Your near</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── 4. RETURN / REFUND POLICY ─────────────────────────────────────── */}
        <View style={styles.policyContainer}>
          <Text style={styles.policyTitle}>Return/Refund Policy</Text>
          <Text style={styles.policyText}>
            Freshly sourced from local farmers, thoughtfully delivered to your home.
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                'Return & Refund Policy',
                'We guarantee 100% farm-fresh quality. If any item is damaged or unscheduled, report within 24 hours for instant refund or replacement.'
              )
            }
          >
            <Text style={styles.readPolicyLink}>Read policy</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom padding for sticky checkout bar */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── 5. STICKY BOTTOM CHECKOUT BAR ──────────────────────────────────── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPillContainer}>
          <Text style={styles.bottomPriceText}>₹{grandTotal.toFixed(2)}</Text>

          {!hasSavedAddress ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setAddressModalVisible(true)}
              style={styles.addAddressBtn}
            >
              <Text style={styles.addAddressBtnText}>Add Address</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={hasOutOfStock ? 1 : 0.85}
              onPress={handleCheckout}
              disabled={hasOutOfStock}
              style={[
                styles.payCheckoutBtn,
                hasOutOfStock && styles.payCheckoutBtnDisabled,
              ]}
            >
              <Text
                style={[
                  styles.payCheckoutBtnText,
                  hasOutOfStock && styles.payCheckoutBtnTextDisabled,
                ]}
              >
                Pay & Checkout
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Floating Green Cart Circle Badge */}
        <View style={styles.floatingCartCircle}>
          <CartFloatingSvg />
        </View>
      </View>

      {/* ── MODAL: SCREEN 2 - ADD ADDRESS POPUP ────────────────────────────── */}
      <Modal
        visible={addressModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addressModalCard}>
            {/* Top Close Icon */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setAddressModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <CloseSvg />
            </TouchableOpacity>

            {/* Header: Title + Reset */}
            <View style={styles.addressModalHeader}>
              <Text style={styles.addressModalTitle}>Add Address</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={handleResetAddress}>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.addressModalScroll}
            >
              {/* Contact Info Group 1 */}
              <Text style={styles.formSectionHeader}>Contact info</Text>
              <TextInput
                style={styles.formInputLine}
                placeholder="Name"
                placeholderTextColor="#9CA3AF"
                value={addressForm.name}
                onChangeText={t => setAddressForm(p => ({ ...p, name: t }))}
              />
              <TextInput
                style={styles.formInputLine}
                placeholder="Phone Number (+91)"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={addressForm.phone}
                onChangeText={t => setAddressForm(p => ({ ...p, phone: t }))}
              />

              {/* Contact Info Group 2 (Address Fields) */}
              <Text style={[styles.formSectionHeader, { marginTop: 16 }]}>
                Contact info
              </Text>

              <View style={styles.formRow}>
                <TextInput
                  style={[styles.formInputLine, { flex: 1, marginRight: 12 }]}
                  placeholder="Pincode"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={addressForm.pincode}
                  onChangeText={t => setAddressForm(p => ({ ...p, pincode: t }))}
                />
                <TextInput
                  style={[styles.formInputLine, { flex: 1 }]}
                  placeholder="City"
                  placeholderTextColor="#9CA3AF"
                  value={addressForm.city}
                  onChangeText={t => setAddressForm(p => ({ ...p, city: t }))}
                />
              </View>

              <TextInput
                style={styles.formInputLine}
                placeholder="State"
                placeholderTextColor="#9CA3AF"
                value={addressForm.state}
                onChangeText={t => setAddressForm(p => ({ ...p, state: t }))}
              />
              <TextInput
                style={styles.formInputLine}
                placeholder="Locality / Area / Street"
                placeholderTextColor="#9CA3AF"
                value={addressForm.locality}
                onChangeText={t => setAddressForm(p => ({ ...p, locality: t }))}
              />
              <TextInput
                style={styles.formInputLine}
                placeholder="Flat on / Building Name"
                placeholderTextColor="#9CA3AF"
                value={addressForm.flat}
                onChangeText={t => setAddressForm(p => ({ ...p, flat: t }))}
              />
              <TextInput
                style={styles.formInputLine}
                placeholder="Landmark (optional)"
                placeholderTextColor="#9CA3AF"
                value={addressForm.landmark}
                onChangeText={t => setAddressForm(p => ({ ...p, landmark: t }))}
              />

              {/* Choose near market */}
              <Text style={[styles.formSectionHeader, { marginTop: 16 }]}>
                Choose your near market
              </Text>
              <View style={styles.marketSelectorBox}>
                <View style={styles.marketSelectorLeft}>
                  <Text style={styles.marketSelectorText}>{selectedMarket}</Text>
                  <View style={styles.yourNearLightBadge}>
                    <Text style={styles.yourNearLightBadgeText}>Your near</Text>
                  </View>
                </View>
                <ChevronDownSvg color="#4B5563" />
              </View>

              {/* Type of Address */}
              <Text style={[styles.formSectionHeader, { marginTop: 16 }]}>
                Type of Address
              </Text>
              <View style={styles.addressTypeRow}>
                {(['Home', 'Office', 'Other'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    activeOpacity={0.8}
                    onPress={() => setAddressForm(p => ({ ...p, addressType: type }))}
                    style={styles.addressTypeRadio}
                  >
                    <View
                      style={[
                        styles.radioCircleSmall,
                        addressForm.addressType === type && styles.radioCircleSmallSelected,
                      ]}
                    >
                      {addressForm.addressType === type && (
                        <View style={styles.radioSmallInnerDot} />
                      )}
                    </View>
                    <Text style={styles.addressTypeRadioText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Mark as default address */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  setAddressForm(p => ({ ...p, isDefault: !p.isDefault }))
                }
                style={styles.checkboxRow}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    addressForm.isDefault && styles.checkboxBoxChecked,
                  ]}
                >
                  {addressForm.isDefault && (
                    <Text style={styles.checkboxCheckmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Mark as default address</Text>
              </TouchableOpacity>

              {/* Save Address Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSaveAddress}
                style={styles.saveAddressBtn}
              >
                <Text style={styles.saveAddressBtnText}>Save address</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 16 : 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // ── DELIVERY DETAILS TOP BANNER ───────────────────────────────────────────
  deliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  deliveryBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  deliveryBannerText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },

  // ── 1. REVIEW ITEMS SECTION ───────────────────────────────────────────────
  reviewItemsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 16,
  },
  reviewItemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  reviewItemsTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 15,
    color: '#1F2937',
  },
  reviewItemsCount: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  itemsList: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemImage: {
    width: 44,
    height: 44,
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemNameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  noStockBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  noStockText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
  },
  itemRightCol: {
    alignItems: 'flex-end',
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemOldPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 4,
  },
  itemCurrentPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  removeOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  removeOutlineBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperAction: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperSign: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  stepperQty: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 6,
  },
  emptyCartWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyCartText: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  // ── 2. YOUR BILL SECTION ──────────────────────────────────────────────────
  billContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 16,
  },
  billHeader: {
    backgroundColor: '#FEF7EE',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  billHeaderTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 15,
    color: '#1F2937',
  },
  billBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  underlinedLabel: {
    textDecorationLine: 'underline',
  },
  billPriceCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billOldPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginRight: 6,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  dottedDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginVertical: 6,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  grandTotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E7D32',
  },
  savingsPill: {
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },

  // ── 3. CHOOSE A DELIVERY STATES SECTION (IMAGES 3, 4, 5) ───────────────────
  deliveryStatesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 16,
  },
  deliveryStatesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF7EE',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  deliveryStatesTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 15,
    color: '#1F2937',
  },
  nearMarketHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nearMarketHeaderLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  nearMarketHeaderGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  deliveryStatesBody: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  deliveryRadiosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioCircleSelected: {
    borderColor: customerColors.brand,
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: customerColors.brand,
  },
  radioLabel: {
    fontSize: 14,
    color: customerColors.muted,
    fontFamily: customerFonts.regular,
  },
  radioLabelSelected: {
    color: customerColors.body,
    fontFamily: customerFonts.regular,
  },
  deliveryContentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  deliveryContentTextCol: {
    flex: 1,
    marginRight: 10,
  },
  deliveryPersonName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 18,
  },
  deliveryPhoneText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  deliveryAddressText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  editOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  editOutlineBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
  },
  pickupPhoneHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  pickupMarketDesc: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  yourNearSolidBadge: {
    backgroundColor: '#1E6F38',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  yourNearSolidBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  customizeContainer: {
    marginTop: 4,
    position: 'relative',
    zIndex: 10,
  },
  customizeMarketDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: customerSpacing[16],
    paddingVertical: 12,
    backgroundColor: customerColors.surface,
  },
  customizeDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customizeMarketNameText: {
    fontSize: 15,
    fontFamily: customerFonts.regular,
    color: customerColors.body,
  },
  yourNearLightBadge: {
    backgroundColor: customerColors.surfaceSelected,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  yourNearLightBadgeText: {
    fontSize: 11,
    fontFamily: customerFonts.regular,
    color: customerColors.brand,
  },
  inlineDropdownMenu: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: customerColors.surface,
    marginTop: 6,
    overflow: 'hidden',
    ...customerShadow.subtle,
  },
  inlineDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  inlineDropdownItemName: {
    fontSize: 15,
    color: '#111827',
    fontFamily: customerFonts.regular,
  },
  openNowBadge: {
    backgroundColor: customerColors.surfaceSelected,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  openNowBadgeText: {
    fontSize: 11,
    fontFamily: customerFonts.regular,
    color: customerColors.brand,
  },

  // ── 4. RETURN / REFUND POLICY ─────────────────────────────────────────────
  policyContainer: {
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  policyTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 4,
  },
  policyText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 6,
  },
  readPolicyLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },

  // ── 5. STICKY BOTTOM CHECKOUT BAR ─────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'android' ? 16 : 24,
    paddingTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bottomPillContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bottomPriceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  addAddressBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  addAddressBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  payCheckoutBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  payCheckoutBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  payCheckoutBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  payCheckoutBtnTextDisabled: {
    color: '#FFFFFF',
  },
  floatingCartCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },

  // ── MODAL: SCREEN 2 - ADD ADDRESS ─────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  addressModalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: -12,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 4,
  },
  addressModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressModalTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 18,
    color: '#1F2937',
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  addressModalScroll: {
    paddingBottom: 10,
  },
  formSectionHeader: {
    fontFamily: customerFonts.editorial,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 6,
  },
  formInputLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    fontSize: 13,
    color: '#1F2937',
    paddingVertical: 6,
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
  },
  marketSelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  marketSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  marketSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  addressTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 12,
  },
  addressTypeRadio: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircleSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  radioCircleSmallSelected: {
    borderColor: '#2E7D32',
  },
  radioSmallInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },
  addressTypeRadioText: {
    fontSize: 13,
    color: '#4B5563',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxBoxChecked: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  checkboxCheckmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  saveAddressBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveAddressBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
