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
import { t } from '../../../i18n/customer';
import { tohfaMarketLogo } from '../assets/images';
import { ModalCloseCrossSvg } from './ProductModals';
import {
  customerFonts,
  customerColors,
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
  customerColors.legacy.red, // Red
  customerColors.legacy.amber, // Amber / Gold
  customerColors.palette.green.emeraldBright, // Emerald green
  customerColors.palette.blue.bright, // Blue
  customerColors.palette.purple.iris, // Purple
  customerColors.palette.purple.pink, // Pink
  customerColors.palette.blue.cyan, // Cyan
  customerColors.palette.orange.bright, // Orange
  customerColors.palette.blue.teal, // Teal
  customerColors.palette.red.raspberry, // Crimson
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
    color: (CONFETTI_COLORS[i % CONFETTI_COLORS.length] || customerColors.palette.green.emeraldBright) as string,
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
      stroke={customerColors.neutral.neutral900}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LocationPinSvg = ({ color = customerColors.shared.success }: { color?: string }) => (
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
      stroke={customerColors.neutral.neutral900}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke={customerColors.neutral.neutral900}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CardHeaderSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke={customerColors.shared.success} strokeWidth={2} />
    <Path d="M2 10h20" stroke={customerColors.shared.success} strokeWidth={2} />
  </Svg>
);

const WalletSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M20 12V8H6a2 2 0 01-2-2V4a2 2 0 012-2h14v6" stroke={customerColors.neutral.neutral700} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 6v14a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2z" stroke={customerColors.neutral.neutral700} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="16" cy="14" r="1.5" fill={customerColors.neutral.neutral700} />
  </Svg>
);

