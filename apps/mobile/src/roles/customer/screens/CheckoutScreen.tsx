/**
 * Wallet-only checkout. See the CheckoutScreen docblock below for the flow.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  StatusBar,
  Modal,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, NetworkError } from '../../../shell/api/client';
import { tohfaMarketLogo } from '../assets/images';
import { ModalCloseCrossSvg } from './ProductModals';
import {
  customerFonts,
} from '../theme';
import { cartQueryKeys, reReserveCart, useCart } from '../api/cart';
import {
  checkoutFingerprint,
  isCheckoutInputComplete,
  isPickupFulfillment,
  orderIdempotencyKeys,
  useOrderQuote,
  usePlaceOrder,
  type CheckoutInput,
  type Order,
} from '../api/orders';
import { useWalletBalance } from '../api/wallet';
import { formatAddressLine, useAddresses } from '../api/addresses';
import { usePickupPoints } from '../api/pickup';
import { mapProblem } from '../api/problem';
import { checkoutDraftStore, draftToInput, useCheckoutDraftState } from '../state/checkoutDraft';
import { PickupQrCode } from '../components/PickupQrCode';
import { formatKg, formatRupees, subtractMoney } from '../utils/money';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── CONFETTI ANIMATION COMPONENT (Shoots from Left Center & Right Center OVER Popup) ──

interface ConfettiPiece {
  id: number;
  originSide: 'left' | 'right';
  startX: number;
  startY: number;
  targetX: number;
  peakY: number;
  endY: number;
  size: { width: number; height: number };
  color: string;
  rotation: number;
  delay: number;
  duration: number;
}

const CONFETTI_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber / Gold
  '#10B981', // Emerald green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#E11D48', // Crimson
];

const TOTAL_CONFETTI = 88;

const GENERATED_PIECES: ConfettiPiece[] = Array.from({ length: TOTAL_CONFETTI }).map((_, i) => {
  const isLeft = i % 2 === 0;
  // Left center or right center cannon origin
  const startX = isLeft
    ? Math.random() * 24 - 12
    : SCREEN_WIDTH - Math.random() * 24 + 12;
  const startY = SCREEN_HEIGHT * 0.48 + (Math.random() - 0.5) * 160;
  const targetX = isLeft
    ? SCREEN_WIDTH * 0.2 + Math.random() * (SCREEN_WIDTH * 0.78)
    : SCREEN_WIDTH * 0.02 + Math.random() * (SCREEN_WIDTH * 0.78);
  const peakY = -(160 + Math.random() * 280);
  const endY = 180 + Math.random() * 280;

  // Varied real party paper dimensions: streamers, confetti flakes, rectangles
  const shapeType = i % 4;
  const size =
    shapeType === 0
      ? { width: 5, height: 14 }
      : shapeType === 1
      ? { width: 9, height: 11 }
      : shapeType === 2
      ? { width: 12, height: 6 }
      : { width: 7, height: 7 };

  return {
    id: i,
    originSide: isLeft ? 'left' : 'right',
    startX,
    startY,
    targetX,
    peakY,
    endY,
    size,
    color: (CONFETTI_COLORS[i % CONFETTI_COLORS.length] || '#10B981') as string,
    rotation: Math.floor(Math.random() * 360),
    delay: (i % 22) * 16,
    duration: 2200 + (i % 10) * 180,
  };
});

const ConfettiParticle = ({ piece }: { piece: ConfettiPiece }) => {
  const anim = useRef(new Animated.Value(0)).current;

  // Single-shot celebratory paper blast (ONE TIME ONLY, no looping)
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 1,
        duration: piece.duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, piece.delay);
    return () => clearTimeout(timer);
  }, [anim, piece.delay, piece.duration]);

  // Shoots inward from left or right towards the center / across the screen
  const translateX = anim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [piece.startX, (piece.startX + piece.targetX) * 0.55, piece.targetX],
  });

  // Explosive blast upwards, then falling gracefully with gravity
  const translateY = anim.interpolate({
    inputRange: [0, 0.32, 1],
    outputRange: [piece.startY, piece.startY + piece.peakY, piece.startY + piece.endY],
  });

  // Realistic tumbling 3D effect
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      `${piece.rotation}deg`,
      `${piece.rotation + (piece.originSide === 'left' ? 720 : -720)}deg`,
    ],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.08, 0.8, 1],
    outputRange: [0.5, 1, 1, 0.75],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.04, 0.88, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: piece.size.width,
        height: piece.size.height,
        backgroundColor: piece.color,
        borderRadius: 1.5,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate }, { scale }],
        zIndex: 99999,
        // Absolutely NO black shadows - pure lightweight floating festive papers
        elevation: 0,
        shadowColor: 'transparent',
        shadowOpacity: 0,
        shadowRadius: 0,
      }}
    />
  );
};

const ConfettiOverlay = () => (
  <View
    pointerEvents="none"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      elevation: 0,
    }}
  >
    {GENERATED_PIECES.map(p => (
      <ConfettiParticle key={p.id} piece={p} />
    ))}
  </View>
);

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

const LocationPinSvg = ({ color = '#16A34A' }: { color?: string }) => (
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

const EditPencilSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
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

const CardHeaderSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke="#16A34A" strokeWidth={2} />
    <Path d="M2 10h20" stroke="#16A34A" strokeWidth={2} />
  </Svg>
);

const WalletSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M20 12V8H6a2 2 0 01-2-2V4a2 2 0 012-2h14v6" stroke="#4B5563" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 6v14a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2z" stroke="#4B5563" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="16" cy="14" r="1.5" fill="#4B5563" />
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
    <Circle cx="9" cy="21" r="1.5" fill="#FFFFFF" />
    <Circle cx="18" cy="21" r="1.5" fill="#FFFFFF" />
  </Svg>
);

export interface CheckoutScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onGoBack?: () => void;
  /** Unused: the draft comes from state/checkoutDraft (no totals in nav params). */
  params?: Record<string, unknown>;
}

