/**
 * Checkout: wallet or Razorpay (UPI / card / net banking). See the
 * CheckoutScreen docblock below for the flow.
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
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, NetworkError } from '../../../shell/api/client';
import { t } from '../../../i18n/customer';
import { tohfaMarketLogo } from '../assets/images';
import { ProductImages } from '../assets/images/products';
import { ChooseBankModal, POPULAR_BANKS } from './ChooseBankModal';
import { ModalCloseCrossSvg } from './ProductModals';
import {
  customerFonts,
  customerColors,
} from '../theme';
import { cartQueryKeys, reReserveCart, useCart } from '../api/cart';
import {
  fetchOrder,
  isCheckoutInputComplete,
  isPickupFulfillment,
  orderIdempotencyKeys,
  useOrderQuote,
  type CheckoutInput,
  type Order,
  type PaymentMethod,
} from '../api/orders';
import { outcomeForOrder, useCancelPendingOrder, useOrderPayment, type OrderPaymentOutcome } from '../api/orderPayment';
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

const PhoneSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="2" width="14" height="20" rx="2" stroke={customerColors.neutral.neutral600} strokeWidth={1.8} />
    <Circle cx="12" cy="18" r="1" fill={customerColors.neutral.neutral600} />
  </Svg>
);

const CreditCardSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke={customerColors.neutral.neutral600} strokeWidth={1.8} />
    <Path d="M2 10h20" stroke={customerColors.neutral.neutral600} strokeWidth={1.8} />
    <Circle cx="6" cy="15" r="1" fill={customerColors.neutral.neutral600} />
    <Circle cx="10" cy="15" r="1" fill={customerColors.neutral.neutral600} />
  </Svg>
);

const CashSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="6" width="20" height="12" rx="2" stroke={customerColors.neutral.neutral600} strokeWidth={1.8} />
    <Circle cx="12" cy="12" r="3" stroke={customerColors.neutral.neutral600} strokeWidth={1.8} />
    <Path d="M6 12h.01M18 12h.01" stroke={customerColors.neutral.neutral600} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const BankSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M3 21h18M3 10h18M4 10V21M8 10V21M12 10V21M16 10V21M20 10V21M12 3L2 8h20L12 3z" stroke={customerColors.neutral.neutral600} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const WalletSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M20 12V8H6a2 2 0 01-2-2V4a2 2 0 012-2h14v6" stroke={customerColors.neutral.neutral600} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 6v14a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2z" stroke={customerColors.neutral.neutral600} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="16" cy="14" r="1.5" fill={customerColors.neutral.neutral600} />
  </Svg>
);

const WalletGreenSvg = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 12V8H6a2 2 0 01-2-2V4a2 2 0 012-2h14v6" stroke="#15803D" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 6v14a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2z" stroke="#15803D" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="16" cy="14" r="1.5" fill="#15803D" />
  </Svg>
);

const CartSmallGreenSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
      stroke="#15803D"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="9" cy="21" r="1.5" fill="#15803D" />
    <Circle cx="18" cy="21" r="1.5" fill="#15803D" />
  </Svg>
);

const OtherUpiIcon = () => (
  <View style={styles.upiIconCircle}>
    <Text style={styles.otherUpiText}>UPI</Text>
  </View>
);

const GPayIcon = () => (
  <View style={styles.upiIconCircle}>
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#FFFFFF" />
      <Path d="M17.5 12.2c0-.4-.04-.8-.1-1.2H12v2.3h3.1c-.13.7-.54 1.4-1.14 1.8v1.5h1.84c1.08-1 1.7-2.5 1.7-4.4z" fill="#4285F4" />
      <Path d="M12 17.8c1.57 0 2.88-.52 3.84-1.4l-1.84-1.5c-.52.35-1.18.55-2 .55-1.53 0-2.83-1.03-3.3-2.42H6.8v1.5c1 1.98 3.03 3.27 5.2 3.27z" fill="#34A853" />
      <Path d="M8.7 13.03c-.12-.35-.19-.73-.19-1.12 0-.39.07-.77.19-1.12V9.29H6.8c-.42.84-.66 1.79-.66 2.8 0 1.01.24 1.96.66 2.8l1.9-1.86z" fill="#FBBC05" />
      <Path d="M12 6.18c.85 0 1.62.3 2.22.86l1.66-1.66C14.88 4.45 13.57 4 12 4 9.83 4 7.8 5.29 6.8 7.27l1.9 1.48c.47-1.39 1.77-2.42 3.3-2.42z" fill="#EA4335" />
    </Svg>
  </View>
);

const BhimIcon = () => (
  <View style={styles.upiIconCircle}>
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M12 2L4 12l8 10 8-10L12 2z" fill="#FF9933" />
      <Path d="M12 2L4 12h16L12 2z" fill="#138808" />
      <Circle cx="12" cy="12" r="3" fill="#000080" />
    </Svg>
  </View>
);

const PaytmIcon = () => (
  <View style={styles.upiIconCircle}>
    <Text style={styles.paytmText}>paytm</Text>
  </View>
);

const RadioCircle = ({ selected }: { selected: boolean }) => (
  <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
    {selected && <View style={styles.radioInnerDot} />}
  </View>
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

/** Resolved at render time (not module load) so it follows the active locale. */
const SLOT_KEYS = {
  MORNING_8_12: 'customer.checkout.slot.MORNING_8_12',
  AFTERNOON_12_4: 'customer.checkout.slot.AFTERNOON_12_4',
  EVENING_4_8: 'customer.checkout.slot.EVENING_4_8',
} as const;