const CartFloatingSvg = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
      stroke={customerColors.white}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="9" cy="21" r="1.5" fill={customerColors.white} />
    <Circle cx="18" cy="21" r="1.5" fill={customerColors.white} />
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
      setErrorText(t('customer.checkout.screen.err.network'));
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
        setErrorText(t('customer.checkout.screen.err.renewed'));
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
      backToCart(t('customer.checkout.screen.err.noHome'));
      return;
    }
    if (err instanceof ApiError && err.status === 404 && !isPickup) {
      setShowWalletModal(false);
      backToCart(t('customer.checkout.screen.err.noAddress'));
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
          <TouchableOpacity activeOpacity={0.7} onPress={() => (onGoBack ? onGoBack() : onNavigate?.('Cart'))} style={styles.backButton} accessibilityLabel={t('customer.common.back')}>
            <BackArrowSvg />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('customer.checkout.screen.title')}</Text>
        </View>
        <View style={styles.policyContainer} testID="checkout-no-draft">
          <Text style={styles.policyTitle}>{t('customer.checkout.screen.noDraft')}</Text>
          <TouchableOpacity onPress={() => onNavigate?.('Cart')}>
            <Text style={styles.readPolicyLink}>{t('customer.checkout.screen.goToCart')}</Text>
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
        <TouchableOpacity activeOpacity={0.7} onPress={() => (onGoBack ? onGoBack() : onNavigate?.('Cart'))} style={styles.backButton} accessibilityLabel={t('customer.common.back')}>
          <BackArrowSvg />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('customer.checkout.screen.title')}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── 1. DELIVERY ADDRESS / PICKUP POINT CARD ───────────────────────── */}
        <View style={styles.addressCard}>
          <View style={styles.addressCardHeader}>
            <View style={styles.addressCardHeaderLeft}>
              <LocationPinSvg color={customerColors.shared.success} />
              <Text style={styles.addressCardTitle}>{isPickup ? t('customer.checkout.screen.pickupPoint') : t('customer.checkout.screen.deliveryAddress')}</Text>
              {!isPickup && address && (
                <View style={styles.homeBadge}>
                  <Text style={styles.homeBadgeText}>{address.label === 'HOME' ? t('customer.address.form.type.Home') : address.label === 'OFFICE' ? t('customer.address.form.type.Office') : t('customer.address.form.type.Other')}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => (onGoBack ? onGoBack() : onNavigate?.('Cart'))} accessibilityLabel={t('customer.checkout.screen.change')}>
              <EditPencilSvg />
            </TouchableOpacity>
          </View>
          <View style={styles.addressCardBody}>
            {isPickup ? (
              <>
                <Text style={styles.addressLine}>{point?.name ?? ''}</Text>
                {!!point?.address && <Text style={styles.addressLine}>{point.address}</Text>}
                {!!point?.phone && <Text style={styles.addressPhone}>{t('customer.checkout.screen.phone', { phone: point.phone })}</Text>}
              </>
            ) : (
              <>
                {address && <Text style={styles.addressLine}>{formatAddressLine(address)}, {address.state}.</Text>}
                {!!address?.contactPhone && <Text style={styles.addressPhone}>{t('customer.checkout.screen.phone', { phone: address.contactPhone })}</Text>}
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
              <Text style={styles.darkCartTitle}>{quote ? t(quote.itemCount === 1 ? 'customer.checkout.screen.cartItem' : 'customer.checkout.screen.cartItems', { count: quote.itemCount }) : t('customer.checkout.screen.yourCart')}</Text>
              <Text style={styles.darkCartViewLink}>{t('customer.checkout.screen.viewCart')}</Text>
            </View>
          </View>
          <Text style={styles.darkCartTotal}>{formatRupees(quote?.subtotal)}</Text>
        </TouchableOpacity>

        {/* ── 3. ORDER SUMMARY (POST /orders/quote) ─────────────────────────── */}
        <View style={styles.paymentCard}>
          <View style={styles.paymentCardHeader}>
            <CardHeaderSvg />
            <Text style={styles.paymentCardTitle}>{t('customer.checkout.screen.summary')}</Text>
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
                      {formatKg(l.qtyKg)} × {t('customer.product.detail.perKg', { price: formatRupees(l.unitPrice) })}
                    </Text>
                  </View>
                  <Text style={styles.orderItemPrice}>{formatRupees(l.lineTotal)}</Text>
                </View>
              ))}
              <View style={styles.dottedDivider} />
              {(
                [
                  ['items', quote.subtotal],
                  ['delivery', quote.deliveryFee],
                  ['handling', quote.handlingFee],
                  ['gst', quote.gstAmount],
                ] as const
              ).map(([label, value]) => (
                <View key={label} style={styles.orderItemRow}>
                  <Text style={styles.orderItemSub}>{t(`customer.checkout.screen.${label}`)}</Text>
                  <Text style={styles.orderItemPrice}>{formatRupees(value)}</Text>
                </View>
              ))}
              <View style={styles.totalPaidRow}>
                <Text style={styles.totalPaidLabel}>{t('customer.checkout.screen.toPay')}</Text>
                <Text style={styles.totalPaidAmount} testID="checkout-total">
                  {formatRupees(quote.totalAmount)}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => void quoteQuery.refetch()} testID="quote-retry">
              <Text style={styles.orderItemSub}>{errorText ?? t('customer.checkout.screen.quoteRetry')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 4. PAYMENT METHOD: TOHFA WALLET ONLY (BR-17) ──────────────────── */}
        <View style={styles.paymentCard}>
          <View style={styles.paymentCardHeader}>
            <CardHeaderSvg />
            <Text style={styles.paymentCardTitle}>{t('customer.checkout.screen.paymentMethod')}</Text>
          </View>
          <View style={styles.paymentList}>
            <View style={[styles.methodRow, styles.methodRowSelected]} testID="wallet-method">
              <View style={styles.methodLeft}>
                <WalletSvg />
                <Text style={styles.methodLabel}>{t('customer.checkout.screen.payWithWallet', { balance: balanceLabel })}</Text>
              </View>
              <View style={[styles.radioCircle, styles.radioCircleSelected]}>
                <View style={styles.radioInnerDot} />
              </View>
            </View>
          </View>
          {!!effectiveShortfall && (
            <View style={styles.walletBalanceAfterBanner} testID="checkout-shortfall">
              <Text style={styles.walletBalanceAfterLabel}>{t('customer.checkout.screen.shortBy', { amount: formatRupees(effectiveShortfall) })}</Text>
              <TouchableOpacity onPress={goTopup} testID="checkout-add-money" style={styles.walletConfirmBtn}>
                <Text style={styles.walletConfirmBtnText}>{t('customer.checkout.screen.addMoney')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {!!errorText && !effectiveShortfall && (
          <View style={styles.policyContainer} testID="checkout-error">
            <Text style={styles.policyText}>{errorText}</Text>
            {networkRetry && (
              <TouchableOpacity onPress={() => void handleConfirmPayment()} testID="checkout-retry">
                <Text style={styles.readPolicyLink}>{t('customer.checkout.screen.retryPayment')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── 5. RETURN / REFUND POLICY ─────────────────────────────────────── */}
        <View style={styles.policyContainer}>
          <Text style={styles.policyTitle}>{t('customer.cart.screen.policy.title')}</Text>
          <Text style={styles.policyText}>{t('customer.cart.screen.policy.tagline')}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(t('customer.cart.screen.policy.alertTitle'), t('customer.cart.screen.policy.alertBody'))
            }
          >
            <Text style={styles.readPolicyLink}>{t('customer.cart.screen.policy.read')}</Text>
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
              <Text style={[styles.proceedToPayBtnText, styles.proceedToPayBtnTextActive]}>{t('customer.checkout.screen.addMoney')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={ready ? 0.85 : 1}
              onPress={() => setShowWalletModal(true)}
              disabled={!ready}
              style={[styles.proceedToPayBtn, ready ? styles.proceedToPayBtnActive : styles.proceedToPayBtnDisabled]}
              testID="checkout-proceed"
            >
              <Text style={[styles.proceedToPayBtnText, ready ? styles.proceedToPayBtnTextActive : styles.proceedToPayBtnTextDisabled]}>{t('customer.checkout.screen.payPlace')}</Text>
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
            <TouchableOpacity style={styles.modalCloseCircle} onPress={() => setShowWalletModal(false)} activeOpacity={0.7} accessibilityLabel={t('customer.common.close')}>
              <ModalCloseCrossSvg size={13} color={customerColors.neutral.neutral900} />
            </TouchableOpacity>
            <View style={styles.walletHeaderRow}>
              <View style={styles.walletIconHeader}>
                <WalletSvg />
              </View>
              <Text style={styles.walletModalTitle}>{t('customer.checkout.screen.modal.title')}</Text>
            </View>
            <View style={styles.walletSummaryCard}>
              <View style={styles.walletBalanceRow}>
                <View style={styles.walletBalanceLeft}>
                  <WalletSvg />
                  <Text style={styles.walletBalanceLabel}>{t('customer.checkout.screen.modal.balance')}</Text>
                </View>
                <Text style={styles.walletBalanceVal} testID="wallet-modal-balance">
                  {balanceLabel}
                </Text>
              </View>
              <View style={styles.walletDivider} />
              <View style={styles.walletBalanceRow}>
                <Text style={styles.walletAmountLabel}>{t('customer.checkout.screen.modal.amount')}</Text>
                <Text style={styles.walletAmountVal}>{formatRupees(total)}</Text>
              </View>
              {quote && (
                <View style={styles.walletBalanceAfterBanner}>
                  <Text style={styles.walletBalanceAfterLabel}>{t('customer.checkout.screen.modal.after')}</Text>
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
                <Text style={styles.walletCancelBtnText}>{t('customer.common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.walletConfirmBtn}
                onPress={() => void handleConfirmPayment()}
                disabled={placeOrderM.isPending}
                activeOpacity={0.85}
                testID="wallet-confirm"
              >
                {placeOrderM.isPending ? <ActivityIndicator color={customerColors.white} /> : <Text style={styles.walletConfirmBtnText}>{t('customer.checkout.screen.modal.confirm')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ ORDER SUCCESS (46:40202) ═══ */}
      <Modal visible={showSuccessModal && !!order} transparent animationType="fade" onRequestClose={() => setShowSuccessModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.successModalCard} testID="order-success">
            <TouchableOpacity style={styles.modalCloseCircle} onPress={() => setShowSuccessModal(false)} activeOpacity={0.7} accessibilityLabel={t('customer.common.close')}>
              <ModalCloseCrossSvg size={13} color={customerColors.neutral.neutral900} />
            </TouchableOpacity>
            <ScrollView style={{ maxHeight: SCREEN_HEIGHT * 0.82 }} showsVerticalScrollIndicator={false}>
              <View style={styles.successLogoHeader}>
                <Image source={tohfaMarketLogo} style={styles.successLogoImage} resizeMode="contain" />
              </View>
              <View style={styles.dottedDivider} />
              <View style={styles.orderMetaBlock}>
                <View style={styles.orderMetaRow}>
                  <Text style={styles.orderMetaLabel}>{t('customer.checkout.screen.success.orderId')}</Text>
                  <Text style={styles.orderMetaValBold} testID="success-order-number">
                    {order?.orderNumber}
                  </Text>
                </View>
                <View style={styles.orderMetaRow}>
                  <Text style={styles.orderMetaLabel}>{t('customer.checkout.screen.success.orderDate')}</Text>
                  <Text style={styles.orderMetaValBold}>{formatPlacedAt(order?.placedAt)}</Text>
                </View>
                <View style={styles.orderMetaRow}>
                  <Text style={styles.orderMetaLabel}>{t('customer.checkout.screen.success.method')}</Text>
                  <Text style={styles.orderMetaValBold}>{order?.paymentMethodLabel ?? t('customer.checkout.screen.success.wallet')}</Text>
                </View>
                <View style={styles.orderMetaRow}>
                  <Text style={styles.orderMetaLabel}>{orderIsPickup ? t('customer.checkout.screen.success.pickupLocation') : t('customer.checkout.screen.success.delivery')}</Text>
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
                        {formatKg(it.qtyKg)} × {t('customer.product.detail.perKg', { price: formatRupees(it.unitPrice) })}
                      </Text>
                    </View>
                    <Text style={styles.orderItemPrice}>{formatRupees(it.lineTotal)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.dottedDivider} />

              <Text style={styles.orderProgressHeading}>{t('customer.checkout.screen.success.progress')}</Text>
              <View style={styles.progressTracker}>
                {[
                  { title: t('customer.checkout.screen.step.payment'), sub: t('customer.checkout.screen.step.paymentSub'), state: 'done' },
                  { title: t('customer.checkout.screen.step.confirmed'), sub: t('customer.checkout.screen.step.confirmedSub'), state: 'done' },
                  { title: t('customer.checkout.screen.step.preparing'), sub: t('customer.checkout.screen.step.preparingSub'), state: 'active' },
                  orderIsPickup
                    ? { title: t('customer.checkout.screen.step.ready'), sub: t('customer.checkout.screen.step.readySub'), state: 'todo' }
                    : { title: t('customer.checkout.screen.step.onTheWay'), sub: t('customer.checkout.screen.step.onTheWaySub'), state: 'todo' },
                  orderIsPickup
                    ? { title: t('customer.checkout.screen.step.collected'), sub: t('customer.checkout.screen.step.collectedSub'), state: 'todo' }
                    : { title: t('customer.checkout.screen.step.delivered'), sub: order?.otpRequired ? t('customer.checkout.screen.step.deliveredOtp') : t('customer.checkout.screen.step.deliveredSub'), state: 'todo' },
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
                            <Text style={styles.completedBadgeText}>{t('customer.checkout.screen.success.completed')}</Text>
                          </View>
                        )}
                        {step.state === 'active' && (
                          <View style={styles.inProgressBadge}>
                            <Text style={styles.inProgressBadgeText}>{t('customer.checkout.screen.success.inProgress')}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.trackerSubtitle}>{step.sub}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.totalPaidRow}>
                <Text style={styles.totalPaidLabel}>{t('customer.checkout.screen.success.totalPaid')}</Text>
                <Text style={styles.totalPaidAmount} testID="success-total">
                  {formatRupees(order?.totalAmount)}
                </Text>
              </View>
              <View style={styles.paidMethodBanner}>
                <WalletSvg />
                <Text style={styles.paidMethodText}>{t('customer.checkout.screen.success.paidVia', { method: order?.paymentMethodLabel ?? t('customer.checkout.screen.success.wallet') })}</Text>
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
                  <Text style={styles.checkPickupBtnText}>{t('customer.checkout.screen.success.checkPickup')}</Text>
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
                  <Text style={styles.checkPickupBtnText}>{t('customer.checkout.screen.success.viewOrder')}</Text>
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
            <TouchableOpacity style={styles.modalCloseCircle} onPress={() => setShowPickupModal(false)} activeOpacity={0.7} accessibilityLabel={t('customer.common.close')}>
              <ModalCloseCrossSvg size={13} color={customerColors.neutral.neutral900} />
            </TouchableOpacity>
            <View style={styles.successLogoHeader}>
              <Image source={tohfaMarketLogo} style={styles.successLogoImage} resizeMode="contain" />
            </View>
            <View style={styles.dottedDivider} />
            <View style={styles.qrCodeContainer}>
              <PickupQrCode payload={order?.pickupQr?.payload} size={190} />
            </View>
            <Text style={styles.orReadOutText}>{t('customer.checkout.screen.pickup.readOut')}</Text>
            <Text style={styles.pickupCodeNumber} testID="pickup-code">
              {order?.pickupCode}
            </Text>
            <View style={styles.pickupSummaryPill}>
              <View>
                <Text style={styles.pickupOrderIdText}>{order?.orderNumber}</Text>
                <Text style={styles.pickupItemsLocationText}>
                  {t('customer.cart.screen.itemMany', { count: order?.itemCount ?? (order?.items ?? []).length })}{orderPoint ? ` · ${orderPoint.name}` : ''}
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
              <Text style={styles.continueShoppingBtnText}>{t('customer.checkout.screen.success.viewOrder')}</Text>
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
              <Text style={styles.continueShoppingBtnText}>{t('customer.checkout.screen.pickup.continue')}</Text>
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
    backgroundColor: customerColors.palette.warm.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 16 : 14,
    paddingBottom: 12,
    backgroundColor: customerColors.white,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: customerColors.neutral.neutral900,
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
    backgroundColor: customerColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
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
    color: customerColors.neutral.neutral900,
  },
  homeBadge: {
    backgroundColor: customerColors.shared.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  homeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: customerColors.shared.success,
  },
  addressCardBody: {
    paddingLeft: 4,
  },
  addressLine: {
    fontSize: 12,
    color: customerColors.neutral.neutral700,
    lineHeight: 18,
  },
  addressPhone: {
    fontSize: 12,
    fontWeight: '600',
    color: customerColors.neutral.neutral900,
    marginTop: 4,
  },

  // ── 2. CART SUMMARY FLOATING DARK PILL ────────────────────────────────────
  darkCartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: customerColors.neutral.neutral800,
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
    backgroundColor: customerColors.white,
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
    color: customerColors.white,
  },
  darkCartViewLink: {
    fontSize: 11,
    color: customerColors.neutral.neutral400,
  },
  darkCartTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: customerColors.white,
  },

  // ── 3. PAYMENT METHOD CARD ────────────────────────────────────────────────
  paymentCard: {
    backgroundColor: customerColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    overflow: 'hidden',
    marginBottom: 16,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: customerColors.palette.amber.peachWash,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  paymentCardTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 15,
    color: customerColors.neutral.neutral900,
  },
  paymentList: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: customerColors.neutral.neutral50,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  methodRowSelected: {
    backgroundColor: customerColors.shared.primaryLight,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: customerColors.neutral.neutral900,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: customerColors.neutral.neutral500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: customerColors.primary,
  },
  radioInnerDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: customerColors.primary,
  },

  // ── EXPANDED SUB-SECTIONS ─────────────────────────────────────────────────
  subSectionBox: {
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    borderRadius: 8,
    padding: 12,
    marginTop: -4,
    marginBottom: 10,
    backgroundColor: customerColors.white,
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
    color: customerColors.neutral.neutral900,
  },
  autofillHint: {
    fontSize: 11,
    color: customerColors.shared.success,
    fontWeight: '600',
  },
  otherBankLink: {
    fontSize: 13,
    fontWeight: '700',
    color: customerColors.shared.success,
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
    backgroundColor: customerColors.shared.primaryLight,
  },
  upiIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: customerColors.neutral.neutral100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  otherUpiText: {
    fontSize: 10,
    fontWeight: '700',
    color: customerColors.neutral.neutral700,
  },
  paytmText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00BAF2',
  },
  upiAppLabel: {
    fontSize: 11,
    color: customerColors.neutral.neutral700,
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
    backgroundColor: customerColors.neutral.neutral50,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
  },
  popularBankCardSelected: {
    backgroundColor: customerColors.shared.primaryLight,
    borderColor: customerColors.shared.success,
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
    color: customerColors.neutral.neutral800,
  },

  // Other bank search & list (Image 1 & 5)
  otherBanksContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: customerColors.neutral.neutral100,
    paddingTop: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: customerColors.neutral.neutral100,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'android' ? 2 : 6,
    marginBottom: 10,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 13,
    color: customerColors.neutral.neutral900,
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
    borderBottomColor: customerColors.neutral.neutral50,
  },
  bankListItemRowSelected: {
    backgroundColor: customerColors.shared.primaryLight,
    borderRadius: 6,
  },
  bankInlineProceedBtn: {
    backgroundColor: customerColors.legacy.greenForest,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  bankInlineProceedBtnText: {
    color: customerColors.white,
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
    color: customerColors.neutral.neutral900,
    fontWeight: '500',
  },
  radioCircleSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: customerColors.neutral.neutral500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: customerColors.primary,
  },

  // Card details inputs (Image 2)
  cardInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: customerColors.neutral.neutral300,
    paddingBottom: 4,
    marginBottom: 12,
  },
  cardNumberInput: {
    flex: 1,
    fontSize: 13,
    color: customerColors.neutral.neutral900,
    paddingVertical: 2,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSmallInput: {
    borderBottomWidth: 1,
    borderBottomColor: customerColors.neutral.neutral300,
    fontSize: 13,
    color: customerColors.neutral.neutral900,
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
    color: customerColors.neutral.neutral900,
    marginBottom: 4,
  },
  policyText: {
    fontSize: 12,
    color: customerColors.neutral.neutral600,
    lineHeight: 18,
    marginBottom: 6,
  },
  readPolicyLink: {
    fontSize: 12,
    fontWeight: '600',
    color: customerColors.primary,
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
    backgroundColor: customerColors.overlay.white95,
    borderTopWidth: 1,
    borderTopColor: customerColors.neutral.neutral100,
  },
  bottomPillContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: customerColors.white,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    marginRight: 12,
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bottomPriceText: {
    fontSize: 16,
    fontWeight: '800',
    color: customerColors.neutral.neutral900,
  },
  proceedToPayBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  proceedToPayBtnActive: {
    backgroundColor: customerColors.primary,
  },
  proceedToPayBtnDisabled: {
    backgroundColor: customerColors.neutral.neutral400,
  },
  proceedToPayBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  proceedToPayBtnTextActive: {
    color: customerColors.white,
  },
  proceedToPayBtnTextDisabled: {
    color: customerColors.neutral.neutral500,
  },
  floatingCartCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: customerColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: customerColors.neutral.black,
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
    backgroundColor: customerColors.overlay.scrim55,
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
    backgroundColor: customerColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 100,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: customerColors.neutral.neutral800,
  },

  // ── 2ND SCREEN: PAY WITH WALLET STYLES ────────────────────────────────────
  walletModalCard: {
    width: '100%',
    backgroundColor: customerColors.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: customerColors.neutral.black,
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
    backgroundColor: customerColors.shared.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletModalTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 20,
    color: customerColors.neutral.neutral900,
  },
  walletOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: customerColors.shared.primaryLight,
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
    backgroundColor: customerColors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletOrderId: {
    fontSize: 11,
    color: customerColors.neutral.neutral700,
  },
  walletOrderLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: customerColors.neutral.neutral900,
  },
  walletOrderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: customerColors.neutral.neutral900,
  },
  walletSummaryCard: {
    backgroundColor: customerColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
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
    color: customerColors.neutral.neutral900,
  },
  walletBalanceVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: customerColors.shared.success,
  },
  walletDivider: {
    height: 1,
    backgroundColor: customerColors.neutral.neutral100,
    marginVertical: 8,
  },
  walletAmountLabel: {
    fontSize: 13,
    color: customerColors.neutral.neutral700,
  },
  walletAmountVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: customerColors.neutral.neutral900,
  },
  walletBalanceAfterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: customerColors.shared.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  walletBalanceAfterLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: customerColors.legacy.greenDeeper,
  },
  walletBalanceAfterVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: customerColors.legacy.greenDeeper,
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
    color: customerColors.neutral.neutral900,
  },
  walletOtpSubtitle: {
    fontSize: 11,
    color: customerColors.neutral.neutral600,
    lineHeight: 16,
    marginBottom: 10,
  },
  walletOtpInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'android' ? 4 : 8,
    backgroundColor: customerColors.white,
  },
  walletOtpInput: {
    flex: 1,
    fontSize: 14,
    color: customerColors.neutral.neutral900,
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
    borderColor: customerColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: customerColors.white,
  },
  walletCancelBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: customerColors.primary,
  },
  walletConfirmBtn: {
    flex: 1.3,
    height: 44,
    borderRadius: 22,
    backgroundColor: customerColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletConfirmBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: customerColors.white,
  },

  // ── 3RD SCREEN: ORDER SUCCESS MODAL STYLES ────────────────────────────────
  successModalCard: {
    width: '100%',
    backgroundColor: customerColors.white,
    borderRadius: 24,
    padding: 18,
    shadowColor: customerColors.neutral.black,
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
    color: customerColors.neutral.neutral600,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 10,
  },
  dottedDivider: {
    borderStyle: 'dashed',
    borderWidth: 0.8,
    borderColor: customerColors.neutral.neutral400,
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
    color: customerColors.neutral.neutral600,
  },
  orderMetaValBold: {
    fontSize: 12,
    fontWeight: '700',
    color: customerColors.neutral.neutral900,
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
    color: customerColors.neutral.neutral900,
  },
  orderItemSub: {
    fontSize: 11,
    color: customerColors.neutral.neutral600,
    marginTop: 1,
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: customerColors.neutral.neutral900,
  },
  orderProgressHeading: {
    fontFamily: customerFonts.editorial,
    fontSize: 15,
    color: customerColors.neutral.neutral900,
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
    color: customerColors.neutral.neutral900,
  },
  trackerLine: {
    width: 2,
    flex: 1,
    backgroundColor: customerColors.neutral.neutral300,
    marginTop: 4,
  },
  trackerLineActive: {
    backgroundColor: customerColors.shared.success,
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
    color: customerColors.neutral.neutral900,
  },
  trackerSubtitle: {
    fontSize: 10.5,
    color: customerColors.neutral.neutral600,
    marginTop: 2,
  },
  completedBadge: {
    backgroundColor: customerColors.legacy.greenTint,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: customerColors.legacy.greenDeep,
  },
  inProgressBadge: {
    backgroundColor: customerColors.palette.amber.paleTint,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  inProgressBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: customerColors.palette.amber.bronze,
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
    color: customerColors.neutral.neutral900,
  },
  totalPaidAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: customerColors.shared.success,
  },
  paidMethodBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: customerColors.shared.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  paidMethodText: {
    fontSize: 12,
    fontWeight: '600',
    color: customerColors.legacy.greenDeeper,
  },
  checkPickupBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: customerColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkPickupBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: customerColors.white,
  },

  // ── 4TH SCREEN: PICKUP CODE & QR MODAL STYLES ─────────────────────────────
  pickupModalCard: {
    width: '100%',
    backgroundColor: customerColors.white,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },
  qrCodeContainer: {
    marginVertical: 14,
    padding: 8,
    backgroundColor: customerColors.white,
    borderRadius: 12,
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  orReadOutText: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '600',
    color: customerColors.neutral.neutral600,
    marginTop: 4,
  },
  pickupCodeNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: customerColors.legacy.greenDeeper,
    letterSpacing: 1.5,
    marginVertical: 8,
  },
  pickupSummaryPill: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: customerColors.shared.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 12,
  },
  pickupOrderIdText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: customerColors.neutral.neutral900,
  },
  pickupItemsLocationText: {
    fontSize: 11,
    color: customerColors.neutral.neutral700,
    marginTop: 2,
  },
  pickupPriceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: customerColors.neutral.neutral900,
  },
  continueShoppingBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: customerColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  continueShoppingBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: customerColors.white,
  },
});