const SLOT_LABEL: Record<string, string> = {
  MORNING_8_12: '8 AM - 12 PM',
  AFTERNOON_12_4: '12 PM - 4 PM',
  EVENING_4_8: '4 PM - 8 PM',
};

function formatPlacedAt(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
}

/**
 * Pay & checkout (Figma 46:38924, wallet popup 46:40084, success 46:40202,
 * pickup code 46:40610). WALLET ONLY (BR-17): no UPI/card/COD/net banking here;
 * money is added from the wallet top-up (Razorpay) flow.
 *  - Totals: POST /orders/quote on entry and whenever the draft changes; the
 *    shown total is `quote.totalAmount`, the same pricing path as checkout.
 *  - Place: POST /orders with ONE Idempotency-Key per attempt (same payload ->
 *    same key, so a retry after a timeout or a top-up can never double-debit).
 *  - Errors: 402 WALLET_INSUFFICIENT -> shortfall + Add money (Topup); 409
 *    STOCK_UNAVAILABLE / INSUFFICIENT_ALLOCATION -> back to cart; CART_LOCK_EXPIRED
 *    -> re-reserve + re-quote; SLOT_FULL -> back to the slot picker; 501 -> pickup only.
 */
export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ onNavigate, onGoBack }) => {
  const qc = useQueryClient();
  const { draft } = useCheckoutDraftState();
  const input = draftToInput(draft);
  const [order, setOrder] = useState<Order | null>(null);
  // Once placed, the cart is converted: stop quoting it.
  const quoteQuery = useOrderQuote(order ? null : input);
  const quote = quoteQuery.data;
  const wallet = useWalletBalance();
  const cartQuery = useCart();
  const addressesQuery = useAddresses(draft?.fulfillmentType === 'HOME_DELIVERY');
  const pickupQuery = usePickupPoints();
  const placeOrderM = usePlaceOrder();

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [shortfall, setShortfall] = useState<string | null>(null);
  const [networkRetry, setNetworkRetry] = useState(false);

  const isPickup = draft?.fulfillmentType === 'WAREHOUSE_PICKUP';
  const address = addressesQuery.data?.find((a) => a.id === draft?.deliveryAddressId);
  const point = pickupQuery.data?.find((p) => p.id === draft?.warehouseId);
  const quoteShortfall = quote && !quote.walletSufficient ? quote.shortfall : null;
  const effectiveShortfall = shortfall ?? quoteShortfall;
  const balanceLabel = quote ? formatRupees(quote.walletBalance) : wallet.label;
  const total = quote?.totalAmount ?? null;
  const ready = !!quote && !quote.lockExpired && quote.walletSufficient && !placeOrderM.isPending;

  // A quote that reports an expired lock: re-reserve (PUT cart) and re-quote (BR-22).
  useEffect(() => {
    if (!quote?.lockExpired || !cartQuery.data) return;
    void reReserveCart(cartQuery.data, draft?.warehouseId)
      .then((fresh) => {
        qc.setQueryData(cartQueryKeys.cart, fresh);
        void quoteQuery.refetch();
      })
      .catch((err: unknown) => setErrorText(mapProblem(err).message));
  }, [quote?.lockExpired]);

  const backToCart = (message: string | null) => {
    checkoutDraftStore.setNotice(message);
    void qc.invalidateQueries({ queryKey: cartQueryKeys.cart });
    if (onGoBack) onGoBack();
    else onNavigate?.('Cart');
  };

  const goTopup = () => {
    onNavigate?.('Topup', effectiveShortfall ? { shortfall: effectiveShortfall } : undefined);
  };

  const handleError = async (err: unknown, inp: CheckoutInput): Promise<void> => {
    if (err instanceof NetworkError) {
      // Keep the key: a replay is safe and returns the original order if it was created.
      setNetworkRetry(true);
      setErrorText('We could not confirm your order. Check My Orders before retrying.');
      return;
    }
    const p = mapProblem(err);
    if (p.silent) return;
    const code = err instanceof ApiError ? (err.code as string) : '';
    if (code === 'IDEMPOTENCY_KEY_REUSED') orderIdempotencyKeys.reset();
    if (p.action === 'topup' || code === 'WALLET_INSUFFICIENT') {
      setShortfall(err instanceof ApiError ? (err.walletShortfall?.shortfall ?? null) : null);
      setErrorText(p.message);
      setShowWalletModal(false);
      return;
    }
    if (code === 'CART_LOCK_EXPIRED' && cartQuery.data) {
      try {
        const fresh = await reReserveCart(cartQuery.data, inp.warehouseId);
        qc.setQueryData(cartQueryKeys.cart, fresh);
        void quoteQuery.refetch();
        setErrorText('Your reservation was renewed. Please confirm again.');
      } catch (e) {
        setErrorText(mapProblem(e).message);
      }
      return;
    }
    if (p.action === 'refresh_cart') {
      setShowWalletModal(false);
      backToCart(p.message);
      return;
    }
    if (p.action === 'choose_slot' || code === 'SLOT_FULL') {
      checkoutDraftStore.patchDraft({ deliverySlot: undefined });
      setShowWalletModal(false);
      backToCart(p.message);
      return;
    }
    if (err instanceof ApiError && err.status === 501) {
      checkoutDraftStore.setHomeDeliveryDisabled(true);
      setShowWalletModal(false);
      backToCart('Home delivery is not available right now. Please choose a pickup point.');
      return;
    }
    if (err instanceof ApiError && err.status === 404 && !isPickup) {
      setShowWalletModal(false);
      backToCart('That address is no longer available. Please pick another.');
      return;
    }
    setErrorText(p.message);
  };

  const handleConfirmPayment = async () => {
    if (!input || !isCheckoutInputComplete(input) || placeOrderM.isPending) return;
    const key = orderIdempotencyKeys.keyFor(checkoutFingerprint(input));
    setErrorText(null);
    setNetworkRetry(false);
    try {
      const placed = await placeOrderM.mutateAsync({ input, idempotencyKey: key });
      orderIdempotencyKeys.reset();
      setOrder(placed);
      setShowWalletModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      await handleError(err, input);
    }
  };

  // Quote failures (SLOT_FULL, 501, 404 address...) use the same recovery as checkout.
  useEffect(() => {
    if (quoteQuery.error && !order && input && isCheckoutInputComplete(input)) void handleError(quoteQuery.error, input);
  }, [quoteQuery.error]);

  const orderIsPickup = isPickupFulfillment(order?.fulfillmentType) || (!order?.fulfillmentType && isPickup);
  const orderPoint = pickupQuery.data?.find((p) => p.id === order?.warehouseId) ?? point;

  if (!draft && !order) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => (onGoBack ? onGoBack() : onNavigate?.('Cart'))} style={styles.backButton} accessibilityLabel="Back">
            <BackArrowSvg />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pay & Checkout</Text>
        </View>
        <View style={styles.policyContainer} testID="checkout-no-draft">
          <Text style={styles.policyTitle}>Choose how to receive your order</Text>
          <TouchableOpacity onPress={() => onNavigate?.('Cart')}>
            <Text style={styles.readPolicyLink}>Go to cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── TOP HEADER (Back Button + Editorial Title) ──────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => (onGoBack ? onGoBack() : onNavigate?.('Cart'))} style={styles.backButton} accessibilityLabel="Back">
          <BackArrowSvg />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay & Checkout</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── 1. DELIVERY ADDRESS / PICKUP POINT CARD ───────────────────────── */}
        <View style={styles.addressCard}>
          <View style={styles.addressCardHeader}>
            <View style={styles.addressCardHeaderLeft}>
              <LocationPinSvg color="#16A34A" />
              <Text style={styles.addressCardTitle}>{isPickup ? 'Pickup point' : 'Delivery Address'}</Text>
              {!isPickup && address && (
                <View style={styles.homeBadge}>
                  <Text style={styles.homeBadgeText}>{address.label === 'HOME' ? 'Home' : address.label === 'OFFICE' ? 'Office' : 'Other'}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => (onGoBack ? onGoBack() : onNavigate?.('Cart'))} accessibilityLabel="Change">
              <EditPencilSvg />
            </TouchableOpacity>
          </View>
          <View style={styles.addressCardBody}>
            {isPickup ? (
              <>
                <Text style={styles.addressLine}>{point?.name ?? ''}</Text>
                {!!point?.address && <Text style={styles.addressLine}>{point.address}</Text>}
                {!!point?.phone && <Text style={styles.addressPhone}>Phone: {point.phone}</Text>}
              </>
            ) : (
              <>
                {address && <Text style={styles.addressLine}>{formatAddressLine(address)}, {address.state}.</Text>}
                {!!address?.contactPhone && <Text style={styles.addressPhone}>Phone: {address.contactPhone}</Text>}
                {!!draft?.deliveryDate && (
                  <Text style={styles.addressPhone} testID="checkout-slot">
                    {draft.deliveryDate} · {draft.deliverySlot ? SLOT_LABEL[draft.deliverySlot] : ''}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>

        {/* ── 2. CART SUMMARY FLOATING DARK PILL ────────────────────────────── */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => (onGoBack ? onGoBack() : onNavigate?.('Cart'))} style={styles.darkCartPill}>
          <View style={styles.darkCartLeft}>
            <View style={styles.cartThumbnailCircle} />
            <View style={styles.darkCartTexts}>
              <Text style={styles.darkCartTitle}>{quote ? `${quote.itemCount} ${quote.itemCount === 1 ? 'item' : 'items'} in your cart` : 'Your cart'}</Text>
              <Text style={styles.darkCartViewLink}>View cart</Text>
            </View>
          </View>
          <Text style={styles.darkCartTotal}>{formatRupees(quote?.subtotal)}</Text>
        </TouchableOpacity>

        {/* ── 3. ORDER SUMMARY (POST /orders/quote) ─────────────────────────── */}
        <View style={styles.paymentCard}>
          <View style={styles.paymentCardHeader}>
            <CardHeaderSvg />
            <Text style={styles.paymentCardTitle}>Order summary</Text>
          </View>
          {quoteQuery.isLoading ? (
            <ActivityIndicator testID="quote-loading" style={{ margin: 16 }} />
          ) : quote ? (
            <View style={styles.orderItemsBlock}>
              {quote.lines.map((l) => (
                <View key={l.id} style={styles.orderItemRow}>
                  <View>
                    <Text style={styles.orderItemName}>{l.name}</Text>
                    <Text style={styles.orderItemSub}>
                      {formatKg(l.qtyKg)} × {formatRupees(l.unitPrice)} / kg
                    </Text>
                  </View>
                  <Text style={styles.orderItemPrice}>{formatRupees(l.lineTotal)}</Text>
                </View>
              ))}
              <View style={styles.dottedDivider} />
              {(
                [
                  ['Items total', quote.subtotal],
                  ['Delivery fee', quote.deliveryFee],
                  ['Handling fee', quote.handlingFee],
                  ['GST', quote.gstAmount],
                ] as const
              ).map(([label, value]) => (
                <View key={label} style={styles.orderItemRow}>
                  <Text style={styles.orderItemSub}>{label}</Text>
                  <Text style={styles.orderItemPrice}>{formatRupees(value)}</Text>
                </View>
              ))}
              <View style={styles.totalPaidRow}>
                <Text style={styles.totalPaidLabel}>To pay</Text>
                <Text style={styles.totalPaidAmount} testID="checkout-total">
                  {formatRupees(quote.totalAmount)}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => void quoteQuery.refetch()} testID="quote-retry">
              <Text style={styles.orderItemSub}>{errorText ?? "Couldn't price your order. Tap to retry."}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 4. PAYMENT METHOD: TOHFA WALLET ONLY (BR-17) ──────────────────── */}
        <View style={styles.paymentCard}>
          <View style={styles.paymentCardHeader}>
            <CardHeaderSvg />
            <Text style={styles.paymentCardTitle}>Payment Method</Text>
          </View>
          <View style={styles.paymentList}>
            <View style={[styles.methodRow, styles.methodRowSelected]} testID="wallet-method">
              <View style={styles.methodLeft}>
                <WalletSvg />
                <Text style={styles.methodLabel}>Pay with TOHFA Wallet · {balanceLabel}</Text>
              </View>
              <View style={[styles.radioCircle, styles.radioCircleSelected]}>
                <View style={styles.radioInnerDot} />
              </View>
            </View>
          </View>
          {!!effectiveShortfall && (
            <View style={styles.walletBalanceAfterBanner} testID="checkout-shortfall">
              <Text style={styles.walletBalanceAfterLabel}>Short by {formatRupees(effectiveShortfall)}</Text>
              <TouchableOpacity onPress={goTopup} testID="checkout-add-money" style={styles.walletConfirmBtn}>
                <Text style={styles.walletConfirmBtnText}>Add money</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {!!errorText && !effectiveShortfall && (
          <View style={styles.policyContainer} testID="checkout-error">
            <Text style={styles.policyText}>{errorText}</Text>
            {networkRetry && (
              <TouchableOpacity onPress={() => void handleConfirmPayment()} testID="checkout-retry">
                <Text style={styles.readPolicyLink}>Retry payment</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── 5. RETURN / REFUND POLICY ─────────────────────────────────────── */}
        <View style={styles.policyContainer}>
          <Text style={styles.policyTitle}>Return/Refund Policy</Text>
          <Text style={styles.policyText}>Freshly sourced from local farmers, thoughtfully delivered to your home.</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert('Return & Refund Policy', 'If any item is damaged or not fresh, raise a return from My Orders after delivery or pickup.')
            }
          >
            <Text style={styles.readPolicyLink}>Read policy</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── 6. STICKY BOTTOM BAR ───────────────────────────────────────────── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPillContainer}>
          <Text style={styles.bottomPriceText}>{formatRupees(total)}</Text>
          {effectiveShortfall ? (
            <TouchableOpacity activeOpacity={0.85} onPress={goTopup} style={[styles.proceedToPayBtn, styles.proceedToPayBtnActive]} testID="checkout-topup-cta">
              <Text style={[styles.proceedToPayBtnText, styles.proceedToPayBtnTextActive]}>Add money</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={ready ? 0.85 : 1}
              onPress={() => setShowWalletModal(true)}
              disabled={!ready}
              style={[styles.proceedToPayBtn, ready ? styles.proceedToPayBtnActive : styles.proceedToPayBtnDisabled]}
              testID="checkout-proceed"
            >
              <Text style={[styles.proceedToPayBtnText, ready ? styles.proceedToPayBtnTextActive : styles.proceedToPayBtnTextDisabled]}>Pay & place order</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.floatingCartCircle} onPress={() => (onGoBack ? onGoBack() : onNavigate?.('Cart'))} activeOpacity={0.85}>
          <CartFloatingSvg />
        </TouchableOpacity>
      </View>

      {/* ═══ PAY WITH WALLET POPUP (46:40084): no OTP, the quote is the source ═══ */}
      <Modal visible={showWalletModal} transparent animationType="fade" onRequestClose={() => setShowWalletModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.walletModalCard}>
            <TouchableOpacity style={styles.modalCloseCircle} onPress={() => setShowWalletModal(false)} activeOpacity={0.7} accessibilityLabel="Close">
              <ModalCloseCrossSvg size={13} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.walletHeaderRow}>
              <View style={styles.walletIconHeader}>
                <WalletSvg />
              </View>
              <Text style={styles.walletModalTitle}>Pay with Wallet</Text>
            </View>
            <View style={styles.walletSummaryCard}>
              <View style={styles.walletBalanceRow}>
                <View style={styles.walletBalanceLeft}>
                  <WalletSvg />
                  <Text style={styles.walletBalanceLabel}>TOHFA Wallet Balance</Text>
                </View>
                <Text style={styles.walletBalanceVal} testID="wallet-modal-balance">
                  {balanceLabel}
                </Text>
              </View>
              <View style={styles.walletDivider} />
              <View style={styles.walletBalanceRow}>
                <Text style={styles.walletAmountLabel}>Payment Amount</Text>
                <Text style={styles.walletAmountVal}>{formatRupees(total)}</Text>
              </View>
              {quote && (
                <View style={styles.walletBalanceAfterBanner}>
                  <Text style={styles.walletBalanceAfterLabel}>Balance after Payment</Text>
                  <Text style={styles.walletBalanceAfterVal}>{formatRupees(subtractMoney(quote.walletBalance, quote.totalAmount))}</Text>
                </View>
              )}
            </View>
            {!!errorText && (
              <Text style={styles.walletOrderLabel} testID="wallet-modal-error">
                {errorText}
              </Text>
            )}
            <View style={styles.walletActionRow}>
              <TouchableOpacity style={styles.walletCancelBtn} onPress={() => setShowWalletModal(false)} activeOpacity={0.7}>
                <Text style={styles.walletCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.walletConfirmBtn}
                onPress={() => void handleConfirmPayment()}
                disabled={placeOrderM.isPending}
                activeOpacity={0.85}
                testID="wallet-confirm"
              >
                {placeOrderM.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.walletConfirmBtnText}>Confirm Payment</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ ORDER SUCCESS (46:40202) ═══ */}
      <Modal visible={showSuccessModal && !!order} transparent animationType="fade" onRequestClose={() => setShowSuccessModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.successModalCard} testID="order-success">
            <TouchableOpacity style={styles.modalCloseCircle} onPress={() => setShowSuccessModal(false)} activeOpacity={0.7} accessibilityLabel="Close">
              <ModalCloseCrossSvg size={13} color="#1F2937" />
            </TouchableOpacity>
            <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.82 }} showsVerticalScrollIndicator={false}>
              <View style={styles.successLogoHeader}>
                <Image source={tohfaMarketLogo} style={styles.successLogoImage} resizeMode="contain" />
              </View>
              <View style={styles.dottedDivider} />
              <View style={styles.orderMetaBlock}>
                <View style={styles.orderMetaRow}>
                  <Text style={styles.orderMetaLabel}>Order ID</Text>
                  <Text style={styles.orderMetaValBold} testID="success-order-number">
                    {order?.orderNumber}
                  </Text>
                </View>
                <View style={styles.orderMetaRow}>
                  <Text style={styles.orderMetaLabel}>Order Date</Text>
                  <Text style={styles.orderMetaValBold}>{formatPlacedAt(order?.placedAt)}</Text>
                </View>
                <View style={styles.orderMetaRow}>
                  <Text style={styles.orderMetaLabel}>Payment method</Text>
                  <Text style={styles.orderMetaValBold}>{order?.paymentMethodLabel ?? 'Wallet'}</Text>
                </View>
                <View style={styles.orderMetaRow}>
                  <Text style={styles.orderMetaLabel}>{orderIsPickup ? 'Pickup location' : 'Delivery'}</Text>
                  <Text style={styles.orderMetaValBold}>
                    {orderIsPickup ? (orderPoint?.name ?? '') : `${order?.deliveryDate ?? ''} ${order?.deliverySlot ? SLOT_LABEL[order.deliverySlot] : ''}`}
                  </Text>
                </View>
              </View>

              <View style={styles.orderItemsBlock}>
                {(order?.items ?? []).map((it) => (
                  <View key={it.id} style={styles.orderItemRow}>
                    <View>
                      <Text style={styles.orderItemName}>{it.name}</Text>
                      <Text style={styles.orderItemSub}>
                        {formatKg(it.qtyKg)} × {formatRupees(it.unitPrice)} / kg
                      </Text>
                    </View>
                    <Text style={styles.orderItemPrice}>{formatRupees(it.lineTotal)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.dottedDivider} />

              <Text style={styles.orderProgressHeading}>Order progress</Text>
              <View style={styles.progressTracker}>
                {[
                  { title: 'Payment', sub: 'Your wallet payment was successful.', state: 'done' },
                  { title: 'Order confirmed', sub: 'Your order has been accepted.', state: 'done' },
                  { title: 'Preparing your order', sub: 'Your items are being collected and packed.', state: 'active' },
                  orderIsPickup
                    ? { title: 'Ready for pickup', sub: "We'll notify you when your order is ready.", state: 'todo' }
                    : { title: 'On the way', sub: "We'll notify you when it is dispatched.", state: 'todo' },
                  orderIsPickup
                    ? { title: 'Order collected', sub: 'Your order has been handed over.', state: 'todo' }
                    : { title: 'Delivered', sub: order?.otpRequired ? 'Share the delivery OTP sent to you at handover.' : 'Your order has been delivered.', state: 'todo' },
                ].map((step, i, all) => (
                  <View key={step.title} style={styles.trackerStepRow}>
                    <View style={styles.trackerLeftCol}>
                      <Text style={styles.trackerNumber}>{i + 1}</Text>
                      {i < all.length - 1 && <View style={[styles.trackerLine, step.state === 'done' && styles.trackerLineActive]} />}
                    </View>
                    <View style={styles.trackerTextCol}>
                      <View style={styles.trackerTitleRow}>
                        <Text style={styles.trackerTitle}>{step.title}</Text>
                        {step.state === 'done' && (
                          <View style={styles.completedBadge}>
                            <Text style={styles.completedBadgeText}>Completed</Text>
                          </View>
                        )}
                        {step.state === 'active' && (
                          <View style={styles.inProgressBadge}>
                            <Text style={styles.inProgressBadgeText}>In progress</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.trackerSubtitle}>{step.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.totalPaidRow}>
                <Text style={styles.totalPaidLabel}>Total paid</Text>
                <Text style={styles.totalPaidAmount} testID="success-total">
                  {formatRupees(order?.totalAmount)}
                </Text>
              </View>
              <View style={styles.paidMethodBanner}>
                <WalletSvg />
                <Text style={styles.paidMethodText}>Paid via {order?.paymentMethodLabel ?? 'Wallet'}</Text>
              </View>

              {orderIsPickup && !!order?.pickupCode ? (
                <TouchableOpacity
                  style={styles.checkPickupBtn}
                  onPress={() => {
                    setShowSuccessModal(false);
                    setShowPickupModal(true);
                  }}
                  activeOpacity={0.85}
                  testID="success-check-pickup"
                >
                  <Text style={styles.checkPickupBtnText}>Check Pickup code</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.checkPickupBtn}
                  onPress={() => {
                    setShowSuccessModal(false);
                    checkoutDraftStore.setDraft(null);
                    if (order) onNavigate?.('OrderTracking', { orderId: order.id });
                  }}
                  activeOpacity={0.85}
                  testID="success-view-order"
                >
                  <Text style={styles.checkPickupBtnText}>View order</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
          <ConfettiOverlay />
        </View>
      </Modal>

      {/* ═══ PICKUP CODE + QR (46:40610): QR = pickupQr.payload (no OTP) ═══ */}
      <Modal visible={showPickupModal && !!order} transparent animationType="fade" onRequestClose={() => setShowPickupModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.pickupModalCard} testID="pickup-code-modal">
            <TouchableOpacity style={styles.modalCloseCircle} onPress={() => setShowPickupModal(false)} activeOpacity={0.7} accessibilityLabel="Close">
              <ModalCloseCrossSvg size={13} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.successLogoHeader}>
              <Image source={tohfaMarketLogo} style={styles.successLogoImage} resizeMode="contain" />
            </View>
            <View style={styles.dottedDivider} />
            <View style={styles.qrCodeContainer}>
              <PickupQrCode payload={order?.pickupQr?.payload} size={190} />
            </View>
            <Text style={styles.orReadOutText}>OR READ OUT THIS CODE</Text>
            <Text style={styles.pickupCodeNumber} testID="pickup-code">
              {order?.pickupCode}
            </Text>
            <View style={styles.pickupSummaryPill}>
              <View>
                <Text style={styles.pickupOrderIdText}>{order?.orderNumber}</Text>
                <Text style={styles.pickupItemsLocationText}>
                  {order?.itemCount ?? order?.items.length ?? 0} items{orderPoint ? ` · ${orderPoint.name}` : ''}
                </Text>
              </View>
              <Text style={styles.pickupPriceText}>{formatRupees(order?.totalAmount)}</Text>
            </View>
            <TouchableOpacity
              style={styles.continueShoppingBtn}
              onPress={() => {
                setShowPickupModal(false);
                checkoutDraftStore.setDraft(null);
                if (order) onNavigate?.('OrderTracking', { orderId: order.id });
              }}
              activeOpacity={0.85}
              testID="pickup-view-order"
            >
              <Text style={styles.continueShoppingBtnText}>View order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.continueShoppingBtn}
              onPress={() => {
                setShowPickupModal(false);
                checkoutDraftStore.setDraft(null);
                onNavigate?.('Home');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.continueShoppingBtnText}>Continue shopping</Text>
            </TouchableOpacity>
          </View>
          <ConfettiOverlay />
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

  // ── 1. DELIVERY ADDRESS CARD ──────────────────────────────────────────────
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 14,
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addressCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  homeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  homeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  addressCardBody: {
    paddingLeft: 4,
  },
  addressLine: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  addressPhone: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
  },

  // ── 2. CART SUMMARY FLOATING DARK PILL ────────────────────────────────────
  darkCartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#374151',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  darkCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartThumbnailCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cartThumbnailImage: {
    width: 24,
    height: 24,
  },
  darkCartTexts: {},
  darkCartTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  darkCartViewLink: {
    fontSize: 11,
    color: '#D1D5DB',
  },
  darkCartTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── 3. PAYMENT METHOD CARD ────────────────────────────────────────────────
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 16,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF7EE',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  paymentCardTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 15,
    color: '#1F2937',
  },
  paymentList: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  methodRowSelected: {
    backgroundColor: '#E8F5E9',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#2E7D32',
  },
  radioInnerDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#2E7D32',
  },

  // ── EXPANDED SUB-SECTIONS ─────────────────────────────────────────────────
  subSectionBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginTop: -4,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  subSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  autofillHint: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },
  otherBankLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  upiAppsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upiAppBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  upiAppBtnSelected: {
    backgroundColor: '#E8F5E9',
  },
  upiIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  otherUpiText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
  },
  paytmText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00BAF2',
  },
  upiAppLabel: {
    fontSize: 11,
    color: '#4B5563',
  },

  // Popular banks row (Image 4)
  popularBanksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  popularBankCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 3,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  popularBankCardSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#16A34A',
  },
  bankLogoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bankLogoText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  popularBankName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },

  // Other bank search & list (Image 1 & 5)
  otherBanksContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'android' ? 2 : 6,
    marginBottom: 10,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    marginLeft: 8,
    paddingVertical: 2,
  },
  banksListContainer: {
    maxHeight: 220,
  },
  bankListItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  bankListItemRowSelected: {
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
  },
  bankInlineProceedBtn: {
    backgroundColor: '#2D7A47',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  bankInlineProceedBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  bankListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bankItemCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankItemCircleText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  bankItemName: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  radioCircleSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },

  // Card details inputs (Image 2)
  cardInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
    marginBottom: 12,
  },
  cardNumberInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    paddingVertical: 2,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSmallInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    fontSize: 13,
    color: '#1F2937',
    paddingVertical: 2,
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
  proceedToPayBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  proceedToPayBtnActive: {
    backgroundColor: '#2E7D32',
  },
  proceedToPayBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  proceedToPayBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  proceedToPayBtnTextActive: {
    color: '#FFFFFF',
  },
  proceedToPayBtnTextDisabled: {
    color: '#9CA3AF',
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

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL STYLES (Screen 2, 3 & 4)
  // ═══════════════════════════════════════════════════════════════════════════
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCloseCircle: {
    position: 'absolute',
    top: -14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 100,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },

  // ── 2ND SCREEN: PAY WITH WALLET STYLES ────────────────────────────────────
  walletModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  walletHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  walletIconHeader: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletModalTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 20,
    color: '#1F2937',
  },
  walletOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  walletOrderBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  walletOrderCartIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletOrderId: {
    fontSize: 11,
    color: '#4B5563',
  },
  walletOrderLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  walletOrderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  walletSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 16,
  },
  walletBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  walletBalanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletBalanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  walletBalanceVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  walletDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  walletAmountLabel: {
    fontSize: 13,
    color: '#4B5563',
  },
  walletAmountVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  walletBalanceAfterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  walletBalanceAfterLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#166534',
  },
  walletBalanceAfterVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#166534',
  },
  walletOtpSection: {
    marginBottom: 18,
  },
  walletOtpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  walletOtpTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  walletOtpSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 10,
  },
  walletOtpInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'android' ? 4 : 8,
    backgroundColor: '#FFFFFF',
  },
  walletOtpInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
    paddingVertical: 2,
  },
  walletActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  walletCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  walletCancelBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  walletConfirmBtn: {
    flex: 1.3,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletConfirmBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ── 3RD SCREEN: ORDER SUCCESS MODAL STYLES ────────────────────────────────
  successModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },
  successLogoHeader: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  successLogoImage: {
    width: 140,
    height: 38,
  },
  associationSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 10,
  },
  dottedDivider: {
    borderStyle: 'dashed',
    borderWidth: 0.8,
    borderColor: '#D1D5DB',
    marginVertical: 12,
  },
  orderMetaBlock: {
    marginBottom: 10,
  },
  orderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  orderMetaLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderMetaValBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  orderItemsBlock: {
    marginBottom: 4,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  orderItemSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  orderProgressHeading: {
    fontFamily: customerFonts.editorial,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 10,
  },
  progressTracker: {
    paddingLeft: 4,
    marginBottom: 12,
  },
  trackerStepRow: {
    flexDirection: 'row',
    minHeight: 46,
  },
  trackerLeftCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  trackerNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  trackerLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  trackerLineActive: {
    backgroundColor: '#16A34A',
  },
  trackerTextCol: {
    flex: 1,
    paddingBottom: 8,
  },
  trackerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  trackerSubtitle: {
    fontSize: 10.5,
    color: '#6B7280',
    marginTop: 2,
  },
  completedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#15803D',
  },
  inProgressBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  inProgressBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#B45309',
  },
  totalPaidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  totalPaidLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalPaidAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  paidMethodBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  paidMethodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  checkPickupBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkPickupBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ── 4TH SCREEN: PICKUP CODE & QR MODAL STYLES ─────────────────────────────
  pickupModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },
  qrCodeContainer: {
    marginVertical: 14,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  orReadOutText: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
  pickupCodeNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 1.5,
    marginVertical: 8,
  },
  pickupSummaryPill: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 12,
  },
  pickupOrderIdText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  pickupItemsLocationText: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2,
  },
  pickupPriceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  continueShoppingBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  continueShoppingBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