function slotLabel(slot: string): string {
  const key = SLOT_KEYS[slot as keyof typeof SLOT_KEYS];
  return key ? t(key) : '';
}

function formatPlacedAt(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
}

/** UI method -> docs/openapi.yaml `CheckoutRequest.paymentMethod`. */
const METHOD_TO_API: Record<UiPaymentMethod, PaymentMethod> = {
  upi: 'UPI',
  card: 'CARD',
  netbanking: 'NETBANKING',
  wallets: 'WALLET',
  cod: 'CASH',
};
type UiPaymentMethod = 'upi' | 'card' | 'cod' | 'netbanking' | 'wallets';

/** What the payment notice under the method list says about the server order. */
type PaymentNotice =
  | { kind: 'pending'; order: Order }
  | { kind: 'retryable'; order: Order; message: string }
  | { kind: 'closed'; message: string };

function methodLabel(order: Order | null): string {
  if (order?.paymentMethodLabel) return order.paymentMethodLabel;
  switch (order?.paymentMethod) {
    case 'UPI':
      return t('customer.checkout.screen.method.upi');
    case 'CARD':
      return t('customer.checkout.screen.method.card');
    case 'NETBANKING':
      return t('customer.checkout.screen.method.netbanking');
    default:
      return t('customer.checkout.screen.success.wallet');
  }
}

/**
 * Pay & checkout (Figma 46:38924, wallet popup 46:40084, success 46:40202,
 * pickup code 46:40610). BR-17 as amended 2026-11-20, BR-220..224.
 *  - Methods: Wallet (confirmed at once), UPI / card / net banking (Razorpay
 *    sheet; card, UPI and bank details are collected by Razorpay, never in-app).
 *    Cash on delivery/shop is shown but disabled (server: PAYMENT_METHOD_DISABLED).
 *  - Totals: POST /orders/quote on entry and whenever the draft changes; the
 *    shown total is `quote.totalAmount`, the same pricing path as checkout.
 *  - Place: POST /orders with ONE Idempotency-Key per attempt (same payload incl.
 *    method -> same key, so a retry after a timeout or a top-up can never
 *    double-debit). Gateway orders start PENDING_PAYMENT; see api/orderPayment.
 *  - Success modal ONLY for a server order whose status is CONFIRMED (BR-224).
 *    Sheet closed / failed -> Retry payment (same gatewayOrderId) or Cancel
 *    order; not settled in time -> "Confirming your payment".
 *  - Errors: 402 WALLET_INSUFFICIENT -> shortfall + Add money (Topup); 409
 *    STOCK_UNAVAILABLE / INSUFFICIENT_ALLOCATION -> back to cart; CART_LOCK_EXPIRED
 *    -> re-reserve + re-quote; SLOT_FULL -> back to the slot picker;
 *    422 PAYMENT_METHOD_DISABLED -> pick another method; 501 -> pickup only.
 */
export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ onNavigate, onGoBack }) => {
  const qc = useQueryClient();
  const { draft } = useCheckoutDraftState();

  /** The CONFIRMED order (drives the success / pickup modals). */
  const [order, setOrder] = useState<Order | null>(null);
  /** Server state of a gateway order that is not confirmed (yet). */
  const [paymentNotice, setPaymentNotice] = useState<PaymentNotice | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [shortfall, setShortfall] = useState<string | null>(null);
  const [networkRetry, setNetworkRetry] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<UiPaymentMethod | null>(null);
  // UPI app / bank choices are hints only: Razorpay's sheet is where the customer actually picks.
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>('GPay');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [showChooseBankModal, setShowChooseBankModal] = useState(false);
  const [userTappedWallet, setUserTappedWallet] = useState(false);

  const input = draftToInput(draft);
  const isHomeDelivery = draft?.fulfillmentType === 'HOME_DELIVERY';

  // Once an order exists server-side, the cart is converted: stop quoting it.
  const quoteQuery = useOrderQuote(order || paymentNotice ? null : input);
  const quote = quoteQuery.data;
  const wallet = useWalletBalance();
  const cartQuery = useCart();
  const addressesQuery = useAddresses(isHomeDelivery);
  const pickupQuery = usePickupPoints();
  const paymentM = useOrderPayment();
  const cancelM = useCancelPendingOrder();
  const busy = paymentM.isPending || cancelM.isPending;

  const isPickup = draft?.fulfillmentType === 'WAREHOUSE_PICKUP';
  const address = addressesQuery.data?.find((a) => a.id === draft?.deliveryAddressId);
  const point = pickupQuery.data?.find((p) => p.id === draft?.warehouseId);
  const quoteShortfall = quote && !quote.walletSufficient ? quote.shortfall : null;
  const effectiveShortfall = shortfall ?? quoteShortfall;
  const balanceLabel = quote ? formatRupees(quote.walletBalance) : wallet.label;
  const noticeOrder = paymentNotice && paymentNotice.kind !== 'closed' ? paymentNotice.order : null;
  const total = quote?.totalAmount ?? noticeOrder?.totalAmount ?? null;
  const ready = !!quote && !quote.lockExpired && !busy && paymentNotice === null;
  const isProceedActive =
    ready && selectedMethod !== null && selectedMethod !== 'cod' && !(selectedMethod === 'wallets' && effectiveShortfall && !userTappedWallet);

  useEffect(() => {
    if (effectiveShortfall && selectedMethod === null) {
      setSelectedMethod('wallets');
    }
  }, [effectiveShortfall]);

  const handleProceedPress = () => {
    if (!isProceedActive) return;
    if (selectedMethod === 'wallets') {
      setShowWalletModal(true);
      return;
    }
    void handleConfirmPayment();
  };

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
    // Cash on delivery/shop is switched off server-side (BR-223): never a 501 "no home delivery".
    if (code === 'PAYMENT_METHOD_DISABLED') {
      setShowWalletModal(false);
      setSelectedMethod(null);
      setErrorText(t('customer.checkout.screen.err.methodDisabled'));
      return;
    }
    if (code === 'PAYMENT_GATEWAY_UNAVAILABLE') {
      setShowWalletModal(false);
      setErrorText(t('customer.checkout.screen.err.gatewayUnavailable'));
      return;
    }
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

  /** Map a payment outcome to UI. Only a server-CONFIRMED order opens the success modal (BR-224). */
  const applyOutcome = (outcome: OrderPaymentOutcome) => {
    setShowWalletModal(false);
    switch (outcome.status) {
      case 'confirmed':
        if (outcome.order.status !== 'CONFIRMED') return;
        setPaymentNotice(null);
        setOrder(outcome.order);
        setShowSuccessModal(true);
        return;
      case 'pending':
        setPaymentNotice({ kind: 'pending', order: outcome.order });
        return;
      case 'cancelled':
        setPaymentNotice({ kind: 'retryable', order: outcome.order, message: t('customer.checkout.screen.pay.cancelled') });
        return;
      case 'failed':
        setPaymentNotice({
          kind: 'retryable',
          order: outcome.order,
          message:
            outcome.reason === 'unavailable'
              ? t('customer.checkout.screen.pay.unavailable')
              : outcome.reason === 'verification'
                ? t('customer.checkout.screen.pay.verifyFailed')
                : t('customer.checkout.screen.pay.failed'),
        });
        return;
      case 'expired':
        setPaymentNotice({ kind: 'closed', message: t('customer.checkout.screen.pay.expired') });
        return;
    }
  };

  const handleConfirmPayment = async () => {
    if (!input || !isCheckoutInputComplete(input) || busy || selectedMethod === null) return;
    const paymentMethod = METHOD_TO_API[selectedMethod];
    if (paymentMethod === 'CASH') {
      setErrorText(t('customer.checkout.screen.err.methodDisabled'));
      return;
    }
    const checkout: CheckoutInput = { ...input, paymentMethod };
    setErrorText(null);
    setNetworkRetry(false);
    try {
      applyOutcome(await paymentM.mutateAsync({ checkout, merchantName: 'TOHFA' }));
    } catch (err) {
      await handleError(err, checkout);
    }
  };

  /** Reopen the Razorpay sheet for the same server order / gatewayOrderId. */
  const handleRetryPayment = async () => {
    if (paymentNotice?.kind !== 'retryable' || busy) return;
    setErrorText(null);
    try {
      applyOutcome(await paymentM.mutateAsync({ retry: paymentNotice.order, merchantName: 'TOHFA' }));
    } catch (err) {
      setErrorText(mapProblem(err).message);
    }
  };

  /** POST /orders/{id}/cancel; the server confirms instead if the payment was in fact captured. */
  const handleCancelOrder = async () => {
    if (paymentNotice?.kind !== 'retryable' || busy) return;
    setErrorText(null);
    try {
      const res = await cancelM.mutateAsync(paymentNotice.order.id);
      const out = outcomeForOrder(res);
      if (out?.status === 'confirmed') applyOutcome(out);
      else setPaymentNotice({ kind: 'closed', message: t('customer.checkout.screen.pay.orderCancelled') });
    } catch (err) {
      const code = err instanceof ApiError ? (err.code as string) : '';
      if (code === 'ORDER_NOT_AWAITING_PAYMENT') {
        await handleCheckStatus(paymentNotice.order);
        return;
      }
      setErrorText(mapProblem(err).message);
    }
  };

  /** Re-read GET /orders/{id}; never assumes success client-side. */
  const handleCheckStatus = async (pendingOrder: Order) => {
    try {
      const fresh = await fetchOrder(pendingOrder.id);
      const out = outcomeForOrder(fresh);
      if (out === null) {
        if (paymentNotice?.kind !== 'retryable') setPaymentNotice({ kind: 'pending', order: fresh });
        return;
      }
      applyOutcome(out);
    } catch (err) {
      setErrorText(mapProblem(err).message);
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
                    {draft.deliveryDate} · {draft.deliverySlot ? slotLabel(draft.deliverySlot) : ''}
                  </Text>
                )}
              </>
            )}
          </View>
        </View>

        {/* ── 2. CART SUMMARY FLOATING DARK PILL ────────────────────────────── */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => (onGoBack ? onGoBack() : onNavigate?.('Cart'))} style={styles.darkCartPill}>
          <View style={styles.darkCartLeft}>
            <View style={styles.cartThumbnailCircle}>
              <Image source={ProductImages.exoticCherryTomato} style={styles.cartThumbnailImage} resizeMode="contain" />
            </View>
            <View style={styles.darkCartTexts}>
              <Text style={styles.darkCartTitle}>{quote ? t(quote.itemCount === 1 ? 'customer.checkout.screen.cartItem' : 'customer.checkout.screen.cartItems', { count: quote.itemCount }) : t('customer.checkout.screen.yourCart')}</Text>
              <Text style={styles.darkCartViewLink}>{t('customer.checkout.screen.viewCart')}</Text>
            </View>
          </View>
          <Text style={styles.darkCartTotal}>{formatRupees(total ?? quote?.subtotal)}</Text>
        </TouchableOpacity>

        {/* ── 3. PAYMENT METHOD (Screen 44) ─────────────────────────────────── */}
        <View style={styles.paymentCard}>
          <View style={styles.paymentCardHeader}>
            <CardHeaderSvg />
            <Text style={styles.paymentCardTitle}>{t('customer.checkout.screen.paymentMethod')}</Text>
          </View>
          <View style={styles.paymentList}>
            {/* OPTION 1: UPI */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedMethod('upi');
                setUserTappedWallet(false);
              }}
              style={[styles.methodRow, selectedMethod === 'upi' && styles.methodRowSelected]}
              testID="upi-method"
            >
              <View style={styles.methodLeft}>
                <PhoneSvg />
                <Text style={styles.methodLabel}>{t('customer.checkout.screen.method.upi')}</Text>
              </View>
              <RadioCircle selected={selectedMethod === 'upi'} />
            </TouchableOpacity>

            {selectedMethod === 'upi' && (
              <View style={styles.subSectionBox}>
                <Text style={[styles.subSectionTitle, { marginBottom: 12 }]}>{t('customer.checkout.upi.apps')}</Text>
                <View style={styles.upiAppsRow}>
                  <TouchableOpacity
                    style={[styles.upiAppBtn, selectedUpiApp === 'Other' && styles.upiAppBtnSelected]}
                    onPress={() => setSelectedUpiApp('Other')}
                    activeOpacity={0.8}
                  >
                    <OtherUpiIcon />
                    <Text style={styles.upiAppLabel}>{t('customer.checkout.upi.other')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.upiAppBtn, selectedUpiApp === 'GPay' && styles.upiAppBtnSelected]}
                    onPress={() => setSelectedUpiApp('GPay')}
                    activeOpacity={0.8}
                  >
                    <GPayIcon />
                    <Text style={styles.upiAppLabel}>{t('customer.checkout.upi.gpay')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.upiAppBtn, selectedUpiApp === 'BHIM' && styles.upiAppBtnSelected]}
                    onPress={() => setSelectedUpiApp('BHIM')}
                    activeOpacity={0.8}
                  >
                    <BhimIcon />
                    <Text style={styles.upiAppLabel}>{t('customer.checkout.upi.bhim')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.upiAppBtn, selectedUpiApp === 'Paytm' && styles.upiAppBtnSelected]}
                    onPress={() => setSelectedUpiApp('Paytm')}
                    activeOpacity={0.8}
                  >
                    <PaytmIcon />
                    <Text style={styles.upiAppLabel}>{t('customer.checkout.upi.paytm')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* OPTION 2: Credit/Debit Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedMethod('card');
                setUserTappedWallet(false);
              }}
              style={[styles.methodRow, selectedMethod === 'card' && styles.methodRowSelected]}
              testID="card-method"
            >
              <View style={styles.methodLeft}>
                <CreditCardSvg />
                <Text style={styles.methodLabel}>{t('customer.checkout.screen.method.card')}</Text>
              </View>
              <RadioCircle selected={selectedMethod === 'card'} />
            </TouchableOpacity>

            {selectedMethod === 'card' && (
              // PCI: card number / expiry / CVV are entered in Razorpay's sheet, never in this app.
              <View style={styles.subSectionBox} testID="card-hint">
                <Text style={styles.paymentHintText}>{t('customer.checkout.screen.card.hint')}</Text>
              </View>
            )}

            {/* OPTION 3: Cash on Delivery or Shop (disabled until the owner enables it, BR-223) */}
            <TouchableOpacity
              activeOpacity={1}
              disabled
              accessibilityState={{ disabled: true }}
              style={[styles.methodRow, styles.methodRowDisabled]}
              testID="cod-method"
            >
              <View style={styles.methodLeft}>
                <CashSvg />
                <Text style={styles.methodLabel}>{t('customer.checkout.screen.method.cod')}</Text>
              </View>
              <Text style={styles.methodUnavailableText}>{t('customer.checkout.screen.method.codUnavailable')}</Text>
            </TouchableOpacity>

            {/* OPTION 4: Net banking */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedMethod('netbanking');
                setUserTappedWallet(false);
              }}
              style={[styles.methodRow, selectedMethod === 'netbanking' && styles.methodRowSelected]}
              testID="netbanking-method"
            >
              <View style={styles.methodLeft}>
                <BankSvg />
                <Text style={styles.methodLabel}>{t('customer.checkout.screen.method.netbanking')}</Text>
              </View>
              <RadioCircle selected={selectedMethod === 'netbanking'} />
            </TouchableOpacity>

            {selectedMethod === 'netbanking' && (
              <View style={styles.subSectionBox}>
                <View style={styles.subSectionHeaderRow}>
                  <Text style={styles.subSectionTitle}>{t('customer.checkout.netbanking.title')}</Text>
                  <TouchableOpacity
                    onPress={() => setShowChooseBankModal(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.otherBankLink}>{t('customer.checkout.netbanking.otherBank')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.popularBanksRow}>
                  {POPULAR_BANKS.map((b) => {
                    const isSelected = selectedBank === b.name || selectedBank === b.shortName;
                    return (
                      <TouchableOpacity
                        key={b.id}
                        style={[styles.popularBankCard, isSelected && styles.popularBankCardSelected]}
                        onPress={() => setSelectedBank(b.name)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.bankLogoCircle}>
                          {b.renderLogo(26)}
                        </View>
                        <Text style={styles.popularBankName}>{b.shortName}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* OPTION 5: Wallets */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedMethod('wallets');
                setUserTappedWallet(true);
              }}
              style={[styles.methodRow, selectedMethod === 'wallets' && styles.methodRowSelected]}
              testID="wallet-method"
            >
              <View style={styles.methodLeft}>
                <WalletSvg />
                <Text style={styles.methodLabel}>{t('customer.checkout.screen.method.wallets')}</Text>
              </View>
              <RadioCircle selected={selectedMethod === 'wallets'} />
            </TouchableOpacity>

            {/* Shortfall banner if Wallets is selected and balance is low */}
            {selectedMethod === 'wallets' && !!effectiveShortfall && (
              <View style={styles.walletBalanceAfterBanner} testID="checkout-shortfall">
                <Text style={styles.walletBalanceAfterLabel}>
                  {t('customer.checkout.screen.shortBy', { amount: formatRupees(effectiveShortfall) })}
                </Text>
                <TouchableOpacity onPress={goTopup} testID="checkout-add-money" style={styles.walletShortfallBtn} activeOpacity={0.85}>
                  <Text style={styles.walletShortfallBtnText}>{t('customer.checkout.screen.addMoney')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {paymentNotice && (
          <View style={styles.policyContainer} testID={`checkout-payment-${paymentNotice.kind}`}>
            {paymentNotice.kind === 'pending' && (
              <>
                <Text style={styles.policyTitle}>{t('customer.checkout.screen.pay.confirming')}</Text>
                <Text style={styles.policyText}>{t('customer.checkout.screen.pay.pendingBody')}</Text>
                <TouchableOpacity onPress={() => void handleCheckStatus(paymentNotice.order)} disabled={busy} testID="checkout-check-status">
                  <Text style={styles.readPolicyLink}>{t('customer.checkout.screen.pay.checkStatus')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    checkoutDraftStore.setDraft(null);
                    onNavigate?.('OrderTracking', { orderId: paymentNotice.order.id });
                  }}
                  testID="checkout-view-pending-order"
                >
                  <Text style={styles.readPolicyLink}>{t('customer.checkout.screen.success.viewOrder')}</Text>
                </TouchableOpacity>
              </>
            )}
            {paymentNotice.kind === 'retryable' && (
              <>
                <Text style={styles.policyText}>{paymentNotice.message}</Text>
                {busy ? (
                  <ActivityIndicator color={customerColors.shared.success} />
                ) : (
                  <>
                    <TouchableOpacity onPress={() => void handleRetryPayment()} testID="checkout-retry-payment">
                      <Text style={styles.readPolicyLink}>{t('customer.checkout.screen.retryPayment')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => void handleCancelOrder()} testID="checkout-cancel-order">
                      <Text style={styles.readPolicyLink}>{t('customer.checkout.screen.pay.cancelOrder')}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
            {paymentNotice.kind === 'closed' && (
              <>
                <Text style={styles.policyText}>{paymentNotice.message}</Text>
                <TouchableOpacity onPress={() => backToCart(null)} testID="checkout-back-to-cart">
                  <Text style={styles.readPolicyLink}>{t('customer.checkout.screen.goToCart')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

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
          {selectedMethod === 'wallets' && effectiveShortfall && !userTappedWallet ? (
            <TouchableOpacity activeOpacity={0.85} onPress={goTopup} style={[styles.proceedToPayBtn, styles.proceedToPayBtnActive]} testID="checkout-topup-cta">
              <Text style={[styles.proceedToPayBtnText, styles.proceedToPayBtnTextActive]}>{t('customer.checkout.screen.addMoney')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={isProceedActive ? 0.85 : 1}
              onPress={handleProceedPress}
              disabled={!isProceedActive}
              style={[styles.proceedToPayBtn, isProceedActive ? styles.proceedToPayBtnActive : styles.proceedToPayBtnDisabled]}
              testID="checkout-proceed"
            >
              <Text style={[styles.proceedToPayBtnText, isProceedActive ? styles.proceedToPayBtnTextActive : styles.proceedToPayBtnTextDisabled]}>
                {t('customer.checkout.screen.proceed')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.floatingCartCircle} onPress={() => (onGoBack ? onGoBack() : onNavigate?.('Cart'))} activeOpacity={0.85}>
          <CartFloatingSvg />
        </TouchableOpacity>
      </View>

      {/* ═══ PAY WITH WALLET POPUP (Screen 50b · Wallet pay popup) ═══ */}
      <Modal visible={showWalletModal} transparent animationType="fade" onRequestClose={() => setShowWalletModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.walletModalCard}>
            <TouchableOpacity style={styles.modalCloseCircle} onPress={() => setShowWalletModal(false)} activeOpacity={0.7} accessibilityLabel={t('customer.common.close')}>
              <ModalCloseCrossSvg size={13} color={customerColors.neutral.neutral900} />
            </TouchableOpacity>

            {/* Header: Pay with Wallet */}
            <View style={styles.walletHeaderRow}>
              <WalletGreenSvg size={22} />
              <Text style={styles.walletModalTitle}>{t('customer.checkout.screen.modal.title')}</Text>
            </View>

            {/* Top Green Box: Order ID & Amount */}
            <View style={styles.walletOrderBanner}>
              <View style={styles.walletOrderBannerLeft}>
                <View style={styles.walletOrderCartIcon}>
                  <CartSmallGreenSvg />
                </View>
                <View>
                  <Text style={styles.walletOrderId}>
                    {t('customer.checkout.wallet.orderId', { id: order?.orderNumber ? order.orderNumber.replace(/[^0-9]/g, '').slice(-6) : (quote?.cartId ? quote.cartId.slice(-6).toUpperCase() : '123456') })}
                  </Text>
                  <Text style={styles.walletOrderLabel}>{t('customer.checkout.wallet.orderPayment')}</Text>
                </View>
              </View>
              <Text style={styles.walletOrderPrice}>{formatRupees(total)}</Text>
            </View>

            {/* Summary Card */}
            <View style={styles.walletSummaryCard}>
              <View style={styles.walletBalanceRow}>
                <View style={styles.walletBalanceLeft}>
                  <WalletGreenSvg size={18} />
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
              <View style={styles.walletModalBalanceAfterBanner}>
                <Text style={styles.walletModalBalanceAfterLabel}>{t('customer.checkout.screen.modal.after')}</Text>
                <Text style={styles.walletModalBalanceAfterVal}>
                  {quote
                    ? formatRupees(subtractMoney(quote.walletBalance, quote.totalAmount))
                    : formatRupees('1220.00')}
                </Text>
              </View>
            </View>

            {!!errorText && (
              <Text style={styles.walletOrderLabel} testID="wallet-modal-error">
                {errorText}
              </Text>
            )}

            {/* Action Buttons */}
            <View style={styles.walletActionRow}>
              <TouchableOpacity style={styles.walletCancelBtn} onPress={() => setShowWalletModal(false)} activeOpacity={0.7}>
                <Text style={styles.walletCancelBtnText}>{t('customer.common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.walletConfirmBtn}
                onPress={() => void handleConfirmPayment()}
                disabled={busy}
                activeOpacity={0.85}
                testID="wallet-confirm"
              >
                {busy ? <ActivityIndicator color={customerColors.white} /> : <Text style={styles.walletConfirmBtnText}>{t('customer.checkout.screen.modal.confirm')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ ORDER SUCCESS (46:40202) ═══ */}
      <Modal visible={showSuccessModal && order?.status === 'CONFIRMED'} transparent animationType="fade" onRequestClose={() => setShowSuccessModal(false)}>
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
                  <Text style={styles.orderMetaValBold}>{methodLabel(order)}</Text>
                </View>
                <View style={styles.orderMetaRow}>
                  <Text style={styles.orderMetaLabel}>{orderIsPickup ? t('customer.checkout.screen.success.pickupLocation') : t('customer.checkout.screen.success.delivery')}</Text>
                  <Text style={styles.orderMetaValBold}>
                    {orderIsPickup ? (orderPoint?.name ?? '') : `${order?.deliveryDate ?? ''} ${order?.deliverySlot ? slotLabel(order.deliverySlot) : ''}`}
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
                  { title: t('customer.checkout.screen.step.payment'), sub: !order?.paymentMethod || order.paymentMethod === 'WALLET' ? t('customer.checkout.screen.step.paymentSub') : t('customer.checkout.screen.step.paymentSubOnline'), state: 'done' },
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
                <Text style={styles.paidMethodText}>{t('customer.checkout.screen.success.paidVia', { method: methodLabel(order) })}</Text>
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

      {/* ═══ CHOOSE BANK MODAL (Screen 51) ═══ */}
      <ChooseBankModal
        visible={showChooseBankModal}
        selectedBank={selectedBank}
        onSelectBank={(b) => setSelectedBank(b)}
        onProceed={(b) => {
          setSelectedBank(b);
          setShowChooseBankModal(false);
          handleProceedPress();
        }}
        onClose={() => setShowChooseBankModal(false)}
      />
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    padding: 16,
    marginBottom: 16,
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: customerColors.palette.amber.peachWash,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2E8E1', // TODO: extract to design token
  },
  paymentCardTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 16,
    fontWeight: '600',
    color: customerColors.neutral.neutral900,
  },
  paymentList: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: customerColors.neutral.neutral50,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  methodRowSelected: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
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

  // Card: details are entered in Razorpay's sheet (PCI), only a hint here.
  paymentHintText: {
    fontSize: 12,
    lineHeight: 18,
    color: customerColors.neutral.neutral700,
  },
  // Cash on delivery/shop: visible but not selectable (BR-223).
  methodRowDisabled: {
    opacity: 0.55,
  },
  methodUnavailableText: {
    fontSize: 11,
    fontWeight: '600',
    color: customerColors.neutral.neutral600,
  },

  // ── 4. RETURN / REFUND POLICY ─────────────────────────────────────────────
  policyContainer: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginBottom: 20,
  },
  policyTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 16,
    color: customerColors.neutral.neutral900,
    marginBottom: 4,
  },
  policyText: {
    fontSize: 12.5,
    color: customerColors.neutral.neutral600,
    lineHeight: 18,
    marginBottom: 6,
  },
  readPolicyLink: {
    fontSize: 13,
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
    backgroundColor: '#D1D5DB',
  },
  proceedToPayBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  proceedToPayBtnTextActive: {
    color: customerColors.white,
  },
  proceedToPayBtnTextDisabled: {
    color: customerColors.white,
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
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 14,
    marginTop: 4,
  },
  walletBalanceAfterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: customerColors.legacy.greenDeeper,
    flexShrink: 1,
  },
  walletBalanceAfterVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: customerColors.legacy.greenDeeper,
  },
  walletModalBalanceAfterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EAF7EE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 8,
  },
  walletModalBalanceAfterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  walletModalBalanceAfterVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
  },
  walletShortfallBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: customerColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  walletShortfallBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: customerColors.white,
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    marginBottom: 4,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: customerColors.neutral.neutral900,
  },
  orderItemSub: {
    fontSize: 12.5,
    color: customerColors.neutral.neutral600,
    marginTop: 2,
  },
  orderItemPrice: {
    fontSize: 13.5,
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
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: customerColors.neutral.neutral300,
    marginBottom: 4,
  },
  totalPaidLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: customerColors.neutral.neutral900,
  },
  totalPaidAmount: {
    fontSize: 21,
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
